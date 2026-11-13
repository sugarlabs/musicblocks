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

        ({ processPluginData } = require("../plugin-utils.js"));
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
            script.onerror({ type: "error" });
            return script;
        });

        let err;
        try {
            await processPluginData(
                createActivity(),
                JSON.stringify({
                    BLOCKPLUGINS: {
                        testBlock: "globalThis.pluginSetupLoaded = true;"
                    }
                }),
                "plugins/test.json"
            );
        } catch (e) {
            err = e;
        }

        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Failed to execute plugin script");

        expect(document.head.querySelectorAll("script[src^='blob:plugin-setup']")).toHaveLength(0);
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:plugin-setup-0");
    });

    it("rejects when main blob script fails to load", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const originalAppendChild = document.head.appendChild.bind(document.head);
        appendChildSpy = jest.spyOn(document.head, "appendChild").mockImplementation(script => {
            originalAppendChild(script);
            script.onerror({ type: "error" });
            return script;
        });

        let err;
        try {
            await processPluginData(
                createActivity(),
                JSON.stringify({
                    FLOWPLUGINS: {
                        testFlow: "return true;"
                    }
                }),
                "plugins/test.json"
            );
        } catch (e) {
            err = e;
        }

        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe("Failed to load plugin script");

        errorSpy.mockRestore();
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
        ({ processPluginData } = require("../plugin-utils.js"));
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
        ({ updatePluginObj } = require("../plugin-utils.js"));
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

describe("processPluginData - plugin vetting", () => {
    let processPluginData;
    let originalCreateObjectURL;
    let originalRevokeObjectURL;
    let originalBlob;
    let appendChildSpy;

    const mockScriptLoading = () => {
        const blobUrls = new Map();
        let blobUrlIndex = 0;
        URL.createObjectURL = jest.fn(blob => {
            const url = `blob:plugin-vetting-${blobUrlIndex}`;
            blobUrlIndex += 1;
            blobUrls.set(url, blob);
            return url;
        });
        URL.revokeObjectURL = jest.fn();
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
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.resetModules();
        document.head.innerHTML = "";

        global._ = msg => msg;
        global.confirm = jest.fn();
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

        ({ processPluginData } = require("../plugin-utils.js"));
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
        delete global.confirm;
        jest.useRealTimers();
    });

    it.each([["plugins/test.json"], ["./plugins/test.json"], ["localStorage:plugins"]])(
        "does not ask for confirmation for vetted source %s",
        async source => {
            const activity = createActivity();
            const result = await processPluginData(
                activity,
                JSON.stringify({ IMAGES: { img1: "data:image/png;base64,abc" } }),
                source
            );

            expect(global.confirm).not.toHaveBeenCalled();
            expect(result).not.toBeNull();
            expect(activity.pluginsImages["img1"]).toBe("data:image/png;base64,abc");
        }
    );

    it("returns null without side effects when the user declines an unvetted plugin", async () => {
        global.confirm.mockReturnValue(false);
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

        const activity = createActivity();
        const result = await processPluginData(
            activity,
            JSON.stringify({
                PALETTEPLUGINS: { evilpal: "<svg/>" },
                IMAGES: { img1: "data:image/png;base64,abc" }
            }),
            "https://example.com/plugin.json"
        );

        expect(global.confirm).toHaveBeenCalledTimes(1);
        expect(result).toBeNull();
        expect(activity.palettes.add).not.toHaveBeenCalled();
        expect(activity.pluginsImages["img1"]).toBeUndefined();
        expect(PALETTEICONS["evilpal"]).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledWith(
            "User declined unvetted plugin execution:",
            "https://example.com/plugin.json"
        );

        warnSpy.mockRestore();
    });

    it("stores raw code in the eval dictionaries when the user confirms an unvetted plugin", async () => {
        global.confirm.mockReturnValue(true);

        const activity = createActivity();
        await processPluginData(
            activity,
            JSON.stringify({
                FLOWPLUGINS: { myFlow: "return receivedArg + 1;" },
                ARGPLUGINS: { myArg: "return 42;" },
                SETTERPLUGINS: { mySetter: "logo.setTurtle(turtle);" },
                PARAMETERPLUGINS: { myParam: "return blk;" },
                ONSTART: { myStart: "logo.runLogoCommands();" },
                ONSTOP: { myStop: "logo.onStopTurtle();" }
            }),
            "https://example.com/plugin.json"
        );

        expect(global.confirm).toHaveBeenCalledTimes(1);
        // Unvetted code is kept as strings, not pre-compiled into the blob registry.
        expect(activity.logo.evalFlowDict["myFlow"]).toBe("return receivedArg + 1;");
        expect(activity.logo.evalArgDict["myArg"]).toBe("return 42;");
        expect(activity.logo.evalSetterDict["mySetter"]).toBe("logo.setTurtle(turtle);");
        expect(activity.logo.evalParameterDict["myParam"]).toBe("return blk;");
        expect(activity.logo.evalOnStartList["myStart"]).toBe("logo.runLogoCommands();");
        expect(activity.logo.evalOnStopList["myStop"]).toBe("logo.onStopTurtle();");
    });

    it("compiles vetted plugin code into registry functions", async () => {
        mockScriptLoading();

        const activity = createActivity();
        await processPluginData(
            activity,
            JSON.stringify({
                FLOWPLUGINS: { myFlow: "return receivedArg + 1;" },
                ARGPLUGINS: { myArg: "return 42;" },
                ONSTART: { myStart: "logo.started = true;" },
                ONSTOP: { myStop: "logo.stopped = true;" }
            }),
            "plugins/test.json"
        );

        expect(global.confirm).not.toHaveBeenCalled();

        const flow = activity.logo.evalFlowDict["myFlow"];
        const arg = activity.logo.evalArgDict["myArg"];
        expect(typeof flow).toBe("function");
        expect(typeof arg).toBe("function");
        expect(flow(null, null, null, 1)).toBe(2);
        expect(arg()).toBe(42);

        // Registry entries are consumed once mapped back into the dictionaries.
        expect(Object.keys(window.__mb_plugin_registry)).toHaveLength(0);
    });

    it("runs ONSTART/ONSTOP registry functions with the logo object", async () => {
        mockScriptLoading();

        const activity = createActivity();
        await processPluginData(
            activity,
            JSON.stringify({
                ONSTART: { myStart: "logo.started = true;" },
                ONSTOP: { myStop: "logo.stopped = true;" }
            }),
            "plugins/test.json"
        );

        const logo = {};
        activity.logo.evalOnStartList["myStart"](logo);
        activity.logo.evalOnStopList["myStop"](logo);
        expect(logo.started).toBe(true);
        expect(logo.stopped).toBe(true);
    });
});

