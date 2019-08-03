const matemaratonService = require("../services/matemaraton.service");
const { PageNotFound } = require("../../shared/errors/all.errors");
const dateTimeHelper = require("../../shared/helpers/date-time.helper");
const arrayHelper = require("../../shared/helpers/array.helper");

exports.getTrainingProgramForENSimulation = async (req, res) => {
    const data = {
        // ctx: req.ctx,
    };
    res.render("matemaraton/pregatire-simulare-en", data);
};

exports.getMatemaraton = async (req, res, next) => {
    // get edition (and its associated period)
    // edition = {period:'201819', edition:'2', ...}
    const editionName = req.params.edition; // "edition-2"
    // let edition = null;
    if (editionName) {
        const editionSegments = editionName.split("-");
        if (editionSegments.length !== 2) {
            const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
            return next(err);
        } else {
            const data = {
                editionNumber: editionSegments[1]
            };
            res.render(`matemaraton/${editionName}`, data);
        }
    } else {
        // edition = await matemaratonService.getCurrentEdition();
        const data = {
            ctx: req.ctx
        };
        res.render("matemaraton/matemaraton", data);
    }
};

exports.getPresencePerGroup = async (req, res, next) => {
    // get edition (and its associated period)
    // edition = {period:'201819', edition:'2', ...}
    const editionName = req.params.edition; // "edition-2"
    let edition = null;
    if (editionName) {
        const editionSegments = editionName.split("-");
        if (editionSegments.length !== 2) {
            const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
            return next(err);
        } else {
            edition = await matemaratonService.getSelectedEdition(editionSegments[1]);
        }
    } else {
        edition = await matemaratonService.getCurrentEdition();
    }

    if (!edition) {
        const err = new PageNotFound(`Pagina negasita2: ${req.method} ${req.url}`);
        return next(err);
    }

    const period = edition.period; // 201819

    // check group name
    const groupId = req.params.groupId;
    const routeParamWhitelist = ["8-avansati", "8-incepatori", "5-avansati"];
    if (!routeParamWhitelist.includes(groupId)) {
        const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
        return next(err);
    }

    const [grade, groupName] = groupId.split("-");

    const [presencePerGroups, students] = await Promise.all([
        await matemaratonService.getPresencePerGroup(period, grade, groupName),
        await matemaratonService.getStudentsPerGrade(period, grade)
    ]);

    const studentsObj = arrayHelper.arrayToObject(students, "_id");

    // enrich students with 'totalPresences'; calculate also 'totalCourses'
    let totalCourses = 0;
    presencePerGroups.forEach(presencePerWeek => {
        if (!presencePerWeek.noCourse) {
            totalCourses += 1;
            if (presencePerWeek.students) {
                presencePerWeek.students.forEach(studentId => {
                    const student = studentsObj[studentId];
                    if (student) {
                        if (!student.totalPresences) {
                            student.totalPresences = 1;
                        } else {
                            student.totalPresences += 1;
                        }
                    }
                });
            }
        }
    });

    // for each student, add totalPresencesAsPercent
    if (totalCourses !== 0) {
        Object.keys(studentsObj).forEach(studentId => {
            const student = studentsObj[studentId];
            student.totalPresencesAsPercent = Math.round((student.totalPresences * 100) / totalCourses);
        });
    }

    presencePerGroups.forEach(presencePerWeek => {
        presencePerWeek.dateAsString = dateTimeHelper.getStringFromStringNoDay(presencePerWeek.date);
        if (presencePerWeek.students) {
            presencePerWeek.students = presencePerWeek.students
                .reduce((acc, studentId) => {
                    const student = studentsObj[studentId];
                    acc.push(student);
                    return acc;
                }, [])
                .sort(sortByPresence);
        }
    });

    // convert students: obj --> array
    const presencePerStudents = arrayHelper
        .objectToArray(studentsObj)
        .filter(x => x.totalPresences) // exclude students from other groups
        .sort(sortByPresence);

    const data = {
        grade,
        groupName,
        presencePerGroups,
        presencePerStudents,
        totalCourses,
        totalStudents: presencePerStudents.length
    };
    //res.send(data);
    res.render("matemaraton/presence-per-group", data);
};

