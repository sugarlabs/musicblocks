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
 * @file MIDI Widget for Music Blocks.
 *
 * Provides two modes of MIDI import:
 *   1. Upload – Drag-and-drop or browse for .mid/.midi files
 *   2. AI Generate – Describe music in natural language and generate
 *      MIDI via Gemini, OpenAI, or a local model (Ollama)
 *
 * Dependencies:
 *     - js/midi.js: transcribeMidi
 *     - lib/midi.js: Midi class (@tonejs/midi)
 *     - js/ai-music-generator.js: AIMusicGenerator, AI_PROVIDERS
 *     - js/widgets/widgetWindows.js: WidgetWindow
 *     - js/utils/utils.js: _, docById
 *
 * @author Elwin Li (original concept)
 * @author Ashutosh Karnatak (rewrite)
 */

/* global _, Midi, transcribeMidi, AIMusicGenerator, AI_PROVIDERS */

/* exported MidiWidget */

class MidiWidget {
    static ICON_SIZE = 32;
    static DEFAULT_MAX_BLOCKS = 600;
    static MIN_BLOCKS = 100;
    static MAX_BLOCKS = 2400;
    static BLOCK_STEP = 100;

    static STORAGE_KEY_PROVIDER = "midi_ai_provider";
    static STORAGE_KEY_MODEL = "midi_ai_model";
    static STORAGE_KEY_APIKEY = "midi_ai_apikey";
    static STORAGE_KEY_ENDPOINT = "midi_ai_endpoint";

    /**
     * @param {object} activity - The main Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
        this.isOpen = true;
        this._parsedMidi = null;
        this._maxNoteBlocks = MidiWidget.DEFAULT_MAX_BLOCKS;
        this._activeTab = "upload"; // "upload" | "generate"

        this.widgetWindow = window.widgetWindows.windowFor(this, "MIDI Import", "MIDI Import");
        this.widgetWindow.clear();
        this.widgetWindow.show();
        this.widgetWindow.sendToCenter();

        this._setup();
    }

    // ─── Layout ──────────────────────────────────────────────

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

        // ── Tab bar ──
        this._tabBar = this._createTabBar();
        container.appendChild(this._tabBar);

        // ── Upload pane ──
        this._uploadPane = document.createElement("div");
        this._uploadPane.id = "midi-upload-pane";
        this._buildUploadPane(this._uploadPane);
        container.appendChild(this._uploadPane);

        // ── AI Generate pane ──
        this._generatePane = document.createElement("div");
        this._generatePane.id = "midi-generate-pane";
        this._generatePane.style.display = "none";
        this._buildGeneratePane(this._generatePane);
        container.appendChild(this._generatePane);

        // ── Max blocks slider (shared) ──
        const sliderSection = document.createElement("div");
        sliderSection.style.cssText = "margin-bottom: 16px;";

        const sliderLabel = document.createElement("label");
        sliderLabel.style.cssText =
            "display: flex; justify-content: space-between; font-size: 13px; " +
            "color: #555; margin-bottom: 6px;";
        sliderLabel.innerHTML = `<span>${_("Max note blocks")}</span><span id="midi-slider-value">${
            this._maxNoteBlocks
        }</span>`;

        this._slider = document.createElement("input");
        this._slider.type = "range";
        this._slider.min = MidiWidget.MIN_BLOCKS;
        this._slider.max = MidiWidget.MAX_BLOCKS;
        this._slider.step = MidiWidget.BLOCK_STEP;
        this._slider.value = this._maxNoteBlocks;
        this._slider.style.cssText = "width: 100%; accent-color: #2196f3;";

        sliderSection.append(sliderLabel, this._slider);
        container.appendChild(sliderSection);

        // ── Import button (shared) ──
        this._importBtn = document.createElement("button");
        this._importBtn.textContent = _("Import MIDI");
        this._importBtn.disabled = true;
        this._importBtn.style.cssText =
            "width: 100%; padding: 10px; border: none; border-radius: 8px; " +
            "font-size: 14px; font-weight: 600; cursor: pointer; " +
            "background: #b0bec5; color: #fff; transition: all 0.2s ease;";
        container.appendChild(this._importBtn);

        // ── Status message (shared) ──
        this._statusMsg = document.createElement("div");
        this._statusMsg.style.cssText =
            "text-align: center; font-size: 12px; color: #999; margin-top: 10px; " +
            "min-height: 18px;";
        container.appendChild(this._statusMsg);

        body.appendChild(container);

        this._bindEvents();
    }

    /**
     * Creates the Upload / AI Generate tab bar.
     * @private
     * @returns {HTMLElement}
     */
    _createTabBar() {
        const bar = document.createElement("div");
        bar.style.cssText = "display: flex; margin-bottom: 16px; border-bottom: 2px solid #e0e0e0;";

        const makeTab = (id, label, active) => {
            const tab = document.createElement("button");
            tab.textContent = _(label);
            tab.dataset.tab = id;
            tab.style.cssText =
                "flex: 1; padding: 8px 0; border: none; background: none; " +
                "font-size: 13px; font-weight: 600; cursor: pointer; " +
                "border-bottom: 2px solid transparent; margin-bottom: -2px; " +
                "transition: all 0.2s ease; " +
                (active ? "color: #2196f3; border-bottom-color: #2196f3;" : "color: #999;");
            tab.addEventListener("click", () => this._switchTab(id));
            return tab;
        };

        this._tabUpload = makeTab("upload", "Upload File", true);
        this._tabGenerate = makeTab("generate", "AI Generate", false);
        bar.append(this._tabUpload, this._tabGenerate);
        return bar;
    }

