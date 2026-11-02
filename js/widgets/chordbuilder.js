/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks Contributors
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/* global
   _, buildScale, ChordBuilderAudio
*/

/**
 * @file chordbuilder.js
 * @description Chord Progression Builder widget for MusicBlocks.
 * Allows students and musicians to explore diatonic chord theory, audition
 * chords in any key/mode, build chord progressions, play them with tempo control,
 * and export them as MusicBlocks blocks onto the canvas.
 */
class ChordBuilderWidget {
    static dependencies = ["widgets/ChordBuilderAudio", "widgets/chordbuilder"];

    static ROOT_KEYS = [
        "C",
        "C#",
        "Db",
        "D",
        "Eb",
        "E",
        "F",
        "F#",
        "Gb",
        "G",
        "Ab",
        "A",
        "Bb",
        "B"
    ];

    static SUPPORTED_MODES = [
        "major",
        "minor",
        "dorian",
        "phrygian",
        "lydian",
        "mixolydian",
        "aeolian",
        "locrian"
    ];

    static ROMAN_NUMERALS_UPPER = ["I", "II", "III", "IV", "V", "VI", "VII"];
    static ROMAN_NUMERALS_LOWER = ["i", "ii", "iii", "iv", "v", "vi", "vii"];

    static PRESETS = {
        pop: {
            label: "Pop (I - V - vi - IV)",
            degrees: [0, 4, 5, 3]
        },
        jazz: {
            label: "Jazz (ii - V - I)",
            degrees: [1, 4, 0]
        },
        fifties: {
            label: "50s Progression (I - vi - IV - V)",
            degrees: [0, 5, 3, 4]
        },
        blues: {
            label: "Blues Cadence (I - IV - I - V)",
            degrees: [0, 3, 0, 4]
        },
        canon: {
            label: "Canon (I - V - vi - iii - IV - I - IV - V)",
            degrees: [0, 4, 5, 2, 3, 0, 3, 4]
        },
        modal: {
            label: "Modal Cadence (i - IV - i)",
            degrees: [0, 3, 0]
        }
    };

    /**
     * @param {object} activity - The main MusicBlocks activity instance.
     * @param {object} [deps] - Optional dependency injection overrides.
     */
    constructor(activity, deps = {}) {
        this.activity = activity;
        this._deps = deps;

        this.logo = deps.logo || (activity && activity.logo) || null;
        this.blocks = deps.blocks || (activity && activity.blocks) || null;
        this.turtles = deps.turtles || (activity && activity.turtles) || null;
        this.hideMsgs =
            deps.hideMsgs ||
            (activity && activity.hideMsgs ? activity.hideMsgs.bind(activity) : () => {});
        this.textMsg =
            deps.textMsg ||
            (activity && activity.textMsg ? activity.textMsg.bind(activity) : () => {});
        this.errorMsg =
            deps.errorMsg ||
            (activity && activity.errorMsg ? activity.errorMsg.bind(activity) : () => {});

        // Initial musical configuration
        this.turtleIndex = deps.turtle !== undefined ? deps.turtle : 0;
        const activeKeyMode = this._resolveActiveKeyAndMode();
        this.rootKey = activeKeyMode.key;
        this.mode = activeKeyMode.mode;
        this.tempo = 120;
        this.octave = 4;
        this.progression = [];
        this.activeStep = -1;
        // Bar grid: number of bars shown in the meter grid (4 bars × 4 beats)
        this.numBars = 4;
        this.beatsPerBar = 4;

        // Initialize audio engine
        const AudioClass =
            deps.ChordBuilderAudio ||
            (typeof ChordBuilderAudio !== "undefined" ? ChordBuilderAudio : null) ||
            (typeof require !== "undefined" ? require("./ChordBuilderAudio") : null);
        this.audio = AudioClass ? new AudioClass(activity, deps) : null;

        // Calculate diatonic chords for current key & mode
        this.diatonicChords = this._buildDiatonicChords(this.rootKey, this.mode);

        // Window creation
        if (typeof window !== "undefined" && window.widgetWindows) {
            this.widgetWindow = window.widgetWindows.windowFor(this, "chord progression");
            this.widgetWindow.clear();
            this.widgetWindow.show();

            this.widgetWindow.onclose = () => {
                this._stopPlayback();
                if (this.logo) {
                    this.logo.insideChordBuilder = false;
                    if (this.logo.chordBuilderWidget === this) {
                        this.logo.chordBuilderWidget = null;
                    }
                }
                this.hideMsgs();
                this.widgetWindow.destroy();
            };

            this._createUI();
        }
    }

    /**
     * Converts a note name (with sharp/flat) into a semitone number 0..11.
     * @param {string} note
     * @returns {number}
     */
    _noteToSemitone(note) {
        if (!note || typeof note !== "string") return 0;
        const clean = note.trim();
        const map = {
            "C": 0,
            "B#": 0,
            "B♯": 0,
            "C#": 1,
            "C♯": 1,
            "Db": 1,
            "D♭": 1,
            "D": 2,
            "D#": 3,
            "D♯": 3,
            "Eb": 3,
            "E♭": 3,
            "E": 4,
            "Fb": 4,
            "F♭": 4,
            "F": 5,
            "E#": 5,
            "E♯": 5,
            "F#": 6,
            "F♯": 6,
            "Gb": 6,
            "G♭": 6,
            "G": 7,
            "G#": 8,
            "G♯": 8,
            "Ab": 8,
            "A♭": 8,
            "A": 9,
            "A#": 10,
            "A♯": 10,
            "Bb": 10,
            "B♭": 10,
            "B": 11,
            "Cb": 11,
            "C♭": 11
        };
        return map[clean] !== undefined ? map[clean] : 0;
    }

