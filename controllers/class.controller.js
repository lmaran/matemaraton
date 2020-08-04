const classService = require("../services/class.service");
const course2Service = require("../services/course2.service");
const editionService = require("../services/edition.service");
const autz = require("../services/autz.service");
const arrayHelper = require("../helpers/array.helper");
const stringHelper = require("../helpers/string.helper");

exports.getClass = async (req, res) => {
    const classId = req.params.classId;
    const cls = await classService.getClassById(classId);

    const courseSummary = await course2Service.getCourseSummaryByCode(cls.courseCode);

    const data = {
        class: cls,
        courseSummary,
        ctx: req.ctx,
        can: {
            viewParentsLink: await autz.can(req.user, "read:parents", { classId })
        }
    };

    //res.send(data);
    res.render("class/class", data);
};

exports.getClasses = async (req, res) => {
    //const classes = await classService.getAll();

    const [classes, editions] = await Promise.all([await classService.getAll(), await editionService.getAll()]);
    const editionsObj = arrayHelper.arrayToObject(editions, "academicYear");

    const activeClasses = [];
    const archivedClasses = [];
    classes.forEach(cls => {
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
        .forEach(function(academicYear) {
            orderedActiveClasses.push({
                editionNumber: editionsObj[academicYears1] && editionsObj[academicYears1].number,
                editionInterval: stringHelper.getIntervalFromAcademicYear(academicYear),
                values: unorderedActiveClasses[academicYear]
            });
        });

    const unorderedArchivedClasses = arrayHelper.groupBy(archivedClasses, "academicYear");
    const orderedArchivedClasses = [];
    const academicYears = Object.keys(unorderedArchivedClasses);
    academicYears
        .sort((a, b) => b - a) // sort by academicYear, desc
        .forEach(function(academicYear, idx) {
            orderedArchivedClasses.push({
                editionNumber: academicYears.length - idx,
                editionInterval: stringHelper.getIntervalFromAcademicYear(academicYear),
                values: unorderedArchivedClasses[academicYear]
            });
        });

    const data = {
        //activeClasses,
        orderedActiveClasses,
        orderedArchivedClasses

        // ctx: req.ctx,
        // can: {
        //     viewParentsLink: await autz.can(req.user, "read:parents", { classId })
        // }
    };

    //res.send(data);
    res.render("class/classes", data);
};
