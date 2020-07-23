const srcFile = require("./string.helper.js");

describe("getIntervalFromAcademicYear()", () => {
    // let treeRow = {
    //     "measure-k1": 10,
    //     colLevel: 0,
    // };

    it("should return correct value", () => {
        // arrange
        // const scope = "exercises";
        // const config = {};

        // act
        const actual = srcFile.getIntervalFromAcademicYear("201920");

        // assert
        expect(actual).toEqual("2019 - 2020");
    });
});