    /**
     * Resolves the scale notes for a given root key and mode.
     * Uses MusicBlocks buildScale if available, otherwise falls back to diatonic interval math.
     *
     * @param {string} rootKey
     * @param {string} mode
     * @returns {string[]} 7 diatonic note names
     */
    _getScaleNotes(rootKey, mode) {
        // Try global or required buildScale
        let scaleBuilder = typeof buildScale !== "undefined" ? buildScale : null;
        if (!scaleBuilder && typeof require !== "undefined") {
            try {
                scaleBuilder = require("../utils/musicutils-buildscale.js").buildScale;
            } catch (e) {
                // Ignore
            }
        }

        if (typeof scaleBuilder === "function") {
            try {
                const res = scaleBuilder(`${rootKey} ${mode}`);
                if (res && Array.isArray(res[0]) && res[0].length >= 7) {
                    return res[0].slice(0, 7);
                }
            } catch (e) {
                // Fall back to interval calculation below
            }
        }

        // Standard diatonic interval patterns
        const MODE_INTERVALS = {
            major: [2, 2, 1, 2, 2, 2, 1],
            minor: [2, 1, 2, 2, 1, 2, 2],
            aeolian: [2, 1, 2, 2, 1, 2, 2],
            dorian: [2, 1, 2, 2, 2, 1, 2],
            phrygian: [1, 2, 2, 2, 1, 2, 2],
            lydian: [2, 2, 2, 1, 2, 2, 1],
            mixolydian: [2, 2, 1, 2, 2, 1, 2],
            locrian: [1, 2, 2, 1, 2, 2, 2]
        };

        const intervals = MODE_INTERVALS[mode.toLowerCase()] || MODE_INTERVALS.major;
        const PITCH_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        let currentPitch = this._noteToSemitone(rootKey);
        const notes = [rootKey];

        for (let i = 0; i < 6; i++) {
            currentPitch = (currentPitch + intervals[i]) % 12;
            notes.push(PITCH_NAMES[currentPitch]);
        }

        return notes;
    }

    /**
     * Builds the 7 diatonic triads for the active key and mode.
     * Computes root, 3rd, 5th, 7th, chord quality, Roman numeral, and chord symbol.
     *
     * @param {string} rootKey - Root key (e.g. "C").
     * @param {string} mode - Scale mode (e.g. "major").
     * @returns {object[]} Array of 7 chord definition objects.
     */
    _buildDiatonicChords(rootKey, mode) {
        const scaleNotes = this._getScaleNotes(rootKey, mode);
        const chords = [];
        const scaleLen = scaleNotes.length || 7;
        const count = Math.min(scaleLen, 7);

        for (let i = 0; i < count; i++) {
            const root = scaleNotes[i];
            const third = scaleNotes[(i + 2) % scaleLen];
            const fifth = scaleNotes[(i + 4) % scaleLen];
            const seventh = scaleNotes[(i + 6) % scaleLen];

            const semitoneRoot = this._noteToSemitone(root);
            const semitoneThird = this._noteToSemitone(third);
            const semitoneFifth = this._noteToSemitone(fifth);

            const intervalThird = (semitoneThird - semitoneRoot + 12) % 12;
            const intervalFifth = (semitoneFifth - semitoneRoot + 12) % 12;

            let quality = "major";
            let symbol = "";
            let roman = ChordBuilderWidget.ROMAN_NUMERALS_UPPER[i] || String(i + 1);

            if (intervalThird === 3 && intervalFifth === 7) {
                quality = "minor";
                symbol = "m";
                roman = ChordBuilderWidget.ROMAN_NUMERALS_LOWER[i] || String(i + 1);
            } else if (intervalThird === 3 && intervalFifth === 6) {
                quality = "diminished";
                symbol = "°";
                roman = `${ChordBuilderWidget.ROMAN_NUMERALS_LOWER[i] || String(i + 1)}°`;
            } else if (intervalThird === 4 && intervalFifth === 8) {
                quality = "augmented";
                symbol = "+";
                roman = `${ChordBuilderWidget.ROMAN_NUMERALS_UPPER[i] || String(i + 1)}+`;
            } else {
                quality = "major";
                symbol = "";
                roman = ChordBuilderWidget.ROMAN_NUMERALS_UPPER[i] || String(i + 1);
            }

            chords.push({
                degree: i + 1,
                degreeIndex: i,
                roman,
                name: `${root}${symbol}`,
                root,
                quality,
                notes: [root, third, fifth],
                fullNotes: [root, third, fifth, seventh]
            });
        }

        return chords;
    }

