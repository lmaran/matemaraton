const validator = require("validator");
const classService = require("../services/class.service");
const courseService = require("../services/course.service");
const autz = require("../services/autz.service");
const arrayHelper = require("../helpers/array.helper");
const stringHelper = require("../helpers/string.helper");
const markdownService = require("../services/markdown.service");
// const objectHelper = require("../helpers/object.helper");

exports.getOneById = async (req, res) => {
    const classId = req.params.classId;
    const cls = await classService.getOneById(classId);

    if (cls.description) {
        cls.description = markdownService.render(cls.description);
    }

    const courseSummary = await courseService.getCourseSummaryByCode(cls.courseCode);

    const data = {
        class: cls,
        courseSummary,
        canCreateOrEditClass: await autz.can(req.user, "create-or-edit:class"),
        canDeleteClass: await autz.can(req.user, "delete:class"),
        can: {
            viewParentsLink: await autz.can(req.user, "read:parents", {
                classId,
            }),
        },
    };

    //res.send(data);
    res.render("class/class", data);
};

exports.createOrEditGet = async (req, res) => {
    // Authorize
    const canCreateOrEditClass = await autz.can(req.user, "create-or-edit:class");
    if (!canCreateOrEditClass) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    // Init
    const classId = req.params.id;
    const isEditMode = !!classId;
    const data = { isEditMode, uiData: {}, errors: {} };

    // Get values from DB
    if (isEditMode) {
        const cls = await classService.getOneById(classId);
        cls.academicYear = stringHelper.getIntervalFromAcademicYear(cls.academicYear, true);
        if (cls.description) {
            cls.descriptionPreview = markdownService.render(cls.description);
        }
        data.class = cls;
    } else {
        const today = new Date();
        data.class = {
            academicYear: `${today.getFullYear()}-${today.getFullYear() + 1}`,
        };
    }

    // Overwrite existing data with initial values
    const initialValuesArray = req.flash("initialValues"); // Get an array of initial values by passing the key
    if (initialValuesArray.length) {
        const initialValues = initialValuesArray[0]; // we saved initial values as first object in array
        data.class = { ...data.class, ...initialValues };
    }

    // Add validation errors
    const validationErrorsArray = req.flash("validationErrors");
    if (validationErrorsArray.length > 0) {
        data.errors = validationErrorsArray[0]; // we saved validation errors as first object in array
    }

    // Set autofocus
    if (Object.keys(data.errors).length > 0) {
        const firstFieldWithError = Object.keys(data.errors)[0];
        data.uiData[firstFieldWithError] = { hasAutofocus: true };
    } else {
        data.uiData.name = { hasAutofocus: true }; // no errors (e.g. first page request)s
    }

    //res.send(data);
    res.render("class/class-create-or-edit", data);
};

exports.createOrEditPost = async (req, res) => {
    // Authorize
    const canCreateOrEditClass = await autz.can(req.user, "create-or-edit:class");
    if (!canCreateOrEditClass) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    // Init
    let classId = req.params.id;
    const isEditMode = !!classId;

    const cls = {
        name: req.body.name,
        academicYear: req.body.academicYear,
        level: req.body.level,
        position: req.body.position,
        description: req.body.description,
    };

    // handle static validation errors
    const validationErrors = getStaticValidationErrors(cls);
    if (Object.keys(validationErrors).length > 0) {
        return flashAndReloadPage(req, res, validationErrors, cls);
    }

    const modifiedFields = {
        name: cls.name,
        academicYear: stringHelper.getAcademicYearFromInterval(cls.academicYear),
    };

    if (isEditMode) {
        const removedFields = {};

        modifiedFields.modifiedOn = new Date();
        modifiedFields.modifiedById = req.user?._id?.toString();

        if (cls.level) modifiedFields.level = cls.level;
        else removedFields.level = "";

        if (cls.position) modifiedFields.position = cls.position;
        else removedFields.position = "";

        if (cls.description) modifiedFields.description = cls.description;
        else removedFields.description = "";

        if (req.body.isHidden === "on") modifiedFields.isHidden = true;
        else removedFields.isHidden = "";

        if (req.body.isCompleted === "on") modifiedFields.isCompleted = true;
        else removedFields.isCompleted = "";

        classService.updateOne(classId, modifiedFields, removedFields);
    } else {
        modifiedFields.createdOn = new Date();
        modifiedFields.createdById = req.user?._id?.toString();

        if (cls.level) modifiedFields.level = cls.level;
        if (cls.position) modifiedFields.position = cls.position;
        if (cls.description) modifiedFields.description = cls.description;
        if (req.body.isHidden === "on") modifiedFields.isHidden = true;
        if (req.body.isCompleted === "on") modifiedFields.isCompleted = true;

        const result = await classService.insertOne(modifiedFields);
        classId = result.insertedId;
    }

    res.redirect(`/clase/${classId}`);
};

