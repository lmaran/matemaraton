const courseSessionService = require("../services/course-session.service");
const personService = require("../services/person.service");
const classService = require("../services/class.service");
const dateTimeHelper = require("../helpers/date-time.helper");
const arrayHelper = require("../helpers/array.helper");
const studentHelper = require("../helpers/student.helper");
const studentsAndClassesService = require("../services/studentsAndClasses.service");

exports.getTotalPresences = async (req, res) => {
    const classId = req.params.classId;

    const [cls, studentsMapByClassId] = await Promise.all([
        await classService.getOneById(classId),
        await studentsAndClassesService.getStudentsMapByClassId(classId)
    ]);

    let allClassIdsForAllStudents = [];
    studentsMapByClassId.forEach(classMapByStudent => {
        const classIdsPerIntervals = getClassIdsPerIntervals(classMapByStudent);
        const allClassIdsForStudent = classIdsPerIntervals.map(x => x.classId);
        allClassIdsForAllStudents = allClassIdsForAllStudents.concat(allClassIdsForStudent);
    });
    const allUniqueClassIdsForAllStudents = [...new Set(allClassIdsForAllStudents)]; // remove duplicates (if exists)

    const studentsIds = studentsMapByClassId.map(x => x.studentId);

    const [allCoursesForStudents, students, coursesWithPresenceForStudents] = await Promise.all([
        await courseSessionService.getCourseSessionsByClassIds(allUniqueClassIdsForAllStudents),
        await personService.getAllByIds(studentsIds),
        await courseSessionService.getCourseSessionsByStudentsIds(studentsIds)
    ]);

    const studentsObj = arrayHelper.arrayToObject(students, "_id") || {};

    let presencesInfo = [];
    studentsMapByClassId.forEach(studentInfoInClass => {
        const studentId = studentInfoInClass.studentId;
        const student = studentsObj[studentId];
        const classIdsPerIntervals = getClassIdsPerIntervals(studentInfoInClass);

        const coursesDateByDateForStudent = getCoursesDateByDate(classIdsPerIntervals, allCoursesForStudents);

        const coursesWithPresenceForStudent = coursesWithPresenceForStudents.filter(
            x =>
                (x.studentsIds && x.studentsIds.includes(studentId)) ||
                (x.studentsFromOtherClasses && x.studentsFromOtherClasses.map(y => y.studentId).includes(studentId))
        );

        const presencesPerStudent = getPresencesPerStudent(
            coursesDateByDateForStudent,
            studentId,
            coursesWithPresenceForStudent,
            cls._id
        );

        // add aggregated values
        const totalCourses = presencesPerStudent.length;
        const totalPresences = presencesPerStudent.filter(x => x.isPresent).length;
        const totalPresencesAsPercent = totalCourses ? Math.round((totalPresences * 100) / totalCourses) : 0;

        presencesInfo.push({
            student: {
                id: studentInfoInClass.studentId,
                shortName: studentHelper.getShortNameForStudent(student),
                gradeAndLetter: `${studentInfoInClass.grade}${studentInfoInClass.classLetter}`, // e.g.  "8A"
                droppedOut: studentInfoInClass.droppedOut
            },
            totalCourses,
            totalPresences,
            totalPresencesAsPercent
        });
    });

    presencesInfo = presencesInfo.sort((a, b) => (a.totalPresencesAsPercent < b.totalPresencesAsPercent ? 1 : -1));

    const data = {
        class: cls,
        allUniqueClassIdsForAllStudents,
        presencesInfoForActiveStudents: presencesInfo.filter(x => !x.student.droppedOut),
        presencesInfoForInactiveStudents: presencesInfo.filter(x => x.student.droppedOut)
    };
    //res.send(data);
    res.render("presence/total-presences", data);
};