    /**
     * Resolves the active key and mode from turtle state or activity context,
     * defaulting to "C" and "major" if none are set.
     * @private
     * @returns {{ key: string, mode: string }}
     */
    _resolveActiveKeyAndMode() {
        const turtleIndex = this.turtleIndex !== undefined ? this.turtleIndex : 0;
        const turtleObj =
            (this.turtles &&
                typeof this.turtles.ithTurtle === "function" &&
                this.turtles.ithTurtle(turtleIndex)) ||
            (this.activity &&
                this.activity.turtles &&
                typeof this.activity.turtles.ithTurtle === "function" &&
                this.activity.turtles.ithTurtle(turtleIndex)) ||
            null;

        if (turtleObj && turtleObj.singer && turtleObj.singer.keySignature) {
            const parts = turtleObj.singer.keySignature.trim().split(/\s+/);
            if (parts[0]) {
                const k = parts[0];
                const rawMode = parts.slice(1).join(" ").toLowerCase() || "major";
                if (!ChordBuilderWidget.SUPPORTED_MODES.includes(rawMode)) {
                    this.textMsg(
                        _("Mode not supported by chord progression widget. Defaulting to major."),
                        3000
                    );
                    return { key: k, mode: "major" };
                }
                return { key: k, mode: rawMode };
            }
        }
        return { key: "C", mode: "major" };
    }

    /**
     * Synchronizes key and mode from the specified turtle's key signature.
     * @param {number} [turtleIndex=0]
     */
    syncKeyAndModeFromTurtle(turtleIndex = 0) {
        this.turtleIndex = turtleIndex;
        const resolved = this._resolveActiveKeyAndMode();
        if (resolved.key !== this.rootKey || resolved.mode !== this.mode) {
            this.setKeyAndMode(resolved.key, resolved.mode);
        }
    }

    /**
     * Updates key and/or mode and recalculates diatonic chords.
     * @param {string} newKey
     * @param {string} newMode
     */
    setKeyAndMode(newKey, newMode) {
        if (newKey) this.rootKey = newKey;
        if (newMode) {
            const rawMode = newMode.toLowerCase();
            if (!ChordBuilderWidget.SUPPORTED_MODES.includes(rawMode)) {
                this.textMsg(
                    _("Mode not supported by chord progression widget. Defaulting to major."),
                    3000
                );
                this.mode = "major";
            } else {
                this.mode = rawMode;
            }
        }
        this.diatonicChords = this._buildDiatonicChords(this.rootKey, this.mode);
        // Clear progression when key changes — chords from old key are no longer valid
        this.progression = [];
        this._updateKeyModeDisplay();
        this._renderDiatonicChords();
        this._renderBarGrid();
    }

    /**
     * Updates the Key & Mode UI display text.
     * @private
     */
    _updateKeyModeDisplay() {
        if (this.keyDisplay) {
            this.keyDisplay.textContent = this.rootKey;
        }
        if (this.modeDisplay) {
            const modeCap = this.mode ? this.mode.charAt(0).toUpperCase() + this.mode.slice(1) : "";
            this.modeDisplay.textContent = modeCap;
        }
    }

    /**
     * Auditions a chord sound without adding it to the progression sequence.
     * @param {object} chord
     */
    auditionChord(chord) {
        if (!chord) return;
        if (this.audio) {
            this.audio.playChord(chord, 0.4, { octave: this.octave });
        }
    }

    /**
     * Adds a chord to the progression sequence and audits playback.
     * @param {object} chord
     */
    addChord(chord) {
        if (!chord) return;
        const chordClone = { ...chord };
        this.progression.push(chordClone);
        if (this.audio) {
            this.audio.playChord(chordClone, 0.4, { octave: this.octave });
        }
        this._renderBarGrid();
    }

    /**
     * Removes a chord at a specific index from the progression sequence.
     * @param {number} index
     */
    removeChord(index) {
        if (index >= 0 && index < this.progression.length) {
            this.progression.splice(index, 1);
            this._renderBarGrid();
        }
    }

    /**
     * Clears all chords from the progression sequence.
     */
    clearProgression() {
        this._stopPlayback();
        this.progression = [];
        this._renderBarGrid();
    }

    /**
     * Loads a progression preset by key (e.g. "pop", "jazz", "50s", "blues", "canon").
     * @param {string} presetKey
     */
    loadPreset(presetKey) {
        const preset = ChordBuilderWidget.PRESETS[presetKey];
        if (!preset) return;

        this.clearProgression();
        for (const degreeIdx of preset.degrees) {
            if (this.diatonicChords[degreeIdx]) {
                this.progression.push({ ...this.diatonicChords[degreeIdx] });
            }
        }
        this._renderBarGrid();
    }

    /**
     * Starts playback of the active progression sequence.
     */
    playProgression() {
        if (!this.audio || this.progression.length === 0) return;

        this._updatePlayButtonState(true);

        this.audio.playProgression(
            this.progression,
            this.tempo,
            stepIndex => {
                this.activeStep = stepIndex;
                this._highlightActiveStep(stepIndex);
            },
            () => {
                this.activeStep = -1;
                this._highlightActiveStep(-1);
                this._updatePlayButtonState(false);
            },
            { octave: this.octave }
        );
    }

