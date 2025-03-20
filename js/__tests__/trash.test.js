/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Justin Charles
 *
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

const Trashcan = require("../trash"); // Adjust the path as needed

// Mock dependencies
const mockActivity = {
    trashContainer: {
        addChild: jest.fn(),
        setChildIndex: jest.fn(),
    },
    cellSize: 50,
    refreshCanvas: jest.fn(),
};

// Create mock functions for Tween
const mockTo = jest.fn().mockReturnThis();
const mockSet = jest.fn().mockReturnThis();

const mockCreatejs = {
    Container: jest.fn(() => ({
        addChild: jest.fn(),
        removeChildAt: jest.fn(),
        getBounds: jest.fn(() => ({
            width: 100,
            height: 100,
        })),
        children: [{ visible: false }, { visible: false }],
        visible: false,
        x: 0,
        y: 0,
    })),
    Bitmap: jest.fn(() => ({
        scaleX: 1,
        scaleY: 1,
        x: 0,
        y: 0,
        getBounds: jest.fn(() => ({ width: 100 })),
    })),
    Tween: {
        get: jest.fn(() => ({
            to: mockTo,
            set: mockSet,
        })),
    },
    Shape: jest.fn(() => ({
        graphics: {
            beginFill: jest.fn().mockReturnThis(),
            drawRect: jest.fn().mockReturnThis(),
        },
    })),
};

global.createjs = mockCreatejs;

// Mock platformColor, BORDER, TRASHICON, and other global dependencies
global.platformColor = {
    trashActive: "red",
    trashBorder: "blue",
};
global.base64Encode = jest.fn((data) => data);
global.BORDER = "mock_border_svg";
global.TRASHICON = "mock_trash_icon_svg";
global.last = jest.fn((array) => array[array.length - 1]);

// Mock Image
global.Image = jest.fn(() => {
    const img = {};
    img.onload = jest.fn();
    Object.defineProperty(img, "src", {
        set: function () {
            img.onload(); // Simulate the onload when src is set
        },
    });
    return img;
});

// Mock window object
jest.spyOn(global.window, "addEventListener").mockImplementation(() => {});

describe("Trashcan Class", () => {
    let trashcan;

    beforeEach(() => {
        jest.clearAllMocks();
        trashcan = new Trashcan(mockActivity);
    });

    it("should initialize with correct default values", () => {
        expect(trashcan.activity).toBe(mockActivity);
        expect(trashcan.isVisible).toBe(false);
        expect(trashcan._scale).toBe(1);
        expect(mockActivity.trashContainer.addChild).toHaveBeenCalledWith(trashcan._container);
        expect(mockActivity.trashContainer.setChildIndex).toHaveBeenCalledWith(trashcan._container, 0);
    });

    it("should resize and attach the event listener", () => {
        trashcan.resizeEvent(1); // Call resizeEvent
        expect(window.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
    });

    it("should hide the trashcan using animation", () => {
        trashcan.hide(); // Call hide
        expect(mockCreatejs.Tween.get).toHaveBeenCalledWith(trashcan._container);
        expect(mockTo).toHaveBeenCalledWith({ alpha: 0 }, 200);
        expect(mockSet).toHaveBeenCalledWith({ visible: false });
    });

    it("should show the trashcan using animation", () => {
        trashcan.show(); // Call show
        expect(mockCreatejs.Tween.get).toHaveBeenCalledWith(trashcan._container);
        expect(mockTo).toHaveBeenCalledWith({ alpha: 0.0, visible: true });
        expect(mockTo).toHaveBeenCalledWith({ alpha: 1.0 }, 200);
    });

    it("should detect if coordinates are over the trashcan", () => {
        trashcan._container.x = 100;
        trashcan._container.y = 100;

        expect(trashcan.overTrashcan(150, 150)).toBe(true);
        expect(trashcan.overTrashcan(50, 150)).toBe(false);
        expect(trashcan.overTrashcan(150, 50)).toBe(false);
        expect(trashcan.overTrashcan(300, 300)).toBe(false);
    });
});