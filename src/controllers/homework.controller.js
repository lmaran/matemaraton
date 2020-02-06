const courseService = require("../services/course.service");
const personService = require("../services/person.service");
const classService = require("../services/class.service");
const homeworkService = require("../services/homework.service");
// const dateTimeHelper = require("../helpers/date-time.helper");
const arrayHelper = require("../helpers/array.helper");
const studentHelper = require("../helpers/student.helper");
const studentsAndClassesService = require("../services/studentsAndClasses.service");
const dateTimeHelper = require("../helpers/date-time.helper");

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

    const [cls, studentsMapByClassId] = await Promise.all([
        await classService.getClassById(classId),
        await studentsAndClassesService.getStudentsMapByClassId(classId)
    ]);

    const studentsIds = studentsMapByClassId.map(x => x.studentId);

    const students = await personService.getPersonsByIds(studentsIds);

    // const studentsObj = arrayHelper.arrayToObject(students, "_id") || {};

    const submissionsInfo = [];

    students.forEach(student => {
        // add aggregated values
        const totalExercises = 30;
        const totalSubmittedExercises = 15;
        const totalSubmittedExercisesAsPercent = totalExercises
            ? Math.round((totalSubmittedExercises * 100) / totalExercises)
            : 0;

        let isDroppedOut = false;
        if (
            student.academicYearRelatedInfo &&
            student.academicYearRelatedInfo[cls.academicYear] &&
            student.academicYearRelatedInfo[cls.academicYear].droppedOut
        ) {
            isDroppedOut = true;
        }
        submissionsInfo.push({
            student: {
                id: student._id,
                // add "shortName" (e.g.  "Vali M.")
                shortName: studentHelper.getShortNameForStudent(student),
                // add "gradeAndLetter" (e.g.  "8A")
                gradeAndLetter: studentHelper.getGradeAndLetterForStudent(student, cls.academicYear),
                isDroppedOut
            },
            totalExercises,
            totalSubmittedExercises,
            totalSubmittedExercisesAsPercent
        });
    });

    // studentsMapByClassId.forEach(classMapByStudent => {
    //     const studentId = classMapByStudent.studentId;
    //     const student = studentsObj[studentId];
    //     const classIdsPerIntervals = getClassIdsPerIntervals(classMapByStudent);

    //     const coursesDateByDateForStudent = getCoursesDateByDate(classIdsPerIntervals, allCoursesForStudents);

    //     const coursesWithPresenceForStudent = coursesWithPresenceForStudents.filter(
    //         x =>
    //             (x.studentsIds && x.studentsIds.includes(studentId)) ||
    //             (x.studentsFromOtherClasses && x.studentsFromOtherClasses.map(y => y.studentId).includes(studentId))
    //     );

    //     const presencesPerStudent = getPresencesPerStudent(
    //         coursesDateByDateForStudent,
    //         studentId,
    //         coursesWithPresenceForStudent,
    //         cls._id
    //     );

    //     // add aggregated values
    //     const totalCourses = presencesPerStudent.length;
    //     const totalPresences = presencesPerStudent.filter(x => x.isPresent).length;
    //     const totalPresencesAsPercent = totalCourses ? Math.round((totalPresences * 100) / totalCourses) : 0;

    //     let isDroppedOut = false;
    //     if (
    //         student.academicYearRelatedInfo &&
    //         student.academicYearRelatedInfo[cls.academicYear] &&
    //         student.academicYearRelatedInfo[cls.academicYear].droppedOut
    //     ) {
    //         isDroppedOut = true;
    //     }

    //     submissionsInfo.push({
    //         student: {
    //             id: classMapByStudent.studentId,
    //             // add "shortName" (e.g.  "Vali M.")
    //             shortName: studentHelper.getShortNameForStudent(student),
    //             // add "gradeAndLetter" (e.g.  "8A")
    //             gradeAndLetter: studentHelper.getGradeAndLetterForStudent(student, cls.academicYear),
    //             isDroppedOut
    //         },
    //         // classIdsPerIntervals,
    //         // coursesDateByDateForStudent,
    //         // presencesPerStudent,
    //         totalCourses,
    //         totalPresences,
    //         totalPresencesAsPercent
    //     });
    // });

    // submissionsInfo = submissionsInfo.sort((a, b) => (a.totalPresencesAsPercent < b.totalPresencesAsPercent ? 1 : -1));

    const data = {
        // studentIds,
        // // students,
        class: cls,
        // //allStudentsIdsPerClass,
        // allUniqueClassIdsForAllStudents,
        // //allCoursesForStudents,
        submissionsInfoForActiveStudents: submissionsInfo.filter(x => !x.student.isDroppedOut)
        // presencesInfoForInactiveStudents: presencesInfo.filter(x => x.student.isDroppedOut)
    };
    //res.send(data);
    res.render("homework/total-homework-submissions", data);
};
