// Copyright (c) 2021 Liam Norman
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

function SampleWidget() {
    const BUTTONDIVWIDTH = 476; // 8 buttons 476 = (55 + 4) * 8
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    const SAMPLEWIDTH = 400;
    const SAMPLEHEIGHT = 160;
    const RENDERINTERVAL = 50;
    const EXPORTACCIDENTALNAMES = [DOUBLEFLAT, FLAT, "", SHARP, DOUBLESHARP];  // Don't include natural when construcing the note name;
    const ACCIDENTALNAMES = [DOUBLEFLAT, FLAT, NATURAL, SHARP, DOUBLESHARP]; // but display it in the selector.
    const SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti", "do"];
    const MAJORSCALE = [0, 2, 4, 5, 7, 9, 11];
    const DEFAULTACCIDENTAL = "";
    const DEFAULTSOLFEGE = "do";
    const REFERENCESAMPLE = "electronic synth";
    const DEFAULTSAMPLE = "electronic synth";
    const CENTERPITCHHERTZ = 220;
    const MAXOCTAVE = 10;
    const SAMPLEWAITTIME = 500;

    this.timbreBlock;
    this.sampleArray;
    this.sampleData = "";
    this.sampleName = DEFAULTSAMPLE;
    this.samplePitch = "sol";
    this.sampleOctave = "4";
    this.pitchCenter = 9;
    this.accidentalCenter = 2;
    this.octaveCenter = 4;
    this.freqArray = new Uint8Array();
    this.sampleLength = 1000;

    this._updateBlocks = function() {
        let mainSampleBlock;
        let audiofileBlock;
        let solfegeBlock;
        let octaveBlock;
        this.sampleArray = [this.sampleName, this.sampleData, this.samplePitch, this.sampleOctave];
        if (this.timbreBlock != null) {
            mainSampleBlock = this._logo.blocks.blockList[this.timbreBlock].connections[1];;
            if (mainSampleBlock != null) {
                this._logo.blocks.blockList[mainSampleBlock].value = this.sampleArray;
                this._logo.blocks.blockList[mainSampleBlock].updateCache();
                audiofileBlock = this._logo.blocks.blockList[mainSampleBlock].connections[1];
                solfegeBlock = this._logo.blocks.blockList[mainSampleBlock].connections[2];
                octaveBlock = this._logo.blocks.blockList[mainSampleBlock].connections[3];
                if (audiofileBlock != null) {
                    this._logo.blocks.blockList[audiofileBlock].value = [this.sampleName, this.sampleData];
                    this._logo.blocks.blockList[audiofileBlock].text.text = this.sampleName;
                    this._logo.blocks.blockList[audiofileBlock].updateCache();
                }
                if (solfegeBlock != null) {
                    this._logo.blocks.blockList[solfegeBlock].value = this.samplePitch;
                    this._logo.blocks.blockList[solfegeBlock].text.text = this.samplePitch;
                    this._logo.blocks.blockList[solfegeBlock].updateCache();
                }
                if (octaveBlock != null) {
                    this._logo.blocks.blockList[octaveBlock].value = this.sampleOctave;
                    this._logo.blocks.blockList[octaveBlock].text.text = this.sampleOctave;
                    this._logo.blocks.blockList[octaveBlock].updateCache();
                }

                this._logo.refreshCanvas();
                saveLocally();
            }
        }
    };

    this.pause = function() {
        clearInterval(this._intervalID);
        this.playBtn.innerHTML =
            '<img src="header-icons/play-button.svg" title="' +
            _("Play") +
            '" alt="' +
            _("Play") +
            '" height="' +
            ICONSIZE +
            '" width="' +
            ICONSIZE +
            '" vertical-align="middle">';
        this.isMoving = false;
    };

    this.resume = function() {
        this.playBtn.innerHTML =
            '<img src="header-icons/pause-button.svg" title="' +
            _("Pause") +
            '" alt="' +
            _("Pause") +
            '" height="' +
            ICONSIZE +
            '" width="' +
            ICONSIZE +
            '" vertical-align="middle">';
        this.isMoving = true;
    };

    this.pitchUp = function () {
        this._usePitch(this.pitchInput.value);
        this.pitchCenter++;
        if (this.pitchCenter > 6) {
            this.octaveCenter++;
            if (this.octaveCenter > MAXOCTAVE) {
                this.octaveCenter = MAXOCTAVE;
            }
            this.octaveInput.value = this.octaveCenter;
        }
        this.pitchCenter%=7;
        this.pitchInput.value = SOLFEGENAMES[this.pitchCenter];
        this._playReferencePitch();
    };

    this.pitchDown = function () {
        this._usePitch(this.pitchInput.value);
        this.pitchCenter--;
        if (this.pitchCenter < 0) {
            this.pitchCenter = 6;
            this.octaveCenter--;
            if (this.octaveCenter < 0) {
                this.octaveCenter = 0;
            }
            this.octaveInput.value = this.octaveCenter;
        }
        this.pitchCenter%=7;
        this.pitchInput.value = SOLFEGENAMES[this.pitchCenter];
        this._playReferencePitch();
    };

    this.accidentalUp = function () {
        this._useAccidental(this.accidentalInput.value);
        if (this.accidentalCenter < 4) {
            this.accidentalCenter++;
        }
        this.accidentalInput.value = ACCIDENTALNAMES[this.accidentalCenter];
        this._playReferencePitch();
    };

    this.accidentalDown = function () {
        this._useAccidental(this.accidentalInput.value);
        if (this.accidentalCenter > 0) {
            this.accidentalCenter--;
        }
        this.accidentalInput.value = ACCIDENTALNAMES[this.accidentalCenter];
        this._playReferencePitch();
    };

    this.octaveUp = function () {
        this._useOctave(this.octaveInput.value);
        this.octaveCenter++;
        if (this.octaveCenter > MAXOCTAVE) {
            this.octaveCenter = MAXOCTAVE;
        }
        this.octaveInput.value = this.octaveCenter;
        this._playReferencePitch();
    };

    this.octaveDown = function () {
        this._useOctave(this.octaveInput.value);
        this.octaveCenter--;
        if (this.octaveCenter < 0) {
            this.octaveCenter = 0;
        }
        this.octaveInput.value = this.octaveCenter;
        this._playReferencePitch();
    };

    this._usePitch = function () {
        const number = SOLFEGENAMES.indexOf(this.pitchInput.value);
        this.pitchCenter = (number==-1) ? 0 : number;
        this.pitchInput.value = SOLFEGENAMES[this.pitchCenter];
    };

    this._useAccidental = function () {
        const number = ACCIDENTALNAMES.indexOf(this.accidentalInput.value);
        this.accidentalCenter = (number==-1) ? 2 : number;
        this.accidentalInput.value = ACCIDENTALNAMES[this.accidentalCenter];
    };

    this._useOctave = function () {
        this.octaveCenter = parseInt(this.octaveInput.value);
        this.octaveInput.value = this.octaveCenter;
    };

    this._draw = function() {

        const d = new Date();
        var canvas = this.sampleCanvas;
        const middle = SAMPLEHEIGHT / 2 - 15;

        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.strokeStyle = "#0000FF";
        ctx.lineWidth = 0;

        const period = Math.floor(this.sampleData.length / SAMPLEWIDTH);

        for (let x=0; x < SAMPLEWIDTH; x++) {
            let amplitude = 0;
            const index = x*period+24;
            //if (index < this.sampleData.length) {
            //    amplitude = this.sampleData.charCodeAt(index) - 64;
            //}
            if (x < this.freqArray.length) {
                amplitude = this.freqArray[x];
            }
            ctx.moveTo(x, middle - amplitude);
            ctx.lineTo(x, middle + amplitude);
            ctx.stroke();
            ctx.fill();
        }
        ctx.closePath();

        ctx.font = "10px Verdana";
        ctx.fillText(this.sampleName, 10, 10);
    };

    this.__save = function() {
        var that = this;
        setTimeout(function() {
            console.debug("saving the sample");

            that._addSample();

            var newStack = [
                [0, ["customsample", {value: [
                    that.sampleName,
                    that.sampleData,
                    "do",
                    4
                ]}], 100, 100, [null, 1, 2, 3]],
                [1, ["audiofile", {value: [that.sampleName, that.sampleData]}], 0 ,0, [0]],
                [2, ["solfege", {value: that.samplePitch}], 0, 0, [0]],
                [3, ["number", {value: that.sampleOctave}], 0, 0, [0]],
            ];

            that._logo.blocks.loadNewBlocks(newStack);
            that._logo.textMsg(_("A new sample block was generated."));
        }, 200 * i);
    };

    this._saveSample = function() {
        this.__save();
    };

    this._get_save_lock = function() {
        return this._save_lock;
    };

    this.init = function(logo) {
        this._logo = logo;
        this._directions = [];
        this._widgetFirstTimes = [];
        this._widgetNextTimes = [];
        this._firstClickTimes = null;
        this._intervals = [];
        this.isMoving = false;
        if (this._intervalID != undefined && this._intervalID != null) {
            clearInterval(this._intervalID);
        }

        this._intervalID = null;

        this._logo.synth.loadSynth(0, getVoiceSynthName(DEFAULTSAMPLE));

        if (this._intervalID != null) {
            clearInterval(this._intervalID);
        }

        var w = window.innerWidth;

        var widgetWindow = window.widgetWindows.windowFor(this, "sample");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        // For the button callbacks
        var that = this;

        widgetWindow.onclose = function() {
            if (that._intervalID != null) {
                clearInterval(that._intervalID);
            }
            this.destroy();
        };

        this.playBtn = widgetWindow.addButton("play-button.svg", ICONSIZE, _("Play"));
        this.playBtn.onclick = () => {
            if (this.isMoving) {
                this.pause();
                this.playBtn.innerHTML =
                    '<img src="header-icons/play-button.svg" title="' +
                    _("Play") +
                    '" alt="' +
                    _("Play") +
                    '" height="' +
                    ICONSIZE +
                    '" width="' +
                    ICONSIZE +
                    '" vertical-align="middle">';
                this.isMoving = false;
            } else {
                if (!(this.sampleName == "")) {
                    this.resume();
                    this._playReferencePitch();
                }
            }
        };

        widgetWindow.addButton(
            "load-media.svg",
            ICONSIZE,
            _("Upload sample"),
            ""
        ).onclick = function() {
            const fileChooser = docById("myOpenAll");

            const __readerAction = function(event) {
                window.scroll(0, 0);
                var sampleFile = fileChooser.files[0];
                var reader = new FileReader;
                reader.readAsDataURL(sampleFile);

                reader.onload = function(e) {
                    var rawLog = reader.result;
                    that.sampleData = rawLog;
                    that.sampleName = fileChooser.files[0].name;
                    that._addSample();
                    that._draw();
                };

                reader.onloadend = function() {
                    if (reader.result) {
                        value = [fileChooser.files[0].name, reader.result];
                    } else {
                    }
                };
                fileChooser.removeEventListener("change", __readerAction);
            };

            fileChooser.addEventListener("change", __readerAction, false);
            fileChooser.focus();
            fileChooser.click();
            window.scroll(0, 0);
        };

        this._save_lock = false;
        widgetWindow.addButton(
            "export-chunk.svg",
            ICONSIZE,
            _("Save sample"),
            ""
        ).onclick = function() {
            // Debounce button
            if (!that._get_save_lock()) {
                that._save_lock = true;
                that._saveSample();
                setTimeout(function() {
                    that._save_lock = false;
                }, 1000);
            }
        };

        this.bodyTable = document.createElement("table");
        this.widgetWindow.getWidgetBody().appendChild(this.bodyTable);

        this.bodyTable = document.createElement("table");
        this.widgetWindow.getWidgetBody().appendChild(this.bodyTable);

        let r1, r2, r3, vCell;
        for (let i = 0; i < 1; i++) {
            this._directions.push(1);
            this._widgetFirstTimes.push(this._logo.firstNoteTime);

            r1 = this.bodyTable.insertRow();
            r2 = this.bodyTable.insertRow();
            r3 = this.bodyTable.insertRow();

            widgetWindow.addButton(
                "up.svg",
                ICONSIZE,
                _("pitch up"),
                r1.insertCell()
            ).onclick = ((i) => () => this.pitchUp(i))(i);

            this.pitchInput = widgetWindow.addInputButton(this.pitchCenter, r2.insertCell());
            this._usePitch(this.pitchInput.value);

            widgetWindow.addButton(
                "down.svg",
                ICONSIZE,
                _("pitch down"),
                r3.insertCell()
            ).onclick = ((i) => () => this.pitchDown(i))(i);


            widgetWindow.addButton(
                "up.svg",
                ICONSIZE,
                _("accidental up"),
                r1.insertCell()
            ).onclick = ((i) => () => this.accidentalUp(i))(i);

            this.accidentalInput = widgetWindow.addInputButton(this.accidentalCenter, r2.insertCell());
            this._useAccidental(this.accidentalInput.value);

            widgetWindow.addButton(
                "down.svg",
                ICONSIZE,
                _("accidental down"),
                r3.insertCell()
            ).onclick = ((i) => () => this.accidentalDown(i))(i);

            widgetWindow.addButton(
                "up.svg",
                ICONSIZE,
                _("octave up"),
                r1.insertCell()
            ).onclick = ((i) => () => this.octaveUp(i))(i);

            this.octaveInput = widgetWindow.addInputButton(this.octaveCenter, r2.insertCell());
            this._useOctave(this.octaveInput.value);

            widgetWindow.addButton(
                "down.svg",
                ICONSIZE,
                _("octave down"),
                r3.insertCell()
            ).onclick = ((i) => () => this.octaveDown(i))(i);

            this.sampleCanvas = document.createElement("canvas");
            this.sampleCanvas.style.width = SAMPLEWIDTH + "px";
            this.sampleCanvas.style.height = SAMPLEHEIGHT + "px";
            this.sampleCanvas.style.margin = "1px";
            this.sampleCanvas.style.background = "rgba(255, 255, 255, 1)";
            vCell = r1.insertCell();
            vCell.appendChild(this.sampleCanvas);
            vCell.setAttribute("rowspan", "3");

            this.pitchInput.addEventListener(
                "keyup",
                ((id) => (e) => {
                    if (e.keyCode === 13) {
                        console.log("use pitch");
                        this._usePitch(id);
                    }
                })
            );
        }

        this._parseSamplePitch();

        this.setTimbre();

        this._logo.textMsg(_("Upload a sample and adjust its pitch center."));
        this._draw();
        this.pause();

        widgetWindow.sendToCenter();
    };

    this._addSample = function() {
        for (i=0; i < CUSTOMSAMPLES.length; i++) {
            if (CUSTOMSAMPLES[i][0] == this.sampleName) {
                return;
            }
        }
        CUSTOMSAMPLES.push([this.sampleName, this.sampleData]);
    };

    this._parseSamplePitch = function () {

        const first_part = this.samplePitch.substring(0,2);
        if (first_part === "so") {
            this.pitchCenter = 4;
        } else {
            this.pitchCenter = SOLFEGENAMES.indexOf(first_part);
        }
        this.pitchInput.value = SOLFEGENAMES[this.pitchCenter];

        const sol = this.samplePitch;

        let attr, lev;
        if (sol.indexOf(SHARP) != -1) {
            attr = SHARP;
            lev = 1;
        } else if (sol.indexOf(FLAT) != -1) {
            attr = FLAT;
            lev = -1;
        } else if (sol.indexOf(DOUBLEFLAT) != -1) {
            attr = DOUBLEFLAT;
            lev = -2;
        } else if (sol.indexOf(DOUBLESHARP) != -1) {
            attr = DOUBLESHARP;
            lev = 2;
        } else {
            attr = "";
            lev = 0;
        }
        this.accidentalCenter = lev + 2;
        this.accidentalInput.value = ACCIDENTALNAMES[this.accidentalCenter];

        this.octaveCenter = this.sampleOctave;
        this.octaveInput.value = this.sampleOctave;

    };

    this._updateSamplePitchValues = function () {
        this.samplePitch =
            SOLFEGENAMES[this.pitchCenter] +
            EXPORTACCIDENTALNAMES[this.accidentalCenter];
        this.sampleOctave = this.octaveCenter.toString();
    };


    this.setTimbre = function () {
        this.originalSampleName = this.sampleName + "_original";
        const sampleArray = [this.originalSampleName, this.sampleData, "la", 4];
        Singer.ToneActions.setTimbre(sampleArray, 0, this.timbreBlock);
    };

    this._playReferencePitch = function() {

        this._usePitch(this.pitchInput.value);
        this._useAccidental(this.accidentalInput.value);
        this._useOctave(this.octaveInput.value);

        this._updateSamplePitchValues();
        this._updateBlocks();



        let finalCenter = 0;

        finalCenter += isNaN(this.octaveCenter)     ? 0 : this.octaveCenter*12;
        finalCenter += isNaN(this.pitchCenter)      ? 0 : MAJORSCALE[this.pitchCenter];
        finalCenter += isNaN(this.accidentalCenter) ? 0 : this.accidentalCenter-2;



        const netChange = finalCenter-57;
        const reffinalpitch = Math.floor(440 * Math.pow(2, netChange/12));

        this._logo.synth.trigger(
            0,
            [reffinalpitch],
            0.5,
            REFERENCESAMPLE,
            null,
            null,
            false);

        this.setTimbre();
        this._playDelayedSample();
    };

    this._playSample = function () {
        if (this.sampleName != null && this.sampleName != "") {

            const finalpitch = CENTERPITCHHERTZ;

            this._logo.synth.trigger(
                0,
                [finalpitch],
                this.sampleLength/1000.0,
                "customsample_" + this.originalSampleName,
                null,
                null,
                false);
        }
    };

    this._waitAndPlaySample = function () {
        return new Promise(resolve => {
            setTimeout(() => {
                this._playSample();
                resolve("played");
                this._endPlaying();
            }, SAMPLEWAITTIME);
        });
    };

    this._playDelayedSample = async function () {
        const result = await this._waitAndPlaySample();
    };

    this._waitAndEndPlaying = function () {
        return new Promise(resolve => {
            setTimeout(() => {
                this.pause();
                resolve("ended");
            }, this.sampleLength);
        });
    };

    this._endPlaying = async function () {
        const result = await this._waitAndEndPlaying();
    };
}
