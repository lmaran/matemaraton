// you can also ignore this helper and use instead a third party library (axios, got etc)

// https.get - a detailed version: https://nodejs.org/api/http.html#http_http_get_url_options_callback
// https.get/post - a minimal version: https://blog.bearer.sh/node-http-request/
const https = require("https");

/**
 * https://nodejs.org/api/http.html#http_http_get_url_options_callback
 *
 * @param {*} url
 *
 */
exports.getJSON = async url => {
    return new Promise(function(resolve, reject) {
        https
            .get(url, res => {
                const { statusCode } = res;
                const contentType = res.headers["content-type"];

                let error;
                // Any 2xx status code signals a successful response but here we're only checking for 200.
                if (statusCode !== 200) {
                    error = new Error("Request Failed.\n" + `Status Code: ${statusCode}`);
                } else if (!/^application\/json/.test(contentType)) {
                    error = new Error(
                        "Invalid content-type.\n" + `Expected application/json but received ${contentType}`
                    );
                }
                if (error) {
                    console.error(error.message);

                    // Consume response data to free up memory
                    res.resume();

                    reject(error);

                    return;
                }

                res.setEncoding("utf8");
                let data = "";

                res.on("data", chunk => {
                    data += chunk;
                });

                res.on("end", () => {
                    try {
                        const parsedData = JSON.parse(data);
                        //console.log(parsedData);
                        resolve(parsedData);
                    } catch (err) {
                        // console.error(e.message);
                        reject(err);
                    }
                    // resolve(JSON.parse(data));
                });
            })
            .on("error", err => {
                // console.log("Error: " + err.message);
                reject(err);
            });
    });
};

/**
 * https://stackoverflow.com/a/38543075
 * https://nodejs.org/api/http.html#http_http_request_url_options_callback
 *
 * @param {string | URL} url
 * @param {*} options
 * @param {*} postData
 */
exports.request = async (options, postData) => {
    // select http or https module, depending on requested url
    //const lib = url.startsWith("https") ? require("https") : require("http");

    return new Promise(function(resolve, reject) {
        const req = https.request(options, function(res) {
            // reject on bad status
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error("statusCode=" + res.statusCode));
            }
            // cumulate data
            let body = [];
            res.on("data", function(chunk) {
                body.push(chunk);
            });
            // resolve on end
            res.on("end", function() {
                try {
                    body = JSON.parse(Buffer.concat(body).toString());
                } catch (e) {
                    reject(e);
                }
                resolve(body);
            });
        });
        // reject on request error
        req.on("error", function(err) {
            // This is not a "Second reject", just a different sort of failure
            reject(err);
        });
        if (postData) {
            req.write(postData);
        }
        // IMPORTANT
        req.end();
    });
};
