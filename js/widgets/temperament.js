/**
 * @file This contains the prototype of the JavaScript Editor Widget.
 * @author Riya Lohia
 *
 * @copyright 2018 Riya Lohia
 *
 * @license
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the The GNU Affero General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library; if not, write to the Free
 * Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/*
   global

   _, addTemperamentToDictionary, buildScale,
   deleteTemperamentFromList, docById, FLAT, getNoteFromInterval,
   getOctaveRatio, getTemperament, getTemperamentKeys, getTemperamentRatio,
   isCustomTemperament, last, normalizeNoteAccidentals, parseNoteString, pitchToFrequency, platformColor,
   PREVIEWVOLUME, ratioToWheelAngle, rationalToFraction, setOctaveRatio, setOctaveRatio, SHARP, Singer,
   slicePath, updateTemperaments, wheelnav, frequencyToPitch, clampNumber
 */

/* exported TemperamentWidget, deviationColor, deviationFrom12EDO, largestGapMid, sameNodeCents */

/** AMD module dependencies for lazy loading. */
TemperamentWidget.dependencies = ["widgets/temperament"];

/**
 * Represents a widget for managing temperament settings.
 * @constructor
 */

/**
 * Color for a cents deviation from a reference. Green within ±1 cent,
 * orange for sharp, red for flat. Exported for unit testing.
 * @param {number} dev - deviation in cents
 * @returns {string} CSS color
 */
const deviationColor = dev => (Math.abs(dev) <= 1 ? "#4caf50" : dev > 1 ? "#ff9800" : "#f44336");

/**
 * Deviation of a pitch (in cents) from the nearest 12-EDO step. The
 * visualizer uses 12-EDO as its fixed reference ring, so a 19-EDO step at
 * 63¢ shows as -37¢ (below the nearest 12-EDO step of 100¢), and a JI major
 * third at 386¢ shows as -14¢.
 * Exported for unit testing.
 * @param {number} cents - pitch in cents (0..1200)
 * @returns {number} deviation in cents from the nearest 100¢ step
 */
const deviationFrom12EDO = cents => cents - Math.round(cents / 100) * 100;

/** Mid of largest gap (circular 0..1200). Exported for testing. */
const largestGapMid = centsArr => {
    if (centsArr.length < 2) return 600;
    let maxGap = -1;
    let bestMid = 600;
    const sorted = [...centsArr].sort((a, b) => a - b);
    for (let i = 0; i < sorted.length; i++) {
        const cur = sorted[i];
        const nxt = sorted[(i + 1) % sorted.length] + (i + 1 >= sorted.length ? 1200 : 0);
        const gap = nxt - cur;
        if (gap > maxGap) {
            maxGap = gap;
            let mid = (cur + nxt) / 2;
            mid = ((mid % 1200) + 1200) % 1200;
            bestMid = Math.max(1, Math.min(1199, mid || 1));
        }
    }
    return bestMid;
};

/** Converts a ratio to cents relative to the tonic (1200 cents = 1 octave). */
const ratioToCents = (ratio, base) => 1200 * (Math.log10(ratio) / Math.log10(base));

/** Same-node cents: midpoint of largest gap (dir ignored, kept for API compat). */
const sameNodeCents = centsArr => largestGapMid(centsArr);

