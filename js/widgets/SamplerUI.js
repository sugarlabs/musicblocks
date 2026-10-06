// Copyright (c) 2021 Liza Malykhina
// Copyright (c) 2026 Music Blocks contributors
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

   _, docById, instruments, platformColor, resolveBackendURL
*/
/*
    Globals location
    - js/utils/utils.js
        _, docById
    - js/utils/synthutils.js
        instruments
    - js/utils/platformstyle.js
        platformColor
    - js/widgets/sampler.js
        resolveBackendURL
*/

/* exported SamplerUI */

/**
 * @file SamplerUI.js
 * @description Sampler widget the widget window: init builds the window, its toolbar and the sample controls.
 *
 * The methods are moved as they were from the SampleWidget constructor. The constructor calls
 * SamplerUI.install.call(this, deps), so `this` is still the widget.
 */

const SamplerUI = {
    /**
     * Adds these methods to a SampleWidget instance.
     * @param {Object} deps - Values from the SampleWidget constructor's scope.
     * @param {*} deps.ICONSIZE - The constructor's ICONSIZE.
     * @param {*} deps.SAMPLEWIDTH - The constructor's SAMPLEWIDTH.
     * @param {*} deps.SAMPLEHEIGHT - The constructor's SAMPLEHEIGHT.
     * @returns {void}
     */
    install(deps) {
        const { ICONSIZE, SAMPLEWIDTH, SAMPLEHEIGHT } = deps;

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

            const widgetWindow = window.widgetWindows.windowFor(this, "sampler", "sampler");
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
                this._clearWidgetTimers();

                if (this.drawVisualIDs) {
                    for (const id of Object.keys(this.drawVisualIDs)) {
                        cancelAnimationFrame(this.drawVisualIDs[id]);
                    }
                }

                this.running = false;

                // Stop current audio
                if (this.audioPreview) {
                    this.audioPreview.pause();
                    this.audioPreview.currentTime = 0;
                    this.audioPreview = null;
                }

                if (this.is_recording) {
                    this.activity.logo.synth.stopRecording();
                    this.is_recording = false;
                }

                if (tunerOn) {
                    this.activity.logo.synth.stopTuner();
                    tunerOn = false;
                }

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
                // Dispose Tone.Analyser nodes to free Web Audio resources
                for (const key in this.pitchAnalysers) {
                    const analyser = this.pitchAnalysers[key];
                    if (analyser) {
                        if (typeof instruments !== "undefined" && instruments[0]) {
                            for (const synth in instruments[0]) {
                                try {
                                    if (
                                        instruments[0][synth] &&
                                        typeof instruments[0][synth].disconnect === "function"
                                    ) {
                                        instruments[0][synth].disconnect(analyser);
                                    }
                                } catch (_) {
                                    // Synth may not have been connected to this analyser.
                                }
                            }
                        }
                        if (typeof analyser.dispose === "function") {
                            analyser.dispose();
                        }
                    }
                }
                this.pitchAnalysers = {};

                // Remove any dangling file chooser listener
                const fileChooser = docById("myOpenAll");
                if (fileChooser && this._fileChangeHandler) {
                    fileChooser.removeEventListener("change", this._fileChangeHandler);
                    this._fileChangeHandler = null;
                }

                if (this._dropZone) {
                    this._dropZone.removeEventListener("dragover", this._dragOverHandler);
                    this._dropZone.removeEventListener("drop", this._dropHandler);
                    this._dropZone = null;
                }

                widgetWindow.destroy();
            };

            let tunerOn = false;

            const stopTuner = () => {
                if (tunerOn) {
                    activity.textMsg(_("Tuner stopped."), 3000);
                    this.activity.logo.synth.stopTuner();
                    tunerOn = false;
                    const tunerContainer = docById("tunerContainer");
                    if (tunerContainer) {
                        tunerContainer.remove();
                    }
                    this.tunerSegments = [];
                }
            };

            this.playBtn = widgetWindow.addButton("play-button.svg", ICONSIZE, _("Play"));
            this.playBtn.onclick = () => {
                stopTuner();
                if (this.isMoving) {
                    this.pause();
                } else {
                    if (!(this.sampleName === "")) {
                        this.resume();
                    }
                    this._playReferencePitch();
                }
            };

            widgetWindow.addButton("load-media.svg", ICONSIZE, _("Upload sample"), "").onclick =
                function () {
                    stopTuner();
                    const fileChooser = docById("myOpenAll");

                    // Remove any previously attached listener to prevent duplicates
                    if (that._fileChangeHandler) {
                        fileChooser.removeEventListener("change", that._fileChangeHandler);
                    }

                    that._fileChangeHandler = function (event) {
                        window.scroll(0, 0);
                        const sampleFile = fileChooser.files[0];
                        that.handleFiles(sampleFile);
                        fileChooser.removeEventListener("change", that._fileChangeHandler);
                        that._fileChangeHandler = null;
                    };

                    fileChooser.addEventListener("change", that._fileChangeHandler, false);
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
                        that._clearWidgetTimeout(that._saveTimeout);
                        that._saveTimeout = that._setWidgetTimeout(function () {
                            that._save_lock = false;
                            that._saveTimeout = null;
                        }, 1000);
                    }
                };

            this._recordBtn = widgetWindow.addButton("mic.svg", ICONSIZE, _("Toggle Mic"), "");

            this._playbackBtn = widgetWindow.addButton("playback.svg", ICONSIZE, _("Playback"), "");

            this._promptBtn = widgetWindow.addButton("prompt.svg", ICONSIZE, _("Prompt"), "");

            let generating = false;
            this.audioPreview = null;

            this._promptBtn.onclick = () => {
                stopTuner();
                const aiSampleEndpoint = resolveBackendURL();
                if (!aiSampleEndpoint) {
                    activity.errorMsg(_("AI sample generation is not available."));
                    return;
                }
                if (aiSampleEndpoint.startsWith("http://")) {
                    console.warn("AI sample endpoint is using HTTP instead of HTTPS.");
                }
                if (this.is_recording) {
                    this.activity.logo.synth.stopRecording();
                    this.is_recording = false;
                    this._recordBtn.getElementsByTagName("img")[0].src = "header-icons/mic.svg";
                }
                if (this.audioPreview) {
                    this.audioPreview.pause();
                    this.audioPreview.currentTime = 0;
                    this.audioPreview = null;
                }

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
                h1.textContent = _("AI Sample Generation");
                h1.style.color = platformColor.textColor || "var(--color-text-primary, #111827)";
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
                textArea.style.border = "1px solid #d1d5db";
                textArea.style.color = "#111827";
                textArea.style.backgroundColor = "#ffffff";
                textArea.style.padding = "15px";
                textArea.placeholder = randomPrompt;
                textArea.addEventListener("input", function () {
                    if (generating) {
                        setPromptBtnState(submit, true);
                        setPromptBtnState(preview, true);
                        setPromptBtnState(save, true);
                    } else {
                        setPromptBtnState(submit, false);
                        setPromptBtnState(preview, true);
                        setPromptBtnState(save, true);
                    }
                });

                const buttonDiv = document.createElement("div");
                buttonDiv.style.display = "flex";
                buttonDiv.style.justifyContent = "space-between";
                buttonDiv.style.width = "650px";

                const stylePromptBtn = (btn, text) => {
                    btn.style.width = "152px";
                    btn.style.height = "61px";
                    btn.style.fontSize = "32px";
                    btn.style.borderRadius = "10px";
                    btn.style.border = "none";
                    btn.style.cursor = "pointer";
                    btn.style.backgroundColor = platformColor.fillColor || "#ffffff";
                    btn.style.color = "#282828";
                    btn.textContent = _(text);
                };

                const setPromptBtnState = (btn, disabled) => {
                    btn.disabled = disabled;
                    btn.style.opacity = disabled ? "0.45" : "1";
                    btn.style.cursor = disabled ? "not-allowed" : "pointer";
                };

                const submit = document.createElement("button");
                stylePromptBtn(submit, "Submit");
                setPromptBtnState(submit, false);
                submit.onclick = async function () {
                    setPromptBtnState(submit, true);
                    const prompt = textArea.value;
                    const encodedPrompt = encodeURIComponent(prompt);
                    const url = `${aiSampleEndpoint}/generate?prompt=${encodedPrompt}`;

                    try {
                        generating = true;
                        activity.textMsg(
                            _("Generating audio... (It may take up to 1 minute)"),
                            2500
                        );

                        that._clearWidgetInterval(that._promptBlinkInterval);
                        that._promptBlinkInterval = that._setWidgetInterval(() => {
                            activity.textMsg(_("Generating audio..."), 1000);
                        }, 5000);

                        const response = await fetch(url);
                        const result = await response.json();

                        that._clearWidgetInterval(that._promptBlinkInterval);
                        that._promptBlinkInterval = null;

                        if (result.status === "success") {
                            generating = false;
                            activity.textMsg(_("Audio ready!"), 3000);
                            setPromptBtnState(preview, false);
                            setPromptBtnState(save, false);
                        } else {
                            generating = false;
                            activity.textMsg(_("Failed to generate audio."), 3000);
                            setPromptBtnState(submit, false);
                        }
                    } catch (error) {
                        generating = false;
                        that._clearWidgetInterval(that._promptBlinkInterval);
                        that._promptBlinkInterval = null;
                        activity.textMsg(_("An error occurred."), 3000);
                        setPromptBtnState(submit, false);
                    }
                };

                const preview = document.createElement("button");
                stylePromptBtn(preview, "Preview");
                setPromptBtnState(preview, true);
                preview.onclick = () => {
                    if (that.audioPreview) {
                        that.audioPreview.pause();
                        that.audioPreview.currentTime = 0;
                        that.audioPreview = null;
                    }

                    const audioURL = `${aiSampleEndpoint}/preview`;
                    const newAudio = new Audio(audioURL);
                    that.audioPreview = newAudio;
                    newAudio.play();

                    newAudio.onended = function () {
                        if (that.audioPreview === newAudio) {
                            that.audioPreview = null;
                        }
                    };
                };

                const save = document.createElement("button");
                stylePromptBtn(save, "Save");
                setPromptBtnState(save, true);
                save.onclick = function () {
                    const audioURL = `${aiSampleEndpoint}/save`;
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

            this._playbackBtn.id = "playbackBtn";
            this._playbackBtn.classList.add("disabled");

            this.is_recording = false;
            this.playback = false;

            this._recordBtn.onclick = async () => {
                stopTuner();
                if (!this.is_recording) {
                    try {
                        await this.activity.logo.synth.startRecording();
                        this.is_recording = true;
                        this._recordBtn.getElementsByTagName("img")[0].src =
                            "header-icons/record.svg";
                        this.displayRecordingStartMessage();
                        this.activity.logo.synth.LiveWaveForm();
                    } catch (err) {
                        console.error(err);
                        this.activity.errorMsg(_("Microphone access denied."));
                    }
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
                const img = this._playbackBtn.getElementsByTagName("img")[0];
                if (!this.playback) {
                    this.sampleData = this.recordingURL;
                    this.sampleName = `Recorded Audio ${this.recordingURL}`;
                    this._addSample();
                    if (img) {
                        img.src = "header-icons/stop-button.svg";
                    }
                    this.activity.logo.synth.playRecording(() => {
                        this.playback = false;
                        if (img) {
                            img.src = "header-icons/playback.svg";
                        }
                    });
                    this.playback = true;
                } else {
                    this.activity.logo.synth.stopPlayBackRecording();
                    this.playback = false;
                    if (img) {
                        img.src = "header-icons/playback.svg";
                    }
                }
            };

            this._tunerBtn = widgetWindow.addButton("tuner.svg", ICONSIZE, _("Tuner"), "");

            this._tunerBtn.onclick = async () => {
                if (docById("tunerContainer") && !tunerOn) {
                    docById("tunerContainer").remove();
                    this.tunerSegments = [];
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
                    if (samplerCanvas) {
                        samplerCanvas.style.display = "none";
                    }

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

                    const accidentalFlat = document.createElement("img");
                    accidentalFlat.setAttribute("src", "header-icons/accidental-flat.svg");
                    accidentalFlat.style.height = 40 + "px";
                    accidentalFlat.style.width = 40 + "px";
                    accidentalFlat.style.marginTop = "auto";

                    tunerContainer.appendChild(accidentalFlat);

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
                    this.tunerSegments = [];
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
                        const segment = document.createElementNS(
                            "http://www.w3.org/2000/svg",
                            "path"
                        );
                        segment.setAttribute("d", d);
                        segment.setAttribute("fill", platformColor.selectorBackground || "#808080");
                        this.tunerSegments.push(segment);
                        tunerSvg.appendChild(segment);
                    });

                    this.widgetWindow.getWidgetBody().appendChild(tunerContainer);

                    await this.activity.logo.synth.startTuner(this.pitchName);
                    activity.textMsg(_("Tuner started."), 3000);
                } else {
                    activity.textMsg(_("Tuner stopped."), 3000);
                    this.activity.logo.synth.stopTuner();
                    tunerOn = false;
                }
            };

            this.centsSliderBtn = widgetWindow.addButton(
                "slider.svg",
                ICONSIZE,
                _("Cents adjustment"),
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
                    resetButton.style.backgroundColor =
                        platformColor.selectorBackground || "#808080";
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
                        const value = parseInt(slider.value, 10);
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
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = SamplerUI;
}
