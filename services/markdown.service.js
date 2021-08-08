const katex = require("katex");
const tm = require("markdown-it-texmath");

// markdown-it-container - Plugin for creating block-level custom containers
// https://github.com/markdown-it/markdown-it-container
const ct = require("markdown-it-container");

// markdown-it-attrs - Add classes, identifiers and attributes to your markdown with {.class #identifier attr=value attr2="spaced value"} curly brackets
// https://www.npmjs.com/package/@gerhobbelt/markdown-it-attrs
const markdownItAttrs = require("@gerhobbelt/markdown-it-attrs");
const md = require("markdown-it")()
    .use(tm, {
        engine: katex,
        delimiters: "dollars",
        katexOptions: { macros: { "\\RR": "\\mathbb{R}" }, minRuleThickness: 0.05, fleqn: true },
    })
    //.use(ct, "divContainer") // I don't use it for now...maybe useful to render a list (or any block) inside a cell table
    .use(markdownItAttrs);

// use of "divContainer"
// ::: divContainer {.text-success}
// *here be dragons*
// :::

// added "minRuleThickness" option because dividing lines for \frac and \dfrac sometimes disappear (Chrome, zoom 100%)
// default value is 0.04 (as defined in Latex specs) and seems that Chrome rounds down  sub-pixel lines
// https://github.com/KaTeX/KaTeX/issues/1775#issuecomment-449762459
// https://github.com/KaTeX/KaTeX/pull/1964
// https://github.com/KaTeX/KaTeX/issues/824

// fleqn:true - for left align in "displayMode" (with a 2em left margin).
// by default, in "displayMode" the text is centered
// in Latex, there is a package (fleqn) for left align:
// https://tex.stackexchange.com/questions/28650/how-can-i-use-an-align-environment-flush-left

exports.render = (katex) => {
    md.renderer.rules.table_open = function () {
        return '<table class="table">';
    };

    return md.render(katex);
};
