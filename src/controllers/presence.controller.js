const courseService = require("../services/course.service");
const personService = require("../services/person.service");
const classService = require("../services/class.service");
const dateTimeHelper = require("../helpers/date-time.helper");
const arrayHelper = require("../helpers/array.helper");

exports.getPresenceForClass = async (req, res) => {
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

    // apply a presenceCredit (if exists). E.g. Some students have additional presences from another class
    if (cls.presenceCredits) {
        cls.presenceCredits.forEach(presenceCredit => {
            const student = studentsObj[presenceCredit.studentId];
            if (student) {
                student.totalPresences = (student.totalPresences || 0) + (presenceCredit.presenceCreditAmt || 0);
            }
        });
    }

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
    // res.send(data);
    res.render("presence/presence-per-class", data);
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
