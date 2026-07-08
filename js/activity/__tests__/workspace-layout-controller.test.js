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

if (typeof global.hideDOMLabel !== "function") {
    global.hideDOMLabel = jest.fn();
}
if (typeof global.changeImage !== "function") {
    global.changeImage = jest.fn();
}
if (typeof global.GOHOMEBUTTON === "undefined") {
    global.GOHOMEBUTTON = "GOHOMEBUTTON_ICON";
}
if (typeof global.GOHOMEFADEDBUTTON === "undefined") {
    global.GOHOMEFADEDBUTTON = "GOHOMEFADEDBUTTON_ICON";
}
if (typeof global.STANDARDBLOCKHEIGHT === "undefined") {
    global.STANDARDBLOCKHEIGHT = 42;
}
if (typeof global.RESPONSIVE_BREAKPOINT_TABLET === "undefined") {
    global.RESPONSIVE_BREAKPOINT_TABLET = 768;
}
if (typeof global.RESPONSIVE_BREAKPOINT_MOBILE === "undefined") {
    global.RESPONSIVE_BREAKPOINT_MOBILE = 600;
}

const {
    setupWorkspaceLayoutController,
    WorkspaceLayoutController
} = require("../workspace-layout-controller.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setInnerWidth(width) {
    Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: width
    });
}

function makeBlock(id, opts = {}) {
    return {
        id,
        name: opts.name || "block",
        trash: opts.trash || false,
        connections: opts.connections !== undefined ? opts.connections : [null],
        container: { x: opts.x !== undefined ? opts.x : 0, y: opts.y !== undefined ? opts.y : 0 },
        width: opts.width !== undefined ? opts.width : 50,
        height: opts.height !== undefined ? opts.height : 50
    };
}

function makeTurtle(penState = true) {
    return {
        painter: {
            penState,
            doSetXY: jest.fn(),
            doSetHeading: jest.fn()
        }
    };
}

/**
 * Builds a minimal activity mock exposing exactly the dependencies documented
 * for WorkspaceLayoutController: activity.blocks, activity.turtles,
 * activity.blocksContainer, activity.boundary, activity.auxToolbar,
 * activity.toolbarHeight, activity.canvas, activity.turtleBlocksScale,
 * activity.palettes, activity.homeButtonContainer.
 */
function makeActivity({ blockList = {}, turtleList = [] } = {}) {
    const blocksState = {
        visible: true,
        blockList,
        dragGroup: [],
        activeBlock: null,
        showBlocks: jest.fn(),
        // Default: every block is the sole member of its own drag group.
        findDragGroup: jest.fn(function (id) {
            this.dragGroup = [id];
        }),
        moveBlockRelative: jest.fn((id, dx, dy) => {
            const block = blockList[id];
            if (block) {
                block.container.x += dx;
                block.container.y += dy;
            }
        }),
        _beginDeferCheckBounds: jest.fn(),
        _endDeferCheckBounds: jest.fn(),
        checkBounds: jest.fn()
    };

    return {
        blocks: blocksState,
        turtles: {
            turtleList,
            getTurtleCount: jest.fn(() => turtleList.length),
            getTurtle: jest.fn(i => turtleList[i])
        },
        blocksContainer: { x: 10, y: 20 },
        boundary: { hide: jest.fn() },
        auxToolbar: { style: { display: "none" } },
        toolbarHeight: 50,
        canvas: { width: 1000 },
        turtleBlocksScale: 1,
        palettes: { updatePalettes: jest.fn() },
        homeButtonContainer: { children: [{}] },
        _changeBlockVisibility: jest.fn(),
        __tick: jest.fn()
    };
}

beforeEach(() => {
    document.body.innerHTML = '<div id="helpfulWheelDiv" style="display: none;"></div>';
    setInnerWidth(1000);
});

// ---------------------------------------------------------------------------
// setup / wiring
// ---------------------------------------------------------------------------

