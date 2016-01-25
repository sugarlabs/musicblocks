// Copyright (c) 2014,2015 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Length of a long touch
var LONGPRESSTIME = 2000;
var COLLAPSABLES = ['drum', 'start', 'action', 'matrix'];

// Define block instance objects and any methods that are intra-block.
function Block(protoblock, blocks, overrideName) {
    if (protoblock == null) {
        console.log('null protoblock sent to Block');
        return;
    }
    this.protoblock = protoblock;
    this.name = protoblock.name;
    this.overrideName = overrideName;
    this.blocks = blocks;
    this.x = 0;
    this.y = 0;
    this.collapsed = false; // Is this block in a collapsed stack?
    this.trash = false; // Is this block in the trash?
    this.loadComplete = false; // Has the block finished loading?
    this.label = null; // Editable textview in DOM.
    this.labelattr = null;  // Secondary select in DOM.
    this.text = null; // A dynamically generated text label on block itself.
    this.value = null; // Value for number, text, and media blocks.
    this.privateData = null; // A block may have some private data,
                             // e.g., nameboxes use this field to store
                             // the box name associated with the block.
    this.image = protoblock.image; // The file path of the image.
    this.imageBitmap = null;

    // All blocks have at a container and least one bitmap.
    this.container = null;
    this.bounds = null;
    this.bitmap = null;
    this.highlightBitmap = null;

    // The svg from which the bitmaps are generated
    this.artwork = null;
    this.collapseArtwork = null;

    // Start and Action blocks has a collapse button (in a separate
    // container).
    this.collapseContainer = null;
    this.collapseBitmap = null;
    this.expandBitmap = null;
    this.collapseBlockBitmap = null;
    this.highlightCollapseBlockBitmap = null;
    this.collapseText = null;

    this.size = 1; // Proto size is copied here.
    this.docks = []; // Proto dock is copied here.
    this.connections = [];
    // Keep track of clamp count for blocks with clamps
    this.clampCount = [1, 1];
    this.argClampSlots = [1];

    // Some blocks have some post process after they are first loaded.
    this.postProcess = null;
    this.postProcessArg = null;

    this.copySize = function() {
        this.size = this.protoblock.size;
    }

    this.getInfo = function() {
        return this.name + ' block';
    }

    this.highlight = function() {
        if (this.collapsed && COLLAPSABLES.indexOf(this.name) != -1) {
            // We may have a race condition.
            if (this.highlightCollapseBlockBitmap) {
                this.highlightCollapseBlockBitmap.visible = true;
                this.collapseBlockBitmap.visible = false;
                this.collapseText.visible = true;
                this.bitmap.visible = false;
                this.highlightBitmap.visible = false;
            }
        } else {
            this.bitmap.visible = false;
            this.highlightBitmap.visible = true;
            if (COLLAPSABLES.indexOf(this.name) != -1) {
                // There could be a race condition when making a
                // new action block.
                if (this.highlightCollapseBlockBitmap) {
                    if (this.collapseText != null) {
                        this.collapseText.visible = false;
                    }
                    if (this.collapseBlockBitmap.visible != null) {
                        this.collapseBlockBitmap.visible = false;
                    }
                    if (this.highlightCollapseBlockBitmap.visible != null) {
                        this.highlightCollapseBlockBitmap.visible = false;
                    }
                }
            }
        }
        this.container.updateCache();
        this.blocks.refreshCanvas();
    }

    this.unhighlight = function() {
        if (this.collapsed && COLLAPSABLES.indexOf(this.name) != -1) {
            if (this.highlightCollapseBlockBitmap) {
                this.highlightCollapseBlockBitmap.visible = false;
                this.collapseBlockBitmap.visible = true;
                this.collapseText.visible = true;
                this.bitmap.visible = false;
                this.highlightBitmap.visible = false;
            }
        } else {
            this.bitmap.visible = true;
            this.highlightBitmap.visible = false;
            if (COLLAPSABLES.indexOf(this.name) != -1) {
                if (this.highlightCollapseBlockBitmap) {
                    this.highlightCollapseBlockBitmap.visible = false;
                    this.collapseBlockBitmap.visible = false;
                    this.collapseText.visible = false;
                }
            }
        }
        this.container.updateCache();
        this.blocks.refreshCanvas();
    }

    this.updateArgSlots = function(slotList) {
        // Resize and update number of slots in argClamp
        this.argClampSlots = slotList;
        this.newArtwork();
        this.regenerateArtwork(false);
    }

    this.updateSlots = function(clamp, plusMinus) {
        // Resize an expandable block.
        this.clampCount[clamp] += plusMinus;
        this.newArtwork(plusMinus);
        this.regenerateArtwork(false);
    }

    this.resize = function(blockScale) {
        // If the block scale changes, we need to regenerate the
        // artwork and recalculate the hitarea.
        this.postProcess = function(myBlock) {
            if (myBlock.imageBitmap != null) {
                positionMedia(myBlock.imageBitmap, myBlock, myBlock.imageBitmap.image.width, myBlock.imageBitmap.image.height, blockScale);
                z = myBlock.container.getNumChildren() - 1;
                myBlock.container.setChildIndex(myBlock.imageBitmap, z);
            }
            if (myBlock.name == 'start' || myBlock.name == 'drum') {
                // Rescale the decoration on the start blocks.
                for (turtle = 0; turtle < myBlock.blocks.turtles.turtleList.length; turtle++) {
                    if (myBlock.blocks.turtles.turtleList[turtle].startBlock == myBlock) {
                        myBlock.blocks.turtles.turtleList[turtle].resizeDecoration(blockScale, myBlock.bitmap.image.width);
                        ensureDecorationOnTop(myBlock);
                        break;
                    }
                }
            }
            myBlock.container.updateCache();
            calculateBlockHitArea(myBlock);
        }
        this.protoblock.scale = blockScale;
        this.newArtwork(0);
        this.regenerateArtwork(true, []);

        if (this.text != null) {
            positionText(this, blockScale);
        }
        if (this.collapseContainer != null) {
            this.collapseContainer.uncache();
            var postProcess = function(myBlock) {
                myBlock.collapseBitmap.scaleX = myBlock.collapseBitmap.scaleY = myBlock.collapseBitmap.scale = blockScale / 2;
                myBlock.expandBitmap.scaleX = myBlock.expandBitmap.scaleY = myBlock.expandBitmap.scale = blockScale / 2;
                var bounds = myBlock.collapseContainer.getBounds();
                myBlock.collapseContainer.cache(bounds.x, bounds.y, bounds.width, bounds.height);
                positionCollapseContainer(myBlock, myBlock.protoblock.scale);
                calculateCollapseHitArea(myBlock);
            }

            this.generateCollapseArtwork(postProcess);
            var fontSize = 10 * blockScale;
            this.collapseText.font = fontSize + 'px Sans';
            positionCollapseLabel(this, blockScale);
        }
    }

    this.newArtwork = function(plusMinus) {
        switch (this.name) {
            case 'start':
            case 'drum':
            case 'action':
            case 'matrix':
                var proto = new ProtoBlock('collapse');
                proto.scale = this.protoblock.scale;
                proto.extraWidth = 10;
                proto.basicBlockCollapsed();
                var obj = proto.generator();
                this.collapseArtwork = obj[0];

                var obj = this.protoblock.generator(this.clampCount[0]);
                break;
            case 'note':
            case 'invert':
            case 'notation':
            case 'flat':
            case 'sharp':
            case 'multiplybeatfactor':
            case 'dividebeatfactor':
            case 'duplicatenotes':
            case 'skipnotes':
            case 'rhythmicdot':
            case 'settransposition':
            case 'tuplet':
            case 'tuplet2':
            case 'setbpm':
            case 'osctime':
            case 'repeat':
            case 'fill':
            case 'hollowline':
            case 'clamp':
            case 'forever':
            case 'if':
            case 'while':
            case 'until':
                var obj = this.protoblock.generator(this.clampCount[0]);
                break;
            case 'less':
            case 'greater':
            case 'equal':
                var obj = this.protoblock.generator(this.clampCount[0]);
                break;
            case 'ifthenelse':
                var obj = this.protoblock.generator(this.clampCount[0], this.clampCount[1]);
                break;
            case 'nameddoArg':
            case 'namedcalcArg':
            case 'doArg':
            case 'calcArg':
                var obj = this.protoblock.generator(this.argClampSlots);
                this.size = 2;
                for (var i = 0; i < this.argClampSlots.length; i++) {
                    this.size += this.argClampSlots[i];
                }
                this.docks = [];
                this.docks.push([obj[1][0][0], obj[1][0][1], this.protoblock.dockTypes[0]]);
                break;
            default:
                if (this.isArgBlock()) {
                    var obj = this.protoblock.generator(this.clampCount[0]);
                } else if (this.isTwoArgBlock()) {
                    var obj = this.protoblock.generator(this.clampCount[0]);
                } else {
                    var obj = this.protoblock.generator();
                }
                this.size += plusMinus;
                break;
        }

        switch (this.name) {
            case 'nameddoArg':
                for (var i = 1; i < obj[1].length - 1; i++) {
                    this.docks.push([obj[1][i][0], obj[1][i][1], 'anyin']);
                }
                this.docks.push([obj[1][2][0], obj[1][2][1], 'in']);
                break;
            case 'namedcalcArg':
                for (var i = 1; i < obj[1].length; i++) {
                    this.docks.push([obj[1][i][0], obj[1][i][1], 'anyin']);
                }
                break;
            case 'doArg':
                this.docks.push([obj[1][1][0], obj[1][1][1], this.protoblock.dockTypes[1]]);
                for (var i = 2; i < obj[1].length - 1; i++) {
                    this.docks.push([obj[1][i][0], obj[1][i][1], 'anyin']);
                }
                this.docks.push([obj[1][3][0], obj[1][3][1], 'in']);
                break;
            case 'calcArg':
                this.docks.push([obj[1][1][0], obj[1][1][1], this.protoblock.dockTypes[1]]);
                for (var i = 2; i < obj[1].length; i++) {
                    this.docks.push([obj[1][i][0], obj[1][i][1], 'anyin']);
                }
                break;
            default:
                break;
        }

        // Save new artwork and dock positions.
        this.artwork = obj[0];
        try {
            for (var i = 0; i < this.docks.length; i++) {
                this.docks[i][0] = obj[1][i][0];
                this.docks[i][1] = obj[1][i][1];
            }
	} catch (e) {
            // FIXME: For some reason, ifthenelse blocks are missing
            // an arg in the obj dock after a rescale (sometimes).
            console.log(i + ' ' + e);
	    console.log(this.name);
	    console.log(this.docks);
	    console.log(obj);
	}
    }

    this.imageLoad = function() {
        // Load any artwork associated with the block and create any
        // extra parts. Image components are loaded asynchronously so
        // most the work happens in callbacks.

        // We need a text label for some blocks. For number and text
        // blocks, this is the primary label; for parameter blocks,
        // this is used to display the current block value.
        var fontSize = 10 * this.protoblock.scale;
        this.text = new createjs.Text('', fontSize + 'px Sans', '#000000');

        this.generateArtwork(true, []);
    }

    this.addImage = function() {
        var image = new Image();
        var myBlock = this;

        image.onload = function() {
            var bitmap = new createjs.Bitmap(image);
            bitmap.name = 'media';
            myBlock.container.addChild(bitmap);
            positionMedia(bitmap, myBlock, image.width, image.height, myBlock.protoblock.scale);
            myBlock.imageBitmap = bitmap;
            myBlock.container.updateCache();
            myBlock.blocks.refreshCanvas();
        }
        image.src = this.image;
    }

    this.regenerateArtwork = function(collapse) {
        // Sometimes (in the case of namedboxes and nameddos) we need
        // to regenerate the artwork associated with a block.

        // First we need to remove the old artwork.
        this.container.removeChild(this.bitmap);
        this.container.removeChild(this.highlightBitmap);
        if (collapse && this.collapseBitmap != null) {
            this.collapseContainer.removeChild(this.collapseBitmap);
            this.collapseContainer.removeChild(this.expandBitmap);
            this.container.removeChild(this.collapseBlockBitmap);
            this.container.removeChild(this.highlightCollapseBlockBitmap);
        }
        // Then we generate new artwork.
        this.generateArtwork(false);
    }

    this.generateArtwork = function(firstTime) {
        // Get the block labels from the protoblock
        var thisBlock = this.blocks.blockList.indexOf(this);
        var block_label = '';
        if (this.overrideName) {
            block_label = this.overrideName;
        } else if (this.protoblock.staticLabels.length > 0 && !this.protoblock.image) {
            // Label should be defined inside _().
            block_label = this.protoblock.staticLabels[0];
        }
        while (this.protoblock.staticLabels.length < this.protoblock.args + 1) {
            this.protoblock.staticLabels.push('');
        }

        // Create the bitmap for the block.
        function processBitmap(name, bitmap, myBlock) {
            myBlock.bitmap = bitmap;
            myBlock.container.addChild(myBlock.bitmap);
            myBlock.bitmap.x = 0;
            myBlock.bitmap.y = 0;
            myBlock.bitmap.name = 'bmp_' + thisBlock;
            myBlock.bitmap.cursor = 'pointer';
            myBlock.blocks.refreshCanvas();

            // Create the highlight bitmap for the block.
            function processHighlightBitmap(name, bitmap, myBlock) {
                myBlock.highlightBitmap = bitmap;
                myBlock.container.addChild(myBlock.highlightBitmap);
                myBlock.highlightBitmap.x = 0;
                myBlock.highlightBitmap.y = 0;
                myBlock.highlightBitmap.name = 'bmp_highlight_' + thisBlock;
                myBlock.highlightBitmap.cursor = 'pointer';
                // Hide it to start
                myBlock.highlightBitmap.visible = false;

                // At this point, it should be safe to calculate the
                // bounds of the container and cache its contents.
                if (!firstTime) {
                    myBlock.container.uncache();
                }

                myBlock.bounds = myBlock.container.getBounds();
                if (myBlock.bounds == null) {
		    // FIXME: Why is this happening sometimes? Race condition?
		    console.log('block container for ' + + ' not yet ready.' + myBlock.name);
		} else {
		    myBlock.container.cache(myBlock.bounds.x, myBlock.bounds.y, myBlock.bounds.width, myBlock.bounds.height);
                }

                myBlock.blocks.refreshCanvas();

                if (firstTime) {
                    loadEventHandlers(myBlock);
                    if (myBlock.image != null) {
                        myBlock.addImage();
                    }
                    myBlock.finishImageLoad();
                } else {
                    if (myBlock.name == 'start' || myBlock.name == 'drum') {
                        ensureDecorationOnTop(myBlock);
                    }

                    // Adjust the docks.
                    myBlock.blocks.loopCounter = 0;
                    // console.log('adjust Docks ' + myBlock.name);
                    myBlock.blocks.adjustDocks(thisBlock);

                    // Adjust the text position.
                    positionText(myBlock, myBlock.protoblock.scale);

                    // Are there clamp blocks that need expanding?
                    if (myBlock.blocks.clampBlocksToCheck.length > 0) {
                        setTimeout(function () {
                            myBlock.blocks.adjustExpandableClampBlock();
                        }, 250);
                    }

                    if (COLLAPSABLES.indexOf(myBlock.name) != -1) {
                        myBlock.bitmap.visible = !myBlock.collapsed;
                        myBlock.highlightBitmap.visible = false;
                        myBlock.container.updateCache();
                        myBlock.blocks.refreshCanvas();
                    }
                    if (myBlock.postProcess != null) {
                        myBlock.postProcess(myBlock);
                        myBlock.postProcess = null;
                    }
                }
            }

            if (myBlock.protoblock.disabled) {
                var artwork = myBlock.artwork.replace(/fill_color/g, DISABLEDFILLCOLOR).replace(/stroke_color/g, DISABLEDSTROKECOLOR).replace('block_label', block_label);
            } else {
                var artwork = myBlock.artwork.replace(/fill_color/g, PALETTEHIGHLIGHTCOLORS[myBlock.protoblock.palette.name]).replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[myBlock.protoblock.palette.name]).replace('block_label', block_label);
            }

            for (var i = 1; i < myBlock.protoblock.staticLabels.length; i++) {
                artwork = artwork.replace('arg_label_' + i, myBlock.protoblock.staticLabels[i]);
            }
            makeBitmap(artwork, myBlock.name, processHighlightBitmap, myBlock);
        }

        if (firstTime) {
            // Create artwork and dock.
            var obj = this.protoblock.generator();
            this.artwork = obj[0];
            for (var i = 0; i < obj[1].length; i++) {
                this.docks.push([obj[1][i][0], obj[1][i][1], this.protoblock.dockTypes[i]]);
            }
        }

        if (this.protoblock.disabled) {
            var artwork = this.artwork.replace(/fill_color/g, DISABLEDFILLCOLOR).replace(/stroke_color/g, DISABLEDSTROKECOLOR).replace('block_label', block_label);
        } else {
            var artwork = this.artwork.replace(/fill_color/g, PALETTEFILLCOLORS[this.protoblock.palette.name]).replace(/stroke_color/g, PALETTESTROKECOLORS[this.protoblock.palette.name]).replace('block_label', block_label);
        }

        for (var i = 1; i < this.protoblock.staticLabels.length; i++) {
            artwork = artwork.replace('arg_label_' + i, this.protoblock.staticLabels[i]);
        }
        makeBitmap(artwork, this.name, processBitmap, this);
    }

    this.finishImageLoad = function() {
        var thisBlock = this.blocks.blockList.indexOf(this);

        // Value blocks get a modifiable text label
        if (['text', 'number', 'solfege', 'notename', 'rest'].indexOf(this.name) != -1) {
            if (this.value == null) {
                if (this.name == 'text') {
                    this.value = '---';
                } else if (this.name == 'solfege') {
                    this.value = 'sol';
                } else if (this.name == 'notename') {
                    this.value = 'G';
                } else if (this.name == 'rest') {
                    this.value = 'rest';
                } else {
                    this.value = 4;
                }
            }
            var label = this.value.toString();
            if (label.length > 8) {
                label = label.substr(0, 7) + '...';
            }
            this.text.text = label;
            this.container.addChild(this.text);
            positionText(this, this.protoblock.scale);
        } else if (this.protoblock.parameter) {
            // Parameter blocks get a text label to show their current value
            this.container.addChild(this.text);
            positionText(this, this.protoblock.scale);
        }

        if (COLLAPSABLES.indexOf(this.name) == -1) {
            this.loadComplete = true;
            if (this.postProcess != null) {
                this.postProcess(this.postProcessArg);
                this.postProcess = null;
            }
            this.blocks.refreshCanvas();
            this.blocks.cleanupAfterLoad();
        } else {
            // Start blocks and Action blocks can collapse, so add an
            // event handler
            var proto = new ProtoBlock('collapse');
            proto.scale = this.protoblock.scale;
            proto.extraWidth = 10;
            proto.basicBlockCollapsed();
            var obj = proto.generator();
            this.collapseArtwork = obj[0];
            var postProcess = function(myBlock) {
                loadCollapsibleEventHandlers(myBlock);
                myBlock.loadComplete = true;

                if (myBlock.postProcess != null) {
                    myBlock.postProcess(myBlock.postProcessArg);
                    myBlock.postProcess = null;
                }
            }
            this.generateCollapseArtwork(postProcess);
        }
    }

    this.generateCollapseArtwork = function(postProcess) {
        var thisBlock = this.blocks.blockList.indexOf(this);

            function processCollapseBitmap(name, bitmap, myBlock) {
                myBlock.collapseBlockBitmap = bitmap;
                myBlock.collapseBlockBitmap.name = 'collapse_' + thisBlock;
                myBlock.container.addChild(myBlock.collapseBlockBitmap);
                myBlock.collapseBlockBitmap.visible = myBlock.collapsed;
                myBlock.blocks.refreshCanvas();

                function processHighlightCollapseBitmap(name, bitmap, myBlock) {
                    myBlock.highlightCollapseBlockBitmap = bitmap;
                    myBlock.highlightCollapseBlockBitmap.name = 'highlight_collapse_' + thisBlock;
                    myBlock.container.addChild(myBlock.highlightCollapseBlockBitmap);
                    myBlock.highlightCollapseBlockBitmap.visible = false;

                    if (myBlock.collapseText == null) {
                        var fontSize = 10 * myBlock.protoblock.scale;
                        switch (myBlock.name) {
                        case 'action':
                            myBlock.collapseText = new createjs.Text(_('action'), fontSize + 'px Sans', '#000000');
                            break;
                        case 'start':
                            myBlock.collapseText = new createjs.Text(_('start'), fontSize + 'px Sans', '#000000');
                            break;
                        case 'matrix':
                            myBlock.collapseText = new createjs.Text(_('matrix'), fontSize + 'px Sans', '#000000');
                            break;
                        case 'drum':
                            myBlock.collapseText = new createjs.Text(_('drum'), fontSize + 'px Sans', '#000000');
                            break;
                        }
                        myBlock.collapseText.textAlign = 'left';
                        myBlock.collapseText.textBaseline = 'alphabetic';
                        myBlock.container.addChild(myBlock.collapseText);
                    }
                    positionCollapseLabel(myBlock, myBlock.protoblock.scale);
                    myBlock.collapseText.visible = myBlock.collapsed;

                    ensureDecorationOnTop(myBlock);

                    myBlock.container.updateCache();
                    myBlock.blocks.refreshCanvas();

                    myBlock.collapseContainer = new createjs.Container();
                    myBlock.collapseContainer.snapToPixelEnabled = true;

                    var image = new Image();
                    image.onload = function() {
                        myBlock.collapseBitmap = new createjs.Bitmap(image);
                        myBlock.collapseBitmap.scaleX = myBlock.collapseBitmap.scaleY = myBlock.collapseBitmap.scale = myBlock.protoblock.scale / 2;
                        myBlock.collapseContainer.addChild(myBlock.collapseBitmap);
                        myBlock.collapseBitmap.visible = !myBlock.collapsed;
                        finishCollapseButton(myBlock);
                    }
                    image.src = 'images/collapse.svg';

                    finishCollapseButton = function(myBlock) {
                        var image = new Image();
                        image.onload = function() {
                            myBlock.expandBitmap = new createjs.Bitmap(image);
                            myBlock.expandBitmap.scaleX = myBlock.expandBitmap.scaleY = myBlock.expandBitmap.scale = myBlock.protoblock.scale / 2;
                            myBlock.collapseContainer.addChild(myBlock.expandBitmap);
                            myBlock.expandBitmap.visible = myBlock.collapsed;

                            var bounds = myBlock.collapseContainer.getBounds();
                            myBlock.collapseContainer.cache(bounds.x, bounds.y, bounds.width, bounds.height);
                            myBlock.blocks.stage.addChild(myBlock.collapseContainer);
                            if (postProcess != null) {
                                postProcess(myBlock);
                            }
                            myBlock.blocks.refreshCanvas();
                            myBlock.blocks.cleanupAfterLoad();
                        }
                        image.src = 'images/expand.svg';
                    }
                }

                var artwork = myBlock.collapseArtwork;
                makeBitmap(artwork.replace(/fill_color/g, PALETTEHIGHLIGHTCOLORS[myBlock.protoblock.palette.name]).replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[myBlock.protoblock.palette.name]).replace('block_label', ''), '', processHighlightCollapseBitmap, myBlock);
            }

            var artwork = this.collapseArtwork;
            makeBitmap(artwork.replace(/fill_color/g, PALETTEFILLCOLORS[this.protoblock.palette.name]).replace(/stroke_color/g, PALETTESTROKECOLORS[this.protoblock.palette.name]).replace('block_label', ''), '', processCollapseBitmap, this);
    }

    this.hide = function() {
        this.container.visible = false;
        if (this.collapseContainer != null) {
            this.collapseContainer.visible = false;
            this.collapseText.visible = false;
        }
    }

    this.show = function() {
        if (!this.trash) {
            // If it is an action block or it is not collapsed then show it.
            if (!(COLLAPSABLES.indexOf(this.name) == -1 && this.collapsed)) {
                this.container.visible = true;
                if (this.collapseContainer != null) {
                    this.collapseContainer.visible = true;
                    this.collapseText.visible = true;
                }
            }
        }
    }

    // Utility functions
    this.isValueBlock = function() {
        return this.protoblock.style == 'value';
    }

    this.isArgBlock = function() {
        return this.protoblock.style == 'value' || this.protoblock.style == 'arg';
    }

    this.isTwoArgBlock = function() {
        return this.protoblock.style == 'twoarg';
    }

    this.isTwoArgBooleanBlock = function() {
        return ['equal', 'greater', 'less'].indexOf(this.name) != -1;
    }

    this.isClampBlock = function() {
        return this.protoblock.style == 'clamp' || this.isDoubleClampBlock();
    }

    this.isDoubleClampBlock = function() {
        return this.protoblock.style == 'doubleclamp';
    }

    this.isNoRunBlock = function() {
        return this.name == 'action';
    }

    this.isArgClamp = function() {
        return this.protoblock.style == 'argclamp' || this.protoblock.style == 'argclamparg';
    }

    this.isExpandableBlock = function() {
        return this.protoblock.expandable;
    }

    // Based on the block index into the blockList.
    this.getBlockId = function() {
        var number = blockBlocks.blockList.indexOf(this);
        return '_' + number.toString();
    }

    this.removeChildBitmap = function(name) {
        for (var child = 0; child < this.container.getNumChildren(); child++) {
            if (this.container.children[child].name == name) {
                this.container.removeChild(this.container.children[child]);
                break;
            }
        }
    }

    this.loadThumbnail = function (imagePath) {
        // Load an image thumbnail onto block.
        var thisBlock = this.blocks.blockList.indexOf(this);
        var myBlock = this;
        if (this.blocks.blockList[thisBlock].value == null && imagePath == null) {
            // console.log('loadThumbnail: no image to load?');
            return;
        }
        var image = new Image();

        image.onload = function() {
            // Before adding new artwork, remove any old artwork.
            myBlock.removeChildBitmap('media');

            var bitmap = new createjs.Bitmap(image);
            bitmap.name = 'media';


            var myContainer = new createjs.Container();
            myContainer.addChild(bitmap);

            // Resize the image to a reasonable maximum.
            var MAXWIDTH = 600;
            var MAXHEIGHT = 450;
            if (image.width > image.height) {
                if (image.width > MAXWIDTH) {
                    bitmap.scaleX = bitmap.scaleY = bitmap.scale = MAXWIDTH / image.width;
                }
            } else {
                if (image.height > MAXHEIGHT) {
                    bitmap.scaleX = bitmap.scaleY = bitmap.scale = MAXHEIGHT / image.height;
                }
            }
            var bounds = myContainer.getBounds();
            myContainer.cache(bounds.x, bounds.y, bounds.width, bounds.height);
            myBlock.value = myContainer.getCacheDataURL();
            myBlock.imageBitmap = bitmap;

            // Next, scale the bitmap for the thumbnail.
            positionMedia(bitmap, myBlock, bitmap.image.width, bitmap.image.height, myBlock.protoblock.scale);
            myBlock.container.addChild(bitmap);
            myBlock.container.updateCache();
            myBlock.blocks.refreshCanvas();
        }

        if (imagePath == null) {
            image.src = this.value;
        } else {
            image.src = imagePath;
        }
    }

    this.doOpenMedia = function (myBlock, thisBlock) {
        var fileChooser = docById('myOpenAll');

        readerAction = function (event) {
            window.scroll(0, 0)

            var reader = new FileReader();
            reader.onloadend = (function() {
                if (reader.result) {
                    if (myBlock.name == 'media') {
                        myBlock.value = reader.result;
                        myBlock.loadThumbnail(null);
                        return;
                    }
                    myBlock.value = [fileChooser.files[0].name, reader.result];
                    myBlock.blocks.updateBlockText(thisBlock);
                }
            });
            if (myBlock.name == 'media') {
                reader.readAsDataURL(fileChooser.files[0]);
            }
            else {
                reader.readAsText(fileChooser.files[0]);
            }
            fileChooser.removeEventListener('change', readerAction);
        }

        fileChooser.addEventListener('change', readerAction, false);
        fileChooser.focus();
        fileChooser.click();
        window.scroll(0, 0)
    }

    this.collapseToggle = function () {
        // Find the blocks to collapse/expand
        var thisBlock = this.blocks.blockList.indexOf(this);
        this.blocks.findDragGroup(thisBlock)

        function toggle(myBlock) {
            var collapse = myBlock.collapsed;
            if (myBlock.collapseBitmap == null) {
                console.log('collapse bitmap not ready');
                return;
            }
            myBlock.collapsed = !collapse;

            // These are the buttons to collapse/expand the stack.
            myBlock.collapseBitmap.visible = collapse;
            myBlock.expandBitmap.visible = !collapse;

            // These are the collpase-state bitmaps.
            myBlock.collapseBlockBitmap.visible = !collapse;
            myBlock.highlightCollapseBlockBitmap.visible = false;
            myBlock.collapseText.visible = !collapse;

            if (collapse) {
                myBlock.bitmap.visible = true;
            } else {
                myBlock.bitmap.visible = false;
                myBlock.container.updateCache();
            }
            myBlock.highlightBitmap.visible = false;

            if (myBlock.name == 'action') {
                // Label the collapsed block with the action label
                if (myBlock.connections[1] != null) {
                    var text = myBlock.blocks.blockList[myBlock.connections[1]].value;
                    if (text.length > 8) {
                        text = text.substr(0, 7) + '...';
                    }
                    myBlock.collapseText.text = text;
                } else {
                    myBlock.collapseText.text = '';
                }
            }

            // Make sure the text is on top.
            var z = myBlock.container.getNumChildren() - 1;
            myBlock.container.setChildIndex(myBlock.collapseText, z);

            if (myBlock.name == 'drum') {
                ensureDecorationOnTop(myBlock);
            }

            // Set collapsed state of blocks in drag group.
            if (myBlock.blocks.dragGroup.length > 0) {
                for (var b = 1; b < myBlock.blocks.dragGroup.length; b++) {
                    var blk = myBlock.blocks.dragGroup[b];
                    myBlock.blocks.blockList[blk].collapsed = !collapse;
                    myBlock.blocks.blockList[blk].container.visible = collapse;
                }
            }

            myBlock.collapseContainer.updateCache();
            myBlock.container.updateCache();
            myBlock.blocks.refreshCanvas();
        }

        toggle(this);
    }
}


