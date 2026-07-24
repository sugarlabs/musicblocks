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
global.MINIMUMDOCKDISTANCE = 400;
global.LONGSTACK = 300;
global.delayExecution = jest.fn().mockResolvedValue(null);
global.getTextWidth = jest.fn().mockReturnValue(100);
global._ = jest.fn(str => str);

// NOTE: block classification (COLLAPSIBLES, INLINECOLLAPSIBLES, and similar
// capability lists) is owned by blocks.js, not by BlockDragController — see
// makeBlocks()'s getCollapsiblesSet/getInlineCollapsiblesSet below, which
// stand in for the real Blocks-owned delegation the controller calls
// through. This file deliberately does not set COLLAPSIBLES/INLINECOLLAPSIBLES
// as globals, since the controller no longer reads them directly.

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
            palettes: {
                dict: {
                    action: {
                        protoList: [],
                        hideMenu: jest.fn(),
                        remove: jest.fn(),
                        updatePalettes: jest.fn()
                    }
                },
                updatePalettes: jest.fn(),
                hide: jest.fn(),
                show: jest.fn()
            },
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

        // Block classification stays owned by (the mocked) Blocks here too:
        // the controller only ever calls these two delegates, it never
        // builds its own Set from a capability list.
        getCollapsiblesSet: () => new Set(["repeat", "forever", "if"]),
        getInlineCollapsiblesSet: () => new Set(["newnote", "interval", "osctime"]),

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
        isArgClamp: () => false,
        isInlineCollapsible: () => false,
        isNoHitBlock: () => false,
        highlight: jest.fn(),
        unhighlight: jest.fn()
    };
}

// A target block with a dock slot already occupied by another block, plus a
// spare far/incompatible dock so it is never mistaken for the occupied one.
// Index 1 is the slot under test; it is never the last dock, so the
// isNoHitBlock() "hidden block below" check never fires.
function makeArgHost({ occupantIdx, extra = {} }) {
    return {
        name: "print",
        trash: false,
        inCollapsed: false,
        collapsed: false,
        container: { x: 0, y: 0 },
        docks: [
            [0, -20, "in"],
            [0, 0, "numberin"],
            [1000, 1000, "in"]
        ],
        connections: [null, occupantIdx, null],
        isArgBlock: () => false,
        isArgumentLikeBlock: () => false,
        isArgClamp: () => false,
        isArgFlowClampBlock: () => false,
        isInlineCollapsible: () => false,
        highlight: jest.fn(),
        unhighlight: jest.fn(),
        ...extra
    };
}

