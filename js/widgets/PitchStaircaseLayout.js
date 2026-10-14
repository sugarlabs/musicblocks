/**
 * MusicBlocks
 *
 * @copyright 2016-21 Walter Bender
 * @copyright 2016 Hemant Kasat
 * @copyright 2026 Music Blocks contributors
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

   _, SYNTHSVG, base64Encode, clampNumber, PitchStaircase
*/
/*
    Globals location
    - js/utils/utils.js
        _
    - js/base64Utils.js
        base64Encode
    - js/utils/utils-logic.js
        clampNumber
    - js/utils/musicutils-constants.js
        SYNTHSVG
    - js/widgets/pitchstaircase.js
        PitchStaircase
*/

/* exported PitchStaircaseLayout */

/**
 * @file PitchStaircaseLayout.js
 * @description Pitch Staircase layout: the play and step buttons, and building the table of
 * stairs, one row per stair with its play button and a step drawn to scale.
 *
 * The methods are moved as they were from the PitchStaircase class, which copies them onto
 * PitchStaircase.prototype (see PitchStaircase.installModules), so `this` is still the widget.
 */
class PitchStaircaseLayout {
    /**
     * Adds a button cell with an icon to a table row.
     * @private
     * @param {HTMLTableRowElement} row - The row to add the cell to.
     * @param {string} icon - The icon file in header-icons/.
     * @param {number} iconSize - The icon size in pixels.
     * @param {string} label - The button's title and alt text.
     * @returns {HTMLTableCellElement} The new cell.
     */
    _addButton(row, icon, iconSize, label) {
        const cell = row.insertCell(-1);
        cell.replaceChildren(
            document.createTextNode("\u00a0\u00a0"),
            (() => {
                const img = document.createElement("img");
                img.src = "header-icons/" + icon;
                img.title = label;
                img.alt = label;
                img.height = iconSize;
                img.width = iconSize;
                img.style.verticalAlign = "middle";
                img.style.alignContent = "center";
                return img;
            })(),
            document.createTextNode("\u00a0\u00a0")
        );
        cell.style.width = PitchStaircase.BUTTONSIZE + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.borderRadius = "6px";
        cell.classList.add("pitch-staircase-btn");

        return cell;
    }

    /**
     * Replaces the icon of a button.
     * @private
     * @param {HTMLElement} cell - The button.
     * @param {string} icon - The icon file in header-icons/.
     * @param {string} label - The button's title and alt text.
     * @returns {void}
     */
    _setButtonIcon(cell, icon, label) {
        if (!cell || typeof cell.replaceChildren !== "function") {
            return;
        }
        const img = document.createElement("img");
        img.src = "header-icons/" + icon;
        img.title = label;
        img.alt = label;
        img.height = PitchStaircase.ICONSIZE;
        img.width = PitchStaircase.ICONSIZE;
        img.style.verticalAlign = "middle";
        img.style.alignContent = "center";

        if (cell.classList.contains("pitch-staircase-btn")) {
            cell.replaceChildren(
                document.createTextNode("\u00a0\u00a0"),
                img,
                document.createTextNode("\u00a0\u00a0")
            );
        } else {
            cell.replaceChildren(img);
        }
    }

    /**
     * Finds the closest rational fraction p/q with q <= maxDen within tolerance.
     * @private
     * @param {number} val - Ratio value.
     * @param {number} [maxDen=8] - Maximum denominator.
     * @returns {{num: number, den: number}|null}
     */
    _findFraction(val, maxDen = 8) {
        if (typeof val !== "number" || !Number.isFinite(val) || val <= 0) {
            return null;
        }
        for (let d = 1; d <= maxDen; d++) {
            const num = Math.round(val * d);
            if (Math.abs(val - num / d) < 0.02) {
                const g = this._gcd(num, d);
                return { num: num / g, den: d / g };
            }
        }
        return null;
    }

    /**
     * Computes the greatest common divisor of two integers.
     * @private
     * @param {number} a
     * @param {number} b
     * @returns {number}
     */
    _gcd(a, b) {
        let x = Math.round(Math.abs(Number(a) || 0));
        let y = Math.round(Math.abs(Number(b) || 0));
        while (y) {
            const t = y;
            y = x % y;
            x = t;
        }
        return x || 1;
    }

    /**
     * Computes the least common multiple of two integers.
     * @private
     * @param {number} a
     * @param {number} b
     * @returns {number}
     */
    _lcm(a, b) {
        const x = Math.round(Math.abs(Number(a) || 0));
        const y = Math.round(Math.abs(Number(b) || 0));
        if (x === 0 || y === 0) {
            return 0;
        }
        return (x * y) / this._gcd(x, y);
    }

