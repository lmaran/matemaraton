const personService = require("../services/person.service");
const classService = require("../services/class.service");
const dateTimeHelper = require("../helpers/date-time.helper");
const studentHelper = require("../helpers/student.helper");
const studentsAndClassesService = require("../services/studentsAndClasses.service");
const autz = require("../services/autz.service");
const userService = require("../services/user.service");
const urlHelper = require("../helpers/url.helper");
//const { can } = require("../services/autz.service");

exports.getParentsPerClass = async (req, res) => {
    if (!req.user) {
        return res.redirect(`/login?redirect_uri=${urlHelper.getCurrentEncodedUri(req)}`);
    }

    const classId = req.params.classId;

    const [cls, studentsMapByClass] = await Promise.all([
        await classService.getClassById(classId),
        await studentsAndClassesService.getStudentsMapByClassId(classId)
    ]);

    const studentIds = studentsMapByClass.map(x => x.studentId);

    const studentsAndTheirParents = await personService.getStudentsAndTheirParentsByIds(studentIds);
    const students = studentsAndTheirParents.filter(x => studentIds.includes(x._id.toString()));
    const parents = studentsAndTheirParents.filter(x => x.studentIds && x.studentIds.length > 0);

    students.forEach(student => {
        student.displayName = studentHelper.getLastAndShortNameForStudent(student);
        student.parents = [];
        student.parentIds.forEach(parentId => {
            const parent = parents.find(p => p._id.toString() === parentId);
            student.parents.push(parent);
        });
    });

    const data = {
        class: cls,
        // studentsAndTheirParents
        students,
        parents
        // activeStudents: students.filter(x => !x.droppedOut),
        // inactiveStudents: students.filter(x => x.droppedOut)
    };
    //res.send(data);
    res.render("parent/parents-per-class", data);
};

exports.getParent = async (req, res) => {
    const parentId = req.params.parentId;
    // const academicYear = "201920";

    // const parentAndTheirStudents = await personService.getParentAndTheirStudentsById(parentId);

    // const parent = parentAndTheirStudents.find(x => x._id.toString() === parentId);
    // const students = parentAndTheirStudents.filter(x => x.parentIds && x.parentIds.length > 0);

    const parent = await personService.getPersonById(parentId);
    // const students = await personService.getPersonsByIds(parent.studentIds);

    const [students, parentUser] = await Promise.all([
        await await personService.getPersonsByIds(parent.studentIds),
        await userService.getOneByEmail(parent.email)
    ]);

    if (parentUser) {
        const d = dateTimeHelper.getFriendlyDate(parentUser.modifiedOn || parentUser.createdOn);
        parentUser.lastActionDate = `${d.dmy} ${d.time}`; // "23.04.2020 13:07"
    }

    const data = {
        parent,
        parentUser,
        students,
        can: {
            viewParentsLink: await autz.can(req.user, "read:parents")
        }
    };
    //res.send(data);
    res.render("parent/parent", data);
};
