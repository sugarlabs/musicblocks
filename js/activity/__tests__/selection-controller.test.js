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

const { setupSelectionController, SelectionController } = require("../selection-controller.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBlock({
    x = 0,
    y = 0,
    width = 10,
    height = 10,
    isClamp = false,
    disconnected = true
} = {}) {
    return {
        container: { x, y },
        width,
        height,
        isClampBlock: jest.fn(() => isClamp),
        isDisconnected: jest.fn(() => disconnected),
        connections: [],
        trash: false,
        blockIndex: 0
    };
}

/**
 * Builds a minimal activity mock. addEventListener records handlers by
 * event type so tests can invoke them directly, mirroring how the real
 * Activity.addEventListener wires up document-level listeners.
 */
function makeActivity() {
    const listeners = {};
    return {
        blocks: {
            blockList: [],
            isBlockMoving: false,
            setSelectedBlocks: jest.fn(),
            setSelection: jest.fn(),
            setSelectionToActivity: jest.fn(),
            unhighlightSelectedBlocks: jest.fn(),
            highlight: jest.fn(),
            sendStackToTrash: jest.fn(),
            selectionModeOn: false,
            selectedBlocks: [],
            activeBlock: null,
            pasteDx: 0,
            pasteDy: 0,
            prepareStackForCopy: jest.fn(),
            pasteStack: jest.fn()
        },
        turtles: {
            running: jest.fn(() => false)
        },
        blocksContainer: { x: 0, y: 0 },
        scrollBlockContainer: false,
        refreshCanvas: jest.fn(),
        textMsg: jest.fn(),
        moving: true,
        addEventListener: jest.fn((target, event, handler) => {
            listeners[event] = listeners[event] || [];
            listeners[event].push(handler);
        }),
        _listeners: listeners
    };
}

beforeEach(() => {
    document.body.innerHTML = '<div id="helpfulWheelDiv" style="display: block;"></div>';
});

// ---------------------------------------------------------------------------
// setupSelectionController
// ---------------------------------------------------------------------------

