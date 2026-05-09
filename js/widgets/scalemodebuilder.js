/*
   Copyright (C) 2024 Music Blocks

   This file is part of Music Blocks.

   Music Blocks is free software: you can redistribute it and/or modify
   it under the terms of the GNU Affero General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   Music Blocks is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with Music Blocks.  If not, see <http://www.gnu.org/licenses/>.

   Scale and Mode Builder Widget for Music Blocks
*/

/* global _, platformColor, Singer, docById, getTemperament, getTemperamentKeys, isCustomTemperament, ICONSIZE, BUTTONSIZE */

/* exported ScaleModeBuilder */

function ScaleModeBuilder() {
    const BUTTONDIVWIDTH = 600;
    const ICONSIZE = 24;

    // Scale and mode data
    this.selectedTemperament = "equal";
    this.scaleIntervals = [2, 2, 1, 2, 2, 2, 1]; // Major scale intervals in semitones
    this.modeIndex = 0;
    this.rootNote = 0; // C
    this.scaleName = "Major";

    // UI elements
    this.widgetWindow = null;
    this.activity = null;
    this._logo = null;

    /**
     * Initializes the scale and mode builder widget.
     * @param {Activity} activity - The activity associated with the widget.
     * @returns {void}
     */
    this.init = function (activity) {
        this.activity = activity;
        this._logo = this.activity.logo;

        const w = window.innerWidth;
        this._cellScale = w / 1200;

        const widgetWindow = window.widgetWindows.windowFor(this, "scalemodebuilder");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        // Create main container
        const mainContainer = document.createElement("div");
        mainContainer.style.padding = "20px";
        mainContainer.style.display = "flex";
        mainContainer.style.flexDirection = "column";
        mainContainer.style.gap = "20px";

        // Header section
        const headerSection = this._createHeaderSection();
        mainContainer.appendChild(headerSection);

        // Temperament selector
        const temperamentSection = this._createTemperamentSection();
        mainContainer.appendChild(temperamentSection);

        // Scale builder interface
        const scaleBuilderSection = this._createScaleBuilderSection();
        mainContainer.appendChild(scaleBuilderSection);

        // Mode selector
        const modeSection = this._createModeSection();
        mainContainer.appendChild(modeSection);

        // Visualization
        const visualizationSection = this._createVisualizationSection();
        mainContainer.appendChild(visualizationSection);

        // Action buttons
        const actionSection = this._createActionSection();
        mainContainer.appendChild(actionSection);

        widgetWindow.getWidgetBody().appendChild(mainContainer);
        widgetWindow.getWidgetBody().style.height = "700px";
        widgetWindow.getWidgetBody().style.width = "800px";
        widgetWindow.getWidgetBody().style.overflow = "auto";

        // Initialize the display
        this._updateScaleDisplay();
        this._updateVisualization();

        const that = this;
        widgetWindow.onclose = function () {
            // Cleanup if needed
            this.destroy();
        };
    };

    /**
     * Creates the header section with title and description.
     * @returns {HTMLElement} The header section element.
     */
    this._createHeaderSection = function () {
        const headerDiv = document.createElement("div");
        headerDiv.style.textAlign = "center";
        headerDiv.style.borderBottom = "2px solid " + (platformColor.strokeColor || "#003300");
        headerDiv.style.paddingBottom = "10px";

        const title = document.createElement("h2");
        title.textContent = _("Scale & Mode Builder");
        title.style.margin = "0 0 10px 0";
        title.style.color = platformColor.strokeColor || "#003300";

        const description = document.createElement("p");
        description.textContent = _(
            "Build custom scales and explore modes using different temperaments"
        );
        description.style.margin = "0";
        description.style.fontSize = "14px";
        description.style.color = "#666";

        headerDiv.appendChild(title);
        headerDiv.appendChild(description);

        return headerDiv;
    };

    /**
     * Creates the temperament selection section.
     * @returns {HTMLElement} The temperament section element.
     */
    this._createTemperamentSection = function () {
        const sectionDiv = document.createElement("div");
        sectionDiv.style.display = "flex";
        sectionDiv.style.alignItems = "center";
        sectionDiv.style.gap = "10px";

        const label = document.createElement("label");
        label.textContent = _("Temperament:");
        label.style.fontWeight = "bold";
        label.style.minWidth = "100px";

        const select = document.createElement("select");
        select.id = "temperamentSelect";
        select.style.padding = "5px";
        select.style.borderRadius = "4px";
        select.style.border = "1px solid #ccc";

        const temperaments = getTemperamentKeys();
        for (const temp of temperaments) {
            const option = document.createElement("option");
            option.value = temp;
            option.textContent = temp;
            if (temp === this.selectedTemperament) {
                option.selected = true;
            }
            select.appendChild(option);
        }

        const that = this;
        select.onchange = function () {
            that.selectedTemperament = this.value;
            that._updateScaleDisplay();
            that._updateVisualization();
        };

        sectionDiv.appendChild(label);
        sectionDiv.appendChild(select);

        return sectionDiv;
    };

    /**
     * Creates the scale builder interface.
     * @returns {HTMLElement} The scale builder section element.
     */
    this._createScaleBuilderSection = function () {
        const sectionDiv = document.createElement("div");
        sectionDiv.style.border = "1px solid #ddd";
        sectionDiv.style.borderRadius = "8px";
        sectionDiv.style.padding = "15px";
        sectionDiv.style.backgroundColor = "#f9f9f9";

        const title = document.createElement("h3");
        title.textContent = _("Scale Builder");
        title.style.margin = "0 0 15px 0";
        title.style.color = platformColor.strokeColor || "#003300";

        const controlsDiv = document.createElement("div");
        controlsDiv.style.display = "flex";
        controlsDiv.style.alignItems = "center";
        controlsDiv.style.gap = "15px";
        controlsDiv.style.marginBottom = "15px";

        // Root note selector
        const rootLabel = document.createElement("label");
        rootLabel.textContent = _("Root:");
        rootLabel.style.fontWeight = "bold";

        const rootSelect = document.createElement("select");
        rootSelect.id = "rootSelect";
        rootSelect.style.padding = "5px";
        rootSelect.style.borderRadius = "4px";
        rootSelect.style.border = "1px solid #ccc";

        const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        for (let i = 0; i < noteNames.length; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = noteNames[i];
            if (i === this.rootNote) {
                option.selected = true;
            }
            rootSelect.appendChild(option);
        }

        // Scale name input
        const nameLabel = document.createElement("label");
        nameLabel.textContent = _("Name:");
        nameLabel.style.fontWeight = "bold";

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.id = "scaleNameInput";
        nameInput.value = this.scaleName;
        nameInput.style.padding = "5px";
        nameInput.style.borderRadius = "4px";
        nameInput.style.border = "1px solid #ccc";
        nameInput.style.width = "120px";

        controlsDiv.appendChild(rootLabel);
        controlsDiv.appendChild(rootSelect);
        controlsDiv.appendChild(nameLabel);
        controlsDiv.appendChild(nameInput);

        // Interval builder
        const intervalDiv = document.createElement("div");
        intervalDiv.id = "intervalBuilder";
        intervalDiv.style.marginTop = "15px";

        const intervalLabel = document.createElement("div");
        intervalLabel.textContent = _("Intervals (semitones):");
        intervalLabel.style.fontWeight = "bold";
        intervalLabel.style.marginBottom = "10px";

        const intervalControls = document.createElement("div");
        intervalControls.style.display = "flex";
        intervalControls.style.flexWrap = "wrap";
        intervalControls.style.gap = "10px";
        intervalControls.id = "intervalControls";

        intervalDiv.appendChild(intervalLabel);
        intervalDiv.appendChild(intervalControls);

        // Preset scales
        const presetDiv = document.createElement("div");
        presetDiv.style.marginTop = "15px";

        const presetLabel = document.createElement("label");
        presetLabel.textContent = _("Preset Scales:");
        presetLabel.style.fontWeight = "bold";
        presetLabel.style.display = "block";
        presetLabel.style.marginBottom = "5px";

        const presetSelect = document.createElement("select");
        presetSelect.id = "presetSelect";
        presetSelect.style.padding = "5px";
        presetSelect.style.borderRadius = "4px";
        presetSelect.style.border = "1px solid #ccc";

        const presets = {
            "Major": [2, 2, 1, 2, 2, 2, 1],
            "Minor (Natural)": [2, 1, 2, 2, 1, 2, 2],
            "Minor (Harmonic)": [2, 1, 2, 2, 1, 3, 1],
            "Minor (Melodic)": [2, 1, 2, 2, 2, 2, 1],
            "Dorian": [2, 1, 2, 2, 2, 1, 2],
            "Phrygian": [1, 2, 2, 2, 1, 2, 2],
            "Lydian": [2, 2, 2, 1, 2, 2, 1],
            "Mixolydian": [2, 2, 1, 2, 2, 1, 2],
            "Locrian": [1, 2, 2, 1, 2, 2, 2],
            "Pentatonic Major": [2, 2, 3, 2, 3],
            "Pentatonic Minor": [3, 2, 2, 3, 2],
            "Whole Tone": [2, 2, 2, 2, 2, 2],
            "Chromatic": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        };

        for (const [name, intervals] of Object.entries(presets)) {
            const option = document.createElement("option");
            option.value = JSON.stringify(intervals);
            option.textContent = name;
            presetSelect.appendChild(option);
        }

        presetDiv.appendChild(presetLabel);
        presetDiv.appendChild(presetSelect);

        sectionDiv.appendChild(title);
        sectionDiv.appendChild(controlsDiv);
        sectionDiv.appendChild(intervalDiv);
        sectionDiv.appendChild(presetDiv);

        // Event handlers
        const that = this;
        rootSelect.onchange = function () {
            that.rootNote = parseInt(this.value);
            that._updateVisualization();
        };

        nameInput.onchange = function () {
            that.scaleName = this.value;
        };

        presetSelect.onchange = function () {
            if (this.value) {
                that.scaleIntervals = JSON.parse(this.value);
                that._updateScaleDisplay();
                that._updateVisualization();
            }
        };

        return sectionDiv;
    };

    /**
     * Creates the mode selector section.
     * @returns {HTMLElement} The mode section element.
     */
    this._createModeSection = function () {
        const sectionDiv = document.createElement("div");
        sectionDiv.style.display = "flex";
        sectionDiv.style.alignItems = "center";
        sectionDiv.style.gap = "15px";

        const label = document.createElement("label");
        label.textContent = _("Mode:");
        label.style.fontWeight = "bold";

        const modeSelect = document.createElement("select");
        modeSelect.id = "modeSelect";
        modeSelect.style.padding = "5px";
        modeSelect.style.borderRadius = "4px";
        modeSelect.style.border = "1px solid #ccc";

        const modeNames = [
            "Ionian",
            "Dorian",
            "Phrygian",
            "Lydian",
            "Mixolydian",
            "Aeolian",
            "Locrian"
        ];
        for (let i = 0; i < modeNames.length; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = modeNames[i];
            if (i === this.modeIndex) {
                option.selected = true;
            }
            modeSelect.appendChild(option);
        }

        const generateButton = document.createElement("button");
        generateButton.textContent = _("Generate Mode");
        generateButton.style.padding = "8px 16px";
        generateButton.style.backgroundColor = platformColor.selectorBackground || "#c8C8C8";
        generateButton.style.border = "none";
        generateButton.style.borderRadius = "4px";
        generateButton.style.cursor = "pointer";

        sectionDiv.appendChild(label);
        sectionDiv.appendChild(modeSelect);

        const that = this;
        modeSelect.onchange = function () {
            that.modeIndex = parseInt(this.value);
        };

        generateButton.onclick = function () {
            that._generateMode();
        };

        sectionDiv.appendChild(generateButton);

        return sectionDiv;
    };

    /**
     * Creates the visualization section.
     * @returns {HTMLElement} The visualization section element.
     */
    this._createVisualizationSection = function () {
        const sectionDiv = document.createElement("div");
        sectionDiv.style.border = "1px solid #ddd";
        sectionDiv.style.borderRadius = "8px";
        sectionDiv.style.padding = "15px";
        sectionDiv.style.backgroundColor = "#f9f9f9";
        sectionDiv.style.minHeight = "200px";

        const title = document.createElement("h3");
        title.textContent = _("Scale Visualization");
        title.style.margin = "0 0 15px 0";
        title.style.color = platformColor.strokeColor || "#003300";

        const canvas = document.createElement("canvas");
        canvas.id = "scaleCanvas";
        canvas.width = 600;
        canvas.height = 150;
        canvas.style.border = "1px solid #ccc";
        canvas.style.borderRadius = "4px";
        canvas.style.backgroundColor = "white";

        sectionDiv.appendChild(title);
        sectionDiv.appendChild(canvas);

        return sectionDiv;
    };

    /**
     * Creates the action buttons section.
     * @returns {HTMLElement} The action section element.
     */
    this._createActionSection = function () {
        const sectionDiv = document.createElement("div");
        sectionDiv.style.display = "flex";
        sectionDiv.style.justifyContent = "center";
        sectionDiv.style.gap = "10px";

        const playButton = document.createElement("button");
        playButton.textContent = _("Play Scale");
        playButton.style.padding = "10px 20px";
        playButton.style.backgroundColor = platformColor.selectorBackground || "#c8C8C8";
        playButton.style.border = "none";
        playButton.style.borderRadius = "4px";
        playButton.style.cursor = "pointer";
        playButton.style.fontSize = "16px";

        const saveButton = document.createElement("button");
        saveButton.textContent = _("Save as Block");
        saveButton.style.padding = "10px 20px";
        saveButton.style.backgroundColor = "#4CAF50";
        saveButton.style.color = "white";
        saveButton.style.border = "none";
        saveButton.style.borderRadius = "4px";
        saveButton.style.cursor = "pointer";
        saveButton.style.fontSize = "16px";

        const that = this;
        playButton.onclick = function () {
            that._playScale();
        };

        saveButton.onclick = function () {
            that._saveScale();
        };

        sectionDiv.appendChild(playButton);
        sectionDiv.appendChild(saveButton);

        return sectionDiv;
    };

    /**
     * Updates the scale display with current intervals.
     * @returns {void}
     */
    this._updateScaleDisplay = function () {
        const intervalControls = docById("intervalControls");
        if (!intervalControls) return;

        intervalControls.innerHTML = "";

        for (let i = 0; i < this.scaleIntervals.length; i++) {
            const intervalDiv = document.createElement("div");
            intervalDiv.style.display = "flex";
            intervalDiv.style.alignItems = "center";
            intervalDiv.style.gap = "5px";

            const input = document.createElement("input");
            input.type = "number";
            input.min = "0";
            input.max = "12";
            input.value = this.scaleIntervals[i];
            input.style.width = "50px";
            input.style.padding = "3px";
            input.style.borderRadius = "3px";
            input.style.border = "1px solid #ccc";

            const label = document.createElement("span");
            label.textContent = "st";

            const removeButton = document.createElement("button");
            removeButton.textContent = "×";
            removeButton.style.padding = "2px 6px";
            removeButton.style.backgroundColor = "#ff6b6b";
            removeButton.style.color = "white";
            removeButton.style.border = "none";
            removeButton.style.borderRadius = "3px";
            removeButton.style.cursor = "pointer";
            removeButton.style.fontSize = "14px";

            const that = this;
            input.onchange = function () {
                that.scaleIntervals[i] = parseInt(this.value) || 0;
                that._updateVisualization();
            };

            removeButton.onclick = function () {
                that.scaleIntervals.splice(i, 1);
                that._updateScaleDisplay();
                that._updateVisualization();
            };

            intervalDiv.appendChild(input);
            intervalDiv.appendChild(label);
            intervalDiv.appendChild(removeButton);
            intervalControls.appendChild(intervalDiv);
        }

        // Add interval button
        const addButton = document.createElement("button");
        addButton.textContent = _("Add Interval");
        addButton.style.padding = "5px 10px";
        addButton.style.backgroundColor = platformColor.selectorBackground || "#c8C8C8";
        addButton.style.border = "none";
        addButton.style.borderRadius = "4px";
        addButton.style.cursor = "pointer";

        addButton.onclick = function () {
            that.scaleIntervals.push(2);
            that._updateScaleDisplay();
            that._updateVisualization();
        };

        intervalControls.appendChild(addButton);
    };

    /**
     * Updates the scale visualization on the canvas.
     * @returns {void}
     */
    this._updateVisualization = function () {
        const canvas = docById("scaleCanvas");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw staff lines
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = 30 + i * 10;
            ctx.beginPath();
            ctx.moveTo(20, y);
            ctx.lineTo(width - 20, y);
            ctx.stroke();
        }

        // Calculate note positions
        const notePositions = this._calculateNotePositions();
        const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        // Draw notes
        for (let i = 0; i < notePositions.length; i++) {
            const x = 50 + (notePositions[i] / 12) * (width - 100);
            const noteValue = (this.rootNote + notePositions[i]) % 12;
            const octave = Math.floor((this.rootNote + notePositions[i]) / 12);
            const y = this._getNoteYPosition(noteValue);

            // Draw note head
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fillStyle = i === 0 ? "#ff6b6b" : "#4a90e2"; // Root note in red
            ctx.fill();
            ctx.strokeStyle = "#000";
            ctx.stroke();

            // Draw accidental if needed
            if (noteNames[noteValue].includes("#")) {
                ctx.fillStyle = "#000";
                ctx.font = "16px serif";
                ctx.fillText("#", x - 12, y - 8);
            }

            // Draw note name below
            ctx.fillStyle = "#666";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(noteNames[noteValue] + octave, x, y + 25);
        }

        // Draw interval labels
        ctx.fillStyle = "#333";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";

        let currentPos = 0;
        for (let i = 0; i < this.scaleIntervals.length; i++) {
            const x = 50 + (currentPos / 12) * (width - 100);
            const intervalText = this.scaleIntervals[i] + "st";
            ctx.fillText(intervalText, x, height - 10);
            currentPos += this.scaleIntervals[i];
        }
    };

    /**
     * Calculates note positions for the current scale.
     * @returns {number[]} Array of note positions in semitones from root.
     */
    this._calculateNotePositions = function () {
        const positions = [0];
        let currentPos = 0;

        for (const interval of this.scaleIntervals) {
            currentPos += interval;
            positions.push(currentPos);
        }

        return positions;
    };

    /**
     * Gets the Y position for a note on the staff.
     * @param {number} noteValue - The note value (0-11).
     * @returns {number} The Y position.
     */
    this._getNoteYPosition = function (noteValue) {
        const noteToLine = {
            0: 70, // C
            1: 65, // C#
            2: 60, // D
            3: 55, // D#
            4: 50, // E
            5: 45, // F
            6: 40, // F#
            7: 35, // G
            8: 30, // G#
            9: 25, // A
            10: 20, // A#
            11: 15 // B
        };

        return noteToLine[noteValue] || 50;
    };

    /**
     * Generates a mode from the current scale.
     * @returns {void}
     */
    this._generateMode = function () {
        if (this.scaleIntervals.length < 7) {
            this.activity.textMsg(_("Need at least 7 intervals for mode generation."), 3000);
            return;
        }

        // Rotate the scale to start from the selected mode index
        const rotatedIntervals = [];
        for (let i = 0; i < this.scaleIntervals.length; i++) {
            rotatedIntervals.push(
                this.scaleIntervals[(i + this.modeIndex) % this.scaleIntervals.length]
            );
        }

        this.scaleIntervals = rotatedIntervals;
        this._updateScaleDisplay();
        this._updateVisualization();

        const modeNames = [
            "Ionian",
            "Dorian",
            "Phrygian",
            "Lydian",
            "Mixolydian",
            "Aeolian",
            "Locrian"
        ];
        this.scaleName = modeNames[this.modeIndex] + " Mode";
        docById("scaleNameInput").value = this.scaleName;
    };

    /**
     * Plays the current scale.
     * @returns {void}
     */
    this._playScale = function () {
        if (!this._logo || !this._logo.synth) return;

        this._logo.resetSynth(0);

        const notePositions = this._calculateNotePositions();
        const bpm = Singer.defaultBPMFactor;

        for (let i = 0; i < notePositions.length; i++) {
            setTimeout(() => {
                const frequency = this._notePositionToFrequency(notePositions[i]);
                this._logo.synth.trigger(0, frequency, bpm * 0.25, "electronic synth", null, null);
            }, i * 250);
        }
    };

    /**
     * Converts a note position to frequency.
     * @param {number} position - Note position in semitones from root.
     * @returns {number} The frequency.
     */
    this._notePositionToFrequency = function (position) {
        const rootFreq = 261.63; // C4
        return rootFreq * Math.pow(2, (this.rootNote + position) / 12);
    };

    /**
     * Saves the current scale as a block.
     * @returns {void}
     */
    this._saveScale = function () {
        // This would create a custom scale block - implementation depends on block system
        this.activity.textMsg(_("Scale saved! (Block creation not yet implemented)"), 3000);
    };
}

if (typeof module !== "undefined") {
    module.exports = ScaleModeBuilder;
}
