exports.getShortNameForStudent = (student) => {
    const shortFirstName = student.shortFirstName || student.firstName;
    const lastName = student.lastName || "";
    return `${shortFirstName} ${lastName.charAt(0)}.`;
};

exports.getFullNameForStudent = (student) => {
    const shortFirstName = student.shortFirstName || student.firstName;
    return `${shortFirstName} ${student.lastName}`;
};

exports.getLastAndShortNameForStudent = (student) => {
    const shortFirstName = student.shortFirstName || student.firstName;
    return `${student.lastName} ${shortFirstName}`;
};
