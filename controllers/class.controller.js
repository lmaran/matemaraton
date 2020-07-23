const classService = require("../services/class.service");
const autz = require("../services/autz.service");
const arrayHelper = require("../helpers/array.helper");
const stringHelper = require("../helpers/string.helper");

exports.getClass = async (req, res) => {
    const classId = req.params.classId;
    const cls = await classService.getClassById(classId);

    const data = {
        class: cls,
        ctx: req.ctx,
        can: {
            viewParentsLink: await autz.can(req.user, "read:parents", { classId })
        }
    };

    //res.send(data);
    res.render("class/class", data);
};

exports.getClasses = async (req, res) => {
    const classes = await classService.getAll();

    const activeClasses = [];
    const archivedClasses = [];
    classes.forEach(cls => {
        if (cls.isActive) {
            activeClasses.push(cls);
        } else {
            archivedClasses.push(cls);
        }
    });

    const unordered = arrayHelper.groupBy(archivedClasses, "academicYear");

    // sort by academicYear, desc
    const ordered = [];
    const keys = Object.keys(unordered);
    keys.sort((a, b) => b - a).forEach(function(key, idx) {
        ordered.push({
            editionNumber: keys.length - idx + 1,
            key: stringHelper.getIntervalFromAcademicYear(key),
            values: unordered[key]
        });
    });

    const data = {
        activeClasses,
        archivedClasses: ordered

        // ctx: req.ctx,
        // can: {
        //     viewParentsLink: await autz.can(req.user, "read:parents", { classId })
        // }
    };

    //res.send(data);
    res.render("class/classes", data);
};
