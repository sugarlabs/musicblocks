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

if (typeof global.BLOCKSCALES === "undefined") {
    global.BLOCKSCALES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4];
}
if (typeof global.DEFAULTBLOCKSCALE === "undefined") {
    global.DEFAULTBLOCKSCALE = 1.5;
}
if (typeof global.SMALLERBUTTON === "undefined") {
    global.SMALLERBUTTON = "SMALLERBUTTON_ICON";
}
if (typeof global.SMALLERDISABLEBUTTON === "undefined") {
    global.SMALLERDISABLEBUTTON = "SMALLERDISABLEBUTTON_ICON";
}
if (typeof global.BIGGERBUTTON === "undefined") {
    global.BIGGERBUTTON = "BIGGERBUTTON_ICON";
}
if (typeof global.BIGGERDISABLEBUTTON === "undefined") {
    global.BIGGERDISABLEBUTTON = "BIGGERDISABLEBUTTON_ICON";
}
global.changeImage = jest.fn(() => Promise.resolve());

const { setupBlockScaleController, BlockScaleController } = require("../block-scale-controller.js");

const {
    BLOCKSCALES,
    DEFAULTBLOCKSCALE,
    SMALLERBUTTON,
    SMALLERDISABLEBUTTON,
    BIGGERBUTTON,
    BIGGERDISABLEBUTTON
} = global;
const DEFAULT_INDEX = BLOCKSCALES.indexOf(DEFAULTBLOCKSCALE);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeActivity(blockscale = DEFAULT_INDEX) {
    return {
        blocks: {
            activeBlock: "some-block",
            setBlockScale: jest.fn(() => Promise.resolve()),
            checkBounds: jest.fn()
        },
        resizeDebounce: false,
        blockscale,
        clearCache: jest.fn(),
        refreshCanvas: jest.fn(),
        stageDirty: false,
        smallerContainer: { children: [{}] },
        largerContainer: { children: [{}] },
        __tick: jest.fn()
    };
}

