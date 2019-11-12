exports.getShortNameForStudent = student => {
    const shortFirstName = student.shortFirstName || student.firstName;
    const lastName = student.lastName || "";
    return `${shortFirstName} ${lastName.charAt(0)}.`;
};

exports.getGradeAndLetterForStudent = (student, academicYear) => {
    let gradeAndLetter = "";
    const actualStudentAcademicYearInfo =
        student.academicYearRelatedInfo && student.academicYearRelatedInfo[academicYear];
    if (actualStudentAcademicYearInfo) {
        gradeAndLetter = `${actualStudentAcademicYearInfo.grade}${actualStudentAcademicYearInfo.classLetter}`;
    }
    return gradeAndLetter;
};