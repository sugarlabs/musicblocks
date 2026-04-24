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

const BlockDragManager = require("../BlockDragManager");

describe("BlockDragManager", () => {
    const makeBlocks = overrides => {
        const blocks = {
            blockList: [],
            dragGroup: [],
            dragLoopCounter: 0,
            _cachedDragGroup: null,
            _topBlockCache: null,
            _checkBoundsScheduled: false,
            _deferCheckBoundsCount: 0,
            _checkBoundsPending: false,
            inLongPress: true,
            isBlockMoving: false,
            checkBounds: jest.fn(),
            adjustDocks: jest.fn(),
            _beginDeferCheckBounds: jest.fn(),
            _endDeferCheckBounds: jest.fn(),
            findTopBlock: jest.fn(i => i),
            ...overrides
        };

        return blocks;
    };

    test("findDragGroup walks connected child blocks", () => {
        const blocks = makeBlocks({
            blockList: [
                { connections: [null, 1, 2] },
                { connections: [0, 3] },
                { connections: [0] },
                { connections: [1] }
            ]
        });
        const manager = new BlockDragManager(blocks);

        manager.findDragGroup(0);

        expect(blocks.dragGroup).toEqual([0, 1, 3, 2]);
    });

    test("cacheDragGroup stores the current drag group", () => {
        const blocks = makeBlocks({
            blockList: [{ connections: [null, 1] }, { connections: [0] }]
        });
        const manager = new BlockDragManager(blocks);

        manager.cacheDragGroup(0);

        expect(blocks._cachedDragGroup).toEqual([0, 1]);
    });

    test("moveBlock rounds position and adjusts docks", () => {
        const blocks = makeBlocks({
            blockList: [{ name: "forward", container: { x: 0, y: 0 } }]
        });
        const manager = new BlockDragManager(blocks);

        manager.moveBlock(0, 10.4, 12.6);

        expect(blocks.blockList[0].container).toEqual({ x: 10, y: 13 });
        expect(blocks.checkBounds).toHaveBeenCalledTimes(1);
        expect(blocks.adjustDocks).toHaveBeenCalledWith(0, true);
    });

    test("moveBlockRelative marks movement and defers bounds checks inside a batch", () => {
        const blocks = makeBlocks({
            _deferCheckBoundsCount: 1,
            blockList: [{ name: "forward", container: { x: 2, y: 3 } }]
        });
        const manager = new BlockDragManager(blocks);

        manager.moveBlockRelative(0, 5, 7);

        expect(blocks.blockList[0].container).toEqual({ x: 7, y: 10 });
        expect(blocks.inLongPress).toBe(false);
        expect(blocks.isBlockMoving).toBe(true);
        expect(blocks._checkBoundsPending).toBe(true);
        expect(blocks.checkBounds).not.toHaveBeenCalled();
    });

    test("moveAllBlocksExcept skips blocks in the excluded stack", () => {
        const firstBlock = { trash: false, container: { x: 0, y: 0 } };
        const secondBlock = { trash: false, container: { x: 10, y: 10 } };
        const thirdBlock = { trash: false, container: { x: 20, y: 20 } };
        const blocks = makeBlocks({
            blockList: [firstBlock, secondBlock, thirdBlock],
            findTopBlock: jest.fn(i => (i === 0 ? 0 : 1))
        });
        const manager = new BlockDragManager(blocks);

        manager.moveAllBlocksExcept(firstBlock, 3, 4);

        expect(firstBlock.container).toEqual({ x: 0, y: 0 });
        expect(secondBlock.container).toEqual({ x: 13, y: 14 });
        expect(thirdBlock.container).toEqual({ x: 23, y: 24 });
        expect(blocks._beginDeferCheckBounds).toHaveBeenCalledTimes(1);
        expect(blocks._endDeferCheckBounds).toHaveBeenCalledTimes(1);
    });
});