describe("processPluginData - palette registration", () => {
    let processPluginData;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.resetModules();
        global._ = msg => msg;
        global.PALETTEICONS = {};
        global.PALETTEFILLCOLORS = {};
        global.PALETTESTROKECOLORS = {};
        global.PALETTEHIGHLIGHTCOLORS = {};
        global.HIGHLIGHTSTROKECOLORS = {};
        global.MULTIPALETTES = [[], [], []];
        global.platformColor = { paletteColors: {} };
        ({ processPluginData } = require("../plugin-utils.js"));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("registers a new palette with default colors", async () => {
        const activity = createActivity();
        await processPluginData(
            activity,
            JSON.stringify({ PALETTEPLUGINS: { mypal: "<svg/>" } }),
            "plugins/test.json"
        );

        expect(PALETTEICONS["mypal"]).toBe("<svg/>");
        expect(PALETTEFILLCOLORS["mypal"]).toBe("#ff0066");
        expect(PALETTESTROKECOLORS["mypal"]).toBe("#ef003e");
        expect(PALETTEHIGHLIGHTCOLORS["mypal"]).toBe("#ffb1b3");
        expect(HIGHLIGHTSTROKECOLORS["mypal"]).toBe("#404040");
        expect(platformColor.paletteColors["mypal"]).toEqual([
            "#ff0066",
            "#ef003e",
            "#ffb1b3",
            "#404040"
        ]);
        expect(activity.palettes.add).toHaveBeenCalledWith("mypal");
        expect(MULTIPALETTES[2]).toContain("mypal");
        expect(activity.palettes.makePalettes).toHaveBeenCalledWith(1);
        expect(activity.palettes.updatePalettes).toHaveBeenCalledWith("mypal");
    });

    it("uses custom palette colors when provided", async () => {
        const activity = createActivity();
        await processPluginData(
            activity,
            JSON.stringify({
                PALETTEPLUGINS: { mypal: "<svg/>" },
                PALETTEFILLCOLORS: { mypal: "#111111" },
                PALETTESTROKECOLORS: { mypal: "#222222" },
                PALETTEHIGHLIGHTCOLORS: { mypal: "#333333" },
                HIGHLIGHTSTROKECOLORS: { mypal: "#444444" }
            }),
            "plugins/test.json"
        );

        expect(platformColor.paletteColors["mypal"]).toEqual([
            "#111111",
            "#222222",
            "#333333",
            "#444444"
        ]);
    });

    it("does not re-add a palette that already exists", async () => {
        const activity = createActivity();
        activity.palettes.buttons = { mypal: {} };
        const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

        await processPluginData(
            activity,
            JSON.stringify({ PALETTEPLUGINS: { mypal: "<svg/>" } }),
            "plugins/test.json"
        );

        expect(activity.palettes.add).not.toHaveBeenCalled();
        expect(MULTIPALETTES[2]).not.toContain("mypal");
        expect(activity.palettes.makePalettes).not.toHaveBeenCalled();

        debugSpy.mockRestore();
    });

    it("schedules a palette refresh after loading", async () => {
        const activity = createActivity();
        await processPluginData(
            activity,
            JSON.stringify({ IMAGES: { img1: "data:image/png;base64,abc" } }),
            "plugins/test.json"
        );

        expect(activity.palettes.show).not.toHaveBeenCalled();
        jest.advanceTimersByTime(2000);
        expect(activity.palettes.show).toHaveBeenCalledTimes(1);
    });
});