    /**
     * Switches between the upload and generate tabs.
     * @private
     * @param {string} tabId - "upload" or "generate"
     */
    _switchTab(tabId) {
        this._activeTab = tabId;

        const isUpload = tabId === "upload";
        this._uploadPane.style.display = isUpload ? "block" : "none";
        this._generatePane.style.display = isUpload ? "none" : "block";

        this._tabUpload.style.color = isUpload ? "#2196f3" : "#999";
        this._tabUpload.style.borderBottomColor = isUpload ? "#2196f3" : "transparent";
        this._tabGenerate.style.color = isUpload ? "#999" : "#2196f3";
        this._tabGenerate.style.borderBottomColor = isUpload ? "transparent" : "#2196f3";

        // Reset Import button state to match the current tab's readiness
        if (isUpload) {
            if (this._parsedMidi) {
                this._enableImport();
            } else {
                this._disableImport();
            }
            this._importBtn.textContent = _("Import MIDI");
        } else {
            this._disableImport();
            this._importBtn.textContent = _("Generate & Import");
        }
        this._setStatus("", "#999");
    }

    // ─── Upload pane ─────────────────────────────────────────

    /**
     * Builds the file-upload pane contents.
     * @private
     * @param {HTMLElement} pane
     */
    _buildUploadPane(pane) {
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
        pane.appendChild(this._dropZone);

        // Hidden file input
        this._fileInput = document.createElement("input");
        this._fileInput.type = "file";
        this._fileInput.accept = ".mid,.midi";
        this._fileInput.style.display = "none";
        pane.appendChild(this._fileInput);

        // ── File info bar ──
        this._fileInfoBar = document.createElement("div");
        this._fileInfoBar.style.cssText =
            "display: none; align-items: center; gap: 8px; padding: 8px 12px; " +
            "background: #e8f5e9; border-radius: 8px; margin-bottom: 16px; font-size: 13px;";
        pane.appendChild(this._fileInfoBar);

        // ── Track preview table ──
        this._trackPreview = document.createElement("div");
        this._trackPreview.style.cssText = "display: none; margin-bottom: 16px;";
        pane.appendChild(this._trackPreview);
    }

    // ─── AI Generate pane ────────────────────────────────────

