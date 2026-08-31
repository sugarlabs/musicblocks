// Copyright (c) 2016-21 Walter Bender
// Copyright (c) 2026 Ashutosh Karnatak (Dependency Injection Refactoring)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global

   docById, _, platformColor, keySignatureToMode, MUSICALMODES,
   getNote, DEFAULTVOICE, last, NOTESTABLE, wheelnav,
   normalizeNoteAccidentals, getCurrentEDO, getModePattern, DEFAULTMODE,
   numberToPitch, pitchToFrequency, MODE_PIE_MENUS, TEMPERAMENT, generateNoteNames,
   getSavedCustomModes, getModeNamesForGroup, getModeLabel,
   getModeSliceColors, updateModeWheelItems, getModeGroupTitleFont, getModeSliceFont,
   configureWheel, MODEPIEMENU_GROUP_RING, MODEPIEMENU_NAME_RING,
    scalePatternToEDO, isNonEDO, getNonEDOModeSteps, getNonEDOFrequency, isEquallyTempered, piemenuModes
 */

/*
    Dependency Injection Pattern:
    Dependencies are passed via the constructor as part of the `activity`
    object: logo, turtles, blocks, hideMsgs, textMsg, errorMsg, refreshCanvas.
*/

/*exported ModeWidget*/

/**
 * ModeWidget - A widget for creating and managing musical modes.
 *
 * Users select intervals on a circular wheel to define custom modes.
 * Supports multiple EDOs/tunings, play, save, rotate, and invert.
 */
class ModeWidget {
    static dependencies = ["widgets/modewidget"];

    static ICONSIZE = 32;
    static ROTATESPEED = 125;
    static RESET_NOTES_DELAY = 500;
    static WHEELSIZE = 400;
    static MIN_EDO = 5;
    static MAX_EDO = 55;
    static MAX_TITLE_FONT_SIZE = 48;
    static MIN_TITLE_FONT_SIZE = 10;
    static TITLE_FONT_SCALE = 580;

    /**
     * @param {object} activity
     * @param {object} [deps] - Optional explicit dependencies (for testing)
     */
    constructor(activity, deps) {
        this.activity = activity;
        this._deps = deps || {};

        this.logo = this._deps.logo || this.activity.logo;
        this.turtles = this._deps.turtles || this.activity.turtles;
        this.blocks = this._deps.blocks || this.activity.blocks;
        this.hideMsgs = this._deps.hideMsgs || this.activity.hideMsgs.bind(this.activity);
        this.textMsg = this._deps.textMsg || this.activity.textMsg.bind(this.activity);
        this.errorMsg = this._deps.errorMsg || this.activity.errorMsg.bind(this.activity);
        this.refreshCanvas =
            this._deps.refreshCanvas || this.activity.refreshCanvas.bind(this.activity);

        this._modeBlock = this.logo.modeBlock;
        this._locked = false;
        this._pitch = this.turtles.ithTurtle(0).singer.keySignature[0];
        this._noteValue = 0.333;
        this._undoStack = [];
        this._playing = false;
        this._selectedNotes = [];
        this._newPattern = null;
        this._edoNoteCache = {};
        // Non-EDO temperaments (just intonation, Pythagorean, meantone) are
        // mapped to their pitch count by getCurrentEDO. The widget operates on
        // that count, and changing the tuning below replaces the temperament.
        this._activeEDO = getCurrentEDO(this.logo.synth.inTemperament);
        this._activeTemperamentKey = this.logo.synth.inTemperament;
        this._selectedModeName = "major";
        this._modePiemenuOpen = false;

        this.widgetWindow = window.widgetWindows.windowFor(this, "custom mode");
        this.widgetWindow.clear();
        this.widgetWindow.show();

        this._timeouts = [];

        // Layout: pie wheel + mode table (label row) + bottom control bar
        this.modeTableDiv = document.createElement("div");
        this.modeTableDiv.style.display = "inline";
        this.modeTableDiv.style.visibility = "visible";
        this.modeTableDiv.style.border = "0px";

        // Unique ids: "meterWheelDiv" is also used by index.html and the Meter
        // widget, so getElementById could resolve to the wrong element.
        const meterWheelDiv = document.createElement("div");
        meterWheelDiv.id = "modeWidgetWheelDiv";

        const modeTable = document.createElement("table");
        modeTable.id = "modeTable";

        this.modeTableDiv.replaceChildren(meterWheelDiv, modeTable);
        this._meterWheelDiv = meterWheelDiv;
        this.widgetWindow.getWidgetBody().append(this.modeTableDiv);

        this.widgetWindow.onclose = () => {
            if (this._timeouts) {
                this._timeouts.forEach(id => clearTimeout(id));
                this._timeouts = [];
            }
            this._playing = false;
            if (this.logo && this.logo.synth) {
                this.logo.synth.stop();
            }
            this._locked = false;
            this.hideMsgs();
            if (this.logo) {
                // Release the singleton reference and the in-widget flag so a
                // later run can open a fresh widget.
                this.logo.insideModeWidget = false;
                if (this.logo.modeWidget === this) {
                    this.logo.modeWidget = null;
                }
            }
            this.widgetWindow.destroy();
        };

        this.widgetWindow.onmaximize = this._scale;

        this._playButton = this.widgetWindow.addButton(
            "play-button.svg",
            ModeWidget.ICONSIZE,
            _("Play")
        );
        this._playButton.onclick = () => {
            this.logo.resetSynth(0);
            if (this._playing) {
                this._playing = false;
                this._setPlayButtonIcon("play-button.svg", _("Play all"));
            } else {
                this._playing = true;
                this._setPlayButtonIcon("stop-button.svg", _("Stop"));
                this._playAll();
            }
        };

        this.widgetWindow.addButton("erase-button.svg", ModeWidget.ICONSIZE, _("Clear")).onclick =
            this._clear.bind(this);

        this.widgetWindow.addButton(
            "rotate-left.svg",
            ModeWidget.ICONSIZE,
            _("Rotate counter clockwise")
        ).onclick = this._rotateLeft.bind(this);

        this.widgetWindow.addButton(
            "rotate-right.svg",
            ModeWidget.ICONSIZE,
            _("Rotate clockwise")
        ).onclick = this._rotateRight.bind(this);

        this.widgetWindow.addButton("invert.svg", ModeWidget.ICONSIZE, _("Invert")).onclick =
            this._invert.bind(this);

        this.widgetWindow.addButton("restore-button.svg", ModeWidget.ICONSIZE, _("Undo")).onclick =
            this._undo.bind(this);

        this._piemenuMode();

        const table = docById("modeTable");
        const labelRow = table.insertRow();
        const labelCell = labelRow.insertCell();
        labelCell.textContent = "\u00a0";
        labelCell.style.fontSize = "14px";
        labelCell.style.fontWeight = "bold";
        labelCell.style.textAlign = "center";
        labelCell.style.padding = "6px 0";
        labelCell.style.verticalAlign = "middle";
        this._modeLabelCell = labelCell;

        // Hydrate the wheel with the mode already in use (e.g., C major).
        this._setMode();

        this._buildControlBar();

        this.textMsg(_("Click in the circle to select notes for the mode."), 3000);

        if (TEMPERAMENT[this.logo.synth.inTemperament]?.isEDO === false) {
            // Non-EDO temperaments are used by their pitch count (12/19/21);
            // switching the tuning below will replace them with an equal
            // temperament. Inform, but do not block.
            this._setTimeout(
                () =>
                    this.textMsg(
                        _(
                            "Non-EDO temperament: modes use its pitch count; switching the tuning replaces the temperament."
                        ),
                        4000
                    ),
                3500
            );
        }

        window.requestAnimationFrame(() => this.widgetWindow.sendToCenter());
    }

