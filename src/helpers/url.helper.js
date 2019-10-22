const url = require("url");
const _ = require("lodash");

const stringHelper = require("../helpers/string.helper");
const urlHelper = require("../helpers/url.helper");

exports.buildUrl = (redirectUri, options, hash) => {
    const newUrlObj = url.parse(redirectUri, true) || {}; // convert url -> object
    delete newUrlObj.search;
    if (!newUrlObj.query) {
        newUrlObj.query = {};
    }
    // add each option to the query
    _.each(options, (value, key) => {
        const q = newUrlObj.query;
        if (q) {
            q[key] = value;
        }
    });
    if (hash) {
        newUrlObj.hash = hash;
    }

    return url.format(newUrlObj);
};

exports.getTenantCode = subdomains => {
    // example for "http://cantinas.dev.identity.appstudio.ro/":
    // input = ["identity", "dev", "cantinas"] // an array of all subdomains in reverse order
    // output = "cantinas"
    let tenantCode;
    if (subdomains && subdomains.length > 0) {
        tenantCode = _.last(subdomains);
        if (urlHelper.isReservedSubdomain(tenantCode)) {
            tenantCode = undefined;
        }
    }
    return tenantCode;
};

exports.isReservedSubdomain = subdomain => {
    const isReserved1 = ["stg", "temp", "temp-stg", "blue", "blue-stg", "green", "green-stg", "dev"].includes(
        subdomain,
    );
    const isReserved2 = stringHelper.endsWithValueFromList(subdomain, ["-blue", "-green", "-blue-stg", "-green-stg"]);
    return isReserved1 || isReserved2;
};