describe("setupSelectionController", () => {
    test("attaches a SelectionController instance and delegation stubs to activity", () => {
        const activity = makeActivity();
        setupSelectionController(activity);

        expect(activity.selectionController).toBeInstanceOf(SelectionController);
        expect(typeof activity.selectMode).toBe("function");
        expect(typeof activity.deleteMultipleBlocks).toBe("function");
        expect(typeof activity.copyMultipleBlocks).toBe("function");
        expect(typeof activity.deselectSelectedBlocks).toBe("function");
        expect(typeof activity._create2Ddrag).toBe("function");
        expect(typeof activity._createDrag).toBe("function");
        expect(typeof activity.setupMouseEvents).toBe("function");
        expect(typeof activity.drawSelectionArea).toBe("function");
        expect(typeof activity.selectBlocksInDragArea).toBe("function");
        expect(typeof activity.unhighlightSelectedBlocks).toBe("function");
        expect(typeof activity.rectanglesOverlap).toBe("function");
        expect(typeof activity.isEqual).toBe("function");
        expect(typeof activity.setSelectionMode).toBe("function");
    });

    test("initialises selection state to defaults", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const sc = activity.selectionController;

        expect(sc.isDragging).toBe(false);
        expect(sc.isSelecting).toBe(false);
        expect(sc.selectionModeOn).toBe(false);
        expect(sc.selectedBlocks).toEqual([]);
        expect(sc.hasMouseMoved).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// selectMode — selection mode toggle
// ---------------------------------------------------------------------------

describe("selectMode", () => {
    test("toggles isSelecting on and off, and messages the user", () => {
        const activity = makeActivity();
        setupSelectionController(activity);

        activity.selectMode();
        expect(activity.selectionController.isSelecting).toBe(true);
        expect(activity.textMsg).toHaveBeenCalledWith("Select is enabled.");

        activity.selectMode();
        expect(activity.selectionController.isSelecting).toBe(false);
        expect(activity.textMsg).toHaveBeenCalledWith("Select is disabled.");
    });

    test("resets the moving flag and hides the helpful wheel", () => {
        const activity = makeActivity();
        setupSelectionController(activity);

        activity.selectMode();

        expect(activity.moving).toBe(false);
        expect(document.getElementById("helpfulWheelDiv").style.display).toBe("none");
    });
});

// ---------------------------------------------------------------------------
// setupMouseEvents / _createDrag — drag rectangle creation
// ---------------------------------------------------------------------------

describe("setupMouseEvents and _createDrag", () => {
    test("registers a single mousedown listener on document", () => {
        const activity = makeActivity();
        setupSelectionController(activity);

        activity.setupMouseEvents();

        expect(activity.addEventListener).toHaveBeenCalledWith(
            document,
            "mousedown",
            expect.any(Function),
            false
        );
    });

    test("mousedown on the canvas while selecting starts a drag", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        activity.selectionController.isSelecting = true;

        activity.setupMouseEvents();
        const handler = activity._listeners.mousedown[0];

        handler({ target: { id: "myCanvas" }, clientX: 15, clientY: 25 });

        expect(activity.selectionController.isDragging).toBe(true);
        expect(activity.selectionController.startX).toBe(15);
        expect(activity.selectionController.startY).toBe(25);
    });

    test("mousedown is ignored when not in selecting mode", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        activity.selectionController.isSelecting = false;

        activity.setupMouseEvents();
        const handler = activity._listeners.mousedown[0];

        handler({ target: { id: "myCanvas" }, clientX: 15, clientY: 25 });

        expect(activity.selectionController.isDragging).toBe(false);
    });

    test("mousedown outside the canvas does not start a drag", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        activity.selectionController.isSelecting = true;

        activity.setupMouseEvents();
        const handler = activity._listeners.mousedown[0];

        handler({ target: { id: "somethingElse" }, clientX: 15, clientY: 25 });

        expect(activity.selectionController.isDragging).toBe(false);
    });

    test("_createDrag sets isDragging and captures the start position directly", () => {
        const activity = makeActivity();
        setupSelectionController(activity);

        activity._createDrag({ clientX: 42, clientY: 84 });

        const sc = activity.selectionController;
        expect(sc.isDragging).toBe(true);
        expect(sc.startX).toBe(42);
        expect(sc.startY).toBe(84);
    });
});

// ---------------------------------------------------------------------------
// drawSelectionArea — selection rectangle drawing
// ---------------------------------------------------------------------------

describe("drawSelectionArea", () => {
    test("computes a normalized rectangle regardless of drag direction", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const sc = activity.selectionController;

        activity._create2Ddrag();
        sc.startX = 100;
        sc.startY = 100;
        sc.currentX = 50;
        sc.currentY = 40;

        activity.drawSelectionArea();

        expect(sc.dragArea).toEqual({ x: 50, y: 40, width: 50, height: 60 });
    });

    test("writes the computed rectangle to the selectionArea element style", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const sc = activity.selectionController;

        activity._create2Ddrag();
        sc.startX = 10;
        sc.startY = 10;
        sc.currentX = 30;
        sc.currentY = 40;

        activity.drawSelectionArea();

        expect(sc.selectionArea.style.left).toBe("10px");
        expect(sc.selectionArea.style.top).toBe("10px");
        expect(sc.selectionArea.style.width).toBe("20px");
        expect(sc.selectionArea.style.height).toBe("30px");
        expect(sc.selectionArea.style.display).toBe("flex");
    });
});

// ---------------------------------------------------------------------------
// rectanglesOverlap / isEqual — helper utilities
// ---------------------------------------------------------------------------

