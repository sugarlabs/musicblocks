﻿// Copyright (c) 2014-21 Walter Bender
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

/*
   global

   _, ACCIDENTALLABELS, ACCIDENTALNAMES, addTemperamentToDictionary,
   blockBlocks, COLLAPSEBUTTON, COLLAPSETEXTX, COLLAPSETEXTY,
   createjs, DEFAULTACCIDENTAL, DEFAULTDRUM, DEFAULTEFFECT,
   DEFAULTFILTERTYPE, DEFAULTINTERVAL, DEFAULTINVERT, DEFAULTMODE,
   DEFAULTNOISE, DEFAULTOSCILLATORTYPE, DEFAULTTEMPERAMENT,
   DEFAULTVOICE, DEGREES, delayExecution, deleteTemperamentFromList,
   DISABLEDFILLCOLOR, DISABLEDSTROKECOLOR, docById, DOUBLEFLAT,
   DOUBLESHARP, DRUMNAMES, EASTINDIANSOLFNOTES, EFFECTSNAMES,
   EXPANDBUTTON, FILTERTYPES, FLAT, getDrumName, getDrumSynthName,
   getModeNumbers, getNoiseName, getNoiseSynthName, getTemperament,
   getTemperamentKeys, getTemperamentsList, getTextWidth,
   getVoiceSynthName, hideDOMLabel, HIGHLIGHTSTROKECOLORS,
   i18nSolfege, INVERTMODES, isCustomTemperament, last, MEDIASAFEAREA,
   NATURAL, NOISENAMES, NSYMBOLS, NUMBERBLOCKDEFAULT, OSCTYPES,
   PALETTEFILLCOLORS, PALETTEHIGHLIGHTCOLORS, PALETTESTROKECOLORS,
   piemenuAccidentals, piemenuBasic, piemenuBlockContext,
   piemenuBoolean, piemenuColor, piemenuCustomNotes, piemenuIntervals,
   piemenuModes, piemenuNoteValue, piemenuNumber, piemenuPitches,
   piemenuVoices, piemenuChords, platformColor, ProtoBlock, RSYMBOLS,
   safeSVG, SCALENOTES, SHARP, SOLFATTRS, SOLFNOTES, splitScaleDegree,
   splitSolfege, STANDARDBLOCKHEIGHT, TEXTX, TEXTY,
   topBlock, updateTemperaments, VALUETEXTX, DEFAULTCHORD,
   VOICENAMES, WESTERN2EISOLFEGENAMES, _THIS_IS_TURTLE_BLOCKS_
 */

/*
   Global locations
   - js/utils/utils.js
        _, getTextWidth, docById, safeSVG, delayExecution, hideDOMLabel
   - js/utils/musicutils.js
        getNoiseSynthName, getVoiceSynthName, getDrumSynthName, updateTemperaments,
        getModeNumbers, WESTERN2EISOLFEGENAMES, splitSolfege, i18nSolfege, DEFAULTTEMPERAMENT,
        DEFAULTNOISE, OSCTYPES, DEFAULTOSCILLATORTYPE, FILTERTYPES, DEFAULTFILTERTYPE,
        DEFAULTVOICE, DEFAULTEFFECT, DEFAULTDRUM, INVERTMODES, DEFAULTINVERT, DEFAULTINTERVAL,
        getNoiseName, getDrumName, splitScaleDegree, DEFAULTACCIDENTAL, DEFAULTMODE, SOLFNOTES
        ACCIDENTALLABELS, ACCIDENTALNAMES, SOLFATTRS, EASTINDIANSOLFNOTES, PreDefinedTemperaments,
        DEGREES, NATURAL, DOUBLEFLAT, DOUBLESHARP, FLAT, SHARP, RSYMBOLS, NSYMBOLS, SCALENOTES,
        getTemperamentsList, getTemperament, getTemperamentKeys, addTemperamentToDictionary,
        deleteTemperamentFromList
   - js/utils/synthutils.js
        NOISENAMES, VOICENAMES, DRUMNAMES, EFFECTSNAMES
   - js/turtledefs.js
        NUMBERBLOCKDEFAULT
   - js/artwork.js
        EXPANDBUTTON, COLLAPSEBUTTON, PALETTESTROKECOLORS, PALETTEFILLCOLORS, COLLAPSETEXTY,
        STANDARDBLOCKHEIGHT, COLLAPSETEXTX, MEDIASAFEAREA, VALUETEXTX, TEXTY, TEXTX,
        HIGHLIGHTSTROKECOLORS, PALETTEHIGHLIGHTCOLORS
   - js/protoblocks.js
        ProtoBlock 
   - js/js-export/export.js
   - js/logo.js
   - js/piemenus.js
        piemenuNumber, piemenuColor, piemenuNoteValue, piemenuBasic, piemenuBoolean, piemenuVoices,
        piemenuIntervals, piemenuAccidentals, piemenuModes, piemenuPitches, piemenuCustomNotes,
        piemenuBlockContext
   - js/utils/platformstyle.js
        platformColor
 */

/* exported Block, $ */

// Length of a long touch
const TEXTWIDTH = 240; // 90
const STRINGLEN = 9;
const LONGPRESSTIME = 1500;
const INLINECOLLAPSIBLES = ["newnote", "interval", "osctime", "definemode"];
const COLLAPSIBLES = [
    "drum",
    "start",
    "action",
    "temperament1",
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
    "chordname",
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
    "outputtools",
    "wrapmode"
];
const WIDENAMES = [
    "intervalname",
    "accidentalname",
    "drumname",
    "effectsname",
    "voicename",
    "modename",
    "chordname",
    "temperamentname",
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
    "chordname",
    "temperamentname",
    "noisename",
    "customNote",
    "grid",
    "outputtools",
    "wrapmode"
];

const _blockMakeBitmap = (data, callback, args) => {
    // Async creation of bitmap from SVG data.
    // Works with Chrome, Safari, Firefox (untested on IE).
    const img = new Image();

    img.onload = () => {
        const bitmap = new createjs.Bitmap(img);
        callback(bitmap, args);
    };

    img.src = "data:image/svg+xml;base64," + window.btoa(base64Encode(data));
};

// Define block instance objects and any methods that are intra-block.
class Block {
    constructor(protoblock, blocks, overrideName) {
        if (protoblock === null) {
            // console.debug("null protoblock sent to Block");
            return;
        }

        this.protoblock = protoblock;
        this.blocks = blocks;
        this.overrideName = overrideName;

        this.name = protoblock.name;
        this.activity = this.blocks.activity;

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
        this.customID = null; // Used by custom temperaments.
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
    }

