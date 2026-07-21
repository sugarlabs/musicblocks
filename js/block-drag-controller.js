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

/*
   These are intentionally bare globals, not RequireJS dependency-injected
   parameters. This file follows the same convention as blocks.js and
   block.js: the app is not built as real ES modules, so RequireJS's shim
   `deps` (see loader.js) only sequences <script> load order, and the
   values below are attached to `window` by the modules that own them
   before this file's code ever runs. Converting this one file to receive
   them as AMD parameters would make it inconsistent with every other
   script in js/ without removing the underlying global dependency (the
   values still come from window at runtime either way).
   - js/utils/utils.js: delayExecution, getTextWidth, _
   - js/artwork.js: DEFAULTBLOCKSCALE
   - js/block.js: STRINGLEN, TEXTWIDTH
   - js/block-constants.js: MINIMUMDOCKDISTANCE, LONGSTACK

   Block classification (COLLAPSIBLES, INLINECOLLAPSIBLES, and similar
   capability/identity lists) is intentionally NOT read here. That data
   is owned by blocks.js; this controller reaches it only through the
   Blocks-owned getCollapsiblesSet()/getInlineCollapsiblesSet() methods
   (see the dock-snapping candidate scan below), so there is exactly one
   place that constructs Sets from those lists.
*/
/* global DEFAULTBLOCKSCALE, STRINGLEN, TEXTWIDTH, delayExecution, getTextWidth, _,
   MINIMUMDOCKDISTANCE, LONGSTACK */

/* exported setupBlockDragController, BlockDragController */

/**
 * Manages block dragging: computing the group of connected blocks that
 * move together, applying pointer-driven position deltas, and resolving
 * dock snapping when a drag ends.
 */
class BlockDragController {
    /**
     * @param {object} blocks - The Blocks instance.
     */
    constructor(blocks) {
        this.blocks = blocks;
    }

    /**
     * Adjust the dock positions of all blocks in the current drag group.
     * @private
     * @returns {void}
     */
    _adjustBlockPositions() {
        const blocks = this.blocks;
        if (blocks.dragGroup.length < 2) {
            return;
        }

        blocks.adjustDocks(blocks.dragGroup[0], true);
    }

    /**
     * Create the drag group from the blocks connected to blk.
     * @param - blk - block
     * @public
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
        this._calculateDragGroup(blk);
    }

    /**
     * Cache the drag group for a block. Call on mousedown so the
     * expensive tree traversal runs once, not on every pressmove.
     * @param - blk - block index
     * @public
     * @returns {void}
     */
    cacheDragGroup(blk) {
        const blocks = this.blocks;
        this.findDragGroup(blk);
        blocks._cachedDragGroup = blocks.dragGroup.slice();
    }

    /**
     * Invalidate the cached drag group (call on pressup/mouseout).
     * @public
     * @returns {void}
     */
    clearCachedDragGroup() {
        const blocks = this.blocks;
        blocks._cachedDragGroup = null;
        blocks._dragActiveGroup = null;
    }

    /**
     * Given a block, find all the blocks connected to it.
     * @param - blk - block
     * @private
     * @returns {void}
     */
    _calculateDragGroup(blk) {
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
        /** If this happens, something is really broken. */
        if (myBlock === null) {
            console.debug("null block encountered... this is bad. " + blk);
            return;
        }

        /** As before, does these ever happen? */
        if (myBlock.connections === null) {
            blocks.dragGroup = [blk];
            return;
        }

        /** Some malformed blocks might have no connections. */
        if (myBlock.connections.length === 0) {
            blocks.dragGroup = [blk];
            return;
        }

        blocks.dragGroup.push(blk);

        for (let c = 1; c < myBlock.connections.length; c++) {
            const cblk = myBlock.connections[c];
            if (cblk !== null) {
                /** Recurse */
                this._calculateDragGroup(cblk);
            }
        }
    }