function $() {
    var elements = new Array();

    for (var i = 0; i < arguments.length; i++) {
        var element = arguments[i];
        if (typeof element == 'string')
            element = docById(element);
        if (arguments.length == 1)
            return element;
        elements.push(element);
    }
    return elements;
}


function positionText(myBlock, blockScale) {
    myBlock.text.textBaseline = 'alphabetic';
    myBlock.text.textAlign = 'right';
    var fontSize = 10 * blockScale;
    myBlock.text.font = fontSize + 'px Sans';
    myBlock.text.x = TEXTX * blockScale / 2.;
    myBlock.text.y = TEXTY * blockScale / 2.;

    // Some special cases
    if (['text', 'number', 'solfege', 'notename'].indexOf(myBlock.name) != -1) {
        myBlock.text.textAlign = 'center';
        myBlock.text.x = VALUETEXTX * blockScale / 2.;
    } else if (myBlock.protoblock.args == 0) {
        var bounds = myBlock.container.getBounds();
        myBlock.text.x = bounds.width - 25;
    } else {
        myBlock.text.textAlign = 'left';
        if (myBlock.docks[0][2] == 'booleanout') {
             myBlock.text.y = myBlock.docks[0][1];
        }
    }

    // Ensure text is on top.
    z = myBlock.container.getNumChildren() - 1;
    myBlock.container.setChildIndex(myBlock.text, z);
    myBlock.container.updateCache();
}


