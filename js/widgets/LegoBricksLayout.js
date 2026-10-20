/**
 * MusicBlocks
 *
 * @copyright 2025-26 Music Blocks contributors
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/*
   global

   _, LegoWidget
*/
/*
    Globals location
    - js/utils/utils.js
        _
    - js/widgets/legobricks.js
        LegoWidget
*/

/* exported LegoBricksLayout */

/**
 * @file LegoBricksLayout.js
 * @description LEGO Bricks layout: the widget window, toolbar, main container, the control bar,
 * zoom, vertical spacing and grid lines.
 *
 * The methods are moved as they were from the LegoWidget constructor. LegoWidget calls this
 * function with the widget as `this` (see LegoWidget.installModules), so every method is still
 * set on the widget instance and `this` inside it is still the widget.
 */
function LegoBricksLayout() {
    /**
     * Creates the widget window and wires up its close/maximize behavior.
     * @private
     * @returns {object} The created widget window.
     */
    this._createWidgetWindow = function () {
        const widgetWindow = window.widgetWindows.windowFor(this, "LEGO Bricks");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        widgetWindow.onclose = () => {
            this._stopPlayback();
            this._clearWidgetTimers();
            this._stopWebcam();
            this._deactivateEyeDropper(); // Clean up eye dropper mode
            this._cleanupDragListeners(); // Clean up drag event listeners
            if (this._animationFrameId !== null) {
                cancelAnimationFrame(this._animationFrameId);
                this._animationFrameId = null;
            }
            if (this._fileInput !== null) {
                if (this._fileInput.parentNode) {
                    this._fileInput.parentNode.removeChild(this._fileInput);
                }
                this._fileInput = null;
            }
            this.imageWrapper = null;
            this.webcamVideo = null;
            this._offscreenCanvas = null;
            this._offscreenCtx = null;
            this._offscreenMediaElement = null;
            this.running = false;
            widgetWindow.destroy();
        };

        widgetWindow.onmaximize = this._scale.bind(this);

        return widgetWindow;
    };

    /**
     * Adds the control buttons to the widget window's sidebar.
     * @private
     * @param {object} widgetWindow - The widget window to add buttons to.
     * @returns {void}
     */
    this._createToolbarButtons = function (widgetWindow) {
        this.playButton = widgetWindow.addButton("play-button.svg", LegoWidget.ICONSIZE, _("Play"));
        this.playButton.onclick = () => {
            if (this.isPlaying) {
                this._stopPlayback();
            } else {
                this._playPhrase();
                const img = this.playButton.querySelector("img");
                if (img) img.src = "header-icons/stop-button.svg";
            }
        };

        this.saveButton = widgetWindow.addButton("save-button.svg", LegoWidget.ICONSIZE, _("Save"));
        this.saveButton.onclick = () => {
            this._savePhrase();
        };

        this.exportButton = widgetWindow.addButton(
            "export-button.svg",
            LegoWidget.ICONSIZE,
            _("Export")
        );
        this.exportButton.onclick = () => {
            this._exportPhrase();
        };

        this.uploadButton = widgetWindow.addButton(
            "upload-button.svg",
            LegoWidget.ICONSIZE,
            _("Upload Image")
        );
        this.uploadButton.onclick = () => {
            this._uploadImage();
        };

        this.webcamButton = widgetWindow.addButton(
            "webcam-button.svg",
            LegoWidget.ICONSIZE,
            _("Webcam")
        );
        this.webcamButton.onclick = () => {
            this._startWebcam();
        };

        this.clearButton = widgetWindow.addButton(
            "clear-button.svg",
            LegoWidget.ICONSIZE,
            _("Clear")
        );
        this.clearButton.onclick = () => {
            this._clearPhrase();
        };
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
        this._fileInput = document.createElement("input");
        this._fileInput.type = "file";
        this._fileInput.accept = "image/*";
        this._fileInput.style.display = "none";
        this._fileInput.onchange = e => this._handleImageUpload(e);
        document.body.appendChild(this._fileInput);
    };

    /**
     * Creates the instrument selector label and pie-menu button.
     * @private
     * @returns {HTMLElement[]} Elements to append, in display order.
     */
    this._createInstrumentControls = function () {
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

        return [instrumentLabel, this.instrumentButton];
    };

    /**
     * Creates the zoom label, +/- buttons, slider, and value display.
     * @private
     * @returns {HTMLElement[]} Elements to append, in display order.
     */
    this._createZoomSliderControls = function () {
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

        return [zoomLabel, zoomOut, this.zoomSlider, zoomIn, this.zoomValue];
    };

    /**
     * Creates the column-spacing label, +/- buttons, slider, and value display.
     * @private
     * @returns {HTMLElement[]} Elements to append, in display order.
     */
    this._createSpacingControls = function () {
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
        spacingIn.onclick = () => this._adjustVerticalSpacing(5);

        this.spacingValue = document.createElement("span");
        this.spacingValue.textContent = "50px";
        this.spacingValue.style.fontSize = "12px";
        this.spacingValue.style.minWidth = "40px";

        return [spacingLabel, spacingOut, this.spacingSlider, spacingIn, this.spacingValue];
    };

    /**
     * Creates the eye dropper label and toggle button.
     * @private
     * @returns {HTMLElement[]} Elements to append, in display order.
     */
    this._createEyeDropperControls = function () {
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

        return [eyeDropperLabel, this.eyeDropperButton];
    };

    /**
     * Creates the background color label and swatch display.
     * @private
     * @returns {HTMLElement[]} Elements to append, in display order.
     */
    this._createBackgroundColorControls = function () {
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

        return [backgroundLabel, this.backgroundColorDisplay];
    };

    /**
     * Creates zoom controls with precise adjustments.
     * @returns {void}
     */
    this.createZoomControls = function () {
        this.zoomControls = document.createElement("div");
        Object.assign(this.zoomControls.style, {
            position: "absolute", // Changed to absolute positioning
            bottom: "0",
            left: "180px", // Align with image area
            right: "0",
            padding: "10px",
            backgroundColor: "#f0f0f0",
            borderTop: "1px solid #888",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: "20" // Ensure it's above the grid
        });

        const elements = [
            ...this._createInstrumentControls(),
            ...this._createZoomSliderControls(),
            LegoWidget.createControlSeparator(),
            ...this._createSpacingControls(),
            LegoWidget.createControlSeparator(),
            ...this._createEyeDropperControls(),
            LegoWidget.createControlSeparator(),
            ...this._createBackgroundColorControls()
        ];

        elements.forEach(element => this.zoomControls.appendChild(element));
    };

    /**
     * Initializes the matrix table.
     * @private
     * @returns {void}
     */
    this._initializeMatrix = function () {
        if (!this.matrixTable) return;
        this.matrixTable.replaceChildren();

        this.matrixData.rows.forEach((rowData, rowIndex) => {
            const row = this.matrixTable.insertRow();

            // Row label cell
            const labelCell = row.insertCell();
            labelCell.style.width = "180px";
            labelCell.style.height = LegoWidget.ROW_HEIGHT + "px";
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

        this._setWidgetTimeout(() => this._drawGridLines(), 50);
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

            this._setWidgetTimeout(() => this._drawGridLines(), 50);
        }
    };

    /**
     * Draws grid lines over the image.
     * @private
     * @returns {void}
     */
    this._drawGridLines = function () {
        if (!this.rowHeaderTable.rows.length || !this.gridOverlay) return;

        // Keep the scanning lines of an in-progress playback attached to the overlay
        const scanningElements = (this.scanningLines || []).map(line => line.element);
        this.gridOverlay.replaceChildren(...scanningElements);

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
            const position = (i + 1) * LegoWidget.ROW_HEIGHT;
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
        this._setWidgetTimeout(() => this._drawGridLines(), 300);
    };
}

if (typeof module !== "undefined") {
    module.exports = LegoBricksLayout;
}
