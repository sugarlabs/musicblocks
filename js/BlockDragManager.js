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

/*
   exported BlockDragManager
*/

/**
 * Owns drag-group traversal and block movement helpers for Blocks.
 */
class BlockDragManager {
    /**
     * @param {Blocks} blocks - The owning Blocks instance.
     */
    constructor(blocks) {
        this.blocks = blocks;
    }

    /**
     * Schedule a bounds check on the next animation frame.
     * @returns {void}
     */
    scheduleCheckBounds() {
        const blocks = this.blocks;
        if (blocks._checkBoundsScheduled) {
            return;
        }

        blocks._checkBoundsScheduled = true;
        requestAnimationFrame(() => {
            blocks._checkBoundsScheduled = false;
            blocks.checkBounds();
        });
    }

    /**
     * Move a block to a specified position and check the docks afterward.
     * @param {number} blk - Block index.
     * @param {number} x - X position.
     * @param {number} y - Y position.
     * @returns {void}
     */
    moveBlock(blk, x, y) {
        const blocks = this.blocks;
        this.moveBlockOnly(blk, x, y);
        blocks.adjustDocks(blk, true);
    }

    /**
     * Move a block and its label to x, y.
     * @param {number} blk - Block index.
     * @param {number} x - X position.
     * @param {number} y - Y position.
     * @returns {void}
     */
    moveBlockOnly(blk, x, y) {
        const blocks = this.blocks;
        const myBlock = blocks.blockList[blk];
        if (myBlock.container !== null) {
            myBlock.container.x = Math.floor(x + 0.5);
            myBlock.container.y = Math.floor(y + 0.5);

            if (blocks._deferCheckBoundsCount > 0) {
                blocks._checkBoundsPending = true;
            } else {
                blocks.checkBounds();
            }
        } else {
            console.debug("No container yet for block " + myBlock.name);
        }
    }

    /**
     * Relative move of a block and its label by dx, dy.
     * @param {number} blk - Block index.
     * @param {number} dx - Delta x.
     * @param {number} dy - Delta y.
     * @returns {void}
     */
    moveBlockRelative(blk, dx, dy) {
        const blocks = this.blocks;
        blocks.inLongPress = false;
        blocks.isBlockMoving = true;
        const myBlock = blocks.blockList[blk];
        if (myBlock.container !== null) {
            myBlock.container.x += dx;
            myBlock.container.y += dy;

            if (blocks._deferCheckBoundsCount > 0) {
                blocks._checkBoundsPending = true;
            } else {
                blocks.checkBounds();
            }
        } else {
            console.debug("No container yet for block " + myBlock.name);
        }
    }

    /**
     * Move a block by dx, dy without running checkBounds.
     * @param {number} blk - Block index.
     * @param {number} dx - Delta x.
     * @param {number} dy - Delta y.
     * @returns {void}
     */
    moveBlockRelativeBatched(blk, dx, dy) {
        const blocks = this.blocks;
        blocks.inLongPress = false;
        blocks.isBlockMoving = true;
        const myBlock = blocks.blockList[blk];
        if (myBlock.container !== null) {
            myBlock.container.x += dx;
            myBlock.container.y += dy;
        }
    }

    /**
     * Move the blocks in a stack to a new position.
     * @param {number} blk - Block index.
     * @param {number} dx - Delta x.
     * @param {number} dy - Delta y.
     * @returns {void}
     */
    moveStackRelative(blk, dx, dy) {
        const blocks = this.blocks;
        this.findDragGroup(blk);
        if (blocks.dragGroup.length > 0) {
            blocks._beginDeferCheckBounds();
            for (let b = 0; b < blocks.dragGroup.length; b++) {
                this.moveBlockRelative(blocks.dragGroup[b], dx, dy);
            }
            blocks._endDeferCheckBounds();
        }
    }

    /**
     * Move all blocks except the stack containing the given block.
     * @param {object} blk - Block object to exclude.
     * @param {number} dx - Delta x.
     * @param {number} dy - Delta y.
     * @returns {void}
     */
    moveAllBlocksExcept(blk, dx, dy) {
        const blocks = this.blocks;
        if (blocks._topBlockCache === null) {
            blocks._topBlockCache = new Map();
            for (let i = 0; i < blocks.blockList.length; i++) {
                if (blocks.blockList[i].trash) continue;
                blocks._topBlockCache.set(i, blocks.findTopBlock(i));
            }
        }

        const blkIdx = blocks.blockList.indexOf(blk);
        const excludeTop = blkIdx >= 0 ? blocks._topBlockCache.get(blkIdx) : -1;

        blocks._beginDeferCheckBounds();
        for (let i = 0; i < blocks.blockList.length; i++) {
            if (blocks.blockList[i].trash) continue;
            if (blocks._topBlockCache.get(i) !== excludeTop) {
                this.moveBlockRelativeBatched(i, dx, dy);
            }
        }
        blocks._endDeferCheckBounds();
    }

    /**
     * Create the drag group from the blocks connected to blk.
     * @param {number} blk - Block index.
     * @returns {void}
     */
    findDragGroup(blk) {
        const blocks = this.blocks;
        if (blk === null) {
            console.debug("null block passed to findDragGroup");
            return;
        }

        blocks.dragLoopCounter = 0;
        blocks.dragGroup = [];
        this.calculateDragGroup(blk);
    }

    /**
     * Cache the drag group for reuse during pressmove.
     * @param {number} blk - Block index.
     * @returns {void}
     */
    cacheDragGroup(blk) {
        const blocks = this.blocks;
        this.findDragGroup(blk);
        blocks._cachedDragGroup = blocks.dragGroup.slice();
    }

    /**
     * Clear the cached drag group.
     * @returns {void}
     */
    clearCachedDragGroup() {
        this.blocks._cachedDragGroup = null;
    }

    /**
     * Invalidate the top-block cache.
     * @returns {void}
     */
    invalidateTopBlockCache() {
        this.blocks._topBlockCache = null;
    }

    /**
     * Find all blocks connected below blk.
     * @param {number} blk - Block index.
     * @returns {void}
     */
    calculateDragGroup(blk) {
        const blocks = this.blocks;
        blocks.dragLoopCounter += 1;
        if (blocks.dragLoopCounter > blocks.blockList.length) {
            console.debug(
                "Maximum loop counter exceeded in calculateDragGroup... this is bad. " + blk
            );
            return;
        }

        if (blk === null) {
            console.debug("null block passed to calculateDragGroup");
            return;
        }

        const myBlock = blocks.blockList[blk];
        if (myBlock === null) {
            console.debug("null block encountered... this is bad. " + blk);
            return;
        }

        if (myBlock.connections === null) {
            blocks.dragGroup = [blk];
            return;
        }

        if (myBlock.connections.length === 0) {
            blocks.dragGroup = [blk];
            return;
        }

        blocks.dragGroup.push(blk);

        for (let c = 1; c < myBlock.connections.length; c++) {
            const cblk = myBlock.connections[c];
            if (cblk !== null) {
                this.calculateDragGroup(cblk);
            }
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = BlockDragManager;
}