    // ── Timeout helper ────────────────────────────────────────────

    _setTimeout(fn, delay) {
        const id = setTimeout(() => {
            this._timeouts = this._timeouts.filter(t => t !== id);
            fn();
        }, delay);
        this._timeouts.push(id);
        return id;
    }

    _cancelAnimations() {
        // Clear stale rotate/invert/play callbacks before rebuilding for a
        // new EDO; they reference old navItem indexes.
        if (this._timeouts) {
            this._timeouts.forEach(id => clearTimeout(id));
            this._timeouts = [];
        }
        this._locked = false;
        this._playing = false;
        this._newPattern = null;
        this._notesToPlay = null;
    }

    _setPlayButtonIcon(iconName, titleText) {
        const img = document.createElement("img");
        img.src = "header-icons/" + iconName;
        img.title = titleText;
        img.alt = titleText;
        img.setAttribute("height", ModeWidget.ICONSIZE);
        img.setAttribute("width", ModeWidget.ICONSIZE);
        img.style.verticalAlign = "middle";
        this._playButton.replaceChildren(
            document.createTextNode("\u00a0\u00a0"),
            img,
            document.createTextNode("\u00a0\u00a0")
        );
    }

    // ── EDO helpers ───────────────────────────────────────────────

    _edoOptions() {
        const inTemperament = this.logo.synth.inTemperament;
        const builtInTemperaments = [
            { edo: 5, key: "equal5", label: "5-EDO" },
            { edo: 7, key: "equal7", label: "7-EDO" },
            { edo: 12, key: "equal", label: "12-EDO (Equal)" },
            { edo: 17, key: "equal17", label: "17-EDO" },
            { edo: 19, key: "equal19", label: "19-EDO (Meantone)" },
            { edo: 31, key: "equal31", label: "31-EDO" }
        ];

        const options = builtInTemperaments.map(t => ({
            value: t.key,
            label: t.label,
            temperamentKey: t.key,
            edo: t.edo
        }));

        // Add non-EDO temperaments (ratios-based: JI, Pythagorean, meantone variants)
        for (const key of Object.keys(TEMPERAMENT)) {
            if (TEMPERAMENT[key].isEDO === false) {
                const t = TEMPERAMENT[key];
                options.push({
                    value: key,
                    label: t.name || key,
                    temperamentKey: key,
                    edo: t.pitchNumber || t.edo || 12
                });
            }
        }

        if (!options.some(o => o.temperamentKey === inTemperament)) {
            options.unshift({
                value: inTemperament,
                label: this._activeEDO + "-EDO",
                temperamentKey: inTemperament,
                edo: this._activeEDO
            });
        }

        return options;
    }

    _initEdoSelect(select) {
        const inTemperament = this.logo.synth.inTemperament;
        for (const o of this._edoOptions()) {
            const opt = document.createElement("option");
            opt.value = o.temperamentKey;
            opt.setAttribute("data-edo", o.edo);
            opt.textContent = o.label;
            if (o.temperamentKey === inTemperament) {
                opt.selected = true;
            }
            select.appendChild(opt);
        }
    }
    _wireEdoSelect(select) {
        select.addEventListener("change", () => {
            const key = select.value;
            if (!key || key === this._activeTemperamentKey) {
                return;
            }
            const newEDO = getCurrentEDO(key);
            if (isNaN(newEDO) || newEDO < ModeWidget.MIN_EDO || newEDO > ModeWidget.MAX_EDO) {
                return;
            }

            if (!isEquallyTempered(this._activeTemperamentKey)) {
                this.textMsg(_("Switching tuning replaces the current non-EDO temperament."), 3000);
            }

            this._closeModePiemenu();

            const bothEqual =
                isEquallyTempered(this._activeTemperamentKey) && isEquallyTempered(key);
            const oldEDO = getCurrentEDO(this._activeTemperamentKey);

            if (bothEqual) {
                this._cacheState(oldEDO);
            }

            this.logo.synth.inTemperament = key;
            this._activeTemperamentKey = key;

            // _translateNotesToEDO() and _restoreState() must run while
            // this._activeEDO still holds the OLD EDO: _translateNotesToEDO
            // reads it to know what to rescale from, and its no-op guard
            // (newEDO === this._activeEDO) would otherwise always be true if
            // this._activeEDO were already set to newEDO here.
            if (bothEqual) {
                if (this._edoNoteCache[newEDO] !== undefined) {
                    this._restoreState(newEDO);
                } else {
                    this._translateNotesToEDO(newEDO);
                }
            }
            this._activeEDO = newEDO;

            this._rebuildWheel(newEDO);
            const tName = TEMPERAMENT[key]?.name || key;
            this.textMsg(
                _(
                    isEquallyTempered(key)
                        ? `Switched to ${newEDO}-EDO tuning.`
                        : `Switched to ${tName}.`
                ),
                3000
            );

            // When switching to a non-EDO temperament, reapply the current
            // mode so notes are correctly selected in the new tuning.
            // Built-in modes (major, dorian, ...) exist across all temperaments.
            if (!isEquallyTempered(key)) {
                const mode = MUSICALMODES[this._selectedModeName];
                if (mode) {
                    const pattern = this._modeStepPattern(this._selectedModeName, null);
                    this._applyModePattern(pattern);
                } else {
                    this._selectedModeName = DEFAULTMODE;
                    const defMode = MUSICALMODES[DEFAULTMODE];
                    if (defMode) {
                        this._applyModePattern(this._modeStepPattern(DEFAULTMODE, null));
                    }
                }
            }

            // Preserve the current mode name across EDO switches.
            // _setModeName() does a reverse-lookup from the note pattern,
            // which changes when notes are translated to a different EDO.
            // Instead, use the stored mode name so it persists.
            const currentKey = keySignatureToMode(this.turtles.ithTurtle(0).singer.keySignature)[0];
            const name = currentKey + " " + _(this._selectedModeName);
            this._updateModeDisplay(name);
            if (this._nameInput) {
                this._nameInput.value = _(this._selectedModeName);
            }
            // Still sync the modename block in the workspace
            this._syncModeBlockName();

            // Only warn when going to a lesser EDO, where notes can be dropped
            // by the rounding in _translateNotesToEDO. Lesser→greater only adds
            // steps, so no message is needed.
            if (bothEqual && oldEDO > newEDO) {
                this.textMsg(
                    _(
                        `Mode remapped from ${oldEDO}-EDO to ${newEDO}-EDO. Some notes may have changed.`
                    ),
                    3000
                );
            }
        });
    }
    _rebuildWheel(edoCount) {
        this._cancelAnimations();
        this._activeEDO = edoCount;
        this._undoStack = []; // Clear stale undo entries from old EDO
        // Only map EDO to a built-in temperament key when the active
        // temperament is equally tempered; non-equal temperaments (just
        // intonation, meantone, ...) keep their own key even though their
        // pitch count collides with an equal EDO.
        if (isEquallyTempered(this._activeTemperamentKey)) {
            this.logo.synth.inTemperament = this._temperamentKeyForEDO(edoCount);
        }
        this._piemenuMode();
    }