    /**
     * Calculates the number of wave cycles for a given frequency relative to the
     * baseline frequency in the staircase.
     * @private
     * @param {number} frequency - Frequency in Hz.
     * @returns {number} Number of cycles (clamped to 0.1 - 16).
     */
    _calculateCycles(frequency) {
        const safeFreq =
            typeof frequency === "number" && Number.isFinite(frequency) && frequency > 0
                ? frequency
                : PitchStaircase.DEFAULTFREQUENCY;

        const validFreqs = (this.Stairs || [])
            .map(stair => stair && stair[2])
            .filter(f => typeof f === "number" && Number.isFinite(f) && f > 0);

        if (validFreqs.length <= 1) {
            this._ratioExceedsLimit = false;
            return 2;
        }

        const minFreq = Math.min(...validFreqs);
        const maxFreq = Math.max(...validFreqs);
        const maxRatio = maxFreq / minFreq;

        // When the frequency ratio exceeds 16, a 16-cycle cap cannot represent the full
        // ratio with integer cycles without distorting relative repeats. We flag this
        // condition and scale uniformly so relative frequency ratios are preserved.
        if (maxRatio > 16) {
            this._ratioExceedsLimit = true;
            const scale = 16 / maxRatio;
            const rawCycles = (safeFreq / minFreq) * scale;
            return clampNumber(rawCycles, 0.1, 16);
        }

        this._ratioExceedsLimit = false;

        let commonDen = 1;
        let allRational = true;

        for (const f of validFreqs) {
            const ratio = f / minFreq;
            const frac = this._findFraction(ratio, 8);
            if (frac) {
                commonDen = this._lcm(commonDen, frac.den);
            } else {
                allRational = false;
                break;
            }
        }

        let baseCycles = 2; // Default baseline cycles per maintainer feedback
        if (allRational && commonDen >= 1) {
            if (commonDen * maxRatio <= 16) {
                baseCycles = commonDen;
                // If common denominator is 1 (e.g. unison or octaves) and doubling fits,
                // prefer 2 cycles for better visual clarity.
                if (baseCycles === 1 && 2 * maxRatio <= 16) {
                    baseCycles = 2;
                }
            } else {
                // If commonDen * maxRatio exceeds 16, scale baseline down so the full ratio
                // fits within 16 cycles without per-row clamping distortion.
                baseCycles = 2 * maxRatio <= 16 ? 2 : 1;
            }
        } else {
            // Fallback for irrational frequency ratios
            baseCycles = 2 * maxRatio <= 16 ? 2 : 1;
        }

        let rawCycles = baseCycles * (safeFreq / minFreq);
        if (Math.abs(rawCycles - Math.round(rawCycles)) < 0.01) {
            rawCycles = Math.round(rawCycles);
        }

        return clampNumber(rawCycles, 1, 16);
    }

    /**
     * Generates an SVG string containing a sine wave starting in phase at zero and rising,
     * along with vertical partition lines at each period boundary.
     * @private
     * @param {number} width - Total SVG width in pixels.
     * @param {number} height - Total SVG height in pixels.
     * @param {number} cycles - Number of wave cycles across the width.
     * @returns {string} The SVG markup.
     */
    _generateWaveSVG(width, height, cycles) {
        const safeWidth = Math.max(20, Number(width) || PitchStaircase.INNERWINDOWWIDTH);
        const safeHeight = Math.max(20, Number(height) || PitchStaircase.BUTTONSIZE);
        const safeCycles = Math.max(0.1, Number(cycles) || 1);
        const wavelength = safeWidth / safeCycles;
        const midY = safeHeight / 2;
        const amplitude = Math.max(5, midY - 8);

        // Build sine wave path points (starts at zero and goes upward in phase)
        const points = [];
        const step = Math.max(1, Math.min(2, safeWidth / (safeCycles * 40)));
        for (let x = 0; x <= safeWidth; x += step) {
            const y = midY - amplitude * Math.sin((2 * Math.PI * x) / wavelength);
            points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        }
        if (points.length > 0) {
            const lastY = midY - amplitude * Math.sin((2 * Math.PI * safeWidth) / wavelength);
            points.push(`${safeWidth.toFixed(1)},${lastY.toFixed(1)}`);
        }

        const wavePath = `<path d="M ${points.join(" L ")}" fill="none" stroke="#90c100" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`;

        // Vertical partition lines at each period boundary (bold, clear red dashed lines)
        const partitionLines = [];
        for (let x = 0; x <= safeWidth + 0.5; x += wavelength) {
            const clampedX = Math.min(safeWidth, Math.max(0, x));
            partitionLines.push(
                `<line x1="${clampedX.toFixed(1)}" y1="0" x2="${clampedX.toFixed(1)}" y2="${safeHeight}" stroke="#e74c3c" stroke-width="2" stroke-dasharray="6,4" />`
            );
        }

        return (
            `<svg xmlns="http://www.w3.org/2000/svg" width="${safeWidth}" height="${safeHeight}" viewBox="0 0 ${safeWidth} ${safeHeight}">` +
            partitionLines.join("") +
            wavePath +
            `</svg>`
        );
    }