function TemperamentWidget() {
    // Constants for button and icon sizes
    const BUTTONDIVWIDTH = 430;

    /**
     * Size of the buttons.
     * @type {number}
     */
    const BUTTONSIZE = 53;

    /**
     * Size of the icons.
     * @type {number}
     */
    const ICONSIZE = 32;

    /**
     * Reference to the temperament table div. Created in init() since it
     * is not needed (and should not be attached to the DOM) until the
     * widget is actually opened.
     * @type {HTMLElement}
     */
    let temperamentTableDiv;

    /**
     * Reference to the temperament cell.
     * @type {HTMLElement|null}
     */

    /**
     * Current temperament.
     * @type {string|null}
     */
    this.inTemperament = null;
    this._playTimeout = null;

    /**
     * Last triggered event.
     * @type {string|null}
     */
    this.lastTriggered = null;

    /**
     * Array of notes.
     * @type {string[]}
     */
    this.notes = [];

    /**
     * Array of frequencies.
     * @type {number[]}
     */
    this.frequencies = [];

    /**
     * Array of intervals.
     * @type {number[]}
     */
    this.intervals = [];

    /**
     * Array of ratios.
     * @type {number[]}
     */
    this.ratios = [];

    /**
     * Array representing the scale.
     * @type {string[]}
     */
    this.scale = [];

    /**
     * Array representing the cents.
     * @type {number[]}
     */
    this.cents = [];

    /**
     * Array of scale notes.
     * @type {string[]}
     */
    this.scaleNotes = [];

    /**
     * Current pitch number.
     * @type {number}
     */
    this.pitchNumber = 0;

    /**
     * Flag indicating the playback direction.
     * @type {boolean}
     */
    this.playbackForward = true;

    /** Recomputes a frequencies array from ratios and a tonic frequency, each entry to 2dp. */
    const computeFrequencies = (ratios, baseFrequency, count) => {
        const frequencies = [];
        for (let i = 0; i <= count; i++) {
            frequencies[i] = (ratios[i] * baseFrequency).toFixed(2);
        }
        return frequencies;
    };

    /** Sets a wheelnav nav item's fill/hover/path/selected color attributes to one color. */
    const setNavItemColor = (navObj, index, color) => {
        navObj.navItems[index].fillAttr = color;
        navObj.navItems[index].sliceHoverAttr.fill = color;
        navObj.navItems[index].slicePathAttr.fill = color;
        navObj.navItems[index].sliceSelectedAttr.fill = color;
    };

    /** Builds the "preview"/"done" button pair shown while editing a temperament. */
    const addPreviewDoneButtonPair = (divAppend, container, marginLeft, preview) => {
        divAppend.id = "divAppend";
        divAppend.textContent = "";
        const previewDiv = document.createElement("div");
        previewDiv.id = "preview";
        previewDiv.style.cssFloat = "left";
        previewDiv.textContent = preview ? _("back") : _("preview");
        const doneDiv = document.createElement("div");
        doneDiv.id = "done_";
        doneDiv.style.cssFloat = "right";
        doneDiv.textContent = _("done");
        divAppend.appendChild(previewDiv);
        divAppend.appendChild(doneDiv);
        divAppend.style.textAlign = "center";
        divAppend.style.marginLeft = marginLeft;
        divAppend.style.height = "32px";
        divAppend.style.marginTop = "40px";
        divAppend.style.overflow = "auto";
        container.append(divAppend);

        const divAppend1 = docById("preview");
        divAppend1.style.height = "30px";
        divAppend1.style.marginLeft = "3px";
        divAppend1.style.backgroundColor = platformColor.selectorBackground;
        divAppend1.style.width = "215px";

        const divAppend2 = docById("done_");
        divAppend2.style.height = "30px";
        divAppend2.style.marginRight = "3px";
        divAppend2.style.backgroundColor = platformColor.selectorBackground;
        divAppend2.style.width = "205px";
    };

    /**
     * Adds a button to the widget.
     * @private
     * @param {HTMLTableRowElement} row - The table row to which the button will be added.
     * @param {string} icon - The icon file name.
     * @param {number} iconSize - The size of the icon.
     * @param {string} label - The label for the button.
     * @returns {HTMLTableCellElement} - The created table cell.
     */
    this._addButton = function (row, icon, iconSize, label) {
        const cell = row.insertCell(-1);
        cell.textContent = "\u00A0\u00A0";
        const img = document.createElement("img");
        img.src = `header-icons/${icon}`;
        img.title = label;
        img.alt = label;
        img.setAttribute("height", iconSize);
        img.setAttribute("width", iconSize);
        img.setAttribute("vertical-align", "middle");
        img.setAttribute("align-content", "center");
        cell.appendChild(img);
        cell.appendChild(document.createTextNode("\u00A0\u00A0"));
        cell.style.width = BUTTONSIZE + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.classList.add("temperament-selector-cell");

        cell.onmouseover = function () {
            this.classList.add("temperament-selector-hover");
        };

        cell.onmouseout = function () {
            this.classList.remove("temperament-selector-hover");
        };

        return cell;
    };

    /**
     * Creates the main wheel for the circle of notes.
     * @param {number[]} [ratios] - The ratios for the wheel.
     * @param {number} [pitchNumber] - The pitch number.
     * @returns {void}
     */
    this.createMainWheel = function (ratios, pitchNumber) {
        if (ratios === undefined) {
            ratios = this.ratios;
        }
        if (pitchNumber === undefined) {
            pitchNumber = this.pitchNumber;
        }
        const radius = 150;
        const height = 2 * radius + 60;

        const labels = [];
        for (let j = 0; j < pitchNumber; j++) {
            labels.push(j.toString());
        }

        this.notesCircle = new wheelnav("wheelDiv2", null, 350, 350);
        this.notesCircle.wheelRadius = 230;
        this.notesCircle.navItemsEnabled = false;
        this.notesCircle.navAngle = 270;
        this.notesCircle.navItemsContinuous = true;
        this.notesCircle.navItemsCentered = false;
        this.notesCircle.slicePathFunction = slicePath().MenuSliceWithoutLine;
        this.notesCircle.slicePathCustom = slicePath().MenuSliceCustomization();
        this.notesCircle.sliceSelectedPathCustom = this.notesCircle.slicePathCustom;
        this.notesCircle.sliceInitPathCustom = this.notesCircle.slicePathCustom;
        this.notesCircle.initWheel(labels);
        const angle = [];
        const baseAngle = [];
        const sliceAngle = [];
        const angleDiff = [];
        for (let i = 0; i < this.notesCircle.navItemCount; i++) {
            this.notesCircle.navItems[i].fillAttr = platformColor.selectorBackground || "#c8C8C8";
            this.notesCircle.navItems[i].titleAttr.font = "20 20px Impact, Charcoal, sans-serif";
            this.notesCircle.navItems[i].titleSelectedAttr.font =
                "20 20px Impact, Charcoal, sans-serif";
            angle[i] = ratioToWheelAngle(ratios[i], this.powerBase);
            if (i !== 0) {
                if (i === pitchNumber - 1) {
                    angleDiff[i - 1] = angle[0] + 360 - angle[i];
                } else {
                    angleDiff[i - 1] = angle[i] - angle[i - 1];
                }
            }
            if (i === 0) {
                sliceAngle[i] = 360 / pitchNumber;
                baseAngle[i] = this.notesCircle.navAngle - sliceAngle[0] / 2;
            } else {
                baseAngle[i] = baseAngle[i - 1] + sliceAngle[i - 1];
                sliceAngle[i] = 2 * (angle[i] - baseAngle[i]);
            }
            this.notesCircle.navItems[i].sliceAngle = sliceAngle[i];
        }

        let menuRadius = (2 * Math.PI * radius) / pitchNumber / 3;
        for (let i = 0; i < angleDiff.length; i++) {
            if (angleDiff[i] < 11) {
                menuRadius = (2 * Math.PI * radius) / pitchNumber / 6;
            }
        }
        if (menuRadius > 29) {
            menuRadius = (2 * Math.PI * radius) / 33;
        }
        this.notesCircle.slicePathCustom.menuRadius = menuRadius;
        this.notesCircle.createWheel();

        docById("wheelDiv2").style.position = "absolute";
        docById("wheelDiv2").style.height = height + "px";
        docById("wheelDiv2").style.width = BUTTONDIVWIDTH + "px";
        docById("wheelDiv2").style.zIndex = 5;
    };

    this._freqToCents = function (freq, baseFreq) {
        return 1200 * Math.log2(freq / baseFreq);
    };

    /**
     * Converts a cents offset back to an absolute frequency in Hz relative
     * to a base frequency.
     * @param {number} cents - The cents offset from base.
     * @param {number} baseFreq - The reference frequency in Hz.
     * @returns {number} The resulting frequency in Hz.
     */
    this._centsToFreq = function (cents, baseFreq) {
        return baseFreq * Math.pow(2, cents / 1200);
    };

    /** Hides and removes a wheelnav wheel if its container div is present in the DOM. */
    const removeWheelIfPresent = (divId, wheel) => {
        const el = docById(divId);
        if (el !== null) {
            el.style.display = "none";
            if (wheel && wheel.removeWheel) wheel.removeWheel();
        }
    };

    /**
     * Draws the visualizer view: 12-EDO reference ring with colored spokes
     * connecting to the active temperament's pitches, plus a scrollable table.
     * @returns {void}
     */
    this._visualizerView = function () {
        temperamentTableDiv.textContent = "";
        temperamentTableDiv.style.backgroundColor = "#1a1a2e";
        temperamentTableDiv.style.color = "#e0e0e0";
        temperamentTableDiv.style.fontFamily = "sans-serif";
        temperamentTableDiv.style.padding = "8px";
        temperamentTableDiv.style.height = "";
        temperamentTableDiv.style.overflow = "";

        const bodyWidth = temperamentTableDiv.parentElement
            ? temperamentTableDiv.parentElement.clientWidth - 16
            : 384;
        const bodyHeight = temperamentTableDiv.parentElement
            ? temperamentTableDiv.parentElement.clientHeight
            : 500;
        const controlsHeight = 36;
        const padding = 16;
        const canvasSize = Math.min(
            Math.max(bodyWidth, 280),
            Math.max(bodyHeight - controlsHeight - padding, 200)
        );
        const that = this;

        // Clean up menu/close handlers left from a previous render
        if (that._vizMenu && that._vizMenu.parentNode) {
            that._vizMenu.parentNode.removeChild(that._vizMenu);
            that._vizMenu = null;
        }
        if (that._vizMenuClose) {
            document.removeEventListener("mousedown", that._vizMenuClose);
            that._vizMenuClose = null;
        }
        const refName = "12-EDO";
        let highlightDot = -1;
        let flashDot = -1;
        const _isLocked = i => i === 0;

        const _canvasCoords = function (e, target) {
            const rect = target.getBoundingClientRect();
            return [
                ((e.clientX - rect.left) * target.width) / rect.width,
                ((e.clientY - rect.top) * target.height) / rect.height
            ];
        };

        // ── Controls bar: dropdowns + hide-table toggle ──
        const controlsDiv = document.createElement("div");
        controlsDiv.style.display = "flex";
        controlsDiv.style.alignItems = "center";
        controlsDiv.style.gap = "8px";
        controlsDiv.style.marginBottom = "8px";
        controlsDiv.style.flexWrap = "wrap";

        // Temperament selector — label + native select
        const _getTemperamentLabel = function (key) {
            const list = getTemperamentsList();
            for (const t of list) {
                if (t[1] === key) return t[0];
            }
            return key;
        };
        const temperLabel = document.createElement("span");
        temperLabel.style.fontSize = "13px";
        temperLabel.style.color = "#e0e0e0";
        temperLabel.style.whiteSpace = "nowrap";
        temperLabel.textContent = _getTemperamentLabel(that.inTemperament);
        controlsDiv.appendChild(temperLabel);

        // "Modified" indicator — shown when pitches differ from the saved temperament
        const modifiedLabel = document.createElement("span");
        modifiedLabel.style.fontSize = "11px";
        modifiedLabel.style.color = "#f0ad4e";
        modifiedLabel.style.marginLeft = "4px";
        modifiedLabel.style.fontStyle = "italic";
        modifiedLabel.textContent = "";
        modifiedLabel.style.display = "none";
        controlsDiv.appendChild(modifiedLabel);

        // Snapshot of ratios at load time, used to detect modifications
        let _originalRatios = that.ratios.map(r => Number(r.toFixed(3)));
        const _checkModified = function () {
            const cur = that.ratios.map(r => Number(r.toFixed(3)));
            const isModified =
                cur.length !== _originalRatios.length ||
                cur.some((r, idx) => idx < _originalRatios.length && r !== _originalRatios[idx]);
            modifiedLabel.textContent = isModified ? _("modified") : "";
            modifiedLabel.style.display = isModified ? "inline" : "none";
        };

        const compareSelect = document.createElement("select");
        compareSelect.title = _("temperament");
        compareSelect.setAttribute("aria-label", _("temperament"));
        compareSelect.style.fontSize = "12px";
        compareSelect.style.padding = "4px 8px";
        compareSelect.style.border = "1px solid #555";
        compareSelect.style.borderRadius = "6px";
        compareSelect.style.background = "#2a2a3e";
        compareSelect.style.color = "#e0e0e0";
        compareSelect.style.cursor = "pointer";
        compareSelect.style.flexShrink = "0";

        const temperaments = getTemperamentsList();
        for (const t of temperaments) {
            if (isCustomTemperament(t[1]) && t[1] !== that.inTemperament) continue;
            const opt = document.createElement("option");
            opt.value = t[1];
            opt.textContent = t[0];
            if (t[1] === that.inTemperament) opt.selected = true;
            compareSelect.appendChild(opt);
        }

        compareSelect.onchange = function () {
            temperLabel.textContent = _getTemperamentLabel(compareSelect.value);
        };

        controlsDiv.appendChild(compareSelect);

        temperamentTableDiv.appendChild(controlsDiv);

        // ── Operations toolbar (presets + pitch count) ──
        that._playAllTimer = null;
        that._playAllRunning = false;
        const _playAll = function () {
            if (that._playAllRunning) {
                clearTimeout(that._playAllTimer);
                that._playAllRunning = false;
                flashDot = -1;
                _drawCircle();
                return;
            }
            that._playAllRunning = true;
            let i = 0;
            let forward = true;
            const step = function () {
                if (!that._playAllRunning) {
                    flashDot = -1;
                    _drawCircle();
                    return;
                }
                // Guard: only play valid indices
                if (i >= 0 && i < that.pitchNumber) {
                    _playNote(i);
                }
                // Advance
                if (forward) {
                    i++;
                    if (i >= that.pitchNumber) {
                        forward = false;
                        i = that.pitchNumber - 1;
                        // For ≤2 pitches there is no meaningful reverse pass
                        if (i < 1) {
                            that._playAllRunning = false;
                            flashDot = -1;
                            _drawCircle();
                            return;
                        }
                    }
                } else {
                    i--;
                    if (i < 1) {
                        that._playAllRunning = false;
                        flashDot = -1;
                        _drawCircle();
                        return;
                    }
                }
                that._playAllTimer = setTimeout(step, 300);
            };
            step();
        };
        // Expose on the widget instance for the public playAll() wrapper
        that._playAll = _playAll;

        const _addPitch = function () {
            const cents = largestGapMid(that.cents);
            const idx = that.cents.findIndex(c => cents < c);
            _insertPitch(idx === -1 ? that.cents.length : idx, cents);
            highlightDot = idx;
            _drawCircle();
            _buildTable();
            _highlightTableRow(highlightDot);
            _updateRemoveButton();
            _checkModified();
        };
        const _updateRemoveButton = () => {
            if (!that._vizToolbar) return;
            const btn = that._vizToolbar.removePitchBtn;
            if (!btn || !btn.style) return;
            const locked = highlightDot >= 0 && _isLocked(highlightDot);
            btn.style.opacity = locked ? "0.4" : "1";
            btn.style.pointerEvents = locked ? "none" : "auto";
            btn.style.cursor = locked ? "not-allowed" : "pointer";
        };

        // ── Canvas ──
        const canvas = document.createElement("canvas");
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        canvas.style.width = "100%";
        canvas.style.maxWidth = canvasSize + "px";
        canvas.style.display = "block";
        canvas.style.margin = "0 auto";
        temperamentTableDiv.appendChild(canvas);

        // ── Legend (HTML, below canvas — avoids overlapping note labels) ──
        const legendDiv = document.createElement("div");
        legendDiv.style.display = "flex";
        legendDiv.style.justifyContent = "center";
        legendDiv.style.gap = "10px";
        legendDiv.style.flexWrap = "wrap";
        legendDiv.style.marginTop = "4px";
        legendDiv.style.fontSize = "10px";
        legendDiv.style.color = "#aaa";

        const _legendItem = function (color, label, isDashed, isDot) {
            const span = document.createElement("span");
            span.style.display = "inline-flex";
            span.style.alignItems = "center";
            span.style.gap = "3px";
            const indicator = document.createElement("span");
            indicator.style.display = "inline-block";
            if (isDot) {
                indicator.style.width = "8px";
                indicator.style.height = "8px";
                indicator.style.borderRadius = "50%";
                indicator.style.backgroundColor = color;
            } else {
                indicator.style.width = "12px";
                indicator.style.height = isDashed ? "0" : "2px";
                indicator.style.borderTop = isDashed ? "2px dashed " + color : "none";
                if (!isDashed) indicator.style.backgroundColor = color;
            }
            span.appendChild(indicator);
            span.appendChild(document.createTextNode(label));
            return span;
        };

        legendDiv.appendChild(_legendItem("#4caf50", _("active temperament"), false, true));
        legendDiv.appendChild(_legendItem("#aaa", _("12-EDO reference"), false, false));
        legendDiv.appendChild(_legendItem("#4caf50", _("no deviation"), true, false));
        legendDiv.appendChild(_legendItem("#ff9800", _("sharp (+cents)"), false, false));
        legendDiv.appendChild(_legendItem("#f44336", _("flat (-cents)"), false, false));
        temperamentTableDiv.appendChild(legendDiv);

        canvas.tabIndex = 0;
        canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", _("Temperament visualizer circle"));

        let focusedDot = -1;

        const _triggerFocused = function () {
            that._logo.resetSynth(0);
            that._logo.synth.trigger(
                0,
                Number(that.frequencies[focusedDot]),
                1 / 4,
                "electronic synth",
                null,
                null
            );
        };

        canvas.onkeydown = function (e) {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                focusedDot = (focusedDot + 1) % that.pitchNumber;
                _triggerFocused();
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                focusedDot = (focusedDot - 1 + that.pitchNumber) % that.pitchNumber;
                _triggerFocused();
            } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (focusedDot >= 0) _triggerFocused();
            }
        };

        const ctx = canvas.getContext("2d");
        const cx = canvasSize / 2;
        const cy = canvasSize / 2;
        const outerR = canvasSize * 0.34;
        const innerR = canvasSize * 0.24;
        const dotR = Math.max(4, canvasSize * 0.012);

        const equal = getTemperament("equal");
        const labels = equal.noteLabels;

        const _drawCircle = function () {
            ctx.clearRect(0, 0, canvasSize, canvasSize);
            ctx.lineWidth = 1;
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            for (let k = 0; k < 12; k++) {
                const a = ((270 + k * 30) * Math.PI) / 180;
                const x1 = cx + (outerR - 10) * Math.cos(a);
                const y1 = cy + (outerR - 10) * Math.sin(a);
                const x2 = cx + (outerR + 6) * Math.cos(a);
                const y2 = cy + (outerR + 6) * Math.sin(a);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = "#666";
                ctx.stroke();
                const lx = cx + (outerR + 18) * Math.cos(a);
                const ly = cy + (outerR + 18) * Math.sin(a);
                ctx.fillStyle = "#aaa";
                ctx.fillText(labels[k], lx, ly);
            }

            // Inner dots and spokes for active temperament
            for (let i = 0; i < that.pitchNumber; i++) {
                const cents = that.cents[i];
                const angleDeg = 270 + cents * 0.3;
                const dev = deviationFrom12EDO(that.cents[i]);

                const dashed = Math.abs(dev) <= 1;
                const color = deviationColor(dev);

                const dotA = (angleDeg * Math.PI) / 180;
                const dx = cx + innerR * Math.cos(dotA);
                const dy = cy + innerR * Math.sin(dotA);

                const k = Math.round(cents / 100) % 12;
                const refAngleDeg = 270 + ((k + 12) % 12) * 30;
                const tickA = (refAngleDeg * Math.PI) / 180;
                const tx = cx + outerR * Math.cos(tickA);
                const ty = cy + outerR * Math.sin(tickA);

                ctx.beginPath();
                ctx.setLineDash(dashed ? [4, 3] : []);
                ctx.moveTo(dx, dy);
                ctx.lineTo(tx, ty);
                ctx.strokeStyle = color;
                ctx.stroke();
                ctx.setLineDash([]);

                ctx.beginPath();
                ctx.arc(dx, dy, dotR, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();

                if (i === highlightDot || i === flashDot) {
                    ctx.beginPath();
                    ctx.arc(dx, dy, dotR + 7, 0, 2 * Math.PI);
                    ctx.strokeStyle = "#ffeb3b";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(dx, dy, dotR + 3, 0, 2 * Math.PI);
                    ctx.strokeStyle = "#fff";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.lineWidth = 1;
                }
            }

            ctx.fillStyle = "#e0e0e0";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            if (highlightDot >= 0 && highlightDot < that.pitchNumber) {
                const selCents = Math.round(that.cents[highlightDot]);
                const selHz = that.frequencies[highlightDot];
                const noteName = that.notes[highlightDot];
                const label = noteName ? noteName[0] + noteName[1] : "";
                ctx.font = "bold 14px sans-serif";
                ctx.fillText(label, cx, cy - 10);
                ctx.font = "12px sans-serif";
                ctx.fillText(selCents + "¢  " + selHz + " Hz", cx, cy + 8);
            } else {
                ctx.fillText(that.inTemperament + " vs 12-EDO", cx, cy);
            }
            canvas.offsetWidth;
        };

        _drawCircle();

        // ── Table ──
        const tableDiv = document.createElement("div");
        tableDiv.style.width = "100%";
        tableDiv.style.marginTop = "8px";
        temperamentTableDiv.appendChild(tableDiv);

        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";
        table.style.fontSize = "12px";
        tableDiv.appendChild(table);

        const thead = document.createElement("tr");
        const headers = [
            _("Pitch"),
            _("Step"),
            _("Frequency (Hz)"),
            _("Cents dev. from 12-EDO"),
            _("Ratio")
        ];
        for (const h of headers) {
            const th = document.createElement("th");
            th.textContent = h;
            th.style.border = "1px solid #333";
            th.style.padding = "6px 8px";
            th.style.textAlign = "center";
            th.style.backgroundColor = "#2a2a3e";
            th.style.color = "#ccc";
            th.style.fontWeight = "bold";
            thead.appendChild(th);
        }
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        table.appendChild(tbody);
        const rowRefs = [];

        /** Ups-and-downs prefix for a cents value (deviation from 12-EDO). */
        const _updown = function (cents) {
            const dev = cents - Math.round(cents / 100) * 100;
            if (dev > 30) return "^^";
            if (dev > 15) return "^";
            if (dev < -30) return "vv";
            if (dev < -15) return "v";
            return "";
        };

        /** (Re)builds the table rows from current state, storing cell refs. */
        const _buildTable = function () {
            tbody.textContent = "";
            rowRefs.length = 0;
            for (let i = 0; i < that.pitchNumber; i++) {
                const tr = document.createElement("tr");
                const bgColor = i % 2 === 0 ? "#1a1a2e" : "#22223a";
                tr.style.backgroundColor = bgColor;
                tr.style.cursor = "pointer";

                const tdName = document.createElement("td");
                const tdStep = document.createElement("td");
                const tdFreq = document.createElement("td");
                const tdCents = document.createElement("td");
                const tdRatio = document.createElement("td");

                for (const td of [tdName, tdStep, tdFreq, tdCents, tdRatio]) {
                    td.style.border = "1px solid #333";
                    td.style.padding = "6px 8px";
                    td.style.textAlign = "center";
                    td.style.backgroundColor = bgColor;
                    tr.appendChild(td);
                }
                // Higher pitches on top: insert each row at the top of tbody
                tbody.insertBefore(tr, tbody.firstChild);
                const ref = {
                    tr: tr,
                    name: tdName,
                    step: tdStep,
                    freq: tdFreq,
                    cents: tdCents,
                    ratio: tdRatio,
                    bgColor: bgColor
                };
                rowRefs.push(ref);
                const cells = [tdName, tdStep, tdFreq, tdCents, tdRatio];
                tr.onmouseenter = function () {
                    for (const td of cells) td.style.backgroundColor = "#33334d";
                };
                tr.onmouseleave = function () {
                    for (const td of cells)
                        td.style.backgroundColor = ref.selected ? "#3a3a5e" : bgColor;
                };
                tr.onclick = function () {
                    highlightDot = i;
                    _drawCircle();
                    _highlightTableRow(i);
                    _updateRemoveButton();
                };
                tr.oncontextmenu = function (e) {
                    e.preventDefault();
                    _showMenu(e, i);
                };
                tdCents.style.cursor = _isLocked(i) ? "default" : "text";
                tdCents.ondblclick = function (ev) {
                    ev.stopPropagation();
                    if (_isLocked(i)) return;
                    const prev = i > 0 ? that.cents[i - 1] : null;
                    const next = i < that.pitchNumber - 1 ? that.cents[i + 1] : null;
                    const cur = that.cents[i];
                    const lo = prev !== null ? prev + 1 : 1;
                    const hi = next !== null ? next - 1 : Infinity;
                    const input = document.createElement("input");
                    input.type = "number";
                    input.step = "0.1";
                    input.min = String(lo);
                    if (hi !== Infinity) input.max = String(hi);
                    input.value = cur.toFixed(1);
                    const dev = deviationFrom12EDO(cur);
                    input.title =
                        "Absolute cents (" +
                        lo.toFixed(1) +
                        " \u2013 " +
                        hi.toFixed(1) +
                        "); deviation from 12-EDO: " +
                        dev.toFixed(1) +
                        "\u00A2";
                    input.setAttribute(
                        "aria-label",
                        "Cents for pitch " + i + ", absolute 0-1200, between neighbors"
                    );
                    input.style.width = "70px";
                    input.style.fontSize = "12px";
                    input.style.background = "#2a2a3e";
                    input.style.color = "#e0e0e0";
                    input.style.border = "1px solid #555";
                    input.style.borderRadius = "3px";
                    input.style.textAlign = "center";
                    tdCents.textContent = "";
                    tdCents.appendChild(input);
                    input.focus();
                    input.select();
                    const _commit = function () {
                        let v = parseFloat(input.value);
                        if (isNaN(v)) {
                            _updateTableRow(i);
                            return;
                        }
                        v = Math.max(lo, Math.min(hi, v));
                        _applyCents(i, v);
                        const order = that.cents
                            .map((c, idx) => [c, idx])
                            .sort((a, b) => a[0] - b[0])
                            .map(p => p[1]);
                        _reorderArrays(order);
                        highlightDot = order.indexOf(i);
                        _drawCircle();
                        _buildTable();
                        if (highlightDot >= 0) _highlightTableRow(highlightDot);
                        _updateRemoveButton();
                        _checkModified();
                    };
                    input.onblur = _commit;
                    input.onkeydown = function (e) {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            input.blur();
                        } else if (e.key === "Escape") {
                            e.preventDefault();
                            input.onblur = null;
                            _updateTableRow(i);
                        }
                    };
                };
                tdFreq.style.cursor = _isLocked(i) ? "default" : "text";
                tdFreq.ondblclick = function (ev) {
                    ev.stopPropagation();
                    if (_isLocked(i)) return;
                    const prev = i > 0 ? Number(that.frequencies[i - 1]) : null;
                    const next = i < that.pitchNumber - 1 ? Number(that.frequencies[i + 1]) : null;
                    const cur = Number(that.frequencies[i]);
                    const lo = prev !== null ? prev + 0.01 : 0.01;
                    const hi = next !== null ? next - 0.01 : Infinity;
                    const input = document.createElement("input");
                    input.type = "number";
                    input.step = "0.01";
                    input.min = String(lo);
                    if (hi !== Infinity) input.max = String(hi);
                    input.value = cur.toFixed(2);
                    const hiStr = hi !== Infinity ? hi.toFixed(2) : "\u221E";
                    input.title = "Frequency in Hz (" + lo.toFixed(2) + " \u2013 " + hiStr + ")";
                    input.setAttribute(
                        "aria-label",
                        "Frequency for pitch " + i + " in Hz, between neighbors"
                    );
                    input.style.width = "70px";
                    input.style.fontSize = "12px";
                    input.style.background = "#2a2a3e";
                    input.style.color = "#e0e0e0";
                    input.style.border = "1px solid #555";
                    input.style.borderRadius = "3px";
                    input.style.textAlign = "center";
                    tdFreq.textContent = "";
                    tdFreq.appendChild(input);
                    input.focus();
                    input.select();
                    const _commit2 = function () {
                        let v = parseFloat(input.value);
                        if (isNaN(v)) {
                            _updateTableRow(i);
                            return;
                        }
                        v = Math.max(lo, Math.min(hi, v));
                        that.frequencies[i] = v.toFixed(2);
                        that.ratios[i] = v / Number(that.frequencies[0]);
                        that.cents[i] = ratioToCents(that.ratios[i], that.powerBase);
                        if (that.ratiosNotesPair[i]) that.ratiosNotesPair[i][0] = that.ratios[i];
                        const order = that.cents
                            .map((c, idx) => [c, idx])
                            .sort((a, b) => a[0] - b[0])
                            .map(p => p[1]);
                        _reorderArrays(order);
                        highlightDot = order.indexOf(i);
                        _drawCircle();
                        _buildTable();
                        if (highlightDot >= 0) _highlightTableRow(highlightDot);
                        _updateRemoveButton();
                        _checkModified();
                    };
                    input.onblur = _commit2;
                    input.onkeydown = function (e) {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            input.blur();
                        } else if (e.key === "Escape") {
                            e.preventDefault();
                            input.onblur = null;
                            _updateTableRow(i);
                        }
                    };
                };
                tdRatio.style.cursor = _isLocked(i) ? "default" : "text";
                tdRatio.ondblclick = function (ev) {
                    ev.stopPropagation();
                    if (_isLocked(i)) return;
                    const prev = i > 0 ? that.ratios[i - 1] : null;
                    const next = i < that.pitchNumber - 1 ? that.ratios[i + 1] : null;
                    const cur = that.ratios[i];
                    const lo = prev !== null ? prev + 0.001 : 0.001;
                    const hi = next !== null ? next - 0.001 : Infinity;
                    const input = document.createElement("input");
                    input.type = "number";
                    input.step = "0.001";
                    input.min = String(lo);
                    if (hi !== Infinity) input.max = String(hi);
                    input.value = cur.toFixed(3);
                    const hiStr = hi !== Infinity ? hi.toFixed(3) : "\u221E";
                    input.title = "Ratio (" + lo.toFixed(3) + " \u2013 " + hiStr + ")";
                    input.setAttribute(
                        "aria-label",
                        "Ratio for pitch " + i + ", between neighbors"
                    );
                    input.style.width = "70px";
                    input.style.fontSize = "12px";
                    input.style.background = "#2a2a3e";
                    input.style.color = "#e0e0e0";
                    input.style.border = "1px solid #555";
                    input.style.borderRadius = "3px";
                    input.style.textAlign = "center";
                    tdRatio.textContent = "";
                    tdRatio.appendChild(input);
                    input.focus();
                    input.select();
                    const _commit3 = function () {
                        let v = parseFloat(input.value);
                        if (isNaN(v)) {
                            _updateTableRow(i);
                            return;
                        }
                        v = Math.max(lo, Math.min(hi, v));
                        that.ratios[i] = v;
                        that.cents[i] = ratioToCents(v, that.powerBase);
                        that.frequencies[i] = (Number(that.frequencies[0]) * v).toFixed(2);
                        if (that.ratiosNotesPair[i]) that.ratiosNotesPair[i][0] = v;
                        const order = that.cents
                            .map((c, idx) => [c, idx])
                            .sort((a, b) => a[0] - b[0])
                            .map(p => p[1]);
                        _reorderArrays(order);
                        highlightDot = order.indexOf(i);
                        _drawCircle();
                        _buildTable();
                        if (highlightDot >= 0) _highlightTableRow(highlightDot);
                        _updateRemoveButton();
                        _checkModified();
                    };
                    input.onblur = _commit3;
                    input.onkeydown = function (e) {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            input.blur();
                        } else if (e.key === "Escape") {
                            e.preventDefault();
                            input.onblur = null;
                            _updateTableRow(i);
                        }
                    };
                };
            }
            _refreshTable();
        };

        /** Updates all table cell text from current state. */
        const _refreshTable = function () {
            for (let i = 0; i < rowRefs.length; i++) {
                _updateTableRow(i);
            }
        };

        /** Highlights the selected table row. */
        const _highlightTableRow = function (index) {
            for (let i = 0; i < rowRefs.length; i++) {
                const ref = rowRefs[i];
                ref.selected = i === index;
                const color = ref.selected ? "#3a3a5e" : ref.bgColor;
                for (const td of [ref.name, ref.step, ref.freq, ref.cents, ref.ratio]) {
                    td.style.backgroundColor = color;
                }
            }
        };

        /** Updates a single row (used during drag). */
        const _updateTableRow = function (i) {
            if (!rowRefs[i]) return;
            const cents = that.cents[i];
            const dev = deviationFrom12EDO(that.cents[i]);
            rowRefs[i].name.textContent = _updown(cents) + that.notes[i][0];
            rowRefs[i].step.textContent = i;
            rowRefs[i].freq.textContent = that.frequencies[i];
            rowRefs[i].cents.textContent = (dev >= 0 ? "+" : "") + dev.toFixed(1);
            rowRefs[i].cents.style.color = deviationColor(dev);
            rowRefs[i].ratio.textContent = that.ratios[i].toFixed(3);
        };

        _buildTable();

        const hint = document.createElement("div");
        hint.textContent = _("scroll for all") + " " + that.pitchNumber + " " + _("pitches");
        hint.style.textAlign = "center";
        hint.style.fontSize = "11px";
        hint.style.color = "#777";
        hint.style.marginTop = "4px";
        tableDiv.appendChild(hint);

        // ── Interactivity ──
        const _reorderArrays = function (order) {
            that.cents = order.map(i => that.cents[i]);
            that.ratios = order.map(i => that.ratios[i]);
            that.frequencies = order.map(i => that.frequencies[i]);
            that.notes = order.map(i => that.notes[i]);
            that.intervals = order.map(i => that.intervals[i]);
            that.ratiosNotesPair = order.map(i => that.ratiosNotesPair[i]);
        };

        const _applyCents = function (i, cents) {
            if (_isLocked(i)) return;
            const EPS = 1;
            const prevCents = i > 0 ? that.cents[i - 1] : null;
            const nextCents = i < that.pitchNumber - 1 ? that.cents[i + 1] : null;
            const minCents = prevCents !== null ? prevCents + EPS : EPS;
            const maxCents = nextCents !== null ? nextCents - EPS : 1200 - EPS;
            let v = cents;
            if (!isFinite(v)) return;
            v = Math.max(minCents, Math.min(maxCents, v));
            v = Math.round(v * 10) / 10;
            that.cents[i] = v;
            that.ratios[i] = Math.pow(that.powerBase, v / 1200);
            that.frequencies[i] = (Number(that.frequencies[0]) * that.ratios[i]).toFixed(2);
            if (that.ratiosNotesPair[i]) that.ratiosNotesPair[i][0] = that.ratios[i];
        };

        const _centsFromPointer = function (i, px, py) {
            const a = ((Math.atan2(py - cy, px - cx) * 180) / Math.PI + 360) % 360;
            let rawCents = (a - 270) / 0.3;
            while (rawCents - that.cents[i] > 600) rawCents -= 1200;
            while (rawCents - that.cents[i] < -600) rawCents += 1200;
            return rawCents;
        };

        const _insertPitch = function (index, cents) {
            if (!isFinite(cents)) return;
            if (index < 0) index = 0;
            if (index > that.pitchNumber) index = that.pitchNumber;
            that.pitchNumber += 1;
            that.cents.splice(index, 0, cents);
            that.ratios.splice(index, 0, Math.pow(that.powerBase, cents / 1200));
            that.frequencies.splice(
                index,
                0,
                (Number(that.frequencies[0]) * that.ratios[index]).toFixed(2)
            );
            // Derive note name from the temperament's own conversion, not 12-EDO labels
            const freq = Number(that.frequencies[0]) * that.ratios[index];
            const obj = frequencyToPitch(freq, that.inTemperament);
            that.notes.splice(index, 0, [obj[0], obj[1]]);
            that.intervals.splice(index, 0, "");
            that.ratiosNotesPair.splice(index, 0, [that.ratios[index], that.notes[index]]);
        };

        const _removePitch = function (index) {
            if (that.pitchNumber <= 1) return;
            if (index < 0 || index >= that.pitchNumber) return;
            if (_isLocked(index)) return;
            that.cents.splice(index, 1);
            that.ratios.splice(index, 1);
            that.frequencies.splice(index, 1);
            that.notes.splice(index, 1);
            that.intervals.splice(index, 1);
            that.ratiosNotesPair.splice(index, 1);
            that.pitchNumber -= 1;
        };

        const _resetTo12 = function (index) {
            _applyCents(index, Math.round(that.cents[index] / 100) * 100);
        };

        const _playNote = function (index) {
            that._logo.resetSynth(0);
            that._logo.synth.trigger(
                0,
                Number(that.frequencies[index]),
                1 / 4,
                "electronic synth",
                null,
                null
            );
            flashDot = index;
            _drawCircle();
            setTimeout(function () {
                flashDot = -1;
                _drawCircle();
            }, 200);
        };

        const _findNearest = function (px, py, maxDist) {
            let nearest = null;
            let nearestDist = Infinity;
            for (let i = 0; i < that.pitchNumber; i++) {
                const cents = that.cents[i];
                const angleDeg = 270 + cents * 0.3;
                const dotA = (angleDeg * Math.PI) / 180;
                const dx = cx + innerR * Math.cos(dotA);
                const dy = cy + innerR * Math.sin(dotA);
                const dist = Math.hypot(dx - px, dy - py);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = i;
                }
            }
            return nearest !== null && nearestDist <= maxDist ? nearest : null;
        };

        // Loads a temperament key (shared by dropdown + ops toolbar)
        const _loadTemperament = function (key) {
            that.inTemperament = key;
            let t = getTemperament(that.inTemperament);
            if (!t || !t.pitchNumber) {
                t = getTemperament("equal");
                that.inTemperament = "equal";
            }
            that._logo.synth.inTemperament = that.inTemperament;
            that.pitchNumber = t.pitchNumber;
            that.scale = Array.isArray(that.scale)
                ? that.scale[0] + " " + that.scale[1]
                : that.scale;
            that.scaleNotes = buildScale(that.scale);
            that.scaleNotes = that.scaleNotes[0];
            that.powerBase = 2;

            const startingPitch = that._logo.synth.startingPitch;
            that.notes = [];
            that.frequencies = [];
            that.cents = [];
            that.intervals = [];
            that.ratios = [];
            that.ratiosNotesPair = [];

            for (let i = 0; i < that.pitchNumber; i++) {
                if (isCustomTemperament(that.inTemperament)) {
                    const entry = t["" + i];
                    if (entry && entry[1] !== undefined) {
                        const peNotes = [entry[1], entry[2]];
                        const peRatios = entry[0];
                        that.notes[i] = peNotes;
                        that.ratios[i] = peRatios;
                        that.cents[i] = ratioToCents(peRatios, that.powerBase);
                        that.frequencies[i] =
                            i === 0
                                ? that._logo.synth
                                      .getCustomFrequency(
                                          peNotes[0] + peNotes[1],
                                          that.inTemperament
                                      )
                                      .toFixed(2)
                                : (Number(that.frequencies[0]) * peRatios).toFixed(2);
                        that.intervals[i] = peRatios;
                        that.ratiosNotesPair[i] = [peRatios, peNotes];
                        continue;
                    }
                    // No stored note data: fall back to equal temperament display.
                    t = getTemperament("equal");
                }
                if (!t || !t.interval || i >= t.interval.length) continue;

                const str_i = getNoteFromInterval(startingPitch, t.interval[i]);
                that.notes[i] = str_i;
                let noteName = str_i[0];
                if (
                    noteName.substring(1, noteName.length) === FLAT ||
                    noteName.substring(1, noteName.length) === "b"
                ) {
                    noteName = noteName.replace(FLAT, "b");
                } else if (
                    noteName.substring(1, noteName.length) === SHARP ||
                    noteName.substring(1, noteName.length) === "#"
                ) {
                    noteName = noteName.replace(SHARP, "#");
                }

                that.intervals[i] = t.interval[i];
                that.ratios[i] = getTemperamentRatio(t[that.intervals[i]]);
                that.cents[i] = ratioToCents(that.ratios[i], that.powerBase);
                if (i === 0) {
                    that.frequencies[i] = that._logo.synth
                        ._getFrequency(noteName + str_i[1], true, that.inTemperament)
                        .toFixed(2);
                } else {
                    that.frequencies[i] = (that.frequencies[0] * that.ratios[i]).toFixed(2);
                }
                that.ratiosNotesPair[i] = [that.ratios[i], that.notes[i]];
            }

            // Reset the "modified" snapshot for the newly loaded temperament
            _originalRatios = that.ratios.map(r => Number(r.toFixed(3)));
            _checkModified();

            that._visualizerView();
        };

        let dragIndex = -1;
        let dragMoved = false;
        let lockedDrag = false;
        let longPressTimer = null;
        const _clearLongPress = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        };

        // ── Context menu ──
        const _removeMenu = function () {
            if (that._vizMenu && that._vizMenu.parentNode) {
                that._vizMenu.parentNode.removeChild(that._vizMenu);
            }
            that._vizMenu = null;
            if (that._vizMenuClose) {
                document.removeEventListener("mousedown", that._vizMenuClose);
                that._vizMenuClose = null;
            }
        };

        const _closeMenu = function (e) {
            if (that._vizMenu && !that._vizMenu.contains(e.target)) {
                _removeMenu();
            }
        };

        const _showMenu = function (e, index) {
            e.preventDefault();
            _removeMenu();
            const menu = document.createElement("div");
            menu.style.position = "fixed";
            menu.style.left = e.clientX + "px";
            menu.style.top = e.clientY + "px";
            menu.style.background = "#2a2a3e";
            menu.style.border = "1px solid #555";
            menu.style.borderRadius = "4px";
            menu.style.padding = "6px";
            menu.style.zIndex = "1000";
            menu.style.fontSize = "12px";
            menu.style.color = "#e0e0e0";
            menu.style.display = "flex";
            menu.style.flexDirection = "column";
            menu.style.gap = "4px";

            const centsInput = document.createElement("input");
            centsInput.type = "number";
            centsInput.step = "0.1";
            centsInput.value = that.cents[index].toFixed(1);
            centsInput.style.width = "80px";
            centsInput.style.fontSize = "12px";

            const applyBtn = document.createElement("button");
            applyBtn.textContent = _("Set cents");
            applyBtn.style.fontSize = "11px";
            applyBtn.onclick = function (ev) {
                ev.stopPropagation();
                const v = parseFloat(centsInput.value);
                if (!isNaN(v)) {
                    _applyCents(index, v);
                    _drawCircle();
                    _updateTableRow(index);
                }
                _removeMenu();
            };
            if (_isLocked(index)) {
                applyBtn.disabled = true;
                applyBtn.style.opacity = "0.4";
                centsInput.disabled = true;
            }

            const mkBtn = function (label, fn) {
                const b = document.createElement("button");
                b.textContent = label;
                b.style.fontSize = "11px";
                b.style.textAlign = "left";
                b.onclick = function (ev) {
                    ev.stopPropagation();
                    fn();
                    _drawCircle();
                    _buildTable();
                    if (highlightDot >= 0) _highlightTableRow(highlightDot);
                    _updateRemoveButton();
                    _removeMenu();
                };
                return b;
            };

            const resetBtn = mkBtn(_("Reset to 12-EDO"), function () {
                _resetTo12(index);
            });
            if (_isLocked(index)) {
                resetBtn.disabled = true;
                resetBtn.style.opacity = "0.4";
            }

            menu.appendChild(centsInput);
            menu.appendChild(applyBtn);
            menu.appendChild(resetBtn);
            document.body.appendChild(menu);
            that._vizMenu = menu;
            that._vizMenuClose = _closeMenu;
            setTimeout(function () {
                document.addEventListener("mousedown", _closeMenu);
            }, 0);
        };

        canvas.oncontextmenu = function (e) {
            const [x, y] = _canvasCoords(e, canvas);
            const hit = _findNearest(x, y, dotR + 8);
            if (hit !== null) _showMenu(e, hit);
        };

        // ── Drag to move (default), click to play ──
        // The starting pitch (index 0) is locked: dragging it would detune the
        // tonic and shift the whole scale. (Octave resizing is intentionally not a feature.)
        const _endDrag = function () {
            if (dragIndex >= 0) {
                if (!dragMoved) _playNote(dragIndex);
                // Re-sort parallel arrays by cents after drag shifts a value.
                if (dragMoved) {
                    const order = that.cents
                        .map((c, i) => i)
                        .sort((a, b) => that.cents[a] - that.cents[b]);
                    _reorderArrays(order);
                    highlightDot = order.indexOf(dragIndex);
                }
                dragIndex = -1;
                lockedDrag = false;
                _drawCircle();
                if (dragMoved) _checkModified();
            }
            window.removeEventListener("mouseup", _endDrag);
        };

        canvas.onmousedown = function (e) {
            if (e.button !== 0) return;
            const [x, y] = _canvasCoords(e, canvas);
            const hit = _findNearest(x, y, dotR + 8);
            if (hit !== null) {
                dragIndex = hit;
                dragMoved = false;
                lockedDrag = _isLocked(hit);
                if (!lockedDrag) {
                    highlightDot = hit;
                    _drawCircle();
                    _highlightTableRow(hit);
                    _updateRemoveButton();
                }
                window.addEventListener("mouseup", _endDrag);
            } else {
                highlightDot = -1;
                _drawCircle();
                _highlightTableRow(-1);
                _updateRemoveButton();
            }
        };

        canvas.onmousemove = function (e) {
            const [x, y] = _canvasCoords(e, canvas);
            if (dragIndex >= 0 && !lockedDrag) {
                dragMoved = true;
                _applyCents(dragIndex, _centsFromPointer(dragIndex, x, y));
                highlightDot = dragIndex;
                _drawCircle();
                _updateTableRow(dragIndex);
            } else {
                const near = _findNearest(x, y, dotR + 8);
                canvas.style.cursor =
                    near === null ? "default" : _isLocked(near) ? "not-allowed" : "pointer";
            }
        };

        canvas.onmouseup = _endDrag;

        canvas.ontouchstart = function (e) {
            const [x, y] = _canvasCoords(e.touches[0], canvas);
            const hit = _findNearest(x, y, dotR + 16);
            if (hit !== null) {
                dragIndex = hit;
                dragMoved = false;
                lockedDrag = _isLocked(hit);
                if (!lockedDrag) {
                    highlightDot = hit;
                    _drawCircle();
                    _highlightTableRow(hit);
                    _updateRemoveButton();
                }
                // Long-press (≈600ms) opens the same context menu as
                // right-click, without needing a separate toolbar selection.
                _clearLongPress();
                const tx = e.touches[0].clientX;
                const ty = e.touches[0].clientY;
                longPressTimer = setTimeout(() => {
                    if (!dragMoved && dragIndex === hit) {
                        _showMenu({ clientX: tx, clientY: ty, preventDefault: () => {} }, hit);
                        dragIndex = -1;
                        lockedDrag = false;
                    }
                    longPressTimer = null;
                }, 600);
                e.preventDefault();
            }
        };

        canvas.ontouchmove = function (e) {
            _clearLongPress();
            if (dragIndex < 0 || lockedDrag) return;
            const [x, y] = _canvasCoords(e.touches[0], canvas);
            dragMoved = true;
            _applyCents(dragIndex, _centsFromPointer(dragIndex, x, y));
            highlightDot = dragIndex;
            _drawCircle();
            _updateTableRow(dragIndex);
            e.preventDefault();
        };

        canvas.ontouchend = function () {
            _clearLongPress();
            _endDrag();
        };

        // Dropdown: switch active temperament
        compareSelect.onchange = function () {
            _loadTemperament(compareSelect.value);
        };

        // Bind visualizer ops to the left-side toolbar (created in init)
        if (that._vizToolbar) {
            that._vizToolbar.playAllBtn2.onclick = _playAll;
            that._vizToolbar.addPitchAfterBtn.onclick = _addPitch;
            that._vizToolbar.addPitchBeforeBtn.onclick = _addPitch;
            that._vizToolbar.removePitchBtn.onclick = () => {
                const s =
                    highlightDot >= 0 && highlightDot < that.pitchNumber
                        ? highlightDot
                        : that.pitchNumber - 1;
                const before = that.pitchNumber;
                _removePitch(s);
                if (that.pitchNumber === before) return;
                if (that.pitchNumber > 0) {
                    highlightDot = Math.min(s, that.pitchNumber - 1);
                    if (_isLocked(highlightDot)) highlightDot = -1;
                } else {
                    highlightDot = -1;
                }
                _drawCircle();
                _buildTable();
                if (highlightDot >= 0) _highlightTableRow(highlightDot);
                _updateRemoveButton();
                _checkModified();
            };
            _updateRemoveButton();
        }
    };

    /**
     * Create new temperament — form to define a new temperament from scratch
     * (equal / ratios / arbitrary / octave space).
     * @returns {void}
     */
    this.edit = function () {
        if (this._playAllRunning) {
            clearTimeout(this._playAllTimer);
            this._playAllRunning = false;
        }
        this._lastPlaybackIndex = 0;
        this.editMode = null;
        this._logo.synth.setMasterVolume(0);
        this._logo.synth.stop();
        const that = this;
        if (that._vizToolbar) {
            that._vizToolbar.playAllBtn2.onclick = null;
            that._vizToolbar.addPitchAfterBtn.onclick = null;
            that._vizToolbar.addPitchBeforeBtn.onclick = null;
            that._vizToolbar.removePitchBtn.onclick = null;
        }
        removeWheelIfPresent("wheelDiv2", this.notesCircle);
        temperamentTableDiv.textContent = "";
        const editOctaveTable = document.createElement("table");
        editOctaveTable.id = "editOctave";
        editOctaveTable.setAttribute("width", BUTTONDIVWIDTH);
        const editOctaveTbody = document.createElement("tbody");
        const editOctaveTr = document.createElement("tr");
        editOctaveTr.id = "menu";
        editOctaveTbody.appendChild(editOctaveTr);
        editOctaveTable.appendChild(editOctaveTbody);
        temperamentTableDiv.appendChild(editOctaveTable);

        const editMenus = [_("equal"), _("ratios"), _("arbitrary"), _("octave space")];

        const menuItems = [];
        for (let i = 0; i < editMenus.length; i++) {
            const td = document.createElement("td");
            td.className = "editMenus";
            td.textContent = editMenus[i];
            td.style.background = platformColor.selectorBackground;
            td.style.height = 30 + "px";
            td.style.textAlign = "center";
            td.style.fontWeight = "bold";
            menuItems.push(td);
            editOctaveTr.appendChild(td);
        }

        const userEditTr = document.createElement("tr");
        const userEditTd = document.createElement("td");
        userEditTd.setAttribute("colspan", "4");
        userEditTd.id = "userEdit";
        userEditTr.appendChild(userEditTd);
        editOctaveTbody.appendChild(userEditTr);

        menuItems[0].style.background = platformColor.selectorBackground || "#c8C8C8";
        that.equalEdit();

        menuItems[0].onclick = function () {
            menuItems[1].style.background = platformColor.selectorBackground;
            menuItems[2].style.background = platformColor.selectorBackground;
            menuItems[3].style.background = platformColor.selectorBackground;
            menuItems[0].style.background = platformColor.selectorBackground || "#c8C8C8";
            that.equalEdit();
        };

        menuItems[1].onclick = function () {
            menuItems[0].style.background = platformColor.selectorBackground;
            menuItems[2].style.background = platformColor.selectorBackground;
            menuItems[3].style.background = platformColor.selectorBackground;
            menuItems[1].style.background = platformColor.selectorBackground || "#c8C8C8";
            that.ratioEdit();
        };

        menuItems[2].onclick = function () {
            menuItems[0].style.background = platformColor.selectorBackground;
            menuItems[1].style.background = platformColor.selectorBackground;
            menuItems[3].style.background = platformColor.selectorBackground;
            menuItems[2].style.background = platformColor.selectorBackground || "#c8C8C8";
            that.arbitraryEdit();
        };

        menuItems[3].onclick = function () {
            menuItems[0].style.background = platformColor.selectorBackground;
            menuItems[1].style.background = platformColor.selectorBackground;
            menuItems[2].style.background = platformColor.selectorBackground;
            menuItems[3].style.background = platformColor.selectorBackground || "#c8C8C8";
            that.octaveSpaceEdit();
        };
    };

    /** Recolors a preview wheelnav wheel's slices back to the default background. */
    const paintPreviewWheelColors = (navObj, pitchNumber) => {
        for (let i = 0; i < pitchNumber; i++) {
            setNavItemColor(navObj, i, platformColor.selectorBackground || "#e0e0e0");
        }
        navObj.refreshWheel();
    };

    /**
     * Enters the equal temperament edit mode.
     * @returns {void}
     */
    this.equalEdit = function () {
        this.editMode = "equal";
        docById("userEdit").textContent = "";
        const equalEdit = docById("userEdit");
        equalEdit.style.backgroundColor = platformColor.selectorBackground || "#c8C8C8";
        equalEdit.appendChild(document.createElement("br"));
        equalEdit.appendChild(
            document.createTextNode(_("pitch number") + "\u00A0\u00A0\u00A0\u00A0 ")
        );
        const octaveIn = document.createElement("input");
        octaveIn.type = "text";
        octaveIn.id = "octaveIn";
        octaveIn.value = "0";
        equalEdit.appendChild(octaveIn);
        equalEdit.appendChild(
            document.createTextNode(" \u00A0\u00A0 " + _("to") + "\u00A0\u00A0 ")
        );
        const octaveOut = document.createElement("input");
        octaveOut.type = "text";
        octaveOut.id = "octaveOut";
        octaveOut.value = "0";
        equalEdit.appendChild(octaveOut);
        equalEdit.appendChild(document.createElement("br"));
        equalEdit.appendChild(document.createElement("br"));
        equalEdit.appendChild(
            document.createTextNode(_("number of divisions") + " \u00A0\u00A0\u00A0\u00A0 ")
        );
        const divisions = document.createElement("input");
        divisions.type = "text";
        divisions.id = "divisions";
        divisions.value = this.pitchNumber;
        equalEdit.appendChild(divisions);
        equalEdit.style.paddingLeft = "80px";
        const that = this;

        const divAppend = document.createElement("div");

        function addDivision(preview) {
            addPreviewDoneButtonPair(divAppend, equalEdit, "-80px", preview);
        }

        addDivision(false);

        divAppend.onmouseover = function () {
            this.style.cursor = "pointer";
        };

        let pitchNumber = this.pitchNumber;
        let pitchNumber1 = Number(docById("octaveIn").value);
        let pitchNumber2 = Number(docById("octaveOut").value);
        let numDivs = Number(docById("divisions").value);
        const ratio = [];
        const compareRatios = [];
        const ratio1 = [];
        const ratio2 = [];
        const ratio3 = [];
        const index = [];
        this.tempRatios = [];

        divAppend.addEventListener("click", function (event) {
            that.performEqualEdit(event);
        });

        this.performEqualEdit = function (event) {
            pitchNumber1 = Number(docById("octaveIn").value);
            pitchNumber2 = Number(docById("octaveOut").value);
            numDivs = Number(docById("divisions").value);
            this.tempRatios = this.ratios.slice();
            if (pitchNumber1 === pitchNumber2) {
                for (let i = 0; i < numDivs; i++) {
                    ratio[i] = Math.pow(this.powerBase, i / numDivs);
                    ratio1[i] = ratio[i].toFixed(2);
                }
                for (let i = 0; i < this.tempRatios.length; i++) {
                    ratio2[i] = this.tempRatios[i];
                    ratio2[i] = ratio2[i].toFixed(2);
                }
                const ratio4 = ratio1.filter(function (val) {
                    return ratio2.indexOf(val) === -1;
                });

                for (let i = 0; i < ratio4.length; i++) {
                    index[i] = ratio1.indexOf(ratio4[i]);
                    ratio3[i] = ratio[index[i]];
                }

                this.tempRatios = this.tempRatios.concat(ratio3);
                this.tempRatios.sort(function (a, b) {
                    return a - b;
                });

                pitchNumber = this.tempRatios.length - 1;
                this.typeOfEdit = "equal";
                this.divisions = numDivs;
            } else {
                pitchNumber = numDivs + Number(pitchNumber) - Math.abs(pitchNumber1 - pitchNumber2);
                const angle1 =
                    270 +
                    360 * (Math.log10(this.tempRatios[pitchNumber1]) / Math.log10(this.powerBase));
                const angle2 =
                    270 +
                    360 * (Math.log10(this.tempRatios[pitchNumber2]) / Math.log10(this.powerBase));
                const divisionAngle = Math.abs(angle2 - angle1) / numDivs;
                this.tempRatios.splice(pitchNumber1 + 1, Math.abs(pitchNumber1 - pitchNumber2) - 1);
                for (let i = 0; i < numDivs - 1; i++) {
                    const power = (Math.min(angle1, angle2) + divisionAngle * (i + 1) - 270) / 360;
                    ratio[i] = Math.pow(this.powerBase, power);
                    this.tempRatios.splice(pitchNumber1 + 1 + i, 0, ratio[i]);
                    compareRatios[i] = this.tempRatios[i];
                    compareRatios[i] = compareRatios[i].toFixed(2);
                }
                this.typeOfEdit = "nonequal";
            }

            if (event.target.textContent === _("done")) {
                // Go to main "Circle of Notes"
                this.ratios = this.tempRatios.slice();
                const frequency = this.frequencies[0];
                this.frequencies = computeFrequencies(this.ratios, frequency, pitchNumber);

                this.pitchNumber = pitchNumber;
                // Rebuild cents, notes, intervals, ratiosNotesPair from new ratios
                const startingPitch = this._logo.synth.startingPitch;
                for (let i = 0; i <= this.pitchNumber; i++) {
                    this.cents[i] = ratioToCents(this.ratios[i], this.powerBase);
                    const freq = Number(this.frequencies[0]) * this.ratios[i];
                    const obj = frequencyToPitch(freq, this.inTemperament);
                    this.notes[i] = [obj[0], obj[1]];
                    this.intervals[i] = "";
                    this.ratiosNotesPair[i] = [this.ratios[i], this.notes[i]];
                }
                this.checkTemperament(compareRatios);
                this._visualizerView();
            } else if (event.target.textContent === _("preview")) {
                //Preview Notes
                docById("userEdit").textContent = "";
                const wheelDiv2 = document.createElement("div");
                wheelDiv2.id = "wheelDiv2";
                wheelDiv2.className = "wheelNav";
                docById("userEdit").appendChild(wheelDiv2);
                this.createMainWheel(this.tempRatios, pitchNumber);
                paintPreviewWheelColors(this.notesCircle, pitchNumber);
                docById("userEdit").style.paddingLeft = "0px";
                addDivision(true);
                divAppend.style.marginTop = docById("wheelDiv2").style.height;
                docById("preview").style.marginLeft = "80px";

                //make temperary
                const ratios = this.tempRatios.slice();
                const frequency = this.frequencies[0];
                this.eqTempHzs = computeFrequencies(ratios, frequency, pitchNumber);
                this.eqTempPitchNumber = pitchNumber;
                this.checkTemperament(compareRatios);

                docById("done_").onclick = function () {
                    //Go to main Circle of Notes
                    that.ratios = that.tempRatios.slice();
                    const frequency = that.frequencies[0];
                    that.frequencies = computeFrequencies(that.ratios, frequency, pitchNumber);

                    that.pitchNumber = pitchNumber;
                    // Rebuild cents, notes, intervals, ratiosNotesPair from new ratios
                    const sp = that._logo.synth.startingPitch;
                    for (let j = 0; j <= that.pitchNumber; j++) {
                        that.cents[j] = ratioToCents(that.ratios[j], that.powerBase);
                        const freq = Number(that.frequencies[0]) * that.ratios[j];
                        const obj = frequencyToPitch(freq, that.inTemperament);
                        that.notes[j] = [obj[0], obj[1]];
                        that.intervals[j] = "";
                        that.ratiosNotesPair[j] = [that.ratios[j], that.notes[j]];
                    }
                    that.eqTempPitchNumber = null;
                    that.eqTempHzs = [];
                    that.checkTemperament(compareRatios);
                    that._visualizerView();
                };

                docById("preview").onclick = function () {
                    that.equalEdit();
                    that.eqTempPitchNumber = null;
                    that.eqTempHzs = [];
                };
            }
        };
    };

    /**
     * Enters the ratio edit mode for adjusting temperament settings based on ratios.
     * @returns {void}
     */
    this.ratioEdit = function () {
        this.editMode = "ratio";
        docById("userEdit").textContent = "";
        const ratioEdit = docById("userEdit");
        ratioEdit.style.backgroundColor = platformColor.selectorBackground || "#c8C8C8";
        ratioEdit.appendChild(document.createElement("br"));
        ratioEdit.appendChild(document.createTextNode(_("ratio") + " \u00A0\u00A0\u00A0\u00A0 "));
        const ratioIn = document.createElement("input");
        ratioIn.type = "text";
        ratioIn.id = "ratioIn";
        ratioIn.value = "1";
        ratioEdit.appendChild(ratioIn);
        ratioEdit.appendChild(document.createTextNode(" \u00A0\u00A0 : \u00A0\u00A0 "));
        const ratioOut = document.createElement("input");
        ratioOut.type = "text";
        ratioOut.id = "ratioOut";
        ratioOut.value = "1";
        ratioEdit.appendChild(ratioOut);
        ratioEdit.appendChild(document.createElement("br"));
        ratioEdit.appendChild(document.createElement("br"));
        ratioEdit.appendChild(
            document.createTextNode(_("recursion") + " \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 ")
        );
        const recursion = document.createElement("input");
        recursion.type = "text";
        recursion.id = "recursion";
        recursion.value = "1";
        ratioEdit.appendChild(recursion);
        ratioEdit.style.paddingLeft = "100px";
        const that = this;

        const divAppend = document.createElement("div");

        function addButtons(preview) {
            addPreviewDoneButtonPair(divAppend, ratioEdit, "-100px", preview);
        }

        addButtons(false);

        divAppend.onmouseover = function () {
            this.style.cursor = "pointer";
        };

        divAppend.onclick = function (event) {
            const input1 = docById("ratioIn").value;
            const input2 = docById("ratioOut").value;
            const recursion = docById("recursion").value;
            const len = that.frequencies.length;
            const ratio1 = input1 / input2;
            if (
                !isFinite(input1) ||
                !isFinite(input2) ||
                input1 <= 0 ||
                input2 <= 0 ||
                !isFinite(ratio1) ||
                ratio1 <= 0 ||
                ratio1 >= that.powerBase ||
                input2 > input1 * that.powerBase
            ) {
                that.activity.errorMsg(
                    _("Please enter a valid ratio (e.g. 3:2) within the octave space."),
                    3000
                );
                return;
            }
            const ratio = [];
            const frequency = [];
            const ratioDifference = [];
            const index = [];
            const compareRatios = [];
            that.tempRatios = that.ratios.slice();

            const calculateRatios = function (i) {
                if (frequency[i] < that.frequencies[len - 1]) {
                    for (let j = 0; j < that.tempRatios.length; j++) {
                        ratioDifference[j] = ratio[i] - that.tempRatios[j];
                        if (ratioDifference[j] < 0) {
                            index.push(j);
                            that.tempRatios.splice(index[i], 0, ratio[i]);
                            break;
                        }
                        if (ratioDifference[j] === 0) {
                            index.push(j);
                            that.tempRatios.splice(index[i], 1, ratio[i]);
                            break;
                        }
                    }
                } else {
                    ratio[i] = ratio[i] / 2;
                    frequency[i] = that.frequencies[0] * ratio[i];
                    calculateRatios(i);
                }
            };

            for (let i = 0; i < recursion; i++) {
                ratio[i] = Math.pow(ratio1, i + 1);
                frequency[i] = that.frequencies[0] * ratio[i];
                calculateRatios(i);
            }
            that.tempRatios.sort(function (a, b) {
                return a - b;
            });
            const pitchNumber = that.tempRatios.length - 1;
            if (event.target.textContent === _("done")) {
                that.ratios = that.tempRatios.slice();
                that.typeOfEdit = "nonequal";
                that.pitchNumber = that.ratios.length - 1;
                const frequency1 = that.frequencies[0];
                that.frequencies = computeFrequencies(that.ratios, frequency1, that.pitchNumber);

                for (let i = 0; i < that.ratios.length; i++) {
                    compareRatios[i] = that.ratios[i];
                    compareRatios[i] = compareRatios[i].toFixed(2);
                }

                that.checkTemperament(compareRatios);
                that._visualizerView();
            } else if (event.target.textContent === _("preview")) {
                //Preview Notes
                docById("userEdit").textContent = "";
                const wheelDiv2 = document.createElement("div");
                wheelDiv2.id = "wheelDiv2";
                wheelDiv2.className = "wheelNav";
                docById("userEdit").appendChild(wheelDiv2);
                that.createMainWheel(that.tempRatios, pitchNumber);
                paintPreviewWheelColors(that.notesCircle, pitchNumber);
                docById("userEdit").style.paddingLeft = "0px";
                addButtons(true);
                divAppend.style.marginTop = docById("wheelDiv2").style.height;
                docById("preview").style.marginLeft = "100px";

                //make temperary
                const ratios = that.tempRatios.slice();
                that.typeOfEdit = "nonequal";
                that.NEqTempPitchNumber = ratios.length - 1;
                const frequency1 = that.frequencies[0];
                that.NEqTempHzs = computeFrequencies(ratios, frequency1, that.NEqTempPitchNumber);

                for (let i = 0; i < ratios.length; i++) {
                    compareRatios[i] = ratios[i];
                    compareRatios[i] = compareRatios[i].toFixed(2);
                }
                that.checkTemperament(compareRatios);

                docById("done_").onclick = function () {
                    //Go to main Circle of Notes
                    that.ratios = that.tempRatios.slice();
                    that.pitchNumber = that.ratios.length - 1;
                    const frequency1 = that.frequencies[0];
                    that.frequencies = computeFrequencies(
                        that.ratios,
                        frequency1,
                        that.pitchNumber
                    );

                    for (let i = 0; i < that.ratios.length; i++) {
                        compareRatios[i] = that.ratios[i];
                        compareRatios[i] = compareRatios[i].toFixed(2);
                    }

                    that.checkTemperament(compareRatios);
                    that._visualizerView();
                    that.NEqTempPitchNumber = null;
                    that.NEqTempHzs = [];
                };

                docById("preview").onclick = function () {
                    that.ratioEdit();
                    that.NEqTempPitchNumber = null;
                    that.NEqTempHzs = [];
                };
            }
        };
    };

    /**
     * Enters the arbitrary edit mode for adjusting temperament settings arbitrarily.
     * @returns {void}
     */
    this.arbitraryEdit = function () {
        this.editMode = "arbitrary";
        docById("userEdit").textContent = "";
        const arbitraryEdit = docById("userEdit");
        arbitraryEdit.appendChild(document.createElement("br"));
        const wheelDiv3 = document.createElement("div");
        wheelDiv3.id = "wheelDiv3";
        wheelDiv3.className = "wheelNav";
        arbitraryEdit.appendChild(wheelDiv3);
        arbitraryEdit.style.paddingLeft = "0px";

        const that = this;

        const radius = 128;
        const height = 2 * radius;
        let angle1 = [];
        this.tempRatios1 = this.ratios.slice();

        this._createInnerWheel = function (ratios, pitchNumber) {
            if (this.wheel1 !== undefined) {
                docById("wheelDiv4").display = "none";
                this.wheel1.removeWheel();
            }
            if (ratios === undefined) {
                ratios = this.ratios;
            }
            if (pitchNumber === undefined) {
                pitchNumber = this.pitchNumber;
            }
            const labels = [];
            for (let j = 0; j < pitchNumber; j++) {
                labels.push(j.toString());
            }
            docById("wheelDiv4").style.display = "";
            docById("wheelDiv4").style.background = "none";
            docById("wheelDiv4").style.position = "relative";
            docById("wheelDiv4").style.zIndex = 5;
            this.wheel1 = new wheelnav("wheelDiv4");
            this.wheel1.wheelRadius = 200;
            this.wheel1.navItemsEnabled = false;
            this.wheel1.navAngle = 270;
            this.wheel1.navItemsContinuous = true;
            this.wheel1.navItemsCentered = false;
            this.wheel1.slicePathFunction = slicePath().MenuSliceWithoutLine;
            this.wheel1.slicePathCustom = slicePath().MenuSliceCustomization();
            this.wheel1.sliceSelectedPathCustom = this.wheel1.slicePathCustom;
            this.wheel1.sliceInitPathCustom = this.wheel1.slicePathCustom;
            this.wheel1.initWheel(labels);

            const baseAngle = [];
            const sliceAngle = [];
            const angle = [];
            const angleDiff = [];
            for (let i = 0; i < this.wheel1.navItemCount; i++) {
                this.wheel1.navItems[i].fillAttr = platformColor.selectorBackground || "#e0e0e0";
                this.wheel1.navItems[i].titleAttr.font = "20 20px Impact, Charcoal, sans-serif";
                this.wheel1.navItems[i].titleSelectedAttr.font =
                    "20 20px Impact, Charcoal, sans-serif";
                angle[i] = ratioToWheelAngle(ratios[i], this.powerBase);
                if (i !== 0) {
                    if (i === this.pitchNumber - 1) {
                        angleDiff[i - 1] = angle[0] + 360 - angle[i];
                    } else {
                        angleDiff[i - 1] = angle[i] - angle[i - 1];
                    }
                }
                if (i === 0) {
                    sliceAngle[i] = 360 / pitchNumber;
                    baseAngle[i] = this.wheel1.navAngle - sliceAngle[0] / 2;
                } else {
                    baseAngle[i] = baseAngle[i - 1] + sliceAngle[i - 1];
                    sliceAngle[i] = 2 * (angle[i] - baseAngle[i]);
                }
                this.wheel1.navItems[i].sliceAngle = sliceAngle[i];
            }
            let menuRadius = (2 * Math.PI * radius) / pitchNumber / 3;
            for (let i = 0; i < angleDiff.length; i++) {
                if (angleDiff[i] < 11) {
                    menuRadius = (2 * Math.PI * radius) / this.pitchNumber / 6;
                }
            }
            if (menuRadius > 29) {
                menuRadius = (2 * Math.PI * radius) / 33;
            }
            this.wheel1.slicePathCustom.menuRadius = menuRadius;

            if (docById("frequencySlider") !== null) {
                docById("frequencySlider").oninput = function () {
                    that._refreshInnerWheel();
                };
            }
            this.wheel1.createWheel();
        };
        const wheelDiv4 = document.createElement("div");
        wheelDiv4.id = "wheelDiv4";
        wheelDiv4.className = "wheelNav";
        arbitraryEdit.appendChild(wheelDiv4);
        this._createInnerWheel();

        const canvas1 = document.createElement("canvas");
        canvas1.id = "circ1";
        canvas1.setAttribute("width", BUTTONDIVWIDTH);
        canvas1.setAttribute("height", height);
        arbitraryEdit.appendChild(canvas1);

        const canvas = docById("circ1");
        canvas.style.position = "absolute";
        canvas.style.zIndex = 1;
        canvas.style.marginTop = "-305px";
        const ctx = canvas.getContext("2d");
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgba(204, 0, 102, 0)";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = platformColor.strokeColor || "#003300";
        ctx.stroke();

        this._createOuterWheel = function (ratios, pitchNumber) {
            if (this.wheel !== undefined) {
                docById("wheelDiv3").display = "none";
                this.wheel.removeWheel();
            }
            if (pitchNumber === undefined) {
                pitchNumber = this.pitchNumber;
            }
            if (ratios === undefined) {
                ratios = this.ratios;
            }
            docById("wheelDiv3").style.display = "";
            docById("wheelDiv3").style.background = "none";
            this.wheel = new wheelnav("wheelDiv3", null, 600, 600);
            this.wheel.wheelRadius = 300;
            this.wheel.slicePathFunction = slicePath().DonutSlice;
            this.wheel.slicePathCustom = slicePath().DonutSliceCustomization();
            this.wheel.slicePathCustom.minRadiusPercent = 0.9;
            this.wheel.slicePathCustom.maxRadiusPercent = 1.0;
            this.wheel.sliceSelectedPathCustom = this.wheel.slicePathCustom;
            this.wheel.sliceInitPathCustom = this.wheel.slicePathCustom;
            this.wheel.colors = [
                platformColor.selectorBackground || "#c0c0c0",
                platformColor.selectorBackground || "#e0e0e0"
            ];
            this.wheel.titleRotateAngle = 90;
            this.wheel.navItemsEnabled = false;

            const minutes = [];
            const angle = [];
            const angleDiff1 = [];
            const baseAngle1 = [];
            const sliceAngle1 = [];
            angle1 = [];
            for (let i = 0; i <= pitchNumber; i++) {
                if (i !== pitchNumber) {
                    minutes.push("|");
                }
                //Change angles of outer circle
                angle[i] = ratioToWheelAngle(ratios[i], this.powerBase);
                if (i !== 0) {
                    if (i === pitchNumber - 1) {
                        angleDiff1[i - 1] = angle[0] + 360 - angle[i];
                    } else {
                        angleDiff1[i - 1] = angle[i] - angle[i - 1];
                    }
                    angle1[i - 1] = angle[i - 1] + angleDiff1[i - 1] / 2;
                }
            }
            this.wheel.navAngle = 270 + angleDiff1[0] / 2;
            this.wheel.initWheel(minutes);
            for (let i = 0; i < pitchNumber; i++) {
                if (i === 0) {
                    sliceAngle1[i] = 360 / pitchNumber;
                    baseAngle1[i] = this.wheel.navAngle - sliceAngle1[0] / 2;
                } else {
                    baseAngle1[i] = baseAngle1[i - 1] + sliceAngle1[i - 1];
                    sliceAngle1[i] = 2 * (angle1[i] - baseAngle1[i]);
                }
                this.wheel.navItems[i].sliceAngle = sliceAngle1[i];
            }
            this.wheel.createWheel();
            docById("wheelDiv3").style.position = "absolute";
            docById("wheelDiv3").style.zIndex = 10;
            docById("wheelDiv3").style.marginTop = 15 + "px";
            docById("wheelDiv3").style.marginLeft = 37 + "px";
            docById("wheelDiv3").addEventListener("mouseover", function (e) {
                that.arbitraryEditSlider(e, angle1, ratios, pitchNumber);
            });
        };

        this._createOuterWheel();

        const divAppend = document.createElement("div");
        divAppend.id = "divAppend";
        divAppend.textContent = _("done");
        divAppend.style.textAlign = "center";
        divAppend.style.paddingTop = "5px";
        divAppend.style.backgroundColor = platformColor.selectorBackground;
        divAppend.style.height = "25px";
        divAppend.style.marginTop = "40px";
        divAppend.style.overflow = "auto";
        arbitraryEdit.append(divAppend);

        divAppend.onmouseover = function () {
            this.style.cursor = "pointer";
        };

        divAppend.onclick = function () {
            that.ratios = that.tempRatios1.slice();
            that.typeOfEdit = "nonequal";
            that.pitchNumber = that.ratios.length - 1;
            const compareRatios = [];
            const frequency1 = that.frequencies[0];
            that.frequencies = computeFrequencies(that.ratios, frequency1, that.ratios.length - 1);

            for (let i = 0; i < that.ratios.length; i++) {
                compareRatios[i] = that.ratios[i];
                compareRatios[i] = compareRatios[i].toFixed(2);
            }

            that.checkTemperament(compareRatios);
            that._visualizerView();
        };
    };

    /**
     * Handles the event when the user interacts with the sliders in the arbitrary edit mode.
     * @param {Event} event - The event object triggered by the slider interaction.
     * @param {number} angle - The angle of the wheel.
     * @param {number[]} ratios - The ratios representing the temperament.
     * @param {number} pitchNumber - The number of pitches in the temperament.
     * @returns {void}
     */
    this.arbitraryEditSlider = function (event, angle, ratios, pitchNumber) {
        const frequency = this.frequencies[0];
        const frequencies = computeFrequencies(ratios, frequency, pitchNumber);
        for (let i = 0; i < pitchNumber; i++) {
            if (event.target.parentNode.id === "wheelnav-wheelDiv3-title-" + i) {
                const that = this;
                if (docById("noteInfo1") !== null) {
                    docById("noteInfo1").remove();
                }
                const noteInfo1 = document.createElement("div");
                noteInfo1.className = "popup";
                noteInfo1.id = "noteInfo1";
                noteInfo1.style.width = "180px";
                noteInfo1.style.height = "135px";
                const myPopup = document.createElement("span");
                myPopup.className = "popuptext";
                myPopup.id = "myPopup";
                noteInfo1.appendChild(myPopup);
                docById("wheelDiv3").appendChild(noteInfo1);

                const closeImg = document.createElement("img");
                closeImg.src = "header-icons/close-button.svg";
                closeImg.id = "close";
                closeImg.title = _("Close");
                closeImg.alt = _("Close");
                closeImg.setAttribute("height", "20px");
                closeImg.setAttribute("width", "20px");
                closeImg.setAttribute("align", "right");
                noteInfo1.appendChild(closeImg);

                noteInfo1.appendChild(document.createElement("br"));
                const centerNode = document.createElement("center");
                const slider = document.createElement("input");
                slider.type = "range";
                slider.className = "sliders";
                slider.id = "frequencySlider";
                slider.style.width = "170px";
                slider.style.background = "white";
                slider.style.border = "0";
                slider.setAttribute("min", frequencies[i]);
                slider.setAttribute("max", frequencies[i + 1]);
                slider.setAttribute("value", "30");
                centerNode.appendChild(slider);
                noteInfo1.appendChild(centerNode);

                noteInfo1.appendChild(document.createTextNode(`\u00A0\u00A0${_("frequency")} : `));
                const freqSpan = document.createElement("span");
                freqSpan.className = "rangeslidervalue";
                freqSpan.id = "frequencydiv";
                freqSpan.textContent = frequencies[i];
                noteInfo1.appendChild(freqSpan);

                noteInfo1.appendChild(document.createElement("br"));
                noteInfo1.appendChild(document.createElement("br"));
                const doneDiv = document.createElement("div");
                doneDiv.id = "done";
                doneDiv.style.background = "rgb(196, 196, 196)";
                const doneCenter = document.createElement("center");
                doneCenter.textContent = _("done");
                doneDiv.appendChild(doneCenter);
                noteInfo1.appendChild(doneDiv);

                docById("noteInfo1").style.top = "100px";
                docById("noteInfo1").style.left = "90px";

                docById("frequencySlider").oninput = function () {
                    that._refreshInnerWheel();
                };
                docById("done").onclick = function () {
                    that.tempRatios1 = that.tempRatios.slice();
                    const pitchNumber = that.tempRatios1.length - 1;
                    that._createOuterWheel(that.tempRatios1, pitchNumber);
                };
                docById("close").onclick = function () {
                    that.tempRatios = that.tempRatios1.slice();
                    const pitchNumber = that.tempRatios.length - 1;
                    that._createInnerWheel(that.tempRatios, pitchNumber);
                    docById("noteInfo1").remove();
                };
            }
        }
    };

    /**
     * Refreshes the inner wheel based on the frequency slider input.
     * @returns {void}
     */
    this._refreshInnerWheel = function () {
        docById("frequencydiv").textContent = docById("frequencySlider").value;
        const frequency = docById("frequencySlider").value;
        const ratio = frequency / this.frequencies[0];
        const ratioDifference = [];
        this.tempRatios = this.tempRatios1.slice();

        for (let j = 0; j < this.tempRatios.length; j++) {
            ratioDifference[j] = ratio - this.tempRatios[j];
            ratioDifference[j] = ratioDifference[j].toFixed(2);
            let index;
            if (ratioDifference[j] < 0) {
                index = j;
                this.tempRatios.splice(index, 0, ratio);
                break;
            } else if (ratioDifference[j] === 0) {
                index = j;
                this.tempRatios.splice(index, 1, ratio);
                break;
            }
        }
        const pitchNumber = this.tempRatios.length - 1;
        this._logo.resetSynth(0);
        this._logo.synth.trigger(
            0,
            frequency,
            Singer.defaultBPMFactor * 0.01,
            "electronic synth",
            null,
            null
        );
        this._createInnerWheel(this.tempRatios, pitchNumber);
    };

    /**
     * Initiates the octave space edit mode.
     * Allows the user to modify the octave space of the temperament.
     * @returns {void}
     */
    this.octaveSpaceEdit = function () {
        this.editMode = "octave";
        docById("userEdit").textContent = "";
        const len = this.ratios.length;
        const octaveRatio = this.ratios[len - 1];
        const octaveSpaceEdit = docById("userEdit");
        octaveSpaceEdit.style.backgroundColor = platformColor.selectorBackground || "#c8C8C8";
        octaveSpaceEdit.appendChild(document.createElement("br"));
        octaveSpaceEdit.appendChild(document.createElement("br"));
        octaveSpaceEdit.appendChild(
            document.createTextNode(_("octave space") + " \u00A0\u00A0\u00A0\u00A0 ")
        );
        const startNote = document.createElement("input");
        startNote.type = "text";
        startNote.id = "startNote";
        startNote.value = octaveRatio;
        startNote.style.width = "50px";
        octaveSpaceEdit.appendChild(startNote);
        octaveSpaceEdit.appendChild(document.createTextNode(" \u00A0\u00A0 : \u00A0\u00A0 "));
        const endNote = document.createElement("input");
        endNote.type = "text";
        endNote.id = "endNote";
        endNote.value = "1";
        endNote.style.width = "50px";
        octaveSpaceEdit.appendChild(endNote);
        octaveSpaceEdit.appendChild(document.createElement("br"));
        octaveSpaceEdit.appendChild(document.createElement("br"));
        octaveSpaceEdit.style.paddingLeft = "70px";
        const that = this;

        const divAppend = document.createElement("div");
        divAppend.id = "divAppend";
        divAppend.textContent = _("done");
        divAppend.style.textAlign = "center";
        divAppend.style.paddingTop = "5px";
        divAppend.style.marginLeft = "-70px";
        divAppend.style.backgroundColor = platformColor.selectorBackground;
        divAppend.style.height = "25px";
        divAppend.style.marginTop = "40px";
        divAppend.style.overflow = "auto";
        octaveSpaceEdit.append(divAppend);

        divAppend.onmouseover = function () {
            this.style.cursor = "pointer";
        };

        divAppend.onclick = function () {
            const startRatio = docById("startNote").value;
            const endRatio = docById("endNote").value;
            const ratio = startRatio / endRatio;
            if (ratio !== 2) {
                that.activity.textMsg(
                    _("The octave ratio has changed. This changes temperament significantly."),
                    3000
                );
            }
            const powers = [];
            const compareRatios = [];
            const frequency = that.frequencies[0];
            that.frequencies = [];

            for (let i = 0; i < len; i++) {
                powers[i] =
                    that.pitchNumber * (Math.log10(that.ratios[i]) / Math.log10(that.powerBase));
                that.ratios[i] = Math.pow(ratio, powers[i] / that.pitchNumber);
                compareRatios[i] = that.ratios[i].toFixed(2);
                that.frequencies[i] = that.ratios[i] * frequency;
                that.frequencies[i] = that.frequencies[i].toFixed(2);
            }
            that.powerBase = ratio;
            that.typeOfEdit = "nonequal";
            that.checkTemperament(compareRatios);
            if (ratio !== 2) {
                that.octaveChanged = true;
            }
            that._visualizerView();
        };
    };

    /**
     * Checks if the temperament matches any predefined temperaments or is custom.
     * @param {number[]} ratios - The ratios representing the temperament.
     * @returns {void}
     */
    this.checkTemperament = function (ratios) {
        const intervals = [];
        let selectedTemperament;

        const keys = getTemperamentKeys();
        for (let i = 0; i < keys.length; i++) {
            const temperament = keys[i];
            if (!isCustomTemperament(temperament)) {
                const t = getTemperament(temperament);
                // Ensure we have a valid temperament object with intervals
                if (!t || !t.interval || !Array.isArray(t.interval)) {
                    this.activity.errorMsg(
                        _("Invalid temperament: %s. Skipping to next temperament.").replace(
                            /%s/g,
                            temperament
                        ),
                        3000
                    );
                    continue;
                }
                const temperamentRatios = [];
                for (let j = 0; j < t.interval.length; j++) {
                    intervals[j] = t.interval[j];
                    temperamentRatios[j] = getTemperamentRatio(t[intervals[j]]).toFixed(2);
                }
                const ratiosEqual =
                    ratios.length === temperamentRatios.length &&
                    ratios.every(function (element, index) {
                        return element === temperamentRatios[index];
                    });

                if (ratiosEqual) {
                    selectedTemperament = temperament;
                    this.inTemperament = temperament;
                    break;
                }
            }
        }

        if (selectedTemperament === undefined) {
            this.inTemperament = "custom";
        }
    };

    /**
     * Saves the modifications made to the temperament.
     * @returns {void}
     */
    this._save = function () {
        this.notes = [];

        if (isCustomTemperament(this.inTemperament)) {
            const startingPitch = this._logo.synth.startingPitch;
            const startPitchParsed = parseNoteString(startingPitch);
            const startPitch = pitchToFrequency(
                startPitchParsed[0],
                startPitchParsed[1],
                0,
                "C Major",
                this.inTemperament
            );

            let addOctave = "";
            for (let i = 0; i < this.ratios.length; i++) {
                const obj = frequencyToPitch(this.ratios[i] * startPitch);
                const newPitch = obj[0];
                const newOctave = obj[1];
                const newCents = obj[2];
                if (this.powerBase !== 2) {
                    addOctave = newOctave;
                }

                let updown = "";
                if (newCents < 0) {
                    if (newCents < -30) {
                        updown = "vv";
                    } else if (newCents < -15) {
                        updown = "v";
                    }
                    this.notes[i] =
                        updown +
                        newPitch +
                        addOctave +
                        "(" +
                        newCents.toFixed(0) +
                        "¢)" +
                        newOctave;
                } else {
                    if (newCents > 30) {
                        updown = "^^";
                    } else if (newCents > 15) {
                        updown = "^";
                    }
                    this.notes[i] =
                        updown +
                        newPitch +
                        addOctave +
                        "(+" +
                        newCents.toFixed(0) +
                        "¢)" +
                        newOctave;
                }
            }
        }

        setOctaveRatio(this.powerBase);

        const startPitchParsed = parseNoteString(this._logo.synth.startingPitch);
        const note = startPitchParsed[0];
        const octave = startPitchParsed[1];
        const newStack1 = [
            [0, "settemperament", 150, 150, [null, 1, 2, 3, null]],
            [1, ["temperamentname", { value: this.inTemperament }], 0, 0, [0]],
            [2, ["notename", { value: note }], 0, 0, [0]],
            [3, ["number", { value: octave }], 0, 0, [0]]
        ];
        this.activity.blocks.loadNewBlocks(newStack1);

        const value = this.activity.blocks.findUniqueTemperamentName(this.inTemperament);
        // Change from temporary "custom" to "custom1" or "custom2" ...
        this.inTemperament = value;
        const newStack = [
            [
                0,
                [
                    "temperament1",
                    {
                        collapsed: true
                    }
                ],
                150,
                100,
                [null, 1, 2, null]
            ],
            [1, ["text", { value: value }], 0, 0, [0]],
            [2, ["storein"], 0, 0, [0, 3, 4, 5]],
            [3, ["text", { value: this._logo.synth.startingPitch }], 0, 0, [2]],
            [4, ["number", { value: this.frequencies[0] }], 0, 0, [2]],
            [5, ["octavespace"], 0, 0, [2, 6, 9]],
            [6, ["divide"], 0, 0, [5, 7, 8]],
            // Cache rationalToFraction result to avoid duplicate calls
            ...(function () {
                const octaveFraction = rationalToFraction(getOctaveRatio());
                return [
                    [7, ["number", { value: octaveFraction[0] }], 0, 0, [6]],
                    [8, ["number", { value: octaveFraction[1] }], 0, 0, [6]]
                ];
            })(),
            [9, "vspace", 0, 0, [5, 10]]
        ];
        let previousBlock = 9;

        for (let i = 0; i < this.pitchNumber; i++) {
            const idx = newStack.length;
            if (
                this.inTemperament.startsWith("equal") ||
                this.inTemperament === "1/3 comma meantone" ||
                (this.typeOfEdit === "equal" && this.divisions === this.pitchNumber)
            ) {
                newStack.push([
                    idx,
                    "definefrequency",
                    0,
                    0,
                    [previousBlock, idx + 1, idx + 8, idx + 12]
                ]);
                newStack.push([idx + 1, "multiply", 0, 0, [idx, idx + 2, idx + 3]]);
                newStack.push([
                    idx + 2,
                    ["namedbox", { value: this._logo.synth.startingPitch }],
                    0,
                    0,
                    [idx + 1]
                ]);
                newStack.push([idx + 3, ["power"], 0, 0, [idx + 1, idx + 4, idx + 5]]);
                newStack.push([idx + 4, ["number", { value: this.powerBase }], 0, 0, [idx + 3]]);
                newStack.push([idx + 5, ["divide"], 0, 0, [idx + 3, idx + 6, idx + 7]]);
                newStack.push([idx + 6, ["number", { value: i }], 0, 0, [idx + 5]]);
                newStack.push([idx + 7, ["number", { value: this.pitchNumber }], 0, 0, [idx + 5]]);
                newStack.push([idx + 8, "vspace", 0, 0, [idx, idx + 9]]);
                newStack.push([idx + 9, ["pitch"], 0, 0, [idx + 8, idx + 10, idx + 11, null]]);
                if (!isCustomTemperament(this.inTemperament)) {
                    newStack.push([
                        idx + 10,
                        ["notename", { value: this.ratiosNotesPair[i][1][0] }],
                        0,
                        0,
                        [idx + 9]
                    ]);
                    newStack.push([
                        idx + 11,
                        ["number", { value: this.ratiosNotesPair[i][1][1] }],
                        0,
                        0,
                        [idx + 9]
                    ]);
                } else {
                    newStack.push([
                        idx + 10,
                        [
                            "text",
                            {
                                value: this.notes[i].substring(0, this.notes[i].length - 1)
                            }
                        ],
                        0,
                        0,
                        [idx + 9]
                    ]);
                    newStack.push([
                        idx + 11,
                        ["number", { value: parseNoteString(this.notes[i])[1] }],
                        0,
                        0,
                        [idx + 9]
                    ]);
                }

                if (i === this.pitchNumber - 1) {
                    newStack.push([idx + 12, "hidden", 0, 0, [idx, null]]);
                } else {
                    newStack.push([idx + 12, "hidden", 0, 0, [idx, idx + 13]]);
                }
                previousBlock = idx + 12;
            } else {
                newStack.push([
                    idx,
                    "definefrequency",
                    0,
                    0,
                    [previousBlock, idx + 1, idx + 6, idx + 10]
                ]);
                newStack.push([idx + 1, "multiply", 0, 0, [idx, idx + 2, idx + 3]]);
                newStack.push([
                    idx + 2,
                    ["namedbox", { value: this._logo.synth.startingPitch }],
                    0,
                    0,
                    [idx + 1]
                ]);
                newStack.push([idx + 3, ["divide"], 0, 0, [idx + 1, idx + 4, idx + 5]]);
                // Cache rationalToFraction result to avoid duplicate calls
                const ratioFraction = rationalToFraction(this.ratios[i]);
                newStack.push([idx + 4, ["number", { value: ratioFraction[0] }], 0, 0, [idx + 3]]);
                newStack.push([idx + 5, ["number", { value: ratioFraction[1] }], 0, 0, [idx + 3]]);
                newStack.push([idx + 6, "vspace", 0, 0, [idx, idx + 7]]);
                newStack.push([idx + 7, ["pitch"], 0, 0, [idx + 6, idx + 8, idx + 9, null]]);

                if (!isCustomTemperament(this.inTemperament)) {
                    newStack.push([
                        idx + 8,
                        ["notename", { value: this.ratiosNotesPair[i][1][0] }],
                        0,
                        0,
                        [idx + 7]
                    ]);
                    newStack.push([
                        idx + 9,
                        ["number", { value: this.ratiosNotesPair[i][1][1] }],
                        0,
                        0,
                        [idx + 7]
                    ]);
                } else {
                    newStack.push([
                        idx + 8,
                        [
                            "text",
                            {
                                value: this.notes[i].substring(0, this.notes[i].length - 1)
                            }
                        ],
                        0,
                        0,
                        [idx + 7]
                    ]);
                    newStack.push([
                        idx + 9,
                        ["number", { value: parseNoteString(this.notes[i])[1] }],
                        0,
                        0,
                        [idx + 7]
                    ]);
                }

                if (i === this.pitchNumber - 1) {
                    newStack.push([idx + 10, "hidden", 0, 0, [idx, null]]);
                } else {
                    newStack.push([idx + 10, "hidden", 0, 0, [idx, idx + 11]]);
                }
                previousBlock = idx + 10;
            }
        }

        const that = this;
        setTimeout(() => {
            that.activity.blocks.loadNewBlocks(newStack);
            that.activity.textMsg(_("New action block generated."), 3000);
        }, 500);

        if (isCustomTemperament(this.inTemperament)) {
            deleteTemperamentFromList(this.inTemperament);
            const newTemperament = { pitchNumber: this.pitchNumber };
            for (let i = 0; i < this.pitchNumber; i++) {
                const number = "" + i;
                const noteParsed = parseNoteString(this.notes[i]);
                newTemperament[number] = [this.ratios[i], noteParsed[0], noteParsed[1]];
            }
            addTemperamentToDictionary(this.inTemperament, newTemperament);
            updateTemperaments();
        }

        if (isCustomTemperament(this.inTemperament)) {
            this._logo.customTemperamentDefined = true;
            this.activity.blocks.protoBlockDict["custompitch"].hidden = false;
            this.activity.blocks.palettes.updatePalettes("pitch");
        }
    };

    /**
     * Plays the note at the specified pitch number.
     * @param {number} pitchNumber - The pitch number of the note to play.
     * @returns {void}
     */
    this.playNote = function (pitchNumber) {
        if (
            !this._logo ||
            !this._logo.synth ||
            typeof this._logo.resetSynth !== "function" ||
            typeof this._logo.synth.trigger !== "function"
        ) {
            return;
        }

        this._logo.resetSynth(0);
        const duration = 1 / 2;
        let notes;

        // Dataset ids are strings; normalize and guard invalid indexes.
        const pitchIndex = Number.parseInt(pitchNumber, 10);
        if (Number.isNaN(pitchIndex) || pitchIndex < 0) {
            return;
        }

        // Ensure per-note playback uses the currently selected temperament mapping.
        this._logo.setUserTemperament(this.inTemperament);

        if (docById("wheelDiv4") === null) {
            if (this.editMode === "equal" && this.eqTempHzs && this.eqTempHzs.length) {
                notes = this.eqTempHzs[pitchIndex];
            } else if (this.editMode === "ratio" && this.NEqTempHzs && this.NEqTempHzs.length) {
                notes = this.NEqTempHzs[pitchIndex];
            } else if (isCustomTemperament(this.inTemperament)) {
                notes = this.frequencies[pitchIndex];
            } else if (this.inTemperament === "equal") {
                // Preserve existing 12EDO/equal behavior by using direct frequency.
                notes = this.frequencies[pitchIndex];
            } else if (this.notes[pitchIndex] && Array.isArray(this.notes[pitchIndex])) {
                notes =
                    normalizeNoteAccidentals(this.notes[pitchIndex][0]) + this.notes[pitchIndex][1];
            } else {
                notes = this.frequencies[pitchIndex];
            }
        } else {
            const ratio = this.tempRatios1 && this.tempRatios1[pitchIndex];
            if (typeof ratio === "number" && this.frequencies && this.frequencies.length) {
                notes = ratio * this.frequencies[0];
            }
        }

        // Guard against undefined notes/frequencies to avoid invalid trigger calls.
        if (notes === undefined || notes === null) {
            return;
        }

        this._logo.synth.trigger(
            0,
            notes,
            Singer.defaultBPMFactor * duration,
            "electronic synth",
            null,
            null
        );
    };

    /**
     * Public play-all entry point. Delegates to the visualizer's _playAll
     * once the visualizer has been opened; no-ops otherwise.
     * @returns {void}
     */
    this.playAll = function () {
        if (typeof this._playAll === "function") {
            this._playAll();
        }
    };

    /**
     * Initializes the temperament widget.
     * @param {Activity} activity - The activity associated with the widget.
     * @returns {void}
     */
    this.init = function (activity) {
        this.activity = activity;
        this._logo = this.activity.logo;

        const w = window.innerWidth;
        this._cellScale = w / 1200;

        temperamentTableDiv = document.createElement("div");

        const widgetWindow = window.widgetWindows.windowFor(this, "temperament");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        widgetWindow.getWidgetBody().append(temperamentTableDiv);
        widgetWindow.getWidgetBody().style.height = "500px";
        widgetWindow.getWidgetBody().style.width = "500px";
        widgetWindow.getWidgetBody().style.overflowY = "auto";

        const that = this;

        widgetWindow.onclose = function () {
            if (that._playAllTimer) {
                clearTimeout(that._playAllTimer);
                that._playAllTimer = null;
            }
            that._playAllRunning = false;
            if (that._vizMenu && that._vizMenu.parentNode) {
                that._vizMenu.parentNode.removeChild(that._vizMenu);
                that._vizMenu = null;
            }
            if (that._vizMenuClose) {
                document.removeEventListener("mousedown", that._vizMenuClose);
                that._vizMenuClose = null;
            }
            if (that._playTimeout) {
                clearTimeout(that._playTimeout);
                that._playTimeout = null;
            }
            that._logo.synth.stop();
            that._logo.synth.setMasterVolume(last(Singer.masterVolume));

            removeWheelIfPresent("wheelDiv2", that.notesCircle);
            removeWheelIfPresent("wheelDiv3", that.wheel);
            removeWheelIfPresent("wheelDiv4", that.wheel1);

            this.destroy();
        };

        this.lastClickTime = 0;
        this._lastPlaybackIndex = 0;
        this.playbackForward = true;
        this.inbetween = false;

        const playAllBtn2 = widgetWindow.addButton(
            "play-scale.svg",
            ICONSIZE,
            _("Play all pitches")
        );
        widgetWindow.addButton("export-chunk.svg", ICONSIZE, _("Save")).onclick = function () {
            that._save();
        };

        const addPitchAfterBtn = widgetWindow.addButton(
            "add-clockwise.svg",
            ICONSIZE,
            _("Add pitch after selected (clockwise)")
        );
        const addPitchBeforeBtn = widgetWindow.addButton(
            "add-counterclockwise.svg",
            ICONSIZE,
            _("Add pitch before selected (counterclockwise)")
        );
        const removePitchBtn = widgetWindow.addButton(
            "delete.svg",
            ICONSIZE,
            _("Remove selected pitch")
        );
        this._vizToolbar = {
            addPitchAfterBtn,
            addPitchBeforeBtn,
            removePitchBtn,
            playAllBtn2
        };

        let t = getTemperament(this.inTemperament);
        // Ensure we have a valid temperament object
        if (!t || !t.pitchNumber) {
            that.activity.errorMsg(
                _("Invalid temperament. Falling back to equal temperament."),
                3000
            );
            t = getTemperament("equal");
        }
        this.pitchNumber = t.pitchNumber;
        this.octaveChanged = false;
        this.scale = this.scale[0] + " " + this.scale[1];
        this.scaleNotes = buildScale(this.scale);
        this.scaleNotes = this.scaleNotes[0];
        this.powerBase = 2;
        const startingPitch = this._logo.synth.startingPitch;
        const str = [];
        const note = [];
        this.notes = [];
        this.frequencies = [];
        this.cents = [];
        this.intervals = [];
        this.ratios = [];
        this.ratiosNotesPair = [];

        for (let i = 0; i <= this.pitchNumber; i++) {
            if (
                isCustomTemperament(this.inTemperament) &&
                t["0"] !== undefined &&
                t["0"][1] !== undefined
            ) {
                //If temperament selected is custom and it is defined by user.
                if (i === this.pitchNumber) {
                    this.notes[i] = [t["0"][1], Number(t["0"][2]) + 1];
                    this.ratios[i] = this.powerBase;
                } else {
                    const entry = t["" + i];
                    if (entry && entry[1] !== undefined) {
                        this.notes[i] = [entry[1], entry[2]];
                        this.ratios[i] = entry[0];
                    } else {
                        // Missing custom pitch entry — fall back to equal temperament
                        const eq = getTemperament("equal");
                        this.notes[i] = [eq["" + i][1], eq["" + i][2]];
                        this.ratios[i] = getTemperamentRatio(eq.interval[i]);
                    }
                }
                this.frequencies[i] = this._logo.synth
                    .getCustomFrequency(
                        this.notes[i][0] + this.notes[i][1] + "",
                        this.inTemperament
                    )
                    .toFixed(2);
                this.cents[i] = ratioToCents(this.ratios[i], this.powerBase);
                this.ratiosNotesPair[i] = [this.ratios[i], this.notes[i]];
            } else {
                if (isCustomTemperament(this.inTemperament)) {
                    // If temperament selected is custom and it is not
                    // yet defined by the user then custom temperament
                    // behaves like equal temperament.
                    t = getTemperament("equal");
                }
                // Ensure t has a valid interval array before accessing it
                if (!t || !t.interval || i >= t.interval.length) {
                    that.activity.errorMsg(
                        _("Invalid temperament interval data. Skipping note %s.").replace(
                            /%s/g,
                            i.toString()
                        ),
                        3000
                    );
                    continue;
                }
                str[i] = getNoteFromInterval(startingPitch, t.interval[i]);
                this.notes[i] = str[i];
                note[i] = str[i][0];

                if (
                    str[i][0].substring(1, str[i][0].length) === FLAT ||
                    str[i][0].substring(1, str[i][0].length) === "b"
                ) {
                    note[i] = str[i][0].replace(FLAT, "b");
                } else if (
                    str[i][0].substring(1, str[i][0].length) === SHARP ||
                    str[i][0].substring(1, str[i][0].length) === "#"
                ) {
                    note[i] = str[i][0].replace(SHARP, "#");
                }

                str[i] = note[i] + str[i][1];
                this.intervals[i] = t.interval[i];
                this.ratios[i] = getTemperamentRatio(t[this.intervals[i]]);
                this.cents[i] = ratioToCents(this.ratios[i], this.powerBase);
                if (i === 0) {
                    this.frequencies[i] = this._logo.synth
                        ._getFrequency(str[i], true, this.inTemperament)
                        .toFixed(2);
                } else {
                    // Calculate frequency based on the ratio.
                    const thisFreq = this.frequencies[0] * this.ratios[i];
                    this.frequencies[i] = thisFreq.toFixed(2);
                }
                this.ratiosNotesPair[i] = [this.ratios[i], this.notes[i]];
            }
        }
        this._visualizerView();

        widgetWindow.addButton("add2.svg", ICONSIZE, _("Create new temperament")).onclick =
            function () {
                that.edit();
            };

        widgetWindow.sendToCenter();
    };
}

if (typeof module !== "undefined") {
    module.exports = TemperamentWidget;
    module.exports.deviationColor = deviationColor;
    module.exports.deviationFrom12EDO = deviationFrom12EDO;
    module.exports.largestGapMid = largestGapMid;
    module.exports.sameNodeCents = sameNodeCents;
}
