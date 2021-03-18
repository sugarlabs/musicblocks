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

/*
   global _, getVoiceSynthName, NATURAL,
   DOUBLEFLAT, DOUBLESHARP, FLAT, SHARP, logo,docById, Singer, saveLocally, CUSTOMSAMPLES
 */

/*
   Global locations
   - js/utils/utils.js
        _, docById
   - js/utils/musicutils.js
        , getVoiceSynthName, NATURAL, DOUBLEFLAT, DOUBLESHARP, FLAT, SHARP
   - js/logo.js
        logo
   - js/activity.js
        saveLocally
        -js/utils/synthutils.js
        CUSTOMSAMPLES
 */

/*exported SampleWidget*/
class SampleWidget {
    static BUTTONDIVWIDTH = 476; // 8 buttons 476 = (55 + 4) * 8
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;
    static SAMPLEWIDTH = 400;
    static SAMPLEHEIGHT = 160;
    static RENDERINTERVAL = 50;
    static EXPORTACCIDENTALNAMES = [DOUBLEFLAT, FLAT, "", SHARP, DOUBLESHARP];  // Don't include natural when construcing the note name;
    static ACCIDENTALNAMES = [DOUBLEFLAT, FLAT, NATURAL, SHARP, DOUBLESHARP]; // but display it in the selector.
    static SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti", "do"];
    static MAJORSCALE = [0, 2, 4, 5, 7, 9, 11];
    static DEFAULTACCIDENTAL = "";
    static DEFAULTSOLFEGE = "do";
    static REFERENCESAMPLE = "electronic synth";
    static DEFAULTSAMPLE = "electronic synth";
    static CENTERPITCHHERTZ = 220;
    static MAXOCTAVE = 10;
    static SAMPLEWAITTIME = 500;

    constructor(){
        this.timbreBlock;
        this.sampleArray;
        this.sampleData = "";
        this.sampleName = SampleWidget.DEFAULTSAMPLE;
        this.samplePitch = "sol";
        this.sampleOctave = "4";
        this.pitchCenter = 9;
        this.accidentalCenter = 2;
        this.octaveCenter = 4;
        this.freqArray = new Uint8Array();
        this.sampleLength = 1000;
    }
    
    _updateBlocks(){
        let mainSampleBlock;
        let audiofileBlock;
        let solfegeBlock;
        let octaveBlock;
        this.sampleArray = [this.sampleName, this.sampleData, this.samplePitch, this.sampleOctave];
        if (this.timbreBlock != null) {
            mainSampleBlock = logo.blocks.blockList[this.timbreBlock].connections[1];;
            if (mainSampleBlock != null) {
                logo.blocks.blockList[mainSampleBlock].value = this.sampleArray;
                logo.blocks.blockList[mainSampleBlock].updateCache();
                audiofileBlock = logo.blocks.blockList[mainSampleBlock].connections[1];
                solfegeBlock = logo.blocks.blockList[mainSampleBlock].connections[2];
                octaveBlock = logo.blocks.blockList[mainSampleBlock].connections[3];
                if (audiofileBlock != null) {
                    logo.blocks.blockList[audiofileBlock].value= [this.sampleName, this.sampleData];
                    logo.blocks.blockList[audiofileBlock].text.text = this.sampleName;
                    logo.blocks.blockList[audiofileBlock].updateCache();
                }
                if (solfegeBlock != null) {
                    logo.blocks.blockList[solfegeBlock].value = this.samplePitch;
                    logo.blocks.blockList[solfegeBlock].text.text = this.samplePitch;
                    logo.blocks.blockList[solfegeBlock].updateCache();
                }
                if (octaveBlock != null) {
                    logo.blocks.blockList[octaveBlock].value = this.sampleOctave;
                    logo.blocks.blockList[octaveBlock].text.text = this.sampleOctave;
                    logo.blocks.blockList[octaveBlock].updateCache();
                }

                logo.refreshCanvas();
                saveLocally();
            }
        }
    }

    pause(){
        clearInterval(this._intervalID);
        this.playBtn.innerHTML =
            '<img src="header-icons/play-button.svg" title="' +
            _("Play") +
            '" alt="' +
            _("Play") +
            '" height="' +
            SampleWidget.ICONSIZE +
            '" width="' +
            SampleWidget.ICONSIZE +
            '" vertical-align="middle">';
        this.isMoving = false;
    }

