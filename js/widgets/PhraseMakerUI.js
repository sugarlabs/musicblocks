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

/**
 * @file PhraseMakerUI.js
 * @description UI and rendering logic for PhraseMaker widget.
 */

/* global MATRIXSOLFEHEIGHT, MATRIXSOLFEWIDTH, EIGHTHNOTEWIDTH */

const PhraseMakerUI = {
    /**
     * Styles the appearance of the PhraseMaker widget to fit within the screen dimensions.
     * @param {Object} pm - The PhraseMaker instance.
     */
    stylePhraseMaker(pm) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const floatingWindowsDiv = document.getElementById("floatingWindows");
        const windowFrameElements = floatingWindowsDiv.querySelectorAll(".windowFrame");

        for (let i = 0; i < windowFrameElements.length; i++) {
            const windowFrame = windowFrameElements[i];
            const wfWinBody = windowFrame.querySelector(".wfWinBody");
            const wfbWidget = windowFrame.querySelector(".wfbWidget");
            const totalWidth = parseFloat(window.getComputedStyle(windowFrame).width);
            const totalHeight = parseFloat(window.getComputedStyle(windowFrame).height);
            const maxWidth = screenWidth * 0.8;
            const maxHeight = screenHeight * 0.8;

            if (totalWidth > screenWidth || totalHeight > screenHeight) {
                windowFrame.style.height = Math.min(totalHeight, maxHeight) + "px";
                windowFrame.style.width = Math.min(totalWidth, maxWidth) + "px";
                wfbWidget.style.overflowY = totalHeight > maxHeight ? "auto" : "hidden";
                wfbWidget.style.overflowX = totalWidth > maxWidth ? "auto" : "hidden";
                wfbWidget.style.width = "-webkit-fill-available";
                wfbWidget.style.height = "-webkit-fill-available";
                wfbWidget.style.position = "absolute";
                wfbWidget.style.left = "55px";
                wfWinBody.style.position = "absolute";
                wfWinBody.style.overflowY = totalHeight > maxHeight ? "auto" : "hidden";
                wfWinBody.style.overflowX = totalWidth > maxWidth ? "auto" : "hidden";
                wfWinBody.style.width = "-webkit-fill-available";
                wfWinBody.style.height = "-webkit-fill-available";
                wfWinBody.style.background = "#cccccc";
            }
        }
    },

    /**
     * Resets the matrix UI by clearing highlighted backgrounds.
     * @param {Object} pm - The PhraseMaker instance.
     */
    resetMatrix(pm) {
        if (!pm) return;
        let row = pm._noteValueRow;
        let cell;
        if (row && row.cells) {
            for (let i = 0; i < row.cells.length; i++) {
                cell = row.cells[i];
                if (cell && cell.style)
                    cell.style.backgroundColor = pm.platformColor
                        ? pm.platformColor.rhythmcellcolor
                        : "white";
            }
        }

        if (pm._matrixHasTuplets) {
            row = pm._tupletNoteValueRow;
            if (row && row.cells) {
                for (let i = 0; i < row.cells.length; i++) {
                    cell = row.cells[i];
                    if (cell && cell.style)
                        cell.style.backgroundColor = pm.platformColor
                            ? pm.platformColor.tupletBackground
                            : "white";
                }
            }
        }
    },

    /**
     * Updates the play button UI.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {boolean} isPlaying - Whether playback is active.
     */
    updatePlayButton(pm, isPlaying) {
        if (!pm._playButton) return;

        if (isPlaying) {
            pm._playButton.innerHTML = `&nbsp;&nbsp;<img 
                src="header-icons/stop-button.svg"
                title="${pm._("Stop")}" 
                alt="${pm._("Stop")}" 
                height="${pm.constructor.ICONSIZE}" 
                width="${pm.constructor.ICONSIZE}" 
                vertical-align="middle"
            >&nbsp;&nbsp;`;
        } else {
            pm._playButton.innerHTML = `&nbsp;&nbsp;<img 
                src="header-icons/play-button.svg" 
                title="${pm._("Play")}" 
                alt="${pm._("Play")}" 
                height="${pm.constructor.ICONSIZE}" 
                width="${pm.constructor.ICONSIZE}" 
                vertical-align="middle"
            >&nbsp;&nbsp;`;
        }
    },

    /**
     * Applies selected state for matrix cells using classes when available.
     * Falls back to inline background in test environments that mock plain objects.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {HTMLElement} cell - Cell element.
     * @param {boolean} isSelected - Whether the cell should be selected.
     * @param {boolean} forceReset - Whether deselection should always reset background.
     */
    setCellSelectedState(pm, cell, isSelected, forceReset = false) {
        if (!cell) return;

        if (cell.classList && typeof cell.classList.toggle === "function") {
            cell.classList.toggle("phrasemaker-cell-selected", isSelected);
        }
        if (cell.style) {
            if (isSelected) {
                cell.style.backgroundColor =
                    pm && pm.platformColor ? pm.platformColor.selectorBackground : "black";
            } else if (
                forceReset ||
                (pm &&
                    pm.platformColor &&
                    cell.style.backgroundColor === pm.platformColor.selectorBackground) ||
                cell.style.backgroundColor === "black"
            ) {
                cell.style.backgroundColor =
                    pm && pm.platformColor ? pm.platformColor.rhythmcellcolor : "white";
            }
        }
    },

    /**
     * Highlights a cell in the matrix during playback.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {number} colIndex - Column index of the cell.
     * @param {number} rowIndex - Row index of the cell.
     */
    highlightCell(pm, colIndex, rowIndex) {
        if (!pm._rows[rowIndex]) return;

        const cell = pm._rows[rowIndex].cells[colIndex];
        this.setCellSelectedState(pm, cell, true);
    },

    /**
     * Removes highlight from a cell in the matrix.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {number} colIndex - Column index of the cell.
     * @param {number} rowIndex - Row index of the cell.
     */
    unhighlightCell(pm, colIndex, rowIndex) {
        if (!pm._rows[rowIndex]) return;

        const cell = pm._rows[rowIndex].cells[colIndex];
        this.setCellSelectedState(pm, cell, false);
    },

    /**
     * Updates the visual state of a note cell.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {HTMLElement} cell - The cell element to update.
     * @param {boolean} isActive - Whether the cell should be marked as active.
     */
    updateNoteCellVisual(pm, cell, isActive) {
        if (!cell) return;

        this.setCellSelectedState(pm, cell, isActive, true);

        if (isActive) {
            cell.innerHTML = "&#x2713;"; // checkmark
        } else {
            cell.innerHTML = "";
        }
    },

    /**
     * Calculates the width of a note cell based on its note value.
     * @param {Object} pm - The PhraseMaker instance.
     * @param {number} noteValue - The value of the note.
     * @returns {number} The calculated width of the note cell.
     */
    calculateNoteWidth(pm, noteValue) {
        return Math.max(Math.floor(EIGHTHNOTEWIDTH * (8 / noteValue) * pm._cellScale), 15);
    }
};

// Export for global use
window.PhraseMakerUI = PhraseMakerUI;

// Export for RequireJS/AMD
if (typeof define === "function" && define.amd) {
    define([], function () {
        return PhraseMakerUI;
    });
}

// Export for Node.js/CommonJS (for testing)
if (typeof module !== "undefined" && module.exports) {
    module.exports = PhraseMakerUI;
}
