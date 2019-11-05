const { PageNotFound } = require("../errors/all.errors");

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
