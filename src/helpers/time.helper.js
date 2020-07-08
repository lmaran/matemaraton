/**
 *
 * process.hrtime() returns the current high-resolution real time in a [seconds, nanoseconds] tuple Array
 * this function concat seconds and nanoseconds providing a single number (as seconds)
 *
 * node.js original doc: https://nodejs.org/docs/v0.8.0/api/all.html#all_process_hrtime
 * helper doc: https://stackoverflow.com/a/14551263
 *
 * USAGE_1 (new: with elapsedTime) - more precisely
 * const startTime = Date.now();
 * //...some code
 * console.log(`Returned nextId in ${(Date.now() - startTime) / 1000} sec.`);
 *
 * USAGE_2 (old: with Date.now)
 * const timerHelper = require("../helpers/time.helper");
 * const start = process.hrtime();
 * //...some code
 * console.log(`Returned nextId in ${timerHelper.elapsedTime(start)} sec.`);
 *
 * input: [2 sec, 123456789 ns]
 * output: 2.1234
 * @param {*} timer
 * @returns {number}
 */
exports.elapsedTime = timer => {
    const precision = 3; // 3 decimal places

    const secondsPart1 = process.hrtime(timer)[0];

    const nanosecondsPart2 = process.hrtime(timer)[1];
    const secondsPart2Initial = nanosecondsPart2 / 1000000000; // divide by a billion to get nano to seconds
    const secondsPart2 = Number(secondsPart2Initial.toFixed(precision));

    timer = process.hrtime(); // reset the timer

    return secondsPart1 + secondsPart2;
};
