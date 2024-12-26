const sectionService = require("../services/section.service");
const courseService = require("../services/course.service");
// const lessonService = require("../services/lesson.service");
const autz = require("../services/autz.service");
// const lessonHelper = require("../helpers/lesson.helper");
const prettyJsonHelper = require("../helpers/pretty-json.helper");
const markdownService = require("../services/markdown.service");
const arrayHelper = require("../helpers/array.helper");

exports.getOneById = async (req, res) => {
    const user = req.user;
    const { sectionId } = req.params;
    try {
        const section = await sectionService.getOneByIdForUser(sectionId, user);
        if (!section) return res.status(500).send("Secțiune negăsită sau lipsă permisiuni!");

        // let prevChapterId, nextChapterId;
        // if (chapterIndex > 0) prevChapterId = chapters[chapterIndex - 1]?.id;
        // if (chapterIndex < chapters.length - 1) nextChapterId = chapters[chapterIndex + 1]?.id;

        if (section.description) {
            section.descriptionPreview = markdownService.render(section.description);
        }

        let coursesFromDB = [];
        if (section.courseIds?.length > 0) coursesFromDB = await courseService.getAllByIds(section.courseIds);

        section.courses = [];
        (section.courseIds || []).forEach((courseId) => {
            const course = coursesFromDB.find((course) => course._id.toString() == courseId);
            section.courses.push(course);
        });

        const data = {
            section,
            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
        };
        //res.send(data);
        res.render("section/section", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.getAll = async (req, res) => {
    try {
        const sections = await sectionService.getAllForUser(req.user);

        const data = {
            sections,
            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
        };
        //res.send(data);
        res.render("section/sections", data);
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

        const sections = await sectionService.getAll();

        const data = {
            isEditMode: true,
            sections,
            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
        };

        //res.send(data);
        res.render("section/sections-create-or-edit", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.jsonGetAll = async (req, res) => {
    try {
        const canCreateOrEditCourseList = await autz.can(req.user, "create-or-edit:courses");
        if (!canCreateOrEditCourseList) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const sections = await sectionService.getAll();

        const sectionsAsPrettyJson = prettyJsonHelper.getPrettyJson(sections);

        const data = {
            sectionsAsPrettyJson,
            canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
            // pageTitle: `${lesson.name}`,
        };

        //res.send(data);
        res.render("section/sections-json", data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.createOrEditGet = async (req, res) => {
    let availablePositions, selectedPosition;
    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }
        const { sectionId } = req.params;

        const isEditMode = !!sectionId;

        let isCoursesTabActive, isGeneralTabActive;
        if (isEditMode) {
            const { view } = req.query;
            isCoursesTabActive = view != "general";
            isGeneralTabActive = view == "general";
        } else {
            isCoursesTabActive = false;
            isGeneralTabActive = true;
        }

        const data = {
            isEditMode,
            isCreateMode: !isEditMode,
            isCoursesTabActive,
            isGeneralTabActive,
        };

        const availableSections = await sectionService.getAll();
        // For getAvailablePositions helper method we need an "id" field
        availableSections.forEach((x) => (x.id = x._id.toString()));

        if (isEditMode) {
            const section = await sectionService.getOneById(sectionId);
            if (!section) return res.status(500).send("Categorie negăsită!");

            if (section.description) {
                section.descriptionPreview = markdownService.render(section.description);
            }

            let coursesFromDB = [];
            if (section.courseIds?.length > 0) coursesFromDB = await courseService.getAllByIds(section.courseIds);

            section.courses = [];
            (section.courseIds || []).forEach((courseId) => {
                const course = coursesFromDB.find((course) => course._id.toString() == courseId);
                section.courses.push(course);
            });

            data.section = section;

            ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(availableSections, sectionId));
        } else {
            ({ availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(availableSections));
        }

        data.availablePositions = availablePositions;
        data.selectedPosition = selectedPosition;

        // res.send(data);
        res.render("section/section-create-or-edit", data);
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
        const { sectionId } = req.params;

        const isEditMode = !!sectionId;

        const { code, name, description, isPrivate, position } = req.body;
        const newPosition = parseInt(position) + 1;

        let section = {},
            oldPosition;
        if (isEditMode) {
            section = await sectionService.getOneById(sectionId);
            if (!section) {
                throw new Error("Secțiune negăsită");
            }
            oldPosition = section.position;
        }

        section.code = code;
        section.name = name;
        section.description = description;
        section.position = newPosition;
        section.isPrivate = isPrivate == "on" ? true : false; // If the 'value' attribute was omitted, the default value for the checkbox is 'on' (mozilla.org)

        if (isEditMode) {
            // Adjust positions of other documents
            if (oldPosition < newPosition) {
                // Decrease positions of documents between old and new positions
                await sectionService.decreasePositionsBetweenOldAndNew(oldPosition, newPosition);
            } else if (oldPosition > newPosition) {
                // Increase positions of documents between new and old positions
                await sectionService.increasePositionsBetweenNewAndOld(newPosition, oldPosition);
            }

            await sectionService.updateOne(section);
        } else {
            // Adjust positions of other documents
            await sectionService.increasePositionsAbovePosition(newPosition);

            section.ownerId = userId;
            const result = await sectionService.insertOne(section);
            section._id = result.insertedId;
        }
        //res.send(section);
        res.redirect("/cursuri/modifica");
    } catch (err) {
        return res.status(500).json(err.message);
    }
};

exports.jsonGetOneById = async (req, res) => {
    const { sectionId } = req.params;
    const section = await sectionService.getOneById(sectionId);

    const sectionAsPrettyJson = prettyJsonHelper.getPrettyJson(section);

    const data = {
        sectionId: section._id,
        sectionCode: section.code,
        sectionName: section.name,
        sectionAsPrettyJson,
        canCreateOrEditCourse: await autz.can(req.user, "create-or-edit:course"),
    };

    //res.send(data);
    res.render("section/section-json", data);
};

exports.deleteOneById = async (req, res) => {
    const { sectionId } = req.params;

    const canDelete = await autz.can(req.user, "delete:course");
    if (!canDelete) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    // Adjust positions of other documents
    const section = await sectionService.getOneById(sectionId);
    if (!section) {
        throw new Error("Secțiune negăsită");
    }
    await sectionService.decreasePositionsAbovePosition(section.position);

    sectionService.deleteOneById(sectionId);
    res.redirect(`/cursuri/modifica`);
};

exports.getAvailablePositions = async (req, res) => {
    const { sectionId } = req.params;
    const { courseId } = req.query;

    try {
        const canCreateOrEditCourse = await autz.can(req.user, "create-or-edit:course");
        if (!canCreateOrEditCourse) {
            return res.status(403).send("Lipsă permisiuni!"); // forbidden
        }

        const section = await sectionService.getOneById(sectionId);
        if (!section) return res.status(500).send("Secțiune negăsită!");

        let coursesFromDB = [];
        if (section?.courseIds?.length > 0) coursesFromDB = await courseService.getAllByIds(section.courseIds);

        // In getAvailablePositions method we need this fields: id and name
        const availableCourses = [];
        (section.courseIds || []).forEach((courseId) => {
            const course = coursesFromDB.find((course) => course._id.toString() == courseId);
            availableCourses.push({ id: course._id.toString(), name: course.name });
        });

        const { availablePositions, selectedPosition } = arrayHelper.getAvailablePositions(availableCourses, courseId);

        const data = {
            availablePositions,
            selectedPosition,
        };

        res.send(data);
    } catch (err) {
        return res.status(500).json(err.message);
    }
};
