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

const FocusCycleManager = require("../focus-cycle-manager");

const pressTab = shiftKey => {
    const event = new KeyboardEvent("keydown", {
        key: "Tab",
        shiftKey,
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(event);
    return event;
};

describe("FocusCycleManager module", () => {
    afterEach(() => {
        const region = document.getElementById("fcm-announcer");
        if (region) {
            region.remove();
        }
        document.body.innerHTML = "";
    });

    describe("init lifecycle", () => {
        test("init registers keydown (capture), mousedown (bubble) and focusin (capture) listeners", () => {
            const addSpy = jest.spyOn(document, "addEventListener");
            const manager = new FocusCycleManager();
            manager.init();

            expect(addSpy).toHaveBeenCalledWith("keydown", manager._onKeyDown, true);
            expect(addSpy).toHaveBeenCalledWith("mousedown", manager._onMouseDown, false);
            expect(addSpy).toHaveBeenCalledWith("focusin", manager._onFocusIn, true);

            addSpy.mockRestore();
            manager.dispose();
        });

        test("init is idempotent: a second call registers no additional listeners", () => {
            const manager = new FocusCycleManager();
            const addSpy = jest.spyOn(document, "addEventListener");

            manager.init();
            const callsAfterFirstInit = addSpy.mock.calls.length;
            manager.init();

            expect(addSpy.mock.calls.length).toBe(callsAfterFirstInit);

            addSpy.mockRestore();
            manager.dispose();
        });

        test("init creates the visually hidden aria-live announcer", () => {
            const manager = new FocusCycleManager();
            manager.init();

            const region = document.getElementById("fcm-announcer");
            expect(region).not.toBeNull();
            expect(region.getAttribute("aria-live")).toBe("polite");
            expect(manager._liveRegion).toBe(region);

            manager.dispose();
        });

        test("dispose removes exactly the (type, handler, capture) triples init adds", () => {
            const added = [];
            const removed = [];
            const addSpy = jest
                .spyOn(document, "addEventListener")
                .mockImplementation((...args) => added.push(args));
            const removeSpy = jest
                .spyOn(document, "removeEventListener")
                .mockImplementation((...args) => removed.push(args));

            const manager = new FocusCycleManager();
            manager.init();
            manager.dispose();

            expect(removed.length).toBe(added.length);
            added.forEach(([type, fn, capture]) => {
                const match = removed.find(
                    ([rType, rFn, rCapture]) => rType === type && rFn === fn && rCapture === capture
                );
                expect(match).toBeDefined();
            });

            // After dispose, init must fully re-register (no partial init).
            manager.init();
            expect(added.length).toBe(6);

            addSpy.mockRestore();
            removeSpy.mockRestore();
        });

        test("the announcer node stays a singleton across instances and re-inits", () => {
            const first = new FocusCycleManager();
            const second = new FocusCycleManager();
            first.init();
            second.init();
            first.dispose();
            first.init();

            expect(document.querySelectorAll("#fcm-announcer").length).toBe(1);
            expect(first._liveRegion).toBe(second._liveRegion);

            first.dispose();
            expect(first._liveRegion).toBeNull();
            second.dispose();
        });

        test("dispose removes all document-level listeners so Tab no longer cycles", () => {
            const manager = new FocusCycleManager();
            manager.init();
            manager.dispose();

            pressTab(false);

            expect(manager._keyboardMode).toBe(false);
            expect(manager._currentZone).toBeNull();
        });

        test("init after dispose reattaches the existing live region and keeps announcing", () => {
            const manager = new FocusCycleManager();
            manager.init();
            const region = document.getElementById("fcm-announcer");
            expect(manager._liveRegion).toBe(region);

            manager.dispose();
            expect(manager._liveRegion).toBeNull();
            // The DOM node deliberately survives disposal.
            expect(document.getElementById("fcm-announcer")).toBe(region);

            manager.init();
            expect(manager._liveRegion).toBe(region);

            manager._announce("Toolbar active");
            expect(region.textContent).toBe("Toolbar active");

            // Listeners work again after re-init.
            pressTab(false);
            expect(manager._currentZone).toBe("toolbar");

            manager.dispose();
        });
    });

    describe("Tab cycling", () => {
        test("Tab cycles forward workspace -> toolbar -> palette -> workspace", () => {
            const manager = new FocusCycleManager();
            manager.init();

            pressTab(false);
            expect(manager._currentZone).toBe("toolbar");
            expect(manager._keyboardMode).toBe(true);

            pressTab(false);
            expect(manager._currentZone).toBe("palette");

            pressTab(false);
            expect(manager._currentZone).toBe("workspace");

            manager.dispose();
        });

        test("Shift+Tab cycles in reverse workspace -> palette -> toolbar", () => {
            const manager = new FocusCycleManager();
            manager.init();

            pressTab(true);
            expect(manager._currentZone).toBe("palette");

            pressTab(true);
            expect(manager._currentZone).toBe("toolbar");

            manager.dispose();
        });

        test("includes visible canvas controls in the Tab cycle", () => {
            const controls = document.createElement("div");
            controls.id = "buttoncontainerBOTTOM";
            const button = document.createElement("div");
            button.className = "tooltipped";
            button.setAttribute("tabindex", "0");
            Object.defineProperty(button, "offsetWidth", { configurable: true, value: 48 });
            const focusSpy = jest.spyOn(button, "focus");
            controls.appendChild(button);
            document.body.appendChild(controls);

            const manager = new FocusCycleManager();
            manager.init();
            manager._currentZone = "palette";
            manager._keyboardMode = true;

            pressTab(false);

            expect(manager._currentZone).toBe("controls");
            expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

            manager.dispose();
        });

        test("non-Tab keys are ignored", () => {
            const manager = new FocusCycleManager();
            manager.init();

            const event = new KeyboardEvent("keydown", {
                key: "Enter",
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);

            expect(manager._keyboardMode).toBe(false);
            expect(manager._currentZone).toBeNull();
            expect(event.defaultPrevented).toBe(false);

            manager.dispose();
        });
    });

    describe("keyboard navigation handoff", () => {
        test("exits keyboard mode without disposing the manager", () => {
            const manager = new FocusCycleManager();
            manager._keyboardMode = true;
            manager._currentZone = "toolbar";
            manager._lastFocusedButton = document.createElement("button");

            manager.exitKeyboardNavigation();

            expect(manager._keyboardMode).toBe(false);
            expect(manager._currentZone).toBeNull();
            expect(manager._lastFocusedButton).toBeNull();
        });
    });

    describe("bypass rules", () => {
        test("Tab is not intercepted while a textarea has focus", () => {
            const manager = new FocusCycleManager();
            manager.init();

            const textarea = document.createElement("textarea");
            document.body.appendChild(textarea);
            textarea.focus();

            const event = pressTab(false);

            expect(manager._keyboardMode).toBe(false);
            expect(event.defaultPrevented).toBe(false);

            manager.dispose();
        });

        test("Tab is not intercepted while a text input has focus", () => {
            const manager = new FocusCycleManager();
            manager.init();

            const input = document.createElement("input");
            input.type = "text";
            document.body.appendChild(input);
            input.focus();

            const event = pressTab(false);

            expect(manager._keyboardMode).toBe(false);
            expect(event.defaultPrevented).toBe(false);

            manager.dispose();
        });

        test("Tab is not intercepted while a contenteditable element has focus", () => {
            const manager = new FocusCycleManager();
            manager.init();

            const editable = {
                nodeName: "DIV",
                isContentEditable: true,
                closest: () => null
            };
            const activeSpy = jest
                .spyOn(document, "activeElement", "get")
                .mockReturnValue(editable);

            const event = pressTab(false);

            expect(manager._keyboardMode).toBe(false);
            expect(event.defaultPrevented).toBe(false);

            activeSpy.mockRestore();
            manager.dispose();
        });

        test("Tab with a modifier key is not intercepted", () => {
            const manager = new FocusCycleManager();
            manager.init();

            const event = new KeyboardEvent("keydown", {
                key: "Tab",
                ctrlKey: true,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);

            expect(manager._keyboardMode).toBe(false);
            expect(event.defaultPrevented).toBe(false);

            manager.dispose();
        });
    });

    describe("mouse interaction", () => {
        test("any mousedown exits keyboard mode and resets the tracked zone", () => {
            const manager = new FocusCycleManager();
            manager.init();

            pressTab(false);
            expect(manager._keyboardMode).toBe(true);
            expect(manager._currentZone).toBe("toolbar");

            document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

            expect(manager._keyboardMode).toBe(false);
            expect(manager._currentZone).toBeNull();

            manager.dispose();
        });
    });

    describe("legacy export compatibility", () => {
        test("toolbar-ui re-exports the same class (CommonJS)", () => {
            const ToolbarUI = require("../toolbar-ui");
            expect(ToolbarUI.FocusCycleManager).toBe(FocusCycleManager);
        });

        test("toolbar.js shim re-exports the same class", () => {
            const shim = require("../toolbar");
            expect(shim.FocusCycleManager).toBe(FocusCycleManager);
        });

        test("AMD registration exposes window.FocusCycleManager and ToolbarUI.FocusCycleManager", () => {
            let amdToolbarUI;
            global.define = (deps, factory) => {
                if (typeof deps === "function") {
                    factory = deps;
                    deps = [];
                }
                const resolved = deps.map(dep =>
                    dep === "activity/focus-cycle-manager" ? FocusCycleManager : undefined
                );
                const result = factory(...resolved);
                if (result && result.name === "ToolbarUI") {
                    amdToolbarUI = result;
                }
            };
            global.define.amd = {};

            try {
                jest.isolateModules(() => {
                    require("../toolbar-ui");
                });
            } finally {
                delete global.define;
            }

            expect(amdToolbarUI).toBeDefined();
            expect(amdToolbarUI.FocusCycleManager).toBe(FocusCycleManager);
            expect(window.ToolbarUI).toBe(amdToolbarUI);
            expect(window.ToolbarUI.FocusCycleManager).toBe(FocusCycleManager);
            expect(window.Toolbar).toBe(amdToolbarUI);
            expect(window.FocusCycleManager).toBe(FocusCycleManager);

            delete window.Toolbar;
            delete window.ToolbarUI;
            delete window.FocusCycleManager;
        });
    });

    describe("notification popup bypass", () => {
        // index.html ships both popups in the DOM permanently; css/activities.css
        // hides them with `visibility: hidden` and reveals them by adding `.show`.
        // Reproduce that here so getComputedStyle behaves as it does in a browser.
        const POPUP_CSS = `
            .popupMsg { visibility: hidden; }
            #printText.show, #errorText.show { visibility: visible; }
        `;

        const mountPopups = () => {
            const style = document.createElement("style");
            style.id = "popup-css";
            style.textContent = POPUP_CSS;
            document.head.appendChild(style);
            document.body.insertAdjacentHTML(
                "beforeend",
                '<div class="popupMsg" id="printText" tabindex="-1" aria-live="polite" role="status"></div>' +
                    '<div class="popupMsg" id="errorText" tabindex="-1" aria-live="assertive" role="alert"></div>'
            );
            return {
                printText: document.getElementById("printText"),
                errorText: document.getElementById("errorText")
            };
        };

        afterEach(() => {
            const style = document.getElementById("popup-css");
            if (style) style.remove();
        });

        test("Tab still cycles when the popups are present but hidden", () => {
            mountPopups();
            const manager = new FocusCycleManager();
            manager.init();

            const event = pressTab(false);

            expect(manager._keyboardMode).toBe(true);
            expect(event.defaultPrevented).toBe(true);

            manager.dispose();
        });

        test("Tab is not intercepted while the print popup is shown", () => {
            const { printText } = mountPopups();
            printText.classList.add("show");

            const manager = new FocusCycleManager();
            manager.init();

            const event = pressTab(false);

            expect(manager._keyboardMode).toBe(false);
            expect(event.defaultPrevented).toBe(false);

            manager.dispose();
        });

        test("Tab is not intercepted while the error popup is shown", () => {
            const { errorText } = mountPopups();
            errorText.classList.add("show");

            const manager = new FocusCycleManager();
            manager.init();

            const event = pressTab(false);

            expect(manager._keyboardMode).toBe(false);
            expect(event.defaultPrevented).toBe(false);

            manager.dispose();
        });

        test("a popup hidden with display:none does not block cycling", () => {
            const { errorText } = mountPopups();
            // activity.js hides errorText this way rather than by class.
            errorText.style.display = "none";

            const manager = new FocusCycleManager();
            manager.init();

            const event = pressTab(false);

            expect(manager._keyboardMode).toBe(true);
            expect(event.defaultPrevented).toBe(true);

            manager.dispose();
        });
    });

    describe("zone entry and exit against a populated chrome", () => {
        // jsdom (even v30) ships no PointerEvent constructor; the workspace-enter
        // path constructs one directly, so stub a minimal, standards-shaped
        // version the way toolbar.test.js already does.
        let realPointerEvent;
        beforeAll(() => {
            realPointerEvent = global.PointerEvent;
            global.PointerEvent = class PointerEvent extends Event {
                constructor(type, init = {}) {
                    super(type, init);
                }
            };
        });
        afterAll(() => {
            global.PointerEvent = realPointerEvent;
        });

        let paletteModel;
        const mountChrome = ({ rows = 0 } = {}) => {
            document.body.insertAdjacentHTML(
                "beforeend",
                `<div id="toolbars"><button id="tb1" tabindex="0">A</button></div>
                 <div id="palette" tabindex="-1">
                   <div><div></div><div><div></div><div id="paletteListBody"></div></div></div>
                 </div>
                 <div id="canvasHolder"></div>
                 <canvas id="canvas"></canvas>`
            );
            const listBody = document.getElementById("paletteListBody");
            for (let i = 0; i < rows; i++) {
                listBody.appendChild(document.createElement("div"));
            }
            paletteModel = { resetKeyboardNavigation: jest.fn() };
            globalThis.ActivityContext = {
                getActivity: () => ({ palettes: paletteModel, blocks: {} })
            };
        };

        afterEach(() => {
            delete globalThis.ActivityContext;
            paletteModel = undefined;
        });

        test("entering the workspace zone focuses #canvasHolder and announces it", () => {
            mountChrome();
            const holder = document.getElementById("canvasHolder");
            const focusSpy = jest.spyOn(holder, "focus");

            const manager = new FocusCycleManager();
            manager.init();
            // workspace -> Tab -> toolbar -> Tab -> palette -> Tab -> workspace
            pressTab(false);
            pressTab(false);
            pressTab(false);

            expect(manager._currentZone).toBe("workspace");
            expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
            expect(holder.getAttribute("tabindex")).toBe("-1");
            expect(document.getElementById("fcm-announcer").textContent).toBe("Workspace active");

            manager.dispose();
        });

        test("entering the toolbar zone adds the focus ring and announces it", () => {
            mountChrome();
            const toolbars = document.getElementById("toolbars");

            const manager = new FocusCycleManager();
            manager.init();
            pressTab(false);

            expect(manager._currentZone).toBe("toolbar");
            expect(toolbars.classList.contains("focus-zone-active")).toBe(true);
            expect(document.getElementById("fcm-announcer").textContent).toBe("Toolbar active");

            manager.dispose();
        });

        test("entering the palette zone syncs palette.js state and pre-focuses a block row", () => {
            mountChrome({ rows: 3 });

            const manager = new FocusCycleManager();
            manager.init();
            pressTab(false); // toolbar
            pressTab(false); // palette

            expect(manager._currentZone).toBe("palette");
            expect(paletteModel._keyboardNavActive).toBe(true);
            expect(paletteModel._navSection).toBe("blocks");
            expect(paletteModel._navBlockIndex).toBe(1);

            const rows = document.getElementById("paletteListBody").children;
            expect(rows[1].dataset.keyboardFocus).toBe("true");
            expect(document.getElementById("fcm-announcer").textContent).toBe("Palette active");

            manager.dispose();
        });

        test("leaving the palette zone resets palette keyboard navigation", () => {
            mountChrome({ rows: 2 });

            const manager = new FocusCycleManager();
            manager.init();
            pressTab(false); // toolbar
            pressTab(false); // palette
            paletteModel.resetKeyboardNavigation.mockClear();
            pressTab(false); // palette -> workspace, leaving palette

            expect(paletteModel.resetKeyboardNavigation).toHaveBeenCalledWith({
                closeMenus: true,
                blur: true
            });

            manager.dispose();
        });

        test("leaving the toolbar zone strips the toolbar-btn-focused class", () => {
            mountChrome();
            const button = document.getElementById("tb1");
            button.classList.add("toolbar-btn-focused");

            const manager = new FocusCycleManager();
            manager.init();
            pressTab(false); // workspace -> toolbar
            pressTab(false); // toolbar -> palette, leaving toolbar

            expect(button.classList.contains("toolbar-btn-focused")).toBe(false);

            manager.dispose();
        });

        test("a mousedown on the workspace focuses the holder and clears toolbar focus", () => {
            mountChrome();
            const holder = document.getElementById("canvasHolder");
            const button = document.getElementById("tb1");
            button.classList.add("toolbar-btn-focused");
            const focusSpy = jest.spyOn(holder, "focus");

            const manager = new FocusCycleManager();
            manager.init();
            holder.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

            expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
            expect(button.classList.contains("toolbar-btn-focused")).toBe(false);
            expect(manager._currentZone).toBe("workspace");
            expect(paletteModel.resetKeyboardNavigation).toHaveBeenCalledWith({
                closeMenus: true,
                blur: true
            });

            manager.dispose();
        });
    });
});