exports.getAll = async (req, res) => {
    let classes = await classService.getAll();
    classes = classes.sort((a, b) => (a.position < b.position ? -1 : 1));

    const activeClasses = [];
    const archivedClasses = [];
    classes.forEach((cls) => {
        if (cls.isCompleted) {
            archivedClasses.push(cls);
        } else {
            activeClasses.push(cls);
        }
    });

    const unorderedActiveClasses = arrayHelper.groupBy(activeClasses, "academicYear");
    const orderedActiveClasses = [];
    const academicYears1 = Object.keys(unorderedActiveClasses);
    academicYears1
        .sort((a, b) => b - a) // sort by academicYear, desc
        .forEach(function (academicYear) {
            orderedActiveClasses.push({
                editionInterval: stringHelper.getIntervalFromAcademicYear(academicYear, false),
                values: unorderedActiveClasses[academicYear],
            });
        });

    const unorderedArchivedClasses = arrayHelper.groupBy(archivedClasses, "academicYear");
    const orderedArchivedClasses = [];
    const academicYears = Object.keys(unorderedArchivedClasses);
    academicYears
        .sort((a, b) => b - a) // sort by academicYear, desc
        .forEach(function (academicYear) {
            orderedArchivedClasses.push({
                editionInterval: stringHelper.getIntervalFromAcademicYear(academicYear, false),
                values: unorderedArchivedClasses[academicYear],
            });
        });

    const data = {
        orderedActiveClasses,
        orderedArchivedClasses,
        canCreateOrEditClass: await autz.can(req.user, "create-or-edit:class"),
        classes,
    };

    //res.send(data);
    res.render("class/classes", data);
};

exports.deleteOneById = async (req, res) => {
    const classId = req.params.id;
    const canDeleteClass = await autz.can(req.user, "delete:class");
    if (!canDeleteClass) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    classService.deleteOneById(classId);
    res.redirect("/clase");
};

exports.saveDescription = async (req, res) => {
    // Authorize
    const canCreateOrEditClass = await autz.can(req.user, "create-or-edit:class");
    if (!canCreateOrEditClass) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    // Init
    const classId = req.params.id;

    const cls = {
        description: req.body.description.trim(),
    };

    // handle static validation errors
    const validationErrors = {};
    validateField("description", cls, validationErrors);
    const descriptionError = validationErrors.description;
    if (descriptionError) {
        return res.status(400).json({ error: { message: descriptionError.msg } });
    }

    const modifiedFields = {},
        removedFields = {};

    if (cls.description) {
        modifiedFields.description = cls.description;
    } else {
        removedFields.description = "";
    }

    classService.updateOne(classId, modifiedFields, removedFields);

    cls.descriptionPreview = cls.description ? markdownService.render(cls.description) : "";

    res.json(cls);
};

const getStaticValidationErrors = (cls) => {
    const validationErrors = {};

    validateField("name", cls, validationErrors);
    validateField("academicYear", cls, validationErrors);
    validateField("level", cls, validationErrors);
    validateField("description", cls, validationErrors);

    return validationErrors;
};

const validateField = (fieldName, data, validationErrors) => {
    switch (fieldName) {
        case "name":
            if (validator.isEmpty(data[fieldName])) {
                validationErrors[fieldName] = { msg: "Câmp obligatoriu" };
            } else if (!validator.isLength(data[fieldName], { max: 50 })) {
                validationErrors[fieldName] = { msg: "Maxim 50 caractere" };
            }
            break;
        case "academicYear":
            if (validator.isEmpty(data[fieldName])) {
                validationErrors[fieldName] = { msg: "Câmp obligatoriu" };
            } else if (!validator.isLength(data[fieldName], { min: 9, max: 9 })) {
                validationErrors[fieldName] = {
                    msg: "Fix 9 caractere (YYYY-YYYY)",
                };
            }
            break;
        case "level":
            if (data[fieldName]) {
                if (!validator.isLength(data[fieldName], { max: 50 })) {
                    validationErrors[fieldName] = { msg: "Maxim 50 caractere" };
                }
            }
            break;
        case "description":
            if (data[fieldName]) {
                if (!validator.isLength(data[fieldName], { max: 2000 })) {
                    validationErrors[fieldName] = {
                        msg: `Maxim 2000 caractere (actual:${data[fieldName].length})`,
                    };
                }
            }
            break;
    }
};

const flashAndReloadPage = (req, res, validationErrors, cls) => {
    // keep old values at page reload by setting a flash message (a key, followed by a value)
    req.flash("validationErrors", [validationErrors]); // flash ask us to always save as an array
    req.flash("initialValues", [cls]);
    const currentUrl = req.get("referer"); // "/signup?invitationCode=..."
    return res.redirect(currentUrl);
};