    /**
     * Stops progression playback.
     * @private
     */
    _stopPlayback() {
        if (this.audio) {
            this.audio.stop();
        }
        this.activeStep = -1;
        this._highlightActiveStep(-1);
        this._updatePlayButtonState(false);
    }

    /**
     * Exports the current progression as MusicBlocks block structures onto the canvas.
     * The export omits BPM (the user sets that via Set Beats Per Minute block) and
     * does not include extra vspace spacer blocks.
     */
    saveToBlocks() {
        if (!this.blocks || typeof this.blocks.loadNewBlocks !== "function") {
            this.errorMsg(_("Cannot save: blocks engine is unavailable."));
            return;
        }

        if (this.progression.every(chord => chord === null)) {
            this.errorMsg(_("Add chords to your progression before saving."));
            return;
        }

        const newStack = [];
        let idCounter = 0;
        const startX = 120;
        const startY = 120;

        // Block 0: Start block — BPM is intentionally omitted; the user controls
        // tempo via the Set Beats Per Minute block on the canvas.
        const startBlockId = idCounter++;
        newStack.push([startBlockId, ["start", {}], startX, startY, [null, null]]);

        let lastFlowId = startBlockId;
        let lastFlowConnIndex = 1; // flow connection slot for start block

        this.progression.forEach(chord => {
            if (chord === null) {
                const noteBlockId = idCounter++;
                const durationId = idCounter++;
                const durationNumeratorId = idCounter++;
                const durationDenominatorId = idCounter++;
                const restId = idCounter++;
                const noteEndId = idCounter++;

                newStack.push([
                    noteBlockId,
                    ["newnote", {}],
                    0,
                    0,
                    [lastFlowId, durationId, restId, noteEndId]
                ]);
                newStack.push([
                    durationId,
                    ["divide", {}],
                    0,
                    0,
                    [noteBlockId, durationNumeratorId, durationDenominatorId]
                ]);
                newStack.push([durationNumeratorId, ["number", { value: 1 }], 0, 0, [durationId]]);
                newStack.push([
                    durationDenominatorId,
                    ["number", { value: 4 }],
                    0,
                    0,
                    [durationId]
                ]);
                newStack.push([restId, ["rest2", {}], 0, 0, [noteBlockId, null]]);
                newStack.push([noteEndId, ["hidden", {}], 0, 0, [noteBlockId, null]]);

                newStack[lastFlowId][4][lastFlowConnIndex] = noteBlockId;
                lastFlowId = noteEndId;
                lastFlowConnIndex = 1;
                return;
            }

            const chordBlockId = idCounter++;
            const chordNameId = idCounter++;
            const noteBlockId = idCounter++;
            const durationId = idCounter++;
            const durationNumeratorId = idCounter++;
            const durationDenominatorId = idCounter++;
            const pitchBlockId = idCounter++;
            const rootId = idCounter++;
            const octaveId = idCounter++;
            const noteEndId = idCounter++;
            const chordEndId = idCounter++;

            // Map chord quality to MusicBlocks chord type
            let chordType = "major";
            if (chord.quality === "minor") chordType = "minor";
            else if (chord.quality === "diminished") chordType = "diminished";
            else if (chord.quality === "augmented") chordType = "augmented";

            newStack.push([
                chordBlockId,
                ["chordinterval", {}],
                0,
                0,
                [lastFlowId, chordNameId, noteBlockId, chordEndId]
            ]);
            newStack.push([chordNameId, ["chordname", { value: chordType }], 0, 0, [chordBlockId]]);
            // Connect newnote body slot directly to pitch — no vspace needed
            newStack.push([
                noteBlockId,
                ["newnote", {}],
                0,
                0,
                [chordBlockId, durationId, pitchBlockId, noteEndId]
            ]);
            newStack.push([
                durationId,
                ["divide", {}],
                0,
                0,
                [noteBlockId, durationNumeratorId, durationDenominatorId]
            ]);
            newStack.push([durationNumeratorId, ["number", { value: 1 }], 0, 0, [durationId]]);
            newStack.push([durationDenominatorId, ["number", { value: 4 }], 0, 0, [durationId]]);
            newStack.push([
                pitchBlockId,
                ["pitch", {}],
                0,
                0,
                [noteBlockId, rootId, octaveId, null]
            ]);
            newStack.push([rootId, ["notename", { value: chord.root }], 0, 0, [pitchBlockId]]);
            newStack.push([octaveId, ["number", { value: this.octave }], 0, 0, [pitchBlockId]]);
            newStack.push([noteEndId, ["hidden", {}], 0, 0, [noteBlockId, null]]);
            newStack.push([chordEndId, ["hidden", {}], 0, 0, [chordBlockId, null]]);

            // Link previous block's flow slot to this chord block
            newStack[lastFlowId][4][lastFlowConnIndex] = chordBlockId;
            lastFlowId = chordEndId;
            lastFlowConnIndex = 1;
        });

        this.blocks.loadNewBlocks(newStack);
        this.textMsg(_("New chord progression blocks generated."), 3000);
    }

