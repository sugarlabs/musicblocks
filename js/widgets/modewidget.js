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
   getNote, DEFAULTVOICE, last, slicePath, wheelnav,
   normalizeNoteAccidentals, parseNoteString, getCurrentEDO, TEMPERAMENT,
   registerUserMode, getUserModeNames, removeUserMode, NOTESTABLE,
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
        keySignatureToMode, MUSICALMODES, getNote, DEFAULTVOICE,
        parseNoteString, getCurrentEDO, TEMPERAMENT, registerUserMode,
        getUserModeNames, removeUserMode

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
*/

/*exported ModeWidget*/

/**
 * ModeWidget - A widget for creating and managing musical modes.
 *
 * This widget allows users to create custom musical modes by selecting
 * notes on a circular wheel interface. It supports playing, saving,
 * rotating, and inverting modes.
 */
class ModeWidget {
    /** AMD module dependencies for lazy loading. */
    static dependencies = ["widgets/modewidget"];

    static ICONSIZE = 32;
    static BUTTONSIZE = 53;
    static ROTATESPEED = 125;
    static BUTTONDIVWIDTH = 535;
    static RESET_NOTES_DELAY = 500;

    /**
     * Constructs a new ModeWidget instance.
     * @param {object} activity - The activity instance providing dependencies
     * @param {object} [deps] - Optional explicit dependencies (for testing)
     */
    constructor(activity, deps) {
        // Store the activity reference for backward compatibility
        this.activity = activity;

        // Optional explicit dependencies for testing/isolation
        // If deps is provided, use it; otherwise fall back to activity
        this._deps = deps || {};

        // Bind commonly-used dependencies locally for readability
        // This reduces verbosity while maintaining explicit dependency injection
        this.logo = this._deps.logo || this.activity.logo;
        this.turtles = this._deps.turtles || this.activity.turtles;
        this.blocks = this._deps.blocks || this.activity.blocks;
        this.storage = this._deps.storage || this.activity.storage;
        this.hideMsgs = this._deps.hideMsgs || this.activity.hideMsgs.bind(this.activity);
        this.textMsg = this._deps.textMsg || this.activity.textMsg.bind(this.activity);
        this.errorMsg = this._deps.errorMsg || this.activity.errorMsg.bind(this.activity);
        this.refreshCanvas =
            this._deps.refreshCanvas || this.activity.refreshCanvas.bind(this.activity);

        // Initialize widget state
        this._modeBlock = this.logo.modeBlock;
        this._locked = false;
        this._pitch = this.turtles.ithTurtle(0).singer.keySignature[0];
        this._noteValue = 0.333;
        this._undoStack = [];
        this._playing = false;
        this._selectedNotes = [];
        this._newPattern = [];
        this._activeEDO = 12; // Overridden from the temperament context in _piemenuMode.

        const w = window.innerWidth;
        this._cellScale = w / 1200;

        this.widgetWindow = window.widgetWindows.windowFor(this, "custom mode");
        this.widgetWindow.clear();
        this.widgetWindow.show();

        this._timeouts = [];

        // The mode table (holds a pie menu and a label)
        this.modeTableDiv = document.createElement("div");
        this.modeTableDiv.style.display = "inline";
        this.modeTableDiv.style.visibility = "visible";
        this.modeTableDiv.style.border = "0px";
        const meterWheelDiv = document.createElement("div");
        meterWheelDiv.id = "meterWheelDiv";
        const modeNameDiv = document.createElement("div");
        modeNameDiv.id = "modeNameDiv";
        modeNameDiv.style.display = "flex";
        modeNameDiv.style.alignItems = "center";
        modeNameDiv.style.gap = "8px";
        modeNameDiv.style.padding = "8px";
        // Active tuning-system selector. Lists the EDOs defined in
        // TEMPERAMENT (5, 7, 12, 17, 19, 31) and switches the whole widget
        // to that many slices, keeping the global temperament in sync so the
        // preview and the emitted define-mode block agree with the wheel.
        // Given standard dropdown dimensions (not the bare native square) and
        // a clear "Tuning:" label.
        const tuningLabel = document.createElement("label");
        tuningLabel.htmlFor = "modeEdoSelect";
        tuningLabel.textContent = _("Tuning:");
        tuningLabel.style.fontSize = "14px";
        tuningLabel.style.whiteSpace = "nowrap";
        const edoSelect = document.createElement("select");
        edoSelect.id = "modeEdoSelect";
        edoSelect.title = _("Tuning system (EDO)");
        edoSelect.style.width = "110px";
        edoSelect.style.height = "32px";
        edoSelect.style.padding = "0 8px";
        edoSelect.style.fontSize = "14px";
        edoSelect.style.borderRadius = "4px";
        const modeNameInput = document.createElement("input");
        modeNameInput.type = "text";
        modeNameInput.id = "modeNameInput";
        modeNameInput.placeholder = _("Name Custom Mode");
        const saveModeButton = document.createElement("button");
        saveModeButton.id = "saveModeButton";
        saveModeButton.textContent = _("Save Custom Mode");
        saveModeButton.onclick = this._save.bind(this);
        modeNameDiv.replaceChildren(tuningLabel, edoSelect, modeNameInput, saveModeButton);
        this._modeNameInput = modeNameInput;
        this._edoSelect = edoSelect;
        const modeTable = document.createElement("table");
        modeTable.id = "modeTable";
        this.modeTableDiv.replaceChildren(meterWheelDiv, modeNameDiv, modeTable);

        this.widgetWindow.getWidgetBody().append(this.modeTableDiv);

        // Saved-modes ledger: a readable, scrollable list at the bottom of
        // the widget where every registered user mode gets a Load and a
        // Delete action. Hidden until at least one mode has been saved.
        const savedModesContainer = document.createElement("div");
        savedModesContainer.id = "savedModesContainer";
        savedModesContainer.style.display = "none";
        savedModesContainer.style.width = "100%";
        savedModesContainer.style.maxHeight = "150px";
        savedModesContainer.style.overflowY = "auto";
        savedModesContainer.style.padding = "8px";
        savedModesContainer.style.boxSizing = "border-box";
        savedModesContainer.style.borderTop = "1px solid " + platformColor.selectorBackground;
        this._savedModesContainer = savedModesContainer;
        this.widgetWindow.getWidgetBody().append(savedModesContainer);

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
            this.widgetWindow.destroy();
        };

