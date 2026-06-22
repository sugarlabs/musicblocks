/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Sugarlabs
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

"use strict";

global._ = msg => msg;

global.confirm = jest.fn(() => true);

global.PALETTEICONS = {};
global.PALETTEFILLCOLORS = {};
global.PALETTESTROKECOLORS = {};
global.PALETTEHIGHLIGHTCOLORS = {};
global.HIGHLIGHTSTROKECOLORS = {};
global.MULTIPALETTES = [[], [], []];
global.platformColor = { paletteColors: {} };

global.window.__mb_plugin_registry = {};

const { processPluginData } = require("../utils.js");

function makeActivity() {
    return {
        logo: {
            evalFlowDict: {},
            evalArgDict: {},
            evalSetterDict: {},
            evalParameterDict: {},
            evalOnStartList: {},
            evalOnStopList: {}
        },
        palettes: {
            add: jest.fn(),
            makePalettes: jest.fn(),
            buttons: {},
            pluginMacros: {},
            pluginPalettes: [],
            updatePalettes: jest.fn(),
            show: jest.fn()
        },
        blocks: {
            protoBlockDict: {}
        },
        pluginsImages: {},
        pluginObjs: {
            PALETTEPLUGINS: {},
            PALETTEFILLCOLORS: {},
            PALETTESTROKECOLORS: {},
            PALETTEHIGHLIGHTCOLORS: {},
            FLOWPLUGINS: {},
            ARGPLUGINS: {},
            BLOCKPLUGINS: {},
            SETTERPLUGINS: {},
            PARAMETERPLUGINS: {},
            ONLOAD: {},
            ONSTART: {},
            ONSTOP: {},
            MACROPLUGINS: {},
            GLOBALS: "",
            IMAGES: {}
        },
        errorMsg: jest.fn()
    };
}

function makePluginData(overrides = {}) {
    const defaults = {
        PALETTEPLUGINS: {
            testp: {
                name: "Test",
                fill: "#ff0066",
                stroke: "#ef003e",
                highlight: "#ffb1b3"
            }
        }
    };
    return JSON.stringify({ ...defaults, ...overrides });
}

beforeAll(() => {
    URL.createObjectURL = URL.createObjectURL || jest.fn(() => "blob:mock");
    URL.revokeObjectURL = URL.revokeObjectURL || jest.fn();
});

afterAll(() => {
    if (jest.isMockFunction(URL.createObjectURL)) {
        delete URL.createObjectURL;
    }
    if (jest.isMockFunction(URL.revokeObjectURL)) {
        delete URL.revokeObjectURL;
    }
});

describe("processPluginData - script cleanup", () => {
    let activity;

    beforeEach(() => {
        activity = makeActivity();
        jest.spyOn(console, "debug").mockImplementation(jest.fn());
        jest.spyOn(console, "error").mockImplementation(jest.fn());
        jest.spyOn(console, "warn").mockImplementation(jest.fn());
        document.head.innerHTML = "";
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("blob script path (FLOWPLUGINS)", () => {
        it("removes script from head on successful load", async () => {
            const rmSpy = jest.spyOn(document.head, "removeChild").mockImplementation(jest.fn());
            jest.spyOn(document.head, "appendChild").mockImplementation(el => {
                setTimeout(() => {
                    if (el.onload) el.onload();
                }, 0);
                return el;
            });

            const data = makePluginData({ FLOWPLUGINS: { testflow: "return 42;" } });
            const result = await processPluginData(activity, data, "plugins/test");

            expect(result).not.toBeNull();
            expect(rmSpy).toHaveBeenCalled();
        });

        it("removes script from head on load error", async () => {
            const rmSpy = jest.spyOn(document.head, "removeChild").mockImplementation(jest.fn());
            jest.spyOn(document.head, "appendChild").mockImplementation(el => {
                setTimeout(() => {
                    if (el.onerror) el.onerror(new Error("Load failed"));
                }, 0);
                return el;
            });

            const data = makePluginData({ FLOWPLUGINS: { testflow: "return 42;" } });
            await expect(processPluginData(activity, data, "plugins/test")).rejects.toThrow("Load failed");

            expect(rmSpy).toHaveBeenCalled();
        });
    });

    describe("safe eval path (BLOCKPLUGINS)", () => {
        it("removes setup script from head on successful load", async () => {
            const rmSpy = jest.spyOn(document.head, "removeChild").mockImplementation(jest.fn());
            jest.spyOn(document.head, "appendChild").mockImplementation(el => {
                setTimeout(() => {
                    if (el.onload) el.onload();
                }, 0);
                return el;
            });

            const data = makePluginData({ BLOCKPLUGINS: { testblock: "var x = 1;" } });
            const result = await processPluginData(activity, data, "plugins/test");

            expect(result).not.toBeNull();
            expect(rmSpy).toHaveBeenCalled();
        });

        it("removes setup script from head on load error", async () => {
            const rmSpy = jest.spyOn(document.head, "removeChild").mockImplementation(jest.fn());
            jest.spyOn(document.head, "appendChild").mockImplementation(el => {
                setTimeout(() => {
                    if (el.onerror) el.onerror(new Event("error"));
                }, 0);
                return el;
            });

            const data = makePluginData({ BLOCKPLUGINS: { testblock: "var x = 1;" } });
            const result = await processPluginData(activity, data, "plugins/test");

            expect(result).not.toBeNull();
            expect(rmSpy).toHaveBeenCalled();
        });
    });

    describe("both paths together", () => {
        it("removes both blob and setup scripts on success", async () => {
            const rmSpy = jest.spyOn(document.head, "removeChild").mockImplementation(jest.fn());
            jest.spyOn(document.head, "appendChild").mockImplementation(el => {
                setTimeout(() => {
                    if (el.onload) el.onload();
                }, 0);
                return el;
            });

            const data = makePluginData({
                FLOWPLUGINS: { testflow: "return 42;" },
                BLOCKPLUGINS: { testblock: "var x = 1;" }
            });

            const result = await processPluginData(activity, data, "plugins/test");

            expect(result).not.toBeNull();
            expect(rmSpy).toHaveBeenCalledTimes(2);
        });
    });
});
