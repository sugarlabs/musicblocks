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

   DEFAULTOSCILLATORTYPE, DEFAULTFILTERTYPE, instrumentsEffects:writeable,
   instrumentsFilters:writeable, docById, docByName, delayExecution, _,
   oneHundredToFraction, rationalToFraction
 */

/* exported TimbreBlocks */

/**
 * @file TimbreBlocks.js
 * @description Block and clamp manipulation, block connection, save, and undo logic for the Timbre widget.
 *
 * The methods are installed onto TimbreWidget.prototype (see TimbreWidget.installModules),
 * so `this` inside them refers to the TimbreWidget instance.
 */
class TimbreBlocks {
    /**
     * @private
     * used to update the parameters in the blocks contained in the timbre widget clamp.
     * @param {number} i - is the index into the parameter array. (For example, there can be multiple filter blocks associated with a timbre.)
     * @param {number} k - is the parameter to update (There can be multiple parameters per block.)
     * @returns {void}
     */
    async _update(i, value, k) {
        const updateParams = [];

        if (this.isActive["envelope"] === true && this.env[i] !== null) {
            for (let j = 0; j < 4; j++) {
                updateParams[j] = this.activity.blocks.blockList[this.env[i]].connections[j + 1];
            }
        }

        if (this.isActive["filter"] === true && this.fil[i] !== null) {
            for (let j = 0; j < 3; j++) {
                updateParams[j] = this.activity.blocks.blockList[this.fil[i]].connections[j + 1];
            }
        }

        if (this.isActive["oscillator"] === true && this.osc[i] !== null) {
            for (let j = 0; j < 2; j++) {
                updateParams[j] = this.activity.blocks.blockList[this.osc[i]].connections[j + 1];
            }
        }

        if (this.isActive["amsynth"] === true && this.AMSynthesizer[i] !== null) {
            updateParams[0] = this.activity.blocks.blockList[this.AMSynthesizer[i]].connections[1];
        }

        if (this.isActive["fmsynth"] === true && this.FMSynthesizer[i] !== null) {
            updateParams[0] = this.activity.blocks.blockList[this.FMSynthesizer[i]].connections[1];
        }

        if (this.isActive["noisesynth"] === true && this.NoiseSynthesizer[i] !== null) {
            updateParams[0] =
                this.activity.blocks.blockList[this.NoiseSynthesizer[i]].connections[1];
        }

        if (this.isActive["duosynth"] === true && this.duoSynthesizer[i] !== null) {
            for (let j = 0; j < 2; j++) {
                updateParams[j] =
                    this.activity.blocks.blockList[this.duoSynthesizer[i]].connections[j + 1];
            }
        }

        if (this.isActive["tremolo"] === true && this.tremoloEffect[i] !== null) {
            for (let j = 0; j < 2; j++) {
                updateParams[j] =
                    this.activity.blocks.blockList[this.tremoloEffect[i]].connections[j + 1];
            }
        }

        if (this.isActive["vibrato"] === true && this.vibratoEffect[i] !== null) {
            updateParams[0] = this.activity.blocks.blockList[this.vibratoEffect[i]].connections[1];
            // The rate arg of the vibrato block must be in the form: a / b
            const divBlock = this.activity.blocks.blockList[this.vibratoEffect[i]].connections[2];
            if (
                this.activity.blocks.blockList[divBlock].name === "divide" &&
                this.activity.blocks.blockList[divBlock].connections[1] !== null &&
                this.activity.blocks.blockList[
                    this.activity.blocks.blockList[divBlock].connections[1]
                ].name === "number" &&
                this.activity.blocks.blockList[divBlock].connections[2] !== null &&
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
                    this.activity.blocks.blockList[this.vibratoEffect[i]].connections[2] = n;
                    this.activity.blocks.blockList[n].connections[0] = this.vibratoEffect[i];
                    this.activity.blocks.blockList[divBlock].connections[0] = null;
                    this.activity.blocks.clampBlocksToCheck.push([n, 0]);
                    this.activity.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
                    this.activity.blocks.adjustDocks(this.blockNo, true);
                };

                await delayExecution(500);
                __blockRefresher();
            }
        }

        if (this.isActive["chorus"] === true && this.chorusEffect[i] !== null) {
            for (let j = 0; j < 3; j++) {
                updateParams[j] =
                    this.activity.blocks.blockList[this.chorusEffect[i]].connections[j + 1];
            }
        }

