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

/**
 * @file PhraseMakerAudio.js
 * @description Audio playback and sound engine logic for PhraseMaker widget.
 */

/* global PhraseMakerUtils, PhraseMakerUI */

const PhraseMakerAudio = {
    /**
     * Plays all notes in the matrix.
     * Toggles between playing and stopping notes based on the current state.
     * @param {Object} pm - The PhraseMaker instance.
     */
    playAll(pm) {
        // Play all of the notes in the matrix.
        pm.playingNow = !pm.playingNow;

        if (pm.playingNow) {
            pm.widgetWindow.modifyButton(
                0,
                "stop-button.svg",
                pm.constructor.ICONSIZE,
                pm._("Stop")
            );

            pm.activity.logo.synth.stop();

            // Retrieve list of note to play, from matrix state
            this.collectNotesToPlay(pm);

            pm._notesCounter = 0;

            // We have an array of pitches and note values.
            const note = pm._notesToPlay[pm._notesCounter][0];
            const pitchNotes = [];
            const synthNotes = [];
            const drumNotes = [];
            let drumName, obj;

            // Note can be a chord, hence it is an array.
            for (let i = 0; i < note.length; i++) {
                if (typeof note[i] === "number") {
                    drumName = null;
                } else {
                    drumName = pm._deps.getDrumName(note[i]);
                }

                if (typeof note[i] === "number") {
                    synthNotes.push(note[i]);
                } else if (drumName != null) {
                    drumNotes.push(drumName);
                } else if (note[i].slice(0, 4) === "http") {
                    drumNotes.push(note[i]);
                } else {
                    obj = note[i].split(": ");
                    if (obj.length > 1) {
                        // Deprecated
                        if (PhraseMakerUtils.MATRIXSYNTHS.includes(obj[0])) {
                            synthNotes.push(note[i]);
                        } else {
                            this._processGraphics(pm, obj);
                        }
                    } else {
                        pitchNotes.push(note[i].replace(/♭/g, "b").replace(/♯/g, "#"));
                    }
                }

                pm._stopOrCloseClicked = false;
            }

            const noteValue = pm._notesToPlay[pm._notesCounter][1];

            pm._notesCounter += 1;

            pm._colIndex = 0;

            // We highlight the note-value cells (bottom row).
            let row = pm._noteValueRow;

            // Highlight first note.
            const cell = row.cells[pm._colIndex];
            cell.style.backgroundColor = pm.platformColor.selectorBackground;

            let tupletCell;
            // If we are in a tuplet, we don't update the column until
            // we've played all of the notes in the column span.
            if (cell.colSpan > 1) {
                pm._spanCounter = 1;
                row = pm._tupletNoteValueRow;
                tupletCell = row.cells[pm._colIndex];
                tupletCell.style.backgroundColor = pm.platformColor.selectorBackground;
            } else {
                pm._spanCounter = 0;
                pm._colIndex += 1;
            }

            if (note[0] !== "R" && pitchNotes.length > 0) {
                this._playChord(pm, pitchNotes, pm._deps.Singer.defaultBPMFactor / noteValue);
            }

            for (let i = 0; i < synthNotes.length; i++) {
                pm.activity.logo.synth.trigger(
                    0,
                    [Number(synthNotes[i])],
                    pm._deps.Singer.defaultBPMFactor / noteValue,
                    pm._instrumentName,
                    null,
                    null
                );
            }

            for (let i = 0; i < drumNotes.length; i++) {
                pm.activity.logo.synth.trigger(
                    0,
                    "C2",
                    pm._deps.Singer.defaultBPMFactor / noteValue,
                    drumNotes[i],
                    null,
                    null
                );
            }

            this.__playNote(pm, 0, 0);
        } else {
            pm._stopOrCloseClicked = true;
            pm.widgetWindow.modifyButton(
                0,
                "play-button.svg",
                pm.constructor.ICONSIZE,
                pm._("Play")
            );
        }
    },

    /**
     * Collects notes to play based on the matrix state.
     * Generates a list of notes to play from row labels and note values.
     * @param {Object} pm - The PhraseMaker instance.
     */
    collectNotesToPlay(pm) {
        // Generate the list of notes to play, on the fly from
        // row labels and note value (from "alt" attribute of
        // corresponding cells in the row)

        // list of half-tones with solfeges or letter names
        const MATRIXHALFTONES = [
            "do♭",
            "C♭",
            "do",
            "C",
            "do♯",
            "C♯",

            "re♭",
            "D♭",
            "re",
            "D",
            "re♯",
            "D♯",

            "mi♭",
            "E♭",
            "mi",
            "E",
            "mi♯",
            "E♯",

            "fa♭",
            "F♭",
            "fa",
            "F",
            "fa♯",
            "F♯",

            "sol♭",
            "G♭",
            "sol",
            "G",
            "sol♯",
            "G♯",

            "la♭",
            "A♭",
            "la",
            "A",
            "la♯",
            "A♯",

            "ti♭",
            "B♭",
            "ti",
            "B",
            "ti♯",
            "B♯"
        ];
        // list of half-tones mapped to their letter representations
        const MATRIXHALFTONES2 = [
            "C♭",
            "C♭",
            "C",
            "C",
            "C♯",
            "C♯",

            "D♭",
            "D♭",
            "D",
            "D",
            "D♯",
            "D♯",

            "E♭",
            "E♭",
            "E",
            "E",
            "E♯",
            "E♯",

            "F♭",
            "F♭",
            "F",
            "F",
            "F♯",
            "F♯",

            "G♭",
            "G♭",
            "G",
            "G",
            "G♯",
            "G♯",

            "A♭",
            "A♭",
            "A",
            "A",
            "A♯",
            "A♯",

            "B♭",
            "B♭",
            "B",
            "B",
            "B♯",
            "B♯"
        ];
        const notes = [];
        let row, cell, note;
        for (let i = 0; i < pm._colBlocks.length; i++) {
            note = [];
            for (let j = 0; j < pm.rowLabels.length; j++) {
                row = pm._rows[j];
                cell = row.cells[i];
                if (cell.style.backgroundColor === "black") {
                    if (pm.rowLabels[j] === "hertz") {
                        // if pitch specified in hertz
                        note.push(pm.rowArgs[j]);
                    } else {
                        if (
                            // if graphic block
                            PhraseMakerUtils.MATRIXGRAPHICS.indexOf(pm.rowLabels[j]) != -1 ||
                            PhraseMakerUtils.MATRIXGRAPHICS2.indexOf(pm.rowLabels[j]) != -1
                        ) {
                            // push "action: value"
                            note.push(pm.rowLabels[j] + ": " + pm.rowArgs[j]);
                        } else if (
                            // if pitch represented by halftone
                            MATRIXHALFTONES.indexOf(pm.rowLabels[j]) != -1
                        ) {
                            // push "halftone" + "notevalue"
                            note.push(
                                MATRIXHALFTONES2[MATRIXHALFTONES.indexOf(pm.rowLabels[j])] +
                                    pm.rowArgs[j]
                            );
                        } else {
                            if (
                                pm._deps.isCustomTemperament(pm.activity.logo.synth.inTemperament)
                            ) {
                                const notes = pm._deps.getTemperament(
                                    pm.activity.logo.synth.inTemperament
                                );
                                const label = pm.rowLabels[j];
                                let customNote = [];
                                for (const n in notes) {
                                    if (notes[n][1] === label) {
                                        customNote = notes[n];
                                        break;
                                    }
                                }
                                if (customNote.length > 0) {
                                    // custom pitch in custom temperament
                                    note.push(pm.rowLabels[j] + pm.rowArgs[j]);
                                }
                            } else {
                                // if drum push drum name
                                note.push(pm.rowLabels[j]);
                            }
                        }
                    }
                }
            }
            // push [note/chord, relative-duration-inverse (e.g. 8 for 1/8)]
            notes.push([note, 1 / cell.getAttribute("alt")]);
        }

        pm._notesToPlay = notes;
    },

    /**
     * Initiates the playback of notes based on the current state and sequence.
     * Controls the sequence of notes to play, updating UI and triggering synth sounds.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {number} time - The playback time offset.
     * @param {number} noteCounter - The current note index in the playback sequence.
     */
    __playNote(pm, time, noteCounter) {
        // Show lyrics while playing notes.
        if (pm.lyricsON) {
            activity.textMsg(pm._lyrics[noteCounter], 3000);
        }
        // If the widget is closed, stop playing.
        if (!pm.widgetWindow.isVisible()) {
            return;
        }

        let noteValue = pm._notesToPlay[noteCounter][1];
        time = 1 / noteValue;

        setTimeout(() => {
            let row, cell, tupletCell;
            // Did we just play the last note?
            if (noteCounter === pm._notesToPlay.length - 1) {
                PhraseMakerUI.resetMatrix(pm);

                pm.widgetWindow.modifyButton(
                    0,
                    "play-button.svg",
                    pm.constructor.ICONSIZE,
                    pm._("Play")
                );
                pm.playingNow = false;
                pm._playButton.innerHTML = `&nbsp;&nbsp;<img 
                    src="header-icons/play-button.svg" 
                    title="${pm._("Play")}" 
                    alt="${pm._("Play")}" 
                    height="${pm.constructor.ICONSIZE}" 
                    width="${pm.constructor.ICONSIZE}" 
                    vertical-align="middle"
                >&nbsp;&nbsp;`;
            } else {
                row = pm._noteValueRow;
                cell = row.cells[pm._colIndex];

                if (cell != undefined) {
                    cell.style.backgroundColor = pm.platformColor.selectorBackground;
                    if (cell.colSpan > 1) {
                        row = pm._tupletNoteValueRow;
                        tupletCell = row.cells[pm._notesCounter];
                        tupletCell.style.backgroundColor = pm.platformColor.selectorBackground;
                    }
                }

                if (pm._notesCounter >= pm._notesToPlay.length) {
                    pm._notesCounter = 1;
                    pm.activity.logo.synth.stop();
                }

                const note = pm._notesToPlay[pm._notesCounter][0];
                noteValue = pm._notesToPlay[pm._notesCounter][1];
                pm._notesCounter += 1;

                const pitchNotes = [];
                const synthNotes = [];
                const drumNotes = [];
                let drumName, obj;
                // Note can be a chord, hence it is an array.
                if (!pm._stopOrCloseClicked) {
                    for (let i = 0; i < note.length; i++) {
                        if (typeof note[i] === "number") {
                            drumName = null;
                        } else {
                            drumName = pm._deps.getDrumName(note[i]);
                        }

                        if (typeof note[i] === "number") {
                            synthNotes.push(note[i]);
                        } else if (drumName != null) {
                            drumNotes.push(drumName);
                        } else if (note[i].slice(0, 4) === "http") {
                            drumNotes.push(note[i]);
                        } else {
                            obj = note[i].split(": ");
                            // Deprecated
                            if (PhraseMakerUtils.MATRIXSYNTHS.includes(obj[0])) {
                                synthNotes.push(note[i]);
                                continue;
                            } else if (PhraseMakerUtils.MATRIXGRAPHICS.includes(obj[0])) {
                                this._processGraphics(pm, obj);
                            } else if (PhraseMakerUtils.MATRIXGRAPHICS2.includes(obj[0])) {
                                this._processGraphics(pm, obj);
                            } else {
                                pitchNotes.push(note[i].replace(/♭/g, "b").replace(/♯/g, "#"));
                            }
                        }
                    }
                }

                if (note[0] !== "R" && pitchNotes.length > 0) {
                    this._playChord(pm, pitchNotes, pm._deps.Singer.defaultBPMFactor / noteValue);
                }

                for (let i = 0; i < synthNotes.length; i++) {
                    pm.activity.logo.synth.trigger(
                        0,
                        [Number(synthNotes[i])],
                        pm._deps.Singer.defaultBPMFactor / noteValue,
                        pm._instrumentName,
                        null,
                        null
                    );
                }

                for (let i = 0; i < drumNotes.length; i++) {
                    pm.activity.logo.synth.trigger(
                        0,
                        ["C2"],
                        pm._deps.Singer.defaultBPMFactor / noteValue,
                        drumNotes[i],
                        null,
                        null
                    );
                }
            }

            row = pm._noteValueRow;
            cell = row.cells[pm._colIndex];
            if (cell != undefined) {
                if (cell.colSpan > 1) {
                    pm._spanCounter += 1;
                    if (pm._spanCounter === cell.colSpan) {
                        pm._colIndex += 1;
                        pm._spanCounter = 0;
                    }
                } else {
                    pm._colIndex += 1;
                }

                if (pm._colIndex >= row.cells.length) {
                    PhraseMakerUI.resetMatrix(pm);
                    pm._colIndex = 0;
                }
            }

            if (noteCounter < pm._notesToPlay.length - 1) {
                if (!pm._stopOrCloseClicked) {
                    this.__playNote(pm, time, noteCounter + 1);
                } else {
                    PhraseMakerUI.resetMatrix(pm);
                }
            }
        }, pm._deps.Singer.defaultBPMFactor * 1000 * time + pm.activity.logo.turtleDelay);
    },

    /**
     * Plays a chord by triggering synth notes for each pitch in the chord.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {number[]} notes - Array of pitch values representing the chord.
     * @param {number} noteValue - The duration value of the chord notes.
     */
    _playChord(pm, notes, noteValue) {
        setTimeout(() => {
            pm.activity.logo.synth.trigger(0, notes[0], noteValue, pm._instrumentName, null, null);
        }, 1);

        if (notes.length > 1) {
            setTimeout(() => {
                pm.activity.logo.synth.trigger(
                    0,
                    notes[1],
                    noteValue,
                    pm._instrumentName,
                    null,
                    null
                );
            }, 1);
        }

        if (notes.length > 2) {
            setTimeout(() => {
                pm.activity.logo.synth.trigger(
                    0,
                    notes[2],
                    noteValue,
                    pm._instrumentName,
                    null,
                    null
                );
            }, 1);
        }

        if (notes.length > 3) {
            setTimeout(() => {
                pm.activity.logo.synth.trigger(
                    0,
                    notes[3],
                    noteValue,
                    pm._instrumentName,
                    null,
                    null
                );
            }, 1);
        }
    },

    /**
     * Processes graphics commands to update the turtle's painter state.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {string[]} obj - An array containing the graphics command and its parameters.
     */
    _processGraphics(pm, obj) {
        const firstTurtle = pm.activity.turtles.getTurtle(0);
        switch (obj[0]) {
            case "forward":
                firstTurtle.painter.doForward(obj[1]);
                break;
            case "back":
                firstTurtle.painter.doForward(-obj[1]);
                break;
            case "right":
                firstTurtle.painter.doRight(obj[1]);
                break;
            case "left":
                firstTurtle.painter.doRight(-obj[1]);
                break;
            case "setcolor":
                firstTurtle.painter.doSetColor(obj[1]);
                break;
            case "sethue":
                firstTurtle.painter.doSetHue(obj[1]);
                break;
            case "setshade":
                firstTurtle.painter.doSetValue(obj[1]);
                break;
            case "setgrey":
                firstTurtle.painter.doSetChroma(obj[1]);
                break;
            case "settranslucency":
                firstTurtle.painter.doSetPenAlpha(1.0 - obj[1] / 100);
                break;
            case "setpensize":
                firstTurtle.painter.doSetPensize(obj[1]);
                break;
            case "setheading":
                firstTurtle.painter.doSetHeading(obj[1]);
                break;
            case "arc":
                firstTurtle.painter.doArc(obj[1], obj[2]);
                break;
            case "setxy":
                firstTurtle.painter.doSetXY(obj[1], obj[2]);
                break;
            default:
                //eslint-disable-next-line no-console
                console.debug("unknown graphics command " + obj[0]);
                break;
        }
    }
};

// Export for global use
window.PhraseMakerAudio = PhraseMakerAudio;

// Export for RequireJS/AMD
if (typeof define === "function" && define.amd) {
    define([], function () {
        return PhraseMakerAudio;
    });
}

// Export for Node.js/CommonJS (for testing)
if (typeof module !== "undefined" && module.exports) {
    module.exports = PhraseMakerAudio;
}