    /**
     * Constructs the widget UI inside widgetWindow body.
     * @private
     */
    _createUI() {
        if (!this.widgetWindow) return;
        const body = this.widgetWindow.getWidgetBody();
        body.innerHTML = "";

        // Root container with styling
        const container = document.createElement("div");
        container.id = "chordBuilderContainer";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.padding = "16px";
        container.style.gap = "14px";
        container.style.fontFamily = "inherit";
        container.style.userSelect = "none";

        // Top Toolbar: Key & Scale info badge, Presets
        const controlsRow = document.createElement("div");
        controlsRow.style.display = "flex";
        controlsRow.style.flexWrap = "wrap";
        controlsRow.style.alignItems = "center";
        controlsRow.style.justifyContent = "space-between";
        controlsRow.style.gap = "10px";
        controlsRow.style.padding = "8px 12px";
        controlsRow.style.background = "rgba(0, 0, 0, 0.04)";
        controlsRow.style.borderRadius = "8px";

        // Display user-specified key and scale/mode
        const keyModeGroup = document.createElement("div");
        keyModeGroup.style.display = "flex";
        keyModeGroup.style.alignItems = "center";
        keyModeGroup.style.gap = "8px";

        const badgeStyle =
            "display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: rgba(0, 0, 0, 0.06); border-radius: 4px; font-size: 13px;";

        const keyBadge = document.createElement("span");
        keyBadge.style.cssText = badgeStyle;
        const keyLabel = document.createElement("span");
        keyLabel.style.color = "#666";
        keyLabel.textContent = `${_("Key")}:`;
        this.keyDisplay = document.createElement("strong");
        this.keyDisplay.id = "chordKeyDisplay";
        this.keyDisplay.textContent = this.rootKey;
        keyBadge.append(keyLabel, this.keyDisplay);

        const modeBadge = document.createElement("span");
        modeBadge.style.cssText = badgeStyle;
        const modeLabel = document.createElement("span");
        modeLabel.style.color = "#666";
        modeLabel.textContent = `${_("Scale")}:`;
        this.modeDisplay = document.createElement("strong");
        this.modeDisplay.id = "chordModeDisplay";
        const modeCap = this.mode ? this.mode.charAt(0).toUpperCase() + this.mode.slice(1) : "";
        this.modeDisplay.textContent = modeCap;
        modeBadge.append(modeLabel, this.modeDisplay);

        keyModeGroup.append(keyBadge, modeBadge);

        // Presets selector
        const presetGroup = document.createElement("div");
        presetGroup.style.display = "flex";
        presetGroup.style.alignItems = "center";
        presetGroup.style.gap = "6px";

        const presetLabel = document.createElement("span");
        presetLabel.textContent = `${_("Preset")}:`;
        presetLabel.style.fontSize = "13px";
        presetLabel.style.color = "#555";

        const presetSelect = document.createElement("select");
        presetSelect.id = "chordPresetSelect";
        presetSelect.style.padding = "4px 8px";
        presetSelect.style.borderRadius = "4px";
        presetSelect.style.fontSize = "12px";

        const defaultPresetOpt = document.createElement("option");
        defaultPresetOpt.value = "";
        defaultPresetOpt.textContent = `-- ${_("Choose Preset")} --`;
        presetSelect.appendChild(defaultPresetOpt);

        for (const [key, p] of Object.entries(ChordBuilderWidget.PRESETS)) {
            const opt = document.createElement("option");
            opt.value = key;
            opt.textContent = p.label;
            presetSelect.appendChild(opt);
        }
        presetSelect.onchange = e => {
            if (e.target.value) {
                this.loadPreset(e.target.value);
                presetSelect.value = "";
            }
        };
        presetGroup.append(presetLabel, presetSelect);

        controlsRow.append(keyModeGroup, presetGroup);
        container.appendChild(controlsRow);

        // Section 1: Diatonic Chords Panel
        const chordsSection = document.createElement("div");
        const chordsHeaderRow = document.createElement("div");
        chordsHeaderRow.style.display = "flex";
        chordsHeaderRow.style.justifyContent = "space-between";
        chordsHeaderRow.style.alignItems = "center";
        chordsHeaderRow.style.marginBottom = "6px";

        const chordsTitle = document.createElement("div");
        chordsTitle.style.fontWeight = "bold";
        chordsTitle.style.fontSize = "13px";
        chordsTitle.textContent = _("Diatonic Chords");

        const chordsHint = document.createElement("div");
        chordsHint.style.fontSize = "11px";
        chordsHint.style.color = "#888";
        chordsHint.textContent = _("Click card to audition · Click + to add");

        chordsHeaderRow.append(chordsTitle, chordsHint);
        chordsSection.appendChild(chordsHeaderRow);

        this.chordsGrid = document.createElement("div");
        this.chordsGrid.id = "diatonicChordsGrid";
        this.chordsGrid.style.display = "grid";
        this.chordsGrid.style.gridTemplateColumns = "repeat(7, 1fr)";
        this.chordsGrid.style.gap = "8px";
        chordsSection.appendChild(this.chordsGrid);
        container.appendChild(chordsSection);

        // Section 2: Bar grid — shows bars × beats for the user to place chords
        const barGridSection = document.createElement("div");
        const barGridHeaderRow = document.createElement("div");
        barGridHeaderRow.style.display = "flex";
        barGridHeaderRow.style.justifyContent = "space-between";
        barGridHeaderRow.style.alignItems = "center";
        barGridHeaderRow.style.marginBottom = "8px";

        const barGridTitle = document.createElement("div");
        barGridTitle.style.fontWeight = "bold";
        barGridTitle.style.fontSize = "13px";
        barGridTitle.textContent = _("Progression (bars)");

        // Meter controls: number of bars and beats per bar
        const meterGroup = document.createElement("div");
        meterGroup.style.display = "flex";
        meterGroup.style.alignItems = "center";
        meterGroup.style.gap = "8px";
        meterGroup.style.fontSize = "12px";
        meterGroup.style.color = "#555";

        const barsLabel = document.createElement("span");
        barsLabel.textContent = `${_("Bars")}:`;
        const barsInput = document.createElement("input");
        barsInput.id = "chordNumBarsInput";
        barsInput.type = "number";
        barsInput.min = "1";
        barsInput.max = "16";
        barsInput.value = String(this.numBars);
        barsInput.style.width = "48px";
        barsInput.style.padding = "2px 4px";
        barsInput.style.borderRadius = "4px";
        barsInput.style.border = "1px solid #ccc";
        barsInput.style.fontSize = "12px";
        barsInput.onchange = e => {
            const n = parseInt(e.target.value, 10);
            if (n >= 1 && n <= 16) {
                this.numBars = n;
                this._renderBarGrid();
            }
        };

        const beatsLabel = document.createElement("span");
        beatsLabel.textContent = `${_("Beats")}:`;
        const beatsSelect = document.createElement("select");
        beatsSelect.id = "chordBeatsSelect";
        beatsSelect.style.padding = "2px 4px";
        beatsSelect.style.borderRadius = "4px";
        beatsSelect.style.fontSize = "12px";
        [2, 3, 4, 6].forEach(n => {
            const opt = document.createElement("option");
            opt.value = String(n);
            opt.textContent = String(n);
            if (n === this.beatsPerBar) opt.selected = true;
            beatsSelect.appendChild(opt);
        });
        beatsSelect.onchange = e => {
            this.beatsPerBar = parseInt(e.target.value, 10);
            this._renderBarGrid();
        };

        meterGroup.append(barsLabel, barsInput, beatsLabel, beatsSelect);
        barGridHeaderRow.append(barGridTitle, meterGroup);
        barGridSection.appendChild(barGridHeaderRow);

        // The bar-grid container: bars are rows, beats are columns
        this.barGridContainer = document.createElement("div");
        this.barGridContainer.id = "chordBarGrid";
        this.barGridContainer.style.overflowX = "auto";
        this.barGridContainer.style.border = "1px solid rgba(0,0,0,0.12)";
        this.barGridContainer.style.borderRadius = "8px";
        this.barGridContainer.style.padding = "8px";
        this.barGridContainer.style.background = "rgba(0,0,0,0.02)";
        barGridSection.appendChild(this.barGridContainer);
        container.appendChild(barGridSection);

        // Section 3: Action Buttons (Play, Stop, Clear, Save)
        const actionsRow = document.createElement("div");
        actionsRow.style.display = "flex";
        actionsRow.style.gap = "10px";
        actionsRow.style.marginTop = "2px";

        this.playBtn = document.createElement("button");
        this.playBtn.id = "chordPlayBtn";
        this.playBtn.textContent = `▶ ${_("Play")}`;
        this.playBtn.style.padding = "7px 16px";
        this.playBtn.style.fontWeight = "bold";
        this.playBtn.style.borderRadius = "6px";
        this.playBtn.style.cursor = "pointer";
        this.playBtn.onclick = () => {
            if (this.audio && this.audio.isPlaying) {
                this._stopPlayback();
            } else {
                this.playProgression();
            }
        };

        const clearBtn = document.createElement("button");
        clearBtn.id = "chordClearBtn";
        clearBtn.textContent = `🗑 ${_("Clear")}`;
        clearBtn.style.padding = "7px 14px";
        clearBtn.style.borderRadius = "6px";
        clearBtn.style.cursor = "pointer";
        clearBtn.onclick = () => this.clearProgression();

        const saveBtn = document.createElement("button");
        saveBtn.id = "chordSaveBtn";
        saveBtn.textContent = `💾 ${_("Save to Canvas")}`;
        saveBtn.style.padding = "7px 16px";
        saveBtn.style.fontWeight = "bold";
        saveBtn.style.borderRadius = "6px";
        saveBtn.style.cursor = "pointer";
        saveBtn.onclick = () => this.saveToBlocks();

        actionsRow.append(this.playBtn, clearBtn, saveBtn);
        container.appendChild(actionsRow);

        body.appendChild(container);

        // Initial render of chords, bar-grid, and timeline
        this._renderDiatonicChords();
        this._renderBarGrid();
    }

