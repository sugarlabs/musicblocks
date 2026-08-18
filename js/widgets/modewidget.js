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
   getNote, DEFAULTVOICE, last, NOTESTABLE, slicePath, wheelnav,
   normalizeNoteAccidentals, getCurrentEDO, getModePattern, DEFAULTMODE,
   numberToPitch, pitchToFrequency, MODE_PIE_MENUS, TEMPERAMENT, generateNoteNames,
   getSavedCustomModes, getModeNamesForGroup, getModeLabel, getModeNameFromLabel,
   getModeSliceColors, updateModeWheelItems, getModeGroupTitleFont, getModeSliceFont,
   configureWheel, MODEPIEMENU_GROUP_RING, MODEPIEMENU_NAME_RING
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
        this._edoNoteCache = {};
        // Non-EDO temperaments (just intonation, Pythagorean, meantone) are
        // mapped to their pitch count by getCurrentEDO. The widget operates on
        // that count, and changing the tuning below replaces the temperament.
        this._activeEDO = getCurrentEDO(this.logo.synth.inTemperament);
        this._selectedModeName = "major";
        this._modePiemenuOpen = false;
        this._suppressModeSelect = false;

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

        // The mode-selection piemenu renders on its own div/paper so it never
        // shares an SVG with the note-edit wheel (which would block its clicks).
        const modePiemenuDiv = document.createElement("div");
        modePiemenuDiv.id = "modePiemenuDiv";
        modePiemenuDiv.style.display = "none";

        const modeTable = document.createElement("table");
        modeTable.id = "modeTable";

        this.modeTableDiv.replaceChildren(meterWheelDiv, modePiemenuDiv, modeTable);
        this._meterWheelDiv = meterWheelDiv;
        this._modePiemenuDiv = modePiemenuDiv;
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
            value: t.edo,
            label: t.label,
            temperamentKey: t.key
        }));

        if (!options.some(o => o.temperamentKey === inTemperament)) {
            options.unshift({
                value: this._activeEDO,
                label: this._activeEDO + "-EDO",
                temperamentKey: inTemperament
            });
        }

        return options;
    }

    _initEdoSelect(select) {
        const inEDO = this._activeEDO;
        const inTemperament = this.logo.synth.inTemperament;
        for (const o of this._edoOptions()) {
            const opt = document.createElement("option");
            opt.value = o.value;
            opt.textContent = o.label;
            if (o.value === inEDO || o.temperamentKey === inTemperament) {
                opt.selected = true;
            }
            select.appendChild(opt);
        }
    }
    _wireEdoSelect(select) {
        select.addEventListener("change", () => {
            const newEDO = parseInt(select.value, 10);
            if (isNaN(newEDO) || newEDO < 5 || newEDO > 55 || newEDO === this._activeEDO) {
                return;
            }

            // Warn (but don't block) before replacing a non-EDO temperament
            // with the equal-tempered equivalent of the chosen EDO.
            if (TEMPERAMENT[this.logo.synth.inTemperament]?.isEDO === false) {
                this.textMsg(_("Switching tuning replaces the current non-EDO temperament."), 3000);
            }

            // Close any open mode piemenu; it will be rebuilt on reopen.
            this._closeModePiemenu();

            // Cache outgoing state so round-trip preserves intermediate edits
            this._cacheState(this._activeEDO);

            // Capture old EDO before it gets overwritten by _rebuildWheel
            const oldEDO = this._activeEDO;

            // Determine new notes: use cached state if available, otherwise translate
            if (this._edoNoteCache[newEDO] !== undefined) {
                this._restoreState(newEDO);
            } else {
                this._translateNotesToEDO(newEDO);
            }

            this._rebuildWheel(newEDO);
            this.textMsg(_(`Switched to ${newEDO}-EDO tuning.`), 3000);

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
            if (oldEDO > newEDO) {
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
        this.logo.synth.inTemperament = this._temperamentKeyForEDO(edoCount);
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

        const newSelected = this._blankNotes(newEDO);

        for (let i = 1; i < n; i++) {
            if (this._selectedNotes[i]) {
                const scaledIdx = Math.round((i / n) * newEDO) % newEDO;
                newSelected[scaledIdx] = true;
            }
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
        const tuningIcon = iconButton("menu-button.svg", _("Tuning"), null);
        // Transparent select overlay — IS the click target; the icon behind
        // it is purely decorative.
        const edoSelect = document.createElement("select");
        edoSelect.id = "edoSelect";
        this._edoSelect = edoSelect;
        this._initEdoSelect(edoSelect);
        this._wireEdoSelect(edoSelect);
        edoSelect.title = _("Tuning");
        edoSelect.setAttribute("aria-label", _("Tuning"));
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
        const modeBtn = iconButton("pie-chart.svg", _("Select Mode"), () => {
            this._piemenuModes();
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
        const saveBtn = iconButton("save-button.svg", _("Save Mode"), () => {
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
        const deleteBtn = iconButton("delete.svg", _("Delete Mode"), () => {
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

        // When the mode piemenu is open, scale its SVG; otherwise scale
        // the note-wheel SVG.  getElementsByTagName("svg")[0] always
        // returns the meterWheelDiv SVG (first in DOM order) even when
        // the mode piemenu is the visible one.
        const svgContainer = this._modePiemenuOpen ? this._modePiemenuDiv : this._meterWheelDiv;
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
                nativeEDO ? currentMode : getModePattern(currentModeName[1], this._activeEDO)
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
        // Built-in mode patterns are 12-EDO intervals; scale them to the
        // active EDO. Custom modes carry EDO-specific patterns already.
        const pattern = nativeEDO ? mode : getModePattern(modeName, this._activeEDO);
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

        if (i === Math.floor(n / 2) - 1) {
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
            // note is a slice index = number of EDO steps above the root.
            const freq = pitchToFrequency(
                this._pitch,
                4,
                note * 100,
                ks,
                this._temperamentKeyForEDO(edo)
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
                const pattern = getModePattern(mode, this._activeEDO);
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
        const option = this._edoOptions().find(o => o.value === edo);
        return option ? option.temperamentKey : "equal";
    }

    _pitchNameAndOctave(j) {
        if (this._activeEDO === 12) {
            // Movable-do solfege relative to the key signature (matches playback).
            return [NOTESTABLE[(j + 1) % 12], 4];
        }
        const [name, octave] = numberToPitch(
            j,
            this._temperamentKeyForEDO(this._activeEDO),
            "A",
            0,
            this.activity
        );
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

    /**
     * Builds a piemenu for mode selection with an outer ring of mode groups
     * and an inner ring of mode names. Custom saved modes appear in the
     * "custom" group. Reuses patterns from piemenuModes in piemenus.js.
     * @returns {void}
     */
    _piemenuModes() {
        if (this._modePiemenuOpen) return;
        this._modePiemenuOpen = true;

        const savedCustomModes = getSavedCustomModes();

        // Swap the note-edit wheel for the mode-selection piemenu. The piemenu
        // renders on its own div/paper, so the two never overlap or intercept
        // each other's clicks. The root constructor clears any stale SVGs.
        this._meterWheelDiv.style.display = "none";
        this._modePiemenuDiv.style.display = "";

        this._modePieWheel = new wheelnav(
            "modePiemenuDiv",
            null,
            ModeWidget.WHEELSIZE,
            ModeWidget.WHEELSIZE
        );
        this._modeNameWheel = null; // Built on first group selection.

        // All groups appear, including "custom": it always offers "+" to
        // create a new custom mode, even when none are saved yet.
        const groupLabels = Object.keys(MODE_PIE_MENUS);

        // Outer ring: group wheel
        this._modeGroupWheel = new wheelnav("_modeGroupWheel", this._modePieWheel.raphael);
        // Fixed readable size on the 400px paper; the wheelnav default (48px)
        // overflows every slice and a computed size is too small.
        configureWheel(this._modeGroupWheel, {
            colors: platformColor.modeGroupWheelcolors,
            minRadius: MODEPIEMENU_GROUP_RING.minRadius,
            maxRadius: MODEPIEMENU_GROUP_RING.maxRadius,
            titleFont: getModeGroupTitleFont(ModeWidget.WHEELSIZE / 2)
        });
        this._modeGroupWheel.createWheel(groupLabels);

        // Inner ring: mode-name wheel (rebuilt on group selection). Reopen on
        // the group the user last visited.
        let currentGroup = groupLabels.includes(this._modeGroupName)
            ? this._modeGroupName
            : groupLabels[0];

        const __modesForGroup = grp =>
            getModeNamesForGroup(grp, ["+", ...savedCustomModes.map(m => m.name)]);

        const __buildModeNameWheel = grp => {
            currentGroup = grp;
            this._modeGroupName = grp;
            const modes = __modesForGroup(grp);

            // All groups share the fixed 12-slot layout, so the wheel is created
            // once per open and updated in place on group switches. Never call
            // removeWheel() on it: every wheel shares the root's paper, and
            // removeWheel() detaches the whole SVG from the DOM.
            const newWheel = this._modeNameWheel === null;

            // Build per-slice colors and (possibly translated) labels.
            // Declared before the configureWheel call below so the
            // reference in the options object is not in the temporal dead zone.
            const colors = getModeSliceColors(modes, {
                emptyColor: platformColor.modePieMenusIfColorPush,
                filledColor: platformColor.modePieMenusElseColorPush
            });
            const labels = modes.map(modename => getModeLabel(modename));

            if (newWheel) {
                this._modeNameWheel = new wheelnav("_modeNameWheel", this._modePieWheel.raphael);
                this._modeNameWheel.keynavigateEnabled = false;
                configureWheel(this._modeNameWheel, {
                    colors,
                    minRadius: MODEPIEMENU_NAME_RING.minRadius,
                    maxRadius: MODEPIEMENU_NAME_RING.maxRadius,
                    selectionPaths: true,
                    titleRotateAngle: 0
                });
            }

            if (newWheel) {
                this._modeNameWheel.createWheel(labels);
            } else {
                updateModeWheelItems(this._modeNameWheel, labels, colors);
            }

            // Size each label to fit its own slice arc; the 12 slots are fixed,
            // so short names render large and only long ones shrink. Applied
            // post-createWheel via the per-item title attributes.
            for (let i = 0; i < this._modeNameWheel.navItems.length; i++) {
                const font = getModeSliceFont(
                    ModeWidget.WHEELSIZE / 2,
                    modes.length,
                    labels[i].length
                );
                const item = this._modeNameWheel.navItems[i];
                item.titleAttr.font = font;
                item.titleHoverAttr.font = font;
                item.titleSelectedAttr.font = font;
            }

            // Set up action for each mode slice
            for (let i = 0; i < modes.length; i++) {
                this._modeNameWheel.navItems[i].navigateFunction = () => {
                    const title =
                        this._modeNameWheel.navItems[this._modeNameWheel.selectedNavItemIndex]
                            .title;
                    if (title === " ") return;

                    // Suppress programmatic navigation: wheelnav fires
                    // navigateFunction() on every navigateWheel() call, including
                    // the init highlight and group switches below. Those must only
                    // highlight, never select/close. Real user clicks are unaffected.
                    if (this._suppressModeSelect) {
                        return;
                    }

                    // "+" is the create-new-mode sentinel (slice 0 of the
                    // custom group): close the piemenu and blank the note wheel
                    // so the user can define a fresh mode by clicking notes.
                    if (currentGroup === "custom" && title === _("+")) {
                        this._selectedModeName = DEFAULTMODE;
                        this._closeModePiemenu();
                        this._resetToCustom();
                        return;
                    }

                    // Strip translation wrapper for major/minor
                    const modeName = getModeNameFromLabel(title, __modesForGroup(currentGroup));

                    this._selectedModeName = modeName;
                    const mode = MUSICALMODES[modeName];
                    if (mode) {
                        // Close piemenu FIRST so the note wheel is visible for any wheel
                        // rebuild triggered by _loadMode() → _rebuildWheel() → _piemenuMode()
                        this._closeModePiemenu();

                        this._loadMode(modeName, mode, this._edoSelect);
                    }
                };
            }

            // Navigate to currently-selected mode if present. This fires the
            // slice's navigateFunction (which would select+close), so suppress
            // it: this call is only meant to highlight the current mode.
            let idx = 0;
            for (let i = 0; i < modes.length; i++) {
                if (modes[i] === this._selectedModeName) {
                    idx = i;
                    break;
                }
            }
            this._suppressModeSelect = true;
            this._modeNameWheel.navigateWheel(idx);
            this._suppressModeSelect = false;
        };

        // Wire group wheel slices → __buildModeNameWheel
        for (let i = 0; i < this._modeGroupWheel.navItems.length; i++) {
            this._modeGroupWheel.navItems[i].navigateFunction = () => {
                const selectedGroup =
                    this._modeGroupWheel.navItems[this._modeGroupWheel.selectedNavItemIndex].title;
                __buildModeNameWheel(selectedGroup);
            };
        }

        // Highlight the last-visited group and build its mode wheel; the group
        // navigateFunction above triggers the name-wheel build.
        this._modeGroupWheel.navigateWheel(groupLabels.indexOf(currentGroup));
    }

    /**
     * Closes the mode piemenu and restores the note-edit wheel.
     * Properly destroys wheelnav instances so their SVGs leave the DOM.
     * @returns {void}
     */
    _closeModePiemenu() {
        this._modePiemenuDiv.style.display = "none";
        this._meterWheelDiv.style.display = "";

        // All three wheels share the root's paper, so removing the root
        // removes the whole SVG, including the child wheels.
        if (this._modePieWheel) {
            this._modePieWheel.removeWheel();
        }

        this._modePieWheel = null;
        this._modeGroupWheel = null;
        this._modeNameWheel = null;
        this._modePiemenuOpen = false;
        this._suppressModeSelect = false;
    }
}

if (typeof module !== "undefined") {
    module.exports = ModeWidget;
}
