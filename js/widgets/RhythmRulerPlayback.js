/**
 * MusicBlocks
 *
 * @copyright 2016-21 Walter Bender
 * @copyright 2016 Hemant Kasat
 * @copyright 2026 Music Blocks contributors
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

   Singer, _, platformColor, DRUMNAMES, VOICENAMES
*/
/*
    Globals location
    - js/turtle-singer.js
        Singer
    - js/utils/utils.js
        _
    - js/utils/platformstyle.js
        platformColor
    - js/utils/synthutils.js
        DRUMNAMES, VOICENAMES
*/

/* exported RhythmRulerPlayback */

/**
 * @file RhythmRulerPlayback.js
 * @description Rhythm Maker playback: playing one ruler or all of them, pause and resume, and the
 * loop that steps through the cells.
 *
 * The methods are moved as they were from the RhythmRuler class, which copies them onto
 * RhythmRuler.prototype (see RhythmRuler.installModules), so `this` is still the widget.
 */
class RhythmRulerPlayback {
    /**
     * Pauses the rhythm playing.
     * @private
     * @returns {void}
     */
    __pause() {
        this._setButtonIcon(this._playAllCell, "play-button.svg", _("Play all"));
        this._playing = false;
        this._playingAll = false;
        this._playingOne = false;
        this._rulerPlaying = -1;
        this._startingTime = null;
        this._clearWidgetTimers();
        for (let i = 0; i < this.Rulers.length; i++) {
            this._calculateZebraStripes(i);
        }

        // Clear circular highlights and redraw.
        this._circularHighlight = {};
        this._refreshCircularView();
    }

    /**
     * Initiates the playback of all rhythms.
     * @public
     * @returns {void}
     */
    playAll() {
        // External call from run button.
        if (this._playing) {
            if (this._playingAll) {
                this.__pause();
                // Wait for pause to complete before restarting.
                this._playingAll = true;

                this._setWidgetTimeout(() => {
                    this.__resume();
                }, 1000);
            }
        } else if (!this._playingAll) {
            this.__resume();
        }
    }

    /**
     * Resumes playback of all rhythms.
     * @private
     * @returns {void}
     */
    __resume() {
        this._clearWidgetTimers();
        this._setButtonIcon(this._playAllCell, "pause-button.svg", _("Pause"));
        this.activity.logo.turtleDelay = 0;
        this._playingAll = true;
        this._playing = true;
        this._playingOne = false;
        this._cellCounter = 0;
        this._rulerPlaying = -1;
        for (let i = 0; i < this.Rulers.length; i++) {
            this._elapsedTimes[i] = 0;
            this._offsets[i] = 0;
        }

        this._playAll();
    }

    /**
     * Starts the playback of all rhythms.
     * @private
     * @returns {void}
     */
    _playAll() {
        this.activity.logo.synth.stop();
        this.activity.logo.resetSynth(0);
        if (this._startingTime === null) {
            const d = new Date();
            this._startingTime = d.getTime();
            for (let i = 0; i < this.Rulers.length; i++) {
                this._offsets[i] = 0;
                this._elapsedTimes[i] = 0;
            }
        }

        for (let i = 0; i < this.Rulers.length; i++) {
            this.__loop(0, i, 0);
        }
    }

    /**
     * Starts the playback of a single rhythm.
     * @private
     * @returns {void}
     */
    _playOne() {
        this.activity.logo.synth.stop();
        this.activity.logo.resetSynth(0);
        if (this._startingTime === null) {
            const d = new Date();
            this._startingTime = d.getTime();
            this._elapsedTimes[this._rulerSelected] = 0;
            this._offsets[this._rulerSelected] = 0;
        }

        this.__loop(0, this._rulerSelected, 0);
    }

