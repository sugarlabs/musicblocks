/**
 * @file This contains the prototype of the rhythmruler Widget
 *
 * @copyright 2016-21 Walter Bender
 * @copyright 2016 Hemant Kasat
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/*
   global

   TONEBPM, Singer, _, ManagedTimer, RhythmRulerLayout, RhythmRulerHistory,
   RhythmRulerEditing, RhythmRulerPlayback, RhythmRulerSave, RhythmRulerCircular
*/
/*
    Globals location
    - js/logo.js
        TONEBPM
    - js/turtle-singer.js
        Singer
    - js/utils/utils.js
        _
    - js/utils/ManagedTimer.js
        ManagedTimer
    - js/widgets/RhythmRulerLayout.js, RhythmRulerHistory.js, RhythmRulerEditing.js,
      RhythmRulerPlayback.js, RhythmRulerSave.js, RhythmRulerCircular.js
        RhythmRulerLayout, RhythmRulerHistory, RhythmRulerEditing, RhythmRulerPlayback,
        RhythmRulerSave, RhythmRulerCircular
*/
/* exported RhythmRuler */

/**
 * Represents a RhythmRuler widget for creating rhythms that can be imported into the pitch-time matrix.
 * @abstract
 * @class
 * @memberof global
 * @requires TONEBPM
 * @requires Singer
 * @requires _
 * @requires docById
 * @requires deepClone
 * @requires ManagedTimer
 * @requires delayExecution
 * @requires last
 * @requires nearestBeat
 * @requires rationalToFraction
 * @requires calcNoteValueToDisplay
 * @requires platformColor
 * @requires EIGHTHNOTEWIDTH
 * @requires DRUMNAMES
 * @requires VOICENAMES
 * @requires EFFECTSNAMES
 */
class RhythmRuler {
    /** AMD module dependencies for lazy loading. */
    static dependencies = [
        "widgets/RhythmRulerLayout",
        "widgets/RhythmRulerHistory",
        "widgets/RhythmRulerEditing",
        "widgets/RhythmRulerPlayback",
        "widgets/RhythmRulerSave",
        "widgets/RhythmRulerCircular",
        "widgets/rhythmruler"
    ];

    /**
     * Height of the RhythmRuler widget.
     * @type {number}
     */
    static RULERHEIGHT = 70;

    /**
     * Size of the buttons in the RhythmRuler widget.
     * @type {number}
     */
    static BUTTONSIZE = 51;

    /**
     * Size of the icons in the RhythmRuler widget.
     * @type {number}
     */
    static ICONSIZE = 32;

    /**
     * ASCII code for the DELETE key.
     * @type {number}
     */
    static DEL = 46;

    /**
     * ASCII code for the BACKSPACE key.
     * @type {number}
     */
    static BACK = 8;

    /**
     * Whether installModules has copied the module methods onto the prototype.
     * @type {boolean}
     */
    static _modulesInstalled = false;

    /**
     * Copies the methods of the Rhythm Maker modules (RhythmRulerLayout.js,
     * RhythmRulerHistory.js, RhythmRulerEditing.js, RhythmRulerPlayback.js,
     * RhythmRulerSave.js and RhythmRulerCircular.js) onto RhythmRuler.prototype,
     * keeping their names and property descriptors, so they behave exactly like
     * methods declared in this class and `this` inside them is the widget.
     *
     * RequireJS loads the modules alongside this file in no fixed order, so this
     * runs when the file loads (if the modules are already defined) and again from
     * the constructor, which only runs once every dependency has loaded.
     * @returns {boolean} Whether the methods are installed.
     */
    static installModules() {
        if (RhythmRuler._modulesInstalled) {
            return true;
        }

        const modules = [
            typeof RhythmRulerLayout !== "undefined" ? RhythmRulerLayout : null,
            typeof RhythmRulerHistory !== "undefined" ? RhythmRulerHistory : null,
            typeof RhythmRulerEditing !== "undefined" ? RhythmRulerEditing : null,
            typeof RhythmRulerPlayback !== "undefined" ? RhythmRulerPlayback : null,
            typeof RhythmRulerSave !== "undefined" ? RhythmRulerSave : null,
            typeof RhythmRulerCircular !== "undefined" ? RhythmRulerCircular : null
        ];
        if (modules.includes(null)) {
            return false;
        }

        for (const module of modules) {
            for (const name of Object.getOwnPropertyNames(module.prototype)) {
                if (name !== "constructor") {
                    Object.defineProperty(
                        RhythmRuler.prototype,
                        name,
                        Object.getOwnPropertyDescriptor(module.prototype, name)
                    );
                }
            }
        }

        RhythmRuler._modulesInstalled = true;
        return true;
    }