    resume() {
        this.playBtn.innerHTML =
            '<img src="header-icons/pause-button.svg" title="' +
            _("Pause") +
            '" alt="' +
            _("Pause") +
            '" height="' +
            SampleWidget.ICONSIZE +
            '" width="' +
            SampleWidget.ICONSIZE +
            '" vertical-align="middle">';
        this.isMoving = true;
    };

    pitchUp(){
        this._usePitch(this.pitchInput.value);
        this.pitchCenter++;
        if (this.pitchCenter > 6) {
            this.octaveCenter++;
            if (this.octaveCenter > SampleWidget.MAXOCTAVE) {
                this.octaveCenter = SampleWidget.MAXOCTAVE;
            }
            this.octaveInput.value = this.octaveCenter;
        }
        this.pitchCenter%=7;
        this.pitchInput.value = SampleWidget.SOLFEGENAMES[this.pitchCenter];
        this._playReferencePitch();
    };

    pitchDown() {
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
        this.pitchInput.value = SampleWidget.SOLFEGENAMES[this.pitchCenter];
        this._playReferencePitch();
    };

    accidentalUp() {
        this._useAccidental(this.accidentalInput.value);
        if (this.accidentalCenter < 4) {
            this.accidentalCenter++;
        }
        this.accidentalInput.value = SampleWidget.ACCIDENTALNAMES[this.accidentalCenter];
        this._playReferencePitch();
    };

    accidentalDown() {
        this._useAccidental(this.accidentalInput.value);
        if (this.accidentalCenter > 0) {
            this.accidentalCenter--;
        }
        this.accidentalInput.value = SampleWidget.ACCIDENTALNAMES[this.accidentalCenter];
        this._playReferencePitch();
    };

    octaveUp() {
        this._useOctave(this.octaveInput.value);
        this.octaveCenter++;
        if (this.octaveCenter > SampleWidget.MAXOCTAVE) {
            this.octaveCenter = SampleWidget.MAXOCTAVE;
        }
        this.octaveInput.value = this.octaveCenter;
        this._playReferencePitch();
    };

    octaveDown() {
        this._useOctave(this.octaveInput.value);
        this.octaveCenter--;
        if (this.octaveCenter < 0) {
            this.octaveCenter = 0;
        }
        this.octaveInput.value = this.octaveCenter;
        this._playReferencePitch();
    };

    _usePitch() {
        const number = SampleWidget.SOLFEGENAMES.indexOf(this.pitchInput.value);
        this.pitchCenter = (number==-1) ? 0 : number;
        this.pitchInput.value = SampleWidget.SOLFEGENAMES[this.pitchCenter];
    }

    _useAccidental() {
        const number = SampleWidget.ACCIDENTALNAMES.indexOf(this.accidentalInput.value);
        this.accidentalCenter = (number==-1) ? 2 : number;
        this.accidentalInput.value = SampleWidget.ACCIDENTALNAMES[this.accidentalCenter];
    }

    _useOctave() {
        this.octaveCenter = parseInt(this.octaveInput.value);
        this.octaveInput.value = this.octaveCenter;
    }