    /**
     * Renders the 7 diatonic chord cards in the grid.
     * @private
     */
    _renderDiatonicChords() {
        if (!this.chordsGrid) return;
        this.chordsGrid.innerHTML = "";

        this.diatonicChords.forEach(chord => {
            const card = document.createElement("div");
            card.className = "diatonic-chord-card";
            card.setAttribute("role", "button");
            card.setAttribute("tabindex", "0");
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.alignItems = "center";
            card.style.padding = "8px 6px";
            card.style.border = "1px solid rgba(0, 0, 0, 0.15)";
            card.style.borderRadius = "6px";
            card.style.background = "rgba(255, 255, 255, 0.95)";
            card.style.cursor = "pointer";
            card.style.transition = "transform 0.1s, box-shadow 0.1s, background-color 0.15s";
            card.style.position = "relative";
            card.title = _("Click to audition");

            const romanSpan = document.createElement("span");
            romanSpan.style.fontSize = "16px";
            romanSpan.style.fontWeight = "bold";
            romanSpan.textContent = chord.roman;

            const nameSpan = document.createElement("span");
            nameSpan.style.fontSize = "13px";
            nameSpan.style.color = "#444";
            nameSpan.textContent = chord.name;

            const notesSpan = document.createElement("span");
            notesSpan.style.fontSize = "10px";
            notesSpan.style.color = "#777";
            notesSpan.textContent = chord.notes.join(" ");

            const addBtn = document.createElement("button");
            addBtn.className = "chord-card-add-btn";
            addBtn.textContent = "+";
            addBtn.title = _("Add to progression");
            addBtn.style.marginTop = "6px";
            addBtn.style.padding = "2px 10px";
            addBtn.style.fontSize = "12px";
            addBtn.style.fontWeight = "bold";
            addBtn.style.borderRadius = "10px";
            addBtn.style.border = "1px solid #4a90e2";
            addBtn.style.background = "#eef4fd";
            addBtn.style.color = "#2a62a7";
            addBtn.style.cursor = "pointer";
            addBtn.onclick = e => {
                e.stopPropagation();
                this.addChord(chord);
            };
            addBtn.onkeydown = e => {
                e.stopPropagation();
            };

            card.append(romanSpan, nameSpan, notesSpan, addBtn);

            // Clicking card auditions chord without adding
            card.onclick = () => {
                this.auditionChord(chord);
                card.style.background = "#eef7ff";
                setTimeout(() => {
                    card.style.background = "rgba(255, 255, 255, 0.95)";
                }, 200);
            };

            card.onkeydown = e => {
                if (e.target !== card) return;
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    this.auditionChord(chord);
                }
            };

            this.chordsGrid.appendChild(card);
        });
    }

    /**
     * Renders the meter bar-grid: rows = bars, columns = beats.
     * Each bar cell shows the chord assigned to that position and a remove button.
     * Clicking an empty cell shows a chord-picker populated with diatonic chords.
     * @private
     */
    _renderBarGrid() {
        if (!this.barGridContainer) return;
        this.barGridContainer.innerHTML = "";

        const table = document.createElement("table");
        table.id = "chordBarGridTable";
        table.style.borderCollapse = "collapse";
        table.style.width = "100%";
        table.style.tableLayout = "fixed";

        // Header row: beat numbers
        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");
        const cornerTh = document.createElement("th");
        cornerTh.style.width = "42px";
        cornerTh.style.padding = "4px 6px";
        cornerTh.style.fontSize = "11px";
        cornerTh.style.color = "#888";
        cornerTh.style.textAlign = "center";
        cornerTh.textContent = _("Bar");
        headerRow.appendChild(cornerTh);

        for (let b = 1; b <= this.beatsPerBar; b++) {
            const th = document.createElement("th");
            th.style.padding = "4px";
            th.style.fontSize = "11px";
            th.style.color = "#888";
            th.style.textAlign = "center";
            th.style.fontWeight = "normal";
            th.textContent = `${_("Beat")} ${b}`;
            headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement("tbody");

        for (let bar = 0; bar < this.numBars; bar++) {
            const tr = document.createElement("tr");

            // Bar label cell
            const barLabelTd = document.createElement("td");
            barLabelTd.style.padding = "4px 6px";
            barLabelTd.style.fontSize = "11px";
            barLabelTd.style.color = "#666";
            barLabelTd.style.textAlign = "center";
            barLabelTd.style.fontWeight = "bold";
            barLabelTd.style.background = "rgba(0,0,0,0.03)";
            barLabelTd.style.borderRight = "1px solid rgba(0,0,0,0.08)";
            barLabelTd.textContent = `${bar + 1}`;
            tr.appendChild(barLabelTd);

            for (let beat = 0; beat < this.beatsPerBar; beat++) {
                const cellIndex = bar * this.beatsPerBar + beat;
                const chord = this.progression[cellIndex] || null;

                const td = document.createElement("td");
                td.className = "bar-grid-cell";
                td.dataset.cellIndex = String(cellIndex);
                td.style.padding = "4px";
                td.style.border = "1px solid rgba(0,0,0,0.08)";
                td.style.verticalAlign = "top";
                td.style.minWidth = "70px";
                td.style.minHeight = "50px";
                td.style.position = "relative";

                if (chord) {
                    // Filled cell: show chord name + remove button
                    const isActive = cellIndex === this.activeStep;
                    td.style.background = isActive ? "#ffd700" : "#eef4fd";
                    td.style.border = isActive
                        ? "2px solid #f0a500"
                        : "1px solid rgba(74,144,226,0.4)";

                    const chordLabel = document.createElement("div");
                    chordLabel.style.fontWeight = "bold";
                    chordLabel.style.fontSize = "13px";
                    chordLabel.style.textAlign = "center";
                    chordLabel.style.color = "#2a62a7";
                    chordLabel.style.cursor = "pointer";
                    chordLabel.title = _("Click to audition");
                    chordLabel.textContent = chord.roman;
                    chordLabel.onclick = () => this.auditionChord(chord);

                    const chordName = document.createElement("div");
                    chordName.style.fontSize = "10px";
                    chordName.style.textAlign = "center";
                    chordName.style.color = "#555";
                    chordName.textContent = chord.name;

                    const removeBtn = document.createElement("button");
                    removeBtn.className = "bar-grid-remove-btn";
                    removeBtn.textContent = "✕";
                    removeBtn.title = _("Remove chord");
                    removeBtn.style.position = "absolute";
                    removeBtn.style.top = "2px";
                    removeBtn.style.right = "2px";
                    removeBtn.style.padding = "0 3px";
                    removeBtn.style.fontSize = "10px";
                    removeBtn.style.lineHeight = "14px";
                    removeBtn.style.border = "none";
                    removeBtn.style.background = "transparent";
                    removeBtn.style.color = "#999";
                    removeBtn.style.cursor = "pointer";
                    removeBtn.onclick = e => {
                        e.stopPropagation();
                        this.removeChord(cellIndex);
                    };

                    td.appendChild(chordLabel);
                    td.appendChild(chordName);
                    td.appendChild(removeBtn);
                } else {
                    // Empty cell: clicking opens chord picker inline
                    td.style.background = "transparent";
                    td.style.cursor = "pointer";
                    td.style.textAlign = "center";
                    td.style.color = "#bbb";
                    td.style.fontSize = "20px";
                    td.style.lineHeight = "50px";
                    td.title = _("Click to add chord");
                    td.textContent = "+";

                    td.onclick = () => {
                        // Show an inline chord-picker dropdown in this cell
                        td.innerHTML = "";
                        td.style.lineHeight = "";
                        const picker = document.createElement("select");
                        picker.style.width = "100%";
                        picker.style.fontSize = "11px";
                        picker.style.padding = "2px";

                        const blankOpt = document.createElement("option");
                        blankOpt.value = "";
                        blankOpt.textContent = `-- ${_("pick")} --`;
                        picker.appendChild(blankOpt);

                        this.diatonicChords.forEach((c, idx) => {
                            const opt = document.createElement("option");
                            opt.value = String(idx);
                            opt.textContent = `${c.roman} — ${c.name}`;
                            picker.appendChild(opt);
                        });

                        picker.onchange = e => {
                            const idx = parseInt(e.target.value, 10);
                            if (!isNaN(idx) && this.diatonicChords[idx]) {
                                // Insert chord at cellIndex position, padding with nulls if needed
                                while (this.progression.length < cellIndex) {
                                    this.progression.push(null);
                                }
                                if (cellIndex < this.progression.length) {
                                    this.progression[cellIndex] = { ...this.diatonicChords[idx] };
                                } else {
                                    this.progression.push({ ...this.diatonicChords[idx] });
                                }
                                this.auditionChord(this.diatonicChords[idx]);
                                this._renderBarGrid();
                            }
                        };

                        picker.onblur = () => this._renderBarGrid();
                        td.appendChild(picker);
                        picker.focus();
                    };
                }

                tr.appendChild(td);
            }

            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        this.barGridContainer.appendChild(table);
    }

    /**
     * Highlights the progression chip currently playing.
     * @private
     * @param {number} activeIndex
     */
    _highlightActiveStep(activeIndex) {
        // Highlight bar-grid cells
        if (this.barGridContainer) {
            const cells = this.barGridContainer.querySelectorAll(".bar-grid-cell");
            cells.forEach(cell => {
                const idx = parseInt(cell.dataset.cellIndex, 10);
                const chord = this.progression[idx] || null;
                if (!chord) return;
                if (idx === activeIndex) {
                    cell.style.background = "#ffd700";
                    cell.style.border = "2px solid #f0a500";
                } else {
                    cell.style.background = "#eef4fd";
                    cell.style.border = "1px solid rgba(74,144,226,0.4)";
                }
            });
        }
    }

    /**
     * Updates the Play button label/styling when playing vs stopped.
     * @private
     * @param {boolean} isPlaying
     */
    _updatePlayButtonState(isPlaying) {
        if (!this.playBtn) return;
        if (isPlaying) {
            this.playBtn.textContent = `⏹ ${_("Stop")}`;
            this.playBtn.style.background = "#e74c3c";
            this.playBtn.style.color = "#ffffff";
        } else {
            this.playBtn.textContent = `▶ ${_("Play")}`;
            this.playBtn.style.background = "";
            this.playBtn.style.color = "";
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ChordBuilderWidget;
}
