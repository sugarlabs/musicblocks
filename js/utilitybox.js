// Copyright (c) 2015-16 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA
//

const UTILITYBOXSVG = '<svg xmlns="http://www.w3.org/2000/svg" height="133" width="360" version="1.1"> <rect style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" y="0" x="0" height="133" width="360" /> <g style="fill:#000000;display:block" transform="translate(306.943,-1.053)"> <path style="fill:#000000;display:inline" d="m 27.557,5.053 c -12.43,0 -22.5,10.076 -22.5,22.497 0,12.432 10.07,22.503 22.5,22.503 12.431,0 22.5,-10.071 22.5,-22.503 0,-12.421 -10.07,-22.497 -22.5,-22.497 z m 10.199,28.159 c 1.254,1.256 1.257,3.291 0,4.545 -0.628,0.629 -1.451,0.943 -2.274,0.943 -0.822,0 -1.644,-0.314 -2.27,-0.94 l -5.76,-5.761 -5.76,5.761 c -0.627,0.626 -1.449,0.94 -2.271,0.94 -0.823,0 -1.647,-0.314 -2.275,-0.943 -1.254,-1.254 -1.254,-3.289 0.004,-4.545 l 5.758,-5.758 -5.758,-5.758 c -1.258,-1.254 -1.258,-3.292 -0.004,-4.546 1.255,-1.254 3.292,-1.259 4.546,0 l 5.76,5.759 5.76,-5.759 c 1.252,-1.259 3.288,-1.254 4.544,0 1.257,1.254 1.254,3.292 0,4.546 l -5.758,5.758 5.758,5.758 z" /> </g> <rect style="fill:#92b5c8;fill-opacity:1;stroke:none" y="51" x="0" height="82" width="360" /> <rect y="0.76763773" x="0.76764059" height="131.46472" width="358.46472" style="display:inline;visibility:visible;opacity:1;fill:none;fill-opacity:1;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;" /></svg>';

