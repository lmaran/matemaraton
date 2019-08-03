// import { mongoHelper } from "../helpers";
// import { IUser } from "../interfaces";

// const collection = "users";

// export const userService = {
//     getAll: async (): Promise<IUser[]> => {
//         const db = await mongoHelper.getDb();
//         const users = await db
//             .collection(collection)
//             .find()
//             .toArray();
//         return users;
//     },

//     getOneById: async (id: any) => {
//         const db = await mongoHelper.getDb();
//         id = mongoHelper.normalizedId(id);
//         const user = await db.collection(collection).findOne({ _id: id });
//         return user;
//     },

//     insertOne: async (user: IUser) => {
//         const db = await mongoHelper.getDb();
//         return await db.collection(collection).insertOne(user);
//     },

//     updateOne: async (user: any) => {
//         const db = await mongoHelper.getDb();
//         user._id = mongoHelper.normalizedId(user._id);
//         return await db.collection(collection).updateOne({ _id: user._id }, user);
//     },

//     deleteOneById: async (id: any) => {
//         const db = await mongoHelper.getDb();
//         id = mongoHelper.normalizedId(id);
//         return await db.collection(collection).deleteOne({ _id: id });
//     },
// };
