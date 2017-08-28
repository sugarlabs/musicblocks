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
//

// Length of a long touch
const LONGPRESSTIME = 1500;
const COLLAPSABLES = ['drum', 'start', 'action', 'matrix', 'pitchdrummatrix', 'rhythmruler', 'timbre', 'status', 'pitchstaircase', 'tempo', 'pitchslider', 'modewidget'];
const NOHIT = ['hidden', 'hiddennoflow'];
const SPECIALINPUTS = ['text', 'number', 'solfege', 'eastindiansolfege', 'notename', 'voicename', 'modename', 'drumname', 'filtertype', 'oscillatortype'];

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
    this.collapsed = false;  // Is this block in a collapsed stack?
    this.trash = false;  // Is this block in the trash?
    this.loadComplete = false;  // Has the block finished loading?
    this.label = null;  // Editable textview in DOM.
    this.text = null;  // A dynamically generated text label on block itself.
    this.value = null;  // Value for number, text, and media blocks.
    this.privateData = null;  // A block may have some private data,
                              // e.g., nameboxes use this field to store
                              // the box name associated with the block.
    this.image = protoblock.image;  // The file path of the image.
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

    this.size = 1;  // Proto size is copied here.
    this.docks = [];  // Proto dock is copied here.
    this.connections = [];

    // Keep track of clamp count for blocks with clamps.
    this.clampCount = [1, 1];
    this.argClampSlots = [1];

    // Some blocks have some post process after they are first loaded.
    this.postProcess = null;
    this.postProcessArg = this;

    // Lock on label change
    this._label_lock = false;

    // Internal function for creating cache.
    // Includes workaround for a race condition.
    this._createCache = function () {
        var that = this;
        this.bounds = this.container.getBounds();

        if (this.bounds == null) {
            setTimeout(function () {
                that._createCache();
            }, 200);
        } else {
            this.container.cache(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
        }
    };

    // Internal function for creating cache.
    // Includes workaround for a race condition.
    this.updateCache = function () {
        var that = this;

        if (this.bounds == null) {
            setTimeout(function () {
                that.updateCache();
            }, 300);
        } else {
            this.container.updateCache();
            this.blocks.refreshCanvas();
        }
    };

    this.offScreen = function (boundary) {
        return !this.trash && boundary.offScreen(this.container.x, this.container.y);
    };

    this.copySize = function () {
        this.size = this.protoblock.size;
    };

    this.getInfo = function () {
        return this.name + ' block';
    };

    this.highlight = function () {
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

    this.unhighlight = function () {
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

    this.updateArgSlots = function (slotList) {
        // Resize and update number of slots in argClamp
        this.argClampSlots = slotList;
        this._newArtwork();
        this.regenerateArtwork(false);
    };

    this.updateSlots = function (clamp, plusMinus) {
        // Resize an expandable block.
        this.clampCount[clamp] += plusMinus;
        this._newArtwork(plusMinus);
        this.regenerateArtwork(false);
    };

    this.resize = function (scale) {
        // If the block scale changes, we need to regenerate the
        // artwork and recalculate the hitarea.
        var that = this;

        this.postProcess = function (that) {
            if (that.imageBitmap !== null) {
                that._positionMedia(that.imageBitmap, that.imageBitmap.image.width, that.imageBitmap.image.height, scale);
                z = that.container.getNumChildren() - 1;
                that.container.setChildIndex(that.imageBitmap, z);
            }

            if (that.name === 'start' || that.name === 'drum') {
                // Rescale the decoration on the start blocks.
                for (var turtle = 0; turtle < that.blocks.turtles.turtleList.length; turtle++) {
                    if (that.blocks.turtles.turtleList[turtle].startBlock === that) {
                        that.blocks.turtles.turtleList[turtle].resizeDecoration(scale, that.bitmap.image.width);
                        that._ensureDecorationOnTop();
                        break;
                    }
                }
            }
            that.updateCache();
            that._calculateBlockHitArea();

            // If it is in the trash, make sure it remains hidden.
            if (that.trash) {
                that.hide();
            }
        };

        this.postProcessArg = this;

        this.protoblock.scale = scale;
        this._newArtwork(0);
        this.regenerateArtwork(true, []);

        if (this.text !== null) {
            this._positionText(scale);
        }

        if (this.collapseContainer !== null) {
            this.collapseContainer.uncache();
            var _postProcess = function (that) {
                that.collapseBitmap.scaleX = that.collapseBitmap.scaleY = that.collapseBitmap.scale = scale / 2;
                that.expandBitmap.scaleX = that.expandBitmap.scaleY = that.expandBitmap.scale = scale / 2;

                that._positionCollapseContainer(that.protoblock.scale);
                var bounds = that.collapseContainer.getBounds();
                that.collapseContainer.cache(bounds.x, bounds.y, bounds.width, bounds.height);

                // that._positionCollapseContainer(that.protoblock.scale);
                that._calculateCollapseHitArea();
            };

            this._generateCollapseArtwork(_postProcess);
            var fontSize = 10 * scale;
            this.collapseText.font = fontSize + 'px Sans';
            this._positionCollapseLabel(scale);
        }
    };

    this._newArtwork = function (plusMinus) {
        if (COLLAPSABLES.indexOf(this.name) > -1) {
            var proto = new ProtoBlock('collapse');
            proto.scale = this.protoblock.scale;
            proto.extraWidth = 10;
            proto.basicBlockCollapsed();
            var obj = proto.generator();
            this.collapseArtwork = obj[0];
            var obj = this.protoblock.generator(this.clampCount[0]);
        } else if (this.name === 'ifthenelse') {
            var obj = this.protoblock.generator(this.clampCount[0], this.clampCount[1]);
        } else if (this.protoblock.style === 'clamp') {
            var obj = this.protoblock.generator(this.clampCount[0]);
        } else if (this.protoblock.style === 'argflowclamp') {
            var obj = this.protoblock.generator(this.clampCount[0]);
        } else {
            switch (this.name) {
            case 'equal':
            case 'greater':
            case 'less':
                var obj = this.protoblock.generator(this.clampCount[0]);
                break;
            case 'calcArg':
            case 'doArg':
            case 'namedcalcArg':
            case 'nameddoArg':
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

    this.imageLoad = function () {
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

    this._addImage = function () {
        var image = new Image();
        var that = this;

        image.onload = function () {
            var bitmap = new createjs.Bitmap(image);
            bitmap.name = 'media';
            that.container.addChild(bitmap);
            that._positionMedia(bitmap, image.width, image.height, that.protoblock.scale);
            that.imageBitmap = bitmap;
            that.updateCache();
        };
        image.src = this.image;
    };

    this.regenerateArtwork = function (collapse) {
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

    this.generateArtwork = function (firstTime) {
        // Get the block labels from the protoblock.
        var that = this;
        var thisBlock = this.blocks.blockList.indexOf(this);
        var block_label = '';

        // Create the highlight bitmap for the block.
        function __processHighlightBitmap(name, bitmap, that) {
            if (that.highlightBitmap != null) {
                that.container.removeChild(that.highlightBitmap);
            }

            that.highlightBitmap = bitmap;
            that.container.addChild(that.highlightBitmap);
            that.highlightBitmap.x = 0;
            that.highlightBitmap.y = 0;
            that.highlightBitmap.name = 'bmp_highlight_' + thisBlock;
            that.highlightBitmap.cursor = 'pointer';
            // Hide highlight bitmap to start.
            that.highlightBitmap.visible = false;

            // At me point, it should be safe to calculate the
            // bounds of the container and cache its contents.
            if (!firstTime) {
                that.container.uncache();
            }

            that._createCache();
            that.blocks.refreshCanvas();

            if (firstTime) {
                that._loadEventHandlers();
                if (that.image !== null) {
                    that._addImage();
                }
                that._finishImageLoad();
            } else {
                if (that.name === 'start' || that.name === 'drum') {
                    that._ensureDecorationOnTop();
                }

                // Adjust the docks.
                that.blocks.adjustDocks(thisBlock, true);

                // Adjust the text position.
                that._positionText(that.protoblock.scale);

                if (COLLAPSABLES.indexOf(that.name) !== -1) {
                    that.bitmap.visible = !that.collapsed;
                    that.highlightBitmap.visible = false;
                    that.updateCache();
                }

                if (that.postProcess != null) {
                    that.postProcess(that.postProcessArg);
                    that.postProcess = null;
                }
            }
        };

        // Create the bitmap for the block.
        function __processBitmap(name, bitmap, that) {
            if (that.bitmap != null) {
                that.container.removeChild(that.bitmap);
            }

            that.bitmap = bitmap;
            that.container.addChild(that.bitmap);
            that.bitmap.x = 0;
            that.bitmap.y = 0;
            that.bitmap.name = 'bmp_' + thisBlock;
            that.bitmap.cursor = 'pointer';
            that.blocks.refreshCanvas();

            if (that.protoblock.disabled) {
                var artwork = that.artwork.replace(/fill_color/g, DISABLEDFILLCOLOR).replace(/stroke_color/g, DISABLEDSTROKECOLOR).replace('block_label', block_label);
            } else {
                var artwork = that.artwork.replace(/fill_color/g, PALETTEHIGHLIGHTCOLORS[that.protoblock.palette.name]).replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[that.protoblock.palette.name]).replace('block_label', block_label);
            }

            for (var i = 1; i < that.protoblock.staticLabels.length; i++) {
                artwork = artwork.replace('arg_label_' + i, that.protoblock.staticLabels[i]);
            }

            that.blocks.blockArt[that.blocks.blockList.indexOf(that)] = artwork;
            _makeBitmap(artwork, that.name, __processHighlightBitmap, that);
        };

        if (this.overrideName) {
            if (['nameddo', 'nameddoArg', 'namedcalc', 'namedcalcArg'].indexOf(this.name) !== -1) {
                block_label = this.overrideName;
                if (block_label.length > 8) {
                    block_label = block_label.substr(0, 7) + '...';
                }
            } else {
                block_label = this.overrideName;
            }
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

    this._finishImageLoad = function () {
        var thisBlock = this.blocks.blockList.indexOf(this);

        // Value blocks get a modifiable text label.
        if (SPECIALINPUTS.indexOf(this.name) !== -1) {
            if (this.value == null) {
                switch(this.name) {
                case 'text':
                    this.value = '---';
                    break;
                case 'solfege':
                case 'eastindiansolfege':
                    this.value = 'sol';
                    break;
                case 'notename':
                    this.value = 'G';
                    break;
                case 'rest':
                    this.value = _('rest');
                    break;
                case 'number':
                    this.value = NUMBERBLOCKDEFAULT;
                    break;
                case 'modename':
                    this.value = getModeName(DEFAULTMODE);
                    break;
                case 'voicename':
                    this.value = DEFAULTVOICE;
                    break;
                case 'drumname':
                    this.value = getDrumName(DEFAULTDRUM);
                    break;
                case 'filtertype':
                    this.value = getFilterTypes(DEFAULTFILTERTYPE);
                    break; 
                case 'oscillatortype':
                    this.value = getOscillatorTypes(DEFAULTOSCILLATORTYPE);
                    break;        
                }
            }

            if (this.name === 'solfege') {
                var obj = splitSolfege(this.value);
                var label = i18nSolfege(obj[0]);
                var attr = obj[1];

                if (attr !== '♮') {
                    label += attr;
                }
            } else if (this.name === 'eastindiansolfege') {
                var obj = splitSolfege(this.value);
                var label = WESTERN2EISOLFEGENAMES[obj[0]];
                var attr = obj[1];

                if (attr !== '♮') {
                    label += attr;
                }
            } else {
                var label = this.value.toString();
            }

            if (label.length > 8) {
                label = label.substr(0, 7) + '...';
            }

            this.text.text = label;
            this.container.addChild(this.text);
            this._positionText(this.protoblock.scale);
        } else if (this.protoblock.parameter) {
            // Parameter blocks get a text label to show their current value.
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
            // event handler.
            var proto = new ProtoBlock('collapse');
            proto.scale = this.protoblock.scale;
            proto.extraWidth = 10;
            proto.basicBlockCollapsed();
            var obj = proto.generator();
            this.collapseArtwork = obj[0];
            var postProcess = function (that) {
                that._loadCollapsibleEventHandlers();
                that.loadComplete = true;

                if (that.postProcess !== null) {
                    that.postProcess(that.postProcessArg);
                    that.postProcess = null;
                }
            };

            this._generateCollapseArtwork(postProcess);
        }
    };

    this._generateCollapseArtwork = function (postProcess) {
        var that = this;
        var thisBlock = this.blocks.blockList.indexOf(this);

        function __processHighlightCollapseBitmap(name, bitmap, that) {
            that.highlightCollapseBlockBitmap = bitmap;
            that.highlightCollapseBlockBitmap.name = 'highlight_collapse_' + thisBlock;
            that.container.addChild(that.highlightCollapseBlockBitmap);
            that.highlightCollapseBlockBitmap.visible = false;

            if (that.collapseText === null) {
                var fontSize = 10 * that.protoblock.scale;
                switch (that.name) {
                case 'action':
                    that.collapseText = new createjs.Text(_('action'), fontSize + 'px Sans', '#000000');
                    break;
                case 'start':
                    that.collapseText = new createjs.Text(_('start'), fontSize + 'px Sans', '#000000');
                    break;
                case 'matrix':
                    that.collapseText = new createjs.Text(_('matrix'), fontSize + 'px Sans', '#000000');
                    break;
                case 'status':
                    that.collapseText = new createjs.Text(_('status'), fontSize + 'px Sans', '#000000');
                    break;
                case 'pitchdrummatrix':
                    that.collapseText = new createjs.Text(_('drum'), fontSize + 'px Sans', '#000000');
                    break;
                case 'rhythmruler':
                    that.collapseText = new createjs.Text(_('ruler'), fontSize + 'px Sans', '#000000');
                    break;
                case 'timbre':
                    that.collapseText = new createjs.Text(_('timbre'), fontSize + 'px Sans', '#000000');
                    break;    
                case 'pitchstaircase':
                    that.collapseText = new createjs.Text(_('stair'), fontSize + 'px Sans', '#000000');
                    break;
                case 'tempo':
                    that.collapseText = new createjs.Text(_('tempo'), fontSize + 'px Sans', '#000000');
                    break;
                case 'modewidget':
                    that.collapseText = new createjs.Text(_('mode'), fontSize + 'px Sans', '#000000');
                    break;
                case 'pitchslider':
                    that.collapseText = new createjs.Text(_('slider'), fontSize + 'px Sans', '#000000');
                    break;
                case 'drum':
                    that.collapseText = new createjs.Text(_('drum'), fontSize + 'px Sans', '#000000');
                    break;
                }

                that.collapseText.textAlign = 'left';
                that.collapseText.textBaseline = 'alphabetic';
                that.container.addChild(that.collapseText);
            }

            that._positionCollapseLabel(that.protoblock.scale);
            that.collapseText.visible = that.collapsed;

            that._ensureDecorationOnTop();

            that.updateCache();

            that.collapseContainer = new createjs.Container();
            that.collapseContainer.snapToPixelEnabled = true;

            var image = new Image();
            image.onload = function () {
                that.collapseBitmap = new createjs.Bitmap(image);
                that.collapseBitmap.scaleX = that.collapseBitmap.scaleY = that.collapseBitmap.scale = that.protoblock.scale / 2;
                that.collapseContainer.addChild(that.collapseBitmap);
                that.collapseBitmap.visible = !that.collapsed;
                finishCollapseButton(that);
            };

            image.src = 'images/collapse.svg';

            finishCollapseButton = function (that) {
                var image = new Image();
                image.onload = function () {
                    that.expandBitmap = new createjs.Bitmap(image);
                    that.expandBitmap.scaleX = that.expandBitmap.scaleY = that.expandBitmap.scale = that.protoblock.scale / 2;
                    that.collapseContainer.addChild(that.expandBitmap);
                    that.expandBitmap.visible = that.collapsed;

                    var bounds = that.collapseContainer.getBounds();
                    that.collapseContainer.cache(bounds.x, bounds.y, bounds.width, bounds.height);
                    that.blocks.stage.addChild(that.collapseContainer);
                    if (postProcess !== null) {
                        postProcess(that);
                    }

                    that.blocks.refreshCanvas();
                    that.blocks.cleanupAfterLoad(that.name);
                };

                image.src = 'images/expand.svg';
            }
        };

        function __processCollapseBitmap(name, bitmap, that) {
            that.collapseBlockBitmap = bitmap;
            that.collapseBlockBitmap.name = 'collapse_' + thisBlock;
            that.container.addChild(that.collapseBlockBitmap);
            that.collapseBlockBitmap.visible = that.collapsed;
            that.blocks.refreshCanvas();

            var artwork = that.collapseArtwork;
            _makeBitmap(artwork.replace(/fill_color/g, PALETTEHIGHLIGHTCOLORS[that.protoblock.palette.name]).replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[that.protoblock.palette.name]).replace('block_label', ''), '', __processHighlightCollapseBitmap, that);
        };

        var artwork = this.collapseArtwork;
        _makeBitmap(artwork.replace(/fill_color/g, PALETTEFILLCOLORS[this.protoblock.palette.name]).replace(/stroke_color/g, PALETTESTROKECOLORS[this.protoblock.palette.name]).replace('block_label', ''), '', __processCollapseBitmap, this);
    };

    this.hide = function () {
        this.container.visible = false;
        if (this.collapseContainer !== null) {
            this.collapseContainer.visible = false;
            this.collapseText.visible = false;
        }
    };

    this.show = function () {
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
    this.isValueBlock = function () {
        return this.protoblock.style === 'value';
    };

    this.isNoHitBlock = function () {
        return NOHIT.indexOf(this.name) !== -1;
    };

    this.isArgBlock = function () {
        return this.protoblock.style === 'value' || this.protoblock.style === 'arg';
    };

    this.isTwoArgBlock = function () {
        return this.protoblock.style === 'twoarg';
    };

    this.isTwoArgBooleanBlock = function () {
        return ['equal', 'greater', 'less'].indexOf(this.name) !== -1;
    };

    this.isClampBlock = function () {
        return this.protoblock.style === 'clamp' || this.isDoubleClampBlock() || this.isArgFlowClampBlock();
    };

    this.isArgFlowClampBlock = function () {
        return this.protoblock.style === 'argflowclamp';
    };

    this.isDoubleClampBlock = function () {
        return this.protoblock.style === 'doubleclamp';
    };

    this.isNoRunBlock = function () {
        return this.name === 'action';
    };

    this.isArgClamp = function () {
        return this.protoblock.style === 'argclamp' || this.protoblock.style === 'argclamparg';
    };

    this.isExpandableBlock = function () {
        return this.protoblock.expandable;
    };

    this.getBlockId = function () {
        // Generate a UID based on the block index into the blockList.
        var number = blockBlocks.blockList.indexOf(this);
        return '_' + number.toString();
    };

    this.removeChildBitmap = function (name) {
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
        var that = this;
        if (this.blocks.blockList[thisBlock].value === null && imagePath === null) {
            return;
        }
        var image = new Image();

        image.onload = function () {
            // Before adding new artwork, remove any old artwork.
            that.removeChildBitmap('media');

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
            that.value = myContainer.getCacheDataURL();
            that.imageBitmap = bitmap;

            // Next, scale the bitmap for the thumbnail.
            that._positionMedia(bitmap, bitmap.image.width, bitmap.image.height, that.protoblock.scale);
            that.container.addChild(bitmap);
            that.updateCache();
        };

        if (imagePath === null) {
            image.src = this.value;
        } else {
            image.src = imagePath;
        }
    };

    this._doOpenMedia = function (thisBlock) {
        var fileChooser = docById('myOpenAll');
        var that = this;

        readerAction = function (event) {
            window.scroll(0, 0);

            var reader = new FileReader();
            reader.onloadend = (function () {
                if (reader.result) {
                    if (that.name === 'media') {
                        that.value = reader.result;
                        that.loadThumbnail(null);
                        return;
                    }
                    that.value = [fileChooser.files[0].name, reader.result];
                    that.blocks.updateBlockText(thisBlock);
                }
            });
            if (that.name === 'media') {
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
        var that = this;
        var thisBlock = this.blocks.blockList.indexOf(this);
        this.blocks.findDragGroup(thisBlock);

        function __toggle() {
            var collapse = that.collapsed;
            if (that.collapseBitmap === null) {
                console.log('collapse bitmap not ready');
                return;
            }
            that.collapsed = !collapse;

            // These are the buttons to collapse/expand the stack.
            that.collapseBitmap.visible = collapse;
            that.expandBitmap.visible = !collapse;

            // These are the collpase-state bitmaps.
            that.collapseBlockBitmap.visible = !collapse;
            that.highlightCollapseBlockBitmap.visible = false;
            that.collapseText.visible = !collapse;

            if (collapse) {
                that.bitmap.visible = true;
            } else {
                that.bitmap.visible = false;
                that.updateCache();
            }
            that.highlightBitmap.visible = false;

            if (that.name === 'action') {
                // Label the collapsed block with the action label
                if (that.connections[1] !== null) {
                    var text = that.blocks.blockList[that.connections[1]].value;
                    if (text.length > 8) {
                        text = text.substr(0, 7) + '...';
                    }
                    that.collapseText.text = text;
                } else {
                    that.collapseText.text = '';
                }
            }

            // Make sure the text is on top.
            var z = that.container.getNumChildren() - 1;
            that.container.setChildIndex(that.collapseText, z);

            // Set collapsed state of blocks in drag group.
            if (that.blocks.dragGroup.length > 0) {
                for (var b = 1; b < that.blocks.dragGroup.length; b++) {
                    var blk = that.blocks.dragGroup[b];
                    that.blocks.blockList[blk].collapsed = !collapse;
                    that.blocks.blockList[blk].container.visible = collapse;
                }
            }

            that.collapseContainer.updateCache();
            that.updateCache();
        }

        __toggle();
    };

    this._positionText = function (blockScale) {
        this.text.textBaseline = 'alphabetic';
        this.text.textAlign = 'right';
        var fontSize = 10 * blockScale;
        this.text.font = fontSize + 'px Sans';
        this.text.x = TEXTX * blockScale / 2.;
        this.text.y = TEXTY * blockScale / 2.;

        // Some special cases
        if (SPECIALINPUTS.indexOf(this.name) !== -1) {
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

    this._positionMedia = function (bitmap, width, height, blockScale) {
        if (width > height) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = MEDIASAFEAREA[2] / width * blockScale / 2;
        } else {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = MEDIASAFEAREA[3] / height * blockScale / 2;
        }
        bitmap.x = (MEDIASAFEAREA[0] - 10) * blockScale / 2;
        bitmap.y = MEDIASAFEAREA[1] * blockScale / 2;
    };

    this._calculateCollapseHitArea = function () {
        var bounds = this.collapseContainer.getBounds();
        var hitArea = new createjs.Shape();
        var w2 = bounds.width;
        var h2 = bounds.height;

        hitArea.graphics.beginFill('#FFF').drawRect(0, 0, w2, h2);
        hitArea.x = 0;
        hitArea.y = 0;
        this.collapseContainer.hitArea = hitArea;
    };

    this._positionCollapseLabel = function (blockScale) {
        this.collapseText.x = COLLAPSETEXTX * blockScale / 2;
        this.collapseText.y = COLLAPSETEXTY * blockScale / 2;

        // Ensure text is on top.
        z = this.container.getNumChildren() - 1;
        this.container.setChildIndex(this.collapseText, z);
    };

    this._positionCollapseContainer = function (blockScale) {
        this.collapseContainer.x = this.container.x + (COLLAPSEBUTTONXOFF * blockScale / 2);
        this.collapseContainer.y = this.container.y + (COLLAPSEBUTTONYOFF * blockScale / 2);
    };

    // These are the event handlers for collapsible blocks.
    this._loadCollapsibleEventHandlers = function () {
        var that = this;
        var thisBlock = this.blocks.blockList.indexOf(this);

        this._calculateCollapseHitArea();

        this.collapseContainer.on('mouseover', function (event) {
            that.blocks.highlight(thisBlock, true);
            that.blocks.activeBlock = thisBlock;
            that.blocks.refreshCanvas();
        });

        var haveClick = false;
        var moved = false;
        var locked = false;
        var sawMouseDownEvent = false;

        this.collapseContainer.on('click', function (event) {
            that.blocks.activeBlock = thisBlock;
            haveClick = true;

            if (locked) {
                return;
            }

            locked = true;
            setTimeout(function () {
                locked = false;
            }, 500);

            hideDOMLabel();

            if (!moved) {
                that.collapseToggle();
		// haveClick = false;
            }
        });

        this.collapseContainer.on('mousedown', function (event) {
            sawMouseDownEvent = true;
            // Always show the trash when there is a block selected,
            trashcan.show();

            // Raise entire stack to the top.
            that.blocks.raiseStackToTop(thisBlock);
            // And the collapse button
            that.blocks.stage.setChildIndex(that.collapseContainer, that.blocks.stage.getNumChildren() - 1);
            moved = false;
            var original = {
                x: event.stageX / that.blocks.getStageScale(),
                y: event.stageY / that.blocks.getStageScale()
            };

            var offset = {
                x: Math.round(that.collapseContainer.x - original.x),
                y: Math.round(that.collapseContainer.y - original.y)
            };

            that.collapseContainer.on('mouseout', function (event) {
                if (haveClick) {
                    return;
                }

                that._collapseOut(event, moved, haveClick);
                moved = false;
		sawMouseDownEvent = false;
            });

            that.collapseContainer.on('pressup', function (event) {
                if (sawMouseDownEvent && haveClick) {
                    return;
                }

                if (!sawMouseDownEvent && !moved) {
                    // Sometimes we don't see a mousedown event, so
                    // treat this like a click.
                    that.collapseToggle();
                } else {
                    that._collapseOut(event, moved, haveClick, true);
                }
                moved = false;
		sawMouseDownEvent = false;
            });

            that.collapseContainer.on('pressmove', function (event) {
                // FIXME: More voodoo
                event.nativeEvent.preventDefault();
                moved = true;

                var oldX = that.collapseContainer.x;
                var oldY = that.collapseContainer.y;

                var dx = Math.round(event.stageX / that.blocks.getStageScale() + offset.x - oldX);
                var dy = Math.round(event.stageY / that.blocks.getStageScale() + offset.y - oldY);


                var finalPos = oldY + dy;
                if (that.blocks.stage.y === 0 && finalPos < 45) {
                    dy += 45 - finalPos;
                }

                if (that.blocks.longPressTimeout != null) {
                    clearTimeout(that.blocks.longPressTimeout);
                    that.blocks.longPressTimeout = null;
                }

                that.blocks.moveBlockRelative(thisBlock, dx, dy);

                // If we are over the trash, warn the user.
                if (trashcan.overTrashcan(event.stageX / that.blocks.getStageScale(), event.stageY / that.blocks.getStageScale())) {
                    trashcan.startHighlightAnimation();
                } else {
                    trashcan.stopHighlightAnimation();
                }

                that._positionCollapseContainer(that.protoblock.scale);

                // ...and move any connected blocks.
                that.blocks.findDragGroup(thisBlock)
                if (that.blocks.dragGroup.length > 0) {
                    for (var b = 0; b < that.blocks.dragGroup.length; b++) {
                        var blk = that.blocks.dragGroup[b];
                        if (b !== 0) {
                            that.blocks.moveBlockRelative(blk, dx, dy);
                        }
                    }
                }

                that.blocks.refreshCanvas();
		sawMouseDownEvent = false;
            });
        });
    };

    this._collapseOut = function (event, moved, haveClick) {
        var thisBlock = this.blocks.blockList.indexOf(this);

        // Always hide the trash when there is no block selected.
        trashcan.hide();
        this.blocks.unhighlight(thisBlock);
        if (moved) {
            // Check if block is in the trash.
            if (trashcan.overTrashcan(event.stageX / this.blocks.getStageScale(), event.stageY / this.blocks.getStageScale())) {
                if (trashcan.isVisible)
                    this.blocks.sendStackToTrash(this);
            } else {
                // Otherwise, process move.
                this.blocks.blockMoved(thisBlock);
            }
        }

        if (this.blocks.activeBlock !== this) {
            return;
        }

        this.blocks.unhighlight(null);
        this.blocks.activeBlock = null;
        this.blocks.refreshCanvas();
    };

    this._calculateBlockHitArea = function () {
        var hitArea = new createjs.Shape();
        var bounds = this.container.getBounds()

        if (bounds === null) {
            this._createCache();
            bounds = this.bounds;
        }

        // Since hitarea is concave, we only detect hits on top
        // section of block. Otherwise we would not be able to grab
        // blocks placed inside of clamps.
        if (this.isClampBlock() || this.isArgClamp()) {
            hitArea.graphics.beginFill('#FFF').drawRect(0, 0, bounds.width, STANDARDBLOCKHEIGHT * this.blocks.blockScale);
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
    this._loadEventHandlers = function () {
        var that = this;
        var thisBlock = this.blocks.blockList.indexOf(this);

        this._calculateBlockHitArea();

        this.container.on('mouseover', function (event) {
            that.blocks.highlight(thisBlock, true);
            that.blocks.activeBlock = thisBlock;
            that.blocks.refreshCanvas();
        });

        var haveClick = false;
        var moved = false;
        var locked = false;
        var getInput = window.hasMouse;

        this.container.on('click', function (event) {
            that.blocks.activeBlock = thisBlock;
            haveClick = true;

            if (locked) {
                return;
            }

            locked = true;
            setTimeout(function () {
                locked = false;
            }, 500);

            hideDOMLabel();

            if ((!window.hasMouse && getInput) || (window.hasMouse && !moved)) {
                if (that.blocks.selectingStack) {
                    var topBlock = that.blocks.findTopBlock(thisBlock);
                    that.blocks.selectedStack = topBlock;
                    that.blocks.selectingStack = false;
                } else if (that.name === 'media') {
                    that._doOpenMedia(thisBlock);
                } else if (that.name === 'loadFile') {
                    that._doOpenMedia(thisBlock);
                } else if (SPECIALINPUTS.indexOf(that.name) !== -1) {
                    if (!that.trash) {
                        that._changeLabel();
                    }
                } else {

                    if (!that.blocks.inLongPress) {
                        var topBlock = that.blocks.findTopBlock(thisBlock);
                        console.log('running from ' + that.blocks.blockList[topBlock].name);
                        that.blocks.logo.runLogoCommands(topBlock);
                    }
                }
            }
        });

        this.container.on('mousedown', function (event) {
            // Track time for detecting long pause...
            // but only for top block in stack.
            if (that.connections[0] == null) {
                var d = new Date();
                that.blocks.mouseDownTime = d.getTime();
                that.blocks.longPressTimeout = setTimeout(function () {
                    that.blocks.triggerLongPress(that);
                }, LONGPRESSTIME);
            }

            // Always show the trash when there is a block selected,
            trashcan.show();

            // Raise entire stack to the top.
            that.blocks.raiseStackToTop(thisBlock);

            // And possibly the collapse button.
            if (that.collapseContainer != null) {
                that.blocks.stage.setChildIndex(that.collapseContainer, that.blocks.stage.getNumChildren() - 1);
            }

            moved = false;
            var original = {
                x: event.stageX / that.blocks.getStageScale(),
                y: event.stageY / that.blocks.getStageScale()
            };

            var offset = {
                x: Math.round(that.container.x - original.x),
                y: Math.round(that.container.y - original.y)
            };

            that.container.on('mouseout', function (event) {
                if (haveClick) {
                    return;
                }

                if (!that.blocks.inLongPress) {
                    that._mouseoutCallback(event, moved, haveClick, true);
                }

                moved = false;
            });

            that.container.on('pressup', function (event) {
                if (haveClick) {
                    return;
                }

                if (!that.blocks.inLongPress) {
                    that._mouseoutCallback(event, moved, haveClick, true);
                }

                moved = false;
            });

            that.container.on('pressmove', function (event) {
                // FIXME: More voodoo
                event.nativeEvent.preventDefault();

                if (window.hasMouse) {
                    moved = true;
                } else {
                    // Make it eaiser to select text on mobile.
                    setTimeout(function () {
                        moved = Math.abs(event.stageX / that.blocks.getStageScale() - original.x) + Math.abs(event.stageY / that.blocks.getStageScale() - original.y) > 20 && !window.hasMouse;
                        getInput = !moved;
                    }, 200);
                }

                var oldX = that.container.x;
                var oldY = that.container.y;

                var dx = Math.round(event.stageX / that.blocks.getStageScale() + offset.x - oldX);
                var dy = Math.round(event.stageY / that.blocks.getStageScale() + offset.y - oldY);

                var finalPos = oldY + dy;
                if (that.blocks.stage.y === 0 && finalPos < 45) {
                    dy += 45 - finalPos;
                }

                // Add some wiggle room for longPress.
                // if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {

                if (that.blocks.longPressTimeout != null) {
                    clearTimeout(that.blocks.longPressTimeout);
                    that.blocks.longPressTimeout = null;
                }

                if (!moved && that.label != null) {
                    that.label.style.display = 'none';
                }

                that.blocks.moveBlockRelative(thisBlock, dx, dy);

                // If we are over the trash, warn the user.
                if (trashcan.overTrashcan(event.stageX / that.blocks.getStageScale(), event.stageY / that.blocks.getStageScale())) {
                    trashcan.startHighlightAnimation();
                } else {
                    trashcan.stopHighlightAnimation();
                }

                if (that.isValueBlock() && that.name !== 'media') {
                    // Ensure text is on top
                    var z = that.container.getNumChildren() - 1;
                    that.container.setChildIndex(that.text, z);
                } else if (that.collapseContainer != null) {
                    that._positionCollapseContainer(that.protoblock.scale);
                }

                // ...and move any connected blocks.
                that.blocks.findDragGroup(thisBlock)
                if (that.blocks.dragGroup.length > 0) {
                    for (var b = 0; b < that.blocks.dragGroup.length; b++) {
                        var blk = that.blocks.dragGroup[b];
                        if (b !== 0) {
                            that.blocks.moveBlockRelative(blk, dx, dy);
                        }
                    }
                }

                that.blocks.refreshCanvas();

                // } else {
                    // Didn't really move enough to be considered a move.
                    // moved = false;
                // }
            });
        });

        this.container.on('mouseout', function (event) {
            if (!that.blocks.inLongPress) {
                that._mouseoutCallback(event, moved, haveClick, true);
            }

            moved = false;
        });

        this.container.on('pressup', function (event) {
            if (!that.blocks.inLongPress) {
                that._mouseoutCallback(event, moved, haveClick, false);
            }

            moved = false;
        });
    };

    this._mouseoutCallback = function (event, moved, haveClick, hideDOM) {
        var thisBlock = this.blocks.blockList.indexOf(this);

        // Always hide the trash when there is no block selected.
        trashcan.hide();

        if (this.blocks.longPressTimeout != null) {
            clearTimeout(this.blocks.longPressTimeout);
            this.blocks.longPressTimeout = null;
        }

        if (moved) {
            // Check if block is in the trash.
            if (trashcan.overTrashcan(event.stageX / this.blocks.getStageScale(), event.stageY / this.blocks.getStageScale())) {
                if (trashcan.isVisible) {
                    this.blocks.sendStackToTrash(this);
                }
            } else {
                // Otherwise, process move.
                // Also, keep track of the time of the last move.
                var d = new Date();
                this.blocks.mouseDownTime = d.getTime();
                this.blocks.blockMoved(thisBlock);

                // Just in case the blocks are not properly docked after
                // the move (workaround for issue #38 -- Blocks fly
                // apart). Still need to get to the root cause.
                this.blocks.adjustDocks(this.blocks.blockList.indexOf(this), true);
            }
        } else if (SPECIALINPUTS.indexOf(this.name) !== -1 || ['media', 'loadFile'].indexOf(this.name) !== -1) {
            if (!haveClick) {
                // Simulate click on Android.
                var d = new Date();
                if ((d.getTime() - this.blocks.mouseDownTime) < 500) {
                    if (!this.trash)
                    {
                        var d = new Date();
                        this.blocks.mouseDownTime = d.getTime();
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
            // Did the mouse move out off the block? If so, hide the
            // label DOM element.
            if (this.bounds != null && (event.stageX / this.blocks.getStageScale() < this.container.x || event.stageX / this.blocks.getStageScale() > this.container.x + this.bounds.width || event.stageY < this.container.y || event.stageY > this.container.y + this.bounds.height)) {
                this._labelChanged();
                hideDOMLabel();
                this.blocks.unhighlight(null);
                this.blocks.refreshCanvas();
            } else if (this.blocks.activeBlock !== thisBlock) {
                // Are we in a different block altogether?
                hideDOMLabel();
                this.blocks.unhighlight(null);
                this.blocks.refreshCanvas();
            } else {
                // this.blocks.unhighlight(null);
                // this.blocks.refreshCanvas();
            }

            this.blocks.activeBlock = null;
        }
    };

    this._ensureDecorationOnTop = function () {
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

    this._changeLabel = function () {
        var that = this;
        var x = this.container.x;
        var y = this.container.y;

        var canvasLeft = this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        var canvasTop = this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        var movedStage = false;
        if (!window.hasMouse && this.blocks.stage.y + y > 75) {
            movedStage = true;
            var fromY = this.blocks.stage.y;
            this.blocks.stage.y = -y + 75;
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

            var obj = splitSolfege(this.value);
            var selectednote = obj[0];
            var selectedattr = obj[1];

            // solfnotes_ is used in the interface for internationalization.
            //.TRANS: the note names must be separated by single spaces
            var solfnotes_ = _('ti la sol fa mi re do').split(' ');

            var labelHTML = '<select name="solfege" id="solfegeLabel" style="position: absolute;  background-color: #88e20a; width: 100px;">'
            for (var i = 0; i < SOLFNOTES.length; i++) {
                if (selectednote === solfnotes_[i]) {
                    labelHTML += '<option value="' + SOLFNOTES[i] + '" selected>' + solfnotes_[i] + '</option>';
                } else if (selectednote === SOLFNOTES[i]) {
                    labelHTML += '<option value="' + SOLFNOTES[i] + '" selected>' + solfnotes_[i] + '</option>';
                } else {
                    labelHTML += '<option value="' + SOLFNOTES[i] + '">' + solfnotes_[i] + '</option>';
                }
            }

            labelHTML += '</select>';
            if (selectedattr === '') {
                selectedattr = '♮';
            }
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
        } else if (this.name === 'eastindiansolfege') {
            var type = 'solfege';

            var obj = splitSolfege(this.value);
            var selectednote = WESTERN2EISOLFEGENAMES[obj[0]];
            var selectedattr = obj[1];

            var eisolfnotes_ = ['ni', 'dha', 'pa', 'ma', 'ga', 're', 'sa'];

            var labelHTML = '<select name="solfege" id="solfegeLabel" style="position: absolute;  background-color: #88e20a; width: 100px;">'
            for (var i = 0; i < SOLFNOTES.length; i++) {
                if (selectednote === eisolfnotes_[i]) {
                    labelHTML += '<option value="' + SOLFNOTES[i] + '" selected>' + eisolfnotes_[i] + '</option>';
                } else if (selectednote === WESTERN2EISOLFEGENAMES[SOLFNOTES[i]]) {
                    labelHTML += '<option value="' + SOLFNOTES[i] + '" selected>' + eisolfnotes_[i] + '</option>';
                } else {
                    labelHTML += '<option value="' + SOLFNOTES[i] + '">' + eisolfnotes_[i] + '</option>';
                }
            }

            labelHTML += '</select>';
            if (selectedattr === '') {
                selectedattr = '♮';
            }
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
            if (selectedattr === '') {
                selectedattr = '♮';
            }
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
        } else if (this.name === 'modename') {
            var type = 'modename';
            if (this.value != null) {
                var selectedmode = this.value[0];
            } else {
                var selectedmode = getModeName(DEFAULTMODE);
            }

            var labelHTML = '<select name="modename" id="modenameLabel" style="position: absolute;  background-color: #88e20a; width: 60px;">'
            for (var i = 0; i < MODENAMES.length; i++) {
                if (MODENAMES[i][0].length === 0) {
                    // work around some weird i18n bug
                    labelHTML += '<option value="' + MODENAMES[i][1] + '">' + MODENAMES[i][1] + '</option>';
                } else if (selectednote === MODENAMES[i][0]) {
                    labelHTML += '<option value="' + selectedmode + '" selected>' + selectedmode + '</option>';
                } else if (selectednote === MODENAMES[i][1]) {
                    labelHTML += '<option value="' + selectedmode + '" selected>' + selectedmode + '</option>';
                } else {
                    labelHTML += '<option value="' + MODENAMES[i][0] + '">' + MODENAMES[i][0] + '</option>';
                }
            }

            labelHTML += '</select>';
            labelElem.innerHTML = labelHTML;
            this.label = docById('modenameLabel');
        } else if (this.name === 'drumname') {
            var type = 'drumname';
            if (this.value != null) {
                var selecteddrum = getDrumName(this.value);
            } else {
                var selecteddrum = getDrumName(DEFAULTDRUM);
            }

            var labelHTML = '<select name="drumname" id="drumnameLabel" style="position: absolute;  background-color: #00b0a4; width: 60px;">'
            for (var i = 0; i < DRUMNAMES.length; i++) {
                if (DRUMNAMES[i][0].length === 0) {
                    // work around some weird i18n bug
                    labelHTML += '<option value="' + DRUMNAMES[i][1] + '">' + DRUMNAMES[i][1] + '</option>';
                } else if (selecteddrum === DRUMNAMES[i][0]) {
                    labelHTML += '<option value="' + selecteddrum + '" selected>' + selecteddrum + '</option>';
                } else if (selecteddrum === DRUMNAMES[i][1]) {
                    labelHTML += '<option value="' + selecteddrum + '" selected>' + selecteddrum + '</option>';
                } else {
                    labelHTML += '<option value="' + DRUMNAMES[i][0] + '">' + DRUMNAMES[i][0] + '</option>';
                }
            }

            labelHTML += '</select>';
            labelElem.innerHTML = labelHTML;
            this.label = docById('drumnameLabel');
        } else if (this.name === 'filtertype') {
            var type = 'filtertype';
            if (this.value != null) {
                var selectedtype = getFilterTypes(this.value);
            } else {
                var selectedtype = getFilterTypes(DEFAULTFILTERTYPE);
            }

            var labelHTML = '<select name="filtertype" id="filtertypeLabel" style="position: absolute;  background-color: #00b0a4; width: 60px;">'
            for (var i = 0; i < FILTERTYPES.length; i++) {
                if (FILTERTYPES[i][0].length === 0) {
                    // work around some weird i18n bug
                    labelHTML += '<option value="' + FILTERTYPES[i][1] + '">' + FILTERTYPES[i][1] + '</option>';
                } else if (selectedtype === FILTERTYPES[i][0]) {
                    labelHTML += '<option value="' + selectedtype + '" selected>' + selectedtype + '</option>';
                } else if (selectedtype === FILTERTYPES[i][1]) {
                    labelHTML += '<option value="' + selectedtype + '" selected>' + selectedtype + '</option>';
                } else {
                    labelHTML += '<option value="' + FILTERTYPES[i][0] + '">' + FILTERTYPES[i][0] + '</option>';
                }
            }

            labelHTML += '</select>';
            labelElem.innerHTML = labelHTML;
            this.label = docById('filtertypeLabel');    
        } else if (this.name === 'oscillatortype') {
            var type = 'oscillatortype';
            if (this.value != null) {
                var selectedosctype = getOscillatorTypes(this.value);
            } else {
                var selectedosctype = getOscillatorTypes(DEFAULTOSCILLATORTYPE);
            }

            var labelHTML = '<select name="oscillatortype" id="oscillatortypeLabel" style="position: absolute;  background-color: #00b0a4; width: 60px;">'
            for (var i = 0; i < OSCTYPES.length; i++) {
                if (OSCTYPES[i][0].length === 0) {
                    // work around some weird i18n bug
                    labelHTML += '<option value="' + OSCTYPES[i][1] + '">' + OSCTYPES[i][1] + '</option>';
                } else if (selectedosctype === OSCTYPES[i][0]) {
                    labelHTML += '<option value="' + selectedosctype + '" selected>' + selectedosctype + '</option>';
                } else if (selectedosctype === OSCTYPES[i][1]) {
                    labelHTML += '<option value="' + selectedosctype + '" selected>' + selectedosctype + '</option>';
                } else {
                    labelHTML += '<option value="' + OSCTYPES[i][0] + '">' + OSCTYPES[i][0] + '</option>';
                }
            }

            labelHTML += '</select>';
            labelElem.innerHTML = labelHTML;
            this.label = docById('oscillatortypeLabel');    
        } else if (this.name === 'voicename') {
            var type = 'voicename';
            if (this.value != null) {
                var selectedvoice = getVoiceName(this.value);
            } else {
                var selectedvoice = getVoiceName(DEFAULTVOICE);
            }

            var labelHTML = '<select name="voicename" id="voicenameLabel" style="position: absolute;  background-color: #00b0a4; width: 60px;">'
            for (var i = 0; i < VOICENAMES.length; i++) {
                if (VOICENAMES[i][0].length === 0) {
                    // work around some weird i18n bug
                    labelHTML += '<option value="' + VOICENAMES[i][1] + '">' + VOICENAMES[i][1] + '</option>';
                } else if (selectedvoice === VOICENAMES[i][0]) {
                    labelHTML += '<option value="' + selectedvoice + '" selected>' + selectedvoice + '</option>';
                } else if (selectedvoice === VOICENAMES[i][1]) {
                    labelHTML += '<option value="' + selectedvoice + '" selected>' + selectedvoice + '</option>';
                } else {
                    labelHTML += '<option value="' + VOICENAMES[i][0] + '">' + VOICENAMES[i][0] + '</option>';
                }
            }

            labelHTML += '</select>';
            labelElem.innerHTML = labelHTML;
            this.label = docById('voicenameLabel');
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

            that._labelChanged();

            event.preventDefault();

            labelElem.classList.remove('hasKeyboard');

            window.scroll(0, 0);
            that.label.removeEventListener('keypress', __keypress);

            if (movedStage) {
                that.blocks.stage.y = fromY;
                that.blocks.updateStage();
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

        this.label.addEventListener('change', function () {
            that._labelChanged();
        });

        if (this.labelattr != null) {
            this.labelattr.addEventListener('change', function () {
                that._labelChanged();
            });
        }

        this.label.style.left = Math.round((x + this.blocks.stage.x) * this.blocks.blockScale + canvasLeft) + 'px';
        this.label.style.top = Math.round((y + this.blocks.stage.y) * this.blocks.blockScale + canvasTop) + 'px';

        // There may be a second select used for # and b.
        if (this.labelattr != null) {
            this.label.style.width = Math.round(60 * this.blocks.blockScale) * this.protoblock.scale / 2 + 'px';
            this.labelattr.style.left = Math.round((x + this.blocks.stage.x + 60) * this.blocks.blockScale + canvasLeft) + 'px';
            this.labelattr.style.top = Math.round((y + this.blocks.stage.y) * this.blocks.blockScale + canvasTop) + 'px';
            this.labelattr.style.width = Math.round(60 * this.blocks.blockScale) * this.protoblock.scale / 2 + 'px';
            this.labelattr.style.fontSize = Math.round(20 * this.blocks.blockScale * this.protoblock.scale / 2) + 'px';
        } else {
            this.label.style.width = Math.round(100 * this.blocks.blockScale) * this.protoblock.scale / 2 + 'px';
        }

        this.label.style.fontSize = Math.round(20 * this.blocks.blockScale * this.protoblock.scale / 2) + 'px';
        this.label.style.display = '';
        this.label.focus();

        // Firefox fix
        setTimeout(function () {
            that.label.style.display = '';
            that.label.focus();
            focused = true;
        }, 100);
    };

    this._labelChanged = function () {
        // Update the block values as they change in the DOM label.
        if (this == null || this.label == null) {
            this._label_lock = false;
            return;
        }

        this._label_lock = true;

        this.label.style.display = 'none';
        if (this.labelattr != null) {
            this.labelattr.style.display = 'none';
        }

        var oldValue = this.value;

        if (this.label.value === '') {
            this.label.value = '_';
        }
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
            this._label_lock = false;
            return;
        }

        var c = this.connections[0];
        if (this.name === 'text' && c != null) {
            var cblock = this.blocks.blockList[c];
            switch (cblock.name) {
            case 'action':
                var that = this;

                setTimeout(function () {
                    that.blocks.palettes.removeActionPrototype(oldValue);
                }, 1000);

                // Ensure new name is unique.
                var uniqueValue = this.blocks.findUniqueActionName(newValue);
                if (uniqueValue !== newValue) {
                    newValue = uniqueValue;
                    this.value = newValue;
                    var label = this.value.toString();
                    if (label.length > 8) {
                        label = label.substr(0, 7) + '...';
                    }
                    this.text.text = label;
                    this.label.value = newValue;
                    this.updateCache();
                }
                break;
            default:
                break;
            }
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

        if (this.name === 'solfege') {
            var obj = splitSolfege(this.value);
            var label = i18nSolfege(obj[0]);
            var attr = obj[1];

            if (attr !== '♮') {
                label += attr;
            }
        } else if (this.name === 'eastindiansolfege') {
            var obj = splitSolfege(this.value);
            var label = WESTERN2EISOLFEGENAMES[obj[0]];
            var attr = obj[1];

            if (attr !== '♮') {
                label += attr;
            }
        } else {
            var label = this.value.toString();
        }

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

                this.blocks.newNameddoBlock(newValue, this.blocks.actionHasReturn(c), this.blocks.actionHasArgs(c));
                var blockPalette = this.blocks.palettes.dict['action'];
                for (var blk = 0; blk < blockPalette.protoList.length; blk++) {
                    var block = blockPalette.protoList[blk];
                    if (oldValue === _('action')) {
                        if (block.name === 'nameddo' && block.defaults.length === 0) {
                            block.hidden = true;
                        }
                    }
                    else {
                        if (block.name === 'nameddo' && block.defaults[0] === oldValue) {
                            blockPalette.remove(block,oldValue);
                        }
                    }
                }

                if (oldValue === _('action')) {
                    this.blocks.newNameddoBlock(newValue, this.blocks.actionHasReturn(c), this.blocks.actionHasArgs(c));
                    this.blocks.setActionProtoVisiblity(false);
                }
                this.blocks.renameNameddos(oldValue, newValue);
                this.blocks.palettes.hide();
                this.blocks.palettes.updatePalettes('action');
                this.blocks.palettes.show();
                break;
            case 'storein':
                // If the label was the name of a storein, update the
                // associated box this.blocks and the palette buttons.
                if (this.value !== 'box') {
                    this.blocks.newStoreinBlock(this.value);
                    this.blocks.newNamedboxBlock(this.value);
                }
                // Rename both box <- name and namedbox blocks.
                this.blocks.renameBoxes(oldValue, newValue);
                this.blocks.renameNamedboxes(oldValue, newValue);
                this.blocks.palettes.hide();
                this.blocks.palettes.updatePalettes('boxes');
                this.blocks.palettes.show();
                break;
            case 'setdrum':
            case 'playdrum':
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    if (newValue.slice(0, 4) === 'http') {
                        this.blocks.logo.synth.loadSynth(newValue);
                    }
                }
                break;
            default:
                break;
            }
        }

        // We are done changing the label, so unlock.
        this._label_lock = false;

        if (_THIS_IS_MUSIC_BLOCKS_) {
            // Load the synth for the selected drum.
            if (this.name === 'drumname') {
                this.blocks.logo.synth.loadSynth(getDrumSynthName(this.value));
            } else if (this.name === 'voicename') {
                this.blocks.logo.synth.loadSynth(getVoiceSynthName(this.value));
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
    // Async creation of bitmap from SVG data.
    // Works with Chrome, Safari, Firefox (untested on IE).
    var img = new Image();
    img.onload = function () {
        var bitmap = new createjs.Bitmap(img);
        callback(name, bitmap, args);
    };

    img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(data)));
};
