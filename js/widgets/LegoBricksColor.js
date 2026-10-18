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

/* exported LegoBricksColor */

/**
 * @file LegoBricksColor.js
 * @description LEGO Bricks color detection: color families, HSL conversion, sampling a row and
 * building and merging its color segments.
 *
 * The methods are moved as they were from the LegoWidget constructor. LegoWidget calls this
 * function with the widget as `this` (see LegoWidget.installModules), so every method is still
 * set on the widget instance and `this` inside it is still the widget.
 */
function LegoBricksColor() {
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
     * Merges consecutive color segments with the same color to reduce fragmentation
     * @private
     */
    this._mergeConsecutiveColorSegments = function () {
        this.colorData.forEach(rowData => {
            if (!rowData || !rowData.colorSegments || rowData.colorSegments.length <= 1) return;

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

        // Resolve the shared off-screen canvas (pre-built in _activateMediaDisplay /
        // img.onload). Rebuild lazily if it was cleared, if the media element changed,
        // or if video dimensions updated once metadata loaded.
        const needsRebuild =
            !this._offscreenCanvas ||
            this._offscreenMediaElement !== mediaElement ||
            (this._offscreenIsVideo &&
                mediaElement.videoWidth > 0 &&
                (this._offscreenCanvas.width !== mediaElement.videoWidth ||
                    this._offscreenCanvas.height !== mediaElement.videoHeight));
        if (needsRebuild) {
            this._buildOffscreenCanvas();
        }
        if (!this._offscreenCanvas) {
            console.warn("No off-screen canvas available for color sampling");
            return;
        }

        const tempCanvas = this._offscreenCanvas;
        const ctx = this._offscreenCtx;

        // For live video, capture the current webcam frame into the shared canvas.
        // Static <img> pixels do not change between frames — no redraw needed.
        if (this._offscreenIsVideo) {
            try {
                ctx.drawImage(mediaElement, 0, 0, tempCanvas.width, tempCanvas.height);
            } catch (e) {
                console.error("Error updating off-screen canvas for video frame:", e);
                return;
            }
        }

        // Single layout-flush for both the media bounds and the overlay bounds.
        const mediaRect = mediaElement.getBoundingClientRect();
        const overlayRect = this.gridOverlay.getBoundingClientRect();

        // Calculate image position relative to overlay
        const imageOffsetX = mediaRect.left - overlayRect.left;
        const imageOffsetY = mediaRect.top - overlayRect.top;

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
        if (imageX < 0 || imageX >= mediaRect.width) {
            // We're outside the image horizontally - no need to sample
            return;
        }

        // Calculate canvas coordinates with proper scaling
        const scaleX = tempCanvas.width / mediaRect.width;
        const scaleY = tempCanvas.height / mediaRect.height;

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
            const row = this.matrixData.rows[rowIndex];
            this.colorData[rowIndex] = {
                note: row ? row.note : undefined,
                label: row ? row.label : undefined,
                colorSegments: []
            };
        }

        this.colorData[rowIndex].colorSegments.push({
            color: color.name,
            duration: duration,
            timestamp: performance.now()
        });
    };
}

if (typeof module !== "undefined") {
    module.exports = LegoBricksColor;
}
