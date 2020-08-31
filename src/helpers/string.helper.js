const path = require("path");
const { ObjectID } = require("mongodb");

exports.endsWithValueFromList = (str, endValues) => {
    return endValues.some(v => str.endsWith(v));
};

/**
 * input: 201920
 * output: 2019 - 2020
 */
exports.getIntervalFromAcademicYear = academicYear => {
    return `${academicYear.substr(0, 4)} - 20${academicYear.substr(4, 2)}`;
};

/**
 * input: "Cuş Cuş.jpg"
 * output: "5f4bfb45d8278706d442058c.jpg"
 * @param {string} fileName
 */
exports.getUniqueFileName = fileName => {
    const parsedFile = path.parse(fileName); // Cuş Cuş.jpg
    // const fileNameWithoutExtension = parsedFile.name; // Cuş Cuş
    const fileExtensionWithDot = parsedFile.ext; // .jpg

    //const uniqueIdentifier = new ObjectID();
    return new ObjectID() + fileExtensionWithDot;
};
