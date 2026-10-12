/**
 * MusicBlocks
 *
 * @copyright 2016-21 Walter Bender
 * @copyright 2016 Hemant Kasat
 * @copyright 2026 Music Blocks contributors
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

   platformColor, rationalToFraction
*/
/*
    Globals location
    - js/utils/utils.js
        rationalToFraction
    - js/utils/platformstyle.js
        platformColor
*/

/* exported RhythmRulerCircular */

/**
 * @file RhythmRulerCircular.js
 * @description Rhythm Maker the circular view: toggling it, drawing the rings, hit testing, and
 * dissecting or tying cells with the mouse.
 *
 * The methods are moved as they were from the RhythmRuler class, which copies them onto
 * RhythmRuler.prototype (see RhythmRuler.installModules), so `this` is still the widget.
 */
class RhythmRulerCircular {
    /**
     * Toggles between linear (table) and circular (canvas) views.
     * @private
     */
    _refreshCircularView() {
        if (this._circularView && this._circularCanvas) {
            this._drawCircularView();
        }
    }

    /**
     * Toggles between linear (table) and circular (canvas) views.
     * @private
     */
    _toggleCircularView() {
        if (this._circularView) {
            this._rhythmRulerTable.style.display = "none";
            if (!this._circularCanvas) {
                this._circularCanvas = document.createElement("canvas");
                this._circularCanvas.style.display = "block";
                this._circularCanvas.style.margin = "auto";
                // touch-action: none lets us handle all pointer movement
                // ourselves without the browser intercepting pinch/pan gestures.
                this._circularCanvas.style.touchAction = "none";
                // Use Pointer Events so the circular drag-to-edit works on
                // touchscreens and stylus devices, not just mouse.
                this._circularPointerDownHandler = event => {
                    this._onCircularMouseDown(event);
                };
                this._circularPointerMoveHandler = event => {
                    this._onCircularMouseMove(event);
                };
                this._circularPointerUpHandler = event => {
                    this._onCircularMouseUp(event);
                };
                // Both pointercancel and pointerleave perform the same
                // cleanup — extract to a named handler to avoid duplication
                // and match the __mouseDownHandler/__mouseUpHandler convention.
                this._circularDragEndHandler = () => {
                    if (this._circularDragTo !== null) {
                        this._circularDragTo = null;
                        this._drawCircularView();
                    }
                };
                this._circularCanvas.addEventListener(
                    "pointerdown",
                    this._circularPointerDownHandler
                );
                this._circularCanvas.addEventListener(
                    "pointermove",
                    this._circularPointerMoveHandler
                );
                this._circularCanvas.addEventListener("pointerup", this._circularPointerUpHandler);
                this._circularCanvas.addEventListener(
                    "pointercancel",
                    this._circularDragEndHandler
                );
                this._circularCanvas.addEventListener("pointerleave", this._circularDragEndHandler);
                this.widgetWindow.getWidgetBody().append(this._circularCanvas);
            }
            this._circularCanvas.style.display = "block";
            this._drawCircularView();
        } else {
            if (this._circularCanvas) {
                this._circularCanvas.style.display = "none";
            }
            this._rhythmRulerTable.style.display = "";
            // Refresh zebra stripes after switching back.
            for (let i = 0; i < this.Rulers.length; i++) {
                this._calculateZebraStripes(i);
            }
        }
    }

    /**
     * Cleans up circular canvas pointer event listeners and references.
     * @private
     */
    _cleanupCircularCanvas() {
        if (this._circularCanvas) {
            if (typeof this._circularCanvas.removeEventListener === "function") {
                if (this._circularPointerDownHandler) {
                    this._circularCanvas.removeEventListener(
                        "pointerdown",
                        this._circularPointerDownHandler
                    );
                }
                if (this._circularPointerMoveHandler) {
                    this._circularCanvas.removeEventListener(
                        "pointermove",
                        this._circularPointerMoveHandler
                    );
                }
                if (this._circularPointerUpHandler) {
                    this._circularCanvas.removeEventListener(
                        "pointerup",
                        this._circularPointerUpHandler
                    );
                }
                if (this._circularDragEndHandler) {
                    this._circularCanvas.removeEventListener(
                        "pointercancel",
                        this._circularDragEndHandler
                    );
                    this._circularCanvas.removeEventListener(
                        "pointerleave",
                        this._circularDragEndHandler
                    );
                }
            }
            this._circularCanvas = null;
        }
        this._circularPointerDownHandler = null;
        this._circularPointerMoveHandler = null;
        this._circularPointerUpHandler = null;
        this._circularDragEndHandler = null;
    }

