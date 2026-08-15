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

const { setupGridController, GridController } = require("../grid-controller.js");

// Mock gettext helper used in hideGrids label
if (typeof global._ !== "function") {
    global._ = s => s;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal activity mock with a fully-initialised turtles stub so that
 * setupGridController() mirrors the real post-turtles call site.
 */
function makeActivity({ isMusicBlocks = true, currentGrid = 0, selectedNavItemIndex = 0 } = {}) {
    return {
        _THIS_IS_MUSIC_BLOCKS_: isMusicBlocks,
        turtles: {
            currentGrid,
            setGridLabel: jest.fn(),
            gridWheel: { selectedNavItemIndex }
        },
        _hideCartesian: jest.fn(),
        _showCartesian: jest.fn(),
        _hidePolar: jest.fn(),
        _showPolar: jest.fn(),
        _hideTreble: jest.fn(),
        _showTreble: jest.fn(),
        _hideGrand: jest.fn(),
        _showGrand: jest.fn(),
        _hideSoprano: jest.fn(),
        _showSoprano: jest.fn(),
        _hideAlto: jest.fn(),
        _showAlto: jest.fn(),
        _hideTenor: jest.fn(),
        _showTenor: jest.fn(),
        _hideBass: jest.fn(),
        _showBass: jest.fn(),
        update: false,
        refreshCanvas: jest.fn()
    };
}

// ---------------------------------------------------------------------------
// Setup / wiring
// ---------------------------------------------------------------------------

describe("setupGridController", () => {
    test("attaches gridController instance and public methods to activity", () => {
        const activity = makeActivity();
        setupGridController(activity);

        expect(activity.gridController).toBeInstanceOf(GridController);
        expect(typeof activity.hideGrids).toBe("function");
        expect(typeof activity._doCartesianPolar).toBe("function");
    });

    test("initialisation before turtles: hideGrids does not throw", () => {
        // Simulate the edge-case where hideGrids is called before turtles
        // is attached (e.g. during cleanup on an early error path).
        const activity = makeActivity();
        activity.turtles = null; // no turtles yet
        setupGridController(activity);

        // Must not throw; visual hide methods are still called
        expect(() => activity.hideGrids()).not.toThrow();
        expect(activity._hideCartesian).toHaveBeenCalledTimes(1);
        expect(activity._hidePolar).toHaveBeenCalledTimes(1);
        // setGridLabel is NOT called — turtles is null
        // (no turtles stub to assert on, just verifying no crash)
    });
});

// ---------------------------------------------------------------------------
// Observable behavior: grid transitions via doCartesianPolar
// ---------------------------------------------------------------------------

describe("doCartesianPolar — grid transitions", () => {
    test("Cartesian (1) → Polar (3): hides Cartesian, shows Polar, updates currentGrid", () => {
        const activity = makeActivity({ currentGrid: 1, selectedNavItemIndex: 3 });
        setupGridController(activity);

        activity._doCartesianPolar();

        expect(activity._hideCartesian).toHaveBeenCalledTimes(1);
        expect(activity._showPolar).toHaveBeenCalledTimes(1);
        expect(activity._showCartesian).not.toHaveBeenCalled();
        expect(activity.turtles.currentGrid).toBe(3);
    });

    test("Polar (3) → None (0): hides Polar, shows nothing, updates currentGrid", () => {
        const activity = makeActivity({ currentGrid: 3, selectedNavItemIndex: 0 });
        setupGridController(activity);

        activity._doCartesianPolar();

        expect(activity._hidePolar).toHaveBeenCalledTimes(1);
        expect(activity._showPolar).not.toHaveBeenCalled();
        expect(activity._showCartesian).not.toHaveBeenCalled();
        expect(activity.turtles.currentGrid).toBe(0);
    });

    test("Cartesian+Polar (2) → Cartesian (1): hides both, shows only Cartesian", () => {
        const activity = makeActivity({ currentGrid: 2, selectedNavItemIndex: 1 });
        setupGridController(activity);

        activity._doCartesianPolar();

        expect(activity._hideCartesian).toHaveBeenCalledTimes(1);
        expect(activity._hidePolar).toHaveBeenCalledTimes(1);
        expect(activity._showCartesian).toHaveBeenCalledTimes(1);
        expect(activity._showPolar).not.toHaveBeenCalled();
        expect(activity.turtles.currentGrid).toBe(1);
    });

    test("None (0) → Cartesian+Polar (2): hides nothing, shows both", () => {
        const activity = makeActivity({ currentGrid: 0, selectedNavItemIndex: 2 });
        setupGridController(activity);

        activity._doCartesianPolar();

        expect(activity._hideCartesian).not.toHaveBeenCalled();
        expect(activity._hidePolar).not.toHaveBeenCalled();
        expect(activity._showCartesian).toHaveBeenCalledTimes(1);
        expect(activity._showPolar).toHaveBeenCalledTimes(1);
        expect(activity.turtles.currentGrid).toBe(2);
    });

    test("Cartesian+Polar (2) → Grand (5): hides both, shows Grand", () => {
        const activity = makeActivity({ currentGrid: 2, selectedNavItemIndex: 5 });
        setupGridController(activity);

        activity._doCartesianPolar();

        expect(activity._hideCartesian).toHaveBeenCalledTimes(1);
        expect(activity._hidePolar).toHaveBeenCalledTimes(1);
        expect(activity._showGrand).toHaveBeenCalledTimes(1);
        expect(activity.turtles.currentGrid).toBe(5);
    });

    test("Treble (4) → Alto (7): hides Treble, shows Alto", () => {
        const activity = makeActivity({ currentGrid: 4, selectedNavItemIndex: 7 });
        setupGridController(activity);

        activity._doCartesianPolar();

        expect(activity._hideTreble).toHaveBeenCalledTimes(1);
        expect(activity._showAlto).toHaveBeenCalledTimes(1);
        expect(activity.turtles.currentGrid).toBe(7);
    });

    test("doCartesianPolar is a no-op when turtles is not yet initialised", () => {
        const activity = makeActivity();
        activity.turtles = null;
        setupGridController(activity);

        activity._doCartesianPolar();

        expect(activity._hideCartesian).not.toHaveBeenCalled();
        expect(activity._showCartesian).not.toHaveBeenCalled();
    });

    test("calls refreshCanvas() after a transition to trigger an immediate repaint", () => {
        // Regression guard: setting only activity.update = true is insufficient.
        // The render loop checks stageDirty; update is converted to stageDirty
        // only inside __tick, which fires on UI events rather than continuously.
        // Without refreshCanvas() the grid stays invisible until the next user
        // interaction wakes the idle loop.
        const activity = makeActivity({ currentGrid: 1, selectedNavItemIndex: 3 });
        setupGridController(activity);

        activity._doCartesianPolar();

        expect(activity.refreshCanvas).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// Observable behavior: hideGrids
// ---------------------------------------------------------------------------

describe("hideGrids", () => {
    test("hides all overlays in Music Blocks mode and resets label", () => {
        const activity = makeActivity({ isMusicBlocks: true });
        setupGridController(activity);

        activity.hideGrids();

        expect(activity.turtles.setGridLabel).toHaveBeenCalledWith("show Cartesian");
        expect(activity._hideCartesian).toHaveBeenCalledTimes(1);
        expect(activity._hidePolar).toHaveBeenCalledTimes(1);
        expect(activity._hideTreble).toHaveBeenCalledTimes(1);
        expect(activity._hideGrand).toHaveBeenCalledTimes(1);
        expect(activity._hideSoprano).toHaveBeenCalledTimes(1);
        expect(activity._hideAlto).toHaveBeenCalledTimes(1);
        expect(activity._hideTenor).toHaveBeenCalledTimes(1);
        expect(activity._hideBass).toHaveBeenCalledTimes(1);
    });

    test("skips musical staff overlays in Turtle Blocks mode", () => {
        const activity = makeActivity({ isMusicBlocks: false });
        setupGridController(activity);

        activity.hideGrids();

        expect(activity._hideCartesian).toHaveBeenCalledTimes(1);
        expect(activity._hidePolar).toHaveBeenCalledTimes(1);
        expect(activity._hideTreble).not.toHaveBeenCalled();
        expect(activity._hideGrand).not.toHaveBeenCalled();
        expect(activity._hideAlto).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// isMusicBlocks injection
// ---------------------------------------------------------------------------

describe("isMusicBlocks injection", () => {
    test("reads mode from activity._THIS_IS_MUSIC_BLOCKS_ rather than the global", () => {
        // The activity says Turtle Blocks even if the global says Music Blocks
        const activity = makeActivity({ isMusicBlocks: false });
        setupGridController(activity);

        activity.hideGrids();

        // Musical staff overlays must NOT be hidden (Turtle Blocks mode)
        expect(activity._hideTreble).not.toHaveBeenCalled();
    });
});