function makeMovingArg({ value = "value", extra = {} } = {}) {
    return {
        name: "namedbox",
        trash: false,
        inCollapsed: false,
        collapsed: false,
        container: { x: 0, y: 15 },
        docks: [[0, 0, "numberout"]],
        connections: [null],
        value,
        text: { text: "" },
        isArgBlock: () => true,
        isArgumentLikeBlock: () => false,
        isArgFlowClampBlock: () => false,
        isInlineCollapsible: () => false,
        highlight: jest.fn(),
        unhighlight: jest.fn(),
        ...extra
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

    describe("dock snapping (blockMoved) — argument, action, storein, and widget branches", () => {
        it("sends a default-value occupant (e.g. a bare number block) to the trash when it is replaced", async () => {
            const occupant = makeMovingArg({ value: "5" });
            occupant.name = "number";
            occupant.container = { x: 0, y: 0 };
            const target = makeArgHost({ occupantIdx: 1 });
            const moving = makeMovingArg({ value: "10" });

            const blocks = makeBlocks([target, occupant, moving]);

            await blocks.blockMoved(2);

            expect(blocks.sendStackToTrash).toHaveBeenCalledWith(occupant);
            expect(moving.connections[0]).toBe(0);
        });

        it("nudges a non-default-value occupant aside instead of trashing it when it is replaced", async () => {
            const occupant = makeMovingArg({ value: "oldBox" });
            occupant.container = { x: 0, y: 0 };
            const target = makeArgHost({ occupantIdx: 1 });
            const moving = makeMovingArg({ value: "newBox" });

            const blocks = makeBlocks([target, occupant, moving]);

            await blocks.blockMoved(2);

            expect(blocks.sendStackToTrash).not.toHaveBeenCalled();
            // findDragGroup + moveBlockRelative(..., 40, 40) nudged it aside.
            expect(occupant.container).toEqual({ x: 40, y: 40 });
        });

        it("creates/updates an arg-clamp slot when connecting to an empty argClamp dock", async () => {
            const target = makeArgHost({ occupantIdx: null });
            target.name = "makeblock";
            target.isArgClamp = () => true;
            target.argClampSlots = [1, 1];
            target.updateArgSlots = jest.fn();

            const moving = makeMovingArg({ value: "3" });

            const blocks = makeBlocks([target, moving]);
            blocks._getBlockSize = jest.fn(() => 4);

            await blocks.blockMoved(1);

            expect(moving.connections[0]).toBe(0);
            expect(target.argClampSlots[0]).toBe(4);
            expect(target.updateArgSlots).toHaveBeenCalledWith(target.argClampSlots);
        });

        it("renames the action stack and updates the palette when a name-arg block is swapped on an action block", async () => {
            const occupant = makeMovingArg({ value: "oldName" });
            occupant.container = { x: 0, y: 0 };
            const target = makeArgHost({ occupantIdx: 1 });
            target.name = "action";
            const moving = makeMovingArg({ value: "newName" });
            moving.container = { x: 0, y: 15, updateCache: jest.fn() };

            const blocks = makeBlocks([target, occupant, moving]);
            blocks.findUniqueActionName = jest.fn(() => "newName2");
            blocks.protoBlockDict["myDo_oldName"] = {};
            blocks.activity.palettes.dict.action.protoList = [
                { name: "nameddo", staticLabels: ["oldName"] }
            ];

            await blocks.blockMoved(2);

            expect(moving.value).toBe("newName2");
            expect(blocks.newNameddoBlock).toHaveBeenCalledWith("newName2", false, false);
            expect(blocks.activity.palettes.dict.action.remove).toHaveBeenCalledWith(
                blocks.activity.palettes.dict.action.protoList[0],
                "oldName"
            );
            expect(blocks.renameNameddos).toHaveBeenCalledWith("oldName", "newName2");
            expect(blocks.renameDos).toHaveBeenCalledWith("oldName", "newName2");
            expect(blocks.protoBlockDict["myDo_oldName"]).toBeUndefined();
        });

        it("adds storein/namedbox palette entries when a value block is attached to a storein block's name dock", async () => {
            const occupant = makeMovingArg({ value: "old" });
            occupant.container = { x: 0, y: 0 };
            const target = makeArgHost({ occupantIdx: 1 });
            target.name = "storein";
            const moving = makeMovingArg({ value: "myBox" });
            moving.container = { x: 0, y: 15 };

            const blocks = makeBlocks([target, occupant, moving]);

            await blocks.blockMoved(2);

            expect(blocks.newStorein2Block).toHaveBeenCalledWith("myBox");
            expect(blocks.newNamedboxBlock).toHaveBeenCalledWith("myBox");
            expect(blocks.activity.palettes.updatePalettes).toHaveBeenCalledWith("boxes");
        });

        it("reinitializes an open widget window when a block is dragged out of its stack", async () => {
            const wftTitle = document.createElement("div");
            wftTitle.className = "wftTitle";
            wftTitle.innerHTML = "tempo";
            document.body.appendChild(wftTitle);

            try {
                const parent = makeFlowBlock({
                    x: -500,
                    y: -500,
                    docks: [
                        [0, 0, "in"],
                        [0, 20, "out"]
                    ],
                    connections: [null, 1],
                    name: "parent"
                });
                const moving = makeFlowBlock({
                    x: 5000,
                    y: 5000,
                    docks: [[0, 0, "in"]],
                    connections: [0],
                    name: "moving"
                });
                moving.protoblock = { staticLabels: ["tempo"] };

                const blocks = makeBlocks([parent, moving]);

                await blocks.blockMoved(1);

                expect(parent.connections[1]).toBeNull();
                expect(moving.connections[0]).toBeNull();
                expect(blocks.raiseStackToTop).toHaveBeenCalledWith(1);
                expect(blocks.reInitWidget).toHaveBeenCalledWith(1, 1500);
            } finally {
                wftTitle.remove();
            }
        });

        it("removes the note block's default/silence placeholder when a new block is inserted", async () => {
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
                x: 0,
                y: 15,
                docks: [[0, 0, "in"]],
                connections: [null, null],
                name: "pitch"
            });

            const blocks = makeBlocks([target, moving]);
            blocks._insideNoteBlock = jest.fn(() => 0);
            blocks.deletePreviousDefault = jest.fn(() => 0);

            await blocks.blockMoved(1);

            expect(moving.connections[0]).toBe(0);
            expect(blocks.deletePreviousDefault).toHaveBeenCalledWith(1);
        });

        it("accumulates clampBlocksToCheck entries for a block moved inside an expandable block", async () => {
            const parentExpandable = makeFlowBlock({
                x: -500,
                y: -500,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "repeat"
            });
            const moving = makeFlowBlock({
                x: 5000,
                y: 5000,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "moving"
            });

            const blocks = makeBlocks([parentExpandable, moving]);
            let calls = 0;
            blocks.insideExpandableBlock = jest.fn(() => {
                calls += 1;
                return calls === 1 ? 0 : null;
            });

            await blocks.blockMoved(1);

            expect(blocks.clampBlocksToCheck).toEqual([[0, 0]]);
            expect(blocks.addDefaultBlock).toHaveBeenCalledWith(0, 1, false);
            expect(blocks.adjustExpandableClampBlock).toHaveBeenCalled();
        });

        it("doubles clampBlocksToCheck entries for both of ifthenelse's clamps", async () => {
            const parentExpandable = makeFlowBlock({
                x: -500,
                y: -500,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "ifthenelse"
            });
            const moving = makeFlowBlock({
                x: 5000,
                y: 5000,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "moving"
            });

            const blocks = makeBlocks([parentExpandable, moving]);
            let calls = 0;
            blocks.insideExpandableBlock = jest.fn(() => {
                calls += 1;
                return calls === 1 ? 0 : null;
            });

            await blocks.blockMoved(1);

            expect(blocks.clampBlocksToCheck).toEqual([
                [0, 0],
                [0, 1]
            ]);
        });

        it("bounces an arg block to the right, snapping back to its last-good position first", async () => {
            const target = makeArgHost({ occupantIdx: null });
            target.docks[1] = [0, 0, "textin"]; // incompatible with "numberout"
            const moving = makeMovingArg({ value: "1" });
            moving.lastGoodX = 100;
            moving.lastGoodY = 200;

            const blocks = makeBlocks([target, moving]);

            await blocks.blockMoved(1);

            expect(moving.connections[0]).toBeNull();
            // Snapped back to lastGood, then bounced +60 on x only (arg blocks).
            expect(moving.container).toEqual({ x: 160, y: 200 });
        });

        it("bounces a flow block down-and-right on an illegal connection", async () => {
            const target = makeFlowBlock({
                x: 0,
                y: 0,
                docks: [
                    [0, 0, "in"],
                    [0, 20, "textout"] // incompatible with "in"
                ],
                connections: [null, null],
                name: "target"
            });
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
            expect(moving.container).toEqual({ x: 42, y: 75 });
        });

        it("warns when the resulting stack exceeds the long-stack threshold", async () => {
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
                x: 0,
                y: 15,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "moving"
            });

            const blocks = makeBlocks([target, moving]);
            blocks._countBlocksInStack = jest.fn(() => 301);

            await blocks.blockMoved(1);

            expect(moving.connections[0]).toBe(0);
            expect(blocks.activity.errorMsg).toHaveBeenCalledWith(
                "Consider breaking this stack into parts."
            );
        });
    });

    describe("delegation stubs forward calls to the controller", () => {
        it.each([
            ["findDragGroup", [0]],
            ["cacheDragGroup", [0]],
            ["clearCachedDragGroup", []],
            ["moveBlockRelative", [0, 1, 2]],
            ["moveBlockRelativeBatched", [0, 1, 2]],
            ["moveStackRelative", [0, 1, 2]]
        ])(
            "blocks.%s(...) forwards to controller.%s(...) with the same arguments",
            (method, args) => {
                const blockList = [
                    makeFlowBlock({ x: 0, y: 0, docks: [[0, 0, "in"]], connections: [null] })
                ];
                const blocks = makeBlocks(blockList);
                const spy = jest.spyOn(blocks.blockDragController, method);

                blocks[method](...args);

                expect(spy).toHaveBeenCalledWith(...args);
            }
        );

        it("blocks.blockMoved(...) forwards to controller.blockMoved(...) with the same arguments", async () => {
            const blockList = [
                makeFlowBlock({ x: 0, y: 0, docks: [[0, 0, "in"]], connections: [null] })
            ];
            const blocks = makeBlocks(blockList);
            const spy = jest.spyOn(blocks.blockDragController, "blockMoved");

            await blocks.blockMoved(0);

            expect(spy).toHaveBeenCalledWith(0);
        });
    });

    describe("edge cases and guards", () => {
        it("_adjustBlockPositions is a no-op for a single-block drag group and adjusts docks for a multi-block one", () => {
            const blockList = [
                makeFlowBlock({ x: 0, y: 0, docks: [[0, 0, "in"]], connections: [null] })
            ];
            const blocks = makeBlocks(blockList);

            blocks.dragGroup = [0];
            blocks.blockDragController._adjustBlockPositions();
            expect(blocks.adjustDocks).not.toHaveBeenCalled();

            blocks.dragGroup = [0, 1];
            blocks.blockDragController._adjustBlockPositions();
            expect(blocks.adjustDocks).toHaveBeenCalledWith(0, true);
        });

        it("_calculateDragGroup guards against null, missing, and malformed blocks without throwing", () => {
            const blockList = [
                null,
                { connections: null },
                { connections: [] },
                makeFlowBlock({ x: 0, y: 0, docks: [[0, 0, "in"]], connections: [null] })
            ];
            const blocks = makeBlocks(blockList);
            const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

            expect(() => blocks.blockDragController._calculateDragGroup(null)).not.toThrow();

            blocks.dragGroup = [];
            expect(() => blocks.blockDragController._calculateDragGroup(1)).not.toThrow();
            expect(blocks.dragGroup).toEqual([1]);

            blocks.dragGroup = [];
            expect(() => blocks.blockDragController._calculateDragGroup(2)).not.toThrow();
            expect(blocks.dragGroup).toEqual([2]);

            debugSpy.mockRestore();
        });

        it("_calculateDragGroup stops recursing once the loop counter exceeds the block list length", () => {
            const blockList = [
                { connections: [null, 0] } // a block that "connects to itself" so recursion never bottoms out
            ];
            const blocks = makeBlocks(blockList);
            const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

            expect(() => blocks.findDragGroup(0)).not.toThrow();
            expect(debugSpy).toHaveBeenCalledWith(
                expect.stringContaining("Maximum loop counter exceeded")
            );

            debugSpy.mockRestore();
        });

        it("moveBlockRelative logs instead of throwing when the block has no container yet", () => {
            const blockList = [{ name: "pending", container: null }];
            const blocks = makeBlocks(blockList);
            const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

            expect(() => blocks.moveBlockRelative(0, 5, 5)).not.toThrow();
            expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("No container yet"));

            debugSpy.mockRestore();
        });

        it("blockMoved guards against a null thisBlock and a missing block entry", async () => {
            const blocks = makeBlocks([null]);
            const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

            await expect(blocks.blockMoved(null)).resolves.toBeUndefined();
            expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("null block."));

            await expect(blocks.blockMoved(0)).resolves.toBeUndefined();
            expect(debugSpy).toHaveBeenCalledWith(
                expect.stringContaining("null block found in blockMoved")
            );

            debugSpy.mockRestore();
        });

        it("marks a two-arg block's parent for layout re-checking when an arg block is dragged away from it", async () => {
            const twoArgParent = {
                name: "plus2",
                trash: false,
                container: { x: -500, y: -500 },
                docks: [
                    [0, 0, "in"],
                    [0, 10, "numberin"],
                    [0, 20, "numberin"]
                ],
                connections: [null, 1, null],
                isTwoArgBlock: () => true,
                isArgClamp: () => false,
                isInlineCollapsible: () => false
            };
            const moving = makeMovingArg({ value: "5" });
            moving.container = { x: 5000, y: 5000 }; // far from anything, so it ends up disconnected
            moving.connections = [0]; // currently plugged into twoArgParent's first arg slot

            const blocks = makeBlocks([twoArgParent, moving]);

            await blocks.blockMoved(1);

            expect(twoArgParent.connections[1]).toBeNull();
            expect(blocks._adjustExpandableTwoArgBlock).toHaveBeenCalledWith([0]);
        });

        it("overrides an existing arg-clamp slot occupant, cascading a new slot when none is free", async () => {
            const target = {
                name: "makeblock",
                trash: false,
                container: { x: 0, y: 0 },
                docks: [
                    [0, -20, "in"],
                    [0, 0, "numberin"]
                ],
                connections: [null, 1],
                argClampSlots: [1],
                isArgClamp: () => true,
                isArgumentLikeBlock: () => false,
                isInlineCollapsible: () => false,
                isNoHitBlock: () => false,
                updateArgSlots: jest.fn(),
                highlight: jest.fn(),
                unhighlight: jest.fn()
            };
            const occupant = makeMovingArg({ value: "old" });
            occupant.container = { x: 0, y: 0 };
            occupant.isNoHitBlock = () => false;
            const moving = makeMovingArg({ value: "new" });

            const blocks = makeBlocks([target, occupant, moving]);
            blocks._getBlockSize = jest.fn(() => 2);

            await blocks.blockMoved(2);

            expect(moving.connections[0]).toBe(0);
            // The occupant slot was full, so a new slot was pushed and the
            // moved block's size recorded for it.
            expect(target.argClampSlots).toEqual([1, 2]);
            expect(target.connections.length).toBe(3);
            expect(target.updateArgSlots).toHaveBeenCalledWith(target.argClampSlots);
        });

        it("renames a freshly-attached action block whose value collides with an existing action stack", async () => {
            const otherActionName = {
                name: "namedbox",
                value: "dance",
                trash: false,
                inCollapsed: false,
                collapsed: false,
                container: { x: -999, y: -999 },
                docks: [[0, 0, "numberout"]],
                connections: [],
                isNoHitBlock: () => false,
                isInlineCollapsible: () => false
            };
            const otherAction = {
                name: "action",
                trash: false,
                container: { x: -999, y: -999 },
                docks: [
                    [0, 0, "in"],
                    [0, 20, "numberin"]
                ],
                connections: [null, 1],
                isArgClamp: () => false,
                isInlineCollapsible: () => false,
                isNoHitBlock: () => false
            };
            const target = makeFlowBlock({
                x: 0,
                y: 0,
                docks: [
                    [0, 0, "in"],
                    [0, 20, "out"]
                ],
                connections: [null, null],
                name: "action"
            });
            const moving = makeFlowBlock({
                x: 0,
                y: 15,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "flow2"
            });
            moving.value = "dance";
            moving.text = { text: "" };
            moving.container.updateCache = jest.fn();

            const blocks = makeBlocks([otherAction, otherActionName, target, moving]);
            blocks.findUniqueActionName = jest.fn(() => "dance2");

            await blocks.blockMoved(3);

            expect(moving.value).toBe("dance2");
            expect(blocks.newNameddoBlock).toHaveBeenCalledWith("dance2", false, false);
            expect(blocks.setActionProtoVisibility).toHaveBeenCalledWith(false);
        });

        it("stops running turtles and resets the stop button color after a successful connection", async () => {
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
                x: 0,
                y: 15,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "moving"
            });

            const blocks = makeBlocks([target, moving]);
            blocks.activity.turtles.running = jest.fn().mockReturnValue(true);
            const stopBtn = document.createElement("button");
            stopBtn.id = "stop";
            document.body.appendChild(stopBtn);

            try {
                await blocks.blockMoved(1);

                expect(blocks.activity.logo.doStopTurtles).toHaveBeenCalled();
                expect(stopBtn.style.color).toBe("white");
            } finally {
                stopBtn.remove();
            }
        });

        it("unhighlights the connected blocks after the highlight timeout elapses", async () => {
            jest.useFakeTimers();
            try {
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
                    x: 0,
                    y: 15,
                    docks: [[0, 0, "in"]],
                    connections: [null],
                    name: "moving"
                });

                const blocks = makeBlocks([target, moving]);

                await blocks.blockMoved(1);

                expect(target.unhighlight).not.toHaveBeenCalled();
                jest.runAllTimers();

                expect(target.unhighlight).toHaveBeenCalled();
                expect(moving.unhighlight).toHaveBeenCalled();
            } finally {
                jest.useRealTimers();
            }
        });

        it("skips candidates that are collapsed, in the trash, or nested inside a collapsed block", async () => {
            const collapsedCandidate = makeFlowBlock({
                x: 0,
                y: 15,
                docks: [
                    [0, 0, "in"],
                    [0, 20, "out"]
                ],
                connections: [null, null],
                name: "repeat" // matches makeBlocks()'s getCollapsiblesSet()
            });
            collapsedCandidate.collapsed = true;

            const trashedCandidate = makeFlowBlock({
                x: 0,
                y: 15,
                docks: [
                    [0, 0, "in"],
                    [0, 20, "out"]
                ],
                connections: [null, null],
                name: "target2"
            });
            trashedCandidate.trash = true;

            const inCollapsedCandidate = makeFlowBlock({
                x: 0,
                y: 15,
                docks: [
                    [0, 0, "in"],
                    [0, 20, "out"]
                ],
                connections: [null, null],
                name: "target3"
            });
            inCollapsedCandidate.inCollapsed = true;

            const moving = makeFlowBlock({
                x: 0,
                y: 15,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "moving"
            });

            const blocks = makeBlocks([
                collapsedCandidate,
                trashedCandidate,
                inCollapsedCandidate,
                moving
            ]);

            await blocks.blockMoved(3);

            expect(moving.connections[0]).toBeNull();
        });

        it("reinitializes an open widget window on a brand-new (not just override) connection", async () => {
            const wftTitle = document.createElement("div");
            wftTitle.className = "wftTitle";
            wftTitle.innerHTML = "tempo";
            document.body.appendChild(wftTitle);

            try {
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
                    x: 0,
                    y: 15,
                    docks: [[0, 0, "in"]],
                    connections: [null],
                    name: "moving"
                });
                moving.protoblock = { staticLabels: ["tempo"] };

                const blocks = makeBlocks([target, moving]);

                await blocks.blockMoved(1);

                expect(moving.connections[0]).toBe(0);
                expect(blocks.reInitWidget).toHaveBeenCalledWith(1, 1500);
            } finally {
                wftTitle.remove();
            }
        });

        it("queues a parent's ARG/FLOW layout re-check based on getLayoutUpdateType after connecting an argument-like block", async () => {
            const target = makeFlowBlock({
                x: 0,
                y: 0,
                docks: [
                    [0, -20, "in"],
                    [0, 0, "numberin"]
                ],
                connections: [null, null],
                name: "target"
            });
            target.getLayoutUpdateType = jest.fn().mockReturnValue("ARG");

            const moving = makeMovingArg({ value: "1" });
            moving.isArgumentLikeBlock = () => true;

            const blocks = makeBlocks([target, moving]);

            await blocks.blockMoved(1);

            expect(moving.connections[0]).toBe(0);
            expect(target.getLayoutUpdateType).toHaveBeenCalledWith(1);
            expect(blocks._checkTwoArgBlocks).toContain(0);
        });

        it("queues a FLOW layout re-check (vspace add/remove) when getLayoutUpdateType returns FLOW", async () => {
            const target = makeFlowBlock({
                x: 0,
                y: 0,
                docks: [
                    [0, -20, "in"],
                    [0, 0, "numberin"]
                ],
                connections: [null, null],
                name: "target"
            });
            target.getLayoutUpdateType = jest.fn().mockReturnValue("FLOW");

            const moving = makeMovingArg({ value: "1" });
            moving.isArgumentLikeBlock = () => true;

            const blocks = makeBlocks([target, moving]);

            await blocks.blockMoved(1);

            expect(moving.connections[0]).toBe(0);
            expect(blocks._addRemoveVspaceBlock).toHaveBeenCalledWith(0);
        });

        it("deletes the trailing default/silence block when a block is inserted below it inside a note clamp", async () => {
            const occupant = makeFlowBlock({
                x: 0,
                y: 40,
                docks: [[0, 0, "in"]],
                connections: [null],
                name: "occupant"
            });
            const target = makeFlowBlock({
                x: 0,
                y: 0,
                docks: [
                    [0, 0, "in"],
                    [0, 20, "out"]
                ],
                connections: [null, 1],
                name: "target"
            });
            const moving = makeFlowBlock({
                x: 0,
                y: 15,
                docks: [
                    [0, 0, "in"],
                    [0, 20, "out"]
                ],
                connections: [null, null],
                name: "moving"
            });
            moving.protoblock = { style: "flow" };

            const blocks = makeBlocks([target, occupant, moving]);
            blocks._insideNoteBlock = jest.fn(() => 0);

            await blocks.blockMoved(2);

            expect(moving.connections[0]).toBe(0);
            expect(blocks.deleteNextDefault).toHaveBeenCalledWith(2);
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
