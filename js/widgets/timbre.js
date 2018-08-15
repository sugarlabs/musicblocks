// Copyright (c) 2017,18 Walter Bender
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

function TimbreWidget () {
    const BUTTONDIVWIDTH = 476;  // 8 buttons 476 = (55 + 4) * 8
    const OUTERWINDOWWIDTH = 685;
    const INNERWINDOWWIDTH = 600;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;

    var timbreTableDiv = docById('timbreTableDiv');

    this.notesToPlay = [];
    this.env = [];
    this.ENVs = [];
    this.synthVals = {
        'oscillator': {
            'type' : 'sine6',
            'source' : DEFAULTOSCILLATORTYPE
        },
        'envelope': {
            'attack': 0.01,
            'decay': 0.5,
            'sustain': 0.6,
            'release': 0.01
        },
    };

    this.adsrMap = ['attack', 'decay', 'sustain', 'release'];
    this.amSynthParamvals = {
        'harmonicity' : 3
    };

    this.fmSynthParamvals = {
        'modulationIndex': 10
    };

    this.noiseSynthParamvals = {
        'noise': {
            'type': 'white'
        },
    };

    this.duoSynthParamVals = {
        'vibratoAmount': 0.5,
        'vibratoRate': 5
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
    this.activeParams = ['synth', 'amsynth', 'fmsynth', 'noisesynth', 'duosynth', 'envelope', 'oscillator', 'filter', 'effects', 'chorus', 'vibrato', 'phaser', 'distortion', 'tremolo'];
    this.isActive = {};

    for (var i = 0; i < this.activeParams.length; i++) {
        this.isActive[this.activeParams[i]] = false;
    }

    this.blockNo = null;  // index no. of the timbre widget block
    this.instrumentName = 'custom';

    this._addButton = function (row, icon, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onmouseover = function () {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout = function () {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };

    this._update = function (i, value, k) {
        // This function is used to update the parameters in the
        // blocks contained in the timbre widget clamp.
        // i is the index into the parameter array. (For example, there
        // can be multiple filter blocks associated with a timbre.)
        // k is the parameter to update (There can be multiple
        // parameters per block.)

        var updateParams = [];

        if (this.isActive['envelope'] === true && this.env[i] != null) {
            for (j = 0; j < 4; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.env[i]].connections[j + 1];
            }
        }

        if (this.isActive['filter'] === true && this.fil[i] != null) {
            for (j = 0; j < 3; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.fil[i]].connections[j + 1];
            }
        }

        if (this.isActive['oscillator'] === true && this.osc[i] != null) {
            for (j = 0; j < 2; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.osc[i]].connections[j + 1];
            }
        }

        if (this.isActive['amsynth'] === true && this.AMSynthesizer[i] != null) {
            updateParams[0] = this._logo.blocks.blockList[this.AMSynthesizer[i]].connections[1];
        }

        if (this.isActive['fmsynth'] === true && this.FMSynthesizer[i] != null) {
            updateParams[0] = this._logo.blocks.blockList[this.FMSynthesizer[i]].connections[1];
        }

        if (this.isActive['noisesynth'] === true && this.NoiseSynthesizer[i] != null) {
            updateParams[0] = this._logo.blocks.blockList[this.NoiseSynthesizer[i]].connections[1];
        }

        if (this.isActive['duosynth'] === true && this.duoSynthesizer[i] != null) {
            for (j = 0; j < 2; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.duoSynthesizer[i]].connections[j + 1];
            }
        }

        if (this.isActive['tremolo'] === true && this.tremoloEffect[i] != null) {
            for (j = 0; j < 2; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.tremoloEffect[i]].connections[j + 1];
            }
        }

        if (this.isActive['vibrato'] === true && this.vibratoEffect[i] != null) {
            updateParams[0] = this._logo.blocks.blockList[this.vibratoEffect[i]].connections[1];
            // The rate arg of the vibrato block must be in the form: a / b
            var divBlock = this._logo.blocks.blockList[this.vibratoEffect[i]].connections[2];
            if (this._logo.blocks.blockList[divBlock].name === 'divide' && this._logo.blocks.blockList[divBlock].connections[1] != null && this._logo.blocks.blockList[this._logo.blocks.blockList[divBlock].connections[1]].name === 'number' && this._logo.blocks.blockList[divBlock].connections[2] != null && this._logo.blocks.blockList[this._logo.blocks.blockList[divBlock].connections[2]].name === 'number') {

                var numBlock = this._logo.blocks.blockList[divBlock].connections[1];
                var denomBlock = this._logo.blocks.blockList[divBlock].connections[2];
                updateParams[1] = denomBlock;
                updateParams[2] = numBlock;
            } else {
                // Convert to a / b format
                var obj = rationalToFraction(this._logo.parseArg(this._logo, 0, divBlock, null, null));
                var topOfClamp = this._logo.blocks.blockList[last(this.vibratoEffect)].connections[3];
                var n = this._logo.blocks.blockList.length;
                const DIVOBJ = [[0, ['divide', {}], 0, 0, [null, 1, 2]], [1, ['number', {'value': obj[0]}], 0, 0, [0]], [2, ['number', {'value': obj[1]}], 0, 0, [0]]];
                this._logo.blocks.loadNewBlocks(DIVOBJ);

                updateParams[1] = n + 2;  // Denom block
                updateParams[2] = n + 1;  // Numerator block

                var that = this;

                __blockRefresher = function () {
                    that._logo.blocks.blockList[last(that.vibratoEffect)].connections[2] = n;
                    that._logo.blocks.blockList[n].connections[0] = last(that.vibratoEffect);
                    that._logo.blocks.blockList[divBlock].connections[0] = null;
                    that._logo.blocks.clampBlocksToCheck.push([n, 0]);
                    that._logo.blocks.clampBlocksToCheck.push([that.blockNo, 0]);
                    that._logo.blocks.adjustDocks(that.blockNo, true);
                };

                setTimeout(__blockRefresher(), 250);
            }
        }

        if (this.isActive['chorus'] === true && this.chorusEffect[i] != null) {
            for (j = 0; j < 3; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.chorusEffect[i]].connections[j + 1];
            }
        }

        if (this.isActive['phaser'] === true && this.phaserEffect[i] != null) {
            for (j = 0; j < 3; j++) {
                updateParams[j] = this._logo.blocks.blockList[this.phaserEffect[i]].connections[j + 1];
            }
        }

        if (this.isActive['distortion'] === true && this.distortionEffect[i] != null) {
            updateParams[0] = this._logo.blocks.blockList[this.distortionEffect[i]].connections[1];
        }

        if (updateParams[0] != null) {
            if (typeof value === 'string') {
                this._logo.blocks.blockList[updateParams[k]].value = value;
            } else {
                this._logo.blocks.blockList[updateParams[k]].value = parseFloat(value);
            }

            this._logo.blocks.blockList[updateParams[k]].text.text = value.toString();
            this._logo.blocks.blockList[updateParams[k]].updateCache();
            this._logo.refreshCanvas();
            saveLocally();
        }
    };

    this._playNote = function (note, duration) {
        this._logo.synth.setMasterVolume(last(this._logo.masterVolume));

        var timbreEffects = instrumentsEffects[0][this.instrumentName];
        var paramsEffects = {
            'doVibrato': false,
            'doDistortion': false,
            'doTremolo': false,
            'doPhaser': false,
            'doChorus': false,
            'vibratoIntensity': 0,
            'vibratoFrequency': 0,
            'distortionAmount': 0,
            'tremoloFrequency': 0,
            'tremoloDepth': 0,
            'rate': 0,
            'octaves': 0,
            'baseFrequency': 0,
            'chorusRate': 0,
            'delayTime': 0,
            'chorusDepth': 0
        };

        if (timbreEffects['vibratoActive']) {
            paramsEffects.vibratoFrequency = timbreEffects['vibratoFrequency'];
            paramsEffects.vibratoIntensity = timbreEffects['vibratoIntensity'];
            paramsEffects.doVibrato = true;
        }

        if (timbreEffects['distortionActive']) {
            paramsEffects.distortionAmount = timbreEffects['distortionAmount'];
            paramsEffects.doDistortion = true;
        }

        if (timbreEffects['tremoloActive']) {
            paramsEffects.tremoloFrequency = timbreEffects['tremoloFrequency'];
            paramsEffects.tremoloDepth = timbreEffects['tremoloDepth'];
            paramsEffects.doTremolo = true;
        }

        if (timbreEffects['phaserActive']) {
            paramsEffects.rate = timbreEffects['rate'];
            paramsEffects.octaves = timbreEffects['octaves'];
            paramsEffects.baseFrequency = timbreEffects['baseFrequency'];
            paramsEffects.doPhaser = true;
        }

        if (timbreEffects['chorusActive']) {
            paramsEffects.chorusRate = timbreEffects['chorusRate'];
            paramsEffects.delayTime = timbreEffects['delayTime'];
            paramsEffects.chorusDepth = timbreEffects['chorusDepth'];
            paramsEffects.doChorus = true;
        }

        if (this.instrumentName in instrumentsFilters[0]) {
            this._logo.synth.trigger(0, note, this._logo.defaultBPMFactor * duration, this.instrumentName, paramsEffects, instrumentsFilters[0][this.instrumentName]);
        } else {
            console.log(paramsEffects.vibratoIntensity + ' ' + paramsEffects.vibratoFrequency);
            this._logo.synth.trigger(0, note, this._logo.defaultBPMFactor * duration, this.instrumentName, paramsEffects, null);
       }
    };

    this._play = function (row) {
        this._playing = !this._playing;

        this._logo.resetSynth(0);

        var cell = row.cells[0];
        if (this._playing) {
            cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + 'stop-button.svg' + '" title="' + _('stop') + '" alt="' + _('stop') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        } else {
            this._logo.synth.setMasterVolume(0);
            this._logo.synth.stop();
            cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + 'play-button.svg' + '" title="' + _('play') + '" alt="' + _('play') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        }

        var that = this;

        if (this.notesToPlay.length === 0) {
            this.notesToPlay = [['G4', 1 / 4], ['E4', 1 / 4], ['G4', 1 / 2]];
        }

        __playLoop = function (i) {
            if (that._playing) {
                that._playNote(that.notesToPlay[i][0], that.notesToPlay[i][1]);
            }

            i += 1;
            if (i < that.notesToPlay.length && that._playing) {
                setTimeout(function () {
                    __playLoop(i);
                }, that._logo.defaultBPMFactor * 1000 * that.notesToPlay[i - 1][1]);
            } else {
                cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + 'play-button.svg' + '" title="' + _('play') + '" alt="' + _('play') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
                that._playing = false;
            }
        };

        if (this._playing) {
            __playLoop(0);
        }
    };

    this._save = function () {
        // Just save a set timbre block with the current instrument name.
        var timbreName = docById('timbreName').value;
        var obj = [[0, 'settimbre', 100 + this._delta, 100 + this._delta, [null, 1, null, 2]], [1, ['text', {'value': timbreName}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        this._logo.blocks.loadNewBlocks(obj);
        this._delta += 42;
    };

    this._undo = function () {
        var blockValue = 0;

        if (this.isActive['envelope']) {
            if (this.env.length > 1) {
                blockValue = this.env.length - 1;
            }

            docById('envelopeButtonCell').style.backgroundColor = MATRIXBUTTONCOLOR;
            for (var i = 0; i < 4; i++) {
                this.synthVals['envelope'][this.adsrMap[i]] = parseFloat(this.ENVs[i]) / 100;
                docById('myRange' + i).value = parseFloat(this.ENVs[i]);
                docById('myspan' + i).textContent = this.ENVs[i];
                this._update(blockValue, parseFloat(this.ENVs[i]), i);
            }

            this._logo.synth.createSynth(0, this.instrumentName, this.synthVals['oscillator']['source'], this.synthVals);
        } else if (this.isActive['amsynth'] === true) {
            docById('synthButtonCell').style.backgroundColor = MATRIXBUTTONCOLOR
            if (this.AMSynthesizer.length > 1) {
                blockValue = this.AMSynthesizer.length - 1;
            }

            docById('myRangeS0').value = parseFloat(this.AMSynthParams[0]);
            docById('myspanS0').textContent = this.AMSynthParams[0];
            this.amSynthParamvals['harmonicity'] = parseFloat(this.AMSynthParams[0]);
            this._update(blockValue, this.AMSynthParams[0], 0);
            this._logo.synth.createSynth(0, this.instrumentName, 'amsynth', this.amSynthParamvals);
        } else if (this.isActive['fmsynth'] === true) {
            docById('synthButtonCell').style.backgroundColor = MATRIXBUTTONCOLOR
            if (this.FMSynthesizer.length > 1) {
                blockValue = this.FMSynthesizer.length - 1;
            }

            docById('myRangeS0').value = parseFloat(this.FMSynthParams[0]);
            docById('myspanS0').textContent = this.FMSynthParams[0];
            this.fmSynthParamvals['modulationIndex'] = parseFloat(this.FMSynthParams[0]);
            this._update(blockValue, this.FMSynthParams[0], 0);
            this._logo.synth.createSynth(0, this.instrumentName, 'fmsynth', this.fmSynthParamvals);
        } else if (this.isActive['noisesynth'] === true) {
            docById('synthButtonCell').style.backgroundColor = MATRIXBUTTONCOLOR
            if (this.NoiseSynthesizer.length > 1) {
                blockValue = this.NoiseSynthesizer.length - 1;
            }

            docById('myRangeS0').value = this.NoiseSynthParams[0];
            docById('myspanS0').textContent = this.NoiseSynthParams[0];
            this.noiseSynthParamvals['noise.type'] = this.NoiseSynthParams[0];
            this._update(blockValue, this.NoiseSynthParams[0], 0);
            this._logo.synth.createSynth(0, this.instrumentName, 'noisesynth', this.noiseSynthParamvals);
        } else if (this.isActive['duosynth'] === true) {
            docById('synthButtonCell').style.backgroundColor = MATRIXBUTTONCOLOR
            if (this.duoSynthesizer.length > 1) {
                blockValue = this.duoSynthesizer.length - 1;
            }

            docById('myRangeS0').value = parseFloat(this.duoSynthParams[0]);
            docById('myspanS0').textContent = this.duoSynthParams[0];
            this.duoSynthParamVals['vibratoRate'] = parseFloat(this.duoSynthParams[0]);
            this._update(blockValue, this.duoSynthParams[0], 0);
            docById('myRangeS1').value = parseFloat(this.duoSynthParams[1]);
            docById('myspanS1').textContent = this.duoSynthParams[1];
            this.duoSynthParamVals['vibratoAmount'] = parseFloat(this.duoSynthParams[1]);
            this._update(blockValue, this.duoSynthParams[1], 1);
            this._logo.synth.createSynth(0, this.instrumentName, 'duosynth', this.duoSynthParamVals);
        } else if (this.isActive['oscillator']) {
            docById('oscillatorButtonCell').style.backgroundColor = MATRIXBUTTONCOLOR;
            if (this.osc.length > 1) {
                blockValue = this.osc.length - 1;
            }

            docById('selOsc1').value = DEFAULTOSCILLATORTYPE;
            this._update(blockValue, DEFAULTOSCILLATORTYPE, 0);
            docById('myRangeO0').value = parseFloat(6);
            docById('myspanO0').textContent = '6';
            this._update(blockValue, '6', 1);
            this.synthVals['oscillator']['type'] = 'sine6';
            this.synthVals['oscillator']['source'] = DEFAULTOSCILLATORTYPE;
            this._logo.synth.createSynth(0, this.instrumentName, this.oscParams[0], this.synthVals);
        } else if (this.isActive['filter']) {
            for (var i = 0; i < this.fil.length; i++) {
                docById('filterButtonCell').style.backgroundColor = MATRIXBUTTONCOLOR;
                docById('sel' + i).value = this.filterParams[i * 3];
                this._update(i, this.filterParams[i * 3], 0);
                instrumentsFilters[0][this.instrumentName][i]['filterType'] = this.filterParams[i * 3];

                var radioIDs = [i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 3];
                if (this.filterParams[i * 3 + 1] === -12) {
                    docById('radio' + radioIDs[0]).checked = true;
                } else {
                    docById('radio' + radioIDs[0]).checked = false;
                }

                if (this.filterParams[i * 3 + 1] === -24) {
                    docById('radio' + radioIDs[1]).checked = true;
                } else {
                    docById('radio' + radioIDs[1]).checked = false;
                }

                if (this.filterParams[i * 3 + 1] === -48) {
                    docById('radio' + radioIDs[2]).checked = true;
                } else {
                    docById('radio' + radioIDs[2]).checked = false;
                }

                if (this.filterParams[i * 3 + 1] === -96) {
                    docById('radio' + radioIDs[3]).checked = true;
                } else {
                    docById('radio' + radioIDs[3]).checked = false;
                }
                this._update(i, this.filterParams[1 + i * 3], 1);
                instrumentsFilters[0][this.instrumentName][i]['filterRolloff'] = parseFloat(this.filterParams[1 + i * 3]);

                docById('myRangeF' + i).value = parseFloat(this.filterParams[2 + i * 3]);
                docById('myspanF' + i).textContent = this.filterParams[2 + i * 3];
                this._update(i, this.filterParams[2 + i * 3], 2);
                instrumentsFilters[0][this.instrumentName][i]['filterFrequency'] = parseFloat(this.filterParams[2 + i * 3]);
            }
        } else if (this.isActive['tremolo'] === true) {
            docById('effectsButtonCell').style.backgroundColor = MATRIXBUTTONCOLOR;
            if (this.tremoloEffect.length !== 1) {
                blockValue = this.tremoloEffect.length - 1;
            }

            for (var i = 0; i < 2; i++) {
                docById('myRangeFx' + i).value = parseFloat(this.tremoloParams[i]);
                docById('myspanFx' + i).textContent = this.tremoloParams[i];
                this._update(blockValue, this.tremoloParams[i], i);
            }
        } else if (this.isActive['vibrato'] === true) {
            docById('effectsButtonCell').style.backgroundColor = MATRIXBUTTONCOLOR;
            if (this.vibratoEffect.length !== 1) {
                blockValue = this.vibratoEffect.length - 1;
            }

            for (var i = 0; i < 2; i++) {
                docById('myRangeFx' + i).value = parseFloat(this.vibratoParams[i]);
                docById('myspanFx' + i).textContent = this.vibratoParams[i];
                this._update(blockValue, this.vibratoParams[i], i);
            }
        } else if (this.isActive['phaser'] === true) {
            docById('effectsButtonCell').style.backgroundColor = MATRIXBUTTONCOLOR;
            if (this.phaserEffect.length !== 1) {
                blockValue = this.phaserEffect.length - 1;
            }

            for (var i = 0; i < 3; i++) {
                docById('myRangeFx' + i).value = parseFloat(this.phaserParams[i]);
                docById('myspanFx' + i).textContent = this.phaserParams[i];
                this._update(blockValue, this.phaserParams[i], i);
            }
        } else if (this.isActive['chorus'] === true) {
            docById('effectsButtonCell').style.backgroundColor = MATRIXBUTTONCOLOR;
            if (this.chorusEffect.length !== 1) {
                blockValue = this.chorusEffect.length - 1;
            }

            for (var i = 0; i < 3; i++) {
                docById('myRangeFx' + i).value = parseFloat(this.chorusParams[i]);
                docById('myspanFx' + i).textContent = this.chorusParams[i];
                this._update(blockValue, this.chorusParams[i], i);
            }
        } else if (this.isActive['distortion'] === true) {
            docById('effectsButtonCell').style.backgroundColor = MATRIXBUTTONCOLOR;
            if (this.distortionEffect.length !== 1) {
                blockValue = this.dstortionEffect.length - 1;
            }

            docById('myRangeFx0').value = parseFloat(this.distortionParams[0]);
            docById('myspanFx0').textContent = this.distortionParams[0];
            this._update(blockValue, this.distortionParams[0], 0);
        }

        this._playNote('G4', 1 / 8);
    };

    this.init = function (logo) {
        this._logo = logo;
        this._delta = 0;

        this._playing = false;

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;
        var timbreDiv = docById('timbreDiv');
        timbreDiv.style.visibility = 'visible';
        timbreDiv.setAttribute('draggable', 'true');
        timbreDiv.style.left = '200px';
        timbreDiv.style.top = '150px';

        var widgetButtonsDiv = docById('timbreButtonsDiv');
        widgetButtonsDiv.style.display = 'inline';
        widgetButtonsDiv.style.visibility = 'visible';
        widgetButtonsDiv.style.width = BUTTONDIVWIDTH;
        widgetButtonsDiv.innerHTML = '<table cellpadding="0px" id="timbreButtonTable"></table>';

        var canvas = docById('myCanvas');

        var buttonTable = docById('timbreButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        var that = this;

        _unhighlightButtons = function () {
            addFilterButtonCell.style.backgroundColor = '#808080';
            synthButtonCell.style.backgroundColor = MATRIXBUTTONCOLOR;
            oscillatorButtonCell.style.backgroundColor = MATRIXBUTTONCOLOR;
            envelopeButtonCell.style.backgroundColor = MATRIXBUTTONCOLOR;
            effectsButtonCell.style.backgroundColor = MATRIXBUTTONCOLOR;
            filterButtonCell.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = this._addButton(row, 'play-button.svg', ICONSIZE, _('play'));

        cell.onclick = function () {
            that._play(row);
        };

        var cell = this._addButton(row, 'export-chunk.svg', ICONSIZE, _('save'));
        cell.onclick = function () {
            that._save();
        };

        var cell = row.insertCell();
        cell.innerHTML = '<input id="timbreName" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="timbreName" type="text" value="' + this.instrumentName + '" />';
        cell.style.width = (2*BUTTONSIZE) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = BUTTONSIZE + 'px';
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        var timbreInput = docById('timbreName');
        timbreInput.classList.add('hasKeyboard');

        timbreInput.oninput = function(event) {
            var cblk0 = that._logo.blocks.blockList[that.blockNo].connections[1];
            var blk = that._logo.blocks.blockList[cblk0];
            blk.value = timbreInput.value;
            var label = blk.value.toString();
            if (label.length > 8) {
                label = label.substr(0, 7) + '...';
            }
            blk.text.text = label;
            blk.updateCache();
        };

        var synthButtonCell = this._addButton(row, 'synth.svg', ICONSIZE, _('synthesizer'));
        synthButtonCell.id = 'synthButtonCell';
        this.isActive['synth'] = false;

        synthButtonCell.onclick = function () {
            _unhighlightButtons();
            //console.log('synth button cell');
            for (var i = 0; i < that.activeParams.length; i++) {
                that.isActive[that.activeParams[i]] = false;
            }

            that.isActive['synth'] = true;

            if (that.osc.length === 0) {
                that._synth();
            } else {
                that._logo.errorMsg(_('Unable to use synth due to existing oscillator'));
            }
        }

        var oscillatorButtonCell = this._addButton(row, 'oscillator.svg', ICONSIZE, _('oscillator'));
        oscillatorButtonCell.id = 'oscillatorButtonCell';
        this.isActive['oscillator'] = false;

        oscillatorButtonCell.onclick = function () {
            _unhighlightButtons();
            for (var i = 0; i < that.activeParams.length; i++) {
                that.isActive[that.activeParams[i]] = false;
            }

            that.isActive['oscillator'] = true;

            if (that.osc.length === 0) {
                var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);

                const OSCILLATOROBJ = [[0, ['oscillator', {}], 0, 0, [null, 2,1, null]], [1, ['number', {'value': 6}], 0, 0, [0]], [2, ['oscillatortype', {'value': DEFAULTOSCILLATORTYPE}], 0, 0, [0]]];
                that._logo.blocks.loadNewBlocks(OSCILLATOROBJ);

                var n = that._logo.blocks.blockList.length - 3;
                that.osc.push(n);
                that.oscParams.push(DEFAULTOSCILLATORTYPE);
                that.oscParams.push(6);

                setTimeout(that.blockConnection(3, bottomOfClamp), 500);

                that._oscillator(true);
            } else {
                that._oscillator(false);
            }

            if (that.osc.length !== 0 && (that.AMSynthesizer.length !== 0  || that.FMSynthesizer.length !== 0 || that.duoSynthesizer.length !== 0)) {
                that._oscillator(false);
            }
        }

        var envelopeButtonCell = this._addButton(row, 'envelope.svg', ICONSIZE, _('envelope'));
        envelopeButtonCell.id = 'envelopeButtonCell';
        this.isActive['envelope'] = false;

        envelopeButtonCell.onclick = function () {
            _unhighlightButtons();
            for (var i = 0; i < that.activeParams.length; i++) {
                that.isActive[that.activeParams[i]] = false;
            }

            that.isActive['envelope'] = true;

            if (that.env.length === 0) {
                var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);

                const ENVOBJ = [[0, ['envelope', {}], 0, 0, [null, 1, 2, 3, 4, null]], [1, ['number', {'value': 1}], 0, 0, [0]], [2, ['number', {'value': 50}], 0, 0, [0]], [3, ['number', {'value': 60}], 0, 0, [0]], [4, ['number', {'value': 1}], 0, 0, [0]]];
                that._logo.blocks.loadNewBlocks(ENVOBJ);

                var n = that._logo.blocks.blockList.length - 5;
                that.env.push(n);
                that.ENVs.push(1);
                that.ENVs.push(50);
                that.ENVs.push(60);
                that.ENVs.push(1);

                setTimeout(that.blockConnection(5, bottomOfClamp), 500);

                that._envelope(true);  // create a new synth instrument
            } else {
                that._envelope(false);
            }
        }


        var effectsButtonCell = this._addButton(row, 'effects.svg', ICONSIZE, _('effects'));
        effectsButtonCell.id = 'effectsButtonCell';
        this.isActive['effects'] = false;

        effectsButtonCell.onclick = function () {
            _unhighlightButtons();
            for (var i = 0; i < that.activeParams.length; i++) {
                that.isActive[that.activeParams[i]] = false;
            }

            that.isActive['effects'] = true;
            that._effects();
        }

        var filterButtonCell = this._addButton(row, 'filter.svg', ICONSIZE, _('filter'));
        filterButtonCell.id = 'filterButtonCell';
        this.isActive['filter'] = false;

        filterButtonCell.onclick = function () {
            _unhighlightButtons();
            for (var i = 0; i < that.activeParams.length; i++) {
                that.isActive[that.activeParams[i]] = false;
            }

            that.isActive['filter'] = true;

            if (that.fil.length === 0) {
                var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);

                const FILTEROBJ = [[0, ['filter', {}], 0, 0, [null, 3, 1, 2, null]], [1, ['number', {'value': -12}], 0, 0, [0]], [2, ['number', {'value': 392}], 0, 0, [0]], [3, ['filtertype', {'value': DEFAULTFILTERTYPE}], 0, 0, [0]]];
                that._logo.blocks.loadNewBlocks(FILTEROBJ);

                var n = that._logo.blocks.blockList.length - 4;
                that.fil.push(n);
                that.filterParams.push(DEFAULTFILTERTYPE);
                that.filterParams.push(-12);
                that.filterParams.push(392);

                setTimeout(that.blockConnection(4, bottomOfClamp), 500);
            }

            that._filter();
        }

        var addFilterButtonCell = this._addButton(row, 'filter+.svg', ICONSIZE, _('add filter'));
        addFilterButtonCell.style.backgroundColor = '#808080';

        addFilterButtonCell.onclick = function () {
            if (that.isActive['filter']) {
                that._addFilter();
            }
        };

        addFilterButtonCell.onmouseover = function () {
        }

        addFilterButtonCell.onmouseout = function () {
        }


        var cell = this._addButton(row, 'restore-button.svg', ICONSIZE, _('undo'));
        cell.onclick = function () {
            that._undo();
        };

        var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('close'));

        cell.onclick = function () {
            docById('timbreDiv').style.visibility = 'hidden';
            docById('timbreButtonsDiv').style.visibility = 'hidden';
            docById('timbreTableDiv').style.visibility = 'hidden';
            docById('timbreName').classList.remove('hasKeyboard');
            that._logo.hideMsgs();
        };

        var dragCell = this._addButton(row, 'grab.svg', ICONSIZE, _('drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - timbreDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - timbreDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = dragCell.innerHTML;

        dragCell.onmouseover = function (e) {
            dragCell.innerHTML = '';
        };

        dragCell.onmouseout = function (e) {
            if (!that._dragging) {
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        canvas.ondragover = function (e) {
            e.preventDefault();
        };

        canvas.ondrop = function (e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                timbreDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                timbreDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        timbreDiv.ondragover = function (e) {
            e.preventDefault();
        };

        timbreDiv.ondrop = function (e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                timbreDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                timbreDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        timbreDiv.onmousedown = function (e) {
            that._dragging = true;
            that._target = e.target;
        };

        timbreDiv.ondragstart = function (e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

        this._logo.textMsg(_('Click on buttons to open the timbre design tools.'));
    };

    this.clampConnection = function (n, clamp, topOfClamp) {
        // Connect the clamp to the Widget block.
        this._logo.blocks.blockList[this.blockNo].connections[2] = n;
        this._logo.blocks.blockList[n].connections[0] = this.blockNo;

        // If there were blocks in the Widget, move them inside the clamp.
        if (topOfClamp != null) {
            this._logo.blocks.blockList[n].connections[clamp] = topOfClamp;
            this._logo.blocks.blockList[topOfClamp].connections[0] = n;
        }

        // Adjust the clamp sizes and positions.
        this._logo.blocks.clampBlocksToCheck.push([n, 0]);
        this._logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        this._logo.blocks.adjustDocks(this.blockNo, true);
    };

    this.clampConnectionVspace = function (n, vspace, topOfClamp) {
        // Connect the clamp to the Widget block.
        this._logo.blocks.blockList[this.blockNo].connections[2] = n;
        this._logo.blocks.blockList[n].connections[0] = this.blockNo;

        // If there were blocks in the Widget, move them inside the clamp.
        if (topOfClamp != null) {
            this._logo.blocks.blockList[vspace].connections[1] = topOfClamp;
            this._logo.blocks.blockList[topOfClamp].connections[0] = vspace;
        }

        // Adjust the clamp sizes and positions.
        this._logo.blocks.clampBlocksToCheck.push([n, 0]);
        this._logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        this._logo.blocks.adjustDocks(this.blockNo, true);
    };

    this._blockReplace = function (oldblk, newblk) {
        // Find the connections from the old block
        var c0 = this._logo.blocks.blockList[oldblk].connections[0];
        var c1 = last(this._logo.blocks.blockList[oldblk].connections);

        // Connect the new block
        this._logo.blocks.blockList[newblk].connections[0] = c0;
        this._logo.blocks.blockList[newblk].connections[this._logo.blocks.blockList[newblk].connections.length - 1] = c1;

        if (c0 != null) {
            for (var i = 0; i < this._logo.blocks.blockList[c0].connections.length; i++) {
                if (this._logo.blocks.blockList[c0].connections[i] === oldblk) {
                    this._logo.blocks.blockList[c0].connections[i] = newblk;
                    break;
                }
            }

            // Look for a containing clamp, which may need to be resized.
            var blockAbove = c0;
            while (blockAbove != this.blockNo) {
                if (this._logo.blocks.blockList[blockAbove].isClampBlock()) {
                    this._logo.blocks.clampBlocksToCheck.push([blockAbove, 0]);
                }

                blockAbove = this._logo.blocks.blockList[blockAbove].connections[0];
            }

            this._logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        }

        if (c1 != null) {
            for (var i = 0; i < this._logo.blocks.blockList[c1].connections.length; i++) {
                if (this._logo.blocks.blockList[c1].connections[i] === oldblk) {
                    this._logo.blocks.blockList[c1].connections[i] = newblk;
                    break;
                }
            }
        }

        // Refresh the dock positions
        this._logo.blocks.adjustDocks(c0, true);

        // Send the old block to the trash
        this._logo.blocks.blockList[oldblk].connections[0] = null;
        this._logo.blocks.blockList[oldblk].connections[this._logo.blocks.blockList[oldblk].connections.length - 1] = null;
        this._logo.blocks.sendStackToTrash(this._logo.blocks.blockList[oldblk]);

        this._logo.refreshCanvas();
    };

    this.blockConnection = function (len, bottomOfClamp) {
        var n = this._logo.blocks.blockList.length - len;
        if (bottomOfClamp == null) {
            this._logo.blocks.blockList[this.blockNo].connections[2] = n;
            this._logo.blocks.blockList[n].connections[0] = this.blockNo;
        } else {
            var c = this._logo.blocks.blockList[bottomOfClamp].connections.length - 1;
            // Check for nested clamps.
            // A hidden block is attached to the bottom of each clamp.
            // But don't go inside a note block.
            while (this._logo.blocks.blockList[bottomOfClamp].name === 'hidden' && this._logo.blocks.blockList[this._logo.blocks.blockList[bottomOfClamp].connections[0]].name !== 'newnote') {
                var cblk = this._logo.blocks.blockList[bottomOfClamp].connections[0];
                c = this._logo.blocks.blockList[cblk].connections.length - 2;
                this._logo.blocks.clampBlocksToCheck.push([cblk, 0]);
                if (this._logo.blocks.blockList[cblk].connections[c] == null) {
                    bottomOfClamp = cblk;
                } else {
                    // Find bottom of stack
                    bottomOfClamp = this._logo.blocks.findBottomBlock(this._logo.blocks.blockList[cblk].connections[c]);
                    c = this._logo.blocks.blockList[bottomOfClamp].connections.length - 1;
                }
            }

            this._logo.blocks.blockList[bottomOfClamp].connections[c] = n;
            this._logo.blocks.blockList[n].connections[0] = bottomOfClamp;
        }

        this._logo.blocks.clampBlocksToCheck.push([this.blockNo, 0]);
        this._logo.blocks.adjustDocks(this.blockNo, true);
    };

    this._synth = function () {
        //  console.log('heysynth');
        var that = this;
        var blockValue = 0;

        docById('synthButtonCell').style.backgroundColor = '#C8C8C8';
        docById('synthButtonCell').onmouseover = function () {};
        docById('synthButtonCell').onmouseout =  function () {};

        timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
        var htmlElements = '';
        for (var i = 0; i < 2; i++) {
            htmlElements += '<div id ="synth' + i + '"></div>';
        }

        env.innerHTML = htmlElements;
        var envAppend = document.createElement('div');
        envAppend.id = 'envAppend';
        envAppend.style.backgroundColor = MATRIXBUTTONCOLOR;
        envAppend.style.height = '30px';
        envAppend.style.marginTop = '40px';
        envAppend.style.overflow = 'auto';
        env.append(envAppend);

        var mainDiv = docById('synth0');
        mainDiv.innerHTML= '<p><input type="radio" name="synthsName" value="AMSynth"/>' + _('AM synth') + '</br><input type="radio" name="synthsName" value="FMSynth"/>' + _('FM synth') + '</br><input type="radio" name="synthsName" value="DuoSynth"/>' + _('duo synth') + '</br></p>';

        var subDiv = docById('synth1');
        var synthsName = docByName('synthsName');
        var synthChosen;
        for (var i = 0; i < synthsName.length; i++) {
            synthsName[i].onclick = function () {
                synthChosen = this.value;
                var subHtmlElements = '<div id="chosen">' + synthChosen + '</div>';
                    for (var i = 0; i < that.activeParams.length; i++) {
                        that.isActive[that.activeParams[i]] = false;
                    }
                    that.isActive['synth'] = true;

                    if (synthChosen === 'AMSynth') {
                        that.isActive['amsynth'] = true;
                        that.isActive['fmsynth'] = false;
                        that.isActive['duosynth'] = false;

                        if (that.AMSynthesizer.length === 0) {
                            var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                            var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);

                            const AMSYNTHOBJ = [[0, ['amsynth', {}], 0, 0, [null, 1, null]], [1, ['number', {'value': 1}], 0, 0, [0]]];
                            that._logo.blocks.loadNewBlocks(AMSYNTHOBJ);

                            var n = that._logo.blocks.blockList.length - 2;
                            that.AMSynthesizer.push(n);
                            that.AMSynthParams.push(1);

                            setTimeout(function () {
                                if (that.FMSynthesizer.length !== 0) {
                                    that._blockReplace(last(that.FMSynthesizer), last(that.AMSynthesizer));
                                    that.FMSynthesizer.pop();
                                } else if (that.duoSynthesizer.length !== 0) {
                                    that._blockReplace(last(that.duoSynthesizer), last(that.AMSynthesizer));
                                    that.duoSynthesizer.pop();
                                } else {
                                    that.blockConnection(2, bottomOfClamp);
                                }
                            }, 500);

                            console.log('CREATING AM SYNTH!!!');
                            that.amSynthParamvals['harmonicity'] = parseFloat(that.AMSynthParams[0]);
                            that._logo.synth.createSynth(0, that.instrumentName, 'amsynth', that.amSynthParamvals);
                        }

                        subHtmlElements += '<div id="wrapperS0"><div id="sS0"><span>' + _('harmonicity') + '</span></div><div class="insideDivSynth"><input type="range" id="myRangeS0" class="sliders" style="margin-top:20px" value="' + parseFloat(that.AMSynthParams[0]) + '"><span id="myspanS0" class="rangeslidervalue">' + that.AMSynthParams[0] + '</span></div></div>';
                        subDiv.innerHTML = subHtmlElements;

                        // docById('myRangeS0').value = parseFloat(that.AMSynthParams[0]);
                        // docById('myspanS0').textContent = that.AMSynthParams[0];

                        that.amSynthParamvals['harmonicity'] = parseFloat(that.AMSynthParams[0]);

                        if (that.AMSynthesizer.length !== 1) {
                            blockValue = that.AMSynthesizer.length - 1;
                        }

                        document.getElementById('wrapperS0').addEventListener('change', function (event) {
                            docById('synthButtonCell').style.backgroundColor = '#C8C8C8';
                            var elem = event.target;
                            docById('myRangeS0').value = parseFloat(elem.value);
                            that.amSynthParamvals['harmonicity'] = parseFloat(elem.value);
                            docById('myspanS0').textContent = elem.value;
                            that._update(blockValue, elem.value, 0);
                            that._logo.synth.createSynth(0, that.instrumentName, 'amsynth', that.amSynthParamvals);
                            that._playNote('G4', 1 / 8);
                        });

                    } else if (synthChosen === 'FMSynth') {
                        that.isActive['amsynth'] = false;
                        that.isActive['fmsynth'] = true;
                        that.isActive['duosynth'] = false;

                        if (that.FMSynthesizer.length === 0) {

                            var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                            var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);

                            const FMSYNTHOBJ = [[0, ['fmsynth', {}], 0, 0, [null, 1, null]], [1, ['number', {'value': 10}], 0, 0, [0]]];
                            that._logo.blocks.loadNewBlocks(FMSYNTHOBJ);

                            var n = that._logo.blocks.blockList.length - 2;
                            that.FMSynthesizer.push(n);
                            that.FMSynthParams.push(10);

                            setTimeout(function () {
                                if (that.AMSynthesizer.length !== 0) {
                                    that._blockReplace(last(that.AMSynthesizer), last(that.FMSynthesizer));
                                    that.AMSynthesizer.pop();
                                } else if (that.duoSynthesizer.length !== 0) {
                                    that._blockReplace(last(that.duoSynthesizer), last(that.FMSynthesizer));
                                    that.duoSynthesizer.pop();
                                } else {
                                    that.blockConnection(2, bottomOfClamp);
                                }
                            }, 500);

                            console.log('CREATING FM SYNTH!!!');
                            that.fmSynthParamvals['modulationIndex'] = parseFloat(that.FMSynthParams[0]);
                            that._logo.synth.createSynth(0, that.instrumentName, 'fmsynth', that.fmSynthParamvals);
                        }

                        subHtmlElements += '<div id="wrapperS0"><div id="sS0"><span>' + _('modulation index') + '</span></div><div class="insideDivSynth"><input type="range" id="myRangeS0" class="sliders" style="margin-top:20px" value="' + parseFloat(that.FMSynthParams[0]) + '"><span id="myspanS0" class="rangeslidervalue">' + that.FMSynthParams[0] + '</span></div></div>';
                        subDiv.innerHTML = subHtmlElements;

                        // docById('myRangeS0').value = parseFloat(that.FMSynthParams[0]);
                        // docById('myspanS0').textContent = that.FMSynthParams[0];

                        that.fmSynthParamvals['modulationIndex'] = parseFloat(that.FMSynthParams[0]);

                        if (that.FMSynthesizer.length !== 1) {
                            blockValue = that.FMSynthesizer.length - 1;
                        }

                        document.getElementById('wrapperS0').addEventListener('change', function (event) {
                            docById('synthButtonCell').style.backgroundColor = '#C8C8C8';
                            var elem = event.target;
                            docById('myRangeS0').value = parseFloat(elem.value);
                            docById('myspanS0').textContent = elem.value;
                            that.fmSynthParamvals['modulationIndex'] = parseFloat(elem.value);
                            that._update(blockValue, elem.value, 0);
                            that._logo.synth.createSynth(0, that.instrumentName, 'fmsynth', that.fmSynthParamvals);
                            that._playNote('G4', 1 / 8);
                        });
                    } else if (synthChosen === 'NoiseSynth') {
                        that.isActive['amsynth'] = false;
                        that.isActive['fmsynth'] = false;
                        that.isActive['noisesynth'] = true;
                        that.isActive['duosynth'] = false;

                        if (that.NoiseSynthesizer.length === 0) {

                            var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                            var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);

                            const NOISESYNTHOBJ = [[0, ['noisesynth', {}], 0, 0, [null, 1, null]], [1, ['number', {'value': 10}], 0, 0, [0]]];
                            that._logo.blocks.loadNewBlocks(NOISESYNTHOBJ);

                            var n = that._logo.blocks.blockList.length - 2;
                            that.NoiseSynthesizer.push(n);
                            that.NoiseSynthParams.push("white");

                            setTimeout(function () {
                                if (that.AMSynthesizer.length !== 0) {
                                    that._blockReplace(last(that.AMSynthesizer), last(that.NoiseSynthesizer));
                                    that.AMSynthesizer.pop();
                                } else if (that.FMSynthesizer.length !== 0) {
                                    that._blockReplace(last(that.FMSynthesizer), last(that.NoiseSynthesizer));
                                    that.FMSynthesizer.pop();
                                } else if (that.duoSynthesizer.length !== 0) {
                                    that._blockReplace(last(that.duoSynthesizer), last(that.NoiseSynthesizer));
                                    that.duoSynthesizer.pop();
                                } else {
                                    that.blockConnection(2, bottomOfClamp);
                                }
                            }, 500);

                            console.log('CREATING NOISE SYNTH!!!');
                            that.noiseSynthParamvals['noise.type'] = that.NoiseSynthParams[0];
                            that._logo.synth.createSynth(0, that.instrumentName, 'noisesynth', that.noiseSynthParamvals);
                        }

                        subHtmlElements += '<div id="wrapperS0"><div id="sS0"><span>' + _('modulation index') + '</span></div><div class="insideDivSynth"><input type="range" id="myRangeS0" class="sliders" style="margin-top:20px" value="' + that.NoiseSynthParams[0] + '"><span id="myspanS0" class="rangeslidervalue">' + that.NoiseSynthParams[0] + '</span></div></div>';
                        subDiv.innerHTML = subHtmlElements;

                        // docById('myRangeS0').value = parseFloat(that.FMSynthParams[0]);
                        // docById('myspanS0').textContent = that.FMSynthParams[0];

                        that.noiseSynthParamvals['noise.type'] = that.NoiseSynthParams[0];

                        if (that.NoiseSynthesizer.length !== 1) {
                            blockValue = that.NoiseSynthesizer.length - 1;
                        }

                        document.getElementById('wrapperS0').addEventListener('change', function (event) {
                            docById('synthButtonCell').style.backgroundColor = '#C8C8C8';
                            var elem = event.target;
                            docById('myRangeS0').value = parseFloat(elem.value);
                            docById('myspanS0').textContent = elem.value;
                            that.noiseSynthParamvals['noise.type'] = parseFloat(elem.value);
                            that._update(blockValue, elem.value, 0);
                            that._logo.synth.createSynth(0, that.instrumentName, 'noisesynth', that.noiseSynthParamvals);
                            that._playNote( 1 / 8);
                        });
                    } else if (synthChosen === 'DuoSynth') {
                        that.isActive['amsynth'] = false;
                        that.isActive['fmsynth'] = false;
                        that.isActive['duosynth'] = true;

                        if (that.duoSynthesizer.length === 0) {
                            var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];
                            var bottomOfClamp = that._logo.blocks.findBottomBlock(topOfClamp);

                            const DUOSYNTHOBJ = [[0, ['duosynth', {}], 0, 0, [null, 1, 2, null]], [1, ['number', {'value': 10}], 0, 0, [0]], [2, ['number', {'value': 6}], 0, 0, [0]]];
                            that._logo.blocks.loadNewBlocks(DUOSYNTHOBJ);

                            var n = that._logo.blocks.blockList.length - 3;
                            that.duoSynthesizer.push(n);
                            that.duoSynthParams.push(10);
                            that.duoSynthParams.push(6);

                            setTimeout(function () {
                                if (that.AMSynthesizer.length !== 0) {
                                    that._blockReplace(last(that.AMSynthesizer), last(that.duoSynthesizer));
                                    that.AMSynthesizer.pop();
                                } else if (that.FMSynthesizer.length !== 0) {
                                    that._blockReplace(last(that.FMSynthesizer), last(that.duoSynthesizer));
                                    that.FMSynthesizer.pop();
                                } else {
                                    that.blockConnection(3, bottomOfClamp);
                                }
                            }, 500);

                            console.log('CREATING DUO SYNTH!!!');
                            that.duoSynthParamVals['vibratoRate'] = parseFloat(that.duoSynthParams[0]);
                            that.duoSynthParamVals['vibratoAmount'] = parseFloat(that.duoSynthParams[1]);
                            that._logo.synth.createSynth(0, that.instrumentName, 'duosynth', that.duoSynthParamVals);
                        }

                        subHtmlElements += '<div id="wrapperS0"><div id="sS0"><span>' + _('vibrato rate') + '</span></div><div class="insideDivSynth"><input type="range" id="myRangeS0" class="sliders" style="margin-top:20px" value="' + parseFloat(that.duoSynthParams[0]) + '"><span id="myspanS0" class="rangeslidervalue">' + that.duoSynthParams[0] + '</span></div></div>';
                        subHtmlElements += '<div id="wrapperS1"><div id="sS1"><span>' + _('vibrato amount') + '</span></div><div class="insideDivSynth"><input type="range" id="myRangeS1" class="sliders" style="margin-top:20px" value="' + parseFloat(that.duoSynthParams[1]) + '"><span id="myspanS1" class="rangeslidervalue">' + that.duoSynthParams[1] + '</span></div></div>';
                        subDiv.innerHTML = subHtmlElements;

                        if (that.duoSynthesizer.length !== 1) {
                            blockValue = that.duoSynthesizer.length - 1;
                        }

                        that.duoSynthParamVals['vibratoRate'] = parseFloat(that.duoSynthParams[0]);
                        that.duoSynthParamVals['vibratoAmount'] = parseFloat(that.duoSynthParams[1]);

                        for (var i = 0; i < 2; i++) {
                            document.getElementById('wrapperS' + i).addEventListener('change', function (event) {
                                docById('synthButtonCell').style.backgroundColor = '#C8C8C8';
                                var elem = event.target;
                                var m = elem.id.slice(-1);
                                docById('myRangeS' + m).value = parseFloat(elem.value);
                                if (m === 0) {
                                    that.duoSynthParamVals['vibratoRate'] = parseFloat(elem.value);
                                } else if (m === 1) {
                                    that.duoSynthParamVals['vibratoAmount'] = parseFloat(elem.value);
                                }

                                docById('myspanS' + m).textContent = elem.value;
                                that._update(blockValue, elem.value, Number(m));
                                that._logo.synth.createSynth(0, that.instrumentName, 'duosynth', that.duoSynthParamVals);
                                that._playNote('G4', 1 / 8);
                            });
                        }
                    }
                }
            }
    };

    this._oscillator = function (newOscillator) {
        var that = this;
        var blockValue = 0;

        if (this.osc.length !== 1) {
            blockValue = this.osc.length - 1;
        }

        docById('oscillatorButtonCell').style.backgroundColor = '#C8C8C8';
        docById('oscillatorButtonCell').onmouseover = function () {};
        docById('oscillatorButtonCell').onmouseout =  function () {};

        timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
        var htmlElements = '<div id="wrapperOsc0"><div id="sOsc0"><span>' + _('type') + '</span></div><div id="selOsc"></div></div>';
        htmlElements += '<div id="wrapperOsc1"><div id="sOsc1"><span>' + _('partials') + '</span></div><div class="insideDivOsc"><input type="range" id="myRangeO0" class="sliders" style="margin-top:20px" min="0" max="20" value="' + parseFloat(that.oscParams[1]) + '"><span id="myspanO0" class="rangeslidervalue">' + that.oscParams[1] + '</span></div></div>';

        env.innerHTML = htmlElements;
        var envAppend = document.createElement('div');
        envAppend.id = 'envAppend';
        envAppend.style.backgroundColor = MATRIXBUTTONCOLOR;
        envAppend.style.height = '30px';
        envAppend.style.marginTop = '40px';
        envAppend.style.overflow = 'auto';
        env.append(envAppend);

        var myDiv = docById('selOsc');
        var selectOpt = '<select id="selOsc1">';

        for (var i = 0; i < OSCTYPES.length; i++) {
            // work around some weird i18n bug
            if (OSCTYPES[i][0].length === 0) {
                if (OSCTYPES[i][0] === this.oscParams[0] || OSCTYPES[i][1] === this.oscParams[0]) {
                    selectOpt += '<option value="' + OSCTYPES[i][1] + '" selected>' + OSCTYPES[i][1] + '</option>';
                } else {
                    selectOpt += '<option value="' + OSCTYPES[i][1] + '">' + OSCTYPES[i][1] + '</option>';
                }
            } else {
                if (OSCTYPES[i][0] === this.oscParams[0] || OSCTYPES[i][1] === this.oscParams[0]) {
                    selectOpt += '<option value="' + OSCTYPES[i][0] + '" selected>' + OSCTYPES[i][0] + '</option>';
                } else {
                    selectOpt += '<option value="' + OSCTYPES[i][0] + '">' + OSCTYPES[i][0] + '</option>';
                }
            }
        }

        selectOpt += '</select>';

        myDiv.innerHTML = selectOpt;

        document.getElementById('wrapperOsc0').addEventListener('change', function (event) {
            docById('oscillatorButtonCell').style.backgroundColor = '#C8C8C8';
            var elem = event.target;
            that.oscParams[0] = elem.value;
            that.synthVals['oscillator']['type'] = (elem.value + that.oscParams[1].toString());
            that.synthVals['oscillator']['source'] = elem.value;
            that._update(blockValue, elem.value, 0);
            that._logo.synth.createSynth(0, that.instrumentName, that.oscParams[0], that.synthVals);
            that._playNote('G4', 1 / 8);
        });

        document.getElementById('wrapperOsc1').addEventListener('change', function (event) {
            docById('oscillatorButtonCell').style.backgroundColor = '#C8C8C8';
            var elem = event.target;
            that.oscParams[1] = parseFloat(elem.value);
            that.synthVals['oscillator']['type'] = (that.oscParams[0] + parseFloat(elem.value));
            docById('myRangeO0').value = parseFloat(elem.value);
            docById('myspanO0').textContent = elem.value;
            that._update(blockValue, elem.value, 1);
            that._logo.synth.createSynth(0, that.instrumentName, that.oscParams[0], that.synthVals);
            that._playNote('G4', 1 / 8);
        });

        docById('selOsc1').value = this.oscParams[0];
        this._update(blockValue, this.oscParams[0], 0);
        this._update(blockValue, this.oscParams[1], 1);
        this.synthVals['oscillator']['type'] = (this.oscParams[0] + this.oscParams[1].toString());
        this.synthVals['oscillator']['source'] = this.oscParams[0];

        if (newOscillator) {
            console.log('CREATING OSCILLATOR SYNTH!!!');
            this._logo.synth.createSynth(0, this.instrumentName, this.oscParams[0], this.synthVals);
        }
    };

    this._envelope = function (newEnvelope) {
        var that = this;
        var blockValue = 0;

        if (this.env.length !== 1) {
            blockValue = this.env.length - 1;
        }

        docById('envelopeButtonCell').style.backgroundColor = '#C8C8C8';
        docById('envelopeButtonCell').onmouseover = function () {};
        docById('envelopeButtonCell').onmouseout =  function () {};

        timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
        var htmlElements = '';
        for (var i = 0; i < 4; i++) {
            htmlElements += '<div id="wrapperEnv' + i + '"><div class="circle">' + ("ADSR").charAt(i)+ '</div><div class="insideDivEnv"><input type="range" id="myRange' + i + '" class="sliders" style="margin-top:20px" value="' + parseFloat(that.ENVs[i]) + '"><span id="myspan' + i + '" class="rangeslidervalue">' + that.ENVs[i] + '</span></div></div>';
        };

        env.innerHTML = htmlElements;
        var envAppend = document.createElement('div');
        envAppend.id = 'envAppend';
        envAppend.style.backgroundColor = MATRIXBUTTONCOLOR;
        envAppend.style.height = '30px';
        envAppend.style.marginTop = '40px';
        envAppend.style.overflow = 'auto';
        env.append(envAppend);

        for (var i = 0; i < 4; i++) {
            this.synthVals['envelope'][this.adsrMap[i]] = parseFloat(this.ENVs[i]) / 100;
            this._update(blockValue, this.ENVs[i], i);
        }

        for (var i = 0; i < 4; i++) {
            document.getElementById('wrapperEnv' + i).addEventListener('change', function (event) {
                docById('envelopeButtonCell').style.backgroundColor = '#C8C8C8';
                var elem = event.target;
                var m = elem.id.slice(-1);
                docById('myRange' + m).value = parseFloat(elem.value);
                docById('myspan' + m).textContent = elem.value;
                that.synthVals['envelope'][that.adsrMap[m]] = parseFloat(elem.value) / 100;
                that._update(blockValue, parseFloat(elem.value), m);
                that._logo.synth.createSynth(0, that.instrumentName, that.synthVals['oscillator']['source'], that.synthVals);
                that._playNote('G4', 1 / 8);
            });
        }

        if (newEnvelope) {
            console.log('CREATING ENVELOPE SYNTH!!!');
            this._logo.synth.createSynth(0, this.instrumentName, this.synthVals['oscillator']['source'], this.synthVals);
        }
    };

    this._filter = function () {
        docById('filterButtonCell').style.backgroundColor = '#C8C8C8';
        docById('filterButtonCell').onmouseover = function () {};
        docById('filterButtonCell').onmouseout = function () {};

        timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
        env.innerHTML = '';

        for (var f = 0; f < this.fil.length; f++) {
            this._createFilter(f, env);
        }

        this._addFilterListeners();
        this._updateFilters();
    };

    this._createFilter = function (f, env) {
        console.log('adding filter ' + f);

        var blockValue = f;
        var wrapperIDs = [f * 3, f * 3 + 1, f * 3 + 2];
        var radioIDs = [f * 4, f * 4 + 1, f * 4 + 2, f * 4 + 3];

        if (f % 2 === 1) {
            var htmlElements = '<div class="rectangle"><p>&nbsp;</p>';
        } else if (f > 0) {
            var htmlElements = '<div><p>&nbsp;</p>';
        } else {
            var htmlElements = '<div>';
        }

        var selectorID = 'selector' + f;
        var selID = 'sel' + f;

        htmlElements += '<div class="wrapper" id="wrapper' + wrapperIDs[0] + '"><div class="s" id="s' + wrapperIDs[0] + '"><span>' + _('type') + '</span></div><div class="filterselector" id="' + selectorID + '"></div></div>';
        htmlElements += '<div class="wrapper" id="wrapper' + wrapperIDs[1] + '"><div class="s" id="s' +  wrapperIDs[1] + '"><span>' + _('rolloff') + '</span></div><div class="insideDivFilter"><p><input id="radio' + radioIDs[0] + '" type="radio" name="rolloff' + f + '" value="-12" checked="checked"/>-12<input  id="radio' + radioIDs[1] + '" type="radio" name="rolloff' + f + '" value="-24"/>-24<input id="radio' + radioIDs[2] + '" type="radio" name="rolloff' + f + '" value="-48"/>-48<input id="radio' + radioIDs[3] + '" type="radio" name="rolloff' + f + '" value="-96"/>-96</p></div></div>';
        htmlElements += '<div class="wrapper" id="wrapper' + wrapperIDs[2] + '"><div class="s" id="s' +  wrapperIDs[2] + '"><span>' + _('frequency') + '</span></div><div class="insideDivFilter"><input type="range" id="myRangeF' + f + '" class="sliders" style="margin-top:20px" max="7050" value="' + parseFloat(this.filterParams[f * 3 + 2]) + '"><span id="myspanF' + f +'" class="rangeslidervalue">' + this.filterParams[f * 3 + 2] + '</span></div></div>';
        htmlElements += '</div>';
        env.innerHTML += htmlElements;

        var myDiv = docById(selectorID);
        var selectOpt = '<select class="sel" id="' + selID + '">';
        for (var i = 0; i < FILTERTYPES.length; i++) {
            // work around some weird i18n bug
            if (FILTERTYPES[i][0].length === 0) {
                if (FILTERTYPES[i][1] === this.filterParams[f * 3]) {
                    selectOpt += '<option value="' + FILTERTYPES[i][1] + '" selected>' + FILTERTYPES[i][1] + '</option>';
                } else {
                    selectOpt += '<option value="' + FILTERTYPES[i][1] + '">' + FILTERTYPES[i][1] + '</option>';
                }
            } else if (FILTERTYPES[i][0] === this.filterParams[f * 3]) {
                selectOpt += '<option value="' + FILTERTYPES[i][0] + '" selected>' + FILTERTYPES[i][0] + '</option>';
            } else {
                selectOpt += '<option value="' + FILTERTYPES[i][0] + '">' + FILTERTYPES[i][0] + '</option>';
            }
        }

        selectOpt += '</select>';
        myDiv.innerHTML = selectOpt;

        // Make sure there is an instruments filter for the filter.
        if (!(this.instrumentName in instrumentsFilters[0])) {
            instrumentsFilters[0][this.instrumentName] = [];
        }

        if (instrumentsFilters[0][this.instrumentName].length - 1 < f) {
            instrumentsFilters[0][this.instrumentName].push({'filterType': DEFAULTFILTERTYPE, 'filterRolloff': -12, 'filterFrequency': 392});
        }
    };

    this._addFilterListeners = function () {
         // Add the various listeners needed for the filter panel
        var that = this;
        for (var f = 0; f < this.fil.length; f++) {
            var radioIDs = [f * 4, f * 4 + 1, f * 4 + 2, f * 4 + 3];

            docById('sel' + f).addEventListener('change', function (event) {
                docById('filterButtonCell').style.backgroundColor = '#C8C8C0';
                var elem = event.target;
                var m = elem.id.slice(-1);
                instrumentsFilters[0][that.instrumentName][m]['filterType'] = elem.value;
                that._update(m, elem.value, 0);
                that._playNote('G4', 1 / 8);
            });

            for (var i = 0; i < radioIDs.length; i++) {
                var radioButton = docById('radio' + radioIDs[i]);

                radioButton.onclick = function (event) {
                    var elem = event.target;
                    var m = Number(elem.id.replace('radio',''));
                    instrumentsFilters[0][that.instrumentName][Math.floor(m / 4)]['filterRolloff'] = parseFloat(this.value);
                    that._update(Math.floor(m / 4), this.value, 1);
                    that._playNote('G4', 1 / 8);
                };
            }

            docById('myRangeF' + f).addEventListener('change', function (event) {
                docById('filterButtonCell').style.backgroundColor = '#C8C0C8';
                var elem = event.target;
                var m = elem.id.slice(-1);
                docById('myRangeF' + m).value = parseFloat(elem.value);
                docById('myspanF' + m).textContent = elem.value;
                instrumentsFilters[0][that.instrumentName][m]['filterFrequency'] = parseFloat(elem.value);
                that._update(m, elem.value, 2);
                that._playNote('G4', 1 / 8);
            });
        }
    };

    this._updateFilters = function () {
        // Update the various inputs on the filters panel.
        for (var f = 0; f < this.fil.length; f++) {
            var radioIDs = [f * 4, f * 4 + 1, f * 4 + 2, f * 4 + 3];

            docById('sel' + f).value = instrumentsFilters[0][this.instrumentName][f]['filterType'];

            var rolloff = instrumentsFilters[0][this.instrumentName][f]['filterRolloff'];
            if (rolloff === -12) {
                docById('radio' + radioIDs[0]).checked = true;
            } else {
                docById('radio' + radioIDs[0]).checked = false;
            }

            if (rolloff === -24) {
                docById('radio' + radioIDs[1]).checked = true;
            } else {
                docById('radio' + radioIDs[1]).checked = false;
            }

            if (rolloff === -48) {
                docById('radio' + radioIDs[2]).checked = true;
            } else {
                docById('radio' + radioIDs[2]).checked = false;
            }

            if (rolloff === -96) {
                docById('radio' + radioIDs[3]).checked = true;
            } else {
                docById('radio' + radioIDs[3]).checked = false;
            }
        }
    };

    this._addFilter = function () {
        var env = docById('timbreTable');
        var topOfClamp = this._logo.blocks.blockList[this.blockNo].connections[2];
        var bottomOfClamp = this._logo.blocks.findBottomBlock(topOfClamp);

        const FILTEROBJ = [[0, ['filter', {}], 0, 0, [null, 3, 1, 2, null]], [1, ['number', {'value': -12}], 0, 0, [0]], [2, ['number', {'value': 392}], 0, 0, [0]], [3, ['filtertype', {'value': DEFAULTFILTERTYPE}], 0, 0, [0]]];
        this._logo.blocks.loadNewBlocks(FILTEROBJ);

        var n = this._logo.blocks.blockList.length - 4;
        this.fil.push(n);
        this.filterParams.push(DEFAULTFILTERTYPE);
        this.filterParams.push(-12);
        this.filterParams.push(392);

        var that = this;
        setTimeout(that.blockConnection(4, bottomOfClamp), 500);

        this._createFilter(this.fil.length - 1, env);
        this._playNote('G4', 1 / 8);

        this._addFilterListeners();
        this._updateFilters();
    };

    this._effects = function () {
        var that = this;
        var blockValue = 0;

        docById('effectsButtonCell').style.backgroundColor = '#C8C8C8';
        docById('effectsButtonCell').onmouseover = function () {};
        docById('effectsButtonCell').onmouseout =  function () {};

        timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
        var htmlElements = '';
        for (var i = 0; i < 2; i++) {
            htmlElements += '<div id ="effect' + i + '"></div>';
        }

        env.innerHTML = htmlElements;
        var envAppend = document.createElement('div');
        envAppend.id = 'envAppend';
        envAppend.style.backgroundColor = MATRIXBUTTONCOLOR;
        envAppend.style.height = '30px';
        envAppend.style.marginTop = '40px';
        envAppend.style.overflow = 'auto';
        env.append(envAppend);

        var mainDiv = docById('effect0');
        mainDiv.innerHTML= '<p><input type="radio" name="effectsName" value="Tremolo"/>' + _('tremolo') + '</br><input type="radio" name="effectsName" value="Vibrato"/>' + _('vibrato') + '</br><input type="radio" name="effectsName" value="Chorus"/>' + _('chorus') + '</br><input type="radio" name="effectsName" value="Phaser"/>' + _('phaser') + '</br><input type="radio" name="effectsName" value="Distortion"/>' + _('distortion') + '</br></p>';

        var subDiv = docById('effect1');
        var effectsName = docByName('effectsName');
        var effectChosen;

        for (var i = 0; i < effectsName.length; i++) {
            effectsName[i].onclick = function () {
                effectChosen = this.value;
                var subHtmlElements = '<div id="chosen">' + effectChosen + '</div>';
                if (effectChosen === 'Tremolo' ) {
                    that.isActive['tremolo'] = true;
                    that.isActive['chorus'] = false;
                    that.isActive['vibrato'] = false;
                    that.isActive['distortion'] = false;
                    that.isActive['phaser'] = false;

                    instrumentsEffects[0][that.instrumentName]['tremoloActive'] = true;

                    for (var i = 0; i < 2; i++) {
                        subHtmlElements += '<div id="wrapperFx' + i + '"><div id="sFx' + i + '"><span></span></div><div class="insideDivEffects"><input type="range" id="myRangeFx' + i + '" class="sliders" style="margin-top:20px" value="2"><span id="myspanFx' + i + '" class="rangeslidervalue">2</span></div></div>';
                    }

                    subDiv.innerHTML = subHtmlElements;
                    docById('sFx0').textContent = _('rate');
                    docById('myRangeFx0').value = 10;
                    docById('myspanFx0').textContent = '10';
                    docById('sFx1').textContent = _('depth');
                    docById('myRangeFx1').value = 50;
                    docById('myspanFx1').textContent = '50';

                    if (that.tremoloEffect.length !== 0) {
                        blockValue = that.tremoloEffect.length - 1;
                        for (var i = 0; i < 2; i++) {
                            docById('myRangeFx' + i).value = parseFloat(that.tremoloParams[i]);
                            docById('myspanFx' + i).textContent = that.tremoloParams[i];
                            that._update(blockValue, that.tremoloParams[i], i);
                        }
                    }

                    if (that.tremoloEffect.length === 0) {
                        // This is the first block in the child stack of the Timbre clamp.
                        var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];

                        var n = that._logo.blocks.blockList.length;
                        const TREMOLOOBJ = [[0, ['tremolo', {}], 0, 0, [null, 1, 2, null, 3]], [1, ['number', {'value': 10}], 0, 0, [0]], [2, ['number', {'value': 50}], 0, 0, [0]], [3, 'hidden', 0, 0, [0, null]]];
                        that._logo.blocks.loadNewBlocks(TREMOLOOBJ);

                        that.tremoloEffect.push(n);
                        that.tremoloParams.push(10);
                        that.tremoloParams.push(50);

                        setTimeout(that.clampConnection(n, 3, topOfClamp), 500);
                    }

                    for (var i = 0; i < 2; i++) {
                        document.getElementById('wrapperFx' + i).addEventListener('change', function (event) {
                            docById('effectsButtonCell').style.backgroundColor = '#C8C8C8';
                            var elem = event.target;
                            var m = elem.id.slice(-1);
                            docById('myRangeFx' + m).value = parseFloat(elem.value);
                            docById('myspanFx' + m).textContent = elem.value;

                            if (m === 0) {
                                instrumentsEffects[0][that.instrumentName]['tremoloFrequency'] = parseFloat(elem.value);
                            }

                            if (m === 1) {
                                instrumentsEffects[0][that.instrumentName]['tremoloDepth'] = parseFloat(elem.value)/100;
                            }

                            that._update(blockValue, elem.value, Number(m));
                            that._playNote('G4', 1 / 8);
                        });
                    }
                } else if (effectChosen === 'Vibrato') {
                    that.isActive['tremolo'] = false;
                    that.isActive['chorus'] = false;
                    that.isActive['vibrato'] = true;
                    that.isActive['distortion'] = false;
                    that.isActive['phaser'] = false;

                    instrumentsEffects[0][that.instrumentName]['vibratoActive'] = true;
                    for (var i = 0; i < 2; i++) {
                        subHtmlElements += '<div id="wrapperFx' + i + '"><div id="sFx' + i + '"><span></span></div><div class="insideDivEffects"><input type="range" id="myRangeFx' + i + '" class="sliders" style="margin-top:20px" max="25" value="2"><span id="myspanFx' + i + '" class="rangeslidervalue">2</span></div></div>';
                    }

                    // Set slider values
                    subDiv.innerHTML = subHtmlElements;
                    docById('sFx0').textContent = _('intensity');
                    docById('sFx1').textContent = _('rate');

                    if (that.vibratoEffect.length > 0) {
                        var vibratroBlock = last(that.vibratoEffect);
                        docById('myRangeFx0').value = parseFloat(that.vibratoParams[0]);
                        docById('myspanFx0').textContent = that.vibratoParams[0];
                        // Scale of rate is 0 to 1, so we need to multiply by 100
                        docById('myRangeFx1').value = 100 / parseFloat(that.vibratoParams[1]);
                        var obj = rationalToFraction(1 / parseFloat(that.vibratoParams[1]));
                        docById('myspanFx1').textContent = obj[0] + '/' + obj[1];  // that.vibratoParams[1];
                    } else {
                        // If necessary, add a vibrato block.
                        var topOfTimbreClamp = that._logo.blocks.blockList[that.blockNo].connections[2];

                        var vibratoBlock = that._logo.blocks.blockList.length;
                        const VIBRATOOBJ = [[0, ['vibrato', {}], 0, 0, [null, 1, 3, 2, 6]], [1, ['number', {'value':  5}], 0, 0, [0]], [2, ['vspace', {}], 0, 0, [0, null]], [3, ['divide', {}], 0, 0, [0, 4, 5]], [4, ['number', {'value':  1}], 0, 0, [3]], [5, ['number', {'value':  16}], 0, 0, [3]], [6, ['hidden', {}], 0, 0, [0, null]]];
                        that._logo.blocks.loadNewBlocks(VIBRATOOBJ);

                        that.vibratoEffect.push(vibratoBlock);
                        that.vibratoParams.push(5);
                        that.vibratoParams.push(16);

                        setTimeout(that.clampConnectionVspace(vibratoBlock, vibratoBlock + 2, topOfTimbreClamp), 500);

                        docById('myRangeFx0').value = 5;
                        docById('myspanFx0').textContent = '5';
                        instrumentsEffects[0][that.instrumentName]['vibratoIntensity'] = 0.05;

                        docById('myRangeFx1').value = 100 / 16;
                        docById('myspanFx1').textContent = '1/16';
                        instrumentsEffects[0][that.instrumentName]['vibratoFrequency'] = 1 / 16;
                    }

                    // Add the listeners for the sliders.
                    document.getElementById('wrapperFx0').addEventListener('change', function (event) {
                        docById('effectsButtonCell').style.backgroundColor = '#C8C8C8';
                        var elem = event.target;
                        docById('myRangeFx0').value = parseFloat(elem.value);
                        docById('myspanFx0').textContent = elem.value;
                        instrumentsEffects[0][that.instrumentName]['vibratoIntensity'] = parseFloat(elem.value) / 100;

                        that._update(that.vibratoEffect.length - 1, elem.value, 0);
                        that._playNote('G4', 1 / 8);
                    });

                    document.getElementById('wrapperFx1').addEventListener('change', function (event) {
                        docById('effectsButtonCell').style.backgroundColor = '#C8C8C8';
                        var elem = event.target;
                        docById('myRangeFx1').value = parseFloat(elem.value);
                        var obj = oneHundredToFraction(elem.value);
                        docById('myspanFx1').textContent = obj[0] + '/' + obj[1];
                        var temp = parseFloat(obj[0])/parseFloat(obj[1]);

                        instrumentsEffects[0][that.instrumentName]['vibratoFrequency'] = temp;
                        that._update(that.vibratoEffect.length - 1, obj[1], 1);
                        that._update(that.vibratoEffect.length - 1, obj[0], 2);
                        that._playNote('G4', 1 / 8);
                    });

                } else if (effectChosen === 'Chorus' ) {
                    that.isActive['tremolo'] = false;
                    that.isActive['chorus'] = true;
                    that.isActive['vibrato'] = false;
                    that.isActive['distortion'] = false;
                    that.isActive['phaser'] = false;

                    instrumentsEffects[0][that.instrumentName]['chorusActive'] = true;

                    for (var i = 0; i < 3; i++) {
                        subHtmlElements += '<div id="wrapperFx' + i + '"><div id="sFx' + i + '"><span></span></div><div class="insideDivEffects"><input type="range" id="myRangeFx' + i + '" class="sliders" style="margin-top:20px" value="2"><span id="myspanFx' + i + '" class="rangeslidervalue">2</span></div></div>';
                    }

                    subDiv.innerHTML = subHtmlElements;
                    docById('sFx0').textContent = _('rate');
                    docById('myRangeFx0').value = 2;
                    docById('myspanFx0').textContent = '2';
                    docById('sFx1').textContent = _('delay (MS)');
                    docById('myRangeFx1').value = 4;
                    docById('myspanFx1').textContent = '4';
                    docById('sFx2').textContent = _('depth');
                    docById('myRangeFx2').value = 70;
                    docById('myspanFx2').textContent = '70';

                    if (that.chorusEffect.length !== 0) {
                        blockValue = that.chorusEffect.length - 1;
                        for (var i = 0; i < 3; i++) {
                            docById('myRangeFx' + i).value = parseFloat(that.chorusParams[i]);
                            docById('myspanFx' + i).textContent = that.chorusParams[i];
                            that._update(blockValue, that.chorusParams[i], i);
                        }
                    }

                    if (that.chorusEffect.length === 0) {
                        var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];

                        var n = that._logo.blocks.blockList.length;
                        const CHORUSOBJ = [[0, ['chorus', {}], 0, 0, [null, 1, 2, 3, null, 4]], [1, ['number', {'value': 2}], 0, 0, [0]], [2, ['number', {'value': 4}], 0, 0, [0]], [3, ['number', {'value': 70}], 0, 0, [0]], [4, 'hidden', 0, 0, [0, null]]];
                        that._logo.blocks.loadNewBlocks(CHORUSOBJ);

                        that.chorusEffect.push(n);
                        that.chorusParams.push(2);
                        that.chorusParams.push(4);
                        that.chorusParams.push(70);

                        setTimeout(that.clampConnection(n, 4, topOfClamp), 500);
                    }

                    for (var i = 0; i < 3; i++) {

                        document.getElementById('wrapperFx' + i).addEventListener('change', function (event) {
                            docById('effectsButtonCell').style.backgroundColor = '#C8C8C8';
                            var elem = event.target;
                            var m = elem.id.slice(-1);
                            docById('myRangeFx' + m).value = parseFloat(elem.value);
                            docById('myspanFx' + m).textContent = elem.value;

                            if (m === 0) {
                                instrumentsEffects[0][that.instrumentName]['chorusRate'] = parseFloat(elem.value);
                            }

                            if (m === 1) {
                                instrumentsEffects[0][that.instrumentName]['delayTime'] = parseFloat(elem.value);
                            }

                            if (m === 2) {
                                instrumentsEffects[0][that.instrumentName]['chorusDepth'] = parseFloat(elem.value)/100;
                            }

                            that._update(blockValue, elem.value, Number(m));
                            that._playNote('G4', 1 / 8);
                        });

                    }
                } else if (effectChosen === 'Phaser') {
                    that.isActive['tremolo'] = false;
                    that.isActive['chorus'] = false;
                    that.isActive['vibrato'] = false;
                    that.isActive['distortion'] = false;
                    that.isActive['phaser'] = true;

                    instrumentsEffects[0][that.instrumentName]['phaserActive'] = true;

                    for (var i = 0; i < 3; i++) {
                        subHtmlElements += '<div id="wrapperFx' + i + '"><div id="sFx' + i + '"><span></span></div><div class="insideDivEffects"><input type="range" id="myRangeFx' + i + '" class="sliders" style="margin-top:20px" value="2"><span id="myspanFx' + i + '" class="rangeslidervalue">2</span></div></div>';
                    }

                    subDiv.innerHTML = subHtmlElements;
                    docById('sFx0').textContent = _('rate');
                    docById('myRangeFx0').value = 5;
                    docById('myspanFx0').textContent = '5';
                    docById('sFx1').textContent = _('octaves');
                    docById('myRangeFx1').value = 3;
                    docById('myspanFx1').textContent = '3';
                    docById('sFx2').textContent = _('base frequency');
                    docById('myRangeFx2').value = 350;
                    docById('myspanFx2').textContent = '350';

                    if (that.phaserEffect.length !== 0) {
                        blockValue = that.phaserEffect.length - 1;
                        for (var i = 0; i < 3; i++) {
                            docById('myRangeFx' + i).value = parseFloat(that.phaserParams[i]);
                            docById('myspanFx' + i).textContent = that.phaserParams[i];
                            that._update(blockValue, that.phaserParams[i], i);
                        }
                    }

                    if (that.phaserEffect.length === 0) {
                        var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];

                        var n = that._logo.blocks.blockList.length;
                        const PHASEROBJ = [[0, ['phaser', {}], 0, 0, [null, 1, 2, 3, null, 4]], [1, ['number', {'value': 5}], 0, 0, [0]], [2, ['number', {'value': 3}], 0, 0, [0]], [3, ['number', {'value': 350}], 0, 0, [0]], [4, 'hidden', 0, 0, [0, null]]];
                        that._logo.blocks.loadNewBlocks(PHASEROBJ);

                        that.phaserEffect.push(n);
                        that.phaserParams.push(5);
                        that.phaserParams.push(3);
                        that.phaserParams.push(350);

                        setTimeout(that.clampConnection(n, 4, topOfClamp), 500);
                    }

                    for (var i = 0; i < 3; i++) {

                        document.getElementById('wrapperFx' + i).addEventListener('change', function (event) {
                            docById('effectsButtonCell').style.backgroundColor = '#C8C8C8';
                            var elem = event.target;
                            var m = elem.id.slice(-1);
                            docById('myRangeFx' + m).value = parseFloat(elem.value);
                            docById('myspanFx' + m).textContent = elem.value;

                            if (m === 0) {
                                instrumentsEffects[0][that.instrumentName]['rate'] = parseFloat(elem.value);
                            }

                            if (m === 1) {
                                instrumentsEffects[0][that.instrumentName]['octaves'] = parseFloat(elem.value);
                            }

                            if (m === 2) {
                                instrumentsEffects[0][that.instrumentName]['baseFrequency'] = parseFloat(elem.value);
                            }

                            that._update(blockValue, elem.value, Number(m));
                            that._playNote('G4', 1 / 8);
                        });

                    }
                } else if (effectChosen === 'Distortion') {
                    that.isActive['tremolo'] = false;
                    that.isActive['chorus'] = false;
                    that.isActive['vibrato'] = false;
                    that.isActive['distortion'] = true;
                    that.isActive['phaser'] = false;

                    instrumentsEffects[0][that.instrumentName]['distortionActive'] = true;

                    subHtmlElements += '<div id="wrapperFx0"><div id="sFx0"><span></span></div><div class="insideDivEffects"><input type="range" id="myRangeFx0" class="sliders" style="margin-top:20px" value="2"><span id="myspanFx0" class="rangeslidervalue">2</span></div></div>';

                    subDiv.innerHTML = subHtmlElements;

                    docById('sFx0').textContent = _('distortion amount');
                    docById('myRangeFx0').value = 40;
                    docById('myspanFx0').textContent = '40';

                    if (that.distortionEffect.length !== 0) {
                        blockValue = that.distortionEffect.length - 1;
                        docById('myRangeFx0').value = parseFloat(that.distortionParams[0]);
                        docById('myspanFx0').textContent = that.distortionParams[0];
                        that._update(blockValue, that.distortionParams[0], 0);
                    }

                    if (that.distortionEffect.length === 0) {
                        var topOfClamp = that._logo.blocks.blockList[that.blockNo].connections[2];

                        var n = that._logo.blocks.blockList.length;
                        const DISTORTIONOBJ = [[0, ['dis', {}], 0, 0, [null, 1, null, 2]], [1, ['number', {'value': 40}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
                        that._logo.blocks.loadNewBlocks(DISTORTIONOBJ);

                        that.distortionEffect.push(n);
                        that.distortionParams.push(40);

                        setTimeout(that.clampConnection(n, 2, topOfClamp), 500);
                    }

                    document.getElementById('wrapperFx0').addEventListener('change', function (event) {
                        docById('effectsButtonCell').style.backgroundColor = '#C8C8C8';
                        var elem = event.target;
                        var m = elem.id.slice(-1);
                        docById('myRangeFx0').value = parseFloat(elem.value);
                        docById('myspanFx0').textContent = elem.value;
                        instrumentsEffects[0][that.instrumentName]['distortionAmount'] = parseFloat(elem.value)/100;
                        that._update(blockValue, elem.value, 0);
                        that._playNote('G4', 1 / 8);
                    });
                }
            }
        }
    }
};
