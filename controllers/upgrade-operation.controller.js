// const { ObjectID } = require("mongodb");
// const matemaratonService = require("../services/matemaraton.service");
// const studentService = require("../services/student.service");
// const personService = require("../services/person.service");

// exports.moveSchoolClassNameFromStudentToPerson = async (req, res) => {
//     const students = await studentService.getAll();
//     const persons = await personService.getAllPersons();

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
