/* eslint-disable require-atomic-updates */
const authService = require("../services/auth.service");
const userService = require("../services/user.service");
const roleAssignmentsService = require("../services/role-assignments.service");
const roleDefinitionsService = require("../services/role-definitions.service");

const cookieHelper = require("../helpers/cookie.helper");

exports.addUserIfExist = async (req, res, next) => {
    // this middleware depends on "cookie-parser"
    try {
        let token = req.cookies && req.cookies.access_token;
        if (!token) return next();

        let jwtPayload;

        try {
            jwtPayload = await authService.getJwtPayload(token);
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                // Silently renew tokens
                let refreshToken = req.cookies && req.cookies.refresh_token;

                // details about the wrapping parenthesis: https://stackoverflow.com/a/35576419
                ({ token, refreshToken } =
                    await authService.getTokensFromRefreshToken(refreshToken));

                // save the new values for further use
                cookieHelper.setCookies(res, token, refreshToken);

                // use the new payload
                jwtPayload = await authService.getJwtPayload(token);
            }
        }

        // Attach user to request
        const userId = jwtPayload.data._id; // jwtPayload = {data:{_id, email...}, iat, exp}

        const [user, roleAssignments] = await Promise.all([
            await userService.getOneByIdWithoutPsw(userId),
            await roleAssignmentsService.getRolesBySubjectId(userId.toString()),
        ]);

        if (!user) {
            cookieHelper.clearCookies(res);
            return next();
        }

        // attach user roles
        user.roles = roleAssignments.map((r) => r.roleName);

        // attach user permissions
        const roleDefinitions =
            await roleDefinitionsService.getRoleDefinitionsByRoleNames(
                user.roles
            );

        // TODO: take into account also "exclude-permissions", "deny-permissions" etc
        const permissions = [];
        roleDefinitions.forEach((r) => {
            (r.allowPermissions || []).forEach((p) => {
                permissions.push(p);
            });
        });
        user.permissions = [...new Set(permissions)]; // keep only unique values

        req.user = user;
        next();
    } catch (err) {
        cookieHelper.clearCookies(res);
        return next();
    }
};
