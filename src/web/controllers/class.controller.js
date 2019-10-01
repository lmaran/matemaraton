const classService = require("../../shared/services/class.service");

exports.getClass = async (req, res) => {
    const classId = req.params.classId;
    const cls = await classService.getOneById(classId);

    const data = {
        class: cls,
        ctx: req.ctx
    };

    res.send(data);
    //res.render("class/class", data);
};