exports.getPresencePerClass = async (req, res) => {
    const classId = req.params.classId;

    const [cls, courses, studentsMapByClassId] = await Promise.all([
        await classService.getOneById(classId),
        await courseSessionService.getCourseSessionsByClassId(classId),
        await studentsAndClassesService.getStudentsMapByClassId(classId)
    ]);

    let allStudentsIds = [];
    courses.forEach(course => {
        if (course.studentsIds) {
            allStudentsIds = allStudentsIds.concat(course.studentsIds || []);
        }
        if (course.studentsFromOtherClasses) {
            allStudentsIds = allStudentsIds.concat(course.studentsFromOtherClasses.map(x => x.studentId));
        }
    });
    // deduplicate studentsIds
    const allUniqueStudentsIds = [...new Set(allStudentsIds)];

    const studentsMapByClassIdObj = arrayHelper.arrayToObject(studentsMapByClassId, "studentId");

    // get details for each student
    const students = await personService.getAllByIds(allUniqueStudentsIds);
    students.forEach(student => {
        // add "shortName" (e.g.  "Vali M.")
        student.shortName = studentHelper.getShortNameForStudent(student);

        const studentInfoInClass = studentsMapByClassIdObj[student._id];
        student.gradeAndLetter = studentInfoInClass && `${studentInfoInClass.grade}${studentInfoInClass.classLetter}`; // e.g.  "8A"s
    });

    const studentsObj = arrayHelper.arrayToObject(students, "_id") || {};

    courses.forEach(course => {
        course.dateAsString = dateTimeHelper.getStringFromStringNoDay(course.date);
        course.presences = [];
        if (course.studentsIds) {
            course.studentsIds.forEach(studentId => {
                course.presences.push({
                    student: studentsObj[studentId]
                });
            });
        }
        if (course.studentsFromOtherClasses) {
            course.studentsFromOtherClasses.forEach(presence => {
                course.presences.push({
                    student: studentsObj[presence.studentId],
                    isTemporaryPresenceFromOtherCourse: true
                });
            });
        }

        // sort presences by shortName
        if (course.presences.length > 0) {
            course.presences = course.presences.sort((a, b) => (a.student.shortName > b.student.shortName ? 1 : -1));
        }
    });

    const data = {
        courses,
        class: cls
    };
    //res.send(data);
    res.render("presence/presence-per-class", data);
};

exports.getPresencePerStudent = async (req, res) => {
    const { studentId, classId } = req.params;

    let student = null;
    let classMapByStudent = null;
    let cls = null;
    let coursesWithPresence = null;
    [student, classMapByStudent, coursesWithPresence, cls] = await Promise.all([
        await personService.getOneById(studentId),
        await studentsAndClassesService.getClassMapByStudentId(classId, studentId),
        await courseSessionService.getCourseSessionsByStudentId(studentId),
        await classService.getOneById(classId)
    ]);

    const classIdsPerIntervals = getClassIdsPerIntervals(classMapByStudent);

    let allClassIdsForStudent = classIdsPerIntervals.map(x => x.classId);
    allClassIdsForStudent = [...new Set(allClassIdsForStudent)]; // remove duplicates (if exists)

    const allCoursesForStudent = await courseSessionService.getCourseSessionsByClassIds(allClassIdsForStudent);

    const coursesDateByDate = getCoursesDateByDate(classIdsPerIntervals, allCoursesForStudent);

    const presencesPerStudent = getPresencesPerStudent(coursesDateByDate, studentId, coursesWithPresence, cls._id);

    // add "shortName" (e.g.  "Vali M.")
    student.shortName = studentHelper.getShortNameForStudent(student);
    // add "gradeAndLetter" (e.g.  "8A")

    // add aggregated values
    const totalCourses = presencesPerStudent.length;
    const totalPresences = presencesPerStudent.filter(x => x.isPresent).length;
    const totalPresencesAsPercent = totalCourses ? Math.round((totalPresences * 100) / totalCourses) : 0;

    const data = {
        coursesWithPresence,
        classIdsPerIntervals,
        allClassIdsForStudent,
        coursesDateByDate,
        presencesPerStudent,
        student,
        class: cls,
        totalCourses,
        totalPresences,
        totalPresencesAsPercent
    };
    //res.send(data);
    res.render("presence/presence-per-student", data);
};

// sort student by 'totalPresences' (desc), then by 'shortName' (asc); https://flaviocopes.com/how-to-sort-array-of-objects-by-property-javascript/
// const sortByPresence = (a, b) =>
//     a.totalPresences > b.totalPresences
//         ? -1
//         : a.totalPresences === b.totalPresences
//         ? a.shortName > b.shortName
//             ? 1
//             : -1
//         : 1;