    /**
     * Computes the concentric-ring layout shared by _drawCircularView() and
     * _hitTestCircular(), so the two stay in sync by construction.
     * @private
     * @param {number} size - The (square) canvas size in pixels.
     * @param {number} rulerCount - Number of rulers (rings) to lay out.
     * @returns {{innerHoleRadius: number, outerLimit: number, ringGap: number, ringThickness: number}}
     */
    _getRingGeometry(size, rulerCount) {
        // Leave a hole in the center and space for labels.
        const innerHoleRadius = size * 0.1;
        const outerLimit = size * 0.47;
        const ringGap = 2;
        const totalRingSpace = outerLimit - innerHoleRadius;
        const ringThickness =
            rulerCount > 0
                ? (totalRingSpace - ringGap * (rulerCount - 1)) / rulerCount
                : totalRingSpace;

        return { innerHoleRadius, outerLimit, ringGap, ringThickness };
    }

    /**
     * Draws the circular (donut/pie) view on the canvas.
     * Each ruler is a concentric ring. Each note value is an arc slice
     * whose angle is proportional to its duration.
     * @private
     */
    _drawCircularView() {
        const canvas = this._circularCanvas;
        if (!canvas) return;

        const body = this.widgetWindow.getWidgetBody();
        const bodyW = body.clientWidth || 400;
        const bodyH = body.clientHeight || 400;
        // Keep the canvas a perfect square so slices stay circular.
        // Use the smaller dimension (minus padding) so the circle always fits.
        const size = Math.max(Math.min(bodyW, bodyH) - 20, 200);
        canvas.width = size;
        canvas.height = size;
        // Lock the CSS display size to match so the browser does not scale
        // it into an oval when the container is wider than tall.
        canvas.style.width = size + "px";
        canvas.style.height = size + "px";

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, size, size);

        const centerX = size / 2;
        const centerY = size / 2;
        const rulerCount = this.Rulers.length;

        const { innerHoleRadius, outerLimit, ringGap, ringThickness } = this._getRingGeometry(
            size,
            rulerCount
        );

        const colors = [platformColor.selectorBackground, platformColor.selectorSelected];

        for (let i = 0; i < rulerCount; i++) {
            const noteValues = this.Rulers[i][0];
            // Outermost ruler is index 0 (matching Walter's concentric sketch).
            const ringIndex = i;
            const ringInner = innerHoleRadius + ringIndex * (ringThickness + ringGap);
            const ringOuter = ringInner + ringThickness;

            // Sum of durations (1/noteValue) for angle calculation.
            let totalDuration = 0;
            for (let j = 0; j < noteValues.length; j++) {
                totalDuration += 1 / Math.abs(noteValues[j]);
            }

            let startAngle = -Math.PI / 2; // 12 o'clock

            for (let j = 0; j < noteValues.length; j++) {
                const nv = noteValues[j];
                const duration = 1 / Math.abs(nv);
                const sweepAngle = (duration / totalDuration) * 2 * Math.PI;
                const endAngle = startAngle + sweepAngle;

                // Determine fill color.
                const isHighlighted = this._circularHighlight[i] === j && this._playing;
                const isInDragRange =
                    this._circularDownHit !== null &&
                    this._circularDragTo !== null &&
                    this._circularDownHit.rulerIndex === i &&
                    this._circularDragTo.rulerIndex === i &&
                    j >=
                        Math.min(this._circularDownHit.cellIndex, this._circularDragTo.cellIndex) &&
                    j <= Math.max(this._circularDownHit.cellIndex, this._circularDragTo.cellIndex);
                let fillColor;
                if (isHighlighted) {
                    fillColor = platformColor.rulerHighlight;
                } else if (isInDragRange) {
                    // Slices currently being dragged across: show as pending merge.
                    fillColor = platformColor.rulerHighlight || "#FFEB3B";
                } else if (nv < 0) {
                    // Rest: muted color
                    fillColor = platformColor.selectorBackgroundHOFF || "#888888";
                } else {
                    fillColor = i % 2 === 0 ? colors[j % 2] : colors[(j + 1) % 2];
                }

                // Draw the arc slice.
                ctx.beginPath();
                ctx.arc(centerX, centerY, ringOuter, startAngle, endAngle);
                ctx.arc(centerX, centerY, ringInner, endAngle, startAngle, true);
                ctx.closePath();
                ctx.fillStyle = fillColor;
                ctx.fill();
                ctx.strokeStyle = platformColor.strokeColor || "#666666";
                ctx.lineWidth = 1;
                ctx.stroke();

                // Draw note label if slice is large enough.
                const midAngle = startAngle + sweepAngle / 2;
                const labelRadius = (ringInner + ringOuter) / 2;
                const labelX = centerX + labelRadius * Math.cos(midAngle);
                const labelY = centerY + labelRadius * Math.sin(midAngle);

                if (sweepAngle > 0.25 && ringThickness > 20) {
                    const obj = rationalToFraction(Math.abs(1 / nv));
                    const text = obj[0] + "/" + obj[1];
                    ctx.fillStyle =
                        isHighlighted || isInDragRange
                            ? platformColor.background || "#000000"
                            : platformColor.textColor || "#FFFFFF";
                    ctx.font = Math.min(Math.floor(ringThickness * 0.35), 14) + "px sans-serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(text, labelX, labelY);
                }

                startAngle = endAngle;
            }
        }

