// Copyright (c) 2014 Walter Bender
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

var TRASHWIDTH = 320;
var TRASHHEIGHT = 120;

function Trashcan (canvas, stage, size, refreshCanvas) {
    this.canvas = canvas;
    this.stage = stage;
    this.refreshCanvas = refreshCanvas;
    this.size = size;

    this.iconsize = 55;  // default value
    this.container = new createjs.Container();

    this._makeBorderHighlight = function() {
        var img = new Image();
        var trash = this;

        img.onload = function () {
            bitmap = new createjs.Bitmap(img);
            bitmap.scaleX = size / trash.iconsize;
            bitmap.scaleY = size / trash.iconsize;
            trash.container.addChild(bitmap);
            bitmap.visible = false;
            bounds = trash.container.getBounds();
            trash.container.cache(bounds.x, bounds.y, bounds.width, bounds.height);
            // Hide the trash until a block is moved.
            trash.container.visible = false;
        };

        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(BORDER.replace('stroke_color', '#000000'))));
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
        this.container.x = (this.canvas.width * 1 / scale / 2) - ((TRASHWIDTH / 2) * (this.size / this.iconsize));
        this.container.y = (this.canvas.height * 1 / scale) - (TRASHHEIGHT * (this.size / this.iconsize));
    };

    this.stage.addChild(this.container);
    this.stage.setChildIndex(this.container, 0);
    this.resizeEvent(1);
    this._makeTrash();

    this.hide = function() {
        createjs.Tween.get(this.container).to({alpha: 0}, 200).set({visible: false});
    };

    this.show = function() {
        createjs.Tween.get(this.container).to({alpha: 0.0, visible: true}).to({alpha: 1.0}, 200);
    };

    this.highlight = function() {
        if (!last(this.container.children).visible) {
            last(this.container.children).visible = true;
            this.container.children[1].visible = false;
            this.container.visible = true;
            this.container.updateCache();
            this.refreshCanvas();
        }
    };

    this.unhighlight = function() {
        if (last(this.container.children).visible) {
            last(this.container.children).visible = false;
            this.container.children[1].visible = true;
            this.container.visible = true;
            this.container.updateCache();
            this.refreshCanvas();
        }
    };

    this.overTrashcan = function(x, y) {
        var tx = this.container.x;
        var ty = this.container.y;

        if (x < tx) {
            return false;
        } else if (x > tx + (TRASHWIDTH * this.size / this.iconsize)) {
            return false;
        }

        if (y < ty) {
            return false;
        }

        return true;
    };
};
