exports.endsWithValueFromList = (str, endValues) => {
    return endValues.some((v) => str.endsWith(v));
};

/**
 * input: 201920
 * output: 2019 - 2020 (or 2019-2020)
 */
exports.getIntervalFromAcademicYear = (academicYear, noSpace) => {
    if (!academicYear || academicYear.length != 6) return academicYear;
    const space = noSpace ? "" : " ";
    return `${academicYear.substr(0, 4)}${space}-${space}20${academicYear.substr(4, 2)}`;
};

/**
 * input: 2019-2020
 * output: 201920
 */
exports.getAcademicYearFromInterval = (interval) => {
    if (!interval || interval.length != 9) return interval;
    return `${interval.substr(0, 4)}${interval.substr(7, 2)}`;
};

/**
 * input: "my-file.jpg"
 * output: "jpg"
 * @param {string} fileName
 * https://stackoverflow.com/a/1203361
 */
exports.getFileExtension = (fileName) => {
    const a = fileName.split(".");
    if (a.length === 1 || (a[0] === "" && a.length === 2)) {
        return "";
    }
    return a.pop().toString();
};
