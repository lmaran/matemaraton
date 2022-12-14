// TODO avoid duplicates by using a single helper file for client and server side

// convert an array to an object by specified key
// https://medium.com/dailyjs/rewriting-javascript-converting-an-array-of-objects-to-an-object-ec579cafbfc7
// input: [
//     { id: 123, name: "dave", age: 23 },
//     { id: 456, name: "chris", age: 23 }
// ]
// arrayToObject(input, "id");
// output: {
//     "123": { id: 123, name: "dave", age: 23 },
//     "456": { id: 456, name: "chris", age: 23 }
// }
exports.arrayToObject = (array, key) =>
    array.reduce((acc, crt) => {
        acc[crt[key]] = crt;
        return acc;
    }, {});

// object must have a key-value format
// input: {
//      "1": { age : 23 },
//      "2": { age : 31 }
// }
// objectToArray(input);
// output: [
//      { age : 23 },
//      { age : 31 }
// ]
exports.objectToArray = (object) => Object.keys(object).map((key) => object[key]);
// or:
// object => Object.keys(object).reduce((acc, key) => {
//     acc.push(object[key]);
//     return acc;
// }, []);

// input: [
//     { id: 123, name: "dave", age: 23 },
//     { id: 123, name: "chris", age: 23 },
//     { id: 456, name: "john", age: 25 }
// ]
// groupBy(groupBy, "id")
// output: {
//     "123": [
//          { id: 123, name: "dave", age: 23 },
//          { id: 456, name: "chris", age: 23 }
//      ],
//     "456": [
//          { id: 456, name: "john", age: 25 }
//      ],
// }
exports.groupBy = (array, key) => {
    return array.reduce((acc, crt) => {
        (acc[crt[key]] = acc[crt[key]] || []).push(crt);
        return acc;
    }, {});
};

// see class.controller.js
exports.groupBySubKey = (array, key, subKey) => {
    return array.reduce((acc, crt) => {
        (acc[crt[key][subKey]] = acc[crt[key][subKey]] || []).push(crt);
        return acc;
    }, {});
};

/**
 * Move one element in an array from one index to another
 * https://dev.to/jalal246/moving-element-in-an-array-from-index-to-another-464b
 */
exports.move = (array, fromIdx, toIdx) => {
    const elm = array.splice(fromIdx, 1)[0];
    array.splice(toIdx, 0, elm);
};
