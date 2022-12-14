const validator = require("validator");
const emailService = require("../services/email.service");
const classService = require("../services/class.service");
const enrollService = require("../services/enroll.service");
const dateTimeHelper = require("../helpers/date-time.helper");

exports.enrollInClassGet = async (req, res) => {
    const classId = req.params.classId;

    // Get an array of flash errors (or initial values) by passing the key
    const validationErrors = req.flash("validationErrors");
    const initialValues = req.flash("initialValues");

    let errors = {};
    const uiData = {};
    if (validationErrors.length > 0) {
        errors = validationErrors[0];
    }

    let data = {};

    if (initialValues.length === 0) {
        // initial request
        const cls = await classService.getOneById(classId);

        data.classId = cls._id;
        data.className = cls.name;
        data.classLevel = cls.level;
        data.classEnrollStatus = cls.enrollmentInfo && cls.enrollmentInfo.status;
        data.classIsActive = !cls.isCompleted;
    } else {
        //redirect after validation
        data = initialValues[0];
    }

    // set autofocus properties
    if (validationErrors.length > 0) {
        if (Object.keys(errors).length > 0) {
            const firstFieldWithError = Object.keys(errors)[0];
            uiData[firstFieldWithError] = { hasAutofocus: true };
        }
    } else {
        // no errors (e.g. first page request) => focus on first field
        uiData.studentLastName = { hasAutofocus: true };
    }

    //res.send(data);
    res.render("enroll/enroll-in-class", { data, uiData, errors });
};

exports.enrollInClassPost = async (req, res) => {
    try {
        // static validations
        const validationErrors = getStaticValidationErrors(req);
        if (Object.keys(validationErrors).length > 0) {
            return flashAndReloadPage(req, res, validationErrors);
        }

        // dynamic validations
        if (!req.user.isAdmin) {
            const enrollRequestsByParent = await enrollService.getAllByClassIdAndParentId(req.body.classId, req.user._id);
            if (enrollRequestsByParent.length > 0) {
                const validationErrors = [
                    {
                        page: {
                            msg: "Puteți înscrie maxim un elev (propriul copil). In cazul în care aveți doi copii pe care doriți să-i înscrieți la aceeași clasă (ex: gemeni), vom trata acest caz ca pe o excepție. In acest sens, vă rugăm să trimiteți datele celui de-al 2-lea copil pe email, la adresa lucian.maran@gmail.com.",
                        },
                    },
                ];
                return flashAndReloadPage(req, res, validationErrors);
            }
        }

        const enroll = {
            classId: req.body.classId,
            parentId: req.user._id,
            studentLastName: req.body.studentLastName,
            studentFirstName: req.body.studentFirstName,
            mathAvgGrade1: req.body.mathAvgGrade1,
            mathAvgGrade2: req.body.mathAvgGrade2,
            schoolName: req.body.schoolName,
            observations: req.body.observations,
            createdOn: new Date(),
            createdBy: req.user._id,
        };

        await enrollService.insertOne(enroll);

        const emailObj = {
            to: "lucian.maran@gmail.com",
            subject: `Inscriere nouă: ${req.body.studentFirstName} ${req.body.studentLastName} (${req.body.className})`,
            html: `<html>
            Note: ${req.body.mathAvgGrade1}, ${req.body.mathAvgGrade2} </br>
            Școala: ${req.body.schoolName} </br>
            Lista tuturor elevilor înscriși la această clasă este  
            <a href="https://matemaraton.ro/clase/${req.body.classId}/inscrieri">aici</a>.
            </html>`,
        };

        await emailService.sendEmail(emailObj);

        // res.redirect("/enroll/confirm-success");
        res.redirect(`/clase/${req.body.classId}/inscrieri`);
    } catch (err) {
        // // handle dynamic validation errors
        // const validationErrors = [];
        // if (err.message === "EmailAlreadyExists") {
        //     validationErrors.push({ field: "email", msg: "Există deja un cont cu acest email" });
        // }
        // if (validationErrors.length) {
        //     return flashAndReloadSignupPage(req, res, validationErrors);
        // }
        // // @TODO display an error message (without details) and log the details
        // return res.status(500).json(err.message);
    }
};

exports.getAllPerClass = async (req, res) => {
    const classId = req.params.classId;

    const [cls, enrollments] = await Promise.all([await classService.getOneById(classId), await enrollService.getAllByClassId(classId)]);
    // const enrollments = await enrollService.getAllByClassId(classId);

    enrollments.forEach((x) => {
        const createdOnAsUtc = convertDateToUTC(x.createdOn);

        const offset = -3 * 60; // Romania, EEST // TODO; deal with Time Offset (EST/EEST) as here: https://www.timeanddate.com/time/zone/romania/bucharest

        const createdOnAsLocal = new Date(createdOnAsUtc.getTime() - offset * 60000); // https://docs.mongodb.com/manual/tutorial/model-time-data/#example

        x.createdOn = dateTimeHelper.getShortDateAndTimeDate(createdOnAsLocal);

        x.studentShortName = `${x.studentFirstName} ${x.studentLastName.charAt(0)}.`;
    });

    const data = { class: cls, enrollments };

    //res.send(data);
    res.render("enroll/enrollments-per-class", data);
};

// function createDateAsUTC(date) {
//     return new Date(
//         Date.UTC(
//             date.getFullYear(),
//             date.getMonth(),
//             date.getDate(),
//             date.getHours(),
//             date.getMinutes(),
//             date.getSeconds()
//         )
//     );
// }

function convertDateToUTC(date) {
    // TODO: move this part in date-time helper
    // https://stackoverflow.com/a/14006555
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

const getStaticValidationErrors = (req) => {
    const { studentLastName, studentFirstName, mathAvgGrade1, mathAvgGrade2, schoolName, observations } = req.body;
    try {
        const validationErrors = {};

        // studentLastName
        if (validator.isEmpty(studentLastName)) validationErrors.studentLastName = { msg: "Câmp obligatoriu" };
        else if (!validator.isLength(studentLastName, { max: 50 })) validationErrors.studentLastName = { msg: "Maxim 50 caractere" };

        // studentFirstName
        if (validator.isEmpty(studentFirstName)) validationErrors.studentFirstName = { msg: "Câmp obligatoriu" };
        else if (!validator.isLength(studentFirstName, { max: 50 })) validationErrors.studentFirstName = { msg: "Maxim 50 caractere" };

        // mathAvgGrade1
        if (!validator.isLength(mathAvgGrade1, { max: 50 })) validationErrors.mathAvgGrade1 = { msg: "Maxim 50 caractere" };

        // mathAvgGrade2
        if (!validator.isLength(mathAvgGrade2, { max: 50 })) validationErrors.mathAvgGrade2 = { msg: "Maxim 50 caractere" };

        // schoolName
        if (!validator.isLength(schoolName, { max: 50 })) validationErrors.schoolName = { msg: "Maxim 50 caractere" };

        // observations
        if (!validator.isLength(observations, { max: 250 })) validationErrors.observations = { msg: "Maxim 250 caractere" };

        return validationErrors;
    } catch (err) {
        throw new Error(err);
    }
};

const flashAndReloadPage = (req, res, validationErrors) => {
    // keep old values at page reload by setting a flash message (a key, followed by a value)
    req.flash("validationErrors", validationErrors);
    req.flash("initialValues", req.body); // the initialValues are automatically sent as an array
    const currentUrl = req.get("referer"); // "/signup?invitationCode=..."
    return res.redirect(currentUrl);
};
