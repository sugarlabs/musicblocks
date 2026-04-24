// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const BlockLayoutManager = require("../BlockLayoutManager");

describe("BlockLayoutManager", () => {
    const makeBlock = props => ({
        collapsed: false,
        isTwoArgBooleanBlock: jest.fn(() => false),
        isInlineCollapsible: jest.fn(() => false),
        ...props
    });

    const makeBlocks = overrides => {
        const blocks = {
            blockList: [],
            _deferCheckBoundsCount: 0,
            _checkBoundsPending: false,
            _loopCounter: 0,
            checkBounds: jest.fn(),
            _moveBlock: jest.fn(),
            ...overrides
        };

        return blocks;
    };

    test("defers and flushes a pending bounds check", () => {
        const blocks = makeBlocks();
        const manager = new BlockLayoutManager(blocks);

        manager.beginDeferCheckBounds();
        blocks._checkBoundsPending = true;
        manager.endDeferCheckBounds();

        expect(blocks._deferCheckBoundsCount).toBe(0);
        expect(blocks._checkBoundsPending).toBe(false);
        expect(blocks.checkBounds).toHaveBeenCalledTimes(1);
    });

    test("adjustDocks positions connected child blocks from matching docks", () => {
        const blocks = makeBlocks({
            blockList: [
                makeBlock({
                    name: "repeat",
                    container: { x: 10, y: 20 },
                    docks: [
                        [0, 0],
                        [8, 9]
                    ],
                    connections: [null, 1]
                }),
                makeBlock({
                    name: "forward",
                    container: { x: 0, y: 0 },
                    docks: [[2, 3]],
                    connections: [0]
                })
            ]
        });
        blocks._moveBlock = jest.fn((blk, x, y) => {
            blocks.blockList[blk].container.x = x;
            blocks.blockList[blk].container.y = y;
        });
        const manager = new BlockLayoutManager(blocks);

        manager.adjustDocks(0, true);

        expect(blocks._moveBlock).toHaveBeenCalledWith(1, 16, 26);
        expect(blocks.blockList[1].container).toEqual({ x: 16, y: 26 });
        expect(blocks._deferCheckBoundsCount).toBe(0);
    });

    test("adjustDocks returns early for value blocks", () => {
        const blocks = makeBlocks({
            blockList: [
                makeBlock({
                    name: "number",
                    docks: [[0, 0]],
                    connections: [null]
                })
            ]
        });
        const manager = new BlockLayoutManager(blocks);

        manager.adjustDocks(0, true);

        expect(blocks._moveBlock).not.toHaveBeenCalled();
        expect(blocks._deferCheckBoundsCount).toBe(0);
    });

    test("findTopBlock walks parent connections", () => {
        const blocks = makeBlocks({
            blockList: [
                makeBlock({ connections: [null, 1] }),
                makeBlock({ connections: [0, 2] }),
                makeBlock({ connections: [1, null] })
            ]
        });
        const manager = new BlockLayoutManager(blocks);

        expect(manager.findTopBlock(2)).toBe(0);
    });

    test("findBottomBlock follows the last connection", () => {
        const blocks = makeBlocks({
            blockList: [
                makeBlock({ connections: [null, 1] }),
                makeBlock({ connections: [0, 2] }),
                makeBlock({ connections: [1, null] })
            ]
        });
        const manager = new BlockLayoutManager(blocks);

        expect(manager.findBottomBlock(0)).toBe(2);
    });

    test("countBlocksInStack counts connected children recursively", () => {
        const blocks = makeBlocks({
            blockList: [
                makeBlock({ connections: [null, 1, 2] }),
                makeBlock({ connections: [0] }),
                makeBlock({ connections: [0, 3] }),
                makeBlock({ connections: [2] })
            ]
        });
        const manager = new BlockLayoutManager(blocks);

        expect(manager.countBlocksInStack(0)).toBe(4);
    });

    test("findStacks records non-trash blocks without parents", () => {
        const blocks = makeBlocks({
            blockList: [
                makeBlock({ trash: false, connections: [null] }),
                makeBlock({ trash: false, connections: [0] }),
                makeBlock({ trash: true, connections: [null] }),
                makeBlock({ trash: false, connections: [null] })
            ],
            stackList: []
        });
        const manager = new BlockLayoutManager(blocks);

        manager.findStacks();

        expect(blocks.stackList).toEqual([0, 3]);
    });
});
