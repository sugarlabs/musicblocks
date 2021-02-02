/**
 * @file This contains the prototype of the Turtle component.
 * @author Walter Bender
 *
 * @copyright 2014-2020 Walter Bender
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the The GNU Affero General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA.
 */

/**
 * Class pertaining to each turtle.
 *
 * @class
 * @classdesc This is the prototype of the Turtles controller which
 * acts as a bridge between the Turtle model and the Turtle view, and
 * serves as a gateway to any external code.
 *
 * External code instantiates this class, and can access all the members
 * of TurtleView and TurtleModel.
 *
 * This component contains properties and controls for all actions
 * corresponding to a single turtle. Also contains the methods for
 * caching.
 *
 * Private methods' names begin with underscore '_".
 * Unused methods' names begin with double underscore '__'.
 * Internal functions' names are in PascalCase.
 */
class Turtle {
    /**
     * @constructor
     * @param {Number} id - unique ID of Turtle
     * @param {String} name - name of Turtle
     * @param {Object} turtles - Turtles object (common to all turtles)
     * @param {Number} startBlock - start block id
     */
    constructor(id, name, turtles, startBlock) {
        // Import members of model and view (arguments only for model)
        importMembers(this, "", [id, name, turtles, startBlock]);

        this.singer = new Singer(this);     // for music logic
        this.painter = new Painter(this);   // for drawing logic

        this._waitTime = 0;
        this.embeddedGraphicsFinished = true;

        // Widget-related attributes
        this.inSetTimbre = false;

        this._blinkFinished = true;         // whether not blinking or blinking
    }

    /**
     * @returns {Boolean} whether turtle is blinking
     */
    blinking() {
        return !this._blinkFinished;
    }

    /**
     * Sets wait duration of turtle.
     *
     * @param secs
     * @returns {void}
     */
    doWait(secs) {
        this._waitTime = Number(secs) * 1000;
    }

    /**
     * Internal function for creating cache.
     * Includes workaround for a race condition.
     *
     * @private
     */
    _createCache() {
        this.bounds = this.container.getBounds();

        if (this.bounds == null) {
            setTimeout(() => {
                this._createCache();
            }, 200);
        } else {
            this.container.cache(
                this.bounds.x,
                this.bounds.y,
                this.bounds.width,
                this.bounds.height
            );
        }
    }

    /**
     * Internal function for updating cache.
     * Includes workaround for a race condition.
     *
     * @async
     */
    async updateCache() {
        if (this.bounds == null) {
            console.debug("Block container for " + this.name + " not yet ready.");
            await delayExecution(300);
            this.updateCache();
        } else {
            this.container.updateCache();
            this.turtles.refreshCanvas();
        }
    }

    /**
     * Stops blinking of turtle if not already finished.
     * Sets timeout to null and _blinkFinished boolean to true
     * (if they have not been already changed).
     */
    stopBlink() {
        if (this._blinkTimeout != null || !this._blinkFinished) {
            clearTimeout(this._blinkTimeout);
            this._blinkTimeout = null;

            this.container.visible = true;
            this.turtles.refreshCanvas();
            this._blinkFinished = true;
        }
    }

    /**
     * Causes turtle to blink (toggle turtle's visibility) every 100 ms.
     */
    async blink(duration, volume) {
        // suppress blinking when using cursorout and cursorover sensors to prevent multiple triggers.
        if ("CursorOver" + this.id in this.listeners || "CursorOut" + this.id in this.listeners)
            return;

        this._blinkTimeout = null;

        // No time to blink for really short notes. (t = 1 / duration)
        if (duration > 16) {
            return;
        }

        this.stopBlink();
        this._blinkFinished = false;

        this.container.visible = false;
        this.turtles.refreshCanvas();
        this._blinkTimeout = await delayExecution(100);
        this._blinkFinished = true;
        this.container.visible = true;
        this.turtles.refreshCanvas();
    }

