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

   platformColor, LegoWidget
*/
/*
    Globals location
    - js/utils/platformstyle.js
        platformColor
    - js/widgets/legobricks.js
        LegoWidget
*/

/* exported LegoBricksVisualization */

/**
 * @file LegoBricksVisualization.js
 * @description LEGO Bricks visualization: drawing the column lines and generating the color
 * visualization image.
 *
 * The methods are moved as they were from the LegoWidget constructor. LegoWidget calls this
 * function with the widget as `this` (see LegoWidget.installModules), so every method is still
 * set on the widget instance and `this` inside it is still the widget.
 */
function LegoBricksVisualization() {
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
                vline.style.backgroundColor = platformColor.selectorSelected || "#0066FF";
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
        ctx.strokeStyle = platformColor.selectorSelected || "#0066FF";
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
        ctx.fillStyle = platformColor.background || "#f0f0f0";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Color mapping
        const colorMap = { ...LegoWidget.COLOR_HEX_MAP, unknown: "#C0C0C0" };

        // Draw each row
        let visualRowIndex = 0;
        this.colorData.forEach((rowData, rowIndex) => {
            if (!rowData) return;
            const y = visualRowIndex * rowHeight;
            visualRowIndex++;

            // Draw row background
            ctx.fillStyle =
                rowIndex % 2 === 0
                    ? platformColor.background || "#ffffff"
                    : platformColor.selectorBackgroundHOFF || "#f8f8f8";
            ctx.fillRect(0, y, canvasWidth, rowHeight);

            // Draw row label
            ctx.fillStyle = platformColor.textColor || "#000000";
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
                    ctx.strokeStyle = platformColor.strokeColor || "#333333";
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
}

if (typeof module !== "undefined") {
    module.exports = LegoBricksVisualization;
}