    /**
     * Creates an instance of RhythmRuler.
     * @constructor
     */
    constructor() {
        RhythmRuler.installModules();

        /**
         * Array containing the drums for the rhythm ruler.
         * @type {Array}
         */
        this.Drums = [];

        /**
         * Array containing the rulers, one per drum, which contain the subdivisions defined by rhythm blocks.
         * @type {Array}
         */
        this.Rulers = [];

        /**
         * Array to save the history of divisions so they can be restored.
         * @type {Array}
         * @private
         */
        this._dissectHistory = [];

        /**
         * Whether the circular (pie) view is active.
         * @type {boolean}
         * @private
         */
        this._circularView = false;

        /**
         * Canvas element for the circular view.
         * @type {HTMLCanvasElement|null}
         * @private
         */
        this._circularCanvas = null;

        /**
         * Handler for circular canvas pointerdown events.
         * @type {function|null}
         * @private
         */
        this._circularPointerDownHandler = null;

        /**
         * Handler for circular canvas pointermove events.
         * @type {function|null}
         * @private
         */
        this._circularPointerMoveHandler = null;

        /**
         * Handler for circular canvas pointerup events.
         * @type {function|null}
         * @private
         */
        this._circularPointerUpHandler = null;

        /**
         * Handler for circular canvas pointercancel and pointerleave events.
         * @type {function|null}
         * @private
         */
        this._circularDragEndHandler = null;

        /**
         * Index of the cell currently highlighted during circular playback.
         * Keyed by ruler index.
         * @type {Object}
         * @private
         */
        this._circularHighlight = {};

        /**
         * Tracks the slice where a mousedown began, used to distinguish
         * single-slice dissect from multi-slice swipe-to-tie.
         * @type {{rulerIndex: number, cellIndex: number}|null}
         * @private
         */
        this._circularDownHit = null;

        /**
         * Tracks the slice the pointer is currently over while dragging,
         * so the soon-to-be-merged slices can be highlighted.
         * @type {{rulerIndex: number, cellIndex: number}|null}
         * @private
         */
        this._circularDragTo = null;

        /**
         * Array representing the list of undo operations.
         * @type {Array}
         * @private
         */
        this._undoList = [];

        /**
         * Flag indicating whether the ruler is currently playing.
         * @type {boolean}
         * @private
         */
        this._playing = false;

        /**
         * Flag indicating whether the ruler is playing a single note.
         * @type {boolean}
         * @private
         */
        this._playingOne = false;

        /**
         * Flag indicating whether the ruler is playing all notes.
         * @type {boolean}
         * @private
         */
        this._playingAll = false;

        /**
         * Counter for the cells in the ruler.
         * @type {number}
         * @private
         */
        this._cellCounter = 0;

        // Keep a elapsed time for each ruler to maintain sync.
        /**
         * Array to store elapsed time for each ruler to maintain synchronization.
         * @type {number[]}
         * @private
         */
        this._elapsedTimes = [];

        // Starting time from which we measure for sync.
        /**
         * Starting time from which synchronization is measured.
         * @type {number | null}
         * @private
         */
        this._startingTime = null;

        /**
         * Array to store offsets for each ruler.
         * @type {number[]}
         * @private
         */
        this._offsets = [];

        /**
         * Index of the currently selected ruler.
         * @type {number}
         * @private
         */
        this._rulerSelected = 0;

        /**
         * Index of the ruler currently playing.
         * @type {number}
         * @private
         */
        this._rulerPlaying = -1;

        /**
         * Flag indicating whether tap mode is active.
         * @type {boolean}
         * @private
         */
        this._tapMode = false;

        /**
         * Array to store tap times.
         * @type {number[]}
         * @private
         */
        this._tapTimes = [];

        /**
         * Index of the cell tapped.
         * @type {number | null}
         * @private
         */
        this._tapCell = null;

        /**
         * Time when tap ended.
         * @type {number | null}
         * @private
         */
        this._tapEndTime = null;

        /**
         * Time when long press started.
         * @type {number | null}
         * @private
         */
        this._longPressStartTime = null;

        /**
         * Flag indicating whether in long press state.
         * @type {boolean}
         * @private
         */
        this._inLongPress = false;

        /**
         * Index of the cell where mouse was pressed.
         * @type {number | null}
         * @private
         */
        this._mouseDownCell = null;

        /**
         * Index of the cell where mouse was released.
         * @type {number | null}
         * @private
         */
        this._mouseUpCell = null;

        /**
         * Reference to the wheel element.
         * @type {HTMLElement | null}
         * @private
         */
        this._wheel = null;

        // Element references
        /**
         * Reference to the dissect number element.
         * @type {HTMLElement | null}
         * @private
         */
        this._dissectNumber = null;

        /**
         * Reference to the progress bar element.
         * @type {HTMLElement | null}
         * @private
         */
        this._progressBar = null;

        /**
         * Array to store references to ruler elements.
         * @type {HTMLElement[]}
         * @private
         */
        this._rulers = [];

        /**
         * Scale factor for fullscreen mode.
         * @type {number}
         * @private
         */
        this._fullscreenScaleFactor = 3;

        /**
         * Tracks timers owned by this widget so they can be cancelled when playback stops
         * or the widget closes.
         * @type {ManagedTimer|null}
         * @private
         */
        this._timerManager = typeof ManagedTimer !== "undefined" ? new ManagedTimer() : null;

        /**
         * Fallback timeout tracking for test/runtime environments where ManagedTimer is unavailable.
         * @type {Set<number>}
         * @private
         */
        this._activeTimeouts = new Set();

        /**
         * Fallback interval tracking for test/runtime environments where ManagedTimer is unavailable.
         * @type {Set<number>}
         * @private
         */
        this._activeIntervals = new Set();

        /**
         * Keyboard event handler for the widget.
         * @type {function | null}
         * @private
         */
        this._keyHandler = null;
    }

