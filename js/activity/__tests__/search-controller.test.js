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
if (typeof global.STANDARDBLOCKHEIGHT === "undefined") {
    global.STANDARDBLOCKHEIGHT = 40;
}

const { setupSearchController, SearchController } = require("../search-controller.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProtoBlock(name, label, deprecated = false, extraSearchTerms = undefined) {
    const block = {
        name,
        staticLabels: label ? [label] : [],
        deprecated,
        extraSearchTerms,
        palette: {
            name: "test-palette",
            model: {
                makeBlockInfo: jest.fn(() => ({ artwork64: `img-${name}` }))
            }
        }
    };
    return block;
}

function makeActivity(protoBlocks = {}) {
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
        blocks: {
            protoBlockDict: protoBlocks,
            moveBlock: jest.fn()
        },
        palettes: {
            getSearchPos: jest.fn(() => ({ x: 10, y: 20 })),
            dict: {
                "test-palette": {
                    makeBlockFromSearch: jest.fn((proto, name, cb) => cb(42))
                }
            }
        },
        blocksContainer: { x: 0, y: 0 },
        getStageScale: jest.fn(() => 1),
        addEventListener: jest.fn((target, event, handler) => {
            if (target === document && event === "mousedown") {
                // store so tests can trigger it
                target._mousedownHandler = handler;
            }
        }),
        removeEventListener: jest.fn(),
        errorMsg: jest.fn(),
        __tick: jest.fn(),
        update: false
    };
}

// ---------------------------------------------------------------------------
// setupSearchController
// ---------------------------------------------------------------------------

