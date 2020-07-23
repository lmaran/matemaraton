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
