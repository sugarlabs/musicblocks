// Copyright (c) 2014-2017 Walter Bender
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
require(['activity/utils']);

var TRASHWIDTH = 120;
var TRASHHEIGHT = 120;

function Trashcan (canvas, stage, size, refreshCanvas) {
    this.canvas = canvas;
    this.stage = stage;
    this.refreshCanvas = refreshCanvas;
    this.size = size;
    this.scale = 1;
    this.isVisible = false;

    this.iconsize = 55;  // default value
    this.container = new createjs.Container();

    this._borderHighlightBitmap = null;
    this._isHighlightInitialized = false;
    this._inAnimation = false;
    this._animationInterval = null;
    this._highlightPower = 255;
    this._animationLevel = 0;
    this.animationTime = 500;

    this._makeBorderHighlight = function(isActive = false) {
        var img = new Image();
        var trash = this;

        img.onload = function () {
            trash._borderHighlightBitmap = new createjs.Bitmap(img);
            trash._borderHighlightBitmap.scaleX = size / trash.iconsize;
            trash._borderHighlightBitmap.scaleY = size / trash.iconsize;
            if (!trash._isHighlightInitialized) {
                trash.container.visible = false;
                trash._isHighlightInitialized = true;
            } else {
               trash.container.removeChildAt(trash.container.children.length - 1);
            }

            trash.container.addChild(trash._borderHighlightBitmap);
            trash._borderHighlightBitmap.visible = true;
        };

        var highlightString = 'rgb(' + this._highlightPower + ',' + this._highlightPower + ',' + this._highlightPower + ')';
        if (isActive) {
	    // When trash is activated, warn the user with red highlight.
            highlightString = 'rgb(255, 0, 0)';
        }

        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(BORDER.replace('stroke_color', highlightString))));
    };

    this._makeBorder = function() {
        var img = new Image();
        var trash = this;

        img.onload = function () {
            border = new createjs.Bitmap(img);
            bitmap.scaleX = trash.size / trash.iconsize;
            bitmap.scaleY = trash.size / trash.iconsize;
            trash.container.addChild(border);
            trash._makeBorderHighlight();
        };

        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(BORDER.replace('stroke_color', '#e0e0e0'))));
    };

    this._makeTrash = function() {
        var img = new Image();
        var trash = this;

        img.onload = function () {
            bitmap = new createjs.Bitmap(img);
            trash.container.addChild(bitmap);
            trash.iconsize = bitmap.getBounds().width;
            bitmap.scaleX = trash.size / trash.iconsize;
            bitmap.scaleY = trash.size / trash.iconsize;
            bitmap.x = ((TRASHWIDTH - size) / 2) * bitmap.scaleX;
            bitmap.y = ((TRASHHEIGHT - size) / 2) * bitmap.scaleY;
            trash._makeBorder();
        };

        img.src = 'images/trash.svg';
    };

    this.resizeEvent = function(scale) {
        this.scale = scale;
        console.log(scale + ' ' + this.size + ' ' + this.canvas.width.toFixed(2) + ' ' + this.iconsize);
	console.log('BEFORE: ' + this.container.x);
        var xxx = ((this.canvas.width / scale) - TRASHWIDTH) / 2;
	this.container.x = ((this.canvas.width / scale) - TRASHWIDTH) / 2;
	console.log('AFTER: ' + this.container.x + ' ' + xxx);
        this.container.y = (this.canvas.height / scale) - TRASHHEIGHT;
    };

    this.stage.addChild(this.container);
    this.stage.setChildIndex(this.container, 0);
    this.resizeEvent(1);
    this._makeTrash();

    this.hide = function() {
        createjs.Tween.get(this.container).to({alpha: 0}, 200).set({visible: false});
    };

    this.show = function() {
        this.stopHighlightAnimation();
        createjs.Tween.get(this.container).to({alpha: 0.0, visible: true}).to({alpha: 1.0}, 200);
    };

    this.startHighlightAnimation = function() {
        if (this._inAnimation) {
            return;
        }

        this._inAnimation = true;
        var that = this;

        this._animationInterval = setInterval(function() {
            that._animationLevel += 20;
            if (that._animationLevel >= that.animationTime) {
                that.isVisible = true;
                that._makeBorderHighlight(true); // Make it active.
                that.refreshCanvas();
                clearInterval(that._animationInterval); // Autostop animation.
                return;
            }

            that._highlightPower = parseInt(255 - (255 * (that._animationLevel / that.animationTime)), 10);
            that._makeBorderHighlight();
            that.refreshCanvas();
        }, 20);

        this._switchHighlightVisibility(true);
    };

    this.stopHighlightAnimation = function() {
        if (!this._inAnimation) {
            return;
        }

        clearInterval(this._animationInterval);
        this._inAnimation = false;
        this.isVisible = false;
        this._animationLevel = 0;
        this._highlightPower = 255;
        this._makeBorderHighlight();
        this._switchHighlightVisibility(false);
    };

    this._switchHighlightVisibility = function(bool) {
        last(this.container.children).visible = bool;
        this.container.children[1].visible = !bool;
        this.container.visible = true;
        this.refreshCanvas();
    };

    this.overTrashcan = function(x, y) {
        var tx = this.container.x;
        var ty = this.container.y;

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
