export const stringHelper = {
    /**
     * input: "my-file.jpg"
     * output: "jpg"
     * @param {string} fileName
     * https://stackoverflow.com/a/1203361
     */
    getFileExtension: (fileName) => {
        const a = fileName.split(".");
        if (a.length === 1 || (a[0] === "" && a.length === 2)) {
            return "";
        }
        return a.pop().toString();
    },
};
