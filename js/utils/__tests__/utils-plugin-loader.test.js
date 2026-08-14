// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const createActivity = () => ({
    blocks: {
        protoBlockDict: {}
    },
    logo: {
        evalFlowDict: {},
        evalArgDict: {},
        evalSetterDict: {},
        evalParameterDict: {},
        evalOnStartList: {},
        evalOnStopList: {}
    },
    palettes: {
        buttons: {},
        add: jest.fn(),
        makePalettes: jest.fn(),
        updatePalettes: jest.fn(),
        show: jest.fn(),
        pluginMacros: {}
    },
    pluginsImages: {}
});

describe("processPluginData script cleanup", () => {
    let processPluginData;
    let originalCreateObjectURL;
    let originalRevokeObjectURL;
    let originalBlob;
    let appendChildSpy;
    let blobUrls;
    let blobUrlIndex;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.resetModules();
        document.head.innerHTML = "";

        global._ = msg => msg;
        global.PALETTEICONS = {};
        global.PALETTEFILLCOLORS = {};
        global.PALETTESTROKECOLORS = {};
        global.PALETTEHIGHLIGHTCOLORS = {};
        global.HIGHLIGHTSTROKECOLORS = {};
        global.MULTIPALETTES = [[], [], []];
        global.platformColor = { paletteColors: {} };
        window.__mb_plugin_registry = {};

        originalCreateObjectURL = URL.createObjectURL;
        originalRevokeObjectURL = URL.revokeObjectURL;
        originalBlob = global.Blob;
        global.Blob = class {
            constructor(parts) {
                this.parts = parts;
            }

            text() {
                return Promise.resolve(this.parts.join(""));
            }
        };
        blobUrls = new Map();
        blobUrlIndex = 0;
        URL.createObjectURL = jest.fn(blob => {
            const url = `blob:plugin-setup-${blobUrlIndex}`;
            blobUrlIndex += 1;
            blobUrls.set(url, blob);
            return url;
        });
        URL.revokeObjectURL = jest.fn();

        ({ processPluginData } = require("../utils.js"));
    });

    afterEach(() => {
        if (appendChildSpy) {
            appendChildSpy.mockRestore();
            appendChildSpy = undefined;
        }
        URL.createObjectURL = originalCreateObjectURL;
        URL.revokeObjectURL = originalRevokeObjectURL;
        global.Blob = originalBlob;
        document.head.innerHTML = "";
        delete window.__mb_plugin_registry;
        delete globalThis.pluginSetupLoaded;
        jest.useRealTimers();
    });

    it("removes setup script elements after they load", async () => {
        const originalAppendChild = document.head.appendChild.bind(document.head);
        appendChildSpy = jest.spyOn(document.head, "appendChild").mockImplementation(script => {
            originalAppendChild(script);
            blobUrls
                .get(script.src)
                .text()
                .then(code => {
                    Function(code)();
                    script.onload();
                });
            return script;
        });

        await processPluginData(
            createActivity(),
            JSON.stringify({
                BLOCKPLUGINS: {
                    testBlock: "globalThis.pluginSetupLoaded = true;"
                }
            }),
            "plugins/test.json"
        );

        expect(globalThis.pluginSetupLoaded).toBe(true);
        expect(document.head.querySelectorAll("script[src^='blob:plugin-setup']")).toHaveLength(0);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:plugin-setup-0");
    });

    it("removes setup script elements after load errors", async () => {
        const originalAppendChild = document.head.appendChild.bind(document.head);
        appendChildSpy = jest.spyOn(document.head, "appendChild").mockImplementation(script => {
            originalAppendChild(script);
            script.onerror(new Error("load failed"));
            return script;
        });

        await processPluginData(
            createActivity(),
            JSON.stringify({
                BLOCKPLUGINS: {
                    testBlock: "globalThis.pluginSetupLoaded = true;"
                }
            }),
            "plugins/test.json"
        );

        expect(document.head.querySelectorAll("script[src^='blob:plugin-setup']")).toHaveLength(0);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:plugin-setup-0");
    });

    it("returns null and logs error when plugin data is invalid JSON", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

        const result = await processPluginData(createActivity(), "{invalid", "plugins/test.json");

        expect(result).toBeNull();
        expect(errorSpy).toHaveBeenCalled();
        expect(debugSpy).toHaveBeenCalledWith("Malformed plugin data:", "{invalid");

        errorSpy.mockRestore();
        debugSpy.mockRestore();
    });
});

