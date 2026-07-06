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
    let appendChildSpy;

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
        URL.createObjectURL = jest.fn(() => "blob:plugin-setup");
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
        document.head.innerHTML = "";
        delete window.__mb_plugin_registry;
        jest.useRealTimers();
    });

    it("removes setup script elements after they load", async () => {
        const originalAppendChild = document.head.appendChild.bind(document.head);
        appendChildSpy = jest.spyOn(document.head, "appendChild").mockImplementation(script => {
            originalAppendChild(script);
            script.onload();
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
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:plugin-setup");
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
        expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:plugin-setup");
    });
});
