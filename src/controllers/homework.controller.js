const courseService = require("../services/course.service");
const personService = require("../services/person.service");
const classService = require("../services/class.service");
// const dateTimeHelper = require("../helpers/date-time.helper");
const arrayHelper = require("../helpers/array.helper");
const studentHelper = require("../helpers/student.helper");
const studentsAndClassesService = require("../services/studentsAndClasses.service");

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
