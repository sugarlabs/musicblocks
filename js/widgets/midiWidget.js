/**
 * MusicBlocks v3.6.2
 *
 * @author Elwin Li
 *
 * @copyright 2025 Elwin Li
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @class
 * @classdesc Widget for importing MIDI files and generating MIDI from text queries, converting them to MusicBlocks
 *
 * Private members' names begin with underscore '_".
 */

/* global docById, _, transcribeMidi, globalActivity, console, Midi */

/* exported MidiWidget */

class MidiWidget {
    /**
     * @constructor
     */
    constructor(activity) {
        this.activity = activity;
        this.isOpen = true;
        this.selectedFile = null;
        this.maxNoteBlocks = 600; // Default value
        this.generatedMIDIData = null; // Store generated MIDI data for download
        this.currentMode = "upload"; // Track current mode

        this.widgetWindow = window.widgetWindows.windowFor(
            this,
            "MIDI Widget",
            "MIDI Widget"
        );
        this.widgetWindow.clear();
        this.widgetWindow.show();
        this.widgetWindow.setPosition(200, 200);

        this._setup();
        
        // Restore download button state if MIDI data exists
        this._restoreDownloadState();
    }

    /**
     * Sets up the widget UI
     * @private
     * @returns {void}
     */
    _setup() {
        const container = document.createElement("div");
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.padding = "15px";
        container.style.fontFamily = "Arial, sans-serif";
        container.style.boxSizing = "border-box";

        // Title
        const title = document.createElement("h3");
        title.textContent = _("MIDI Widget");
        title.style.margin = "0 0 10px 0";
        title.style.color = "#333";
        title.style.fontSize = "18px";
        container.appendChild(title);

        // Description
        const description = document.createElement("p");
        description.textContent = _("Import MIDI files or generate MIDI from text queries to convert them to MusicBlocks.");
        description.style.margin = "0 0 15px 0";
        description.style.color = "#666";
        description.style.fontSize = "13px";
        container.appendChild(description);

        // File upload area
        this.fileUploadArea = document.createElement("div");
        this.fileUploadArea.style.border = "2px dashed #ccc";
        this.fileUploadArea.style.borderRadius = "8px";
        this.fileUploadArea.style.padding = "20px";
        this.fileUploadArea.style.textAlign = "center";
        this.fileUploadArea.style.cursor = "pointer";
        this.fileUploadArea.style.transition = "border-color 0.3s, background-color 0.3s";
        this.fileUploadArea.style.marginBottom = "15px";
        this.fileUploadArea.style.minHeight = "80px";
        this.fileUploadArea.style.display = "flex";
        this.fileUploadArea.style.flexDirection = "column";
        this.fileUploadArea.style.justifyContent = "center";
        this.fileUploadArea.style.alignItems = "center";
        container.appendChild(this.fileUploadArea);

        // Import icon
        const importIcon = document.createElement("div");
        importIcon.innerHTML = "📁";
        importIcon.style.fontSize = "24px";
        importIcon.style.marginBottom = "8px";
        this.fileUploadArea.appendChild(importIcon);

        // Import text
        const importText = document.createElement("div");
        importText.textContent = _("Click to select MIDI file or drag and drop");
        importText.style.color = "#666";
        importText.style.fontSize = "14px";
        this.fileUploadArea.appendChild(importText);

        // File input (hidden)
        this.fileInput = document.createElement("input");
        this.fileInput.type = "file";
        this.fileInput.accept = ".mid,.midi";
        this.fileInput.style.display = "none";
        container.appendChild(this.fileInput);

        // Selected file info
        this.fileInfo = document.createElement("div");
        this.fileInfo.style.margin = "8px 0";
        this.fileInfo.style.padding = "8px";
        this.fileInfo.style.backgroundColor = "#f0f8ff";
        this.fileInfo.style.borderRadius = "4px";
        this.fileInfo.style.display = "none";
        this.fileInfo.style.fontSize = "11px";
        container.appendChild(this.fileInfo);

        // Query input section
        const queryContainer = document.createElement("div");
        queryContainer.style.margin = "10px 0";
        container.appendChild(queryContainer);

        const queryLabel = document.createElement("label");
        queryLabel.textContent = _("Or enter a query to generate MIDI:");
        queryLabel.style.display = "block";
        queryLabel.style.marginBottom = "5px";
        queryLabel.style.fontSize = "14px";
        queryLabel.style.color = "#333";
        queryContainer.appendChild(queryLabel);

        this.queryInput = document.createElement("input");
        this.queryInput.type = "text";
        this.queryInput.placeholder = _("e.g., 'happy jazz melody', 'sad piano piece', 'upbeat electronic music'");
        this.queryInput.style.width = "100%";
        this.queryInput.style.padding = "8px";
        this.queryInput.style.border = "1px solid #ccc";
        this.queryInput.style.borderRadius = "4px";
        this.queryInput.style.fontSize = "14px";
        this.queryInput.style.boxSizing = "border-box";
        queryContainer.appendChild(this.queryInput);

        // API key requirement note
        const apiKeyNote = document.createElement("div");
        apiKeyNote.innerHTML = `<small style="color: #666; font-style: italic;">💡 ${_("Note: MIDI generation requires a Gemini API key. Use the API Settings button (⚙️) in the toolbar to set it up.")}</small>`;
        apiKeyNote.style.marginTop = "5px";
        apiKeyNote.style.fontSize = "11px";
        queryContainer.appendChild(apiKeyNote);

        // Mode selection tabs
        const modeContainer = document.createElement("div");
        modeContainer.style.margin = "15px 0";
        container.appendChild(modeContainer);

        // Create tabs container
        const tabsContainer = document.createElement("div");
        tabsContainer.style.display = "flex";
        tabsContainer.style.borderRadius = "8px";
        tabsContainer.style.overflow = "hidden";
        tabsContainer.style.border = "2px solid #e0e0e0";
        tabsContainer.style.backgroundColor = "#f5f5f5";
        modeContainer.appendChild(tabsContainer);

        // Upload tab
        this.uploadTab = document.createElement("button");
        this.uploadTab.textContent = _("Import MIDI");
        this.uploadTab.style.flex = "1";
        this.uploadTab.style.padding = "12px 16px";
        this.uploadTab.style.border = "none";
        this.uploadTab.style.backgroundColor = "#4CAF50";
        this.uploadTab.style.color = "white";
        this.uploadTab.style.fontSize = "14px";
        this.uploadTab.style.fontWeight = "bold";
        this.uploadTab.style.cursor = "pointer";
        this.uploadTab.style.transition = "all 0.3s ease";
        this.uploadTab.onclick = () => this._switchToMode("upload");
        tabsContainer.appendChild(this.uploadTab);

        // Generate tab
        this.generateTab = document.createElement("button");
        this.generateTab.textContent = _("Generate MIDI");
        this.generateTab.style.flex = "1";
        this.generateTab.style.padding = "12px 16px";
        this.generateTab.style.border = "none";
        this.generateTab.style.backgroundColor = "#f5f5f5";
        this.generateTab.style.color = "#666";
        this.generateTab.style.fontSize = "14px";
        this.generateTab.style.fontWeight = "normal";
        this.generateTab.style.cursor = "pointer";
        this.generateTab.style.transition = "all 0.3s ease";
        this.generateTab.onclick = () => this._switchToMode("generate");
        tabsContainer.appendChild(this.generateTab);

        // Max blocks setting
        const maxBlocksContainer = document.createElement("div");
        maxBlocksContainer.style.margin = "10px 0";
        container.appendChild(maxBlocksContainer);

        const maxBlocksLabel = document.createElement("label");
        maxBlocksLabel.textContent = _("Maximum note blocks to generate:");
        maxBlocksLabel.style.display = "block";
        maxBlocksLabel.style.marginBottom = "5px";
        maxBlocksLabel.style.fontSize = "14px";
        maxBlocksLabel.style.color = "#333";
        maxBlocksContainer.appendChild(maxBlocksLabel);

        this.maxBlocksSelect = document.createElement("select");
        this.maxBlocksSelect.style.width = "100%";
        this.maxBlocksSelect.style.padding = "8px";
        this.maxBlocksSelect.style.border = "1px solid #ccc";
        this.maxBlocksSelect.style.borderRadius = "4px";
        this.maxBlocksSelect.style.fontSize = "14px";
        maxBlocksContainer.appendChild(this.maxBlocksSelect);

        // Populate max blocks options
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement("option");
            option.value = i * 100;
            option.textContent = i * 100;
            if (i * 100 === this.maxNoteBlocks) {
                option.selected = true;
            }
            this.maxBlocksSelect.appendChild(option);
        }

