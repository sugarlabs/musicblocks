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
//

// Length of a long touch
const LONGPRESSTIME = 1500;
const COLLAPSABLES = ['drum', 'start', 'action', 'matrix'];
const NOHIT = ['hidden'];


// Define block instance objects and any methods that are intra-block.
function Block(protoblock, blocks, overrideName) {
    if (protoblock === null) {
        console.log('null protoblock sent to Block');
        return;
    }
    this.protoblock = protoblock;
    this.name = protoblock.name;
    this.overrideName = overrideName;
    this.blocks = blocks;
    this.collapsed = false; // Is this block in a collapsed stack?
    this.trash = false; // Is this block in the trash?
    this.loadComplete = false; // Has the block finished loading?
    this.label = null; // Editable textview in DOM.
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

    // Internal function for creating cache.
    // Includes workaround for a race condition.
    this._createCache = function() {
        var myBlock = this;
        myBlock.bounds = myBlock.container.getBounds();

        if (myBlock.bounds == null) {
            // console.log('Block container for ' + myBlock.name + ' not yet ready.');
            setTimeout(function() {
                myBlock._createCache();
            }, 200);
        } else {
            myBlock.container.cache(myBlock.bounds.x, myBlock.bounds.y, myBlock.bounds.width, myBlock.bounds.height);
        }
    };

    // Internal function for creating cache.
    // Includes workaround for a race condition.
    this.updateCache = function() {
        var myBlock = this;

        if (myBlock.bounds == null) {
            // console.log('Block container for ' + myBlock.name + ' not yet ready.');
            setTimeout(function() {
                myBlock.updateCache();
            }, 300);
        } else {
            myBlock.container.updateCache();
            myBlock.blocks.refreshCanvas();
        }
    };

    this.offScreen = function (boundary) {
        return !this.trash && boundary.offScreen(this.container.x, this.container.y);
    };

    this.copySize = function() {
        this.size = this.protoblock.size;
    };

    this.getInfo = function() {
        return this.name + ' block';
    };

    this.highlight = function() {
        if (this.collapsed && COLLAPSABLES.indexOf(this.name) !== -1) {
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
            if (COLLAPSABLES.indexOf(this.name) !== -1) {
                // There could be a race condition when making a
                // new action block.
                if (this.highlightCollapseBlockBitmap) {
                    if (this.collapseText !== null) {
                        this.collapseText.visible = false;
                    }
                    if (this.collapseBlockBitmap.visible !== null) {
                        this.collapseBlockBitmap.visible = false;
                    }
                    if (this.highlightCollapseBlockBitmap.visible !== null) {
                        this.highlightCollapseBlockBitmap.visible = false;
                    }
                }
            }
        }
        this.updateCache();
    };

    this.unhighlight = function() {
        if (this.collapsed && COLLAPSABLES.indexOf(this.name) !== -1) {
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
            if (COLLAPSABLES.indexOf(this.name) !== -1) {
                if (this.highlightCollapseBlockBitmap) {
                    this.highlightCollapseBlockBitmap.visible = false;
                    this.collapseBlockBitmap.visible = false;
                    this.collapseText.visible = false;
                }
            }
        }
        this.updateCache();
    };

    this.updateArgSlots = function(slotList) {
        // Resize and update number of slots in argClamp
        this.argClampSlots = slotList;
        this.newArtwork();
        this.regenerateArtwork(false);
    };

    this.updateSlots = function(clamp, plusMinus) {
        // Resize an expandable block.
        this.clampCount[clamp] += plusMinus;
        this.newArtwork(plusMinus);
        this.regenerateArtwork(false);
    };

    this.resize = function(scale) {
        // If the block scale changes, we need to regenerate the
        // artwork and recalculate the hitarea.
        var myBlock = this;

        this.postProcess = function(args) {
            if (myBlock.imageBitmap !== null) {
                myBlock._positionMedia(myBlock.imageBitmap, myBlock.imageBitmap.image.width, myBlock.imageBitmap.image.height, scale);
                z = myBlock.container.getNumChildren() - 1;
                myBlock.container.setChildIndex(myBlock.imageBitmap, z);
            }

            if (myBlock.name === 'start' || myBlock.name === 'drum') {
                // Rescale the decoration on the start blocks.
                for (var turtle = 0; turtle < myBlock.blocks.turtles.turtleList.length; turtle++) {
                    if (myBlock.blocks.turtles.turtleList[turtle].startBlock === myBlock) {
                        myBlock.blocks.turtles.turtleList[turtle].resizeDecoration(scale, myBlock.bitmap.image.width);
                        myBlock._ensureDecorationOnTop();
                        break;
                    }
                }
            }
            myBlock.updateCache();
            myBlock._calculateBlockHitArea();

            // If it is in the trash, make sure it remains hidden.
            if (myBlock.trash) {
		myBlock.hide();
            }
        };

        this.postProcessArg = null;

        this.protoblock.scale = scale;
        this.newArtwork(0);
        this.regenerateArtwork(true, []);

        if (this.text !== null) {
            this._positionText(scale);
        }

        if (this.collapseContainer !== null) {
            this.collapseContainer.uncache();
            var postProcess = function(myBlock) {
                myBlock.collapseBitmap.scaleX = myBlock.collapseBitmap.scaleY = myBlock.collapseBitmap.scale = scale / 2;
                myBlock.expandBitmap.scaleX = myBlock.expandBitmap.scaleY = myBlock.expandBitmap.scale = scale / 2;

                var bounds = myBlock.collapseContainer.getBounds();
                myBlock.collapseContainer.cache(bounds.x, bounds.y, bounds.width, bounds.height);
                myBlock._positionCollapseContainer(myBlock.protoblock.scale);
                myBlock._calculateCollapseHitArea();
            };

            this._generateCollapseArtwork(postProcess);
            var fontSize = 10 * scale;
            this.collapseText.font = fontSize + 'px Sans';
            this._positionCollapseLabel(scale);
        }
    };

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
        case 'tie':
        case 'swing':
        case 'drift':
        case 'staccato':
        case 'slur':
        case 'crescendo':
        case 'articulation':
        case 'settransposition':
        case 'tuplet':
        case 'tuplet2':
        case 'osctime':
        case 'setbpm':
        case 'setnotevolume2':
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
        for (var i = 0; i < this.docks.length; i++) {
            this.docks[i][0] = obj[1][i][0];
            this.docks[i][1] = obj[1][i][1];
        }
    };

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
    };

    this._addImage = function() {
        var image = new Image();
        var myBlock = this;

        image.onload = function() {
            var bitmap = new createjs.Bitmap(image);
            bitmap.name = 'media';
            myBlock.container.addChild(bitmap);
            myBlock._positionMedia(bitmap, image.width, image.height, myBlock.protoblock.scale);
            myBlock.imageBitmap = bitmap;
            myBlock.updateCache();
        };
        image.src = this.image;
    };

    this.regenerateArtwork = function(collapse) {
        // Sometimes (in the case of namedboxes and nameddos) we need
        // to regenerate the artwork associated with a block.

        // First we need to remove the old artwork.
        if (this.bitmap != null) {
            this.container.removeChild(this.bitmap);
        }

        if (this.highlightBitmap != null) {
            this.container.removeChild(this.highlightBitmap);
        }

        if (collapse && this.collapseBitmap !== null) {
            this.collapseContainer.removeChild(this.collapseBitmap);
            this.collapseContainer.removeChild(this.expandBitmap);
            this.container.removeChild(this.collapseBlockBitmap);
            this.container.removeChild(this.highlightCollapseBlockBitmap);
        }

        // Then we generate new artwork.
        this.generateArtwork(false);
    };

    this.generateArtwork = function(firstTime) {
        // Get the block labels from the protoblock
        var myBlock = this;
        var thisBlock = this.blocks.blockList.indexOf(this);
        var block_label = '';

        // Create the highlight bitmap for the block.
        function __processHighlightBitmap(name, bitmap, myBlock) {
            if (myBlock.highlightBitmap != null) {
                myBlock.container.removeChild(myBlock.highlightBitmap);
            }

            myBlock.highlightBitmap = bitmap;
            myBlock.container.addChild(myBlock.highlightBitmap);
            myBlock.highlightBitmap.x = 0;
            myBlock.highlightBitmap.y = 0;
            myBlock.highlightBitmap.name = 'bmp_highlight_' + thisBlock;
            myBlock.highlightBitmap.cursor = 'pointer';
            // Hide it to start
            myBlock.highlightBitmap.visible = false;

            // At me point, it should be safe to calculate the
            // bounds of the container and cache its contents.
            if (!firstTime) {
                myBlock.container.uncache();
            }

            myBlock._createCache();
            myBlock.blocks.refreshCanvas();

            if (firstTime) {
                myBlock._loadEventHandlers();
                if (myBlock.image !== null) {
                    myBlock._addImage();
                }
                myBlock._finishImageLoad();
            } else {
                if (myBlock.name === 'start' || myBlock.name === 'drum') {
                    myBlock._ensureDecorationOnTop();
                }

                // Adjust the docks.
                myBlock.blocks.adjustDocks(thisBlock, true);

                // Adjust the text position.
                myBlock._positionText(myBlock.protoblock.scale);

                if (COLLAPSABLES.indexOf(myBlock.name) !== -1) {
                    myBlock.bitmap.visible = !myBlock.collapsed;
                    myBlock.highlightBitmap.visible = false;
                    myBlock.updateCache();
                }

                if (myBlock.postProcess != null) {
                    myBlock.postProcess(myBlock.postProcessArg);
                    myBlock.postProcess = null;
                }
            }
        };

        // Create the bitmap for the block.
        function __processBitmap(name, bitmap, myBlock) {
            if (myBlock.bitmap != null) {
                myBlock.container.removeChild(myBlock.bitmap);
            }

            myBlock.bitmap = bitmap;
            myBlock.container.addChild(myBlock.bitmap);
            myBlock.bitmap.x = 0;
            myBlock.bitmap.y = 0;
            myBlock.bitmap.name = 'bmp_' + thisBlock;
            myBlock.bitmap.cursor = 'pointer';
            myBlock.blocks.refreshCanvas();

            if (myBlock.protoblock.disabled) {
                var artwork = myBlock.artwork.replace(/fill_color/g, DISABLEDFILLCOLOR).replace(/stroke_color/g, DISABLEDSTROKECOLOR).replace('block_label', block_label);
            } else {
                var artwork = myBlock.artwork.replace(/fill_color/g, PALETTEHIGHLIGHTCOLORS[myBlock.protoblock.palette.name]).replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[myBlock.protoblock.palette.name]).replace('block_label', block_label);
            }

            for (var i = 1; i < myBlock.protoblock.staticLabels.length; i++) {
                artwork = artwork.replace('arg_label_' + i, myBlock.protoblock.staticLabels[i]);
            }

            _makeBitmap(artwork, myBlock.name, __processHighlightBitmap, myBlock);
        };

        if (this.overrideName) {
            block_label = this.overrideName;
        } else if (this.protoblock.staticLabels.length > 0 && !this.protoblock.image) {
            // Label should be defined inside _().
            block_label = this.protoblock.staticLabels[0];
        }

        while (this.protoblock.staticLabels.length < this.protoblock.args + 1) {
            this.protoblock.staticLabels.push('');
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

        _makeBitmap(artwork, this.name, __processBitmap, this);
    };

    this._finishImageLoad = function() {
        var thisBlock = this.blocks.blockList.indexOf(this);

        // Value blocks get a modifiable text label
        if (['text', 'number', 'solfege', 'notename', 'rest'].indexOf(this.name) !== -1) {
            if (this.value === null) {
                if (this.name === 'text') {
                    this.value = '---';
                } else if (this.name === 'solfege') {
                    this.value = 'sol';
                } else if (this.name === 'notename') {
                    this.value = 'G';
                } else if (this.name === 'rest') {
                    this.value = _('rest');
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
            this._positionText(this.protoblock.scale);
        } else if (this.protoblock.parameter) {
            // Parameter blocks get a text label to show their current value
            this.container.addChild(this.text);
            this._positionText(this.protoblock.scale);
        }

        if (COLLAPSABLES.indexOf(this.name) === -1) {
            this.loadComplete = true;
            if (this.postProcess !== null) {
                this.postProcess(this.postProcessArg);
                this.postProcess = null;
            }

            this.blocks.refreshCanvas();
            this.blocks.cleanupAfterLoad(this.name);
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
                myBlock._loadCollapsibleEventHandlers();
                myBlock.loadComplete = true;

                if (myBlock.postProcess !== null) {
                    myBlock.postProcess(myBlock.postProcessArg);
                    myBlock.postProcess = null;
                }
            };

            this._generateCollapseArtwork(postProcess);
        }
    };

    this._generateCollapseArtwork = function(postProcess) {
        var myBlock = this;
        var thisBlock = this.blocks.blockList.indexOf(this);

        function __processHighlightCollapseBitmap(name, bitmap, myBlock) {
            myBlock.highlightCollapseBlockBitmap = bitmap;
            myBlock.highlightCollapseBlockBitmap.name = 'highlight_collapse_' + thisBlock;
            myBlock.container.addChild(myBlock.highlightCollapseBlockBitmap);
            myBlock.highlightCollapseBlockBitmap.visible = false;

            if (myBlock.collapseText === null) {
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
            myBlock._positionCollapseLabel(myBlock.protoblock.scale);
            myBlock.collapseText.visible = myBlock.collapsed;

            myBlock._ensureDecorationOnTop();

            myBlock.updateCache();

            myBlock.collapseContainer = new createjs.Container();
            myBlock.collapseContainer.snapToPixelEnabled = true;

            var image = new Image();
            image.onload = function() {
                myBlock.collapseBitmap = new createjs.Bitmap(image);
                myBlock.collapseBitmap.scaleX = myBlock.collapseBitmap.scaleY = myBlock.collapseBitmap.scale = myBlock.protoblock.scale / 2;
                myBlock.collapseContainer.addChild(myBlock.collapseBitmap);
                myBlock.collapseBitmap.visible = !myBlock.collapsed;
                finishCollapseButton(myBlock);
            };

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
                    if (postProcess !== null) {
                        postProcess(myBlock);
                    }

                    myBlock.blocks.refreshCanvas();
                    myBlock.blocks.cleanupAfterLoad(myBlock.name);
                };

                image.src = 'images/expand.svg';
            }
        };

        function __processCollapseBitmap(name, bitmap, myBlock) {
            myBlock.collapseBlockBitmap = bitmap;
            myBlock.collapseBlockBitmap.name = 'collapse_' + thisBlock;
            myBlock.container.addChild(myBlock.collapseBlockBitmap);
            myBlock.collapseBlockBitmap.visible = myBlock.collapsed;
            myBlock.blocks.refreshCanvas();

            var artwork = myBlock.collapseArtwork;
            _makeBitmap(artwork.replace(/fill_color/g, PALETTEHIGHLIGHTCOLORS[myBlock.protoblock.palette.name]).replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[myBlock.protoblock.palette.name]).replace('block_label', ''), '', __processHighlightCollapseBitmap, myBlock);
        };

        var artwork = this.collapseArtwork;
        _makeBitmap(artwork.replace(/fill_color/g, PALETTEFILLCOLORS[this.protoblock.palette.name]).replace(/stroke_color/g, PALETTESTROKECOLORS[this.protoblock.palette.name]).replace('block_label', ''), '', __processCollapseBitmap, this);
    };

    this.hide = function() {
        this.container.visible = false;
        if (this.collapseContainer !== null) {
            this.collapseContainer.visible = false;
            this.collapseText.visible = false;
        }
    };

    this.show = function() {
        if (!this.trash) {
            // If it is an action block or it is not collapsed then show it.
            if (!(COLLAPSABLES.indexOf(this.name) === -1 && this.collapsed)) {
                this.container.visible = true;
                if (this.collapseContainer !== null) {
                    this.collapseContainer.visible = true;
                    this.collapseText.visible = true;
                }
            }
        }
    };

    // Utility functions
    this.isValueBlock = function() {
        return this.protoblock.style === 'value';
    };

    this.isNoHitBlock = function() {
        return NOHIT.indexOf(this.name) !== -1;
    };

    this.isArgBlock = function() {
        return this.protoblock.style === 'value' || this.protoblock.style === 'arg';
    };

    this.isTwoArgBlock = function() {
        return this.protoblock.style === 'twoarg';
    };

    this.isTwoArgBooleanBlock = function() {
        return ['equal', 'greater', 'less'].indexOf(this.name) !== -1;
    };

    this.isClampBlock = function() {
        return this.protoblock.style === 'clamp' || this.isDoubleClampBlock();
    };

    this.isDoubleClampBlock = function() {
        return this.protoblock.style === 'doubleclamp';
    };

    this.isNoRunBlock = function() {
        return this.name === 'action';
    };

    this.isArgClamp = function() {
        return this.protoblock.style === 'argclamp' || this.protoblock.style === 'argclamparg';
    };

    this.isExpandableBlock = function() {
        return this.protoblock.expandable;
    };

    // Based on the block index into the blockList.
    this.getBlockId = function() {
        var number = blockBlocks.blockList.indexOf(this);
        return '_' + number.toString();
    };

    this.removeChildBitmap = function(name) {
        for (var child = 0; child < this.container.getNumChildren(); child++) {
            if (this.container.children[child].name === name) {
                this.container.removeChild(this.container.children[child]);
                break;
            }
        }
    };

    this.loadThumbnail = function (imagePath) {
        // Load an image thumbnail onto block.
        var thisBlock = this.blocks.blockList.indexOf(this);
        var myBlock = this;
        if (this.blocks.blockList[thisBlock].value === null && imagePath === null) {
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
            myBlock._positionMedia(bitmap, bitmap.image.width, bitmap.image.height, myBlock.protoblock.scale);
            myBlock.container.addChild(bitmap);
            myBlock.updateCache();
        };

        if (imagePath === null) {
            image.src = this.value;
        } else {
            image.src = imagePath;
        }
    };

    this._doOpenMedia = function (myBlock, thisBlock) {
        var fileChooser = docById('myOpenAll');

        readerAction = function (event) {
            window.scroll(0, 0);

            var reader = new FileReader();
            reader.onloadend = (function() {
                if (reader.result) {
                    if (myBlock.name === 'media') {
                        myBlock.value = reader.result;
                        myBlock.loadThumbnail(null);
                        return;
                    }
                    myBlock.value = [fileChooser.files[0].name, reader.result];
                    myBlock.blocks.updateBlockText(thisBlock);
                }
            });
            if (myBlock.name === 'media') {
                reader.readAsDataURL(fileChooser.files[0]);
            }
            else {
                reader.readAsText(fileChooser.files[0]);
            }
            fileChooser.removeEventListener('change', readerAction);
        };

        fileChooser.addEventListener('change', readerAction, false);
        fileChooser.focus();
        fileChooser.click();
        window.scroll(0, 0)
    };

    this.collapseToggle = function () {
        // Find the blocks to collapse/expand
        var myBlock = this;
        var thisBlock = this.blocks.blockList.indexOf(this);
        this.blocks.findDragGroup(thisBlock);

        function __toggle() {
            var collapse = myBlock.collapsed;
            if (myBlock.collapseBitmap === null) {
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
                myBlock.updateCache();
            }
            myBlock.highlightBitmap.visible = false;

            if (myBlock.name === 'action') {
                // Label the collapsed block with the action label
                if (myBlock.connections[1] !== null) {
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

            // Set collapsed state of blocks in drag group.
            if (myBlock.blocks.dragGroup.length > 0) {
                for (var b = 1; b < myBlock.blocks.dragGroup.length; b++) {
                    var blk = myBlock.blocks.dragGroup[b];
                    myBlock.blocks.blockList[blk].collapsed = !collapse;
                    myBlock.blocks.blockList[blk].container.visible = collapse;
                }
            }

            myBlock.collapseContainer.updateCache();
            myBlock.updateCache();
        }

        __toggle();
    };

    this._positionText = function(blockScale) {
        this.text.textBaseline = 'alphabetic';
        this.text.textAlign = 'right';
        var fontSize = 10 * blockScale;
        this.text.font = fontSize + 'px Sans';
        this.text.x = TEXTX * blockScale / 2.;
        this.text.y = TEXTY * blockScale / 2.;

        // Some special cases
        if (['text', 'number', 'solfege', 'notename'].indexOf(this.name) !== -1) {
            this.text.textAlign = 'center';
            this.text.x = VALUETEXTX * blockScale / 2.;
        } else if (this.protoblock.args === 0) {
            var bounds = this.container.getBounds();
            this.text.x = bounds.width - 25;
        } else {
            this.text.textAlign = 'left';
            if (this.docks[0][2] === 'booleanout') {
                this.text.y = this.docks[0][1];
            }
        }

        // Ensure text is on top.
        z = this.container.getNumChildren() - 1;
        this.container.setChildIndex(this.text, z);
        this.updateCache();
    };

    this._positionMedia = function(bitmap, width, height, blockScale) {
        if (width > height) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = MEDIASAFEAREA[2] / width * blockScale / 2;
        } else {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = MEDIASAFEAREA[3] / height * blockScale / 2;
        }
        bitmap.x = (MEDIASAFEAREA[0] - 10) * blockScale / 2;
        bitmap.y = MEDIASAFEAREA[1] * blockScale / 2;
    };

    this._calculateCollapseHitArea = function() {
        var bounds = this.collapseContainer.getBounds();
        var hitArea = new createjs.Shape();
        var w2 = bounds.width;
        var h2 = bounds.height;

        hitArea.graphics.beginFill('#FFF').drawEllipse(-w2 / 2, -h2 / 2, w2, h2);
        hitArea.x = w2 / 2;
        hitArea.y = h2 / 2;
        this.collapseContainer.hitArea = hitArea;
    };

    this._positionCollapseLabel = function(blockScale) {
        this.collapseText.x = COLLAPSETEXTX * blockScale / 2;
        this.collapseText.y = COLLAPSETEXTY * blockScale / 2;

        // Ensure text is on top.
        z = this.container.getNumChildren() - 1;
        this.container.setChildIndex(this.collapseText, z);
    };

    this._positionCollapseContainer = function(blockScale) {
        this.collapseContainer.x = this.container.x + (COLLAPSEBUTTONXOFF * blockScale / 2);
        this.collapseContainer.y = this.container.y + (COLLAPSEBUTTONYOFF * blockScale / 2);
    };

    // These are the event handlers for collapsible blocks.
    this._loadCollapsibleEventHandlers = function() {
        var myBlock = this;
        var thisBlock = this.blocks.blockList.indexOf(this);
        this._calculateCollapseHitArea();

        this.collapseContainer.on('mouseover', function(event) {
            myBlock.blocks.highlight(thisBlock, true);
            myBlock.blocks.activeBlock = thisBlock;
            myBlock.blocks.refreshCanvas();
        });

        var moved = false;
        var locked = false;
        var mousedown = false;
        var offset = {x:0, y:0};
        var scale = blocks.getStageScale();

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

        this.collapseContainer.on('click', function(event) {
            handleClick();
        });

        this.collapseContainer.on('mousedown', function(event) {
            hideDOMLabel();
            // Always show the trash when there is a block selected.
            trashcan.show();
            moved = false;
            mousedown = true;
            var d = new Date();
            blocks.mouseDownTime = d.getTime();
            offset = {
                x: myBlock.collapseContainer.x - Math.round(event.stageX / scale),
                y: myBlock.collapseContainer.y - Math.round(event.stageY / scale)
            };
        });

        this.collapseContainer.on('pressup', function(event) {
            if (!mousedown) {
                // console.log('pressup w/o mouse down?');
                return;
            }
            mousedown = false;
            if (moved) {
                myBlock._collapseOut(blocks, thisBlock, moved, event);
                moved = false;
            } else {
                var d = new Date();
                if ((d.getTime() - blocks.mouseDownTime) > 1000) {
                    var d = new Date();
                    blocks.mouseDownTime = d.getTime();
                    handleClick();
                }
            }
        });

        this.collapseContainer.on('mouseout', function(event) {
            if (!mousedown) {
                // console.log('mouseout w/o mouse down?');
                return;
            }
            mousedown = false;
            if (moved) {
                myBlock._collapseOut(blocks, thisBlock, moved, event);
                moved = false;
            } else {
                // Maybe restrict to Android?
                var d = new Date();
                // var diff = (d.getTime() - blocks.mouseDownTime);
                // console.log(diff);
                if ((d.getTime() - blocks.mouseDownTime) < 200) {
                    var d = new Date();
                    blocks.mouseDownTime = d.getTime();
                    handleClick();
                }
            }
        });

        this.collapseContainer.on('pressmove', function(event) {
            if (!mousedown) {
                // console.log('pressmove w/o mouse down?');
                return;
            }
            moved = true;
            var oldX = myBlock.collapseContainer.x;
            var oldY = myBlock.collapseContainer.y;
            myBlock.collapseContainer.x = Math.round(event.stageX / scale) + offset.x;
            myBlock.collapseContainer.y = Math.round(event.stageY / scale) + offset.y;
            var dx = myBlock.collapseContainer.x - oldX;
            var dy = myBlock.collapseContainer.y - oldY;
            myBlock.container.x += dx;
            myBlock.container.y += dy;

            // If we are over the trash, warn the user.
            if (trashcan.overTrashcan(event.stageX / scale, event.stageY / scale)) {
                trashcan.highlight();
            } else {
                trashcan.unhighlight();
            }

            myBlock.blocks.findDragGroup(thisBlock)
            if (myBlock.blocks.dragGroup.length > 0) {
                for (var b = 0; b < myBlock.blocks.dragGroup.length; b++) {
                    var blk = myBlock.blocks.dragGroup[b];
                    if (b !== 0) {
                        myBlock.blocks.moveBlockRelative(blk, dx, dy);
                    }
                }
            }

            myBlock.blocks.refreshCanvas();
        });
    };

    this._collapseOut = function(blocks, thisBlock, moved, event) {
        // Always hide the trash when there is no block selected.
        var scale = blocks.getStageScale();

        trashcan.hide();
        blocks.unhighlight(thisBlock);
        if (moved) {
            // Check if block is in the trash.
            if (trashcan.overTrashcan(event.stageX / scale, event.stageY / scale)) {
                blocks.sendStackToTrash(this);
            } else {
                // Otherwise, process move.
                blocks.blockMoved(thisBlock);
            }
        }

        if (blocks.activeBlock !== myBlock) {
            return;
        }

        blocks.unhighlight(null);
        blocks.activeBlock = null;
        blocks.refreshCanvas();
    };

    this._calculateBlockHitArea = function() {
        var hitArea = new createjs.Shape();
        var bounds = this.container.getBounds()

        if (bounds == null) {
            this._createCache();
            bounds = this.bounds;
        }

        // Only detect hits on top section of block.
        if (this.isClampBlock() || this.isArgClamp()) {
            hitArea.graphics.beginFill('#FFF').drawRect(0, 0, bounds.width, STANDARDBLOCKHEIGHT);
        } else if (this.isNoHitBlock()) {
            // No hit area
            hitArea.graphics.beginFill('#FFF').drawRect(0, 0, 0, 0);
        } else {
            // Shrinking the height makes it easier to grab blocks below
            // in the stack.
            hitArea.graphics.beginFill('#FFF').drawRect(0, 0, bounds.width, bounds.height * 0.75);
        }
        this.container.hitArea = hitArea;
    };

    // These are the event handlers for block containers.
    this._loadEventHandlers = function() {
        var myBlock = this;
        var thisBlock = this.blocks.blockList.indexOf(this);
        var blocks = this.blocks;
        var scale = blocks.getStageScale();

        this._calculateBlockHitArea();

        this.container.on('mouseover', function(event) {
            blocks.highlight(thisBlock, true);
            blocks.activeBlock = thisBlock;
            blocks.refreshCanvas();
        });

        var haveClick = false;
        var moved = false;
        var locked = false;
        var getInput = window.hasMouse;

        this.container.on('click', function(event) {
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
                } else if (myBlock.name === 'media') {
                    myBlock._doOpenMedia(thisBlock);
                } else if (myBlock.name === 'loadFile') {
                    myBlock._doOpenMedia(thisBlock);
                } else if (['text', 'number', 'solfege', 'notename'].indexOf(myBlock.name) !== -1) {
                    if(!myBlock.trash)
                    {
                        myBlock._changeLabel();
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

        this.container.on('mousedown', function(event) {
            // console.log('MOUSEDOWN');
            // hideDOMLabel();

            // Track time for detecting long pause...
            // but only for top block in stack
            if (myBlock.connections[0] == null) {
                var d = new Date();
                blocks.mouseDownTime = d.getTime();
                blocks.longPressTimeout = setTimeout(function() {
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
                x: myBlock.container.x - Math.round(event.stageX / scale),
                y: myBlock.container.y - Math.round(event.stageY / scale)
            };

            myBlock.container.on('mouseout', function(event) {
                if (haveClick) {
                    return;
                }

                // console.log('MOUSEOUT');
                if (!blocks.inLongPress) {
                    myBlock._mouseoutCallback(event, moved, haveClick, true);
                }
                moved = false;
            });

            myBlock.container.on('pressup', function(event) {
                if (haveClick) {
                    return;
                }

                // console.log('PRESSUP');
                if (!blocks.inLongPress) {
                    myBlock._mouseoutCallback(event, moved, haveClick, true);
                }
                moved = false;
            });

            var original = {x: event.stageX / scale, y: event.stageY / scale};
            myBlock.container.on('pressmove', function(event) {
                // console.log('PRESSMOVE');
                // FIXME: More voodoo
                event.nativeEvent.preventDefault();

                // FIXME: need to remove timer
                if (blocks.longPressTimeout != null) {
                    clearTimeout(blocks.longPressTimeout);
                    blocks.longPressTimeout = null;
                }
                if (!moved && myBlock.label != null) {
                    myBlock.label.style.display = 'none';
                }

                if (window.hasMouse) {
                    moved = true;
                } else {
                    // Make it eaiser to select text on mobile
                    setTimeout(function () {
                        moved = Math.abs((event.stageX / scale) - original.x) + Math.abs((event.stageY / scale) - original.y) > 20 && !window.hasMouse;
                        getInput = !moved;
                    }, 200);
                }

                var oldX = myBlock.container.x;
                var oldY = myBlock.container.y;

                var dx = Math.round(Math.round(event.stageX / scale) + offset.x - oldX);
                var dy = Math.round(Math.round(event.stageY / scale) + offset.y - oldY);

                // Move this block...
                blocks.moveBlockRelative(thisBlock, dx, dy);

                // If we are over the trash, warn the user.
                if (trashcan.overTrashcan(event.stageX / scale, event.stageY / scale)) {
                    trashcan.highlight();
                } else {
                    trashcan.unhighlight();
                }

                if (myBlock.isValueBlock() && myBlock.name !== 'media') {
                    // Ensure text is on top
                    var z = myBlock.container.getNumChildren() - 1;
                    myBlock.container.setChildIndex(myBlock.text, z);
                } else if (myBlock.collapseContainer != null) {
                    myBlock._positionCollapseContainer(myBlock.protoblock.scale);
                }

                // ...and move any connected blocks.
                blocks.findDragGroup(thisBlock)
                if (blocks.dragGroup.length > 0) {
                    for (var b = 0; b < blocks.dragGroup.length; b++) {
                        var blk = blocks.dragGroup[b];
                        if (b !== 0) {
                            blocks.moveBlockRelative(blk, dx, dy);
                        }
                    }
                }

                blocks.refreshCanvas();
            });
        });

        this.container.on('mouseout', function(event) {
            if (!blocks.inLongPress) {
                // console.log('MOUSEOUT (OUT)');
                myBlock._mouseoutCallback(event, moved, haveClick, true);
            }
            moved = false;
        });

        this.container.on('pressup', function(event) {
            if (!blocks.inLongPress) {
                // console.log('PRESSUP (OUT)');
                myBlock._mouseoutCallback(event, moved, haveClick, false);
            }
            moved = false;
        });
    };

    this._mouseoutCallback = function(event, moved, haveClick, hideDOM) {
        var thisBlock = this.blocks.blockList.indexOf(this);
        var scale = blocks.getStageScale();

        // Always hide the trash when there is no block selected.
        // FIXME: need to remove timer
        if (this.blocks.longPressTimeout != null) {
            clearTimeout(this.blocks.longPressTimeout);
            this.blocks.longPressTimeout = null;
        }
        trashcan.hide();

        if (moved) {
            // Check if block is in the trash.
            if (trashcan.overTrashcan(event.stageX / scale, event.stageY / scale)) {
                blocks.sendStackToTrash(this);
            } else {
                // Otherwise, process move.
                // Keep track of time of last move
                var d = new Date();
                blocks.mouseDownTime = d.getTime();
                this.blocks.blockMoved(thisBlock);

                // Just incase the blocks are not properly docked after
                // the move (workaround for issue #38 -- Blocks fly
                // apart). Still need to get to the root cause.
                this.blocks.adjustDocks(this.blocks.blockList.indexOf(this), true);
            }
        } else if (['text', 'solfege', 'notename', 'number', 'media', 'loadFile'].indexOf(this.name) !== -1) {
            if (!haveClick) {
                // Simulate click on Android.
                var d = new Date();
                if ((d.getTime() - blocks.mouseDownTime) < 500) {
                    if(!this.trash)
                    {
                        var d = new Date();
                        blocks.mouseDownTime = d.getTime();
                        if (this.name === 'media' || this.name === 'loadFile') {
                            this._doOpenMedia(thisBlock);
                        } else {
                            this._changeLabel();
                        }
                    }
                }
            }
        }

        if (hideDOM) {
            if (this.blocks.activeBlock !== thisBlock) {
                hideDOMLabel();
            } else {
                this.blocks.unhighlight(null);
                this.blocks.refreshCanvas();
            }
            this.blocks.activeBlock = null;
        }
    };

    this._ensureDecorationOnTop = function() {
        // Find the turtle decoration and move it to the top.
        for (var child = 0; child < this.container.getNumChildren(); child++) {
            if (this.container.children[child].name === 'decoration') {
                // Drum block in collapsed state is less wide.
                if (this.name === 'drum') {
                    var bounds = this.container.getBounds();
                    if (this.collapsed) {
                        var dx = 25 * this.protoblock.scale / 2;
                    } else {
                        var dx = 0;
                    }
                    for (var turtle = 0; turtle < this.blocks.turtles.turtleList.length; turtle++) {
                        if (this.blocks.turtles.turtleList[turtle].startBlock === this) {
                            this.blocks.turtles.turtleList[turtle].decorationBitmap.x = bounds.width - dx - 50 * this.protoblock.scale / 2;
                            break;
                        }
                    }
                }

                this.container.setChildIndex(this.container.children[child], this.container.getNumChildren() - 1);
                break;
            }
        }
    };

    this._changeLabel = function() {
        var myBlock = this;
        var blocks = this.blocks;
        var x = this.container.x;
        var y = this.container.y;
        var scale = blocks.getStageScale();

        var canvasLeft = blocks.canvas.offsetLeft + 28 * scale;
        var canvasTop = blocks.canvas.offsetTop + 6 * scale;

        var movedStage = false;
        if (!window.hasMouse && blocks.stage.y + y > 75) {
            movedStage = true;
            var fromY = blocks.stage.y;
            blocks.stage.y = -y + 75;
        }

        // A place in the DOM to put modifiable labels (textareas).
        var labelValue = (this.label)?this.label.value:this.value;
        var labelElem = docById('labelDiv');

        if (this.name === 'text') {
            var type = 'text';
            labelElem.innerHTML = '<input id="textLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="text" type="text" value="' + labelValue + '" />';
            labelElem.classList.add('hasKeyboard');
            this.label = docById('textLabel');
        } else if (this.name === 'solfege') {
            var type = 'solfege';
            const SOLFNOTES = ['ti', 'la', 'sol', 'fa', 'mi', 're', 'do'];
            const SOLFATTRS = ['♯♯', '♯', '♮', '♭', '♭♭'];
            if (this.value != null) {
                if (SOLFNOTES.indexOf(this.value) !== -1) {
                    var selectednote = this.value;
                    var selectedattr = '♮';
                } else if (this.value.slice(0, 3) === 'sol') {
                    var selectednote = 'sol';
                    if (this.value.length === 4) {
                        var selectedattr = this.value[3];
                    } else {
                        var selectedattr = this.value[3] + this.value[3];
                    }
                } else {
                    var selectednote = this.value.slice(0, 2);
                    if (this.value.length === 3) {
                        var selectedattr = this.value[2];
                    } else {
                        var selectedattr = this.value[2] + this.value[2];
                    }
                }
            } else {
                var selectednote = 'sol';
                var selectedattr = '♮'
            }

            var labelHTML = '<select name="solfege" id="solfegeLabel" style="position: absolute;  background-color: #88e20a; width: 100px;">'
            for (var i = 0; i < SOLFNOTES.length; i++) {
                if (selectednote === SOLFNOTES[i]) {
                    labelHTML += '<option value="' + selectednote + '" selected>' + selectednote + '</option>';
                } else {
                    labelHTML += '<option value="' + SOLFNOTES[i] + '">' + SOLFNOTES[i] + '</option>';
                }
            }

            labelHTML += '</select>';
            labelHTML += '<select name="noteattr" id="noteattrLabel" style="position: absolute;  background-color: #88e20a; width: 60px;">';
            for (var i = 0; i < SOLFATTRS.length; i++) {
                if (selectedattr === SOLFATTRS[i]) {
                    labelHTML += '<option value="' + selectedattr + '" selected>' + selectedattr + '</option>';
                } else {
                    labelHTML += '<option value="' + SOLFATTRS[i] + '">' + SOLFATTRS[i] + '</option>';
                }
            }

            labelHTML += '</select>';
            labelElem.innerHTML = labelHTML;
            this.label = docById('solfegeLabel');
            this.labelattr = docById('noteattrLabel');
        } else if (this.name === 'notename') {
            var type = 'notename';
            const NOTENOTES = ['B', 'A', 'G', 'F', 'E', 'D', 'C'];
            const NOTEATTRS = ['♯♯', '♯', '♮', '♭', '♭♭'];
            if (this.value != null) {
                var selectednote = this.value[0];
                if (this.value.length === 1) {
                    var selectedattr = '♮';
                } else if (this.value.length === 2) {
                    var selectedattr = this.value[1];
                } else {
                    var selectedattr = this.value[1] + this.value[1];
                }
            } else {
                var selectednote = 'G';
                var selectedattr = '♮'
            }

            var labelHTML = '<select name="notename" id="notenameLabel" style="position: absolute;  background-color: #88e20a; width: 60px;">'
            for (var i = 0; i < NOTENOTES.length; i++) {
                if (selectednote === NOTENOTES[i]) {
                    labelHTML += '<option value="' + selectednote + '" selected>' + selectednote + '</option>';
                } else {
                    labelHTML += '<option value="' + NOTENOTES[i] + '">' + NOTENOTES[i] + '</option>';
                }
            }

            labelHTML += '</select>';
            labelHTML += '<select name="noteattr" id="noteattrLabel" style="position: absolute;  background-color: #88e20a; width: 60px;">';

            for (var i = 0; i < NOTEATTRS.length; i++) {
                if (selectedattr === NOTEATTRS[i]) {
                    labelHTML += '<option value="' + selectedattr + '" selected>' + selectedattr + '</option>';
                } else {
                    labelHTML += '<option value="' + NOTEATTRS[i] + '">' + NOTEATTRS[i] + '</option>';
                }
            }

            labelHTML += '</select>';
            labelElem.innerHTML = labelHTML;
            this.label = docById('notenameLabel');
            this.labelattr = docById('noteattrLabel');
        } else {
            var type = 'number';
            labelElem.innerHTML = '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' + labelValue + '" />';
            labelElem.classList.add('hasKeyboard');
            this.label = docById('numberLabel');
        }

        var focused = false;
        var __blur = function (event) {
            // Not sure why the change in the input is not available
            // immediately in FireFox. We need a workaround if hardware
            // acceleration is enabled.

            if (!focused) {
                return;
            }
            myBlock._labelChanged();

            event.preventDefault();

            labelElem.classList.remove('hasKeyboard');

            window.scroll(0, 0);
            myBlock.label.removeEventListener('keypress', __keypress);

            if (movedStage) {
                blocks.stage.y = fromY;
                blocks.updateStage();
            }
        };

        if (this.name === 'text' || this.name === 'number') {
            this.label.addEventListener('blur', __blur);
        }

        var __keypress = function (event) {
            if ([13, 10, 9].indexOf(event.keyCode) !== -1) {
                __blur(event);
            }
        };

        this.label.addEventListener('keypress', __keypress);

        this.label.addEventListener('change', function() {
            myBlock._labelChanged();
        });

        if (this.labelattr != null) {
            this.labelattr.addEventListener('change', function() {
                myBlock._labelChanged();
            });
        }

        this.label.style.left = Math.round((x + blocks.stage.x) * scale + canvasLeft) + 'px';
        this.label.style.top = Math.round((y + blocks.stage.y) * scale + canvasTop) + 'px';

        // There may be a second select used for # and b.
        if (this.labelattr != null) {
            this.label.style.width = Math.round(60 * scale) * this.protoblock.scale / 2 + 'px';
            this.labelattr.style.left = Math.round((x + blocks.stage.x + 60) * scale + canvasLeft) + 'px';
            this.labelattr.style.top = Math.round((y + blocks.stage.y) * scale + canvasTop) + 'px';
            this.labelattr.style.width = Math.round(60 * scale) * this.protoblock.scale / 2 + 'px';
            this.labelattr.style.fontSize = Math.round(20 * scale * this.protoblock.scale / 2) + 'px';
        } else {
            this.label.style.width = Math.round(100 * scale) * this.protoblock.scale / 2 + 'px';
        }

        this.label.style.fontSize = Math.round(20 * scale * this.protoblock.scale / 2) + 'px';
        this.label.style.display = '';
        this.label.focus();

        // Firefox fix
        setTimeout(function () {
            myBlock.label.style.display = '';
            myBlock.label.focus();
            focused = true;
        }, 100);
    };

    this._labelChanged = function() {
        // Update the block values as they change in the DOM label.
        if (this == null) {
            return;
        }

        this.label.style.display = 'none';
        if (this.labelattr != null) {
            this.labelattr.style.display = 'none';
        }

        var oldValue = this.value;
        var newValue = this.label.value;

        if (this.labelattr != null) {
            var attrValue = this.labelattr.value;
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
        if (oldValue === newValue) {
            // Nothing to do in this case.
            return;
        }

        // Update the block value and block text.
        if (this.name === 'number') {
            this.value = Number(newValue);
            if (isNaN(this.value)) {
                var thisBlock = this.blocks.blockList.indexOf(this);
                this.blocks.errorMsg(newValue + ': Not a number', thisBlock);
                this.blocks.refreshCanvas();
                this.value = oldValue;
            }
        } else {
            this.value = newValue;
        }

        var label = this.value.toString();
        if (label.length > 8) {
            label = label.substr(0, 7) + '...';
        }
        this.text.text = label;

        // and hide the DOM textview...
        this.label.style.display = 'none';

        // Make sure text is on top.
        var z = this.container.getNumChildren() - 1;
        this.container.setChildIndex(this.text, z);
        this.updateCache();

        var c = this.connections[0];
        if (this.name === 'text' && c != null) {
            var cblock = this.blocks.blockList[c];
            switch (cblock.name) {
            case 'action':
                // If the label was the name of an action, update the
                // associated run this.blocks and the palette buttons
                // Rename both do <- name and nameddo blocks.
                this.blocks.renameDos(oldValue, newValue);
                if (oldValue === _('action')) {
                    this.blocks.newNameddoBlock(newValue, this.blocks.actionHasReturn(c), this.blocks.actionHasArgs(c));
		    this.blocks.setActionProtoVisiblity(false);
                }
                this.blocks.renameNameddos(oldValue, newValue);
                this.blocks.palettes.updatePalettes('actions');
                break;
            case 'storein':
                // If the label was the name of a storein, update the
                //associated box this.blocks and the palette buttons
                if (this.value !== 'box') {
                    this.blocks.newStoreinBlock(this.value);
                    this.blocks.newNamedboxBlock(this.value);
                }
                // Rename both box <- name and namedbox blocks.
                this.blocks.renameBoxes(oldValue, newValue);
                this.blocks.renameNamedboxes(oldValue, newValue);
                this.blocks.palettes.updatePalettes('boxes');
                break;
            default:
                break;
            }
        }
    };

};


function $() {
    var elements = new Array();

    for (var i = 0; i < arguments.length; i++) {
        var element = arguments[i];
        if (typeof element === 'string')
            element = docById(element);
        if (arguments.length === 1)
            return element;
        elements.push(element);
    }
    return elements;
}


window.hasMouse = false;
// Mousemove is not emulated for touch
document.addEventListener('mousemove', function (e) {
    window.hasMouse = true;
});


function _makeBitmap(data, name, callback, args) {
    // Async creation of bitmap from SVG data
    // Works with Chrome, Safari, Firefox (untested on IE)
    var img = new Image();
    img.onload = function() {
        var bitmap = new createjs.Bitmap(img);
        callback(name, bitmap, args);
    };

    img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(data)));
}
