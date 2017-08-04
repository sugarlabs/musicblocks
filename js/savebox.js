// Copyright (c) 2017 Walter Bender
// Copyright (c) 2017 Ayush Kumar
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA


const SAVEBOXSVG = '<svg xmlns="http://www.w3.org/2000/svg" height="133" width="420" version="1.1"> <rect style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" y="0" x="0" height="133" width="420" /> <g style="fill:#000000;display:block" transform="translate(365,0)"> <path style="fill:#000000;display:inline" d="m 27.557,5.053 c -12.43,0 -22.5,10.076 -22.5,22.497 0,12.432 10.07,22.503 22.5,22.503 12.431,0 22.5,-10.071 22.5,-22.503 0,-12.421 -10.07,-22.497 -22.5,-22.497 z m 10.199,28.159 c 1.254,1.256 1.257,3.291 0,4.545 -0.628,0.629 -1.451,0.943 -2.274,0.943 -0.822,0 -1.644,-0.314 -2.27,-0.94 l -5.76,-5.761 -5.76,5.761 c -0.627,0.626 -1.449,0.94 -2.271,0.94 -0.823,0 -1.647,-0.314 -2.275,-0.943 -1.254,-1.254 -1.254,-3.289 0.004,-4.545 l 5.758,-5.758 -5.758,-5.758 c -1.258,-1.254 -1.258,-3.292 -0.004,-4.546 1.255,-1.254 3.292,-1.259 4.546,0 l 5.76,5.759 5.76,-5.759 c 1.252,-1.259 3.288,-1.254 4.544,0 1.257,1.254 1.254,3.292 0,4.546 l -5.758,5.758 5.758,5.758 z" /> </g> <rect style="fill:#92b5c8;fill-opacity:1;stroke:none" y="51" x="0" height="82" width="420" /> <rect y="0.75" x="0.75" height="131.5" width="418.5" style="display:inline;visibility:visible;opacity:1;fill:none;fill-opacity:1;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;" /></svg>';

