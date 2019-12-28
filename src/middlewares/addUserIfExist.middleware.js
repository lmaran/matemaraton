/* eslint-disable require-atomic-updates */
const authService = require("../services/auth.service");
const userService = require("../services/user.service");
const roleAssignmentsService = require("../services/roleAssignments.service");
const roleDefinitionsService = require("../services/roleDefinitions.service");

const cookieHelper = require("../helpers/cookie.helper");

exports.addUserIfExist = async (req, res, next) => {
    // this middleware depends on "cookie-parser"
    try {
        const token = req.cookies && req.cookies.access_token;
        if (!token) return next();
        // const jwtPayload = await jwt.verify(token, config.session_secret);
        const jwtPayload = await authService.getJwtPayload(token);

        // Attach user to request
        const userId = jwtPayload.data._id; // jwtPayload = {data:{_id, email...}, iat, exp}

        const [user, roleAssignments] = await Promise.all([
            await userService.getByIdWithoutPsw2(userId),
            await roleAssignmentsService.getRolesBySubjectId(userId.toString())
        ]);

        if (!user) {
            res.status(401).end();
        }

        // attach user roles
        user.roles = roleAssignments.map(r => r.roleName);

        // attach user permissions
        const roleDefinitions = await roleDefinitionsService.getRoleDefinitionsByRoleNames(user.roles);

        // TODO: take into account also "exclude-permissions", "deny-permissions" etc
        const permissions = [];
        roleDefinitions.forEach(r => {
            (r.allowPermissions || []).forEach(p => {
                permissions.push(p);
            });
        });
        user.permissions = [...new Set(permissions)]; // keep only unique values

        //const { roles, permissions } = await autz.getRolesAndPermissionsByUser(user);
        // console.log("roles:");
        // console.log(roles);
        // console.log("permissions:");
        // console.log(permissions);

        req.user = user;
        res.locals.user = user;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            // TODO: Silently renew the tokens
            cookieHelper.clearCookies(res);
            return res.redirect("/login");
        }
        return res.status(500).json(err.toString());
    }
};
