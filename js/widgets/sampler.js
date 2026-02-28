// Copyright (c) 2021 Liam Norman
// Copyright (c) 2025 Anvita Prasad DMP'25
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

    // Add tuner related properties
    this.tunerEnabled = false;
    this.tunerAnalyser = null;
    this.tunerMic = null;
    this.tunerCanvas = null;
    this.tunerContext = null;
    this.tunerAnimationFrame = null;
    this.centsValue = 0;
    this.sliderVisible = false;
    this.sliderDiv = null;

    // Manual cent adjustment properties
    this.centAdjustmentWindow = null;
    this.centAdjustmentVisible = false;
    this.centAdjustmentSlider = null;
    this.centAdjustmentValue = 0;
    this.centAdjustmentOn = false;
    this.currentNoteObj = null;
    this.player = null;

    // Pitch detection resource tracking (to prevent memory leaks)
    this.pitchDetectionAudioContext = null;
    this.pitchDetectionStream = null;
    this.pitchDetectionAnimationId = null;
    this.isPitchDetectionRunning = false;

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
        // Include cent adjustment in the sample array
        this.sampleArray = [
            this.sampleName,
            this.sampleData,
            this.samplePitch,
            this.sampleOctave,
            this.centAdjustmentValue || 0
        ];
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

                // Update the block display to show cent adjustment if applicable
                if (this.centAdjustmentValue && this.centAdjustmentValue !== 0) {
                    const centText =
                        (this.centAdjustmentValue > 0 ? "+" : "") + this.centAdjustmentValue + "¢";
                    if (
                        this.activity.blocks.blockList[mainSampleBlock].text &&
                        this.activity.blocks.blockList[mainSampleBlock].text.text
                    ) {
                        // Append cent adjustment to the block text if possible
                        const currentText =
                            this.activity.blocks.blockList[mainSampleBlock].text.text;
                        if (!currentText.includes("¢")) {
                            this.activity.blocks.blockList[mainSampleBlock].text.text +=
                                " " + centText;
                        }
                    }
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
        this.playBtn.innerHTML = `<img 
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
        this.playBtn.innerHTML = `<img 
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
    };

    /**
     * Displays a message indicating that recording has stopped.
     * @returns {void}
     */
    this.displayRecordingStopMessage = function () {
        activity.textMsg(_("Recording complete"), 3000);
    };

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
        const that = this;
        setTimeout(function () {
            that._addSample();

            // Include the cent adjustment value in the sample block
            const centAdjustment = that.centAdjustmentValue || 0;

            const newStack = [
                [0, "settimbre", 100, 100, [null, 1, null, 5]],
                [
                    1,
                    [
                        "customsample",
                        {
                            value: [
                                that.sampleName,
                                that.sampleData,
                                that.samplePitch,
                                that.sampleOctave,
                                centAdjustment
                            ]
                        }
                    ],
                    100,
                    100,
                    [0, 2, 3, 4]
                ],
                [2, ["audiofile", { value: [that.sampleName, that.sampleData] }], 0, 0, [1]],
                [3, ["solfege", { value: that.samplePitch }], 0, 0, [1]],
                [4, ["number", { value: that.sampleOctave }], 0, 0, [1]],
                [5, "hidden", 0, 0, [0, null]]
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
    this.handleFiles = sampleFile => {
        const reader = new FileReader();
        reader.readAsDataURL(sampleFile);

        reader.onload = () => {
            // if the file is of .wav type, save it
            if (
                reader.result.substring(
                    reader.result.indexOf(":") + 1,
                    reader.result.indexOf(";")
                ) === "audio/wav"
            ) {
                if (reader.result.length <= 1333333) {
                    this.sampleData = reader.result;
                    this.sampleName = sampleFile.name;
                    this._addSample();
                } else {
                    this.activity.errorMsg(
                        _("Warning: Your sample cannot be loaded because it is >1MB."),
                        this.timbreBlock
                    );
                }
            } else {
                this.showSampleTypeError();
            }
        };

        reader.onloadend = () => {
            if (reader.result) {
                const value = [sampleFile.name, reader.result];
            }
        };
    };

    //Drag-and-Drop sample files
    this.drag_and_drop = () => {
        const dropZone = document.getElementsByClassName("samplerCanvas")[0];

        dropZone.addEventListener("dragover", e => {
            e.preventDefault();
        });

        dropZone.addEventListener("drop", e => {
            e.preventDefault();
            const sampleFiles = e.dataTransfer.files[0];
            this.handleFiles(sampleFiles);
        });
    };

    /**
     * Initializes the sampler widget.
     * @param {Activity} activity - The activity instance.
     * @param {number} timbreBlock - The timbre block number.
     * @returns {void}
     */
    this.init = function (activity, timbreBlock) {
        this.activity = activity;
        this.timbreBlock = timbreBlock;
        this.running = true;
        this.originalSampleName = "";
        this.isMoving = false;
        this.drawVisualIDs = {};

        const widgetWindow = window.widgetWindows.windowFor(this, "sampler", "Sampler");
        const that = this;

        // For the widget buttons
        widgetWindow.onmaximize = function () {
            that._scale();
            that._updateContainerPositions();
        };

        widgetWindow.onrestore = function () {
            that._scale();
            that._updateContainerPositions();
        };

        // Function to update container positions based on window state
        this._updateContainerPositions = function () {
            const tunerContainer = docById("tunerContainer");
            const centAdjustmentContainer = docById("centAdjustmentContainer");
            const valueDisplay = docById("centValueDisplay");

            if (tunerContainer) {
                if (this.widgetWindow.isMaximized()) {
                    tunerContainer.style.marginTop = "150px";
                    tunerContainer.style.marginLeft = "auto";
                    tunerContainer.style.marginRight = "auto";
                    tunerContainer.style.justifyContent = "center";
                } else {
                    tunerContainer.style.marginTop = "100px";
                    tunerContainer.style.marginLeft = "";
                    tunerContainer.style.marginRight = "";
                    tunerContainer.style.justifyContent = "";
                }
            }

            if (valueDisplay) {
                if (this.widgetWindow.isMaximized()) {
                    valueDisplay.style.marginTop = "50px";
                    valueDisplay.style.marginBottom = "50px";
                } else {
                    valueDisplay.style.marginTop = "30px";
                    valueDisplay.style.marginBottom = "30px";
                }
            }
        };

        widgetWindow.onclose = () => {
            if (this.drawVisualIDs) {
                for (const id of Object.keys(this.drawVisualIDs)) {
                    cancelAnimationFrame(this.drawVisualIDs[id]);
                }
            }

            this.running = false;

            // Stop pitch detection and release resources (microphone, AudioContext)
            this.stopPitchDetection();

            // Close the pie menu if it's open
            const wheelDiv = docById("wheelDiv");
            if (wheelDiv && wheelDiv.style.display !== "none") {
                wheelDiv.style.display = "none";
                if (this._pitchWheel) this._pitchWheel.removeWheel();
                if (this._exitWheel) this._exitWheel.removeWheel();
                if (this._accidentalsWheel) this._accidentalsWheel.removeWheel();
                if (this._octavesWheel) this._octavesWheel.removeWheel();
            }

            docById("wheelDivptm").style.display = "none";
            if (this._pitchWheel !== undefined) {
                this._pitchWheel.removeWheel();
            }
            if (this._exitWheel !== undefined) {
                this._exitWheel.removeWheel();
            }
            if (this._accidentalsWheel !== undefined) {
                this._accidentalsWheel.removeWheel();
            }
            if (this._octavesWheel !== undefined) {
                this._octavesWheel.removeWheel();
            }
            this.pitchAnalysers = {};
            widgetWindow.destroy();
        };

        this.playBtn = widgetWindow.addButton("play-button.svg", ICONSIZE, _("Play"));
        this.playBtn.onclick = () => {
            stopTuner();
            if (this.isMoving) {
                this.pause();
            } else {
                if (!(this.sampleName == "")) {
                    this.resume();
                }
                this._playReferencePitch();
            }
        };

        widgetWindow.addButton("load-media.svg", ICONSIZE, _("Upload sample"), "").onclick =
            function () {
                stopTuner();
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

        // Create a container for the pitch button and frequency display
        this.pitchBtnContainer = document.createElement("div");
        this.pitchBtnContainer.className = "wfbtItem";
        this.pitchBtnContainer.style.display = "flex";
        this.pitchBtnContainer.style.flexDirection = "column";
        this.pitchBtnContainer.style.alignItems = "center";
        this.pitchBtnContainer.style.cursor = "pointer"; // Add pointer cursor to indicate clickable

        // Add the container to the toolbar
        widgetWindow._toolbar.appendChild(this.pitchBtnContainer);

        // Create the pitch button
        this.pitchBtn = document.createElement("input");
        this.pitchBtn.value = "C4";
        this.pitchBtnContainer.appendChild(this.pitchBtn);

        // Create the frequency display
        this.frequencyDisplay = document.createElement("div");
        this.frequencyDisplay.style.fontSize = "smaller";
        this.frequencyDisplay.style.textAlign = "center";
        this.frequencyDisplay.style.color = platformColor.textColor;
        this.frequencyDisplay.textContent = "261 Hz";
        this.pitchBtnContainer.appendChild(this.frequencyDisplay);

        // Add click event to the container (includes both the button and frequency display)
        this.pitchBtnContainer.onclick = () => {
            stopTuner();
            this._createPieMenu();
        };

        this._save_lock = false;
        widgetWindow.addButton("export-chunk.svg", ICONSIZE, _("Save sample"), "").onclick =
            function () {
                stopTuner();
                // Debounce button
                if (!that._get_save_lock()) {
                    that._save_lock = true;
                    that._saveSample();
                    setTimeout(function () {
                        that._save_lock = false;
                    }, 1000);
                }
            };

        this._recordBtn = widgetWindow.addButton("mic.svg", ICONSIZE, _("Toggle Mic"), "");

        this._playbackBtn = widgetWindow.addButton("playback.svg", ICONSIZE, _("Playback"), "");

        this._promptBtn = widgetWindow.addButton("prompt.svg", ICONSIZE, _("Prompt"), "");

        // this._trimBtn = widgetWindow.addButton(
        //     "trim.svg",
        //     ICONSIZE,
        //     _("Trim"),
        //     ""
        // );

        let generating = false;

        this._promptBtn.onclick = () => {
            this.widgetWindow.clearScreen();
            let width, height;
            if (!this.widgetWindow.isMaximized()) {
                width = SAMPLEWIDTH;
                height = SAMPLEHEIGHT;
            } else {
                width = this.widgetWindow.getWidgetBody().getBoundingClientRect().width;
                height = this.widgetWindow.getWidgetFrame().getBoundingClientRect().height - 70;
            }

            const randomDigit = Math.floor(Math.random() * 10);

            const promptList = [
                "Birds chirping in the morning",
                "Rain falling on a window",
                "Waves crashing on some rocks",
                "Cat meowing near a door",
                "Dog barking in a park",
                "Horse galloping in a field",
                "Children laughing at a playground",
                "Footsteps walking on wooden floor",
                "Car honking on the street",
                "Clock ticking in a quiet room"
            ];

            const randomPrompt = promptList[randomDigit];

            const container = document.createElement("div");
            container.id = "samplerPrompt";
            this.widgetWindow.getWidgetBody().appendChild(container);

            container.style.height = height + "px";
            container.style.width = width + "px";
            container.style.display = "flex";
            container.style.flexDirection = "column";
            container.style.alignItems = "center";
            container.style.justifyContent = "center";
            container.style.gap = "20px";

            const h1 = document.createElement("h1");
            h1.innerHTML = "AI Sample Generation";
            h1.style.fontSize = "40px";
            h1.style.marginTop = "0";
            h1.style.marginBottom = "0px";
            h1.style.fontWeight = "200";

            const textArea = document.createElement("textarea");
            textArea.style.height = "200px";
            textArea.style.width = "650px";
            textArea.style.fontSize = "30px";
            textArea.style.resize = "none";
            textArea.style.borderRadius = "10px";
            textArea.style.border = "none";
            textArea.style.padding = "15px";
            textArea.placeholder = randomPrompt;
            textArea.addEventListener("input", function () {
                if (generating) {
                    submit.disabled = true;
                    preview.disabled = true;
                    save.disabled = true;
                } else {
                    submit.disabled = false;
                    preview.disabled = true;
                    save.disabled = true;
                }
            });

            const buttonDiv = document.createElement("div");
            buttonDiv.style.display = "flex";
            buttonDiv.style.justifyContent = "space-between";
            buttonDiv.style.width = "650px";

            const submit = document.createElement("button");
            submit.style.width = "152px";
            submit.style.height = "61px";
            submit.style.fontSize = "32px";
            submit.style.borderRadius = "10px";
            submit.style.border = "none";
            submit.style.cursor = "pointer";
            submit.innerHTML = "Submit";
            submit.onclick = async function () {
                submit.disabled = true;
                const prompt = textArea.value;
                const encodedPrompt = encodeURIComponent(prompt);
                const url = `http://13.61.94.100:8000/generate?prompt=${encodedPrompt}`;

                let blinkInterval;

                try {
                    generating = true;
                    activity.textMsg(_("Generating Audio... (It may take up to 1 minute)"), 2500);

                    blinkInterval = setInterval(() => {
                        activity.textMsg(_("Generating Audio..."), 1000);
                    }, 5000);

                    const response = await fetch(url);
                    const result = await response.json();

                    clearInterval(blinkInterval);

                    if (result.status === "success") {
                        generating = false;
                        activity.textMsg(_("Audio ready!"), 3000);
                        preview.disabled = false;
                        save.disabled = false;
                    } else {
                        generating = false;
                        activity.textMsg(_("Failed to generate audio"), 3000);
                    }
                } catch (error) {
                    generating = false;
                    clearInterval(blinkInterval);
                    activity.textMsg(_("Error occurred"), 3000);
                    submit.disabled = false;
                }
            };

            const preview = document.createElement("button");
            preview.style.width = "152px";
            preview.style.height = "61px";
            preview.style.fontSize = "32px";
            preview.style.borderRadius = "10px";
            preview.style.border = "none";
            preview.style.cursor = "pointer";
            preview.innerHTML = "Preview";
            preview.disabled = true;
            preview.onclick = function () {
                const audioURL = `http://13.61.94.100:8000/preview`;
                const audio = new Audio(audioURL);
                audio.play();
            };

            const save = document.createElement("button");
            save.style.width = "152px";
            save.style.height = "61px";
            save.style.fontSize = "32px";
            save.style.borderRadius = "10px";
            save.style.border = "none";
            save.style.cursor = "pointer";
            save.innerHTML = "Save";
            save.disabled = true;
            save.onclick = function () {
                const audioURL = `http://13.61.94.100:8000/save`;
                const link = document.createElement("a");
                link.href = audioURL;
                link.download = "output.wav";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            };

            buttonDiv.appendChild(submit);
            buttonDiv.appendChild(preview);
            buttonDiv.appendChild(save);

            container.appendChild(h1);
            container.appendChild(textArea);
            container.appendChild(buttonDiv);
        };

        // Commented out the audio trimmer code because it doesn't provide a visual trimming interface.

        // this._trimBtn.onclick = () => {

        //     this.widgetWindow.clearScreen();
        //     let width, height;
        //     if (!this.widgetWindow.isMaximized()) {
        //         width = SAMPLEWIDTH;
        //         height = SAMPLEHEIGHT;
        //     } else {
        //         width = this.widgetWindow.getWidgetBody().getBoundingClientRect().width;
        //         height = this.widgetWindow.getWidgetFrame().getBoundingClientRect().height - 70;
        //     }

        //     const container = document.createElement("div");
        //     container.id = "samplerPrompt";
        //     this.widgetWindow.getWidgetBody().appendChild(container);

        //     container.style.height = height + "px";
        //     container.style.width = width + "px";
        //     container.style.display = "flex";
        //     container.style.flexDirection = "column";
        //     container.style.alignItems = "center";
        //     container.style.justifyContent = "center";
        //     container.style.gap = "20px";

        //     const h1 = document.createElement("h1");
        //     h1.innerHTML = "Audio Trimmer";
        //     h1.style.fontSize = "40px";
        //     h1.style.marginTop = "0";
        //     h1.style.marginBottom = "0px";
        //     h1.style.fontWeight = "200";

        //     const divUploadSample = document.createElement("div");
        //     divUploadSample.style.backgroundColor = "#8cc6ff";
        //     divUploadSample.style.width = "50px";
        //     divUploadSample.style.height = "50px";
        //     divUploadSample.style.display = "flex";
        //     divUploadSample.style.cursor = "pointer";
        //     divUploadSample.style.justifyContent = "center";
        //     divUploadSample.style.alignItems = "center";

        //     const uploadSample = document.createElement("img");
        //     uploadSample.setAttribute("src", "/header-icons/load-media.svg");
        //     uploadSample.style.height = "32px";
        //     uploadSample.style.width = "32px";

        //     divUploadSample.appendChild(uploadSample);

        //     const fileChooser = document.createElement("input");
        //     fileChooser.type = "file";

        //     divUploadSample.onclick = function () {
        //         fileChooser.click();
        //     };

        //     fileChooser.onchange = function () {
        //         const file = fileChooser.files[0];
        //         const audioPlayer = document.createElement("audio");
        //         audioPlayer.controls = true;
        //         const fileURL = URL.createObjectURL(file);
        //         audioPlayer.src = fileURL;
        //         container.replaceChild(audioPlayer, divUploadSample);
        //     };

        //     const inputDiv = document.createElement("div");
        //     inputDiv.style.width = "400px";
        //     inputDiv.style.display = "flex";
        //     inputDiv.style.justifyContent = "space-between";

        //     const fromInputBox = document.createElement("input");
        //     fromInputBox.type = "text";
        //     fromInputBox.title = "Enter start time (in seconds)";
        //     fromInputBox.placeholder = "0.00";
        //     fromInputBox.style.width = "152px";
        //     fromInputBox.style.height = "61px";
        //     fromInputBox.style.backgroundColor = "#FFFFFF";
        //     fromInputBox.style.color = "#766C6C";
        //     fromInputBox.style.fontSize = "32px";
        //     fromInputBox.style.font = "Inter";
        //     fromInputBox.style.borderRadius = "10px"
        //     fromInputBox.style.border = "none"
        //     fromInputBox.style.padding = "8px";
        //     fromInputBox.style.textAlign = "center";
        //     fromInputBox.type = "number";

        //     const toInputBox = document.createElement("input");
        //     toInputBox.type = "text";
        //     toInputBox.title = "Enter end time (in seconds)";
        //     toInputBox.placeholder = "10.00";
        //     toInputBox.style.width = "152px";
        //     toInputBox.style.height = "61px";
        //     toInputBox.style.backgroundColor = "#FFFFFF";
        //     toInputBox.style.color = "#766C6C";
        //     toInputBox.style.fontSize = "32px";
        //     toInputBox.style.font = "Inter";
        //     toInputBox.style.borderRadius = "10px";
        //     toInputBox.style.border = "none";
        //     toInputBox.style.padding = "8px";
        //     toInputBox.style.textAlign = "center";
        //     toInputBox.type = "number";

        //     inputDiv.appendChild(fromInputBox);
        //     inputDiv.appendChild(toInputBox);

        //     const buttonDiv = document.createElement("div");
        //     buttonDiv.style.width = "400px";
        //     buttonDiv.style.display = "flex";
        //     buttonDiv.style.justifyContent = "space-between";

        //     const preview = document.createElement("button");
        //     preview.style.width = "152px";
        //     preview.style.height = "61px";
        //     preview.style.fontSize = "32px";
        //     preview.style.borderRadius = "10px";
        //     preview.style.border = "none";
        //     preview.style.cursor = "pointer";
        //     preview.innerHTML = "Preview";

        //     preview.onclick = async function() {
        //         const from = fromInputBox.value
        //         const to = toInputBox.value
        //         const audioURL = `http://13.61.94.100:8000/trim-preview?start=${from}&end=${to}`;
        //         const audio = new Audio(audioURL);
        //         audio.play();
        //         save.disabled = false;
        //     };

        //     const save = document.createElement("button");
        //     save.style.width = "152px";
        //     save.style.height = "61px";
        //     save.style.fontSize = "32px";
        //     save.style.borderRadius = "10px";
        //     save.style.border = "none";
        //     save.style.cursor = "pointer";
        //     save.innerHTML = "Save";
        //     save.disabled = true;
        //     save.onclick = function (){
        //         const audioURL = `http://13.61.94.100:8000/trim-save`;
        //         const link = document.createElement('a');
        //         link.href = audioURL;
        //         link.download = 'trimmed-output.wav';
        //         document.body.appendChild(link);
        //         link.click();
        //         document.body.removeChild(link);
        //     };

        //     buttonDiv.appendChild(preview);
        //     buttonDiv.appendChild(save);

        //     container.appendChild(h1);
        //     container.appendChild(divUploadSample);
        //     container.appendChild(inputDiv);
        //     container.appendChild(buttonDiv);
        // };

        this._playbackBtn.id = "playbackBtn";
        this._playbackBtn.classList.add("disabled");

        this.is_recording = false;
        this.playback = false;

        this._recordBtn.onclick = async () => {
            stopTuner();
            if (!this.is_recording) {
                await this.activity.logo.synth.startRecording();
                this.is_recording = true;
                this._recordBtn.getElementsByTagName("img")[0].src = "header-icons/record.svg";
                this.displayRecordingStartMessage();
                this.activity.logo.synth.LiveWaveForm();
            } else {
                this.recordingURL = await this.activity.logo.synth.stopRecording();
                this.is_recording = false;
                this._recordBtn.getElementsByTagName("img")[0].src = "header-icons/mic.svg";
                this.displayRecordingStopMessage();
                this._playbackBtn.classList.remove("disabled");
            }
        };

        this._playbackBtn.onclick = () => {
            stopTuner();
            if (!this.playback) {
                this.sampleData = this.recordingURL;
                this.sampleName = `Recorded Audio ${this.recordingURL}`;
                this._addSample();
                this.activity.logo.synth.playRecording();
                this.playback = true;
            } else {
                this.activity.logo.synth.stopPlayBackRecording();
                this.playback = false;
            }
        };

        this._tunerBtn = widgetWindow.addButton("tuner.svg", ICONSIZE, _("Tuner"), "");

        let tunerOn = false;

        // Helper function to stop tuner
        const stopTuner = () => {
            if (tunerOn) {
                activity.textMsg(_("Tuner stopped"), 3000);
                this.activity.logo.synth.stopTuner();
                tunerOn = false;
                const tunerContainer = docById("tunerContainer");
                if (tunerContainer) {
                    tunerContainer.remove();
                }
            }
        };

        this._tunerBtn.onclick = async () => {
            if (docById("tunerContainer") && !tunerOn) {
                docById("tunerContainer").remove();
            }

            // Close the cent adjustment window if it's open
            const centAdjustmentContainer = docById("centAdjustmentContainer");
            if (centAdjustmentContainer) {
                centAdjustmentContainer.remove();
                this.centAdjustmentOn = false;
            }

            if (!tunerOn) {
                tunerOn = true;

                const samplerCanvas = docByClass("samplerCanvas")[0];
                samplerCanvas.style.display = "none";

                const tunerContainer = document.createElement("div");
                tunerContainer.style.display = "flex";
                tunerContainer.id = "tunerContainer";
                tunerContainer.style.gap = "10px";

                // Adjust positioning based on whether the window is maximized
                if (this.widgetWindow.isMaximized()) {
                    tunerContainer.style.marginTop = "150px";
                    tunerContainer.style.marginLeft = "auto";
                    tunerContainer.style.marginRight = "auto";
                    tunerContainer.style.justifyContent = "center";
                } else {
                    tunerContainer.style.marginTop = "100px";
                }

                const accidetalFlat = document.createElement("img");
                accidetalFlat.setAttribute("src", "header-icons/accidental-flat.svg");
                accidetalFlat.style.height = 40 + "px";
                accidetalFlat.style.width = 40 + "px";
                accidetalFlat.style.marginTop = "auto";

                tunerContainer.appendChild(accidetalFlat);

                const tunerSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                tunerSvg.style.width = 350 + "px";
                tunerSvg.style.height = 170 + "px";

                tunerContainer.appendChild(tunerSvg);

                const sharpSymbol = document.createElement("img");
                sharpSymbol.setAttribute("src", "header-icons/accidental-sharp.svg");
                sharpSymbol.style.height = 40 + "px";
                sharpSymbol.style.width = 40 + "px";
                sharpSymbol.style.marginTop = "auto";

                tunerContainer.appendChild(sharpSymbol);

                // Add tuner segments
                const segments = [
                    "M5.0064 173.531C2.24508 173.507 0.0184649 171.249 0.121197 168.49C0.579513 156.179 2.33654 143.951 5.36299 132.009C6.04138 129.332 8.81378 127.792 11.4701 128.546L57.9638 141.754C60.6202 142.508 62.1508 145.271 61.5107 147.958C59.8652 154.863 58.8534 161.905 58.488 168.995C58.3459 171.752 56.0992 173.973 53.3379 173.949L5.0064 173.531Z",
                    "M12.3057 125.699C9.66293 124.899 8.16276 122.104 9.03876 119.486C12.9468 107.802 18.0776 96.5645 24.3458 85.959C25.7508 83.5817 28.8448 82.885 31.181 84.3574L72.0707 110.128C74.4068 111.601 75.0971 114.683 73.7261 117.08C70.2017 123.243 67.2471 129.714 64.8991 136.414C63.9858 139.02 61.2047 140.517 58.5619 139.716L12.3057 125.699Z",
                    "M32.7848 81.8612C30.4747 80.3483 29.8225 77.2446 31.4008 74.9787C38.442 64.8698 46.5309 55.5326 55.5331 47.1225C57.551 45.2374 60.7159 45.4406 62.5426 47.5115L94.5158 83.7582C96.3425 85.8291 96.1364 88.981 94.1457 90.8948C89.0279 95.8148 84.3698 101.192 80.2295 106.958C78.619 109.202 75.5286 109.855 73.2186 108.342L32.7848 81.8612Z",
                    "M64.7847 45.5682C62.9944 43.4658 63.243 40.3041 65.3958 38.5746C74.9997 30.8588 85.3915 24.1786 96.3984 18.6454C98.8656 17.4051 101.845 18.4917 103.014 20.9933L123.481 64.7795C124.65 67.2812 123.564 70.2473 121.115 71.5228C114.819 74.8016 108.834 78.6484 103.237 83.0152C101.06 84.7138 97.9107 84.4699 96.1204 82.3675L64.7847 45.5682Z",
                    "M105.713 19.7604C104.588 17.2388 105.717 14.2752 108.27 13.2222C119.658 8.52459 131.511 5.04268 143.631 2.83441C146.348 2.33942 148.9 4.22142 149.318 6.95115L156.62 54.7298C157.037 57.4595 155.159 59.9997 152.45 60.5334C145.485 61.9056 138.659 63.9106 132.058 66.5236C129.491 67.54 126.538 66.4188 125.412 63.8972L105.713 19.7604Z",
                    "M152.254 6.52852C151.885 3.79193 153.803 1.26651 156.549 0.975363C168.8 -0.323498 181.154 -0.325115 193.405 0.97054C196.151 1.26096 198.07 3.78589 197.701 6.52258L191.247 54.423C190.878 57.1597 188.361 59.0681 185.611 58.8169C178.542 58.1712 171.428 58.1722 164.358 58.8197C161.608 59.0716 159.091 57.1639 158.721 54.4273L152.254 6.52852Z",
                    "M200.638 6.94443C201.055 4.21459 203.607 2.33193 206.324 2.82621C218.444 5.0313 230.298 8.51011 241.688 13.2047C244.241 14.257 245.371 17.2203 244.246 19.7423L224.559 63.8842C223.434 66.4062 220.481 67.5281 217.913 66.5124C211.312 63.9011 204.486 61.8978 197.52 60.5275C194.811 59.9945 192.933 57.4548 193.349 54.7249L200.638 6.94443Z",
                    "M246.945 20.9745C248.114 18.4725 251.093 17.3851 253.561 18.6248C264.569 24.1552 274.963 30.8326 284.569 38.5459C286.722 40.2748 286.971 43.4365 285.181 45.5394L253.855 82.3468C252.066 84.4497 248.916 84.6944 246.739 82.9964C241.14 78.6311 235.155 74.7859 228.858 71.5087C226.408 70.2339 225.322 67.268 226.49 64.766L246.945 20.9745Z",
                    "M287.424 47.482C289.25 45.4107 292.415 45.2066 294.433 47.0913C303.438 55.499 311.529 64.8341 318.573 74.9411C320.152 77.2066 319.501 80.3105 317.191 81.824L276.764 108.315C274.454 109.829 271.364 109.176 269.753 106.934C265.611 101.168 260.951 95.7923 255.832 90.8736C253.841 88.9604 253.634 85.8085 255.46 83.7371L287.424 47.482Z",
                    "M318.795 84.3198C321.131 82.8468 324.225 83.5427 325.631 85.9196C331.902 96.5235 337.036 107.76 340.947 119.442C341.823 122.061 340.324 124.855 337.681 125.657L291.429 139.686C288.786 140.487 286.005 138.991 285.091 136.385C282.741 129.686 279.785 123.215 276.259 117.054C274.887 114.657 275.577 111.574 277.912 110.101L318.795 84.3198Z",
                    "M338.518 128.503C341.174 127.748 343.947 129.288 344.626 131.964C347.655 143.905 349.416 156.133 349.877 168.444C349.981 171.203 347.755 173.462 344.993 173.487L296.662 173.917C293.901 173.942 291.653 171.722 291.51 168.964C291.143 161.875 290.13 154.833 288.482 147.928C287.841 145.242 289.371 142.478 292.027 141.723L338.518 128.503Z"
                ];

                segments.forEach((d, i) => {
                    const segment = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    segment.setAttribute("d", d);
                    segment.setAttribute("fill", "#808080");
                    tunerSvg.appendChild(segment);
                });

                // Create mode toggle button
                const modeToggle = document.createElement("div");
                modeToggle.id = "modeToggle";
                modeToggle.style.position = "absolute";
                modeToggle.style.top = "30px";
                modeToggle.style.left = "50%";
                modeToggle.style.transform = "translateX(-50%)";
                modeToggle.style.display = "flex";
                modeToggle.style.backgroundColor = "#FFFFFF";
                modeToggle.style.borderRadius = "25px";
                modeToggle.style.padding = "3px";
                modeToggle.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                modeToggle.style.width = "120px";
                modeToggle.style.height = "44px";
                modeToggle.style.cursor = "pointer";

                // Create chromatic mode button
                const chromaticButton = document.createElement("div");
                chromaticButton.style.flex = "1";
                chromaticButton.style.display = "flex";
                chromaticButton.style.alignItems = "center";
                chromaticButton.style.justifyContent = "center";
                chromaticButton.style.borderRadius = "22px";
                chromaticButton.style.cursor = "pointer";
                chromaticButton.style.transition = "all 0.2s ease";
                chromaticButton.style.userSelect = "none";
                chromaticButton.title = _("Chromatic");

                // Create target pitch mode button
                const targetPitchButton = document.createElement("div");
                targetPitchButton.style.flex = "1";
                targetPitchButton.style.display = "flex";
                targetPitchButton.style.alignItems = "center";
                targetPitchButton.style.justifyContent = "center";
                targetPitchButton.style.borderRadius = "22px";
                targetPitchButton.style.cursor = "pointer";
                targetPitchButton.style.transition = "all 0.2s ease";
                targetPitchButton.style.userSelect = "none";
                targetPitchButton.title = _("Target pitch");

                // Create icons
                const chromaticIcon = document.createElement("img");
                chromaticIcon.src = "header-icons/chromatic-mode.svg";
                chromaticIcon.style.width = "32px";
                chromaticIcon.style.height = "32px";
                chromaticIcon.style.filter = "brightness(0)";
                chromaticIcon.style.pointerEvents = "none";

                const targetIcon = document.createElement("img");
                targetIcon.src = "header-icons/target-pitch-mode.svg";
                targetIcon.style.width = "32px";
                targetIcon.style.height = "32px";
                targetIcon.style.filter = "brightness(0)";
                targetIcon.style.pointerEvents = "none";

                // Initial mode state
                let tunerMode = "chromatic";

                // Function to update button styles
                const updateButtonStyles = () => {
                    if (tunerMode === "chromatic") {
                        chromaticButton.style.backgroundColor = "#A6CEFF";
                        targetPitchButton.style.backgroundColor = "#FFFFFF";
                    } else {
                        chromaticButton.style.backgroundColor = "#FFFFFF";
                        targetPitchButton.style.backgroundColor = "#A6CEFF";
                    }
                };

                // Add click handlers with debounce
                let isClickable = true;
                const handleClick = mode => {
                    if (!isClickable) return;
                    isClickable = false;
                    tunerMode = mode;
                    updateButtonStyles();
                    setTimeout(() => {
                        isClickable = true;
                    }, 200);
                };

                chromaticButton.onclick = () => handleClick("chromatic");
                targetPitchButton.onclick = () => handleClick("target");

                // Assemble the toggle
                chromaticButton.appendChild(chromaticIcon);
                targetPitchButton.appendChild(targetIcon);
                modeToggle.appendChild(chromaticButton);
                modeToggle.appendChild(targetPitchButton);

                // Initial style update
                updateButtonStyles();

                tunerContainer.appendChild(modeToggle);

                this.widgetWindow.getWidgetBody().appendChild(tunerContainer);

                await this.activity.logo.synth.startTuner();
                activity.textMsg(_("Tuner started"), 3000);
            } else {
                activity.textMsg(_("Tuner stopped"), 3000);
                this.activity.logo.synth.stopTuner();
                tunerOn = false;
            }
        };

        this.centsSliderBtn = widgetWindow.addButton(
            "slider.svg",
            ICONSIZE,
            _("Cents Adjustment"),
            ""
        );

        // Update the cents slider button to toggle the cents adjustment section
        this.centsSliderBtn.onclick = () => {
            stopTuner();
            // Hide the cent adjustment window if it's already open
            const existingCentAdjustmentContainer = docById("centAdjustmentContainer");
            if (existingCentAdjustmentContainer) {
                existingCentAdjustmentContainer.remove();
                this.centAdjustmentOn = false;

                // Show the sampler canvas
                const samplerCanvas = docByClass("samplerCanvas")[0];
                if (samplerCanvas) {
                    samplerCanvas.style.display = "block";
                }
                return;
            }

            // Close the tuner window if it's open
            const tunerContainer = docById("tunerContainer");
            if (tunerContainer) {
                tunerContainer.remove();
                this.activity.logo.synth.stopTuner();
                tunerOn = false;
            }

            if (!this.centAdjustmentOn) {
                this.centAdjustmentOn = true;

                // Hide the sampler canvas
                const samplerCanvas = docByClass("samplerCanvas")[0];
                if (samplerCanvas) {
                    samplerCanvas.style.display = "none";
                }

                // Create the cent adjustment container
                const centAdjustmentContainer = document.createElement("div");
                centAdjustmentContainer.id = "centAdjustmentContainer";
                centAdjustmentContainer.style.position = "absolute";
                centAdjustmentContainer.style.top = "0";
                centAdjustmentContainer.style.left = "0";
                centAdjustmentContainer.style.width = "100%";
                centAdjustmentContainer.style.height = "100%";
                centAdjustmentContainer.style.backgroundColor = "#d8d8d8"; // Grey color to match tuner
                centAdjustmentContainer.style.zIndex = "1000";

                // Create the value display (centered at top)
                const valueDisplay = document.createElement("div");
                valueDisplay.id = "centValueDisplay";
                valueDisplay.textContent =
                    (this.centAdjustmentValue >= 0 ? "+" : "") +
                    (this.centAdjustmentValue || 0) +
                    "¢";
                valueDisplay.style.fontSize = "24px";
                valueDisplay.style.fontWeight = "bold";
                valueDisplay.style.textAlign = "center";

                // Adjust positioning based on whether the window is maximized
                if (this.widgetWindow.isMaximized()) {
                    valueDisplay.style.marginTop = "50px";
                    valueDisplay.style.marginBottom = "50px";
                } else {
                    valueDisplay.style.marginTop = "30px";
                    valueDisplay.style.marginBottom = "30px";
                }

                centAdjustmentContainer.appendChild(valueDisplay);

                // Create the slider container
                const sliderContainer = document.createElement("div");

                // Adjust width and margins based on whether the window is maximized
                if (this.widgetWindow.isMaximized()) {
                    sliderContainer.style.width = "60%";
                    sliderContainer.style.margin = "0 auto 30px auto";
                } else {
                    sliderContainer.style.width = "80%";
                    sliderContainer.style.margin = "0 auto";
                }

                // Create the HTML5 range slider
                const slider = document.createElement("input");
                Object.assign(slider, {
                    type: "range",
                    min: -50,
                    max: 50,
                    value: this.centAdjustmentValue || 0,
                    step: 1
                });

                Object.assign(slider.style, {
                    width: "100%",
                    height: "20px",
                    WebkitAppearance: "none",
                    background: "#4CAF50",
                    outline: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    opacity: "0.8"
                });

                // Add slider thumb styling
                const thumbStyle = `
                    input[type=range]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        width: 25px;
                        height: 25px;
                        background: #2196F3;
                        border-radius: 50%;
                        cursor: pointer;
                        transition: all .2s ease-in-out;
                    }
                    input[type=range]::-webkit-slider-thumb:hover {
                        transform: scale(1.1);
                    }
                    input[type=range]::-moz-range-thumb {
                        width: 25px;
                        height: 25px;
                        background: #2196F3;
                        border-radius: 50%;
                        cursor: pointer;
                        border: none;
                        transition: all .2s ease-in-out;
                    }
                    input[type=range]::-moz-range-thumb:hover {
                        transform: scale(1.1);
                    }
                `;

                // Add the styles to the document
                const styleSheet = document.createElement("style");
                styleSheet.textContent = thumbStyle;
                document.head.appendChild(styleSheet);

                sliderContainer.appendChild(slider);
                centAdjustmentContainer.appendChild(sliderContainer);

                // Add labels for min and max values
                const labelsDiv = document.createElement("div");

                // Adjust width based on whether the window is maximized
                if (this.widgetWindow.isMaximized()) {
                    labelsDiv.style.width = "60%";
                } else {
                    labelsDiv.style.width = "80%";
                }

                labelsDiv.style.display = "flex";
                labelsDiv.style.justifyContent = "space-between";
                labelsDiv.style.margin = "10px auto";

                const minLabel = document.createElement("span");
                minLabel.textContent = "-50¢";
                minLabel.style.fontWeight = "bold";

                const maxLabel = document.createElement("span");
                maxLabel.textContent = "+50¢";
                maxLabel.style.fontWeight = "bold";

                labelsDiv.appendChild(minLabel);
                labelsDiv.appendChild(maxLabel);
                centAdjustmentContainer.appendChild(labelsDiv);

                // Add reset button
                const resetButtonContainer = document.createElement("div");
                resetButtonContainer.style.textAlign = "center";
                resetButtonContainer.style.marginTop = "30px";

                const resetButton = document.createElement("button");
                resetButton.textContent = _("Reset");
                resetButton.style.padding = "10px 20px";
                resetButton.style.backgroundColor = "#808080";
                resetButton.style.color = "white";
                resetButton.style.border = "none";
                resetButton.style.borderRadius = "5px";
                resetButton.style.cursor = "pointer";
                resetButton.style.fontSize = "16px";

                resetButton.onclick = () => {
                    this.centAdjustmentValue = 0;
                    valueDisplay.textContent = "0¢";
                    slider.value = 0;
                    this.applyCentAdjustment(0);
                };

                resetButtonContainer.appendChild(resetButton);
                centAdjustmentContainer.appendChild(resetButtonContainer);

                // Add the container to the widget body
                this.widgetWindow.getWidgetBody().appendChild(centAdjustmentContainer);

                // Add event listener for slider changes
                slider.oninput = () => {
                    const value = parseInt(slider.value);
                    this.centAdjustmentValue = value;
                    valueDisplay.textContent = (value >= 0 ? "+" : "") + value + "¢";
                    this.applyCentAdjustment(value);
                };
            } else {
                this.centAdjustmentOn = false;

                // Remove the cent adjustment container
                const centAdjustmentContainer = docById("centAdjustmentContainer");
                if (centAdjustmentContainer) {
                    centAdjustmentContainer.remove();
                }

                // Show the sampler canvas
                const samplerCanvas = docByClass("samplerCanvas")[0];
                if (samplerCanvas) {
                    samplerCanvas.style.display = "block";
                }
            }
        };

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
                // Update existing sample with new data and cent adjustment
                CUSTOMSAMPLES[i] = [
                    this.sampleName,
                    this.sampleData,
                    this.samplePitch,
                    this.sampleOctave,
                    this.centAdjustmentValue || 0
                ];
                return;
            }
        }
        // Add new sample with cent adjustment
        CUSTOMSAMPLES.push([
            this.sampleName,
            this.sampleData,
            this.samplePitch,
            this.sampleOctave,
            this.centAdjustmentValue || 0
        ]);
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
     * Calculates the frequency in Hz for the current pitch.
     * @returns {number} The frequency in Hz
     */
    this._calculateFrequency = function () {
        let semitones = 0;

        semitones += isNaN(this.octaveCenter) ? 0 : this.octaveCenter * 12;
        semitones += isNaN(this.pitchCenter) ? 0 : MAJORSCALE[this.pitchCenter];
        semitones += isNaN(this.accidentalCenter) ? 0 : this.accidentalCenter - 2;

        // A4 = 440Hz at semitone position 57
        const netChange = semitones - 57;
        const frequency = Math.floor(440 * Math.pow(2, netChange / 12));

        return frequency;
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

            // Store the current note object for the cent adjustment
            const frequency = this._calculateFrequency();
            this.currentNoteObj = TunerUtils.frequencyToPitch(frequency);

            // Get a reference to the player
            const instrumentName = "customsample_" + this.originalSampleName;

            // Ensure the instrument exists
            if (!instruments[0][instrumentName]) {
                // Create the instrument if it doesn't exist
                this.activity.logo.synth.loadSynth(0, instrumentName);
            }

            if (instruments[0][instrumentName]) {
                this.player = instruments[0][instrumentName];
            }

            // Calculate adjusted frequency for cent adjustment
            let playbackFrequency = CENTERPITCHHERTZ;
            if (this.centAdjustmentValue !== 0) {
                const playbackRate = Math.pow(2, this.centAdjustmentValue / 1200);
                playbackFrequency = CENTERPITCHHERTZ * playbackRate;
            }

            this.activity.logo.synth.trigger(
                0,
                [playbackFrequency],
                this.sampleLength / 1000.0,
                instrumentName,
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
        return new Promise(resolve => {
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
        return new Promise(resolve => {
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
            const attr =
                this._accidentalsWheel.navItems[this._accidentalsWheel.selectedNavItemIndex].title;
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
     * Gets the pitch name based on the current pitch, accidental, and octave.
     * Also updates the pitch button display.
     * @returns {string} The pitch name.
     */
    this.getPitchName = function () {
        let name = "";
        name = PITCHNAMES[this.pitchCenter];
        name += EXPORTACCIDENTALNAMES[this.accidentalCenter];
        name += this.octaveCenter.toString();
        this.pitchName = name;

        // Calculate frequency
        const frequency = this._calculateFrequency();

        // Update the pitch button value
        this.pitchBtn.value = this.pitchName;

        // Update the frequency display text
        this.frequencyDisplay.textContent = frequency + " Hz";

        return this.pitchName;
    };

    /**
     * Scales the widget window and canvas based on the window's state.
     * @returns {void}
     */
    this._scale = function () {
        let width, height;
        const canvas = document.getElementsByClassName("samplerCanvas");
        Array.prototype.forEach.call(canvas, ele => {
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

        // If tuner is enabled, create a separate tuner display
        if (this.tunerEnabled) {
            // Create a dedicated tuner canvas
            const tunerCanvas = document.createElement("canvas");
            tunerCanvas.height = Math.min(200, height * 0.4);
            tunerCanvas.width = Math.min(200, width * 0.8);
            tunerCanvas.className = "tunerCanvas";
            tunerCanvas.style.position = "absolute";
            tunerCanvas.style.top = "10px";
            tunerCanvas.style.left = (width - tunerCanvas.width) / 2 + "px";
            this.widgetWindow.getWidgetBody().appendChild(tunerCanvas);

            // Initialize or update the tuner display
            if (!this.tunerDisplay) {
                this.tunerDisplay = new TunerDisplay(
                    tunerCanvas,
                    tunerCanvas.width,
                    tunerCanvas.height
                );
            } else {
                this.tunerDisplay.canvas = tunerCanvas;
                this.tunerDisplay.width = tunerCanvas.width;
                this.tunerDisplay.height = tunerCanvas.height;
            }

            // Set initial note display
            const noteObj = TunerUtils.frequencyToPitch(
                A0 *
                    Math.pow(
                        2,
                        (pitchToNumber(
                            SOLFEGENAMES[this.pitchCenter] +
                                EXPORTACCIDENTALNAMES[this.accidentalCenter],
                            this.octaveCenter
                        ) -
                            57) /
                            12
                    )
            );
            this.tunerDisplay.update(noteObj[0], noteObj[1], this.centsValue);

            // Reduce the main canvas height to make room for the tuner
            canvas.height = height - tunerCanvas.height - 20;
            canvas.style.marginTop = tunerCanvas.height + 20 + "px";
        } else if (this.tunerDisplay) {
            // Remove the tuner canvas if it exists
            const tunerCanvas = document.getElementsByClassName("tunerCanvas")[0];
            if (tunerCanvas) {
                tunerCanvas.parentNode.removeChild(tunerCanvas);
            }
            this.tunerDisplay = null;
        }

        const draw = () => {
            this.drawVisualIDs[turtleIdx] = requestAnimationFrame(draw);
            if (
                this.is_recording ||
                (this.pitchAnalysers[turtleIdx] && (this.running || resized))
            ) {
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
                        dataArray =
                            turtleIdx === 0
                                ? this.pitchAnalysers[0].getValue()
                                : this.activity.logo.synth.getWaveFormValues();
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

                // Update the tuner display if enabled
                if (this.tunerEnabled && this.tunerDisplay) {
                    // Get pitch data from analyzer if available
                    if (this.pitchAnalysers[1] && this.sampleName) {
                        const dataArray = this.pitchAnalysers[1].getValue();
                        if (dataArray && dataArray.length > 0) {
                            const pitch = detectPitch(dataArray);
                            if (pitch > 0) {
                                const { note, cents } = frequencyToNote(pitch);
                                this.tunerDisplay.update(note, cents, this.centsValue);

                                // Update segments
                                const tunerSegments = document.querySelectorAll(
                                    "#tunerContainer svg path"
                                );
                                tunerSegments.forEach((segment, i) => {
                                    const segmentCents = (i - 5) * 10;
                                    if (Math.abs(cents - segmentCents) <= 5) {
                                        segment.setAttribute("fill", "#00ff00"); // In tune (green)
                                    } else if (cents < segmentCents) {
                                        segment.setAttribute("fill", "#ff0000"); // Flat (red)
                                    } else {
                                        segment.setAttribute("fill", "#0000ff"); // Sharp (blue)
                                    }
                                });
                            }
                        }
                    }
                }
            }
        };
        draw();
    };

    /**
     * Toggles the visibility of the tuner display
     * @returns {void}
     */
    this.toggleTuner = function () {
        this.tunerEnabled = !this.tunerEnabled;

        if (this.tunerEnabled) {
            this._tunerBtn.getElementsByTagName("img")[0].src = "header-icons/tuner-active.svg";
        } else {
            this._tunerBtn.getElementsByTagName("img")[0].src = "header-icons/tuner.svg";
        }

        // Redraw the canvas with the tuner display
        this._scale();
    };

    /**
     * Applies the cents adjustment to the sample playback rate
     * @returns {void}
     */
    this.applyCentsAdjustment = function () {
        if (this.sampleName && this.sampleName !== "") {
            const playbackRate = TunerUtils.calculatePlaybackRate(0, this.centsValue);
            // Apply the playback rate to the sample
            if (instruments[0]["customsample_" + this.originalSampleName]) {
                instruments[0]["customsample_" + this.originalSampleName].playbackRate.value =
                    playbackRate;
            }
        }
    };

    /**
     * YIN Pitch Detection Algorithm
     */
    const YIN = (sampleRate, bufferSize = 2048, threshold = 0.1) => {
        // Low-Pass Filter to remove high-frequency noise
        const lowPassFilter = (buffer, cutoff = 500) => {
            const alpha = (2 * Math.PI * cutoff) / sampleRate;
            return buffer.map((sample, i, arr) =>
                i > 0 ? alpha * sample + (1 - alpha) * arr[i - 1] : sample
            );
        };

        // Autocorrelation Function
        const autocorrelation = buffer =>
            buffer.map((_, lag) =>
                buffer
                    .slice(0, buffer.length - lag)
                    .reduce((sum, value, index) => sum + value * buffer[index + lag], 0)
            );

        // Difference Function
        const difference = buffer => {
            const autocorr = autocorrelation(buffer);
            return autocorr.map((_, tau) => autocorr[0] + autocorr[tau] - 2 * autocorr[tau]);
        };

        // Cumulative Mean Normalized Difference Function
        const cumulativeMeanNormalizedDifference = diff => {
            let runningSum = 0;
            return diff.map((value, tau) => {
                runningSum += value;
                return tau === 0 ? 1 : value / (runningSum / tau);
            });
        };

        // Absolute Threshold Function
        const absoluteThreshold = cmnDiff => {
            for (let tau = 2; tau < cmnDiff.length; tau++) {
                if (cmnDiff[tau] < threshold) {
                    while (tau + 1 < cmnDiff.length && cmnDiff[tau + 1] < cmnDiff[tau]) {
                        tau++;
                    }
                    return tau;
                }
            }
            return -1;
        };

        // Parabolic Interpolation (More precision)
        const parabolicInterpolation = (cmnDiff, tau) => {
            const x0 = tau < 1 ? tau : tau - 1;
            const x2 = tau + 1 < cmnDiff.length ? tau + 1 : tau;

            if (x0 === tau) return cmnDiff[tau] <= cmnDiff[x2] ? tau : x2;
            if (x2 === tau) return cmnDiff[tau] <= cmnDiff[x0] ? tau : x0;

            const s0 = cmnDiff[x0],
                s1 = cmnDiff[tau],
                s2 = cmnDiff[x2];
            const adjustment = ((x2 - x0) * (s0 - s2)) / (2 * (s0 - 2 * s1 + s2));

            return tau + adjustment;
        };

        // Main Pitch Detection Function
        return buffer => {
            buffer = lowPassFilter(buffer, 300);
            const diff = difference(buffer);
            const cmnDiff = cumulativeMeanNormalizedDifference(diff);
            const tau = absoluteThreshold(cmnDiff);

            if (tau === -1) return -1;

            const tauInterp = parabolicInterpolation(cmnDiff, tau);
            return sampleRate / tauInterp;
        };
    };

    /**
     * Convert frequency to note and cents
     */
    const frequencyToNote = frequency => {
        if (frequency <= 0) return { note: "---", cents: 0 };

        const A4 = 440;
        const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        const midiNote = 69 + 12 * Math.log2(frequency / A4);
        const roundedMidi = Math.round(midiNote);

        const noteIndex = roundedMidi % 12;
        const octave = Math.floor(roundedMidi / 12) - 1;
        const noteName = noteNames[noteIndex] + octave;

        const nearestFreq = A4 * Math.pow(2, (roundedMidi - 69) / 12);
        const centsOffset = Math.round(1200 * Math.log2(frequency / nearestFreq));

        return { note: noteName, cents: centsOffset };
    };

    /**
     * Stops pitch detection and releases all associated resources.
     * This prevents memory leaks from AudioContext, MediaStream, and animation frames.
     * @returns {void}
     */
    this.stopPitchDetection = () => {
        this.isPitchDetectionRunning = false;

        // Cancel the animation frame loop
        if (this.pitchDetectionAnimationId !== null) {
            cancelAnimationFrame(this.pitchDetectionAnimationId);
            this.pitchDetectionAnimationId = null;
        }

        // Stop all tracks in the media stream (turns off microphone)
        if (this.pitchDetectionStream !== null) {
            this.pitchDetectionStream.getTracks().forEach(track => track.stop());
            this.pitchDetectionStream = null;
        }

        // Close the audio context to free up system resources
        if (this.pitchDetectionAudioContext !== null) {
            this.pitchDetectionAudioContext.close().catch(err => {
                // Ignore errors if context is already closed
                console.debug("AudioContext close error (may already be closed):", err);
            });
            this.pitchDetectionAudioContext = null;
        }
    };

    /**
     * Start pitch detection
     * @param {HTMLElement} pitchElement - Widget-local span for displaying detected pitch
     * @param {HTMLElement} noteElement - Widget-local span for displaying detected note
     * @returns {Promise<void>}
     */
    const startPitchDetection = async (pitchElement, noteElement) => {
        // Stop any existing pitch detection first to avoid multiple instances
        this.stopPitchDetection();

        try {
            const audioContext = new AudioContext();
            this.pitchDetectionAudioContext = audioContext;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.pitchDetectionStream = stream;

            const source = audioContext.createMediaStreamSource(stream);

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 4096;
            source.connect(analyser);

            const bufferSize = 2048;
            const sampleRate = audioContext.sampleRate;
            const buffer = new Float32Array(bufferSize);
            const detectPitch = YIN(sampleRate, bufferSize);

            this.isPitchDetectionRunning = true;

            const updatePitch = () => {
                // Check if we should stop the loop
                if (!this.isPitchDetectionRunning) {
                    return;
                }

                analyser.getFloatTimeDomainData(buffer);
                const pitch = detectPitch(buffer);

                // Use widget-local elements passed from makeTuner — no per-frame global query
                if (pitchElement && noteElement) {
                    if (pitch > 0) {
                        const { note, cents } = frequencyToNote(pitch);
                        pitchElement.textContent = pitch.toFixed(2);
                        noteElement.textContent =
                            cents === 0 ? ` ${note} (Perfect)` : ` ${note}, off by ${cents} cents`;
                    } else {
                        pitchElement.textContent = "---";
                        noteElement.textContent = "---";
                    }
                }

                // Only continue the loop if still running
                if (this.isPitchDetectionRunning) {
                    this.pitchDetectionAnimationId = requestAnimationFrame(updatePitch);
                }
            };

            // Start the animation loop
            this.pitchDetectionAnimationId = requestAnimationFrame(updatePitch);
        } catch (err) {
            console.error(`${err.name}: ${err.message}`);
            alert("Microphone access failed: " + err.message);
            // Clean up any partially initialized resources
            this.stopPitchDetection();
        }
    };

    /**
     * Create tuner UI
     */
    this.makeTuner = (width, height) => {
        const container = document.createElement("div");
        container.className = "tuner-container";
        container.style.height = height + "px";
        container.style.width = width + "px";
        container.style.position = "relative";
        container.style.backgroundColor = "#f5f5f5";
        container.style.borderRadius = "8px";
        container.style.padding = "20px";
        container.style.boxSizing = "border-box";

        const heading = document.createElement("h1");
        heading.textContent = "Tuner";
        heading.style.textAlign = "center";
        heading.style.marginBottom = "20px";

        const startButton = document.createElement("button");
        startButton.id = "start";
        startButton.textContent = "Start";
        startButton.style.display = "block";
        startButton.style.margin = "0 auto 20px";
        startButton.style.padding = "10px 20px";
        startButton.style.fontSize = "16px";
        startButton.style.cursor = "pointer";

        const pitchParagraph = document.createElement("p");
        pitchParagraph.textContent = "Detected Pitch: ";
        pitchParagraph.style.textAlign = "center";
        pitchParagraph.style.fontSize = "18px";
        const pitchSpan = document.createElement("span");
        pitchSpan.id = "pitch";
        pitchSpan.textContent = "---";

        const noteParagraph = document.createElement("p");
        noteParagraph.textContent = "Note: ";
        noteParagraph.style.textAlign = "center";
        noteParagraph.style.fontSize = "18px";
        const noteSpan = document.createElement("span");
        noteSpan.id = "note";
        noteSpan.textContent = "---";

        pitchParagraph.appendChild(pitchSpan);
        noteParagraph.appendChild(noteSpan);

        container.appendChild(heading);
        container.appendChild(startButton);
        container.appendChild(pitchParagraph);
        container.appendChild(noteParagraph);

        this.widgetWindow.getWidgetBody().appendChild(container);

        startButton.addEventListener("click", () => startPitchDetection(pitchSpan, noteSpan));
    };

    /**
     * Applies the cent adjustment to the sample
     * @param {number} value - The cent adjustment value
     * @returns {void}
     */
    this.applyCentAdjustment = function (value) {
        this.centAdjustmentValue = value;

        // Calculate the playback rate adjustment based on cents
        // Formula: playbackRate = 2^(cents/1200)
        const playbackRate = Math.pow(2, value / 1200);

        // Apply the playback rate to the current sample if it exists
        if (this.sampleName && this.sampleName !== "" && this.originalSampleName) {
            const instrumentName = "customsample_" + this.originalSampleName;

            // Check if instruments object exists and the specific instrument exists
            if (
                typeof instruments !== "undefined" &&
                instruments[0] &&
                instruments[0][instrumentName] &&
                instruments[0][instrumentName].playbackRate
            ) {
                instruments[0][instrumentName].playbackRate.value = playbackRate;
            } else {
                // If the instrument doesn't exist yet, we'll apply the adjustment when playing
                console.log("Instrument not found, will apply cent adjustment during playback");
            }
        }

        // If we're currently playing, restart with the new adjustment
        if (this.isMoving) {
            this.pause();
            setTimeout(() => {
                this._playReferencePitch();
            }, 100);
        }
    };
}

// Add smoothing for pitch detection
class PitchSmoother {
    constructor(smoothingSize = 5) {
        this.pitchHistory = [];
        this.smoothingSize = smoothingSize;
    }

    addPitch(pitch) {
        if (pitch > 0) {
            this.pitchHistory.push(pitch);
            if (this.pitchHistory.length > this.smoothingSize) {
                this.pitchHistory.shift();
            }
        }
    }

    getSmoothedPitch() {
        if (this.pitchHistory.length === 0) return -1;

        // Remove outliers
        const sorted = [...this.pitchHistory].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length / 4)];
        const q3 = sorted[Math.floor((3 * sorted.length) / 4)];
        const iqr = q3 - q1;
        const validPitches = this.pitchHistory.filter(
            p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr
        );

        if (validPitches.length === 0) return -1;
        return validPitches.reduce((a, b) => a + b) / validPitches.length;
    }

    reset() {
        this.pitchHistory = [];
    }
}
