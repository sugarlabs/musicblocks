// Copyright (c) 2025 Elwin Li
// Copyright (c) 2026 Walter Bender
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
 * @file MIDI Upload Widget for Music Blocks.
 *
 * Provides a drag-and-drop interface for importing MIDI files and converting
 * them to Music Blocks. Users can preview track information (instruments,
 * note counts) before importing, and configure the maximum number of note
 * blocks to generate.
 *
 * Dependencies:
 *     - js/midi.js: transcribeMidi (converts parsed MIDI to Music Blocks)
 *     - lib/midi.js: Midi class (@tonejs/midi, parses raw MIDI data)
 *     - js/widgets/widgetWindows.js: WidgetWindow (widget chrome)
 *     - js/utils/utils.js: _, docById
 *
 * @author Elwin Li (original concept)
 * @author Ashutosh Karnatak (Phase 1 rewrite)
 */

/* global _, Midi, transcribeMidi */

/* exported MidiWidget */

class MidiWidget {
    static ICON_SIZE = 32;
    static DEFAULT_MAX_BLOCKS = 600;
    static MIN_BLOCKS = 100;
    static MAX_BLOCKS = 2400;
    static BLOCK_STEP = 100;

    /**
     * @param {object} activity - The main Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
        this.isOpen = true;
        this._parsedMidi = null;
        this._maxNoteBlocks = MidiWidget.DEFAULT_MAX_BLOCKS;

        this.widgetWindow = window.widgetWindows.windowFor(
            this,
            "MIDI Import",
            "MIDI Import"
        );
        this.widgetWindow.clear();
        this.widgetWindow.show();
        this.widgetWindow.sendToCenter();

        this._setup();
    }

    /**
     * Builds the widget UI inside the widget window body.
     * @private
     */
    _setup() {
        const body = this.widgetWindow.getWidgetBody();
        body.style.overflowY = "auto";
        body.innerHTML = "";

        // Main container
        const container = document.createElement("div");
        container.style.cssText =
            "padding: 16px; font-family: 'Inter', Arial, sans-serif; " +
            "color: #333; min-width: 420px; max-width: 520px;";

        // ── Drop zone ──
        this._dropZone = document.createElement("div");
        this._dropZone.id = "midi-drop-zone";
        this._dropZone.style.cssText =
            "border: 2px dashed #b0bec5; border-radius: 12px; padding: 32px 16px; " +
            "text-align: center; cursor: pointer; transition: all 0.25s ease; " +
            "background: #fafafa; margin-bottom: 16px;";

        const icon = document.createElement("div");
        icon.textContent = "🎵";
        icon.style.cssText = "font-size: 36px; margin-bottom: 8px;";

        const label = document.createElement("div");
        label.textContent = _("Drag & drop a MIDI file here");
        label.style.cssText = "font-size: 14px; color: #666; margin-bottom: 4px;";

        const sublabel = document.createElement("div");
        sublabel.textContent = _("or click to browse");
        sublabel.style.cssText = "font-size: 12px; color: #999;";

        this._dropZone.append(icon, label, sublabel);
        container.appendChild(this._dropZone);

        // Hidden file input
        this._fileInput = document.createElement("input");
        this._fileInput.type = "file";
        this._fileInput.accept = ".mid,.midi";
        this._fileInput.style.display = "none";
        container.appendChild(this._fileInput);

        // ── File info bar (hidden until file loaded) ──
        this._fileInfoBar = document.createElement("div");
        this._fileInfoBar.style.cssText =
            "display: none; align-items: center; gap: 8px; padding: 8px 12px; " +
            "background: #e8f5e9; border-radius: 8px; margin-bottom: 16px; font-size: 13px;";
        container.appendChild(this._fileInfoBar);

        // ── Track preview table (hidden until file loaded) ──
        this._trackPreview = document.createElement("div");
        this._trackPreview.style.cssText =
            "display: none; margin-bottom: 16px;";
        container.appendChild(this._trackPreview);

        // ── Max blocks slider ──
        const sliderSection = document.createElement("div");
        sliderSection.style.cssText = "margin-bottom: 16px;";

        const sliderLabel = document.createElement("label");
        sliderLabel.style.cssText =
            "display: flex; justify-content: space-between; font-size: 13px; " +
            "color: #555; margin-bottom: 6px;";
        sliderLabel.innerHTML =
            `<span>${_("Max note blocks")}</span><span id="midi-slider-value">${this._maxNoteBlocks}</span>`;

        this._slider = document.createElement("input");
        this._slider.type = "range";
        this._slider.min = MidiWidget.MIN_BLOCKS;
        this._slider.max = MidiWidget.MAX_BLOCKS;
        this._slider.step = MidiWidget.BLOCK_STEP;
        this._slider.value = this._maxNoteBlocks;
        this._slider.style.cssText = "width: 100%; accent-color: #2196f3;";

        sliderSection.append(sliderLabel, this._slider);
        container.appendChild(sliderSection);

        // ── Import button ──
        this._importBtn = document.createElement("button");
        this._importBtn.textContent = _("Import MIDI");
        this._importBtn.disabled = true;
        this._importBtn.style.cssText =
            "width: 100%; padding: 10px; border: none; border-radius: 8px; " +
            "font-size: 14px; font-weight: 600; cursor: pointer; " +
            "background: #b0bec5; color: #fff; transition: all 0.2s ease;";
        container.appendChild(this._importBtn);

        // ── Status message ──
        this._statusMsg = document.createElement("div");
        this._statusMsg.style.cssText =
            "text-align: center; font-size: 12px; color: #999; margin-top: 10px; " +
            "min-height: 18px;";
        container.appendChild(this._statusMsg);

        body.appendChild(container);

        this._bindEvents();
    }