function positionMedia(bitmap, myBlock, width, height, blockScale) {
    if (width > height) {
        bitmap.scaleX = bitmap.scaleY = bitmap.scale = MEDIASAFEAREA[2] / width * blockScale / 2;
    } else {
        bitmap.scaleX = bitmap.scaleY = bitmap.scale = MEDIASAFEAREA[3] / height * blockScale / 2;
    }
    bitmap.x = (MEDIASAFEAREA[0] - 10) * blockScale / 2;
    bitmap.y = MEDIASAFEAREA[1] * blockScale / 2;
}


function calculateCollapseHitArea(myBlock) {
    var bounds = myBlock.collapseContainer.getBounds();
    var hitArea = new createjs.Shape();
    var w2 = bounds.width;
    var h2 = bounds.height;
    hitArea.graphics.beginFill('#FFF').drawEllipse(-w2 / 2, -h2 / 2, w2, h2);
    hitArea.x = w2 / 2;
    hitArea.y = h2 / 2;
    myBlock.collapseContainer.hitArea = hitArea;
}


function positionCollapseLabel(myBlock, blockScale) {
    myBlock.collapseText.x = COLLAPSETEXTX * blockScale / 2;
    myBlock.collapseText.y = COLLAPSETEXTY * blockScale / 2;

    // Ensure text is on top.
    z = myBlock.container.getNumChildren() - 1;
    myBlock.container.setChildIndex(myBlock.collapseText, z);
}