    _clearPieMenu() {
        // Remove any leftover SVG slices from the DOM before rebuilding. All
        // three wheels share one paper, so replacing the div's children
        // detaches it; the wheel refs are then dropped.
        this._meterWheelDiv.replaceChildren();
        this._modeWheel = null;
        this._noteWheel = null;
        this._playWheel = null;
    }

    _translateNotesToEDO(newEDO) {
        const n = this._activeEDO;
        if (newEDO === n) {
            return;
        }

        // Extract the interval pattern from the current selection, rescale it
        // to the new EDO, and reconstruct _selectedNotes from the result.
        const pattern = this._calculateMode();
        const rescaled = scalePatternToEDO(pattern, newEDO);

        const newSelected = this._blankNotes(newEDO);
        let pos = 0;
        for (let i = 0; i < rescaled.length; i++) {
            pos = (pos + rescaled[i]) % newEDO;
            newSelected[pos] = true;
        }

        this._selectedNotes = newSelected;
    }

    // ── Note-state helpers ────────────────────────────────────────

    /**
     * Returns a notes array of length n with only the root (index 0) selected.
     * @param {number} n - The number of steps per octave.
     * @returns {boolean[]}
     */
    _blankNotes(n) {
        const notes = new Array(n).fill(false);
        notes[0] = true;
        return notes;
    }

    /**
     * Returns a notes array of length newEDO, preserving old notes that fit.
     * Index 0 (the root) is always selected.
     * @param {boolean[]} oldNotes
     * @param {number} newEDO
     * @returns {boolean[]}
     */
    _reconcileNotes(oldNotes, newEDO) {
        const notes = this._blankNotes(newEDO);
        if (Array.isArray(oldNotes)) {
            for (let i = 1; i < Math.min(oldNotes.length, newEDO); i++) {
                if (oldNotes[i]) {
                    notes[i] = true;
                }
            }
        }
        return notes;
    }

    // ── EDO cache helpers ─────────────────────────────────────────

    _cacheState(edo) {
        this._edoNoteCache[edo] = this._selectedNotes.slice();
    }

    _restoreState(edo) {
        this._selectedNotes = this._edoNoteCache[edo].slice();
        this._activeEDO = edo;
    }

    // ── Modes dropdown helpers ────────────────────────────────────

    _saveCustomModesList(modes) {
        try {
            localStorage.setItem("customModes", JSON.stringify(modes));
            return true;
        } catch (e) {
            this.errorMsg(
                _("Could not save the custom mode. Local storage is full or unavailable.")
            );
            return false;
        }
    }

    _saveCustomMode(name, pattern) {
        const modes = getSavedCustomModes();
        const existing = modes.findIndex(m => m.name === name);
        // Refuse to overwrite a built-in mode; only registered customs may be updated.
        // Check case-insensitively against built-in modes (which are all lowercase),
        // but allow case-sensitive updates to existing custom modes via `existing`.
        if (existing < 0) {
            const customNamesLower = new Set(modes.map(m => m.name.toLowerCase()));
            const isBuiltIn = Object.keys(MUSICALMODES).some(
                k =>
                    k.toLowerCase() === name.toLowerCase() && !customNamesLower.has(k.toLowerCase())
            );
            if (isBuiltIn) {
                this.errorMsg(_("Cannot overwrite built-in mode: ") + name);
                return false;
            }
        }
        const entry = { name, pattern, edo: this._activeEDO };
        if (existing >= 0) {
            modes[existing] = entry;
        } else {
            modes.push(entry);
        }
        if (!this._saveCustomModesList(modes)) {
            return false;
        }

        MUSICALMODES[name] = pattern;
        if (name !== name.toLowerCase()) {
            MUSICALMODES[name.toLowerCase()] = pattern;
        }
        return true;
    }

    _deleteCustomMode(name) {
        const modes = getSavedCustomModes();
        const filtered = modes.filter(m => m.name !== name);
        this._saveCustomModesList(filtered);

        delete MUSICALMODES[name];
        if (name !== name.toLowerCase()) {
            delete MUSICALMODES[name.toLowerCase()];
        }
    }

    _getModeEDO(modeName) {
        // Saved custom modes carry their native EDO in the registry.
        const custom = getSavedCustomModes().find(m => m.name === modeName);
        return custom && custom.edo ? custom.edo : null;
    }

    // ── Bottom control bar ────────────────────────────────────────

