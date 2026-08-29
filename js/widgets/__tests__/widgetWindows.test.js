/**
 * MusicBlocks
 *
 * @author kh-ub-ayb
 *
 * @copyright 2026 kh-ub-ayb
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

const fs = require("fs");
const path = require("path");

// Set up globals required by widgetWindows.js before importing
global._ = str => str;
global.makeKeyboardAccessible = require("../../utils/dom-helpers").makeKeyboardAccessible;
global.docById = jest.fn(id => document.getElementById(id));
global.requestAnimationFrame = jest.fn(cb => cb());

// Set up the DOM before loading the module
const floatingWindows = document.createElement("div");
floatingWindows.id = "floatingWindows";
document.body.appendChild(floatingWindows);

const nav = document.createElement("nav");
document.body.appendChild(nav);

const canvas = document.createElement("canvas");
canvas.id = "myCanvas";
document.body.appendChild(canvas);

Object.defineProperty(window, "localStorage", {
    writable: true,
    value: { languagePreference: "en" }
});

// Load the module — this sets up window.widgetWindows and WidgetWindow class
require("../widgetWindows.js");

// Keep a reference to the factory functions set up by the module
const { windowFor, isOpen, hideAllWindows, showWindows, clear: clearWindow } = window.widgetWindows;

// Counter for unique keys
let keyCounter = 0;

/**
 * Creates a new WidgetWindow instance for testing using windowFor.
 * Each call uses a unique key to get a fresh window.
 * @param {string} title - Window title.
 * @param {boolean} fullscreen - Enable fullscreen.
 * @returns {Object} The WidgetWindow instance.
 */
function createTestWindow(title = "Test Title", fullscreen = true) {
    keyCounter++;
    const widget = { blockNo: keyCounter };
    // We need to clear any previously opened window with this key
    window.widgetWindows.openWindows[keyCounter] = undefined;
    const win = windowFor(widget, title, undefined, fullscreen);
    return win;
}

beforeEach(() => {
    // Clear the floatingWindows container but keep it in DOM
    floatingWindows.innerHTML = "";
    // Reset open windows tracking but preserve functions
    const savedFunctions = {
        windowFor: window.widgetWindows.windowFor,
        isOpen: window.widgetWindows.isOpen,
        hideAllWindows: window.widgetWindows.hideAllWindows,
        showWindows: window.widgetWindows.showWindows,
        clear: window.widgetWindows.clear,
        hideWindow: window.widgetWindows.hideWindow
    };
    window.widgetWindows.openWindows = {};
    window.widgetWindows._posCache = {};
    window.widgetWindows._globalListenersInitialized = false;
    window.widgetWindows.draggingWindow = null;
    // Restore functions
    Object.assign(window.widgetWindows, savedFunctions);
});