    // Internal function for creating cache.
    // Includes workaround for a race condition.
    _createCache(callback, args) {
        const that = this;
        return new Promise((resolve, reject) => {
            let loopCount = 0;

            const checkBounds = async (counter) => {
                try {
                    if (counter !== undefined) {
                        loopCount = counter;
                    }
                    if (loopCount > 10) {  // race condition?
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
            };
            checkBounds();
        });
    }

    // Internal function for updating the cache.
    // Includes workaround for a race condition.
    updateCache() {
        const that = this;
        return new Promise((resolve, reject) => {
            let loopCount = 0;

            const updateBounds = async (counter) => {
                try {
                    if (counter !== undefined) {
                        loopCount = counter;
                    }

                    if (loopCount > 5) {
                        throw new Error("COULD NOT UPDATE CACHE");
                    }

                    if (that.bounds === null) {
                        updateBounds(loopCount + 1);
                        await that.pause(200);
                    } else {
                        that.container.updateCache();
                        that.activity.refreshCanvas();
                        resolve();
                    }
                } catch (e) {
                    reject(e);
                }
            };
            updateBounds();
        });
    }

    ignore() {
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

        if (this.disconnectedBitmap !== null && this.disconnectedHighlightBitmap !== null) {
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
    }

    offScreen(boundary) {
        return !this.trash && boundary.offScreen(this.container.x, this.container.y);
    }

    copySize() {
        this.size = this.protoblock.size;
    }

    getInfo() {
        return this.name + " block";
    }

    isCollapsible() {
        return COLLAPSIBLES.indexOf(this.name) !== -1;
    }

    isInlineCollapsible() {
        return INLINECOLLAPSIBLES.indexOf(this.name) !== -1;
    }

    /**
     * Show the highlight artwork.
     * @public
     * @returns {void}
     */
    highlight() {
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
    }

    /**
     * Remove highlight from block.
     * @public
     * @returns {void}
     */
    unhighlight() {
        if (this.trash) {
            return;
        }

        if (this.inCollapsed) {
            // In collapsed, so do nothing.
            return;
        }

        if (this.bitmap === null) {
            // console.debug("bitmap not ready");
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
    }

    /**
     * Resize and update number of slots in argClamp.
     * @public
     * @param slotList - how many slots to use
     * @returns {void}
     */
    updateArgSlots(slotList) {
        this.argClampSlots = slotList;
        this._newArtwork(0);
        this.regenerateArtwork(false);
    }

    /**
     * Resize an expandable block.
     * @public
     * @param clamp - which clamp to update (ifthenelse has 2 clamps)
     * @param plusMinus - how many slots to add or subtract
     * @returns {void}
     */
    updateSlots(clamp, plusMinus) {
        this.clampCount[clamp] += plusMinus;
        this._newArtwork(plusMinus);
        this.regenerateArtwork(false);
    }

    /**
     * If the block scale changes, we need to regenerate the artwork and recalculate the hitarea.
     * @public
     * @param scale - new block scale
     * @returns {void}
     */
    resize(scale) {
        /**
         * After the new artwork is created, this function is used to add decorations.
         * @returns {void}
         * @public
         */
        this.postProcess = () => {
            if (this.imageBitmap !== null) {
                this._positionMedia(
                    this.imageBitmap,
                    this.imageBitmap.image.width,
                    this.imageBitmap.image.height,
                    scale
                );
                const zIndex = this.container.children.length - 1;
                this.container.setChildIndex(this.imageBitmap, zIndex);
            }

            if (this.name === "start" || this.name === "drum") {
                // Rescale the decoration on the start blocks.
                for (let t = 0; t < this.activity.turtles.turtleList.length; t++) {
                    if (this.activity.turtles.turtleList[t].startBlock === this) {
                        this.activity.turtles.turtleList[t].resizeDecoration(
                            scale,
                            this.bitmap.image.width
                        );
                        this._ensureDecorationOnTop();
                        break;
                    }
                }
            } else if (this.isCollapsible()) {
                this._ensureDecorationOnTop();
            }

            this.updateCache();
            this._calculateBlockHitArea();

            // If it is in the trash, make sure it remains hidden.
            if (this.trash) this.hide();
        };

        this.postProcessArg = this;

        this.protoblock.scale = scale;
        this._newArtwork(0);
        this.regenerateArtwork(true, []);

        if (this.text !== null) {
            this._positionText(scale);
        }

        if (this.container !== null) {
            /**
             * After new buttons are creates, they are cached and a new hit are is calculated.
             * @private
             * @param that - = this = container
             * @returns {void}
             */
            const _postProcess = (that) => {
                that.collapseButtonBitmap.scaleX =
                    that.collapseButtonBitmap.scaleY =
                    that.collapseButtonBitmap.scale =
                    scale / 3;
                that.expandButtonBitmap.scaleX =
                    that.expandButtonBitmap.scaleY =
                    that.expandButtonBitmap.scale =
                    scale / 3;
                that.updateCache();
                that._calculateBlockHitArea();
            };

            if (this.isCollapsible()) {
                this._generateCollapseArtwork(_postProcess);
                const fontSize = 10 * scale;
                this.collapseText.font = fontSize + "px Sans";
                this._positionCollapseLabel(scale);
            }
        }
    }

    /**
     * Create new artwork for a block.
     * @private
     * @param plusMinus - specifies how much a clamp block expands or contracts
     * @returns {void}
     */
    _newArtwork(plusMinus) {
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
            obj = this.protoblock.generator(this.clampCount[0], this.clampCount[1]);
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
                    this.docks.push([obj[1][0][0], obj[1][0][1], this.protoblock.dockTypes[0]]);
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
                this.docks.push([obj[1][1][0], obj[1][1][1], this.protoblock.dockTypes[1]]);
                for (let i = 2; i < obj[1].length - 1; i++) {
                    this.docks.push([obj[1][i][0], obj[1][i][1], "anyin"]);
                }
                this.docks.push([obj[1][3][0], obj[1][3][1], "in"]);
                break;
            case "makeblock":
            case "calcArg":
                this.docks.push([obj[1][1][0], obj[1][1][1], this.protoblock.dockTypes[1]]);
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
    }

    /**
     * Load any artwork associated with the block and create any extra parts. Image components are
     * loaded asynchronously so most the work happens in callbacks.
     * We also need a text label for some blocks. For number and text blocks, this is the primary
     * label; for parameter blocks, this is used to display the current block value.
     * @public
     * @returns {void}
     */
    imageLoad() {
        const fontSize = 10 * this.protoblock.scale;
        this.text = new createjs.Text("", fontSize + "px Sans", platformColor.blockText);
        this.generateArtwork(true, []);
    }

    /**
     * Add an image to a block.
     * @private
     * @returns {void}
     */
    _addImage() {
        const image = new Image();
        const that = this;

        /**
         * The loader.
         * @private
         * @returns {void}
         */
        image.onload = () => {
            const bitmap = new createjs.Bitmap(image);
            // Don't override the image on a media block.
            if (that.name === "media") {
                for (let i = 0; i < that.container.children.length; i++) {
                    if (that.container.children[i].name === "media") {
                        return;
                    }
                }
            }
            bitmap.name = "media";
            that.container.addChild(bitmap);
            that._positionMedia(bitmap, image.width, image.height, that.protoblock.scale);
            /*
            that._positionMedia(
                bitmap,
                image.width,
                image.height,
                that.protoblock.scale
            );
            */
            that.imageBitmap = bitmap;
            that.updateCache();
        };

        if (this.image.search("xmlns") !== -1) {
            image.src =
                "data:image/svg+xml;base64," +
                window.btoa(base64Encode(this.image));
        } else {
            image.src = this.image;
        }
    }

    /**
     * Sometimes (in the case of namedboxes and nameddos) we need to regenerate the artwork
     * associated with a block.
     * @public
     * @param collapse -is the collapse artwork also generated?
     * @returns {void}
     */
    regenerateArtwork(collapse) {
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
    }

    /**
     * Generate the artwork for a block.
     * @public
     * @param firstTime - the first time, add the event handlers
     * @returns {void}
     */
    generateArtwork(firstTime) {
        // Get the block labels from the protoblock.
        const that = this;
        const thisBlock = this.blocks.blockList.indexOf(this);
        let block_label = "";

        // Create the highlight bitmap for the block.
        const __processHighlightBitmap = (bitmap, that) => {
            if (that.highlightBitmap != null) {
                that.container.removeChild(that.highlightBitmap);
            }

            that.highlightBitmap = bitmap;
            that.container.addChild(that.highlightBitmap);
            that.highlightBitmap.x = 0;
            that.highlightBitmap.y = 0;
            that.highlightBitmap.name = "bmp_highlight_" + thisBlock;
            if (!that.activity.logo.runningLilypond) {
                that.highlightBitmap.cursor = "pointer";
            }
            // Hide highlight bitmap to start.
            that.highlightBitmap.visible = false;

            // At me point, it should be safe to calculate the
            // bounds of the container and cache its contents.
            if (!firstTime) {
                that.container.uncache();
            }

            const __callback = (that, firstTime) => {
                that.activity.refreshCanvas();
                const thisBlock = that.blocks.blockList.indexOf(that);

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
        const __processDisconnectedHighlightBitmap = (bitmap, that) => {
            if (that.disconnectedHighlightBitmap != null) {
                that.container.removeChild(that.disconnectedHighlightBitmap);
            }

            that.disconnectedHighlightBitmap = bitmap;
            that.container.addChild(that.disconnectedHighlightBitmap);
            that.disconnectedHighlightBitmap.x = 0;
            that.disconnectedHighlightBitmap.y = 0;
            that.disconnectedHighlightBitmap.name = "bmp_disconnect_hightlight_" + thisBlock;
            if (!that.activity.logo.runningLilypond) {
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
                    .replace(/fill_color/g, PALETTEHIGHLIGHTCOLORS[that.protoblock.palette.name])
                    .replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[that.protoblock.palette.name])
                    .replace("block_label", safeSVG(block_label));
            }

            for (let i = 1; i < that.protoblock.staticLabels.length; i++) {
                artwork = artwork.replace("arg_label_" + i, that.protoblock.staticLabels[i]);
            }

            _blockMakeBitmap(artwork, __processHighlightBitmap, that);
        };

        // Create the disconnect bitmap for the block.
        const __processDisconnectedBitmap = (bitmap, that) => {
            if (that.disconnectedBitmap != null) {
                that.container.removeChild(that.disconnectedBitmap);
            }

            that.disconnectedBitmap = bitmap;
            that.container.addChild(that.disconnectedBitmap);
            that.disconnectedBitmap.x = 0;
            that.disconnectedBitmap.y = 0;
            that.disconnectedBitmap.name = "bmp_disconnect_" + thisBlock;
            if (!that.activity.logo.runningLilypond) {
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
                        platformColor.paletteColors[that.protoblock.palette.name][3]
                    )
                    .replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[that.protoblock.palette.name])
                    .replace("block_label", safeSVG(block_label));
            }

            for (let i = 1; i < that.protoblock.staticLabels.length; i++) {
                artwork = artwork.replace("arg_label_" + i, that.protoblock.staticLabels[i]);
            }

            _blockMakeBitmap(artwork, __processDisconnectedHighlightBitmap, that);
        };

        // Create the bitmap for the block.
        const __processBitmap = (bitmap, that) => {
            if (that.bitmap != null) {
                that.container.removeChild(that.bitmap);
            }

            that.bitmap = bitmap;
            that.container.addChild(that.bitmap);
            that.bitmap.x = 0;
            that.bitmap.y = 0;
            that.bitmap.name = "bmp_" + thisBlock;
            that.bitmap.cursor = "pointer";
            that.activity.refreshCanvas();
            let artwork;
            if (that.protoblock.disabled) {
                artwork = that.artwork
                    .replace(/fill_color/g, DISABLEDFILLCOLOR)
                    .replace(/stroke_color/g, DISABLEDSTROKECOLOR)
                    .replace("block_label", safeSVG(block_label));
            } else {
                artwork = that.artwork
                    .replace(/fill_color/g, platformColor.disconnected)
                    .replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[that.protoblock.palette.name])
                    .replace("block_label", safeSVG(block_label));
            }

            for (let i = 1; i < that.protoblock.staticLabels.length; i++) {
                artwork = artwork.replace("arg_label_" + i, that.protoblock.staticLabels[i]);
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
                    block_label = block_label.substr(0, STRINGLEN) + "...";
                }
            } else {
                block_label = this.overrideName;
            }
        } else if (this.protoblock.staticLabels.length > 0 && !this.protoblock.image) {
            // Label should be defined inside _().
            if (SPECIALINPUTS.indexOf(this.name) !== -1) {
                block_label = "";
            } else {
                block_label = this.protoblock.staticLabels[0];
            }
        }

        while (this.protoblock.staticLabels.length < this.protoblock.args + 1) {
            this.protoblock.staticLabels.push("");
        }

        if (firstTime) {
            // Create artwork and dock.
            this.protoblock.scale = this.blocks.blockScale;

            const obj = this.protoblock.generator();
            this.artwork = obj[0];
            for (let i = 0; i < obj[1].length; i++) {
                this.docks.push([obj[1][i][0], obj[1][i][1], this.protoblock.dockTypes[i]]);
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
                .replace(/fill_color/g, PALETTEFILLCOLORS[this.protoblock.palette.name])
                .replace(/stroke_color/g, PALETTESTROKECOLORS[this.protoblock.palette.name])
                .replace("block_label", safeSVG(block_label));
        }

        for (let i = 1; i < this.protoblock.staticLabels.length; i++) {
            artwork = artwork.replace("arg_label_" + i, this.protoblock.staticLabels[i]);
        }

        that.blocks.blockArt[that.blocks.blockList.indexOf(that)] = artwork;

        _blockMakeBitmap(artwork, __processBitmap, this);
    }

    /**
     * After the block artwork has loaded, update labels, etc.
     * @private
     * @returns {void}
     */
    _finishImageLoad() {
        // const thisBlock = this.blocks.blockList.indexOf(this);
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
                        this.value =
                            this.activity.logo.synth.startingPitch.substring(
                                0,
                                this.activity.logo.synth.startingPitch.length - 1
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
                    case "chordname":
                        this.value = DEFAULTCHORD;
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
                    case "wrapmode":
                        this.value = "on";
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
            } else if (this.name === "scaledegree2") {
                obj = splitScaleDegree(this.value);
                label = obj[0];
                attr = obj[1];

                if (attr !== "♮") {
                    label += attr;
                }
            } else if (this.name === "drumname") {
                label = getDrumName(this.value);
            } else if (this.name === "noisename") {
                label = getNoiseName(this.value);
            } else if (this.name === "outputtools") {
                label = this.overrideName;
            } else if (this.name === "grid") {
                label = _(this.value);
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

            // this.activity.refreshCanvas();
            this.blocks.cleanupAfterLoad(this.name);
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

            const postProcess = (that) => {
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

        this.activity.refreshCanvas();
    }

    /**
     * Generate the collapsed artwork.
     * @private
     * @param postProcess - a process to run after the artwork is generated
     * @returns {void}
     */
    _generateCollapseArtwork(postProcess) {
        const thisBlock = this.blocks.blockList.indexOf(this);

        /**
         * Run the postprocess function after the artwork is loaded.
         * @private
         * @returns {void}
         */
        const __finishCollapse = (that) => {
            if (postProcess !== null) {
                postProcess(that);
            }

            that.activity.refreshCanvas();
            that.blocks.cleanupAfterLoad(that.name);
            if (that.trash) {
                that.collapseText.visible = false;
                that.collapseButtonBitmap.visible = false;
                that.expandButtonBitmap.visible = false;
            }
        };

        /**
         * Create the artwork for the collapse buttons.
         * @private
         * @param that - = this
         * @returns {void}
         */
        const __processCollapseButton = (that) => {
            const image = new Image();
            image.onload = () => {
                that.collapseButtonBitmap = new createjs.Bitmap(image);
                that.collapseButtonBitmap.scaleX =
                    that.collapseButtonBitmap.scaleY =
                    that.collapseButtonBitmap.scale =
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
                window.btoa(base64Encode(COLLAPSEBUTTON));
        };

        /**
         * Create the artwork for the expand buttons.
         * @private
         * @param that - = this
         * @returns {void}
         */
        const __processExpandButton = (that) => {
            const image = new Image();
            image.onload = () => {
                that.expandButtonBitmap = new createjs.Bitmap(image);
                that.expandButtonBitmap.scaleX =
                    that.expandButtonBitmap.scaleY =
                    that.expandButtonBitmap.scale =
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
                window.btoa(base64Encode(EXPANDBUTTON));
        };

        /**
         * Processing the highlighted collapsed image.
         * @private
         * @param bitmap - highlight artwork
         * @param that - = this
         * @returns {void}
         */
        const __processHighlightCollapseBitmap = (bitmap, that) => {
            that.highlightCollapseBlockBitmap = bitmap;
            that.highlightCollapseBlockBitmap.name = "highlight_collapse_" + thisBlock;
            that.container.addChild(that.highlightCollapseBlockBitmap);
            that.highlightCollapseBlockBitmap.visible = false;

            if (that.collapseText === null) {
                const fontSize = 10 * that.protoblock.scale;
                switch (that.name) {
                    case "action":
                        that.collapseText = new createjs.Text(
                            _("action"),
                            fontSize + "px Sans",
                            platformColor.blockText
                        );
                        break;
                    case "temperament1":
                        that.collapseText = new createjs.Text(
                            _("temperament"),
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
                    case "definemode":
                        that.collapseText = new createjs.Text(
                            _("mode"),
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
            that.blocks.blockCollapseArt[that.blocks.blockList.indexOf(that)] = that.collapseArtwork
                .replace(/fill_color/g, PALETTEFILLCOLORS[that.protoblock.palette.name])
                .replace(/stroke_color/g, PALETTESTROKECOLORS[that.protoblock.palette.name])
                .replace("block_label", safeSVG(that.collapseText.text));

            __processExpandButton(that);
        };

        /**
         * Processing the collapsed block.
         * @private
         * @param bitmap - block artwork
         * @param that - = this
         * @returns {void}
         */
        const __processCollapseBitmap = (bitmap, that) => {
            that.collapseBlockBitmap = bitmap;
            that.collapseBlockBitmap.name = "collapse_" + thisBlock;
            that.container.addChild(that.collapseBlockBitmap);
            that.collapseBlockBitmap.visible = that.collapsed;
            that.activity.refreshCanvas();

            const artwork = that.collapseArtwork;
            _blockMakeBitmap(
                artwork
                    .replace(/fill_color/g, PALETTEHIGHLIGHTCOLORS[that.protoblock.palette.name])
                    .replace(/stroke_color/g, HIGHLIGHTSTROKECOLORS[that.protoblock.palette.name])
                    .replace("block_label", ""),
                __processHighlightCollapseBitmap,
                that
            );
        };

        const artwork = this.collapseArtwork
            .replace(/fill_color/g, PALETTEFILLCOLORS[this.protoblock.palette.name])
            .replace(/stroke_color/g, PALETTESTROKECOLORS[this.protoblock.palette.name])
            .replace("block_label", "");
        _blockMakeBitmap(artwork, __processCollapseBitmap, this);
    }

    /**
     * Hide this block.
     * @public
     * @returns {void}
     */
    hide() {
        this.container.visible = false;
        if (this.isCollapsible()) {
            // Sometimes these fields are not set.
            if (this.collapseText !== null) {
                this.collapseText.visible = false;
            }
            if (this.expandButtonBitmap !== null) {
                this.expandButtonBitmap.visible = false;
            }
            if (this.collapseButtonBitmap !== null) {
                this.collapseButtonBitmap.visible = false;
            }
        }

        this.updateCache();
        this.activity.refreshCanvas();
    }

    /**
     * Is this block disconnected from other blocks?
     * @public
     * @returns {boolean} true if the block is disconnected from other blocks
     */
    isDisconnected() {
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
            if (last(this.blocks.blockList[last(this.connections)].connections) === null) {
                return true;
            }
        }

        return false;
    }

    /**
     * Show this block.
     * @public
     * @returns {void}
     */
    show() {
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
                    // If the block is disconnected, use the
                    // disconnected bitmap.
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
            this.activity.refreshCanvas();
        }
    }

    // Utility functions
    isValueBlock() {
        return this.protoblock.style === "value";
    }

    isNoHitBlock() {
        return NOHIT.indexOf(this.name) !== -1;
    }

    isArgBlock() {
        return this.protoblock.style === "value" || this.protoblock.style === "arg";
    }

    isTwoArgBlock() {
        return this.protoblock.style === "twoarg";
    }

    isTwoArgBooleanBlock() {
        return ["equal", "greater", "less"].indexOf(this.name) !== -1;
    }

    isClampBlock() {
        return (
            this.protoblock.style === "clamp" ||
            this.isDoubleClampBlock() ||
            this.isArgFlowClampBlock()
        );
    }

    isArgFlowClampBlock() {
        return this.protoblock.style === "argflowclamp";
    }

    isLeftClampBlock() {
        return this.protoblock.isLeftClamp;
    }

    isDoubleClampBlock() {
        return this.protoblock.style === "doubleclamp";
    }

    isNoRunBlock() {
        return this.name === "action";
    }

    isArgClamp() {
        return this.protoblock.style === "argclamp" || this.protoblock.style === "argclamparg";
    }

    isExpandableBlock() {
        return this.protoblock.expandable;
    }

    getBlockId() {
        // Generate a UID based on the block index into the blockList.
        const number = blockBlocks.blockList.indexOf(this);
        return "_" + number.toString();
    }

    removeChildBitmap(name) {
        for (let child = 0; child < this.container.children.length; child++) {
            if (this.container.children[child].name === name) {
                this.container.removeChild(this.container.children[child]);
                break;
            }
        }
    }

    loadThumbnail(imagePath) {
        // Load an image thumbnail onto block.
        const thisBlock = this.blocks.blockList.indexOf(this);
        const that = this;

        if (this.blocks.blockList[thisBlock].value === null && imagePath === null) {
            return;
        }
        const image = new Image();

        image.onload = () => {
            // Before adding new artwork, remove any old artwork.
            that.removeChildBitmap("media");

            const bitmap = new createjs.Bitmap(image);
            bitmap.name = "media";

            const myContainer = new createjs.Container();
            myContainer.addChild(bitmap);

            // Resize the image to a reasonable maximum.
            const MAXWIDTH = 600;
            const MAXHEIGHT = 450;
            if (image.width > image.height) {
                if (image.width > MAXWIDTH) {
                    bitmap.scaleX = bitmap.scaleY = bitmap.scale = MAXWIDTH / image.width;
                }
            } else {
                if (image.height > MAXHEIGHT) {
                    bitmap.scaleX = bitmap.scaleY = bitmap.scale = MAXHEIGHT / image.height;
                }
            }

            const bounds = myContainer.getBounds();
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
    }

    _doOpenMedia(thisBlock) {
        const fileChooser = docById("myOpenAll");
        const that = this;

        const __readerAction = () => {
            window.scroll(0, 0);

            const reader = new FileReader();
            reader.onloadend = () => {
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
            } else if (that.name === "audiofile") {
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
    }

    setCollapsedState() {
        // Mark it as in a collapsed block and hide it.
        this.inCollapsed = true;
        this.hide();
    }

    setUncollapsedState(nblk) {
        // It could be a block inside a note block, which may or may
        // not be hidden depending on the collapsed state of the
        // containing note block.
        if (nblk === null) {
            this.inCollapsed = false;
            this.show();
        } else {
            // if we are inside of a collapsed note block, do nothing.
            if (!this.blocks.blockList[nblk].collapsed) {
                this.inCollapsed = false;
                this.show();
            }
        }
    }

    collapseToggle() {
        // Find the blocks to collapse/expand inside of a collapable
        // block.
        const thisBlock = this.blocks.blockList.indexOf(this);
        this.blocks.findDragGroup(thisBlock);

        if (this.collapseBlockBitmap === null) {
            // console.debug("collapse bitmap not ready");
            return;
        }

        // Remember the current state.
        const isCollapsed = this.collapsed;
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
                    // console.debug("What do we do with a collapsed " + this.name + " block?");
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
                    const blk = this.blocks.dragGroup[b];
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
        this.activity.refreshCanvas();
    }

    _intervalLabel() {
        // Find pitch and value to display on the collapsed interval
        // block.
        const degrees = DEGREES.split(" ");
        const intervalLabels = {};
        for (let i = 0; i < degrees.length; i++) {
            intervalLabels[i] = degrees[i];
        }

        const intervals = [];
        let i = 0;

        let c = this.blocks.blockList.indexOf(this),
            lastIntervalBlock;
        while (c !== null) {
            lastIntervalBlock = c;
            const n = this.blocks.blockList[c].connections[1];
            const cblock = this.blocks.blockList[n];
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
                // console.debug("loop?");
                break;
            }

            c = this.blocks.findNestedIntervalBlock(this.blocks.blockList[c].connections[2]);
        }

        let itext = "";
        for (let i = intervals.length; i > 0; i--) {
            itext += " " + intervals[i - 1];
        }

        let v = "";
        const nblk = this.blocks.findNoteBlock(lastIntervalBlock);
        if (nblk === null) {
            this.collapseText.text = _("scalar interval") + itext;
        } else {
            c = this.blocks.blockList[nblk].connections[1];
            if (c !== null) {
                // Only look for standard form: / 1 4
                if (this.blocks.blockList[c].name === "divide") {
                    const c1 = this.blocks.blockList[c].connections[1];
                    const c2 = this.blocks.blockList[c].connections[2];
                    if (
                        this.blocks.blockList[c1].name === "number" &&
                        this.blocks.blockList[c2].name === "number"
                    ) {
                        v = this.blocks.blockList[c1].value + "/" + this.blocks.blockList[c2].value;
                        if (this.blocks.blockList[c2].value in NSYMBOLS) {
                            v += NSYMBOLS[this.blocks.blockList[c2].value];
                        }
                    }
                }
            }

            c = this.blocks.findFirstPitchBlock(this.blocks.blockList[nblk].connections[2]);
            const p = this._getPitch(c);
            if (c === null || p === "") {
                this.collapseText.text = _("scalar interval") + itext;
            } else {
                // Are there more pitch blocks in this note?
                c = this.blocks.findFirstPitchBlock(last(this.blocks.blockList[c].connections));
                // Update the collapsed-block label.
                if (c === null) {
                    this.collapseText.text = p + " | " + v + itext;
                } else {
                    this.collapseText.text = p + "..." + " | " + v + itext;
                }
            }
        }
    }

    _newNoteLabel() {
        // Find pitch and value to display on the collapsed note value
        // block.
        let v = "";
        let c = this.connections[1];
        let vi = null;
        if (c !== null) {
            // Only look for standard form: / 1 4
            if (this.blocks.blockList[c].name === "divide") {
                const c1 = this.blocks.blockList[c].connections[1];
                const c2 = this.blocks.blockList[c].connections[2];
                if (
                    this.blocks.blockList[c1].name === "number" &&
                    this.blocks.blockList[c2].name === "number"
                ) {
                    v = this.blocks.blockList[c1].value + "/" + this.blocks.blockList[c2].value;
                    vi = this.blocks.blockList[c2].value;
                    if (vi in NSYMBOLS) {
                        v += NSYMBOLS[vi];
                    }
                }
            }
        }

        c = this.connections[2];
        c = this.blocks.findFirstPitchBlock(c);
        const p = this._getPitch(c);
        if (c === null) {
            if (vi !== null) {
                if (vi in NSYMBOLS) {
                    v = v.replace(NSYMBOLS[vi], RSYMBOLS[vi]);
                }
            }
            this.collapseText.text = _("silence") + " | " + v;
        } else if (p === "" && v === "") {
            this.collapseText.text = _("note value");
        } else {
            if (p === _("silence")) {
                if (vi !== null) {
                    if (vi in NSYMBOLS) {
                        v = v.replace(NSYMBOLS[vi], RSYMBOLS[vi]);
                    }
                }
            }

            // are there more pitch blocks in this note?
            c = this.blocks.findFirstPitchBlock(last(this.blocks.blockList[c].connections));
            // Update the collapsed-block label.
            if (c === null) {
                this.collapseText.text = p + " | " + v;
            } else {
                this.collapseText.text = p + "... | " + v;
            }
        }
    }

    _oscTimeLabel() {
        // Find Hertz and value to display on the collapsed note value
        // block.
        let v = "";
        let c = this.connections[1];
        if (c !== null) {
            // Only look for standard form: / 1000 / 3 2
            if (this.blocks.blockList[c].name === "divide") {
                const c1 = this.blocks.blockList[c].connections[1];
                const c2 = this.blocks.blockList[c].connections[2];
                if (c1 !== null && c2 !== null && this.blocks.blockList[c2].name === "divide") {
                    const ci = this.blocks.blockList[c2].connections[1];
                    const cii = this.blocks.blockList[c2].connections[2];
                    if (
                        ci !== null &&
                        cii !== null &&
                        this.blocks.blockList[ci].name === "number" &&
                        this.blocks.blockList[cii].name === "number"
                    ) {
                        v =
                            (this.blocks.blockList[c1].value / this.blocks.blockList[ci].value) *
                            this.blocks.blockList[cii].value;
                    }
                }
            }
        }

        c = this.connections[2];
        c = this.blocks.findFirstPitchBlock(c);
        const p = this._getPitch(c);
        if (c === null) {
            this.collapseText.text = _("silence") + " | " + v;
        } else if (p === "" && v === "") {
            this.collapseText.text = _("note value");
        } else {
            // Are there more pitch blocks in this note?
            c = this.blocks.findFirstPitchBlock(last(this.blocks.blockList[c].connections));
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
    }

    _getPitch(c) {
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
                        const solfnotes_ = _("ti la sol fa mi re do").split(" ");
                        const stripped = this.blocks.blockList[c1].value
                            .replace(SHARP, "")
                            .replace(FLAT, "")
                            .replace(DOUBLESHARP, "")
                            .replace(DOUBLEFLAT, "");
                        const i = ["ti", "la", "sol", "fa", "mi", "re", "do"].indexOf(stripped);
                        if (this.blocks.blockList[c1].value.indexOf(SHARP) !== -1) {
                            return solfnotes_[i] + SHARP + " " + this.blocks.blockList[c2].value;
                        } else if (this.blocks.blockList[c1].value.indexOf(FLAT) !== -1) {
                            return solfnotes_[i] + FLAT + " " + this.blocks.blockList[c2].value;
                        } else if (this.blocks.blockList[c1].value.indexOf(DOUBLESHARP) !== -1) {
                            return (
                                solfnotes_[i] + DOUBLESHARP + " " + this.blocks.blockList[c2].value
                            );
                        } else if (this.blocks.blockList[c1].value.indexOf(DOUBLEFLAT) !== -1) {
                            return (
                                solfnotes_[i] + DOUBLEFLAT + " " + this.blocks.blockList[c2].value
                            );
                        } else {
                            return solfnotes_[i] + " " + this.blocks.blockList[c2].value;
                        }
                    } else if (this.blocks.blockList[c1].name === "notename") {
                        return (
                            this.blocks.blockList[c1].value + " " + this.blocks.blockList[c2].value
                        );
                    } else if (this.blocks.blockList[c1].name === "scaledegree2") {
                        const obj = splitScaleDegree(this.blocks.blockList[c1].value);
                        let note = obj[0];
                        if (obj[1] !== NATURAL) {
                            note += obj[1];
                        }
                        return note + " " + this.blocks.blockList[c2].value;
                    }
                }
                break;
            case "nthmodalpitch":
                c1 = this.blocks.blockList[c].connections[1];
                c2 = this.blocks.blockList[c].connections[2];
                if (this.blocks.blockList[c2].name === "number") {
                    if (this.blocks.blockList[c1].name === "number") {
                        const degrees = DEGREES.split(" ");
                        const i = this.blocks.blockList[c1].value - 1;
                        if (i > 0 && i < degrees.length) {
                            return degrees[i] + " " + this.blocks.blockList[c2].value;
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
                    return _("down") + " " + Math.abs(this.blocks.blockList[c1].value);
                } else return _("up") + " " + this.blocks.blockList[c1].value;
            case "pitchnumber":
                c1 = this.blocks.blockList[c].connections[1];
                if (this.blocks.blockList[c1].name === "number") {
                    //.TRANS: pitch number
                    return _("pitch") + " " + this.blocks.blockList[c1].value;
                }
                break;
            case "playdrum":
                return _("drum");
            case "rest2":
                return _("silence");
            default:
                return "";
        }
    }

    _toggle_inline(thisBlock, collapse) {
        // Toggle the collapsed state of blocks inside of a note (or
        // interval) block and reposition any blocks below
        // it. Finally, resize any surrounding clamps.

        // Set collapsed state of note value arg blocks...
        if (this.connections[1] !== null) {
            this.blocks.findDragGroup(this.connections[1]);
            for (let b = 0; b < this.blocks.dragGroup.length; b++) {
                const blk = this.blocks.dragGroup[b];
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
                const blk = this.blocks.dragGroup[b];
                // Look to see if the local parent block is collapsed.
                const parent = this.blocks.insideInlineCollapsibleBlock(blk);
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
            const n = this.docks.length;
            let dy;
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
        const clampList = [];
        this.blocks.findNestedClampBlocks(thisBlock, clampList);
        if (clampList.length > 0) {
            this.blocks.clampBlocksToCheck = clampList;
            this.blocks.adjustExpandableClampBlock();
        }

        this.activity.refreshCanvas();
    }

    /**
     * Position any addition text on a block.
     * @private
     * @param blockscale - used to scale the text
     * @returns {void}
     */
    _positionText(blockScale) {
        this.text.textBaseline = "alphabetic";
        this.text.textAlign = "right";
        const fontSize = 10 * blockScale;
        this.text.font = fontSize + "px Sans";
        this.text.x = Math.floor((TEXTX * blockScale) / 2 + 0.5);
        this.text.y = Math.floor((TEXTY * blockScale) / 2 + 0.5);

        // Some special cases
        if (SPECIALINPUTS.indexOf(this.name) !== -1) {
            this.text.textAlign = "center";
            this.text.x = Math.floor((VALUETEXTX * blockScale) / 2 + 10.0);
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
            // const bounds = this.container.getBounds();
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
        const zIndex = this.container.children.length - 1;
        this.container.setChildIndex(this.text, zIndex);
        this.updateCache();
    }

    /**
     * Position media artwork on a block.
     * @private
     * @param bitmap - image
     * @param width - width of canvas
     * @param height - height of canvas
     * @param blockscale - scale
     * Position inserted media.
     * @returns {void}
     */
    _positionMedia(bitmap, width, height, blockScale) {
        if (width > height) {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale =
                ((MEDIASAFEAREA[2] / width) * blockScale) / 2;
        } else {
            bitmap.scaleX = bitmap.scaleY = bitmap.scale =
                ((MEDIASAFEAREA[3] / height) * blockScale) / 2;
        }
        bitmap.x = ((MEDIASAFEAREA[0] - 10) * blockScale) / 2;
        bitmap.y = (MEDIASAFEAREA[1] * blockScale) / 2;
    }

    /**
     * Position the label for a collapsed block.
     * @private
     * @param blockscale - scale
     * @returns {void}
     */
    _positionCollapseLabel(blockScale) {
        if (this.isInlineCollapsible()) {
            this.collapseText.x = Math.floor(
                ((COLLAPSETEXTX + STANDARDBLOCKHEIGHT) * blockScale) / 2 + 0.5
            );
            this.collapseText.y = Math.floor(((COLLAPSETEXTY - 8) * blockScale) / 2 + 0.5);
        } else {
            this.collapseText.x = Math.floor(((COLLAPSETEXTX + 30) * blockScale) / 2 + 0.5);
            this.collapseText.y = Math.floor((COLLAPSETEXTY * blockScale) / 2 + 0.5);
        }

        // Ensure text is on top.
        const zIndex = this.container.children.length - 1;
        this.container.setChildIndex(this.collapseText, zIndex);
    }

    /**
     * Determine the hit area for a block.
     * @deprecated
     * @private
     * @returns {void}
     */
    _calculateBlockHitArea() {
        const hitArea = new createjs.Shape();
        hitArea.graphics
            .beginFill("platformColor.hitAreaGraphicsBeginFill")
            .drawRect(0, 0, this.width, this.hitHeight);
        this.container.hitArea = hitArea;
    }

    /**
     * These are the event handlers for block containers.
     * @private
     * @returns {void}
     */
    _loadEventHandlers() {
        const that = this;
        const thisBlock = this.blocks.blockList.indexOf(this);

        this._calculateBlockHitArea();

        this.container.on("mouseover", () => {
            docById("contextWheelDiv").style.display = "none";

            if (!that.activity.logo.runningLilypond) {
                document.body.style.cursor = "pointer";
            }

            that.blocks.highlight(thisBlock, true);
            that.blocks.activeBlock = thisBlock;
            // that.activity.refreshCanvas();
        });

        let haveClick = false;
        let moved = false;
        let locked = false;
        let getInput = window.hasMouse;

        this.container.on("click", (event) => {
            // We might be able to check which button was clicked.
            if ("nativeEvent" in event) {
                if ("button" in event.nativeEvent && event.nativeEvent.button == 2) {
                    that.blocks.stageClick = true;
                    docById("wheelDiv").style.display = "none";
                    that.blocks.activeBlock = thisBlock;
                    piemenuBlockContext(that);
                    return;
                } else if ("ctrlKey" in event.nativeEvent && event.nativeEvent.ctrlKey) {
                    that.blocks.activeBlock = thisBlock;
                    piemenuBlockContext(that);
                    return;
                } else if ("shiftKey" in event.nativeEvent && event.nativeEvent.shiftKey) {
                    if (that.activity.turtles.running()) {
                        that.activity.logo.doStopTurtles();

                        setTimeout(() => {
                            that.activity.logo.runLogoCommands(topBlock);
                        }, 250);
                    } else {
                        that.activity.logo.runLogoCommands(topBlock);
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
            setTimeout(() => {
                locked = false;
            }, 500);

            hideDOMLabel();
            that._checkWidgets(false);

            let topBlk;

            const dx = event.stageX / that.activity.getStageScale() - that.container.x;
            if (!moved && that.isCollapsible() && dx < 30 / that.activity.getStageScale()) {
                that.collapseToggle();
            } else if ((!window.hasMouse && getInput) || (window.hasMouse && !moved)) {
                if (that.name === "media") {
                    that._doOpenMedia(thisBlock);
                } else if (that.name === "audiofile") {
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
                    if (!that.blocks.getLongPressStatus() && !that.blocks.stageClick) {
                        topBlk = that.blocks.findTopBlock(thisBlock);

                        that.activity.logo.synth.resume();

                        if (that.activity.turtles.running()) {
                            that.activity.logo.doStopTurtles();

                            setTimeout(() => {
                                that.activity.logo.runLogoCommands(topBlk);
                            }, 250);
                        } else {
                            that.activity.logo.runLogoCommands(topBlk);
                        }
                    }
                }
            } else if (!moved) {
                if (!that.blocks.getLongPressStatus() && !that.blocks.stageClick) {
                    topBlk = that.blocks.findTopBlock(thisBlock);

                    that.activity.logo.synth.resume();

                    if (that.activity.turtles.running()) {
                        that.activity.logo.doStopTurtles();

                        setTimeout(() => {
                            that.activity.logo.runLogoCommands(topBlk);
                        }, 250);
                    } else {
                        that.activity.logo.runLogoCommands(topBlk);
                    }
                }
            }
        });

        this.container.on("mousedown", (event) =>{
            docById("contextWheelDiv").style.display = "none";

            // Track time for detecting long pause...
            that.blocks.mouseDownTime = new Date().getTime();

            that.blocks.longPressTimeout = setTimeout(() => {
                that.blocks.activeBlock = that.blocks.blockList.indexOf(that);
                that._triggerLongPress = true;
                that.blocks.triggerLongPress();
            }, LONGPRESSTIME);

            // Always show the trash when there is a block selected,
            that.activity.trashcan.show();

            // Raise entire stack to the top.
            that.blocks.raiseStackToTop(thisBlock);

            // And possibly the collapse button.
            if (that.collapseContainer != null) {
                that.activity.blocksContainer.setChildIndex(
                    that.collapseContainer,
                    that.activity.blocksContainer.children.length - 1
                );
            }

            moved = false;
            that.original = {
                x: event.stageX / that.activity.getStageScale(),
                y: event.stageY / that.activity.getStageScale()
            };

            that.offset = {
                x: Math.round(that.container.x - that.original.x),
                y: Math.round(that.container.y - that.original.y)
            };
        });

        this.container.on("pressmove", (event) =>{
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
                setTimeout(() => {
                    moved =
                        Math.abs(event.stageX / that.activity.getStageScale() - that.original.x) +
                            Math.abs(
                                event.stageY / that.activity.getStageScale() - that.original.y
                            ) >
                            20 && !window.hasMouse;
                    getInput = !moved;
                }, 200);
            }

            const oldX = that.container.x;
            const oldY = that.container.y;

            const dx = Math.round(
                event.stageX / that.activity.getStageScale() + that.offset.x - oldX
            );
            let dy = Math.round(
                event.stageY / that.activity.getStageScale() + that.offset.y - oldY
            );

            const finalPos = oldY + dy;
            if (that.activity.blocksContainer.y === 0 && finalPos < 45) {
                dy += 45 - finalPos;
            }

            // scroll when reached edges.
            if (event.stageX < 10 && that.activity.scrollBlockContainer)
                that.blocks.moveAllBlocksExcept(that, 10, 0);
            else if (event.stageX > window.innerWidth - 10 && that.activity.scrollBlockContainer)
                that.blocks.moveAllBlocksExcept(that, -10, 0);
            else if (event.stageY > window.innerHeight - 10)
                that.blocks.moveAllBlocksExcept(that, 0, -10);
            else if (event.stageY < 60) that.blocks.moveAllBlocksExcept(that, 0, 10);

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
                that.activity.trashcan.overTrashcan(
                    event.stageX / that.activity.getStageScale(),
                    event.stageY / that.activity.getStageScale()
                )
            ) {
                that.activity.trashcan.startHighlightAnimation();
            } else {
                that.activity.trashcan.stopHighlightAnimation();
            }

            if (that.isValueBlock() && that.name !== "media") {
                // Ensure text is on top
                that.container.setChildIndex(that.text, that.container.children.length - 1);
            }

            // ...and move any connected blocks.
            that.blocks.findDragGroup(thisBlock);
            if (that.blocks.dragGroup.length > 0) {
                for (let b = 0; b < that.blocks.dragGroup.length; b++) {
                    const blk = that.blocks.dragGroup[b];
                    if (b !== 0) {
                        that.blocks.moveBlockRelative(blk, dx, dy);
                    }
                }
            }

            that.activity.refreshCanvas();
        });

        this.container.on("mouseout", (event) =>{
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

        this.container.on("pressup", (event) =>{
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
    }

    /**
     * Common code for processing events.
     * @private
     * @param event - mouse
     * @param moved - cursor moved
     * @param haveClick - when clickd
     * @param hideDOM - hide mouse
     * Set cursor style to default.
     * @returns {void}
     */
    _mouseoutCallback(event, moved, haveClick, hideDOM) {
        const thisBlock = this.blocks.blockList.indexOf(this);
        if (!this.activity.logo.runningLilypond) {
            document.body.style.cursor = "default";
        }

        // Always hide the trash when there is no block selected.
        this.activity.trashcan.hide();

        if (this.blocks.longPressTimeout != null) {
            clearTimeout(this.blocks.longPressTimeout);
            this.blocks.longPressTimeout = null;
            this.blocks.clearLongPress();
        }

        if (moved) {
            // Check if block is in the trash.
            if (
                this.activity.trashcan.overTrashcan(
                    event.stageX / this.activity.getStageScale(),
                    event.stageY / this.activity.getStageScale()
                )
            ) {
                if (this.activity.trashcan.isVisible) {
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
                this.blocks.adjustDocks(this.blocks.blockList.indexOf(this), true);
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
                event.stageX / this.activity.getStageScale() < this.container.x ||
                event.stageX / this.activity.getStageScale() > this.container.x + this.width ||
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
                this.activity.refreshCanvas();
            }

            this.blocks.activeBlock = null;
        }
    }

    _usePiemenu() {
        // Check on all the special cases were we want to use a pie menu.
        this._check_meter_block = null;

        // Special pie menus
        if (PIEMENUS.indexOf(this.name) !== -1) {
            return true;
        }

        // Numeric pie menus
        const blk = this.blocks.blockList.indexOf(this);

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

        if (this._usePieNumberC1()) {
            return true;
        }

        return false;
    }

    _usePieNumberC1() {
        // Return true if this number block plugs into Connection 1 of
        // a block that uses a pie menu. Add block names to the list
        // below and the switch statement in the _changeLabel
        // function.
        const cblk = this.connections[0];

        if (cblk === null) {
            return false;
        }

        if (this.blocks.blockList[this.connections[0]].protoblock.piemenuValuesC1.length === 0) {
            return false;
        }

        return this.blocks.blockList[cblk].connections[1] === this.blocks.blockList.indexOf(this);
    }

    _usePieNumberC2() {
        // Return true if this number block plugs into Connection 2 of
        // a block that uses a pie menu. Add block names to the list
        // below and the switch statement in the _changeLabel
        // function.
        const cblk = this.connections[0];

        if (cblk === null) {
            return false;
        }

        if (this.blocks.blockList[this.connections[0]].protoblock.piemenuValuesC2.length === 0) {
            return false;
        }

        return this.blocks.blockList[cblk].connections[2] === this.blocks.blockList.indexOf(this);
    }

    _usePieNumberC3() {
        // Return true if this number block plugs into Connection 3 of
        // a block that uses a pie menu. Add block names to the list
        // below and the switch statement in the _changeLabel
        // function.
        const cblk = this.connections[0];

        if (cblk === null) {
            return false;
        }

        if (this.blocks.blockList[this.connections[0]].protoblock.piemenuValuesC3.length === 0) {
            return false;
        }

        return this.blocks.blockList[cblk].connections[3] === this.blocks.blockList.indexOf(this);
    }

    _ensureDecorationOnTop() {
        // Find the turtle decoration and move it to the top.
        for (let child = 0; child < this.container.children.length; child++) {
            if (this.container.children[child].name === "decoration") {
                // Drum block in collapsed state is less wide.
                // Deprecated
                let dx = 0;
                if (this.name === "drum" && this.collapsed) {
                    dx = (25 * this.protoblock.scale) / 2;
                }

                for (let t = 0; t < this.activity.turtles.turtleList.length; t++) {
                    if (this.activity.turtles.turtleList[t].startBlock === this) {
                        this.activity.turtles.turtleList[t].decorationBitmap.x =
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
    }

    /**
     * Change the label in a parameter block.
     * @private
     * @returns {void}
     */
    _changeLabel() {
        const that = this;
        const x = this.container.x;
        const y = this.container.y;

        const canvasLeft = this.activity.canvas.offsetLeft + 28 * this.blocks.blockScale;
        const canvasTop = this.activity.canvas.offsetTop + 6 * this.blocks.blockScale;

        const selectorWidth = 150;

        let movedStage = false;
        let fromY,
            labelValue,
            obj,
            selectedNote,
            selectedAttr,
            selectedAccidental,
            selectedMode,
            selectedChord,
            selectedInvert,
            selectedInterval,
            selectedDrum,
            selectedEffect,
            selectedVoice,
            selectedNoise,
            selectedTemperament,
            selectedValue,
            selectedType,
            selectedWrap;
        if (!window.hasMouse && this.activity.blocksContainer.y + y > 75) {
            movedStage = true;
            fromY = this.activity.blocksContainer.y;
            this.activity.blocksContainer.y = -y + 75;
        }

        // A place in the DOM to put modifiable labels (textareas).
        if (this.label != null) {
            labelValue = this.label.value;
        } else {
            labelValue = this.value;
        }

        const labelElem = docById("labelDiv");

	var safetext = function(text){
            // Best to avoid using these special characters in text strings
            // without first converting them to their "safe" form.
	    var table = {
		'<': 'lt',
		'>': 'gt',
		'"': 'quot',
		'\'': 'apos',
		'&': 'amp',
		'\r': '#10',
		'\n': '#13'
	    };
	
	    return text.toString().replace(/[<>"'\r\n&]/g, function(chr){
		return '&' + table[chr] + ';';
	    });
	};

        if (this.name === "text") {
            labelElem.innerHTML =
                '<input id="textLabel" style="position: absolute; -webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="text" type="text" value="' +
                safetext(labelValue) +
                '" />';
            labelElem.classList.add("hasKeyboard");
            this.label = docById("textLabel");

            // set the position of cursor to the end (for text value)
            const valueLength = this.label.value.length;
            this.label.setSelectionRange(valueLength, valueLength);

        } else if (this.name === "solfege") {
            obj = splitSolfege(this.value);
            // solfnotes_ is used in the interface for internationalization.
            //.TRANS: the note names must be separated by single spaces
            const solfnotes_ = _("ti la sol fa mi re do").split(" ");

            if (this.piemenuOKtoLaunch()) {
                piemenuPitches(this, solfnotes_, SOLFNOTES, SOLFATTRS, obj[0], obj[1]);
            }
        } else if (this.name === "scaledegree2") {
            obj = splitScaleDegree(this.value);
            const scalenotes_ = "7 6 5 4 3 2 1".split(" ");
            if (this.piemenuOKtoLaunch()) {
                piemenuPitches(this, scalenotes_, SCALENOTES, SOLFATTRS, obj[0], obj[1]);
            }
        } else if (this.name === "customNote") {
            if (!this.activity.logo.customTemperamentDefined) {
                // If custom temperament is not defined by user, then
                // custom temperament is supposed to be equal
                // temperament.
                obj = splitSolfege(this.value);
                const solfnotes_ = _("ti la sol fa mi re do").split(" ");

                if (this.piemenuOKtoLaunch()) {
                    piemenuPitches(this, solfnotes_, SOLFNOTES, SOLFATTRS, obj[0], obj[1]);
                }
            } else {
                const keys = getTemperamentKeys();
                const noteLabels = {};
                const customLabels = [];
                for (let i = 0; i < keys.length; i++) {
                    noteLabels[keys[i]] = getTemperament(keys[i]);
                    if (isCustomTemperament(keys[i])) {
                        customLabels.push(keys[i]);
                    }
                }
                let selectedCustom;
                if (this.customID !== null) {
                    selectedCustom = this.customID;
                } else {
                    selectedCustom = customLabels[0];
                }

                if (this.value !== null) {
                    selectedNote = this.value;
                } else {
                    selectedNote = getTemperament(selectedCustom)["0"][1];
                }

                piemenuCustomNotes(this, noteLabels, customLabels, selectedCustom, selectedNote);
            }
        } else if (this.name === "eastindiansolfege") {
            obj = splitSolfege(this.value);
            selectedNote = obj[0];
            selectedAttr = obj[1];

            if (this.piemenuOKtoLaunch()) {
                piemenuPitches(this, EASTINDIANSOLFNOTES, SOLFNOTES, SOLFATTRS, obj[0], obj[1]);
            }
        } else if (this.name === "notename") {
            const NOTENOTES = ["B", "A", "G", "F", "E", "D", "C"];
            if (this.value != null) {
                selectedNote = this.value[0];
                if (this.value.length === 1) {
                    selectedAttr = "♮";
                } else if (this.value.length === 2) {
                    selectedAttr = this.value[1];
                } else {
                    selectedAttr = this.value[1] + this.value[2];
                }
            } else {
                selectedNote = "G";
                selectedAttr = "♮";
            }

            if (selectedAttr === "") {
                selectedAttr = "♮";
            }

            if (this.piemenuOKtoLaunch()) {
                piemenuPitches(this, NOTENOTES, NOTENOTES, SOLFATTRS, selectedNote, selectedAttr);
            }
        } else if (this.name === "modename") {
            if (this.value != null) {
                selectedMode = this.value;
            } else {
                selectedMode = DEFAULTMODE;
            }

            piemenuModes(this, selectedMode);
        } else if (this.name === "chordname") {
            if (this.value != null) {
                selectedChord = this.value;
            } else {
                selectedChord = DEFAULTCHORD;
            }

            piemenuChords(this, selectedChord);
        } else if (this.name === "accidentalname") {
            if (this.value != null) {
                selectedAccidental = this.value;
            } else {
                selectedAccidental = DEFAULTACCIDENTAL;
            }

            if (this.piemenuOKtoLaunch()) {
                piemenuAccidentals(this, ACCIDENTALLABELS, ACCIDENTALNAMES, selectedAccidental);
            }
        } else if (this.name === "intervalname") {
            if (this.value != null) {
                selectedInterval = this.value;
            } else {
                selectedInterval = DEFAULTINTERVAL;
            }

            if (this.piemenuOKtoLaunch()) {
                piemenuIntervals(this, selectedInterval);
            }
        } else if (this.name === "invertmode") {
            if (this.value != null) {
                selectedInvert = this.value;
            } else {
                selectedInvert = DEFAULTINVERT;
            }

            const invertLabels = [];
            const invertValues = [];

            for (let i = 0; i < INVERTMODES.length; i++) {
                invertLabels.push(_(INVERTMODES[i][1]));
                invertValues.push(INVERTMODES[i][1]);
            }

            if (this.piemenuOKtoLaunch()) {
                piemenuBasic(this, invertLabels, invertValues, selectedInvert);
            }
        } else if (this.name === "drumname") {
            if (this.value != null) {
                selectedDrum = this.value;
            } else {
                selectedDrum = DEFAULTDRUM;
            }

            const drumLabels = [];
            const drumValues = [];
            const categories = [];
            const categoriesList = [];
            for (let i = 0; i < DRUMNAMES.length; i++) {
                if (EFFECTSNAMES.indexOf(DRUMNAMES[i][1]) === -1) {
                    const label = _(DRUMNAMES[i][1]);
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

            piemenuVoices(this, drumLabels, drumValues, categories, selectedDrum);
        } else if (this.name === "effectsname") {
            if (this.value != null) {
                selectedDrum = this.value;
            } else {
                selectedEffect = DEFAULTEFFECT;
            }

            const effectLabels = [];
            const effectValues = [];
            const effectcategories = [];
            const effectcategoriesList = [];
            for (let i = 0; i < DRUMNAMES.length; i++) {
                if (EFFECTSNAMES.indexOf(DRUMNAMES[i][1]) !== -1) {
                    const label = _(DRUMNAMES[i][1]);
                    if (getTextWidth(label, "Bold 30pt Sans") > 400) {
                        effectLabels.push(label.substr(0, 8) + "...");
                    } else {
                        effectLabels.push(label);
                    }

                    effectValues.push(DRUMNAMES[i][1]);

                    if (effectcategoriesList.indexOf(DRUMNAMES[i][4]) === -1) {
                        effectcategoriesList.push(DRUMNAMES[i][4]);
                    }

                    effectcategories.push(effectcategoriesList.indexOf(DRUMNAMES[i][4]));
                }
            }

            piemenuVoices(this, effectLabels, effectValues, effectcategories, selectedEffect);
        } else if (this.name === "filtertype") {
            if (this.value != null) {
                selectedType = this.value;
            } else {
                selectedType = DEFAULTFILTERTYPE;
            }

            const filterLabels = [];
            const filterValues = [];
            for (let i = 0; i < FILTERTYPES.length; i++) {
                filterLabels.push(_(FILTERTYPES[i][0]));
                filterValues.push(FILTERTYPES[i][1]);
            }

            piemenuBasic(
                this,
                filterLabels,
                filterValues,
                selectedType,
                platformColor.piemenuBasic
            );
        } else if (this.name === "oscillatortype") {
            if (this.value != null) {
                selectedType = this.value;
            } else {
                selectedType = DEFAULTOSCILLATORTYPE;
            }

            const oscLabels = [];
            const oscValues = [];
            for (let i = 0; i < OSCTYPES.length; i++) {
                oscLabels.push(_(OSCTYPES[i][1]));
                oscValues.push(OSCTYPES[i][1]);
            }

            piemenuBasic(this, oscLabels, oscValues, selectedType, platformColor.piemenuBasic);
        } else if (this.name === "voicename") {
            if (this.value != null) {
                selectedVoice = this.value;
            } else {
                selectedVoice = DEFAULTVOICE;
            }

            const voiceLabels = [];
            const voiceValues = [];
            const categories = [];
            const categoriesList = [];
            for (let i = 0; i < VOICENAMES.length; i++) {
                // Skip custom voice in Beginner Mode.
                if (this.activity.beginnerMode && VOICENAMES[i][1] === "custom") {
                    continue;
                }

                const label = _(VOICENAMES[i][1]);
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

            piemenuVoices(this, voiceLabels, voiceValues, categories, selectedVoice);
        } else if (this.name === "noisename") {
            if (this.value != null) {
                selectedNoise = this.value;
            } else {
                selectedNoise = DEFAULTNOISE;
            }

            const noiseLabels = [];
            const noiseValues = [];
            const categories = [];
            const categoriesList = [];
            for (let i = 0; i < NOISENAMES.length; i++) {
                const label = NOISENAMES[i][0];
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

            piemenuVoices(this, noiseLabels, noiseValues, categories, selectedNoise, 90);
        } else if (this.name === "temperamentname") {
            if (this.value != null) {
                selectedTemperament = this.value;
            } else {
                selectedTemperament = DEFAULTTEMPERAMENT;
            }

            const temperamentLabels = [];
            const temperamentValues = [];
            const temperamentsList = getTemperamentsList();
            for (let i = 0; i < temperamentsList.length; i++) {
                // Skip custom temperament in Beginner Mode.
                if (this.activity.beginnerMode && temperamentsList[i][1] === "custom") {
                    continue;
                }

                if (temperamentsList[i][0].length === 0) {
                    temperamentLabels.push(temperamentsList[i][2]);
                } else {
                    temperamentLabels.push(temperamentsList[i][0]);
                }

                temperamentValues.push(temperamentsList[i][1]);
            }

            piemenuBasic(
                this,
                temperamentLabels,
                temperamentValues,
                selectedTemperament,
                platformColor.piemenuBasic
            );
        } else if (this.name === "boolean") {
            if (this.value != null) {
                selectedValue = this.value;
            } else {
                selectedValue = true;
            }

            const booleanLabels = [_("true"), _("false")];
            const booleanValues = [true, false];

            piemenuBoolean(this, booleanLabels, booleanValues, selectedValue);
        } else if (this.name === "grid") {
            selectedValue = this.value;

            let gridLabels = [];
            let gridValues = [];
            if (_THIS_IS_TURTLE_BLOCKS_) {
                gridLabels = [
                    _("Cartesian"),
                    _("polar"),
                    _("Cartesian+polar"),
                    _("none")
                ];
                gridValues = [
                    "Cartesian",
                    "polar",
                    "Cartesian+polar",
                    "none"
                ];
            } else {
                gridLabels = [
                    _("Cartesian"),
                    _("polar"),
                    _("Cartesian+polar"),
                    _("treble"),
                    _("grand staff"),
                    _("mezzo-soprano"),
                    _("alto"),
                    _("tenor"),
                    _("bass"),
                    _("none")
                ];
                gridValues = [
                    "Cartesian",
                    "polar",
                    "Cartesian+polar",
                    "treble",
                    "grand staff",
                    "mezzo-soprano",
                    "alto",
                    "tenor",
                    "bass",
                    "none"
                ];
            }

            piemenuBasic(this, gridLabels, gridValues, selectedValue, platformColor.piemenuBasic);
        } else if (this.name === "outputtools") {
            selectedValue = this.privateData;
            let values;
            let labels;
            if (this.activity.beginnerMode) {
                values = this.protoblock.extraSearchTerms.slice(0, 6);
                labels = this.protoblock.iemenuLabels.slice(0, 6);
            } else {
                values = this.protoblock.extraSearchTerms;
                labels = this.protoblock.piemenuLabels;
            }
            if (values.indexOf(selectedValue) === -1) {
                selectedValue = values[3];  // letter class
            }
            piemenuBasic(this, labels, values, selectedValue, platformColor.piemenuBasic);
        } else if (this.name === "wrapmode") {
            if (this.value != null) {
                selectedWrap = this.value;
            } else {
                selectedWrap = "on";
            }

            const wrapLabels = [];
            const wrapValues = [];

            const WRAPMODES = [
                // .TRANS: on2 should be translated as "on" as in on and off
                [_("on2"), "on"],
                // .TRANS: off should be translated as "off" as in on and off
                [_("off"), "off"]
            ];

            for (let i = 0; i < WRAPMODES.length; i++) {
                wrapLabels.push(_(WRAPMODES[i][1]));
                wrapValues.push(WRAPMODES[i][1]);
            }
            piemenuBasic(this, wrapLabels, wrapValues, selectedWrap);
        } else {
            // If the number block is connected to a pitch block, then
            // use the pie menu for octaves. Other special cases as well.
            const blk = this.blocks.blockList.indexOf(this);
            if (this.blocks.octaveNumber(blk)) {
                piemenuNumber(this, [8, 7, 6, 5, 4, 3, 2, 1], this.value);
            } else if (this.blocks.noteValueNumber(blk, 2)) {
                let cblk = this.connections[0];
                if (cblk !== null) {
                    cblk = this.blocks.blockList[cblk].connections[0];
                    if (
                        cblk !== null &&
                        ["rhythm2", "stuplet"].indexOf(this.blocks.blockList[cblk].name) !== -1
                    ) {
                        piemenuNumber(this, [2, 4, 8, 16], this.value);
                    } else {
                        piemenuNoteValue(this, this.value);
                    }
                } else {
                    piemenuNoteValue(this, this.value);
                }
            } else if (this.blocks.noteValueNumber(blk, 1)) {
                const d = this.blocks.noteValueValue(blk);
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

                piemenuNumber(this, values, this.value);
            } else if (this.blocks.octaveModifierNumber(blk)) {
                piemenuNumber(this, [-2, -1, 0, 1, 2], this.value);
            } else if (this.blocks.intervalModifierNumber(blk)) {
                piemenuNumber(
                    this,
                    this.blocks.blockList[this.blocks.blockList[this.connections[0]].connections[0]]
                        .protoblock.piemenuValuesC1,
                    this.value
                );
            } else if (this._usePieNumberC3()) {
                piemenuNumber(
                    this,
                    this.blocks.blockList[this.connections[0]].protoblock.piemenuValuesC3,
                    this.value
                );
            } else if (this._usePieNumberC2()) {
                piemenuNumber(
                    this,
                    this.blocks.blockList[this.connections[0]].protoblock.piemenuValuesC2,
                    this.value
                );
            } else if (this._usePieNumberC1()) {
                switch (this.blocks.blockList[this.connections[0]].name) {
                    case "setturtlecolor":
                    case "setcolor":
                    case "sethue":
                    case "setshade":
                    case "settranslucency":
                    case "setgrey":
                        piemenuColor(
                            this,
                            this.blocks.blockList[this.connections[0]].protoblock.piemenuValuesC1,
                            this.value,
                            this.blocks.blockList[this.connections[0]].name
                        );
                        break;
                    case "pitchnumber":
                        // eslint-disable-next-line no-case-declarations
                        let temperament;
                        for (let i = 0; i < this.blocks.blockList.length; i++) {
                            if (
                                this.blocks.blockList[i].name === "settemperament" &&
                                this.blocks.blockList[i].connections[0] !== null
                            ) {
                                const index = this.blocks.blockList[i].connections[1];
                                temperament = this.blocks.blockList[index].value;
                            }
                        }

                        if (temperament === undefined) {
                            temperament = "equal";
                        }

                        if (temperament === "equal") {
                            piemenuNumber(
                                this,
                                [-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                                this.value
                            );
                        } else {
                            const pitchNumbers = [];
                            for (let i = 0; i < getTemperament(temperament)["pitchNumber"]; i++) {
                                pitchNumbers.push(i);
                            }
                            piemenuNumber(this, pitchNumbers, this.value);
                        }
                        break;
                    default:
                        piemenuNumber(
                            this,
                            this.blocks.blockList[this.connections[0]].protoblock.piemenuValuesC1,
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

                // set the position of cursor to the end (for number value)
                const valueLength = this.label.value.length;
                const originalType = this.label.type;
                this.label.type = "text";
                this.label.setSelectionRange(valueLength, valueLength);
                this.label.type = originalType;
            }
        }

        // const blk = this.blocks.blockList.indexOf(this);
        if (!this._usePiemenu()) {
            let focused = false;

            const __blur = (event) =>{
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
                // eslint-disable-next-line no-use-before-define
                that.label.removeEventListener("keypress", __keypress);

                if (movedStage) {
                    that.activity.blocksContainer.y = fromY;
                    that.activity.blocksContainer.update();
                }
            };

            const __input = () => {
                that._labelChanged(false, true);
            };

            if (this.name === "text" || this.name === "number") {
                this.label.addEventListener("blur", __blur);
                this.label.addEventListener("input", __input);
            }

            let __keypress = (event) =>{
                if ([13, 10, 9].indexOf(event.keyCode) !== -1) {
                    __blur(event);
                }
            };

            this.label.addEventListener("keypress", __keypress);

            this.label.addEventListener("change", () => {
                that._labelChanged(false, true);
            });

            this.label.style.left =
                Math.round(
                    (x + this.activity.blocksContainer.x) * this.activity.getStageScale()
                        + canvasLeft
                ) + "px";
            this.label.style.top =
                Math.round(
                    (y + this.activity.blocksContainer.y) * this.activity.getStageScale()
                        + canvasTop
                ) + "px";
            this.label.style.width =
                Math.round((selectorWidth * this.blocks.blockScale * this.protoblock.scale) / 2) +
                "px";

            this.label.style.fontSize =
                Math.round((20 * this.blocks.blockScale * this.protoblock.scale) / 2) + "px";
            this.label.style.display = "";
            this.label.focus();
            if (this.labelattr != null) {
                this.labelattr.style.display = "";
            }

            // Firefox fix
            setTimeout(() => {
                that.label.style.display = "";
                that.label.focus();
                focused = true;
            }, 100);
        }
    }

    /**
     * Keypress handler. Handles exit key (Tab and Enter) press.
     * @private
     * @param event - KeyPress event object
     * @returns {void}
     */
    _exitKeyPressed(event) {
        if ([13, 10, 9].indexOf(event.keyCode) !== -1) {
            this._labelChanged(true, false);
            event.preventDefault();
            this.label.removeEventListener("keypress", this._exitKeyPressed);
        }
    }

    /**
     * Check if pie menu is ok to launch.
     * @public
     * @returns {void}
     */
    piemenuOKtoLaunch() {
        if (this._piemenuExitTime === null) {
            return true;
        }

        return new Date().getTime() - this._piemenuExitTime > 200;
    }

    _noteValueNumber(c) {
        // Is this a number block being used as a note value
        // denominator argument?
        const dblk = this.connections[0];
        // Are we connected to a divide block?
        if (
            this.name === "number" &&
            dblk !== null &&
            this.blocks.blockList[dblk].name === "divide"
        ) {
            // Are we the denominator (c == 2) or numerator (c == 1)?
            if (
                this.blocks.blockList[dblk].connections[c] === this.blocks.blockList.indexOf(this)
            ) {
                // Is the divide block connected to a note value block?
                const cblk = this.blocks.blockList[dblk].connections[0];
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
                        case "meter":
                            this._check_meter_block = cblk;
                        // eslint-disable-next-line no-fallthrough
                        case "setbpm2":
                        case "setmasterbpm2":
                        case "stuplet":
                        case "rhythm2":
                        case "newswing2":
                        case "vibrato":
                        case "neighbor":
                        case "neighbor2":
                            return this.blocks.blockList[cblk].connections[2] === dblk;
                        default:
                            return false;
                    }
                }
            }
        }

        return false;
    }

    _noteValueValue() {
        // Return the number block value being used as a note value
        // denominator argument.
        const dblk = this.connections[0];
        // We are connected to a divide block.
        // Is the divide block connected to a note value block?
        let cblk = this.blocks.blockList[dblk].connections[0];
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
                case "meter":
                    this._check_meter_block = cblk;
                // eslint-disable-next-line no-fallthrough
                case "setbpm2":
                case "setmasterbpm2":
                case "stuplet":
                case "rhythm2":
                case "newswing2":
                case "vibrato":
                case "neighbor":
                case "neighbor2":
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
                default:
                    return 1;
            }
        }

        return 1;
    }

    _checkWidgets(closeInput) {
        // Detect if label is changed, then reinit widget windows
        // if they are open.
        const thisBlock = this.blocks.blockList.indexOf(this);
        const topBlock = this.blocks.findTopBlock(thisBlock);
        const widgetTitle = document.getElementsByClassName("wftTitle");
        let lockInit = false;
        if (closeInput === false) {
            for (let i = 0; i < widgetTitle.length; i++) {
                if (lockInit === false) {
                    switch (widgetTitle[i].innerHTML) {
                        case "oscilloscope":
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
                            if (
                                this.blocks.blockList[topBlock].protoblock.staticLabels[0] ==
                                widgetTitle[i].innerHTML
                            ) {
                                this.blocks.reInitWidget(topBlock, 1500);
                            }
                            break;
                    }
                }
            }
        }
    }

    _labelChanged(closeInput, notPieMenu) {
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

        const oldValue = this.value;
        let newValue = this.label.value;

        if (this.labelattr != null) {
            const attrValue = this.labelattr.value;
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
            if (this.name !== "text" || c === null || this.blocks.blockList[c].name !== "storein") {
                return;
            }
        }

        c = this.connections[0];
        if (this.name === "text" && c != null) {
            const cblock = this.blocks.blockList[c];
            let uniqueValue;
            switch (cblock.name) {
                case "action":
                    this.blocks.palettes.removeActionPrototype(oldValue);

                    // Ensure new name is unique.
                    uniqueValue = this.blocks.findUniqueActionName(newValue);
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
                    // In case of custom temperament, rename the entry
                    // in the temperament dictionary. NOTE: only works
                    // if the custom temperament has not been renamed.
                    uniqueValue = this.blocks.findUniqueCustomName(newValue);
                    newValue = uniqueValue;
                    // eslint-disable-next-line no-case-declarations
                    const customTemperament = getTemperament("custom");
                    // eslint-disable-next-line no-case-declarations
                    let modifiedTemperament = false;
                    for (const pitchNumber in customTemperament) {
                        if (pitchNumber !== "pitchNumber") {
                            if (oldValue === customTemperament[pitchNumber][1]) {
                                customTemperament[pitchNumber][1] = newValue;
                                modifiedTemperament = true;
                            }
                        }
                    }
                    if (modifiedTemperament) {
                        addTemperamentToDictionary("custom", customTemperament);
                    }
                    this.value = newValue;
                    // eslint-disable-next-line no-case-declarations
                    let label = this.value.toString();
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
            const cblk1 = this.connections[0];
            let cblk2;

            if (cblk1 !== null) {
                cblk2 = this.blocks.blockList[cblk1].connections[0];
            } else {
                cblk2 = null;
            }

            if (this.value === "-") {
                this.value = -1;
            } else if (
                cblk2 !== null &&
                newValue < 0 &&
                (this.blocks.blockList[cblk1].name === "newnote" ||
                    this.blocks.blockList[cblk2].name == "newnote")
            ) {
                this.label.value = 0;
                this.value = 0;
            } else {
                this.value = Number(newValue);
            }

            if (isNaN(this.value)) {
                const thisBlock = this.blocks.blockList.indexOf(this);
                this.activity.errorMsg(newValue + ": " + _("Not a number"), thisBlock);
                this.activity.refreshCanvas();
                this.value = oldValue;
            }
            
            if(this.blocks.blockList[cblk1].name === "pitch" && (this.value > 10 || this.value < 1)) {
                const thisBlock = this.blocks.blockList.indexOf(this);
                this.activity.errorMsg(_("Octave value must be between 1 and 10."), thisBlock);
                this.activity.refreshCanvas();
                this.label.value = oldValue;
                this.value = oldValue;
            }

            if(String(this.value).length > 10) {
                const thisBlock = this.blocks.blockList.indexOf(this);
                this.activity.errorMsg(_("Numbers can have at most 10 digits."), thisBlock);
                this.activity.refreshCanvas();
                this.label.value = oldValue;
                this.value = oldValue;
            }
        } else {
            this.value = newValue;
        }

        let obj;
        let label;
        let attr;

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
        } else if (this.name === "modename") {
            label = this.value + " " + getModeNumbers(this.value);
        } else {
            label = this.value.toString();
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
                // const foo = getTextWidth(nlabel, "bold 20pt Sans");
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
            const cblock = this.blocks.blockList[c];
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
                    // eslint-disable-next-line no-case-declarations
                    const blockPalette = this.blocks.palettes.dict["action"];
                    for (let blk = 0; blk < blockPalette.protoList.length; blk++) {
                        const block = blockPalette.protoList[blk];
                        if (oldValue === _("action")) {
                            if (block.name === "nameddo" && block.defaults.length === 0) {
                                block.hidden = true;
                            }
                        } else {
                            if (block.name === "nameddo" && block.defaults[0] === oldValue) {
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
                    if (
                        cblock.connections[1] === this.blocks.blockList.indexOf(this) &&
                        closeInput
                    ) {
                        // If the label was the name of a storein, update the
                        // associated box this.blocks and the palette buttons.
                        if (this.value !== "box") {
                            // this.blocks.newStoreinBlock(this.value);
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
                    if (newValue.slice(0, 4) === "http") {
                        this.activity.logo.synth.loadSynth(0, newValue);
                    }
                    break;
                case "temperament1":
                    // eslint-disable-next-line no-case-declarations
                    const temptemperament = getTemperament(oldValue);
                    deleteTemperamentFromList(oldValue);
                    addTemperamentToDictionary(newValue, temptemperament);
                    updateTemperaments();
                    break;
                default:
                    break;
            }
        }

        // We are done changing the label, so unlock.
        this._labelLock = false;

        // Load the synth for the selected drum.
        if (this.name === "drumname") {
            this.activity.logo.synth.loadSynth(0, getDrumSynthName(this.value));
        } else if (this.name === "effectsname") {
            this.activity.logo.synth.loadSynth(0, getDrumSynthName(this.value));
        } else if (this.name === "voicename") {
            this.activity.logo.synth.loadSynth(0, getVoiceSynthName(this.value));
        } else if (this.name === "noisename") {
            this.activity.logo.synth.loadSynth(0, getNoiseSynthName(this.value));
        }
    }
}

/**
 * Set elements to a array; if element is string, then set element's id to element
 * @public
 * @returns {void}
 */
const $ = () => {
    const elements = new Array();

    for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        if (typeof element === "string") {
            element = docById(element);
        }

        if (elements.length === 1) {
            return element;
        }

        elements.push(element);
    }

    return elements;
};

window.hasMouse = false;
// Mousemove is not emulated for touch
document.addEventListener("mousemove", () => {
    window.hasMouse = true;
});