    /**
     * Initialises turtle state variables.
     *
     * @param {Boolean} suppressOutput - whether to suppress output
     * @returns {void}
     */
    initTurtle(suppressOutput) {
        this.doWait(0);
        this.endOfClampSignals = {};
        this.butNotThese = {};

        this.embeddedGraphicsFinished = true;

        this.inSetTimbre = false;

        this.painter.cp1x = 0;
        this.painter.cp1y = 100;
        this.painter.cp2x = 100;
        this.painter.cp2y = 100;

        /** @deprecated */ this.singer.attack = [];
        /** @deprecated */ this.singer.decay = [];
        /** @deprecated */ this.singer.sustain = [];
        /** @deprecated */ this.singer.release = [];

        this.singer.scalarTransposition = 0;
        this.singer.scalarTranspositionValues = [];
        this.singer.transposition = 0;
        this.singer.transpositionValues = [];

        this.singer.register = 0;
        this.singer.beatFactor = 1;
        this.singer.dotCount = 0;
        this.singer.noteBeat = {};
        this.singer.noteValue = {};
        this.singer.oscList = {};
        this.singer.noteDrums = {};
        this.singer.notePitches = {};
        this.singer.noteOctaves = {};
        this.singer.noteCents = {};
        this.singer.noteHertz = {};
        this.singer.noteBeatValues = {};
        this.singer.embeddedGraphics = {};
        this.singer.lastNotePlayed = null;
        this.singer.previousNotePlayed = null;
        this.singer.noteStatus = null;
        this.singer.noteDirection = 0;
        this.singer.pitchNumberOffset = 39;
        this.singer.currentOctave = 4;
        this.singer.inHarmonic = [];
        this.singer.partials = [];
        this.singer.inNeighbor = [];
        this.singer.neighborStepPitch = [];
        this.singer.neighborNoteValue = [];
        this.singer.inDefineMode = false;
        this.singer.defineMode = [];

        this.singer.notesPlayed = [0, 1];
        this.singer.whichNoteToCount = 1;
        this.singer.moveable = false;

        this.singer.bpm = [];
        this.singer.previousTurtleTime = 0;
        this.singer.turtleTime = 0;
        this.singer.pushedNote = false;
        this.singer.duplicateFactor = 1;
        this.singer.inDuplicate = false;
        this.singer.skipFactor = 1;
        this.singer.skipIndex = 0;
        this.singer.instrumentNames = ["electronic synth"];
        this.singer.inCrescendo = [];
        this.singer.crescendoDelta = [];
        this.singer.crescendoInitialVolume = { "electronic synth": [DEFAULTVOLUME] };
        this.singer.intervals = [];
        this.singer.semitoneIntervals = [];
        this.singer.staccato = [];
        this.singer.glide = [];
        this.singer.glideOverride = 0;
        this.singer.swing = [];
        this.singer.swingTarget = [];
        this.singer.swingCarryOver = 0;
        this.singer.tie = false;
        this.singer.tieNotePitches = [];
        this.singer.tieNoteExtras = [];
        this.singer.tieCarryOver = 0;
        this.singer.tieFirstDrums = [];
        this.singer.drift = 0;
        this.singer.drumStyle = [];
        this.singer.voices = [];
        this.singer.backward = [];

        this.singer.vibratoIntensity = [];
        this.singer.vibratoRate = [];
        this.singer.distortionAmount = [];
        this.singer.tremoloFrequency = [];
        this.singer.tremoloDepth = [];
        this.singer.rate = [];
        this.singer.octaves = [];
        this.singer.baseFrequency = [];
        this.singer.chorusRate = [];
        this.singer.delayTime = [];
        this.singer.chorusDepth = [];
        this.singer.neighborArgNote1 = [];
        this.singer.neighborArgNote2 = [];
        this.singer.neighborArgBeat = [];
        this.singer.neighborArgCurrentBeat = [];

        this.singer.inNoteBlock = [];
        this.singer.multipleVoices = false;
        this.singer.invertList = [];
        this.singer.beatList = [];
        this.singer.factorList = [];
        this.singer.keySignature = "C " + "major";
        this.singer.pitchDrumTable = {};
        this.singer.defaultStrongBeats = false;

        this.singer.pickup = 0;
        this.singer.beatsPerMeasure = 4;        // default is 4/4 time
        this.singer.noteValuePerBeat = 4;
        this.singer.currentBeat = 0;
        this.singer.currentMeasure = 0;

        this.singer.justCounting = [];
        this.singer.justMeasuring = [];
        this.singer.firstPitch = [];
        this.singer.lastPitch = [];
        this.singer.suppressOutput = suppressOutput;

        this.singer.dispatchFactor = 1;

        this.singer.runningFromEvent = false;

        logo.turtleDicts[turtles.turtleList.indexOf(this)] = [];
    }

