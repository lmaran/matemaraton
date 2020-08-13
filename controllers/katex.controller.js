const katex = require("katex");

const tm = require("markdown-it-texmath").use(katex);
const md = require("markdown-it")().use(tm, { delimiters: "dollars", macros: { "\\RR": "\\mathbb{R}" } });

exports.getPreview = async (req, res) => {
    const katex = req.body.katex;
    const html = md.render(katex);
    res.status(201).json(html);
};
