const path = require("path");
const { ObjectId } = require("mongodb");

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
 * input: "Cuş Cuş.jpg"
 * output: "5f4bfb45d8278706d442058c.jpg"
 * @param {string} fileName
 */
exports.getUniqueFileName = (fileName) => {
    const parsedFile = path.parse(fileName); // Cuş Cuş.jpg
    // const fileNameWithoutExtension = parsedFile.name; // Cuş Cuş
    const fileExtensionWithDot = parsedFile.ext; // .jpg

    //const uniqueIdentifier = new ObjectId();
    return new ObjectId() + fileExtensionWithDot;
};
