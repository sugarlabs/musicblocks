// Copyright (c) 2017,18 Walter Bender
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

function SaveBox () {
    const BOXBUTTONOFFSET = 40;
    const BOXBUTTONSPACING = 65;

    if (_THIS_IS_MUSIC_BLOCKS_) {
        // 8 buttons, 6 intrabuttons spaces, 2 extrabutton spaces
        var boxwidth = 8 * 55 + 6 * 10 + 2 * 20;
    } else {
        // 6 buttons, 5 intrabuttons spaces, 2 extrabutton spaces
        var boxwidth = 6 * 55 + 5 * 10 + 2 * 20;
    }

    var boxwidth2 = boxwidth - 1.5;
    var boxclose = boxwidth - 55;

    const SAVEBOXSVG = '<svg xmlns="http://www.w3.org/2000/svg" height="133" width="' + boxwidth + '" version="1.1"> <rect style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" y="0" x="0" height="133" width="' + boxwidth + '" /> <g style="fill:#000000;display:block" transform="translate(' + boxclose + ',-1)"> <path style="fill:#000000;display:inline" d="m 27.5,5.0 c -12.43,0 -22.5,10.0 -22.5,22.5 0,12.5 10.0,22.5 22.5,22.5 12.5,0 22.5,-10.0 22.5,-22.5 0,-12.5 -10.0,-22.5 -22.5,-22.5 z m 10.0,28.0 c 1.25,1.25 1.25,3.25 0,4.5 -0.5,0.5 -1.5,1.0 -2.25,1.0 -1.0,0 -1.5,-0.25 -2.25,-1.0 l -5.75,-5.75 -5.75,5.75 c -0.5,0.5 -1.5,1.0 -2.25,1.0 -1.0,0 -1.5,-0.25 -2.25,-1.0 -1.25,-1.25 -1.25,-3.25 0.0,-4.5 l 5.75,-5.75 -5.75,-5.75 c -1.25,-1.25 -1.25,-3.25 -0.0,-4.5 1.25,-1.25 3.25,-1.25 4.5,0 l 5.75,5.75 5.75,-5.75 c 1.25,-1.25 3.25,-1.25 4.5,0 1.25,1.25 1.25,3.25 0,4.5 l -5.75,5.75 5.75,5.75 z" /> </g> <rect style="fill:#92b5c8;fill-opacity:1;stroke:none" y="51" x="0" height="82" width="' + boxwidth + '" /> <rect y="0.75" x="0.75" height="131.5" width="' + boxwidth2 + '" style="display:inline;visibility:visible;opacity:1;fill:none;fill-opacity:1;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;" /></svg>';

    this._canvas = null;
    this._stage = null;
    this._refreshCanvas = null;
    this._doSaveHTML = null;
    this._doSaveSVG = null;
    this._doSavePNG = null;
    this._doSaveWAV = null;
    this._doUploadToPlanet = null;
    this._doShareOnFacebook = null;
    this._doSaveBlockArtwork = null;
    this._doSaveAbc = null;
    this._doSaveLilypond = null;

    this._container = null;
    this._bounds = null;
    this.save = null;
    this.close = null;
    this._scale = 1;

    this.setVariables = function(vars){
        for (var i = 0; i<vars.length; i++){
            this[vars[i][0]]=vars[i][1];
        }
    }

    this.init = function(scale, x, y, makeButton) {
        if (this._container === null) {
            this.createBox(scale, x, y);
            var that = this;

            var dx = BOXBUTTONOFFSET;

            this.saveHTML = makeButton('save-button-dark', _('Save project'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this.saveHTML.visible = true;
            this.positionHoverText(this.saveHTML);
            this.saveHTML.on('click', function(event) {
                that.hide();
                that._doSaveHTML();
            });

            dx += BOXBUTTONSPACING;

            this.saveSVG = makeButton('save-svg', _('Save as .svg'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this.saveSVG.visible = true;
            this.positionHoverText(this.saveSVG);
            this.saveSVG.on('click', function(event) {
                that.hide();
                that._doSaveSVG();
            });

            dx += BOXBUTTONSPACING;

            this.savePNG = makeButton('save-png', _('Save as .png'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this.savePNG.visible = true;
            this.positionHoverText(this.savePNG);
            this.savePNG.on('click', function(event) {
                that.hide();
                that._doSavePNG();
            });

            dx += BOXBUTTONSPACING;

            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.saveWAV = makeButton('save-wav', _('Save as .wav'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
                this.saveWAV.visible = true;
                this.positionHoverText(this.saveWAV);
                this.saveWAV.on('click', function(event) {
                    that.hide();
                    that._doSaveWAV();
                });

                dx += BOXBUTTONSPACING;
            }

            if (this._doUploadToPlanet != null) {
                this.uploadToPlanet = makeButton('upload-planet', _('Upload to Planet'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
                this.uploadToPlanet.visible = true;
                this.positionHoverText(this.uploadToPlanet);
                this.uploadToPlanet.on('click', function(event) {
                    that.hide();
                    that._doUploadToPlanet();
                });
            } else {
                this.uploadToPlanet = makeButton('planet-disabled-button', _('The Planet is unavailable.'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
                this.uploadToPlanet.visible = true;
                this.positionHoverText(this.uploadToPlanet);
            }

            dx += BOXBUTTONSPACING;

            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.saveLilypond = makeButton('save-lilypond', _('Save sheet music'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
                this.saveLilypond.visible = true;
                this.positionHoverText(this.saveLilypond);
                this.saveLilypond.on('click', function(event) {
                    that.hide();
                    that._doSaveLilypond();
                });
            } else {
                this.shareOnFb = makeButton('fb-inactive', _('Share on Facebook'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
                this.shareOnFb.visible = true;
                this.positionHoverText(this.shareOnFb);
                this.shareOnFb.on('click', function(event) {
                    that.hide();
                    that._doShareOnFacebook();
                    // change 'fb-inactive' to 'fb' when the button becomes operational
                });
            }

            dx += BOXBUTTONSPACING;

            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.saveAbc = makeButton('save-abc', _('Save as .abc'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
                this.saveAbc.visible = true;
                this.positionHoverText(this.saveAbc);
                this.saveAbc.on('click', function(event) {
                    that.hide();
                    that._doSaveAbc();
                });

                dx += BOXBUTTONSPACING;
            }

            this.saveBlockArtwork = makeButton('save-block-artwork', _('Save block artwork'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
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
            this.saveHTML.visible = false;
            this.saveSVG.visible = false;
            this.savePNG.visible = false;
            this.uploadToPlanet.visible = false;
            this.saveBlockArtwork.visible = false;
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.saveWAV.visible = false;
                this.saveLilypond.visible = false;
                this.saveAbc.visible = false;
            } else {
                this.shareOnFb.visible = false;
            }

            this._container.visible = false;
            this._refreshCanvas();
        }
    };

    this.show = function() {
        if (this._container !== null) {
            this.saveHTML.visible = true;
            this.saveSVG.visible = true;
            this.savePNG.visible = true;
            this.uploadToPlanet.visible = true;
            this.saveBlockArtwork.visible = true;
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.saveWAV.visible = true;
                this.saveLilypond.visible = true;
                this.saveAbc.visible = true;
            } else {
                this.shareOnFb.visible = true;
            }
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
            this._container.x = x - boxwidth;
            this._container.y = y;
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
