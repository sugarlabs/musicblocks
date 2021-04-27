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
    const SAMPLEWIDTH = 800;
    const SAMPLEHEIGHT = 400;
    const EXPORTACCIDENTALNAMES = [DOUBLEFLAT, FLAT, "", SHARP, DOUBLESHARP];  // Don't include natural when construcing the note name;
    const ACCIDENTALNAMES = [DOUBLEFLAT, FLAT, NATURAL, SHARP, DOUBLESHARP]; // but display it in the selector.
    const SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti", "do"];
    const PITCHNAMES = ["C", "D", "E", "F", "G", "A", "B"];
    const MAJORSCALE = [0, 2, 4, 5, 7, 9, 11];
    const DEFAULTACCIDENTAL = "";
    const DEFAULTSOLFEGE = "do";
    const REFERENCESAMPLE = "electronic synth";
    const DEFAULTSAMPLE = "electronic synth";
    const CENTERPITCHHERTZ = 220;
    const MAXOCTAVE = 10;
    const SAMPLEWAITTIME = 500;

    //Oscilloscope constants
    const SAMPLEINTERVAL = 5;
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
    this.sampleLength = 1000
    this.pitchAnalysers = {};

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
    }

    this._usePitch = function (p) {
        let number = SOLFEGENAMES.indexOf(p);
        this.pitchCenter = (number==-1) ? 0 : number;
    }

    this._useAccidental = function (a) {
        let number = ACCIDENTALNAMES.indexOf(a);
        this.accidentalCenter = (number==-1) ? 2 : number;
    }

    this._useOctave = function (o) {
        this.octaveCenter = parseInt(o);
    }

    this.getSampleLength = function() {
        let str = this.sampleData;
        let base64encoded = str.substring(str.indexOf(",") + 1);
        let audiofile =  new Uint32Array(Uint8Array.from(window.atob(base64encoded)).buffer);
        let length = audiofile.length;
        if (this.sampleData.length > 1333333) {
            this._logo.errorMsg(_("Warning: Sample is bigger than 1MB."), this.timbreBlock);
        }
    }

    /*
    this._draw = function() {

      let turtle = turtles[0];
      const canvas = this.sampleCanvas;
      const rect = this.widgetWindow._frame.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      // Updating the canvas width and height
      // every frame can cause the window to gradually shrink or grow.
      if (canvas.width < w - 100) {
          canvas.width = w - 100
      }
      if (canvas.height < h - 100) {
          canvas.height = h - 100
      }
      const canvasCtx = canvas.getContext("2d");
      canvasCtx.clearRect(0, 0, w, h);
      const numOfOscs = 2;

      const drawOscilloscope = () => {

          canvasCtx.fillStyle = "#FFFFFF";
          canvasCtx.font = "10px Verdana";
          canvasCtx.fillRect(0, 0, w, h);
          canvasCtx.lineWidth = 2;
          for (let turtleIdx in [0, 1]) {
              const dataArray = this.pitchAnalysers[turtleIdx].getValue();
              const bufferLength = dataArray.length;
              const rbga = SAMPLEOSCCOLORS[turtleIdx];
              canvasCtx.strokeStyle = rbga;
              canvasCtx.beginPath();
              const sliceWidth = (w) / bufferLength;
              let x = 0;
              let verticalOffset = (turtleIdx-0.5) * ((numOfOscs-1)/2) * h;

              for (let i = 0; i < bufferLength; i++) {
                  const y = (h / 2) * (1 - dataArray[i]) + verticalOffset;
                  if (i === 0) {
                      canvasCtx.moveTo(x, y);
                  } else {
                      canvasCtx.lineTo(x, y);
                  }
                  x += sliceWidth;
              }
              canvasCtx.lineTo(w, h / 2 + verticalOffset);
              canvasCtx.stroke();
              //.TRANS: A sound with the pitch that the sample is set to.
              let oscText = "Reference tone";
              if (turtleIdx > 0) {
                  //.TRANS: The sound sample that the user uploads.
                  oscText = (this.sampleName != "")? this.sampleName : "Sample";
              }
              canvasCtx.fillStyle = "#000000";
              canvasCtx.fillText(oscText, 10, (turtleIdx) * ((numOfOscs-1)/2) * h + 10);
          }
      };
      drawOscilloscope();
    }
    */

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
        this.isMoving = false;
        this.pitchAnalysers = {};

        this._logo.synth.loadSynth(0, getVoiceSynthName(DEFAULTSAMPLE));
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
            if (!this.pitchWheel === undefined){
                this._pitchWheel.removeWheel();
                this._exitWheel.removeWheel();
                this._accidentalsWheel.removeWheel();
                this._octavesWheel.removeWheel();
            }
            this.pitchAnalysers = {};
            widgetWindow.destroy();
        };

        widgetWindow.onmaximize = this._scale.bind(this);

        //document.getElementsByClassName("wfbToolbar")[0].style.backgroundColor = "#e8e8e8";
        //document.getElementsByClassName("wfbWidget")[0].style.backgroundColor = "#FFFFFF";

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
            let fileChooser = docById("myOpenAll");

            let __readerAction = function(event) {
                window.scroll(0, 0);
                var sampleFile = fileChooser.files[0];
                var reader = new FileReader;
                reader.readAsDataURL(sampleFile);

                reader.onload = function(e) {
                    var rawLog = reader.result;
                    that.sampleData = rawLog;
                    that.sampleName = fileChooser.files[0].name;
                    that._addSample();
                    that.getSampleLength();
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
        }

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

        widgetWindow.sendToCenter();
        this.widgetWindow = widgetWindow;

        this._scale();

        this._parseSamplePitch();
        this.getPitchName();

        this.setTimbre();

        this._logo.textMsg(_("Upload a sample and adjust its pitch center."));
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
    }

    this._parseSamplePitch = function () {

        let first_part = this.samplePitch.substring(0,2);
        if (first_part === "so") {
            this.pitchCenter = 4;
        } else {
            this.pitchCenter = SOLFEGENAMES.indexOf(first_part);
        }
        //this.pitchInput.value = SOLFEGENAMES[this.pitchCenter];

        let sol = this.samplePitch;

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
            lev = 2
        } else {
            attr = "";
            lev = 0
        }
        this.accidentalCenter = lev + 2;
        //this.accidentalInput.value = ACCIDENTALNAMES[this.accidentalCenter];

        this.octaveCenter = this.sampleOctave;
        //this.octaveInput.value = this.sampleOctave;

    }

    this._updateSamplePitchValues = function () {
        this.samplePitch =
            SOLFEGENAMES[this.pitchCenter] +
            EXPORTACCIDENTALNAMES[this.accidentalCenter];
        this.sampleOctave = this.octaveCenter.toString();
    }


    this.setTimbre = function () {
        if (this.sampleName != null && this.sampleName != "") {
            this.originalSampleName = this.sampleName + "_original";
            let sampleArray = [this.originalSampleName, this.sampleData, "la", 4];
            Singer.ToneActions.setTimbre(sampleArray, 0, this.timbreBlock);
        }
    }

    this._playReferencePitch = function() {

        this._updateSamplePitchValues();
        this._updateBlocks();

        let finalCenter = 0;

        finalCenter += isNaN(this.octaveCenter)     ? 0 : this.octaveCenter*12;
        finalCenter += isNaN(this.pitchCenter)      ? 0 : MAJORSCALE[this.pitchCenter];
        finalCenter += isNaN(this.accidentalCenter) ? 0 : this.accidentalCenter-2;

        let netChange = finalCenter-57;
        let reffinalpitch = Math.floor(440 * Math.pow(2, netChange/12));

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
    }

    this._playSample = function () {
        if (this.sampleName != null && this.sampleName != "") {

            this.reconnectSynthsToAnalyser();

            let finalpitch = CENTERPITCHHERTZ;

            this._logo.synth.trigger(
                0,
                [finalpitch],
                this.sampleLength/1000.0,
                "customsample_" + this.originalSampleName,
                null,
                null,
                false);
        }
    }

    this._waitAndPlaySample = function () {
        return new Promise(resolve => {
            setTimeout(() => {
                this._playSample();
                resolve('played');
                this._endPlaying();
            }, SAMPLEWAITTIME);
        });
    }

    this._playDelayedSample = async function () {
        const result = await this._waitAndPlaySample();
    }

    this._waitAndEndPlaying = function () {
        return new Promise(resolve => {
            setTimeout(() => {
                this.pause();
                resolve('ended');
            }, this.sampleLength);
        });
    }

    this._endPlaying = async function () {
        const result = await this._waitAndEndPlaying();
    }

    this.reconnectSynthsToAnalyser = function () {

        //Make two pitchAnalysers for the ref tone and the sample.
        for (let instrument in [0,1]) {
            if (this.pitchAnalysers[instrument] === undefined) {
                this.pitchAnalysers[instrument] = new Tone.Analyser({
                    type: "waveform",
                    size: SAMPLEANALYSERSIZE
                });
            }
        }

        //Connect instruments. Ref tone connects with the first pitchAnalyser.
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

    this._createPieMenu = function () {
        docById("wheelDivptm").style.display = "";

        const accidentals = ["𝄪", "♯", "♮", "♭", "𝄫"];
        let noteLabels = ["ti", "la", "sol", "fa", "mi", "re", "do"];
        const drumLabels = [];
        let label;
        for (let i = 0; i < DRUMS.length; i++) {
            label = _(DRUMS[i]);
            drumLabels.push(label);
        }

        let categories;
        const colors = [];

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

        const accidentalLabels = [];
        let octaveLabels = [];
        let block, noteValue, octaveValue, accidentalsValue;

        this._accidentalsWheel.colors = platformColor.accidentalsWheelcolors;
        this._accidentalsWheel.slicePathFunction = slicePath().DonutSlice;
        this._accidentalsWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._accidentalsWheel.slicePathCustom.minRadiusPercent = 0.5;
        this._accidentalsWheel.slicePathCustom.maxRadiusPercent = 0.75;
        this._accidentalsWheel.sliceSelectedPathCustom = this._accidentalsWheel.slicePathCustom;
        this._accidentalsWheel.sliceInitPathCustom = this._accidentalsWheel.slicePathCustom;

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
        octaveLabels = [
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
                logo.blocks.turtles._canvas.width - 200,
                Math.max(0, x * logo.blocks.getStageScale())
            ) + "px";
        docById("wheelDivptm").style.top =
            Math.min(
                logo.blocks.turtles._canvas.height - 250,
                Math.max(0, y * logo.blocks.getStageScale())
            ) + "px";


        octaveValue = this.octaveCenter;
        accidentalsValue = 2;
        accidentalsValue = 4 - this.accidentalCenter;
        noteValue = 6 - this.pitchCenter;

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
            let label = this._pitchWheel.navItems[this._pitchWheel.selectedNavItemIndex].title;
            let attr;
            let octave;

            attr = this._accidentalsWheel.navItems[this._accidentalsWheel.selectedNavItemIndex].title;


            octave = Number(
                this._octavesWheel.navItems[this._octavesWheel.selectedNavItemIndex].title
            );

            this._usePitch(label);
            this._useAccidental(attr);
            this._useOctave(octave);

            this.getPitchName();

        };

        const __pitchPreview = () => {
          /*
            let label = this._pitchWheel.navItems[this._pitchWheel.selectedNavItemIndex].title;
            let timeout = 0;
            let attr, octave, obj, tur;
            attr = this._accidentalsWheel.navItems[this._accidentalsWheel.selectedNavItemIndex]
                .title;
            if (attr !== "♮") {
                label += attr;
            }
            octave = Number(
                this._octavesWheel.navItems[this._octavesWheel.selectedNavItemIndex].title
            );
            obj = getNote(
                label,
                octave,
                0,
                turtles.ithTurtle(0).singer.keySignature,
                false,
                null,
                logo.errorMsg,
                logo.synth.inTemperament
            );
            obj[0] = obj[0].replace(SHARP, "#").replace(FLAT, "b");
            logo.synth.setMasterVolume(PREVIEWVOLUME);
            Singer.setSynthVolume(logo, 0, DEFAULTVOICE, PREVIEWVOLUME);
            logo.synth.trigger(0, [obj[0] + obj[1]], 1 / 4, DEFAULTVOICE, null, null);
            */
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

    }

    this.getPitchName = function () {
        let name = "";
        name = PITCHNAMES[this.pitchCenter];
        name += EXPORTACCIDENTALNAMES[this.accidentalCenter];
        name += this.octaveCenter.toString();
        this.pitchName = name;

        this.pitchBtn.value = this.pitchName;
    }

    this._scale = function () {
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
    }

    this.makeCanvas = function(width, height, turtleIdx, resized) {
        const turtle = 0;
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

                let oscText = "Sample";
                if (turtleIdx > 0) {
                    //.TRANS: The sound sample that the user uploads.
                    oscText = (this.sampleName != "")? this.sampleName : "Sample";
                }
                canvasCtx.fillStyle = "#000000";
                canvasCtx.fillText("Reference tone", 10, 10);
                canvasCtx.fillText(oscText, 10, (canvas.height / 2) + 10);

                for (let turtleIdx = 0; turtleIdx < 2; turtleIdx+= 1) {
                    const dataArray = this.pitchAnalysers[turtleIdx].getValue();
                    const bufferLength = dataArray.length;
                    canvasCtx.lineWidth = 2;
                    const rbga = SAMPLEOSCCOLORS[turtleIdx];
                    canvasCtx.strokeStyle = rbga;
                    canvasCtx.beginPath();
                    const sliceWidth = (width * this.zoomFactor) / bufferLength;
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
                    this.verticalOffset = canvas.height / 4
                }
            }
        };
        draw();
    };
}
