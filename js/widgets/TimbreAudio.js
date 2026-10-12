/**
 * MusicBlocks
 *
 * @copyright 2017-21 Walter Bender
 * @copyright 2017 Tayba Wasim
 * @copyright 2017 Prachi Agrawal
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

   Singer, instrumentsEffects:writeable, instrumentsFilters:writeable,
   docById, last, _, TimbreWidget
 */

/* exported TimbreAudio */

/**
 * @file TimbreAudio.js
 * @description Timbre audio preview, playback looping, and synth triggering.
 *
 * The methods are installed onto TimbreWidget.prototype (see TimbreWidget.installModules),
 * so `this` inside them refers to the TimbreWidget instance.
 */
class TimbreAudio {
    /**
     * @private
     * @param {string} note - note to play
     * @param {number} duration - duration for which to play the note
     * @returns {void}
     */
    _playNote(note, duration) {
        this.activity.logo.synth.setMasterVolume(last(Singer.masterVolume));

        if (this.instrumentName in instrumentsFilters[0]) {
            const timbreEffects = instrumentsEffects[0][this.instrumentName] || {};
            const paramsEffects = {
                doVibrato: false,
                doDistortion: false,
                doTremolo: false,
                doPhaser: false,
                doChorus: false,
                vibratoIntensity: 0,
                vibratoFrequency: 0,
                distortionAmount: 0,
                tremoloFrequency: 0,
                tremoloDepth: 0,
                rate: 0,
                octaves: 0,
                baseFrequency: 0,
                chorusRate: 0,
                delayTime: 0,
                chorusDepth: 0
            };

            if (timbreEffects["vibratoActive"]) {
                paramsEffects.vibratoFrequency =
                    timbreEffects["vibratoFrequency"] !== undefined
                        ? timbreEffects["vibratoFrequency"]
                        : this.vibratoParams && this.vibratoParams.length > 1
                          ? 1 / parseFloat(this.vibratoParams[1])
                          : 1 / 16;
                paramsEffects.vibratoIntensity =
                    timbreEffects["vibratoIntensity"] !== undefined
                        ? timbreEffects["vibratoIntensity"]
                        : this.vibratoParams && this.vibratoParams.length > 0
                          ? parseFloat(this.vibratoParams[0]) / 100
                          : 0.05;
                paramsEffects.doVibrato = true;
            }

            if (timbreEffects["distortionActive"]) {
                paramsEffects.distortionAmount =
                    timbreEffects["distortionAmount"] !== undefined
                        ? timbreEffects["distortionAmount"]
                        : this.distortionParams && this.distortionParams.length > 0
                          ? parseFloat(this.distortionParams[0]) / 100
                          : 0.5;
                paramsEffects.doDistortion = true;
            }

            if (timbreEffects["tremoloActive"]) {
                paramsEffects.tremoloFrequency =
                    timbreEffects["tremoloFrequency"] !== undefined
                        ? timbreEffects["tremoloFrequency"]
                        : this.tremoloParams && this.tremoloParams.length > 0
                          ? parseFloat(this.tremoloParams[0])
                          : 10;
                paramsEffects.tremoloDepth =
                    timbreEffects["tremoloDepth"] !== undefined
                        ? timbreEffects["tremoloDepth"]
                        : this.tremoloParams && this.tremoloParams.length > 1
                          ? parseFloat(this.tremoloParams[1]) / 100
                          : 0.5;
                paramsEffects.doTremolo = true;
            }

            if (timbreEffects["phaserActive"]) {
                paramsEffects.rate =
                    timbreEffects["rate"] !== undefined
                        ? timbreEffects["rate"]
                        : this.phaserParams && this.phaserParams.length > 0
                          ? parseFloat(this.phaserParams[0])
                          : 0.5;
                paramsEffects.octaves =
                    timbreEffects["octaves"] !== undefined
                        ? timbreEffects["octaves"]
                        : this.phaserParams && this.phaserParams.length > 1
                          ? parseFloat(this.phaserParams[1])
                          : 3;
                paramsEffects.baseFrequency =
                    timbreEffects["baseFrequency"] !== undefined
                        ? timbreEffects["baseFrequency"]
                        : this.phaserParams && this.phaserParams.length > 2
                          ? parseFloat(this.phaserParams[2])
                          : 350;
                paramsEffects.doPhaser = true;
            }

            if (timbreEffects["chorusActive"]) {
                paramsEffects.chorusRate =
                    timbreEffects["chorusRate"] !== undefined
                        ? timbreEffects["chorusRate"]
                        : this.chorusParams && this.chorusParams.length > 0
                          ? parseFloat(this.chorusParams[0])
                          : 1.5;
                paramsEffects.delayTime =
                    timbreEffects["delayTime"] !== undefined
                        ? timbreEffects["delayTime"]
                        : this.chorusParams && this.chorusParams.length > 1
                          ? parseFloat(this.chorusParams[1])
                          : 3.5;
                paramsEffects.chorusDepth =
                    timbreEffects["chorusDepth"] !== undefined
                        ? timbreEffects["chorusDepth"]
                        : this.chorusParams && this.chorusParams.length > 2
                          ? parseFloat(this.chorusParams[2]) / 100
                          : 0.7;
                paramsEffects.doChorus = true;
            }

            this.activity.logo.synth.trigger(
                0,
                note,
                Singer.defaultBPMFactor * duration,
                this.instrumentName,
                paramsEffects,
                instrumentsFilters[0][this.instrumentName]
            );
        } else {
            // Not sure why the instrument would not be found, but is
            // sometimes happens. (See ##2963)
            this.activity.logo.synth.trigger(
                0,
                note,
                Singer.defaultBPMFactor * duration,
                this.instrumentName,
                null,
                null
            );
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _play() {
        this._playing = !this._playing;

        this.activity.logo.resetSynth(0);

        const cell = this.playButton;
        if (this._playing) {
            cell.textContent = "\u00A0\u00A0";
            const stopImg = document.createElement("img");
            stopImg.src = "header-icons/stop-button.svg";
            stopImg.title = _("Stop");
            stopImg.alt = _("Stop");
            stopImg.setAttribute("height", TimbreWidget.ICONSIZE);
            stopImg.setAttribute("width", TimbreWidget.ICONSIZE);
            stopImg.setAttribute("vertical-align", "middle");
            stopImg.setAttribute("align-content", "center");
            cell.appendChild(stopImg);
            cell.appendChild(document.createTextNode("\u00A0\u00A0"));
        } else {
            this._clearWidgetTimeout(this._previewTimerId);
            this._previewTimerId = null;
            this.activity.logo.synth.setMasterVolume(0);
            this.activity.logo.synth.stop();
            cell.textContent = "\u00A0\u00A0";
            const playImg = document.createElement("img");
            playImg.src = "header-icons/play-button.svg";
            playImg.title = _("Play");
            playImg.alt = _("Play");
            playImg.setAttribute("height", TimbreWidget.ICONSIZE);
            playImg.setAttribute("width", TimbreWidget.ICONSIZE);
            playImg.setAttribute("vertical-align", "middle");
            playImg.setAttribute("align-content", "center");
            cell.appendChild(playImg);
            cell.appendChild(document.createTextNode("\u00A0\u00A0"));
        }

        if (this.notesToPlay.length === 0) {
            this.notesToPlay = [
                ["G4", 1 / 4],
                ["E4", 1 / 4],
                ["G4", 1 / 2]
            ];
        }

        const __playLoop = i => {
            if (this._playing) {
                this._playNote(this.notesToPlay[i][0], this.notesToPlay[i][1]);
            }

            i += 1;
            if (i < this.notesToPlay.length && this._playing) {
                this._previewTimerId = this._setWidgetTimeout(
                    () => {
                        this._previewTimerId = null;
                        __playLoop(i);
                    },
                    Singer.defaultBPMFactor * 1000 * this.notesToPlay[i - 1][1]
                );
            } else {
                cell.textContent = "\u00A0\u00A0";
                const playImg2 = document.createElement("img");
                playImg2.src = "header-icons/play-button.svg";
                playImg2.title = _("Play");
                playImg2.alt = _("Play");
                playImg2.setAttribute("height", TimbreWidget.ICONSIZE);
                playImg2.setAttribute("width", TimbreWidget.ICONSIZE);
                playImg2.setAttribute("vertical-align", "middle");
                playImg2.setAttribute("align-content", "center");
                cell.appendChild(playImg2);
                cell.appendChild(document.createTextNode("\u00A0\u00A0"));
                this._playing = false;
            }
        };

        if (this._playing) {
            __playLoop(0);
        }
    }
}

if (typeof window !== "undefined") {
    window.TimbreAudio = TimbreAudio;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = TimbreAudio;
}
