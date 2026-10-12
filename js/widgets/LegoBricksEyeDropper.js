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

/* exported LegoBricksEyeDropper */

/**
 * @file LegoBricksEyeDropper.js
 * @description LEGO Bricks eye dropper: picking the background color from the image, its preview
 * tooltip and the color display.
 *
 * The methods are moved as they were from the LegoWidget constructor. LegoWidget calls this
 * function with the widget as `this` (see LegoWidget.installModules), so every method is still
 * set on the widget instance and `this` inside it is still the widget.
 */
function LegoBricksEyeDropper() {
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
        // Clean up any existing listeners and tooltip to prevent duplicate event listener accumulation
        this._deactivateEyeDropper();

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
                "Eye dropper active - hover over image to preview colors, click to select background color."
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
        if (this.eyeDropperButton) {
            this.eyeDropperButton.style.backgroundColor = "";
            this.eyeDropperButton.style.color = "";
        }

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

            this.activity.textMsg(
                _("Background color selected: %s").replace(/%s/g, clickedColor.name)
            );
        } else {
            this.activity.textMsg(_("Could not sample color - please try clicking on the image."));
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
            console.warn("Could not draw media element to canvas for color sampling:", e);
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

        // Sample the pixel. A cross-origin media element taints the canvas
        // silently: drawImage above succeeds and the SecurityError is raised
        // here, on the first read, so this call needs its own guard.
        let pixelData;
        try {
            pixelData = ctx.getImageData(Math.floor(imageX), Math.floor(imageY), 1, 1).data;
        } catch (e) {
            console.warn("Could not read pixel data for color sampling:", e);
            return null;
        }
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
        return LegoWidget.COLOR_HEX_MAP[colorName] || "#808080";
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
}

if (typeof module !== "undefined") {
    module.exports = LegoBricksEyeDropper;
}