describe("processPluginData - prototype pollution guard", () => {
    let processPluginData;

    beforeEach(() => {
        jest.resetModules();
        global._ = msg => msg;
        global.PALETTEICONS = {};
        global.PALETTEFILLCOLORS = {};
        global.PALETTESTROKECOLORS = {};
        global.PALETTEHIGHLIGHTCOLORS = {};
        global.HIGHLIGHTSTROKECOLORS = {};
        global.MULTIPALETTES = [[], [], []];
        global.platformColor = { paletteColors: {} };
        ({ processPluginData } = require("../utils.js"));
    });

    it("skips __proto__ and constructor keys in every plugin-data section", async () => {
        const activity = createActivity();

        const unsafe = '{"__proto__": {"polluted": true}, "constructor": {"polluted": true}}';
        const maliciousData = `{
            "PALETTEPLUGINS": ${unsafe}, "IMAGES": ${unsafe}, "FLOWPLUGINS": ${unsafe},
            "ARGPLUGINS": ${unsafe}, "MACROPLUGINS": ${unsafe}, "SETTERPLUGINS": ${unsafe},
            "BLOCKPLUGINS": ${unsafe}, "PARAMETERPLUGINS": ${unsafe}, "ONLOAD": ${unsafe},
            "ONSTART": ${unsafe}, "ONSTOP": ${unsafe}
        }`;

        await processPluginData(activity, maliciousData, "plugins/test.json");

        expect(Object.prototype.polluted).toBeUndefined();
        expect({}.polluted).toBeUndefined();

        const targets = [
            PALETTEICONS,
            activity.pluginsImages,
            activity.logo.evalFlowDict,
            activity.logo.evalArgDict,
            activity.palettes.pluginMacros,
            activity.logo.evalSetterDict,
            activity.logo.evalParameterDict,
            activity.logo.evalOnStartList,
            activity.logo.evalOnStopList
        ];
        for (const dict of targets) {
            expect(Object.prototype.hasOwnProperty.call(dict, "__proto__")).toBe(false);
            expect(Object.prototype.hasOwnProperty.call(dict, "constructor")).toBe(false);
        }
    });
});

describe("updatePluginObj - prototype pollution guard", () => {
    let updatePluginObj;

    beforeEach(() => {
        jest.resetModules();
        global._ = msg => msg;
        ({ updatePluginObj } = require("../utils.js"));
    });

    it("skips __proto__ and constructor keys when merging into activity.pluginObjs", () => {
        const activity = {
            pluginObjs: {
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
            }
        };

        const unsafe = '{"__proto__": {"polluted": true}, "constructor": {"polluted": true}}';
        const maliciousObj = JSON.parse(`{
            "PALETTEPLUGINS": ${unsafe}, "PALETTEFILLCOLORS": ${unsafe},
            "PALETTESTROKECOLORS": ${unsafe}, "PALETTEHIGHLIGHTCOLORS": ${unsafe},
            "FLOWPLUGINS": ${unsafe}, "ARGPLUGINS": ${unsafe}, "BLOCKPLUGINS": ${unsafe},
            "MACROPLUGINS": ${unsafe}, "ONLOAD": ${unsafe}, "ONSTART": ${unsafe},
            "ONSTOP": ${unsafe}
        }`);

        updatePluginObj(activity, maliciousObj);

        expect(Object.prototype.polluted).toBeUndefined();
        expect({}.polluted).toBeUndefined();

        for (const section of Object.keys(activity.pluginObjs)) {
            expect(
                Object.prototype.hasOwnProperty.call(activity.pluginObjs[section], "__proto__")
            ).toBe(false);
            expect(
                Object.prototype.hasOwnProperty.call(activity.pluginObjs[section], "constructor")
            ).toBe(false);
        }
    });

    it("does not throw when a plugin is missing optional sections", () => {
        const activity = {
            pluginObjs: {
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
            }
        };

        // Shape of plugins/maths.json: no FLOWPLUGINS, ONLOAD, ONSTART, ONSTOP.
        const mathsLike = JSON.parse(
            '{"PALETTEPLUGINS":{"maths":{"name":"maths"}},"ARGPLUGINS":{"a":"code"},"BLOCKPLUGINS":{"b":"code"}}'
        );
        expect(() => updatePluginObj(activity, mathsLike)).not.toThrow();

        // Shape of plugins/accelerometer.json: no PALETTEPLUGINS at all.
        const accelerometerLike = JSON.parse(
            '{"GLOBALS":"var x=1;","ARGPLUGINS":{"a":"code"},"BLOCKPLUGINS":{"b":"code"}}'
        );
        expect(() => updatePluginObj(activity, accelerometerLike)).not.toThrow();

        expect(activity.pluginObjs["PALETTEPLUGINS"]["maths"]).toEqual({ name: "maths" });
        expect(activity.pluginObjs["ARGPLUGINS"]["a"]).toBe("code");
    });
});
