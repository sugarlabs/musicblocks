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
        addChildAt: jest.fn(),
        setChildIndex: jest.fn()
    },
    cellSize: 50,
    refreshCanvas: jest.fn(),
    textMsg: jest.fn()
};
const mockTo = jest.fn().mockReturnThis();
const mockSet = jest.fn().mockReturnThis();

const mockCreatejs = {
    Container: jest.fn(() => ({
        addChild: jest.fn(),
        removeChildAt: jest.fn(),
        removeAllChildren: jest.fn(function () {
            this.children = [];
        }),
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
            drawRect: jest.fn().mockReturnThis(),
            clear: jest.fn().mockReturnThis(),
            drawRoundRect: jest.fn().mockReturnThis()
        },
        alpha: 0,
        x: 0,
        y: 0,
        visible: false
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
global._ = jest.fn(s => s);

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

    it("registers one debounced resize listener", () => {
        const addEventListenerSpy = jest
            .spyOn(window, "addEventListener")
            .mockImplementation(() => {});
        const testTrashcan = new Trashcan(mockActivity);
        const resizeFn = addEventListenerSpy.mock.calls[0][1];
        testTrashcan.resizeEvent(2);
        testTrashcan.resizeEvent(1);

        expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

        const updateContainerPositionSpy = jest.spyOn(testTrashcan, "updateContainerPosition");
        resizeFn();
        jest.advanceTimersByTime(300);
        expect(updateContainerPositionSpy).toHaveBeenCalledTimes(1);

        updateContainerPositionSpy.mockRestore();
        addEventListenerSpy.mockRestore();
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

    it("should activate the trash highlight immediately", () => {
        const highlightSpy = jest.spyOn(trashcan, "_makeBorderHighlight");

        trashcan.startHighlightAnimation();

        expect(trashcan._inAnimation).toBe(true);
        expect(trashcan.isVisible).toBe(true);
        expect(highlightSpy).toHaveBeenCalledWith(true);
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

    it("should return true for a point exactly at the bottom edge", () => {
        expect(trashcan.overTrashcan(150, 320)).toBe(true);
    });

    it("should return false for a point just below the bottom edge", () => {
        expect(trashcan.overTrashcan(150, 321)).toBe(false);
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

describe("interactive lid open and delete glow affordance", () => {
    let trashcan;

    beforeEach(() => {
        jest.clearAllMocks();
        trashcan = new Trashcan(mockActivity);
    });

    describe("_getTrashColors", () => {
        it("should return fallback platform colors when CSS variables are not present", () => {
            const colors = trashcan._getTrashColors();
            expect(colors.border).toBe(global.platformColor.trashBorder);
            expect(colors.hoverBorder).toBe(global.platformColor.trashActive);
            expect(colors.hoverBg).toBe("rgba(239, 68, 68, 0.25)");
        });

        it("should resolve colors from CSS custom properties when document has computed styles", () => {
            const origGetComputedStyle = window.getComputedStyle;
            window.getComputedStyle = jest.fn(() => ({
                getPropertyValue: jest.fn(prop => {
                    if (prop === "--color-trash-border") return "#1e88e5";
                    if (prop === "--color-trash-hover-border") return "#e53935";
                    if (prop === "--color-trash-hover-bg") return "rgba(229, 57, 53, 0.25)";
                    return "";
                })
            }));

            const colors = trashcan._getTrashColors();
            expect(colors.border).toBe("#1e88e5");
            expect(colors.hoverBorder).toBe("#e53935");
            expect(colors.hoverBg).toBe("rgba(229, 57, 53, 0.25)");

            window.getComputedStyle = origGetComputedStyle;
        });

        it("should fall back when CSS variable contains an invalid format", () => {
            const origGetComputedStyle = window.getComputedStyle;
            window.getComputedStyle = jest.fn(() => ({
                getPropertyValue: jest.fn(prop => {
                    if (prop === "--color-trash-border") return "invalid-token;;";
                    return "";
                })
            }));

            const colors = trashcan._getTrashColors();
            expect(colors.border).toBe(global.platformColor.trashBorder);

            window.getComputedStyle = origGetComputedStyle;
        });
    });

    describe("_hoverBgShape", () => {
        it("should create and position hover glow shape behind container", () => {
            expect(trashcan._hoverBgShape).toBeDefined();
            expect(mockActivity.trashContainer.addChild).toHaveBeenCalledWith(
                trashcan._hoverBgShape
            );
            expect(mockActivity.trashContainer.setChildIndex).toHaveBeenCalledWith(
                trashcan._hoverBgShape,
                0
            );
        });

        it("should synchronize hover glow shape coordinates on updateContainerPosition", () => {
            trashcan.updateContainerPosition();
            expect(trashcan._hoverBgShape.x).toBe(trashcan._container.x);
            expect(trashcan._hoverBgShape.y).toBe(trashcan._container.y);
        });

        it("should reset hover glow shape visibility and alpha on hide", () => {
            trashcan._hoverBgShape.alpha = 1;
            trashcan._hoverBgShape.visible = true;

            trashcan.hide();

            expect(trashcan._hoverBgShape.alpha).toBe(0);
            expect(trashcan._hoverBgShape.visible).toBe(false);
        });
    });

    describe("separated lid and body icons", () => {
        it("should assemble separate lid and body when TRASH_LID_ICON and TRASH_BODY_ICON are defined", () => {
            global.TRASH_LID_ICON = "mock_lid_svg";
            global.TRASH_BODY_ICON = "mock_body_svg";

            const separatedTrashcan = new Trashcan(mockActivity);

            expect(separatedTrashcan._lidContainer).not.toBeNull();
            expect(separatedTrashcan._lidBitmap).not.toBeNull();
            expect(separatedTrashcan._bodyBitmap).not.toBeNull();

            delete global.TRASH_LID_ICON;
            delete global.TRASH_BODY_ICON;
        });

        it("should fallback gracefully to monolithic TRASHICON when separated icons are absent", () => {
            delete global.TRASH_LID_ICON;
            delete global.TRASH_BODY_ICON;

            const fallbackTrashcan = new Trashcan(mockActivity);

            expect(fallbackTrashcan._trashBitmap).not.toBeNull();
            expect(fallbackTrashcan._lidContainer).toBeNull();
        });
    });

    describe("animations", () => {
        it("should not start highlight animation if artwork is not yet initialized", () => {
            trashcan._isHighlightInitialized = false;
            trashcan.startHighlightAnimation();
            expect(trashcan._inAnimation).toBe(false);
            expect(trashcan.isVisible).toBe(false);
        });

        it("should safely handle _switchHighlightVisibility when container children are incomplete", () => {
            trashcan._container.children = [];
            expect(() => trashcan._switchHighlightVisibility(true)).not.toThrow();
            trashcan._container.children = [{}];
            expect(() => trashcan._switchHighlightVisibility(true)).not.toThrow();
        });

        it("should announce delete action to screen reader on startHighlightAnimation", () => {
            mockActivity.textMsg.mockClear();
            trashcan.startHighlightAnimation();
            expect(mockActivity.textMsg).toHaveBeenCalledWith("Release to delete the block.");
        });

        it("should trigger tween for hover glow and lid tilt on startHighlightAnimation", () => {
            mockTo.mockClear();
            trashcan._lidContainer = { rotation: 0, y: 0 };
            trashcan.startHighlightAnimation();

            expect(createjs.Tween.get).toHaveBeenCalledWith(trashcan._hoverBgShape, {
                override: true
            });
            expect(createjs.Tween.get).toHaveBeenCalledWith(trashcan._lidContainer, {
                override: true
            });
            expect(mockTo).toHaveBeenCalledWith(expect.objectContaining({ alpha: 1 }), 150);
            expect(mockTo).toHaveBeenCalledWith(
                expect.objectContaining({ rotation: -20, y: -5 }),
                180
            );
        });

        it("should trigger tween resetting hover glow and lid position on stopHighlightAnimation", () => {
            trashcan._inAnimation = true;
            trashcan._lidContainer = { rotation: -20, y: -5 };
            mockTo.mockClear();

            trashcan.stopHighlightAnimation();

            expect(createjs.Tween.get).toHaveBeenCalledWith(trashcan._hoverBgShape, {
                override: true
            });
            expect(createjs.Tween.get).toHaveBeenCalledWith(trashcan._lidContainer, {
                override: true
            });
            expect(mockTo).toHaveBeenCalledWith(expect.objectContaining({ alpha: 0 }), 150);
            expect(mockTo).toHaveBeenCalledWith(
                expect.objectContaining({ rotation: 0, y: 0 }),
                150
            );
        });
    });

    describe("refresh", () => {
        it("should clear and rebuild container artwork when refreshed", () => {
            const removeAllSpy = jest.spyOn(trashcan._container, "removeAllChildren");
            const updateHoverBgSpy = jest.spyOn(trashcan, "_updateHoverBg");
            const makeTrashSpy = jest.spyOn(trashcan, "_makeTrash");

            trashcan.refresh();

            expect(removeAllSpy).toHaveBeenCalled();
            expect(updateHoverBgSpy).toHaveBeenCalled();
            expect(makeTrashSpy).toHaveBeenCalled();
            expect(trashcan._isHighlightInitialized).toBe(true);
        });

        it("should stop active animation before refreshing", () => {
            trashcan._inAnimation = true;
            const stopAnimationSpy = jest.spyOn(trashcan, "stopHighlightAnimation");

            trashcan.refresh();

            expect(stopAnimationSpy).toHaveBeenCalled();
        });

        it("should ignore image callbacks from older generations when refreshed in succession", () => {
            const originalImage = global.Image;
            const pendingCallbacks = [];
            global.Image = jest.fn(() => {
                const img = {
                    set src(val) {
                        pendingCallbacks.push(this.onload);
                    }
                };
                return img;
            });

            try {
                const testTrashcan = new Trashcan(mockActivity);
                const gen0Callbacks = [...pendingCallbacks];
                pendingCallbacks.length = 0;

                testTrashcan.refresh();
                const gen1Callbacks = [...pendingCallbacks];

                for (const cb of gen1Callbacks) {
                    if (typeof cb === "function") {
                        cb();
                    }
                }
                const gen1Lid = testTrashcan._lidBitmap;
                const gen1ChildrenCount = testTrashcan._container.children.length;

                for (const cb of gen0Callbacks) {
                    if (typeof cb === "function") {
                        cb();
                    }
                }

                expect(testTrashcan._lidBitmap).toBe(gen1Lid);
                expect(testTrashcan._container.children.length).toBe(gen1ChildrenCount);
            } finally {
                global.Image = originalImage;
            }
        });
    });
});
