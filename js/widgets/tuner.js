/**
 * Copyright (c) 2025 Anvita Prasad DMP'25
 * TunerDisplay class for visualizing pitch detection
 */
function TunerDisplay(canvas, width, height) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.ctx = canvas.getContext("2d");
    this.note = "A";
    this.cents = 0;
    this.frequency = 440;
    this._cachedTheme = null;
    this._selectorBg = null;
    this._textColor = null;
    this._successColor = null;
    this._errorColor = null;
}

/**
 * Resolves and caches CSS token colors for Canvas 2D rendering,
 * updating only when document theme changes.
 * @private
 * @returns {{ selectorBg: string, textColor: string, successColor: string, errorColor: string }}
 */
TunerDisplay.prototype._getCanvasColors = function () {
    const currentTheme =
        typeof document !== "undefined" && document.body ? document.body.className : "";
    if (this._cachedTheme !== currentTheme || !this._selectorBg) {
        this._cachedTheme = currentTheme;
        if (typeof getComputedStyle !== "undefined" && document.body) {
            const style = getComputedStyle(document.body);
            this._selectorBg = style.getPropertyValue("--color-selector-bg").trim() || "#8cc6ff";
            this._textColor = style.getPropertyValue("--color-text-primary").trim() || "#000000";
            this._successColor = style.getPropertyValue("--color-success").trim() || "#10b981";
            this._errorColor = style.getPropertyValue("--color-error").trim() || "#ef4444";
        } else {
            this._selectorBg = "#8cc6ff";
            this._textColor = "#000000";
            this._successColor = "#10b981";
            this._errorColor = "#ef4444";
        }
    }
    return {
        selectorBg: this._selectorBg,
        textColor: this._textColor,
        successColor: this._successColor,
        errorColor: this._errorColor
    };
};

/**
 * Standard student-tuner window: within ±5 cents is treated as in tune.
 */
TunerDisplay.IN_TUNE_CENTS = 5;

/**
 * Needle color for the current cents offset. Green when in tune, red otherwise.
 *
 * @param {number} cents
 * @param {{ successColor: string, errorColor: string }} [colors]
 * @returns {string}
 */
TunerDisplay.prototype._indicatorColor = function (cents, colors) {
    const palette = colors || this._getCanvasColors();
    return Math.abs(cents) <= TunerDisplay.IN_TUNE_CENTS
        ? palette.successColor
        : palette.errorColor;
};

/**
 * Updates the tuner display with new pitch information
 * @param {string} note - The detected note
 * @param {number} cents - The cents deviation from the note
 * @param {number} frequency - The detected frequency
 */
TunerDisplay.prototype.update = function (note, cents, frequency) {
    this.note = note;
    this.cents = cents;
    this.frequency = frequency;
    this.draw();
};

/**
 * Draws the tuner display
 */
TunerDisplay.prototype.draw = function () {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;
    const { selectorBg, textColor, successColor, errorColor } = this._getCanvasColors();

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate positions relative to the meter
    const meterWidth = width * 0.8;
    const meterHeight = 10;
    const meterX = (width - meterWidth) / 2;
    const meterY = height - 80; // Base position of meter

    // Draw the tuning meter background
    ctx.fillStyle = selectorBg;
    ctx.fillRect(meterX, meterY, meterWidth, meterHeight);

    // Draw the center line
    ctx.fillStyle = textColor;
    ctx.fillRect(meterX + meterWidth / 2 - 1, meterY, 2, meterHeight);

    // Draw the indicator
    const indicatorX = meterX + meterWidth / 2 + (this.cents / 50) * (meterWidth / 2);
    ctx.fillStyle = this._indicatorColor(this.cents, { successColor, errorColor });
    ctx.fillRect(indicatorX - 2, meterY - 5, 4, meterHeight + 10);

    // Position text much lower in the canvas
    // Draw the note
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = textColor;
    ctx.fillText(this.note, width / 2, height - 200); // Much lower position

    // Draw the cents deviation
    ctx.font = "24px Arial";
    ctx.fillText(
        (this.cents >= 0 ? "+" : "") + Math.round(this.cents) + "¢",
        width / 2,
        height - 160
    ); // Much lower position

    // Draw the frequency
    ctx.font = "18px Arial";
    ctx.fillText(this.frequency.toFixed(1) + " Hz", width / 2, height - 40); // Near bottom
};

/**
 * TunerUtils class for pitch detection and calculation
 */
