const courseService = require("../services/course.service");
const lessonService = require("../services/lesson.service");
const autz = require("../services/autz.service");
const lessonHelper = require("../helpers/lesson.helper");
const arrayHelper = require("../helpers/array.helper");
const prettyJsonHelper = require("../helpers/pretty-json.helper");
const sectionService = require("../services/section.service");
const markdownService = require("../services/markdown.service");

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

exports.getAll = async (req, res) => {
    try {
        const courses = await courseService.getAll();
        const sections = await sectionService.getAllForUser(req.user);

        sections.forEach((section) => {
            if (section.description) {
                section.descriptionPreview = markdownService.render(section.description);
            }

            section.courses = [];
            (section.courseIds || []).forEach((courseId) => {
                const course = courses.find((x) => x._id.toString() == courseId);
                if (course) section.courses.push(course);
            });
        });

        const data = {
            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
            sections,
        };
        //res.send(data);
        res.render("course/courses", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createOrEditListGet = async (req, res) => {
    try {
        const canCreateOrEditCourseList = await autz.can(req.user, "create-or-edit:courses");
        if (!canCreateOrEditCourseList) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const courses = await courseService.getAll();
        const sections = await sectionService.getAll();

        sections.forEach((section) => {
            if (section.description) {
                section.descriptionPreview = markdownService.render(section.description);
            }

            section.courses = [];
            (section.courseIds || []).forEach((courseId) => {
                const course = courses.find((x) => x._id.toString() == courseId);
                if (course) section.courses.push(course);
            });
        });

        const data = {
            sections,
            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
        };

        //res.send(data);
        res.render("course/courses-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createOrEditGet = async (req, res) => {
    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        const { courseId } = req.params;
        const { sectionId } = req.query; // in editMode we have to extract it from course

        const isEditMode = !!courseId;

        let isChaptersTabActive, isGeneralTabActive;
        if (isEditMode) {
            const { view } = req.query;
            isChaptersTabActive = view != "general";
            isGeneralTabActive = view == "general";
        } else {
            isChaptersTabActive = false;
            isGeneralTabActive = true;
        }

        const data = {
            isChaptersTabActive,
            isGeneralTabActive,
            isEditMode,
            isCreateMode: !isEditMode,
            sections: await sectionService.getAll(), // TODO: remove it
            sectionId,
        };
        //let classId;
        if (isEditMode) {
            const course = await courseService.getOneById(courseId);
            if (!course) return res.status(500).send("Curs negăsit!");

            data.sectionId = course.sectionId;

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

        const section = await sectionService.getOneById(data.sectionId);
        if (section) {
            let coursesFromDB = [];
            if (section?.courseIds?.length > 0) coursesFromDB = await courseService.getAllByIds(section.courseIds);

            // In getAvailablePositions method we need this fields: id and name
            const availableCourses = [];
            (section.courseIds || []).forEach((courseId) => {
                const course = coursesFromDB.find((course) => course._id.toString() == courseId);
                availableCourses.push({ id: course._id.toString(), name: course.name });
            });

            const { availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(availableCourses, courseId);
            data.availablePositions = availablePositions;
            data.selectedPosition = selectedPosition;
        }

        //res.send(data);
        res.render("course/course-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createOrEditPost = async (req, res) => {
    const userId = req.user?._id?.toString();
    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        let { courseId } = req.params;

        const isEditMode = !!courseId;

        const { code, name, description, sectionId, isHidden, isActive, position, sectionIdOld } = req.body;

        const course = {
            code,
            name,
            description,
            sectionId,
            isHidden,
            isActive,
        };

        if (isEditMode) {
            course._id = courseId;

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
            const courseIdObj = courseService.getObjectId();
            course._id = courseIdObj;
            course.ownerId = userId;

            courseId = courseIdObj.toString();
            await courseService.insertOne(course);
        }

        // Remove the courseId from the old section
        if (isEditMode && sectionId != sectionIdOld) {
            const sectionOld = await sectionService.getOneById(sectionIdOld);
            sectionOld.courseIds = (sectionOld.courseIds || []).filter((x) => x != courseId);
            await sectionService.updateOne(sectionOld);
        }

        // Add the courseId to the new section, in the selected position
        const section = await sectionService.getOneById(sectionId);
        section.courseIds = section.courseIds || [];
        arrayHelper.moveOrInsertStringAtIndex(section.courseIds, courseId, position);
        await sectionService.updateOne(section);

        //res.send(course);
        res.redirect("/cursuri/modifica");
    } catch (err) {
        return res.status(500).json(err.message);
    }
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

    // Remove the courseId from the current section
    const section = await sectionService.getOneById(course.sectionId);
    section.courseIds = (section.courseIds || []).filter((x) => x != courseId);
    await sectionService.updateOne(section);

    // Remove the course from the database
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