function positionCollapseContainer(myBlock, blockScale) {
    myBlock.collapseContainer.x = myBlock.container.x + COLLAPSEBUTTONXOFF * blockScale / 2;
    myBlock.collapseContainer.y = myBlock.container.y + COLLAPSEBUTTONYOFF * blockScale / 2;
}


// These are the event handlers for collapsible blocks.
function loadCollapsibleEventHandlers(myBlock) {
    var thisBlock = myBlock.blocks.blockList.indexOf(myBlock);
    calculateCollapseHitArea(myBlock);

    myBlock.collapseContainer.on('mouseover', function(event) {
        myBlock.blocks.highlight(thisBlock, true);
        myBlock.blocks.activeBlock = thisBlock;
        myBlock.blocks.refreshCanvas();
    });

    var moved = false;
    var locked = false;
    var mousedown = false;
    var offset = {x:0, y:0};

    function handleClick () {
        if (locked) {
            return;
        }
        locked = true;
        setTimeout(function() {
            locked = false;
        }, 500);
        hideDOMLabel();
        if (!moved) {
            myBlock.collapseToggle();
        }
    }

    myBlock.collapseContainer.on('click', function(event) {
        handleClick();
    });

    myBlock.collapseContainer.on('mousedown', function(event) {
        hideDOMLabel();
        // Always show the trash when there is a block selected.
        trashcan.show();
        moved = false;
        mousedown = true;
        var d = new Date();
        blocks.time = d.getTime();
        offset = {
            x: myBlock.collapseContainer.x - Math.round(event.stageX / myBlock.blocks.blockScale),
            y: myBlock.collapseContainer.y - Math.round(event.stageY / myBlock.blocks.blockScale)
        };

    });

    myBlock.collapseContainer.on('pressup', function(event) {
        if (!mousedown) {
            // console.log('pressup w/o mouse down?');
            return;
        }
        mousedown = false;
        if (moved) {
            collapseOut(blocks, myBlock, thisBlock, moved, event);
            moved = false;
        } else {
            var d = new Date();
            if ((d.getTime() - blocks.time) > 1000) {
                var d = new Date();
                blocks.time = d.getTime();
                handleClick();
            }
        }
    });

    myBlock.collapseContainer.on('mouseout', function(event) {
        if (!mousedown) {
            // console.log('mouseout w/o mouse down?');
            return;
        }
        mousedown = false;
        if (moved) {
            collapseOut(blocks, myBlock, thisBlock, moved, event);
            moved = false;
        } else {
            // Maybe restrict to Android?
            var d = new Date();
            // var diff = (d.getTime() - blocks.time);
            // console.log(diff);
            if ((d.getTime() - blocks.time) < 200) {
                var d = new Date();
                blocks.time = d.getTime();
                handleClick();
            }
        }
    });

    myBlock.collapseContainer.on('pressmove', function(event) {
        if (!mousedown) {
            // console.log('pressmove w/o mouse down?');
            return;
        }
        moved = true;
        var oldX = myBlock.collapseContainer.x;
        var oldY = myBlock.collapseContainer.y;
        myBlock.collapseContainer.x = Math.round(event.stageX / myBlock.blocks.blockScale + offset.x);
        myBlock.collapseContainer.y = Math.round(event.stageY / myBlock.blocks.blockScale + offset.y);
        var dx = myBlock.collapseContainer.x - oldX;
        var dy = myBlock.collapseContainer.y - oldY;
        myBlock.container.x += dx;
        myBlock.container.y += dy;
        myBlock.x = myBlock.container.x;
        myBlock.y = myBlock.container.y;

        // If we are over the trash, warn the user.
        if (trashcan.overTrashcan(event.stageX / myBlock.blocks.blockScale, event.stageY / myBlock.blocks.blockScale)) {
            trashcan.highlight();
        } else {
            trashcan.unhighlight();
        }

        myBlock.blocks.findDragGroup(thisBlock)
        if (myBlock.blocks.dragGroup.length > 0) {
            for (var b = 0; b < myBlock.blocks.dragGroup.length; b++) {
                var blk = myBlock.blocks.dragGroup[b];
                if (b != 0) {
                    myBlock.blocks.moveBlockRelative(blk, dx, dy);
                }
            }
        }

        myBlock.blocks.refreshCanvas();
    });
}


