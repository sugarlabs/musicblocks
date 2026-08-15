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
   numberToPitch, pitchToFrequency
 */

/*
    Global locations
    - lib/wheelnav
        slicePath, wheelnav
    - js/utils/utils.js
        _, last, docById
    - js/utils/platformstyle.js
        platformColor
    - js/utils/musicutils.js
        keySignatureToMode, MUSICALMODES, getModePattern, getNote, DEFAULTVOICE,
        NOTESTABLE

    Dependency Injection Pattern:
    This widget uses dependency injection to reduce implicit global state.
    Dependencies are passed via the constructor as part of the `activity` object.

    Required Dependencies (accessed via this.activity):
    - logo: Logo instance (provides synth, modeBlock, resetSynth)
    - turtles: Turtles instance (provides ithTurtle for keySignature)
    - blocks: Blocks instance (provides blockList, loadNewBlocks)
    - hideMsgs: Function to hide messages
    - textMsg: Function to display text messages
    - errorMsg: Function to display error messages
    - refreshCanvas: Function to refresh the canvas
    - storage: Storage object for custom mode persistence

    Note: `this.storage.custommode` persistence was replaced by
    `localStorage["customModes"]` (see _saveCustomMode/_getCustomModes);
    `storage` is no longer a widget dependency.
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
        this._activeEDO = getCurrentEDO(this.logo.synth.inTemperament);

        this.widgetWindow = window.widgetWindows.windowFor(this, "custom mode");
        this.widgetWindow.clear();
        this.widgetWindow.show();

        this._timeouts = [];

        // Layout: pie wheel + mode table (label row) + bottom control bar
        this.modeTableDiv = document.createElement("div");
        this.modeTableDiv.style.display = "inline";
        this.modeTableDiv.style.visibility = "visible";
        this.modeTableDiv.style.border = "0px";

        const meterWheelDiv = document.createElement("div");
        meterWheelDiv.id = "meterWheelDiv";

        const modeTable = document.createElement("table");
        modeTable.id = "modeTable";

        this.modeTableDiv.replaceChildren(meterWheelDiv, modeTable);
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
            if (this._playingStatus()) {
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

    // ── Play state ────────────────────────────────────────────────

    _playingStatus() {
        return this._playing;
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

    _createEdoSelect() {
        const select = document.createElement("select");
        select.id = "edoSelect";
        select.style.fontSize = "12px";
        return select;
    }

    _initEdoSelect(select) {
        const inEDO = this._activeEDO;
        const inTemperament = this.logo.synth.inTemperament;
        const options = this._edoOptions();

        let foundMatch = false;
        for (const o of options) {
            const opt = document.createElement("option");
            opt.value = o.value;
            opt.textContent = o.label;
            if (o.value === inEDO || o.temperamentKey === inTemperament) {
                opt.selected = true;
                foundMatch = true;
            }
            select.appendChild(opt);
        }

        if (!foundMatch) {
            const opt = document.createElement("option");
            opt.value = inEDO;
            opt.textContent = inEDO + "-EDO";
            opt.selected = true;
            select.prepend(opt);
        }
    }

    _wireEdoSelect(select) {
        select.addEventListener("change", () => {
            const newEDO = parseInt(select.value, 10);
            if (isNaN(newEDO) || newEDO < 5 || newEDO > 55 || newEDO === this._activeEDO) {
                return;
            }

            // Check cache first: if we have a pre-saved state for this EDO,
            // restore it exactly rather than applying a translation mapping.
            if (this._edoNoteCache[newEDO] !== undefined) {
                this._selectedNotes = this._edoNoteCache[newEDO].slice();
                this._activeEDO = newEDO;
                this._rebuildWheel(newEDO);
                this.textMsg(_(`Switched to ${newEDO}-EDO tuning.`), 3000);
                this._setModeName();
                return;
            }

            // Cache the current EDO's state before translating so we can
            // restore it losslessly when the user switches back.
            this._edoNoteCache[this._activeEDO] = this._selectedNotes.slice();
            const oldEDO = this._activeEDO;

            this._translateNotesToEDO(newEDO);
            // Save the resulting state for this EDO so future round-trips
            // can restore it exactly.
            this._edoNoteCache[newEDO] = this._selectedNotes.slice();
            this._rebuildWheel(newEDO);

            this.textMsg(
                _(
                    `Mode remapped from ${oldEDO}-EDO to ${newEDO}-EDO. Some notes may have changed.`
                ),
                3000
            );

            // Update mode name display without wiping the control bar.
            this._setModeName();
        });
    }

    _updateTemperament(newEDO) {
        if (!this.logo || !this.logo.synth) {
            return;
        }
        this.logo.synth.inTemperament = this._temperamentKeyForEDO(newEDO);
    }

    /**
     * Tear down the existing SVG slices and rebuild the pie wheel for the
     * given EDO count. Shared by the tuning dropdown and saved-mode loading.
     * @param {number} edoCount - The number of steps per octave.
     */
    _rebuildWheel(edoCount) {
        this._cancelAnimations();
        this._activeEDO = edoCount;
        this._updateTemperament(edoCount);
        this._piemenuMode();
    }

    _clearPieMenu() {
        const meterDiv = docById("meterWheelDiv");
        if (meterDiv && typeof meterDiv.querySelectorAll === "function") {
            // Explicitly remove any leftover SVG slices from the DOM.
            const svgs = meterDiv.querySelectorAll("svg");
            for (let i = svgs.length - 1; i >= 0; i--) {
                if (typeof meterDiv.removeChild === "function") {
                    meterDiv.removeChild(svgs[i]);
                }
            }
        }

        if (this._modeWheel) {
            this._modeWheel.removeWheel();
        }
        if (this._noteWheel) {
            this._noteWheel.removeWheel();
        }
        if (this._playWheel) {
            this._playWheel.removeWheel();
        }
        this._modeWheel = null;
        this._noteWheel = null;
        this._playWheel = null;
    }

    _translateNotesToEDO(newEDO) {
        const n = this._activeEDO;
        if (newEDO === n) {
            return;
        }

        const newSelected = new Array(newEDO).fill(false);
        newSelected[0] = true;

        for (let i = 1; i < n; i++) {
            if (this._selectedNotes[i]) {
                const scaledIdx = Math.round((i / n) * newEDO) % newEDO;
                newSelected[scaledIdx] = true;
            }
        }

        this._selectedNotes = newSelected;
    }

    // ── Modes dropdown helpers ────────────────────────────────────

    _getCustomModes() {
        try {
            return JSON.parse(localStorage.getItem("customModes") || "[]");
        } catch (e) {
            return [];
        }
    }

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
        const modes = this._getCustomModes();
        const existing = modes.findIndex(m => m.name === name);
        // Refuse to overwrite a built-in mode; only registered customs may be updated.
        if (existing < 0 && name in MUSICALMODES) {
            this.errorMsg(_("Cannot overwrite built-in mode: ") + name);
            return false;
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
        return true;
    }

    _deleteCustomMode(name) {
        const modes = this._getCustomModes();
        const filtered = modes.filter(m => m.name !== name);
        this._saveCustomModesList(filtered);

        delete MUSICALMODES[name];
    }

    _getModeEDO(modeName) {
        // Saved custom modes carry their native EDO in the registry.
        const custom = this._getCustomModes().find(m => m.name === modeName);
        return custom && custom.edo ? custom.edo : null;
    }

    _populateModesDropdown(select) {
        select.innerHTML = "";

        // "Custom" option always at the top
        const customOpt = document.createElement("option");
        customOpt.value = "custom";
        customOpt.textContent = _("Custom");
        select.appendChild(customOpt);

        const customs = this._getCustomModes();
        const customNames = new Set(customs.map(m => m.name));

        const builtIn = document.createElement("optgroup");
        builtIn.label = _("Built-in Modes");
        for (const mode of Object.keys(MUSICALMODES)) {
            // Custom modes are registered in MUSICALMODES too, so exclude them
            // from the built-in group to avoid listing them twice.
            if (customNames.has(mode)) {
                continue;
            }
            const opt = document.createElement("option");
            opt.value = mode;
            opt.textContent = _(mode);
            builtIn.appendChild(opt);
        }
        select.appendChild(builtIn);

        if (customs.length > 0) {
            const group = document.createElement("optgroup");
            group.label = _("Custom Modes");
            for (const m of customs) {
                const opt = document.createElement("option");
                opt.value = m.name;
                opt.textContent = m.name;
                group.appendChild(opt);
            }
            select.appendChild(group);
        }
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
        bar.style.gap = "10px";
        bar.style.padding = "8px 12px";

        // EDO/Tuning dropdown
        const edoLabel = document.createElement("span");
        edoLabel.textContent = _("Tuning") + ":";
        edoLabel.style.fontSize = "12px";

        const edoSelect = this._createEdoSelect();
        this._initEdoSelect(edoSelect);
        this._wireEdoSelect(edoSelect);
        edoSelect.style.fontSize = "12px";
        edoSelect.style.minHeight = "30px";

        // Modes dropdown
        const modeLabel = document.createElement("span");
        modeLabel.textContent = _("Mode") + ":";
        modeLabel.style.fontSize = "12px";

        const modeSelect = document.createElement("select");
        modeSelect.id = "modeSelect";
        modeSelect.style.fontSize = "12px";
        modeSelect.style.minHeight = "30px";
        this._populateModesDropdown(modeSelect);

        modeSelect.addEventListener("change", () => {
            const modeName = modeSelect.value;
            if (modeName === "custom") {
                this._resetToCustom();
                return;
            }

            const mode = MUSICALMODES[modeName];
            if (!mode) {
                return;
            }

            this._loadMode(modeName, mode, edoSelect);
        });

        // Mode name input
        const nameInput = document.createElement("input");
        nameInput.id = "customModeName";
        nameInput.type = "text";
        nameInput.placeholder = _("Mode name");
        nameInput.style.fontSize = "12px";
        nameInput.style.width = "90px";
        nameInput.style.minHeight = "30px";

        // Save button
        const saveBtn = document.createElement("button");
        saveBtn.textContent = _("Save");
        saveBtn.style.fontSize = "12px";
        saveBtn.style.minHeight = "30px";
        saveBtn.style.padding = "0 12px";
        saveBtn.onclick = () => {
            const name = nameInput.value.trim();
            if (!name) {
                this.errorMsg(_("Please enter a mode name."));
                return;
            }
            const pattern = this._calculateMode();
            if (!this._saveCustomMode(name, pattern)) {
                return;
            }
            this._populateModesDropdown(modeSelect);
            modeSelect.value = name;
            // Export the mode to the workspace blocks so the user can use it.
            this._setModeName();
            this._save();
            this.textMsg(_("Mode saved: ") + name, 3000);
        };

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = _("Delete");
        deleteBtn.style.fontSize = "12px";
        deleteBtn.style.minHeight = "30px";
        deleteBtn.style.padding = "0 12px";
        deleteBtn.onclick = () => {
            const name = modeSelect.value;
            const customs = this._getCustomModes();
            if (!customs.some(m => m.name === name)) {
                this.errorMsg(_("Cannot delete a built-in mode."));
                return;
            }
            this._deleteCustomMode(name);
            this._populateModesDropdown(modeSelect);
            modeSelect.value = Object.keys(MUSICALMODES)[0];
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
            this.textMsg(_("Mode deleted: ") + name, 3000);
        };

        bar.appendChild(edoLabel);
        bar.appendChild(edoSelect);
        bar.appendChild(modeLabel);
        bar.appendChild(modeSelect);
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

        const svg = this.getWidgetBody().getElementsByTagName("svg")[0];
        svg.style.pointerEvents = "none";
        svg.setAttribute("height", `${400 * scale}px`);
        svg.setAttribute("width", `${400 * scale}px`);
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

        this._applyModePattern(
            this._getModeEDO(currentModeName[1])
                ? currentMode
                : getModePattern(currentModeName[1], this._activeEDO)
        );
        this._setModeName();
    }

    _loadMode(modeName, mode, edoSelect) {
        const nativeEDO = this._getModeEDO(modeName);
        if (nativeEDO && nativeEDO !== this._activeEDO) {
            // The saved mode was authored in a different tuning, so sync the
            // tuning dropdown and rebuild the wheel before selecting intervals.
            edoSelect.value = nativeEDO;
            this._rebuildWheel(nativeEDO);
        }
        // Built-in mode patterns are 12-EDO intervals; scale them to the
        // active EDO. Custom modes carry EDO-specific patterns already.
        const pattern = nativeEDO ? mode : getModePattern(modeName, this._activeEDO);
        this._applyModePattern(pattern);
        this._setModeName();

        // Show message if the mode pattern was scaled from a different EDO
        if (nativeEDO && nativeEDO !== this._activeEDO) {
            this.textMsg(
                _(
                    `Mode scaled from ${nativeEDO}-EDO to ${this._activeEDO}-EDO. Some notes may have changed.`
                ),
                3000
            );
        }
    }

    _applyModePattern(pattern) {
        const n = this._activeEDO;
        this._selectedNotes = new Array(n).fill(false);
        this._selectedNotes[0] = true;

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

    _resetToCustom() {
        const n = this._activeEDO;
        this._saveState();
        this._selectedNotes = new Array(n).fill(false);
        this._selectedNotes[0] = true;

        for (let i = 0; i < n; i++) {
            if (i === 0) {
                this._noteWheel.navItems[i].navItem.show();
            } else {
                this._noteWheel.navItems[i].navItem.hide();
            }
        }

        // Clear the mode name display
        this._updateModeDisplay("");
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
        const ks = this.turtles.ithTurtle(0).singer.keySignature;
        const noteToPlay = getNote(this._pitch, 4, i, ks, false, null, this.errorMsg);
        this.logo.synth.trigger(
            0,
            normalizeNoteAccidentals(noteToPlay[0]) + noteToPlay[1],
            this._noteValue,
            DEFAULTVOICE,
            null,
            null
        );
    }

    // ── Undo / Clear ──────────────────────────────────────────────

    _saveState() {
        const state = JSON.stringify(this._selectedNotes);
        if (state !== last(this._undoStack)) {
            this._undoStack.push(JSON.stringify(this._selectedNotes));
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
        const customNames = new Set(this._getCustomModes().map(m => m.name));

        for (const mode in MUSICALMODES) {
            // Custom modes are stored with EDO-specific step patterns; built-in
            // patterns are 12-EDO intervals scaled to the active EDO.
            const pattern = customNames.has(mode)
                ? MUSICALMODES[mode]
                : getModePattern(mode, this._activeEDO);
            if (JSON.stringify(pattern) === currentMode) {
                if (this._modeBlock !== null) {
                    // Only update the modename block connected to the widget's
                    // setkey2 block, plus its sibling notename block.
                    const modeBlock = this.blocks.blockList[this._modeBlock];
                    if (modeBlock && modeBlock.name === "modename") {
                        modeBlock.value = mode;
                        modeBlock.text.text = _(mode);
                        modeBlock.updateCache();

                        const parent = this.blocks.blockList[modeBlock.connections[0]];
                        const notenameBlock =
                            parent?.name === "setkey2" &&
                            this.blocks.blockList[parent.connections[1]];
                        if (notenameBlock?.name === "notename") {
                            notenameBlock.value = currentKey;
                            notenameBlock.text.text = _(currentKey);
                            notenameBlock.updateCache();
                        }
                    }
                    this.refreshCanvas();
                }

                const name = currentKey + " " + _(mode);
                this._updateModeDisplay(name);
                return;
            }
        }

        this._updateModeDisplay("");
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

        const meterDiv = docById("meterWheelDiv");
        meterDiv.style.display = "";

        this._modeWheel = new wheelnav("meterWheelDiv", null, 400, 400);
        this._noteWheel = new wheelnav("_noteWheel", this._modeWheel.raphael);
        this._playWheel = new wheelnav("_playWheel", this._modeWheel.raphael);

        wheelnav.cssMeter = true;

        this._modeWheel.colors = platformColor.modeWheelcolors;
        this._modeWheel.slicePathFunction = slicePath().DonutSlice;
        this._modeWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._modeWheel.slicePathCustom.minRadiusPercent = 0.4;
        this._modeWheel.slicePathCustom.maxRadiusPercent = 0.75;
        this._modeWheel.sliceSelectedPathCustom = this._modeWheel.slicePathCustom;
        this._modeWheel.sliceInitPathCustom = this._modeWheel.slicePathCustom;
        this._modeWheel.clickModeRotate = false;
        this._modeWheel.navAngle = -90;
        this._modeWheel.animatetime = 0;

        const titleFontSize = Math.min(48, Math.max(10, Math.floor(580 / n)));
        this._modeWheel.titleFont = "400 " + titleFontSize + "px Times New Roman";

        const labels = [];
        for (let i = 0; i < n; i++) {
            labels.push(String(i));
        }
        this._modeWheel.createWheel(labels);

        this._noteWheel.colors = platformColor.noteValueWheelcolors;
        this._noteWheel.slicePathFunction = slicePath().DonutSlice;
        this._noteWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._noteWheel.slicePathCustom.minRadiusPercent = 0.75;
        this._noteWheel.slicePathCustom.maxRadiusPercent = 0.9;
        this._noteWheel.sliceSelectedPathCustom = this._noteWheel.slicePathCustom;
        this._noteWheel.sliceInitPathCustom = this._noteWheel.slicePathCustom;
        this._noteWheel.clickModeRotate = false;
        this._noteWheel.navAngle = -90;
        this._noteWheel.titleRotateAngle = 90;

        // Reconcile selectedNotes: preserve existing, ensure index 0 is always true
        const oldNotes = this._selectedNotes;
        this._selectedNotes = new Array(n).fill(false);
        this._selectedNotes[0] = true;
        if (Array.isArray(oldNotes)) {
            for (let i = 1; i < Math.min(oldNotes.length, n); i++) {
                if (oldNotes[i]) {
                    this._selectedNotes[i] = true;
                }
            }
        }

        // Slice 0: blank (no X toggle — root is always selected)
        // Slices 1..n-1: "x" toggle (dynamic EDO layout)
        const noteList = [" "];
        for (let i = 1; i < n; i++) {
            noteList.push("x");
        }
        this._noteWheel.createWheel(noteList);

        this._playWheel.colors = [platformColor.orange];
        this._playWheel.slicePathFunction = slicePath().DonutSlice;
        this._playWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._playWheel.slicePathCustom.minRadiusPercent = 0.3;
        this._playWheel.slicePathCustom.maxRadiusPercent = 0.4;
        this._playWheel.sliceSelectedPathCustom = this._playWheel.slicePathCustom;
        this._playWheel.sliceInitPathCustom = this._playWheel.slicePathCustom;
        this._playWheel.clickModeRotate = false;
        this._playWheel.navAngle = -90;
        this._playWheel.titleRotateAngle = 90;

        const playList = [];
        for (let i = 0; i < n; i++) {
            playList.push(" ");
        }
        this._playWheel.createWheel(playList);

        for (let i = 0; i < n; i++) {
            this._playWheel.navItems[i].navItem.hide();
        }

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
}

if (typeof module !== "undefined") {
    module.exports = ModeWidget;
}
