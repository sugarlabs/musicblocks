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

const { setupPaletteLoader, PaletteLoader } = require("../palette-loader.js");

// ---------------------------------------------------------------------------
// Globals required by palette-loader.js in the Node/Jest environment
// ---------------------------------------------------------------------------

global.PALETTEFILLCOLORS = {};
global.PALETTESTROKECOLORS = {};
global.PALETTEHIGHLIGHTCOLORS = {};
global.HIGHLIGHTSTROKECOLORS = {};

global.platformColor = {
    paletteColors: {
        rhythm: ["#ff0000", "#cc0000", "#ff3333"],
        pitch: ["#00ff00", "#00cc00", "#33ff33"],
        tone: ["#0000ff", "#0000cc", "#3333ff"]
    }
};

global.initBasicProtoBlocks = jest.fn();

global.docById = jest.fn(id => {
    if (id === "palette") {
        return { style: { top: "" } };
    }
    return null;
});

global.ErrorHandler = {
    capture: jest.fn()
};

global._ = s => s;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeActivity(overrides = {}) {
    return Object.assign(
        {
            palettes: {
                dict: {},
                top: 0,
                hide: jest.fn(),
                reinitialize: jest.fn(),
                updatePalettes: jest.fn()
            },
            blocks: {
                updateBlockPositions: jest.fn()
            },
            refreshCanvas: jest.fn(),
            errorMsg: jest.fn()
        },
        overrides
    );
}

// ---------------------------------------------------------------------------
// setupPaletteLoader
// ---------------------------------------------------------------------------

describe("setupPaletteLoader", () => {
    test("attaches a PaletteLoader instance to activity", () => {
        const activity = makeActivity();
        setupPaletteLoader(activity);

        expect(activity.paletteLoader).toBeInstanceOf(PaletteLoader);
    });

    test("stores the activity reference inside the loader", () => {
        const activity = makeActivity();
        setupPaletteLoader(activity);

        expect(activity.paletteLoader.activity).toBe(activity);
    });

    test("only adds paletteLoader to activity", () => {
        const activity = makeActivity();
        const keysBefore = new Set(Object.keys(activity));
        setupPaletteLoader(activity);
        const newKeys = Object.keys(activity).filter(k => !keysBefore.has(k));

        expect(newKeys).toEqual(["paletteLoader"]);
    });
});

// ---------------------------------------------------------------------------
// PaletteLoader.initializePaletteColors
// ---------------------------------------------------------------------------

describe("PaletteLoader.initializePaletteColors", () => {
    let loader;

    beforeEach(() => {
        global.PALETTEFILLCOLORS = {};
        global.PALETTESTROKECOLORS = {};
        global.PALETTEHIGHLIGHTCOLORS = {};
        global.HIGHLIGHTSTROKECOLORS = {};

        loader = new PaletteLoader(makeActivity());
    });

    test("populates PALETTEFILLCOLORS from index 0 of each entry", () => {
        loader.initializePaletteColors();

        expect(PALETTEFILLCOLORS["rhythm"]).toBe("#ff0000");
        expect(PALETTEFILLCOLORS["pitch"]).toBe("#00ff00");
        expect(PALETTEFILLCOLORS["tone"]).toBe("#0000ff");
    });

    test("populates PALETTESTROKECOLORS from index 1 of each entry", () => {
        loader.initializePaletteColors();

        expect(PALETTESTROKECOLORS["rhythm"]).toBe("#cc0000");
        expect(PALETTESTROKECOLORS["pitch"]).toBe("#00cc00");
        expect(PALETTESTROKECOLORS["tone"]).toBe("#0000cc");
    });

    test("populates PALETTEHIGHLIGHTCOLORS from index 2 of each entry", () => {
        loader.initializePaletteColors();

        expect(PALETTEHIGHLIGHTCOLORS["rhythm"]).toBe("#ff3333");
        expect(PALETTEHIGHLIGHTCOLORS["pitch"]).toBe("#33ff33");
        expect(PALETTEHIGHLIGHTCOLORS["tone"]).toBe("#3333ff");
    });

    test("populates HIGHLIGHTSTROKECOLORS from index 1 (same as stroke)", () => {
        loader.initializePaletteColors();

        expect(HIGHLIGHTSTROKECOLORS["rhythm"]).toBe("#cc0000");
        expect(HIGHLIGHTSTROKECOLORS["pitch"]).toBe("#00cc00");
        expect(HIGHLIGHTSTROKECOLORS["tone"]).toBe("#0000cc");
    });

    test("handles empty paletteColors without error", () => {
        global.platformColor = { paletteColors: {} };

        expect(() => loader.initializePaletteColors()).not.toThrow();
        expect(Object.keys(PALETTEFILLCOLORS)).toHaveLength(0);

        global.platformColor = {
            paletteColors: {
                rhythm: ["#ff0000", "#cc0000", "#ff3333"],
                pitch: ["#00ff00", "#00cc00", "#33ff33"],
                tone: ["#0000ff", "#0000cc", "#3333ff"]
            }
        };
    });

    test("overwrites existing entries on repeated calls", () => {
        loader.initializePaletteColors();

        global.platformColor = {
            paletteColors: { rhythm: ["#111111", "#222222", "#333333"] }
        };
        loader.initializePaletteColors();

        expect(PALETTEFILLCOLORS["rhythm"]).toBe("#111111");

        global.platformColor = {
            paletteColors: {
                rhythm: ["#ff0000", "#cc0000", "#ff3333"],
                pitch: ["#00ff00", "#00cc00", "#33ff33"],
                tone: ["#0000ff", "#0000cc", "#3333ff"]
            }
        };
    });
});

