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
 * https://www.educative.io/answers/splice-vs-slice-in-javascript
 */
exports.move = (array, fromIdx, toIdx) => {
    const elm = array.splice(fromIdx, 1)[0]; // remove one element from a specific index and returns the affected elements
    array.splice(toIdx, 0, elm); // add one element to a specific index
};

/**
 * Remove one element from a list (if exists) and add it to a new position
 * This  method mutes the original array, so be sure the input array is not null
 */
exports.moveOrInsertAtIndex = (array, newElement, keyName, newIdx) => {
    const oldIdx = array.findIndex((x) => x[keyName] == newElement[keyName]);
    if (newIdx == oldIdx) return; // if we keep the same position, we don't have to do anything

    // 1: remove the element (if exists)
    if (oldIdx > -1) array.splice(oldIdx, 1);

    // 2: add the element to the new position
    array.splice(newIdx, 0, newElement); // add one element to a specific index
};

// Input:  a list of chapters, lessons or any other items with at least an "id" field. The "name" field is required only if onlyValues=false.
// Output: result: {
//     availablePositions: [
//         {index: 0, name: "1: (înainte de) "Lectia 1"},
//         {index: 1, name: "2: (înainte de) "Lectia 1"},
//         {index: 2, name: "3: (ultima poziție)}
//     ],
//     selectedPosition: 0
// }
exports.getAvailablePositions = (items, itemId, onlyValues) => {
    // Omit "itemId" in "createMode".
    const result = {
        availablePositions: [],
        selectedPosition: -1,
    };

    let positionName;
    const itemsLength = items.length;
    const item = items.find((x) => x.id == itemId);
    if (item) {
        // only in edit mode we have an itemId
        let indexIncrement = 0;
        items.forEach((x, index) => {
            if (index + 1 < itemsLength) {
                if (x.id === itemId) {
                    indexIncrement = 1;
                }
                if (onlyValues) positionName = `${index + 1}`;
                else positionName = `${index + 1} (înainte de) "${items[index + indexIncrement].name}"`;
            } else {
                positionName = `${index + 1} (ultima poziție)`;
            }

            result.availablePositions.push({ index, name: positionName });

            if (x.id === itemId) {
                result.selectedPosition = index; // select the index of the current element
            }
        });
    } else {
        items.forEach((x, index) => {
            if (onlyValues) positionName = `${index + 1}`;
            else positionName = `${index + 1} (înainte de) "${x.name}"`;
            result.availablePositions.push({ index, name: positionName });
        });

        // Add a new position and set it as default
        result.availablePositions.push({
            index: itemsLength, // last position + 1
            name: `${itemsLength + 1} (ultima poziție)`,
        });

        result.selectedPosition = itemsLength;
    }
    return result;
};
exports.getAvailablePositions_old = (items, itemId, onlyValues) => {
    // Omit "itemId" in "createMode".
    const result = {
        availablePositions: [],
        selectedPosition: -1,
    };

    let positionName;
    const itemsLength = items.length;
    if (itemId) {
        // only in edit mode we have an itemId
        let indexIncrement = 0;
        items.forEach((x, index) => {
            if (index + 1 < itemsLength) {
                if (x.id === itemId) {
                    indexIncrement = 1;
                }
                if (onlyValues) positionName = `${index + 1}`;
                else positionName = `${index + 1} (înainte de) "${items[index + indexIncrement].name}"`;
            } else {
                positionName = `${index + 1} (ultima poziție)`;
            }

            result.availablePositions.push({ index, name: positionName });

            if (x.id === itemId) {
                result.selectedPosition = index; // select the index of the current element
            }
        });
    } else {
        items.forEach((x, index) => {
            if (onlyValues) positionName = `${index + 1}`;
            else positionName = `${index + 1} (înainte de) "${x.name}"`;
            result.availablePositions.push({ index, name: positionName });
        });

        // Add a new position and set it as default
        result.availablePositions.push({
            index: itemsLength, // last position + 1
            name: `${itemsLength + 1} (ultima poziție)`,
        });

        result.selectedPosition = itemsLength;
    }
    return result;
};
