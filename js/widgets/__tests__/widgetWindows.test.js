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

        test("creates a window with _dragging set to false", () => {
            const win = createTestWindow();

            expect(win._dragging).toBe(false);
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

        test("removes mouseup event listener", () => {
            const win = createTestWindow();
            const removeSpy = jest.spyOn(document, "removeEventListener");
            win.onclose = jest.fn();

            win.close();

            expect(removeSpy).toHaveBeenCalledWith("mouseup", win._dragTopHandler, true);
            removeSpy.mockRestore();
        });

        test("removes mousemove event listener", () => {
            const win = createTestWindow();
            const removeSpy = jest.spyOn(document, "removeEventListener");
            win.onclose = jest.fn();

            win.close();

            expect(removeSpy).toHaveBeenCalledWith("mousemove", win._docMouseMoveHandler, true);
            removeSpy.mockRestore();
        });

        test("removes mousedown event listener", () => {
            const win = createTestWindow();
            const removeSpy = jest.spyOn(document, "removeEventListener");
            win.onclose = jest.fn();

            win.close();

            expect(removeSpy).toHaveBeenCalledWith("mousedown", win._docMouseDownHandler, true);
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

        test("removes all three event listeners", () => {
            const win = createTestWindow();
            const removeSpy = jest.spyOn(document, "removeEventListener");

            win.destroy();

            expect(removeSpy).toHaveBeenCalledWith("mouseup", win._dragTopHandler, true);
            expect(removeSpy).toHaveBeenCalledWith("mousemove", win._docMouseMoveHandler, true);
            expect(removeSpy).toHaveBeenCalledWith("mousedown", win._docMouseDownHandler, true);
            removeSpy.mockRestore();
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
});