function collapseOut(blocks, myBlock, thisBlock, moved, event) {
    // Always hide the trash when there is no block selected.
    trashcan.hide();
    blocks.unhighlight(thisBlock);
    if (moved) {
        // Check if block is in the trash.
        if (trashcan.overTrashcan(event.stageX / blocks.blockScale, event.stageY / blocks.blockScale)) {
            sendStackToTrash(blocks, myBlock);
        } else {
            // Otherwise, process move.
            blocks.blockMoved(thisBlock);
        }
    }

    if (blocks.activeBlock != myBlock) {
        return;
    }

    blocks.unhighlight(null);
    blocks.activeBlock = null;
    blocks.refreshCanvas();
}


window.hasMouse = false;
// Mousemove is not emulated for touch
document.addEventListener('mousemove', function (e) {
    window.hasMouse = true;
});


function calculateBlockHitArea(myBlock) {
    var hitArea = new createjs.Shape();
    var bounds = myBlock.container.getBounds()

    // Only detect hits on top section of block.
    if (myBlock.isClampBlock() || myBlock.isArgClamp()) {
        hitArea.graphics.beginFill('#FFF').drawRect(0, 0, bounds.width, STANDARDBLOCKHEIGHT);
    } else {
        hitArea.graphics.beginFill('#FFF').drawRect(0, 0, bounds.width, bounds.height * 0.75); // Shrinking the height makes it easier to grab blocks below in the stack.
    }
    myBlock.container.hitArea = hitArea;
}