        // Status display
        this.statusDisplay = document.createElement("div");
        this.statusDisplay.style.margin = "8px 0";
        this.statusDisplay.style.padding = "6px 8px";
        this.statusDisplay.style.borderRadius = "4px";
        this.statusDisplay.style.fontSize = "11px";
        this.statusDisplay.style.display = "none";
        container.appendChild(this.statusDisplay);

        // Loading indicator and progress
        this.loadingContainer = document.createElement("div");
        this.loadingContainer.style.margin = "8px 0";
        this.loadingContainer.style.padding = "12px";
        this.loadingContainer.style.borderRadius = "8px";
        this.loadingContainer.style.backgroundColor = "#e8f5e8";
        this.loadingContainer.style.border = "1px solid #c8e6c9";
        this.loadingContainer.style.display = "none";
        this.loadingContainer.style.textAlign = "center";
        container.appendChild(this.loadingContainer);

        // Spinner
        this.spinner = document.createElement("div");
        this.spinner.innerHTML = "🔄";
        this.spinner.style.fontSize = "24px";
        this.spinner.style.marginBottom = "8px";
        this.spinner.style.animation = "spin 1s linear infinite";
        this.loadingContainer.appendChild(this.spinner);

        // Progress text
        this.progressText = document.createElement("div");
        this.progressText.textContent = _("Initializing...");
        this.progressText.style.color = "#2e7d32";
        this.progressText.style.fontSize = "13px";
        this.progressText.style.fontWeight = "500";
        this.loadingContainer.appendChild(this.progressText);

