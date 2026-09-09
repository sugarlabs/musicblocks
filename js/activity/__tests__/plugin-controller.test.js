// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

"use strict";

const { setupPluginController, PluginController } = require("../plugin-controller.js");

// ---------------------------------------------------------------------------
// Globals required by plugin-controller.js in the Node/Jest environment
// ---------------------------------------------------------------------------

if (typeof global.debugLog !== "function") {
    global.debugLog = () => {};
}

if (typeof global.safeJSONParse !== "function") {
    global.safeJSONParse = (data, fallback = null) => {
        try {
            if (data === null || data === undefined) return fallback;
            return JSON.parse(data);
        } catch (e) {
            return fallback;
        }
    };
}

// Async stubs for utils.js functions used by the controller.
// Each test overrides them as needed.
global.processPluginData = jest.fn();
global.processRawPluginData = jest.fn();
global.preparePluginExports = jest.fn();
global.updatePluginObj = jest.fn();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStorage(initial = {}) {
    // Mimics the localStorage surface used by the controller (plain object).
    return Object.assign({ plugins: null }, initial);
}

function makeActivity(storageOverrides = {}) {
    return {
        storage: makeStorage(storageOverrides),
        pluginObjs: null,
        pluginsImages: null
    };
}

// ---------------------------------------------------------------------------
// setupPluginController
// ---------------------------------------------------------------------------

describe("setupPluginController", () => {
    test("attaches pluginController instance to activity", () => {
        const activity = makeActivity();
        setupPluginController(activity);

        expect(activity.pluginController).toBeInstanceOf(PluginController);
    });

    test("does not attach any other properties to activity", () => {
        const activity = makeActivity();
        const keysBefore = new Set(Object.keys(activity));
        setupPluginController(activity);
        const keysAfter = Object.keys(activity);

        const newKeys = keysAfter.filter(k => !keysBefore.has(k));
        expect(newKeys).toEqual(["pluginController"]);
    });
});

// ---------------------------------------------------------------------------
// initializePluginState
// ---------------------------------------------------------------------------

describe("PluginController.initializePluginState", () => {
    test("sets pluginObjs with all expected keys", () => {
        const activity = makeActivity();
        setupPluginController(activity);
        activity.pluginController.initializePluginState();

        expect(activity.pluginObjs).toEqual({
            PALETTEPLUGINS: {},
            PALETTEFILLCOLORS: {},
            PALETTESTROKECOLORS: {},
            PALETTEHIGHLIGHTCOLORS: {},
            FLOWPLUGINS: {},
            ARGPLUGINS: {},
            BLOCKPLUGINS: {},
            MACROPLUGINS: {},
            ONLOAD: {},
            ONSTART: {},
            ONSTOP: {}
        });
    });

    test("sets pluginsImages to an empty object", () => {
        const activity = makeActivity();
        setupPluginController(activity);
        activity.pluginController.initializePluginState();

        expect(activity.pluginsImages).toEqual({});
    });

    test("resets existing pluginObjs on a second call", () => {
        const activity = makeActivity();
        setupPluginController(activity);
        activity.pluginController.initializePluginState();
        activity.pluginObjs.PALETTEPLUGINS["test"] = { foo: "bar" };

        activity.pluginController.initializePluginState();

        expect(activity.pluginObjs.PALETTEPLUGINS).toEqual({});
    });
});

// ---------------------------------------------------------------------------
// loadStoredPlugins
// ---------------------------------------------------------------------------