    _buildControlBar() {
        const table = docById("modeTable");
        const barRow = table.insertRow();
        const barCell = barRow.insertCell();
        barCell.colSpan = 18;

        const bar = document.createElement("div");
        bar.style.display = "flex";
        bar.style.flexWrap = "wrap";
        bar.style.alignItems = "center";
        bar.style.justifyContent = "center";
        bar.style.gap = "8px";
        bar.style.padding = "6px 16px";

        // Icon button with MB theme styling (wfbtItem class).
        const iconButton = (icon, label, onclick, imgFilter) => {
            const btn = document.createElement("div");
            btn.className = "wfbtItem";
            btn.title = label;
            btn.setAttribute("role", "button");
            btn.setAttribute("aria-label", label);
            btn.setAttribute("tabindex", "0");
            btn.style.flexShrink = "0";
            btn.style.display = "flex";
            btn.style.alignItems = "center";
            btn.style.justifyContent = "center";
            btn.style.padding = "4px";
            btn.style.borderRadius = "6px";
            const img = document.createElement("img");
            img.src = `header-icons/${icon}`;
            img.alt = label;
            img.height = 24;
            img.width = 24;
            if (imgFilter) img.style.filter = imgFilter;
            btn.appendChild(img);
            btn.onclick = onclick;
            return btn;
        };

        // EDO/Tuning — transparent select overlay on top of the icon.
        // The select is full-size but invisible; it IS the click target.
        const tuningIcon = iconButton("menu-button.svg", _("temperament"), null);
        // Transparent select overlay — IS the click target; the icon behind
        // it is purely decorative.
        const edoSelect = document.createElement("select");
        edoSelect.id = "edoSelect";
        this._edoSelect = edoSelect;
        this._initEdoSelect(edoSelect);
        this._wireEdoSelect(edoSelect);
        edoSelect.title = _("temperament");
        edoSelect.setAttribute("aria-label", _("temperament"));
        Object.assign(edoSelect.style, {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
            cursor: "pointer",
            zIndex: 1,
            border: "none",
            background: "transparent",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            outline: "none",
            boxShadow: "none"
        });

        const tuningGroup = document.createElement("div");
        tuningGroup.style.position = "relative";
        tuningGroup.style.display = "inline-flex";
        tuningGroup.style.alignItems = "center";
        tuningGroup.style.flexShrink = "0";
        tuningGroup.appendChild(tuningIcon);
        tuningGroup.appendChild(edoSelect);

        // Modes: open piemenu instead of a <select> dropdown
        const modeBtn = iconButton("pie-chart.svg", _("Switch mode"), () => {
            this._onModePieButtonClick();
        });
        modeBtn.id = "modeSelectBtn";

        // Mode name input (kept narrow so the row fits on one line)
        const nameInput = document.createElement("input");
        this._nameInput = nameInput;
        nameInput.id = "customModeName";
        nameInput.type = "text";
        nameInput.placeholder = _("Mode name");
        nameInput.style.width = "100px";
        nameInput.style.minWidth = "80px";
        nameInput.style.flexShrink = "1";

        // Save button
        const saveBtn = iconButton("save-button.svg", _("Save"), () => {
            const name = nameInput.value.trim();
            if (!name) {
                this.errorMsg(_("Please enter a mode name."));
                return;
            }
            const pattern = this._calculateMode();
            if (!this._saveCustomMode(name, pattern)) {
                return;
            }
            this._selectedModeName = name;
            // Export the mode to the workspace blocks so the user can use it.
            this._setModeName();
            this._save();
            this.textMsg(_("Mode saved: ") + name, 3000);
        });

        // Delete button
        const deleteBtn = iconButton("delete.svg", _("Delete"), () => {
            const name = this._selectedModeName;
            if (!name) {
                this.errorMsg(_("No mode selected."));
                return;
            }
            const customs = getSavedCustomModes();
            if (!customs.some(m => m.name === name)) {
                this.errorMsg(_("Cannot delete a built-in mode."));
                return;
            }
            this._deleteCustomMode(name);
            this._selectedModeName = DEFAULTMODE;
            // Reset a modename block still referencing the deleted mode.
            if (this._modeBlock !== null) {
                const modeBlock = this.blocks.blockList[this._modeBlock];
                if (modeBlock && modeBlock.name === "modename" && modeBlock.value === name) {
                    modeBlock.value = DEFAULTMODE;
                    modeBlock.text.text = _(DEFAULTMODE);
                    modeBlock.updateCache();
                    this.refreshCanvas();
                }
            }
            // Re-evaluate the mode name from the current pattern; if it no
            // longer matches the deleted mode, the label clears.
            this._setModeName();
            this.textMsg(_("Mode deleted: ") + name, 3000);
        });

        bar.appendChild(tuningGroup);
        bar.appendChild(modeBtn);
        bar.appendChild(nameInput);
        bar.appendChild(saveBtn);
        bar.appendChild(deleteBtn);

        barCell.appendChild(bar);
    }

    // ── Scaling ───────────────────────────────────────────────────

    _scale() {
        const windowHeight =
            this.getWidgetFrame().offsetHeight - this.getDragElement().offsetHeight;
        const widgetBody = this.getWidgetBody();
        const scale = this.isMaximized() ? windowHeight / widgetBody.offsetHeight : 1;
        widgetBody.style.display = "flex";
        widgetBody.style.flexDirection = "column";
        widgetBody.style.alignItems = "center";
        widgetBody.children[0].style.display = "flex";
        widgetBody.children[0].style.flexDirection = "column";
        widgetBody.children[0].style.alignItems = "center";

        // When the mode piemenu is open, scale the global wheelDiv SVG;
        // otherwise scale the note-wheel SVG.
        const svgContainer = this._modePiemenuOpen ? docById("wheelDiv") : this._meterWheelDiv;
        const svg = svgContainer.querySelector("svg");
        if (!svg) {
            return;
        }
        svg.style.pointerEvents = "none";
        svg.setAttribute("height", `${ModeWidget.WHEELSIZE * scale}px`);
        svg.setAttribute("width", `${ModeWidget.WHEELSIZE * scale}px`);
        this._setTimeout(() => {
            svg.style.pointerEvents = "auto";
        }, 100);
    }

    // ── Mode step resolver (Task 4) ───────────────────────────────

    /**
     * Single source of truth for wheel geometry: which integer step pattern
     * represents `modeName` on this widget right now. Custom modes win
     * (as-authored), then ratio-derived steps under a non-EDO temperament,
     * then the standard EDO-rescaled pattern.
     * @param {String} modeName - mode name in MUSICALMODES
     * @param {Array} nativePattern - as-authored pattern for saved custom modes
     * @returns {Array} integer step counts
     */
    _modeStepPattern(modeName, nativePattern) {
        if (Array.isArray(nativePattern)) {
            return nativePattern;
        }
        if (isNonEDO(this._activeTemperamentKey)) {
            const steps = getNonEDOModeSteps(modeName, this._activeTemperamentKey);
            if (steps) {
                return steps;
            }
        }
        return getModePattern(modeName, this._activeEDO);
    }

    // ── Mode display ──────────────────────────────────────────────

