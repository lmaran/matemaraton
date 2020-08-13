/**
 * @param {string} rp - the required permission
 */
exports.can = async (user, rp) => {
    if (!user) return false;
    const up = user.permissions || []; // user permissions

    // console.log(rp);
    // console.log(up);
    if (rp === "read:student/full-name") {
        return up.includes("*:*") || up.includes(rp);
    } else if (rp === "read:parents") {
        return up.includes("*:*") || up.includes(rp);
    } else if (rp === "create-or-edit:exercise") {
        return up.includes("*:*") || up.includes(rp);
    } else if (rp === "delete:exercise") {
        return up.includes("*:*") || up.includes(rp);
    } else if (rp === "create-or-edit:lesson") {
        return up.includes("*:*") || up.includes(rp);
    } else if (rp === "delete:lesson") {
        return up.includes("*:*") || up.includes(rp);
    }
};