        // Bind _scale so `this` stays the ModeWidget instance when the
        // WidgetWindow invokes it as onmaximize on header double-click.
        this.widgetWindow.onmaximize = this._scale.bind(this);

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

        // Switching the active EDO rebuilds the wheels with the new slice
        // count and applies the global temperament so the runtime matches.
        this._edoSelect.onchange = () => {
            const key = this._edoSelect.value;
            const entry = this._getEdoList().find(e => e.key === key);
            if (entry && Number.isFinite(entry.edo) && entry.edo !== this._activeEDO) {
                this._setActiveEDO(entry.key);
            }
        };

        this._populateEdoSelect();
        this._renderSavedModes();

        const table = docById("modeTable");

        // A row for the current mode label
        const row = table.insertRow();
        const cell = row.insertCell();
        // cell.colSpan = 18;
        cell.textContent = "\u00a0";
        cell.style.backgroundColor = platformColor.selectorBackground;

        // Start from a blank slate: _buildWheels() leaves the note ring fully
        // unselected, so the wheel only gains steps when the user clicks a
        // slice or explicitly loads a saved mode via _applyPattern().
        // (No _setMode() call here — auto-populating the current key's mode
        // made every slice look preselected, especially for chromatic custom
        // modes.)

        //.TRANS: A circle of notes represents the musical mode.
        activity.textMsg(_("Click in the circle to select notes for the mode."), 3000);
        window.requestAnimationFrame(() => this.widgetWindow.sendToCenter());
    }

    /**
     * @private
     * @param {Function} fn - function to execute
     * @param {number} delay - delay in milliseconds
     * @returns {number} timeout ID
     */
    _setTimeout(fn, delay) {
        const id = setTimeout(() => {
            this._timeouts = this._timeouts.filter(t => t !== id);
            fn();
        }, delay);
        this._timeouts.push(id);
        return id;
    }

    /**
     * Get the active EDO from the temperament context.
     *
     * The wheel renders one slice per scale degree, so every slice count,
     * loop boundary, and step computation depends on the value returned
     * here. Falls back to 12 when no temperament is active.
     *
     * The temperament name can live in a few places depending on how it was
     * set: `logo.synth.inTemperament` is the canonical field (kept in sync by
     * setUserTemperament / the setTemperament action), but the "temperament"
     * widget block only writes `logo.temperament.inTemperament` until the
     * user applies it, and `logo._userTemperament` records the last value the
     * user picked. Consult them in order so the wheel never silently falls
     * back to 12 slices.
     *
     * @private
     * @returns {number} EDO value (defaults to 12)
     */
    _getActiveEDO() {
        const temperament =
            this.logo?.synth?.inTemperament ||
            this.logo?.temperament?.inTemperament ||
            this.logo?._userTemperament;
        if (!temperament) return 12;

        const currentEDO =
            typeof getCurrentEDO === "function"
                ? getCurrentEDO(temperament)
                : TEMPERAMENT[temperament]?.pitchNumber || 12;
        return currentEDO;
    }

    /**
     * Get the name of the currently active temperament.
     *
     * Mirrors _getActiveEDO's lookup order (logo.synth.inTemperament first,
     * then the temperament widget block value, then the last user choice) so
     * the value matches the wheel's slice count. Falls back to "equal".
     *
     * @private
     * @returns {string} the active temperament key
     */
    _getActiveTemperament() {
        return (
            (this.logo && this.logo.synth && this.logo.synth.inTemperament) ||
            (this.logo && this.logo.temperament && this.logo.temperament.inTemperament) ||
            (this.logo && this.logo._userTemperament) ||
            "equal"
        );
    }

    /**
     * @private
     * @returns {boolean}
     */
    _playingStatus() {
        return this._playing;
    }

    /**
     * @private
     * @param {string} iconName
     * @param {string} titleText
     * @returns {void}
     */
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

    /**
     * @private
     * @returns {void}
     */
    _scale() {
        const windowHeight =
            this.widgetWindow.getWidgetFrame().offsetHeight -
            this.widgetWindow.getDragElement().offsetHeight;
        const widgetBody = this.widgetWindow.getWidgetBody();
        const scale = this.widgetWindow.isMaximized() ? windowHeight / widgetBody.offsetHeight : 1;
        widgetBody.style.display = "flex";
        widgetBody.style.flexDirection = "column";
        widgetBody.style.alignItems = "center";
        widgetBody.children[0].style.display = "flex";
        widgetBody.children[0].style.flexDirection = "column";
        widgetBody.children[0].style.alignItems = "center";

        const svg = this.widgetWindow.getWidgetBody().getElementsByTagName("svg")[0];
        svg.style.pointerEvents = "none";
        svg.setAttribute("height", `${400 * scale}px`);
        svg.setAttribute("width", `${400 * scale}px`);
        this._setTimeout(() => {
            svg.style.pointerEvents = "auto";
        }, 100);
    }

    /**
     * @private
     * @returns {void}
     */
    _invert() {
        if (this._locked) {
            return;
        }

        this._locked = true;

        this._saveState();
        this.__invertOnePair(1);
    }

    /**
     * @private
     * @param {number} i
     * @returns {void}
     */
    __invertOnePair(i) {
        const N = this._selectedNotes.length;
        const tmp = this._selectedNotes[i];
        this._selectedNotes[i] = this._selectedNotes[N - i];
        if (this._selectedNotes[i]) {
            this._noteWheel.navItems[i].navItem.show();
        } else {
            this._noteWheel.navItems[i].navItem.hide();
        }

        this._selectedNotes[N - i] = tmp;
        if (this._selectedNotes[N - i]) {
            this._noteWheel.navItems[N - i].navItem.show();
        } else {
            this._noteWheel.navItems[N - i].navItem.hide();
        }

        if (i === Math.ceil(N / 2) - 1) {
            this._saveState();
            this._setModeName();
            this._locked = false;
        } else {
            this._setTimeout(() => {
                this.__invertOnePair(i + 1);
            }, ModeWidget.ROTATESPEED);
        }
    }

    /**
     * @private
     * @returns {void}
     */
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
     * @private
     * @returns {void}
     */
    _rotateRight() {
        if (this._locked) {
            return;
        }
        if (!this._selectedNotes.some(Boolean)) {
            return;
        }
        this._locked = true;
        this._saveState();
        this._newPattern = [];
        const N = this._selectedNotes.length;
        this._newPattern.push(this._selectedNotes[N - 1]);
        for (let i = 0; i < N - 1; i++) {
            this._newPattern.push(this._selectedNotes[i]);
        }
        this.__rotateRightOneCell(1);
    }

    /**
     * @private
     * @param {number} i
     * @returns {void}
     */
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
                    // We are done.
                    this._saveState();
                    this._setModeName();
                    this._locked = false;
                } else {
                    // Keep going until first note is selected.
                    this._locked = false;
                    this._rotateRight();
                }
            }, ModeWidget.ROTATESPEED);
        } else {
            this._setTimeout(() => {
                this.__rotateRightOneCell((i + 1) % this._selectedNotes.length);
            }, ModeWidget.ROTATESPEED);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _rotateLeft() {
        if (this._locked) {
            return;
        }
        if (!this._selectedNotes.some(Boolean)) {
            return;
        }
        this._locked = true;

        this._saveState();
        this._newPattern = [];
        const N = this._selectedNotes.length;
        for (let i = 1; i < N; i++) {
            this._newPattern.push(this._selectedNotes[i]);
        }

        this._newPattern.push(this._selectedNotes[0]);

        this.__rotateLeftOneCell(N - 1);
    }

    /**
     * @private
     * @param {number} i
     * @returns {void}
     */
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
                    // We are done.
                    this._saveState();
                    this._setModeName();
                    this._locked = false;
                } else {
                    // Keep going until first note is selected.
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

    /**
     * @private
     * @returns {void}
     */
    _playAll() {
        // Play all of the notes in the widget.
        if (this._locked) {
            return;
        }

        this.logo.synth.stop();
        this._locked = true;

        // Make a list of notes to play
        this._notesToPlay = [];
        const N = this._selectedNotes.length;
        // Play the mode ascending.
        for (let i = 0; i < N; i++) {
            if (this._selectedNotes[i]) {
                this._notesToPlay.push(i);
            }
        }

        // Include the octave above the starting note.
        this._notesToPlay.push(N);

        // And then play the mode descending.
        this._notesToPlay.push(N);
        for (let i = N - 1; i > -1; i--) {
            if (this._selectedNotes[i]) {
                this._notesToPlay.push(i);
            }
        }
        // console.debug(this._notesToPlay);
        this._lastNotePlayed = null;
        if (this._playing) {
            this.__playNextNote(0);
        }
    }

    /**
     * @private
     * @param {number} i - note to play
     * @returns {void}
     */
    __playNextNote(i) {
        const time = this._noteValue + 0.125;
        const N = this._activeEDO;

        if (i > this._notesToPlay.length - 1) {
            this._setTimeout(() => {
                // Did we just play the last note?
                this._playing = false;
                this._setPlayButtonIcon("play-button.svg", _("Play all"));
                this._resetNotes();
                this._locked = false;
            }, 1000 * time);

            return;
        }

        this._setTimeout(() => {
            if (this._lastNotePlayed !== null) {
                this._playWheel.navItems[this._lastNotePlayed % N].navItem.hide();
            }

            const note = this._notesToPlay[i];
            this._playWheel.navItems[note % N].navItem.show();
            this._lastNotePlayed = note;

            const ks = this.turtles.ithTurtle(0).singer.keySignature;
            const noteToPlay = getNote(
                this._pitch,
                4,
                note,
                ks,
                false,
                null,
                this.errorMsg,
                this.logo?.synth?.inTemperament,
                this._activeEDO !== 12
            );
            const noteString = normalizeNoteAccidentals(noteToPlay[0]) + noteToPlay[1];
            this.logo.synth.trigger(0, noteString, this._noteValue, DEFAULTVOICE, null, null);

            if (this._playing) {
                this.__playNextNote(i + 1);
            } else {
                this._locked = false;
                this._setTimeout(() => this._resetNotes(), ModeWidget.RESET_NOTES_DELAY);
                return;
            }
        }, 1000 * time);
    }

    /**
     * @private
     * @param {number} i - note to play
     * @returns {void}
     */
    _playNote(i) {
        const ks = this.turtles.ithTurtle(0).singer.keySignature;

        const noteToPlay = getNote(
            this._pitch,
            4,
            i,
            ks,
            false,
            null,
            this.errorMsg,
            this.logo?.synth?.inTemperament,
            this._activeEDO !== 12
        );
        const noteString = normalizeNoteAccidentals(noteToPlay[0]) + noteToPlay[1];
        this.logo.synth.trigger(0, noteString, this._noteValue, DEFAULTVOICE, null, null);
    }

    /**
     * @private
     * @returns {void}
     */
    _saveState() {
        const state = JSON.stringify(this._selectedNotes);
        if (state !== last(this._undoStack)) {
            this._undoStack.push(JSON.stringify(this._selectedNotes));
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _undo() {
        if (this._undoStack.length > 0) {
            const prevState = JSON.parse(this._undoStack.pop());
            for (let i = 0; i < this._selectedNotes.length; i++) {
                this._selectedNotes[i] = prevState[i];
            }

            this._resetNotes();
            this._setModeName();
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _clear() {
        // "Unclick" every entry in the widget.

        this._saveState();

        for (let i = 1; i < this._selectedNotes.length; i++) {
            this._selectedNotes[i] = false;
        }

        this._resetNotes();
        this._setModeName();
    }

    /**
     * @private
     * @returns {Array<number>}
     */
    _calculateMode() {
        const currentMode = [];
        let j = 1;
        for (let i = 1; i < this._selectedNotes.length; i++) {
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

    /**
     * @private
     * @returns {void}
     */
    _setModeName() {
        const table = docById("modeTable");
        const n = table.rows.length - 1;
        const currentMode = JSON.stringify(this._calculateMode());
        const currentKey = keySignatureToMode(this.turtles.ithTurtle(0).singer.keySignature)[0];

        for (const mode in MUSICALMODES) {
            if (JSON.stringify(MUSICALMODES[mode]) === currentMode) {
                // Update the value of the modename block inside of
                // the mode widget block.
                if (this._modeBlock !== null) {
                    for (const i in this.blocks.blockList) {
                        if (this.blocks.blockList[i].name === "modename") {
                            this.blocks.blockList[i].value = mode;
                            this.blocks.blockList[i].text.text = _(mode);
                            this.blocks.blockList[i].updateCache();
                        } else if (this.blocks.blockList[i].name === "notename") {
                            this.blocks.blockList[i].value = currentKey;
                            this.blocks.blockList[i].text.text = _(currentKey);
                        }
                    }
                    this.refreshCanvas();
                }

                const name = currentKey + " " + _(mode);
                table.rows[n].cells[0].textContent = name;
                this.widgetWindow.updateTitle(name);
                return;
            }
        }

        // console.debug('setModeName:' + 'not found');
        table.rows[n].cells[0].textContent = "";
        this.widgetWindow.updateTitle("");
    }

    /**
     * @private
     * @returns {void}
     */
    _save() {
        // An empty wheel would emit an action block whose child-flow
        // connection points to a block index that does not exist, which
        // crashes Blocks.loadNewBlocks (blocks.js:5254). Bail instead.
        if (!this._selectedNotes.some(Boolean)) {
            this.errorMsg(_("Select at least one note to save a mode."), null);
            return;
        }

        const inputValue = this._modeNameInput && this._modeNameInput.value;
        const modeName = (inputValue && inputValue.trim()) || _("custom");
        const modeKey = modeName.toLowerCase();
        const pattern = this._calculateMode();
        const edo = this._activeEDO;

        // Persist the EDO-step pattern so the "custom" mode survives a reload.
        // Only write when the name field is empty (the unnamed built-in custom
        // mode) or the mode is explicitly named "custom" so that saving a named
        // mode (e.g. "blues") does not silently overwrite the persisted pattern.
        if (!(inputValue && inputValue.trim()) || modeKey === "custom") {
            this.storage.custommode = JSON.stringify(pattern);
        }

        // Register the mode in the global dictionary and the user-mode ledger
        // (mirroring what the define-mode block does at run time) so it shows
        // up in the saved-modes ledger and survives the widget reopening.
        MUSICALMODES[modeKey] = pattern;
        if (typeof registerUserMode === "function") {
            registerUserMode(modeName);
        }
        this._renderSavedModes();

        // Emit an action block so the user can trigger the mode by name.
        // For 12 EDO the pitches use solfege names (do, re, mi…); for other
        // EDOs the pitches use raw pitch-number blocks.
        const actionStack = [];

        let previousBlock = 0;

        if (edo === 12) {
            // 12-EDO: emit an action block with solfege pitch children.
            actionStack.push(
                [0, ["action", { collapsed: true }], 150, 100, [null, 1, 2, null]],
                [1, ["text", { value: modeName }], 0, 0, [0]]
            );

            const numSelected = this._selectedNotes.filter(Boolean).length;
            let p = 0;

            for (let j = 0; j < 12; j++) {
                if (!this._selectedNotes[j]) {
                    continue;
                }

                p += 1;
                const pitch = NOTESTABLE[(j + 1) % 12];
                const octave = 4;

                const pitchidx = actionStack.length;
                const notenameidx = pitchidx + 1;
                const octaveidx = pitchidx + 2;

                if (p === numSelected) {
                    actionStack.push([
                        pitchidx,
                        "pitch",
                        0,
                        0,
                        [previousBlock, notenameidx, octaveidx, null]
                    ]);
                } else {
                    actionStack.push([
                        pitchidx,
                        "pitch",
                        0,
                        0,
                        [previousBlock, notenameidx, octaveidx, pitchidx + 3]
                    ]);
                }
                actionStack.push([notenameidx, ["solfege", { value: pitch }], 0, 0, [pitchidx]]);
                actionStack.push([octaveidx, ["number", { value: octave }], 0, 0, [pitchidx]]);
                previousBlock = pitchidx;
            }
        } else {
            // Non-12 EDO: emit an action block with pitchnumber children
            // (raw EDO step values). The solfege names only cover 12 notes,
            // so pitchnumber blocks are used for arbitrary EDOs.
            actionStack.push(
                [0, ["action", { collapsed: true }], 150, 100, [null, 1, 2, null]],
                [1, ["text", { value: modeName }], 0, 0, [0]]
            );

            this._appendPitchNumberChain(actionStack, 0);
        }

        this.blocks.loadNewBlocks(actionStack);
        this.textMsg(_("New action block generated."), 3000);

        // Emit a define-mode block stack: the mode name comes from the naming
        // field and the children are the raw EDO pitch numbers selected on the
        // wheel. For non-12 EDOs the stack is prefixed with a set-temperament
        // block so the mode carries its own tuning. The pitch numbers are raw
        // EDO steps, so without it they would be parsed against the project's
        // current temperament and truncated with an out-of-range warning.
        const defineStack = [];

        if (edo !== 12) {
            // Prefer the currently active temperament so a non-EDO tuning
            // (e.g. 1/3 comma meantone, which also has 19 steps) is not saved
            // as its equal-division counterpart.
            const activeKey = this._getActiveTemperament();
            const temperamentEntry =
                this._getEdoList().find(e => e.key === activeKey) ||
                this._getEdoList().find(e => Number.isFinite(e.edo) && e.edo === edo);
            const temperament = temperamentEntry ? temperamentEntry.key : "equal";
            const startParsed = parseNoteString(
                this.logo && this.logo.synth && this.logo.synth.startingPitch
                    ? this.logo.synth.startingPitch
                    : "C4"
            );
            const pitch = startParsed[0] || "C";
            const octave = Number.isFinite(startParsed[1]) ? startParsed[1] : 4;

            defineStack.push(
                [0, "settemperament", 150, 150, [null, 1, 2, 3, 4]],
                [1, ["temperamentname", { value: temperament }], 0, 0, [0]],
                [2, ["notename", { value: pitch }], 0, 0, [0]],
                [3, ["number", { value: octave }], 0, 0, [0]]
            );
        }

        const definemodeBlock = defineStack.length;
        defineStack.push(
            [
                definemodeBlock,
                [
                    "definemode",
                    {
                        collapsed: true
                    }
                ],
                150,
                150,
                [
                    defineStack.length > 0 ? 0 : null,
                    definemodeBlock + 1,
                    definemodeBlock + 3,
                    definemodeBlock + 2
                ]
            ],
            [
                definemodeBlock + 1,
                [
                    "text",
                    {
                        value: modeName
                    }
                ],
                0,
                0,
                [definemodeBlock]
            ],
            [definemodeBlock + 2, "hidden", 0, 0, [definemodeBlock, null]]
        );
        this._appendPitchNumberChain(defineStack, definemodeBlock);

        // Load the define-mode stack only after the action stack has fully
        // rendered. loadNewBlocks is chunked via requestAnimationFrame, and
        // loading two stacks in the same tick lets the second call capture a
        // stale blockOffset/_loadCounter while the first is still mid-load,
        // so the block indices collide and the stacks render disconnected.
        this._setTimeout(() => {
            this.blocks.loadNewBlocks(defineStack);
        }, 2000);
    }

    /**
     * Append a chain of pitchnumber blocks, one per selected note, to the
     * given stack. Each block carries a number child with the raw EDO step
     * and connects to the previous block in the stack. Returns the index of
     * the last block appended so callers can chain further blocks onto it.
     *
     * @private
     * @param {Array} stack - the block stack to append to
     * @param {number} previousBlock - index of the block the first pitchnumber connects to
     * @returns {number} index of the last appended block
     */
    _appendPitchNumberChain(stack, previousBlock) {
        const numSelected = this._selectedNotes.filter(Boolean).length;
        let p = 0;

        for (let i = 0; i < this._selectedNotes.length; i++) {
            if (!this._selectedNotes[i]) {
                continue;
            }

            p += 1;
            const idx = stack.length;

            if (p === numSelected) {
                stack.push([idx, "pitchnumber", 0, 0, [previousBlock, idx + 1, null]]);
            } else {
                stack.push([idx, "pitchnumber", 0, 0, [previousBlock, idx + 1, idx + 2]]);
            }

            stack.push([idx + 1, ["number", { value: i }], 0, 0, [idx]]);
            previousBlock = idx;
        }

        return previousBlock;
    }

    /**
     * @private
     * @returns {void}
     */
    _piemenuMode() {
        // pie menu for mode definition

        docById("meterWheelDiv").style.display = "";

        // Determine the active EDO from the temperament context. Every slice
        // count, arc angle (360/N), and loop boundary below is derived from
        // this value so non-12 EDOs render correctly.
        this._activeEDO = this._getActiveEDO();

        this._buildWheels(this._activeEDO);

        // Context Pre-load: read mode string from block context and apply pattern
        this._loadModeFromBlockContext();
    }

    /**
     * Build (or rebuild) the three wheel instances for a given EDO.
     *
     * The mode wheel holds one numbered slice per scale degree, the note
     * wheel shows the selected degrees as "x" markers, and the play wheel is
     * the playback highlight ring. All three live on the same Raphael paper.
     *
     * @private
     * @param {number} activeEDO - number of slices (scale degrees)
     * @returns {void}
     */
    _buildWheels(activeEDO) {
        // Use advanced constructor for multiple wheelnavs in the same div.
        // Tear down any previous wheel first: removeWheel removes the shared
        // Raphael paper (and with it the note/play wheels drawn on top).
        if (this._modeWheel && typeof this._modeWheel.removeWheel === "function") {
            this._modeWheel.removeWheel();
        }

        // The meterWheel is used to hold the half steps.
        this._modeWheel = new wheelnav("meterWheelDiv", null, 400, 400);
        // The selected notes are shown on this wheel
        this._noteWheel = new wheelnav("_noteWheel", this._modeWheel.raphael);
        // Play wheel is to show which note is playing at any one time.
        this._playWheel = new wheelnav("_playWheel", this._modeWheel.raphael);

        wheelnav.cssMeter = true;

        // Use the mode wheel color scheme
        this._modeWheel.colors = platformColor.modeWheelcolors;

        this._modeWheel.slicePathFunction = slicePath().DonutSlice;
        this._modeWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._modeWheel.slicePathCustom.minRadiusPercent = 0.4;
        this._modeWheel.slicePathCustom.maxRadiusPercent = 0.75;
        this._modeWheel.sliceSelectedPathCustom = this._modeWheel.slicePathCustom;
        this._modeWheel.sliceInitPathCustom = this._modeWheel.slicePathCustom;

        // Disable rotation, set navAngle and create the menus
        this._modeWheel.clickModeRotate = false;
        this._modeWheel.navAngle = -90;
        // this._modeWheel.selectedNavItemIndex = 2;
        this._modeWheel.animatetime = 0; // 300;

        // ─── 2. Mode wheel: one numbered slice per scale degree ───
        // wheelnav derives each sector arc angle as 360 / N automatically.
        //
        // wheelnav's default titleFont is a fixed 48px, which is far too
        // large for the two-digit degree labels once N grows past 12 (e.g.
        // 19-, 21-, or 31-EDO). Scale the font so a two-digit label stays
        // within its sector arc width at the title radius. The 580 constant
        // preserves the 48px default for N = 12 and shrinks the font as N
        // increases; 10px is the readability floor.
        const modeLabels = [];
        for (let i = 0; i < activeEDO; i++) {
            modeLabels.push(String(i));
        }

        const titleFontSize = Math.min(48, Math.max(10, Math.floor(580 / activeEDO)));
        this._modeWheel.titleFont = "400 " + titleFontSize + "px Times New Roman";

        this._modeWheel.createWheel(modeLabels);

        this._noteWheel.colors = platformColor.noteValueWheelcolors; // modeWheelcolors;
        this._noteWheel.slicePathFunction = slicePath().DonutSlice;
        this._noteWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._noteWheel.slicePathCustom.minRadiusPercent = 0.75;
        this._noteWheel.slicePathCustom.maxRadiusPercent = 0.9;
        this._noteWheel.sliceSelectedPathCustom = this._noteWheel.slicePathCustom;
        this._noteWheel.sliceInitPathCustom = this._noteWheel.slicePathCustom;
        this._noteWheel.clickModeRotate = false;
        this._noteWheel.navAngle = -90;
        this._noteWheel.titleRotateAngle = 90;

        // ─── 3. Note wheel: starts blank; root toggled by clicking " " ───
        const noteList = [" "]; // No X on first note, since we don't want to unselect it.
        this._selectedNotes = new Array(activeEDO).fill(false);
        // Note 0 (the tonic) is always part of the mode: it can never be toggled off.
        this._selectedNotes[0] = true;
        for (let i = 1; i < activeEDO; i++) {
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

        // ─── 4. Play wheel: playback highlight ring, all slices hidden ───
        const playNoteList = [];
        for (let i = 0; i < activeEDO; i++) {
            playNoteList.push(" ");
        }

        this._playWheel.createWheel(playNoteList);

        for (let i = 0; i < activeEDO; i++) {
            this._playWheel.navItems[i].navItem.hide();
        }

        // Selecting a scale degree: clicking an (unselected) mode-wheel
        // sector adds that degree to the mode — the matching "x" appears in
        // the outer note ring as the persistent selection indicator — and
        // previews its pitch so the sound matches the wedge that was clicked.
        const __setNote = () => {
            const i = this._modeWheel.selectedNavItemIndex;
            if (i === 0) {
                return; // Note 0 is always locked - cannot be toggled off.
            }
            this._saveState();
            this._selectedNotes[i] = true;
            this._noteWheel.navItems[i].navItem.show();
            this._playNote(i);
            this._setModeName();
        };

        // Deselecting a scale degree: clicking the "x" on the outer note ring
        // removes that degree from the mode. No sound is played so the audio
        // preview remains associated only with the select action above.
        const __clearNote = () => {
            const i = this._noteWheel.selectedNavItemIndex;
            if (i === 0) {
                return; // Never hide the first note.
            }

            this._noteWheel.navItems[i].navItem.hide();
            this._saveState();
            this._selectedNotes[i] = false;
            this._setModeName();
        };

        for (let i = 0; i < activeEDO; i++) {
            this._modeWheel.navItems[i].navigateFunction = __setNote;
            this._noteWheel.navItems[i].navigateFunction = __clearNote;
            // Start with a blank slate: every slice hidden until it is
            // selected by the user or a loaded mode.
            this._noteWheel.navItems[i].navItem.hide();
        }
    }

    /**
     * Get the EDO systems defined in TEMPERAMENT, sorted ascending.
     *
     * Both the "equal*" presets and any user-added EDOs appear here; the
     * selector is intentionally built from real temperaments rather than a
     * hardcoded list so unsupported EDOs are never offered.
     *
     * @private
     * @returns {Array<{edo: number, key: string}>}
     */
    _getEdoList() {
        const list = [];
        for (const key in TEMPERAMENT) {
            const t = TEMPERAMENT[key];
            if (!t) continue;
            // Exclude "custom" - it's a special user-defined temperament
            if (key === "custom") continue;
            // Include all temperaments that have a defined pitchNumber or edo
            // EDO systems have isEDO=true and pitchNumber/edo
            // Non-EDO systems (just intonation, Pythagorean, meantone) have pitchNumber but isEDO=false
            const edo = t.pitchNumber || t.edo;
            if (edo) {
                list.push({ edo: edo, key: key, isEDO: !!t.isEDO });
            }
        }

        return list.sort((a, b) => a.edo - b.edo);
    }

    /**
     * @private
     * @returns {void}
     */
    _populateEdoSelect() {
        this._edoSelect.replaceChildren();
        for (const entry of this._getEdoList()) {
            const option = document.createElement("option");
            option.value = entry.key;
            // Show "12-EDO" for EDO systems, "Just Intonation (12)" for non-EDO
            const label = entry.isEDO
                ? String(entry.edo) + "-EDO"
                : entry.key + " (" + String(entry.edo) + ")";
            option.textContent = label;
            this._edoSelect.append(option);
        }

        const activeKey = this._getActiveTemperament();
        const activeEntry = this._getEdoList().find(e => e.key === activeKey);
        this._edoSelect.value = activeEntry ? activeEntry.key : String(this._activeEDO);
    }

    /**
     * Rebuild the saved-modes ledger at the bottom of the widget.
     *
     * One row per registered user mode, each with a Load button (applies the
     * stored step pattern to the wheel) and a Delete button (purges the mode
     * from memory and the registry). The ledger is hidden while empty.
     *
     * @private
     * @returns {void}
     */
    _renderSavedModes() {
        const names = getUserModeNames();
        this._savedModesContainer.replaceChildren();
        if (names.length === 0) {
            this._savedModesContainer.style.display = "none";
            return;
        }

        this._savedModesContainer.style.display = "block";

        const heading = document.createElement("div");
        heading.textContent = _("Saved Modes");
        heading.style.fontWeight = "bold";
        heading.style.fontSize = "14px";
        heading.style.padding = "0 0 4px 0";
        this._savedModesContainer.append(heading);

        for (const name of names) {
            const row = document.createElement("div");
            row.className = "saved-mode-row";
            row.style.display = "flex";
            row.style.alignItems = "center";
            row.style.justifyContent = "space-between";
            row.style.gap = "8px";
            row.style.padding = "4px 8px";
            row.style.borderTop = "1px solid " + platformColor.selectorBackground;

            const nameLabel = document.createElement("span");
            nameLabel.textContent = name;
            nameLabel.style.flex = "1";
            nameLabel.style.overflow = "hidden";
            nameLabel.style.textOverflow = "ellipsis";
            nameLabel.style.whiteSpace = "nowrap";

            const loadButton = document.createElement("button");
            loadButton.textContent = _("Load");
            loadButton.title = _("Load mode onto the wheel");
            loadButton.onclick = () => {
                const pattern = MUSICALMODES[name];
                if (pattern) {
                    this._applyPattern(pattern);
                }
            };

            const deleteButton = document.createElement("button");
            deleteButton.textContent = _("Delete");
            deleteButton.title = _("Delete mode");
            deleteButton.onclick = () => this._deleteSavedMode(name);

            row.append(nameLabel, loadButton, deleteButton);
            this._savedModesContainer.append(row);
        }
    }

    /**
     * Delete a saved mode.
     *
     * Removes the mode from the global user-mode registry and from
     * MUSICALMODES, then re-renders the ledger. Deleting the default "custom"
     * mode also resets its pattern (in memory and in storage) to a default
     * chromatic scale so a reload does not resurrect a deleted mode.
     *
     * @private
     * @param {string} name - the mode name to delete
     * @returns {void}
     */
    _deleteSavedMode(name) {
        if (typeof removeUserMode === "function") {
            removeUserMode(name);
        }
        delete MUSICALMODES[name];

        if (name === "custom") {
            MUSICALMODES["custom"] = new Array(this._activeEDO).fill(1);
            this.storage.custommode = JSON.stringify(MUSICALMODES["custom"]);
        }

        this._renderSavedModes();
        this._setModeName();
    }

    /**
     * Switch the widget to a different EDO.
     *
     * Applies the matching temperament globally (via setUserTemperament) so
     * the wheel slice count, the note preview, and the runtime temperaments
     * all agree, resets the default custom mode to the new octave division,
     * rebuilds the wheels, and syncs the "Tuning" dropdown to the new value.
     * The wheel is left blank: steps are only shown once the user clicks a
     * slice or loads a saved mode via _applyPattern().
     *
     * @private
     * @param {string|number} keyOrEdo - temperament key (e.g. "equal19") or EDO value
     * @returns {void}
     */
    _setActiveEDO(keyOrEdo) {
        // EDO Switch Mapping: cache the current interval array, set new EDO,
        // and map selected positions proportionally.
        const oldEDO = this._activeEDO;
        const oldSelectedNotes = this._selectedNotes
            ? this._selectedNotes.slice()
            : new Array(12).fill(false);

        const edoList = this._getEdoList();
        const entry =
            typeof keyOrEdo === "string"
                ? edoList.find(e => e.key === keyOrEdo)
                : edoList.find(e => Number.isFinite(e.edo) && e.edo === keyOrEdo);
        if (!entry) {
            return;
        }

        if (this.logo && typeof this.logo.setUserTemperament === "function") {
            this.logo.setUserTemperament(entry.key);
        }

        if (MUSICALMODES["custom"] && MUSICALMODES["custom"].length !== entry.edo) {
            MUSICALMODES["custom"] = new Array(entry.edo).fill(1);
        }

        this._activeEDO = entry.edo;
        // For non-EDO temperaments, the wheel geometry uses the pitchNumber
        // as slice count (e.g., 12 for just intonation, 19 for 1/3 comma meantone).
        // EDO systems use their natural step count.
        // Proportionally map the previously selected notes to the new EDO.
        const newSelectedNotes = new Array(this._activeEDO).fill(false);
        for (let i = 0; i < Math.min(oldSelectedNotes.length, this._activeEDO); i++) {
            if (oldSelectedNotes[i]) {
                const newPos = Math.round((i * this._activeEDO) / oldEDO);
                if (newPos < this._activeEDO) {
                    newSelectedNotes[newPos] = true;
                }
            }
        }
        this._selectedNotes = newSelectedNotes;

        this._buildWheels(entry.edo);
        this._populateEdoSelect();
        this._setModeName();
    }

    /**
     * Apply a step pattern (from MUSICALMODES) to the wheel.
     *
     * The pattern's steps sum to the EDO it was defined on. Loading a mode
     * from a different tuning system than the one currently selected forces
     * the widget over to the mode's EDO first: _setActiveEDO() rebuilds the
     * wheels for the new slice count, applies the matching global
     * temperament, and syncs the "Tuning" <select> (via _populateEdoSelect)
     * before the pattern is drawn onto the note ring.
     *
     * @private
     * @param {Array<number>} pattern - step pattern, e.g. [2, 2, 1, 2, 2, 2, 1]
     * @returns {void}
     */
    _applyPattern(pattern) {
        const N = pattern.reduce((sum, step) => sum + step, 0);
        if (N !== this._activeEDO) {
            this._setActiveEDO(N);
        }

        // If the mode's EDO is not available in TEMPERAMENT, _setActiveEDO
        // bails out without rebuilding; keep the previous geometry rather than
        // drawing onto a wheel of the wrong slice count.
        if (N !== this._activeEDO) {
            return;
        }

        this._selectedNotes = new Array(N).fill(false);
        let k = 0;
        let j = 0;
        for (let i = 0; i < N; i++) {
            if (i === j) {
                this._noteWheel.navItems[i].navItem.show();
                this._selectedNotes[i] = true;
                j += pattern[k];
                k += 1;
            } else {
                this._noteWheel.navItems[i].navItem.hide();
            }
        }

        this._setModeName();
    }

    /**
     * Pre-load the mode pattern from the block context that launched the
     * widget.
     *
     * When the widget is opened from a "set key [C] mode [jazz minor]"
     * block (via the "custom" slice of the mode pie menu), the mode name
     * is passed along by the launcher so the wheel is populated with the
     * current steps and the mode-name input is pre-filled.
     *
     * @private
     * @returns {void}
     */
    _loadModeFromBlockContext() {
        const mode = this._deps.mode || this._modeBlock;
        if (mode && MUSICALMODES[mode]) {
            this._applyPattern(MUSICALMODES[mode]);
        }
    }

    /**
     * Apply a step pattern (from MUSICALMODES) to the wheel.
     *
     * The pattern's steps sum to the EDO it was defined on. Loading a mode
     * from a different tuning system than the one currently selected forces
     * the widget over to the mode's EDO first: _setActiveEDO() rebuilds the
     * wheels for the new slice count, applies the matching global
     */
}

if (typeof module !== "undefined") {
    module.exports = ModeWidget;
}
