// const { ObjectID } = require("mongodb");
// const studentService = require("../services/student.service");
// const personService = require("../services/person.service");
// const classService = require("../services/class.service");
// const studentsAndClassesService = require("../services/studentsAndClasses.service");

exports.upgradeOperation = async (req, res) => {
    return res.json({ msg: "ok" });
};

// exports.upgradeOperation = async (req, res) => {
//     const studentsAndClasses = await studentsAndClassesService.getAll();
//     const persons = await personService.getAll();

//     const mongoOps = [];
//     studentsAndClasses.forEach(x => {
//         const person = persons.find(p => p._id == x.studentId);
//         if (person && person.academicYearRelatedInfo) {
//             const academicYearInfo = person.academicYearRelatedInfo[x.academicYear];
//             if (academicYearInfo) {
//                 x.grade = academicYearInfo.grade;
//                 x.classLetter = academicYearInfo.classLetter;
//             }
//             if (academicYearInfo.droppedOut) {
//                 x.droppedOut = academicYearInfo.droppedOut;
//             }

//             x.lastNameTmp = person.lastName;
//             x.firstNameTmp = person.firstName;
//         }

//         mongoOps.push({
//             updateOne: {
//                 filter: { _id: new ObjectID(x._id) },
//                 // update: { $set: { studentIds }, $unset: { students: "" } }
//                 update: { $set: x }
//             }
//         });
//     });

//     await studentsAndClassesService.bulkWrite(mongoOps);

//     return res.json(studentsAndClasses);
// };

// exports.removeParentDetails = async (req, res) => {
//     // same for students. we'll keep only the IDs and drop all other details
//     const persons = await personService.getAll();

//     const mongoOps = [];
//     persons.forEach(person => {
//         if (person.students) {
//             const studentIds = person.students.map(x => x.id);
//             person.studentIds = studentIds; // test only

//             mongoOps.push({
//                 updateOne: {
//                     filter: { _id: new ObjectID(person._id) },
//                     update: { $set: { studentIds }, $unset: { students: "" } }
//                 }
//             });
//         }

//         if (person.parents) {
//             const parentIds = person.parents.map(x => x.id);
//             person.parentIds = parentIds; // test only

//             mongoOps.push({
//                 updateOne: {
//                     filter: { _id: new ObjectID(person._id) },
//                     update: { $set: { parentIds }, $unset: { parents: "" } }
//                 }
//             });
//         }
//     });

//     await personService.bulkWritePersons(mongoOps);

//     const data = {
//         mongoOps,
//         persons
//     };
//     res.send(data);
// };

// exports.mapStudentsToClasses = async (req, res) => {
//     const classes = await classService.getAll();

//     const studentsAndClasses = [];

//     classes.forEach(cls => {
//         const studentsIds = cls.studentsIds;
//         studentsIds.forEach(studentId => {
//             const studentToClass = {
//                 academicYear: cls.academicYear,
//                 studentId,
//                 classId: cls._id.toString(),
//                 startDateInClass: cls.academicYear === "201819" ? "2019-09-22" : "2019-09-28"
//             };
//             studentsAndClasses.push(studentToClass);
//         });
//     });

//     await studentsAndClassesService.insertManyStudentsAndClasses(studentsAndClasses);

//     const data = {
//         //classes,
//         studentsAndClasses
//     };
//     res.send(data);
// };

// exports.moveSchoolClassNameFromStudentToPerson = async (req, res) => {
//     const students = await studentService.getAll();
//     const persons = await personService.getAll();

//     const mongoOps = [];
//     persons.forEach(person => {
//         const personId = person._id;
//         const student = students.find(x => x._id.toString() === personId.toString());
//         if (student && student.grades && student.grades[0]) {
//             const academicYearRelatedInfo = {
//                 "201819": {
//                     grade: student.grades[0].grade,
//                     classLetter: student.grades[0].class
//                 }
//             };

//             person.academicYearRelatedInfo = academicYearRelatedInfo;

//             mongoOps.push({
//                 updateOne: {
//                     filter: { _id: new ObjectID(person._id) },
//                     update: { $set: { academicYearRelatedInfo: academicYearRelatedInfo } }
//                 }
//             });
//         }
//     });

//     await personService.bulkWritePersons(mongoOps);

//     const data = {
//         mongoOps,
//         // students,
//         persons
//     };
//     res.send(data);
// };

// exports.moveEmptyClassesFromPresenceToClasses = async (req, res) => {
//     const [allPresences] = await Promise.all([
//         await matemaratonService.getAllPresences()
//         // await matemaratonService.getAllCourses()
//     ]);

//     const newEmptyCourses = [];
//     allPresences
//         .filter(x => x.noCourse)
//         .forEach(presence => {
//             newEmptyCourses.push({
//                 _id: presence._id,
//                 date: presence.date,
//                 class: presence.class,
//                 noCourse: presence.noCourse,
//                 noCourseReason: presence.noCourseReason
//             });
//         });

//     await matemaratonService.insertManyCourses(newEmptyCourses);

//     const data = { newEmptyCourses };
//     res.send(data);
// };

// exports.movePresenceToClasses = async (req, res) => {
//     const [allPresences, allCourses] = await Promise.all([
//         await matemaratonService.getAllPresences(),
//         await matemaratonService.getAllCourses()
//     ]);

//     const mongoOps = [];
//     allCourses.forEach(course => {
//         const courseNo = course.course;
//         const classId = course.class.id;
//         const attendeesIds = allPresences.find(x => x.course === courseNo && x.class.id === classId).studentIds;

//         mongoOps.push({
//             updateOne: {
//                 filter: { _id: new ObjectID(course._id) },
//                 update: { $set: { attendeesIds: attendeesIds } }
//             }
//         });
//     });

//     await matemaratonService.bulkWriteCourses(mongoOps);

//     const data = { allCourses };
//     res.send(data);
// };