const getClassIdsPerIntervals = classMapByStudent => {
    let allClassIdsWithStartDates = [
        // we know the first element
        { startDate: classMapByStudent.startDateInClass, classId: classMapByStudent.classId }
    ];
    if (classMapByStudent.previousClassMaps) {
        classMapByStudent.previousClassMaps.forEach(cm => {
            if (!allClassIdsWithStartDates.find(x => x.startDate === cm.startDateInClass)) {
                allClassIdsWithStartDates.push({
                    startDate: cm.startDateInClass,
                    classId: cm.classId
                });
            }
        });
    }

    // sort by startDate
    allClassIdsWithStartDates = allClassIdsWithStartDates.sort((a, b) => (a.startDate > b.startDate ? 1 : -1));

    const classIdsPerIntervals = [];
    const length = allClassIdsWithStartDates.length;
    if (length > 0) {
        for (let i = 0; i < length; i++) {
            classIdsPerIntervals.push({
                startDate: allClassIdsWithStartDates[i].startDate,
                endDate: i == length - 1 ? "2999-12-12" : allClassIdsWithStartDates[i + 1].startDate,
                classId: allClassIdsWithStartDates[i].classId
            });
        }
    }
    // return format:
    // [
    //     {
    //         startDate: "2019-09-28",
    //         endDate: "2019-10-12",
    //         classId: "5d92dba4a0da913a67b9a712"
    //     },
    //     {
    //         startDate: "2019-10-12",
    //         endDate: "2999-12-12",
    //         classId: "5d92db9ba0da913a67b9a711"
    //     }
    // ];
    return classIdsPerIntervals;
};

const getCoursesDateByDate = (classIdsPerIntervals, allCoursesForStudent) => {
    const coursesDateByDate = [];
    classIdsPerIntervals.forEach(classIdPerInterval => {
        const courses = allCoursesForStudent.filter(
            x =>
                x.classId === classIdPerInterval.classId &&
                x.date >= classIdPerInterval.startDate &&
                x.date < classIdPerInterval.endDate
        );
        coursesDateByDate.push(...courses);
    });
    // returns a list of courses based on the class that the student belongs in a certain period
    return coursesDateByDate;
};

const getPresencesPerStudent = (coursesDateByDate, studentId, coursesWithPresence, lastClassId) => {
    const presencesPerStudent = [];
    coursesDateByDate = coursesDateByDate.filter(x => !x.noCourse); // ignore vacations etc
    coursesDateByDate.forEach(courseOriginal => {
        let isPresent = false;
        let course = courseOriginal;
        const courseOriginalId = courseOriginal._id.toString();
        coursesWithPresence.forEach(courseWithPresence => {
            if (courseWithPresence._id.toString() === courseOriginalId) {
                isPresent = true;
                course = courseWithPresence;
            } else {
                if (courseWithPresence.studentsFromOtherClasses) {
                    courseWithPresence.studentsFromOtherClasses.forEach(other => {
                        if (other.studentId === studentId && other.creditForThisCourseId === courseOriginalId) {
                            isPresent = true;
                            course = courseWithPresence;
                        }
                    });
                }
            }
        });

        // "8 - Grupa 2" -> "Grupa 2"
        //let className = course.class.name;
        // const classNameParts = className.split("-");
        // if (classNameParts.length > 1) {
        //     className = classNameParts[classNameParts.length - 1].trim();
        // }

        const presencePerCourse = {
            date: course.date,
            dateAsString: dateTimeHelper.getStringFromStringNoDay(course.date),
            isPresent,
            courseNumber: course.course,
            courseId: course._id,
            description: course.description,
            classId: course.classId,
            //className,
            isTemporaryCreditFromOtherCourse: course._id.toString() !== courseOriginalId,
            isCreditFromOtherClass: lastClassId.toString() !== course.classId
        };

        presencesPerStudent.push(presencePerCourse);
    });
    return presencesPerStudent.sort((a, b) => (a.date < b.date ? 1 : -1));
};
