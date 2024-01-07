// Copyright (c) 2017-21 Walter Bender
// Copyright (c) 2017 Tayba Wasim
// Copyright (c) 2017 Prachi Agrawal
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

   DEFAULTOSCILLATORTYPE, platformColor, rationalToFraction, last,
   Singer, instrumentsEffects:writeable, instrumentsFilters:writeable,
   _, docById, DEFAULTFILTERTYPE, docByName, OSCTYPES, FILTERTYPES,
   oneHundredToFraction, delayExecution
 */

/*
   Global locations
    js/utils/musicutils.js
        DEFAULTOSCILLATORTYPE, DEFAULTFILTERTYPE, OSCTYPES, FILTERTYPES
    js/utils/platformstyle.js
        platformColor
    js/utils/utils.js
        rationalToFraction, last, _, docById, docByName, oneHundredToFraction
    js/utils/synthutils.js
        instrumentsEffects, instrumentsFilters
    js/turtle-singer.js
        Singer
*/

/* exported TimbreWidget */

class TimbreWidget {
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;

    /**
     * @constructor
     */
    constructor() {
        this.notesToPlay = [];
        this.env = [];
        this.ENVs = [];
        this.synthVals = {
            oscillator: {
                type: "sine6",
                source: DEFAULTOSCILLATORTYPE
            },
            envelope: {
                attack: 0.01,
                decay: 0.5,
                sustain: 0.6,
                release: 0.01
            }
        };

        this.adsrMap = ["attack", "decay", "sustain", "release"];
        this.amSynthParamvals = {
            harmonicity: 3
        };

        this.fmSynthParamvals = {
            modulationIndex: 10
        };

        this.noiseSynthParamvals = {
            noise: {
                type: "white"
            }
        };

        this.duoSynthParamVals = {
            vibratoAmount: 0.5,
            vibratoRate: 5
        };

        this.fil = [];
        this.filterParams = [];
        this.osc = [];
        this.oscParams = [];
        this.tremoloEffect = [];
        this.tremoloParams = [];
        this.vibratoEffect = [];
        this.vibratoParams = [];
        this.chorusEffect = [];
        this.chorusParams = [];
        this.phaserEffect = [];
        this.phaserParams = [];
        this.distortionEffect = [];
        this.distortionParams = [];
        this.AMSynthesizer = [];
        this.AMSynthParams = [];
        this.FMSynthesizer = [];
        this.FMSynthParams = [];
        this.NoiseSynthesizer = [];
        this.NoiseSynthParams = [];
        this.duoSynthesizer = [];
        this.duoSynthParams = [];
        this.activeParams = [
            "synth",
            "amsynth",
            "fmsynth",
            "noisesynth",
            "duosynth",
            "envelope",
            "oscillator",
            "filter",
            "effects",
            "chorus",
            "vibrato",
            "phaser",
            "distortion",
            "tremolo"
        ];
        this.isActive = {};

        for (let i = 0; i < this.activeParams.length; i++) {
            this.isActive[this.activeParams[i]] = false;
        }

        this.blockNo = null; // index no. of the timbre widget block
        this.instrumentName = "custom";

        if (!(this.instrumentName in instrumentsFilters[0])) {
            instrumentsFilters[0][this.instrumentName] = [];
        }

        if (!(this.instrumentName in instrumentsEffects[0])) {
            instrumentsEffects[0][this.instrumentName] = [];
        }

        this.timbreTableDiv = document.createElement("div");
    }

    /**
     * @deprecated
     */
    _addButton(row, icon, iconSize, label) {
        const cell = row.insertCell(-1);
        cell.innerHTML =
            '&nbsp;&nbsp;<img src="header-icons/' +
            icon +
            '" title="' +
            label +
            '" alt="' +
            label +
            '" height="' +
            iconSize +
            '" width="' +
            iconSize +
            '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = TimbreWidget.BUTTONSIZE + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = platformColor.selectorBackground;

        cell.onmouseover = () => {
            this.style.backgroundColor = platformColor.selectorBackgroundHOVER;
        };

        cell.onmouseout = () => {
            this.style.backgroundColor = platformColor.selectorBackground;
        };

        return cell;
    }

    /**
     * @private
     * used to update the parameters in the blocks contained in the timbre widget clamp.
     * @param {number} i - is the index into the parameter array. (For example, there can be multiple filter blocks associated with a timbre.)
     * @param {number} k - is the parameter to update (There can be multiple parameters per block.)
     * @returns {void}
     */
    _update = async (i, value, k) => {
        const updateParams = [];

        if (this.isActive["envelope"] === true && this.env[i] != null) {
            for (let j = 0; j < 4; j++) {
                updateParams[j] = this.activity.blocks.blockList[this.env[i]].connections[j + 1];
            }
        }

        if (this.isActive["filter"] === true && this.fil[i] != null) {
            for (let j = 0; j < 3; j++) {
                updateParams[j] = this.activity.blocks.blockList[this.fil[i]].connections[j + 1];
            }
        }

        if (this.isActive["oscillator"] === true && this.osc[i] != null) {
            for (let j = 0; j < 2; j++) {
                updateParams[j] = this.activity.blocks.blockList[this.osc[i]].connections[j + 1];
            }
        }

        if (this.isActive["amsynth"] === true && this.AMSynthesizer[i] != null) {
            updateParams[0] = this.activity.blocks.blockList[this.AMSynthesizer[i]].connections[1];
        }

        if (this.isActive["fmsynth"] === true && this.FMSynthesizer[i] != null) {
            updateParams[0] = this.activity.blocks.blockList[this.FMSynthesizer[i]].connections[1];
        }

        if (this.isActive["noisesynth"] === true && this.NoiseSynthesizer[i] != null) {
            updateParams[0] = this.activity.blocks.blockList[
                this.NoiseSynthesizer[i]
            ].connections[1];
        }

        if (this.isActive["duosynth"] === true && this.duoSynthesizer[i] != null) {
            for (let j = 0; j < 2; j++) {
                updateParams[j] = this.activity.blocks.blockList[
                    this.duoSynthesizer[i]
                ].connections[j + 1];
            }
        }

        if (this.isActive["tremolo"] === true && this.tremoloEffect[i] != null) {
            for (let j = 0; j < 2; j++) {
                updateParams[j] = this.activity.blocks.blockList[this.tremoloEffect[i]].connections[
                    j + 1
                ];
            }
        }

        if (this.isActive["vibrato"] === true && this.vibratoEffect[i] != null) {
            updateParams[0] = this.activity.blocks.blockList[this.vibratoEffect[i]].connections[1];
            // The rate arg of the vibrato block must be in the form: a / b
            const divBlock = this.activity.blocks.blockList[this.vibratoEffect[i]].connections[2];
            if (
                this.activity.blocks.blockList[divBlock].name === "divide" &&
                this.activity.blocks.blockList[divBlock].connections[1] != null &&
                this.activity.blocks.blockList[
                    this.activity.blocks.blockList[divBlock].connections[1]
                ].name === "number" &&
                this.activity.blocks.blockList[divBlock].connections[2] != null &&
                this.activity.blocks.blockList[
                    this.activity.blocks.blockList[divBlock].connections[2]
                ].name === "number"
            ) {
                const numBlock = this.activity.blocks.blockList[divBlock].connections[1];
                const denomBlock = this.activity.blocks.blockList[divBlock].connections[2];
                updateParams[1] = denomBlock;
                updateParams[2] = numBlock;
            } else {
                // Convert to a / b format
                const obj = rationalToFraction(
                    this.activity.logo.parseArg(this.activity.logo, 0, divBlock, null, null)
                );
                const n = this.activity.blocks.blockList.length;
                this.activity.blocks.loadNewBlocks([
                    [0, ["divide", {}], 0, 0, [null, 1, 2]],
                    [1, ["number", { value: obj[0] }], 0, 0, [0]],
                    [2, ["number", { value: obj[1] }], 0, 0, [0]]
                ]);

                updateParams[1] = n + 2; // Denom block
                updateParams[2] = n + 1; // Numerator block

                const __blockRefresher = () => {
                    this.activity.blocks.blockList[last(this.vibratoEffect)].connections[2] = n;
                    this.activity.blocks.blockList[n].connections[0] = last(this.vibratoEffect);
                    this.activity.blocks.blockList[divBlock].connections[0] = null;
                    this.activity.blocks.clampBlocksToCheck.push([n, 0]);
                    this.activity.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
                    this.activity.blocks.adjustDocks(this.blockNo, true);
                };

                await delayExecution(500);
                __blockRefresher();
            }
        }

        if (this.isActive["chorus"] === true && this.chorusEffect[i] != null) {
            for (let j = 0; j < 3; j++) {
                updateParams[j] = this.activity.blocks.blockList[this.chorusEffect[i]].connections[
                    j + 1
                ];
            }
        }

        if (this.isActive["phaser"] === true && this.phaserEffect[i] != null) {
            for (let j = 0; j < 3; j++) {
                updateParams[j] = this.activity.blocks.blockList[this.phaserEffect[i]].connections[
                    j + 1
                ];
            }
        }

        if (this.isActive["distortion"] === true && this.distortionEffect[i] != null) {
            updateParams[0] = this.activity.blocks.blockList[
                this.distortionEffect[i]
            ].connections[1];
        }

        if (updateParams[0] != null) {
            if (typeof value === "string") {
                this.activity.blocks.blockList[updateParams[k]].value = value;
            } else {
                this.activity.blocks.blockList[updateParams[k]].value = parseFloat(value);
            }

            this.activity.blocks.blockList[updateParams[k]].text.text = value.toString();
            this.activity.blocks.blockList[updateParams[k]].updateCache();
            this.activity.refreshCanvas();
            this.activity.saveLocally();
        }
    }

