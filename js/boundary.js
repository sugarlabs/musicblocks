// Copyright (c) 2016 Walter Bender
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

var BOUNDARYWIDTH = 1200;
var BOUNDARYHEIGHT = 900;

function Boundary (canvas, stage, refreshCanvas) {
    this.canvas = canvas;
    this.stage = stage;
    this.refreshCanvas = refreshCanvas;

    this.container = new createjs.Container();


    this.resizeEvent = function(scale) {
    }

    this.stage.addChild(this.container);
    this.stage.setChildIndex(this.container, 0);

    this.setScale = function(scale) {
        this.destroy();
        this.create(scale);
    }

    this.destroy = function() {
        if (this.container.children.length > 0) {
            this.container.removeChild(this.container.children[0]);
	}
    }

    this.create = function(scale) {
        var w = this.canvas.width / scale;
        var h = this.canvas.height / scale;
        var x = 55 + 13;
        var y = 55 + 13;
        var dx = w - 110 - 13;
        var dy = h - 55 - 13;

        function makeBoundary(me) {
            var img = new Image();
            img.onload = function () {
                bitmap = new createjs.Bitmap(img);
                me.container.addChild(bitmap);
            };

            img.src = 'data:image/svg+xml;base64,' + window.btoa(
                unescape(encodeURIComponent(BOUNDARY.replace('HEIGHT', h).replace('WIDTH', w).replace('Y', y).replace('X', x).replace('DY', dy).replace('DX', dx).replace('stroke_color', '#e08080'))));
        }

        makeBoundary(this);
    }

    this.hide = function() {
        createjs.Tween.get(this.container)
            .to({alpha: 0}, 200)
            .set({visible: false});
    }

    this.show = function() {
        createjs.Tween.get(this.container)
            .to({alpha: 0.0, visible: true})
            .to({alpha: 1.0}, 200);
    }
}
