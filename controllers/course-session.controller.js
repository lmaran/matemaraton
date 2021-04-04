const courseSessionService = require("../services/course-session.service");
const classService = require("../services/class.service");
const dateTimeHelper = require("../helpers/date-time.helper");
const autz = require("../services/autz.service");
const studentsAndClassesService = require("../services/studentsAndClasses.service");
const personService = require("../services/person.service");

exports.deleteOneById = async (req, res) => {
    const canDeleteCourseSession = await autz.can(req.user, "delete:course-session");
    if (!canDeleteCourseSession) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }
    courseSessionService.deleteOneById(req.body.id);
    res.redirect(`/clase/${req.body.classId}/sesiuni-curs`);
};

exports.createOrEditGet = async (req, res) => {
    const canCreateOrEditCourseSession = await autz.can(req.user, "create-or-edit:course-session");
    if (!canCreateOrEditCourseSession) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const isEditMode = !!req.params.id;

    const data = {
        isEditMode,
    };

    let classId;
    if (isEditMode) {
        const courseSession = await courseSessionService.getOneById(req.params.id);
        classId = courseSession.classId;
        data.courseSession = courseSession;

        if (courseSession.images) {
            courseSession.images = courseSession.images.reduce((acc, crt) => {
                acc += crt.url + "\n";
                return acc;
            }, "");
        }

        if (courseSession.videos) {
            courseSession.videos = courseSession.videos.reduce((acc, crt) => {
                acc += crt.url + "\n";
                return acc;
            }, "");
        }
    } else {
        classId = req.params.classId;
        const numberOfSessionForClass = await courseSessionService.getNumberOfSessionForClass(classId);
        data.courseSession = {
            course: numberOfSessionForClass + 1,
            date: dateTimeHelper.getStringFromDate(new Date()),
        };
    }

    const [cls, studentsMapByClassId] = await Promise.all([
        await classService.getOneById(classId),
        await studentsAndClassesService.getStudentsMapByClassId(classId),
    ]);

    const allStudentsIdsPerClass = studentsMapByClassId.map((x) => x.studentId);

    data.class = cls;

    const allStudentsPerClass = await personService.getAllByIds(allStudentsIdsPerClass);

    // add abandon info
    allStudentsPerClass.forEach((student) => {
        student.isNotDroppedOut = studentsMapByClassId.find((x) => x.studentId == student._id.toString() && !x.droppedOut);
    });

    // add presence info
    if (data.courseSession.studentsIds) {
        allStudentsPerClass.forEach((student) => {
            student.isPresent = data.courseSession.studentsIds.includes(student._id.toString());
        });
    }
    data.students = allStudentsPerClass;

    //res.send(data);
    res.render("course-session/course-session-create-or-edit", data);
};

exports.createOrEditPost = async (req, res) => {
    try {
        const canCreateOrEditCourseSession = await autz.can(req.user, "create-or-edit:course-session");
        if (!canCreateOrEditCourseSession) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        //const classId = req.params.classId;
        const { id, classId, course, date, description, studentsIds, images, videos } = req.body;

        const isEditMode = !!id;

        const courseSession = {
            course,
            classId,
            date,
            description,
        };

        if (studentsIds) {
            // for single value, the studentsIds is transmitted as string (instead of array)
            if (typeof studentsIds === "string") {
                courseSession.studentsIds = [studentsIds]; // convert string to array
            } else {
                courseSession.studentsIds = studentsIds;
            }
        }

        if (images) {
            const imagesUrls = images.split("\n").filter((x) => x.trim() != "");
            courseSession.images = imagesUrls.map((imagesUrl) => {
                return { url: imagesUrl.trim() };
            });
        }

        if (videos) {
            const videosUrls = videos.split("\n").filter((x) => x.trim() != "");
            courseSession.videos = videosUrls.map((videosUrl) => {
                return { url: videosUrl.trim() };
            });
        }

        if (isEditMode) {
            courseSession._id = id;
            courseSession.classId;
            courseSessionService.updateOne(courseSession);
        } else {
            const result = await courseSessionService.insertOne(courseSession);
            courseSession._id = result.insertedId;
        }

        //res.send(courseSession);
        res.redirect(`/clase/${classId}/sesiuni-curs`);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getCourseSessionsPerClass = async (req, res) => {
    const classId = req.params.classId;

    const [cls, courses] = await Promise.all([
        await classService.getOneById(classId),
        await courseSessionService.getCourseSessionsByClassId(classId),
    ]);

    const newCourses = courses
        .filter((x) => !x.noCourse)
        .map((x) => {
            x.dateAsString = dateTimeHelper.getStringFromStringNoDay(x.date);
            return x;
        });

    const data = {
        class: cls,
        courses: newCourses,
        totalCourses: newCourses.length,
        canCreateOrEditCourseSession: await autz.can(req.user, "create-or-edit:course-session"),
    };
    //res.send(data);
    res.render("course-session/course-sessions-per-class", data);
};

exports.getCourseSessionsPerClassWithPhotos = async (req, res) => {
    const classId = req.params.classId;

    const [cls, courses] = await Promise.all([
        await classService.getOneById(classId),
        await courseSessionService.getCourseSessionsByClassId(classId),
    ]);

    const newCourses = courses
        .filter((x) => !x.noCourse)
        .map((x) => {
            x.dateAsString = dateTimeHelper.getStringFromStringNoDay(x.date);
            if (x.images) {
                x.images.forEach((image) => (image.highQualityUrl = image.url.replace("courses-lg", "courses")));
            }
            return x;
        });

    const data = {
        class: cls,
        courses: newCourses,
        totalCourses: newCourses.length,
    };
    //res.send(data);
    res.render("course-session/course-sessions-with-all-photos", data);
};

exports.getCourseSession = async (req, res) => {
    const courseSessionId = req.params.courseSessionId;

    const courseSession = await courseSessionService.getOneById(courseSessionId);
    const cls = await classService.getOneById(courseSession.classId);

    courseSession.dateAsString = dateTimeHelper.getStringFromStringNoDay(courseSession.date);

    if (courseSession.images) {
        courseSession.images.forEach((image) => (image.highQualityUrl = image.url.replace("courses-lg", "courses")));
    }

    const data = {
        class: cls,
        courseSession,
        canCreateOrEditCourseSession: await autz.can(req.user, "create-or-edit:course-session"),
    };
    //res.send(data);
    res.render("course-session/course-session", data);
};
