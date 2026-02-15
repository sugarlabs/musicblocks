/*
   exported LegoWidget
*/

/*
   global

   _, piemenuVoices, docById, platformColor, noteToFrequency
*/

/**
 * Represents a LEGO Bricks Widget with Phrase Maker functionality.
 * @constructor
 */
function LegoWidget() {
    const ICONSIZE = 32;
    const WIDGETWIDTH = 1200;
    const WIDGETHEIGHT = 700;
    const ROW_HEIGHT = 40; // Fixed row height for both matrix and image canvas

    // Matrix data structure with pitch mappings
    this.matrixData = {
        rows: [
            {
                type: "pitch",
                label: "High C (Do)",
                icon: "HighC.png",
                color: "pitch-row",
                note: "C5"
            },
            { type: "pitch", label: "B (Ti)", icon: "B.png", color: "pitch-row", note: "B4" },
            { type: "pitch", label: "A (La)", icon: "A.png", color: "pitch-row", note: "A4" },
            { type: "pitch", label: "G (So)", icon: "G.png", color: "pitch-row", note: "G4" },
            { type: "pitch", label: "F (Fa)", icon: "F.png", color: "pitch-row", note: "F4" },
            { type: "pitch", label: "E (Mi)", icon: "E.png", color: "pitch-row", note: "E4" },
            { type: "pitch", label: "D (Re)", icon: "D.png", color: "pitch-row", note: "D4" },
            {
                type: "pitch",
                label: "Middle C (Do)",
                icon: "MiddleC.png",
                color: "pitch-row",
                note: "C4"
            },
            {
                type: "pitch",
                label: "B (Low Ti)",
                icon: "LowB.png",
                color: "pitch-row",
                note: "B3"
            },
            {
                type: "pitch",
                label: "Low C (Low Do)",
                icon: "LowC.png",
                color: "pitch-row",
                note: "C3"
            },
            { type: "pitch", label: "Zoom Controls", icon: "LowC.png", color: "pitch-row" }
        ],
        columns: 8,
        selectedCells: new Set()
    };

    // Widget properties
    this.widgetWindow = null;
    this.activity = null;
    this.isPlaying = false;
    this.isDragging = false;
    this.currentZoom = 1;
    this.verticalSpacing = 50;
    this.imageWrapper = null;
    this.synth = null;
    this.selectedInstrument = "electronic synth";
    this.hasGeneratedVisualization = false; // Flag to prevent double PNG downloads

    // Eye dropper and background color properties
    this.eyeDropperMode = false;
    this.selectedBackgroundColor = { name: "green", hue: 120 }; // Default green background
    this.eyeDropperCursor = null;

    // Pitch block handling properties (similar to PhraseMaker)
    this.blockNo = null;
    this.rowLabels = [];
    this.rowArgs = [];
    this._rowBlocks = [];
    this._rowMap = [];
    this._rowOffset = [];
    this._notesToPlay = []; // Array to store notes for action block export

    /**
     * Clears block references within the LegoWidget.
     * Resets arrays used to track row blocks.
     */
    this.clearBlocks = function () {
        this._rowBlocks = [];
        this._rowMap = [];
        this._rowOffset = [];
    };

    /**
     * Adds a row block to the LegoWidget matrix.
     * This method is called when encountering a pitch block during matrix creation.
     * @param {number} rowBlock - The pitch block identifier to add to the matrix row.
     */
    this.addRowBlock = function (rowBlock) {
        this._rowMap.push(this._rowBlocks.length);
        this._rowOffset.push(0);
        // In case there is a repeat block, use a unique block number
        // for each instance.
        while (this._rowBlocks.includes(rowBlock)) {
            rowBlock = rowBlock + 1000000;
        }
        this._rowBlocks.push(rowBlock);
    };

    /**
     * Generates rows based on the pitch blocks received from the LEGO bricks block.
     * @private
     */
    this._generateRowsFromPitchBlocks = function () {
        // Clear existing matrix data
        this.matrixData.rows = [];

        // Create a list of pitch entries for sorting
        const pitchEntries = [];

        // Generate rows based on the pitch blocks
        for (let i = 0; i < this.rowLabels.length; i++) {
            const pitchName = this.rowLabels[i];
            const octave = this.rowArgs[i];

            // Only process pitch blocks (skip drum blocks)
            if (octave !== -1) {
                // This is a pitch block
                const noteLabel = pitchName + octave;

                // Convert pitch to display name
                let displayName = pitchName;
                if (pitchName === "do") displayName = "Do";
                else if (pitchName === "re") displayName = "Re";
                else if (pitchName === "mi") displayName = "Mi";
                else if (pitchName === "fa") displayName = "Fa";
                else if (pitchName === "sol") displayName = "So";
                else if (pitchName === "la") displayName = "La";
                else if (pitchName === "ti") displayName = "Ti";
                else displayName = pitchName.toUpperCase();

                // Calculate frequency for sorting (same as phrasemaker)
                let frequency = 0;
                try {
                    if (typeof noteToFrequency !== "undefined") {
                        frequency = noteToFrequency(
                            noteLabel,
                            this.activity.turtles.ithTurtle(0).singer.keySignature
                        );
                    } else {
                        // Fallback frequency calculation if noteToFrequency is not available
                        frequency = this._calculateFallbackFrequency(pitchName, octave);
                    }
                } catch (e) {
                    // Fallback frequency calculation
                    frequency = this._calculateFallbackFrequency(pitchName, octave);
                }

                pitchEntries.push({
                    frequency: frequency,
                    type: "pitch",
                    label: displayName + " (" + octave + ")",
                    icon: "pitch.svg",
                    color: "pitch-row",
                    note: noteLabel,
                    pitch: pitchName,
                    octave: octave
                });
            }
        }

        // Sort pitch entries by frequency (highest first, like phrasemaker)
        pitchEntries.sort((a, b) => b.frequency - a.frequency);

        // Add sorted pitch entries to matrix data
        this.matrixData.rows = pitchEntries;

        // Add a control row at the end
        this.matrixData.rows.push({
            type: "control",
            label: "Zoom Controls",
            icon: "zoom.svg",
            color: "control-row"
        });

        // If no pitch blocks were provided, add some default rows for testing (already sorted)
        if (this.rowLabels.length === 0) {
            this.matrixData.rows = [
                {
                    type: "pitch",
                    label: "E4 (Mi)",
                    icon: "pitch.svg",
                    color: "pitch-row",
                    note: "E4"
                },
                {
                    type: "pitch",
                    label: "D4 (Re)",
                    icon: "pitch.svg",
                    color: "pitch-row",
                    note: "D4"
                },
                {
                    type: "pitch",
                    label: "C4 (Middle C)",
                    icon: "pitch.svg",
                    color: "pitch-row",
                    note: "C4"
                },
                { type: "control", label: "Zoom Controls", icon: "zoom.svg", color: "control-row" }
            ];
        }
    };

    /**
     * Calculates frequency for a pitch name and octave as fallback when noteToFrequency is not available.
     * @private
     * @param {string} pitchName - The pitch name (e.g., "do", "C", "re", "D")
     * @param {number} octave - The octave number
     * @returns {number} The calculated frequency
     */
    this._calculateFallbackFrequency = function (pitchName, octave) {
        // Handle both letter names and solfege
        const noteFreqs = {
            C: 261.63,
            do: 261.63,
            D: 293.66,
            re: 293.66,
            E: 329.63,
            mi: 329.63,
            F: 349.23,
            fa: 349.23,
            G: 392.0,
            sol: 392.0,
            A: 440.0,
            la: 440.0,
            B: 493.88,
            ti: 493.88
        };

        const baseFreq =
            noteFreqs[pitchName.toLowerCase()] ||
            noteFreqs[pitchName.toUpperCase()] ||
            noteFreqs["C"];
        return baseFreq * Math.pow(2, octave - 4);
    };

    /**
     * Initializes the LEGO Widget with Phrase Maker functionality.
     * @param {object} activity - The activity object.
     * @returns {void}
     */
    this.init = function (activity) {
        this.activity = activity;
        this.running = true;

        // Initialize audio synthesizer
        this._initAudio();

        const widgetWindow = window.widgetWindows.windowFor(this, "LEGO BRICKS");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        var that = this;

        widgetWindow.onclose = () => {
            this._stopWebcam();
            this._deactivateEyeDropper(); // Clean up eye dropper mode
            this.running = false;
            widgetWindow.destroy();
        };

        widgetWindow.onmaximize = this._scale.bind(this);

        // Add control buttons in left sidebar
        this.playButton = widgetWindow.addButton("play-button.svg", ICONSIZE, _("Play"));
        this.playButton.onclick = () => {
            this._playPhrase();
        };

        this.saveButton = widgetWindow.addButton("save-button.svg", ICONSIZE, _("Save"));
        this.saveButton.onclick = () => {
            this._savePhrase();
        };

        this.exportButton = widgetWindow.addButton("export-button.svg", ICONSIZE, _("Export"));
        this.exportButton.onclick = () => {
            this._exportPhrase();
        };

        this.uploadButton = widgetWindow.addButton(
            "upload-button.svg",
            ICONSIZE,
            _("Upload Image")
        );
        this.uploadButton.onclick = () => {
            this._uploadImage();
        };

        this.webcamButton = widgetWindow.addButton("webcam-button.svg", ICONSIZE, _("Webcam"));
        this.webcamButton.onclick = () => {
            this._startWebcam();
        };

        this.clearButton = widgetWindow.addButton("clear-button.svg", ICONSIZE, _("Clear"));
        this.clearButton.onclick = () => {
            this._clearPhrase();
        };

        // Create main container
        this.createMainContainer();

        widgetWindow.sendToCenter();
        this.widgetWindow = widgetWindow;

        // Generate rows based on pitch blocks
        this._generateRowsFromPitchBlocks();

        // Re-initialize row headers with the dynamic rows
        this._initializeRowHeaders();

        this._scale();
        this.activity.textMsg(
            _("LEGO Bricks - Phrase Maker with") +
                " " +
                this.rowLabels.length +
                " " +
                _(
                    "pitch rows (sorted by frequency, Instrument:" +
                        " " +
                        this.selectedInstrument +
                        ")"
                )
        );
    };

    /**
     * Initializes the audio synthesizer.
     * @private
     */
    this._initAudio = function () {
        // Create a new synthesizer instance
        this.synth = new Synth();
        this.synth.loadSamples();

        // Create the default electronic synth for all pitch playback
        this.synth.createSynth(0, this.selectedInstrument, this.selectedInstrument, null);
    };

    /**
     * Plays a note when a pitch row is clicked.
     * @private
     * @param {string} note - The note to play (e.g., "C4")
     * @param {number} duration - Duration in seconds (default 0.5)
     */
    this._playNote = function (note, duration = 0.5) {
        if (!this.synth) return;

        try {
            // Play the note using the selected instrument
            this.synth.trigger(0, note, duration, this.selectedInstrument, null, null, false, 0);
        } catch (e) {
            console.error("Error playing note:", e);
        }
    };

    /**
     * Initializes the row headers table with dividing lines.
     * @private
     * @returns {void}
     */
    this._initializeRowHeaders = function () {
        this.rowHeaderTable.innerHTML = "";
        this.rowHeaderTable.style.margin = "0";
        this.rowHeaderTable.style.padding = "0";
        this.rowHeaderTable.style.borderSpacing = "0";

        this.matrixData.rows.forEach((rowData, rowIndex) => {
            const row = this.rowHeaderTable.insertRow();
            row.style.height = "40px"; // ROW_HEIGHT + "px";
            row.style.margin = "0";
            row.style.padding = "0";
            row.style.position = "relative"; // Needed for absolute positioning of line

            const labelCell = row.insertCell();
            labelCell.style.display = "flex";
            labelCell.style.alignItems = "center";
            labelCell.style.padding = "0 8px";
            labelCell.style.margin = "0";
            labelCell.style.fontSize = "13px";
            labelCell.style.fontWeight = "bold";
            labelCell.style.border = "none"; // Remove default borders
            labelCell.style.backgroundColor = rowData.type === "pitch" ? "#77C428" : "#87ceeb";
            labelCell.style.gap = "8px";
            labelCell.style.height = "40px"; // ROW_HEIGHT + "px";
            labelCell.style.lineHeight = "40px"; // ROW_HEIGHT + "px";
            labelCell.style.boxSizing = "border-box";
            labelCell.style.cursor = rowData.note ? "pointer" : "default";

            // Add click handler for pitch rows
            if (rowData.note) {
                labelCell.onclick = () => {
                    this._playNote(rowData.note);
                };

                // Visual feedback on click
                labelCell.onmousedown = () => {
                    labelCell.style.transform = "scale(0.98)";
                    labelCell.style.boxShadow = "inset 0 0 8px rgba(0,0,0,0.2)";
                };

                labelCell.onmouseup = () => {
                    labelCell.style.transform = "";
                    labelCell.style.boxShadow = "";
                };

                labelCell.onmouseleave = () => {
                    labelCell.style.transform = "";
                    labelCell.style.boxShadow = "";
                };
            }

            // Create icon
            const icon = document.createElement("div");
            icon.style.width = "24px";
            icon.style.height = "24px";
            icon.style.backgroundColor = "#fff";
            icon.style.borderRadius = "50%";
            icon.style.marginRight = "6px";
            icon.style.flexShrink = "0";

            labelCell.appendChild(icon);
            labelCell.appendChild(document.createTextNode(rowData.label));

            // Add red line at the bottom of each row (except last)
            if (rowIndex < this.matrixData.rows.length - 1) {
                const line = document.createElement("div");
                line.style.position = "absolute";
                line.style.left = "0";
                line.style.right = "0";
                line.style.bottom = "0";
                line.style.height = "2px";
                line.style.backgroundColor = "red";
                line.style.zIndex = "5";
                row.appendChild(line);
            }
        });
    };

    /**
     * Creates the main container with matrix and image canvas.
     * @returns {void}
     */
    this.createMainContainer = function () {
        const mainContainer = document.createElement("div");
        mainContainer.style.display = "flex";
        mainContainer.style.height = "100%";
        mainContainer.style.overflow = "hidden";
        mainContainer.style.position = "relative";

        // Create a combined container for matrix and image
        const contentContainer = document.createElement("div");
        contentContainer.style.display = "flex";
        contentContainer.style.flex = "1";
        contentContainer.style.overflow = "hidden";

        // Create matrix container (just for row headers)
        const rowHeaderContainer = document.createElement("div");
        rowHeaderContainer.style.flex = "0 0 auto";
        rowHeaderContainer.style.backgroundColor = "#cccccc";
        rowHeaderContainer.style.overflowY = "auto";
        rowHeaderContainer.style.width = "180px";
        rowHeaderContainer.style.borderRight = "2px solid #888";

        // Create matrix table (just for row headers)
        this.rowHeaderTable = document.createElement("table");
        this.rowHeaderTable.style.borderCollapse = "collapse";
        this.rowHeaderTable.style.width = "100%";

        rowHeaderContainer.appendChild(this.rowHeaderTable);

        // Create image canvas container
        const imageCanvas = document.createElement("div");
        imageCanvas.style.flex = "1";
        imageCanvas.style.height = "100%";
        imageCanvas.style.backgroundColor = "#f5f5f5";
        imageCanvas.style.display = "flex";
        imageCanvas.style.flexDirection = "column";
        imageCanvas.style.overflow = "hidden";
        imageCanvas.style.position = "relative";

        // Create image display area
        this.imageDisplayArea = document.createElement("div");
        this.imageDisplayArea.style.position = "relative";
        this.imageDisplayArea.style.flex = "1";
        this.imageDisplayArea.style.display = "flex";
        this.imageDisplayArea.style.alignItems = "center";
        this.imageDisplayArea.style.justifyContent = "center";
        this.imageDisplayArea.style.padding = "0"; // Removed padding to prevent misalignment
        this.imageDisplayArea.style.overflow = "hidden";

        // Create placeholder text
        this.imagePlaceholder = document.createElement("div");
        this.imagePlaceholder.style.color = "#888";
        this.imagePlaceholder.style.fontSize = "16px";
        this.imagePlaceholder.style.textAlign = "center";
        this.imagePlaceholder.style.fontStyle = "italic";
        this.imagePlaceholder.textContent = "Click upload button to add an image";

        this.imageDisplayArea.appendChild(this.imagePlaceholder);

        // Create grid overlay
        this.gridOverlay = document.createElement("div");
        this.gridOverlay.style.position = "absolute";
        this.gridOverlay.style.top = "0";
        this.gridOverlay.style.left = "0";
        this.gridOverlay.style.right = "0";
        this.gridOverlay.style.bottom = "0";
        this.gridOverlay.style.pointerEvents = "none";
        this.gridOverlay.style.zIndex = "10";

        imageCanvas.appendChild(this.imageDisplayArea);
        imageCanvas.appendChild(this.gridOverlay);

        // Create zoom controls (positioned absolutely to prevent layout shifting)
        this.createZoomControls();
        imageCanvas.appendChild(this.zoomControls);

        // Add both to content container
        contentContainer.appendChild(rowHeaderContainer);
        contentContainer.appendChild(imageCanvas);

        // Add content container to main container
        mainContainer.appendChild(contentContainer);

        this.widgetWindow.getWidgetBody().appendChild(mainContainer);

        // Create hidden file input
        this.fileInput = document.createElement("input");
        this.fileInput.type = "file";
        this.fileInput.accept = "image/*";
        this.fileInput.style.display = "none";
        this.fileInput.onchange = e => this._handleImageUpload(e);
        document.body.appendChild(this.fileInput);

        // Initialize row headers
        this._initializeRowHeaders();
    };

    /**
     * Creates zoom controls with precise adjustments.
     * @returns {void}
     */
    this.createZoomControls = function () {
        this.zoomControls = document.createElement("div");
        this.zoomControls.style.position = "absolute"; // Changed to absolute positioning
        this.zoomControls.style.bottom = "0";
        this.zoomControls.style.left = "180px"; // Align with image area
        this.zoomControls.style.right = "0";
        this.zoomControls.style.padding = "10px";
        this.zoomControls.style.backgroundColor = "#f0f0f0";
        this.zoomControls.style.borderTop = "1px solid #888";
        this.zoomControls.style.display = "flex";
        this.zoomControls.style.alignItems = "center";
        this.zoomControls.style.gap = "8px";
        this.zoomControls.style.zIndex = "20"; // Ensure it's above the grid

        // Instrument selector (pie menu button)
        const instrumentLabel = document.createElement("span");
        instrumentLabel.textContent = "Instrument:";
        instrumentLabel.style.fontSize = "12px";
        instrumentLabel.style.fontWeight = "bold";

        this.instrumentButton = document.createElement("button");
        this.instrumentButton.textContent =
            this.selectedInstrument.charAt(0).toUpperCase() + this.selectedInstrument.slice(1);
        this.instrumentButton.style.fontSize = "12px";
        this.instrumentButton.style.marginRight = "16px";
        this.instrumentButton.style.padding = "4px 8px";
        this.instrumentButton.style.border = "1px solid #ccc";
        this.instrumentButton.style.borderRadius = "4px";
        this.instrumentButton.style.backgroundColor = "#f8f8f8";
        this.instrumentButton.style.cursor = "pointer";
        this.instrumentButton.onclick = () => this._createInstrumentPieMenu();

        const zoomLabel = document.createElement("span");
        zoomLabel.textContent = "Zoom:";
        zoomLabel.style.fontSize = "12px";

        const zoomOut = document.createElement("button");
        zoomOut.textContent = "−";
        zoomOut.onclick = () => this._adjustZoom(-0.01);

        this.zoomSlider = document.createElement("input");
        this.zoomSlider.type = "range";
        this.zoomSlider.min = "0.1";
        this.zoomSlider.max = "3";
        this.zoomSlider.step = "0.01";
        this.zoomSlider.value = "1";
        this.zoomSlider.style.width = "100px";
        this.zoomSlider.oninput = () => this._handleZoom();

        const zoomIn = document.createElement("button");
        zoomIn.textContent = "+";
        zoomIn.onclick = () => this._adjustZoom(0.01);

        this.zoomValue = document.createElement("span");
        this.zoomValue.textContent = "100%";
        this.zoomValue.style.fontSize = "12px";
        this.zoomValue.style.minWidth = "40px";

        // Add separator
        const separator = document.createElement("span");
        separator.textContent = "|";
        separator.style.margin = "0 8px";
        separator.style.color = "#888";

        // Add vertical spacing controls
        const spacingLabel = document.createElement("span");
        spacingLabel.textContent = "Column Spacing:";
        spacingLabel.style.fontSize = "12px";

        const spacingOut = document.createElement("button");
        spacingOut.textContent = "−";
        spacingOut.onclick = () => this._adjustVerticalSpacing(-5);

        this.spacingSlider = document.createElement("input");
        this.spacingSlider.type = "range";
        this.spacingSlider.min = "2";
        this.spacingSlider.max = "200";
        this.spacingSlider.step = "1";
        this.spacingSlider.value = "50";
        this.spacingSlider.style.width = "100px";
        this.spacingSlider.oninput = () => this._handleVerticalSpacing();

        const spacingIn = document.createElement("button");
        spacingIn.textContent = "+";
        spacingIn.onclick = () => this._adjustVerticalSpacing(1);

        this.spacingValue = document.createElement("span");
        this.spacingValue.textContent = "50px";
        this.spacingValue.style.fontSize = "12px";
        this.spacingValue.style.minWidth = "40px";

        // Add separator
        const separator2 = document.createElement("span");
        separator2.textContent = "|";
        separator2.style.margin = "0 8px";
        separator2.style.color = "#888";

        // Add eye dropper button
        const eyeDropperLabel = document.createElement("span");
        eyeDropperLabel.textContent = "Eye Dropper:";
        eyeDropperLabel.style.fontSize = "12px";
        eyeDropperLabel.style.fontWeight = "bold";

        this.eyeDropperButton = document.createElement("button");
        this.eyeDropperButton.textContent = "🎨";
        this.eyeDropperButton.style.fontSize = "12px";
        this.eyeDropperButton.style.padding = "4px 8px";
        this.eyeDropperButton.style.border = "1px solid #ccc";
        this.eyeDropperButton.style.borderRadius = "4px";
        this.eyeDropperButton.style.backgroundColor = "#f8f8f8";
        this.eyeDropperButton.style.cursor = "pointer";
        this.eyeDropperButton.title = "Click to activate eye dropper mode";
        this.eyeDropperButton.onclick = () => this._toggleEyeDropper();

        // Add separator
        const separator3 = document.createElement("span");
        separator3.textContent = "|";
        separator3.style.margin = "0 8px";
        separator3.style.color = "#888";

        // Add background color display
        const backgroundLabel = document.createElement("span");
        backgroundLabel.textContent = "Background:";
        backgroundLabel.style.fontSize = "12px";
        backgroundLabel.style.fontWeight = "bold";

        this.backgroundColorDisplay = document.createElement("span");
        this.backgroundColorDisplay.textContent = this.selectedBackgroundColor.name;
        this.backgroundColorDisplay.style.fontSize = "12px";
        this.backgroundColorDisplay.style.padding = "4px 8px";
        this.backgroundColorDisplay.style.border = "1px solid #ccc";
        this.backgroundColorDisplay.style.borderRadius = "4px";
        this.backgroundColorDisplay.style.backgroundColor = this._getColorHex(
            this.selectedBackgroundColor.name
        );
        this.backgroundColorDisplay.style.color = this._getContrastColor(
            this.selectedBackgroundColor.name
        );
        this.backgroundColorDisplay.style.minWidth = "60px";
        this.backgroundColorDisplay.style.textAlign = "center";

        this.zoomControls.appendChild(instrumentLabel);
        this.zoomControls.appendChild(this.instrumentButton);
        this.zoomControls.appendChild(zoomLabel);
        this.zoomControls.appendChild(zoomOut);
        this.zoomControls.appendChild(this.zoomSlider);
        this.zoomControls.appendChild(zoomIn);
        this.zoomControls.appendChild(this.zoomValue);
        this.zoomControls.appendChild(separator);
        this.zoomControls.appendChild(spacingLabel);
        this.zoomControls.appendChild(spacingOut);
        this.zoomControls.appendChild(this.spacingSlider);
        this.zoomControls.appendChild(spacingIn);
        this.zoomControls.appendChild(this.spacingValue);
        this.zoomControls.appendChild(separator2);
        this.zoomControls.appendChild(eyeDropperLabel);
        this.zoomControls.appendChild(this.eyeDropperButton);
        this.zoomControls.appendChild(separator3);
        this.zoomControls.appendChild(backgroundLabel);
        this.zoomControls.appendChild(this.backgroundColorDisplay);
    };

    /**
     * Initializes the matrix table.
     * @private
     * @returns {void}
     */
    this._initializeMatrix = function () {
        this.matrixTable.innerHTML = "";

        this.matrixData.rows.forEach((rowData, rowIndex) => {
            const row = this.matrixTable.insertRow();

            // Row label cell
            const labelCell = row.insertCell();
            labelCell.style.width = "180px";
            labelCell.style.height = ROW_HEIGHT + "px";
            labelCell.style.display = "flex";
            labelCell.style.alignItems = "center";
            labelCell.style.padding = "0 8px";
            labelCell.style.fontSize = "13px";
            labelCell.style.fontWeight = "bold";
            labelCell.style.border = "1px solid #888";
            labelCell.style.position = "sticky";
            labelCell.style.left = "0";
            labelCell.style.zIndex = "10";
            labelCell.style.gap = "8px";
            labelCell.style.backgroundColor = rowData.type === "pitch" ? "#77C428" : "#87ceeb";

            // Create icon (placeholder since we don't have actual icons)
            const icon = document.createElement("div");
            icon.style.width = "24px";
            icon.style.height = "24px";
            icon.style.backgroundColor = "#fff";
            icon.style.borderRadius = "50%";
            icon.style.marginRight = "6px";

            labelCell.appendChild(icon);
            labelCell.appendChild(document.createTextNode(rowData.label));
        });
    };

    /**
     * Saves the current phrase as action blocks.
     * @private
     * @returns {void}
     */
    this._savePhrase = function () {
        if (!this.colorData || this.colorData.length === 0) {
            this.activity.textMsg(_("No color data to save. Please scan an image first."));
            return;
        }

        // Collect notes to play from color detection data
        this._collectNotesToPlay();

        if (this._notesToPlay.length === 0) {
            this.activity.textMsg(_("No notes detected from color scanning."));
            return;
        }

        // Hide palettes for updating
        for (const name in this.activity.blocks.palettes.dict) {
            this.activity.blocks.palettes.dict[name].hideMenu(true);
        }
        this.activity.refreshCanvas();

        // Create action block stack
        const newStack = [
            [0, ["action", { collapsed: true }], 100, 100, [null, 1, null, null]],
            [1, ["text", { value: _("LEGO phrase") }], 0, 0, [0]]
        ];
        let endOfStackIdx = 0;

        // Process each note in the sequence
        for (let i = 0; i < this._notesToPlay.length; i++) {
            const note = this._notesToPlay[i];

            // Add the Note block and its value
            const idx = newStack.length;
            newStack.push([idx, "newnote", 0, 0, [endOfStackIdx, idx + 1, idx + 2, null]]);
            const n = newStack[idx][4].length;

            if (i === 0) {
                // Connect to action block
                newStack[endOfStackIdx][4][n - 2] = idx;
            } else {
                // Connect to previous note block
                newStack[endOfStackIdx][4][n - 1] = idx;
            }

            endOfStackIdx = idx;

            // Add note duration (note value as fraction)
            const delta = 5; // We're adding 4 blocks: vspace, divide, number, number

            // Add vspace to prevent divide block from obscuring the pitch block
            newStack.push([idx + 1, "vspace", 0, 0, [idx, idx + delta]]);

            // Note value saved as a fraction
            let numerator, denominator;
            if (note.noteValue === 1.5) {
                // Dotted half note = 3/2
                numerator = 3;
                denominator = 2;
            } else if (note.noteValue === 0.5) {
                // Double whole note = 1/2 (very long note)
                numerator = 1;
                denominator = 2;
            } else if (Number.isInteger(note.noteValue)) {
                // Standard note values (1, 2, 4, 8, etc.)
                numerator = 1;
                denominator = note.noteValue;
            } else {
                // For other fractional values, convert to proper fraction
                numerator = 1;
                denominator = Math.round(1 / note.noteValue);
            }

            newStack.push([idx + 2, "divide", 0, 0, [idx, idx + 3, idx + 4]]);
            newStack.push([idx + 3, ["number", { value: numerator }], 0, 0, [idx + 2]]);
            newStack.push([idx + 4, ["number", { value: denominator }], 0, 0, [idx + 2]]);

            // Connect the Note block flow to the divide and vspace blocks
            newStack[idx][4][1] = idx + 2; // divide block
            newStack[idx][4][2] = idx + 1; // vspace block

            let lastConnection = null;
            let previousBlock = idx + 1; // vspace block
            let thisBlock = idx + delta;

            if (note.pitches.length === 0 || note.isRest) {
                // Add rest block
                newStack.push([thisBlock, "rest2", 0, 0, [previousBlock, lastConnection]]);
            } else {
                // Add pitch blocks for each note
                for (let j = 0; j < note.pitches.length; j++) {
                    const pitch = note.pitches[j];

                    // Determine if this is the last pitch block
                    if (j === note.pitches.length - 1) {
                        lastConnection = null;
                    } else {
                        lastConnection = thisBlock + 3;
                    }

                    // Add pitch block
                    newStack.push([
                        thisBlock,
                        "pitch",
                        0,
                        0,
                        [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]
                    ]);

                    // Add pitch name
                    newStack.push([
                        thisBlock + 1,
                        ["solfege", { value: pitch.solfege }],
                        0,
                        0,
                        [thisBlock]
                    ]);

                    // Add octave number
                    newStack.push([
                        thisBlock + 2,
                        ["number", { value: pitch.octave }],
                        0,
                        0,
                        [thisBlock]
                    ]);

                    thisBlock += 3;
                    previousBlock = thisBlock - 3;
                }
            }
        }

        // Load the new blocks
        this.activity.blocks.loadNewBlocks(newStack);
        this.activity.textMsg(
            _("LEGO phrase saved as action blocks with ") + this._notesToPlay.length + _(" notes")
        );
    };

    /**
     * Collects notes to play from color detection data.
     * @private
     */
    this._collectNotesToPlay = function () {
        this._notesToPlay = [];

        if (!this.colorData || this.colorData.length === 0) {
            return;
        }

        // Analyze column boundaries to determine note timing
        const columnBoundaries = this._analyzeColumnBoundaries();

        // Filter and merge small segments to meet minimum 1/8 note duration
        const filteredBoundaries = this._filterSmallSegments(columnBoundaries);

        // For each time column, collect the notes that should play
        for (let colIndex = 0; colIndex < filteredBoundaries.length - 1; colIndex++) {
            const startTime = filteredBoundaries[colIndex];
            const endTime = filteredBoundaries[colIndex + 1];
            const duration = endTime - startTime;

            // Calculate note value based on duration - updated mapping per requirements
            // <350ms ignored completely (handled in filtering)
            // 350-750ms: 1/8 note, 750-1500ms: 1/4 note, 1500-3000ms: 1/2 note, 3000+ms: full note
            let noteValue;
            if (duration < 750) noteValue = 8;
            // eighth note (350-750ms)
            else if (duration < 1500) noteValue = 4;
            // quarter note (750-1500ms)
            else if (duration < 3000) noteValue = 2;
            // half note (1500-3000ms)
            else noteValue = 1; // whole note (3000ms+)
            let hasNonBackgroundColor = false;
            let pitches = []; // Array to collect pitches for this time column

            // Check each row for non-background colors in this time range
            this.colorData.forEach((rowData, rowIndex) => {
                if (rowData.colorSegments) {
                    let currentTime = 0;

                    for (const segment of rowData.colorSegments) {
                        const segmentStart = currentTime;
                        const segmentEnd = currentTime + segment.duration;

                        // Check if this segment overlaps with our time column
                        if (segmentStart < endTime && segmentEnd > startTime) {
                            // Calculate the actual overlap duration
                            const overlapStart = Math.max(segmentStart, startTime);
                            const overlapEnd = Math.min(segmentEnd, endTime);
                            const overlapDuration = overlapEnd - overlapStart;

                            // Only count as significant if overlap is substantial (>350ms)
                            // This prevents spillovers <350ms across blue lines from creating duplicate notes
                            if (overlapDuration > 1000) {
                                // Check if color is not the selected background color (meaning note should play)
                                if (segment.color !== this.selectedBackgroundColor.name) {
                                    hasNonBackgroundColor = true;

                                    // Convert row data to pitch information
                                    const pitch = this._convertRowToPitch(rowData);
                                    if (
                                        pitch &&
                                        !pitches.some(
                                            p =>
                                                p.solfege === pitch.solfege &&
                                                p.octave === pitch.octave
                                        )
                                    ) {
                                        pitches.push(pitch);
                                    }
                                }
                            } else if (segment.color !== this.selectedBackgroundColor.name) {
                                // Ignore small overlaps without logging
                            }
                        }

                        currentTime += segment.duration;
                    }
                }
            });

            // Add note or rest to the sequence
            this._notesToPlay.push({
                pitches: pitches,
                noteValue: noteValue,
                duration: duration,
                isRest: !hasNonBackgroundColor || pitches.length === 0
            });
        }
    };

    /**
     * Filters out small segments completely (no merging, just elimination).
     * Updated: <350ms segments are ignored and added to whichever side's blue line is taking majority.
     * @private
     * @param {Array} boundaries - Array of time boundaries
     * @returns {Array} Filtered boundaries with only segments >= 350ms duration
     */
    this._filterSmallSegments = function (boundaries) {
        if (boundaries.length <= 2) return boundaries;

        const minDuration = 1000; // Much larger minimum duration (1 second)
        const filteredBoundaries = [boundaries[0]]; // Always keep the start boundary

        // Process each potential segment
        for (let i = 1; i < boundaries.length; i++) {
            const segmentDuration =
                boundaries[i] - filteredBoundaries[filteredBoundaries.length - 1];

            // Only add this boundary if it creates a segment that meets the minimum duration
            if (segmentDuration >= minDuration) {
                filteredBoundaries.push(boundaries[i]);
            }
            // If segment is too small (<1000ms), we skip this boundary entirely
            // The time gets absorbed into the adjacent larger segment
        }

        // Ensure we have at least start and end boundaries
        if (filteredBoundaries.length === 1 && boundaries.length > 1) {
            // If we filtered out everything, add the final boundary to create one long segment
            filteredBoundaries.push(boundaries[boundaries.length - 1]);
        }

        return filteredBoundaries;
    };

    /**
     * Analyzes color segments to determine column boundaries.
     * @private
     * @returns {Array} Array of time boundaries in milliseconds
     */
    this._analyzeColumnBoundaries = function () {
        const boundaries = new Set([0]); // Start with 0

        // Collect all segment end times
        this.colorData.forEach(rowData => {
            if (rowData.colorSegments) {
                let currentTime = 0;
                rowData.colorSegments.forEach(segment => {
                    currentTime += segment.duration;
                    boundaries.add(currentTime);
                });
            }
        });

        // Convert to sorted array
        const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);

        // Merge boundaries that are very close together (within 500ms for much larger blocks)
        const mergedBoundaries = [sortedBoundaries[0]];
        for (let i = 1; i < sortedBoundaries.length; i++) {
            if (sortedBoundaries[i] - mergedBoundaries[mergedBoundaries.length - 1] > 500) {
                mergedBoundaries.push(sortedBoundaries[i]);
            }
        }

        return mergedBoundaries;
    };

    /**
     * Converts row data to pitch information.
     * @private
     * @param {Object} rowData - Row data containing note information
     * @returns {Object} Pitch object with solfege and octave
     */
    this._convertRowToPitch = function (rowData) {
        if (!rowData.note) return null;

        // Parse note string (e.g., "C4", "D5", etc.)
        const noteMatch = rowData.note.match(/^([A-G][#b]?)(\d+)$/);
        if (!noteMatch) return null;

        const noteName = noteMatch[1];
        const octave = parseInt(noteMatch[2]);

        // Convert note name to solfege
        const noteToSolfege = {
            "C": "do",
            "C#": "do♯",
            "Db": "re♭",
            "D": "re",
            "D#": "re♯",
            "Eb": "mi♭",
            "E": "mi",
            "F": "fa",
            "F#": "fa♯",
            "Gb": "sol♭",
            "G": "sol",
            "G#": "sol♯",
            "Ab": "la♭",
            "A": "la",
            "A#": "la♯",
            "Bb": "ti♭",
            "B": "ti"
        };

        const solfege = noteToSolfege[noteName] || "do";

        return {
            solfege: solfege,
            octave: octave
        };
    };

    /**
     * Exports the current phrase.
     * @private
     * @returns {void}
     */
    this._exportPhrase = function () {
        const phraseData = {
            selectedCells: Array.from(this.matrixData.selectedCells),
            rows: this.matrixData.rows.map(row => ({ type: row.type, label: row.label }))
        };

        this.activity.textMsg(_("Exporting phrase data: ") + JSON.stringify(phraseData));
    };

    /**
     * Clears all selected cells.
     * @private
     * @returns {void}
     */
    this._clearPhrase = function () {
        this.matrixData.selectedCells.clear();
        const selectedCells = this.matrixTable.querySelectorAll("[data-cell-id]");
        selectedCells.forEach(cell => {
            cell.style.backgroundColor = "";
            const dot = cell.querySelector(".cell-dot");
            if (dot) cell.removeChild(dot);
        });
        this.activity.textMsg(_("Phrase cleared"));
    };

    /**
     * Uploads an image.
     * @private
     * @returns {void}
     */
    this._uploadImage = function () {
        this.fileInput.click();
    };

    /**
     * Handles image upload.
     * @private
     * @param {Event} event - The file input change event.
     * @returns {void}
     */
    this._handleImageUpload = function (event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = e => {
                this.imageDisplayArea.innerHTML = "";

                this.imageWrapper = document.createElement("div");
                this.imageWrapper.style.position = "absolute";
                this.imageWrapper.style.left = "0px";
                this.imageWrapper.style.top = "0px";
                this.imageWrapper.style.transformOrigin = "top left";
                this.imageWrapper.style.cursor = "grab";

                const img = document.createElement("img");
                img.src = e.target.result;
                img.style.maxWidth = "100%";
                img.style.maxHeight = "100%";
                img.style.objectFit = "contain";
                img.style.borderRadius = "8px";
                img.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";

                this.imageWrapper.appendChild(img);
                this.imageDisplayArea.appendChild(this.imageWrapper);

                this._makeImageDraggable(this.imageWrapper);
                this._showZoomControls();
                this._drawGridLines();

                this.activity.textMsg(_("Image uploaded successfully"));
            };
            reader.readAsDataURL(file);
        }
    };

    /**
     * Starts webcam.
     * @private
     * @returns {void}
     */
    this._startWebcam = function () {
        this.imageDisplayArea.innerHTML = "";

        this.imageWrapper = document.createElement("div");
        this.imageWrapper.style.position = "absolute";
        this.imageWrapper.style.left = "0px";
        this.imageWrapper.style.top = "0px";
        this.imageWrapper.style.transformOrigin = "top left";
        this.imageWrapper.style.cursor = "grab";

        this.webcamVideo = document.createElement("video");
        this.webcamVideo.autoplay = true;
        this.webcamVideo.playsInline = true;
        this.webcamVideo.style.maxWidth = "100%";
        this.webcamVideo.style.maxHeight = "100%";

        this.imageWrapper.appendChild(this.webcamVideo);
        this.imageDisplayArea.appendChild(this.imageWrapper);

        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then(stream => {
                this.webcamVideo.srcObject = stream;
                this._makeImageDraggable(this.imageWrapper);
                this._showZoomControls();
                this._drawGridLines();
                this.activity.textMsg(_("Webcam started"));
            })
            .catch(err => {
                this.activity.textMsg(_("Webcam access denied: ") + err.message);
            });
    };

    /**
     * Stops webcam.
     * @private
     * @returns {void}
     */
    this._stopWebcam = function () {
        if (this.webcamVideo && this.webcamVideo.srcObject) {
            const tracks = this.webcamVideo.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    };

    /**
     * Toggles eye dropper mode for background color selection.
     * @private
     * @returns {void}
     */
    this._toggleEyeDropper = function () {
        this.eyeDropperMode = !this.eyeDropperMode;

        if (this.eyeDropperMode) {
            this._activateEyeDropper();
        } else {
            this._deactivateEyeDropper();
        }
    };

    /**
     * Activates eye dropper mode.
     * @private
     * @returns {void}
     */
    this._activateEyeDropper = function () {
        // Change cursor to crosshair for eye dropper mode
        if (this.imageDisplayArea) {
            this.imageDisplayArea.style.cursor = "crosshair";
        }

        // Update button appearance
        this.eyeDropperButton.style.backgroundColor = "#4CAF50";
        this.eyeDropperButton.style.color = "white";

        // Add event listeners for hover preview and click selection
        if (this.imageDisplayArea) {
            this.imageDisplayArea.addEventListener("mousemove", this._handleEyeDropperHover);
            this.imageDisplayArea.addEventListener("click", this._handleEyeDropperClick);
            this.imageDisplayArea.addEventListener("mouseleave", this._handleEyeDropperLeave);
        }

        // Create color preview tooltip
        this._createColorPreviewTooltip();

        this.activity.textMsg(
            _(
                "Eye dropper active - hover over image to preview colors, click to select background color"
            )
        );
    };

    /**
     * Deactivates eye dropper mode.
     * @private
     * @returns {void}
     */
    this._deactivateEyeDropper = function () {
        // Reset cursor
        if (this.imageDisplayArea) {
            this.imageDisplayArea.style.cursor = "default";
        }

        // Reset button appearance
        this.eyeDropperButton.style.backgroundColor = "";
        this.eyeDropperButton.style.color = "";

        // Remove event listeners
        if (this.imageDisplayArea) {
            this.imageDisplayArea.removeEventListener("mousemove", this._handleEyeDropperHover);
            this.imageDisplayArea.removeEventListener("click", this._handleEyeDropperClick);
            this.imageDisplayArea.removeEventListener("mouseleave", this._handleEyeDropperLeave);
        }

        // Remove color preview tooltip
        this._removeColorPreviewTooltip();
    };

    /**
     * Handles eye dropper click to select background color.
     * @private
     * @param {Event} event - The click event
     * @returns {void}
     */
    this._handleEyeDropperClick = function (event) {
        event.preventDefault();
        event.stopPropagation();

        // Hide the preview tooltip
        if (this.colorPreviewTooltip) {
            this.colorPreviewTooltip.style.display = "none";
        }

        // Get the clicked position relative to the image
        const clickedColor = this._sampleColorAtPosition(event.clientX, event.clientY);

        if (clickedColor) {
            this.selectedBackgroundColor = clickedColor;
            this._deactivateEyeDropper();
            this.eyeDropperMode = false;

            // Update UI to show selected color
            this._updateBackgroundColorDisplay();

            this.activity.textMsg(_("Background color selected: ") + clickedColor.name);
        } else {
            this.activity.textMsg(_("Could not sample color - please try clicking on the image"));
        }
    }.bind(this);

    /**
     * Samples color at a specific screen position.
     * @private
     * @param {number} screenX - Screen X coordinate
     * @param {number} screenY - Screen Y coordinate
     * @returns {object|null} Color family object or null
     */
    this._sampleColorAtPosition = function (screenX, screenY) {
        // Get the image or video element
        let mediaElement = null;
        if (this.imageWrapper) {
            mediaElement =
                this.imageWrapper.querySelector("img") || this.imageWrapper.querySelector("video");
        }

        if (!mediaElement) {
            return null;
        }

        // Create a temporary canvas to sample pixel data
        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d");

        // Set canvas size to match the media element's natural size
        tempCanvas.width =
            mediaElement.naturalWidth || mediaElement.videoWidth || mediaElement.width;
        tempCanvas.height =
            mediaElement.naturalHeight || mediaElement.videoHeight || mediaElement.height;

        // Draw the media element to the canvas
        try {
            ctx.drawImage(mediaElement, 0, 0, tempCanvas.width, tempCanvas.height);
        } catch (e) {
            console.log("Could not draw media element to canvas for color sampling:", e);
            return null;
        }

        // Convert screen coordinates to image coordinates
        const mediaRect = mediaElement.getBoundingClientRect();
        const imageX = ((screenX - mediaRect.left) / mediaRect.width) * tempCanvas.width;
        const imageY = ((screenY - mediaRect.top) / mediaRect.height) * tempCanvas.height;

        // Ensure coordinates are within bounds
        if (imageX < 0 || imageX >= tempCanvas.width || imageY < 0 || imageY >= tempCanvas.height) {
            return null;
        }

        // Sample the pixel
        const pixelData = ctx.getImageData(Math.floor(imageX), Math.floor(imageY), 1, 1).data;
        const [r, g, b] = pixelData;

        // Convert to color family
        const hsl = this._rgbToHsl(r, g, b);
        const colorFamily = this._getColorFamily(hsl[0], hsl[1], hsl[2]);

        return colorFamily;
    };

    /**
     * Creates a color preview tooltip for the eye dropper.
     * @private
     * @returns {void}
     */
    this._createColorPreviewTooltip = function () {
        if (this.colorPreviewTooltip) {
            this._removeColorPreviewTooltip();
        }

        this.colorPreviewTooltip = document.createElement("div");
        this.colorPreviewTooltip.style.position = "absolute";
        this.colorPreviewTooltip.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        this.colorPreviewTooltip.style.color = "white";
        this.colorPreviewTooltip.style.padding = "8px 12px";
        this.colorPreviewTooltip.style.borderRadius = "6px";
        this.colorPreviewTooltip.style.fontSize = "12px";
        this.colorPreviewTooltip.style.fontWeight = "bold";
        this.colorPreviewTooltip.style.pointerEvents = "none";
        this.colorPreviewTooltip.style.zIndex = "1000";
        this.colorPreviewTooltip.style.display = "none";
        this.colorPreviewTooltip.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";

        // Add color swatch inside tooltip
        this.colorSwatch = document.createElement("div");
        this.colorSwatch.style.width = "20px";
        this.colorSwatch.style.height = "20px";
        this.colorSwatch.style.border = "2px solid white";
        this.colorSwatch.style.borderRadius = "3px";
        this.colorSwatch.style.display = "inline-block";
        this.colorSwatch.style.marginRight = "8px";
        this.colorSwatch.style.verticalAlign = "middle";

        this.colorPreviewTooltip.appendChild(this.colorSwatch);

        this.colorPreviewText = document.createElement("span");
        this.colorPreviewText.style.verticalAlign = "middle";
        this.colorPreviewTooltip.appendChild(this.colorPreviewText);

        document.body.appendChild(this.colorPreviewTooltip);
    };

    /**
     * Removes the color preview tooltip.
     * @private
     * @returns {void}
     */
    this._removeColorPreviewTooltip = function () {
        if (this.colorPreviewTooltip) {
            document.body.removeChild(this.colorPreviewTooltip);
            this.colorPreviewTooltip = null;
            this.colorSwatch = null;
            this.colorPreviewText = null;
        }
    };

    /**
     * Handles eye dropper hover to show color preview.
     * @private
     * @param {Event} event - The mouse move event
     * @returns {void}
     */
    this._handleEyeDropperHover = function (event) {
        if (!this.eyeDropperMode || !this.colorPreviewTooltip) return;

        // Get the color at the current position
        const hoveredColor = this._sampleColorAtPosition(event.clientX, event.clientY);

        if (hoveredColor) {
            // Update tooltip content
            this.colorSwatch.style.backgroundColor = this._getColorHex(hoveredColor.name);
            this.colorPreviewText.textContent =
                hoveredColor.name.charAt(0).toUpperCase() + hoveredColor.name.slice(1);

            // Position tooltip near cursor
            this.colorPreviewTooltip.style.left = event.clientX + 15 + "px";
            this.colorPreviewTooltip.style.top = event.clientY - 40 + "px";
            this.colorPreviewTooltip.style.display = "block";
        } else {
            this.colorPreviewTooltip.style.display = "none";
        }
    }.bind(this);

    /**
     * Handles mouse leave from eye dropper area.
     * @private
     * @param {Event} event - The mouse leave event
     * @returns {void}
     */
    this._handleEyeDropperLeave = function (event) {
        if (this.colorPreviewTooltip) {
            this.colorPreviewTooltip.style.display = "none";
        }
    }.bind(this);

    /**
     * Updates the background color display in the UI.
     * @private
     * @returns {void}
     */
    this._updateBackgroundColorDisplay = function () {
        if (this.backgroundColorDisplay) {
            this.backgroundColorDisplay.textContent = this.selectedBackgroundColor.name;
            this.backgroundColorDisplay.style.backgroundColor = this._getColorHex(
                this.selectedBackgroundColor.name
            );
            this.backgroundColorDisplay.style.color = this._getContrastColor(
                this.selectedBackgroundColor.name
            );
        }
    };

    /**
     * Gets hex color code for a color name.
     * @private
     * @param {string} colorName - The color name
     * @returns {string} Hex color code
     */
    this._getColorHex = function (colorName) {
        const colorMap = {
            red: "#FF0000",
            orange: "#FFA500",
            yellow: "#FFFF00",
            green: "#00FF00",
            blue: "#0000FF",
            purple: "#800080",
            pink: "#FFC0CB",
            cyan: "#00FFFF",
            magenta: "#FF00FF",
            white: "#FFFFFF",
            black: "#000000",
            gray: "#808080"
        };
        return colorMap[colorName] || "#808080";
    };

    /**
     * Gets contrasting text color for a background color.
     * @private
     * @param {string} colorName - The color name
     * @returns {string} Contrasting text color
     */
    this._getContrastColor = function (colorName) {
        const lightColors = ["white", "yellow", "cyan", "pink", "orange"];
        return lightColors.includes(colorName) ? "#000000" : "#FFFFFF";
    };

    /**
     * Makes image draggable.
     * @private
     * @param {HTMLElement} wrapper - The image wrapper element.
     * @returns {void}
     */
    this._makeImageDraggable = function (wrapper) {
        let isDragging = false;
        let startX, startY, initialX, initialY;

        // Set fixed dimensions for the wrapper
        wrapper.style.width = "100%";
        wrapper.style.height = "100%";
        wrapper.style.overflow = "hidden";

        wrapper.onmousedown = e => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = parseFloat(wrapper.style.left) || 0;
            initialY = parseFloat(wrapper.style.top) || 0;
            wrapper.style.cursor = "grabbing";
            e.preventDefault();
        };

        document.onmousemove = e => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            wrapper.style.left = `${initialX + dx}px`;
            wrapper.style.top = `${initialY + dy}px`;
        };

        document.onmouseup = () => {
            if (isDragging) {
                isDragging = false;
                wrapper.style.cursor = "grab";
            }
        };
    };

    /**
     * Converts RGB values to a named color category with improved accuracy.
     * @private
     */
    this._getColorFamily = function (r, g, b) {
        const hsl = this._rgbToHsl(r, g, b);
        const [hue, saturation, lightness] = hsl;

        // Simple and accurate color detection

        // Handle very dark colors first
        if (lightness < 15) {
            return { name: "black", hue: hue, saturation: saturation, lightness: lightness };
        }

        // Handle grayscale colors (low saturation) - keep it simple
        if (saturation < 20) {
            if (lightness > 85)
                return { name: "white", hue: hue, saturation: saturation, lightness: lightness };
            if (lightness < 25)
                return { name: "black", hue: hue, saturation: saturation, lightness: lightness };
            return { name: "gray", hue: hue, saturation: saturation, lightness: lightness };
        }

        // Improved hue-based detection with clear boundaries to prevent orange/purple confusion
        let colorName = "unknown";

        if (hue >= 345 || hue < 15) {
            colorName = "red";
        } else if (hue >= 15 && hue < 45) {
            // Orange range - key fix for orange/purple confusion
            colorName = "orange";
        } else if (hue >= 45 && hue < 75) {
            colorName = "yellow";
        } else if (hue >= 75 && hue < 165) {
            colorName = "green";
        } else if (hue >= 165 && hue < 195) {
            colorName = "cyan";
        } else if (hue >= 195 && hue < 255) {
            colorName = "blue";
        } else if (hue >= 255 && hue < 285) {
            // Purple range - separated clearly from orange
            colorName = "purple";
        } else if (hue >= 285 && hue < 315) {
            colorName = "magenta";
        } else if (hue >= 315 && hue < 345) {
            colorName = "pink";
        }

        return {
            name: colorName,
            hue: hue,
            saturation: saturation,
            lightness: lightness
        };
    };
    /**
     * Gets color family from HSL values
     * @private
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} l - Lightness (0-100)
     * @returns {object} Color family object
     */
    this._getColorFamily = function (h, s, l) {
        // Handle grayscale first
        if (s < 15) {
            // Low saturation = grayscale
            if (l > 85) return { name: "white", hue: 0 };
            if (l < 15) return { name: "black", hue: 0 };
            return { name: "gray", hue: 0 };
        }

        // For saturated colors, determine by hue
        if (h >= 345 || h < 15) return { name: "red", hue: 0 };
        if (h >= 15 && h < 45) return { name: "orange", hue: 30 };
        if (h >= 45 && h < 75) return { name: "yellow", hue: 60 };
        if (h >= 75 && h < 165) return { name: "green", hue: 120 }; // FIXED: Proper green range!
        if (h >= 165 && h < 195) return { name: "cyan", hue: 180 };
        if (h >= 195 && h < 255) return { name: "blue", hue: 240 };
        if (h >= 255 && h < 285) return { name: "purple", hue: 270 };
        if (h >= 285 && h < 315) return { name: "magenta", hue: 300 };
        if (h >= 315 && h < 345) return { name: "pink", hue: 330 };

        return { name: "unknown", hue: h };
    };

    /**
     * Gets color family by name with simple mapping.
     * @private
     * @param {string} colorName - The color name
     * @returns {object} Color family object
     */
    this._getColorFamilyByName = function (colorName) {
        const colorFamilies = {
            red: { name: "red", hue: 0, saturation: 80, lightness: 50 },
            orange: { name: "orange", hue: 30, saturation: 80, lightness: 50 },
            yellow: { name: "yellow", hue: 60, saturation: 80, lightness: 50 },
            green: { name: "green", hue: 120, saturation: 80, lightness: 50 },
            cyan: { name: "cyan", hue: 180, saturation: 80, lightness: 50 },
            blue: { name: "blue", hue: 240, saturation: 80, lightness: 50 },
            purple: { name: "purple", hue: 270, saturation: 80, lightness: 50 },
            magenta: { name: "magenta", hue: 300, saturation: 80, lightness: 50 },
            pink: { name: "pink", hue: 330, saturation: 70, lightness: 75 },
            white: { name: "white", hue: 0, saturation: 0, lightness: 95 },
            gray: { name: "gray", hue: 0, saturation: 5, lightness: 50 },
            black: { name: "black", hue: 0, saturation: 0, lightness: 5 }
        };
        return colorFamilies[colorName] || null;
    };

    /**
     * Converts RGB to HSL.
     * @private
     */
    this._rgbToHsl = function (r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b),
            min = Math.min(r, g, b);
        let h = 0,
            s = 0,
            l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h *= 60;
        }

        return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
    };

    /**
     * Checks if two colors are similar enough to be considered the same.
     * @private
     * @param {object} color1 - First color family object.
     * @param {object} color2 - Second color family object.
     * @returns {boolean} True if colors are similar.
     */
    this._colorsAreSimilar = function (color1, color2) {
        if (!color1 || !color2) return false;

        // Exact name match
        if (color1.name === color2.name) return true;

        // Handle gray variations (keep simple)
        const grayColors = ["white", "gray", "black"];
        if (grayColors.includes(color1.name) && grayColors.includes(color2.name)) {
            // Allow some flexibility between white/gray/black based on lightness
            return Math.abs(color1.lightness - color2.lightness) < 30;
        }

        // For colored objects, use HSL distance
        if (color1.saturation > 20 && color2.saturation > 20) {
            const hueDiff = Math.min(
                Math.abs(color1.hue - color2.hue),
                360 - Math.abs(color1.hue - color2.hue)
            );
            const satDiff = Math.abs(color1.saturation - color2.saturation);
            const lightDiff = Math.abs(color1.lightness - color2.lightness);

            return hueDiff < 25 && satDiff < 20 && lightDiff < 20;
        }

        return false;
    };

    /**
     * Checks if a canvas row is within the actual image bounds and returns appropriate color
     * @private
     * @param {object} line - The scanning line object
     * @param {HTMLElement} mediaElement - The image or video element
     * @returns {object|null} Color family object or null if should continue with normal sampling
     */
    /**
     * Checks if a canvas row is within the actual image bounds and returns appropriate color
     * @private
     * @param {object} line - The scanning line object
     * @param {HTMLElement} mediaElement - The image or video element
     * @returns {object|null} Color family object or null if should continue with normal sampling
     */
    this._getColorForCanvasRow = function (line, mediaElement) {
        // Get the actual image display area
        const imageRect = mediaElement.getBoundingClientRect();
        const overlayRect = this.gridOverlay.getBoundingClientRect();

        // Calculate if this row is within the image bounds
        const rowTopInOverlay = line.topPos;
        const rowBottomInOverlay = line.bottomPos;

        // Get image position relative to overlay (account for positioning/dragging)
        const imageTop = imageRect.top - overlayRect.top;
        const imageBottom = imageTop + imageRect.height;

        // Check if row is completely outside image bounds (underflow/overflow)
        if (rowBottomInOverlay <= imageTop || rowTopInOverlay >= imageBottom) {
            // Row is outside image - return selected background color for empty canvas areas
            return this.selectedBackgroundColor || this._getColorFamilyByName("green");
        }

        // Row is within or partially within image bounds - continue with normal color sampling
        return null;
    };

    /**
     * Shows zoom controls.
     * @private
     * @returns {void}
     */
    this._showZoomControls = function () {
        // Controls are now always visible, just initialize their values
        this.currentZoom = 1;
        this.zoomSlider.value = "1";
        this.zoomValue.textContent = "100%";

        // Initialize vertical spacing controls
        this.spacingSlider.value = this.verticalSpacing.toString();
        this.spacingValue.textContent = this.verticalSpacing + "px";

        // No need to redraw lines here since zoom controls are absolutely positioned
    };

    /**
     * Adjusts zoom level.
     * @private
     * @param {number} delta - The zoom adjustment.
     * @returns {void}
     */
    this._adjustZoom = function (delta) {
        let newVal = parseFloat(this.zoomSlider.value) + delta;
        newVal = Math.max(0.1, Math.min(3, newVal));
        this.zoomSlider.value = newVal.toFixed(2);
        this._handleZoom();
    };

    /**
     * Adjusts vertical spacing level.
     * @private
     * @param {number} delta - The spacing adjustment.
     * @returns {void}
     */
    this._adjustVerticalSpacing = function (delta) {
        let newVal = parseFloat(this.spacingSlider.value) + delta;
        newVal = Math.max(2, Math.min(200, newVal));
        this.spacingSlider.value = newVal.toString();
        this._handleVerticalSpacing();
    };

    /**
     * Handles vertical spacing changes.
     * @private
     * @returns {void}
     */
    this._handleVerticalSpacing = function () {
        this.verticalSpacing = parseFloat(this.spacingSlider.value);
        this.spacingValue.textContent = this.verticalSpacing + "px";

        setTimeout(() => this._drawGridLines(), 50);
    };

    /**
     * Changes the selected instrument for playback.
     * @private
     * @returns {void}
     */
    this._changeInstrument = function () {
        this.selectedInstrument = this.instrumentSelect.value;

        // Recreate the synth with the new instrument
        if (this.synth) {
            this.synth.createSynth(0, this.selectedInstrument, this.selectedInstrument, null);
        }

        // Show a message indicating the instrument change
        this.activity.textMsg(_("Instrument changed to: ") + this.selectedInstrument);
    };

    /**
     * Creates a pie menu for instrument selection.
     * @private
     * @returns {void}
     */
    this._createInstrumentPieMenu = function () {
        // Define instrument options
        const voiceLabels = [
            _("Electronic Synth"),
            _("Piano"),
            _("Guitar"),
            _("Acoustic Guitar"),
            _("Electric Guitar"),
            _("Violin"),
            _("Viola"),
            _("Cello"),
            _("Bass"),
            _("Flute"),
            _("Clarinet"),
            _("Saxophone"),
            _("Trumpet"),
            _("Trombone"),
            _("Oboe"),
            _("Tuba"),
            _("Banjo"),
            _("Sine"),
            _("Square"),
            _("Sawtooth"),
            _("Triangle")
        ];

        const voiceValues = [
            "electronic synth",
            "piano",
            "guitar",
            "acoustic guitar",
            "electric guitar",
            "violin",
            "viola",
            "cello",
            "bass",
            "flute",
            "clarinet",
            "saxophone",
            "trumpet",
            "trombone",
            "oboe",
            "tuba",
            "banjo",
            "sine",
            "square",
            "sawtooth",
            "triangle"
        ];

        const categories = []; // No categories needed for instruments

        // Create a mock block object for the pie menu
        const mockBlock = {
            // Position the pie menu near the button
            container: {
                x: this.instrumentButton.offsetLeft + this.instrumentButton.offsetWidth / 2,
                y: this.instrumentButton.offsetTop + this.instrumentButton.offsetHeight / 2,
                children: [], // Mock children array for setChildIndex
                setChildIndex: (child, index) => {} // Mock function
            },

            // Mock text object that the pie menu expects
            text: {
                _text: this.selectedInstrument,
                get text() {
                    return this._text;
                },
                set text(value) {
                    this._text = value;
                    // Update the button text when the pie menu updates the text
                    if (this._updateCallback) {
                        this._updateCallback(value);
                    }
                },
                _updateCallback: null
            },

            value: this.selectedInstrument,

            activity: {
                canvas: {
                    offsetLeft: 0,
                    offsetTop: 0
                },
                blocksContainer: {
                    x: 0,
                    y: 0
                },
                getStageScale: () => 1,
                logo: {
                    synth: this.synth
                },
                turtles: {
                    ithTurtle: index => {
                        return {
                            singer: {
                                instrumentNames: [this.selectedInstrument]
                            }
                        };
                    }
                }
            },

            blocks: {
                blockScale: 1,
                turtles: {
                    _canvas: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    }
                }
            },

            // Mock methods needed by piemenu
            updateCache: () => {},
            updateValue: newValue => {
                // Update the instrument when selection is made
                this.selectedInstrument = newValue;
                this.instrumentButton.textContent =
                    newValue.charAt(0).toUpperCase() + newValue.slice(1);

                // Recreate the synth with the new instrument
                if (this.synth) {
                    this.synth.createSynth(
                        0,
                        this.selectedInstrument,
                        this.selectedInstrument,
                        null
                    );
                }

                // Show a message indicating the instrument change
                this.activity.textMsg(_("Instrument changed to: ") + this.selectedInstrument);

                // Update the mock block's value and text
                mockBlock.value = newValue;
                mockBlock.text.text = newValue;
            }
        };

        // Set up the text update callback to update our button
        mockBlock.text._updateCallback = newText => {
            // Update the instrument when text is set by pie menu
            const newInstrument =
                voiceValues[
                    voiceLabels.findIndex(label => label.toLowerCase() === newText.toLowerCase())
                ] || newText.toLowerCase();

            this.selectedInstrument = newInstrument;
            this.instrumentButton.textContent =
                newInstrument.charAt(0).toUpperCase() + newInstrument.slice(1);

            // Recreate the synth with the new instrument
            if (this.synth) {
                this.synth.createSynth(0, this.selectedInstrument, this.selectedInstrument, null);
            }

            // Show a message indicating the instrument change
            this.activity.textMsg(_("Instrument changed to: ") + this.selectedInstrument);
        };

        // Call the pie menu function
        piemenuVoices(
            mockBlock,
            voiceLabels,
            voiceValues,
            categories,
            this.selectedInstrument,
            false
        );
    };

    /**
     * Handles zoom changes.
     * @private
     * @returns {void}
     */
    this._handleZoom = function () {
        if (this.imageWrapper) {
            this.currentZoom = parseFloat(this.zoomSlider.value);
            this.imageWrapper.style.transform = `scale(${this.currentZoom})`;
            this.zoomValue.textContent = Math.round(this.currentZoom * 100) + "%";

            // Ensure the image wrapper maintains its dimensions
            this.imageWrapper.style.width = "100%";
            this.imageWrapper.style.height = "100%";

            setTimeout(() => this._drawGridLines(), 50);
        }
    };

    /**
     * Draws grid lines over the image.
     * @private
     * @returns {void}
     */
    this._drawGridLines = function () {
        if (!this.rowHeaderTable.rows.length || !this.gridOverlay) return;

        this.gridOverlay.innerHTML = "";

        const numRows = this.matrixData.rows.length;

        // Draw horizontal lines at each row boundary
        for (let i = 0; i < numRows; i++) {
            const line = document.createElement("div");
            line.style.position = "absolute";
            line.style.left = "0px";
            line.style.right = "0px";
            line.style.height = "2px";
            line.style.backgroundColor = "red";
            line.style.zIndex = "5";

            // Position line at the bottom of each row
            const position = (i + 1) * ROW_HEIGHT;
            line.style.top = `${position}px`;

            this.gridOverlay.appendChild(line);
        }

        // Draw vertical lines based on spacing
        const overlayRect = this.gridOverlay.getBoundingClientRect();
        const overlayWidth = overlayRect.width || this.gridOverlay.offsetWidth || 800; // fallback width

        if (overlayWidth > 0) {
            const numVerticalLines = Math.floor(overlayWidth / this.verticalSpacing);

            for (let i = 1; i <= numVerticalLines; i++) {
                const vline = document.createElement("div");
                vline.style.position = "absolute";
                vline.style.top = "0px";
                vline.style.bottom = "0px";
                vline.style.width = "2px";
                vline.style.backgroundColor = "blue";
                vline.style.zIndex = "5";

                // Position vertical line
                const position = i * this.verticalSpacing;
                vline.style.left = `${position}px`;

                this.gridOverlay.appendChild(vline);
            }
        }
    };

    /**
     * Scales the widget window and canvas based on the window's state.
     * @private
     * @returns {void}
     */
    this._scale = function () {
        // Redraw grid lines after scaling
        setTimeout(() => this._drawGridLines(), 300);
    };

    /**
     * Shows the widget.
     * @returns {void}
     */
    this.show = function () {
        if (this.widgetWindow) {
            this.widgetWindow.show();
        }
    };

    /**
     * Updates widget parameters.
     * @param {object} params - The parameters to update.
     * @returns {void}
     */
    this.updateParams = function (params) {
        // Handle parameter updates if needed
        if (params.zoom && this.zoomSlider) {
            this.zoomSlider.value = params.zoom;
            this._handleZoom();
        }
    };

    /**
     * Plays the current musical phrase with vertical scanning lines.
     * @private
     */
    this._playPhrase = function () {
        // Clear any existing animation
        this._stopPlayback();
        this.activity.textMsg(_("Scanning image with vertical lines..."));

        // Reset the visualization flag to allow new download
        this.hasGeneratedVisualization = false;

        // Get all grid lines (sorted by position)
        const gridLines = Array.from(this.gridOverlay.querySelectorAll("div"))
            .filter(el => el.style.backgroundColor === "red")
            .sort((a, b) => {
                const aTop = parseFloat(a.style.top);
                const bTop = parseFloat(b.style.top);
                return aTop - bTop;
            });

        // Create scanning lines for each musical note row
        this.scanningLines = [];
        this.colorData = [];

        // Get the actual canvas/overlay dimensions
        const overlayRect = this.gridOverlay.getBoundingClientRect();
        const canvasHeight = overlayRect.height || this.matrixData.rows.length * ROW_HEIGHT;
        const totalNoteRows = this.matrixData.rows.filter(row => row.note).length;

        // Create entries and scanning lines for each musical note
        this.matrixData.rows.forEach((row, index) => {
            if (!row.note) return; // Skip non-note rows

            this.colorData.push({
                note: row.note,
                label: row.label,
                colorSegments: []
            });

            // Calculate vertical position for this note - fixed to canvas grid
            const topPos = index * ROW_HEIGHT;
            const bottomPos = (index + 1) * ROW_HEIGHT;

            // Ensure we don't go beyond canvas boundaries
            const clampedTopPos = Math.max(0, Math.min(topPos, canvasHeight));
            const clampedBottomPos = Math.max(0, Math.min(bottomPos, canvasHeight));

            // Skip if this row is completely outside canvas bounds
            if (clampedTopPos >= canvasHeight || clampedBottomPos <= 0) {
                // Fill this row with selected background color for the entire duration
                this.colorData[this.colorData.length - 1].colorSegments.push({
                    color: this.selectedBackgroundColor.name,
                    duration: 5000, // Default scan duration
                    timestamp: performance.now()
                });
                return;
            }

            // Create vertical scanning line
            const line = document.createElement("div");
            line.style.position = "absolute";
            line.style.width = "3px"; // Slightly thicker line for better visibility
            line.style.height = clampedBottomPos - clampedTopPos + "px";
            line.style.backgroundColor = "rgba(255, 0, 0, 0.7)";
            line.style.zIndex = "20";
            line.style.left = "0px";
            line.style.top = clampedTopPos + "px";
            line.dataset.lineId = index;
            this.gridOverlay.appendChild(line);

            this.scanningLines.push({
                element: line,
                topPos: clampedTopPos,
                bottomPos: clampedBottomPos,
                currentX: 0,
                currentColor: null,
                colorStartTime: null,
                lastSignificantColor: null,
                completed: false,
                rowIndex: index
            });
        });

        // Animation variables
        this.isPlaying = true;
        this.startTime = performance.now();
        this.lastFrameTime = this.startTime;

        // Start animation
        this._animateLines();
    };

    /**
     * Animates all scanning lines with improved color detection
     * @private
     */
    this._animateLines = function () {
        if (!this.isPlaying) return;

        const now = performance.now();
        const deltaTime = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        const containerRect = this.gridOverlay.getBoundingClientRect();
        // Keep consistent time between vertical blue lines (column spacing)
        // Target: 500ms between each vertical line for instructor predictability
        const timeBetweenColumns = 0.5; // seconds per column spacing
        const scanSpeed = this.verticalSpacing / timeBetweenColumns; // pixels per second

        let allLinesCompleted = true;

        this.scanningLines.forEach(line => {
            if (line.completed) return;

            // Update horizontal position
            line.currentX += scanSpeed * deltaTime;
            const maxX = containerRect.width;

            // Check if we've reached the container boundary
            if (line.currentX > maxX) {
                line.completed = true;
                // Record final color segment if it existed
                if (line.lastSignificantColor && line.colorStartTime) {
                    const duration = (now - line.colorStartTime) / 1000;
                    if (duration > 1.0) {
                        // Only save segments longer than 1000ms
                        this.colorData[line.rowIndex].colorSegments.push({
                            color: line.lastSignificantColor.name,
                            duration: duration,
                            endTime: now - this.startTime
                        });
                    }
                }
                return;
            }

            // Check if we've reached the right edge of the actual image
            if (this._isLineBeyondImageHorizontally(line)) {
                line.completed = true;
                // Record final color segment if it existed
                if (line.lastSignificantColor && line.colorStartTime) {
                    const duration = (now - line.colorStartTime) / 1000;
                    if (duration > 1.0) {
                        // Only save segments longer than 1000ms
                        this.colorData[line.rowIndex].colorSegments.push({
                            color: line.lastSignificantColor.name,
                            duration: duration,
                            endTime: now - this.startTime
                        });
                    }
                }
                return;
            }

            allLinesCompleted = false;

            // Update line position
            line.element.style.left = line.currentX + "px";

            // Sample colors across the entire vertical line
            this._sampleAndDetectColor(line, now);
        });

        if (allLinesCompleted) {
            this._stopPlayback();
        } else {
            requestAnimationFrame(() => this._animateLines());
        }
    };

    /**
     * Checks if the scanning line has moved beyond the right edge of the actual image
     * @private
     * @param {object} line - The scanning line object
     * @returns {boolean} True if line is beyond image's right edge
     */
    this._isLineBeyondImageHorizontally = function (line) {
        // Get the image or video element
        let mediaElement = null;
        if (this.imageWrapper) {
            mediaElement =
                this.imageWrapper.querySelector("img") || this.imageWrapper.querySelector("video");
        }

        if (!mediaElement) {
            return false; // If no image, let it continue scanning the container
        }

        // Get the actual image display area
        const imageRect = mediaElement.getBoundingClientRect();
        const overlayRect = this.gridOverlay.getBoundingClientRect();

        // Calculate image position relative to overlay (account for positioning/dragging)
        const imageLeft = imageRect.left - overlayRect.left;
        const imageRight = imageLeft + imageRect.width;

        // Check if the scanning line is beyond the right edge of the image
        const lineX = line.currentX;

        if (lineX >= imageRight) {
            return true;
        }

        return false;
    };

    /**
     * Stops the current playback animation.
     * @private
     */
    this._stopPlayback = function () {
        this.isPlaying = false;

        // Save final color segments for all lines
        if (this.scanningLines) {
            const now = performance.now();
            this.scanningLines.forEach(line => {
                // Save the final color segment if it exists
                if (line.currentColor && line.colorStartTime) {
                    const duration = now - line.colorStartTime;
                    if (duration > 1000) {
                        // Save final segment if long enough (increased from 400ms)
                        this._addColorSegment(line.rowIndex, line.currentColor, duration);
                    }
                }

                // Remove the scanning line element
                if (line.element && line.element.parentNode) {
                    line.element.parentNode.removeChild(line.element);
                }
            });
            this.scanningLines = null;
        }

        // Only generate color visualization PNG if scanning was actually completed and not generated yet
        // This prevents the double download issue where _stopPlayback() is called at the start for cleanup
        if (!this.hasGeneratedVisualization && this.colorData && this.colorData.length > 0) {
            // Check if any colorData actually has color segments (indicating scanning occurred)
            const hasScannedData = this.colorData.some(
                row => row.colorSegments && row.colorSegments.length > 0
            );

            if (hasScannedData) {
                // Merge consecutive segments with same colors
                this._mergeConsecutiveColorSegments();

                this.hasGeneratedVisualization = true; // Set flag to prevent double generation
                setTimeout(() => {
                    this._generateColorVisualization();
                    this._drawColumnLinesOnCanvas(); // Draw column lines on the overlay
                }, 100); // Small delay to ensure all data is processed
            }
        }
    };

    /**
     * Merges consecutive color segments with the same color to reduce fragmentation
     * @private
     */
    this._mergeConsecutiveColorSegments = function () {
        this.colorData.forEach(rowData => {
            if (!rowData.colorSegments || rowData.colorSegments.length <= 1) return;

            const mergedSegments = [];
            let currentSegment = null;

            for (const segment of rowData.colorSegments) {
                if (!currentSegment) {
                    // First segment
                    currentSegment = {
                        color: segment.color,
                        duration: segment.duration,
                        endTime: segment.endTime
                    };
                } else if (this._shouldMergeColors(currentSegment.color, segment.color)) {
                    // Same or similar color - merge them
                    currentSegment.duration += segment.duration;
                    currentSegment.endTime = segment.endTime;
                } else {
                    // Different color - save current segment and start new one
                    mergedSegments.push(currentSegment);
                    currentSegment = {
                        color: segment.color,
                        duration: segment.duration,
                        endTime: segment.endTime
                    };
                }
            }

            // Don't forget to add the last segment
            if (currentSegment) {
                mergedSegments.push(currentSegment);
            }

            // Replace the original segments with merged ones
            rowData.colorSegments = mergedSegments;
        });
    };

    /**
     * Determines if two colors should be merged together
     * @private
     * @param {string} color1 - First color name
     * @param {string} color2 - Second color name
     * @returns {boolean} True if colors should be merged
     */
    this._shouldMergeColors = function (color1, color2) {
        // Exact match
        if (color1 === color2) return true;

        // Merge all gray variants (white, gray, black)
        const grayColors = ["white", "gray", "black"];
        if (grayColors.includes(color1) && grayColors.includes(color2)) {
            return true;
        }

        // Don't merge other distinct colors
        return false;
    };

    /**
     * Samples and detects colors along a vertical line
     * @private
     * @param {object} line - The scanning line object
     * @param {number} now - Current timestamp
     */
    this._sampleAndDetectColor = function (line, now) {
        // Get the image or video element
        let mediaElement = null;
        if (this.imageWrapper) {
            mediaElement =
                this.imageWrapper.querySelector("img") || this.imageWrapper.querySelector("video");
        }

        if (!mediaElement) {
            console.warn("No image or video element found for color sampling");
            return;
        }

        // Check if this row is outside image bounds - if so, use selected background color
        const boundColor = this._getColorForCanvasRow(line, mediaElement);
        if (boundColor) {
            // Row is outside image bounds, force selected background color
            if (!line.currentColor || line.currentColor.name !== boundColor.name) {
                const timeSinceLastChange = line.lastColorChangeTime
                    ? now - line.lastColorChangeTime
                    : 1000;
                if (timeSinceLastChange > 500) {
                    // Increased from 200ms for consistency
                    if (line.currentColor && line.colorStartTime) {
                        const duration = now - line.colorStartTime;
                        if (duration > 1000) {
                            // Increased from 400ms to match main detection
                            this._addColorSegment(line.rowIndex, line.currentColor, duration);
                        }
                    }
                    line.currentColor = boundColor;
                    line.colorStartTime = now;
                    line.lastColorChangeTime = now;
                }
            }
            return; // Don't sample pixels, just use the bound color
        }

        // Create a temporary canvas to sample pixel data
        const tempCanvas = document.createElement("canvas");
        const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });

        // Set canvas size to match the media element's display size
        const mediaRect = mediaElement.getBoundingClientRect();
        const overlayRect = this.gridOverlay.getBoundingClientRect();

        tempCanvas.width = mediaElement.naturalWidth || mediaElement.videoWidth || mediaRect.width;
        tempCanvas.height =
            mediaElement.naturalHeight || mediaElement.videoHeight || mediaRect.height;

        // Draw the media element to the canvas
        try {
            ctx.drawImage(mediaElement, 0, 0, tempCanvas.width, tempCanvas.height);
        } catch (e) {
            console.error("Error drawing image to canvas:", e);
            return;
        }

        // Get overlay and image positioning
        const imageRect = mediaElement.getBoundingClientRect();

        // Calculate image position relative to overlay
        const imageOffsetX = imageRect.left - overlayRect.left;
        const imageOffsetY = imageRect.top - overlayRect.top;

        // Convert overlay coordinates to image coordinates
        const overlayX = line.currentX;
        const overlayY1 = line.topPos;
        const overlayY2 = line.bottomPos;

        // Check if sampling area is within image bounds horizontally
        const imageX = overlayX - imageOffsetX;
        const imageY1 = overlayY1 - imageOffsetY;
        const imageY2 = overlayY2 - imageOffsetY;

        // Early return if we're outside the horizontal image bounds
        // (The animation loop will handle stopping the line when it reaches the edge)
        if (imageX < 0 || imageX >= imageRect.width) {
            // We're outside the image horizontally - no need to sample
            return;
        }

        // Calculate canvas coordinates with proper scaling
        const scaleX = tempCanvas.width / imageRect.width;
        const scaleY = tempCanvas.height / imageRect.height;

        const canvasX = Math.floor(imageX * scaleX);
        const canvasY1 = Math.max(0, Math.floor(imageY1 * scaleY));
        const canvasY2 = Math.min(tempCanvas.height, Math.floor(imageY2 * scaleY));

        // Sample multiple points along the vertical line
        const samplePoints = 32;
        const colorCounts = {};
        let totalSamples = 0;

        for (let i = 0; i < samplePoints; i++) {
            const y = canvasY1 + (i * (canvasY2 - canvasY1)) / (samplePoints - 1);

            if (canvasX >= 0 && canvasX < tempCanvas.width && y >= 0 && y < tempCanvas.height) {
                try {
                    const imageData = ctx.getImageData(canvasX, y, 1, 1);
                    const [r, g, b] = imageData.data;

                    // Skip very transparent pixels
                    if (imageData.data[3] < 128) continue;

                    // Convert RGB to HSL and get color family
                    const [h, s, l] = this._rgbToHsl(r, g, b);
                    const colorFamily = this._getColorFamily(h, s, l);

                    // FIXED: Include ALL colors - don't filter out ANY colors!
                    if (colorFamily && colorFamily.name !== "unknown") {
                        colorCounts[colorFamily.name] = (colorCounts[colorFamily.name] || 0) + 1;
                        totalSamples++;
                    }
                } catch (e) {
                    console.error("Error sampling pixel data:", e);
                }
            }
        }

        // Only proceed if we have enough color samples
        if (totalSamples < 1) return;

        // Find dominant color (must be at least 25% of samples)
        let dominantColor = null;
        let maxCount = 0;
        const minThreshold = Math.max(1, Math.floor(totalSamples * 0.25));

        for (const [colorName, count] of Object.entries(colorCounts)) {
            if (count > maxCount && count >= minThreshold) {
                maxCount = count;
                dominantColor = this._getColorFamilyByName(colorName);
            }
        }

        // Only record significant color changes
        if (
            dominantColor &&
            (!line.currentColor || !this._colorsAreSimilar(line.currentColor, dominantColor))
        ) {
            // Require a minimum time gap between color changes (reduces noise)
            const timeSinceLastChange = line.lastColorChangeTime
                ? now - line.lastColorChangeTime
                : 1000;

            if (timeSinceLastChange > 500) {
                // Increased from 200ms to 500ms for much less sensitivity
                // Color changed - save previous segment if it existed
                if (line.currentColor && line.colorStartTime) {
                    const duration = now - line.colorStartTime;
                    if (duration > 1000) {
                        // Increased minimum duration from 400ms to 1000ms
                        this._addColorSegment(line.rowIndex, line.currentColor, duration);
                    }
                }

                // Start new color segment
                line.currentColor = dominantColor;
                line.colorStartTime = now;
                line.lastColorChangeTime = now;
            }
        }
    };

    /**
     * Gets color family by name
     * @private
     * @param {string} colorName - The color name
     * @returns {object} Color family object
     */
    this._getColorFamilyByName = function (colorName) {
        const colorFamilies = {
            red: { name: "red", hue: 0 },
            orange: { name: "orange", hue: 30 },
            yellow: { name: "yellow", hue: 60 },
            green: { name: "green", hue: 120 }, // FIXED: Added green!
            cyan: { name: "cyan", hue: 180 }, // FIXED: Added cyan!
            blue: { name: "blue", hue: 240 },
            purple: { name: "purple", hue: 270 },
            magenta: { name: "magenta", hue: 300 }, // FIXED: Added magenta!
            pink: { name: "pink", hue: 330 },
            white: { name: "white", hue: 0 }, // FIXED: Added white!
            black: { name: "black", hue: 0 }, // FIXED: Added black!
            gray: { name: "gray", hue: 0 } // FIXED: Added gray!
        };
        return colorFamilies[colorName] || null;
    };

    /**
     * Adds a color segment to the data
     * @private
     * @param {number} rowIndex - Row index
     * @param {object} color - Color object
     * @param {number} duration - Duration in milliseconds
     */
    this._addColorSegment = function (rowIndex, color, duration) {
        if (!this.colorData[rowIndex]) {
            this.colorData[rowIndex] = {
                note: this.this.matrixData.rows[rowIndex].note,
                label: this.this.matrixData.rows[rowIndex].label,
                colorSegments: []
            };
        }

        this.colorData[rowIndex].colorSegments.push({
            color: color.name,
            duration: duration,
            timestamp: performance.now()
        });
    };

    /**
     * Draws column edge lines on the overlay canvas during scanning
     * @private
     */
    this._drawColumnLinesOnCanvas = function () {
        if (!this.colorData || this.colorData.length === 0) return;

        // Find existing column lines to avoid duplicates
        const existingColumnLines = this.gridOverlay.querySelectorAll(".column-line");
        existingColumnLines.forEach(line => line.remove());

        // Get filtered column boundaries (same as used for note export)
        const columnBoundaries = this._analyzeColumnBoundaries();
        const filteredBoundaries = this._filterSmallSegments(columnBoundaries);

        const overlayRect = this.gridOverlay.getBoundingClientRect();
        const availableWidth = overlayRect.width || 800;

        // Calculate total duration for proportional positioning
        const totalDuration =
            filteredBoundaries[filteredBoundaries.length - 1] - filteredBoundaries[0];

        // Draw blue vertical lines at filtered boundary positions
        filteredBoundaries.forEach((boundaryTime, index) => {
            if (index === 0) return; // Skip the first boundary (start)

            // Calculate position based on time proportion
            const timeFromStart = boundaryTime - filteredBoundaries[0];
            const x = Math.round((timeFromStart / totalDuration) * availableWidth);

            if (x > 0 && x < availableWidth) {
                const vline = document.createElement("div");
                vline.className = "column-line";
                vline.style.position = "absolute";
                vline.style.top = "0px";
                vline.style.bottom = "0px";
                vline.style.width = "2px";
                vline.style.backgroundColor = "#0066FF";
                vline.style.zIndex = "15"; // Above grid lines but below scanning lines
                vline.style.left = `${x}px`;

                this.gridOverlay.appendChild(vline);
            }
        });
    };

    /**
     * Detects column edges across all rows and draws vertical lines on the canvas
     * @private
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} canvasWidth - Width of the canvas
     * @param {number} canvasHeight - Height of the canvas
     * @param {number} startX - X position where segments start (after labels)
     * @param {number} availableWidth - Available width for segments
     */
    this._drawColumnLines = function (ctx, canvasWidth, canvasHeight, startX, availableWidth) {
        // Get filtered column boundaries (same as used for note export and overlay)
        const columnBoundaries = this._analyzeColumnBoundaries();
        const filteredBoundaries = this._filterSmallSegments(columnBoundaries);

        // Calculate total duration for proportional positioning
        const totalDuration =
            filteredBoundaries[filteredBoundaries.length - 1] - filteredBoundaries[0];

        // Draw blue vertical lines at filtered boundary positions
        ctx.strokeStyle = "#0066FF";
        ctx.lineWidth = 3; // Slightly thicker for PNG visibility

        filteredBoundaries.forEach((boundaryTime, index) => {
            if (index === 0) return; // Skip the first boundary (start)

            // Calculate X position based on time proportion
            const timeFromStart = boundaryTime - filteredBoundaries[0];
            const x = startX + Math.round((timeFromStart / totalDuration) * availableWidth);

            if (x >= startX && x <= startX + availableWidth) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvasHeight);
                ctx.stroke();
            }
        });
    };

    /**
     * Generates a PNG image visualization of detected color data (for testing)
     * @private
     */
    this._generateColorVisualization = function () {
        if (!this.colorData || this.colorData.length === 0) {
            return;
        }

        // Canvas dimensions
        const canvasWidth = 800;
        const rowHeight = 50;
        const canvasHeight = this.colorData.length * rowHeight;

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");

        // Fill background
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Color mapping
        const colorMap = {
            red: "#FF0000",
            orange: "#FFA500",
            yellow: "#FFFF00",
            green: "#00FF00",
            blue: "#0000FF",
            purple: "#800080",
            pink: "#FFC0CB",
            cyan: "#00FFFF",
            magenta: "#FF00FF",
            white: "#FFFFFF",
            black: "#000000",
            gray: "#808080",
            unknown: "#C0C0C0"
        };

        // Draw each row
        this.colorData.forEach((rowData, rowIndex) => {
            const y = rowIndex * rowHeight;

            // Draw row background
            ctx.fillStyle = rowIndex % 2 === 0 ? "#ffffff" : "#f8f8f8";
            ctx.fillRect(0, y, canvasWidth, rowHeight);

            // Draw row label
            ctx.fillStyle = "#000000";
            ctx.font = "12px Arial";
            ctx.textAlign = "left";
            ctx.fillText(`${rowData.label} (${rowData.note})`, 10, y + 20);

            // Draw color segments
            if (rowData.colorSegments && rowData.colorSegments.length > 0) {
                let currentX = 150; // Start after label
                const segmentHeight = 30;
                const segmentY = y + 10;
                const availableWidth = canvasWidth - 150 - 20; // Space for segments

                // Calculate total duration for proportional sizing
                const totalDuration = rowData.colorSegments.reduce(
                    (sum, segment) => sum + segment.duration,
                    0
                );

                rowData.colorSegments.forEach((segment, segmentIndex) => {
                    // Calculate segment width proportional to its duration
                    const segmentWidth = Math.max(
                        20,
                        (segment.duration / totalDuration) * availableWidth
                    );

                    // Draw color segment
                    ctx.fillStyle = colorMap[segment.color] || colorMap["unknown"];
                    ctx.fillRect(currentX, segmentY, segmentWidth, segmentHeight);

                    // Draw segment border
                    ctx.strokeStyle = "#333333";
                    ctx.lineWidth = 1;
                    ctx.strokeRect(currentX, segmentY, segmentWidth, segmentHeight);

                    // Draw color name if segment is wide enough
                    if (segmentWidth > 40) {
                        ctx.fillStyle =
                            segment.color === "white" || segment.color === "yellow"
                                ? "#000000"
                                : "#ffffff";
                        ctx.font = "10px Arial";
                        ctx.textAlign = "center";
                        ctx.fillText(
                            segment.color,
                            currentX + segmentWidth / 2,
                            segmentY + segmentHeight / 2 + 3
                        );
                    }

                    // Draw duration text below
                    ctx.fillStyle = "#666666";
                    ctx.font = "8px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText(
                        `${Math.round(segment.duration)}ms`,
                        currentX + segmentWidth / 2,
                        segmentY + segmentHeight + 12
                    );

                    currentX += segmentWidth + 2; // Small gap between segments
                });
            } else {
                // No colors detected
                ctx.fillStyle = "#cccccc";
                ctx.font = "12px Arial";
                ctx.textAlign = "left";
                ctx.fillText("No colors were detected", 150, y + 25);
            }

            // Draw the red lines
            ctx.strokeStyle = "#dddddd";

            ctx.lineWidth = 1;

            ctx.beginPath();

            ctx.moveTo(0, y + rowHeight);

            ctx.lineTo(canvasWidth, y + rowHeight);
            ctx.stroke();
        });

        // Draw column edge lines after all rows are drawn
        this._drawColumnLines(ctx, canvasWidth, canvasHeight, 150, canvasWidth - 150 - 20);

        // Add title
        ctx.fillStyle = "#000000";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Color Detection Visualization", canvasWidth / 2, -10);

        // Convert canvas to PNG and download
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `color_detection_${new Date().getTime()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, "image/png");

        // Play the music after visualization is generated
        this.playColorMusicPolyphonic(this.colorData);
    };

    /**
     * Plays all detected notes simultaneously, using filtered column boundaries.
     * Only plays when color is NOT the selected background color.
     * Updated to use same filtering logic as export (350ms minimum).
     * @param {Array} colorData - The colorData array from scanning.
     */
    this.playColorMusicPolyphonic = async function (colorData) {
        if (!this.synth) this._initAudio();

        // Use the same boundary analysis and filtering as export
        const columnBoundaries = this._analyzeColumnBoundaries();
        const filteredBoundaries = this._filterSmallSegments(columnBoundaries);

        // Build timeline using filtered boundaries instead of raw segments
        let events = [];

        // For each filtered time column, check which notes should play
        for (let colIndex = 0; colIndex < filteredBoundaries.length - 1; colIndex++) {
            const startTime = filteredBoundaries[colIndex];
            const endTime = filteredBoundaries[colIndex + 1];
            const duration = endTime - startTime;

            // Check each row for non-background colors in this time range
            colorData.forEach((rowData, rowIndex) => {
                if (rowData.colorSegments && rowData.note) {
                    let currentTime = 0;
                    let hasNonBackgroundColor = false;

                    // Check if this time column overlaps with any non-background segments
                    for (const segment of rowData.colorSegments) {
                        const segmentStart = currentTime;
                        const segmentEnd = currentTime + segment.duration;

                        // Check if this segment overlaps with our time column
                        if (segmentStart < endTime && segmentEnd > startTime) {
                            // Calculate the actual overlap duration
                            const overlapStart = Math.max(segmentStart, startTime);
                            const overlapEnd = Math.min(segmentEnd, endTime);
                            const overlapDuration = overlapEnd - overlapStart;

                            // Only count as significant if overlap is substantial (>350ms)
                            // This prevents spillovers <350ms across blue lines from creating duplicate notes
                            if (
                                overlapDuration > 1000 &&
                                segment.color !== this.selectedBackgroundColor.name
                            ) {
                                hasNonBackgroundColor = true;
                                break;
                            } else if (
                                overlapDuration <= 350 &&
                                segment.color !== this.selectedBackgroundColor.name
                            ) {
                                // Ignore small overlaps during playback
                            }
                        }
                        currentTime += segment.duration;
                    }

                    // If we found non-background color, add note on/off events
                    if (hasNonBackgroundColor) {
                        events.push({
                            time: startTime,
                            type: "on",
                            note: rowData.note,
                            rowIdx: rowIndex
                        });
                        events.push({
                            time: endTime,
                            type: "off",
                            note: rowData.note,
                            rowIdx: rowIndex
                        });
                    }
                }
            });
        }

        // Sort events by time
        events.sort((a, b) => a.time - b.time);

        // Track which notes are currently playing
        let playingNotes = new Set();
        let lastTime = 0;

        for (let i = 0; i < events.length; i++) {
            const evt = events[i];
            const waitTime = evt.time - lastTime;
            if (waitTime > 0) {
                // Wait for the time until the next event
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            if (evt.type === "on") {
                // Start note (if not already playing)
                if (!playingNotes.has(evt.note)) {
                    this.synth.trigger(
                        0,
                        evt.note,
                        999,
                        this.selectedInstrument,
                        null,
                        null,
                        false,
                        0
                    ); // Long duration, will stop manually
                    playingNotes.add(evt.note);
                }
            } else if (evt.type === "off") {
                // Stop note
                this.synth.stopSound(0, this.selectedInstrument, evt.note);
                playingNotes.delete(evt.note);
            }
            lastTime = evt.time;
        }
        // Ensure all notes are stopped at the end
        playingNotes.forEach(note => {
            this.synth.stopSound(0, this.selectedInstrument, note);
        });
    };
}