describe("processPluginData - macros, images and setup code", () => {
    let processPluginData;
    let originalCreateObjectURL;
    let originalRevokeObjectURL;
    let originalBlob;
    let appendChildSpy;

    const mockScriptLoading = () => {
        const blobUrls = new Map();
        let blobUrlIndex = 0;
        URL.createObjectURL = jest.fn(blob => {
            const url = `blob:plugin-misc-${blobUrlIndex}`;
            blobUrlIndex += 1;
            blobUrls.set(url, blob);
            return url;
        });
        URL.revokeObjectURL = jest.fn();
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
    };

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

        ({ processPluginData } = require("../plugin-utils.js"));
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
        jest.useRealTimers();
    });

    it("parses valid macro JSON into pluginMacros", async () => {
        const activity = createActivity();
        await processPluginData(
            activity,
            JSON.stringify({ MACROPLUGINS: { mymacro: '[["note",{"x":0}]]' } }),
            "plugins/test.json"
        );

        expect(activity.palettes.pluginMacros["mymacro"]).toEqual([["note", { x: 0 }]]);
    });

    it("skips macros with invalid JSON without throwing", async () => {
        const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
        const activity = createActivity();

        await expect(
            processPluginData(
                activity,
                JSON.stringify({ MACROPLUGINS: { badmacro: "{oops" } }),
                "plugins/test.json"
            )
        ).resolves.not.toBeNull();

        expect(activity.palettes.pluginMacros["badmacro"]).toBeUndefined();
        debugSpy.mockRestore();
    });

    it("executes GLOBALS setup code", async () => {
        mockScriptLoading();

        const activity = createActivity();
        await processPluginData(
            activity,
            JSON.stringify({ GLOBALS: "globalThis.globalsRan = true;" }),
            "plugins/test.json"
        );

        expect(globalThis.globalsRan).toBe(true);
        delete globalThis.globalsRan;
    });

    it("skips setup code larger than 500000 characters", async () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        const createUrlSpy = jest.fn();
        URL.createObjectURL = createUrlSpy;

        const activity = createActivity();
        await processPluginData(
            activity,
            JSON.stringify({ BLOCKPLUGINS: { bigBlock: "x".repeat(500001) } }),
            "plugins/test.json"
        );

        expect(warnSpy).toHaveBeenCalledWith("Plugin code too large:", "BLOCKPLUGINS:bigBlock");
        expect(createUrlSpy).not.toHaveBeenCalled();

        warnSpy.mockRestore();
    });

    it("rewrites Function('return this')() so CSP does not block the setup code", async () => {
        mockScriptLoading();

        const activity = createActivity();
        await processPluginData(
            activity,
            JSON.stringify({
                BLOCKPLUGINS: {
                    myBlock: "globalThis.cspProbe = Function('return this')();"
                }
            }),
            "plugins/test.json"
        );

        expect(globalThis.cspProbe).toBe(window);
        delete globalThis.cspProbe;
    });
});

