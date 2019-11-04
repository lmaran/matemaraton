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

    students = students.map(student => {
        // add "shortName" (e.g.  "Vali M.")
        student.shortName = getShortNameForStudent(student);

        // add "gradeAndLetter" (e.g.  "8A")
        student.gradeAndLetter = getGradeAndLetterForStudent(student, academicYear);
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
    let academicYear = "201920";

    let student = null;
    let cls = null;
    [student, cls] = await Promise.all([
        await personService.getPersonById(studentId),
        await classService.getClassByStudentId(academicYear, studentId)
    ]);

    if (!cls && student.academicYearRelatedInfo) {
        // maybe a graduated student
        const academicYears = Object.keys(student.academicYearRelatedInfo);
        // overwrite the existing class and academicYear
        if (academicYears.length > 0) {
            academicYear = academicYears.sort()[0];
            cls = await classService.getClassByStudentId(academicYear, studentId);
        }
    }

    // add "shortName" (e.g.  "Vali M.")
    student.shortName = getShortNameForStudent(student);
    // add "gradeAndLetter" (e.g.  "8A")
    student.gradeAndLetter = getGradeAndLetterForStudent(student, academicYear);

    // check if the student has a presenceCredit (from another class)
    const presenceCredit = cls.presenceCredits && cls.presenceCredits.find(x => x.studentId === studentId);
    let coursesForCredit = null;
    if (presenceCredit) {
        coursesForCredit = await courseService.getCoursesByClassIdAndStudentId(
            presenceCredit.classIdForCredit,
            studentId
        );
    }

    const courses = await courseService.getCoursesByClassId(cls._id.toString());

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

    let totalPresencesAsPercent = 0;
    if (totalCourses) {
        totalPresencesAsPercent = Math.round((totalPresences * 100) / totalCourses);
    }

    const data = {
        student,
        class: cls,
        courses,
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

const getShortNameForStudent = student => {
    const shortFirstName = student.shortFirstName || student.firstName;
    const lastName = student.lastName || "";
    return `${shortFirstName} ${lastName.charAt(0)}.`;
};

const getGradeAndLetterForStudent = (student, academicYear) => {
    let gradeAndLetter = "";
    const actualStudentAcademicYearInfo =
        student.academicYearRelatedInfo && student.academicYearRelatedInfo[academicYear];
    if (actualStudentAcademicYearInfo) {
        gradeAndLetter = `${actualStudentAcademicYearInfo.grade}${actualStudentAcademicYearInfo.classLetter}`;
    }
    return gradeAndLetter;
};