    _setMode() {
        // Read in the current mode to start.
        const currentModeName = keySignatureToMode(this.turtles.ithTurtle(0).singer.keySignature);
        const currentMode = MUSICALMODES[currentModeName[1]];
        if (!currentMode) {
            return;
        }

        const nativeEDO = this._getModeEDO(currentModeName[1]);
        if (nativeEDO && nativeEDO !== this._activeEDO) {
            // Custom mode saved at a different EDO — rebuild the wheel to
            // match its native tuning before applying the pattern.
            // edoSelect is null here (built later); _loadMode handles that.
            this._loadMode(currentModeName[1], currentMode, null);
        } else {
            this._applyModePattern(
                nativeEDO ? currentMode : this._modeStepPattern(currentModeName[1], null)
            );
            this._setModeName();
        }
    }

    _loadMode(modeName, mode, edoSelect) {
        const nativeEDO = this._getModeEDO(modeName);
        if (nativeEDO && nativeEDO !== this._activeEDO) {
            // The saved mode was authored in a different tuning, so sync the
            // tuning dropdown and rebuild the wheel before selecting intervals.
            // Cache the outgoing state exactly like the dropdown handler so
            // round-trips restore it losslessly.
            const oldEDO = this._activeEDO;
            this._cacheState(oldEDO);
            if (edoSelect) {
                // The dropdown may lack an option for an unusual native EDO
                // (e.g. 21 from 1/4 comma meantone); add it so .value sticks.
                if (!edoSelect.querySelector(`option[value="${nativeEDO}"]`)) {
                    const opt = document.createElement("option");
                    opt.value = nativeEDO;
                    opt.textContent = nativeEDO + "-EDO";
                    edoSelect.appendChild(opt);
                }
                edoSelect.value = nativeEDO;
            }
            this._rebuildWheel(nativeEDO);
            this.textMsg(
                _(
                    `Mode ${modeName} is ${nativeEDO}-EDO; tuning switched from ${oldEDO}-EDO to ${nativeEDO}-EDO.`
                ),
                3000
            );
        }
        // Built-in mode patterns are resolved via _modeStepPattern so
        // non-EDO temperaments use ratio-derived steps. Custom modes carry
        // EDO-specific patterns already, so use the passed mode directly.
        const isCustom = !MUSICALMODES[modeName];
        const pattern = isCustom ? mode : nativeEDO ? mode : this._modeStepPattern(modeName, null);
        this._applyModePattern(pattern);
        // Cache the incoming state so switching away and back preserves it.
        if (nativeEDO) {
            this._cacheState(nativeEDO);
        }
        this._setModeName();
    }

    _applyModePattern(pattern) {
        const n = this._activeEDO;
        this._selectedNotes = this._blankNotes(n);

        let pos = 0;
        for (let k = 0; k < pattern.length && pos < n; k++) {
            this._selectedNotes[pos] = true;
            pos += pattern[k];
        }

        for (let i = 0; i < n; i++) {
            if (this._selectedNotes[i]) {
                this._noteWheel.navItems[i].navItem.show();
            } else {
                this._noteWheel.navItems[i].navItem.hide();
            }
        }
    }

    // ── Invert ────────────────────────────────────────────────────

    _invert() {
        if (this._locked) {
            return;
        }

        this._locked = true;
        this._saveState();
        this.__invertOnePair(1);
    }

    __invertOnePair(i) {
        const n = this._activeEDO;
        const tmp = this._selectedNotes[i];
        this._selectedNotes[i] = this._selectedNotes[n - i];
        this._selectedNotes[n - i] = tmp;

        if (this._selectedNotes[i]) {
            this._noteWheel.navItems[i].navItem.show();
        } else {
            this._noteWheel.navItems[i].navItem.hide();
        }

        if (this._selectedNotes[n - i]) {
            this._noteWheel.navItems[n - i].navItem.show();
        } else {
            this._noteWheel.navItems[n - i].navItem.hide();
        }

        if (i === Math.floor((n - 1) / 2)) {
            this._saveState();
            this._setModeName();
            this._locked = false;
        } else {
            this._setTimeout(() => {
                this.__invertOnePair(i + 1);
            }, ModeWidget.ROTATESPEED);
        }
    }

    // ── Reset ─────────────────────────────────────────────────────

    _resetNotes() {
        for (let i = 0; i < this._selectedNotes.length; i++) {
            if (this._selectedNotes[i]) {
                this._noteWheel.navItems[i].navItem.show();
            } else {
                this._noteWheel.navItems[i].navItem.hide();
            }
            this._playWheel.navItems[i].navItem.hide();
        }
    }

    /**
     * Resets the note wheel to a blank custom mode (only the root note
     * selected) so the user can define a new mode by clicking notes.
     * @returns {void}
     */
    _resetToCustom() {
        this._saveState();
        this._selectedNotes = this._blankNotes(this._activeEDO);
        this._resetNotes();
        this._updateModeDisplay("");
    }

    // ── Rotate ────────────────────────────────────────────────────

    _rotateRight() {
        if (this._locked) {
            return;
        }
        this._locked = true;
        this._saveState();
        const n = this._activeEDO;
        this._newPattern = [];
        this._newPattern.push(this._selectedNotes[n - 1]);
        for (let i = 0; i < n - 1; i++) {
            this._newPattern.push(this._selectedNotes[i]);
        }
        this.__rotateRightOneCell(1);
    }

    __rotateRightOneCell(i) {
        this._selectedNotes[i] = this._newPattern[i];
        if (this._selectedNotes[i]) {
            this._noteWheel.navItems[i].navItem.show();
        } else {
            this._noteWheel.navItems[i].navItem.hide();
        }

        if (i === 0) {
            this._setTimeout(() => {
                if (this._selectedNotes[0]) {
                    this._saveState();
                    this._setModeName();
                    this._locked = false;
                } else {
                    this._locked = false;
                    this._rotateRight();
                }
            }, ModeWidget.ROTATESPEED);
        } else {
            this._setTimeout(() => {
                this.__rotateRightOneCell((i + 1) % this._activeEDO);
            }, ModeWidget.ROTATESPEED);
        }
    }

    _rotateLeft() {
        if (this._locked) {
            return;
        }

        this._locked = true;
        this._saveState();
        const n = this._activeEDO;
        this._newPattern = [];
        for (let i = 1; i < n; i++) {
            this._newPattern.push(this._selectedNotes[i]);
        }
        this._newPattern.push(this._selectedNotes[0]);
        this.__rotateLeftOneCell(n - 1);
    }

    __rotateLeftOneCell(i) {
        this._selectedNotes[i] = this._newPattern[i];
        if (this._selectedNotes[i]) {
            this._noteWheel.navItems[i].navItem.show();
        } else {
            this._noteWheel.navItems[i].navItem.hide();
        }

        if (i === 0) {
            this._setTimeout(() => {
                if (this._selectedNotes[0]) {
                    this._saveState();
                    this._setModeName();
                    this._locked = false;
                } else {
                    this._locked = false;
                    this._rotateLeft();
                }
            }, ModeWidget.ROTATESPEED);
        } else {
            this._setTimeout(() => {
                this.__rotateLeftOneCell(i - 1);
            }, ModeWidget.ROTATESPEED);
        }
    }

