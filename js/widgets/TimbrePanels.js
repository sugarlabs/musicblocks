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

   DEFAULTOSCILLATORTYPE, DEFAULTFILTERTYPE, OSCTYPES, FILTERTYPES,
   platformColor, docById, docByName, _, instrumentsEffects:writeable,
   instrumentsFilters:writeable, oneHundredToFraction, rationalToFraction,
   delayExecution, last, announceToScreenReader
 */

/* exported TimbrePanels */

/**
 * @file TimbrePanels.js
 * @description Panel builders and UI controls (synth, oscillator, envelope, filter, effects) for TimbreWidget.
 *
 * The methods are installed onto TimbreWidget.prototype (see TimbreWidget.installModules),
 * so `this` inside them refers to the TimbreWidget instance.
 */
class TimbrePanels {
    /**
     * @private
     * Resets timbreTableDiv to its default visible state and recreates the
     * empty #timbreTable panel container used by each panel builder.
     * @returns {HTMLElement} the fresh #timbreTable element.
     */
    _resetTimbreTable() {
        this.timbreTableDiv.style.display = "inline";
        this.timbreTableDiv.style.visibility = "visible";
        this.timbreTableDiv.style.border = "0px";
        this.timbreTableDiv.style.overflow = "auto";
        this.timbreTableDiv.style.backgroundColor = "white";
        this.timbreTableDiv.style.height = "300px";
        this.timbreTableDiv.textContent = "";
        const timbreTable = document.createElement("div");
        timbreTable.id = "timbreTable";
        this.timbreTableDiv.appendChild(timbreTable);

        // timbreTable was just created and appended above, so it's already
        // the element docById("timbreTable") would return; skip the lookup.
        return timbreTable;
    }