        // Add CSS animation for spinner
        const style = document.createElement("style");
        style.textContent = `
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        // Buttons container
        const buttonsContainer = document.createElement("div");
        buttonsContainer.style.display = "flex";
        buttonsContainer.style.gap = "8px";
        buttonsContainer.style.marginTop = "auto";
        buttonsContainer.style.paddingTop = "10px";

        // Process button
        this.processButton = document.createElement("button");
        this.processButton.textContent = _("Process");
        this.processButton.style.padding = "8px 16px";
        this.processButton.style.backgroundColor = "#4CAF50";
        this.processButton.style.color = "white";
        this.processButton.style.border = "none";
        this.processButton.style.borderRadius = "4px";
        this.processButton.style.cursor = "pointer";
        this.processButton.style.fontSize = "14px";
        this.processButton.style.flex = "1";
        this.processButton.style.marginRight = "5px";
        this.processButton.style.minWidth = "120px";
        this.processButton.onclick = this._processRequest.bind(this);
        this.processButton.disabled = true;
        buttonsContainer.appendChild(this.processButton);

        // Download button (initially hidden)
        this.downloadButton = document.createElement("button");
        this.downloadButton.textContent = _("Download MIDI");
        this.downloadButton.style.padding = "8px 16px";
        this.downloadButton.style.backgroundColor = "#2196F3";
        this.downloadButton.style.color = "white";
        this.downloadButton.style.border = "none";
        this.downloadButton.style.borderRadius = "4px";
        this.downloadButton.style.cursor = "pointer";
        this.downloadButton.style.fontSize = "14px";
        this.downloadButton.style.minWidth = "120px";
        this.downloadButton.style.display = "none";
        this.downloadButton.onclick = this._downloadMIDI.bind(this);
        buttonsContainer.appendChild(this.downloadButton);



        container.appendChild(buttonsContainer);

        this.widgetWindow.getWidgetBody().appendChild(container);

        // Setup event handlers
        this._setupEventHandlers();

        // Setup close handler
        this.widgetWindow.onclose = () => {
            this.isOpen = false;
            this.widgetWindow.destroy();
        };
    }

    /**
     * Sets up event handlers for file upload
     * @private
     * @returns {void}
     */
    _setupEventHandlers() {
        // Click to select file
        this.fileUploadArea.onclick = () => {
            this.fileInput.click();
        };

        // File input change
        this.fileInput.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                this._handleFileSelection(file);
            }
        };

        // Drag and drop handlers
        this.fileUploadArea.ondragover = (event) => {
            event.preventDefault();
            this.fileUploadArea.style.borderColor = "#2196F3";
            this.fileUploadArea.style.backgroundColor = "#e3f2fd";
        };

        this.fileUploadArea.ondragleave = (event) => {
            event.preventDefault();
            this.fileUploadArea.style.borderColor = "#ccc";
            this.fileUploadArea.style.backgroundColor = "transparent";
        };

        this.fileUploadArea.ondrop = (event) => {
            event.preventDefault();
            this.fileUploadArea.style.borderColor = "#ccc";
            this.fileUploadArea.style.backgroundColor = "transparent";

            const files = event.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.name.toLowerCase().endsWith('.mid') || file.name.toLowerCase().endsWith('.midi')) {
                    this._handleFileSelection(file);
                } else {
                    this._showStatus(_("Please select a valid MIDI file (.mid or .midi)"), "error");
                }
            }
        };

        // Max blocks selection change
        this.maxBlocksSelect.onchange = () => {
            this.maxNoteBlocks = parseInt(this.maxBlocksSelect.value);
        };

        // Mode selection change - removed, now handled by tabs

        // Query input change
        this.queryInput.oninput = () => {
            this._updateButtonState();
        };

        // Prevent query input from triggering other events
        this.queryInput.onkeydown = (event) => {
            // Prevent Enter key from triggering form submission or other actions
            if (event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
            }
            // Prevent any key events from bubbling up
            event.stopPropagation();
        };

        this.queryInput.onkeyup = (event) => {
            // Prevent any key events from bubbling up
            event.stopPropagation();
        };

        this.queryInput.onkeypress = (event) => {
            // Prevent any key press events from bubbling up
            event.stopPropagation();
        };

        this.queryInput.oninput = (event) => {
            // Prevent input events from bubbling up
            event.stopPropagation();
            this._updateButtonState();
        };

        // Prevent focus/blur events from triggering other actions
        this.queryInput.onfocus = (event) => {
            event.stopPropagation();
        };

        this.queryInput.onblur = (event) => {
            event.stopPropagation();
        };

        // Initialize UI
        this._updateUIForMode();
    }

    /**
     * Handles file selection
     * @private
     * @param {File} file - The selected file
     * @returns {void}
     */
    _handleFileSelection(file) {
        this.selectedFile = file;
        
        // Update file info display
        this.fileInfo.style.display = "block";
        this.fileInfo.innerHTML = `
            <strong>${_("Selected file:")}</strong> ${file.name}<br>
            <strong>${_("Size:")}</strong> ${(file.size / 1024).toFixed(1)} KB<br>
            <strong>${_("Type:")}</strong> ${file.type || "MIDI file"}
        `;

        // Update upload area appearance
        this.fileUploadArea.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 10px;">✅</div>
            <div style="color: #4CAF50; font-size: 14px; font-weight: bold;">${_("File selected")}</div>
            <div style="color: #666; font-size: 12px; margin-top: 5px;">${file.name}</div>
        `;