// ---------------------------------------------------------------------------
// PaletteLoader.regeneratePalettes
// ---------------------------------------------------------------------------

describe("PaletteLoader.regeneratePalettes", () => {
    let loader;
    let activity;

    beforeEach(() => {
        jest.clearAllMocks();
        global.initBasicProtoBlocks.mockClear();
        global.ErrorHandler.capture.mockClear();
        global.docById.mockReturnValue({ style: { top: "" } });

        activity = makeActivity();
        loader = new PaletteLoader(activity);
    });

    test("hides and reinitializes palettes in the happy path", () => {
        loader.regeneratePalettes();

        expect(activity.palettes.hide).toHaveBeenCalledTimes(1);
        expect(activity.palettes.reinitialize).toHaveBeenCalledWith(activity.palettes);
    });

    test("sets palette element top style from palettes.top", () => {
        activity.palettes.top = 40;
        const el = { style: { top: "" } };
        global.docById.mockReturnValue(el);

        loader.regeneratePalettes();

        expect(el.style.top).toBe("100px");
    });

    test("calls initBasicProtoBlocks when blocks exist", () => {
        loader.regeneratePalettes();

        expect(global.initBasicProtoBlocks).toHaveBeenCalledWith(activity);
    });

    test("skips initBasicProtoBlocks when blocks is null", () => {
        activity.blocks = null;
        loader.regeneratePalettes();

        expect(global.initBasicProtoBlocks).not.toHaveBeenCalled();
    });

    test("calls updatePalettes after reinitializing", () => {
        loader.regeneratePalettes();

        expect(activity.palettes.updatePalettes).toHaveBeenCalledTimes(1);
    });

    test("calls updateBlockPositions when available", () => {
        loader.regeneratePalettes();

        expect(activity.blocks.updateBlockPositions).toHaveBeenCalledTimes(1);
    });

    test("skips updateBlockPositions when method is absent", () => {
        delete activity.blocks.updateBlockPositions;
        expect(() => loader.regeneratePalettes()).not.toThrow();
    });

    test("calls refreshCanvas", () => {
        loader.regeneratePalettes();

        expect(activity.refreshCanvas).toHaveBeenCalledTimes(1);
    });

    test("returns early and warns when palettes is null", () => {
        activity.palettes = null;
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

        loader.regeneratePalettes();

        expect(warnSpy).toHaveBeenCalledWith("Palettes object not initialized");
        expect(global.initBasicProtoBlocks).not.toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    test("warns but continues when palettes.hide is not a function", () => {
        activity.palettes.hide = undefined;
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

        loader.regeneratePalettes();

        expect(warnSpy).toHaveBeenCalledWith("Palettes hide method not available");
        expect(activity.palettes.reinitialize).toHaveBeenCalled();
        warnSpy.mockRestore();
    });

    test("restores x/y coordinates of palette containers", () => {
        const container = { x: 0, y: 0 };
        const palette = { container, visible: false, showMenu: jest.fn() };
        activity.palettes.dict = { rhythm: palette };
        palette.container.x = 10;
        palette.container.y = 20;

        loader.regeneratePalettes();

        expect(palette.container.x).toBe(10);
        expect(palette.container.y).toBe(20);
    });

    test("calls showMenu(true) for palettes that were visible", () => {
        const container = { x: 5, y: 10 };
        const palette = { container, visible: true, showMenu: jest.fn() };
        activity.palettes.dict = { rhythm: palette };

        loader.regeneratePalettes();

        expect(palette.showMenu).toHaveBeenCalledWith(true);
    });

    test("does not call showMenu for palettes that were not visible", () => {
        const container = { x: 5, y: 10 };
        const palette = { container, visible: false, showMenu: jest.fn() };
        activity.palettes.dict = { rhythm: palette };

        loader.regeneratePalettes();

        expect(palette.showMenu).not.toHaveBeenCalled();
    });

    test("captures errors via ErrorHandler and calls errorMsg", () => {
        activity.palettes.hide = () => {
            throw new Error("hide failed");
        };

        loader.regeneratePalettes();

        expect(global.ErrorHandler.capture).toHaveBeenCalledWith(expect.any(Error), {
            operation: "regeneratePalettes"
        });
        expect(activity.errorMsg).toHaveBeenCalledWith(
            "Error regenerating palettes. Please refresh the page."
        );
    });
});
