const validator = require("validator");
const classService = require("../services/class.service");
const courseService = require("../services/course.service");
const editionService = require("../services/edition.service");
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
            viewParentsLink: await autz.can(req.user, "read:parents", { classId }),
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
        data.class = { academicYear: `${today.getFullYear()}-${today.getFullYear() + 1}` };
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

    // const gradeAvailableOptions = [
    //     { text: "Clasa a V-a", value: "5" },
    //     { text: "Clasa a VI-a", value: "6" },
    //     { text: "Clasa a VII-a", value: "7" },
    //     { text: "Clasa a VIII-a", value: "8" },
    // ];

    // const contestTypeAvailableOptions = [
    //     { text: "Olimpiadă, etapa locală", value: "olimpiada-locala" },
    //     { text: "Olimpiadă, etapa județeană", value: "olimpiada-judeteana" },
    //     { text: "Olimpiadă, etapa națională", value: "olimpiada-nationala" },
    //     { text: "Alte concursuri", value: "alte-concursuri" },
    // ];

    // const data = {
    //     isEditMode,
    //     // gradeAvailableOptions,
    //     // contestTypeAvailableOptions,
    // };
    // data.isEditMode = isEditMode;

    // if (isEditMode) {
    //     const cls = await classService.getOneById(classId);
    //     data.class = cls;
    // }

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
    const classId = req.params.id;
    const isEditMode = !!classId;

    const cls = {
        name: req.body.name,
        academicYear: req.body.academicYear,
        level: req.body.level,
        description: req.body.description,
    };

    cls.isHidden = req.body.isHidden === "on" ? true : false;
    cls.isCompleted = req.body.isCompleted === "on" ? true : false;

    // handle static validation errors
    const validationErrors = getStaticValidationErrors(cls);
    if (Object.keys(validationErrors).length > 0) {
        return flashAndReloadPage(req, res, validationErrors, cls);
    }

    if (isEditMode) {
        cls._id = classId;
        cls.modifiedOn = new Date();
        cls.modifiedById = req.user._id.toString();
        classService.updateOne(cls);
    } else {
        cls.createdOn = new Date();
        cls.createdById = req.user._id.toString();

        //const cleanCls = objectHelper.removeFalsyProperties(cls);

        const result = await classService.insertOne(cls);
        cls._id = result.insertedId;
    }

    res.redirect(`/clase/${cls._id}`);
};

exports.getAll = async (req, res) => {
    const [classes, editions] = await Promise.all([await classService.getAll(), await editionService.getAll()]);
    const editionsObj = arrayHelper.arrayToObject(editions, "academicYear");

    const activeClasses = [];
    const archivedClasses = [];
    classes.forEach((cls) => {
        if (cls.isActive) {
            activeClasses.push(cls);
        } else {
            archivedClasses.push(cls);
        }
    });

    const unorderedActiveClasses = arrayHelper.groupBy(activeClasses, "academicYear");
    const orderedActiveClasses = [];
    const academicYears1 = Object.keys(unorderedActiveClasses);
    academicYears1
        .sort((a, b) => b - a) // sort by academicYear, desc
        .forEach(function (academicYear) {
            orderedActiveClasses.push({
                editionNumber: editionsObj[academicYears1] && editionsObj[academicYears1].number,
                editionInterval: stringHelper.getIntervalFromAcademicYear(academicYear),
                values: unorderedActiveClasses[academicYear],
            });
        });

    const unorderedArchivedClasses = arrayHelper.groupBy(archivedClasses, "academicYear");
    const orderedArchivedClasses = [];
    const academicYears = Object.keys(unorderedArchivedClasses);
    academicYears
        .sort((a, b) => b - a) // sort by academicYear, desc
        .forEach(function (academicYear, idx) {
            orderedArchivedClasses.push({
                editionNumber: academicYears.length - idx,
                editionInterval: stringHelper.getIntervalFromAcademicYear(academicYear),
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
    //const isEditMode = !!classId;

    const cls = {
        _id: classId,
        description: req.body.description.trim(),
    };

    classService.updateOne(cls);

    if (cls.description) {
        cls.descriptionPreview = markdownService.render(cls.description);
    }

    //console.log(cls);

    // const canDeleteClass = await autz.can(req.user, "delete:class");
    // if (!canDeleteClass) {
    //     return res.status(403).send("Lipsă permisiuni!"); // forbidden
    // }

    // classService.deleteOneById(classId);
    //res.redirect("/clase");
    res.json(cls);
};

const getStaticValidationErrors = (cls) => {
    const validationErrors = {};

    if (validator.isEmpty(cls.name)) validationErrors["name"] = { msg: "Câmp obligatoriu" };
    else if (!validator.isLength(cls.name, { max: 50 })) validationErrors["name"] = { msg: "Maxim 50 caractere" };

    if (validator.isEmpty(cls.academicYear)) validationErrors["academicYear"] = { msg: "Câmp obligatoriu" };
    else if (!validator.isLength(cls.academicYear, { min: 9, max: 9 })) validationErrors["academicYear"] = { msg: "Fix 9 caractere (YYYY-YYYY)" };

    if (!validator.isLength(cls.level, { max: 50 })) validationErrors["level"] = { msg: "Maxim 50 caractere" };

    if (!validator.isLength(cls.description, { max: 2000 })) validationErrors["description"] = { msg: "Maxim 2000 caractere" };

    // // firstName
    // if (validator.isEmpty(firstName)) validationErrors.push({ field: "firstName", msg: "Câmp obligatoriu" });
    // else if (!validator.isLength(firstName, { max: 50 }))
    //     validationErrors.push({ field: "firstName", msg: "Maxim 50 caractere" });

    // if (validator.isEmpty(email)) validationErrors.push({ field: "email", msg: "Câmp obligatoriu" });
    // else if (!validator.isLength(email, { max: 50 }))
    //     validationErrors.push({ field: "email", msg: "Maxim 50 caractere" });
    // else if (!validator.isEmail(email)) validationErrors.push({ field: "email", msg: "Email invalid" });
    // // else if (await userService.getOneByEmail(email))
    // //     validationErrors.push({ field: "email", msg: "Exista deja un cont cu acest email" });

    // // password
    // if (validator.isEmpty(password)) validationErrors.push({ field: "password", msg: "Câmp obligatoriu" });
    // else if (!validator.isLength(password, { min: 6 }))
    //     validationErrors.push({ field: "password", msg: "Minim 6 caractere" });
    // else if (!validator.isLength(password, { max: 50 }))
    //     validationErrors.push({ field: "password", msg: "Maxim 50 caractere" });

    // // confirm password
    // if (validator.isEmpty(confirmPassword))
    //     validationErrors.push({ field: "confirmPassword", msg: "Câmp obligatoriu" });
    // else if (confirmPassword !== password)
    //     validationErrors.push({ field: "confirmPassword", msg: "Parolele nu coincid" });
    return validationErrors;
};

const flashAndReloadPage = (req, res, validationErrors, cls) => {
    // keep old values at page reload by setting a flash message (a key, followed by a value)
    req.flash("validationErrors", [validationErrors]); // flash ask us to always save as an array
    req.flash("initialValues", [cls]);
    const currentUrl = req.get("referer"); // "/signup?invitationCode=..."
    return res.redirect(currentUrl);
};
