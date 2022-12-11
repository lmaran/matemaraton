exports.getRoDay = (dayOfWeek) => {
    if (dayOfWeek === 0) return "Duminica";
    else if (dayOfWeek === 1) return "Luni";
    else if (dayOfWeek === 2) return "Marti";
    else if (dayOfWeek === 3) return "Miercuri";
    else if (dayOfWeek === 4) return "Joi";
    else if (dayOfWeek === 5) return "Vineri";
    else if (dayOfWeek === 6) return "Sambata";
};

exports.getRoShortDay = (dayOfWeek) => {
    if (dayOfWeek === 0) return "Du";
    else if (dayOfWeek === 1) return "Lu";
    else if (dayOfWeek === 2) return "Ma";
    else if (dayOfWeek === 3) return "Mi";
    else if (dayOfWeek === 4) return "Jo";
    else if (dayOfWeek === 5) return "Vi";
    else if (dayOfWeek === 6) return "Sa";
};

exports.getRoMonth = (monthOfYear) => {
    if (monthOfYear === 0) return "Ianuarie";
    else if (monthOfYear === 1) return "Februari";
    else if (monthOfYear === 2) return "Martie";
    else if (monthOfYear === 3) return "Aprilie";
    else if (monthOfYear === 4) return "Mai";
    else if (monthOfYear === 5) return "Iunie";
    else if (monthOfYear === 6) return "Iulie";
    else if (monthOfYear === 7) return "August";
    else if (monthOfYear === 8) return "Septembrie";
    else if (monthOfYear === 9) return "Octombrie";
    else if (monthOfYear === 10) return "Noiembrie";
    else if (monthOfYear === 11) return "Decembrie";
};

exports.getRoShortMonth = (monthOfYear) => {
    if (monthOfYear === 0) return "Ian";
    else if (monthOfYear === 1) return "Feb";
    else if (monthOfYear === 2) return "Mar";
    else if (monthOfYear === 3) return "Apr";
    else if (monthOfYear === 4) return "Mai";
    else if (monthOfYear === 5) return "Iun";
    else if (monthOfYear === 6) return "Iul";
    else if (monthOfYear === 7) return "Aug";
    else if (monthOfYear === 8) return "Sep";
    else if (monthOfYear === 9) return "Oct";
    else if (monthOfYear === 10) return "Nov";
    else if (monthOfYear === 11) return "Dec";
};

const getDateParts = (date) => {
    // javascript date object
    const d = date.getDate();
    const m = date.getMonth() + 1; // January is 0!
    const yyyy = date.getFullYear();

    let dd = d;
    if (dd < 10) dd = `0${d}`;

    let mm = m;
    if (mm < 10) mm = `0${m}`;

    return { yyyy, m, mm, d, dd };
};

const getTimeParts = (date) => {
    let hours = date.getHours(); // hour returned in 24 hour format
    if (hours < 10) hours = `0${hours}`;

    let minutes = date.getMinutes();
    if (minutes < 10) minutes = `0${minutes}`;

    return { hours, minutes };
};

exports.getShortDate = (date) => {
    const dateParts = getDateParts(date);
    return `${dateParts.yyyy}-${dateParts.mm}-${dateParts.dd}`;
};

exports.getShortDateAndTimeDate = (date) => {
    const dateParts = getDateParts(date);
    const timeParts = getTimeParts(date);
    return `${dateParts.yyyy}-${dateParts.mm}-${dateParts.dd} ${timeParts.hours}:${timeParts.minutes}`;
};

exports.getFriendlyDateOld = (date) => {
    // javascript date object
    const d = date.getDate();
    const m = date.getMonth() + 1; // January is 0!
    const yyyy = date.getFullYear();

    let dd = d;
    if (dd < 10) dd = `0${d}`;

    let mm = m;
    if (mm < 10) mm = `0${m}`;

    let hours = date.getHours(); // hour returned in 24 hour format
    if (hours < 10) hours = `0${hours}`;

    let minutes = date.getMinutes();
    if (minutes < 10) minutes = `0${minutes}`;

    return {
        dayAsString: this.getRoDay(date.getDay()), // Joi
        dayAsShortString: this.getRoShortDay(date.getDay()), // Jo
        dayOfMonth: dd, // 07, 24

        monthAsString: this.getRoMonth(m - 1), // Aprilie
        monthAsShortString: this.getRoShortMonth(m - 1), // Apr
        year: yyyy, // 2015
        ymd: yyyy + "-" + mm + "-" + dd, // 2015-07-23
        dmy: dd + "." + mm + "." + yyyy, // 23.07.2015

        time: hours + ":" + minutes, // 13:07
    };
};

