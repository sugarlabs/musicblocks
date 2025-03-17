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
/**
 * Represents a Sample Widget.
 * @constructor
 */
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
    
    /**
     * Reference to the timbre block.
     * @type {number | null}
     */
    this.timbreBlock;

    /**
     * Array to store sample-related data.
     * @type {Array}
     */
    this.sampleArray;

    /**
     * String representing sample data.
     * @type {string}
     */
    this.sampleData = "";

    /**
     * Name of the sample.
     * @type {string}
     */
    this.sampleName = DEFAULTSAMPLE;

    /**
     * Pitch of the sample.
     * @type {string}
     */
    this.samplePitch = "sol";

    /**
     * Octave of the sample.
     * @type {string}
     */
    this.sampleOctave = "4";

    /**
     * Pitch center.
     * @type {number}
     */
    this.pitchCenter = 9;

    /**
     * Accidental center.
     * @type {number}
     */
    this.accidentalCenter = 2;

    /**
     * Octave center.
     * @type {number}
     */
    this.octaveCenter = 4;

     /**
     * Sample length.
     * @type {number}
     */
    this.sampleLength = 1000;

    /**
     * Pitch analyzers.
     * @type {object}
     */
    this.pitchAnalysers = {};

    /**
     * Updates the blocks related to the sample.
     * @private
     * @returns {void}
     */
    this._updateBlocks = function () {
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
    
    /**
     * Pauses the sample playback.
     * @returns {void}
     */
    this.pause = function () {
        this.playBtn.innerHTML =
            `<img 
                src="header-icons/play-button.svg" 
                title="${_("Play")}" 
                alt="${_("Play")}" 
                height="${ICONSIZE}" 
                width="${ICONSIZE}" 
                vertical-align="middle"
            >`;
        this.isMoving = false;
    };

    /**
     * Resumes the sample playback.
     * @returns {void}
     */
    this.resume = function () {
        this.playBtn.innerHTML =
            `<img 
                src="header-icons/pause-button.svg" 
                title="${_("Pause")}" 
                alt="${_("Pause")}" 
                height="${ICONSIZE}" 
                width="${ICONSIZE}" 
                vertical-align="middle"
            >`;
        this.isMoving = true;
    };

    /**
     * Sets the pitch center for the sample.
     * @param {string} p - The pitch to set as the center.
     * @returns {void}
     */
    this._usePitch = function (p) {
        const number = SOLFEGENAMES.indexOf(p);
        this.pitchCenter = number == -1 ? 0 : number;
    };

    /**
     * Sets the accidental center for the sample.
     * @param {string} a - The accidental to set as the center.
     * @returns {void}
     */
    this._useAccidental = function (a) {
        const number = ACCIDENTALNAMES.indexOf(a);
        this.accidentalCenter = number === -1 ? 2 : number;
    };

    /**
     * Sets the octave center for the sample.
     * @param {string} o - The octave to set as the center.
     * @returns {void}
     */
    this._useOctave = function (o) {
        this.octaveCenter = parseInt(o);
    };


     /**
     * Gets the length of the sample and displays a warning if it exceeds 1MB.
     * @returns {void}
     */
    this.getSampleLength = function () {
        if (this.sampleData.length > 1333333) {
            this.activity.errorMsg(_("Warning: Sample is bigger than 1MB."), this.timbreBlock);
        }
    };


     /**
     * Displays a message indicating that recording has started.
     * @returns {void}
     */
    this.displayRecordingStartMessage = function () {
        activity.textMsg(_("Recording started"), 3000);
    }

    /**
     * Displays a message indicating that recording has stopped.
     * @returns {void}
     */
    this.displayRecordingStopMessage = function () {
        activity.textMsg(_("Recording complete"), 3000);
    }


    /**
     * Displays an error message when the uploaded sample is not a .wav file.
     * @returns {void}
     */
    this.showSampleTypeError = function () {
        this.activity.errorMsg(_("Upload failed: Sample is not a .wav file."), this.timbreBlock);
    };

    /**
     * Saves the sample and generates a new sample block with the provided data.
     * @private
     * @returns {void}
     */
    this.__save = function () {
        var that = this;
        setTimeout(function () {
            that._addSample();

            var newStack = [
                [0,"settimbre",100,100,[null,1,null,5]],
                [
                    1,
                    ["customsample", { value: [that.sampleName, that.sampleData, "do", 4] }],
                    100,
                    100,
                    [0, 2, 3, 4]
                ],
                [2, ["audiofile", { value: [that.sampleName, that.sampleData] }], 0, 0, [1]],
                [3, ["solfege", { value: that.samplePitch }], 0, 0, [1]],
                [4, ["number", { value: that.sampleOctave }], 0, 0, [1]],
                [5,"hidden",0,0,[0,null]]
            ];

            that.activity.blocks.loadNewBlocks(newStack);
            activity.textMsg(_("A new sample block was generated."), 3000);
        }, 1000);
    };

    /**
     * Saves the sample.
     * @private
     * @returns {void}
     */
    this._saveSample = function () {
        this.__save();
    };

    /**
     * Gets the status of the save lock.
     * @private
     * @returns {boolean} The status of the save lock.
     */
    this._get_save_lock = function () {
        return this._save_lock;
    };

    //To handle sample files
    this.handleFiles = (sampleFile) => {
        const reader = new FileReader();
        reader.readAsDataURL(sampleFile);

        reader.onload = () => {
            // if the file is of .wav type, save it
            if (reader.result.substring(reader.result.indexOf(":") + 1, reader.result.indexOf(";")) === "audio/wav") {
                if (reader.result.length <= 1333333) {
                    this.sampleData = reader.result;
                    this.sampleName = sampleFile.name;
                    this._addSample();
                } else {
                    this.activity.errorMsg(_("Warning: Your sample cannot be loaded because it is >1MB."), this.timbreBlock);
                }            
            } else {
                this.showSampleTypeError();
            }
        }

        reader.onloadend = () => {
            if (reader.result) {
                const value = [sampleFile.name, reader.result];
            }
        };
    }

    //Drag-and-Drop sample files
    this.drag_and_drop = () => {
        const dropZone = document.getElementsByClassName("samplerCanvas")[0];

        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        dropZone.addEventListener( "drop", (e) => {
            e.preventDefault();
            const sampleFiles = e.dataTransfer.files[0];
            this.handleFiles(sampleFiles);
        });
    }

    /**
     * Initializes the Sample Widget.
     * @param {object} activity - The activity object.
     * @returns {void}
     */
    this.init = function (activity) {
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
            } else {
                if (!(this.sampleName == "")) {
                    this.resume();
                }
                this._playReferencePitch();
            }
        };

        widgetWindow.addButton(
            "load-media.svg",
            ICONSIZE,
            _("Upload sample"),
            ""
        ).onclick = function () {
            const fileChooser = docById("myOpenAll");

            // eslint-disable-next-line no-unused-vars
            const __readerAction = function (event) {
                window.scroll(0, 0);
                const sampleFile = fileChooser.files[0];
                that.handleFiles(sampleFile);
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
        ).onclick = function () {
            // Debounce button
            if (!that._get_save_lock()) {
                that._save_lock = true;
                that._saveSample();
                setTimeout(function () {
                    that._save_lock = false;
                }, 1000);
            }
        };

        this._recordBtn = widgetWindow.addButton(
            "mic.svg",
            ICONSIZE,
            _("Toggle Mic"),
            ""
        );

        this._playbackBtn = widgetWindow.addButton(
            "playback.svg",
            ICONSIZE,
            _("Playback"),
            ""
        );

        this._tunerBtn = widgetWindow.addButton(
            "tuner.svg",
            ICONSIZE,
            _("Tuner"),
            ""
        )

        this._playbackBtn.id="playbackBtn";
        this._playbackBtn.classList.add("disabled");
        
        this.is_recording = false;
        this.playback = false;

        this._recordBtn.onclick = async () => {
            if (!this.is_recording) {
                await this.activity.logo.synth.startRecording();
                this.is_recording = true;
                this._recordBtn.getElementsByTagName('img')[0].src = "header-icons/record.svg";
                this.displayRecordingStartMessage();
                this.activity.logo.synth.LiveWaveForm();
            } else {
                this.recordingURL = await this.activity.logo.synth.stopRecording();
                this.is_recording = false;
                this._recordBtn.getElementsByTagName('img')[0].src = "header-icons/mic.svg";
                this.displayRecordingStopMessage();
                this._playbackBtn.classList.remove("disabled");
            }
        };

        this._playbackBtn.onclick = () => {
            if (!this.playback) {
                this.sampleData = this.recordingURL;
                this.sampleName = `Recorded Audio ${this.recordingURL}`;
                this._addSample();
                this.activity.logo.synth.playRecording();
                this.playback = true
            } else {
                this.activity.logo.synth.stopPlayBackRecording();
                this.playback = false;
            }
        };

        this._tunerBtn.onclick = () => {
            const samplerCanvas = docByClass("samplerCanvas")[0];
            samplerCanvas.style.display = "none";

            const tunerContainer = document.createElement("div");
            tunerContainer.style.display = "flex";
            tunerContainer.style.flexDirection = "column"
            tunerContainer.style.alignItems = "center";

            const tunerSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            tunerSvg.style.width = 350 + "px"
            tunerSvg.style.height = 170 + "px"

            tunerContainer.appendChild(tunerSvg)

            const tuner1 = document.createElementNS("http://www.w3.org/2000/svg", "path")
            tuner1.setAttribute("d", "M5.0064 173.531C2.24508 173.507 0.0184649 171.249 0.121197 168.49C0.579513 156.179 2.33654 143.951 5.36299 132.009C6.04138 129.332 8.81378 127.792 11.4701 128.546L57.9638 141.754C60.6202 142.508 62.1508 145.271 61.5107 147.958C59.8652 154.863 58.8534 161.905 58.488 168.995C58.3459 171.752 56.0992 173.973 53.3379 173.949L5.0064 173.531Z")
            tuner1.setAttribute("fill", "#a50e0e")

            tunerSvg.appendChild(tuner1)

            const tuner2 = document.createElementNS("http://www.w3.org/2000/svg", "path")
            tuner2.setAttribute("d", "M12.3057 125.699C9.66293 124.899 8.16276 122.104 9.03876 119.486C12.9468 107.802 18.0776 96.5645 24.3458 85.959C25.7508 83.5817 28.8448 82.885 31.181 84.3574L72.0707 110.128C74.4068 111.601 75.0971 114.683 73.7261 117.08C70.2017 123.243 67.2471 129.714 64.8991 136.414C63.9858 139.02 61.2047 140.517 58.5619 139.716L12.3057 125.699Z")
            tuner2.setAttribute("fill", "#d93025")

            tunerSvg.appendChild(tuner2)

            const tuner3 = document.createElementNS("http://www.w3.org/2000/svg", "path")
            tuner3.setAttribute("d", "M32.7848 81.8612C30.4747 80.3483 29.8225 77.2446 31.4008 74.9787C38.442 64.8698 46.5309 55.5326 55.5331 47.1225C57.551 45.2374 60.7159 45.4406 62.5426 47.5115L94.5158 83.7582C96.3425 85.8291 96.1364 88.981 94.1457 90.8948C89.0279 95.8148 84.3698 101.192 80.2295 106.958C78.619 109.202 75.5286 109.855 73.2186 108.342L32.7848 81.8612Z")
            tuner3.setAttribute("fill", "#e37400")

            tunerSvg.appendChild(tuner3)

            const tuner4 = document.createElementNS("http://www.w3.org/2000/svg", "path")
            tuner4.setAttribute("d", "M64.7847 45.5682C62.9944 43.4658 63.243 40.3041 65.3958 38.5746C74.9997 30.8588 85.3915 24.1786 96.3984 18.6454C98.8656 17.4051 101.845 18.4917 103.014 20.9933L123.481 64.7795C124.65 67.2812 123.564 70.2473 121.115 71.5228C114.819 74.8016 108.834 78.6484 103.237 83.0152C101.06 84.7138 97.9107 84.4699 96.1204 82.3675L64.7847 45.5682Z")
            tuner4.setAttribute("fill", "#f29900")

            tunerSvg.appendChild(tuner4)

            const tuner5 = document.createElementNS("http://www.w3.org/2000/svg", "path")
            tuner5.setAttribute("d", "M105.713 19.7604C104.588 17.2388 105.717 14.2752 108.27 13.2222C119.658 8.52459 131.511 5.04268 143.631 2.83441C146.348 2.33942 148.9 4.22142 149.318 6.95115L156.62 54.7298C157.037 57.4595 155.159 59.9997 152.45 60.5334C145.485 61.9056 138.659 63.9106 132.058 66.5236C129.491 67.54 126.538 66.4188 125.412 63.8972L105.713 19.7604Z")
            tuner5.setAttribute("fill", "#fbbc04")

            tunerSvg.appendChild(tuner5)

            const tuner6 = document.createElementNS("http://www.w3.org/2000/svg", "path")
            tuner6.setAttribute("d", "M152.254 6.52852C151.885 3.79193 153.803 1.26651 156.549 0.975363C168.8 -0.323498 181.154 -0.325115 193.405 0.97054C196.151 1.26096 198.07 3.78589 197.701 6.52258L191.247 54.423C190.878 57.1597 188.361 59.0681 185.611 58.8169C178.542 58.1712 171.428 58.1722 164.358 58.8197C161.608 59.0716 159.091 57.1639 158.721 54.4273L152.254 6.52852Z")
            tuner6.setAttribute("fill", "#008000")

            tunerSvg.appendChild(tuner6)

            const tuner7 = document.createElementNS("http://www.w3.org/2000/svg", "path")
            tuner7.setAttribute("d", "M200.638 6.94443C201.055 4.21459 203.607 2.33193 206.324 2.82621C218.444 5.0313 230.298 8.51011 241.688 13.2047C244.241 14.257 245.371 17.2203 244.246 19.7423L224.559 63.8842C223.434 66.4062 220.481 67.5281 217.913 66.5124C211.312 63.9011 204.486 61.8978 197.52 60.5275C194.811 59.9945 192.933 57.4548 193.349 54.7249L200.638 6.94443Z")
            tuner7.setAttribute("fill", "#fbbc04")

            tunerSvg.appendChild(tuner7)

            const tuner8 = document.createElementNS("http://www.w3.org/2000/svg", "path")
            tuner8.setAttribute("d", "M246.945 20.9745C248.114 18.4725 251.093 17.3851 253.561 18.6248C264.569 24.1552 274.963 30.8326 284.569 38.5459C286.722 40.2748 286.971 43.4365 285.181 45.5394L253.855 82.3468C252.066 84.4497 248.916 84.6944 246.739 82.9964C241.14 78.6311 235.155 74.7859 228.858 71.5087C226.408 70.2339 225.322 67.268 226.49 64.766L246.945 20.9745Z")
            tuner8.setAttribute("fill", "#f29900")

            tunerSvg.appendChild(tuner8)

            const tuner9 = document.createElementNS("http://www.w3.org/2000/svg", "path")
            tuner9.setAttribute("d", "M287.424 47.482C289.25 45.4107 292.415 45.2066 294.433 47.0913C303.438 55.499 311.529 64.8341 318.573 74.9411C320.152 77.2066 319.501 80.3105 317.191 81.824L276.764 108.315C274.454 109.829 271.364 109.176 269.753 106.934C265.611 101.168 260.951 95.7923 255.832 90.8736C253.841 88.9604 253.634 85.8085 255.46 83.7371L287.424 47.482Z")
            tuner9.setAttribute("fill", "#e37400")

            tunerSvg.appendChild(tuner9)

            const tuner10 = document.createElementNS("http://www.w3.org/2000/svg", "path")
            tuner10.setAttribute("d", "M318.795 84.3198C321.131 82.8468 324.225 83.5427 325.631 85.9196C331.902 96.5235 337.036 107.76 340.947 119.442C341.823 122.061 340.324 124.855 337.681 125.657L291.429 139.686C288.786 140.487 286.005 138.991 285.091 136.385C282.741 129.686 279.785 123.215 276.259 117.054C274.887 114.657 275.577 111.574 277.912 110.101L318.795 84.3198Z")
            tuner10.setAttribute("fill", "#d93025")

            tunerSvg.appendChild(tuner10)

            const tuner11 = document.createElementNS("http://www.w3.org/2000/svg", "path")
            tuner11.setAttribute("d", "M338.518 128.503C341.174 127.748 343.947 129.288 344.626 131.964C347.655 143.905 349.416 156.133 349.877 168.444C349.981 171.203 347.755 173.462 344.993 173.487L296.662 173.917C293.901 173.942 291.653 171.722 291.51 168.964C291.143 161.875 290.13 154.833 288.482 147.928C287.841 145.242 289.371 142.478 292.027 141.723L338.518 128.503Z")
            tuner11.setAttribute("fill", "#a50e0e")

            tunerSvg.appendChild(tuner11)

            const startTuningBtn = document.createElement("button")
            startTuningBtn.textContent = "Start Tuning"
            startTuningBtn.style.marginTop = "30px"
            startTuningBtn.style.padding = "5px 7px"
            startTuningBtn.style.cursor = "pointer"

            tunerContainer.appendChild(startTuningBtn)

            this.widgetWindow.getWidgetBody().appendChild(tunerContainer);
        }
    
        widgetWindow.sendToCenter();
        this.widgetWindow = widgetWindow;

        this._scale();

        this._parseSamplePitch();
        this.getPitchName();

        this.setTimbre();

        activity.textMsg(_("Upload a sample and adjust its pitch center."), 3000);
        this.pause();

        widgetWindow.sendToCenter();
        this.drag_and_drop();
    };

    /**
     * Adds the current sample to the list of custom samples.
     * @returns {void}
     */
    this._addSample = function () {
        for (let i = 0; i < CUSTOMSAMPLES.length; i++) {
            if (CUSTOMSAMPLES[i][0] == this.sampleName) {
                return;
            }
        }
        CUSTOMSAMPLES.push([this.sampleName, this.sampleData]);
    };

    /**
     * Parses the sample pitch and sets the pitch, accidental, and octave centers accordingly.
     * @returns {void}
     */
    this._parseSamplePitch = function () {
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

    /**
     * Updates the sample pitch value based on the pitch, accidental, and octave centers.
     * @returns {void}
     */
    this._updateSamplePitchValues = function () {
        this.samplePitch =
            SOLFEGENAMES[this.pitchCenter] + EXPORTACCIDENTALNAMES[this.accidentalCenter];
        this.sampleOctave = this.octaveCenter.toString();
    };

    /**
     * Sets the timbre based on the current sample.
     * @returns {void}
     */
    this.setTimbre = function () {
        if (this.sampleName != null && this.sampleName != "") {
            this.originalSampleName = this.sampleName + "_original";
            const sampleArray = [this.originalSampleName, this.sampleData, "la", 4];
            Singer.ToneActions.setTimbre(sampleArray, 0, this.timbreBlock);
        }
    };

    /**
     * Plays the reference pitch based on the current sample's pitch, accidental, and octave.
     * @returns {void}
     */
    this._playReferencePitch = function () {
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

    /**
     * Plays the current sample.
     * @returns {void}
     */
    this._playSample = function () {
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

    /**
     * Waits for a specified time and then plays the sample.
     * @returns {Promise<string>} A promise that resolves once the sample is played.
     */
    this._waitAndPlaySample = function () {
        return new Promise((resolve) => {
            setTimeout(() => {
                this._playSample();
                resolve("played");
                this._endPlaying();
            }, SAMPLEWAITTIME);
        });
    };

    /**
     * Asynchronously plays the sample after a delay.
     * @returns {Promise<void>} A promise that resolves once the sample is played.
     */
    this._playDelayedSample = async function () {
        await this._waitAndPlaySample();
    };

    /**
     * Waits for the sample to finish playing.
     * @returns {Promise<string>} A promise that resolves once the sample playback ends.
     */
    this._waitAndEndPlaying = function () {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.pause();
                resolve("ended");
            }, this.sampleLength);
        });
    };

    /**
     * Asynchronously ends the sample playback after waiting for its duration.
     * @returns {Promise<void>} A promise that resolves once the sample playback ends.
     */
    this._endPlaying = async function () {
        await this._waitAndEndPlaying();
    };

    /**
     * Reconnects synths to the analyser for pitch analysis.
     * @returns {void}
     */
    this.reconnectSynthsToAnalyser = function () {
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

    /**
     * Creates and initializes the pie menu for selecting pitch, accidentals, and octaves.
     * @returns {void}
     */
    this._createPieMenu = function () {
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

    /**
     * Retrieves the name of the current pitch.
     * @returns {void}
     */
    this.getPitchName = function () {
        let name = "";
        name = PITCHNAMES[this.pitchCenter];
        name += EXPORTACCIDENTALNAMES[this.accidentalCenter];
        name += this.octaveCenter.toString();
        this.pitchName = name;

        this.pitchBtn.value = this.pitchName;
    };

     /**
     * Scales the widget window and canvas based on the window's state.
     * @returns {void}
     */
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

        const draw = () => {
            this.drawVisualIDs[turtleIdx] = requestAnimationFrame(draw);
            if (this.is_recording || (this.pitchAnalysers[turtleIdx] && (this.running || resized))) {
                canvasCtx.fillStyle = "#FFFFFF";
                canvasCtx.font = "10px Verdana";
                this.verticalOffset = -canvas.height / 4;
                this.zoomFactor = 40.0;
                canvasCtx.fillRect(0, 0, width, height);
        
                let oscText;
                if (turtleIdx >= 0) {
                    //.TRANS: The sound sample that the user uploads.
                    oscText = this.sampleName != "" ? this.sampleName : _("sample");
                }
                canvasCtx.fillStyle = "#000000";
                //.TRANS: The reference tone is a sound used for comparison.
                canvasCtx.fillText(_("reference tone"), 10, 10);
                canvasCtx.fillText(oscText, 10, canvas.height / 2 + 10);

                for (let turtleIdx = 0; turtleIdx < 2; turtleIdx += 1) {
                    let dataArray;
                    if (this.is_recording) {
                        dataArray = turtleIdx === 0 
                            ? this.pitchAnalysers[0].getValue()
                            : this.activity.logo.synth.getWaveFormValues();
                            console.log(dataArray);
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
            }
        };
        draw();
    };
}
