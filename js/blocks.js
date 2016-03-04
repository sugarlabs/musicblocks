// Copyright (c) 2014-16 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

var blockBlocks = null;

// Minimum distance (squared) between to docks required before
// connecting them.
const MINIMUMDOCKDISTANCE = 400;

// Special value flags to uniquely identify these media blocks.
const CAMERAVALUE = '##__CAMERA__##';
const VIDEOVALUE = '##__VIDEO__##';

// Blocks holds the list of blocks and most of the block-associated
// methods, since most block manipulations are inter-block.

function Blocks(canvas, stage, refreshCanvas, trashcan, updateStage) {
    // Things we need from outside include access to the canvas, the
    // stage, and the trashcan.
    if (sugarizerCompatibility.isInsideSugarizer()) {
        storage = sugarizerCompatibility.data;
    } else {
        storage = localStorage;
    }

    this.canvas = canvas;
    this.stage = stage;
    this.refreshCanvas = refreshCanvas;
    this.trashcan = trashcan;
    this.updateStage = updateStage;

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

    // If we somehow have a malformed block database (for example,
    // from importing a corrupted datafile, we need to avoid infinite
    // loops while crawling the block list.
    this.loopCounter = 0;
    this.sizeCounter = 0;
    this.searchCounter = 0;

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
    this.expandablesList = [];
    // Number of blocks to load
    this.loadCounter = 0;
    // Stacks of blocks that need adjusting as blocks are repositioned
    // due to expanding and contracting or insertion into the flow.
    this.adjustTheseDocks = [];
    // Blocks that need collapsing after load.
    this.blocksToCollapse = [];
    // Arg blocks that need expanding after load.
    this.checkTwoArgBlocks = [];
    // Arg clamp blocks that need expanding after load.
    this.checkArgClampBlocks = [];
    // Clamp blocks that need expanding after load.
    this.clampBlocksToCheck = [];

    // We need to keep track of certain classes of blocks that exhibit
    // different types of behavior.

    // Blocks with parts that expand, e.g.,
    this.expandableBlocks = [];
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

    this.homeButtonContainers = [];
    this.blockScale = DEFAULTBLOCKSCALE;

    // We need to know if we are processing a copy or save stack command.
    this.inLongPress = false;

    // Change the scale of the blocks (and the protoblocks on the palette).
    this.setBlockScale = function (scale) {
        console.log('new block scale is ' + scale);
        this.blockScale = scale;

        // Regenerate all of the artwork at the new scale.
        for (var blk = 0; blk < this.blockList.length; blk++) {
             if (!this.blockList[blk].trash) {
                 this.blockList[blk].resize(scale);
             }
        }

        this.findStacks();
        for (var stack = 0; stack < this.stackList.length; stack++) {
            // Just in case the block list is corrupted, count iterations.
            this.loopCounter = 0;
            // console.log('Adjust Docks: ' + this.blockList[this.stackList[stack]].name);
            this.adjustDocks(this.stackList[stack]);
        }

        // We reset the protoblock scale on the palettes, but don't
        // modify the palettes themselves.
        for (var palette in this.palettes.dict) {
            for (var blk = 0; blk < this.palettes.dict[palette].protoList.length; blk++) {
                this.palettes.dict[palette].protoList[blk].scale = scale;
            }
        }
    }

    // We need access to the msg block...
    this.setMsgText = function (msgText) {
        this.msgText = msgText;
    }

    // and the Error msg function.
    this.setErrorMsg = function (errorMsg) {
        this.errorMsg = errorMsg;
    }

    // We need access to the macro dictionary because we add to it.
    this.setMacroDictionary = function (obj) {
        this.macroDict = obj;
    }

    // We need access to the turtles list because we associate a
    // turtle with each start block.
    this.setTurtles = function (turtles) {
        this.turtles = turtles;
    }

    // We need to access the "pseudo-Logo interpreter" when we click
    // on blocks.
    this.setLogo = function (logo) {
        this.logo = logo;
    }

    // The scale of the graphics is determined by screen size.
    this.setScale = function (scale) {
        this.blockScale = scale;
    }

    // Toggle state of collapsible blocks.
    this.toggleCollapsibles = function () {
        for (var blk in this.blockList) {
            var myBlock = this.blockList[blk];
            if (['start', 'action', 'drum', 'matrix'].indexOf(myBlock.name) !== -1 && !myBlock.trash) {
                myBlock.collapseToggle();
            }
        }
    }

    // We need access to the go-home buttons.
    this.setHomeContainers = function (containers) {
        this.homeButtonContainers = containers;
    }

    // set up copy/paste, dismiss, and copy-stack buttons
    this.makeCopyPasteButtons = function (makeButton, updatePasteButton) {
        var blocks = this;
        this.updatePasteButton = updatePasteButton;

        this.copyButton = makeButton('copy-button', _('Copy'), 0, 0, 55, 0, this.stage);
        this.copyButton.visible = false;

        this.dismissButton = makeButton('cancel-button', '', 0, 0, 55, 0, this.stage);
        this.dismissButton.visible = false;

        this.saveStackButton = makeButton('save-blocks-button', _('Save stack'), 0, 0, 55, 0, this.stage);
        this.saveStackButton.visible = false;

        this.copyButton.on('click', function (event) {
            var topBlock = blocks.findTopBlock(blocks.activeBlock);
            blocks.selectedStack = topBlock;
            blocks.copyButton.visible = false;
            blocks.saveStackButton.visible = false;
            blocks.dismissButton.visible = false;
            blocks.inLongPress = false;
            blocks.updatePasteButton();
            blocks.refreshCanvas();
        });

        this.dismissButton.on('click', function (event) {
            blocks.copyButton.visible = false;
            blocks.saveStackButton.visible = false;
            blocks.dismissButton.visible = false;
            blocks.inLongPress = false;
            blocks.refreshCanvas();
        });

        this.saveStackButton.on('click', function (event) {
            // Only invoked from action blocks.
            var topBlock = blocks.findTopBlock(blocks.activeBlock);
            blocks.inLongPress = false;
            blocks.selectedStack = topBlock;
            blocks.copyButton.visible = false;
            blocks.saveStackButton.visible = false;
            blocks.dismissButton.visible = false;
            blocks.saveStack();
            blocks.refreshCanvas();
        });
    }

    // Walk through all of the proto blocks in order to make lists of
    // any blocks that need special treatment.
    this.findBlockTypes = function () {
        for (var proto in this.protoBlockDict) {
            if (this.protoBlockDict[proto].expandable) {
                this.expandableBlocks.push(this.protoBlockDict[proto].name);
            }
            if (this.protoBlockDict[proto].style === 'clamp') {
                this.clampBlocks.push(this.protoBlockDict[proto].name);
            }
            if (this.protoBlockDict[proto].style === 'argclamp') {
                this.argClampBlocks.push(this.protoBlockDict[proto].name);
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
    }

    // Adjust the docking postions of all blocks in the current drag
    // group.
    this.adjustBlockPositions = function () {
        if (this.dragGroup.length < 2) {
            return;
        }

        // Just in case the block list is corrupted, count iterations.
        this.loopCounter = 0;
        // console.log('Adjust Docks: ' + this.blockList[this.dragGroup[0]].name);
        this.adjustDocks(this.dragGroup[0])
    }

    // Adjust the size of the clamp in an expandable block when blocks
    // are inserted into (or removed from) the child flow. This is a
    // common operation for start and action blocks, but also for
    // repeat, forever, if, etc.
    this.adjustExpandableClampBlock = function () {
        if (this.clampBlocksToCheck.length === 0) {
            return;
        }
        var obj = this.clampBlocksToCheck.pop();
        var blk = obj[0];
        var clamp = obj[1];

        var myBlock = this.blockList[blk];

        // Make sure myBlock is a clamp block.
        if (myBlock.isArgBlock() || myBlock.isTwoArgBlock()) {
            return;
        } else if (myBlock.isArgClamp()) {
            // We handle ArgClamp blocks elsewhere.
            this.adjustArgClampBlock([blk]);
            return;
        }

        function clampAdjuster(blocks, blk, myBlock, clamp) {
            // First we need to count up the number of (and size of) the
            // blocks inside the clamp; The child flow is usually the
            // second-to-last argument.
            if (clamp === 0) {
                var c = myBlock.connections.length - 2;
            } else { // e.g., Bottom clamp in if-then-else
                var c = myBlock.connections.length - 3;
            }
            blocks.sizeCounter = 0;
            var childFlowSize = 1;
            if (c > 0 && myBlock.connections[c] != null) {
                childFlowSize = Math.max(blocks.getStackSize(myBlock.connections[c]), 1);
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
                if (blocks.clampBlocksToCheck.length > 0) {
                    blocks.adjustExpandableClampBlock();
                }
            }, 250);
        }

        clampAdjuster(this, blk, myBlock, clamp);
    }

    // Returns the block size.
    this.getBlockSize = function (blk) {
        var myBlock = this.blockList[blk];
        return myBlock.size;
        // FIXME? No need to recurse since cascaded value is stored in
        // myBlock.size. But is it robust? Maybe we should recurse
        // and not store the cascaded size?
        /*
         var size = myBlock.size;
         if ((myBlock.isArgBlock() || myBlock.isTwoArgBlock()) && this.blockList[i].isExpandableBlock() && myBlock.connections[1] != null) {
         return size + this.getBlockSize(myBlock.connections[1]) - 1;
         } else {
         return size;
         }
         */
    }

    // Adjust the slot sizes of arg clamps.
    this.adjustArgClampBlock = function (argBlocksToCheck) {
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
                size = Math.max(this.getBlockSize(c), 1);
            }
            if (slotList[i] !== size) {
                slotList[i] = size;
                update = true;
            }
        }
        if (update) {
            myBlock.updateArgSlots(slotList);
        }
    }

    // We also adjust the size of twoarg blocks. It is similar to how
    // we adjust clamps, but enough different that it is in its own
    // function.
    this.adjustExpandableTwoArgBlock = function (argBlocksToCheck) {
        if (argBlocksToCheck.length === 0) {
            return;
        }

        var blk = argBlocksToCheck.pop();
        var myBlock = this.blockList[blk];

        // Determine the size of the first argument.
        var c = myBlock.connections[1];
        var firstArgumentSize = 1; // Minimum size
        if (c != null) {
            firstArgumentSize = Math.max(this.getBlockSize(c), 1);
        }

        // Expand/contract block by plusMinus.
        var plusMinus = firstArgumentSize - myBlock.clampCount[0];
        if (plusMinus !== 0) {
            if (!(firstArgumentSize === 0)) {
                myBlock.updateSlots(0, plusMinus);
            }
        }
    }

    this.addRemoveVspaceBlock = function (blk) {
        var myBlock = blockBlocks.blockList[blk];

        var c = myBlock.connections[myBlock.connections.length - 2];
        var secondArgumentSize = 1;
        if (c != null) {
            var secondArgumentSize = Math.max(this.getBlockSize(c), 1);
        }

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
            var newPos = blockBlocks.blockList.length;

            function vspaceAdjuster(args) { // nextBlock, vspace, i, n
                var thisBlock = args[0];
                var nextBlock = args[1];
                var vspace = args[2];
                var i = args[3];
                var n = args[4];
                var vspaceBlock = blockBlocks.blockList[vspace];
                var lastDock = last(thisBlock.docks);
                var dx = lastDock[0] - vspaceBlock.docks[0][0];
                var dy = lastDock[1] - vspaceBlock.docks[0][1];
                vspaceBlock.container.x = thisBlock.container.x + dx;
                vspaceBlock.container.y = thisBlock.container.y + dy;
                vspaceBlock.connections[0] = blockBlocks.blockList.indexOf(thisBlock);
                vspaceBlock.connections[1] = nextBlock;
                thisBlock.connections[thisBlock.connections.length - 1] = vspace;
                if (nextBlock) {
                    blockBlocks.blockList[nextBlock].connections[0] = vspace;
                }
                if (i + 1 < n) {
                    var newPos = blockBlocks.blockList.length;
                    thisBlock = last(blockBlocks.blockList);
                    nextBlock = last(thisBlock.connections);
                    blockBlocks.makeNewBlockWithConnections('vspace', newPos, [null, null], vspaceAdjuster, [thisBlock, nextBlock, newPos, i + 1, n]);
                }
            }

            blockBlocks.makeNewBlockWithConnections('vspace', newPos, [null, null], vspaceAdjuster, [thisBlock, nextBlock, newPos, 0, n]);
        }

        function howManyVSpaceBlocksBelow(blk) {
            // Need to know how many vspace blocks are below the block
            // we're checking against.
            var nextBlock = last(blockBlocks.blockList[blk].connections);
            if (nextBlock && blockBlocks.blockList[nextBlock].name === 'vspace') {
                return 1 + howManyVSpaceBlocksBelow(nextBlock);
                // Recurse until it isn't a vspace
            }
            return 0;
        }
    }

    this.getStackSize = function (blk) {
        // How many block units in this stack?
        var size = 0;
        this.sizeCounter += 1;
        if (this.sizeCounter > this.blockList.length * 2) {
            console.log('Infinite loop encountered detecting size of expandable block? ' + blk);
            return size;
        }

        if (blk == null) {
            return size;
        }

        var myBlock = this.blockList[blk];
        if (myBlock == null) {
            console.log('Something very broken in getStackSize.');
        }

        if (myBlock.isClampBlock()) {
            var c = myBlock.connections.length - 2;
            var csize = 0;
            if (c > 0) {
                var cblk = myBlock.connections[c];
                if (cblk != null) {
                    csize = this.getStackSize(cblk);
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
                        var csize = this.getStackSize(cblk);
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
                size += this.getStackSize(cblk);
            }
        }
        return size;
    }

    this.adjustDocks = function (blk, resetLoopCounter) {
        // Give a block, adjust the dock positions
        // of all of the blocks connected to it

        var myBlock = this.blockList[blk];

        // For when we come in from makeBlock
        if (resetLoopCounter != null) {
            this.loopCounter = 0;
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

        this.loopCounter += 1;
        // FIXME: race condition when rescaling blocks?
        if (this.loopCounter > this.blockList.length * 2) {
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
                this.moveBlock(cblk, nx, ny);
            } else {
                // or it's parent.
                var dx = cdock[0] - bdock[0];
                var dy = cdock[1] - bdock[1];
                var nx = this.blockList[cblk].container.x + dx;
                var ny = this.blockList[cblk].container.y + dy;
                this.moveBlock(blk, nx, ny);
            }

            if (c > 0) {
                // Recurse on connected blocks.
                this.adjustDocks(cblk);
            }
        }
    }

    this.blockMoved = function (thisBlock) {
        // When a block is moved, we have lots of things to check:
        // (0) Is it inside of a expandable block?
        //     Is it an arg inside an arg clamp?
        // (1) Is it an arg block connected to a two-arg block?
        // (2) Disconnect its connection[0];
        // (3) Look for a new connection;
        //     Is it potentially an arg inside an arg clamp?
        // (4) Is it an arg block connected to a 2-arg block?
        // (5) Recheck if it inside of a expandable block.

        // Find any containing expandable blocks.
        this.clampBlocksToCheck = [];
        if (thisBlock == null) {
            console.log('block moved called with null block.');
            return;
        }
        var blk = this.insideExpandableBlock(thisBlock);
        var expandableLoopCounter = 0;
        while (blk != null) {
            expandableLoopCounter += 1;
            if (expandableLoopCounter > 2 * this.blockList.length) {
                console.log('Inifinite loop encountered checking for expandables?');
                break;
            }
            this.clampBlocksToCheck.push([blk, 0]);
            blk = this.insideExpandableBlock(blk);
        }

        this.checkTwoArgBlocks = [];
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
                    this.checkTwoArgBlocks.push(c);
                }
            } else if (this.blockList[c].isArgBlock() && this.blockList[c].isExpandableBlock() || this.blockList[c].isArgClamp()) {
                if (cBlock.connections[1] === thisBlock) {
                    this.checkTwoArgBlocks.push(c);
                }
            }
        }

        // Disconnect from connection[0] (both sides of the connection).
        if (c != null) {
            // disconnect both ends of the connection
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
        // Find the nearest dock; if it is close
        // enough, connect;
        var newBlock = null;
        var newConnection = null;
        // TODO: Make minimum distance relative to scale.
        var min = MINIMUMDOCKDISTANCE;
        var blkType = myBlock.docks[0][2]
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
                }

                // Look for available connections.
                if (this.testConnectionType(blkType, this.blockList[b].docks[i][2])) {
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
                        var size = this.getBlockSize(thisBlock);
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
                // Three scenarios in which we may be overriding an existing connection:
                // (1) if it is an argClamp, add a new slot below the current block;
                // (2) if it is an arg block, replace it; and
                // (3) if it is a flow block, insert it into the flow.
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
                        var size = this.getBlockSize(thisBlock);

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
                            this.newLocalArgBlock(slotList.length);
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
                } else {
                    var bottom = this.findBottomBlock(thisBlock);
                    this.blockList[connection].connections[0] = bottom;
                    this.blockList[bottom].connections[this.blockList[bottom].connections.length - 1] = connection;
                }
            }
            this.blockList[newBlock].connections[newConnection] = thisBlock;
            this.loopCounter = 0;
            // console.log('Adjust Docks: ' + this.blockList[newBlock].name);
            this.adjustDocks(newBlock);
            // TODO: some graphical feedback re new connection?
        }

        // If it is an arg block, where is it coming from?
        // FIXME: improve mechanism for testing block types.
        if ((myBlock.isArgBlock() || myBlock.name === 'calcArg' || myBlock.name === 'namedcalcArg') && newBlock != null) {
            // We care about twoarg blocks with connections to the
            // first arg;
            if (this.blockList[newBlock].isTwoArgBlock()) {
                if (this.blockList[newBlock].connections[1] === thisBlock) {
                    if (this.checkTwoArgBlocks.indexOf(newBlock) === -1) {
                        this.checkTwoArgBlocks.push(newBlock);
                    }
                }
            } else if (this.blockList[newBlock].isArgBlock() && this.blockList[newBlock].isExpandableBlock()) {
                if (this.blockList[newBlock].connections[1] === thisBlock) {
                    if (this.checkTwoArgBlocks.indexOf(newBlock) === -1) {
                        this.checkTwoArgBlocks.push(newBlock);
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

        // Put block adjustments inside a slight delay to make the
        // addition/substraction of vspace and changes of block shape
        // appear less abrupt (and it can be a little racy).
        var blocks = this;
        setTimeout(function () {
            // If we changed the contents of a arg block, we may need a vspace.
            if (checkArgBlocks.length > 0) {
                for (var i = 0; i < checkArgBlocks.length; i++) {
                    blocks.addRemoveVspaceBlock(checkArgBlocks[i]);
                }
            }

            // If we changed the contents of a two-arg block, we need to
            // adjust it.
            if (blocks.checkTwoArgBlocks.length > 0) {
                blocks.adjustExpandableTwoArgBlock(blocks.checkTwoArgBlocks);
            }

            // First, adjust the docks for any blocks that may have
            // had a vspace added.
            for (var i = 0; i < checkArgBlocks.length; i++) {
                // console.log('Adjust Docks: ' + this.blockList[checkArgBlocks[i]].name);
                blocks.adjustDocks(checkArgBlocks[i]);
            }

            // Next, recheck if the connection is inside of a
            // expandable block.
            var blk = blocks.insideExpandableBlock(thisBlock);
            var expandableLoopCounter = 0;
            while (blk != null) {
                // Extra check for malformed data.
                expandableLoopCounter += 1;
                if (expandableLoopCounter > 2 * blocks.blockList.length) {
                    console.log('Infinite loop checking for expandables?');
                    console.log(blocks.blockList);
                    break;
                }
                if (blocks.blockList[blk].name === 'ifthenelse') {
                    blocks.clampBlocksToCheck.push([blk, 0]);
                    blocks.clampBlocksToCheck.push([blk, 1]);
                } else {
                    blocks.clampBlocksToCheck.push([blk, 0]);
                }
                blk = blocks.insideExpandableBlock(blk);
            }
            blocks.adjustExpandableClampBlock();
            blocks.refreshCanvas();
        }, 250);
    }

    this.testConnectionType = function (type1, type2) {
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
    }

    this.updateBlockPositions = function () {
        // Create the block image if it doesn't yet exist.
        for (var blk = 0; blk < this.blockList.length; blk++) {
            this.moveBlock(blk, this.blockList[blk].container.x, this.blockList[blk].container.y);
        }
    }

    this.bringToTop = function () {
        // Move all the blocks to the top layer of the stage
        for (var blk in this.blockList) {
            var myBlock = this.blockList[blk];
            this.stage.removeChild(myBlock.container);
            this.stage.addChild(myBlock.container);
            if (myBlock.collapseContainer != null) {
                this.stage.removeChild(myBlock.collapseContainer);
                this.stage.addChild(myBlock.collapseContainer);
            }
        }
        this.refreshCanvas();
    }

    this.moveBlock = function (blk, x, y) {
        // Move a block (and its label) to x, y.
        var myBlock = this.blockList[blk];
        if (myBlock.container != null) {
            myBlock.container.x = x;
            myBlock.container.y = y;
            if (myBlock.collapseContainer != null) {
                myBlock.collapseContainer.x = x + COLLAPSEBUTTONXOFF * (this.blockList[blk].protoblock.scale / 2);
                myBlock.collapseContainer.y = y + COLLAPSEBUTTONYOFF * (this.blockList[blk].protoblock.scale / 2);
            }
            if (myBlock.offScreen(canvas)) {
                this.homeButtonContainers[0].visible = true;
                this.homeButtonContainers[1].visible = false;
            }
        } else {
            console.log('no container yet');
        }
    }

    this.moveBlockRelative = function (blk, dx, dy) {
        // Move a block (and its label) by dx, dy.
        if (this.inLongPress) {
            this.copyButton.visible = false;
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
            if (myBlock.offScreen(canvas)) {
                this.homeButtonContainers[0].visible = true;
                this.homeButtonContainers[1].visible = false;
            }
        } else {
            console.log('no container yet');
        }
    }

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
            console.log('load not yet complete for ' + blk);
        }
    }

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

        // Test for corrupted connection scenario
        // FIXME: How does this happen?
        // FIXME: Should we try to correct it?
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
    }

    this.findStacks = function () {
        // Find any blocks with null in the first connection.
        this.stackList = [];
        for (var i = 0; i < this.blockList.length; i++) {
            if (this.blockList[i].connections[0] == null) {
                this.stackList.push(i)
            }
        }
    }

    this.findClamps = function () {
        // Find any clamp blocks.
        this.expandablesList = [];
        this.findStacks(); // We start by finding the stacks
        for (var i = 0; i < this.stackList.length; i++) {
            this.searchCounter = 0;
            this.searchForExpandables(this.stackList[i]);
        }
    }

    this.findTwoArgs = function () {
        // Find any expandable arg blocks.
        this.expandablesList = [];
        for (var i = 0; i < this.blockList.length; i++) {
            if (this.blockList[i].isArgBlock() && this.blockList[i].isExpandableBlock()) {
                this.expandablesList.push(i);
            } else if (this.blockList[i].isTwoArgBlock()) {
                this.expandablesList.push(i);
            }
        }
    }

    this.searchForExpandables = function (blk) {
        // Find the expandable blocks below blk in a stack.
        while (blk != null && this.blockList[blk] != null && !this.blockList[blk].isValueBlock()) {
            // More checks for malformed or corrupted block data.
            this.searchCounter += 1;
            if (this.searchCounter > 2 * this.blockList.length) {
                console.log('infinite loop searching for Expandables? ' + this.searchCounter);
                console.log(blk + ' ' + this.blockList[blk].name);
                break;
            }
            if (this.blockList[blk].isClampBlock()) {
                this.expandablesList.push(blk);
                var c = this.blockList[blk].connections.length - 2;
                this.searchForExpandables(this.blockList[blk].connections[c]);
                if (this.blockList[blk].name === 'ifthenelse') {
                    // search top clamp too
                    var c = 2;
                    this.searchForExpandables(this.blockList[blk].connections[c]);
                }
            } else if (this.blockList[blk].isArgClamp()) {
                // FIXME: We need to do something with ArgClampArg blocks too.
                this.expandablesList.push(blk);
            }
            blk = last(this.blockList[blk].connections);
        }
    }

    this.expandTwoArgs = function () {
        // Expand expandable 2-arg blocks as needed.
        this.findTwoArgs();
        this.adjustExpandableTwoArgBlock(this.expandablesList);
        this.refreshCanvas();
    }

    this.expandClamps = function () {
        // Expand expandable clamp blocks as needed.
        this.findClamps();
        this.clampBlocksToCheck = [];
        for (var i = 0; i < this.expandablesList.length; i++) {
            if (this.blockList[this.expandablesList[i]].name === 'ifthenelse') {
                this.clampBlocksToCheck.push([this.expandablesList[i], 0]);
                this.clampBlocksToCheck.push([this.expandablesList[i], 1]);
            } else {
                this.clampBlocksToCheck.push([this.expandablesList[i], 0]);
            }
        }
        this.adjustExpandableClampBlock();
        this.refreshCanvas();
    }

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
    }

    this.unhighlightAll = function () {
        for (var blk in this.blockList) {
            this.unhighlight(blk);
        }
    }

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
    }

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
    }

    this.hide = function () {
        for (var blk in this.blockList) {
            this.blockList[blk].hide();
        }
        this.visible = false;
    }

    this.show = function () {
        for (var blk in this.blockList) {
            this.blockList[blk].show();
        }
        this.visible = true;
    }

    this.makeNewBlockWithConnections = function (name, blockOffset, connections, postProcess, postProcessArg, collapsed) {
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
    }

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
    }

    this.makeBlock = function (name, arg) {
        // Make a new block from a proto block.
        // Called from palettes.

        // console.log('makeBlock ' + name + ' ' + arg);
        var postProcess = null;
        var postProcessArg = null;
        var me = this;
        var thisBlock = this.blockList.length;
        if (name === 'start') {
            postProcess = function (thisBlock) {
                me.blockList[thisBlock].value = me.turtles.turtleList.length;
                me.turtles.addTurtle(me.blockList[thisBlock]);
            }
            postProcessArg = thisBlock;
        } else if (name === 'drum') {
            postProcess = function (thisBlock) {
                me.blockList[thisBlock].value = me.turtles.turtleList.length;
                me.turtles.addDrum(me.blockList[thisBlock]);
            }
            postProcessArg = thisBlock;
        } else if (name === 'text') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                me.blockList[thisBlock].value = value;
                me.blockList[thisBlock].text.text = value;
                me.blockList[thisBlock].container.updateCache();
            }
            postProcessArg = [thisBlock, _('text')];
        } else if (name === 'solfege') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                me.blockList[thisBlock].value = value;
                me.blockList[thisBlock].text.text = value;
                me.blockList[thisBlock].container.updateCache();
            }
            postProcessArg = [thisBlock, _('sol')];
        } else if (name === 'notename') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                me.blockList[thisBlock].value = value;
                me.blockList[thisBlock].text.text = value;
                me.blockList[thisBlock].container.updateCache();
            }
            postProcessArg = [thisBlock, 'G'];
        } else if (name === 'number') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = Number(args[1]);
                me.blockList[thisBlock].value = value;
                me.blockList[thisBlock].text.text = value.toString();
                me.blockList[thisBlock].container.updateCache();
            }
            postProcessArg = [thisBlock, 4];
        } else if (name === 'media') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                me.blockList[thisBlock].value = value;
                if (value == null) {
                    me.blockList[thisBlock].image = 'images/load-media.svg';
                } else {
                    me.blockList[thisBlock].image = null;
                }
            }
            postProcessArg = [thisBlock, null];
        } else if (name === 'camera') {
            postProcess = function (args) {
                console.log('post process camera ' + args[1]);
                var thisBlock = args[0];
                var value = args[1];
                me.blockList[thisBlock].value = CAMERAVALUE;
                if (value == null) {
                    me.blockList[thisBlock].image = 'images/camera.svg';
                } else {
                    me.blockList[thisBlock].image = null;
                }
            }
            postProcessArg = [thisBlock, null];
        } else if (name === 'video') {
            postProcess = function (args) {
                var thisBlock = args[0];
                var value = args[1];
                me.blockList[thisBlock].value = VIDEOVALUE;
                if (value == null) {
                    me.blockList[thisBlock].image = 'images/video.svg';
                } else {
                    me.blockList[thisBlock].image = null;
                }
            }
            postProcessArg = [thisBlock, null];
        } else if (name === 'loadFile') {
            postProcess = function (args) {
                me.updateBlockText(args[0]);
            }
            postProcessArg = [thisBlock, null];
        } else if (['namedbox', 'nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg', 'namedarg'].indexOf(name) !== -1) {
            postProcess = function (args) {
                me.blockList[thisBlock].value = null;
                me.blockList[thisBlock].privateData = args[1];
            }
            postProcessArg = [thisBlock, arg];
        }

        var protoFound = false;
        for (var proto in me.protoBlockDict) {
            if (me.protoBlockDict[proto].name === name) {
                if (arg === '__NOARG__') {
                    // console.log('creating ' + name + ' block with no args');
                    me.makeNewBlock(proto, postProcess, postProcessArg);
                    protoFound = true;
                    break;
                } else if (me.protoBlockDict[proto].defaults[0] === arg) {
                    // console.log('creating ' + name + ' block with default arg ' + arg);
                    me.makeNewBlock(proto, postProcess, postProcessArg);
                    protoFound = true;
                    break;
                } else if (['namedbox', 'nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg', 'namedarg'].indexOf(name) !== -1) {
                    if (me.protoBlockDict[proto].defaults[0] === undefined) {
                        me.makeNewBlock(proto, postProcess, postProcessArg);
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
                // console.log('calling findUniqueActionName');
                value = this.findUniqueActionName(_('action'));
                // console.log('renaming action block to ' + value);
                if (value !== _('action')) {
                    // console.log('calling newNameddoBlock with value ' + value);
                    // TODO: are there return or arg blocks?
                    this.newNameddoBlock(value, false, false);
                    this.palettes.updatePalettes('actions');
                }
            }

            var me = this;
            var thisBlock = this.blockList.length;
            if (myBlock.docks.length > i && myBlock.docks[i + 1][2] === 'anyin') {
                if (value == null) {
                    console.log('cannot set default value');
                } else if (typeof(value) === 'string') {
                    postProcess = function (args) {
                        var thisBlock = args[0];
                        var value = args[1];
                        me.blockList[thisBlock].value = value;
                        var label = value.toString();
                        if (label.length > 8) {
                            label = label.substr(0, 7) + '...';
                        }
                        me.blockList[thisBlock].text.text = label;
                        me.blockList[thisBlock].container.updateCache();
                    }
                    this.makeNewBlock('text', postProcess, [thisBlock, value]);
                } else {
                    postProcess = function (args) {
                        var thisBlock = args[0];
                        var value = Number(args[1]);
                        me.blockList[thisBlock].value = value;
                        me.blockList[thisBlock].text.text = value.toString();
                    }
                    this.makeNewBlock('number', postProcess, [thisBlock, value]);
                }
            } else if (myBlock.docks[i + 1][2] === 'textin') {
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].value = value;
                    var label = value.toString();
                    if (label.length > 8) {
                        label = label.substr(0, 7) + '...';
                    }
                    me.blockList[thisBlock].text.text = label;
                }
                this.makeNewBlock('text', postProcess, [thisBlock, value]);
            } else if (myBlock.docks[i + 1][2] === 'solfegein') {
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].value = value;
                    var label = value.toString();
                    me.blockList[thisBlock].text.text = label;
                }
                this.makeNewBlock('solfege', postProcess, [thisBlock, value]);
            } else if (myBlock.docks[i + 1][2] === 'notein') {
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].value = value;
                    var label = value.toString();
                    me.blockList[thisBlock].text.text = label;
                }
                this.makeNewBlock('notename', postProcess, [thisBlock, value]);
            } else if (myBlock.docks[i + 1][2] === 'mediain') {
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].value = value;
                    if (value != null) {
                        // loadThumbnail(me, thisBlock, null);
                    }
                }
                this.makeNewBlock('media', postProcess, [thisBlock, value]);
            } else if (myBlock.docks[i + 1][2] === 'filein') {
                postProcess = function (blk) {
                    me.updateBlockText(blk);
                }
                this.makeNewBlock('loadFile', postProcess, thisBlock);
            } else {
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].value = value;
                    me.blockList[thisBlock].text.text = value.toString();
                }
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
    }

    this.findDragGroup = function (blk) {
        // Generate a drag group from blocks connected to blk
        this.dragLoopCounter = 0;
        this.dragGroup = [];
        this.calculateDragGroup(blk);
    }

    this.calculateDragGroup = function (blk) {
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
                this.calculateDragGroup(cblk);
            }
        }
    }

    this.findUniqueActionName = function (name) {
        // Make sure we don't make two actions with the same name.
        var actionNames = [];
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].name === 'text') {
                var c = this.blockList[blk].connections[0];
                if (c != null && this.blockList[c].name === 'action') {
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
    }

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
    }

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
            regeneratePalette(blockPalette);
        }
    }

    this.renameDos = function (oldName, newName) {
        if (oldName === newName) {
            return;
        }
        // Update the blocks, do->oldName should be do->newName
        // Named dos are modified in a separate function below.
        for (var blk = 0; blk < this.blockList.length; blk++) {
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
    }

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
        // console.log('updating the palette in renameNameddos');
        var actionsPalette = this.palettes.dict['actions'];
        var nameChanged = false;
        for (var blockId = 0; blockId < actionsPalette.protoList.length; blockId++) {
            var block = actionsPalette.protoList[blockId];
            if (['nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg'].indexOf(block.name) !== -1 && block.defaults[0] !== _('action') && block.defaults[0] === oldName) {
                // console.log('renaming ' + block.name + ': ' + block.defaults[0] + ' to ' + newName);
                block.defaults[0] = newName;
                nameChanged = true;
            }
        }
        // Force an update if the name has changed.
        if (nameChanged) {
            regeneratePalette(actionsPalette);
        }
    }

    this.newStoreinBlock = function (name) {
        if ('myStorein_' + name in this.protoBlockDict) {
            return;
        }
        // console.log('new storein block ' + name);
        var myStoreinBlock = new ProtoBlock('storein');
        this.protoBlockDict['myStorein_' + name] = myStoreinBlock;
        myStoreinBlock.palette = this.palettes.dict['boxes'];
        myStoreinBlock.defaults.push(name);
        myStoreinBlock.defaults.push(4);
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
    }

    this.newNamedboxBlock = function (name) {
        if ('myBox_' + name in this.protoBlockDict) {
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
    }

    this.newLocalArgBlock = function (name) {
        // name === 1, 2, 3, ...
        var blkname = 'arg_' + name;
        if (blkname in this.protoBlockDict) {
            return;
        }
        var myNamedArgBlock = new ProtoBlock('namedarg');
        this.protoBlockDict[blkname] = myNamedArgBlock;
        myNamedArgBlock.palette = this.palettes.dict['actions'];
        myNamedArgBlock.defaults.push(name);
        myNamedArgBlock.staticLabels.push('arg ' + name);
        myNamedArgBlock.parameterBlock();
        if (name === 'arg 1') {
            return;
        }
        myNamedArgBlock.palette.add(myNamedArgBlock);
        // Force regeneration of palette after adding new block.
        regeneratePalette(this.palettes.dict['actions']);
    }

    this.removeNamedoEntries = function (name) {
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
    }

    this.newNameddoBlock = function (name, hasReturn, hasArgs) {
        // Depending upon the form of the associated action block, we
        // want to add a named do, a named calc, a named do w/args, or
        // a named calc w/args.
        // console.log('NEW DO: ' + name + ' ' + hasReturn + ' ' + hasArgs);

        if (name === _('action')) {
            // 'action' already has its associated palette entries.
            return;
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
            // console.log('creating myDo_' + name);
            var myDoBlock = new ProtoBlock('nameddo');
            this.protoBlockDict['myDo_' + name] = myDoBlock;
            myDoBlock.palette = this.palettes.dict['actions'];
            myDoBlock.defaults.push(name);
            myDoBlock.staticLabels.push(name);
            myDoBlock.zeroArgBlock();
            // console.log('calling palette.add');
            myDoBlock.palette.add(myDoBlock, true);
            return true;
        } else {
            // console.log('myDo_' + name + ' already exists.');
            return false;
        }
    }

    this.newNamedcalcBlock = function (name) {
        if (this.protoBlockDict['myCalc_' + name] === undefined) {
            // console.log('creating myCalc_' + name);
            var myCalcBlock = new ProtoBlock('namedcalc');
            this.protoBlockDict['myCalc_' + name] = myCalcBlock;
            myCalcBlock.palette = this.palettes.dict['actions'];
            myCalcBlock.defaults.push(name);
            myCalcBlock.staticLabels.push(name);
            myCalcBlock.zeroArgBlock();
            // Add the new block to the top of the palette.
            myCalcBlock.palette.add(myCalcBlock, true);
        // } else {
        //     console.log('myCalc_' + name + ' already exists.');
        }
    }

    this.newNameddoArgBlock = function (name) {
        if (this.protoBlockDict['myDoArg_' + name] === undefined) {
            // console.log('creating myDoArg_' + name);
            var myDoArgBlock = new ProtoBlock('nameddoArg');
            this.protoBlockDict['myDoArg_' + name] = myDoArgBlock;
            myDoArgBlock.palette = this.palettes.dict['actions'];
            myDoArgBlock.defaults.push(name);
            myDoArgBlock.staticLabels.push(name);
            myDoArgBlock.zeroArgBlock();
            // Add the new block to the top of the palette.
            myDoArgBlock.palette.add(myDoArgBlock, true);
        // } else {
        //     console.log('myDoArg_' + name + ' already exists.');
        }
    }

    this.newNamedcalcArgBlock = function (name) {
        if (this.protoBlockDict['myCalcArg_' + name] === undefined) {
            // console.log('creating myCalcArg_' + name);
            var myCalcArgBlock = new ProtoBlock('namedcalcArg');
            this.protoBlockDict['myCalcArg_' + name] = myCalcArgBlock;
            myCalcArgBlock.palette = this.palettes.dict['actions'];
            myCalcArgBlock.defaults.push(name);
            myCalcArgBlock.staticLabels.push(name);
            myCalcArgBlock.zeroArgBlock();
            // Add the new block to the top of the palette.
            myCalcArgBlock.palette.add(myCalcArgBlock, true);
        // } else {
        //     console.log('myCalcArg_' + name + ' already exists.');
        }
    }

    this.insideArgClamp = function (blk) {
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
    }

    this.insideExpandableBlock = function (blk) {
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
                if (blk === last(this.blockList[cblk].connections)) {
                    return this.insideExpandableBlock(cblk);
                } else {
                    return cblk;
                }
            } else {
                return this.insideExpandableBlock(cblk);
            }
        }
    }

    this.triggerLongPress = function (myBlock) {
        this.timeOut == null;
        this.inLongPress = true;
        var z = this.stage.getNumChildren() - 1;
        this.copyButton.visible = true;
        this.copyButton.x = myBlock.container.x - 27;
        this.copyButton.y = myBlock.container.y - 27;
        this.stage.setChildIndex(this.copyButton, z);
        this.dismissButton.visible = true;
        this.dismissButton.x = myBlock.container.x + 27;
        this.dismissButton.y = myBlock.container.y - 27;
        this.stage.setChildIndex(this.dismissButton, z - 1);
        if (myBlock.name === 'action') {
            this.saveStackButton.visible = true;
            this.saveStackButton.x = myBlock.container.x + 82;
            this.saveStackButton.y = myBlock.container.y - 27;
            this.stage.setChildIndex(this.saveStackButton, z - 2);
        }
        this.refreshCanvas();
    }

    this.pasteStack = function () {
        // Copy a stack of blocks by creating a blockObjs and passing
        // it to this.load.
        if (this.selectedStack == null) {
            return;
        }
        var blockObjs = this.copyBlocksToObj();
        this.loadNewBlocks(blockObjs);
    }

    this.saveStack = function () {
        // Save a stack of blocks to local storage and the 'myblocks'
        // palette by creating a blockObjs and ...
        if (this.selectedStack == null) {
            return;
        }
        var blockObjs = this.copyBlocksToObj();
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
                    this.palettes.updatePalettes('myblocks');
                });
            } else {
                this.addToMyPalette(name, blockObjs);
                this.palettes.updatePalettes('myblocks');
            }
        }
    };

    this.copyBlocksToObj = function () {
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
    }

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
    }

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
            if (this.blockList[b].name === 'action') {
                if (this.blockList[b].connections[1] != null) {
                    currentActionNames.push(this.blockList[this.blockList[b].connections[1]].value);
                }
            } else if (this.blockList[b].name === 'storein') {
                if (this.blockList[b].connections[1] != null) {
                    currentStoreinNames.push(this.blockList[this.blockList[b].connections[1]].value);
                }
            }
        }

        // We need to track two-arg blocks in case they need expanding.
        this.checkTwoArgBlocks = [];

        // And arg clamp blocks in case they need expanding.
        this.checkArgClampBlocks = [];

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
                continue;
            }

            if (['arg', 'twoarg'].indexOf(this.protoBlockDict[name].style) !== -1) {
                if (this.protoBlockDict[name].expandable) {
                    this.checkTwoArgBlocks.push(this.blockList.length + b);
                }
            }

            if (['clamp', 'argclamp', 'argclamparg', 'doubleclamp'].indexOf(this.protoBlockDict[name].style) !== -1) {
		this.checkArgClampBlocks.push(this.blockList.length + b);
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
            case 'matrix':
            case 'drum':
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
                // console.log('action ' + oldName + ' is being renamed ' + name);
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
                        // console.log('renaming ' + oldName + ' to ' + name);
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
            this.palettes.updatePalettes('actions');
        }

        // Append to the current set of blocks.
        this.adjustTheseDocks = [];
        this.loadCounter = blockObjs.length;
        // We add new blocks to the end of the block list.
        var blockOffset = this.blockList.length;
        var firstBlock = this.blockList.length;

        var hiddenBlocks = [];
        console.log(this.loadCounter + ' blocks to load');
        for (var b = 0; b < this.loadCounter; b++) {
            var thisBlock = blockOffset + b;
            var blkData = blockObjs[b];

            if (typeof(blkData[1]) === 'object') {
                if (blkData[1].length === 1) {
                    blkInfo = [blkData[1][0], {'value': null}];
                } else if (['number', 'string'].indexOf(typeof(blkData[1][1])) !== -1) {
                    blkInfo = [blkData[1][0], {'value': blkData[1][1]}];
                    if (['start', 'drum', 'action', 'matrix', 'hat'].indexOf(blkData[1][0]) !== -1) {
                        blkInfo[1]['collapsed'] = false;
                    }
                } else {
                    blkInfo = blkData[1];
                }
            } else {
                blkInfo = [blkData[1], {'value': null}];
                if (['start', 'drum', 'action', 'matrix', 'hat'].indexOf(blkData[1]) !== -1) {
                    blkInfo[1]['collapsed'] = false;
                }
            }

            var name = blkInfo[0];

            var collapsed = false;
            if (['start', 'drum', 'matrix', 'action'].indexOf(name) !== -1) {
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

            var me = this;
            // A few special cases.
            switch (name) {
                // Add a hidden block to the end of any clamp blocks.
            case 'note':
            case 'rhythmicdot':
            case 'tie':
            case 'dividebeatfactor':
            case 'multiplybeatfactor':
            case 'duplicatenotes':
            case 'skipnotes':
            case 'setbpm':
            case 'drift':
            case 'osctime':
            case 'sharp':
            case 'flat':
            case 'settransposition':
            case 'invert':
            case 'staccato':
            case 'slur':
            case 'swing':
            case 'crescendo':
            case 'setnotevolume2':
            case 'matrix':
            case 'tuplet2':
            case 'fill':
            case 'hollowline':
                if (last(blkData[4]) == null) {
                    var len = blkData[4].length;
                    blkData[4][len - 1] = this.loadCounter + hiddenBlocks.length;  // blockOffset is added in later.
                    hiddenBlocks.push([thisBlock, null]);
                } else if (blockObjs[last(blkData[4])][1] !== 'hidden') {
                    var len = blkData[4].length;
                    var nextBlock = last(blkData[4]);
                    blkData[4][len - 1] = this.loadCounter + hiddenBlocks.length;  // blockOffset is added in later.
                    blockObjs[nextBlock][4][0] = this.loadCounter + hiddenBlocks.length;  // blockOffset is added in later.
                    hiddenBlocks.push([thisBlock, blockOffset + nextBlock]);
                }
                this.makeNewBlockWithConnections(name, blockOffset, blkData[4], null);
                break;
                // Only add 'collapsed' arg to start, action blocks.
            case 'start':
                blkData[4][0] = null;
                blkData[4][2] = null;
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var blkInfo = args[1];
                    me.blockList[thisBlock].value = me.turtles.turtleList.length;
                    me.turtles.addTurtle(me.blockList[thisBlock], blkInfo);
                }
                this.makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, blkInfo[1]], collapsed);
                break;
            case 'drum':
                blkData[4][0] = null;
                blkData[4][2] = null;
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var blkInfo = args[1];
                    me.blockList[thisBlock].value = me.turtles.turtleList.length;
                    me.turtles.addDrum(me.blockList[thisBlock], blkInfo);
                }
                this.makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, blkInfo[1]], collapsed);
                break;
            case 'action':
            case 'hat':
                blkData[4][0] = null;
                blkData[4][3] = null;
                this.makeNewBlockWithConnections('action', blockOffset, blkData[4], null, null, collapsed);
                break;

                // Named boxes and dos need private data.
            case 'namedbox':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].privateData = value;
                    me.blockList[thisBlock].value = null;
                }
                this.makeNewBlockWithConnections('namedbox', blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'namedarg':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].privateData = value;
                    me.blockList[thisBlock].value = null;
                }
                this.makeNewBlockWithConnections('namedarg', blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'namedcalc':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].privateData = value;
                    me.blockList[thisBlock].value = null;
                }
                this.makeNewBlockWithConnections('namedcalc', blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'nameddo':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].privateData = value;
                    me.blockList[thisBlock].value = null;
                }
                this.makeNewBlockWithConnections('nameddo', blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;

                // Arg clamps may need extra slots added.
            case 'doArg':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var extraSlots = args[1].length - 4;
                    if (extraSlots > 0) {
                        var slotList = me.blockList[thisBlock].argClampSlots;
                        for (var i = 0; i < extraSlots; i++) {
                            slotList.push(1);
                            me.newLocalArgBlock(slotList.length);
                            me.blockList[thisBlock].connections.push(null);
                        }
                        me.blockList[thisBlock].updateArgSlots(slotList);
                        for (var i = 0; i < args[1].length; i++) {
                            if (args[1][i] != null) {
                                me.blockList[thisBlock].connections[i] = args[1][i] + firstBlock;
                            } else {
                                me.blockList[thisBlock].connections[i] = args[1][i];
                            }
                        }
                    }
                    me.checkArgClampBlocks.push(thisBlock);
                }
                this.makeNewBlockWithConnections('doArg', blockOffset, blkData[4], postProcess, [thisBlock, blkData[4]]);
                break;
            case 'nameddoArg':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].privateData = value;
                    me.blockList[thisBlock].value = null;
                    var extraSlots = args[2].length - 3;
                    if (extraSlots > 0) {
                        var slotList = me.blockList[thisBlock].argClampSlots;
                        for (var i = 0; i < extraSlots; i++) {
                            slotList.push(1);
                            me.newLocalArgBlock(slotList.length);
                            me.blockList[thisBlock].connections.push(null);
                        }
                        me.blockList[thisBlock].updateArgSlots(slotList);
                        for (var i = 0; i < args[2].length; i++) {
                            if (args[2][i] != null) {
                                me.blockList[thisBlock].connections[i] = args[2][i] + firstBlock;
                            } else {
                                me.blockList[thisBlock].connections[i] = args[2][i];
                            }
                        }
                    }
                    me.checkArgClampBlocks.push(thisBlock);
                }
                this.makeNewBlockWithConnections('nameddoArg', blockOffset, blkData[4], postProcess, [thisBlock, value, blkData[4]]);
                break;
            case 'calcArg':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var extraSlots = args[1].length - 3;
                    if (extraSlots > 0) {
                        var slotList = me.blockList[thisBlock].argClampSlots;
                        for (var i = 0; i < extraSlots; i++) {
                            slotList.push(1);
                            me.newLocalArgBlock(slotList.length);
                            me.blockList[thisBlock].connections.push(null);
                        }
                        me.blockList[thisBlock].updateArgSlots(slotList);
                        for (var i = 0; i < args[1].length; i++) {
                            if (args[1][i] != null) {
                                me.blockList[thisBlock].connections[i] = args[1][i] + firstBlock;
                            } else {
                                me.blockList[thisBlock].connections[i] = args[1][i];
                            }
                        }
                    }
                    me.checkArgClampBlocks.push(thisBlock);
                }
                this.makeNewBlockWithConnections('calcArg', blockOffset, blkData[4], postProcess, [thisBlock, blkData[4]]);
                break;
            case 'namedcalcArg':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].privateData = value;
                    me.blockList[thisBlock].value = null;
                    var extraSlots = args[2].length - 2;
                    if (extraSlots > 0) {
                        var slotList = me.blockList[thisBlock].argClampSlots;
                        for (var i = 0; i < extraSlots; i++) {
                            slotList.push(1);
                            me.newLocalArgBlock(slotList.length);
                            me.blockList[thisBlock].connections.push(null);
                        }
                        me.blockList[thisBlock].updateArgSlots(slotList);
                        for (var i = 0; i < args[2].length; i++) {
                            if (args[2][i] != null) {
                                me.blockList[thisBlock].connections[i] = args[2][i] + firstBlock;
                            } else {
                                me.blockList[thisBlock].connections[i] = args[2][i];
                            }
                        }
                    }
                    me.checkArgClampBlocks.push(thisBlock);
                }
                this.makeNewBlockWithConnections('namedcalcArg', blockOffset, blkData[4], postProcess, [thisBlock, value, blkData[4]]);
                break;

                // Value blocks need a default value set.
            case 'number':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].value = Number(value);
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'text':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].value = value;
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'solfege':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].value = value;
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'notename':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].value = value;
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'media':
                // Load a thumbnail into a media blocks.
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].value = value;
                    if (value != null) {
                        // Load artwork onto media block.
                        me.blockList[thisBlock].loadThumbnail(null);
                    }
                }
                this.makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'camera':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].value = CAMERAVALUE;
                }
                this.makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;
            case 'video':
                postProcess = function (args) {
                    var thisBlock = args[0];
                    var value = args[1];
                    me.blockList[thisBlock].value = VIDEOVALUE;
                }
                this.makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
                break;

                // Define some constants for legacy blocks for
                // backward compatibility with Python projects.
            case 'red':
            case 'black':
                postProcess = function (thisBlock) {
                    me.blockList[thisBlock].value = 0;
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'white':
                postProcess = function (thisBlock) {
                    me.blockList[thisBlock].value = 100;
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'orange':
                postProcess = function (thisBlock) {
                    me.blockList[thisBlock].value = 10;
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'yellow':
                postProcess = function (thisBlock) {
                    me.blockList[thisBlock].value = 20;
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'green':
                postProcess = function (thisBlock) {
                    me.blockList[thisBlock].value = 40;
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'blue':
                postProcess = function (thisBlock) {
                    me.blockList[thisBlock].value = 70;
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'leftpos':
                postProcess = function (thisBlock) {
                    me.blockList[thisBlock].value = -(canvas.width / 2);
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'rightpos':
                postProcess = function (thisBlock) {
                    me.blockList[thisBlock].value = (canvas.width / 2);
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'toppos':
                postProcess = function (thisBlock) {
                    me.blockList[thisBlock].value = (canvas.height / 2);
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'botpos':
            case 'bottompos':
                postProcess = function (thisBlock) {
                    me.blockList[thisBlock].value = -(canvas.height / 2);
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'width':
                postProcess = function (thisBlock) {
                    me.blockList[thisBlock].value = canvas.width;
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'height':
                postProcess = function (thisBlock) {
                    me.blockList[thisBlock].value = canvas.height;
                    me.updateBlockText(thisBlock);
                }
                this.makeNewBlockWithConnections('number', blockOffset, blkData[4], postProcess, thisBlock);
                break;
            case 'loadFile':
                postProcess = function (args) {
                    me.blockList[args[0]].value = args[1];
                    me.updateBlockText(args[0]);
                }
                this.makeNewBlockWithConnections(name, blockOffset, blkData[4], postProcess, [thisBlock, value]);
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
                this.makeNewBlockWithConnections(name, blockOffset, blkData[4], null);
                break;
            }

            if (thisBlock === this.blockList.length - 1) {
                if (this.blockList[thisBlock].connections[0] == null) {
                    this.blockList[thisBlock].container.x = blkData[2];
                    this.blockList[thisBlock].container.y = blkData[3];
                    this.adjustTheseDocks.push(thisBlock);
                    if (blkData[2] < 0 || blkData[3] < 0 || blkData[2] > canvas.width || blkData[3] > canvas.height) {
                        this.homeButtonContainers[0].visible = true;
                        this.homeButtonContainers[1].visible = false;
                    }
                }
            }

        }
        var blockOffset = this.blockList.length;
        for (var b = 0; b < hiddenBlocks.length; b++) {
            var thisBlock = blockOffset + b;
            this.makeNewBlockWithConnections('hidden', 0, [hiddenBlocks[b][0], hiddenBlocks[b][1]], null);
        }
    }

    this.cleanupAfterLoad = function (name) {
        // If all the blocks are loaded, we can make the final adjustments.
        this.loadCounter -= 1;
        if (this.loadCounter > 0) {
            return;
        }

        this.updateBlockPositions();

        if (this.checkArgClampBlocks.length > 0) {
            // We make multiple passes because we need to account for nesting.
            // FIXME: needs to be interwoven with TwoArgBlocks check.
            for (var i = 0; i < this.checkArgClampBlocks.length; i++) {
                for (var b = 0; b < this.checkArgClampBlocks.length; b++) {
                    this.adjustArgClampBlock([this.checkArgClampBlocks[b]]);
                }
            }
        }

        if (this.checkTwoArgBlocks.length > 0) {
            // We make multiple passes because we need to account for nesting.
            for (var i = 0; i < this.checkTwoArgBlocks.length; i++) {
                for (var b = 0; b < this.checkTwoArgBlocks.length; b++) {
                    this.adjustExpandableTwoArgBlock([this.checkTwoArgBlocks[b]]);
                }
            }
        }

        for (var blk = 0; blk < this.adjustTheseDocks.length; blk++) {
            this.loopCounter = 0;
            // console.log('Adjust Docks: ' + this.blockList[this.adjustTheseDocks[blk]].name);
            this.adjustDocks(this.adjustTheseDocks[blk]);
            // blockBlocks.expandTwoArgs();
            blockBlocks.expandClamps();
        }

        for (var i = 0; i < this.blocksToCollapse.length; i++) {
            // console.log('collapse ' + this.blockList[this.blocksToCollapse[i]].name);
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

        if (['action', 'nameddo', 'namedarg', 'nameddoArg', 'calc', 'calcArg', 'namedcalcArg', 'storein'].indexOf(name) != -1) {
            // console.log(name);
            this.checkPaletteEntries(name);
	}
    }

    this.checkPaletteEntries = function (name) {
        var updatePalettes = false;
        for (var blk = 0; blk < this.blockList.length; blk++) {
            if (this.blockList[blk].name === 'action') {
                var myBlock = this.blockList[blk];
                var arg = null;
                var c = myBlock.connections[1];
                if (c != null && this.blockList[c].value !== _('action')) {
                    // console.log('calling newNameddoBlock with name ' + this.blockList[c].value);
                    if (this.newNameddoBlock(this.blockList[c].value, this.actionHasReturn(blk), this.actionHasArgs(blk))) {
                        updatePalettes = true;
                    }
                }
            }
        }
        if (updatePalettes) {
            // console.log('in checkPaletteEntries');
            if (name === 'storein') {
		this.palettes.updatePalettes('boxes');
            } else {
		this.palettes.updatePalettes('actions');
            }
        }
    }

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
    }

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
    }

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
    }

    blockBlocks = this;
    return this;
}


function sendStackToTrash(blocks, myBlock) {
    var thisBlock = blocks.blockList.indexOf(myBlock);

    // Add this block to the list of blocks in the trash so we can
    // undo this action.
    blocks.trashStacks.push(thisBlock);

    // Disconnect block.
    var b = myBlock.connections[0];
    if (b != null) {
        for (var c in blocks.blockList[b].connections) {
            if (blocks.blockList[b].connections[c] === thisBlock) {
                blocks.blockList[b].connections[c] = null;
                break;
            }
        }
        myBlock.connections[0] = null;
    }

    if (myBlock.name === 'start' || myBlock.name === 'drum') {
        turtle = myBlock.value;
        if (turtle != null) {
            console.log('putting turtle ' + turtle + ' in the trash');
            blocks.turtles.turtleList[turtle].trash = true;
            blocks.turtles.turtleList[turtle].container.visible = false;
        } else {
            console.log('null turtle');
        }
    }

    if (myBlock.name === 'action') {
        var actionArg = blocks.blockList[myBlock.connections[1]];
        if (actionArg) {
            var actionName = actionArg.value;
            for (var blockId = 0; blockId < blocks.blockList.length; blockId++) {
                var myBlock = blocks.blockList[blockId];
                var blkParent = blocks.blockList[myBlock.connections[0]];
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

            var blockPalette = blocks.palettes.dict['actions'];
            var blockRemoved = false;

            for (var blockId = 0; blockId < blockPalette.protoList.length; blockId++) {
                var block = blockPalette.protoList[blockId];
                if (['nameddo', 'namedcalc', 'nameddoArg', 'namedcalcArg'].indexOf(block.name) !== -1 && block.privateData !== _('action')) {
                    blockPalette.protoList.splice(blockPalette.protoList.indexOf(block), 1);
                    // Any of these could be in the palette.
                    if (blocks.protoBlockDict['myDo_' + actionName]) {
                        // console.log('deleting protoblocks for action ' + actionName);
                        blocks.protoBlockDict['myDo_' + actionName].hide = true;
                        delete blocks.protoBlockDict['myDo_' + actionName];
                    } else if (blocks.protoBlockDict['myCalc_' + actionName]) {
                        // console.log('deleting protoblocks for action ' + actionName);
                        blocks.protoBlockDict['myCalc_' + actionName].hide = true;
                        delete blocks.protoBlockDict['myCalc_' + actionName];
                    } else if (blocks.protoBlockDict['myDoArg_' + actionName]) {
                        // console.log('deleting protoblocks for action ' + actionName);
                        blocks.protoBlockDict['myDoArg_' + actionName].hide = true;
                        delete blocks.protoBlockDict['myDoArg_' + actionName];
                    } else if (blocks.protoBlockDict['myCalcArg_' + actionName]) {
                        // console.log('deleting protoblocks for action ' + actionName);
                        blocks.protoBlockDict['myCalcArg_' + actionName].hide = true;
                        delete blocks.protoBlockDict['myCalcArg_' + actionName];
                    }
                    blockPalette.y = 0;
                    blockRemoved = true;
                }
            }
            // Force an update if a block was removed.
            if (blockRemoved) {
                regeneratePalette(blockPalette);
            }
        }
    }

    // put drag group in trash
    blocks.findDragGroup(thisBlock);
    for (var b = 0; b < blocks.dragGroup.length; b++) {
        var blk = blocks.dragGroup[b];
        // console.log('putting ' + blocks.blockList[blk].name + ' in the trash');
        blocks.blockList[blk].trash = true;
        blocks.blockList[blk].hide();
        blocks.refreshCanvas();
    }
}
