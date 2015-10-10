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

var CONFIRMBOX = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="180" height="180"> <rect width="180" height="180" x="0" y="-3.5762787e-06" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <g transform="translate(124.943,-0.053)" style="fill:#000000;display:block"> <path d="m 27.557,5.053 c -12.43,0 -22.5,10.076 -22.5,22.497 0,12.432 10.07,22.503 22.5,22.503 12.431,0 22.5,-10.071 22.5,-22.503 0,-12.421 -10.07,-22.497 -22.5,-22.497 z m 10.199,28.159 c 1.254,1.256 1.257,3.291 0,4.545 -0.628,0.629 -1.451,0.943 -2.274,0.943 -0.822,0 -1.644,-0.314 -2.27,-0.94 l -5.76,-5.761 -5.76,5.761 c -0.627,0.626 -1.449,0.94 -2.271,0.94 -0.823,0 -1.647,-0.314 -2.275,-0.943 -1.254,-1.254 -1.254,-3.289 0.004,-4.545 l 5.758,-5.758 -5.758,-5.758 c -1.258,-1.254 -1.258,-3.292 -0.004,-4.546 1.255,-1.254 3.292,-1.259 4.546,0 l 5.76,5.759 5.76,-5.759 c 1.252,-1.259 3.288,-1.254 4.544,0 1.257,1.254 1.254,3.292 0,4.546 l -5.758,5.758 5.758,5.758 z" style="fill:#000000;display:inline" /> </g> <rect width="174" height="120" x="3" y="57" style="fill:#96d3f3;fill-opacity:1;stroke:none" /> <rect width="30.772253" height="29.05797" x="74.828156" y="79.274384" style="fill:none;stroke:#000000;stroke-width:3.89899993;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> <rect width="38.669331" height="1.6693259" x="70.665337" y="77.540131" style="fill:none;stroke:#000000;stroke-width:1.75924551;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> <rect width="24.428572" height="0.14285715" x="78.214279" y="71.517647" style="fill:none;stroke:#000000;stroke-width:3.59899998;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> <rect width="0.14285715" height="5.1428571" x="78.214279" y="71.80336" style="fill:none;stroke:#000000;stroke-width:3.59899998;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> <rect width="0.14285715" height="5.1428571" x="102.42857" y="71.660507" style="fill:none;stroke:#000000;stroke-width:3.59899998;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> <g transform="translate(62.5,68.5)" style="fill:#000000;stroke:none;display:block"> <path d="m 13,12.033 0,26.934 29,0 0,-26.934 z M 37.575,35.1 c 0.684,0.683 0.684,1.793 0,2.476 -0.341,0.342 -0.789,0.513 -1.237,0.513 -0.448,0 -0.896,-0.171 -1.238,-0.513 l -7.601,-7.602 -7.602,7.602 c -0.342,0.342 -0.79,0.513 -1.237,0.513 -0.447,0 -0.895,-0.171 -1.237,-0.513 -0.684,-0.683 -0.684,-1.793 0,-2.476 l 7.601,-7.601 -7.601,-7.602 c -0.684,-0.684 -0.684,-1.791 0,-2.474 0.683,-0.684 1.791,-0.684 2.474,0 l 7.602,7.601 7.601,-7.601 c 0.683,-0.684 1.793,-0.684 2.476,0 0.684,0.683 0.684,1.791 0,2.474 l -7.602,7.602 z" style="fill:#000000;stroke:none" /> </g> <text style="font-size:16px;font-style:normal;font-weight:normal;text-align:end;line-height:125%;letter-spacing:0px;word-spacing:0px;text-anchor:end;fill:#000000;fill-opacity:1;stroke:none;font-family:Sans"><tspan x="90.272461" y="147.20338" style="font-size:18px;text-align:center;text-anchor:middle">confirm</tspan></text> </svg>'

// A pop up for deleting projects
function ClearBox(canvas, stage, refreshCanvas, clear) {
    this.canvas = canvas;
    this.stage = stage;
    this.refreshCanvas = refreshCanvas;
    this.doClear = clear;
    this.container = null;
    this.save = null;
    this.close = null;
    this.scale = 1;

    this.hide = function() {
        if (this.container != null) {
            this.container.visible = false;
            this.refreshCanvas();
        }
    }

    this.show = function(scale) {
        this.scale = scale;
        if (this.container == null) {
            this.container = new createjs.Container();
            this.stage.addChild(this.container);
            this.container.x = Math.floor(((this.canvas.width / scale) - 180) / 2);
            this.container.y = 27;

            function processBackground(box, name, bitmap, extras) {
                box.container.addChild(bitmap);
		loadClearContainerHandler(box);
		box.completeShow();
            }
            makeBoxBitmap(this, CONFIRMBOX.replace(/confirm/g, _('confirm')), 'box', processBackground, null);
        } else {
            this.completeShow();
        }
    }

    this.completeShow = function() {
	this.container.visible = true;
	this.refreshCanvas();
    }
}


function loadClearContainerHandler(box) {
    var hitArea = new createjs.Shape();
    this.bounds = box.container.getBounds();
    hitArea.graphics.beginFill('#FFF').drawRect(bounds.x, bounds.y, bounds. width, bounds.height);
    hitArea.x = 0;
    hitArea.y = 0;
    box.container.hitArea = hitArea;

    var locked = false;
    box.container.on('click', function(event) {
        // We need a lock to "debouce" the click.
        if (locked) {
            console.log('debouncing click');
            return;
        }
        locked = true;
        setTimeout(function() {
            locked = false;
        }, 500);

        var x = (event.stageX / box.scale) - box.container.x;
        var y = (event.stageY / box.scale) - box.container.y;
        if (x > 125 && y < 55) {
            console.log('closing box');
            box.hide();
        } else if (y > 55) {
	    // Clear
	    box.doClear(true);
	    box.hide();
        }
    });
}


function makeBoxBitmap(box, data, name, callback, extras) {
    // Async creation of bitmap from SVG data
    // Works with Chrome, Safari, Firefox (untested on IE)
    var img = new Image();
    img.onload = function() {
        bitmap = new createjs.Bitmap(img);
        callback(box, name, bitmap, extras);
    }
    img.src = 'data:image/svg+xml;base64,' + window.btoa(
        unescape(encodeURIComponent(data)));
}
