// Copyright (c) 2017,18 Walter Bender
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

// A pop up for playback functions, e.g., compile, play, pause, etc.
function PlaybackBox () {
    const BOXBUTTONOFFSET = 55;
    const BOXBUTTONSPACING = 65;

    // 3 buttons, 2 intrabuttons spaces, 2 extrabutton spaces
    var boxwidth = 3 * 55 + 2 * 10 + 2 * 20;
    var boxwidth2 = boxwidth - 1.5;
    var boxclose = boxwidth - 55;

    const PLAYBACKBOXSVG = '<svg xmlns="http://www.w3.org/2000/svg" height="133" width="' + boxwidth + '" version="1.1"> <rect style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" y="0" x="0" height="133" width="' + boxwidth + '" /> <g style="fill:#000000;display:block" transform="translate(' + boxclose + ',-1)"> <path style="fill:#000000;display:inline" d="m 27.5,5.0 c -12.43,0 -22.5,10.0 -22.5,22.5 0,12.5 10.0,22.5 22.5,22.5 12.5,0 22.5,-10.0 22.5,-22.5 0,-12.5 -10.0,-22.5 -22.5,-22.5 z m 10.0,28.0 c 1.25,1.25 1.25,3.25 0,4.5 -0.5,0.5 -1.5,1.0 -2.25,1.0 -1.0,0 -1.5,-0.25 -2.25,-1.0 l -5.75,-5.75 -5.75,5.75 c -0.5,0.5 -1.5,1.0 -2.25,1.0 -1.0,0 -1.5,-0.25 -2.25,-1.0 -1.25,-1.25 -1.25,-3.25 0.0,-4.5 l 5.75,-5.75 -5.75,-5.75 c -1.25,-1.25 -1.25,-3.25 -0.0,-4.5 1.25,-1.25 3.25,-1.25 4.5,0 l 5.75,5.75 5.75,-5.75 c 1.25,-1.25 3.25,-1.25 4.5,0 1.25,1.25 1.25,3.25 0,4.5 l -5.75,5.75 5.75,5.75 z" /> </g> <rect style="fill:#92b5c8;fill-opacity:1;stroke:none" y="51" x="0" height="82" width="' + boxwidth + '" /> <rect y="0.75" x="0.75" height="131.5" width="' + boxwidth2 + '" style="display:inline;visibility:visible;opacity:1;fill:none;fill-opacity:1;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;" /></svg>';

    this._stage = null;
    this._refreshCanvas = null;
    this._doCompile = null;
    this._doPlay = null;
    this._doPause = null;
    this._doRewind = null;
    this._getQueueStatus = null;
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

    this.setQueueStatus = function (getQueueStatus) {
        this._getQueueStatus = getQueueStatus;
        return this;
    };

    this.setCompile = function (compile) {
        this._doCompile = compile;
        return this;
    };

    this.setPlay = function (play) {
        this._doPlay = play;
        return this;
    };

    this.setPause = function (pause) {
        this._doPause = pause;
        return this;
    };

    this.setRewind = function (rewind) {
        this._doRewind = rewind;
        return this;
    };

    this.getPos = function () {
        return [this._container.x, this._container.y];
    };

    this.init = function (scale, x, y, makeButton, logo) {
        this._logo = logo;

        if (this._container === null) {
            this._createBox(scale, x, y);
            var that = this;
            var dx = BOXBUTTONOFFSET;

            //.TRANS: playback in the case refers to playing back music that has been preprocessed.
            this.playButton = makeButton('media-playback-start', _('playback music') + ' [Alt-P]', this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this.playButton.visible = true;
            this._positionHoverText(this.playButton);

            this.playButton.on('click', function (event) {
                that._doPlay();
            });

            this.noplayButton = makeButton('media-playback-start-insensitive', _('playback music'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this.noplayButton.visible = true;
            this._positionHoverText(this.playButton);

            //.TRANS: playback in the case refers to playing back music that has been preprocessed.
            this.pauseButton = makeButton('media-playback-pause', _('pause playback'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this.pauseButton.visible = false;
            this._positionHoverText(this.pauseButton);

            this.pauseButton.on('click', function (event) {
                that._doPause();
            });

            dx += BOXBUTTONSPACING;

            //.TRANS: playback in the case refers to playing back music that has been preprocessed.
            this.rewindButton = makeButton('media-playlist-repeat', _('restart playback'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this.rewindButton.visible = false;
            this._positionHoverText(this.rewindButton);

            this.rewindButton.on('click', function (event) {
                that._doRewind();
            });

            //.TRANS: playback in the case refers to playing back music that has been preprocessed.
            this.norewindButton = makeButton('media-playlist-repeat-insensitive', _('restart playback'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this.norewindButton.visible = true;
            this._positionHoverText(this.norewindButton);

            dx += BOXBUTTONSPACING;

            //.TRANS: playback in the case refers to playing back music that has been preprocessed.
            this._compileButton = makeButton('compile-button', _('prepare music for playback'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this._compileButton.visible = true;
            this._positionHoverText(this._compileButton);
            for (var c = 0; c < this._compileButton.children.length; c++) {
                if (this._compileButton.children[c].text != undefined) {
                    this._compileButton.children[c].x = -dx + 10;
                    break;
                }
            }

            this._compileButton.on('click', function (event) {
                that._doCompile();
            });
        } else {
            this._show();
        }

        this.setPlaybackStatus();
    };

    this.setPlaybackStatus = function () {
        if (this._container != null) {
            if (!this._container.visible) {
                this.noplayButton.visible = false;
                this.playButton.visible = false;
                this.pauseButton.visible = false;
                this.norewindButton.visible = false;
                this.rewindButton.visible = false;
            } else if (this._getQueueStatus()) {
                this.noplayButton.visible = false;
                this.playButton.visible = true;
                this.pauseButton.visible = false;
                if (this._logo.playbackTime === 0) {
                    this.norewindButton.visible = true;
                    this.rewindButton.visible = false;
                } else {
                    this.norewindButton.visible = false;
                    this.rewindButton.visible = true;
                }
            } else {
                this.noplayButton.visible = true;
                this.playButton.visible = false;
                this.pauseButton.visible = false;
                this.norewindButton.visible = true;
                this.rewindButton.visible = false;
            }
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

    this.hide = function () {
        if (this._container !== null) {
            this.playButton.visible = false;
            this.noplayButton.visible = false;
            this.pauseButton.visible = false;
            this.rewindButton.visible = false;
            this.norewindButton.visible = false;
            this._compileButton.visible = false;
            this._container.visible = false;
            var progressBar = docById('myProgress');
            progressBar.style.visibility = 'hidden';
            this._refreshCanvas();
        }
    };

    this._show = function () {
        if (this._container !== null) {
            if (this._logo.playbackQueue === {}) {
                this.playButton.visible = false;
                this.noplayButton.visible = true;
                this.rewindButton.visible = false;
                this.norewindButton.visible = true;
            } else {
                this.playButton.visible = true;
                this.noplayButton.visible = false;
                this.rewindButton.visible = false;
                this.norewindButton.visible = true;
            }

            this._compileButton.visible = true;
            // TODO: Check running status
            this.pauseButton.visible = false;
            this._container.visible = true;
            this._refreshCanvas();
        }
    };

    this._createBox = function (scale, x, y) {
        this._scale = scale;

        function __processBackground(that, name, bitmap, extras) {
            that._container.addChild(bitmap);
            that._loadPlaybackContainerHandler();

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

            var PLAYBACKBOX = PLAYBACKBOXSVG;
            this._makeBoxBitmap(PLAYBACKBOX, 'pbox', __processBackground, null);
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

    this._loadPlaybackContainerHandler = function () {
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
