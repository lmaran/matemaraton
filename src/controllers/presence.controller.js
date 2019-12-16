const courseService = require("../services/course.service");
const personService = require("../services/person.service");
const classService = require("../services/class.service");
const dateTimeHelper = require("../helpers/date-time.helper");
const arrayHelper = require("../helpers/array.helper");
const studentHelper = require("../helpers/student.helper");
const studentsAndClassesService = require("../services/studentsAndClasses.service");

exports.getPresencePerClass = async (req, res) => {
    const classId = req.params.classId;

    const [cls, courses, studentsIds] = await Promise.all([
        await classService.getClassById(classId),
        await courseService.getCoursesByClassId(classId),
        await studentsAndClassesService.getStudentsIdsPerClassId(classId)
    ]);

    const academicYear = cls.academicYear;

    // get a list of all (unique) students with at least one presence in this class
    let allStudentsIds = courses.reduce((acc, course) => {
        if (course.studentsIds) {
            // prevent adding a null value in this list
            acc = acc.concat(course.studentsIds);
        }
        if (course.studentsFromOtherClasses) {
            const otherStudentsIds = course.studentsFromOtherClasses.map(x => x.studentId);
            // console.log("otherStudentsIds");
            // console.log(otherStudentsIds);
            acc = acc.concat(otherStudentsIds);
        }
        // if (course.date === "2019-11-26") {
        //     console.log(course.class.name);
        //     console.log(acc);
        // }
        return acc;
    }, []);

    // consider also students defined for class
    allStudentsIds = allStudentsIds.concat(studentsIds);

    // deduplicate studentsIds
    const allUniqueStudentsIds = [...new Set(allStudentsIds)];
    // console.log(allUniqueStudentsIds);

    // get details for each student
    let students = await personService.getPersonsByIds(allUniqueStudentsIds);

    students = students.map(student => {
        // add "shortName" (e.g.  "Vali M.")
        student.shortName = studentHelper.getShortNameForStudent(student);

        // add "gradeAndLetter" (e.g.  "8A")
        student.gradeAndLetter = studentHelper.getGradeAndLetterForStudent(student, academicYear);
        return student;
    });

    const studentsObj = arrayHelper.arrayToObject(students, "_id") || {};

    // count the presences for each student in class
    // we have to count the presences in a separate loop, otherwise cannot sort students by presence
    courses.forEach(course => {
        if (course.studentsIds) {
            course.studentsIds.forEach(studentId => {
                const student = studentsObj[studentId];
                if (student) {
                    student.totalPresences = (student.totalPresences || 0) + 1;
                }
            });
        }
        course.dateAsString = dateTimeHelper.getStringFromStringNoDay(course.date);
    });

    // apply a presenceCredit (if exists). E.g. Some students have additional presences from another class
    if (cls.presenceCredits) {
        cls.presenceCredits.forEach(presenceCredit => {
            const student = studentsObj[presenceCredit.studentId];
            if (student) {
                student.totalPresences = (student.totalPresences || 0) + (presenceCredit.presenceCreditAmt || 0);
            }
        });
    }

    const totalActiveCourses = courses.filter(x => !x.noCourse).length; // ignore vacations etc

    // for each course, replace student Ids with student details
    courses.forEach(course => {
        if (course.studentsIds) {
            course.students = course.studentsIds
                .reduce((acc, studentId) => {
                    const student = studentsObj[studentId];
                    if (student) {
                        // for each student, add totalPresencesAsPercent
                        student.totalPresencesAsPercent = Math.round(
                            (student.totalPresences * 100) / totalActiveCourses
                        );
                        acc.push(student);
                    }
                    return acc;
                }, [])
                .sort(sortByPresence);
        }
    });

    const studentsInClass = studentsIds
        .reduce((acc, studentId) => {
            const student = studentsObj[studentId];
            student.totalPresences = student.totalPresences || 0;
            acc.push(student);
            return acc;
        }, [])
        .sort(sortByPresence);

    const data = {
        allUniqueStudentsIds,
        studentsInClass,
        class: cls,
        totalActiveCourses,
        courses
    };
    //res.send(data);
    res.render("presence/presence-per-class", data);
};

