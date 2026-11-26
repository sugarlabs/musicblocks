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
    let toolbar;
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

        calls = { tooltip: [], trigger: [] };
        clickHandler = null;

        const jq = jest.fn(selector => ({
            tooltip: jest.fn(opts => calls.tooltip.push({ selector, opts })),
            dropdown: jest.fn(),
            trigger: jest.fn(event => calls.trigger.push({ selector, event })),
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
        toolbar = new ToolbarUI();
        toolbar.init({ beginnerMode: true });
    });

    afterEach(() => {
        if (toolbar) {
            toolbar.dispose();
        }
        document.body.innerHTML = "";
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

    it("triggers the tooltip mouseleave handler on the clicked element", () => {
        const element = {};

        clickHandler.call(element);

        expect(calls.trigger).toContainEqual({ selector: element, event: "mouseleave.tooltip" });
    });

    describe("open-dropdown tooltip guard", () => {
        const buildToolbarDom = isOpen => {
            const otherBtn = document.createElement("a");
            otherBtn.id = "advancedMode";
            otherBtn.className = "tooltipped";

            const dropdown = document.createElement("ul");
            dropdown.id = "themedropdown";
            dropdown.className = "dropdown-content";
            dropdown.style.display = isOpen ? "block" : "none";

            const itemBtn = document.createElement("a");
            itemBtn.id = "light";
            itemBtn.className = "tooltipped";
            dropdown.appendChild(itemBtn);

            document.body.appendChild(otherBtn);
            document.body.appendChild(dropdown);
            return { otherBtn, dropdown, itemBtn };
        };

        it("suppresses mouseenter on outside tooltipped elements while a dropdown is open", () => {
            const { otherBtn } = buildToolbarDom(true);
            const targetListener = jest.fn();
            otherBtn.addEventListener("mouseenter", targetListener);

            otherBtn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));

            expect(targetListener).not.toHaveBeenCalled();
        });

        it("allows mouseenter on tooltipped items inside the open dropdown", () => {
            const { itemBtn } = buildToolbarDom(true);
            const targetListener = jest.fn();
            itemBtn.addEventListener("mouseenter", targetListener);

            itemBtn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));

            expect(targetListener).toHaveBeenCalledTimes(1);
        });

        it("allows mouseenter on outside tooltipped elements when all dropdowns are closed", () => {
            const { otherBtn } = buildToolbarDom(false);
            const targetListener = jest.fn();
            otherBtn.addEventListener("mouseenter", targetListener);

            otherBtn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));

            expect(targetListener).toHaveBeenCalledTimes(1);
        });

        it("removes the capture listener on dispose", () => {
            const { otherBtn } = buildToolbarDom(true);
            const targetListener = jest.fn();
            otherBtn.addEventListener("mouseenter", targetListener);

            toolbar.dispose();
            otherBtn.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));

            expect(targetListener).toHaveBeenCalledTimes(1);
        });
    });
});
