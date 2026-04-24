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
   global last
*/

/*
   exported BlockLayoutManager
*/

const lastLayoutItem = values => {
    if (typeof last !== "undefined") {
        return last(values);
    }

    return values[values.length - 1];
};

/**
 * Owns recursive block layout operations for Blocks.
 */
class BlockLayoutManager {
    /**
     * @param {Blocks} blocks - The owning Blocks instance.
     */
    constructor(blocks) {
        this.blocks = blocks;
    }

    /**
     * Begin deferring checkBounds calls. Supports nesting.
     * @returns {void}
     */
    beginDeferCheckBounds() {
        this.blocks._deferCheckBoundsCount++;
    }

    /**
     * End deferring checkBounds calls. Runs one check if any were suppressed.
     * @returns {void}
     */
    endDeferCheckBounds() {
        const blocks = this.blocks;
        if (blocks._deferCheckBoundsCount > 0) {
            blocks._deferCheckBoundsCount--;
        }

        if (blocks._deferCheckBoundsCount === 0 && blocks._checkBoundsPending) {
            blocks._checkBoundsPending = false;
            blocks.checkBounds();
        }
    }

    /**
     * Given a block, adjust the dock position of all its connections.
     * @param {number} blk - Block index.
     * @param {boolean} resetLoopCounter - Reset recursion guard.
     * @returns {void}
     */
    adjustDocks(blk, resetLoopCounter) {
        const blocks = this.blocks;
        const isOuterCall = blocks._deferCheckBoundsCount === 0;
        if (isOuterCall) {
            this.beginDeferCheckBounds();
        }

        const myBlock = blocks.blockList[blk];

        if (resetLoopCounter !== null) {
            blocks._loopCounter = 0;
        }

        if (myBlock === null) {
            console.debug("Saw a null block: " + blk);
            if (isOuterCall) this.endDeferCheckBounds();
            return;
        }

        if (myBlock.connections === null) {
            console.debug("Saw a block with null connections: " + blk);
            if (isOuterCall) this.endDeferCheckBounds();
            return;
        }

        if (myBlock.connections.length === 0) {
            console.debug("Saw a block with [] connections: " + blk);
            if (isOuterCall) this.endDeferCheckBounds();
            return;
        }

        if (myBlock.docks.length === 1) {
            if (isOuterCall) this.endDeferCheckBounds();
            return;
        }

        blocks._loopCounter += 1;
        if (blocks._loopCounter > blocks.blockList.length * 2) {
            console.debug(
                "Infinite loop encountered while adjusting docks: " + blk + " " + blocks.blockList
            );
            if (isOuterCall) this.endDeferCheckBounds();
            return;
        }

        let start = 1;
        if (myBlock.isTwoArgBooleanBlock()) {
            start = 0;
        } else if (myBlock.isInlineCollapsible() && myBlock.collapsed) {
            start = myBlock.connections.length - 1;
        }

        for (let c = start; c < myBlock.connections.length; c++) {
            const bdock = myBlock.docks[c];
            const cblk = myBlock.connections[c];
            if (cblk === null) {
                continue;
            }

            if (blocks.blockList[cblk] === null) {
                console.debug("This is not good: we encountered a null block: " + cblk);
                continue;
            }

            let foundMatch = false;
            let matchingBlock;
            for (
                matchingBlock = 0;
                matchingBlock < blocks.blockList[cblk].connections.length;
                matchingBlock++
            ) {
                if (blocks.blockList[cblk].connections[matchingBlock] === blk) {
                    foundMatch = true;
                    break;
                }
            }

            if (!foundMatch) {
                console.debug(
                    "Did not find match for " +
                        myBlock.name +
                        " (" +
                        blk +
                        ") and " +
                        blocks.blockList[cblk].name +
                        " (" +
                        cblk +
                        ")"
                );

                console.debug(myBlock.connections);
                console.debug(blocks.blockList[cblk].connections);
                break;
            }

            const cdock = blocks.blockList[cblk].docks[matchingBlock];
            let dx;
            let dy;
            let nx;
            let ny;
            if (c > 0) {
                dx = bdock[0] - cdock[0];
                if (myBlock.isInlineCollapsible() && myBlock.collapsed) {
                    const n = myBlock.docks.length;
                    const dd = myBlock.docks[n - 1][1] - myBlock.docks[n - 2][1];
                    dy = bdock[1] - dd - cdock[1];
                } else {
                    dy = bdock[1] - cdock[1];
                }

                if (myBlock.container === null) {
                    console.debug("Does this ever happen any more?");
                } else {
                    nx = myBlock.container.x + dx;
                    ny = myBlock.container.y + dy;
                }

                blocks._moveBlock(cblk, nx, ny);
            } else {
                dx = cdock[0] - bdock[0];
                dy = cdock[1] - bdock[1];
                nx = blocks.blockList[cblk].container.x + dx;
                ny = blocks.blockList[cblk].container.y + dy;
                blocks._moveBlock(blk, nx, ny);
            }

            if (c > 0) {
                this.adjustDocks(cblk, true);
            }
        }

        if (isOuterCall) {
            this.endDeferCheckBounds();
        }
    }

