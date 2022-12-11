//const srcFile = require("./http.helper.js");
// we use Postman Echo service: https://docs.postman-echo.com/

// describe("getJSON()", () => {
//     it("should return correct value", async () => {
//         // arrange
//         const url = "https://postman-echo.com/get?foo1=bar1&foo2=bar2";

//         // act
//         const actual = await srcFile.getJSON(url);

//         // assert
//         expect(actual.url).toEqual(url);
//     });
// });

describe("request()", () => {
    // it("should return correct value for GET", async () => {
    //     // arrange
    //     const url = "https://postman-echo.com/get?foo1=bar1&foo2=bar3";

    //     const options = {
    //         host: "postman-echo.com",
    //         //port: 4000,
    //         //method: "GET",
    //         path: "/get?foo1=bar1&foo2=bar3"
    //         // headers: {
    //         //     "Content-Type": "application/json"
    //         // }
    //     };

    //     // act
    //     const actual = await srcFile.request(options);

    //     //console.log(options);

    //     // assert
    //     expect(actual.url).toEqual(url);
    // });

    // it("should POST data as Query String Parameters", async () => {
    //     // arrange
    //     const url = "https://postman-echo.com/post?hand=wave";

    //     const options = {
    //         host: "postman-echo.com",
    //         //port: 4000,
    //         method: "POST",
    //         path: "/post?hand=wave"
    //     };

    //     // act
    //     const actual = await srcFile.request(options);
    //     //console.log(actual);

    //     // assert
    //     expect(actual.url).toEqual(url);
    // });

    // it("should POST data as Query String Parameters", async () => {
    //     // arrange
    //     const url = "https://postman-echo.com/post?hand=wave";

    //     const options = {
    //         host: "postman-echo.com",
    //         //port: 4000,
    //         method: "POST",
    //         path: "/post?hand=wave"
    //     };

    //     // act
    //     const actual = await srcFile.request(options);
    //     //console.log(actual);

    //     // assert
    //     expect(actual.url).toEqual(url);
    // });

    // long running tests
    it("fake test", async () => {
        expect(1).toEqual(1);
    });
});