const TunerUtils = {
    /**
     * Converts a frequency to pitch information
     * @param {number} frequency - The frequency to convert
     * @returns {Array} [note, cents, frequency]
     */
    frequencyToPitch: function (frequency, edo) {
        const A4 = 440;
        const C0 = A4 * Math.pow(2, -4.75);
        const currentEDO = edo || 12;
        const noteNames = generateNoteNames(currentEDO);

        if (frequency < C0) {
            return ["C", 0, C0];
        }

        const h = Math.round(currentEDO * Math.log2(frequency / C0));
        const octave = Math.floor(h / currentEDO);
        const steppedN = ((h % currentEDO) + currentEDO) % currentEDO;
        const cents = Math.round(1200 * Math.log2(frequency / (C0 * Math.pow(2, h / currentEDO))));

        return [noteNames[steppedN], cents, frequency];
    },

    /**
     * Converts a detected frequency to a note and cents offset.
     * @param {number} frequency - The frequency to convert.
     * @param {number} [edo] - The equal division of the octave.
     * @returns {{note: string, cents: number}}
     */
    frequencyToNote: function (frequency, edo) {
        if (frequency <= 0) return { note: "---", cents: 0 };

        const result = this.frequencyToPitch(frequency, edo);
        return { note: result[0], cents: result[1] };
    },

    /**
     * Calculates the playback rate for a given cents adjustment
     * @param {number} baseCents - The base cents value
     * @param {number} adjustment - The cents adjustment to apply
     * @returns {number} The calculated playback rate
     */
    calculatePlaybackRate: function (baseCents, adjustment) {
        return Math.pow(2, (baseCents + adjustment) / 1200);
    }
};

/* global Tone, instruments, wheelnav, Raphael, computeTargetPitchFrequency, piemenuPitches */

/**
 * The tuner the Sampler widget shows. It listens to the microphone, detects the pitch with the
 * YIN algorithm and draws the tuner display into #tunerContainer.
 *
 * This used to live in Synth (js/utils/synthutils.js). It is moved here as it was, so the synth
 * no longer knows about the tuner. The only change is that the preview synth the tuner sets up
 * is reached through activity.logo.synth instead of `this`.
 * @constructor
 */