describe("PluginController.loadStoredPlugins", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("does nothing when storage.plugins is null", async () => {
        const activity = makeActivity({ plugins: null });
        setupPluginController(activity);

        await activity.pluginController.loadStoredPlugins();

        expect(global.processPluginData).not.toHaveBeenCalled();
        expect(global.updatePluginObj).not.toHaveBeenCalled();
    });

    test('does nothing when storage.plugins is the string "null"', async () => {
        const activity = makeActivity({ plugins: "null" });
        setupPluginController(activity);

        await activity.pluginController.loadStoredPlugins();

        expect(global.processPluginData).not.toHaveBeenCalled();
    });

    test("does nothing when storage.plugins is undefined", async () => {
        const activity = makeActivity({ plugins: undefined });
        setupPluginController(activity);

        await activity.pluginController.loadStoredPlugins();

        expect(global.processPluginData).not.toHaveBeenCalled();
    });

    test("calls processPluginData and updatePluginObj for valid data", async () => {
        const pluginData = JSON.stringify({ PALETTEPLUGINS: { weather: {} } });
        const activity = makeActivity({ plugins: pluginData });
        const parsed = { PALETTEPLUGINS: { weather: {} } };
        global.processPluginData.mockResolvedValue(parsed);
        setupPluginController(activity);

        await activity.pluginController.loadStoredPlugins();

        expect(global.processPluginData).toHaveBeenCalledWith(
            activity,
            pluginData,
            "localStorage:plugins"
        );
        expect(global.updatePluginObj).toHaveBeenCalledWith(activity, parsed);
    });

    test("does not call updatePluginObj when processPluginData returns null", async () => {
        // Simulates malformed persisted plugin data that processPluginData cannot parse.
        const activity = makeActivity({ plugins: "not-valid-json" });
        global.processPluginData.mockResolvedValue(null);
        setupPluginController(activity);

        await activity.pluginController.loadStoredPlugins();

        expect(global.processPluginData).toHaveBeenCalled();
        expect(global.updatePluginObj).not.toHaveBeenCalled();
    });

    test("does not call updatePluginObj when processPluginData returns undefined", async () => {
        const activity = makeActivity({ plugins: "{}" });
        global.processPluginData.mockResolvedValue(undefined);
        setupPluginController(activity);

        await activity.pluginController.loadStoredPlugins();

        expect(global.updatePluginObj).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// loadBuiltInPluginFromXHR
// ---------------------------------------------------------------------------

describe("PluginController.loadBuiltInPluginFromXHR", () => {
    let xhrMock;

    beforeEach(() => {
        jest.clearAllMocks();
        // Minimal XMLHttpRequest stub
        xhrMock = {
            open: jest.fn(),
            send: jest.fn(),
            status: 200,
            responseText: "",
            onload: null,
            onerror: null,
            onabort: null
        };
        global.XMLHttpRequest = jest.fn(() => xhrMock);
    });

    test("resolves true and persists plugin on HTTP 200", async () => {
        const activity = makeActivity();
        const parsed = { PALETTEPLUGINS: { maths: {} } };
        global.processRawPluginData.mockResolvedValue(parsed);
        global.preparePluginExports.mockReturnValue(JSON.stringify(parsed));
        setupPluginController(activity);

        xhrMock.responseText = '{"PALETTEPLUGINS":{"maths":{}}}';

        const promise = activity.pluginController.loadBuiltInPluginFromXHR("maths");
        // Trigger the XHR onload callback synchronously
        xhrMock.status = 200;
        await xhrMock.onload();

        const result = await promise;
        expect(result).toBe(true);
        expect(global.processRawPluginData).toHaveBeenCalledWith(
            activity,
            xhrMock.responseText,
            "plugins/maths.json"
        );
        expect(global.preparePluginExports).toHaveBeenCalledWith(activity, parsed);
        expect(activity.storage.plugins).toBe(JSON.stringify(parsed));
    });

    test("resolves false on HTTP 404 and does not persist", async () => {
        const activity = makeActivity();
        setupPluginController(activity);

        const promise = activity.pluginController.loadBuiltInPluginFromXHR("nonexistent");
        xhrMock.status = 404;
        await xhrMock.onload();

        const result = await promise;
        expect(result).toBe(false);
        expect(global.processRawPluginData).not.toHaveBeenCalled();
        expect(activity.storage.plugins).toBeNull();
    });

    test("does not persist when processRawPluginData returns null", async () => {
        const activity = makeActivity();
        global.processRawPluginData.mockResolvedValue(null);
        setupPluginController(activity);

        const promise = activity.pluginController.loadBuiltInPluginFromXHR("badplugin");
        xhrMock.status = 200;
        await xhrMock.onload();

        await promise;
        expect(global.preparePluginExports).not.toHaveBeenCalled();
        expect(activity.storage.plugins).toBeNull();
    });

    test("does not persist when processRawPluginData returns undefined", async () => {
        const activity = makeActivity();
        global.processRawPluginData.mockResolvedValue(undefined);
        setupPluginController(activity);

        const promise = activity.pluginController.loadBuiltInPluginFromXHR("badplugin");
        xhrMock.status = 200;
        await xhrMock.onload();

        await promise;
        expect(global.preparePluginExports).not.toHaveBeenCalled();
        expect(activity.storage.plugins).toBeNull();
    });

    test("resolves false on network error (onerror)", async () => {
        const activity = makeActivity();
        setupPluginController(activity);

        const promise = activity.pluginController.loadBuiltInPluginFromXHR("weather");
        await xhrMock.onerror();

        const result = await promise;
        expect(result).toBe(false);
        expect(activity.storage.plugins).toBeNull();
    });

    test("resolves false on request abort (onabort)", async () => {
        const activity = makeActivity();
        setupPluginController(activity);

        const promise = activity.pluginController.loadBuiltInPluginFromXHR("weather");
        await xhrMock.onabort();

        const result = await promise;
        expect(result).toBe(false);
        expect(activity.storage.plugins).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// loadPluginFromFileContent
// ---------------------------------------------------------------------------

describe("PluginController.loadPluginFromFileContent", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("processes content and persists when obj is non-null", async () => {
        const activity = makeActivity();
        const raw = '{"PALETTEPLUGINS":{"nutrition":{}}}';
        const parsed = { PALETTEPLUGINS: { nutrition: {} } };
        global.processRawPluginData.mockResolvedValue(parsed);
        global.preparePluginExports.mockReturnValue(raw);
        setupPluginController(activity);

        await activity.pluginController.loadPluginFromFileContent(raw, "file:nutrition.json");

        expect(global.processRawPluginData).toHaveBeenCalledWith(
            activity,
            raw,
            "file:nutrition.json"
        );
        expect(global.preparePluginExports).toHaveBeenCalledWith(activity, parsed);
        expect(activity.storage.plugins).toBe(raw);
    });

    test("does not persist when processRawPluginData returns null", async () => {
        const activity = makeActivity();
        global.processRawPluginData.mockResolvedValue(null);
        setupPluginController(activity);

        await activity.pluginController.loadPluginFromFileContent("bad", "file:bad.json");

        expect(global.preparePluginExports).not.toHaveBeenCalled();
        expect(activity.storage.plugins).toBeNull();
    });

    test("does not persist when processRawPluginData returns undefined", async () => {
        const activity = makeActivity();
        global.processRawPluginData.mockResolvedValue(undefined);
        setupPluginController(activity);

        await activity.pluginController.loadPluginFromFileContent("bad", "file:bad.json");

        expect(global.preparePluginExports).not.toHaveBeenCalled();
        expect(activity.storage.plugins).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// deletePluginFromStorage
// ---------------------------------------------------------------------------

describe("PluginController.deletePluginFromStorage", () => {
    function makeStorageObj(overrides = {}) {
        return JSON.stringify(
            Object.assign(
                {
                    PALETTEPLUGINS: { weather: { desc: "weather palette" } },
                    PALETTEFILLCOLORS: { weather: "#aaa" },
                    PALETTESTROKECOLORS: { weather: "#bbb" },
                    PALETTEHIGHLIGHTCOLORS: { weather: "#ccc" },
                    FLOWPLUGINS: { showweather: "code" },
                    ARGPLUGINS: {},
                    BLOCKPLUGINS: { temperature: "code" },
                    MACROPLUGINS: { weather: [[]] },
                    ONLOAD: { weather: "onload code" },
                    ONSTART: { weather: "onstart code" },
                    ONSTOP: {}
                },
                overrides
            )
        );
    }

    test("removes all keys for the active palette and writes back", () => {
        const activity = makeActivity({ plugins: makeStorageObj() });
        const protoList = [{ name: "showweather" }, { name: "temperature" }];
        setupPluginController(activity);

        const result = activity.pluginController.deletePluginFromStorage("weather", protoList);

        expect(result).toBe(true);
        const stored = JSON.parse(activity.storage.plugins);
        expect(stored.PALETTEPLUGINS).not.toHaveProperty("weather");
        expect(stored.PALETTEFILLCOLORS).not.toHaveProperty("weather");
        expect(stored.PALETTESTROKECOLORS).not.toHaveProperty("weather");
        expect(stored.PALETTEHIGHLIGHTCOLORS).not.toHaveProperty("weather");
        expect(stored.FLOWPLUGINS).not.toHaveProperty("showweather");
        expect(stored.BLOCKPLUGINS).not.toHaveProperty("temperature");
        expect(stored.MACROPLUGINS).not.toHaveProperty("weather");
        expect(stored.ONLOAD).not.toHaveProperty("weather");
        expect(stored.ONSTART).not.toHaveProperty("weather");
    });

    test("returns false and does not throw when storage.plugins is null", () => {
        const activity = makeActivity({ plugins: null });
        setupPluginController(activity);

        expect(() => {
            const result = activity.pluginController.deletePluginFromStorage("weather", []);
            expect(result).toBe(false);
        }).not.toThrow();
    });

    test("returns false for invalid JSON in storage", () => {
        const activity = makeActivity({ plugins: "not-json{{}}" });
        setupPluginController(activity);

        const result = activity.pluginController.deletePluginFromStorage("weather", []);
        expect(result).toBe(false);
    });

    test("does not affect other palettes when deleting one", () => {
        const storageObj = {
            PALETTEPLUGINS: { weather: {}, maths: {} },
            PALETTEFILLCOLORS: {},
            PALETTESTROKECOLORS: {},
            PALETTEHIGHLIGHTCOLORS: {},
            FLOWPLUGINS: {},
            ARGPLUGINS: {},
            BLOCKPLUGINS: {},
            MACROPLUGINS: {},
            ONLOAD: {},
            ONSTART: {},
            ONSTOP: {}
        };
        const activity = makeActivity({ plugins: JSON.stringify(storageObj) });
        setupPluginController(activity);

        activity.pluginController.deletePluginFromStorage("weather", []);

        const stored = JSON.parse(activity.storage.plugins);
        expect(stored.PALETTEPLUGINS).not.toHaveProperty("weather");
        expect(stored.PALETTEPLUGINS).toHaveProperty("maths");
    });

    test("handles empty protoList without error", () => {
        const activity = makeActivity({ plugins: makeStorageObj() });
        setupPluginController(activity);

        expect(() => {
            activity.pluginController.deletePluginFromStorage("weather", []);
        }).not.toThrow();
    });

    test("handles missing optional keys (BLOCKPLUGINS, ARGPLUGINS, MACROPLUGINS, etc.) without error", () => {
        const activity = makeActivity({
            plugins: JSON.stringify({ PALETTEPLUGINS: { weather: {} } })
        });
        const protoList = [{ name: "showweather" }, { name: "temperature" }];
        setupPluginController(activity);

        expect(() => {
            const result = activity.pluginController.deletePluginFromStorage("weather", protoList);
            expect(result).toBe(true);
        }).not.toThrow();

        const stored = JSON.parse(activity.storage.plugins);
        expect(stored.PALETTEPLUGINS).not.toHaveProperty("weather");
    });
});
