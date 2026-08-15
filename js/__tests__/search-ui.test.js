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

if (typeof global._ !== "function") {
    global._ = s => s;
}
if (typeof global.docByClass !== "function") {
    global.docByClass = () => [];
}

const { SearchUI, setupSearchUI } = require("../search-ui.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeActivity() {
    const searchWidget = {
        style: { visibility: "hidden", zIndex: "", border: "", left: "", top: "" },
        value: null,
        idInput_custom: "",
        protoblk: null,
        focus: jest.fn(),
        placeholder: ""
    };
    const helpfulSearchWidget = {
        style: { visibility: "hidden", zIndex: "" },
        value: null,
        idInput_custom: "",
        protoblk: null,
        focus: jest.fn(),
        placeholder: ""
    };
    return {
        searchWidget,
        helpfulSearchWidget,
        palettes: {
            getSearchPos: jest.fn(() => ({ x: 10, y: 20 }))
        },
        getStageScale: jest.fn(() => 1),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        __tick: jest.fn()
    };
}

// ---------------------------------------------------------------------------
// setupSearchUI factory
// ---------------------------------------------------------------------------

describe("setupSearchUI", () => {
    test("returns a SearchUI instance", () => {
        const activity = makeActivity();
        const ui = setupSearchUI(activity);
        expect(ui).toBeInstanceOf(SearchUI);
    });

    test("does not attach ui to activity", () => {
        const activity = makeActivity();
        setupSearchUI(activity);
        expect(activity.searchUI).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe("SearchUI constructor", () => {
    test("initialises with null helpfulSearchDiv", () => {
        const ui = new SearchUI(makeActivity());
        expect(ui.helpfulSearchDiv).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// createSearchUI
// ---------------------------------------------------------------------------

describe("SearchUI.createSearchUI", () => {
    beforeEach(() => {
        document.createElement = jest.fn(tag => ({
            tagName: tag,
            style: {},
            setAttribute: jest.fn(),
            classList: { add: jest.fn() },
            placeholder: ""
        }));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("creates a helpfulSearchWidget and attaches it to activity", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.createSearchUI();
        expect(activity.helpfulSearchWidget).toBeDefined();
        expect(document.createElement).toHaveBeenCalledWith("input");
    });

    test("sets id, visibility, placeholder, and class on the created input", () => {
        const mockInput = {
            style: {},
            setAttribute: jest.fn(),
            classList: { add: jest.fn() },
            placeholder: ""
        };
        document.createElement = jest.fn(() => mockInput);

        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.createSearchUI();

        expect(mockInput.setAttribute).toHaveBeenCalledWith("id", "helpfulSearch");
        expect(mockInput.style.visibility).toBe("hidden");
        expect(mockInput.placeholder).toBe("Search for blocks");
        expect(mockInput.classList.add).toHaveBeenCalledWith("ui-autocomplete");
    });
});

// ---------------------------------------------------------------------------
// show
// ---------------------------------------------------------------------------

describe("SearchUI.show", () => {
    test("makes the search widget visible", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        activity.searchWidget.style.visibility = "hidden";

        ui.show();

        expect(activity.searchWidget.style.visibility).toBe("visible");
    });

    test("positions the widget from palettes.getSearchPos", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);

        ui.show();

        expect(activity.searchWidget.style.left).toBe("10px");
        expect(activity.searchWidget.style.top).toBe("20px");
    });

    test("sets zIndex and border on the widget", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.show();
        expect(activity.searchWidget.style.zIndex).toBe(1001);
        expect(activity.searchWidget.style.border).toBe("2px solid lightblue");
    });

    test("makes an existing ui-menu element visible", () => {
        const mockMenu = { style: { visibility: "hidden" } };
        global.docByClass = () => [mockMenu];

        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.show();

        expect(mockMenu.style.visibility).toBe("visible");
        global.docByClass = () => [];
    });
});

// ---------------------------------------------------------------------------
// hide
// ---------------------------------------------------------------------------

describe("SearchUI.hide", () => {
    test("sets visibility to hidden and clears idInput_custom", () => {
        const activity = makeActivity();
        activity.searchWidget.style.visibility = "visible";
        activity.searchWidget.idInput_custom = "drum";

        const ui = new SearchUI(activity);
        ui.hide();

        expect(activity.searchWidget.style.visibility).toBe("hidden");
        expect(activity.searchWidget.idInput_custom).toBe("");
    });

    test("hides an existing ui-menu element", () => {
        const mockMenu = { style: { visibility: "visible" } };
        global.docByClass = () => [mockMenu];

        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.hide();

        expect(mockMenu.style.visibility).toBe("hidden");
        global.docByClass = () => [];
    });
});

// ---------------------------------------------------------------------------
// focusInput
// ---------------------------------------------------------------------------

describe("SearchUI.focusInput", () => {
    test("calls focus on the search widget", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.focusInput();
        expect(activity.searchWidget.focus).toHaveBeenCalled();
    });

    test("does not throw when searchWidget is null", () => {
        const activity = makeActivity();
        activity.searchWidget = null;
        const ui = new SearchUI(activity);
        expect(() => ui.focusInput()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// updateQuery
// ---------------------------------------------------------------------------

describe("SearchUI.updateQuery", () => {
    test("sets the value on the search widget", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.updateQuery("drum");
        expect(activity.searchWidget.value).toBe("drum");
    });

    test("does not throw when searchWidget is null", () => {
        const activity = makeActivity();
        activity.searchWidget = null;
        const ui = new SearchUI(activity);
        expect(() => ui.updateQuery("drum")).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// Stubs: highlightMatches, clearHighlights, updateResultCounter
// ---------------------------------------------------------------------------

describe("SearchUI stubs", () => {
    test("highlightMatches is a no-op", () => {
        const ui = new SearchUI(makeActivity());
        expect(() => ui.highlightMatches()).not.toThrow();
    });

    test("clearHighlights is a no-op", () => {
        const ui = new SearchUI(makeActivity());
        expect(() => ui.clearHighlights()).not.toThrow();
    });

    test("updateResultCounter is a no-op", () => {
        const ui = new SearchUI(makeActivity());
        expect(() => ui.updateResultCounter(5)).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// setupMainAutocomplete
// ---------------------------------------------------------------------------

describe("SearchUI.setupMainAutocomplete", () => {
    let $elem;

    beforeEach(() => {
        $elem = {
            _initFlag: false,
            _capturedOpts: null,
            data: jest.fn(function (key, val) {
                if (val !== undefined) this._initFlag = val;
                return key === "autocomplete-init" ? this._initFlag : undefined;
            }),
            autocomplete: jest.fn(function (arg) {
                if (typeof arg === "object") this._capturedOpts = arg;
                if (arg === "instance") return null;
            })
        };
        global.window = global.window || {};
        global.window.jQuery = jest.fn(() => $elem);
    });

    afterEach(() => {
        delete global.window.jQuery;
    });

    test("calls jQuery autocomplete with source, appendTo, select, and focus options", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.setupMainAutocomplete(() => [], jest.fn(), jest.fn());
        expect($elem.autocomplete).toHaveBeenCalledWith(
            expect.objectContaining({
                source: expect.any(Function),
                appendTo: "body",
                select: expect.any(Function),
                focus: expect.any(Function)
            })
        );
    });

    test("marks autocomplete as initialised to prevent double-init", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.setupMainAutocomplete(() => [], jest.fn(), jest.fn());
        expect($elem.data).toHaveBeenCalledWith("autocomplete-init", true);
    });

    test("skips setup when already initialised", () => {
        $elem._initFlag = true;
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.setupMainAutocomplete(() => [], jest.fn(), jest.fn());
        expect($elem.autocomplete).not.toHaveBeenCalledWith(
            expect.objectContaining({ source: expect.any(Function) })
        );
    });

    test("source callback passes term through sourceFn", () => {
        const sourceFn = jest.fn(() => [{ label: "drum" }]);
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.setupMainAutocomplete(sourceFn, jest.fn(), jest.fn());

        const response = jest.fn();
        $elem._capturedOpts.source({ term: "  DRUM  " }, response);

        expect(sourceFn).toHaveBeenCalledWith("drum");
        expect(response).toHaveBeenCalledWith([{ label: "drum" }]);
    });

    test("select callback updates searchWidget fields and calls selectCb", () => {
        const selectCb = jest.fn();
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.setupMainAutocomplete(() => [], selectCb, jest.fn());

        const item = { label: "drum", value: "drum-id", specialDict: { name: "drum" } };
        const event = { preventDefault: jest.fn(), keyCode: 0 };
        $elem._capturedOpts.select(event, { item });

        expect(event.preventDefault).toHaveBeenCalled();
        expect(activity.searchWidget.value).toBe("drum");
        expect(activity.searchWidget.idInput_custom).toBe("drum-id");
        expect(activity.searchWidget.protoblk).toBe(item.specialDict);
        expect(selectCb).toHaveBeenCalledWith(item, 0);
    });

    test("focus callback calls event.preventDefault", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.setupMainAutocomplete(() => [], jest.fn(), jest.fn());

        const event = { preventDefault: jest.fn() };
        $elem._capturedOpts.focus(event);
        expect(event.preventDefault).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// showHelpfulInput
// ---------------------------------------------------------------------------

describe("SearchUI.showHelpfulInput", () => {
    let helpfulWheelDivEl;

    beforeEach(() => {
        helpfulWheelDivEl = { style: { display: "block" } };
        document.getElementById = jest.fn(id => {
            if (id === "helpfulWheelDiv") return helpfulWheelDivEl;
            return null;
        });
        global.window = global.window || {};
        global.window.jQuery = jest.fn(() => ({
            data: jest.fn(() => false),
            autocomplete: jest.fn()
        }));
    });

    afterEach(() => {
        delete global.window.jQuery;
        jest.restoreAllMocks();
    });

    test("makes helpfulSearchWidget visible", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.showHelpfulInput();
        expect(activity.helpfulSearchWidget.style.visibility).toBe("visible");
    });

    test("hides helpfulWheelDiv", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.showHelpfulInput();
        expect(helpfulWheelDivEl.style.display).toBe("none");
    });

    test("silently ignores autocomplete destroy errors", () => {
        global.window.jQuery = jest.fn(() => ({
            data: jest.fn(() => false),
            autocomplete: jest.fn(() => {
                throw new Error("not initialized");
            })
        }));
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        expect(() => ui.showHelpfulInput()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// focusHelpfulInput
// ---------------------------------------------------------------------------

describe("SearchUI.focusHelpfulInput", () => {
    test("calls focus on helpfulSearchWidget", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.focusHelpfulInput();
        expect(activity.helpfulSearchWidget.focus).toHaveBeenCalled();
    });

    test("does not throw when helpfulSearchWidget is null", () => {
        const activity = makeActivity();
        activity.helpfulSearchWidget = null;
        const ui = new SearchUI(activity);
        expect(() => ui.focusHelpfulInput()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// buildHelpfulSearchDiv
// ---------------------------------------------------------------------------

describe("SearchUI.buildHelpfulSearchDiv", () => {
    beforeEach(() => {
        document.getElementById = jest.fn(() => null);
        document.body.appendChild = jest.fn();
        document.createElement = jest.fn(tag => ({
            tagName: tag,
            style: { cssText: "" },
            setAttribute: jest.fn(),
            appendChild: jest.fn(),
            textContent: "",
            id: ""
        }));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("creates helpfulSearchDiv and sets it on the instance", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.buildHelpfulSearchDiv();
        expect(ui.helpfulSearchDiv).not.toBeNull();
    });

    test("appends helpfulSearchDiv to document.body", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.buildHelpfulSearchDiv();
        expect(document.body.appendChild).toHaveBeenCalled();
    });

    test("returns an object with closeButton property", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        const result = ui.buildHelpfulSearchDiv();
        expect(result).toHaveProperty("closeButton");
    });
});

// ---------------------------------------------------------------------------
// removeHelpfulSearchDiv
// ---------------------------------------------------------------------------

describe("SearchUI.removeHelpfulSearchDiv", () => {
    let helpfulWheelDivEl;

    beforeEach(() => {
        helpfulWheelDivEl = { style: { display: "block" } };
        document.getElementById = jest.fn(id => {
            if (id === "helpfulWheelDiv") return helpfulWheelDivEl;
            return null;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("sets helpfulWheelDiv display to none", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.helpfulSearchDiv = null;
        ui.removeHelpfulSearchDiv();
        expect(helpfulWheelDivEl.style.display).toBe("none");
    });

    test("removes helpfulSearchDiv from the DOM and nulls the reference", () => {
        const removeChild = jest.fn();
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        const helpfulDiv = { parentNode: { removeChild } };
        ui.helpfulSearchDiv = helpfulDiv;

        ui.removeHelpfulSearchDiv();

        expect(removeChild).toHaveBeenCalledWith(helpfulDiv);
        expect(ui.helpfulSearchDiv).toBeNull();
    });

    test("does not throw when helpfulSearchDiv has no parentNode", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.helpfulSearchDiv = { parentNode: null };
        expect(() => ui.removeHelpfulSearchDiv()).not.toThrow();
    });

    test("does not change display when helpfulWheelDiv is already none", () => {
        helpfulWheelDivEl.style.display = "none";
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.removeHelpfulSearchDiv();
        expect(helpfulWheelDivEl.style.display).toBe("none");
    });
});

// ---------------------------------------------------------------------------
// destroy
// ---------------------------------------------------------------------------

describe("SearchUI.destroy", () => {
    let helpfulWheelDivEl;

    beforeEach(() => {
        helpfulWheelDivEl = { style: { display: "block" } };
        document.getElementById = jest.fn(id => {
            if (id === "helpfulWheelDiv") return helpfulWheelDivEl;
            return null;
        });
        global.docByClass = () => [];
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("hides the main search widget", () => {
        const activity = makeActivity();
        activity.searchWidget.style.visibility = "visible";
        const ui = new SearchUI(activity);

        ui.destroy();

        expect(activity.searchWidget.style.visibility).toBe("hidden");
    });

    test("calls removeHelpfulSearchDiv", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        const spy = jest.spyOn(ui, "removeHelpfulSearchDiv");

        ui.destroy();

        expect(spy).toHaveBeenCalled();
    });

    test("does not throw when searchWidget is null", () => {
        const activity = makeActivity();
        activity.searchWidget = null;
        const ui = new SearchUI(activity);
        expect(() => ui.destroy()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// State queries
// ---------------------------------------------------------------------------

describe("SearchUI.isVisible", () => {
    test("returns true when searchWidget visibility is 'visible'", () => {
        const activity = makeActivity();
        activity.searchWidget.style.visibility = "visible";
        const ui = new SearchUI(activity);
        expect(ui.isVisible()).toBe(true);
    });

    test("returns false when searchWidget visibility is 'hidden'", () => {
        const activity = makeActivity();
        activity.searchWidget.style.visibility = "hidden";
        const ui = new SearchUI(activity);
        expect(ui.isVisible()).toBe(false);
    });

    test("returns false when searchWidget is null", () => {
        const activity = makeActivity();
        activity.searchWidget = null;
        const ui = new SearchUI(activity);
        expect(ui.isVisible()).toBe(false);
    });
});

describe("SearchUI.isHelpfulSearchVisible", () => {
    test("returns true when helpfulSearchDiv is set and display is block", () => {
        const ui = new SearchUI(makeActivity());
        ui.helpfulSearchDiv = { style: { display: "block" } };
        expect(ui.isHelpfulSearchVisible()).toBe(true);
    });

    test("returns false when helpfulSearchDiv is null", () => {
        const ui = new SearchUI(makeActivity());
        ui.helpfulSearchDiv = null;
        expect(ui.isHelpfulSearchVisible()).toBe(false);
    });

    test("returns false when helpfulSearchDiv display is not block", () => {
        const ui = new SearchUI(makeActivity());
        ui.helpfulSearchDiv = { style: { display: "none" } };
        expect(ui.isHelpfulSearchVisible()).toBe(false);
    });
});

describe("SearchUI.isHelpfulSearchWidgetOn", () => {
    test("returns the same value as isHelpfulSearchVisible()", () => {
        const ui = new SearchUI(makeActivity());
        ui.helpfulSearchDiv = { style: { display: "block" } };
        expect(ui.isHelpfulSearchWidgetOn).toBe(ui.isHelpfulSearchVisible());
    });
});

describe("SearchUI.isHelpfulSearchDivMounted", () => {
    test("returns true when #helpfulSearchDiv exists in the DOM", () => {
        document.getElementById = jest.fn(id =>
            id === "helpfulSearchDiv" ? { id: "helpfulSearchDiv" } : null
        );
        const ui = new SearchUI(makeActivity());
        expect(ui.isHelpfulSearchDivMounted()).toBe(true);
        jest.restoreAllMocks();
    });

    test("returns false when #helpfulSearchDiv is absent", () => {
        document.getElementById = jest.fn(() => null);
        const ui = new SearchUI(makeActivity());
        expect(ui.isHelpfulSearchDivMounted()).toBe(false);
        jest.restoreAllMocks();
    });
});

describe("SearchUI.containsMainSearchTarget", () => {
    let searchEl, menuEl;

    beforeEach(() => {
        searchEl = {
            style: { visibility: "visible" },
            contains: jest.fn(() => false)
        };
        menuEl = {
            style: { display: "block" },
            contains: jest.fn(() => false)
        };
        document.getElementById = jest.fn(id => {
            if (id === "search") return searchEl;
            if (id === "ui-id-1") return menuEl;
            return null;
        });
        document.querySelector = jest.fn(() => null);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("returns true when target is the search input itself", () => {
        const ui = new SearchUI(makeActivity());
        expect(ui.containsMainSearchTarget(searchEl)).toBe(true);
    });

    test("returns true when target is inside the autocomplete menu", () => {
        const target = {};
        menuEl.contains = jest.fn(t => t === target);
        const ui = new SearchUI(makeActivity());
        expect(ui.containsMainSearchTarget(target)).toBe(true);
    });

    test("returns true when target is inside the palette search row", () => {
        const target = {};
        const paletteRow = { contains: jest.fn(t => t === target) };
        document.querySelector = jest.fn(() => paletteRow);
        searchEl.style.visibility = "hidden";
        menuEl.style.display = "none";
        const ui = new SearchUI(makeActivity());
        expect(ui.containsMainSearchTarget(target)).toBe(true);
    });

    test("returns false for an unrelated target", () => {
        searchEl.style.visibility = "hidden";
        menuEl.style.display = "none";
        const ui = new SearchUI(makeActivity());
        expect(ui.containsMainSearchTarget({})).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// setupMainAutocomplete — _renderItem assignment (instance branch)
// ---------------------------------------------------------------------------

describe("SearchUI.setupMainAutocomplete — instance renderItem", () => {
    test("assigns _renderItem on the autocomplete instance when it exists", () => {
        const instance = { _renderItem: null };
        const $elem = {
            _initFlag: false,
            data: jest.fn(function (key, val) {
                if (val !== undefined) this._initFlag = val;
                return key === "autocomplete-init" ? this._initFlag : undefined;
            }),
            autocomplete: jest.fn(function (arg) {
                if (arg === "instance") return instance;
            })
        };
        global.window.jQuery = jest.fn(() => $elem);

        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.setupMainAutocomplete(() => [], jest.fn(), jest.fn());

        expect(typeof instance._renderItem).toBe("function");
        delete global.window.jQuery;
    });
});

// ---------------------------------------------------------------------------
// triggerMainSearch
// ---------------------------------------------------------------------------

describe("SearchUI.triggerMainSearch", () => {
    test("calls jQuery autocomplete search with the given value", () => {
        const autocomplete = jest.fn();
        global.window.jQuery = jest.fn(() => ({ autocomplete }));
        const ui = new SearchUI(makeActivity());
        ui.triggerMainSearch("drum");
        expect(autocomplete).toHaveBeenCalledWith("search", "drum");
        delete global.window.jQuery;
    });
});

// ---------------------------------------------------------------------------
// setupHelpfulAutocomplete
// ---------------------------------------------------------------------------

describe("SearchUI.setupHelpfulAutocomplete", () => {
    let $elem;

    beforeEach(() => {
        $elem = {
            _initFlag: false,
            _capturedOpts: null,
            data: jest.fn(function (key, val) {
                if (val !== undefined) this._initFlag = val;
                return key === "autocomplete-init" ? this._initFlag : undefined;
            }),
            autocomplete: jest.fn(function (arg) {
                if (typeof arg === "object") this._capturedOpts = arg;
                if (arg === "instance") return null;
            })
        };
        global.window.jQuery = jest.fn(() => $elem);
    });

    afterEach(() => {
        delete global.window.jQuery;
    });

    test("calls jQuery autocomplete with source, appendTo, select, and focus", () => {
        const ui = new SearchUI(makeActivity());
        ui.setupHelpfulAutocomplete(() => [], jest.fn());
        expect($elem.autocomplete).toHaveBeenCalledWith(
            expect.objectContaining({
                source: expect.any(Function),
                appendTo: "body",
                select: expect.any(Function),
                focus: expect.any(Function)
            })
        );
    });

    test("marks autocomplete as initialised", () => {
        const ui = new SearchUI(makeActivity());
        ui.setupHelpfulAutocomplete(() => [], jest.fn());
        expect($elem.data).toHaveBeenCalledWith("autocomplete-init", true);
    });

    test("skips setup when already initialised", () => {
        $elem._initFlag = true;
        const ui = new SearchUI(makeActivity());
        ui.setupHelpfulAutocomplete(() => [], jest.fn());
        expect($elem.autocomplete).not.toHaveBeenCalledWith(
            expect.objectContaining({ source: expect.any(Function) })
        );
    });

    test("source callback normalises and passes term through sourceFn", () => {
        const sourceFn = jest.fn(() => [{ label: "drum" }]);
        const ui = new SearchUI(makeActivity());
        ui.setupHelpfulAutocomplete(sourceFn, jest.fn());

        const response = jest.fn();
        $elem._capturedOpts.source({ term: "  DRUM  " }, response);

        expect(sourceFn).toHaveBeenCalledWith("drum");
        expect(response).toHaveBeenCalledWith([{ label: "drum" }]);
    });

    test("select callback updates helpfulSearchWidget fields and calls selectCb", () => {
        const selectCb = jest.fn();
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.setupHelpfulAutocomplete(() => [], selectCb);

        const item = { label: "drum", value: "drum-id", specialDict: { name: "drum" } };
        const event = { preventDefault: jest.fn() };
        $elem._capturedOpts.select(event, { item });

        expect(event.preventDefault).toHaveBeenCalled();
        expect(activity.helpfulSearchWidget.value).toBe("drum");
        expect(activity.helpfulSearchWidget.idInput_custom).toBe("drum-id");
        expect(activity.helpfulSearchWidget.protoblk).toBe(item.specialDict);
        expect(selectCb).toHaveBeenCalledWith(item);
    });

    test("focus callback calls event.preventDefault", () => {
        const ui = new SearchUI(makeActivity());
        ui.setupHelpfulAutocomplete(() => [], jest.fn());
        const event = { preventDefault: jest.fn() };
        $elem._capturedOpts.focus(event);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    test("assigns _renderItem on the instance when it exists", () => {
        const instance = { _renderItem: null };
        $elem.autocomplete = jest.fn(function (arg) {
            if (typeof arg === "object") this._capturedOpts = arg;
            if (arg === "instance") return instance;
        });
        const li = {
            append: jest.fn(),
            appendTo: jest.fn(function () {
                return this;
            })
        };
        global.window.jQuery = jest.fn(selector => {
            if (selector === "<li></li>") return li;
            if (selector === "<a>")
                return {
                    text: jest.fn(function () {
                        return this;
                    })
                };
            return $elem;
        });

        const ui = new SearchUI(makeActivity());
        ui.setupHelpfulAutocomplete(() => [], jest.fn());

        expect(typeof instance._renderItem).toBe("function");

        const ul = { css: jest.fn(() => ul) };
        const item = { label: "drum", artwork: "" };
        instance._renderItem(ul, item);
        expect(li.append).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// triggerHelpfulSearch
// ---------------------------------------------------------------------------

describe("SearchUI.triggerHelpfulSearch", () => {
    test("calls jQuery autocomplete search with the given value", () => {
        const autocomplete = jest.fn();
        global.window.jQuery = jest.fn(() => ({ autocomplete }));
        const ui = new SearchUI(makeActivity());
        ui.triggerHelpfulSearch("pitch");
        expect(autocomplete).toHaveBeenCalledWith("search", "pitch");
        delete global.window.jQuery;
    });
});

// ---------------------------------------------------------------------------
// buildHelpfulSearchDiv — existing-div removal branch
// ---------------------------------------------------------------------------

describe("SearchUI.buildHelpfulSearchDiv — existing div removal", () => {
    test("removes a pre-existing #helpfulSearchDiv before creating a new one", () => {
        const removeChild = jest.fn();
        const existingDiv = { parentNode: { removeChild } };

        const mockEl = {
            style: { cssText: "" },
            setAttribute: jest.fn(),
            appendChild: jest.fn(),
            textContent: "",
            id: ""
        };
        document.createElement = jest.fn(() => mockEl);
        document.getElementById = jest.fn(id => (id === "helpfulSearchDiv" ? existingDiv : null));
        document.body.appendChild = jest.fn();

        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.buildHelpfulSearchDiv();

        expect(removeChild).toHaveBeenCalledWith(existingDiv);
        jest.restoreAllMocks();
    });
});

// ---------------------------------------------------------------------------
// positionHelpfulSearchDiv
// ---------------------------------------------------------------------------

describe("SearchUI.positionHelpfulSearchDiv", () => {
    let helpfulWheelDiv, helpfulSearchDiv;

    beforeEach(() => {
        helpfulWheelDiv = { offsetLeft: 100, offsetTop: 200 };
        helpfulSearchDiv = {
            style: { left: "", top: "", display: "" },
            offsetWidth: 80,
            offsetHeight: 40,
            offsetLeft: 180,
            offsetTop: 310
        };
        document.getElementById = jest.fn(id =>
            id === "helpfulWheelDiv" ? helpfulWheelDiv : null
        );
        global.window.innerWidth = 1280;
        global.window.innerHeight = 800;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("sets left and top from helpfulWheelDiv offsets and stage scale", () => {
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.helpfulSearchDiv = helpfulSearchDiv;
        ui.positionHelpfulSearchDiv();
        // 100 + 80*1 = 180, 200 + 110*1 = 310
        expect(helpfulSearchDiv.style.left).toBe("180px");
        expect(helpfulSearchDiv.style.top).toBe("310px");
        expect(helpfulSearchDiv.style.display).toBe("block");
    });

    test("clamps left when div would overflow viewport right edge", () => {
        helpfulSearchDiv.offsetLeft = 1250;
        helpfulSearchDiv.offsetWidth = 80;
        global.window.innerWidth = 1280;
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.helpfulSearchDiv = helpfulSearchDiv;
        ui.positionHelpfulSearchDiv();
        // 1250 + 80 > 1280, so clamp: 1280 - 80 = 1200
        expect(helpfulSearchDiv.style.left).toBe("1200px");
    });

    test("clamps top when div would overflow viewport bottom edge", () => {
        helpfulSearchDiv.offsetTop = 790;
        helpfulSearchDiv.offsetHeight = 40;
        global.window.innerHeight = 800;
        const activity = makeActivity();
        const ui = new SearchUI(activity);
        ui.helpfulSearchDiv = helpfulSearchDiv;
        ui.positionHelpfulSearchDiv();
        // 790 + 40 > 800, so clamp: 800 - 40 = 760
        expect(helpfulSearchDiv.style.top).toBe("760px");
    });
});

// ---------------------------------------------------------------------------
// _renderMainItem
// ---------------------------------------------------------------------------

describe("SearchUI._renderMainItem", () => {
    let $j, ul, liEl, liProxy;

    beforeEach(() => {
        liEl = {
            addEventListener: jest.fn()
        };
        liProxy = {
            0: liEl,
            append: jest.fn(),
            appendTo: jest.fn(function () {
                return this;
            })
        };
        ul = { css: jest.fn(() => ul) };

        const mockAnchor = {
            text: jest.fn(function () {
                return this;
            })
        };
        $j = jest.fn(selector => {
            if (selector === "<li></li>") return liProxy;
            if (selector === "<a>") return mockAnchor;
            if (selector === "#search") return { autocomplete: jest.fn() };
            return {};
        });

        document.body.appendChild = jest.fn();
        document.body.removeChild = jest.fn();
        document.addEventListener = jest.fn();
        document.removeEventListener = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("creates an img element and appends it to the li", () => {
        const mockImg = {
            style: { cursor: "", position: "", zIndex: "", left: "", top: "" },
            src: "",
            height: 0,
            offsetWidth: 20,
            offsetHeight: 20,
            parentNode: null,
            ondragstart: null
        };
        document.createElement = jest.fn(() => mockImg);

        const ui = new SearchUI(makeActivity());
        const item = { label: "drum", artwork: "drum.png", specialDict: {} };
        ui._renderMainItem($j, ul, item, jest.fn());

        expect(document.createElement).toHaveBeenCalledWith("img");
        expect(mockImg.src).toBe("drum.png");
        expect(mockImg.height).toBe(20);
        expect(mockImg.style.cursor).toBe("grab");
    });

    test("attaches mousedown and touchstart listeners to the li element", () => {
        const mockImg = {
            style: { cursor: "", position: "", zIndex: "", left: "", top: "" },
            src: "",
            height: 0,
            offsetWidth: 20,
            offsetHeight: 20,
            parentNode: null,
            ondragstart: null
        };
        document.createElement = jest.fn(() => mockImg);

        const ui = new SearchUI(makeActivity());
        const item = { label: "drum", artwork: "", specialDict: {} };
        ui._renderMainItem($j, ul, item, jest.fn());

        const events = liEl.addEventListener.mock.calls.map(c => c[0]);
        expect(events).toContain("mousedown");
        expect(events).toContain("touchstart");
    });

    test("mousedown handler appends img to body and registers move/up listeners", () => {
        const mockImg = {
            style: { cursor: "grab", position: "", zIndex: "", left: "", top: "" },
            src: "",
            height: 0,
            offsetWidth: 20,
            offsetHeight: 20,
            parentNode: null,
            ondragstart: null
        };
        document.createElement = jest.fn(() => mockImg);

        const ui = new SearchUI(makeActivity());
        const dropCb = jest.fn();
        const item = { label: "drum", artwork: "", specialDict: { name: "drum" } };
        ui._renderMainItem($j, ul, item, dropCb);

        const downHandler = liEl.addEventListener.mock.calls.find(c => c[0] === "mousedown")[1];
        downHandler({
            stopPropagation: jest.fn(),
            stopImmediatePropagation: jest.fn(),
            preventDefault: jest.fn(),
            pageX: 100,
            pageY: 200,
            type: "mousedown"
        });

        expect(document.body.appendChild).toHaveBeenCalledWith(mockImg);
        const docEvents = document.addEventListener.mock.calls.map(c => c[0]);
        expect(docEvents).toContain("mousemove");
        expect(docEvents).toContain("mouseup");
    });

    test("mouseup handler calls dropCb and removes img from body", () => {
        const mockImg = {
            style: { cursor: "grab", position: "", zIndex: "", left: "90px", top: "190px" },
            src: "",
            height: 0,
            offsetWidth: 20,
            offsetHeight: 20,
            parentNode: document.body,
            ondragstart: null
        };
        document.createElement = jest.fn(() => mockImg);
        document.body.removeChild = jest.fn();

        const ui = new SearchUI(makeActivity());
        const dropCb = jest.fn();
        const specialDict = { name: "drum" };
        const item = { label: "drum", artwork: "", specialDict };
        ui._renderMainItem($j, ul, item, dropCb);

        // Trigger mousedown
        const downHandler = liEl.addEventListener.mock.calls.find(c => c[0] === "mousedown")[1];
        downHandler({
            stopPropagation: jest.fn(),
            stopImmediatePropagation: jest.fn(),
            preventDefault: jest.fn(),
            pageX: 100,
            pageY: 200,
            type: "mousedown"
        });

        // Trigger mouseup
        const upCall = document.addEventListener.mock.calls.find(c => c[0] === "mouseup");
        upCall[1]();

        expect(dropCb).toHaveBeenCalledWith(specialDict, 90, 190);
        expect(document.body.removeChild).toHaveBeenCalledWith(mockImg);
    });

    test("mouseup skips dropCb when coordinates are NaN (pageX/pageY were NaN)", () => {
        const mockImg = {
            style: { cursor: "grab", position: "", zIndex: "", left: "", top: "" },
            src: "",
            height: 0,
            offsetWidth: 20,
            offsetHeight: 20,
            parentNode: null,
            ondragstart: null
        };
        document.createElement = jest.fn(() => mockImg);

        const ui = new SearchUI(makeActivity());
        const dropCb = jest.fn();
        const item = { label: "drum", artwork: "", specialDict: {} };
        ui._renderMainItem($j, ul, item, dropCb);

        const downHandler = liEl.addEventListener.mock.calls.find(c => c[0] === "mousedown")[1];
        // NaN pageX/pageY → moveAt sets img.style.left = "NaNpx"
        // parseInt("NaNpx") = NaN, so dropCb should be skipped
        downHandler({
            stopPropagation: jest.fn(),
            stopImmediatePropagation: jest.fn(),
            preventDefault: jest.fn(),
            pageX: NaN,
            pageY: NaN,
            type: "mousedown"
        });

        const upCall = document.addEventListener.mock.calls.find(c => c[0] === "mouseup");
        upCall[1]();

        expect(dropCb).not.toHaveBeenCalled();
    });

    test("onMouseMove with touchmove uses touch coordinates", () => {
        const mockImg = {
            style: { cursor: "grab", position: "", zIndex: "", left: "", top: "" },
            src: "",
            height: 0,
            offsetWidth: 20,
            offsetHeight: 20,
            parentNode: null,
            ondragstart: null
        };
        document.createElement = jest.fn(() => mockImg);

        const ui = new SearchUI(makeActivity());
        const item = { label: "drum", artwork: "", specialDict: {} };
        ui._renderMainItem($j, ul, item, jest.fn());

        const downHandler = liEl.addEventListener.mock.calls.find(c => c[0] === "mousedown")[1];
        downHandler({
            stopPropagation: jest.fn(),
            stopImmediatePropagation: jest.fn(),
            preventDefault: jest.fn(),
            pageX: 0,
            pageY: 0,
            type: "mousedown"
        });

        const moveCall = document.addEventListener.mock.calls.find(c => c[0] === "touchmove");
        expect(moveCall).toBeDefined();
        moveCall[1]({
            preventDefault: jest.fn(),
            type: "touchmove",
            touches: [{ clientX: 55, clientY: 66 }]
        });
        // 55 - 10 = 45
        expect(mockImg.style.left).toBe("45px");
        expect(mockImg.style.top).toBe("56px");
    });
});