    /**
     * Relative move of a block (and its label) by dx, dy
     * @param - blk - block
     * @param - dx - updated x position
     * @param - dy - updated y position
     * @public
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

            blocks._updateSpatialGrid(blk);

            if (blocks._deferCheckBoundsCount > 0) {
                blocks._checkBoundsPending = true;
            } else {
                blocks.scheduleCheckBounds();
            }
        } else {
            console.debug("No container yet for block " + myBlock.name);
        }
    }

    /**
     * Move a block by dx, dy without running checkBounds.
     * Used during drag operations where checkBounds is deferred
     * to a single rAF-scheduled call at the end of the frame.
     * @param - blk - block index
     * @param - dx - delta x
     * @param - dy - delta y
     * @public
     * @returns {void}
     */
    moveBlockRelativeBatched(blk, dx, dy) {
        const blocks = this.blocks;
        blocks.inLongPress = false;
        blocks.isBlockMoving = true;
        const myBlock = blocks.blockList[blk];
        if (myBlock.container) {
            myBlock.container.x += dx;
            myBlock.container.y += dy;
            blocks._updateSpatialGrid(blk);
        }
    }

    /**
     * Moves the blocks in a stack to a new position.
     * @param blk - block
     * @param dx - x position
     * @param dy - y position
     * @public
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
     * Handle connections when blocks are moved.
     * @param - thisBlock -new variable
     * @public
     * @returns {void}
     */
    async blockMoved(thisBlock) {
        const blocks = this.blocks;
        /**
         * When a block is moved, we have to check the following:
         * (0) Is it inside of a expandable block?
         *     Is it connected to a collapsed block?
         *     Is it an arg inside an arg clamp?
         * (1) Is it an arg block connected to a two-arg block?
         * (2) Disconnect its connection[0];
         * (3) Look for a new connection;
         *     Is it potentially an arg inside an arg clamp?
         * (4) Is it an arg block connected to a 2-arg block?
         * (5) Is it a pitch block being inserted or removed from
         *     a Note clamp? In which case, we may have to remove
         *     or add a silence block.
         * (6) Is it the name of an action block? In which case we
         *     need to check to see if we need to rename it.
         * (7) Is it the name of a storein block? In which case we
         *     need to check to see if we need to add a palette entry.
         * (8) Is it a case or default block? We need to make sure that
         *     they are inside a switch block.
         * (9) And we need to recheck if it inside of a expandable block.
         */
        const initialTopBlock = blocks.findTopBlock(thisBlock);
        /** Find any containing expandable blocks. */
        blocks.clampBlocksToCheck = [];
        if (thisBlock === null) {
            console.debug("blockMoved called with null block.");
            return;
        }

        let blk = blocks.insideExpandableBlock(thisBlock);
        let expandableLoopCounter = 0;

        let parentblk = null;
        if (blk !== null) {
            parentblk = blk;
        }

        let actionCheck = false;

        while (blk !== null) {
            expandableLoopCounter += 1;
            if (expandableLoopCounter > 2 * blocks.blockList.length) {
                console.debug("Infinite loop encountered checking for expandables?");
                break;
            }

            if (blocks.blockList[blk].name === "ifthenelse") {
                blocks.clampBlocksToCheck.push([blk, 0]);
                blocks.clampBlocksToCheck.push([blk, 1]);
            } else {
                blocks.clampBlocksToCheck.push([blk, 0]);
            }
            blk = blocks.insideExpandableBlock(blk);
        }

        blocks._checkTwoArgBlocks = [];
        const checkArgBlocks = [];
        const myBlock = blocks.blockList[thisBlock];
        if (myBlock === null) {
            console.debug("null block found in blockMoved method: " + thisBlock);
            return;
        }

        const c = myBlock.connections[0];
        let cBlock;
        if (c !== null) {
            cBlock = blocks.blockList[c];
        }

        /** If it is an arg block, where is it coming from? */
        if (myBlock.isArgBlock() && c !== null) {
            /**
             * We care about twoarg (2arg) blocks with
             * connections to the first arg;
             */
            if (blocks.blockList[c].isTwoArgBlock() || blocks.blockList[c].isArgClamp()) {
                if (cBlock.connections[1] === thisBlock) {
                    blocks._checkTwoArgBlocks.push(c);
                }
            } else if (
                (blocks.blockList[c].isArgBlock() && blocks.blockList[c].isExpandableBlock()) ||
                blocks.blockList[c].isArgClamp()
            ) {
                if (cBlock.connections[1] === thisBlock) {
                    blocks._checkTwoArgBlocks.push(c);
                }
            }
        }

        /** Get widget window's title */
        const widgetTitle = document.getElementsByClassName("wftTitle");

        /** Disconnect from connection[0] (both sides of the connection). */
        if (c !== null) {
            /** Disconnect both ends of the connection. */
            for (let i = 1; i < cBlock.connections.length; i++) {
                if (cBlock.connections[i] === thisBlock) {
                    cBlock.connections[i] = null;
                    break;
                }
            }

            myBlock.connections[0] = null;
            blocks.raiseStackToTop(thisBlock);

            /**
             * Check if we are disconnecting blocks from widget blocks;
             * then reinit if widget windows is open.
             */
            let lockInit = false;
            for (let x = 0; x < widgetTitle.length; x++) {
                if (lockInit === false) {
                    switch (widgetTitle[x].innerHTML) {
                        case "oscilloscope":
                        case "tempo":
                        case "rhythm maker":
                        case "pitch slider":
                        case "pitch staircase":
                        case "status":
                        case "phrase maker":
                        case "lego bricks":
                        case "custom mode":
                        case "music keyboard":
                        case "pitch drum":
                        case "meter":
                        case "temperament":
                        case "timbre":
                            lockInit = true;
                            if (
                                blocks.blockList[initialTopBlock].protoblock.staticLabels[0] ===
                                widgetTitle[x].innerHTML
                            ) {
                                blocks.reInitWidget(initialTopBlock, 1500);
                            }
                            break;
                    }
                }
            }
        }

        /** Look for a new connection. */
        const x1 = myBlock.container.x + myBlock.docks[0][0];
        const y1 = myBlock.container.y + myBlock.docks[0][1];

        /** Find the nearest dock; if it is close enough, make the connection. */
        let newBlock = null;
        let newConnection = null;
        let min = (MINIMUMDOCKDISTANCE / DEFAULTBLOCKSCALE) * blocks.blockScale;
        const blkType = myBlock.docks[0][2];

        /** Is the added block above or below? */
        let insertAfterDefault = true;

        // Use spatial grid for O(1) neighbor lookup instead of full blockList scan
        const nearby = blocks._getNearbyBlocks(x1, y1);

        for (let bi = 0; bi < nearby.length; bi++) {
            const b = nearby[bi];

            /** Don't connect to yourself. */
            if (b === thisBlock) {
                continue;
            }

            /** Don't connect to a collapsed block. */
            if (blocks.blockList[b].inCollapsed) {
                continue;
            }

            if (blocks.getCollapsiblesSet().has(blocks.blockList[b].name)) {
                if (!blocks.getInlineCollapsiblesSet().has(blocks.blockList[b].name)) {
                    if (blocks.blockList[b].collapsed) {
                        continue;
                    }
                }
            }

            /** Don't connect to a block in the trash. */
            if (blocks.blockList[b].trash) {
                continue;
            }

            /** Does this every happen? Or is there always a hidden block below? */

            let start = 1;
            if (blocks.blockList[b].isInlineCollapsible() && blocks.blockList[b].collapsed) {
                /** Only try docking to last connection of inline collapsed blocks. */
                start = blocks.blockList[b].connections.length - 1;
            }

            const ILLEGAL_BOUNCE_DIST = 400; // squared distance (20px)
            let bounced = false;

            for (let i = start; i < blocks.blockList[b].connections.length; i++) {
                /**
                 * When converting from Python projects to JS format,
                 * sometimes extra null connections are added. We need
                 * to ignore them.
                 */
                if (i === blocks.blockList[b].docks.length) {
                    break;
                }

                if (
                    i === blocks.blockList[b].connections.length - 1 &&
                    blocks.blockList[b].connections[i] !== null &&
                    blocks.blockList[blocks.blockList[b].connections[i]].isNoHitBlock()
                ) {
                    /**
                     * Don't break the connection between a block and
                     * a hidden block below it.
                     */
                    continue;
                } else if (
                    ["backward", "status"].includes(blocks.blockList[b].name) &&
                    i === 1 &&
                    blocks.blockList[b].connections[1] !== null &&
                    blocks.blockList[blocks.blockList[b].connections[1]].isNoHitBlock()
                ) {
                    /**
                     * Don't break the connection between a backward
                     * block and a hidden block attached to its clamp.
                     */
                    continue;
                } else if (
                    blocks.blockList[b].name === "action" &&
                    i === 2 &&
                    blocks.blockList[b].connections[2] !== null &&
                    blocks.blockList[blocks.blockList[b].connections[2]].isNoHitBlock()
                ) {
                    /**
                     * Don't break the connection between an action
                     * block and a hidden block attached to its clamp.
                     */
                    continue;
                }

                /** Look for available connections. */
                if (blocks._testConnectionType(blkType, blocks.blockList[b].docks[i][2])) {
                    const x2 = blocks.blockList[b].container.x + blocks.blockList[b].docks[i][0];
                    const y2 = blocks.blockList[b].container.y + blocks.blockList[b].docks[i][1];
                    const dist = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
                    if (dist < min) {
                        newBlock = b;
                        newConnection = i;
                        min = dist;
                    }
                } else {
                    // Bounce away from illegal connection if the distance was small.
                    if (!myBlock.isDragging) {
                        const x2 =
                            blocks.blockList[b].container.x + blocks.blockList[b].docks[i][0];
                        const y2 =
                            blocks.blockList[b].container.y + blocks.blockList[b].docks[i][1];

                        const dx = x2 - x1;
                        const dy = y2 - y1;
                        const dist = dx * dx + dy * dy;

                        if (!bounced && dist < ILLEGAL_BOUNCE_DIST) {
                            console.debug("cannot connect these two block types");

                            const distance = Math.sqrt(dist) || 0.0001;
                            const bounceFactor = 60;

                            // Snap back first
                            if (myBlock.lastGoodX !== undefined) {
                                myBlock.container.x = myBlock.lastGoodX;
                                myBlock.container.y = myBlock.lastGoodY;
                            }

                            // Directional push away from illegal dock based on block type
                            if (myBlock.isArgBlock()) {
                                // Arg blocks bounce to the right
                                myBlock.container.x += bounceFactor;
                            } else {
                                // Flow blocks bounce below and to the right
                                myBlock.container.x += bounceFactor * 0.7;
                                myBlock.container.y += bounceFactor;
                            }

                            bounced = true;
                        }
                    }
                }
            }
        }

        if (newBlock !== null) {
            const n = blocks._countBlocksInStack(blocks.findTopBlock(newBlock));
            if (n > LONGSTACK) {
                blocks.activity.errorMsg(_("Consider breaking this stack into parts."));
            }

            /** We found a match. */
            myBlock.connections[0] = newBlock;
            const connection = blocks.blockList[newBlock].connections[newConnection];
            let bottom;

            if (connection === null) {
                if (blocks.blockList[newBlock].isArgClamp()) {
                    /** If it is an arg clamp, we may have to adjust the slot size. */
                    if (blocks.blockList[newBlock].isArgumentLikeBlock() && newConnection === 1) {
                        /** pass */
                    } else if (
                        ["doArg", "nameddoArg"].includes(blocks.blockList[newBlock].name) &&
                        newConnection === blocks.blockList[newBlock].connections.length - 1
                    ) {
                        /** pass */
                    } else {
                        /** Get the size of the block we are inserting adding. */

                        const size = blocks._getBlockSize(thisBlock);
                        /** Get the current slot list. */
                        const slotList = blocks.blockList[newBlock].argClampSlots;
                        let si = newConnection - 1;
                        /** Which slot is this block in? */
                        if (blocks.blockList[newBlock].isArgumentLikeBlock()) {
                            si = newConnection - 2;
                        }

                        if (slotList[si] !== size) {
                            slotList[si] = size;
                            blocks.blockList[newBlock].updateArgSlots(slotList);
                        }
                    }
                }
            } else {
                /**
                 * Three scenarios in which we may be overriding an
                 * existing connection:
                 * (1) if it is an argClamp, add a new slot below the
                 *     current block;
                 * (2) if it is an arg block, replace it; or
                 * (3) if it is a flow block, insert it into the flow.
                 * A few corner cases: Whenever we connect (or disconnect)
                 * from an action block (c[1] arg), we need to ensure we have
                 * a unique action name; Whenever we connect to a newnote
                 * block (c[2] flow), we need to ensure we have either a silence
                 * block or a pitch block. And if we are connecting to a
                 * storein block, we need to ensure that there is a palette
                 * entry for the new namedbox.
                 */
                insertAfterDefault = false;
                if (blocks.blockList[newBlock].isArgClamp()) {
                    if (blocks.blockList[newBlock].isArgumentLikeBlock() && newConnection === 1) {
                        /**
                         * If it is the action name then treat it like
                         * a standard replacement.
                         */
                        blocks.blockList[connection].connections[0] = null;
                        this.findDragGroup(connection);
                        for (let c = 0; c < blocks.dragGroup.length; c++) {
                            this.moveBlockRelative(blocks.dragGroup[c], 40, 40);
                        }
                    } else if (
                        ["doArg", "nameddoArg"].includes(blocks.blockList[newBlock].name) &&
                        newConnection === blocks.blockList[newBlock].connections.length - 1
                    ) {
                        /** If it is the bottom of the flow, insert as usual. */
                        bottom = blocks.findBottomBlock(thisBlock);
                        blocks.blockList[connection].connections[0] = bottom;
                        blocks.blockList[bottom].connections[
                            blocks.blockList[bottom].connections.length - 1
                        ] = connection;
                    } else {
                        /**
                         * Move the block in the current slot down one
                         * slot (cascading and creating a new slot if
                         * necessary).
                         */
                        /** Get the size of the block we are inserting adding. */
                        const size = blocks._getBlockSize(thisBlock);

                        /** Get the current slot list. */
                        const slotList = blocks.blockList[newBlock].argClampSlots;
                        /** Which slot is this block in? */
                        const ci = blocks.blockList[newBlock].connections.indexOf(connection);
                        let si = ci - 1;
                        if (blocks.blockList[newBlock].isArgumentLikeBlock()) {
                            si = ci - 2;
                        }

                        const emptySlot = null;
                        let emptyConnection = null;
                        /** Is there an empty slot below? */
                        for (let emptySlot = si; emptySlot < slotList.length; emptySlot++) {
                            if (
                                blocks.blockList[newBlock].connections[ci + emptySlot - si] === null
                            ) {
                                emptyConnection = ci + emptySlot - si;
                                break;
                            }
                        }

                        if (emptyConnection === null) {
                            slotList.push(1);
                            if (blocks.blockList[newBlock].name !== "makeblock") {
                                blocks._newLocalArgBlock(slotList.length);
                            }

                            emptyConnection = ci + emptySlot - si;
                            blocks.blockList[newBlock].connections.push(null);

                            /** Slide everything down one slot. */
                            for (let i = slotList.length - 1; i > si + 1; i--) {
                                slotList[i] = slotList[i - 1];
                            }

                            for (
                                let i = blocks.blockList[newBlock].connections.length - 1;
                                i > ci + 1;
                                i--
                            ) {
                                blocks.blockList[newBlock].connections[i] =
                                    blocks.blockList[newBlock].connections[i - 1];
                            }
                        }
                        /** The new block is added below the current connection... */
                        newConnection += 1;
                        /** Set its slot size too. */
                        slotList[si + 1] = size;

                        blocks.blockList[newBlock].updateArgSlots(slotList);
                    }
                } else if (myBlock.isArgBlock()) {
                    blocks.blockList[connection].connections[0] = null;

                    /** If we are replacing an arg block, put certain default blocks in the trash */
                    if (
                        [
                            "number",
                            "solfege",
                            "eastindiansolfege",
                            "scaledegree2",
                            "notename",
                            "text"
                        ].includes(blocks.blockList[connection].name)
                    ) {
                        blocks.sendStackToTrash(blocks.blockList[connection]);
                    } else {
                        this.findDragGroup(connection);
                        for (let c = 0; c < blocks.dragGroup.length; c++) {
                            this.moveBlockRelative(blocks.dragGroup[c], 40, 40);
                        }
                    }

                    /** We need to rename the action stack. */
                    if (blocks.blockList[newBlock].name === "action") {
                        actionCheck = true;

                        if (myBlock.value !== blocks.blockList[connection].value) {
                            /**
                             * Temporarily disconnect to ensure we don't
                             * find myBlock when looking for a unique name.
                             */
                            const c = myBlock.connections[0];
                            myBlock.connections[0] = null;
                            let name = blocks.findUniqueActionName(myBlock.value);
                            myBlock.connections[0] = c;

                            if (name !== myBlock.value) {
                                myBlock.value = name;
                                let label = name;
                                if (getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH) {
                                    label = label.substr(0, STRINGLEN) + "...";
                                }
                                myBlock.text.text = label;
                                myBlock.container.updateCache();
                            }

                            await delayExecution(75);
                            /**
                             * A previously disconnected name may have left
                             * an entry in the palette we need to remove.
                             */
                            name = blocks.blockList[connection].value;
                            if (blocks.protoBlockDict["myDo_" + name] !== undefined) {
                                delete blocks.protoBlockDict["myDo_" + name];
                                blocks.activity.palettes.dict["action"].hideMenu(true);
                            }

                            const metadata = blocks.actionMetadata(newBlock);
                            blocks.newNameddoBlock(
                                myBlock.value,
                                metadata.hasReturn,
                                metadata.hasArgs
                            );
                            const blockPalette = blocks.activity.palettes.dict["action"];
                            for (let b = 0; b < blockPalette.protoList.length; b++) {
                                const protoblock = blockPalette.protoList[b];
                                if (
                                    protoblock.name === "nameddo" &&
                                    protoblock.staticLabels[0] ===
                                        blocks.blockList[connection].value
                                ) {
                                    await delayExecution(50);
                                    blockPalette.remove(
                                        protoblock,
                                        blocks.blockList[connection].value
                                    );
                                    delete blocks.protoBlockDict[
                                        "myDo_" + blocks.blockList[connection].value
                                    ];
                                    blocks.activity.palettes.hide();
                                    blocks.activity.palettes.updatePalettes("action");

                                    await delayExecution(500);
                                    blocks.activity.palettes.show();
                                    break;
                                }
                            }

                            blocks.renameNameddos(
                                blocks.blockList[connection].value,
                                myBlock.value
                            );
                            blocks.renameDos(blocks.blockList[connection].value, myBlock.value);
                        }
                    } else if (blocks.blockList[newBlock].name === "storein") {
                        /** We may need to add new storein and namedo blocks to the palette. */
                        if (newConnection === 1 && myBlock.value !== "box") {
                            /** blocks.newStoreinBlock(myBlock.value); */
                            blocks.newStorein2Block(myBlock.value);
                            blocks.newNamedboxBlock(myBlock.value);
                            await delayExecution(50);
                            blocks.activity.palettes.updatePalettes("boxes");
                        }
                    }
                } else if (myBlock.protoblock.style === "argclamparg") {
                    /** We don't need to do anything special with argclamparg blocks. */
                    /** console.debug("skipping argclamparg"); */
                } else if (!blocks.blockList[thisBlock].isArgFlowClampBlock()) {
                    bottom = blocks.findBottomBlock(thisBlock);
                    blocks.blockList[connection].connections[0] = bottom;
                    blocks.blockList[bottom].connections[
                        blocks.blockList[bottom].connections.length - 1
                    ] = connection;
                } else {
                    console.debug("HOW DID WE GET HERE?");
                }
            }

            blocks.blockList[newBlock].connections[newConnection] = thisBlock;

            /**
             * Remove the silence block (if it is present) after
             * adding a new block inside of a note block.
             */
            if (
                blocks._insideNoteBlock(thisBlock) !== null &&
                blocks.blockList[thisBlock].connections.length > 1
            ) {
                /** If blocks are inserted above the silence block. */
                if (insertAfterDefault) {
                    newBlock = blocks.deletePreviousDefault(thisBlock);
                } else if (bottom) {
                    blocks.deleteNextDefault(bottom);
                }
            }

            /** If we attached a name to an action block, see if we need to rename it. */
            if (blocks.blockList[newBlock].name === "action" && !actionCheck) {
                // Is there already another action block with this name?
                for (let b = 0; b < blocks.blockList.length; b++) {
                    if (b === newBlock) {
                        continue;
                    }

                    if (blocks.blockList[b].trash) {
                        continue;
                    }

                    if (blocks.blockList[b].name === "action") {
                        if (blocks.blockList[b].connections[1] !== null) {
                            if (
                                blocks.blockList[blocks.blockList[b].connections[1]].value ===
                                blocks.blockList[thisBlock].value
                            ) {
                                blocks.blockList[thisBlock].value = blocks.findUniqueActionName(
                                    blocks.blockList[thisBlock].value
                                );
                                let label = blocks.blockList[thisBlock].value;
                                if (getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH) {
                                    label = label.substr(0, STRINGLEN) + "...";
                                }
                                blocks.blockList[thisBlock].text.text = label;
                                blocks.blockList[thisBlock].container.updateCache();
                                const metadata = blocks.actionMetadata(b);
                                blocks.newNameddoBlock(
                                    blocks.blockList[thisBlock].value,
                                    metadata.hasReturn,
                                    metadata.hasArgs
                                );
                                blocks.setActionProtoVisibility(false);
                            }
                        }
                    }
                }
            }

            blocks.adjustDocks(newBlock, true);

            // Graphical feedback for new connection
            this.findDragGroup(thisBlock);
            const blocksToHighlight = [...blocks.dragGroup];
            if (blocks.blockList[newBlock]) {
                blocksToHighlight.push(newBlock);
            }

            blocksToHighlight.forEach(b => {
                if (blocks.blockList[b]) {
                    blocks.blockList[b].highlight();
                }
            });
            blocks.activity.refreshCanvas();

            setTimeout(() => {
                blocksToHighlight.forEach(b => {
                    if (blocks.blockList[b]) {
                        blocks.blockList[b].unhighlight();
                    }
                });
                blocks.activity.refreshCanvas();
            }, 500);

            /** Check if top block is one of the widget blocks. */
            let lockInit = false;
            if (c === null) {
                for (let i = 0; i < widgetTitle.length; i++) {
                    const that = blocks;
                    if (lockInit === false) {
                        let newTopBlock;
                        switch (widgetTitle[i].innerHTML) {
                            case "oscilloscope":
                            case "tempo":
                            case "rhythm maker":
                            case "pitch slider":
                            case "pitch staircase":
                            case "status":
                            case "phrase maker":
                            case "lego bricks":
                            case "custom mode":
                            case "music keyboard":
                            case "pitch drum":
                            case "meter":
                            case "temperament":
                            case "timbre":
                                lockInit = true;
                                newTopBlock = that.findTopBlock(thisBlock);
                                if (
                                    blocks.blockList[newTopBlock].protoblock.staticLabels[0] ===
                                    widgetTitle[i].innerHTML
                                ) {
                                    blocks.reInitWidget(newTopBlock, 1500);
                                }
                                break;
                        }
                    }
                }
            }
        }

        /** If it is an arg block, where is it coming from? */
        if (myBlock.isArgumentLikeBlock() && newBlock !== null) {
            const parentBlock = blocks.blockList[newBlock];

            // Find which connection index this block is attached to
            const connectionIndex = parentBlock.connections.indexOf(thisBlock);

            // Guard against invalid index (can happen during drag/undo/intermediate states)
            if (connectionIndex !== -1) {
                // Ask the parent block what type of layout update it needs for this connection
                const updateType = parentBlock.getLayoutUpdateType(connectionIndex);

                if (updateType === "ARG") {
                    if (!blocks._checkTwoArgBlocks.includes(newBlock)) {
                        blocks._checkTwoArgBlocks.push(newBlock);
                    }
                } else if (updateType === "FLOW") {
                    if (!checkArgBlocks.includes(newBlock)) {
                        checkArgBlocks.push(newBlock);
                    }
                }
            }
        }

        blocks.addDefaultBlock(parentblk, thisBlock, actionCheck);

        /**
         * Put block adjustments inside a slight delay to make the
         * addition/subtraction of vspace and changes of block shape
         * appear less abrupt (and it can be a little racy).
         * If we changed the contents of a arg block, we may need a vspace.
         */
        if (checkArgBlocks.length > 0) {
            for (let i = 0; i < checkArgBlocks.length; i++) {
                blocks._addRemoveVspaceBlock(checkArgBlocks[i]);
            }
        }

        /** If we changed the contents of a two-arg block, we need to adjust it. */
        if (blocks._checkTwoArgBlocks.length > 0) {
            blocks._adjustExpandableTwoArgBlock(blocks._checkTwoArgBlocks);
        }

        /** First, adjust the docks for any blocks that may have had a vspace added. */
        for (let i = 0; i < checkArgBlocks.length; i++) {
            blocks.adjustDocks(checkArgBlocks[i], true);
        }

        /** Next, recheck if the connection is inside of a expandable block. */
        blk = blocks.insideExpandableBlock(thisBlock);
        expandableLoopCounter = 0;
        while (blk !== null) {
            /** Extra check for malformed data. */
            expandableLoopCounter += 1;
            if (expandableLoopCounter > 2 * blocks.blockList.length) {
                console.debug("Infinite loop checking for expandables?");

                console.debug(blocks.blockList);
                break;
            }

            if (blocks.blockList[blk].name === "ifthenelse") {
                blocks.clampBlocksToCheck.push([blk, 0]);
                blocks.clampBlocksToCheck.push([blk, 1]);
            } else {
                blocks.clampBlocksToCheck.push([blk, 0]);
            }

            blk = blocks.insideExpandableBlock(blk);
        }
        blocks.isBlockMoving = false;
        blocks.adjustExpandableClampBlock();
        blocks.activity.refreshCanvas();

        if (blocks.activity.turtles.running()) {
            blocks.activity.logo.doStopTurtles();
            const stopBtn = document.getElementById("stop");
            if (stopBtn) stopBtn.style.color = "white";
        }
    }
}

/**
 * Creates a BlockDragController and attaches it, plus delegation stubs,
 * to the blocks manager so external callers continue to work unchanged.
 * @param {object} blocks - The Blocks instance.
 * @returns {BlockDragController}
 */
const setupBlockDragController = blocks => {
    const controller = new BlockDragController(blocks);
    blocks.blockDragController = controller;

    blocks.blockMoved = (...args) => controller.blockMoved(...args);
    blocks.findDragGroup = (...args) => controller.findDragGroup(...args);
    blocks.cacheDragGroup = (...args) => controller.cacheDragGroup(...args);
    blocks.clearCachedDragGroup = (...args) => controller.clearCachedDragGroup(...args);
    blocks.moveBlockRelative = (...args) => controller.moveBlockRelative(...args);
    blocks.moveBlockRelativeBatched = (...args) => controller.moveBlockRelativeBatched(...args);
    blocks.moveStackRelative = (...args) => controller.moveStackRelative(...args);

    return controller;
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define([], function () {
        return { setupBlockDragController, BlockDragController };
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { setupBlockDragController, BlockDragController };
}

if (typeof window !== "undefined") {
    window.setupBlockDragController = setupBlockDragController;
    window.BlockDragController = BlockDragController;
}
