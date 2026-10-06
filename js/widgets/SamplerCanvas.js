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

   _, platformColor, TunerDisplay, TunerUtils
*/
/*
    Globals location
    - js/utils/utils.js
        _
    - js/utils/platformstyle.js
        platformColor
    - js/widgets/tuner.js
        TunerDisplay, TunerUtils
*/

/* exported SamplerCanvas */

/**
 * @file SamplerCanvas.js
 * @description Sampler widget the waveform canvas and its scaling.
 *
 * The methods are moved as they were from the SampleWidget constructor. The constructor calls
 * SamplerCanvas.install.call(this, deps), so `this` is still the widget.
 */

const SamplerCanvas = {
    /**
     * Adds these methods to a SampleWidget instance.
     * @param {Object} deps - Values from the SampleWidget constructor's scope.
     * @param {*} deps.SAMPLEWIDTH - The constructor's SAMPLEWIDTH.
     * @param {*} deps.SAMPLEHEIGHT - The constructor's SAMPLEHEIGHT.
     * @param {*} deps.EXPORTACCIDENTALNAMES - The constructor's EXPORTACCIDENTALNAMES.
     * @param {*} deps.SOLFEGENAMES - The constructor's SOLFEGENAMES.
     * @param {*} deps.SAMPLEOSCCOLORS - The constructor's SAMPLEOSCCOLORS.
     * @returns {void}
     */
    install(deps) {
        const { SAMPLEWIDTH, SAMPLEHEIGHT, EXPORTACCIDENTALNAMES, SOLFEGENAMES, SAMPLEOSCCOLORS } =
            deps;

        /**
         * Scales the widget window and canvas based on the window's state.
         * @returns {void}
         */
        this._scale = function () {
            let width, height;
            const canvas = document.getElementsByClassName("samplerCanvas");
            Array.prototype.forEach.call(canvas, ele => {
                this.widgetWindow.getWidgetBody().removeChild(ele);
            });
            if (!this.widgetWindow.isMaximized()) {
                width = SAMPLEWIDTH;
                height = SAMPLEHEIGHT;
            } else {
                width = this.widgetWindow.getWidgetBody().getBoundingClientRect().width;
                height = this.widgetWindow.getWidgetFrame().getBoundingClientRect().height - 70;
            }
            // Cancel any existing RAF loop for this canvas before creating a new one
            // to prevent multiple concurrent draw loops accumulating on resize/maximize.
            if (this.drawVisualIDs[0]) {
                cancelAnimationFrame(this.drawVisualIDs[0]);
                this.drawVisualIDs[0] = null;
            }
            this.makeCanvas(width, height, 0, true);
            this.reconnectSynthsToAnalyser();
        };

        /**
         * Creates a canvas element and draws visual representations of sample data and reference tones.
         * @param {number} width - The width of the canvas.
         * @param {number} height - The height of the canvas.
         * @param {number} turtleIdx - The index of the canvas.
         * @param {boolean} resized - Indicates if the canvas is resized.
         * @returns {void}
         */
        this.makeCanvas = function (width, height, turtleIdx, resized) {
            const canvas = document.createElement("canvas");
            canvas.height = height;
            canvas.width = width;
            canvas.className = "samplerCanvas";
            this.widgetWindow.getWidgetBody().appendChild(canvas);
            const canvasCtx = canvas.getContext("2d");
            canvasCtx.clearRect(0, 0, width, height);

            // If tuner is enabled, create a separate tuner display
            if (this.tunerEnabled) {
                // Create a dedicated tuner canvas
                const tunerCanvas = document.createElement("canvas");
                tunerCanvas.height = Math.min(200, height * 0.4);
                tunerCanvas.width = Math.min(200, width * 0.8);
                tunerCanvas.className = "tunerCanvas";
                tunerCanvas.style.position = "absolute";
                tunerCanvas.style.top = "10px";
                tunerCanvas.style.left = (width - tunerCanvas.width) / 2 + "px";
                this.widgetWindow.getWidgetBody().appendChild(tunerCanvas);

                // Initialize or update the tuner display
                if (!this.tunerDisplay) {
                    this.tunerDisplay = new TunerDisplay(
                        tunerCanvas,
                        tunerCanvas.width,
                        tunerCanvas.height
                    );
                } else {
                    this.tunerDisplay.canvas = tunerCanvas;
                    this.tunerDisplay.width = tunerCanvas.width;
                    this.tunerDisplay.height = tunerCanvas.height;
                }

                // Set initial note display
                const noteObj = TunerUtils.frequencyToPitch(
                    A0 *
                        Math.pow(
                            2,
                            (pitchToNumber(
                                SOLFEGENAMES[this.pitchCenter] +
                                    EXPORTACCIDENTALNAMES[this.accidentalCenter],
                                this.octaveCenter
                            ) -
                                57) /
                                12
                        )
                );
                this.tunerDisplay.update(noteObj[0], noteObj[1], this.centsValue);

                // Reduce the main canvas height to make room for the tuner
                canvas.height = height - tunerCanvas.height - 20;
                canvas.style.marginTop = tunerCanvas.height + 20 + "px";
            } else if (this.tunerDisplay) {
                // Remove the tuner canvas if it exists
                const tunerCanvas = document.getElementsByClassName("tunerCanvas")[0];
                if (tunerCanvas) {
                    tunerCanvas.parentNode.removeChild(tunerCanvas);
                }
                this.tunerDisplay = null;
            }

            const draw = () => {
                // Only continue the RAF loop when there is active work to render.
                // Scheduling inside the condition stops the loop naturally when idle
                // (not recording and no active analyser) instead of spinning at ~60fps
                // unconditionally — matching the lifecycle pattern of the Oscilloscope widget.
                if (
                    this.is_recording ||
                    (this.pitchAnalysers[turtleIdx] && (this.running || resized))
                ) {
                    this.drawVisualIDs[turtleIdx] = requestAnimationFrame(draw);
                    canvasCtx.fillStyle = platformColor.background || "#FFFFFF";
                    canvasCtx.font = "10px Verdana";
                    this.verticalOffset = -canvas.height / 4;
                    this.zoomFactor = 40.0;
                    canvasCtx.fillRect(0, 0, width, height);

                    let oscText;
                    if (turtleIdx >= 0) {
                        //.TRANS: The sound sample that the user uploads.
                        oscText = this.sampleName !== "" ? this.sampleName : _("sample");
                    }
                    canvasCtx.fillStyle = platformColor.textColor || "#000000";
                    //.TRANS: The reference tone is a sound used for comparison.
                    canvasCtx.fillText(_("reference tone"), 10, 10);
                    canvasCtx.fillText(oscText, 10, canvas.height / 2 + 10);

                    for (let turtleIdx = 0; turtleIdx < 2; turtleIdx += 1) {
                        let dataArray;
                        if (this.is_recording) {
                            dataArray =
                                turtleIdx === 0
                                    ? this.pitchAnalysers[0].getValue()
                                    : this.activity.logo.synth.getWaveFormValues();
                        } else {
                            dataArray = this.pitchAnalysers[turtleIdx].getValue();
                        }

                        const bufferLength = dataArray.length;
                        const rbga = SAMPLEOSCCOLORS[turtleIdx];
                        const sliceWidth = (width * this.zoomFactor) / bufferLength;
                        canvasCtx.lineWidth = 2;
                        canvasCtx.strokeStyle = rbga;
                        canvasCtx.beginPath();

                        let x = 0;

                        for (let i = 0; i < bufferLength; i++) {
                            const y = (height / 2) * (1 - dataArray[i]) + this.verticalOffset;
                            if (i === 0) {
                                canvasCtx.moveTo(x, y);
                            } else {
                                canvasCtx.lineTo(x, y);
                            }
                            x += sliceWidth;
                        }
                        canvasCtx.lineTo(canvas.width, canvas.height / 2);
                        canvasCtx.stroke();
                        this.verticalOffset = canvas.height / 4;
                    }

                    // Update the tuner display if enabled
                    if (this.tunerEnabled && this.tunerDisplay) {
                        // Get pitch data from analyzer if available
                        if (this.pitchAnalysers[1] && this.sampleName) {
                            const dataArray = this.pitchAnalysers[1].getValue();
                            if (dataArray && dataArray.length > 0) {
                                const pitch = detectPitch(dataArray);
                                if (pitch > 0) {
                                    const { note, cents } = TunerUtils.frequencyToNote(pitch);
                                    this.tunerDisplay.update(note, cents, this.centsValue);

                                    // Update segments
                                    this.tunerSegments.forEach((segment, i) => {
                                        const segmentCents = (i - 5) * 10;
                                        if (Math.abs(cents - segmentCents) <= 5) {
                                            segment.setAttribute("fill", "#00ff00"); // In tune (green)
                                        } else if (cents < segmentCents) {
                                            segment.setAttribute("fill", "#ff0000"); // Flat (red)
                                        } else {
                                            segment.setAttribute("fill", "#0000ff"); // Sharp (blue)
                                        }
                                    });
                                }
                            }
                        }
                    }
                } else {
                    // No active work — clear the stored RAF id so the loop is fully stopped.
                    this.drawVisualIDs[turtleIdx] = null;
                }
            };
            draw();
        };
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = SamplerCanvas;
}
