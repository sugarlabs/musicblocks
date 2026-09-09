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

const HttpUtils = require("../http-utils");
const { httpGet, httpPost, HttpRequest } = HttpUtils;

const ORIGINAL_SERVER = window.server;
const ORIGINAL_API_KEY = window.MB_PROJECT_API_KEY;

beforeEach(() => {
    global.fetch = jest.fn();
});

afterEach(() => {
    window.server = ORIGINAL_SERVER;
    window.MB_PROJECT_API_KEY = ORIGINAL_API_KEY;
});

describe("httpGet()", () => {
    beforeEach(() => {
        window.server = "http://localhost/";
        window.MB_PROJECT_API_KEY = "";
    });

    it("fetches from the project URL", async () => {
        fetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve("data")
        });

        expect(await httpGet("project")).toBe("data");

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost/project",
            expect.objectContaining({
                method: "GET",
                headers: { "x-api-key": "" }
            })
        );
    });

    it("fetches from the base URL when projectName is null", async () => {
        fetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve("root")
        });

        await httpGet(null);

        expect(fetch).toHaveBeenCalledWith("http://localhost/", expect.any(Object));
    });

    it("includes the configured API key", async () => {
        window.MB_PROJECT_API_KEY = "secret";

        fetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve("ok")
        });

        await httpGet("project");

        expect(fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: { "x-api-key": "secret" }
            })
        );
    });

    it("throws when the server returns an error", async () => {
        fetch.mockResolvedValue({ ok: false });

        await expect(httpGet("bad")).rejects.toThrow("Error from server");
    });
});

describe("httpPost()", () => {
    beforeEach(() => {
        window.server = "http://localhost/";
    });

    it("posts data to the server", async () => {
        fetch.mockResolvedValue({
            ok: true,
            text: () => Promise.resolve("ok")
        });

        expect(await httpPost("project", "payload")).toBe("ok");

        expect(fetch).toHaveBeenCalledWith(
            "http://localhost/project",
            expect.objectContaining({
                method: "POST",
                body: "payload"
            })
        );
    });

    it("throws when the server returns an error", async () => {
        fetch.mockResolvedValue({ ok: false });

        await expect(httpPost("project", "payload")).rejects.toThrow("Error from server");
    });
});

describe("HttpRequest()", () => {
    const ORIGINAL_SELF = global.self;
    const ORIGINAL_XHR = global.XMLHttpRequest;

    afterEach(() => {
        global.self = ORIGINAL_SELF;
        global.XMLHttpRequest = ORIGINAL_XHR;
    });

    it("reports network errors through the user callback", () => {
        const callback = jest.fn();

        global.self = {
            location: { href: "http://localhost/" },
            console
        };

        global.XMLHttpRequest = class {
            open() {
                throw new Error("network");
            }
        };

        new HttpRequest("http://bad.com", jest.fn(), callback);

        expect(callback).toHaveBeenCalledWith(false, "network error");
    });

    it("creates an XMLHttpRequest instance", () => {
        const xhr = {
            open: jest.fn(),
            send: jest.fn()
        };

        global.XMLHttpRequest = jest.fn(() => xhr);

        const request = new HttpRequest("http://localhost/test", jest.fn());

        expect(global.XMLHttpRequest).toHaveBeenCalledTimes(1);
        expect(request.request).toBe(xhr);
    });

    it("invokes callbacks on successful HTTP status via onload", () => {
        let xhr;
        const handler = jest.fn();
        const userCallback = jest.fn();

        global.self = {
            location: { href: "http://localhost/" },
            console
        };

        global.XMLHttpRequest = jest.fn(() => {
            xhr = {
                open: jest.fn(),
                send: jest.fn(),
                status: 200,
                responseText: "ok body"
            };
            return xhr;
        });

        new HttpRequest("http://localhost/ok", handler, userCallback);
        xhr.onload();

        expect(handler).toHaveBeenCalledTimes(1);
        expect(userCallback).toHaveBeenCalledWith(true, "ok body");
    });

    it("invokes callbacks on error HTTP status via onload", () => {
        let xhr;
        const handler = jest.fn();
        const userCallback = jest.fn();

        global.self = {
            location: { href: "http://localhost/" },
            console
        };

        global.XMLHttpRequest = jest.fn(() => {
            xhr = {
                open: jest.fn(),
                send: jest.fn(),
                status: 404,
                responseText: "missing"
            };
            return xhr;
        });

        new HttpRequest("http://localhost/missing", handler, userCallback);
        xhr.onload();

        expect(handler).toHaveBeenCalledTimes(1);
        expect(userCallback).toHaveBeenCalledWith(false, "Error: 404");
    });

    it("invokes callbacks on network failure via onerror", () => {
        let xhr;
        const handler = jest.fn();
        const userCallback = jest.fn();

        global.self = {
            location: { href: "http://localhost/" },
            console
        };

        global.XMLHttpRequest = jest.fn(() => {
            xhr = {
                open: jest.fn(),
                send: jest.fn()
            };
            return xhr;
        });

        new HttpRequest("http://localhost/fail", handler, userCallback);
        xhr.onerror();

        expect(handler).toHaveBeenCalledTimes(1);
        expect(userCallback).toHaveBeenCalledWith(false, "network error");
    });
});

describe("compatibility surface", () => {
    it("exposes every helper on the module export object", () => {
        expect(Object.keys(HttpUtils).sort()).toEqual(["HttpRequest", "httpGet", "httpPost"]);
    });

    it("re-exports the identical function references through utils.js", () => {
        const utils = require("../utils");

        expect(utils.httpGet).toBe(HttpUtils.httpGet);
        expect(utils.httpPost).toBe(HttpUtils.httpPost);
        expect(utils.HttpRequest).toBe(HttpUtils.HttpRequest);
    });
});
