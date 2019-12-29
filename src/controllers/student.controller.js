const personService = require("../services/person.service");
const classService = require("../services/class.service");
// const dateTimeHelper = require("../helpers/date-time.helper");
const studentHelper = require("../helpers/student.helper");
const studentsAndClassesService = require("../services/studentsAndClasses.service");
const autz = require("../services/autz.service");
//const { can } = require("../services/autz.service");

exports.getStudentsPerClass = async (req, res) => {
    const classId = req.params.classId;

    const [cls, studentsMapByClass] = await Promise.all([
        await classService.getClassById(classId),
        await studentsAndClassesService.getStudentsMapByClassId(classId)
    ]);

    const studentsIds = studentsMapByClass.map(x => x.studentId);

    let students = await personService.getPersonsByIds(studentsIds);

    const canReadStudentFullName = await autz.can(req.user, "read:student/full-name");

    students = students
        .map(student => {
            // add "displayName" (e.g.  "Vali M.")
            student.displayName = canReadStudentFullName
                ? studentHelper.getFullNameForStudent(student)
                : studentHelper.getShortNameForStudent(student);

            if (
                student.academicYearRelatedInfo &&
                student.academicYearRelatedInfo[cls.academicYear] &&
                student.academicYearRelatedInfo[cls.academicYear].droppedOut
            ) {
                student.droppedOut = true;
            }

            // add "gradeAndLetter" (e.g.  "8A")
            student.gradeAndLetter = studentHelper.getGradeAndLetterForStudent(student, cls.academicYear);
            return student;
        })
        .sort((a, b) => (a.displayName > b.displayName ? 1 : -1));

    const data = {
        class: cls,
        activeStudents: students.filter(x => !x.droppedOut),
        inactiveStudents: students.filter(x => x.droppedOut)
    };
    //res.send(data);
    res.render("student/students-per-class", data);
};

exports.getStudent = async (req, res) => {
    const studentId = req.params.studentId;
    const academicYear = "201920";
    // const student = await personService.getPersonById(studentId);
    const [clsMapLine, studentAndTheirParents] = await Promise.all([
        await studentsAndClassesService.getClassMapByStudentId(academicYear, studentId),
        await personService.getStudentAndTheirParentsById(studentId)
    ]);

    const student = studentAndTheirParents.find(x => x._id.toString() === studentId);
    const parents = studentAndTheirParents.filter(x => x.studentIds && x.studentIds.length > 0);

    const [cls] = await Promise.all([await classService.getClassById(clsMapLine.classId)]);

    // add "shortName" (e.g.  "Vali M.")
    student.shortName = studentHelper.getShortNameForStudent(student);
    // parents.forEach(p => p.displayName = );

    // add "gradeAndLetter" (e.g.  "8A")
    student.gradeAndLetter = studentHelper.getGradeAndLetterForStudent(student, academicYear);

    const data = {
        student,
        class: cls,
        parents,
        studentAndTheirParents,
        can: {
            viewParentsLink: await autz.can(req.user, "read:parents")
        }
    };
    //res.send(data);
    res.render("student/student", data);
};
