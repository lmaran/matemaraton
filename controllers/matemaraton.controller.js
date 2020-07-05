exports.getTrainingProgramForENSimulationEdition2 = async (req, res) => {
    const data = {
        // ctx: req.ctx,
    };
    res.render("matemaraton/program-simulare-en-editia-2", data);
};

exports.getTrainingProgramForSemestrialPaperEdition3 = async (req, res) => {
    const data = {
        // ctx: req.ctx,
    };
    res.render("matemaraton/program-teza-s1-editia-3", data);
};

exports.getProgramSimulareEnEditia3 = async (req, res) => {
    const data = {
        // ctx: req.ctx,
    };
    res.render("matemaraton/program-simulare-en-editia-3", data);
};

exports.getDocumentsForSemestrialPaper = async (req, res) => {
    const data = {
        // ctx: req.ctx,
    };
    res.render("matemaraton/materiale-teza-s1", data);
};

exports.getMaterialeSimulareEnEditia3 = async (req, res) => {
    const data = {
        // ctx: req.ctx,
    };
    res.render("matemaraton/materiale-simulare-en-editia-3", data);
};