exports.getDateFromString = function (date) {
    // "yyyy-mm-dd"
    const array = date.split("-");
    let mm = array[1];
    if (mm[0] === "0") mm = mm.charAt(1); // 07 -> 7 (month)
    mm = mm - 1; // January is 0!
    return new Date(array[0], mm, array[2]);
};

exports.getStringFromString = function (dateStr) {
    // "yyyy-mm-dd"
    const date = this.getDateFromString(dateStr);
    const f = this.getFriendlyDateOld(date);
    const dateStrRo =
        f.dayAsString +
        ", " +
        f.dayOfMonth +
        " " +
        f.monthAsShortString +
        ". " +
        f.year;
    return dateStrRo; // "Joi, 07 Apr. 2015"
};

exports.getStringFromStringNoDay = function (dateStr) {
    // "yyyy-mm-dd"
    const date = this.getDateFromString(dateStr);
    const f = this.getFriendlyDateOld(date);
    const dateStrRo = f.dayOfMonth + " " + f.monthAsShortString + ". " + f.year;
    return dateStrRo; // "07 Apr. 2015"
};

exports.getMonthAndDayFomString = function (dateStr) {
    // "yyyy-mm-dd" --> 07.Mar
    const date = this.getDateFromString(dateStr);
    const f = this.getFriendlyDateOld(date);
    return `${f.dayOfMonth}-${f.monthAsShortString}`;
};

// exports.getRoToday = function() {
//     // javascript date object (Ro time)
//     const utcDate = new Date();
//     const roDate = new Date(utcDate);

//     roDate.setHours(utcDate.getHours() + config.roUtcOffset); // Ro time
//     return roDate;
// };

// exports.getRoTodayStr = function() {
//     // "yyyy-mm-dd" (Ro time)
//     const roDate = this.getRoToday();
//     return this.getFriendlyDateOld(roDate).ymd;
// };

/**
 *
 * process.hrtime() returns the current high-resolution real time in a [seconds, nanoseconds] tuple Array
 * this helper merges seconds and nanoseconds providing a single number (as seconds)
 *
 * node.js original doc: https://nodejs.org/docs/v0.8.0/api/all.html#all_process_hrtime
 * helper doc: https://stackoverflow.com/a/14551263
 *
 * OLD method: (with Date.now)
 * const startTime = Date.now();
 * //...some code
 * console.log(`Returned nextId in ${(Date.now() - startTime) / 1000} sec.`);
 *
 *
 * NEW (with process.hrtime() and elapsedTime helper) - more precisely
 * const timerHelper = require("../helpers/time.helper");
 * const start = process.hrtime();
 * //...some code
 * console.log(`Returned nextId1 in ${timerHelper.elapsedTime(start)} sec.`);
 *
 * start = process.hrtime(); // reset the timer
 * ...other code to measure
 * * console.log(`Returned nextId2 in ${timerHelper.elapsedTime(start)} sec.`);
 *
 * input: [2 sec, 123456789 ns]
 * output: 2.1234
 * @param {*} timer
 * @returns {number}
 */
exports.elapsedTime = (timer) => {
    const precision = 3; // 3 decimal places

    const secondsPart1 = process.hrtime(timer)[0];

    const nanosecondsPart2 = process.hrtime(timer)[1];
    const secondsPart2Initial = nanosecondsPart2 / 1000000000; // divide by a billion to get nano to seconds
    const secondsPart2 = Number(secondsPart2Initial.toFixed(precision));

    // timer = process.hrtime(); // reset the timer

    return secondsPart1 + secondsPart2;
};

/**
 * ONLY FOR TESTING (sleep and block the thread)
 * USAGE: timeHelper.sleep(500); // 500 ms
 */
exports.sleep = (milliseconds) => {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
};

/**
 * https://stackoverflow.com/a/39914235/2726725
 * Sleep but does not block the thread
 * USAGE: await dateTimeHelper.sleepAsync(500);
 */
exports.sleepAsync = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
