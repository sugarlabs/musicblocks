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
        setChildIndex: jest.fn()
    },
    cellSize: 50,
    refreshCanvas: jest.fn()
};
const mockTo = jest.fn().mockReturnThis();
const mockSet = jest.fn().mockReturnThis();

const mockCreatejs = {
    Container: jest.fn(() => ({
        addChild: jest.fn(),
        removeChildAt: jest.fn(),
        getBounds: jest.fn(() => ({
            width: 100,
            height: 100
        })),
        children: [{ visible: false }, { visible: false }],
        visible: false,
        x: 0,
        y: 0
    })),
    Bitmap: jest.fn(() => ({
        scaleX: 1,
        scaleY: 1,
        x: 0,
        y: 0,
        getBounds: jest.fn(() => ({ width: 100 }))
    })),
    Tween: {
        get: jest.fn(() => ({
            to: mockTo,
            set: mockSet
        }))
    },
    Shape: jest.fn(() => ({
        graphics: {
            beginFill: jest.fn().mockReturnThis(),
            drawRect: jest.fn().mockReturnThis()
        }
    }))
};
global.createjs = mockCreatejs;
global.platformColor = {
    trashActive: "red",
    trashBorder: "blue"
};
global.base64Encode = jest.fn(data => data);
global.BORDER = "mock_border_svg";
global.TRASHICON = "mock_trash_icon_svg";
global.last = jest.fn(array => array[array.length - 1]);

