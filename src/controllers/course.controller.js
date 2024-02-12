const courseService = require("../services/course.service");
const lessonService = require("../services/lesson.service");
const autz = require("../services/autz.service");
const lessonHelper = require("../helpers/lesson.helper");

const prettyJsonHelper = require("../helpers/pretty-json.helper");

exports.createOrEditGet = async (req, res) => {
    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        const { courseId } = req.params;

        const isEditMode = !!courseId;

        const gradeAvailableOptions = [
            { text: "Primar", value: "P" },
            { text: "Clasa a V-a", value: "5" },
            { text: "Clasa a VI-a", value: "6" },
            { text: "Clasa a VII-a", value: "7" },
            { text: "Clasa a VIII-a", value: "8" },
        ];

        const categoryAvailableOptions = [
            { text: "Evaluare Națională", value: "Evaluare Națională" },
            { text: "Olimpiadă, etapa locală", value: "Olimpiadă, etapa locală" },
            {
                text: "Olimpiadă, etapa județeană",
                value: "Olimpiadă, etapa județeană",
            },
            { text: "Altă categorie", value: "Altă categorie" },
        ];

        const data = {
            isEditMode,
            isCreateMode: !isEditMode,
            gradeAvailableOptions,
            categoryAvailableOptions,
        };
        //let classId;
        if (isEditMode) {
            const course = await courseService.getOneById(courseId);
            if (!course) return res.status(500).send("Curs negăsit!");

            // TODO: refactor (duplicates, see GetOneById or Move)
            const lessonIds = lessonHelper.getAllLessonIdsFromCourse(course);
            const allLessonsFromDB = await lessonService.getAllByIds(lessonIds);

            (course.chapters || []).forEach((chapter) => {
                chapter.numberOfActiveLessons = 0;
                chapter.lessons = [];
                if (chapter.lessonIds) {
                    chapter.lessonIds.forEach((lessonId) => {
                        const lesson = allLessonsFromDB.find((x) => x._id.toString() == lessonId);
                        if (lesson) {
                            // TODO: fetch from DB only those fields we really need (e.g. no Theory, only the total number of exercises etc)
                            const newLesson = {
                                id: lesson._id.toString(),
                                name: lesson.name,
                                exercises: lesson.exercises,
                                isActive: !!(lesson.exercises?.length || lesson.theory?.text),
                            };

                            if (newLesson.isActive) chapter.numberOfActiveLessons++;

                            chapter.lessons.push(newLesson);
                        }
                    });
                }
            });

            data.course = course;
        }
        //res.send(data);
        res.render("course/course-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createOrEditPost = async (req, res) => {
    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        const { courseId } = req.params;

        const isEditMode = !!courseId;

        const { id, code, name, description, grade, category, isHidden, isActive } = req.body;

        const course = {
            code,
            name,
            description,
            grade,
            category,
            isHidden,
            isActive,
        };

        if (isEditMode) {
            course._id = id;

            if (isHidden === "on") {
                // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
                course.isHidden = true;
            } else {
                //delete course.isHidden;
                course.isHidden = false;
            }

            if (isActive === "on") {
                // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)
                course.isActive = true;
            } else {
                //delete course.isHidden;
                course.isActive = false;
            }

            courseService.updateOne(course);
        } else {
            const result = await courseService.insertOne(course);
            course._id = result.insertedId;
        }
        //res.send(course);
        res.redirect("/cursuri/modifica");
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createOrEditListGet = async (req, res) => {
    const canCreateOrEditCourseList = await autz.can(req.user, "create-or-edit:courses");
    if (!canCreateOrEditCourseList) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const courses = await courseService.getAll();

    const data = {
        //isEditMode,
        // gradeAvailableOptions,
        // categoryAvailableOptions,
        courses,
        canCreateOrEditCourseList,
    };

    //res.send(data);
    res.render("course/courses-create-or-edit", data);
};

exports.getAll = async (req, res) => {
    const courses = await courseService.getAll();

    const generalCourses = [];
    const localOlympiadCourses = [];
    const countyOlympiadCourses = [];
    courses
        .filter((x) => !x.isHidden)
        .sort((a, b) => (a.code > b.code ? 1 : -1))
        .forEach((course) => {
            if (course.category === "Evaluare Națională") {
                generalCourses.push(course);
            } else if (course.category === "Olimpiadă, etapa locală") {
                localOlympiadCourses.push(course);
            } else if (course.category === "Olimpiadă, etapa județeană") {
                countyOlympiadCourses.push(course);
            }
        });

    const data = {
        generalCourses,
        localOlympiadCourses,
        countyOlympiadCourses,
        canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
    };
    //res.send(data);
    res.render("course/courses", data);
};

exports.jsonGetAll = async (req, res) => {
    const courses = await courseService.getAll();

    const coursesAsPrettyJson = prettyJsonHelper.getPrettyJson(courses);

    const data = {
        canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
        coursesAsPrettyJson,
    };
    //res.send(data);
    res.render("course/courses-json", data);
};

exports.getOneById = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await courseService.getOneById(courseId);
        if (!course) return res.status(500).send("Curs negăsit!");

        // TODO: refactor (duplicates, see createOrEditGet and getCourseChapter)
        const lessonIds = lessonHelper.getAllLessonIdsFromCourse(course);
        const allLessonsFromDB = await lessonService.getAllByIds(lessonIds);

        (course.chapters || []).forEach((chapter) => {
            chapter.numberOfActiveLessons = 0;
            chapter.lessons = [];
            if (chapter.lessonIds) {
                chapter.lessonIds.forEach((lessonId) => {
                    const lesson = allLessonsFromDB.find((x) => x._id.toString() == lessonId);
                    if (lesson) {
                        // TODO: fetch from DB only those fields we really need (e.g. no Theory, only the total number of exercises etc)
                        const newLesson = {
                            id: lesson._id.toString(),
                            name: lesson.name,
                            exercises: lesson.exercises,
                            isActive: !!(lesson.exercises?.length || lesson.theory?.text),
                        };

                        if (newLesson.isActive) chapter.numberOfActiveLessons++;

                        chapter.lessons.push(newLesson);
                    }
                });
            }
        });

        const data = {
            course,
            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
            pageTitle: `${course.name}`,
        };

        //res.send(data);
        res.render("course/course", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.jsonGetOneById = async (req, res) => {
    const { courseId } = req.params;
    const course = await courseService.getOneById(courseId);

    const courseAsPrettyJson = prettyJsonHelper.getPrettyJson(course);

    const data = {
        courseId: course._id,
        courseCode: course.code,
        courseAsPrettyJson,
        canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
    };

    //res.send(data);
    res.render("course/course-json", data);
};

exports.deleteOneById = async (req, res) => {
    const { courseId } = req.params;

    const canDelete = await autz.can(req.user, "delete:course");
    if (!canDelete) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const course = await courseService.getOneById(courseId);
    if (course.chapters && course.chapters.length > 0) {
        return res.status(403).send("Șterge întâi capitolele!");
    }

    courseService.deleteOneById(req.body.id);
    res.redirect(`/cursuri/modifica`);
};

// exports.addLessonDetailsAsync = async (course) => {
//     const lessonsIds = [];
//     if (course.chapters) {
//         course.chapters.forEach((chapter) => {
//             if (chapter.lessons) {
//                 chapter.lessons.forEach((lesson) => {
//                     if (lesson.id) {
//                         lessonsIds.push(lesson.id);
//                     }
//                 });
//             }
//         });

//         const uniqueLessonsIds = [...new Set(lessonsIds)]; // remove duplicates (if exists)

//         // get lesson details
//         const lessons = await lessonService.getLessonTitlesByIds(uniqueLessonsIds);

//         // enrich TOC with lesson names
//         course.chapters.forEach((chapter) => {
//             if (chapter.lessons) {
//                 chapter.lessons.forEach((lesson) => {
//                     if (lesson.id) {
//                         const lesson3 = lessons.find((x) => x._id == lesson.id);
//                         lesson.name = lesson3.title;
//                     }
//                 });
//             }
//         });
//     }
// };

exports.addLessonsIdsRecursively = (item, result) => {
    if (item.lessonId) {
        result.push(item.lessonId);
    } else {
        if (item.folderItems) {
            item.folderItems.forEach((item) => {
                this.addLessonsIdsRecursively(item, result);
            });
        }
    }
};
