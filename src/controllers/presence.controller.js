const courseService = require("../services/course.service");
const personService = require("../services/person.service");
const classService = require("../services/class.service");
const dateTimeHelper = require("../helpers/date-time.helper");
const arrayHelper = require("../helpers/array.helper");

exports.getPresencePerClass = async (req, res) => {
    const classId = req.params.classId;

    const [cls, courses] = await Promise.all([
        await classService.getClassById(classId),
        await courseService.getCoursesByClassId(classId)
    ]);

    const academicYear = cls.academicYear;

    // get a list of all (unique) students with at least one presence in this class
    let allStudentsIds = courses.reduce((acc, course) => {
        if (course.studentsIds) {
            // prevent adding a null value in this list
            acc = acc.concat(course.studentsIds);
        }
        return acc;
    }, []);

    // consider also students defined for class
    allStudentsIds = allStudentsIds.concat(cls.studentsIds);

    // deduplicate studentsIds
    const allUniqueStudentsIds = [...new Set(allStudentsIds)];

    // get details for each student
    let students = await personService.getPersonsByIds(allUniqueStudentsIds);

    students = students.map(x => {
        // add "shortName" (e.g.  "Vali M.")
        const shortFirstName = x.shortFirstName || x.firstName;
        const lastName = x.lastName || "";
        x.shortName = `${shortFirstName} ${lastName.charAt(0)}.`;

        // add "gradeAndLetter" (e.g.  "8A")
        const actualStudentAcademicYearInfo = x.academicYearRelatedInfo && x.academicYearRelatedInfo[academicYear];
        if (actualStudentAcademicYearInfo) {
            x.gradeAndLetter = `${actualStudentAcademicYearInfo.grade}${actualStudentAcademicYearInfo.classLetter}`;
        }

        return x;
    });

    const studentsObj = arrayHelper.arrayToObject(students, "_id") || {};

    // count presences for each student in class
    // we have to count presences in a separate loop, otherwise cannot sort students by presence
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

    const studentsInClass = cls.studentsIds
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
    const academicYear = "201920";

    const [student, cls] = await Promise.all([
        await personService.getPersonById(studentId),
        await classService.getClassByStudentId(academicYear, studentId)
    ]);

    const studentWithPresenceCredit = cls.presenceCredits && cls.presenceCredits.find(x => x.studentId === studentId);
    //let classIdForCredit = null;
    let coursesForCredit = null;
    if (studentWithPresenceCredit) {
        // classIdForCredit = await classService.getClassById(studentWithPresenceCredit.classIdForCredit);
        coursesForCredit = await courseService.getCoursesByClassIdAndStudentId(
            studentWithPresenceCredit.classIdForCredit,
            studentId
        );
    }

    const courses = await courseService.getCoursesByClassId(cls._id.toString());

    // for each course add presence status
    courses.forEach(course => {
        if (course.studentsIds && course.studentsIds.includes(studentId)) {
            course.isPresent = true;
        } else {
            const courseForCredit = coursesForCredit.find(x => x.date === course.date);
            if (courseForCredit && courseForCredit.studentsIds && courseForCredit.studentsIds.includes(studentId)) {
                // course = courseForCredit;
                course.isPresent = true;
                // overwrite course
                course.course = courseForCredit.course; // course number
                course.description = courseForCredit.description;
                courses.images = courseForCredit.images;
                course.class = courseForCredit.class;
            }
        }
    });

    //const academicYear = cls.academicYear;

    const data = {
        student,
        cls,
        studentWithPresenceCredit,
        coursesForCredit,
        courses
    };
    res.send(data);
    //res.render("presence/presence-per-class", data);
};

exports.getPresencePerStudent2 = async (req, res, next) => {
    // get edition (and its associated period); edition = {period:'201819', edition:'2', ...}
    const editionName = req.params.edition; // "edition-2"
    const studentId = req.params.studentId;
    let edition = null;
    let student = null;
    if (editionName) {
        const editionSegments = editionName.split("-");
        if (editionSegments.length !== 2) {
            const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
            return next(err);
        } else {
            [edition, student] = await Promise.all([
                await matemaratonService.getSelectedEdition(editionSegments[1]),
                await matemaratonService.getOneById(studentId)
            ]);
        }
    } else {
        [edition, student] = await Promise.all([
            await matemaratonService.getCurrentEdition(),
            await matemaratonService.getOneById(studentId)
        ]);
    }

    if (!edition || !student) {
        const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
        return next(err);
    }

    student.shortName = student.shortFirstName || student.firstName;
    if (student.lastName) {
        student.shortName = `${student.shortName} ${student.lastName.charAt(0)}.`; // Vali M.
    }

    const period = edition.period; // 201819

    const periodInfo = student.grades.find(x => x.period === period);

    student.crtGrade = periodInfo.grade;
    student.crtClass = periodInfo.class;
    student.crtGroup = periodInfo.group;

    const presencePerGrade = await matemaratonService.getPresencePerGrade(period, periodInfo.grade);

    let totalCourses = 0;
    let totalPresences = 0;
    const presencesObj = presencePerGrade
        .map(x => {
            // let isPresent = false;
            const result = {
                date: x.date,
                grade: x.grade,
                groupName: x.groupName,
                course: x.course
            };
            if (x.noCourse) {
                result.noCourse = x.noCourse;
                result.noCourseReason = x.noCourseReason;
            } else {
                result.isPresent = x.students.some(x => x === studentId);
            }
            return result;
        })
        // group by day
        .reduce((acc, crt) => {
            const key = crt.date;
            if (acc[key]) {
                // if exists and is present, overwrite it
                if (crt.isPresent && !acc[key].isPresent) {
                    acc[key].isPresent = true;
                    // acc[key].groupName = crt.groupName;
                    totalPresences += 1;
                }
            } else {
                // copy (part of the) original object
                acc[key] = {
                    date: crt.date,
                    dateAsString: dateTimeHelper.getStringFromStringNoDay(crt.date)
                };

                if (crt.noCourse) {
                    acc[key].noCourse = crt.noCourse;
                    acc[key].noCourseReason = crt.noCourseReason;
                } else {
                    acc[key].course = crt.course;
                    // acc[key].groupName = crt.groupName;
                    totalCourses += 1;
                    if (crt.isPresent) {
                        acc[key].isPresent = true;
                        totalPresences += 1;
                    }
                }
            }
            return acc;
        }, {});

    let totalPresencesAsPercent = 0;
    if (totalCourses) {
        totalPresencesAsPercent = Math.round((totalPresences * 100) / totalCourses);
    }

    const data = {
        student,
        presences: arrayHelper.objectToArray(presencesObj),
        totalCourses,
        totalPresences,
        totalPresencesAsPercent
    };

    //res.send(data);
    res.render("matemaraton/presence-per-student", data);
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