    // ================================ CONTROLLER ============================

    /**
     * @returns {Number} waiting delay of Turtle
     */
    get waitTime() {
        return this._waitTime;
    }

    // ================================ MODEL =================================

    /**
     * @returns {Number} unique ID of Turtle
     */
    get id() {
        return this._id;
    }

    /**
     * @returns {String} name of Turtle
     */
    get name() {
        return this._name;
    }

    /**
     * @returns {Object} Turtles object
     */
    get turtles() {
        return this._turtles;
    }

    /**
     * @param {Object} startBlock - start block object associated with Turtle
     */
    set startBlock(startBlock) {
        this._startBlock = startBlock;
    }

    /**
     * @returns {Object} start block object associated with Turtle
     */
    get startBlock() {
        return this._startBlock;
    }

    /**
     * @param {Object[]} queue - queue of blocks executed by this Turtle
     */
    set queue(queue) {
        this._queue = queue;
    }

    /**
     * @returns {Object[]} queue of blocks executed by this Turtle
     */
    get queue() {
        return this._queue;
    }

    /**
     * @param {Object[]} queue
     */
    set parentFlowQueue(queue) {
        this._parentFlowQueue = queue;
    }

    /**
     * @returns {Object[]}
     */
    get parentFlowQueue() {
        return this._parentFlowQueue;
    }

    /**
     * @param {Object[]} queue
     */
    set unhighlightQueue(queue) {
        this._unhighlightQueue = queue;
    }

    /**
     * @returns {Object[]}
     */
    get unhighlightQueue() {
        return this._unhighlightQueue;
    }

    /**
     * @param {Object[]} queue
     */
    set parameterQueue(queue) {
        this._parameterQueue = queue;
    }

    /**
     * @returns {Object[]}
     */
    get parameterQueue() {
        return this._parameterQueue;
    }

    /**
     * @param {Function[]} listeners - list of listeners
     */
    set listeners(listeners) {
        this._listeners = listeners;
    }

    /**
     * @returns {Function[]} list of listeners
     */
    get listeners() {
        return this._listeners;
    }

    /**
     * @param {Object[]} media - text, images
     */
    set media(media) {
        this._media = media;
    }

    /**
     * @returns {Object[]} text, images
     */
    get media() {
        return this._media;
    }

    /**
     * @param {Number} x - x coordinate
     */
    set x(x) {
        this._x = x;
    }

    /**
     * @returns {Number} x coordinate
     */
    get x() {
        return this._x;
    }

    /**
     * @param {Number} y - y coordinate
     */
    set y(y) {
        this._y = y;
    }

    /**
     * @returns {Number} y coordinate
     */
    get y() {
        return this._y;
    }

    /**
     * @param {Boolean} running - whether Turtle is running
     */
    set running(running) {
        this._running = running;
    }

    /**
     * @returns {Boolean} whether Turtle is running
     */
    get running() {
        return this._running;
    }

    /**
     * @param {Boolean} trash - whether Turtle is trashed
     */
    set inTrash(trash) {
        this._trash = trash;
    }

    /**
     * @returns {Boolean} whether Turtle is trashed
     */
    get inTrash() {
        return this._trash;
    }

    // ================================ VIEW ==================================

    /**
     * @returns {Object} createjs object of start block (decoration)
     */
    get decorationBitmap() {
        return this._decorationBitmap;
    }

