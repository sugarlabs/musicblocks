// Copyright (c) 2026 Music Blocks contributors
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

   _, platformColor, FIXEDSOLFEGE1, NOTESSHARP, NOTESFLAT, getCurrentEDO,
   generateNoteNames, isEquallyTempered, docById
*/
/*
   Global locations
    - js/utils/utils.js
        _, docById
    - js/utils/musicutils.js
        FIXEDSOLFEGE1, NOTESSHARP, NOTESFLAT, getCurrentEDO, generateNoteNames,
        isEquallyTempered
    - js/utils/platformstyle.js
        platformColor
*/

/* exported MusicKeyboardInput */

/**
 * @file MusicKeyboardInput.js
 * @description Live input for the Music Keyboard widget: playing and recording notes from
 * the computer keyboard, Shift + Arrow octave shifts, and notes from a MIDI device.
 */

const MusicKeyboardInput = {
    /**
     * Adds the input methods to a MusicKeyboard instance.
     *
     * Call it with the instance as `this`:
     * `MusicKeyboardInput.install.call(keyboard, deps)`. The methods keep the same
     * `this` binding they had inside the MusicKeyboard constructor.
     *
     * @param {Object} deps - Values from the MusicKeyboard constructor's scope.
     * @param {number[]} deps.BLACKKEYS - Key codes for the black keys.
     * @param {number[]} deps.WHITEKEYS - Key codes for the white keys.
     * @param {number[]} deps.HERTZKEYS - Key codes for the hertz keys.
     * @param {number} deps.SPACE - Key code that records a rest.
     * @param {number} deps.unit - Recorded notes are rounded to 1 / unit (8 in beginner mode).
     * @param {Function} deps.resolveSynthNoteName - Maps a note name and octave to a synth note.
     * @returns {void}
     */
    install(deps) {
        const { BLACKKEYS, WHITEKEYS, HERTZKEYS, SPACE, unit, resolveSynthNoteName } = deps;

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

                const ele = this._mkbEl(id);
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
                        restDuration = parseFloat(
                            (Math.round(restDuration * unit) / unit).toFixed(4)
                        );
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
                const ele = this._mkbEl(id);
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
                // Only release keys this keyboard started, so a keyup that arrives
                // after focus moved cannot record a note with no matching keydown.
                if (!current.has(event.keyCode)) return;

                current.delete(event.keyCode);
                __endNote(event);
            };

            // Ends any physical keys this keyboard is still holding. Called when it
            // hands the document key handlers to another keyboard.
            this._releaseActiveNotes = () => {
                for (const keyCode of Array.from(current)) {
                    current.delete(keyCode);
                    __endNote({ keyCode });
                }
            };

            this._registerDocumentKeyHandlers(__keyboarddown, __keyboardup);
        };

        /**
         * Rebuilds the MIDI pitch-to-key map from the current keyboard layout.
         * @private
         * @memberof MusicKeyboard
         */
        this._refreshNoteToKeyMap = () => {
            this.noteToKeyMap = {};
            const temperament = this.activity.logo.synth.inTemperament;
            const mapEnharmonics =
                getCurrentEDO(temperament) === 12 && isEquallyTempered(temperament);

            for (let idx = 0; idx < this.layout.length; idx++) {
                const key = this.layout[idx];
                if (key) {
                    this.noteToKeyMap[key.noteName.toString() + key.noteOctave.toString()] =
                        key.objId;
                    if (FIXEDSOLFEGE1 && FIXEDSOLFEGE1[key.noteName.toString()]) {
                        this.noteToKeyMap[
                            FIXEDSOLFEGE1[key.noteName.toString()] + "" + key.noteOctave
                        ] = key.objId; //convet solfege to alphabetic.
                    }
                    if (mapEnharmonics) {
                        const pitch = FIXEDSOLFEGE1[key.noteName] || key.noteName;
                        const step = NOTESFLAT.indexOf(pitch);
                        if (step !== -1) {
                            this.noteToKeyMap[NOTESSHARP[step] + key.noteOctave] ??= key.objId;
                        }
                    }
                }
            }
        };

        /**
         * Initiates MIDI functionality, allowing notes to be triggered by user interaction.
         * @memberof MusicKeyboard
         */
        this.doMIDI = () => {
            let duration = 0;
            let startTime = 0;

            this._refreshNoteToKeyMap();

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
                    this.noteToKeyMap[pitch1 + "" + octave] ||
                    this.noteToKeyMap[pitch2 + "" + octave];
                if (event.data[0] === 144 && event.data[2] !== 0) {
                    __startNote(event, this._mkbEl(key));
                } else {
                    __endNote(event, this._mkbEl(key));
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
                if (this._midiClosed) return;
                // re-init widget
                if (this.midiON) {
                    this.midiButton.style.background = "#00FF00";
                    this.activity.textMsg(_("MIDI device present."), 3000);
                    return;
                }
                this._midiHandler = onMIDIMessage;
                this._midiInputs = this._midiInputs || new Set();
                midiAccess.inputs.forEach(input => {
                    if (this._midiInputs.has(input)) return;
                    input.addEventListener("midimessage", onMIDIMessage);
                    this._midiInputs.add(input);
                });
                if (midiAccess.inputs.size) {
                    this.midiButton.style.background = "#00FF00";
                    this.activity.textMsg(_("MIDI device present."), 3000);
                    this.midiON = true;
                } else {
                    this.activity.textMsg(_("No MIDI device found."), 3000);
                }
            };

            /**
             * Failure callback function triggered upon failing to get MIDI access in the browser.
             * Displays an error message and updates MIDI state accordingly.
             * @memberof MusicKeyboard
             */
            const onMIDIFailure = () => {
                this.activity.errorMsg(_("Failed to get MIDI access in browser."), 3000);
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
                        const elem = this._mkbEl("cell-" + i) || this._mkbEl("blackRow" + i);
                        if (elem) {
                            const newSynthName = resolveSynthNoteName(
                                item.noteName,
                                item.noteOctave
                            );
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
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicKeyboardInput;
}