exports.getPresencePerStudent = async (req, res) => {
    const studentId = req.params.studentId;
    let academicYear = "201920";

    let student = null;
    let classMapByStudent = null;
    let cls = null;
    let coursesWithPresence = null;
    [student, classMapByStudent, coursesWithPresence] = await Promise.all([
        await personService.getPersonById(studentId),
        await studentsAndClassesService.getClassMapByStudentId(academicYear, studentId),
        await courseService.getCoursesByStudentId(studentId)
    ]);

    if (classMapByStudent) {
        cls = await classService.getClassById(classMapByStudent.classId);
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

    const classIdsPerIntervals = getClassIdsPerIntervals(classMapByStudent);

    let allClassIdsForStudent = classIdsPerIntervals.map(x => x.classId);
    allClassIdsForStudent = [...new Set(allClassIdsForStudent)]; // remove duplicates (if exists)

    const allCoursesForStudent = await courseService.getCoursesByClassIds(allClassIdsForStudent);

    const coursesDateByDate = getCoursesDateByDate(classIdsPerIntervals, allCoursesForStudent);

    const presencesPerStudent = getPresencesPerStudent(coursesDateByDate, studentId, coursesWithPresence, cls._id);

    // add "shortName" (e.g.  "Vali M.")
    student.shortName = studentHelper.getShortNameForStudent(student);
    // add "gradeAndLetter" (e.g.  "8A")
    student.gradeAndLetter = studentHelper.getGradeAndLetterForStudent(student, academicYear);

    // check if the student has a presenceCredit (from another class)
    const presenceCredit = cls.presenceCredits && cls.presenceCredits.find(x => x.studentId === studentId);
    let coursesForCredit = null;
    if (presenceCredit) {
        coursesForCredit = await courseService.getCoursesByClassIdAndStudentId(
            presenceCredit.classIdForCredit,
            studentId
        );
    }

    let courses = await courseService.getCoursesByClassId(cls._id.toString());
    courses = courses.filter(x => !x.noCourse); // ignore vacations etc

    // for each course add presence status and count the presences
    let totalCourses = 0;
    let totalPresences = 0;
    courses.forEach(course => {
        totalCourses += 1;
        course.dateAsString = dateTimeHelper.getStringFromStringNoDay(course.date);
        if (course.studentsIds && course.studentsIds.includes(studentId)) {
            course.isPresent = true;
            totalPresences += 1;
        } else {
            // check if, in the same day, the student has a presenceCredit from another class
            if (coursesForCredit) {
                const courseForCredit = coursesForCredit.find(x => x.date === course.date);
                if (courseForCredit && courseForCredit.studentsIds && courseForCredit.studentsIds.includes(studentId)) {
                    course.isPresent = true;
                    totalPresences += 1;
                    // overwrite course
                    course.course = courseForCredit.course; // course number
                    course.description = courseForCredit.description;
                    courses.images = courseForCredit.images;
                    course.class = courseForCredit.class;
                    course.studentsIds = courseForCredit.studentsIds;
                }
            }
        }
    });

    totalCourses = presencesPerStudent.length;
    totalPresences = presencesPerStudent.filter(x => x.isPresent).length;

    let totalPresencesAsPercent = 0;
    if (totalCourses) {
        totalPresencesAsPercent = Math.round((totalPresences * 100) / totalCourses);
    }

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
const sortByPresence = (a, b) =>
    a.totalPresences > b.totalPresences
        ? -1
        : a.totalPresences === b.totalPresences
        ? a.shortName > b.shortName
            ? 1
            : -1
        : 1;

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
                x.class.id === classIdPerInterval.classId &&
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
        let className = course.class.name;
        const classNameParts = className.split("-");
        if (classNameParts.length > 1) {
            className = classNameParts[classNameParts.length - 1].trim();
        }

        const presencePerCourse = {
            date: course.date,
            dateAsString: dateTimeHelper.getStringFromStringNoDay(course.date),
            isPresent,
            courseNumber: course.course,
            courseId: course._id,
            description: course.description,
            classId: course.class.id,
            className,
            isTemporaryCreditFromOtherCourse: course._id.toString() !== courseOriginalId,
            isCreditFromOtherClass: lastClassId.toString() !== course.class.id
        };

        presencesPerStudent.push(presencePerCourse);
    });
    return presencesPerStudent.sort((a, b) => (a.date < b.date ? 1 : -1));
};