// These are the event handlers for block containers.
function loadEventHandlers(myBlock) {
    var thisBlock = myBlock.blocks.blockList.indexOf(myBlock);
    var blocks = myBlock.blocks;

    calculateBlockHitArea(myBlock);

    myBlock.container.on('mouseover', function(event) {
        blocks.highlight(thisBlock, true);
        // blocks.activeBlock = thisBlock;
        blocks.refreshCanvas();
    });

    var haveClick = false;
    var moved = false;
    var locked = false;
    var getInput = window.hasMouse;
    myBlock.container.on('click', function(event) {
        // console.log('CLICK');
    blocks.activeBlock = thisBlock;
    haveClick = true;
        if (locked) {
            return;
        }
        locked = true;
        setTimeout(function() {
            locked = false;
        }, 500);
        hideDOMLabel();
        if ((!window.hasMouse && getInput) || (window.hasMouse && !moved)) {
            if (blocks.selectingStack) {
                var topBlock = blocks.findTopBlock(thisBlock);
                blocks.selectedStack = topBlock;
                blocks.selectingStack = false;
            } else if (myBlock.name == 'media') {
                myBlock.doOpenMedia(myBlock, thisBlock);
            } else if (myBlock.name == 'loadFile') {
                myBlock.doOpenMedia(myBlock, thisBlock);
            } else if (['text', 'number', 'solfege', 'notename'].indexOf(myBlock.name) != -1) {
                if(!myBlock.trash)
                {
                    changeLabel(myBlock);
                }
            } else {
                if (!blocks.inLongPress) {
                    var topBlock = blocks.findTopBlock(thisBlock);
                    console.log('running from ' + blocks.blockList[topBlock].name);
                    blocks.logo.runLogoCommands(topBlock);
                }
            }
        }
    });

    myBlock.container.on('mousedown', function(event) {
        // console.log('MOUSEDOWN');
        // hideDOMLabel();

        // Track time for detecting long pause...
        // but only for top block in stack
        if (myBlock.connections[0] == null) {
            var d = new Date();
            blocks.time = d.getTime();
            blocks.timeOut = setTimeout(function() {
                blocks.triggerLongPress(myBlock);
            }, LONGPRESSTIME);
        }

        // Always show the trash when there is a block selected.
        trashcan.show();

        // Raise entire stack to the top.
        blocks.raiseStackToTop(thisBlock);

        // And possibly the collapse button.
        if (myBlock.collapseContainer != null) {
            blocks.stage.setChildIndex(myBlock.collapseContainer, blocks.stage.getNumChildren() - 1);
        }

        moved = false;
        var offset = {
            x: myBlock.container.x - Math.round(event.stageX / blocks.blockScale),
            y: myBlock.container.y - Math.round(event.stageY / blocks.blockScale)
        };

        myBlock.container.on('mouseout', function(event) {
            if (haveClick) {
               return;
            }
            // console.log('MOUSEOUT');
            if (!blocks.inLongPress) {
                mouseoutCallback(myBlock, event, moved, haveClick, true);
            }
            moved = false;
        });

        myBlock.container.on('pressup', function(event) {
            if (haveClick) {
               return;
            }
            // console.log('PRESSUP');
            if (!blocks.inLongPress) {
                mouseoutCallback(myBlock, event, moved, haveClick, true);
            }
            moved = false;
        });

        var original = {x: event.stageX, y: event.stageY};
        myBlock.container.on('pressmove', function(event) {
            // console.log('PRESSMOVE');
            // FIXME: More voodoo
            event.nativeEvent.preventDefault();

            // FIXME: need to remove timer
            if (blocks.timeOut != null) {
                clearTimeout(blocks.timeOut);
                blocks.timeOut = null;
            }
            if (!moved && myBlock.label != null) {
                myBlock.label.style.display = 'none';
            }

            if (window.hasMouse) {
                moved = true;
            } else {
                // Make it eaiser to select text on mobile
                setTimeout(function () {
                    moved = Math.abs(event.stageX - original.x) + Math.abs(event.stageY - original.y) > 20 && !window.hasMouse;
                    getInput = !moved;
                }, 200);
            }

            var oldX = myBlock.container.x;
            var oldY = myBlock.container.y;
            myBlock.container.x = Math.round(event.stageX / blocks.blockScale) + offset.x;
            myBlock.container.y = Math.round(event.stageY / blocks.blockScale) + offset.y;
            myBlock.x = myBlock.container.x;
            myBlock.y = myBlock.container.y;

            // If we are over the trash, warn the user.
            if (trashcan.overTrashcan(event.stageX / blocks.blockScale, event.stageY / blocks.blockScale)) {
                trashcan.highlight();
            } else {
                trashcan.unhighlight();
            }

            if (myBlock.isValueBlock() && myBlock.name != 'media') {
                // Ensure text is on top
                var z = myBlock.container.getNumChildren() - 1;
                myBlock.container.setChildIndex(myBlock.text, z);
            } else if (myBlock.collapseContainer != null) {
                positionCollapseContainer(myBlock, myBlock.protoblock.scale);
            }

            // Move any connected blocks.
            var dx = Math.round(myBlock.container.x - oldX);
            var dy = Math.round(myBlock.container.y - oldY);

            blocks.findDragGroup(thisBlock)
            if (blocks.dragGroup.length > 0) {
                for (var b = 0; b < blocks.dragGroup.length; b++) {
                    var blk = blocks.dragGroup[b];
                    if (b != 0) {
                        blocks.moveBlockRelative(blk, dx, dy);
                    }
                }
            }
	    // if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
            //     myBlock.blocks.adjustDocks(thisBlock);
	    // }
            blocks.refreshCanvas();
        });
    });

    myBlock.container.on('mouseout', function(event) {
        if (!blocks.inLongPress) {
            // console.log('MOUSEOUT (OUT)');
            mouseoutCallback(myBlock, event, moved, haveClick, true);
        }
        moved = false;
    });

    myBlock.container.on('pressup', function(event) {
        if (!blocks.inLongPress) {
            // console.log('PRESSUP (OUT)');
            mouseoutCallback(myBlock, event, moved, haveClick, false);
        }
        moved = false;
    });
}