describe("processRawPluginData", () => {
    let processRawPluginData;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.resetModules();
        global._ = msg => msg;
        global.PALETTEICONS = {};
        global.PALETTEFILLCOLORS = {};
        global.PALETTESTROKECOLORS = {};
        global.PALETTEHIGHLIGHTCOLORS = {};
        global.HIGHLIGHTSTROKECOLORS = {};
        global.MULTIPALETTES = [[], [], []];
        global.platformColor = { paletteColors: {} };
        ({ processRawPluginData } = require("../plugin-utils.js"));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("strips blank lines and comment lines before parsing", async () => {
        const activity = createActivity();
        const raw = [
            "",
            "// a plugin comment",
            "/*****************************************",
            "{",
            '  "IMAGES": { "img1": "data:image/png;base64,abc" }',
            "}"
        ].join("\n");

        const result = await processRawPluginData(activity, raw, "plugins/test.json");

        expect(result).not.toBeNull();
        expect(activity.pluginsImages["img1"]).toBe("data:image/png;base64,abc");
    });

    it("returns null when the cleaned data is not valid JSON", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

        const activity = createActivity();
        const result = await processRawPluginData(activity, "{invalid", "plugins/test.json");

        expect(result).toBeNull();

        errorSpy.mockRestore();
        debugSpy.mockRestore();
    });
});

describe("updatePluginObj and preparePluginExports", () => {
    let updatePluginObj;
    let preparePluginExports;

    const createPluginObjActivity = () => ({
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
    });

    beforeEach(() => {
        jest.resetModules();
        ({ updatePluginObj, preparePluginExports } = require("../plugin-utils.js"));
    });

    it("ignores a null plugin object", () => {
        const activity = createPluginObjActivity();
        expect(() => updatePluginObj(activity, null)).not.toThrow();
        expect(activity.pluginObjs["FLOWPLUGINS"]).toEqual({});
    });

    it("concatenates GLOBALS across plugins", () => {
        const activity = createPluginObjActivity();
        updatePluginObj(activity, { GLOBALS: "var a = 1;" });
        updatePluginObj(activity, { GLOBALS: "var b = 2;" });

        expect(activity.pluginObjs["GLOBALS"]).toBe("var a = 1;var b = 2;");
    });

    it("replaces IMAGES with the latest plugin images", () => {
        const activity = createPluginObjActivity();
        updatePluginObj(activity, { IMAGES: { old: "img-old" } });
        updatePluginObj(activity, { IMAGES: { fresh: "img-new" } });

        expect(activity.pluginObjs["IMAGES"]).toEqual({ fresh: "img-new" });
    });

    it("preparePluginExports merges and JSON-encodes the plugin objects", () => {
        const activity = createPluginObjActivity();
        const exported = preparePluginExports(activity, {
            FLOWPLUGINS: { myFlow: "return 1;" },
            ONLOAD: { myLoad: "init();" }
        });

        const parsed = JSON.parse(exported);
        expect(parsed["FLOWPLUGINS"]["myFlow"]).toBe("return 1;");
        expect(parsed["ONLOAD"]["myLoad"]).toBe("init();");
    });
});