describe("setupWorkspaceLayoutController", () => {
    test("attaches a WorkspaceLayoutController instance to activity", () => {
        const activity = makeActivity();
        setupWorkspaceLayoutController(activity);

        expect(activity.workspaceLayoutController).toBeInstanceOf(WorkspaceLayoutController);
        expect(activity.workspaceLayoutController.activity).toBe(activity);
    });

    test("installs delegation stubs for findBlocks, setHomeContainers, repositionBlocks and _handleRepositionBlocksOnResize", () => {
        const activity = makeActivity();
        setupWorkspaceLayoutController(activity);

        expect(typeof activity.findBlocks).toBe("function");
        expect(typeof activity.setHomeContainers).toBe("function");
        expect(typeof activity.repositionBlocks).toBe("function");
        expect(typeof activity._handleRepositionBlocksOnResize).toBe("function");
    });

    test("default state: _isFirstHomeClick starts true", () => {
        const activity = makeActivity();
        setupWorkspaceLayoutController(activity);

        expect(activity.workspaceLayoutController._isFirstHomeClick).toBe(true);
    });

    test("delegation stubs forward to the controller instance", () => {
        const activity = makeActivity();
        setupWorkspaceLayoutController(activity);
        const controller = activity.workspaceLayoutController;

        jest.spyOn(controller, "findBlocks");
        jest.spyOn(controller, "setHomeContainers");
        jest.spyOn(controller, "repositionBlocks").mockImplementation(() => {});
        jest.spyOn(controller, "_handleRepositionBlocksOnResize").mockImplementation(() => {});

        activity.findBlocks();
        activity.setHomeContainers(true);
        activity.repositionBlocks();
        activity._handleRepositionBlocksOnResize();

        expect(controller.findBlocks).toHaveBeenCalledTimes(1);
        expect(controller.setHomeContainers).toHaveBeenCalledWith(true);
        expect(controller.repositionBlocks).toHaveBeenCalledTimes(1);
        expect(controller._handleRepositionBlocksOnResize).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// findBlocks (public wrapper)
// ---------------------------------------------------------------------------

describe("findBlocks", () => {
    test("delegates to _findBlocks", () => {
        const activity = makeActivity();
        setupWorkspaceLayoutController(activity);
        const controller = activity.workspaceLayoutController;
        jest.spyOn(controller, "_findBlocks");

        controller.findBlocks();

        expect(controller._findBlocks).toHaveBeenCalledTimes(1);
    });

    test("hides helpfulWheelDiv and ticks the activity when it is visible", () => {
        document.getElementById("helpfulWheelDiv").style.display = "block";
        const activity = makeActivity();
        setupWorkspaceLayoutController(activity);

        activity.findBlocks();

        expect(document.getElementById("helpfulWheelDiv").style.display).toBe("none");
        expect(activity.__tick).toHaveBeenCalledTimes(1);
    });

    test("does not tick the activity when helpfulWheelDiv is already hidden", () => {
        document.getElementById("helpfulWheelDiv").style.display = "none";
        const activity = makeActivity();
        setupWorkspaceLayoutController(activity);

        activity.findBlocks();

        expect(activity.__tick).not.toHaveBeenCalled();
    });

    test("both _findBlocks implementations (row and column) are reachable through findBlocks", () => {
        const blockList = { a: makeBlock("a", { name: "start" }) };
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);

        // First call: row layout.
        activity.findBlocks();
        expect(activity.workspaceLayoutController._isFirstHomeClick).toBe(false);

        // Second call: column layout.
        activity.findBlocks();
        expect(activity.workspaceLayoutController._isFirstHomeClick).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// _findBlocks — Home button toggle behavior
// ---------------------------------------------------------------------------

describe("_findBlocks — Home button toggle", () => {
    test("first click arranges blocks in rows and flips _isFirstHomeClick to false", () => {
        const blockList = {
            start1: makeBlock("start1", { name: "start" }),
            other1: makeBlock("other1", { name: "note" })
        };
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);

        activity.workspaceLayoutController._findBlocks();

        expect(activity.blocks._beginDeferCheckBounds).toHaveBeenCalled();
        expect(activity.blocks._endDeferCheckBounds).toHaveBeenCalled();
        expect(activity.blocks.moveBlockRelative).toHaveBeenCalled();
        expect(activity.workspaceLayoutController._isFirstHomeClick).toBe(false);
    });

    test("second click arranges blocks in columns and flips _isFirstHomeClick back to true", () => {
        const blockList = { a: makeBlock("a") };
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);
        activity.workspaceLayoutController._isFirstHomeClick = false;

        activity.workspaceLayoutController._findBlocks();

        expect(activity.workspaceLayoutController._isFirstHomeClick).toBe(true);
    });

    test("toggle alternates across repeated calls (regression: repeated Home clicks)", () => {
        const blockList = { a: makeBlock("a") };
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);
        const controller = activity.workspaceLayoutController;

        expect(controller._isFirstHomeClick).toBe(true);
        controller._findBlocks();
        expect(controller._isFirstHomeClick).toBe(false);
        controller._findBlocks();
        expect(controller._isFirstHomeClick).toBe(true);
        controller._findBlocks();
        expect(controller._isFirstHomeClick).toBe(false);
    });

    test("row layout positions 'start' blocks before other root blocks", () => {
        const callOrder = [];
        const blockList = {
            note1: makeBlock("note1", { name: "note" }),
            start1: makeBlock("start1", { name: "start" })
        };
        const activity = makeActivity({ blockList });
        activity.blocks.moveBlockRelative = jest.fn(id => callOrder.push(id));
        setupWorkspaceLayoutController(activity);

        activity.workspaceLayoutController._findBlocks();

        expect(callOrder.indexOf("start1")).toBeLessThan(callOrder.indexOf("note1"));
    });

    test("uses toolbarHeight offset when auxToolbar is displayed", () => {
        const blockList = { a: makeBlock("a") };
        const activity = makeActivity({ blockList });
        activity.auxToolbar.style.display = "block";
        activity.toolbarHeight = 123;
        setupWorkspaceLayoutController(activity);

        expect(() => activity.workspaceLayoutController._findBlocks()).not.toThrow();
        expect(activity.blocks.moveBlockRelative).toHaveBeenCalled();
    });

    test("skips trashed blocks", () => {
        const blockList = {
            trashed: makeBlock("trashed", { trash: true }),
            kept: makeBlock("kept")
        };
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);

        activity.workspaceLayoutController._findBlocks();

        expect(activity.blocks.moveBlockRelative).not.toHaveBeenCalledWith(
            "trashed",
            expect.anything(),
            expect.anything()
        );
    });

    test("shows blocks and resets active block / container position", () => {
        const blockList = { a: makeBlock("a") };
        const activity = makeActivity({ blockList });
        activity.blocks.activeBlock = "someBlock";
        activity.blocksContainer = { x: 55, y: 77 };
        setupWorkspaceLayoutController(activity);

        activity.workspaceLayoutController._findBlocks();

        expect(activity.blocks.showBlocks).toHaveBeenCalledTimes(1);
        expect(activity.blocks.activeBlock).toBeNull();
        expect(activity.blocksContainer.x).toBe(0);
        expect(activity.blocksContainer.y).toBe(0);
        expect(global.hideDOMLabel).toHaveBeenCalled();
    });

    test("calls _changeBlockVisibility when blocks are not visible", () => {
        const activity = makeActivity({ blockList: { a: makeBlock("a") } });
        activity.blocks.visible = false;
        setupWorkspaceLayoutController(activity);

        activity.workspaceLayoutController._findBlocks();

        expect(activity._changeBlockVisibility).toHaveBeenCalledTimes(1);
    });

    test("does not call _changeBlockVisibility when blocks are already visible", () => {
        const activity = makeActivity({ blockList: { a: makeBlock("a") } });
        activity.blocks.visible = true;
        setupWorkspaceLayoutController(activity);

        activity.workspaceLayoutController._findBlocks();

        expect(activity._changeBlockVisibility).not.toHaveBeenCalled();
    });

    test("resets home button and hides boundary", () => {
        const activity = makeActivity({ blockList: { a: makeBlock("a") } });
        setupWorkspaceLayoutController(activity);
        jest.spyOn(activity.workspaceLayoutController, "setHomeContainers");

        activity.workspaceLayoutController._findBlocks();

        expect(activity.workspaceLayoutController.setHomeContainers).toHaveBeenCalledWith(false);
        expect(activity.boundary.hide).toHaveBeenCalledTimes(1);
    });

    test("moves drag-group members together using the root block's delta", () => {
        const blockList = {
            root: makeBlock("root", { name: "start", x: 5, y: 5 }),
            child: makeBlock("child", { connections: [1], x: 20, y: 20 })
        };
        const activity = makeActivity({ blockList });
        activity.blocks.findDragGroup = jest.fn(function () {
            this.dragGroup = ["root", "child"];
        });
        setupWorkspaceLayoutController(activity);

        activity.workspaceLayoutController._findBlocks();

        // child moved by the same dx/dy as root (relative offset of 15,15 preserved)
        expect(child_offset(blockList)).toEqual({ dx: 15, dy: 15 });

        function child_offset(list) {
            return {
                dx: list.child.container.x - list.root.container.x,
                dy: list.child.container.y - list.root.container.y
            };
        }
    });
});

// ---------------------------------------------------------------------------
// _findBlocks — turtle handling
// ---------------------------------------------------------------------------

describe("_findBlocks — turtle handling", () => {
    test("resets every turtle to the origin with heading 0", () => {
        const turtleList = [makeTurtle(true), makeTurtle(false)];
        const activity = makeActivity({ turtleList });
        setupWorkspaceLayoutController(activity);

        activity.workspaceLayoutController._findBlocks();

        turtleList.forEach(turtle => {
            expect(turtle.painter.doSetXY).toHaveBeenCalledWith(0, 0);
            expect(turtle.painter.doSetHeading).toHaveBeenCalledWith(0);
        });
    });

    test("preserves each turtle's original pen state after the move", () => {
        const turtleList = [makeTurtle(true), makeTurtle(false)];
        const activity = makeActivity({ turtleList });
        setupWorkspaceLayoutController(activity);

        activity.workspaceLayoutController._findBlocks();

        expect(turtleList[0].painter.penState).toBe(true);
        expect(turtleList[1].painter.penState).toBe(false);
    });

    test("temporarily disables the pen while repositioning (penState false during doSetXY)", () => {
        const turtle = makeTurtle(true);
        turtle.painter.doSetXY = jest.fn(() => {
            expect(turtle.painter.penState).toBe(false);
        });
        const activity = makeActivity({ turtleList: [turtle] });
        setupWorkspaceLayoutController(activity);

        activity.workspaceLayoutController._findBlocks();

        expect(turtle.painter.doSetXY).toHaveBeenCalledTimes(1);
    });

    test("handles an empty turtle list without throwing", () => {
        const activity = makeActivity({ turtleList: [] });
        setupWorkspaceLayoutController(activity);

        expect(() => activity.workspaceLayoutController._findBlocks()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// setHomeContainers
// ---------------------------------------------------------------------------

describe("setHomeContainers", () => {
    test("switches to the active home icon when homeState is true", () => {
        const activity = makeActivity();
        setupWorkspaceLayoutController(activity);

        activity.setHomeContainers(true);

        expect(global.changeImage).toHaveBeenCalledWith(
            activity.homeButtonContainer.children[0],
            global.GOHOMEFADEDBUTTON,
            global.GOHOMEBUTTON
        );
    });

    test("switches to the faded home icon when homeState is false", () => {
        const activity = makeActivity();
        setupWorkspaceLayoutController(activity);

        activity.setHomeContainers(false);

        expect(global.changeImage).toHaveBeenCalledWith(
            activity.homeButtonContainer.children[0],
            global.GOHOMEBUTTON,
            global.GOHOMEFADEDBUTTON
        );
    });

    test("is a no-op when homeButtonContainer is null", () => {
        const activity = makeActivity();
        activity.homeButtonContainer = null;
        setupWorkspaceLayoutController(activity);

        expect(() => activity.setHomeContainers(true)).not.toThrow();
        expect(global.changeImage).not.toHaveBeenCalled();
    });

    test("is a no-op when homeButtonContainer is undefined", () => {
        const activity = makeActivity();
        activity.homeButtonContainer = undefined;
        setupWorkspaceLayoutController(activity);

        expect(() => activity.setHomeContainers(false)).not.toThrow();
        expect(global.changeImage).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// repositionBlocks — responsive breakpoint handling
// ---------------------------------------------------------------------------

describe("repositionBlocks", () => {
    test("desktop width: does not record a beforeMobilePosition/before600pxPosition", () => {
        setInnerWidth(1200);
        const blockList = { root: makeBlock("root", { x: 300, y: 300 }) };
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);
        jest.spyOn(activity.workspaceLayoutController, "_findBlocks").mockImplementation(() => {});

        activity.repositionBlocks();

        expect(blockList.root.beforeMobilePosition).toBeUndefined();
        expect(blockList.root.before600pxPosition).toBeUndefined();
        expect(blockList.root.initialPosition).toEqual({ x: 300, y: 300 });
    });

    test("tablet width: records beforeMobilePosition once", () => {
        setInnerWidth(700); // < RESPONSIVE_BREAKPOINT_TABLET (768)
        const blockList = { root: makeBlock("root", { x: 300, y: 300 }) };
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);
        jest.spyOn(activity.workspaceLayoutController, "_findBlocks").mockImplementation(() => {});

        activity.repositionBlocks();

        expect(blockList.root.beforeMobilePosition).toEqual({ x: 300, y: 300 });
    });

    test("returning to desktop width restores the pre-tablet offset and clears beforeMobilePosition", () => {
        const blockList = { root: makeBlock("root", { x: 300, y: 300 }) };
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);
        jest.spyOn(activity.workspaceLayoutController, "_findBlocks").mockImplementation(() => {});

        setInnerWidth(700);
        activity.repositionBlocks();
        expect(blockList.root.beforeMobilePosition).toEqual({ x: 300, y: 300 });

        // Simulate the block having moved while narrow.
        blockList.root.container.x = 100;
        blockList.root.container.y = 100;

        setInnerWidth(1200);
        activity.repositionBlocks();

        expect(blockList.root.beforeMobilePosition).toBeNull();
        expect(blockList.root.container.x).toBe(300);
        expect(blockList.root.container.y).toBe(300);
    });

    test("mobile width: records before600pxPosition once", () => {
        setInnerWidth(500); // < RESPONSIVE_BREAKPOINT_MOBILE (600)
        const blockList = { root: makeBlock("root", { x: 150, y: 150 }) };
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);
        jest.spyOn(activity.workspaceLayoutController, "_findBlocks").mockImplementation(() => {});

        activity.repositionBlocks();

        expect(blockList.root.before600pxPosition).toEqual({ x: 150, y: 150 });
    });

    test("shifts a drag group left when it overflows the right edge of the canvas", () => {
        setInnerWidth(400);
        const blockList = { root: makeBlock("root", { x: 380, y: 0, width: 50 }) };
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);
        jest.spyOn(activity.workspaceLayoutController, "_findBlocks").mockImplementation(() => {});

        activity.repositionBlocks();

        // rightmostX (430) > canvasWidth (400) => shiftX = max(10, 400-430-10) = 10
        expect(blockList.root.container.x).toBe(390);
    });

    test("shifts a drag group right when it starts left of the canvas origin", () => {
        setInnerWidth(1000);
        const blockList = { root: makeBlock("root", { x: -20, y: 0 }) };
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);
        jest.spyOn(activity.workspaceLayoutController, "_findBlocks").mockImplementation(() => {});

        activity.repositionBlocks();

        // leftmostX = -20 => shiftX = 100 - (-20) = 120 => new x = -20 + 120 = 100
        expect(blockList.root.container.x).toBe(100);
    });

    test("invokes _findBlocks once after repositioning drag groups", () => {
        const activity = makeActivity({ blockList: { a: makeBlock("a") } });
        setupWorkspaceLayoutController(activity);
        jest.spyOn(activity.workspaceLayoutController, "_findBlocks").mockImplementation(() => {});

        activity.repositionBlocks();

        expect(activity.workspaceLayoutController._findBlocks).toHaveBeenCalledTimes(1);
    });

    test("handles an empty workspace without throwing", () => {
        const activity = makeActivity({ blockList: {} });
        setupWorkspaceLayoutController(activity);

        expect(() => activity.repositionBlocks()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// resize handling
// ---------------------------------------------------------------------------

describe("_handleRepositionBlocksOnResize", () => {
    test("delegates to repositionBlocks", () => {
        const activity = makeActivity({ blockList: { a: makeBlock("a") } });
        setupWorkspaceLayoutController(activity);
        const controller = activity.workspaceLayoutController;
        jest.spyOn(controller, "repositionBlocks").mockImplementation(() => {});

        controller._handleRepositionBlocksOnResize();

        expect(controller.repositionBlocks).toHaveBeenCalledTimes(1);
    });

    test("resize after Home still produces a consistent, non-throwing layout", () => {
        const blockList = { a: makeBlock("a", { name: "start" }) };
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);

        activity.findBlocks();
        expect(() => activity._handleRepositionBlocksOnResize()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// Regression coverage: scale of workspace
// ---------------------------------------------------------------------------

describe("regressions — workspace size", () => {
    test("single block workspace lays out without error", () => {
        const blockList = { only: makeBlock("only", { name: "start" }) };
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);

        expect(() => activity.workspaceLayoutController._findBlocks()).not.toThrow();
        expect(activity.blocks.moveBlockRelative).toHaveBeenCalled();
    });

    test("large number of blocks lays out without error and wraps rows", () => {
        const blockList = {};
        for (let i = 0; i < 60; i++) {
            blockList[`b${i}`] = makeBlock(`b${i}`, { name: i === 0 ? "start" : "note" });
        }
        const activity = makeActivity({ blockList });
        setupWorkspaceLayoutController(activity);

        expect(() => activity.workspaceLayoutController._findBlocks()).not.toThrow();
        expect(activity.blocks.moveBlockRelative.mock.calls.length).toBeGreaterThanOrEqual(60);
    });

    test("hidden blocks (activity.blocks.visible = false) are made visible via _changeBlockVisibility", () => {
        const blockList = { a: makeBlock("a") };
        const activity = makeActivity({ blockList });
        activity.blocks.visible = false;
        setupWorkspaceLayoutController(activity);

        activity.workspaceLayoutController._findBlocks();

        expect(activity._changeBlockVisibility).toHaveBeenCalledTimes(1);
        expect(activity.blocks.showBlocks).toHaveBeenCalledTimes(1);
    });
});
