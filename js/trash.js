// Copyright (c) 2014-2019 Walter Bender
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



class Trashcan {
    static TRASHWIDTH = 120;
    static TRASHHEIGHT = 120;
    constructor(stage, canvas, cellSize, refreshCanvas) {
        this.isVisible = false;
        this._canvas = canvas;
        this._stage = stage;
        this._size = cellSize;
        this._refreshCanvas = refreshCanvas;
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

        this._stage.addChild(this._container);
        this._stage.setChildIndex(this._container, 0);
        this.resizeEvent(1);
        this._makeTrash();
    }

    setCanvas(canvas) {
        this._canvas = canvas;
        return this;
    };

    setStage(stage) {
        this._stage = stage;
        return this;
    };

    setSize(size) {
        this._size = size;
        return this;
    };

    setRefreshCanvas(refreshCanvas) {
        this._refreshCanvas = refreshCanvas;
        return this;
    };

    _makeBorderHighlight(isActive) {
        let img = new Image();

        img.onload = () => {
            this._borderHighlightBitmap = new createjs.Bitmap(img);
            this._borderHighlightBitmap.scaleX = this._size / this._iconsize;
            this._borderHighlightBitmap.scaleY = this._size / this._iconsize;
            if (!this._isHighlightInitialized) {
                this._container.visible = false;
                this._isHighlightInitialized = true;
            } else {
                this._container.removeChildAt(
                    this._container.children.length - 1
                );
            }

            this._container.addChild(this._borderHighlightBitmap);
            this._borderHighlightBitmap.visible = true;
        };

        let highlightString =
            "rgb(" + this._highlightPower + "," + this._highlightPower +
            "," + this._highlightPower + ")";
        if (isActive) {
            // When trash is activated, warn the user with red highlight.
            highlightString = platformColor.trashActive;
        }

        img.src = "data:image/svg+xml;base64," +
            window.btoa(unescape(encodeURIComponent(
                BORDER.replace("stroke_color", highlightString))));
    };

    _makeBorder() {
        let img = new Image();

        img.onload = () => {
            let border = new createjs.Bitmap(img);
            border.scaleX = this._size / this._iconsize;
            border.scaleY = this._size / this._iconsize;
            this._container.addChild(border);
            this._makeBorderHighlight(false);
        };

        img.src = "data:image/svg+xml;base64," +
            window.btoa(unescape(encodeURIComponent(
                BORDER.replace("stroke_color", platformColor.trashBorder))));
    };

    _makeTrash() {
        let img = new Image();

        img.onload = () => {
            let bitmap = new createjs.Bitmap(img);
            this._container.addChild(bitmap);
            this._iconsize = bitmap.getBounds().width;
            bitmap.scaleX = this._size / this._iconsize;
            bitmap.scaleY = this._size / this._iconsize;
            bitmap.x = ((Trashcan.TRASHWIDTH - this._size) / 2) * bitmap.scaleX;
            bitmap.y = ((Trashcan.TRASHHEIGHT - this._size) / 2) * bitmap.scaleY;
            this._makeBorder();
        };

        img.src = "data:image/svg+xml;base64," +
            window.btoa(unescape(encodeURIComponent(
                TRASHICON.replace(/fill_color/g, platformColor.trashBorder))));
    };

    resizeEvent(scale) {
        this._scale = scale;
        this._container.x = (this._canvas.width / this._scale - Trashcan.TRASHWIDTH) / 2;
        this._container.y = this._canvas.height / this._scale - Trashcan.TRASHHEIGHT;
    };

    hide() {
        createjs.Tween.get(this._container)
            .to({ alpha: 0 }, 200)
            .set({ visible: false });
    };

    show() {
        this.stopHighlightAnimation();
        createjs.Tween.get(this._container)
            .to({ alpha: 0.0, visible: true })
            .to({ alpha: 1.0 }, 200);
    };

    startHighlightAnimation() {
        if (this._inAnimation) {
            return;
        }

        this._inAnimation = true;

        this._animationInterval = setInterval(() => {
            this._animationLevel += 20;
            if (this._animationLevel >= this.animationTime) {
                this.isVisible = true;
                this._makeBorderHighlight(true); // Make it active.
                this._refreshCanvas();
                clearInterval(this._animationInterval); // Autostop animation.
                return;
            }

            this._highlightPower = parseInt(
                255 - 255 * (this._animationLevel / this.animationTime), 10);
            this._makeBorderHighlight(false);
            this._refreshCanvas();
        }, 20);

        this._switchHighlightVisibility(true);
    };

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
    };

    _switchHighlightVisibility(bool) {
        last(this._container.children).visible = bool;
        this._container.children[1].visible = !bool;
        this._container.visible = true;
        this._refreshCanvas();
    };

    overTrashcan(x, y) {
        let tx = this._container.x;
        let ty = this._container.y;

        if (x < tx) {
            return false;
        } else if (x > tx + Trashcan.TRASHWIDTH) {
            return false;
        }

        if (y < ty) {
            return false;
        }

        return true;
    };
}