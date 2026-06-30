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
if (typeof global.STANDARDBLOCKHEIGHT === "undefined") {
    global.STANDARDBLOCKHEIGHT = 40;
}

const { setupSearchController, SearchController } = require("../search-controller.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProtoBlock(name, label, deprecated = false, extraSearchTerms = undefined) {
    return {
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
}

function makeSearchUI() {
    return {
        helpfulSearchDiv: null,
        show: jest.fn(),
        hide: jest.fn(),
        focusInput: jest.fn(),
        focusHelpfulInput: jest.fn(),
        showHelpfulInput: jest.fn(),
        setupMainAutocomplete: jest.fn(),
        triggerMainSearch: jest.fn(),
        setupHelpfulAutocomplete: jest.fn(),
        triggerHelpfulSearch: jest.fn(),
        buildHelpfulSearchDiv: jest.fn(() => ({
            closeButton: { id: "crossButton" },
            modeButton: null
        })),
        positionHelpfulSearchDiv: jest.fn(),
        removeHelpfulSearchDiv: jest.fn(),
        hideHelpfulSearchDisplay: jest.fn()
    };
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
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        expect(activity.searchController).toBeInstanceOf(SearchController);
    });

    test("initialises data-layer state to defaults", () => {
        const activity = makeActivity();
        setupSearchController(activity, makeSearchUI());
        const sc = activity.searchController;
        expect(sc.searchSuggestions).toEqual([]);
        expect(sc._searchCache).toEqual({});
        expect(sc.isHelpfulSearchWidgetOn).toBe(false);
        expect(sc.deprecatedBlockNames).toEqual([]);
    });

    test("stores the searchUI reference", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        expect(activity.searchController.searchUI).toBe(ui);
    });
});

// ---------------------------------------------------------------------------
// prepSearchWidget
// ---------------------------------------------------------------------------

describe("SearchController.prepSearchWidget", () => {
    test("skips gracefully when blocks not initialised", () => {
        const activity = makeActivity();
        activity.blocks = null;
        setupSearchController(activity, makeSearchUI());
        expect(() => activity.searchController.prepSearchWidget()).not.toThrow();
        expect(activity.searchController.searchSuggestions).toEqual([]);
    });

    test("builds searchSuggestions from protoBlockDict", () => {
        const activity = makeActivity({
            drum: makeProtoBlock("drum", "drum"),
            pitch: makeProtoBlock("pitch", "pitch")
        });
        setupSearchController(activity, makeSearchUI());
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
        setupSearchController(activity, makeSearchUI());
        activity.searchController.prepSearchWidget();

        const labels = activity.searchController.searchSuggestions.map(s => s.label);
        expect(labels).not.toContain("old block");
        expect(labels).toContain("current block");
        expect(activity.searchController.deprecatedBlockNames).toContain("old block");
    });

    test("adds extraSearchTerms to the searchTerms array", () => {
        const block = makeProtoBlock("note", "note value", false, ["pitch", "tone"]);
        const activity = makeActivity({ note: block });
        setupSearchController(activity, makeSearchUI());
        activity.searchController.prepSearchWidget();

        const suggestion = activity.searchController.searchSuggestions.find(
            s => s.value === "note"
        );
        expect(suggestion.searchTerms).toContain("pitch");
        expect(suggestion.searchTerms).toContain("tone");
    });

    test("resets cache on each call", () => {
        const activity = makeActivity({ drum: makeProtoBlock("drum", "drum") });
        setupSearchController(activity, makeSearchUI());
        const sc = activity.searchController;
        sc._searchCache = { x: [1] };

        sc.prepSearchWidget();

        expect(sc._searchCache).toEqual({});
    });

    test("uses fallback label for known no-label blocks (scaledegree2)", () => {
        const block = makeProtoBlock("scaledegree2", "", false, []);
        const activity = makeActivity({ scaledegree2: block });
        setupSearchController(activity, makeSearchUI());
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
        setupSearchController(activity, makeSearchUI());
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
        expect(sc.filterSuggestions("zzznomatch")).toEqual([]);
    });

    test("caches results and returns cache on second call", () => {
        sc.filterSuggestions("drum");
        expect(sc._searchCache["drum"]).toBeDefined();

        sc.searchSuggestions = [];
        const cached = sc.filterSuggestions("drum");
        expect(cached).toBe(sc._searchCache["drum"]);
    });
});

// ---------------------------------------------------------------------------
// hideSearchWidget
// ---------------------------------------------------------------------------

