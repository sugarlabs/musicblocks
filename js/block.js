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
//

// Length of a long touch
const TEXTWIDTH = 240; // 90
const STRINGLEN = 9;
const LONGPRESSTIME = 1500;
const INLINECOLLAPSIBLES = ["newnote", "interval", "osctime"];
const COLLAPSIBLES = [
    "drum",
    "start",
    "action",
    "matrix",
    "pitchdrummatrix",
    "rhythmruler2",
    "timbre",
    "status",
    "pitchstaircase",
    "tempo",
    "pitchslider",
    "modewidget",
    "newnote",
    "musickeyboard",
    "temperament",
    "interval",
    "osctime"
];
const NOHIT = ["hidden", "hiddennoflow"];
const SPECIALINPUTS = [
    "text",
    "number",
    "solfege",
    "eastindiansolfege",
    "scaledegree2",
    "notename",
    "voicename",
    "modename",
    "drumname",
    "effectsname",
    "filtertype",
    "oscillatortype",
    "boolean",
    "intervalname",
    "invertmode",
    "accidentalname",
    "temperamentname",
    "noisename",
    "customNote",
    "grid",
    "outputtools"
];
const WIDENAMES = [
    "intervalname",
    "accidentalname",
    "drumname",
    "effectsname",
    "voicename",
    "modename",
    "temperamentname",
    "modename",
    "noisename",
    "outputtools"
];
const EXTRAWIDENAMES = [];
const PIEMENUS = [
    "solfege",
    "eastindiansolfege",
    "scaledegree2",
    "notename",
    "voicename",
    "drumname",
    "effectsname",
    "accidentalname",
    "invertmode",
    "boolean",
    "filtertype",
    "oscillatortype",
    "intervalname",
    "modename",
    "temperamentname",
    "noisename",
    "customNote",
    "grid",
    "outputtools"
];