    /**
     * @param {Object} container - createjs container for Turtle
     * @returns {void}
     */
    set container(container) {
        this._container = container;
    }

    /**
     * @returns {Object} createjs container for Turtle
     */
    get container() {
        return this._container;
    }

    /**
     * @param {Object} bitmap - createjs bitmap object for Turtle
     */
    set bitmap(bitmap) {
        this._bitmap = bitmap;
    }

    /**
     * @returns {Object} createjs bitmap object for Turtle
     */
    get bitmap() {
        return this._bitmap;
    }

    /**
     * @param {Object} imageContainer - createjs container object
     */
    set imageContainer(imageContainer) {
        this._imageContainer = imageContainer;
    }

    /**
     * @returns {Object} createjs container object
     */
    get imageContainer() {
        return this._imageContainer;
    }

    /**
     * @param {Object} penstrokes - createjs bitmap object
     */
    set penstrokes(penstrokes) {
        this._penstrokes = penstrokes;
    }

    /**
     * @returns {Object} createjs bitmap object
     */
    get penstrokes() {
        return this._penstrokes;
    }

    /**
     * @param {Boolean} skinChanged - whether turtle shell has been changed
     */
    set skinChanged(skinChanged) {
        this._skinChanged = skinChanged;
    }

    /**
     * @returns {Boolean} whether turtle shell has been changed
     */
    get skinChanged() {
        return this._skinChanged;
    }

    /**
     * @param {Number} orientation - turtle's orientation (angles)
     */
    set orientation(orientation) {
        this._orientation = orientation;
    }

    /**
     * @returns {Number} Turtle's orientation (angles)
     */
    get orientation() {
        return this._orientation;
    }

    /**
     * @returns {Object} overlay canvas element
     */
    get canvas() {
        return this._canvas;
    }

    /**
     * @returns {Object} overlay canvas context
     */
    get ctx() {
        return this._ctx;
    }
}

/**
 * Class pertaining to Turtle Model.
 *
 * @class
 * @classdesc This is the prototype of the Model for the Turtle component.
 * It should store the data structures that control behavior of the model.
 */
Turtle.TurtleModel = class {
    /**
     * @constructor
     * @param {Number} id - unique ID of Turtle
     * @param {String} name - name of Turtle
     * @param {Object} turtles - Turtles object (common to all turtles)
     */
    constructor(id, name, turtles, startBlock) {
        this._id = id;              // unique ID of turtle
        this._name = name;          // name of the turtle
        this._turtles = turtles;    // object handling behavior of all turtles

        this._startBlock = startBlock;  // Which start block is associated with this turtle?
        this._queue = [];           // Queue of blocks this turtle is executing
        this._parentFlowQueue = [];
        this._unhighlightQueue = [];
        this._parameterQueue = [];

        this._listeners = {};       // Event listeners
        // When we leave a clamp block, we need to dispatch a signal
        this.endOfClampSignals = {};
        // Don't dispatch these signals (when exiting note counter or interval measure)
        this.butNotThese = {};

        // Used to halt runtime during input
        this.delayTimeout = {};
        this.delayParameters = {};

        this._media = [];           // media (text, images) we need to remove on clear

        this._x = 0;    // x coordinate
        this._y = 0;    // y coordinate

        this._running = false;      // is the turtle running?
        this._trash = false;        // in the trash?
    }

    /**
     * Renames start (of corresponding Turtle) block.
     *
     * @param {String} name - name string which is assigned to startBlock
     */
    rename(name) {
        this._name = name;

        const startBlock = this._startBlock;
        // Use the name on the label of the start block
        if (startBlock != null) {
            startBlock.overrideName = this._name;
            startBlock.collapseText.text = this._name;
            startBlock.regenerateArtwork(false);
            startBlock.value = this._turtles.turtleList.indexOf(this);
        }
    }
};

/**
 * Class pertaining to Turtle View.
 *
 * @class
 * @classdesc This is the prototype of the View for the Turtle component.
 * It should make changes to the view, while using members of the Model through Turtle
 * (controller). An action may require updating the state (of the Model), which it can do by
 * calling methods of the Model, also through Turtle (controller).
 */
