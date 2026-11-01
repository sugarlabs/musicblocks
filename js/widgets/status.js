// Copyright (c) 2016-20 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget makes displays the status of selected parameters and
// notes as they are being played.

/*
   global

   _, _THIS_IS_MUSIC_BLOCKS_, MATRIXBUTTONHEIGHT, MATRIXSOLFEHEIGHT, toFixed2,
   mixedNumber, rationalToFraction, frequencyToPitch, HarmonyUtils
 */

/* exported StatusMatrix */
class StatusMatrix {
    static BUTTONDIVWIDTH = 128;
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;
    static OUTERWINDOWWIDTH = 620;
    static INNERWINDOWWIDTH = this.OUTERWINDOWWIDTH - this.BUTTONSIZE * 1.5;
    static FONTSCALEFACTOR = 75;
    // Milliseconds a note is listed in the Harmony row before it starts and
    // after it stops sounding, so the row does not flicker between notes.
    static HARMONY_GRACE = 100;

    /**
     * Initializes the status matrix. First removes the
     * previous matrix and them make another one in DOM (document
     * object model)
     */
    init(activity) {
        this.activity = activity;
        this.isOpen = true;
        this.isMaximized = false;
        this._cellScale = window.innerWidth / 1200;
        let iconSize = StatusMatrix.ICONSIZE * this._cellScale;
        this._clearHarmonyTimer();
        this._harmonyCell = null;

        this.widgetWindow = window.widgetWindows.windowFor(this, "status", "status");
        this.widgetWindow.clear();
        this.widgetWindow.show();
        // For the button callbacks
        let cell;

        // The status table
        this._statusTable = document.createElement("table");
        this.widgetWindow.getWidgetBody().append(this._statusTable);
        this.widgetWindow.onclose = () => {
            this.isOpen = false;
            this._clearHarmonyTimer();
            this.widgetWindow.destroy();
        };

        // Each row in the status table contains a field label in the
        // first column and a table of values (one per mouse) in the
        // remaining columns.
        // The first row contains the mice icons.
        const header = this._statusTable.createTHead();
        const row = header.insertRow();

        iconSize = Math.floor(this._cellScale * 24);

        cell = row.insertCell();
        cell.style.backgroundColor = "#FFFFFF";
        cell.className = "headcol";
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
        // cell.style.width = StatusMatrix.BUTTONSIZE * this._cellScale*2 + "px";
        cell.style.width = "212.5px";

        cell.textContent = "\u00A0";
        // One column per mouse/turtle
        const turtleList = this.activity?.turtles?.turtleList || [];
        for (const turtle of turtleList) {
            if (turtle.inTrash) {
                continue;
            }

            cell = row.insertCell();
            cell.style.backgroundColor = "#FFFFFF";

            if (_THIS_IS_MUSIC_BLOCKS_) {
                cell.textContent = "\u00A0\u00A0";
                const img = document.createElement("img");
                img.src = "images/mouse.svg";
                img.title = turtle.name;
                img.alt = turtle.name;
                img.setAttribute("height", iconSize);
                img.setAttribute("width", iconSize);
                cell.appendChild(img);
                cell.appendChild(document.createTextNode("\u00A0\u00A0"));
            } else {
                cell.textContent = "\u00A0\u00A0";
                const img = document.createElement("img");
                img.src = "header-icons/turtle-button.svg";
                img.title = turtle.name;
                img.alt = turtle.name;
                img.setAttribute("height", iconSize);
                img.setAttribute("width", iconSize);
                cell.appendChild(img);
                cell.appendChild(document.createTextNode("\u00A0\u00A0"));
            }
            cell.style.width = "212.5px";
            // cell.style.width = StatusMatrix.BUTTONSIZE * this._cellScale*2 + "px";
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            cell.className = "headcol";
        }

        this.widgetWindow.onmaximize = () => {
            this.isMaximized = !this.isMaximized;
            const headerFontSize =
                Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR) * 0.9 + "%";
            const headerCells = this._statusTable.querySelectorAll("thead .headcol");
            headerCells.forEach(headerCell => {
                if (this.isMaximized) {
                    headerCell.style.width = "100vw";
                    headerCell.style.paddingLeft = "30px";
                    headerCell.style.fontSize = headerFontSize;
                } else {
                    headerCell.style.width = "212.5px";
                    headerCell.style.paddingLeft = "";
                    headerCell.style.fontSize = "";
                }
            });
        };

