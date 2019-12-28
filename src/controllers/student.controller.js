const personService = require("../services/person.service");
const classService = require("../services/class.service");
// const dateTimeHelper = require("../helpers/date-time.helper");
const studentHelper = require("../helpers/student.helper");
const studentsAndClassesService = require("../services/studentsAndClasses.service");
const autz = require("../services/autz.service");

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
