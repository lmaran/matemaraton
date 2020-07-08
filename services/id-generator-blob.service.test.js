const srcFile = require("./id-generator-blob.service.js");

describe("id-generator.service.getBatchSize()", () => {
    // let treeRow = {
    //     "measure-k1": 10,
    //     colLevel: 0,
    // };

    it("should return correct app-default batch size", () => {
        // arrange
        const scope = "exercises";
        const config = {};

        // act
        const actual = srcFile.getBatchSize(scope, config);

        // assert
        expect(actual).toEqual(3);
    });

    it("should return correct default batch size", () => {
        // arrange
        const scope = "exercises";
        const config = { idGenerator: { defaultBatchSize: 10 } };

        // act
        const actual = srcFile.getBatchSize(scope, config);

        // assert
        expect(actual).toEqual(10);
    });

    it("should return correct specific batch size", () => {
        // arrange
        const scope = "exercises";
        const config = { idGenerator: { defaultBatchSize: 10, specificBatchSize: { exercises: 5 } } };

        // act
        const actual = srcFile.getBatchSize(scope, config);

        // assert
        expect(actual).toEqual(5);
    });
});