        if (this.isActive["phaser"] === true && this.phaserEffect[i] !== null) {
            for (let j = 0; j < 3; j++) {
                updateParams[j] =
                    this.activity.blocks.blockList[this.phaserEffect[i]].connections[j + 1];
            }
        }

        if (this.isActive["distortion"] === true && this.distortionEffect[i] !== null) {
            updateParams[0] =
                this.activity.blocks.blockList[this.distortionEffect[i]].connections[1];
        }

        if (updateParams[0] !== null) {
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
     * @returns {void}
     */
    _save() {
        // Just save a set timbre block with the current instrument name.
        const obj = [
            [0, "settimbre", 100 + this._delta, 100 + this._delta, [null, 1, null, 2]],
            [1, ["text", { value: this.instrumentName }], 0, 0, [0]],
            [2, "hidden", 0, 0, [0, null]]
        ];
        this.activity.blocks.loadNewBlocks(obj);
        this._delta += 42;
    }

    /**
     * @private
     * Records a parameter snapshot on the undo stack before user mutation.
     * @param {string} effect - Parameter section identifier
     * @param {Array} values - Array of parameter values
     * @param {number} blockValue - Block index
     * @returns {void}
     */
    _recordUndo(effect, values, blockValue) {
        if (!this._undoStack) {
            this._undoStack = [];
        }
        if (this._undoStack.length >= 50) {
            this._undoStack.shift();
        }
        this._undoStack.push({
            effect,
            values: Array.isArray(values) ? values.slice() : [values],
            blockValue
        });
    }

    /**
     * @private
     * Removes undo snapshots belonging to a replaced section or synthesizer.
     * @param {string} effect - Effect identifier to purge
     * @returns {void}
     */
    _purgeUndoSnapshots(effect) {
        if (this._undoStack && this._undoStack.length > 0) {
            this._undoStack = this._undoStack.filter(s => s.effect !== effect);
        }
    }

    /**
     * @private
     * Syncs Materialize CSS .thumb slider tooltip labels.
     * @returns {void}
     */
    _syncThumbTooltips() {
        const timbreTable = docById("timbreTable");
        if (!timbreTable) {
            return;
        }
        const sliders = timbreTable.querySelectorAll("input[type=range]");
        for (let k = 0; k < sliders.length; k++) {
            const slider = sliders[k];
            let sibling = slider.nextElementSibling;
            while (sibling) {
                if (sibling.classList.contains("thumb")) {
                    const valSpan = sibling.querySelector(".value");
                    if (valSpan) {
                        valSpan.textContent = slider.value;
                    }
                    break;
                }
                sibling = sibling.nextElementSibling;
            }
        }
    }

    /**
     * @private
     * Restores an undo history state.
     * @param {Object} state - The popped undo state
     * @returns {void}
     */
    _applyUndoState(state) {
        if (!state || !state.effect) {
            return;
        }

        const effect = state.effect;
        const vals = state.values;
        const blockValue = state.blockValue;
        const savedActive = Object.assign({}, this.isActive);
        const isPanelActive = Boolean(savedActive[effect]);

        const effectBlockMap = {
            amsynth: this.AMSynthesizer,
            fmsynth: this.FMSynthesizer,
            noisesynth: this.NoiseSynthesizer,
            duosynth: this.duoSynthesizer,
            tremolo: this.tremoloEffect,
            vibrato: this.vibratoEffect,
            phaser: this.phaserEffect,
            chorus: this.chorusEffect,
            distortion: this.distortionEffect,
            envelope: this.env,
            oscillator: this.osc
        };
        const blockArray = effectBlockMap[effect];
        if (blockArray && blockArray.length > 0) {
            const targetBlockId = blockArray[blockValue];
            if (targetBlockId === null || targetBlockId === undefined) {
                return;
            }
            if (
                this.activity &&
                this.activity.blocks &&
                this.activity.blocks.blockList &&
                !this.activity.blocks.blockList[targetBlockId]
            ) {
                return;
            }
        }

        try {
            for (const key of Object.keys(this.isActive)) {
                this.isActive[key] = false;
            }
            this.isActive[effect] = true;

            const setSlider = (rangeId, spanId, val, round = true) => {
                if (!isPanelActive) {
                    return;
                }
                const range = docById(rangeId);
                if (range) range.value = parseFloat(val);
                const span = docById(spanId);
                if (span) span.textContent = round ? Math.round(parseFloat(val) * 100) / 100 : val;
            };

            if (effect === "amsynth") {
                setSlider("myRangeS0", "myspanS0", vals[0], false);
                this.amSynthParamvals["harmonicity"] = parseFloat(vals[0]);
                this.AMSynthParams[0] = vals[0];
                this._update(blockValue, vals[0], 0);
                if (this.activity && this.activity.logo && this.activity.logo.synth) {
                    this.activity.logo.synth.createSynth(
                        0,
                        this.instrumentName,
                        "amsynth",
                        this.amSynthParamvals
                    );
                }
            } else if (effect === "fmsynth") {
                setSlider("myRangeS0", "myspanS0", vals[0], false);
                this.fmSynthParamvals["modulationIndex"] = parseFloat(vals[0]);
                this.FMSynthParams[0] = vals[0];
                this._update(blockValue, vals[0], 0);
                if (this.activity && this.activity.logo && this.activity.logo.synth) {
                    this.activity.logo.synth.createSynth(
                        0,
                        this.instrumentName,
                        "fmsynth",
                        this.fmSynthParamvals
                    );
                }
            } else if (effect === "noisesynth") {
                setSlider("myRangeS0", "myspanS0", vals[0], false);
                this.noiseSynthParamvals["noise.type"] = parseFloat(vals[0]);
                this.NoiseSynthParams[0] = vals[0];
                this._update(blockValue, vals[0], 0);
                if (this.activity && this.activity.logo && this.activity.logo.synth) {
                    this.activity.logo.synth.createSynth(
                        0,
                        this.instrumentName,
                        "noisesynth",
                        this.noiseSynthParamvals
                    );
                }
            } else if (effect === "duosynth") {
                for (let i = 0; i < vals.length; i++) {
                    setSlider("myRangeS" + i, "myspanS" + i, vals[i], false);
                    this.duoSynthParams[i] = vals[i];
                    this._update(blockValue, vals[i], i);
                }
                this._setDuoSynthParamVals(vals[0], vals[1]);
                if (this.activity && this.activity.logo && this.activity.logo.synth) {
                    this.activity.logo.synth.createSynth(
                        0,
                        this.instrumentName,
                        "duosynth",
                        this.duoSynthParamVals
                    );
                }
            } else if (effect === "tremolo") {
                for (let i = 0; i < 2; i++) {
                    setSlider("myRangeFx" + i, "myspanFx" + i, vals[i]);
                    this.tremoloParams[i] = vals[i];
                    this._update(blockValue, vals[i], i);
                }
                if (instrumentsEffects[0] && instrumentsEffects[0][this.instrumentName]) {
                    instrumentsEffects[0][this.instrumentName]["tremoloFrequency"] = parseFloat(
                        vals[0]
                    );
                    instrumentsEffects[0][this.instrumentName]["tremoloDepth"] =
                        parseFloat(vals[1]) / 100;
                }
            } else if (effect === "vibrato") {
                setSlider("myRangeFx0", "myspanFx0", vals[0]);
                this.vibratoParams[0] = vals[0];
                this._update(blockValue, vals[0], 0);

                const obj = oneHundredToFraction(parseFloat(vals[1]));
                if (isPanelActive) {
                    const span = docById("myspanFx1");
                    const range1 = docById("myRangeFx1");
                    if (range1) range1.value = parseFloat(vals[1]);
                    if (span) span.textContent = obj[0] + "/" + obj[1];
                }
                this.vibratoParams[1] = vals[1];
                this._update(blockValue, obj[1], 1);
                this._update(blockValue, obj[0], 2);

                if (instrumentsEffects[0] && instrumentsEffects[0][this.instrumentName]) {
                    const undoFreq = parseFloat(obj[0]) / parseFloat(obj[1]);
                    instrumentsEffects[0][this.instrumentName]["vibratoActive"] = true;
                    instrumentsEffects[0][this.instrumentName]["vibratoIntensity"] =
                        parseFloat(vals[0]) / 100;
                    instrumentsEffects[0][this.instrumentName]["vibratoFrequency"] = undoFreq;
                    instrumentsEffects[0][this.instrumentName]["vibratoRate"] =
                        undoFreq > 0 ? 1 / undoFreq : 16;
                }
            } else if (effect === "phaser") {
                for (let i = 0; i < 3; i++) {
                    setSlider("myRangeFx" + i, "myspanFx" + i, vals[i]);
                    this.phaserParams[i] = vals[i];
                    this._update(blockValue, vals[i], i);
                }
                if (instrumentsEffects[0] && instrumentsEffects[0][this.instrumentName]) {
                    instrumentsEffects[0][this.instrumentName]["rate"] = parseFloat(vals[0]);
                    instrumentsEffects[0][this.instrumentName]["octaves"] = parseFloat(vals[1]);
                    instrumentsEffects[0][this.instrumentName]["baseFrequency"] = parseFloat(
                        vals[2]
                    );
                }
            } else if (effect === "chorus") {
                for (let i = 0; i < 3; i++) {
                    setSlider("myRangeFx" + i, "myspanFx" + i, vals[i]);
                    this.chorusParams[i] = vals[i];
                    this._update(blockValue, vals[i], i);
                }
                if (instrumentsEffects[0] && instrumentsEffects[0][this.instrumentName]) {
                    instrumentsEffects[0][this.instrumentName]["chorusRate"] = parseFloat(vals[0]);
                    instrumentsEffects[0][this.instrumentName]["delayTime"] = parseFloat(vals[1]);
                    instrumentsEffects[0][this.instrumentName]["chorusDepth"] =
                        parseFloat(vals[2]) / 100;
                }
            } else if (effect === "distortion") {
                setSlider("myRangeFx0", "myspanFx0", vals[0]);
                this.distortionParams[0] = vals[0];
                this._update(blockValue, vals[0], 0);
                if (instrumentsEffects[0] && instrumentsEffects[0][this.instrumentName]) {
                    instrumentsEffects[0][this.instrumentName]["distortionAmount"] =
                        parseFloat(vals[0]) / 100;
                }
            } else if (effect === "envelope") {
                for (let i = 0; i < 4; i++) {
                    setSlider("myRange" + i, "myspan" + i, vals[i], false);
                    this.synthVals["envelope"][this.adsrMap[i]] = parseFloat(vals[i]) / 100;
                    this.ENVs[i] = vals[i];
                    this._update(blockValue, parseFloat(vals[i]), i);
                }
                if (this.activity && this.activity.logo && this.activity.logo.synth) {
                    this.activity.logo.synth.createSynth(
                        0,
                        this.instrumentName,
                        this.synthVals["oscillator"]["source"],
                        this.synthVals
                    );
                }
            } else if (effect === "oscillator") {
                if (isPanelActive) {
                    const sel = docById("selOsc1");
                    if (sel) sel.value = vals[0];
                }
                setSlider("myRangeO0", "myspanO0", vals[1], false);
                this.oscParams[0] = vals[0];
                this.oscParams[1] = vals[1];
                this.synthVals["oscillator"]["type"] = vals[0] + vals[1].toString();
                this.synthVals["oscillator"]["source"] = vals[0];
                this._update(blockValue, vals[0], 0);
                this._update(blockValue, vals[1], 1);
                if (this.activity && this.activity.logo && this.activity.logo.synth) {
                    this.activity.logo.synth.createSynth(
                        0,
                        this.instrumentName,
                        vals[0],
                        this.synthVals
                    );
                }
            }

            if (isPanelActive) {
                this._syncThumbTooltips();
            }
            this._playNote("G4", 1 / 8);
        } finally {
            this.isActive = savedActive;
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _undo() {
        if (this._undoStack && this._undoStack.length > 0) {
            const prevState = this._undoStack.pop();
            this._applyUndoState(prevState);
            return;
        }

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
            this._update(blockValue, this.duoSynthParams[0], 0);
            docById("myRangeS1").value = parseFloat(this.duoSynthParams[1]);
            docById("myspanS1").textContent = this.duoSynthParams[1];
            this._setDuoSynthParamVals(this.duoSynthParams[0], this.duoSynthParams[1]);
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
            this.oscParams[0] = DEFAULTOSCILLATORTYPE;
            this.oscParams[1] = 6;
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
                instrumentsFilters[0][this.instrumentName][i]["filterType"] =
                    this.filterParams[i * 3];

                const radioIDs = [i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 3];
                this._setRolloffRadioChecked(radioIDs, this.filterParams[i * 3 + 1]);
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
                docById("myspanFx" + i).textContent =
                    Math.round(parseFloat(this.tremoloParams[i]) * 100) / 100;
                this._update(blockValue, this.tremoloParams[i], i);
            }
        } else if (this.isActive["vibrato"] === true) {
            docById("effectsButtonCell").style.backgroundColor = platformColor.selectorBackground;
            if (this.vibratoEffect.length !== 1) {
                blockValue = this.vibratoEffect.length - 1;
            }

            for (let i = 0; i < 2; i++) {
                docById("myRangeFx" + i).value = parseFloat(this.vibratoParams[i]);
                if (i === 1) {
                    const obj = oneHundredToFraction(this.vibratoParams[i]);
                    docById("myspanFx" + i).textContent = obj[0] + "/" + obj[1];
                } else {
                    docById("myspanFx" + i).textContent =
                        Math.round(parseFloat(this.vibratoParams[i]) * 100) / 100;
                }
                this._update(blockValue, this.vibratoParams[i], i);
            }
        } else if (this.isActive["phaser"] === true) {
            docById("effectsButtonCell").style.backgroundColor = platformColor.selectorBackground;
            if (this.phaserEffect.length !== 1) {
                blockValue = this.phaserEffect.length - 1;
            }

            for (let i = 0; i < 3; i++) {
                docById("myRangeFx" + i).value = parseFloat(this.phaserParams[i]);
                docById("myspanFx" + i).textContent =
                    Math.round(parseFloat(this.phaserParams[i]) * 100) / 100;
                this._update(blockValue, this.phaserParams[i], i);
            }
        } else if (this.isActive["chorus"] === true) {
            docById("effectsButtonCell").style.backgroundColor = platformColor.selectorBackground;
            if (this.chorusEffect.length !== 1) {
                blockValue = this.chorusEffect.length - 1;
            }

            for (let i = 0; i < 3; i++) {
                docById("myRangeFx" + i).value = parseFloat(this.chorusParams[i]);
                docById("myspanFx" + i).textContent =
                    Math.round(parseFloat(this.chorusParams[i]) * 100) / 100;
                this._update(blockValue, this.chorusParams[i], i);
            }
        } else if (this.isActive["distortion"] === true) {
            docById("effectsButtonCell").style.backgroundColor = platformColor.selectorBackground;
            if (this.distortionEffect.length !== 1) {
                blockValue = this.distortionEffect.length - 1;
            }

            docById("myRangeFx0").value = parseFloat(this.distortionParams[0]);
            docById("myspanFx0").textContent =
                Math.round(parseFloat(this.distortionParams[0]) * 100) / 100;
            this._update(blockValue, this.distortionParams[0], 0);
        }

        // Materialize CSS uses to update the .thumb tooltips. Manually sync them.
        const timbreTable = docById("timbreTable");
        if (timbreTable) {
            const sliders = timbreTable.querySelectorAll("input[type=range]");
            for (let k = 0; k < sliders.length; k++) {
                const slider = sliders[k];
                let sibling = slider.nextElementSibling;
                while (sibling) {
                    if (sibling.classList.contains("thumb")) {
                        const valSpan = sibling.querySelector(".value");
                        if (valSpan) {
                            valSpan.textContent = slider.value;
                        }
                        break;
                    }
                    sibling = sibling.nextElementSibling;
                }
            }
        }

        this._playNote("G4", 1 / 8);
    }

    /**
     * @public
     * Method pertaining to adjusting the timbre block clamp after adding blocks.
     * @param {number} n
     * @param {number} clamp
     * @param {number} topOfClamp
     * @returns {void}
     */
    async clampConnection(n, clamp, topOfClamp) {
        const targetBlock = this.activity.blocks.blockList[this.blockNo];
        if (!targetBlock) {
            return;
        }
        // Connect the clamp to the Widget block.
        targetBlock.connections[2] = n;
        this.activity.blocks.blockList[n].connections[0] = this.blockNo;

        // If there were blocks in the Widget, move them inside the clamp.
        if (topOfClamp !== null) {
            this.activity.blocks.blockList[n].connections[clamp] = topOfClamp;
            this.activity.blocks.blockList[topOfClamp].connections[0] = n;
        }

        await this._finalizeClampAdjustment(n);
    }

    /**
     * @public
     * Method pertaining to adjusting timbre block clamp and effects block clamp sizes after adding blocks.
     * @param {number} oldblk
     * @param {number} newblk
     * @param {number} topOfClamp
     * @returns {void}
     */
    async clampConnectionVspace(n, vspace, topOfClamp) {
        const targetBlock = this.activity.blocks.blockList[this.blockNo];
        if (!targetBlock) {
            return;
        }
        // Connect the clamp to the Widget block.
        targetBlock.connections[2] = n;
        this.activity.blocks.blockList[n].connections[0] = this.blockNo;

        // If there were blocks in the Widget, move them inside the clamp.
        if (topOfClamp !== null) {
            this.activity.blocks.blockList[vspace].connections[1] = topOfClamp;
            this.activity.blocks.blockList[topOfClamp].connections[0] = vspace;
        }

        await this._finalizeClampAdjustment(n);
    }

    /**
     * @private
     * Adjusts the clamp sizes/positions shared by clampConnection and
     * clampConnectionVspace after a new block has been spliced in.
     * @param {number} n
     * @returns {Promise<void>}
     */
    async _finalizeClampAdjustment(n) {
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
            this.AMSynthParams = [];
            this._purgeUndoSnapshots("amsynth");
            this._setWidgetTimeout(() => this._blockReplace(lastBlk, newblk), 500);
        } else if (this.FMSynthesizer.length !== 0 && synthChosen !== "FMSynth") {
            lastBlk = this.FMSynthesizer.pop();
            this.FMSynthParams = [];
            this._purgeUndoSnapshots("fmsynth");
            this._setWidgetTimeout(() => this._blockReplace(lastBlk, newblk), 500);
        } else if (this.duoSynthesizer.length !== 0 && synthChosen !== "DuoSynth") {
            lastBlk = this.duoSynthesizer.pop();
            this.duoSynthParams = [];
            this._purgeUndoSnapshots("duosynth");
            this._setWidgetTimeout(() => this._blockReplace(lastBlk, newblk), 500);
        } else if (synthChosen === "FMSynth" || synthChosen === "AMSynth") {
            this._setWidgetTimeout(() => this.blockConnection(2, bottomOfClamp), 500);
        } else {
            this._setWidgetTimeout(() => this.blockConnection(3, bottomOfClamp), 500);
        }
    }

