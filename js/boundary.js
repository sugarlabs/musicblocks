// Copyright (c) 2016-2020 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// The trashcan is an area at the bottom of the screen where stacks of
// blocks can be dragged. Once in the trash area, they are marked as
// trash and hidden. There is a menu button that can be used to
// restore trash.

/*
   global createjs, BOUNDARY
*/

/* exported Boundary */
class Boundary {
    /**
     * @constructor
     * @param {Object} stage
     */
    constructor(stage) {
        this._container = new createjs.Container();
        this._highlightContainer = new createjs.Container();
        this._stage = stage;
        this._stage.addChild(this._container);
        this._stage.addChild(this._highlightContainer);
        this._stage.setChildIndex(this._container, 0);
        this._highlightContainer.visible = false;
    }

    // resizeEvent(scale) {};

    /**
     * @public
     * @param {number} w
     * @param {number} h
     * @param {number} scale
     * @returns {void}
     */
    setScale(w, h, scale) {
        this.destroy();
        this.create(w, h, scale);
    }

    /**
     * @public
     * @returns {void}
     */
    destroy() {
        if (this._container.children.length > 0) {
            this._container.removeChild(this._container.children[0]);
        }
        this.clearBlockHighlights();
    }

    /**
     * Shows outlines around the supplied block-stack rectangles.
     * @param {Array<Object>} rectangles
     * @returns {void}
     */
    showBlockHighlights(rectangles) {
        this.clearBlockHighlights();

        for (const rectangle of rectangles) {
            const shape = new createjs.Shape();
            shape.graphics
                .setStrokeStyle(3)
                .beginStroke("#e08080")
                .drawRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
            this._highlightContainer.addChild(shape);
        }

        this._highlightContainer.visible = rectangles.length > 0;
    }

    /**
     * Clears all block-stack outlines.
     * @returns {void}
     */
    clearBlockHighlights() {
        if (typeof this._highlightContainer.removeAllChildren === "function") {
            this._highlightContainer.removeAllChildren();
        } else {
            while (this._highlightContainer.children.length > 0) {
                this._highlightContainer.removeChild(this._highlightContainer.children[0]);
            }
        }
        this._highlightContainer.visible = false;
    }

    /**
     * @public
     * @param {number} x
     * @param {number} y
     * @returns {number}
     */
    offScreen(x, y) {
        return x < this.x || x > this.x + this.dx || y < this.y || y > this.y + this.dy;
    }

    /**
     * @public
     * @param {number} w
     * @param {number} h
     * @param {number} scale
     * @returns {void}
     */
    create(w, h, scale) {
        this.w = w / scale;
        this.x = 55 + 13;
        this.dx = this.w - (110 + 26);

        this.h = h / scale;
        this.y = 55 + 13;
        this.dy = this.h - (55 + 26);

        const __makeBoundary = () => {
            const img = new Image();
            img.onload = () => {
                const bitmap = new createjs.Bitmap(img);
                this._container.addChild(bitmap);
            };
            img.src =
                "data:image/svg+xml;base64," +
                window.btoa(
                    base64Encode(
                        BOUNDARY.replace("HEIGHT", this.h)
                            .replace("WIDTH", this.w)
                            .replace("Y", this.y)
                            .replace("X", this.x)
                            .replace("DY", this.dy)
                            .replace("DX", this.dx)
                            .replace("stroke_color", "#e08080")
                    )
                );
        };

        __makeBoundary();
    }

    /**
     * @public
     * @returns {void}
     */
    hide() {
        this._container.visible = false;
    }

    /**
     * @public
     * @returns {void}
     */
    show() {
        this._container.visible = true;
    }
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = Boundary;
}
