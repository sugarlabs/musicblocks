/**
 * @license
 * MusicBlocks v3.7.1
 * Copyright (C) 2026 Netram Faran
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

// toolbar-ui.js binds `const $j = window.jQuery` at module load, so the stub
// has to be in place before the module is required. Each test therefore resets
// the module registry and requires a fresh copy.

describe("ToolbarUI tooltip dismissal", () => {
    let ToolbarUI;
    let calls;
    let clickHandler;

    const makeElement = id => ({
        id,
        style: {},
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn(), contains: jest.fn(() => false) },
        addEventListener: jest.fn(),
        appendChild: jest.fn(),
        focus: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        querySelector: jest.fn(() => null),
        innerHTML: ""
    });

    beforeEach(() => {
        jest.resetModules();

        calls = { tooltip: [], css: [] };
        clickHandler = null;

        const jq = jest.fn(selector => ({
            tooltip: jest.fn(opts => calls.tooltip.push({ selector, opts })),
            dropdown: jest.fn(),
            css: jest.fn((prop, value) => calls.css.push({ selector, prop, value })),
            trigger: jest.fn(),
            on: jest.fn((event, handler) => {
                if (selector === ".tooltipped" && event === "click") {
                    clickHandler = handler;
                }
            })
        }));
        jq.noConflict = jest.fn(() => jq);

        global.jQuery = jq;
        global.window.jQuery = jq;
        global.window.platformColor = { stopIconcolor: "#ea174c" };
        global.platformColor = { stopIconcolor: "#ea174c" };
        global.makeKeyboardAccessible = jest.fn();
        global.docById = id => makeElement(id);
        global.document.getElementById = jest.fn(id => makeElement(id));
        global._THIS_IS_MUSIC_BLOCKS_ = true;
        global._ = jest.fn(x => x);

        ToolbarUI = require("../toolbar-ui");
        const toolbar = new ToolbarUI();
        toolbar.init({ beginnerMode: true });
    });

    afterEach(() => {
        delete global.window.jQuery;
        delete global.window.platformColor;
        delete global._THIS_IS_MUSIC_BLOCKS_;
        delete global._;
    });

    it("binds a click handler to the tooltipped elements", () => {
        expect(typeof clickHandler).toBe("function");
    });

    it("configures the tooltips with the shorter delay at init", () => {
        const init = calls.tooltip.find(c => c.selector === ".tooltipped" && c.opts);

        expect(init.opts).toEqual({ html: true, delay: 100 });
    });

    // Materialize recognises only "remove". Any other string, "close"
    // included, falls through to a full re-initialisation that rebuilds the
    // tooltip with the plugin defaults, discarding the delay set at init.
    it("does not call the tooltip plugin when a tooltip is dismissed", () => {
        const before = calls.tooltip.length;

        clickHandler.call({ getAttribute: () => "tooltip-42" });

        expect(calls.tooltip).toHaveLength(before);
    });

    it("never passes a bare string to the tooltip plugin", () => {
        clickHandler.call({ getAttribute: () => "tooltip-42" });

        expect(calls.tooltip.every(c => typeof c.opts !== "string")).toBe(true);
    });

    it("hides the tooltip node belonging to the clicked element", () => {
        clickHandler.call({ getAttribute: () => "tooltip-42" });

        expect(calls.css).toContainEqual({
            selector: "#tooltip-42",
            prop: "visibility",
            value: "hidden"
        });
    });

    it("does nothing for an element that has no tooltip yet", () => {
        clickHandler.call({ getAttribute: () => null });

        expect(calls.css).toHaveLength(0);
    });
});
