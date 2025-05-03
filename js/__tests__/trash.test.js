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

const Trashcan = require("../trash");

// Mocks
const mockActivity = {
    trashContainer: {
        addChild: jest.fn(),
        setChildIndex: jest.fn(),
    },
    cellSize: 50,
    refreshCanvas: jest.fn(),
};
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
global.platformColor = {
    trashActive: "red",
    trashBorder: "blue",
};
global.base64Encode = jest.fn((data) => data);
global.BORDER = "mock_border_svg";
global.TRASHICON = "mock_trash_icon_svg";
global.last = jest.fn((array) => array[array.length - 1]);

global.Image = jest.fn(() => {
    const img = {};
    img.onload = jest.fn();
    Object.defineProperty(img, "src", {
        set: function () {
            img.onload();
        },
    });
    return img;
});

jest.spyOn(global.window, "addEventListener").mockImplementation(() => {});
jest.useFakeTimers();

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
        expect(mockActivity.trashContainer.addChild).toHaveBeenCalled();
        expect(mockActivity.trashContainer.setChildIndex).toHaveBeenCalled();
    });
    
    it("should check if resize is needed", () => {
        trashcan._container.x = 100;
        trashcan._container.y = 100;
        expect(trashcan.shouldResize(200, 100)).toBe(true);
        expect(trashcan.shouldResize(100, 100)).toBe(false);
    });

    it("should resize and debounce the event listener", () => {
        trashcan.resizeEvent(1);
        const resizeFn = window.addEventListener.mock.calls[0][1];
        resizeFn(); // simulate resize
        jest.advanceTimersByTime(300);
    });

    it("should hide the trashcan using animation", () => {
        trashcan.hide();
        expect(mockCreatejs.Tween.get).toHaveBeenCalledWith(trashcan._container);
        expect(mockTo).toHaveBeenCalledWith({ alpha: 0 }, 200);
        expect(mockSet).toHaveBeenCalledWith({ visible: false });
    });

    it("should show the trashcan using animation", () => {
        trashcan.show();
        expect(mockCreatejs.Tween.get).toHaveBeenCalledWith(trashcan._container);
        expect(mockTo).toHaveBeenCalledWith({ alpha: 0.0, visible: true });
        expect(mockTo).toHaveBeenCalledWith({ alpha: 1.0 }, 200);
    });

    it("should start and stop highlight animation", () => {
        trashcan.startHighlightAnimation();
        jest.advanceTimersByTime(3000);
        expect(trashcan._inAnimation).toBe(true);

    });

    it("should not restart highlight animation if already running", () => {
        trashcan._inAnimation = true;
        trashcan.startHighlightAnimation();
        expect(trashcan._inAnimation).toBe(true);
    });

    it("should toggle highlight visibility correctly", () => {
        trashcan._switchHighlightVisibility(true);
        expect(mockActivity.refreshCanvas).toHaveBeenCalled();
        trashcan._switchHighlightVisibility(false);
        expect(mockActivity.refreshCanvas).toHaveBeenCalledTimes(2);
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