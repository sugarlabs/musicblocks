// Copyright (c) 2015 Jefferson Lee
// Copyright (c) 2018 Ritwik Abhishek
// Copyright (c) 2018-21 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   docById, platformColor, FIXEDSOLFEGE, FIXEDSOLFEGE1, SHARP, FLAT,
   last, ManagedTimer, Singer, noteToFrequency, i18nSolfege, toFraction,
   DEFAULTVOICE, SOLFEGECONVERSIONTABLE, NOTESSHARP, NOTESFLAT, PITCHES,
   PITCHES2, convertFromSolfege, announceToScreenReader, MusicKeyboardEditing,
   MusicKeyboardRendering, getCurrentEDO, generateNoteNames */
/*
   Global Locations
    - js/utils/utils.js
        _, docById, last, debugLog
    - js/utils/ManagedTimer.js
        ManagedTimer
    - js/turtle-singer.js
        Singer
    - js/utils/musicutils.js
        noteToFrequency, FIXEDSOLFEGE, FIXEDSOLFEGE1, SHARP, FLAT,
        i18nSolfege, toFraction, DEFAULTVOICE, PITCHES, PITCHES2,
        SOLFEGECONVERSIONTABLE, NOTESSHARP, NOTESFLAT, convertFromSolfege,
        getCurrentEDO, generateNoteNames
    - js/utils/platformstyle.js
        platformColor
    - js/widgets/MusicKeyboardEditing.js
        MusicKeyboardEditing
    - js/widgets/MusicKeyboardRendering.js
        MusicKeyboardRendering
*/
/* exported MusicKeyboard */

/** AMD module dependencies for lazy loading. */
MusicKeyboard.dependencies = [
    "widgets/MusicKeyboardEditing",
    "widgets/MusicKeyboardRendering",
    "widgets/musickeyboard"
];

/**
 * Represents a Music Keyboard interface.
 * @constructor
 * @param {Activity} activity - The activity associated with the keyboard.
 */