    // ── Play ──────────────────────────────────────────────────────

    _playAll() {
        if (this._locked) {
            return;
        }

        this.logo.synth.stop();
        this._locked = true;

        const n = this._activeEDO;
        this._notesToPlay = [];
        for (let i = 0; i < n; i++) {
            if (this._selectedNotes[i]) {
                this._notesToPlay.push(i);
            }
        }

        this._notesToPlay.push(n);
        for (let i = n - 1; i > -1; i--) {
            if (this._selectedNotes[i]) {
                this._notesToPlay.push(i);
            }
        }

        this._lastNotePlayed = null;
        if (this._playing) {
            this.__playNextNote(0);
        }
    }

    __playNextNote(i) {
        const n = this._activeEDO;
        const time = this._noteValue + 0.125;

        if (i > this._notesToPlay.length - 1) {
            this._setTimeout(() => {
                this._playing = false;
                this._setPlayButtonIcon("play-button.svg", _("Play all"));
                this._resetNotes();
                this._locked = false;
            }, 1000 * time);
            return;
        }

        this._setTimeout(() => {
            if (this._lastNotePlayed !== null) {
                this._playWheel.navItems[this._lastNotePlayed % n].navItem.hide();
            }

            const note = this._notesToPlay[i];
            this._playWheel.navItems[note % n].navItem.show();
            this._lastNotePlayed = note;

            this._triggerNote(note, n);
            if (this._playing) {
                this.__playNextNote(i + 1);
            } else {
                this._locked = false;
                this._setTimeout(() => this._resetNotes(), ModeWidget.RESET_NOTES_DELAY);
            }
        }, 1000 * time);
    }

    _triggerNote(note, edo) {
        const ks = this.turtles.ithTurtle(0).singer.keySignature;

        const result = getNonEDOFrequency(note, 4, this._activeTemperamentKey, ks);
        if (result) {
            this.logo.synth.trigger(0, result.freq, this._noteValue, DEFAULTVOICE, null, null);
            return;
        }

        if (edo === 12) {
            const noteToPlay = getNote(this._pitch, 4, note, ks, false, null, this.errorMsg);
            this.logo.synth.trigger(
                0,
                normalizeNoteAccidentals(noteToPlay[0]) + noteToPlay[1],
                this._noteValue,
                DEFAULTVOICE,
                null,
                null
            );
        } else {
            // Use the active temperament directly: _temperamentKeyForEDO maps a
            // non-EDO pitch count to an EQUAL temperament (19 -> equal19), which
            // would play the wrong tuning. ponytail: _activeTemperamentKey always
            // holds the real temperament (equal or ratio-based).
            const freq = pitchToFrequency(
                this._pitch,
                4,
                Math.round(note * (1200 / edo)),
                ks,
                this._activeTemperamentKey
            );
            this.logo.synth.trigger(0, freq, this._noteValue, DEFAULTVOICE, null, null);
        }
    }

    _playNote(i) {
        this._triggerNote(i, this._activeEDO);
    }

    // ── Undo / Clear ──────────────────────────────────────────────

    _saveState() {
        const state = JSON.stringify(this._selectedNotes);
        if (state !== last(this._undoStack)) {
            this._undoStack.push(state);
        }
    }

    _undo() {
        if (this._undoStack.length > 0) {
            const prevState = JSON.parse(this._undoStack.pop());
            for (let i = 0; i < this._activeEDO; i++) {
                this._selectedNotes[i] = prevState[i];
            }
            this._selectedNotes[0] = true;
            this._resetNotes();
            this._setModeName();
        }
    }

    _clear() {
        this._saveState();
        for (let i = 1; i < this._activeEDO; i++) {
            this._selectedNotes[i] = false;
        }
        this._resetNotes();
        this._setModeName();
    }

    // ── Mode calculation ──────────────────────────────────────────

    _calculateMode() {
        const n = this._activeEDO;
        const currentMode = [];
        let j = 1;
        for (let i = 1; i < n; i++) {
            if (this._selectedNotes[i]) {
                currentMode.push(j);
                j = 1;
            } else {
                j += 1;
            }
        }
        currentMode.push(j);
        return currentMode;
    }

    _setModeName() {
        const currentMode = JSON.stringify(this._calculateMode());
        const currentKey = keySignatureToMode(this.turtles.ithTurtle(0).singer.keySignature)[0];
        const customNames = new Set(getSavedCustomModes().map(m => m.name));

        // Check custom modes first — they take priority over built-in modes
        // when patterns match, since they are EDO-specific.
        let matchedMode = null;
        for (const mode of customNames) {
            if (!(mode in MUSICALMODES)) {
                continue;
            }
            const pattern = MUSICALMODES[mode];
            if (JSON.stringify(pattern) === currentMode) {
                matchedMode = mode;
                break;
            }
        }

        // If no custom mode matched, check built-in modes.
        if (!matchedMode) {
            for (const mode in MUSICALMODES) {
                if (customNames.has(mode)) {
                    continue;
                }
                const pattern = this._modeStepPattern(mode, null);
                if (JSON.stringify(pattern) === currentMode) {
                    matchedMode = mode;
                    break;
                }
            }
        }
        if (matchedMode) {
            this._selectedModeName = matchedMode;
            if (this._modeBlock !== null) {
                // Only update the modename block connected to the widget's
                // setkey2 block, plus its sibling notename block.
                const modeBlock = this.blocks.blockList[this._modeBlock];
                if (modeBlock && modeBlock.name === "modename") {
                    modeBlock.value = matchedMode;
                    modeBlock.text.text = _(matchedMode);
                    modeBlock.updateCache();

                    const parent = this.blocks.blockList[modeBlock.connections[0]];
                    const notenameBlock =
                        parent?.name === "setkey2" && this.blocks.blockList[parent.connections[1]];
                    if (notenameBlock?.name === "notename") {
                        notenameBlock.value = currentKey;
                        notenameBlock.text.text = _(currentKey);
                        notenameBlock.updateCache();
                    }
                }
                this.refreshCanvas();
            }

            const name = currentKey + " " + _(matchedMode);
            if (this._nameInput) {
                this._nameInput.value = _(matchedMode);
            }
            this._updateModeDisplay(name);
            return;
        }

        this._updateModeDisplay("");
        if (this._nameInput) {
            this._nameInput.value = "";
        }
    }

    // ── Block sync ────────────────────────────────────────────────

