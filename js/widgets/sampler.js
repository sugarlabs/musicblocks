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
   global

   _, docById, DOUBLEFLAT, FLAT, NATURAL, SHARP, DOUBLESHARP,
   CUSTOMSAMPLES, wheelnav, getVoiceSynthName, Singer, DRUMS, Tone,
   instruments, slicePath, platformColor
*/

/* exported SampleWidget */

function SampleWidget() {
    const ICONSIZE = 32;
    const SAMPLEWIDTH = 800;
    const SAMPLEHEIGHT = 400;
    // Don't include natural when construcing the note name...
    const EXPORTACCIDENTALNAMES = [DOUBLEFLAT, FLAT, "", SHARP, DOUBLESHARP];
    // ...but display it in the selector.
    const ACCIDENTALNAMES = [DOUBLEFLAT, FLAT, NATURAL, SHARP, DOUBLESHARP];
    const SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti", "do"];
    const PITCHNAMES = ["C", "D", "E", "F", "G", "A", "B"];
    const MAJORSCALE = [0, 2, 4, 5, 7, 9, 11];
    const REFERENCESAMPLE = "electronic synth";
    const DEFAULTSAMPLE = "electronic synth";
    const CENTERPITCHHERTZ = 220;
    const SAMPLEWAITTIME = 500;

    // Oscilloscope constants
    const SAMPLEANALYSERSIZE = 8192;
    const SAMPLEOSCCOLORS = ["#3030FF", "#FF3050"];

    this.timbreBlock;
    this.sampleArray;
    this.sampleData = "";
    this.sampleName = DEFAULTSAMPLE;
    this.samplePitch = "sol";
    this.sampleOctave = "4";
    this.pitchCenter = 9;
    this.accidentalCenter = 2;
    this.octaveCenter = 4;
    this.sampleLength = 1000;
    this.pitchAnalysers = {};

    this._updateBlocks = () => {
        let mainSampleBlock;
        let audiofileBlock;
        let solfegeBlock;
        let octaveBlock;
        this.sampleArray = [this.sampleName, this.sampleData, this.samplePitch, this.sampleOctave];
        if (this.timbreBlock != null) {
            mainSampleBlock = this.activity.blocks.blockList[this.timbreBlock].connections[1];
            if (mainSampleBlock != null) {
                this.activity.blocks.blockList[mainSampleBlock].value = this.sampleArray;
                this.activity.blocks.blockList[mainSampleBlock].updateCache();
                audiofileBlock = this.activity.blocks.blockList[mainSampleBlock].connections[1];
                solfegeBlock = this.activity.blocks.blockList[mainSampleBlock].connections[2];
                octaveBlock = this.activity.blocks.blockList[mainSampleBlock].connections[3];
                if (audiofileBlock != null) {
                    this.activity.blocks.blockList[audiofileBlock].value = [
                        this.sampleName,
                        this.sampleData
                    ];
                    this.activity.blocks.blockList[audiofileBlock].text.text = this.sampleName;
                    this.activity.blocks.blockList[audiofileBlock].updateCache();
                }
                if (solfegeBlock != null) {
                    this.activity.blocks.blockList[solfegeBlock].value = this.samplePitch;
                    this.activity.blocks.blockList[solfegeBlock].text.text = this.samplePitch;
                    this.activity.blocks.blockList[solfegeBlock].updateCache();
                }
                if (octaveBlock != null) {
                    this.activity.blocks.blockList[octaveBlock].value = this.sampleOctave;
                    this.activity.blocks.blockList[octaveBlock].text.text = this.sampleOctave;
                    this.activity.blocks.blockList[octaveBlock].updateCache();
                }

                this.activity.refreshCanvas();
                this.activity.saveLocally();
            }
        }
    };

    this.pause = () => {
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

    this.resume = () => {
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

    this._usePitch = (p) => {
        const number = SOLFEGENAMES.indexOf(p);
        this.pitchCenter = number == -1 ? 0 : number;
    };

    this._useAccidental = (a) => {
        const number = ACCIDENTALNAMES.indexOf(a);
        this.accidentalCenter = number === -1 ? 2 : number;
    };

    this._useOctave = (o) => {
        this.octaveCenter = parseInt(o);
    };

    this.getSampleLength = () => {
        if (this.sampleData.length > 1333333) {
            this.activity.errorMsg(_("Warning: Sample is bigger than 1MB."), this.timbreBlock);
        }
    };

    this.showSampleTypeError = () => {
            this.activity.errorMsg(_("Upload failed: Sample is not a .wav file."), this.timbreBlock);
    };

    this.__save = () => {
        var that = this;
        setTimeout(() => {
            that._addSample();

            var newStack = [
                [
                    0,
                    ["customsample", { value: [that.sampleName, that.sampleData, "do", 4] }],
                    100,
                    100,
                    [null, 1, 2, 3]
                ],
                [1, ["audiofile", { value: [that.sampleName, that.sampleData] }], 0, 0, [0]],
                [2, ["solfege", { value: that.samplePitch }], 0, 0, [0]],
                [3, ["number", { value: that.sampleOctave }], 0, 0, [0]]
            ];

            that.activity.blocks.loadNewBlocks(newStack);
            that.activity.textMsg(_("A new sample block was generated."));
        }, 1000);
    };

    this._saveSample = () => {
        this.__save();
    };

    this._get_save_lock = () => {
        return this._save_lock;
    };

    this.init = (activity) => {
        this.activity = activity;
        this._directions = [];
        this._widgetFirstTimes = [];
        this._widgetNextTimes = [];
        this._firstClickTimes = null;
        this.isMoving = false;
        this.pitchAnalysers = {};

        this.activity.logo.synth.loadSynth(0, getVoiceSynthName(DEFAULTSAMPLE));
        this.reconnectSynthsToAnalyser();

        this.pitchAnalysers = {};

        this.running = true;
        if (this.drawVisualIDs) {
            for (const id of Object.keys(this.drawVisualIDs)) {
                cancelAnimationFrame(this.drawVisualIDs[id]);
            }
        }

        this.drawVisualIDs = {};
        const widgetWindow = window.widgetWindows.windowFor(this, "sample");
        this.widgetWindow = widgetWindow;
        this.divisions = [];
        widgetWindow.clear();
        widgetWindow.show();

        // For the button callbacks
        var that = this;

        widgetWindow.onclose = () => {
            if (this.drawVisualIDs) {
                for (const id of Object.keys(this.drawVisualIDs)) {
                    cancelAnimationFrame(this.drawVisualIDs[id]);
                }
            }

            this.running = false;

            docById("wheelDivptm").style.display = "none";
            if (!this.pitchWheel === undefined) {
                this._pitchWheel.removeWheel();
                this._exitWheel.removeWheel();
                this._accidentalsWheel.removeWheel();
                this._octavesWheel.removeWheel();
            }
            this.pitchAnalysers = {};
            widgetWindow.destroy();
        };

        widgetWindow.onmaximize = this._scale.bind(this);

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
        ).onclick = () => {
            const fileChooser = docById("myOpenAll");

            // eslint-disable-next-line no-unused-vars
            const __readerAction = (event) => {
                window.scroll(0, 0);
                const sampleFile = fileChooser.files[0];
                const reader = new FileReader();
                reader.readAsDataURL(sampleFile);

                // eslint-disable-next-line no-unused-vars
                reader.onload = (event) => {
                    // if the file is of .wav type, save it
                    if (reader.result.substring(reader.result.indexOf(":")+1, reader.result.indexOf(";")) === 'audio/wav') {
                        that.sampleData = reader.result;
                        that.sampleName = fileChooser.files[0].name;
                        that._addSample();
                        that.getSampleLength();
                    }
                    // otherwise, output error message
                    else {
                        that.showSampleTypeError();
                    }
                };

                reader.onloadend = () => {
                    if (reader.result) {
                        // eslint-disable-next-line no-unused-vars
                        const value = [fileChooser.files[0].name, reader.result];
                    }
                };
                fileChooser.removeEventListener("change", __readerAction);
            };

            fileChooser.addEventListener("change", __readerAction, false);
            fileChooser.focus();
            fileChooser.click();
            window.scroll(0, 0);
        };

        this.pitchBtn = widgetWindow.addInputButton("C4", "");
        this.pitchBtn.onclick = () => {
            this._createPieMenu();
        };

        this._save_lock = false;
        widgetWindow.addButton(
            "export-chunk.svg",
            ICONSIZE,
            _("Save sample"),
            ""
        ).onclick = () => {
            // Debounce button
            if (!that._get_save_lock()) {
                that._save_lock = true;
                that._saveSample();
                setTimeout(() => {
                    that._save_lock = false;
                }, 1000);
            }
        };

        widgetWindow.sendToCenter();
        this.widgetWindow = widgetWindow;

        this._scale();

        this._parseSamplePitch();
        this.getPitchName();

        this.setTimbre();

        this.activity.textMsg(_("Upload a sample and adjust its pitch center."));
        this.pause();

        widgetWindow.sendToCenter();
    };

    this._addSample = () => {
        for (let i = 0; i < CUSTOMSAMPLES.length; i++) {
            if (CUSTOMSAMPLES[i][0] == this.sampleName) {
                return;
            }
        }
        CUSTOMSAMPLES.push([this.sampleName, this.sampleData]);
    };

    this._parseSamplePitch = () => {
        const first_part = this.samplePitch.substring(0, 2);
        if (first_part === "so") {
            this.pitchCenter = 4;
        } else {
            this.pitchCenter = SOLFEGENAMES.indexOf(first_part);
        }

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
        this.octaveCenter = this.sampleOctave;
    };

    this._updateSamplePitchValues = () => {
        this.samplePitch =
            SOLFEGENAMES[this.pitchCenter] + EXPORTACCIDENTALNAMES[this.accidentalCenter];
        this.sampleOctave = this.octaveCenter.toString();
    };

    this.setTimbre = () => {
        if (this.sampleName != null && this.sampleName != "") {
            this.originalSampleName = this.sampleName + "_original";
            const sampleArray = [this.originalSampleName, this.sampleData, "la", 4];
            Singer.ToneActions.setTimbre(sampleArray, 0, this.timbreBlock);
        }
    };

    this._playReferencePitch = () => {
        this._updateSamplePitchValues();
        this._updateBlocks();

        let finalCenter = 0;

        finalCenter += isNaN(this.octaveCenter) ? 0 : this.octaveCenter * 12;
        finalCenter += isNaN(this.pitchCenter) ? 0 : MAJORSCALE[this.pitchCenter];
        finalCenter += isNaN(this.accidentalCenter) ? 0 : this.accidentalCenter - 2;

        const netChange = finalCenter - 57;
        const reffinalpitch = Math.floor(440 * Math.pow(2, netChange / 12));

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

    this._playSample = () => {
        if (this.sampleName != null && this.sampleName != "") {
            this.reconnectSynthsToAnalyser();

            this.activity.logo.synth.trigger(
                0,
                [CENTERPITCHHERTZ],
                this.sampleLength / 1000.0,
                "customsample_" + this.originalSampleName,
                null,
                null,
                false
            );
        }
    };

    this._waitAndPlaySample = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                this._playSample();
                resolve("played");
                this._endPlaying();
            }, SAMPLEWAITTIME);
        });
    };

    this._playDelayedSample = async () => {
        await this._waitAndPlaySample();
    };

    this._waitAndEndPlaying = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.pause();
                resolve("ended");
            }, this.sampleLength);
        });
    };

    this._endPlaying = async () => {
        await this._waitAndEndPlaying();
    };

    this.reconnectSynthsToAnalyser = () => {
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

    this._createPieMenu = () => {
        docById("wheelDivptm").style.display = "";

        const accidentals = ["𝄪", "♯", "♮", "♭", "𝄫"];
        const noteLabels = ["ti", "la", "sol", "fa", "mi", "re", "do"];
        const drumLabels = [];
        let label;
        for (let i = 0; i < DRUMS.length; i++) {
            label = _(DRUMS[i]);
            drumLabels.push(label);
        }

        this._pitchWheel = new wheelnav("wheelDivptm", null, 600, 600);
        this._exitWheel = new wheelnav("_exitWheel", this._pitchWheel.raphael);

        this._accidentalsWheel = new wheelnav("_accidentalsWheel", this._pitchWheel.raphael);
        this._octavesWheel = new wheelnav("_octavesWheel", this._pitchWheel.raphael);

        wheelnav.cssMode = true;

        this._pitchWheel.keynavigateEnabled = false;
        this._pitchWheel.slicePathFunction = slicePath().DonutSlice;
        this._pitchWheel.slicePathCustom = slicePath().DonutSliceCustomization();

        this._pitchWheel.colors = platformColor.pitchWheelcolors;
        this._pitchWheel.slicePathCustom.minRadiusPercent = 0.2;
        this._pitchWheel.slicePathCustom.maxRadiusPercent = 0.5;

        this._pitchWheel.sliceSelectedPathCustom = this._pitchWheel.slicePathCustom;
        this._pitchWheel.sliceInitPathCustom = this._pitchWheel.slicePathCustom;

        this._pitchWheel.animatetime = 0; // 300;
        this._pitchWheel.createWheel(noteLabels);

        this._exitWheel.colors = platformColor.exitWheelcolors;
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(["×", " "]);

        this._accidentalsWheel.colors = platformColor.accidentalsWheelcolors;
        this._accidentalsWheel.slicePathFunction = slicePath().DonutSlice;
        this._accidentalsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._accidentalsWheel.slicePathCustom.minRadiusPercent = 0.5;
        this._accidentalsWheel.slicePathCustom.maxRadiusPercent = 0.75;
        this._accidentalsWheel.sliceSelectedPathCustom = this._accidentalsWheel.slicePathCustom;
        this._accidentalsWheel.sliceInitPathCustom = this._accidentalsWheel.slicePathCustom;

        const accidentalLabels = [];
        for (let i = 0; i < accidentals.length; i++) {
            accidentalLabels.push(accidentals[i]);
        }

        for (let i = 0; i < 9; i++) {
            accidentalLabels.push(null);
            this._accidentalsWheel.colors.push(platformColor.accidentalsWheelcolorspush);
        }

        this._accidentalsWheel.animatetime = 0; // 300;
        this._accidentalsWheel.createWheel(accidentalLabels);
        this._accidentalsWheel.setTooltips([
            _("double sharp"),
            _("sharp"),
            _("natural"),
            _("flat"),
            _("double flat")
        ]);

        this._octavesWheel.colors = platformColor.octavesWheelcolors;
        this._octavesWheel.slicePathFunction = slicePath().DonutSlice;
        this._octavesWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._octavesWheel.slicePathCustom.minRadiusPercent = 0.75;
        this._octavesWheel.slicePathCustom.maxRadiusPercent = 0.95;
        this._octavesWheel.sliceSelectedPathCustom = this._octavesWheel.slicePathCustom;
        this._octavesWheel.sliceInitPathCustom = this._octavesWheel.slicePathCustom;
        const octaveLabels = [
            "8",
            "7",
            "6",
            "5",
            "4",
            "3",
            "2",
            "1",
            null,
            null,
            null,
            null,
            null,
            null
        ];
        this._octavesWheel.animatetime = 0; // 300;
        this._octavesWheel.createWheel(octaveLabels);

        const x = this.pitchBtn.getBoundingClientRect().x;
        const y = this.pitchBtn.getBoundingClientRect().y;

        docById("wheelDivptm").style.position = "absolute";
        docById("wheelDivptm").style.height = "300px";
        docById("wheelDivptm").style.width = "300px";
        docById("wheelDivptm").style.left =
            Math.min(
                this.activity.canvas.width - 200,
                Math.max(0, x * this.activity.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                this.activity.canvas.height - 250,
                Math.max(0, y * this.activity.getStageScale())
            ) + "px";

        const octaveValue = this.octaveCenter;
        const accidentalsValue = 4 - this.accidentalCenter;
        const noteValue = 6 - this.pitchCenter;

        this._accidentalsWheel.navigateWheel(accidentalsValue);
        this._octavesWheel.navigateWheel(octaveLabels.indexOf(octaveValue.toString()));
        this._pitchWheel.navigateWheel(noteValue);

        this._exitWheel.navItems[0].navigateFunction = () => {
            docById("wheelDivptm").style.display = "none";
            this._pitchWheel.removeWheel();
            this._exitWheel.removeWheel();
            this._accidentalsWheel.removeWheel();
            this._octavesWheel.removeWheel();
        };

        const __selectionChanged = () => {
            const label = this._pitchWheel.navItems[this._pitchWheel.selectedNavItemIndex].title;
            const attr = this._accidentalsWheel.navItems[
                this._accidentalsWheel.selectedNavItemIndex
            ].title;
            const octave = Number(
                this._octavesWheel.navItems[this._octavesWheel.selectedNavItemIndex].title
            );

            this._usePitch(label);
            this._useAccidental(attr);
            this._useOctave(octave);

            this.getPitchName();
        };

        const __pitchPreview = () => {
            __selectionChanged();
            this._playReferencePitch();
        };

        for (let i = 0; i < noteLabels.length; i++) {
            this._pitchWheel.navItems[i].navigateFunction = __pitchPreview;
        }

        for (let i = 0; i < accidentals.length; i++) {
            this._accidentalsWheel.navItems[i].navigateFunction = __pitchPreview;
        }

        for (let i = 0; i < 8; i++) {
            this._octavesWheel.navItems[i].navigateFunction = __pitchPreview;
        }
    };

    this.getPitchName = () => {
        let name = "";
        name = PITCHNAMES[this.pitchCenter];
        name += EXPORTACCIDENTALNAMES[this.accidentalCenter];
        name += this.octaveCenter.toString();
        this.pitchName = name;

        this.pitchBtn.value = this.pitchName;
    };

    this._scale = () => {
        let width, height;
        const canvas = document.getElementsByClassName("samplerCanvas");
        Array.prototype.forEach.call(canvas, (ele) => {
            this.widgetWindow.getWidgetBody().removeChild(ele);
        });
        if (!this.widgetWindow.isMaximized()) {
            width = SAMPLEWIDTH;
            height = SAMPLEHEIGHT;
        } else {
            width = this.widgetWindow.getWidgetBody().getBoundingClientRect().width;
            height = this.widgetWindow.getWidgetFrame().getBoundingClientRect().height - 70;
        }
        document.getElementsByTagName("canvas")[0].innerHTML = "";
        this.makeCanvas(width, height, 0, true);
        this.reconnectSynthsToAnalyser();
    };

    this.makeCanvas = (width, height, turtleIdx, resized) => {
        const canvas = document.createElement("canvas");
        canvas.height = height;
        canvas.width = width;
        canvas.className = "samplerCanvas";
        this.widgetWindow.getWidgetBody().appendChild(canvas);
        const canvasCtx = canvas.getContext("2d");
        canvasCtx.clearRect(0, 0, width, height);

        const draw = () => {
            this.drawVisualIDs[turtleIdx] = requestAnimationFrame(draw);
            if (this.pitchAnalysers[turtleIdx] && (this.running || resized)) {
                canvasCtx.fillStyle = "#FFFFFF";
                canvasCtx.font = "10px Verdana";
                this.verticalOffset = -canvas.height / 4;
                this.zoomFactor = 40.0;
                canvasCtx.fillRect(0, 0, width, height);

                let oscText;
                if (turtleIdx > 0) {
                    //.TRANS: The sound sample that the user uploads.
                    oscText = this.sampleName != "" ? this.sampleName : _("sample");
                }
                canvasCtx.fillStyle = "#000000";
                //.TRANS: The reference tone is a sound used for comparison.
                canvasCtx.fillText(_("reference tone"), 10, 10);
                canvasCtx.fillText(oscText, 10, canvas.height / 2 + 10);

                for (let turtleIdx = 0; turtleIdx < 2; turtleIdx += 1) {
                    const dataArray = this.pitchAnalysers[turtleIdx].getValue();
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
            }
        };
        draw();
    };
}