function MusicKeyboard(activity) {
    const FAKEBLOCKNUMBER = 100000;
    const BUTTONDIVWIDTH = 535; // 5 buttons
    const OUTERWINDOWWIDTH = 758;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    // Mapping between keycodes and virtual keyboard
    const BLACKKEYS = [81, 87, 69, 82, 84, 89, 85, 73, 79, 80];
    const HERTZKEYS = [49, 50, 51, 52, 53, 54, 55, 56, 57, 48];
    const WHITEKEYS = [65, 83, 68, 70, 71, 72, 74, 75, 76];
    const SPACE = 32;
    // Converts a solfege (or letter) note name plus octave into the note
    // name form the synth expects, e.g. "sol" + 4 -> "sol4", "do" + 4 -> "do4",
    // with solfege names that have a FIXEDSOLFEGE1 alias translated first and
    // sharp/flat symbols normalized to "#"/"b".
    const resolveSynthNoteName = (noteName, octave) => {
        if (noteName in FIXEDSOLFEGE1) {
            return FIXEDSOLFEGE1[noteName].replace(SHARP, "#").replace(FLAT, "b") + octave;
        }
        return noteName.replace(SHARP, "#").replace(FLAT, "b") + octave;
    };

    const w = window.innerWidth;
    /**
     * Reference to the activity associated with the keyboard.
     * @type {Activity}
     */
    this.activity = activity;

    /**
     * Scale factor for adjusting the cell size.
     * @type {number}
     */
    this._cellScale = w / 1200;

    /**
     * Indicates whether the keyboard is in beginner mode.
     * @type {boolean}
     */
    const beginnerMode = localStorage.beginnerMode;

    /**
     * Number of units in beginner mode.
     * @type {number}
     */
    const unit = beginnerMode === "true" ? 8 : 16;

    /**
     * Rounds a raw note duration (in seconds) to the nearest beginner-mode
     * eighth or normal-mode sixteenth, then clamps it to a positive,
     * non-zero value.
     * @param {number} rawDuration - The raw duration in seconds.
     * @returns {number} The rounded, clamped duration.
     */
    this._roundNoteDuration = rawDuration => {
        let duration;
        if (beginnerMode === "true") {
            duration = parseFloat((Math.round(rawDuration * 8) / 8).toFixed(3));
        } else {
            duration = parseFloat((Math.round(rawDuration * 16) / 16).toFixed(4));
        }

        if (duration === 0) {
            duration = 0.125;
        } else if (duration < 0) {
            duration = -duration;
        }

        return duration;
    };

    /**
     * Flag to track if stop or close button is clicked.
     * @type {boolean}
     */
    this._stopOrCloseClicked = false;

    this._savedDocumentOnKeyDown = undefined;
    this._savedDocumentOnKeyUp = undefined;
    if (typeof ManagedTimer !== "undefined") {
        this._timerManager = new ManagedTimer();
    } else if (typeof require !== "undefined") {
        try {
            const ManagedTimerCtor = require("../utils/ManagedTimer");
            this._timerManager = new ManagedTimerCtor();
        } catch (e) {
            this._timerManager = null;
        }
    } else {
        this._timerManager = null;
    }
    this._activeIntervals = new Set();
    this._activeTimeouts = new Set();
    this._playOneTimeout = null;
    this._chordTimeouts = [];

    /**
     * Flag indicating whether playback is currently active.
     * @type {boolean}
     */
    this.playingNow = false;

    this._cacheDocumentKeyHandlers = function () {
        if (
            this._savedDocumentOnKeyDown !== undefined ||
            this._savedDocumentOnKeyUp !== undefined
        ) {
            return;
        }

        this._savedDocumentOnKeyDown = document.onkeydown;
        this._savedDocumentOnKeyUp = document.onkeyup;
    };

    this._restoreDocumentKeyHandlers = function () {
        if (
            this._savedDocumentOnKeyDown === undefined &&
            this._savedDocumentOnKeyUp === undefined
        ) {
            return;
        }

        document.onkeydown = this._savedDocumentOnKeyDown;
        document.onkeyup = this._savedDocumentOnKeyUp;
        this._savedDocumentOnKeyDown = undefined;
        this._savedDocumentOnKeyUp = undefined;
    };

    this._setWidgetInterval = function (callback, interval) {
        if (this._timerManager !== null) {
            return this._timerManager.setInterval(callback, interval);
        }
        const id = setInterval(callback, interval);
        this._activeIntervals.add(id);
        return id;
    };

    this._clearWidgetInterval = function (id) {
        if (id === null || id === undefined) {
            return false;
        }

        if (this._timerManager !== null) {
            return this._timerManager.clearInterval(id);
        }

        if (this._activeIntervals.has(id)) {
            clearInterval(id);
            this._activeIntervals.delete(id);
            return true;
        }

        return false;
    };

    this._setWidgetTimeout = function (callback, delay) {
        if (this._timerManager !== null) {
            return this._timerManager.setTimeout(callback, delay);
        }
        const id = setTimeout(() => {
            this._activeTimeouts.delete(id);
            callback();
        }, delay);
        this._activeTimeouts.add(id);
        return id;
    };

    this._clearWidgetTimeout = function (id) {
        if (id === null || id === undefined) {
            return false;
        }

        if (this._timerManager !== null) {
            return this._timerManager.clearTimeout(id);
        }

        if (this._activeTimeouts.has(id)) {
            clearTimeout(id);
            this._activeTimeouts.delete(id);
            return true;
        }

        return false;
    };

    this._clearPlaybackTimers = function () {
        if (this._playOneTimeout) {
            this._clearWidgetTimeout(this._playOneTimeout);
            this._playOneTimeout = null;
        }
        if (Array.isArray(this._chordTimeouts)) {
            for (let i = 0; i < this._chordTimeouts.length; i++) {
                this._clearWidgetTimeout(this._chordTimeouts[i]);
            }
            this._chordTimeouts = [];
        }
    };

    this._clearWidgetTimers = function () {
        this._clearPlaybackTimers();
        if (this._timerManager !== null) {
            return this._timerManager.clearAll();
        }

        for (const id of this._activeIntervals) {
            clearInterval(id);
        }
        this._activeIntervals.clear();

        for (const id of this._activeTimeouts) {
            clearTimeout(id);
        }
        this._activeTimeouts.clear();

        return 0;
    };

    /**
     * Array of instruments.
     * @type {Array}
     */
    this.instruments = [];

    /**
     * Array of note names.
     * @type {Array}
     */
    this.noteNames = [];

    /**
     * Array of octaves.
     * @type {Array}
     */
    this.octaves = [];

    /**
     * Flag indicating if the keyboard is currently shown.
     * @type {boolean}
     */
    this.keyboardShown = true;

    /**
     * Layout information for the keyboard.
     * @type {Array}
     */
    this.layout = [];

    /**
     * Container IDs associated with the keyboard.
     * @type {Array}
     */
    this.idContainer = [];

    /**
     * Flag to track tick status.
     * @type {boolean}
     */
    this.tick = false;

    /** Flag to track if the metronome is on.
     * @type {boolean}
     */
    this.metronomeInterval = null;

    /**
     * Meter arguments.
     * @type {Array}
     */
    this.meterArgs = [4, 1 / 4];

    // Map between keyboard element ids and the note associated with the key.
    /**
     * Mapping between keyboard element IDs and associated notes.
     * @type {Object}
     */
    this.noteMapper = {};

    /**
     * Mapping between block numbers and keyboard elements.
     * @type {Object}
     */
    this.blockNumberMapper = {};

    /**
     * Mapping between instruments and keyboard elements.
     * @type {Object}
     */
    this.instrumentMapper = {};

    /**
     * Mapping between note names with octaves and keyboard element IDs.
     * @type {Object}
     */
    this.noteToKeyMap = {};

    /**
     * Flag to track first note while using metronome.
     * @type {boolean}
     */
    this.firstNote = false;

    // Turn off metronome and release timer/audio resources owned by it.
    this.stopMetronome = () => {
        if (this.tickButton) {
            this.tickButton.style.removeProperty("background");
        }
        if (this.tick && this.loopTick) {
            this.loopTick.stop();
        }
        this.tick = false;
        this.firstNote = false;
        this.metronomeON = false;
        const countdownContainer = docById("countdownContainer");
        if (countdownContainer) {
            countdownContainer.remove();
        }
        if (this.metronomeInterval) {
            this._clearWidgetInterval(this.metronomeInterval);
            this.metronomeInterval = null;
        }
    };

    /**
     * Array of selected notes.
     * @type {Array}
     */
    let selectedNotes = [];

    /**
     * String of active note.
     * @type {Array}
     */
    let activeKey = null;

    /**
     * Array of row blocks.
     * @type {Array}
     */
    this._rowBlocks = [];

    // Each element in the array is [start time, note, id, duration, voice].
    this._notesPlayed = [];

    /**
     * Adds a row block to the keyboard.
     * @param {number} rowBlock - The row block to add.
     */
    this.addRowBlock = rowBlock => {
        // In case there is a repeat block, use a unique block number
        // for each instance.
        while (this._rowBlocks.includes(rowBlock)) {
            rowBlock = rowBlock + 1000000;
        }

        this._rowBlocks.push(rowBlock);
    };

    /**
     * Rebuilds the play button's icon/label to reflect whether playback is
     * currently active.
     * @param {HTMLElement} playButtonCell - The play button element.
     * @param {boolean} isPlaying - Whether playback is currently active.
     */
    this._updatePlayButtonIcon = (playButtonCell, isPlaying) => {
        playButtonCell.replaceChildren(
            document.createTextNode("\u00a0\u00a0"),
            (() => {
                const img = document.createElement("img");
                img.src = isPlaying
                    ? "header-icons/stop-button.svg"
                    : "header-icons/play-button.svg";
                img.title = isPlaying ? _("Stop") : _("Play");
                img.alt = isPlaying ? _("Stop") : _("Play");
                img.height = ICONSIZE;
                img.width = ICONSIZE;
                img.style.verticalAlign = "middle";
                img.style.alignContent = "center";
                return img;
            })(),
            document.createTextNode("\u00a0\u00a0")
        );
    };

    /**
     * Processes the selected notes for playback.
     */
    this.processSelected = () => {
        if (this._notesPlayed.length === 0) {
            selectedNotes = [];
            return;
        }

        // We want to sort the list by startTime.
        this._notesPlayed.sort((a, b) => {
            return a.startTime - b.startTime;
        });

        // selectedNotes is used for playback. Coincident notes are
        // grouped together. It is built from notesPlayed.

        selectedNotes = [
            {
                noteOctave: [this._notesPlayed[0].noteOctave],
                objId: [this._notesPlayed[0].objId],
                duration: [this._notesPlayed[0].duration],
                voice: [this._notesPlayed[0].voice],
                blockNumber: [this._notesPlayed[0].blockNumber],
                startTime: this._notesPlayed[0].startTime
            }
        ];

        let j = 0;

        for (let i = 1; i < this._notesPlayed.length; i++) {
            while (
                i < this._notesPlayed.length &&
                this._notesPlayed[i].startTime === this._notesPlayed[i - 1].startTime
            ) {
                selectedNotes[j].noteOctave.push(this._notesPlayed[i].noteOctave);
                selectedNotes[j].objId.push(this._notesPlayed[i].objId);
                selectedNotes[j].duration.push(this._notesPlayed[i].duration);
                selectedNotes[j].voice.push(this._notesPlayed[i].voice);
                selectedNotes[j].blockNumber.push(this._notesPlayed[i].blockNumber);
                i++;
            }

            j++;
            if (i < this._notesPlayed.length) {
                selectedNotes.push({
                    noteOctave: [this._notesPlayed[i].noteOctave],
                    objId: [this._notesPlayed[i].objId],
                    duration: [this._notesPlayed[i].duration],
                    voice: [this._notesPlayed[i].voice],
                    blockNumber: [this._notesPlayed[i].blockNumber],
                    startTime: this._notesPlayed[i].startTime
                });
            }
        }
    };

    /**
     * Adds keyboard shortcuts for triggering musical notes.
     */
    this.addKeyboardShortcuts = function () {
        let duration = 0;
        const startTime = {};
        const temp1 = {};
        const temp2 = {};
        const current = new Set();
        let chordBuffer = {};
        let extraNoteCount = 0;
        let startTimeNotes = 0;

        const isTextEntryActive = () => {
            const activeElement = document.activeElement;
            return (
                activeElement &&
                (activeElement.tagName === "INPUT" ||
                    activeElement.tagName === "TEXTAREA" ||
                    activeElement.isContentEditable)
            );
        };

        /**
         * Gets the ID of the musical note associated with a keyboard event.
         * @param {KeyboardEvent} event - The keyboard event.
         * @returns {string} The ID of the musical note.
         */
        const __getNoteId = event => {
            let id;
            const key = event.keyCode;

            if (WHITEKEYS.includes(key)) {
                id = `whiteRow${WHITEKEYS.indexOf(key)}`;
            } else if (BLACKKEYS.includes(key)) {
                const i = BLACKKEYS.indexOf(key);
                if ([2, 6, 9, 13, 16, 20].includes(i)) return null;
                id = `blackRow${i}`;
            } else if (HERTZKEYS.includes(key)) {
                id = `hertzRow${HERTZKEYS.indexOf(key)}`;
            } else if (key === SPACE) {
                id = "rest";
            }

            return id;
        };

        /**
         * Handles the start of a musical note when a keyboard key is pressed.
         * @param {KeyboardEvent} event - The keyboard event.
         */
        const __startNote = event => {
            const id = __getNoteId(event);

            const ele = docById(id);
            if (!(id in startTime)) {
                startTime[id] = new Date().getTime();
            }

            if (ele !== null && ele !== undefined) {
                ele.style.backgroundColor = platformColor.orange;
                temp1[id] = ele.getAttribute("alt").split("__")[0];
                if (temp1[id] === "hertz") {
                    temp2[id] = parseInt(ele.getAttribute("alt").split("__")[1], 10);
                } else {
                    temp2[id] = resolveSynthNoteName(
                        temp1[id],
                        ele.getAttribute("alt").split("__")[1]
                    );
                }

                if (id === "rest") {
                    return;
                }

                // Check if it is a chord
                if (Object.keys(chordBuffer).length === 0) {
                    chordBuffer[id] = temp2[id];
                    startTimeNotes = Math.floor(startTime[id] / 100);
                } else if (startTimeNotes === Math.floor(startTime[id] / 100)) {
                    chordBuffer[id] = temp2[id];
                    extraNoteCount++;
                } else {
                    extraNoteCount = 0;
                    chordBuffer = {};
                }

                this.activity.logo.synth.trigger(
                    0,
                    temp2[id],
                    1,
                    this.instrumentMapper[id],
                    null,
                    null
                );

                if (this.tick && this.endTime !== undefined && this.firstNote) {
                    let restDuration = (startTime[id] - this.endTime) / 1000.0;
                    restDuration /= 60; // Convert time to minutes
                    restDuration *= this.bpm;
                    restDuration *= this.meterArgs[1];
                    restDuration = parseFloat((Math.round(restDuration * unit) / unit).toFixed(4));
                    const EPSILON = 0.06;

                    if (restDuration > EPSILON && current.size === 0) {
                        this._notesPlayed.push({
                            startTime: this.endTime,
                            noteOctave: "R",
                            objId: null,
                            duration: parseFloat(restDuration)
                        });
                    }
                }
                this.firstNote = true;
            }
        };

        /**
         * Handles the keyboard key down event to start playing musical notes.
         * @param {KeyboardEvent} event - The keyboard event triggered when a key is pressed down.
         */
        const __keyboarddown = event => {
            if (isTextEntryActive()) return;

            if (event.shiftKey && (event.key === "ArrowUp" || event.code === "ArrowUp")) {
                event.preventDefault();
                this.shiftOctave(1);
                return;
            }
            if (event.shiftKey && (event.key === "ArrowDown" || event.code === "ArrowDown")) {
                event.preventDefault();
                this.shiftOctave(-1);
                return;
            }
            if (current.has(event.keyCode)) return;

            __startNote(event);
            current.add(event.keyCode);
        };

        /**
         * Handles the keyboard key up event to stop playing musical notes.
         * @param {KeyboardEvent} event - The keyboard event triggered when a key is released.
         */
        const __endNote = event => {
            const id = __getNoteId(event);
            const ele = docById(id);
            const newDate = new Date();
            const noteEndTime = newDate.getTime();
            duration = (noteEndTime - startTime[id]) / 1000.0;

            if (ele !== null && ele !== undefined) {
                if (id.includes("blackRow")) {
                    ele.style.backgroundColor = "black";
                } else {
                    ele.style.backgroundColor = "white";
                }

                let processedDuration = duration / 60;
                processedDuration *= this.bpm;
                processedDuration *= this.meterArgs[1];
                processedDuration = parseFloat(
                    (Math.round(processedDuration * unit) / unit).toFixed(4)
                );

                if (processedDuration <= 0) {
                    processedDuration = 1 / unit;
                }

                if (id === "rest") {
                    this._notesPlayed.push({
                        startTime: startTime[id],
                        noteOctave: "R",
                        objId: null,
                        duration: parseFloat(processedDuration)
                    });
                } else {
                    this.activity.logo.synth.stopSound(0, this.instrumentMapper[id], temp2[id]);
                    // Handle Chord
                    if (id in chordBuffer) {
                        Object.entries(chordBuffer).forEach(([id, noteOctave]) => {
                            this._notesPlayed.push({
                                startTime: startTimeNotes * 100,
                                noteOctave: noteOctave,
                                objId: id,
                                duration: processedDuration,
                                voice: this.instrumentMapper[id],
                                blockNumber: this.blockNumberMapper[id]
                            });
                            delete chordBuffer[id];
                        });
                    } else if (extraNoteCount > 0) {
                        extraNoteCount--;
                    }
                    // Handle Single Notes
                    else {
                        this._notesPlayed.push({
                            startTime: startTime[id],
                            noteOctave: temp2[id],
                            objId: id,
                            duration: processedDuration,
                            voice: this.instrumentMapper[id],
                            blockNumber: this.blockNumberMapper[id]
                        });
                        chordBuffer = {};
                    }
                }

                this._createTable();
                this._updateWidgetWindowSize();
                this.endTime = noteEndTime;
                startTimeNotes = 0;
                delete startTime[id];
                delete temp1[id];
                delete temp2[id];
            }
        };

        /**
         * Handles the end of a musical note when a key is released.
         * @param {KeyboardEvent} event - The keyboard event.
         */
        const __keyboardup = function (event) {
            if (isTextEntryActive() && !current.has(event.keyCode)) return;

            current.delete(event.keyCode);
            __endNote(event);
        };

        this._cacheDocumentKeyHandlers();
        document.onkeydown = __keyboarddown;
        document.onkeyup = __keyboardup;
    };

    /**
     * Handles the loading of musical keyboard elements and defines pointer event
     * handlers for each key. Uses the Pointer Events API (pointerdown/pointerup/
     * pointercancel) to support mouse, touch, and stylus input uniformly.
     * @param {HTMLElement} element - The HTML element representing a musical key.
     * @param {number} i - The index of the musical key in the layout.
     * @param {number} blockNumber - The block number associated with the musical key.
     */
    this.loadHandler = function (element, i, blockNumber) {
        const temp1 = this.displayLayout[i].noteName;
        let temp2;
        if (temp1 === "hertz") {
            temp2 = this.displayLayout[i].noteOctave;
        } else {
            temp2 = resolveSynthNoteName(temp1, this.displayLayout[i].noteOctave);
        }

        this.blockNumberMapper[element.id] = blockNumber;
        this.instrumentMapper[element.id] = this.displayLayout[i].voice;
        this.noteMapper[element.id] = temp2;

        let duration = 0;
        let startDate = new Date();
        let startTime = 0;

        /**
         * Start a musical note when the element is pressed (mouse or touch).
         */
        const __startNote = element => {
            startDate = new Date();
            startTime = startDate.getTime(); // Milliseconds();
            element.style.backgroundColor = platformColor.orange;
            this.activity.logo.synth.trigger(
                0,
                this.noteMapper[element.id],
                1,
                this.instrumentMapper[element.id],
                null,
                null
            );
        };

        /**
         * End a musical note when the element is released.
         */
        const __endNote = element => {
            const id = element.id;
            if (id.includes("blackRow")) {
                element.style.backgroundColor = "black";
            } else {
                element.style.backgroundColor = "white";
            }

            const now = new Date();
            duration = now.getTime() - startTime;
            duration /= 1000;
            this.activity.logo.synth.stopSound(
                0,
                this.instrumentMapper[element.id],
                this.noteMapper[element.id]
            );
            duration = this._roundNoteDuration(duration);

            this._notesPlayed.push({
                startTime: startTime,
                noteOctave: this.noteMapper[element.id],
                objId: element.id,
                duration: duration,
                voice: this.instrumentMapper[element.id],
                blockNumber: this.blockNumberMapper[element.id]
            });
            this._createTable();
            this._updateWidgetWindowSize();
        };

        this._addKeyPointerHandlers(element, __startNote, __endNote);
    };

    /**
     * Makes the (rest) key record a rest when it is pressed and released,
     * the same way the spacebar does, with the press length as its duration.
     * @param {HTMLElement} element - The rest key cell.
     */
    this.loadRestHandler = function (element) {
        let startTime = 0;

        const __startRest = element => {
            startTime = new Date().getTime();
            element.style.backgroundColor = platformColor.orange;
        };

        const __endRest = element => {
            element.style.backgroundColor = "white";
            const duration = this._roundNoteDuration((new Date().getTime() - startTime) / 1000);
            this._notesPlayed.push({
                startTime: startTime,
                noteOctave: "R",
                objId: null,
                duration: duration
            });
            this._createTable();
            this._updateWidgetWindowSize();
        };

        this._addKeyPointerHandlers(element, __startRest, __endRest);
    };

    /**
     * Wires pointer handlers onto a keyboard key. Uses Pointer Events so that
     * mouse clicks, touchscreen taps, and stylus presses all behave the same;
     * the legacy onmousedown handler was silently ignored on touch devices.
     * @param {HTMLElement} element - The key cell.
     * @param {Function} onStart - Called with the element when it is pressed.
     * @param {Function} onEnd - Called with the element when it is released.
     */
    this._addKeyPointerHandlers = function (element, onStart, onEnd) {
        // Prevent the browser from scrolling or showing a context menu when the
        // user presses a key on a touch device.
        // Use pan-x instead of none so that the 700 px-wide keyboard can
        // still be scrolled horizontally on narrow mobile viewports by
        // dragging on a key; pinch-zoom is still suppressed.
        element.style.touchAction = "pan-x";

        element.addEventListener("pointerdown", function (e) {
            e.preventDefault(); // prevent ghost mouse events on touch screens
            element.setPointerCapture(e.pointerId); // keep events even if finger slides off
            activeKey = element;
            onStart(element);
        });

        element.addEventListener("pointerup", function () {
            if (activeKey === element) {
                onEnd(element);
                activeKey = null;
            } else if (activeKey !== null) {
                activeKey.dispatchEvent(new Event("pointerup"));
            }
        });

        // Clean up note state if the pointer is cancelled mid-press
        // (e.g., an incoming phone call dismisses the touch).
        element.addEventListener("pointercancel", function () {
            if (activeKey === element) {
                onEnd(element);
                activeKey = null;
            } else if (activeKey !== null) {
                activeKey.dispatchEvent(new Event("pointerup"));
            }
        });
    };

    /**
     * Creates the widget window, computes the layout/BPM needed to populate it,
     * and wires the maximize/close lifecycle handlers.
     */
    this._createWidgetWindow = function () {
        /**
         * Widget window instance for the MusicKeyboard.
         * @type {Window}
         */
        const widgetWindow = window.widgetWindows.windowFor(this, "music keyboard");
        announceToScreenReader(_("Music Keyboard opened"));
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        this.displayLayout = this._keysLayout();
        /**
         * Beats per minute (BPM) for the MusicKeyboard.
         * @type {number}
         */
        const tur = this.activity.turtles.ithTurtle(0);
        this.bpm = tur.singer.bpm.length > 0 ? last(tur.singer.bpm) : Singer.masterBPM;

        /**
         * Event handler for maximizing/minimizing the widget window.
         */
        this.widgetWindow.onmaximize = function () {
            this._updateWidgetWindowSize();
        }.bind(this);

        /**
         * Event handler for closing the widget window.
         */
        widgetWindow.onclose = () => {
            let myNode;
            this._restoreDocumentKeyHandlers();

            if (document.getElementById("keyboardHolder2")) {
                document.getElementById("keyboardHolder2").style.display = "none";
            }

            myNode = document.getElementById("myrow");
            if (myNode !== null) {
                myNode.replaceChildren();
            }

            myNode = document.getElementById("myrow2");
            if (myNode !== null) {
                myNode.replaceChildren();
            }

            // Remove wheel event listeners from keyboard and table
            if (this.keyboardDiv && this._stopPropagationHandler) {
                this.keyboardDiv.removeEventListener("wheel", this._stopPropagationHandler);
                this.keyboardDiv.removeEventListener(
                    "DOMMouseScroll",
                    this._stopPropagationHandler
                );
            }
            if (this.keyTable && this._stopPropagationHandler) {
                this.keyTable.removeEventListener("wheel", this._stopPropagationHandler);
                this.keyTable.removeEventListener("DOMMouseScroll", this._stopPropagationHandler);
            }

            this.stopMetronome();
            this._clearWidgetTimers();

            // Stop any active pointer/keyboard notes
            if (activeKey !== null) {
                activeKey.dispatchEvent(new Event("pointerup"));
            }

            // Release any active synthesizer sounds when closing the widget
            if (this.displayLayout) {
                this.displayLayout.forEach(layoutItem => {
                    if (layoutItem.voice) {
                        this.activity.logo.synth.stopSound(0, layoutItem.voice);
                    }
                });
            }
            this.activity.logo.synth.stopSound(0, DEFAULTVOICE);

            // Stop any in-progress note-sequence playback so the pending
            // setTimeout chain in playOne() does not keep triggering notes
            // after the widget has been destroyed.
            this._stopOrCloseClicked = true;
            this.playingNow = false;

            // Clear any active Web MIDI input handlers to prevent background notes & audio leaks
            if (this.midiAccess && this.midiAccess.inputs) {
                this.midiAccess.inputs.forEach(input => {
                    input.onmidimessage = null;
                });
            }
            this.midiON = false;

            selectedNotes = [];
            const wheelDiv = docById("wheelDivptm");
            if (wheelDiv && wheelDiv.style) {
                wheelDiv.style.display = "none";
            }
            if (this._menuWheel) this._menuWheel.removeWheel();
            if (this._pitchWheel) this._pitchWheel.removeWheel();
            if (this._tabsWheel) this._tabsWheel.removeWheel();
            if (this._exitWheel) this._exitWheel.removeWheel();
            if (this._durationWheel) this._durationWheel.removeWheel();
            if (this._accidentalsWheel) this._accidentalsWheel.removeWheel();
            if (this._octavesWheel) this._octavesWheel.removeWheel();
            announceToScreenReader(_("Music Keyboard closed"));
            widgetWindow.destroy();
        };
    };

    /**
     * Creates the widget window's toolbar buttons (play, save, clear, add note,
     * MIDI, metronome) and wires their click handlers.
     */
    this._createToolbarButtons = function () {
        const widgetWindow = this.widgetWindow;

        /**
         * Button to play all musical notes.
         * @type {HTMLElement}
         */
        this.playButton = widgetWindow.addButton("play-button.svg", ICONSIZE, _("Play"));

        this.playButton.onclick = () => {
            if (this.metronomeInterval || this.metronomeON) {
                this.stopMetronome();
            }
            this.activity.logo.turtleDelay = 0;
            this.processSelected();
            this.playAll();
        };

        /**
         * Button to export musical notes.
         * @type {HTMLElement}
         */
        widgetWindow.addButton("export-chunk.svg", ICONSIZE, _("Save")).onclick = () => {
            this._save();
        };

        /**
         * Button to clear all musical notes.
         * @type {HTMLElement}
         */
        widgetWindow.addButton("erase-button.svg", ICONSIZE, _("Clear")).onclick = () => {
            this._notesPlayed = [];
            selectedNotes = [];
            this._createTable();
            this._updateWidgetWindowSize();
        };

        /**
         * Button to add a musical note.
         * @type {HTMLElement}
         */
        const addNoteButton = widgetWindow.addButton("add2.svg", ICONSIZE, _("Add note"));
        addNoteButton.setAttribute("id", "addnotes");
        addNoteButton.onclick = () => {
            this._createAddRowPieSubmenu();
        };

        /**
         * Button to access MIDI controls.
         * @type {HTMLElement}
         */
        this.midiButton = widgetWindow.addButton("midi.svg", ICONSIZE, _("MIDI"));
        this.midiButton.onclick = () => {
            this.doMIDI();
        };

        /**
         * Button to toggle the metronome.
         * @type {HTMLElement}
         */
        this.tickButton = widgetWindow.addButton("metronome.svg", ICONSIZE, _("Metronome"));

        this.tickButton.onclick = () => {
            if (this.metronomeInterval || this.metronomeON) {
                this.stopMetronome();
            } else {
                // Turn on metronome
                this.metronomeON = true;
                this.tickButton.style.background = platformColor.orange;

                const winBody = document.getElementsByClassName("wfbWidget")[0];
                const countdownContainer = document.createElement("div");
                countdownContainer.id = "countdownContainer";

                const countdownDisplay = document.createElement("div");
                countdownDisplay.id = "countdownDisplay";
                countdownDisplay.textContent = "3";
                countdownContainer.appendChild(countdownDisplay);
                winBody.appendChild(countdownContainer);

                // Start countdown
                let count = 3;
                this.metronomeInterval = this._setWidgetInterval(() => {
                    count--;

                    if (count === 0) {
                        this._clearWidgetInterval(this.metronomeInterval);
                        this.metronomeInterval = null;

                        countdownContainer.remove();

                        if (this.metronomeON) {
                            this.tick = true;
                            this.activity.logo.synth.loadSynth(0, "cow bell");
                            this.loopTick = this.activity.logo.synth.loop(
                                0,
                                "cow bell",
                                "C5",
                                1 / 64,
                                0,
                                this.bpm || 90,
                                0.07
                            );
                        }
                    } else {
                        countdownDisplay.textContent = count;
                    }
                }, 1000);

                // Start audio
                if (this.metronomeON) {
                    this.activity.logo.synth.start();
                }
            }
        };
    };

    /**
     * Creates the keyboard/table container divs, wires their scroll-propagation
     * guards, appends them to the widget body, and renders the initial keyboard
     * and note table.
     */
    this._createKeyboardContainers = function () {
        const widgetWindow = this.widgetWindow;

        // Append keyboard and div on widget windows
        /**
         * Keyboard div for displaying musical notes.
         * @type {HTMLDivElement}
         */
        this.keyboardDiv = document.createElement("div");
        const attr = document.createAttribute("id");
        attr.value = "mkbKeyboardDiv";
        this.keyboardDiv.setAttributeNode(attr);
        /**
         * Table div for the MusicKeyboard.
         * @type {HTMLDivElement}
         */
        this.keyTable = document.createElement("div");

        this._stopPropagationHandler = e => {
            e.stopPropagation();
        };
        this.keyboardDiv.addEventListener("wheel", this._stopPropagationHandler);
        this.keyboardDiv.addEventListener("DOMMouseScroll", this._stopPropagationHandler);
        this.keyTable.addEventListener("wheel", this._stopPropagationHandler);
        this.keyTable.addEventListener("DOMMouseScroll", this._stopPropagationHandler);

        /**
         * Appends keyboard and table divs to the widget window body.
         */
        widgetWindow.getWidgetBody().append(this.keyboardDiv);
        widgetWindow.getWidgetBody().append(this.keyTable);
        widgetWindow.getWidgetBody().style.height = "550px";
        widgetWindow.getWidgetBody().style.width = "1000px";

        this._createKeyboard();

        this._createTable();
    };

    /**
     * Initializes the MusicKeyboard object by setting up the widget window, layout, and event handlers.
     */
    this.init = function () {
        this.tick = false;
        this.playingNow = false;
        let w = window.innerWidth;
        this._cellScale = w / 1200;

        this._createWidgetWindow();
        this._createToolbarButtons();
        this._createKeyboardContainers();

        w = Math.max(
            Math.min(window.innerWidth, this._cellScale * OUTERWINDOWWIDTH - 20),
            BUTTONDIVWIDTH
        );

        this.widgetWindow.sendToCenter();
    };

    /**
     * Plays the selected musical notes.
     * If no notes are selected, the function returns early.
     */
    this.playAll = function () {
        if (selectedNotes.length <= 0) {
            return;
        }

        this.playingNow = !this.playingNow;
        const playButtonCell = this.playButton;

        if (this.playingNow) {
            this._updatePlayButtonIcon(playButtonCell, true);

            if (selectedNotes.length < 1) {
                return;
            }

            const notes = [];
            let ele, zx, res, cell;
            for (let i = 0; i < selectedNotes[0].noteOctave.length; i++) {
                if (this.keyboardShown && selectedNotes[0].objId[0] !== null) {
                    ele = docById(selectedNotes[0].objId[i]);
                    if (ele !== null) {
                        ele.style.backgroundColor = "lightgrey";
                    }
                }

                zx = selectedNotes[0].noteOctave[i];
                res = zx;
                if (typeof zx === "string") {
                    res = zx.replace(SHARP, "#").replace(FLAT, "b");
                }

                notes.push(res);
            }

            if (!this.keyboardShown) {
                cell = docById("cells-0");
                cell.style.backgroundColor = platformColor.selectorBackground;
            }

            this._stopOrCloseClicked = false;
            this._clearPlaybackTimers();

            // Convert durations to seconds based on BPM
            const durationInSeconds = selectedNotes[0].duration.map(
                beatDuration => (beatDuration * 60 * 4) / this.bpm
            );
            this._playChord(notes, durationInSeconds, selectedNotes[0].voice);
            const maxDuration = Math.max(...durationInSeconds);
            this.playOne(1, maxDuration, playButtonCell);
        } else {
            if (!this.keyboardShown) {
                this._createTable();
            } else {
                this._createKeyboard();
            }

            this._stopOrCloseClicked = true;
            this._clearPlaybackTimers();
            this._updatePlayButtonIcon(playButtonCell, false);
        }
    };

    /**
     * Plays a sequence of musical notes recursively with a specified time delay.
     *
     * @param {number} counter - The index of the current note in the sequence.
     * @param {number} time - The time duration of the current note.
     * @param {HTMLElement} playButtonCell - The HTML element representing the play button.
     */
    this.playOne = function (counter, time, playButtonCell) {
        if (this._playOneTimeout) {
            this._clearWidgetTimeout(this._playOneTimeout);
            this._playOneTimeout = null;
        }
        this._playOneTimeout = this._setWidgetTimeout(() => {
            this._playOneTimeout = null;
            let cell, eleid, ele, notes, zx, res, maxDuration;
            if (counter < selectedNotes.length) {
                if (this._stopOrCloseClicked) {
                    return;
                }

                if (!this.keyboardShown) {
                    cell = docById("cells-" + counter);
                    cell.style.backgroundColor = platformColor.selectorBackground;
                }

                if (this.keyboardShown && selectedNotes[counter - 1].objId[0] !== null) {
                    for (let i = 0; i < selectedNotes[counter - 1].noteOctave.length; i++) {
                        eleid = selectedNotes[counter - 1].objId[i];
                        ele = docById(eleid);
                        if (eleid.includes("blackRow")) {
                            ele.style.backgroundColor = "black";
                        } else {
                            ele.style.backgroundColor = "white";
                        }
                    }
                }

                notes = [];
                for (let i = 0; i < selectedNotes[counter].noteOctave.length; i++) {
                    if (this.keyboardShown && selectedNotes[counter].objId[0] !== null) {
                        /*
                        id = this.idContainer.findIndex((ele) => {
                            return ele[1] === selectedNotes[counter].objId[i];
                        });
                        */

                        ele = docById(selectedNotes[counter].objId[i]);
                        if (ele !== null) {
                            ele.style.backgroundColor = "lightgrey";
                        }
                    }

                    zx = selectedNotes[counter].noteOctave[i];
                    res = zx;
                    if (typeof zx === "string") {
                        res = zx.replace(SHARP, "#").replace(FLAT, "b");
                    }
                    notes.push(res);
                }

                if (this.playingNow) {
                    const durationInSeconds = selectedNotes[counter].duration.map(
                        beatDuration => (beatDuration * 60 * 4) / this.bpm
                    );

                    this._playChord(notes, durationInSeconds, selectedNotes[counter].voice);
                }

                maxDuration = Math.max(
                    ...selectedNotes[counter].duration.map(
                        beatDuration => (beatDuration * 60 * 4) / this.bpm
                    )
                );

                this.playOne(counter + 1, maxDuration, playButtonCell);
            } else {
                this._updatePlayButtonIcon(playButtonCell, false);
                this.playingNow = false;
                if (!this.keyboardShown) {
                    this._createTable();
                } else {
                    this._createKeyboard();
                }
                this._updateWidgetWindowSize();
            }
        }, time * 1000);
    };

    /**
     * Plays a chord (multiple notes simultaneously) using a synthesizer.
     *
     * @param {string[]} notes - Array of note names to be played as a chord.
     * @param {number[]} noteValue - Array of note values (durations) for each note in the chord.
     * @param {string[]} instruments - Array of instrument names or identifiers for each note.
     */
    this._playChord = (notes, noteValue, instruments) => {
        if (notes[0] === "R") {
            return;
        }

        for (let i = 0; i < notes.length; i++) {
            const id = this._setWidgetTimeout(() => {
                this.activity.logo.synth.trigger(
                    0,
                    notes[i],
                    noteValue[0],
                    instruments[i],
                    null,
                    null
                );
            }, 1);
            if (id) {
                this._chordTimeouts.push(id);
            }
        }
    };

    /**
     * Fills chromatic gaps in a given list of notes by padding with missing notes.
     *
     * @param {Object[]} noteList - List of notes represented as dictionaries containing `noteName` and `noteOctave`.
     * @returns {Object[]} A new list of notes with chromatic gaps filled.
     */
    function fillChromaticGaps(noteList) {
        // Assuming list of either solfege or letter class of the form
        // sol4 or G4.  Each entry is a dictionary with noteName and
        // noteOctave.

        const newList = [];
        // Anything we don't recognize gets added to the end.
        const hertzList = [];
        const drumList = [];
        let obj = null;
        let fakeBlockNumber = FAKEBLOCKNUMBER + 1;

        // Find the first non-Hertz note.
        for (let i = 0; i < noteList.length; i++) {
            if (noteList[i].noteName === "drum") {
                drumList.push(noteList[i]);
            } else if (noteList[i].noteName === "hertz") {
                hertzList.push(noteList[i]);
            } else {
                obj = [noteList[0].noteName, noteList[0].noteOctave];
                break;
            }
        }

        // Only Hertz, so nothing to do.
        if (obj === null) {
            return noteList;
        }

        obj[0] = convertFromSolfege(obj[0]);
        let j = 0;
        if (obj[0] !== "C") {
            // Pad the left side.
            for (let i = 0; i < PITCHES2.length; i++) {
                const isFirstNote = PITCHES2[i] === obj[0] || PITCHES[i] === obj[0];
                newList.push({
                    noteName: isFirstNote ? obj[0] : PITCHES2[i],
                    noteOctave: obj[1],
                    blockNumber: noteList[0].blockNumber,
                    voice: noteList[0].voice
                });
                j = i;
                if (isFirstNote) break;
                newList[i].blockNumber = fakeBlockNumber;
                fakeBlockNumber += 1;
            }
        } else {
            newList.push({
                noteName: obj[0],
                noteOctave: obj[1],
                blockNumber: noteList[0].blockNumber,
                voice: noteList[0].voice
            });
        }

        // Fill in any gaps
        let lastOctave = obj[1];
        let thisOctave;
        // Seed the voice from the first note, the same way the left-hand
        // padding above does. The loop below is what normally keeps this up to
        // date, but it starts at index 1, so with a single-note keyboard it
        // never runs and the padding added after the last note would otherwise
        // be left without a voice.
        let lastVoice = noteList[0].voice;
        for (let i = 1; i < noteList.length; i++) {
            if (noteList[i].noteName === "drum") {
                drumList.push(noteList[i]);
            } else if (noteList[i].noteName === "hertz") {
                hertzList.push(noteList[i]);
            } else {
                obj = [noteList[i].noteName, noteList[i].noteOctave];
                thisOctave = obj[1];
                lastVoice = noteList[i].voice;
                obj[0] = convertFromSolfege(obj[0]);
                let k = PITCHES.indexOf(obj[0]);
                if (k === -1) {
                    k = PITCHES2.indexOf(obj[0]);
                }
                if (thisOctave > lastOctave) {
                    k += 12 * (thisOctave - lastOctave);
                }

                if (k !== (j + 1) % 12) {
                    // Fill in the gaps
                    j = j % 12;
                    for (let l = j + 1; l < k; l++) {
                        if (l % 12 === 0) {
                            lastOctave += 1;
                        }
                        newList.push({
                            noteName: PITCHES2[l % 12],
                            noteOctave: lastOctave,
                            blockNumber: fakeBlockNumber,
                            voice: lastVoice
                        });
                        fakeBlockNumber += 1;
                    }
                }
                newList.push({
                    noteName: obj[0],
                    noteOctave: obj[1],
                    blockNumber: noteList[i].blockNumber,
                    voice: noteList[i].voice
                });
                lastOctave = thisOctave;
                j = k;
            }
        }

        // Pad out the end of the list.
        if (obj[0] !== "C") {
            let k = PITCHES.indexOf(obj[0]);
            if (k === -1) {
                k = PITCHES2.indexOf(obj[0]);
            }
            for (let i = (k + 1) % 12; i < PITCHES2.length; i++) {
                if (i === 0) break;
                newList.push({
                    noteName: PITCHES2[i],
                    noteOctave: obj[1],
                    blockNumber: fakeBlockNumber,
                    voice: lastVoice
                });
                fakeBlockNumber += 1;
            }
            obj[1] += 1;
            newList.push({
                noteName: "C",
                noteOctave: obj[1],
                blockNumber: fakeBlockNumber,
                voice: lastVoice
            });
            fakeBlockNumber += 1;
        }

        for (let i = 0; i < hertzList.length; i++) {
            newList.push(hertzList[i]);
        }

        for (let i = 0; i < drumList.length; i++) {
            newList.push(drumList[i]);
        }

        return newList;
    }

    /**
     * Generates a sorted and filtered layout of keys based on note information.
     *
     * @returns {Object[]} An array of objects representing the layout of keys:
     * [
     *   {
     *     noteName: string,
     *     noteOctave: number,
     *     blockNumber: number,
     *     voice: string
     *   },
     *   ...
     * ]
     */
    this._keysLayout = function () {
        this.layout = [];
        const sortableList = [];
        for (let i = 0; i < this.noteNames.length; i++) {
            if (this.noteNames[i] === "drum") {
                sortableList.push({
                    frequency: 1000000 + sortableList.length, // for sorting purposes
                    noteName: this.noteNames[i],
                    noteOctave: this.octaves[i],
                    blockNumber: this._rowBlocks[i],
                    voice: this.instruments[i]
                });
            } else if (this.noteNames[i] === "hertz") {
                sortableList.push({
                    frequency: this.octaves[i],
                    noteName: this.noteNames[i],
                    noteOctave: this.octaves[i],
                    blockNumber: this._rowBlocks[i],
                    voice: this.instruments[i]
                });
            } else {
                sortableList.push({
                    frequency: noteToFrequency(
                        convertFromSolfege(this.noteNames[i]) + this.octaves[i],
                        this.activity.turtles.ithTurtle(0).singer.keySignature
                    ),
                    noteName: this.noteNames[i],
                    noteOctave: this.octaves[i],
                    blockNumber: this._rowBlocks[i],
                    voice: this.instruments[i]
                });
            }
        }

        let sortedList = sortableList.sort(function (a, b) {
            if (a.frequency === b.frequency) {
                return a.blockNumber - b.blockNumber;
            }
            return a.frequency - b.frequency;
        });

        // Use Set for O(1) lookup instead of Array.includes() O(n)
        const unique = new Set();
        this.remove = [];

        sortedList = sortedList.filter(item => {
            const key = item.noteName + item.noteOctave;
            if (!unique.has(key)) {
                unique.add(key);
                return true;
            } else if (item.noteName === "drum") {
                unique.add(key);
                return true;
            }

            if (
                item.blockNumber !== undefined &&
                item.blockNumber !== null &&
                this.activity &&
                this.activity.blocks &&
                this.activity.blocks.blockList &&
                this.activity.blocks.blockList[item.blockNumber]
            ) {
                this.remove.push(item.blockNumber);
            }
            return false;
        });

        function removeBlock(that, i) {
            that._setWidgetTimeout(() => {
                that._removePitchBlock(that.remove[i]);
            }, 200);
        }

        for (let i = 0; i < this.remove.length; i++) {
            removeBlock(this, i);
        }

        const sortedHertzList = sortedList.filter(note => note.noteName === "hertz");
        const sortedNotesList = sortedList.filter(note => note.noteName !== "hertz");
        sortedList = sortedNotesList.concat(sortedHertzList);
        let newList = fillChromaticGaps(sortedNotesList);
        newList = newList.concat(sortedHertzList);

        const originalNotesMap = {};
        for (const note of sortedList) {
            const alphaName = convertFromSolfege(note.noteName);
            originalNotesMap[alphaName + note.noteOctave] = note;
        }

        for (let i = 0; i < newList.length; i++) {
            const key = newList[i].noteName + newList[i].noteOctave;
            if (originalNotesMap[key]) {
                newList[i].blockNumber = originalNotesMap[key].blockNumber;
                this.layout.push({
                    noteName: originalNotesMap[key].noteName,
                    noteOctave: originalNotesMap[key].noteOctave,
                    blockNumber: originalNotesMap[key].blockNumber,
                    voice: originalNotesMap[key].voice
                });
            } else {
                this.layout.push({
                    noteName: newList[i].noteName,
                    noteOctave: newList[i].noteOctave,
                    blockNumber: newList[i].blockNumber,
                    voice: newList[i].voice
                });
            }
        }

        return newList;
    };

    // Drawing lives in MusicKeyboardRendering.js: the piano keys, the note
    // table under them, and sizing the widget window around both.
    MusicKeyboardRendering.install.call(this, {
        FAKEBLOCKNUMBER,
        BLACKKEYS,
        WHITEKEYS,
        HERTZKEYS,
        resolveSynthNoteName,
        w,
        getSelectedNotes: () => selectedNotes
    });

    // Note editing lives in MusicKeyboardEditing.js: the pie menus, adding and
    // removing rows and columns, and keeping the layout in step with the blocks.
    MusicKeyboardEditing.install.call(this, {
        FAKEBLOCKNUMBER,
        beginnerMode,
        resolveSynthNoteName,
        fillChromaticGaps
    });

    this._save = function () {
        this.processSelected();

        // This function organizes notes into groups with same voices.
        // We need to cluster adjacent notes with same voice to wrap
        // "settimbre" block .  eg, piano-do piano-re piano-mi
        // guitar-fa piano-sol piano-la piano-ti --> piano-[do re mi]
        // guitar-fa piano-[la ti]
        /**
         * Process the selected notes and organize them into groups based on voice similarity.
         * Adjacent notes with the same voice are clustered together to facilitate wrapping in "settimbre" block.
         * For example, notes like piano-do piano-re piano-mi guitar-fa piano-sol piano-la piano-ti
         * will be organized into clusters such as piano-[do re mi], guitar-fa, and piano-[sol la ti].
         *
         * @param {Array<Object>} selectedNotes - Array of selected notes to be processed.
         * @returns {Array<Array<number>>} - Array of arrays containing indices of selected notes grouped by voice.
         */
        this._clusterNotes = selectedNotes => {
            let i = 0;
            const newNotes = [];
            let prevNote = DEFAULTVOICE;
            while (i < selectedNotes.length) {
                if (i === 0) {
                    newNotes.push([i]);
                    if (selectedNotes[i].noteOctave[0] !== "drumnull") {
                        prevNote = selectedNotes[i].voice[0];
                    }
                } else if (selectedNotes[i].noteOctave[0] === "drumnull") {
                    // Don't trigger a new group with a drum block.
                    newNotes[newNotes.length - 1].push(i);
                } else if (selectedNotes[i].noteOctave[0] === "R") {
                    // Don't trigger a new group with a rest
                    newNotes[newNotes.length - 1].push(i);
                } else if (selectedNotes[i].voice[0] !== prevNote) {
                    newNotes.push([i]);
                    prevNote = selectedNotes[i].voice[0];
                } else {
                    newNotes[newNotes.length - 1].push(i);
                    prevNote = selectedNotes[i].voice[0];
                }
                i++;
            }
            return newNotes;
        };

        // Find the position of next setTimbre block
        /**
         * Calculate the required length of the next "setTimbre" block based on selected notes.
         * This function computes the length of the next "setTimbre" block by considering the types and properties of the selected notes.
         *
         * @param {Array<Array<number>>} selectedNotesGrp - Groups of selected notes (indices) organized by voice similarity.
         * @param {Array<Object>} selectedNotes - Array of selected notes.
         * @returns {number} - Required length for the next "setTimbre" block.
         */
        this.findLen = (selectedNotesGrp, selectedNotes) => {
            let ans = 0;
            for (let i = 0; i < selectedNotesGrp.length; i++) {
                const note = selectedNotes[selectedNotesGrp[i]];
                if (note.noteOctave[0] === "R") {
                    ans += 6; // rest note uses 6
                } else if (note.noteOctave[0] === "drumnull") {
                    ans += 7; // drum note uses 7
                } else {
                    ans += 5 + 3 * note.noteOctave.length; // notes with pitches
                }
            }
            return ans;
        };
        const actionGroupInterval = 50;
        const actionGroups = parseInt(selectedNotes.length / actionGroupInterval, 10) + 1;

        for (let actionGroup = 0; actionGroup < actionGroups; actionGroup++) {
            const currentSelectedNotes = selectedNotes.slice(
                actionGroup * actionGroupInterval,
                (actionGroup + 1) * actionGroupInterval
            );

            const newNotes = this._clusterNotes(currentSelectedNotes);
            const newStack = [
                [0, ["action", { collapsed: false }], 100, 100, [null, 1, 2, null]],
                [1, ["text", { value: _("action") + "" + actionGroup }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, selectedNotes.length === 0 ? null : 3]]
            ];

            // Add BPM
            newStack.push(
                [3, "setmasterbpm2", 0, 0, [2, 4, 5, 8]],
                [4, ["number", { value: this.bpm }], 0, 0, [3]],
                [5, "divide", 0, 0, [3, 6, 7]],
                [6, ["number", { value: 1 }], 0, 0, [5]],
                [7, ["number", { value: 4 }], 0, 0, [5]],
                [8, "vspace", 0, 0, [3, 9]]
            );

            let prevId = 8;
            let endOfStackIdx, id;

            for (let noteGrp = 0; noteGrp < newNotes.length; noteGrp++) {
                const selectedNotesGrp = newNotes[noteGrp];
                const isLast = noteGrp === newNotes.length - 1;
                id = newStack.length;
                let voice = selectedNotes[selectedNotesGrp[0]].voice[0] || DEFAULTVOICE;
                // Don't use a drum name with set timbre.
                if (selectedNotes[selectedNotesGrp[0]].noteOctave[0] === "drumnull") {
                    voice = DEFAULTVOICE;
                }
                const next = isLast ? null : id + 3 + this.findLen(selectedNotesGrp, selectedNotes);

                newStack.push(
                    [id, "settimbre", 0, 0, [prevId, id + 1, id + 3, id + 2]],
                    [id + 1, ["voicename", { value: voice }], 0, 0, [id]],
                    [id + 2, "hidden", 0, 0, [id, next]]
                );

                prevId = id + 2;
                endOfStackIdx = id;

                for (let i = 0; i < selectedNotesGrp.length; i++) {
                    const note = selectedNotes[selectedNotesGrp[i]];

                    // Add the Note block and its value
                    const idx = newStack.length;
                    newStack.push([idx, "newnote", 0, 0, [endOfStackIdx, idx + 2, idx + 1, null]]);
                    const n = newStack[idx][4].length;
                    if (i === 0) {
                        // the action block
                        newStack[endOfStackIdx][4][n - 2] = idx;
                    } else {
                        // the previous note block
                        newStack[endOfStackIdx][4][n - 1] = idx;
                    }

                    endOfStackIdx = idx;

                    const delta = 5;

                    // Add a vspace to prevent divide block from obscuring the pitch block.
                    newStack.push([idx + 1, "vspace", 0, 0, [idx, idx + delta]]);

                    // note value is saved as a fraction
                    newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
                    const maxWidth = Math.max.apply(Math, note.duration);

                    const obj = toFraction(maxWidth);
                    newStack.push([idx + 3, ["number", { value: obj[0] }], 0, 0, [idx + 2]]);
                    newStack.push([idx + 4, ["number", { value: obj[1] }], 0, 0, [idx + 2]]);

                    let thisBlock = idx + delta;

                    // We need to point to the previous note or pitch block.
                    let previousBlock = idx + 1; // Note block

                    // The last connection in last pitch block is null.
                    const lastConnection = null;

                    if (note.noteOctave[0] === "R") {
                        newStack.push([
                            thisBlock + 1,
                            "rest2",
                            0,
                            0,
                            [previousBlock, lastConnection]
                        ]);
                    } else if (note.noteOctave[0] === "drumnull") {
                        newStack.push([
                            thisBlock,
                            "playdrum",
                            0,
                            0,
                            [previousBlock, thisBlock + 1, lastConnection]
                        ]);
                        newStack.push([
                            thisBlock + 1,
                            [
                                "drumname",
                                {
                                    value: note.voice[0]
                                }
                            ],
                            0,
                            0,
                            [thisBlock]
                        ]);
                    } else {
                        for (let j = 0; j < note.noteOctave.length; j++) {
                            if (j > 0) {
                                if (typeof note.noteOctave[j - 1] === "string") {
                                    thisBlock = previousBlock + 3;
                                } else {
                                    thisBlock = previousBlock + 2;
                                }
                                const n = newStack[previousBlock][4].length;
                                newStack[previousBlock][4][n - 1] = thisBlock;
                            }
                            if (typeof note.noteOctave[j] === "string") {
                                newStack.push([
                                    thisBlock,
                                    "pitch",
                                    0,
                                    0,
                                    [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]
                                ]);
                                if (["#", "b", "♯", "♭"].includes(note.noteOctave[j][1])) {
                                    newStack.push([
                                        thisBlock + 1,
                                        [
                                            "solfege",
                                            {
                                                value:
                                                    SOLFEGECONVERSIONTABLE[note.noteOctave[j][0]] +
                                                    note.noteOctave[j][1]
                                            }
                                        ],
                                        0,
                                        0,
                                        [thisBlock]
                                    ]);
                                    newStack.push([
                                        thisBlock + 2,
                                        [
                                            "number",
                                            {
                                                value: note.noteOctave[j][
                                                    note.noteOctave[j].length - 1
                                                ]
                                            }
                                        ],
                                        0,
                                        0,
                                        [thisBlock]
                                    ]);
                                } else {
                                    newStack.push([
                                        thisBlock + 1,
                                        [
                                            "solfege",
                                            {
                                                value: SOLFEGECONVERSIONTABLE[note.noteOctave[j][0]]
                                            }
                                        ],
                                        0,
                                        0,
                                        [thisBlock]
                                    ]);
                                    newStack.push([
                                        thisBlock + 2,
                                        [
                                            "number",
                                            {
                                                value: note.noteOctave[j][
                                                    note.noteOctave[j].length - 1
                                                ]
                                            }
                                        ],
                                        0,
                                        0,
                                        [thisBlock]
                                    ]);
                                }
                            } else {
                                newStack.push([
                                    thisBlock,
                                    "hertz",
                                    0,
                                    0,
                                    [previousBlock, thisBlock + 1, lastConnection]
                                ]);
                                newStack.push([
                                    thisBlock + 1,
                                    ["number", { value: note.noteOctave[j] }],
                                    0,
                                    0,
                                    [thisBlock]
                                ]);
                            }
                            previousBlock = thisBlock;
                        }
                    }
                }
            }
            this.activity.blocks.loadNewBlocks(newStack);
        }

        if (actionGroups > 1) activity.textMsg(_("New action blocks generated."), 3000);
        else activity.textMsg(_("New action block generated."), 3000);
    };

    /**
     * Clears the note names and octaves arrays.
     * @memberof MusicKeyboard
     */
    this.clearBlocks = function () {
        this.noteNames = [];
        this.octaves = [];
    };

    /**
     * Initiates MIDI functionality, allowing notes to be triggered by user interaction.
     * @memberof MusicKeyboard
     */
    this.doMIDI = () => {
        let duration = 0;
        let startTime = 0;

        this.noteToKeyMap = {};

        for (let idx = 0; idx < this.layout.length; idx++) {
            const key = this.layout[idx];
            if (key) {
                this.noteToKeyMap[key.noteName.toString() + key.noteOctave.toString()] = key.objId;
                if (FIXEDSOLFEGE1 && FIXEDSOLFEGE1[key.noteName.toString()]) {
                    this.noteToKeyMap[
                        FIXEDSOLFEGE1[key.noteName.toString()] + "" + key.noteOctave
                    ] = key.objId; //convet solfege to alphabetic.
                }
            }
        }

        /**
         * Handler for starting a note on MIDI interaction.
         * @param {MouseEvent} event - The mouse event triggering the note start.
         * @param {HTMLElement} element - The HTML element representing the note.
         */
        const __startNote = (event, element) => {
            if (!element) return;
            startTime = event.timeStamp; // Milliseconds();
            element.style.backgroundColor = platformColor.orange;
            this.activity.logo.synth.trigger(
                0,
                this.noteMapper[element.id],
                1,
                this.instrumentMapper[element.id],
                null,
                null
            );
        };

        /**
         * Handler for ending a note on MIDI interaction.
         * @param {MouseEvent} event - The mouse event triggering the note end.
         * @param {HTMLElement} element - The HTML element representing the note.
         */
        const __endNote = (event, element) => {
            if (!element) return;

            const id = element.id;
            if (id.includes("blackRow")) {
                element.style.backgroundColor = "black";
            } else {
                element.style.backgroundColor = "white";
            }

            const now = event.timeStamp;
            duration = now - startTime;
            duration /= 1000;
            this.activity.logo.synth.stopSound(
                0,
                this.instrumentMapper[element.id],
                this.noteMapper[element.id]
            );
            duration = this._roundNoteDuration(duration);

            this._notesPlayed.push({
                startTime: startTime,
                noteOctave: this.noteMapper[element.id],
                objId: element.id,
                duration: duration,
                voice: this.instrumentMapper[element.id],
                blockNumber: this.blockNumberMapper[element.id]
            });
            this._createTable();
        };

        /**
         * Converts a MIDI note number to a pitch and octave.
         * @param {number} num - The MIDI note number.
         * @returns {Array<string>} An array containing two possible pitch names and the octave.
         * @memberof MusicKeyboard
         */
        const numberToPitch = num => {
            const offset = 4;
            const currentEDO = getCurrentEDO(this.activity.logo.synth.inTemperament);
            const octave = offset + Math.floor((num - 60) / currentEDO);
            const noteNames = generateNoteNames(currentEDO);
            const pitch1 = noteNames[num % currentEDO];
            return [pitch1, pitch1, octave];
        };

        //event attributes : timeStamp , data
        //data : length -3 [0] : 144/128 : noteOn/NoteOff
        //                 [1] : noteNumber : middle C always 60
        //                 [2] : velocity ,(currently not used).

        /**
         * Handles MIDI messages, triggering note start or end events based on the MIDI data.
         * @param {MIDIMessageEvent} event - The MIDI message event containing note information.
         * @memberof MusicKeyboard
         */
        const onMIDIMessage = event => {
            const pitchOctave = numberToPitch(event.data[1]);
            const pitch1 = pitchOctave[0];
            const pitch2 = pitchOctave[1];
            const octave = pitchOctave[2];
            const key =
                this.noteToKeyMap[pitch1 + "" + octave] || this.noteToKeyMap[pitch2 + "" + octave];
            if (event.data[0] === 144 && event.data[2] !== 0) {
                __startNote(event, docById(key));
            } else {
                __endNote(event, docById(key));
            }
        };

        /**
         * Success callback function triggered upon receiving MIDI access.
         * Initializes MIDI widget and sets up MIDI event handlers.
         * @param {MIDIAccess} midiAccess - The MIDI access object containing MIDI inputs and outputs.
         * @memberof MusicKeyboard
         */
        const onMIDISuccess = midiAccess => {
            this.midiAccess = midiAccess;
            // re-init widget
            if (this.midiON) {
                this.midiButton.style.background = "#00FF00";
                activity.textMsg(_("MIDI device present."), 3000);
                return;
            }
            midiAccess.inputs.forEach(input => {
                input.onmidimessage = onMIDIMessage;
            });
            if (midiAccess.inputs.size) {
                this.midiButton.style.background = "#00FF00";
                activity.textMsg(_("MIDI device present."), 3000);
                this.midiON = true;
            } else {
                activity.textMsg(_("No MIDI device found."), 3000);
            }
        };

        /**
         * Failure callback function triggered upon failing to get MIDI access in the browser.
         * Displays an error message and updates MIDI state accordingly.
         * @memberof MusicKeyboard
         */
        const onMIDIFailure = () => {
            activity.errorMsg(_("Failed to get MIDI access in browser."), 3000);
            this.midiON = false;
        };

        /**
         * Requests MIDI access from the browser and initializes MIDI-related functionality.
         * Calls success or failure callback functions based on the result of the request.
         * @memberof MusicKeyboard
         */
        navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure);
    };

    /**
     * Shifts keyboard octaves higher (+1) or lower (-1).
     * @param {number} delta
     */
    this.shiftOctave = function (delta) {
        if (!this.octaves || this.octaves.length === 0) return;

        // Filter octaves for pitched notes only (exclude "hertz")
        const pitchedOctaves = [];
        for (let i = 0; i < this.octaves.length; i++) {
            if (this.noteNames && this.noteNames[i] !== "hertz") {
                pitchedOctaves.push(this.octaves[i]);
            }
        }
        if (pitchedOctaves.length === 0) return;

        const minOct = Math.min(...pitchedOctaves);
        const maxOct = Math.max(...pitchedOctaves);

        if (delta > 0 && maxOct >= 8) return;
        if (delta < 0 && minOct <= 1) return;

        for (let i = 0; i < this.octaves.length; i++) {
            if (this.noteNames && this.noteNames[i] !== "hertz") {
                this.octaves[i] += delta;
            }
        }

        if (this.displayLayout) {
            for (let i = 0; i < this.displayLayout.length; i++) {
                if (
                    this.displayLayout[i].noteName !== "hertz" &&
                    this.displayLayout[i].noteOctave !== undefined
                ) {
                    this.displayLayout[i].noteOctave += delta;
                }
            }
        }

        if (this.layout) {
            for (let i = 0; i < this.layout.length; i++) {
                if (
                    this.layout[i].noteName !== "hertz" &&
                    this.layout[i].noteOctave !== undefined
                ) {
                    this.layout[i].noteOctave += delta;
                }
            }
        }

        // Update note mappings and key element labels
        if (this.displayLayout && typeof docById === "function") {
            for (let i = 0; i < this.displayLayout.length; i++) {
                const item = this.displayLayout[i];
                if (item.noteName !== "hertz") {
                    const elem = docById("cell-" + i) || docById("blackRow" + i);
                    if (elem) {
                        const newSynthName = resolveSynthNoteName(item.noteName, item.noteOctave);
                        if (this.noteMapper && elem.id) {
                            this.noteMapper[elem.id] = newSynthName;
                        }
                        if (typeof elem.setAttribute === "function") {
                            elem.setAttribute("alt", newSynthName);
                            elem.setAttribute("title", newSynthName);
                        }

                        if (elem.childNodes && elem.childNodes.length > 0) {
                            for (let j = 0; j < elem.childNodes.length; j++) {
                                const node = elem.childNodes[j];
                                if (node.nodeType === 3) {
                                    node.textContent = `${item.noteName}${item.noteOctave}`;
                                }
                            }
                        }
                    }
                }
            }
        }

        if (typeof this._createTable === "function") {
            this._createTable();
        }
    };
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicKeyboard;
}
