/**
 * @param {string} rp - the required permission
 */
exports.can = async (user, rp) => {
    const up = user && (user.permissions || []); // user permissions
    // console.log(rp);
    // console.log(up);
    if (rp === "read:student/full-name") {
        return up.includes("*:*") || up.includes(rp);
    } else if (rp === "read:parents") {
        return up.includes("*:*") || up.includes(rp);
    }
};