    /**
     * Rebuilds the table of stairs from this.Stairs.
     * @private
     * @returns {void}
     */
    _makeStairs() {
        /**
         * Each row in the psc table contains separate table; each table contains a note label in
         * the first column and a table of buttons in the second column.
         */
        const pscTable = this._pscTable;
        // The rows are about to be replaced, so stop the stair that is playing; otherwise the new
        // play button would take its first click as Stop.
        if (this._playingRowIndex !== null) {
            this._stopRow();
        }
        pscTable.replaceChildren();
        pscTable.classList.add("mb-text-center");
        pscTable.style.textAlign = "center";
        pscTable.style.borderCollapse = "separate";
        pscTable.style.borderSpacing = "0 8px"; // Vertical gap between stair rows

        const safeScale =
            typeof this._cellScale === "number" &&
            Number.isFinite(this._cellScale) &&
            this._cellScale > 0
                ? this._cellScale
                : 1;
        const cellWidth = Math.round(PitchStaircase.INNERWINDOWWIDTH * safeScale);

        for (let i = 0; i < this.Stairs.length; i++) {
            const pscTableRow = pscTable.insertRow();
            const pscTableCell = pscTableRow.insertCell();
            const stepTable = document.createElement("table");
            stepTable.style.borderCollapse = "separate";
            stepTable.style.borderSpacing = "6px 0"; // Horizontal gap between play button and waveform cell
            stepTable.style.margin = "0 auto";
            this._stepTables[i] = stepTable;
            pscTableCell.append(stepTable);

            const stepTableRow = stepTable.insertRow();

            const frequency = this.Stairs[i][2];

            // The play button for this row.
            const playCell = this._addButton(
                stepTableRow,
                "play-button.svg",
                PitchStaircase.ICONSIZE,
                _("Play")
            );
            playCell.className = "headcol"; // This cell is fixed horizontally.
            playCell.setAttribute("id", i);
            playCell.style.cursor = "pointer";
            playCell.style.borderRadius = "6px";
            const stepCell = stepTableRow.insertCell();
            stepCell.setAttribute("id", frequency);
            const safeFreq =
                typeof frequency === "number" && Number.isFinite(frequency) && frequency > 0
                    ? frequency
                    : PitchStaircase.DEFAULTFREQUENCY;

            stepCell.style.width = cellWidth + "px";
            const labelSpan = document.createElement("span");
            labelSpan.style.pointerEvents = "none";
            labelSpan.style.fontWeight = "bold";
            labelSpan.style.fontSize = "13px";
            labelSpan.style.textShadow =
                "0 0 4px rgba(255, 255, 255, 0.95), 0 0 2px rgba(255, 255, 255, 0.95)";
            labelSpan.replaceChildren(
                document.createTextNode(frequency.toFixed(2)),
                document.createElement("br"),
                document.createTextNode(this.Stairs[i][0] + this.Stairs[i][1])
            );
            stepCell.replaceChildren(labelSpan);
            stepCell.style.minWidth = stepCell.style.width;
            stepCell.style.maxWidth = stepCell.style.width;
            stepCell.style.height = PitchStaircase.BUTTONSIZE + "px";
            stepCell.style.borderRadius = "6px";
            stepCell.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.2)";
            stepCell.classList.add("pitch-staircase-step");

            const cycles = this._calculateCycles(safeFreq);
            if (this._ratioExceedsLimit) {
                stepCell.title = _("Frequency ratio exceeds displayable range");
            }
            const svgString = this._generateWaveSVG(cellWidth, PitchStaircase.BUTTONSIZE, cycles);

            let encodedSvg = "";
            try {
                if (typeof base64Encode === "function") {
                    const encoded = base64Encode(svgString);
                    if (
                        encoded === svgString &&
                        typeof window !== "undefined" &&
                        typeof window.btoa === "function"
                    ) {
                        encodedSvg = window.btoa(encoded);
                    } else {
                        encodedSvg = encoded;
                    }
                } else if (typeof window !== "undefined" && typeof window.btoa === "function") {
                    encodedSvg = window.btoa(svgString);
                }
            } catch (e) {
                encodedSvg = "";
            }

            const svgData = "data:image/svg+xml;base64," + encodedSvg;
            stepCell.style.backgroundImage = "url(" + svgData + ")";
            stepCell.style.backgroundRepeat = "no-repeat";
            stepCell.style.backgroundPosition = "center center";

            stepCell.addEventListener("click", event => {
                this._dissectStair(event);
            });

            playCell.onclick = () => {
                const i = Number(playCell.getAttribute("id"));
                if (this._playingRowIndex === i) {
                    this._stopRow();
                } else {
                    const stepCell = this._stepTables[i].rows[0].cells[1];
                    this._playOne(stepCell, playCell);
                }
            };
        }
    }

    /**
     * Rebuilds the table of stairs.
     * @private
     * @returns {void}
     */
    _refresh() {
        this._makeStairs(true);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchStaircaseLayout;
}