    /**
     * @private
     * Updates DuoSynth values passed to Tone. The widget and block store amount as percent.
     * @param {number|string} vibratoRate
     * @param {number|string} vibratoAmount
     * @returns {void}
     */
    _setDuoSynthParamVals(vibratoRate, vibratoAmount) {
        this.duoSynthParamVals["vibratoRate"] = Math.abs(parseFloat(vibratoRate));
        this.duoSynthParamVals["vibratoAmount"] = Math.abs(parseFloat(vibratoAmount)) / 100;
    }

    /**
     * @private
     * Creates the DuoSynth block stack and records default widget parameters.
     * @param {number|null} bottomOfClamp
     * @param {string} synthChosen
     * @returns {void}
     */
    _addDuoSynthBlock(bottomOfClamp, synthChosen) {
        const n = this.activity.blocks.blockList.length;
        const DUOSYNTHOBJ = [
            [0, ["duosynth", {}], 0, 0, [null, 1, 2, null]],
            [1, ["number", { value: 10 }], 0, 0, [0]],
            [2, ["number", { value: 6 }], 0, 0, [0]]
        ];
        this.activity.blocks.loadNewBlocks(DUOSYNTHOBJ);

        this.duoSynthesizer.push(n);
        this.duoSynthParams.push(10);
        this.duoSynthParams.push(6);

        this._changeBlock(last(this.duoSynthesizer), synthChosen, bottomOfClamp);
        this._setDuoSynthParamVals(this.duoSynthParams[0], this.duoSynthParams[1]);
        this.activity.logo.synth.createSynth(
            0,
            this.instrumentName,
            "duosynth",
            this.duoSynthParamVals
        );
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

        if (c0 !== null) {
            for (let i = 0; i < this.activity.blocks.blockList[c0].connections.length; i++) {
                if (this.activity.blocks.blockList[c0].connections[i] === oldblk) {
                    this.activity.blocks.blockList[c0].connections[i] = newblk;
                    break;
                }
            }

            // Look for a containing clamp, which may need to be resized.
            let blockAbove = c0;
            while (blockAbove !== this.blockNo) {
                if (this.activity.blocks.blockList[blockAbove].isClampBlock()) {
                    this.activity.blocks.clampBlocksToCheck.push([blockAbove, 0]);
                }

                blockAbove = this.activity.blocks.blockList[blockAbove].connections[0];
            }

            this.activity.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        }

        if (c1 !== null) {
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
    async blockConnection(len, bottomOfClamp) {
        const n = this.activity.blocks.blockList.length - len;
        if (bottomOfClamp === null) {
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
                if (this.activity.blocks.blockList[cblk].connections[c] === null) {
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
}

if (typeof window !== "undefined") {
    window.TimbreBlocks = TimbreBlocks;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = TimbreBlocks;
}
