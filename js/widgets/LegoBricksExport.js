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

   _
*/
/*
    Globals location
    - js/utils/utils.js
        _
*/

/* exported LegoBricksExport */

/**
 * @file LegoBricksExport.js
 * @description LEGO Bricks export: turning the detected color segments into notes and saving them
 * as an action block.
 *
 * The methods are moved as they were from the LegoWidget constructor. LegoWidget calls this
 * function with the widget as `this` (see LegoWidget.installModules), so every method is still
 * set on the widget instance and `this` inside it is still the widget.
 */
function LegoBricksExport() {
    /**
     * Saves the current phrase as action blocks.
     * @private
     * @returns {void}
     */
    this._savePhrase = function () {
        if (!this.colorData || this.colorData.length === 0) {
            this.activity.textMsg(_("No color data to save. Please scan an image first."));
            return;
        }

        // Collect notes to play from color detection data
        this._collectNotesToPlay();

        if (this._notesToPlay.length === 0) {
            this.activity.textMsg(_("No notes detected from color scanning."));
            return;
        }

        // Hide palettes for updating
        for (const name in this.activity.blocks.palettes.dict) {
            this.activity.blocks.palettes.dict[name].hideMenu(true);
        }
        this.activity.refreshCanvas();

        // Create action block stack
        const newStack = [
            [0, ["action", { collapsed: true }], 100, 100, [null, 1, null, null]],
            [1, ["text", { value: _("LEGO phrase") }], 0, 0, [0]]
        ];
        let endOfStackIdx = 0;

        // Process each note in the sequence
        for (let i = 0; i < this._notesToPlay.length; i++) {
            const note = this._notesToPlay[i];

            // Add the Note block and its value
            const idx = newStack.length;
            newStack.push([idx, "newnote", 0, 0, [endOfStackIdx, idx + 1, idx + 2, null]]);
            const n = newStack[idx][4].length;

            if (i === 0) {
                // Connect to action block
                newStack[endOfStackIdx][4][n - 2] = idx;
            } else {
                // Connect to previous note block
                newStack[endOfStackIdx][4][n - 1] = idx;
            }

            endOfStackIdx = idx;

            // Add note duration (note value as fraction)
            const delta = 5; // We're adding 4 blocks: vspace, divide, number, number

            // Add vspace to prevent divide block from obscuring the pitch block
            newStack.push([idx + 1, "vspace", 0, 0, [idx, idx + delta]]);

            // Note value saved as a fraction
            let numerator, denominator;
            if (note.noteValue === 1.5) {
                // Dotted half note = 3/2
                numerator = 3;
                denominator = 2;
            } else if (note.noteValue === 0.5) {
                // Double whole note = 1/2 (very long note)
                numerator = 1;
                denominator = 2;
            } else if (Number.isInteger(note.noteValue)) {
                // Standard note values (1, 2, 4, 8, etc.)
                numerator = 1;
                denominator = note.noteValue;
            } else {
                // For other fractional values, convert to proper fraction
                numerator = 1;
                denominator = Math.round(1 / note.noteValue);
            }

            newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
            newStack.push([idx + 3, ["number", { value: numerator }], 0, 0, [idx + 2]]);
            newStack.push([idx + 4, ["number", { value: denominator }], 0, 0, [idx + 2]]);

            // Connect the Note block flow to the divide and vspace blocks
            newStack[idx][4][1] = idx + 2; // divide block
            newStack[idx][4][2] = idx + 1; // vspace block

            let lastConnection = null;
            let previousBlock = idx + 1; // vspace block
            let thisBlock = idx + delta;

            if (note.pitches.length === 0 || note.isRest) {
                // Add rest block
                newStack.push([thisBlock, "rest2", 0, 0, [previousBlock, lastConnection]]);
            } else {
                // Add pitch blocks for each note
                for (let j = 0; j < note.pitches.length; j++) {
                    const pitch = note.pitches[j];

                    // Determine if this is the last pitch block
                    if (j === note.pitches.length - 1) {
                        lastConnection = null;
                    } else {
                        lastConnection = thisBlock + 3;
                    }

                    // Add pitch block
                    newStack.push([
                        thisBlock,
                        "pitch",
                        0,
                        0,
                        [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]
                    ]);

                    // Add pitch name
                    newStack.push([
                        thisBlock + 1,
                        ["solfege", { value: pitch.solfege }],
                        0,
                        0,
                        [thisBlock]
                    ]);

                    // Add octave number
                    newStack.push([
                        thisBlock + 2,
                        ["number", { value: pitch.octave }],
                        0,
                        0,
                        [thisBlock]
                    ]);

                    thisBlock += 3;
                    previousBlock = thisBlock - 3;
                }
            }
        }

        // Load the new blocks
        this.activity.blocks.loadNewBlocks(newStack);
        this.activity.textMsg(
            _("LEGO phrase saved as action blocks with %s notes.").replace(
                /%s/g,
                this._notesToPlay.length.toString()
            )
        );
    };

    /**
     * Collects notes to play from color detection data.
     * @private
     */
    this._collectNotesToPlay = function () {
        this._notesToPlay = [];

        if (!this.colorData || this.colorData.length === 0) {
            return;
        }

        // Analyze column boundaries to determine note timing
        const columnBoundaries = this._analyzeColumnBoundaries();

        // Filter and merge small segments to meet minimum 1/8 note duration
        const filteredBoundaries = this._filterSmallSegments(columnBoundaries);

        // For each time column, collect the notes that should play
        for (let colIndex = 0; colIndex < filteredBoundaries.length - 1; colIndex++) {
            const startTime = filteredBoundaries[colIndex];
            const endTime = filteredBoundaries[colIndex + 1];
            const duration = endTime - startTime;

            // Calculate note value based on duration - updated mapping per requirements
            // <350ms ignored completely (handled in filtering)
            // 350-750ms: 1/8 note, 750-1500ms: 1/4 note, 1500-3000ms: 1/2 note, 3000+ms: full note
            let noteValue;
            if (duration < 750) noteValue = 8;
            // eighth note (350-750ms)
            else if (duration < 1500) noteValue = 4;
            // quarter note (750-1500ms)
            else if (duration < 3000) noteValue = 2;
            // half note (1500-3000ms)
            else noteValue = 1; // whole note (3000ms+)
            let hasNonBackgroundColor = false;
            let pitches = []; // Array to collect pitches for this time column

            // Check each row for non-background colors in this time range
            this.colorData.forEach((rowData, rowIndex) => {
                if (!rowData || !rowData.colorSegments) return;
                let currentTime = 0;

                for (const segment of rowData.colorSegments) {
                    const segmentStart = currentTime;
                    const segmentEnd = currentTime + segment.duration;

                    // Check if this segment overlaps with our time column
                    if (segmentStart < endTime && segmentEnd > startTime) {
                        // Calculate the actual overlap duration
                        const overlapStart = Math.max(segmentStart, startTime);
                        const overlapEnd = Math.min(segmentEnd, endTime);
                        const overlapDuration = overlapEnd - overlapStart;

                        // Only count as significant if overlap is substantial (>350ms)
                        // This prevents spillovers <350ms across blue lines from creating duplicate notes
                        if (overlapDuration > 1000) {
                            // Check if color is not the selected background color (meaning note should play)
                            if (segment.color !== this.selectedBackgroundColor.name) {
                                hasNonBackgroundColor = true;

                                // Convert row data to pitch information
                                const pitch = this._convertRowToPitch(rowData);
                                if (
                                    pitch &&
                                    !pitches.some(
                                        p =>
                                            p.solfege === pitch.solfege && p.octave === pitch.octave
                                    )
                                ) {
                                    pitches.push(pitch);
                                }
                            }
                        } else if (segment.color !== this.selectedBackgroundColor.name) {
                            // Ignore small overlaps without logging
                        }
                    }

                    currentTime += segment.duration;
                }
            });

            // Add note or rest to the sequence
            this._notesToPlay.push({
                pitches: pitches,
                noteValue: noteValue,
                duration: duration,
                isRest: !hasNonBackgroundColor || pitches.length === 0
            });
        }
    };

    /**
     * Filters out small segments completely (no merging, just elimination).
     * Updated: <350ms segments are ignored and added to whichever side's blue line is taking majority.
     * @private
     * @param {Array} boundaries - Array of time boundaries
     * @returns {Array} Filtered boundaries with only segments >= 350ms duration
     */
    this._filterSmallSegments = function (boundaries) {
        if (boundaries.length <= 2) return boundaries;

        const minDuration = 1000; // Much larger minimum duration (1 second)
        const filteredBoundaries = [boundaries[0]]; // Always keep the start boundary

        // Process each potential segment
        for (let i = 1; i < boundaries.length; i++) {
            const segmentDuration =
                boundaries[i] - filteredBoundaries[filteredBoundaries.length - 1];

            // Only add this boundary if it creates a segment that meets the minimum duration
            if (segmentDuration >= minDuration) {
                filteredBoundaries.push(boundaries[i]);
            }
            // If segment is too small (<1000ms), we skip this boundary entirely
            // The time gets absorbed into the adjacent larger segment
        }

        // Always end on the final boundary so a short trailing segment is merged
        // into the previous one instead of being cut off
        const finalBoundary = boundaries[boundaries.length - 1];
        if (filteredBoundaries[filteredBoundaries.length - 1] !== finalBoundary) {
            if (filteredBoundaries.length === 1) {
                filteredBoundaries.push(finalBoundary);
            } else {
                filteredBoundaries[filteredBoundaries.length - 1] = finalBoundary;
            }
        }

        return filteredBoundaries;
    };

    /**
     * Analyzes color segments to determine column boundaries.
     * @private
     * @returns {Array} Array of time boundaries in milliseconds
     */
    this._analyzeColumnBoundaries = function () {
        const boundaries = new Set([0]); // Start with 0

        // Collect all segment end times
        this.colorData.forEach(rowData => {
            if (rowData && rowData.colorSegments) {
                let currentTime = 0;
                rowData.colorSegments.forEach(segment => {
                    currentTime += segment.duration;
                    boundaries.add(currentTime);
                });
            }
        });

        // Convert to sorted array
        const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);

        // Merge boundaries that are very close together (within 500ms for much larger blocks)
        const mergedBoundaries = [sortedBoundaries[0]];
        for (let i = 1; i < sortedBoundaries.length; i++) {
            if (sortedBoundaries[i] - mergedBoundaries[mergedBoundaries.length - 1] > 500) {
                mergedBoundaries.push(sortedBoundaries[i]);
            }
        }

        return mergedBoundaries;
    };

    /**
     * Converts row data to pitch information.
     * @private
     * @param {Object} rowData - Row data containing note information
     * @returns {Object} Pitch object with solfege and octave
     */
    this._convertRowToPitch = function (rowData) {
        if (!rowData.note) return null;

        // Parse note string (e.g., "C4", "D5", etc.)
        const noteMatch = rowData.note.match(/^([A-G][#b]?)(\d+)$/);
        if (!noteMatch) return null;

        const noteName = noteMatch[1];
        const octave = parseInt(noteMatch[2], 10);

        // Convert note name to solfege
        const noteToSolfege = {
            "C": "do",
            "C#": "do♯",
            "Db": "re♭",
            "D": "re",
            "D#": "re♯",
            "Eb": "mi♭",
            "E": "mi",
            "F": "fa",
            "F#": "fa♯",
            "Gb": "sol♭",
            "G": "sol",
            "G#": "sol♯",
            "Ab": "la♭",
            "A": "la",
            "A#": "la♯",
            "Bb": "ti♭",
            "B": "ti"
        };

        const solfege = noteToSolfege[noteName] || "do";

        return {
            solfege: solfege,
            octave: octave
        };
    };

    /**
     * Exports the current phrase.
     * @private
     * @returns {void}
     */
    this._exportPhrase = function () {
        const phraseData = {
            selectedCells: Array.from(this.matrixData.selectedCells),
            rows: this.matrixData.rows.map(row => ({ type: row.type, label: row.label }))
        };

        this.activity.textMsg(
            _("Exporting phrase data: %s").replace(/%s/g, JSON.stringify(phraseData))
        );
    };

    /**
     * Clears the current phrase, stopping playback and removing scanned data and overlay lines.
     * @private
     * @returns {void}
     */
    this._clearPhrase = function () {
        if (this.isPlaying) {
            // Temporarily set flag to suppress automatic PNG visualization download
            // triggered by _stopPlayback() during cancellation of an active phrase.
            this.hasGeneratedVisualization = true;
            this._stopPlayback();
        }
        this._stopPolyphonicPlayback();

        if (this.scanningLines) {
            this.scanningLines.forEach(line => {
                if (line.element && line.element.parentNode) {
                    line.element.parentNode.removeChild(line.element);
                }
            });
            this.scanningLines = null;
        }

        if (this.gridOverlay) {
            const columnLines = this.gridOverlay.querySelectorAll(".column-line");
            columnLines.forEach(line => line.remove());
        }

        this.colorData = [];
        this._notesToPlay = [];
        this.hasGeneratedVisualization = false;

        if (this.matrixData && this.matrixData.selectedCells) {
            this.matrixData.selectedCells.clear();
        }

        if (this.matrixTable) {
            const selectedCells = this.matrixTable.querySelectorAll("[data-cell-id]");
            selectedCells.forEach(cell => {
                cell.style.backgroundColor = "";
                const dot = cell.querySelector(".cell-dot");
                if (dot) cell.removeChild(dot);
            });
        }

        if (this.activity && typeof this.activity.textMsg === "function") {
            this.activity.textMsg(_("Phrase cleared"));
        }
    };
}

if (typeof module !== "undefined") {
    module.exports = LegoBricksExport;
}
