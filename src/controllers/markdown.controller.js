const markdownService = require("../services/markdown.service");

exports.getGetRenderedMarkdown = async (req, res) => {
    const markdown = req.body.markdown;
    const html = markdownService.render(markdown);
    res.status(201).json(html);
};