global.Image = jest.fn(() => {
    const img = {};
    img.onload = jest.fn();
    Object.defineProperty(img, "src", {
        set: function () {
            img.onload();
        }
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

describe("overTrashcan edge cases", () => {
    let trashcan;

    beforeEach(() => {
        jest.clearAllMocks();
        trashcan = new Trashcan(mockActivity);
        trashcan._container.x = 100;
        trashcan._container.y = 200;
    });

    it("should return true for a point exactly at the top-left corner", () => {
        expect(trashcan.overTrashcan(100, 200)).toBe(true);
    });

    it("should return true for a point exactly at the top-right corner", () => {
        // TRASHWIDTH is 120, so top-right is (100 + 120, 200)
        expect(trashcan.overTrashcan(220, 200)).toBe(true);
    });

    it("should return false for a point just left of the left edge", () => {
        expect(trashcan.overTrashcan(99, 200)).toBe(false);
    });

    it("should return false for a point just above the top edge", () => {
        expect(trashcan.overTrashcan(150, 199)).toBe(false);
    });

    it("should return false for a point just right of the right edge", () => {
        // x > tx + TRASHWIDTH (100 + 120 = 220), so 221 is out
        expect(trashcan.overTrashcan(221, 200)).toBe(false);
    });

    it("should return true for a point far below the trashcan (no lower y bound)", () => {
        // overTrashcan has no lower y bound check
        expect(trashcan.overTrashcan(150, 10000)).toBe(true);
    });

    it("should return true for a point exactly on the left edge", () => {
        expect(trashcan.overTrashcan(100, 250)).toBe(true);
    });

    it("should return true for a point exactly on the right edge", () => {
        expect(trashcan.overTrashcan(220, 250)).toBe(true);
    });

    it("should return false for negative x coordinates", () => {
        expect(trashcan.overTrashcan(-50, 250)).toBe(false);
    });

    it("should return false for negative y coordinates", () => {
        expect(trashcan.overTrashcan(150, -50)).toBe(false);
    });

    it("should return true for the center of the trashcan area", () => {
        // center x = 100 + 60 = 160, y = 200 + 60 = 260
        expect(trashcan.overTrashcan(160, 260)).toBe(true);
    });

    it("should return false when x is at left boundary but y is above", () => {
        expect(trashcan.overTrashcan(100, 199)).toBe(false);
    });
});

describe("shouldResize edge cases", () => {
    let trashcan;

    beforeEach(() => {
        jest.clearAllMocks();
        trashcan = new Trashcan(mockActivity);
    });

    it("should return false when both dimensions match container position", () => {
        trashcan._container.x = 500;
        trashcan._container.y = 400;
        expect(trashcan.shouldResize(500, 400)).toBe(false);
    });

    it("should return true when only x differs", () => {
        trashcan._container.x = 500;
        trashcan._container.y = 400;
        expect(trashcan.shouldResize(600, 400)).toBe(true);
    });

    it("should return true when only y differs", () => {
        trashcan._container.x = 500;
        trashcan._container.y = 400;
        expect(trashcan.shouldResize(500, 300)).toBe(true);
    });

    it("should return true when both dimensions differ", () => {
        trashcan._container.x = 500;
        trashcan._container.y = 400;
        expect(trashcan.shouldResize(600, 300)).toBe(true);
    });

    it("should return false with zero positions matching", () => {
        trashcan._container.x = 0;
        trashcan._container.y = 0;
        expect(trashcan.shouldResize(0, 0)).toBe(false);
    });

    it("should return true with zero vs non-zero", () => {
        trashcan._container.x = 0;
        trashcan._container.y = 0;
        expect(trashcan.shouldResize(100, 0)).toBe(true);
    });
});

describe("stopHighlightAnimation", () => {
    let trashcan;

    beforeEach(() => {
        jest.clearAllMocks();
        trashcan = new Trashcan(mockActivity);
    });

    it("should do nothing if not in animation", () => {
        trashcan._inAnimation = false;
        const clearSpy = jest.spyOn(global, "clearInterval");

        trashcan.stopHighlightAnimation();

        expect(clearSpy).not.toHaveBeenCalled();
        clearSpy.mockRestore();
    });

    it("should clear interval and reset state when in animation", () => {
        trashcan._inAnimation = true;
        trashcan._animationInterval = 42;
        trashcan._animationLevel = 100;
        trashcan._highlightPower = 128;
        trashcan.isVisible = true;
        const clearSpy = jest.spyOn(global, "clearInterval");

        trashcan.stopHighlightAnimation();

        expect(clearSpy).toHaveBeenCalledWith(42);
        expect(trashcan._inAnimation).toBe(false);
        expect(trashcan.isVisible).toBe(false);
        expect(trashcan._animationLevel).toBe(0);
        expect(trashcan._highlightPower).toBe(255);
        clearSpy.mockRestore();
    });

    it("should be safe to call multiple times", () => {
        trashcan._inAnimation = true;
        trashcan._animationInterval = 42;

        trashcan.stopHighlightAnimation();
        expect(trashcan._inAnimation).toBe(false);

        // Second call should be a no-op since _inAnimation is now false
        trashcan.stopHighlightAnimation();
        expect(trashcan._inAnimation).toBe(false);
    });

    it("should reset animation level and highlight power to defaults", () => {
        trashcan._inAnimation = true;
        trashcan._animationLevel = 500;
        trashcan._highlightPower = 0;

        trashcan.stopHighlightAnimation();

        expect(trashcan._animationLevel).toBe(0);
        expect(trashcan._highlightPower).toBe(255);
    });
});

describe("scale and container positioning", () => {
    let trashcan;

    beforeEach(() => {
        jest.clearAllMocks();
        trashcan = new Trashcan(mockActivity);
    });

    it("should have default scale of 1", () => {
        expect(trashcan._scale).toBe(1);
    });

    it("should update scale via resizeEvent", () => {
        trashcan.resizeEvent(2);
        expect(trashcan._scale).toBe(2);
    });

    it("should update container position based on scale", () => {
        // window.innerWidth = 1024, window.innerHeight = 768 (jsdom defaults)
        trashcan._scale = 1;
        trashcan.updateContainerPosition();

        const expectedX =
            window.innerWidth / trashcan._scale - Trashcan.TRASHWIDTH - 2 * trashcan._iconsize;
        const expectedY =
            window.innerHeight / trashcan._scale -
            Trashcan.TRASHHEIGHT -
            (5 / 4) * trashcan._iconsize;

        expect(trashcan._container.x).toBe(expectedX);
        expect(trashcan._container.y).toBe(expectedY);
    });

    it("should compute different positions at different scales", () => {
        trashcan._scale = 1;
        trashcan.updateContainerPosition();
        const x1 = trashcan._container.x;
        const y1 = trashcan._container.y;

        trashcan._scale = 2;
        trashcan.updateContainerPosition();
        const x2 = trashcan._container.x;
        const y2 = trashcan._container.y;

        // At scale 2, window dimensions are halved, so positions should be different
        expect(x2).not.toBe(x1);
        expect(y2).not.toBe(y1);
    });

    it("should have static TRASHWIDTH and TRASHHEIGHT constants", () => {
        expect(Trashcan.TRASHWIDTH).toBe(120);
        expect(Trashcan.TRASHHEIGHT).toBe(120);
    });

    it("should set iconsize based on trash bitmap bounds", () => {
        // _makeTrash sets _iconsize from bitmap getBounds().width (mocked as 100)
        expect(trashcan._iconsize).toBe(100);
    });

    it("should initialize _borderHighlightBitmap during construction", () => {
        // resizeEvent(1) in constructor triggers _makeBorderHighlight
        expect(trashcan._borderHighlightBitmap).not.toBeNull();
    });

    it("should have _isHighlightInitialized set after construction", () => {
        // resizeEvent(1) in constructor triggers _makeBorderHighlight which sets this
        expect(trashcan._isHighlightInitialized).toBe(true);
    });

    it("should initialize animationTime as 500", () => {
        expect(trashcan.animationTime).toBe(500);
    });
});
