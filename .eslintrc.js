module.exports = {
    env: {
        es6: true,
        node: true,
        browser: true
    },
    extends: ["eslint:recommended"],
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module"
    },
    rules: {
        quotes: ["error", "double"],

        "no-var": "error",
        "prefer-const": ["error", { ignoreReadBeforeAssign: false }]
    },
    plugins: []
};
