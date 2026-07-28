/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2014-2026 Walter Bender
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/* exported
   httpGet, httpPost, HttpRequest
*/

/**
 * Performs an HTTP GET request to retrieve data from the server.
 * Uses async fetch to avoid blocking the UI during network requests.
 * @param {string|null} projectName - The name of the project (or null for the base URL).
 * @throws {Error} Throws an error if the HTTP status code is greater than 299.
 * @returns {Promise<string>} A promise that resolves to the response text from the server.
 */
let httpGet = async projectName => {
    const url = projectName === null ? window.server : window.server + projectName;
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "x-api-key": window.MB_PROJECT_API_KEY || ""
        }
    });

    if (!response.ok) {
        throw new Error("Error from server");
    }

    return response.text();
};

/**
 * Performs an HTTP POST request to send data to the server.
 * Uses async fetch to avoid blocking the UI during network requests.
 * @param {string} projectName - The name of the project.
 * @param {string} data - The data to be sent in the POST request.
 * @returns {Promise<string>} A promise that resolves to the response text from the server.
 */
let httpPost = async (projectName, data) => {
    const response = await fetch(window.server + projectName, {
        method: "POST",
        headers: {
            "x-api-key": window.MB_PROJECT_API_KEY || ""
        },
        body: data
    });

    if (!response.ok) {
        throw new Error("Error from server");
    }

    return response.text();
};

/**
 * Constructor function for making an HTTP request.
 * @constructor
 * @param {string} url - The URL to make the HTTP request to.
 * @param {function} loadCallback - The callback function to handle the loaded response.
 * @param {function} [userCallback] - An optional user-defined callback function.
 */
function HttpRequest(url, loadCallback, userCallback) {
    const req = (this.request = new XMLHttpRequest());
    this.handler = loadCallback;
    this.url = url;
    this.localmode = Boolean(self.location.href.search(/^file:/i) === 0);
    this.userCallback = userCallback;

    try {
        req.open("GET", url);

        req.onload = () => {
            if ((req.status >= 200 && req.status < 300) || this.localmode) {
                if (typeof this.handler === "function") this.handler();
                if (typeof this.userCallback === "function") {
                    this.userCallback(true, req.responseText);
                }
            } else {
                if (typeof this.handler === "function") this.handler();
                if (typeof this.userCallback === "function") {
                    this.userCallback(false, `Error: ${req.status}`);
                }
            }
        };

        req.onerror = () => {
            if (typeof this.handler === "function") this.handler();
            if (typeof this.userCallback === "function") {
                this.userCallback(false, "network error");
            }
        };

        req.onabort = req.onerror;
        req.ontimeout = req.onerror;

        req.send("");
    } catch (e) {
        if (self.console) {
            console.debug("Failed to load resource from " + url + ": Network error.", e);
        }

        if (typeof this.userCallback === "function") {
            this.userCallback(false, "network error");
        }

        this.request = this.handler = this.userCallback = null;
    }
}

var HttpUtils = {
    httpGet,
    httpPost,
    HttpRequest
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = HttpUtils;
}

if (typeof window !== "undefined") {
    // HttpUtils is what the RequireJS shim reads via `exports`. The
    // individual globals are required for compatibility: callers invoke
    // these by bare name rather than receiving an injected module, so
    // removing them would break the app. This matches how BrowserUtils,
    // DomHelpers, and UtilsLogic publish their own.
    window.HttpUtils = HttpUtils;
    Object.assign(window, HttpUtils);
}