describe("SearchController.hideSearchWidget", () => {
    test("calls searchUI.hide()", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        activity.searchController.hideSearchWidget();
        expect(ui.hide).toHaveBeenCalled();
    });

    test("removes and clears the stored mousedown close listener", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        const listener = jest.fn();
        sc._searchCloseListener = listener;

        sc.hideSearchWidget();

        expect(activity.removeEventListener).toHaveBeenCalledWith(document, "mousedown", listener);
        expect(sc._searchCloseListener).toBeNull();
    });

    test("does not call removeEventListener when no listener is stored", () => {
        const activity = makeActivity();
        setupSearchController(activity, makeSearchUI());
        activity.searchController.hideSearchWidget();
        expect(activity.removeEventListener).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// showSearchWidget
// ---------------------------------------------------------------------------

describe("SearchController.showSearchWidget", () => {
    test("calls hideSearchWidget when widget is already visible", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        activity.searchWidget.style.visibility = "visible";

        const hideSpy = jest.spyOn(activity.searchController, "hideSearchWidget");
        activity.searchController.showSearchWidget();

        expect(hideSpy).toHaveBeenCalled();
    });

    test("calls searchUI.show() when widget is hidden", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        activity.searchWidget.style.visibility = "hidden";

        activity.searchController.showSearchWidget();

        expect(ui.show).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test("calls prepSearchWidget when showing", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const prepSpy = jest.spyOn(activity.searchController, "prepSearchWidget");

        activity.searchController.showSearchWidget();

        expect(prepSpy).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test("registers a mousedown close listener on document", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        setupSearchController(activity, makeSearchUI());

        activity.searchController.showSearchWidget();

        expect(activity.addEventListener).toHaveBeenCalledWith(
            document,
            "mousedown",
            expect.any(Function)
        );
        jest.useRealTimers();
    });

    test("hides helpful search div first if it is open", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        ui.helpfulSearchDiv = { style: { display: "block" } };
        setupSearchController(activity, ui);

        const hideSpy = jest.spyOn(activity.searchController, "_hideHelpfulSearchWidget");
        activity.searchController.showSearchWidget();

        expect(hideSpy).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// doSearch
// ---------------------------------------------------------------------------

describe("SearchController.doSearch", () => {
    test("returns early without error when searchWidget is null", () => {
        const activity = makeActivity();
        activity.searchWidget = null;
        setupSearchController(activity, makeSearchUI());
        expect(() => activity.searchController.doSearch()).not.toThrow();
    });

    test("calls prepSearchWidget when suggestions list is empty", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [];

        sc.doSearch();

        // prepSearchWidget resets to empty but was called
        expect(sc._searchCache).toEqual({});
    });

    test("calls searchUI.setupMainAutocomplete with callbacks", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", searchTerms: ["drum"] }];

        sc.doSearch();

        expect(ui.setupMainAutocomplete).toHaveBeenCalledWith(
            expect.any(Function),
            expect.any(Function),
            expect.any(Function)
        );
    });

    test("calls searchUI.triggerMainSearch when value is set but idInput_custom is empty", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", searchTerms: ["drum"] }];

        activity.searchWidget.idInput_custom = "";
        activity.searchWidget.value = "drum";
        sc.doSearch();

        expect(ui.triggerMainSearch).toHaveBeenCalledWith("drum");
    });

    test("calls errorMsg for a deprecated block name", () => {
        const activity = makeActivity({});
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
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
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "dummy", value: "dummy", searchTerms: [] }];

        activity.searchWidget.idInput_custom = "ghost";
        activity.searchWidget.protoblk = { palette: { name: "test-palette" }, name: "ghost" };
        sc.doSearch();

        expect(activity.errorMsg).toHaveBeenCalledWith("Block cannot be found.");
    });

    test("calls makeBlockFromSearch and moveBlock for a known block", () => {
        const block = makeProtoBlock("drum", "drum");
        const activity = makeActivity({ drum: block });
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", value: "drum", searchTerms: ["drum"] }];

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
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", value: "drum", searchTerms: ["drum"] }];
        sc.searchBlockPosition = [100, 100];

        activity.searchWidget.idInput_custom = "drum";
        activity.searchWidget.protoblk = block;
        sc.doSearch();

        expect(sc.searchBlockPosition[0]).toBe(100 + global.STANDARDBLOCKHEIGHT);
        expect(sc.searchBlockPosition[1]).toBe(100 + global.STANDARDBLOCKHEIGHT);
    });
});

// ---------------------------------------------------------------------------
// setHelpfulSearchDiv
// ---------------------------------------------------------------------------

describe("SearchController.setHelpfulSearchDiv", () => {
    test("calls searchUI.buildHelpfulSearchDiv()", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);

        activity.searchController.setHelpfulSearchDiv();

        expect(ui.buildHelpfulSearchDiv).toHaveBeenCalled();
    });

    test("wires click listener on the returned closeButton", () => {
        const closeButton = { id: "crossButton" };
        const activity = makeActivity();
        const ui = makeSearchUI();
        ui.buildHelpfulSearchDiv = jest.fn(() => ({ closeButton, modeButton: null }));
        setupSearchController(activity, ui);

        activity.searchController.setHelpfulSearchDiv();

        expect(activity.addEventListener).toHaveBeenCalledWith(
            closeButton,
            "click",
            expect.any(Function)
        );
    });
});

// ---------------------------------------------------------------------------
// _displayHelpfulSearchDiv
// ---------------------------------------------------------------------------

