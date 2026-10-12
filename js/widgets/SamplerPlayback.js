// Copyright (c) 2021 Liza Malykhina
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

   _, Tone, instruments, TunerUtils
*/
/*
    Globals location
    - js/utils/utils.js
        _
    - js/utils/synthutils.js
        instruments, Tone
    - js/widgets/tuner.js
        TunerUtils
*/

/* exported SamplerPlayback */

/**
 * @file SamplerPlayback.js
 * @description Sampler widget playback: pause and resume, playing the reference pitch and the sample, and routing the synths through the analyser.
 *
 * The methods are moved as they were from the SampleWidget constructor. The constructor calls
 * SamplerPlayback.install.call(this, deps), so `this` is still the widget.
 */

const SamplerPlayback = {
    /**
     * Adds these methods to a SampleWidget instance.
     * @param {Object} deps - Values from the SampleWidget constructor's scope.
     * @param {*} deps.ICONSIZE - The constructor's ICONSIZE.
     * @param {*} deps.MAJORSCALE - The constructor's MAJORSCALE.
     * @param {*} deps.REFERENCESAMPLE - The constructor's REFERENCESAMPLE.
     * @param {*} deps.CENTERPITCHHERTZ - The constructor's CENTERPITCHHERTZ.
     * @param {*} deps.SAMPLEWAITTIME - The constructor's SAMPLEWAITTIME.
     * @param {*} deps.SAMPLEANALYSERSIZE - The constructor's SAMPLEANALYSERSIZE.
     * @returns {void}
     */
    install(deps) {
        const {
            ICONSIZE,
            MAJORSCALE,
            REFERENCESAMPLE,
            CENTERPITCHHERTZ,
            SAMPLEWAITTIME,
            SAMPLEANALYSERSIZE
        } = deps;

        /**
         * Pauses the sample playback.
         * Cancels any pending playback timers so a stale timer from a previous play
         * cannot fire after this pause and corrupt the next play sequence.
         * @returns {void}
         */
        this.pause = function () {
            this._clearWidgetTimeout(this._playbackWaitTimeout);
            this._playbackWaitTimeout = null;
            this._clearWidgetTimeout(this._endPlayingTimeout);
            this._endPlayingTimeout = null;

            const img = this.playBtn ? this.playBtn.getElementsByTagName("img")[0] : null;
            if (img) {
                img.src = "header-icons/play-button.svg";
                img.title = _("Play");
                img.alt = _("Play");
            } else if (this.playBtn) {
                const playImg = document.createElement("img");
                playImg.src = "header-icons/play-button.svg";
                playImg.title = _("Play");
                playImg.alt = _("Play");
                playImg.height = ICONSIZE;
                playImg.width = ICONSIZE;
                playImg.style.verticalAlign = "middle";
                this.playBtn.textContent = "";
                this.playBtn.appendChild(playImg);
            }
            this.isMoving = false;
        };

        /**
         * Resumes the sample playback.
         * @returns {void}
         */
        this.resume = function () {
            const img = this.playBtn ? this.playBtn.getElementsByTagName("img")[0] : null;
            if (img) {
                img.src = "header-icons/pause-button.svg";
                img.title = _("Pause");
                img.alt = _("Pause");
            } else if (this.playBtn) {
                const pauseImg = document.createElement("img");
                pauseImg.src = "header-icons/pause-button.svg";
                pauseImg.title = _("Pause");
                pauseImg.alt = _("Pause");
                pauseImg.height = ICONSIZE;
                pauseImg.width = ICONSIZE;
                pauseImg.style.verticalAlign = "middle";
                this.playBtn.textContent = "";
                this.playBtn.appendChild(pauseImg);
            }
            this.isMoving = true;
        };

        /**
         * Plays the reference pitch based on the current sample's pitch, accidental, and octave.
         * @returns {void}
         */
        this._playReferencePitch = function (edo) {
            const currentEDO = edo || 12;
            this._updateSamplePitchValues();
            this._updateBlocks();

            let finalCenter = 0;

            finalCenter += isNaN(this.octaveCenter) ? 0 : this.octaveCenter * currentEDO;
            finalCenter += isNaN(this.pitchCenter) ? 0 : MAJORSCALE[this.pitchCenter];
            finalCenter += isNaN(this.accidentalCenter) ? 0 : this.accidentalCenter - 2;

            const netChange = finalCenter - 57;
            const reffinalpitch = Math.floor(440 * Math.pow(2, netChange / currentEDO));

            this.activity.logo.synth.trigger(
                0,
                [reffinalpitch],
                0.5,
                REFERENCESAMPLE,
                null,
                null,
                false
            );

            this.setTimbre();
            this._playDelayedSample();
        };

        /**
         * Plays the current sample.
         * @returns {void}
         */
        this._playSample = function () {
            if (this.sampleName !== null && this.sampleName !== "") {
                this.reconnectSynthsToAnalyser();

                // Store the current note object for the cent adjustment
                const frequency = this._calculateFrequency();
                this.currentNoteObj = TunerUtils.frequencyToPitch(frequency);

                // Get a reference to the player
                const instrumentName = "customsample_" + this.originalSampleName;

                // Ensure the instrument exists
                if (!instruments[0][instrumentName]) {
                    // Create the instrument if it doesn't exist
                    this.activity.logo.synth.loadSynth(0, instrumentName);
                }

                if (instruments[0][instrumentName]) {
                    this.player = instruments[0][instrumentName];
                }

                // Calculate adjusted frequency for cent adjustment
                let playbackFrequency = CENTERPITCHHERTZ;
                if (this.centAdjustmentValue !== 0) {
                    const playbackRate = Math.pow(2, this.centAdjustmentValue / 1200);
                    playbackFrequency = CENTERPITCHHERTZ * playbackRate;
                }

                this.activity.logo.synth.trigger(
                    0,
                    [playbackFrequency],
                    this.sampleLength / 1000.0,
                    instrumentName,
                    null,
                    null,
                    false
                );
            }
        };

        /**
         * Waits for a specified time and then plays the sample.
         * Stores its timer ID in _playbackWaitTimeout so pause() can cancel it.
         * @returns {Promise<string>} A promise that resolves once the sample is played.
         */
        this._waitAndPlaySample = function () {
            return new Promise(resolve => {
                this._clearWidgetTimeout(this._playbackWaitTimeout);
                this._playbackWaitTimeout = this._setWidgetTimeout(() => {
                    this._playbackWaitTimeout = null;
                    this._playSample();
                    resolve("played");
                    this._endPlaying();
                }, SAMPLEWAITTIME);
            });
        };

        /**
         * Asynchronously plays the sample after a delay.
         * @returns {Promise<void>} A promise that resolves once the sample is played.
         */
        this._playDelayedSample = async function () {
            await this._waitAndPlaySample();
        };

        /**
         * Waits for the sample to finish playing.
         * Stores its timer ID in _endPlayingTimeout so pause() can cancel it.
         * @returns {Promise<string>} A promise that resolves once the sample playback ends.
         */
        this._waitAndEndPlaying = function () {
            return new Promise(resolve => {
                this._clearWidgetTimeout(this._endPlayingTimeout);
                this._endPlayingTimeout = this._setWidgetTimeout(() => {
                    this._endPlayingTimeout = null;
                    this.pause();
                    resolve("ended");
                }, this.sampleLength);
            });
        };

        /**
         * Asynchronously ends the sample playback after waiting for its duration.
         * @returns {Promise<void>} A promise that resolves once the sample playback ends.
         */
        this._endPlaying = async function () {
            await this._waitAndEndPlaying();
        };

        /**
         * Reconnects synths to the analyser for pitch analysis.
         * @returns {void}
         */
        this.reconnectSynthsToAnalyser = function () {
            // Make two pitchAnalysers for the ref tone and the sample.
            for (const instrument in [0, 1]) {
                if (this.pitchAnalysers[instrument] === undefined) {
                    this.pitchAnalysers[instrument] = new Tone.Analyser({
                        type: "waveform",
                        size: SAMPLEANALYSERSIZE
                    });
                }
            }

            // Connect instruments. Ref tone connects with the first pitchAnalyser.
            for (const synth in instruments[0]) {
                let analyser = 1;
                if (synth === REFERENCESAMPLE) {
                    analyser = 0;
                    instruments[0][synth].connect(this.pitchAnalysers[analyser]);
                }
                if (synth === "customsample_" + this.originalSampleName) {
                    analyser = 1;
                    instruments[0][synth].connect(this.pitchAnalysers[analyser]);
                }
            }
        };
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = SamplerPlayback;
}
