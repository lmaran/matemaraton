/**
 * 37 --> 5.OL.37
 */
exports.getNewCode = (contest) => {
    const shortContestType = getShortContestType(contest.contestType);
    return `${contest.grade}.${shortContestType}.${contest.code}`;
};

/**
 * olimpiada-locala --> OL
 */
const getShortContestType = (contestType) => {
    switch (contestType) {
        case "olimpiada-locala":
            return "OL";
        case "olimpiada-judeteana":
            return "OJ";
        case "olimpiada-nationala":
            return "ON";
        case "alte-concursuri":
            return "C";
        default:
            return "X";
    }
};
