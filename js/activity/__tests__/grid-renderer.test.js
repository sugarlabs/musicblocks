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

// ---------------------------------------------------------------------------
// Global mocks required by grid-renderer.js
// ---------------------------------------------------------------------------

global.SHARP = "♯";
global.FLAT = "♭";
global.debugLog = jest.fn();

// buildScale returns an array where [0] is the scale note array.
// Default: C major (no sharps/flats)
global.buildScale = jest.fn(() => [["C", "D", "E", "F", "G", "A", "B"]]);

// Mock createjs.ColorFilter used by _applyThemeFilter
global.createjs = {
    ColorFilter: jest.fn(function (rMul, gMul, bMul, aMul, rAdd, gAdd, bAdd) {
        this.rMul = rMul;
        this.gMul = gMul;
        this.bMul = bMul;
        this.aMul = aMul;
        this.rAdd = rAdd;
        this.gAdd = gAdd;
        this.bAdd = bAdd;
    })
};

const { setupGridRenderer, GridRenderer } = require("../grid-renderer.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a mock bitmap with the properties GridRenderer reads/writes. */
function makeBitmap() {
    return {
        visible: false,
        x: 0,
        filters: [],
        cache: jest.fn(),
        uncache: jest.fn()
    };
}

/** Create an array of 7 mock bitmaps for accidental sharps/flats. */
function makeAccidentalBitmaps() {
    return Array.from({ length: 7 }, () => makeBitmap());
}

/**
 * Build a minimal activity mock containing all bitmap properties
 * that GridRenderer accesses.
 */
function makeActivity() {
    return {
        update: false,
        canvas: { width: 2400 },
        turtleBlocksScale: 1,
        KeySignatureEnv: ["C", "major"],

        // Cartesian / Polar
        cartesianBitmap: makeBitmap(),
        polarBitmap: makeBitmap(),

        // Staff bitmaps
        trebleBitmap: makeBitmap(),
        grandBitmap: makeBitmap(),
        sopranoBitmap: makeBitmap(),
        altoBitmap: makeBitmap(),
        tenorBitmap: makeBitmap(),
        bassBitmap: makeBitmap(),

        // Accidental bitmaps (sharps & flats for each staff)
        trebleSharpBitmap: makeAccidentalBitmaps(),
        trebleFlatBitmap: makeAccidentalBitmaps(),
        grandSharpBitmap: makeAccidentalBitmaps(),
        grandFlatBitmap: makeAccidentalBitmaps(),
        sopranoSharpBitmap: makeAccidentalBitmaps(),
        sopranoFlatBitmap: makeAccidentalBitmaps(),
        altoSharpBitmap: makeAccidentalBitmaps(),
        altoFlatBitmap: makeAccidentalBitmaps(),
        tenorSharpBitmap: makeAccidentalBitmaps(),
        tenorFlatBitmap: makeAccidentalBitmaps(),
        bassSharpBitmap: makeAccidentalBitmaps(),
        bassFlatBitmap: makeAccidentalBitmaps()
    };
}

// ---------------------------------------------------------------------------
// Reset memoised SHARPS/FLATS between tests so lazy init is re-tested
// ---------------------------------------------------------------------------

beforeEach(() => {
    jest.clearAllMocks();
    document.body.className = "";
    // Reset buildScale to C major default
    global.buildScale.mockReturnValue([["C", "D", "E", "F", "G", "A", "B"]]);
});

// ===========================================================================
// setupGridRenderer
// ===========================================================================

describe("setupGridRenderer", () => {
    test("attaches gridRenderer instance to activity", () => {
        const activity = makeActivity();
        setupGridRenderer(activity);

        expect(activity.gridRenderer).toBeInstanceOf(GridRenderer);
    });

    test("wires all _show/_hide methods on the activity", () => {
        const activity = makeActivity();
        setupGridRenderer(activity);

        const expectedMethods = [
            "_hideCartesian",
            "_showCartesian",
            "_hidePolar",
            "_showPolar",
            "_hideAccidentals",
            "_hideTreble",
            "_showTreble",
            "_hideGrand",
            "_showGrand",
            "_hideSoprano",
            "_showSoprano",
            "_hideAlto",
            "_showAlto",
            "_hideTenor",
            "_showTenor",
            "_hideBass",
            "_showBass"
        ];

        for (const method of expectedMethods) {
            expect(typeof activity[method]).toBe("function");
        }
    });
});

// ===========================================================================
// Cartesian grid
// ===========================================================================

describe("Cartesian grid", () => {
    test("showCartesian sets bitmap visible and caches it", () => {
        const activity = makeActivity();
        const renderer = new GridRenderer(activity);

        renderer.showCartesian();

        expect(activity.cartesianBitmap.visible).toBe(true);
        expect(activity.cartesianBitmap.cache).toHaveBeenCalledWith(0, 0, 1200, 900);
        expect(activity.update).toBe(true);
    });

    test("hideCartesian sets bitmap invisible and uncaches", () => {
        const activity = makeActivity();
        const renderer = new GridRenderer(activity);
        activity.cartesianBitmap.visible = true;

        renderer.hideCartesian();

        expect(activity.cartesianBitmap.visible).toBe(false);
        expect(activity.cartesianBitmap.uncache).toHaveBeenCalled();
        expect(activity.update).toBe(true);
    });
});

// ===========================================================================
// Polar grid
// ===========================================================================

describe("Polar grid", () => {
    test("showPolar sets bitmap visible and caches it", () => {
        const activity = makeActivity();
        const renderer = new GridRenderer(activity);

        renderer.showPolar();

        expect(activity.polarBitmap.visible).toBe(true);
        expect(activity.polarBitmap.cache).toHaveBeenCalledWith(0, 0, 1200, 900);
        expect(activity.update).toBe(true);
    });

    test("hidePolar sets bitmap invisible and uncaches", () => {
        const activity = makeActivity();
        const renderer = new GridRenderer(activity);
        activity.polarBitmap.visible = true;

        renderer.hidePolar();

        expect(activity.polarBitmap.visible).toBe(false);
        expect(activity.polarBitmap.uncache).toHaveBeenCalled();
        expect(activity.update).toBe(true);
    });
});

// ===========================================================================
// _applyThemeFilter
// ===========================================================================

describe("_applyThemeFilter", () => {
    test("applies invert filter in dark mode", () => {
        document.body.classList.add("dark");
        const activity = makeActivity();
        const renderer = new GridRenderer(activity);
        const bitmap = makeBitmap();

        renderer._applyThemeFilter(bitmap);

        expect(createjs.ColorFilter).toHaveBeenCalledWith(-1, -1, -1, 1, 255, 255, 255);
        expect(bitmap.filters).toHaveLength(1);
        expect(bitmap.cache).toHaveBeenCalledWith(0, 0, 1200, 900);
    });

    test("applies invert filter in high-contrast mode", () => {
        document.body.classList.add("highcontrast");
        const activity = makeActivity();
        const renderer = new GridRenderer(activity);
        const bitmap = makeBitmap();

        renderer._applyThemeFilter(bitmap);

        expect(createjs.ColorFilter).toHaveBeenCalled();
        expect(bitmap.filters).toHaveLength(1);
    });

    test("clears filters in light mode (no dark/highcontrast class)", () => {
        const activity = makeActivity();
        const renderer = new GridRenderer(activity);
        const bitmap = makeBitmap();
        bitmap.filters = ["existing-filter"];

        renderer._applyThemeFilter(bitmap);

        expect(bitmap.filters).toEqual([]);
        expect(bitmap.cache).toHaveBeenCalledWith(0, 0, 1200, 900);
    });
});

// ===========================================================================
// hideAccidentals
// ===========================================================================

describe("hideAccidentals", () => {
    test("hides all accidental bitmaps and resets x positions", () => {
        const activity = makeActivity();
        const renderer = new GridRenderer(activity);

        // Mark some accidentals as visible first
        activity.trebleSharpBitmap[0].visible = true;
        activity.grandFlatBitmap[3].visible = true;

        renderer.hideAccidentals();

        const expectedX = activity.canvas.width / (2 * activity.turtleBlocksScale) - 600;

        // Check all staff types
        const staffTypes = ["grand", "treble", "soprano", "alto", "tenor", "bass"];
        for (const staff of staffTypes) {
            for (let i = 0; i < 7; i++) {
                expect(activity[staff + "SharpBitmap"][i].visible).toBe(false);
                expect(activity[staff + "SharpBitmap"][i].x).toBe(expectedX);
                expect(activity[staff + "FlatBitmap"][i].visible).toBe(false);
                expect(activity[staff + "FlatBitmap"][i].x).toBe(expectedX);
            }
        }
    });
});

// ===========================================================================
// Staff show/hide methods (treble, grand, soprano, alto, tenor, bass)
// ===========================================================================

describe.each([
    ["Treble", "treble"],
    ["Grand", "grand"],
    ["Soprano", "soprano"],
    ["Alto", "alto"],
    ["Tenor", "tenor"],
    ["Bass", "bass"]
])("%s staff", (_label, staffName) => {
    test(`show${_label} sets bitmap visible, applies theme filter, and calls buildScale`, () => {
        const activity = makeActivity();
        const renderer = new GridRenderer(activity);

        renderer["show" + _label]();

        expect(activity[staffName + "Bitmap"].visible).toBe(true);
        expect(activity[staffName + "Bitmap"].cache).toHaveBeenCalled();
        expect(global.buildScale).toHaveBeenCalledWith("C major");
        expect(activity.update).toBe(true);
    });

    test(`hide${_label} sets bitmap invisible, uncaches, and hides accidentals`, () => {
        const activity = makeActivity();
        const renderer = new GridRenderer(activity);
        activity[staffName + "Bitmap"].visible = true;

        // Pre-set some accidentals visible to verify hideAccidentals delegation
        activity[staffName + "SharpBitmap"][0].visible = true;
        activity[staffName + "FlatBitmap"][0].visible = true;

        renderer["hide" + _label]();

        expect(activity[staffName + "Bitmap"].visible).toBe(false);
        expect(activity[staffName + "Bitmap"].uncache).toHaveBeenCalled();
        // Verify hideAccidentals was called (delegation check)
        expect(activity[staffName + "SharpBitmap"][0].visible).toBe(false);
        expect(activity[staffName + "FlatBitmap"][0].visible).toBe(false);
        expect(activity.update).toBe(true);
    });
});

// ===========================================================================
// _showStaff — accidental display with sharps/flats in scale
// ===========================================================================

describe("_showStaff accidental handling", () => {
    test("displays sharp accidentals when scale contains sharps", () => {
        // G major has F♯
        global.buildScale.mockReturnValue([["G", "A", "B", "C", "D", "E", "F♯"]]);

        const activity = makeActivity();
        const renderer = new GridRenderer(activity);

        // Pre-set to verify the code actually changes visibility
        activity.trebleSharpBitmap[1].visible = true;

        renderer.showTreble();

        // F♯ is the first sharp in the sharps order, so trebleSharpBitmap[0]
        expect(activity.trebleSharpBitmap[0].visible).toBe(true);
        // Other sharps should be hidden (hideAccidentals resets them)
        expect(activity.trebleSharpBitmap[1].visible).toBe(false);
    });

    test("displays flat accidentals when scale contains flats", () => {
        // F major has B♭
        global.buildScale.mockReturnValue([["F", "G", "A", "B♭", "C", "D", "E"]]);

        const activity = makeActivity();
        const renderer = new GridRenderer(activity);

        // Pre-set to verify the code actually changes visibility
        activity.grandFlatBitmap[1].visible = true;

        renderer.showGrand();

        // B♭ is the first flat in the flats order, so grandFlatBitmap[0]
        expect(activity.grandFlatBitmap[0].visible).toBe(true);
        // Other flats should be hidden (hideAccidentals resets them)
        expect(activity.grandFlatBitmap[1].visible).toBe(false);
    });

    test("accidentals x positions are spaced by 15px increments", () => {
        // D major has F♯ and C♯
        global.buildScale.mockReturnValue([["D", "E", "F♯", "G", "A", "B", "C♯"]]);

        const activity = makeActivity();
        const renderer = new GridRenderer(activity);
        const baseX = activity.canvas.width / (2 * activity.turtleBlocksScale) - 600;

        renderer.showTreble();

        // F♯ (index 0): x += 0 from base, then dx becomes 15
        expect(activity.trebleSharpBitmap[0].x).toBe(baseX + 0);
        // C♯ (index 1): x += 15, then dx becomes 30
        expect(activity.trebleSharpBitmap[1].x).toBe(baseX + 15);
    });

    test("no accidentals shown for C major (no sharps/flats)", () => {
        global.buildScale.mockReturnValue([["C", "D", "E", "F", "G", "A", "B"]]);

        const activity = makeActivity();
        const renderer = new GridRenderer(activity);

        // Pre-set all accidentals visible to prove they get hidden
        for (let i = 0; i < 7; i++) {
            activity.trebleSharpBitmap[i].visible = true;
            activity.trebleFlatBitmap[i].visible = true;
        }

        renderer.showTreble();

        for (let i = 0; i < 7; i++) {
            expect(activity.trebleSharpBitmap[i].visible).toBe(false);
            expect(activity.trebleFlatBitmap[i].visible).toBe(false);
        }
    });

    test("uses KeySignatureEnv from activity to build scale", () => {
        const activity = makeActivity();
        activity.KeySignatureEnv = ["G", "major"];
        const renderer = new GridRenderer(activity);

        renderer.showTreble();

        expect(global.buildScale).toHaveBeenCalledWith("G major");
    });
});

// ===========================================================================
// _requestUpdate
// ===========================================================================

describe("_requestUpdate", () => {
    test("sets activity.update to true", () => {
        const activity = makeActivity();
        const renderer = new GridRenderer(activity);

        expect(activity.update).toBe(false);
        renderer._requestUpdate();
        expect(activity.update).toBe(true);
    });
});

// ===========================================================================
// setupGridRenderer wiring delegates to renderer methods
// ===========================================================================

describe("setupGridRenderer delegation", () => {
    test("activity._hideCartesian delegates to renderer.hideCartesian", () => {
        const activity = makeActivity();
        setupGridRenderer(activity);

        activity._hideCartesian();

        expect(activity.cartesianBitmap.visible).toBe(false);
        expect(activity.cartesianBitmap.uncache).toHaveBeenCalled();
    });

    test("activity._showCartesian delegates to renderer.showCartesian", () => {
        const activity = makeActivity();
        setupGridRenderer(activity);

        activity._showCartesian();

        expect(activity.cartesianBitmap.visible).toBe(true);
        expect(activity.cartesianBitmap.cache).toHaveBeenCalled();
    });

    test("activity._hideAccidentals delegates and requests update", () => {
        const activity = makeActivity();
        setupGridRenderer(activity);

        activity._hideAccidentals();

        // All accidentals should be hidden
        expect(activity.trebleSharpBitmap[0].visible).toBe(false);
        // update should be set
        expect(activity.update).toBe(true);
    });
});