Turtle.TurtleView = class {
    /**
     * @constructor
     */
    constructor() {
        // createjs object of start block (decoration)
        this._decorationBitmap = null;

        this._container = null;         // createjs container
        this._bitmap = null;            // createjs bitmap
        this._imageContainer = null;
        this._penstrokes = null;

        this._skinChanged = false;      // should we reskin the turtle on clear?
        this._orientation = 0;          // orientation of the turtle sprite

        this._canvas = document.getElementById("overlayCanvas");
        this._ctx = this._canvas.getContext("2d");
    }

    /**
     * Adds an image object to the canvas (shows an image).
     *
     * @param size - size of image
     * @param myImage - image path
     */
    doShowImage(size, myImage) {
        // Is there a JS test for a valid image path?
        if (myImage === null) {
            return;
        }

        const image = new Image();

        image.onload = () => {
            const bitmap = new createjs.Bitmap(image);
            this.imageContainer.addChild(bitmap);
            this._media.push(bitmap);
            bitmap.scaleX = Number(size) / image.width;
            bitmap.scaleY = bitmap.scaleX;
            bitmap.scale = bitmap.scaleX;
            bitmap.x = this.container.x;
            bitmap.y = this.container.y;
            bitmap.regX = image.width / 2;
            bitmap.regY = image.height / 2;
            bitmap.rotation = this.orientation;
            this.turtles.refreshCanvas();
        };

        image.src = myImage;
    }

    /**
     * Adds an image object from a URL to the canvas (shows an image).
     *
     * @param size - size of image
     * @param myImage - URL of image (image address)
     */
    doShowURL(size, myURL) {
        if (myURL === null) {
            return;
        }
        const image = new Image();
        image.src = myURL;
        const turtle = this;

        image.onload = () => {
            const bitmap = new createjs.Bitmap(image);
            turtle.imageContainer.addChild(bitmap);
            turtle._media.push(bitmap);
            bitmap.scaleX = Number(size) / image.width;
            bitmap.scaleY = bitmap.scaleX;
            bitmap.scale = bitmap.scaleX;
            bitmap.x = turtle.container.x;
            bitmap.y = turtle.container.y;
            bitmap.regX = image.width / 2;
            bitmap.regY = image.height / 2;
            bitmap.rotation = turtle.orientation;
            turtle.turtles.refreshCanvas();
        };
    }

    /**
     * Adds an image object to the turtle.
     *
     * @param size - size of image
     * @param myImage - path of image
     */
    doTurtleShell(size, myImage) {
        if (myImage === null) {
            return;
        }

        const shellSize = Number(size);
        const image = new Image();
        image.src = myImage;

        image.onload = () => {
            this.container.removeChild(this._bitmap);
            this._bitmap = new createjs.Bitmap(image);
            this.container.addChild(this._bitmap);
            this._bitmap.scaleX = shellSize / image.width;
            this._bitmap.scaleY = this._bitmap.scaleX;
            this._bitmap.scale = this._bitmap.scaleX;
            this._bitmap.x = 0;
            this._bitmap.y = 0;
            this._bitmap.regX = image.width / 2;
            this._bitmap.regY = image.height / 2;
            this._bitmap.rotation = this.orientation;
            this._skinChanged = true;

            this.container.uncache();
            const bounds = this.container.getBounds();
            this.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);

            // Recalculate the hit area as well
            const hitArea = new createjs.Shape();
            hitArea.graphics.beginFill("#FFF").drawRect(0, 0, bounds.width, bounds.height);
            hitArea.x = -bounds.width / 2;
            hitArea.y = -bounds.height / 2;
            this.container.hitArea = hitArea;

            const startBlock = this._startBlock;
            if (startBlock != null) {
                startBlock.container.removeChild(this._decorationBitmap);
                this._decorationBitmap = new createjs.Bitmap(myImage);
                startBlock.container.addChild(this._decorationBitmap);
                this._decorationBitmap.name = "decoration";

                const width = startBlock.width;
                // FIXME: Why is the position off? Does it need a scale factor?
                this._decorationBitmap.x = width - (30 * startBlock.protoblock.scale) / 2;
                this._decorationBitmap.y = (20 * startBlock.protoblock.scale) / 2;
                this._decorationBitmap.scaleX =
                    ((27.5 / image.width) * startBlock.protoblock.scale) / 2;
                this._decorationBitmap.scaleY =
                    ((27.5 / image.height) * startBlock.protoblock.scale) / 2;
                this._decorationBitmap.scale =
                    ((27.5 / image.width) * startBlock.protoblock.scale) / 2;
                startBlock.updateCache();
            }

            this.turtles.refreshCanvas();
        };
    }

    /**
     * Resizes decoration by width and scale.
     *
     * @param scale - resize decoration by scale
     * @param width - resize decoration by width
     */
    resizeDecoration(scale, width) {
        this._decorationBitmap.x = width - (30 * scale) / 2;
        this._decorationBitmap.y = (35 * scale) / 2;
        this._decorationBitmap.scaleX = this._decorationBitmap.scaleY = this._decorationBitmap.scale =
            (0.5 * scale) / 2;
    }

    /**
     * Adds a text object to the canvas.
     *
     * @param  size - specifies text size
     * @param  myText - string of text to be displayed
     */
    doShowText(size, myText) {
        if (myText === null) {
            return;
        }

        const textList = typeof myText !== "string" ? [myText.toString()] : myText.split("\\n");

        const textSize = size.toString() + "px " + this.painter.font;
        for (i = 0; i < textList.length; i++) {
            const text = new createjs.Text(textList[i], textSize, this.painter.canvasColor);
            text.textAlign = "left";
            text.textBaseline = "alphabetic";
            this.turtles.stage.addChild(text);
            this._media.push(text);
            text.x = this.container.x;
            text.y = this.container.y + i * size;
            text.rotation = this.orientation;

            const xScaled = text.x * this.turtles.scale;
            const yScaled = text.y * this.turtles.scale;
            const sizeScaled = size * this.turtles.scale;
            this.painter.svgOutput +=
                '<text x="' +
                xScaled +
                '" y = "' +
                yScaled +
                '" fill="' +
                this.painter.canvasColor +
                '" font-family = "' +
                this.painter.font +
                '" font-size = "' +
                sizeScaled +
                '">' +
                myText +
                "</text>";

            this.turtles.refreshCanvas();
        }
    }

    /**
     * Async creation of bitmap from SVG data.
     *
     * @param {String} data - SVG data
     * @param {Function} refreshCanvas - callback to refresh canvas
     * @returns {void}
     */
    makeTurtleBitmap(data, refreshCanvas, useTurtleArtwork) {
        // Works with Chrome, Safari, Firefox (untested on IE)
        const img = new Image();

        img.onload = () => {
            const bitmap = new createjs.Bitmap(img);

            this._bitmap = bitmap;
            this._bitmap.regX = 27 | 0;
            this._bitmap.regY = 27 | 0;
            this._bitmap.cursor = "pointer";
            this.container.addChild(this._bitmap);
            this._createCache();

            const startBlock = this._startBlock;
            if (useTurtleArtwork && startBlock != null) {
                startBlock.updateCache();
                this._decorationBitmap = this._bitmap.clone();
                startBlock.container.addChild(this._decorationBitmap);
                this._decorationBitmap.name = "decoration";
                const width = startBlock.width;
                const offset = 40;

                this._decorationBitmap.x = width - (offset * startBlock.protoblock.scale) / 2;
                this._decorationBitmap.y = (35 * startBlock.protoblock.scale) / 2;
                this._decorationBitmap.scaleX = this._decorationBitmap.scaleY = this._decorationBitmap.scale =
                    (0.5 * startBlock.protoblock.scale) / 2;
                startBlock.updateCache();
            }

            refreshCanvas();
        };

        img.src = "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(data)));
    }
};