    /**
     * @private
     * @param {string} note - note to play
     * @param {number} duration - duration for which to play the note
     * @returns {void}
     */
    _playNote(note, duration) {
        this.activity.logo.synth.setMasterVolume(last(Singer.masterVolume));

        if (this.instrumentName in instrumentsFilters[0]) {
            const timbreEffects = instrumentsEffects[0][this.instrumentName];
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
                paramsEffects.vibratoFrequency = timbreEffects["vibratoFrequency"];
                paramsEffects.vibratoIntensity = timbreEffects["vibratoIntensity"];
                paramsEffects.doVibrato = true;
            }

            if (timbreEffects["distortionActive"]) {
                paramsEffects.distortionAmount = timbreEffects["distortionAmount"];
                paramsEffects.doDistortion = true;
            }

            if (timbreEffects["tremoloActive"]) {
                paramsEffects.tremoloFrequency = timbreEffects["tremoloFrequency"];
                paramsEffects.tremoloDepth = timbreEffects["tremoloDepth"];
                paramsEffects.doTremolo = true;
            }

            if (timbreEffects["phaserActive"]) {
                paramsEffects.rate = timbreEffects["rate"];
                paramsEffects.octaves = timbreEffects["octaves"];
                paramsEffects.baseFrequency = timbreEffects["baseFrequency"];
                paramsEffects.doPhaser = true;
            }

            if (timbreEffects["chorusActive"]) {
                paramsEffects.chorusRate = timbreEffects["chorusRate"];
                paramsEffects.delayTime = timbreEffects["delayTime"];
                paramsEffects.chorusDepth = timbreEffects["chorusDepth"];
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
            cell.innerHTML =
                '&nbsp;&nbsp;<img src="header-icons/' +
                "stop-button.svg" +
                '" title="' +
                _("stop") +
                '" alt="' +
                _("stop") +
                '" height="' +
                TimbreWidget.ICONSIZE +
                '" width="' +
                TimbreWidget.ICONSIZE +
                '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        } else {
            this.activity.logo.synth.setMasterVolume(0);
            this.activity.logo.synth.stop();
            cell.innerHTML =
                '&nbsp;&nbsp;<img src="header-icons/' +
                "play-button.svg" +
                '" title="' +
                _("Play") +
                '" alt="' +
                _("Play") +
                '" height="' +
                TimbreWidget.ICONSIZE +
                '" width="' +
                TimbreWidget.ICONSIZE +
                '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        }

        if (this.notesToPlay.length === 0) {
            this.notesToPlay = [
                ["G4", 1 / 4],
                ["E4", 1 / 4],
                ["G4", 1 / 2]
            ];
        }

        const __playLoop = (i) => {
            if (this._playing) {
                this._playNote(this.notesToPlay[i][0], this.notesToPlay[i][1]);
            }

            i += 1;
            if (i < this.notesToPlay.length && this._playing) {
                setTimeout(() => {
                    __playLoop(i);
                }, Singer.defaultBPMFactor * 1000 * this.notesToPlay[i - 1][1]);
            } else {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/' +
                    "play-button.svg" +
                    '" title="' +
                    _("Play") +
                    '" alt="' +
                    _("Play") +
                    '" height="' +
                    TimbreWidget.ICONSIZE +
                    '" width="' +
                    TimbreWidget.ICONSIZE +
                    '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
                this._playing = false;
            }
        };

        if (this._playing) {
            __playLoop(0);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _save() {
        // Just save a set timbre block with the current instrument name.
        const obj = [
            [0, "settimbre", 100 + this._delta, 100 + this._delta, [null, 1, null, 2]],
            [1, ["text", { value: "custom" }], 0, 0, [0]],
            [2, "hidden", 0, 0, [0, null]]
        ];
        this.activity.blocks.loadNewBlocks(obj);
        this._delta += 42;
    }

    /**
     * @private
     * @returns {void}
     */
    _undo() {
        let blockValue = 0;

        if (this.isActive["envelope"]) {
            if (this.env.length > 1) {
                blockValue = this.env.length - 1;
            }

            docById("envelopeButtonCell").style.backgroundColor = platformColor.selectorBackground;
            for (let i = 0; i < 4; i++) {
                this.synthVals["envelope"][this.adsrMap[i]] = parseFloat(this.ENVs[i]) / 100;
                docById("myRange" + i).value = parseFloat(this.ENVs[i]);
                docById("myspan" + i).textContent = this.ENVs[i];
                this._update(blockValue, parseFloat(this.ENVs[i]), i);
            }

            this.activity.logo.synth.createSynth(
                0,
                this.instrumentName,
                this.synthVals["oscillator"]["source"],
                this.synthVals
            );
        } else if (this.isActive["amsynth"] === true) {
            docById("synthButtonCell").style.backgroundColor = platformColor.selectorBackground;
            if (this.AMSynthesizer.length > 1) {
                blockValue = this.AMSynthesizer.length - 1;
            }

            docById("myRangeS0").value = parseFloat(this.AMSynthParams[0]);
            docById("myspanS0").textContent = this.AMSynthParams[0];
            this.amSynthParamvals["harmonicity"] = parseFloat(this.AMSynthParams[0]);
            this._update(blockValue, this.AMSynthParams[0], 0);
            this.activity.logo.synth.createSynth(
                0,
                this.instrumentName,
                "amsynth",
                this.amSynthParamvals
            );
        } else if (this.isActive["fmsynth"] === true) {
            docById("synthButtonCell").style.backgroundColor = platformColor.selectorBackground;
            if (this.FMSynthesizer.length > 1) {
                blockValue = this.FMSynthesizer.length - 1;
            }

            docById("myRangeS0").value = parseFloat(this.FMSynthParams[0]);
            docById("myspanS0").textContent = this.FMSynthParams[0];
            this.fmSynthParamvals["modulationIndex"] = parseFloat(this.FMSynthParams[0]);
            this._update(blockValue, this.FMSynthParams[0], 0);
            this.activity.logo.synth.createSynth(
                0,
                this.instrumentName,
                "fmsynth",
                this.fmSynthParamvals
            );
        } else if (this.isActive["noisesynth"] === true) {
            docById("synthButtonCell").style.backgroundColor = platformColor.selectorBackground;
            if (this.NoiseSynthesizer.length > 1) {
                blockValue = this.NoiseSynthesizer.length - 1;
            }

            docById("myRangeS0").value = this.NoiseSynthParams[0];
            docById("myspanS0").textContent = this.NoiseSynthParams[0];
            this.noiseSynthParamvals["noise.type"] = this.NoiseSynthParams[0];
            this._update(blockValue, this.NoiseSynthParams[0], 0);
            this.activity.logo.synth.createSynth(
                0,
                this.instrumentName,
                "noisesynth",
                this.noiseSynthParamvals
            );
        } else if (this.isActive["duosynth"] === true) {
            docById("synthButtonCell").style.backgroundColor = platformColor.selectorBackground;
            if (this.duoSynthesizer.length > 1) {
                blockValue = this.duoSynthesizer.length - 1;
            }

            docById("myRangeS0").value = parseFloat(this.duoSynthParams[0]);
            docById("myspanS0").textContent = this.duoSynthParams[0];
            this.duoSynthParamVals["vibratoRate"] = parseFloat(this.duoSynthParams[0]);
            this._update(blockValue, this.duoSynthParams[0], 0);
            docById("myRangeS1").value = parseFloat(this.duoSynthParams[1]);
            docById("myspanS1").textContent = this.duoSynthParams[1];
            this.duoSynthParamVals["vibratoAmount"] = parseFloat(this.duoSynthParams[1]);
            this._update(blockValue, this.duoSynthParams[1], 1);
            this.activity.logo.synth.createSynth(
                0,
                this.instrumentName,
                "duosynth",
                this.duoSynthParamVals
            );
        } else if (this.isActive["oscillator"]) {
            docById("oscillatorButtonCell").style.backgroundColor =
                platformColor.selectorBackground;
            if (this.osc.length > 1) {
                blockValue = this.osc.length - 1;
            }

            docById("selOsc1").value = DEFAULTOSCILLATORTYPE;
            this._update(blockValue, DEFAULTOSCILLATORTYPE, 0);
            docById("myRangeO0").value = parseFloat(6);
            docById("myspanO0").textContent = "6";
            this._update(blockValue, "6", 1);
            this.synthVals["oscillator"]["type"] = "sine6";
            this.synthVals["oscillator"]["source"] = DEFAULTOSCILLATORTYPE;
            this.activity.logo.synth.createSynth(
                0,
                this.instrumentName,
                this.oscParams[0],
                this.synthVals
            );
        } else if (this.isActive["filter"]) {
            for (let i = 0; i < this.fil.length; i++) {
                docById("filterButtonCell").style.backgroundColor =
                    platformColor.selectorBackground;
                docById("sel" + i).value = this.filterParams[i * 3];
                this._update(i, this.filterParams[i * 3], 0);
                instrumentsFilters[0][this.instrumentName][i]["filterType"] = this.filterParams[
                    i * 3
                ];

                const radioIDs = [i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 3];
                if (this.filterParams[i * 3 + 1] === -12) {
                    docById("radio" + radioIDs[0]).checked = true;
                } else {
                    docById("radio" + radioIDs[0]).checked = false;
                }

                if (this.filterParams[i * 3 + 1] === -24) {
                    docById("radio" + radioIDs[1]).checked = true;
                } else {
                    docById("radio" + radioIDs[1]).checked = false;
                }

                if (this.filterParams[i * 3 + 1] === -48) {
                    docById("radio" + radioIDs[2]).checked = true;
                } else {
                    docById("radio" + radioIDs[2]).checked = false;
                }

                if (this.filterParams[i * 3 + 1] === -96) {
                    docById("radio" + radioIDs[3]).checked = true;
                } else {
                    docById("radio" + radioIDs[3]).checked = false;
                }
                this._update(i, this.filterParams[1 + i * 3], 1);
                instrumentsFilters[0][this.instrumentName][i]["filterRolloff"] = parseFloat(
                    this.filterParams[1 + i * 3]
                );

                docById("myRangeF" + i).value = parseFloat(this.filterParams[2 + i * 3]);
                docById("myspanF" + i).textContent = this.filterParams[2 + i * 3];
                this._update(i, this.filterParams[2 + i * 3], 2);
                instrumentsFilters[0][this.instrumentName][i]["filterFrequency"] = parseFloat(
                    this.filterParams[2 + i * 3]
                );
            }
        } else if (this.isActive["tremolo"] === true) {
            docById("effectsButtonCell").style.backgroundColor = platformColor.selectorBackground;
            if (this.tremoloEffect.length !== 1) {
                blockValue = this.tremoloEffect.length - 1;
            }

            for (let i = 0; i < 2; i++) {
                docById("myRangeFx" + i).value = parseFloat(this.tremoloParams[i]);
                docById("myspanFx" + i).textContent = this.tremoloParams[i];
                this._update(blockValue, this.tremoloParams[i], i);
            }
        } else if (this.isActive["vibrato"] === true) {
            docById("effectsButtonCell").style.backgroundColor = platformColor.selectorBackground;
            if (this.vibratoEffect.length !== 1) {
                blockValue = this.vibratoEffect.length - 1;
            }

            for (let i = 0; i < 2; i++) {
                docById("myRangeFx" + i).value = parseFloat(this.vibratoParams[i]);
                docById("myspanFx" + i).textContent = this.vibratoParams[i];
                this._update(blockValue, this.vibratoParams[i], i);
            }
        } else if (this.isActive["phaser"] === true) {
            docById("effectsButtonCell").style.backgroundColor = platformColor.selectorBackground;
            if (this.phaserEffect.length !== 1) {
                blockValue = this.phaserEffect.length - 1;
            }

            for (let i = 0; i < 3; i++) {
                docById("myRangeFx" + i).value = parseFloat(this.phaserParams[i]);
                docById("myspanFx" + i).textContent = this.phaserParams[i];
                this._update(blockValue, this.phaserParams[i], i);
            }
        } else if (this.isActive["chorus"] === true) {
            docById("effectsButtonCell").style.backgroundColor = platformColor.selectorBackground;
            if (this.chorusEffect.length !== 1) {
                blockValue = this.chorusEffect.length - 1;
            }

            for (let i = 0; i < 3; i++) {
                docById("myRangeFx" + i).value = parseFloat(this.chorusParams[i]);
                docById("myspanFx" + i).textContent = this.chorusParams[i];
                this._update(blockValue, this.chorusParams[i], i);
            }
        } else if (this.isActive["distortion"] === true) {
            docById("effectsButtonCell").style.backgroundColor = platformColor.selectorBackground;
            if (this.distortionEffect.length !== 1) {
                blockValue = this.dstortionEffect.length - 1;
            }

            docById("myRangeFx0").value = parseFloat(this.distortionParams[0]);
            docById("myspanFx0").textContent = this.distortionParams[0];
            this._update(blockValue, this.distortionParams[0], 0);
        }

        this._playNote("G4", 1 / 8);
    }

    /**
     * Initialises the timbre widget.
     * @returns {void}
     */
    init(activity) {
        this.activity = activity;
        this._delta = 0;

        this._playing = false;

        const widgetWindow = window.widgetWindows.windowFor(this, "timbre", "timbre", true);
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        const w = window.innerWidth;
        this._cellScale = w / 1200;

        widgetWindow.getWidgetBody().append(this.timbreTableDiv);
        widgetWindow.getWidgetBody().style.height = "500px";
        widgetWindow.getWidgetBody().style.width = "600px";
        widgetWindow.getWidgetBody().style.overflowY = "auto";

        widgetWindow.onclose = () => {
            this.activity.hideMsgs();
            widgetWindow.destroy();
        };

        this.playButton = widgetWindow.addButton(
            "play-button.svg",
            TimbreWidget.ICONSIZE,
            _("Play")
        );

        this.playButton.onclick = () => {
            this._play();
        };

        widgetWindow.addButton(
            "export-chunk.svg",
            TimbreWidget.ICONSIZE,
            _("Save")
        ).onclick = () => {
            this._save();
        };

        let _unhighlightButtons; // defined later to avoid circular dependency

        const synthButtonCell = widgetWindow.addButton(
            "synth.svg",
            TimbreWidget.ICONSIZE,
            _("Synthesizer")
        );
        synthButtonCell.id = "synthButtonCell";
        this.isActive["synth"] = false;

        synthButtonCell.onclick = () => {
            _unhighlightButtons();
            for (let i = 0; i < this.activeParams.length; i++) {
                this.isActive[this.activeParams[i]] = false;
            }

            this.isActive["synth"] = true;

            if (this.osc.length === 0) {
                this._synth();
            } else {
                this.activity.errorMsg(_("Unable to use synth due to existing oscillator"));
            }
        };

        const oscillatorButtonCell = widgetWindow.addButton(
            "oscillator.svg",
            TimbreWidget.ICONSIZE,
            _("Oscillator")
        );
        oscillatorButtonCell.id = "oscillatorButtonCell";
        this.isActive["oscillator"] = false;

        oscillatorButtonCell.onclick = async () => {
            _unhighlightButtons();
            for (let i = 0; i < this.activeParams.length; i++) {
                this.isActive[this.activeParams[i]] = false;
            }

            this.isActive["oscillator"] = true;

            if (this.osc.length === 0) {
                const topOfClamp = this.activity.blocks.blockList[this.blockNo].connections[2];
                const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                const OSCILLATOROBJ = [
                    [0, ["oscillator", {}], 0, 0, [null, 2, 1, null]],
                    [1, ["number", { value: 6 }], 0, 0, [0]],
                    [2, ["oscillatortype", { value: DEFAULTOSCILLATORTYPE }], 0, 0, [0]]
                ];
                this.activity.blocks.loadNewBlocks(OSCILLATOROBJ);

                await delayExecution(100);
                const n = this.activity.blocks.blockList.length - 3;
                this.osc.push(n);
                this.oscParams.push(DEFAULTOSCILLATORTYPE);
                this.oscParams.push(6);

                await delayExecution(500);
                this.blockConnection(3, bottomOfClamp);

                this._oscillator(true);
            } else {
                this._oscillator(false);
            }

            if (
                this.osc.length !== 0 &&
                (this.AMSynthesizer.length !== 0 ||
                    this.FMSynthesizer.length !== 0 ||
                    this.duoSynthesizer.length !== 0)
            ) {
                this._oscillator(false);
            }
        };

        const envelopeButtonCell = widgetWindow.addButton(
            "envelope.svg",
            TimbreWidget.ICONSIZE,
            _("Envelope")
        );
        envelopeButtonCell.id = "envelopeButtonCell";
        this.isActive["envelope"] = false;

        envelopeButtonCell.onclick = async () => {
            _unhighlightButtons();
            for (let i = 0; i < this.activeParams.length; i++) {
                this.isActive[this.activeParams[i]] = false;
            }

            this.isActive["envelope"] = true;

            if (this.env.length === 0) {
                const topOfClamp = this.activity.blocks.blockList[this.blockNo].connections[2];
                const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                const ENVOBJ = [
                    [0, ["envelope", {}], 0, 0, [null, 1, 2, 3, 4, null]],
                    [1, ["number", { value: 1 }], 0, 0, [0]],
                    [2, ["number", { value: 50 }], 0, 0, [0]],
                    [3, ["number", { value: 60 }], 0, 0, [0]],
                    [4, ["number", { value: 1 }], 0, 0, [0]]
                ];
                this.activity.blocks.loadNewBlocks(ENVOBJ);

                await delayExecution(100);
                const n = this.activity.blocks.blockList.length - 5;
                this.env.push(n);
                this.ENVs.push(1);
                this.ENVs.push(50);
                this.ENVs.push(60);
                this.ENVs.push(1);

                await delayExecution(500);
                this.blockConnection(5, bottomOfClamp);

                this._envelope(true); // create a new synth instrument
            } else {
                this._envelope(false);
            }
        };

        const effectsButtonCell = widgetWindow.addButton(
            "effects.svg",
            TimbreWidget.ICONSIZE,
            _("Effects")
        );
        effectsButtonCell.id = "effectsButtonCell";
        this.isActive["effects"] = false;

        effectsButtonCell.onclick = () => {
            _unhighlightButtons();
            for (let i = 0; i < this.activeParams.length; i++) {
                this.isActive[this.activeParams[i]] = false;
            }

            this.isActive["effects"] = true;
            this._effects();
        };

        const filterButtonCell = widgetWindow.addButton(
            "filter.svg",
            TimbreWidget.ICONSIZE,
            _("Filter")
        );
        filterButtonCell.id = "filterButtonCell";
        this.isActive["filter"] = false;

        filterButtonCell.onclick = async () => {
            _unhighlightButtons();
            for (let i = 0; i < this.activeParams.length; i++) {
                this.isActive[this.activeParams[i]] = false;
            }

            this.isActive["filter"] = true;

            if (this.fil.length === 0) {
                const topOfClamp = this.activity.blocks.blockList[this.blockNo].connections[2];
                const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                const FILTEROBJ = [
                    [0, ["filter", {}], 0, 0, [null, 3, 1, 2, null]],
                    [1, ["number", { value: -12 }], 0, 0, [0]],
                    [2, ["number", { value: 392 }], 0, 0, [0]],
                    [3, ["filtertype", { value: DEFAULTFILTERTYPE }], 0, 0, [0]]
                ];
                this.activity.blocks.loadNewBlocks(FILTEROBJ);

                await delayExecution(100);
                const n = this.activity.blocks.blockList.length - 4;
                this.fil.push(n);
                this.filterParams.push(DEFAULTFILTERTYPE);
                this.filterParams.push(-12);
                this.filterParams.push(392);

                await delayExecution(500);
                this.blockConnection(4, bottomOfClamp);
            }

            this._filter();
        };

        const addFilterButtonCell = widgetWindow.addButton(
            "filter+.svg",
            TimbreWidget.ICONSIZE,
            _("Add filter")
        );
        addFilterButtonCell.style.backgroundColor = "#808080";

        addFilterButtonCell.onclick = () => {
            if (this.isActive["filter"]) {
                this._addFilter();
            }
        };

        addFilterButtonCell.onmouseover = () => {};

        addFilterButtonCell.onmouseout = () => {};

        widgetWindow.addButton(
            "restore-button.svg",
            TimbreWidget.ICONSIZE,
            _("Undo")
        ).onclick = () => {
            this._undo();
        };

        // let cell = this._addButton(row, 'close-button.svg', TimbreWidget.ICONSIZE, _('Close'));

        // cell.onclick = function () {
        //     docById('timbreDiv').style.visibility = 'hidden';
        //     docById('timbreButtonsDiv').style.visibility = 'hidden';
        //     docById('this.timbreTableDiv').style.visibility = 'hidden';
        //     docById('timbreName').classList.remove('hasKeyboard');
        //     this.activity.logo.hideMsgs();
        // };

        _unhighlightButtons = () => {
            addFilterButtonCell.style.backgroundColor = "#808080";
            synthButtonCell.style.backgroundColor = platformColor.selectorBackground;
            oscillatorButtonCell.style.backgroundColor = platformColor.selectorBackground;
            envelopeButtonCell.style.backgroundColor = platformColor.selectorBackground;
            effectsButtonCell.style.backgroundColor = platformColor.selectorBackground;
            filterButtonCell.style.backgroundColor = platformColor.selectorBackground;
        };

        this.activity.textMsg(_("Click on buttons to open the timbre design tools."));
        widgetWindow.sendToCenter();
    }

    /**
     * @public
     * Method pertaining to adjusting the timbre block clamp after adding blocks.
     * @param {number} n
     * @param {number} clamp
     * @param {number} topOfClamp
     * @returns {void}
     */
    clampConnection = async (n, clamp, topOfClamp) => {
        // Connect the clamp to the Widget block.
        this.activity.blocks.blockList[this.blockNo].connections[2] = n;
        this.activity.blocks.blockList[n].connections[0] = this.blockNo;

        // If there were blocks in the Widget, move them inside the clamp.
        if (topOfClamp != null) {
            this.activity.blocks.blockList[n].connections[clamp] = topOfClamp;
            this.activity.blocks.blockList[topOfClamp].connections[0] = n;
        }

        // Adjust the clamp sizes and positions.
        this.activity.blocks.clampBlocksToCheck.push([n, 0]);
        this.activity.blocks.clampBlocksToCheck.push([this.blockNo, 0]);

        await delayExecution(500);
        this.activity.blocks.adjustExpandableClampBlock();
        this.activity.blocks.adjustDocks(this.blockNo, true);
    }

    /**
     * @public
     * Method pertaining to adjusting timbre block clamp and effects block clamp sizes after adding blocks.
     * @param {number} oldblk
     * @param {number} newblk
     * @param {number} topOfClamp
     * @returns {void}
     */
    clampConnectionVspace = async (n, vspace, topOfClamp) => {
        // Connect the clamp to the Widget block.
        this.activity.blocks.blockList[this.blockNo].connections[2] = n;
        this.activity.blocks.blockList[n].connections[0] = this.blockNo;

        // If there were blocks in the Widget, move them inside the clamp.
        if (topOfClamp != null) {
            this.activity.blocks.blockList[vspace].connections[1] = topOfClamp;
            this.activity.blocks.blockList[topOfClamp].connections[0] = vspace;
        }

        // Adjust the clamp sizes and positions.
        this.activity.blocks.clampBlocksToCheck.push([n, 0]);
        this.activity.blocks.clampBlocksToCheck.push([this.blockNo, 0]);

        await delayExecution(500);
        this.activity.blocks.adjustExpandableClampBlock();
        this.activity.blocks.adjustDocks(this.blockNo, true);
    }

    /**
     * @private
     * Method pertaining to changing blocks depending on Synthesizer.
     * @param {number} newblk
     * @param {string} synthChosen
     * @param {number} bottomOfClamp
     * @returns {void}
     */
    _changeBlock(newblk, synthChosen, bottomOfClamp) {
        let lastBlk = 0;
        if (this.AMSynthesizer.length !== 0 && synthChosen !== "AMSynth") {
            lastBlk = this.AMSynthesizer.pop();
            setTimeout(this._blockReplace(lastBlk, newblk), 500);
        } else if (this.FMSynthesizer.length !== 0 && synthChosen !== "FMSynth") {
            lastBlk = this.FMSynthesizer.pop();
            setTimeout(this._blockReplace(lastBlk, newblk), 500);
        } else if (this.duoSynthesizer.length !== 0 && synthChosen !== "DuoSynth") {
            lastBlk = this.duoSynthesizer.pop();
            setTimeout(this._blockReplace(lastBlk, newblk), 500);
        } else if (synthChosen === "FMSynth" || synthChosen === "AMSynth") {
            setTimeout(this.blockConnection(2, bottomOfClamp), 500);
        } else {
            setTimeout(this.blockConnection(3, bottomOfClamp), 500);
        }
    }

    /**
     * @private
     * Method pertaining to replacing blocks.
     * @param {number} oldblk
     * @param {number} newblk
     * @returns {void}
     */
    _blockReplace(oldblk, newblk) {
        // Find the connections from the old block
        const c0 = this.activity.blocks.blockList[oldblk].connections[0];
        const c1 = last(this.activity.blocks.blockList[oldblk].connections);

        // Connect the new block
        this.activity.blocks.blockList[newblk].connections[0] = c0;
        this.activity.blocks.blockList[newblk].connections[
            this.activity.blocks.blockList[newblk].connections.length - 1
        ] = c1;

        if (c0 != null) {
            for (let i = 0; i < this.activity.blocks.blockList[c0].connections.length; i++) {
                if (this.activity.blocks.blockList[c0].connections[i] === oldblk) {
                    this.activity.blocks.blockList[c0].connections[i] = newblk;
                    break;
                }
            }

            // Look for a containing clamp, which may need to be resized.
            let blockAbove = c0;
            while (blockAbove != this.blockNo) {
                if (this.activity.blocks.blockList[blockAbove].isClampBlock()) {
                    this.activity.blocks.clampBlocksToCheck.push([blockAbove, 0]);
                }

                blockAbove = this.activity.blocks.blockList[blockAbove].connections[0];
            }

            this.activity.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        }

        if (c1 != null) {
            for (let i = 0; i < this.activity.blocks.blockList[c1].connections.length; i++) {
                if (this.activity.blocks.blockList[c1].connections[i] === oldblk) {
                    this.activity.blocks.blockList[c1].connections[i] = newblk;
                    break;
                }
            }
        }

        // Refresh the dock positions
        this.activity.blocks.adjustDocks(c0, true);

        // Send the old block to the trash
        this.activity.blocks.blockList[oldblk].connections[0] = null;
        this.activity.blocks.blockList[oldblk].connections[
            this.activity.blocks.blockList[oldblk].connections.length - 1
        ] = null;
        this.activity.blocks.sendStackToTrash(this.activity.blocks.blockList[oldblk]);

        this.activity.refreshCanvas();
    }

    /**
     * @public
     * Method pertaining to adjusting block connections
     * @param {number} len
     * @param {number} bottomOfClamp
     * @returns {void}
     */
    blockConnection = async (len, bottomOfClamp) => {
        const n = this.activity.blocks.blockList.length - len;
        if (bottomOfClamp == null) {
            this.activity.blocks.blockList[this.blockNo].connections[2] = n;
            this.activity.blocks.blockList[n].connections[0] = this.blockNo;
        } else {
            let c = this.activity.blocks.blockList[bottomOfClamp].connections.length - 1;
            // Check for nested clamps.
            // A hidden block is attached to the bottom of each clamp.
            // But don't go inside a note block.
            while (
                this.activity.blocks.blockList[bottomOfClamp].name === "hidden" &&
                this.activity.blocks.blockList[
                    this.activity.blocks.blockList[bottomOfClamp].connections[0]
                ].name !== "newnote"
            ) {
                const cblk = this.activity.blocks.blockList[bottomOfClamp].connections[0];
                c = this.activity.blocks.blockList[cblk].connections.length - 2;
                this.activity.blocks.clampBlocksToCheck.push([cblk, 0]);
                if (this.activity.blocks.blockList[cblk].connections[c] == null) {
                    bottomOfClamp = cblk;
                } else {
                    // Find bottom of stack
                    bottomOfClamp = this.activity.blocks.findBottomBlock(
                        this.activity.blocks.blockList[cblk].connections[c]
                    );
                    c = this.activity.blocks.blockList[bottomOfClamp].connections.length - 1;
                }
            }

            this.activity.blocks.blockList[bottomOfClamp].connections[c] = n;
            this.activity.blocks.blockList[n].connections[0] = bottomOfClamp;
        }

        this.activity.blocks.clampBlocksToCheck.push([this.blockNo, 0]);

        await delayExecution(1000);
        this.activity.blocks.adjustExpandableClampBlock();
        this.activity.blocks.adjustDocks(this.blockNo, true);
        this.activity.refreshCanvas();
    }

    /**
     * @private
     * @returns {void}
     * Method that lets you choose between an AM synth, a PM synth, or a Duo synth.
     */
    _synth = () => {
        let blockValue = 0;

        docById("synthButtonCell").style.backgroundColor = "#C8C8C8";
        docById("synthButtonCell").onmouseover = () => {};
        docById("synthButtonCell").onmouseout = () => {};

        this.timbreTableDiv.style.display = "inline";
        this.timbreTableDiv.style.visibility = "visible";
        this.timbreTableDiv.style.border = "0px";
        this.timbreTableDiv.style.overflow = "auto";
        this.timbreTableDiv.style.backgroundColor = "white";
        this.timbreTableDiv.style.height = "300px";
        this.timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        const env = docById("timbreTable");
        let htmlElements = "";
        for (let i = 0; i < 2; i++) {
            htmlElements += '<div id ="synth' + i + '"></div>';
        }

        env.innerHTML = htmlElements;
        const envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = platformColor.selectorBackground;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        const mainDiv = docById("synth0");
        mainDiv.innerHTML =
            '<p><input type="radio" name="synthsName" value="AMSynth"/>' +
            _("AM synth") +
            '</br><input type="radio" name="synthsName" value="FMSynth"/>' +
            _("FM synth") +
            '</br><input type="radio" name="synthsName" value="DuoSynth"/>' +
            _("duo synth") +
            "</br></p>";

        const subDiv = docById("synth1");
        const synthsName = docByName("synthsName");
        let synthChosen;
        for (let i = 0; i < synthsName.length; i++) {
            synthsName[i].onclick = async (event) => {
                synthChosen = event.target.value;
                let subHtmlElements = '<div id="chosen">' + synthChosen + "</div>";
                for (let j = 0; j < this.activeParams.length; j++) {
                    this.isActive[this.activeParams[j]] = false;
                }
                this.isActive["synth"] = true;

                if (synthChosen === "AMSynth") {
                    this.isActive["amsynth"] = true;
                    this.isActive["fmsynth"] = false;
                    this.isActive["duosynth"] = false;

                    if (this.AMSynthesizer.length === 0) {
                        const topOfClamp = this.activity.blocks.blockList[this.blockNo]
                            .connections[2];
                        const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                        const AMSYNTHOBJ = [
                            [0, ["amsynth", {}], 0, 0, [null, 1, null]],
                            [1, ["number", { value: 1 }], 0, 0, [0]]
                        ];
                        this.activity.blocks.loadNewBlocks(AMSYNTHOBJ);

                        await delayExecution(100);
                        const n = this.activity.blocks.blockList.length - 2;
                        this.AMSynthesizer.push(n);
                        this.AMSynthParams.push(1);

                        this._changeBlock(last(this.AMSynthesizer), synthChosen, bottomOfClamp);
                        this.amSynthParamvals["harmonicity"] = parseFloat(this.AMSynthParams[0]);
                        this.activity.logo.synth.createSynth(
                            0,
                            this.instrumentName,
                            "amsynth",
                            this.amSynthParamvals
                        );
                    }

                    subHtmlElements +=
                        '<div id="wrapperS0"><div id="sS0"><span>' +
                        _("harmonicity") +
                        '</span></div><div class="insideDivSynth"><input type="range" id="myRangeS0" class="sliders" style="margin-top:20px" value="' +
                        parseFloat(this.AMSynthParams[0]) +
                        '"><span id="myspanS0" class="rangeslidervalue">' +
                        this.AMSynthParams[0] +
                        "</span></div></div>";
                    subDiv.innerHTML = subHtmlElements;

                    // docById('myRangeS0').value = parseFloat(this.AMSynthParams[0]);
                    // docById('myspanS0').textContent = this.AMSynthParams[0];

                    this.amSynthParamvals["harmonicity"] = parseFloat(this.AMSynthParams[0]);

                    if (this.AMSynthesizer.length !== 1) {
                        blockValue = this.AMSynthesizer.length - 1;
                    }

                    document.getElementById("wrapperS0").addEventListener("change", (event) => {
                        docById("synthButtonCell").style.backgroundColor = "#C8C8C8";
                        const elem = event.target;
                        docById("myRangeS0").value = parseFloat(elem.value);
                        this.amSynthParamvals["harmonicity"] = parseFloat(elem.value);
                        docById("myspanS0").textContent = elem.value;
                        this._update(blockValue, elem.value, 0);
                        this.activity.logo.synth.createSynth(
                            0,
                            this.instrumentName,
                            "amsynth",
                            this.amSynthParamvals
                        );
                        this._playNote("G4", 1 / 8);
                    });
                } else if (synthChosen === "FMSynth") {
                    this.isActive["amsynth"] = false;
                    this.isActive["fmsynth"] = true;
                    this.isActive["duosynth"] = false;

                    if (this.FMSynthesizer.length === 0) {
                        const topOfClamp = this.activity.blocks.blockList[this.blockNo]
                            .connections[2];
                        const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                        const FMSYNTHOBJ = [
                            [0, ["fmsynth", {}], 0, 0, [null, 1, null]],
                            [1, ["number", { value: 10 }], 0, 0, [0]]
                        ];
                        this.activity.blocks.loadNewBlocks(FMSYNTHOBJ);

                        await delayExecution(100);
                        const n = this.activity.blocks.blockList.length - 2;
                        this.FMSynthesizer.push(n);
                        this.FMSynthParams.push(10);

                        this._changeBlock(last(this.FMSynthesizer), synthChosen, bottomOfClamp);
                        this.fmSynthParamvals["modulationIndex"] = parseFloat(
                            this.FMSynthParams[0]
                        );
                        this.activity.logo.synth.createSynth(
                            0,
                            this.instrumentName,
                            "fmsynth",
                            this.fmSynthParamvals
                        );
                    }

                    subHtmlElements +=
                        '<div id="wrapperS0"><div id="sS0"><span>' +
                        _("modulation index") +
                        '</span></div><div class="insideDivSynth"><input type="range" id="myRangeS0" class="sliders" style="margin-top:20px" value="' +
                        parseFloat(this.FMSynthParams[0]) +
                        '"><span id="myspanS0" class="rangeslidervalue">' +
                        this.FMSynthParams[0] +
                        "</span></div></div>";
                    subDiv.innerHTML = subHtmlElements;

                    // docById('myRangeS0').value = parseFloat(this.FMSynthParams[0]);
                    // docById('myspanS0').textContent = this.FMSynthParams[0];

                    this.fmSynthParamvals["modulationIndex"] = parseFloat(this.FMSynthParams[0]);

                    if (this.FMSynthesizer.length !== 1) {
                        blockValue = this.FMSynthesizer.length - 1;
                    }

                    document.getElementById("wrapperS0").addEventListener("change", (event) => {
                        docById("synthButtonCell").style.backgroundColor = "#C8C8C8";
                        const elem = event.target;
                        docById("myRangeS0").value = parseFloat(elem.value);
                        docById("myspanS0").textContent = elem.value;
                        this.fmSynthParamvals["modulationIndex"] = parseFloat(elem.value);
                        this._update(blockValue, elem.value, 0);
                        this.activity.logo.synth.createSynth(
                            0,
                            this.instrumentName,
                            "fmsynth",
                            this.fmSynthParamvals
                        );
                        this._playNote("G4", 1 / 8);
                    });
                } else if (synthChosen === "NoiseSynth") {
                    this.isActive["amsynth"] = false;
                    this.isActive["fmsynth"] = false;
                    this.isActive["noisesynth"] = true;
                    this.isActive["duosynth"] = false;

                    if (this.NoiseSynthesizer.length === 0) {
                        const topOfClamp = this.activity.blocks.blockList[this.blockNo]
                            .connections[2];
                        const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                        const NOISESYNTHOBJ = [
                            [0, ["noisesynth", {}], 0, 0, [null, 1, null]],
                            [1, ["number", { value: 10 }], 0, 0, [0]]
                        ];
                        this.activity.blocks.loadNewBlocks(NOISESYNTHOBJ);

                        await delayExecution(100);
                        const n = this.activity.blocks.blockList.length - 2;
                        this.NoiseSynthesizer.push(n);
                        this.NoiseSynthParams.push("white");

                        this._changeBlock(last(this.NoiseSynthesizer), synthChosen, bottomOfClamp);
                        this.noiseSynthParamvals["noise.type"] = this.NoiseSynthParams[0];
                        this.activity.logo.synth.createSynth(
                            0,
                            this.instrumentName,
                            "noisesynth",
                            this.noiseSynthParamvals
                        );
                    }

                    subHtmlElements +=
                        '<div id="wrapperS0"><div id="sS0"><span>' +
                        _("modulation index") +
                        '</span></div><div class="insideDivSynth"><input type="range" id="myRangeS0" class="sliders" style="margin-top:20px" value="' +
                        this.NoiseSynthParams[0] +
                        '"><span id="myspanS0" class="rangeslidervalue">' +
                        this.NoiseSynthParams[0] +
                        "</span></div></div>";
                    subDiv.innerHTML = subHtmlElements;

                    // docById('myRangeS0').value = parseFloat(this.FMSynthParams[0]);
                    // docById('myspanS0').textContent = this.FMSynthParams[0];

                    this.noiseSynthParamvals["noise.type"] = this.NoiseSynthParams[0];

                    if (this.NoiseSynthesizer.length !== 1) {
                        blockValue = this.NoiseSynthesizer.length - 1;
                    }

                    document.getElementById("wrapperS0").addEventListener("change", (event) => {
                        docById("synthButtonCell").style.backgroundColor = "#C8C8C8";
                        const elem = event.target;
                        docById("myRangeS0").value = parseFloat(elem.value);
                        docById("myspanS0").textContent = elem.value;
                        this.noiseSynthParamvals["noise.type"] = parseFloat(elem.value);
                        this._update(blockValue, elem.value, 0);
                        this.activity.logo.synth.createSynth(
                            0,
                            this.instrumentName,
                            "noisesynth",
                            this.noiseSynthParamvals
                        );
                        this._playNote(1 / 8);
                    });
                } else if (synthChosen === "DuoSynth") {
                    this.isActive["amsynth"] = false;
                    this.isActive["fmsynth"] = false;
                    this.isActive["duosynth"] = true;

                    if (this.duoSynthesizer.length === 0) {
                        const topOfClamp = this.activity.blocks.blockList[this.blockNo]
                            .connections[2];
                        const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                        const DUOSYNTHOBJ = [
                            [0, ["duosynth", {}], 0, 0, [null, 1, 2, null]],
                            [1, ["number", { value: 10 }], 0, 0, [0]],
                            [2, ["number", { value: 6 }], 0, 0, [0]]
                        ];
                        this.activity.blocks.loadNewBlocks(DUOSYNTHOBJ);

                        await delayExecution(100);
                        const n = this.activity.blocks.blockList.length - 3;
                        this.duoSynthesizer.push(n);
                        this.duoSynthParams.push(10);
                        this.duoSynthParams.push(6);

                        this._changeBlock(last(this.duoSynthesizer), synthChosen, bottomOfClamp);
                        this.duoSynthParamVals["vibratoRate"] = parseFloat(this.duoSynthParams[0]);
                        this.duoSynthParamVals["vibratoAmount"] = parseFloat(
                            this.duoSynthParams[1]
                        );
                        this.activity.logo.synth.createSynth(
                            0,
                            this.instrumentName,
                            "duosynth",
                            this.duoSynthParamVals
                        );
                    }

                    subHtmlElements +=
                        '<div id="wrapperS0"><div id="sS0"><span>' +
                        _("vibrato rate") +
                        '</span></div><div class="insideDivSynth"><input type="range" id="myRangeS0" class="sliders" style="margin-top:20px" value="' +
                        parseFloat(this.duoSynthParams[0]) +
                        '"><span id="myspanS0" class="rangeslidervalue">' +
                        this.duoSynthParams[0] +
                        "</span></div></div>";
                    subHtmlElements +=
                        '<div id="wrapperS1"><div id="sS1"><span>' +
                        _("vibrato amount") +
                        '</span></div><div class="insideDivSynth"><input type="range" id="myRangeS1" class="sliders" style="margin-top:20px" value="' +
                        parseFloat(this.duoSynthParams[1]) +
                        '"><span id="myspanS1" class="rangeslidervalue">' +
                        this.duoSynthParams[1] +
                        "</span></div></div>";
                    subDiv.innerHTML = subHtmlElements;

                    if (this.duoSynthesizer.length !== 1) {
                        blockValue = this.duoSynthesizer.length - 1;
                    }

                    this.duoSynthParamVals["vibratoRate"] = parseFloat(this.duoSynthParams[0]);
                    this.duoSynthParamVals["vibratoAmount"] = parseFloat(this.duoSynthParams[1]);

                    for (let i = 0; i < 2; i++) {
                        document
                            .getElementById("wrapperS" + i)
                            .addEventListener("change", (event) => {
                                docById("synthButtonCell").style.backgroundColor = "#C8C8C8";
                                const elem = event.target;
                                const m = elem.id.slice(-1);
                                docById("myRangeS" + m).value = parseFloat(elem.value);
                                if (m === 0) {
                                    this.duoSynthParamVals["vibratoRate"] = parseFloat(elem.value);
                                } else if (m === 1) {
                                    this.duoSynthParamVals["vibratoAmount"] = parseFloat(
                                        elem.value
                                    );
                                }

                                docById("myspanS" + m).textContent = elem.value;
                                this._update(blockValue, elem.value, Number(m));
                                this.activity.logo.synth.createSynth(
                                    0,
                                    this.instrumentName,
                                    "duosynth",
                                    this.duoSynthParamVals
                                );
                                this._playNote("G4", 1 / 8);
                            });
                    }
                }
            };
        }
    }

    /**
     * @private
     * @returns {void}
     * @param {boolean} newOscillator
     */
    _oscillator(newOscillator) {
        let blockValue = 0;

        if (this.osc.length !== 1) {
            blockValue = this.osc.length - 1;
        }

        docById("oscillatorButtonCell").style.backgroundColor = "#C8C8C8";
        docById("oscillatorButtonCell").onmouseover = () => {};
        docById("oscillatorButtonCell").onmouseout = () => {};

        this.timbreTableDiv.style.display = "inline";
        this.timbreTableDiv.style.visibility = "visible";
        this.timbreTableDiv.style.border = "0px";
        this.timbreTableDiv.style.overflow = "auto";
        this.timbreTableDiv.style.backgroundColor = "white";
        this.timbreTableDiv.style.height = "300px";
        this.timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        const env = docById("timbreTable");
        let htmlElements =
            '<div id="wrapperOsc0"><div id="sOsc0"><span>' +
            _("type") +
            '</span></div><div id="selOsc"></div></div>';
        htmlElements +=
            '<div id="wrapperOsc1"><div id="sOsc1"><span>' +
            _("partials") +
            '</span></div><div class="insideDivOsc"><input type="range" id="myRangeO0" class="sliders" style="margin-top:20px" min="0" max="20" value="' +
            parseFloat(this.oscParams[1]) +
            '"><span id="myspanO0" class="rangeslidervalue">' +
            this.oscParams[1] +
            "</span></div></div>";

        env.innerHTML = htmlElements;
        const envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = platformColor.selectorBackground;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        const myDiv = docById("selOsc");
        let selectOpt = '<select id="selOsc1">';

        for (let i = 0; i < OSCTYPES.length; i++) {
            // work around some weird i18n bug
            if (OSCTYPES[i][0].length === 0) {
                if (OSCTYPES[i][0] === this.oscParams[0] || OSCTYPES[i][1] === this.oscParams[0]) {
                    selectOpt +=
                        '<option value="' +
                        OSCTYPES[i][1] +
                        '" selected>' +
                        OSCTYPES[i][1] +
                        "</option>";
                } else {
                    selectOpt +=
                        '<option value="' + OSCTYPES[i][1] + '">' + OSCTYPES[i][1] + "</option>";
                }
            } else {
                if (OSCTYPES[i][0] === this.oscParams[0] || OSCTYPES[i][1] === this.oscParams[0]) {
                    selectOpt +=
                        '<option value="' +
                        OSCTYPES[i][0] +
                        '" selected>' +
                        OSCTYPES[i][0] +
                        "</option>";
                } else {
                    selectOpt +=
                        '<option value="' + OSCTYPES[i][0] + '">' + OSCTYPES[i][0] + "</option>";
                }
            }
        }

        selectOpt += "</select>";

        myDiv.innerHTML = selectOpt;

        document.getElementById("wrapperOsc0").addEventListener("change", (event) => {
            docById("oscillatorButtonCell").style.backgroundColor = "#C8C8C8";
            const elem = event.target;
            this.oscParams[0] = elem.value;
            this.synthVals["oscillator"]["type"] = elem.value + this.oscParams[1].toString();
            this.synthVals["oscillator"]["source"] = elem.value;
            this._update(blockValue, elem.value, 0);
            this.activity.logo.synth.createSynth(
                0,
                this.instrumentName,
                this.oscParams[0],
                this.synthVals
            );
            this._playNote("G4", 1 / 8);
        });

        document.getElementById("wrapperOsc1").addEventListener("change", (event) => {
            docById("oscillatorButtonCell").style.backgroundColor = "#C8C8C8";
            const elem = event.target;
            this.oscParams[1] = parseFloat(elem.value);
            this.synthVals["oscillator"]["type"] = this.oscParams[0] + parseFloat(elem.value);
            docById("myRangeO0").value = parseFloat(elem.value);
            docById("myspanO0").textContent = elem.value;
            this._update(blockValue, elem.value, 1);
            this.activity.logo.synth.createSynth(
                0,
                this.instrumentName,
                this.oscParams[0],
                this.synthVals
            );
            this._playNote("G4", 1 / 8);
        });

        docById("selOsc1").value = this.oscParams[0];
        this._update(blockValue, this.oscParams[0], 0);
        this._update(blockValue, this.oscParams[1], 1);
        this.synthVals["oscillator"]["type"] = this.oscParams[0] + this.oscParams[1].toString();
        this.synthVals["oscillator"]["source"] = this.oscParams[0];

        if (newOscillator) {
            this.activity.logo.synth.createSynth(
                0,
                this.instrumentName,
                this.oscParams[0],
                this.synthVals
            );
        }
    }

    /**
     * @private
     * @returns {void}
     * Adds and updates filters
     * @param {boolean} newEnvelope
     */
    _envelope(newEnvelope) {
        let blockValue = 0;

        if (this.env.length !== 1) {
            blockValue = this.env.length - 1;
        }

        docById("envelopeButtonCell").style.backgroundColor = "#C8C8C8";
        docById("envelopeButtonCell").onmouseover = () => {};
        docById("envelopeButtonCell").onmouseout = () => {};

        this.timbreTableDiv.style.display = "inline";
        this.timbreTableDiv.style.visibility = "visible";
        this.timbreTableDiv.style.border = "0px";
        this.timbreTableDiv.style.overflow = "auto";
        this.timbreTableDiv.style.backgroundColor = "white";
        this.timbreTableDiv.style.height = "300px";
        this.timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        const env = docById("timbreTable");
        let htmlElements = "";
        for (let i = 0; i < 4; i++) {
            htmlElements +=
                '<div id="wrapperEnv' +
                i +
                '"><div class="circle">' +
                "ADSR".charAt(i) +
                '</div><div class="insideDivEnv"><input type="range" id="myRange' +
                i +
                '" class="sliders" style="margin-top:20px" value="' +
                parseFloat(this.ENVs[i]) +
                '"><span id="myspan' +
                i +
                '" class="rangeslidervalue">' +
                this.ENVs[i] +
                "</span></div></div>";
        }

        env.innerHTML = htmlElements;
        const envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = platformColor.selectorBackground;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        for (let i = 0; i < 4; i++) {
            this.synthVals["envelope"][this.adsrMap[i]] = parseFloat(this.ENVs[i]) / 100;
            this._update(blockValue, this.ENVs[i], i);
        }

        for (let i = 0; i < 4; i++) {
            document.getElementById("wrapperEnv" + i).addEventListener("change", (event) => {
                docById("envelopeButtonCell").style.backgroundColor = "#C8C8C8";
                const elem = event.target;
                const m = elem.id.slice(-1);
                docById("myRange" + m).value = parseFloat(elem.value);
                docById("myspan" + m).textContent = elem.value;
                this.synthVals["envelope"][this.adsrMap[m]] = parseFloat(elem.value) / 100;
                this._update(blockValue, parseFloat(elem.value), m);
                this.activity.logo.synth.createSynth(
                    0,
                    this.instrumentName,
                    this.synthVals["oscillator"]["source"],
                    this.synthVals
                );
                this._playNote("G4", 1 / 8);
            });
        }

        if (newEnvelope) {
            this.activity.logo.synth.createSynth(
                0,
                this.instrumentName,
                this.synthVals["oscillator"]["source"],
                this.synthVals
            );
        }
    }

    /**
     * @private
     * @returns {void}
     * Adds and updates filters
     */
    _filter() {
        docById("filterButtonCell").style.backgroundColor = "#C8C8C8";
        docById("filterButtonCell").onmouseover = () => {};
        docById("filterButtonCell").onmouseout = () => {};

        this.timbreTableDiv.style.display = "inline";
        this.timbreTableDiv.style.visibility = "visible";
        this.timbreTableDiv.style.border = "0px";
        this.timbreTableDiv.style.overflow = "auto";
        this.timbreTableDiv.style.backgroundColor = "white";
        this.timbreTableDiv.style.height = "300px";
        this.timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        const env = docById("timbreTable");
        env.innerHTML = "";

        for (let f = 0; f < this.fil.length; f++) {
            this._createFilter(f, env);
        }

        this._addFilterListeners();
        this._updateFilters();
    }

    /**
     * @private
     * @returns {void}
     * Creates filters for the given configuration.
     * @param {number} f rolloff paramaneters
     * @param {HTMLElement} env
     */
    _createFilter(f, env) {
        const wrapperIDs = [f * 3, f * 3 + 1, f * 3 + 2];
        const radioIDs = [f * 4, f * 4 + 1, f * 4 + 2, f * 4 + 3];

        let htmlElements;
        if (f % 2 === 1) {
            htmlElements = '<div class="rectangle"><p>&nbsp;</p>';
        } else if (f > 0) {
            htmlElements = "<div><p>&nbsp;</p>";
        } else {
            htmlElements = "<div>";
        }

        const selectorID = "selector" + f;
        const selID = "sel" + f;

        htmlElements +=
            '<div class="wrapper" id="wrapper' +
            wrapperIDs[0] +
            '"><div class="s" id="s' +
            wrapperIDs[0] +
            '"><span>' +
            _("type") +
            '</span></div><div class="filterselector" id="' +
            selectorID +
            '"></div></div>';
        htmlElements +=
            '<div class="wrapper" id="wrapper' +
            wrapperIDs[1] +
            '"><div class="s" id="s' +
            wrapperIDs[1] +
            '"><span>' +
            _("rolloff") +
            '</span></div><div class="insideDivFilter"><p><input id="radio' +
            radioIDs[0] +
            '" type="radio" name="rolloff' +
            f +
            '" value="-12" checked="checked"/>-12<input  id="radio' +
            radioIDs[1] +
            '" type="radio" name="rolloff' +
            f +
            '" value="-24"/>-24<input id="radio' +
            radioIDs[2] +
            '" type="radio" name="rolloff' +
            f +
            '" value="-48"/>-48<input id="radio' +
            radioIDs[3] +
            '" type="radio" name="rolloff' +
            f +
            '" value="-96"/>-96</p></div></div>';
        htmlElements +=
            '<div class="wrapper" id="wrapper' +
            wrapperIDs[2] +
            '"><div class="s" id="s' +
            wrapperIDs[2] +
            '"><span>' +
            _("frequency") +
            '</span></div><div class="insideDivFilter"><input type="range" id="myRangeF' +
            f +
            '" class="sliders" style="margin-top:20px" max="7050" value="' +
            parseFloat(this.filterParams[f * 3 + 2]) +
            '"><span id="myspanF' +
            f +
            '" class="rangeslidervalue">' +
            this.filterParams[f * 3 + 2] +
            "</span></div></div>";
        htmlElements += "</div>";
        env.innerHTML += htmlElements;

        const myDiv = docById(selectorID);
        let selectOpt = '<select class="sel" id="' + selID + '">';
        let selectedFilter = null;
        for (let i = 0; i < FILTERTYPES.length; i++) {
            // work around some weird i18n bug
            if (FILTERTYPES[i][0].length === 0) {
                if (FILTERTYPES[i][1] === this.filterParams[f * 3]) {
                    selectOpt +=
                        '<option value="' +
                        FILTERTYPES[i][1] +
                        '" selected>' +
                        FILTERTYPES[i][1] +
                        "</option>";
                    selectedFilter = FILTERTYPES[i][1];
                } else {
                    selectOpt +=
                        '<option value="' +
                        FILTERTYPES[i][1] +
                        '">' +
                        FILTERTYPES[i][1] +
                        "</option>";
                }
            } else if (FILTERTYPES[i][0] === this.filterParams[f * 3]) {
                selectOpt +=
                    '<option value="' +
                    FILTERTYPES[i][0] +
                    '" selected>' +
                    FILTERTYPES[i][0] +
                    "</option>";
                selectedFilter = FILTERTYPES[i][0];
            } else {
                selectOpt +=
                    '<option value="' + FILTERTYPES[i][0] + '">' + FILTERTYPES[i][0] + "</option>";
            }
        }

        selectOpt += "</select>";
        myDiv.innerHTML = selectOpt;

        if (instrumentsFilters[0][this.instrumentName].length - 1 < f) {
            instrumentsFilters[0][this.instrumentName].push({
                filterType: selectedFilter,
                filterRolloff: -12,
                filterFrequency: 392
            });
        }
    }

    /**
     * Adds the various listeners needed for the filter panel.
     * @private
     * @returns {void}
     */
    _addFilterListeners() {
        const __filterNameEvent = (event) => {
            docById("filterButtonCell").style.backgroundColor = "#C8C8C0";
            const elem = event.target;
            const m = elem.id.slice(-1);
            instrumentsFilters[0][this.instrumentName][m]["filterType"] = elem.value;
            this._update(m, elem.value, 0);
            const error = instrumentsFilters[0][this.instrumentName].filter(
                (el) => el.filterType === elem.value
            );
            if (error.length > 1) {
                this.activity.errorMsg(_("Filter already present."));
            }
            this._playNote("G4", 1 / 8);
        };

        const __radioEvent = (event) => {
            const elem = event.target;
            const m = Number(elem.id.replace("radio", ""));
            instrumentsFilters[0][this.instrumentName][Math.floor(m / 4)][
                "filterRolloff"
            ] = parseFloat(elem.value);
            this._update(Math.floor(m / 4), elem.value, 1);
            this._playNote("G4", 1 / 8);
        };

        const __sliderEvent = (event) => {
            docById("filterButtonCell").style.backgroundColor = "#C8C0C8";
            const elem = event.target;
            const m = elem.id.slice(-1);
            docById("myRangeF" + m).value = parseFloat(elem.value);
            docById("myspanF" + m).textContent = elem.value;
            instrumentsFilters[0][this.instrumentName][m]["filterFrequency"] = parseFloat(
                elem.value
            );
            this._update(m, elem.value, 2);
            this._playNote("G4", 1 / 8);
        };

        for (let f = 0; f < this.fil.length; f++) {
            const radioIDs = [f * 4, f * 4 + 1, f * 4 + 2, f * 4 + 3];

            docById("sel" + f).removeEventListener("change", __filterNameEvent);
            docById("sel" + f).addEventListener("change", __filterNameEvent);

            for (let i = 0; i < radioIDs.length; i++) {
                const radioButton = docById("radio" + radioIDs[i]);
                radioButton.removeEventListener("click", __radioEvent);
                radioButton.addEventListener("click", __radioEvent);
            }

            docById("myRangeF" + f).removeEventListener("change", __sliderEvent);
            docById("myRangeF" + f).addEventListener("change", __sliderEvent);
        }
    }

    /**
     * @private
     * @returns {void}
     * Update the letious inputs on the filters panel.
     */
    _updateFilters() {
        for (let f = 0; f < this.fil.length; f++) {
            const radioIDs = [f * 4, f * 4 + 1, f * 4 + 2, f * 4 + 3];

            docById("sel" + f).value = instrumentsFilters[0][this.instrumentName][f]["filterType"];

            const rolloff = instrumentsFilters[0][this.instrumentName][f]["filterRolloff"];
            if (rolloff === -12) {
                docById("radio" + radioIDs[0]).checked = true;
            } else {
                docById("radio" + radioIDs[0]).checked = false;
            }

            if (rolloff === -24) {
                docById("radio" + radioIDs[1]).checked = true;
            } else {
                docById("radio" + radioIDs[1]).checked = false;
            }

            if (rolloff === -48) {
                docById("radio" + radioIDs[2]).checked = true;
            } else {
                docById("radio" + radioIDs[2]).checked = false;
            }

            if (rolloff === -96) {
                docById("radio" + radioIDs[3]).checked = true;
            } else {
                docById("radio" + radioIDs[3]).checked = false;
            }
        }
    }

    /**
     * @private
     * @returns {void}
     * lets you add addition filters to your custom timbre.
     */
    _addFilter = async () => {
        const env = docById("timbreTable");
        const topOfClamp = this.activity.blocks.blockList[this.blockNo].connections[2];
        const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

        // The block we'll be adding will be at the end of the list.
        this.fil.push(this.activity.blocks.blockList.length);

        const selectedFilters = instrumentsFilters[0][this.instrumentName].slice();
        const filterType = FILTERTYPES.slice().filter((filter) => {
            for (const i in selectedFilters) {
                if (selectedFilters[i].filterType === filter[1]) {
                    return false;
                }
            }
            return true;
        });

        if (filterType.length <= 0) {
            this.filterParams.push(DEFAULTFILTERTYPE);
        } else {
            this.filterParams.push(filterType[0][1]);
        }

        this.filterParams.push(-12);
        this.filterParams.push(392);

        // Don't create the new blocks until we know what filter to use.
        const len = this.filterParams.length;
        this.activity.blocks.loadNewBlocks([
            [0, ["filter", {}], 0, 0, [null, 3, 1, 2, null]],
            [1, ["number", { value: this.filterParams[len - 2] }], 0, 0, [0]],
            [2, ["number", { value: this.filterParams[len - 1] }], 0, 0, [0]],
            [3, ["filtertype", { value: this.filterParams[len - 3] }], 0, 0, [0]]
        ]);

        await delayExecution(500);
        this.blockConnection(4, bottomOfClamp);

        this._createFilter(this.fil.length - 1, env);
        this._playNote("G4", 1 / 8);

        this._addFilterListeners();
        this._updateFilters();
    }

    /**
     * @private
     * @returns {void}
     * lets you add effects to your custom timbre: tremelo, vibrato, chorus, phaser, and distortion.
     * When an effect is selected, additional controls will appear in the widget.
     */
    _effects = () => {
        let blockValue = 0;

        docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
        docById("effectsButtonCell").onmouseover = () => {};
        docById("effectsButtonCell").onmouseout = () => {};

        this.timbreTableDiv.style.display = "inline";
        this.timbreTableDiv.style.visibility = "visible";
        this.timbreTableDiv.style.border = "0px";
        this.timbreTableDiv.style.overflow = "auto";
        this.timbreTableDiv.style.backgroundColor = "white";
        this.timbreTableDiv.style.height = "300px";
        this.timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        const env = docById("timbreTable");
        let htmlElements = "";
        for (let i = 0; i < 2; i++) {
            htmlElements += '<div id ="effect' + i + '"></div>';
        }

        env.innerHTML = htmlElements;
        const envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = platformColor.selectorBackground;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        const mainDiv = docById("effect0");
        mainDiv.innerHTML =
            '<p><input type="radio" name="effectsName" value="Tremolo"/>' +
            _("tremolo") +
            '</br><input type="radio" name="effectsName" value="Vibrato"/>' +
            _("vibrato") +
            '</br><input type="radio" name="effectsName" value="Chorus"/>' +
            _("chorus") +
            '</br><input type="radio" name="effectsName" value="Phaser"/>' +
            _("phaser") +
            '</br><input type="radio" name="effectsName" value="Distortion"/>' +
            _("distortion") +
            "</br></p>";

        const subDiv = docById("effect1");
        const effectsName = docByName("effectsName");
        let effectChosen;

        for (let i = 0; i < effectsName.length; i++) {
            effectsName[i].onclick = async (event) => {
                effectChosen = event.target.value;
                let subHtmlElements = '<div id="chosen">' + effectChosen + "</div>";
                if (effectChosen === "Tremolo") {
                    this.isActive["tremolo"] = true;
                    this.isActive["chorus"] = false;
                    this.isActive["vibrato"] = false;
                    this.isActive["distortion"] = false;
                    this.isActive["phaser"] = false;

                    instrumentsEffects[0][this.instrumentName]["tremoloActive"] = true;

                    for (let j = 0; j < 2; i++) {
                        subHtmlElements +=
                            '<div id="wrapperFx' +
                            j +
                            '"><div id="sFx' +
                            j +
                            '"><span></span></div><div class="insideDivEffects"><input type="range" id="myRangeFx' +
                            j +
                            '" class="sliders" style="margin-top:20px" value="2"><span id="myspanFx' +
                            j +
                            '" class="rangeslidervalue">2</span></div></div>';
                    }

                    subDiv.innerHTML = subHtmlElements;
                    docById("sFx0").textContent = _("rate");
                    docById("myRangeFx0").value = 10;
                    docById("myspanFx0").textContent = "10";
                    docById("sFx1").textContent = _("depth");
                    docById("myRangeFx1").value = 50;
                    docById("myspanFx1").textContent = "50";

                    if (this.tremoloEffect.length !== 0) {
                        blockValue = this.tremoloEffect.length - 1;
                        for (let j = 0; j < 2; j++) {
                            docById("myRangeFx" + j).value = parseFloat(this.tremoloParams[j]);
                            docById("myspanFx" + j).textContent = this.tremoloParams[j];
                            this._update(blockValue, this.tremoloParams[j], j);
                        }
                    }

                    if (this.tremoloEffect.length === 0) {
                        // This is the first block in the child stack
                        // of the Timbre clamp.
                        const topOfClamp = this.activity.blocks.blockList[this.blockNo]
                            .connections[2];

                        const n = this.activity.blocks.blockList.length;
                        const TREMOLOOBJ = [
                            [0, ["tremolo", {}], 0, 0, [null, 1, 2, null, 3]],
                            [1, ["number", { value: 10 }], 0, 0, [0]],
                            [2, ["number", { value: 50 }], 0, 0, [0]],
                            [3, "hidden", 0, 0, [0, null]]
                        ];
                        this.activity.blocks.loadNewBlocks(TREMOLOOBJ);

                        this.tremoloEffect.push(n);
                        this.tremoloParams.push(10);
                        this.tremoloParams.push(50);

                        await delayExecution(500);
                        this.clampConnection(n, 3, topOfClamp);
                    }

                    for (let i = 0; i < 2; i++) {
                        document
                            .getElementById("wrapperFx" + i)
                            .addEventListener("change", (event) => {
                                docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
                                const elem = event.target;
                                const m = elem.id.slice(-1);
                                docById("myRangeFx" + m).value = parseFloat(elem.value);
                                docById("myspanFx" + m).textContent = elem.value;

                                if (m === 0) {
                                    instrumentsEffects[0][this.instrumentName][
                                        "tremoloFrequency"
                                    ] = parseFloat(elem.value);
                                }

                                if (m === 1) {
                                    instrumentsEffects[0][this.instrumentName]["tremoloDepth"] =
                                        parseFloat(elem.value) / 100;
                                }

                                this._update(blockValue, elem.value, Number(m));
                                this._playNote("G4", 1 / 8);
                            });
                    }
                } else if (effectChosen === "Vibrato") {
                    this.isActive["tremolo"] = false;
                    this.isActive["chorus"] = false;
                    this.isActive["vibrato"] = true;
                    this.isActive["distortion"] = false;
                    this.isActive["phaser"] = false;

                    instrumentsEffects[0][this.instrumentName]["vibratoActive"] = true;
                    for (let i = 0; i < 2; i++) {
                        subHtmlElements +=
                            '<div id="wrapperFx' +
                            i +
                            '"><div id="sFx' +
                            i +
                            '"><span></span></div><div class="insideDivEffects"><input type="range" id="myRangeFx' +
                            i +
                            '" class="sliders" style="margin-top:20px" max="25" value="2"><span id="myspanFx' +
                            i +
                            '" class="rangeslidervalue">2</span></div></div>';
                    }

                    // Set slider values
                    subDiv.innerHTML = subHtmlElements;
                    docById("sFx0").textContent = _("intensity");
                    docById("sFx1").textContent = _("rate");

                    if (this.vibratoEffect.length > 0) {
                        docById("myRangeFx0").value = parseFloat(this.vibratoParams[0]);
                        docById("myspanFx0").textContent = this.vibratoParams[0];
                        // Scale of rate is 0 to 1, so we need to multiply by 100
                        docById("myRangeFx1").value = 100 / parseFloat(this.vibratoParams[1]);
                        const obj = rationalToFraction(1 / parseFloat(this.vibratoParams[1]));
                        docById("myspanFx1").textContent = obj[0] + "/" + obj[1]; // this.vibratoParams[1];
                    } else {
                        // If necessary, add a vibrato block.
                        const topOfTimbreClamp = this.activity.blocks.blockList[this.blockNo]
                            .connections[2];

                        const vibratoBlock = this.activity.blocks.blockList.length;
                        const VIBRATOOBJ = [
                            [0, ["vibrato", {}], 0, 0, [null, 1, 3, 2, 6]],
                            [1, ["number", { value: 5 }], 0, 0, [0]],
                            [2, ["vspace", {}], 0, 0, [0, null]],
                            [3, ["divide", {}], 0, 0, [0, 4, 5]],
                            [4, ["number", { value: 1 }], 0, 0, [3]],
                            [5, ["number", { value: 16 }], 0, 0, [3]],
                            [6, ["hidden", {}], 0, 0, [0, null]]
                        ];
                        this.activity.blocks.loadNewBlocks(VIBRATOOBJ);

                        this.vibratoEffect.push(vibratoBlock);
                        this.vibratoParams.push(5);
                        this.vibratoParams.push(16);

                        await delayExecution(500);
                        this.clampConnectionVspace(
                            vibratoBlock,
                            vibratoBlock + 2,
                            topOfTimbreClamp
                        );

                        docById("myRangeFx0").value = 5;
                        docById("myspanFx0").textContent = "5";
                        instrumentsEffects[0][this.instrumentName]["vibratoIntensity"] = 0.05;

                        docById("myRangeFx1").value = 100 / 16;
                        docById("myspanFx1").textContent = "1/16";
                        instrumentsEffects[0][this.instrumentName]["vibratoFrequency"] = 1 / 16;
                    }

                    // Add the listeners for the sliders.
                    document.getElementById("wrapperFx0").addEventListener("change", (event) => {
                        docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
                        const elem = event.target;
                        docById("myRangeFx0").value = parseFloat(elem.value);
                        docById("myspanFx0").textContent = elem.value;
                        instrumentsEffects[0][this.instrumentName]["vibratoIntensity"] =
                            parseFloat(elem.value) / 100;

                        this._update(this.vibratoEffect.length - 1, elem.value, 0);
                        this._playNote("G4", 1 / 8);
                    });

                    document.getElementById("wrapperFx1").addEventListener("change", (event) => {
                        docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
                        const elem = event.target;
                        docById("myRangeFx1").value = parseFloat(elem.value);
                        const obj = oneHundredToFraction(elem.value);
                        docById("myspanFx1").textContent = obj[0] + "/" + obj[1];
                        const temp = parseFloat(obj[0]) / parseFloat(obj[1]);

                        instrumentsEffects[0][this.instrumentName]["vibratoFrequency"] = temp;
                        this._update(this.vibratoEffect.length - 1, obj[1], 1);
                        this._update(this.vibratoEffect.length - 1, obj[0], 2);
                        this._playNote("G4", 1 / 8);
                    });
                } else if (effectChosen === "Chorus") {
                    this.isActive["tremolo"] = false;
                    this.isActive["chorus"] = true;
                    this.isActive["vibrato"] = false;
                    this.isActive["distortion"] = false;
                    this.isActive["phaser"] = false;

                    instrumentsEffects[0][this.instrumentName]["chorusActive"] = true;

                    for (let i = 0; i < 3; i++) {
                        subHtmlElements +=
                            '<div id="wrapperFx' +
                            i +
                            '"><div id="sFx' +
                            i +
                            '"><span></span></div><div class="insideDivEffects"><input type="range" id="myRangeFx' +
                            i +
                            '" class="sliders" style="margin-top:20px" value="2"><span id="myspanFx' +
                            i +
                            '" class="rangeslidervalue">2</span></div></div>';
                    }

                    subDiv.innerHTML = subHtmlElements;
                    docById("sFx0").textContent = _("rate");
                    docById("myRangeFx0").value = 2;
                    docById("myspanFx0").textContent = "2";
                    instrumentsEffects[0][this.instrumentName]["chorusRate"] = 2;

                    docById("sFx1").textContent = _("delay (MS)");
                    docById("myRangeFx1").value = 4;
                    docById("myspanFx1").textContent = "4";
                    instrumentsEffects[0][this.instrumentName]["delayTime"] = 4;


                    docById("sFx2").textContent = _("depth");
                    docById("myRangeFx2").value = 70;
                    docById("myspanFx2").textContent = "70";
                    instrumentsEffects[0][this.instrumentName]["chorusDepth"] = 4;

                    if (this.chorusEffect.length !== 0) {
                        blockValue = this.chorusEffect.length - 1;
                        for (let i = 0; i < 3; i++) {
                            docById("myRangeFx" + i).value = parseFloat(this.chorusParams[i]);
                            docById("myspanFx" + i).textContent = this.chorusParams[i];
                            this._update(blockValue, this.chorusParams[i], i);
                        }
                    }

                    if (this.chorusEffect.length === 0) {
                        const topOfClamp = this.activity.blocks.blockList[this.blockNo]
                            .connections[2];

                        const n = this.activity.blocks.blockList.length;
                        const CHORUSOBJ = [
                            [0, ["chorus", {}], 0, 0, [null, 1, 2, 3, null, 4]],
                            [1, ["number", { value: 2 }], 0, 0, [0]],
                            [2, ["number", { value: 4 }], 0, 0, [0]],
                            [3, ["number", { value: 70 }], 0, 0, [0]],
                            [4, "hidden", 0, 0, [0, null]]
                        ];
                        this.activity.blocks.loadNewBlocks(CHORUSOBJ);

                        this.chorusEffect.push(n);
                        this.chorusParams.push(2);
                        this.chorusParams.push(4);
                        this.chorusParams.push(70);

                        await delayExecution(500);
                        this.clampConnection(n, 4, topOfClamp);
                    }

                    for (let i = 0; i < 3; i++) {
                        document
                            .getElementById("wrapperFx" + i)
                            .addEventListener("change", (event) => {
                                docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
                                const elem = event.target;
                                const m = elem.id.slice(-1);
                                docById("myRangeFx" + m).value = parseFloat(elem.value);
                                docById("myspanFx" + m).textContent = elem.value;

                                if (m === 0) {
                                    instrumentsEffects[0][this.instrumentName][
                                        "chorusRate"
                                    ] = parseFloat(elem.value);
                                }

                                if (m === 1) {
                                    instrumentsEffects[0][this.instrumentName][
                                        "delayTime"
                                    ] = parseFloat(elem.value);
                                }

                                if (m === 2) {
                                    instrumentsEffects[0][this.instrumentName]["chorusDepth"] =
                                        parseFloat(elem.value) / 100;
                                }

                                this._update(blockValue, elem.value, Number(m));
                                this._playNote("G4", 1 / 8);
                            });
                    }
                } else if (effectChosen === "Phaser") {
                    this.isActive["tremolo"] = false;
                    this.isActive["chorus"] = false;
                    this.isActive["vibrato"] = false;
                    this.isActive["distortion"] = false;
                    this.isActive["phaser"] = true;

                    instrumentsEffects[0][this.instrumentName]["phaserActive"] = true;

                    for (let i = 0; i < 3; i++) {
                        subHtmlElements +=
                            '<div id="wrapperFx' +
                            i +
                            '"><div id="sFx' +
                            i +
                            '"><span></span></div><div class="insideDivEffects"><input type="range" id="myRangeFx' +
                            i +
                            '" class="sliders" style="margin-top:20px" value="2"><span id="myspanFx' +
                            i +
                            '" class="rangeslidervalue">2</span></div></div>';
                    }

                    subDiv.innerHTML = subHtmlElements;
                    docById("sFx0").textContent = _("rate");
                    docById("myRangeFx0").value = 5;
                    docById("myspanFx0").textContent = "5";
                    docById("sFx1").textContent = _("octaves");
                    docById("myRangeFx1").value = 3;
                    docById("myspanFx1").textContent = "3";
                    docById("sFx2").textContent = _("base frequency");
                    docById("myRangeFx2").value = 350;
                    docById("myspanFx2").textContent = "350";

                    if (this.phaserEffect.length !== 0) {
                        blockValue = this.phaserEffect.length - 1;
                        for (let i = 0; i < 3; i++) {
                            docById("myRangeFx" + i).value = parseFloat(this.phaserParams[i]);
                            docById("myspanFx" + i).textContent = this.phaserParams[i];
                            this._update(blockValue, this.phaserParams[i], i);
                        }
                    }

                    if (this.phaserEffect.length === 0) {
                        const topOfClamp = this.activity.blocks.blockList[this.blockNo]
                            .connections[2];

                        const n = this.activity.blocks.blockList.length;
                        const PHASEROBJ = [
                            [0, ["phaser", {}], 0, 0, [null, 1, 2, 3, null, 4]],
                            [1, ["number", { value: 5 }], 0, 0, [0]],
                            [2, ["number", { value: 3 }], 0, 0, [0]],
                            [3, ["number", { value: 350 }], 0, 0, [0]],
                            [4, "hidden", 0, 0, [0, null]]
                        ];
                        this.activity.blocks.loadNewBlocks(PHASEROBJ);

                        this.phaserEffect.push(n);
                        this.phaserParams.push(5);
                        this.phaserParams.push(3);
                        this.phaserParams.push(350);

                        await delayExecution(500);
                        this.clampConnection(n, 4, topOfClamp);
                    }

                    for (let i = 0; i < 3; i++) {
                        document
                            .getElementById("wrapperFx" + i)
                            .addEventListener("change", (event) => {
                                docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
                                const elem = event.target;
                                const m = elem.id.slice(-1);
                                docById("myRangeFx" + m).value = parseFloat(elem.value);
                                docById("myspanFx" + m).textContent = elem.value;

                                if (m === 0) {
                                    instrumentsEffects[0][this.instrumentName]["rate"] = parseFloat(
                                        elem.value
                                    );
                                }

                                if (m === 1) {
                                    instrumentsEffects[0][this.instrumentName][
                                        "octaves"
                                    ] = parseFloat(elem.value);
                                }

                                if (m === 2) {
                                    instrumentsEffects[0][this.instrumentName][
                                        "baseFrequency"
                                    ] = parseFloat(elem.value);
                                }

                                this._update(blockValue, elem.value, Number(m));
                                this._playNote("G4", 1 / 8);
                            });
                    }
                } else if (effectChosen === "Distortion") {
                    this.isActive["tremolo"] = false;
                    this.isActive["chorus"] = false;
                    this.isActive["vibrato"] = false;
                    this.isActive["distortion"] = true;
                    this.isActive["phaser"] = false;

                    instrumentsEffects[0][this.instrumentName]["distortionActive"] = true;

                    subHtmlElements +=
                        '<div id="wrapperFx0"><div id="sFx0"><span></span></div><div class="insideDivEffects"><input type="range" id="myRangeFx0" class="sliders" style="margin-top:20px" value="2"><span id="myspanFx0" class="rangeslidervalue">2</span></div></div>';

                    subDiv.innerHTML = subHtmlElements;

                    docById("sFx0").textContent = _("distortion amount");
                    docById("myRangeFx0").value = 40;
                    docById("myspanFx0").textContent = "40";

                    if (this.distortionEffect.length !== 0) {
                        blockValue = this.distortionEffect.length - 1;
                        docById("myRangeFx0").value = parseFloat(this.distortionParams[0]);
                        docById("myspanFx0").textContent = this.distortionParams[0];
                        this._update(blockValue, this.distortionParams[0], 0);
                    }

                    if (this.distortionEffect.length === 0) {
                        const topOfClamp = this.activity.blocks.blockList[this.blockNo]
                            .connections[2];

                        const n = this.activity.blocks.blockList.length;
                        const DISTORTIONOBJ = [
                            [0, ["dis", {}], 0, 0, [null, 1, null, 2]],
                            [1, ["number", { value: 40 }], 0, 0, [0]],
                            [2, "hidden", 0, 0, [0, null]]
                        ];
                        this.activity.blocks.loadNewBlocks(DISTORTIONOBJ);

                        this.distortionEffect.push(n);
                        this.distortionParams.push(40);

                        await delayExecution(500);
                        this.clampConnection(n, 2, topOfClamp);
                    }

                    document.getElementById("wrapperFx0").addEventListener("change", (event) => {
                        docById("effectsButtonCell").style.backgroundColor = "#C8C8C8";
                        const elem = event.target;
                        docById("myRangeFx0").value = parseFloat(elem.value);
                        docById("myspanFx0").textContent = elem.value;
                        instrumentsEffects[0][this.instrumentName]["distortionAmount"] =
                            parseFloat(elem.value) / 100;
                        this._update(blockValue, elem.value, 0);
                        this._playNote("G4", 1 / 8);
                    });
                }
            };
        }
    }
}