    /**
     * Find the top block in a stack.
     * @param {number} blk - Block index.
     * @returns {?number}
     */
    findTopBlock(blk) {
        const blocks = this.blocks;
        if (blk === null) {
            return null;
        }

        let myBlock = blocks.blockList[blk];
        if (myBlock.connections === null) {
            return blk;
        }

        if (myBlock.connections.length === 0) {
            return blk;
        }

        if (
            myBlock.connections.length > 1 &&
            myBlock.connections[0] !== null &&
            myBlock.connections[0] === lastLayoutItem(myBlock.connections)
        ) {
            console.debug(
                "WARNING: CORRUPTED BLOCK DATA. Block " +
                    myBlock.name +
                    " (" +
                    blk +
                    ") is connected to the same block " +
                    blocks.blockList[myBlock.connections[0]].name +
                    " (" +
                    myBlock.connections[0] +
                    ") twice."
            );
            return blk;
        }

        let topBlockLoop = 0;
        while (myBlock.connections[0] !== null) {
            topBlockLoop += 1;
            if (topBlockLoop > 2 * blocks.blockList.length) {
                console.debug("infinite loop finding topBlock?");
                if (myBlock.garbage) {
                    console.debug(myBlock.blockIndex + " " + myBlock.name);
                }
                break;
            }
            blk = myBlock.connections[0];
            myBlock = blocks.blockList[blk];
        }

        return blk;
    }

    /**
     * Find the bottom block in a stack.
     * @param {number} blk - Block index.
     * @returns {?number}
     */
    findBottomBlock(blk) {
        const blocks = this.blocks;
        if (blk === null) {
            return null;
        }

        let myBlock = blocks.blockList[blk];
        if (myBlock.connections === null) {
            return blk;
        }

        if (myBlock.connections.length === 0) {
            return blk;
        }

        let bottomBlockLoop = 0;
        while (lastLayoutItem(myBlock.connections) !== null) {
            bottomBlockLoop += 1;
            if (bottomBlockLoop > 2 * blocks.blockList.length) {
                console.debug("infinite loop finding bottomBlock?");
                break;
            }
            blk = lastLayoutItem(myBlock.connections);
            myBlock = blocks.blockList[blk];
        }

        return blk;
    }

    /**
     * Count all blocks in the stack starting from blk.
     * @param {?number} blk - Block index.
     * @returns {number}
     */
    countBlocksInStack(blk) {
        const blocks = this.blocks;
        let count = 0;
        if (blk !== null) {
            count += 1;

            for (let i = 1; i < blocks.blockList[blk].connections.length; i++) {
                count += this.countBlocksInStack(blocks.blockList[blk].connections[i]);
            }
        }

        return count;
    }

    /**
     * Find stack roots and store them on the owning Blocks instance.
     * @returns {void}
     */
    findStacks() {
        const blocks = this.blocks;
        blocks.stackList = [];
        for (let i = 0; i < blocks.blockList.length; i++) {
            if (blocks.blockList[i].trash) continue;
            if (blocks.blockList[i].connections[0] === null) {
                blocks.stackList.push(i);
            }
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = BlockLayoutManager;
}