    /**
     * Sync the modename block in the workspace with the stored mode name.
     * Called after EDO switches to keep the block value consistent with
     * the widget display, without re-deriving the name from the (possibly
     * translated) note pattern.
     */
    _syncModeBlockName() {
        if (this._modeBlock === null) {
            return;
        }
        const modeBlock = this.blocks.blockList[this._modeBlock];
        if (modeBlock && modeBlock.name === "modename") {
            modeBlock.value = this._selectedModeName;
            modeBlock.text.text = _(this._selectedModeName);
            modeBlock.updateCache();
        }
        this.refreshCanvas();
    }

    _updateModeDisplay(name) {
        this._modeLabelCell.textContent = name;
        this.widgetWindow.updateTitle(name);
    }

    // ── Save / export ─────────────────────────────────────────────

    /**
     * Register a dynamic equal-temperament entry for an EDO that has no
     * built-in TEMPERAMENT entry, so getCurrentEDO() returns the correct
     * pitch count during playback.
     * @param {number} edo - Equal divisions of the octave
     * @returns {string} The temperament key (e.g. "equal41")
     */
    _ensureTempKey(edo) {
        const key = "equal" + edo;
        if (!TEMPERAMENT[key]) {
            TEMPERAMENT[key] = {
                isEDO: true,
                edo,
                name: edo + "-EDO Equal",
                description: edo + " Equal Divisions of the Octave",
                ratios: Array.from({ length: edo + 1 }, (_, i) => Math.pow(2, i / edo)),
                octaveRatio: 2,
                generator: null,
                pitchNumber: edo
            };
        }
        return key;
    }

    _temperamentKeyForEDO(edo) {
        const map = {
            5: "equal5",
            7: "equal7",
            12: "equal",
            17: "equal17",
            19: "equal19",
            21: "1/4 comma meantone",
            31: "equal31"
        };
        if (map[edo]) {
            return map[edo];
        }
        return this._ensureTempKey(edo);
    }

    _pitchNameAndOctave(j) {
        if (this._activeEDO === 12) {
            // Movable-do solfege relative to the key signature (matches playback).
            return [NOTESTABLE[(j + 1) % 12], 4];
        }
        const [name, octave] = numberToPitch(j, this._activeTemperamentKey, "A", 0, this.activity);
        // numberToPitch can return [undefined, NaN] when the temperament's
        // per-note data is incomplete (e.g. the built-in "custom" entry or a
        // saved custom temperament without octave digits). Fall back to the
        // deterministic name/octave used by numberToPitch's true-EDO branch.
        if (typeof octave !== "number" || isNaN(octave) || !name) {
            const edoNames = generateNoteNames(this._activeEDO);
            let aIndex = edoNames.indexOf("A");
            if (aIndex === -1) {
                aIndex = Math.round((9 / 12) * this._activeEDO);
            }
            const nameIndex =
                (((j + aIndex) % this._activeEDO) + this._activeEDO) % this._activeEDO;
            return [edoNames[nameIndex], Math.floor((j + aIndex) / this._activeEDO) + 4];
        }
        return [name, octave + 4];
    }

    _save() {
        const n = this._activeEDO;
        const label = this._modeLabelCell.textContent;
        const modeName = label && label !== "\u00a0" ? label : _("custom");

        // Save a stack of pitches to be used with the matrix.
        let newStack = [
            [0, ["action", { collapsed: true }], 150, 100, [null, 1, 2, null]],
            [1, ["text", { value: modeName }], 0, 0, [0]]
        ];
        let previousBlock = 0;
        const modeLength = this._calculateMode().length;
        let p = 0;

        for (let i = 0; i < n; i++) {
            // Reverse the order so that Do is last.
            const j = n - 1 - i;
            if (!this._selectedNotes[j]) {
                continue;
            }
            p += 1;
            const [pitch, octave] = this._pitchNameAndOctave(j);
            const pitchidx = newStack.length;
            const notenameidx = pitchidx + 1;
            const octaveidx = pitchidx + 2;

            if (p === modeLength) {
                newStack.push([
                    pitchidx,
                    "pitch",
                    0,
                    0,
                    [previousBlock, notenameidx, octaveidx, null]
                ]);
            } else {
                newStack.push([
                    pitchidx,
                    "pitch",
                    0,
                    0,
                    [previousBlock, notenameidx, octaveidx, pitchidx + 3]
                ]);
            }
            newStack.push([notenameidx, ["solfege", { value: pitch }], 0, 0, [pitchidx]]);
            newStack.push([octaveidx, ["number", { value: octave }], 0, 0, [pitchidx]]);
            previousBlock = pitchidx;
        }

        this.blocks.loadNewBlocks(newStack);
        this.textMsg(_("New action block generated."), 3000);

        // And save a stack of pitchnumbers to be used with the define mode.
        newStack = [
            [0, ["definemode", { collapsed: true }], 150, 150, [null, 1, 3, 2]],
            [1, ["text", { value: modeName }], 0, 0, [0]],
            [2, "hidden", 0, 0, [0, null]]
        ];
        previousBlock = 0;
        p = 0;

        for (let i = 0; i < n; i++) {
            if (!this._selectedNotes[i]) {
                continue;
            }
            p += 1;
            const idx = newStack.length;
            if (p === modeLength) {
                newStack.push([idx, "pitchnumber", 0, 0, [previousBlock, idx + 1, null]]);
            } else {
                newStack.push([idx, "pitchnumber", 0, 0, [previousBlock, idx + 1, idx + 2]]);
            }
            newStack.push([idx + 1, ["number", { value: i }], 0, 0, [idx]]);
            previousBlock = idx;
        }

        this._setTimeout(() => {
            this.blocks.loadNewBlocks(newStack);
        }, 2000);
    }

    _piemenuMode() {
        const n = this._activeEDO;

        // Explicitly clear any existing wheels and leftover SVG slices before
        // rendering with the current EDO count.
        this._clearPieMenu();

        // Only the piemenu open/close methods toggle these divs; a rebuild must
        // not re-show the note wheel while the mode piemenu is open.
        if (!this._modePiemenuOpen) {
            this._meterWheelDiv.style.display = "";
        }

        this._modeWheel = new wheelnav(
            "modeWidgetWheelDiv",
            null,
            ModeWidget.WHEELSIZE,
            ModeWidget.WHEELSIZE
        );
        this._noteWheel = new wheelnav("_noteWheel", this._modeWheel.raphael);
        this._playWheel = new wheelnav("_playWheel", this._modeWheel.raphael);

        wheelnav.cssMeter = true;

        this._createModeWheel(n);
        this._createNoteWheel(n);
        this._createPlayWheel(n);
        this._wireWheelEvents(n);
    }