    /**
     * Builds the AI generation pane contents.
     * @private
     * @param {HTMLElement} pane
     */
    _buildGeneratePane(pane) {
        // ── Provider selector ──
        const providerRow = document.createElement("div");
        providerRow.style.cssText =
            "display: flex; gap: 8px; margin-bottom: 12px; align-items: center;";

        const providerLabel = document.createElement("label");
        providerLabel.textContent = _("Provider");
        providerLabel.style.cssText = "font-size: 13px; color: #555; min-width: 60px;";

        this._providerSelect = document.createElement("select");
        this._providerSelect.style.cssText =
            "flex: 1; padding: 6px 8px; border: 1px solid #ccc; border-radius: 6px; " +
            "font-size: 13px; background: #fff;";

        const providers = [
            { value: "gemini", label: "Google Gemini" },
            { value: "openai", label: "OpenAI / Compatible" },
            { value: "custom", label: "Local (Ollama)" }
        ];
        providers.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.value;
            opt.textContent = p.label;
            this._providerSelect.appendChild(opt);
        });

        providerRow.append(providerLabel, this._providerSelect);
        pane.appendChild(providerRow);

        // ── Model name ──
        const modelRow = this._createInputRow(
            _("Model"),
            "text",
            "gemini-2.0-flash",
            "midi-ai-model"
        );
        this._modelInput = modelRow.querySelector("input");
        pane.appendChild(modelRow);

        // ── API key ──
        const keyRow = this._createInputRow(
            _("API Key"),
            "password",
            _("Paste your API key"),
            "midi-ai-apikey"
        );
        this._apiKeyInput = keyRow.querySelector("input");
        pane.appendChild(keyRow);

        // ── Custom endpoint (hidden by default) ──
        this._endpointRow = this._createInputRow(
            _("Endpoint"),
            "text",
            "http://localhost:11434/api/chat",
            "midi-ai-endpoint"
        );
        this._endpointInput = this._endpointRow.querySelector("input");
        this._endpointRow.style.display = "none";
        pane.appendChild(this._endpointRow);

        // ── Prompt ──
        const promptLabel = document.createElement("label");
        promptLabel.textContent = _("Describe the music you want");
        promptLabel.style.cssText =
            "font-size: 13px; color: #555; display: block; margin-bottom: 4px;";

        this._promptInput = document.createElement("textarea");
        this._promptInput.placeholder = _(
            "e.g. A cheerful melody in C major, 120 BPM, using piano"
        );
        this._promptInput.rows = 3;
        this._promptInput.style.cssText =
            "width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 6px; " +
            "font-size: 13px; resize: vertical; box-sizing: border-box; " +
            "margin-bottom: 16px; font-family: inherit;";

        pane.append(promptLabel, this._promptInput);

        // ── AI-generated track info (hidden until generation) ──
        this._aiTrackInfo = document.createElement("div");
        this._aiTrackInfo.style.cssText =
            "display: none; padding: 8px 12px; background: #e8f5e9; border-radius: 8px; " +
            "margin-bottom: 16px; font-size: 13px;";
        pane.appendChild(this._aiTrackInfo);

        // Restore saved settings
        this._restoreAISettings();
    }

    /**
     * Creates a labeled input row.
     * @private
     * @param {string} labelText
     * @param {string} type
     * @param {string} placeholder
     * @param {string} id
     * @returns {HTMLElement}
     */
    _createInputRow(labelText, type, placeholder, id) {
        const row = document.createElement("div");
        row.style.cssText = "display: flex; gap: 8px; margin-bottom: 10px; align-items: center;";

        const lbl = document.createElement("label");
        lbl.textContent = labelText;
        lbl.style.cssText = "font-size: 13px; color: #555; min-width: 60px;";
        lbl.setAttribute("for", id);

        const input = document.createElement("input");
        input.type = type;
        input.id = id;
        input.placeholder = placeholder;
        input.style.cssText =
            "flex: 1; padding: 6px 8px; border: 1px solid #ccc; border-radius: 6px; " +
            "font-size: 13px;";

        row.append(lbl, input);
        return row;
    }

    // ─── Events ──────────────────────────────────────────────

    /**
     * Binds all interactive event handlers.
     * @private
     */
    _bindEvents() {
        // ── Upload tab events ──
        this._dropZone.addEventListener("click", () => this._fileInput.click());

        this._fileInput.addEventListener("change", e => {
            if (e.target.files.length > 0) {
                this._handleFile(e.target.files[0]);
            }
        });

        this._dropZone.addEventListener("dragover", e => {
            e.preventDefault();
            e.stopPropagation();
            this._dropZone.style.borderColor = "#2196f3";
            this._dropZone.style.background = "#e3f2fd";
        });

        this._dropZone.addEventListener("dragleave", e => {
            e.preventDefault();
            e.stopPropagation();
            this._dropZone.style.borderColor = "#b0bec5";
            this._dropZone.style.background = "#fafafa";
        });

        this._dropZone.addEventListener("drop", e => {
            e.preventDefault();
            e.stopPropagation();
            this._dropZone.style.borderColor = "#b0bec5";
            this._dropZone.style.background = "#fafafa";

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this._handleFile(files[0]);
            }
        });

        // ── Slider ──
        this._slider.addEventListener("input", () => {
            this._maxNoteBlocks = parseInt(this._slider.value);
            const valueDisplay = document.getElementById("midi-slider-value");
            if (valueDisplay) {
                valueDisplay.textContent = this._maxNoteBlocks;
            }
        });

        // ── Import / Generate button ──
        this._importBtn.addEventListener("click", () => {
            if (this._activeTab === "upload") {
                this._doImport();
            } else {
                this._doGenerate();
            }
        });

        // ── Provider change ──
        this._providerSelect.addEventListener("change", () => {
            const prov = this._providerSelect.value;
            this._endpointRow.style.display = prov === "custom" ? "flex" : "none";

            // Update model placeholder
            const defaults = {
                gemini: "gemini-2.0-flash",
                openai: "gpt-4o-mini",
                custom: "llama3"
            };
            this._modelInput.placeholder = defaults[prov] || "";
            if (!this._modelInput.value) {
                this._modelInput.value = "";
            }
        });

        // ── Prompt enables the generate button ──
        this._promptInput.addEventListener("input", () => {
            if (this._activeTab === "generate") {
                if (this._promptInput.value.trim().length > 0) {
                    this._enableImport();
                    this._importBtn.textContent = _("Generate & Import");
                } else {
                    this._disableImport();
                }
            }
        });
    }

    // ─── Upload handlers ─────────────────────────────────────

    /**
     * Processes a dropped/selected file, validates it, and parses the MIDI.
     * @private
     * @param {File} file
     */
    _handleFile(file) {
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

        reader.onload = e => {
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
     * Shows the file info bar.
     * @private
     */
    _showFileInfo(name, midi) {
        const trackCount = midi.tracks.filter(t => t.notes.length > 0).length;
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

        this._dropZone.style.padding = "12px";
        this._dropZone.innerHTML =
            `<div style="font-size:13px; color:#2196f3;">` +
            `🔄 ${_("Click to load a different file")}</div>`;
    }

    /**
     * Renders track preview table.
     * @private
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
        table.style.cssText = "width: 100%; border-collapse: collapse; font-size: 12px;";

        const thead = document.createElement("thead");
        thead.innerHTML =
            `<tr style="background: #f5f5f5; text-align: left;">` +
            `<th style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0;">#</th>` +
            `<th style="padding: 6px 8px; border-bottom: 1px solid #e0e0e0;">${_(
                "Instrument"
            )}</th>` +
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

    // ─── AI Generate handlers ────────────────────────────────

    /**
     * Generates MIDI via AI and imports it.
     * @private
     */
    async _doGenerate() {
        const prompt = this._promptInput.value.trim();
        if (!prompt) {
            this._setStatus(_("Please enter a music description."), "#e53935");
            return;
        }

        const apiKey = this._apiKeyInput.value.trim();
        const provider = this._providerSelect.value;

        if (provider !== "custom" && !apiKey) {
            this._setStatus(_("Please enter an API key."), "#e53935");
            return;
        }

        // Save settings
        this._saveAISettings();

        this._setStatus(_("Generating music with AI…"), "#2196f3");
        this._importBtn.disabled = true;
        this._importBtn.style.background = "#90caf9";
        document.body.style.cursor = "wait";

        try {
            const generator = new AIMusicGenerator({
                provider: provider,
                apiKey: apiKey,
                model: this._modelInput.value.trim() || undefined,
                endpoint: this._endpointInput.value.trim() || undefined
            });

            const midiObj = await generator.generate(prompt);
            this._parsedMidi = midiObj;

            // Show what was generated
            const noteCount = midiObj.tracks.reduce((sum, t) => sum + t.notes.length, 0);
            this._aiTrackInfo.style.display = "block";
            this._aiTrackInfo.innerHTML =
                `<span style="font-weight:600;">🤖 ${_("AI Generated")}</span>` +
                `<span style="color:#666;"> | </span>` +
                `<span>${noteCount} ${_("notes")}</span>`;

            this._setStatus(_("Generation complete! Click Import to create blocks."), "#43a047");
            this._enableImport();
            this._importBtn.textContent = _("Import Generated MIDI");
        } catch (err) {
            console.error("AI generation error:", err);
            this._setStatus(`${_("Generation failed")}: ${err.message}`, "#e53935");
            this._disableImport();
            this._importBtn.textContent = _("Generate & Import");
        } finally {
            document.body.style.cursor = "default";
        }
    }

    /**
     * Saves AI configuration to localStorage.
     * @private
     */
    _saveAISettings() {
        try {
            localStorage.setItem(MidiWidget.STORAGE_KEY_PROVIDER, this._providerSelect.value);
            localStorage.setItem(MidiWidget.STORAGE_KEY_MODEL, this._modelInput.value);
            localStorage.setItem(MidiWidget.STORAGE_KEY_APIKEY, this._apiKeyInput.value);
            localStorage.setItem(MidiWidget.STORAGE_KEY_ENDPOINT, this._endpointInput.value);
        } catch (e) {
            // localStorage may be unavailable
        }
    }

    /**
     * Restores AI configuration from localStorage.
     * @private
     */
    _restoreAISettings() {
        try {
            const provider = localStorage.getItem(MidiWidget.STORAGE_KEY_PROVIDER);
            if (provider) {
                this._providerSelect.value = provider;
                this._endpointRow.style.display = provider === "custom" ? "flex" : "none";
            }

            const model = localStorage.getItem(MidiWidget.STORAGE_KEY_MODEL);
            if (model) this._modelInput.value = model;

            const key = localStorage.getItem(MidiWidget.STORAGE_KEY_APIKEY);
            if (key) this._apiKeyInput.value = key;

            const endpoint = localStorage.getItem(MidiWidget.STORAGE_KEY_ENDPOINT);
            if (endpoint) this._endpointInput.value = endpoint;
        } catch (e) {
            // localStorage may be unavailable
        }
    }

    // ─── Shared helpers ──────────────────────────────────────

    /**
     * Enables the import button.
     * @private
     */
    _enableImport() {
        this._importBtn.disabled = false;
        this._importBtn.style.background = "#2196f3";
        this._importBtn.style.cursor = "pointer";
    }

    /**
     * Disables the import button.
     * @private
     */
    _disableImport() {
        this._importBtn.disabled = true;
        this._importBtn.style.background = "#b0bec5";
        this._importBtn.style.cursor = "default";
    }

    /**
     * Sets the status message.
     * @private
     */
    _setStatus(msg, color) {
        this._statusMsg.textContent = msg;
        this._statusMsg.style.color = color || "#999";
    }

    /**
     * Performs the file-upload MIDI → Music Blocks import.
     * @private
     */
    _doImport() {
        if (!this._parsedMidi) return;

        this._setStatus(_("Importing…"), "#2196f3");
        this._importBtn.disabled = true;
        this._importBtn.style.background = "#90caf9";
        document.body.style.cursor = "wait";

        requestAnimationFrame(() => {
            try {
                transcribeMidi(this._parsedMidi, this._maxNoteBlocks);
                this._setStatus(_("Import complete! Blocks have been generated."), "#43a047");
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
     * Escapes HTML entities.
     * @private
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