// A pop up for utility functions, e.g., loading plugins, changing block size
function UtilityBox () {
    this._stage = null;
    this._refreshCanvas = null;
    this._doBigger = null;
    this._doSmaller = null;
    this._doPlugins = null;
    this._doStats = null;
    this._doScroller = null;
    this._scrollStatus = false;
    this._container = null;
    this._scale = 1;

    this.setStage = function (stage) {
        this._stage = stage;
        return this;
    };

    this.setRefreshCanvas = function (refreshCanvas) {
        this._refreshCanvas = refreshCanvas;
        return this;
    };

    this.setBigger = function (bigger) {
        this._doBigger = bigger;
        return this;
    };

    this.setSmaller = function (smaller) {
        this._doSmaller = smaller;
        return this;
    };

    this.setPlugins = function (plugins) {
        this._doPlugins = plugins;
        return this;
    };

    this.setStats = function (stats) {
        this._doStats = stats;
        return this;
    };

    this.setScroller = function (scroller) {
        this._doScroller = scroller;
        return this;
    };

    this.init = function (scale, x, y, makeButton) {
        if (this._container === null) {
            this._createBox(scale, x, y);
            var that = this;

            this._smallerButton = makeButton('smaller-button', _('Decrease block size'), this._container.x + 55, this._container.y + 85, 55, 0, this._stage);
            this._smallerButton.visible = true;
            this._positionHoverText(this._smallerButton);
            this._smallerButton.on('click', function (event) {
                that._doSmaller();
                that._hide();
            });

            this._biggerButton = makeButton('bigger-button', _('Increase block size'), this._container.x + 120, this._container.y + 85, 55, 0, this._stage);
            this._biggerButton.visible = true;
            this._positionHoverText(this._biggerButton);
            this._biggerButton.on('click', function (event) {
                that._doBigger();
                that._hide();
            });

            this._statsButton = makeButton('stats-button', _('Display statistics'), this._container.x + 185, this._container.y + 85, 55, 0, this._stage);
            this._statsButton.visible = true;
            this._positionHoverText(this._statsButton);
            this._statsButton.on('click', function (event) {
                that._doStats();
                that._hide();
            });

            this.pluginsButton = makeButton('plugins-button', _('Load plugin from file'), this._container.x + 250, this._container.y + 85, 55, 0, this._stage);
            this.pluginsButton.visible = true;
            this._positionHoverText(this.pluginsButton);
            this.pluginsButton.on('click', function (event) {
                that._doPlugins();
                that._hide();
            });

            this._scrollButton = makeButton('scroll-unlock-button', _('Enable scrolling'), this._container.x + 315, this._container.y + 85, 55, 0, this._stage);
            this._scrollButton.visible = true;
            this._positionHoverText(this._scrollButton);
            this._scrollButton.on('click', function (event) {
                that._doScroller();
                that._hide();
                that._scrollStatus = !that._scrollStatus;
            });

            this._scrollButton2 = makeButton('scroll-lock-button', _('Disable scrolling'), this._container.x + 315, this._container.y + 85, 55, 0, this._stage);
            this._scrollButton2.visible = false;
            this._positionHoverText(this._scrollButton2);
            this._scrollButton2.on('click', function (event) {
                that._doScroller();
                that._hide();
                that._scrollStatus = !that._scrollStatus;
            });

        } else {
            this._show();
        }
    };

    this._positionHoverText = function (button) {
        for (var c = 0; c < button.children.length; c++) {
            if (button.children[c].text != undefined) {
                button.children[c].textAlign = 'left';
                button.children[c].x = -27;
                button.children[c].y = 27;
                break;
            }
        }
    };

    this._hide = function () {
        if (this._container !== null) {
            this._smallerButton.visible = false;
            this._biggerButton.visible = false;
            this._statsButton.visible = false;
            this.pluginsButton.visible = false;
            this._scrollButton.visible = false;
            this._scrollButton2.visible = false;
            this._container.visible = false;
            this._refreshCanvas();
        }
    };

    this._show = function () {
        if (this._container !== null) {
            this._smallerButton.visible = true;
            this._biggerButton.visible = true;
            this._statsButton.visible = true;
            this.pluginsButton.visible = true;
            this._scrollButton.visible = !this._scrollStatus;
            this._scrollButton2.visible = this._scrollStatus;
            this._container.visible = true;
            this._refreshCanvas();
        }
    };

    this._createBox = function (scale, x, y) {
        this._scale = scale;
        console.log(scale);

        function __processBackground(that, name, bitmap, extras) {
            that._container.addChild(bitmap);
            that._loadUtilityContainerHandler();

            that.bounds = that._container.getBounds();
            that._container.cache(that.bounds.x, that.bounds.y, that.bounds.width, that.bounds.height);

            var hitArea = new createjs.Shape();
            hitArea.graphics.beginFill('#FFF').drawRect(that.bounds.x, that.bounds.y, that.bounds.width, that.bounds.height);
            hitArea.x = 0;
            hitArea.y = 0;
            that._container.hitArea = hitArea;
        };

        if (this._container == null) {
            this._container = new createjs.Container();
            this._stage.addChild(this._container);
            this._container.x = x - 360;
            this._container.y = y - 133;

            var UTILITYBOX = UTILITYBOXSVG;
            this._makeBoxBitmap(UTILITYBOX, 'box', __processBackground, null);
        }
    };

    this._makeBoxBitmap = function (data, name, callback, extras) {
        // Async creation of bitmap from SVG data
        // Works with Chrome, Safari, Firefox (untested on IE)
        var img = new Image();
        var that = this;

        img.onload = function () {
            bitmap = new createjs.Bitmap(img);
            callback(that, name, bitmap, extras);
        };

        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(data)));
    };

    this._loadUtilityContainerHandler = function () {
        var locked = false;
        var that = this;

        that._container.on('click', function (event) {
            // We need a lock to "debounce" the click.
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

            if (y < 55) {
                that._hide();
            }
        });
    };
};
