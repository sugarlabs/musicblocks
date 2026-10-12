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
        this.rootKey = "C";
        this.mode = "major";
        this.tempo = 120;
        this.octave = 4;
        this.progression = [];
        this.activeStep = -1;

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

        for (let i = 0; i < 7; i++) {
            const root = scaleNotes[i];
            const third = scaleNotes[(i + 2) % 7];
            const fifth = scaleNotes[(i + 4) % 7];
            const seventh = scaleNotes[(i + 6) % 7];

            const semitoneRoot = this._noteToSemitone(root);
            const semitoneThird = this._noteToSemitone(third);
            const semitoneFifth = this._noteToSemitone(fifth);

            const intervalThird = (semitoneThird - semitoneRoot + 12) % 12;
            const intervalFifth = (semitoneFifth - semitoneRoot + 12) % 12;

            let quality = "major";
            let symbol = "";
            let roman = ChordBuilderWidget.ROMAN_NUMERALS_UPPER[i];

            if (intervalThird === 3 && intervalFifth === 7) {
                quality = "minor";
                symbol = "m";
                roman = ChordBuilderWidget.ROMAN_NUMERALS_LOWER[i];
            } else if (intervalThird === 3 && intervalFifth === 6) {
                quality = "diminished";
                symbol = "°";
                roman = `${ChordBuilderWidget.ROMAN_NUMERALS_LOWER[i]}°`;
            } else if (intervalThird === 4 && intervalFifth === 8) {
                quality = "augmented";
                symbol = "+";
                roman = `${ChordBuilderWidget.ROMAN_NUMERALS_UPPER[i]}+`;
            } else {
                quality = "major";
                symbol = "";
                roman = ChordBuilderWidget.ROMAN_NUMERALS_UPPER[i];
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
     * Updates key and/or mode and recalculates diatonic chords.
     * @param {string} newKey
     * @param {string} newMode
     */
    setKeyAndMode(newKey, newMode) {
        if (newKey) this.rootKey = newKey;
        if (newMode) this.mode = newMode;
        this.diatonicChords = this._buildDiatonicChords(this.rootKey, this.mode);
        this._renderDiatonicChords();
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
        this._renderProgressionTimeline();
    }

    /**
     * Removes a chord at a specific index from the progression sequence.
     * @param {number} index
     */
    removeChord(index) {
        if (index >= 0 && index < this.progression.length) {
            this.progression.splice(index, 1);
            this._renderProgressionTimeline();
        }
    }

    /**
     * Clears all chords from the progression sequence.
     */
    clearProgression() {
        this._stopPlayback();
        this.progression = [];
        this._renderProgressionTimeline();
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
        this._renderProgressionTimeline();
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
     */
    saveToBlocks() {
        if (!this.blocks || typeof this.blocks.loadNewBlocks !== "function") {
            this.errorMsg(_("Cannot save: blocks engine is unavailable."));
            return;
        }

        if (this.progression.length === 0) {
            this.errorMsg(_("Add chords to your progression before saving."));
            return;
        }

        const newStack = [];
        let idCounter = 0;
        const startX = 120;
        const startY = 120;

        // Block 0: Start block
        const startBlockId = idCounter++;
        const setBpmBlockId = idCounter++;
        const bpmValId = idCounter++;

        newStack.push([startBlockId, ["start", {}], startX, startY, [null, setBpmBlockId]]);
        newStack.push([setBpmBlockId, ["setbpm", {}], 0, 0, [startBlockId, bpmValId, null, null]]);
        newStack.push([bpmValId, ["number", { value: this.tempo }], 0, 0, [setBpmBlockId]]);

        let lastFlowId = setBpmBlockId;
        let lastFlowConnIndex = 2; // flow connection slot

        this.progression.forEach(chord => {
            const chordBlockId = idCounter++;
            const chordNameId = idCounter++;
            const noteBlockId = idCounter++;
            const durationId = idCounter++;
            const durationNumeratorId = idCounter++;
            const durationDenominatorId = idCounter++;
            const noteBodyId = idCounter++;
            const pitchBlockId = idCounter++;
            const rootId = idCounter++;
            const octaveId = idCounter++;
            const noteEndId = idCounter++;

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
                [lastFlowId, chordNameId, noteBlockId, null]
            ]);
            newStack.push([chordNameId, ["chordname", { value: chordType }], 0, 0, [chordBlockId]]);
            newStack.push([
                noteBlockId,
                ["newnote", {}],
                0,
                0,
                [chordBlockId, durationId, noteBodyId, noteEndId]
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
            newStack.push([noteBodyId, ["vspace", {}], 0, 0, [noteBlockId, pitchBlockId]]);
            newStack.push([
                pitchBlockId,
                ["pitch", {}],
                0,
                0,
                [noteBodyId, rootId, octaveId, null]
            ]);
            newStack.push([rootId, ["notename", { value: chord.root }], 0, 0, [pitchBlockId]]);
            newStack.push([octaveId, ["number", { value: this.octave }], 0, 0, [pitchBlockId]]);
            newStack.push([noteEndId, ["hidden", {}], 0, 0, [noteBlockId, null]]);

            // Link previous block to this chord block
            newStack[lastFlowId][4][lastFlowConnIndex] = chordBlockId;
            lastFlowId = chordBlockId;
            lastFlowConnIndex = 3;
        });

        // Terminate stack with vspace
        const vspaceId = idCounter++;
        newStack.push([vspaceId, ["vspace", {}], 0, 0, [lastFlowId, null]]);
        newStack[lastFlowId][4][lastFlowConnIndex] = vspaceId;

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

        // Top Toolbar: Key, Mode, Tempo, Presets
        const controlsRow = document.createElement("div");
        controlsRow.style.display = "flex";
        controlsRow.style.flexWrap = "wrap";
        controlsRow.style.alignItems = "center";
        controlsRow.style.gap = "12px";
        controlsRow.style.padding = "8px 12px";
        controlsRow.style.background = "rgba(0, 0, 0, 0.05)";
        controlsRow.style.borderRadius = "8px";

        // Key selector
        const keyLabel = document.createElement("label");
        keyLabel.textContent = `${_("Key")}: `;
        keyLabel.style.fontWeight = "bold";
        const keySelect = document.createElement("select");
        keySelect.id = "chordKeySelect";
        keySelect.style.padding = "4px 8px";
        keySelect.style.borderRadius = "4px";
        ChordBuilderWidget.ROOT_KEYS.forEach(k => {
            const opt = document.createElement("option");
            opt.value = k;
            opt.textContent = k;
            if (k === this.rootKey) opt.selected = true;
            keySelect.appendChild(opt);
        });
        keySelect.onchange = e => this.setKeyAndMode(e.target.value, this.mode);
        keyLabel.appendChild(keySelect);

        // Mode selector
        const modeLabel = document.createElement("label");
        modeLabel.textContent = `${_("Scale")}: `;
        modeLabel.style.fontWeight = "bold";
        const modeSelect = document.createElement("select");
        modeSelect.id = "chordModeSelect";
        modeSelect.style.padding = "4px 8px";
        modeSelect.style.borderRadius = "4px";
        ChordBuilderWidget.SUPPORTED_MODES.forEach(m => {
            const opt = document.createElement("option");
            opt.value = m;
            opt.textContent = m.charAt(0).toUpperCase() + m.slice(1);
            if (m === this.mode) opt.selected = true;
            modeSelect.appendChild(opt);
        });
        modeSelect.onchange = e => this.setKeyAndMode(this.rootKey, e.target.value);
        modeLabel.appendChild(modeSelect);

        // Tempo input
        const tempoLabel = document.createElement("label");
        tempoLabel.textContent = `${_("BPM")}: `;
        tempoLabel.style.fontWeight = "bold";
        const tempoInput = document.createElement("input");
        tempoInput.id = "chordTempoInput";
        tempoInput.type = "number";
        tempoInput.min = "40";
        tempoInput.max = "240";
        tempoInput.value = String(this.tempo);
        tempoInput.style.width = "60px";
        tempoInput.style.padding = "4px";
        tempoInput.style.borderRadius = "4px";
        tempoInput.onchange = e => {
            this.tempo = Math.max(40, Math.min(240, Number(e.target.value) || 120));
        };
        tempoLabel.appendChild(tempoInput);

        // Presets selector
        const presetLabel = document.createElement("label");
        presetLabel.textContent = `${_("Presets")}: `;
        presetLabel.style.fontWeight = "bold";
        const presetSelect = document.createElement("select");
        presetSelect.id = "chordPresetSelect";
        presetSelect.style.padding = "4px 8px";
        presetSelect.style.borderRadius = "4px";

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
        presetLabel.appendChild(presetSelect);

        controlsRow.append(keyLabel, modeLabel, tempoLabel, presetLabel);
        container.appendChild(controlsRow);

        // Section 1: Diatonic Chords Panel
        const chordsSection = document.createElement("div");
        const chordsTitle = document.createElement("div");
        chordsTitle.style.fontWeight = "bold";
        chordsTitle.style.fontSize = "14px";
        chordsTitle.style.marginBottom = "6px";
        chordsTitle.textContent = _("Diatonic Chords (Click to Audition & Add):");
        chordsSection.appendChild(chordsTitle);

        this.chordsGrid = document.createElement("div");
        this.chordsGrid.id = "diatonicChordsGrid";
        this.chordsGrid.style.display = "grid";
        this.chordsGrid.style.gridTemplateColumns = "repeat(7, 1fr)";
        this.chordsGrid.style.gap = "8px";
        chordsSection.appendChild(this.chordsGrid);
        container.appendChild(chordsSection);

        // Section 2: Progression Timeline
        const progressionSection = document.createElement("div");
        const progressionTitle = document.createElement("div");
        progressionTitle.style.fontWeight = "bold";
        progressionTitle.style.fontSize = "14px";
        progressionTitle.style.marginBottom = "6px";
        progressionTitle.textContent = _("Progression Sequence:");
        progressionSection.appendChild(progressionTitle);

        this.timelineContainer = document.createElement("div");
        this.timelineContainer.id = "progressionTimeline";
        this.timelineContainer.style.display = "flex";
        this.timelineContainer.style.flexWrap = "wrap";
        this.timelineContainer.style.gap = "8px";
        this.timelineContainer.style.minHeight = "48px";
        this.timelineContainer.style.padding = "8px";
        this.timelineContainer.style.border = "1px dashed rgba(0, 0, 0, 0.2)";
        this.timelineContainer.style.borderRadius = "8px";
        this.timelineContainer.style.alignItems = "center";
        progressionSection.appendChild(this.timelineContainer);
        container.appendChild(progressionSection);

        // Section 3: Action Buttons (Play, Stop, Clear, Save)
        const actionsRow = document.createElement("div");
        actionsRow.style.display = "flex";
        actionsRow.style.gap = "10px";
        actionsRow.style.marginTop = "4px";

        this.playBtn = document.createElement("button");
        this.playBtn.id = "chordPlayBtn";
        this.playBtn.textContent = `▶ ${_("Play")}`;
        this.playBtn.style.padding = "8px 16px";
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
        clearBtn.style.padding = "8px 14px";
        clearBtn.style.borderRadius = "6px";
        clearBtn.style.cursor = "pointer";
        clearBtn.onclick = () => this.clearProgression();

        const saveBtn = document.createElement("button");
        saveBtn.id = "chordSaveBtn";
        saveBtn.textContent = `💾 ${_("Save to Canvas")}`;
        saveBtn.style.padding = "8px 16px";
        saveBtn.style.fontWeight = "bold";
        saveBtn.style.borderRadius = "6px";
        saveBtn.style.cursor = "pointer";
        saveBtn.onclick = () => this.saveToBlocks();

        actionsRow.append(this.playBtn, clearBtn, saveBtn);
        container.appendChild(actionsRow);

        body.appendChild(container);

        // Initial render of chords and timeline
        this._renderDiatonicChords();
        this._renderProgressionTimeline();
    }

    /**
     * Renders the 7 diatonic chord cards in the grid.
     * @private
     */
    _renderDiatonicChords() {
        if (!this.chordsGrid) return;
        this.chordsGrid.innerHTML = "";

        this.diatonicChords.forEach(chord => {
            const card = document.createElement("button");
            card.className = "diatonic-chord-card";
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.alignItems = "center";
            card.style.padding = "10px 6px";
            card.style.border = "1px solid rgba(0, 0, 0, 0.15)";
            card.style.borderRadius = "6px";
            card.style.background = "rgba(255, 255, 255, 0.9)";
            card.style.cursor = "pointer";
            card.style.transition = "transform 0.1s, box-shadow 0.1s";

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

            card.append(romanSpan, nameSpan, notesSpan);

            card.onclick = () => this.addChord(chord);

            this.chordsGrid.appendChild(card);
        });
    }

    /**
     * Renders the progression timeline chips.
     * @private
     */
    _renderProgressionTimeline() {
        if (!this.timelineContainer) return;
        this.timelineContainer.innerHTML = "";

        if (this.progression.length === 0) {
            const emptyNotice = document.createElement("div");
            emptyNotice.style.color = "#888";
            emptyNotice.style.fontSize = "13px";
            emptyNotice.style.fontStyle = "italic";
            emptyNotice.textContent = _("Click chords above or pick a preset to build a sequence.");
            this.timelineContainer.appendChild(emptyNotice);
            return;
        }

        this.progression.forEach((chord, idx) => {
            const chip = document.createElement("div");
            chip.className = "progression-chip";
            chip.dataset.stepIndex = String(idx);
            chip.style.display = "inline-flex";
            chip.style.alignItems = "center";
            chip.style.gap = "6px";
            chip.style.padding = "6px 10px";
            chip.style.borderRadius = "16px";
            chip.style.background = idx === this.activeStep ? "#ffcc00" : "rgba(0, 0, 0, 0.08)";
            chip.style.border = "1px solid rgba(0, 0, 0, 0.12)";
            chip.style.fontSize = "13px";

            const text = document.createElement("span");
            text.textContent = `${chord.roman} (${chord.name})`;
            text.style.fontWeight = "600";

            const delBtn = document.createElement("span");
            delBtn.textContent = "✕";
            delBtn.style.cursor = "pointer";
            delBtn.style.color = "#888";
            delBtn.style.fontWeight = "bold";
            delBtn.style.marginLeft = "4px";
            delBtn.onclick = e => {
                e.stopPropagation();
                this.removeChord(idx);
            };

            chip.append(text, delBtn);
            chip.onclick = () => {
                if (this.audio) {
                    this.audio.playChord(chord, 0.4, { octave: this.octave });
                }
            };

            this.timelineContainer.appendChild(chip);
        });
    }

    /**
     * Highlights the progression chip currently playing.
     * @private
     * @param {number} activeIndex
     */
    _highlightActiveStep(activeIndex) {
        if (!this.timelineContainer) return;
        const chips = this.timelineContainer.querySelectorAll(".progression-chip");
        chips.forEach((chip, i) => {
            if (i === activeIndex) {
                chip.style.background = "#ffd700";
                chip.style.transform = "scale(1.05)";
            } else {
                chip.style.background = "rgba(0, 0, 0, 0.08)";
                chip.style.transform = "scale(1.0)";
            }
        });
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
