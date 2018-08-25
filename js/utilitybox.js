// Copyright (c) 2015-2018 Walter Bender
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


// A pop up for utility functions, e.g., loading plugins, changing block size
function UtilityBox () {
    const BOXBUTTONOFFSET = 40;
    const BOXBUTTONSPACING = 65;

    if (_THIS_IS_MUSIC_BLOCKS_) {
        // 8 buttons, 7 intrabuttons spaces, 2 extrabutton spaces
	var boxwidth = 8 * 55 + 7 * 10 + 2 * 20;
        var boxwidth2 = boxwidth - 1.5;
        var boxclose = boxwidth - 55;
    } else {
        // 7 buttons, 6 intrabuttons spaces, 2 extrabutton spaces
        var boxwidth = 7 * 55 + 6 * 10 + 2 * 20;
        var boxwidth2 = boxwidth - 1.5;
        var boxclose = boxwidth - 55;
    }

    const UTILITYBOXSVG = '<svg xmlns="http://www.w3.org/2000/svg" height="133" width="' + boxwidth + '" version="1.1"> <rect style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" y="0" x="0" height="133" width="' + boxwidth + '" /> <g style="fill:#000000;display:block" transform="translate(' + boxclose + ',-1)"> <path style="fill:#000000;display:inline" d="m 27.5,5.0 c -12.43,0 -22.5,10.0 -22.5,22.5 0,12.5 10.0,22.5 22.5,22.5 12.5,0 22.5,-10.0 22.5,-22.5 0,-12.5 -10.0,-22.5 -22.5,-22.5 z m 10.0,28.0 c 1.25,1.25 1.25,3.25 0,4.5 -0.5,0.5 -1.5,1.0 -2.25,1.0 -1.0,0 -1.5,-0.25 -2.25,-1.0 l -5.75,-5.75 -5.75,5.75 c -0.5,0.5 -1.5,1.0 -2.25,1.0 -1.0,0 -1.5,-0.25 -2.25,-1.0 -1.25,-1.25 -1.25,-3.25 0.0,-4.5 l 5.75,-5.75 -5.75,-5.75 c -1.25,-1.25 -1.25,-3.25 -0.0,-4.5 1.25,-1.25 3.25,-1.25 4.5,0 l 5.75,5.75 5.75,-5.75 c 1.25,-1.25 3.25,-1.25 4.5,0 1.25,1.25 1.25,3.25 0,4.5 l -5.75,5.75 5.75,5.75 z" /> </g> <rect style="fill:#92b5c8;fill-opacity:1;stroke:none" y="51" x="0" height="82" width="' + boxwidth + '" /> <rect y="0.75" x="0.75" height="131.5" width="' + boxwidth2 + '" style="display:inline;visibility:visible;opacity:1;fill:none;fill-opacity:1;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;" /></svg>';

    this._stage = null;
    this._refreshCanvas = null;
    this._doBigger = null;
    this._doSmaller = null;
    this._doPlugins = null;
    this._deletePlugin = null;
    this._doStats = null;
    this._doScroller = null;
    this._doLanguageBox = null;
    this._languageBox = null;
    this._scrollStatus = false;
    this._increaseStatus = true;
    this._decreaseStatus = true;
    this._optimize = null;
    this._optimizeState = false;
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

    this.setOptimize = function (optimize) {
        this._optimize = optimize;
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

    this.deletePlugins = function (plugin) {
        this._deletePlugin = plugin;
        return this;
    };

    this.setStats = function (stats) {
        this._doStats = stats;
        return this;
    };

    this.setLanguage = function (doLanguageBox, languageBox) {
        this._doLanguageBox = doLanguageBox;
        this._languageBox = languageBox;
        return this;
    };

    this.setScroller = function (scroller) {
        this._doScroller = scroller;
        return this;
    };

    this.getPos = function () {
        return [this._container.x, this._container.y];
    };

    this.init = function (scale, x, y, makeButton, status) {
        if (this._container === null) {
            this._createBox(scale, x, y);
            var that = this;
            var dx = BOXBUTTONOFFSET;

            if (_THIS_IS_MUSIC_BLOCKS_) {
                this._optimizeOnButton = makeButton('optimize-on-button', _('Optimize performance'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
                this._optimizeOffButton = makeButton('optimize-off-button', _('Optimize feedback'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
                this._optimizeOnButton.visible = true;
                this._optimizeOffButton.visible = false;
                this._positionHoverText(this._optimizeOnButton);
                this._positionHoverText(this._optimizeOffButton);

                this._optimizeOnButton.on('click', function (event) {
                    that._optimizeState = true;
                    that._optimize(that._optimizeState);
                    that._optimizeOnButton.visible = false;
                    that._optimizeOffButton.visible = true;
                    that.hide();
                });

                this._optimizeOffButton.on('click', function (event) {
                    that._optimizeState = false;
                    that._optimize(that._optimizeState);
                    that._optimizeOnButton.visible = true;
                    that._optimizeOffButton.visible = false;
                    that.hide();
                });

                dx += BOXBUTTONSPACING;
            }

            this._languageButton = makeButton('language-button', _('Select language'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this._languageButton.visible = true;
            this._positionHoverText(this._languageButton);

            this._languageButton.on('click', function (event) {
                that._doLanguageBox();
                that.hide();
            });

            dx += BOXBUTTONSPACING;

            this._smallerButton = makeButton('smaller-button', _('Decrease block size'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this._smallerButton.visible = true;
            this._positionHoverText(this._smallerButton);

            this._smallerButton.on('click', function (event) {
                that._doSmaller();
                that.hide();
            });

            this._smallerButton2 = makeButton('smaller-disable-button', _('Cannot be further decreased'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this._smallerButton2.visible = false;
            this._positionHoverText(this._smallerButton2);

            this._smallerButton2.on('click', function (event) {
                that._doSmaller();
                that.hide();
            });

            dx += BOXBUTTONSPACING;

            this._biggerButton = makeButton('bigger-button', _('Increase block size'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this._biggerButton.visible = true;
            this._positionHoverText(this._biggerButton);

            this._biggerButton.on('click', function (event) {
                that._doBigger();
                that.hide();
            });

            this._biggerButton2 = makeButton('bigger-disable-button', _('Cannot be further increased'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this._biggerButton2.visible = false;
            this._positionHoverText(this._biggerButton2);

            this._biggerButton2.on('click', function (event) {
                that._doBigger();
                that.hide();
            });

            dx += BOXBUTTONSPACING;;

            this._statsButton = makeButton('stats-button', _('Display statistics'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this._statsButton.visible = true;
            this._positionHoverText(this._statsButton);

            this._statsButton.on('click', function (event) {
                that._doStats();
                that.hide();
            });

            dx += BOXBUTTONSPACING;;

            this._pluginsButton = makeButton('plugins-button', _('Load plugin from file'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this._pluginsButton.visible = true;
            this._positionHoverText(this._pluginsButton);

            this._pluginsButton.on('click', function (event) {
                that._doPlugins();
                that.hide();
            });

            dx += BOXBUTTONSPACING;;

            this._pluginsDeleteButton = makeButton('plugins-delete-disabled-button', '', this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this._pluginsDeleteButton.visible = !status;
            this._positionHoverText(this._pluginsDeleteButton);

            this._pluginsDeleteButton2 = makeButton('plugins-delete-button', _('Delete plugin'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this._pluginsDeleteButton2.visible = status;
            this._positionHoverText(this._pluginsDeleteButton2);

            this._pluginsDeleteButton2.on('click', function (event) {
                that._deletePlugin();
                that.hide();
            });

            dx += BOXBUTTONSPACING;;

            this._scrollButton = makeButton('scroll-unlock-button', _('Enable scrolling'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this._scrollButton.visible = true;
            this._positionHoverText(this._scrollButton);

            this._scrollButton.on('click', function (event) {
                that._doScroller();
                that.hide();
                that._scrollStatus = !that._scrollStatus;
            });

            // Don't increase dx since this button is placed on top of
            // the previous button.

            this._scrollButton2 = makeButton('scroll-lock-button', _('Disable scrolling'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this._scrollButton2.visible = false;
            this._positionHoverText(this._scrollButton2);
            this._scrollButton2.on('click', function (event) {
                that._doScroller();
                that.hide();
                that._scrollStatus = !that._scrollStatus;
            });
        } else {
            this._show(status);
        }
    };

    this._positionHoverText = function (button, offset) {
        for (var c = 0; c < button.children.length; c++) {
            if (button.children[c].text != undefined) {
                button.children[c].textAlign = 'left';
                button.children[c].x = -27;
                button.children[c].y = 27;

                if (offset !== undefined) {
                    button.children[c].x += offset;
                }
                break;
            }
        }
    };

    this.hide = function () {
        if (this._container !== null) {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this._optimizeOnButton.visible = false;
                this._optimizeOffButton.visible = false;
            }

            this._languageButton.visible = false;
            this._smallerButton.visible = false;
            this._smallerButton2.visible = false;
            this._biggerButton.visible = false;
            this._biggerButton2.visible = false;
            this._statsButton.visible = false;
            this._pluginsButton.visible = false;
            this._pluginsDeleteButton.visible = false;
            this._pluginsDeleteButton2.visible = false;
            this._scrollButton.visible = false;
            this._scrollButton2.visible = false;
            this._container.visible = false;
            this._refreshCanvas();
        }
    };

    this._show = function (status) {
        if (this._container !== null) {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this._optimizeOnButton.visible = !this._optimizeState;
                this._optimizeOffButton.visible = this._optimizeState;
            }

            this._languageButton.visible = true;
            this._smallerButton.visible = this._decreaseStatus;
            this._smallerButton2.visible = !this._decreaseStatus;
            this._biggerButton.visible = this._increaseStatus;
            this._biggerButton2.visible = !this._increaseStatus;
            this._statsButton.visible = true;
            this._pluginsButton.visible = true;
            this._pluginsDeleteButton.visible = !status;
            this._pluginsDeleteButton2.visible = status;
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
            this._container.x = x - boxwidth;
            this._container.y = y - 55;

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

            if (y < 55) {
                that.hide();
            }
        });
    };
};
