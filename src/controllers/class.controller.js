const classService = require("../services/class.service");
const autz = require("../services/autz.service");

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