        // console.debug("active turtles: " + turtles.turtleList.length);

        const body = this._statusTable.createTBody();

        // One row per field, one column per mouse (plus the labels)
        let label;
        const statusFields = this.activity?.logo?.statusFields || [];
        const blockList = this.activity?.blocks?.blockList || {};
        for (const statusField of statusFields) {
            const row = body.insertRow();

            cell = row.insertCell(); // i + 1);
            cell.style.fontSize =
                Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR) * 0.9 + "%";

            const block = blockList[statusField[0]];

            switch (statusField[1]) {
                case "plus":
                case "minus":
                case "neg":
                case "divide":
                case "power":
                case "multiply":
                case "sqrt":
                case "int":
                case "mod":
                case "sin":
                case "cos":
                case "tan":
                case "arcsin":
                case "arccos":
                case "arctan":
                case "ln":
                case "log":
                    label = "";
                    break;
                case "namedbox":
                    label = block?.privateData || "";
                    break;
                case "heap":
                    label = _("heap");
                    break;
                case "bpm":
                case "bpmfactor":
                    if (localStorage.languagePreference === "ja") {
                        label = _("beats per minute2");
                    } else {
                        label = block?.protoblock?.staticLabels?.[0] || "";
                    }
                    break;
                case "outputtools":
                    // Do not add || "" here; label must stay undefined/null if unset
                    // so the staticLabels fallback below remains reachable.
                    label = block?.privateData;
                    if (typeof label === "object" && label !== null && label.value) {
                        label = label.value;
                    }
                    if (label === null || label === undefined) {
                        label = block?.protoblock?.staticLabels?.[0] || "";
                    }
                    label = _(label);
                    break;
                default: {
                    label = block?.protoblock?.staticLabels?.[0] || "";
                    break;
                }
            }

            const str =
                typeof label === "string" && label.length > 0
                    ? label.charAt(0).toUpperCase() + label.slice(1)
                    : "";

