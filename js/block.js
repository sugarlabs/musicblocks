// Copyright (c) 2014-18 Walter Bender
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
const TEXTWIDTH = 240; // 90
const STRINGLEN = 9;
const LONGPRESSTIME = 1500;
const INLINECOLLAPSIBLES = ['newnote', 'interval'];
const COLLAPSIBLES = ['drum', 'start', 'action', 'matrix', 'pitchdrummatrix', 'rhythmruler2', 'timbre', 'status', 'pitchstaircase', 'tempo', 'pitchslider', 'modewidget', 'newnote', 'musickeyboard', 'temperament', 'interval'];
const NOHIT = ['hidden', 'hiddennoflow'];
const SPECIALINPUTS = ['text', 'number', 'solfege', 'eastindiansolfege', 'notename', 'voicename', 'modename', 'drumname', 'filtertype', 'oscillatortype', 'boolean', 'intervalname', 'invertmode', 'accidentalname', 'temperamentname', 'noisename', 'customNote'];
const WIDENAMES = ['intervalname', 'accidentalname', 'drumname', 'voicename', 'modename', 'temperamentname', 'modename', 'noisename'];
const EXTRAWIDENAMES = [];
const PIEMENUS = ['solfege', 'eastindiansolfege', 'notename', 'voicename', 'drumname', 'accidentalname', 'invertmode', 'boolean', 'filtertype', 'oscillatortype', 'intervalname', 'modename', 'temperamentname', 'noisename', 'customNote'];

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
    this.collapsed = false;  // Is this collapsible block collapsed?
    this.inCollapsed = false;  // Is this block in a collapsed stack?
    this.trash = false;  // Is this block in the trash?
    this.loadComplete = false;  // Has the block finished loading?
    this.label = null;  // Editable textview in DOM.
    this.labelattr = null;  // Editable textview in DOM.
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
    this.width = 0;
    this.height = 0;
    this.hitHeight = 0;
    this.bitmap = null;
    this.highlightBitmap = null;

    // The svg from which the bitmaps are generated
    this.artwork = null;
    this.collapseArtwork = null;

    // Start and Action blocks has a collapse button
    this.collapseButtonBitmap = null;
    this.expandButtonBitmap = null;
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
    this._labelLock = false;
    this._piemenuExitTime = null;
    this._triggerLongPress = false;

    // Internal function for creating cache.
    // Includes workaround for a race condition.
    this._createCache = function (callback, args, counter) {
        if (counter === undefined) {
            var loopCount = 0;
        } else {
            var loopCount = counter;
        }

        if (loopCount > 3) {
            console.log('COULD NOT CREATE CACHE');
            return;
        }

        var that = this;
        this.bounds = this.container.getBounds();

        if (this.bounds === null) {
            setTimeout(function () {
                // Try regenerating the artwork
                that.regenerateArtwork(true, []);
                that._createCache(callback, args, loopCount + 1);
            }, 100);
        } else {
            this.container.cache(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
            callback(this, args);
        }
    };

    // Internal function for creating cache.
    // Includes workaround for a race condition.
    this.updateCache = function (counter) {
        if (counter === undefined) {
            var loopCount = 0;
        } else {
            var loopCount = counter;
        }

        if (loopCount > 3) {
            console.log('COULD NOT UPDATE CACHE');
            return;
        }

        var that = this;

        if (this.bounds == null) {
            setTimeout(function () {
                // console.log('UPDATE CACHE: BOUNDS NOT READY');
                that.updateCache(loopCount + 1);
            }, 200);
        } else {
            this.container.updateCache();
            this.blocks.refreshCanvas();
        }
    };

    this.ignore = function () {
        if (this.bitmap === null) {
            return true;
        }

        if (this.name === 'hidden') {
            return true;
        }

        if (this.name === 'hiddennoflow') {
            return true;
        }

        if (this.trash) {
            return true;
        }

        if (this.inCollapsed) {
            return true;
        }

        if (!this.bitmap.visible && !this.highlightBitmap.visible) {
            if (this.collapseBlockBitmap === null) {
                return true;
            } else {
                if (!this.collapseBlockBitmap.visible && !this.highlightCollapseBlockBitmap.visible) {
                    return true;
                }
            }
        }

        return false;
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

    this.isCollapsible = function () {
        return COLLAPSIBLES.indexOf(this.name) !== -1;
    };

    this.isInlineCollapsible = function () {
        return INLINECOLLAPSIBLES.indexOf(this.name) !== -1;
    };

    this.highlight = function () {
        if (this.trash) {
            return;
        }

        if (this.inCollapsed) {
            // In collapsed, so do nothing.
            return;
        }

        if (!this.container.visible) {
            // block is hidden, so do nothing.
            return;
        }

        if (!this.bitmap.visible) {
            // block is hidden, so do nothing.
            return;
        }

        // Always hide the non-highlighted artwork.
        this.container.visible = true;
        this.bitmap.visible = false;

        // If it is a collapsed collapsable, hightlight the collapsed state.
        if (this.collapsed) {
            // Show the highlighted collapsed artwork.
            if (this.highlightCollapseBlockBitmap !== null) {
                this.highlightCollapseBlockBitmap.visible = true;
            }

            if (this.collapseText !== null) {
                this.collapseText.visible = true;
            }

            // and hide the unhighlighted collapsed artwork...
            if (this.collapseBlockBitmap !== null) {
                this.collapseBlockBitmap.visible = false;
            }

            // but not the uncollapsed highlighted artwork.
            this.highlightBitmap.visible = false;
        } else {
            // Show the highlighted artwork.
            this.highlightBitmap.visible = true;

            // If it is an uncollapsed collapsable, make sure the
            // collapsed artwork is hidden.
            if (this.isCollapsible()) {
                // There could be a race condition when making a
                // new action block.
                if (this.collapseText !== null) {
                    this.collapseText.visible = false;
                }

                if (this.collapseBlockBitmap !== null) {
                    this.collapseBlockBitmap.visible = false;
                }

                if (this.highlightCollapseBlockBitmap !== null) {
                    this.highlightCollapseBlockBitmap.visible = false;
                }
            }
        }

        this.container.updateCache();
    };

    this.unhighlight = function () {
        if (this.trash) {
            return;
        }

        if (this.inCollapsed) {
            // In collapsed, so do nothing.
            return;
        }

        if (this.bitmap === null) {
            console.log('bitmap not ready');
            return;
        }

        // Always hide the highlighted artwork.
        this.highlightBitmap.visible = false;
        this.container.visible = true;

        // If it is a collapsed collapsable, unhightlight the collapsed state.
        if (this.collapsed) {
            // Show the unhighlighted collapsed artwork.'
            // We may have a race condition...
            if (this.collapseBlockBitmap !== null) {
                this.collapseBlockBitmap.visible = true;
            }

            if (this.collapseText !== null) {
                this.collapseText.visible = true;
            }

            // but not the highlighted collapsed artwork...
            if (this.highlightCollapseBlockBitmap !== null) {
                this.highlightCollapseBlockBitmap.visible = false;
            }

            // and not the uncollapsed artwork.
            this.bitmap.visible = false;

        } else {
            this.bitmap.visible = true;
            this.container.visible = true;

            if (this.isCollapsible()) {
                // There could be a race condition when making a
                // new action block.
                if (this.collapseText !== null) {
                    this.collapseText.visible = false;
                }

                if (this.collapseBlockBitmap !== null) {
                    this.collapseBlockBitmap.visible = false;
                }

                if (this.highlightCollapseBlockBitmap !== null) {
                    this.highlightCollapseBlockBitmap.visible = false;
                }
            }
        }

        this.container.updateCache();
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
                z = that.container.children.length - 1;
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
            } else if (that.isCollapsible()) {
                that._ensureDecorationOnTop();
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

        if (this.container !== null) {
            var that = this;
            var _postProcess = function (that) {
                that.collapseButtonBitmap.scaleX = that.collapseButtonBitmap.scaleY = that.collapseButtonBitmap.scale = scale / 3;
                that.expandButtonBitmap.scaleX = that.expandButtonBitmap.scaleY = that.expandButtonBitmap.scale = scale / 3;

                that.updateCache();
                that._calculateBlockHitArea();
            };

            if (this.isCollapsible()) {
                this._generateCollapseArtwork(_postProcess);
                var fontSize = 10 * scale;
                this.collapseText.font = fontSize + 'px Sans';
                this._positionCollapseLabel(scale);
            }
        }
    };

    this._newArtwork = function (plusMinus) {
        if (this.isCollapsible()) {
            var proto = new ProtoBlock('collapse');
            proto.scale = this.protoblock.scale;
            if (this.name === 'interval') {
                proto.extraWidth = 80;
            } else {
                proto.extraWidth = 40;
            }

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
            case 'makeblock':
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
        case 'makeblock':
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

        this.width = obj[2];
        this.height = obj[3];
        this.hitHeight = obj[4];
    };

    this.imageLoad = function () {
        // Load any artwork associated with the block and create any
        // extra parts. Image components are loaded asynchronously so
        // most the work happens in callbacks.

        // We also need a text label for some blocks. For number and
        // text blocks, this is the primary label; for parameter
        // blocks, this is used to display the current block value.
        var fontSize = 10 * this.protoblock.scale;
        this.text = new createjs.Text('', fontSize + 'px Sans', platformColor.blockText);

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

        if (collapse && this.collapseBlockBitmap !== null) {
            this.container.removeChild(this.collapseButtonBitmap);
            this.container.removeChild(this.expandButtonBitmap);
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
        var __processHighlightBitmap = function (bitmap, that) {
            if (that.highlightBitmap != null) {
                that.container.removeChild(that.highlightBitmap);
            }

            that.highlightBitmap = bitmap;
            that.container.addChild(that.highlightBitmap);
            that.highlightBitmap.x = 0;
            that.highlightBitmap.y = 0;
            that.highlightBitmap.name = 'bmp_highlight_' + thisBlock;
            if (!that.blocks.logo.runningLilypond) {
                that.highlightBitmap.cursor = 'pointer';
            }
            // Hide highlight bitmap to start.
            that.highlightBitmap.visible = false;

            // At me point, it should be safe to calculate the
            // bounds of the container and cache its contents.
            if (!firstTime) {
                that.container.uncache();
            }

            __callback = function (that, firstTime) {
                that.blocks.refreshCanvas();
                var thisBlock = that.blocks.blockList.indexOf(that);

                if (firstTime) {
                    that._loadEventHandlers();
                    if (that.image !== null) {
                        that._addImage();
                    }

                    that._finishImageLoad();
                } else {
                    if (that.isCollapsible) {
                        that._ensureDecorationOnTop();
                    }

                    // Adjust the docks.
                    that.blocks.adjustDocks(thisBlock, true);

                    // Adjust the text position.
                    that._positionText(that.protoblock.scale);

                    if (that.isCollapsible()) {
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

            that._createCache(__callback, firstTime);
        };

        // Create the bitmap for the block.
        var __processBitmap = function (bitmap, that) {
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
                var artwork = that.artwork.replace(/fill_color/g, DISABLEDFILLCOLOR).replace(/stroke_color/g, DISABLEDSTROKECOLOR).replace('block_label', safeSVG(block_label));
            } else {
                var artwork = that.artwork.replace(/fill_color/g, PALETTEHIGHLIGHTCOLORS[that.protoblock.palette.name]).replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[that.protoblock.palette.name]).replace('block_label', safeSVG(block_label));
            }

            for (var i = 1; i < that.protoblock.staticLabels.length; i++) {
                artwork = artwork.replace('arg_label_' + i, that.protoblock.staticLabels[i]);
            }

            that.blocks.blockArt[that.blocks.blockList.indexOf(that)] = artwork;
            _blockMakeBitmap(artwork, __processHighlightBitmap, that);
        };

        if (this.overrideName) {
            if (['storein2', 'nameddo', 'nameddoArg', 'namedcalc', 'namedcalcArg'].indexOf(this.name) !== -1) {
                block_label = this.overrideName;
                if (getTextWidth(block_label, 'bold 20pt Sans') > TEXTWIDTH) {
                    block_label = ' ' + block_label.substr(0, STRINGLEN) + '...';
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
            this.protoblock.scale = this.blocks.blockScale;

            var obj = this.protoblock.generator();
            this.artwork = obj[0];
            for (var i = 0; i < obj[1].length; i++) {
                this.docks.push([obj[1][i][0], obj[1][i][1], this.protoblock.dockTypes[i]]);
            }

            this.width = obj[2];
            this.height = obj[3];
            this.hitHeight = obj[4];
        }

        if (this.protoblock.disabled) {
            var artwork = this.artwork.replace(/fill_color/g, DISABLEDFILLCOLOR).replace(/stroke_color/g, DISABLEDSTROKECOLOR).replace('block_label', safeSVG(block_label));
        } else {
            var artwork = this.artwork.replace(/fill_color/g, PALETTEFILLCOLORS[this.protoblock.palette.name]).replace(/stroke_color/g, PALETTESTROKECOLORS[this.protoblock.palette.name]).replace('block_label', safeSVG(block_label));
        }

        for (var i = 1; i < this.protoblock.staticLabels.length; i++) {
            artwork = artwork.replace('arg_label_' + i, this.protoblock.staticLabels[i]);
        }
        _blockMakeBitmap(artwork, __processBitmap, this);
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
                case 'customNote':
                    var len = this.blocks.logo.synth.startingPitch.length;
                    this.value = this.blocks.logo.synth.startingPitch.substring(0, len - 1) + '(+0)';
                    break;
                case 'notename':
                    this.value = 'G';
                    break;
                case 'rest':
                    this.value = 'rest';
                    break;
                case 'boolean':
                    this.value = true;
                    break;
                case 'number':
                    this.value = NUMBERBLOCKDEFAULT;
                    break;
                case 'modename':
                    this.value = DEFAULTMODE;
                    break;
                case 'accidentalname':
                    this.value = DEFAULTACCIDENTAL;
                    break;
                case 'intervalname':
                    this.value = DEFAULTINTERVAL;
                    break;
                case 'invertmode':
                    this.value = DEFAULTINVERT;
                    break;
                case 'voicename':
                    this.value = DEFAULTVOICE;
                    break;
                case 'noiseename':
                    this.value = DEFAULTNOISE;
                    break;
                case 'drumname':
                    this.value = DEFAULTDRUM;
                    break;
                case 'filtertype':
                    this.value = DEFAULTFILTERTYPE;
                    break;
                case 'oscillatortype':
                    this.value = DEFAULTOSCILLATORTYPE;
                    break;
                case 'temperamentname':
                    this.value = 'equal';
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
                if (this.value !== null) {
                    var label = this.value.toString();
                } else {
                    var label = '???';
                }
            }

            if (WIDENAMES.indexOf(this.name) === -1 && getTextWidth(label, 'bold 20pt Sans') > TEXTWIDTH ) {   
                label = label.substr(0, STRINGLEN) + '...';
            }

            this.text.text = label;
            this.container.addChild(this.text);
            this._positionText(this.protoblock.scale);
        } else if (this.protoblock.parameter) {
            // Parameter blocks get a text label to show their current value.
            this.container.addChild(this.text);
            this._positionText(this.protoblock.scale);
        }

        if (!this.isCollapsible()) {
            this.loadComplete = true;
            if (this.postProcess !== null) {
                this.postProcess(this.postProcessArg);
                this.postProcess = null;
            }

            this.blocks.refreshCanvas();
            this.blocks.cleanupAfterLoad(this.name);
            /*
            if (this.trash) {
                this.collapseText.visible = false;
                this.collapseButtonBitmap.visible = false;
                this.expandButtonBitmap.visible = false;
            }
            */
        } else {
            // Some blocks, e.g., Start blocks and Action blocks can
            // collapse, so add an event handler.
            if (this.isInlineCollapsible()) {
                var proto = new ProtoBlock('collapse-note');
                proto.scale = this.protoblock.scale;
                if (this.name === 'interval') {
                    proto.extraWidth = 80;
                } else {
                    proto.extraWidth = 40;
                }
                proto.zeroArgBlock();
            } else {
                var proto = new ProtoBlock('collapse');
                proto.scale = this.protoblock.scale;
                proto.extraWidth = 40;
                proto.basicBlockCollapsed();
            }

            var obj = proto.generator();
            this.collapseArtwork = obj[0];

            var postProcess = function (that) {
                // that._loadCollapsibleEventHandlers();
                that.loadComplete = true;

                if (that.postProcess !== null) {
                    that.postProcess(that.postProcessArg);
                    that.postProcess = null;
                }
            };

            if (this.isCollapsible()) {
                this._generateCollapseArtwork(postProcess);
            }
        }
    };

    this._generateCollapseArtwork = function (postProcess) {
        var that = this;
        var thisBlock = this.blocks.blockList.indexOf(this);

        var __finishCollapse = function (that) {
            if (postProcess !== null) {
                postProcess(that);
            }

            that.blocks.refreshCanvas();
            that.blocks.cleanupAfterLoad(that.name);
            if (that.trash) {
                that.collapseText.visible = false;
                that.collapseButtonBitmap.visible = false;
                that.expandButtonBitmap.visible = false;
            }
        };

        var __processCollapseButton = function (that) {
            var image = new Image();
            image.onload = function () {
                that.collapseButtonBitmap = new createjs.Bitmap(image);
                that.collapseButtonBitmap.scaleX = that.collapseButtonBitmap.scaleY = that.collapseButtonBitmap.scale = that.protoblock.scale / 3;

                that.container.addChild(that.collapseButtonBitmap);

                that.collapseButtonBitmap.x = 2 * that.protoblock.scale;
                if (that.isInlineCollapsible()) {
                    that.collapseButtonBitmap.y = 4 * that.protoblock.scale;
                } else {
                    that.collapseButtonBitmap.y = 10 * that.protoblock.scale;
                }

                that.collapseButtonBitmap.visible = !that.collapsed;

                __finishCollapse(that);
            };

            image.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(COLLAPSEBUTTON)));
        };

        var __processExpandButton = function (that) {
            var image = new Image();
            image.onload = function () {
                that.expandButtonBitmap = new createjs.Bitmap(image);
                that.expandButtonBitmap.scaleX = that.expandButtonBitmap.scaleY = that.expandButtonBitmap.scale = that.protoblock.scale / 3;

                that.container.addChild(that.expandButtonBitmap);
                that.expandButtonBitmap.visible = that.collapsed;

                that.expandButtonBitmap.x = 2 * that.protoblock.scale;
                if (that.isInlineCollapsible()) {
                    that.expandButtonBitmap.y = 4 * that.protoblock.scale;
                } else {
                    that.expandButtonBitmap.y = 10 * that.protoblock.scale;
                }

                __processCollapseButton(that);
            };

            image.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(EXPANDBUTTON)));
        };

        var __processHighlightCollapseBitmap = function (bitmap, that) {
            that.highlightCollapseBlockBitmap = bitmap;
            that.highlightCollapseBlockBitmap.name = 'highlight_collapse_' + thisBlock;
            that.container.addChild(that.highlightCollapseBlockBitmap);
            that.highlightCollapseBlockBitmap.visible = false;

            if (that.collapseText === null) {
                var fontSize = 10 * that.protoblock.scale;
                switch (that.name) {
                case 'action':
                    that.collapseText = new createjs.Text(_('action'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'start':
                    that.collapseText = new createjs.Text(_('start'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'matrix':
                    that.collapseText = new createjs.Text(_('matrix'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'status':
                    that.collapseText = new createjs.Text(_('status'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'pitchdrummatrix':
                    that.collapseText = new createjs.Text(_('drum mapper'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'rhythmruler':
                    that.collapseText = new createjs.Text(_('ruler'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'timbre':
                    that.collapseText = new createjs.Text(_('timbre'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'pitchstaircase':
                    that.collapseText = new createjs.Text(_('stair'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'tempo':
                    that.collapseText = new createjs.Text(_('tempo'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'modewidget':
                    that.collapseText = new createjs.Text(_('mode'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'pitchslider':
                    that.collapseText = new createjs.Text(_('slider'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'musickeyboard':
                    that.collapseText = new createjs.Text(_('keyboard'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'drum':
                    that.collapseText = new createjs.Text(_('drum'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'rhythmruler2':
                    that.collapseText = new createjs.Text(_('rhythm maker'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'newnote':
                    that.collapseText = new createjs.Text(_('note value'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'interval':
                    that.collapseText = new createjs.Text(_('scalar interval'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                case 'temperament':
                    that.collapseText = new createjs.Text(_('temperament'), fontSize + 'px Sans', platformColor.blockText);
                    break;
                default:
                    that.collapseText = new createjs.Text('foobar', fontSize + 'px Sans', platformColor.blockText);
                }

                that.collapseText.textAlign = 'left';
                that.collapseText.textBaseline = 'alphabetic';
                that.container.addChild(that.collapseText);
            }

            that._positionCollapseLabel(that.protoblock.scale);
            that.collapseText.visible = that.collapsed;
            that._ensureDecorationOnTop();

            // Save the collapsed block artwork for export.
            var artwork = that.collapseArtwork.replace(/fill_color/g, PALETTEFILLCOLORS[that.protoblock.palette.name]).replace(/stroke_color/g, PALETTESTROKECOLORS[that.protoblock.palette.name]).replace('block_label', safeSVG(that.collapseText.text));
            that.blocks.blockCollapseArt[that.blocks.blockList.indexOf(that)] = artwork;

            __processExpandButton(that);
        };

        var __processCollapseBitmap = function (bitmap, that) {
            that.collapseBlockBitmap = bitmap;
            that.collapseBlockBitmap.name = 'collapse_' + thisBlock;
            that.container.addChild(that.collapseBlockBitmap);
            that.collapseBlockBitmap.visible = that.collapsed;
            that.blocks.refreshCanvas();

            var artwork = that.collapseArtwork;
            _blockMakeBitmap(artwork.replace(/fill_color/g, PALETTEHIGHLIGHTCOLORS[that.protoblock.palette.name]).replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[that.protoblock.palette.name]).replace('block_label', ''), __processHighlightCollapseBitmap, that);
        };

        var artwork = this.collapseArtwork.replace(/fill_color/g, PALETTEFILLCOLORS[this.protoblock.palette.name]).replace(/stroke_color/g, PALETTESTROKECOLORS[this.protoblock.palette.name]).replace('block_label', '');
        _blockMakeBitmap(artwork, __processCollapseBitmap, this);
    };

    this.hide = function () {
        this.container.visible = false;
        if (this.isCollapsible()) {
            this.collapseText.visible = false;
            this.expandButtonBitmap.visible = false;
            this.collapseButtonBitmap.visible = false;
        }

        this.updateCache();
        this.blocks.refreshCanvas();
    };

    this.show = function () {
        // If it is not in the trash and not in collapsed, then show it.
        if (!this.trash && !this.inCollapsed) {
            this.container.visible = true;
            if (this.isCollapsible()) {
                if (this.collapsed) {
                    this.bitmap.visible = false;
                    this.highlightBitmap.visible = false;
                    this.collapseBlockBitmap.visible = true;
                    this.highlightCollapseBlockBitmap.visible = false;
                    this.collapseText.visible = true;
                    this.expandButtonBitmap.visible = true;
                    this.collapseButtonBitmap.visible = false;
                } else {
                    this.bitmap.visible = true;
                    this.highlightBitmap.visible = false;
                    this.collapseBlockBitmap.visible = false;
                    this.highlightCollapseBlockBitmap.visible = false;
                    this.collapseText.visible = false;
                    this.expandButtonBitmap.visible = false;
                    this.collapseButtonBitmap.visible = true;
                }
            } else {
                this.bitmap.visible = true;
                this.highlightBitmap.visible = false;
            }

            this.updateCache();
            this.blocks.refreshCanvas();
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
        for (var child = 0; child < this.container.children.length; child++) {
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
            that.value = myContainer.bitmapCache.getCacheDataURL();
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

        var __readerAction = function (event) {
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
            fileChooser.removeEventListener('change', __readerAction);
        };

        fileChooser.addEventListener('change', __readerAction, false);
        fileChooser.focus();
        fileChooser.click();
        window.scroll(0, 0)
    };

    this.setCollapsedState = function () {
        // Mark it as in a collapsed block and hide it.
        this.inCollapsed = true;
        this.hide();
    };

    this.setUncollapsedState = function (nblk) {
        // It could be a block inside a note block, which may or may
        // not be hidden depending on the collapsed state of the
        // containing note block.
        if (nblk === null) {
            this.inCollapsed = false;
            this.show();
        } else {
            // if we are inside of a collapsed note block, do nothing.
            if (this.blocks.blockList[nblk].collapsed) {
            } else {
                this.inCollapsed = false;
                this.show();
            }
        }
    };

    this.collapseToggle = function () {
        // Find the blocks to collapse/expand inside of a collapable
        // block.
        var thisBlock = this.blocks.blockList.indexOf(this);
        this.blocks.findDragGroup(thisBlock);

        if (this.collapseBlockBitmap === null) {
            console.log('collapse bitmap not ready');
            return;
        }

        // Remember the current state.
        var isCollapsed = this.collapsed;
        // Toggle the state.
        this.collapsed = !isCollapsed;
        
        // These are the buttons to collapse/expand the stack.
        this.collapseButtonBitmap.visible = isCollapsed;
        this.expandButtonBitmap.visible = !isCollapsed;

        // These are the collpase-state bitmaps.
        this.collapseBlockBitmap.visible = !isCollapsed;
        this.highlightCollapseBlockBitmap.visible = false;
        this.collapseText.visible = !isCollapsed;

        if (this.isInlineCollapsible() && this.collapseText.visible) {
            switch(this.name) {
            case 'newnote':
                this._newNoteLabel();
                break;
            case 'interval':
                this._intervalLabel();
                break;
            default:
                console.log('What do we do with a collapsed ' + this.name + ' block?');
                break;
            }
        }

        this.bitmap.visible = this.collapsed;
        this.highlightBitmap.visible = false;
        this.updateCache();

        if (this.name === 'action') {
            // Label the collapsed block with the action label.
            if (this.connections[1] !== null) {
                var text = this.blocks.blockList[this.connections[1]].value;
                if (getTextWidth(text, 'bold 20pt Sans') > TEXTWIDTH) {
                    text = text.substr(0, STRINGLEN) + '...';
                }

                this.collapseText.text = text;
            } else {
                this.collapseText.text = '';
            }
        }

        // Make sure the text is on top.
        var z = this.container.children.length - 1;
        this.container.setChildIndex(this.collapseText, z);

        if (this.isInlineCollapsible()) {
            // Only collapse the contents of the note block.
            this._toggle_inline(thisBlock, isCollapsed);
        } else {
            // Set collapsed state of all of the blocks in the drag group.
            if (this.blocks.dragGroup.length > 0) {
                for (var b = 1; b < this.blocks.dragGroup.length; b++) {
                    var blk = this.blocks.dragGroup[b];
                    if (this.collapsed) { // if (this.blocks.blockList[blk].inCollapsed) {
                        this.blocks.blockList[blk].setCollapsedState();
                    } else {
                        this.blocks.blockList[blk].setUncollapsedState(this.blocks.insideInlineCollapsibleBlock(blk));
                    }
                }
            }
        }

        this.updateCache();
        this.unhighlight();
        this.blocks.refreshCanvas();
    };

    this._intervalLabel = function () {
        // Find pitch and value to display on the collapsed interval
        // block.
        const INTERVALLABELS = {0: _('1st'),
                                1: _('2nd'),
                                2: _('3rd'),
                                3: _('4th'),
                                4: _('5th'),
                                5: _('6th'),
                                6: _('7th'),
                               };

        var intervals = [];
        var i = 0;

        var c = this.blocks.blockList.indexOf(this);
        while (c !== null) {
            var lastIntervalBlock = c;
            var n = this.blocks.blockList[c].connections[1];
            var cblock = this.blocks.blockList[n];
            if (cblock.name === 'number') {
                if (Math.abs(cblock.value) in INTERVALLABELS) {
                    if (cblock.value < 0) {
                        intervals.push('-' + INTERVALLABELS[-cblock.value]);
                    } else {
                        intervals.push('+' + INTERVALLABELS[cblock.value]);
                    }
                } else {
                    if (cblock.value < 0) {
                        intervals.push('-' + cblock.value);
                    } else {
                        intervals.push('+' + cblock.value);
                    }
                }
            } else {
                intervals.push('');
            }

            i += 1;
            if (i > 5) {
                console.log('loop?');
                break;
            }

            c = this.blocks.findNestedIntervalBlock(this.blocks.blockList[c].connections[2]);
        }

        var itext = '';
        for (var i = intervals.length; i > 0; i--) {
            itext += ' ' + intervals[i - 1];
        }

        var v = '';
        var nblk = this.blocks.findNoteBlock(lastIntervalBlock);
        if (nblk === null) {
            this.collapseText.text = _('scalar interval') + itext;
        } else {
            var c = this.blocks.blockList[nblk].connections[1];
            if (c !== null) {
                // Only look for standard form: / 1 4
                if (this.blocks.blockList[c].name === 'divide') { 
                    var c1 = this.blocks.blockList[c].connections[1];
                    var c2 = this.blocks.blockList[c].connections[2];
                    if (this.blocks.blockList[c1].name === 'number' && this.blocks.blockList[c2].name === 'number') {
                        v = this.blocks.blockList[c1].value + '/' + this.blocks.blockList[c2].value;
                        if (this.blocks.blockList[c2].value in NSYMBOLS) {
                            v += NSYMBOLS[this.blocks.blockList[c2].value];
                        }
                    }
                }
            }

            c = this.blocks.findFirstPitchBlock(this.blocks.blockList[nblk].connections[2]);
            var p = this._getPitch(c);
            if (c === null || p === '') {
                this.collapseText.text = _('scalar interval') + itext;
            } else {
                // Are there more pitch blocks in this note?
                c = this.blocks.findFirstPitchBlock(last(this.blocks.blockList[c].connections));
                // Update the collapsed-block label.
                if (c === null) {
                    this.collapseText.text = p  + ' | ' + v + itext;
                } else {
                    this.collapseText.text = p + '...' + ' | ' + v + itext;
                }
            }
        }
    };

    this._newNoteLabel = function () {
        // Find pitch and value to display on the collapsed note value
        // block.
        var v = '';
        var c = this.connections[1];
        if (c !== null) {
            // Only look for standard form: / 1 4
            if (this.blocks.blockList[c].name === 'divide') { 
                var c1 = this.blocks.blockList[c].connections[1];
                var c2 = this.blocks.blockList[c].connections[2];
                if (this.blocks.blockList[c1].name === 'number' && this.blocks.blockList[c2].name === 'number') {
                    v = this.blocks.blockList[c1].value + '/' + this.blocks.blockList[c2].value;
                    if (this.blocks.blockList[c2].value in NSYMBOLS) {
                        v += NSYMBOLS[this.blocks.blockList[c2].value];
                    }
                }
            }
        }

        c = this.connections[2];
        c = this.blocks.findFirstPitchBlock(c);
        var p = this._getPitch(c);
        if (c === null) {
            this.collapseText.text = _('silence') + ' | ' + v;
        } else if (p === '' && v === '') {
            this.collapseText.text = _('note value');
        } else {
            // Are there more pitch blocks in this note?
            c = this.blocks.findFirstPitchBlock(last(this.blocks.blockList[c].connections));
            // Update the collapsed-block label.
            if (c === null) {
                this.collapseText.text = p + ' | ' + v;
            } else {
                this.collapseText.text = p + '... | ' + v;
            }
        }
    };

    this._getPitch = function (c) {
        if (c === null) {
            return '';
        }

        switch(this.blocks.blockList[c].name) {
        case 'pitch':
            var c1 = this.blocks.blockList[c].connections[1];
            var c2 = this.blocks.blockList[c].connections[2];
            if (this.blocks.blockList[c2].name === 'number') {
                if (this.blocks.blockList[c1].name === 'solfege') {
                    return _(this.blocks.blockList[c1].value) + ' ' + this.blocks.blockList[c2].value;
                } else if (this.blocks.blockList[c1].name === 'notename') {
                    return this.blocks.blockList[c1].value + ' ' + this.blocks.blockList[c2].value;
                }
            }
            break;
        case 'scaledegree':
            var c1 = this.blocks.blockList[c].connections[1];
            var c2 = this.blocks.blockList[c].connections[2];
            if (this.blocks.blockList[c2].name === 'number') {
                if (this.blocks.blockList[c1].name === 'number' && this.blocks.blockList[c1].value === 1 ) {
                    //.TRANS: scale degree = 1st
                    return this.blocks.blockList[c1].value + _('st, ') + this.blocks.blockList[c2].value;
		} else if (this.blocks.blockList[c1].name === 'number' && this.blocks.blockList[c1].value === 2 ) {
                    //.TRANS: scale degree = 2nd
                    return this.blocks.blockList[c1].value + _('nd, ') + this.blocks.blockList[c2].value;
		} else if (this.blocks.blockList[c1].name === 'number' && this.blocks.blockList[c1].value === 3 ) {
		    //.TRANS: scale degree = 3rd
		    return this.blocks.blockList[c1].value + _('rd, ') + this.blocks.blockList[c2].value;
		} else if (this.blocks.blockList[c1].name === 'number') {
		    //.TRANS: scale degree = 4th and above
                    return this.blocks.blockList[c1].value + _('th, ') + this.blocks.blockList[c2].value;
		}
            }
            break;
        case 'hertz':
            var c1 = this.blocks.blockList[c].connections[1];
            if (this.blocks.blockList[c1].name === 'number') {
                return this.blocks.blockList[c1].value + 'HZ';
            }
            break;
        case 'steppitch':
            var c1 = this.blocks.blockList[c].connections[1];
            if (this.blocks.blockList[c1].name === 'number' && this.blocks.blockList[c1].value < 0) {
                //.TRANS: scalar step
                return _('down') + ' ' + Math.abs(this.blocks.blockList[c1].value);
	    } else
                return _('up') + ' ' + this.blocks.blockList[c1].value;
            break;
        case 'pitchnumber':
            var c1 = this.blocks.blockList[c].connections[1];
            if (this.blocks.blockList[c1].name === 'number') {
                //.TRANS: pitch number
                return _('pitch') + ' ' + this.blocks.blockList[c1].value;
            }
            break;
        case 'playdrum':
            return _('drum');
            break;
        case 'rest2':
            return _('silence');
            break;
        default:
            return '';
        }
    };

    this._toggle_inline = function (thisBlock, collapse) {
        // Toggle the collapsed state of blocks inside of a note (or
        // interval) block and reposition any blocks below
        // it. Finally, resize any surrounding clamps.

        // Set collapsed state of note value arg blocks...
        if (this.connections[1] !== null) {
            this.blocks.findDragGroup(this.connections[1]);
            for (var b = 0; b < this.blocks.dragGroup.length; b++) {
                var blk = this.blocks.dragGroup[b];
                this.blocks.blockList[blk].container.visible = collapse;
                if (collapse) {
                    this.blocks.blockList[blk].inCollapsed = false;
                } else {
                    this.blocks.blockList[blk].inCollapsed = true;
                }
            }
        }

        // and the blocks inside the clamp.
        if (this.connections[2] !== null) {
            this.blocks.findDragGroup(this.connections[2]);
            for (var b = 0; b < this.blocks.dragGroup.length; b++) {
                var blk = this.blocks.dragGroup[b];
                // Look to see if the local parent block is collapsed.
                var parent = this.blocks.insideInlineCollapsibleBlock(blk);
                if (parent === null || !this.blocks.blockList[parent].collapsed) {
                    this.blocks.blockList[blk].container.visible = collapse;
                    if (collapse) {
                        this.blocks.blockList[blk].inCollapsed = false;
                    } else {
                        this.blocks.blockList[blk].inCollapsed = true;
                    }
                } else {
                    // Parent is collapsed, so keep hidden.
                    this.blocks.blockList[blk].container.visible = false;
                    this.blocks.blockList[blk].inCollapsed = true;
                }
            }
        }

        // Reposition the blocks below.
        if (this.connections[3] != null) {
            // The last connection is flow. The second to last
            // connection is child flow.  FIX ME: This will not work
            // if there is more than one arg, e.g. n > 4.
            var n = this.docks.length;
            if (collapse) {
                var dy = this.blocks.blockList[thisBlock].docks[n - 1][1] - this.blocks.blockList[thisBlock].docks[n - 2][1];
            } else {
                var dy = this.blocks.blockList[thisBlock].docks[n - 2][1] - this.blocks.blockList[thisBlock].docks[n - 1][1];
            }

            this.blocks.findDragGroup(this.connections[3]);
            for (var b = 0; b < this.blocks.dragGroup.length; b++) {
                var blk = this.blocks.dragGroup[b];
                this.blocks.moveBlockRelative(blk, 0, dy);
            }

            this.blocks.adjustDocks(thisBlock, true);
        }

        // Look to see if we are in a clamp block. If so, readjust.
        clampList = [];
        this.blocks.findNestedClampBlocks(thisBlock, clampList);
        if (clampList.length > 0) {
            this.blocks.clampBlocksToCheck = clampList;
            this.blocks.adjustExpandableClampBlock();
        }

        this.blocks.refreshCanvas();
    };

    this._positionText = function (blockScale) {
        this.text.textBaseline = 'alphabetic';
        this.text.textAlign = 'right';
        var fontSize = 10 * blockScale;
        this.text.font = fontSize + 'px Sans';
        this.text.x = Math.floor((TEXTX * blockScale / 2.) + 0.5);
        this.text.y = Math.floor((TEXTY * blockScale / 2.) + 0.5);

        // Some special cases
        if (SPECIALINPUTS.indexOf(this.name) !== -1) {
            this.text.textAlign = 'center';
            this.text.x = Math.floor((VALUETEXTX * blockScale / 2.) + 0.5);
            if (EXTRAWIDENAMES.indexOf(this.name) !== -1) {
                this.text.x *= 3.0;
            } else if (WIDENAMES.indexOf(this.name) !== -1) {
                this.text.x = Math.floor((this.text.x * 1.75) + 0.5);
            } else if (this.name === 'text') {
                this.text.x = Math.floor((this.width / 2) + 0.5);
            }
        } else if (this.name === 'nameddo') {
            this.text.textAlign = 'center';
            this.text.x = Math.floor((this.width / 2) + 0.5);
        } else if (this.protoblock.args === 0) {
            var bounds = this.container.getBounds();
            this.text.x = Math.floor(this.width - 25 + 0.5);
        } else if (this.isCollapsible()) {
            this.text.x += Math.floor(15 * blockScale);
        } else {
            this.text.textAlign = 'left';
            if (this.docks[0][2] === 'booleanout') {
                this.text.y = Math.floor(this.docks[0][1] + 0.5);
            }
        }

        // Ensure text is on top.
        z = this.container.children.length - 1;
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

    this._positionCollapseLabel = function (blockScale) {
        if (this.isInlineCollapsible()) {
            this.collapseText.x = Math.floor(((COLLAPSETEXTX + STANDARDBLOCKHEIGHT) * blockScale / 2) + 0.5);
            this.collapseText.y = Math.floor(((COLLAPSETEXTY - 8) * blockScale / 2) + 0.5);
        } else {
            this.collapseText.x = Math.floor(((COLLAPSETEXTX + 30) * blockScale / 2) + 0.5);
            this.collapseText.y = Math.floor(((COLLAPSETEXTY) * blockScale / 2) + 0.5);
        }

        // Ensure text is on top.
        z = this.container.children.length - 1;
        this.container.setChildIndex(this.collapseText, z);
    };

    this._calculateBlockHitArea = function () {
        var hitArea = new createjs.Shape();
        hitArea.graphics.beginFill('#FFF').drawRect(0, 0, this.width, this.hitHeight);
        this.container.hitArea = hitArea;
    };

    // These are the event handlers for block containers.
    this._loadEventHandlers = function () {
        var that = this;
        var thisBlock = this.blocks.blockList.indexOf(this);

        this._calculateBlockHitArea();

        // Remove any old event handlers that are kicking around.
        this.container.removeAllEventListeners('mouseover');
        this.container.removeAllEventListeners('click');
        this.container.removeAllEventListeners('pressmove');
        this.container.removeAllEventListeners('mousedown');
        this.container.removeAllEventListeners('mouseout');
        this.container.removeAllEventListeners('pressup');

        this.container.on('mouseover', function (event) {
            docById('contextWheelDiv').style.display = 'none';

            if (!that.blocks.logo.runningLilypond) {
                document.body.style.cursor = 'pointer';
            }

            that.blocks.highlight(thisBlock, true);
            that.blocks.activeBlock = thisBlock;
            that.blocks.refreshCanvas();
        });

        var haveClick = false;
        var moved = false;
        var locked = false;
        var getInput = window.hasMouse;

        this.container.on('click', function (event) {
            if (that.blocks.getLongPressStatus()) {
                return;
            }

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

            dx = (event.stageX / that.blocks.getStageScale()) - that.container.x;
            if (!moved && that.isCollapsible() && dx < 30 / that.blocks.getStageScale()) {
                that.collapseToggle();
            } else if ((!window.hasMouse && getInput) || (window.hasMouse && !moved)) {
                if (that.name === 'media') {
                    that._doOpenMedia(thisBlock);
                } else if (that.name === 'loadFile') {
                    that._doOpenMedia(thisBlock);
                } else if (SPECIALINPUTS.indexOf(that.name) !== -1) {
                    if (!that.trash) {
                        if (that._triggerLongPress) {
                            that._triggerLongPress = false;
                        } else {
                            that._changeLabel();
                        }
                    }
                } else {
                    if (!that.blocks.getLongPressStatus() && !that.blocks.stageClick) {
                        var topBlock = that.blocks.findTopBlock(thisBlock);
                        console.log('running from ' + that.blocks.blockList[topBlock].name);
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            that.blocks.logo.synth.resume();
                        }

                        if (that.blocks.turtles.running()) {
                            that.blocks.logo.doStopTurtle();

                            setTimeout(function () {
                                that.blocks.logo.runLogoCommands(topBlock);
                            }, 250);
                        } else {
                            that.blocks.logo.runLogoCommands(topBlock);
                        }
                    }
                }
            }
        });

        this.container.on('mousedown', function (event) {
            docById('contextWheelDiv').style.display = 'none';

            // Track time for detecting long pause...
            var d = new Date();
            that.blocks.mouseDownTime = d.getTime();

            that.blocks.longPressTimeout = setTimeout(function () {
                that.blocks.activeBlock = that.blocks.blockList.indexOf(that);
                that._triggerLongPress = true;
                that.blocks.triggerLongPress();
            }, LONGPRESSTIME);

            // Always show the trash when there is a block selected,
            trashcan.show();

            // Raise entire stack to the top.
            that.blocks.raiseStackToTop(thisBlock);

            // And possibly the collapse button.
            if (that.collapseContainer != null) {
                that.blocks.stage.setChildIndex(that.collapseContainer, that.blocks.stage.children.length - 1);
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
                if (!that.blocks.logo.runningLilypond) {
                    document.body.style.cursor = 'default';
                }

                if (!that.blocks.getLongPressStatus()) {
                    that._mouseoutCallback(event, moved, haveClick, false);
                }

                that.blocks.unhighlight(thisBlock, true);
                that.blocks.activeBlock = null;

                moved = false;
            });

            that.container.on('pressup', function (event) {
                if (!that.blocks.getLongPressStatus()) {
                    that._mouseoutCallback(event, moved, haveClick, true);
                }

                that.blocks.unhighlight(thisBlock, true);
                that.blocks.activeBlock = null;

                moved = false;
            });

            that.container.on('pressmove', function (event) {
                // FIXME: More voodoo
                event.nativeEvent.preventDefault();

                // Don't allow silence block to be dragged out of a note.
                if (that.name === 'rest2') {
                    return;
                }

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

                if (that.blocks.longPressTimeout != null) {
                    clearTimeout(that.blocks.longPressTimeout);
                    that.blocks.longPressTimeout = null;
                    that.blocks.clearLongPress();
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
                    var z = that.container.children.length - 1;
                    that.container.setChildIndex(that.text, z);
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
            });
        });

        this.container.on('mouseout', function (event) {
            if (!that.blocks.getLongPressStatus()) {
                that._mouseoutCallback(event, moved, haveClick, false);
            } else {
                clearTimeout(that.blocks.longPressTimeout);
                that.blocks.longPressTimeout = null;
                that.blocks.clearLongPress();
            }

            that.blocks.unhighlight(thisBlock, true);
            that.blocks.activeBlock = null;

            moved = false;
        });

        this.container.on('pressup', function (event) {
            if (!that.blocks.getLongPressStatus()) {
                that._mouseoutCallback(event, moved, haveClick, false);
            } else {
                clearTimeout(that.blocks.longPressTimeout);
                that.blocks.longPressTimeout = null;
                that.blocks.clearLongPress();
            }

            that.blocks.unhighlight(thisBlock, true);
            that.blocks.activeBlock = null;

            moved = false;
        });
    };

    this._mouseoutCallback = function (event, moved, haveClick, hideDOM) {
        var thisBlock = this.blocks.blockList.indexOf(this);
        if (!this.blocks.logo.runningLilypond) {
            document.body.style.cursor = 'default';
        }

        // Always hide the trash when there is no block selected.
        trashcan.hide();

        if (this.blocks.longPressTimeout != null) {
            clearTimeout(this.blocks.longPressTimeout);
            this.blocks.longPressTimeout = null;
            this.blocks.clearLongPress();
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
            if ((event.stageX / this.blocks.getStageScale() < this.container.x || event.stageX / this.blocks.getStageScale() > this.container.x + this.width || event.stageY < this.container.y || event.stageY > this.container.y + this.hitHeight)) {
                // There are lots of special cases where we want to
                // use piemenus. Make sure this is not one of them.
                if (!this._usePiemenu()) {
                    this._labelChanged(true);
                    hideDOMLabel();
                }

                this.blocks.unhighlight(null);
                this.blocks.refreshCanvas();
            }

            this.blocks.activeBlock = null;
        }
    };

    this._usePiemenu = function () {
        // Check on all the special cases were we want to use a pie menu.

        // Special pie menus
        if (PIEMENUS.indexOf(this.name) !== -1) {
            return true;
        }

        // Numeric pie menus
        var blk = this.blocks.blockList.indexOf(this);

        if (this.blocks.octaveNumber(blk)) {
            return true;
        }

        if (this.blocks.noteValueNumber(blk, 2)) {
            return true;
        }

        if (this.blocks.noteValueNumber(blk, 1)) {
            return true;
        }

        if (this.blocks.octaveModifierNumber(blk)) {
            return true;
        }

        if (this.blocks.intervalModifierNumber(blk)) {
            return true;
        }

        if (this._usePieNumberC3()) {
            return true;
        }

        if (this._usePieNumberC2()) {
            return true;
        }

        return this._usePieNumberC1();
    };

    this._usePieNumberC1 = function () {
        // Return true if this number block plugs into Connection 1 of
        // a block that uses a pie menu. Add block names to the list
        // below and the switch statement in the _changeLabel
        // function.
        var cblk = this.connections[0];

        if (cblk === null) {
            return false;
        }

        if (['steppitch', 'pitchnumber', 'meter', 'register', 'scaledegree', 'rhythmicdot2', 'crescendo', 'decrescendo', 'harmonic2', 'interval', 'setscalartransposition', 'semitoneinterval', 'settransposition', 'setnotevolume', 'articulation', 'vibrato', 'dis', 'neighbor', 'neighbor2', 'tremolo', 'chorus', 'phaser', 'amsynth', 'fmsynth', 'duosynth', 'rhythm2', 'stuplet', 'duplicatenotes', 'setcolor', 'setshade', 'setgrey', 'sethue', 'setpensize', 'settranslucency'].indexOf(this.blocks.blockList[this.connections[0]].name) === -1) {
            return false;
        }

        var blk = this.blocks.blockList.indexOf(this);
        if (this.blocks.blockList[cblk].connections[1] === blk) {
            return true;
        }

        return false;
    };

    this._usePieNumberC2 = function () {
        // Return true if this number block plugs into Connection 2 of
        // a block that uses a pie menu. Add block names to the list
        // below and the switch statement in the _changeLabel
        // function.
        var cblk = this.connections[0];

        if (cblk === null) {
            return false;
        }

        if (['setsynthvolume', 'tremolo', 'chorus', 'phaser', 'duosynth'].indexOf(this.blocks.blockList[cblk].name) === -1) {
            return false;
        }

        var blk = this.blocks.blockList.indexOf(this);
        if (this.blocks.blockList[cblk].connections[2] === blk) {
            return true;
        }

        return false;
    };

    this._usePieNumberC3 = function () {
        // Return true if this number block plugs into Connection 3 of
        // a block that uses a pie menu. Add block names to the list
        // below and the switch statement in the _changeLabel
        // function.
        var cblk = this.connections[0];

        if (cblk === null) {
            return false;
        }

        if (['chorus'].indexOf(this.blocks.blockList[cblk].name) === -1) {
            return false;
        }

        var blk = this.blocks.blockList.indexOf(this);
        if (this.blocks.blockList[cblk].connections[3] === blk) {
            return true;
        }

        return false;
    };

    this._ensureDecorationOnTop = function () {
        // Find the turtle decoration and move it to the top.
        for (var child = 0; child < this.container.children.length; child++) {
            if (this.container.children[child].name === 'decoration') {
                // Drum block in collapsed state is less wide.
                // Deprecated
                var dx = 0;
                if (this.name === 'drum' && this.collapsed) {
                    var dx = 25 * this.protoblock.scale / 2;
                }

                for (var turtle = 0; turtle < this.blocks.turtles.turtleList.length; turtle++) {
                    if (this.blocks.turtles.turtleList[turtle].startBlock === this) {
                        this.blocks.turtles.turtleList[turtle].decorationBitmap.x = this.width - dx - 30 * this.protoblock.scale / 2;
                        break;
                    }
                }

                this.container.setChildIndex(this.container.children[child], this.container.children.length - 1);
                break;
            }
        }

        this.container.setChildIndex(this.bitmap, 0);
        this.container.setChildIndex(this.highlightBitmap, 0);
        this.updateCache();
    };

    this._changeLabel = function () {
        var that = this;
        var x = this.container.x;
        var y = this.container.y;

        var canvasLeft = this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        var canvasTop = this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        var selectorWidth = 150;

        var movedStage = false;
        if (!window.hasMouse && this.blocks.stage.y + y > 75) {
            movedStage = true;
            var fromY = this.blocks.stage.y;
            this.blocks.stage.y = -y + 75;
        }

        // A place in the DOM to put modifiable labels (textareas).
        if (this.label != null) {
            var labelValue = this.label.value
        } else {
            var labelValue = this.value;
        }

        var labelElem = docById('labelDiv');

        if (this.name === 'text') {
            labelElem.innerHTML = '<input id="textLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="text" type="text" value="' + labelValue + '" />';
            labelElem.classList.add('hasKeyboard');
            this.label = docById('textLabel');
        } else if (this.name === 'solfege') {
            var obj = splitSolfege(this.value);

            // solfnotes_ is used in the interface for internationalization.
            //.TRANS: the note names must be separated by single spaces
            var solfnotes_ = _('ti la sol fa mi re do').split(' ');

            if (this.piemenuOKtoLaunch()) {
                this._piemenuPitches(solfnotes_, SOLFNOTES, SOLFATTRS, obj[0], obj[1]);
            }
        } else if (this.name === 'customNote') {
            if (!this.blocks.logo.customTemperamentDefined) {
                // If custom temperament is not defined by user, 
                // then custom temperament is supposed to be equal temperament.
                var obj = splitSolfege(this.value);
                var solfnotes_ = _('ti la sol fa mi re do').split(' ');

                if (this.piemenuOKtoLaunch()) {
                    this._piemenuPitches(solfnotes_, SOLFNOTES, SOLFATTRS, obj[0], obj[1]);
                }
            } else {
                if (this.value != null) {
                    var selectedNote = this.value;
                } else {
                    var selectedNote = TEMPERAMENT['custom']['0'][1];
                }

                var noteLabels = [];
                var noteValues = [];
                for (var pitchNumber in TEMPERAMENT['custom']) {
                    if (pitchNumber !== 'pitchNumber') {
                        noteLabels.push(TEMPERAMENT['custom'][pitchNumber][1]);
                        noteValues.push(TEMPERAMENT['custom'][pitchNumber][1]);
                    }   
                }
                this._piemenuPitches(noteLabels, noteValues, '', selectednote, '', true);
            }
        } else if (this.name === 'eastindiansolfege') {
            var obj = splitSolfege(this.value);
            var selectednote = obj[0];
            var selectedattr = obj[1];

            if (this.piemenuOKtoLaunch()) {
                this._piemenuPitches(EASTINDIANSOLFNOTES, SOLFNOTES, SOLFATTRS, obj[0], obj[1]);
            }
        } else if (this.name === 'notename') {
            const NOTENOTES = ['B', 'A', 'G', 'F', 'E', 'D', 'C'];
            if (this.value != null) {
                var selectednote = this.value[0];
                if (this.value.length === 1) {
                    var selectedattr = '♮';
                } else if (this.value.length === 2) {
                    var selectedattr = this.value[1];
                } else {
                    var selectedattr = this.value[1] + this.value[2];
                }
            } else {
                var selectednote = 'G';
                var selectedattr = '♮'
            }

            if (selectedattr === '') {
                selectedattr = '♮';
            }

            if (this.piemenuOKtoLaunch()) {
                this._piemenuPitches(NOTENOTES, NOTENOTES, SOLFATTRS, selectednote, selectedattr);
            }
        } else if (this.name === 'modename') {
            if (this.value != null) {
                var selectedmode = this.value;
            } else {
                var selectedmode = DEFAULTMODE;
            }

            this._piemenuModes(selectedmode);
        } else if (this.name === 'accidentalname') {
            if (this.value != null) {
                var selectedaccidental = this.value;
            } else {
                var selectedaccidental = DEFAULTACCIDENTAL;
            }

            if (this.piemenuOKtoLaunch()) {
                this._piemenuAccidentals(ACCIDENTALLABELS, ACCIDENTALNAMES, selectedaccidental);
            }
            // labelElem.innerHTML = '';
            // this.label = docById('accidentalnameLabel');
        } else if (this.name === 'intervalname') {
            if (this.value != null) {
                var selectedinterval = this.value;
            } else {
                var selectedinterval = DEFAULTINTERVAL;
            }

            if (this.piemenuOKtoLaunch()) {
                this._piemenuIntervals(selectedinterval);
            }
        } else if (this.name === 'invertmode') {
            if (this.value != null) {
                var selectedinvert = this.value;
            } else {
                var selectedinvert = DEFAULTINVERT;
            }

            var invertLabels = [];
            var invertValues = [];

            for (var i = 0; i < INVERTMODES.length; i++) {
                invertLabels.push(_(INVERTMODES[i][1]));
                invertValues.push(INVERTMODES[i][1]);
            }

            if (this.piemenuOKtoLaunch()) {
                this._piemenuBasic(invertLabels, invertValues, selectedinvert);
            }
        } else if (this.name === 'drumname') {
            if (this.value != null) {
                var selecteddrum = this.value;
            } else {
                var selecteddrum = DEFAULTDRUM;
            }

            var drumLabels = [];
            var drumValues = [];            
            var categories = [];
            var categoriesList = [];
            for (var i = 0; i < DRUMNAMES.length; i++) {
                var label = _(DRUMNAMES[i][1]);
                if (getTextWidth(label, 'bold 48pt Sans') > 400) {
                    drumLabels.push(label.substr(0, 8) + '...');
                } else {
                    drumLabels.push(label);
                }

                drumValues.push(DRUMNAMES[i][1]);

                if (categoriesList.indexOf(DRUMNAMES[i][4]) === -1) {
                    categoriesList.push(DRUMNAMES[i][4]);
                }

                categories.push(categoriesList.indexOf(DRUMNAMES[i][4]));
            }

            this._piemenuVoices(drumLabels, drumValues, categories, selecteddrum);
        } else if (this.name === 'filtertype') {
            if (this.value != null) {
                var selectedtype = this.value;
            } else {
                var selectedtype = DEFAULTFILTERTYPE;
            }

            var filterLabels = [];
            var filterValues = [];
            for (var i = 0; i < FILTERTYPES.length; i++) {
                filterLabels.push(_(FILTERTYPES[i][0]));
                filterValues.push(FILTERTYPES[i][1]);
            }

            this._piemenuBasic(filterLabels, filterValues, selectedtype, ['#3ea4a3', '#60bfbc', '#1d8989', '#60bfbc', '#1d8989']);
        } else if (this.name === 'oscillatortype') {
            if (this.value != null) {
                var selectedtype = this.value;
            } else {
                var selectedtype = DEFAULTOSCILLATORTYPE;
            }

            var oscLabels = [];
            var oscValues = [];
            for (var i = 0; i < OSCTYPES.length; i++) {
                oscLabels.push(_(OSCTYPES[i][1]));
                oscValues.push(OSCTYPES[i][1]);
            }

            this._piemenuBasic(oscLabels, oscValues, selectedtype, ['#3ea4a3', '#60bfbc', '#1d8989', '#60bfbc', '#1d8989']);
        } else if (this.name === 'voicename') {
            if (this.value != null) {
                var selectedvoice = this.value;
            } else {
                var selectedvoice = DEFAULTVOICE;
            }

            console.log(this.value + ' ' + DEFAULTVOICE + ' ' + selectedvoice);

            var voiceLabels = [];
            var voiceValues = [];            
            var categories = [];
            var categoriesList = [];
            for (var i = 0; i < VOICENAMES.length; i++) {
                var label = _(VOICENAMES[i][1]);
                if (getTextWidth(label, 'bold 48pt Sans') > 400) {
                    voiceLabels.push(label.substr(0, 8) + '...');
                } else {
                    voiceLabels.push(label);
                }

                voiceValues.push(VOICENAMES[i][1]);

                if (categoriesList.indexOf(VOICENAMES[i][3]) === -1) {
                    categoriesList.push(VOICENAMES[i][3]);
                }

                categories.push(categoriesList.indexOf(VOICENAMES[i][3]));
            }

            this._piemenuVoices(voiceLabels, voiceValues, categories, selectedvoice);
        } else if (this.name === 'noisename') {
            if (this.value != null) {
                var selectednoisee = this.value;
            } else {
                var selectednoise = DEFAULTNOISE;
            }

            console.log(this.value + ' ' + DEFAULTNOISE + ' ' + selectednoise);

            var noiseLabels = [];
            var noiseValues = [];            
            var categories = [];
            var categoriesList = [];
            for (var i = 0; i < NOISENAMES.length; i++) {
                var label = NOISENAMES[i][0];
                if (getTextWidth(label, 'bold 48pt Sans') > 600) {
                    noiseLabels.push(label.substr(0, 16) + '...');
                } else {
                    noiseLabels.push(label);
                }

                noiseValues.push(NOISENAMES[i][1]);

                if (categoriesList.indexOf(NOISENAMES[i][3]) === -1) {
                    categoriesList.push(NOISENAMES[i][3]);
                }

                categories.push(categoriesList.indexOf(NOISENAMES[i][3]));
            }

            this._piemenuVoices(noiseLabels, noiseValues, categories, selectednoise, 90);
        } else if (this.name === 'temperamentname') {
            if (this.value != null) {
                var selectedTemperament = this.value;
            } else {
                var selectedTemperament = DEFAULTTEMPERAMENT;
            }

            var temperamentLabels = [];
            var temperamentValues = [];
            for (var i = 0; i < TEMPERAMENTS.length; i++) {
                // Skip custom temperament in Beginner Mode.
                if (beginnerMode && TEMPERAMENTS[i][1] === 'custom') {
                    continue;
                }

                temperamentLabels.push(TEMPERAMENTS[i][0]);
                temperamentValues.push(TEMPERAMENTS[i][1]);
            }

            this._piemenuBasic(temperamentLabels, temperamentValues, selectedTemperament, ['#3ea4a3', '#60bfbc', '#1d8989', '#60bfbc', '#1d8989']);
        } else if (this.name === 'boolean') {
            if (this.value != null) {
                var selectedvalue = this.value;
            } else {
                var selectedvalue = true;
            }

            var booleanLabels = [_('true'), _('false')];
            var booleanValues = [true, false];

            this._piemenuBoolean(booleanLabels, booleanValues, selectedvalue);
        } else {
            // If the number block is connected to a pitch block, then
            // use the pie menu for octaves. Other special cases as well.
            var blk = this.blocks.blockList.indexOf(this);
            if (this.blocks.octaveNumber(blk)) {
                this._piemenuNumber([8, 7, 6, 5, 4, 3, 2, 1], this.value);
            } else if (this.blocks.noteValueNumber(blk, 2)) {
                var cblk = this.connections[0];
                if (cblk !== null) {
                    cblk = this.blocks.blockList[cblk].connections[0];
                    if (cblk !== null && ['rhythm2', 'stuplet'].indexOf(this.blocks.blockList[cblk].name) !== -1) {
                        this._piemenuNumber([2, 4, 8, 16], this.value);
                    } else {
                        this._piemenuNoteValue(this.value);
                    }
                } else {
                    this._piemenuNoteValue(this.value);
                }
            } else if (this.blocks.noteValueNumber(blk, 1)) {
                var d = this.blocks.noteValueValue(blk);
                if (d === 1) {
                    var values = [8, 7, 6, 5, 4, 3, 2, 1];
                } else {
                    var values = [];
                    for (var i = 0; i < Math.min(d, 16); i++) {
                        values.push(i + 1);
                    }
                }

                var cblk = this.connections[0];
                if (cblk !== null) {
                    cblk = this.blocks.blockList[cblk].connections[0];
                    if (cblk !== null && ['neighbor', 'neighbor2', 'rhythm2', 'stuplet'].indexOf(this.blocks.blockList[cblk].name) !== -1) {
                        var values = [3, 2, 1];
                    }
                }

                this._piemenuNumber(values, this.value);
            } else if (this.blocks.octaveModifierNumber(blk)) {
                this._piemenuNumber([-2, -1, 0, 1, 2], this.value);
            } else if (this.blocks.intervalModifierNumber(blk)) {
                var name = this.blocks.blockList[this.blocks.blockList[this.connections[0]].connections[0]].name;
                switch(name) {
                case 'interval':
                case 'setscalartransposition':
                    this._piemenuNumber([-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7], this.value);
                    break;
                case 'semitoneinterval':
                case 'settransposition':
                    this._piemenuNumber([-12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], this.value);
                    break;
                }
            } else if (this._usePieNumberC3()) {
                switch (this.blocks.blockList[this.connections[0]].name) {
                case 'chorus':
                    this._piemenuNumber([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], this.value);
                    break;
                }
            } else if (this._usePieNumberC2()) {
                switch (this.blocks.blockList[this.connections[0]].name) {
                case 'duosynth':
                    this._piemenuNumber([10, 20, 30, 40, 50, 60, 70, 80, 90, 100], this.value);
                    break;
                case 'setsynthvolume':
                case 'tremolo':
                    this._piemenuNumber([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], this.value);
                    break;
                case 'chorus':
                    this._piemenuNumber([2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10], this.value);
                    break;
                case 'phaser':
                    this._piemenuNumber([1, 2, 3], this.value);
                    break;
                }
            } else if (this._usePieNumberC1()) {
                switch (this.blocks.blockList[this.connections[0]].name) {
                case 'setpensize':
                    this._piemenuNumber([1, 2, 3, 5, 10, 15, 25, 50, 100], this.value);
                    break;
                case 'setcolor':
                case 'sethue':
                    this._piemenuColor([0, 10, 20, 30, 40, 50, 60, 70, 80, 90], this.value, this.blocks.blockList[this.connections[0]].name);
                    break;
                case 'setshade':
                case 'settranslucency':
                case 'setgrey':
                    this._piemenuColor([100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0], this.value, this.blocks.blockList[this.connections[0]].name);
                    break;
                case 'duplicatenotes':
                    this._piemenuNumber([2, 3, 4, 5, 6, 7, 8], this.value);
                    break;
                case 'rhythm2':
                    this._piemenuNumber([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], this.value);
                    break;
                case 'stuplet':
                    this._piemenuNumber([3, 5, 7, 11], this.value);
                    break;
                case 'amsynth':  // harmocity
                    this._piemenuNumber([1, 2], this.value);
                    break;
                case 'fmsynth':  // modulation index
                    this._piemenuNumber([1, 5, 10, 15, 20, 25], this.value);
                    break;
                case 'chorus':
                    this._piemenuNumber([0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5], this.value);
                    break;
                case 'phaser':
                case 'tremolo':
                    this._piemenuNumber([0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 10, 20], this.value);
                    break;
                case 'rhythmicdot2':
                    this._piemenuNumber([1, 2, 3], this.value);
                    break;
                case 'register':
                    this._piemenuNumber([-3, -2, -1, 0, 1, 2, 3], this.value);
                    break;
                case 'scaledegree':
                    this._piemenuScaleDegree([1, 2, 3, 4, 5, 6, 7], this.value);
                    break;
                case 'meter':
                    this._piemenuNumber([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], this.value);
                    break;
                case 'pitchnumber':
                    for (var i = 0; i < this.blocks.blockList.length; i++) {
                        if (this.blocks.blockList[i].name == 'settemperament' && this.blocks.blockList[i].connections[0] !== null) {
                            var index = this.blocks.blockList[i].connections[1];
                            var temperament = this.blocks.blockList[index].value;
                        }
                    }
                    if (temperament === undefined) {
                        temperament = 'equal';
                    }
                    if (temperament === 'equal') {
                        this._piemenuNumber([-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], this.value);
                    } else {
                        var pitchNumbers = [];
                        for (var i = 0; i < TEMPERAMENT[temperament]['pitchNumber']; i++) {
                            pitchNumbers.push(i);
                        }
                        this._piemenuNumber(pitchNumbers, this.value);
                    }
                    break;
                case 'neighbor':
                case 'neighbor2':
                case 'steppitch':
                case 'interval':
                case 'setscalartransposition':
                    this._piemenuNumber([-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7], this.value);
                    break;
                case 'decrescendo':
                case 'crescendo':
                    this._piemenuNumber([1, 2, 3, 4, 5, 10, 15, 20], this.value);
                    break;
                case 'harmonic2':
                    this._piemenuNumber([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], this.value);
                    break;
                case 'vibrato':
                    this._piemenuNumber([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], this.value);
                    break;
                case 'semitoneinterval':
                case 'settransposition':
                    this._piemenuNumber([-12, -11, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], this.value);
                    break;
                case 'setnotevolume':
                    this._piemenuNumber([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], this.value);
                    break;
                case 'dis':
                case 'duosynth':
                    this._piemenuNumber([10, 20, 30, 40, 50, 60, 70, 80, 90, 100], this.value);
                    break;
                case 'articulation':
                    this._piemenuNumber([-25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25], this.value);
                    break;
                }
            } else {
                labelElem.innerHTML = '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' + labelValue + '" />';
                labelElem.classList.add('hasKeyboard');
                this.label = docById('numberLabel');
            }
        }

        var blk = this.blocks.blockList.indexOf(this);
        if (!this._usePiemenu()) {
            var focused = false;

            var __blur = function (event) {
                // Not sure why the change in the input is not available
                // immediately in FireFox. We need a workaround if hardware
                // acceleration is enabled.
                if (!focused) {
                    return;
                }

                that._labelChanged(true, true);

                event.preventDefault();

                labelElem.classList.remove('hasKeyboard');

                window.scroll(0, 0);
                that.label.removeEventListener('keypress', __keypress);

                if (movedStage) {
                    that.blocks.stage.y = fromY;
                    that.blocks.updateStage();
                }
            };


            var __input = function (event) {
                that._labelChanged(false);
            };

            if (this.name === 'text' || this.name === 'number') {
                this.label.addEventListener('blur', __blur);
                this.label.addEventListener('input', __input);
            }

            var __keypress = function (event) {
                if ([13, 10, 9].indexOf(event.keyCode) !== -1) {
                    __blur(event);
                }
            };

            this.label.addEventListener('keypress', __keypress);

            this.label.addEventListener('change', function () {
                that._labelChanged(true, true);
            });

            this.label.style.left = Math.round((x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft) + 'px';
            this.label.style.top = Math.round((y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop) + 'px';
            this.label.style.width = Math.round(selectorWidth * this.blocks.blockScale) * this.protoblock.scale / 2 + 'px';

            this.label.style.fontSize = Math.round(20 * this.blocks.blockScale * this.protoblock.scale / 2) + 'px';
            this.label.style.display = '';
            this.label.focus();
            if (this.labelattr != null) {
                this.labelattr.style.display = '';
            }

            // Firefox fix
            setTimeout(function () {
                that.label.style.display = '';
                that.label.focus();
                focused = true;
            }, 100);
        }
    };

    this.piemenuOKtoLaunch = function () {
        if (this._piemenuExitTime === null) {
            return true;
        }

        var d = new Date();
        var now = d.getTime();
        if (now - this._piemenuExitTime > 200) {
            return true;
        } else {
            return false;
        }
    };

    this._noteValueNumber = function (c) {
        // Is this a number block being used as a note value
        // denominator argument?
        var dblk = this.connections[0];
        // Are we connected to a divide block?
        if (this.name === 'number' && dblk !== null && this.blocks.blockList[dblk].name === 'divide') {
            // Are we the denominator (c == 2) or numerator (c == 1)?
            if (this.blocks.blockList[dblk].connections[c] === this.blocks.blockList.indexOf(this)) {
                // Is the divide block connected to a note value block?
                cblk = this.blocks.blockList[dblk].connections[0];
                if (cblk !== null) {
                    // Is it the first or second arg?
                    switch (this.blocks.blockList[cblk].name) {
                    case 'newnote':
                    case 'pickup':
                    case 'tuplet4':
                    case 'newstaccato':
                    case 'newslur':
                    case 'elapsednotes2':
                        if (this.blocks.blockList[cblk].connections[1] === dblk) {
                            return true;
                        } else {
                            return false;
                        }
                        break;
                    case 'meter':
                    case 'setbpm2':
                    case 'setmasterbpm2':
                    case 'stuplet':
                    case 'rhythm2':
                    case 'newswing2':
                    case 'vibrato':
                    case 'neighbor':
                    case 'neighbor2':
                        if (this.blocks.blockList[cblk].connections[2] === dblk) {
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

    this._noteValueValue = function () {
        // Return the number block value being used as a note value
        // denominator argument.
        var dblk = this.connections[0];
        // We are connected to a divide block.
        // Is the divide block connected to a note value block?
        cblk = this.blocks.blockList[dblk].connections[0];
        if (cblk !== null) {
            // Is it the first or second arg?
            switch (this.blocks.blockList[cblk].name) {
            case 'newnote':
            case 'pickup':
            case 'tuplet4':
            case 'newstaccato':
            case 'newslur':
            case 'elapsednotes2':
                if (this.blocks.blockList[cblk].connections[1] === dblk) {
                    cblk = this.blocks.blockList[dblk].connections[2];
                    return this.blocks.blockList[cblk].value;
                } else {
                    return 1;
                }
                break;
            case 'meter':
            case 'setbpm2':
            case 'setmasterbpm2':
            case 'stuplet':
            case 'rhythm2':
            case 'newswing2':
            case 'vibrato':
            case 'neighbor':
            case 'neighbor2':
                if (this.blocks.blockList[cblk].connections[2] === dblk) {
                    if (this.blocks.blockList[cblk].connections[1] === dblk) {
                        cblk = this.blocks.blockList[dblk].connections[2];
                        return this.blocks.blockList[cblk].value;
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

    this._octaveNumber = function () {
        // Is this a number block being used as an octave argument?
        return (this.name === 'number' && this.connections[0] !== null && ['pitch', 'setpitchnumberoffset', 'invert1', 'tofrequency', 'scaledegree'].indexOf(this.blocks.blockList[this.connections[0]].name) !== -1 && this.blocks.blockList[this.connections[0]].connections[2] === this.blocks.blockList.indexOf(this));
    };

    this._piemenuPitches = function (noteLabels, noteValues, accidentals, note, accidental, custom) {
        // wheelNav pie menu for pitch selection
        if (this.blocks.stageClick) {
            return;
        }

        if (custom === undefined) {
            custom = false;
        }
        // Some blocks have both pitch and octave, so we can modify
        // both at once.
        var hasOctaveWheel = (this.connections[0] !== null && ['pitch', 'setpitchnumberoffset', 'invert1', 'tofrequency'].indexOf(this.blocks.blockList[this.connections[0]].name) !== -1);

        // If we are attached to a sset key block, we want to order
        // pitch by fifths.
        if (this.connections[0] !== null && ['setkey', 'setkey2'].indexOf(this.blocks.blockList[this.connections[0]].name) !== -1) {
            noteLabels = ['C', 'G', 'D', 'A', 'E', 'B', 'F'];
            noteValues = ['C', 'G', 'D', 'A', 'E', 'B', 'F'];
        }

        docById('wheelDiv').style.display = '';

        // the pitch selector
        this._pitchWheel = new wheelnav('wheelDiv', null, 600, 600);

        if (!custom) {
            // the accidental selector
            this._accidentalsWheel = new wheelnav('_accidentalsWheel', this._pitchWheel.raphael);
        }
        // the octave selector
        if (hasOctaveWheel) {
            this._octavesWheel = new wheelnav('_octavesWheel', this._pitchWheel.raphael);
        }

        // exit button
        this._exitWheel = new wheelnav('_exitWheel', this._pitchWheel.raphael);

        wheelnav.cssMode = true;

        this._pitchWheel.keynavigateEnabled = true;

        this._pitchWheel.colors = ['#77c428', '#93e042', '#77c428', '#5ba900', '#77c428', '#93e042', '#adfd55'];
        this._pitchWheel.slicePathFunction = slicePath().DonutSlice;
        this._pitchWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._pitchWheel.slicePathCustom.minRadiusPercent = 0.2;
        if (!custom) {
            this._pitchWheel.slicePathCustom.maxRadiusPercent = 0.5;
        } else {
            this._pitchWheel.slicePathCustom.maxRadiusPercent = 0.75;
        }
        
        this._pitchWheel.sliceSelectedPathCustom = this._pitchWheel.slicePathCustom;
        this._pitchWheel.sliceInitPathCustom = this._pitchWheel.slicePathCustom;

        this._pitchWheel.animatetime = 300;
        this._pitchWheel.createWheel(noteLabels);

        this._exitWheel.colors = ['#808080', '#c0c0c0'];
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(['x', ' ']);

        if (!custom) {
            this._accidentalsWheel.colors = ['#77c428', '#93e042', '#77c428', '#5ba900', '#77c428'];
            this._accidentalsWheel.slicePathFunction = slicePath().DonutSlice;
            this._accidentalsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._accidentalsWheel.slicePathCustom.minRadiusPercent = 0.50;
            this._accidentalsWheel.slicePathCustom.maxRadiusPercent = 0.75;
            this._accidentalsWheel.sliceSelectedPathCustom = this._accidentalsWheel.slicePathCustom;
            this._accidentalsWheel.sliceInitPathCustom = this._accidentalsWheel.slicePathCustom;

            var accidentalLabels = [];
            for (var i = 0; i < accidentals.length; i++) {
                accidentalLabels.push(accidentals[i]);
            }

            for (var i = 0; i < 9; i++) {
                accidentalLabels.push(null);
                this._accidentalsWheel.colors.push('#c0c0c0');
            }

            this._accidentalsWheel.animatetime = 300;
            this._accidentalsWheel.createWheel(accidentalLabels);
            this._accidentalsWheel.setTooltips([_('double sharp'), _('sharp'), _('natural'), _('flat'), _('double flat')]);
        }
        if (hasOctaveWheel) {
            this._octavesWheel.colors = ['#ffb2bc', '#ffccd6', '#ffb2bc', '#ffccd6', '#ffb2bc', '#ffccd6', '#ffb2bc', '#ffccd6', '#c0c0c0', '#c0c0c0', '#c0c0c0', '#c0c0c0', '#c0c0c0', '#c0c0c0'];
            this._octavesWheel.slicePathFunction = slicePath().DonutSlice;
            this._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._octavesWheel.slicePathCustom.minRadiusPercent = 0.75;
            this._octavesWheel.slicePathCustom.maxRadiusPercent = 0.95;
            this._octavesWheel.sliceSelectedPathCustom = this._octavesWheel.slicePathCustom;
            this._octavesWheel.sliceInitPathCustom = this._octavesWheel.slicePathCustom;
            var octaveLabels = ['8', '7', '6', '5', '4', '3', '2', '1', null, null, null, null, null, null];
            this._octavesWheel.animatetime = 300;
            this._octavesWheel.createWheel(octaveLabels);
        }

        // Position the widget over the note block.
        var x = this.container.x;
        var y = this.container.y;

        var canvasLeft = this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        var canvasTop = this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById('wheelDiv').style.position = 'absolute';
        docById('wheelDiv').style.height = '300px';
        docById('wheelDiv').style.width = '300px';
        docById('wheelDiv').style.left = Math.min(this.blocks.turtles._canvas.width - 300, Math.max(0, Math.round((x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft) - 200)) + 'px';
        docById('wheelDiv').style.top = Math.min(this.blocks.turtles._canvas.height - 350, Math.max(0, Math.round((y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop) - 200)) + 'px';
        
        // Navigate to a the current note value.
        var i = noteValues.indexOf(note);
        if (i === -1) {
            i = 4;
        }

        this._pitchWheel.navigateWheel(i);
        if (!custom) {
            // Navigate to a the current accidental value.
            if (accidental === '') {
                this._accidentalsWheel.navigateWheel(2);
            } else {
                switch(accidental) {
                case DOUBLEFLAT:
                    this._accidentalsWheel.navigateWheel(4);
                    break;
                case FLAT:
                    this._accidentalsWheel.navigateWheel(3);
                    break;
                case NATURAL:
                    this._accidentalsWheel.navigateWheel(2);
                    break;
                case SHARP:
                    this._accidentalsWheel.navigateWheel(1);
                    break;
                case DOUBLESHARP:
                    this._accidentalsWheel.navigateWheel(0);
                    break;
                default:
                    this._accidentalsWheel.navigateWheel(2);
                    break;
                }
            }
        }

        if (hasOctaveWheel) {
            // Use the octave associated with this block, if available.
            var pitchOctave = this.blocks.findPitchOctave(this.connections[0]);

            // Navigate to current octave
            this._octavesWheel.navigateWheel(8 - pitchOctave);
        }

        // Set up event handlers
        var that = this;

        var __selectionChanged = function () {
            var label = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
            var i = noteLabels.indexOf(label);
            that.value = noteValues[i];
            if (!custom) {
                var attr = that._accidentalsWheel.navItems[that._accidentalsWheel.selectedNavItemIndex].title;
                if (attr !== '♮') {
                    label += attr;
                    that.value += attr;
                }
            }

            that.text.text = label;

            // Make sure text is on top.
            var z = that.container.children.length - 1;
            that.container.setChildIndex(that.text, z);
            that.updateCache();

            if (hasOctaveWheel) {
                // Set the octave of the pitch block if available
                var octave = Number(that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex].title);
                that.blocks.setPitchOctave(that.connections[0], octave);
            }
        };

        var __pitchPreview = function () {
            var label = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
            var i = noteLabels.indexOf(label);
            var note = noteValues[i];
            if (!custom) {
                var attr = that._accidentalsWheel.navItems[that._accidentalsWheel.selectedNavItemIndex].title;

                if (label === ' ') {
                    return;
                } else if (attr !== '♮') {
                    note += attr;
                }
            }

            if (hasOctaveWheel) {
                var octave = Number(that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex].title);
            } else {
                octave = 4;
            }

            // FIX ME: get key signature if available
            // FIX ME: get moveable if available
            var obj = getNote(note, octave, 0, 'C major', false, null, that.blocks.errorMsg, that.blocks.logo.synth.inTemperament);
            if (!custom) {
                obj[0] = obj[0].replace(SHARP, '#').replace(FLAT, 'b');
            }
            if (that.blocks.logo.instrumentNames[0] === undefined || that.blocks.logo.instrumentNames[0].indexOf('default') === -1) {
                if (that.blocks.logo.instrumentNames[0] === undefined) {
                    that.blocks.logo.instrumentNames[0] = [];
                }

                that.blocks.logo.instrumentNames[0].push('default');
                that.blocks.logo.synth.createDefaultSynth(0);
                that.blocks.logo.synth.loadSynth(0, 'default');
            }

            that.blocks.logo.synth.setMasterVolume(DEFAULTVOLUME);
            that.blocks.logo.setSynthVolume(0, 'default', DEFAULTVOLUME);
            that.blocks.logo.synth.trigger(0, [obj[0] + obj[1]], 1 / 8, 'default', null, null);

            __selectionChanged();
        };

        // Set up handlers for pitch preview.
        for (var i = 0; i < noteValues.length; i++) {
            this._pitchWheel.navItems[i].navigateFunction = __pitchPreview;
        }
        if (!custom) {
            for (var i = 0; i < accidentals.length; i++) {
                this._accidentalsWheel.navItems[i].navigateFunction = __pitchPreview;
            }
        }
        if (hasOctaveWheel) {
            for (var i = 0; i < 8; i++) {
                this._octavesWheel.navItems[i].navigateFunction = __pitchPreview;
            }
        }

        // Hide the widget when the exit button is clicked.
        this._exitWheel.navItems[0].navigateFunction = function () {
            var d = new Date();
            that._piemenuExitTime = d.getTime();
            docById('wheelDiv').style.display = 'none';
            that._pitchWheel.removeWheel();
            if (!custom) {
                that._accidentalsWheel.removeWheel();
            }
            that._exitWheel.removeWheel();
            if (hasOctaveWheel) {
                that._octavesWheel.removeWheel();
            }
        };
    };

    this._piemenuScaleDegree = function (noteValues, note) {
        // wheelNav pie menu for scale degree pitch selection

        if (this.blocks.stageClick) {
            return;
        }

        var noteLabels = [];
        for (var i = 0; i < noteValues.length; i++) {
            noteLabels.push(noteValues[i].toString());
        }

        docById('wheelDiv').style.display = '';

        this._pitchWheel = new wheelnav('wheelDiv', null, 600, 600);
        this._octavesWheel = new wheelnav('_octavesWheel', this._pitchWheel.raphael);
        this._exitWheel = new wheelnav('_exitWheel', this._pitchWheel.raphael);

        wheelnav.cssMode = true;

        this._pitchWheel.keynavigateEnabled = true;

        this._pitchWheel.colors = ['#77c428', '#93e042', '#77c428', '#5ba900', '#77c428', '#93e042', '#adfd55'];
        this._pitchWheel.slicePathFunction = slicePath().DonutSlice;
        this._pitchWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._pitchWheel.slicePathCustom.minRadiusPercent = 0.2;
        this._pitchWheel.slicePathCustom.maxRadiusPercent = 0.5;
        this._pitchWheel.sliceSelectedPathCustom = this._pitchWheel.slicePathCustom;
        this._pitchWheel.sliceInitPathCustom = this._pitchWheel.slicePathCustom;

        this._pitchWheel.animatetime = 300;
        this._pitchWheel.createWheel(noteLabels);

        this._exitWheel.colors = ['#808080', '#c0c0c0'];
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(['x', ' ']);

        this._octavesWheel.colors = ['#ffb2bc', '#ffccd6', '#ffb2bc', '#ffccd6', '#ffb2bc', '#ffccd6', '#ffb2bc', '#ffccd6', '#c0c0c0', '#c0c0c0', '#c0c0c0', '#c0c0c0', '#c0c0c0', '#c0c0c0'];
        this._octavesWheel.slicePathFunction = slicePath().DonutSlice;
        this._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._octavesWheel.slicePathCustom.minRadiusPercent = 0.75;
        this._octavesWheel.slicePathCustom.maxRadiusPercent = 0.95;
        this._octavesWheel.sliceSelectedPathCustom = this._octavesWheel.slicePathCustom;
        this._octavesWheel.sliceInitPathCustom = this._octavesWheel.slicePathCustom;
        var octaveLabels = ['8', '7', '6', '5', '4', '3', '2', '1', null, null, null, null, null, null];
        this._octavesWheel.animatetime = 300;
        this._octavesWheel.createWheel(octaveLabels);

        // Position the widget over the note block.
        var x = this.container.x;
        var y = this.container.y;

        var canvasLeft = this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        var canvasTop = this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById('wheelDiv').style.position = 'absolute';
        docById('wheelDiv').style.height = '300px';
        docById('wheelDiv').style.width = '300px';
        docById('wheelDiv').style.left = Math.min(this.blocks.turtles._canvas.width - 300, Math.max(0, Math.round((x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft) - 200)) + 'px';
        docById('wheelDiv').style.top = Math.min(this.blocks.turtles._canvas.height - 350, Math.max(0, Math.round((y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop) - 200)) + 'px';
        
        // Navigate to a the current note value.
        var i = noteValues.indexOf(note);
        if (i === -1) {
            i = 4;
        }

        this._pitchWheel.navigateWheel(i);

        // Use the octave associated with this block, if available.
        var pitchOctave = this.blocks.findPitchOctave(this.connections[0]);

        // Navigate to current octave
        this._octavesWheel.navigateWheel(8 - pitchOctave);

        // Set up event handlers
        var that = this;

        var __selectionChanged = function () {
            var label = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
            var i = noteLabels.indexOf(label);
            that.value = noteValues[i];
            that.text.text = label;

            // Make sure text is on top.
            var z = that.container.children.length - 1;
            that.container.setChildIndex(that.text, z);
            that.updateCache();

            // Set the octave of the pitch block if available
            var octave = Number(that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex].title);
            that.blocks.setPitchOctave(that.connections[0], octave);
        };

        var __pitchPreview = function () {
            var label = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
            var i = noteLabels.indexOf(label);
            var note = noteValues[i];
            var octave = Number(that._octavesWheel.navItems[that._octavesWheel.selectedNavItemIndex].title);

            // FIX ME: get key signature if available
            // FIX ME: get moveable if available

            var obj = getNote('C', octave, note, 'C major', false, null, that.blocks.errorMsg);
            obj[0] = obj[0].replace(SHARP, '#').replace(FLAT, 'b');

            if (that.blocks.logo.instrumentNames[0] === undefined || that.blocks.logo.instrumentNames[0].indexOf('default') === -1) {
                if (that.blocks.logo.instrumentNames[0] === undefined) {
                    that.blocks.logo.instrumentNames[0] = [];
                }

                that.blocks.logo.instrumentNames[0].push('default');
                that.blocks.logo.synth.createDefaultSynth(0);
                that.blocks.logo.synth.loadSynth(0, 'default');
            }

            that.blocks.logo.synth.setMasterVolume(DEFAULTVOLUME);
            that.blocks.logo.setSynthVolume(0, 'default', DEFAULTVOLUME);
            that.blocks.logo.synth.trigger(0, [obj[0] + obj[1]], 1 / 8, 'default', null, null);

            __selectionChanged();
        };

        // Set up handlers for pitch preview.
        for (var i = 0; i < noteValues.length; i++) {
            this._pitchWheel.navItems[i].navigateFunction = __pitchPreview;
        }

        for (var i = 0; i < 8; i++) {
            this._octavesWheel.navItems[i].navigateFunction = __pitchPreview;
        }

        // Hide the widget when the exit button is clicked.
        this._exitWheel.navItems[0].navigateFunction = function () {
            var d = new Date();
            that._piemenuExitTime = d.getTime();
            docById('wheelDiv').style.display = 'none';
            that._pitchWheel.removeWheel();
            that._exitWheel.removeWheel();
            that._octavesWheel.removeWheel();
        };
    };

    this._piemenuAccidentals = function (accidentalLabels, accidentalValues, accidental) {
        // wheelNav pie menu for accidental selection

        if (this.blocks.stageClick) {
            return;
        }

        docById('wheelDiv').style.display = '';

        // the accidental selector
        this._accidentalWheel = new wheelnav('wheelDiv', null, 600, 600);
        // exit button
        this._exitWheel = new wheelnav('_exitWheel', this._accidentalWheel.raphael);

        var labels = [];
        for (var i = 0; i < accidentalLabels.length; i++) {
            var obj = accidentalLabels[i].split(' ');
            labels.push(last(obj));
        }

        labels.push(null);

        wheelnav.cssMode = true;

        this._accidentalWheel.keynavigateEnabled = true;

        this._accidentalWheel.colors = ['#77c428', '#93e042', '#77c428', '#5ba900', '#93e042'];
        this._accidentalWheel.slicePathFunction = slicePath().DonutSlice;
        this._accidentalWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._accidentalWheel.slicePathCustom.minRadiusPercent = 0.2;
        this._accidentalWheel.slicePathCustom.maxRadiusPercent = 0.6;
        this._accidentalWheel.sliceSelectedPathCustom = this._accidentalWheel.slicePathCustom;
        this._accidentalWheel.sliceInitPathCustom = this._accidentalWheel.slicePathCustom;
        this._accidentalWheel.titleRotateAngle = 0;
        this._accidentalWheel.animatetime = 300;
        this._accidentalWheel.createWheel(labels);
        this._accidentalWheel.setTooltips(accidentalLabels)

        this._exitWheel.colors = ['#808080', '#c0c0c0'];
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(['x', ' ']);

        var that = this;

        var __selectionChanged = function () {
            var label = that._accidentalWheel.navItems[that._accidentalWheel.selectedNavItemIndex].title;
            var i = labels.indexOf(label);
            that.value = accidentalValues[i];
            that.text.text = accidentalLabels[i];

            // Make sure text is on top.
            var z = that.container.children.length - 1;
            that.container.setChildIndex(that.text, z);
            that.updateCache();
        };

        var __exitMenu = function () {
            var d = new Date();
            that._piemenuExitTime = d.getTime();
            docById('wheelDiv').style.display = 'none';
            that._accidentalWheel.removeWheel();
            that._exitWheel.removeWheel();
        };

        // Position the widget over the note block.
        var x = this.container.x;
        var y = this.container.y;

        var canvasLeft = this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        var canvasTop = this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById('wheelDiv').style.position = 'absolute';
        docById('wheelDiv').style.height = '300px';
        docById('wheelDiv').style.width = '300px';
        docById('wheelDiv').style.left = Math.min(this.blocks.turtles._canvas.width - 300, Math.max(0, Math.round((x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft) - 200)) + 'px';
        docById('wheelDiv').style.top = Math.min(this.blocks.turtles._canvas.height - 350, Math.max(0, Math.round((y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop) - 200)) + 'px';
        
        // Navigate to a the current accidental value.
        var i = accidentalValues.indexOf(accidental);
        if (i === -1) {
            i = 2;
        }

        this._accidentalWheel.navigateWheel(i);

        // Hide the widget when the selection is made.
        for (var i = 0; i < accidentalLabels.length; i++) {
            this._accidentalWheel.navItems[i].navigateFunction = function () {
                __selectionChanged();
                __exitMenu();
            };
        }

        // Or use the exit wheel...
        this._exitWheel.navItems[0].navigateFunction = function () {
                __exitMenu();
        };
    };

    this._piemenuNoteValue = function (noteValue) {
        // input form and  wheelNav pie menu for note value selection

        if (this.blocks.stageClick) {
            return;
        }

        docById('wheelDiv').style.display = '';

        // We want powers of two on the bottom, nearest the input box
        // as it is most common.
        const WHEELVALUES = [3, 2, 7, 5];
        var subWheelValues = {
            2: [1, 2, 4, 8, 16, 32],
            3: [1, 3, 6, 9, 12, 27],
            5: [1, 5, 10, 15, 20, 25],
            7: [1, 7, 14, 21, 28, 35],
        };

        var cblk = this.connections[0];
        if (cblk !== null) {
            cblk = this.blocks.blockList[cblk].connections[0];
            if (cblk !== null && ['neighbor', 'neighbor2'].indexOf(this.blocks.blockList[cblk].name) !== -1) {
                var subWheelValues = {
                    2: [8, 16, 32, 64],
                    3: [9, 12, 27, 54],
                    5: [10, 15, 20, 25],
                    7: [14, 21, 28, 35],
                };
            }
        }

        // the noteValue selector
        this._noteValueWheel = new wheelnav('wheelDiv', null, 600, 600);
        // exit button
        this._exitWheel = new wheelnav('_exitWheel', this._noteValueWheel.raphael);
        // submenu wheel
        this._tabsWheel = new wheelnav('_tabsWheel', this._noteValueWheel.raphael);

        var noteValueLabels = [];
        for (var i = 0; i < WHEELVALUES.length; i++) {
            noteValueLabels.push(WHEELVALUES[i].toString());
        }

        wheelnav.cssMode = true;

        this._noteValueWheel.keynavigateEnabled = true;

        this._noteValueWheel.colors = ['#ffb2bc', '#ffccd6'];
        this._noteValueWheel.slicePathFunction = slicePath().DonutSlice;
        this._noteValueWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._noteValueWheel.slicePathCustom.minRadiusPercent = 0.2;
        this._noteValueWheel.slicePathCustom.maxRadiusPercent = 0.6;
        this._noteValueWheel.sliceSelectedPathCustom = this._noteValueWheel.slicePathCustom;
        this._noteValueWheel.sliceInitPathCustom = this._noteValueWheel.slicePathCustom;
        this._noteValueWheel.animatetime = 300;
        this._noteValueWheel.clickModeRotate = false;
        this._noteValueWheel.createWheel(noteValueLabels);

        this._exitWheel.colors = ['#808080', '#c0c0c0'];
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(['x', ' ']);

        var tabsLabels = [];
        for (var i = 0; i < WHEELVALUES.length; i++) {
            for (var j = 0; j < subWheelValues[WHEELVALUES[i]].length; j++) {
                tabsLabels.push(subWheelValues[WHEELVALUES[i]][j].toString());
            }
        }

        this._tabsWheel.colors = ['#ffb2bc', '#ffccd6'];
        this._tabsWheel.slicePathFunction = slicePath().DonutSlice;
        this._tabsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._tabsWheel.slicePathCustom.minRadiusPercent = 0.6;
        this._tabsWheel.slicePathCustom.maxRadiusPercent = 0.8;
        this._tabsWheel.sliceSelectedPathCustom = this._tabsWheel.slicePathCustom;
        this._tabsWheel.sliceInitPathCustom = this._tabsWheel.slicePathCustom;
        this._tabsWheel.clickModeRotate = false;
        this._tabsWheel.navAngle = -180 / WHEELVALUES.length + 180 / (WHEELVALUES.length * subWheelValues[WHEELVALUES[0]].length);
        this._tabsWheel.createWheel(tabsLabels);
        
        var that = this;

        var __selectionChanged = function () {
            that.text.text = that._tabsWheel.navItems[that._tabsWheel.selectedNavItemIndex].title;
            that.value = Number(that.text.text);

            // Make sure text is on top.
            var z = that.container.children.length - 1;
            that.container.setChildIndex(that.text, z);
            that.updateCache();
        };

        var __exitMenu = function () {
            var d = new Date();
            that._piemenuExitTime = d.getTime();
            docById('wheelDiv').style.display = 'none';
            that._noteValueWheel.removeWheel();
            that._exitWheel.removeWheel();
            that.label.style.display = 'none';
        };

        var labelElem = docById('labelDiv');
        labelElem.innerHTML = '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' + noteValue + '" />';
        labelElem.classList.add('hasKeyboard');
        this.label = docById('numberLabel');

        // this.label.addEventListener('keypress', __keypress);

        this.label.addEventListener('change', function () {
            that._labelChanged(true);
        });

        // Position the widget over the note block.
        var x = this.container.x;
        var y = this.container.y;

        var canvasLeft = this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        var canvasTop = this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById('wheelDiv').style.position = 'absolute';
        docById('wheelDiv').style.height = '300px';
        docById('wheelDiv').style.width = '300px';

        var selectorWidth = 150;
        var left = Math.round((x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft);
        var top = Math.round((y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop);
        this.label.style.left = left + 'px';
        this.label.style.top = top + 'px';

        docById('wheelDiv').style.left = Math.min(Math.max((left - (300 - selectorWidth) / 2), 0), this.blocks.turtles._canvas.width - 300)  + 'px';
        if (top - 300 < 0) {
            docById('wheelDiv').style.top = (top + 40) + 'px';
        } else {
            docById('wheelDiv').style.top = (top - 300) + 'px';
        }

        this.label.style.width = Math.round(selectorWidth * this.blocks.blockScale) * this.protoblock.scale / 2 + 'px';

        var __showHide = function () {
            var i = that._noteValueWheel.selectedNavItemIndex;
            for (var k = 0; k < WHEELVALUES.length; k++) {
                for (var j = 0; j < subWheelValues[WHEELVALUES[0]].length; j++) {
                    var n = k * subWheelValues[WHEELVALUES[0]].length;
                    if (that._noteValueWheel.selectedNavItemIndex === k) {
                        that._tabsWheel.navItems[n + j].navItem.show();
                    } else {
                        that._tabsWheel.navItems[n + j].navItem.hide();
                    }
                }
            }
        };

        for (var i = 0; i < noteValueLabels.length; i++) {
            this._noteValueWheel.navItems[i].navigateFunction = __showHide;
        }

        // Navigate to a the current noteValue value.
        // Special case 1 to use power of 2.
        if (noteValue === 1) {
            this._noteValueWheel.navigateWheel(1);
            this._tabsWheel.navigateWheel(0);
        } else {
            for (var i = 0; i < WHEELVALUES.length; i++) {
                for (var j = 0; j < subWheelValues[WHEELVALUES[i]].length; j++) {
                    if (subWheelValues[WHEELVALUES[i]][j] === noteValue) {
                        this._noteValueWheel.navigateWheel(i);
                        this._tabsWheel.navigateWheel(i * subWheelValues[WHEELVALUES[i]].length + j);
                        break;
                    }
                }

                if (j < subWheelValues[WHEELVALUES[i]].length) {
                    break;
                }
            }

            if (i === WHEELVALUES.length) {
                this._noteValueWheel.navigateWheel(1);
                this._tabsWheel.navigateWheel(2);
            }
        }

        this.label.style.fontSize = Math.round(20 * this.blocks.blockScale * this.protoblock.scale / 2) + 'px';
        this.label.style.display = '';
        this.label.focus();

        // Hide the widget when the selection is made.
        for (var i = 0; i < tabsLabels.length; i++) {
            this._tabsWheel.navItems[i].navigateFunction = function () {
                __selectionChanged();
                __exitMenu();
            };
        }

        // Or use the exit wheel...
        this._exitWheel.navItems[0].navigateFunction = function () {
            __exitMenu();
        };
    };

    this._piemenuNumber = function (wheelValues, selectedValue) {
        // input form and  wheelNav pie menu for number selection

        if (this.blocks.stageClick) {
            return;
        }

        docById('wheelDiv').style.display = '';

        // the number selector
        this._numberWheel = new wheelnav('wheelDiv', null, 600, 600);
        // exit button
        this._exitWheel = new wheelnav('_exitWheel', this._numberWheel.raphael);

        var wheelLabels = [];
        for (var i = 0; i < wheelValues.length; i++) {
            wheelLabels.push(wheelValues[i].toString());
        }

        // spacer
        wheelLabels.push(null);

        wheelnav.cssMode = true;

        this._numberWheel.keynavigateEnabled = true;

        this._numberWheel.colors = ['#ffb2bc', '#ffccd6'];
        this._numberWheel.slicePathFunction = slicePath().DonutSlice;
        this._numberWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        if (wheelValues.length > 16) {
            this._numberWheel.slicePathCustom.minRadiusPercent = 0.6;
            this._numberWheel.slicePathCustom.maxRadiusPercent = 1.0;
        } else if (wheelValues.length > 10) {
            this._numberWheel.slicePathCustom.minRadiusPercent = 0.4;
            this._numberWheel.slicePathCustom.maxRadiusPercent = 0.8;
        } else {
            this._numberWheel.slicePathCustom.minRadiusPercent = 0.2;
            this._numberWheel.slicePathCustom.maxRadiusPercent = 0.6;
        }

        this._numberWheel.sliceSelectedPathCustom = this._numberWheel.slicePathCustom;
        this._numberWheel.sliceInitPathCustom = this._numberWheel.slicePathCustom;
        // this._numberWheel.titleRotateAngle = 0;
        this._numberWheel.animatetime = 300;
        this._numberWheel.createWheel(wheelLabels);

        this._exitWheel.colors = ['#808080', '#c0c0c0'];
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(['x', ' ']);

        var that = this;

        var __selectionChanged = function () {
            that.value = wheelValues[that._numberWheel.selectedNavItemIndex];
            that.text.text = wheelLabels[that._numberWheel.selectedNavItemIndex];

            // Make sure text is on top.
            var z = that.container.children.length - 1;
            that.container.setChildIndex(that.text, z);
            that.updateCache();
        };

        var __exitMenu = function () {
            var d = new Date();
            that._piemenuExitTime = d.getTime();
            docById('wheelDiv').style.display = 'none';
            that._numberWheel.removeWheel();
            that._exitWheel.removeWheel();
            that.label.style.display = 'none';
        };

        var labelElem = docById('labelDiv');
        labelElem.innerHTML = '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' + selectedValue + '" />';
        labelElem.classList.add('hasKeyboard');
        this.label = docById('numberLabel');

        // this.label.addEventListener('keypress', __keypress);

        this.label.addEventListener('change', function () {
            that._labelChanged(true);
        });

        // Position the widget over the note block.
        var x = this.container.x;
        var y = this.container.y;

        var canvasLeft = this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        var canvasTop = this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById('wheelDiv').style.position = 'absolute';
        docById('wheelDiv').style.height = '300px';
        docById('wheelDiv').style.width = '300px';

        var selectorWidth = 150;
        var left = Math.round((x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft);
        var top = Math.round((y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop);
        this.label.style.left = left + 'px';
        this.label.style.top = top + 'px';

        docById('wheelDiv').style.left = Math.min(Math.max((left - (300 - selectorWidth) / 2), 0), this.blocks.turtles._canvas.width - 300)  + 'px';
        if (top - 300 < 0) {
            docById('wheelDiv').style.top = (top + 40) + 'px';
        } else {
            docById('wheelDiv').style.top = (top - 300) + 'px';
        }

        this.label.style.width = Math.round(selectorWidth * this.blocks.blockScale) * this.protoblock.scale / 2 + 'px';

        // Navigate to a the current number value.
        var i = wheelValues.indexOf(selectedValue);
        if (i === -1) {
            i = 0;
        }

        this._numberWheel.navigateWheel(i);

        this.label.style.fontSize = Math.round(20 * this.blocks.blockScale * this.protoblock.scale / 2) + 'px';
        this.label.style.display = '';
        this.label.focus();

        // Hide the widget when the selection is made.
        for (var i = 0; i < wheelLabels.length; i++) {
            this._numberWheel.navItems[i].navigateFunction = function () {
                __selectionChanged();
                __exitMenu();
            };
        }

        // Or use the exit wheel...
        this._exitWheel.navItems[0].navigateFunction = function () {
            __exitMenu();
        };
    };

    this._piemenuColor = function (wheelValues, selectedValue, mode) {
        // input form and  wheelNav pie menu for setcolor selection

        if (this.blocks.stageClick) {
            return;
        }

        docById('wheelDiv').style.display = '';

        // the number selector
        this._numberWheel = new wheelnav('wheelDiv', null, 600, 600);
        // exit button
        this._exitWheel = new wheelnav('_exitWheel', this._numberWheel.raphael);

        var wheelLabels = [];
        for (var i = 0; i < wheelValues.length; i++) {
            wheelLabels.push(wheelValues[i].toString());
        }

        wheelnav.cssMode = true;

        this._numberWheel.keynavigateEnabled = true;

        this._numberWheel.colors = [];
        if (mode === 'setcolor') {
            for (var i = 0; i < wheelValues.length; i++) {
                this._numberWheel.colors.push(COLORS40[Math.floor(wheelValues[i] / 2.5)][2]);
            }
        } else if (mode === 'sethue') {
            for (var i = 0; i < wheelValues.length; i++) {
                this._numberWheel.colors.push(getMunsellColor(wheelValues[i], 50, 50));
            }
        } else {
            if (mode === 'setshade') {
                for (var i = 0; i < wheelValues.length; i++) {
                    this._numberWheel.colors.push(getMunsellColor(0, wheelValues[i], 0));
                }
            } else if (mode === 'settranslucency') {
                for (var i = 0; i < wheelValues.length; i++) {
                    this._numberWheel.colors.push(getMunsellColor(35, 70, 100 - wheelValues[i]));
                }
            } else {
                for (var i = 0; i < wheelValues.length; i++) {
                    this._numberWheel.colors.push(getMunsellColor(60, 60, wheelValues[i]));
                }
            }

            for (var i = 0; i < wheelValues.length; i++) {
                wheelLabels.push(null);
            }
        }

        this._numberWheel.slicePathFunction = slicePath().DonutSlice;
        this._numberWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._numberWheel.slicePathCustom.minRadiusPercent = 0.6;
        this._numberWheel.slicePathCustom.maxRadiusPercent = 1.0;

        this._numberWheel.sliceSelectedPathCustom = this._numberWheel.slicePathCustom;
        this._numberWheel.sliceInitPathCustom = this._numberWheel.slicePathCustom;
        // this._numberWheel.titleRotateAngle = 0;
        this._numberWheel.animatetime = 300;
        this._numberWheel.createWheel(wheelLabels);

        this._exitWheel.colors = ['#808080', '#c0c0c0'];
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(['x', ' ']);

        var that = this;

        var __selectionChanged = function () {
            that.value = wheelValues[that._numberWheel.selectedNavItemIndex];
            that.text.text = wheelLabels[that._numberWheel.selectedNavItemIndex];

            // Make sure text is on top.
            var z = that.container.children.length - 1;
            that.container.setChildIndex(that.text, z);
            that.updateCache();
        };

        var __exitMenu = function () {
            var d = new Date();
            that._piemenuExitTime = d.getTime();
            docById('wheelDiv').style.display = 'none';
            that._numberWheel.removeWheel();
            that._exitWheel.removeWheel();
            that.label.style.display = 'none';
        };

        var labelElem = docById('labelDiv');
        labelElem.innerHTML = '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' + selectedValue + '" />';
        labelElem.classList.add('hasKeyboard');
        this.label = docById('numberLabel');

        // this.label.addEventListener('keypress', __keypress);

        this.label.addEventListener('change', function () {
            that._labelChanged(true);
        });

        // Position the widget over the note block.
        var x = this.container.x;
        var y = this.container.y;

        var canvasLeft = this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        var canvasTop = this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById('wheelDiv').style.position = 'absolute';
        docById('wheelDiv').style.height = '300px';
        docById('wheelDiv').style.width = '300px';

        var selectorWidth = 150;
        var left = Math.round((x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft);
        var top = Math.round((y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop);
        this.label.style.left = left + 'px';
        this.label.style.top = top + 'px';

        docById('wheelDiv').style.left = Math.min(Math.max((left - (300 - selectorWidth) / 2), 0), this.blocks.turtles._canvas.width - 300)  + 'px';
        if (top - 300 < 0) {
            docById('wheelDiv').style.top = (top + 40) + 'px';
        } else {
            docById('wheelDiv').style.top = (top - 300) + 'px';
        }

        this.label.style.width = Math.round(selectorWidth * this.blocks.blockScale) * this.protoblock.scale / 2 + 'px';

        // Navigate to a the current number value.
        var i = wheelValues.indexOf(selectedValue);
        if (i === -1) {
            i = 0;
        }

        this._numberWheel.navigateWheel(i);

        this.label.style.fontSize = Math.round(20 * this.blocks.blockScale * this.protoblock.scale / 2) + 'px';
        this.label.style.display = '';
        this.label.focus();

        // Hide the widget when the selection is made.
        for (var i = 0; i < wheelLabels.length; i++) {
            this._numberWheel.navItems[i].navigateFunction = function () {
                __selectionChanged();
                __exitMenu();
            };
        }

        // Or use the exit wheel...
        this._exitWheel.navItems[0].navigateFunction = function () {
            __exitMenu();
        };
    };

    this._piemenuBasic = function (menuLabels, menuValues, selectedValue, colors) {
        // basic wheelNav pie menu

        if (this.blocks.stageClick) {
            return;
        }

        if (colors === undefined) {
            colors = ['#77c428', '#93e042', '#5ba900'];
        }

        docById('wheelDiv').style.display = '';

        // the selectedValueh selector
        this._basicWheel = new wheelnav('wheelDiv', null, 800, 800);

        var labels = [];
        for (var i = 0; i < menuLabels.length; i++) {
            labels.push(menuLabels[i]);
        }

        wheelnav.cssMode = true;

        this._basicWheel.keynavigateEnabled = true;

        this._basicWheel.colors = colors;
        this._basicWheel.slicePathFunction = slicePath().DonutSlice;
        this._basicWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._basicWheel.slicePathCustom.minRadiusPercent = 0;
        this._basicWheel.slicePathCustom.maxRadiusPercent = 0.9;
        this._basicWheel.sliceSelectedPathCustom = this._basicWheel.slicePathCustom;
        this._basicWheel.sliceInitPathCustom = this._basicWheel.slicePathCustom;
        this._basicWheel.titleRotateAngle = 0;
        this._basicWheel.animatetime = 300;
        this._basicWheel.createWheel(labels);

        var that = this;

        var __selectionChanged = function () {
            var label = that._basicWheel.navItems[that._basicWheel.selectedNavItemIndex].title;
            var i = labels.indexOf(label);
            that.value = menuValues[i];
            that.text.text = menuLabels[i];

            // Make sure text is on top.
            var z = that.container.children.length - 1;
            that.container.setChildIndex(that.text, z);
            that.updateCache();
        };

        var __exitMenu = function () {
            var d = new Date();
            that._piemenuExitTime = d.getTime();
            docById('wheelDiv').style.display = 'none';
            that._basicWheel.removeWheel();
        };

        // Position the widget over the note block.
        var x = this.container.x;
        var y = this.container.y;

        var canvasLeft = this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        var canvasTop = this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById('wheelDiv').style.position = 'absolute';
        docById('wheelDiv').style.height = '300px';
        docById('wheelDiv').style.width = '300px';
        docById('wheelDiv').style.left = Math.min(this.blocks.turtles._canvas.width - 300, Math.max(0, Math.round((x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft) - 200)) + 'px';
        docById('wheelDiv').style.top = Math.min(this.blocks.turtles._canvas.height - 350, Math.max(0, Math.round((y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop) - 200)) + 'px';
        
        // Navigate to a the current selectedValue value.
        var i = menuValues.indexOf(selectedValue);
        if (i === -1) {
            i = 1;
        }

        this._basicWheel.navigateWheel(i);

        // Hide the widget when the selection is made.
        for (var i = 0; i < menuLabels.length; i++) {
            this._basicWheel.navItems[i].navigateFunction = function () {
                __selectionChanged();
                __exitMenu();
            };
        }
    };

    this._piemenuBoolean = function (booleanLabels, booleanValues, boolean) {
        // wheelNav pie menu for boolean selection

        if (this.blocks.stageClick) {
            return;
        }

        docById('wheelDiv').style.display = '';

        // the booleanh selector
        this._booleanWheel = new wheelnav('wheelDiv', null, 600, 600);

        var labels = [];
        for (var i = 0; i < booleanLabels.length; i++) {
            labels.push(booleanLabels[i])
        }

        wheelnav.cssMode = true;

        this._booleanWheel.keynavigateEnabled = true;

        this._booleanWheel.colors = ['#d3cf76', '#b8b45f'];
        this._booleanWheel.slicePathFunction = slicePath().DonutSlice;
        this._booleanWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._booleanWheel.slicePathCustom.minRadiusPercent = 0;
        this._booleanWheel.slicePathCustom.maxRadiusPercent = 0.6;
        this._booleanWheel.sliceSelectedPathCustom = this._booleanWheel.slicePathCustom;
        this._booleanWheel.sliceInitPathCustom = this._booleanWheel.slicePathCustom;
        // this._booleanWheel.titleRotateAngle = 0;
        this._booleanWheel.animatetime = 300;
        this._booleanWheel.createWheel(labels);

        var that = this;

        var __selectionChanged = function () {
            var label = that._booleanWheel.navItems[that._booleanWheel.selectedNavItemIndex].title;
            var i = labels.indexOf(label);
            that.value = booleanValues[i];
            that.text.text = booleanLabels[i];

            // Make sure text is on top.
            var z = that.container.children.length - 1;
            that.container.setChildIndex(that.text, z);
            that.updateCache();
        };

        var __exitMenu = function () {
            var d = new Date();
            that._piemenuExitTime = d.getTime();
            docById('wheelDiv').style.display = 'none';
            that._booleanWheel.removeWheel();
        };

        // Position the widget over the note block.
        var x = this.container.x;
        var y = this.container.y;

        var canvasLeft = this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        var canvasTop = this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById('wheelDiv').style.position = 'absolute';
        docById('wheelDiv').style.height = '300px';
        docById('wheelDiv').style.width = '300px';
        docById('wheelDiv').style.left = Math.min(this.blocks.turtles._canvas.width - 300, Math.max(0, Math.round((x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft) - 200)) + 'px';
        docById('wheelDiv').style.top = Math.min(this.blocks.turtles._canvas.height - 350, Math.max(0, Math.round((y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop) - 200)) + 'px';
        
        // Navigate to a the current boolean value.
        var i = booleanValues.indexOf(boolean);
        if (i === -1) {
            i = 0;
        }

        this._booleanWheel.navigateWheel(i);

        // Hide the widget when the selection is made.
        this._booleanWheel.navItems[0].navigateFunction = function () {
            __selectionChanged();
            __exitMenu();
        };

        this._booleanWheel.navItems[1].navigateFunction = function () {
            __selectionChanged();
            __exitMenu();
        };
    };

    this._piemenuVoices = function (voiceLabels, voiceValues, categories, voice, rotate) {
        // wheelNav pie menu for voice selection

        if (this.blocks.stageClick) {
            return;
        }

        const COLORS = ['#3ea4a3', '#60bfbc', '#1d8989', '#60bfbc', '#1d8989'];
        var colors = [];

        for (var i = 0; i < voiceLabels.length; i++) {
            colors.push(COLORS[categories[i] % COLORS.length]);
        }

        docById('wheelDiv').style.display = '';

        // the voice selector
        if (localStorage.kanaPreference === 'kana') {
            this._voiceWheel = new wheelnav('wheelDiv', null, 1200, 1200);
        } else {
            this._voiceWheel = new wheelnav('wheelDiv', null, 800, 800);
        }

        // exit button
        this._exitWheel = new wheelnav('_exitWheel', this._voiceWheel.raphael);

        wheelnav.cssMode = true;

        this._voiceWheel.keynavigateEnabled = true;

        this._voiceWheel.colors = colors;
        this._voiceWheel.slicePathFunction = slicePath().DonutSlice;
        this._voiceWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._voiceWheel.slicePathCustom.minRadiusPercent = 0.2;
        this._voiceWheel.slicePathCustom.maxRadiusPercent = 1;
        this._voiceWheel.sliceSelectedPathCustom = this._voiceWheel.slicePathCustom;
        this._voiceWheel.sliceInitPathCustom = this._voiceWheel.slicePathCustom;
        if (rotate === undefined) {
            this._voiceWheel.titleRotateAngle = 0;
        } else {
            this._voiceWheel.titleRotateAngle = rotate;
        }

        this._voiceWheel.animatetime = 300;
        this._voiceWheel.createWheel(voiceLabels);

        this._exitWheel.colors = ['#808080', '#c0c0c0'];
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(['x', ' ']);

        var that = this;

        var __selectionChanged = function () {
            var label = that._voiceWheel.navItems[that._voiceWheel.selectedNavItemIndex].title;
            var i = voiceLabels.indexOf(label);
            that.value = voiceValues[i];
            that.text.text = label;

            if (getDrumName(that.value) === null) {
                that.blocks.logo.synth.loadSynth(0, getVoiceSynthName(that.value));
            } else {
                that.blocks.logo.synth.loadSynth(0, getDrumSynthName(that.value));
            }

            // Make sure text is on top.
            var z = that.container.children.length - 1;
            that.container.setChildIndex(that.text, z);
            that.updateCache();
        };

        var __voicePreview = function () {
            var label = that._voiceWheel.navItems[that._voiceWheel.selectedNavItemIndex].title;
            var i = voiceLabels.indexOf(label);
            var voice = voiceValues[i];
            var timeout = 0;

            if (that.blocks.logo.instrumentNames[0] === undefined || that.blocks.logo.instrumentNames[0].indexOf(voice) === -1) {
                if (that.blocks.logo.instrumentNames[0] === undefined) {
                    that.blocks.logo.instrumentNames[0] = [];
                }

                that.blocks.logo.instrumentNames[0].push(voice);
                if (voice === 'default') {
                    that.blocks.logo.synth.createDefaultSynth(0);
                }

                that.blocks.logo.synth.loadSynth(0, voice);
                // give the synth time to load
                var timeout = 500;
            }

            setTimeout(function () {
                that.blocks.logo.synth.setMasterVolume(DEFAULTVOLUME);
                that.blocks.logo.setSynthVolume(0, voice, DEFAULTVOLUME);
                that.blocks.logo.synth.trigger(0, 'G4', 1 / 4, voice, null, null, false);
                that.blocks.logo.synth.start();

            }, timeout);

            __selectionChanged();
        };

        // position widget
        var x = this.container.x;
        var y = this.container.y;

        var canvasLeft = this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        var canvasTop = this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById('wheelDiv').style.position = 'absolute';
        docById('wheelDiv').style.height = '400px';
        docById('wheelDiv').style.width = '400px';
        docById('wheelDiv').style.left = Math.min(this.blocks.turtles._canvas.width - 400, Math.max(0, Math.round((x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft) - 200)) + 'px';
        docById('wheelDiv').style.top = Math.min(this.blocks.turtles._canvas.height - 450, Math.max(0, Math.round((y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop) - 200)) + 'px';
        
        // navigate to a specific starting point
        var i = voiceValues.indexOf(voice);
        if (i === -1) {
            i = 0;
        }

        this._voiceWheel.navigateWheel(i);

        // Set up handlers for voice preview.
        for (var i = 0; i < voiceValues.length; i++) {
            this._voiceWheel.navItems[i].navigateFunction = __voicePreview;
        }

        // Hide the widget when the exit button is clicked.
        this._exitWheel.navItems[0].navigateFunction = function () {
            var d = new Date();
            that._piemenuExitTime = d.getTime();
            docById('wheelDiv').style.display = 'none';
        };
    };

    this._piemenuIntervals = function (selectedInterval) {
        // pie menu for interval selection

        if (this.blocks.stageClick) {
            return;
        }

        docById('wheelDiv').style.display = '';

        // Use advanced constructor for more wheelnav on same div
        var language = localStorage.languagePreference;
        if (language === 'ja') {
            this._intervalNameWheel = new wheelnav('wheelDiv', null, 1500, 1500);
        } else {
            this._intervalNameWheel = new wheelnav('wheelDiv', null, 800, 800);
        }

        this._intervalWheel = new wheelnav('this._intervalWheel', this._intervalNameWheel.raphael);
        // exit button
        this._exitWheel = new wheelnav('_exitWheel', this._intervalNameWheel.raphael);

        wheelnav.cssMode = true;

        this._intervalNameWheel.keynavigateEnabled = true;

        //Customize slicePaths for proper size
        this._intervalNameWheel.colors = ['#77c428', '#93e042', '#77c428', '#5ba900', '#93e042'];
        this._intervalNameWheel.slicePathFunction = slicePath().DonutSlice;
        this._intervalNameWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._intervalNameWheel.slicePathCustom.minRadiusPercent = 0.2;
        this._intervalNameWheel.slicePathCustom.maxRadiusPercent = 0.8;
        this._intervalNameWheel.sliceSelectedPathCustom = this._intervalNameWheel.slicePathCustom;
        this._intervalNameWheel.sliceInitPathCustom = this._intervalNameWheel.slicePathCustom;
        this._intervalNameWheel.titleRotateAngle = 0;
        this._intervalNameWheel.clickModeRotate = false;
        // this._intervalNameWheel.clickModeRotate = false;
        var labels = [];
        for (var i = 0; i < INTERVALS.length; i++) {
            labels.push(_(INTERVALS[i][1]));
        }

        this._intervalNameWheel.animatetime = 300;
        this._intervalNameWheel.createWheel(labels);

        this._intervalWheel.colors = ['#77c428', '#93e042', '#77c428', '#5ba900', '#93e042'];
        this._intervalWheel.slicePathFunction = slicePath().DonutSlice;
        this._intervalWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._intervalWheel.slicePathCustom.minRadiusPercent = 0.8;
        this._intervalWheel.slicePathCustom.maxRadiusPercent = 1;
        this._intervalWheel.sliceSelectedPathCustom = this._intervalWheel.slicePathCustom;
        this._intervalWheel.sliceInitPathCustom = this._intervalWheel.slicePathCustom;

        //Disable rotation, set navAngle and create the menus
        this._intervalWheel.clickModeRotate = false;
        // Align each set of numbers with its corresponding interval
        this._intervalWheel.navAngle = -(180 / labels.length) + (180 / (8 * labels.length));
        this._intervalWheel.animatetime = 300;

        var numbers = [];
        for (var i = 0; i < INTERVALS.length; i++) {
            for (var j = 1; j < 9; j++) {
                numbers.push(j.toString());
            }
        }

        this._intervalWheel.createWheel(numbers);

        this._exitWheel.colors = ['#808080', '#c0c0c0'];
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(['x', ' ']);

        var that = this;

        // position widget
        var x = this.container.x;
        var y = this.container.y;

        var canvasLeft = this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        var canvasTop = this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById('wheelDiv').style.position = 'absolute';
        docById('wheelDiv').style.height = '400px';
        docById('wheelDiv').style.width = '400px';
        docById('wheelDiv').style.left = Math.min(this.blocks.turtles._canvas.width - 400, Math.max(0, Math.round((x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft) - 200)) + 'px';
        docById('wheelDiv').style.top = Math.min(this.blocks.turtles._canvas.height - 450, Math.max(0, Math.round((y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop) - 200)) + 'px';

        // Add function to each main menu for show/hide sub menus
        // FIXME: Add all tabs to each interval
        var __setupAction = function (i, activeTabs) {
            that._intervalNameWheel.navItems[i].navigateFunction = function () {
                for (var l = 0; l < labels.length; l++) {
                    for (var j = 0; j < 8; j++) {
                        if (l !== i) {
                            that._intervalWheel.navItems[l * 8 + j].navItem.hide();
                        } else if (activeTabs.indexOf(j + 1) === -1) {
                            that._intervalWheel.navItems[l * 8 + j].navItem.hide();
                        } else {
                            that._intervalWheel.navItems[l * 8 + j].navItem.show();
                        }
                    }
                }
            };
        };

        // Set up action for interval name so number tabs will
        // initialize on load.
        for (var i = 0; i < INTERVALS.length; i++) {
            __setupAction(i, INTERVALS[i][2]);
        }

        // navigate to a specific starting point
        var obj = selectedInterval.split(' ');
        for (var i = 0; i < INTERVALS.length; i++) {
            if (obj[0] === INTERVALS[i][1]) {
                break;
            }
        }

        if (i === INTERVALS.length) {
            i = 0;
        }

        this._intervalNameWheel.navigateWheel(i);

        var j = Number(obj[1]);
        if (INTERVALS[i][2].indexOf(j) !== -1) {
            this._intervalWheel.navigateWheel(j - 1);
        } else {
            this._intervalWheel.navigateWheel(INTERVALS[i][2][0] - 1);
        }

        var __exitMenu = function () {
            var d = new Date();
            that._piemenuExitTime = d.getTime();
            docById('wheelDiv').style.display = 'none';
        };

        var __selectionChanged = function () {
            var label = that._intervalNameWheel.navItems[that._intervalNameWheel.selectedNavItemIndex].title;
            var number = that._intervalWheel.navItems[that._intervalWheel.selectedNavItemIndex].title;

            that.value = INTERVALS[that._intervalNameWheel.selectedNavItemIndex][1] + ' ' + number;
            if (label === 'perfect 1') {
                that.text.text = _('unison');
            } else {
                that.text.text = label + ' ' + number;
            }

            // Make sure text is on top.
            var z = that.container.children.length - 1;
            that.container.setChildIndex(that.text, z);
            that.updateCache();

            var obj = getNote('C', 4, INTERVALVALUES[that.value][0], 'C major', false, null, null);
            obj[0] = obj[0].replace(SHARP, '#').replace(FLAT, 'b');

            if (that.blocks.logo.instrumentNames[0] === undefined || that.blocks.logo.instrumentNames[0].indexOf('default') === -1) {
                if (that.blocks.logo.instrumentNames[0] === undefined) {
                    that.blocks.logo.instrumentNames[0] = [];
                }

                that.blocks.logo.instrumentNames[0].push('default');
                that.blocks.logo.synth.createDefaultSynth(0);
                that.blocks.logo.synth.loadSynth(0, 'default');
            }

            that.blocks.logo.synth.setMasterVolume(DEFAULTVOLUME);
            that.blocks.logo.setSynthVolume(0, 'default', DEFAULTVOLUME);
            that.blocks.logo.synth.trigger(0, ['C4', obj[0] + obj[1]], 1 / 8, 'default', null, null);
        };

        // Set up handlers for preview.
        for (var i = 0; i < 8 * labels.length; i++) {
            this._intervalWheel.navItems[i].navigateFunction = __selectionChanged;
        }

        this._exitWheel.navItems[0].navigateFunction = __exitMenu;
    };

    this._piemenuModes = function (selectedMode) {
        // pie menu for mode selection

        if (this.blocks.stageClick) {
            return;
        }

        // Look for a key block
        var key = 'C';
        var modeGroup = '7';  // default mode group
        var octave = false;

        var c = this.connections[0];
        if (c !== null) {
            if (this.blocks.blockList[c].name === 'setkey2') {
                var c1 = this.blocks.blockList[c].connections[1];
                if (c1 !== null) {
                    if (this.blocks.blockList[c1].name === 'notename') {
                        var key = this.blocks.blockList[c1].value;
                    }
                }
            }
        }

        docById('wheelDiv').style.display = '';

        //Use advanced constructor for more wheelnav on same div
        this._modeWheel = new wheelnav('wheelDiv', null, 1200, 1200);
        this._modeGroupWheel = new wheelnav('_modeGroupWheel', this._modeWheel.raphael);
        this._modeNameWheel = null;  // We build this wheel based on the group selection.
        // exit button
        this._exitWheel = new wheelnav('_exitWheel', this._modeWheel.raphael);

        wheelnav.cssMode = true;

        this._modeWheel.colors = ['#77c428', '#93e042'];
        this._modeWheel.slicePathFunction = slicePath().DonutSlice;
        this._modeWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._modeWheel.slicePathCustom.minRadiusPercent = 0.85;
        this._modeWheel.slicePathCustom.maxRadiusPercent = 1;
        this._modeWheel.sliceSelectedPathCustom = this._modeWheel.slicePathCustom;
        this._modeWheel.sliceInitPathCustom = this._modeWheel.slicePathCustom;

        // Disable rotation, set navAngle and create the menus
        this._modeWheel.clickModeRotate = false;
        this._modeWheel.navAngle = -90;
        // this._modeWheel.selectedNavItemIndex = 2;
        this._modeWheel.animatetime = 300;
        this._modeWheel.createWheel(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']);

        this._modeGroupWheel.colors = ['#ffb2bc', '#ffccd6', '#ffb2bc', '#ffccd6', '#ffb2bc', '#ffccd6', '#ffb2bc', '#ffccd6', '#c0c0c0', '#c0c0c0', '#c0c0c0', '#c0c0c0', '#c0c0c0', '#c0c0c0'];
        this._modeGroupWheel.slicePathFunction = slicePath().DonutSlice;
        this._modeGroupWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._modeGroupWheel.slicePathCustom.minRadiusPercent = 0.15;
        this._modeGroupWheel.slicePathCustom.maxRadiusPercent = 0.3;
        this._modeGroupWheel.sliceSelectedPathCustom = this._modeGroupWheel.slicePathCustom;
        this._modeGroupWheel.sliceInitPathCustom = this._modeGroupWheel.slicePathCustom;

        // Disable rotation, set navAngle and create the menus
        // this._modeGroupWheel.clickModeRotate = false;
        this._modeGroupWheel.navAngle = -90;
        // this._modeGroupWheel.selectedNavItemIndex = 2;
        this._modeGroupWheel.animatetime = 300;

        var xlabels = [];
        for (modegroup in MODE_PIE_MENUS) {
            xlabels.push(modegroup);
        }

        this._modeGroupWheel.createWheel(xlabels);

        this._exitWheel.colors = ['#808080', '#c0c0c0'];
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.15;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(['x', '▶']); // imgsrc:header-icons/play-button.svg']);

        var that = this;

        var __selectionChanged = function () {
            var title = that._modeNameWheel.navItems[that._modeNameWheel.selectedNavItemIndex].title;
            if (title === ' ') {
                that._modeNameWheel.navigateWheel((that._modeNameWheel.selectedNavItemIndex + 1) % that._modeNameWheel.navItems.length);
            } else {
                that.text.text = that._modeNameWheel.navItems[that._modeNameWheel.selectedNavItemIndex].title;

                if (that.text.text === _('major') + ' / ' + _('ionian')) {
                    that.value = 'major';
                } else if (that.text.text === _('minor') + ' / ' + _('aeolian')) {
                    that.value = 'aeolian';
                } else {
                    for (var i = 0; i < MODE_PIE_MENUS[modeGroup].length; i++) {
                        var modename = MODE_PIE_MENUS[modeGroup][i];

                        if (_(modename) === that.text.text) {
                            that.value = modename;
                            break;
                        }
                    }
                }

                // Make sure text is on top.
                var z = that.container.children.length - 1;
                that.container.setChildIndex(that.text, z);
                that.updateCache();
            }
        };

        // Add function to each main menu for show/hide sub menus
        var __setupAction = function (i, activeTabs) {
            that._modeNameWheel.navItems[i].navigateFunction = function () {
                for (var j = 0; j < 12; j++) {
                    if (activeTabs.indexOf(j) === -1) {
                        that._modeWheel.navItems[j].navItem.hide();
                    } else {
                        that._modeWheel.navItems[j].navItem.show();
                    }
                }

                __selectionChanged();
            };
        };

        // Build a pie menu of modes based on the current mode group.
        var __buildModeNameWheel = function (grp) {
            var newWheel = false;
            if (that._modeNameWheel === null) {
                that._modeNameWheel = new wheelnav('_modeNameWheel', that._modeWheel.raphael);
                newWheel = true;
            }

            that._modeNameWheel.keynavigateEnabled = true;

            // Customize slicePaths
            var colors = [];
            for (var i = 0; i < MODE_PIE_MENUS[grp].length; i++) {
                var modename = MODE_PIE_MENUS[grp][i];
                if (modename === ' ') {
                    colors.push('#4b8b0e');
                } else {
                    colors.push('#66a62d');
                }
            }

            that._modeNameWheel.colors = colors;
            that._modeNameWheel.slicePathFunction = slicePath().DonutSlice;
            that._modeNameWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            that._modeNameWheel.slicePathCustom.minRadiusPercent = 0.3; //0.15;
            that._modeNameWheel.slicePathCustom.maxRadiusPercent = 0.85;
            that._modeNameWheel.sliceSelectedPathCustom = that._modeNameWheel.slicePathCustom;
            that._modeNameWheel.sliceInitPathCustom = that._modeNameWheel.slicePathCustom;
            that._modeNameWheel.titleRotateAngle = 0;
            // that._modeNameWheel.clickModeRotate = false;
            that._modeNameWheel.navAngle = -90;
            var labels = new Array();
            for (var i = 0; i < MODE_PIE_MENUS[grp].length; i++) {
                var modename = MODE_PIE_MENUS[grp][i];
                switch (modename) {
                case 'ionian':
                case 'major':
                    labels.push(_('major') + ' / ' + _('ionian'));
                    break;
                case 'aeolian':
                case 'minor':
                    labels.push(_('minor') + ' / ' + _('aeolian'));
                    break;
                default:
                    if (modename === ' ') {
                        labels.push(' ');
                    } else {
                        labels.push(_(modename));
                    }
                    break;
                }
            }

            that._modeNameWheel.animatetime = 300;
            if (newWheel) {
                that._modeNameWheel.createWheel(labels);
            } else {
                for (var i = 0; i < that._modeNameWheel.navItems.length; i++) {
                    // Maybe there is a method that does this.
                    that._modeNameWheel.navItems[i].title = labels[i];
                    that._modeNameWheel.navItems[i].basicNavTitleMax.title = labels[i];
                    that._modeNameWheel.navItems[i].basicNavTitleMin.title = labels[i];
                    that._modeNameWheel.navItems[i].hoverNavTitleMax.title = labels[i];
                    that._modeNameWheel.navItems[i].hoverNavTitleMin.title = labels[i];
                    that._modeNameWheel.navItems[i].selectedNavTitleMax.title = labels[i];
                    that._modeNameWheel.navItems[i].selectedNavTitleMin.title = labels[i];
                    that._modeNameWheel.navItems[i].initNavTitle.title = labels[i];
                    that._modeNameWheel.navItems[i].fillAttr = colors[i];
                    that._modeNameWheel.navItems[i].sliceHoverAttr.fill = colors[i];
                    that._modeNameWheel.navItems[i].slicePathAttr.fill = colors[i];
                    that._modeNameWheel.navItems[i].sliceSelectedAttr.fill = colors[i];
                }

                that._modeNameWheel.refreshWheel();
            }

            // Special case for Japanese
            var language = localStorage.languagePreference;
            if (language === 'ja') {
                for (var i = 0; i < that._modeNameWheel.navItems.length; i++) {
                    that._modeNameWheel.navItems[i].titleAttr.font = "30 30px sans-serif";
                    that._modeNameWheel.navItems[i].titleSelectedAttr.font = "30 30px sans-serif";
                }
            }

            // Set up tabs for each mode.
            var i = 0;
            for (var j = 0; j < MODE_PIE_MENUS[grp].length; j++) {
                var modename = MODE_PIE_MENUS[grp][j];
                var activeTabs = [0];
                if (modename !== ' ') {
                    var mode = MUSICALMODES[modename];
                    for (var k = 0; k < mode.length; k++) {
                        activeTabs.push(last(activeTabs) + mode[k]);
                    }
                }

                __setupAction(i, activeTabs);
                i += 1;
            }

            // Look for the selected mode.
            for (var i = 0; i < MODE_PIE_MENUS[grp].length; i++) {
                if (MODE_PIE_MENUS[grp][i] === selectedMode) {
                    break;
                }
            }

            // if we didn't find the mode, use a default
            if (i === labels.length) {
                i = 0; // major/ionian
            }

            that._modeNameWheel.navigateWheel(i);
        };

        var __exitMenu = function () {
            var d = new Date();
            that._piemenuExitTime = d.getTime();
            docById('wheelDiv').style.display = 'none';
            if (that._modeNameWheel !== null) {
                that._modeNameWheel.removeWheel();
            }
        };

        var __playNote = function () {
            var o = 0;
            if (octave) {
                var o = 12;
            }

            var i = that._modeWheel.selectedNavItemIndex;
            // The mode doesn't matter here, since we are using semi-tones.
            var obj = getNote(key, 4, i + o, key + ' chromatic', false, null, null);
            obj[0] = obj[0].replace(SHARP, '#').replace(FLAT, 'b');

            if (that.blocks.logo.instrumentNames[0] === undefined || that.blocks.logo.instrumentNames[0].indexOf('default') === -1) {
                if (that.blocks.logo.instrumentNames[0] === undefined) {
                    that.blocks.logo.instrumentNames[0] = [];
                }

                that.blocks.logo.instrumentNames[0].push('default');
                that.blocks.logo.synth.createDefaultSynth(0);
                that.blocks.logo.synth.loadSynth(0, 'default');
            }

            that.blocks.logo.synth.setMasterVolume(DEFAULTVOLUME);
            that.blocks.logo.setSynthVolume(0, 'default', DEFAULTVOLUME);
            that.blocks.logo.synth.trigger(0, [obj[0] + obj[1]], 1 / 12, 'default', null, null);
        };

        var __playScale = function (activeTabs, idx) {
            // loop through selecting modeWheel slices with a delay.
            if (idx < activeTabs.length) {
                if (activeTabs[idx] < 12) {
                    octave = false;
                    that._modeWheel.navigateWheel(activeTabs[idx]);
                } else {
                    octave = true;
                    that._modeWheel.navigateWheel(0);
                }

                setTimeout(function () {
                    __playScale(activeTabs, idx + 1);
                }, 1000 / 10); // slight delay between notes
            }
        };

        var __prepScale = function () {
            var activeTabs = [0];
            var mode = MUSICALMODES[that.value];
            for (var k = 0; k < mode.length - 1; k++) {
                activeTabs.push(last(activeTabs) + mode[k]);
            }

            activeTabs.push(12);
            activeTabs.push(12);
            
            for (var k = mode.length - 1; k >= 0; k--) {
                activeTabs.push(last(activeTabs) - mode[k]);
            }

            __playScale(activeTabs, 0);
        };

        // position widget
        var x = this.container.x;
        var y = this.container.y;

        var canvasLeft = this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        var canvasTop = this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById('wheelDiv').style.position = 'absolute';
        docById('wheelDiv').style.height = '600px';
        docById('wheelDiv').style.width = '600px';

        // This widget is large. Be sure it fits on the screen.
        docById('wheelDiv').style.left = Math.min(this.blocks.turtles._canvas.width - 600, Math.max(0, Math.round((x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft) - 200)) + 'px';
        docById('wheelDiv').style.top = Math.min(this.blocks.turtles._canvas.height - 650, Math.max(0, Math.round((y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop) - 200)) + 'px';

        for (var i = 0; i < 12; i++) {
            that._modeWheel.navItems[i].navigateFunction = __playNote;
        }

        // navigate to a specific starting point
        for (modeGroup in MODE_PIE_MENUS) {
            for (var j = 0; j < MODE_PIE_MENUS[modeGroup].length; j++) {
                var modename = MODE_PIE_MENUS[modeGroup][j];
                if (modename === selectedMode) {
                    break;
                }
            }

            if (j < MODE_PIE_MENUS[modeGroup].length) {
                break;
            }
        }

        if (selectedMode === 'major') {
            modeGroup = '7';
        }

        var __buildModeWheel = function () {
            var i = that._modeGroupWheel.selectedNavItemIndex;
            modeGroup = that._modeGroupWheel.navItems[i].title;
            __buildModeNameWheel(modeGroup);
        };

        for (var i = 0; i < this._modeGroupWheel.navItems.length; i++) {
            this._modeGroupWheel.navItems[i].navigateFunction = __buildModeWheel;
        }

        for (var i = 0; i < this._modeGroupWheel.navItems.length; i++) {
            if (this._modeGroupWheel.navItems[i].title === modeGroup) {
                this._modeGroupWheel.navigateWheel(i);
                break;
            }
        }

        this._exitWheel.navItems[0].navigateFunction = __exitMenu;
        this._exitWheel.navItems[1].navigateFunction = __prepScale;
    };

    this._labelChanged = function (closeInput, change) {
        // Update the block values as they change in the DOM label.
        if (this === null || this.label === null) {
            this._labelLock = false;
            return;
        }

        this._labelLock = true;

        if (closeInput) {
            this.label.style.display = 'none';
            if (this.labelattr != null) {
                this.labelattr.style.display = 'none';
            }
        }

        // The pie menu may be visible too, so hide it.
        docById('wheelDiv').style.display = 'none';

        var oldValue = this.value;
        var newValue = this.label.value;

        if (this.labelattr != null) {
            var attrValue = this.labelattr.value;
            switch (attrValue) {
            case '𝄪':
            case '♯':
            case '𝄫':
            case '♭':
                newValue = newValue + attrValue;
                break;
            default:
                break;
            }
        }

        var c = this.connections[0];

        if (oldValue === newValue) {
            // Nothing to do in this case.
            this._labelLock = false;
            if (this.name !== 'text' || c === null || this.blocks.blockList[c].name !== 'storein') {
                return;
            }
        }

        var c = this.connections[0];
        if (this.name === 'text' && c != null) {
            var cblock = this.blocks.blockList[c];
            switch (cblock.name) {
            case 'action':
                var that = this;

                that.blocks.palettes.removeActionPrototype(oldValue);

                // Ensure new name is unique.
                var uniqueValue = this.blocks.findUniqueActionName(newValue);
                if (uniqueValue !== newValue) {
                    newValue = uniqueValue;
                    this.value = newValue;
                    var label = this.value.toString();
                    if (getTextWidth(label, 'bold 20pt Sans') > TEXTWIDTH) {  
                        label = label.substr(0, STRINGLEN) + '...';
                    }
                    this.text.text = label;
                    this.label.value = newValue;
                    this.updateCache();
                }
                break;
            case 'pitch':
                // In case of custom temperament
                var uniqueValue = this.blocks.findUniqueCustomName(newValue);
                newValue = uniqueValue;
                for (var pitchNumber in TEMPERAMENT['custom']) {
                    if (pitchNumber !== 'pitchNumber') {
                        if (oldValue == TEMPERAMENT['custom'][pitchNumber][1]) {
                         TEMPERAMENT['custom'][pitchNumber][1] = newValue;   
                        }
                    }   
                }
                this.value = newValue;
                var label = this.value.toString();
                if (getTextWidth(label, 'bold 20pt Sans') > TEXTWIDTH) {  
                    label = label.substr(0, STRINGLEN) + '...';
                }
                this.text.text = label;
                this.label.value = newValue;
                this.updateCache();
                break;
            default:
                break;
            }
        }

        // Update the block value and block text.
        if (this.name === 'number') {
            if (this.value === '-') {
                this.value = -1;
            } else {
                this.value = Number(newValue);
            }

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
        } else if (this.name === 'modename') {
            var label = this.value + ' ' + getModeNumbers(this.value);
        } else {
            var label = this.value.toString();
        }

        if (WIDENAMES.indexOf(this.name) === -1 && getTextWidth(label, 'bold 20pt Sans') > TEXTWIDTH ) {   
            var slen = label.length - 5;
            var nlabel = '' + label.substr(0, slen) + '...';
            while (getTextWidth(nlabel, 'bold 20pt Sans') > TEXTWIDTH) {
                slen -= 1;
                nlabel = '' + label.substr(0, slen) + '...';
                var foo = getTextWidth(nlabel, 'bold 20pt Sans');
                if (slen <= STRINGLEN) {
                    break;
                }
            }

            label = nlabel;
        }

        this.text.text = label;

        if (closeInput) {
            // and hide the DOM textview...
            this.label.style.display = 'none';
        }

        // Make sure text is on top.
        var z = this.container.children.length - 1;
        this.container.setChildIndex(this.text, z);
        this.updateCache();

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
                    } else {
                        if (block.name === 'nameddo' && block.defaults[0] === oldValue) {
                            blockPalette.remove(block, oldValue);
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
                // Check to see which connection we are using in
                // cblock.  We only do something if blk is attached to
                // the name connection (1).
                blk = this.blocks.blockList.indexOf(this);
                if (cblock.connections[1] === blk && closeInput) {
                    // If the label was the name of a storein, update the
                    // associated box this.blocks and the palette buttons.
                    if (this.value !== 'box') {
                        this.blocks.newStoreinBlock(this.value);
                        this.blocks.newStorein2Block(this.value);
                        this.blocks.newNamedboxBlock(this.value);
                    }

                    // Rename both box <- name and namedbox blocks.
                    this.blocks.renameBoxes(oldValue, newValue);
                    this.blocks.renameNamedboxes(oldValue, newValue);
                    this.blocks.renameStoreinBoxes(oldValue, newValue);
                    this.blocks.renameStorein2Boxes(oldValue, newValue);

                    this.blocks.palettes.hide();
                    this.blocks.palettes.updatePalettes('boxes');
                    this.blocks.palettes.show();
                }
                break;
            case 'setdrum':
            case 'playdrum':
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    if (newValue.slice(0, 4) === 'http') {
                        this.blocks.logo.synth.loadSynth(0, newValue);
                    }
                }
                break;
            default:
                break;
            }
        }

        // We are done changing the label, so unlock.
        this._labelLock = false;

        if (_THIS_IS_MUSIC_BLOCKS_) {
            // Load the synth for the selected drum.
            if (this.name === 'drumname') {
                this.blocks.logo.synth.loadSynth(0, getDrumSynthName(this.value));
            } else if (this.name === 'voicename') {
                this.blocks.logo.synth.loadSynth(0, getVoiceSynthName(this.value));
            } else if (this.name === 'noisename') {
                this.blocks.logo.synth.loadSynth(0, getNoiseSynthName(this.value));
            }
        }
    };

};


function $() {
    var elements = new Array();

    for (var i = 0; i < arguments.length; i++) {
        var element = arguments[i];
        if (typeof element === 'string') {
            element = docById(element);
        }

        if (arguments.length === 1) {
            return element;
        }

        elements.push(element);
    }

    return elements;
};


window.hasMouse = false;
// Mousemove is not emulated for touch
document.addEventListener('mousemove', function (e) {
    window.hasMouse = true;
});


function _blockMakeBitmap(data, callback, args) {
    // Async creation of bitmap from SVG data.
    // Works with Chrome, Safari, Firefox (untested on IE).
    var img = new Image();

    img.onload = function () {
        var bitmap = new createjs.Bitmap(img);
        callback(bitmap, args);
    };

    img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(data)));
};