    /**
     * Schedules a timeout owned by the widget lifecycle.
     * @private
     * @param {Function} callback - Callback to run after the delay.
     * @param {number} delay - Delay in milliseconds.
     * @returns {number} Timer ID.
     */
    _setWidgetTimeout(callback, delay) {
        if (this._timerManager !== null) {
            return this._timerManager.setTimeout(callback, delay);
        }

        let id;
        id = setTimeout(() => {
            this._activeTimeouts.delete(id);
            callback();
        }, delay);
        this._activeTimeouts.add(id);
        return id;
    }

    /**
     * Clears a timeout owned by the widget lifecycle.
     * @private
     * @param {number} id - Timer ID returned by _setWidgetTimeout.
     * @returns {boolean} Whether the timeout was tracked and cleared.
     */
    _clearWidgetTimeout(id) {
        if (id === null || id === undefined) {
            return false;
        }

        if (this._timerManager !== null && this._timerManager.clearTimeout(id)) {
            return true;
        }

        if (this._activeTimeouts.has(id)) {
            clearTimeout(id);
            this._activeTimeouts.delete(id);
            return true;
        }

        return false;
    }

    /**
     * Schedules an interval owned by the widget lifecycle.
     * @private
     * @param {Function} callback - Callback to run repeatedly.
     * @param {number} interval - Interval in milliseconds.
     * @returns {number} Interval ID.
     */
    _setWidgetInterval(callback, interval) {
        if (this._timerManager !== null) {
            return this._timerManager.setInterval(callback, interval);
        }

        const id = setInterval(callback, interval);
        this._activeIntervals.add(id);
        return id;
    }

    /**
     * Clears an interval owned by the widget lifecycle.
     * @private
     * @param {number} id - Interval ID returned by _setWidgetInterval.
     * @returns {boolean} Whether the interval was tracked and cleared.
     */
    _clearWidgetInterval(id) {
        if (id === null || id === undefined) {
            return false;
        }

        if (this._timerManager !== null && this._timerManager.clearInterval(id)) {
            return true;
        }

        if (this._activeIntervals.has(id)) {
            clearInterval(id);
            this._activeIntervals.delete(id);
            return true;
        }

        return false;
    }