describe("rectanglesOverlap", () => {
    let activity;
    beforeEach(() => {
        activity = makeActivity();
        setupSelectionController(activity);
    });

    test("returns true when rectangles overlap", () => {
        const rect1 = { x: 0, y: 0, width: 10, height: 10 };
        const rect2 = { x: 5, y: 5, width: 10, height: 10 };
        expect(activity.rectanglesOverlap(rect1, rect2)).toBe(true);
    });

    test("returns false when rectangles are disjoint", () => {
        const rect1 = { x: 0, y: 0, width: 10, height: 10 };
        const rect2 = { x: 20, y: 20, width: 10, height: 10 };
        expect(activity.rectanglesOverlap(rect1, rect2)).toBe(false);
    });

    test("returns false when rectangles only touch at an edge", () => {
        const rect1 = { x: 0, y: 0, width: 10, height: 10 };
        const rect2 = { x: 10, y: 0, width: 10, height: 10 };
        expect(activity.rectanglesOverlap(rect1, rect2)).toBe(false);
    });

    test("returns true when one rectangle contains another", () => {
        const rect1 = { x: 0, y: 0, width: 100, height: 100 };
        const rect2 = { x: 10, y: 10, width: 5, height: 5 };
        expect(activity.rectanglesOverlap(rect1, rect2)).toBe(true);
    });
});

