// Copyright (c) 2014-18 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA



// A pop up for pasting from the browser clipboard
function PasteBox () {
    var PASTEBOX = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="280" height="55"> <rect width="280" height="55" x="0" y="-3.5762787e-06" style="fill:#f0f0f0;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <g transform="translate(225,0)" style="fill:#000000;display:block"> <path d="m 27.557,5.053 c -12.43,0 -22.5,10.076 -22.5,22.497 0,12.432 10.07,22.503 22.5,22.503 12.431,0 22.5,-10.071 22.5,-22.503 0,-12.421 -10.07,-22.497 -22.5,-22.497 z m 10.199,28.159 c 1.254,1.256 1.257,3.291 0,4.545 -0.628,0.629 -1.451,0.943 -2.274,0.943 -0.822,0 -1.644,-0.314 -2.27,-0.94 l -5.76,-5.761 -5.76,5.761 c -0.627,0.626 -1.449,0.94 -2.271,0.94 -0.823,0 -1.647,-0.314 -2.275,-0.943 -1.254,-1.254 -1.254,-3.289 0.004,-4.545 l 5.758,-5.758 -5.758,-5.758 c -1.258,-1.254 -1.258,-3.292 -0.004,-4.546 1.255,-1.254 3.292,-1.259 4.546,0 l 5.76,5.759 5.76,-5.759 c 1.252,-1.259 3.288,-1.254 4.544,0 1.257,1.254 1.254,3.292 0,4.546 l -5.758,5.758 5.758,5.758 z" style="fill:#000000;display:inline" /> </g></svg>'

    this._canvas = null;
    this._stage = null;
    this._refreshCanvas = null;
    this._paste = null;
    this._container = null;
    this.save = null;
    this.close = null;
    this._scale = 1;

    this.setCanvas = function (canvas) {
        this._canvas = canvas;
        return this;
    };

    this.setStage = function (stage) {
        this._stage = stage;
        return this;
    };

    this.setPaste = function (paste) {
        this._paste = paste;
        return this;
    };

    this.setRefreshCanvas = function (refreshCanvas) {
        this._refreshCanvas = refreshCanvas;
        return this;
    };

    this.hide = function () {
        if (this._container != null) {
            this._container.visible = false;
            this._refreshCanvas();
            // paste.visible = false;
	    docById('paste').style.visibility = 'hidden';
        }
    };

    this.createBox = function (scale, x, y) {
        if (this._container == null) {
            this._scale = scale;

            this._container = new createjs.Container();
            this._stage.addChild(this._container);
            this._container.x = x;
            this._container.y = y;

            function __processBackground(that, name, bitmap, extras) {
                that._container.addChild(bitmap);
                that._loadClearContainerHandler();
                that._container.visible = true;
                that._refreshCanvas();
            }

            this._makeBoxBitmap(PASTEBOX, 'box', __processBackground, null);
        }
    };

    this.show = function () {
        this._container.visible = true;
        this._refreshCanvas();
        // this._paste.visibile = true;
	docById('paste').style.visibility = 'visible';
    };

    this.getPos = function () {
        return [this._container.x, this._container.y];
    };

    this._loadClearContainerHandler = function () {
        var hitArea = new createjs.Shape();
        this.bounds = this._container.getBounds();
        hitArea.graphics.beginFill('#FFF').drawRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
        hitArea.x = 0;
        hitArea.y = 0;
        this._container.hitArea = hitArea;

        var locked = false;
        var that = this;

        this._container.on('click', function(event) {
            // We need a lock to "debouce" the click.
            if (locked) {
                console.log('debouncing click');
                return;
            }

            locked = true;

            setTimeout(function () {
                locked = false;
            }, 500);

            var x = (event.stageX / that._scale) - that._container.x;
            var y = (event.stageY / that._scale) - that._container.y;
            if (x > 125 && y < 55) {
                that.hide();
            }
        });

    };

    this._makeBoxBitmap = function (data, name, callback, extras) {
        // Async creation of bitmap from SVG data
        // Works with Chrome, Safari, Firefox (untested on IE)
        var img = new Image();
        var that = this;

        img.onload = function() {
            var bitmap = new createjs.Bitmap(img);
            callback(that, name, bitmap, extras);
        };

        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(data)));
    };
};
