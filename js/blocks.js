// Copyright (c) 2014-17 Walter Bender
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

// Special value flags to uniquely identify these media blocks.
const CAMERAVALUE = '##__CAMERA__##';
const VIDEOVALUE = '##__VIDEO__##';

// Blocks holds the list of blocks and most of the block-associated
// methods, since most block manipulations are inter-block.

function Blocks () {
    if (sugarizerCompatibility.isInsideSugarizer()) {
        storage = sugarizerCompatibility.data;
    } else {
        storage = localStorage;
    }

    this.canvas = null;
    this.stage = null;
    this.refreshCanvas = null;
    this.trashcan = null;
    this.updateStage = null;
    this.getStageScale = null;

    // We keep a list of stacks in the trash.
    this.trashStacks = [];

    // We keep a dictionary for the proto blocks,
    this.protoBlockDict = {}
    // and a list of the blocks we create.
    this.blockList = [];

    // Track the time with mouse down.
    this.mouseDownTime = 0;
    this.longPressTimeout = null;

    // "Copy stack" selects a stack for pasting. Are we selecting?
    this.selectingStack = false;
    // and what did we select?
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
    this._clampBlocksToCheck = [];

    // We need to keep track of certain classes of blocks that exhibit
    // different types of behavior.

    // Blocks with parts that expand, e.g.,
    this._expandableBlocks = [];
    // Blocks that contain child flows of blocks
    this.clampBlocks = [];
    this.doubleExpandable = [];
    this.argClampBlocks = [];
    // Blocks that are used as arguments to other blocks
    this.argBlocks = [];
    // Blocks that return values
    this.valueBlocks = [];
    // Two-arg blocks with two arguments (expandable).
    this.twoArgBlocks = [];
    // Blocks that don't run when clicked.
    this.noRunBlocks = [];

    this._homeButtonContainers = [];
    this.blockScale = DEFAULTBLOCKSCALE;

    // We need to know if we are processing a copy or save stack command.
    this.inLongPress = false;

    // We stage deletion of prototype action blocks on the palette so
    // as to avoid palette refresh race conditions.
    this.deleteActionTimeout = 0;

    this.setCanvas = function (canvas) {
        this.canvas = canvas;
        return this;
    };

    this.setStage = function (stage) {
        this.stage = stage;
        return this;
    };

    this.setRefreshCanvas = function (refreshCanvas) {
        this.refreshCanvas = refreshCanvas;
        return this;
    };

    this.setTrashcan = function (trashcan) {
        this.trashcan = trashcan;
        return this;
    };

    this.setUpdateStage = function (updateStage) {
        this.updateStage = updateStage;
        return this;
    };

    this.setGetStageScale = function (getStageScale) {
        this.getStageScale = getStageScale;
        return this;
    };

    // Change the scale of the blocks (and the protoblocks on the palette).
    this.setBlockScale = function (scale) {
        console.log('New block scale is ' + scale);
        this.blockScale = scale;

        // Regenerate all of the artwork at the new scale.
        for (var blk = 0; blk < this.blockList.length; blk++) {
            // if (!this.blockList[blk].trash) {
                this.blockList[blk].resize(scale);
            // }
        }

        this.findStacks();
        for (var stack = 0; stack < this.stackList.length; stack++) {
            // console.log('Adjust Docks: ' + this.blockList[this.stackList[stack]].name);
            this.adjustDocks(this.stackList[stack], true);
        }

        // We reset the protoblock scale on the palettes, but don't
        // modify the palettes themselves.
        for (var palette in this.palettes.dict) {
            for (var blk = 0; blk < this.palettes.dict[palette].protoList.length; blk++) {
                this.palettes.dict[palette].protoList[blk].scale = scale;
            }
        }
    };

    // We need access to the msg block...
    this.setMsgText = function (msgText) {
        this.msgText = msgText;
    };

    // and the Error msg function.
    this.setErrorMsg = function (errorMsg) {
        this.errorMsg = errorMsg;
        return this;
    };

    // We need access to the macro dictionary because we add to it.
    this.setMacroDictionary = function (obj) {
        this.macroDict = obj;
        return this;
    };

    // We need access to the turtles list because we associate a
    // turtle with each start block.
    this.setTurtles = function (turtles) {
        this.turtles = turtles;
        return this;
    };

    // We need to access the "pseudo-Logo interpreter" when we click
    // on blocks.
    this.setLogo = function (logo) {
        this.logo = logo;
        return this;
    };

    // The scale of the graphics is determined by screen size.
    this.setScale = function (scale) {
        this.blockScale = scale;
        return this;
    };

    // Toggle state of collapsible blocks.
    this.toggleCollapsibles = function () {
        for (var blk in this.blockList) {
            var myBlock = this.blockList[blk];
            if (COLLAPSABLES.indexOf(myBlock.name) !== -1 && !myBlock.trash) {
                myBlock.collapseToggle();
            }
        }
    };

    // We need access to the go-home buttons and boundary.
    this.setHomeContainers = function (containers, boundary) {
        this._homeButtonContainers = containers;
        this.boundary = boundary;
        return this;
    };

    // set up copy/paste, dismiss, and copy-stack buttons
    this.makeCopyPasteButtons = function (makeButton, updatePasteButton) {
        var that = this;
        this.updatePasteButton = updatePasteButton;

        this.dismissButton = makeButton('cancel-button', '', 0, 0, 55, 0, this.stage);
        this.dismissButton.visible = false;

        this.saveStackButton = makeButton('save-blocks-button', _('Save stack'), 0, 0, 55, 0, this.stage);
        this.saveStackButton.visible = false;

        this.dismissButton.on('click', function (event) {
            that.saveStackButton.visible = false;
            that.dismissButton.visible = false;
            that.inLongPress = false;
            that.refreshCanvas();
        });

        this.saveStackButton.on('click', function (event) {
            // Only invoked from action blocks.
            var topBlock = that.findTopBlock(that.activeBlock);
            that.inLongPress = false;
            that.selectedStack = topBlock;
            that.saveStackButton.visible = false;
            that.dismissButton.visible = false;
            that.saveStack();
            that.refreshCanvas();
        });
    };

    // Walk through all of the proto blocks in order to make lists of
    // any blocks that need special treatment.
    this.findBlockTypes = function () {
        for (var proto in this.protoBlockDict) {
            if (this.protoBlockDict[proto].expandable) {
                this._expandableBlocks.push(this.protoBlockDict[proto].name);
            }
            if (this.protoBlockDict[proto].style === 'clamp') {
                this.clampBlocks.push(this.protoBlockDict[proto].name);
            }
            if (this.protoBlockDict[proto].style === 'argclamp') {
                this.argClampBlocks.push(this.protoBlockDict[proto].name);
            }
            if (this.protoBlockDict[proto].style === 'argflowclamp') {
                this.clampBlocks.push(this.protoBlockDict[proto].name);
            }
            if (this.protoBlockDict[proto].style === 'argclamparg') {
                this.argClampBlocks.push(this.protoBlockDict[proto].name);
                this.argBlocks.push(this.protoBlockDict[proto].name);
            }
            if (this.protoBlockDict[proto].style === 'twoarg') {
                this.twoArgBlocks.push(this.protoBlockDict[proto].name);
            }
            if (this.protoBlockDict[proto].style === 'arg') {
                this.argBlocks.push(this.protoBlockDict[proto].name);
            }
            if (this.protoBlockDict[proto].style === 'value') {
                this.argBlocks.push(this.protoBlockDict[proto].name);
                this.valueBlocks.push(this.protoBlockDict[proto].name);
            }
            if (this.protoBlockDict[proto].style === 'doubleclamp') {
                this.doubleExpandable.push(this.protoBlockDict[proto].name);
            }
        }
    };

    this._actionBlock = function (name) {
        return ['do', 'doArg', 'calc', 'calcArg'].indexOf(name) !== -1;
    };

    this._namedActionBlock = function (name) {
        return ['nameddo', 'nameddoArg', 'namedcalc', 'namedcalcArg'].indexOf(name) !== -1;
    };

    // Adjust the docking postions of all blocks in the current drag
    // group.
    this._adjustBlockPositions = function () {
        if (this.dragGroup.length < 2) {
            return;
        }

        // console.log('Adjust Docks: ' + this.blockList[this.dragGroup[0]].name);
        this.adjustDocks(this.dragGroup[0], true)
    };

    // Adjust the size of the clamp in an expandable block when blocks
    // are inserted into (or removed from) the child flow. This is a
    // common operation for start and action blocks, but also for
    // repeat, forever, if, etc.
    this._adjustExpandableClampBlock = function () {
        if (this._clampBlocksToCheck.length === 0) {
            return;
        }

        var obj = this._clampBlocksToCheck.pop();
        var blk = obj[0];
        var clamp = obj[1];

        var myBlock = this.blockList[blk];

        if (myBlock.isArgFlowClampBlock()) {
        // Make sure myBlock is a clamp block.
        } else if (myBlock.isArgBlock() || myBlock.isTwoArgBlock()) {
            return;
        } else if (myBlock.isArgClamp()) {
            // We handle ArgClamp blocks elsewhere.
            this._adjustArgClampBlock([blk]);
            return;
        }

        function clampAdjuster(blocks, blk, myBlock, clamp) {
            // First we need to count up the number of (and size of) the
            // blocks inside the clamp; The child flow is usually the
            // second-to-last argument.

            if (myBlock.isArgFlowClampBlock()) {
                var c = 1;  // 0: outie; and 1: child flow
            } else if (clamp === 0) {
                var c = myBlock.connections.length - 2;
            } else { // e.g., Bottom clamp in if-then-else
                var c = myBlock.connections.length - 3;
            }

            blocks._sizeCounter = 0;
            var childFlowSize = 1;
            if (c > 0 && myBlock.connections[c] != null) {
                childFlowSize = Math.max(blocks._getStackSize(myBlock.connections[c]), 1);
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
            setTimeout(function () {
                if (blocks._clampBlocksToCheck.length > 0) {
                    blocks._adjustExpandableClampBlock();
                }
            }, 250);
        };

        clampAdjuster(this, blk, myBlock, clamp);
    };

    // Returns the block size.
    this._getBlockSize = function (blk) {
        var myBlock = this.blockList[blk];
        return myBlock.size;
    };

    // Adjust the slot sizes of arg clamps.
    this._adjustArgClampBlock = function (argBlocksToCheck) {
        if (argBlocksToCheck.length === 0) {
            return;
        }

        var blk = argBlocksToCheck.pop();
        var myBlock = this.blockList[blk];

        // Which connection do we start with?
        if (['doArg', 'calcArg'].indexOf(myBlock.name) !== -1) {
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

    // We also adjust the size of twoarg blocks. It is similar to how
    // we adjust clamps, but enough different that it is in its own
    // function.
    this._adjustExpandableTwoArgBlock = function (argBlocksToCheck) {
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

    this._addRemoveVspaceBlock = function (blk) {
        var myBlock = this.blockList[blk];

        var c = myBlock.connections[myBlock.connections.length - 2];
        var secondArgumentSize = 1;
        if (c != null) {
            var secondArgumentSize = Math.max(this._getBlockSize(c), 1);
        }

        var that = this;

        var vSpaceCount = howManyVSpaceBlocksBelow(blk);
        if (secondArgumentSize < vSpaceCount + 1) {
            // Remove a vspace block
            var n = Math.abs(secondArgumentSize - vSpaceCount - 1);
            for (var i = 0; i < n; i++) {
                var lastConnection = myBlock.connections.length - 1;
                var vspaceBlock = this.blockList[myBlock.connections[lastConnection]];
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

            function vspaceAdjuster(args) { // nextBlock, vspace, i, n
                var thisBlock = args[0];
                var nextBlock = args[1];
                var vspace = args[2];
                var i = args[3];
                var n = args[4];
                var vspaceBlock = that.blockList[vspace];
                var lastDock = last(thisBlock.docks);
                var dx = lastDock[0] - vspaceBlock.docks[0][0];
                var dy = lastDock[1] - vspaceBlock.docks[0][1];
                vspaceBlock.container.x = thisBlock.container.x + dx;
                vspaceBlock.container.y = thisBlock.container.y + dy;
                vspaceBlock.connections[0] = that.blockList.indexOf(thisBlock);
                vspaceBlock.connections[1] = nextBlock;
                thisBlock.connections[thisBlock.connections.length - 1] = vspace;
                if (nextBlock) {
                    that.blockList[nextBlock].connections[0] = vspace;
                }
                if (i + 1 < n) {
                    var newPos = that.blockList.length;
                    thisBlock = last(that.blockList);
                    nextBlock = last(thisBlock.connections);
                    that._makeNewBlockWithConnections('vspace', newPos, [null, null], vspaceAdjuster, [thisBlock, nextBlock, newPos, i + 1, n]);
                }
            };

            this._makeNewBlockWithConnections('vspace', newPos, [null, null], vspaceAdjuster, [thisBlock, nextBlock, newPos, 0, n]);
        };

        function howManyVSpaceBlocksBelow(blk) {
            // Need to know how many vspace blocks are below the block
            // we're checking against.
            var nextBlock = last(that.blockList[blk].connections);
            if (nextBlock && that.blockList[nextBlock].name === 'vspace') {
                return 1 + howManyVSpaceBlocksBelow(nextBlock);
                // Recurse until it isn't a vspace
            }
            return 0;
        };
    };

    this._getStackSize = function (blk) {
        // How many block units in this stack?
        var size = 0;
        this._sizeCounter += 1;
        if (this._sizeCounter > this.blockList.length * 2) {
            console.log('Infinite loop encountered detecting size of expandable block? ' + blk);
            return size;
        }

        if (blk == null) {
            return size;
        }

        var myBlock = this.blockList[blk];
        if (myBlock == null) {
            console.log('Something very broken in _getStackSize.');
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

        // check on any connected block
        if (!myBlock.isValueBlock()) {
            var cblk = last(myBlock.connections);
            if (cblk != null) {
                size += this._getStackSize(cblk);
            }
        }
        return size;
    };

    this.adjustDocks = function (blk, resetLoopCounter) {
        // Give a block, adjust the dock positions
        // of all of the blocks connected to it

        var myBlock = this.blockList[blk];

        // For when we come in from makeBlock
        if (resetLoopCounter != null) {
            this._loopCounter = 0;
        }

        // These checks are to test for malformed data. All blocks
        // should have connections.
        if (myBlock == null) {
            console.log('Saw a null block: ' + blk);
            return;
        }

        if (myBlock.connections == null) {
            console.log('Saw a block with null connections: ' + blk);
            return;
        }

        if (myBlock.connections.length === 0) {
            console.log('Saw a block with [] connections: ' + blk);
            return;
        }

        // Value blocks only have one dock.
        if (myBlock.docks.length === 1) {
            return;
        }

        this._loopCounter += 1;
        if (this._loopCounter > this.blockList.length * 2) {
            console.log('Infinite loop encountered while adjusting docks: ' + blk + ' ' + this.blockList);
            return;
        }

        // Walk through each connection except the parent block; the
        // exception being the parent block of boolean 2arg blocks,
        // since the dock[0] position can change.
        if (myBlock.isTwoArgBooleanBlock()) {
            var start = 0;
        } else {
            var start = 1;
        }
        for (var c = start; c < myBlock.connections.length; c++) {
            // Get the dock position for this connection.
            var bdock = myBlock.docks[c];

            // Find the connecting block.
            var cblk = myBlock.connections[c];
            // Nothing connected here so continue to the next connection.
            if (cblk == null) {
                continue;
            }

            // Another database integrety check.
            if (this.blockList[cblk] == null) {
                console.log('This is not good: we encountered a null block: ' + cblk);
                continue;
            }

            // Find the dock position in the connected block.
            var foundMatch = false;
            for (var b = 0; b < this.blockList[cblk].connections.length; b++) {
                if (this.blockList[cblk].connections[b] === blk) {
                    foundMatch = true;
                    break
                }
            }

            // Yet another database integrety check.
            if (!foundMatch) {
                console.log('Did not find match for ' + myBlock.name + ' (' + blk + ') and ' + this.blockList[cblk].name + ' (' + cblk + ')');
                console.log(myBlock.connections);
                console.log(this.blockList[cblk].connections);
                break;
            }

            var cdock = this.blockList[cblk].docks[b];

            if (c > 0) {
                // Move the connected block...
                var dx = bdock[0] - cdock[0];
                var dy = bdock[1] - cdock[1];
                if (myBlock.container == null) {
                    console.log('Does this ever happen any more?')
                } else {
                    var nx = myBlock.container.x + dx;
                    var ny = myBlock.container.y + dy;
                }
                this._moveBlock(cblk, nx, ny);
            } else {
                // or it's parent.
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

    this.addDefaultBlock = function (parentblk, oldBlock, skipOldBlock) {
        // Add an action name whenever the user removes the name from
        // an action block.
        // Add a Silence block whenever the user removes all the
        // blocks from a Note block.
        if (parentblk == null) {
            return;
        }

        if (this.blockList[parentblk].name === 'action') {
            var cblk = this.blockList[parentblk].connections[1];
            if (cblk == null) {
                var that = this;
                postProcess = function (args) {
                    var parentblk = args[0];
                    var oldBlock = args[1];

                    var blk = that.blockList.length - 1;
                    that.blockList[parentblk].connections[1] = blk;
                    that.blockList[blk].value = that.findUniqueActionName(_('action'));
                    var label = that.blockList[blk].value;
                    if (label.length > 8) {
                        label = label.substr(0, 7) + '...';
                    }
                    that.blockList[blk].text.text = label;
                    that.blockList[blk].container.updateCache();

                    if (that.blockList[blk].value !== that.blockList[oldBlock].value) {

                        that.newNameddoBlock(that.blockList[blk].value, that.actionHasReturn(parentblk), that.actionHasArgs(parentblk));
                        var blockPalette = that.palettes.dict['action'];
                        for (var b = 0; b < blockPalette.protoList.length; b++) {
                            var protoblock = blockPalette.protoList[b];
                            if (protoblock.name === 'nameddo' && protoblock.defaults[0] === that.blockList[oldBlock].value) {
                                setTimeout(function () {
                                    blockPalette.remove(protoblock, that.blockList[oldBlock].value);
                                    delete that.protoBlockDict['myDo_' + that.blockList[oldBlock].value];
                                    that.palettes.hide();
                                    that.palettes.updatePalettes('action');
                                    that.palettes.show();
                                }, 500);

                                break;
                            }
                        }

                        that.renameNameddos(that.blockList[oldBlock].value, that.blockList[blk].value);
                        if (skipOldBlock) {
                            that.renameDos(that.blockList[oldBlock].value, that.blockList[blk].value, oldBlock);
                        } else {
                            that.renameDos(that.blockList[oldBlock].value, that.blockList[blk].value);
                        }
                    }

                    that.adjustDocks(parentblk, true);
                };

                this._makeNewBlockWithConnections('text', 0, [parentblk], postProcess, [parentblk, oldBlock], false);
            }
            return;
        }

        if (['newnote', 'osctime'].indexOf(this.blockList[parentblk].name) !== -1) {
            var cblk = this.blockList[parentblk].connections[2];
            if (cblk == null) {
                var blkname = 'vspace';
                var newVspaceBlock = this.makeBlock(blkname, '__NOARG__');
                this.blockList[parentblk].connections[2] = newVspaceBlock;
                this.blockList[newVspaceBlock].connections[0] = parentblk;
                var blkname = 'rest2';
                var newSilenceBlock = this.makeBlock(blkname, '__NOARG__');
                this.blockList[newSilenceBlock].connections[0] = newVspaceBlock;
                this.blockList[newSilenceBlock].connections[1] = null;
                this.blockList[newVspaceBlock].connections[1] = newSilenceBlock;
            } else if (this.blockList[cblk].name === 'vspace' && this.blockList[cblk].connections[1] == null) {
                var blkname = 'rest2';
                var newSilenceBlock = this.makeBlock(blkname, '__NOARG__');
                this.blockList[newSilenceBlock].connections[0] = cblk;
                this.blockList[newSilenceBlock].connections[1] = null;
                this.blockList[cblk].connections[1] = newSilenceBlock;
            }
            return;
        }
    };

    this.deleteNextDefault = function (thisBlock) {
        // Remove the Silence block from a Note block if another block
        // is inserted above the silence block.
        var thisBlockobj = this.blockList[thisBlock];
        for (var i = 1; i < thisBlockobj.connections.length; i++) {
            if (thisBlockobj.connections[i] && this.blockList[thisBlockobj.connections[i]].name === 'rest2') {
                var silenceBlock = thisBlockobj.connections[i];
                var silenceBlockobj = this.blockList[silenceBlock];
                silenceBlockobj.hide();
                silenceBlockobj.trash = true;
                this.blockList[thisBlock].connections[i] = silenceBlockobj.connections[1];
                break;
            }
        }
    };

    this.deletePreviousDefault = function (thisBlock) {
        // Remove the Silence block from a Note block if another block
        // is inserted just after the Silence block.
        var thisBlockobj = this.blockList[thisBlock];
        if (thisBlockobj && this.blockList[thisBlockobj.connections[0]] && this.blockList[thisBlockobj.connections[0]].name === 'rest2') {
            var silenceBlock = thisBlockobj.connections[0];
            var silenceBlockobj = this.blockList[silenceBlock];
            silenceBlockobj.hide();
            silenceBlockobj.trash = true;

            for (var i = 0; i < this.blockList[silenceBlockobj.connections[0]].connections.length; i++) {
                if (this.blockList[silenceBlockobj.connections[0]].connections[i] === silenceBlock) {
                    this.blockList[silenceBlockobj.connections[0]].connections[i] = thisBlock;
                    break;
                }
            }

        thisBlockobj.connections[0] = silenceBlockobj.connections[0];
        }

        return thisBlockobj.connections[0];
    };

    this.blockMoved = function (thisBlock) {
        // When a block is moved, we have lots of things to check:
        // (0) Is it inside of a expandable block?
        //     Is it an arg inside an arg clamp?
        // (1) Is it an arg block connected to a two-arg block?
        // (2) Disconnect its connection[0];
        // (3) Look for a new connection;
        //     Is it potentially an arg inside an arg clamp?
        // (4) Is it an arg block connected to a 2-arg block?
        // (5) Is it a pitch block being inserted or removed from
        //     a Note clamp? In which case, we may have to remove
        //     or add a silence block.
        // (6) Is it the name of an action block? In which case we
        //     need to check to see if we need to rename it.
        // (7) And we need to recheck if it inside of a expandable block.

        // Find any containing expandable blocks.
        this._clampBlocksToCheck = [];
        if (thisBlock == null) {
            console.log('blockMoved called with null block.');
            return;
        }

        var blk = this._insideExpandableBlock(thisBlock);
        var expandableLoopCounter = 0;

        var parentblk = null;
        if (blk != null) {
            parentblk = blk;
        }

        var actionCheck = false;

        while (blk != null) {
            expandableLoopCounter += 1;
            if (expandableLoopCounter > 2 * this.blockList.length) {
                console.log('Infinite loop encountered checking for expandables?');
                break;
            }

            this._clampBlocksToCheck.push([blk, 0]);
            blk = this._insideExpandableBlock(blk);
        }

        this._checkTwoArgBlocks = [];
        var checkArgBlocks = [];
        var myBlock = this.blockList[thisBlock];
        if (myBlock == null) {
            console.log('null block found in blockMoved method: ' + thisBlock);
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
            if (this.blockList[c].isTwoArgBlock() || this.blockList[c].isArgClamp()) {
                if (cBlock.connections[1] === thisBlock) {
                    this._checkTwoArgBlocks.push(c);
                }
            } else if (this.blockList[c].isArgBlock() && this.blockList[c].isExpandableBlock() || this.blockList[c].isArgClamp()) {
                if (cBlock.connections[1] === thisBlock) {
                    this._checkTwoArgBlocks.push(c);
                }
            }
        }

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
        }

        // Look for a new connection.
        var x1 = myBlock.container.x + myBlock.docks[0][0];
        var y1 = myBlock.container.y + myBlock.docks[0][1];

        // Find the nearest dock; if it is close enough, make the
        // connection.
        var newBlock = null;
        var newConnection = null;
        var min = (MINIMUMDOCKDISTANCE/DEFAULTBLOCKSCALE) * this.blockScale;
        var blkType = myBlock.docks[0][2];

        // Is the added block above the silence block or below?
        var insertAfterDefault = true;

        for (var b = 0; b < this.blockList.length; b++) {
            // Don't connect to yourself.
            if (b === thisBlock) {
                continue;
            }

            // Don't connect to a collapsed block.
            if (this.blockList[b].collapsed) {
                continue;
            }

            // Don't connect to a block in the trash.
            if (this.blockList[b].trash) {
                continue;
            }

            for (var i = 1; i < this.blockList[b].connections.length; i++) {
                // When converting from Python projects to JS format,
                // sometimes extra null connections are added. We need
                // to ignore them.
                if (i === this.blockList[b].docks.length) {
                    break;
                }

                if ((i === this.blockList[b].connections.length - 1) && (this.blockList[b].connections[i] != null) && (this.blockList[this.blockList[b].connections[i]].isNoHitBlock())) {
                    // Don't break the connection between a block and
                    // a hidden block below it.
                    continue;
                } else if ((['backward', 'status'].indexOf(this.blockList[b].name) !== -1) && (i === 1) && (this.blockList[b].connections[1] != null) && (this.blockList[this.blockList[b].connections[1]].isNoHitBlock())) {
                    // Don't break the connection betweem a backward
                    // block and a hidden block attached to its clamp.
                    continue;
                } else if (this.blockList[b].name === 'action' && (i === 2) && (this.blockList[b].connections[2] != null) && (this.blockList[this.blockList[b].connections[2]].isNoHitBlock())) {
                    // Don't break the connection betweem an action
                    // block and a hidden block attached to its clamp.
                    continue;
                }

                // Look for available connections.
                if (this._testConnectionType(blkType, this.blockList[b].docks[i][2])) {
                    var x2 = this.blockList[b].container.x + this.blockList[b].docks[i][0];
                    var y2 = this.blockList[b].container.y + this.blockList[b].docks[i][1];
                    var dist = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
                    if (dist < min) {
                        newBlock = b;
                        newConnection = i;
                        min = dist;
                    }
                } else {
                    // TODO: bounce away from illegal connection?
                    // only if the distance was small
                    // console.log('cannot not connect these two block types');
                }
            }
        }

        if (newBlock != null) {
            // We found a match.
            myBlock.connections[0] = newBlock;
            var connection = this.blockList[newBlock].connections[newConnection];
            if (connection == null) {
                if (this.blockList[newBlock].isArgClamp()) {
                    // If it is an arg clamp, we may have to adjust
                    // the slot size.
                    if ((this.blockList[newBlock].name === 'doArg' || this.blockList[newBlock].name === 'calcArg') && newConnection === 1) {
                    } else if (['doArg', 'nameddoArg'].indexOf(this.blockList[newBlock].name) !== -1 && newConnection === this.blockList[newBlock].connections.length - 1) {
                    } else {
                        // Get the size of the block we are inserting
                        // adding.
                        var size = this._getBlockSize(thisBlock);
                        // console.log('inserting block of size ' + size + ' to arg clamp ' + this.blockList[newBlock].name);
                        // Get the current slot list.
                        var slotList = this.blockList[newBlock].argClampSlots;

                        // Which slot is this block in?
                        if (['doArg', 'calcArg'].indexOf(this.blockList[newBlock].name) !== -1) {
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
                // block or a pitch block.
                insertAfterDefault = false;
                if (this.blockList[newBlock].isArgClamp()) {
                    if ((this.blockList[newBlock].name === 'doArg' || this.blockList[newBlock].name === 'calcArg') && newConnection === 1) {
                        // If it is the action name then treat it like
                        // a standard replacement.
                        this.blockList[connection].connections[0] = null;
                        this.findDragGroup(connection);
                        for (var c = 0; c < this.dragGroup.length; c++) {
                            this.moveBlockRelative(this.dragGroup[c], 40, 40);
                        }
                    } else if (['doArg', 'nameddoArg'].indexOf(this.blockList[newBlock].name) !== -1 && newConnection === this.blockList[newBlock].connections.length - 1) {
                        // If it is the bottom of the flow, insert as
                        // usual.
                        var bottom = this.findBottomBlock(thisBlock);
                        this.blockList[connection].connections[0] = bottom;
                        this.blockList[bottom].connections[this.blockList[bottom].connections.length - 1] = connection;
                    } else {
                        // Move the block in the current slot down one
                        // slot (cascading and creating a new slot if
                        // necessary).

                        // Get the size of the block we are inserting adding.
                        var size = this._getBlockSize(thisBlock);

                        // Get the current slot list.
                        var slotList = this.blockList[newBlock].argClampSlots;
                        // Which slot is this block in?
                        var ci = this.blockList[newBlock].connections.indexOf(connection);
                        if (['doArg', 'calcArg'].indexOf(this.blockList[newBlock].name) !== -1) {
                            var si = ci - 2;
                        } else {
                            var si = ci - 1;
                        }

                        var emptySlot = null;
                        var emptyConnection = null;
                        // Is there an empty slot below?
                        for (var emptySlot = si; emptySlot < slotList.length; emptySlot++) {
                            if (this.blockList[newBlock].connections[ci + emptySlot - si] == null) {
                                emptyConnection = ci + emptySlot - si;
                                break;
                            }
                        }

                        if (emptyConnection == null) {
                            slotList.push(1);
                            this._newLocalArgBlock(slotList.length);
                            emptyConnection = ci + emptySlot - si;
                            this.blockList[newBlock].connections.push(null);

                            // Slide everything down one slot.
                            for (var i = slotList.length - 1; i > si + 1; i--) {
                                slotList[i] = slotList[i - 1];
                            }
                            for (var i = this.blockList[newBlock].connections.length - 1; i > ci + 1; i--) {
                                this.blockList[newBlock].connections[i] = this.blockList[newBlock].connections[i - 1];
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
                    this.findDragGroup(connection);
                    for (var c = 0; c < this.dragGroup.length; c++) {
                        this.moveBlockRelative(this.dragGroup[c], 40, 40);
                    }

                    // We need to rename the action stack.
                    if (this.blockList[newBlock].name === 'action') {
                        actionCheck = true;

                        if (myBlock.value !== this.blockList[connection].value) {
                            // Temporarily disconnect to ensure we don't
                            // find myBlock when looking for a unique name.
                            var c = myBlock.connections[0];
                            myBlock.connections[0] = null;
                            var name = this.findUniqueActionName(myBlock.value);
                            myBlock.connections[0] = c;

                            if (name !== myBlock.value) {
                                myBlock.value = name;
                                var label = name;
                                if (label.length > 8) {
                                    label = label.substr(0, 7) + '...';
                                }
                                myBlock.text.text = label;
                                myBlock.container.updateCache();
                            }

                            var that = this;
                            setTimeout(function () {
                                // A previously disconnected name may have left
                                // an entry in the palette we need to remove.
                                var name = that.blockList[connection].value;
                                if (that.protoBlockDict['myDo_' + name] != undefined) {
                                    delete that.protoBlockDict['myDo_' + name];
                                    that.palettes.dict['action'].hideMenu(true);
                                }

                                that.newNameddoBlock(myBlock.value, that.actionHasReturn(newBlock), that.actionHasArgs(newBlock));
                                var blockPalette = that.palettes.dict['action'];
                                for (var b = 0; b < blockPalette.protoList.length; b++) {
                                    var protoblock = blockPalette.protoList[b];
                                    if (protoblock.name === 'nameddo' && protoblock.staticLabels[0] === that.blockList[connection].value) {
                                        setTimeout(function () {
                                            blockPalette.remove(protoblock, that.blockList[connection].value);
                                            delete that.protoBlockDict['myDo_' + that.blockList[connection].value];
                                            that.palettes.hide();
                                            that.palettes.updatePalettes('action');
                                            that.palettes.show();
                                        }, 500);

                                        break;
                                    }
                                }

                                that.renameNameddos(that.blockList[connection].value, myBlock.value);
                                that.renameDos(that.blockList[connection].value, myBlock.value);
                            }, 750);
                        }
                    }
                } else if (!this.blockList[thisBlock].isArgFlowClampBlock()) {
                    var bottom = this.findBottomBlock(thisBlock);
                    this.blockList[connection].connections[0] = bottom;
                    this.blockList[bottom].connections[this.blockList[bottom].connections.length - 1] = connection;
                }
            }

            this.blockList[newBlock].connections[newConnection] = thisBlock;

            // Remove the silence block (if it is present) after
            // adding a new block inside of a note block.
            if (this._insideNoteBlock(thisBlock) != null) {
                // If blocks are inserted above the silence block.
                if (insertAfterDefault) {
                    newBlock = this.deletePreviousDefault(thisBlock);
                } else {
                    this.deleteNextDefault(bottom);
                }
            }

            // If we attached a name to an action block, check to see
            // if we need to rename it.
            if (this.blockList[newBlock].name === 'action' && !actionCheck) {
                // Is there already another action block with this name?
                for (var b = 0; b < this.blockList.length; b++) {
                    if (b === newBlock) continue;
                    if (this.blockList[b].name === 'action') {
                        if (this.blockList[b].connections[1] != null) {
                            if (this.blockList[this.blockList[b].connections[1]].value === this.blockList[thisBlock].value) {
                                this.blockList[thisBlock].value = this.findUniqueActionName(this.blockList[thisBlock].value);
                                var label = this.blockList[thisBlock].value;
                                if (label.length > 8) {
                                    label = label.substr(0, 7) + '...';
                                }
                                this.blockList[thisBlock].text.text = label;
                                this.blockList[thisBlock].container.updateCache();
                                this.newNameddoBlock(this.blockList[thisBlock].value, this.actionHasReturn(b), this.actionHasArgs(b));
                                this.setActionProtoVisiblity(false);
                            }
                        }
                    }
                }
            }

            // console.log('Adjust Docks: ' + this.blockList[newBlock].name);
            this.adjustDocks(newBlock, true);
            // TODO: some graphical feedback re new connection?
        }

        // If it is an arg block, where is it coming from?
        // FIXME: improve mechanism for testing block types.
        if ((myBlock.isArgBlock() || myBlock.name === 'calcArg' || myBlock.name === 'namedcalcArg') && newBlock != null) {
            // We care about twoarg blocks with connections to the
            // first arg;
            if (this.blockList[newBlock].isTwoArgBlock()) {
                if (this.blockList[newBlock].connections[1] === thisBlock) {
                    if (this._checkTwoArgBlocks.indexOf(newBlock) === -1) {
                        this._checkTwoArgBlocks.push(newBlock);
                    }
                }
            } else if (this.blockList[newBlock].isArgBlock() && this.blockList[newBlock].isExpandableBlock()) {
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
                if (!this.blockList[newBlock].isArgClamp() && this.blockList[newBlock].docks[n - 1][2] === 'in') {
                    checkArgBlocks.push(newBlock);
                }
            }
        }

        this.addDefaultBlock(parentblk, thisBlock, actionCheck);

        // Put block adjustments inside a slight delay to make the
        // addition/substraction of vspace and changes of block shape
        // appear less abrupt (and it can be a little racy).
        var that = this;
        setTimeout(function () {
            // If we changed the contents of a arg block, we may need a vspace.
            if (checkArgBlocks.length > 0) {
                for (var i = 0; i < checkArgBlocks.length; i++) {
                    that._addRemoveVspaceBlock(checkArgBlocks[i]);
                }
            }

            // If we changed the contents of a two-arg block, we need to
            // adjust it.
            if (that._checkTwoArgBlocks.length > 0) {
                that._adjustExpandableTwoArgBlock(that._checkTwoArgBlocks);
            }

            // First, adjust the docks for any blocks that may have
            // had a vspace added.
            for (var i = 0; i < checkArgBlocks.length; i++) {
                // console.log('Adjust Docks: ' + this.blockList[checkArgBlocks[i]].name);
                that.adjustDocks(checkArgBlocks[i], true);
            }

            // Next, recheck if the connection is inside of a
            // expandable block.
            var blk = that._insideExpandableBlock(thisBlock);
            var expandableLoopCounter = 0;
            while (blk != null) {
                // Extra check for malformed data.
                expandableLoopCounter += 1;
                if (expandableLoopCounter > 2 * that.blockList.length) {
                    console.log('Infinite loop checking for expandables?');
                    console.log(that.blockList);
                    break;
                }

                if (that.blockList[blk].name === 'ifthenelse') {
                    that._clampBlocksToCheck.push([blk, 0]);
                    that._clampBlocksToCheck.push([blk, 1]);
                } else {
                    that._clampBlocksToCheck.push([blk, 0]);
                }

                blk = that._insideExpandableBlock(blk);
            }

            that._adjustExpandableClampBlock();
            that.refreshCanvas();
        }, 250);
    };

    this._testConnectionType = function (type1, type2) {
        // Can these two blocks dock?
        if (type1 === 'in' && type2 === 'out') {
            return true;
        }
        if (type1 === 'out' && type2 === 'in') {
            return true;
        }
        if (type1 === 'numberin' && ['numberout', 'anyout'].indexOf(type2) !== -1) {
            return true;
        }
        if (['numberout', 'anyout'].indexOf(type1) !== -1 && type2 === 'numberin') {
            return true;
        }
        if (type1 === 'textin' && ['textout', 'anyout'].indexOf(type2) !== -1) {
            return true;
        }
        if (['textout', 'anyout'].indexOf(type1) !== -1 && type2 === 'textin') {
            return true;
        }
        if (type1 === 'booleanout' && type2 === 'booleanin') {
            return true;
        }
        if (type1 === 'booleanin' && type2 === 'booleanout') {
            return true;
        }
        if (type1 === 'mediain' && type2 === 'mediaout') {
            return true;
        }
        if (type1 === 'mediaout' && type2 === 'mediain') {
            return true;
        }
        if (type1 === 'mediain' && type2 === 'textout') {
            return true;
        }
        if (type2 === 'mediain' && type1 === 'textout') {
            return true;
        }
        if (type1 === 'filein' && type2 === 'fileout') {
            return true;
        }
        if (type1 === 'fileout' && type2 === 'filein') {
            return true;
        }
        if (type1 === 'solfegein' && ['anyout', 'solfegeout', 'textout', 'noteout', 'numberout'].indexOf(type2) !== -1) {
            return true;
        }
        if (type2 === 'solfegein' && ['anyout', 'solfegeout', 'textout', 'noteout', 'numberout'].indexOf(type1) !== -1) {
            return true;
        }
        if (type1 === 'notein' && ['solfegeout', 'textout', 'noteout'].indexOf(type2) !== -1) {
            return true;
        }
        if (type2 === 'notein' && ['solfegeout', 'textout', 'noteout'].indexOf(type1) !== -1) {
            return true;
        }
        if (type1 === 'anyin' && ['textout', 'mediaout', 'numberout', 'anyout', 'fileout', 'solfegeout', 'noteout'].indexOf(type2) !== -1) {
            return true;
        }
        if (type2 === 'anyin' && ['textout', 'mediaout', 'numberout', 'anyout', 'fileout', 'solfegeout', 'noteout'].indexOf(type1) !== -1) {
            return true;
        }
        return false;
    };

    this.updateBlockPositions = function () {
        // Create the block image if it doesn't yet exist.
        for (var blk = 0; blk < this.blockList.length; blk++) {
            this._moveBlock(blk, this.blockList[blk].container.x, this.blockList[blk].container.y);
        }
    };

    this.bringToTop = function () {
        // Move all the blocks to the top layer of the stage
        this._adjustTheseStacks = [];

        for (var blk in this.blockList) {
            var myBlock = this.blockList[blk];
            /*
            this.stage.removeChild(myBlock.container);
            this.stage.addChild(myBlock.container);
            if (myBlock.collapseContainer != null) {
                this.stage.removeChild(myBlock.collapseContainer);
                this.stage.addChild(myBlock.collapseContainer);
            }
            */
            if (myBlock.connections[0] == null) {
                this._adjustTheseStacks.push(blk);
            }
        }
        for (var blk = 0; blk < this._adjustTheseStacks.length; blk++) {
            // console.log('Adjust Stack: ' + this.blockList[this._adjustTheseStacks[blk]].name);
            this.raiseStackToTop(this._adjustTheseStacks[blk]);
        }

        this.refreshCanvas();
    };

    this.checkBounds = function () {
        var onScreen = true;
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].connections[0] == null) {
                if (this.blockList[blk].offScreen(this.boundary)) {
                    this._homeButtonContainers[0].visible = true;
                    this._homeButtonContainers[1].visible = false;
                    this.boundary.show();
                    onScreen = false;
                    break;
                }
            }
        }
        if (onScreen) {
            this._homeButtonContainers[0].visible = false;
            this._homeButtonContainers[1].visible = true;
            this.boundary.hide();
        }
    };

    this._moveBlock = function (blk, x, y) {
        // Move a block (and its label) to x, y.
        var myBlock = this.blockList[blk];
        if (myBlock.container != null) {
            myBlock.container.x = x;
            myBlock.container.y = y;

            if (myBlock.collapseContainer != null) {
                myBlock.collapseContainer.x = x + COLLAPSEBUTTONXOFF * (this.blockList[blk].protoblock.scale / 2);
                myBlock.collapseContainer.y = y + COLLAPSEBUTTONYOFF * (this.blockList[blk].protoblock.scale / 2);
            }

            this.checkBounds();
        } else {
            console.log('No container yet for block ' + myBlock.name);
        }
    };

    this.moveBlockRelative = function (blk, dx, dy) {
        // Move a block (and its label) by dx, dy.
        if (this.inLongPress) {
            this.saveStackButton.visible = false;
            this.dismissButton.visible = false;
            this.inLongPress = false;
        }

        var myBlock = this.blockList[blk];
        if (myBlock.container != null) {
            myBlock.container.x += dx;
            myBlock.container.y += dy;

            if (myBlock.collapseContainer != null) {
                myBlock.collapseContainer.x += dx;
                myBlock.collapseContainer.y += dy;
            }

            this.checkBounds();
        } else {
            console.log('No container yet for block ' + myBlock.name);
        }
    };

    this.moveStackRelative = function (blk, dx, dy) {
        this.findDragGroup(blk)
        if (this.dragGroup.length > 0) {
            for (var b = 0; b < this.dragGroup.length; b++) {
                this.moveBlockRelative(this.dragGroup[b], dx, dy);
            }
        }
    };

    this.updateBlockText = function (blk) {
        // When we create new blocks, we may not have assigned the
        // value yet.
        var myBlock = this.blockList[blk];
        var maxLength = 8;
        if (myBlock.text == null) {
            return;
        }

        if (myBlock.name === 'loadFile') {
            try {
                var label = myBlock.value[0].toString();
            } catch (e) {
                var label = _('open file');
            }
            maxLength = 10;
        } else if (myBlock.name === 'solfege') {
            var obj = splitSolfege(myBlock.value);
            var label = i18nSolfege(obj[0]);
            var attr = obj[1];

            if (attr !== '♮') {
                label += attr;
            }
        } else if (myBlock.name === 'eastindiansolfege') {
            var obj = splitSolfege(myBlock.value);
            var label = WESTERN2EISOLFEGENAMES[obj[0]];
            var attr = obj[1];

            if (attr !== '♮') {
                label += attr;
            }
        } else {
            var label = myBlock.value.toString();
        }

        if (label.length > maxLength) {
            label = label.substr(0, maxLength - 1) + '...';
        }

        myBlock.text.text = label;

        // Make sure text is on top.
        var z = myBlock.container.getNumChildren() - 1;
        myBlock.container.setChildIndex(myBlock.text, z);

        if (myBlock.loadComplete) {
            myBlock.container.updateCache();
        } else {
            console.log('Load not yet complete for (' + blk + ') ' + myBlock.name);
        }
    };

    this.findTopBlock = function (blk) {
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
        if (myBlock.connections.length > 1 && myBlock.connections[0] != null && myBlock.connections[0] === last(myBlock.connections)) {
            console.log('WARNING: CORRUPTED BLOCK DATA. Block ' + myBlock.name + ' (' + blk + ') is connected to the same block ' + this.blockList[myBlock.connections[0]].name + ' (' + myBlock.connections[0] + ') twice.');
            return blk;
        }

        var topBlockLoop = 0;
        while (myBlock.connections[0] != null) {
            topBlockLoop += 1;
            if (topBlockLoop > 2 * this.blockList.length) {
                // Could happen if the block data is malformed.
                console.log('infinite loop finding topBlock?');
                console.log(this.blockList.indexOf(myBlock) + ' ' + myBlock.name);
                break;
            }
            blk = myBlock.connections[0];
            myBlock = this.blockList[blk];
        }
        return blk;
    };

    this.sameGeneration = function (firstBlk, childBlk) {
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
                console.log('infinite loop finding bottomBlock?');
                break;
            }
            blk = last(myBlock.connections);
            myBlock = this.blockList[blk];
            if (blk === childBlk) {
                return true;
            }
        }
        return false;
    }

    this.findBottomBlock = function (blk) {
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
                console.log('infinite loop finding bottomBlock?');
                break;
            }
            blk = last(myBlock.connections);
            myBlock = this.blockList[blk];
        }
        return blk;
    };

    this.findStacks = function () {
        // Find any blocks with null in the first connection.
        this.stackList = [];
        for (var i = 0; i < this.blockList.length; i++) {
            if (this.blockList[i].connections[0] == null) {
                this.stackList.push(i)
            }
        }
    };

    this._findClamps = function () {
        // Find any clamp blocks.
        this._expandablesList = [];
        this.findStacks(); // We start by finding the stacks
        for (var i = 0; i < this.stackList.length; i++) {
            this._searchCounter = 0;
            this._searchForExpandables(this.stackList[i]);
        }

        this._searchForArgFlow();
    };

    this._findTwoArgs = function () {
        // Find any expandable arg blocks.
        this._expandablesList = [];
        for (var i = 0; i < this.blockList.length; i++) {
            if (this.blockList[i].isArgBlock() && this.blockList[i].isExpandableBlock()) {
                this._expandablesList.push(i);
            } else if (this.blockList[i].isTwoArgBlock()) {
                this._expandablesList.push(i);
            }
        }
    };

    this._searchForArgFlow = function () {
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].isArgFlowClampBlock()) {
                this._expandablesList.push(blk);
            }
        }
    };

    this._searchForExpandables = function (blk) {
        // Find the expandable blocks below blk in a stack.
        while (blk != null && this.blockList[blk] != null && !this.blockList[blk].isValueBlock()) {
            // More checks for malformed or corrupted block data.
            this._searchCounter += 1;
            if (this._searchCounter > 2 * this.blockList.length) {
                console.log('infinite loop searching for Expandables? ' + this._searchCounter);
                console.log(blk + ' ' + this.blockList[blk].name);
                break;
            }

            if (this.blockList[blk].isClampBlock()) {
                this._expandablesList.push(blk);
                var c = this.blockList[blk].connections.length - 2;
                this._searchForExpandables(this.blockList[blk].connections[c]);
                if (this.blockList[blk].name === 'ifthenelse') {
                    // search top clamp too
                    var c = 2;
                    this._searchForExpandables(this.blockList[blk].connections[c]);
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

    this._expandTwoArgs = function () {
        // Expand expandable 2-arg blocks as needed.
        this._findTwoArgs();
        this._adjustExpandableTwoArgBlock(this._expandablesList);
        this.refreshCanvas();
    };

    this._expandClamps = function () {
        // Expand expandable clamp blocks as needed.
        this._findClamps();
        this._clampBlocksToCheck = [];
        for (var i = 0; i < this._expandablesList.length; i++) {
            if (this.blockList[this._expandablesList[i]].name === 'ifthenelse') {
                this._clampBlocksToCheck.push([this._expandablesList[i], 0]);
                this._clampBlocksToCheck.push([this._expandablesList[i], 1]);
            } else {
                this._clampBlocksToCheck.push([this._expandablesList[i], 0]);
            }
        }

        this._adjustExpandableClampBlock();
        this.refreshCanvas();
    };

    this.changeDisabledStatus = function (name, flag) {
        // Some blocks, e.g., sensor blocks for Butia, change their
        // appearance depending upon if they have been enabled or
        // disabled.
        for (var blk in this.blockList) {
            var myBlock = this.blockList[blk];
            if (myBlock.name === name) {
                myBlock.protoblock.disabled = flag;
                myBlock.regenerateArtwork(false);
            }
        }
    };

    this.unhighlightAll = function () {
        for (var blk in this.blockList) {
            this.unhighlight(blk);
        }
    };

    this.unhighlight = function (blk) {
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
        if (this.highlightedBlock = thisBlock) {
            this.highlightedBlock = null;
        }
    };

    this.highlight = function (blk, unhighlight) {
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

    this.hide = function () {
        for (var blk in this.blockList) {
            this.blockList[blk].hide();
        }
        this.visible = false;
    };

    this.show = function () {
        for (var blk in this.blockList) {
            this.blockList[blk].show();
        }
        this.visible = true;
    };

    this._makeNewBlockWithConnections = function (name, blockOffset, connections, postProcess, postProcessArg, collapsed) {
        if (typeof(collapsed) === 'undefined') {
            collapsed = false
        }
        myBlock = this.makeNewBlock(name, postProcess, postProcessArg);
        if (myBlock == null) {
            console.log('could not make block ' + name);
            return;
        }

        // myBlock.collapsed = !collapsed;
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

    this.makeNewBlock = function (name, postProcess, postProcessArg) {
        // Create a new block
        if (!name in this.protoBlockDict) {
            // Should never happen: nop blocks should be substituted
            console.log('makeNewBlock: no prototype for ' + name);
            return null;
        }

        if (this.protoBlockDict[name] == null) {
            // Should never happen
            console.log('makeNewBlock: no prototype for ' + name);
            return null;
        }

        // Deprecated
        // If we drag in a synth block, we need to load the synth.
        if (['sine', 'sawtooth', 'triangle', 'square'].indexOf(name) !== -1) {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.logo.synth.loadSynth(name);
            }
        }

        if (['namedbox', 'nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg'].indexOf(name) !== -1) {
            this.blockList.push(new Block(this.protoBlockDict[name], this, postProcessArg[1]));
        } else if (name === 'namedarg') {
            this.blockList.push(new Block(this.protoBlockDict[name], this, 'arg ' + postProcessArg[1]));
        } else {
            this.blockList.push(new Block(this.protoBlockDict[name], this));
        }

        if (last(this.blockList) == null) {
            // Should never happen
            console.log('failed to make protoblock for ' + name);
            return null;
        }

        // We copy the dock because expandable blocks modify it.
        var myBlock = last(this.blockList);
        myBlock.copySize();

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

    this.makeBlock = function (name, arg) {
        // Make a new block from a proto block.
        // Called from palettes.

        if (name === 'text') {
            console.log('makeBlock ' + name + ' ' + arg);
        }
        var postProcess = null;
        var postProcessArg = null;
        var that = this;
        var thisBlock = this.blockList.length;
        if (name === 'start') {
            postProcess = function (thisBlock) {
                that.blockList[thisBlock].value = that.turtles.turtleList.length;
                that.turtles.addTurtle(that.blockList[thisBlock]);
            };

            postProcessArg = thisBlock;
        } else if (name === 'drum') {
            postProcess = function (thisBlock) {
                that.blockList[thisBlock].value = that.turtles.turtleList.length;
                that.turtles.addDrum(that.blockList[thisBlock]);
            };

            postProcessArg = thisBlock;
        } else if (name === 'text') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = value;
                that.blockList[thisBlock].text.text = value;
                that.blockList[thisBlock].container.updateCache();
            };

            postProcessArg = [thisBlock, _('text')];
        } else if (name === 'solfege') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = value;
                that.blockList[thisBlock].text.text = value;
                that.blockList[thisBlock].container.updateCache();
            };

            postProcessArg = [thisBlock, 'sol'];
        } else if (name === 'eastindiansolfege') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = value;
                that.blockList[thisBlock].text.text = WESTERN2EISOLFEGENAMES[value];
                that.blockList[thisBlock].container.updateCache();
            };

            postProcessArg = [thisBlock, 'sol'];
        } else if (name === 'notename') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = value;
                that.blockList[thisBlock].text.text = value;
                that.blockList[thisBlock].container.updateCache();
            };

            postProcessArg = [thisBlock, 'G'];
        } else if (name === 'drumname') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = value;
                that.blockList[thisBlock].text.text = value;
                that.blockList[thisBlock].container.updateCache();
            };

            postProcessArg = [thisBlock, 'kick'];
        } else if (name === 'voicename') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = value;
                that.blockList[thisBlock].text.text = value;
                that.blockList[thisBlock].container.updateCache();
            };

            postProcessArg = [thisBlock, 'sine'];
        } else if (name === 'modename') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = value;
                that.blockList[thisBlock].text.text = value;
                that.blockList[thisBlock].container.updateCache();
            };

            postProcessArg = [thisBlock, 'Major'];
        } else if (name === 'number') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = Number(args[1]);
                that.blockList[thisBlock].value = value;
                that.blockList[thisBlock].text.text = value.toString();
                that.blockList[thisBlock].container.updateCache();
            };

            postProcessArg = [thisBlock, NUMBERBLOCKDEFAULT];
        } else if (name === 'media') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = value;
                if (value == null) {
                    that.blockList[thisBlock].image = 'images/load-media.svg';
                } else {
                    that.blockList[thisBlock].image = null;
                }
            };

            postProcessArg = [thisBlock, null];
        } else if (name === 'camera') {
            postProcess = function (args) {
                console.log('post process camera ' + args[1]);
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = CAMERAVALUE;
                if (value == null) {
                    that.blockList[thisBlock].image = 'images/camera.svg';
                } else {
                    that.blockList[thisBlock].image = null;
                }
            };

            postProcessArg = [thisBlock, null];
        } else if (name === 'video') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                that.blockList[thisBlock].value = VIDEOVALUE;
                if (value == null) {
                    that.blockList[thisBlock].image = 'images/video.svg';
                } else {
                    that.blockList[thisBlock].image = null;
                }
            };

            postProcessArg = [thisBlock, null];
        } else if (name === 'loadFile') {
            postProcess = function (args) {
                that.updateBlockText(args[0]);
            };

            postProcessArg = [thisBlock, null];
        } else if (['namedbox', 'nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg', 'namedarg'].indexOf(name) !== -1) {
            postProcess = function (args) {
                that.blockList[thisBlock].value = null;
                that.blockList[thisBlock].privateData = args[1];
            };

            postProcessArg = [thisBlock, arg];
        }

        var protoFound = false;
        for (var proto in that.protoBlockDict) {
            if (that.protoBlockDict[proto].name === name) {
                if (arg === '__NOARG__') {
                    that.makeNewBlock(proto, postProcess, postProcessArg);
                    protoFound = true;
                    break;
                } else if (that.protoBlockDict[proto].defaults[0] === arg) {
                    that.makeNewBlock(proto, postProcess, postProcessArg);
                    protoFound = true;
                    break;
                } else if (['namedbox', 'nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg', 'namedarg'].indexOf(name) !== -1) {
                    if (that.protoBlockDict[proto].defaults[0] === undefined) {
                        that.makeNewBlock(proto, postProcess, postProcessArg);
                        protoFound = true;
                        break;
                    }
                }
            }
        }

        if (!protoFound) {
            console.log(name + ' not found!!');
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

            if (myBlock.name === 'action') {
                // Make sure we don't make two actions with the same name.
                value = this.findUniqueActionName(_('action'));
                if (value !== _('action')) {
                    // TODO: are there return or arg blocks?
                    this.newNameddoBlock(value, false, false);
                    this.palettes.hide();
                    this.palettes.updatePalettes('action');
                    this.palettes.show();
                }
            }

            var that = this;
            var thisBlock = this.blockList.length;
            if (myBlock.docks.length > i && myBlock.docks[i + 1][2] === 'anyin') {
                if (value == null) {
                    console.log('cannot set default value');
                } else if (typeof(value) === 'string') {
                    postProcess = function (args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        that.blockList[thisBlock].value = value;
                        var label = value.toString();
                        if (label.length > 8) {
                            label = label.substr(0, 7) + '...';
                        }
                        that.blockList[thisBlock].text.text = label;
                        that.blockList[thisBlock].container.updateCache();
                    };

                    this.makeNewBlock('text', postProcess, [thisBlock, value]);
                } else {
                    postProcess = function (args) {
                        var thisBlock = args[0];
                        var value = Number(args[1]);
                        that.blockList[thisBlock].value = value;
                        that.blockList[thisBlock].text.text = value.toString();
                    };

                    this.makeNewBlock('number', postProcess, [thisBlock, value]);
                }
            } else if (myBlock.docks[i + 1][2] === 'textin') {
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    var label = value.toString();
                    if (label.length > 8) {
                        label = label.substr(0, 7) + '...';
                    }
                    that.blockList[thisBlock].text.text = label;
                };

                this.makeNewBlock('text', postProcess, [thisBlock, value]);
            } else if (myBlock.docks[i + 1][2] === 'solfegein') {
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    var label = value.toString();
                    that.blockList[thisBlock].text.text = label;
                };

                this.makeNewBlock('solfege', postProcess, [thisBlock, value]);
            } else if (myBlock.docks[i + 1][2] === 'notein') {
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    var label = value.toString();
                    that.blockList[thisBlock].text.text = label;
                };

                this.makeNewBlock('notename', postProcess, [thisBlock, value]);
            } else if (myBlock.docks[i + 1][2] === 'mediain') {
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    if (value != null) {
                        // loadThumbnail(that, thisBlock, null);
                    }
                };

                this.makeNewBlock('media', postProcess, [thisBlock, value]);
            } else if (myBlock.docks[i + 1][2] === 'filein') {
                postProcess = function (blk) {
                    that.updateBlockText(blk);
                }
                this.makeNewBlock('loadFile', postProcess, thisBlock);
            } else {
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    that.blockList[thisBlock].text.text = value.toString();
                };

                this.makeNewBlock('number', postProcess, [thisBlock, value]);
            }

            var myConnectionBlock = this.blockList[cblk + i];
            myConnectionBlock.connections = [blk];
            myConnectionBlock.value = value;
            myBlock.connections[i + 1] = cblk + i;
        }

        // Generate and position the block bitmaps and labels
        this.updateBlockPositions();
        // console.log('Adjust Docks: ' + this.blockList[blk].name);
        this.adjustDocks(blk, true);
        this.refreshCanvas();

        return blk;
    };

    this.findDragGroup = function (blk) {
        // Generate a drag group from blocks connected to blk
        this.dragLoopCounter = 0;
        this.dragGroup = [];
        this._calculateDragGroup(blk);
    };

    this._calculateDragGroup = function (blk) {
        // Give a block, find all the blocks connected to it
        this.dragLoopCounter += 1;
        if (this.dragLoopCount > this.blockList.length) {
            console.log('maximum loop counter exceeded in calculateDragGroup... this is bad. ' + blk);
            return;
        }

        if (blk == null) {
            console.log('null block passed to calculateDragGroup');
            return;
        }

        var myBlock = this.blockList[blk];
        // If this happens, something is really broken.
        if (myBlock == null) {
            console.log('null block encountered... this is bad. ' + blk);
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

    this.setActionProtoVisiblity = function (state) {
        // By default, the nameddo protoblock is hidden.
        var actionsPalette = this.palettes.dict['action'];
        var stateChanged = false;
        for (var blockId = 0; blockId < actionsPalette.protoList.length; blockId++) {
            var block = actionsPalette.protoList[blockId];
            if ('nameddo' === block.name && block.defaults.length === 0) {
                if (block.hidden === state) {
                    block.hidden = !state;
                    stateChanged = true;
                }
            }
        }

        // Force an update if the name has changed.
        if (stateChanged) {
            this.palettes.hide();
            this.palettes.updatePalettes('action');
            this.palettes.show();
        }
    };

    this.findUniqueActionName = function (name) {
        // If we have a stack named 'action', make the protoblock visible.
        if (name === _('action')) {
            this.setActionProtoVisiblity(true);
        }

        // Make sure we don't make two actions with the same name.
        var actionNames = [];
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if ((this.blockList[blk].name === 'text' || this.blockList[blk].name === 'string') && !this.blockList[blk].trash) {
                var c = this.blockList[blk].connections[0];
                if (c != null && this.blockList[c].name === 'action' && !this.blockList[c].trash) {
                    actionNames.push(this.blockList[blk].value);
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

    this._findDrumURLs = function () {
        // Make sure we initialize any drum with a URL name.
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].name === 'text' || this.blockList[blk].name === 'string') {
                var c = this.blockList[blk].connections[0];
                if (c != null && ['playdrum', 'setdrum', 'setvoice'].indexOf(this.blockList[c].name) !== -1) {
                    if (this.blockList[blk].value.slice(0, 4) === 'http') {
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            this.logo.synth.loadSynth(this.blockList[blk].value);
                        }
                    }
                }
            }
        }
    };

    this.renameBoxes = function (oldName, newName) {
        if (oldName === newName) {
            return;
        }
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].name === 'text') {
                var c = this.blockList[blk].connections[0];
                if (c != null && this.blockList[c].name === 'box') {
                    if (this.blockList[blk].value === oldName) {
                        this.blockList[blk].value = newName;
                        this.blockList[blk].text.text = newName;
                        try {
                            this.blockList[blk].container.updateCache();
                        } catch (e) {
                            console.log(e);
                        }
                    }
                }
            }
        }
    };

    this.renameNamedboxes = function (oldName, newName) {
        if (oldName === newName) {
            return;
        }

        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].name === 'namedbox') {
                if (this.blockList[blk].privateData === oldName) {
                    this.blockList[blk].privateData = newName;
                    this.blockList[blk].overrideName = newName;
                    this.blockList[blk].regenerateArtwork();
                    // Update label...
                    try {
                        this.blockList[blk].container.updateCache();
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
        }

        // Update the palette
        var blockPalette = this.palettes.dict['boxes'];
        var nameChanged = false;
        for (var blockId = 0; blockId < blockPalette.protoList.length; blockId++) {
            var block = blockPalette.protoList[blockId];
            if (block.name === 'namedbox' && block.defaults[0] !== _('box') && block.defaults[0] === oldName) {
                // console.log('renaming ' + block.defaults[0] + ' to ' + newName);
                block.defaults[0] = newName;
                nameChanged = true;
            }
        }

        // Force an update if the name has changed.
        if (nameChanged) {
            this.palettes.hide();
            this.palettes.updatePalettes('boxes');
            this.palettes.show();
        }
    };

    this.renameDos = function (oldName, newName, skipBlock) {
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

            if (['do', 'calc', 'doArg', 'calcArg', 'action'].indexOf(blkParent.name) === -1) {
                continue;
            }

            var blockValue = myBlock.value;
            if (blockValue === oldName) {
                myBlock.value = newName;
                var label = myBlock.value;
                if (label.length > 8) {
                    label = label.substr(0, 7) + '...';
                }
                myBlock.text.text = label;
                myBlock.container.updateCache();
            }
        }
    };

    this.renameNameddos = function (oldName, newName) {
        if (oldName === newName) {
            return;
        }

        // Update the blocks, do->oldName should be do->newName
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (['nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg'].indexOf(this.blockList[blk].name) !== -1) {
                if (this.blockList[blk].privateData === oldName) {
                    this.blockList[blk].privateData = newName;
                    var label = newName;
                    if (label.length > 8) {
                        label = label.substr(0, 7) + '...';
                    }

                    this.blockList[blk].overrideName = label;
                    // console.log('regenerating artwork for ' + this.blockList[blk].name + ' block[' + blk + ']: ' + oldName + ' -> ' + label);
                    this.blockList[blk].regenerateArtwork();
                }
            }
        }

        // Update the palette
        var actionsPalette = this.palettes.dict['action'];
        var nameChanged = false;
        for (var blockId = 0; blockId < actionsPalette.protoList.length; blockId++) {
            var block = actionsPalette.protoList[blockId];
            if (['nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg'].indexOf(block.name) !== -1 /* && block.defaults[0] !== _('action') */ && block.defaults[0] === oldName) {
                // console.log('renaming ' + block.name + ': ' + block.defaults[0] + ' to ' + newName);
                block.defaults[0] = newName;
                nameChanged = true;
            }
        }

        // Force an update if the name has changed.
        if (nameChanged) {
            this.palettes.hide();
            this.palettes.updatePalettes('action');
            this.palettes.show();
        }
    };

    this.newStoreinBlock = function (name) {
        if (name == null) {
            console.log('null name passed to newStoreinBlock');
            return;
        } else if (name == undefined) {
            console.log('undefined name passed to newStoreinBlock');
            return;
        } else if ('myStorein_' + name in this.protoBlockDict) {
            return;
        }

        // console.log('new storein block ' + name);
        var myStoreinBlock = new ProtoBlock('storein');
        this.protoBlockDict['myStorein_' + name] = myStoreinBlock;
        myStoreinBlock.palette = this.palettes.dict['boxes'];
        myStoreinBlock.defaults.push(name);
        myStoreinBlock.defaults.push(NUMBERBLOCKDEFAULT);
        myStoreinBlock.staticLabels.push(_('store in'), _('name'), _('value'));
        myStoreinBlock.adjustWidthToLabel();
        myStoreinBlock.twoArgBlock();
        myStoreinBlock.dockTypes[1] = 'anyin';
        myStoreinBlock.dockTypes[2] = 'anyin';
        if (name === 'box') {
            return;
        }

        // Add the new block to the top of the palette.
        myStoreinBlock.palette.add(myStoreinBlock, true);
    };

    this.newNamedboxBlock = function (name) {
        if (name == null) {
            console.log('null name passed to newNamedboxBlock');
            return;
        } else if (name == undefined) {
            console.log('undefined name passed to newNamedboxBlock');
            return;
        } else if ('myBox_' + name in this.protoBlockDict) {
            return;
        }

        var myBoxBlock = new ProtoBlock('namedbox');
        this.protoBlockDict['myBox_' + name] = myBoxBlock;
        myBoxBlock.palette = this.palettes.dict['boxes'];
        myBoxBlock.defaults.push(name);
        myBoxBlock.staticLabels.push(name);
        myBoxBlock.parameterBlock();
        if (name === 'box') {
            return;
        }

        // Add the new block to the top of the palette.
        myBoxBlock.palette.add(myBoxBlock, true);
    };

    this._newLocalArgBlock = function (name) {
        // name === 1, 2, 3, ...
        var blkname = 'arg_' + name;
        if ('myArg_' + name in this.protoBlockDict) {
            return;
        }

        if (blkname in this.protoBlockDict) {
            return;
        }

        var myNamedArgBlock = new ProtoBlock('namedarg');
        this.protoBlockDict['myArg_' + blkname] = myNamedArgBlock;
        myNamedArgBlock.palette = this.palettes.dict['action'];
        myNamedArgBlock.defaults.push(name);
        myNamedArgBlock.staticLabels.push('arg ' + name);
        myNamedArgBlock.parameterBlock();

        if (blkname === 'arg_1') {
            return;
        }

        myNamedArgBlock.palette.add(myNamedArgBlock, true);

        // Force regeneration of palette after adding new block.
        // Add delay to avoid race condition.
        var that = this;
        setTimeout(function () {
            that.palettes.hide();
            that.palettes.updatePalettes('action');
            that.palettes.show();
        }, 500);
    };

    this._removeNamedoEntries = function (name) {
        // Delete any old palette entries.
        // console.log('DELETE: removing old palette entries for ' + name);
        if (this.protoBlockDict['myDo_' + name]) {
            // console.log('deleting myDo_' + name + ' ' + this.protoBlockDict['myDo_' + name].name);
            this.protoBlockDict['myDo_' + name].hide = true;
            delete this.protoBlockDict['myDo_' + name];
        } else if (this.protoBlockDict['myCalc_' + name]) {
            // console.log('deleting myCalc_' + name + ' ' + this.protoBlockDict['myCalc_' + name].name);
            this.protoBlockDict['myCalc_' + name].hide = true;
            delete this.protoBlockDict['myCalc_' + name];
        } else if (this.protoBlockDict['myDoArg_' + name]) {
            // console.log('deleting myDoArg_' + name + ' ' + this.protoBlockDict['myDoArg_' + name].name);
            this.protoBlockDict['myDoArg_' + name].hide = true;
            delete this.protoBlockDict['myDoArg_' + name];
        } else if (this.protoBlockDict['myCalcArg_' + name]) {
            // console.log('deleting myCalcArg_' + name + ' ' + this.protoBlockDict['myCalcArg_' + name].name);
            this.protoBlockDict['myCalcArg_' + name].hide = true;
            delete this.protoBlockDict['myCalcArg_' + name];
        }
    };

    this.newNameddoBlock = function (name, hasReturn, hasArgs) {
        // Depending upon the form of the associated action block, we
        // want to add a named do, a named calc, a named do w/args, or
        // a named calc w/args.
        if (name === _('action')) {
            // 'action' already has its associated palette entries.
            return false;
        }

        if (hasReturn && hasArgs) {
            this.newNamedcalcArgBlock(name);
            return true;
        } else if (!hasReturn && hasArgs) {
            this.newNameddoArgBlock(name);
            return true;
        } else if (hasReturn && !hasArgs) {
            this.newNamedcalcBlock(name);
            return true;
        } else if (this.protoBlockDict['myDo_' + name] === undefined) {
            var myDoBlock = new ProtoBlock('nameddo');
            this.protoBlockDict['myDo_' + name] = myDoBlock;
            myDoBlock.palette = this.palettes.dict['action'];
            myDoBlock.defaults.push(name);
            myDoBlock.staticLabels.push(name);
            myDoBlock.zeroArgBlock();
            myDoBlock.palette.add(myDoBlock, true);
            this.palettes.updatePalettes();
            return true;
        }

        return false;
    };

    this.newNamedcalcBlock = function (name) {
        if (this.protoBlockDict['myCalc_' + name] === undefined) {
            // console.log('creating myCalc_' + name);
            var myCalcBlock = new ProtoBlock('namedcalc');
            this.protoBlockDict['myCalc_' + name] = myCalcBlock;
            myCalcBlock.palette = this.palettes.dict['action'];
            myCalcBlock.defaults.push(name);
            myCalcBlock.staticLabels.push(name);
            myCalcBlock.zeroArgBlock();
            // Add the new block to the top of the palette.
            myCalcBlock.palette.add(myCalcBlock, true);
        // } else {
        //     console.log('myCalc_' + name + ' already exists.');
        }
    };

    this.newNameddoArgBlock = function (name) {
        if (this.protoBlockDict['myDoArg_' + name] === undefined) {
            // console.log('creating myDoArg_' + name);
            var myDoArgBlock = new ProtoBlock('nameddoArg');
            this.protoBlockDict['myDoArg_' + name] = myDoArgBlock;
            myDoArgBlock.palette = this.palettes.dict['action'];
            myDoArgBlock.defaults.push(name);
            myDoArgBlock.staticLabels.push(name);
            myDoArgBlock.zeroArgBlock();
            // Add the new block to the top of the palette.
            myDoArgBlock.palette.add(myDoArgBlock, true);
        // } else {
        //     console.log('myDoArg_' + name + ' already exists.');
        }
    };

    this.newNamedcalcArgBlock = function (name) {
        if (this.protoBlockDict['myCalcArg_' + name] === undefined) {
            // console.log('creating myCalcArg_' + name);
            var myCalcArgBlock = new ProtoBlock('namedcalcArg');
            this.protoBlockDict['myCalcArg_' + name] = myCalcArgBlock;
            myCalcArgBlock.palette = this.palettes.dict['action'];
            myCalcArgBlock.defaults.push(name);
            myCalcArgBlock.staticLabels.push(name);
            myCalcArgBlock.zeroArgBlock();
            // Add the new block to the top of the palette.
            myCalcArgBlock.palette.add(myCalcArgBlock, true);
        // } else {
        //     console.log('myCalcArg_' + name + ' already exists.');
        }
    };

    this._insideArgClamp = function (blk) {
        // Returns a containing arg clamp block or null
        if (this.blockList[blk] == null) {
            // race condition?
            console.log('null block in blockList? ' + blk);
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

    this._insideExpandableBlock = function (blk) {
        // Returns a containing expandable block or null
        if (this.blockList[blk] == null) {
            // race condition?
            console.log('null block in blockList? ' + blk);
            return null;
        } else if (this.blockList[blk].connections[0] == null) {
            return null;
        } else {
            var cblk = this.blockList[blk].connections[0];
            if (this.blockList[cblk].isExpandableBlock()) {
                // If it is the last connection, keep searching.
                if (this.blockList[cblk].isArgFlowClampBlock()) {
                    return cblk;
                } else if (blk === last(this.blockList[cblk].connections)) {
                    return this._insideExpandableBlock(cblk);
                } else {
                    return cblk;
                }
            } else {
                return this._insideExpandableBlock(cblk);
            }
        }
    };

    this._insideNoteBlock = function (blk) {
        // Returns a containing note block or null
        if (this.blockList[blk] == null) {
            console.log('null block in blockList? ' + blk);
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
                    if (['newnote', 'osctime'].indexOf(this.blockList[cblk].name) !== -1) {
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

    this.triggerLongPress = function (myBlock) {
        this.timeOut == null;
        this.inLongPress = true;
        var z = this.stage.getNumChildren() - 1;

        // Auto-select stack for copying -- no need to actually click on
        // the copy button.
        var topBlock = this.findTopBlock(this.activeBlock);
        this.selectedStack = topBlock;

        // Copy the selectedStack.
        this.selectedBlocksObj = JSON.parse(JSON.stringify(this._copyBlocksToObj()));

        this.updatePasteButton();

        if (myBlock.name === 'action') {
            this.dismissButton.visible = true;
            this.dismissButton.x = myBlock.container.x - 27;
            this.dismissButton.y = myBlock.container.y - 27;
            this.stage.setChildIndex(this.dismissButton, z - 1);
            this.saveStackButton.visible = true;
            this.saveStackButton.x = myBlock.container.x + 27;
            this.saveStackButton.y = myBlock.container.y - 27;
            this.stage.setChildIndex(this.saveStackButton, z - 2);
        }

        this.refreshCanvas();
    };

    this.pasteStack = function () {
        // Copy a stack of blocks by creating a blockObjs and passing
        // it to this.load.
        if (this.selectedStack == null) {
            return;
        }

        // First, hide the palettes as they will need updating.
        for (var name in this.palettes.dict) {
            this.palettes.dict[name].hideMenu(true);
        }

        // var blockObjs = this._copyBlocksToObj();
        // this.loadNewBlocks(blockObjs);
        // console.log(this.selectedBlocksObj);
        this.loadNewBlocks(this.selectedBlocksObj);
    };

    this.saveStack = function () {
        // Save a stack of blocks to local storage and the 'myblocks'
        // palette by creating a blockObjs and ...
        if (this.selectedStack == null) {
            return;
        }

        this.palettes.hide();

        var blockObjs = this._copyBlocksToObj();
        // The first block is an action block. Its first connection is
        // the block containing its label.
        var nameBlk = blockObjs[0][4][1];

        if (nameBlk == null) {
            console.log('action not named... skipping');
        } else {
            console.log(blockObjs[nameBlk][1][1]);
            if (typeof(blockObjs[nameBlk][1][1]) === 'string') {
                var name = blockObjs[nameBlk][1][1];
            } else if (typeof(blockObjs[nameBlk][1][1]) === 'number') {
                var name = blockObjs[nameBlk][1][1].toString();
            } else {
                var name = blockObjs[nameBlk][1][1]['value'];
            }
            storage.macros = prepareMacroExports(name, blockObjs, this.macroDict);
            if (sugarizerCompatibility.isInsideSugarizer()) {
                sugarizerCompatibility.saveLocally(function () {
                    this.addToMyPalette(name, blockObjs);
                    // this.palettes.updatePalettes('myblocks');
                });
            } else {
                this.addToMyPalette(name, blockObjs);
                // this.palettes.updatePalettes('myblocks');
            }
        }
    };

    this._copyBlocksToObj = function () {
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

            if (myBlock.isValueBlock()) {
                switch (myBlock.name) {
                case 'media':
                    blockItem = [b, [myBlock.name, null], x, y, []];
                    break;
                default:
                    blockItem = [b, [myBlock.name, myBlock.value], x, y, []];
                    break;
                }
            } else if (['namedbox', 'nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg', 'namedarg'].indexOf(myBlock.name) !== -1) {
                blockItem = [b, [myBlock.name, {'value': myBlock.privateData}], x, y, []];
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

    this.addToMyPalette = function (name, obj) {
        // On the palette we store the macro as a basic block.
        var myBlock = new ProtoBlock('macro_' + name);
        var blkName = 'macro_' + name;
        this.protoBlockDict[blkName] = myBlock;
        if (!('myblocks' in this.palettes.dict)) {
            this.palettes.add('myblocks');
        }

        myBlock.palette = this.palettes.dict['myblocks'];
        myBlock.zeroArgBlock();
        myBlock.staticLabels.push(_(name));
        this.protoBlockDict[blkName].palette.add(this.protoBlockDict[blkName]);
    };

    this.loadNewBlocks = function (blockObjs) {
        // Check for blocks connected to themselves,
        // and for action blocks not connected to text blocks.
        for (var b = 0; b < blockObjs.length; b++) {
            var blkData = blockObjs[b];
            for (var c in blkData[4]) {
                if (blkData[4][c] === blkData[0]) {
                    console.log('Circular connection in block data: ' + blkData);
                    console.log('Punting loading of new blocks!');
                    console.log(blockObjs);
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

            if (this.blockList[b].name === 'action') {
                if (this.blockList[b].connections[1] != null) {
                    console.log(this.blockList[this.blockList[b].connections[1]].value);
                    currentActionNames.push(this.blockList[this.blockList[b].connections[1]].value);
                }
            } else if (this.blockList[b].name === 'storein') {
                if (this.blockList[b].connections[1] != null) {
                    currentStoreinNames.push(this.blockList[this.blockList[b].connections[1]].value);
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

        // action and start blocks that need to be collapsed.
        this.blocksToCollapse = [];

        // Scan for any new action and storein blocks to identify
        // duplicates. We also need to track start and action blocks
        // that may need to be collapsed.
        for (var b = 0; b < blockObjs.length; b++) {
            var blkData = blockObjs[b];
            // blkData[1] could be a string or an object.
            if (typeof(blkData[1]) === 'string') {
                var name = blkData[1];
            } else {
                var name = blkData[1][0];
            }

            if (!(name in this.protoBlockDict)) {
                switch (name) {
                case 'hat':
                    name = 'action';
                    break;
                case 'string':
                    name = 'text';
                    break;
                default:
                    console.log('skipping ' + name);
                    continue;
                    break;
                }
            }

            if (['arg', 'twoarg'].indexOf(this.protoBlockDict[name].style) !== -1) {
                if (this.protoBlockDict[name].expandable) {
                    this._checkTwoArgBlocks.push(this.blockList.length + b);
                }
            }

            // FIXME: Use tests in block.js
            if (['clamp', 'argclamp', 'argclamparg', 'doubleclamp', 'argflowclamp'].indexOf(this.protoBlockDict[name].style) !== -1) {
                this._checkArgClampBlocks.push(this.blockList.length + b);
            }

            switch (name) {
            case 'text':
                var key = blkData[1][1];
                if (stringValues[key] === undefined) {
                    stringValues[key] = [];
                }
                stringValues[key].push(b);
                break;
            case 'action':
            case 'hat':
                if (blkData[4][1] != null) {
                    actionNames[b] = blkData[4][1];
                }
                break;
            case 'storein':
                if (blkData[4][1] != null) {
                    storeinNames[b] = blkData[4][1];
                }
                break;
            case 'nameddo':
            case 'namedcalc':
            case 'nameddoArg':
            case 'namedcalcArg':
                doNames[b] = blkData[1][1]['value'];
                break;
            case 'do':
            case 'stack':
                if (blkData[4][1] != null) {
                    doNames[b] = blkData[4][1];
                }
                break;
            default:
                break;
            }

            switch (name) {
            case 'action':
            case 'pitchdrummatrix':
            case 'rhythmruler':
            case 'pitchstaircase':
            case 'tempo':
            case 'pitchslider':
            case 'matrix':
            case 'drum':
            case 'status':
            case 'start':
                if (typeof(blkData[1]) === 'object' && blkData[1].length > 1 && typeof(blkData[1][1]) === 'object' && 'collapsed' in blkData[1][1]) {
                    if (blkData[1][1]['collapsed']) {
                        this.blocksToCollapse.push(this.blockList.length + b);
                    }
                }
                break;
            default:
                break;
            }
        }

        var updatePalettes = false;
        // Make sure new storein names have palette entries.
        for (var b in storeinNames) {
            var blkData = blockObjs[storeinNames[b]];
            if (currentStoreinNames.indexOf(blkData[1][1]) === -1) {
                if (typeof(blkData[1][1]) === 'string') {
                    var name = blkData[1][1];
                } else {
                    var name = blkData[1][1]['value'];
                }
                // console.log('Adding new palette entries for store-in ' + name);
                this.newStoreinBlock(name);
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
            if (typeof(blkData[1][1]) === 'string') {
                var name = blkData[1][1];
            } else {
                var name = blkData[1][1]['value'];
            }

            // If we have a stack named 'action', make the protoblock visible.
            if (name === _('action')) {
                this.setActionProtoVisiblity(true);
            }
            var oldName = name;
            var i = 1;
            while (currentActionNames.indexOf(name) !== -1) {
                name = oldName + i.toString();
                i += 1;
                // Should never happen... but just in case.
                if (i > this.blockList.length) {
                    console.log('Could not generate unique action name.');
                    break;
                }
            }

            if (oldName !== name) {
                // Change the name of the action...
                console.log('action ' + oldName + ' is being renamed ' + name);
                blkData[1][1] = {'value': name};
            }

            // and any do blocks
            for (var d in doNames) {
                var thisBlkData = blockObjs[d];
                if (typeof(thisBlkData[1]) === 'string') {
                    var blkName = thisBlkData[1];
                } else {
                    var blkName = thisBlkData[1][0];
                }
                if (['nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg'].indexOf(blkName) !== -1) {
                    if (thisBlkData[1][1]['value'] === oldName) {
                        thisBlkData[1][1] = {'value': name};
                    }
                } else {
                    var doBlkData = blockObjs[doNames[d]];
                    if (typeof(doBlkData[1][1]) === 'string') {
                        if (doBlkData[1][1] === oldName) {
                            // console.log('renaming ' + oldName + ' to ' + name);
                            doBlkData[1][1] = name;
                        }
                    } else {
                        if (doBlkData[1][1]['value'] === oldName) {
                            // console.log('renaming ' + oldName + ' to ' + name);
                            doBlkData[1][1] = {'value': name};
                        }
                    }
                }
            }
        }

        if (updatePalettes) {
            this.palettes.hide();
            this.palettes.updatePalettes('action');
            this.palettes.show();
        }


        // This section of the code attempts to repair imported
        // code. For example, it adds missing hidden blocks and
        // convert old-style notes to new-style notes.
        blockObjsLength = blockObjs.length;
        var extraBlocksLength = 0;

        for (var b = 0; b < blockObjsLength; b++) {
            if (typeof(blockObjs[b][1]) === 'object') {
                var name = blockObjs[b][1][0];
            } else {
                var name = blockObjs[b][1];
            }

            switch (name) {
            case 'articulation':
            case 'augmented':
            case 'backward':
            case 'crescendo':
            case 'diminished':
            case 'dividebeatfactor':
            case 'drift':
            case 'duplicatenotes':
            case 'invert1':
            case 'fill':
            case 'flat':
            case 'hollowline':
            case 'major':
            case 'minor':
            case 'multiplybeatfactor':
            case 'note':
            case 'newnote':
            case 'newslur':
            case 'newstaccato':
            case 'newswing':
            case 'newswing2':
            case 'osctime':
            case 'perfect':
            case 'pluck':
            case 'rhythmicdot':
            case 'setbpm':
            case 'setnotevolume2':
            case 'settransposition':
            case 'setvoice':
            case 'sharp':
            case 'skipnotes':
            case 'slur':
            case 'staccato':
            case 'swing':
            case 'tie':
            case 'tuplet2':
            case 'vibrato':
                var len = blockObjs[b][4].length;
                if (last(blockObjs[b][4]) == null) {
                    // If there is no next block, add a hidden block;
                    console.log('last connection of ' + name + ' is null: adding hidden block');
                    blockObjs[b][4][len - 1] = blockObjsLength + extraBlocksLength;
                    blockObjs.push([blockObjsLength + extraBlocksLength, 'hidden', 0, 0, [b, null]]);
                    extraBlocksLength += 1;
                } else {
                    var nextBlock = blockObjs[b][4][len - 1];

                    if (typeof(blockObjs[nextBlock][1]) === 'object') {
                        var nextName = blockObjs[nextBlock][1][0];
                    } else {
                        var nextName = blockObjs[nextBlock][1];
                    }

                    if (nextName !== 'hidden') {
                        console.log('last connection of ' + name + ' is ' + nextName + ': adding hidden block');
                        // If the next block is not a hidden block, add one.
                        blockObjs[b][4][len - 1] = blockObjsLength + extraBlocksLength;
                        blockObjs[nextBlock][4][0] = blockObjsLength + extraBlocksLength;
                        blockObjs.push([blockObjsLength + extraBlocksLength, 'hidden', 0, 0, [b, nextBlock]]);
                        extraBlocksLength += 1;
                    }
                }

                if (['note', 'slur', 'staccato', 'swing'].indexOf(name) !== -1) {
                    // We need to convert to newnote style:
                    // (1) add a vspace to the start of the clamp of a note block.
                    console.log('note: ' + b);
                    var clampBlock = blockObjs[b][4][2];
                    blockObjs[b][4][2] = blockObjsLength + extraBlocksLength;
                    if (clampBlock == null) {
                        blockObjs.push([blockObjsLength + extraBlocksLength, 'vspace', 0, 0, [b, null]]);
                    } else {
                        blockObjs[clampBlock][4][0] = blockObjsLength + extraBlocksLength;
                        blockObjs.push([blockObjsLength + extraBlocksLength, 'vspace', 0, 0, [b, clampBlock]]);
                    }

                    extraBlocksLength += 1;

                    // (2) switch the first connection to divide 1 / arg.
                    var argBlock = blockObjs[b][4][1];
                    blockObjs[b][4][1] = blockObjsLength + extraBlocksLength;
                    if (argBlock == null) {
                        blockObjs.push([blockObjsLength + extraBlocksLength, 'divide', 0, 0, [b, blockObjsLength + extraBlocksLength + 1, blockObjsLength + extraBlocksLength + 2]]);
                        blockObjs.push([blockObjsLength + extraBlocksLength + 1, ['number', {'value': 1}], 0, 0, [blockObjsLength + extraBlocksLength]]);
                        blockObjs.push([blockObjsLength + extraBlocksLength + 2, ['number', {'value': 1}], 0, 0, [blockObjsLength + extraBlocksLength]]);
                        extraBlocksLength += 3;
                    } else {
                        blockObjs[argBlock][4][0] = blockObjsLength + extraBlocksLength;
                        blockObjs.push([blockObjsLength + extraBlocksLength, 'divide', 0, 0, [b, blockObjsLength + extraBlocksLength + 1, argBlock]]);
                        blockObjs.push([blockObjsLength + extraBlocksLength + 1, ['number', {'value': 1}], 0, 0, [blockObjsLength + extraBlocksLength]]);
                        extraBlocksLength += 2;
                    }

                    // (3) create a newnote block instead.
                    if (typeof(blockObjs[b][1]) === 'object') {
                        blockObjs[b][1][0] = 'new' + name;
                    } else {
                        blockObjs[b][1] = 'new' + name;
                    }
                }
                break;
            case 'action':
                // Ensure that there is a hidden block as the first
                // block in the child flow (connection 2) of an action
                // block (required to make the backward block function
                // propperly).
                var len = blockObjs[b][4].length;
                if (blockObjs[b][4][2] == null) {
                    // If there is no child flow block, add a hidden block;
                    console.log('last connection of ' + name + ' is null: adding hidden block');
                    blockObjs[b][4][2] = blockObjsLength + extraBlocksLength;
                    blockObjs.push([blockObjsLength + extraBlocksLength, 'hidden', 0, 0, [b, null]]);
                    extraBlocksLength += 1;
                } else {
                    var nextBlock = blockObjs[b][4][2];

                    if (typeof(blockObjs[nextBlock][1]) === 'object') {
                        var nextName = blockObjs[nextBlock][1][0];
                    } else {
                        var nextName = blockObjs[nextBlock][1];
                    }

                    if (nextName !== 'hidden') {
                        console.log('last connection of ' + name + ' is ' + nextName + ': adding hidden block');
                        // If the next block is not a hidden block, add one.
                        blockObjs[b][4][2] = blockObjsLength + extraBlocksLength;
                        blockObjs[nextBlock][4][0] = blockObjsLength + extraBlocksLength;
                        blockObjs.push([blockObjsLength + extraBlocksLength, 'hidden', 0, 0, [b, nextBlock]]);
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

            if (typeof(blkData[1]) === 'object') {
                if (blkData[1].length === 1) {
                    var blkInfo = [blkData[1][0], {'value': null}];
                } else if (['number', 'string'].indexOf(typeof(blkData[1][1])) !== -1) {
                    var blkInfo = [blkData[1][0], {'value': blkData[1][1]}];
                    if (COLLAPSABLES.indexOf(blkData[1][0]) !== -1) {
                        blkInfo[1]['collapsed'] = false;
                    }
                } else {
                    var blkInfo = blkData[1];
                }
            } else {
                var blkInfo = [blkData[1], {'value': null}];
                if (COLLAPSABLES.indexOf(blkData[1]) !== -1) {
                    blkInfo[1]['collapsed'] = false;
                }
            }

            var name = blkInfo[0];

            var collapsed = false;
            if (COLLAPSABLES.indexOf(name) !== -1) {
                collapsed = blkInfo[1]['collapsed'];
            }

            if (blkInfo[1] == null) {
                var value = null;
            } else {
                var value = blkInfo[1]['value'];
            }

            if (name in NAMEDICT) {
                name = NAMEDICT[name];
            }

            var that = this;

            // A few special cases.
            switch (name) {
                // Only add 'collapsed' arg to start, action blocks.
            case 'start':
                blkData[4][0] = null;
                blkData[4][2] = null;
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var blkInfo = args[1];
                    that.blockList[thisBlock].value = that.turtles.turtleList.length;
                    that.turtles.addTurtle(that.blockList[thisBlock], blkInfo);
                };

                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, blkInfo[1]], collapsed);
                break;
            case 'drum':
                blkData[4][0] = null;
                blkData[4][2] = null;
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var blkInfo = args[1];
                    that.blockList[thisBlock].value = that.turtles.turtleList.length;
                    that.turtles.addDrum(that.blockList[thisBlock], blkInfo);
                };

                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, blkInfo[1]], collapsed);

                if (_THIS_IS_MUSIC_BLOCKS_) {
                    // Load the synth for this drum
                    this.logo.synth.loadSynth('kick');
                }
                break;
            case 'action':
            case 'hat':
                blkData[4][0] = null;
                blkData[4][3] = null;
                this._makeNewBlockWithConnections('action', blockOffset, blkData[4], null, null, collapsed);
                break;

                // Named boxes and dos need private data.
            case 'namedbox':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].privateData = value;
                    that.blockList[thisBlock].value = null;
                };

                this._makeNewBlockWithConnections('namedbox', blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'namedarg':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].privateData = value;
                    that.blockList[thisBlock].value = null;
                };

                this._makeNewBlockWithConnections('namedarg', blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'namedcalc':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].privateData = value;
                    that.blockList[thisBlock].value = null;
                };

                this._makeNewBlockWithConnections('namedcalc', blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'nameddo':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].privateData = value;
                    that.blockList[thisBlock].value = null;
                };

                this._makeNewBlockWithConnections('nameddo', blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;

                // Arg clamps may need extra slots added.
            case 'doArg':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var extraSlots = args[1].length - 4;
                    if (extraSlots > 0) {
                        var slotList = that.blockList[thisBlock].argClampSlots;
                        for (var i = 0; i < extraSlots; i++) {
                            slotList.push(1);
                            that._newLocalArgBlock(slotList.length);
                            that.blockList[thisBlock].connections.push(null);
                        }
                        that.blockList[thisBlock].updateArgSlots(slotList);
                        for (var i = 0; i < args[1].length; i++) {
                            if (args[1][i] != null) {
                                that.blockList[thisBlock].connections[i] = args[1][i] + firstBlock;
                            } else {
                                that.blockList[thisBlock].connections[i] = args[1][i];
                            }
                        }
                    }
                    that._checkArgClampBlocks.push(thisBlock);
                };

                this._makeNewBlockWithConnections('doArg', blockOffset, blkData[4], postProcess, [thisBlock, blkData[4]]);
                break;
            case 'nameddoArg':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].privateData = value;
                    that.blockList[thisBlock].value = null;
                    var extraSlots = args[2].length - 3;
                    if (extraSlots > 0) {
                        var slotList = that.blockList[thisBlock].argClampSlots;
                        for (var i = 0; i < extraSlots; i++) {
                            slotList.push(1);
                            that._newLocalArgBlock(slotList.length);
                            that.blockList[thisBlock].connections.push(null);
                        }
                        that.blockList[thisBlock].updateArgSlots(slotList);
                        for (var i = 0; i < args[2].length; i++) {
                            if (args[2][i] != null) {
                                that.blockList[thisBlock].connections[i] = args[2][i] + firstBlock;
                            } else {
                                that.blockList[thisBlock].connections[i] = args[2][i];
                            }
                        }
                    }
                    that._checkArgClampBlocks.push(thisBlock);
                };

                this._makeNewBlockWithConnections('nameddoArg', blockOffset, blkData[4], postProcess, [thisBlock, value, blkData[4]]);
                break;
            case 'calcArg':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var extraSlots = args[1].length - 3;
                    if (extraSlots > 0) {
                        var slotList = that.blockList[thisBlock].argClampSlots;
                        for (var i = 0; i < extraSlots; i++) {
                            slotList.push(1);
                            that._newLocalArgBlock(slotList.length);
                            that.blockList[thisBlock].connections.push(null);
                        }
                        that.blockList[thisBlock].updateArgSlots(slotList);
                        for (var i = 0; i < args[1].length; i++) {
                            if (args[1][i] != null) {
                                that.blockList[thisBlock].connections[i] = args[1][i] + firstBlock;
                            } else {
                                that.blockList[thisBlock].connections[i] = args[1][i];
                            }
                        }
                    }
                    that._checkArgClampBlocks.push(thisBlock);
                };

                this._makeNewBlockWithConnections('calcArg', blockOffset, blkData[4], postProcess, [thisBlock, blkData[4]]);
                break;
            case 'namedcalcArg':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].privateData = value;
                    that.blockList[thisBlock].value = null;
                    var extraSlots = args[2].length - 2;
                    if (extraSlots > 0) {
                        var slotList = that.blockList[thisBlock].argClampSlots;
                        for (var i = 0; i < extraSlots; i++) {
                            slotList.push(1);
                            that._newLocalArgBlock(slotList.length);
                            that.blockList[thisBlock].connections.push(null);
                        }
                        that.blockList[thisBlock].updateArgSlots(slotList);
                        for (var i = 0; i < args[2].length; i++) {
                            if (args[2][i] != null) {
                                that.blockList[thisBlock].connections[i] = args[2][i] + firstBlock;
                            } else {
                                that.blockList[thisBlock].connections[i] = args[2][i];
                            }
                        }
                    }
                    that._checkArgClampBlocks.push(thisBlock);
                };

                this._makeNewBlockWithConnections('namedcalcArg', blockOffset, blkData[4], postProcess, [thisBlock, value, blkData[4]]);
                break;

                // Value blocks need a default value set.
            case 'number':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = Number(value);
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'text':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'solfege':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'eastindiansolfege':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'notename':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    that.updateBlockText(thisBlock);
                };
                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'modename':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    that.updateBlockText(thisBlock);
                };
                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'drumname':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);

                if (_THIS_IS_MUSIC_BLOCKS_) {
                    // Load the synth for this drum
                    this.logo.synth.loadSynth(getDrumSynthName(value));
                }
                break;
            case 'voicename':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);

                if (_THIS_IS_MUSIC_BLOCKS_) {
                    // Load the synth for this voice
                    this.logo.synth.loadSynth(getVoiceSynthName(value));
                }
                break;
            case 'media':
                // Load a thumbnail into a media blocks.
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = value;
                    if (value != null) {
                        // Load artwork onto media block.
                        that.blockList[thisBlock].loadThumbnail(null);
                    }
                };

                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'camera':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = CAMERAVALUE;
                };

                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'video':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    that.blockList[thisBlock].value = VIDEOVALUE;
                };

                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;

                // Define some constants for legacy blocks for
                // backward compatibility with Python projects.
            case 'red':
            case 'black':
                postProcess = function (thisBlock) {
                    that.blockList[thisBlock].value = 0;
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'white':
                postProcess = function (thisBlock) {
                    that.blockList[thisBlock].value = 100;
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'orange':
                postProcess = function (thisBlock) {
                    that.blockList[thisBlock].value = 10;
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'yellow':
                postProcess = function (thisBlock) {
                    that.blockList[thisBlock].value = 20;
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'green':
                postProcess = function (thisBlock) {
                    that.blockList[thisBlock].value = 40;
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'blue':
                postProcess = function (thisBlock) {
                    that.blockList[thisBlock].value = 70;
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'leftpos':
                postProcess = function (thisBlock) {
                    that.blockList[thisBlock].value = -(canvas.width / 2);
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'rightpos':
                postProcess = function (thisBlock) {
                    that.blockList[thisBlock].value = (canvas.width / 2);
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'toppos':
                postProcess = function (thisBlock) {
                    that.blockList[thisBlock].value = (canvas.height / 2);
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'botpos':
            case 'bottompos':
                postProcess = function (thisBlock) {
                    that.blockList[thisBlock].value = -(canvas.height / 2);
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'width':
                postProcess = function (thisBlock) {
                    that.blockList[thisBlock].value = canvas.width;
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'height':
                postProcess = function (thisBlock) {
                    that.blockList[thisBlock].value = canvas.height;
                    that.updateBlockText(thisBlock);
                };

                this._makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'loadFile':
                postProcess = function (args) {
                    that.blockList[args[0]].value = args[1];
                    that.updateBlockText(args[0]);
                };

                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            default:
                // Check that name is in the proto list
                if (!name in this.protoBlockDict || this.protoBlockDict[name] == null) {
                    // Lots of assumptions here.
                    // TODO: figure out if it is a flow or an arg block.
                    // Substitute a NOP block for an unknown block.
                    n = blkData[4].length;
                    console.log(n + ': substituting nop block for ' + name);
                    switch (n) {
                    case 1:
                        name = 'nopValueBlock';
                        break;
                    case 2:
                        name = 'nopZeroArgBlock';
                        break;
                    case 3:
                        name = 'nopOneArgBlock';
                        break;
                    case 4:
                        name = 'nopTwoArgBlock';
                        break;
                    case 5:
                    default:
                        name = 'nopThreeArgBlock';
                        break;
                    }
                }
                this._makeNewBlockWithConnections(name, blockOffset, blkData[4], null);
                break;
            }

            if (thisBlock === this.blockList.length - 1) {
                if (this.blockList[thisBlock].connections[0] == null) {
                    this.blockList[thisBlock].container.x = blkData[2];
                    this.blockList[thisBlock].container.y = blkData[3];
                    this._adjustTheseDocks.push(thisBlock);
                    if (blkData[4][0] == null) {
                        this._adjustTheseStacks.push(thisBlock);
                    }
                    if (blkData[2] < 0 || blkData[3] < 0 || blkData[2] > canvas.width || blkData[3] > canvas.height) {
                        this._homeButtonContainers[0].visible = true;
                        this._homeButtonContainers[1].visible = false;
                    }
                }
            }
        }
    };

    this.cleanupAfterLoad = function (name) {
        // If all the blocks are loaded, we can make the final adjustments.
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

        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].collapseContainer != null) {
                this.blockList[blk].collapseContainer.x = this.blockList[blk].container.x + COLLAPSEBUTTONXOFF * (this.blockList[blk].protoblock.scale / 2);
                this.blockList[blk].collapseContainer.y = this.blockList[blk].container.y + COLLAPSEBUTTONYOFF * (this.blockList[blk].protoblock.scale / 2);
            }
        }

        this.refreshCanvas();

        // Do a final check on the action and boxes palettes.
        var updatePalettes = false;
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (!this.blockList[blk].trash && this.blockList[blk].name === 'action') {
                var myBlock = this.blockList[blk];
                var arg = null;
                var c = myBlock.connections[1];
                if (c != null && this.blockList[c].value !== _('action')) {
                    if (this.newNameddoBlock(this.blockList[c].value, this.actionHasReturn(blk), this.actionHasArgs(blk))) {
                        updatePalettes = true;
                    }
                }
            }
        }
        if (updatePalettes) {
            this.palettes.hide();
            this.palettes.updatePalettes('action');
            // this.palettes.dict['action'].hide();
            this.palettes.show();
        }

        var updatePalettes = false;
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (!this.blockList[blk].trash && this.blockList[blk].name === 'storein') {
                var myBlock = this.blockList[blk];
                var arg = null;
                var c = myBlock.connections[1];
                if (c != null && this.blockList[c].value !== _('box')) {
                    var name = this.blockList[c].value;
                    // Is there an old block with this name still around?
                    if (this.protoBlockDict['myStorein_' + name] == undefined) {
                        console.log('adding new storein block ' + name);
                        this.newNamedboxBlock(this.blockList[c].value);
                        this.newStoreinBlock(this.blockList[c].value);
                        updatePalettes = true;
                    }
                }
            }
        }

        if (updatePalettes) {
            // Do this update on a slight delay so as not to collide with
            // the actions update.
            var that = this;
            setTimeout(function () {
                that.palettes.hide();
                that.palettes.updatePalettes('boxes');
                // that.palettes.dict['boxes'].hide();
                that.palettes.show();
            }, 1500);
        }
        console.log("Finished block loading");
        var myCustomEvent = new Event('finishedLoading');
        document.dispatchEvent(myCustomEvent);
    };

    this._cleanupStacks = function () {
        if (this._checkArgClampBlocks.length > 0) {
            // We make multiple passes because we need to account for nesting.
            // FIXME: needs to be interwoven with TwoArgBlocks check.
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
                    this._adjustExpandableTwoArgBlock([this._checkTwoArgBlocks[b]]);
                }
            }
        }

        for (var blk = 0; blk < this._adjustTheseDocks.length; blk++) {
            // console.log('Adjust Docks: ' + this.blockList[this._adjustTheseDocks[blk]].name);
            this.adjustDocks(this._adjustTheseDocks[blk], true);
            // blockBlocks._expandTwoArgs();
            this._expandClamps();
        }

        for (var blk = 0; blk < this._adjustTheseStacks.length; blk++) {
            // console.log('Adjust Stack: ' + this.blockList[this._adjustTheseStacks[blk]].name);
            this.raiseStackToTop(this._adjustTheseStacks[blk]);
        }
    };

    this.actionHasReturn = function (blk) {
        // Look for a return block in an action stack.
        if (this.blockList[blk].name !== 'action') {
            return false;
        }
        this.findDragGroup(blk);
        for (var b = 0; b < this.dragGroup.length; b++) {
            if (this.blockList[this.dragGroup[b]].name === 'return') {
                return true;
            }
        }
        return false;
    };

    this.actionHasArgs = function (blk) {
        // Look for an arg blocks in an action stack.
        if (this.blockList[blk].name !== 'action') {
            return false;
        }
        this.findDragGroup(blk);
        for (var b = 0; b < this.dragGroup.length; b++) {
            if (this.blockList[this.dragGroup[b]].name === 'arg' || this.blockList[this.dragGroup[b]].name === 'namedarg') {
                return true;
            }
        }
        return false;
    };

    this.raiseStackToTop = function (blk) {
        // Move the stack associated with blk to the top.
        var topBlk = this.findTopBlock(blk);
        this.findDragGroup(topBlk);

        var z = this.stage.getNumChildren() - 1;
        for (var b = 0; b < this.dragGroup.length; b++) {
            this.stage.setChildIndex(this.blockList[this.dragGroup[b]].container, z);
            z -= 1;
        }

        this.refreshCanvas;
    };

    this.deleteActionBlock = function (myBlock) {
        var actionArg = this.blockList[myBlock.connections[1]];
        if (actionArg) {
            var actionName = actionArg.value;
            for (var blk = 0; blk < this.blockList.length; blk++) {
                var myBlock = this.blockList[blk];
                var blkParent = this.blockList[myBlock.connections[0]];
                if (blkParent == null) {
                    continue;
                }

                if (['namedcalc', 'calc', 'nameddo', 'do', 'action'].indexOf(blkParent.name) !== -1) {
                    continue;
                }

                var blockValue = myBlock.value;
                if (blockValue === _('action')) {
                    continue;
                }

                if (blockValue === actionName) {
                    blkParent.hide();
                    myBlock.hide();
                    myBlock.trash = true;
                    blkParent.trash = true;
                }
            }

            // Avoid palette refreash race condition.
            this.deleteActionTimeout += 500;
            var timeout = this.deleteActionTimeout;
            var that = this;
            setTimeout(function () {
                that.deleteActionTimeout -= 500;
                that.palettes.removeActionPrototype(actionName);
            }, timeout);
        }
    };

    this.sendStackToTrash = function (myBlock) {
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

            // Add default block if user deletes all blocks from inside the note block
            this.addDefaultBlock(parentBlock, thisBlock);
        }

        if (myBlock.name === 'start' || myBlock.name === 'drum') {
            turtle = myBlock.value;
            var turtleNotInTrash = 0;
            for (var i = 0; i < this.turtles.turtleList.length; i++) {
                if (!this.turtles.turtleList[i].trash) {
                    turtleNotInTrash += 1;
                }
            }
            if (turtle != null && turtleNotInTrash > 1) {
                console.log('putting turtle ' + turtle + ' in the trash');
                this.turtles.turtleList[turtle].trash = true;
                this.turtles.turtleList[turtle].container.visible = false;
            } else {
                this.errorMsg("You must always have at least one start block");
                console.log('null turtle');
                return;
            }
        } else if (myBlock.name === 'action') {
            if (!myBlock.trash) {
                this.deleteActionBlock(myBlock);
            }
        }

        // put drag group in trash
        this.findDragGroup(thisBlock);
        for (var b = 0; b < this.dragGroup.length; b++) {
            var blk = this.dragGroup[b];
            // console.log('putting ' + this.blockList[blk].name + ' in the trash');
            this.blockList[blk].trash = true;
            this.blockList[blk].hide();
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
                } else if (myBlock.isArgBlock() && myBlock.isExpandableBlock() || myBlock.isArgClamp()) {
                    this._checkTwoArgBlocks.push(blk);
                } else if (['clamp', 'argclamp', 'argclamparg', 'doubleclamp', 'argflowclamp'].indexOf(myBlock.protoblock.style) !== -1) {
                    this._checkArgClampBlocks.push(blk);
                }
            }
            this._cleanupStacks();
            this.refreshCanvas();
        }
    };

    return this;
};