    /**
     * @private
     * @returns {void}
     * Method that lets you choose between an AM synth, a PM synth, or a Duo synth.
     */
    _synth() {
        let blockValue = 0;

        const createLabeledSlider = (idSuffix, labelText, inputValue, spanValue) => {
            const wrapper = document.createElement("div");
            wrapper.id = "wrapperS" + idSuffix;

            const labelDiv = document.createElement("div");
            labelDiv.id = "sS" + idSuffix;
            const spanLabel = document.createElement("span");
            spanLabel.textContent = labelText;
            labelDiv.appendChild(spanLabel);
            wrapper.appendChild(labelDiv);

            const insideDiv = document.createElement("div");
            insideDiv.className = "insideDivSynth";

            const input = document.createElement("input");
            input.type = "range";
            input.id = "myRangeS" + idSuffix;
            input.className = "sliders";
            input.style.marginTop = "20px";
            input.value = inputValue;

            const spanVal = document.createElement("span");
            spanVal.id = "myspanS" + idSuffix;
            spanVal.className = "rangeslidervalue";
            spanVal.textContent = spanValue;

            insideDiv.appendChild(input);
            insideDiv.appendChild(spanVal);
            wrapper.appendChild(insideDiv);

            return wrapper;
        };

        const env = this._resetTimbreTable();
        for (let i = 0; i < 2; i++) {
            const synthDiv = document.createElement("div");
            synthDiv.id = "synth" + i;
            env.appendChild(synthDiv);
        }
        const envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = platformColor.widgetBackground;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        const mainDiv = docById("synth0");
        mainDiv.textContent = "";
        const pNode = document.createElement("p");

        const amRadio = document.createElement("input");
        amRadio.type = "radio";
        amRadio.name = "synthsName";
        amRadio.value = "AMSynth";
        if (this.lastSelectedSynth === "AMSynth") amRadio.checked = true;
        pNode.appendChild(amRadio);
        pNode.appendChild(document.createTextNode(_("AM synth")));
        pNode.appendChild(document.createElement("br"));

        const fmRadio = document.createElement("input");
        fmRadio.type = "radio";
        fmRadio.name = "synthsName";
        fmRadio.value = "FMSynth";
        if (this.lastSelectedSynth === "FMSynth") fmRadio.checked = true;
        pNode.appendChild(fmRadio);
        pNode.appendChild(document.createTextNode(_("FM synth")));
        pNode.appendChild(document.createElement("br"));

        const duoRadio = document.createElement("input");
        duoRadio.type = "radio";
        duoRadio.name = "synthsName";
        duoRadio.value = "DuoSynth";
        if (this.lastSelectedSynth === "DuoSynth") duoRadio.checked = true;
        pNode.appendChild(duoRadio);
        pNode.appendChild(document.createTextNode(_("duo synth")));
        pNode.appendChild(document.createElement("br"));

        mainDiv.appendChild(pNode);

        const subDiv = docById("synth1");
        const synthsName = docByName("synthsName");
        let synthChosen;
        for (let i = 0; i < synthsName.length; i++) {
            synthsName[i].onclick = async event => {
                synthChosen = event.target.value;
                this.lastSelectedSynth = synthChosen;
                subDiv.textContent = "";
                const chosenDiv = document.createElement("div");
                chosenDiv.id = "chosen";
                chosenDiv.textContent = synthChosen;
                subDiv.appendChild(chosenDiv);
                this._setActiveExclusive("synth");

                if (synthChosen === "AMSynth") {
                    this.isActive["amsynth"] = true;
                    this.isActive["fmsynth"] = false;
                    this.isActive["duosynth"] = false;

                    if (this.AMSynthesizer.length === 0) {
                        const topOfClamp =
                            this.activity.blocks.blockList[this.blockNo].connections[2];
                        const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                        const n = this.activity.blocks.blockList.length;
                        const AMSYNTHOBJ = [
                            [0, ["amsynth", {}], 0, 0, [null, 1, null]],
                            [1, ["number", { value: 1 }], 0, 0, [0]]
                        ];
                        this.activity.blocks.loadNewBlocks(AMSYNTHOBJ);

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

                    subDiv.appendChild(
                        createLabeledSlider(
                            0,
                            _("harmonicity"),
                            parseFloat(this.AMSynthParams[0]),
                            this.AMSynthParams[0]
                        )
                    );

                    // docById('myRangeS0').value = parseFloat(this.AMSynthParams[0]);
                    // docById('myspanS0').textContent = this.AMSynthParams[0];

                    this.amSynthParamvals["harmonicity"] = parseFloat(this.AMSynthParams[0]);

                    if (this.AMSynthesizer.length !== 1) {
                        blockValue = this.AMSynthesizer.length - 1;
                    }

                    document.getElementById("wrapperS0").addEventListener("change", event => {
                        const elem = event.target;
                        this._recordUndo("amsynth", this.AMSynthParams, blockValue);
                        docById("myRangeS0").value = parseFloat(elem.value);
                        this.amSynthParamvals["harmonicity"] = parseFloat(elem.value);
                        this.AMSynthParams[0] = elem.value;
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
                        const topOfClamp =
                            this.activity.blocks.blockList[this.blockNo].connections[2];
                        const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                        const n = this.activity.blocks.blockList.length;
                        const FMSYNTHOBJ = [
                            [0, ["fmsynth", {}], 0, 0, [null, 1, null]],
                            [1, ["number", { value: 10 }], 0, 0, [0]]
                        ];
                        this.activity.blocks.loadNewBlocks(FMSYNTHOBJ);

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

                    subDiv.appendChild(
                        createLabeledSlider(
                            0,
                            _("modulation index"),
                            parseFloat(this.FMSynthParams[0]),
                            this.FMSynthParams[0]
                        )
                    );

                    // docById('myRangeS0').value = parseFloat(this.FMSynthParams[0]);
                    // docById('myspanS0').textContent = this.FMSynthParams[0];

                    this.fmSynthParamvals["modulationIndex"] = parseFloat(this.FMSynthParams[0]);

                    if (this.FMSynthesizer.length !== 1) {
                        blockValue = this.FMSynthesizer.length - 1;
                    }

                    document.getElementById("wrapperS0").addEventListener("change", event => {
                        const elem = event.target;
                        this._recordUndo("fmsynth", this.FMSynthParams, blockValue);
                        docById("myRangeS0").value = parseFloat(elem.value);
                        docById("myspanS0").textContent = elem.value;
                        this.fmSynthParamvals["modulationIndex"] = parseFloat(elem.value);
                        this.FMSynthParams[0] = elem.value;
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
                        const topOfClamp =
                            this.activity.blocks.blockList[this.blockNo].connections[2];
                        const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                        const n = this.activity.blocks.blockList.length;
                        const NOISESYNTHOBJ = [
                            [0, ["noisesynth", {}], 0, 0, [null, 1, null]],
                            [1, ["number", { value: 10 }], 0, 0, [0]]
                        ];
                        this.activity.blocks.loadNewBlocks(NOISESYNTHOBJ);

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

                    // NoiseSynthParams[0] holds a string (e.g. "white"), not a number,
                    // so it's passed through as-is rather than via parseFloat like the
                    // other synth branches below.
                    subDiv.appendChild(
                        createLabeledSlider(
                            0,
                            _("modulation index"),
                            this.NoiseSynthParams[0],
                            this.NoiseSynthParams[0]
                        )
                    );

                    // docById('myRangeS0').value = parseFloat(this.FMSynthParams[0]);
                    // docById('myspanS0').textContent = this.FMSynthParams[0];

                    this.noiseSynthParamvals["noise.type"] = this.NoiseSynthParams[0];

                    if (this.NoiseSynthesizer.length !== 1) {
                        blockValue = this.NoiseSynthesizer.length - 1;
                    }

                    document.getElementById("wrapperS0").addEventListener("change", event => {
                        const elem = event.target;
                        this._recordUndo("noisesynth", this.NoiseSynthParams, blockValue);
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
                        const topOfClamp =
                            this.activity.blocks.blockList[this.blockNo].connections[2];
                        const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                        this._addDuoSynthBlock(bottomOfClamp, synthChosen);
                    }

                    subDiv.appendChild(
                        createLabeledSlider(
                            0,
                            _("vibrato rate"),
                            parseFloat(this.duoSynthParams[0]),
                            this.duoSynthParams[0]
                        )
                    );

                    subDiv.appendChild(
                        createLabeledSlider(
                            1,
                            _("vibrato amount"),
                            parseFloat(this.duoSynthParams[1]),
                            this.duoSynthParams[1]
                        )
                    );

                    if (this.duoSynthesizer.length !== 1) {
                        blockValue = this.duoSynthesizer.length - 1;
                    }

                    this._setDuoSynthParamVals(this.duoSynthParams[0], this.duoSynthParams[1]);

                    for (let i = 0; i < 2; i++) {
                        document
                            .getElementById("wrapperS" + i)
                            .addEventListener("change", event => {
                                const elem = event.target;
                                const m = Number(elem.id.slice(-1));
                                const val = parseFloat(elem.value);
                                this._recordUndo("duosynth", this.duoSynthParams, blockValue);
                                this.duoSynthParams[m] = elem.value;
                                docById("myRangeS" + m).value = val;
                                if (m === 0) {
                                    this._setDuoSynthParamVals(elem.value, this.duoSynthParams[1]);
                                } else if (m === 1) {
                                    this._setDuoSynthParamVals(this.duoSynthParams[0], elem.value);
                                }

                                this.duoSynthParams[m] = elem.value;
                                docById("myspanS" + m).textContent = elem.value;
                                this._update(blockValue, elem.value, m);
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

            if (synthsName[i].checked) {
                synthsName[i].onclick({ target: synthsName[i] });
            }
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

        const env = this._resetTimbreTable();

        const wrapperOsc0 = document.createElement("div");
        wrapperOsc0.id = "wrapperOsc0";
        const labelDivOsc0 = document.createElement("div");
        labelDivOsc0.id = "sOsc0";
        const spanLabelOsc0 = document.createElement("span");
        spanLabelOsc0.textContent = _("type");
        labelDivOsc0.appendChild(spanLabelOsc0);
        wrapperOsc0.appendChild(labelDivOsc0);

        const selOsc = document.createElement("div");
        selOsc.id = "selOsc";
        wrapperOsc0.appendChild(selOsc);
        env.appendChild(wrapperOsc0);

        const wrapperOsc1 = document.createElement("div");
        wrapperOsc1.id = "wrapperOsc1";
        const labelDivOsc1 = document.createElement("div");
        labelDivOsc1.id = "sOsc1";
        const spanLabelOsc1 = document.createElement("span");
        spanLabelOsc1.textContent = _("partials");
        labelDivOsc1.appendChild(spanLabelOsc1);
        wrapperOsc1.appendChild(labelDivOsc1);

        const insideDivOsc = document.createElement("div");
        insideDivOsc.className = "insideDivOsc";
        const inputOsc1 = document.createElement("input");
        inputOsc1.type = "range";
        inputOsc1.id = "myRangeO0";
        inputOsc1.className = "sliders";
        inputOsc1.style.marginTop = "20px";
        inputOsc1.min = "0";
        inputOsc1.max = "20";
        inputOsc1.value = parseFloat(this.oscParams[1]);
        const spanValOsc1 = document.createElement("span");
        spanValOsc1.id = "myspanO0";
        spanValOsc1.className = "rangeslidervalue";
        spanValOsc1.textContent = this.oscParams[1];
        insideDivOsc.appendChild(inputOsc1);
        insideDivOsc.appendChild(spanValOsc1);
        wrapperOsc1.appendChild(insideDivOsc);
        env.appendChild(wrapperOsc1);
        const envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = platformColor.widgetBackground;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        const myDiv = docById("selOsc");
        const selectOsc1 = document.createElement("select");
        selectOsc1.id = "selOsc1";

        for (let i = 0; i < OSCTYPES.length; i++) {
            const opt = document.createElement("option");
            if (OSCTYPES[i][0].length === 0) {
                opt.value = OSCTYPES[i][1];
                opt.textContent = OSCTYPES[i][1];
                if (OSCTYPES[i][0] === this.oscParams[0] || OSCTYPES[i][1] === this.oscParams[0]) {
                    opt.selected = true;
                }
            } else {
                opt.value = OSCTYPES[i][0];
                opt.textContent = OSCTYPES[i][0];
                if (OSCTYPES[i][0] === this.oscParams[0] || OSCTYPES[i][1] === this.oscParams[0]) {
                    opt.selected = true;
                }
            }
            selectOsc1.appendChild(opt);
        }
        myDiv.appendChild(selectOsc1);

        document.getElementById("wrapperOsc0").addEventListener("change", event => {
            const elem = event.target;
            this._recordUndo("oscillator", this.oscParams, blockValue);
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

        document.getElementById("wrapperOsc1").addEventListener("change", event => {
            const elem = event.target;
            const val = parseFloat(elem.value);
            this._recordUndo("oscillator", this.oscParams, blockValue);
            this.oscParams[1] = elem.value;
            this.synthVals["oscillator"]["type"] = this.oscParams[0] + val.toString();
            docById("myRangeO0").value = val;
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

        const env = this._resetTimbreTable();

        for (let i = 0; i < 4; i++) {
            const wrapperEnv = document.createElement("div");
            wrapperEnv.id = "wrapperEnv" + i;

            const circleDiv = document.createElement("div");
            circleDiv.className = "circle";
            circleDiv.textContent = "ADSR".charAt(i);
            wrapperEnv.appendChild(circleDiv);

            const insideDivEnv = document.createElement("div");
            insideDivEnv.className = "insideDivEnv";

            const rangeEnv = document.createElement("input");
            rangeEnv.type = "range";
            rangeEnv.id = "myRange" + i;
            rangeEnv.className = "sliders";
            rangeEnv.style.marginTop = "20px";
            rangeEnv.value = parseFloat(this.ENVs[i]);

            const spanEnv = document.createElement("span");
            spanEnv.id = "myspan" + i;
            spanEnv.className = "rangeslidervalue";
            spanEnv.textContent = this.ENVs[i];

            insideDivEnv.appendChild(rangeEnv);
            insideDivEnv.appendChild(spanEnv);
            wrapperEnv.appendChild(insideDivEnv);

            wrapperEnv.addEventListener("change", event => {
                const elem = event.target;
                const val = parseFloat(elem.value);
                this._recordUndo("envelope", this.ENVs, blockValue);
                docById("myRange" + i).value = val;
                docById("myspan" + i).textContent = elem.value;
                this.synthVals["envelope"][this.adsrMap[i]] = val / 100;
                this.ENVs[i] = elem.value;
                this._update(blockValue, val, i);
                this.activity.logo.synth.createSynth(
                    0,
                    this.instrumentName,
                    this.synthVals["oscillator"]["source"],
                    this.synthVals
                );
                this._playNote("G4", 1 / 8);
            });

            env.appendChild(wrapperEnv);
        }
        const envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = platformColor.widgetBackground;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        for (let i = 0; i < 4; i++) {
            this.synthVals["envelope"][this.adsrMap[i]] = parseFloat(this.ENVs[i]) / 100;
            this._update(blockValue, this.ENVs[i], i);
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
        const env = this._resetTimbreTable();

        for (let f = 0; f < this.fil.length; f++) {
            this._createFilter(f, env);
        }

        //event delegation
        this._setupEventDelegation();
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

        const fragment = document.createDocumentFragment();

        const containerDiv = document.createElement("div");
        if (f % 2 === 1) {
            containerDiv.className = "rectangle";
            const spacer = document.createElement("p");
            spacer.textContent = "\u00A0";
            containerDiv.appendChild(spacer);
        } else if (f > 0) {
            const spacer = document.createElement("p");
            spacer.textContent = "\u00A0";
            containerDiv.appendChild(spacer);
        }

        const typeWrapper = document.createElement("div");
        typeWrapper.className = "wrapper";
        typeWrapper.id = "wrapper" + wrapperIDs[0];

        const typeLabel = document.createElement("div");
        typeLabel.className = "s";
        typeLabel.id = "s" + wrapperIDs[0];

        const typeSpan = document.createElement("span");
        typeSpan.textContent = _("type");
        typeLabel.appendChild(typeSpan);

        const selectorID = "selector" + f;
        const selID = "sel" + f;

        const filterSelector = document.createElement("div");
        filterSelector.className = "filterselector";
        filterSelector.id = selectorID;

        typeWrapper.appendChild(typeLabel);
        typeWrapper.appendChild(filterSelector);
        containerDiv.appendChild(typeWrapper);

        // wrapper
        const rolloffWrapper = document.createElement("div");
        rolloffWrapper.className = "wrapper";
        rolloffWrapper.id = "wrapper" + wrapperIDs[1];

        const rolloffLabel = document.createElement("div");
        rolloffLabel.className = "s";
        rolloffLabel.id = "s" + wrapperIDs[1];

        const rolloffSpan = document.createElement("span");
        rolloffSpan.textContent = _("rolloff");
        rolloffLabel.appendChild(rolloffSpan);

        const insideDivRolloff = document.createElement("div");
        insideDivRolloff.className = "insideDivFilter";

        const rolloffP = document.createElement("p");

        const radioValues = ["-12", "-24", "-48", "-96"];
        for (let i = 0; i < 4; i++) {
            const radio = document.createElement("input");
            radio.type = "radio";
            radio.id = "radio" + radioIDs[i];
            radio.name = "rolloff" + f;
            radio.value = radioValues[i];

            let currentRolloff = "-12";
            if (
                instrumentsFilters[0][this.instrumentName] &&
                instrumentsFilters[0][this.instrumentName][f]
            ) {
                currentRolloff = String(
                    instrumentsFilters[0][this.instrumentName][f].filterRolloff
                );
            }
            if (radioValues[i] === currentRolloff) {
                radio.checked = true;
            }

            rolloffP.appendChild(radio);
            rolloffP.appendChild(document.createTextNode(radioValues[i]));
        }

        insideDivRolloff.appendChild(rolloffP);
        rolloffWrapper.appendChild(rolloffLabel);
        rolloffWrapper.appendChild(insideDivRolloff);
        containerDiv.appendChild(rolloffWrapper);

        // wrapper
        const freqWrapper = document.createElement("div");
        freqWrapper.className = "wrapper";
        freqWrapper.id = "wrapper" + wrapperIDs[2];

        const freqLabel = document.createElement("div");
        freqLabel.className = "s";
        freqLabel.id = "s" + wrapperIDs[2];

        const freqSpan = document.createElement("span");
        freqSpan.textContent = _("frequency");
        freqLabel.appendChild(freqSpan);

        const insideDivFreq = document.createElement("div");
        insideDivFreq.className = "insideDivFilter";

        const slider = document.createElement("input");
        slider.type = "range";
        slider.id = "myRangeF" + f;
        slider.className = "sliders";
        slider.style.marginTop = "20px";
        slider.max = "7050";
        slider.value = parseFloat(this.filterParams[f * 3 + 2]);

        const sliderValue = document.createElement("span");
        sliderValue.id = "myspanF" + f;
        sliderValue.className = "rangeslidervalue";
        sliderValue.textContent = this.filterParams[f * 3 + 2];

        insideDivFreq.appendChild(slider);
        insideDivFreq.appendChild(sliderValue);
        freqWrapper.appendChild(freqLabel);
        freqWrapper.appendChild(insideDivFreq);
        containerDiv.appendChild(freqWrapper);

        fragment.appendChild(containerDiv);

        env.appendChild(fragment);

        const select = document.createElement("select");
        select.className = "sel";
        select.id = selID;

        let selectedFilter = null;

        for (let i = 0; i < FILTERTYPES.length; i++) {
            const option = document.createElement("option");

            if (FILTERTYPES[i][0].length === 0) {
                option.value = FILTERTYPES[i][1];
                option.textContent = FILTERTYPES[i][1];

                if (FILTERTYPES[i][1] === this.filterParams[f * 3]) {
                    option.selected = true;
                    selectedFilter = FILTERTYPES[i][1];
                }
            } else {
                option.value = FILTERTYPES[i][0];
                option.textContent = FILTERTYPES[i][0];

                if (FILTERTYPES[i][0] === this.filterParams[f * 3]) {
                    option.selected = true;
                    selectedFilter = FILTERTYPES[i][0];
                }
            }

            select.appendChild(option);
        }
        const selectorDiv = docById(selectorID);
        selectorDiv.appendChild(select);

        if (!instrumentsFilters[0][this.instrumentName]) {
            instrumentsFilters[0][this.instrumentName] = [];
        }

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
    /**
     * Sets up event delegation for all widget sections
     * @private
     * @returns {void}
     */
    _setupEventDelegation() {
        const timbreTable = docById("timbreTable");

        // Clean up
        this._cleanupEventListeners();

        // Cache button
        const filterButtonCell = docById("filterButtonCell");

        // single event handler
        this._eventHandler = event => {
            const target = event.target;
            const targetId = target.id || "";

            if (targetId.startsWith("sel") && event.type === "change") {
                filterButtonCell.style.backgroundColor = "#C8C8C0";
                const m = Number(targetId.slice("sel".length));
                instrumentsFilters[0][this.instrumentName][m]["filterType"] = target.value;
                this._update(m, target.value, 0);

                const error = instrumentsFilters[0][this.instrumentName].filter(
                    el => el.filterType === target.value
                );
                if (error.length > 1) {
                    this.activity.errorMsg(_("Filter already present."), 3000);
                }
                this._playNote("G4", 1 / 8);
            } else if (targetId.startsWith("radio") && event.type === "click") {
                const m = Number(targetId.replace("radio", ""));
                instrumentsFilters[0][this.instrumentName][Math.floor(m / 4)]["filterRolloff"] =
                    parseFloat(target.value);
                this._update(Math.floor(m / 4), target.value, 1);
                this._playNote("G4", 1 / 8);
            } else if (
                targetId.startsWith("myRangeF") &&
                (event.type === "change" || event.type === "input")
            ) {
                filterButtonCell.style.backgroundColor = "#C8C0C8";
                const m = Number(targetId.slice("myRangeF".length));
                const spanElement = docById("myspanF" + m);
                if (spanElement) {
                    spanElement.textContent = target.value;
                }

                instrumentsFilters[0][this.instrumentName][m]["filterFrequency"] = parseFloat(
                    target.value
                );
                this._update(m, target.value, 2);
                this._playNote("G4", 1 / 8);
            } else if (targetId.startsWith("wrapperS") && event.type === "change") {
                this._playNote("G4", 1 / 8);
            } else if (targetId.startsWith("wrapperOsc") && event.type === "change") {
                this._playNote("G4", 1 / 8);
            } else if (targetId.startsWith("wrapperEnv") && event.type === "change") {
                this._playNote("G4", 1 / 8);
            } else if (targetId.startsWith("wrapperFx") && event.type === "change") {
                this._playNote("G4", 1 / 8);
            }
        };

        timbreTable.addEventListener("change", this._eventHandler);
        timbreTable.addEventListener("click", this._eventHandler);
        timbreTable.addEventListener("input", this._eventHandler);

        this._eventListeners = {
            element: timbreTable,
            listeners: [
                { type: "change", handler: this._eventHandler },
                { type: "click", handler: this._eventHandler },
                { type: "input", handler: this._eventHandler }
            ]
        };
    }

    /**
     * Cleans up all event listeners
     * @private
     * @returns {void}
     */
    _cleanupEventListeners() {
        if (this._eventListeners && this._eventListeners.element) {
            this._eventListeners.listeners.forEach(listener => {
                this._eventListeners.element.removeEventListener(listener.type, listener.handler);
            });
            this._eventListeners = {};
        }
    }

    /**
     * event delegation
     * @private
     * @returns {void}
     */
    _addFilterListeners() {
        this._setupEventDelegation();
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
            this._setRolloffRadioChecked(radioIDs, rolloff);
        }
    }

    /**
     * @private
     * Checks the radio button matching the given filter rolloff value and
     * unchecks the other three among the given group of ids.
     * @param {number[]} radioIDs - the 4 radio ids for this filter, in -12/-24/-48/-96 order.
     * @param {number} rolloff
     * @returns {void}
     */
    _setRolloffRadioChecked(radioIDs, rolloff) {
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

    /**
     * @private
     * @returns {void}
     * lets you add addition filters to your custom timbre.
     */
    async _addFilter() {
        const env = docById("timbreTable");
        const topOfClamp = this.activity.blocks.blockList[this.blockNo].connections[2];
        const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

        // The block we'll be adding will be at the end of the list.
        this.fil.push(this.activity.blocks.blockList.length);

        const selectedFilters = instrumentsFilters[0][this.instrumentName].slice();
        const filterType = FILTERTYPES.slice().filter(filter => {
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

        // No need addFilterListeners() using event delega
        this._updateFilters();
    }

    /**
     * @private
     * @returns {void}
     * lets you add effects to your custom timbre: tremelo, vibrato, chorus, phaser, and distortion.
     * When an effect is selected, additional controls will appear in the widget.
     */
    _effects() {
        let blockValue = 0;

        const env = this._resetTimbreTable();
        for (let i = 0; i < 2; i++) {
            const effectDiv = document.createElement("div");
            effectDiv.id = "effect" + i;
            env.appendChild(effectDiv);
        }
        const envAppend = document.createElement("div");
        envAppend.id = "envAppend";
        envAppend.style.backgroundColor = platformColor.widgetBackground;
        envAppend.style.height = "30px";
        envAppend.style.marginTop = "40px";
        envAppend.style.overflow = "auto";
        env.append(envAppend);

        const mainDiv = docById("effect0");
        const effects = ["Tremolo", "Vibrato", "Chorus", "Phaser", "Distortion"];
        mainDiv.textContent = "";
        const pNode = document.createElement("p");
        effects.forEach(effect => {
            const radioNode = document.createElement("input");
            radioNode.type = "radio";
            radioNode.name = "effectsName";
            radioNode.value = effect;
            if (
                this.lastSelectedEffect &&
                this.lastSelectedEffect.toLowerCase() === effect.toLowerCase()
            ) {
                radioNode.checked = true;
            }
            pNode.appendChild(radioNode);
            pNode.appendChild(document.createTextNode(_(effect.toLowerCase())));
            pNode.appendChild(document.createElement("br"));
        });
        mainDiv.appendChild(pNode);

        const subDiv = docById("effect1");
        const effectsName = docByName("effectsName");
        let effectChosen;

        for (let i = 0; i < effectsName.length; i++) {
            effectsName[i].onclick = async event => {
                effectChosen = event.target.value;
                this.lastSelectedEffect = effectChosen;

                // Ensure the effects object exists for this instrument.
                if (
                    !instrumentsEffects[0][this.instrumentName] ||
                    Array.isArray(instrumentsEffects[0][this.instrumentName])
                ) {
                    instrumentsEffects[0][this.instrumentName] = {};
                }

                subDiv.textContent = "";
                const chosenNode = document.createElement("div");
                chosenNode.id = "chosen";
                chosenNode.textContent = effectChosen;
                subDiv.appendChild(chosenNode);

                const buildSliders = (numSliders, maxVal) => {
                    for (let j = 0; j < numSliders; j++) {
                        const wrapperFx = document.createElement("div");
                        wrapperFx.id = "wrapperFx" + j;
                        const labelFx = document.createElement("div");
                        labelFx.id = "sFx" + j;
                        const spanFx = document.createElement("span");
                        labelFx.appendChild(spanFx);
                        wrapperFx.appendChild(labelFx);
                        const insideDivFx = document.createElement("div");
                        insideDivFx.className = "insideDivEffects";
                        const inputFx = document.createElement("input");
                        inputFx.type = "range";
                        inputFx.id = "myRangeFx" + j;
                        inputFx.className = "sliders";
                        inputFx.style.marginTop = "20px";
                        if (maxVal) inputFx.max = maxVal;
                        inputFx.value = "2";
                        const spanValFx = document.createElement("span");
                        spanValFx.id = "myspanFx" + j;
                        spanValFx.className = "rangeslidervalue";
                        spanValFx.textContent = "2";
                        insideDivFx.appendChild(inputFx);
                        insideDivFx.appendChild(spanValFx);
                        wrapperFx.appendChild(insideDivFx);
                        subDiv.appendChild(wrapperFx);
                    }
                };
                if (effectChosen === "Tremolo") {
                    this.isActive["tremolo"] = true;
                    this.isActive["chorus"] = false;
                    this.isActive["vibrato"] = false;
                    this.isActive["distortion"] = false;
                    this.isActive["phaser"] = false;

                    instrumentsEffects[0][this.instrumentName]["tremoloActive"] = true;

                    buildSliders(2);
                    docById("sFx0").textContent = _("rate");
                    docById("myRangeFx0").value = 10;
                    docById("myspanFx0").textContent = "10";
                    docById("sFx1").textContent = _("depth");
                    docById("myRangeFx1").value = 50;
                    docById("myspanFx1").textContent = "50";

                    if (this.tremoloEffect.length !== 0) {
                        blockValue = this.tremoloEffect.length - 1;
                        const myRangeFxs = [docById("myRangeFx0"), docById("myRangeFx1")];
                        const myspanFxs = [docById("myspanFx0"), docById("myspanFx1")];
                        for (let j = 0; j < 2; j++) {
                            myRangeFxs[j].value = parseFloat(this.tremoloParams[j]);
                            myspanFxs[j].textContent =
                                Math.round(parseFloat(this.tremoloParams[j]) * 100) / 100;
                            this._update(blockValue, this.tremoloParams[j], j);
                        }
                    }

                    if (this.tremoloEffect.length === 0) {
                        // This is the first block in the child stack
                        // of the Timbre clamp.
                        const topOfClamp =
                            this.activity.blocks.blockList[this.blockNo].connections[2];

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

                    document.getElementById("wrapperFx0").addEventListener("change", event => {
                        const elem = event.target;
                        let val = parseFloat(elem.value);
                        val = Math.round(val * 100) / 100;
                        if (!instrumentsEffects[0][this.instrumentName]) {
                            instrumentsEffects[0][this.instrumentName] = {};
                        }
                        this._recordUndo(
                            "tremolo",
                            this.tremoloParams,
                            this.tremoloEffect.length - 1
                        );
                        docById("myRangeFx0").value = val;
                        docById("myspanFx0").textContent = val;
                        instrumentsEffects[0][this.instrumentName]["tremoloFrequency"] = val;
                        this.tremoloParams[0] = elem.value;
                        this._update(this.tremoloEffect.length - 1, val, 0);
                        this._playNote("G4", 1 / 8);
                    });

                    document.getElementById("wrapperFx1").addEventListener("change", event => {
                        const elem = event.target;
                        let val = parseFloat(elem.value);
                        val = Math.round(val * 100) / 100;
                        if (!instrumentsEffects[0][this.instrumentName]) {
                            instrumentsEffects[0][this.instrumentName] = {};
                        }
                        this._recordUndo(
                            "tremolo",
                            this.tremoloParams,
                            this.tremoloEffect.length - 1
                        );
                        docById("myRangeFx1").value = val;
                        docById("myspanFx1").textContent = val;
                        instrumentsEffects[0][this.instrumentName]["tremoloDepth"] = val / 100;
                        this.tremoloParams[1] = elem.value;
                        this._update(this.tremoloEffect.length - 1, val, 1);
                        this._playNote("G4", 1 / 8);
                    });
                } else if (effectChosen === "Vibrato") {
                    this.isActive["tremolo"] = false;
                    this.isActive["chorus"] = false;
                    this.isActive["vibrato"] = true;
                    this.isActive["distortion"] = false;
                    this.isActive["phaser"] = false;

                    instrumentsEffects[0][this.instrumentName]["vibratoActive"] = true;
                    buildSliders(2, 25);
                    docById("sFx0").textContent = _("intensity");
                    docById("sFx1").textContent = _("rate");

                    const myRangeFxs = [docById("myRangeFx0"), docById("myRangeFx1")];
                    const myspanFxs = [docById("myspanFx0"), docById("myspanFx1")];

                    if (this.vibratoEffect.length > 0) {
                        myRangeFxs[0].value = parseFloat(this.vibratoParams[0]);
                        myspanFxs[0].textContent =
                            Math.round(parseFloat(this.vibratoParams[0]) * 100) / 100;
                        // Scale of rate is 0 to 1, so we need to multiply by 100
                        myRangeFxs[1].value = 100 / parseFloat(this.vibratoParams[1]);
                        const obj = rationalToFraction(1 / parseFloat(this.vibratoParams[1]));
                        myspanFxs[1].textContent = obj[0] + "/" + obj[1]; // this.vibratoParams[1];
                    } else {
                        // If necessary, add a vibrato block.
                        const topOfTimbreClamp =
                            this.activity.blocks.blockList[this.blockNo].connections[2];

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

                        myRangeFxs[0].value = 5;
                        myspanFxs[0].textContent = "5";
                        instrumentsEffects[0][this.instrumentName]["vibratoIntensity"] = 0.05;

                        myRangeFxs[1].value = 100 / 16;
                        myspanFxs[1].textContent = "1/16";
                        instrumentsEffects[0][this.instrumentName]["vibratoFrequency"] = 1 / 16;
                    }

                    // Add the listeners for the sliders.
                    document.getElementById("wrapperFx0").addEventListener("change", event => {
                        const elem = event.target;
                        let val = parseFloat(elem.value);
                        val = Math.round(val * 100) / 100;
                        if (!instrumentsEffects[0][this.instrumentName]) {
                            instrumentsEffects[0][this.instrumentName] = {};
                        }
                        this._recordUndo(
                            "vibrato",
                            this.vibratoParams,
                            this.vibratoEffect.length - 1
                        );
                        myRangeFxs[0].value = val;
                        myspanFxs[0].textContent = val;
                        instrumentsEffects[0][this.instrumentName]["vibratoIntensity"] = val / 100;
                        this.vibratoParams[0] = elem.value;
                        this._update(this.vibratoEffect.length - 1, val, 0);
                        this._playNote("G4", 1 / 8);
                    });

                    document.getElementById("wrapperFx1").addEventListener("change", event => {
                        const elem = event.target;
                        let val = parseFloat(elem.value);
                        val = Math.round(val * 100) / 100;
                        if (!instrumentsEffects[0][this.instrumentName]) {
                            instrumentsEffects[0][this.instrumentName] = {};
                        }
                        this._recordUndo(
                            "vibrato",
                            this.vibratoParams,
                            this.vibratoEffect.length - 1
                        );
                        myRangeFxs[1].value = val;
                        const obj = oneHundredToFraction(val);
                        myspanFxs[1].textContent = obj[0] + "/" + obj[1];
                        const temp = parseFloat(obj[0]) / parseFloat(obj[1]);

                        instrumentsEffects[0][this.instrumentName]["vibratoFrequency"] = temp;
                        this.vibratoParams[1] = elem.value;
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

                    buildSliders(3);
                    docById("sFx0").textContent = _("rate");
                    docById("myRangeFx0").value = 2;
                    docById("myspanFx0").textContent = "2";

                    docById("sFx1").textContent = _("delay (MS)");
                    docById("myRangeFx1").value = 4;
                    docById("myspanFx1").textContent = "4";

                    docById("sFx2").textContent = _("depth");
                    docById("myRangeFx2").value = 70;
                    docById("myspanFx2").textContent = "70";

                    if (this.chorusEffect.length !== 0) {
                        blockValue = this.chorusEffect.length - 1;
                        const myRangeFxs = [
                            docById("myRangeFx0"),
                            docById("myRangeFx1"),
                            docById("myRangeFx2")
                        ];
                        const myspanFxs = [
                            docById("myspanFx0"),
                            docById("myspanFx1"),
                            docById("myspanFx2")
                        ];
                        for (let i = 0; i < 3; i++) {
                            myRangeFxs[i].value = parseFloat(this.chorusParams[i]);
                            myspanFxs[i].textContent =
                                Math.round(parseFloat(this.chorusParams[i]) * 100) / 100;
                            this._update(blockValue, this.chorusParams[i], i);
                        }
                    }

                    if (this.chorusEffect.length === 0) {
                        const topOfClamp =
                            this.activity.blocks.blockList[this.blockNo].connections[2];

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
                        // Only a new block starts from the defaults; an existing
                        // one keeps the values it set when the timbre ran.
                        instrumentsEffects[0][this.instrumentName]["chorusRate"] = 2;
                        instrumentsEffects[0][this.instrumentName]["delayTime"] = 4;
                        instrumentsEffects[0][this.instrumentName]["chorusDepth"] = 0.7;

                        await delayExecution(500);
                        this.clampConnection(n, 4, topOfClamp);
                    }

                    const myRangeFxs = [
                        docById("myRangeFx0"),
                        docById("myRangeFx1"),
                        docById("myRangeFx2")
                    ];
                    const myspanFxs = [
                        docById("myspanFx0"),
                        docById("myspanFx1"),
                        docById("myspanFx2")
                    ];
                    for (let i = 0; i < 3; i++) {
                        document
                            .getElementById("wrapperFx" + i)
                            .addEventListener("change", event => {
                                const elem = event.target;
                                const m = Number(elem.id.slice(-1));
                                let val = parseFloat(elem.value);
                                val = Math.round(val * 100) / 100;
                                if (!instrumentsEffects[0][this.instrumentName]) {
                                    instrumentsEffects[0][this.instrumentName] = {};
                                }
                                myRangeFxs[m].value = val;
                                myspanFxs[m].textContent = val;

                                this._recordUndo("chorus", this.chorusParams, blockValue);

                                if (m === 0) {
                                    instrumentsEffects[0][this.instrumentName]["chorusRate"] = val;
                                }

                                if (m === 1) {
                                    instrumentsEffects[0][this.instrumentName]["delayTime"] = val;
                                }

                                if (m === 2) {
                                    instrumentsEffects[0][this.instrumentName]["chorusDepth"] =
                                        val / 100;
                                }

                                this.chorusParams[m] = elem.value;
                                this._update(blockValue, elem.value, m);
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

                    buildSliders(3, 1000);
                    docById("myRangeFx0").min = 0;
                    docById("myRangeFx0").max = 100;
                    docById("myRangeFx1").min = 0;
                    docById("myRangeFx1").max = 10;
                    docById("myRangeFx2").min = 0;
                    docById("sFx0").textContent = _("rate");
                    docById("myRangeFx0").value = 5;
                    docById("myspanFx0").textContent = "5";
                    docById("sFx1").textContent = _("octaves");
                    docById("myRangeFx1").value = 3;
                    docById("myspanFx1").textContent = "3";
                    docById("sFx2").textContent = _("base frequency");
                    docById("myRangeFx2").value = 100;
                    docById("myspanFx2").textContent = "100";

                    if (this.phaserEffect.length !== 0) {
                        blockValue = this.phaserEffect.length - 1;
                        const myRangeFxs = [
                            docById("myRangeFx0"),
                            docById("myRangeFx1"),
                            docById("myRangeFx2")
                        ];
                        const myspanFxs = [
                            docById("myspanFx0"),
                            docById("myspanFx1"),
                            docById("myspanFx2")
                        ];
                        for (let i = 0; i < 3; i++) {
                            myRangeFxs[i].value = parseFloat(this.phaserParams[i]);
                            myspanFxs[i].textContent =
                                Math.round(parseFloat(this.phaserParams[i]) * 100) / 100;
                            this._update(blockValue, this.phaserParams[i], i);
                        }
                    }

                    if (this.phaserEffect.length === 0) {
                        const topOfClamp =
                            this.activity.blocks.blockList[this.blockNo].connections[2];

                        const n = this.activity.blocks.blockList.length;
                        const PHASEROBJ = [
                            [0, ["phaser", {}], 0, 0, [null, 1, 2, 3, null, 4]],
                            [1, ["number", { value: 5 }], 0, 0, [0]],
                            [2, ["number", { value: 3 }], 0, 0, [0]],
                            [3, ["number", { value: 100 }], 0, 0, [0]],
                            [4, "hidden", 0, 0, [0, null]]
                        ];
                        this.activity.blocks.loadNewBlocks(PHASEROBJ);

                        this.phaserEffect.push(n);
                        this.phaserParams.push(5);
                        this.phaserParams.push(3);
                        // Keep base frequency aligned with UI/default block value to avoid state drift.
                        this.phaserParams.push(100);
                        instrumentsEffects[0][this.instrumentName]["rate"] = 5;
                        instrumentsEffects[0][this.instrumentName]["octaves"] = 3;
                        instrumentsEffects[0][this.instrumentName]["baseFrequency"] = 100;

                        await delayExecution(500);
                        this.clampConnection(n, 4, topOfClamp);
                    }

                    const myRangeFxs = [
                        docById("myRangeFx0"),
                        docById("myRangeFx1"),
                        docById("myRangeFx2")
                    ];
                    const myspanFxs = [
                        docById("myspanFx0"),
                        docById("myspanFx1"),
                        docById("myspanFx2")
                    ];
                    for (let i = 0; i < 3; i++) {
                        document
                            .getElementById("wrapperFx" + i)
                            .addEventListener("change", event => {
                                const elem = event.target;
                                const m = Number(elem.id.slice(-1));
                                let val = parseFloat(elem.value);
                                val = Math.round(val * 100) / 100;
                                if (!instrumentsEffects[0][this.instrumentName]) {
                                    instrumentsEffects[0][this.instrumentName] = {};
                                }
                                myRangeFxs[m].value = val;
                                myspanFxs[m].textContent = val;

                                this._recordUndo("phaser", this.phaserParams, blockValue);

                                if (m === 0) {
                                    instrumentsEffects[0][this.instrumentName]["rate"] = val;
                                }

                                if (m === 1) {
                                    instrumentsEffects[0][this.instrumentName]["octaves"] = val;
                                }

                                if (m === 2) {
                                    instrumentsEffects[0][this.instrumentName]["baseFrequency"] =
                                        val;
                                }

                                this.phaserParams[m] = elem.value;
                                this._update(blockValue, val, m);
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

                    buildSliders(1);

                    docById("sFx0").textContent = _("distortion amount");
                    docById("myRangeFx0").value = 40;
                    docById("myspanFx0").textContent = "40";

                    if (this.distortionEffect.length !== 0) {
                        blockValue = this.distortionEffect.length - 1;
                        docById("myRangeFx0").value = parseFloat(this.distortionParams[0]);
                        docById("myspanFx0").textContent =
                            Math.round(parseFloat(this.distortionParams[0]) * 100) / 100;
                        this._update(blockValue, this.distortionParams[0], 0);
                    }

                    if (this.distortionEffect.length === 0) {
                        const topOfClamp =
                            this.activity.blocks.blockList[this.blockNo].connections[2];

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

                    document.getElementById("wrapperFx0").addEventListener("change", event => {
                        const elem = event.target;
                        let val = parseFloat(elem.value);
                        val = Math.round(val * 100) / 100;
                        if (!instrumentsEffects[0][this.instrumentName]) {
                            instrumentsEffects[0][this.instrumentName] = {};
                        }
                        this._recordUndo("distortion", this.distortionParams, blockValue);
                        docById("myRangeFx0").value = val;
                        docById("myspanFx0").textContent = val;
                        instrumentsEffects[0][this.instrumentName]["distortionAmount"] = val / 100;
                        this.distortionParams[0] = val;
                        this._update(blockValue, val, 0);
                        this._playNote("G4", 1 / 8);
                    });
                }
            };

            if (effectsName[i].checked) {
                effectsName[i].onclick({ target: effectsName[i] });
            }
        }
    }
}

if (typeof window !== "undefined") {
    window.TimbrePanels = TimbrePanels;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = TimbrePanels;
}
