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

// Mock globally used _ (gettext) function if not defined
if (typeof global._ !== "function") {
    global._ = s => s;
}
// Mock global variables used by grid controller
global._THIS_IS_MUSIC_BLOCKS_ = true;

describe("GridController Tests", () => {
    let mockActivity;

    beforeEach(() => {
        mockActivity = {
            turtles: {
                currentGrid: 0,
                setGridLabel: jest.fn(),
                gridWheel: {
                    selectedNavItemIndex: 0
                }
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
            update: false
        };
        setupGridController(mockActivity);
    });

    test("setupGridController attaches helper functions and instance to activity", () => {
        expect(mockActivity.gridController).toBeInstanceOf(GridController);
        expect(typeof mockActivity.hideGrids).toBe("function");
        expect(typeof mockActivity._doCartesianPolar).toBe("function");
    });

    test("currentGrid getter and setter works correctly", () => {
        const controller = mockActivity.gridController;
        expect(controller.currentGrid).toBe(0);

        controller.currentGrid = 2;
        expect(mockActivity.turtles.currentGrid).toBe(2);
        expect(controller.currentGrid).toBe(2);
    });

    test("currentGrid returns null if turtles component is not loaded", () => {
        const controller = mockActivity.gridController;
        const oldTurtles = mockActivity.turtles;
        mockActivity.turtles = null;
        expect(controller.currentGrid).toBeNull();

        // Setter does not throw when turtles is null
        expect(() => {
            controller.currentGrid = 3;
        }).not.toThrow();
        mockActivity.turtles = oldTurtles;
    });

    test("isCartesianEnabled getter behaves correctly", () => {
        const controller = mockActivity.gridController;

        // 0 -> false
        controller.currentGrid = 0;
        expect(controller.isCartesianEnabled).toBe(false);

        // 1 (Cartesian) -> true
        controller.currentGrid = 1;
        expect(controller.isCartesianEnabled).toBe(true);

        // 2 (Cartesian/Polar) -> true
        controller.currentGrid = 2;
        expect(controller.isCartesianEnabled).toBe(true);

        // 3 (Polar) -> false
        controller.currentGrid = 3;
        expect(controller.isCartesianEnabled).toBe(false);
    });

    test("isPolarEnabled getter behaves correctly", () => {
        const controller = mockActivity.gridController;

        // 0 -> false
        controller.currentGrid = 0;
        expect(controller.isPolarEnabled).toBe(false);

        // 1 (Cartesian) -> false
        controller.currentGrid = 1;
        expect(controller.isPolarEnabled).toBe(false);

        // 2 (Cartesian/Polar) -> true
        controller.currentGrid = 2;
        expect(controller.isPolarEnabled).toBe(true);

        // 3 (Polar) -> true
        controller.currentGrid = 3;
        expect(controller.isPolarEnabled).toBe(true);
    });

    test("isGridVisible getter behaves correctly", () => {
        const controller = mockActivity.gridController;

        controller.currentGrid = null;
        expect(controller.isGridVisible).toBe(false);

        controller.currentGrid = 0;
        expect(controller.isGridVisible).toBe(false);

        controller.currentGrid = 1;
        expect(controller.isGridVisible).toBe(true);
    });

    test("hideGrids calls corresponding visual hide methods", () => {
        mockActivity.hideGrids();

        expect(mockActivity.turtles.setGridLabel).toHaveBeenCalledWith("show Cartesian");
        expect(mockActivity._hideCartesian).toHaveBeenCalledTimes(1);
        expect(mockActivity._hidePolar).toHaveBeenCalledTimes(1);
        expect(mockActivity._hideTreble).toHaveBeenCalledTimes(1);
        expect(mockActivity._hideGrand).toHaveBeenCalledTimes(1);
        expect(mockActivity._hideSoprano).toHaveBeenCalledTimes(1);
        expect(mockActivity._hideAlto).toHaveBeenCalledTimes(1);
        expect(mockActivity._hideTenor).toHaveBeenCalledTimes(1);
        expect(mockActivity._hideBass).toHaveBeenCalledTimes(1);
    });

    test("hideGrids does not hide treble/musical staffs if not in music blocks context", () => {
        global._THIS_IS_MUSIC_BLOCKS_ = false;

        mockActivity.hideGrids();

        expect(mockActivity._hideCartesian).toHaveBeenCalledTimes(1);
        expect(mockActivity._hidePolar).toHaveBeenCalledTimes(1);
        expect(mockActivity._hideTreble).not.toHaveBeenCalled();
        expect(mockActivity._hideGrand).not.toHaveBeenCalled();

        global._THIS_IS_MUSIC_BLOCKS_ = true;
    });

    test("doCartesianPolar handles transitions correctly", () => {
        // Transition from active Cartesian (1) to Polar (3)
        mockActivity.turtles.currentGrid = 1;
        mockActivity.turtles.gridWheel.selectedNavItemIndex = 3;

        mockActivity._doCartesianPolar();

        expect(mockActivity._hideCartesian).toHaveBeenCalledTimes(1);
        expect(mockActivity._showPolar).toHaveBeenCalledTimes(1);
        expect(mockActivity.turtles.currentGrid).toBe(3);
        expect(mockActivity.update).toBe(true);
    });

    test("doCartesianPolar transitions from Cartesian/Polar (2) to Grand (5)", () => {
        mockActivity.turtles.currentGrid = 2;
        mockActivity.turtles.gridWheel.selectedNavItemIndex = 5;

        mockActivity._doCartesianPolar();

        expect(mockActivity._hideCartesian).toHaveBeenCalledTimes(1);
        expect(mockActivity._hidePolar).toHaveBeenCalledTimes(1);
        expect(mockActivity._showGrand).toHaveBeenCalledTimes(1);
        expect(mockActivity.turtles.currentGrid).toBe(5);
    });

    test("doCartesianPolar does nothing if turtles component is not loaded", () => {
        mockActivity.turtles = null;
        mockActivity._doCartesianPolar();

        expect(mockActivity._hideCartesian).not.toHaveBeenCalled();
        expect(mockActivity._showCartesian).not.toHaveBeenCalled();
    });
});
