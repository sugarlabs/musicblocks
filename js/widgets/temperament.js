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

   TemperamentUI, _, addTemperamentToDictionary, buildScale,
   deleteTemperamentFromList, docById, FLAT, getNoteFromInterval,
   getOctaveRatio, getTemperament, getTemperamentKeys, getTemperamentRatio,
   isCustomTemperament, last, normalizeNoteAccidentals, parseNoteString, pitchToFrequency, platformColor,
   PREVIEWVOLUME, ratioToWheelAngle, rationalToFraction, setOctaveRatio, SHARP, Singer,
   slicePath, updateTemperaments, wheelnav, frequencyToPitch, clampNumber,
   ManagedTimer
 */

/* exported TemperamentWidget, deviationColor, deviationFrom12EDO, largestGapMid */

/** AMD module dependencies for lazy loading. */
TemperamentWidget.dependencies = ["widgets/TemperamentUI", "widgets/temperament"];

/**
 * Represents a widget for managing temperament settings.
 * @constructor
 */

/** Green within ±1 cent, orange sharp, red flat. Exported for testing. */
const deviationColor = dev => {
    if (Math.abs(dev) <= 1) return _cssVar("--color-success", "#4caf50");
    return dev > 1 ? _cssVar("--color-warning", "#ff9800") : _cssVar("--color-error", "#f44336");
};

/** Reads a CSS variable with fallback; safe outside the browser (tests). */
const _cssVar = (n, f) =>
    typeof document !== "undefined" && document.body
        ? getComputedStyle(document.body).getPropertyValue(n).trim() || f
        : f;

/** Dictionary key safe for note-name lookup; stale "custom" falls back to 12-EDO. */
const trustedKey = t => (isCustomTemperament(t) ? undefined : t);

/** Deviation in cents from nearest 12-EDO step. Exported for testing. */
const deviationFrom12EDO = cents => cents - Math.round(cents / 100) * 100;

/** Mid of largest gap (circular 0..1200), clamped 1..1199. Exported for testing. */
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

/** Ratio to cents for arbitrary octave base (base=2 is 1200*log2). */
const ratioToCents = (ratio, base) => (1200 * Math.log(ratio)) / Math.log(base);
const centsToAngle = cents => 270 + cents * 0.3;
const angleToCents = angle => (angle - 270) / 0.3;

const MAX_DIVISIONS = 57;