function SaveBox () {
    this._canvas = null;
    this._stage = null;
    this._refreshCanvas = null;
    this._doSaveTB = null;
    this._doSaveSVG = null;
    this._doSavePNG = null;
    this._doUploadToPlanet = null;
    this._doShareOnFacebook = null;
    this._doSaveBlockArtwork = null;
    this._doSaveLilyPond = null;

    this._container = null;
    this._bounds = null;
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

    this.setSaveTB = function (doSaveTB) {
        this._doSaveTB = doSaveTB;
        return this;
    };

    this.setSaveSVG = function (doSaveSVG) {
        this._doSaveSVG = doSaveSVG;
        return this;
    };

    this.setSavePNG = function (doSavePNG) {
        this._doSavePNG = doSavePNG;
        return this;
    };

    this.setSaveFB = function (doSaveFB) {
        this._doShareOnFacebook = doSaveFB;
        return this;
    };

    this.setSaveBlockArtwork = function (doSaveBlockArtwork) {
        this._doSaveBlockArtwork = doSaveBlockArtwork;
        return this;
    };

    this.setSaveLilypond = function (doSaveLilypond) {
        this._doSaveLilypond = doSaveLilypond;
        return this;
    };

    this.setSavePlanet = function (doSavePlanet) {
        this._doUploadToPlanet = doSavePlanet;
        return this;
    };

    this.setRefreshCanvas = function (refreshCanvas) {
        this._refreshCanvas = refreshCanvas;
        return this;
    };

    this.init = function(scale, x, y, makeButton) {
        if (this._container === null) {
            this.createBox(scale, x, y);
            var that = this;

            this.saveTB = makeButton('save-tb', _('Save as .tb'), this._container.x + 50, this._container.y + 85, 55, 0, this._stage);
            this.saveTB.visible = true;
            this.positionHoverText(this.saveTB);
            this.saveTB.on('click', function(event) {
                that.hide();
                that._doSaveTB();
            });

            this.saveSVG = makeButton('save-svg', _('Save as .svg'), this._container.x + 115, this._container.y + 85, 55, 0, this._stage);
            this.saveSVG.visible = true;
            this.positionHoverText(this.saveSVG);
            this.saveSVG.on('click', function(event) {
                that.hide();
                that._doSaveSVG();
            });

            this.savePNG = makeButton('save-png-inactive', _('Save as .png'), this._container.x + 180, this._container.y + 85, 55, 0, this._stage);
            this.savePNG.visible = true;
            this.positionHoverText(this.savePNG);
            this.savePNG.on('click', function(event) {
                that.hide();
                that._doSavePNG();
            });

            this.uploadToPlanet = makeButton('upload-planet', _('Upload to Planet'), this._container.x + 245, this._container.y + 85, 55, 0, this._stage);
            this.uploadToPlanet.visible = true;
            this.positionHoverText(this.uploadToPlanet);
            this.uploadToPlanet.on('click', function(event) {
                that.hide();
                that._doUploadToPlanet();
            });

            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.saveLilypond = makeButton('save-lilypond', _('Save sheet music'), this._container.x + 310, this._container.y + 85, 55, 0, this._stage);
                this.saveLilypond.visible = true;
                this.positionHoverText(this.saveLilypond);
                this.saveLilypond.on('click', function(event) {
                    that.hide();
                    that._doSaveLilypond();
                });
            } else {
                this.shareOnFb = makeButton('fb-inactive', _('Share on Facebook'), this._container.x + 310, this._container.y + 85, 55, 0, this._stage);
                this.shareOnFb.visible = true;
                this.positionHoverText(this.shareOnFb);
                this.shareOnFb.on('click', function(event) {
                    that.hide();
                    that._doShareOnFacebook();
                    // change 'fb-inactive' to 'fb' when the button becomes operational
                });
            }

            this.saveBlockArtwork = makeButton('save-block-artwork', _('Save block artwork'), this._container.x + 375, this._container.y + 85, 55, 0, this._stage);
            this.saveBlockArtwork.visible = true;
            this.positionHoverText(this.saveBlockArtwork, true);
            this.saveBlockArtwork.on('click', function(event) {
                that.hide();
                that._doSaveBlockArtwork();
            });

        } else {
            this.show();
        }
    };

    this.positionHoverText = function(button, offset) {
        for (var c = 0; c < button.children.length; c++) {
            if (button.children[c].text != undefined) {
                button.children[c].textAlign = 'left';
                if (offset == null) {
                    button.children[c].x = -27;
                } else {
                    button.children[c].x = -110;
                }
                button.children[c].y = 27;
                break;
            }
        }
    };

    this.hide = function() {
        if (this._container !== null) {
            this.saveTB.visible = false;
            this.saveSVG.visible = false;
            this.savePNG.visible = false;
            this.uploadToPlanet.visible = false;
            // this.shareOnFb.visible = false;
            this.saveBlockArtwork.visible = false;
            this.saveLilypond.visible = false;
            this._container.visible = false;
            this._refreshCanvas();
        }
    };

    this.show = function() {
        if (this._container !== null) {
            this.saveTB.visible = true;
            this.saveSVG.visible = true;
            this.savePNG.visible = true;
            this.uploadToPlanet.visible = true;
            // this.shareOnFb.visible = true;
            this.saveBlockArtwork.visible = true;
            this.saveLilypond.visible = true;
            this._container.visible = true;
            this._refreshCanvas();
        }
    };

    this.createBox = function(scale, x, y) {
        this._scale = scale;

        function __processBackground(that, name, bitmap, extras) {
            that._container.addChild(bitmap);
            that._loadUtilityContainerHandler();

            var hitArea = new createjs.Shape();
            that._bounds = that._container.getBounds();
            that._container.cache(that._bounds.x, that._bounds.y, that._bounds.width, that._bounds.height);
            hitArea.graphics.beginFill('#FFF').drawRect(that._bounds.x, that._bounds.y, that._bounds.width, that._bounds.height);
            hitArea.x = 0;
            hitArea.y = 0;
            that._container.hitArea = hitArea;
        };

        if (this._container == null) {
            this._container = new createjs.Container();
            this._stage.addChild(this._container);
            this._container.x = Math.floor(((this._canvas.width / scale) - 180) / 2);
            this._container.y = 55;
            this._makeBoxBitmap(SAVEBOXSVG, 'box', __processBackground, null);
        }
    };

    this._makeBoxBitmap = function(data, name, callback, extras) {
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

    this._loadUtilityContainerHandler = function() {
        var locked = false;
        var that = this;

        this._container.on('click', function(event) {
            if (locked) {
                console.log('debouncing click');
                return;
            }
            locked = true;

            setTimeout(function() {
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
