// Copyright (c) 2014-2021 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// The trashcan is an area at the bottom-right of the screen where stacks of
// blocks can be dragged. Once in the trash area, they are marked as
// trash and hidden. There is a menu button that can be used to
// restore trash.

/* global createjs, platformColor, BORDER, TRASHICON, last */

/* exported Trashcan */

/**
 * Represents a trashcan for disposing and restoring blocks.
 * @class
 */
class Trashcan {
    /**
     * The width of the trashcan.
     * @static
     * @type {number}
     */
    static TRASHWIDTH = 120;

    /**
     * The height of the trashcan.
     * @static
     * @type {number}
     */
    static TRASHHEIGHT = 120;

    /**
     * Creates a new Trashcan instance.
     * @constructor
     * @param {Object} activity - The main activity object.
     */
    constructor(activity) {
        this.activity = activity;
        this.isVisible = false;
        this._scale = 1;
        this._iconsize = 55; // default value
        this._container = new createjs.Container();
        this._borderHighlightBitmap = null;
        this._isHighlightInitialized = false;
        this._inAnimation = false;
        this._animationInterval = null;
        this._highlightPower = 255;
        this._animationLevel = 0;
        this.animationTime = 500;

        this.activity.trashContainer.addChild(this._container);
        this.activity.trashContainer.setChildIndex(this._container, 0);
        this.resizeEvent(1);
        this._makeTrash();
    }

    /**
     * Creates or updates the border highlight for the trashcan.
     * @private
     * @param {boolean} isActive - Whether the highlight should be active.
     */
    _makeBorderHighlight(isActive) {
        const img = new Image();

        img.onload = () => {
            this._borderHighlightBitmap = new createjs.Bitmap(img);
            this._borderHighlightBitmap.scaleX = this._scale;
            this._borderHighlightBitmap.scaleY = this._scale;
            this._borderHighlightBitmap.scale = this._scale;

            this._container.removeChild(this._borderHighlightBitmap);
            this._container.addChild(this._borderHighlightBitmap);
            this._isHighlightInitialized = true;
            this._borderHighlightBitmap.visible = false;
        };

        let highlightString = BORDER.replace("stroke_color", platformColor.trashBorderColor).replace(
            "fill_color",
            platformColor.trashBottomBackground
        );

        if (isActive) {
            highlightString = highlightString.replace(
                platformColor.trashBorderColor,
                platformColor.trashBorderHighlightColor
            );
        }

        img.src =
            "data:image/svg+xml;base64," +
            window.btoa(
                base64Encode(BORDER.replace("stroke_color", highlightString))
            );
    }

    /**
     * Creates the border for the trashcan.
     * @private
     */
    _makeBorder() {
        const img = new Image();

        img.onload = () => {
            const border = new createjs.Bitmap(img);
            border.scaleX = this.activity.cellSize / this._iconsize;
            border.scaleY = this.activity.cellSize / this._iconsize;
            this._container.addChild(border);
            this._makeBorderHighlight(false);
        };

        img.src =
            "data:image/svg+xml;base64," +
            window.btoa(
                base64Encode(BORDER.replace("stroke_color", platformColor.trashBorder))
                );
    }

    /**
     * Creates the trash icon.
     * @private
     */
    _makeTrash() {
        const img = new Image();

        img.onload = () => {
            const bitmap = new createjs.Bitmap(img);
            this._container.addChild(bitmap);
            this._makeBorderHighlight(false);
        };

        img.src =
            "data:image/svg+xml;base64," +
            window.btoa(
                base64Encode(TRASHICON.replace(/fill_color/g, platformColor.trashBorder))
                );
    }

    /**
     * Updates the position of the trashcan container.
     * @public
     */
    updateContainerPosition() {
        this._container.x =
            window.innerWidth / this._scale - Trashcan.TRASHWIDTH - 2 * this._iconsize;
        this._container.y =
            window.innerHeight / this._scale - Trashcan.TRASHHEIGHT - (5 / 4) * this._iconsize;
    }

    /**
     * Checks if the trashcan should be resized.
     * @param {number} newWidth - The new width.
     * @param {number} newHeight - The new height.
     * @returns {boolean} True if resize is needed, false otherwise.
     */
    shouldResize(newWidth, newHeight) {
        return this._container.x !== newWidth || this._container.y !== newHeight;
    }

    /**
     * Handles the resize event for the trashcan.
     * @param {number} scale - The scale factor.
     */
    resizeEvent(scale) {
        this._scale = scale;
        this.updateContainerPosition();

        const self = this; // Capture the current instance of 'this'
        let resizeTimeout;

        function delayedResize() {
            const newWidth = (window.innerWidth / self._scale - Trashcan.TRASHWIDTH) / 2;
            const newHeight = window.innerHeight / self._scale - Trashcan.TRASHHEIGHT;

            if (self.shouldResize(newWidth, newHeight)) {
                self.updateContainerPosition();
            }
        }

        window.addEventListener("resize", function () {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(delayedResize, 300); // Delayed execution using debouncing
        });
    }

    /**
     * Hides the trashcan.
     * @public
     */
    hide() {
        createjs.Tween.get(this._container).to({ alpha: 0 }, 200).set({ visible: false });
    }

    /**
     * Shows the trashcan.
     * @public
     */
    show() {
        this.stopHighlightAnimation();
        createjs.Tween.get(this._container)
            .to({ alpha: 0.0, visible: true })
            .to({ alpha: 1.0 }, 200);
    }

    /**
     * Starts the highlight animation for the trashcan.
     * @public
     */
    startHighlightAnimation() {
        if (this._inAnimation) {
            return;
        }

        this._inAnimation = true;
        this._animationLevel = 0;
        const that = this;

        this._animationInterval = setInterval(() => {
            that._animationLevel += 20;
            if (that._animationLevel >= that.animationTime) {
                clearInterval(that._animationInterval);
                that._inAnimation = false;
                that._highlightPower = 255;
                that._makeBorderHighlight(true);
            } else {
                that._highlightPower = parseInt(
                    255 - (255 * that._animationLevel) / that.animationTime,
                    10
                );
                that._makeBorderHighlight(true);
            }
        }, 20);

        this._switchHighlightVisibility(true);
    }

    /**
     * Stops the highlight animation for the trashcan.
     * @public
     */
    stopHighlightAnimation() {
        if (!this._inAnimation) {
            return;
        }

        clearInterval(this._animationInterval);
        this._inAnimation = false;
        this.isVisible = false;
        this._animationLevel = 0;
        this._highlightPower = 255;
        this._makeBorderHighlight(false);
        this._switchHighlightVisibility(false);
    }

    /**
     * Switches the visibility of the highlight.
     * @private
     * @param {boolean} bool - Whether to show or hide the highlight.
     */
    _switchHighlightVisibility(bool) {
        last(this._container.children).visible = bool;
        this._container.children[1].visible = !bool;
        this._container.visible = true;
        this.activity.refreshCanvas();
    }

    /**
     * Checks if a point is over the trashcan.
     * @param {number} x - The x coordinate.
     * @param {number} y - The y coordinate.
     * @returns {boolean} True if the point is over the trashcan, false otherwise.
     */
    overTrashcan(x, y) {
        const tx = this._container.x;
        const ty = this._container.y;

        if (x < tx) {
            return false;
        } else if (x > tx + Trashcan.TRASHWIDTH) {
            return false;
        }

        if (y < ty) {
            return false;
        }

        return true;
    }
}