            const selectorBg = "var(--color-selector-bg)";
            const selectorText = "var(--color-selector-text)";
            cell.textContent = "\u00A0";
            const b = document.createElement("b");
            b.textContent = str;
            cell.appendChild(b);
            cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
            cell.style.backgroundColor = selectorBg;
            cell.style.color = selectorText;
            cell.style.paddingLeft = "10px";
            for (const turtle of turtleList) {
                if (turtle.inTrash) {
                    continue;
                }
                cell = row.insertCell();
                cell.style.backgroundColor = selectorBg;
                cell.style.color = selectorText;
                cell.style.fontSize =
                    Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR) * 0.9 + "%";
                cell.textContent = "";
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.textAlign = "center";
            }
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            const selectorBg = "var(--color-selector-bg)";
            const selectorText = "var(--color-selector-text)";
            const row = body.insertRow();
            cell = row.insertCell();
            cell.style.fontSize =
                Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR) * 0.9 + "%";
            const str = _("note");
            const label = str.charAt(0).toUpperCase() + str.slice(1);
            cell.textContent = "\u00A0";
            const b = document.createElement("b");
            b.textContent = label;
            cell.appendChild(b);
            cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
            cell.style.backgroundColor = selectorBg;
            cell.style.color = selectorText;
            cell.style.paddingLeft = "10px";
            for (const turtle of turtleList) {
                if (turtle.inTrash) {
                    continue;
                }
                cell = row.insertCell();
                cell.style.backgroundColor = selectorBg;
                cell.style.color = selectorText;
                cell.style.fontSize =
                    Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR) * 0.9 + "%";
                cell.textContent = "";
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.textAlign = "center";
            }

            // The chord and intervals sounding across all the mice, in one wide cell.
            const harmonyRow = body.insertRow();
            cell = harmonyRow.insertCell();
            cell.style.fontSize =
                Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR) * 0.9 + "%";
            const harmonyStr = _("harmony");
            cell.textContent = "\u00A0";
            const harmonyLabel = document.createElement("b");
            harmonyLabel.textContent = harmonyStr.charAt(0).toUpperCase() + harmonyStr.slice(1);
            cell.appendChild(harmonyLabel);
            cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
            cell.style.backgroundColor = selectorBg;
            cell.style.color = selectorText;
            cell.style.paddingLeft = "10px";

            this._harmonyCell = harmonyRow.insertCell();
            this._harmonyCell.colSpan = Math.max(
                1,
                turtleList.filter(turtle => !turtle.inTrash).length
            );
            this._harmonyCell.style.backgroundColor = selectorBg;
            this._harmonyCell.style.color = selectorText;
            this._harmonyCell.style.fontSize =
                Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR) * 0.9 + "%";
            this._harmonyCell.style.textAlign = "center";
            this._shownHarmony = null;
        }
        this.widgetWindow.sendToCenter();
    }

    /**
     * @public
     * @returns {void}
     */
    updateAll() {
        if (!this.isOpen || !this._statusTable) {
            return;
        }

        // The interpreter calls this after every executed block; coalesce
        // those requests into at most one DOM render per animation frame.
        if (this._updateQueued) {
            return;
        }
        this._updateQueued = true;

        const render = () => {
            this._updateQueued = false;
            this._renderAll();
        };

        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(render);
        } else {
            // 100 ms is still shorter than a typical 1/16th note, so no
            // audible-note state change is skipped in rAF-less environments.
            setTimeout(render, 100);
        }
    }

    _renderAll() {
        // The widget may have closed between scheduling and the frame firing.
        if (!this.isOpen || !this._statusTable) {
            return;
        }

        // Update status of all of the voices in the matrix.
        if (this.activity?.logo) {
            this.activity.logo.updatingStatusMatrix = true;
        }

        let activeTurtles = 0;
        let cell;
        const turtleList = this.activity?.turtles?.turtleList || [];
        const blockList = this.activity?.blocks?.blockList || {};
        const statusFields = this.activity?.logo?.statusFields || [];

        for (let t = 0; t < turtleList.length; t++) {
            const turtle = turtleList[t];
            const tur = this.activity?.turtles?.ithTurtle
                ? this.activity.turtles.ithTurtle(t)
                : turtle;
            if (turtle?.inTrash) {
                continue;
            }

            let saveStatus;
            let blk, cblk;
            let name;
            let value;
            let notes;
            let noteValue;
            let freq;
            let i = 0;
            for (const statusField of statusFields) {
                const block = blockList[statusField[0]];
                if (!block) {
                    cell = this._statusTable.rows?.[i + 1]?.cells?.[activeTurtles + 1];
                    if (cell !== null && cell !== undefined) {
                        cell.textContent = "";
                    }
                    i++;
                    continue;
                }

                saveStatus = this.activity?.logo?.inStatusMatrix;
                if (this.activity?.logo) {
                    this.activity.logo.inStatusMatrix = false;
                    if (typeof this.activity.logo.parseArg === "function") {
                        this.activity.logo.parseArg(this.activity.logo, t, statusField[0]);
                    }
                }

                switch (block.name) {
                    case "x":
                    case "y":
                    case "heading":
                        value = typeof block.value === "number" ? block.value.toFixed(0) : "";
                        break;
                    case "mynotevalue":
                        value = mixedNumber(block.value);
                        break;
                    case "elapsednotes2":
                        blk = statusField[0];
                        cblk = block.connections?.[1];
                        noteValue =
                            cblk !== undefined &&
                            cblk !== null &&
                            typeof this.activity?.logo?.parseArg === "function"
                                ? this.activity.logo.parseArg(
                                      this.activity.logo,
                                      t,
                                      cblk,
                                      blk,
                                      null
                                  )
                                : 0;
                        value = mixedNumber(block.value) + " × " + mixedNumber(noteValue);
                        break;
                    case "elapsednotes":
                        value = mixedNumber(block.value);
                        break;
                    case "namedbox":
                        name = block.privateData;
                        if (
                            name &&
                            this.activity?.logo?.boxes &&
                            name in this.activity.logo.boxes
                        ) {
                            value = this.activity.logo.boxes[name];
                        } else {
                            value = "";
                        }
                        break;
                    case "beatvalue":
                        value = tur?.singer ? mixedNumber(tur.singer.currentBeat) : "";
                        break;
                    case "measurevalue":
                        value = tur?.singer?.currentMeasure ?? "";
                        break;
                    case "pitchinhertz":
                        value = "";
                        if (tur?.singer?.noteStatus) {
                            notes = tur.singer.noteStatus[0];
                            if (Array.isArray(notes)) {
                                for (let j = 0; j < notes.length; j++) {
                                    if (j > 0) {
                                        value += " ";
                                    }
                                    freq =
                                        typeof this.activity?.logo?.synth?.getFrequency ===
                                        "function"
                                            ? this.activity.logo.synth.getFrequency(
                                                  notes[j],
                                                  this.activity.logo.synth.changeInTemperament
                                              )
                                            : null;
                                    if (typeof freq === "number") {
                                        value += freq.toFixed(2);
                                    }
                                }
                            }
                        } else {
                            value = "";
                        }
                        break;
                    case "heap":
                        value = block.value;
                        break;
                    default:
                        value = block.value;
                        break;
                }

                if (this.activity?.logo) {
                    this.activity.logo.inStatusMatrix = saveStatus;
                }

                cell = this._statusTable.rows?.[i + 1]?.cells?.[activeTurtles + 1];
                if (cell !== null && cell !== undefined) {
                    cell.textContent =
                        value === "__INVALID_INPUT__" || value === undefined || value === null
                            ? ""
                            : value;
                }
                i++;
            }

            let obj;
            let note;
            if (_THIS_IS_MUSIC_BLOCKS_) {
                note = "";
                value = "";
                if (tur?.singer?.noteStatus) {
                    notes = tur.singer.noteStatus[0];
                    if (Array.isArray(notes)) {
                        const displayedNotes = [];
                        const seenNotes = new Set();
                        for (let j = 0; j < notes.length; j++) {
                            const noteKey =
                                typeof notes[j] === "number"
                                    ? "number:" + notes[j]
                                    : "note:" + notes[j];
                            if (seenNotes.has(noteKey)) {
                                continue;
                            }

                            seenNotes.add(noteKey);
                            displayedNotes.push(notes[j]);
                        }

                        for (let j = 0; j < displayedNotes.length; j++) {
                            if (typeof displayedNotes[j] === "number") {
                                note += toFixed2(displayedNotes[j]);
                                note += "Hz ";
                            } else {
                                note += displayedNotes[j];
                                note += " ";
                            }
                        }
                    }

                    value = tur.singer.noteStatus[1];
                    if (value !== undefined && value !== null) {
                        obj = rationalToFraction(value);
                        if (obj && obj.length >= 2) {
                            // noteStatus[1] stores noteBeatValue (1 / duration, e.g. 4 for quarter note,
                            // 2 for half note, 8/3 for dotted quarter). rationalToFraction(noteBeatValue)
                            // returns [numerator, denominator], so the duration fraction (1 / beatValue)
                            // is denominator / numerator (obj[1] / obj[0]).
                            note += obj[1] + "/" + obj[0];
                        }
                    }
                }

                cell = this._statusTable.rows?.[i + 1]?.cells?.[activeTurtles + 1];
                if (cell !== null && cell !== undefined) {
                    cell.textContent = note.replace(/#/g, "♯").replace(/b/g, "♭");
                }
            }

            activeTurtles += 1;
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            this._renderHarmony();
        }

        if (this.activity?.logo) {
            this.activity.logo.updatingStatusMatrix = false;
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _clearHarmonyTimer() {
        if (this._harmonyTimer) {
            clearTimeout(this._harmonyTimer);
            this._harmonyTimer = null;
        }
    }

    /**
     * Collects the pitches the mice are sounding now.
     * @private
     * @returns {{notes: Array<string|number>, nextChange: number}} The note names
     *     (e.g. "E4") or frequencies, and the time (ms) at which that set next changes.
     */
    _soundingNotes() {
        const notes = [];
        let nextChange = Infinity;
        if (this.activity?.logo?.stopTurtle) {
            return { notes, nextChange };
        }

        const now = Date.now();
        const grace = StatusMatrix.HARMONY_GRACE;
        const turtleList = this.activity?.turtles?.turtleList || [];
        for (let t = 0; t < turtleList.length; t++) {
            const tur = this.activity.turtles.ithTurtle
                ? this.activity.turtles.ithTurtle(t)
                : turtleList[t];
            const singer = tur?.singer;
            if (turtleList[t]?.inTrash || !singer?.pitchStatus) {
                continue;
            }

            for (const sound of singer.pitchStatus) {
                // A rest or a drum-only note moves previousTurtleTime past the
                // start of the last pitched notes, so they are no longer sounding.
                if (sound.start !== singer.previousTurtleTime) {
                    continue;
                }
                if (now < sound.startsAt - grace) {
                    nextChange = Math.min(nextChange, sound.startsAt - grace);
                } else if (now <= sound.endsAt + grace) {
                    notes.push(...sound.notes);
                    nextChange = Math.min(nextChange, sound.endsAt + grace);
                }
            }
        }
        return { notes, nextChange };
    }

    /**
     * Translated name of an interval, e.g. "major 3 + 1 octave".
     * @private
     * @param {Object} interval - An entry of HarmonyUtils.analyze().intervals.
     * @returns {string}
     */
    _intervalName(interval) {
        let name;
        if (interval.name === "perfect 1") {
            name = _("unison");
        } else if (interval.name === "perfect 8") {
            name = _("octave");
        } else {
            const [quality, number] = interval.name.split(" ");
            name = _(quality) + " " + number;
        }

        if (interval.octaves > 0) {
            name += " + " + interval.octaves + " " + _("octave");
        }
        return name;
    }

    /**
     * Shows the chord and the interval from the lowest sounding note to each
     * other one, with the just ratio, the played ratio and the difference.
     * @private
     * @returns {void}
     */
    _renderHarmony() {
        if (!this._harmonyCell || typeof HarmonyUtils === "undefined") {
            return;
        }

        const synth = this.activity?.logo?.synth;
        const { notes, nextChange } = this._soundingNotes();

        // The interpreter only refreshes the Status between blocks, so refresh
        // again when a note starts or stops in between (e.g. a staccato note).
        this._clearHarmonyTimer();
        if (nextChange !== Infinity) {
            this._harmonyTimer = setTimeout(
                () => this.updateAll(),
                Math.max(0, nextChange - Date.now())
            );
        }

        const key = (synth?.inTemperament || "") + "|" + notes.join("|");
        if (key === this._shownHarmony) {
            return;
        }
        this._shownHarmony = key;
        this._harmonyCell.textContent = "";

        if (!synth || typeof synth.getFrequency !== "function") {
            return;
        }

        const analysis = HarmonyUtils.analyze(
            notes.map(note => ({
                label: typeof note === "number" ? toFixed2(note) + "Hz" : note,
                frequency: synth.getFrequency(note, synth.changeInTemperament)
            }))
        );
        if (analysis.intervals.length === 0) {
            return;
        }

        if (analysis.chord) {
            const root = analysis.voices.find(voice => voice.label === analysis.chord.root);
            const rootName =
                typeof root.label === "string" && !root.label.endsWith("Hz")
                    ? root.label.replace(/-?\d+$/, "")
                    : frequencyToPitch(root.frequency)[0];
            const chord = document.createElement("div");
            chord.style.fontWeight = "bold";
            chord.textContent = rootName + " " + _(analysis.chord.name);
            this._harmonyCell.appendChild(chord);
        }

        const table = document.createElement("table");
        table.style.margin = "0 auto";
        const header = document.createElement("tr");
        for (const label of [
            _("notes"),
            _("interval"),
            //.TRANS: the frequency ratio of the interval in just intonation, e.g. 5:4
            _("just ratio"),
            //.TRANS: the frequency ratio of the interval as it is actually played
            _("played ratio"),
            //.TRANS: how far the played interval is from its just-intonation ratio, in cents
            _("cents from just")
        ]) {
            const th = document.createElement("th");
            th.textContent = label;
            th.style.padding = "2px 6px";
            th.style.whiteSpace = "nowrap";
            header.appendChild(th);
        }
        table.appendChild(header);

        for (const interval of analysis.intervals) {
            const [numerator, denominator] = rationalToFraction(interval.ideal);
            // Avoid showing "-0.0" for an exactly tuned interval.
            const cents = Math.abs(interval.cents) < 0.05 ? "0.0" : interval.cents.toFixed(1);
            const row = document.createElement("tr");
            for (const value of [
                interval.from + " → " + interval.to,
                this._intervalName(interval),
                numerator + ":" + denominator,
                interval.played.toFixed(3),
                interval.cents > 0 ? "+" + cents : cents
            ]) {
                const td = document.createElement("td");
                td.textContent = value;
                td.style.padding = "2px 6px";
                td.style.whiteSpace = "nowrap";
                row.appendChild(td);
            }
            table.appendChild(row);
        }
        this._harmonyCell.appendChild(table);
    }
}
if (typeof module !== "undefined") {
    module.exports = StatusMatrix;
}
