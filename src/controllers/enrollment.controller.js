const classService = require("../services/class.service");
const enrollService = require("../services/enroll.service");
const dateTimeHelper = require("../helpers/date-time.helper");

exports.enrollInClassGet = async (req, res) => {
    const classId = req.params.classId;
    const classes = await classService.getOpenEnrollments();
    const cls = await classService.getOneById(classId);

    const data = {
        user: req.user,
        class: cls,
        selectedClassId: classId,
        classes,
        ctx: req.ctx,

        can: {
            //viewParentsLink: await autz.can(req.user, "read:parents", { classId })
        }
    };

    //res.send(data);
    res.render("enroll/enroll-in-class", { data });
};

exports.enrollInClassPost = async (req, res) => {
    try {
        const {
            parentId,
            studentLastName,
            studentFirstName,
            classId,
            mathAvgGrade1,
            mathAvgGrade2,
            schoolName,
            observations
        } = req.body;

        const enroll = {
            parentId,
            studentLastName,
            studentFirstName,
            classId,
            mathAvgGrade1,
            mathAvgGrade2,
            schoolName,
            observations,
            createdOn: new Date(),
            createdBy: parentId
        };

        await enrollService.insertOne(enroll);

        // // handle static validation errors
        // const validationErrors = getSignupStaticValidationErrors(firstName, lastName, email, password, confirmPassword);
        // if (validationErrors.length) {
        //     return flashAndReloadSignupPage(req, res, validationErrors);
        // }

        // res.redirect("/enroll/confirm-success");
        res.redirect(`/clase/${classId}/inscrieri`);
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

    const [cls, enrollments] = await Promise.all([
        await classService.getOneById(classId),
        await enrollService.getAllByClassId(classId)
    ]);
    // const enrollments = await enrollService.getAllByClassId(classId);

    enrollments.forEach(x => {
        const createdOnAsUtc = convertDateToUTC(x.createdOn);

        const offset = -3 * 60; // Romania, EEST // TODO; deal with Time Offset (EST/EEST) as here: https://www.timeanddate.com/time/zone/romania/bucharest

        const createdOnAsLocal = new Date(createdOnAsUtc.getTime() - offset * 60000); // https://docs.mongodb.com/manual/tutorial/model-time-data/#example

        const f = dateTimeHelper.getFriendlyDate(createdOnAsLocal);
        x.createdOn = f.dmy + " " + f.time;
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
    return new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds()
    );
}