        this._updateButtonState();
        this._showStatus(_("File selected successfully"), "success");
    }

    /**
     * Processes the request based on the selected mode
     * @private
     * @returns {void}
     */
    _processRequest() {
        const mode = this.currentMode;
        
        if (mode === "upload") {
            this._convertMidi();
        } else if (mode === "generate") {
            this._generateFromQuery();
        }
    }

    /**
     * Converts the selected MIDI file to MusicBlocks
     * @private
     * @returns {void}
     */
    _convertMidi() {
        if (!this.selectedFile) {
            this._showStatus(_("No file selected"), "error");
            return;
        }

        this._showLoading(_("Processing MIDI file..."));

        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const midi = new Midi(event.target.result);
                console.log("MIDI file loaded:", midi);
                
                this._showStatus(_("Converting to MusicBlocks..."), "info");
                
                // Clear current blocks before importing
                this.activity.stage.removeAllEventListeners("trashsignal");
                
                const clearAndImport = () => {
                    this.activity.blocks.loadNewBlocks([]);
                    this.activity.stage.removeAllEventListeners("trashsignal");
                    
                    // Import the MIDI
                    transcribeMidi(midi, this.maxNoteBlocks);
                    
                                    this.activity.refreshCanvas();
                this._hideLoading();
                this._showStatus(_("MIDI converted to MusicBlocks successfully!"), "success");
                
                // Store MIDI data for download and show download button
                this._storeMIDIData(event.target.result);
                this.downloadButton.style.display = "inline-block";
                };

                this.activity.stage.addEventListener("trashsignal", clearAndImport, false);
                this.activity.sendAllToTrash(false, false);
                this.activity._allClear(false, true);
                
            } catch (error) {
                console.error("Error processing MIDI file:", error);
                this._hideLoading();
                this._showStatus(_("Error processing MIDI file: ") + error.message, "error");
            }
        };

        reader.onerror = () => {
            this._hideLoading();
            this._showStatus(_("Error reading file"), "error");
        };

        reader.readAsArrayBuffer(this.selectedFile);
    }

    /**
     * Generates MIDI from a text query using the RAG pipeline
     * @private
     * @returns {void}
     */
    async _generateFromQuery() {
        const query = this.queryInput.value.trim();
        if (!query) {
            this._showStatus(_("Please enter a query"), "error");
            return;
        }

        this._showLoading(_("Generating MIDI from query..."));

        try {
            // Call the RAG pipeline to generate MIDI
            const midiData = await this._callRAGPipeline(query);
            
            if (midiData) {
                this._showStatus(_("Converting generated MIDI to MusicBlocks..."), "info");
                
                // Convert the generated MIDI data to a Midi object
                const midi = new Midi(midiData);
                
                // Clear current blocks before importing
                this.activity.stage.removeAllEventListeners("trashsignal");
                
                const clearAndImport = () => {
                    this.activity.blocks.loadNewBlocks([]);
                    this.activity.stage.removeAllEventListeners("trashsignal");
                    
                    // Import the generated MIDI
                    transcribeMidi(midi, this.maxNoteBlocks);
                    
                                    this.activity.refreshCanvas();
                this._hideLoading();
                this._showStatus(_("Generated MIDI converted to MusicBlocks successfully!"), "success");
                
                // Store MIDI data for download and show download button
                this._storeMIDIData(midiData);
                this.downloadButton.style.display = "inline-block";
                };

                this.activity.stage.addEventListener("trashsignal", clearAndImport, false);
                this.activity.sendAllToTrash(false, false);
                this.activity._allClear(false, true);
            } else {
                this._hideLoading();
                this._showStatus(_("Failed to generate MIDI from query"), "error");
            }
        } catch (error) {
            console.error("Error generating MIDI from query:", error);
            
            if (error.message === "API key not available") {
                this._showStatus(_("API key setup failed. Please click the API Settings button (⚙️) in the toolbar to set your Gemini API key."), "error");
            } else {
                this._showStatus(_("Error generating MIDI: ") + error.message, "error");
            }
            
            this._hideLoading();
        }
    }

    /**
     * Calls the RAG pipeline to generate MIDI from a query
     * @private
     * @param {string} query - The text query
     * @returns {Promise<ArrayBuffer|null>} - The generated MIDI data
     */
    async _callRAGPipeline(query) {
        try {
            console.log("Calling RAG pipeline with query:", query);
            
            // Get API key
            const apiKey = await this._getAPIKey();
            if (!apiKey) {
                throw new Error("API key not available");
            }
            
            // Always use manual RAG system to ensure consistent timing and behavior
            console.log("Using manual RAG system for consistent generation (no shortcuts)...");
            
            // Initialize RAG system manually to ensure consistent behavior
            let ragSystem;
            if (window.initializeRAGSystem) {
                this._updateProgress(_("Initializing RAG system..."));
                ragSystem = await window.initializeRAGSystem(apiKey);
            } else {
                // Create new instance that matches direct pipeline behavior
                ragSystem = new window.GeminiMusicRAG(apiKey);
                
                // Force fresh generation each time to match direct pipeline timing
                this._updateProgress(_("Loading MIDI documents dataset..."));
                console.log("Loading real MIDI documents dataset (fresh generation)...");
                await ragSystem.loadDocuments("js/midi-generation/midi_documents_gemini.json");
                
                this._updateProgress(_("Generating embeddings..."));
                console.log("Generating fresh embeddings for all documents...");
                await ragSystem.generateEmbeddings();
            }
            
            // Use searchSimilarMusic instead of advancedSearch for consistency with ragConfig
            this._updateProgress(_("Searching for similar music..."));
            const similarDocs = await ragSystem.searchSimilarMusic(query, 3);
            
            // Console log the search results
            console.log("searchSimilarMusic results:", similarDocs);
            
            if (similarDocs.length === 0) {
                throw new Error("No similar music found for the query");
            }
            
            // Generate music using Gemini
            this._updateProgress(_("Generating music with AI..."));
            const generatedNoteSequence = await ragSystem.generateMusicWithGemini(similarDocs, query);
            
            if (!generatedNoteSequence) {
                throw new Error("Failed to generate music from Gemini");
            }
            
            // Use the RAG system's note extraction method instead of custom conversion
            this._updateProgress(_("Extracting musical notes..."));
            const extractedNotes = ragSystem.extractNotesFromText(generatedNoteSequence);
            
            if (!extractedNotes) {
                throw new Error("Failed to extract notes from generated sequence");
            }
            
            // Convert note sequence to MIDI using a more robust method
            this._updateProgress(_("Converting to MIDI format..."));
            const midiData = await this._convertNoteSequenceToMIDI(extractedNotes);
            
            return midiData;
        } catch (error) {
            console.error("RAG pipeline error:", error);
            throw error;
        }
    }

    /**
     * Get API key from user or localStorage
     * @private
     * @returns {Promise<string|null>} - The API key
     */
    async _getAPIKey() {
        // First try to get from localStorage
        let apiKey = localStorage.getItem('gemini_api_key');
        
        if (!apiKey) {
            // Show helpful message first
            this._showStatus(_("No API key found. Opening API Key Manager..."), "info");
            
            // Show API key manager
            const apiKeyManager = new APIKeyManager(this.activity);
            apiKeyManager.show();
            
            // Wait for user to set the API key
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    const newApiKey = localStorage.getItem('gemini_api_key');
                    if (newApiKey) {
                        clearInterval(checkInterval);
                        this._showStatus(_("API key found! You can now generate MIDI."), "success");
                        resolve(newApiKey);
                    }
                }, 1000);
                
                // Timeout after 5 minutes
                setTimeout(() => {
                    clearInterval(checkInterval);
                    this._showStatus(_("API key setup timed out. Please set your API key in the API Settings."), "error");
                    resolve(null);
                }, 300000);
            });
        }
        
        return apiKey;
    }

    /**
     * Initialize ragConfig if not already initialized
     * @private
     * @param {string} apiKey - The API key
     * @returns {Promise<boolean>} - Success status
     */
    async _initializeRagConfig(apiKey) {
        try {
            if (!window.ragConfig) {
                console.log("ragConfig not available");
                return false;
            }
            
            if (window.ragConfig.isReady()) {
                console.log("ragConfig already initialized");
                return true;
            }
            
            console.log("Initializing ragConfig...");
            const success = await window.ragConfig.initialize(apiKey);
            return success;
        } catch (error) {
            console.error("Error initializing ragConfig:", error);
            return false;
        }
    }



    /**
     * Converts a note sequence string to MIDI data
     * @private
     * @param {string} noteSequence - Note sequence in format "pitch:start-end"
     * @returns {Promise<ArrayBuffer>} - MIDI data as ArrayBuffer
     */
    async _convertNoteSequenceToMIDI(noteSequence) {
        try {
            // Create MIDI structure matching ragConfig approach
            const midi = {
                header: {
                    name: "Generated Music",
                    PPQ: 480
                },
                track: [{
                    name: "Generated Track",
                    event: []
                }]
            };

            let currentTime = 0;
            const notes = noteSequence.trim().split(' ');

            // Add tempo event first (80 BPM - slower tempo for 200+ notes)
            midi.track[0].event.push({
                type: 0xFF, // Meta event
                deltaTime: 0,
                data: [0x51, 0x03, 0x0B, 0x71, 0xB0] // Tempo: 80 BPM
            });

            // Parse and sort notes by start time for proper MIDI sequencing
            const parsedNotes = [];
            for (const noteRepr of notes) {
                if (noteRepr.includes(':') && noteRepr.includes('-')) {
                    const [pitch, times] = noteRepr.split(':');
                    const [start, end] = times.split('-').map(Number);
                    
                    const pitchNum = parseInt(pitch);
                    if (pitchNum >= 0 && pitchNum <= 127 && start < end) {
                        parsedNotes.push({
                            pitch: pitchNum,
                            start: start,
                            end: end,
                            duration: end - start
                        });
                    }
                }
            }
            
            // Sort notes by start time
            parsedNotes.sort((a, b) => a.start - b.start);
            
            // Add notes to MIDI track
            for (const note of parsedNotes) {
                const deltaTime = Math.round((note.start - currentTime) * 480);
                
                // Note on (0x90 = 144 for channel 0)
                midi.track[0].event.push({
                    type: 0x90,
                    deltaTime: deltaTime,
                    data: [note.pitch, 80] // Reduced velocity for better sound
                });
                
                // Note off (0x80 = 128 for channel 0)
                midi.track[0].event.push({
                    type: 0x80,
                    deltaTime: Math.round(note.duration * 480),
                    data: [note.pitch, 0]
                });
                
                currentTime = note.start + note.duration;
            }
            
            // Add end of track
            midi.track[0].event.push({
                type: 0xFF, // Meta event
                deltaTime: 0,
                data: [0x2F, 0x00] // End of track
            });
            
            // Encode to MIDI bytes
            const midiBytes = this._encodeMIDI(midi);
            return midiBytes.buffer;
            
        } catch (error) {
            console.error("Error converting note sequence to MIDI:", error);
            throw error;
        }
    }

    /**
     * Encodes MIDI data to bytes
     * @private
     * @param {Object} midi - MIDI object
     * @returns {Uint8Array} - MIDI bytes
     */
    _encodeMIDI(midi) {
        const bytes = [];
        
        // MIDI header chunk
        bytes.push(0x4D, 0x54, 0x68, 0x64); // "MThd"
        bytes.push(0x00, 0x00, 0x00, 0x06); // Header length (6 bytes)
        bytes.push(0x00, 0x01); // Format 1
        bytes.push(0x00, 0x01); // 1 track
        bytes.push(0x01, 0xE0); // PPQ (480)
        
        // Track chunk
        bytes.push(0x4D, 0x54, 0x72, 0x6B); // "MTrk"
        
        // Track data
        const trackData = [];
        
        // Add all events
        for (const event of midi.track[0].event) {
            // Delta time
            if (event.deltaTime > 0) {
                const deltaBytes = this._encodeVariableLength(event.deltaTime);
                trackData.push(...deltaBytes);
            } else {
                trackData.push(0x00);
            }
            
            // Event data
            trackData.push(event.type);
            trackData.push(...event.data);
        }
        
        // Track length (4 bytes, big-endian)
        const trackLength = trackData.length;
        bytes.push(
            (trackLength >> 24) & 0xFF,
            (trackLength >> 16) & 0xFF,
            (trackLength >> 8) & 0xFF,
            trackLength & 0xFF
        );
        
        // Add track data
        bytes.push(...trackData);
        
        return new Uint8Array(bytes);
    }

    /**
     * Encode variable length quantity
     * @private
     * @param {number} value - The value to encode
     * @returns {Array} - Encoded bytes
     */
    _encodeVariableLength(value) {
        const bytes = [];
        let remaining = value;
        
        while (remaining > 0) {
            let byte = remaining & 0x7F;
            remaining >>= 7;
            
            if (remaining > 0) {
                byte |= 0x80;
            }
            
            bytes.push(byte);
        }
        
        return bytes;
    }

    /**
     * Updates the UI based on the selected mode
     * @private
     * @returns {void}
     */
    /**
     * Switches between upload and generate modes
     * @private
     * @param {string} mode - The mode to switch to ("upload" or "generate")
     * @returns {void}
     */
    _switchToMode(mode) {
        this.currentMode = mode;
        
        // Update tab appearances
        if (mode === "upload") {
            this.uploadTab.style.backgroundColor = "#4CAF50";
            this.uploadTab.style.color = "white";
            this.uploadTab.style.fontWeight = "bold";
            
            this.generateTab.style.backgroundColor = "#f5f5f5";
            this.generateTab.style.color = "#666";
            this.generateTab.style.fontWeight = "normal";
        } else if (mode === "generate") {
            this.generateTab.style.backgroundColor = "#4CAF50";
            this.generateTab.style.color = "white";
            this.generateTab.style.fontWeight = "bold";
            
            this.uploadTab.style.backgroundColor = "#f5f5f5";
            this.uploadTab.style.color = "#666";
            this.uploadTab.style.fontWeight = "normal";
        }
        
        this._updateUIForMode();
    }

    /**
     * Updates the UI based on the selected mode
     * @private
     * @returns {void}
     */
    _updateUIForMode() {
        const mode = this.currentMode;
        
        if (mode === "upload") {
            // Show file upload area
            this.fileUploadArea.style.display = "flex";
            this.queryInput.style.display = "none";
            this.processButton.textContent = _("Convert to MusicBlocks");
        } else if (mode === "generate") {
            // Show query input
            this.fileUploadArea.style.display = "none";
            this.queryInput.style.display = "block";
            this.processButton.textContent = _("Generate & Convert");
        }
        
        this._updateButtonState();
    }

    /**
     * Updates the button state based on current inputs
     * @private
     * @returns {void}
     */
    _updateButtonState() {
        const mode = this.currentMode;
        let canProcess = false;
        
        if (mode === "upload") {
            canProcess = this.selectedFile !== null;
        } else if (mode === "generate") {
            canProcess = this.queryInput.value.trim().length > 0;
        }
        
        this.processButton.disabled = !canProcess;
    }



    /**
     * Restores download button state if MIDI data exists
     * @private
     * @returns {void}
     */
    _restoreDownloadState() {
        // Check if we have stored MIDI data
        const storedMIDIData = sessionStorage.getItem('midiWidget_generatedMIDI');
        if (storedMIDIData) {
            try {
                this.generatedMIDIData = new Uint8Array(JSON.parse(storedMIDIData));
                if (this.downloadButton) {
                    this.downloadButton.style.display = "inline-block";
                }
            } catch (error) {
                console.error("Error restoring MIDI data:", error);
                sessionStorage.removeItem('midiWidget_generatedMIDI');
            }
        }
    }

    /**
     * Stores MIDI data persistently
     * @private
     * @param {ArrayBuffer} midiData - The MIDI data to store
     * @returns {void}
     */
    _storeMIDIData(midiData) {
        try {
            // Convert ArrayBuffer to Uint8Array for storage
            const uint8Array = new Uint8Array(midiData);
            const jsonData = JSON.stringify(Array.from(uint8Array));
            sessionStorage.setItem('midiWidget_generatedMIDI', jsonData);
            this.generatedMIDIData = midiData;
        } catch (error) {
            console.error("Error storing MIDI data:", error);
        }
    }

    /**
     * Downloads the generated MIDI file
     * @private
     * @returns {void}
     */
    _downloadMIDI() {
        if (!this.generatedMIDIData) {
            this._showStatus(_("No MIDI data available for download"), "error");
            return;
        }

        try {
            // Create a blob from the MIDI data
            const blob = new Blob([this.generatedMIDIData], { type: 'audio/midi' });
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `generated_music_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.mid`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Clean up the URL
            URL.revokeObjectURL(url);
            
            this._showStatus(_("MIDI file downloaded successfully!"), "success");
        } catch (error) {
            console.error("Error downloading MIDI:", error);
            this._showStatus(_("Error downloading MIDI file"), "error");
        }
    }

    /**
     * Shows a status message
     * @private
     * @param {string} message - The status message
     * @param {string} type - The type of status (info, success, error)
     * @returns {void}
     */
    _showStatus(message, type) {
        this.statusDisplay.style.display = "block";
        this.statusDisplay.textContent = message;
        
        // Set color based on type
        switch (type) {
            case "success":
                this.statusDisplay.style.backgroundColor = "#d4edda";
                this.statusDisplay.style.color = "#155724";
                this.statusDisplay.style.border = "1px solid #c3e6cb";
                break;
            case "error":
                this.statusDisplay.style.backgroundColor = "#f8d7da";
                this.statusDisplay.style.color = "#721c24";
                this.statusDisplay.style.border = "1px solid #f5c6cb";
                break;
            case "info":
            default:
                this.statusDisplay.style.backgroundColor = "#d1ecf1";
                this.statusDisplay.style.color = "#0c5460";
                this.statusDisplay.style.border = "1px solid #bee5eb";
                break;
        }

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.statusDisplay.style.display = "none";
        }, 5000);
    }

    /**
     * Shows the loading indicator with progress text
     * @private
     * @param {string} progressText - The progress message to display
     * @returns {void}
     */
    _showLoading(progressText) {
        this.loadingContainer.style.display = "block";
        this.progressText.textContent = progressText;
        this.processButton.disabled = true;
        this.processButton.textContent = _("Processing...");
        this.processButton.style.backgroundColor = "#9e9e9e";
        this.processButton.style.cursor = "not-allowed";
    }

    /**
     * Hides the loading indicator and resets the process button
     * @private
     * @returns {void}
     */
    _hideLoading() {
        this.loadingContainer.style.display = "none";
        this.processButton.disabled = false;
        this.processButton.style.backgroundColor = "#4CAF50";
        this.processButton.style.cursor = "pointer";
        
        // Reset button text based on current mode
        if (this.currentMode === "upload") {
            this.processButton.textContent = _("Convert to MusicBlocks");
        } else {
            this.processButton.textContent = _("Generate & Convert");
        }
    }

    /**
     * Updates the progress text during loading
     * @private
     * @param {string} progressText - The new progress message
     * @returns {void}
     */
    _updateProgress(progressText) {
        this.progressText.textContent = progressText;
    }
} 