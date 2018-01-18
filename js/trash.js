// Copyright (c) 2014-2018 Walter Bender
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

var TRASHWIDTH = 120;
var TRASHHEIGHT = 120;

function Trashcan () {
    this.isVisible = false;
    this._canvas = null;
    this._stage = null;
    this._size = null;
    this._refreshCanvas = null;
    this._scale = 1;
    this._iconsize = 55;  // default value
    this._container = new createjs.Container();
    this._borderHighlightBitmap = null;
    this._isHighlightInitialized = false;
    this._inAnimation = false;
    this._animationInterval = null;
    this._highlightPower = 255;
    this._animationLevel = 0;
    this.animationTime = 500;

    this.init = function () {
        this._stage.addChild(this._container);
        this._stage.setChildIndex(this._container, 0);
        this.resizeEvent(1);
        this._makeTrash();
    };

    this.setCanvas = function (canvas) {
        this._canvas = canvas;
        return this;
    };

    this.setStage = function (stage) {
        this._stage = stage;
        return this;
    };

    this.setSize = function (size) {
        this._size = size;
        return this;
    };

    this.setRefreshCanvas = function (refreshCanvas) {
        this._refreshCanvas = refreshCanvas;
        return this;
    };

    this._makeBorderHighlight = function (isActive) {
        var img = new Image();
        var that = this;

        img.onload = function () {
            that._borderHighlightBitmap = new createjs.Bitmap(img);
            that._borderHighlightBitmap.scaleX = that._size / that._iconsize;
            that._borderHighlightBitmap.scaleY = that._size / that._iconsize;
            if (!that._isHighlightInitialized) {
                that._container.visible = false;
                that._isHighlightInitialized = true;
            } else {
               that._container.removeChildAt(that._container.children.length - 1);
            }

            that._container.addChild(that._borderHighlightBitmap);
            that._borderHighlightBitmap.visible = true;
        };

        var highlightString = 'rgb(' + this._highlightPower + ',' + this._highlightPower + ',' + this._highlightPower + ')';
        if (isActive) {
            // When trash is activated, warn the user with red highlight.
            highlightString = 'rgb(255, 0, 0)';
        }

        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(BORDER.replace('stroke_color', highlightString))));
    };

    this._makeBorder = function () {
        var img = new Image();
        var that = this;

        img.onload = function () {
            border = new createjs.Bitmap(img);
            bitmap.scaleX = that._size / that._iconsize;
            bitmap.scaleY = that._size / that._iconsize;
            that._container.addChild(border);
            that._makeBorderHighlight(false);
        };

        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(BORDER.replace('stroke_color', '#e0e0e0'))));
    };

    this._makeTrash = function () {
        var img = new Image();
        var that = this;

        img.onload = function () {
            bitmap = new createjs.Bitmap(img);
            that._container.addChild(bitmap);
            that._iconsize = bitmap.getBounds().width;
            bitmap.scaleX = that._size / that._iconsize;
            bitmap.scaleY = that._size / that._iconsize;
            bitmap.x = ((TRASHWIDTH - that._size) / 2) * bitmap.scaleX;
            bitmap.y = ((TRASHHEIGHT - that._size) / 2) * bitmap.scaleY;
            that._makeBorder();
        };

        img.src = 'images/trash.svg';
    };

    this.resizeEvent = function (scale) {
        this._scale = scale;
        this._container.x = ((this._canvas.width / this._scale) - TRASHWIDTH) / 2;
        this._container.y = (this._canvas.height / this._scale) - TRASHHEIGHT;
    };

    this.hide = function () {
        createjs.Tween.get(this._container).to({alpha: 0}, 200).set({visible: false});
    };

    this.show = function () {
        this.stopHighlightAnimation();
        createjs.Tween.get(this._container).to({alpha: 0.0, visible: true}).to({alpha: 1.0}, 200);
    };

    this.startHighlightAnimation = function () {
        if (this._inAnimation) {
            return;
        }

        this._inAnimation = true;
        var that = this;

        this._animationInterval = setInterval(function () {
            that._animationLevel += 20;
            if (that._animationLevel >= that.animationTime) {
                that.isVisible = true;
                that._makeBorderHighlight(true); // Make it active.
                that._refreshCanvas();
                clearInterval(that._animationInterval); // Autostop animation.
                return;
            }

            that._highlightPower = parseInt(255 - (255 * (that._animationLevel / that.animationTime)), 10);
            that._makeBorderHighlight(false);
            that._refreshCanvas();
        }, 20);

        this._switchHighlightVisibility(true);
    };

    this.stopHighlightAnimation = function () {
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

    this._switchHighlightVisibility = function (bool) {
        last(this._container.children).visible = bool;
        this._container.children[1].visible = !bool;
        this._container.visible = true;
        this._refreshCanvas();
    };

    this.overTrashcan = function (x, y) {
        var tx = this._container.x;
        var ty = this._container.y;

        if (x < tx) {
            return false;
        } else if (x > tx + TRASHWIDTH) {
            return false;
        }

        if (y < ty) {
            return false;
        }

        return true;
    };
};
