/**
 * MusicBlocks
 *
 * @copyright 2025-26 Music Blocks contributors
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/*
   global

   noteToFrequency
*/
/*
    Globals location
    - js/utils/musicutils-buildscale.js
        noteToFrequency
*/

/* exported LegoBricksRows */

/**
 * @file LegoBricksRows.js
 * @description LEGO Bricks rows: the pitch rows read from the widget's blocks, their fallback
 * frequencies and the row headers.
 *
 * The methods are moved as they were from the LegoWidget constructor. LegoWidget calls this
 * function with the widget as `this` (see LegoWidget.installModules), so every method is still
 * set on the widget instance and `this` inside it is still the widget.
 */
function LegoBricksRows() {
    /**
     * Clears block references within the LegoWidget.
     * Resets arrays used to track row blocks.
     */
    this.clearBlocks = function () {
        this._rowBlocks = [];
        this._rowMap = [];
        this._rowOffset = [];
    };

    /**
     * Adds a row block to the LegoWidget matrix.
     * This method is called when encountering a pitch block during matrix creation.
     * @param {number} rowBlock - The pitch block identifier to add to the matrix row.
     */
    this.addRowBlock = function (rowBlock) {
        this._rowMap.push(this._rowBlocks.length);
        this._rowOffset.push(0);
        // In case there is a repeat block, use a unique block number
        // for each instance.
        while (this._rowBlocks.includes(rowBlock)) {
            rowBlock = rowBlock + 1000000;
        }
        this._rowBlocks.push(rowBlock);
    };

    /**
     * Generates rows based on the pitch blocks received from the LEGO bricks block.
     * @private
     */
    this._generateRowsFromPitchBlocks = function () {
        // Clear existing matrix data
        this.matrixData.rows = [];

        // Create a list of pitch entries for sorting
        const pitchEntries = [];

        // Generate rows based on the pitch blocks
        for (let i = 0; i < this.rowLabels.length; i++) {
            const pitchName = this.rowLabels[i];
            const octave = this.rowArgs[i];

            // Only process pitch blocks (skip drum blocks)
            if (octave !== -1) {
                // This is a pitch block
                const noteLabel = pitchName + octave;

                // Convert pitch to display name
                let displayName = pitchName;
                if (pitchName === "do") displayName = "Do";
                else if (pitchName === "re") displayName = "Re";
                else if (pitchName === "mi") displayName = "Mi";
                else if (pitchName === "fa") displayName = "Fa";
                else if (pitchName === "sol") displayName = "So";
                else if (pitchName === "la") displayName = "La";
                else if (pitchName === "ti") displayName = "Ti";
                else displayName = pitchName.toUpperCase();

                // Calculate frequency for sorting (same as phrasemaker)
                let frequency = 0;
                try {
                    if (typeof noteToFrequency !== "undefined") {
                        frequency = noteToFrequency(
                            noteLabel,
                            this.activity.turtles.ithTurtle(0).singer.keySignature
                        );
                    } else {
                        // Fallback frequency calculation if noteToFrequency is not available
                        frequency = this._calculateFallbackFrequency(pitchName, octave);
                    }
                } catch (e) {
                    // Fallback frequency calculation
                    frequency = this._calculateFallbackFrequency(pitchName, octave);
                }

                pitchEntries.push({
                    frequency: frequency,
                    type: "pitch",
                    label: displayName + " (" + octave + ")",
                    icon: "pitch.svg",
                    color: "pitch-row",
                    note: noteLabel,
                    pitch: pitchName,
                    octave: octave
                });
            }
        }

        // Sort pitch entries by frequency (highest first, like phrasemaker)
        pitchEntries.sort((a, b) => b.frequency - a.frequency);

        // Add sorted pitch entries to matrix data
        this.matrixData.rows = pitchEntries;

        // Add a control row at the end
        this.matrixData.rows.push({
            type: "control",
            label: "Zoom Controls",
            icon: "zoom.svg",
            color: "control-row"
        });

        // If no pitch blocks were provided, add some default rows for testing (already sorted)
        if (this.rowLabels.length === 0) {
            this.matrixData.rows = [
                {
                    type: "pitch",
                    label: "E4 (Mi)",
                    icon: "pitch.svg",
                    color: "pitch-row",
                    note: "E4"
                },
                {
                    type: "pitch",
                    label: "D4 (Re)",
                    icon: "pitch.svg",
                    color: "pitch-row",
                    note: "D4"
                },
                {
                    type: "pitch",
                    label: "C4 (Middle C)",
                    icon: "pitch.svg",
                    color: "pitch-row",
                    note: "C4"
                },
                { type: "control", label: "Zoom Controls", icon: "zoom.svg", color: "control-row" }
            ];
        }
    };

    /**
     * Calculates frequency for a pitch name and octave as fallback when noteToFrequency is not available.
     * @private
     * @param {string} pitchName - The pitch name (e.g., "do", "C", "re", "D")
     * @param {number} octave - The octave number
     * @returns {number} The calculated frequency
     */
    this._calculateFallbackFrequency = function (pitchName, octave) {
        // Handle both letter names and solfege
        const noteFreqs = {
            C: 261.63,
            do: 261.63,
            D: 293.66,
            re: 293.66,
            E: 329.63,
            mi: 329.63,
            F: 349.23,
            fa: 349.23,
            G: 392.0,
            sol: 392.0,
            A: 440.0,
            la: 440.0,
            B: 493.88,
            ti: 493.88
        };

        const baseFreq =
            noteFreqs[pitchName.toLowerCase()] ||
            noteFreqs[pitchName.toUpperCase()] ||
            noteFreqs["C"];
        return baseFreq * Math.pow(2, octave - 4);
    };

    /**
     * Initializes the row headers table with dividing lines.
     * @private
     * @returns {void}
     */
    this._initializeRowHeaders = function () {
        this.rowHeaderTable.replaceChildren();
        this.rowHeaderTable.style.margin = "0";
        this.rowHeaderTable.style.padding = "0";
        this.rowHeaderTable.style.borderSpacing = "0";

        this.matrixData.rows.forEach((rowData, rowIndex) => {
            const row = this.rowHeaderTable.insertRow();
            row.style.height = "40px"; // LegoWidget.ROW_HEIGHT + "px";
            row.style.margin = "0";
            row.style.padding = "0";
            row.style.position = "relative"; // Needed for absolute positioning of line

            const labelCell = row.insertCell();
            labelCell.style.display = "flex";
            labelCell.style.alignItems = "center";
            labelCell.style.padding = "0 8px";
            labelCell.style.margin = "0";
            labelCell.style.fontSize = "13px";
            labelCell.style.fontWeight = "bold";
            labelCell.style.border = "none"; // Remove default borders
            labelCell.style.backgroundColor = rowData.type === "pitch" ? "#77C428" : "#87ceeb";
            labelCell.style.gap = "8px";
            labelCell.style.height = "40px"; // LegoWidget.ROW_HEIGHT + "px";
            labelCell.style.lineHeight = "40px"; // LegoWidget.ROW_HEIGHT + "px";
            labelCell.style.boxSizing = "border-box";
            labelCell.style.cursor = rowData.note ? "pointer" : "default";

            // Add click handler for pitch rows
            if (rowData.note) {
                labelCell.onclick = () => {
                    this._playNote(rowData.note);
                };

                // Visual feedback on click
                labelCell.onmousedown = () => {
                    labelCell.style.transform = "scale(0.98)";
                    labelCell.style.boxShadow = "inset 0 0 8px rgba(0,0,0,0.2)";
                };

                labelCell.onmouseup = () => {
                    labelCell.style.transform = "";
                    labelCell.style.boxShadow = "";
                };

                labelCell.onmouseleave = () => {
                    labelCell.style.transform = "";
                    labelCell.style.boxShadow = "";
                };
            }

            // Create icon
            const icon = document.createElement("div");
            icon.style.width = "24px";
            icon.style.height = "24px";
            icon.style.backgroundColor = "#fff";
            icon.style.borderRadius = "50%";
            icon.style.marginRight = "6px";
            icon.style.flexShrink = "0";

            labelCell.appendChild(icon);
            labelCell.appendChild(document.createTextNode(rowData.label));

            // Add red line at the bottom of each row (except last)
            if (rowIndex < this.matrixData.rows.length - 1) {
                const line = document.createElement("div");
                line.style.position = "absolute";
                line.style.left = "0";
                line.style.right = "0";
                line.style.bottom = "0";
                line.style.height = "2px";
                line.style.backgroundColor = "red";
                line.style.zIndex = "5";
                row.appendChild(line);
            }
        });
    };
}

if (typeof module !== "undefined") {
    module.exports = LegoBricksRows;
}
