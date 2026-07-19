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
});
