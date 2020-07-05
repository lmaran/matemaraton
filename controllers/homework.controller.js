const courseService = require("../services/course.service");
const personService = require("../services/person.service");
const classService = require("../services/class.service");
const homeworkService = require("../services/homework.service");
// const dateTimeHelper = require("../helpers/date-time.helper");
const arrayHelper = require("../helpers/array.helper");
const studentHelper = require("../helpers/student.helper");
const studentsAndClassesService = require("../services/studentsAndClasses.service");
const dateTimeHelper = require("../helpers/date-time.helper");

exports.getHomeworkSubmissionsPerStudent = async (req, res) => {
    const studentId = req.params.studentId;
    let academicYear = "201920";

    let student = null;
    let classMapByStudent = null;
    let cls = null;
    let homeworkRequests = null;

    [student, classMapByStudent] = await Promise.all([
        await personService.getPersonById(studentId),
        await studentsAndClassesService.getClassMapByStudentId(academicYear, studentId)
    ]);

    if (classMapByStudent) {
        // cls = await classService.getClassById(classMapByStudent.classId);
        [cls, homeworkRequests] = await Promise.all([
            await classService.getClassById(classMapByStudent.classId),
            await homeworkService.getHomeworRequestsByClassId(classMapByStudent.classId)
        ]);
    }

    if (!cls && student.academicYearRelatedInfo) {
        // maybe a graduated student
        const academicYears = Object.keys(student.academicYearRelatedInfo);
        // overwrite the existing class and academicYear
        if (academicYears.length > 0) {
            academicYear = academicYears.sort()[0];
            classMapByStudent = await studentsAndClassesService.getClassMapByStudentId(academicYear, studentId);
            cls = await classService.getClassById(classMapByStudent.classId);
        }
    }

    if (homeworkRequests) {
        homeworkRequests.forEach(homeworkRequest => {
            const submission = homeworkRequest.submissions.find(x => x.studentId === studentId);
            homeworkRequest.totalSubmittedQuestions = (submission && submission.totalSubmittedQuestions) || 0;
        });
    }

    const today = dateTimeHelper.getFriendlyDate(new Date()).ymd; // 2020-02-17
    // const closedRequests = homeworkRequests.filter(x => x.dueDate < today) || [];

    let totalQuestions = 0;
    let totalUserSubmittedQuestions = 0;
    if (homeworkRequests) {
        homeworkRequests.forEach(x => {
            const userSubmission = x.submissions.find(x => x.studentId === studentId);
            x.userSubmittedQuestions = (userSubmission && userSubmission.totalSubmittedQuestions) || 0;
            totalUserSubmittedQuestions += x.userSubmittedQuestions;
            totalQuestions += x.totalRequestedQuestions;
            x.dueDateAsString = dateTimeHelper.getStringFromStringNoDay(x.dueDate);

            // totalQuestions += x.totalRequestedQuestions;
            // (x.submissions || []).forEach(submission => {
            //     // const studentCrt = studentsObj[submission.studentId];
            //     const studentCrt = students.find(x => x._id.toString() === submission.studentId);
            //     studentCrt.totalSubmittedQuestions =
            //         (studentCrt.totalSubmittedQuestions || 0) + submission.totalSubmittedQuestions;
            // });
        });
    }

    const totalUserSubmittedQuestionsAsPercent = totalQuestions
        ? Math.round((totalUserSubmittedQuestions * 100) / totalQuestions)
        : 0;

    // console.log(homeworkRequests);

    // const classIdsPerIntervals = getClassIdsPerIntervals(classMapByStudent);

    // let allClassIdsForStudent = classIdsPerIntervals.map(x => x.classId);
    // allClassIdsForStudent = [...new Set(allClassIdsForStudent)]; // remove duplicates (if exists)

    // const allCoursesForStudent = await courseService.getCoursesByClassIds(allClassIdsForStudent);

    // const coursesDateByDate = getCoursesDateByDate(classIdsPerIntervals, allCoursesForStudent);

    // const presencesPerStudent = getPresencesPerStudent(coursesDateByDate, studentId, coursesWithPresence, cls._id);

    // add "shortName" (e.g.  "Vali M.")
    student.shortName = studentHelper.getShortNameForStudent(student);
    // add "gradeAndLetter" (e.g.  "8A")
    student.gradeAndLetter = studentHelper.getGradeAndLetterForStudent(student, academicYear);

    // // add aggregated values
    // const totalCourses = presencesPerStudent.length;
    // const totalPresences = presencesPerStudent.filter(x => x.isPresent).length;
    // const totalPresencesAsPercent = totalCourses ? Math.round((totalPresences * 100) / totalCourses) : 0;

    const data = {
        student,
        totalQuestions,
        totalUserSubmittedQuestions,
        totalUserSubmittedQuestionsAsPercent,
        class: cls
        //closedRequests: homeworkRequests.filter(x => x.dueDate < today).sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1))
    };

    if (homeworkRequests) {
        data.closedRequests = homeworkRequests
            .filter(x => x.dueDate < today)
            .sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1));
    }

    //res.send(data);
    res.render("homework/homework-submissions-per-student", data);
};

