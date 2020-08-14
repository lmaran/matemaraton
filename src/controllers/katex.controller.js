const katexService = require("../services/katex.service");

exports.getPreview = async (req, res) => {
    const katex = req.body.katex;
    const html = katexService.render(katex);
    res.status(201).json(html);
};