// Define block instance objects and any methods that are intra-block.
function Block(protoblock, blocks, overrideName) {
    if (protoblock === null) {
        console.debug("null protoblock sent to Block");
        return;
    }

    this.protoblock = protoblock;
    this.name = protoblock.name;
    this.overrideName = overrideName;
    this.blocks = blocks;
    this.collapsed = false; // Is this collapsible block collapsed?
    this.inCollapsed = false; // Is this block in a collapsed stack?
    this.trash = false; // Is this block in the trash?
    this.loadComplete = false; // Has the block finished loading?
    this.label = null; // Editable textview in DOM.
    this.labelattr = null; // Editable textview in DOM.
    this.text = null; // A dynamically generated text label on block itself.
    this.value = null; // Value for number, text, and media blocks.
    this.privateData = null; // A block may have some private data,
    // e.g., nameboxes use this field to store
    // the box name associated with the block.
    this.image = protoblock.image; // The file path of the image.
    this.imageBitmap = null;
    this.controller = null; // Note blocks get a controller

    // All blocks have at a container and least one bitmap.
    this.container = null;
    this.bounds = null;
    this.width = 0;
    this.height = 0;
    this.hitHeight = 0;
    this.bitmap = null;
    this.highlightBitmap = null;
    this.disconnectedBitmap = null;
    this.disconnectedHighlightBitmap = null;

    // The svg from which the bitmaps are generated
    this.artwork = null;
    this.collapseArtwork = null;

    // Start and Action blocks has a collapse button
    this.collapseButtonBitmap = null;
    this.expandButtonBitmap = null;
    this.collapseBlockBitmap = null;
    this.highlightCollapseBlockBitmap = null;
    this.collapseText = null;

    this.size = 1; // Proto size is copied here.
    this.docks = []; // Proto dock is copied here.
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

    // Don't trigger notes on top of each other.
    this._triggerLock = false;

    // If we update the parameters of a meter block, we have extra
    // actions to attend to.
    this._check_meter_block = null;

    // Mouse position in events
    this.original = { x: 0, y: 0 };
    this.offset = { x: 0, y: 0 };

    // Internal function for creating cache.
    // Includes workaround for a race condition.
    this._createCache = function(callback, args) {
        let that = this;
        return new Promise(function(resolve, reject) {
            let loopCount = 0;

            async function checkBounds(counter) {
                try {
                    if (counter !== undefined) {
                        loopCount = counter;
                    }
                    if (loopCount > 3) {
                        throw new Error("COULD NOT CREATE CACHE");
                    }

                    that.bounds = that.container.getBounds();

                    if (that.bounds === null) {
                        await delayExecution(100);
                        that.regenerateArtwork(true, []);
                        checkBounds(loopCount + 1);
                    } else {
                        that.container.cache(
                            that.bounds.x,
                            that.bounds.y,
                            that.bounds.width,
                            that.bounds.height
                        );
                        callback(that, args);
                        resolve();
                    }
                } catch (e) {
                    reject(e);
                }
            }
            checkBounds();
        });
    };

    // Internal function for updating the cache.
    // Includes workaround for a race condition.
    this.updateCache = function(counter) {
        let that = this;
        return new Promise(function(resolve, reject) {
            let loopCount = 0;

            async function updateBounds(counter) {
                try {
                    if (counter !== undefined) {
                        loopCount = counter;
                    }

                    if (loopCount > 3) {
                        throw new Error("COULD NOT UPDATE CACHE");
                    }

                    if (that.bounds == null) {
                        updateBounds(loopCount + 1);
                        await that.pause(200);
                    } else {
                        that.container.updateCache();
                        that.blocks.refreshCanvas();
                        resolve();
                    }
                } catch (e) {
                    reject(e);
                }
            }
            updateBounds();
        });
    };

    this.ignore = function() {
        if (this.bitmap === null) {
            return true;
        }

        if (this.name === "hidden") {
            return true;
        }

        if (this.name === "hiddennoflow") {
            return true;
        }

        if (this.trash) {
            return true;
        }

        if (this.inCollapsed) {
            return true;
        }

        if (
            this.disconnectedBitmap !== null &&
            this.disconnectedHighlightBitmap !== null
        ) {
            if (
                !this.bitmap.visible &&
                !this.highlightBitmap.visible &&
                !this.disconnectedBitmap.visible &&
                !this.disconnectedHighlightBitmap.visible
            ) {
                if (this.collapseBlockBitmap === null) {
                    return true;
                } else if (
                    !this.collapseBlockBitmap.visible &&
                    !this.highlightCollapseBlockBitmap.visible
                ) {
                    return true;
                }
            }
        } else {
            if (!this.bitmap.visible && !this.highlightBitmap.visible) {
                if (this.collapseBlockBitmap === null) {
                    return true;
                } else if (
                    !this.collapseBlockBitmap.visible &&
                    !this.highlightCollapseBlockBitmap.visible
                ) {
                    return true;
                }
            }
        }

        return false;
    };

    this.offScreen = function(boundary) {
        return (
            !this.trash &&
            boundary.offScreen(this.container.x, this.container.y)
        );
    };

    this.copySize = function() {
        this.size = this.protoblock.size;
    };

    this.getInfo = function() {
        return this.name + " block";
    };

    this.isCollapsible = function() {
        return COLLAPSIBLES.indexOf(this.name) !== -1;
    };

    this.isInlineCollapsible = function() {
        return INLINECOLLAPSIBLES.indexOf(this.name) !== -1;
    };

    /*
     * Show the highlight artwork
     * @return{void}
     * @public
     */
    this.highlight = function() {
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

        if (this.disconnectedBitmap !== null) {
            if (!this.bitmap.visible && !this.disconnectedBitmap.visible) {
                // block is hidden, so do nothing.
                return;
            }
        } else if (!this.bitmap.visible) {
            return;
        }

        // Always hide the non-highlighted artwork.
        this.container.visible = true;
        this.bitmap.visible = false;
        if (this.disconnectedBitmap !== null) {
            this.disconnectedBitmap.visible = false;
        }

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
            if (this.disconnectedHighlightBitmap !== null) {
                this.disconnectedHighlightBitmap.visible = false;
            }

            this.highlightBitmap.visible = false;
        } else {
            // Show the highlighted artwork.
            // If the block is disconnected, use the disconnected bitmap.
            if (this.isDisconnected()) {
                this.disconnectedHighlightBitmap.visible = true;
                this.highlightBitmap.visible = false;
            } else {
                if (this.disconnectedHighlightBitmap !== null) {
                    this.disconnectedHighlightBitmap.visible = false;
                }

                this.highlightBitmap.visible = true;
            }

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

    /*
     * Remove highlight from block
     * @return{void}
     * @public
     */
    this.unhighlight = function() {
        if (this.trash) {
            return;
        }

        if (this.inCollapsed) {
            // In collapsed, so do nothing.
            return;
        }

        if (this.bitmap === null) {
            console.debug("bitmap not ready");
            return;
        }

        // Always hide the highlighted artwork.
        this.highlightBitmap.visible = false;
        if (this.disconnectedHighlightBitmap !== null) {
            this.disconnectedHighlightBitmap.visible = false;
        }

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
            // If the block is disconnected, use the disconnected bitmap.
            if (this.isDisconnected()) {
                this.disconnectedBitmap.visible = true;
                this.bitmap.visible = false;
            } else {
                if (this.disconnectedBitmap !== null) {
                    this.disconnectedBitmap.visible = false;
                }

                this.bitmap.visible = true;
            }

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

    /*
     * Resize and update number of slots in argClamp
     * @param-slotList how many slots to use
     * @return{void}
     * @public
     */
    this.updateArgSlots = function(slotList) {
        this.argClampSlots = slotList;
        this._newArtwork();
        this.regenerateArtwork(false);
    };

    /*
     * Resize an expandable block.
     * @param-clamp which clamp to update (ifthenelse has 2 clamps)
     * @param-plusMinus how many slots to add or subtract
     * @return{void}
     * @public
     */
    this.updateSlots = function(clamp, plusMinus) {
        this.clampCount[clamp] += plusMinus;
        this._newArtwork(plusMinus);
        this.regenerateArtwork(false);
    };

    /*
     * If the block scale changes, we need to regenerate the
     * artwork and recalculate the hitarea.
     * @param-scale new block scale
     * @return{void}
     * @public
     */
    this.resize = function(scale) {
        let that = this;

        /*
         * After the new artwork is created, this function is used to add
         * decorations.
         * @param-that = this
         * @return{void}
         * @public
         */
        this.postProcess = function(that) {
            if (that.imageBitmap !== null) {
                that._positionMedia(
                    that.imageBitmap,
                    that.imageBitmap.image.width,
                    that.imageBitmap.image.height,
                    scale
                );
                z = that.container.children.length - 1;
                that.container.setChildIndex(that.imageBitmap, z);
            }

            if (that.name === "start" || that.name === "drum") {
                // Rescale the decoration on the start blocks.
                for (
                    let turtle = 0;
                    turtle < that.blocks.turtles.turtleList.length;
                    turtle++
                ) {
                    if (
                        that.blocks.turtles.turtleList[turtle].startBlock
                            === that
                    ) {
                        that.blocks.turtles.turtleList[turtle].resizeDecoration(
                            scale,
                            that.bitmap.image.width
                        );
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
            that = this;

            /*
             * After new buttons are creates, they are cached and a
             * new hit are is calculated
             * @param-that = this = container
             * @return{void}
             * @private
             */
            let _postProcess = function(that) {
                that.collapseButtonBitmap.scaleX = that.collapseButtonBitmap.scaleY = that.collapseButtonBitmap.scale =
                    scale / 3;
                that.expandButtonBitmap.scaleX = that.expandButtonBitmap.scaleY = that.expandButtonBitmap.scale =
                    scale / 3;

                that.updateCache();
                that._calculateBlockHitArea();
            };

            if (this.isCollapsible()) {
                this._generateCollapseArtwork(_postProcess);
                let fontSize = 10 * scale;
                this.collapseText.font = fontSize + "px Sans";
                this._positionCollapseLabel(scale);
            }
        }
    };

    /*
     * Create new artwork for a block
     * @param-plusMinus specifies how much a clamp block expands or contracts
     * @return{void}
     * @private
     */
    this._newArtwork = function(plusMinus) {
        let proto, obj;
        if (this.isInlineCollapsible()) {
            proto = new ProtoBlock("collapse-note");
            proto.scale = this.protoblock.scale;
            if (this.name === "interval") {
                proto.extraWidth = 80;
            } else {
                proto.extraWidth = 40;
            }
            proto.zeroArgBlock();
            obj = proto.generator();
            this.collapseArtwork = obj[0];
            obj = this.protoblock.generator(this.clampCount[0]);
        } else if (this.isCollapsible()) {
            proto = new ProtoBlock("collapse");
            proto.scale = this.protoblock.scale;
            proto.extraWidth = 40;
            proto.basicBlockCollapsed();
            obj = proto.generator();
            this.collapseArtwork = obj[0];
            obj = this.protoblock.generator(this.clampCount[0]);
        } else if (this.name === "ifthenelse") {
            obj = this.protoblock.generator(
                this.clampCount[0],
                this.clampCount[1]
            );
        } else if (this.protoblock.style === "clamp") {
            obj = this.protoblock.generator(this.clampCount[0]);
        } else if (this.protoblock.style === "argflowclamp") {
            obj = this.protoblock.generator(this.clampCount[0]);
        } else {
            switch (this.name) {
                case "equal":
                case "greater":
                case "less":
                    obj = this.protoblock.generator(this.clampCount[0]);
                    break;
                case "makeblock":
                case "calcArg":
                case "doArg":
                case "namedcalcArg":
                case "nameddoArg":
                    obj = this.protoblock.generator(this.argClampSlots);
                    this.size = 2;
                    for (let i = 0; i < this.argClampSlots.length; i++) {
                        this.size += this.argClampSlots[i];
                    }
                    this.docks = [];
                    this.docks.push([
                        obj[1][0][0],
                        obj[1][0][1],
                        this.protoblock.dockTypes[0]
                    ]);
                    break;
                default:
                    if (this.isArgBlock()) {
                        obj = this.protoblock.generator(this.clampCount[0]);
                    } else if (this.isTwoArgBlock()) {
                        obj = this.protoblock.generator(this.clampCount[0]);
                    } else {
                        obj = this.protoblock.generator();
                    }
                    this.size += plusMinus;
                    break;
            }
        }

        switch (this.name) {
            case "nameddoArg":
                for (let i = 1; i < obj[1].length - 1; i++) {
                    this.docks.push([obj[1][i][0], obj[1][i][1], "anyin"]);
                }

                this.docks.push([obj[1][2][0], obj[1][2][1], "in"]);
                break;
            case "namedcalcArg":
                for (let i = 1; i < obj[1].length; i++) {
                    this.docks.push([obj[1][i][0], obj[1][i][1], "anyin"]);
                }
                break;
            case "doArg":
                this.docks.push([
                    obj[1][1][0],
                    obj[1][1][1],
                    this.protoblock.dockTypes[1]
                ]);
                for (let i = 2; i < obj[1].length - 1; i++) {
                    this.docks.push([obj[1][i][0], obj[1][i][1], "anyin"]);
                }

                this.docks.push([obj[1][3][0], obj[1][3][1], "in"]);
                break;
            case "makeblock":
            case "calcArg":
                this.docks.push([
                    obj[1][1][0],
                    obj[1][1][1],
                    this.protoblock.dockTypes[1]
                ]);
                for (let i = 2; i < obj[1].length; i++) {
                    this.docks.push([obj[1][i][0], obj[1][i][1], "anyin"]);
                }
                break;
            default:
                break;
        }

        // Save new artwork and dock positions.
        this.artwork = obj[0];
        for (let i = 0; i < this.docks.length; i++) {
            this.docks[i][0] = obj[1][i][0];
            this.docks[i][1] = obj[1][i][1];
        }

        this.width = obj[2];
        this.height = obj[3];
        this.hitHeight = obj[4];
    };

    /*
     * Load any artwork associated with the block and create any
     * extra parts. Image components are loaded asynchronously so
     * most the work happens in callbacks.
     *
     * We also need a text label for some blocks. For number and
     * text blocks, this is the primary label; for parameter
     * blocks, this is used to display the current block value.
     * @return{void}
     * @public
     */
    this.imageLoad = function() {
        let fontSize = 10 * this.protoblock.scale;
        this.text = new createjs.Text(
            "",
            fontSize + "px Sans",
            platformColor.blockText
        );

        this.generateArtwork(true, []);
    };

    /*
     * Add an image to a block
     * @return{void}
     * @private
     */
    this._addImage = function() {
        let image = new Image();
        let that = this;

        /*
         * The loader
         * @return{void}
         * @private
         */
        image.onload = function() {
            let bitmap = new createjs.Bitmap(image);
            bitmap.name = "media";
            that.container.addChild(bitmap);
            that._positionMedia(
                bitmap,
                image.width,
                image.height,
                that.protoblock.scale
            );
            that.imageBitmap = bitmap;
            that.updateCache();
        };

        image.src = this.image;
    };

    /*
     * Sometimes (in the case of namedboxes and nameddos) we need
     * to regenerate the artwork associated with a block.
     * @param-is the collapse artwork also generated?
     * @return{void}
     * @public
     */
    this.regenerateArtwork = function(collapse) {
        // First we need to remove the old artwork.
        if (this.bitmap != null) {
            this.container.removeChild(this.bitmap);
        }

        if (this.highlightBitmap != null) {
            this.container.removeChild(this.highlightBitmap);
        }

        if (this.disconnectedBitmap != null) {
            this.container.removeChild(this.disconnectedBitmap);
        }

        if (this.disconnectedHighlightBitmap != null) {
            this.container.removeChild(this.disconnectedHighlightBitmap);
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

    /*
     * Generate the artwork for a block.
     * @param-the first time, add the event handlers
     * @return{void}
     * @public
     */
    this.generateArtwork = function(firstTime) {
        // Get the block labels from the protoblock.
        let that = this;
        let thisBlock = this.blocks.blockList.indexOf(this);
        let block_label = "";

        // Create the highlight bitmap for the block.
        let __processHighlightBitmap = function(bitmap, that) {
            if (that.highlightBitmap != null) {
                that.container.removeChild(that.highlightBitmap);
            }

            that.highlightBitmap = bitmap;
            that.container.addChild(that.highlightBitmap);
            that.highlightBitmap.x = 0;
            that.highlightBitmap.y = 0;
            that.highlightBitmap.name = "bmp_highlight_" + thisBlock;
            if (!that.blocks.logo.runningLilypond) {
                that.highlightBitmap.cursor = "pointer";
            }
            // Hide highlight bitmap to start.
            that.highlightBitmap.visible = false;

            // At me point, it should be safe to calculate the
            // bounds of the container and cache its contents.
            if (!firstTime) {
                that.container.uncache();
            }

            __callback = function(that, firstTime) {
                that.blocks.refreshCanvas();
                let thisBlock = that.blocks.blockList.indexOf(that);

                if (firstTime) {
                    that._loadEventHandlers();
                    if (that.image !== null) {
                        that._addImage();
                    }

                    that._finishImageLoad();
                } else {
                    if (that.isCollapsible()) {
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

        // Create the disconnect highlight bitmap for the block.
        let __processDisconnectedHighlightBitmap = function(bitmap, that) {
            if (that.disconnectedHighlightBitmap != null) {
                that.container.removeChild(that.disconnectedHighlightBitmap);
            }

            that.disconnectedHighlightBitmap = bitmap;
            that.container.addChild(that.disconnectedHighlightBitmap);
            that.disconnectedHighlightBitmap.x = 0;
            that.disconnectedHighlightBitmap.y = 0;
            that.disconnectedHighlightBitmap.name =
                "bmp_disconnect_hightlight_" + thisBlock;
            if (!that.blocks.logo.runningLilypond) {
                that.disconnectedHighlightBitmap.cursor = "pointer";
            }
            // Hide disconnected bitmap to start.
            that.disconnectedHighlightBitmap.visible = false;
            let artwork;
            if (that.protoblock.disabled) {
                artwork = that.artwork
                    .replace(/fill_color/g, DISABLEDFILLCOLOR)
                    .replace(/stroke_color/g, DISABLEDSTROKECOLOR)
                    .replace("block_label", safeSVG(block_label));
            } else {
                artwork = that.artwork
                    .replace(
                        /fill_color/g,
                        PALETTEHIGHLIGHTCOLORS[that.protoblock.palette.name]
                    )
                    .replace(
                        /stroke_color/g,
                        HIGHLIGHTSTROKECOLORS[that.protoblock.palette.name]
                    )
                    .replace("block_label", safeSVG(block_label));
            }

            for (let i = 1; i < that.protoblock.staticLabels.length; i++) {
                artwork = artwork.replace(
                    "arg_label_" + i,
                    that.protoblock.staticLabels[i]
                );
            }

            _blockMakeBitmap(artwork, __processHighlightBitmap, that);
        };

        // Create the disconnect bitmap for the block.
        let __processDisconnectedBitmap = function(bitmap, that) {
            if (that.disconnectedBitmap != null) {
                that.container.removeChild(that.disconnectedBitmap);
            }

            that.disconnectedBitmap = bitmap;
            that.container.addChild(that.disconnectedBitmap);
            that.disconnectedBitmap.x = 0;
            that.disconnectedBitmap.y = 0;
            that.disconnectedBitmap.name = "bmp_disconnect_" + thisBlock;
            if (!that.blocks.logo.runningLilypond) {
                that.disconnectedBitmap.cursor = "pointer";
            }
            // Hide disconnected bitmap to start.
            that.disconnectedBitmap.visible = false;
            let artwork;
            if (that.protoblock.disabled) {
                artwork = that.artwork
                    .replace(/fill_color/g, DISABLEDFILLCOLOR)
                    .replace(/stroke_color/g, DISABLEDSTROKECOLOR)
                    .replace("block_label", safeSVG(block_label));
            } else {
                artwork = that.artwork
                    .replace(
                        /fill_color/g,
                        platformColor.paletteColors[
                            that.protoblock.palette.name
                            ][3]
                    )
                    .replace(
                        /stroke_color/g,
                        HIGHLIGHTSTROKECOLORS[that.protoblock.palette.name]
                    )
                    .replace("block_label", safeSVG(block_label));
            }

            for (let i = 1; i < that.protoblock.staticLabels.length; i++) {
                artwork = artwork.replace(
                    "arg_label_" + i,
                    that.protoblock.staticLabels[i]
                );
            }

            _blockMakeBitmap(
                artwork,
                __processDisconnectedHighlightBitmap,
                that
            );
        };

        // Create the bitmap for the block.
        let __processBitmap = function(bitmap, that) {
            if (that.bitmap != null) {
                that.container.removeChild(that.bitmap);
            }

            that.bitmap = bitmap;
            that.container.addChild(that.bitmap);
            that.bitmap.x = 0;
            that.bitmap.y = 0;
            that.bitmap.name = "bmp_" + thisBlock;
            that.bitmap.cursor = "pointer";
            that.blocks.refreshCanvas();
            let artwork;
            if (that.protoblock.disabled) {
                artwork = that.artwork
                    .replace(/fill_color/g, DISABLEDFILLCOLOR)
                    .replace(/stroke_color/g, DISABLEDSTROKECOLOR)
                    .replace("block_label", safeSVG(block_label));
            } else {
                artwork = that.artwork
                    .replace(/fill_color/g, platformColor.disconnected)
                    .replace(
                        /stroke_color/g,
                        HIGHLIGHTSTROKECOLORS[that.protoblock.palette.name]
                    )
                    .replace("block_label", safeSVG(block_label));
            }

            for (let i = 1; i < that.protoblock.staticLabels.length; i++) {
                artwork = artwork.replace(
                    "arg_label_" + i,
                    that.protoblock.staticLabels[i]
                );
            }

            _blockMakeBitmap(artwork, __processDisconnectedBitmap, that);
        };

        if (this.overrideName && this.name !== "outputtools") {
            if (
                [
                    "namedbox",
                    "storein2",
                    "nameddo",
                    "nameddoArg",
                    "namedcalc",
                    "namedcalcArg"
                ].indexOf(this.name) !== -1
            ) {
                block_label = this.overrideName;
                if (getTextWidth(block_label, "bold 20pt Sans") > TEXTWIDTH) {
                    block_label =
                        " " + block_label.substr(0, STRINGLEN) + "...";
                }
            } else {
                block_label = this.overrideName;
            }
        } else if (
            this.protoblock.staticLabels.length > 0 &&
            !this.protoblock.image
        ) {
            // Label should be defined inside _().
            block_label = this.protoblock.staticLabels[0];
        }

        while (this.protoblock.staticLabels.length < this.protoblock.args + 1) {
            this.protoblock.staticLabels.push("");
        }

        if (firstTime) {
            // Create artwork and dock.
            this.protoblock.scale = this.blocks.blockScale;

            let obj = this.protoblock.generator();
            this.artwork = obj[0];
            for (let i = 0; i < obj[1].length; i++) {
                this.docks.push([
                    obj[1][i][0],
                    obj[1][i][1],
                    this.protoblock.dockTypes[i]
                ]);
            }

            this.width = obj[2];
            this.height = obj[3];
            this.hitHeight = obj[4];
        }
        let artwork;
        if (this.protoblock.disabled) {
            artwork = this.artwork
                .replace(/fill_color/g, DISABLEDFILLCOLOR)
                .replace(/stroke_color/g, DISABLEDSTROKECOLOR)
                .replace("block_label", safeSVG(block_label));
        } else {
            artwork = this.artwork
                .replace(
                    /fill_color/g,
                    PALETTEFILLCOLORS[this.protoblock.palette.name]
                )
                .replace(
                    /stroke_color/g,
                    PALETTESTROKECOLORS[this.protoblock.palette.name]
                )
                .replace("block_label", safeSVG(block_label));
        }

        for (let i = 1; i < this.protoblock.staticLabels.length; i++) {
            artwork = artwork.replace(
                "arg_label_" + i,
                this.protoblock.staticLabels[i]
            );
        }

        that.blocks.blockArt[that.blocks.blockList.indexOf(that)] = artwork;

        _blockMakeBitmap(artwork, __processBitmap, this);
    };

    /*
     * After the block artwork has loaded, update labels, etc.
     * @return{void}
     * @private
     */
    this._finishImageLoad = function() {
        let thisBlock = this.blocks.blockList.indexOf(this);
        let proto, obj, label, attr;
        // Value blocks get a modifiable text label.
        if (SPECIALINPUTS.indexOf(this.name) !== -1) {
            if (this.value == null) {
                switch (this.name) {
                    case "text":
                        this.value = "---";
                        break;
                    case "solfege":
                    case "eastindiansolfege":
                        this.value = "sol";
                        break;
                    case "scaledegree2":
                        this.value = "5";
                        break;
                    case "customNote":
                        let len = this.blocks.logo.synth.startingPitch.length;
                        this.value =
                            this.blocks.logo.synth.startingPitch.substring(
                                0,
                                len - 1
                            ) + "(+0)";
                        break;
                    case "notename":
                        this.value = "G";
                        break;
                    case "rest":
                        this.value = "rest";
                        break;
                    case "boolean":
                        this.value = true;
                        break;
                    case "number":
                        this.value = NUMBERBLOCKDEFAULT;
                        break;
                    case "modename":
                        this.value = DEFAULTMODE;
                        break;
                    case "accidentalname":
                        this.value = DEFAULTACCIDENTAL;
                        break;
                    case "intervalname":
                        this.value = DEFAULTINTERVAL;
                        break;
                    case "invertmode":
                        this.value = DEFAULTINVERT;
                        break;
                    case "voicename":
                        this.value = DEFAULTVOICE;
                        break;
                    case "noisename":
                        this.value = DEFAULTNOISE;
                        break;
                    case "drumname":
                        this.value = DEFAULTDRUM;
                        break;
                    case "effectsname":
                        this.value = DEFAULTEFFECT;
                        break;
                    case "filtertype":
                        this.value = DEFAULTFILTERTYPE;
                        break;
                    case "oscillatortype":
                        this.value = DEFAULTOSCILLATORTYPE;
                        break;
                    case "temperamentname":
                        this.value = "equal";
                        break;
                    case "grid":
                        this.value = "Cartesian";
                        break;
                }
            }

            if (this.name === "solfege") {
                obj = splitSolfege(this.value);
                label = i18nSolfege(obj[0]);
                attr = obj[1];

                if (attr !== "♮") {
                    label += attr;
                }
            } else if (this.name === "eastindiansolfege") {
                obj = splitSolfege(this.value);
                label = WESTERN2EISOLFEGENAMES[obj[0]];
                attr = obj[1];

                if (attr !== "♮") {
                    label += attr;
                }
            } else if(this.name === "scaledegree2") {
                obj = splitScaleDegree(this.value);
                label = obj[0];
                attr = obj[1];

                if(attr !== "♮") {
                    label += attr;
                }
            } else if (this.name === "drumname") {
                label = getDrumName(this.value);
            } else if (this.name === "noisename") {
                label = getNoiseName(this.value);
            } else if (this.name === "outputtools") {
                label = this.overrideName;
            } else {
                if (this.value !== null) {
                    label = this.value.toString();
                } else {
                    label = "???";
                }
            }

            if (
                WIDENAMES.indexOf(this.name) === -1 &&
                getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH
            ) {
                label = label.substr(0, STRINGLEN) + "...";
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

            // this.blocks.refreshCanvas();
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
                proto = new ProtoBlock("collapse-note");
                proto.scale = this.protoblock.scale;
                if (this.name === "interval") {
                    proto.extraWidth = 80;
                } else {
                    proto.extraWidth = 40;
                }
                proto.zeroArgBlock();
            } else {
                proto = new ProtoBlock("collapse");
                proto.scale = this.protoblock.scale;
                proto.extraWidth = 40;
                proto.basicBlockCollapsed();
            }

            obj = proto.generator();
            this.collapseArtwork = obj[0];

            let postProcess = function(that) {
                // that._loadCollapsibleEventHandlers();
                that.loadComplete = true;

                if (that.postProcess !== null) {
                    that.postProcess(that.postProcessArg);
                    that.postProcess = null;
                }

                // if (that.name !== 'text')
                // if (that.isCollapsible())
                //     that.unhighlight();
            };

            if (this.isCollapsible()) {
                this._generateCollapseArtwork(postProcess);
            }
        }

        // this.blocks.refreshCanvas();
        // stage.update();
    };

    /*
     * Generate the collapsed artwork
     * @param postProcess = a process to run after the artwork is generated
     * @return{void}
     * @private
     */
    this._generateCollapseArtwork = function(postProcess) {
        let that = this;
        let thisBlock = this.blocks.blockList.indexOf(this);

        /*
         * Run the postprocess function after the artwork is loaded
         * @return{void}
         * @private
         */
        let __finishCollapse = function(that) {
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

        /*
         * Create the artwork for the collapse buttons
         * @param - that = this
         * @return{void}
         * @private
         */
        let __processCollapseButton = function(that) {
            let image = new Image();
            image.onload = function() {
                that.collapseButtonBitmap = new createjs.Bitmap(image);
                that.collapseButtonBitmap.scaleX = that.collapseButtonBitmap.scaleY = that.collapseButtonBitmap.scale =
                    that.protoblock.scale / 3;

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

            image.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(COLLAPSEBUTTON)));
        };

        /*
         * Create the artwork for the expand buttons
         * @param - that = this
         * @return{void}
         * @private
         */
        let __processExpandButton = function(that) {
            let image = new Image();
            image.onload = function() {
                that.expandButtonBitmap = new createjs.Bitmap(image);
                that.expandButtonBitmap.scaleX = that.expandButtonBitmap.scaleY = that.expandButtonBitmap.scale =
                    that.protoblock.scale / 3;

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

            image.src =
                "data:image/svg+xml;base64," +
                window.btoa(unescape(encodeURIComponent(EXPANDBUTTON)));
        };

        /*
         * Processing the highlighted collapsed image
         * @param-bitmap = highlight artwork
         * @param-that = this
         * @return{void}
         * @private
         */
        let __processHighlightCollapseBitmap = function(bitmap, that) {
            that.highlightCollapseBlockBitmap = bitmap;
            that.highlightCollapseBlockBitmap.name =
                "highlight_collapse_" + thisBlock;
            that.container.addChild(that.highlightCollapseBlockBitmap);
            that.highlightCollapseBlockBitmap.visible = false;

            if (that.collapseText === null) {
                let fontSize = 10 * that.protoblock.scale;
                switch (that.name) {
                    case "action":
                        that.collapseText = new createjs.Text(
                            _("action"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "start":
                        that.collapseText = new createjs.Text(
                            _("start"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "matrix":
                        that.collapseText = new createjs.Text(
                            _("matrix"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "status":
                        that.collapseText = new createjs.Text(
                            _("status"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "pitchdrummatrix":
                        that.collapseText = new createjs.Text(
                            _("drum mapper"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "rhythmruler":
                        that.collapseText = new createjs.Text(
                            _("ruler"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "timbre":
                        that.collapseText = new createjs.Text(
                            _("timbre"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "pitchstaircase":
                        that.collapseText = new createjs.Text(
                            _("stair"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "tempo":
                        that.collapseText = new createjs.Text(
                            _("tempo"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "modewidget":
                        that.collapseText = new createjs.Text(
                            _("mode"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "pitchslider":
                        that.collapseText = new createjs.Text(
                            _("slider"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "musickeyboard":
                        that.collapseText = new createjs.Text(
                            _("keyboard"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "drum":
                        that.collapseText = new createjs.Text(
                            _("drum"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "rhythmruler2":
                        that.collapseText = new createjs.Text(
                            _("rhythm maker"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "newnote":
                        that.collapseText = new createjs.Text(
                            _("note value"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "interval":
                        that.collapseText = new createjs.Text(
                            _("scalar interval"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "osctime":
                        that.collapseText = new createjs.Text(
                            _("milliseconds"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "temperament":
                        that.collapseText = new createjs.Text(
                            _("temperament"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    default:
                        that.collapseText = new createjs.Text(
                            "foobar",
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                }

                that.collapseText.textAlign = "left";
                that.collapseText.textBaseline = "alphabetic";
                that.container.addChild(that.collapseText);
            }

            that._positionCollapseLabel(that.protoblock.scale);
            that.collapseText.visible = that.collapsed;
            that._ensureDecorationOnTop();

            // Save the collapsed block artwork for export.
            that.blocks.blockCollapseArt[
                that.blocks.blockList.indexOf(that)
                ] = that.collapseArtwork
                .replace(
                    /fill_color/g,
                    PALETTEFILLCOLORS[that.protoblock.palette.name]
                )
                .replace(
                    /stroke_color/g,
                    PALETTESTROKECOLORS[that.protoblock.palette.name]
                )
                .replace("block_label", safeSVG(that.collapseText.text));

            __processExpandButton(that);
        };

        /*
         * Processing the collapsed block
         * @param-bitmap = block artwork
         * @param-that = this
         * @return{void}
         * @private
         */
        let __processCollapseBitmap = function(bitmap, that) {
            that.collapseBlockBitmap = bitmap;
            that.collapseBlockBitmap.name = "collapse_" + thisBlock;
            that.container.addChild(that.collapseBlockBitmap);
            that.collapseBlockBitmap.visible = that.collapsed;
            that.blocks.refreshCanvas();

            let artwork = that.collapseArtwork;
            _blockMakeBitmap(
                artwork
                    .replace(
                        /fill_color/g,
                        PALETTEHIGHLIGHTCOLORS[that.protoblock.palette.name]
                    )
                    .replace(
                        /stroke_color/g,
                        HIGHLIGHTSTROKECOLORS[that.protoblock.palette.name]
                    )
                    .replace("block_label", ""),
                __processHighlightCollapseBitmap,
                that
            );
        };

        let artwork = this.collapseArtwork
            .replace(
                /fill_color/g,
                PALETTEFILLCOLORS[this.protoblock.palette.name]
            )
            .replace(
                /stroke_color/g,
                PALETTESTROKECOLORS[this.protoblock.palette.name]
            )
            .replace("block_label", "");
        _blockMakeBitmap(artwork, __processCollapseBitmap, this);
    };

    /*
     * Hide this block
     * @return{void}
     * @public
     */
    this.hide = function() {
        this.container.visible = false;
        if (this.isCollapsible()) {
            this.collapseText.visible = false;
            this.expandButtonBitmap.visible = false;
            this.collapseButtonBitmap.visible = false;
        }

        this.updateCache();
        this.blocks.refreshCanvas();
    };

    /*
     * Is this block disconnected from other blocks?
     * @return{boolean} true if the block is disconnected from other blocks
     * @public
     */
    this.isDisconnected = function() {
        if (this.disconnectedBitmap === null) {
            return false;
        }

        if (this.connections[0] !== null) {
            return false;
        }

        if (COLLAPSIBLES.indexOf(this.name) !== -1) {
            if (INLINECOLLAPSIBLES.indexOf(this.name) === -1) {
                return false;
            }
        }

        if (this.isArgBlock()) {
            return true;
        }

        if (last(this.connections) === null) {
            return true;
        }

        if (this.blocks.blockList[last(this.connections)].name === "hidden") {
            if (
                last(
                    this.blocks.blockList[last(this.connections)].connections
                ) === null
            ) {
                return true;
            }
        }

        return false;
    };

    /*
     * Show this block
     * @return{void}
     * @public
     */
    this.show = function() {
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
                    if (this.disconnectedBitmap !== null) {
                        this.disconnectedBitmap.visible = false;
                    }

                    if (this.disconnectedHighlightBitmap !== null) {
                        this.disconnectedHighlightBitmap.visible = false;
                    }
                } else {
                    // If the block is disconnected, use the disconnected bitmap.
                    if (this.isDisconnected()) {
                        this.disconnectedBitmap.visible = true;
                        this.bitmap.visible = false;
                    } else {
                        if (this.disconnectedBitmap !== null) {
                            this.disconnectedBitmap.visible = false;
                        }

                        this.bitmap.visible = true;
                    }

                    this.highlightBitmap.visible = false;
                    if (this.disconnectedHighlightBitmap !== null) {
                        this.disconnectedHighlightBitmap.visible = false;
                    }

                    this.collapseBlockBitmap.visible = false;
                    this.highlightCollapseBlockBitmap.visible = false;
                    this.collapseText.visible = false;
                    this.expandButtonBitmap.visible = false;
                    this.collapseButtonBitmap.visible = true;
                }
            } else {
                // If the block is disconnected, use the disconnected bitmap.
                if (this.isDisconnected()) {
                    this.disconnectedBitmap.visible = true;
                    this.bitmap.visible = false;
                } else {
                    if (this.disconnectedBitmap !== null) {
                        this.disconnectedBitmap.visible = false;
                    }

                    this.bitmap.visible = true;
                }

                this.highlightBitmap.visible = false;
                if (this.disconnectedHighlightBitmap !== null) {
                    this.disconnectedHighlightBitmap.visible = false;
                }
            }

            this.updateCache();
            this.blocks.refreshCanvas();
        }
    };

    // Utility functions
    this.isValueBlock = function() {
        return this.protoblock.style === "value";
    };

    this.isNoHitBlock = function() {
        return NOHIT.indexOf(this.name) !== -1;
    };

    this.isArgBlock = function() {
        return (
            this.protoblock.style === "value" || this.protoblock.style === "arg"
        );
    };

    this.isTwoArgBlock = function() {
        return this.protoblock.style === "twoarg";
    };

    this.isTwoArgBooleanBlock = function() {
        return ["equal", "greater", "less"].indexOf(this.name) !== -1;
    };

    this.isClampBlock = function() {
        return (
            this.protoblock.style === "clamp" ||
            this.isDoubleClampBlock() ||
            this.isArgFlowClampBlock()
        );
    };

    this.isArgFlowClampBlock = function() {
        return this.protoblock.style === "argflowclamp";
    };

    this.isLeftClampBlock = function() {
        return this.protoblock.isLeftClamp;
    };

    this.isDoubleClampBlock = function() {
        return this.protoblock.style === "doubleclamp";
    };

    this.isNoRunBlock = function() {
        return this.name === "action";
    };

    this.isArgClamp = function() {
        return (
            this.protoblock.style === "argclamp" ||
            this.protoblock.style === "argclamparg"
        );
    };

    this.isExpandableBlock = function() {
        return this.protoblock.expandable;
    };

    this.getBlockId = function() {
        // Generate a UID based on the block index into the blockList.
        let number = blockBlocks.blockList.indexOf(this);
        return "_" + number.toString();
    };

    this.removeChildBitmap = function(name) {
        for (let child = 0; child < this.container.children.length; child++) {
            if (this.container.children[child].name === name) {
                this.container.removeChild(this.container.children[child]);
                break;
            }
        }
    };

    this.loadThumbnail = function(imagePath) {
        // Load an image thumbnail onto block.
        let thisBlock = this.blocks.blockList.indexOf(this);
        let that = this;
        if (
            this.blocks.blockList[thisBlock].value === null &&
            imagePath === null
        ) {
            return;
        }
        let image = new Image();

        image.onload = function() {
            // Before adding new artwork, remove any old artwork.
            that.removeChildBitmap("media");

            let bitmap = new createjs.Bitmap(image);
            bitmap.name = "media";

            let myContainer = new createjs.Container();
            myContainer.addChild(bitmap);

            // Resize the image to a reasonable maximum.
            let MAXWIDTH = 600;
            let MAXHEIGHT = 450;
            if (image.width > image.height) {
                if (image.width > MAXWIDTH) {
                    bitmap.scaleX = bitmap.scaleY = bitmap.scale =
                        MAXWIDTH / image.width;
                }
            } else {
                if (image.height > MAXHEIGHT) {
                    bitmap.scaleX = bitmap.scaleY = bitmap.scale =
                        MAXHEIGHT / image.height;
                }
            }

            let bounds = myContainer.getBounds();
            myContainer.cache(bounds.x, bounds.y, bounds.width, bounds.height);
            that.value = myContainer.bitmapCache.getCacheDataURL();
            that.imageBitmap = bitmap;

            // Next, scale the bitmap for the thumbnail.
            that._positionMedia(
                bitmap,
                bitmap.image.width,
                bitmap.image.height,
                that.protoblock.scale
            );
            that.container.addChild(bitmap);
            that.updateCache();
        };

        if (imagePath === null) {
            image.src = this.value;
        } else {
            image.src = imagePath;
        }
    };

    this._doOpenMedia = function(thisBlock) {
        let fileChooser = docById("myOpenAll");
        let that = this;

        let __readerAction = function(event) {
            window.scroll(0, 0);

            let reader = new FileReader();
            reader.onloadend = function() {
                if (reader.result) {
                    if (that.name === "media") {
                        that.value = reader.result;
                        that.loadThumbnail(null);
                        return;
                    }
                    that.value = [fileChooser.files[0].name, reader.result];
                    that.blocks.updateBlockText(thisBlock);
                }
            };
            if (that.name === "media") {
                reader.readAsDataURL(fileChooser.files[0]);
            } else {
                reader.readAsText(fileChooser.files[0]);
            }
            fileChooser.removeEventListener("change", __readerAction);
        };

        fileChooser.addEventListener("change", __readerAction, false);
        fileChooser.focus();
        fileChooser.click();
        window.scroll(0, 0);
    };

    this.setCollapsedState = function() {
        // Mark it as in a collapsed block and hide it.
        this.inCollapsed = true;
        this.hide();
    };

    this.setUncollapsedState = function(nblk) {
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

    this.collapseToggle = function() {
        // Find the blocks to collapse/expand inside of a collapable
        // block.
        let thisBlock = this.blocks.blockList.indexOf(this);
        this.blocks.findDragGroup(thisBlock);

        if (this.collapseBlockBitmap === null) {
            console.debug("collapse bitmap not ready");
            return;
        }

        // Remember the current state.
        let isCollapsed = this.collapsed;
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
            switch (this.name) {
                case "newnote":
                    this._newNoteLabel();
                    break;
                case "interval":
                    this._intervalLabel();
                    break;
                case "osctime":
                    this._oscTimeLabel();
                    break;
                default:
                    console.debug(
                        "What do we do with a collapsed " +
                        this.name +
                        " block?"
                    );
                    break;
            }
        }

        this.bitmap.visible = this.collapsed;
        this.highlightBitmap.visible = false;
        if (this.disconnectedBitmap !== null) {
            this.disconnectedBitmap.visible = false;
        }

        if (this.disconnectedHighlightBitmap !== null) {
            this.disconnectedHighlightBitmap.visible = false;
        }

        this.updateCache();

        if (this.name === "action") {
            // Label the collapsed block with the action label.
            if (this.connections[1] !== null) {
                let text = this.blocks.blockList[this.connections[1]].value;
                if (getTextWidth(text, "bold 20pt Sans") > TEXTWIDTH) {
                    text = text.substr(0, STRINGLEN) + "...";
                }

                this.collapseText.text = text;
            } else {
                this.collapseText.text = "";
            }
        }

        // Make sure the text is on top.
        this.container.setChildIndex(this.collapseText, this.container.children.length - 1);

        if (this.isInlineCollapsible()) {
            // Only collapse the contents of the note block.
            this._toggle_inline(thisBlock, isCollapsed);
        } else {
            // Set collapsed state of all of the blocks in the drag group.
            if (this.blocks.dragGroup.length > 0) {
                for (let b = 1; b < this.blocks.dragGroup.length; b++) {
                    let blk = this.blocks.dragGroup[b];
                    if (this.collapsed) {
                        // if (this.blocks.blockList[blk].inCollapsed) {
                        this.blocks.blockList[blk].setCollapsedState();
                    } else {
                        this.blocks.blockList[blk].setUncollapsedState(
                            this.blocks.insideInlineCollapsibleBlock(blk)
                        );
                    }
                }
            }
        }

        this.updateCache();
        this.unhighlight();
        this.blocks.refreshCanvas();
    };

    this._intervalLabel = function() {
        // Find pitch and value to display on the collapsed interval
        // block.
        let degrees = DEGREES.split(" ");
        let intervalLabels = {};
        for (let i = 0; i < degrees.length; i++) {
            intervalLabels[i] = degrees[i];
        }

        let intervals = [];
        let i = 0;

        let c = this.blocks.blockList.indexOf(this), lastIntervalBlock;
        while (c !== null) {
            lastIntervalBlock = c;
            let n = this.blocks.blockList[c].connections[1];
            let cblock = this.blocks.blockList[n];
            if (cblock.name === "number") {
                if (Math.abs(cblock.value) in intervalLabels) {
                    if (cblock.value < 0) {
                        intervals.push("-" + intervalLabels[-cblock.value]);
                    } else {
                        intervals.push("+" + intervalLabels[cblock.value]);
                    }
                } else {
                    if (cblock.value < 0) {
                        intervals.push("-" + cblock.value);
                    } else {
                        intervals.push("+" + cblock.value);
                    }
                }
            } else {
                intervals.push("");
            }

            i += 1;
            if (i > 5) {
                console.debug("loop?");
                break;
            }

            c = this.blocks.findNestedIntervalBlock(
                this.blocks.blockList[c].connections[2]
            );
        }

        let itext = "";
        for (let i = intervals.length; i > 0; i--) {
            itext += " " + intervals[i - 1];
        }

        let v = "";
        let nblk = this.blocks.findNoteBlock(lastIntervalBlock);
        if (nblk === null) {
            this.collapseText.text = _("scalar interval") + itext;
        } else {
            c = this.blocks.blockList[nblk].connections[1];
            if (c !== null) {
                // Only look for standard form: / 1 4
                if (this.blocks.blockList[c].name === "divide") {
                    let c1 = this.blocks.blockList[c].connections[1];
                    let c2 = this.blocks.blockList[c].connections[2];
                    if (
                        this.blocks.blockList[c1].name === "number" &&
                        this.blocks.blockList[c2].name === "number"
                    ) {
                        v =
                            this.blocks.blockList[c1].value +
                            "/" +
                            this.blocks.blockList[c2].value;
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            if (this.blocks.blockList[c2].value in NSYMBOLS) {
                                v += NSYMBOLS[this.blocks.blockList[c2].value];
                            }
                        }
                    }
                }
            }

            c = this.blocks.findFirstPitchBlock(
                this.blocks.blockList[nblk].connections[2]
            );
            let p = this._getPitch(c);
            if (c === null || p === "") {
                this.collapseText.text = _("scalar interval") + itext;
            } else {
                // Are there more pitch blocks in this note?
                c = this.blocks.findFirstPitchBlock(
                    last(this.blocks.blockList[c].connections)
                );
                // Update the collapsed-block label.
                if (c === null) {
                    this.collapseText.text = p + " | " + v + itext;
                } else {
                    this.collapseText.text = p + "..." + " | " + v + itext;
                }
            }
        }
    };

    this._newNoteLabel = function() {
        // Find pitch and value to display on the collapsed note value
        // block.
        let v = "";
        let c = this.connections[1];
        let vi = null;
        if (c !== null) {
            // Only look for standard form: / 1 4
            if (this.blocks.blockList[c].name === "divide") {
                let c1 = this.blocks.blockList[c].connections[1];
                let c2 = this.blocks.blockList[c].connections[2];
                if (
                    this.blocks.blockList[c1].name === "number" &&
                    this.blocks.blockList[c2].name === "number"
                ) {
                    v =
                        this.blocks.blockList[c1].value +
                        "/" +
                        this.blocks.blockList[c2].value;
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        vi = this.blocks.blockList[c2].value;
                        if (vi in NSYMBOLS) {
                            v += NSYMBOLS[vi];
                        }
                    }
                }
            }
        }

        c = this.connections[2];
        c = this.blocks.findFirstPitchBlock(c);
        let p = this._getPitch(c);
        if (c === null) {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                if (vi !== null) {
                    if (vi in NSYMBOLS) {
                        v = v.replace(NSYMBOLS[vi], RSYMBOLS[vi]);
                    }
                }
            }
            this.collapseText.text = _("silence") + " | " + v;
        } else if (p === "" && v === "") {
            this.collapseText.text = _("note value");
        } else {
            if (_THIS_IS_MUSIC_BLOCKS_ && p === _("silence")) {
                if (vi !== null) {
                    if (vi in NSYMBOLS) {
                        v = v.replace(NSYMBOLS[vi], RSYMBOLS[vi]);
                    }
                }
            }

            // are there more pitch blocks in this note?
            c = this.blocks.findFirstPitchBlock(
                last(this.blocks.blockList[c].connections)
            );
            // Update the collapsed-block label.
            if (c === null) {
                this.collapseText.text = p + " | " + v;
            } else {
                this.collapseText.text = p + "... | " + v;
            }
        }
    };

    this._oscTimeLabel = function() {
        // Find Hertz and value to display on the collapsed note value
        // block.
        let v = "";
        let c = this.connections[1];
        if (c !== null) {
            // Only look for standard form: / 1000 / 3 2
            if (this.blocks.blockList[c].name === "divide") {
                let c1 = this.blocks.blockList[c].connections[1];
                let c2 = this.blocks.blockList[c].connections[2];
                if (
                    c1 !== null &&
                    c2 !== null &&
                    this.blocks.blockList[c2].name === "divide"
                ) {
                    let ci = this.blocks.blockList[c2].connections[1];
                    let cii = this.blocks.blockList[c2].connections[2];
                    if (
                        ci !== null &&
                        cii !== null &&
                        this.blocks.blockList[ci].name === "number" &&
                        this.blocks.blockList[cii].name === "number"
                    ) {
                        v =
                            (this.blocks.blockList[c1].value /
                                this.blocks.blockList[ci].value) *
                            this.blocks.blockList[cii].value;
                    }
                }
            }
        }

        c = this.connections[2];
        c = this.blocks.findFirstPitchBlock(c);
        let p = this._getPitch(c);
        if (c === null) {
            this.collapseText.text = _("silence") + " | " + v;
        } else if (p === "" && v === "") {
            this.collapseText.text = _("note value");
        } else {
            // Are there more pitch blocks in this note?
            c = this.blocks.findFirstPitchBlock(
                last(this.blocks.blockList[c].connections)
            );
            // Update the collapsed-block label.
            if (v !== "") {
                if (c === null) {
                    this.collapseText.text = p + " | " + v.toFixed(0);
                } else {
                    this.collapseText.text = p + "... | " + v.toFixed(0);
                }
            } else {
                this.collapseText.text = p + "...";
            }
        }
    };

    this._getPitch = function(c) {
        if (c === null) {
            return "";
        }

        let c1, c2;
        switch (this.blocks.blockList[c].name) {
            case "pitch":
                c1 = this.blocks.blockList[c].connections[1];
                c2 = this.blocks.blockList[c].connections[2];
                if (this.blocks.blockList[c2].name === "number") {
                    if (this.blocks.blockList[c1].name === "solfege") {
                        let solfnotes_ = _("ti la sol fa mi re do").split(" ");
                        let stripped = this.blocks.blockList[c1].value
                            .replace(SHARP, "")
                            .replace(FLAT, "")
                            .replace(DOUBLESHARP, "")
                            .replace(DOUBLEFLAT, "");
                        let i = [
                            "ti",
                            "la",
                            "sol",
                            "fa",
                            "mi",
                            "re",
                            "do"
                        ].indexOf(stripped);
                        if (
                            this.blocks.blockList[c1].value.indexOf(SHARP) !==
                            -1
                        ) {
                            return (
                                solfnotes_[i] +
                                SHARP +
                                " " +
                                this.blocks.blockList[c2].value
                            );
                        } else if (
                            this.blocks.blockList[c1].value.indexOf(FLAT) !== -1
                        ) {
                            return (
                                solfnotes_[i] +
                                FLAT +
                                " " +
                                this.blocks.blockList[c2].value
                            );
                        } else if (
                            this.blocks.blockList[c1].value.indexOf(
                                DOUBLESHARP
                            ) !== -1
                        ) {
                            return (
                                solfnotes_[i] +
                                DOUBLESHARP +
                                " " +
                                this.blocks.blockList[c2].value
                            );
                        } else if (
                            this.blocks.blockList[c1].value.indexOf(
                                DOUBLEFLAT
                            ) !== -1
                        ) {
                            return (
                                solfnotes_[i] +
                                DOUBLEFLAT +
                                " " +
                                this.blocks.blockList[c2].value
                            );
                        } else {
                            return (
                                solfnotes_[i] +
                                " " +
                                this.blocks.blockList[c2].value
                            );
                        }
                    } else if (this.blocks.blockList[c1].name === "notename") {
                        return (
                            this.blocks.blockList[c1].value +
                            " " +
                            this.blocks.blockList[c2].value
                        );
                    } else if (this.blocks.blockList[c1].name === "scaledegree2") {
                        obj = splitScaleDegree(this.blocks.blockList[c1].value);
                        let note = obj[0];
                        if(obj[1] !== NATURAL) {
                            note += obj[1];
                        }
                        return (
                            note +
                            " " +
                            this.blocks.blockList[c2].value
                        );
                    }
                }
                break;
            case "nthmodalpitch":
                c1 = this.blocks.blockList[c].connections[1];
                c2 = this.blocks.blockList[c].connections[2];
                if (this.blocks.blockList[c2].name === "number") {
                    if (this.blocks.blockList[c1].name === "number") {
                        let degrees = DEGREES.split(" ");
                        let i = this.blocks.blockList[c1].value - 1;
                        if (i > 0 && i < degrees.length) {
                            return (
                                degrees[i] +
                                " " +
                                this.blocks.blockList[c2].value
                            );
                        } else {
                            return (
                                this.blocks.blockList[c1].value +
                                " " +
                                this.blocks.blockList[c2].value
                            );
                        }
                    }
                }
                break;
            case "hertz":
                c1 = this.blocks.blockList[c].connections[0];
                if (this.blocks.blockList[c1].name === "number") {
                    return this.blocks.blockList[c1].value + "HZ";
                }
                break;
            case "steppitch":
                c1 = this.blocks.blockList[c].connections[1];
                if (
                    this.blocks.blockList[c1].name === "number" &&
                    this.blocks.blockList[c1].value < 0
                ) {
                    //.TRANS: scalar step
                    return (
                        _("down") +
                        " " +
                        Math.abs(this.blocks.blockList[c1].value)
                    );
                } else return _("up") + " " + this.blocks.blockList[c1].value;
                break;
            case "pitchnumber":
                c1 = this.blocks.blockList[c].connections[1];
                if (this.blocks.blockList[c1].name === "number") {
                    //.TRANS: pitch number
                    return _("pitch") + " " + this.blocks.blockList[c1].value;
                }
                break;
            case "playdrum":
                return _("drum");
                break;
            case "rest2":
                return _("silence");
                break;
            default:
                return "";
        }
    };

    this._toggle_inline = function(thisBlock, collapse) {
        // Toggle the collapsed state of blocks inside of a note (or
        // interval) block and reposition any blocks below
        // it. Finally, resize any surrounding clamps.

        // Set collapsed state of note value arg blocks...
        if (this.connections[1] !== null) {
            this.blocks.findDragGroup(this.connections[1]);
            for (let b = 0; b < this.blocks.dragGroup.length; b++) {
                let blk = this.blocks.dragGroup[b];
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
            for (let b = 0; b < this.blocks.dragGroup.length; b++) {
                let blk = this.blocks.dragGroup[b];
                // Look to see if the local parent block is collapsed.
                let parent = this.blocks.insideInlineCollapsibleBlock(blk);
                if (
                    parent === null ||
                    !this.blocks.blockList[parent].collapsed
                ) {
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
            let n = this.docks.length, dy;
            if (collapse) {
                dy =
                    this.blocks.blockList[thisBlock].docks[n - 1][1] -
                    this.blocks.blockList[thisBlock].docks[n - 2][1];
            } else {
                dy =
                    this.blocks.blockList[thisBlock].docks[n - 2][1] -
                    this.blocks.blockList[thisBlock].docks[n - 1][1];
            }

            this.blocks.findDragGroup(this.connections[3]);
            for (let b = 0; b < this.blocks.dragGroup.length; b++) {
                this.blocks.moveBlockRelative(this.blocks.dragGroup[b], 0, dy);
            }

            this.blocks.adjustDocks(thisBlock, true);
        }

        // Look to see if we are in a clamp block. If so, readjust.
        let clampList = [];
        this.blocks.findNestedClampBlocks(thisBlock, clampList);
        if (clampList.length > 0) {
            this.blocks.clampBlocksToCheck = clampList;
            this.blocks.adjustExpandableClampBlock();
        }

        this.blocks.refreshCanvas();
    };

    /*
     * Position any addition text on a block
     * @param-blockscale is used to scale the text
     * @return{void}
     * @private
     */
    this._positionText = function(blockScale) {
        this.text.textBaseline = "alphabetic";
        this.text.textAlign = "right";
        let fontSize = 10 * blockScale;
        this.text.font = fontSize + "px Sans";
        this.text.x = Math.floor((TEXTX * blockScale) / 2 + 0.5);
        this.text.y = Math.floor((TEXTY * blockScale) / 2 + 0.5);

        // Some special cases
        if (SPECIALINPUTS.indexOf(this.name) !== -1) {
            this.text.textAlign = "center";
            this.text.x = Math.floor((VALUETEXTX * blockScale) / 2 + 0.5);
            if (EXTRAWIDENAMES.indexOf(this.name) !== -1) {
                this.text.x *= 3.0;
            } else if (WIDENAMES.indexOf(this.name) !== -1) {
                this.text.x = Math.floor(this.text.x * 1.75 + 0.5);
            } else if (this.name === "text") {
                this.text.x = Math.floor(this.width / 2 + 0.5);
            }
        } else if (this.name === "nameddo") {
            this.text.textAlign = "center";
            this.text.x = Math.floor(this.width / 2 + 0.5);
        } else if (this.protoblock.args === 0) {
            let bounds = this.container.getBounds();
            this.text.x = Math.floor(this.width - 25 + 0.5);
        } else if (this.isCollapsible()) {
            this.text.x += Math.floor(15 * blockScale);
        } else {
            this.text.textAlign = "left";
            if (this.docks[0][2] === "booleanout") {
                this.text.y = Math.floor(this.docks[0][1] + 0.5);
            }
        }

        // Ensure text is on top.
        z = this.container.children.length - 1;
        this.container.setChildIndex(this.text, z);
        this.updateCache();
    };

    /*
     * Position media artwork on a block.
     * @param-bitmap - image
     * @param-width-width of canvas
     * @param-height-height of canvas
     * @param-blockscale-scale
     * Position inserted media
     * @return{void}
     * @private
     */
    this._positionMedia = function(bitmap, width, height, blockScale) {
        if (width > height) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale =
                ((MEDIASAFEAREA[2] / width) * blockScale) / 2;
        } else {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale =
                ((MEDIASAFEAREA[3] / height) * blockScale) / 2;
        }
        bitmap.x = ((MEDIASAFEAREA[0] - 10) * blockScale) / 2;
        bitmap.y = (MEDIASAFEAREA[1] * blockScale) / 2;
    };

    /*
     * Position the label for a collapsed block
     * @param-blockscale-scale
     * @return{void}
     * @private
     */
    this._positionCollapseLabel = function(blockScale) {
        if (this.isInlineCollapsible()) {
            this.collapseText.x = Math.floor(
                ((COLLAPSETEXTX + STANDARDBLOCKHEIGHT) * blockScale) / 2 + 0.5
            );
            this.collapseText.y = Math.floor(
                ((COLLAPSETEXTY - 8) * blockScale) / 2 + 0.5
            );
        } else {
            this.collapseText.x = Math.floor(
                ((COLLAPSETEXTX + 30) * blockScale) / 2 + 0.5
            );
            this.collapseText.y = Math.floor(
                (COLLAPSETEXTY * blockScale) / 2 + 0.5
            );
        }

        // Ensure text is on top.
        z = this.container.children.length - 1;
        this.container.setChildIndex(this.collapseText, z);
    };

    /*
     * Determine the hit area for a block
     * DEPRECATED
     * @return{void}
     * @private
     */
    this._calculateBlockHitArea = function() {
        let hitArea = new createjs.Shape();
        hitArea.graphics
            .beginFill("platformColor.hitAreaGraphicsBeginFill")
            .drawRect(0, 0, this.width, this.hitHeight);
        this.container.hitArea = hitArea;
    };

    /*
     * These are the event handlers for block containers.
     * @return{void}
     * @private
     */
    this._loadEventHandlers = function() {
        let that = this;
        let thisBlock = this.blocks.blockList.indexOf(this);

        this._calculateBlockHitArea();

        this.container.on("mouseover", function(event) {
            docById("contextWheelDiv").style.display = "none";

            if (!that.blocks.logo.runningLilypond) {
                document.body.style.cursor = "pointer";
            }

            that.blocks.highlight(thisBlock, true);
            that.blocks.activeBlock = thisBlock;
            // that.blocks.refreshCanvas();
        });

        let haveClick = false;
        let moved = false;
        let locked = false;
        let getInput = window.hasMouse;

        this.container.on("click", function(event) {
            // We might be able to check which button was clicked.
            if ("nativeEvent" in event) {
                if (
                    "button" in event.nativeEvent &&
                    event.nativeEvent.button == 2
                ) {
                    that.blocks.stageClick = true;
                    docById("wheelDiv").style.display = "none";
                    that.piemenuBlockContext(thisBlock);
                    return;
                } else if (
                    "ctrlKey" in event.nativeEvent &&
                    event.nativeEvent.ctrlKey
                ) {
                    that.piemenuBlockContext(thisBlock);
                    return;
                } else if (
                    "shiftKey" in event.nativeEvent &&
                    event.nativeEvent.shiftKey
                ) {
                    if (that.blocks.turtles.running()) {
                        that.blocks.logo.doStopTurtles();

                        setTimeout(function() {
                            that.blocks.logo.runLogoCommands(topBlock);
                        }, 250);
                    } else {
                        that.blocks.logo.runLogoCommands(topBlock);
                    }

                    return;
                }
            }

            if (that.blocks.getLongPressStatus()) {
                return;
            }

            that.blocks.activeBlock = thisBlock;
            haveClick = true;

            if (locked) {
                return;
            }

            locked = true;
            setTimeout(function() {
                locked = false;
            }, 500);

            hideDOMLabel();
            that._checkWidgets(false);

            dx = event.stageX / that.blocks.getStageScale() - that.container.x;
            if (
                !moved &&
                that.isCollapsible() &&
                dx < 30 / that.blocks.getStageScale()
            ) {
                that.collapseToggle();
            } else if (
                (!window.hasMouse && getInput) ||
                (window.hasMouse && !moved)
            ) {
                if (that.name === "media") {
                    that._doOpenMedia(thisBlock);
                } else if (that.name === "loadFile") {
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
                    if (
                        !that.blocks.getLongPressStatus() &&
                        !that.blocks.stageClick
                    ) {
                        var topBlock = that.blocks.findTopBlock(thisBlock);
                        console.debug(
                            "running from " +
                            that.blocks.blockList[topBlock].name
                        );
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            that.blocks.logo.synth.resume();
                        }

                        if (that.blocks.turtles.running()) {
                            that.blocks.logo.doStopTurtles();

                            setTimeout(function() {
                                that.blocks.logo.runLogoCommands(topBlock);
                            }, 250);
                        } else {
                            that.blocks.logo.runLogoCommands(topBlock);
                        }
                    }
                }
            } else if (!moved) {
                if (
                    !that.blocks.getLongPressStatus() &&
                    !that.blocks.stageClick
                ) {
                    var topBlock = that.blocks.findTopBlock(thisBlock);
                    console.debug(
                        "running from " + that.blocks.blockList[topBlock].name
                    );
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        that.blocks.logo.synth.resume();
                    }

                    if (that.blocks.turtles.running()) {
                        that.blocks.logo.doStopTurtles();

                        setTimeout(function() {
                            that.blocks.logo.runLogoCommands(topBlock);
                        }, 250);
                    } else {
                        that.blocks.logo.runLogoCommands(topBlock);
                    }
                }
            }
        });

        this.container.on("mousedown", function(event) {
            docById("contextWheelDiv").style.display = "none";

            // Track time for detecting long pause...
            that.blocks.mouseDownTime = new Date().getTime();

            that.blocks.longPressTimeout = setTimeout(function() {
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
                that.blocks.stage.setChildIndex(
                    that.collapseContainer,
                    that.blocks.stage.children.length - 1
                );
            }

            moved = false;
            that.original = {
                x: event.stageX / that.blocks.getStageScale(),
                y: event.stageY / that.blocks.getStageScale()
            };

            that.offset = {
                x: Math.round(that.container.x - that.original.x),
                y: Math.round(that.container.y - that.original.y)
            };
        });

        this.container.on("pressmove", function(event) {
            // FIXME: More voodoo
            event.nativeEvent.preventDefault();

            // Don't allow silence block to be dragged out of a note.
            if (that.name === "rest2") {
                return;
            }

            if (window.hasMouse) {
                moved = true;
            } else {
                // Make it eaiser to select text on mobile.
                setTimeout(function() {
                    moved =
                        Math.abs(
                            event.stageX / that.blocks.getStageScale() -
                            that.original.x
                        ) +
                        Math.abs(
                            event.stageY / that.blocks.getStageScale() -
                            that.original.y
                        ) >
                        20 && !window.hasMouse;
                    getInput = !moved;
                }, 200);
            }

            let oldX = that.container.x;
            let oldY = that.container.y;

            let dx = Math.round(
                event.stageX / that.blocks.getStageScale() +
                that.offset.x -
                oldX
            );
            let dy = Math.round(
                event.stageY / that.blocks.getStageScale() +
                that.offset.y -
                oldY
            );

            let finalPos = oldY + dy;
            if (that.blocks.stage.y === 0 && finalPos < 45) {
                dy += 45 - finalPos;
            }

            // scroll when reached edges.
            if (event.stageX < 10 && scrollBlockContainer)
                that.blocks.moveAllBlocksExcept(that,10,0);
            else if (event.stageX > window.innerWidth-10 && scrollBlockContainer)
                that.blocks.moveAllBlocksExcept(that,-10,0);
            else if (event.stageY > window.innerHeight-10)
                that.blocks.moveAllBlocksExcept(that,0,-10);
            else if (event.stageY < 60)
                that.blocks.moveAllBlocksExcept(that,0,10);

            if (that.blocks.longPressTimeout != null) {
                clearTimeout(that.blocks.longPressTimeout);
                that.blocks.longPressTimeout = null;
                that.blocks.clearLongPress();
            }

            if (!moved && that.label != null) {
                that.label.style.display = "none";
            }

            that.blocks.moveBlockRelative(thisBlock, dx, dy);

            // If we are over the trash, warn the user.
            if (
                trashcan.overTrashcan(
                    event.stageX / that.blocks.getStageScale(),
                    event.stageY / that.blocks.getStageScale()
                )
            ) {
                trashcan.startHighlightAnimation();
            } else {
                trashcan.stopHighlightAnimation();
            }

            if (that.isValueBlock() && that.name !== "media") {
                // Ensure text is on top
                that.container.setChildIndex(that.text, that.container.children.length - 1);
            }

            // ...and move any connected blocks.
            that.blocks.findDragGroup(thisBlock);
            if (that.blocks.dragGroup.length > 0) {
                for (let b = 0; b < that.blocks.dragGroup.length; b++) {
                    let blk = that.blocks.dragGroup[b];
                    if (b !== 0) {
                        that.blocks.moveBlockRelative(blk, dx, dy);
                    }
                }
            }

            that.blocks.refreshCanvas();
        });

        this.container.on("mouseout", function(event) {
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

        this.container.on("pressup", function(event) {
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

    /*
     * Common code for processing events
     * @param-event- mouse
     * @param-moved-cursor moved
     * @param-haveClick-when clickd
     * @param-hideDOM-hide mouse
     * set cursor style to default
     * @return {void}
     * @private
     */
    this._mouseoutCallback = function(event, moved, haveClick, hideDOM) {
        let thisBlock = this.blocks.blockList.indexOf(this);
        if (!this.blocks.logo.runningLilypond) {
            document.body.style.cursor = "default";
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
            if (
                trashcan.overTrashcan(
                    event.stageX / this.blocks.getStageScale(),
                    event.stageY / this.blocks.getStageScale()
                )
            ) {
                if (trashcan.isVisible) {
                    this.blocks.sendStackToTrash(this);
                }
            } else {
                // Otherwise, process move.
                // Also, keep track of the time of the last move.
                this.blocks.mouseDownTime = new Date().getTime();
                this.blocks.blockMoved(thisBlock);

                // Just in case the blocks are not properly docked after
                // the move (workaround for issue #38 -- Blocks fly
                // apart). Still need to get to the root cause.
                this.blocks.adjustDocks(
                    this.blocks.blockList.indexOf(this),
                    true
                );
            }
        } else if (
            SPECIALINPUTS.indexOf(this.name) !== -1 ||
            ["media", "loadFile"].indexOf(this.name) !== -1
        ) {
            if (!haveClick) {
                // Simulate click on Android.
                if (new Date().getTime() - this.blocks.mouseDownTime < 500) {
                    if (!this.trash) {
                        this.blocks.mouseDownTime = new Date().getTime();
                        if (this.name === "media" || this.name === "loadFile") {
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
            if (
                event.stageX / this.blocks.getStageScale() < this.container.x ||
                event.stageX / this.blocks.getStageScale() >
                this.container.x + this.width ||
                event.stageY < this.container.y ||
                event.stageY > this.container.y + this.hitHeight
            ) {
                // There are lots of special cases where we want to
                // use piemenus. Make sure this is not one of them.
                if (!this._usePiemenu()) {
                    this._labelChanged(true, true);
                    hideDOMLabel();
                    this._checkWidgets(false);
                }

                this.blocks.unhighlight(null);
                this.blocks.refreshCanvas();
            }

            this.blocks.activeBlock = null;
        }
    };

    this._usePiemenu = function() {
        // Check on all the special cases were we want to use a pie menu.
        this._check_meter_block = null;

        // Special pie menus
        if (PIEMENUS.indexOf(this.name) !== -1) {
            return true;
        }

        // Numeric pie menus
        let blk = this.blocks.blockList.indexOf(this);

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

        if(this._usePieNumberC1()) {
            return true;
        }

        return false;
    };

    this._usePieNumberC1 = function() {
        // Return true if this number block plugs into Connection 1 of
        // a block that uses a pie menu. Add block names to the list
        // below and the switch statement in the _changeLabel
        // function.
        let cblk = this.connections[0];

        if (cblk === null) {
            return false;
        }

        if (
            [
                "steppitch",
                "pitchnumber",
                "meter",
                "register",
                "nthmodalpitch",
                "rhythmicdot2",
                "crescendo",
                "decrescendo",
                "harmonic2",
                "interval",
                "setscalartransposition",
                "semitoneinterval",
                "settransposition",
                "setnotevolume",
                "articulation",
                "vibrato",
                "dis",
                "neighbor",
                "neighbor2",
                "tremolo",
                "chorus",
                "phaser",
                "amsynth",
                "fmsynth",
                "duosynth",
                "rhythm2",
                "stuplet",
                "duplicatenotes",
                "setcolor",
                "setshade",
                "setgrey",
                "sethue",
                "setpensize",
                "settranslucency",
                "setheading",
                "arc",
                "onbeatdo",
                "hertz",
                "right",
                "left",
                "setpanning",
                "setbpm3",
                "setmasterbpm2"
            ].indexOf(this.blocks.blockList[this.connections[0]].name) === -1
        ) {
            return false;
        }

        return this.blocks.blockList[cblk].connections[1] === this.blocks.blockList.indexOf(this);
    };

    this._usePieNumberC2 = function() {
        // Return true if this number block plugs into Connection 2 of
        // a block that uses a pie menu. Add block names to the list
        // below and the switch statement in the _changeLabel
        // function.
        let cblk = this.connections[0];

        if (cblk === null) {
            return false;
        }

        if (
            [
                "setsynthvolume",
                "tremolo",
                "chorus",
                "phaser",
                "duosynth",
                "arc"
            ].indexOf(this.blocks.blockList[cblk].name) === -1
        ) {
            return false;
        }

        return this.blocks.blockList[cblk].connections[2] === this.blocks.blockList.indexOf(this);
    };

    this._usePieNumberC3 = function() {
        // Return true if this number block plugs into Connection 3 of
        // a block that uses a pie menu. Add block names to the list
        // below and the switch statement in the _changeLabel
        // function.
        let cblk = this.connections[0];

        if (cblk === null) {
            return false;
        }

        if (["chorus"].indexOf(this.blocks.blockList[cblk].name) === -1) {
            return false;
        }

        return this.blocks.blockList[cblk].connections[3] === this.blocks.blockList.indexOf(this);
    };

    this._ensureDecorationOnTop = function() {
        // Find the turtle decoration and move it to the top.
        for (let child = 0; child < this.container.children.length; child++) {
            if (this.container.children[child].name === "decoration") {
                // Drum block in collapsed state is less wide.
                // Deprecated
                let dx = 0;
                if (this.name === "drum" && this.collapsed) {
                    dx = (25 * this.protoblock.scale) / 2;
                }

                for (
                    let turtle = 0;
                    turtle < this.blocks.turtles.turtleList.length;
                    turtle++
                ) {
                    if (
                        this.blocks.turtles.turtleList[turtle].startBlock
                            === this
                    ) {
                        this.blocks.turtles.turtleList[turtle].decorationBitmap.x =
                            this.width - dx - (30 * this.protoblock.scale) / 2;
                        break;
                    }
                }

                this.container.setChildIndex(
                    this.container.children[child],
                    this.container.children.length - 1
                );
                break;
            }
        }

        this.container.setChildIndex(this.bitmap, 0);
        this.container.setChildIndex(this.highlightBitmap, 0);
        if (this.disconnectedBitmap !== null) {
            this.container.setChildIndex(this.disconnectedBitmap, 0);
        }

        this.updateCache();
    };

    /*
     * Change the label in a parameter block
     * @return{void}
     * @private
     */
    this._changeLabel = function() {
        let that = this;
        let x = this.container.x;
        let y = this.container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        let selectorWidth = 150;

        let movedStage = false;
        let fromY, labelValue, obj, selectednote,
            selectedattr, selectedaccidental, selectedmode,
            selectedinvert, selectedinterval, selecteddrum,
            selectedeffect, selectedvoice, selectednoise,
            selectedTemperament, selectedvalue, selectedtype, selectedNote;
        if (!window.hasMouse && this.blocks.stage.y + y > 75) {
            movedStage = true;
            fromY = this.blocks.stage.y;
            this.blocks.stage.y = -y + 75;
        }

        // A place in the DOM to put modifiable labels (textareas).
        if (this.label != null) {
            labelValue = this.label.value;
        } else {
            labelValue = this.value;
        }

        let labelElem = docById("labelDiv");

        if (this.name === "text") {
            labelElem.innerHTML =
                '<input id="textLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="text" type="text" value="' +
                labelValue +
                '" />';
            labelElem.classList.add("hasKeyboard");
            this.label = docById("textLabel");
        } else if (this.name === "solfege") {
            obj = splitSolfege(this.value);
            // solfnotes_ is used in the interface for internationalization.
            //.TRANS: the note names must be separated by single spaces
            let solfnotes_ = _("ti la sol fa mi re do").split(" ");

            if (this.piemenuOKtoLaunch()) {
                this._piemenuPitches(
                    solfnotes_,
                    SOLFNOTES,
                    SOLFATTRS,
                    obj[0],
                    obj[1]
                );
            }
        } else if (this.name === "scaledegree2") {
            obj = splitScaleDegree(this.value);
            let scalenotes_ = ("7 6 5 4 3 2 1").split(" ");
            if(this.piemenuOKtoLaunch()) {
                this._piemenuPitches(
                    scalenotes_,
                    SCALENOTES,
                    SOLFATTRS,
                    obj[0],
                    obj[1]
                )
            };

        } else if (this.name === "customNote") {
            if (!this.blocks.logo.customTemperamentDefined) {
                // If custom temperament is not defined by user,
                // then custom temperament is supposed to be equal temperament.
                obj = splitSolfege(this.value);
                let solfnotes_ = _("ti la sol fa mi re do").split(" ");

                if (this.piemenuOKtoLaunch()) {
                    this._piemenuPitches(
                        solfnotes_,
                        SOLFNOTES,
                        SOLFATTRS,
                        obj[0],
                        obj[1]
                    );
                }
            } else {
                let noteLabels = TEMPERAMENT ;

                let customLabels =  [];
                for (let lab in noteLabels)
                    if (!(lab in PreDefinedTemperaments))customLabels.push(lab);

                let selectedCustom ;
                if (this.customID != null) {
                    selectedCustom = this.customID ;
                } else {
                    selectedCustom = customLabels[0];
                }

                let selectedNote ;
                if (this.value != null) {
                    selectedNote = this.value;
                } else {
                    selectedNote = TEMPERAMENT[selectedCustom]["0"][1];
                }
                this._customNotes(
                    noteLabels,
                    customLabels,
                    selectedCustom,
                    selectedNote
                );
            }
        } else if (this.name === "eastindiansolfege") {
            obj = splitSolfege(this.value);
            selectednote = obj[0];
            selectedattr = obj[1];

            if (this.piemenuOKtoLaunch()) {
                this._piemenuPitches(
                    EASTINDIANSOLFNOTES,
                    SOLFNOTES,
                    SOLFATTRS,
                    obj[0],
                    obj[1]
                );
            }
        } else if (this.name === "notename") {
            const NOTENOTES = ["B", "A", "G", "F", "E", "D", "C"];
            if (this.value != null) {
                selectednote = this.value[0];
                if (this.value.length === 1) {
                    selectedattr = "♮";
                } else if (this.value.length === 2) {
                    selectedattr = this.value[1];
                } else {
                    selectedattr = this.value[1] + this.value[2];
                }
            } else {
                selectednote = "G";
                selectedattr = "♮";
            }

            if (selectedattr === "") {
                selectedattr = "♮";
            }

            if (this.piemenuOKtoLaunch()) {
                this._piemenuPitches(
                    NOTENOTES,
                    NOTENOTES,
                    SOLFATTRS,
                    selectednote,
                    selectedattr
                );
            }
        } else if (this.name === "modename") {
            if (this.value != null) {
                selectedmode = this.value;
            } else {
                selectedmode = DEFAULTMODE;
            }

            this._piemenuModes(selectedmode);
        } else if (this.name === "accidentalname") {
            if (this.value != null) {
                selectedaccidental = this.value;
            } else {
                selectedaccidental = DEFAULTACCIDENTAL;
            }

            if (this.piemenuOKtoLaunch()) {
                this._piemenuAccidentals(
                    ACCIDENTALLABELS,
                    ACCIDENTALNAMES,
                    selectedaccidental
                );
            }
            // labelElem.innerHTML = '';
            // this.label = docById('accidentalnameLabel');
        } else if (this.name === "intervalname") {
            if (this.value != null) {
                selectedinterval = this.value;
            } else {
                selectedinterval = DEFAULTINTERVAL;
            }

            if (this.piemenuOKtoLaunch()) {
                this._piemenuIntervals(selectedinterval);
            }
        } else if (this.name === "invertmode") {
            if (this.value != null) {
                selectedinvert = this.value;
            } else {
                selectedinvert = DEFAULTINVERT;
            }

            let invertLabels = [];
            let invertValues = [];

            for (let i = 0; i < INVERTMODES.length; i++) {
                invertLabels.push(_(INVERTMODES[i][1]));
                invertValues.push(INVERTMODES[i][1]);
            }

            if (this.piemenuOKtoLaunch()) {
                this._piemenuBasic(invertLabels, invertValues, selectedinvert);
            }
        } else if (this.name === "drumname") {
            if (this.value != null) {
                selecteddrum = this.value;
            } else {
                selecteddrum = DEFAULTDRUM;
            }

            let drumLabels = [];
            let drumValues = [];
            let categories = [];
            let categoriesList = [];
            for (let i = 0; i < DRUMNAMES.length; i++) {
                if (EFFECTSNAMES.indexOf(DRUMNAMES[i][1]) === -1) {
                    let label = _(DRUMNAMES[i][1]);
                    if (getTextWidth(label, "bold 30pt Sans") > 400) {
                        drumLabels.push(label.substr(0, 8) + "...");
                    } else {
                        drumLabels.push(label);
                    }

                    drumValues.push(DRUMNAMES[i][1]);

                    if (categoriesList.indexOf(DRUMNAMES[i][4]) === -1) {
                        categoriesList.push(DRUMNAMES[i][4]);
                    }

                    categories.push(categoriesList.indexOf(DRUMNAMES[i][4]));
                }
            }

            this._piemenuVoices(
                drumLabels,
                drumValues,
                categories,
                selecteddrum
            );
        } else if (this.name === "effectsname") {
            if (this.value != null) {
                 selecteddrum = this.value;
            } else {
                 selectedeffect = DEFAULTEFFECT;
            }

            let effectLabels = [];
            let effectValues = [];
            let effectcategories = [];
            let effectcategoriesList = [];
            for (let i = 0; i < DRUMNAMES.length; i++) {
                if (EFFECTSNAMES.indexOf(DRUMNAMES[i][1]) !== -1) {
                    let label = _(DRUMNAMES[i][1]);
                    if (getTextWidth(label, "Bold 30pt Sans") > 400) {
                        effectLabels.push(label.substr(0, 8) + "...");
                    } else {
                        effectLabels.push(label);
                    }

                    effectValues.push(DRUMNAMES[i][1]);

                    if (effectcategoriesList.indexOf(DRUMNAMES[i][4]) === -1) {
                        effectcategoriesList.push(DRUMNAMES[i][4]);
                    }

                    effectcategories.push(
                        effectcategoriesList.indexOf(DRUMNAMES[i][4])
                    );
                }
            }

            this._piemenuVoices(
                effectLabels,
                effectValues,
                effectcategories,
                selectedeffect
            );
        } else if (this.name === "filtertype") {
            if (this.value != null) {
                selectedtype = this.value;
            } else {
                selectedtype = DEFAULTFILTERTYPE;
            }

            let filterLabels = [];
            let filterValues = [];
            for (let i = 0; i < FILTERTYPES.length; i++) {
                filterLabels.push(_(FILTERTYPES[i][0]));
                filterValues.push(FILTERTYPES[i][1]);
            }

            this._piemenuBasic(
                filterLabels,
                filterValues,
                selectedtype,
                platformColor.piemenuBasic
            );
        } else if (this.name === "oscillatortype") {
            if (this.value != null) {
                selectedtype = this.value;
            } else {
                selectedtype = DEFAULTOSCILLATORTYPE;
            }

            let oscLabels = [];
            let oscValues = [];
            for (let i = 0; i < OSCTYPES.length; i++) {
                oscLabels.push(_(OSCTYPES[i][1]));
                oscValues.push(OSCTYPES[i][1]);
            }

            this._piemenuBasic(
                oscLabels,
                oscValues,
                selectedtype,
                platformColor.piemenuBasic
            );
        } else if (this.name === "voicename") {
            if (this.value != null) {
                selectedvoice = this.value;
            } else {
                selectedvoice = DEFAULTVOICE;
            }

            let voiceLabels = [];
            let voiceValues = [];
            let categories = [];
            let categoriesList = [];
            for (let i = 0; i < VOICENAMES.length; i++) {
                // Skip custom voice in Beginner Mode.
                if (beginnerMode && VOICENAMES[i][1] === "custom") {
                    continue;
                }

                let label = _(VOICENAMES[i][1]);
                if (getTextWidth(label, "bold 30pt Sans") > 400) {
                    voiceLabels.push(label.substr(0, 8) + "...");
                } else {
                    voiceLabels.push(label);
                }

                voiceValues.push(VOICENAMES[i][1]);

                if (categoriesList.indexOf(VOICENAMES[i][3]) === -1) {
                    categoriesList.push(VOICENAMES[i][3]);
                }

                categories.push(categoriesList.indexOf(VOICENAMES[i][3]));
            }

            this._piemenuVoices(
                voiceLabels,
                voiceValues,
                categories,
                selectedvoice
            );
        } else if (this.name === "noisename") {
            if (this.value != null) {
                selectednoise = this.value;
            } else {
                selectednoise = DEFAULTNOISE;
            }

            let noiseLabels = [];
            let noiseValues = [];
            let categories = [];
            let categoriesList = [];
            for (let i = 0; i < NOISENAMES.length; i++) {
                let label = NOISENAMES[i][0];
                if (getTextWidth(label, "bold 30pt Sans") > 600) {
                    noiseLabels.push(label.substr(0, 16) + "...");
                } else {
                    noiseLabels.push(label);
                }

                noiseValues.push(NOISENAMES[i][1]);

                if (categoriesList.indexOf(NOISENAMES[i][3]) === -1) {
                    categoriesList.push(NOISENAMES[i][3]);
                }

                categories.push(categoriesList.indexOf(NOISENAMES[i][3]));
            }

            this._piemenuVoices(
                noiseLabels,
                noiseValues,
                categories,
                selectednoise,
                90
            );
        } else if (this.name === "temperamentname") {
            if (this.value != null) {
                selectedTemperament = this.value;
            } else {
                selectedTemperament = DEFAULTTEMPERAMENT;
            }

            let temperamentLabels = [];
            let temperamentValues = [];
            for (let i = 0; i < TEMPERAMENTS.length; i++) {
                // Skip custom temperament in Beginner Mode.
                if (beginnerMode && TEMPERAMENTS[i][1] === "custom") {
                    continue;
                }

                if (TEMPERAMENTS[i][0].length === 0) {
                    temperamentLabels.push(TEMPERAMENTS[i][2]);
                } else {
                    temperamentLabels.push(TEMPERAMENTS[i][0]);
                }

                temperamentValues.push(TEMPERAMENTS[i][1]);
            }

            this._piemenuBasic(
                temperamentLabels,
                temperamentValues,
                selectedTemperament,
                platformColor.piemenuBasic
            );
        } else if (this.name === "boolean") {
            if (this.value != null) {
                selectedvalue = this.value;
            } else {
                selectedvalue = true;
            }

            let booleanLabels = [_("true"), _("false")];
            let booleanValues = [true, false];

            this._piemenuBoolean(booleanLabels, booleanValues, selectedvalue);
        } else if (this.name === "grid") {

            selectedvalue = this.value;

            let Labels = [
                _("Cartesian"),
                _("polar"),
                _("Cartesian+polar") ,
                _("treble") ,
                _("grand staff") ,
                _("mezzo-soprano") ,
                _("alto") ,
                _("tenor"),
                _("bass") ,
                _("none")
            ];
            let Values = Labels ;

            this._piemenuBasic(
                Labels,
                Values,
                selectedvalue,
                platformColor.piemenuBasic
            );
        } else if (this.name === "outputtools") {
            selectedvalue = this.privateData;
            let Labels;
            if (beginnerMode) {
                Labels = [
                    _("pitch number"),
                    _("pitch in hertz"),
                    _("letter class"),
                    _("staff y")
                ];
            } else {
                Labels = [
                    _("letter class"),
                    _("solfege syllable"),
                    _("pitch class"),
                    _("pitch number"),
                    _("pitch in hertz"),
                    _("scalar class"),
                    _("scale degree"),
                    _("nth degree"),
                    _("staff y"),
                    _("pitch to shade"),
                    _("pitch to color")
                ];
            }

            let Values = Labels;
            this._piemenuBasic(
                Labels,
                Values,
                selectedvalue,
                platformColor.piemenuBasic
            );
        } else {
            // If the number block is connected to a pitch block, then
            // use the pie menu for octaves. Other special cases as well.
            let blk = this.blocks.blockList.indexOf(this);
            if (this.blocks.octaveNumber(blk)) {
                this._piemenuNumber([8, 7, 6, 5, 4, 3, 2, 1], this.value);
            } else if (this.blocks.noteValueNumber(blk, 2)) {
                let cblk = this.connections[0];
                if (cblk !== null) {
                    cblk = this.blocks.blockList[cblk].connections[0];
                    if (
                        cblk !== null &&
                        ["rhythm2", "stuplet"].indexOf(
                            this.blocks.blockList[cblk].name
                        ) !== -1
                    ) {
                        this._piemenuNumber([2, 4, 8, 16], this.value);
                    } else {
                        this._piemenuNoteValue(this.value);
                    }
                } else {
                    this._piemenuNoteValue(this.value);
                }
            } else if (this.blocks.noteValueNumber(blk, 1)) {
                let d = this.blocks.noteValueValue(blk);
                let values;
                if (d === 1) {
                    values = [8, 7, 6, 5, 4, 3, 2, 1];
                } else {
                    values = [];
                    for (let i = 0; i < Math.min(d, 16); i++) {
                        values.push(i + 1);
                    }
                }

                let cblk = this.connections[0];
                if (cblk !== null) {
                    cblk = this.blocks.blockList[cblk].connections[0];
                    if (
                        cblk !== null &&
                        ["neighbor", "neighbor2", "rhythm2", "stuplet"].indexOf(
                            this.blocks.blockList[cblk].name
                        ) !== -1
                    ) {
                        values = [3, 2, 1];
                    }
                }

                this._piemenuNumber(values, this.value);
            } else if (this.blocks.octaveModifierNumber(blk)) {
                this._piemenuNumber([-2, -1, 0, 1, 2], this.value);
            } else if (this.blocks.intervalModifierNumber(blk)) {
                let name = this.blocks.blockList[
                    this.blocks.blockList[this.connections[0]].connections[0]
                    ].name;
                switch (name) {
                    case "interval":
                    case "setscalartransposition":
                        this._piemenuNumber(
                            [
                                -7,
                                -6,
                                -5,
                                -4,
                                -3,
                                -2,
                                -1,
                                0,
                                1,
                                2,
                                3,
                                4,
                                5,
                                6,
                                7
                            ],
                            this.value
                        );
                        break;
                    case "semitoneinterval":
                    case "settransposition":
                        this._piemenuNumber(
                            [
                                -12,
                                -11,
                                -10,
                                -9,
                                -8,
                                -7,
                                -6,
                                -5,
                                -4,
                                -3,
                                -2,
                                -1,
                                0,
                                1,
                                2,
                                3,
                                4,
                                5,
                                6,
                                7,
                                8,
                                9,
                                10,
                                11,
                                12
                            ],
                            this.value
                        );
                        break;
                }
            } else if (this._usePieNumberC3()) {
                if (this.blocks.blockList[this.connections[0]].name === "chorus") {
                    this._piemenuNumber(
                        [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                        this.value
                    );
                }
            } else if (this._usePieNumberC2()) {
                switch (this.blocks.blockList[this.connections[0]].name) {
                    case "duosynth":
                        this._piemenuNumber(
                            [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                            this.value
                        );
                        break;
                    case "setsynthvolume":
                    case "tremolo":
                        this._piemenuNumber(
                            [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                            this.value
                        );
                        break;
                    case "chorus":
                        this._piemenuNumber(
                            [2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 10],
                            this.value
                        );
                        break;
                    case "phaser":
                        this._piemenuNumber([1, 2, 3], this.value);
                        break;
                    case "arc":
                        this._piemenuNumber(
                            [
                                25,
                                50,
                                75,
                                100,
                                125,
                                150,
                                175,
                                200,
                                225,
                                250,
                                275,
                                300
                            ],
                            this.value
                        );
                        break;
                }
            } else if (this._usePieNumberC1()) {
                switch (this.blocks.blockList[this.connections[0]].name) {
                    case "setpensize":
                        this._piemenuNumber(
                            [1, 2, 3, 5, 10, 15, 25, 50, 100],
                            this.value
                        );
                        break;
                    case "setcolor":
                    case "sethue":
                        this._piemenuColor(
                            [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
                            this.value,
                            this.blocks.blockList[this.connections[0]].name
                        );
                        break;
                    case "setshade":
                    case "settranslucency":
                    case "setgrey":
                        this._piemenuColor(
                            [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0],
                            this.value,
                            this.blocks.blockList[this.connections[0]].name
                        );
                        break;
                    case "duplicatenotes":
                        this._piemenuNumber([2, 3, 4, 5, 6, 7, 8], this.value);
                        break;
                    case "setheading":
                        this._piemenuNumber(
                            [
                                0,
                                30,
                                45,
                                60,
                                90,
                                120,
                                135,
                                150,
                                180,
                                210,
                                225,
                                240,
                                270,
                                300,
                                315,
                                330
                            ],
                            this.value
                        );
                        break;
                    case "rhythm2":
                        this._piemenuNumber(
                            [
                                1,
                                2,
                                3,
                                4,
                                5,
                                6,
                                7,
                                8,
                                9,
                                10,
                                11,
                                12,
                                13,
                                14,
                                15,
                                16
                            ],
                            this.value
                        );
                        break;
                    case "stuplet":
                        this._piemenuNumber([3, 5, 7, 11], this.value);
                        break;
                    case "amsynth": // harmocity
                        this._piemenuNumber([1, 2], this.value);
                        break;
                    case "fmsynth": // modulation index
                        this._piemenuNumber([1, 5, 10, 15, 20, 25], this.value);
                        break;
                    case "chorus":
                        this._piemenuNumber(
                            [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
                            this.value
                        );
                        break;
                    case "phaser":
                    case "tremolo":
                        this._piemenuNumber(
                            [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 10, 20],
                            this.value
                        );
                        break;
                    case "arc":
                        this._piemenuNumber(
                            [
                                15,
                                30,
                                45,
                                60,
                                75,
                                90,
                                105,
                                120,
                                135,
                                150,
                                165,
                                180,
                                195,
                                210,
                                225,
                                240,
                                255,
                                270,
                                285,
                                300,
                                315,
                                330,
                                345,
                                360
                            ],
                            this.value
                        );
                        break;
                    case "rhythmicdot2":
                        this._piemenuNumber([1, 2, 3], this.value);
                        break;
                    case "register":
                        this._piemenuNumber(
                            [-3, -2, -1, 0, 1, 2, 3],
                            this.value
                        );
                        break;
                    case "nthmodalpitch":
                        this._piemenuNthModalPitch(
                            [7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7],
                            this.value
                        );
                        break;
                    case "onbeatdo":
                    case "meter":
                        this._piemenuNumber(
                            [
                                1,
                                2,
                                3,
                                4,
                                5,
                                6,
                                7,
                                8,
                                9,
                                10,
                                11,
                                12,
                                13,
                                14,
                                15,
                                16
                            ],
                            this.value
                        );
                        break;
                    case "pitchnumber":
                        let temperament;
                        for (let i = 0; i < this.blocks.blockList.length; i++) {
                            if (
                                this.blocks.blockList[i].name ===
                                "settemperament" &&
                                this.blocks.blockList[i].connections[0] !== null
                            ) {
                                let index = this.blocks.blockList[i]
                                    .connections[1];
                                temperament = this.blocks.blockList[index]
                                    .value;
                            }
                        }

                        if (temperament === undefined) {
                            temperament = "equal";
                        }

                        if (temperament === "equal") {
                            this._piemenuNumber(
                                [
                                    -3,
                                    -2,
                                    -1,
                                    0,
                                    1,
                                    2,
                                    3,
                                    4,
                                    5,
                                    6,
                                    7,
                                    8,
                                    9,
                                    10,
                                    11,
                                    12
                                ],
                                this.value
                            );
                        } else {
                            let pitchNumbers = [];
                            for (
                                let i = 0;
                                i < TEMPERAMENT[temperament]["pitchNumber"];
                                i++
                            ) {
                                pitchNumbers.push(i);
                            }
                            this._piemenuNumber(pitchNumbers, this.value);
                        }
                        break;
                    case "neighbor":
                    case "neighbor2":
                    case "steppitch":
                    case "interval":
                    case "setscalartransposition":
                        this._piemenuNumber(
                            [
                                -7,
                                -6,
                                -5,
                                -4,
                                -3,
                                -2,
                                -1,
                                0,
                                1,
                                2,
                                3,
                                4,
                                5,
                                6,
                                7
                            ],
                            this.value
                        );
                        break;
                    case "decrescendo":
                    case "crescendo":
                        this._piemenuNumber(
                            [1, 2, 3, 4, 5, 10, 15, 20],
                            this.value
                        );
                        break;
                    case "harmonic2":
                        this._piemenuNumber(
                            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                            this.value
                        );
                        break;
                    case "vibrato":
                        this._piemenuNumber(
                            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                            this.value
                        );
                        break;
                    case "semitoneinterval":
                    case "settransposition":
                        this._piemenuNumber(
                            [
                                -12,
                                -11,
                                -10,
                                -9,
                                -8,
                                -7,
                                -6,
                                -5,
                                -4,
                                -3,
                                -2,
                                -1,
                                0,
                                1,
                                2,
                                3,
                                4,
                                5,
                                6,
                                7,
                                8,
                                9,
                                10,
                                11,
                                12
                            ],
                            this.value
                        );
                        break;
                    case "setnotevolume":
                        this._piemenuNumber(
                            [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                            this.value
                        );
                        break;
                    case "dis":
                    case "duosynth":
                        this._piemenuNumber(
                            [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
                            this.value
                        );
                        break;
                    case "articulation":
                        this._piemenuNumber(
                            [-25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25],
                            this.value
                        );
                        break;
                    case "hertz":
                        this._piemenuNumber(
                            [
                                220,
                                247,
                                262,
                                294,
                                330,
                                349,
                                392,
                                440,
                                494,
                                523,
                                587,
                                659,
                                698,
                                784,
                                880
                            ],
                            this.value
                        );
                        break;
                    case "right":
                        this._piemenuNumber(
                            [
                                0,
                                30,
                                60,
                                90,
                                120,
                                150,
                                180,
                                210,
                                240,
                                270,
                                300,
                                330
                            ],
                            this.value
                        );
                        break;
                    case "left":
                        this._piemenuNumber(
                            [
                                330,
                                300,
                                270,
                                240,
                                210,
                                180,
                                150,
                                120,
                                90,
                                60,
                                30,
                                0
                            ],
                            this.value
                        );
                        break;
                    case "setpanning":
                        this._piemenuNumber(
                            [ 100, 80, 60, 40, 20, 0, -20, -40, -60, -80, -100],
                            this.value
                        );
                        break;
                    case "setbpm3": case "setmasterbpm2": 
                        this._piemenuNumber ( 
                        [
                        40,
                        42,
                        44,
                        46,
                        48,
                        50,
                        52,
                        54,
                        56,
                        58,
                        60,
                        63,
                        66,
                        69,
                        72,
                        76,
                        80,
                        84,
                        88,
                        90,
                        92,
                        96,
                        100,
                        104,
                        108,
                        112,
                        116,
                        120,
                        126,
                        132,
                        138,
                        144,
                        152,
                        160,
                        168,
                        176,
                        184,
                        192,
                        200,
                        208,
                    ],
                    this.value
                    );
                    break;

                }
            } else {
                labelElem.innerHTML =
                    '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' +
                    labelValue +
                    '" />';
                labelElem.classList.add("hasKeyboard");
                this.label = docById("numberLabel");
            }
        }

        let blk = this.blocks.blockList.indexOf(this);
        if (!this._usePiemenu()) {
            let focused = false;

            let __blur = function(event) {
                // Not sure why the change in the input is not available
                // immediately in FireFox. We need a workaround if hardware
                // acceleration is enabled.
                if (!focused) {
                    return;
                }

                that._labelChanged(true, true);

                event.preventDefault();

                labelElem.classList.remove("hasKeyboard");

                window.scroll(0, 0);
                that.label.removeEventListener("keypress", __keypress);

                if (movedStage) {
                    that.blocks.stage.y = fromY;
                    that.blocks.updateStage();
                }
            };

            let __input = function(event) {
                that._labelChanged(false, true);
            };

            if (this.name === "text" || this.name === "number") {
                this.label.addEventListener("blur", __blur);
                this.label.addEventListener("input", __input);
            }

            let __keypress = function(event) {
                if ([13, 10, 9].indexOf(event.keyCode) !== -1) {
                    __blur(event);
                }
            };

            this.label.addEventListener("keypress", __keypress);

            this.label.addEventListener("change", function() {
                that._labelChanged(false, true);
            });

            this.label.style.left =
                Math.round(
                    (x + this.blocks.stage.x) * this.blocks.getStageScale() +
                    canvasLeft
                ) + "px";
            this.label.style.top =
                Math.round(
                    (y + this.blocks.stage.y) * this.blocks.getStageScale() +
                    canvasTop
                ) + "px";
            this.label.style.width =
                (Math.round(selectorWidth * this.blocks.blockScale) *
                    this.protoblock.scale) /
                2 +
                "px";

            this.label.style.fontSize =
                Math.round(
                    (20 * this.blocks.blockScale * this.protoblock.scale) / 2
                ) + "px";
            this.label.style.display = "";
            this.label.focus();
            if (this.labelattr != null) {
                this.labelattr.style.display = "";
            }

            // Firefox fix
            setTimeout(function() {
                that.label.style.display = "";
                that.label.focus();
                focused = true;
            }, 100);
        }
    };

    /**
     * Keypress handler. Handles exit key (Tab and Enter) press.
     * @param{Event} KeyPress event object
     * @returns{void}
     * @private
     */
    this._exitKeyPressed = function(event) {
        if ([13, 10, 9].indexOf(event.keyCode) !== -1) {
            this._labelChanged(true, false);
            event.preventDefault();
            this.label.removeEventListener("keypress", this._exitKeyPressed);
        }
    };
    /*
     * Check if pie menu is ok to launch
     * @return{void}
     * @public
     */
    this.piemenuOKtoLaunch = function() {
        if (this._piemenuExitTime === null) {
            return true;
        }

        return new Date().getTime() - this._piemenuExitTime > 200;
    };

    this._noteValueNumber = function(c) {
        // Is this a number block being used as a note value
        // denominator argument?
        let dblk = this.connections[0];
        // Are we connected to a divide block?
        if (
            this.name === "number" &&
            dblk !== null &&
            this.blocks.blockList[dblk].name === "divide"
        ) {
            // Are we the denominator (c == 2) or numerator (c == 1)?
            if (
                this.blocks.blockList[dblk].connections[c] ===
                this.blocks.blockList.indexOf(this)
            ) {
                // Is the divide block connected to a note value block?
                cblk = this.blocks.blockList[dblk].connections[0];
                if (cblk !== null) {
                    // Is it the first or second arg?
                    switch (this.blocks.blockList[cblk].name) {
                        case "newnote":
                        case "pickup":
                        case "tuplet4":
                        case "newstaccato":
                        case "newslur":
                        case "elapsednotes2":
                            return this.blocks.blockList[cblk].connections[1] === dblk;
                            break;
                        case "meter":
                            this._check_meter_block = cblk;
                        case "setbpm2":
                        case "setmasterbpm2":
                        case "stuplet":
                        case "rhythm2":
                        case "newswing2":
                        case "vibrato":
                        case "neighbor":
                        case "neighbor2":
                            return this.blocks.blockList[cblk].connections[2] === dblk;
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

    this._noteValueValue = function() {
        // Return the number block value being used as a note value
        // denominator argument.
        let dblk = this.connections[0];
        // We are connected to a divide block.
        // Is the divide block connected to a note value block?
        cblk = this.blocks.blockList[dblk].connections[0];
        if (cblk !== null) {
            // Is it the first or second arg?
            switch (this.blocks.blockList[cblk].name) {
                case "newnote":
                case "pickup":
                case "tuplet4":
                case "newstaccato":
                case "newslur":
                case "elapsednotes2":
                    if (this.blocks.blockList[cblk].connections[1] === dblk) {
                        cblk = this.blocks.blockList[dblk].connections[2];
                        return this.blocks.blockList[cblk].value;
                    } else {
                        return 1;
                    }
                    break;
                case "meter":
                    this._check_meter_block = cblk;
                case "setbpm2":
                case "setmasterbpm2":
                case "stuplet":
                case "rhythm2":
                case "newswing2":
                case "vibrato":
                case "neighbor":
                case "neighbor2":
                    if (this.blocks.blockList[cblk].connections[2] === dblk) {
                        if (
                            this.blocks.blockList[cblk].connections[1] === dblk
                        ) {
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

    this._octaveNumber = function() {
        // Is this a number block being used as an octave argument?
        return (
            this.name === "number" &&
            this.connections[0] !== null &&
            [
                "pitch",
                "setpitchnumberoffset",
                "invert1",
                "tofrequency",
                "nthmodalpitch"
            ].indexOf(this.blocks.blockList[this.connections[0]].name) !== -1 &&
            this.blocks.blockList[this.connections[0]].connections[2] ===
            this.blocks.blockList.indexOf(this)
        );
    };

    this._piemenuPitches = function(
        noteLabels,
        noteValues,
        accidentals,
        note,
        accidental,
        custom
    ) {
        let prevPitch = null;

        // wheelNav pie menu for pitch selection
        if (this.blocks.stageClick) {
            return;
        }

        if (custom === undefined) {
            custom = false;
        }

        // Some blocks have both pitch and octave, so we can modify
        // both at once.
        let hasOctaveWheel =
            this.connections[0] !== null &&
            ["pitch", "setpitchnumberoffset", "invert1", "tofrequency"].indexOf(
                this.blocks.blockList[this.connections[0]].name
            ) !== -1;

        // If we are attached to a set key block, we want to order
        // pitch by fifths.
        if (
            this.connections[0] !== null &&
            ["setkey", "setkey2"].indexOf(
                this.blocks.blockList[this.connections[0]].name
            ) !== -1
        ) {
            noteLabels = ["C", "G", "D", "A", "E", "B", "F"];
            noteValues = ["C", "G", "D", "A", "E", "B", "F"];
        }

        docById("wheelDiv").style.display = "";

        // the pitch selector
        this._pitchWheel = new wheelnav("wheelDiv", null, 600, 600);

        if (!custom) {
            // the accidental selector
            this._accidentalsWheel = new wheelnav(
                "_accidentalsWheel",
                this._pitchWheel.raphael
            );
        }
        // the octave selector
        if (hasOctaveWheel) {
            this._octavesWheel = new wheelnav(
                "_octavesWheel",
                this._pitchWheel.raphael
            );
        }

        // exit button
        this._exitWheel = new wheelnav("_exitWheel", this._pitchWheel.raphael);

        wheelnav.cssMode = true;

        this._pitchWheel.keynavigateEnabled = false;

        this._pitchWheel.colors = platformColor.pitchWheelcolors;
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

        this._pitchWheel.animatetime = 0; // 300;
        this._pitchWheel.createWheel(noteLabels);

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["×", " "]);

        if (!custom) {
            this._accidentalsWheel.colors =
                platformColor.accidentalsWheelcolors;
            this._accidentalsWheel.slicePathFunction = slicePath().DonutSlice;
            this._accidentalsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._accidentalsWheel.slicePathCustom.minRadiusPercent = 0.5;
            this._accidentalsWheel.slicePathCustom.maxRadiusPercent = 0.75;
            this._accidentalsWheel.sliceSelectedPathCustom = this._accidentalsWheel.slicePathCustom;
            this._accidentalsWheel.sliceInitPathCustom = this._accidentalsWheel.slicePathCustom;

            let accidentalLabels = [];
            for (let i = 0; i < accidentals.length; i++) {
                accidentalLabels.push(accidentals[i]);
            }

            for (let i = 0; i < 9; i++) {
                accidentalLabels.push(null);
                this._accidentalsWheel.colors.push(
                    platformColor.accidentalsWheelcolorspush
                );
            }

            this._accidentalsWheel.animatetime = 0; // 300;
            this._accidentalsWheel.createWheel(accidentalLabels);
            this._accidentalsWheel.setTooltips([
                _("double sharp"),
                _("sharp"),
                _("natural"),
                _("flat"),
                _("double flat")
            ]);
        }
        if (hasOctaveWheel) {
            this._octavesWheel.colors = platformColor.octavesWheelcolors;
            this._octavesWheel.slicePathFunction = slicePath().DonutSlice;
            this._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._octavesWheel.slicePathCustom.minRadiusPercent = 0.75;
            this._octavesWheel.slicePathCustom.maxRadiusPercent = 0.95;
            this._octavesWheel.sliceSelectedPathCustom = this._octavesWheel.slicePathCustom;
            this._octavesWheel.sliceInitPathCustom = this._octavesWheel.slicePathCustom;
            let octaveLabels = [
                "8",
                "7",
                "6",
                "5",
                "4",
                "3",
                "2",
                "1",
                null,
                null,
                null,
                null,
                null,
                null
            ];
            this._octavesWheel.animatetime = 0; // 300;
            this._octavesWheel.createWheel(octaveLabels);
        }

        // Position the widget over the note block.
        let x = this.container.x;
        let y = this.container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById("wheelDiv").style.position = "absolute";
        docById("wheelDiv").style.height = "300px";
        docById("wheelDiv").style.width = "300px";
        docById("wheelDiv").style.left =
            Math.min(
                this.blocks.turtles._canvas.width - 300,
                Math.max(
                    0,
                    Math.round(
                        (x + this.blocks.stage.x) *
                        this.blocks.getStageScale() +
                        canvasLeft
                    ) - 200
                )
            ) + "px";
        docById("wheelDiv").style.top =
            Math.min(
                this.blocks.turtles._canvas.height - 350,
                Math.max(
                    0,
                    Math.round(
                        (y + this.blocks.stage.y) *
                        this.blocks.getStageScale() +
                        canvasTop
                    ) - 200
                )
            ) + "px";

        // Navigate to a the current note value.
        let i = noteValues.indexOf(note);
        if (i === -1) {
            if (custom) i = 0 ;
            else i = 4 ;
        }

        prevPitch = i;

        this._pitchWheel.navigateWheel(i);
        let scale = _buildScale(KeySignatureEnv[0] + " " + KeySignatureEnv[1])[0];

        // auto selection of sharps and flats in fixed solfege
        // handles the case of opening the pie-menu, not whilst in the pie-menu
        if (!KeySignatureEnv[2]) {
            for (let i in scale) {
                if (scale[i].substr(0, 1) == FIXEDSOLFEGE[note] ||
                scale[i].substr(0, 1) == note) {
                    accidental = scale[i].substr(1);
                    this.value = this.value.replace(SHARP, "").replace(FLAT, "");
                    this.value += accidental;
                    this.text.text = this.value;
                }
            }
        }

        if (!custom) {
            // Navigate to a the current accidental value.
            if (accidental === "") {
                this._accidentalsWheel.navigateWheel(2);
            } else {
                switch (accidental) {
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
            let pitchOctave = this.blocks.findPitchOctave(this.connections[0]);

            // Navigate to current octave
            this._octavesWheel.navigateWheel(8 - pitchOctave);
            prevOctave = 8 - pitchOctave;
        }

        // Set up event handlers
        let that = this;
        let selection = {
            "note": note,
            "attr": accidental
        };

        let __selectionChangedSolfege = function() {
            selection["note"] =
                that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex]
                    .title;
            let i = noteLabels.indexOf(selection["note"]);
            that.value = noteValues[i];

            let scale = _buildScale(KeySignatureEnv[0] + " " + KeySignatureEnv[1])[0];
        
            // auto selection of sharps and flats in fixed solfege
            // handles the case of opening the pie-menu, not whilst in the pie-menu
            // FIXEDSOLFEGE converts solfege to alphabet, needed for solfege pie-menu
            // In case of alphabet, direct comparison is performed

            if (!KeySignatureEnv[2]) {
                for (let i in scale) {
                    if (
                        (scale[i].substr(0, 1) == FIXEDSOLFEGE[selection["note"]] ||
                        scale[i].substr(0, 1) == selection["note"])) {
                        selection["attr"] = scale[i].substr(1);
                        that.value = selection["note"] + selection["attr"];
                        switch (selection["attr"]) {
                            case DOUBLEFLAT:
                                that._accidentalsWheel.navigateWheel(4);
                                break;
                            case FLAT:
                                that._accidentalsWheel.navigateWheel(3);
                                break;
                            case NATURAL:
                                that._accidentalsWheel.navigateWheel(2);
                                break;
                            case SHARP:
                                that._accidentalsWheel.navigateWheel(1);
                                break;
                            case DOUBLESHARP:
                                that._accidentalsWheel.navigateWheel(0);
                                break;
                            default:
                                that._accidentalsWheel.navigateWheel(2);
                                break;
                        }
                    }
                }
            }
            that.text.text = selection["note"];
            if (selection["attr"] !== "♮") {
                that.text.text += selection["attr"];
            }

            // Make sure text is on top.
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();

            if (hasOctaveWheel) {
                // Set the octave of the pitch block if available
                let octave = Number(
                    that._octavesWheel.navItems[
                        that._octavesWheel.selectedNavItemIndex
                    ].title
                );
                that.blocks.setPitchOctave(that.connections[0], octave);
            }

            if (
                that.connections[0] !== null &&
                ["setkey", "setkey2"].indexOf(
                    that.blocks.blockList[that.connections[0]].name
                ) !== -1
            ) {
                // We may need to update the mode widget.
                that.blocks.logo._modeBlock = that.blocks.blockList.indexOf(that);
            }
            __pitchPreview();
        };


        let __selectionChangedAccidental = () => {
            selection["attr"] =
                that._accidentalsWheel.navItems[
                    that._accidentalsWheel.selectedNavItemIndex
                ].title;

            if (selection["attr"] !== "♮") {
                that.value = selection["note"] + selection["attr"];
            } else {
                that.value = selection["note"];
            }
            that.text.text = that.value;
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();
            __pitchPreview();
        };

        /*
         * Preview the selected pitch using the synth
         * @return{void}
         * @private
         */
        let __pitchPreview = function() {
            let label = that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex].title;
            let i = noteLabels.indexOf(label);

            // Are we wrapping across C? We need to compare with the previous pitch
            if (prevPitch === null) {
                prevPitch = i;
            }

            let deltaPitch = i - prevPitch;
            let delta;
            if (deltaPitch > 3) {
                delta = deltaPitch - 7;
            } else if (deltaPitch < -3) {
                delta = deltaPitch + 7;
            } else {
                delta = deltaPitch;
            }

            // If we wrapped across C, we need to adjust the octave.
            let deltaOctave = 0;
            if (prevPitch + delta > 6) {
                deltaOctave = -1;
            } else if (prevPitch + delta < 0) {
                deltaOctave = 1;
            }
            let attr;
            prevPitch = i;
            let note = noteValues[i];
            if (!custom) {
                attr =
                    that._accidentalsWheel.navItems[
                        that._accidentalsWheel.selectedNavItemIndex
                    ].title;

                if (label === " ") {
                    return;
                } else if (attr !== "♮") {
                    note += attr;
                }
            }

            let octave;
            if (hasOctaveWheel) {
                octave = Number(
                    that._octavesWheel.navItems[
                        that._octavesWheel.selectedNavItemIndex
                    ].title
                );
            } else {
                octave = 4;
            }

            octave += deltaOctave;
            if (octave < 1) {
                octave = 1;
            } else if (octave > 8) {
                octave = 8;
            }

            if (hasOctaveWheel && deltaOctave !== 0) {
                that._octavesWheel.navigateWheel(8 - octave);
                that.blocks.setPitchOctave(that.connections[0], octave);
            }
            
            let keySignature = KeySignatureEnv[0] + " " + KeySignatureEnv[1];

            let obj;
            if (that.name == "scaledegree2") {
                note = note.replace(attr, "");
                note = SOLFEGENAMES[note - 1];
                note += attr;
                obj = getNote(
                    note,
                    octave,
                    0,
                    keySignature,
                    true,
                    null,
                    that.blocks.errorMsg,
                    that.blocks.logo.synth.inTemperament
                );
            } else {
                console.log(note);
                obj = getNote(
                    note,
                    octave,
                    0,
                    keySignature,
                    KeySignatureEnv[2],
                    null,
                    that.blocks.errorMsg,
                    that.blocks.logo.synth.inTemperament
                );
            }
            if (!custom) {
                obj[0] = obj[0].replace(SHARP, "#").replace(FLAT, "b");
            }

            let tur = that.blocks.logo.turtles.ithTurtle(0);

            if (
                tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1
            ) {
                tur.singer.instrumentNames.push(DEFAULTVOICE);
                that.blocks.logo.synth.createDefaultSynth(0);
                that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
            }

            that.blocks.logo.synth.setMasterVolume(PREVIEWVOLUME);
            Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, PREVIEWVOLUME);

            if (!that._triggerLock) {
                that._triggerLock = true;
                that.blocks.logo.synth.trigger(
                    0,
                    [obj[0] + obj[1]],
                    1 / 8,
                    DEFAULTVOICE,
                    null,
                    null
                );
            }

            setTimeout(function() {
                that._triggerLock = false;
            }, 1 / 8);

        };

        // Set up handlers for pitch preview.
        for (let i = 0; i < noteValues.length; i++) {
            this._pitchWheel.navItems[i].navigateFunction = __selectionChangedSolfege;
        }

        if (!custom) {
            for (let i = 0; i < accidentals.length; i++) {
                this._accidentalsWheel.navItems[
                    i
                ].navigateFunction = __selectionChangedAccidental;
            }
        }

        if (hasOctaveWheel) {
            for (let i = 0; i < 8; i++) {
                this._octavesWheel.navItems[
                    i
                ].navigateFunction = __pitchPreview;
            }
        }

        // Hide the widget when the exit button is clicked.
        this._exitWheel.navItems[0].navigateFunction = function() {
            that._piemenuExitTime = new Date().getTime();
            docById("wheelDiv").style.display = "none";
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

    this._customNotes = function(
        noteLabels,
        customLabels,
        selectedCustom,
        selectedNote
    ){
        // pie menu for customNote selection
        if (this.blocks.stageClick) {
            return;
        }

        docById("wheelDiv").style.display = "";

        // Some blocks have both pitch and octave, so we can modify
        // both at once.
        let hasOctaveWheel =
            this.connections[0] !== null &&
            ["pitch", "setpitchnumberoffset", "invert1", "tofrequency"].indexOf(
                this.blocks.blockList[this.connections[0]].name
            ) !== -1;

        // Use advanced constructor for more wheelnav on same div
        this._customWheel = new wheelnav("wheelDiv", null, 800, 800);


        this._cusNoteWheel = new wheelnav(
            "_cusNoteWheel",
            this._customWheel.raphael
        );
        // exit button
        this._exitWheel = new wheelnav(
            "_exitWheel",
            this._customWheel.raphael
        );

        // the octave selector
        if (hasOctaveWheel) {
            this._octavesWheel = new wheelnav(
                "_octavesWheel",
                this._customWheel.raphael
            );
        }


        wheelnav.cssMode = true;

        this._customWheel.keynavigateEnabled = false;

        //Customize slicePaths for proper size
        this._customWheel.colors = platformColor.intervalNameWheelcolors;
        this._customWheel.slicePathFunction = slicePath().DonutSlice;
        this._customWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._customWheel.slicePathCustom.minRadiusPercent = 0.1;
        this._customWheel.slicePathCustom.maxRadiusPercent = 0.5;
        this._customWheel.sliceSelectedPathCustom = this._customWheel.slicePathCustom;
        this._customWheel.sliceInitPathCustom = this._customWheel.slicePathCustom;
        this._customWheel.titleRotateAngle = 0;
        this._customWheel.animatetime = 0; // 300;
        this._customWheel.clickModeRotate = false;
        this._customWheel.createWheel(customLabels);

        this._cusNoteWheel.colors = platformColor.intervalWheelcolors;
        this._cusNoteWheel.slicePathFunction = slicePath().DonutSlice;
        this._cusNoteWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._cusNoteWheel.slicePathCustom.minRadiusPercent = 0.5;
        this._cusNoteWheel.slicePathCustom.maxRadiusPercent = 0.85;
        //this._cusNoteWheel.titleRotateAngle = 0;
        this._cusNoteWheel.titleFont = '100 24px Impact, sans-serif';
        this._cusNoteWheel.sliceSelectedPathCustom = this._cusNoteWheel.slicePathCustom;
        this._cusNoteWheel.sliceInitPathCustom = this._cusNoteWheel.slicePathCustom;

        if (hasOctaveWheel) {
            this._octavesWheel.colors = platformColor.octavesWheelcolors;
            this._octavesWheel.slicePathFunction = slicePath().DonutSlice;
            this._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this._octavesWheel.slicePathCustom.minRadiusPercent = 0.85;
            this._octavesWheel.slicePathCustom.maxRadiusPercent = 1;
            this._octavesWheel.sliceSelectedPathCustom = this._octavesWheel.slicePathCustom;
            this._octavesWheel.sliceInitPathCustom = this._octavesWheel.slicePathCustom;
            let octaveLabels = [
                "8",
                "7",
                "6",
                "5",
                "4",
                "3",
                "2",
                "1",
                null,
                null,
                null,
                null,
                null,
                null
            ];
            this._octavesWheel.animatetime = 0; // 300;
            this._octavesWheel.createWheel(octaveLabels);
        }

        //Disable rotation, set navAngle and create the menus
        this._cusNoteWheel.clickModeRotate = false;
        this._cusNoteWheel.animatetime = 0; // 300;
        let labels = [];
        let thisCustom=0;
        let max =0 ;
        for (let t of customLabels) {
            max = max > noteLabels[t]["pitchNumber"] ? max : noteLabels[t]["pitchNumber"] ;
        }
        for (let t of customLabels) {
            for(let k =noteLabels[t].length -1 ; k>=0 ;k--) {
                if (k !== "pitchNumber") {
                    labels.push(noteLabels[t][k][1]);
                    thisCustom ++ ;
                }
            }
            for (let extra = max - thisCustom ; extra > 0 ;extra--){
                labels.push("");
            }
            thisCustom = 0 ;
        }

        this._cusNoteWheel.navAngle =
            -(180 / customLabels.length) + 180 / labels.length;
        this._cusNoteWheel.createWheel(labels);

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.1;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["×", " "]);

        let that = this;

        // position widget
        let x = this.container.x;
        let y = this.container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById("wheelDiv").style.position = "absolute";
        docById("wheelDiv").style.height = "400px";
        docById("wheelDiv").style.width = "400px";
        docById("wheelDiv").style.left =
            Math.min(
                this.blocks.turtles._canvas.width - 400,
                Math.max(
                    0,
                    Math.round(
                        (x + this.blocks.stage.x) *
                        this.blocks.getStageScale() +
                        canvasLeft
                    ) - 200
                )
            ) + "px";
        docById("wheelDiv").style.top =
            Math.min(
                this.blocks.turtles._canvas.height - 450,
                Math.max(
                    0,
                    Math.round(
                        (y + this.blocks.stage.y) *
                        this.blocks.getStageScale() +
                        canvasTop
                    ) - 200
                )
            ) + "px";


        if (hasOctaveWheel) {
            // Use the octave associated with this block, if available.
            let pitchOctave = this.blocks.findPitchOctave(this.connections[0]);

            // Navigate to current octave
            this._octavesWheel.navigateWheel(8 - pitchOctave);
        }

        // Add function to each main menu for show/hide sub menus
        // FIXME: Add all tabs to each interval
        let __setupAction = function(i) {
            that._customWheel.navItems[i].navigateFunction = function() {
                that.customID =
                    that._customWheel.navItems[
                        that._customWheel.selectedNavItemIndex
                        ].title;
                for (let l = 0; l < customLabels.length; l++) {
                    for (let j = 0; j < max; j++) {
                        if (l !== i) {
                            that._cusNoteWheel.navItems[
                            l * max + j
                                ].navItem.hide();
                            } else if (labels[l * max + j] == "") {
                            that._cusNoteWheel.navItems[
                            l * max + j
                                ].navItem.hide();
                        } else {
                            that._cusNoteWheel.navItems[
                            l * max + j
                                ].navItem.show();
                        }
                    }
                }
            };
        };

        // Set up action for interval name so number tabs will
        // initialize on load.
        for (var i = 0; i < customLabels.length; i++) __setupAction(i);

        // navigate to a specific starting point

        for (var i = 0; i < customLabels.length; i++) {
            if (selectedCustom === customLabels[i]) {
                break;
            }
        }

        if (i === customLabels.length) {
            i = 0;
        }

        this._customWheel.navigateWheel(i);

        let j = selectedNote ;
        for (let x in noteLabels[selectedCustom]){
            if (x != "pitchNumber" && noteLabels[selectedCustom][x][1] == j) {
                j = +x ; break ;
            }
        }

        if (typeof j  == "number")
            this._cusNoteWheel.navigateWheel(max * customLabels.indexOf (selectedCustom) + j);

        let __exitMenu = function() {
            that._piemenuExitTime = new Date().getTime();
            docById("wheelDiv").style.display = "none";
        };

        let __selectionChanged = function() {
            let label =
                that._customWheel.navItems[
                    that._customWheel.selectedNavItemIndex
                    ].title;
            let note =
                that._cusNoteWheel.navItems[
                    that._cusNoteWheel.selectedNavItemIndex
                    ].title;

            that.value = note;
            that.text.text =note;
            let octave = 4 ;

            if (hasOctaveWheel) {
                // Set the octave of the pitch block if available
                octave = Number(
                    that._octavesWheel.navItems[
                        that._octavesWheel.selectedNavItemIndex
                        ].title
                );
                that.blocks.setPitchOctave(that.connections[0], octave);
            }

            // Make sure text is on top.
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();

            let obj = getNote(
                note,
                octave,
                0,
                "C major",
                false,
                null,
                that.blocks.errorMsg,
                label
            );

            let tur = that.blocks.logo.turtles.ithTurtle(0);

            if (
                tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1
            ) {
                tur.singer.instrumentNames.push(DEFAULTVOICE);
                that.blocks.logo.synth.createDefaultSynth(0);
                that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
            }

            that.blocks.logo.synth.setMasterVolume(PREVIEWVOLUME);
            Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, PREVIEWVOLUME);

            if (!that._triggerLock) {
                //preview :
                that._triggerLock = true;
                let no = [obj[0]+obj[1]];
                let notes1 = no ;
                no = that.blocks.logo.synth.getCustomFrequency(no,that.customID);
                if (no === undefined) {
                    no = notes1;
                }
                instruments[0][DEFAULTVOICE].triggerAttackRelease(no, 1/8);
            }

            setTimeout(function() {
                that._triggerLock = false;
            }, 1 / 8);
        }
        if (hasOctaveWheel) {
            for (let i = 0; i < 8; i++) {
                this._octavesWheel.navItems[
                    i
                    ].navigateFunction = __selectionChanged;
            }
        }
        // Set up handlers for preview.
        for (var i = 0; i < labels.length; i++) {
            this._cusNoteWheel.navItems[
                i
            ].navigateFunction = __selectionChanged;
        }

        this._exitWheel.navItems[0].navigateFunction = __exitMenu;
    };

    this._piemenuNthModalPitch = function(noteValues, note) {
        // wheelNav pie menu for scale degree pitch selection

        // check if a non-integer value is connected to note argument
        // Pie menu would crash; so in such case navigate to closest integer

        if (note % 1 !== 0) {
            note = Math.floor(note + 0.5);
        }

        if (this.blocks.stageClick) {
            return;
        }

        let noteLabels = [];
        for (let i = 0; i < noteValues.length; i++) {
            noteLabels.push(noteValues[i].toString());
        }
        noteLabels.push(null);

        docById("wheelDiv").style.display = "";

        this._pitchWheel = new wheelnav("wheelDiv", null, 600, 600);
        this._octavesWheel = new wheelnav(
            "_octavesWheel",
            this._pitchWheel.raphael
        );
        this._exitWheel = new wheelnav("_exitWheel", this._pitchWheel.raphael);

        wheelnav.cssMode = true;

        this._pitchWheel.keynavigateEnabled = false;

        this._pitchWheel.colors = platformColor.pitchWheelcolors;
        this._pitchWheel.slicePathFunction = slicePath().DonutSlice;
        this._pitchWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._pitchWheel.slicePathCustom.minRadiusPercent = 0.35;
        this._pitchWheel.slicePathCustom.maxRadiusPercent = 0.72;
        this._pitchWheel.sliceSelectedPathCustom = this._pitchWheel.slicePathCustom;
        this._pitchWheel.sliceInitPathCustom = this._pitchWheel.slicePathCustom;

        this._pitchWheel.animatetime = 0; // 300;
        this._pitchWheel.createWheel(noteLabels);

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["×", " "]);

        this._octavesWheel.colors = platformColor.octavesWheelcolors;
        this._octavesWheel.slicePathFunction = slicePath().DonutSlice;
        this._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._octavesWheel.slicePathCustom.minRadiusPercent = 0.80;
        this._octavesWheel.slicePathCustom.maxRadiusPercent = 1.00;
        this._octavesWheel.sliceSelectedPathCustom = this._octavesWheel.slicePathCustom;
        this._octavesWheel.sliceInitPathCustom = this._octavesWheel.slicePathCustom;
        let octaveLabels = [
            "8",
            "7",
            "6",
            "5",
            "4",
            "3",
            "2",
            "1",
            null,
            null,
            null,
            null,
            null,
            null
        ];
        this._octavesWheel.animatetime = 0; // 300;
        this._octavesWheel.createWheel(octaveLabels);

        // enable changing values while pie-menu is open
        let labelElem = docById("labelDiv");
        labelElem.innerHTML =
            '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' +
            note +
            '" />';
        labelElem.classList.add("hasKeyboard");

        this.label = docById("numberLabel");
        this.label.addEventListener(
            "keypress",
            this._exitKeyPressed.bind(this)
        );

        this.label.addEventListener("change", function() {
            that._labelChanged(false, false);
        });

        // Position the widget above/below note block.
        let x = this.container.x;
        let y = this.container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById("wheelDiv").style.position = "absolute";
        docById("wheelDiv").style.height = "300px";
        docById("wheelDiv").style.width = "300px";

        let selectorWidth = 150;
        let left = Math.round(
            (x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft
        );
        let top = Math.round(
            (y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop
        );
        this.label.style.left = left + "px";
        this.label.style.top = top + "px";

        docById("wheelDiv").style.left =
            Math.min(
                Math.max(left - (300 - selectorWidth) / 2, 0),
                this.blocks.turtles._canvas.width - 300
            ) + "px";

        if (top - 300 < 0) {
            docById("wheelDiv").style.top = top + 40 + "px";
        } else {
            docById("wheelDiv").style.top = top - 300 + "px";
        }

        this.label.style.width =
            (Math.round(selectorWidth * this.blocks.blockScale) *
                this.protoblock.scale) /
            2 +
            "px";

        this.label.style.fontSize =
            Math.round(
                (20 * this.blocks.blockScale * this.protoblock.scale) / 2
            ) + "px";

        // Navigate to a the current note value.
        let i = noteValues.indexOf(note);

        this._pitchWheel.navigateWheel(i);

        // Use the octave associated with this block, if available.
        let pitchOctave = this.blocks.findPitchOctave(this.connections[0]);

        // Navigate to current octave
        this._octavesWheel.navigateWheel(8 - pitchOctave);

        // Set up event handlers
        let that = this;

        /*
         * Change selection and set value to notevalue
         * @return{void}
         * @private
         */
        let __selectionChanged = function() {
            let label =
                that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex]
                    .title;
            let i = noteLabels.indexOf(label);
            that.value = noteValues[i];
            that.text.text = label;

            // Make sure text is on top.
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();

            // Set the octave of the pitch block if available
            let octave = Number(
                that._octavesWheel.navItems[
                    that._octavesWheel.selectedNavItemIndex
                ].title
            );
            that.blocks.setPitchOctave(that.connections[0], octave);
        };

        /*
         * Preview pitch
         * @return{void}
         * @private
         */
        let __pitchPreview = function() {
            let label =
                that._pitchWheel.navItems[that._pitchWheel.selectedNavItemIndex]
                    .title;
            let i = noteLabels.indexOf(label);

            /* We're using a default of C major ==> -7 to -1 should be one octave lower
                than the reference, 0-6 in the same octave and 7 should be once octave higher
            */
            let deltaOctave = 0;
            if (noteLabels[i] == 7) {
                deltaOctave = 1;
            } else if (noteLabels[i] < 0) {
                deltaOctave = -1;
            }

            // prevPitch = i;
            let octave = Number(
                that._octavesWheel.navItems[
                    that._octavesWheel.selectedNavItemIndex
                ].title
            );
            octave += deltaOctave;
            if (octave < 1) {
                octave = 1;
            } else if (octave > 8) {
                octave = 8;
            }

            let note;

            // Use C major as of now; fix this to use current keySignature once that feature is in place
            let keySignature = KeySignatureEnv[0] + " " + KeySignatureEnv[1];
            if (noteValues[i] >= 0) {
                note = nthDegreeToPitch(keySignature, noteValues[i]);
            } else {
                note = nthDegreeToPitch(keySignature, 7 + noteValues[i]);
            }

            let tur = that.blocks.logo.turtles.ithTurtle(0);

            if (
                tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1
            ) {
                tur.singer.instrumentNames.push(DEFAULTVOICE);
                that.blocks.logo.synth.createDefaultSynth(0);
                that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
            }

            that.blocks.logo.synth.setMasterVolume(PREVIEWVOLUME);
            Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, PREVIEWVOLUME);

            //Play sample note and prevent extra sounds from playing
            if (!that._triggerLock) {
                that._triggerLock = true;
                that.blocks.logo.synth.trigger(
                    0,
                    [note.replace(SHARP, "#").replace(FLAT, "b") + octave],
                    1 / 8,
                    DEFAULTVOICE,
                    null,
                    null
                );
            }

            setTimeout(function() {
                that._triggerLock = false;
            }, 1 / 8);

            __selectionChanged();
        };
        // Set up handlers for pitch preview.
        for (let i = 0; i < noteValues.length; i++) {
            this._pitchWheel.navItems[i].navigateFunction = __pitchPreview;
        }

        for (let i = 0; i < 8; i++) {
            this._octavesWheel.navItems[i].navigateFunction = __pitchPreview;
        }

        // Hide the widget when the exit button is clicked.
        this._exitWheel.navItems[0].navigateFunction = function() {
            that._piemenuExitTime = new Date().getTime();
            docById("wheelDiv").style.display = "none";
            that._pitchWheel.removeWheel();
            that._exitWheel.removeWheel();
            that._octavesWheel.removeWheel();
        };
    };

    this._piemenuAccidentals = function(
        accidentalLabels,
        accidentalValues,
        accidental
    ) {
        // wheelNav pie menu for accidental selection

        if (this.blocks.stageClick) {
            return;
        }

        docById("wheelDiv").style.display = "";

        // the accidental selector
        this._accidentalWheel = new wheelnav("wheelDiv", null, 600, 600);
        // exit button
        this._exitWheel = new wheelnav(
            "_exitWheel",
            this._accidentalWheel.raphael
        );

        let labels = [];
        for (let i = 0; i < accidentalLabels.length; i++) {
            labels.push(last(accidentalLabels[i].split(" ")));
        }

        labels.push(null);

        wheelnav.cssMode = true;

        this._accidentalWheel.keynavigateEnabled = false;

        this._accidentalWheel.colors = platformColor.accidentalsWheelcolors;
        this._accidentalWheel.slicePathFunction = slicePath().DonutSlice;
        this._accidentalWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._accidentalWheel.slicePathCustom.minRadiusPercent = 0.2;
        this._accidentalWheel.slicePathCustom.maxRadiusPercent = 0.6;
        this._accidentalWheel.sliceSelectedPathCustom = this._accidentalWheel.slicePathCustom;
        this._accidentalWheel.sliceInitPathCustom = this._accidentalWheel.slicePathCustom;
        this._accidentalWheel.titleRotateAngle = 0;
        this._accidentalWheel.animatetime = 0; // 300;
        this._accidentalWheel.createWheel(labels);
        this._accidentalWheel.setTooltips(accidentalLabels);

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["×", " "]);

        let that = this;

        let __selectionChanged = function() {
            let label =
                that._accidentalWheel.navItems[
                    that._accidentalWheel.selectedNavItemIndex
                    ].title;
            let i = labels.indexOf(label);
            that.value = accidentalValues[i];
            that.text.text = accidentalLabels[i];

            // Make sure text is on top.
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();
        };

        /*
         * Exit menu
         * @return{void}
         * @private
         */
        let __exitMenu = function() {
            that._piemenuExitTime = new Date().getTime();
            docById("wheelDiv").style.display = "none";
            that._accidentalWheel.removeWheel();
            that._exitWheel.removeWheel();
        };

        // Position the widget over the note block.
        let x = this.container.x;
        let y = this.container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById("wheelDiv").style.position = "absolute";
        docById("wheelDiv").style.height = "300px";
        docById("wheelDiv").style.width = "300px";
        docById("wheelDiv").style.left =
            Math.min(
                this.blocks.turtles._canvas.width - 300,
                Math.max(
                    0,
                    Math.round(
                        (x + this.blocks.stage.x) *
                        this.blocks.getStageScale() +
                        canvasLeft
                    ) - 200
                )
            ) + "px";
        docById("wheelDiv").style.top =
            Math.min(
                this.blocks.turtles._canvas.height - 350,
                Math.max(
                    0,
                    Math.round(
                        (y + this.blocks.stage.y) *
                        this.blocks.getStageScale() +
                        canvasTop
                    ) - 200
                )
            ) + "px";

        // Navigate to a the current accidental value.
        let i = accidentalValues.indexOf(accidental);
        if (i === -1) {
            i = 2;
        }

        this._accidentalWheel.navigateWheel(i);

        // Hide the widget when the selection is made.
        for (let i = 0; i < accidentalLabels.length; i++) {
            this._accidentalWheel.navItems[i].navigateFunction = function() {
                __selectionChanged();
                __exitMenu();
            };
        }

        // Or use the exit wheel...
        this._exitWheel.navItems[0].navigateFunction = function() {
            __exitMenu();
        };
    };

    this._piemenuNoteValue = function(noteValue) {
        // input form and  wheelNav pie menu for note value selection

        if (this.blocks.stageClick) {
            return;
        }

        docById("wheelDiv").style.display = "";

        // We want powers of two on the bottom, nearest the input box
        // as it is most common.
        const WHEELVALUES = [3, 2, 7, 5];
        let subWheelValues = {
            2: [1, 2, 4, 8, 16, 32],
            3: [1, 3, 6, 9, 12, 27],
            5: [1, 5, 10, 15, 20, 25],
            7: [1, 7, 14, 21, 28, 35]
        };

        let cblk = this.connections[0];
        if (cblk !== null) {
            cblk = this.blocks.blockList[cblk].connections[0];
            if (
                cblk !== null &&
                ["neighbor", "neighbor2"].indexOf(
                    this.blocks.blockList[cblk].name
                ) !== -1
            ) {
                subWheelValues = {
                    2: [8, 16, 32, 64],
                    3: [9, 12, 27, 54],
                    5: [10, 15, 20, 25],
                    7: [14, 21, 28, 35]
                };
            }
        }

        // the noteValue selector
        this._noteValueWheel = new wheelnav("wheelDiv", null, 600, 600);
        // exit button
        this._exitWheel = new wheelnav(
            "_exitWheel",
            this._noteValueWheel.raphael
        );
        // submenu wheel
        this._tabsWheel = new wheelnav(
            "_tabsWheel",
            this._noteValueWheel.raphael
        );

        let noteValueLabels = [];
        for (let i = 0; i < WHEELVALUES.length; i++) {
            noteValueLabels.push(WHEELVALUES[i].toString());
        }

        wheelnav.cssMode = true;

        this._noteValueWheel.keynavigateEnabled = false;

        this._noteValueWheel.colors = platformColor.noteValueWheelcolors;
        this._noteValueWheel.slicePathFunction = slicePath().DonutSlice;
        this._noteValueWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._noteValueWheel.slicePathCustom.minRadiusPercent = 0.2;
        this._noteValueWheel.slicePathCustom.maxRadiusPercent = 0.6;
        this._noteValueWheel.sliceSelectedPathCustom = this._noteValueWheel.slicePathCustom;
        this._noteValueWheel.sliceInitPathCustom = this._noteValueWheel.slicePathCustom;
        this._noteValueWheel.animatetime = 0; // 300;
        this._noteValueWheel.clickModeRotate = false;
        this._noteValueWheel.createWheel(noteValueLabels);

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["×", " "]);

        let tabsLabels = [];
        for (let i = 0; i < WHEELVALUES.length; i++) {
            for (var j = 0; j < subWheelValues[WHEELVALUES[i]].length; j++) {
                tabsLabels.push(subWheelValues[WHEELVALUES[i]][j].toString());
            }
        }

        this._tabsWheel.colors = platformColor.tabsWheelcolors;
        this._tabsWheel.slicePathFunction = slicePath().DonutSlice;
        this._tabsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._tabsWheel.slicePathCustom.minRadiusPercent = 0.6;
        this._tabsWheel.slicePathCustom.maxRadiusPercent = 0.8;
        this._tabsWheel.sliceSelectedPathCustom = this._tabsWheel.slicePathCustom;
        this._tabsWheel.sliceInitPathCustom = this._tabsWheel.slicePathCustom;
        this._tabsWheel.clickModeRotate = false;
        this._tabsWheel.navAngle =
            -180 / WHEELVALUES.length +
            180 / (WHEELVALUES.length * subWheelValues[WHEELVALUES[0]].length);
        this._tabsWheel.createWheel(tabsLabels);

        let that = this;

        /*
         * set value to number of text
         * @return{void}
         * @private
         */
        let __selectionChanged = function() {
            that.text.text =
                that._tabsWheel.navItems[
                    that._tabsWheel.selectedNavItemIndex
                    ].title;
            that.value = Number(that.text.text);

            // Make sure text is on top.
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();
        };

        /*
         * set pie menu's exit time to current time
         * @return{void}
         * @public
         */
        let __exitMenu = function() {
            that._piemenuExitTime = new Date().getTime();
            docById("wheelDiv").style.display = "none";
            that._noteValueWheel.removeWheel();
            that._exitWheel.removeWheel();
            that.label.style.display = "none";
            if (that._check_meter_block !== null) {
                that.blocks.meter_block_changed(that._check_meter_block);
            }
        };

        let labelElem = docById("labelDiv");
        labelElem.innerHTML =
            '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' +
            noteValue +
            '" />';
        labelElem.classList.add("hasKeyboard");
        this.label = docById("numberLabel");

        this.label.addEventListener(
            "keypress",
            this._exitKeyPressed.bind(this)
        );

        this.label.addEventListener("change", function() {
            that._labelChanged(false, false);
        });

        // Position the widget over the note block.
        let x = this.container.x;
        let y = this.container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById("wheelDiv").style.position = "absolute";
        docById("wheelDiv").style.height = "300px";
        docById("wheelDiv").style.width = "300px";

        let selectorWidth = 150;
        let left = Math.round(
            (x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft
        );
        let top = Math.round(
            (y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop
        );
        this.label.style.left = left + "px";
        this.label.style.top = top + "px";

        docById("wheelDiv").style.left =
            Math.min(
                Math.max(left - (300 - selectorWidth) / 2, 0),
                this.blocks.turtles._canvas.width - 300
            ) + "px";
        if (top - 300 < 0) {
            docById("wheelDiv").style.top = top + 40 + "px";
        } else {
            docById("wheelDiv").style.top = top - 300 + "px";
        }

        this.label.style.width =
            (Math.round(selectorWidth * this.blocks.blockScale) *
                this.protoblock.scale) /
            2 +
            "px";

        let __showHide = function() {
            let i = that._noteValueWheel.selectedNavItemIndex;
            for (let k = 0; k < WHEELVALUES.length; k++) {
                for (
                    let j = 0;
                    j < subWheelValues[WHEELVALUES[0]].length;
                    j++
                ) {
                    let n = k * subWheelValues[WHEELVALUES[0]].length;
                    if (that._noteValueWheel.selectedNavItemIndex === k) {
                        that._tabsWheel.navItems[n + j].navItem.show();
                    } else {
                        that._tabsWheel.navItems[n + j].navItem.hide();
                    }
                }
            }
        };

        for (let i = 0; i < noteValueLabels.length; i++) {
            this._noteValueWheel.navItems[i].navigateFunction = __showHide;
        }

        // Navigate to a the current noteValue value.
        // Special case 1 to use power of 2.
        if (noteValue === 1) {
            this._noteValueWheel.navigateWheel(1);
            this._tabsWheel.navigateWheel(0);
        } else {
            for (var i = 0; i < WHEELVALUES.length; i++) {
                for (
                    let j = 0;
                    j < subWheelValues[WHEELVALUES[i]].length;
                    j++
                ) {
                    if (subWheelValues[WHEELVALUES[i]][j] === noteValue) {
                        this._noteValueWheel.navigateWheel(i);
                        this._tabsWheel.navigateWheel(
                            i * subWheelValues[WHEELVALUES[i]].length + j
                        );
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

        this.label.style.fontSize =
            Math.round(
                (20 * this.blocks.blockScale * this.protoblock.scale) / 2
            ) + "px";
        this.label.style.display = "";
        this.label.focus();

        // Hide the widget when the selection is made.
        for (let i = 0; i < tabsLabels.length; i++) {
            this._tabsWheel.navItems[i].navigateFunction = function() {
                __selectionChanged();
                __exitMenu();
            };
        }

        // Or use the exit wheel...
        this._exitWheel.navItems[0].navigateFunction = function() {
            __exitMenu();
        };
    };

    this._piemenuNumber = function(wheelValues, selectedValue) {
        // input form and  wheelNav pie menu for number selection

        if (this.blocks.stageClick) {
            return;
        }

        docById("wheelDiv").style.display = "";

        // the number selector
        this._numberWheel = new wheelnav("wheelDiv", null, 600, 600);
        // exit button
        this._exitWheel = new wheelnav("_exitWheel", this._numberWheel.raphael);

        let wheelLabels = [];
        for (let i = 0; i < wheelValues.length; i++) {
            wheelLabels.push(wheelValues[i].toString());
        }

        // spacer
        wheelLabels.push(null);

        wheelnav.cssMode = true;

        this._numberWheel.keynavigateEnabled = false;

        this._numberWheel.colors = platformColor.numberWheelcolors;
        this._numberWheel.slicePathFunction = slicePath().DonutSlice;
        this._numberWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        if (wheelValues.length > 16) {
            this._numberWheel.slicePathCustom.minRadiusPercent = 0.6;
            this._numberWheel.slicePathCustom.maxRadiusPercent = 1.0;
        } else if (wheelValues.length > 10) {
            this._numberWheel.slicePathCustom.minRadiusPercent = 0.5;
            this._numberWheel.slicePathCustom.maxRadiusPercent = 0.9;
        } else {
            this._numberWheel.slicePathCustom.minRadiusPercent = 0.2;
            this._numberWheel.slicePathCustom.maxRadiusPercent = 0.6;
        }

        this._numberWheel.sliceSelectedPathCustom = this._numberWheel.slicePathCustom;
        this._numberWheel.sliceInitPathCustom = this._numberWheel.slicePathCustom;
        if (this.blocks.blockList[this.connections[0]].name === "setbpm3" || this.blocks.blockList[this.connections[0]].name === "setmasterbpm2") {
            this._numberWheel.titleRotateAngle = 0;
            if (selectedValue === 90) {
                selectedValue = 90;
            } else if (selectedValue < 40) {
                selectedValue = 40;
            } else if (selectedValue < 60) {
                selectedValue = Math.floor(this.value / 2) * 2;
            } else if (selectedValue < 72) {
                selectedValue = Math.floor(this.value / 3) * 3;
            } else if (selectedValue < 120) {
                selectedValue = Math.floor(this.value / 4) * 4;
            } else if (selectedValue < 144) {
                selectedValue = Math.floor(this.value / 6) * 6;
            } else if (selectedValue < 208) {
                selectedValue = Math.floor(this.value / 8) * 8;
            } else {
                selectedValue = 208;
            }
        }
        this._numberWheel.animatetime = 0; // 300;
        this._numberWheel.createWheel(wheelLabels);

        if (this._numberWheel.navItems.length > 20) {
            for (let i = 0; i < this._numberWheel.navItems.length; i++) {
                this._numberWheel.navItems[i].titleAttr.font =
                    "30 30px sans-serif";
                this._numberWheel.navItems[i].titleSelectedAttr.font =
                    "30 30px sans-serif";
            }
        }

        this._exitWheel.colors = platformColor.exitWheelcolors2;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["×", "-", "+"]);

        let that = this;

        let __selectionChanged = function() {
            that.value = wheelValues[that._numberWheel.selectedNavItemIndex];
            that.text.text =
                wheelLabels[that._numberWheel.selectedNavItemIndex];

            // Make sure text is on top.
            that.container.setChildIndex(that.text,  that.container.children.length - 1);
            that.updateCache();
        };

        let __exitMenu = function() {
            that._piemenuExitTime = new Date().getTime();
            docById("wheelDiv").style.display = "none";
            that._numberWheel.removeWheel();
            that._exitWheel.removeWheel();
            that.label.style.display = "none";

            if (that._check_meter_block !== null) {
                that.blocks.meter_block_changed(that._check_meter_block);
            }
        };

        let labelElem = docById("labelDiv");
        labelElem.innerHTML =
            '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' +
            selectedValue +
            '" />';
        labelElem.classList.add("hasKeyboard");
        this.label = docById("numberLabel");

        this.label.addEventListener(
            "keypress",
            this._exitKeyPressed.bind(this)
        );

        this.label.addEventListener("change", function() {
            that._labelChanged(false, false);
        });

        // Position the widget over the note block.
        let x = this.container.x;
        let y = this.container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById("wheelDiv").style.position = "absolute";
        docById("wheelDiv").style.height = "300px";
        docById("wheelDiv").style.width = "300px";

        let selectorWidth = 150;
        let left = Math.round(
            (x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft
        );
        let top = Math.round(
            (y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop
        );
        this.label.style.left = left + "px";
        this.label.style.top = top + "px";

        docById("wheelDiv").style.left =
            Math.min(
                Math.max(left - (300 - selectorWidth) / 2, 0),
                this.blocks.turtles._canvas.width - 300
            ) + "px";
        if (top - 300 < 0) {
            docById("wheelDiv").style.top = top + 40 + "px";
        } else {
            docById("wheelDiv").style.top = top - 300 + "px";
        }

        this.label.style.width =
            (Math.round(selectorWidth * this.blocks.blockScale) *
                this.protoblock.scale) /
            2 +
            "px";
        // Navigate to a the current number value.
        let i = wheelValues.indexOf(selectedValue);
        if (i === -1) {
            i = 0;
        }

        // In case of float value, navigate to the nearest integer
        if (selectedValue % 1 !== 0) {
            i = wheelValues.indexOf(Math.floor(selectedValue + 0.5));
        }

        this._numberWheel.navigateWheel(i);

        this.label.style.fontSize =
            Math.round(
                (20 * this.blocks.blockScale * this.protoblock.scale) / 2
            ) + "px";

        this.label.style.display = "";
        this.label.focus();

        // Hide the widget when the selection is made.
        for (let i = 0; i < wheelLabels.length; i++) {
            this._numberWheel.navItems[i].navigateFunction = function() {
                __selectionChanged();
                __exitMenu();
            };
        }

        // Or use the exit wheel...
        this._exitWheel.navItems[0].navigateFunction = function() {
            __exitMenu();
        };

        this._exitWheel.navItems[1].navigateFunction = function () {
            let cblk1 = that.connections[0];
            let cblk2 = that.blocks.blockList[cblk1].connections[0];

            // Check if the number block is connected to a note value and prevent the value to go below zero
            if ((that.value < 1) && (that.blocks.blockList[cblk1].name === 'newnote' || (cblk2 && that.blocks.blockList[cblk2].name == 'newnote'))) {
                that.value = 0;
            } else {
                that.value -= 1;
            }

            that.text.text = that.value.toString();

            // Make sure text is on top.
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();

            that.label.value = that.value;
        };

        this._exitWheel.navItems[2].navigateFunction = function() {
            that.value += 1;
            that.text.text = that.value.toString();

            // Make sure text is on top.
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();

            that.label.value = that.value;
        };

        let __pitchPreviewForNum = function() {
            let label = that._numberWheel.navItems[that._numberWheel.selectedNavItemIndex].title;
            let i = wheelLabels.indexOf(label);
            let actualPitch = numberToPitch(wheelValues[i] + 3);

            let tur = that.blocks.logo.turtles.ithTurtle(0);

            if (
                tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1
            ) {
                tur.singer.instrumentNames.push(DEFAULTVOICE);
                that.blocks.logo.synth.createDefaultSynth(0);
                that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
            }

            that.blocks.logo.synth.setMasterVolume(PREVIEWVOLUME);
            Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, PREVIEWVOLUME);

            actualPitch[0] = actualPitch[0]
                .replace(SHARP, "#")
                .replace(FLAT, "b");
            if (!that._triggerLock) {
                that._triggerLock = true;
                that.blocks.logo.synth.trigger(
                    0,
                    actualPitch[0] + (actualPitch[1] + 3),
                    1 / 8,
                    DEFAULTVOICE,
                    null,
                    null
                );
            }

            setTimeout(function() {
                that._triggerLock = false;
            }, 1 / 8);

            __selectionChanged();
        };

        let __hertzPreview = function() {
            let label = that._numberWheel.navItems[that._numberWheel.selectedNavItemIndex].title;
            let i = wheelLabels.indexOf(label);
            let actualPitch = frequencyToPitch(wheelValues[i]);

            let tur = that.blocks.logo.turtles.ithTurtle(0);

            if (
                tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1
            ) {
                tur.singer.instrumentNames.push(DEFAULTVOICE);
                that.blocks.logo.synth.createDefaultSynth(0);
                that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
            }

            that.blocks.logo.synth.setMasterVolume(PREVIEWVOLUME);
            Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, PREVIEWVOLUME);

            actualPitch[0] = actualPitch[0]
                .replace(SHARP, "#")
                .replace(FLAT, "b");
            if (!that._triggerLock) {
                that._triggerLock = true;
                that.blocks.logo.synth.trigger(
                    0,
                    actualPitch[0] + actualPitch[1],
                    1 / 8,
                    DEFAULTVOICE,
                    null,
                    null
                );
            }

            setTimeout(function() {
                that._triggerLock = false;
            }, 1 / 8);

            __selectionChanged();
        };

        // Handler for pitchnumber preview. This is to ensure that
        // only pitchnumber block's pie menu gets a sound preview
        if (
            this._usePieNumberC1() &&
            this.blocks.blockList[this.connections[0]].name === "pitchnumber"
        ) {
            for (let i = 0; i < wheelValues.length; i++) {
                this._numberWheel.navItems[
                    i
                    ].navigateFunction = __pitchPreviewForNum;
            }
        }

        // Handler for Hertz preview. Need to also ensure that
        // only hertz block gets a different sound preview
        if (
            this._usePieNumberC1() &&
            this.blocks.blockList[this.connections[0]].name === "hertz"
        ) {
            for (let i = 0; i < wheelValues.length; i++) {
                this._numberWheel.navItems[i].navigateFunction = __hertzPreview;
            }
        }
    };

    this._piemenuColor = function(wheelValues, selectedValue, mode) {
        // input form and  wheelNav pie menu for setcolor selection

        if (this.blocks.stageClick) {
            return;
        }

        docById("wheelDiv").style.display = "";

        // the number selector
        this._numberWheel = new wheelnav("wheelDiv", null, 600, 600);
        // exit button
        this._exitWheel = new wheelnav("_exitWheel", this._numberWheel.raphael);

        let wheelLabels = [];
        for (let i = 0; i < wheelValues.length; i++) {
            wheelLabels.push(wheelValues[i].toString());
        }

        wheelnav.cssMode = true;

        this._numberWheel.keynavigateEnabled = false;

        this._numberWheel.colors = [];
        if (mode === "setcolor") {
            for (let i = 0; i < wheelValues.length; i++) {
                this._numberWheel.colors.push(
                    COLORS40[Math.floor(wheelValues[i] / 2.5)][2]
                );
            }
        } else if (mode === "sethue") {
            for (let i = 0; i < wheelValues.length; i++) {
                this._numberWheel.colors.push(
                    getMunsellColor(wheelValues[i], 50, 50)
                );
            }
        } else {
            if (mode === "setshade") {
                for (let i = 0; i < wheelValues.length; i++) {
                    this._numberWheel.colors.push(
                        getMunsellColor(0, wheelValues[i], 0)
                    );
                }
            } else if (mode === "settranslucency") {
                for (let i = 0; i < wheelValues.length; i++) {
                    this._numberWheel.colors.push(
                        getMunsellColor(35, 70, 100 - wheelValues[i])
                    );
                }
            } else {
                for (let i = 0; i < wheelValues.length; i++) {
                    this._numberWheel.colors.push(
                        getMunsellColor(60, 60, wheelValues[i])
                    );
                }
            }

            for (let i = 0; i < wheelValues.length; i++) {
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
        this._numberWheel.animatetime = 0; // 300;
        this._numberWheel.createWheel(wheelLabels);

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["×", " "]);

        let that = this;

        let __selectionChanged = function() {
            that.value = wheelValues[that._numberWheel.selectedNavItemIndex];
            that.text.text =
                wheelLabels[that._numberWheel.selectedNavItemIndex];

            // Make sure text is on top.
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();
        };

        let __exitMenu = function() {
            that._piemenuExitTime = new Date().getTime();
            docById("wheelDiv").style.display = "none";
            that._numberWheel.removeWheel();
            that._exitWheel.removeWheel();
            that.label.style.display = "none";
        };

        let labelElem = docById("labelDiv");
        labelElem.innerHTML =
            '<input id="numberLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="number" type="number" value="' +
            selectedValue +
            '" />';
        labelElem.classList.add("hasKeyboard");
        this.label = docById("numberLabel");

        this.label.addEventListener(
            "keypress",
            this._exitKeyPressed.bind(this)
        );

        this.label.addEventListener("change", function() {
            that._labelChanged(false, false);
        });

        // Position the widget over the note block.
        let x = this.container.x;
        let y = this.container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById("wheelDiv").style.position = "absolute";
        docById("wheelDiv").style.height = "300px";
        docById("wheelDiv").style.width = "300px";

        let selectorWidth = 150;
        let left = Math.round(
            (x + this.blocks.stage.x) * this.blocks.getStageScale() + canvasLeft
        );
        let top = Math.round(
            (y + this.blocks.stage.y) * this.blocks.getStageScale() + canvasTop
        );
        this.label.style.left = left + "px";
        this.label.style.top = top + "px";

        docById("wheelDiv").style.left =
            Math.min(
                Math.max(left - (300 - selectorWidth) / 2, 0),
                this.blocks.turtles._canvas.width - 300
            ) + "px";
        if (top - 300 < 0) {
            docById("wheelDiv").style.top = top + 40 + "px";
        } else {
            docById("wheelDiv").style.top = top - 300 + "px";
        }

        this.label.style.width =
            (Math.round(selectorWidth * this.blocks.blockScale) *
                this.protoblock.scale) /
            2 +
            "px";

        // Navigate to a the current number value.
        let i = wheelValues.indexOf(selectedValue);
        if (i === -1) {
            i = 0;
        }

        this._numberWheel.navigateWheel(i);
        // docById('wheelDiv').style.display = '';

        this.label.style.fontSize =
            Math.round(
                (20 * this.blocks.blockScale * this.protoblock.scale) / 2
            ) + "px";
        this.label.style.display = "";
        this.label.focus();

        // Hide the widget when the selection is made.
        for (let i = 0; i < wheelLabels.length; i++) {
            this._numberWheel.navItems[i].navigateFunction = function() {
                __selectionChanged();
                __exitMenu();
            };
        }

        // Or use the exit wheel...
        this._exitWheel.navItems[0].navigateFunction = function() {
            __exitMenu();
        };
    };

    this._piemenuBasic = function(
        menuLabels,
        menuValues,
        selectedValue,
        colors
    ) {
        // basic wheelNav pie menu

        if (this.blocks.stageClick) {
            return;
        }

        if (colors === undefined) {
            colors = platformColor.piemenuBasicundefined;
        }

        docById("wheelDiv").style.display = "";

        // reference to diameter of the basic wheel
        let size = 800;
        if (this.name === "outputtools" || this.name === "grid") {
            // slightly larger menu
            size = 1000;
        }

        // the selectedValueh selector
        this._basicWheel = new wheelnav("wheelDiv", null, size, size);

        let labels = [];
        for (let i = 0; i < menuLabels.length; i++) {
            labels.push(menuLabels[i]);
        }

        wheelnav.cssMode = true;

        this._basicWheel.keynavigateEnabled = false;

        this._basicWheel.colors = colors;
        this._basicWheel.slicePathFunction = slicePath().DonutSlice;
        this._basicWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._basicWheel.slicePathCustom.minRadiusPercent = 0.2;
        this._basicWheel.slicePathCustom.maxRadiusPercent = 1.0;
        this._basicWheel.sliceSelectedPathCustom = this._basicWheel.slicePathCustom;
        this._basicWheel.sliceInitPathCustom = this._basicWheel.slicePathCustom;
        this._basicWheel.titleRotateAngle = 0;
        this._basicWheel.animatetime = 0; // 300;
        this._basicWheel.createWheel(labels);

        let that = this;

        let __selectionChanged = function() {
            let label =
                that._basicWheel.navItems[that._basicWheel.selectedNavItemIndex]
                    .title;
            let i = labels.indexOf(label);
            if (that.name === "outputtools") {
                  that.overrideName = menuValues[i];
                  that.privateData = menuValues[i];
                  that.text.text = menuLabels[i];
            } else {
                that.value = menuValues[i];
                that.text.text = menuLabels[i];
            }
            // Make sure text is on top.
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();
        };

        let __exitMenu = function() {
            that._piemenuExitTime = new Date().getTime();
            docById("wheelDiv").style.display = "none";
            that._basicWheel.removeWheel();
        };

        // Position the widget over the note block.
        let x = this.container.x;
        let y = this.container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById("wheelDiv").style.position = "absolute";
        docById("wheelDiv").style.height = "300px";
        docById("wheelDiv").style.width = "300px";
        docById("wheelDiv").style.left =
            Math.min(
                this.blocks.turtles._canvas.width - 300,
                Math.max(
                    0,
                    Math.round(
                        (x + this.blocks.stage.x) *
                        this.blocks.getStageScale() +
                        canvasLeft
                    ) - 200
                )
            ) + "px";
        docById("wheelDiv").style.top =
            Math.min(
                this.blocks.turtles._canvas.height - 350,
                Math.max(
                    0,
                    Math.round(
                        (y + this.blocks.stage.y) *
                        this.blocks.getStageScale() +
                        canvasTop
                    ) - 200
                )
            ) + "px";

        // Navigate to a the current selectedValue value.
        let i = menuValues.indexOf(selectedValue);
        if (i === -1) {
            i = 1;
        }

        this._basicWheel.navigateWheel(i);

        // Hide the widget when the selection is made.
        for (let i = 0; i < menuLabels.length; i++) {
            this._basicWheel.navItems[i].navigateFunction = function() {
                __selectionChanged();
                __exitMenu();
            };
        }
    };

    this._piemenuBoolean = function(booleanLabels, booleanValues, boolean) {
        // wheelNav pie menu for boolean selection

        if (this.blocks.stageClick) {
            return;
        }

        docById("wheelDiv").style.display = "";

        // the booleanh selector
        this._booleanWheel = new wheelnav("wheelDiv", null, 600, 600);

        let labels = [];
        for (let i = 0; i < booleanLabels.length; i++) {
            labels.push(booleanLabels[i]);
        }

        wheelnav.cssMode = true;

        this._booleanWheel.keynavigateEnabled = false;

        this._booleanWheel.colors = platformColor.booleanWheelcolors;
        this._booleanWheel.slicePathFunction = slicePath().DonutSlice;
        this._booleanWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._booleanWheel.slicePathCustom.minRadiusPercent = 0;
        this._booleanWheel.slicePathCustom.maxRadiusPercent = 0.6;
        this._booleanWheel.sliceSelectedPathCustom = this._booleanWheel.slicePathCustom;
        this._booleanWheel.sliceInitPathCustom = this._booleanWheel.slicePathCustom;
        // this._booleanWheel.titleRotateAngle = 0;
        this._booleanWheel.animatetime = 0; // 300;
        this._booleanWheel.createWheel(labels);

        let that = this;

        let __selectionChanged = function() {
            let label =
                that._booleanWheel.navItems[
                    that._booleanWheel.selectedNavItemIndex
                    ].title;
            let i = labels.indexOf(label);
            that.value = booleanValues[i];
            that.text.text = booleanLabels[i];

            // Make sure text is on top.
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();
        };

        let __exitMenu = function() {
            that._piemenuExitTime = new Date().getTime();
            docById("wheelDiv").style.display = "none";
            that._booleanWheel.removeWheel();
        };

        // Position the widget over the note block.
        let x = this.container.x;
        let y = this.container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById("wheelDiv").style.position = "absolute";
        docById("wheelDiv").style.height = "300px";
        docById("wheelDiv").style.width = "300px";
        docById("wheelDiv").style.left =
            Math.min(
                this.blocks.turtles._canvas.width - 300,
                Math.max(
                    0,
                    Math.round(
                        (x + this.blocks.stage.x) *
                        this.blocks.getStageScale() +
                        canvasLeft
                    ) - 200
                )
            ) + "px";
        docById("wheelDiv").style.top =
            Math.min(
                this.blocks.turtles._canvas.height - 350,
                Math.max(
                    0,
                    Math.round(
                        (y + this.blocks.stage.y) *
                        this.blocks.getStageScale() +
                        canvasTop
                    ) - 200
                )
            ) + "px";

        // Navigate to a the current boolean value.
        let i = booleanValues.indexOf(boolean);
        if (i === -1) {
            i = 0;
        }

        this._booleanWheel.navigateWheel(i);

        // Hide the widget when the selection is made.
        this._booleanWheel.navItems[0].navigateFunction = function() {
            __selectionChanged();
            __exitMenu();
        };

        this._booleanWheel.navItems[1].navigateFunction = function() {
            __selectionChanged();
            __exitMenu();
        };
    };

    this._piemenuVoices = function(
        voiceLabels,
        voiceValues,
        categories,
        voice,
        rotate
    ) {
        // wheelNav pie menu for voice selection

        if (this.blocks.stageClick) {
            return;
        }

        const COLORS = platformColor.piemenuVoicesColors;
        let colors = [];

        for (let i = 0; i < voiceLabels.length; i++) {
            colors.push(COLORS[categories[i] % COLORS.length]);
        }

        docById("wheelDiv").style.display = "";

        // the voice selector
        if (localStorage.kanaPreference === "kana") {
            this._voiceWheel = new wheelnav("wheelDiv", null, 1200, 1200);
        } else {
            this._voiceWheel = new wheelnav("wheelDiv", null, 800, 800);
        }

        // exit button
        this._exitWheel = new wheelnav("_exitWheel", this._voiceWheel.raphael);

        wheelnav.cssMode = true;

        this._voiceWheel.keynavigateEnabled = false;

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

        this._voiceWheel.animatetime = 0; // 300;
        this._voiceWheel.createWheel(voiceLabels);

        // Special case for Japanese
        let language = localStorage.languagePreference;
        // if (language === 'ja') {
        for (let i = 0; i < this._voiceWheel.navItems.length; i++) {
            this._voiceWheel.navItems[i].titleAttr.font = "30 30px sans-serif";
            this._voiceWheel.navItems[i].titleSelectedAttr.font =
                "30 30px sans-serif";
        }
        // }

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["×", " "]);

        let that = this;

        let __selectionChanged = function() {
            let label =
                that._voiceWheel.navItems[that._voiceWheel.selectedNavItemIndex]
                    .title;
            let i = voiceLabels.indexOf(label);
            that.value = voiceValues[i];
            that.text.text = label;

            if (getDrumName(that.value) === null) {
                that.blocks.logo.synth.loadSynth(
                    0,
                    getVoiceSynthName(that.value)
                );
            } else {
                that.blocks.logo.synth.loadSynth(
                    0,
                    getDrumSynthName(that.value)
                );
            }

            // Make sure text is on top.
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();
        };

        /*
         * Preview voice
         * @return{void}
         * @private
         */
        let __voicePreview = function() {
            let label = that._voiceWheel.navItems[that._voiceWheel.selectedNavItemIndex].title;
            let i = voiceLabels.indexOf(label);
            let voice = voiceValues[i];
            let timeout = 0;

            let tur = that.blocks.logo.turtles.ithTurtle(0);

            if (
                tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(voice) === -1
            ) {
                tur.singer.instrumentNames.push(voice);
                if (voice === DEFAULTVOICE) {
                    that.blocks.logo.synth.createDefaultSynth(0);
                }

                that.blocks.logo.synth.loadSynth(0, voice);
                // give the synth time to load
                timeout = 500;
            }

            setTimeout(function() {
                that.blocks.logo.synth.setMasterVolume(DEFAULTVOLUME);
                Singer.setSynthVolume(that.blocks.logo, 0, voice, DEFAULTVOLUME);
                that.blocks.logo.synth.trigger(
                    0,
                    "G4",
                    1 / 4,
                    voice,
                    null,
                    null,
                    false
                );
                that.blocks.logo.synth.start();
            }, timeout);

            __selectionChanged();
        };

        // position widget
        let x = this.container.x;
        let y = this.container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById("wheelDiv").style.position = "absolute";
        docById("wheelDiv").style.height = "400px";
        docById("wheelDiv").style.width = "400px";
        docById("wheelDiv").style.left =
            Math.min(
                this.blocks.turtles._canvas.width - 400,
                Math.max(
                    0,
                    Math.round(
                        (x + this.blocks.stage.x) *
                        this.blocks.getStageScale() +
                        canvasLeft
                    ) - 200
                )
            ) + "px";
        docById("wheelDiv").style.top =
            Math.min(
                this.blocks.turtles._canvas.height - 450,
                Math.max(
                    0,
                    Math.round(
                        (y + this.blocks.stage.y) *
                        this.blocks.getStageScale() +
                        canvasTop
                    ) - 200
                )
            ) + "px";

        // navigate to a specific starting point
        let i = voiceValues.indexOf(voice);
        if (i === -1) {
            i = 0;
        }

        this._voiceWheel.navigateWheel(i);

        // Set up handlers for voice preview.
        for (let i = 0; i < voiceValues.length; i++) {
            this._voiceWheel.navItems[i].navigateFunction = __voicePreview;
        }

        // Hide the widget when the exit button is clicked.
        this._exitWheel.navItems[0].navigateFunction = function() {
            that._piemenuExitTime = new Date().getTime();
            docById("wheelDiv").style.display = "none";
        };
    };

    this._piemenuIntervals = function(selectedInterval) {
        // pie menu for interval selection

        if (this.blocks.stageClick) {
            return;
        }

        docById("wheelDiv").style.display = "";

        // Use advanced constructor for more wheelnav on same div
        let language = localStorage.languagePreference;
        if (language === "ja") {
            this._intervalNameWheel = new wheelnav(
                "wheelDiv",
                null,
                1500,
                1500
            );
        } else {
            this._intervalNameWheel = new wheelnav("wheelDiv", null, 800, 800);
        }

        this._intervalWheel = new wheelnav(
            "this._intervalWheel",
            this._intervalNameWheel.raphael
        );
        // exit button
        this._exitWheel = new wheelnav(
            "_exitWheel",
            this._intervalNameWheel.raphael
        );

        wheelnav.cssMode = true;

        this._intervalNameWheel.keynavigateEnabled = false;

        //Customize slicePaths for proper size
        this._intervalNameWheel.colors = platformColor.intervalNameWheelcolors;
        this._intervalNameWheel.slicePathFunction = slicePath().DonutSlice;
        this._intervalNameWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._intervalNameWheel.slicePathCustom.minRadiusPercent = 0.2;
        this._intervalNameWheel.slicePathCustom.maxRadiusPercent = 0.8;
        this._intervalNameWheel.sliceSelectedPathCustom = this._intervalNameWheel.slicePathCustom;
        this._intervalNameWheel.sliceInitPathCustom = this._intervalNameWheel.slicePathCustom;
        this._intervalNameWheel.titleRotateAngle = 0;
        this._intervalNameWheel.clickModeRotate = false;
        // this._intervalNameWheel.clickModeRotate = false;
        let labels = [];
        for (var i = 0; i < INTERVALS.length; i++) {
            labels.push(_(INTERVALS[i][1]));
        }

        this._intervalNameWheel.animatetime = 0; // 300;
        this._intervalNameWheel.createWheel(labels);

        this._intervalWheel.colors = platformColor.intervalWheelcolors;
        this._intervalWheel.slicePathFunction = slicePath().DonutSlice;
        this._intervalWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._intervalWheel.slicePathCustom.minRadiusPercent = 0.8;
        this._intervalWheel.slicePathCustom.maxRadiusPercent = 1;
        this._intervalWheel.sliceSelectedPathCustom = this._intervalWheel.slicePathCustom;
        this._intervalWheel.sliceInitPathCustom = this._intervalWheel.slicePathCustom;

        //Disable rotation, set navAngle and create the menus
        this._intervalWheel.clickModeRotate = false;
        // Align each set of numbers with its corresponding interval
        this._intervalWheel.navAngle =
            -(180 / labels.length) + 180 / (8 * labels.length);
        this._intervalWheel.animatetime = 0; // 300;

        let numbers = [];
        for (let i = 0; i < INTERVALS.length; i++) {
            for (let j = 1; j < 9; j++) {
                numbers.push(j.toString());
            }
        }
        this._intervalWheel.createWheel(numbers);

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["×", " "]);

        let that = this;

        // position widget
        let x = this.container.x;
        let y = this.container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById("wheelDiv").style.position = "absolute";
        docById("wheelDiv").style.height = "400px";
        docById("wheelDiv").style.width = "400px";
        docById("wheelDiv").style.left =
            Math.min(
                this.blocks.turtles._canvas.width - 400,
                Math.max(
                    0,
                    Math.round(
                        (x + this.blocks.stage.x) *
                        this.blocks.getStageScale() +
                        canvasLeft
                    ) - 200
                )
            ) + "px";
        docById("wheelDiv").style.top =
            Math.min(
                this.blocks.turtles._canvas.height - 450,
                Math.max(
                    0,
                    Math.round(
                        (y + this.blocks.stage.y) *
                        this.blocks.getStageScale() +
                        canvasTop
                    ) - 200
                )
            ) + "px";

        // Add function to each main menu for show/hide sub menus
        // FIXME: Add all tabs to each interval
        let __setupAction = function(i, activeTabs) {
            that._intervalNameWheel.navItems[i].navigateFunction = function() {
                for (let l = 0; l < labels.length; l++) {
                    for (let j = 0; j < 8; j++) {
                        if (l !== i) {
                            that._intervalWheel.navItems[
                            l * 8 + j
                                ].navItem.hide();
                        } else if (activeTabs.indexOf(j + 1) === -1) {
                            that._intervalWheel.navItems[
                            l * 8 + j
                                ].navItem.hide();
                        } else {
                            that._intervalWheel.navItems[
                            l * 8 + j
                                ].navItem.show();
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
        let obj = selectedInterval.split(" ");
        for (var i = 0; i < INTERVALS.length; i++) {
            if (obj[0] === INTERVALS[i][1]) {
                break;
            }
        }

        if (i === INTERVALS.length) {
            i = 0;
        }

        this._intervalNameWheel.navigateWheel(i);

        let j = Number(obj[1]);
        if (INTERVALS[i][2].indexOf(j) !== -1) {
            this._intervalWheel.navigateWheel(j - 1);
        } else {
            this._intervalWheel.navigateWheel(INTERVALS[i][2][0] - 1);
        }

        let __exitMenu = function() {
            that._piemenuExitTime = new Date().getTime();
            docById("wheelDiv").style.display = "none";
        };

        let __selectionChanged = function() {
            let label =
                that._intervalNameWheel.navItems[
                    that._intervalNameWheel.selectedNavItemIndex
                ].title;
            let number =
                that._intervalWheel.navItems[that._intervalWheel.selectedNavItemIndex].title;

            that.value = INTERVALS[that._intervalNameWheel.selectedNavItemIndex][1] + " " + number;
            if (label === "perfect 1") {
                that.text.text = _("unison");
            } else {
                that.text.text = label + " " + number;
            }

            // Make sure text is on top.
            that.container.setChildIndex(that.text, that.container.children.length - 1);
            that.updateCache();

            let obj = getNote("C", 4, INTERVALVALUES[that.value][0], "C major", false, null, null);
            obj[0] = obj[0].replace(SHARP, "#").replace(FLAT, "b");

            let tur = that.blocks.logo.turtles.ithTurtle(0);

            if (
                tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1
            ) {
                tur.singer.instrumentNames.push(DEFAULTVOICE);
                that.blocks.logo.synth.createDefaultSynth(0);
                that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
            }

            that.blocks.logo.synth.setMasterVolume(DEFAULTVOLUME);
            Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, DEFAULTVOLUME);

            if (!that._triggerLock) {
                that._triggerLock = true;

                that.blocks.logo.synth.trigger(
                    0,
                    ["C4", obj[0] + obj[1]],
                    1 / 8,
                    DEFAULTVOICE,
                    null,
                    null
                );
            }

            setTimeout(function() {
                that._triggerLock = false;
            }, 1 / 8);
        };

        // Set up handlers for preview.
        for (var i = 0; i < 8 * labels.length; i++) {
            this._intervalWheel.navItems[
                i
                ].navigateFunction = __selectionChanged;
        }

        this._exitWheel.navItems[0].navigateFunction = __exitMenu;
    };

    this._piemenuModes = function(selectedMode) {
        // pie menu for mode selection

        if (this.blocks.stageClick) {
            return;
        }

        // Look for a key block
        let key = "C";
        let modeGroup = "7"; // default mode group
        let octave = false;

        let c = this.connections[0];
        if (c !== null) {
            if (this.blocks.blockList[c].name === "setkey2") {
                let c1 = this.blocks.blockList[c].connections[1];
                if (c1 !== null) {
                    if (this.blocks.blockList[c1].name === "notename") {
                        key = this.blocks.blockList[c1].value;
                    }
                }
            }
        }

        docById("wheelDiv").style.display = "";

        //Use advanced constructor for more wheelnav on same div
        this._modeWheel = new wheelnav("wheelDiv", null, 1200, 1200);
        this._modeGroupWheel = new wheelnav(
            "_modeGroupWheel",
            this._modeWheel.raphael
        );
        this._modeNameWheel = null; // We build this wheel based on the group selection.
        // exit button
        this._exitWheel = new wheelnav("_exitWheel", this._modeWheel.raphael);

        wheelnav.cssMode = true;

        this._modeWheel.colors = platformColor.modeWheelcolors;
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
        this._modeWheel.animatetime = 0; // 300;
        this._modeWheel.createWheel([
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11"
        ]);

        this._modeGroupWheel.colors = platformColor.modeGroupWheelcolors;
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
        this._modeGroupWheel.animatetime = 0; // 300;

        let xlabels = [];
        for (modegroup in MODE_PIE_MENUS) {
            xlabels.push(modegroup);
        }

        this._modeGroupWheel.createWheel(xlabels);

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.15;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["×", "▶"]); // imgsrc:header-icons/play-button.svg']);

        let that = this;

        let __selectionChanged = function() {
            let title =
                that._modeNameWheel.navItems[
                    that._modeNameWheel.selectedNavItemIndex
                    ].title;
            if (title === " ") {
                that._modeNameWheel.navigateWheel(
                    (that._modeNameWheel.selectedNavItemIndex + 1) %
                    that._modeNameWheel.navItems.length
                );
            } else {
                that.text.text =
                    that._modeNameWheel.navItems[
                        that._modeNameWheel.selectedNavItemIndex
                        ].title;

                if (that.text.text === _("major") + " / " + _("ionian")) {
                    that.value = "major";
                } else if (
                    that.text.text ===
                    _("minor") + " / " + _("aeolian")
                ) {
                    that.value = "aeolian";
                } else {
                    for (let i = 0; i < MODE_PIE_MENUS[modeGroup].length; i++) {
                        let modename = MODE_PIE_MENUS[modeGroup][i];

                        if (_(modename) === that.text.text) {
                            that.value = modename;
                            break;
                        }
                    }
                }

                // Make sure text is on top.
                that.container.setChildIndex(that.text, that.container.children.length - 1);
                that.updateCache();
            }
        };

        // Add function to each main menu for show/hide sub menus
        let __setupAction = function(i, activeTabs) {
            that._modeNameWheel.navItems[i].navigateFunction = function() {
                for (let j = 0; j < 12; j++) {
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
        let __buildModeNameWheel = function(grp) {
            let newWheel = false;
            if (that._modeNameWheel === null) {
                that._modeNameWheel = new wheelnav(
                    "_modeNameWheel",
                    that._modeWheel.raphael
                );
                newWheel = true;
            }

            that._modeNameWheel.keynavigateEnabled = false;

            // Customize slicePaths
            let colors = [];
            for (let i = 0; i < MODE_PIE_MENUS[grp].length; i++) {
                let modename = MODE_PIE_MENUS[grp][i];
                if (modename === " ") {
                    colors.push(platformColor.modePieMenusIfColorPush);
                } else {
                    colors.push(platformColor.modePieMenusElseColorPush);
                }
            }

            that._modeNameWheel.colors = colors;
            that._modeNameWheel.slicePathFunction = slicePath().DonutSlice;
            that._modeNameWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            that._modeNameWheel.slicePathCustom.minRadiusPercent = 0.3; //0.15;
            that._modeNameWheel.slicePathCustom.maxRadiusPercent = 0.85;
            that._modeNameWheel.sliceSelectedPathCustom =
                that._modeNameWheel.slicePathCustom;
            that._modeNameWheel.sliceInitPathCustom =
                that._modeNameWheel.slicePathCustom;
            that._modeNameWheel.titleRotateAngle = 0;
            // that._modeNameWheel.clickModeRotate = false;
            that._modeNameWheel.navAngle = -90;
            let labels = new Array();
            for (let i = 0; i < MODE_PIE_MENUS[grp].length; i++) {
                let modename = MODE_PIE_MENUS[grp][i];
                switch (modename) {
                    case "ionian":
                    case "major":
                        labels.push(_("major") + " / " + _("ionian"));
                        break;
                    case "aeolian":
                    case "minor":
                        labels.push(_("minor") + " / " + _("aeolian"));
                        break;
                    default:
                        if (modename === " ") {
                            labels.push(" ");
                        } else {
                            labels.push(_(modename));
                        }
                        break;
                }
            }

            that._modeNameWheel.animatetime = 0; // 300;
            if (newWheel) {
                that._modeNameWheel.createWheel(labels);
            } else {
                for (let i = 0; i < that._modeNameWheel.navItems.length; i++) {
                    // Maybe there is a method that does this.
                    that._modeNameWheel.navItems[i].title = labels[i];
                    that._modeNameWheel.navItems[i].basicNavTitleMax.title =
                        labels[i];
                    that._modeNameWheel.navItems[i].basicNavTitleMin.title =
                        labels[i];
                    that._modeNameWheel.navItems[i].hoverNavTitleMax.title =
                        labels[i];
                    that._modeNameWheel.navItems[i].hoverNavTitleMin.title =
                        labels[i];
                    that._modeNameWheel.navItems[i].selectedNavTitleMax.title =
                        labels[i];
                    that._modeNameWheel.navItems[i].selectedNavTitleMin.title =
                        labels[i];
                    that._modeNameWheel.navItems[i].initNavTitle.title =
                        labels[i];
                    that._modeNameWheel.navItems[i].fillAttr = colors[i];
                    that._modeNameWheel.navItems[i].sliceHoverAttr.fill =
                        colors[i];
                    that._modeNameWheel.navItems[i].slicePathAttr.fill =
                        colors[i];
                    that._modeNameWheel.navItems[i].sliceSelectedAttr.fill =
                        colors[i];
                }

                that._modeNameWheel.refreshWheel();
            }

            // Special case for Japanese
            let language = localStorage.languagePreference;
            if (language === "ja") {
                for (let i = 0; i < that._modeNameWheel.navItems.length; i++) {
                    that._modeNameWheel.navItems[i].titleAttr.font =
                        "30 30px sans-serif";
                    that._modeNameWheel.navItems[i].titleSelectedAttr.font =
                        "30 30px sans-serif";
                }
            }

            // Set up tabs for each mode.
            let i = 0;
            for (let j = 0; j < MODE_PIE_MENUS[grp].length; j++) {
                let modename = MODE_PIE_MENUS[grp][j];
                let activeTabs = [0];
                if (modename !== " ") {
                    let mode = MUSICALMODES[modename];
                    for (let k = 0; k < mode.length; k++) {
                        activeTabs.push(last(activeTabs) + mode[k]);
                    }
                }

                __setupAction(i, activeTabs);
                i += 1;
            }

            // Look for the selected mode.
            for (i = 0; i < MODE_PIE_MENUS[grp].length; i++) {
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

        let __exitMenu = function() {
            that._piemenuExitTime = new Date().getTime();
            docById("wheelDiv").style.display = "none";
            if (that._modeNameWheel !== null) {
                that._modeNameWheel.removeWheel();
            }
        };

        let __playNote = function() {
            let o = 0;
            if (octave) {
                o = 12;
            }

            let i = that._modeWheel.selectedNavItemIndex;
            // The mode doesn't matter here, since we are using semi-tones
            let obj = getNote(key, 4, i + o, key + " chromatic", false, null, null);
            obj[0] = obj[0].replace(SHARP, "#").replace(FLAT, "b");

            let tur = that.blocks.logo.turtles.ithTurtle(0);

            if (
                tur.singer.instrumentNames.length === 0 ||
                tur.singer.instrumentNames.indexOf(DEFAULTVOICE) === -1
            ) {
                tur.singer.instrumentNames.push(DEFAULTVOICE);
                that.blocks.logo.synth.createDefaultSynth(0);
                that.blocks.logo.synth.loadSynth(0, DEFAULTVOICE);
            }

            that.blocks.logo.synth.setMasterVolume(DEFAULTVOLUME);
            Singer.setSynthVolume(that.blocks.logo, 0, DEFAULTVOICE, DEFAULTVOLUME);
            that.blocks.logo.synth.trigger(
                0,
                [obj[0] + obj[1]],
                1 / 12,
                DEFAULTVOICE,
                null,
                null
            );
        };

        let __playScale = function(activeTabs, idx) {
            // loop through selecting modeWheel slices with a delay.
            if (idx < activeTabs.length) {
                if (activeTabs[idx] < 12) {
                    octave = false;
                    that._modeWheel.navigateWheel(activeTabs[idx]);
                } else {
                    octave = true;
                    that._modeWheel.navigateWheel(0);
                }

                setTimeout(function() {
                    __playScale(activeTabs, idx + 1);
                }, 1000 / 10); // slight delay between notes
            }
        };

        /*
         * prepare scale
         * @return{void}
         * @private
         */
        let __prepScale = function() {
            let activeTabs = [0];
            let mode = MUSICALMODES[that.value];
            for (let k = 0; k < mode.length - 1; k++) {
                activeTabs.push(last(activeTabs) + mode[k]);
            }

            activeTabs.push(12);
            activeTabs.push(12);

            for (let k = mode.length - 1; k >= 0; k--) {
                activeTabs.push(last(activeTabs) - mode[k]);
            }

            __playScale(activeTabs, 0);
        };

        // position widget
        let x = this.container.x;
        let y = this.container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.blockScale;
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.blockScale;

        docById("wheelDiv").style.position = "absolute";
        docById("wheelDiv").style.height = "600px";
        docById("wheelDiv").style.width = "600px";

        // This widget is large. Be sure it fits on the screen.
        docById("wheelDiv").style.left =
            Math.min(
                this.blocks.turtles._canvas.width - 600,
                Math.max(
                    0,
                    Math.round(
                        (x + this.blocks.stage.x) *
                        this.blocks.getStageScale() +
                        canvasLeft
                    ) - 200
                )
            ) + "px";
        docById("wheelDiv").style.top =
            Math.min(
                this.blocks.turtles._canvas.height - 650,
                Math.max(
                    0,
                    Math.round(
                        (y + this.blocks.stage.y) *
                        this.blocks.getStageScale() +
                        canvasTop
                    ) - 200
                )
            ) + "px";

        for (let i = 0; i < 12; i++) {
            that._modeWheel.navItems[i].navigateFunction = __playNote;
        }

        // navigate to a specific starting point
        for (modeGroup in MODE_PIE_MENUS) {
            for (var j = 0; j < MODE_PIE_MENUS[modeGroup].length; j++) {
                let modename = MODE_PIE_MENUS[modeGroup][j];
                if (modename === selectedMode) {
                    break;
                }
            }

            if (j < MODE_PIE_MENUS[modeGroup].length) {
                break;
            }
        }

        if (selectedMode === "major") {
            modeGroup = "7";
        }

        let __buildModeWheel = function() {
            let i = that._modeGroupWheel.selectedNavItemIndex;
            modeGroup = that._modeGroupWheel.navItems[i].title;
            __buildModeNameWheel(modeGroup);
        };

        for (let i = 0; i < this._modeGroupWheel.navItems.length; i++) {
            this._modeGroupWheel.navItems[
                i
                ].navigateFunction = __buildModeWheel;
        }

        for (let i = 0; i < this._modeGroupWheel.navItems.length; i++) {
            if (this._modeGroupWheel.navItems[i].title === modeGroup) {
                this._modeGroupWheel.navigateWheel(i);
                break;
            }
        }

        this._exitWheel.navItems[0].navigateFunction = __exitMenu;
        this._exitWheel.navItems[1].navigateFunction = __prepScale;
    };

    this._checkWidgets = function(closeInput) {
        // Detect if label is changed, then reinit widget windows
        // if they are open.
        let thisBlock = this.blocks.blockList.indexOf(this);
        let topBlock = this.blocks.findTopBlock(thisBlock);
        let widgetTitle = document.getElementsByClassName("wftTitle");
        let lockInit = false;
        if (closeInput === false) {
            for (let i = 0; i < widgetTitle.length; i++) {
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
                        case "mode":
                        case "timbre":
                            lockInit = true;
                            if (this.blocks.blockList[topBlock].protoblock.staticLabels[0] == widgetTitle[i].innerHTML)
                                this.blocks.reInitWidget(topBlock, 1500);
                            break;
                    }
                }
            }
        }
    };

    this._labelChanged = function(closeInput, notPieMenu) {
        // Update the block values as they change in the DOM label.

        // Instead, we do this when we hide the DOM element.
        // this._checkWidgets(closeInput);

        if (this === null || this.label === null) {
            this._labelLock = false;
            return;
        }

        this._labelLock = true;

        if (closeInput) {
            this.label.style.display = "none";
            if (this.labelattr != null) {
                this.labelattr.style.display = "none";
            }
            docById("wheelDiv").style.display = "none";
        }

        // The pie menu may be visible too, so hide it.
        if (notPieMenu === undefined) {
            docById("wheelDiv").style.display = "none";
        }

        let oldValue = this.value;
        let newValue = this.label.value;

        if (this.labelattr != null) {
            let attrValue = this.labelattr.value;
            switch (attrValue) {
                case "𝄪":
                case "♯":
                case "𝄫":
                case "♭":
                    newValue = newValue + attrValue;
                    break;
                default:
                    break;
            }
        }

        let c = this.connections[0];

        if (oldValue === newValue) {
            // Nothing to do in this case.
            this._labelLock = false;
            if (
                this.name !== "text" ||
                c === null ||
                this.blocks.blockList[c].name !== "storein"
            ) {
                return;
            }
        }

        c = this.connections[0];
        if (this.name === "text" && c != null) {
            let cblock = this.blocks.blockList[c];
            let uniqueValue;
            switch (cblock.name) {
                case "action":
                    let that = this;

                    that.blocks.palettes.removeActionPrototype(oldValue);

                    // Ensure new name is unique.
                    uniqueValue = this.blocks.findUniqueActionName(
                        newValue
                    );
                    if (uniqueValue !== newValue) {
                        newValue = uniqueValue;
                        this.value = newValue;
                        let label = this.value.toString();
                        if (getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH) {
                            label = label.substr(0, STRINGLEN) + "...";
                        }
                        this.text.text = label;
                        this.label.value = newValue;
                        this.updateCache();
                    }
                    break;
                case "pitch":
                    // In case of custom temperament
                    uniqueValue = this.blocks.findUniqueCustomName(
                        newValue
                    );
                    newValue = uniqueValue;
                    for (let pitchNumber in TEMPERAMENT["custom"]) {
                        if (pitchNumber !== "pitchNumber") {
                            if (
                                oldValue ==
                                TEMPERAMENT["custom"][pitchNumber][1]
                            ) {
                                TEMPERAMENT["custom"][
                                    pitchNumber
                                    ][1] = newValue;
                            }
                        }
                    }
                    this.value = newValue;
                    var label = this.value.toString();
                    if (getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH) {
                        label = label.substr(0, STRINGLEN) + "...";
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
        if (this.name === "number") {
            let cblk1 = this.connections[0];
            let cblk2;

            if (cblk1 !== null) {
                cblk2 = this.blocks.blockList[cblk1].connections[0];
            } else {
                cblk2 = null;
            }

            if (this.value === "-") {
                this.value = -1;
            } else if ((cblk2 !== null) && (newValue < 0) && (this.blocks.blockList[cblk1].name === 'newnote' || this.blocks.blockList[cblk2].name == 'newnote')) {
                this.label.value = 0;
                this.value = 0;
            }
            else {
                this.value = Number(newValue);
            }

            if (isNaN(this.value)) {
                let thisBlock = this.blocks.blockList.indexOf(this);
                this.blocks.errorMsg(
                    newValue + ": " + _("Not a number"),
                    thisBlock
                );
                this.blocks.refreshCanvas();
                this.value = oldValue;
            }
        } else {
            this.value = newValue;
        }

        if (this.name === "solfege") {
            let obj = splitSolfege(this.value);
            var label = i18nSolfege(obj[0]);
            let attr = obj[1];

            if (attr !== "♮") {
                label += attr;
            }
        } else if (this.name === "eastindiansolfege") {
            let obj = splitSolfege(this.value);
            var label = WESTERN2EISOLFEGENAMES[obj[0]];
            let attr = obj[1];

            if (attr !== "♮") {
                label += attr;
            }
        } else if (this.name === "modename") {
            var label = this.value + " " + getModeNumbers(this.value);
        } else {
            var label = this.value.toString();
        }

        if (
            WIDENAMES.indexOf(this.name) === -1 &&
            getTextWidth(label, "bold 20pt Sans") > TEXTWIDTH
        ) {
            let slen = label.length - 5;
            let nlabel = "" + label.substr(0, slen) + "...";
            while (getTextWidth(nlabel, "bold 20pt Sans") > TEXTWIDTH) {
                slen -= 1;
                nlabel = "" + label.substr(0, slen) + "...";
                let foo = getTextWidth(nlabel, "bold 20pt Sans");
                if (slen <= STRINGLEN) {
                    break;
                }
            }

            label = nlabel;
        }

        this.text.text = label;

        if (closeInput) {
            // and hide the DOM textview...
            this.label.style.display = "none";
            docById("wheelDiv").style.display = "none";
        }

        // Make sure text is on top.
        this.container.setChildIndex(this.text, this.container.children.length - 1);
        this.updateCache();

        if (this.name === "text" && c != null) {
            let cblock = this.blocks.blockList[c];
            switch (cblock.name) {
                case "action":
                    // If the label was the name of an action, update the
                    // associated run this.blocks and the palette buttons
                    // Rename both do <- name and nameddo blocks.
                    this.blocks.renameDos(oldValue, newValue);

                    if (oldValue === _("action")) {
                        this.blocks.newNameddoBlock(
                            newValue,
                            this.blocks.actionHasReturn(c),
                            this.blocks.actionHasArgs(c)
                        );
                        this.blocks.setActionProtoVisiblity(false);
                    }

                    this.blocks.newNameddoBlock(
                        newValue,
                        this.blocks.actionHasReturn(c),
                        this.blocks.actionHasArgs(c)
                    );
                    let blockPalette = this.blocks.palettes.dict["action"];
                    for (
                        var blk = 0;
                        blk < blockPalette.protoList.length;
                        blk++
                    ) {
                        let block = blockPalette.protoList[blk];
                        if (oldValue === _("action")) {
                            if (
                                block.name === "nameddo" &&
                                block.defaults.length === 0
                            ) {
                                block.hidden = true;
                            }
                        } else {
                            if (
                                block.name === "nameddo" &&
                                block.defaults[0] === oldValue
                            ) {
                                blockPalette.remove(block, oldValue);
                            }
                        }
                    }

                    if (oldValue === _("action")) {
                        this.blocks.newNameddoBlock(
                            newValue,
                            this.blocks.actionHasReturn(c),
                            this.blocks.actionHasArgs(c)
                        );
                        this.blocks.setActionProtoVisiblity(false);
                    }
                    this.blocks.renameNameddos(oldValue, newValue);
                    this.blocks.palettes.hide();
                    this.blocks.palettes.updatePalettes("action");
                    this.blocks.palettes.show();
                    break;
                case "storein":
                    // Check to see which connection we are using in
                    // cblock.  We only do something if blk is attached to
                    // the name connection (1).
                    blk = this.blocks.blockList.indexOf(this);
                    if (cblock.connections[1] === blk && closeInput) {
                        // If the label was the name of a storein, update the
                        // associated box this.blocks and the palette buttons.
                        if (this.value !== "box") {
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
                        this.blocks.palettes.updatePalettes("boxes");
                        this.blocks.palettes.show();
                    }
                    break;
                case "setdrum":
                case "playdrum":
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        if (newValue.slice(0, 4) === "http") {
                            this.blocks.logo.synth.loadSynth(0, newValue);
                        }
                    }
                    break;
                case "temperament1":
                    let temptemperament = TEMPERAMENT[oldValue];
                    delete TEMPERAMENT[oldValue];
                    TEMPERAMENT[newValue] = temptemperament;
                    updateTEMPERAMENTS();
                    break;
                default:
                    break;
            }
        }

        // We are done changing the label, so unlock.
        this._labelLock = false;

        if (_THIS_IS_MUSIC_BLOCKS_) {
            // Load the synth for the selected drum.
            if (this.name === "drumname") {
                this.blocks.logo.synth.loadSynth(
                    0,
                    getDrumSynthName(this.value)
                );
            } else if (this.name === "effectsname") {
                this.blocks.logo.synth.loadSynth(
                    0,
                    getDrumSynthName(this.value)
                );
            } else if (this.name === "voicename") {
                this.blocks.logo.synth.loadSynth(
                    0,
                    getVoiceSynthName(this.value)
                );
            } else if (this.name === "noisename") {
                this.blocks.logo.synth.loadSynth(
                    0,
                    getNoiseSynthName(this.value)
                );
            }
        }
    };

    /*
     * Sets up context menu for each block
     */
    this.piemenuBlockContext = function() {
        if (this.blocks.activeBlock === null) {
            return;
        }

        let pasteDx = 0;
        let pasteDy = 0;

        let that = this;
        let thisBlock = this.blocks.blockList.indexOf(this);

        // Position the widget centered over the active block.
        docById("contextWheelDiv").style.position = "absolute";

        let x = this.blocks.blockList[thisBlock].container.x;
        let y = this.blocks.blockList[thisBlock].container.y;

        let canvasLeft =
            this.blocks.canvas.offsetLeft + 28 * this.blocks.getStageScale();
        let canvasTop =
            this.blocks.canvas.offsetTop + 6 * this.blocks.getStageScale();

        docById("contextWheelDiv").style.left =
            Math.round(
                (x + this.blocks.stage.x) * this.blocks.getStageScale() +
                canvasLeft
            ) -
            150 +
            "px";
        docById("contextWheelDiv").style.top =
            Math.round(
                (y + this.blocks.stage.y) * this.blocks.getStageScale() +
                canvasTop
            ) -
            150 +
            "px";

        docById("contextWheelDiv").style.display = "";

        labels = [
            "imgsrc:header-icons/copy-button.svg",
            "imgsrc:header-icons/extract-button.svg",
            "imgsrc:header-icons/empty-trash-button.svg",
            "imgsrc:header-icons/cancel-button.svg"
        ];

        let topBlock = this.blocks.findTopBlock(thisBlock);
        if (this.name === 'action') {
            labels.push('imgsrc:header-icons/save-blocks-button.svg');
        }
        let message =
            this.blocks.blockList[this.blocks.activeBlock].protoblock.helpString;
        let helpButton;
        if (message) {
            labels.push("imgsrc:header-icons/help-button.svg");
            helpButton = labels.length - 1;
        } else {
            helpButton = null;
        }

        let wheel = new wheelnav("contextWheelDiv", null, 250, 250);
        wheel.colors = platformColor.wheelcolors;
        wheel.slicePathFunction = slicePath().DonutSlice;
        wheel.slicePathCustom = slicePath().DonutSliceCustomization();
        wheel.slicePathCustom.minRadiusPercent = 0.2;
        wheel.slicePathCustom.maxRadiusPercent = 0.6;
        wheel.sliceSelectedPathCustom = wheel.slicePathCustom;
        wheel.sliceInitPathCustom = wheel.slicePathCustom;
        wheel.clickModeRotate = false;
        wheel.initWheel(labels);
        wheel.createWheel();

        wheel.navItems[0].setTooltip(_("Duplicate"));
        wheel.navItems[1].setTooltip(_("Extract"));
        wheel.navItems[2].setTooltip(_("Move to trash"));
        wheel.navItems[3].setTooltip(_("Close"));
        if (this.blocks.blockList[topBlock].name === "action") {
            wheel.navItems[4].setTooltip(_("Save stack"));
        }

        if (helpButton !== null) {
            wheel.navItems[helpButton].setTooltip(_("Help"));
        }

        wheel.navItems[0].selected = false;

        wheel.navItems[0].navigateFunction = function() {
            that.blocks.activeBlock = thisBlock;
            that.blocks.prepareStackForCopy();
            that.blocks.pasteDx = pasteDx;
            that.blocks.pasteDy = pasteDy;
            that.blocks.pasteStack();
            pasteDx += 21;
            pasteDy += 21;
            // docById('contextWheelDiv').style.display = 'none';
        };

        wheel.navItems[1].navigateFunction = function() {
            that.blocks.activeBlock = thisBlock;
            that.blocks.extract();
            docById("contextWheelDiv").style.display = "none";
        };

        wheel.navItems[2].navigateFunction = function() {
            that.blocks.activeBlock = thisBlock;
            that.blocks.extract();
            that.blocks.sendStackToTrash(that.blocks.blockList[thisBlock]);
            docById("contextWheelDiv").style.display = "none";
        };

        wheel.navItems[3].navigateFunction = function() {
            docById("contextWheelDiv").style.display = "none";
        };

        if (this.name === "action") {
            wheel.navItems[4].navigateFunction = function() {
                that.blocks.activeBlock = thisBlock;
                that.blocks.prepareStackForCopy();
                that.blocks.saveStack();
            };
        }

        if (helpButton !== null) {
            wheel.navItems[helpButton].navigateFunction = function() {
                that.blocks.activeBlock = thisBlock;
                let helpWidget = new HelpWidget();
                helpWidget.init(blocks);
                docById("contextWheelDiv").style.display = "none";
            };
        }

        setTimeout(function() {
            that.blocks.stageClick = false;
        }, 500);
    };
}

/*
 * set elements to a array
 * if element is string,then set element's id to element
 * @public
 * @return{void}
 */
function $() {
    let elements = new Array();

    for (let i = 0; i < arguments.length; i++) {
        let element = arguments[i];
        if (typeof element === "string") {
            element = docById(element);
        }

        if (arguments.length === 1) {
            return element;
        }

        elements.push(element);
    }

    return elements;
}

window.hasMouse = false;
// Mousemove is not emulated for touch
document.addEventListener("mousemove", function(e) {
    window.hasMouse = true;
});

function _blockMakeBitmap(data, callback, args) {
    // Async creation of bitmap from SVG data.
    // Works with Chrome, Safari, Firefox (untested on IE).
    let img = new Image();

    img.onload = function() {
        let bitmap = new createjs.Bitmap(img);
        callback(bitmap, args);
    };

    img.src =
        "data:image/svg+xml;base64," +
        window.btoa(unescape(encodeURIComponent(data)));
}
