// Copyright (c) 2017 Walter Bender
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

const PLAYBACKBOXSVG = '<svg xmlns="http://www.w3.org/2000/svg" height="133" width="230" version="1.1"> <rect style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" y="0" x="0" height="133" width="230" /> <g style="fill:#000000;display:block" transform="translate(176.943,-1.053)"> <path style="fill:#000000;display:inline" d="m 27.557,5.053 c -12.43,0 -22.5,10.076 -22.5,22.497 0,12.432 10.07,22.503 22.5,22.503 12.431,0 22.5,-10.071 22.5,-22.503 0,-12.421 -10.07,-22.497 -22.5,-22.497 z m 10.199,28.159 c 1.254,1.256 1.257,3.291 0,4.545 -0.628,0.629 -1.451,0.943 -2.274,0.943 -0.822,0 -1.644,-0.314 -2.27,-0.94 l -5.76,-5.761 -5.76,5.761 c -0.627,0.626 -1.449,0.94 -2.271,0.94 -0.823,0 -1.647,-0.314 -2.275,-0.943 -1.254,-1.254 -1.254,-3.289 0.004,-4.545 l 5.758,-5.758 -5.758,-5.758 c -1.258,-1.254 -1.258,-3.292 -0.004,-4.546 1.255,-1.254 3.292,-1.259 4.546,0 l 5.76,5.759 5.76,-5.759 c 1.252,-1.259 3.288,-1.254 4.544,0 1.257,1.254 1.254,3.292 0,4.546 l -5.758,5.758 5.758,5.758 z" /> </g> <rect style="fill:#92b5c8;fill-opacity:1;stroke:none" y="51" x="0" height="82" width="360" /> <rect y="0.76763773" x="0.76764059" height="131.46472" width="228.46472" style="display:inline;visibility:visible;opacity:1;fill:none;fill-opacity:1;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;" /></svg>';

// A pop up for playback functions, e.g., compile, play, pause, etc.
function PlaybackBox () {
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

    this.init = function (scale, x, y, makeButton, logo) {
        this._logo = logo;

        if (this._container === null) {
            this._createBox(scale, x, y);
            var that = this;

            this.playButton = makeButton('media-playback-start', _('playback music'), this._container.x + 55, this._container.y + 85, 55, 0, this._stage);
            this.playButton.visible = true;
            this._positionHoverText(this.playButton);

            this.playButton.on('click', function (event) {
                that._doPlay();
            });

            this.noplayButton = makeButton('media-playback-start-insensitive', _('playback music'), this._container.x + 55, this._container.y + 85, 55, 0, this._stage);
            this.noplayButton.visible = true;
            this._positionHoverText(this.playButton);

            this.pauseButton = makeButton('media-playback-pause', _('pause playback'), this._container.x + 55, this._container.y + 85, 55, 0, this._stage);
            this.pauseButton.visible = false;
            this._positionHoverText(this.pauseButton);

            this.pauseButton.on('click', function (event) {
                that._doPause();
            });

            this.rewindButton = makeButton('media-playlist-repeat', _('restart playback'), this._container.x + 120, this._container.y + 85, 55, 0, this._stage);
            this.rewindButton.visible = false;
            this._positionHoverText(this.rewindButton);

            this.rewindButton.on('click', function (event) {
                that._doRewind();
            });

            this.norewindButton = makeButton('media-playlist-repeat-insensitive', _('restart playback'), this._container.x + 120, this._container.y + 85, 55, 0, this._stage);
            this.norewindButton.visible = true;
            this._positionHoverText(this.norewindButton);

            this._compileButton = makeButton('compile-button', _('prepare music for playback'), this._container.x + 185, this._container.y + 85, 55, 0, this._stage);
            this._compileButton.visible = true;
            this._positionHoverText(this._compileButton);
            for (var c = 0; c < this._compileButton.children.length; c++) {
                if (this._compileButton.children[c].text != undefined) {
                    this._compileButton.children[c].x = -180;
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

    this._hide = function () {
        if (this._container !== null) {
            this.playButton.visible = false;
            this.noplayButton.visible = false;
            this.pauseButton.visible = false;
            this.rewindButton.visible = false;
            this.norewindButton.visible = false;
            this._compileButton.visible = false;
            this._container.visible = false;
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
            this._container.x = x - 230;
            this._container.y = y - 133;

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
                that._hide();
            }
        });
    };
};