        // Draw center hole (clear it).
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerHoleRadius - 1, 0, 2 * Math.PI);
        ctx.fillStyle =
            getComputedStyle(canvas.parentNode).backgroundColor ||
            platformColor.background ||
            "#303030";
        ctx.fill();

        // Draw a "start here, plays clockwise" indicator at 12 o'clock.
        // A small triangle pointing clockwise (to the right) sits just above
        // the outer edge of the rings.
        const indicatorY = centerY - outerLimit - 6;
        const arrowSize = Math.max(6, size * 0.02);
        ctx.beginPath();
        ctx.moveTo(centerX - arrowSize, indicatorY - arrowSize);
        ctx.lineTo(centerX + arrowSize, indicatorY);
        ctx.lineTo(centerX - arrowSize, indicatorY + arrowSize);
        ctx.closePath();
        ctx.fillStyle = platformColor.rulerHighlight || "#FFEB3B";
        ctx.fill();
        ctx.strokeStyle = platformColor.textColor || "#000000";
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    /**
     * Hit-tests a mouse event on the circular canvas and returns the
     * ruler and cell index under the pointer, or null if outside any ring.
     * @private
     * @param {MouseEvent} event
     * @returns {{rulerIndex: number, cellIndex: number}|null}
     */
    _hitTestCircular(event) {
        const canvas = this._circularCanvas;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        let angle = Math.atan2(dy, dx);
        // Normalize so 12 o'clock (top) is 0 and increases clockwise.
        angle = angle + Math.PI / 2;
        if (angle < 0) angle += 2 * Math.PI;

        const size = canvas.width;
        const rulerCount = this.Rulers.length;
        const { innerHoleRadius, ringGap, ringThickness } = this._getRingGeometry(size, rulerCount);

        // Find which ring (ruler) the pointer is in.
        let hitRuler = -1;
        for (let i = 0; i < rulerCount; i++) {
            const ringInner = innerHoleRadius + i * (ringThickness + ringGap);
            const ringOuter = ringInner + ringThickness;
            if (dist >= ringInner && dist <= ringOuter) {
                hitRuler = i;
                break;
            }
        }
        if (hitRuler < 0) return null;

        // Find which slice based on angle.
        const noteValues = this.Rulers[hitRuler][0];
        let totalDuration = 0;
        for (let j = 0; j < noteValues.length; j++) {
            totalDuration += 1 / Math.abs(noteValues[j]);
        }

        let cumAngle = 0;
        let hitCell = -1;
        for (let j = 0; j < noteValues.length; j++) {
            const duration = 1 / Math.abs(noteValues[j]);
            const sweepAngle = (duration / totalDuration) * 2 * Math.PI;
            if (angle >= cumAngle && angle < cumAngle + sweepAngle) {
                hitCell = j;
                break;
            }
            cumAngle += sweepAngle;
        }
        if (hitCell < 0) return null;

        return { rulerIndex: hitRuler, cellIndex: hitCell };
    }

    /**
     * Records the slice where a mousedown began so it can later be paired
     * with a mouseup to decide between a single-slice dissect and a
     * multi-slice tie.
     * @private
     * @param {MouseEvent} event
     */
    _onCircularMouseDown(event) {
        if (this._playing) return;
        const hit = this._hitTestCircular(event);
        if (!hit) {
            this._circularDownHit = null;
            this._circularDragTo = null;
            return;
        }
        this._circularDownHit = hit;
        this._circularDragTo = hit;
    }

    /**
     * Tracks the slice under the pointer while the mouse button is held
     * down so the soon-to-be-merged range can be highlighted.
     * @private
     * @param {MouseEvent} event
     */
    _onCircularMouseMove(event) {
        if (this._playing) return;
        if (this._circularDownHit === null) return;

        const hit = this._hitTestCircular(event);
        const prev = this._circularDragTo;

        // Only redraw when the slice under the pointer actually changes,
        // to avoid flooding redraws on every pixel of movement.
        const changed =
            (prev === null && hit !== null) ||
            (prev !== null && hit === null) ||
            (prev !== null &&
                hit !== null &&
                (prev.rulerIndex !== hit.rulerIndex || prev.cellIndex !== hit.cellIndex));

        if (changed) {
            this._circularDragTo = hit;
            this._drawCircularView();
        }
    }

    /**
     * Handles the end of a pointer gesture on the circular canvas.
     * If the pointer came up on the same slice it went down on, the slice
     * is dissected (split). If it came up on a different slice within the
     * same ruler, the slices between them are tied together.
     * @private
     * @param {MouseEvent} event
     */
    _onCircularMouseUp(event) {
        if (this._playing) return;
        const down = this._circularDownHit;
        this._circularDownHit = null;
        this._circularDragTo = null;
        if (!down) return;

        const up = this._hitTestCircular(event);
        if (!up) return;

        if (this._tapMode) {
            const cell = this._rulers[down.rulerIndex].cells[down.cellIndex];
            this._dissectRuler({ currentTarget: cell }, down.rulerIndex);
            return;
        }

        // A tie requires both endpoints to be on the same ruler and on
        // different slices; anything else falls through to dissect.
        if (down.rulerIndex === up.rulerIndex && down.cellIndex !== up.cellIndex) {
            this._tieCircular(down.rulerIndex, down.cellIndex, up.cellIndex);
            return;
        }

        // Single-slice click: dissect.
        this._rulerSelected = down.rulerIndex;
        const ruler = this._rulers[down.rulerIndex];
        if (ruler && ruler.cells[down.cellIndex]) {
            let inputNum = this._dissectNumber.value;
            if (inputNum === "" || isNaN(inputNum)) {
                inputNum = 2;
            } else {
                inputNum = Math.abs(Math.floor(inputNum));
            }
            this.__dissectByNumber(ruler.cells[down.cellIndex], inputNum, true);
            this.saveDissectHistory();
            this._drawCircularView();
        }
    }

    /**
     * Ties a contiguous range of slices on a single ruler into one note,
     * reusing the linear view's __tie() implementation by pointing its
     * _mouseDownCell/_mouseUpCell at the underlying DOM cells.
     * @private
     * @param {number} rulerIndex
     * @param {number} fromCell
     * @param {number} toCell
     */
    _tieCircular(rulerIndex, fromCell, toCell) {
        const ruler = this._rulers[rulerIndex];
        if (!ruler || !ruler.cells) return;

        const downIndex = Math.min(fromCell, toCell);
        const upIndex = Math.max(fromCell, toCell);
        const downCell = ruler.cells[downIndex];
        const upCell = ruler.cells[upIndex];
        if (!downCell || !upCell) return;

        this._rulerSelected = rulerIndex;
        this._mouseDownCell = downCell;
        this._mouseUpCell = upCell;
        this.__tie(true);
        this._mouseDownCell = null;
        this._mouseUpCell = null;

        this.saveDissectHistory();
        this._drawCircularView();
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = RhythmRulerCircular;
}
