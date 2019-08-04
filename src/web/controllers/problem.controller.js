exports.getProblem = async (req, res) => {
    const problemId = req.params.id;

    const katex = require("katex");

    const html2 = katex.renderToString("c = \\pm\\sqrt{a^2 + b^2}", {
        // throwOnError: false,
        displayMode: true
    });

    // console.log(html2);

    const data = {
        problemId,
        html2,
        ctx: req.ctx
    };
    res.render("problem/problem", data);
    // res.send(html2);
};
