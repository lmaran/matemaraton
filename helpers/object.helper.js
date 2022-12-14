exports.removeFalsyProperties = (obj) => {
    /**
     * Filter all falsy values ( "", 0, false, null, undefined )
     * https://stackoverflow.com/a/57625661
     * input: {a:null, b:123, c:"", d:0}
     * output: {b:123}
     */
    return Object.entries(obj).reduce((a, [k, v]) => (v ? ((a[k] = v), a) : a), {});
};
