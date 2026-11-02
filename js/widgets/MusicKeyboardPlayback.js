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

   _, platformColor, SHARP, FLAT
*/
/*
   Global locations
    - js/utils/utils.js
        _
    - js/utils/musicutils.js
        SHARP, FLAT
    - js/utils/platformstyle.js
        platformColor
*/

/* exported MusicKeyboardPlayback */

/**
 * @file MusicKeyboardPlayback.js
 * @description Playback for the Music Keyboard widget: playing the recorded notes back
 * with the Play button, highlighting the keys as they play, and stopping the metronome.
 */

const MusicKeyboardPlayback = {
    /**
     * Adds the playback methods to a MusicKeyboard instance.
     *
     * Call it with the instance as `this`:
     * `MusicKeyboardPlayback.install.call(keyboard, deps)`. The methods keep the same
     * `this` binding they had inside the MusicKeyboard constructor.
     *
     * @param {Object} deps - Values from the MusicKeyboard constructor's scope.
     * @param {number} deps.ICONSIZE - Size of the toolbar icons.
     * @param {Function} deps.getSelectedNotes - Returns the current selectedNotes list,
     *     which the constructor replaces rather than mutates.
     * @returns {void}
     */
    install(deps) {
        const { ICONSIZE, getSelectedNotes } = deps;

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
            const countdownContainer = this._mkbEl("countdownContainer");
            if (countdownContainer) {
                countdownContainer.remove();
            }
            if (this.metronomeInterval) {
                this._clearWidgetInterval(this.metronomeInterval);
                this.metronomeInterval = null;
            }
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
         * Plays the selected musical notes.
         * If no notes are selected, the function returns early.
         */
        this.playAll = function () {
            const selectedNotes = getSelectedNotes();
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
                        ele = this._mkbEl(selectedNotes[0].objId[i]);
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
                    cell = this._mkbEl("cells-0");
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
                const selectedNotes = getSelectedNotes();
                let cell, eleid, ele, notes, zx, res, maxDuration;
                if (counter < selectedNotes.length) {
                    if (this._stopOrCloseClicked) {
                        return;
                    }

                    if (!this.keyboardShown) {
                        cell = this._mkbEl("cells-" + counter);
                        cell.style.backgroundColor = platformColor.selectorBackground;
                    }

                    if (this.keyboardShown && selectedNotes[counter - 1].objId[0] !== null) {
                        for (let i = 0; i < selectedNotes[counter - 1].noteOctave.length; i++) {
                            eleid = selectedNotes[counter - 1].objId[i];
                            ele = this._mkbEl(eleid);
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

                            ele = this._mkbEl(selectedNotes[counter].objId[i]);
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
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicKeyboardPlayback;
}
