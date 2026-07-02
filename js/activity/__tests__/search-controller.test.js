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

function makeSearchUI({ visible = false, helpfulVisible = false } = {}) {
    return {
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
        hideHelpfulSearchDisplay: jest.fn(),
        isVisible: jest.fn(() => visible),
        isHelpfulSearchVisible: jest.fn(() => helpfulVisible),
        get isHelpfulSearchWidgetOn() {
            return this.isHelpfulSearchVisible();
        },
        isHelpfulSearchDivMounted: jest.fn(() => false),
        containsMainSearchTarget: jest.fn(() => false)
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

    const noLabelCases = [
        ["voicename", "voice name"],
        ["notename", "note name"],
        ["drumname", "drum name"],
        ["loadFile", "load file"],
        ["invertmode", "invert mode"],
        ["modename", "mode name"],
        ["filtertype", "filter type"],
        ["audiofile", "audio file"],
        ["outputtools", "output tools"],
        ["customNote", "custom note"],
        ["accidentalname", "accidental name"],
        ["eastindiansolfege", "east indian solfege"],
        ["temperamentname", "temperament name"],
        ["chordname", "chord name"],
        ["intervalname", "interval name"],
        ["oscillatortype", "oscillator type"],
        ["noisename", "noise name"],
        ["effectsname", "effects name"],
        ["wrapmode", "wrap mode"]
    ];

    test.each(noLabelCases)(
        "uses fallback label for no-label block '%s' → '%s'",
        (blockName, expectedLabel) => {
            const block = makeProtoBlock(blockName, "", false, []);
            const activity = makeActivity({ [blockName]: block });
            setupSearchController(activity, makeSearchUI());
            activity.searchController.prepSearchWidget();

            const suggestion = activity.searchController.searchSuggestions.find(
                s => s.value === blockName
            );
            expect(suggestion.label).toBe(expectedLabel);
        }
    );
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

    test("falls back to label match when item has no searchTerms array", () => {
        sc.searchSuggestions = [{ label: "drum beat", value: "drum" }];
        const results = sc.filterSuggestions("drum");
        expect(results.some(r => r.value === "drum")).toBe(true);

        const noResults = sc.filterSuggestions("piano");
        expect(noResults.length).toBe(0);
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
    test("calls hideSearchWidget when searchUI.isVisible() returns true", () => {
        const activity = makeActivity();
        const ui = makeSearchUI({ visible: true });
        setupSearchController(activity, ui);

        const hideSpy = jest.spyOn(activity.searchController, "hideSearchWidget");
        activity.searchController.showSearchWidget();

        expect(hideSpy).toHaveBeenCalled();
    });

    test("calls searchUI.show() when searchUI.isVisible() returns false", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        const ui = makeSearchUI({ visible: false });
        setupSearchController(activity, ui);

        activity.searchController.showSearchWidget();

        expect(ui.show).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test("calls prepSearchWidget when showing", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        setupSearchController(activity, makeSearchUI({ visible: false }));
        const prepSpy = jest.spyOn(activity.searchController, "prepSearchWidget");

        activity.searchController.showSearchWidget();

        expect(prepSpy).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test("registers a mousedown close listener on document", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        setupSearchController(activity, makeSearchUI({ visible: false }));

        activity.searchController.showSearchWidget();

        expect(activity.addEventListener).toHaveBeenCalledWith(
            document,
            "mousedown",
            expect.any(Function)
        );
        jest.useRealTimers();
    });

    test("close listener calls hideSearchWidget when containsMainSearchTarget returns false", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        const ui = makeSearchUI({ visible: false });
        ui.containsMainSearchTarget = jest.fn(() => false);
        setupSearchController(activity, ui);

        activity.searchController.showSearchWidget();

        const closeListener = activity.addEventListener.mock.calls.find(
            c => c[1] === "mousedown"
        )[2];
        const hideSpy = jest.spyOn(activity.searchController, "hideSearchWidget");
        closeListener({ target: document.body });

        expect(hideSpy).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test("close listener does NOT call hideSearchWidget when containsMainSearchTarget returns true", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        const ui = makeSearchUI({ visible: false });
        ui.containsMainSearchTarget = jest.fn(() => true);
        setupSearchController(activity, ui);

        activity.searchController.showSearchWidget();

        const closeListener = activity.addEventListener.mock.calls.find(
            c => c[1] === "mousedown"
        )[2];
        const hideSpy = jest.spyOn(activity.searchController, "hideSearchWidget");
        closeListener({ target: document.body });

        expect(hideSpy).not.toHaveBeenCalled();
        jest.useRealTimers();
    });

    test("calls _hideHelpfulSearchWidget first when searchUI.isHelpfulSearchVisible() is true", () => {
        const activity = makeActivity();
        const ui = makeSearchUI({ helpfulVisible: true });
        setupSearchController(activity, ui);

        const hideSpy = jest.spyOn(activity.searchController, "_hideHelpfulSearchWidget");
        activity.searchController.showSearchWidget();

        expect(hideSpy).toHaveBeenCalled();
    });

    test("setTimeout fires focusInput and doSearch", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        const ui = makeSearchUI({ visible: false });
        setupSearchController(activity, ui);
        const doSpy = jest
            .spyOn(activity.searchController, "doSearch")
            .mockImplementation(() => {});

        activity.searchController.showSearchWidget();
        jest.runAllTimers();

        expect(ui.focusInput).toHaveBeenCalled();
        expect(doSpy).toHaveBeenCalled();
        jest.useRealTimers();
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

    test("select callback sets widget fields before triggering recursive doSearch", () => {
        const block = makeProtoBlock("drum", "drum");
        const activity = makeActivity({ drum: block });
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", value: "drum", searchTerms: ["drum"] }];

        sc.doSearch();

        // Prevent the recursive doSearch from resetting widget values
        const recurseSpy = jest.spyOn(sc, "doSearch").mockImplementation(() => {});

        const selectCb = ui.setupMainAutocomplete.mock.calls[0][1];
        const item = { label: "drum", value: "drum", specialDict: block };
        selectCb(item, 0);

        expect(activity.searchWidget.value).toBe("drum");
        expect(activity.searchWidget.idInput_custom).toBe("drum");
        expect(activity.searchWidget.protoblk).toBe(block);
        expect(recurseSpy).toHaveBeenCalled();
    });

    test("select callback with keyCode 13 sets searchWidget visibility to visible", () => {
        const block = makeProtoBlock("drum", "drum");
        const activity = makeActivity({ drum: block });
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", value: "drum", searchTerms: ["drum"] }];

        sc.doSearch();

        // Prevent the recursive doSearch from interfering
        jest.spyOn(sc, "doSearch").mockImplementation(() => {});

        const selectCb = ui.setupMainAutocomplete.mock.calls[0][1];
        selectCb({ label: "drum", value: "drum", specialDict: block }, 13);

        expect(activity.searchWidget.style.visibility).toBe("visible");
    });

    test("source function passed to setupMainAutocomplete delegates to filterSuggestions", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", value: "drum", searchTerms: ["drum"] }];

        sc.doSearch();

        const sourceFn = ui.setupMainAutocomplete.mock.calls[0][0];
        const results = sourceFn({ term: "drum" });
        expect(Array.isArray(results)).toBe(true);
    });

    test("drop callback passed to setupMainAutocomplete calls makeBlockFromSearch", () => {
        const block = makeProtoBlock("drum", "drum");
        const activity = makeActivity({ drum: block });
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", value: "drum", searchTerms: ["drum"] }];

        sc.doSearch();

        const dropCb = ui.setupMainAutocomplete.mock.calls[0][2];
        dropCb(block, 150, 250);

        expect(activity.palettes.dict["test-palette"].makeBlockFromSearch).toHaveBeenCalled();
        expect(activity.blocks.moveBlock).toHaveBeenCalledWith(
            42,
            expect.any(Number),
            expect.any(Number)
        );
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

    test("wires click listener on modeButton when it is returned", () => {
        const closeButton = { id: "crossButton" };
        const modeButton = { id: "begIconText" };
        const activity = makeActivity();
        const ui = makeSearchUI();
        ui.buildHelpfulSearchDiv = jest.fn(() => ({ closeButton, modeButton }));
        setupSearchController(activity, ui);

        activity.searchController.setHelpfulSearchDiv();

        expect(activity.addEventListener).toHaveBeenCalledWith(
            modeButton,
            "click",
            expect.any(Function)
        );
    });
});

// ---------------------------------------------------------------------------
// _displayHelpfulSearchDiv
// ---------------------------------------------------------------------------

describe("SearchController._displayHelpfulSearchDiv", () => {
    test("calls searchUI.positionHelpfulSearchDiv()", () => {
        const activity = makeActivity();
        const ui = makeSearchUI({ helpfulVisible: true });
        ui.isHelpfulSearchDivMounted = jest.fn(() => true);
        setupSearchController(activity, ui);

        activity.searchController._displayHelpfulSearchDiv();

        expect(ui.positionHelpfulSearchDiv).toHaveBeenCalled();
    });

    test("calls setHelpfulSearchDiv when overlay is not mounted", () => {
        const activity = makeActivity();
        const ui = makeSearchUI({ helpfulVisible: true });
        ui.isHelpfulSearchDivMounted = jest.fn(() => false);
        setupSearchController(activity, ui);

        const setSpy = jest.spyOn(activity.searchController, "setHelpfulSearchDiv");
        activity.searchController._displayHelpfulSearchDiv();

        expect(setSpy).toHaveBeenCalled();
    });

    test("does not call setHelpfulSearchDiv when overlay is already mounted", () => {
        const activity = makeActivity();
        const ui = makeSearchUI({ helpfulVisible: true });
        ui.isHelpfulSearchDivMounted = jest.fn(() => true);
        setupSearchController(activity, ui);

        const setSpy = jest.spyOn(activity.searchController, "setHelpfulSearchDiv");
        activity.searchController._displayHelpfulSearchDiv();

        expect(setSpy).not.toHaveBeenCalled();
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
    test("does nothing when searchUI.isHelpfulSearchVisible() returns false", () => {
        const activity = makeActivity();
        const ui = makeSearchUI({ helpfulVisible: false });
        setupSearchController(activity, ui);

        activity.searchController.showHelpfulSearchWidget();

        expect(ui.showHelpfulInput).not.toHaveBeenCalled();
    });

    test("calls searchUI.showHelpfulInput() when isHelpfulSearchVisible() returns true", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        const ui = makeSearchUI({ helpfulVisible: true });
        setupSearchController(activity, ui);

        activity.searchController.showHelpfulSearchWidget();

        expect(ui.showHelpfulInput).toHaveBeenCalled();
        jest.useRealTimers();
    });

    test("schedules focusHelpfulInput and doHelpfulSearch", () => {
        jest.useFakeTimers();
        const activity = makeActivity();
        const ui = makeSearchUI({ helpfulVisible: true });
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

    test("calls prepSearchWidget when suggestions list is empty", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        const prepSpy = jest.spyOn(sc, "prepSearchWidget");

        sc.doHelpfulSearch();

        expect(prepSpy).toHaveBeenCalled();
    });

    test("source function passed to setupHelpfulAutocomplete delegates to filterSuggestions", () => {
        const activity = makeActivity();
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", value: "drum", searchTerms: ["drum"] }];

        sc.doHelpfulSearch();

        const sourceFn = ui.setupHelpfulAutocomplete.mock.calls[0][0];
        const results = sourceFn({ term: "drum" });
        expect(Array.isArray(results)).toBe(true);
    });

    test("select callback sets helpfulSearchWidget fields before recursive doHelpfulSearch", () => {
        const block = makeProtoBlock("drum", "drum");
        const activity = makeActivity({ drum: block });
        const ui = makeSearchUI();
        setupSearchController(activity, ui);
        const sc = activity.searchController;
        sc.searchSuggestions = [{ label: "drum", value: "drum", searchTerms: ["drum"] }];

        sc.doHelpfulSearch();

        // Prevent recursive doHelpfulSearch from resetting widget values
        const recurseSpy = jest.spyOn(sc, "doHelpfulSearch").mockImplementation(() => {});

        const selectCb = ui.setupHelpfulAutocomplete.mock.calls[0][1];
        const item = { label: "drum", value: "drum", specialDict: block };
        selectCb(item);

        expect(activity.helpfulSearchWidget.value).toBe("drum");
        expect(activity.helpfulSearchWidget.idInput_custom).toBe("drum");
        expect(activity.helpfulSearchWidget.protoblk).toBe(block);
        expect(recurseSpy).toHaveBeenCalled();
    });
});