exports.getHomeworkRequest = async (req, res) => {
    const homeworkRequestId = req.params.homeworkRequestId;

    const homeworkRequest = await homeworkService.getHomeworkRequestById(homeworkRequestId);
    homeworkRequest.submissions = homeworkRequest.submissions || [];
    homeworkRequest.relatedCourses = homeworkRequest.relatedCourses || [];

    const studentsIds = homeworkRequest.submissions.map(x => x.studentId);
    const classId = homeworkRequest.classId;
    const coursesIds = homeworkRequest.relatedCourses;

    const [cls, students, courses] = await Promise.all([
        await classService.getClassById(classId),
        await personService.getPersonsByIds(studentsIds),
        await courseService.getCoursesByIds(coursesIds)
    ]);

    homeworkRequest.submissions.forEach(submission => {
        submission.student = students.find(x => x._id == submission.studentId) || {};
        submission.student.displayName = studentHelper.getShortNameForStudent(submission.student);
    });
    homeworkRequest.submissions = homeworkRequest.submissions.sort((a, b) =>
        a.totalSubmittedQuestions < b.totalSubmittedQuestions ? 1 : -1
    );

    homeworkRequest.relatedCourses = courses.sort((a, b) => (a.date > b.date ? 1 : -1));
    homeworkRequest.dueDateAsString = dateTimeHelper.getStringFromStringNoDay(homeworkRequest.dueDate);
    homeworkRequest.publishedDateAsString = dateTimeHelper.getStringFromStringNoDay(homeworkRequest.publishedDate);

    const today = dateTimeHelper.getFriendlyDate(new Date()).ymd; // 2020-02-17

    const isCurrentHomework = homeworkRequest.dueDate >= today;

    // console.log(homeworkRequest);

    const data = {
        // studentIds,
        // // students,
        isNotCurrentHomework: !isCurrentHomework,
        class: cls,
        homeworkRequest
        // //allStudentsIdsPerClass,
        // allUniqueClassIdsForAllStudents,
        // //allCoursesForStudents,
        // submissionsInfoForActiveStudents: submissionsInfo.filter(x => !x.student.isDroppedOut)
        // presencesInfoForInactiveStudents: presencesInfo.filter(x => x.student.isDroppedOut)
    };
    //res.send(data);
    res.render("homework/homework-request", data);
};

exports.getHomeworkRequests = async (req, res) => {
    const classId = req.params.classId;

    const [cls, homeworkRequests] = await Promise.all([
        await classService.getClassById(classId),
        // await studentsAndClassesService.getStudentsMapByClassId(classId),
        await homeworkService.getHomeworRequestsByClassId(classId)
    ]);

    // const studentsIds = studentsMapByClassId.map(x => x.studentId);

    // const students = await personService.getPersonsByIds(studentsIds);

    homeworkRequests.forEach(x => {
        x.dueDateAsString = dateTimeHelper.getStringFromStringNoDay(x.dueDate);
    });

    const today = dateTimeHelper.getFriendlyDate(new Date()).ymd; // 2020-02-17

    const currentRequest = homeworkRequests.find(x => x.dueDate >= today);
    const currentRequestId = currentRequest && currentRequest._id;

    const data = {
        // studentIds,
        // // students,
        currentRequest,
        class: cls,
        homeworkRequests: homeworkRequests
            .filter(x => x._id !== currentRequestId)
            .sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1))
        // //allStudentsIdsPerClass,
        // allUniqueClassIdsForAllStudents,
        // //allCoursesForStudents,
        // submissionsInfoForActiveStudents: submissionsInfo.filter(x => !x.student.isDroppedOut)
        // presencesInfoForInactiveStudents: presencesInfo.filter(x => x.student.isDroppedOut)
    };
    //res.send(data);
    res.render("homework/homework-requests", data);
};