    _draw(){
        const canvas = this.sampleCanvas;
        const middle = SampleWidget.SAMPLEHEIGHT / 2 - 15;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.strokeStyle = "#0000FF";
        ctx.lineWidth = 0;


        for (let x=0; x < SampleWidget.SAMPLEWIDTH; x++) {
            let amplitude = 0;
            // const index = x*period+24;
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
    }

    __save() {
        setTimeout(() => {
            // console.debug("saving the sample");

            this._addSample();

            const newStack = [
                [0, ["customsample", {value: [
                    this.sampleName,
                    this.sampleData,
                    "do",
                    4
                ]}], 100, 100, [null, 1, 2, 3]],
                [1, ["audiofile", {value: [this.sampleName, this.sampleData]}], 0 ,0, [0]],
                [2, ["solfege", {value: this.samplePitch}], 0, 0, [0]],
                [3, ["number", {value: this.sampleOctave}], 0, 0, [0]],
            ];

            logo.blocks.loadNewBlocks(newStack);
            logo.textMsg(_("A new sample block was generated."));
        }, 200);
    };

    _saveSample() {
        this.__save();
    };

    _get_save_lock() {
        return this._save_lock;
    };

    init() {
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

        logo.synth.loadSynth(0, getVoiceSynthName(SampleWidget.DEFAULTSAMPLE));

        if (this._intervalID != null) {
            clearInterval(this._intervalID);
        }

        // const w = window.innerWidth;

        const widgetWindow = window.widgetWindows.windowFor(this, "sample");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        // For the button callbacks


        widgetWindow.onclose = () => {
            if (this._intervalID != null) {
                clearInterval(this._intervalID);
            }
            this.destroy();
        };

        this.playBtn = widgetWindow.addButton("play-button.svg", SampleWidget.ICONSIZE, _("Play"));
        this.playBtn.onclick = () => {
            if (this.isMoving) {
                this.pause();
                this.playBtn.innerHTML =
                    '<img src="header-icons/play-button.svg" title="' +
                    _("Play") +
                    '" alt="' +
                    _("Play") +
                    '" height="' +
                    SampleWidget.ICONSIZE +
                    '" width="' +
                    SampleWidget.ICONSIZE +
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
            SampleWidget.ICONSIZE,
            _("Upload sample"),
            ""
        ).onclick = () => {
            const fileChooser = docById("myOpenAll");

            const __readerAction = () => {
                window.scroll(0, 0);
                const sampleFile = fileChooser.files[0];
                const reader = new FileReader;
                reader.readAsDataURL(sampleFile);

                reader.onload = () => {
                    const rawLog = reader.result;
                    this.sampleData = rawLog;
                    this.sampleName = fileChooser.files[0].name;
                    this._addSample();
                    this._draw();
                };

                reader.onloadend = () => {
                    if (reader.result) {
                        // const value = [fileChooser.files[0].name, reader.result];
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
            SampleWidget.ICONSIZE,
            _("Save sample"),
            ""
        ).onclick = () => {
            // Debounce button
            if (!this._get_save_lock()) {
                this._save_lock = true;
                this._saveSample();
                setTimeout( () => {
                    this._save_lock = false;
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
            this._widgetFirstTimes.push(logo.firstNoteTime);

            r1 = this.bodyTable.insertRow();
            r2 = this.bodyTable.insertRow();
            r3 = this.bodyTable.insertRow();

            widgetWindow.addButton(
                "up.svg",
                SampleWidget.ICONSIZE,
                _("pitch up"),
                r1.insertCell()
            ).onclick = ((i) => () => this.pitchUp(i))(i);

            this.pitchInput = widgetWindow.addInputButton(this.pitchCenter, r2.insertCell());
            this._usePitch(this.pitchInput.value);

            widgetWindow.addButton(
                "down.svg",
                SampleWidget.ICONSIZE,
                _("pitch down"),
                r3.insertCell()
            ).onclick = ((i) => () => this.pitchDown(i))(i);


            widgetWindow.addButton(
                "up.svg",
                SampleWidget.ICONSIZE,
                _("accidental up"),
                r1.insertCell()
            ).onclick = ((i) => () => this.accidentalUp(i))(i);

            this.accidentalInput  = widgetWindow.addInputButton(this.accidentalCenter, r2.insertCell());
            this._useAccidental(this.accidentalInput.value);

            widgetWindow.addButton(
                "down.svg",
                SampleWidget.ICONSIZE,
                _("accidental down"),
                r3.insertCell()
            ).onclick = ((i) => () => this.accidentalDown(i))(i);

            widgetWindow.addButton(
                "up.svg",
                SampleWidget.ICONSIZE,
                _("octave up"),
                r1.insertCell()
            ).onclick = ((i) => () => this.octaveUp(i))(i);

            this.octaveInput = widgetWindow.addInputButton(this.octaveCenter, r2.insertCell());
            this._useOctave(this.octaveInput.value);

            widgetWindow.addButton(
                "down.svg",
                SampleWidget.ICONSIZE,
                _("octave down"),
                r3.insertCell()
            ).onclick = ((i) => () => this.octaveDown(i))(i);

            this.sampleCanvas = document.createElement("canvas");
            this.sampleCanvas.style.width = SampleWidget.SAMPLEWIDTH + "px";
            this.sampleCanvas.style.height = SampleWidget.SAMPLEHEIGHT + "px";
            this.sampleCanvas.style.margin = "1px";
            this.sampleCanvas.style.background = "rgba(255, 255, 255, 1)";
            vCell = r1.insertCell();
            vCell.appendChild(this.sampleCanvas);
            vCell.setAttribute("rowspan", "3");

            this.pitchInput.addEventListener(
                "keyup",
                ((id) => (e) => {
                    if (e.keyCode === 13) {
                        // console.log("use pitch");
                        this._usePitch(id);
                    }
                })
            );
        }

        this._parseSamplePitch();

        this.setTimbre();

        logo.textMsg(_("Upload a sample and adjust its pitch center."));
        this._draw();
        this.pause();

        widgetWindow.sendToCenter();
    };

    _addSample() {
        for (let i=0; i < CUSTOMSAMPLES.length; i++) {
            if (CUSTOMSAMPLES[i][0] == this.sampleName) {
                return;
            }
        }
        CUSTOMSAMPLES.push([this.sampleName, this.sampleData]);
    }

    _parseSamplePitch() {

        const first_part = this.samplePitch.substring(0,2);
        if (first_part === "so") {
            this.pitchCenter = 4;
        } else {
            this.pitchCenter = SampleWidget.SOLFEGENAMES.indexOf(first_part);
        }
        this.pitchInput.value = SampleWidget.SOLFEGENAMES[this.pitchCenter];

        const sol = this.samplePitch;

        let lev;
        if (sol.indexOf(SHARP) != -1) {
            lev = 1;
        } else if (sol.indexOf(FLAT) != -1) {
            lev = -1;
        } else if (sol.indexOf(DOUBLEFLAT) != -1) {
            lev = -2;
        } else if (sol.indexOf(DOUBLESHARP) != -1) {
            lev = 2;
        } else {
            lev = 0;
        }
        this.accidentalCenter = lev + 2;
        this.accidentalInput.value = SampleWidget.ACCIDENTALNAMES[this.accidentalCenter];

        this.octaveCenter = this.sampleOctave;
        this.octaveInput.value = this.sampleOctave;

    }

    _updateSamplePitchValues() {
        this.samplePitch =
        SampleWidget.SOLFEGENAMES[this.pitchCenter] +
        SampleWidget.EXPORTACCIDENTALNAMES[this.accidentalCenter];
        this.sampleOctave = this.octaveCenter.toString();
    }


    setTimbre() {
        this.originalSampleName = this.sampleName + "_original";
        const sampleArray = [this.originalSampleName, this.sampleData, "la", 4];
        Singer.ToneActions.setTimbre(sampleArray, 0, this.timbreBlock);
    }

    _playReferencePitch() {

        this._usePitch(this.pitchInput.value);
        this._useAccidental(this.accidentalInput.value);
        this._useOctave(this.octaveInput.value);

        this._updateSamplePitchValues();
        this._updateBlocks();


        let finalCenter = 0;

        finalCenter += isNaN(this.octaveCenter)     ? 0 : this.octaveCenter*12;
        finalCenter += isNaN(this.pitchCenter)      ? 0 : SampleWidget.MAJORSCALE[this.pitchCenter];
        finalCenter += isNaN(this.accidentalCenter) ? 0 : this.accidentalCenter-2;


        const netChange = finalCenter-57;
        const reffinalpitch = Math.floor(440 * Math.pow(2, netChange/12));

        logo.synth.trigger(
            0,
            [reffinalpitch],
            0.5,
            SampleWidget.REFERENCESAMPLE,
            null,
            null,
            false);

        this.setTimbre();
        this._playDelayedSample();
    }

    _playSample() {
        if (this.sampleName != null && this.sampleName != "") {

            const finalpitch = SampleWidget.CENTERPITCHHERTZ;

            logo.synth.trigger(
                0,
                [finalpitch],
                this.sampleLength/1000.0,
                "customsample_" + this.originalSampleName,
                null,
                null,
                false);
        }
    }

    _waitAndPlaySample() {
        return new Promise(resolve => {
            setTimeout(() => {
                this._playSample();
                resolve("played");
                this._endPlaying();
            }, SampleWidget.SAMPLEWAITTIME);
        });
    }

    async _playDelayedSample() {
        await this._waitAndPlaySample();
    }

    _waitAndEndPlaying() {
        return new Promise(resolve => {
            setTimeout(() => {
                this.pause();
                resolve("ended");
            }, this.sampleLength);
        });
    }

    async _endPlaying() {
        await this._waitAndEndPlaying();
    }
}
