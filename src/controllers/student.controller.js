const personService = require("../services/person.service");
const classService = require("../services/class.service");
// const dateTimeHelper = require("../helpers/date-time.helper");
const studentHelper = require("../helpers/student.helper");
const studentsAndClassesService = require("../services/studentsAndClasses.service");
const autz = require("../services/autz.service");
//const { can } = require("../services/autz.service");
const stringHelper = require("../helpers/string.helper");
const arrayHelper = require("../helpers/array.helper");

exports.getStudentsPerClass = async (req, res) => {
    const classId = req.params.classId;

    const [cls, studentsMapByClassId] = await Promise.all([
        await classService.getOneById(classId),
        await studentsAndClassesService.getStudentsMapByClassId(classId),
    ]);

    const studentsIds = studentsMapByClassId.map((x) => x.studentId);

    let students = await personService.getAllByIds(studentsIds);

    const canReadStudentFullName = await autz.can(req.user, "read:student/full-name");

    const studentsMapByClassIdObj = arrayHelper.arrayToObject(studentsMapByClassId, "studentId");

    students = students
        .map((student) => {
            // add "displayName" (e.g.  "Vali M.")
            student.displayName = canReadStudentFullName
                ? studentHelper.getFullNameForStudent(student)
                : studentHelper.getShortNameForStudent(student);

            const studentInfoInClass = studentsMapByClassIdObj[student._id];

            student.droppedOut = studentInfoInClass && studentInfoInClass.droppedOut;

            if (studentInfoInClass && studentInfoInClass.classLetter) {
                student.gradeAndLetter = `${studentInfoInClass.grade}${studentInfoInClass.classLetter}`; // e.g.  "8A"
            }

            return student;
        })
        .sort((a, b) => (a.displayName > b.displayName ? 1 : -1));

    const data = {
        class: cls,
        activeStudents: students.filter((x) => !x.droppedOut),
        inactiveStudents: students.filter((x) => x.droppedOut),
    };
    //res.send(data);
    res.render("student/students-per-class", data);
};

exports.getStudent = async (req, res) => {
    const studentId = req.params.studentId;

    const [clsMapLines, studentAndTheirParents] = await Promise.all([
        await studentsAndClassesService.getClassesByStudentId(studentId),
        await personService.getStudentAndTheirParentsById(studentId),
    ]);

    const student = studentAndTheirParents.find((x) => x._id.toString() === studentId);
    const parents = studentAndTheirParents.filter((x) => x.studentIds && x.studentIds.length > 0);

    const classes = await classService.getAllByIds(clsMapLines.map((x) => x.classId));

    // add "shortName" (e.g.  "Vali M.")
    student.shortName = studentHelper.getShortNameForStudent(student);
    // parents.forEach(p => p.displayName = );

    // add "gradeAndLetter" (e.g.  "8A")

    const sortedClasses = classes.sort((a, b) => (a.academicYear < b.academicYear ? 1 : -1)); // sort descendent by academicYear
    sortedClasses.forEach((x) => (x.editionInterval = stringHelper.getIntervalFromAcademicYear(x.academicYear)));

    const data = {
        student,
        sortedClasses,
        parents,
        studentAndTheirParents,
        can: {
            viewParentsLink: await autz.can(req.user, "read:parents"),
        },
    };

    if (sortedClasses.length > 0) {
        data.lastClass = sortedClasses[0];
    }

    //res.send(data);
    res.render("student/student", data);
};