/** True (after warning) when a division count exceeds what the UI can show. */
const overDivisionCap = (activity, count) => {
    if (count <= MAX_DIVISIONS) return false;
    activity.errorMsg(_("Maximum 57 divisions. For larger, use a dedicated tool."), 3000);
    return true;
};

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
     * @type {HTMLElement|null}
     */
    this.temperamentTableDiv = null;
    let temperamentTableDiv;

    const _stripCents = n => n.replace(/\(.*?\)/g, "");

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
     * Timer manager for managing all widget timeouts safely.
     * @type {ManagedTimer|null}
     * @private
     */
    this._timerManager = typeof ManagedTimer !== "undefined" ? new ManagedTimer() : null;

    /**
     * Fallback timeout tracking for test/runtime environments where ManagedTimer is unavailable.
     * @type {Set<number>}
     * @private
     */
    this._activeTimeouts = new Set();

    /**
     * Schedules a timeout owned by the widget lifecycle.
     * @private
     * @param {Function} callback - Callback to run after the delay.
     * @param {number} delay - Delay in milliseconds.
     * @returns {number} Timer ID.
     */
    this._setWidgetTimeout = function (callback, delay) {
        if (this._timerManager !== null) {
            return this._timerManager.setTimeout(callback, delay);
        }

        let id;
        id = setTimeout(() => {
            this._activeTimeouts.delete(id);
            callback();
        }, delay);
        this._activeTimeouts.add(id);
        return id;
    };

    /**
     * Clears a timeout owned by the widget lifecycle.
     * @private
     * @param {number} id - Timer ID returned by _setWidgetTimeout.
     * @returns {boolean} Whether the timeout was tracked and cleared.
     */
    this._clearWidgetTimeout = function (id) {
        if (id === null || id === undefined) {
            return false;
        }

        if (this._timerManager !== null && this._timerManager.clearTimeout(id)) {
            return true;
        }

        if (this._activeTimeouts.has(id)) {
            clearTimeout(id);
            this._activeTimeouts.delete(id);
            return true;
        }

        return false;
    };

    /**
     * Clears all timers owned by the widget lifecycle.
     * @private
     * @returns {number} Number of tracked timers cleared.
     */
    this._clearWidgetTimers = function () {
        let count = 0;

        if (this._timerManager !== null) {
            count += this._timerManager.clearAll();
        }

        for (const id of this._activeTimeouts) {
            clearTimeout(id);
            count++;
        }
        this._activeTimeouts.clear();
        this._playTimeout = null;

        return count;
    };

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
        for (let i = 0; i < count; i++) {
            frequencies[i] = (ratios[i] * baseFrequency).toFixed(2);
        }
        return frequencies;
    };

    this.MAX_DIVISIONS = MAX_DIVISIONS;
    this.overDivisionCap = overDivisionCap;
    this.ratioToCents = ratioToCents;
    this.trustedKey = trustedKey;
    this.computeFrequencies = computeFrequencies;

    this._freqToCents = (freq, baseFreq) => ratioToCents(freq / baseFreq, 2);

    /** Converts a cents offset back to absolute frequency. */
    this._centsToFreq = (cents, baseFreq) => baseFreq * Math.pow(2, cents / 1200);

    /**
     * Draws the visualizer view: 12-EDO reference ring with colored spokes
     * connecting to the active temperament's pitches, plus a scrollable table.
     * @returns {void}
     */
    this._visualizerView = function () {
        temperamentTableDiv.textContent = "";
        temperamentTableDiv.style.backgroundColor = "var(--color-bg-primary, #1a1a2e)";
        temperamentTableDiv.style.color = "var(--color-text-primary, #e0e0e0)";
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
        let highlightDot = -1;
        let flashDot = -1;
        const _isLocked = i => i === 0;
        const _ref12 = j => Math.round(that.cents[j] / 100) * 100;

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
        temperLabel.style.color = "var(--color-text-primary, #e0e0e0)";
        temperLabel.style.whiteSpace = "nowrap";
        temperLabel.textContent = _getTemperamentLabel(that.inTemperament);
        controlsDiv.appendChild(temperLabel);

        // "Modified" indicator — shown when pitches differ from the saved temperament
        const modifiedLabel = document.createElement("span");
        modifiedLabel.style.fontSize = "11px";
        modifiedLabel.style.color = "var(--color-warning, #f0ad4e)";
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
            // Any change to a built-in temperament (e.g. 19 EDO) makes it custom.
            if (isModified && !isCustomTemperament(that.inTemperament)) {
                that.inTemperament = "custom";
                // Not equally tempered anymore: save must emit ratio blocks,
                // not the powerBase^(i/divisions) formula.
                that.typeOfEdit = "nonequal";
                temperLabel.textContent = _getTemperamentLabel("custom");
                if (![...compareSelect.options].some(o => o.value === "custom")) {
                    const o = document.createElement("option");
                    o.value = "custom";
                    o.textContent = _getTemperamentLabel("custom");
                    compareSelect.appendChild(o);
                }
                compareSelect.value = "custom";
            }
        };

        const temperaments = getTemperamentsList();
        const _selectBtnWrapper = document.createElement("div");
        _selectBtnWrapper.style.position = "relative";
        _selectBtnWrapper.style.display = "inline-flex";
        _selectBtnWrapper.style.alignItems = "center";
        _selectBtnWrapper.style.width = "32px";
        _selectBtnWrapper.style.height = "32px";
        _selectBtnWrapper.style.flexShrink = "0";

        const _selectBtnIcon = document.createElement("img");
        _selectBtnIcon.src = "header-icons/menu-button.svg";
        _selectBtnIcon.alt = _("temperament");
        _selectBtnIcon.height = 24;
        _selectBtnIcon.width = 24;
        _selectBtnIcon.style.pointerEvents = "none";
        _selectBtnWrapper.appendChild(_selectBtnIcon);

        const compareSelect = document.createElement("select");
        compareSelect.title = _("temperament");
        compareSelect.setAttribute("aria-label", _("temperament"));
        Object.assign(compareSelect.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            opacity: "0",
            cursor: "pointer",
            zIndex: "1",
            border: "none",
            margin: "0",
            padding: "0"
        });

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

        _selectBtnWrapper.appendChild(compareSelect);
        controlsDiv.appendChild(_selectBtnWrapper);

        temperamentTableDiv.appendChild(controlsDiv);

        // ── Operations toolbar (presets + pitch count) ──
        that._playAllTimer = null;
        that._playAllRunning = false;
        const _playAll = function () {
            if (that._playAllRunning) {
                that._clearWidgetTimeout(that._playAllTimer);
                that._playAllTimer = null;
                that._playAllRunning = false;
                flashDot = -1;
                _drawCircle();
                _updateRemoveButton();
                return;
            }
            if (that._vizMenu) _removeMenu();
            dragIndex = -1;
            lockedDrag = false;
            highlightDot = -1;
            _highlightTableRow(-1);
            that._playAllRunning = true;
            _updateRemoveButton();
            // Play up the scale, the octave exactly once, then back down.
            // frequencies[] may or may not carry an octave entry at
            // pitchNumber, so only iterate the pitches within the octave
            // and synthesize the octave explicitly. The octave sits at the
            // same position on the circle as the tonic, so highlight dot 0.
            const n = Math.min(that.pitchNumber, that.frequencies.length);
            const sequence = [];
            for (let k = 0; k < n; k++) sequence.push([k]);
            sequence.push([0, Number(that.frequencies[0]) * that.powerBase]);
            for (let k = n - 1; k >= 0; k--) sequence.push([k]);
            let i = 0;
            const step = function () {
                if (!that._playAllRunning) {
                    flashDot = -1;
                    _drawCircle();
                    return;
                }
                _playNote(sequence[i][0], sequence[i][1]);
                i++;
                if (i >= sequence.length) {
                    that._playAllRunning = false;
                    _updateRemoveButton();
                    that._setWidgetTimeout(function () {
                        flashDot = -1;
                        _drawCircle();
                    }, 200);
                    return;
                }
                // Pace the run by the project tempo factor (matches the
                // Singer.defaultBPMFactor pattern used for note durations).
                const gap =
                    typeof Singer !== "undefined" && Singer.defaultBPMFactor
                        ? 300 * Singer.defaultBPMFactor
                        : 300;
                that._playAllTimer = that._setWidgetTimeout(step, gap);
            };
            step();
        };
        // Expose on the widget instance for the public playAll() wrapper
        that._playAll = _playAll;

        const _addPitch = function (dir) {
            if (that._playAllRunning) return;
            const base = that.cents.slice(0, that.pitchNumber);
            const nGaps = base.length;
            const s = highlightDot >= 0 && highlightDot < that.cents.length ? highlightDot : -1;
            let cents;
            if (s < 0 || nGaps < 2) {
                cents = largestGapMid(base.length ? base : that.cents);
            } else {
                const sorted = [...base].sort((a, b) => a - b);
                const curVal = that.cents[s] % 1200;
                let curIdx = sorted.findIndex(c => Math.abs((c % 1200) - curVal) < 0.5);
                if (curIdx < 0) curIdx = 0;
                const nextIdx = dir > 0 ? (curIdx + 1) % nGaps : (curIdx - 1 + nGaps) % nGaps;
                const a = sorted[curIdx];
                const b = sorted[nextIdx];
                const gap = dir > 0 ? (b - a + 1200) % 1200 : (a - b + 1200) % 1200;
                let mid = dir > 0 ? a + gap / 2 : a - gap / 2;
                mid = ((mid % 1200) + 1200) % 1200;
                if (mid === 0) mid = 1;
                mid = Math.max(1, Math.min(1199, Math.round(mid * 10) / 10));
                const dup = base.some(c => Math.abs(c - mid) < 0.5);
                cents = dup ? largestGapMid(base) : mid;
            }
            const idx = that.cents.findIndex(c => cents < c);
            const insertAt = idx === -1 ? that.cents.length : idx;
            _insertPitch(insertAt, cents);
            highlightDot = insertAt;
            _drawCircle();
            _buildTable();
            _highlightTableRow(highlightDot);
            _updateRemoveButton();
            _checkModified();
        };
        const _updateRemoveButton = () => {
            if (!that._vizToolbar) return;
            const btn = that._vizToolbar.removePitchBtn;
            if (btn && btn.style) {
                const locked =
                    that._playAllRunning || (highlightDot >= 0 && _isLocked(highlightDot));
                btn.style.opacity = locked ? "0.4" : "1";
                btn.style.pointerEvents = locked ? "none" : "auto";
                btn.style.cursor = locked ? "not-allowed" : "pointer";
            }
            const addAfter = that._vizToolbar.addPitchAfterBtn;
            const addBefore = that._vizToolbar.addPitchBeforeBtn;
            for (const addBtn of [addAfter, addBefore]) {
                if (addBtn && addBtn.style) {
                    addBtn.style.opacity = that._playAllRunning ? "0.4" : "1";
                    addBtn.style.pointerEvents = that._playAllRunning ? "none" : "auto";
                    addBtn.style.cursor = that._playAllRunning ? "not-allowed" : "pointer";
                }
            }
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
        legendDiv.style.color = "var(--color-text-tertiary, #aaa)";

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

        legendDiv.appendChild(
            _legendItem(_cssVar("--color-success", "#4caf50"), _("active temperament"), false, true)
        );
        legendDiv.appendChild(
            _legendItem("var(--color-text-tertiary, #aaa)", _("12-EDO reference"), false, false)
        );
        [
            [_cssVar("--color-success", "#4caf50"), _("no deviation"), true, false],
            [_cssVar("--color-warning", "#ff9800"), _("sharp (+cents)"), false, false],
            [_cssVar("--color-error", "#f44336"), _("flat (-cents)"), false, false]
        ].forEach(([color, label, dashed, dot]) =>
            legendDiv.appendChild(_legendItem(color, label, dashed, dot))
        );
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
            if (that._playAllRunning) return;
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
                ctx.strokeStyle = _cssVar("--color-text-tertiary", "#666");
                ctx.stroke();
                const lx = cx + (outerR + 18) * Math.cos(a);
                const ly = cy + (outerR + 18) * Math.sin(a);
                ctx.fillStyle = _cssVar("--color-text-tertiary", "#aaa");
                ctx.fillText(labels[k], lx, ly);
            }

            // Inner dots and spokes for active temperament
            for (let i = 0; i < that.pitchNumber; i++) {
                const cents = that.cents[i];
                const angleDeg = centsToAngle(cents);
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

                if (i === flashDot || (!that._playAllRunning && i === highlightDot)) {
                    ctx.beginPath();
                    ctx.arc(dx, dy, dotR + 7, 0, 2 * Math.PI);
                    ctx.strokeStyle = "#ffeb3b";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(dx, dy, dotR + 3, 0, 2 * Math.PI);
                    ctx.strokeStyle = _cssVar("--color-bg-inverse", "#fff");
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.lineWidth = 1;
                }
            }

            ctx.fillStyle = _cssVar("--color-text-primary", "#e0e0e0");
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            if (highlightDot >= 0 && highlightDot < that.pitchNumber) {
                const selDev = deviationFrom12EDO(that.cents[highlightDot]);
                const selHz = that.frequencies[highlightDot];
                const noteName = that.notes[highlightDot];
                const label = noteName ? noteName[0] + noteName[1] : "";
                ctx.font = "bold 14px sans-serif";
                ctx.fillText(label, cx, cy - 10);
                ctx.font = "12px sans-serif";
                ctx.fillText(
                    (selDev >= 0 ? "+" : "") + selDev.toFixed(1) + "¢  " + selHz + " Hz",
                    cx,
                    cy + 8
                );
            } else {
                ctx.fillText(that.inTemperament + " vs 12-EDO", cx, cy);
            }
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
            th.style.border = "1px solid var(--color-border-secondary, #333)";
            th.style.padding = "6px 8px";
            th.style.textAlign = "center";
            th.style.backgroundColor = "var(--color-bg-tertiary, #2a2a3e)";
            th.style.color = "var(--color-text-secondary, #ccc)";
            th.style.fontWeight = "bold";
            thead.appendChild(th);
        }
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        table.appendChild(tbody);
        const rowRefs = [];

        /** Ups-and-downs prefix for a cents value (deviation from 12-EDO). */
        const _updown = cents => {
            const dev = deviationFrom12EDO(cents);
            if (dev > 30) return "^^";
            if (dev > 15) return "^";
            if (dev < -30) return "vv";
            if (dev < -15) return "v";
            return "";
        };

        const _styleInput = el => {
            el.style.width = "70px";
            el.style.fontSize = "12px";
            el.style.background = "var(--color-bg-tertiary, #2a2a3e)";
            el.style.color = "var(--color-text-primary, #e0e0e0)";
            el.style.border = "1px solid var(--color-border-primary, #555)";
            el.style.borderRadius = "3px";
            el.style.textAlign = "center";
        };
        const _makeEditable = (td, i, getPrev, getNext, getCur, opts, onCommit) => {
            td.style.cursor = _isLocked(i) ? "default" : "text";
            td.ondblclick = ev => {
                ev.stopPropagation();
                if (_isLocked(i) || that._playAllRunning) return;
                const prev = getPrev(i);
                const next = getNext(i);
                const cur = getCur(i);
                const lo = prev !== null ? prev + opts.eps : opts.eps;
                const hi = next !== null ? next - opts.eps : Infinity;
                const input = document.createElement("input");
                input.type = "number";
                input.step = opts.step;
                input.min = String(lo);
                if (hi !== Infinity) input.max = String(hi);
                input.value = cur.toFixed(opts.decimals);
                const hiStr = hi !== Infinity ? hi.toFixed(opts.decimals) : "∞";
                input.title = opts.title
                    ? opts.title(lo, hi, cur)
                    : `${opts.label} (${lo.toFixed(opts.decimals)} – ${hiStr})`;
                input.setAttribute("aria-label", opts.aria(i));
                _styleInput(input);
                td.textContent = "";
                td.appendChild(input);
                input.focus();
                input.select();
                const commit = () => {
                    if (that._playAllRunning) {
                        _updateTableRow(i);
                        return;
                    }
                    let v = parseFloat(input.value);
                    if (isNaN(v)) {
                        _updateTableRow(i);
                        return;
                    }
                    v = Math.max(lo, Math.min(hi, v));
                    onCommit(v, i);
                    const order = that.cents
                        .map((c, j) => [c, j])
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
                input.onblur = commit;
                input.onkeydown = e => {
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
        };

        /** (Re)builds the table rows from current state, storing cell refs. */
        const _buildTable = function () {
            tbody.textContent = "";
            rowRefs.length = 0;
            for (let i = 0; i < that.pitchNumber; i++) {
                const tr = document.createElement("tr");
                const bgColor =
                    i % 2 === 0
                        ? "var(--color-bg-primary, #1a1a2e)"
                        : "var(--color-bg-secondary, #22223a)";
                tr.style.backgroundColor = bgColor;
                tr.style.cursor = "pointer";

                const tdName = document.createElement("td");
                const tdStep = document.createElement("td");
                const tdFreq = document.createElement("td");
                const tdCents = document.createElement("td");
                const tdRatio = document.createElement("td");

                for (const td of [tdName, tdStep, tdFreq, tdCents, tdRatio]) {
                    td.style.border = "1px solid var(--color-border-secondary, #333)";
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
                    for (const td of cells)
                        td.style.backgroundColor = "var(--color-bg-tertiary, #33334d)";
                };
                tr.onmouseleave = function () {
                    for (const td of cells)
                        td.style.backgroundColor = ref.selected
                            ? "var(--color-selector-selected, #3a3a5e)"
                            : bgColor;
                };
                tr.onclick = function () {
                    if (that._playAllRunning) return;
                    highlightDot = i;
                    _drawCircle();
                    _highlightTableRow(i);
                    _updateRemoveButton();
                };
                tr.oncontextmenu = function (e) {
                    e.preventDefault();
                    _showMenu(e, i);
                };
                _makeEditable(
                    tdCents,
                    i,
                    j => {
                        if (j <= 0) return null;
                        return Math.max(that.cents[j - 1] - _ref12(j), -51);
                    },
                    j => {
                        if (j >= that.pitchNumber - 1) return 51;
                        return Math.min(that.cents[j + 1] - _ref12(j), 51);
                    },
                    j => deviationFrom12EDO(that.cents[j]),
                    {
                        eps: 1,
                        step: "0.1",
                        decimals: 1,
                        title: (lo, hi) =>
                            `Relative cents from 12-EDO (${lo.toFixed(1)} – ${hi.toFixed(1)})`,
                        aria: j => `Cents for pitch ${j}, relative to 12-EDO, between neighbors`
                    },
                    (v, j) => _applyCents(j, _ref12(j) + v)
                );
                _makeEditable(
                    tdFreq,
                    i,
                    j => (j > 0 ? Number(that.frequencies[j - 1]) : null),
                    j => (j < that.pitchNumber - 1 ? Number(that.frequencies[j + 1]) : null),
                    j => Number(that.frequencies[j]),
                    {
                        eps: 0.01,
                        step: "0.01",
                        decimals: 2,
                        label: "Frequency in Hz",
                        aria: j => `Frequency for pitch ${j} in Hz, between neighbors`
                    },
                    (v, j) =>
                        _applyCents(
                            j,
                            ratioToCents(v / Number(that.frequencies[0]), that.powerBase)
                        )
                );
                _makeEditable(
                    tdRatio,
                    i,
                    j => (j > 0 ? that.ratios[j - 1] : null),
                    j => (j < that.pitchNumber - 1 ? that.ratios[j + 1] : null),
                    j => that.ratios[j],
                    {
                        eps: 0.001,
                        step: "0.001",
                        decimals: 3,
                        label: "Ratio",
                        aria: j => `Ratio for pitch ${j}, between neighbors`
                    },
                    (v, j) => _applyCents(j, ratioToCents(v, that.powerBase))
                );
            }
            for (let i = 0; i < rowRefs.length; i++) {
                _updateTableRow(i);
            }
        };

        /** Highlights the selected table row. */
        const _highlightTableRow = function (index) {
            for (let i = 0; i < rowRefs.length; i++) {
                const ref = rowRefs[i];
                ref.selected = i === index;
                const color = ref.selected
                    ? "var(--color-selector-selected, #3a3a5e)"
                    : ref.bgColor;
                for (const td of [ref.name, ref.step, ref.freq, ref.cents, ref.ratio]) {
                    td.style.backgroundColor = color;
                }
            }
        };

        /** Updates a single row (used during drag). */
        const _updateTableRow = function (i) {
            if (!rowRefs[i]) return;
            // Skip sparse rows (partial data on load) instead of throwing.
            if (!that.notes[i] || that.cents[i] === undefined || that.ratios[i] === undefined)
                return;
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
        hint.style.color = "var(--color-text-tertiary, #777)";
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
            let rawCents = angleToCents(a);
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
            const obj = frequencyToPitch(freq, trustedKey(that.inTemperament));
            that.notes.splice(index, 0, [obj[0], obj[1]]);
            that.intervals.splice(index, 0, "");
            that.ratiosNotesPair.splice(index, 0, [that.ratios[index], that.notes[index]]);
        };

        const _removePitch = function (index) {
            if (that._playAllRunning || that.pitchNumber <= 1) return;
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
            _applyCents(index, _ref12(index));
        };

        const _playNote = function (index, freqOverride) {
            that._logo.resetSynth(0);
            that._logo.synth.trigger(
                0,
                freqOverride !== undefined ? freqOverride : Number(that.frequencies[index]),
                1 / 4,
                "electronic synth",
                null,
                null
            );
            flashDot = index;
            _drawCircle();
            that._setWidgetTimeout(function () {
                flashDot = -1;
                _drawCircle();
            }, 200);
        };

        const _findNearest = function (px, py, maxDist) {
            let nearest = null;
            let nearestDist = Infinity;
            for (let i = 0; i < that.pitchNumber; i++) {
                const cents = that.cents[i];
                const angleDeg = centsToAngle(cents);
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

            // Add the octave entry (pitchNumber index) so play-all
            // covers the full range up to and including the octave.
            if (that.notes[0]) {
                that.notes[that.pitchNumber] = [that.notes[0][0], that.notes[0][1] + 1];
                that.ratios[that.pitchNumber] = that.powerBase;
                that.frequencies[that.pitchNumber] = (that.frequencies[0] * that.powerBase).toFixed(
                    2
                );
                that.cents[that.pitchNumber] = ratioToCents(that.powerBase, that.powerBase);
                that.intervals[that.pitchNumber] = that.powerBase;
                that.ratiosNotesPair[that.pitchNumber] = [
                    that.powerBase,
                    that.notes[that.pitchNumber]
                ];
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
                that._clearWidgetTimeout(longPressTimer);
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
            if (that._playAllRunning) return;
            e.preventDefault();
            _removeMenu();
            const menu = document.createElement("div");
            menu.style.position = "fixed";
            menu.style.left = e.clientX + "px";
            menu.style.top = e.clientY + "px";
            menu.style.background = "var(--color-bg-tertiary, #2a2a3e)";
            menu.style.border = "1px solid var(--color-border-primary, #555)";
            menu.style.borderRadius = "4px";
            menu.style.padding = "6px";
            menu.style.zIndex = "1000";
            menu.style.fontSize = "12px";
            menu.style.color = "var(--color-text-primary, #e0e0e0)";
            menu.style.display = "flex";
            menu.style.flexDirection = "column";
            menu.style.gap = "4px";

            const centsInput = document.createElement("input");
            centsInput.type = "number";
            centsInput.step = "0.1";
            centsInput.min = "-50";
            centsInput.max = "50";
            centsInput.value = deviationFrom12EDO(that.cents[index]).toFixed(1);
            centsInput.title = _("Relative cents from 12-EDO (-50 to +50)");
            centsInput.style.width = "80px";
            centsInput.style.fontSize = "12px";

            const applyBtn = document.createElement("button");
            applyBtn.textContent = _("Set cents");
            applyBtn.style.fontSize = "11px";
            applyBtn.onclick = function (ev) {
                ev.stopPropagation();
                const v = parseFloat(centsInput.value);
                if (!isNaN(v)) {
                    _applyCents(index, _ref12(index) + Math.max(-50, Math.min(50, v)));
                    _drawCircle();
                    _updateTableRow(index);
                    _checkModified();
                }
                _removeMenu();
            };
            if (_isLocked(index)) {
                applyBtn.disabled = true;
                applyBtn.style.opacity = "0.4";
                centsInput.disabled = true;
            }

            const resetBtn = document.createElement("button");
            resetBtn.textContent = _("Reset to 12-EDO");
            resetBtn.style.fontSize = "11px";
            resetBtn.style.textAlign = "left";
            resetBtn.onclick = function (ev) {
                ev.stopPropagation();
                _resetTo12(index);
                _drawCircle();
                _buildTable();
                if (highlightDot >= 0) _highlightTableRow(highlightDot);
                _updateRemoveButton();
                _checkModified();
                _removeMenu();
            };
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
            that._setWidgetTimeout(function () {
                if (that._vizMenu) document.addEventListener("mousedown", _closeMenu);
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
            if (that._playAllRunning || e.button !== 0) return;
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
            if (that._playAllRunning) {
                canvas.style.cursor = "default";
                return;
            }
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
            if (that._playAllRunning) return;
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
                longPressTimer = that._setWidgetTimeout(() => {
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
            that._vizToolbar.addPitchAfterBtn.onclick = () => _addPitch(1);
            that._vizToolbar.addPitchBeforeBtn.onclick = () => _addPitch(-1);
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
     * Delegates to TemperamentUI.edit (PR #8815).
     * @returns {void}
     */
    this.edit = function () {
        TemperamentUI.edit(this);
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
                    temperamentRatios[j] = getTemperamentRatio(t[intervals[j]]);
                }
                const EPS = 1e-6;
                const ratiosEqual =
                    ratios.length === temperamentRatios.length &&
                    ratios.every(function (element, index) {
                        return Math.abs(parseFloat(element) - temperamentRatios[index]) < EPS;
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
            // Ratios match no known temperament: save must emit ratio blocks,
            // not the powerBase^(i/divisions) formula.
            this.typeOfEdit = "nonequal";
        }
    };

    /**
     * Saves the modifications made to the temperament.
     * @returns {void}
     */
    this._save = function () {
        this.notes = [];

        if (isCustomTemperament(this.inTemperament)) {
            // Match table/saved stack via frequencies[0]; dictionary lookup can go stale.
            const startPitch = Number(this.frequencies[0]);

            let addOctave = "";
            for (let i = 0; i < this.ratios.length; i++) {
                const obj = frequencyToPitch(this.ratios[i] * startPitch);
                const newPitch = obj[0];
                const newOctave = obj[1];
                // Use stored cents, not Hz round-trip (avoids ±30 boundary flips).
                const newCents =
                    typeof this.cents[i] === "number" ? deviationFrom12EDO(this.cents[i]) : obj[2];
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
                                value: _stripCents(this.notes[i])
                            }
                        ],
                        0,
                        0,
                        [idx + 9]
                    ]);
                    newStack.push([
                        idx + 11,
                        ["number", { value: parseNoteString(_stripCents(this.notes[i]))[1] }],
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
                                value: _stripCents(this.notes[i])
                            }
                        ],
                        0,
                        0,
                        [idx + 7]
                    ]);
                    newStack.push([
                        idx + 9,
                        ["number", { value: parseNoteString(_stripCents(this.notes[i]))[1] }],
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
                const cleanName = _stripCents(this.notes[i]);
                const noteParsed = parseNoteString(cleanName);
                newTemperament[number] = [this.ratios[i], noteParsed[0], noteParsed[1]];
            }
            addTemperamentToDictionary(this.inTemperament, newTemperament);
            updateTemperaments();
            // The redefined temperament keeps its old name, so any frequency
            // already cached under that name (see Singer.getCachedPitchToFrequency)
            // would otherwise keep playing at the pre-edit tuning until the
            // project is stopped and restarted.
            Singer.clearPitchToFrequencyCache();
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
        this.temperamentTableDiv = temperamentTableDiv;

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
            that._clearWidgetTimers();
            that._playing = false;
            that._playAllTimer = null;
            that._playAllRunning = false;
            if (that._vizMenu && that._vizMenu.parentNode) {
                that._vizMenu.parentNode.removeChild(that._vizMenu);
                that._vizMenu = null;
            }
            if (that._vizMenuClose) {
                document.removeEventListener("mousedown", that._vizMenuClose);
                that._vizMenuClose = null;
            }
            that._logo.synth.stop();
            that._logo.synth.setMasterVolume(last(Singer.masterVolume));

            TemperamentUI._removeWheelIfPresent("wheelDiv2", that.notesCircle);
            TemperamentUI._removeWheelIfPresent("wheelDiv3", that.wheel);
            TemperamentUI._removeWheelIfPresent("wheelDiv4", that.wheel1);

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
    module.exports.ratioToCents = ratioToCents;
}
