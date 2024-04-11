const katex = require("katex");
const markdownItCollapsible = require("markdown-it-collapsible");
const markdownItTexMath = require("markdown-it-texmath");
const markdownItDiv = require("markdown-it-div");
const markdownItHighlightJS = require("markdown-it-highlightjs");

const md = require("markdown-it")();

md.use(markdownItCollapsible);

// If you use markdown-it-attrs, make sure to include it after markdown-it-highlightjs if you want inline code highlighting to work:
// https://github.com/valeriangalliat/markdown-it-highlightjs
md.use(markdownItHighlightJS);
md.use(markdownItDiv);

// added "minRuleThickness" option because dividing lines for \frac and \dfrac sometimes disappear (Chrome, zoom 100%)
// default value is 0.04 (as defined in Latex specs) and seems that Chrome rounds down  sub-pixel lines
// https://github.com/KaTeX/KaTeX/issues/1775#issuecomment-449762459
// https://github.com/KaTeX/KaTeX/pull/1964
// https://github.com/KaTeX/KaTeX/issues/824

// fleqn:true - for left align in "displayMode" (with a 2em left margin).
// by default, in "displayMode" the text is centered
// in Latex, there is a package (fleqn) for left align:
// https://tex.stackexchange.com/questions/28650/how-can-i-use-an-align-environment-flush-left
md.use(markdownItTexMath, {
    engine: katex,
    delimiters: "dollars",
    katexOptions: {
        macros: { "\\RR": "\\mathbb{R}", "\\Q": "\\mathbb{Q}" },
        minRuleThickness: 0.05,
        fleqn: true,
        throwOnError: false,
    },
});

exports.render = (source) => {
    md.renderer.rules.table_open = function () {
        return '<table class="table table-bordered table-sm">';
    };
    return md.render(source);
};
