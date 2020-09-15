module.exports = {
    env: {
        es6: true,
        node: true,
        browser: true,
        jest: true
    },
    extends: ["eslint:recommended", "prettier"],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module"
    },
    rules: {
        "no-var": "error",
        "prefer-const": ["error", { ignoreReadBeforeAssign: false }]
    },
    plugins: []
};
