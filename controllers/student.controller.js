const personService = require("../services/person.service");
const classService = require("../services/class.service");
const dateTimeHelper = require("../helpers/date-time.helper");
const studentHelper = require("../helpers/student.helper");

exports.getStudentsPerClass = async (req, res) => {
    const classId = req.params.classId;

    // const [cls, courses] = await Promise.all([
    //     await classService.getClassById(classId),
    //     await courseService.getCoursesByClassId(classId)
    // ]);

    const cls = await classService.getClassById(classId);

    let students = await personService.getPersonsByIds(cls.studentsIds);

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
        students
    };
    //res.send(data);
    res.render("student/students-per-class", data);
};