function mouseoutCallback(myBlock, event, moved, haveClick, hideDOM) {
    var thisBlock = myBlock.blocks.blockList.indexOf(myBlock);
    // Always hide the trash when there is no block selected.
    // FIXME: need to remove timer
    if (myBlock.blocks.timeOut != null) {
        clearTimeout(myBlock.blocks.timeOut);
        myBlock.blocks.timeOut = null;
    }
    trashcan.hide();

    if (moved) {
        // Check if block is in the trash.
        if (trashcan.overTrashcan(event.stageX / myBlock.blocks.blockScale, event.stageY / myBlock.blocks.blockScale)) {
            sendStackToTrash(blocks, myBlock);
        } else {
            // Otherwise, process move.
            // Keep track of time of last move
            var d = new Date();
            blocks.time = d.getTime();
            myBlock.blocks.blockMoved(thisBlock);

            // Just incase the blocks are not properly docked after
            // the move (workaround for issue #38 -- Blocks fly
            // apart). Still need to get to the root cause.
            myBlock.blocks.loopCounter = 0;
            // console.log('adjust Docks ' + myBlock.name);
            myBlock.blocks.adjustDocks(myBlock.blocks.blockList.indexOf(myBlock));
        }
    } else if (['text', 'solfege', 'notename', 'number', 'media', 'loadFile'].indexOf(myBlock.name) != -1) {
        if (!haveClick) {
            // Simulate click on Android.
            var d = new Date();
            if ((d.getTime() - blocks.time) < 500) {
                if(!myBlock.trash)
                {
                    var d = new Date();
                    blocks.time = d.getTime();
                    if (myBlock.name == 'media' || myBlock.name == 'loadFile') {
                        myBlock.doOpenMedia(myBlock, thisBlock);
                    } else {
                        changeLabel(myBlock);
                    }
                }
            }
        }
    }

    if (hideDOM) {
        if (myBlock.blocks.activeBlock != thisBlock) {
            hideDOMLabel();
        } else {
            myBlock.blocks.unhighlight(null);
            myBlock.blocks.refreshCanvas();
        }
        myBlock.blocks.activeBlock = null;
    }
}


function ensureDecorationOnTop(myBlock) {
    // Find the turtle decoration and move it to the top.
    for (var child = 0; child < myBlock.container.getNumChildren(); child++) {
        if (myBlock.container.children[child].name == 'decoration') {
            // Drum block in collapsed state is less wide.
            if (myBlock.name == 'drum') {
                var bounds = myBlock.container.getBounds();
                if (myBlock.collapsed) {
                    var dx = 25 * myBlock.protoblock.scale / 2;
                } else {
                    var dx = 0;
                }
                for (turtle = 0; turtle < myBlock.blocks.turtles.turtleList.length; turtle++) {
                    if (myBlock.blocks.turtles.turtleList[turtle].startBlock == myBlock) {
                        myBlock.blocks.turtles.turtleList[turtle].decorationBitmap.x = bounds.width - dx - 50 * myBlock.protoblock.scale / 2;
                      break;
                    }
                }
            }

            myBlock.container.setChildIndex(myBlock.container.children[child], myBlock.container.getNumChildren() - 1);
            break;
        }
    }
}


function makeBitmap(data, name, callback, args) {
    // Async creation of bitmap from SVG data
    // Works with Chrome, Safari, Firefox (untested on IE)
    var img = new Image();
    img.onload = function() {
        bitmap = new createjs.Bitmap(img);
        callback(name, bitmap, args);
    }
    img.src = 'data:image/svg+xml;base64,' + window.btoa(
        unescape(encodeURIComponent(data)));
}


