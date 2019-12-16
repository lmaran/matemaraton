const personService = require("../services/person.service");
const classService = require("../services/class.service");
// const dateTimeHelper = require("../helpers/date-time.helper");
const studentHelper = require("../helpers/student.helper");
const studentsAndClassesService = require("../services/studentsAndClasses.service");

exports.getStudentsPerClass = async (req, res) => {
    const classId = req.params.classId;

    const [cls, studentsIds] = await Promise.all([
        await classService.getClassById(classId),
        await studentsAndClassesService.getStudentsIdsPerClassId(classId)
    ]);

    let students = await personService.getPersonsByIds(studentsIds);

    students = students
        .map(student => {
            // add "shortName" (e.g.  "Vali M.")
            student.shortName = studentHelper.getShortNameForStudent(student);

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
        .sort((a, b) => (a.shortName > b.shortName ? 1 : -1));

    const data = {
        class: cls,
        activeStudents: students.filter(x => !x.droppedOut),
        inactiveStudents: students.filter(x => x.droppedOut)
    };
    //res.send(data);
    res.render("student/students-per-class", data);
};
