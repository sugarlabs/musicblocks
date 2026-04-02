// Copyright (c) 2015-2024 Yash Khandelwal
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.

/* global jest, describe, beforeEach, afterEach, test, expect, require */

describe("loader.js coverage", () => {
    let mockRequireJS;
    let mockRequireJSConfig;
    let mockI18next;
    let consoleErrorSpy;
    let consoleLogSpy;

    beforeEach(() => {
        jest.resetModules();

        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => { });

        document.body.innerHTML = `
            <div id="loadingText">Loading...</div>
        `;

        mockI18next = {
            use: jest.fn().mockReturnThis(),
            init: jest.fn((config, cb) => {
                if (cb) cb(null);
            })
        };

        mockRequireJSConfig = jest.fn();
        mockRequireJS = jest.fn((deps, callback) => {
            if (callback) {
                // Return mocks for known dependencies
                if (deps.includes("activity/activity")) {
                    callback(
                        jest.fn(fn => fn()), // mock $ function that runs ready callback
                        {} // mock Activity
                    );
                } else {
                    callback();
                }
            }
        });
        mockRequireJS.config = mockRequireJSConfig;

        global.requirejs = mockRequireJS;
        global.window = document.defaultView;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("Configures requirejs correctly", () => {
        require("../loader.js");
        expect(mockRequireJSConfig).toHaveBeenCalledWith(
            expect.objectContaining({
                baseUrl: "./",
                paths: expect.any(Object),
                shim: expect.any(Object)
            })
        );
    });

    test("Bootstraps the application", () => {
        require("../loader.js");

        // Check initial requirejs call
        expect(mockRequireJS).toHaveBeenCalledWith(
            ["jquery", "activity/activity"],
            expect.any(Function),
            expect.any(Function)
        );

        // The new loader.js doesn't set globals anymore
        // These are now handled by individual modules or requirejs shims
        // Verify initialization log message
        expect(consoleLogSpy).toHaveBeenCalledWith("Music Blocks application initialized.");


    });

    test("Handles initialization errors", () => {
        require("../loader.js");
        const errorCallback = mockRequireJS.mock.calls[0][2];
        const testError = new Error("Load failed");
        errorCallback(testError);
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to start Music Blocks:", testError);
    });
});