describe("widgetWindows", () => {
    describe("WidgetWindow constructor (via windowFor)", () => {
        test("creates a window with _visible set to true", () => {
            const win = createTestWindow();

            expect(win._visible).toBe(true);
        });

        test("creates a window with _maximized set to false", () => {
            const win = createTestWindow();

            expect(win._maximized).toBe(false);
        });

        test("creates a window with _rolled set to false", () => {
            const win = createTestWindow();

            expect(win._rolled).toBe(false);
        });

        test("creates a window with _buttons as empty array", () => {
            const win = createTestWindow();

            expect(win._buttons).toEqual([]);
        });

        test("creates _frame element with windowFrame class", () => {
            const win = createTestWindow();

            expect(win._frame).toBeDefined();
            expect(win._frame.className).toBe("windowFrame");
        });

        test("creates _body element with wfWinBody class", () => {
            const win = createTestWindow();

            expect(win._body).toBeDefined();
            expect(win._body.className).toBe("wfWinBody");
        });

        test("creates _toolbar element with wfbToolbar class", () => {
            const win = createTestWindow();

            expect(win._toolbar).toBeDefined();
            expect(win._toolbar.className).toBe("wfbToolbar");
        });

        test("creates _widget element with wfbWidget class", () => {
            const win = createTestWindow();

            expect(win._widget).toBeDefined();
            expect(win._widget.className).toBe("wfbWidget");
        });

        test("creates _drag element with wfTopBar class", () => {
            const win = createTestWindow();

            expect(win._drag).toBeDefined();
            expect(win._drag.className).toBe("wfTopBar");
        });

        test("sets _title from constructor argument", () => {
            const win = createTestWindow("My Custom Title");

            expect(win._title).toBe("My Custom Title");
        });

        test("registers global listeners only once regardless of window count", () => {
            const addSpy = jest.spyOn(document, "addEventListener");

            createTestWindow("Window 1");
            createTestWindow("Window 2");
            createTestWindow("Window 3");

            // mouseup, mousemove, mousedown, keydown (each once)
            const globalListeners = addSpy.mock.calls.filter(call =>
                ["mouseup", "mousemove", "mousedown", "keydown"].includes(call[0])
            );
            expect(globalListeners).toHaveLength(4);

            addSpy.mockRestore();
        });
    });

    describe("_create helper", () => {
        test("creates element with specified tag", () => {
            const win = createTestWindow();
            const el = win._create("span");

            expect(el.tagName).toBe("SPAN");
        });

        test("sets className when provided", () => {
            const win = createTestWindow();
            const el = win._create("div", "myClass");

            expect(el.className).toBe("myClass");
        });

        test("does not set className when not provided", () => {
            const win = createTestWindow();
            const el = win._create("div");

            expect(el.className).toBe("");
        });

        test("appends to parent when provided", () => {
            const win = createTestWindow();
            const parent = document.createElement("div");
            const el = win._create("span", "cls", parent);

            expect(parent.children).toHaveLength(1);
            expect(parent.children[0]).toBe(el);
        });

        test("does not append when parent is not provided", () => {
            const win = createTestWindow();
            const el = win._create("div", "cls");

            expect(el.parentElement).toBeNull();
        });
    });

    describe("_toggleClass helper", () => {
        test("adds class when not present", () => {
            const win = createTestWindow();
            const el = document.createElement("div");

            win._toggleClass(el, "active");

            expect(el.classList.contains("active")).toBe(true);
        });

        test("removes class when already present", () => {
            const win = createTestWindow();
            const el = document.createElement("div");
            el.classList.add("active");

            win._toggleClass(el, "active");

            expect(el.classList.contains("active")).toBe(false);
        });

        test("toggles back and forth", () => {
            const win = createTestWindow();
            const el = document.createElement("div");

            win._toggleClass(el, "test");
            expect(el.classList.contains("test")).toBe(true);

            win._toggleClass(el, "test");
            expect(el.classList.contains("test")).toBe(false);
        });
    });

    describe("addButton", () => {
        test("returns a div element with wfbtItem class", () => {
            const win = createTestWindow();
            const btn = win.addButton("play-button.svg", 24, "Play");

            expect(btn).toBeDefined();
            expect(btn.className).toBe("wfbtItem");
        });

        test("contains an img with the specified icon", () => {
            const win = createTestWindow();
            const btn = win.addButton("play-button.svg", 24, "Play");
            const img = btn.querySelector("img");

            expect(img).not.toBeNull();
            expect(img.getAttribute("src")).toBe("header-icons/play-button.svg");
        });

        test("sets correct dimensions on img", () => {
            const win = createTestWindow();
            const btn = win.addButton("icon.svg", 32, "Label");
            const img = btn.querySelector("img");

            expect(img.getAttribute("height")).toBe("32");
            expect(img.getAttribute("width")).toBe("32");
        });

        test("sets title and alt attributes", () => {
            const win = createTestWindow();
            const btn = win.addButton("icon.svg", 24, "My Label");
            const img = btn.querySelector("img");

            expect(img.getAttribute("title")).toBe("My Label");
            expect(img.getAttribute("alt")).toBe("My Label");
        });

        test("makes the button keyboard accessible", () => {
            const win = createTestWindow();
            const btn = win.addButton("icon.svg", 24, "My Label");

            expect(btn.getAttribute("role")).toBe("button");
            expect(btn.getAttribute("tabindex")).toBe("0");
            expect(btn.getAttribute("aria-label")).toBe("My Label");

            const clickSpy = jest.spyOn(btn, "click");
            btn.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
            expect(clickSpy).toHaveBeenCalled();
        });

        test("updates the accessible label when the button changes", () => {
            const win = createTestWindow();
            const btn = win.addButton("play.svg", 24, "Play");

            win.modifyButton(0, "stop.svg", 24, "Stop");

            expect(btn.getAttribute("aria-label")).toBe("Stop");
            expect(btn.querySelector("img").getAttribute("alt")).toBe("Stop");
        });

        test("adds button to _buttons array", () => {
            const win = createTestWindow();
            expect(win._buttons).toHaveLength(0);

            win.addButton("icon.svg", 24, "Label");
            expect(win._buttons).toHaveLength(1);
        });

        test("appends to toolbar by default", () => {
            const win = createTestWindow();
            const btn = win.addButton("icon.svg", 24, "Label");

            expect(btn.parentElement).toBe(win._toolbar);
        });

        test("appends to custom parent when provided", () => {
            const win = createTestWindow();
            const customParent = document.createElement("div");
            const btn = win.addButton("icon.svg", 24, "Label", customParent);

            expect(btn.parentElement).toBe(customParent);
        });

        test("multiple buttons increment _buttons array", () => {
            const win = createTestWindow();
            win.addButton("a.svg", 24, "A");
            win.addButton("b.svg", 24, "B");
            win.addButton("c.svg", 24, "C");

            expect(win._buttons).toHaveLength(3);
        });

        test("modifyButton still addresses the live buttons after a re-init", () => {
            // A widget that re-initialises on an already open window (see
            // Blocks.reInitWidget) calls clear() and then re-adds its buttons.
            const win = createTestWindow();
            win.clear();
            win.addButton("play-button.svg", 24, "Play");
            win.addButton("erase-button.svg", 24, "Clear");

            win.clear();
            win.addButton("play-button.svg", 24, "Play");
            win.addButton("erase-button.svg", 24, "Clear");

            expect(win._buttons).toHaveLength(2);

            const target = win.modifyButton(0, "stop-button.svg", 24, "Stop");

            expect(win._toolbar.contains(target)).toBe(true);
            expect(win._toolbar.querySelector("img").getAttribute("src")).toBe(
                "header-icons/stop-button.svg"
            );
        });
    });

    describe("addDivider", () => {
        test("returns a div element with wfbtHR class", () => {
            const win = createTestWindow();
            const divider = win.addDivider();

            expect(divider).toBeDefined();
            expect(divider.className).toBe("wfbtHR");
        });

        test("appends to toolbar", () => {
            const win = createTestWindow();
            const divider = win.addDivider();

            expect(divider.parentElement).toBe(win._toolbar);
        });
    });

    describe("addInputButton", () => {
        test("returns an input element", () => {
            const win = createTestWindow();
            const input = win.addInputButton("hello");

            expect(input).toBeDefined();
            expect(input.tagName).toBe("INPUT");
        });

        test("sets initial value", () => {
            const win = createTestWindow();
            const input = win.addInputButton("initial text");

            expect(input.value).toBe("initial text");
        });

        test("appends to toolbar by default", () => {
            const win = createTestWindow();
            const input = win.addInputButton("test");

            expect(input.closest(".wfbtItem").parentElement).toBe(win._toolbar);
        });

        test("appends to custom parent when provided", () => {
            const win = createTestWindow();
            const customParent = document.createElement("div");
            const input = win.addInputButton("test", customParent);

            expect(input.closest(".wfbtItem").parentElement).toBe(customParent);
        });
    });

    describe("close", () => {
        test("calls onclose", () => {
            const win = createTestWindow();
            const spy = jest.fn();
            win.onclose = spy;

            win.close();

            expect(spy).toHaveBeenCalled();
        });

        test("does not remove global listeners (delegation persists)", () => {
            const removeSpy = jest.spyOn(document, "removeEventListener");
            const win = createTestWindow();

            win.close();

            const globalMouseRemovals = removeSpy.mock.calls.filter(call =>
                ["mouseup", "mousemove", "mousedown"].includes(call[0])
            );
            expect(globalMouseRemovals).toHaveLength(0);
            removeSpy.mockRestore();
        });
    });

    describe("destroy", () => {
        test("removes _frame from DOM", () => {
            const win = createTestWindow();
            const parent = win._frame.parentElement;
            expect(parent.contains(win._frame)).toBe(true);

            win.destroy();

            expect(parent.contains(win._frame)).toBe(false);
        });

        test("removes _overlayframe from DOM", () => {
            const win = createTestWindow();
            const parent = win._overlayframe.parentElement;
            expect(parent.contains(win._overlayframe)).toBe(true);

            win.destroy();

            expect(parent.contains(win._overlayframe)).toBe(false);
        });

        test("clears openWindows entry for the key", () => {
            const win = createTestWindow();
            const key = win._key;
            window.widgetWindows.openWindows[key] = win;

            win.destroy();

            expect(window.widgetWindows.openWindows[key]).toBeUndefined();
        });

        test("does not remove global listeners (delegation persists)", () => {
            const removeSpy = jest.spyOn(document, "removeEventListener");
            const win = createTestWindow();

            win.destroy();

            const globalMouseRemovals = removeSpy.mock.calls.filter(call =>
                ["mouseup", "mousemove", "mousedown"].includes(call[0])
            );
            expect(globalMouseRemovals).toHaveLength(0);
            removeSpy.mockRestore();
        });

        test("removes widget-local wheel listeners", () => {
            const win = createTestWindow();
            const removeSpy = jest.spyOn(win._widget, "removeEventListener");

            win.destroy();

            expect(removeSpy).toHaveBeenCalledWith("wheel", win._widgetWheelHandler, false);
            expect(removeSpy).toHaveBeenCalledWith(
                "DOMMouseScroll",
                win._widgetWheelHandler,
                false
            );
            removeSpy.mockRestore();
        });
    });

    describe("widget scroll handling", () => {
        test("keeps window.onscroll untouched when scrolling inside a widget", () => {
            const win = createTestWindow();
            const existingScrollHandler = jest.fn();
            window.onscroll = existingScrollHandler;
            win._widget.scrollTop = 10;

            const event = new window.WheelEvent("wheel", {
                deltaY: 30,
                bubbles: true,
                cancelable: true
            });

            win._widget.dispatchEvent(event);

            expect(win._widget.scrollTop).toBe(40);
            expect(event.defaultPrevented).toBe(true);
            expect(window.onscroll).toBe(existingScrollHandler);
        });
    });

    describe("sendToCenter", () => {
        test("returns this for chaining", () => {
            const win = createTestWindow();
            const result = win.sendToCenter();

            expect(result).toBe(win);
        });

        test("sets fallback position when canvas has zero dimensions", () => {
            const win = createTestWindow();
            // jsdom canvases have 0 width/height by default
            win.sendToCenter();

            expect(win._frame.style.left).toBe("200px");
        });
    });

    describe("_maximize and _restore", () => {
        test("_maximize sets _maximized to true", () => {
            const win = createTestWindow();

            win._maximize();

            expect(win._maximized).toBe(true);
        });

        test("_maximize sets frame to full viewport dimensions", () => {
            const win = createTestWindow();

            win._maximize();

            expect(win._frame.style.width).toBe("100vw");
            expect(win._frame.style.height).toBe("calc(100vh - 64px)");
        });

        test("_maximize positions frame at top-left", () => {
            const win = createTestWindow();

            win._maximize();

            expect(win._frame.style.left).toBe("0px");
            expect(win._frame.style.top).toBe("64px");
        });

        test("_maximize saves previous position", () => {
            const win = createTestWindow();
            win.setPosition(100, 200);

            win._maximize();

            expect(win._savedPos).toEqual(["100px", "200px"]);
        });

        test("_maximize changes icon to contract", () => {
            const win = createTestWindow();

            win._maximize();

            expect(win._maxminIcon.getAttribute("src")).toBe("header-icons/icon-contract.svg");
        });

        test("_restore sets _maximized to false", () => {
            const win = createTestWindow();
            win._maximize();

            win._restore();

            expect(win._maximized).toBe(false);
        });

        test("_restore changes icon to expand", () => {
            const win = createTestWindow();
            win._maximize();

            win._restore();

            expect(win._maxminIcon.getAttribute("src")).toBe("header-icons/icon-expand.svg");
        });

        test("_restore restores saved position", () => {
            const win = createTestWindow();
            win.setPosition(150, 250);
            win._maximize();

            win._restore();

            expect(win._frame.style.left).toBe("150px");
            expect(win._frame.style.top).toBe("250px");
        });

        test("_restore sets auto width and height", () => {
            const win = createTestWindow();
            win._maximize();

            win._restore();

            expect(win._frame.style.width).toBe("auto");
            expect(win._frame.style.height).toBe("auto");
        });

        test("_restore clears _savedPos", () => {
            const win = createTestWindow();
            win.setPosition(100, 200);
            win._maximize();

            win._restore();

            expect(win._savedPos).toBeNull();
        });
    });

    describe("updateTitle", () => {
        test("updates the title element innerHTML", () => {
            const win = createTestWindow("Old Title");
            const key = win._key;
            const titleEl = document.getElementById(key + "WidgetID");
            expect(titleEl).not.toBeNull();

            win.updateTitle("New Title");

            expect(titleEl.innerHTML).toBe("New Title");
        });

        test("keeps the frame's aria-label in sync with the new title", () => {
            const win = createTestWindow("Old Title");

            win.updateTitle("New Title");

            expect(win._frame.getAttribute("aria-label")).toBe("New Title");
        });
    });

    describe("frame accessibility", () => {
        test("gives the window frame a dialog role and an accessible name", () => {
            const win = createTestWindow("My Widget");

            expect(win._frame.getAttribute("role")).toBe("dialog");
            expect(win._frame.getAttribute("aria-label")).toBe("My Widget");
            expect(win._frame.getAttribute("aria-modal")).toBeNull();
        });
    });

    describe("takeFocus", () => {
        test("sets frame zIndex to 10000", () => {
            const win = createTestWindow();

            win.takeFocus();

            expect(win._frame.style.zIndex).toBe("10000");
        });

        test("sets frame opacity to 1", () => {
            const win = createTestWindow();

            win.takeFocus();

            expect(win._frame.style.opacity).toBe("1");
        });

        test("sets sibling windows zIndex to 0", () => {
            const win1 = createTestWindow("T1");
            const win2 = createTestWindow("T2");

            win2.takeFocus();

            expect(win1._frame.style.zIndex).toBe("0");
            expect(win2._frame.style.zIndex).toBe("10000");
        });
    });

    describe("isMaximized", () => {
        test("returns false initially", () => {
            const win = createTestWindow();

            expect(win.isMaximized()).toBe(false);
        });

        test("returns true after _maximize", () => {
            const win = createTestWindow();
            win._maximize();

            expect(win.isMaximized()).toBe(true);
        });

        test("returns false after _maximize then _restore", () => {
            const win = createTestWindow();
            win._maximize();
            win._restore();

            expect(win.isMaximized()).toBe(false);
        });
    });

    describe("other public methods", () => {
        test("setPosition sets frame left and top styles", () => {
            const win = createTestWindow();

            win.setPosition(50, 100);

            expect(win._frame.style.left).toBe("50px");
            expect(win._frame.style.top).toBe("100px");
        });

        test("setPosition enforces minimum top of 64", () => {
            const win = createTestWindow();

            win.setPosition(50, 10);

            expect(win._frame.style.top).toBe("64px");
        });

        test("setPosition caches position in _posCache", () => {
            const win = createTestWindow();
            const key = win._key;

            win.setPosition(75, 150);

            expect(window.widgetWindows._posCache[key]).toEqual([75, 150]);
        });

        test("setPosition returns this for chaining", () => {
            const win = createTestWindow();

            const result = win.setPosition(0, 64);

            expect(result).toBe(win);
        });

        test("isVisible returns true initially", () => {
            const win = createTestWindow();

            expect(win.isVisible()).toBe(true);
        });

        test("show sets frame display to block", () => {
            const win = createTestWindow();
            win._frame.style.display = "none";

            win.show();

            expect(win._frame.style.display).toBe("block");
        });

        test("clear empties widget and toolbar", () => {
            const win = createTestWindow();
            win._widget.innerHTML = "<p>Content</p>";
            win._toolbar.innerHTML = "<div>Buttons</div>";

            win.clear();

            expect(win._widget.innerHTML).toBe("");
            expect(win._toolbar.innerHTML).toBe("");
        });

        test("clear returns this for chaining", () => {
            const win = createTestWindow();

            expect(win.clear()).toBe(win);
        });

        test("clearScreen empties only widget, not toolbar", () => {
            const win = createTestWindow();
            win._widget.innerHTML = "<p>Widget</p>";
            win._toolbar.innerHTML = "<div>Toolbar</div>";

            win.clearScreen();

            expect(win._widget.innerHTML).toBe("");
            expect(win._toolbar.innerHTML).toBe("<div>Toolbar</div>");
        });

        test("getWidgetBody returns _widget", () => {
            const win = createTestWindow();

            expect(win.getWidgetBody()).toBe(win._widget);
        });

        test("getWidgetFrame returns _frame", () => {
            const win = createTestWindow();

            expect(win.getWidgetFrame()).toBe(win._frame);
        });

        test("_rollup hides body and sets _rolled true", () => {
            const win = createTestWindow();

            win._rollup();

            expect(win._rolled).toBe(true);
            expect(win._body.style.display).toBe("none");
        });

        test("unroll shows body and sets _rolled false", () => {
            const win = createTestWindow();
            win._rollup();

            win.unroll();

            expect(win._rolled).toBe(false);
            expect(win._body.style.display).toBe("flex");
        });
    });

    describe("widgetWindows global functions", () => {
        test("keeps floating windows above the toolbar in play-only mode", () => {
            const style = document.createElement("style");
            style.textContent = fs.readFileSync(
                path.resolve(__dirname, "../../../css/play-only-mode.css"),
                "utf8"
            );
            document.head.appendChild(style);
            document.documentElement.classList.add("play-only");
            nav.id = "toolbars";
            nav.style.position = "fixed";
            nav.style.zIndex = "1001";

            try {
                expect(Number(getComputedStyle(floatingWindows).zIndex)).toBeGreaterThan(
                    Number(getComputedStyle(nav).zIndex)
                );
            } finally {
                style.remove();
                document.documentElement.classList.remove("play-only");
                nav.removeAttribute("id");
                nav.style.removeProperty("position");
                nav.style.removeProperty("z-index");
            }
        });

        test("windowFor creates and returns a window", () => {
            const widget = { blockNo: 900 };
            const win = windowFor(widget, "Global Test");

            expect(win).toBeDefined();
            expect(window.widgetWindows.openWindows[900]).toBe(win);
        });

        test("windowFor returns existing window on second call", () => {
            const widget = { blockNo: 901 };
            const win1 = windowFor(widget, "Widget");
            const win2 = windowFor(widget, "Widget");

            expect(win1).toBe(win2);
        });

        test("isOpen returns truthy for open windows", () => {
            const widget = { blockNo: 902 };
            windowFor(widget, "Test");

            expect(isOpen(902)).toBeTruthy();
        });

        test("isOpen returns empty string for non-existent windows", () => {
            expect(isOpen("nonexistent")).toBe("");
        });

        test("windowFor uses saveAs as key when blockNo is missing", () => {
            const widget = {};
            const win = windowFor(widget, "Title", "mySaveKey");

            expect(window.widgetWindows.openWindows["mySaveKey"]).toBe(win);
        });

        test("windowFor uses title as key when blockNo and saveAs are missing", () => {
            const widget = {};
            const win = windowFor(widget, "FallbackTitle");

            expect(window.widgetWindows.openWindows["FallbackTitle"]).toBe(win);
        });
    });

    describe("_handleGlobalMouseDown and focus management", () => {
        test("focuses clicked window and dims other windows", () => {
            const win1 = createTestWindow("Window 1");
            const win2 = createTestWindow("Window 2");

            // win2 was created last so it took focus initially
            expect(window.widgetWindows.focused).toBe(win2);

            // Simulate mousedown inside win1
            const clickEvent = new MouseEvent("mousedown", { bubbles: true });
            win1._frame.dispatchEvent(clickEvent);

            expect(window.widgetWindows.focused).toBe(win1);
            expect(win1._frame.style.opacity).toBe("1");
            expect(win1._frame.style.zIndex).toBe("10000");
            expect(win2._frame.style.opacity).toBe("0.7");
            expect(win2._frame.style.zIndex).toBe("0");
        });

        test("switches focus back to another window when clicked", () => {
            const win1 = createTestWindow("Window 1");
            const win2 = createTestWindow("Window 2");

            win1._frame.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            expect(window.widgetWindows.focused).toBe(win1);

            win2._widget.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            expect(window.widgetWindows.focused).toBe(win2);
            expect(win2._frame.style.opacity).toBe("1");
            expect(win2._frame.style.zIndex).toBe("10000");
            expect(win1._frame.style.opacity).toBe("0.7");
            expect(win1._frame.style.zIndex).toBe("0");
        });

        test("clears focus and dims all windows when clicking outside all windows", () => {
            const win1 = createTestWindow("Window 1");
            const win2 = createTestWindow("Window 2");

            expect(window.widgetWindows.focused).toBe(win2);

            // Simulate clicking on canvas / document body
            canvas.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

            expect(window.widgetWindows.focused).toBeNull();
            expect(win1._frame.style.opacity).toBe("0.7");
            expect(win1._frame.style.zIndex).toBe("0");
            expect(win2._frame.style.opacity).toBe("0.7");
            expect(win2._frame.style.zIndex).toBe("0");
        });

        test("preserves focus when clicking inside toolbar", () => {
            const toolbars = document.createElement("div");
            toolbars.id = "toolbars";
            document.body.appendChild(toolbars);

            try {
                const win1 = createTestWindow("Window 1");
                const win2 = createTestWindow("Window 2");

                win1._frame.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
                expect(window.widgetWindows.focused).toBe(win1);

                toolbars.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

                expect(window.widgetWindows.focused).toBe(win1);
                expect(win1._frame.style.opacity).toBe("1");
                expect(win1._frame.style.zIndex).toBe("10000");
            } finally {
                toolbars.remove();
            }
        });

        test("Escape key closes only the currently focused window", () => {
            const win1 = createTestWindow("Window 1");
            const win2 = createTestWindow("Window 2");

            const closeSpy1 = jest.spyOn(win1, "onclose");
            const closeSpy2 = jest.spyOn(win2, "onclose");

            // Focus win1
            win1._frame.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            expect(window.widgetWindows.focused).toBe(win1);

            const escEvent = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
            document.dispatchEvent(escEvent);

            expect(closeSpy1).toHaveBeenCalledTimes(1);
            expect(closeSpy2).not.toHaveBeenCalled();
        });

        test("Cmd/Ctrl+Shift+M maximizes only the currently focused window", () => {
            const win1 = createTestWindow("Window 1");
            const win2 = createTestWindow("Window 2");

            win1._frame.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
            const maxEvent = new KeyboardEvent("keydown", {
                code: "KeyM",
                ctrlKey: true,
                shiftKey: true,
                bubbles: true
            });
            document.dispatchEvent(maxEvent);

            expect(win1.isMaximized()).toBe(true);
            expect(win2.isMaximized()).toBe(false);
        });

        test("ignores shortcuts when focus is inside an input, textarea, or contenteditable element", () => {
            const win = createTestWindow();
            win.onclose = jest.fn();
            window.widgetWindows.focused = win;

            const input = document.createElement("input");
            const textarea = document.createElement("textarea");
            const contentEditable = document.createElement("div");
            contentEditable.contentEditable = "true";

            document.body.append(input, textarea, contentEditable);

            [input, textarea, contentEditable].forEach(element => {
                element.focus();
                const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
                document.dispatchEvent(event);
            });

            expect(win.onclose).not.toHaveBeenCalled();

            input.remove();
            textarea.remove();
            contentEditable.remove();
        });

        test("ignores shortcuts when event has repeat flag", () => {
            const win = createTestWindow();
            win.onclose = jest.fn();
            window.widgetWindows.focused = win;

            const event = new KeyboardEvent("keydown", {
                key: "Escape",
                repeat: true,
                bubbles: true
            });
            document.dispatchEvent(event);

            expect(win.onclose).not.toHaveBeenCalled();
        });
    });

    describe("window dragging and mouse handlers", () => {
        test("sets and clears draggingWindow on mouse move and mouse up", () => {
            const win = createTestWindow("Drag Window");
            win._docMouseMoveHandler = jest.fn();
            win._dragTopHandler = jest.fn();
            window.widgetWindows.draggingWindow = win;

            const moveEvent = new MouseEvent("mousemove", { clientX: 100, clientY: 150 });
            document.dispatchEvent(moveEvent);
            expect(win._docMouseMoveHandler).toHaveBeenCalledWith(moveEvent);

            const upEvent = new MouseEvent("mouseup");
            document.dispatchEvent(upEvent);
            expect(win._dragTopHandler).toHaveBeenCalledWith(upEvent);
            expect(window.widgetWindows.draggingWindow).toBeNull();
        });
    });

    describe("window visibility and management helpers", () => {
        test("hideAllWindows hides all frames and resets focused", () => {
            const win1 = createTestWindow("Win 1");
            const win2 = createTestWindow("Win 2");
            window.widgetWindows.focused = win1;

            window.widgetWindows.hideAllWindows();

            expect(win1._frame.style.display).toBe("none");
            expect(win2._frame.style.display).toBe("none");
            expect(window.widgetWindows.focused).toBeNull();
        });

        test("hideWindow hides specific window and resets focus if focused", () => {
            const win = createTestWindow("Target Win");
            window.widgetWindows.focused = win;

            window.widgetWindows.hideWindow(win._key);

            expect(win._frame.style.display).toBe("none");
            expect(window.widgetWindows.focused).toBeNull();
        });

        test("closeWindow calls close on the named window", () => {
            const win = createTestWindow("Close Target");
            win.close = jest.fn();

            window.widgetWindows.closeWindow(win._key);

            expect(win.close).toHaveBeenCalledTimes(1);
        });

        test("showWindows restores display block on all open windows", () => {
            const win1 = createTestWindow("Show 1");
            const win2 = createTestWindow("Show 2");
            win1._frame.style.display = "none";
            win2._frame.style.display = "none";

            window.widgetWindows.showWindows();

            expect(win1._frame.style.display).toBe("block");
            expect(win2._frame.style.display).toBe("block");
        });

        test("clear calls onclose on the named window", () => {
            const win = createTestWindow("Clear Target");
            win.onclose = jest.fn();

            window.widgetWindows.clear(win._key);

            expect(win.onclose).toHaveBeenCalledTimes(1);
        });
    });

    describe("locale configuration and additional widget controls", () => {
        test("configures column layout when language is Japanese", () => {
            window.localStorage.languagePreference = "ja";
            const win = createTestWindow("Japanese Widget");

            expect(win._body.style.flexDirection).toBe("column");
            expect(win._toolbar.style.display).toBe("flex");
            window.localStorage.languagePreference = "en";
        });

        test("addRangeSlider creates configured range input element", () => {
            const win = createTestWindow();
            const slider = win.addRangeSlider(50, null, 0, 100, "custom-slider");

            expect(slider.type).toBe("range");
            expect(slider.value).toBe("50");
            expect(slider.min).toBe("0");
            expect(slider.max).toBe("100");
            expect(slider.className).toBe("custom-slider");
        });

        test("rollup button click toggles rollup and unroll state", () => {
            const win = createTestWindow();
            const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true });

            win._rollButton.dispatchEvent(clickEvent);
            expect(win._rolled).toBe(true);

            win._rollButton.dispatchEvent(clickEvent);
            expect(win._rolled).toBe(false);
        });

        test("maxminButton title updates on maximize and restore", () => {
            const win = createTestWindow("Test Window");
            expect(win._maxminButton).toBeDefined();
            expect(win._maxminButton.title).toBe("Maximize window");

            win._maximize();
            expect(win._maxminButton.title).toBe("Restore");

            win._restore();
            expect(win._maxminButton.title).toBe("Maximize window");
        });
    });

    describe("closeBlkWidgets()", () => {
        beforeEach(() => {
            window.widgetWindows.openWindows = {};
            window.widgetWindows.closeWindow = jest.fn();
            window.widgetWindows.hideAllWindows = jest.fn();
            window.widgetWindows.hideWindow = jest.fn();
        });

        it("closes matching widget by name", () => {
            const mockElement = { innerHTML: "TestWidget" };

            document.getElementsByClassName = jest.fn(() => [mockElement]);

            window.widgetWindows.closeBlkWidgets("TestWidget");

            expect(window.widgetWindows.closeWindow).toHaveBeenCalledWith("TestWidget");
        });

        it("closes widget directly using key lookup from openWindows", () => {
            window.widgetWindows.openWindows = {
                "custom mode": { close: jest.fn() }
            };

            window.widgetWindows.closeBlkWidgets("custom mode");

            expect(window.widgetWindows.closeWindow).toHaveBeenCalledWith("custom mode");
        });

        it("closes widget using mapped key", () => {
            window.widgetWindows.openWindows = {
                "pitch drum": { close: jest.fn() }
            };

            window.widgetWindows.closeBlkWidgets("pitch-drum mapper");

            expect(window.widgetWindows.closeWindow).toHaveBeenCalledWith("pitch drum");
        });

        it("closes widget by matching element ID when display title changes", () => {
            const mockElement = {
                innerHTML: "C MAJOR",
                id: "custom modeWidgetID"
            };

            document.getElementsByClassName = jest.fn(() => [mockElement]);

            window.widgetWindows.closeBlkWidgets("custom mode");

            expect(window.widgetWindows.closeWindow).toHaveBeenCalledWith("custom mode");
        });

        it("does nothing if no match found", () => {
            document.getElementsByClassName = jest.fn(() => [{ innerHTML: "OtherWidget" }]);

            window.widgetWindows.closeBlkWidgets("TestWidget");

            expect(window.widgetWindows.closeWindow).not.toHaveBeenCalled();
        });
    });
});
