const matemaratonService = require("../services/matemaraton.service");
const { PageNotFound } = require("../errors/all.errors");
const dateTimeHelper = require("../helpers/date-time.helper");
const arrayHelper = require("../helpers/array.helper");

exports.getTrainingProgramForENSimulation = async (req, res) => {
    const data = {
        // ctx: req.ctx,
    };
    res.render("matemaraton/pregatire-simulare-en", data);
};

exports.getMatemaraton = async (req, res, next) => {
    // get edition (and its associated period)
    // edition = {period:'201819', edition:'2', ...}
    const editionName = req.params.edition; // "edition-2"
    // let edition = null;
    if (editionName) {
        const editionSegments = editionName.split("-");
        if (editionSegments.length !== 2) {
            const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
            return next(err);
        } else {
            const data = {
                editionNumber: editionSegments[1]
            };
            res.render(`matemaraton/${editionName}`, data);
        }
    } else {
        // edition = await matemaratonService.getCurrentEdition();
        const data = {
            ctx: req.ctx
        };
        res.render("home", data);
    }
};

exports.getCoursesPerGroup = async (req, res, next) => {
    // get edition (and its associated period)
    // edition = {period:'201819', edition:'2', ...}
    const editionName = req.params.edition; // "edition-2"
    let edition = null;
    if (editionName) {
        const editionSegments = editionName.split("-");
        if (editionSegments.length !== 2) {
            const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
            return next(err);
        } else {
            edition = await matemaratonService.getSelectedEdition(editionSegments[1]);
        }
    } else {
        edition = await matemaratonService.getCurrentEdition();
    }

    if (!edition) {
        const err = new PageNotFound(`Pagina negasita2: ${req.method} ${req.url}`);
        return next(err);
    }

    const period = edition.period; // 201819

    // check group name
    const groupId = req.params.groupId;
    const routeParamWhitelist = ["8-avansati", "8-incepatori", "5-avansati"];
    if (!routeParamWhitelist.includes(groupId)) {
        const err = new PageNotFound(`Pagina negasita: ${req.method} ${req.url}`);
        return next(err);
    }

    const [grade, groupName] = groupId.split("-");

    const coursesPerGroups = await matemaratonService.getCoursesPerGroup(period, grade, groupName);

    coursesPerGroups.forEach(coursePerWeek => {
        coursePerWeek.dateAsString = dateTimeHelper.getStringFromStringNoDay(coursePerWeek.date);
    });

    //res.send(coursesPerGroups);
    const data = {
        grade,
        groupName,
        coursesPerGroups,
        // presencePerStudents,
        // totalCourses,
        totalCourses: coursesPerGroups.length
    };
    //res.send(data);
    res.render("matemaraton/courses-per-group", data);
};

exports.getCourse = async (req, res) => {
    const courseId = req.params.courseId;
    const course = await matemaratonService.getCourse(courseId);

    course.dateAsString = dateTimeHelper.getStringFromStringNoDay(course.date);

    //res.send(coursesPerGroups);
    const data = {
        course
    };
    // res.send(data);
    res.render("matemaraton/course", data);

    //res.send("test2");
};

// sort student by 'totalPresences' (desc), then by 'shortName' (asc); https://flaviocopes.com/how-to-sort-array-of-objects-by-property-javascript/
const sortByPresence = (a, b) =>
    a.totalPresences > b.totalPresences
        ? -1
        : a.totalPresences === b.totalPresences
        ? a.shortName > b.shortName
            ? 1
            : -1
        : 1;
