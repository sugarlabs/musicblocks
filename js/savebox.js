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
    this._doSaveSVG = null;
    this._doSavePNG = null;
    this._doSaveWAV = null;
    this._doUploadToPlanet = null;
    this._doShareOnFacebook = null;
    this._doSaveBlockArtwork = null;
    this._doSaveAbc = null;
    this._doSaveLilyPond = null;
    this._doSaveHTML = null;

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

    this.setSaveHTML = function (doSaveHTML) {
        this._doSaveHTML = doSaveHTML;
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

    this.setSaveWAV = function (doSaveWAV) {
        this._doSaveWAV = doSaveWAV;
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

    this.setSaveAbc = function (doSaveAbc) {
        this._doSaveAbc = doSaveAbc;
        return this;
    }

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

            var dx = BOXBUTTONOFFSET;

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

            this.uploadToPlanet = makeButton('upload-planet', _('Upload to Planet'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this.uploadToPlanet.visible = true;
            this.positionHoverText(this.uploadToPlanet);
            this.uploadToPlanet.on('click', function(event) {
                that.hide();
                that._doUploadToPlanet();
            });

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
            
            dx += BOXBUTTONSPACING;

            this.saveHTML = makeButton('save-button-dark', _('Save project'), this._container.x + dx, this._container.y + 85, 55, 0, this._stage);
            this.saveHTML.visible = true;
            this.positionHoverText(this.saveHTML);
            this.saveHTML.on('click', function(event) {
                that.hide();
                that._doSaveHTML();
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
var htmlSaveTemplate = `
<!-- {{ data }} -->
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="description" content="{{ project_description }}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
    <title>{{ project_name }}</title>

    <meta property="og:site_name" content="Music Blocks" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Music Blocks - {{ project_name }}" />
    <meta property="og:description" content="{{ project_description }}" />

    <style>
        body {
            background-color: #dbf0fb;
        }
        #main {
            background-color: white;
            padding: 5%;
            position: fixed;
            width: 80vw;
            max-height: 60vh;
            margin: auto;
            top: 0; left: 0; bottom: 0; right: 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align:  center;
            color: #424242;
            box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
            font-family: "Roboto", "Helvetica","Arial",sans-serif;
        }
        h3 {
            font-weight: 400;
            font-size: 36px;
            margin-top: 10px;
        }

        hr {
            border-top: 0px solid #ccc;
            margin: 1em;
        }

        .btn {
            border: solid;
            border-color: #96D3F3;
            padding: 5px 10px;
            line-height: 50px;
            color: #0a3e58;
        }

        .btn:hover {
            transition: 0.4s;
            -webkit-transition: 0.3s;
            -moz-transition: 0.3s;
            background-color: #96D3F3;
        }
    </style>
</head>
<body>
    <div id="main">
        <div style="color: #9E9E9E">
            {{ project_author }}
        </div>
        <h3>Music Blocks Project - {{ project_name }}</h3>
        <p>
            {{ project_description }}
        </p>
        <hr>
        <div>
            <a class="btn">
                Open in Musicblocks
            </a>

            <div style="color: #9E9E9E">
                Internet required to open this project in Musicblocks from here. <br>
                If you want to open this project in a local version of Musicblocks, open it from the application.
            </div>
    </div>
    </div>
</body>
</html>
`