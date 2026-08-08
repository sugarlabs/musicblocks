/**
 * MusicBlocks v3.6.2
 *
 * @license
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

// Regression coverage for #7046: unvetted plugin setup code (BLOCKPLUGINS,
// GLOBALS, ONLOAD) must NOT be executed in the main realm, even after the
// user clears the confirmation dialog. Vetted (built-in/local) plugins keep
// their existing execution path. Runs in the default jsdom environment.

global._ = msg => msg;
global.base64Encode = jest.fn(str => str);

const { processPluginData } = require("../utils.js");

describe("processPluginData plugin setup security (#7046)", () => {
    let createObjectURL;
    let appendChildSpy;

    beforeEach(() => {
        jest.restoreAllMocks();

        window.__mb_plugin_registry = {};

        createObjectURL = jest.fn(() => "blob:mock");
        global.URL.createObjectURL = createObjectURL;
        global.URL.revokeObjectURL = jest.fn();

        // A real jsdom-appended blob <script> never fires onload, so the await in
        // processPluginData would hang. Trigger onload synchronously on append.
        appendChildSpy = jest.spyOn(document.head, "appendChild").mockImplementation(script => {
            if (typeof script.onload === "function") script.onload();
            return script;
        });

        jest.spyOn(document.head, "removeChild").mockImplementation(() => {});

        // User clicks "allow" on the unvetted-plugin confirmation dialog.
        jest.spyOn(window, "confirm").mockImplementation(() => true);

        jest.spyOn(console, "warn").mockImplementation(() => {});
        jest.spyOn(console, "debug").mockImplementation(() => {});
    });

    const makeActivity = () => ({
        blocks: { protoBlockDict: {} },
        palettes: { show: jest.fn(), updatePalettes: jest.fn() }
    });

    test("blocks unvetted plugin GLOBALS setup from executing in the main realm", async () => {
        const plugin = JSON.stringify({ GLOBALS: "window.__pwned = true;" });

        await processPluginData(makeActivity(), plugin, "upload");

        // No Blob script injected -> untrusted setup code never runs.
        expect(createObjectURL).not.toHaveBeenCalled();
        expect(appendChildSpy).not.toHaveBeenCalled();
        expect(console.warn).toHaveBeenCalledWith(
            "Blocked unvetted plugin setup execution:",
            "GLOBALS",
            "upload"
        );
    });

    test("blocks unvetted plugin BLOCKPLUGINS setup from executing", async () => {
        const plugin = JSON.stringify({ BLOCKPLUGINS: { evil: "window.__pwned = true;" } });

        await processPluginData(makeActivity(), plugin, "upload");

        expect(createObjectURL).not.toHaveBeenCalled();
        expect(appendChildSpy).not.toHaveBeenCalled();
    });

    test("allows vetted (local) plugin GLOBALS setup to execute", async () => {
        const plugin = JSON.stringify({ GLOBALS: "window.__ok = true;" });

        await processPluginData(makeActivity(), plugin, "plugins/example.json");

        // Vetted source -> setup Blob script injected as before.
        expect(createObjectURL).toHaveBeenCalled();
        expect(appendChildSpy).toHaveBeenCalled();
    });
});