    /**
     * Safely retrieves the drum/voice name for a given ruler index.
     * @private
     * @param {number} selectedRuler
     * @returns {string}
     */
    _getDrumName(selectedRuler) {
        if (
            this.Drums === undefined ||
            this.Drums === null ||
            this.Drums[selectedRuler] === null ||
            this.Drums[selectedRuler] === undefined
        ) {
            return "snare drum";
        }
        const drumBlock = this.activity?.blocks?.blockList?.[this.Drums[selectedRuler]];
        if (!drumBlock || !drumBlock.connections) {
            return "snare drum";
        }
        const connectedId = drumBlock.connections[1];
        if (connectedId === null || connectedId === undefined) {
            return "snare drum";
        }
        const connectedBlock = this.activity?.blocks?.blockList?.[connectedId];
        if (!connectedBlock || typeof connectedBlock.value !== "string") {
            return "snare drum";
        }
        return connectedBlock.value;
    }

    /**
     * Executes a loop iteration for playback.
     * @private
     * @param {number} noteTime - The duration of the note in milliseconds.
     * @param {number} rulerNo - The index of the ruler.
     * @param {number} colIndex - The index of the column in the ruler.
     * @returns {void}
     */
    __loop(noteTime, rulerNo, colIndex) {
        const ruler = this._rulers[rulerNo];
        if (ruler === null) {
            // console.warn("Cannot find ruler " + rulerNo + ". Widget closed?");
            return;
        }

        // Refresh the divisions each time we cycle.
        if (colIndex === 0) {
            this._calculateZebraStripes(rulerNo);
        }

        const cell = ruler.cells[colIndex];
        const noteValues = this.Rulers[rulerNo][0];
        const noteValue = noteValues[colIndex];

        noteTime = Math.abs(1 / noteValue);
        let drum = this._getDrumName(rulerNo);

        let foundDrum = false;
        // Convert i18n drum name to English.
        for (let d = 0; d < DRUMNAMES.length; d++) {
            if (DRUMNAMES[d][0].replace("-", " ") === drum) {
                drum = DRUMNAMES[d][1];
                foundDrum = true;
                break;
            } else if (DRUMNAMES[d][1] === drum) {
                foundDrum = true;
                break;
            }
        }

        let foundVoice = false;
        if (!foundDrum) {
            for (let d = 0; d < VOICENAMES.length; d++) {
                if (VOICENAMES[d][0] === drum) {
                    drum = VOICENAMES[d][1];
                    foundVoice = true;
                    break;
                } else if (VOICENAMES[d][1] === drum) {
                    foundVoice = true;
                    break;
                }
            }
        }

        if (this._playing) {
            // Play the current note.
            if (noteValue > 0) {
                if (foundVoice) {
                    this.activity.logo.synth.trigger(
                        0,
                        "C4",
                        Singer.defaultBPMFactor / noteValue,
                        drum,
                        null,
                        null,
                        false
                    );
                } else if (foundDrum) {
                    this.activity.logo.synth.trigger(
                        0,
                        ["C4"],
                        Singer.defaultBPMFactor / noteValue,
                        drum,
                        null,
                        null
                    );
                }
            }

            // And highlight its cell.
            cell.style.backgroundColor = platformColor.rulerHighlight; // selectorBackground;

            // Update circular view highlight if active.
            if (this._circularView && this._circularCanvas) {
                this._circularHighlight[rulerNo] = colIndex;
                this._drawCircularView();
            }

            // Calculate any offset in playback.
            const d = new Date();
            this._offsets[rulerNo] = d.getTime() - this._startingTime - this._elapsedTimes[rulerNo];
        }

        this._setWidgetTimeout(
            () => {
                colIndex += 1;
                if (colIndex === noteValues.length) {
                    colIndex = 0;
                }

                if (this._playing) {
                    this.__loop(noteTime, rulerNo, colIndex);
                }
            },
            Singer.defaultBPMFactor * 1000 * noteTime - this._offsets[rulerNo]
        );

        this._elapsedTimes[rulerNo] += Singer.defaultBPMFactor * 1000 * noteTime;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = RhythmRulerPlayback;
}