function changeLabel(myBlock) {
    var blocks = myBlock.blocks;
    var x = myBlock.container.x;
    var y = myBlock.container.y;
    var canvasLeft = blocks.canvas.offsetLeft + 28 * blocks.blockScale;
    var canvasTop = blocks.canvas.offsetTop + 6 * blocks.blockScale;

    var movedStage = false;
    if (!window.hasMouse && blocks.stage.y + y > 75) {
        movedStage = true;
        var fromY = blocks.stage.y;
        blocks.stage.y = -y + 75;
    }

    // A place in the DOM to put modifiable labels (textareas).
    var labelValue = (myBlock.label)?myBlock.label.value:myBlock.value;
    var labelElem = docById('labelDiv');

    if (myBlock.name == 'text') {
        var type = 'text';
        labelElem.innerHTML = '<input id="textLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="text" type="text" value="' + labelValue + '" />';
        labelElem.classList.add('hasKeyboard');
        myBlock.label = docById('textLabel');
    } else if (myBlock.name == 'solfege') {
        var type = 'solfege';
        var notes = ['ti', 'la', 'sol', 'fa', 'mi', 're', 'do'];
        var attrs = ['♯♯', '♯', '♮', '♭', '♭♭'];
        if (myBlock.value != null) {
            if (notes.indexOf(myBlock.value) != -1) {
                var selectednote = myBlock.value;
                var selectedattr = '♮';
            } else if (myBlock.value.slice(0, 3) == 'sol') {
                var selectednote = 'sol';
		if (myBlock.value.length == 4) {
                    var selectedattr = myBlock.value[3];
                } else {
                    var selectedattr = myBlock.value[3] + myBlock.value[3];
                }
            } else {
                var selectednote = myBlock.value.slice(0, 2);
		if (myBlock.value.length == 3) {
                    var selectedattr = myBlock.value[2];
                } else {
                    var selectedattr = myBlock.value[2] + myBlock.value[2];
                }
            }
        } else {
            var selectednote = 'sol';
            var selectedattr = '♮'
        }
        var labelHTML = '<select name="solfege" id="solfegeLabel" style="position: absolute;  background-color: #88e20a; width: 100px;">'
        for (var i = 0; i < notes.length; i++) {
            if (selectednote == notes[i]) {
                labelHTML += '<option value="' + selectednote + '" selected>' + selectednote + '</option>';
	    } else {
                labelHTML += '<option value="' + notes[i] + '">' + notes[i] + '</option>';
            }
        }
        labelHTML += '</select>';
        labelHTML += '<select name="noteattr" id="noteattrLabel" style="position: absolute;  background-color: #88e20a; width: 60px;">';
        for (var i = 0; i < attrs.length; i++) {
            if (selectedattr == attrs[i]) {
                labelHTML += '<option value="' + selectedattr + '" selected>' + selectedattr + '</option>';
	    } else {
                labelHTML += '<option value="' + attrs[i] + '">' + attrs[i] + '</option>';
            }
        }
        labelHTML += '</select>';
        labelElem.innerHTML = labelHTML;
        myBlock.label = docById('solfegeLabel');
        myBlock.labelattr = docById('noteattrLabel');
    } else if (myBlock.name == 'notename') {
        var type = 'notename';
        var notes = ['B', 'A', 'G', 'F', 'E', 'D', 'C'];
        var attrs = ['♯♯', '♯', '♮', '♭', '♭♭'];
        if (myBlock.value != null) {
            var selectednote = myBlock.value[0];
            if (myBlock.value.length == 1) {
                var selectedattr = '♮';
            } else if (myBlock.value.length == 2) {
                var selectedattr = myBlock.value[1];
            } else {
                var selectedattr = myBlock.value[1] + myBlock.value[1];
            }
        } else {
            var selectednote = 'G';
            var selectedattr = '♮'
        }
        var labelHTML = '<select name="notename" id="notenameLabel" style="position: absolute;  background-color: #88e20a; width: 60px;">'
        for (var i = 0; i < notes.length; i++) {
            if (selectednote == notes[i]) {
                labelHTML += '<option value="' + selectednote + '" selected>' + selectednote + '</option>';
            } else {
                labelHTML += '<option value="' + notes[i] + '">' + notes[i] + '</option>';
            }
        }
        labelHTML += '</select>';
        labelHTML += '<select name="noteattr" id="noteattrLabel" style="position: absolute;  background-color: #88e20a; width: 60px;">';
        for (var i = 0; i < attrs.length; i++) {
            if (selectedattr == attrs[i]) {
                labelHTML += '<option value="' + selectedattr + '" selected>' + selectedattr + '</option>';
	    } else {
                labelHTML += '<option value="' + attrs[i] + '">' + attrs[i] + '</option>';
            }
        }
        labelHTML += '</select>';
        labelElem.innerHTML = labelHTML;
        myBlock.label = docById('notenameLabel');
        myBlock.labelattr = docById('noteattrLabel');
    } else {
        var type = 'number';
        labelElem.innerHTML = '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' + labelValue + '" />';
        labelElem.classList.add('hasKeyboard');
        myBlock.label = docById('numberLabel');
    }
    
    var focused = false;
    var blur = function (event) {
        // Not sure why the change in the input is not available
        // immediately in FireFox. We need a workaround if hardware
	// acceleration is enabled.

        if (!focused) {
            return;
        }
        labelChanged(myBlock);

        event.preventDefault();

        labelElem.classList.remove('hasKeyboard');

        window.scroll(0, 0);
        myBlock.label.removeEventListener('keypress', keypress);

        if (movedStage) {
            blocks.stage.y = fromY;
            blocks.updateStage();
        }
    };
    if (myBlock.name == 'text' || myBlock.name == 'number') {
        myBlock.label.addEventListener('blur', blur);
    }

    var keypress = function (event) {
        if ([13, 10, 9].indexOf(event.keyCode) !== -1) {
            blur(event);
        }
    };
    myBlock.label.addEventListener('keypress', keypress);

    myBlock.label.addEventListener('change', function() {
        labelChanged(myBlock);
    });

    if (myBlock.labelattr != null) {
        myBlock.labelattr.addEventListener('change', function() {
            labelChanged(myBlock);
        });
    }

    myBlock.label.style.left = Math.round((x + blocks.stage.x) * blocks.blockScale + canvasLeft) + 'px';
    myBlock.label.style.top = Math.round((y + blocks.stage.y) * blocks.blockScale + canvasTop) + 'px';
    // There may be a second select used for # and b.
    if (myBlock.labelattr != null) {
        myBlock.label.style.width = Math.round(60 * blocks.blockScale) * myBlock.protoblock.scale / 2 + 'px';
        myBlock.labelattr.style.left = Math.round((x + blocks.stage.x + 60) * blocks.blockScale + canvasLeft) + 'px';
        myBlock.labelattr.style.top = Math.round((y + blocks.stage.y) * blocks.blockScale + canvasTop) + 'px';
        myBlock.labelattr.style.width = Math.round(60 * blocks.blockScale) * myBlock.protoblock.scale / 2 + 'px';
        myBlock.labelattr.style.fontSize = Math.round(20 * blocks.blockScale * myBlock.protoblock.scale / 2) + 'px';
    } else {
        myBlock.label.style.width = Math.round(100 * blocks.blockScale) * myBlock.protoblock.scale / 2 + 'px';
    }
    myBlock.label.style.fontSize = Math.round(20 * blocks.blockScale * myBlock.protoblock.scale / 2) + 'px';
    myBlock.label.style.display = '';
    myBlock.label.focus();

    // Firefox fix
    setTimeout(function () {
        myBlock.label.style.display = '';
        myBlock.label.focus();
        focused = true;
    }, 100);
}


function labelChanged(myBlock) {
    // Update the block values as they change in the DOM label.
    if (myBlock == null) {
        return;
    }

    myBlock.label.style.display = 'none';
    if (myBlock.labelattr != null) {
        myBlock.labelattr.style.display = 'none';
    }

    var oldValue = myBlock.value;
    var newValue = myBlock.label.value;

    if (myBlock.labelattr != null) {
        var attrValue = myBlock.labelattr.value;
        switch (attrValue) {
            case '♯♯':
            case '♯':
            case '♭♭':
            case '♭':
                newValue = newValue + attrValue;
                break;
            default:
                break;
        }
    }
    if (oldValue == newValue) {
        // Nothing to do in this case.
        return;    
    }

    // Update the block value and block text.
    if (myBlock.name == 'number') {
        myBlock.value = Number(newValue);
        if (isNaN(myBlock.value)) {
            var thisBlock = myBlock.blocks.blockList.indexOf(myBlock);
            myBlock.blocks.errorMsg(newValue + ': Not a number', thisBlock);
            myBlock.blocks.refreshCanvas();
            myBlock.value = oldValue;
        }
    } else {
        myBlock.value = newValue;
    }

    var label = myBlock.value.toString();
    if (label.length > 8) {
        label = label.substr(0, 7) + '...';
    }
    myBlock.text.text = label;

    // and hide the DOM textview...
    myBlock.label.style.display = 'none';

    // Make sure text is on top.
    var z = myBlock.container.getNumChildren() - 1;
    myBlock.container.setChildIndex(myBlock.text, z);
    try {
        myBlock.container.updateCache();
    } catch (e) {
        console.log(e);
    }
    myBlock.blocks.refreshCanvas();

    var c = myBlock.connections[0];
    if (myBlock.name == 'text' && c != null) {
        var cblock = myBlock.blocks.blockList[c];
        // console.log('Label changed to: ' + myBlock.value);
        switch (cblock.name) {
            case 'action':
                // If the label was the name of an action, update the
                // associated run myBlock.blocks and the palette buttons
                // Rename both do <- name and nameddo blocks.
                console.log('renameDos and...');
                myBlock.blocks.renameDos(oldValue, newValue);
                if (oldValue == _('action')) {
                    console.log('and newNameddoBlock...');
                    myBlock.blocks.newNameddoBlock(newValue, myBlock.blocks.actionHasReturn(c), myBlock.blocks.actionHasArgs(c));
                }
                console.log('renameNameddos.');
                myBlock.blocks.renameNameddos(oldValue, newValue);
                myBlock.blocks.palettes.updatePalettes('actions');
                break;
            case 'storein':
                // If the label was the name of a storein, update the
                //associated box myBlock.blocks and the palette buttons
                if (myBlock.value != 'box') {
                    myBlock.blocks.newStoreinBlock(myBlock.value);
                    myBlock.blocks.newNamedboxBlock(myBlock.value);
                }
                // Rename both box <- name and namedbox blocks.
                myBlock.blocks.renameBoxes(oldValue, newValue);
                myBlock.blocks.renameNamedboxes(oldValue, newValue);
                myBlock.blocks.palettes.updatePalettes('boxes');
                break;
            default:
                break;
        }
    }
}