exports.getPresencePerStudent = async (req, res, next) => {
    // get edition (and its associated period); edition = {period:'201819', edition:'2', ...}
    const editionName = req.params.edition; // "edition-2"
    const studentId = req.params.studentId;
    let edition = null;
    let student = null;
    if (editionName) {
        const editionSegments = editionName.split("-");
        if (editionSegments.length !== 2) {
            const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
            return next(err);
        } else {
            [edition, student] = await Promise.all([
                await matemaratonService.getSelectedEdition(editionSegments[1]),
                await matemaratonService.getOneById(studentId)
            ]);
        }
    } else {
        [edition, student] = await Promise.all([
            await matemaratonService.getCurrentEdition(),
            await matemaratonService.getOneById(studentId)
        ]);
    }

    if (!edition || !student) {
        const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
        return next(err);
    }

    const period = edition.period; // 201819

    const periodInfo = student.grades.find(x => x.period === period);

    student.crtGrade = periodInfo.grade;
    student.crtClass = periodInfo.class;
    student.crtGroup = periodInfo.group;

    const presencePerGrade = await matemaratonService.getPresencePerGrade(period, periodInfo.grade);

    let totalCourses = 0;
    let totalPresences = 0;
    const presencesObj = presencePerGrade
        .map(x => {
            // let isPresent = false;
            const result = {
                date: x.date,
                grade: x.grade,
                groupName: x.groupName,
                course: x.course
            };
            if (x.noCourse) {
                result.noCourse = x.noCourse;
                result.noCourseReason = x.noCourseReason;
            } else {
                result.isPresent = x.students.some(x => x === studentId);
            }
            return result;
        })
        // group by day
        .reduce((acc, crt) => {
            const key = crt.date;
            if (acc[key]) {
                // if exists and is present, overwrite it
                if (crt.isPresent && !acc[key].isPresent) {
                    acc[key].isPresent = true;
                    // acc[key].groupName = crt.groupName;
                    totalPresences += 1;
                }
            } else {
                // copy (part of the) original object
                acc[key] = {
                    date: crt.date,
                    dateAsString: dateTimeHelper.getStringFromStringNoDay(crt.date)
                };

                if (crt.noCourse) {
                    acc[key].noCourse = crt.noCourse;
                    acc[key].noCourseReason = crt.noCourseReason;
                } else {
                    acc[key].course = crt.course;
                    // acc[key].groupName = crt.groupName;
                    totalCourses += 1;
                    if (crt.isPresent) {
                        acc[key].isPresent = true;
                        totalPresences += 1;
                    }
                }
            }
            return acc;
        }, {});

    let totalPresencesAsPercent = 0;
    if (totalCourses) {
        totalPresencesAsPercent = Math.round((totalPresences * 100) / totalCourses);
    }

    const data = {
        student,
        presences: arrayHelper.objectToArray(presencesObj),
        totalCourses,
        totalPresences,
        totalPresencesAsPercent
    };

    //res.send(data);
    res.render("matemaraton/presence-per-student", data);
};

exports.getCoursesPerGroup = async (req, res, next) => {
    // get edition (and its associated period)
    // edition = {period:'201819', edition:'2', ...}
    const editionName = req.params.edition; // "edition-2"
    let edition = null;
    if (editionName) {
        const editionSegments = editionName.split("-");
        if (editionSegments.length !== 2) {
            const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
            return next(err);
        } else {
            edition = await matemaratonService.getSelectedEdition(editionSegments[1]);
        }
    } else {
        edition = await matemaratonService.getCurrentEdition();
    }

    if (!edition) {
        const err = new PageNotFound(`Pagina negasita2: ${req.method} ${req.url}`);
        return next(err);
    }

    const period = edition.period; // 201819

    // check group name
    const groupId = req.params.groupId;
    const routeParamWhitelist = ["8-avansati", "8-incepatori", "5-avansati"];
    if (!routeParamWhitelist.includes(groupId)) {
        const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
        return next(err);
    }

    const [grade, groupName] = groupId.split("-");

    const coursesPerGroups = await matemaratonService.getCoursesPerGroup(period, grade, groupName);

    coursesPerGroups.forEach(coursePerWeek => {
        coursePerWeek.dateAsString = dateTimeHelper.getStringFromStringNoDay(coursePerWeek.date);
    });

    //res.send(coursesPerGroups);
    const data = {
        grade,
        groupName,
        coursesPerGroups,
        // presencePerStudents,
        // totalCourses,
        totalCourses: coursesPerGroups.length
    };
    //res.send(data);
    res.render("matemaraton/courses-per-group", data);
};

exports.getCourse = async (req, res) => {
    const courseId = req.params.courseId;
    const course = await matemaratonService.getCourse(courseId);

    course.dateAsString = dateTimeHelper.getStringFromStringNoDay(course.date);

    //res.send(coursesPerGroups);
    const data = {
        course
    };
    // res.send(data);
    res.render("matemaraton/course", data);

    //res.send("test2");
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
