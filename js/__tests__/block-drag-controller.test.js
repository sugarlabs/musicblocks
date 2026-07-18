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

/**
 * @file Tests for BlockDragController, the module blocks.js delegates
 * block-dragging responsibilities to: drag-group computation, pointer-driven
 * block movement, and dock snapping.
 */

/* global jest, describe, it, expect, beforeEach */

global.DEFAULTBLOCKSCALE = 1.0;
global.STRINGLEN = 30;
global.TEXTWIDTH = 100;
global.delayExecution = jest.fn().mockResolvedValue(null);
global.getTextWidth = jest.fn().mockReturnValue(100);
global._ = jest.fn(str => str);
global.COLLAPSIBLES = ["repeat", "forever", "if"];
global.INLINECOLLAPSIBLES = ["newnote", "interval", "osctime"];

const { setupBlockDragController, BlockDragController } = require("../block-drag-controller");

// --- Minimal Blocks-manager stand-in ---
//
// blockMoved/findDragGroup/moveBlockRelative etc. only ever touch a handful
// of properties/methods on the host "blocks" object. Rather than booting a
// full Blocks instance (see blocks.test.js for that), we build a minimal
// stand-in exposing exactly what BlockDragController needs, and mock out
// the sibling subsystems (widgets, action renaming, palette) that blockMoved
// calls into but that are not part of the dragging behavior under test.
function makeBlocks(blockList) {
    const blocks = {
        blockList,
        blockScale: 1.0,
        dragGroup: [],
        _cachedDragGroup: null,
        _dragActiveGroup: null,
        dragLoopCounter: 0,
        isBlockMoving: false,
        inLongPress: false,
        clampBlocksToCheck: [],
        _checkTwoArgBlocks: [],
        _deferCheckBoundsCount: 0,
        _checkBoundsPending: false,
        activity: {
            refreshCanvas: jest.fn(),
            errorMsg: jest.fn(),
            palettes: { dict: { action: { protoList: [], hideMenu: jest.fn() } } },
            turtles: { running: jest.fn().mockReturnValue(false) },
            logo: { doStopTurtles: jest.fn() }
        },
        protoBlockDict: {},

        // Real dock-type validation (the actual snapping rule set),
        // mirrored from blocks.js so tests exercise genuine compatibility
        // checks rather than a stub.
        _testConnectionType: (type1, type2) =>
            new Set(["in:out", "out:in", "numberin:numberout", "numberout:numberin"]).has(
                type1 + ":" + type2
            ),

        // Full-scan fallback identical to the real _getNearbyBlocks when the
        // spatial grid has not been populated.
        _getNearbyBlocks: () => blockList.map((_b, i) => i),
        _updateSpatialGrid: jest.fn(),
        _beginDeferCheckBounds: jest.fn(),
        _endDeferCheckBounds: jest.fn(),
        scheduleCheckBounds: jest.fn(),
        adjustDocks: jest.fn(),
        raiseStackToTop: jest.fn(),
        findTopBlock: jest.fn(blk => blk),
        findBottomBlock: jest.fn(blk => blk),
        insideExpandableBlock: jest.fn(() => null),
        _insideNoteBlock: jest.fn(() => null),
        addDefaultBlock: jest.fn(),
        adjustExpandableClampBlock: jest.fn(),
        _countBlocksInStack: jest.fn(() => 1),
        _addRemoveVspaceBlock: jest.fn(),
        _adjustExpandableTwoArgBlock: jest.fn(),
        sendStackToTrash: jest.fn(),
        findUniqueActionName: jest.fn(v => v),
        newNameddoBlock: jest.fn(),
        renameNameddos: jest.fn(),
        renameDos: jest.fn(),
        newStorein2Block: jest.fn(),
        newNamedboxBlock: jest.fn(),
        actionMetadata: jest.fn(() => ({ hasReturn: false, hasArgs: false })),
        setActionProtoVisibility: jest.fn(),
        deletePreviousDefault: jest.fn(),
        deleteNextDefault: jest.fn(),
        reInitWidget: jest.fn(),
        _getBlockSize: jest.fn(() => 1)
    };

    setupBlockDragController(blocks);
    return blocks;
}

