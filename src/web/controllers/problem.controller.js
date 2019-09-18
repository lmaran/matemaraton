exports.getProblem = async (req, res) => {
    const problemId = req.params.id;

    const katex = require("katex");

    const tm = require("markdown-it-texmath").use(katex);
    const md = require("markdown-it")().use(tm, { delimiters: "dollars", macros: { "\\RR": "\\mathbb{R}" } });

    const str1 = "Sa se afle   c = \\pm\\sqrt{a^2 + b^2}";
    const str2 = "If we try $x^{b^b}$, it aligned well.";
    const str3 = "Sa se afle f(x) = \\int_{-\\infty}^\\infty\\hat f(\\xi)\\,e^{2 \\pi i \\xi x}\\,d\\xi";
    //var eq = "f(x) = \\pm\\sqrt{a^2 + b^2}"

    // const html2 = katex.renderToString(str1, {
    //     // throwOnError: false,
    //     displayMode: false
    // });

    //const html3 = md.render("Euler's identity $e^{ipi}+1=0$ is a beautiful formula in $\\RR 2$.");
    const p1 = md.render("Câte numere de forma $\\overline{x1yz}$ sunt divizibile cu 2?");

    const p2 = md.render(
        "In clasa a VI-a B sunt 32 de elevi care participă la cel puțin unul dintre concursurile COMPER si Olimpiada de matematica. Știind că 28 de elevi participă la concursul COMPER și 12 elevi participă la Olimpiada de matematică, determinați câți elevi participă doar la concursul COMPER."
    );

    const p3 = md.render(
        "Pentru amenajarea unui acvariu de formă cubică, cu muchia de 50 cm, se pun 15 kg de pietriș si 75 l de apă. Știind că 1 dm$^3$ de pietriș cântărește 0,6 kg, aflați până la ce înălțime se ridică apa in vas."
    );

    const q4 = `Dacă $a, b, c$ sunt numere naturale, arătați că 
    numărul $n = 27a + 81b + 9c + 45, x \\in \\mathbb{N}$ este multiplu de 9.`;
    const p4 = md.render(q4);
    // console.log(q4);

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
        // p1,
        p2,
        p3,
        p4,
        p5,
        p6,
        ctx: req.ctx
    };
    res.render("problem/problem", data);
    // res.send(html2);
};

exports.createProblem = async (req, res) => {
    const data = req.body;
    console.log(data.str);

    const katex = require("katex");

    const tm = require("markdown-it-texmath").use(katex);
    const md = require("markdown-it")().use(tm, { delimiters: "dollars", macros: { "\\RR": "\\mathbb{R}" } });
    data.strKatex = md.render(data.str);

    const md2 = require("markdown-it")();

    data.strMarkdown = md2.render(data.str);

    // data.strKatex = katex.renderToString(data.str, {
    //     // throwOnError: false,
    //     displayMode: false
    // });

    res.status(201).json(data);
};