beforeEach(() => {
    document.body.innerHTML = '<div id="helpfulWheelDiv" style="display: none;"></div>';
    global.changeImage.mockClear();
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

describe("setupBlockScaleController", () => {
    test("attaches a BlockScaleController instance to activity.blockScaleController", () => {
        const activity = makeActivity();
        const controller = setupBlockScaleController(activity);

        expect(controller).toBeInstanceOf(BlockScaleController);
        expect(activity.blockScaleController).toBe(controller);
    });

    test("installs delegation methods on the activity", () => {
        const activity = makeActivity();
        setupBlockScaleController(activity);

        expect(typeof activity.doLargerBlocks).toBe("function");
        expect(typeof activity.doSmallerBlocks).toBe("function");
        expect(typeof activity.setSmallerLargerStatus).toBe("function");
    });

    test("delegation methods forward calls to the controller", async () => {
        const activity = makeActivity();
        const controller = setupBlockScaleController(activity);

        const largerSpy = jest.spyOn(controller, "doLargerBlocks").mockResolvedValue();
        const smallerSpy = jest.spyOn(controller, "doSmallerBlocks").mockResolvedValue();
        const statusSpy = jest.spyOn(controller, "setSmallerLargerStatus").mockResolvedValue();

        await activity.doLargerBlocks();
        await activity.doSmallerBlocks();
        await activity.setSmallerLargerStatus();

        expect(largerSpy).toHaveBeenCalledTimes(1);
        expect(smallerSpy).toHaveBeenCalledTimes(1);
        expect(statusSpy).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// Larger blocks
// ---------------------------------------------------------------------------

describe("doLargerBlocks", () => {
    test("increases the block scale", async () => {
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.doLargerBlocks();

        expect(activity.blockscale).toBe(DEFAULT_INDEX + 1);
    });

    test("calls setBlockScale() with the new scale", async () => {
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.doLargerBlocks();

        expect(activity.blocks.setBlockScale).toHaveBeenCalledWith(BLOCKSCALES[DEFAULT_INDEX + 1]);
    });

    test("calls checkBounds()", async () => {
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.doLargerBlocks();

        expect(activity.blocks.checkBounds).toHaveBeenCalledTimes(1);
    });

    test("clears the cache and refreshes the canvas", async () => {
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.doLargerBlocks();

        expect(activity.clearCache).toHaveBeenCalledTimes(1);
        expect(activity.refreshCanvas).toHaveBeenCalledTimes(1);
    });

    test("marks the stage dirty and clears the active block", async () => {
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.doLargerBlocks();

        expect(activity.stageDirty).toBe(true);
        expect(activity.blocks.activeBlock).toBeNull();
    });

    test("hides an open helpful wheel and ticks the activity", async () => {
        document.getElementById("helpfulWheelDiv").style.display = "block";
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.doLargerBlocks();

        expect(document.getElementById("helpfulWheelDiv").style.display).toBe("none");
        expect(activity.__tick).toHaveBeenCalledTimes(1);
    });

    test("does not tick the activity when the helpful wheel is already hidden", async () => {
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.doLargerBlocks();

        expect(activity.__tick).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Smaller blocks
// ---------------------------------------------------------------------------

describe("doSmallerBlocks", () => {
    test("decreases the block scale", async () => {
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.doSmallerBlocks();

        expect(activity.blockscale).toBe(DEFAULT_INDEX - 1);
    });

    test("calls setBlockScale() with the new scale", async () => {
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.doSmallerBlocks();

        expect(activity.blocks.setBlockScale).toHaveBeenCalledWith(BLOCKSCALES[DEFAULT_INDEX - 1]);
    });

    test("performs the same refresh sequence as doLargerBlocks", async () => {
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.doSmallerBlocks();

        expect(activity.blocks.checkBounds).toHaveBeenCalledTimes(1);
        expect(activity.clearCache).toHaveBeenCalledTimes(1);
        expect(activity.refreshCanvas).toHaveBeenCalledTimes(1);
        expect(activity.stageDirty).toBe(true);
    });

    test("hides an open helpful wheel and ticks the activity", async () => {
        document.getElementById("helpfulWheelDiv").style.display = "block";
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.doSmallerBlocks();

        expect(document.getElementById("helpfulWheelDiv").style.display).toBe("none");
        expect(activity.__tick).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// Debounce
// ---------------------------------------------------------------------------

describe("resize debounce", () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    test("collapses repeated doLargerBlocks calls made while resize is pending", async () => {
        jest.useFakeTimers();
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        const first = controller.doLargerBlocks();
        const second = controller.doLargerBlocks();
        await Promise.all([first, second]);

        expect(activity.blockscale).toBe(DEFAULT_INDEX + 1);
        expect(activity.blocks.setBlockScale).toHaveBeenCalledTimes(1);
    });

    test("resets resizeDebounce to false exactly 200ms after the triggering call", async () => {
        jest.useFakeTimers();
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.doLargerBlocks();
        expect(activity.resizeDebounce).toBe(true);

        jest.advanceTimersByTime(199);
        expect(activity.resizeDebounce).toBe(true);

        jest.advanceTimersByTime(1);
        expect(activity.resizeDebounce).toBe(false);
    });

    test("allows a new resize once the debounce window has elapsed", async () => {
        jest.useFakeTimers();
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.doLargerBlocks();
        jest.advanceTimersByTime(200);

        await controller.doLargerBlocks();

        expect(activity.blockscale).toBe(DEFAULT_INDEX + 2);
        expect(activity.blocks.setBlockScale).toHaveBeenCalledTimes(2);
    });
});

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

describe("scale limits", () => {
    test("cannot exceed the largest BLOCKSCALES entry", async () => {
        const maxIndex = BLOCKSCALES.length - 1;
        const activity = makeActivity(maxIndex);
        const controller = setupBlockScaleController(activity);

        await controller.doLargerBlocks();

        expect(activity.blockscale).toBe(maxIndex);
        expect(activity.blocks.setBlockScale).not.toHaveBeenCalled();
    });

    test("cannot go below the smallest BLOCKSCALES entry", async () => {
        const activity = makeActivity(0);
        const controller = setupBlockScaleController(activity);

        await controller.doSmallerBlocks();

        expect(activity.blockscale).toBe(0);
        expect(activity.blocks.setBlockScale).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Icon state
// ---------------------------------------------------------------------------

describe("setSmallerLargerStatus", () => {
    test("enables the smaller-blocks icon when scale is below the default", async () => {
        const belowDefaultIndex = DEFAULT_INDEX - 1;
        const activity = makeActivity(belowDefaultIndex);
        const controller = setupBlockScaleController(activity);

        await controller.setSmallerLargerStatus();

        expect(global.changeImage).toHaveBeenCalledWith(
            activity.smallerContainer.children[0],
            SMALLERBUTTON,
            SMALLERDISABLEBUTTON
        );
    });

    test("disables the smaller-blocks icon when scale is at or above the default", async () => {
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.setSmallerLargerStatus();

        expect(global.changeImage).toHaveBeenCalledWith(
            activity.smallerContainer.children[0],
            SMALLERDISABLEBUTTON,
            SMALLERBUTTON
        );
    });

    test("disables the larger-blocks icon at the maximum scale", async () => {
        const maxIndex = BLOCKSCALES.indexOf(4);
        const activity = makeActivity(maxIndex);
        const controller = setupBlockScaleController(activity);

        await controller.setSmallerLargerStatus();

        expect(global.changeImage).toHaveBeenCalledWith(
            activity.largerContainer.children[0],
            BIGGERBUTTON,
            BIGGERDISABLEBUTTON
        );
    });

    test("enables the larger-blocks icon below the maximum scale", async () => {
        const activity = makeActivity(DEFAULT_INDEX);
        const controller = setupBlockScaleController(activity);

        await controller.setSmallerLargerStatus();

        expect(global.changeImage).toHaveBeenCalledWith(
            activity.largerContainer.children[0],
            BIGGERDISABLEBUTTON,
            BIGGERBUTTON
        );
    });
});