exports.getTotalHomeworkSubmissions = async (req, res) => {
    const classId = req.params.classId;

    const [cls, studentsMapByClassId, homeworkRequests] = await Promise.all([
        await classService.getClassById(classId),
        await studentsAndClassesService.getStudentsMapByClassId(classId),
        await homeworkService.getHomeworRequestsByClassId(classId)
    ]);

    const studentsIds = studentsMapByClassId.map(x => x.studentId);

    const students = await personService.getPersonsByIds(studentsIds);

    // const studentsObj = arrayHelper.arrayToObject(students, "_id") || {};

    const today = dateTimeHelper.getFriendlyDate(new Date()).ymd; // 2020-02-17
    const closedRequests = homeworkRequests.filter(x => x.dueDate < today) || [];

    let totalQuestions = 0;
    closedRequests.forEach(x => {
        totalQuestions += x.totalRequestedQuestions;
        (x.submissions || []).forEach(submission => {
            // const studentCrt = studentsObj[submission.studentId];
            const studentCrt = students.find(x => x._id.toString() === submission.studentId);
            studentCrt.totalSubmittedQuestions =
                (studentCrt.totalSubmittedQuestions || 0) + submission.totalSubmittedQuestions;
        });
    });

    // console.log(students);
    // console.log(totalQuestions);
    // const submissionsInfo = [];

    students.forEach(student => {
        // add aggregated values

        // const totalSubmittedExercises = 15;
        student.totalSubmittedQuestions = student.totalSubmittedQuestions || 0;
        const totalSubmittedQuestionsAsPercent = totalQuestions
            ? Math.round((student.totalSubmittedQuestions * 100) / totalQuestions)
            : 0;

        let isDroppedOut = false;
        if (
            student.academicYearRelatedInfo &&
            student.academicYearRelatedInfo[cls.academicYear] &&
            student.academicYearRelatedInfo[cls.academicYear].droppedOut
        ) {
            isDroppedOut = true;
        }

        student.shortName = studentHelper.getShortNameForStudent(student);
        // add "gradeAndLetter" (e.g.  "8A")
        student.gradeAndLetter = studentHelper.getGradeAndLetterForStudent(student, cls.academicYear);
        student.isDroppedOut = isDroppedOut;

        student.totalSubmittedQuestionsAsPercent = totalSubmittedQuestionsAsPercent;

        // submissionsInfo.push({
        //     student: {
        //         id: student._id,
        //         // add "shortName" (e.g.  "Vali M.")
        //         shortName: studentHelper.getShortNameForStudent(student),
        //         // add "gradeAndLetter" (e.g.  "8A")
        //         gradeAndLetter: studentHelper.getGradeAndLetterForStudent(student, cls.academicYear),
        //         isDroppedOut
        //     },
        //     totalQuestions,
        //     totalSubmittedQuestions: student.totalSubmittedQuestions,
        //     totalSubmittedQuestionsAsPercent
        // });
    });
    // students.sort((a, b) => (a.totalSubmittedQuestions < b.totalSubmittedQuestions ? 1 : -1));

    // submissionsInfo = submissionsInfo.sort((a, b) => (a.totalPresencesAsPercent < b.totalPresencesAsPercent ? 1 : -1));

    const data = {
        // studentIds,
        // // students,
        class: cls,
        // //allStudentsIdsPerClass,
        // allUniqueClassIdsForAllStudents,
        // //allCoursesForStudents,
        totalQuestions,
        activeStudents: students
            .filter(x => !x.isDroppedOut)
            .sort((a, b) => (a.totalSubmittedQuestions < b.totalSubmittedQuestions ? 1 : -1))
        // presencesInfoForInactiveStudents: presencesInfo.filter(x => x.student.isDroppedOut)
    };
    //res.send(data);
    res.render("homework/total-homework-submissions", data);
};
