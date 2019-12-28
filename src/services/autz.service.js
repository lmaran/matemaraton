exports.can = async (user, permission) => {
    return user && (user.permissions || []).includes(permission);
};