    /**
     * Binds all interactive event handlers.
     * @private
     */
    _bindEvents() {
        // Click to browse
        this._dropZone.addEventListener("click", () => this._fileInput.click());

        // File input change
        this._fileInput.addEventListener("change", (e) => {
            if (e.target.files.length > 0) {
                this._handleFile(e.target.files[0]);
            }
        });

        // Drag & drop events
        this._dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._dropZone.style.borderColor = "#2196f3";
            this._dropZone.style.background = "#e3f2fd";
        });

        this._dropZone.addEventListener("dragleave", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._dropZone.style.borderColor = "#b0bec5";
            this._dropZone.style.background = "#fafafa";
        });

        this._dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._dropZone.style.borderColor = "#b0bec5";
            this._dropZone.style.background = "#fafafa";

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this._handleFile(files[0]);
            }
        });

        // Slider updates
        this._slider.addEventListener("input", () => {
            this._maxNoteBlocks = parseInt(this._slider.value);
            const valueDisplay = document.getElementById("midi-slider-value");
            if (valueDisplay) {
                valueDisplay.textContent = this._maxNoteBlocks;
            }
        });

        // Import button
        this._importBtn.addEventListener("click", () => this._doImport());
    }

    /**
     * Processes a dropped/selected file, validates it, and parses the MIDI.
     * @private
     * @param {File} file
     */
    _handleFile(file) {
        // Validate extension
        const ext = file.name.split(".").pop().toLowerCase();
        if (ext !== "mid" && ext !== "midi") {
            this._setStatus(_("Please select a .mid or .midi file."), "#e53935");
            return;
        }

        this._setStatus(_("Reading file…"), "#2196f3");

        const reader = new FileReader();
        reader.onerror = () => {
            this._setStatus(_("Error reading file."), "#e53935");
        };

        reader.onload = (e) => {
            try {
                this._parsedMidi = new Midi(e.target.result);
                this._showFileInfo(file.name, this._parsedMidi);
                this._showTrackPreview(this._parsedMidi);
                this._enableImport();
                this._setStatus(_("Ready to import."), "#43a047");
            } catch (err) {
                console.error("MIDI parse error:", err);
                this._setStatus(_("Invalid MIDI file."), "#e53935");
                this._parsedMidi = null;
                this._disableImport();
            }
        };

        reader.readAsArrayBuffer(file);
    }

    /**
     * Shows the file info bar with filename and basic metadata.
     * @private
     * @param {string} name
     * @param {object} midi - Parsed Midi object
     */
    _showFileInfo(name, midi) {
        const trackCount = midi.tracks.filter((t) => t.notes.length > 0).length;
        const totalNotes = midi.tracks.reduce((sum, t) => sum + t.notes.length, 0);

        let tempoStr = "—";
        if (midi.header.tempos && midi.header.tempos.length > 0) {
            tempoStr = Math.round(midi.header.tempos[0].bpm) + " BPM";
        }

        this._fileInfoBar.style.display = "flex";
        this._fileInfoBar.innerHTML =
            `<span style="font-weight:600;">📄 ${this._escapeHtml(name)}</span>` +
            `<span style="color:#666;">|</span>` +
            `<span>${trackCount} ${_("tracks")}</span>` +
            `<span style="color:#666;">|</span>` +
            `<span>${totalNotes} ${_("notes")}</span>` +
            `<span style="color:#666;">|</span>` +
            `<span>${tempoStr}</span>`;

        // Collapse the drop zone
        this._dropZone.style.padding = "12px";
        this._dropZone.innerHTML =
            `<div style="font-size:13px; color:#2196f3;">` +
            `🔄 ${_("Click to load a different file")}</div>`;
    }

    /**
     * Renders a table previewing each MIDI track.
     * @private
     * @param {object} midi
     */
    _showTrackPreview(midi) {
        this._trackPreview.style.display = "block";
        this._trackPreview.innerHTML = "";

        const heading = document.createElement("div");
        heading.textContent = _("Track Preview");
        heading.style.cssText =
            "font-size: 13px; font-weight: 600; color: #555; margin-bottom: 8px;";
        this._trackPreview.appendChild(heading);

        const table = document.createElement("table");
        table.style.cssText =
            "width: 100%; border-collapse: collapse; font-size: 12px;";

        // Header
        const thead = document.createElement("thead");
        thead.innerHTML =
            `<tr style="background: #f5f5f5; text-align: left;">` +
            `<th style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0;">#</th>` +
            `<th style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0;">${_("Instrument")}</th>` +
            `<th style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0;">${_("Notes")}</th>` +
            `<th style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0;">${_("Channel")}</th>` +
            `</tr>`;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        midi.tracks.forEach((track, i) => {
            if (track.notes.length === 0) return;

            const instrument = track.instrument.percussion
                ? _("Percussion")
                : track.instrument.name || _("Electronic Synth");

            const row = document.createElement("tr");
            row.style.borderBottom = "1px solid #f0f0f0";
            row.innerHTML =
                `<td style="padding: 6px 8px; color: #999;">${i + 1}</td>` +
                `<td style="padding: 6px 8px;">${this._escapeHtml(instrument)}</td>` +
                `<td style="padding: 6px 8px;">${track.notes.length}</td>` +
                `<td style="padding: 6px 8px;">${track.channel != null ? track.channel : "—"}</td>`;
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        this._trackPreview.appendChild(table);
    }

    /**
     * Enables the import button with active styling.
     * @private
     */
    _enableImport() {
        this._importBtn.disabled = false;
        this._importBtn.style.background = "#2196f3";
        this._importBtn.style.cursor = "pointer";
    }

    /**
     * Disables the import button with muted styling.
     * @private
     */
    _disableImport() {
        this._importBtn.disabled = true;
        this._importBtn.style.background = "#b0bec5";
        this._importBtn.style.cursor = "default";
    }

    /**
     * Sets the status message text and color.
     * @private
     * @param {string} msg
     * @param {string} color
     */
    _setStatus(msg, color) {
        this._statusMsg.textContent = msg;
        this._statusMsg.style.color = color || "#999";
    }

    /**
     * Performs the actual MIDI → Music Blocks import.
     * @private
     */
    _doImport() {
        if (!this._parsedMidi) return;

        this._setStatus(_("Importing…"), "#2196f3");
        this._importBtn.disabled = true;
        this._importBtn.style.background = "#90caf9";
        document.body.style.cursor = "wait";

        // Use requestAnimationFrame to allow the UI to update before the
        // potentially heavy transcription runs.
        requestAnimationFrame(() => {
            try {
                transcribeMidi(this._parsedMidi, this._maxNoteBlocks);
                this._setStatus(
                    _("Import complete! Blocks have been generated."),
                    "#43a047"
                );
                this.activity.textMsg(
                    _("MIDI imported successfully. Note blocks have been generated."),
                    3000
                );
            } catch (err) {
                console.error("MIDI import error:", err);
                this._setStatus(_("Import failed. See console for details."), "#e53935");
                this.activity.errorMsg(_("MIDI import failed."));
            } finally {
                document.body.style.cursor = "default";
                this._enableImport();
            }
        });
    }

    /**
     * Escapes HTML entities to prevent injection.
     * @private
     * @param {string} str
     * @returns {string}
     */
    _escapeHtml(str) {
        const div = document.createElement("div");
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = MidiWidget;
}
