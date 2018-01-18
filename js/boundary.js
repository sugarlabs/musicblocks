// Copyright (c) 2016-2018 Walter Bender
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

function Boundary () {
    this._stage = null;
    this._container = null;

    this.setStage = function (stage) {
        this._stage = stage;
        return this;
    };

    this.resizeEvent = function (scale) {
    };

    this.init = function () {
        this._container = new createjs.Container();
        this._stage.addChild(this._container);
        this._stage.setChildIndex(this._container, 0);
    };

    this.setScale = function (w, h, scale) {
        this.destroy();
        this.create(w, h, scale);
    };

    this.destroy = function () {
        if (this._container.children.length > 0) {
            this._container.removeChild(this._container.children[0]);
        }
    };

    this.offScreen = function (x, y) {
        return (x < this.x || x > this.x + this.dx || y < this.y || y > this.y + this.dy);
    };

    this.create = function (w, h, scale) {
        this.w = w / scale;
        this.x = 55 + 13;
        this.dx = this.w - (110 + 26);

        this.h = h / scale;
        this.y = 55 + 13;
        this.dy = this.h - (55 + 26);

        that = this;

        function __makeBoundary() {
            var img = new Image();
            img.onload = function () {
                bitmap = new createjs.Bitmap(img);
                that._container.addChild(bitmap);
            };

            img.src = 'data:image/svg+xml;base64,' + window.btoa(
                unescape(encodeURIComponent(BOUNDARY.replace('HEIGHT', that.h).replace('WIDTH', that.w).replace('Y', that.y).replace('X', that.x).replace('DY', that.dy).replace('DX', that.dx).replace('stroke_color', '#e08080'))));
        };

        __makeBoundary();
    };

    this.hide = function () {
        this._container.visible = false;
    };

    this.show = function () {
        this._container.visible = true;
    };
};
