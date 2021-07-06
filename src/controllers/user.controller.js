const userService = require("../services/user.service");
const personService = require("../services/person.service");
const autz = require("../services/autz.service");
const dateTimeHelper = require("../helpers/date-time.helper");

exports.getAll = async (req, res) => {
    const canReadUsers = await autz.can(req.user, "read:users");
    if (!canReadUsers) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const users = await userService.getAll();

    users.forEach(user => {
        user.createdOn = dateTimeHelper.getShortDate(user.createdOn);
    });

    const data = {
        users,
        canReadUsers
    };
    //res.send(data);
    res.render("user/user-list", data);
};

exports.getOneById = async (req, res) => {
    const canReadUser = await autz.can(req.user, "read:user");
    if (!canReadUser) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    const user = await userService.getOneByIdWithoutPsw(req.params.id);
    user.createdOn = dateTimeHelper.getShortDate(user.createdOn);

    if(user && user.email){
        const person = await personService.getOneByEmail(user.email);
        //console.log(person);
        if(person){
            if(person.isParent && person.studentIds){
                person.students = await personService.getAllByIds(person.studentIds);
            }
            if(person.isStudent && person.parentsIds){
                person.parents = await personService.getAllByIds(person.parentsIds);
            }
            user.person = person;
        }
        
    }

    const data = {
        user,
        canReadUser,
        canDeleteUser: await autz.can(req.user, "delete:user"),
    };
    //res.send(data);
    res.render("user/user", data);
};

exports.deleteOneById = async (req, res) => {
    //const userId = req.body.userId;
    const userId = req.params.id;
    const canDelete = await autz.can(req.user, "delete:user");
    if (!canDelete) {
        return res.status(403).send("Lipsă permisiuni!"); // forbidden
    }

    // const user = await userService.getOneById(id);
    // if (contest.exercises && contest.exercises.length > 0) {
    //     return res.status(403).send("Șterge întâi exercițiile!");
    // }

    userService.deleteOneById(userId);
    res.redirect("/utilizatori");
};