describe("isEqual", () => {
    test("returns true for identical references", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const obj = { a: 1 };
        expect(activity.isEqual(obj, obj)).toBe(true);
    });

    test("returns false for distinct objects with the same shape", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        expect(activity.isEqual({ a: 1 }, { a: 1 })).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// selectBlocksInDragArea — selecting blocks inside the drag area
// ---------------------------------------------------------------------------

describe("selectBlocksInDragArea", () => {
    test("selects only blocks whose container rectangle overlaps the drag area", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const inside = makeBlock({ x: 5, y: 5, width: 10, height: 10 });
        const outside = makeBlock({ x: 200, y: 200, width: 10, height: 10 });
        activity.blocks.blockList = [inside, outside];

        activity.selectionController.dragArea = { x: 0, y: 0, width: 20, height: 20 };

        const result = activity.selectBlocksInDragArea();

        expect(result).toEqual([inside]);
    });

    test("offsets block x-position by blocksContainer.x when scrollBlockContainer is true", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        activity.scrollBlockContainer = true;
        activity.blocksContainer = { x: 100, y: 0 };
        const block = makeBlock({ x: -95, y: 5, width: 10, height: 10 });
        activity.blocks.blockList = [block];

        // Without the offset this block would sit at x=-95 and miss the drag
        // area entirely; with the offset it lands at x=5, inside it.
        activity.selectionController.dragArea = { x: 0, y: 0, width: 20, height: 20 };

        const result = activity.selectBlocksInDragArea();

        expect(result).toEqual([block]);
    });

    test("returns an empty array when no blocks overlap", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        activity.blocks.blockList = [makeBlock({ x: 500, y: 500 })];
        activity.selectionController.dragArea = { x: 0, y: 0, width: 20, height: 20 };

        expect(activity.selectBlocksInDragArea()).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// unhighlightSelectedBlocks
// ---------------------------------------------------------------------------

describe("unhighlightSelectedBlocks", () => {
    test("highlights selected blocks found in blockList when unhighlight is false", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const block = makeBlock();
        activity.blocks.blockList = [block];
        activity.selectionController.selectedBlocks = [block];

        activity.unhighlightSelectedBlocks(false, true);

        expect(activity.blocks.highlight).toHaveBeenCalledWith(0, true);
        expect(activity.refreshCanvas).toHaveBeenCalled();
    });

    test("unhighlights selected blocks when unhighlight is true, without a repaint", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const block = makeBlock();
        activity.blocks.blockList = [block];
        activity.selectionController.selectedBlocks = [block];

        activity.unhighlightSelectedBlocks(true, true);

        expect(activity.blocks.unhighlightSelectedBlocks).toHaveBeenCalledWith(0, true);
        expect(activity.refreshCanvas).not.toHaveBeenCalled();
    });

    test("skips selected blocks no longer present in blockList", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const stale = makeBlock();
        activity.blocks.blockList = [];
        activity.selectionController.selectedBlocks = [stale];

        expect(() => activity.unhighlightSelectedBlocks(true, true)).not.toThrow();
        expect(activity.blocks.unhighlightSelectedBlocks).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// setSelectionMode / deselectSelectedBlocks
// ---------------------------------------------------------------------------

describe("setSelectionMode", () => {
    test("turning selection on clears selectedBlocks and notifies blocks", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        activity.selectionController.selectedBlocks = [makeBlock()];

        activity.setSelectionMode(true);

        expect(activity.selectionController.selectionModeOn).toBe(true);
        expect(activity.selectionController.selectedBlocks).toEqual([]);
        expect(activity.blocks.setSelection).toHaveBeenCalledWith(true);
    });

    test("does nothing when re-enabling selection mode with no selected blocks", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        // selectionModeOn is already false and selectedBlocks is already empty
        activity.setSelectionMode(true);

        expect(activity.selectionController.selectionModeOn).toBe(false);
        expect(activity.blocks.setSelection).not.toHaveBeenCalled();
    });

    test("turning selection off clears state even if it was already off", () => {
        const activity = makeActivity();
        setupSelectionController(activity);

        activity.setSelectionMode(false);

        expect(activity.selectionController.selectionModeOn).toBe(false);
        expect(activity.blocks.setSelection).toHaveBeenCalledWith(false);
    });
});

describe("deselectSelectedBlocks", () => {
    test("highlights currently selected blocks and turns off selection mode", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const block = makeBlock();
        activity.blocks.blockList = [block];
        activity.selectionController.selectedBlocks = [block];
        activity.selectionController.selectionModeOn = true;

        activity.deselectSelectedBlocks();

        expect(activity.blocks.highlight).toHaveBeenCalledWith(0, true);
        expect(activity.selectionController.selectionModeOn).toBe(false);
        expect(activity.selectionController.selectedBlocks).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// deleteMultipleBlocks — deleting multiple selected blocks
// ---------------------------------------------------------------------------

describe("deleteMultipleBlocks", () => {
    test("sends clamp and disconnected blocks to the trash and resets selection", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const clampBlock = makeBlock({ isClamp: true, disconnected: false });
        const nonClampBlock = makeBlock({ isClamp: false, disconnected: true });
        activity.blocks.selectionModeOn = true;
        activity.blocks.selectedBlocks = [clampBlock, nonClampBlock];

        activity.deleteMultipleBlocks();

        expect(activity.blocks.sendStackToTrash).toHaveBeenCalledWith(clampBlock);
        expect(activity.blocks.sendStackToTrash).toHaveBeenCalledWith(nonClampBlock);
        expect(activity.blocks.setSelectionToActivity).toHaveBeenCalledWith(false);
        expect(activity.refreshCanvas).toHaveBeenCalled();
        expect(document.getElementById("helpfulWheelDiv").style.display).toBe("none");
    });

    test("does nothing when selection mode is off", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        activity.blocks.selectionModeOn = false;
        activity.blocks.selectedBlocks = [makeBlock()];

        activity.deleteMultipleBlocks();

        expect(activity.blocks.sendStackToTrash).not.toHaveBeenCalled();
    });

    test("ignores blocks that are neither clamp blocks nor disconnected", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const neither = makeBlock({ isClamp: false, disconnected: false });
        activity.blocks.selectionModeOn = true;
        activity.blocks.selectedBlocks = [neither];

        activity.deleteMultipleBlocks();

        expect(activity.blocks.sendStackToTrash).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// copyMultipleBlocks — copying multiple selected blocks
// ---------------------------------------------------------------------------

describe("copyMultipleBlocks", () => {
    test("pastes each independent selected block with increasing offsets", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const blockA = { blockIndex: 1, connections: [], trash: false };
        const blockB = { blockIndex: 2, connections: [], trash: false };
        activity.blocks.selectionModeOn = true;
        activity.blocks.selectedBlocks = [blockA, blockB];

        activity.copyMultipleBlocks();

        expect(activity.blocks.prepareStackForCopy).toHaveBeenCalledTimes(2);
        expect(activity.blocks.pasteStack).toHaveBeenCalledTimes(2);
        expect(activity.blocks.pasteDx).toBe(21); // last write: second block's dx
        expect(activity.blocks.pasteDy).toBe(21);
        expect(activity.selectionController.selectionModeOn).toBe(false);
        expect(activity.blocks.setSelectedBlocks).toHaveBeenCalledWith([]);
        expect(activity.refreshCanvas).toHaveBeenCalled();
    });

    test("skips blocks that are connected to another block already being copied, or trashed", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const parent = { blockIndex: 1, connections: [2], trash: false };
        const child = { blockIndex: 2, connections: [1], trash: false };
        const trashed = { blockIndex: 3, connections: [], trash: true };
        activity.blocks.selectionModeOn = true;
        activity.blocks.selectedBlocks = [parent, child, trashed];

        activity.copyMultipleBlocks();

        // parent is copied (its own stack includes the child); child is skipped
        // because it is itself in a connection reachable via map; trashed is
        // skipped outright.
        expect(activity.blocks.prepareStackForCopy).toHaveBeenCalledTimes(1);
    });

    test("does nothing when there are no selected blocks", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        activity.blocks.selectionModeOn = true;
        activity.blocks.selectedBlocks = [];

        activity.copyMultipleBlocks();

        expect(activity.blocks.prepareStackForCopy).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// _create2Ddrag — wiring, mouseup teardown, and rAF-throttled mousemove
// ---------------------------------------------------------------------------

describe("_create2Ddrag", () => {
    test("resets selection drag state and creates a fresh selectionArea element", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const sc = activity.selectionController;
        sc.selectedBlocks = [makeBlock()];
        sc.startX = 5;

        activity._create2Ddrag();

        expect(sc.selectedBlocks).toEqual([]);
        expect(sc.startX).toBe(0);
        expect(sc.hasMouseMoved).toBe(false);
        expect(sc.selectionArea).toBeInstanceOf(HTMLElement);
        expect(sc.selectionArea.parentNode).toBe(document.body);
    });

    test("removes a pre-existing selectionArea before creating a new one", () => {
        const activity = makeActivity();
        setupSelectionController(activity);
        const sc = activity.selectionController;

        activity._create2Ddrag();
        const first = sc.selectionArea;
        activity._create2Ddrag();

        expect(first.parentNode).toBeNull();
        expect(sc.selectionArea).not.toBe(first);
    });

    test("registers mousedown, mousemove and mouseup listeners on document", () => {
        const activity = makeActivity();
        setupSelectionController(activity);

        activity._create2Ddrag();

        expect(activity._listeners.mousedown).toHaveLength(1);
        expect(activity._listeners.mousemove).toHaveLength(1);
        expect(activity._listeners.mouseup).toHaveLength(1);
    });

    describe("mouseup teardown", () => {
        test("ends the drag, hides the selection box, and clears coordinates", () => {
            jest.useFakeTimers();
            const activity = makeActivity();
            setupSelectionController(activity);
            const sc = activity.selectionController;
            sc.isSelecting = true;
            sc.isDragging = true;

            activity._create2Ddrag();
            sc.startX = 10;
            sc.startY = 10;
            sc.currentX = 50;
            sc.currentY = 50;
            sc.hasMouseMoved = true;

            const mouseupHandler = activity._listeners.mouseup[0];
            mouseupHandler({});

            expect(sc.isDragging).toBe(false);
            expect(sc.selectionArea.style.display).toBe("none");
            expect(sc.startX).toBe(0);
            expect(sc.startY).toBe(0);
            expect(sc.currentX).toBe(0);
            expect(sc.currentY).toBe(0);
            // hasMouseMoved is reset asynchronously so a stray click right
            // after mouseup can still be recognised as "part of the drag".
            expect(sc.hasMouseMoved).toBe(true);
            jest.advanceTimersByTime(100);
            expect(sc.hasMouseMoved).toBe(false);
            jest.useRealTimers();
        });

        test("is a no-op when not in selecting mode", () => {
            const activity = makeActivity();
            setupSelectionController(activity);
            const sc = activity.selectionController;

            activity._create2Ddrag();
            sc.isSelecting = false;
            sc.isDragging = true;

            const mouseupHandler = activity._listeners.mouseup[0];
            mouseupHandler({});

            expect(sc.isDragging).toBe(true);
        });
    });

    describe("mousemove rAF throttling", () => {
        let originalRAF;

        beforeEach(() => {
            originalRAF = global.requestAnimationFrame;
        });

        afterEach(() => {
            global.requestAnimationFrame = originalRAF;
        });

        test("schedules at most one pending animation frame per burst of mousemove events", () => {
            const rafCallbacks = [];
            global.requestAnimationFrame = jest.fn(cb => rafCallbacks.push(cb));

            const activity = makeActivity();
            setupSelectionController(activity);
            const sc = activity.selectionController;
            sc.isSelecting = true;
            sc.isDragging = true;

            activity._create2Ddrag();
            const mousemoveHandler = activity._listeners.mousemove[0];

            mousemoveHandler({ clientX: 1, clientY: 1 });
            mousemoveHandler({ clientX: 2, clientY: 2 });
            mousemoveHandler({ clientX: 3, clientY: 3 });

            // Only one frame requested despite three mousemove events.
            expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
            expect(sc.hasMouseMoved).toBe(true);
            expect(sc.currentX).toBe(3);
            expect(sc.currentY).toBe(3);
        });

        test("running the pending frame applies the selection and allows scheduling the next one", () => {
            const rafCallbacks = [];
            global.requestAnimationFrame = jest.fn(cb => rafCallbacks.push(cb));

            const activity = makeActivity();
            setupSelectionController(activity);
            const sc = activity.selectionController;
            sc.isSelecting = true;
            sc.isDragging = true;
            const block = makeBlock({ x: 0, y: 0, width: 10, height: 10 });
            activity.blocks.blockList = [block];

            activity._create2Ddrag();
            const mousemoveHandler = activity._listeners.mousemove[0];

            mousemoveHandler({ clientX: 5, clientY: 5 });
            expect(sc._dragSelectRafPending).toBe(true);

            // Run the queued frame. selectionModeOn only flips on once
            // selectedBlocks is non-empty, so the first frame (starting from
            // the empty array _create2Ddrag reset it to) computes the
            // overlapping blocks but does not yet flip selectionModeOn.
            rafCallbacks[0]();

            expect(sc._dragSelectRafPending).toBe(false);
            expect(sc.selectionModeOn).toBe(false);
            expect(sc.selectedBlocks).toEqual([block]);
            expect(activity.blocks.setSelectedBlocks).toHaveBeenCalledWith(sc.selectedBlocks);

            // A new mousemove after the frame ran can schedule another one.
            mousemoveHandler({ clientX: 6, clientY: 6 });
            expect(global.requestAnimationFrame).toHaveBeenCalledTimes(2);

            // Second frame: selectedBlocks is now non-empty from the first
            // frame, so setSelectionMode(true) flips selectionModeOn on.
            rafCallbacks[1]();
            expect(sc.selectionModeOn).toBe(true);
        });

        test("does not schedule a frame while a block is already being moved", () => {
            global.requestAnimationFrame = jest.fn();
            const activity = makeActivity();
            setupSelectionController(activity);
            const sc = activity.selectionController;
            sc.isSelecting = true;
            sc.isDragging = true;
            activity.blocks.isBlockMoving = true;

            activity._create2Ddrag();
            const mousemoveHandler = activity._listeners.mousemove[0];
            mousemoveHandler({ clientX: 1, clientY: 1 });

            expect(global.requestAnimationFrame).not.toHaveBeenCalled();
        });

        test("does not schedule a frame while turtles are running", () => {
            global.requestAnimationFrame = jest.fn();
            const activity = makeActivity();
            setupSelectionController(activity);
            const sc = activity.selectionController;
            sc.isSelecting = true;
            sc.isDragging = true;
            activity.turtles.running = jest.fn(() => true);

            activity._create2Ddrag();
            const mousemoveHandler = activity._listeners.mousemove[0];
            mousemoveHandler({ clientX: 1, clientY: 1 });

            expect(global.requestAnimationFrame).not.toHaveBeenCalled();
        });

        test("does nothing on mousemove when not dragging", () => {
            global.requestAnimationFrame = jest.fn();
            const activity = makeActivity();
            setupSelectionController(activity);
            const sc = activity.selectionController;
            sc.isSelecting = false;
            sc.isDragging = false;

            activity._create2Ddrag();
            const mousemoveHandler = activity._listeners.mousemove[0];
            mousemoveHandler({ clientX: 1, clientY: 1 });

            expect(sc.hasMouseMoved).toBe(true);
            expect(global.requestAnimationFrame).not.toHaveBeenCalled();
        });
    });
});
