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
