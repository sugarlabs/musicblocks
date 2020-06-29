// Copyright (c) 2014-19 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Minimum distance (squared) between two docks required before
// connecting them.
const MINIMUMDOCKDISTANCE = 400;

// Soft limit on the number of blocks in a single stack.
const LONGSTACK = 300;

// Special value flags to uniquely identify these media blocks.
const CAMERAVALUE = "##__CAMERA__##";
const VIDEOVALUE = "##__VIDEO__##";

const NOTEBLOCKS = ["newnote", "osctime"];
const PITCHBLOCKS = [
    "pitch",
    "steppitch",
    "hertz",
    "pitchnumber",
    "nthmodalpitch",
    "playdrum"
];

// Blocks holds the list of blocks and most of the block-associated
// methods, since most block manipulations are inter-block.

/*
 * The class for managing the collection of blocks
 * @public
 * @return {void}
 */
function Blocks(activity) {
    if (sugarizerCompatibility.isInsideSugarizer()) {
        storage = sugarizerCompatibility.data;
    } else {
        storage = localStorage;
    }

    this.activity = activity;
    this.canvas = null;
    this.stage = null;
    this.refreshCanvas = null;
    this.trashcan = null;
    this.updateStage = null;
    this.getStageScale = null;
    // Did the user right cick?
    this.stageClick = false;

    // We keep a list of stacks in the trash.
    this.trashStacks = [];

    // We keep a dictionary for the proto blocks,
    this.protoBlockDict = {};
    // and a list of the blocks we create.
    this.blockList = [];

    this.blockArt = {};
    this.blockCollapseArt = {};

    // Track the time with mouse down.
    this.mouseDownTime = 0;
    this.longPressTimeout = null;

    // Paste offset is used to ensure pasted blocks don't overlap.
    this.pasteDx = 0;
    this.pasteDy = 0;

    // What did we select?
    this.selectedStack = null;
    // and a copy of the selected stack for pasting.
    this.selectedBlocksObj = null;

    // If we somehow have a malformed block database (for example,
    // from importing a corrupted datafile, we need to avoid infinite
    // loops while crawling the block list.
    this._loopCounter = 0;
    this._sizeCounter = 0;
    this._searchCounter = 0;

    // We need a reference to the palettes.
    this.palettes = null;
    // Which block, if any, is highlighted?
    this.highlightedBlock = null;
    // Which block, if any, is active?
    this.activeBlock = null;
    // Are the blocks visible?
    this.visible = true;
    // The group of blocks being dragged or moved together
    this.dragGroup = [];
    // The blocks at the tops of stacks
    this.stackList = [];
    // The blocks that need expanding
    this._expandablesList = [];
    // Number of blocks to load
    this._loadCounter = 0;
    // Stacks of blocks that need adjusting as blocks are repositioned
    // due to expanding and contracting or insertion into the flow.
    this._adjustTheseDocks = [];
    // Blocks that need collapsing after load.
    this.blocksToCollapse = [];
    // Arg blocks that need expanding after load.
    this._checkTwoArgBlocks = [];
    // Arg clamp blocks that need expanding after load.
    this._checkArgClampBlocks = [];
    // Clamp blocks that need expanding after load.
    this.clampBlocksToCheck = [];
    // Blocks that don't run when clicked.
    this.noRunBlocks = [];

    this._homeButtonContainers = [];
    this.blockScale = DEFAULTBLOCKSCALE;

    // We need to know if we are processing a copy or save stack command.
    this.inLongPress = false;
    this.customTemperamentDefined = false;

    // We stage deletion of prototype action blocks on the palette so
    // as to avoid palette refresh race conditions.
    this.deleteActionTimeout = 0;

    /*
     * Returns the long press status
     * @public
     * @return this.inLongPress
     */
    this.getLongPressStatus = function() {
        return this.inLongPress;
    };

    /*
     * Sets long press status to false
     * @public
     * @return {void}
     */
    this.clearLongPress = function() {
        this.inLongPress = false;
    };

    /*
     * We need access to the canvas.
     * @param - canvas
     * @public
     * @return this
     */
    this.setCanvas = function(canvas) {
        this.canvas = canvas;
        return this;
    };

    /*
     * We need access to the stage.
     * @param - stage - staging area
     * @public
     * @return this
     */
    this.setStage = function(stage) {
        this.stage = stage;
        return this;
    };

    /*
     * We need to be able to refreshe the canvas.
     * @param - refreshCanvas - new variable
     * @public
     * @return this
     */
    this.setRefreshCanvas = function(refreshCanvas) {
        this.refreshCanvas = refreshCanvas;
        return this;
    };

    /*
     * We need to access the trashcan.
     * @param - trashcan - new variable
     * @public
     * @return this
     */
    this.setTrashcan = function(trashcan) {
        this.trashcan = trashcan;
        return this;
    };

    /*
     * We need to be able to update the stage.
     * @param - updateStage - new variable
     * @public
     * @return this
     */
    this.setUpdateStage = function(updateStage) {
        this.updateStage = updateStage;
        return this;
    };

    /*
     * We need to access the stage scale.
     * @param - getStageScale - new variable
     * @public
     * @return this
     */
    this.setGetStageScale = function(getStageScale) {
        this.getStageScale = getStageScale;
        return this;
    };

    /*
     * Change the scale of the blocks (and the protoblocks on the palette).
     * @param - scale -new variable
     * @public
     * @return {void}
     */
    this.setBlockScale = function(scale) {
        console.debug("New block scale is " + scale);
        this.blockScale = scale;

        // Regenerate all of the artwork at the new scale.
        for (var blk = 0; blk < this.blockList.length; blk++) {
            this.blockList[blk].resize(scale);
        }

        this.findStacks();
        for (var stack = 0; stack < this.stackList.length; stack++) {
            // console.debug('Adjust Docks: ' + this.blockList[this.stackList[stack]].name);
            this.adjustDocks(this.stackList[stack], true);
        }

        // Make sure trash is still hidden.
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].trash) {
                this.blockList[blk].hide();
            }
        }

        // We reset the protoblock scale on the palettes, but don't
        // modify the palettes themselves.
        for (var palette in this.palettes.dict) {
            for (
                var blk = 0;
                blk < this.palettes.dict[palette].protoList.length;
                blk++
            ) {
                this.palettes.dict[palette].protoList[blk].scale = scale;
            }
        }
    };

    /*
     * We need to access the message object.
     * @param - msgText -new variable
     * @public
     * @return {void}
     */
    this.setMsgText = function(msgText) {
        this.msgText = msgText;
    };

    /*
     * We need to access the error message object.
     * @param - errorMsg -new variable
     * @public
     * @return this
     */
    this.setErrorMsg = function(errorMsg) {
        this.errorMsg = errorMsg;
        return this;
    };

    /*
     * We need to access the macro dictionary to add data to it.
     * @param - obj - object
     * @public
     * @return this
     */
    this.setMacroDictionary = function(obj) {
        this.macroDict = obj;
        return this;
    };

    /*
     * We need access to the turtles list because we associate a turtle
     * with each start block.
     * @param - turtles
     * @public
     * @return this
     */
    this.setTurtles = function(turtles) {
        this.turtles = turtles;
        return this;
    };

    /*
     * We need to access "Logo interpreter" when we click on blocks.
     * @param - logo
     * @public
     * @return this
     */
    this.setLogo = function(logo) {
        this.logo = logo;
        return this;
    };

    /*
     * We need to access the right-click (and long press) context menu.
     * @param - contextMenu
     * @public
     * @return this
     */
    this.setContextMenu = function(contextMenu) {
        this.contextMenu = contextMenu;
        return this;
    };

    /*
     * The scale of the graphics is determined by screen size.
     * @param - scale -new variable
     * @public
     * @return this
     */

    this.setScale = function(scale) {
        // this.blockScale = scale;
        return this;
    };

    /*
     * Extract the blocks
     * @public
     * @return {void}
     */
    this.extract = function() {
        if (this.activeBlock != null) {
            // Don't extract silence blocks.
            if (this.blockList[this.activeBlock].name !== "rest2") {
                this._extractBlock(this.activeBlock, true);
            }
        }
    };

    /*
     * Pull a block from a stack, then readjust the docks.
     * @param - blk - blocks
     * @param - adjustDock - new variable
     * @private
     * @return {void}
     */
    this._extractBlock = function(blk, adjustDock) {
        // Remove a single block from within a stack.
        var blkObj = this.blockList[blk];

        if (SPECIALINPUTS.indexOf(blkObj.name) === -1) {
            var clampList = [];
            this.findNestedClampBlocks(blk, clampList);

            var firstConnection = blkObj.connections[0];
            var lastConnection = last(blkObj.connections);

            if (firstConnection != null) {
                var connectionIdx = this.blockList[
                    firstConnection
                ].connections.indexOf(blk);
            } else {
                var connectionIdx = null;
            }

            blkObj.connections[0] = null;

            if (lastConnection != null) {
                // Is it a hidden block? Keep it attached.
                if (this.blockList[lastConnection].name === "hidden") {
                    lastConnection = last(
                        this.blockList[lastConnection].connections
                    );
                    this.blockList[last(blkObj.connections)].connections[
                        this.blockList[last(blkObj.connections)].connections
                            .length - 1
                    ] = null;
                } else {
                    blkObj.connections[blkObj.connections.length - 1] = null;
                }

                if (lastConnection != null) {
                    this.blockList[
                        lastConnection
                    ].connections[0] = firstConnection;
                }
            }

            if (firstConnection != null) {
                this.blockList[firstConnection].connections[
                    connectionIdx
                ] = lastConnection;
            }

            this.moveStackRelative(blk, 4 * STANDARDBLOCKHEIGHT, 0);
            this.blockMoved(blk);

            if (adjustDock && firstConnection != null) {
                this.adjustDocks(firstConnection, true);
                if (clampList.length > 0) {
                    this.clampBlocksToCheck = clampList;
                    this.adjustExpandableClampBlock();
                }
            }
        } else {
            var firstConnection = blkObj.connections[0];
            if (firstConnection != null) {
                var connectionIdx = this.blockList[
                    firstConnection
                ].connections.indexOf(blk);
                this.blockList[firstConnection].connections[
                    connectionIdx
                ] = null;
                blkObj.connections[0] = null;
            }

            this.moveStackRelative(blk, 4 * STANDARDBLOCKHEIGHT, 0);
            this.blockMoved(blk);
        }
    };

    /*
     * Find the y position of the bottom-most block
     * @public
     * @return maxy
     */
    this.bottomMostBlock = function() {
        var maxy = -1000;
        for (var blk in this.blockList) {
            if (this.blockList[blk].container.y > maxy) {
                var maxy = this.blockList[blk].container.y;
            }
        }

        return maxy;
    };

    /*
     * Toggle state of collapsible blocks, except for note blocks,
     * which are handled separately.
     * @public
     * @return {void}
     */
    this.toggleCollapsibles = function() {
        var allCollapsed = true;
        var someCollapsed = false;
        for (var blk in this.blockList) {
            var myBlock = this.blockList[blk];
            if (
                myBlock.name === "newnote" ||
                myBlock.name === "interval" ||
                myBlock.name === "osctime"
            ) {
                continue;
            }

            if (COLLAPSIBLES.indexOf(myBlock.name) !== -1 && !myBlock.trash) {
                if (myBlock.collapsed) {
                    someCollapsed = true;
                } else {
                    allCollapsed = false;
                }
            }
        }

        if (allCollapsed || !someCollapsed) {
            // If all blocks are collapsed, uncollapse them all.
            // If any blocks are collapsed, collapse them all.
            for (var blk in this.blockList) {
                var myBlock = this.blockList[blk];
                if (
                    myBlock.name === "newnote" ||
                    myBlock.name === "interval" ||
                    myBlock.name === "osctime"
                ) {
                    continue;
                }

                if (
                    COLLAPSIBLES.indexOf(myBlock.name) !== -1 &&
                    !myBlock.trash
                ) {
                    myBlock.collapseToggle();
                }
            }
        } else {
            // If no blocks are collapsed, collapse them all.
            for (var blk in this.blockList) {
                var myBlock = this.blockList[blk];
                if (
                    myBlock.name === "newnote" ||
                    myBlock.name === "interval" ||
                    myBlock.name === "osctime"
                ) {
                    continue;
                }

                if (
                    COLLAPSIBLES.indexOf(myBlock.name) !== -1 &&
                    !myBlock.trash
                ) {
                    if (!myBlock.collapsed) {
                        myBlock.collapseToggle();
                    }
                }
            }
        }
    };

    /*
     * We need to access the go-home button and boundary.
     * @param - setHomeContainers
     * @param - boundary
     * @public
     * @return this
     */
    this.setHomeContainers = function(setContainers, boundary) {
        this._setHomeButtonContainers = setContainers;
        this.boundary = boundary;
        return this;
    };

    /*
     * Is this an action block?
     * @param - name - block name
     * @private
     * @return boolean
     */
    this._actionBlock = function(name) {
        return ["do", "doArg", "calc", "calcArg"].indexOf(name) !== -1;
    };

    /*
     * Is this a named action block?
     * @param - name - block name
     * @private
     * @return boolean
     */
    this._namedActionBlock = function(name) {
        return (
            ["nameddo", "nameddoArg", "namedcalc", "namedcalcArg"].indexOf(
                name
            ) !== -1
        );
    };

    /*
     * Adjust the dock positions of all blocks in the current drag group.
     * @private
     * @return {void}
     */
    this._adjustBlockPositions = function() {
        if (this.dragGroup.length < 2) {
            return;
        }

        // console.debug('Adjust Docks: ' + this.blockList[this.dragGroup[0]].name);
        this.adjustDocks(this.dragGroup[0], true);
    };

    /*
     * Adjust the size of the clamp in an expandable block when
     * block are inserted into (or removed from) the child flow.
     * This is a common operation for start and action blocks,
     * but also for repeat, forever, if, etc.
     * @public
     * @return {void}
     */
    this.adjustExpandableClampBlock = function() {
        if (this.clampBlocksToCheck.length === 0) {
            return;
        }

        var that = this;
        var obj = this.clampBlocksToCheck.pop();
        var blk = obj[0];
        var clamp = obj[1];

        var myBlock = this.blockList[blk];

        if (myBlock.isArgFlowClampBlock() || myBlock.isLeftClampBlock()) {
            // Make sure myBlock is a clamp block.
        } else if (myBlock.isArgBlock() || myBlock.isTwoArgBlock()) {
            return;
        } else if (myBlock.isArgClamp()) {
            // We handle ArgClamp blocks elsewhere.
            this._adjustArgClampBlock([blk]);
        }

        /*
         * Adjusts the clamp size
         * @param - blk - block number
         * @param - myBlock - block
         * @param - clamp (1 or 2)?
         * @private
         * @return {void}
         */
        var __clampAdjuster = function(blk, myBlock, clamp) {
            // First we need to count up the number of (and size of) the
            // blocks inside the clamp; The child flow is usually the
            // second-to-last argument.
            if (myBlock.isArgFlowClampBlock() || myBlock.isLeftClampBlock()) {
                var c = 1; // 0: outie; and 1: child flow
            } else if (clamp === 0) {
                var c = myBlock.connections.length - 2;
            } else {
                // e.g., Bottom clamp in if-then-else
                var c = myBlock.connections.length - 3;
            }

            that._sizeCounter = 0;
            var childFlowSize = 1;
            if (c > 0 && myBlock.connections[c] != null) {
                this._sizeCounter = 0;
                childFlowSize = Math.max(
                    that._getStackSize(myBlock.connections[c]),
                    1
                );
            }

            // Adjust the clamp size to match the size of the child
            // flow.
            var plusMinus = childFlowSize - myBlock.clampCount[clamp];
            if (plusMinus !== 0) {
                if (!(childFlowSize === 0 && myBlock.clampCount[clamp] === 1)) {
                    myBlock.updateSlots(clamp, plusMinus);
                }
            }

            // Recurse through the list.
            if (that.clampBlocksToCheck.length > 0) {
                that.adjustExpandableClampBlock();
            }
        };

        __clampAdjuster(blk, myBlock, clamp);
    };

    /*
     * Return the block size in units of standard block size.
     * @param - blk - block number
     * @private
     * @return block size
     */
    this._getBlockSize = function(blk) {
        var myBlock = this.blockList[blk];
        if (
            (myBlock.name === "newnote" ||
                myBlock.name === "interval" ||
                myBlock.name === "osctime") &&
            myBlock.collapsed
        ) {
            return 1;
        }

        return myBlock.size;
    };

    /*
     * Adjust the slot sizes of arg clamps.
     * @param - argBlocksToCheck -new variable
     * @private
     * @return {void}
     */
    this._adjustArgClampBlock = function(argBlocksToCheck) {
        if (argBlocksToCheck.length === 0) {
            return;
        }

        var blk = argBlocksToCheck.pop();
        var myBlock = this.blockList[blk];

        // Which connection do we start with?
        if (["doArg", "calcArg", "makeblock"].indexOf(myBlock.name) !== -1) {
            var ci = 2;
        } else {
            var ci = 1;
        }

        // Get the current slot list.
        var slotList = myBlock.argClampSlots;

        var update = false;
        // Determine the size of each argument.
        for (var i = 0; i < slotList.length; i++) {
            var c = myBlock.connections[ci + i];
            var size = 1; // Minimum size
            if (c != null) {
                size = Math.max(this._getBlockSize(c), 1);
            }

            if (slotList[i] !== size) {
                slotList[i] = size;
                update = true;
            }
        }

        if (update) {
            myBlock.updateArgSlots(slotList);
        }
    };

    /*
     * We also adjust the size of twoarg blocks. It is similar to how
     * we adjust clamps, but enough different that it is in its own function.
     * @param - argBlocksToCheck - a list of blocks that need to be
                                   checked for changes to their clamp sizes.
     * @private
     * @return {void}
     */
    this._adjustExpandableTwoArgBlock = function(argBlocksToCheck) {
        if (argBlocksToCheck.length === 0) {
            return;
        }

        var blk = argBlocksToCheck.pop();
        var myBlock = this.blockList[blk];

        // Determine the size of the first argument.
        var c = myBlock.connections[1];
        var firstArgumentSize = 1; // Minimum size
        if (c != null) {
            firstArgumentSize = Math.max(this._getBlockSize(c), 1);
        }

        // Expand/contract block by plusMinus.
        var plusMinus = firstArgumentSize - myBlock.clampCount[0];
        if (plusMinus !== 0) {
            if (!(firstArgumentSize === 0)) {
                myBlock.updateSlots(0, plusMinus);
            }
        }
    };

    /*
     * Add or remove the vspace blocks
     * @param - blk - block number
     * @private
     * @return void
     */
    this._addRemoveVspaceBlock = function(blk) {
        var myBlock = this.blockList[blk];

        var c = myBlock.connections[myBlock.connections.length - 2];
        var secondArgumentSize = 1;
        if (c != null) {
            var secondArgumentSize = Math.max(this._getBlockSize(c), 1);
        }

        var that = this;

        /*
         * Checks the number of VSpace blocks are below the block we are checking against
         * @param - blk - block number
         * @private
         * @return number of vspace blocks found below this block
         */
        var __howManyVSpaceBlocksBelow = function(blk) {
            var nextBlock = last(that.blockList[blk].connections);
            if (nextBlock && that.blockList[nextBlock].name === "vspace") {
                return 1 + __howManyVSpaceBlocksBelow(nextBlock);
                // Recurse until it isn't a vspace
            }
            return 0;
        };

        var vSpaceCount = __howManyVSpaceBlocksBelow(blk);
        if (secondArgumentSize < vSpaceCount + 1) {
            // Remove a vspace block
            var n = Math.abs(secondArgumentSize - vSpaceCount - 1);
            for (var i = 0; i < n; i++) {
                var lastConnection = myBlock.connections.length - 1;
                var vspaceBlock = this.blockList[
                    myBlock.connections[lastConnection]
                ];
                var nextBlockIndex = vspaceBlock.connections[1];
                myBlock.connections[lastConnection] = nextBlockIndex;
                if (nextBlockIndex != null) {
                    this.blockList[nextBlockIndex].connections[0] = blk;
                }
                vspaceBlock.connections = [null, null];
                vspaceBlock.trash = true;
                vspaceBlock.hide();
            }
        } else if (secondArgumentSize > vSpaceCount + 1) {
            // Add vspace blocks
            var n = secondArgumentSize - vSpaceCount - 1;
            var nextBlock = last(myBlock.connections);
            var thisBlock = myBlock;
            var newPos = this.blockList.length;

            var that = this;

            /*
             * Adjusts the docks of the blocks connected to the vspace block
             * @param - args - [this block, the next block, the vspace block
             * @private
             * @return {void}
             */
            var __vspaceAdjuster = function(args) {
                var thisBlock = args[0];
                var nextBlock = args[1];
                var vspace = args[2];
                var i = args[3];
                var n = args[4];

                var vspaceBlock = that.blockList[vspace];
                var lastDock = last(thisBlock.docks);
                var dx = lastDock[0] - vspaceBlock.docks[0][0];
                var dy = lastDock[1] - vspaceBlock.docks[0][1];
                vspaceBlock.container.x = thisBlock.container.x + dx; // Math.floor(thisBlock.container.x + dx + 0.5);
                vspaceBlock.container.y = thisBlock.container.y + dy; // Math.floor(thisBlock.container.y + dy + 0.5);
                vspaceBlock.connections[0] = that.blockList.indexOf(thisBlock);
                vspaceBlock.connections[1] = nextBlock;
                thisBlock.connections[
                    thisBlock.connections.length - 1
                ] = vspace;
                if (nextBlock) {
                    that.blockList[nextBlock].connections[0] = vspace;
                }

                if (i + 1 < n) {
                    var newPos = that.blockList.length;
                    thisBlock = last(that.blockList);
                    nextBlock = last(thisBlock.connections);
                    that._makeNewBlockWithConnections(
                        "vspace",
                        newPos,
                        [null, null],
                        __vspaceAdjuster,
                        [thisBlock, nextBlock, newPos, i + 1, n]
                    );
                }
            };

            this._makeNewBlockWithConnections(
                "vspace",
                newPos,
                [null, null],
                __vspaceAdjuster,
                [thisBlock, nextBlock, newPos, 0, n]
            );
        }
    };

    /*
     * Calculate the sum of the sizes of all the blocks a stack.
     * @param - blk - block number
     * @private
     * @return int
     */
    this._getStackSize = function(blk) {
        // How many block units in this stack?
        var size = 0;
        this._sizeCounter += 1;
        if (this._sizeCounter > this.blockList.length * 2) {
            console.debug(
                "Infinite loop encountered detecting size of expandable block? " +
                    blk
            );
            return size;
        }

        if (blk == null) {
            return size;
        }

        var myBlock = this.blockList[blk];
        if (myBlock == null) {
            console.debug("Something very broken in _getStackSize.");
        }

        if (myBlock.isClampBlock()) {
            var c = myBlock.connections.length - 2;
            var csize = 0;
            if (c > 0) {
                var cblk = myBlock.connections[c];
                if (cblk != null) {
                    csize = this._getStackSize(cblk);
                }

                if (csize === 0) {
                    size = 1; // minimum of 1 slot in clamp
                } else {
                    size = csize;
                }
            }

            if (myBlock.isDoubleClampBlock()) {
                var c = myBlock.connections.length - 3;
                var csize = 0;
                if (c > 0) {
                    var cblk = myBlock.connections[c];
                    if (cblk != null) {
                        csize = this._getStackSize(cblk);
                    }

                    if (csize === 0) {
                        size += 1; // minimum of 1 slot in clamp
                    } else {
                        size += csize;
                    }
                }
            }

            // add top and bottom of clamp
            size += myBlock.size;
        } else {
            size = myBlock.size;
        }

        // If the note value block is collapsed, spoof size.
        if (this.blocksToCollapse.indexOf(blk) != -1) {
            size = 1;
        } else if (
            (myBlock.name === "newnote" ||
                myBlock.name === "interval" ||
                myBlock.name === "osctime") &&
            myBlock.collapsed
        ) {
            size = 1;
        }

        // check on any connected block
        if (myBlock.connections.length > 1) {
            var cblk = last(myBlock.connections);
            if (cblk != null) {
                size += this._getStackSize(cblk);
            }
        }

        return size;
    };

    /*
     * Given a block, adjust the dock position of all its connections.
     * @param - blk - block
     * @param - resetLoopCounter (to prevent infinite loops in the
                                  case the connections are broken).
     * @public
     * @return {void}
     */
    this.adjustDocks = function(blk, resetLoopCounter) {
        var myBlock = this.blockList[blk];

        // For when we come in from makeBlock
        if (resetLoopCounter != null) {
            this._loopCounter = 0;
        }

        // These checks are to test for malformed data. All blocks
        // should have connections.
        if (myBlock == null) {
            console.debug("Saw a null block: " + blk);
            return;
        }

        if (myBlock.connections == null) {
            console.debug("Saw a block with null connections: " + blk);
            return;
        }

        if (myBlock.connections.length === 0) {
            console.debug("Saw a block with [] connections: " + blk);
            return;
        }

        // Value blocks only have one dock.
        if (myBlock.docks.length === 1) {
            return;
        }

        this._loopCounter += 1;
        if (this._loopCounter > this.blockList.length * 2) {
            console.debug(
                "Infinite loop encountered while adjusting docks: " +
                    blk +
                    " " +
                    this.blockList
            );
            return;
        }

        // Walk through each connection except the parent block; the
        // exception being the parent block of boolean 2arg blocks,
        // since the dock[0] position can change; and only check the
        // last connection of collapsed blocks.
        if (myBlock.isTwoArgBooleanBlock()) {
            var start = 0;
        } else if (myBlock.isInlineCollapsible() && myBlock.collapsed) {
            var start = myBlock.connections.length - 1;
        } else {
            var start = 1;
        }

        for (var c = start; c < myBlock.connections.length; c++) {
            // Get the dock position for this connection.
            var bdock = myBlock.docks[c];

            // Find the connecting block.
            var cblk = myBlock.connections[c];
            // Nothing connected here so continue to the next connection.
            if (cblk === null) {
                continue;
            }

            // Another database integrety check.
            if (this.blockList[cblk] === null) {
                console.debug(
                    "This is not good: we encountered a null block: " + cblk
                );
                continue;
            }

            // Find the dock position in the connected block.
            var foundMatch = false;
            for (var b = 0; b < this.blockList[cblk].connections.length; b++) {
                if (this.blockList[cblk].connections[b] === blk) {
                    foundMatch = true;
                    break;
                }
            }

            // Yet another database integrety check.
            if (!foundMatch) {
                console.debug(
                    "Did not find match for " +
                        myBlock.name +
                        " (" +
                        blk +
                        ") and " +
                        this.blockList[cblk].name +
                        " (" +
                        cblk +
                        ")"
                );
                console.debug(myBlock.connections);
                console.debug(this.blockList[cblk].connections);
                break;
            }

            var cdock = this.blockList[cblk].docks[b];
            if (c > 0) {
                var dx = bdock[0] - cdock[0];

                if (myBlock.isInlineCollapsible() && myBlock.collapsed) {
                    // If the block is collapsed, determine the new
                    // dock position.
                    var n = myBlock.docks.length;
                    var dd = myBlock.docks[n - 1][1] - myBlock.docks[n - 2][1];
                    var dy = bdock[1] - dd - cdock[1];
                } else {
                    var dy = bdock[1] - cdock[1];
                }

                if (myBlock.container == null) {
                    console.debug("Does this ever happen any more?");
                } else {
                    var nx = myBlock.container.x + dx;
                    var ny = myBlock.container.y + dy;
                }

                this._moveBlock(cblk, nx, ny);
            } else {
                var dx = cdock[0] - bdock[0];
                var dy = cdock[1] - bdock[1];
                var nx = this.blockList[cblk].container.x + dx;
                var ny = this.blockList[cblk].container.y + dy;
                this._moveBlock(blk, nx, ny);
            }

            if (c > 0) {
                // Recurse on connected blocks.
                this.adjustDocks(cblk, true);
            }
        }
    };

    /*
     * Add an action name whenever the user removes the name from
       an action block.  Add a box name whenever the user removes
       the name from a storein block.  Add a Silence block
       whenever the user removes all the blocks from a Note block.
       Add an octave(number) block whenever user removes an octave block.
     * @param - parentblk - new variable
     * @param - oldBlock - old block
     * @param - skipOldBlock
     * @public
     * @return {void}
     */
    this.addDefaultBlock = function(parentblk, oldBlock, skipOldBlock) {
        if (parentblk == null) {
            return;
        }

        if (this.blockList[parentblk].name === "action") {
            var cblk = this.blockList[parentblk].connections[1];
            if (cblk == null) {
                var that = this;
                /*
                 * Update Palette
                 * @param - args - arguments
                 * @public
                 * @return {void}
                 */
                var postProcess = function(args) {
                    var parentblk = args[0];
                    var oldBlock = args[1];

                    var blk = that.blockList.length - 1;
                    that.blockList[parentblk].connections[1] = blk;
                    that.blockList[blk].value = that.findUniqueActionName(
                        _("action")
                    );
                    var label = that.blockList[blk].value;
                    if (getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH) {
                        label = label.substr(0, STRINGLEN) + "...";
                    }
                    that.blockList[blk].text.text = label;
                    // that.blockList[blk]._positionText(that.blockList[blk].protoblock.scale);
                    that.blockList[blk].container.updateCache();

                    if (
                        that.blockList[blk].value !==
                        that.blockList[oldBlock].value
                    ) {
                        that.newNameddoBlock(
                            that.blockList[blk].value,
                            that.actionHasReturn(parentblk),
                            that.actionHasArgs(parentblk)
                        );
                        var blockPalette = that.palettes.dict["action"];
                        for (
                            var b = 0;
                            b < blockPalette.protoList.length;
                            b++
                        ) {
                            var protoblock = blockPalette.protoList[b];
                            if (
                                protoblock.name === "nameddo" &&
                                protoblock.defaults[0] ===
                                    that.blockList[oldBlock].value
                            ) {
                                setTimeout(function() {
                                    blockPalette.remove(
                                        protoblock,
                                        that.blockList[oldBlock].value
                                    );
                                    delete that
                                        .protoBlockDict["myDo_" + that.blockList[oldBlock].value];
                                    // that.palettes.hide();
                                    that.palettes.updatePalettes("action");
                                    // that.palettes.show();
                                }, 50); // 500

                                break;
                            }
                        }

                        that.renameNameddos(
                            that.blockList[oldBlock].value,
                            that.blockList[blk].value
                        );
                        if (skipOldBlock) {
                            that.renameDos(
                                that.blockList[oldBlock].value,
                                that.blockList[blk].value,
                                oldBlock
                            );
                        } else {
                            that.renameDos(
                                that.blockList[oldBlock].value,
                                that.blockList[blk].value
                            );
                        }
                    }

                    that.adjustDocks(parentblk, true);
                };

                this._makeNewBlockWithConnections(
                    "text",
                    0,
                    [parentblk],
                    postProcess,
                    [parentblk, oldBlock]
                );
            }
        } else if (this.blockList[parentblk].name === "pitch") {
            let cblk = this.blockList[parentblk].connections[2];
            if (cblk == null) {
                /*
                 * Adjust Docks
                 * @param - args - arguments
                 * @public
                 * @return {void}
                 */
                let postProcess = (args) => {
                    let parentblk = args[0];
                    let oldBlock = args[1];
                    let blk = this.blockList.length - 1;

                    this.blockList[parentblk].connections[2] = blk;

                    let octave = this.blockList[oldBlock].value;
                    this.blockList[blk].value = octave;
                    this.blockList[blk].text.text = octave.toString();
                    // Make sure text is on top.
                    let z = this.blockList[blk].container.children.length - 1;
                    this.blockList[blk].container.setChildIndex(this.blockList[blk].text, z);
                    this.blockList[blk].container.updateCache();

                    this.adjustDocks(parentblk, true);
                };

                this._makeNewBlockWithConnections(
                    "number",
                    0,
                    [parentblk],
                    postProcess,
                    [parentblk, oldBlock]
                );
            }

            let oblk = this.blockList[parentblk].connections[1];
            if (oblk == null) {
                /*
                 * Adjust Docks
                 * @param - args - arguments
                 * @public
                 * @return {void}
                 */
                let postProcess = (args) => {
                    let parentblk = args[0];
                    let oldBlock = args[1];

                    let blk = this.blockList.length - 1;

                    this.blockList[parentblk].connections[1] = blk;

                    let pitch = this.blockList[oldBlock].value;
                    this.blockList[blk].value = pitch;
                    this.blockList[blk].text.text = pitch.toString();
                    // Make sure text is on top.
                    let z = this.blockList[blk].container.children.length - 1;
                    this.blockList[blk].container.setChildIndex(this.blockList[blk].text, z);
                    this.blockList[blk].container.updateCache();

                    this.adjustDocks(parentblk, true);
                };

                this._makeNewBlockWithConnections(
                    this.blockList[oldBlock].name,
                    0,
                    [parentblk],
                    postProcess,
                    [parentblk, oldBlock]
                );
            }
        } else if (this.blockList[parentblk].name === "storein") {
            var cblk = this.blockList[parentblk].connections[1];
            if (cblk == null) {
                var that = this;
                /*
                 * Adjust Docks
                 * @param - args - arguments
                 * @public
                 * @return {void}
                 */
                var postProcess = function(args) {
                    var parentblk = args[0];
                    var oldBlock = args[1];

                    var blk = that.blockList.length - 1;
                    that.blockList[parentblk].connections[1] = blk;
                    that.blockList[blk].value = _("box");
                    var label = that.blockList[blk].value;
                    if (getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH) {
                        label = label.substr(0, STRINGLEN) + "...";
                    }
                    that.blockList[blk].text.text = label;
                    that.blockList[blk].container.updateCache();

                    that.adjustDocks(parentblk, true);
                };

                this._makeNewBlockWithConnections(
                    "text",
                    0,
                    [parentblk],
                    postProcess,
                    [parentblk, oldBlock]
                );
            }
        } else if (NOTEBLOCKS.indexOf(this.blockList[parentblk].name) !== -1) {
            var cblk = this.blockList[parentblk].connections[2];
            if (cblk == null) {
                var blkname = "vspace";
                var newVspaceBlock = this.makeBlock(blkname, "__NOARG__");
                this.blockList[parentblk].connections[2] = newVspaceBlock;
                this.blockList[newVspaceBlock].connections[0] = parentblk;
                var blkname = "rest2";
                var newSilenceBlock = this.makeBlock(blkname, "__NOARG__");
                this.blockList[newSilenceBlock].connections[0] = newVspaceBlock;
                this.blockList[newSilenceBlock].connections[1] = null;
                this.blockList[newVspaceBlock].connections[1] = newSilenceBlock;
            } else if (
                this.blockList[cblk].name === "vspace" &&
                this.blockList[cblk].connections[1] == null
            ) {
                var blkname = "rest2";
                var newSilenceBlock = this.makeBlock(blkname, "__NOARG__");
                this.blockList[newSilenceBlock].connections[0] = cblk;
                this.blockList[newSilenceBlock].connections[1] = null;
                this.blockList[cblk].connections[1] = newSilenceBlock;
            }
        }
    };

    /*
     * Remove any pitch blocks from a Note block if Silent block is inserted.
     * @param - thisBlock -new variable
     * @private
     * @return {void}
     */
    this._deletePitchBlocks = function(thisBlock) {
        // Find the top of the stack
        var c = this.blockList[thisBlock].connections[0];
        if (c === null) {
            console.debug("Silence block was not inside a note block");
        }

        var counter = 0;
        while (true) {
            if (NOTEBLOCKS.indexOf(this.blockList[c].name) !== -1) {
                break;
            }

            thisBlock = c;
            var c = this.blockList[c].connections[0];
            if (c === null) {
                console.debug("Silence block was not inside a note block");
                break;
            }

            counter += 1;
            if (counter > this.blockList.length) {
                console.debug("Connection loop???");
                break;
            }
        }

        counter = 0;
        while (thisBlock != null) {
            if (this.blockList[thisBlock].connections.length < 2) {
                console.debug("value block encountered??? " + thisBlock);
                break;
            }

            var nextBlock = last(this.blockList[thisBlock].connections);
            if (PITCHBLOCKS.indexOf(this.blockList[thisBlock].name) !== -1) {
                this._extractBlock(thisBlock, false);
            } else if (
                ["flat", "sharp"].indexOf(this.blockList[thisBlock].name) !== -1
            ) {
                // The pitch block might be inside a sharp or flat block.
                var b = this.blockList[thisBlock].connections[1];
                if (this._blockInStack(b, PITCHBLOCKS)) {
                    this._extractBlock(thisBlock, false);
                }
            }

            thisBlock = nextBlock;

            counter += 1;
            if (counter > this.blockList.length) {
                console.debug("Connection loop???");
                break;
            }
        }
    };

    /*
     * Deletes the next default element: either a Pitch block or a Silent block.
     * @param - thisBlock
     * @public
     * @return {void}
     */
    this.deleteNextDefault = function(thisBlock) {
        if (thisBlock == undefined) {
            return;
        }

        var thisBlockobj = this.blockList[thisBlock];
        if (thisBlockobj.name === "vspace") {
            return;
        }

        var thisBlockobj = this.blockList[thisBlock];
        if (thisBlockobj.name === "rest2") {
            this._deletePitchBlocks(thisBlock);
        } else {
            // Remove the Silence block from a Note block if another
            // block is inserted anywhere above the silence block.
            if (thisBlockobj && thisBlockobj.connections.length === 1) {
                console.debug("Value block encountered? " + thisBlockobj.name);
                return;
            }

            while (last(thisBlockobj.connections) != null) {
                var lastc = thisBlockobj.connections.length - 1;
                var i = thisBlockobj.connections[lastc];
                if (this.blockList[i].name === "rest2") {
                    var silenceBlock = i;
                    var silenceBlockobj = this.blockList[silenceBlock];
                    silenceBlockobj.hide();
                    silenceBlockobj.trash = true;
                    thisBlockobj.connections[lastc] =
                        silenceBlockobj.connections[1];
                    break;
                } else {
                    thisBlockobj = this.blockList[i];
                }
            }
        }
    };

    /*
     * Remove the Silence block from a Note block if another block
       is inserted anywhere after the Silence block.
     * @param - thisBlock -new variable
     * @public
     * @return {void}
     */
    this.deletePreviousDefault = function(thisBlock) {
        var thisBlockobj = this.blockList[thisBlock];
        if (this._blockInStack(thisBlock, ["rest2"])) {
            this._deletePitchBlocks(thisBlock);
            return this.blockList[thisBlock].connections[0];
        } else {
            while (thisBlockobj.connections[0] != null) {
                var i = thisBlockobj.connections[0];
                if (NOTEBLOCKS.indexOf(this.blockList[i].name) !== -1) {
                    break;
                } else if (this.blockList[i].name === "rest2") {
                    var silenceBlock = i;
                    var silenceBlockobj = this.blockList[silenceBlock];
                    silenceBlockobj.hide();
                    silenceBlockobj.trash = true;

                    for (
                        var c = 0;
                        c <
                        this.blockList[silenceBlockobj.connections[0]]
                            .connections.length;
                        c++
                    ) {
                        if (
                            this.blockList[silenceBlockobj.connections[0]]
                                .connections[c] === silenceBlock
                        ) {
                            this.blockList[
                                silenceBlockobj.connections[0]
                            ].connections[c] = this.blockList.indexOf(
                                thisBlockobj
                            );
                            break;
                        }
                    }

                    thisBlockobj.connections[0] =
                        silenceBlockobj.connections[0];
                    break;
                } else {
                    thisBlockobj = this.blockList[i];
                }
            }

            return thisBlockobj.connections[0];
        }
    };

    //To make everything cleaner, use this function to reinit widget
    //when it's widget windows is open
    this.reInitWidget = function(topBlock, timeout) {
        var that = this;
        setTimeout(function() {
            that.logo.runLogoCommands(topBlock);
        }, timeout);
    };

    /*
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
     * (8) And we need to recheck if it inside of a expandable block.
     * @param - thisBlock -new variable
     * @public
     * @return {void}
     */
    this.blockMoved = function(thisBlock) {
        var initialTopBlock = this.findTopBlock(thisBlock);
        // Find any containing expandable blocks.
        this.clampBlocksToCheck = [];
        if (thisBlock == null) {
            console.debug("blockMoved called with null block.");
            return;
        }

        var blk = this.insideExpandableBlock(thisBlock);
        var expandableLoopCounter = 0;

        var parentblk = null;
        if (blk != null) {
            parentblk = blk;
        }

        var actionCheck = false;

        while (blk != null) {
            expandableLoopCounter += 1;
            if (expandableLoopCounter > 2 * this.blockList.length) {
                console.debug(
                    "Infinite loop encountered checking for expandables?"
                );
                break;
            }

            this.clampBlocksToCheck.push([blk, 0]);
            blk = this.insideExpandableBlock(blk);
        }

        this._checkTwoArgBlocks = [];
        var checkArgBlocks = [];
        var myBlock = this.blockList[thisBlock];
        if (myBlock == null) {
            console.debug(
                "null block found in blockMoved method: " + thisBlock
            );
            return;
        }

        var c = myBlock.connections[0];
        if (c != null) {
            var cBlock = this.blockList[c];
        }

        // If it is an arg block, where is it coming from?
        if (myBlock.isArgBlock() && c != null) {
            // We care about twoarg (2arg) blocks with
            // connections to the first arg;
            if (
                this.blockList[c].isTwoArgBlock() ||
                this.blockList[c].isArgClamp()
            ) {
                if (cBlock.connections[1] === thisBlock) {
                    this._checkTwoArgBlocks.push(c);
                }
            } else if (
                (this.blockList[c].isArgBlock() &&
                    this.blockList[c].isExpandableBlock()) ||
                this.blockList[c].isArgClamp()
            ) {
                if (cBlock.connections[1] === thisBlock) {
                    this._checkTwoArgBlocks.push(c);
                }
            }
        }

        //Get widget windows title
        var widgetTitle = document.getElementsByClassName("wftTitle");

        // Disconnect from connection[0] (both sides of the connection).
        if (c != null) {
            // Disconnect both ends of the connection.
            for (var i = 1; i < cBlock.connections.length; i++) {
                if (cBlock.connections[i] === thisBlock) {
                    cBlock.connections[i] = null;
                    break;
                }
            }

            myBlock.connections[0] = null;
            this.raiseStackToTop(thisBlock);

            // Check if we are disconnecting blocks from widget blocks;
            // then reinit if widget windows is open.
            var lockInit = false;
            for (var x = 0; x < widgetTitle.length; x++) {
                if (lockInit === false) {
                    switch (widgetTitle[x].innerHTML) {
                        case "tempo":
                        case "rhythm maker":
                        case "pitch slider":
                        case "pitch staircase":
                        case "status":
                        case "phrase maker":
                        case "custom mode":
                        case "music keyboard":
                        case "pitch drum":
                        case "meter":
                        case "temperament":
                        case "timbre":
                            lockInit = true;
                            this.reInitWidget(initialTopBlock, 1500);
                            break;
                    }
                }
            }
        }

        // Look for a new connection.
        var x1 = myBlock.container.x + myBlock.docks[0][0];
        var y1 = myBlock.container.y + myBlock.docks[0][1];

        // Find the nearest dock; if it is close enough, make the
        // connection.
        var newBlock = null;
        var newConnection = null;
        var min = (MINIMUMDOCKDISTANCE / DEFAULTBLOCKSCALE) * this.blockScale;
        var blkType = myBlock.docks[0][2];

        // Is the added block above or below?
        var insertAfterDefault = true;

        for (var b = 0; b < this.blockList.length; b++) {
            // Don't connect to yourself.
            if (b === thisBlock) {
                continue;
            }

            // Don't connect to a collapsed block.
            if (this.blockList[b].inCollapsed) {
                continue;
            }

            if (COLLAPSIBLES.indexOf(this.blockList[b].name) !== -1) {
                if (INLINECOLLAPSIBLES.indexOf(this.blockList[b].name) === -1) {
                    if (this.blockList[b].collapsed) {
                        continue;
                    }
                }
            }

            // Don't connect to a block in the trash.
            if (this.blockList[b].trash) {
                continue;
            }

            // Does this every happen? Or is there always a hidden
            // block below?
            if (
                this.blockList[b].isInlineCollapsible() &&
                this.blockList[b].collapsed
            ) {
                // Only try docking to last connection of inline
                // collapsed blocks.
                var start = this.blockList[b].connections.length - 1;
            } else {
                var start = 1;
            }

            for (var i = start; i < this.blockList[b].connections.length; i++) {
                // When converting from Python projects to JS format,
                // sometimes extra null connections are added. We need
                // to ignore them.
                if (i === this.blockList[b].docks.length) {
                    break;
                }

                if (
                    i === this.blockList[b].connections.length - 1 &&
                    this.blockList[b].connections[i] != null &&
                    this.blockList[
                        this.blockList[b].connections[i]
                    ].isNoHitBlock()
                ) {
                    // Don't break the connection between a block and
                    // a hidden block below it.
                    continue;
                } else if (
                    ["backward", "status"].indexOf(this.blockList[b].name) !==
                        -1 &&
                    i === 1 &&
                    this.blockList[b].connections[1] != null &&
                    this.blockList[
                        this.blockList[b].connections[1]
                    ].isNoHitBlock()
                ) {
                    // Don't break the connection between a backward
                    // block and a hidden block attached to its clamp.
                    continue;
                } else if (
                    this.blockList[b].name === "action" &&
                    i === 2 &&
                    this.blockList[b].connections[2] != null &&
                    this.blockList[
                        this.blockList[b].connections[2]
                    ].isNoHitBlock()
                ) {
                    // Don't break the connection between an action
                    // block and a hidden block attached to its clamp.
                    continue;
                }

                // Look for available connections.
                if (
                    this._testConnectionType(
                        blkType,
                        this.blockList[b].docks[i][2]
                    )
                ) {
                    var x2 =
                        this.blockList[b].container.x +
                        this.blockList[b].docks[i][0];
                    var y2 =
                        this.blockList[b].container.y +
                        this.blockList[b].docks[i][1];
                    var dist = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
                    if (dist < min) {
                        newBlock = b;
                        newConnection = i;
                        min = dist;
                    }
                } else {
                    // TODO: bounce away from illegal connection?
                    // only if the distance was small
                    // console.debug('cannot not connect these two block types');
                }
            }
        }

        if (newBlock != null) {
            var n = this._countBlocksInStack(this.findTopBlock(newBlock));
            if (n > LONGSTACK) {
                this.errorMsg(_("Consider breaking this stack into parts."));
            }

            // We found a match.
            myBlock.connections[0] = newBlock;
            var connection = this.blockList[newBlock].connections[
                newConnection
            ];
            if (connection == null) {
                if (this.blockList[newBlock].isArgClamp()) {
                    // If it is an arg clamp, we may have to adjust
                    // the slot size.
                    if (
                        ["doArg", "calcArg", "makeblock"].indexOf(
                            this.blockList[newBlock].name
                        ) !== -1 &&
                        newConnection === 1
                    ) {
                    } else if (
                        ["doArg", "nameddoArg"].indexOf(
                            this.blockList[newBlock].name
                        ) !== -1 &&
                        newConnection ===
                            this.blockList[newBlock].connections.length - 1
                    ) {
                    } else {
                        // Get the size of the block we are inserting
                        // adding.
                        var size = this._getBlockSize(thisBlock);
                        // console.debug('inserting block of size ' + size + ' to arg clamp ' + this.blockList[newBlock].name);
                        // Get the current slot list.
                        var slotList = this.blockList[newBlock].argClampSlots;

                        // Which slot is this block in?
                        if (
                            ["doArg", "calcArg", "makeblock"].indexOf(
                                this.blockList[newBlock].name
                            ) !== -1
                        ) {
                            var si = newConnection - 2;
                        } else {
                            var si = newConnection - 1;
                        }
                        if (slotList[si] !== size) {
                            slotList[si] = size;
                            this.blockList[newBlock].updateArgSlots(slotList);
                        }
                    }
                }
            } else {
                // Three scenarios in which we may be overriding an
                // existing connection:
                // (1) if it is an argClamp, add a new slot below the
                //     current block;
                // (2) if it is an arg block, replace it; or
                // (3) if it is a flow block, insert it into the flow.
                // A few corner cases: Whenever we connect (or disconnect)
                // from an action block (c[1] arg), we need to ensure we have
                // a unique action name; Whenever we connect to a newnote
                // block (c[2] flow), we need to ensure we have either a silence
                // block or a pitch block. And if we are connecting to a
                // storein block, we need to ensure that there is a palette
                // entry for the new namedbox.
                insertAfterDefault = false;
                if (this.blockList[newBlock].isArgClamp()) {
                    if (
                        ["doArg", "calcArg", "makeblock"].indexOf(
                            this.blockList[newBlock].name
                        ) !== -1 &&
                        newConnection === 1
                    ) {
                        // If it is the action name then treat it like
                        // a standard replacement.
                        this.blockList[connection].connections[0] = null;
                        this.findDragGroup(connection);
                        for (var c = 0; c < this.dragGroup.length; c++) {
                            this.moveBlockRelative(this.dragGroup[c], 40, 40);
                        }
                    } else if (
                        ["doArg", "nameddoArg"].indexOf(
                            this.blockList[newBlock].name
                        ) !== -1 &&
                        newConnection ===
                            this.blockList[newBlock].connections.length - 1
                    ) {
                        // If it is the bottom of the flow, insert as
                        // usual.
                        var bottom = this.findBottomBlock(thisBlock);
                        this.blockList[connection].connections[0] = bottom;
                        this.blockList[bottom].connections[
                            this.blockList[bottom].connections.length - 1
                        ] = connection;
                    } else {
                        // Move the block in the current slot down one
                        // slot (cascading and creating a new slot if
                        // necessary).

                        // Get the size of the block we are inserting adding.
                        var size = this._getBlockSize(thisBlock);

                        // Get the current slot list.
                        var slotList = this.blockList[newBlock].argClampSlots;
                        // Which slot is this block in?
                        var ci = this.blockList[newBlock].connections.indexOf(
                            connection
                        );
                        if (
                            ["doArg", "calcArg", "makeblock"].indexOf(
                                this.blockList[newBlock].name
                            ) !== -1
                        ) {
                            var si = ci - 2;
                        } else {
                            var si = ci - 1;
                        }

                        var emptySlot = null;
                        var emptyConnection = null;
                        // Is there an empty slot below?
                        for (
                            var emptySlot = si;
                            emptySlot < slotList.length;
                            emptySlot++
                        ) {
                            if (
                                this.blockList[newBlock].connections[
                                    ci + emptySlot - si
                                ] == null
                            ) {
                                emptyConnection = ci + emptySlot - si;
                                break;
                            }
                        }

                        if (emptyConnection == null) {
                            slotList.push(1);
                            if (this.blockList[newBlock].name !== "makeblock") {
                                this._newLocalArgBlock(slotList.length);
                            }
                            emptyConnection = ci + emptySlot - si;
                            this.blockList[newBlock].connections.push(null);

                            // Slide everything down one slot.
                            for (var i = slotList.length - 1; i > si + 1; i--) {
                                slotList[i] = slotList[i - 1];
                            }
                            for (
                                var i =
                                    this.blockList[newBlock].connections
                                        .length - 1;
                                i > ci + 1;
                                i--
                            ) {
                                this.blockList[newBlock].connections[
                                    i
                                ] = this.blockList[newBlock].connections[i - 1];
                            }
                        }
                        // The new block is added below the current
                        // connection...
                        newConnection += 1;
                        // Set its slot size too.
                        slotList[si + 1] = size;

                        this.blockList[newBlock].updateArgSlots(slotList);
                    }
                } else if (myBlock.isArgBlock()) {
                    this.blockList[connection].connections[0] = null;

                    // If we are replacing a number block, put it in the trash
                    if (this.blockList[connection].name === "number") {
                        this.sendStackToTrash(this.blockList[connection]);
                    } else {
                        this.findDragGroup(connection);
                        for (var c = 0; c < this.dragGroup.length; c++) {
                            this.moveBlockRelative(this.dragGroup[c], 40, 40);
                        }
                    }

                    // We need to rename the action stack.
                    if (this.blockList[newBlock].name === "action") {
                        actionCheck = true;

                        if (
                            myBlock.value !== this.blockList[connection].value
                        ) {
                            // Temporarily disconnect to ensure we don't
                            // find myBlock when looking for a unique name.
                            var c = myBlock.connections[0];
                            myBlock.connections[0] = null;
                            var name = this.findUniqueActionName(myBlock.value);
                            myBlock.connections[0] = c;

                            if (name !== myBlock.value) {
                                myBlock.value = name;
                                var label = name;
                                if (
                                    getTextWidth(label, "bold 20pt Sans") >
                                    TEXTWIDTH
                                ) {
                                    label = label.substr(0, STRINGLEN) + "...";
                                }
                                myBlock.text.text = label;
                                myBlock.container.updateCache();
                            }

                            var that = this;
                            setTimeout(function() {
                                // A previously disconnected name may have left
                                // an entry in the palette we need to remove.
                                var name = that.blockList[connection].value;
                                if (
                                    that.protoBlockDict["myDo_" + name] !=
                                    undefined
                                ) {
                                    delete that.protoBlockDict["myDo_" + name];
                                    that.palettes.dict["action"].hideMenu(true);
                                }

                                that.newNameddoBlock(
                                    myBlock.value,
                                    that.actionHasReturn(newBlock),
                                    that.actionHasArgs(newBlock)
                                );
                                var blockPalette = that.palettes.dict["action"];
                                for (
                                    var b = 0;
                                    b < blockPalette.protoList.length;
                                    b++
                                ) {
                                    var protoblock = blockPalette.protoList[b];
                                    if (
                                        protoblock.name === "nameddo" &&
                                        protoblock.staticLabels[0] ===
                                            that.blockList[connection].value
                                    ) {
                                        setTimeout(function() {
                                            blockPalette.remove(
                                                protoblock,
                                                that.blockList[connection].value
                                            );
                                            delete that
                                                .protoBlockDict["myDo_" + that.blockList[connection].value];
                                            that.palettes.hide();
                                            that.palettes.updatePalettes(
                                                "action"
                                            );
                                            // Fixes #1779
                                            setTimeout(function() {
                                                that.palettes.show();
                                            }, 500);
                                        }, 50);

                                        break;
                                    }
                                }

                                that.renameNameddos(
                                    that.blockList[connection].value,
                                    myBlock.value
                                );
                                that.renameDos(
                                    that.blockList[connection].value,
                                    myBlock.value
                                );
                            }, 75); // 750
                        }
                    } else if (this.blockList[newBlock].name === "storein") {
                        // We may need to add new storein and namedo
                        // blocks to the palette.
                        if (newConnection === 1 && myBlock.value !== "box") {
                            this.newStoreinBlock(myBlock.value);
                            this.newStorein2Block(myBlock.value);
                            this.newNamedboxBlock(myBlock.value);
                            var that = this;
                            setTimeout(function() {
                                // that.palettes.hide();
                                that.palettes.updatePalettes("boxes");
                                // that.palettes.show();
                            }, 50); // 500
                        }
                    }
                } else if (myBlock.protoblock.style === "argclamparg") {
                    // We don't need to do anything special with
                    // argclamparg blocks.
                    console.debug("connecting to argclamparg");
                } else if (!this.blockList[thisBlock].isArgFlowClampBlock()) {
                    var bottom = this.findBottomBlock(thisBlock);
                    this.blockList[connection].connections[0] = bottom;
                    this.blockList[bottom].connections[
                        this.blockList[bottom].connections.length - 1
                    ] = connection;
                } else {
                    console.debug("HOW DID WE GET HERE?");
                }
            }

            this.blockList[newBlock].connections[newConnection] = thisBlock;

            // Remove the silence block (if it is present) after
            // adding a new block inside of a note block.
            if (
                this._insideNoteBlock(thisBlock) != null &&
                this.blockList[thisBlock].connections.length > 1
            ) {
                // If blocks are inserted above the silence block.
                if (insertAfterDefault) {
                    newBlock = this.deletePreviousDefault(thisBlock);
                } else if (bottom) {
                    this.deleteNextDefault(bottom);
                }
            }

            // If we attached a name to an action block, check to see
            // if we need to rename it.
            if (this.blockList[newBlock].name === "action" && !actionCheck) {
                // Is there already another action block with this name?
                for (var b = 0; b < this.blockList.length; b++) {
                    if (b === newBlock) continue;
                    if (this.blockList[b].name === "action") {
                        if (this.blockList[b].connections[1] != null) {
                            if (
                                this.blockList[this.blockList[b].connections[1]]
                                    .value === this.blockList[thisBlock].value
                            ) {
                                this.blockList[
                                    thisBlock
                                ].value = this.findUniqueActionName(
                                    this.blockList[thisBlock].value
                                );
                                var label = this.blockList[thisBlock].value;
                                if (
                                    getTextWidth(label, "bold 20pt Sans") >
                                    TEXTWIDTH
                                ) {
                                    label = label.substr(0, STRINGLEN) + "...";
                                }
                                this.blockList[thisBlock].text.text = label;
                                this.blockList[
                                    thisBlock
                                ].container.updateCache();
                                this.newNameddoBlock(
                                    this.blockList[thisBlock].value,
                                    this.actionHasReturn(b),
                                    this.actionHasArgs(b)
                                );
                                this.setActionProtoVisiblity(false);
                            }
                        }
                    }
                }
            }

            // console.debug('Adjust Docks: ' + this.blockList[newBlock].name);
            this.adjustDocks(newBlock, true);
            // TODO: some graphical feedback re new connection?

            // Check if top block is one of the widget blocks.
            var lockInit = false;
            if (c === null) {
                for (var i = 0; i < widgetTitle.length; i++) {
                    var that = this;
                    console.log(widgetTitle[i].innerHTML);
                    if (lockInit === false) {
                        switch (widgetTitle[i].innerHTML) {
                            case "tempo":
                            case "rhythm maker":
                            case "pitch slider":
                            case "pitch staircase":
                            case "status":
                            case "phrase maker":
                            case "custom mode":
                            case "music keyboard":
                            case "pitch drum":
                            case "meter":
                            case "temperament":
                            case "timbre":
                                lockInit = true;
                                this.reInitWidget(
                                    that.findTopBlock(thisBlock),
                                    1500
                                );
                                break;
                        }
                    }
                }
            }
        }

        // If it is an arg block, where is it coming from?
        // FIXME: improve mechanism for testing block types.
        if (
            (myBlock.isArgBlock() ||
                ["calcArg", "namedcalcArg", "makeblock"].indexOf(
                    myBlock.name
                ) !== -1) &&
            newBlock != null
        ) {
            // We care about twoarg blocks with connections to the
            // first arg;
            if (this.blockList[newBlock].isTwoArgBlock()) {
                if (this.blockList[newBlock].connections[1] === thisBlock) {
                    if (this._checkTwoArgBlocks.indexOf(newBlock) === -1) {
                        this._checkTwoArgBlocks.push(newBlock);
                    }
                }
            } else if (
                this.blockList[newBlock].isArgBlock() &&
                this.blockList[newBlock].isExpandableBlock()
            ) {
                if (this.blockList[newBlock].connections[1] === thisBlock) {
                    if (this._checkTwoArgBlocks.indexOf(newBlock) === -1) {
                        this._checkTwoArgBlocks.push(newBlock);
                    }
                }
            }
            // We also care about the second-to-last connection to an
            // arg block.
            var n = this.blockList[newBlock].connections.length;
            if (this.blockList[newBlock].connections[n - 2] === thisBlock) {
                // Only flow blocks, but not ArgClamps
                if (
                    !this.blockList[newBlock].isArgClamp() &&
                    this.blockList[newBlock].docks[n - 1][2] === "in"
                ) {
                    checkArgBlocks.push(newBlock);
                }
            }
        }

        this.addDefaultBlock(parentblk, thisBlock, actionCheck);

        // Put block adjustments inside a slight delay to make the
        // addition/substraction of vspace and changes of block shape
        // appear less abrupt (and it can be a little racy).
        // (Removed timeout)
        // If we changed the contents of a arg block, we may need a vspace.
        if (checkArgBlocks.length > 0) {
            for (var i = 0; i < checkArgBlocks.length; i++) {
                this._addRemoveVspaceBlock(checkArgBlocks[i]);
            }
        }

        // If we changed the contents of a two-arg block, we need to
        // adjust it.
        if (this._checkTwoArgBlocks.length > 0) {
            this._adjustExpandableTwoArgBlock(this._checkTwoArgBlocks);
        }

        // First, adjust the docks for any blocks that may have
        // had a vspace added.
        for (var i = 0; i < checkArgBlocks.length; i++) {
            // console.debug('Adjust Docks: ' + this.blockList[checkArgBlocks[i]].name);
            this.adjustDocks(checkArgBlocks[i], true);
        }

        // Next, recheck if the connection is inside of a
        // expandable block.
        var blk = this.insideExpandableBlock(thisBlock);
        var expandableLoopCounter = 0;
        while (blk != null) {
            // Extra check for malformed data.
            expandableLoopCounter += 1;
            if (expandableLoopCounter > 2 * this.blockList.length) {
                console.debug("Infinite loop checking for expandables?");
                console.debug(this.blockList);
                break;
            }

            if (this.blockList[blk].name === "ifthenelse") {
                this.clampBlocksToCheck.push([blk, 0]);
                this.clampBlocksToCheck.push([blk, 1]);
            } else {
                this.clampBlocksToCheck.push([blk, 0]);
            }

            blk = this.insideExpandableBlock(blk);
        }

        this.adjustExpandableClampBlock();
        this.refreshCanvas();
    };

    /*
     * Test for a valid connection between two dock types.
     * @param - type1 - dock type 1
     * @param - type2 - dock type 2
     * @private
     * @return boolean
     */
    this._testConnectionType = function(type1, type2) {
        // Can these two blocks dock?
        if (type1 === "in" && type2 === "out") {
            return true;
        }
        if (type1 === "out" && type2 === "in") {
            return true;
        }
        if (
            type1 === "numberin" &&
            ["numberout", "anyout"].indexOf(type2) !== -1
        ) {
            return true;
        }
        if (
            ["numberout", "anyout"].indexOf(type1) !== -1 &&
            type2 === "numberin"
        ) {
            return true;
        }
        if (type1 === "textin" && ["textout", "anyout"].indexOf(type2) !== -1) {
            return true;
        }
        if (["textout", "anyout"].indexOf(type1) !== -1 && type2 === "textin") {
            return true;
        }
        if (type1 === "booleanout" && type2 === "booleanin") {
            return true;
        }
        if (type1 === "booleanin" && type2 === "booleanout") {
            return true;
        }
        if (type1 === "mediain" && type2 === "mediaout") {
            return true;
        }
        if (type1 === "mediaout" && type2 === "mediain") {
            return true;
        }
        if (type1 === "mediain" && type2 === "textout") {
            return true;
        }
        if (type2 === "mediain" && type1 === "textout") {
            return true;
        }
        if (type1 === "filein" && type2 === "fileout") {
            return true;
        }
        if (type1 === "fileout" && type2 === "filein") {
            return true;
        }
        if (
            type1 === "solfegein" &&
            ["anyout", "solfegeout", "textout", "noteout", "scaledegreeout", "numberout"].indexOf(
                type2
            ) !== -1
        ) {
            return true;
        }
        if (
            type2 === "solfegein" &&
            ["anyout", "solfegeout", "textout", "noteout", "scaledegreeout", "numberout"].indexOf(
                type1
            ) !== -1
        ) {
            return true;
        }
        if (
            type1 === "notein" &&
            ["solfegeout", "scaledegreeout", "textout", "noteout"].indexOf(type2) !== -1
        ) {
            return true;
        }
        if (
            type1 === "gridout" && type2 ==="gridin"
        ) {
            return true;
        }
        if (
            type2 === "notein" &&
            ["solfegeout", "scaledegreeout", "textout", "noteout"].indexOf(type1) !== -1
        ) {
            return true;
        }
        if (
            type1 === "anyin" &&
            [
                "textout",
                "mediaout",
                "numberout",
                "anyout",
                "fileout",
                "solfegeout",
                "scaledegreeout",
                "noteout"
            ].indexOf(type2) !== -1
        ) {
            return true;
        }
        if (
            type2 === "anyin" &&
            [
                "textout",
                "mediaout",
                "numberout",
                "anyout",
                "fileout",
                "solfegeout",
                "scaledegreeout",
                "noteout"
            ].indexOf(type1) !== -1
        ) {
            return true;
        }
        return false;
    };

    /*
     * Ensure that all the blocks are where they are supposed to be.
     * @public
     * @return {void}
     */
    this.updateBlockPositions = function() {
        for (var blk = 0; blk < this.blockList.length; blk++) {
            this._moveBlock(
                blk,
                this.blockList[blk].container.x,
                this.blockList[blk].container.y
            );
        }
    };

    /*
     * Move all the blocks to the top layer of the block container.
     * @public
     * @return {void}
     */
    this.bringToTop = function() {
        this._adjustTheseStacks = [];

        for (var blk in this.blockList) {
            var myBlock = this.blockList[blk];
            if (myBlock.connections[0] == null) {
                this._adjustTheseStacks.push(blk);
            }
        }
        for (var blk = 0; blk < this._adjustTheseStacks.length; blk++) {
            // console.debug('Adjust Stack: ' + this.blockList[this._adjustTheseStacks[blk]].name);
            this.raiseStackToTop(this._adjustTheseStacks[blk]);
        }

        this.refreshCanvas();
    };

    /*
     * Checks the bounds to ensure blocks are "home".
     * @public
     * @return {void}
     */
    this.checkBounds = function() {
        var onScreen = true;
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].connections[0] == null) {
                if (this.blockList[blk].offScreen(this.boundary)) {
                    this._setHomeButtonContainers(true, false);
                    // Just highlight the button.
                    // this.boundary.show();
                    onScreen = false;
                    break;
                }
            }
        }
        if (onScreen) {
            this._setHomeButtonContainers(false, true);
            this.boundary.hide();
        }
    };

    /*
     * Move a block to a specified position and check the docks afterward.
     * @public
     * @return{void}
     */
    this.moveBlock = function(blk, x, y) {
        this._moveBlock(blk, x, y);
        this.adjustDocks(blk, true);
    };

    /*
     * Move a block (and its label) to x, y.
     * @param - blk - block
     * @param - x - x position
     * @param - y - y position
     * @public
     * @return {void}
     */
    this._moveBlock = function(blk, x, y) {
        var myBlock = this.blockList[blk];
        if (myBlock.container != null) {
            // Round position so font renders clearly.
            myBlock.container.x = Math.floor(x + 0.5);
            myBlock.container.y = Math.floor(y + 0.5);

            this.checkBounds();
        } else {
            console.debug("No container yet for block " + myBlock.name);
        }
    };

    /*
     * Relative move of a block (and its label) by dx, dy
     * @param - blk - block
     * @param - dx - updated x position
     * @param - dy - updated y position
     * @public
     * @return {void}
     */
    this.moveBlockRelative = function(blk, dx, dy) {
        this.inLongPress = false;

        var myBlock = this.blockList[blk];
        if (myBlock.container != null) {
            // Seems we don't need to round again here.
            myBlock.container.x += dx; // Math.floor(dx + 0.5);
            myBlock.container.y += dy; // Math.floor(dy + 0.5);

            this.checkBounds();
        } else {
            console.debug("No container yet for block " + myBlock.name);
        }
    };

    /*
     * Moves the blocks in a stack to a new position.
     * @param blk - block
     * @param dx - x position
     * @param dy - y position
     * @public
     * @return {void}
     */
    this.moveStackRelative = function(blk, dx, dy) {
        this.findDragGroup(blk);
        if (this.dragGroup.length > 0) {
            for (var b = 0; b < this.dragGroup.length; b++) {
                this.moveBlockRelative(this.dragGroup[b], dx, dy);
            }
        }
    };

    /*
     * Update the block labels.
     * When we create new blocks, we may not have assigned the value yet.
     * @param - blk - block
     * @public
     * @return {void}
     */
    this.updateBlockText = function(blk) {
        var myBlock = this.blockList[blk];
        var maxLength = 8;
        if (myBlock.text == null) {
            return;
        }

        switch (myBlock.name) {
            case "loadFile":
                try {
                    var label = myBlock.value[0].toString();
                } catch (e) {
                    var label = _("open file");
                }
                maxLength = 10;
                break;
            case "solfege":
                if (myBlock.value === null) myBlock.value = "sol";
                var obj = splitSolfege(myBlock.value);
                var label = i18nSolfege(obj[0]);
                var attr = obj[1];

                if (attr !== NATURAL) {
                    label += attr;
                }
                break;
            case "scaledegree2":
                if (myBlock.value === null) myBlock.value = "4";
                var obj = splitScaleDegree(myBlock.value);
                var label = obj[0];
                var attr = obj[1];
                if (attr !== NATURAL) {
                    label += attr;
                }
                break;
            case "customNote":
                var label = _(myBlock.value);
                break;
            case "eastindiansolfege":
                if (myBlock.value === null) myBlock.value = "sol";
                var obj = splitSolfege(myBlock.value);
                var label = WESTERN2EISOLFEGENAMES[obj[0]];
                var attr = obj[1];

                if (attr !== NATURAL) {
                    label += attr;
                }
                break;
            case "modename":
                if (myBlock.value === null) myBlock.value = DEFAULTMODE;
                var label = _(myBlock.value); // + ' ' + getModeNumbers(myBlock.value);
                break;
            case "accidentalname":
            case "intervalname":
                if (myBlock.value === null) {
                    switch (myBlock.name) {
                        case "accidentalname":
                            myBlock.value = DEFAULTACCIDENTAL;
                            break;
                        case "intervalname":
                            myBlock.value = DEFAULTINTERVAL;
                            break;
                    }
                }
                var obj = myBlock.value.split(" ");
                var label = _(obj[0]) + " " + obj[1];
                break;
            case "filtertype":
            case "drumname":
            case "effectsname":
            case "voicename":
            case "oscillatortype":
            case "invertmode":
                if (myBlock.value === null) {
                    switch (myBlock.name) {
                        case "filtertype":
                            myBlock.value = DEFAULTFILTERTYPE;
                            break;
                        case "drumname":
                            myBlock.value = DEFAULTDRUM;
                            break;
                        case "effectsname":
                            myBlock.value = DEFAULTEFFECT;
                            break;
                        case "voicename":
                            myBlock.value = DEFAULTVOICE;
                            break;
                        case "oscillatortype":
                            myBlock.value = DEFAULTOSCILLATORTYPE;
                            break;
                        case "invertmode":
                            myBlock.value = DEFAULTINVERT;
                            break;
                    }
                }
                var label = _(myBlock.value);
                break;
            case "noisename":
                var label = getNoiseName(myBlock.value);
                break;
            case "temperamentname":
                var label = _(TEMPERAMENTS[0][1]); // equal by default
                for (var i = 0; i < TEMPERAMENTS.length; i++) {
                    if (TEMPERAMENTS[i][1] === myBlock.value) {
                        if (TEMPERAMENTS[i][0].length === 0) {
                            label = TEMPERAMENTS[i][2];
                        } else {
                            label = TEMPERAMENTS[i][0];
                        }
                        break;
                    }
                }
                break;
            case "boolean":
                if (myBlock.value) {
                    var label = _("true");
                } else {
                    var label = _("false");
                }

                break;
            default:
                if (myBlock.value == null) {
                    var label = "";
                } else if (typeof myBlock.value !== "string") {
                    var label = myBlock.value.toString();
                } else {
                    var label = myBlock.value;
                }
                break;
        }

        if (
            WIDENAMES.indexOf(myBlock.name) === -1 &&
            label.length > maxLength
        ) {
            label = label.substr(0, maxLength - 1) + "...";
        }

        myBlock.text.text = label;

        // Make sure text is on top.
        var z = myBlock.container.children.length - 1;
        myBlock.container.setChildIndex(myBlock.text, z);

        if (myBlock.loadComplete) {
            myBlock.container.updateCache();
        } else {
            console.debug(
                "Load not yet complete for (" + blk + ") " + myBlock.name
            );
        }
    };

    /*
     * Find the top block in the stack.
     * @param - blk - block
     * @public
     * @return blk
     */
    this.findTopBlock = function(blk) {
        // Find the top block in a stack.
        if (blk == null) {
            return null;
        }

        var myBlock = this.blockList[blk];
        if (myBlock.connections == null) {
            return blk;
        }

        if (myBlock.connections.length === 0) {
            return blk;
        }

        // Test for corrupted-connection scenario.
        if (
            myBlock.connections.length > 1 &&
            myBlock.connections[0] != null &&
            myBlock.connections[0] === last(myBlock.connections)
        ) {
            console.debug(
                "WARNING: CORRUPTED BLOCK DATA. Block " +
                    myBlock.name +
                    " (" +
                    blk +
                    ") is connected to the same block " +
                    this.blockList[myBlock.connections[0]].name +
                    " (" +
                    myBlock.connections[0] +
                    ") twice."
            );
            return blk;
        }

        var topBlockLoop = 0;
        while (myBlock.connections[0] != null) {
            topBlockLoop += 1;
            if (topBlockLoop > 2 * this.blockList.length) {
                // Could happen if the block data is malformed.
                console.debug("infinite loop finding topBlock?");
                console.debug(
                    this.blockList.indexOf(myBlock) + " " + myBlock.name
                );
                break;
            }
            blk = myBlock.connections[0];
            myBlock = this.blockList[blk];
        }
        return blk;
    };

    /*
     * Checks if two blocks are of the same flow generation.
     * @param - firstblk
     * @param - childblk
     * @public
     * @return boolean
     */
    this.sameGeneration = function(firstBlk, childBlk) {
        if (firstBlk == null || childBlk == null) {
            return false;
        }

        if (firstBlk === childBlk) {
            return true;
        }

        var myBlock = this.blockList[firstBlk];
        if (myBlock.connections == null) {
            return false;
        }

        if (myBlock.connections.length === 0) {
            return false;
        }

        var bottomBlockLoop = 0;
        while (last(myBlock.connections) != null) {
            bottomBlockLoop += 1;
            if (bottomBlockLoop > 2 * this.blockList.length) {
                // Could happen if the block data is malformed.
                console.debug("infinite loop finding bottomBlock?");
                break;
            }
            blk = last(myBlock.connections);
            myBlock = this.blockList[blk];
            if (blk === childBlk) {
                return true;
            }
        }
        return false;
    };

    /*
     * Check if there is a block type in any of the stacks.
     * @param - thisBlock - new variable
     * @param - names - names of blocks
     * @private
     * @return boolean
     */
    this._blockInStack = function(thisBlock, names) {
        // Is there a block of any of these names in this stack?
        var counter = 0;
        while (thisBlock != null) {
            if (names.indexOf(this.blockList[thisBlock].name) !== -1) {
                return true;
            }

            if (this.blockList[thisBlock].connections.length > 1) {
                thisBlock = last(this.blockList[thisBlock].connections);
            } else {
                thisBlock = null;
            }

            // Just in case there is a loop in the block list.
            counter += 1;
            if (counter > this.blockList.length) {
                console.debug("infinite loop finding block name in stack");
                break;
            }
        }

        return false;
    };

    /*
     * Find the bottom block in the stack.
     * @param - blk - block
     * @public
     * @return blk
     */
    this.findBottomBlock = function(blk) {
        // Find the bottom block in a stack.
        if (blk == null) {
            return null;
        }

        var myBlock = this.blockList[blk];
        if (myBlock.connections == null) {
            return blk;
        }

        if (myBlock.connections.length === 0) {
            return blk;
        }

        var bottomBlockLoop = 0;
        while (last(myBlock.connections) != null) {
            bottomBlockLoop += 1;
            if (bottomBlockLoop > 2 * this.blockList.length) {
                // Could happen if the block data is malformed.
                console.debug("infinite loop finding bottomBlock?");
                break;
            }
            blk = last(myBlock.connections);
            myBlock = this.blockList[blk];
        }
        return blk;
    };

    /*
     * Count all the blocks in the stack starting from blk.
     * @param - blk - block
     * @private
     * c = 0
     * @return c
     */
    this._countBlocksInStack = function(blk) {
        var c = 0;
        if (blk !== null) {
            c += 1;

            for (var i = 1; i < this.blockList[blk].connections.length; i++) {
                c += this._countBlocksInStack(
                    this.blockList[blk].connections[i]
                );
            }
        }

        return c;
    };

    /*
     * Find any block with null in its first connection.
     * Push them onto the stackList.
     * @public
     * @return {void}
     */
    this.findStacks = function() {
        this.stackList = [];
        for (var i = 0; i < this.blockList.length; i++) {
            if (this.blockList[i].connections[0] == null) {
                this.stackList.push(i);
            }
        }
    };

    /*
     * Find any clamp blocks.
     * @private
     * @return {void}
     */
    this._findClamps = function() {
        this._expandablesList = [];
        this.findStacks(); // We start by finding the stacks
        for (var i = 0; i < this.stackList.length; i++) {
            this._searchCounter = 0;
            this._searchForExpandables(this.stackList[i]);
        }

        this._searchForArgFlow();
    };

    /*
     * Find any expandable arg blocks.
     * @public
     * @return {void}
     */
    this._findTwoArgs = function() {
        this._expandablesList = [];
        for (var i = 0; i < this.blockList.length; i++) {
            if (
                this.blockList[i].isArgBlock() &&
                this.blockList[i].isExpandableBlock()
            ) {
                this._expandablesList.push(i);
            } else if (this.blockList[i].isTwoArgBlock()) {
                this._expandablesList.push(i);
            }
        }
    };

    /*
     * Search for argument flow blocks.
     * @private
     * @return{void}
     */
    this._searchForArgFlow = function() {
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].isArgFlowClampBlock()) {
                this._searchCounter = 0;
                this._searchForExpandables(blk);
                this._expandablesList.push(blk);
            }
        }
    };

    /*
     * Search for expandable blocks below blk in stack.
     * @param - blk - block
     * @private
     * @return {void}
     */
    this._searchForExpandables = function(blk) {
        while (
            blk != null &&
            this.blockList[blk] != null &&
            !this.blockList[blk].isValueBlock()
        ) {
            // More checks for malformed or corrupted block data.
            this._searchCounter += 1;
            if (this._searchCounter > 2 * this.blockList.length) {
                console.debug(
                    "infinite loop searching for Expandables? " +
                        this._searchCounter
                );
                console.debug(blk + " " + this.blockList[blk].name);
                break;
            }

            if (this.blockList[blk].isClampBlock()) {
                this._expandablesList.push(blk);
                var c = this.blockList[blk].connections.length - 2;
                this._searchForExpandables(this.blockList[blk].connections[c]);
                if (this.blockList[blk].name === "ifthenelse") {
                    // search top clamp too
                    var c = 2;
                    this._searchForExpandables(
                        this.blockList[blk].connections[c]
                    );
                }
            } else if (this.blockList[blk].isArgClamp()) {
                this._expandablesList.push(blk);
            }

            if (this.blockList[blk].connections.length > 1) {
                blk = last(this.blockList[blk].connections);
            } else {
                // A value block only connects back to its parent, so
                // end the search here.
                blk = null;
            }
        }
    };

    /*
     * Expand two-arg blocks as needed.
     * @private
     * @return {void}
     */
    this._expandTwoArgs = function() {
        this._findTwoArgs();
        this._adjustExpandableTwoArgBlock(this._expandablesList);
        this.refreshCanvas();
    };

    /*
     * Expand expandable clamp blocks as needed.
     * @private
     * @return {void}
     */
    this._expandClamps = function() {
        this._findClamps();
        this.clampBlocksToCheck = [];
        for (var i = 0; i < this._expandablesList.length; i++) {
            if (
                this.blockList[this._expandablesList[i]].name === "ifthenelse"
            ) {
                this.clampBlocksToCheck.push([this._expandablesList[i], 0]);
                this.clampBlocksToCheck.push([this._expandablesList[i], 1]);
            } else {
                this.clampBlocksToCheck.push([this._expandablesList[i], 0]);
            }
        }

        this.adjustExpandableClampBlock();
        this.refreshCanvas();
    };

    /*
     * Some blocks, e.g., sensor blocks for Butia, change their
       appearance depending upon if they have been enabled or
       disabled. If they have, change their disabled status
     * @param - name
     * @param - flag
     * @public
     * @return {void}
     */
    this.changeDisabledStatus = function(name, flag) {
        for (var blk in this.blockList) {
            var myBlock = this.blockList[blk];
            if (myBlock.name === name) {
                myBlock.protoblock.disabled = flag;
                myBlock.regenerateArtwork(false);
            }
        }
    };

    /*
     * Unhighlight all blocks.
     * @public
     * @return {void}
     */
    this.unhighlightAll = function() {
        for (var blk in this.blockList) {
            this.unhighlight(blk);
        }
    };

    /*
     * Unhighlight a block
     * @public
     * return {void}
     */
    this.unhighlight = function(blk) {
        if (!this.visible) {
            return;
        }
        if (blk != null) {
            var thisBlock = blk;
        } else {
            var thisBlock = this.highlightedBlock;
        }

        if (thisBlock != null) {
            this.blockList[thisBlock].unhighlight();
        }

        if ((this.highlightedBlock = thisBlock)) {
            this.highlightedBlock = null;
        }
    };

    /*
     * Highlight a block
     * @param - blk - block
     * @param - unhilight - new variable
     * @public
     * @return {void}
     */
    this.highlight = function(blk, unhighlight) {
        if (!this.visible) {
            return;
        }
        if (blk != null) {
            if (unhighlight) {
                this.unhighlight(null);
            }
            this.blockList[blk].highlight();
            this.highlightedBlock = blk;
        }
    };

    /*
     * Hide all of the blocks.
     * @public
     * return {void}
     */
    this.hide = function() {
        for (var blk in this.blockList) {
            this.blockList[blk].hide();
        }
        this.visible = false;
    };

    /*
     * Show all the blocks.
     * @public
     * return {void}
     */
    this.show = function() {
        for (var blk in this.blockList) {
            this.blockList[blk].show();
        }
        this.visible = true;
    };

    /*
     * Make a new block with connections
     * @param - name - new variable
     * @param - blockOffset - new variable
     * @param - connections
     * @param - postPorcess
     * @param - postProcessArg - Post process Argument
     * @private
     * @return {void}
     */
    this._makeNewBlockWithConnections = function(
        name,
        blockOffset,
        connections,
        postProcess,
        postProcessArg
    ) {
        if (typeof collapsed === "undefined") {
            collapsed = false;
        }

        myBlock = this.makeNewBlock(name, postProcess, postProcessArg);
        if (myBlock == null) {
            console.debug("could not make block " + name);
            return;
        }

        for (var c = 0; c < connections.length; c++) {
            if (c === myBlock.docks.length) {
                break;
            }
            if (connections[c] == null) {
                myBlock.connections.push(null);
            } else {
                myBlock.connections.push(connections[c] + blockOffset);
            }
        }
    };

    /*
     * Create new block
     * @param - name
     * @param - postProcess
     * @param - postProcessArg
     * @public
     * @return {void}
     */
    this.makeNewBlock = function(name, postProcess, postProcessArg) {
        // Create a new block
        if (!name in this.protoBlockDict) {
            // Should never happen: nop blocks should be substituted
            console.debug("makeNewBlock: no prototype for " + name);
            return null;
        }

        if (this.protoBlockDict[name] == null) {
            // Should never happen
            console.debug("makeNewBlock: no prototype for " + name);
            return null;
        }

        // Deprecated
        // If we drag in a synth block, we need to load the synth.
        if (["sine", "sawtooth", "triangle", "square"].indexOf(name) !== -1) {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.logo.synth.loadSynth(0, name);
            }
        }

        if (
            [
                "namedbox",
                "nameddo",
                "namedcalc",
                "nameddoArg",
                "namedcalcArg"
            ].indexOf(name) !== -1
        ) {
            this.blockList.push(
                new Block(this.protoBlockDict[name], this, postProcessArg[1])
            );
        } else if (name === "namedarg") {
            this.blockList.push(
                new Block(
                    this.protoBlockDict[name],
                    this,
                    "arg " + postProcessArg[1]
                )
            );
        } else {
            this.blockList.push(new Block(this.protoBlockDict[name], this));
        }

        if (last(this.blockList) == null) {
            // Should never happen
            console.debug("failed to make protoblock for " + name);
            return null;
        }

        // We copy the dock because expandable blocks modify it.
        var myBlock = last(this.blockList);
        myBlock.copySize();

        // Create a new NoteController instance for each note block
        if (myBlock.name === "newnote") {
            myBlock.controller = new NoteController();
        }

        // We may need to do some postProcessing to the block
        myBlock.postProcess = postProcess;
        myBlock.postProcessArg = postProcessArg;

        // We need a container for the block graphics.
        myBlock.container = new createjs.Container();
        this.stage.addChild(myBlock.container);
        myBlock.container.snapToPixelEnabled = true;
        myBlock.container.x = 0;
        myBlock.container.y = 0;

        // and we need to load the images into the container.
        myBlock.imageLoad();
        return myBlock;
    };

    /*
     * Make new blocks from proto block, which is called from Palettes
     * @param - name
     * @param - arg - argument
     * @public
     * @return {void}
     */
    this.makeBlock = function(name, arg) {
        // console.debug('makeBlock ' + name + ' ' + arg);

        var postProcess = function(args) {
            var thisBlock = args[0];
            var value = args[1];
            that.blockList[thisBlock].value = value;
            switch (that.blockList[thisBlock].name) {
                case "drumname":
                case "effectsname":
                case "voicename":
                case "oscillatortype":
                case "invertmode":
                case "filtertype":
                    console.debug(value + " " + _(value));
                    that.blockList[thisBlock].text.text = _(value);
                    break;
                case "noisename":
                    var label = getNoiseName(value);
                    break;
                case "temperamentname":
                    that.blockList[thisBlock].text.text = _(TEMPERAMENTS[0][1]);
                    for (var i = 0; i < TEMPERAMENTS.length; i++) {
                        if (TEMPERAMENTS[i][1] === value) {
                            that.blockList[thisBlock].text.text =
                                TEMPERAMENTS[i][0];
                            break;
                        }
                    }
                    break;
                case "boolean":
                    if (value) {
                        that.blockList[thisBlock].text.text = _("true");
                    } else {
                        that.blockList[thisBlock].text.text = _("false");
                    }

                    break;
                default:
                    that.blockList[thisBlock].text.text = value;
                    break;
            }

            that.blockList[thisBlock].container.updateCache();
        };

        var postProcessArg = null;
        var that = this;
        var thisBlock = this.blockList.length;
        if (name === "start") {
            var postProcess = function(thisBlock) {
                that.blockList[thisBlock].value =
                    that.turtles.turtleList.length;
                that.turtles.addTurtle(that.blockList[thisBlock]);
            };

            postProcessArg = thisBlock;
        } else if (name === "text") {
            postProcessArg = [thisBlock, _("text")];
        } else if (name === "boolean") {
            console.debug("boolean" + " " + true);
            postProcessArg = [thisBlock, true];
        } else if (name === "solfege") {
            postProcessArg = [thisBlock, "sol"];
        } else if (name === "scaledegree2") {
            postProcessArg = [thisBlock, "5"];
        } else if (name === "customNote") {
            var len = this.logo.synth.startingPitch.length;
            postProcessArg = [
                thisBlock,
                this.logo.synth.startingPitch.substring(0, len - 1) + "(+0)"
            ];
        } else if (name === "notename") {
            postProcessArg = [thisBlock, "G"];
        } else if (name === "drumname") {
            postProcessArg = [thisBlock, DEFAULTDRUM];
        } else if (name === "effectsname") {
            postProcessArg = [thisBlock, DEFAULTEFFECT];
        } else if (name === "filtertype") {
            postProcessArg = [thisBlock, DEFAULTFILTER];
        } else if (name === "oscillatortype") {
            postProcessArg = [thisBlock, DEFAULTOSCILLATORTYPE];
        } else if (name === "voicename") {
            postProcessArg = [thisBlock, DEFAULTVOICE];
        } else if (name === "noisename") {
            postProcessArg = [thisBlock, DEFAULTNOISE];
        } else if (name === "eastindiansolfege") {
            var postProcess = function(args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = value;
                that.blockList[thisBlock].text.text =
                    WESTERN2EISOLFEGENAMES[value];
                that.blockList[thisBlock].container.updateCache();
            };

            postProcessArg = [thisBlock, "sol"];
        } else if (name === "modename") {
            var postProcess = function(args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = value;
                that.blockList[thisBlock].text.text = value; // + ' ' + getModeNumbers(this.value);
                that.blockList[thisBlock].container.updateCache();
            };

            postProcessArg = [thisBlock, DEFAULTMODE];
        } else if (name === "accidentalname") {
            var postProcess = function(args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = value;
                var obj = value.split(" ");
                that.blockList[thisBlock].text.text = _(obj[0]) + " " + obj[1];
                that.blockList[thisBlock].container.updateCache();
            };

            postProcessArg = [thisBlock, DEFAULTACCIDENTAL];
        } else if (name === "intervalname") {
            var postProcess = function(args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = value;
                var obj = value.split(" ");
                that.blockList[thisBlock].text.text = _(obj[0]) + " " + obj[1];
                that.blockList[thisBlock].container.updateCache();
            };

            postProcessArg = [thisBlock, DEFAULTINTERVAL];
        } else if (name === "temperamentname") {
            postProcessArg = [thisBlock, DEFAULTTEMPERAMENT];
        } else if (name === "invertmode") {
            postProcessArg = [thisBlock, DEFAULTINVERT];
        } else if (name === "number") {
            var postProcess = function(args) {
                var thisBlock = args[0];
                var value = Number(args[1]);
                that.blockList[thisBlock].value = value;
                that.blockList[thisBlock].text.text = value.toString();
                that.blockList[thisBlock].container.updateCache();
            };

            postProcessArg = [thisBlock, NUMBERBLOCKDEFAULT];
        } else if (name === "loudness" || name === "pitchness") {
            var postProcess = function() {
                that.logo.initMediaDevices();
            };
        } else if (name === "media") {
            var postProcess = function(args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = value;
                if (value == null) {
                    that.blockList[thisBlock].image = "images/load-media.svg";
                } else {
                    that.blockList[thisBlock].image = null;
                }
            };

            postProcessArg = [thisBlock, null];
        } else if (name === "camera") {
            var postProcess = function(args) {
                console.debug("post process camera " + args[1]);
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = CAMERAVALUE;
                if (value == null) {
                    that.blockList[thisBlock].image = "images/camera.svg";
                } else {
                    that.blockList[thisBlock].image = null;
                }
            };

            postProcessArg = [thisBlock, null];
        } else if (name === "video") {
            var postProcess = function(args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = VIDEOVALUE;
                if (value == null) {
                    that.blockList[thisBlock].image = "images/video.svg";
                } else {
                    that.blockList[thisBlock].image = null;
                }
            };

            postProcessArg = [thisBlock, null];
        } else if (name === "loadFile") {
            var postProcess = function(args) {
                that.updateBlockText(args[0]);
            };

            postProcessArg = [thisBlock, null];
        } else if (
            [
                "storein2",
                "namedbox",
                "nameddo",
                "namedcalc",
                "nameddoArg",
                "namedcalcArg",
                "namedarg"
            ].indexOf(name) !== -1
        ) {
            var postProcess = function(args) {
                that.blockList[thisBlock].value = null;
                that.blockList[thisBlock].privateData = args[1];
            };

            postProcessArg = [thisBlock, arg];
        } else if (name === "newnote") {
            var postProcess = function(args) {
                var thisBlock = args[0];
            };

            postProcessArg = [thisBlock, null];
        } else {
            var postProcess = null;
        }

        var protoFound = false;
        for (var proto in that.protoBlockDict) {
            if (that.protoBlockDict[proto].name === name) {
                if (arg === "__NOARG__") {
                    that.makeNewBlock(proto, postProcess, postProcessArg);
                    protoFound = true;
                    break;
                } else if (that.protoBlockDict[proto].defaults[0] === arg) {
                    that.makeNewBlock(proto, postProcess, postProcessArg);
                    protoFound = true;
                    break;
                } else if (
                    [
                        "namedbox",
                        "nameddo",
                        "namedcalc",
                        "nameddoArg",
                        "namedcalcArg",
                        "namedarg"
                    ].indexOf(name) !== -1
                ) {
                    if (that.protoBlockDict[proto].defaults[0] === undefined) {
                        that.makeNewBlock(proto, postProcess, postProcessArg);
                        protoFound = true;
                        break;
                    }
                } else if (name === "storein2") {
                    var postProcess = function(args) {
                        var c = that.blockList[thisBlock].connections[0];
                        if (args[1] === _("store in box")) {
                            that.blockList[c].privateData = _("box");
                        } else {
                            that.blockList[c].privateData = args[1];
                            if (args[1] === "box1") {
                                that.blockList[c].overrideName = _("box1");
                            } else if (args[1] === "box2") {
                                that.blockList[c].overrideName = _("box2");
                            } else {
                                that.blockList[c].overrideName = args[1];
                            }
                            that.blockList[c].regenerateArtwork(false);
                        }
                    };

                    postProcessArg = [thisBlock, arg];

                    that.makeNewBlock(proto, postProcess, postProcessArg);
                    protoFound = true;
                    break;
                }
            }
        }

        if (!protoFound) {
            console.debug(name + " not found!!");
        }

        var blk = this.blockList.length - 1;
        var myBlock = this.blockList[blk];
        for (var i = 0; i < myBlock.docks.length; i++) {
            myBlock.connections.push(null);
        }

        // Attach default args if any
        var cblk = blk + 1;
        for (var i = 0; i < myBlock.protoblock.defaults.length; i++) {
            var value = myBlock.protoblock.defaults[i];

            if (myBlock.name === "action") {
                // Make sure we don't make two actions with the same name.
                value = this.findUniqueActionName(_("action"));
                if (value !== _("action")) {
                    // TODO: are there return or arg blocks?
                    this.newNameddoBlock(value, false, false);
                    // this.palettes.hide();
                    this.palettes.updatePalettes("action");
                    // this.palettes.show();
                }
            }

            var that = this;
            var thisBlock = this.blockList.length;
            if (
                myBlock.docks.length > i &&
                myBlock.docks[i + 1][2] === "anyin"
            ) {
                if (value == null) {
                    console.debug("cannot set default value");
                } else if (typeof value === "string") {
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].value = value;
                        var label = value.toString();
                        if (
                            WIDENAMES.indexOf(
                                that.blockList[thisBlock].name
                            ) === -1 &&
                            getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH
                        ) {
                            label = label.substr(0, STRINGLEN) + "...";
                        }
                        that.blockList[thisBlock].text.text = label;
                        that.blockList[thisBlock].container.updateCache();
                    };

                    this.makeNewBlock("text", postProcess, [thisBlock, value]);
                } else {
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = Number(args[1]);
                        that.blockList[thisBlock].value = value;
                        that.blockList[thisBlock].text.text = value.toString();
                    };

                    this.makeNewBlock("number", postProcess, [
                        thisBlock,
                        value
                    ]);
                }
            } else if (myBlock.docks[i + 1][2] === "textin") {
                var postProcess = function(args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    var label = value.toString();
                    if (
                        WIDENAMES.indexOf(that.blockList[thisBlock].name) ===
                            -1 &&
                        getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH
                    ) {
                        label = label.substr(0, STRINGLEN) + "...";
                    }
                    that.blockList[thisBlock].text.text = label;
                };

                this.makeNewBlock("text", postProcess, [thisBlock, value]);
            } else if (myBlock.docks[i + 1][2] === "solfegein") {
                var postProcess = function(args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    var label = i18nSolfege(value.toString());
                    that.blockList[thisBlock].text.text = label;
                };

                this.makeNewBlock("solfege", postProcess, [thisBlock, value]);
            } else if (myBlock.docks[i + 1][2] === "notein") {
                var postProcess = function(args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    var label = value.toString();
                    that.blockList[thisBlock].text.text = label;
                };

                this.makeNewBlock("notename", postProcess, [thisBlock, value]);
            } else if (myBlock.docks[i + 1][2] === "mediain") {
                var postProcess = function(args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    if (value != null) {
                        // loadThumbnail(that, thisBlock, null);
                    }
                };

                this.makeNewBlock("media", postProcess, [thisBlock, value]);
            } else if (myBlock.docks[i + 1][2] === "filein") {
                var postProcess = function(blk) {
                    that.updateBlockText(blk);
                };
                this.makeNewBlock("loadFile", postProcess, thisBlock);
            } else {
                var postProcess = function(args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    that.blockList[thisBlock].text.text = value.toString();
                };

                this.makeNewBlock("number", postProcess, [thisBlock, value]);
            }

            var myConnectionBlock = this.blockList[cblk + i];
            myConnectionBlock.connections = [blk];
            myConnectionBlock.value = value;
            myBlock.connections[i + 1] = cblk + i;
        }

        // Generate and position the block bitmaps and labels
        this.updateBlockPositions();
        // console.debug('Adjust Docks: ' + this.blockList[blk].name);
        this.adjustDocks(blk, true);
        this.refreshCanvas();

        return blk;
    };

    /*
     * Create the drag group from the blocks connected to blk.
     * @param - blk - block
     * @public
     * @return {void}
     */
    this.findDragGroup = function(blk) {
        if (blk == null) {
            console.debug("null block passed to findDragGroup");
            return;
        }

        this.dragLoopCounter = 0;
        this.dragGroup = [];
        this._calculateDragGroup(blk);
    };

    /*
     * Give a block, find all the blocks connected to it.
     * @param - blk - block
     * @private
     * @return {void}
     */
    this._calculateDragGroup = function(blk) {
        this.dragLoopCounter += 1;
        if (this.dragLoopCount > this.blockList.length) {
            console.debug(
                "maximum loop counter exceeded in calculateDragGroup... this is bad. " +
                    blk
            );
            return;
        }

        if (blk == null) {
            console.debug("null block passed to calculateDragGroup");
            return;
        }

        var myBlock = this.blockList[blk];
        // If this happens, something is really broken.
        if (myBlock == null) {
            console.debug("null block encountered... this is bad. " + blk);
            return;
        }

        // As before, does these ever happen?
        if (myBlock.connections == null) {
            this.dragGroup = [blk];
            return;
        }

        // Some malformed blocks might have no connections.
        if (myBlock.connections.length === 0) {
            this.dragGroup = [blk];
            return;
        }

        this.dragGroup.push(blk);

        for (var c = 1; c < myBlock.connections.length; c++) {
            var cblk = myBlock.connections[c];
            if (cblk != null) {
                // Recurse
                this._calculateDragGroup(cblk);
            }
        }
    };

    /*
     * Set protoblock visibility on the Action palette.
     * @param - state
     * @public
     * @return {void}
     */
    this.setActionProtoVisiblity = function(state) {
        // By default, the nameddo protoblock is hidden.
        var actionsPalette = this.palettes.dict["action"];
        var stateChanged = false;
        for (
            var blockId = 0;
            blockId < actionsPalette.protoList.length;
            blockId++
        ) {
            var block = actionsPalette.protoList[blockId];
            if ("nameddo" === block.name && block.defaults.length === 0) {
                if (block.hidden === state) {
                    block.hidden = !state;
                    stateChanged = true;
                }
            }
        }

        // Force an update if the name has changed.
        if (stateChanged) {
            // this.palettes.hide();
            this.palettes.updatePalettes("action");
            // this.palettes.show();
        }
    };

    /*
     * Find a unique custom name for an Action block.
     * @param - name
     * @public
     * @return {void}
     */
    this.findUniqueActionName = function(name, actionBlk) {
        // If we have a stack named 'action', make the protoblock visible.
        if (name === _("action")) {
            this.setActionProtoVisiblity(true);
        }

        // Make sure we don't make two actions with the same name.
        var actionNames = [];
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (
                (this.blockList[blk].name === "text" ||
                    this.blockList[blk].name === "string") &&
                !this.blockList[blk].trash
            ) {
                var c = this.blockList[blk].connections[0];
                if (
                    c != null &&
                    this.blockList[c].name === "action" &&
                    !this.blockList[c].trash
                ) {
                    if (actionBlk !== c) {
                        actionNames.push(this.blockList[blk].value);
                    }
                }
            }
        }

        var i = 1;
        var value = name;
        while (actionNames.indexOf(value) !== -1) {
            value = name + i.toString();
            i += 1;
        }

        return value;
    };

    /*
     * Finds a unique custom name for custom mode block.
     * @param - name - new variable
     * @public
     * @return value
     */
    this.findUniqueCustomName = function(name) {
        var noteNames = [];
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (
                this.blockList[blk].name === "text" &&
                !this.blockList[blk].trash
            ) {
                var c = this.blockList[blk].connections[0];
                if (
                    c != null &&
                    this.blockList[c].name === "pitch" &&
                    !this.blockList[c].trash
                ) {
                    noteNames.push(this.blockList[blk].value);
                }
            }
        }
        var i = 1;
        var value = name;
        while (noteNames.indexOf(value) !== -1) {
            value = name + i.toString();
            i += 1;
        }
        return value;
    };

    /*
     * Finds a unique custom name for temperament block.
     * @param - name - new variable
     * @public
     * @return value
     */
    this.findUniqueTemperamentName = function(name) {
        var temperamentNames = [];
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (
                this.blockList[blk].name === "text" &&
                !this.blockList[blk].trash
            ) {
                var c = this.blockList[blk].connections[0];
                if (
                    c != null &&
                    this.blockList[c].name === "temperament1" &&
                    !this.blockList[c].trash
                ) {
                    temperamentNames.push(this.blockList[blk].value);
                }
            }
        }
        var i = 1;
        var value = name;
        while (temperamentNames.indexOf(value) !== -1) {
            value = name + i.toString();
            i += 1;
        }
        return value;
    };

    /*
     * Make sure we initialize any drum with a URL name.
     * @private
     * @return {void}
     */
    this._findDrumURLs = function() {
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (
                this.blockList[blk].name === "text" ||
                this.blockList[blk].name === "string"
            ) {
                var c = this.blockList[blk].connections[0];
                if (
                    c != null &&
                    ["playdrum", "setdrum", "playnoise", "setvoice"].indexOf(
                        this.blockList[c].name
                    ) !== -1
                ) {
                    if (this.blockList[blk].value.slice(0, 4) === "http") {
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            this.logo.synth.loadSynth(
                                0,
                                this.blockList[blk].value
                            );
                        }
                    }
                }
            }
        }
    };

    /*
     * Rename the block boxes.
     * @param - oldName - old name of boxes
     * @param - newName - new variable
     * @public
     * return {void}
     */
    this.renameBoxes = function(oldName, newName) {
        if (oldName === newName || oldName === _("box")) {
            return;
        }

        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].name === "text") {
                var c = this.blockList[blk].connections[0];
                if (c != null && this.blockList[c].name === "box") {
                    if (this.blockList[blk].value === oldName) {
                        this.blockList[blk].value = newName;
                        this.blockList[blk].text.text = newName;
                        try {
                            this.blockList[blk].container.updateCache();
                        } catch (e) {
                            console.debug(e);
                        }
                    }
                }
            }
        }
    };

    /*
     * Rename Storedin boxes.
     * @param - oldName - old name of boxes
     * @param - newName - new variable
     * @public
     * return {void}
     */
    this.renameStoreinBoxes = function(oldName, newName) {
        if (oldName === newName || oldName === _("box")) {
            return;
        }

        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].name === "text") {
                var c = this.blockList[blk].connections[0];
                if (c != null && this.blockList[c].name === "storein") {
                    if (this.blockList[blk].value === oldName) {
                        this.blockList[blk].value = newName;
                        this.blockList[blk].text.text = newName;
                        try {
                            this.blockList[blk].container.updateCache();
                        } catch (e) {
                            console.debug(e);
                        }
                    }
                }
            } else if (this.blockList[blk].name === "storein2") {
                if (this.blockList[blk].privateData === oldName) {
                    this.blockList[blk].privateData = newName;
                    if (newName === "box1") {
                        this.blockList[blk].overrideName = _("box1");
                    } else if (newName === "box2") {
                        this.blockList[blk].overrideName = _("box2");
                    } else {
                        this.blockList[blk].overrideName = newName;
                    }
                    this.blockList[blk].regenerateArtwork();
                    try {
                        this.blockList[blk].container.updateCache();
                    } catch (e) {
                        console.debug(e);
                    }
                }
            }
        }
    };

    /*
     * Rename Storedin2 boxes.
     * @param - oldName - old name of boxes
     * @param - newName - new variable
     * @public
     * return {void}
     */
    this.renameStorein2Boxes = function(oldName, newName) {
        if (oldName === newName || oldName === _("box")) {
            return;
        }

        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].name === "storein2") {
                if (this.blockList[blk].privateData === oldName) {
                    this.blockList[blk].privateData = newName;
                    if (newName === "box1") {
                        this.blockList[blk].overrideName = _("box1");
                    } else if (newName === "box2") {
                        this.blockList[blk].overrideName = _("box2");
                    } else {
                        this.blockList[blk].overrideName = newName;
                    }
                    this.blockList[blk].regenerateArtwork();
                    try {
                        this.blockList[blk].container.updateCache();
                    } catch (e) {
                        console.debug(e);
                    }
                }
            }
        }
    };

    /*
     * Rename Named boxes.
     * @param - oldName - old name of boxes
     * @param - newName - new variable
     * @public
     * return {void}
     */
    this.renameNamedboxes = function(oldName, newName) {
        if (oldName === newName || oldName === _("box")) {
            return;
        }

        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].name === "namedbox") {
                if (this.blockList[blk].privateData === oldName) {
                    this.blockList[blk].privateData = newName;
                    if (newName === "box1") {
                        this.blockList[blk].overrideName = _("box1");
                    } else if (newName === "box2") {
                        this.blockList[blk].overrideName = _("box2");
                    } else {
                        this.blockList[blk].overrideName = newName;
                    }
                    this.blockList[blk].regenerateArtwork();
                    // Update label...
                    try {
                        this.blockList[blk].container.updateCache();
                    } catch (e) {
                        console.debug(e);
                    }
                }
            }
        }
    };

    /*
     * Rename Do blocks.
     * @param - oldName - old name of boxes
     * @param - newName - new variable
     * @public
     * return {void}
     */
    this.renameDos = function(oldName, newName, skipBlock) {
        if (oldName === newName) {
            return;
        }

        // Update the blocks, do->oldName should be do->newName
        // Named dos are modified in a separate function below.
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (blk === skipBlock) {
                continue;
            }

            var myBlock = this.blockList[blk];
            var blkParent = this.blockList[myBlock.connections[0]];
            if (blkParent == null) {
                continue;
            }

            if (
                [
                    "do",
                    "calc",
                    "doArg",
                    "calcArg",
                    "action",
                    "offbeatdo",
                    "onbeatdo",
                    "listen"
                ].indexOf(blkParent.name) === -1
            ) {
                continue;
            }

            if (
                (blkParent.name === "onbeatdo" ||
                    blkParent.name === "listen") &&
                blkParent.connections.indexOf(blk) !== 2
            ) {
                continue;
            }

            var blockValue = myBlock.value;
            if (blockValue === oldName) {
                myBlock.value = newName;
                var label = myBlock.value;
                if (getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH) {
                    label = label.substr(0, STRINGLEN) + "...";
                }
                myBlock.text.text = label;
                myBlock.container.updateCache();
            }
        }
    };

    /*
     * Renames Named do blocks.
     * @param oldName
     * @param newName - new variable
     * @private
     * @return 'do', 'doArg', 'calc', 'calcArg
     */
    this.renameNameddos = function(oldName, newName) {
        if (oldName === newName) {
            return;
        }

        // Update the blocks, do->oldName should be do->newName
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (
                ["nameddo", "namedcalc", "nameddoArg", "namedcalcArg"].indexOf(
                    this.blockList[blk].name
                ) !== -1
            ) {
                if (this.blockList[blk].privateData === oldName) {
                    this.blockList[blk].privateData = newName;
                    var label = newName;
                    if (getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH) {
                        label = label.substr(0, STRINGLEN) + "...";
                    }

                    this.blockList[blk].overrideName = label;
                    // console.debug('regenerating artwork for ' + this.blockList[blk].name + ' block[' + blk + ']: ' + oldName + ' -> ' + label);
                    this.blockList[blk].regenerateArtwork();
                }
            }
        }

        // Update the palette
        var actionsPalette = this.palettes.dict["action"];
        var nameChanged = false;
        for (
            var blockId = 0;
            blockId < actionsPalette.protoList.length;
            blockId++
        ) {
            var block = actionsPalette.protoList[blockId];
            if (
                ["nameddo", "namedcalc", "nameddoArg", "namedcalcArg"].indexOf(
                    block.name
                ) !== -1 /* && block.defaults[0] !== _('action') */ &&
                block.defaults[0] === oldName
            ) {
                // console.debug('renaming ' + block.name + ': ' + block.defaults[0] + ' to ' + newName);
                block.defaults[0] = newName;
                nameChanged = true;
            }
        }

        // Force an update if the name has changed.
        if (nameChanged) {
            // this.palettes.hide();
            this.palettes.updatePalettes("action");
            // this.palettes.show();
        }
    };

    /*
     * Make a new Storein block.
     * @param - name - new variable
     * @public
     * @return {void}
     */
    this.newStoreinBlock = function(name) {
        if (name == null) {
            console.debug("null name passed to newStoreinBlock");
            return;
        } else if (name == undefined) {
            console.debug("undefined name passed to newStoreinBlock");
            return;
        } else if ("myStorein_" + name in this.protoBlockDict) {
            // console.debug(name + ' already in palette');
            return;
        }

        // console.debug('new storein block ' + name);
        var myStoreinBlock = new ProtoBlock("storein");
        this.protoBlockDict["myStorein_" + name] = myStoreinBlock;
        myStoreinBlock.palette = this.palettes.dict["boxes"];
        myStoreinBlock.defaults.push(name);
        myStoreinBlock.defaults.push(NUMBERBLOCKDEFAULT);
        myStoreinBlock.staticLabels.push(_("store in"), _("name"), _("value"));
        myStoreinBlock.adjustWidthToLabel();
        myStoreinBlock.twoArgBlock();
        myStoreinBlock.dockTypes[1] = "anyin";
        myStoreinBlock.dockTypes[2] = "anyin";

        if (name !== "box") {
            // Add the new block to the top of the palette.
            this.palettes.dict["boxes"].add(myStoreinBlock, true);
        }
    };

    /*
     * Make a new Storein2 block.
     * @param - name - new variable
     * @public
     * return {void}
     */
    this.newStorein2Block = function(name) {
        if (name == null) {
            console.debug("null name passed to newStorein2Block");
            return;
        } else if (name == undefined) {
            console.debug("undefined name passed to newStorein2Block");
            return;
        } else if ("yourStorein2_" + name in this.protoBlockDict) {
            return;
        }

        var myStorein2Block = new ProtoBlock("storein2");
        this.protoBlockDict["yourStorein2_" + name] = myStorein2Block;
        myStorein2Block.palette = this.palettes.dict["boxes"];
        myStorein2Block.defaults.push(name);
        myStorein2Block.staticLabels.push(name);
        myStorein2Block.adjustWidthToLabel();
        myStorein2Block.oneArgBlock();
        myStorein2Block.dockTypes[1] = "anyin";

        if (name !== "box") {
            // Add the new block to the top of the palette.
            this.palettes.dict["boxes"].add(myStorein2Block, true);
        }
    };

    /*
     * Make a new Named Box block.
     * @param - name - new variable
     * @public
     * return {void}
     */
    this.newNamedboxBlock = function(name) {
        if (name == null) {
            console.debug("null name passed to newNamedboxBlock");
            return;
        } else if (name == undefined) {
            console.debug("undefined name passed to newNamedboxBlock");
            return;
        } else if ("myBox_" + name in this.protoBlockDict) {
            return;
        }

        var myBoxBlock = new ProtoBlock("namedbox");
        this.protoBlockDict["myBox_" + name] = myBoxBlock;
        myBoxBlock.palette = this.palettes.dict["boxes"];
        myBoxBlock.defaults.push(name);
        myBoxBlock.staticLabels.push(name);
        myBoxBlock.parameterBlock();
        if (name === "box") {
            return;
        }

        // Add the new block to the top of the palette.
        myBoxBlock.palette.add(myBoxBlock, true);
    };

    /*
     * Make a new Local Arg block.
     * @param - blk - block
     * @private
     * @return {void}
     */
    this._newLocalArgBlock = async function(name) {
        // name === 1, 2, 3, ...
        var blkname = "arg_" + name;
        if ("myArg_" + name in this.protoBlockDict) {
            return;
        }

        if (blkname in this.protoBlockDict) {
            return;
        }

        var myNamedArgBlock = new ProtoBlock("namedarg");
        this.protoBlockDict["myArg_" + blkname] = myNamedArgBlock;
        myNamedArgBlock.palette = this.palettes.dict["action"];
        myNamedArgBlock.defaults.push(name);
        myNamedArgBlock.staticLabels.push("arg " + name);
        myNamedArgBlock.parameterBlock();

        if (blkname === "arg_1") {
            return;
        }

        myNamedArgBlock.palette.add(myNamedArgBlock, true);

        // Force regeneration of palette after adding new block.
        // Add delay to avoid race condition.
        var that = this;
        await delayExecution(100);
        // that.palettes.hide();
        that.palettes.updatePalettes("action");
        // that.palettes.show();
        // 500
    };

    /*
     * Remove any unneeded Named Do blocks.
     * @param - name
     * @private
     * @return {void}
     */
    this._removeNamedoEntries = function(name) {
        // Delete any old palette entries.
        // console.debug('DELETE: removing old palette entries for ' + name);
        if (this.protoBlockDict["myDo_" + name]) {
            // console.debug('deleting myDo_' + name + ' ' + this.protoBlockDict['myDo_' + name].name);
            this.protoBlockDict["myDo_" + name].hide = true;
            delete this.protoBlockDict["myDo_" + name];
        } else if (this.protoBlockDict["myCalc_" + name]) {
            // console.debug('deleting myCalc_' + name + ' ' + this.protoBlockDict['myCalc_' + name].name);
            this.protoBlockDict["myCalc_" + name].hide = true;
            delete this.protoBlockDict["myCalc_" + name];
        } else if (this.protoBlockDict["myDoArg_" + name]) {
            // console.debug('deleting myDoArg_' + name + ' ' + this.protoBlockDict['myDoArg_' + name].name);
            this.protoBlockDict["myDoArg_" + name].hide = true;
            delete this.protoBlockDict["myDoArg_" + name];
        } else if (this.protoBlockDict["myCalcArg_" + name]) {
            // console.debug('deleting myCalcArg_' + name + ' ' + this.protoBlockDict['myCalcArg_' + name].name);
            this.protoBlockDict["myCalcArg_" + name].hide = true;
            delete this.protoBlockDict["myCalcArg_" + name];
        }
    };

    /*
     * Depending upon the form of the associated action block, we
       want to add a named do, a named calc, a named do w/args, or
       a named calc w/args.
     * @param - name
     * @param - hasReturn
     * @param - hasArgs
     * @public
     * @return boolean
     */
    this.newNameddoBlock = function(name, hasReturn, hasArgs) {
        if (name === _("action")) {
            // 'action' already has its associated palette entries.
            return false;
        }

        if (hasReturn && hasArgs) {
            return this.newNamedcalcArgBlock(name);
        } else if (!hasReturn && hasArgs) {
            return this.newNameddoArgBlock(name);
        } else if (hasReturn && !hasArgs) {
            return this.newNamedcalcBlock(name);
        } else if (this.protoBlockDict["myDo_" + name] === undefined) {
            var myDoBlock = new ProtoBlock("nameddo");
            this.protoBlockDict["myDo_" + name] = myDoBlock;
            myDoBlock.palette = this.palettes.dict["action"];
            myDoBlock.defaults.push(name);
            myDoBlock.staticLabels.push(name);
            myDoBlock.zeroArgBlock();
            myDoBlock.palette.add(myDoBlock, true);
            this.palettes.updatePalettes();
            return true;
        }

        return false;
    };

    /*
     * Make a new Named Calc block.
     * @param - name -new variable
     * @public
     * @return boolean
     */
    this.newNamedcalcBlock = function(name) {
        if (this.protoBlockDict["myCalc_" + name] === undefined) {
            var myCalcBlock = new ProtoBlock("namedcalc");
            this.protoBlockDict["myCalc_" + name] = myCalcBlock;
            myCalcBlock.palette = this.palettes.dict["action"];
            myCalcBlock.defaults.push(name);
            myCalcBlock.staticLabels.push(name);
            myCalcBlock.zeroArgBlock();
            // Add the new block to the top of the palette.
            myCalcBlock.palette.add(myCalcBlock, true);
            return true;
        }

        return false;
    };

    /*
     * Make a new Named Do Arg block.
     * @param - name - new variable
     * @public
     * return boolean
     */
    this.newNameddoArgBlock = function(name) {
        if (this.protoBlockDict["myDoArg_" + name] === undefined) {
            var myDoArgBlock = new ProtoBlock("nameddoArg");
            this.protoBlockDict["myDoArg_" + name] = myDoArgBlock;
            myDoArgBlock.palette = this.palettes.dict["action"];
            myDoArgBlock.defaults.push(name);
            myDoArgBlock.staticLabels.push(name);
            myDoArgBlock.zeroArgBlock();
            // Add the new block to the top of the palette.
            myDoArgBlock.palette.add(myDoArgBlock, true);
            return true;
        }

        return false;
    };

    /*
     * Make a new Named Calc Arg block.
     * @param - name - new variable
     * @public
     * return boolean
     */
    this.newNamedcalcArgBlock = function(name) {
        if (this.protoBlockDict["myCalcArg_" + name] === undefined) {
            var myCalcArgBlock = new ProtoBlock("namedcalcArg");
            this.protoBlockDict["myCalcArg_" + name] = myCalcArgBlock;
            myCalcArgBlock.palette = this.palettes.dict["action"];
            myCalcArgBlock.defaults.push(name);
            myCalcArgBlock.staticLabels.push(name);
            myCalcArgBlock.zeroArgBlock();
            // Add the new block to the top of the palette.
            myCalcArgBlock.palette.add(myCalcArgBlock, true);
            return true;
        }

        return false;
    };

    this._insideArgClamp = function(blk) {
        // Returns a containing arg clamp block or null
        if (this.blockList[blk] == null) {
            // race condition?
            console.debug("null block in blockList? " + blk);
            return null;
        } else if (this.blockList[blk].connections[0] == null) {
            return null;
        } else {
            var cblk = this.blockList[blk].connections[0];
            if (this.blockList[cblk].isArgClamp()) {
                return cblk;
            } else {
                return null;
            }
        }
    };

    /*
     * Return a list of containing clamp blocks or []
     * @param - blk - block
     * @param - clampList
     * @public
     * @return list of clamp blocks
     */
    this.findNestedClampBlocks = function(blk, clampList) {
        if (this.blockList[blk] == null) {
            console.debug("null block in blockList? " + blk);
            return [];
        } else if (this.blockList[blk].connections[0] == null) {
            // We reached the end, so return the list.
            return clampList;
        } else {
            // If we find a clamp block, add it to the list.
            var cblk = this.blockList[blk].connections[0];
            if (this.blockList[cblk].isClampBlock()) {
                if (this.blockList[cblk].isDoubleClampBlock()) {
                    // Just check them both.
                    clampList.push([cblk, 0]);
                    clampList.push([cblk, 1]);
                } else {
                    clampList.push([cblk, 0]);
                }
            }

            // Keep looking.
            return this.findNestedClampBlocks(cblk, clampList);
        }
    };

    /*
     * Return a containing expandable block or null.
     * @param - blk - block
     * @public
     * @return expandable block
     */
    this.insideExpandableBlock = function(blk) {
        if (this.blockList[blk] == null) {
            // race condition?
            console.debug("null block in blockList? " + blk);
            return null;
        } else if (this.blockList[blk].connections[0] == null) {
            return null;
        } else {
            var cblk = this.blockList[blk].connections[0];
            if (this.blockList[cblk].isExpandableBlock()) {
                // If it is the last connection, keep searching.
                if (this.blockList[cblk].isArgFlowClampBlock() || this.blockList[cblk].isLeftClampBlock()) {
                    return cblk;
                } else if (blk === last(this.blockList[cblk].connections)) {
                    return this.insideExpandableBlock(cblk);
                } else {
                    return cblk;
                }
            } else {
                return this.insideExpandableBlock(cblk);
            }
        }
    };

    /*
     * Return a note block or null.
     * @param - blk - block
     * @public
     * @return note block
     */
    this._insideNoteBlock = function(blk) {
        if (this.blockList[blk] == null) {
            console.debug("null block in blockList? " + blk);
            return null;
        } else if (this.blockList[blk].connections[0] == null) {
            return null;
        } else {
            var cblk = this.blockList[blk].connections[0];
            if (this.blockList[cblk].isExpandableBlock()) {
                // If it is the last connection, keep searching.
                if (blk === last(this.blockList[cblk].connections)) {
                    return this._insideNoteBlock(cblk);
                } else if (blk === this.blockList[cblk].connections[1]) {
                    // Connection 1 of a note block is not inside the clamp.
                    return null;
                } else {
                    if (NOTEBLOCKS.indexOf(this.blockList[cblk].name) !== -1) {
                        return cblk;
                    } else {
                        return null;
                    }
                }
            } else {
                return this._insideNoteBlock(cblk);
            }
        }
    };

    /*
     * Find an instance of a block type by name.
     * @param - blkName
     * @public
     * @return boolean
     */
    this.findBlockInstance = function(blkName) {
        // Returns true if block of name blkName is loaded.
        for (blk = 0; blk < this.blockList.length; blk++) {
            if (
                this.blockList[blk].name === blkName &&
                !this.blockList[blk].trash
            ) {
                return true;
            }
        }

        return false;
    };

    /*
     * Return the first containing Note block, if any.
     * @param - blk - block
     * @public
     * @return null or collapsible block
     */
    this.insideInlineCollapsibleBlock = function(blk) {
        if (blk === null) {
            return null;
        }

        c0 = this.blockList[blk].connections[0];
        if (c0 === null) {
            return null;
        }

        // If we are connected to a note block arg or child flow,
        // return the note block. If we are connected to the flow, we
        // are not inside, so keep looking.
        if (
            this.blockList[c0].isInlineCollapsible() &&
            blk !== last(this.blockList[c0].connections)
        ) {
            return c0;
        }

        return this.insideInlineCollapsibleBlock(c0);
    };

    /*
     * Return first Note block found.
     * @param - blk - block
     * @public
     * @return note block
     */
    this.findNoteBlock = function(blk) {
        if (blk === null) {
            return null;
        }

        if (this.blockList[blk].name === "newnote") {
            return blk;
        }

        if (this.blockList[blk].isClampBlock()) {
            var n = this.blockList[blk].connections.length - 2;
            var c = this.blockList[blk].connections[n];
        } else {
            var c = last(this.blockList[blk].connections);
        }

        return this.findNoteBlock(c);
    };

    /*
     * Return first Interval block found.
     * @param - blk - block
     * @public
     * @return null or blk
     */
    this.findNestedIntervalBlock = function(blk) {
        if (blk === null) {
            return null;
        }

        if (this.blockList[blk].name === "interval") {
            return blk;
        }

        if (this.blockList[blk].isClampBlock()) {
            var n = this.blockList[blk].connections.length - 2;
            var c = this.blockList[blk].connections[n];
        } else {
            var c = last(this.blockList[blk].connections);
        }

        return this.findNestedIntervalBlock(c);
    };

    /*
     * Returns first Pitch block found.
     * @param - blk - block
     * @public
     * @return null or blk
     */
    this.findFirstPitchBlock = function(blk) {
        if (blk === null) {
            return null;
        }

        if (PITCHBLOCKS.indexOf(this.blockList[blk].name) !== -1) {
            return blk;
        } else if (this.blockList[blk].name === "rest2") {
            return blk;
        }

        var c = last(this.blockList[blk].connections);
        return this.findFirstPitchBlock(c);
    };

    /*
     * Return octave associated with Pitch block.
     * @param - blk - block
     * @public
     * @return 4
     */
    this.findPitchOctave = function(blk) {
        if (blk === null) {
            return 4;
        }

        if (
            [
                "pitch",
                "setpitchnumberoffset",
                "invert1",
                "tofrequency",
                "nthmodalpitch"
            ].indexOf(this.blockList[blk].name) !== -1
        ) {
            var oblk = this.blockList[blk].connections[2];
            if (oblk === null) {
                return 4;
            } else if (this.blockList[oblk].name === "number") {
                return this.blockList[oblk].value;
            } else {
                return 4;
            }
        } else {
            return 4;
        }
    };

    /*
     * Set octave associated with Pitch block.
     * @param - blk - block
     * @param - octave
     * @public
     * @return {void}
     */
    this.setPitchOctave = function(blk, octave) {
        if (blk === null) {
            return;
        }

        if (
            [
                "pitch",
                "setpitchnumberoffset",
                "invert1",
                "tofrequency",
                "nthmodalpitch"
            ].indexOf(this.blockList[blk].name) !== -1
        ) {
            var oblk = this.blockList[blk].connections[2];
            if (oblk !== null && this.blockList[oblk].name === "number") {
                var thisBlock = this.blockList[oblk];
                thisBlock.value = octave;
                thisBlock.text.text = octave.toString();

                // Make sure text is on top.
                var z = thisBlock.container.children.length - 1;
                thisBlock.container.setChildIndex(thisBlock.text, z);
                thisBlock.container.updateCache();
            }
        }
    };

    /*
     * Check if a Number block used as a modifier in an Interval block.
     * @param - blk - block
     * @public
     * @return boolean
     */
    this.intervalModifierNumber = function(blk) {
        if (blk === null) {
            return false;
        }

        var myBlock = this.blockList[blk];
        var pblk = myBlock.connections[0];
        // Are we connected to a plus block?
        if (
            myBlock.name === "number" &&
            pblk !== null &&
            this.blockList[pblk].name === "plus"
        ) {
            // Is the plus block connected to an interval block?
            var c = this.blockList[pblk].connections[0];
            if (c === null) {
                return false;
            }

            if (
                [
                    "interval",
                    "setscalartransposition",
                    "semitoneinterval",
                    "settransposition"
                ].indexOf(this.blockList[c].name) === -1
            ) {
                return false;
            }

            return true;
        }

        return false;
    };

    /*
     * Check if a Number block is being used as multipicant with a
       Mode-length block.
     * @param - blk - block
     * @public
     * @return boolean
     */
    this.octaveModifierNumber = function(blk) {
        if (blk === null) {
            return false;
        }

        var myBlock = this.blockList[blk];
        var mblk = myBlock.connections[0];
        // Are we connected to a multiply block?
        if (
            myBlock.name === "number" &&
            mblk !== null &&
            this.blockList[mblk].name === "multiply"
        ) {
            if (this.blockList[mblk].connections[1] === blk) {
                var cblk = this.blockList[mblk].connections[2];
            } else {
                var cblk = this.blockList[mblk].connections[1];
            }

            if (this.blockList[cblk].name === "modelength") {
                return true;
            }

            // Special case: 1 / 12
            if (
                this.blockList[cblk].name === "number" &&
                this.blockList[cblk].value === 12
            ) {
                return true;
            }
        }

        return false;
    };

    /*
     * Check if a Number block is used as a note value denominator argument.
     * @param - blk - block
     * @public
     * @return boolean
     */
    this.noteValueNumber = function(blk, c) {
        if (blk === null) {
            return false;
        }

        var myBlock = this.blockList[blk];
        var dblk = myBlock.connections[0];
        // Are we connected to a divide block?
        if (
            myBlock.name === "number" &&
            dblk !== null &&
            this.blockList[dblk].name === "divide"
        ) {
            // Are we the denominator (c == 2) or numerator (c == 1)?
            if (
                this.blockList[dblk].connections[c] ===
                this.blockList.indexOf(myBlock)
            ) {
                // Is the divide block connected to a note value block?
                cblk = this.blockList[dblk].connections[0];
                if (cblk !== null) {
                    // Is it the first or second arg?
                    switch (this.blockList[cblk].name) {
                        case "newnote":
                        case "pickup":
                        case "tuplet4":
                        case "newstaccato":
                        case "newslur":
                        case "elapsednotes2":
                            if (this.blockList[cblk].connections[1] === dblk) {
                                return true;
                            } else {
                                return false;
                            }
                            break;
                        case "meter":
                            this.blockList[blk]._check_meter_block = cblk;
                        case "setbpm3":
                        case "setbpm2":
                        case "setmasterbpm2":
                        case "stuplet":
                        case "rhythm2":
                        case "newswing2":
                        case "vibrato":
                        case "neighbor":
                        case "neighbor2":
                            if (this.blockList[cblk].connections[2] === dblk) {
                                return true;
                            } else {
                                return false;
                            }
                            break;
                        default:
                            return false;
                            break;
                    }
                }
            }
        }

        return false;
    };

    /*
     * Return the Number block value being used as a note value
       denominator argument.
     * @param - blk - block
     * @public
     * @return 1
     */
    this.noteValueValue = function(blk) {
        if (blk === null) {
            return 1;
        }

        var myBlock = this.blockList[blk];
        var dblk = myBlock.connections[0];
        // We are connected to a divide block.
        // Is the divide block connected to a note value block?
        cblk = this.blockList[dblk].connections[0];
        if (cblk !== null) {
            // Is it the first or second arg?
            switch (this.blockList[cblk].name) {
                case "newnote":
                case "pickup":
                case "tuplet4":
                case "newstaccato":
                case "newslur":
                case "elapsednotes2":
                    if (this.blockList[cblk].connections[1] === dblk) {
                        cblk = this.blockList[dblk].connections[2];
                        return this.blockList[cblk].value;
                    } else {
                        return 1;
                    }
                    break;
                case "meter":
                    this.blockList[blk]._check_meter_block = cblk;
                case "setbpm3":
                case "setbpm2":
                case "setmasterbpm2":
                case "stuplet":
                case "rhythm2":
                case "newswing2":
                case "vibrato":
                case "neighbor":
                case "neighbor2":
                    if (this.blockList[cblk].connections[2] === dblk) {
                        if (this.blockList[cblk].connections[1] === dblk) {
                            cblk = this.blockList[dblk].connections[2];
                            return this.blockList[cblk].value;
                        } else {
                            return 1;
                        }
                    } else {
                        return 1;
                    }
                    break;
                default:
                    return 1;
                    break;
            }
        }

        return 1;
    };

    /*
     * Check if a Number block being used as an octave argument?
     * @param - blk - block
     * @public
     * @return boolean
     */
    this.octaveNumber = function(blk) {
        if (blk === null) {
            return false;
        }

        var myBlock = this.blockList[blk];
        return (
            myBlock.name === "number" &&
            myBlock.connections[0] !== null &&
            [
                "pitch",
                "setpitchnumberoffset",
                "invert1",
                "tofrequency",
                "nthmodalpitch"
            ].indexOf(this.blockList[myBlock.connections[0]].name) !== -1 &&
            this.blockList[myBlock.connections[0]].connections[2] === blk
        );
    };

    this.meter_block_changed = function(blk) {
        // If the meter block note value changed, update the BPM block.
        if (blk === null || this.blockList[blk].name !== "meter") {
            return;
        }

        console.debug("METER BLOCK CHANGED");

        // Get the numerator and demoninator of the meter divide block
        var dblk = this.blockList[blk].connections[2];
        if (dblk === null || this.blockList[dblk].name !== "divide") {
            return;
        }

        var c1 = this.blockList[dblk].connections[1];
        if (c1 === null || this.blockList[c1].name !== "number") {
            return;
        }

        var c1v = this.blockList[c1].value;

        var c2 = this.blockList[dblk].connections[2];
        if (c2 === null || this.blockList[c2].name !== "number") {
            return;
        }

        var c2v = this.blockList[c2].value;

        for (var i = 0; i < this.blockList.length; i++) {
            if (
                ["setbpm3", "setmasterbpm2"].indexOf(this.blockList[i].name) !==
                -1
            ) {
                var bn = this.blockList[i].connections[1];
                if (bn === null || this.blockList[bn].name !== "number") {
                    continue;
                }

                var bnv = this.blockList[bn].value;

                var dblk = this.blockList[i].connections[2];
                if (dblk === null || this.blockList[dblk].name !== "divide") {
                    continue;
                }

                var b1 = this.blockList[dblk].connections[1];
                if (b1 === null || this.blockList[b1].name !== "number") {
                    continue;
                }

                var b1v = this.blockList[b1].value;

                var b2 = this.blockList[dblk].connections[2];
                if (b2 === null || this.blockList[b2].name !== "number") {
                    continue;
                }

                var b2v = this.blockList[b2].value;
                bnv *= ((b1v * c2v) / b2v) * c1v;

                this.blockList[bn].value = bnv;
                this.updateBlockText(bn);
                this.blockList[b1].value = c1v;
                this.updateBlockText(b1);
                this.blockList[b2].value = c2v;
                this.updateBlockText(b2);
            }
        }
    };

    /*
     *  Auto-select stack for copying -- no need to actually click on
        the copy button.
     * @public
     * @return {void}
     */
    this.prepareStackForCopy = function() {
        if (this.activeBlock == null) {
            this.errorMsg(_("There is no block selected."));
            console.debug("No active block to copy.");
            return;
        }

        var topBlock = this.findTopBlock(this.activeBlock);
        this.selectedStack = topBlock;

        // Copy the selectedStack.
        this.selectedBlocksObj = JSON.parse(
            JSON.stringify(this._copyBlocksToObj())
        );
        // console.debug(this.selectedBlocksObj);

        // Reset paste offset.
        this.pasteDx = 0;
        this.pasteDy = 0;
    };

    /*
     * Triggers the long press of keys and clears timeout.
     * @public
     * @return {void}
     */
    this.triggerLongPress = function() {
        if (this.longPressTimeout != null) {
            clearTimeout(this.longPressTimeout);
            this.longPressTimeout = null;
        }

        this.inLongPress = true;
        this.blockList[this.activeBlock].piemenuBlockContext();
    };

    /*
     * Copy a stack of blocks by creating a blockObjs and pasting.
     * @public
     * @return {void}
     */
    this.pasteStack = function() {
        if (this.selectedStack == null) {
            return;
        }

        // First, hide the palettes as they will need updating.
        for (var name in this.palettes.dict) {
            this.palettes.dict[name].hideMenu(true);
        }

        // Reposition the paste location relative to the stage position.
        console.debug(this.selectedBlocksObj);
        if (this.selectedBlocksObj != null) {
            this.selectedBlocksObj[0][2] = 175 - this.stage.x + this.pasteDx;
            this.selectedBlocksObj[0][3] = 75 - this.stage.y + this.pasteDy;
            this.pasteDx += 21;
            this.pasteDy += 21;
            this.loadNewBlocks(this.selectedBlocksObj);
        }
    };

    /*
     * Save a stack of blocks to local storage and the 'myblocks'
       palette by creating a blockObjs.
     * @public
     * @return {void}
     */
    this.saveStack = function() {
        console.debug(this.selectedStack);
        if (this.selectedStack == null) {
            return;
        }

        // this.palettes.hide();

        var blockObjs = this._copyBlocksToObj();
        // The first block is an action block. Its first connection is
        // the block containing its label.
        var nameBlk = blockObjs[0][4][1];

        if (nameBlk == null) {
            console.debug("action not named... skipping");
        } else {
            console.debug(blockObjs[nameBlk][1][1]);
            if (typeof blockObjs[nameBlk][1][1] === "string") {
                var name = blockObjs[nameBlk][1][1];
            } else if (typeof blockObjs[nameBlk][1][1] === "number") {
                var name = blockObjs[nameBlk][1][1].toString();
            } else {
                var name = blockObjs[nameBlk][1][1]["value"];
            }
            storage.macros = prepareMacroExports(
                name,
                blockObjs,
                this.macroDict
            );
            if (sugarizerCompatibility.isInsideSugarizer()) {
                sugarizerCompatibility.saveLocally(function() {
                    this.addToMyPalette(name, blockObjs);
                    // this.palettes.updatePalettes('myblocks');
                });
            } else {
                this.addToMyPalette(name, blockObjs);
                this.palettes.updatePalettes("myblocks");
            }
        }
    };

    /*
     * Copies the Block to objects.
     * @public
     * @return blockObj
     */
    this._copyBlocksToObj = function() {
        var blockObjs = [];
        var blockMap = {};

        this.findDragGroup(this.selectedStack);
        for (var b = 0; b < this.dragGroup.length; b++) {
            myBlock = this.blockList[this.dragGroup[b]];
            if (b === 0) {
                x = 75 - this.stage.x;
                y = 75 - this.stage.y;
            } else {
                x = 0;
                y = 0;
            }

            console.log(myBlock.name + " " + myBlock.isValueBlock());
            if (myBlock.isValueBlock()) {
                switch (myBlock.name) {
                    case "media":
                        blockItem = [b, [myBlock.name, null], x, y, []];
                        break;
                    case "namedbox":
                    case "namedarg":
                        blockItem = [
                            b,
                            [myBlock.name, { value: myBlock.privateData }],
                            x,
                            y,
                            []
                        ];
                        break;
                    default:
                        blockItem = [
                            b,
                            [myBlock.name, { value: myBlock.value }],
                            x,
                            y,
                            []
                        ];
                        break;
                }
            } else if (
                [
                    "storein2",
                    "nameddo",
                    "namedcalc",
                    "nameddoArg",
                    "namedcalcArg"
                ].indexOf(myBlock.name) !== -1
            ) {
                blockItem = [
                    b,
                    [myBlock.name, { value: myBlock.privateData }],
                    x,
                    y,
                    []
                ];
            } else {
                blockItem = [b, myBlock.name, x, y, []];
            }

            blockMap[this.dragGroup[b]] = b;
            blockObjs.push(blockItem);
        }

        for (var b = 0; b < this.dragGroup.length; b++) {
            myBlock = this.blockList[this.dragGroup[b]];
            for (var c = 0; c < myBlock.connections.length; c++) {
                if (myBlock.connections[c] == null) {
                    blockObjs[b][4].push(null);
                } else {
                    blockObjs[b][4].push(blockMap[myBlock.connections[c]]);
                }
            }
        }

        return blockObjs;
    };

    /*
     * On the palette we store the macro as a basic block.
     * @param - name
     * @param - obj - object
     * @public
     * @return {void}
     */
    this.addToMyPalette = function(name, obj) {
        var myBlock = new ProtoBlock("macro_" + name);
        var blkName = "macro_" + name;
        this.protoBlockDict[blkName] = myBlock;
        console.debug("Adding " + name + " to myblocks palette");
        if (!("myblocks" in this.palettes.dict)) {
            this.palettes.add("myblocks");
        }

        myBlock.palette = this.palettes.dict["myblocks"];
        myBlock.zeroArgBlock();
        myBlock.staticLabels.push(_(name));
        this.protoBlockDict[blkName].palette.add(this.protoBlockDict[blkName]);
    };

    /*
     * Returns true if block of name blkName is loaded.
     * @param - blkName - block name
     * @public
     * @return boolean
     */
    this.findBlockInstance = function(blkName) {
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (
                this.blockList[blk].name === blkName &&
                !this.blockList[blk].trash
            ) {
                return true;
            }
        }
        return false;
    };

    /*
     * Load new blocks.
     * @param - blockObj - Block Objects
     * @public
     * return {void}
     */
    this.loadNewBlocks = function(blockObjs) {
        // Playback Queue has been deprecated, but some old projects
        // may still have playback blocks appended, which we will
        // remove.
        let playbackQueueStartsHere = null;
        for (var b = 0; b < blockObjs.length; b++) {
            var blkData = blockObjs[b];
            // Check for deprecated playbackQueue
            if (typeof(blkData[1]) === 'number') {
                playbackQueueStartsHere = b;
                break;
            }
        }

        if (playbackQueueStartsHere !== null) {
            console.debug("Removing deprecated playback queue from project");
            blockObjs.splice(playbackQueueStartsHere, blockObjs.length - playbackQueueStartsHere);
        }

        // Check for blocks connected to themselves,
        // and for action blocks not connected to text blocks.
        for (var b = 0; b < blockObjs.length; b++) {
            var blkData = blockObjs[b];

            for (var c in blkData[4]) {
                if (blkData[4][c] === blkData[0]) {
                    console.debug(
                        "Circular connection in block data: " + blkData
                    );
                    console.debug("Punting loading of new blocks!");
                    console.debug(blockObjs);
                    return;
                }
            }
        }

        // We'll need a list of existing storein and action names.
        var currentActionNames = [];
        var currentStoreinNames = [];
        for (var b = 0; b < this.blockList.length; b++) {
            if (this.blockList[b].trash) {
                continue;
            }

            if (this.blockList[b].name === "action") {
                if (this.blockList[b].connections[1] != null) {
                    // console.debug(this.blockList[this.blockList[b].connections[1]].value);
                    currentActionNames.push(
                        this.blockList[this.blockList[b].connections[1]].value
                    );
                }
            } else if (this.blockList[b].name === "storein") {
                if (this.blockList[b].connections[1] != null) {
                    console.debug(
                        "found storein name: " +
                            this.blockList[this.blockList[b].connections[1]]
                                .value
                    );
                    currentStoreinNames.push(
                        this.blockList[this.blockList[b].connections[1]].value
                    );
                }
            }
        }

        // We need to track two-arg blocks in case they need expanding.
        this._checkTwoArgBlocks = [];

        // And arg clamp blocks in case they need expanding.
        this._checkArgClampBlocks = [];

        // Don't make duplicate action names.
        // Add a palette entry for any new storein blocks.
        var stringNames = [];
        var stringValues = {}; // label: [blocks with that label]
        var actionNames = {}; // action block: label block
        var storeinNames = {}; // storein block: label block
        var doNames = {}; // do block: label block, nameddo block value

        // widget, note, action, and start blocks that need to be collapsed.
        this.blocksToCollapse = [];

        // Scan for any new action and storein blocks to identify
        // duplicates. We also need to track start and action blocks
        // that may need to be collapsed.
        for (var b = 0; b < blockObjs.length; b++) {
            var blkData = blockObjs[b];
            // blkData[1] could be a string or an object.
            if (typeof blkData[1] === "string") {
                var name = blkData[1];
            } else {
                var name = blkData[1][0];
            }

            if (!(name in this.protoBlockDict)) {
                switch (name) {
                    case "hat":
                        name = "action";
                        break;
                    case "string":
                        name = "text";
                        break;
                    default:
                        console.debug("skipping " + name);
                        continue;
                        break;
                }
            }

            if (
                ["arg", "twoarg"].indexOf(this.protoBlockDict[name].style) !==
                -1
            ) {
                if (this.protoBlockDict[name].expandable) {
                    this._checkTwoArgBlocks.push(this.blockList.length + b);
                }
            }

            if (
                [
                    "clamp",
                    "argclamp",
                    "argclamparg",
                    "doubleclamp",
                    "argflowclamp"
                ].indexOf(this.protoBlockDict[name].style) !== -1
            ) {
                this._checkArgClampBlocks.push(this.blockList.length + b);
            }

            switch (name) {
                case "text":
                    var key = blkData[1][1];
                    if (stringValues[key] === undefined) {
                        stringValues[key] = [];
                    }
                    stringValues[key].push(b);
                    break;
                case "action":
                case "hat":
                    if (blkData[4][1] != null) {
                        actionNames[b] = blkData[4][1];
                    }
                    break;
                case "storein":
                    if (blkData[4][1] != null) {
                        storeinNames[b] = blkData[4][1];
                    }
                    break;
                case "nameddo":
                case "namedcalc":
                case "nameddoArg":
                case "namedcalcArg":
                    doNames[b] = blkData[1][1]["value"];
                    break;
                case "do":
                case "stack":
                    if (blkData[4][1] != null) {
                        doNames[b] = blkData[4][1];
                    }
                    break;
                default:
                    break;
            }

            if (COLLAPSIBLES.indexOf(name) !== -1) {
                if (
                    typeof blkData[1] === "object" &&
                    blkData[1].length > 1 &&
                    typeof blkData[1][1] === "object" &&
                    "collapsed" in blkData[1][1]
                ) {
                    if (blkData[1][1]["collapsed"]) {
                        this.blocksToCollapse.push(this.blockList.length + b);
                    }
                }
            }
        }

        var updatePalettes = false;
        // Make sure new storein names have palette entries.
        for (var b in storeinNames) {
            var blkData = blockObjs[storeinNames[b]];
            if (currentStoreinNames.indexOf(blkData[1][1]) === -1) {
                if (typeof blkData[1][1] === "string") {
                    var name = blkData[1][1];
                } else {
                    var name = blkData[1][1]["value"];
                }

                this.newStoreinBlock(name);
                this.newStorein2Block(name);
                this.newNamedboxBlock(name);
                updatePalettes = true;
            }
        }

        // Make sure action names are unique.
        for (var b in actionNames) {
            // Is there a proto do block with this name? If so, find a
            // new name.
            // Name = the value of the connected label.
            var blkData = blockObjs[actionNames[b]];
            if (typeof blkData[1][1] === "string") {
                var name = blkData[1][1];
            } else {
                var name = blkData[1][1]["value"];
            }

            // If we have a stack named 'action', make the protoblock visible.
            if (name === _("action")) {
                this.setActionProtoVisiblity(true);
            }

            var oldName = name;
            var i = 1;
            while (currentActionNames.indexOf(name) !== -1) {
                name = oldName + i.toString();
                i += 1;
                // Should never happen... but just in case.
                if (i > this.blockList.length) {
                    console.debug("Could not generate unique action name.");
                    break;
                }
            }

            // Add this name to the list so we don't repeat it.
            currentActionNames.push(name);

            if (oldName !== name) {
                // Change the name of the action...
                console.debug(
                    "action " + oldName + " is being renamed " + name
                );
                blkData[1][1] = { value: name };
            }

            // and any do blocks
            for (var d in doNames) {
                var thisBlkData = blockObjs[d];
                if (typeof thisBlkData[1] === "string") {
                    var blkName = thisBlkData[1];
                } else {
                    var blkName = thisBlkData[1][0];
                }
                if (
                    [
                        "nameddo",
                        "namedcalc",
                        "nameddoArg",
                        "namedcalcArg"
                    ].indexOf(blkName) !== -1
                ) {
                    if (thisBlkData[1][1]["value"] === oldName) {
                        thisBlkData[1][1] = { value: name };
                    }
                } else {
                    var doBlkData = blockObjs[doNames[d]];
                    if (typeof doBlkData[1][1] === "string") {
                        if (doBlkData[1][1] === oldName) {
                            // console.debug('renaming ' + oldName + ' to ' + name);
                            doBlkData[1][1] = name;
                        }
                    } else {
                        if (doBlkData[1][1]["value"] === oldName) {
                            // console.debug('renaming ' + oldName + ' to ' + name);
                            doBlkData[1][1] = { value: name };
                        }
                    }
                }
            }
        }

        if (updatePalettes) {
            // this.palettes.hide();
            this.palettes.updatePalettes("action");
            // this.palettes.show();
        }

        // This section of the code attempts to repair imported
        // code. For example, it adds missing hidden blocks and
        // convert old-style notes to new-style notes.
        blockObjsLength = blockObjs.length;
        var extraBlocksLength = 0;

        for (var b = 0; b < blockObjsLength; b++) {
            if (typeof blockObjs[b][1] === "object") {
                var name = blockObjs[b][1][0];
            } else {
                var name = blockObjs[b][1];
            }

            switch (name) {
                case "articulation":
                case "backward":
                case "crescendo":
                case "drift":
                case "duplicatenotes":
                case "interval":
                case "invert1":
                case "fill":
                case "flat":
                case "hollowline":
                case "multiplybeatfactor":
                case "note":
                case "newnote":
                case "newslur":
                case "newstaccato":
                case "newswing":
                case "newswing2":
                case "osctime":
                case "pluck":
                case "rhythmicdot":
                case "semitoneinterval":
                case "setbpm":
                case "setnotevolume2":
                case "setscalartransposition":
                case "settransposition":
                case "setvoice":
                case "sharp":
                case "skipnotes":
                case "slur":
                case "staccato":
                case "swing":
                case "tie":
                case "tuplet2":
                case "vibrato":
                    var len = blockObjs[b][4].length;
                    if (last(blockObjs[b][4]) == null) {
                        // If there is no next block, add a hidden block;
                        console.debug(
                            "last connection of " +
                                name +
                                " is null: adding hidden block"
                        );
                        console.debug(blockObjs[b][4]);
                        blockObjs[b][4][len - 1] =
                            blockObjsLength + extraBlocksLength;
                        blockObjs.push([
                            blockObjsLength + extraBlocksLength,
                            "hidden",
                            0,
                            0,
                            [b, null]
                        ]);
                        extraBlocksLength += 1;
                    } else {
                        var nextBlock = blockObjs[b][4][len - 1];

                        if (typeof blockObjs[nextBlock][1] === "object") {
                            var nextName = blockObjs[nextBlock][1][0];
                        } else {
                            var nextName = blockObjs[nextBlock][1];
                        }

                        if (nextName !== "hidden") {
                            console.debug(
                                "last connection of " +
                                    name +
                                    " is " +
                                    nextName +
                                    ": adding hidden block"
                            );
                            // If the next block is not a hidden block, add one.
                            blockObjs[b][4][len - 1] =
                                blockObjsLength + extraBlocksLength;
                            blockObjs[nextBlock][4][0] =
                                blockObjsLength + extraBlocksLength;
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength,
                                "hidden",
                                0,
                                0,
                                [b, nextBlock]
                            ]);
                            extraBlocksLength += 1;
                        }
                    }

                    if (
                        ["note", "slur", "staccato", "swing"].indexOf(name) !==
                        -1
                    ) {
                        // We need to convert to newnote style:
                        // (1) add a vspace to the start of the clamp of a note block.
                        var clampBlock = blockObjs[b][4][2];
                        blockObjs[b][4][2] =
                            blockObjsLength + extraBlocksLength;
                        if (clampBlock == null) {
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength,
                                "vspace",
                                0,
                                0,
                                [b, null]
                            ]);
                        } else {
                            blockObjs[clampBlock][4][0] =
                                blockObjsLength + extraBlocksLength;
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength,
                                "vspace",
                                0,
                                0,
                                [b, clampBlock]
                            ]);
                        }

                        extraBlocksLength += 1;

                        // (2) switch the first connection to divide 1 / arg.
                        var argBlock = blockObjs[b][4][1];
                        blockObjs[b][4][1] =
                            blockObjsLength + extraBlocksLength;
                        if (argBlock == null) {
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength,
                                "divide",
                                0,
                                0,
                                [
                                    b,
                                    blockObjsLength + extraBlocksLength + 1,
                                    blockObjsLength + extraBlocksLength + 2
                                ]
                            ]);
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength + 1,
                                ["number", { value: 1 }],
                                0,
                                0,
                                [blockObjsLength + extraBlocksLength]
                            ]);
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength + 2,
                                ["number", { value: 1 }],
                                0,
                                0,
                                [blockObjsLength + extraBlocksLength]
                            ]);
                            extraBlocksLength += 3;
                        } else {
                            blockObjs[argBlock][4][0] =
                                blockObjsLength + extraBlocksLength;
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength,
                                "divide",
                                0,
                                0,
                                [
                                    b,
                                    blockObjsLength + extraBlocksLength + 1,
                                    argBlock
                                ]
                            ]);
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength + 1,
                                ["number", { value: 1 }],
                                0,
                                0,
                                [blockObjsLength + extraBlocksLength]
                            ]);
                            extraBlocksLength += 2;
                        }

                        // (3) create a "newnote" block instead.
                        if (typeof blockObjs[b][1] === "object") {
                            blockObjs[b][1][0] = "new" + name;
                        } else {
                            blockObjs[b][1] = "new" + name;
                        }
                    }
                    break;
                case "action":
                    // Ensure that there is a hidden block as the first
                    // block in the child flow (connection 2) of an action
                    // block (required to make the backward block function
                    // propperly).
                    var len = blockObjs[b][4].length;
                    if (blockObjs[b][4][2] == null) {
                        // If there is no child flow block, add a hidden block;
                        console.debug(
                            "last connection of " +
                                name +
                                " is null: adding hidden block"
                        );
                        blockObjs[b][4][2] =
                            blockObjsLength + extraBlocksLength;
                        blockObjs.push([
                            blockObjsLength + extraBlocksLength,
                            "hidden",
                            0,
                            0,
                            [b, null]
                        ]);
                        extraBlocksLength += 1;
                    } else {
                        var nextBlock = blockObjs[b][4][2];

                        if (typeof blockObjs[nextBlock][1] === "object") {
                            var nextName = blockObjs[nextBlock][1][0];
                        } else {
                            var nextName = blockObjs[nextBlock][1];
                        }

                        if (nextName !== "hidden") {
                            console.debug(
                                "last connection of " +
                                    name +
                                    " is " +
                                    nextName +
                                    ": adding hidden block"
                            );
                            // If the next block is not a hidden block, add one.
                            blockObjs[b][4][2] =
                                blockObjsLength + extraBlocksLength;
                            blockObjs[nextBlock][4][0] =
                                blockObjsLength + extraBlocksLength;
                            blockObjs.push([
                                blockObjsLength + extraBlocksLength,
                                "hidden",
                                0,
                                0,
                                [b, nextBlock]
                            ]);
                            extraBlocksLength += 1;
                        }
                    }
                    break;
                default:
                    break;
            }
        }

        // Append to the current set of blocks.
        this._adjustTheseStacks = [];
        this._adjustTheseDocks = [];
        this._loadCounter = blockObjs.length;

        // We add new blocks to the end of the block list.
        var blockOffset = this.blockList.length;
        var firstBlock = this.blockList.length;

        for (var b = 0; b < this._loadCounter; b++) {
            var thisBlock = blockOffset + b;
            var blkData = blockObjs[b];

            if (typeof blkData[1] === "object") {
                if (blkData[1].length === 1) {
                    var blkInfo = [blkData[1][0], { value: null }];
                } else if (
                    ["number", "string"].indexOf(typeof blkData[1][1]) !== -1
                ) {
                    var blkInfo = [blkData[1][0], { value: blkData[1][1] }];
                    if (COLLAPSIBLES.indexOf(blkData[1][0]) !== -1) {
                        blkInfo[1]["collapsed"] = false;
                    }
                } else {
                    var blkInfo = blkData[1];
                }
            } else {
                var blkInfo = [blkData[1], { value: null }];
                if (COLLAPSIBLES.indexOf(blkData[1]) !== -1) {
                    blkInfo[1]["collapsed"] = false;
                }
            }

            var name = blkInfo[0];

            var collapsed = false;
            if (COLLAPSIBLES.indexOf(name) !== -1) {
                collapsed = blkInfo[1]["collapsed"];
            }

            if (blkInfo[1] == null) {
                var value = null;
                var text = "";
            } else {
                var value = blkInfo[1]["value"];
                var text = blkInfo[1]["text"];
                if (text == null) {
                    text = "";
                }
            }

            if (name in NAMEDICT) {
                name = NAMEDICT[name];
            }

            var that = this;

            if (this.findBlockInstance("temperament1")) {
                this.customTemperamentDefined = true;
            }

            // A few special cases.
            switch (name) {
                case "start":
                    blkData[4][0] = null;
                    blkData[4][2] = null;
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var blkInfo = args[1];
                        that.blockList[thisBlock].value =
                            that.turtles.turtleList.length;
                        that.turtles.addTurtle(
                            that.blockList[thisBlock],
                            blkInfo
                        );
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, blkInfo[1]]
                    );
                    break;
                case "action":
                case "hat":
                    blkData[4][0] = null;
                    blkData[4][3] = null;
                    this._makeNewBlockWithConnections(
                        "action",
                        blockOffset,
                        blkData[4],
                        null,
                        null
                    );
                    break;

                case "temperament1":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        if (value.customTemperamentNotes !== undefined) {
                            TEMPERAMENT = {...TEMPERAMENT,...value.customTemperamentNotes}
                            for (let temp in value.customTemperamentNotes){
                                if(!(temp in PreDefinedTemperaments)){
                                    TEMPERAMENT[temp]["pitchNumber"] = value.customTemperamentNotes[temp].length;
                                }
                                console.debug(value.customTemperamentNotes[temp]);
                            }
                            updateTEMPERAMENTS();
                            that.logo.synth.startingPitch = value.startingPitch;
                            OCTAVERATIO = value.octaveSpace;
                            that.logo.customTemperamentDefined = true; //This is for custom pitch pie menu
                            
                            // if temperament is defined "customPitch" should be available
                            that.logo.blocks.protoBlockDict["custompitch"].hidden = false;
                            that.logo.blocks.palettes.updatePalettes("pitch");
                        }
                    };
                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, blkInfo[1]]
                    );
                    break;

                // Named boxes and dos need private data.
                case "storein2":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].privateData = value;
                        that.blockList[thisBlock].value = null;
                        if (value === "box1") {
                            that.blockList[thisBlock].overrideName = _("box1");
                        } else if (value === "box2") {
                            that.blockList[thisBlock].overrideName = _("box2");
                        } else {
                            that.blockList[thisBlock].overrideName = value;
                        }
                        that.blockList[thisBlock].regenerateArtwork();
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value]
                    );
                    break;

                case "namedbox":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].privateData = value;

                        if (value === "box1") {
                            that.blockList[thisBlock].overrideName = _("box1");
                        } else if (value === "box2") {
                            that.blockList[thisBlock].overrideName = _("box2");
                        } else {
                            that.blockList[thisBlock].overrideName = value;
                        }

                        that.blockList[thisBlock].value = null;
                        that.blockList[thisBlock].regenerateArtwork();
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value]
                    );
                    break;

                case "namedarg":
                case "namedcalc":
                case "nameddo":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].privateData = value;
                        that.blockList[thisBlock].value = null;
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value]
                    );
                    break;

                // Arg clamps may need extra slots added.
                case "doArg":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var extraSlots = args[1].length - 4;
                        if (extraSlots > 0) {
                            var slotList =
                                that.blockList[thisBlock].argClampSlots;
                            for (var i = 0; i < extraSlots; i++) {
                                slotList.push(1);
                                that._newLocalArgBlock(slotList.length);
                                that.blockList[thisBlock].connections.push(
                                    null
                                );
                            }
                            that.blockList[thisBlock].updateArgSlots(slotList);
                            for (var i = 0; i < args[1].length; i++) {
                                if (args[1][i] != null) {
                                    that.blockList[thisBlock].connections[i] =
                                        args[1][i] + firstBlock;
                                } else {
                                    that.blockList[thisBlock].connections[i] =
                                        args[1][i];
                                }
                            }
                        }
                        that._checkArgClampBlocks.push(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        "doArg",
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, blkData[4]]
                    );
                    break;
                case "nameddoArg":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].privateData = value;
                        that.blockList[thisBlock].value = null;
                        var extraSlots = args[2].length - 3;
                        if (extraSlots > 0) {
                            var slotList =
                                that.blockList[thisBlock].argClampSlots;
                            for (var i = 0; i < extraSlots; i++) {
                                slotList.push(1);
                                that._newLocalArgBlock(slotList.length);
                                that.blockList[thisBlock].connections.push(
                                    null
                                );
                            }
                            that.blockList[thisBlock].updateArgSlots(slotList);
                            for (var i = 0; i < args[2].length; i++) {
                                if (args[2][i] != null) {
                                    that.blockList[thisBlock].connections[i] =
                                        args[2][i] + firstBlock;
                                } else {
                                    that.blockList[thisBlock].connections[i] =
                                        args[2][i];
                                }
                            }
                        }
                        that._checkArgClampBlocks.push(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        "nameddoArg",
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value, blkData[4]]
                    );
                    break;
                case "calcArg":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var extraSlots = args[1].length - 3;
                        if (extraSlots > 0) {
                            var slotList =
                                that.blockList[thisBlock].argClampSlots;
                            for (var i = 0; i < extraSlots; i++) {
                                slotList.push(1);
                                that._newLocalArgBlock(slotList.length);
                                that.blockList[thisBlock].connections.push(
                                    null
                                );
                            }
                            that.blockList[thisBlock].updateArgSlots(slotList);
                            for (var i = 0; i < args[1].length; i++) {
                                if (args[1][i] != null) {
                                    that.blockList[thisBlock].connections[i] =
                                        args[1][i] + firstBlock;
                                } else {
                                    that.blockList[thisBlock].connections[i] =
                                        args[1][i];
                                }
                            }
                        }
                        that._checkArgClampBlocks.push(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        "calcArg",
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, blkData[4]]
                    );
                    break;
                case "namedcalcArg":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].privateData = value;
                        that.blockList[thisBlock].value = null;
                        var extraSlots = args[2].length - 2;
                        if (extraSlots > 0) {
                            var slotList =
                                that.blockList[thisBlock].argClampSlots;
                            for (var i = 0; i < extraSlots; i++) {
                                slotList.push(1);
                                that._newLocalArgBlock(slotList.length);
                                that.blockList[thisBlock].connections.push(
                                    null
                                );
                            }
                            that.blockList[thisBlock].updateArgSlots(slotList);
                            for (var i = 0; i < args[2].length; i++) {
                                if (args[2][i] != null) {
                                    that.blockList[thisBlock].connections[i] =
                                        args[2][i] + firstBlock;
                                } else {
                                    that.blockList[thisBlock].connections[i] =
                                        args[2][i];
                                }
                            }
                        }
                        that._checkArgClampBlocks.push(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        "namedcalcArg",
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value, blkData[4]]
                    );
                    break;
                case "makeblock":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var extraSlots = args[1].length - 3;
                        if (extraSlots > 0) {
                            var slotList =
                                that.blockList[thisBlock].argClampSlots;
                            for (var i = 0; i < extraSlots; i++) {
                                slotList.push(1);
                                that.blockList[thisBlock].connections.push(
                                    null
                                );
                            }
                            that.blockList[thisBlock].updateArgSlots(slotList);
                            for (var i = 0; i < args[1].length; i++) {
                                if (args[1][i] != null) {
                                    that.blockList[thisBlock].connections[i] =
                                        args[1][i] + firstBlock;
                                } else {
                                    that.blockList[thisBlock].connections[i] =
                                        args[1][i];
                                }
                            }
                        }
                        that._checkArgClampBlocks.push(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        "makeblock",
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, blkData[4]]
                    );
                    break;

                // Value blocks need a default value set.
                case "number":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].value = Number(value);
                        that.updateBlockText(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value]
                    );
                    break;
                case "text":
                case "solfege":
                case "scaledegree2":
                case "customNote":
                case "eastindiansolfege":
                case "notename":
                case "modename":
                case "temperamentname":
                case "invertmode":
                case "filtertype":
                case "oscillatortype":
                case "accidentalname":
                case "intervalname":
                case "grid":
                case "boolean":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].value = value;
                        that.updateBlockText(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value]
                    );
                    break;
                case "drumname":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].value = value;
                        that.updateBlockText(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value]
                    );

                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        // Load the synth for this drum
                        if (value === null) value = DEFAULTDRUM;
                        this.logo.synth.loadSynth(0, getDrumSynthName(value));
                    }
                    break;
                case "effectsname":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].value = value;
                        that.updateBlockText(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value]
                    );

                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        // Load the synth for this drum
                        if (value === null) value = DEFAULTEFFECT;
                        this.logo.synth.loadSynth(0, getDrumSynthName(value));
                    }
                    break;
                case "voicename":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        if (
                            [
                                "simple 1",
                                "simple 2",
                                "simple 3",
                                "simple 4"
                            ].indexOf(value) !== -1
                        ) {
                            value = "sine";
                        }

                        that.blockList[thisBlock].value = value;
                        that.updateBlockText(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value]
                    );

                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        // Load the synth for this voice
                        try {
                            if (value === null) value = DEFAULTVOICE;
                            this.logo.synth.loadSynth(
                                0,
                                getVoiceSynthName(value)
                            );
                        } catch (e) {
                            console.debug(e);
                        }
                    }
                    break;

                case "noisename":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].value = value;
                        that.updateBlockText(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value]
                    );

                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        // Load the synth for this noise
                        try {
                            if (value === null) value = DEFAULTNOISE;
                            this.logo.synth.loadSynth(
                                0,
                                getNoiseSynthName(value)
                            );
                        } catch (e) {
                            console.debug(e);
                        }
                    }
                    break;

                case "loudness":
                case "pitchness":
                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        null,
                        []
                    );
                    this.logo.initMediaDevices();
                    break;

                case "media":
                    // Load a thumbnail into a media blocks.
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].value = value;
                        if (value != null) {
                            // Load artwork onto media block.
                            that.blockList[thisBlock].loadThumbnail(null);
                        }
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value]
                    );
                    break;
                case "camera":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].value = CAMERAVALUE;
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value]
                    );
                    break;
                case "video":
                    var postProcess = function(args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].value = VIDEOVALUE;
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value]
                    );
                    break;

                // Define some constants for legacy blocks for
                // backward compatibility with Python projects.
                case "red":
                case "black":
                    var postProcess = function(thisBlock) {
                        that.blockList[thisBlock].value = 0;
                        that.updateBlockText(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        "number",
                        blockOffset,
                        blkData[4],
                        postProcess,
                        thisBlock
                    );
                    break;
                case "white":
                    var postProcess = function(thisBlock) {
                        that.blockList[thisBlock].value = 100;
                        that.updateBlockText(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        "number",
                        blockOffset,
                        blkData[4],
                        postProcess,
                        thisBlock
                    );
                    break;
                case "orange":
                    var postProcess = function(thisBlock) {
                        that.blockList[thisBlock].value = 10;
                        that.updateBlockText(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        "number",
                        blockOffset,
                        blkData[4],
                        postProcess,
                        thisBlock
                    );
                    break;
                case "yellow":
                    var postProcess = function(thisBlock) {
                        that.blockList[thisBlock].value = 20;
                        that.updateBlockText(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        "number",
                        blockOffset,
                        blkData[4],
                        postProcess,
                        thisBlock
                    );
                    break;
                case "green":
                    var postProcess = function(thisBlock) {
                        that.blockList[thisBlock].value = 40;
                        that.updateBlockText(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        "number",
                        blockOffset,
                        blkData[4],
                        postProcess,
                        thisBlock
                    );
                    break;
                case "blue":
                    var postProcess = function(thisBlock) {
                        that.blockList[thisBlock].value = 70;
                        that.updateBlockText(thisBlock);
                    };

                    this._makeNewBlockWithConnections(
                        "number",
                        blockOffset,
                        blkData[4],
                        postProcess,
                        thisBlock
                    );
                    break;
                case "loadFile":
                    var postProcess = function(args) {
                        that.blockList[args[0]].value = args[1];
                        that.updateBlockText(args[0]);
                    };

                    this._makeNewBlockWithConnections(
                        name,
                        blockOffset,
                        blkData[4],
                        postProcess,
                        [thisBlock, value]
                    );
                    break;
                default:
                    // Check that name is in the proto list
                    if (
                        !(name in this.protoBlockDict) ||
                        this.protoBlockDict[name] == null
                    ) {
                        var postProcessUnknownBlock = function(args) {
                            // save original block name
                            that.blockList[args[0]].privateData = args[1];
                        };

                        var newName = name;

                        // Substitute a NOP block for an unknown block.
                        var n = blkData[4].length;
                        // Try to figure out if it is a flow or an arg block.
                        var flowBlock = true;
                        // Is the first connection attached to a flow block?
                        var c = blkData[4][0];
                        if (c !== null) {
                            var cc = blockObjs[c][4].indexOf(b);
                            if (typeof blockObjs[c][1] === "string") {
                                if (
                                    this.protoBlockDict[blockObjs[c][1]] !==
                                    undefined
                                ) {
                                    if (
                                        this.protoBlockDict[blockObjs[c][1]]
                                            .dockTypes[cc] !== "in"
                                    ) {
                                        flowBlock = false;
                                    }
                                }
                            } else {
                                if (
                                    this.protoBlockDict[blockObjs[c][1][0]] !==
                                    undefined
                                ) {
                                    if (
                                        this.protoBlockDict[blockObjs[c][1][0]]
                                            .dockTypes[cc] !== "in"
                                    ) {
                                        flowBlock = false;
                                    }
                                }
                            }
                        } else {
                            // Or the last connection attached to a flow block?
                            var c = last(blkData[4]);
                            if (c !== null) {
                                var cc = blockObjs[c][4].indexOf(b);
                                if (typeof blockObjs[c][1] === "string") {
                                    if (
                                        this.protoBlockDict[blockObjs[c][1]] !==
                                        undefined
                                    ) {
                                        if (
                                            this.protoBlockDict[blockObjs[c][1]]
                                                .dockTypes[cc] !== "out"
                                        ) {
                                            flowBlock = false;
                                        }
                                    } else {
                                        if (
                                            this.protoBlockDict[
                                                blockObjs[c][1][0]
                                            ] !== undefined
                                        ) {
                                            if (
                                                this.protoBlockDict[
                                                    blockObjs[c][1][0]
                                                ].dockTypes[cc] !== "out"
                                            ) {
                                                flowBlock = false;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        if (flowBlock) {
                            console.debug(
                                n + ": substituting nop flow block for " + name
                            );
                        } else {
                            console.debug(
                                n + ": substituting nop arg block for " + name
                            );
                        }

                        // We cover the common cases here.
                        switch (n) {
                            case 1:
                                newName = "nopValueBlock";
                                break;
                            case 2:
                                if (flowBlock) {
                                    newName = "nopZeroArgBlock";
                                } else {
                                    newName = "nopOneArgMathBlock";
                                }
                                break;
                            case 3:
                                if (flowBlock) {
                                    newName = "nopOneArgBlock";
                                } else {
                                    newName = "nopTwoArgMathBlock";
                                }
                                break;
                            case 4:
                                newName = "nopTwoArgBlock";
                                break;
                            case 5:
                            default:
                                if (n > 5) {
                                    console.debug("WARNING: arg count exceed.");
                                }
                                newName = "nopThreeArgBlock";
                                break;
                        }

                        this._makeNewBlockWithConnections(
                            newName,
                            blockOffset,
                            blkData[4],
                            postProcessUnknownBlock,
                            [thisBlock, name]
                        );
                    } else {
                        this._makeNewBlockWithConnections(
                            name,
                            blockOffset,
                            blkData[4],
                            null
                        );
                    }
                    break;
            }

            if (thisBlock === this.blockList.length - 1) {
                if (this.blockList[thisBlock].connections[0] == null) {
                    this.blockList[thisBlock].container.x = blkData[2]; // Math.floor(blkData[2] + 0.5);
                    this.blockList[thisBlock].container.y = blkData[3]; // Math.floor(blkData[3] + 0.5);
                    this._adjustTheseDocks.push(thisBlock);
                    if (blkData[4][0] == null) {
                        this._adjustTheseStacks.push(thisBlock);
                    }
                    if (
                        blkData[2] < 0 ||
                        blkData[3] < 0 ||
                        blkData[2] > canvas.width ||
                        blkData[3] > canvas.height
                    ) {
                        this._setHomeButtonContainers(true, false);
                    }
                }
            }
        }
    };

    /*
     * If all the blocks are loaded, we can make the final adjustments.
     * @param - name
     * @public
     * @return {void}
     */
    this.cleanupAfterLoad = function(name) {
        this._loadCounter -= 1;
        if (this._loadCounter > 0) {
            return;
        }

        this._findDrumURLs();

        this.updateBlockPositions();

        this._cleanupStacks();

        for (var i = 0; i < this.blocksToCollapse.length; i++) {
            this.blockList[this.blocksToCollapse[i]].collapseToggle();
        }

        this.blocksToCollapse = [];

        this.refreshCanvas();

        // Do a final check on the action and boxes palettes.
        var updatePalettes = false;
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (
                !this.blockList[blk].trash &&
                this.blockList[blk].name === "action"
            ) {
                var myBlock = this.blockList[blk];
                var arg = null;
                var c = myBlock.connections[1];
                if (c != null && this.blockList[c].value !== _("action")) {
                    if (
                        this.newNameddoBlock(
                            this.blockList[c].value,
                            this.actionHasReturn(blk),
                            this.actionHasArgs(blk)
                        )
                    ) {
                        updatePalettes = true;
                    }
                }
            }
        }
        if (updatePalettes) {
            // this.palettes.hide();
            this.palettes.updatePalettes("action");
            // this.palettes.dict['action'].hide();
            // this.palettes.show();
        }

        var updatePalettes = false;
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (
                !this.blockList[blk].trash &&
                this.blockList[blk].name === "storein"
            ) {
                var myBlock = this.blockList[blk];
                var arg = null;
                var c = myBlock.connections[1];
                if (c != null && this.blockList[c].value !== _("box")) {
                    var name = this.blockList[c].value;
                    if (name !== null) {
                        // Is there an old block with this name still around?
                        if (
                            this.protoBlockDict["myStorein_" + name] ==
                                undefined ||
                            this.protoBlockDict["yourStorein2_" + name] ==
                                undefined
                        ) {
                            console.debug("adding new storein block " + name);
                            this.newStoreinBlock(this.blockList[c].value);
                            this.newStorein2Block(this.blockList[c].value);
                            this.newNamedboxBlock(this.blockList[c].value);
                            updatePalettes = true;
                        }
                    }
                }
            }
        }

        if (updatePalettes) {
            // Do this update on a slight delay so as not to collide with
            // the actions update.
            var that = this;
            setTimeout(function() {
                // that.palettes.hide();
                that.palettes.updatePalettes("boxes");
                // that.palettes.dict['boxes'].hide();
                // that.palettes.show();
            }, 150); // 1500
        }

        console.debug("Finished block loading");
        document.body.style.cursor = "default";
        document.getElementById("load-container").style.display = "none";
        var myCustomEvent = new Event("finishedLoading");
        document.dispatchEvent(myCustomEvent);
    };

    /*
     * Cleanup the stacks after load.
     * @private
     * @return {void}
     */
    this._cleanupStacks = function() {
        if (this._checkArgClampBlocks.length > 0) {
            // We make multiple passes because we need to account for nesting.
            for (var i = 0; i < this._checkArgClampBlocks.length; i++) {
                for (var b = 0; b < this._checkArgClampBlocks.length; b++) {
                    this._adjustArgClampBlock([this._checkArgClampBlocks[b]]);
                }
            }
        }

        if (this._checkTwoArgBlocks.length > 0) {
            // We make multiple passes because we need to account for nesting.
            for (var i = 0; i < this._checkTwoArgBlocks.length; i++) {
                for (var b = 0; b < this._checkTwoArgBlocks.length; b++) {
                    this._adjustExpandableTwoArgBlock([
                        this._checkTwoArgBlocks[b]
                    ]);
                }
            }
        }

        for (var blk = 0; blk < this._adjustTheseDocks.length; blk++) {
            this.adjustDocks(this._adjustTheseDocks[blk], true);
            // blockBlocks._expandTwoArgs();
            this._expandClamps();
        }

        for (var blk = 0; blk < this._adjustTheseStacks.length; blk++) {
            this.raiseStackToTop(this._adjustTheseStacks[blk]);
        }
    };

    /*
     * Look for a Return block in an action stack.
     * @param - blk - block
     * @public
     * @return boolean
     */
    this.actionHasReturn = function(blk) {
        if (this.blockList[blk].name !== "action") {
            return false;
        }
        this.findDragGroup(blk);
        for (var b = 0; b < this.dragGroup.length; b++) {
            if (this.blockList[this.dragGroup[b]].name === "return") {
                return true;
            }
        }
        return false;
    };

    /*
     * Look for an Arg block in an action stack.
     * @param - blk - block
     * @public
     * @return boolean
     */
    this.actionHasArgs = function(blk) {
        if (this.blockList[blk].name !== "action") {
            return false;
        }
        this.findDragGroup(blk);
        for (var b = 0; b < this.dragGroup.length; b++) {
            if (
                this.blockList[this.dragGroup[b]].name === "arg" ||
                this.blockList[this.dragGroup[b]].name === "namedarg"
            ) {
                return true;
            }
        }
        return false;
    };

    /*
     * Move the stack associated with blk to the top.
     * @param - blk - block
     * @public
     * @return {void}
     */
    this.raiseStackToTop = function(blk) {
        var topBlk = this.findTopBlock(blk);
        this.findDragGroup(topBlk);

        var z = this.stage.children.length - 1;
        for (var b = 0; b < this.dragGroup.length; b++) {
            this.stage.setChildIndex(
                this.blockList[this.dragGroup[b]].container,
                z
            );

            z -= 1;
        }

        this.refreshCanvas;
    };

    /*
     * Deletes an Action block
     * @param - myblock - new variable
     * @public
     * @return {void}
     */
    this.deleteActionBlock = async function(myBlock) {
        var actionArg = this.blockList[myBlock.connections[1]];
        if (actionArg) {
            var actionName = actionArg.value;
            // Look for any "orphan" action blocks.
            for (var blk = 0; blk < this.blockList.length; blk++) {
                var thisBlock = this.blockList[blk];

                // We are only interested in do and nameddo blocks.
                if (
                    [
                        "nameddo",
                        "namedcalcArg",
                        "nameddoArg",
                        "do",
                        "calc",
                        "calcArg",
                        "doArg"
                    ].indexOf(thisBlock.name) === -1
                ) {
                    continue;
                }

                // Make sure it is not connected.
                if (thisBlock.connections[0] !== null) {
                    continue;
                }

                if (thisBlock.name !== "calc") {
                    if (last(thisBlock.connections) !== null) {
                        continue;
                    }
                }

                if (thisBlock.name === "calcArg") {
                    if (thisBlock.connections[2] !== null) {
                        continue;
                    }
                }

                if (thisBlock.name === "doArg") {
                    if (thisBlock.connections[2] !== null) {
                        continue;
                    }
                }

                if (thisBlock.name === "namedcalcArg") {
                    if (thisBlock.connections[1] !== null) {
                        continue;
                    }
                }

                switch (thisBlock.name) {
                    case "doArg":
                    case "calcArg":
                    case "calc":
                    case "do":
                        if (thisBlock.connections[1] !== null) {
                            var argBlock = this.blockList[
                                thisBlock.connections[1]
                            ];
                            var blockValue = argBlock.value;
                        }
                        break;
                    case "nameddoArg":
                    case "namedcalcArg":
                    case "nameddo":
                        var argBlock = null;
                        var blockValue = thisBlock.privateData;
                        break;
                }

                if (blockValue === actionName) {
                    // thisBlock.hide();
                    thisBlock.trash = true;
                    if (argBlock !== null) {
                        argBlock.hide();
                        argBlock.trash = true;
                    }
                }
            }

            // Delete action blocks from action palette.
            // Use a timeout to avoid palette refresh race condition.
            this.deleteActionTimeout += 50; // 500
            var timeout = this.deleteActionTimeout;
            var that = this;
            await delayExecution(timeout);
            that.deleteActionTimeout -= 50; // 500
            that.palettes.removeActionPrototype(actionName);
        }
    };

    /*
     * Send a stack of blocks to the trash.
     * @param - myBlock
     * @public
     * @return {void}
     */
    this.sendStackToTrash = function(myBlock) {
        // First, hide the palettes as they will need updating.
        for (var name in this.palettes.dict) {
            this.palettes.dict[name].hideMenu(true);
        }

        this.refreshCanvas();

        var thisBlock = this.blockList.indexOf(myBlock);

        // Add this block to the list of blocks in the trash so we can
        // undo this action.
        this.trashStacks.push(thisBlock);

        // Disconnect block.
        var parentBlock = myBlock.connections[0];
        if (parentBlock != null) {
            for (var c in this.blockList[parentBlock].connections) {
                if (this.blockList[parentBlock].connections[c] === thisBlock) {
                    this.blockList[parentBlock].connections[c] = null;
                    break;
                }
            }
            myBlock.connections[0] = null;

            // Add default block if user deletes all blocks from
            // inside the note block.
            this.addDefaultBlock(parentBlock, thisBlock);
        }

        if (myBlock.name === "start" || myBlock.name === "drum") {
            turtle = myBlock.value;
            var turtleNotInTrash = 0;
            for (var i = 0; i < this.turtles.turtleList.length; i++) {
                if (!this.turtles.turtleList[i].inTrash) {
                    turtleNotInTrash += 1;
                }
            }

            if (turtle != null && turtleNotInTrash > 1) {
                console.debug("putting turtle " + turtle + " in the trash");
                let comp = this.turtles.turtleList[turtle].companionTurtle;
                if (comp){
                    if (turtleNotInTrash > 2){
                        this.turtles.turtleList[comp].inTrash = true;
                        this.turtles.turtleList[comp].container.visible = false;
                        this.turtles.turtleList[turtle].inTrash = true;
                        this.turtles.turtleList[turtle].container.visible = false;
                    }
                } else {
                    this.turtles.turtleList[turtle].inTrash = true;
                    this.turtles.turtleList[turtle].container.visible = false;
                }
            } else {
                this.errorMsg(
                    _("You must always have at least one start block.")
                );
                console.debug("null turtle");
                return;
            }
        } else if (myBlock.name === "action") {
            if (!myBlock.trash) {
                this.deleteActionBlock(myBlock);
            }
        }

        // put drag group in trash
        this.findDragGroup(thisBlock);
        for (var b = 0; b < this.dragGroup.length; b++) {
            var blk = this.dragGroup[b];
            // console.debug('putting ' + this.blockList[blk].name + ' in the trash');
            this.blockList[blk].trash = true;
            this.blockList[blk].hide();
            var title = this.blockList[blk].protoblock
            .staticLabels[0];
            closeBlkWidgets(_(title));
            this.refreshCanvas();
        }

        // Adjust the stack from which we just deleted blocks.
        if (parentBlock != null) {
            var topBlk = this.findTopBlock(parentBlock);
            this.findDragGroup(topBlk);

            // We need to track two-arg blocks in case they need expanding.
            this._checkTwoArgBlocks = [];

            // And arg clamp blocks in case they need expanding.
            this._checkArgClampBlocks = [];

            for (var b = 0; b < this.dragGroup.length; b++) {
                var blk = this.dragGroup[b];
                var myBlock = this.blockList[blk];
                if (myBlock.isTwoArgBlock()) {
                    this._checkTwoArgBlocks.push(blk);
                } else if (
                    (myBlock.isArgBlock() && myBlock.isExpandableBlock()) ||
                    myBlock.isArgClamp()
                ) {
                    this._checkTwoArgBlocks.push(blk);
                } else if (
                    [
                        "clamp",
                        "argclamp",
                        "argclamparg",
                        "doubleclamp",
                        "argflowclamp"
                    ].indexOf(myBlock.protoblock.style) !== -1
                ) {
                    this._checkArgClampBlocks.push(blk);
                }
            }

            this._cleanupStacks();
            this.refreshCanvas();
        }
    };

    /**
     * Clears all the blocks, updates the cache and refreshes the canvas.
     *
     * @returns {void}
     */
    this.clearParameterBlocks = function() {
        for (let blk = 0; blk < this.blockList.length; blk++) {
            if (
                this.blockList[blk].protoblock.parameter &&
                this.blockList[blk].text !== null
            ) {
                this.blockList[blk].text.text = "";
                this.blockList[blk].container.updateCache();
            }
        }
        this.refreshCanvas();
    };

    /**
     * Updates the label on parameter blocks.
     *
     * @param logo
     * @param turtle
     * @param blk
     * @returns {void}
     */
    this.updateParameterBlock = function(logo, turtle, blk) {
        let name = this.blockList[blk].name;

        if (
            this.blockList[blk].protoblock.parameter &&
            this.blockList[blk].text !== null
        ) {
            let value = 0;

            if (typeof this.blockList[blk].protoblock.updateParameter === "function") {
                value = this.blockList[blk].protoblock.updateParameter(logo, turtle, blk);
            } else {
                if (name in this.evalParameterDict) {
                    eval(this.evalParameterDict[name]);
                } else {
                    return;
                }
            }

            if (typeof value === "string") {
                if (value.length > 6) {
                    value = value.substr(0, 5) + "...";
                }

                this.blockList[blk].text.text = value;
            } else if (name === "divide") {
                this.blockList[blk].text.text = mixedNumber(value);
            } else {
                this.blockList[blk].text.text = value.toString();
            }

            this.blockList[blk].container.updateCache();
            this.refreshCanvas();
        }
    };

    /**
     * Changes a property according to a block name and a value.
     *
     * @param logo
     * @param blk
     * @param value
     * @param turtle
     * @returns {void}
     */
    this.blockSetter = function(logo, blk, value, turtle) {
        if (typeof this.blockList[blk].protoblock.setter === "function") {
            this.blockList[blk].protoblock.setter(logo, value, turtle, blk);
        } else {
            if (this.blockList[blk].name in logo.evalSetterDict) {
                eval(logo.evalSetterDict[this.blockList[blk].name]);
            } else {
                throw new Error();
            }
        }
    };

    /**
     * Hides all the blocks.
     *
     * @returns {void}
     */
    this.hideBlocks = function() {
        this.palettes.hide();
        this.hide();
        this.refreshCanvas();
    }

    /**
     * Shows all the blocks.
     *
     * @returns {void}
     */
    this.showBlocks = function() {
        this.palettes.show();
        this.show();
        this.bringToTop();
        this.refreshCanvas();
    }
};
