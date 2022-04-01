const katex = require("katex");
const tm = require("markdown-it-texmath");

const md = require("markdown-it")().use(tm, {
    engine: katex,
    delimiters: "dollars",
    katexOptions: { macros: { "\\RR": "\\mathbb{R}" }, minRuleThickness: 0.05, fleqn: true, throwOnError: false },
});

// added "minRuleThickness" option because dividing lines for \frac and \dfrac sometimes disappear (Chrome, zoom 100%)
// default value is 0.04 (as defined in Latex specs) and seems that Chrome rounds down  sub-pixel lines
// https://github.com/KaTeX/KaTeX/issues/1775#issuecomment-449762459
// https://github.com/KaTeX/KaTeX/pull/1964
// https://github.com/KaTeX/KaTeX/issues/824

// fleqn:true - for left align in "displayMode" (with a 2em left margin).
// by default, in "displayMode" the text is centered
// in Latex, there is a package (fleqn) for left align:
// https://tex.stackexchange.com/questions/28650/how-can-i-use-an-align-environment-flush-left

exports.render = (source) => {
    md.renderer.rules.table_open = function () {
        return '<table class="table">';
    };

    //console.log(source);
    return md.render(source);
};