// A minimal flow-style block: one "in" dock (its own top connector) plus
// zero or more "out" docks it offers to blocks connecting beneath it.
function makeFlowBlock({ x, y, docks, connections, name = "flow" }) {
    return {
        name,
        trash: false,
        inCollapsed: false,
        collapsed: false,
        container: { x, y },
        docks,
        connections,
        isArgBlock: () => false,
        isArgumentLikeBlock: () => false,
        isArgFlowClampBlock: () => false,
        isInlineCollapsible: () => false,
        highlight: jest.fn(),
        unhighlight: jest.fn()
    };
}

describe("BlockDragController", () => {
    describe("setupBlockDragController", () => {
        it("attaches a BlockDragController instance and delegation stubs", () => {
            const blocks = makeBlocks([]);

            expect(blocks.blockDragController).toBeInstanceOf(BlockDragController);
            expect(typeof blocks.findDragGroup).toBe("function");
            expect(typeof blocks.cacheDragGroup).toBe("function");
            expect(typeof blocks.clearCachedDragGroup).toBe("function");
            expect(typeof blocks.moveBlockRelative).toBe("function");
            expect(typeof blocks.moveBlockRelativeBatched).toBe("function");
            expect(typeof blocks.moveStackRelative).toBe("function");
            expect(typeof blocks.blockMoved).toBe("function");
        });
    });

    describe("drag group computation (multiple block dragging)", () => {
        it("collects a single, unconnected block as a drag group of one", () => {
            const blockList = [
                makeFlowBlock({ x: 0, y: 0, docks: [[0, 0, "in"]], connections: [null] })
            ];
            const blocks = makeBlocks(blockList);

            blocks.findDragGroup(0);

            expect(blocks.dragGroup).toEqual([0]);
        });

        it("walks the full connection chain so a stack of blocks drags together", () => {
            // Three flow blocks chained: 0 -> 1 -> 2 (each connects to the next via
            // connections[1]).
            const blockList = [
                makeFlowBlock({
                    x: 0,
                    y: 0,
                    docks: [
                        [0, 0, "in"],
                        [0, 20, "out"]
                    ],
                    connections: [null, 1]
                }),
                makeFlowBlock({
                    x: 0,
                    y: 20,
                    docks: [
                        [0, 0, "in"],
                        [0, 20, "out"]
                    ],
                    connections: [0, 2]
                }),
                makeFlowBlock({
                    x: 0,
                    y: 40,
                    docks: [[0, 0, "in"]],
                    connections: [1]
                })
            ];
            const blocks = makeBlocks(blockList);

            blocks.findDragGroup(0);

            expect(blocks.dragGroup).toEqual([0, 1, 2]);
        });

        it("caches the drag group and exposes it via _cachedDragGroup", () => {
            const blockList = [
                makeFlowBlock({ x: 0, y: 0, docks: [[0, 0, "in"]], connections: [null] })
            ];
            const blocks = makeBlocks(blockList);

            blocks.cacheDragGroup(0);

            expect(blocks._cachedDragGroup).toEqual([0]);
            // Mutating the live dragGroup afterward must not affect the cached copy.
            blocks.dragGroup.push(99);
            expect(blocks._cachedDragGroup).toEqual([0]);
        });

        it("guards against a null block instead of throwing", () => {
            const blocks = makeBlocks([]);
            const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

            expect(() => blocks.findDragGroup(null)).not.toThrow();
            expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("null block passed"));

            debugSpy.mockRestore();
        });
    });

    describe("pointer-driven movement — mouse drag", () => {
        it("applies a sequence of small mousemove-style deltas to the dragged block and its group", () => {
            const blockList = [
                makeFlowBlock({
                    x: 100,
                    y: 100,
                    docks: [
                        [0, 0, "in"],
                        [0, 20, "out"]
                    ],
                    connections: [null, 1]
                }),
                makeFlowBlock({ x: 100, y: 120, docks: [[0, 0, "in"]], connections: [0] })
            ];
            const blocks = makeBlocks(blockList);

            // mousedown: cache the drag group once.
            blocks.cacheDragGroup(0);
            expect(blocks._cachedDragGroup).toEqual([0, 1]);

            // pressmove: several small per-frame deltas, as a mouse produces.
            const deltas = [
                [2, 1],
                [3, 2],
                [1, 0]
            ];
            for (const [dx, dy] of deltas) {
                for (const blk of blocks._cachedDragGroup) {
                    blocks.moveBlockRelativeBatched(blk, dx, dy);
                }
            }

            expect(blockList[0].container).toEqual({ x: 106, y: 103 });
            expect(blockList[1].container).toEqual({ x: 106, y: 123 });
        });

        it("moveBlockRelative schedules a checkBounds pass and updates the spatial grid", () => {
            const blockList = [
                makeFlowBlock({ x: 0, y: 0, docks: [[0, 0, "in"]], connections: [null] })
            ];
            const blocks = makeBlocks(blockList);

            blocks.moveBlockRelative(0, 5, 5);

            expect(blockList[0].container).toEqual({ x: 5, y: 5 });
            expect(blocks._updateSpatialGrid).toHaveBeenCalledWith(0);
            expect(blocks.scheduleCheckBounds).toHaveBeenCalled();
            expect(blocks.isBlockMoving).toBe(true);
        });
    });

    describe("pointer-driven movement — touch drag", () => {
        it("applies fewer, larger touchmove-style deltas identically to a mouse drag", () => {
            // Touch input typically reports position less often than mouse input,
            // so a touch drag tends to look like fewer, larger per-event deltas.
            // The controller has no device-specific branching, so the same API
            // must produce the same additive result.
            const blockList = [
                makeFlowBlock({ x: 50, y: 50, docks: [[0, 0, "in"]], connections: [null] })
            ];
            const blocks = makeBlocks(blockList);

            blocks.cacheDragGroup(0);
            blocks.moveBlockRelativeBatched(0, 30, 15);

            expect(blockList[0].container).toEqual({ x: 80, y: 65 });
        });

        it("moveStackRelative moves an entire connected stack by one delta (used for keyboard/touch nudges)", () => {
            const blockList = [
                makeFlowBlock({
                    x: 0,
                    y: 0,
                    docks: [
                        [0, 0, "in"],
                        [0, 20, "out"]
                    ],
                    connections: [null, 1]
                }),
                makeFlowBlock({ x: 0, y: 20, docks: [[0, 0, "in"]], connections: [0] })
            ];
            const blocks = makeBlocks(blockList);

            blocks.moveStackRelative(0, 10, -5);

            expect(blockList[0].container).toEqual({ x: 10, y: -5 });
            expect(blockList[1].container).toEqual({ x: 10, y: 15 });
            expect(blocks._beginDeferCheckBounds).toHaveBeenCalled();
            expect(blocks._endDeferCheckBounds).toHaveBeenCalled();
        });
    });

    describe("dock snapping (blockMoved)", () => {
        it("connects a block to a compatible dock within snapping range", async () => {
            const target = makeFlowBlock({
                x: 0,
                y: 0,
                docks: [
                    [0, 0, "in"],
                    [0, 20, "out"]
                ],
                connections: [null, null],
                name: "target"
            });
            target.isArgClamp = () => false;

            const moving = makeFlowBlock({
                x: 0,
                y: 15,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "moving"
            });

            const blocks = makeBlocks([target, moving]);

            await blocks.blockMoved(1);

            expect(moving.connections[0]).toBe(0);
            expect(target.connections[1]).toBe(1);
        });

        it("does not connect to an incompatible dock type even when very close", async () => {
            const target = makeFlowBlock({
                x: 0,
                y: 0,
                docks: [
                    [0, 0, "in"],
                    [0, 20, "numberout"]
                ],
                connections: [null, null],
                name: "target"
            });
            target.isArgClamp = () => false;

            const moving = makeFlowBlock({
                x: 0,
                y: 15,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "moving"
            });

            const blocks = makeBlocks([target, moving]);

            await blocks.blockMoved(1);

            expect(moving.connections[0]).toBeNull();
            expect(target.connections[1]).toBeNull();
        });

        it("does not connect to a compatible dock that is out of snapping range", async () => {
            const target = makeFlowBlock({
                x: 0,
                y: 0,
                docks: [
                    [0, 0, "in"],
                    [0, 20, "out"]
                ],
                connections: [null, null],
                name: "target"
            });
            target.isArgClamp = () => false;

            const moving = makeFlowBlock({
                x: 500,
                y: 500,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "moving"
            });

            const blocks = makeBlocks([target, moving]);

            await blocks.blockMoved(1);

            expect(moving.connections[0]).toBeNull();
            expect(target.connections[1]).toBeNull();
        });

        it("skips a trashed candidate block entirely", async () => {
            const target = makeFlowBlock({
                x: 0,
                y: 0,
                docks: [
                    [0, 0, "in"],
                    [0, 20, "out"]
                ],
                connections: [null, null],
                name: "target"
            });
            target.isArgClamp = () => false;
            target.trash = true;

            const moving = makeFlowBlock({
                x: 0,
                y: 15,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "moving"
            });

            const blocks = makeBlocks([target, moving]);

            await blocks.blockMoved(1);

            expect(moving.connections[0]).toBeNull();
        });

        it("disconnects the block's previous connection before searching for a new one", async () => {
            const oldParent = makeFlowBlock({
                x: -100,
                y: -100,
                docks: [
                    [0, 0, "in"],
                    [0, 20, "out"]
                ],
                connections: [null, 1],
                name: "oldParent"
            });
            oldParent.isArgClamp = () => false;

            const moving = makeFlowBlock({
                x: 1000,
                y: 1000,
                docks: [[0, 0, "in"]],
                connections: [0],
                name: "moving"
            });

            const blocks = makeBlocks([oldParent, moving]);

            await blocks.blockMoved(1);

            // Too far from anything new, so it should end up fully disconnected.
            expect(oldParent.connections[1]).toBeNull();
            expect(moving.connections[0]).toBeNull();
        });
    });

    describe("cancelled drag / cleanup", () => {
        it("clearCachedDragGroup resets both the cache and active-group tracking", () => {
            const blockList = [
                makeFlowBlock({ x: 0, y: 0, docks: [[0, 0, "in"]], connections: [null] })
            ];
            const blocks = makeBlocks(blockList);

            blocks.cacheDragGroup(0);
            expect(blocks._cachedDragGroup).not.toBeNull();

            blocks.clearCachedDragGroup();

            expect(blocks._cachedDragGroup).toBeNull();
            expect(blocks._dragActiveGroup).toBeNull();
        });

        it("a drag cancelled before pressup (mouseout without blockMoved) leaves the block wherever it was moved, with no connection made", () => {
            const target = makeFlowBlock({
                x: 0,
                y: 0,
                docks: [
                    [0, 0, "in"],
                    [0, 20, "out"]
                ],
                connections: [null, null],
                name: "target"
            });
            const moving = makeFlowBlock({
                x: 200,
                y: 200,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "moving"
            });
            const blocks = makeBlocks([target, moving]);

            // mousedown + pressmove, then the pointer leaves the canvas (mouseout)
            // before pressup — blockMoved is never invoked in that case.
            blocks.cacheDragGroup(1);
            blocks.moveBlockRelativeBatched(1, 10, 10);
            blocks.clearCachedDragGroup();

            expect(moving.container).toEqual({ x: 210, y: 210 });
            expect(moving.connections[0]).toBeNull();
            expect(target.connections[1]).toBeNull();
            expect(blocks._cachedDragGroup).toBeNull();
        });

        it("repeated cache/clear cycles do not leak state between drags", () => {
            const blockList = [
                makeFlowBlock({ x: 0, y: 0, docks: [[0, 0, "in"]], connections: [null] }),
                makeFlowBlock({ x: 100, y: 100, docks: [[0, 0, "in"]], connections: [null] })
            ];
            const blocks = makeBlocks(blockList);

            blocks.cacheDragGroup(0);
            blocks._dragActiveGroup = new Set(blocks._cachedDragGroup);
            blocks.clearCachedDragGroup();

            expect(blocks._cachedDragGroup).toBeNull();
            expect(blocks._dragActiveGroup).toBeNull();

            // Starting a fresh drag on a different block must not see any
            // trace of the previous one.
            blocks.cacheDragGroup(1);

            expect(blocks._cachedDragGroup).toEqual([1]);
        });
    });
});