    _createModeWheel(n) {
        const titleFontSize = Math.min(
            ModeWidget.MAX_TITLE_FONT_SIZE,
            Math.max(ModeWidget.MIN_TITLE_FONT_SIZE, Math.floor(ModeWidget.TITLE_FONT_SCALE / n))
        );
        configureWheel(this._modeWheel, {
            colors: platformColor.modeWheelcolors,
            minRadius: 0.4,
            maxRadius: 0.75,
            clickModeRotate: false,
            selectionPaths: true,
            titleFont: "400 " + titleFontSize + "px sans-serif"
        });
        this._modeWheel.createWheel(Array.from({ length: n }, (_, i) => String(i)));
    }

    _createNoteWheel(n) {
        configureWheel(this._noteWheel, {
            colors: platformColor.noteValueWheelcolors,
            minRadius: 0.75,
            maxRadius: 0.9,
            clickModeRotate: false,
            selectionPaths: true,
            titleRotateAngle: 90
        });

        // Reconcile selectedNotes: preserve existing, ensure index 0 is always true
        this._selectedNotes = this._reconcileNotes(this._selectedNotes, n);

        // Slice 0: blank (no X toggle — root is always selected)
        // Slices 1..n-1: "x" toggle (dynamic EDO layout)
        this._noteWheel.createWheel([" ", ...new Array(n - 1).fill("x")]);
    }

    _createPlayWheel(n) {
        configureWheel(this._playWheel, {
            colors: [platformColor.orange],
            minRadius: 0.3,
            maxRadius: 0.4,
            clickModeRotate: false,
            selectionPaths: true,
            titleRotateAngle: 90
        });

        this._playWheel.createWheel(new Array(n).fill(" "));

        for (let i = 0; i < n; i++) {
            this._playWheel.navItems[i].navItem.hide();
        }
    }

    _wireWheelEvents(n) {
        const __setNote = () => {
            const i = this._modeWheel.selectedNavItemIndex;
            if (i === 0) {
                return;
            }
            this._saveState();
            this._selectedNotes[i] = true;
            this._noteWheel.navItems[i].navItem.show();
            this._playNote(i);
            this._setModeName();
        };

        const __clearNote = () => {
            const i = this._noteWheel.selectedNavItemIndex;
            if (i === 0) {
                return; // Root note cannot be deselected
            }
            this._noteWheel.navItems[i].navItem.hide();
            this._saveState();
            this._selectedNotes[i] = false;
            this._setModeName();
        };

        for (let i = 0; i < n; i++) {
            this._modeWheel.navItems[i].navigateFunction = __setNote;
            this._noteWheel.navItems[i].navigateFunction = __clearNote;
            this._noteWheel.navItems[i].navItem.hide();
        }

        // Restore visual state
        for (let i = 0; i < n; i++) {
            if (this._selectedNotes[i]) {
                this._noteWheel.navItems[i].navItem.show();
            }
        }
    }

    _onModePieButtonClick() {
        if (this._modePiemenuOpen) {
            this._closeModePiemenu();
            return;
        }
        this._piemenuModes();
    }

    /**
     * Opens the standard mode piemenu (same as the modeName block piemenu)
     * via piemenus.js piemenuModes on the global wheelDiv. The intercept
     * on block.__selectionChanged applies the selected mode to the scalar
     * builder via _loadMode.
     * @returns {void}
     */
    _piemenuModes() {
        if (this._modePiemenuOpen) return;
        this._modePiemenuOpen = true;

        // Hide the note wheel while the mode piemenu is visible.
        this._meterWheelDiv.style.display = "none";

        const widget = this;
        const mockBlock = {
            value: this._selectedModeName,
            text: { text: "" },
            container: {
                x: 200,
                y: 200,
                setChildIndex: () => {},
                children: { length: 1 }
            },
            updateCache: () => {},
            blocks: {
                stageClick: false,
                blockScale: 1,
                turtles: this.turtles,
                blockList: {}
            },
            activity: this.activity,
            connections: [null]
        };
        this._mockBlock = mockBlock;

        // Delegate to the standard piemenuModes.
        piemenuModes(mockBlock, this._selectedModeName);

        // piemenuModes wires block.__selectionChanged; override it AFTER
        // so our intercept runs on mode selection. The original updates
        // block.value/text, which we then read to apply the mode.
        const __origSelectionChanged = mockBlock.__selectionChanged;
        mockBlock.__selectionChanged = () => {
            if (typeof __origSelectionChanged === "function") {
                __origSelectionChanged();
            }
            const modeName = mockBlock.value;
            if (modeName) {
                widget._selectedModeName = modeName;
                // Built-in modes are in MUSICALMODES; custom modes carry
                // their own EDO-specific pattern in localStorage.
                const mode = MUSICALMODES[modeName];
                const custom = getSavedCustomModes().find(m => m.name === modeName);
                const pattern = mode || (custom && custom.pattern);
                if (pattern) {
                    widget._closeModePiemenu();
                    widget._loadMode(modeName, pattern, widget._edoSelect);
                }
            }
        };

        // Position wheelDiv over the ModeWidget.
        const wheelDiv = docById("wheelDiv");
        if (wheelDiv && this.widgetWindow && this.widgetWindow._frame) {
            const wRect = this.widgetWindow._frame.getBoundingClientRect();
            const pieRadius = 600;
            wheelDiv.style.left =
                Math.max(0, Math.round(wRect.left + wRect.width / 2 - pieRadius)) + "px";
            wheelDiv.style.top =
                Math.max(0, Math.round(wRect.top + wRect.height / 2 - pieRadius)) + "px";
        }

        // Override × exit to also restore the note wheel.
        if (mockBlock._exitWheel && mockBlock._exitWheel.navItems[0]) {
            const origExit = mockBlock._exitWheel.navItems[0].navigateFunction;
            mockBlock._exitWheel.navItems[0].navigateFunction = () => {
                if (origExit) origExit();
                widget._meterWheelDiv.style.display = "";
                widget._modePiemenuOpen = false;
                widget._mockBlock = null;
            };
        }
    }

    /**
     * Closes the mode piemenu and restores the note-edit wheel.
     * @returns {void}
     */
    _closeModePiemenu() {
        if (this._mockBlock) {
            if (this._mockBlock._modeNameWheel) {
                this._mockBlock._modeNameWheel.removeWheel();
            }
            if (this._mockBlock._modeWheel) {
                this._mockBlock._modeWheel.removeWheel();
            }
        }

        const wheelDiv = docById("wheelDiv");
        if (wheelDiv) {
            wheelDiv.style.display = "none";
        }

        this._meterWheelDiv.style.display = "";
        this._modePiemenuOpen = false;
        this._mockBlock = null;
    }
}

if (typeof module !== "undefined") {
    module.exports = ModeWidget;
}
