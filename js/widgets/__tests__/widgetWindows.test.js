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

// Set up globals required by widgetWindows.js before importing
global._ = str => str;
global.docById = jest.fn(id => document.getElementById(id));
global.requestAnimationFrame = jest.fn(cb => cb());
global.ManagedTimer = require("../../utils/ManagedTimer.js");

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

            // mouseup, mousemove, mousedown (each once)
            const globalMouseListeners = addSpy.mock.calls.filter(call =>
                ["mouseup", "mousemove", "mousedown"].includes(call[0])
            );
            expect(globalMouseListeners).toHaveLength(3);

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

        test("unroll removes the plus class left by the roll button toggle", () => {
            const win = createTestWindow();
            win._rollButton.onclick({ preventDefault: jest.fn(), stopPropagation: jest.fn() });
            expect(win._rollButton.classList.contains("plus")).toBe(true);

            win.unroll();

            expect(win._rollButton.classList.contains("plus")).toBe(false);
        });
    });

    describe("widgetWindows global functions", () => {
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

    describe("_handleGlobalKeyDown", () => {
        afterEach(() => {
            window.widgetWindows.focused = null;
        });

        test("does nothing when no window is focused", () => {
            window.widgetWindows.focused = null;
            const e = { key: "Escape", preventDefault: jest.fn(), stopPropagation: jest.fn() };

            expect(() => window.widgetWindows._handleGlobalKeyDown(e)).not.toThrow();
        });

        test("ignores repeated key events", () => {
            const win = createTestWindow();
            win.onclose = jest.fn();
            window.widgetWindows.focused = win;
            const e = { key: "Escape", repeat: true, preventDefault: jest.fn() };

            window.widgetWindows._handleGlobalKeyDown(e);

            expect(win.onclose).not.toHaveBeenCalled();
        });

        test("ignores Escape when focus is inside an input", () => {
            const win = createTestWindow();
            win.onclose = jest.fn();
            window.widgetWindows.focused = win;
            const input = document.createElement("input");
            document.body.appendChild(input);
            input.focus();
            const e = { key: "Escape", preventDefault: jest.fn(), stopPropagation: jest.fn() };

            window.widgetWindows._handleGlobalKeyDown(e);

            expect(win.onclose).not.toHaveBeenCalled();
            document.body.removeChild(input);
        });

        test("Escape closes the focused window", () => {
            const win = createTestWindow();
            win.onclose = jest.fn();
            window.widgetWindows.focused = win;
            const e = { key: "Escape", preventDefault: jest.fn(), stopPropagation: jest.fn() };

            window.widgetWindows._handleGlobalKeyDown(e);

            expect(win.onclose).toHaveBeenCalled();
            expect(e.preventDefault).toHaveBeenCalled();
        });

        test("Ctrl+Shift+M maximizes a non-maximized fullscreen window", () => {
            const win = createTestWindow("Win", true);
            window.widgetWindows.focused = win;
            const e = {
                key: "M",
                code: "KeyM",
                ctrlKey: true,
                shiftKey: true,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };

            window.widgetWindows._handleGlobalKeyDown(e);

            expect(win._maximized).toBe(true);
        });

        test("Ctrl+Shift+M restores an already-maximized fullscreen window", () => {
            const win = createTestWindow("Win", true);
            win._maximize();
            window.widgetWindows.focused = win;
            const e = {
                key: "M",
                code: "KeyM",
                ctrlKey: true,
                shiftKey: true,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };

            window.widgetWindows._handleGlobalKeyDown(e);

            expect(win._maximized).toBe(false);
        });

        test("Ctrl+Shift+M does nothing for a non-fullscreen window", () => {
            const win = createTestWindow("Win", false);
            window.widgetWindows.focused = win;
            const e = {
                key: "M",
                code: "KeyM",
                ctrlKey: true,
                shiftKey: true,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };

            expect(() => window.widgetWindows._handleGlobalKeyDown(e)).not.toThrow();
            expect(e.preventDefault).not.toHaveBeenCalled();
        });
    });

    describe("global mouse handlers", () => {
        test("_handleGlobalMouseMove delegates to the dragging window", () => {
            const handler = jest.fn();
            window.widgetWindows.draggingWindow = { _docMouseMoveHandler: handler };
            const e = { clientX: 1, clientY: 2 };

            window.widgetWindows._handleGlobalMouseMove(e);

            expect(handler).toHaveBeenCalledWith(e);
        });

        test("_handleGlobalMouseMove does nothing without a dragging window", () => {
            window.widgetWindows.draggingWindow = null;

            expect(() => window.widgetWindows._handleGlobalMouseMove({})).not.toThrow();
        });

        test("_handleGlobalMouseUp delegates and clears the dragging window", () => {
            const handler = jest.fn();
            window.widgetWindows.draggingWindow = { _dragTopHandler: handler };
            const e = {};

            window.widgetWindows._handleGlobalMouseUp(e);

            expect(handler).toHaveBeenCalledWith(e);
            expect(window.widgetWindows.draggingWindow).toBeNull();
        });

        test("_handleGlobalMouseDown focuses the window under the click target", () => {
            const win = createTestWindow();
            window.widgetWindows.openWindows[win._key] = win;
            const e = { target: win._frame };

            window.widgetWindows._handleGlobalMouseDown(e);

            expect(win._frame.style.opacity).toBe("1");
            expect(win._frame.style.zIndex).toBe("10000");
            expect(window.widgetWindows.focused).toBe(win);
        });

        test("_handleGlobalMouseDown dims windows not under the click target", () => {
            const win1 = createTestWindow("W1", false);
            const win2 = createTestWindow("W2", false);
            window.widgetWindows.openWindows[win1._key] = win1;
            window.widgetWindows.openWindows[win2._key] = win2;
            const outside = document.createElement("div");
            const e = { target: outside };

            window.widgetWindows._handleGlobalMouseDown(e);

            expect(win1._frame.style.opacity).toBe("0.7");
            expect(win2._frame.style.opacity).toBe("0.7");
            expect(window.widgetWindows.focused).toBeNull();
        });

        test("_handleGlobalMouseDown treats toolbar interactions as in-window", () => {
            const win = createTestWindow();
            window.widgetWindows.openWindows[win._key] = win;
            const toolbarEl = document.createElement("div");
            toolbarEl.id = "toolbars";
            const toolbarChild = document.createElement("span");
            toolbarEl.appendChild(toolbarChild);
            document.body.appendChild(toolbarEl);
            const e = { target: toolbarChild };

            window.widgetWindows._handleGlobalMouseDown(e);

            expect(win._frame.style.opacity).toBe("1");
            document.body.removeChild(toolbarEl);
        });
    });

    describe("drag and window-control handlers", () => {
        test("_drag ondblclick maximizes a fullscreen window", () => {
            const win = createTestWindow("Win", true);
            const e = { preventDefault: jest.fn(), stopImmediatePropagation: jest.fn() };

            win._drag.ondblclick(e);

            expect(win._maximized).toBe(true);
            expect(e.preventDefault).toHaveBeenCalled();
        });

        test("close button calls onclose", () => {
            const win = createTestWindow();
            win.onclose = jest.fn();
            const closeButton = win._drag.querySelector(".close");
            const e = { preventDefault: jest.fn(), stopPropagation: jest.fn() };

            closeButton.onclick(e);

            expect(win.onclose).toHaveBeenCalled();
        });

        test("roll button rolls up and toggles the plus class", () => {
            const win = createTestWindow();
            const e = { preventDefault: jest.fn(), stopPropagation: jest.fn() };

            win._rollButton.onclick(e);

            expect(win._rolled).toBe(true);
            expect(win._rollButton.classList.contains("plus")).toBe(true);
        });

        test("roll button unrolls when already rolled", () => {
            const win = createTestWindow();
            win._rollup();
            const e = { preventDefault: jest.fn(), stopPropagation: jest.fn() };

            win._rollButton.onclick(e);

            expect(win._rolled).toBe(false);
        });

        test("maxmin button maximizes when not maximized", () => {
            const win = createTestWindow("Win", true);
            const maxminButton = win._maxminIcon.parentElement;
            const e = { preventDefault: jest.fn(), stopImmediatePropagation: jest.fn() };

            maxminButton.onclick(e);

            expect(win._maximized).toBe(true);
        });

        test("maxmin button restores and sends to center when maximized", () => {
            const win = createTestWindow("Win", true);
            win._maximize();
            const maxminButton = win._maxminIcon.parentElement;
            const e = { preventDefault: jest.fn(), stopImmediatePropagation: jest.fn() };

            maxminButton.onclick(e);

            expect(win._maximized).toBe(false);
        });

        test("_nonclose onmousedown starts dragging and records offsets", () => {
            const win = createTestWindow();
            const e = { clientX: 50, clientY: 60, preventDefault: jest.fn() };

            win._nonclose.onmousedown(e);

            expect(window.widgetWindows.draggingWindow).toBe(win);
            expect(e.preventDefault).toHaveBeenCalled();
        });

        test("_nonclose onmousedown restores and repositions when maximized", () => {
            const win = createTestWindow();
            win._maximize();
            const e = { clientX: 50, clientY: 60, preventDefault: jest.fn() };

            win._nonclose.onmousedown(e);

            expect(win._maximized).toBe(false);
        });
    });

    describe("_docMouseMoveHandler", () => {
        test("shows the overlay when the frame is docked at the top", () => {
            const win = createTestWindow("Win", true);
            win.setPosition(0, 10);
            const e = { clientX: 100, clientY: 100 };

            win._docMouseMoveHandler(e);

            expect(win._overlayframe.style.top).toBe("64px");
        });

        test("hides the overlay when the frame is not docked at the top", () => {
            const win = createTestWindow("Win", true);
            win.setPosition(0, 200);
            const e = { clientX: 100, clientY: 100 };

            win._docMouseMoveHandler(e);

            expect(win._frame.style.zIndex).toBe("10000");
        });

        test("updates position based on the cursor offset", () => {
            const win = createTestWindow();
            win._dx = 5;
            win._dy = 5;
            const e = { clientX: 105, clientY: 205 };

            win._docMouseMoveHandler(e);

            expect(win._frame.style.left).toBe("100px");
            expect(win._frame.style.top).toBe("200px");
        });
    });

    describe("_dragTopHandler", () => {
        test("maximizes a fullscreen window docked at the top", () => {
            const win = createTestWindow("Win", true);
            win.setPosition(0, 10);
            const e = { preventDefault: jest.fn() };

            win._dragTopHandler(e);

            expect(win._maximized).toBe(true);
            expect(e.preventDefault).toHaveBeenCalled();
        });

        test("does nothing when already maximized", () => {
            const win = createTestWindow("Win", true);
            win.setPosition(0, 10);
            win._maximized = true;
            const e = { preventDefault: jest.fn() };

            win._dragTopHandler(e);

            expect(e.preventDefault).not.toHaveBeenCalled();
        });
    });

    describe("_setupLanguage", () => {
        test("moves the toolbar to the top for Japanese", () => {
            window.localStorage.languagePreference = "ja";

            const win = createTestWindow();

            expect(win._body.style.flexDirection).toBe("column");
            expect(win._toolbar.style.display).toBe("flex");
            window.localStorage.languagePreference = "en";
        });

        test("leaves default layout for non-Japanese locales", () => {
            window.localStorage.languagePreference = "en";

            const win = createTestWindow();

            expect(win._body.style.flexDirection).toBe("");
        });

        test("falls back to navigator.language when no preference is stored", () => {
            window.localStorage.languagePreference = undefined;

            expect(() => createTestWindow()).not.toThrow();
        });
    });

    describe("constructor position cache", () => {
        test("restores a cached position for a reused key", () => {
            const widget = { blockNo: 980 };
            const win1 = windowFor(widget, "Cached");
            win1.setPosition(77, 88);
            win1.destroy();
            window.widgetWindows.openWindows[980] = undefined;
            const setPositionSpy = jest.spyOn(win1.constructor.prototype, "setPosition");

            windowFor(widget, "Cached");

            expect(setPositionSpy.mock.calls[0]).toEqual([77, 88]);
            setPositionSpy.mockRestore();
        });
    });

    describe("addRangeSlider", () => {
        test("creates a range input with the given bounds", () => {
            const win = createTestWindow();
            const slider = win.addRangeSlider(5, undefined, 0, 10, "myClass");

            expect(slider.type).toBe("range");
            expect(slider.min).toBe("0");
            expect(slider.max).toBe("10");
            expect(slider.value).toBe("5");
            expect(slider.className).toBe("myClass");
        });
    });

    describe("addSelectorButton", () => {
        test("creates a select populated with the given options", () => {
            const win = createTestWindow();
            const selector = win.addSelectorButton([1, 2, 3], 2);

            expect(selector.tagName).toBe("SELECT");
            expect(selector.options).toHaveLength(3);
            expect(selector.options[1].text).toBe("turtle 2");
        });
    });

    describe("modifyButton", () => {
        test("replaces the button's icon", () => {
            const win = createTestWindow();
            win.addButton("old.svg", 24, "Old");

            win.modifyButton(0, "new.svg", 32, "New");
            const img = win._buttons[0].querySelector("img");

            expect(img.getAttribute("src")).toBe("header-icons/new.svg");
            expect(img.getAttribute("height")).toBe("32");
        });
    });

    describe("sendToCenter with a visible canvas", () => {
        test("centers the frame relative to the canvas", () => {
            const win = createTestWindow();
            jest.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
                width: 800,
                height: 600
            });
            jest.spyOn(win._frame, "getBoundingClientRect").mockReturnValue({
                width: 400,
                height: 300
            });

            win.sendToCenter();

            expect(win._frame.style.left).toBe("200px");
            jest.restoreAllMocks();
        });
    });

    describe("getDragElement", () => {
        test("returns the drag handle", () => {
            const win = createTestWindow();

            expect(win.getDragElement()).toBe(win._drag);
        });
    });

    describe("onmaximize", () => {
        test("returns this by default", () => {
            const win = createTestWindow();

            expect(win.onmaximize()).toBe(win);
        });
    });

    describe("destroy timer cleanup", () => {
        test("clears all managed timers", () => {
            const win = createTestWindow();
            const clearAllSpy = jest.spyOn(win.timerManager, "clearAll");

            win.destroy();

            expect(clearAllSpy).toHaveBeenCalled();
        });
    });

    describe("deprecated widgetWindows.clear", () => {
        test("closes the window for the given name", () => {
            const widget = { blockNo: 950 };
            const win = windowFor(widget, "Clearable");
            win.onclose = jest.fn();

            clearWindow(950);

            expect(win.onclose).toHaveBeenCalled();
        });

        test("does nothing when the window does not exist", () => {
            expect(() => clearWindow("nonexistent")).not.toThrow();
        });
    });

    describe("hideAllWindows", () => {
        test("hides every open window and clears focus", () => {
            const win1 = createTestWindow("H1");
            const win2 = createTestWindow("H2");

            hideAllWindows();

            expect(win1._frame.style.display).toBe("none");
            expect(win2._frame.style.display).toBe("none");
            expect(window.widgetWindows.focused).toBeNull();
        });
    });

    describe("hideWindow", () => {
        test("hides the named window and clears focus if it was focused", () => {
            const widget = { blockNo: 960 };
            const win = windowFor(widget, "Hideable");
            window.widgetWindows.focused = win;

            window.widgetWindows.hideWindow(960);

            expect(win._frame.style.display).toBe("none");
            expect(window.widgetWindows.focused).toBeNull();
        });

        test("does nothing when the window does not exist", () => {
            expect(() => window.widgetWindows.hideWindow("nonexistent")).not.toThrow();
        });
    });

    describe("closeWindow", () => {
        test("calls close on the named window", () => {
            const widget = { blockNo: 970 };
            const win = windowFor(widget, "Closeable");
            const closeSpy = jest.spyOn(win, "close");

            window.widgetWindows.closeWindow(970);

            expect(closeSpy).toHaveBeenCalled();
        });

        test("does nothing when the window does not exist", () => {
            expect(() => window.widgetWindows.closeWindow("nonexistent")).not.toThrow();
        });
    });

    describe("showWindows", () => {
        test("shows every open window", () => {
            const win1 = createTestWindow("S1");
            const win2 = createTestWindow("S2");
            win1._frame.style.display = "none";
            win2._frame.style.display = "none";

            showWindows();

            expect(win1._frame.style.display).toBe("block");
            expect(win2._frame.style.display).toBe("block");
        });
    });
});