describe("SearchController._displayHelpfulSearchDiv", () => {
    beforeEach(() => {
        document.getElementById = jest.fn(id => {
            if (id === "helpfulSearchDiv") return { style: {} };
            return null;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("calls searchUI.positionHelpfulSearchDiv()", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        ui.helpfulSearchDiv = { style: { display: "block" } };
        setupSearchController(activity, ui);

        activity.searchController._displayHelpfulSearchDiv();

        expect(ui.positionHelpfulSearchDiv).toHaveBeenCalled();
    });

    test("sets isHelpfulSearchWidgetOn to true", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        ui.helpfulSearchDiv = { style: { display: "block" } };
        setupSearchController(activity, ui);

        activity.searchController._displayHelpfulSearchDiv();

        expect(activity.searchController.isHelpfulSearchWidgetOn).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// _hideHelpfulSearchWidget
// ---------------------------------------------------------------------------

describe("SearchController._hideHelpfulSearchWidget", () => {
    test("calls searchUI.removeHelpfulSearchDiv()", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);

        activity.searchController._hideHelpfulSearchWidget();

        expect(ui.removeHelpfulSearchDiv).toHaveBeenCalled();
    });

    test("calls activity.__tick()", () => {
        const activity = makeActivity();
        setupSearchController(activity, makeSearchUI());

        activity.searchController._hideHelpfulSearchWidget();

        expect(activity.__tick).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// showHelpfulSearchWidget
// ---------------------------------------------------------------------------

describe("SearchController.showHelpfulSearchWidget", () => {
    test("does nothing when helpfulSearchDiv is null", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        ui.helpfulSearchDiv = null;
        setupSearchController(activity, ui);

        activity.searchController.showHelpfulSearchWidget();

        expect(ui.showHelpfulInput).not.toHaveBeenCalled();
    });

    test("does nothing when helpfulSearchDiv is not display:block", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        ui.helpfulSearchDiv = { style: { display: "none" } };
        setupSearchController(activity, ui);

        activity.searchController.showHelpfulSearchWidget();

        expect(ui.showHelpfulInput).not.toHaveBeenCalled();
    });

    test("calls searchUI.showHelpfulInput() when div is visible", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        const ui = makeSearchUI();
        ui.helpfulSearchDiv = { style: { display: "block" } };
        setupSearchController(activity, ui);

        activity.searchController.showHelpfulSearchWidget();

        expect(ui.showHelpfulInput).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test("schedules focusHelpfulInput and doHelpfulSearch", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        const ui = makeSearchUI();
        ui.helpfulSearchDiv = { style: { display: "block" } };
        setupSearchController(activity, ui);

        const doSpy = jest
            .spyOn(activity.searchController, "doHelpfulSearch")
            .mockImplementation(() => {});

        activity.searchController.showHelpfulSearchWidget();
        jest.runAllTimers();

        expect(ui.focusHelpfulInput).toHaveBeenCalled();
        expect(doSpy).toHaveBeenCalled();
        jest.useRealTimers();
    });
});

// ---------------------------------------------------------------------------
// doHelpfulSearch
// ---------------------------------------------------------------------------

describe("SearchController.doHelpfulSearch", () => {
    test("calls searchUI.setupHelpfulAutocomplete with callbacks", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", searchTerms: ["drum"] }];

        sc.doHelpfulSearch();

        expect(ui.setupHelpfulAutocomplete).toHaveBeenCalledWith(
            expect.any(Function),
            expect.any(Function)
        );
    });

    test("calls triggerHelpfulSearch when value is set but idInput_custom is empty", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", searchTerms: ["drum"] }];

        activity.helpfulSearchWidget.idInput_custom = "";
        activity.helpfulSearchWidget.value = "drum";
        sc.doHelpfulSearch();

        expect(ui.triggerHelpfulSearch).toHaveBeenCalledWith("drum");
    });

    test("calls makeBlockFromSearch and moveBlock for a known block", () => {
        const block = makeProtoBlock("drum", "drum");
        const activity = makeActivity({ drum: block });
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", value: "drum", searchTerms: ["drum"] }];

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

    test("calls searchUI.hideHelpfulSearchDisplay() after placing a block", () => {
        const block = makeProtoBlock("drum", "drum");
        const activity = makeActivity({ drum: block });
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", value: "drum", searchTerms: ["drum"] }];

        activity.helpfulSearchWidget.idInput_custom = "drum";
        activity.helpfulSearchWidget.protoblk = block;
        sc.doHelpfulSearch();

        expect(ui.hideHelpfulSearchDisplay).toHaveBeenCalled();
    });

    test("calls errorMsg for a deprecated block in helpful search", () => {
        const activity = makeActivity({});
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
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
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "dummy", value: "dummy", searchTerms: [] }];

        activity.helpfulSearchWidget.idInput_custom = "ghost";
        activity.helpfulSearchWidget.protoblk = {
            palette: { name: "test-palette" },
            name: "ghost"
        };
        sc.doHelpfulSearch();

        expect(activity.errorMsg).toHaveBeenCalledWith("Block cannot be found.");
    });
});