describe("setupSearchController", () => {
    test("attaches a SearchController instance to activity", () => {
        const activity = makeActivity();
        setupSearchController(activity);
        expect(activity.searchController).toBeInstanceOf(SearchController);
    });

    test("initialises state to empty defaults", () => {
        const activity = makeActivity();
        setupSearchController(activity);
        const sc = activity.searchController;
        expect(sc.searchSuggestions).toEqual([]);
        expect(sc._searchCache).toEqual({});
        expect(sc._searchCloseListener).toBeNull();
        expect(sc.isHelpfulSearchWidgetOn).toBe(false);
        expect(sc.searchBlockPosition).toEqual([100, 100]);
        expect(sc.deprecatedBlockNames).toEqual([]);
        expect(sc.helpfulSearchDiv).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// prepSearchWidget
// ---------------------------------------------------------------------------

describe("SearchController.prepSearchWidget", () => {
    test("skips gracefully when blocks not initialised", () => {
        const activity = makeActivity();
        activity.blocks = null;
        setupSearchController(activity);
        expect(() => activity.searchController.prepSearchWidget()).not.toThrow();
        expect(activity.searchController.searchSuggestions).toEqual([]);
    });

    test("builds searchSuggestions from protoBlockDict", () => {
        const activity = makeActivity({
            drum: makeProtoBlock("drum", "drum"),
            pitch: makeProtoBlock("pitch", "pitch")
        });
        setupSearchController(activity);
        activity.searchController.prepSearchWidget();

        const labels = activity.searchController.searchSuggestions.map(s => s.label);
        expect(labels).toContain("drum");
        expect(labels).toContain("pitch");
    });

    test("excludes deprecated blocks from suggestions", () => {
        const activity = makeActivity({
            old: makeProtoBlock("old", "old block", true),
            current: makeProtoBlock("current", "current block", false)
        });
        setupSearchController(activity);
        activity.searchController.prepSearchWidget();

        const labels = activity.searchController.searchSuggestions.map(s => s.label);
        expect(labels).not.toContain("old block");
        expect(labels).toContain("current block");
        expect(activity.searchController.deprecatedBlockNames).toContain("old block");
    });

    test("adds extraSearchTerms to the searchTerms array", () => {
        const block = makeProtoBlock("note", "note value", false, ["pitch", "tone"]);
        const activity = makeActivity({ note: block });
        setupSearchController(activity);
        activity.searchController.prepSearchWidget();

        const suggestion = activity.searchController.searchSuggestions.find(
            s => s.value === "note"
        );
        expect(suggestion.searchTerms).toContain("pitch");
        expect(suggestion.searchTerms).toContain("tone");
    });

    test("resets cache and position on each call", () => {
        const activity = makeActivity({ drum: makeProtoBlock("drum", "drum") });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc._searchCache = { x: [1] };
        sc.searchBlockPosition = [200, 200];

        sc.prepSearchWidget();

        expect(sc._searchCache).toEqual({});
        expect(sc.searchBlockPosition).toEqual([100, 100]);
    });

    test("uses fallback label for known no-label blocks (scaledegree2)", () => {
        // extraSearchTerms must be defined (even empty) so the block passes the
        // `if (blockLabel || block.extraSearchTerms !== undefined)` guard.
        const block = makeProtoBlock("scaledegree2", "", false, []);
        const activity = makeActivity({ scaledegree2: block });
        setupSearchController(activity);
        activity.searchController.prepSearchWidget();

        const suggestion = activity.searchController.searchSuggestions.find(
            s => s.value === "scaledegree2"
        );
        expect(suggestion.label).toBe("scale degree");
    });
});

// ---------------------------------------------------------------------------
// filterSuggestions
// ---------------------------------------------------------------------------

describe("SearchController.filterSuggestions", () => {
    let sc;

    beforeEach(() => {
        const activity = makeActivity({
            drum: makeProtoBlock("drum", "drum beat", false, ["percussion"]),
            pitch: makeProtoBlock("pitch", "pitch value")
        });
        setupSearchController(activity);
        sc = activity.searchController;
        sc.prepSearchWidget();
    });

    test("returns all suggestions for an empty term", () => {
        const results = sc.filterSuggestions("");
        expect(results.length).toBe(sc.searchSuggestions.length);
    });

    test("matches on the primary label", () => {
        const results = sc.filterSuggestions("drum");
        expect(results.some(r => r.value === "drum")).toBe(true);
        expect(results.every(r => r.value !== "pitch")).toBe(true);
    });

    test("matches on extraSearchTerms", () => {
        const results = sc.filterSuggestions("percussion");
        expect(results.some(r => r.value === "drum")).toBe(true);
    });

    test("returns an empty array for a term that matches nothing", () => {
        const results = sc.filterSuggestions("zzznomatch");
        expect(results).toEqual([]);
    });

    test("caches results on first call and returns cache on second", () => {
        sc.filterSuggestions("drum");
        expect(sc._searchCache["drum"]).toBeDefined();

        // Mutate suggestions to prove cache is used
        sc.searchSuggestions = [];
        const cached = sc.filterSuggestions("drum");
        expect(cached).toBe(sc._searchCache["drum"]);
    });
});

// ---------------------------------------------------------------------------
// hideSearchWidget
// ---------------------------------------------------------------------------

describe("SearchController.hideSearchWidget", () => {
    test("hides the search input and clears idInput_custom", () => {
        const activity = makeActivity();
        setupSearchController(activity);
        activity.searchWidget.style.visibility = "visible";
        activity.searchWidget.idInput_custom = "drum";

        activity.searchController.hideSearchWidget();

        expect(activity.searchWidget.style.visibility).toBe("hidden");
        expect(activity.searchWidget.idInput_custom).toBe("");
    });

    test("removes the stored mousedown close listener", () => {
        const activity = makeActivity();
        setupSearchController(activity);
        const sc = activity.searchController;
        const listener = jest.fn();
        sc._searchCloseListener = listener;

        sc.hideSearchWidget();

        expect(activity.removeEventListener).toHaveBeenCalledWith(document, "mousedown", listener);
        expect(sc._searchCloseListener).toBeNull();
    });

    test("hides ui-menu element when present", () => {
        const mockMenu = { style: { visibility: "visible" } };
        global.docByClass = () => [mockMenu];

        const activity = makeActivity();
        setupSearchController(activity);
        activity.searchController.hideSearchWidget();

        expect(mockMenu.style.visibility).toBe("hidden");
        global.docByClass = () => [];
    });
});

// ---------------------------------------------------------------------------
// showSearchWidget
// ---------------------------------------------------------------------------

describe("SearchController.showSearchWidget", () => {
    test("hides widget when it is already visible (toggle off)", () => {
        const activity = makeActivity();
        setupSearchController(activity);
        activity.searchWidget.style.visibility = "visible";

        const hideSpy = jest.spyOn(activity.searchController, "hideSearchWidget");
        activity.searchController.showSearchWidget();

        expect(hideSpy).toHaveBeenCalled();
    });

    test("makes widget visible and positions it from palettes.getSearchPos", () => {
        jest.useFakeTimers();
        const activity = makeActivity({ drum: makeProtoBlock("drum", "drum") });
        setupSearchController(activity);
        activity.searchWidget.style.visibility = "hidden";

        activity.searchController.showSearchWidget();

        expect(activity.searchWidget.style.visibility).toBe("visible");
        expect(activity.searchWidget.style.left).toBe("10px");
        expect(activity.searchWidget.style.top).toBe("20px");
        jest.useRealTimers();
    });

    test("registers a mousedown close listener on document", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        setupSearchController(activity);

        activity.searchController.showSearchWidget();

        expect(activity.addEventListener).toHaveBeenCalledWith(
            document,
            "mousedown",
            expect.any(Function)
        );
        jest.useRealTimers();
    });
});

// ---------------------------------------------------------------------------
// doSearch — result generation
// ---------------------------------------------------------------------------

describe("SearchController.doSearch - result generation", () => {
    beforeEach(() => {
        global.window = global.window || {};
        global.window.jQuery = jest.fn(() => ({
            data: jest.fn(() => false),
            autocomplete: jest.fn()
        }));
    });

    test("calls errorMsg for a deprecated block name", () => {
        // protoBlockDict must NOT contain the name so the first branch is skipped;
        // deprecatedBlockNames must contain idInput_custom for the second branch to fire.
        // searchSuggestions must be non-empty so doSearch doesn't re-call prepSearchWidget
        // (which would reset deprecatedBlockNames).
        const activity = makeActivity({});
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "dummy", value: "dummy", searchTerms: [] }];
        sc.deprecatedBlockNames = ["drum"];

        activity.searchWidget.idInput_custom = "drum";
        activity.searchWidget.protoblk = { palette: { name: "test-palette" }, name: "drum" };
        sc.doSearch();

        expect(activity.errorMsg).toHaveBeenCalledWith("This block is deprecated.");
    });

    test("calls errorMsg when block not found and not deprecated", () => {
        const activity = makeActivity({});
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.searchWidget.idInput_custom = "ghost";
        activity.searchWidget.protoblk = { palette: { name: "test-palette" }, name: "ghost" };
        sc.doSearch();

        expect(activity.errorMsg).toHaveBeenCalledWith("Block cannot be found.");
    });

    test("calls makeBlockFromSearch and moveBlock for a known block", () => {
        const block = makeProtoBlock("drum", "drum");
        const activity = makeActivity({ drum: block });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.searchWidget.idInput_custom = "drum";
        activity.searchWidget.protoblk = block;
        sc.doSearch();

        expect(activity.palettes.dict["test-palette"].makeBlockFromSearch).toHaveBeenCalled();
        expect(activity.blocks.moveBlock).toHaveBeenCalledWith(
            42,
            expect.any(Number),
            expect.any(Number)
        );
    });

    test("advances searchBlockPosition after placing a block", () => {
        const block = makeProtoBlock("drum", "drum");
        const activity = makeActivity({ drum: block });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();
        sc.searchBlockPosition = [100, 100];

        activity.searchWidget.idInput_custom = "drum";
        activity.searchWidget.protoblk = block;
        sc.doSearch();

        expect(sc.searchBlockPosition[0]).toBe(100 + global.STANDARDBLOCKHEIGHT);
        expect(sc.searchBlockPosition[1]).toBe(100 + global.STANDARDBLOCKHEIGHT);
    });

    test("returns early without error when searchWidget is not set", () => {
        const activity = makeActivity();
        activity.searchWidget = null;
        setupSearchController(activity);
        expect(() => activity.searchController.doSearch()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// doSearch — autocomplete initialization branches
// ---------------------------------------------------------------------------

function makeJQueryElem(alreadyInit = false) {
    let capturedOpts = null;
    const initFlag = { value: alreadyInit };
    const elem = {
        data: jest.fn(function (key, val) {
            if (val !== undefined) initFlag.value = val;
            return key === "autocomplete-init" ? initFlag.value : undefined;
        }),
        autocomplete: jest.fn(function (arg) {
            if (typeof arg === "object") capturedOpts = arg;
            if (arg === "instance") return null;
        }),
        getOpts: () => capturedOpts
    };
    return elem;
}

describe("SearchController.doSearch - autocomplete initialization", () => {
    let $elem;

    beforeEach(() => {
        $elem = makeJQueryElem();
        global.window = global.window || {};
        global.window.jQuery = jest.fn(() => $elem);
    });

    afterEach(() => {
        delete global.window.jQuery;
    });

    test("skips autocomplete setup when already initialised", () => {
        $elem = makeJQueryElem(true);
        global.window.jQuery = jest.fn(() => $elem);

        const activity = makeActivity({ drum: makeProtoBlock("drum", "drum") });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.searchWidget.idInput_custom = "drum";
        activity.searchWidget.protoblk = makeProtoBlock("drum", "drum");
        sc.doSearch();

        expect($elem.autocomplete).not.toHaveBeenCalledWith(
            expect.objectContaining({ source: expect.any(Function) })
        );
    });

    test("source callback filters suggestions by term", () => {
        const activity = makeActivity({ drum: makeProtoBlock("drum", "drum beat") });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.searchWidget.idInput_custom = "";
        activity.searchWidget.value = "";
        sc.doSearch();

        const response = jest.fn();
        $elem.getOpts().source({ term: "drum" }, response);
        expect(response).toHaveBeenCalled();
        expect(response.mock.calls[0][0].some(r => r.value === "drum")).toBe(true);
    });

    test("source callback normalises term to lowercase and trims whitespace", () => {
        const activity = makeActivity({ drum: makeProtoBlock("drum", "drum beat") });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.searchWidget.idInput_custom = "";
        sc.doSearch();

        const response = jest.fn();
        $elem.getOpts().source({ term: "  DRUM  " }, response);
        expect(response.mock.calls[0][0].some(r => r.value === "drum")).toBe(true);
    });

    test("select callback sets widget fields and re-runs doSearch", () => {
        const block = makeProtoBlock("drum", "drum beat");
        const activity = makeActivity({ drum: block });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.searchWidget.idInput_custom = "";
        activity.searchWidget.value = "";
        sc.doSearch();

        const event = { preventDefault: jest.fn(), keyCode: 0 };
        const ui = { item: { label: "drum beat", value: "drum", specialDict: block } };
        $elem.getOpts().select(event, ui);

        expect(event.preventDefault).toHaveBeenCalled();
        // The nested doSearch() that select triggers places the block and then
        // clears value back to ""; idInput_custom is not cleared.
        expect(activity.searchWidget.idInput_custom).toBe("drum");
        expect(activity.searchWidget.protoblk).toBe(block);
        expect(activity.palettes.dict["test-palette"].makeBlockFromSearch).toHaveBeenCalled();
    });

    test("focus callback calls preventDefault", () => {
        const activity = makeActivity({ drum: makeProtoBlock("drum", "drum") });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.searchWidget.idInput_custom = "";
        sc.doSearch();

        const event = { preventDefault: jest.fn() };
        $elem.getOpts().focus(event);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    test("triggers autocomplete search when idInput_custom is empty but value is set", () => {
        const activity = makeActivity();
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.searchWidget.idInput_custom = "";
        activity.searchWidget.value = "drum";
        sc.doSearch();

        expect($elem.autocomplete).toHaveBeenCalledWith("search", "drum");
    });

    test("returns without triggering autocomplete search when both inputs are empty", () => {
        const activity = makeActivity();
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.searchWidget.idInput_custom = "";
        activity.searchWidget.value = "";
        sc.doSearch();

        expect($elem.autocomplete).not.toHaveBeenCalledWith("search", expect.anything());
    });
});

// ---------------------------------------------------------------------------
// doHelpfulSearch — result generation
// ---------------------------------------------------------------------------

describe("SearchController.doHelpfulSearch - result generation", () => {
    let helpfulSearchDivEl;

    beforeEach(() => {
        helpfulSearchDivEl = { style: { display: "" } };
        document.getElementById = jest.fn(id => {
            if (id === "helpfulSearchDiv") return helpfulSearchDivEl;
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
    });

    test("calls makeBlockFromSearch and moveBlock for a known block", () => {
        const block = makeProtoBlock("drum", "drum");
        const activity = makeActivity({ drum: block });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.helpfulSearchWidget.idInput_custom = "drum";
        activity.helpfulSearchWidget.protoblk = block;
        sc.doHelpfulSearch();

        expect(activity.palettes.dict["test-palette"].makeBlockFromSearch).toHaveBeenCalled();
        expect(activity.blocks.moveBlock).toHaveBeenCalledWith(
            42,
            expect.any(Number),
            expect.any(Number)
        );
    });

    test("advances searchBlockPosition after placing a block in helpful search", () => {
        const block = makeProtoBlock("drum", "drum");
        const activity = makeActivity({ drum: block });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();
        sc.searchBlockPosition = [100, 100];

        activity.helpfulSearchWidget.idInput_custom = "drum";
        activity.helpfulSearchWidget.protoblk = block;
        sc.doHelpfulSearch();

        expect(sc.searchBlockPosition[0]).toBe(100 + global.STANDARDBLOCKHEIGHT);
        expect(sc.searchBlockPosition[1]).toBe(100 + global.STANDARDBLOCKHEIGHT);
    });

    test("calls errorMsg for a deprecated block in helpful search", () => {
        const activity = makeActivity({});
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "dummy", value: "dummy", searchTerms: [] }];
        sc.deprecatedBlockNames = ["drum"];

        activity.helpfulSearchWidget.idInput_custom = "drum";
        activity.helpfulSearchWidget.protoblk = { palette: { name: "test-palette" }, name: "drum" };
        sc.doHelpfulSearch();

        expect(activity.errorMsg).toHaveBeenCalledWith("This block is deprecated.");
    });

    test("calls errorMsg when helpful-search block is not found and not deprecated", () => {
        const activity = makeActivity({});
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.helpfulSearchWidget.idInput_custom = "ghost";
        activity.helpfulSearchWidget.protoblk = {
            palette: { name: "test-palette" },
            name: "ghost"
        };
        sc.doHelpfulSearch();

        expect(activity.errorMsg).toHaveBeenCalledWith("Block cannot be found.");
    });
});

// ---------------------------------------------------------------------------
// doHelpfulSearch — autocomplete initialization branches
// ---------------------------------------------------------------------------

describe("SearchController.doHelpfulSearch - autocomplete initialization", () => {
    let $elem;
    let helpfulSearchDivEl;

    beforeEach(() => {
        helpfulSearchDivEl = { style: { display: "" } };
        document.getElementById = jest.fn(id => {
            if (id === "helpfulSearchDiv") return helpfulSearchDivEl;
            return null;
        });
        $elem = makeJQueryElem();
        global.window = global.window || {};
        global.window.jQuery = jest.fn(() => $elem);
    });

    afterEach(() => {
        delete global.window.jQuery;
    });

    test("skips autocomplete setup when already initialised", () => {
        $elem = makeJQueryElem(true);
        global.window.jQuery = jest.fn(() => $elem);

        const activity = makeActivity({ drum: makeProtoBlock("drum", "drum") });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.helpfulSearchWidget.idInput_custom = "drum";
        activity.helpfulSearchWidget.protoblk = makeProtoBlock("drum", "drum");
        sc.doHelpfulSearch();

        expect($elem.autocomplete).not.toHaveBeenCalledWith(
            expect.objectContaining({ source: expect.any(Function) })
        );
    });

    test("source callback filters suggestions by term", () => {
        const activity = makeActivity({ drum: makeProtoBlock("drum", "drum beat") });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.helpfulSearchWidget.idInput_custom = "";
        activity.helpfulSearchWidget.value = "";
        sc.doHelpfulSearch();

        const response = jest.fn();
        $elem.getOpts().source({ term: "drum" }, response);
        expect(response.mock.calls[0][0].some(r => r.value === "drum")).toBe(true);
    });

    test("select callback sets helpfulSearchWidget fields and re-runs doHelpfulSearch", () => {
        const block = makeProtoBlock("drum", "drum beat");
        const activity = makeActivity({ drum: block });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.helpfulSearchWidget.idInput_custom = "";
        activity.helpfulSearchWidget.value = "";
        sc.doHelpfulSearch();

        const event = { preventDefault: jest.fn() };
        const ui = { item: { label: "drum beat", value: "drum", specialDict: block } };
        $elem.getOpts().select(event, ui);

        expect(event.preventDefault).toHaveBeenCalled();
        // The nested doHelpfulSearch() that select triggers places the block and
        // then clears value; idInput_custom is not cleared.
        expect(activity.helpfulSearchWidget.idInput_custom).toBe("drum");
        expect(activity.helpfulSearchWidget.protoblk).toBe(block);
        expect(activity.palettes.dict["test-palette"].makeBlockFromSearch).toHaveBeenCalled();
    });

    test("focus callback calls preventDefault", () => {
        const activity = makeActivity({ drum: makeProtoBlock("drum", "drum") });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.helpfulSearchWidget.idInput_custom = "";
        sc.doHelpfulSearch();

        const event = { preventDefault: jest.fn() };
        $elem.getOpts().focus(event);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    test("triggers autocomplete search when idInput_custom is empty but value is set", () => {
        const activity = makeActivity();
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.helpfulSearchWidget.idInput_custom = "";
        activity.helpfulSearchWidget.value = "drum";
        sc.doHelpfulSearch();

        expect($elem.autocomplete).toHaveBeenCalledWith("search", "drum");
    });

    test("returns without autocomplete search when both helpfulSearch inputs are empty", () => {
        const activity = makeActivity();
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.prepSearchWidget();

        activity.helpfulSearchWidget.idInput_custom = "";
        activity.helpfulSearchWidget.value = "";
        sc.doHelpfulSearch();

        expect($elem.autocomplete).not.toHaveBeenCalledWith("search", expect.anything());
    });
});

// ---------------------------------------------------------------------------
// showHelpfulSearchWidget
// ---------------------------------------------------------------------------

describe("SearchController.showHelpfulSearchWidget", () => {
    let $elem;
    let helpfulWheelDivEl;

    beforeEach(() => {
        helpfulWheelDivEl = { style: { display: "block" } };
        document.getElementById = jest.fn(id => {
            if (id === "helpfulWheelDiv") return helpfulWheelDivEl;
            return null;
        });
        $elem = makeJQueryElem();
        global.window = global.window || {};
        global.window.jQuery = jest.fn(() => $elem);
    });

    afterEach(() => {
        delete global.window.jQuery;
    });

    test("does not activate widget when helpfulSearchDiv is not in display:block", () => {
        const activity = makeActivity();
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.helpfulSearchDiv = { style: { display: "none" } };

        sc.showHelpfulSearchWidget();

        expect(activity.helpfulSearchWidget.style.visibility).toBe("hidden");
    });

    test("silently catches when autocomplete destroy throws", () => {
        $elem.autocomplete = jest.fn(() => {
            throw new Error("not initialized");
        });
        global.window.jQuery = jest.fn(() => $elem);

        const activity = makeActivity();
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.helpfulSearchDiv = { style: { display: "none" } };

        expect(() => sc.showHelpfulSearchWidget()).not.toThrow();
    });

    test("makes helpfulSearchWidget visible and schedules doHelpfulSearch when div is block", () => {
        jest.useFakeTimers();

        const activity = makeActivity({ drum: makeProtoBlock("drum", "drum") });
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.helpfulSearchDiv = { style: { display: "block" } };

        const doHelpfulSearchSpy = jest.spyOn(sc, "doHelpfulSearch").mockImplementation(() => {});

        sc.showHelpfulSearchWidget();

        expect(activity.helpfulSearchWidget.style.visibility).toBe("visible");
        expect(helpfulWheelDivEl.style.display).toBe("none");

        jest.runAllTimers();
        expect(activity.helpfulSearchWidget.focus).toHaveBeenCalled();
        expect(doHelpfulSearchSpy).toHaveBeenCalled();

        jest.useRealTimers();
    });
});

// ---------------------------------------------------------------------------
// _hideHelpfulSearchWidget
// ---------------------------------------------------------------------------

describe("SearchController._hideHelpfulSearchWidget", () => {
    let helpfulWheelDivEl;

    beforeEach(() => {
        helpfulWheelDivEl = { style: { display: "block" } };
        document.getElementById = jest.fn(id => {
            if (id === "helpfulWheelDiv") return helpfulWheelDivEl;
            return null;
        });
    });

    test("sets helpfulWheelDiv display to none when it is visible", () => {
        const activity = makeActivity();
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.helpfulSearchDiv = null;
        helpfulWheelDivEl.style.display = "block";

        sc._hideHelpfulSearchWidget();

        expect(helpfulWheelDivEl.style.display).toBe("none");
        expect(activity.__tick).toHaveBeenCalled();
    });

    test("does not reassign helpfulWheelDiv display when already none", () => {
        const activity = makeActivity();
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.helpfulSearchDiv = null;
        helpfulWheelDivEl.style.display = "none";

        sc._hideHelpfulSearchWidget();

        expect(helpfulWheelDivEl.style.display).toBe("none");
    });

    test("skips removeChild when helpfulSearchDiv has no parentNode", () => {
        const activity = makeActivity();
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.helpfulSearchDiv = { parentNode: null };

        expect(() => sc._hideHelpfulSearchWidget()).not.toThrow();
    });

    test("calls removeChild when helpfulSearchDiv has a parentNode", () => {
        const removeChild = jest.fn();
        const activity = makeActivity();
        setupSearchController(activity);
        const sc = activity.searchController;
        sc.helpfulSearchDiv = { parentNode: { removeChild } };

        sc._hideHelpfulSearchWidget();

        expect(removeChild).toHaveBeenCalledWith(sc.helpfulSearchDiv);
    });
});