function Tuner() {
    /**
     * Tuner microphone input.
     * @type {Tone.UserMedia|null}
     */
    this.tunerMic = null;
    /**
     * Tuner analyser for pitch detection.
     * @type {Tone.Analyser|null}
     */
    this.tunerAnalyser = null;
    /**
     * Pitch detection function.
     * @type {function|null}
     */
    this.detectPitch = null;
    /**
     * Flag to track whether tuner update loop is active.
     * @type {boolean}
     */
    this._tunerActive = false;
    /**
     * Animation frame id for the tuner update loop.
     * @type {number|null}
     */
    this._tunerRafId = null;
    /**
     * Cached tuner segments to avoid querying on every frame.
     * @type {NodeList|null}
     */
    this._tunerSegments = null;
    /**
     * Counts startTuner and stopTuner calls. startTuner waits on script loads, the
     * audio context and the microphone permission prompt, so a stopTuner can land
     * while it is still starting; a start whose token is no longer current stops
     * there instead of opening (or keeping) the microphone.
     * @type {number}
     */
    this._startToken = 0;

    /**
     * Starts the tuner by initializing microphone input
     * @param {string} [initialTargetPitch=null] - The initial pitch to use for target pitch mode (e.g. "C4")
     * @returns {Promise<void>}
     */
    this.startTuner = async (initialTargetPitch = null) => {
        const startToken = ++this._startToken;
        const stopped = () => startToken !== this._startToken;

        const getSafeActivity = () => {
            try {
                if (
                    typeof window !== "undefined" &&
                    window.ActivityContext &&
                    typeof window.ActivityContext.getActivity === "function"
                ) {
                    return window.ActivityContext.getActivity();
                }
            } catch (e) {
                // Fall through to warning below.
            }

            // In practice this runs in the browser; keep a safe fallback for tests.
            try {
                if (typeof module !== "undefined" && module.exports) {
                    const ctx = require("../activity-context");
                    if (ctx && typeof ctx.getActivity === "function") {
                        return ctx.getActivity();
                    }
                }
            } catch (e) {
                // Ignore.
            }

            console.warn("Activity not ready yet in synthutils");
            return null;
        };

        // No fake globals: if Activity isn't ready, fail fast.
        const activity = getSafeActivity();
        if (!activity) return;

        // Initialize wheelnav if not already done
        if (typeof wheelnav !== "function") {
            console.warn("Wheelnav library not found, attempting to load it");
            // Try to load wheelnav dynamically
            const wheelnavScript = document.createElement("script");
            wheelnavScript.src = "lib/wheelnav/wheelnav.min.js";
            document.head.appendChild(wheelnavScript);

            // Wait for wheelnav to load
            await new Promise(resolve => {
                wheelnavScript.onload = resolve;
            });
            if (stopped()) return;
        }

        // Initialize Raphael if not already done (required by wheelnav)
        if (typeof Raphael !== "function") {
            console.warn("Raphael library not found, attempting to load it");
            // Try to load Raphael dynamically
            const raphaelScript = document.createElement("script");
            raphaelScript.src = "lib/raphael.min.js";
            document.head.appendChild(raphaelScript);

            // Wait for Raphael to load
            await new Promise(resolve => {
                raphaelScript.onload = resolve;
            });
            if (stopped()) return;
        }

        // Start audio context
        await Tone.start();
        if (stopped()) return;

        // Initialize synth for preview
        if (!instruments[0]) {
            instruments[0] = {};
        }
        if (!instruments[0]["electronic synth"]) {
            const synth = activity.logo.synth;
            synth.createDefaultSynth(0);
            await synth.loadSynth(0, "electronic synth");
            synth.setVolume(0, "electronic synth", 50); // Set to 50% volume
            if (stopped()) return;
        }

        // Rest of the tuner initialization code
        if (this.tunerMic) {
            this.tunerMic.close();
        }

        await Tone.start();
        if (stopped()) return;
        const mic = new Tone.UserMedia();
        this.tunerMic = mic;
        await mic.open();
        if (stopped()) {
            // stopTuner ran while the microphone was opening.
            mic.close();
            if (this.tunerMic === mic) {
                this.tunerMic = null;
            }
            return;
        }

        this.tunerAnalyser = new Tone.Analyser("waveform", 2048);
        this.tunerMic.connect(this.tunerAnalyser);
        this._tunerActive = true;
        this._tunerSegments = null;
        if (this._tunerRafId !== null && typeof cancelAnimationFrame === "function") {
            cancelAnimationFrame(this._tunerRafId);
        }
        this._tunerRafId = null;

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

        this.detectPitch = YIN(Tone.context.sampleRate);
        let tunerMode = "chromatic"; // Add mode state
        let targetPitch = { note: "A4", frequency: 440 }; // Default target pitch

        if (initialTargetPitch) {
            try {
                const freq = computeTargetPitchFrequency(initialTargetPitch);
                if (!isNaN(freq) && freq > 0) {
                    targetPitch = { note: initialTargetPitch, frequency: freq };
                    tunerMode = "target"; // Start in target mode if an initial target is provided
                }
            } catch (error) {
                console.warn("Invalid initial target pitch:", initialTargetPitch);
            }
        }

        const tunerContainer = document.getElementById("tunerContainer");
        if (tunerContainer && !document.getElementById("noteDisplayContainer")) {
            // Initialize display elements if they don't exist
            let noteDisplayContainer = document.getElementById("noteDisplayContainer");

            if (!noteDisplayContainer && tunerContainer) {
                // Create container
                noteDisplayContainer = document.createElement("div");
                noteDisplayContainer.id = "noteDisplayContainer";
                noteDisplayContainer.style.position = "absolute";
                noteDisplayContainer.style.top = "62%";
                noteDisplayContainer.style.left = "50%";
                noteDisplayContainer.style.transform = "translate(-50%, -50%)";
                noteDisplayContainer.style.textAlign = "center";
                noteDisplayContainer.style.fontFamily = "Arial, sans-serif";
                noteDisplayContainer.style.zIndex = "1000";

                // Create target note selector (only for target mode)
                const targetNoteSelector = document.createElement("div");
                targetNoteSelector.id = "targetNoteSelector";
                targetNoteSelector.style.position = "absolute";
                targetNoteSelector.style.top = "-40px"; // Moved down from -60px
                targetNoteSelector.style.left = "50%";
                targetNoteSelector.style.transform = "translateX(-50%)";
                targetNoteSelector.style.color = "#666666";
                targetNoteSelector.style.fontSize = "24px"; // Increased from 16px
                targetNoteSelector.style.cursor = "pointer";
                targetNoteSelector.style.transition = "opacity 0.2s ease";
                targetNoteSelector.style.opacity = "0.7";
                targetNoteSelector.textContent = targetPitch.note;

                // Hover effects
                targetNoteSelector.addEventListener("mouseenter", () => {
                    targetNoteSelector.style.opacity = "1";
                });

                targetNoteSelector.addEventListener("mouseleave", () => {
                    targetNoteSelector.style.opacity = "0.7";
                });

                // Create the wheel div if it doesn't exist
                let wheelDiv = docById("wheelDiv");
                if (!wheelDiv) {
                    wheelDiv = document.createElement("div");
                    wheelDiv.id = "wheelDiv";
                    wheelDiv.style.position = "absolute";
                    wheelDiv.style.display = "none";
                    wheelDiv.style.zIndex = "1500";
                    document.body.appendChild(wheelDiv);
                }

                // Click handler to open pie menu
                targetNoteSelector.addEventListener("click", () => {
                    // Only show in target mode
                    if (tunerMode === "target") {
                        // Setup parameters for piemenuPitches
                        const SOLFNOTES = ["ti", "la", "sol", "fa", "mi", "re", "do"];
                        const NOTENOTES = ["B", "A", "G", "F", "E", "D", "C"];
                        const SOLFATTRS = ["𝄪", "♯", "♮", "♭", "𝄫"];

                        // Get current note, accidental and octave from targetPitch
                        let selectedNote = "A";
                        let selectedAttr = "♮";
                        let selectedOctave = 4;

                        if (targetPitch && targetPitch.note) {
                            const noteMatch = targetPitch.note.match(
                                /^([a-zA-Z])([♯♭𝄪𝄫♮#b]*)(-?\d+)?$/iu
                            );
                            if (noteMatch) {
                                selectedNote = noteMatch[1].toUpperCase();
                                selectedAttr = noteMatch[2] || "♮";
                                if (selectedAttr === "#") selectedAttr = "♯";
                                else if (selectedAttr === "b") selectedAttr = "♭";
                                if (noteMatch[3]) {
                                    selectedOctave = parseInt(noteMatch[3], 10);
                                }
                            }
                        }

                        // Convert letter note to solfege for initial selection
                        let selectedSolfege = SOLFNOTES[NOTENOTES.indexOf(selectedNote)];
                        if (!selectedSolfege) selectedSolfege = "la"; // fallback

                        try {
                            // Prepare a non-mutating activity proxy with a local logo fallback
                            const defaultLogo = {
                                synth: {
                                    createDefaultSynth: () => {},
                                    loadSynth: () => {},
                                    setMasterVolume: () => {},
                                    trigger: () => {},
                                    inTemperament: "equal"
                                },
                                errorMsg: msg => {
                                    console.warn(msg);
                                }
                            };

                            const logo = activity.logo || defaultLogo;
                            const activityProxy = Object.create(activity);
                            activityProxy.logo = logo;

                            const tempBlock = {
                                activity: activityProxy,
                                blocks: {
                                    blockList: [
                                        {
                                            name: "pitch",
                                            connections: [null, null],
                                            value: targetPitch.note,
                                            container: {
                                                x: targetNoteSelector.offsetLeft,
                                                y: targetNoteSelector.offsetTop
                                            }
                                        }
                                    ],
                                    stageClick: false,
                                    setPitchOctave: () => {},
                                    findPitchOctave: () => selectedOctave,
                                    turtles: {
                                        _canvas: {
                                            width: window.innerWidth,
                                            height: window.innerHeight
                                        },
                                        ithTurtle: i => ({
                                            singer: {
                                                instrumentNames: ["default"]
                                            }
                                        })
                                    }
                                },
                                connections: [0], // Connect to the pitch block
                                value: targetPitch.note,
                                text: { text: targetPitch.note },
                                updateCache: () => {},
                                _exitWheel: null,
                                _pitchWheel: null,
                                _accidentalsWheel: null,
                                _octavesWheel: null,
                                piemenuOKtoLaunch: () => true,
                                _piemenuExitTime: 0,
                                container: {
                                    x: targetNoteSelector.offsetLeft,
                                    y: targetNoteSelector.offsetTop,
                                    setChildIndex: () => {}
                                },
                                prevAccidental: "♮",
                                name: "pitch", // This is needed for pitch preview
                                _triggerLock: false // This is needed for pitch preview
                            };

                            // Add key signature environment (on proxy, not real activity)
                            activityProxy.KeySignatureEnv = ["C", "major", false];

                            // Make sure wheelDiv is properly positioned and visible
                            const wheelDiv = docById("wheelDiv");
                            if (wheelDiv) {
                                const rect = targetNoteSelector.getBoundingClientRect();
                                wheelDiv.style.position = "absolute";
                                wheelDiv.style.left = rect.left - 250 + "px";
                                wheelDiv.style.top = rect.top - 250 + "px";
                                wheelDiv.style.width = "600px";
                                wheelDiv.style.height = "600px";
                                wheelDiv.style.zIndex = "1500";
                                wheelDiv.style.backgroundColor = "transparent";
                                wheelDiv.style.display = "block";
                            }

                            // Call piemenuPitches with solfege labels but note values
                            piemenuPitches(
                                tempBlock,
                                SOLFNOTES,
                                NOTENOTES,
                                SOLFATTRS,
                                selectedSolfege,
                                selectedAttr
                            );

                            // Create a state object to track selections
                            const selectionState = {
                                note: selectedNote,
                                accidental: selectedAttr,
                                octave: selectedOctave
                            };

                            // Update target pitch when a note is selected
                            if (tempBlock._pitchWheel && tempBlock._pitchWheel.navItems) {
                                // Add navigation function to each note in the pitch wheel
                                for (let i = 0; i < tempBlock._pitchWheel.navItems.length; i++) {
                                    tempBlock._pitchWheel.navItems[i].navigateFunction = () => {
                                        // Get the selected note
                                        const solfegeNote = tempBlock._pitchWheel.navItems[i].title;
                                        if (solfegeNote && SOLFNOTES.includes(solfegeNote)) {
                                            const noteIndex = SOLFNOTES.indexOf(solfegeNote);
                                            selectionState.note = NOTENOTES[noteIndex];
                                            updateTargetNote();
                                        }
                                    };
                                }
                            }

                            // Add handlers for accidentals wheel
                            if (
                                tempBlock._accidentalsWheel &&
                                tempBlock._accidentalsWheel.navItems
                            ) {
                                for (
                                    let i = 0;
                                    i < tempBlock._accidentalsWheel.navItems.length;
                                    i++
                                ) {
                                    tempBlock._accidentalsWheel.navItems[i].navigateFunction =
                                        () => {
                                            selectionState.accidental =
                                                tempBlock._accidentalsWheel.navItems[i].title;
                                            updateTargetNote();
                                        };
                                }
                            }

                            // Add handlers for octaves wheel
                            if (tempBlock._octavesWheel && tempBlock._octavesWheel.navItems) {
                                for (let i = 0; i < tempBlock._octavesWheel.navItems.length; i++) {
                                    tempBlock._octavesWheel.navItems[i].navigateFunction = () => {
                                        const octave = tempBlock._octavesWheel.navItems[i].title;
                                        if (octave && !isNaN(octave)) {
                                            selectionState.octave = parseInt(octave, 10);
                                            updateTargetNote();
                                        }
                                    };
                                }
                            }

                            // Function to update the target note display
                            const updateTargetNote = () => {
                                if (!selectionState.note) return;

                                // Convert accidental symbols to notation
                                let noteWithAccidental = selectionState.note;
                                if (selectionState.accidental === "♯") noteWithAccidental += "#";
                                else if (selectionState.accidental === "♭")
                                    noteWithAccidental += "b";
                                else if (selectionState.accidental === "𝄪")
                                    noteWithAccidental += "##";
                                else if (selectionState.accidental === "𝄫")
                                    noteWithAccidental += "bb";

                                const noteWithOctave = noteWithAccidental + selectionState.octave;

                                // Update target pitch
                                targetPitch.note = noteWithOctave;

                                // Calculate the frequency for the target pitch
                                try {
                                    const freq = computeTargetPitchFrequency(noteWithOctave);
                                    if (!isNaN(freq) && freq > 0) {
                                        targetPitch.frequency = freq;
                                    } else {
                                        console.error("Invalid frequency calculated:", freq);
                                        targetPitch.frequency = 440; // Default to A4 if calculation fails
                                    }
                                } catch (error) {
                                    console.error("Error calculating frequency:", error);
                                    targetPitch.frequency = 440; // Default to A4 if calculation fails
                                }

                                // Update display
                                targetNoteSelector.textContent = noteWithOctave;
                            };

                            // Update exit wheel handler
                            if (tempBlock._exitWheel && tempBlock._exitWheel.navItems) {
                                tempBlock._exitWheel.navItems[0].navigateFunction = () => {
                                    // Clean up the wheels
                                    if (tempBlock._pitchWheel) {
                                        tempBlock._pitchWheel.removeWheel();
                                    }
                                    if (tempBlock._accidentalsWheel) {
                                        tempBlock._accidentalsWheel.removeWheel();
                                    }
                                    if (tempBlock._octavesWheel) {
                                        tempBlock._octavesWheel.removeWheel();
                                    }
                                    if (tempBlock._exitWheel) {
                                        tempBlock._exitWheel.removeWheel();
                                    }

                                    // Hide the wheel div
                                    wheelDiv.style.display = "none";
                                };
                            }
                        } catch (error) {
                            console.error("Error opening pie menu:", error);
                        }
                    }
                });

                noteDisplayContainer.appendChild(targetNoteSelector);

                // Create mode toggle button
                const modeToggle = document.createElement("div");
                modeToggle.id = "modeToggle";
                modeToggle.style.position = "absolute";
                modeToggle.style.top = "30px";
                modeToggle.style.left = "50%";
                modeToggle.style.transform = "translateX(-50%)";
                modeToggle.style.display = "flex";
                modeToggle.style.backgroundColor = "#FFFFFF";
                modeToggle.style.borderRadius = "25px"; // Increased pill shape radius
                modeToggle.style.padding = "3px"; // Slightly more padding
                modeToggle.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                modeToggle.style.width = "120px"; // Increased width
                modeToggle.style.height = "44px"; // Increased height
                modeToggle.style.cursor = "pointer"; // Added cursor pointer

                // Create chromatic mode button
                const chromaticButton = document.createElement("div");
                chromaticButton.setAttribute("role", "button");
                chromaticButton.setAttribute("tabindex", "0");
                chromaticButton.style.flex = "1";
                chromaticButton.style.display = "flex";
                chromaticButton.style.alignItems = "center";
                chromaticButton.style.justifyContent = "center";
                chromaticButton.style.borderRadius = "22px"; // Increased radius
                chromaticButton.style.cursor = "pointer";
                chromaticButton.style.transition = "all 0.2s ease"; // Faster transition
                chromaticButton.style.userSelect = "none"; // Prevent text selection
                chromaticButton.title = _("Chromatic");

                // Create target pitch mode button
                const targetPitchButton = document.createElement("div");
                targetPitchButton.setAttribute("role", "button");
                targetPitchButton.setAttribute("tabindex", "0");
                targetPitchButton.style.flex = "1";
                targetPitchButton.style.display = "flex";
                targetPitchButton.style.alignItems = "center";
                targetPitchButton.style.justifyContent = "center";
                targetPitchButton.style.borderRadius = "22px"; // Increased radius
                targetPitchButton.style.cursor = "pointer";
                targetPitchButton.style.transition = "all 0.2s ease"; // Faster transition
                targetPitchButton.style.userSelect = "none"; // Prevent text selection
                targetPitchButton.title = _("Target pitch");

                // Create icons
                const chromaticIcon = document.createElement("img");
                chromaticIcon.src = "header-icons/chromatic-mode.svg";
                chromaticIcon.alt = _("Chromatic mode");
                chromaticIcon.style.width = "32px"; // Increased icon size further
                chromaticIcon.style.height = "32px";
                chromaticIcon.style.filter = "brightness(0)"; // Make icon black
                chromaticIcon.style.pointerEvents = "none"; // Prevent icon from interfering with clicks

                const targetIcon = document.createElement("img");
                targetIcon.src = "header-icons/target-pitch-mode.svg";
                targetIcon.alt = _("Target pitch mode");
                targetIcon.style.width = "32px"; // Increased icon size further
                targetIcon.style.height = "32px";
                targetIcon.style.filter = "brightness(0)"; // Make icon black
                targetIcon.style.pointerEvents = "none"; // Prevent icon from interfering with clicks

                // Function to update button styles
                const updateButtonStyles = () => {
                    if (tunerMode === "chromatic") {
                        chromaticButton.style.backgroundColor = "#A6CEFF"; // Blue for active
                        chromaticButton.setAttribute("aria-pressed", "true");
                        targetPitchButton.style.backgroundColor = "#FFFFFF"; // White for inactive
                        targetPitchButton.setAttribute("aria-pressed", "false");
                    } else {
                        chromaticButton.style.backgroundColor = "#FFFFFF"; // White for inactive
                        chromaticButton.setAttribute("aria-pressed", "false");
                        targetPitchButton.style.backgroundColor = "#A6CEFF"; // Blue for active
                        targetPitchButton.setAttribute("aria-pressed", "true");
                    }
                };

                // Add click handlers with debounce to prevent double clicks
                let isClickable = true;
                const handleClick = mode => {
                    if (!isClickable) return;
                    isClickable = false;
                    tunerMode = mode;
                    updateButtonStyles();
                    setTimeout(() => {
                        isClickable = true;
                    }, 200); // Re-enable after 200ms
                };

                chromaticButton.onclick = () => handleClick("chromatic");
                targetPitchButton.onclick = () => handleClick("target");

                chromaticButton.onkeydown = e => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleClick("chromatic");
                    }
                };

                targetPitchButton.onkeydown = e => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleClick("target");
                    }
                };

                // Assemble the toggle
                chromaticButton.appendChild(chromaticIcon);
                targetPitchButton.appendChild(targetIcon);
                modeToggle.appendChild(chromaticButton);
                modeToggle.appendChild(targetPitchButton);

                // Initial style update
                updateButtonStyles();

                tunerContainer.appendChild(modeToggle);

                // Create note display
                const noteText = document.createElement("div");
                noteText.id = "noteText";
                noteText.style.fontSize = "64px";
                noteText.style.fontWeight = "bold";
                noteText.style.marginBottom = "5px";

                // Create cents deviation display
                const centsText = document.createElement("div");
                centsText.id = "centsText";
                centsText.style.fontSize = "14px";
                centsText.style.color = "#666666";
                centsText.style.marginBottom = "5px";

                // Create tune direction display
                const tuneDirection = document.createElement("div");
                tuneDirection.id = "tuneDirection";
                tuneDirection.style.fontSize = "18px";
                tuneDirection.style.color = "#FF4500";

                // Append all elements
                noteDisplayContainer.appendChild(noteText);
                noteDisplayContainer.appendChild(centsText);
                noteDisplayContainer.appendChild(tuneDirection);
                tunerContainer.appendChild(noteDisplayContainer);
            }
        }

        const updatePitch = () => {
            if (!this._tunerActive) return;

            const tunerContainer = document.getElementById("tunerContainer");
            if (!tunerContainer || !this.tunerAnalyser || !this.detectPitch) {
                this._tunerActive = false;
                this._tunerRafId = null;
                return;
            }

            const buffer = this.tunerAnalyser.getValue();
            const pitch = this.detectPitch(buffer);

            if (pitch > 0) {
                let note, cents;

                // Get the current note being played
                const currentNote = frequencyToNote(pitch);

                if (tunerMode === "chromatic") {
                    // Chromatic mode - use nearest note
                    note = currentNote.note;
                    cents = currentNote.cents;
                } else {
                    // Target pitch mode
                    // Show current note in display but calculate cents from target
                    note = currentNote.note; // Show the current note being played

                    // Ensure we have valid frequencies before calculation
                    if (pitch > 0 && targetPitch.frequency > 0) {
                        // Calculate cents from target frequency
                        const centsFromTarget = 1200 * Math.log2(pitch / targetPitch.frequency);

                        // Calculate octaves and semitones when far off
                        const totalSemitones = Math.round(centsFromTarget / 100);
                        const octaves = Math.floor(Math.abs(totalSemitones) / 12);
                        const remainingSemitones = Math.abs(totalSemitones) % 12;

                        if (Math.abs(centsFromTarget) >= 100) {
                            // More than a semitone off - show octaves and semitones
                            const direction = centsFromTarget > 0 ? "+" : "-";
                            cents = Math.round(centsFromTarget);

                            // Store the display text for the grey text display
                            let displayText = direction;
                            if (octaves > 0) {
                                displayText += octaves + " octave" + (octaves > 1 ? "s" : "");
                                if (remainingSemitones > 0) displayText += " ";
                            }
                            if (remainingSemitones > 0) {
                                displayText +=
                                    remainingSemitones +
                                    " semitone" +
                                    (remainingSemitones > 1 ? "s" : "");
                            }
                            this.displayText = displayText;
                        } else {
                            // Less than a semitone off - show cents
                            cents = Math.round(centsFromTarget);
                            this.displayText = `${cents > 0 ? "+" : ""}${cents} cents`;
                        }
                    } else {
                        // If we don't have valid frequencies, set defaults
                        cents = 0;
                        this.displayText = "0 cents";
                    }
                }

                // Update displays if they exist
                const noteDisplayContainer = document.getElementById("noteDisplayContainer");
                if (noteDisplayContainer) {
                    const noteText = document.getElementById("noteText");
                    const centsText = document.getElementById("centsText");
                    const tuneDirection = document.getElementById("tuneDirection");
                    const targetNoteSelector = document.getElementById("targetNoteSelector");

                    if (noteText) noteText.textContent = note;
                    if (centsText) {
                        centsText.textContent =
                            this.displayText ||
                            (tunerMode === "target"
                                ? "0 cents"
                                : `${cents > 0 ? "+" : ""}${Math.round(cents)} cents`);
                    }

                    // Update target note selector visibility based on mode
                    if (targetNoteSelector) {
                        targetNoteSelector.style.display =
                            tunerMode === "target" ? "block" : "none";
                        targetNoteSelector.textContent = targetPitch.note;
                    }

                    if (tuneDirection) {
                        tuneDirection.textContent = "";
                        tuneDirection.style.color = Math.abs(cents) <= 5 ? "#00FF00" : "#FF4500";
                    }
                }

                // Update tuner segments
                let tunerSegments = this._tunerSegments;
                if (!tunerSegments || tunerSegments.length === 0 || !tunerSegments[0].isConnected) {
                    tunerSegments = tunerContainer.querySelectorAll("svg path");
                    this._tunerSegments = tunerSegments;
                }

                // Define colors for the gradient
                const colors = {
                    deepRed: "#FF0000",
                    redOrange: "#FF4500",
                    orange: "#FFA500",
                    yellowOrange: "#FFB833",
                    yellowGreen: "#9ACD32",
                    brightGreen: "#00FF00",
                    inactive: "#D3D3D3" // Light gray
                };

                // Update tuner display
                tunerSegments.forEach((segment, i) => {
                    const segmentCents = (i - 5) * 10; // Each segment represents 10 cents

                    // Default to inactive color
                    let segmentColor = colors.inactive;

                    if (tunerMode === "chromatic") {
                        // Chromatic mode - normal behavior
                        const absCents = Math.abs(cents);

                        // Determine if segment should be lit based on current cents value
                        const shouldLight =
                            cents < 0
                                ? segmentCents <= 0 && Math.abs(segmentCents) <= Math.abs(cents) // Flat side
                                : segmentCents >= 0 && segmentCents <= cents; // Sharp side

                        if (shouldLight || Math.abs(cents - segmentCents) <= 5) {
                            // Center segment
                            if (i === 5) {
                                segmentColor =
                                    Math.abs(cents) <= 5 ? colors.brightGreen : colors.inactive;
                            }
                            // Flat side (segments 0-4)
                            else if (i < 5) {
                                switch (i) {
                                    case 0:
                                        segmentColor = colors.deepRed;
                                        break;
                                    case 1:
                                        segmentColor = colors.redOrange;
                                        break;
                                    case 2:
                                        segmentColor = colors.orange;
                                        break;
                                    case 3:
                                        segmentColor = colors.yellowOrange;
                                        break;
                                    case 4:
                                        segmentColor = colors.yellowGreen;
                                        break;
                                }
                            }
                            // Sharp side (segments 6-10)
                            else {
                                switch (i) {
                                    case 6:
                                        segmentColor = colors.yellowGreen;
                                        break;
                                    case 7:
                                        segmentColor = colors.yellowOrange;
                                        break;
                                    case 8:
                                        segmentColor = colors.orange;
                                        break;
                                    case 9:
                                        segmentColor = colors.redOrange;
                                        break;
                                    case 10:
                                        segmentColor = colors.deepRed;
                                        break;
                                }
                            }
                        }
                    } else {
                        // Target pitch mode - use centsFromTarget for segment display
                        const centsFromTarget = cents; // We already calculated this above

                        if (Math.abs(centsFromTarget) > 50) {
                            // More than 50 cents off - only show red segments
                            if (centsFromTarget < 0) {
                                // Flat - light up first (leftmost) segment
                                if (i === 0) segmentColor = colors.deepRed;
                            } else {
                                // Sharp - light up last (rightmost) segment
                                if (i === 10) segmentColor = colors.deepRed;
                            }
                        } else {
                            // Within 50 cents - show normal gradient behavior
                            const shouldLight =
                                centsFromTarget < 0
                                    ? segmentCents <= 0 &&
                                      Math.abs(segmentCents) <= Math.abs(centsFromTarget) // Flat side
                                    : segmentCents >= 0 && segmentCents <= centsFromTarget; // Sharp side

                            if (shouldLight || Math.abs(centsFromTarget - segmentCents) <= 5) {
                                // Center segment
                                if (i === 5) {
                                    segmentColor =
                                        Math.abs(centsFromTarget) <= 5
                                            ? colors.brightGreen
                                            : colors.inactive;
                                }
                                // Flat side (segments 0-4)
                                else if (i < 5) {
                                    switch (i) {
                                        case 0:
                                            segmentColor = colors.deepRed;
                                            break;
                                        case 1:
                                            segmentColor = colors.redOrange;
                                            break;
                                        case 2:
                                            segmentColor = colors.orange;
                                            break;
                                        case 3:
                                            segmentColor = colors.yellowOrange;
                                            break;
                                        case 4:
                                            segmentColor = colors.yellowGreen;
                                            break;
                                    }
                                }
                                // Sharp side (segments 6-10)
                                else {
                                    switch (i) {
                                        case 6:
                                            segmentColor = colors.yellowGreen;
                                            break;
                                        case 7:
                                            segmentColor = colors.yellowOrange;
                                            break;
                                        case 8:
                                            segmentColor = colors.orange;
                                            break;
                                        case 9:
                                            segmentColor = colors.redOrange;
                                            break;
                                        case 10:
                                            segmentColor = colors.deepRed;
                                            break;
                                    }
                                }
                            }
                        }
                    }

                    // Add transition effect for smooth color changes
                    segment.style.transition = "fill 0.1s ease-in-out";
                    segment.setAttribute("fill", segmentColor);
                });
            }

            if (this._tunerActive && typeof requestAnimationFrame === "function") {
                this._tunerRafId = requestAnimationFrame(updatePitch);
            }
        };

        updatePitch();
    };

    this.stopTuner = () => {
        this._startToken++;
        this._tunerActive = false;
        if (this._tunerRafId !== null && typeof cancelAnimationFrame === "function") {
            cancelAnimationFrame(this._tunerRafId);
        }
        this._tunerRafId = null;
        this._tunerSegments = null;
        if (this.tunerMic) {
            if (this.tunerAnalyser) {
                this.tunerMic.disconnect(this.tunerAnalyser);
                this.tunerAnalyser.dispose();
            }
            this.tunerMic.close();
        }
        this.tunerAnalyser = null;
        this.tunerMic = null;
    };

    const frequencyToNote = frequency => {
        if (frequency <= 0) return { note: "---", cents: 0 };

        const A4 = 440;
        const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        // Calculate how many half steps away from A4 (69 midi note)
        const midiNote = 69 + 12 * Math.log2(frequency / A4);

        // Get the nearest note's MIDI number
        let roundedMidi = Math.round(midiNote);

        // Calculate cents before rounding to nearest note
        const cents = Math.round(100 * (midiNote - roundedMidi));

        // Adjust for edge cases where cents calculation puts us closer to the next note
        if (cents > 50) {
            roundedMidi++;
        } else if (cents < -50) {
            roundedMidi--;
        }

        // Get note name and octave
        const noteIndex = ((roundedMidi % 12) + 12) % 12;
        const octave = Math.floor((roundedMidi - 12) / 12);
        const noteName = noteNames[noteIndex] + octave;

        return { note: noteName, cents: cents };
    };

    /**
     * Gets the current frequency from the tuner
     * @returns {number} The detected frequency in Hz
     */
    this.getTunerFrequency = () => {
        if (!this.tunerAnalyser || !this.detectPitch) return 440; // Default to A4 if no analyser

        const buffer = this.tunerAnalyser.getValue();
        const pitch = this.detectPitch(buffer);

        // Return detected pitch or default to A4
        return pitch > 0 ? pitch : 440;
    };
}

if (typeof window !== "undefined") {
    window.TunerDisplay = TunerDisplay;
    window.TunerUtils = TunerUtils;
    window.Tuner = Tuner;
}

if (typeof module !== "undefined") {
    module.exports = { TunerDisplay, TunerUtils, Tuner };
}
