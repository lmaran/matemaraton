// // import * as Ajv from "ajv";
// import { Request, Response } from "express";
// import { IUser } from "../interfaces";
// import { userService } from "../services";
// // const userSchema = require("../interfaces/user/user.schema");

// export const userAdminApiController = {
//     getAll: async (req: Request, res: Response) => {
//         const users = await userService.getAll();
//         console.log(users[0]);
//         res.json(users);
//     },

//     getOneById: async (req: Request, res: Response) => {
//         const userId = req.params.id;

//         const user = await userService.getOneById(userId);
//         res.json(user);
//     },

//     // insertOne: async (req: Request, res: Response) => {
//     //     // console.log("aaa");
//     //     // Validate request
//     //     // if (!req.body) {
//     //     //     return res.status(400).send({
//     //     //         message: "User content can not be empty",
//     //     //     });
//     //     // }

//     //     const ajv = new Ajv({
//     //         allErrors: true, // Default is to return after the first error.
//     //         removeAdditional: true, // This option modifies original data (remove undefined properties)
//     //     });
//     //     const validate = ajv.compile(userSchema);
//     //     const isValidUser = validate(req.body);

//     //     if (isValidUser) {
//     //         const user: IUser = req.body;
//     //         await userService.insertOne(user);
//     //         res.json(user);
//     //     } else {
//     //         console.log(validate.errors);
//     //         res.status(400).json(validate.errors);
//     //     }
//     // },

//     updateOne: async (req: Request, res: Response) => {
//         // console.log("aaa");
//         // Validate request
//         if (!req.body) {
//             return res.status(400).send({
//                 message: "User content can not be empty",
//             });
//         }

//         const user = req.body;

//         await userService.updateOne(user);
//         res.json(user);

//         // res.json({name: "aaa"});
//     },

//     deleteOneById: async (req: Request, res: Response) => {
//         const userId = req.params.id;

//         await userService.deleteOneById(userId);
//         // res.status(204).send();
//         res.sendStatus(204);
//     },
// };
