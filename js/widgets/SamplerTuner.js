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

   _, instruments, TunerUtils
*/
/*
    Globals location
    - js/utils/utils.js
        _
    - js/utils/synthutils.js
        instruments
    - js/widgets/tuner.js
        TunerUtils
*/

/* exported SamplerTuner */

/**
 * @file SamplerTuner.js
 * @description Sampler widget the tuner: pitch detection with the YIN algorithm, the tuner display and the cent adjustment.
 *
 * The methods are moved as they were from the SampleWidget constructor. The constructor calls
 * SamplerTuner.install.call(this), so `this` is still the widget.
 */

const SamplerTuner = {
    /**
     * Adds these methods to a SampleWidget instance.
     * @returns {void}
     */
    install() {
        /**
         * Toggles the visibility of the tuner display
         * @returns {void}
         */
        this.toggleTuner = function () {
            this.tunerEnabled = !this.tunerEnabled;

            if (this.tunerEnabled) {
                this._tunerBtn.getElementsByTagName("img")[0].src = "header-icons/tuner-active.svg";
            } else {
                this._tunerBtn.getElementsByTagName("img")[0].src = "header-icons/tuner.svg";
            }

            // Redraw the canvas with the tuner display
            this._scale();
        };

        /**
         * Applies the cents adjustment to the sample playback rate
         * @returns {void}
         */
        this.applyCentsAdjustment = function () {
            if (this.sampleName && this.sampleName !== "") {
                const playbackRate = TunerUtils.calculatePlaybackRate(0, this.centsValue);
                // Apply the playback rate to the sample
                if (instruments[0]["customsample_" + this.originalSampleName]) {
                    instruments[0]["customsample_" + this.originalSampleName].playbackRate.value =
                        playbackRate;
                }
            }
        };

        /**
         * YIN Pitch Detection Algorithm
         */
        const YIN = (sampleRate, bufferSize = 2048, threshold = 0.1) => {
            // Low-Pass Filter to remove high-frequency noise
            const lowPassFilter = (buffer, cutoff = 500) => {
                const alpha = (2 * Math.PI * cutoff) / sampleRate;
                return buffer.map((sample, i, arr) =>
                    i > 0 ? alpha * sample + (1 - alpha) * arr[i - 1] : sample
                );
            };

            // Autocorrelation Function
            const autocorrelation = buffer =>
                buffer.map((_, lag) =>
                    buffer
                        .slice(0, buffer.length - lag)
                        .reduce((sum, value, index) => sum + value * buffer[index + lag], 0)
                );

            // Difference Function
            const difference = buffer => {
                const autocorr = autocorrelation(buffer);
                return autocorr.map((_, tau) => autocorr[0] + autocorr[tau] - 2 * autocorr[tau]);
            };

            // Cumulative Mean Normalized Difference Function
            const cumulativeMeanNormalizedDifference = diff => {
                let runningSum = 0;
                return diff.map((value, tau) => {
                    runningSum += value;
                    return tau === 0 ? 1 : value / (runningSum / tau);
                });
            };

            // Absolute Threshold Function
            const absoluteThreshold = cmnDiff => {
                for (let tau = 2; tau < cmnDiff.length; tau++) {
                    if (cmnDiff[tau] < threshold) {
                        while (tau + 1 < cmnDiff.length && cmnDiff[tau + 1] < cmnDiff[tau]) {
                            tau++;
                        }
                        return tau;
                    }
                }
                return -1;
            };

            // Parabolic Interpolation (More precision)
            const parabolicInterpolation = (cmnDiff, tau) => {
                const x0 = tau < 1 ? tau : tau - 1;
                const x2 = tau + 1 < cmnDiff.length ? tau + 1 : tau;

                if (x0 === tau) return cmnDiff[tau] <= cmnDiff[x2] ? tau : x2;
                if (x2 === tau) return cmnDiff[tau] <= cmnDiff[x0] ? tau : x0;

                const s0 = cmnDiff[x0],
                    s1 = cmnDiff[tau],
                    s2 = cmnDiff[x2];
                const adjustment = ((x2 - x0) * (s0 - s2)) / (2 * (s0 - 2 * s1 + s2));

                return tau + adjustment;
            };

            // Main Pitch Detection Function
            return buffer => {
                buffer = lowPassFilter(buffer, 300);
                const diff = difference(buffer);
                const cmnDiff = cumulativeMeanNormalizedDifference(diff);
                const tau = absoluteThreshold(cmnDiff);

                if (tau === -1) return -1;

                const tauInterp = parabolicInterpolation(cmnDiff, tau);
                return sampleRate / tauInterp;
            };
        };

        /**
         * Stops pitch detection and releases all associated resources.
         * This prevents memory leaks from AudioContext, MediaStream, and animation frames.
         * @returns {void}
         */
        this.stopPitchDetection = () => {
            this.isPitchDetectionRunning = false;

            // Cancel the animation frame loop
            if (this.pitchDetectionAnimationId !== null) {
                cancelAnimationFrame(this.pitchDetectionAnimationId);
                this.pitchDetectionAnimationId = null;
            }

            // Stop all tracks in the media stream (turns off microphone)
            if (this.pitchDetectionStream !== null) {
                this.pitchDetectionStream.getTracks().forEach(track => track.stop());
                this.pitchDetectionStream = null;
            }

            // Close the audio context to free up system resources
            if (this.pitchDetectionAudioContext !== null) {
                this.pitchDetectionAudioContext.close().catch(err => {
                    // Ignore errors if context is already closed
                    console.debug("AudioContext close error (may already be closed):", err);
                });
                this.pitchDetectionAudioContext = null;
            }
        };

        /**
         * Start pitch detection
         * @param {HTMLElement} pitchElement - Widget-local span for displaying detected pitch
         * @param {HTMLElement} noteElement - Widget-local span for displaying detected note
         * @returns {Promise<void>}
         */
        const startPitchDetection = async (pitchElement, noteElement) => {
            // Stop any existing pitch detection first to avoid multiple instances
            this.stopPitchDetection();

            try {
                const audioContext = new AudioContext();
                this.pitchDetectionAudioContext = audioContext;

                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.pitchDetectionStream = stream;

                const source = audioContext.createMediaStreamSource(stream);

                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 4096;
                source.connect(analyser);

                const bufferSize = 2048;
                const sampleRate = audioContext.sampleRate;
                const buffer = new Float32Array(bufferSize);
                const detectPitch = YIN(sampleRate, bufferSize);

                this.isPitchDetectionRunning = true;

                const updatePitch = () => {
                    // Check if we should stop the loop
                    if (!this.isPitchDetectionRunning) {
                        return;
                    }

                    analyser.getFloatTimeDomainData(buffer);
                    const pitch = detectPitch(buffer);

                    // Update widget-local DOM elements (passed in from makeTuner — no global query)
                    if (pitchElement && noteElement) {
                        if (pitch > 0) {
                            const { note, cents } = TunerUtils.frequencyToNote(pitch);
                            pitchElement.textContent = pitch.toFixed(2);
                            noteElement.textContent =
                                cents === 0
                                    ? ` ${note} (Perfect)`
                                    : ` ${note}, off by ${cents} cents`;
                        } else {
                            pitchElement.textContent = "---";
                            noteElement.textContent = "---";
                        }
                    }

                    // Only continue the loop if still running
                    if (this.isPitchDetectionRunning) {
                        this.pitchDetectionAnimationId = requestAnimationFrame(updatePitch);
                    }
                };

                // Start the animation loop
                this.pitchDetectionAnimationId = requestAnimationFrame(updatePitch);
            } catch (err) {
                console.error(`${err.name}: ${err.message}`);
                this.activity.errorMsg(
                    _("Microphone access failed: %s").replace(/%s/g, err.message)
                );
                // Clean up any partially initialized resources
                this.stopPitchDetection();
            }
        };

        /**
         * Create tuner UI
         */
        this.makeTuner = (width, height) => {
            const container = document.createElement("div");
            container.className = "tuner-container";
            container.style.height = height + "px";
            container.style.width = width + "px";
            container.style.position = "relative";
            container.style.backgroundColor = "#f5f5f5";
            container.style.borderRadius = "8px";
            container.style.padding = "20px";
            container.style.boxSizing = "border-box";

            const heading = document.createElement("h1");
            heading.textContent = _("Tuner");
            heading.style.color = "#282828";
            heading.style.textAlign = "center";
            heading.style.marginBottom = "20px";

            const startButton = document.createElement("button");
            startButton.id = "start";
            startButton.textContent = _("Start");
            startButton.style.display = "block";
            startButton.style.margin = "0 auto 20px";
            startButton.style.padding = "10px 20px";
            startButton.style.fontSize = "16px";
            startButton.style.cursor = "pointer";
            startButton.style.color = "#282828";
            startButton.style.backgroundColor = "#ffffff";
            startButton.style.border = "1px solid #ccc";
            startButton.style.borderRadius = "6px";

            const pitchParagraph = document.createElement("p");
            pitchParagraph.textContent = _("Detected Pitch: ");
            pitchParagraph.style.color = "#282828";
            pitchParagraph.style.textAlign = "center";
            pitchParagraph.style.fontSize = "18px";
            const pitchSpan = document.createElement("span");
            pitchSpan.id = "pitch";
            pitchSpan.textContent = "---";

            const noteParagraph = document.createElement("p");
            noteParagraph.textContent = _("Note: ");
            noteParagraph.style.color = "#282828";
            noteParagraph.style.textAlign = "center";
            noteParagraph.style.fontSize = "18px";
            const noteSpan = document.createElement("span");
            noteSpan.id = "note";
            noteSpan.textContent = "---";

            pitchParagraph.appendChild(pitchSpan);
            noteParagraph.appendChild(noteSpan);

            container.appendChild(heading);
            container.appendChild(startButton);
            container.appendChild(pitchParagraph);
            container.appendChild(noteParagraph);

            this.widgetWindow.getWidgetBody().appendChild(container);

            startButton.addEventListener("click", () => startPitchDetection(pitchSpan, noteSpan));
        };

        /**
         * Applies the cent adjustment to the sample
         * @param {number} value - The cent adjustment value
         * @returns {void}
         */
        this.applyCentAdjustment = function (value) {
            this.centAdjustmentValue = value;

            // Calculate the playback rate adjustment based on cents
            // Formula: playbackRate = 2^(cents/1200)
            const playbackRate = Math.pow(2, value / 1200);

            // Apply the playback rate to the current sample if it exists
            if (this.sampleName && this.sampleName !== "" && this.originalSampleName) {
                const instrumentName = "customsample_" + this.originalSampleName;

                // Check if instruments object exists and the specific instrument exists
                if (
                    typeof instruments !== "undefined" &&
                    instruments[0] &&
                    instruments[0][instrumentName] &&
                    instruments[0][instrumentName].playbackRate
                ) {
                    instruments[0][instrumentName].playbackRate.value = playbackRate;
                } else {
                    // If the instrument doesn't exist yet, we'll apply the adjustment when playing
                    console.debug(
                        "Instrument not found, will apply cent adjustment during playback"
                    );
                }
            }

            // If we're currently playing, restart with the new adjustment
            if (this.isMoving) {
                this.pause();
                this._clearWidgetTimeout(this._restartPitchTimeout);
                this._restartPitchTimeout = this._setWidgetTimeout(() => {
                    this._playReferencePitch();
                    this._restartPitchTimeout = null;
                }, 100);
            }
        };
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = SamplerTuner;
}
