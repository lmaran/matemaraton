const problemService = require("../services/problem.service");

const katex = require("katex");

const tm = require("markdown-it-texmath").use(katex);
const md = require("markdown-it")().use(tm, { delimiters: "dollars", macros: { "\\RR": "\\mathbb{R}" } });

exports.getProblems = async (req, res) => {
    const problems = await problemService.getAll();
    const data = { problems };
    //res.send(data);
    res.render("problem/problems", data);
};

exports.getProblem = async (req, res) => {
    const problemId = req.params.id;

    const problem = await problemService.getById(problemId);

    // problem.question.statement.text = md.render(problem.question.statement.text);

    const q5 = `Fie mulțimile $A = \\{ x \\in \\mathbb{N} \\mid x+3<8 \\}$ si $B = \\{ x \\in \\mathbb{N}, \\medspace x$ divizor al lui 10 $\\}.$\\
    a) Scrieți elementele mulțimilor $A$ si $B$.
    `;

    problem.question.statement.textPreview = md.render(problem.question.statement.text);

    // const data = { problem, testOriginal: q5, test: md.render(q5) };
    const data = { problem };
    //res.send(data);
    res.render("problem/problem", data);
};

exports.editProblem = async (req, res) => {
    const problemId = req.params.id;

    const problem = await problemService.getById(problemId);

    // problem.question.statement.text = md.render(problem.question.statement.text);

    const q5 = `Fie mulțimile $A = \\{ x \\in \\mathbb{N} \\mid x+3<8 \\}$ si $B = \\{ x \\in \\mathbb{N}, \\medspace x$ divizor al lui 10 $\\}.$\\
    a) Scrieți elementele mulțimilor $A$ si $B$.
    `;

    problem.question.statement.textPreview = md.render(problem.question.statement.text);

    // const data = { problem, testOriginal: q5, test: md.render(q5) };
    const data = { problem };
    //res.send(data);
    res.render("problem/problem-edit", data);
};

exports.editProblem2 = async (req, res) => {
    const problemId = req.params.id;

    const str1 = "Sa se afle   c = \\pm\\sqrt{a^2 + b^2}";
    const str2 = "If we try $x^{b^b}$, it aligned well.";
    const str3 = "Sa se afle f(x) = \\int_{-\\infty}^\\infty\\hat f(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi";

    const p1 = md.render("Câte numere de forma $\\overline{x1yz}$ sunt divizibile cu 2?");

    const p2 = md.render(
        "In clasa a VI-a B sunt 32 de elevi care participă la cel puțin unul dintre concursurile COMPER si Olimpiada de matematica. Știind că 28 de elevi participă la concursul COMPER și 12 elevi participă la Olimpiada de matematică, determinați câți elevi participă doar la concursul COMPER."
    );

    const q5 = `Fie mulțimile $A = \\{ x \\in \\mathbb{N} \\mid x+3<8 \\}$ si $B = \\{ x \\in \\mathbb{N}, \\medspace x$ divizor al lui 10 $\\}.$\\
    a) Scrieți elementele mulțimilor $A$ si $B$.
    `;

    //a) Scrieți elementele mulțimilor $A$ si $B$.$\\$
    // b) Determinati $A \\cup B, \\enspace A \\cap B, \\enspace B \\setminus A, \\enspace A \\setminus \\mathbb{N}, \\enspace A \\setminus \\mathbb{N}^*$
    // `;
    const p5 = md.render(q5);

    // daca vrei sa scrii pe mai multe randuri, foloseste 5 backslash la sfarsit (4 pt. latex newline si 1 pt. "/n" - care nu se vede)
    // daca vrei sa scrii totul pe un sg. rand, folosesti 4 backslash (ecuatiile apar oricum pe randuri diferite)
    const q6 = "$\\begin{aligned} x+5 &= 30 \\\\\
    x+5-5 &= 30-5 \\\\\
    x &= 25 \\end{aligned}$";

    // begin{align} x+5 &= 30 \\\\\nx+5-5 &= 30-5 \\\\\nx &= 25 \\end{align}

    const p6 = md.render(q6);

    // console.log(q6);

    const data = {
        problemId,
        p2,
        p5,
        p6,
        ctx: req.ctx
    };
    res.render("problem/problem-edit2", data);
    // res.send(html2);
};

exports.createKatekPreview = async (req, res) => {
    const problemStatementKatex = req.body.problemStatement;
    const problemStatementHtml = md.render(problemStatementKatex);
    res.status(201).json(problemStatementHtml);
};

exports.updateProblem = async (req, res) => {
    const problemId = req.params.id;
    const problemStatement = req.body.problemStatement;
    // console.log(problemStatement);

    const problem = await problemService.getById(problemId);

    // console.log(problem);

    problem.question.statement.text = problemStatement;

    problemService.updateOne(problem); // don't have to await

    // update preview field also
    problem.question.statement.textPreview = md.render(problem.question.statement.text);
    res.status(200).json(problem); // or res.status(204).send();  fo No Content
};
