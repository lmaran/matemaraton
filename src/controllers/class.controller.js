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

    const unorderedArchivedClasses = arrayHelper.groupBy(archivedClasses, "academicYear");

    // sort by academicYear, desc
    const orderedArchivedClasses = [];
    const academicYears = Object.keys(unorderedArchivedClasses);
    academicYears
        .sort((a, b) => b - a)
        .forEach(function(academicYear, idx) {
            orderedArchivedClasses.push({
                editionNumber: academicYears.length - idx,
                editionInterval: stringHelper.getIntervalFromAcademicYear(academicYear),
                values: unorderedArchivedClasses[academicYear]
            });
        });

    const data = {
        activeClasses,
        orderedArchivedClasses: orderedArchivedClasses

        // ctx: req.ctx,
        // can: {
        //     viewParentsLink: await autz.can(req.user, "read:parents", { classId })
        // }
    };

    //res.send(data);
    res.render("class/classes", data);
};
