/**
 * MusicBlocks
 *
 * @copyright 2019-21 Walter Bender
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
   Singer, last, TONEBPM
 */

/*
   Globals location
    - js/utils/utils.js
        last
    - js/turtle-singer.js
        Singer
    - js/logo.js
        TONEBPM
*/

/* exported MeterWidgetPlayback */

/**
 * @file MeterWidgetPlayback.js
 * @description Meter widget playback: the beat timers, playing the drums, moving the orange
 * beat indicator and stopping.
 *
 * The methods are moved from the MeterWidget class, which copies them onto
 * MeterWidget.prototype (see MeterWidget.installModules), so `this` is still the widget.
 */
class MeterWidgetPlayback {
    _setWidgetTimeout(callback, delay) {
        if (this._timerManager !== null) {
            return this._timerManager.setTimeout(callback, delay);
        }
        return setTimeout(callback, delay);
    }

    _clearWidgetTimeout(id) {
        if (id === null || id === undefined) {
            return false;
        }
        if (this._timerManager !== null) {
            return this._timerManager.clearTimeout(id);
        }
        clearTimeout(id);
        return true;
    }

    /**
     * @private
     * @param {string} drum
     * @returns {void}
     */
    __playDrum(drum) {
        this.activity.logo.synth.trigger(
            0,
            "C4",
            Singer.defaultBPMFactor * this._beatValue,
            drum,
            null,
            null
        );
    }

    /**
     * Private method to get the playing status.
     *
     * @private
     * @returns {boolean} - The playing status.
     */
    __getPlayingStatus() {
        return this._playing;
    }

    /**
     * @private
     * @returns {boolean}
     */
    __getPauseStatus() {
        return !this._playing;
    }

    /**
     * Hides all play-wheel beat indicator slices.
     *
     * @private
     * @returns {void}
     */
    _hidePlaybackIndicator() {
        if (this._playWheel && this._playWheel.navItems) {
            for (let i = 0; i < this._strongBeats.length; i++) {
                if (
                    this._playWheel.navItems[i] &&
                    this._playWheel.navItems[i].navItem &&
                    typeof this._playWheel.navItems[i].navItem.hide === "function"
                ) {
                    this._playWheel.navItems[i].navItem.hide();
                }
            }
        }
    }

    /**
     * Stops the beats: the next beat is cancelled and the indicator hidden.
     *
     * @private
     * @returns {void}
     */
    _stopPlayback() {
        this._playing = false;
        this._hidePlaybackIndicator();
        if (this._playBeatTimeout) {
            this._clearWidgetTimeout(this._playBeatTimeout);
            this._playBeatTimeout = null;
        }
        if (this._timerManager !== null) {
            this._timerManager.clearAll();
        }
    }

    /**
     * @private
     * @param {number} i
     * @param {number} ms
     * @returns {void}
     */
    __playOneBeat(i, ms) {
        if (!this._playing || this.__getPauseStatus()) {
            this._hidePlaybackIndicator();
            return;
        }

        let j = i - 1;
        if (j < 0) {
            j += this._strongBeats.length;
        }

        if (
            this._playWheel &&
            this._playWheel.navItems &&
            this._playWheel.navItems[i] &&
            this._playWheel.navItems[i].navItem &&
            this._playWheel.navItems[j] &&
            this._playWheel.navItems[j].navItem
        ) {
            this._playWheel.navItems[i].navItem.show();
            this._playWheel.navItems[j].navItem.hide();
        }

        if (this._strongBeats[i]) {
            this.__playDrum("snare drum");
        } else {
            this.__playDrum("kick drum");
        }

        this._playBeatTimeout = this._setWidgetTimeout(() => {
            if (this._playing) {
                this.__playOneBeat((i + 1) % this._strongBeats.length, ms);
            }
        }, ms);
    }

    /**
     * Private method to play the beat.
     *
     * @private
     * @returns {void}
     */
    _playBeat() {
        // The tempo of the turtle that ran the block, not turtle 0: after a project is loaded,
        // turtle 0 is a trashed turtle of the old project.
        const tur = this._turtle;
        const bpmFactor =
            TONEBPM / (tur && tur.singer.bpm.length > 0 ? last(tur.singer.bpm) : Singer.masterBPM);
        this._hidePlaybackIndicator();

        const noteBeatValue = bpmFactor * 1000 * this._beatValue;
        this.__playOneBeat(0, noteBeatValue);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = MeterWidgetPlayback;
}
