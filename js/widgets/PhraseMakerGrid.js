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

/**
 * @file PhraseMakerGrid.js
 * @description Matrix/grid state handling and data structure updates for PhraseMaker.
 */

const PhraseMakerGrid = {
    /**
     * Clears block references within the PhraseMaker.
     * @param {Object} pm - The PhraseMaker instance.
     */
    clearBlocks(pm) {
        // When creating a new matrix, we want to clear out any old
        // block references.
        pm._rowBlocks = [];
        pm._colBlocks = [];
        pm._rowMap = [];
        pm._rowOffset = [];
    },

    /**
     * Adds a row block to the PhraseMaker matrix.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {number} rowBlock - The pitch or drum block identifier to add to the matrix row.
     */
    addRowBlock(pm, rowBlock) {
        // When creating a matrix, we add rows whenever we encounter a
        // pitch or drum block (and some graphics blocks).
        pm._rowMap.push(pm._rowBlocks.length);
        pm._rowOffset.push(0);
        // In case there is a repeat block, use a unique block number
        // for each instance.
        while (pm._rowBlocks.includes(rowBlock)) {
            rowBlock = rowBlock + 1000000;
        }

        pm._rowBlocks.push(rowBlock);
    },

    /**
     * Adds a column block to the PhraseMaker matrix.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {number} rhythmBlock - The rhythm block identifier to add to the matrix column.
     * @param {number} n - The index of the rhythm block within the matrix column.
     */
    addColBlock(pm, rhythmBlock, n) {
        // When creating a matrix, we add columns when we encounter
        // rhythm blocks.
        // Search for previous instance of the same block (from a
        // repeat).
        let startIdx = 0;
        let obj;
        for (let i = 0; i < pm._colBlocks.length; i++) {
            obj = pm._colBlocks[i];
            if (obj[0] === rhythmBlock) {
                startIdx += 1;
            }
        }

        for (let i = startIdx; i < n + startIdx; i++) {
            pm._colBlocks.push([rhythmBlock, i]);
        }
    },

    /**
     * Adds a node to the PhraseMaker matrix.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {number} rowBlock - The pitch or drum block associated with the node.
     * @param {number} rhythmBlock - The rhythm block associated with the node.
     * @param {number} n - The index of the rhythm block within its column.
     * @param {number} blk - The block identifier representing the matrix cell.
     */
    addNode(pm, rowBlock, rhythmBlock, n, blk) {
        // A node exists for each cell in the matrix. It is used to
        // preserve and restore the state of the cell.
        if (pm._blockMap[blk] === undefined) {
            pm._blockMap[blk] = [];
        }

        let j = 0;
        let obj;
        for (let i = 0; i < pm._blockMap[blk].length; i++) {
            obj = pm._blockMap[blk][i];
            if (obj[0] === rowBlock && obj[1][0] === rhythmBlock && obj[1][1] === n) {
                j += 1;
            }
        }

        pm._blockMap[blk].push([rowBlock, [rhythmBlock, n], j]);
    },

    /**
     * Removes a node from the PhraseMaker matrix.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {number} rowBlock - The pitch or drum block associated with the node to remove.
     * @param {number} rhythmBlock - The rhythm block associated with the node to remove.
     * @param {number} n - The index of the rhythm block within its column.
     */
    removeNode(pm, rowBlock, rhythmBlock, n) {
        // When the matrix is changed, we may need to remove nodes.
        const blk = pm.blockNo;
        let obj;
        for (let i = 0; i < pm._blockMap[blk].length; i++) {
            obj = pm._blockMap[blk][i];
            if (obj[0] === rowBlock && obj[1][0] === rhythmBlock && obj[1][1] === n) {
                pm._blockMap[blk].splice(i, 1);
            }
        }
    },

    /**
     * Maps and collects blocks with a specified block name or type.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {string} blockName - The name of the block to map and collect.
     * @param {boolean} [withName=false] - Indicates whether to include the block name in the map.
     * @returns {Array<number | Array<number, string>>} An array of block IDs or [block ID, block name] pairs.
     */
    mapNotesBlocks(pm, blockName, withName) {
        const notesBlockMap = [];
        let blk = pm.activity.blocks.blockList[pm.blockNo].connections[1];
        let myBlock = pm.activity.blocks.blockList[blk];

        let bottomBlockLoop = 0;
        if (
            myBlock.name === blockName ||
            (blockName === "all" &&
                myBlock.name !== "hidden" &&
                myBlock.name !== "vspace" &&
                myBlock.name !== "hiddennoflow")
        ) {
            if (withName) {
                notesBlockMap.push([blk, myBlock.name]);
            } else {
                notesBlockMap.push(blk);
            }
        }

        while (pm._deps.last(myBlock.connections) != null) {
            bottomBlockLoop += 1;
            if (bottomBlockLoop > 2 * pm.activity.blocks.blockList) {
                // Could happen if the block data is malformed.
                break;
            }

            blk = pm._deps.last(myBlock.connections);
            myBlock = pm.activity.blocks.blockList[blk];
            if (
                myBlock.name === blockName ||
                (blockName === "all" &&
                    myBlock.name !== "hidden" &&
                    myBlock.name !== "vspace" &&
                    myBlock.name !== "hiddennoflow")
            ) {
                if (withName) {
                    notesBlockMap.push([blk, myBlock.name]);
                } else {
                    notesBlockMap.push(blk);
                }
            }
        }

        return notesBlockMap;
    },

    /**
     * Checks for note blocks or repeat blocks within the current block map.
     * Sets the '_noteBlocks' flag to 'true' if any 'newnote' or 'repeat' block is found.
     * @param {Object} pm - The PhraseMaker instance.
     */
    lookForNoteBlocksOrRepeat(pm) {
        pm._noteBlocks = false;
        const bno = pm.blockNo;
        let blk;
        for (let i = 0; i < pm._blockMap[bno].length; i++) {
            blk = pm._blockMap[bno][i][1][0];
            if (blk === -1) {
                continue;
            }

            if (pm.activity.blocks.blockList[blk] === null) {
                continue;
            }

            if (pm.activity.blocks.blockList[blk] === undefined) {
                //eslint-disable-next-line no-console
                console.debug("block " + blk + " is undefined");
                continue;
            }

            if (
                pm.activity.blocks.blockList[blk].name === "newnote" ||
                pm.activity.blocks.blockList[blk].name === "repeat"
            ) {
                pm._noteBlocks = true;
                break;
            }
        }
    },

    /**
     * Synchronizes marked blocks based on block mapping and helper information.
     * @param {Object} pm - The PhraseMaker instance.
     */
    syncMarkedBlocks(pm) {
        const newBlockMap = [];
        const blk = pm.blockNo;
        for (let i = 0; i < pm._blockMap[blk].length; i++) {
            if (pm._blockMap[blk][i][0] === -1) {
                continue;
            }

            for (let j = 0; j < pm._blockMapHelper.length; j++) {
                if (
                    JSON.stringify(pm._blockMap[blk][i][1]) ===
                    JSON.stringify(pm._blockMapHelper[j][0])
                ) {
                    for (let k = 0; k < pm._blockMapHelper[j][1].length; k++) {
                        newBlockMap.push([
                            pm._blockMap[blk][i][0],
                            pm._colBlocks[pm._blockMapHelper[j][1][k]],
                            pm._blockMap[blk][i][2]
                        ]);
                    }
                }
            }
        }

        pm._blockMap[blk] = newBlockMap.filter((el, i) => {
            return (
                i ===
                newBlockMap.findIndex(ele => {
                    return JSON.stringify(ele) === JSON.stringify(el);
                })
            );
        });
    }
};

// Export for global use
window.PhraseMakerGrid = PhraseMakerGrid;

// Export for RequireJS/AMD
if (typeof define === "function" && define.amd) {
    define([], function () {
        return PhraseMakerGrid;
    });
}

// Export for Node.js/CommonJS (for testing)
if (typeof module !== "undefined" && module.exports) {
    module.exports = PhraseMakerGrid;
}
