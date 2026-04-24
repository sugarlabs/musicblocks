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
   exported BlockConnectionManager
*/

const ALLOWED_CONNECTIONS = new Set([
    "vspaceout:vspacein",
    "vspacein:vspaceout",
    "in:out",
    "out:in",
    "in:vspaceout",
    "vspaceout:in",
    "out:vspacein",
    "vspacein:out",
    "numberin:numberout",
    "numberin:anyout",
    "numberout:numberin",
    "anyout:numberin",
    "textin:textout",
    "textin:anyout",
    "textout:textin",
    "anyout:textin",
    "booleanout:booleanin",
    "booleanin:booleanout",
    "mediain:mediaout",
    "mediaout:mediain",
    "mediain:textout",
    "textout:mediain",
    "filein:fileout",
    "fileout:filein",
    "casein:caseout",
    "caseout:casein",
    "vspaceout:casein",
    "casein:vspaceout",
    "vspacein:caseout",
    "caseout:vspacein",
    "solfegein:anyout",
    "solfegein:solfegeout",
    "solfegein:textout",
    "solfegein:noteout",
    "solfegein:scaledegreeout",
    "solfegein:numberout",
    "anyout:solfegein",
    "solfegeout:solfegein",
    "textout:solfegein",
    "noteout:solfegein",
    "scaledegreeout:solfegein",
    "numberout:solfegein",
    "notein:solfegeout",
    "notein:scaledegreeout",
    "notein:textout",
    "notein:noteout",
    "solfegeout:notein",
    "scaledegreeout:notein",
    "textout:notein",
    "noteout:notein",
    "pitchout:anyin",
    "gridout:anyin",
    "anyin:textout",
    "anyin:mediaout",
    "anyin:numberout",
    "anyin:anyout",
    "anyin:fileout",
    "anyin:solfegeout",
    "anyin:scaledegreeout",
    "anyin:noteout",
    "textout:anyin",
    "mediaout:anyin",
    "numberout:anyin",
    "anyout:anyin",
    "fileout:anyin",
    "solfegeout:anyin",
    "scaledegreeout:anyin",
    "noteout:anyin"
]);

const lastItem = values => {
    if (typeof last !== "undefined") {
        return last(values);
    }

    return values[values.length - 1];
};

/**
 * Owns block connection compatibility and topology lookups.
 */
class BlockConnectionManager {
    /**
     * @param {Blocks} blocks - The owning Blocks instance.
     */
    constructor(blocks) {
        this.blocks = blocks;
    }

    /**
     * Test for a valid connection between two dock types.
     * @param {string} type1 - Dock type 1.
     * @param {string} type2 - Dock type 2.
     * @returns {boolean}
     */
    testConnectionType(type1, type2) {
        return ALLOWED_CONNECTIONS.has(type1 + ":" + type2);
    }

    /**
     * Return a containing arg clamp block or null.
     * @param {number} blk - Block index.
     * @returns {?number}
     */
    insideArgClamp(blk) {
        const blocks = this.blocks;
        if (blocks.blockList[blk] === null) {
            console.debug("null block in blockList? " + blk);
            return null;
        } else if (blocks.blockList[blk].connections[0] === null) {
            return null;
        }

        const cblk = blocks.blockList[blk].connections[0];
        if (blocks.blockList[cblk].isArgClamp()) {
            return cblk;
        }

        return null;
    }

    /**
     * Return a containing expandable block or null.
     * @param {number} blk - Block index.
     * @returns {?number}
     */
    insideExpandableBlock(blk) {
        const blocks = this.blocks;
        if (blocks.blockList[blk] === null) {
            console.debug("null block in blockList? " + blk);
            return null;
        } else if (blocks.blockList[blk].connections[0] === null) {
            return null;
        }

        const cblk = blocks.blockList[blk].connections[0];
        if (blocks.blockList[cblk].isExpandableBlock()) {
            if (
                blocks.blockList[cblk].isArgFlowClampBlock() ||
                blocks.blockList[cblk].isLeftClampBlock()
            ) {
                return cblk;
            } else if (blk === lastItem(blocks.blockList[cblk].connections)) {
                return this.insideExpandableBlock(cblk);
            }

            return cblk;
        }

        return this.insideExpandableBlock(cblk);
    }

    /**
     * Return the first containing inline collapsible block, if any.
     * @param {number} blk - Block index.
     * @returns {?number}
     */
    insideInlineCollapsibleBlock(blk) {
        const blocks = this.blocks;
        if (blk === null) {
            return null;
        }

        const c0 = blocks.blockList[blk].connections[0];
        if (c0 === null) {
            return null;
        }

        if (
            blocks.blockList[c0].isInlineCollapsible() &&
            blk !== lastItem(blocks.blockList[c0].connections)
        ) {
            return c0;
        }

        return this.insideInlineCollapsibleBlock(c0);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = BlockConnectionManager;
}
