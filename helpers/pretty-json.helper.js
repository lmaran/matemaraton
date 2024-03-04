const hljs = require("highlight.js/lib/core");
hljs.registerLanguage("json", require("highlight.js/lib/languages/json"));

/**
 *
 * @param {*} object
 * @returns
 */
exports.getPrettyJson = (object) => {
    // 1. format (indent, new lines)
    // In the .hbs file, it requires <pre>, <code> and 2 curly braces: "<pre><code class="hljs language-json">{{objectAsJson}}</code></pre>""
    const objectAsJson = JSON.stringify(object, null, 4);

    // 2. highlight (inject html tags in order to support colors, borders etc)
    // In the .hbs file, it requires <pre>, <code> and 3 curly braces: "<pre><code class="hljs language-json">{{{prettyJson}}}</code></pre>""
    const prettyJson = hljs.highlight(objectAsJson, { language: "json" }).value;
    return prettyJson;
};