    /**
     * Clears all timers owned by the widget lifecycle.
     * @private
     * @returns {number} Number of tracked timers and intervals cleared.
     */
    _clearWidgetTimers() {
        let count = 0;

        if (this._timerManager !== null) {
            count += this._timerManager.clearAll();
        }

        for (const id of this._activeTimeouts) {
            clearTimeout(id);
            count++;
        }
        this._activeTimeouts.clear();

        for (const id of this._activeIntervals) {
            clearInterval(id);
            count++;
        }
        this._activeIntervals.clear();

        this._longPressBeep = null;
        return count;
    }

    /**
     * Replaces a button/cell's contents with a single header-icon <img>.
     * Centralizes the icon markup shared by the toolbar and per-ruler play buttons.
     * @private
     * @param {HTMLElement} container - Element whose children are replaced with the icon.
     * @param {string} iconFile - Filename under header-icons/ (e.g. "play-button.svg").
     * @param {string} title - Used for both the title attribute and alt text.
     * @param {boolean} [verticalAlign=true] - Whether to set style.verticalAlign = "middle".
     * @returns {HTMLImageElement} The created image element.
     */
    _setButtonIcon(container, iconFile, title, verticalAlign = true) {
        container.replaceChildren();
        const img = document.createElement("img");
        img.src = "header-icons/" + iconFile;
        img.title = title;
        img.alt = title;
        img.height = RhythmRuler.ICONSIZE;
        img.width = RhythmRuler.ICONSIZE;
        if (verticalAlign) {
            img.style.verticalAlign = "middle";
        }
        container.appendChild(img);
        return img;
    }

    /**
     * Resets playback/sync state and ensures at least one (default) drum/ruler
     * exists. Called at the start of init().
     * @private
     * @returns {void}
     */
    _resetPlaybackState() {
        /**
         * Factor used in BPM calculations.
         * @type {number}
         * @private
         */
        this._bpmFactor = (1000 * TONEBPM) / Singer.masterBPM;

        /**
         * Flag indicating whether the widget is currently playing.
         * @type {boolean}
         * @private
         */
        this._playing = false;

        /**
         * Flag indicating whether the widget is playing a single rhythm.
         * @type {boolean}
         * @private
         */
        this._playingOne = false;

        /**
         * Flag indicating whether the widget is playing all rhythms.
         * @type {boolean}
         * @private
         */
        this._playingAll = false;

        /**
         * Index of the ruler currently playing.
         * @type {number}
         * @private
         */
        this._rulerPlaying = -1;

        /**
         * Starting time from which to measure for synchronization.
         * @type {number|null}
         * @private
         */
        this._startingTime = null;

        /**
         * Flag indicating whether the widget is expanded.
         * @type {boolean}
         * @private
         */
        this._expanded = false;

        // init() builds a fresh widget window, so a canvas kept from an
        // earlier run is detached by the time anything draws into it again.
        // Drop it and fall back to the table view, the same pair of resets the
        // close handler performs.
        this._cleanupCircularCanvas();
        this._circularView = false;

        // If there are no drums, add one.
        if (this.Drums.length === 0) {
            this.Drums.push(null);
            this.Rulers.push([[1], []]);
        }

        /**
         * Array to store elapsed times for synchronization.
         * @type {number[]}
         * @private
         */
        this._elapsedTimes = [];

        /**
         * Array to store offsets for synchronization.
         * @type {number[]}
         * @private
         */
        this._offsets = [];
        for (let i = 0; i < this.Rulers.length; i++) {
            this._elapsedTimes.push(0);
            this._offsets.push(0);
        }
        /**
         * Scale factor for the cells.
         * @type {number}
         * @private
         */
        this._cellScale = 1.0;
    }

    /**
     * Initializes the rhythm ruler widget.
     * @param {Activity} activity The activity instance associated with the widget.
     * @returns {void}
     */
    init(activity) {
        /**
         * The activity instance associated with the widget.
         * @type {Activity}
         */
        this.activity = activity;

        this._resetPlaybackState();

        const widgetWindow = this._createWidgetWindow();
        this._buildRulerTable(widgetWindow);
        this._restoreDissectHistory();

        activity.textMsg(_("Click on the ruler to divide it."), 3000);
    }
}
RhythmRuler.installModules();

if (typeof module !== "undefined") {
    module.exports = RhythmRuler;
}
