// Copyright (c) 2014-17 Walter Bender
// Copyright (c) Yash Khandelwal, GSoC'15
// Copyright (c) 2016 Tymon Radzik
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
// Note: This code is inspired by the Python Turtle Blocks project
// (https://github.com/walterbender/turtleart), but implemented from
// scratch. -- Walter Bender, October 2014.

const _THIS_IS_MUSIC_BLOCKS_ = true;
const _THIS_IS_TURTLE_BLOCKS_ = !_THIS_IS_MUSIC_BLOCKS_;


function facebookInit() {
    window.fbAsyncInit = function () {
        FB.init({
            appId: '1496189893985945',
            xfbml: true,
            version: 'v2.1'
        });

        // ADD ADDITIONAL FACEBOOK CODE HERE
    };
};


try {
    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }

        js = d.createElement(s);
        js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
} catch (e) {
};


var lang = document.webL10n.getLanguage();
if (lang.indexOf('-') !== -1) {
    lang = lang.slice(0, lang.indexOf("-"));
    document.webL10n.setLanguage(lang);
}

if (_THIS_IS_MUSIC_BLOCKS_) {
    MYDEFINES = ["activity/sugarizer-compatibility", 'activity/platformstyle', 'easeljs-0.8.2.min', 'tweenjs-0.6.2.min', 'preloadjs-0.6.2.min', 'Tone.min', 'howler', 'p5.min', 'p5.sound.min', 'p5.dom.min', 'mespeak', 'Chart', 'activity/utils', 'activity/artwork', 'activity/status', 'activity/munsell', 'activity/trash', 'activity/boundary', 'activity/turtle', 'activity/palette', 'activity/protoblocks', 'activity/blocks', 'activity/block', 'activity/turtledefs', 'activity/logo', 'activity/clearbox', 'activity/savebox', 'activity/utilitybox', 'activity/samplesviewer', 'activity/basicblocks', 'activity/blockfactory', 'activity/analytics', 'activity/modewidget', 'activity/soundsamples', 'activity/pitchtimematrix', 'activity/pitchdrummatrix', 'activity/rhythmruler', 'activity/pitchstaircase', 'activity/tempo', 'activity/pitchslider', 'activity/macros', 'activity/musicutils', 'activity/lilypond', 'activity/abc', 'prefixfree.min'];
} else {
    MYDEFINES = ["activity/sugarizer-compatibility", 'activity/platformstyle', 'easeljs-0.8.2.min', 'tweenjs-0.6.2.min', 'preloadjs-0.6.2.min', 'howler', 'p5.min', 'p5.sound.min', 'p5.dom.min', 'mespeak', 'Chart', 'activity/utils', 'activity/artwork', 'activity/status', 'activity/munsell', 'activity/trash', 'activity/boundary', 'activity/turtle', 'activity/palette', 'activity/protoblocks', 'activity/blocks', 'activity/block', 'activity/turtledefs', 'activity/logo', 'activity/clearbox', 'activity/savebox', 'activity/utilitybox', 'activity/samplesviewer', 'activity/basicblocks', 'activity/blockfactory', 'activity/analytics', 'activity/macros', 'activity/musicutils', 'activity/lilypond', 'prefixfree.min'];
}

define(MYDEFINES, function (compatibility) {

    // Manipulate the DOM only when it is ready.
    require(['domReady!','activity/sugarizer-compatibility'], function (doc) {
        if (sugarizerCompatibility.isInsideSugarizer()) {
            sugarizerCompatibility.loadData(function () {
                domReady(doc);
            });
        } else {
            domReady(doc);
        }
    });

    function domReady(doc) {
        createDefaultStack();
        createHelpContent();
        // facebookInit();
        window.scroll(0, 0);

        try {
            meSpeak.loadConfig('lib/mespeak_config.json');
            var lang = document.webL10n.getLanguage();
            if (['es', 'ca', 'de', 'el', 'eo', 'fi', 'fr', 'hu', 'it', 'kn', 'la', 'lv', 'nl', 'pl', 'pt', 'ro', 'sk', 'sv', 'tr', 'zh'].indexOf(lang) !== -1) {
                meSpeak.loadVoice('lib/voices/' + lang + '.json');
            } else {
                meSpeak.loadVoice('lib/voices/en/en.json');
            }
        } catch (e) {
            console.log(e);
        }

        var canvas = docById('myCanvas');

        // Set up a file chooser for the doOpen function.
        var fileChooser = docById('myOpenFile');
        // Set up a file chooser for the doOpenPlugin function.
        var pluginChooser = docById('myOpenPlugin');
        // The file chooser for all files.
        var allFilesChooser = docById('myOpenAll');

        // Are we running off of a server?
        var server = true;
        var turtleBlocksScale = 1;
        var stage;
        var turtles;
        var palettes;
        var blocks;
        var logo;
        var clearBox;
        var utilityBox;
        var thumbnails;
        var buttonsVisible = true;
        var headerContainer = null;
        var menuButtonsVisible = true;
        var menuContainer = null;
        var scrollBlockContainer = false;
        var currentKeyCode = 0;
        var pasteContainer = null;
        var pasteImage = null;
        var chartBitmap = null;
        var saveBox;

        // Calculate the palette colors.
        for (var p in PALETTECOLORS) {
            PALETTEFILLCOLORS[p] = getMunsellColor(PALETTECOLORS[p][0], PALETTECOLORS[p][1], PALETTECOLORS[p][2]);
            PALETTESTROKECOLORS[p] = getMunsellColor(PALETTECOLORS[p][0], PALETTECOLORS[p][1] - 30, PALETTECOLORS[p][2]);
            PALETTEHIGHLIGHTCOLORS[p] = getMunsellColor(PALETTECOLORS[p][0], PALETTECOLORS[p][1] + 10, PALETTECOLORS[p][2]);
            HIGHLIGHTSTROKECOLORS[p] = getMunsellColor(PALETTECOLORS[p][0], PALETTECOLORS[p][1] - 50, PALETTECOLORS[p][2]);
        }

        pluginObjs = {
            'PALETTEPLUGINS': {},
            'PALETTEFILLCOLORS': {},
            'PALETTESTROKECOLORS': {},
            'PALETTEHIGHLIGHTCOLORS': {},
            'FLOWPLUGINS': {},
            'ARGPLUGINS': {},
            'BLOCKPLUGINS': {},
            'ONLOAD': {},
            'ONSTART': {},
            'ONSTOP': {}
        };

        // Stacks of blocks saved in local storage
        var macroDict = {};

        var stopTurtleContainer = null;
        var homeButtonContainers = [];

        var cameraID = null;

        // default values
        const DEFAULTDELAY = 500; // milleseconds
        const TURTLESTEP = -1; // Run in step-by-step mode

        const BLOCKSCALES = [1, 1.5, 2, 3, 4];
        var blockscale = BLOCKSCALES.indexOf(DEFAULTBLOCKSCALE);
        if (blockscale === -1) {
            blockscale = 1;
        }

        // Used to track mouse state for mouse button block
        var stageMouseDown = false;
        var stageX = 0;
        var stageY = 0;

        var onXO = (screen.width === 1200 && screen.height === 900) || (screen.width === 900 && screen.height === 1200);

        var cellSize = 55;
        if (onXO) {
            cellSize = 75;
        }

        var onscreenButtons = [];
        var onscreenMenu = [];
        var utilityButton = null;
        var saveButton = null;

        var helpContainer = null;
        var helpIdx = 0;
        var firstRun = true;

        pluginsImages = {};

        // Sometimes (race condition?) Firefox does not properly
        // initialize strings in musicutils. These methods ensure that
        // the names are never null.
        console.log('initing i18n for music terms');
        initDrumI18N();
        initModeI18N();
        initVoiceI18N();

        window.onblur = function () {
            logo.doStopTurtle();
        };

        function _findBlocks() {
            logo.showBlocks();
            blocksContainer.x = 0;
            blocksContainer.y = 0;
            palettes.initial_x = 55;
            palettes.initial_y = 55;
            palettes.updatePalettes();
            var x = 100 * turtleBlocksScale;
            var y = 100 * turtleBlocksScale;

            // First start blocks
            for (var blk in blocks.blockList) {
                if (!blocks.blockList[blk].trash) {
                    var myBlock = blocks.blockList[blk];
                    if (myBlock.name !== 'start') {
                        continue;
                    };

                    if (myBlock.connections[0] == null) {
                        var dx = x - myBlock.container.x;
                        var dy = y - myBlock.container.y;
                        blocks.moveBlockRelative(blk, dx, dy);
                        blocks.findDragGroup(blk);
                        if (blocks.dragGroup.length > 0) {
                            for (var b = 0; b < blocks.dragGroup.length; b++) {
                                var bblk = blocks.dragGroup[b];
                                if (b !== 0) {
                                    blocks.moveBlockRelative(bblk, dx, dy);
                                }
                            }
                        }
                        x += 200 * turtleBlocksScale;
                        if (x > (canvas.width - 100) / (turtleBlocksScale)) {
                            x = 100 * turtleBlocksScale;
                            y += 100 * turtleBlocksScale;
                        }
                    }
                }
            }

            // The everything else
            for (var blk in blocks.blockList) {
                if (!blocks.blockList[blk].trash) {
                    var myBlock = blocks.blockList[blk];
                    if (myBlock.name === 'start') {
                        continue;
                    };

                    if (myBlock.connections[0] == null) {
                        var dx = x - myBlock.container.x;
                        var dy = y - myBlock.container.y;
                        blocks.moveBlockRelative(blk, dx, dy);
                        blocks.findDragGroup(blk);
                        if (blocks.dragGroup.length > 0) {
                            for (var b = 0; b < blocks.dragGroup.length; b++) {
                                var bblk = blocks.dragGroup[b];
                                if (b !== 0) {
                                    blocks.moveBlockRelative(bblk, dx, dy);
                                }
                            }
                        }
                        x += 200 * turtleBlocksScale;
                        if (x > (canvas.width - 100) / (turtleBlocksScale)) {
                            x = 100 * turtleBlocksScale;
                            y += 100 * turtleBlocksScale;
                        }
                    }
                }
            }

            // Blocks are all home, so reset go-home-button.
            homeButtonContainers[0].visible = false;
            homeButtonContainers[1].visible = true;
            boundary.hide();
        };

        function _printBlockSVG() {
            var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + logo.canvas.width + '" height="' + logo.canvas.height + '">';
            for (var i = 0; i < blocks.blockList.length; i++) {
                if (blocks.blockList[i].name === 'hidden') {
                    continue;
                }
                if (blocks.blockList[i].name === 'hiddennoflow') {
                    continue;
                }
                if (blocks.blockList[i].trash) {
                    continue;
                }
                var parts = blocks.blockArt[i].split('><');
                svg += '<g transform="translate(' + blocks.blockList[i].container.x + ', ' + blocks.blockList[i].container.y + ')">';
                switch(blocks.blockList[i].name) {
                case 'text':
                case 'solfege':
                case 'eastindiansolfege':
                case 'notename':
                case 'rest':
                case 'number':
                case 'modename':
                case 'voicename':
                case 'drumname':
                    for (var p = 1; p < parts.length; p++) {
                        // FIXME: This is fragile.
                        if (p === 1) {
                            svg += '<' +  parts[p] + '><';
                        } else if (p === 2) {
                            // skip filter
                        } else if (p === 3) {
                            svg += parts[p].replace('filter:url(#dropshadow);', '') + '><';
                        } else if (p === 5) {
                            // Add block value to SVG between tspans
                            svg += parts[p] + '>' + blocks.blockList[i].value + '<';
                        } else if (p === parts.length - 2) {
                            svg += parts[p] + '>';
                        } else if (p === parts.length - 1) {
                            // skip final </svg>
                        } else {
                            svg += parts[p] + '><';
                        }
                    }
                    break;
                default:
                    for (var p = 1; p < parts.length; p++) {
                        // FIXME: This is fragile.
                        if (p === 1) {
                            svg += '<' +  parts[p] + '><';
                        } else if (p === 2) {
                            // skip filter
                        } else if (p === 3) {
                            svg += parts[p].replace('filter:url(#dropshadow);', '') + '><';
                        } else if (p === parts.length - 2) {
                            svg += parts[p] + '>';
                        } else if (p === parts.length - 1) {
                            // skip final </svg>
                        } else {
                            svg += parts[p] + '><';
                        }
                    }
                    break;
                }
                svg += '</g>';
            }
            svg += '</svg>';
            download('blockArtwork.svg', 'data:image/svg+xml;utf8,' + svg, 'blockArtwork.svg', '"width=' + logo.canvas.width + ', height=' + logo.canvas.height + '"');

        }

        function _allClear() {
            if (chartBitmap != null) {
                stage.removeChild(chartBitmap);
                chartBitmap = null;
            }

            logo.boxes = {};
            logo.time = 0;
            hideMsgs();
            logo.setBackgroundColor(-1);
            logo.notationOutput = LILYPONDHEADER;
            for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                logo.turtleHeaps[turtle] = [];
                logo.notationStaging[turtle] = [];
                turtles.turtleList[turtle].doClear(true, true, true);
            }

            blocksContainer.x = 0;
            blocksContainer.y = 0;

            // Code specific to cleaning up music blocks
            Element.prototype.remove = function () {
                this.parentElement.removeChild(this);
            };

            NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
                for (var i = 0, len = this.length; i < len; i++) {
                    if(this[i] && this[i].parentElement) {
                        this[i].parentElement.removeChild(this[i]);
                    }
                }
            };

            var table = document.getElementById("myTable");
            if(table != null) {
                table.remove();
            }

            /*
            var canvas = document.getElementById("music");
            var context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
            */
        };

        function _doFastButton(env) {
            var currentDelay = logo.turtleDelay;
            var playingWidget = false;
            logo.setTurtleDelay(0);
            if (_THIS_IS_MUSIC_BLOCKS_) {
                if (docById('ptmDiv').style.visibility === 'visible') {
                    playingWidget = true;
                    logo.pitchTimeMatrix.playAll();
                }

                if (docById('pscDiv').style.visibility === 'visible') {
                    playingWidget = true;
                    pitchstaircase.playUpAndDown();
                }

                if (docById('rulerDiv').style.visibility === 'visible') {
                    // If the tempo widget is open, sync it up with the
                    // rhythm ruler.
                    if (docById('tempoDiv').style.visibility === 'visible') {
                        if (tempo.isMoving) {
                            tempo.pause();
                        }
                        tempo.resume();
                    }

                    playingWidget = true;
                    rhythmruler.playAll();
                }

                // We were using the run button to play a widget, not
                // the turtles.
                if (playingWidget) {
                    return;
                }

                // Restart tempo widget and run blocks.
                if (docById('tempoDiv').style.visibility === 'visible') {
                    if (tempo.isMoving) {
                        tempo.pause();
                    }

                    tempo.resume();
                }
            }

            if (!turtles.running()) {
                console.log('running');
                logo.runLogoCommands(null, env);
            } else {
                if (currentDelay !== 0) {
                    // keep playing at full speep
                    console.log('running from step');
                    logo.step();
                } else {
                    // stop and restart
                    console.log('stopping...');
                    logo.doStopTurtle();

                    setTimeout(function () {
                        console.log('and running');
                        logo.runLogoCommands(null, env);
                    }, 500);
                }
            }
        };

        function _doSlowButton() {
            logo.setTurtleDelay(DEFAULTDELAY);
            if (_THIS_IS_MUSIC_BLOCKS_ && docById('ptmDiv').style.visibility === 'visible') {
                logo.pitchTimeMatrix.playAll();
            } else if (!turtles.running()) {
                logo.runLogoCommands();
            } else {
                logo.step();
            }
        };

        function _doStepButton() {
            var turtleCount = Object.keys(logo.stepQueue).length;

            if (turtleCount === 0 || logo.turtleDelay !== TURTLESTEP) {
                // Either we haven't set up a queue or we are
                // switching modes.
                logo.setTurtleDelay(TURTLESTEP);
                // Queue and take first step.
                if (!turtles.running()) {
                    logo.runLogoCommands();
                }
                logo.step();
            } else {
                logo.setTurtleDelay(TURTLESTEP);
                logo.step();
            }
        };

        function _doSlowMusicButton() {
            logo.setNoteDelay(DEFAULTDELAY);

            if (docById('ptmDiv').style.visibility === 'visible') {
                logo.pitchTimeMatrix.playAll();
            } else if (!turtles.running()) {
                logo.runLogoCommands();
            } else {
                logo.stepNote();
            }
        };

        function _doStepMusicButton() {
            var turtleCount = Object.keys(logo.stepQueue).length;

            if (turtleCount === 0 || logo.TurtleDelay !== TURTLESTEP) {
                // Either we haven't set up a queue or we are
                // switching modes.
                logo.setTurtleDelay(TURTLESTEP);
                // Queue and take first step.
                if (!turtles.running()) {
                    logo.runLogoCommands();
                }
                logo.stepNote();
            } else {
                logo.setTurtleDelay(TURTLESTEP);
                logo.stepNote();
            }
        };


        function doStopButton() {
            logo.doStopTurtle();
        };

        var cartesianVisible = false;

        function _doCartesian() {
            if (cartesianVisible) {
                _hideCartesian();
                cartesianVisible = false;
            } else {
                _showCartesian();
                cartesianVisible = true;
            }
        };

        var polarVisible = false;

        function _doPolar() {
            if (polarVisible) {
                _hidePolar();
                polarVisible = false;
            } else {
                _showPolar();
                polarVisible = true;
            }
        };

        function toggleScroller() {
            scrollBlockContainer = !scrollBlockContainer;
        };

        function closeAnalytics(chartBitmap, ctx) {
            var button = this;
            button.x = (canvas.width / (2 * turtleBlocksScale))  + (300 / Math.sqrt(2));
            button.y = 300.00 - (300.00 / Math.sqrt(2));
            this.closeButton = _makeButton('cancel-button', _('Close'), button.x, button.y, 55, 0);
            this.closeButton.on('click', function (event) {
                console.log('Deleting Chart');
                button.closeButton.visible = false;
                stage.removeChild(chartBitmap);
                logo.showBlocks();
                update = true;
                ctx.clearRect(0, 0, 600, 600);
            });
        };

        function _isCanvasBlank(canvas) {
            var blank = document.createElement('canvas');
            blank.width = canvas.width;
            blank.height = canvas.height;
            return canvas.toDataURL() == blank.toDataURL();
        };

        function doAnalytics() {
            var myChart = docById('myChart');

             if(_isCanvasBlank(myChart) == false) {
                return ;
             }

            var ctx = myChart.getContext('2d');
            document.body.style.cursor = 'wait';
            var myRadarChart = null;
            var scores = analyzeProject(blocks);
            console.log(scores);
            var data = scoreToChartData(scores);
            var Analytics = this;
            Analytics.close = closeAnalytics;

            var __callback = function () {
                var imageData = myRadarChart.toBase64Image();
                var img = new Image();
                img.onload = function () {
                    var chartBitmap = new createjs.Bitmap(img);
                    stage.addChild(chartBitmap);
                    chartBitmap.x = (canvas.width / (2 * turtleBlocksScale)) - (300);
                    chartBitmap.y = 0;
                    chartBitmap.scaleX = chartBitmap.scaleY = chartBitmap.scale = 600 / chartBitmap.image.width;
                    logo.hideBlocks();
                    update = true;
                    document.body.style.cursor = 'default';
                    Analytics.close(chartBitmap, ctx);
                };
                img.src = imageData;
            };

            var options = getChartOptions(__callback);
            console.log('creating new chart');
            myRadarChart = new Chart(ctx).Radar(data, options);
        };

        function doBiggerFont() {
            if (blockscale < BLOCKSCALES.length - 1) {
                blockscale += 1;
                blocks.setBlockScale(BLOCKSCALES[blockscale]);
            }
        };

        function doSmallerFont() {
            if (blockscale > 0) {
                blockscale -= 1;
                blocks.setBlockScale(BLOCKSCALES[blockscale]);
            }
        };

        // Do we need to update the stage?
        var update = true;

        // Coordinate grid
        var cartesianBitmap = null;

        // Polar grid
        var polarBitmap = null;

        // Msg block
        var msgText = null;

        // ErrorMsg block
        var errorMsgText = null;
        var errorMsgArrow = null;
        var errorArtwork = {};
        const ERRORARTWORK = ['emptybox', 'emptyheap', 'negroot', 'noinput', 'zerodivide', 'notanumber', 'nostack', 'notastring', 'nomicrophone'];

        // Get things started
        init();

        function init() {
            docById('loader').className = 'loader';

            stage = new createjs.Stage(canvas);
            createjs.Touch.enable(stage);

            createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
            createjs.Ticker.setFPS(30);
            createjs.Ticker.addEventListener('tick', stage);
            createjs.Ticker.addEventListener('tick', __tick);

            _createMsgContainer('#ffffff', '#7a7a7a', function (text) {
                msgText = text;
            }, 55);

            _createMsgContainer('#ffcbc4', '#ff0031', function (text) {
                errorMsgText = text;
            }, 110);

            _createErrorContainers();

            /* Z-Order (top to bottom):
             *   menus
             *   palettes
             *   blocks
             *   trash
             *   turtles
             *   logo (drawing)
             */
            palettesContainer = new createjs.Container();
            blocksContainer = new createjs.Container();
            trashContainer = new createjs.Container();
            turtleContainer = new createjs.Container();

            stage.addChild(turtleContainer, trashContainer, blocksContainer, palettesContainer);
            _setupBlocksContainerEvents();

            trashcan = new Trashcan();
            trashcan
                .setCanvas(canvas)
                .setStage(trashContainer)
                .setSize(cellSize)
                .setRefreshCanvas(refreshCanvas)
                .init();

            turtles = new Turtles();
            turtles
                .setCanvas(canvas)
                .setStage(turtleContainer)
                .setRefreshCanvas(refreshCanvas);

            // Put the boundary in the blocks container so it scrolls
            // with the blocks.
            boundary = new Boundary();
            boundary
                .setStage(blocksContainer)
                .init();

            blocks = new Blocks();
            blocks
                .setCanvas(canvas)
                .setStage(blocksContainer)
                .setRefreshCanvas(refreshCanvas)
                .setTrashcan(trashcan)
                .setUpdateStage(stage.update)
                .setGetStageScale(getStageScale)
                .setTurtles(turtles)
                .setErrorMsg(errorMsg);
            blocks.makeCopyPasteButtons(_makeButton, updatePasteButton);

            turtles.setBlocks(blocks);

            palettes = new Palettes();
            palettes
                .setCanvas(canvas)
                .setStage(palettesContainer)
                .setRefreshCanvas(refreshCanvas)
                .setSize(cellSize)
                .setTrashcan(trashcan)
                .setBlocks(blocks)
                .init();

            initPalettes(palettes);

            logo = new Logo();
            logo
                .setCanvas(canvas)
                .setBlocks(blocks)
                .setTurtles(turtles)
                .setStage(turtleContainer)
                .setRefreshCanvas(refreshCanvas)
                .setTextMsg(textMsg)
                .setErrorMsg(errorMsg)
                .setHideMsgs(hideMsgs)
                .setOnStopTurtle(onStopTurtle)
                .setOnRunTurtle(onRunTurtle)
                .setGetStageX(getStageX)
                .setGetStageY(getStageY)
                .setGetStageMouseDown(getStageMouseDown)
                .setGetCurrentKeyCode(getCurrentKeyCode)
                .setClearCurrentKeyCode(clearCurrentKeyCode)
                .setMeSpeak(meSpeak)
                .setSaveLocally(saveLocally);

            blocks.setLogo(logo);

            // Set the default background color...
            logo.setBackgroundColor(-1);

            clearBox = new ClearBox();
            clearBox
                .setCanvas(canvas)
                .setStage(stage)
                .setRefreshCanvas(refreshCanvas)
                .setClear(sendAllToTrash);

            saveBox = new SaveBox();
            saveBox
                .setCanvas(canvas)
                .setStage(stage)
                .setRefreshCanvas(refreshCanvas)
                .setSaveTB(doSaveTB)
                .setSaveSVG(doSaveSVG)
                .setSavePNG(doSavePNG)
                .setSavePlanet(doUploadToPlanet)
                .setSaveBlockArtwork(doSaveBlockArtwork);

            if (_THIS_IS_MUSIC_BLOCKS_) {
                saveBox.setSaveLilypond(doSaveLilypond);
            } else {
                saveBox.setSaveFB(doShareOnFacebook);
            }

            utilityBox = new UtilityBox();
            utilityBox
                .setStage(stage)
                .setRefreshCanvas(refreshCanvas)
                .setBigger(doBiggerFont)
                .setSmaller(doSmallerFont)
                .setPlugins(doOpenPlugin)
                .setStats(doAnalytics)
                .setScroller(toggleScroller);

            thumbnails = new SamplesViewer();
            thumbnails
                .setStage(stage)
                .setRefreshCanvas(refreshCanvas)
                .setClear(sendAllToTrash)
                .setLoad(loadProject)
                .setLoadRaw(loadRawProject)
                .init();

            initBasicProtoBlocks(palettes, blocks);

            // Load any macros saved in local storage.
            macroData = storage.macros;
            if (macroData != null) {
                processMacroData(macroData, palettes, blocks, macroDict);
            }

            // Blocks and palettes need access to the macros dictionary.
            blocks.setMacroDictionary(macroDict);
            palettes.setMacroDictionary(macroDict);

            // Load any plugins saved in local storage.
            pluginData = storage.plugins;
            if (pluginData != null) {
                var obj = processPluginData(pluginData, palettes, blocks, logo.evalFlowDict, logo.evalArgDict, logo.evalParameterDict, logo.evalSetterDict, logo.evalOnStartList, logo.evalOnStopList);
                updatePluginObj(obj);
            }

            // Load custom mode saved in local storage.
            var custommodeData = storage.custommode;
            if (custommodeData != undefined) {
                customMode = JSON.parse(custommodeData);
                console.log('restoring custom mode: ' + customMode);
            }

            fileChooser.addEventListener('click', function (event) {
                this.value = null;
            });

            fileChooser.addEventListener('change', function (event) {
                // Read file here.
                var reader = new FileReader();

                reader.onload = (function (theFile) {
                    // Show busy cursor.
                    document.body.style.cursor = 'wait';

                    setTimeout(function () {
                        var rawData = reader.result;
                        var cleanData = rawData.replace('\n', ' ');
                        try {
                            var obj = JSON.parse(cleanData);
                        } catch (e) {
                            alert(_('Failed to load file data.'));
                            document.body.style.cursor = 'default';
                            return;
                        }

                        // First, hide the palettes as they will need updating.
                        for (var name in blocks.palettes.dict) {
                            blocks.palettes.dict[name].hideMenu(true);
                        }

                        sendAllToTrash(false, false);
                        refreshCanvas();

                        blocks.loadNewBlocks(obj);

                        document.body.style.cursor = 'default';
                    }, 200);
                });

                reader.readAsText(fileChooser.files[0]);
            }, false);
        
            function handleFileSelect (evt) {
                evt.stopPropagation();
                evt.preventDefault();

                var files = evt.dataTransfer.files;
                var reader = new FileReader();

                reader.onload = (function(theFile) {
                    document.body.style.cursor = 'wait';

                    setTimeout(function() {
                        var rawData = reader.result;
                        
                        if (rawData == null || rawData == '') {		
                            errorMsg(_('Cannot load project from the file. Please check the file type.'));
                        } else {
                        var cleanData = rawData.replace('\n', ' ');
                 
                        try {
                            var obj = JSON.parse(cleanData);
                            for (var name in blocks.palettes.dict) {
                                blocks.palettes.dict[name].hideMenu(true);
                            }
    
                            sendAllToTrash(false, false);
                            refreshCanvas();
    
                            blocks.loadNewBlocks(obj);
                        } catch (e) {
                            errorMsg(_('Cannot load project from the file. Please check file type.'));
                        }
                    
                        document.body.style.cursor = 'default';

						}
						document.body.style.cursor = 'default';

                    }, 200);
                });

                reader.readAsText(files[0]);
                window.scroll(0, 0)
            };

            function handleDragOver (evt) {
                evt.stopPropagation();
                evt.preventDefault();
                evt.dataTransfer.dropEffect = 'copy';
            };

            var dropZone = document.getElementById('canvasHolder');
            dropZone.addEventListener('dragover', handleDragOver, false);
            dropZone.addEventListener('drop', handleFileSelect, false);

            allFilesChooser.addEventListener('click', function (event) {
                this.value = null;
            });

            pluginChooser.addEventListener('click', function (event) {
                window.scroll(0, 0);
                this.value = null;
            });

            pluginChooser.addEventListener('change', function (event) {
                window.scroll(0, 0);

                // Read file here.
                var reader = new FileReader();

                reader.onload = (function (theFile) {
                    // Show busy cursor.
                    document.body.style.cursor = 'wait';
                    setTimeout(function () {
                        obj = processRawPluginData(reader.result, palettes, blocks, errorMsg, logo.evalFlowDict, logo.evalArgDict, logo.evalParameterDict, logo.evalSetterDict, logo.evalOnStartList, logo.evalOnStopList);
                        // Save plugins to local storage.
                        if (obj != null) {
                            var pluginObj = preparePluginExports(obj);
                            console.log(pluginObj);
                            storage.plugins = pluginObj; // preparePluginExports(obj));
                        }

                        // Refresh the palettes.
                        setTimeout(function () {
                            if (palettes.visible) {
                                palettes.hide();
                            }
                            palettes.show();
                            palettes.bringToTop();
                        }, 1000);

                        // Restore default cursor.
                        document.body.style.cursor = 'default';
                    }, 200);
                });

                reader.readAsText(pluginChooser.files[0]);
            }, false);

            // Workaround to chrome security issues
            // createjs.LoadQueue(true, null, true);

            // Enable touch interactions if supported on the current device.
            // FIXME: voodoo
            // createjs.Touch.enable(stage, false, true);
            // Keep tracking the mouse even when it leaves the canvas.
            stage.mouseMoveOutside = true;
            // Enabled mouse over and mouse out events.
            stage.enableMouseOver(10); // default is 20

            cartesianBitmap = _createGrid('images/Cartesian.svg');

            polarBitmap = _createGrid('images/polar.svg');

            var URL = window.location.href;
            var projectName = null;
            var runProjectOnLoad = false;

            _setupAndroidToolbar();

            // Scale the canvas relative to the screen size.
            _onResize();

            var urlParts;
            var env = [];

            if (!sugarizerCompatibility.isInsideSugarizer() && URL.indexOf('?') > 0) {
                var urlParts = URL.split('?');
                if (urlParts[1].indexOf('&') > 0) {
                    var newUrlParts = urlParts[1].split('&');
                    for (var i = 0; i < newUrlParts.length; i++) {
                        if (newUrlParts[i].indexOf('=') > 0) {
                            var args = newUrlParts[i].split('=');
                            switch (args[0].toLowerCase()) {
                            case 'file':
                                projectName = args[1];
                                break;
                            case 'run':
                                if (args[1].toLowerCase() === 'true')
                                    runProjectOnLoad = true;
                                break;
                            case 'inurl':
                                var url = args[1];
                                var getJSON = function (url) {
                                    return new Promise(function (resolve, reject) {
                                        var xhr = new XMLHttpRequest();
                                        xhr.open('get', url, true);
                                        xhr.responseType = 'json';
                                        xhr.onload = function () {
                                            var status = xhr.status;
                                            if (status === 200) {
                                                resolve(xhr.response);
                                            } else {
                                                reject(status);
                                            }
                                        };
                                        xhr.send();
                                    });
                                };
                                getJSON(url).then(function (data) {
                                    console.log('Your Json result is:  ' + data.arg); //you can comment this, i used it to debug
                                    n = data.arg;
                                    env.push(parseInt(n));
                                }, function (status) { //error detection....
                                    alert('Something went wrong.');
                                });
                                break;
                            case 'outurl':
                                var url = args[1];
                                break;
                            default:
                                errorMsg("Invalid parameters");
                            }
                        }
                    }
                } else {
                    if (urlParts[1].indexOf('=') > 0)
                        var args = urlParts[1].split('=');
                    //File is the only arg that can stand alone
                    if (args[0].toLowerCase() === 'file') {
                        projectName = args[1];
                    }
                }
            }

            if (projectName != null) {
                setTimeout(function () {
                    console.log('loading ' + projectName);
                    loadStartWrapper(loadProject, projectName, runProjectOnLoad, env);
                }, 2000);
            } else {
                setTimeout(function () {
                    loadStartWrapper(_loadStart);
                }, 2000);
            }

            document.addEventListener('mousewheel', scrollEvent, false);
            document.addEventListener('DOMMouseScroll', scrollEvent, false);

            this.document.onkeydown = __keyPressed;
            _hideStopButton();
        };

        function _setupBlocksContainerEvents() {
            var moving = false;

            stage.on('stagemousemove', function (event) {
                stageX = event.stageX;
                stageY = event.stageY;
            });

            stage.on('stagemousedown', function (event) {
                stageMouseDown = true;
                if (stage.getObjectUnderPoint() != null | turtles.running()) {
                    stage.on('stagemouseup', function (event) {
                        stageMouseDown = false;
                    });
                    return;
                }
                moving = true;
                lastCords = {
                    x: event.stageX,
                    y: event.stageY
                };

                stage.on('stagemousemove', function (event) {
                    if (!moving) {
                        return;
                    }

                    if (scrollBlockContainer) {
                        blocksContainer.x += event.stageX - lastCords.x;
                        blocksContainer.y += event.stageY - lastCords.y;
                        lastCords = {
                            x: event.stageX,
                            y: event.stageY
                        };
                        refreshCanvas();
                    }
                });

                stage.on('stagemouseup', function (event) {
                    stageMouseDown = false;
                    moving = false;
                });
            });
        };

        function scrollEvent(event) {
            var data = event.wheelDelta || -event.detail;
            var delta = Math.max(-1, Math.min(1, (data)));
            var scrollSpeed = 30;

            if (event.clientX < cellSize) {
                palettes.menuScrollEvent(delta, scrollSpeed);
                palettes.hidePaletteIconCircles();
            } else {
                palette = palettes.findPalette(event.clientX / turtleBlocksScale, event.clientY / turtleBlocksScale);
                if (palette) {
                    palette.scrollEvent(delta, scrollSpeed);
                }
            }
        };

        function getStageScale() {
            return turtleBlocksScale;
        };

        function getStageX() {
            return turtles.screenX2turtleX(stageX / turtleBlocksScale);
        };

        function getStageY() {
            return turtles.screenY2turtleY(stageY / turtleBlocksScale);
        };

        function getStageMouseDown() {
            return stageMouseDown;
        };

        function setCameraID(id) {
            cameraID = id;
        };

        function _createGrid(imagePath) {
            var img = new Image();
            img.src = imagePath;
            var container = new createjs.Container();
            stage.addChild(container);

            var bitmap = new createjs.Bitmap(img);
            container.addChild(bitmap);
            bitmap.cache(0, 0, 1200, 900);

            bitmap.x = (canvas.width - 1200) / 2;
            bitmap.y = (canvas.height - 900) / 2;
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 1;
            bitmap.visible = false;
            bitmap.updateCache();

            return bitmap;
        };

        function _createMsgContainer(fillColor, strokeColor, callback, y) {
            var container = new createjs.Container();
            stage.addChild(container);
            container.x = (canvas.width - 1000) / 2;
            container.y = y;
            container.visible = false;

            var img = new Image();
            var svgData = MSGBLOCK.replace('fill_color', fillColor).replace(
                'stroke_color', strokeColor);

            img.onload = function () {
                var msgBlock = new createjs.Bitmap(img);
                container.addChild(msgBlock);
                var text = new createjs.Text('your message here', '20px Arial', '#000000');
                container.addChild(text);
                text.textAlign = 'center';
                text.textBaseline = 'alphabetic';
                text.x = 500;
                text.y = 30;

                var bounds = container.getBounds();
                container.cache(bounds.x, bounds.y, bounds.width, bounds.height);

                var hitArea = new createjs.Shape();
                hitArea.graphics.beginFill('#FFF').drawRect(0, 0, 1000, 42);
                hitArea.x = 0;
                hitArea.y = 0;
                container.hitArea = hitArea;

                container.on('click', function (event) {
                    container.visible = false;
                    // On the possibility that there was an error
                    // arrow associated with this container
                    if (errorMsgArrow != null) {
                        errorMsgArrow.removeAllChildren(); // Hide the error arrow.
                    }
                    update = true;
                });
                callback(text);
                blocks.setMsgText(text);
            };

            img.src = 'data:image/svg+xml;base64,' + window.btoa(
                unescape(encodeURIComponent(svgData)));
        };

        function _createErrorContainers() {
            // Some error messages have special artwork.
            for (var i = 0; i < ERRORARTWORK.length; i++) {
                var name = ERRORARTWORK[i];
                _makeErrorArtwork(name);
            }
        };

        function _makeErrorArtwork(name) {
            var container = new createjs.Container();
            stage.addChild(container);
            container.x = (canvas.width - 1000) / 2;
            container.y = 110;
            errorArtwork[name] = container;
            errorArtwork[name].name = name;
            errorArtwork[name].visible = false;

            var img = new Image();
            img.onload = function () {
                // console.log('creating error message artwork for ' + img.src);
                var artwork = new createjs.Bitmap(img);
                container.addChild(artwork);
                var text = new createjs.Text('', '20px Sans', '#000000');
                container.addChild(text);
                text.x = 70;
                text.y = 10;

                var bounds = container.getBounds();
                container.cache(bounds.x, bounds.y, bounds.width, bounds.height);

                var hitArea = new createjs.Shape();
                hitArea.graphics.beginFill('#FFF').drawRect(0, 0, bounds.width, bounds.height);
                hitArea.x = 0;
                hitArea.y = 0;
                container.hitArea = hitArea;

                container.on('click', function (event) {
                    container.visible = false;
                    // On the possibility that there was an error
                    // arrow associated with this container
                    if (errorMsgArrow != null) {
                        errorMsgArrow.removeAllChildren(); // Hide the error arrow.
                    }
                    update = true;
                });
            };

            img.src = 'images/' + name + '.svg';
        };

        function __keyPressed(event) {
            if (docById('labelDiv').classList.contains('hasKeyboard')) {
                return;
            }

            if (_THIS_IS_MUSIC_BLOCKS_) {
                if (docById('BPMInput').classList.contains('hasKeyboard')) {
                    return;
                }

                if (docById('musicratio1').classList.contains('hasKeyboard')) {
                    return;
                }

                if (docById('musicratio2').classList.contains('hasKeyboard')) {
                    return;
                }

                if (docById('dissectNumber').classList.contains('hasKeyboard')) {
                    return;
                }
            }

            const BACKSPACE = 8;
            const TAB = 9;
                        /*
            if (event.keyCode === TAB || event.keyCode === BACKSPACE) {
                // Prevent browser from grabbing TAB key
                event.preventDefault();
            }
                        */

            const ESC = 27;
            const ALT = 18;
            const CTRL = 17;
            const SHIFT = 16;
            const RETURN = 13;
            const SPACE = 32;
            const HOME = 36;
            const PAGE_UP = 33;
            const PAGE_DOWN = 34;
            const KEYCODE_LEFT = 37;
            const KEYCODE_RIGHT = 39;
            const KEYCODE_UP = 38;
            const KEYCODE_DOWN = 40;

            if (event.altKey) {
                switch (event.keyCode) {
                case 66: // 'B'
                    _printBlockSVG();
                    break;
                case 69: // 'E'
                    _allClear();
                    break;
                case 82: // 'R'
                    _doFastButton();
                    break;
                case 83: // 'S'
                    logo.doStopTurtle();
                    break;
                }
            } else if (event.ctrlKey) {
            } else {
                switch (event.keyCode) {
                case KEYCODE_UP:
                    if (blocks.activeBlock != null) {
                        blocks.moveStackRelative(blocks.activeBlock, 0, -STANDARDBLOCKHEIGHT / 2);
                        blocks.blockMoved(blocks.activeBlock);
                        blocks.adjustDocks(blocks.activeBlock, true);
                    } else if (palettes.mouseOver) {
                        palettes.menuScrollEvent(1, 10);
                        palettes.hidePaletteIconCircles();
                    } else if (palettes.activePalette != null) {
                        palettes.activePalette.scrollEvent(STANDARDBLOCKHEIGHT, 1);
                    } else if (scrollBlockContainer) {
                        blocksContainer.y -= 20;
                    }
                    break;
                case KEYCODE_DOWN:
                    if (blocks.activeBlock != null) {
                        blocks.moveStackRelative(blocks.activeBlock, 0, STANDARDBLOCKHEIGHT / 2);
                        blocks.blockMoved(blocks.activeBlock);
                        blocks.adjustDocks(blocks.activeBlock, true);
                    } else if (palettes.mouseOver) {
                        palettes.menuScrollEvent(-1, 10);
                        palettes.hidePaletteIconCircles();
                    } else if (palettes.activePalette != null) {
                        palettes.activePalette.scrollEvent(-STANDARDBLOCKHEIGHT, 1);
                    } else if (scrollBlockContainer) {
                        blocksContainer.y += 20;
                    }
                    break;
                case KEYCODE_LEFT:
                    if (blocks.activeBlock != null) {
                        blocks.moveStackRelative(blocks.activeBlock, -STANDARDBLOCKHEIGHT / 2, 0);
                        blocks.blockMoved(blocks.activeBlock);
                        blocks.adjustDocks(blocks.activeBlock, true);
                    } else if (scrollBlockContainer) {
                        blocksContainer.x -= 20;
                    }
                    break;
                case KEYCODE_RIGHT:
                    if (blocks.activeBlock != null) {
                        blocks.moveStackRelative(blocks.activeBlock, STANDARDBLOCKHEIGHT / 2, 0);
                        blocks.blockMoved(blocks.activeBlock);
                        blocks.adjustDocks(blocks.activeBlock, true);
                    } else if (scrollBlockContainer) {
                        blocksContainer.x += 20;
                    }
                    break;
                case HOME:
                    if (palettes.mouseOver) {
                        var dy = Math.max(55 - palettes.buttons['rhythm'].y, 0);
                        palettes.menuScrollEvent(1, dy);
                        palettes.hidePaletteIconCircles();
                    } else if (palettes.activePalette != null) {
                        palettes.activePalette.scrollEvent(-palettes.activePalette.scrollDiff, 1);
                    } else {
                        _findBlocks();
                    }
                    break;
                case TAB:
                    break;
                case ESC:
                    // toggle full screen
                    _toggleToolbar();
                    break;
                case RETURN:
                    // toggle run
                    logo.runLogoCommands();
                    break;
                default:
                    break;
                }
                // Always store current key so as not to mask it from
                // the keyboard block.
                currentKeyCode = event.keyCode;
            }
        };

        function getCurrentKeyCode() {
            return currentKeyCode;
        };

        function clearCurrentKeyCode() {
            currentKey = '';
            currentKeyCode = 0;
        };

        function _onResize() {
            if (docById('labelDiv').classList.contains('hasKeyboard')) {
                return;
            }

            if (!platform.androidWebkit) {
                var w = window.innerWidth;
                var h = window.innerHeight;
            } else {
                var w = window.outerWidth;
                var h = window.outerHeight;
            }

            var smallSide = Math.min(w, h);

            if (smallSide < cellSize * 11) {
                var mobileSize = true;
                if (w < cellSize * 10) {
                    turtleBlocksScale = smallSide / (cellSize * 11);
                } else {
                    turtleBlocksScale = Math.max(smallSide / (cellSize * 11), 0.75);
                }
            } else {
                var mobileSize = false;
                if (w / 1200 > h / 900) {
                    turtleBlocksScale = w / 1200;
                } else {
                    turtleBlocksScale = h / 900;
                }
            }

            stage.scaleX = turtleBlocksScale;
            stage.scaleY = turtleBlocksScale;

            stage.canvas.width = w;
            stage.canvas.height = h;

            /*
            console.log('Resize: scale ' + turtleBlocksScale +
            ', windowW ' + w + ', windowH ' + h +
            ', canvasW ' + canvas.width + ', canvasH ' + canvas.height +
            ', screenW ' + screen.width + ', screenH ' + screen.height);
            */
            turtles.setScale(turtleBlocksScale);
            blocks.setScale(turtleBlocksScale);
            boundary.setScale(w, h, turtleBlocksScale);
            palettes.setScale(turtleBlocksScale);
            trashcan.resizeEvent(turtleBlocksScale);
            _setupAndroidToolbar(mobileSize);

            // Reposition coordinate grids.
            cartesianBitmap.x = (canvas.width / (2 * turtleBlocksScale)) - (600);
            cartesianBitmap.y = (canvas.height / (2 * turtleBlocksScale)) - (450);
            polarBitmap.x = (canvas.width / (2 * turtleBlocksScale)) - (600);
            polarBitmap.y = (canvas.height / (2 * turtleBlocksScale)) - (450);
            update = true;

            // Setup help now that we have calculated turtleBlocksScale.
            _showHelp(true);

            // Hide palette icons on mobile
            if (mobileSize) {
                palettes.setMobile(true);
                palettes.hide();
            } else {
                palettes.setMobile(false);
                palettes.show();
                palettes.bringToTop();
            }

            for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                turtles.turtleList[turtle].doClear(false, false, true);
            }

            var artcanvas = document.getElementById("overlayCanvas");
            artcanvas.width = w;
            artcanvas.height = h;
        };

        window.onresize = function () {
            _onResize();
        };

        function _restoreTrash() {
            // Restore last stack pushed to trashStack.
            // First, hide the palettes as they will need updating.
            for (var name in blocks.palettes.dict) {
                blocks.palettes.dict[name].hideMenu(true);
            }
            refreshCanvas();

            var dx = 0;
            var dy = -cellSize * 3; // Reposition blocks about trash area.

            if (blocks.trashStacks.length === 0) {
                console.log('Trash is empty--nothing to do');
                return;
            }

            var thisBlock = blocks.trashStacks.pop();

            // Restore drag group in trash
            blocks.findDragGroup(thisBlock);
            for (var b = 0; b < blocks.dragGroup.length; b++) {
                var blk = blocks.dragGroup[b];
                // console.log('Restoring ' + blocks.blockList[blk].name + ' from the trash.');
                blocks.blockList[blk].trash = false;
                blocks.moveBlockRelative(blk, dx, dy);
                blocks.blockList[blk].show();
            }

            blocks.raiseStackToTop(thisBlock);

            if (blocks.blockList[thisBlock].name === 'start' || blocks.blockList[thisBlock].name === 'drum') {
                var turtle = blocks.blockList[thisBlock].value;
                turtles.turtleList[turtle].trash = false;
                turtles.turtleList[turtle].container.visible = true;
            } else if (blocks.blockList[thisBlock].name === 'action') {
                // We need to add a palette entry for this action.
                // But first we need to ensure we have a unqiue name,
                // as the name could have been taken in the interim.
                var actionArg = blocks.blockList[blocks.blockList[thisBlock].connections[1]];
                if (actionArg != null) {
                    var oldName = actionArg.value;
                    // Mark the action block as still being in the
                    // trash so that its name won't be considered when
                    // looking for a unique name.
                    blocks.blockList[thisBlock].trash = true;
                    var uniqueName = blocks.findUniqueActionName(oldName);
                    blocks.blockList[thisBlock].trash = false;

                    if (uniqueName !== actionArg) {
                        console.log('renaming action when restoring from trash. old name: ' + oldName + ' unique name: ' + uniqueName);

                        actionArg.value = uniqueName;

                        var label = actionArg.value.toString();
                        if (label.length > 8) {
                            label = label.substr(0, 7) + '...';
                        }
                        actionArg.text.text = label;

                        if (actionArg.label != null) {
                            actionArg.label.value = uniqueName;
                        }

                        actionArg.container.updateCache();

                        // Check the drag group to ensure any do
                        // blocks are updated (in case of recursion).
                        for (var b = 0; b < blocks.dragGroup.length; b++) {
                            var me = blocks.blockList[blocks.dragGroup[b]];
                            if (['nameddo', 'nameddoArg', 'namedcalc', 'namedcalcArg'].indexOf(me.name) !== -1 && me.privateData === oldName) {
                                console.log('reassigning nameddo to ' + uniqueName);
                                me.privateData = uniqueName;
                                me.value = uniqueName;

                                var label = me.value.toString();
                                if (label.length > 8) {
                                    label = label.substr(0, 7) + '...';
                                }
                                me.text.text = label;
                                me.overrideName = label;
                                me.regenerateArtwork();
                                me.container.updateCache();
                            }
                        }
                    }

                    var actionName = actionArg.value;
                    if (actionName !== _('action')) {
                        // blocks.checkPaletteEntries('action');
                        console.log('FIXME: Check for unique action name here');
                    }
                }
            }

            blocks.refreshCanvas();
        };

        function _deleteBlocksBox() {
            clearBox.show(turtleBlocksScale);
        };

        function _doUtilityBox() {
            utilityBox.init(turtleBlocksScale, utilityButton.x - 27, utilityButton.y, _makeButton);
        };

        function sendAllToTrash(addStartBlock, doNotSave) {
            // First, hide the palettes as they will need updating.
            for (var name in blocks.palettes.dict) {
                blocks.palettes.dict[name].hideMenu(true);
            }
            refreshCanvas();

            var dx = 0;
            var dy = cellSize * 3;
            for (var blk in blocks.blockList) {
                // If this block is at the top of a stack, push it
                // onto the trashStacks list.
                if (blocks.blockList[blk].connections[0] == null) {
                    blocks.trashStacks.push(blk);
                }

                if (blocks.blockList[blk].name === 'start' || blocks.blockList[blk].name === 'drum') {
                    console.log('start blk ' + blk + ' value is ' + blocks.blockList[blk].value)
                    var turtle = blocks.blockList[blk].value;
                    if (!blocks.blockList[blk].trash && turtle != null) {
                        console.log('sending turtle ' + turtle + ' to trash');
                        turtles.turtleList[turtle].trash = true;
                        turtles.turtleList[turtle].container.visible = false;
                    }
                } else if (blocks.blockList[blk].name === 'action') {
                    if (!blocks.blockList[blk].trash) {
                        blocks.deleteActionBlock(blocks.blockList[blk]);
                    }
                }

                blocks.blockList[blk].trash = true;
                blocks.moveBlockRelative(blk, dx, dy);
                blocks.blockList[blk].hide();
            }

            if (addStartBlock) {
                blocks.loadNewBlocks(DATAOBJS);
            } else if (!doNotSave) {
                // Overwrite session data too.
                saveLocally();
            }

            update = true;
        };

        function _changePaletteVisibility() {
            if (palettes.visible) {
                palettes.hide();
            } else {
                palettes.show();
                palettes.bringToTop();
            }
        };

        function _changeBlockVisibility() {
            if (blocks.visible) {
                logo.hideBlocks();
                palettes.hide();
            } else {
                if (chartBitmap != null) {
                    stage.removeChild(chartBitmap);
                    chartBitmap = null;
                }
                logo.showBlocks();
                palettes.show();
                palettes.bringToTop();
            }

            // Combine block and palette visibility into one button.
            // _changePaletteVisibility();
        };

        function _toggleCollapsibleStacks() {
            if (blocks.visible) {
                console.log('calling toggleCollapsibles');
                blocks.toggleCollapsibles();
            }
        };

        function onStopTurtle() {
            // TODO: plugin support
            if (stopTurtleContainer.visible) {
                _hideStopButton();
            }
        };

        function onRunTurtle() {
            // TODO: plugin support
            // If the stop button is hidden, show it.
            if (!stopTurtleContainer.visible) {
                _showStopButton();
            }
        };

        function refreshCanvas() {
            update = true;
        };

        function __tick(event) {
            // This set makes it so the stage only re-renders when an
            // event handler indicates a change has happened.
            if (update) {
                update = false; // Only update once
                stage.update(event);
            }
        };

        function _doOpenSamples() {
            if (_THIS_IS_MUSIC_BLOCKS_) {
                localStorage.setItem('isMatrixHidden', docById('ptmDiv').style.visibility);
                localStorage.setItem('isStaircaseHidden', docById('pscDiv').style.visibility);
                localStorage.setItem('isPitchDrumMatrixHidden', docById('pdmDiv').style.visibility);
                localStorage.setItem('isRhythmRulerHidden', docById('rulerDiv').style.visibility);
                localStorage.setItem('isModeWidgetHidden', docById('modeDiv').style.visibility);
                localStorage.setItem('isSliderHidden', docById('sliderDiv').style.visibility);
                localStorage.setItem('isTempoHidden', docById('tempoDiv').style.visibility);

                if (docById('ptmDiv').style.visibility !== 'hidden') {
                    docById('ptmDiv').style.visibility = 'hidden';
                    docById('ptmTableDiv').style.visibility = 'hidden';
                    docById('ptmButtonsDiv').style.visibility = 'hidden';
                }

                if (docById('pdmDiv').style.visibility !== 'hidden') {
                    docById('pdmDiv').style.visibility = 'hidden';
                    docById('pdmButtonsDiv').style.visibility = 'hidden';
                    docById('pdmTableDiv').style.visibility = 'hidden';
                }

                if (docById('rulerDiv').style.visibility !== 'hidden') {
                    docById('rulerDiv').style.visibility = 'hidden';
                    docById('rulerTableDiv').style.visibility = 'hidden';
                    docById('rulerButtonsDiv').style.visibility = 'hidden';
                }

                if (docById('pscDiv').style.visibility !== 'hidden') {
                    docById('pscDiv').style.visibility = 'hidden';
                    docById('pscTableDiv').style.visibility = 'hidden';
                    docById('pscButtonsDiv').style.visibility = 'hidden';
                }

                if (docById('statusDiv').style.visibility !== 'hidden') {
                    docById('statusDiv').style.visibility = 'hidden';
                    docById('statusButtonsDiv').style.visibility = 'hidden';
                    docById('statusTableDiv').style.visibility = 'hidden';
                }

                if (docById('sliderDiv').style.visibility !== 'hidden') {
                    docById('sliderDiv').style.visibility = 'hidden';
                    docById('sliderButtonsDiv').style.visibility = 'hidden';
                    docById('sliderTableDiv').style.visibility = 'hidden';
                }

                if (docById('modeDiv').style.visibility !== 'hidden') {
                    docById('modeDiv').style.visibility = 'hidden';
                    docById('modeButtonsDiv').style.visibility = 'hidden';
                    docById('modeTableDiv').style.visibility = 'hidden';
                }

                if (docById('tempoDiv').style.visibility !== 'hidden') {
                    if (logo.tempo != null) {
                        logo.tempo.hide();
                    }
                }
            }

            localStorage.setItem('isStatusHidden', docById('statusDiv').style.visibility);

            logo.doStopTurtle();
            helpContainer.visible = false;
            docById('helpElem').style.visibility = 'hidden';
            console.log('save locally');
            saveLocally();
            thumbnails.show()
        };

        function doSave() {
            // if (_THIS_IS_MUSIC_BLOCKS_) {
            //     console.log('Saving .tb file');
            //     var name = 'My Project';
            //     download(name + '.tb', 'data:text/plain;charset=utf-8,' + prepareExport());
            // } else {
                saveBox.init(turtleBlocksScale, saveButton.x - 27, saveButton.y - 97, _makeButton);
            // }
        };

        function doSaveTB() {
            var filename = prompt('Filename:', 'untitled.tb');  // default filename = untitled
            if (filename != null) {
                if (fileExt(filename) !== 'tb') {
                    filename += '.tb';
                }
                download(filename, 'data:text/plain;charset=utf-8,' + encodeURIComponent(prepareExport()));
            }
        };

        function doSaveSVG() {
            var filename = prompt('Filename:', 'untitled.svg');
            if (filename != null) {
                if (fileExt(filename) !== 'svg') {
                    filename += '.svg';
                }
                var svg = doSVG(logo.canvas, logo, logo.turtles, logo.canvas.width, logo.canvas.height, 1.0);
                download(filename, 'data:image/svg+xml;utf8,' + svg, filename, '"width=' + logo.canvas.width + ', height=' + logo.canvas.height + '"');
            }
        };

        function doSaveBlockArtwork() {
            _printBlockSVG();
        };

        function doSavePNG() {
            alert("Unavailable at the moment");
            //var filename = prompt('Filename:', 'untitled.png');
            //if (fileExt(filename) !== 'png') {
            //    filename += '.png';
            //}
            //download(filename, 'data:text/plain;charset=utf-8,' + encodeURIComponent(prepareExport()));
        };

        function doUploadToPlanet() {
            saveLocally();
            thumbnails.show()
        };

        function doShareOnFacebook() {
            alert("Facebook Sharing : disabled");    // remove when add fb share link
            // add code for facebook share link
        };

        function doLoad() {
            console.log('Loading .tb file');
            document.querySelector('#myOpenFile').focus();
            document.querySelector('#myOpenFile').click();
            window.scroll(0, 0);
        };

        function doSaveLilypond() {
            _doLilypond();
        };

        function _doLilypond() {
            // Show busy cursor.
            document.body.style.cursor = 'wait';

            console.log('Saving .ly file');
            // Suppress music and turtle output when generating
            // Lilypond output.
            logo.runningLilypond = true;
            logo.notationOutput = LILYPONDHEADER;
            logo.notationNotes = {};
            for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                logo.notationStaging[turtle] = [];
                turtles.turtleList[turtle].doClear(true, true, true);
            }

            logo.runLogoCommands();
        };

        function doSaveAbc() {
            _doAbc();
        };

        function _doAbc() {
            // Show busy cursor.
            document.body.style.cursor = 'wait';

            console.log('Saving .ly file');
            // Suppress music and turtle output when generating
            // Abc output.
            logo.runningLilypond = true;
            logo.notationOutput = ABCHEADER;
            logo.notationNotes = {};
            for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                logo.notationStaging[turtle] = [];
                turtles.turtleList[turtle].doClear(true, true, true);
            }

            logo.runLogoCommands();
        };

        window.prepareExport = prepareExport;
        window.saveLocally = saveLocally;

        function saveLocally() {
            if (sugarizerCompatibility.isInsideSugarizer()) {
                //sugarizerCompatibility.data.blocks = prepareExport();
                storage = sugarizerCompatibility.data;
            } else {
                storage = localStorage;
            }

            console.log('overwriting session data');

            if (storage.currentProject === undefined) {
                try {
                    storage.currentProject = 'My Project';
                    storage.allProjects = JSON.stringify(['My Project'])
                } catch (e) {
                    // Edge case, eg. Firefox localSorage DB corrupted
                    console.log(e);
                }
            }

            try {
                var p = storage.currentProject;
                storage['SESSION' + p] = prepareExport();
            } catch (e) {
                console.log(e);
            }

            // if (isSVGEmpty(turtles)) {
                // We will use the music icon in these cases.
                // return;
            // }

            var img = new Image();
            var svgData = doSVG(canvas, logo, turtles, 320, 240, 320 / canvas.width);
            img.onload = function () {
                var bitmap = new createjs.Bitmap(img);
                var bounds = bitmap.getBounds();
                bitmap.cache(bounds.x, bounds.y, bounds.width, bounds.height);
                try {
                    storage['SESSIONIMAGE' + p] = bitmap.getCacheDataURL();
                } catch (e) {
                    console.log(e);
                }
            };

            img.src = 'data:image/svg+xml;base64,' +
            window.btoa(unescape(encodeURIComponent(svgData)));
            // console.log(img.src);
            if (sugarizerCompatibility.isInsideSugarizer()) {
                sugarizerCompatibility.saveLocally();
            }
        };

        function runProject (env) {
            console.log("Running Project from Event");
            document.removeEventListener("finishedLoading", runProject);
            setTimeout(function () {
                console.log("Run");
                _changeBlockVisibility();
                _doFastButton(env);
            }, 5000);
        }

        function loadProject (projectName, run, env) {
            //set default value of run
            run = typeof run !== 'undefined' ? run : false;
            // Show busy cursor.
            document.body.style.cursor = 'wait';
            // palettes.updatePalettes();
            setTimeout(function () {
                if (fileExt(projectName) !== 'tb')
                {
                    projectName += '.tb';
                }

                try {
                    try {
                        httpGet(null);
                        console.log('running from server or the user can access to examples.');
                        server = true;
                    } catch (e) {
                        console.log('running from filesystem or the connection isnt secure');
                        server = false;
                    }

                    if (server) {
                        var rawData = httpGet(projectName);
                        var cleanData = rawData.replace('\n', '');
                    }

                    // First, hide the palettes as they will need updating.
                    for (var name in blocks.palettes.dict) {
                        blocks.palettes.dict[name].hideMenu(true);
                    }

                    var obj = JSON.parse(cleanData);
                    blocks.loadNewBlocks(obj);
                    saveLocally();
                } catch (e) {
                    console.log(e);
                    loadStartWrapper(_loadStart);
                }

                // Restore default cursor
                document.body.style.cursor = 'default';
                update = true;
            }, 200);

            if (run && firstRun) {
                if (document.addEventListener) {
                    document.addEventListener('finishedLoading', function () {
                        setTimeout(function () {
                            for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                                turtles.turtleList[turtle].doClear(true, true, false);
                            }
                            runProject(env);
                        }, 1000);
                    }, false);
                } else {
                    document.attachEvent('finishedLoading', function () {
                        setTimeout(function () {
                            for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                                turtles.turtleList[turtle].doClear(true, true, false);
                            }
                            runProject(env);
                        }, 1000);
                    });
                }
            }

            firstRun = false;
        };

        function loadRawProject(data) {
            if (data == undefined) {
                console.log('loadRawProject: data is undefined... punting');
                errorMsg('loadRawProject: project undefined');
                return;
            }

            console.log('loadRawProject ' + data);
            document.body.style.cursor = 'wait';
            _allClear();

            // First, hide the palettes as they will need updating.
            for (var name in blocks.palettes.dict) {
                blocks.palettes.dict[name].hideMenu(true);
            }

            try {
                var obj = JSON.parse(data);
                blocks.loadNewBlocks(obj);
            } catch (e) {
                console.log('loadRawProject: could not parse project data');
                errorMsg(e);
            }

            document.body.style.cursor = 'default';
        };

        function saveProject(projectName) {
           // palettes.updatePalettes();
            // Show busy cursor.
            document.body.style.cursor = 'wait';
            setTimeout(function () {
                var punctuationless = projectName.replace(/['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^`{|}~']/g, '');
                projectName = punctuationless.replace(/ /g, '_');
                if (fileExt(projectName) !== 'tb') {
                    projectName += '.tb';
                }
                try {
                    // Post the project
                    var returnValue = httpPost('MusicBlocks_'+projectName, prepareExport());
                    errorMsg('Saved ' + projectName + ' to ' + window.location.host);

                    var img = new Image();
                    var svgData = doSVG(canvas, logo, turtles, 320, 240, 320 / canvas.width);
                    img.onload = function () {
                        var bitmap = new createjs.Bitmap(img);
                        var bounds = bitmap.getBounds();
                        bitmap.cache(bounds.x, bounds.y, bounds.width, bounds.height);
                        // and base64-encoded png
                        httpPost(('MusicBlocks_'+projectName).replace('.tb', '.b64'), bitmap.getCacheDataURL());
                    };

                    img.src = 'data:image/svg+xml;base64,' + window.btoa(
                        unescape(encodeURIComponent(svgData)));
                    // Restore default cursor
                    document.body.style.cursor = 'default';
                    return returnValue;
                } catch (e) {
                    console.log(e);
                    // Restore default cursor
                    document.body.style.cursor = 'default';
                    return;
                }
            }, 200);
        };

        // Calculate time such that no matter how long it takes to
        // load the program, the loading animation will cycle at least
        // once.
        function loadStartWrapper(func, arg1, arg2, arg3) {
            var time1 = new Date();
            func(arg1, arg2, arg3);

            var time2 = new Date();
            var elapsedTime = time2.getTime() - time1.getTime();
            var timeLeft = Math.max(6000 - elapsedTime);
            setTimeout(showContents, timeLeft);
        };

        // Hides the loading animation and unhides the background.
        function showContents(){
            docById('loading-image-container').style.display = 'none';
            // docById('canvas').style.display = 'none';
            docById('hideContents').style.display = 'block';
        };

        function _loadStart() {
            // where to put this?
            // palettes.updatePalettes();
            console.log('LOAD START')
            justLoadStart = function () {
                console.log('loading start and a matrix');
                blocks.loadNewBlocks(DATAOBJS);
            };

            if (sugarizerCompatibility.isInsideSugarizer()) {
                storage = sugarizerCompatibility.data;
            }
            else {
                storage = localStorage;
            }

            sessionData = null;

            // Try restarting where we were when we hit save.
            var currentProject = storage.currentProject;
            sessionData = storage['SESSION' + currentProject];

            // After we have finished loading the project, clear all
            // to ensure a clean start.
            if (document.addEventListener) {
                document.addEventListener('finishedLoading', function () {
                    setTimeout(function () {
                        for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                            logo.turtleHeaps[turtle] = [];
                            logo.notationStaging[turtle] = [];
                            turtles.turtleList[turtle].doClear(true, true, false);
                        }
                    }, 1000);
                });
            } else {
                document.attachEvent('finishedLoading', function () {
                    setTimeout(function () {
                        for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                            logo.turtleHeaps[turtle] = [];
                            logo.notationStaging[turtle] = [];
                            turtles.turtleList[turtle].doClear(true, true, false);
                        }
                    }, 1000);
                });
            }

            if (sessionData) {
                try {
                    if (sessionData === 'undefined' || sessionData === '[]') {
                        console.log('empty session found: loading start');
                        justLoadStart();
                    } else {
                        console.log('restoring session: ' + sessionData);
                        // First, hide the palettes as they will need updating.
                        for (var name in blocks.palettes.dict) {
                            blocks.palettes.dict[name].hideMenu(true);
                        }

                        blocks.loadNewBlocks(JSON.parse(sessionData));
                    }
                } catch (e) {
                    console.log(e);
                }
            } else {
                justLoadStart();
            }

            update = true;
        };

        function hideMsgs() {
            errorMsgText.parent.visible = false;
            if (errorMsgArrow != null) {
                errorMsgArrow.removeAllChildren();
                refreshCanvas();
            }

            msgText.parent.visible = false;
            for (var i in errorArtwork) {
                errorArtwork[i].visible = false;
            }
        };

        function textMsg(msg) {
            if (msgText == null) {
                // The container may not be ready yet... so do nothing
                return;
            }
            var msgContainer = msgText.parent;
            msgContainer.visible = true;
            msgText.text = msg;
            msgContainer.updateCache();
            stage.setChildIndex(msgContainer, stage.getNumChildren() - 1);
        };

        function errorMsg(msg, blk, text) {
             _hideStopButton(); //Hide the button, as the program is going to be terminated
            if (errorMsgText == null) {
                // The container may not be ready yet... so do nothing
                return;
            }
            if (blk !== undefined && blk != null && !blocks.blockList[blk].collapsed) {
                var fromX = (canvas.width - 1000) / 2;
                var fromY = 128;
                var toX = blocks.blockList[blk].container.x + blocksContainer.x;
                var toY = blocks.blockList[blk].container.y + blocksContainer.y;

                if (errorMsgArrow == null) {
                    errorMsgArrow = new createjs.Container();
                    stage.addChild(errorMsgArrow);
                }

                var line = new createjs.Shape();
                errorMsgArrow.addChild(line);
                line.graphics.setStrokeStyle(4).beginStroke('#ff0031').moveTo(fromX, fromY).lineTo(toX, toY);
                stage.setChildIndex(errorMsgArrow, stage.getNumChildren() - 1);

                var angle = Math.atan2(toX - fromX, fromY - toY) / Math.PI * 180;
                var head = new createjs.Shape();
                errorMsgArrow.addChild(head);
                head.graphics.setStrokeStyle(4).beginStroke('#ff0031').moveTo(-10, 18).lineTo(0, 0).lineTo(10, 18);
                head.x = toX;
                head.y = toY;
                head.rotation = angle;
            }

            switch (msg) {
            case NOMICERRORMSG:
                errorArtwork['nomicrophone'].visible = true;
                stage.setChildIndex(errorArtwork['nomicrophone'], stage.getNumChildren() - 1);
                break;
            case NOSTRINGERRORMSG:
                errorArtwork['notastring'].visible = true;
                stage.setChildIndex(errorArtwork['notastring'], stage.getNumChildren() - 1);
                break;
            case EMPTYHEAPERRORMSG:
                errorArtwork['emptyheap'].visible = true;
                stage.setChildIndex(errorArtwork['emptyheap'], stage.getNumChildren() - 1);
                break;
            case NOSQRTERRORMSG:
                errorArtwork['negroot'].visible = true;
                stage.setChildIndex(errorArtwork['negroot'], stage.getNumChildren() - 1);
                break;
            case NOACTIONERRORMSG:
                if (text == null) {
                    text = 'foo';
                }
                errorArtwork['nostack'].children[1].text = text;
                errorArtwork['nostack'].visible = true;
                errorArtwork['nostack'].updateCache();
                stage.setChildIndex(errorArtwork['nostack'], stage.getNumChildren() - 1);
                break;
            case NOBOXERRORMSG:
                if (text == null) {
                    text = 'foo';
                }
                errorArtwork['emptybox'].children[1].text = text;
                errorArtwork['emptybox'].visible = true;
                errorArtwork['emptybox'].updateCache();
                stage.setChildIndex(errorArtwork['emptybox'], stage.getNumChildren() - 1);
                break;
            case ZERODIVIDEERRORMSG:
                errorArtwork['zerodivide'].visible = true;
                stage.setChildIndex(errorArtwork['zerodivide'], stage.getNumChildren() - 1);
                break;
              case NANERRORMSG:
                errorArtwork['notanumber'].visible = true;
                stage.setChildIndex(errorArtwork['notanumber'], stage.getNumChildren() - 1);
                break;
            case NOINPUTERRORMSG:
                errorArtwork['noinput'].visible = true;
                stage.setChildIndex(errorArtwork['noinput'], stage.getNumChildren() - 1);
                break;
            default:
                var errorMsgContainer = errorMsgText.parent;
                errorMsgContainer.visible = true;
                errorMsgText.text = msg;
                stage.setChildIndex(errorMsgContainer, stage.getNumChildren() - 1);
                errorMsgContainer.updateCache();
                break;
            }

            update = true;
        };

        function _hideCartesian() {
            cartesianBitmap.visible = false;
            cartesianBitmap.updateCache();
            update = true;
        };

        function _showCartesian() {
            cartesianBitmap.visible = true;
            cartesianBitmap.updateCache();
            update = true;
        };

        function _hidePolar() {
            polarBitmap.visible = false;
            polarBitmap.updateCache();
            update = true;
        };

        function _showPolar() {
            polarBitmap.visible = true;
            polarBitmap.updateCache();
            update = true;
        };

        function pasteStack() {
            blocks.pasteStack();
        };

        function prepareExport() {
            // We don't save blocks in the trash, so we need to
            // consolidate the block list and remap the connections.
            var blockMap = [];
            var hasMatrixDataBlock = false;
            for (var blk = 0; blk < blocks.blockList.length; blk++) {
                var myBlock = blocks.blockList[blk];
                if (myBlock.trash) {
                    // Don't save blocks in the trash.
                    continue;
                }
                blockMap.push(blk);
            }

            var data = [];
            for (var blk = 0; blk < blocks.blockList.length; blk++) {
                var myBlock = blocks.blockList[blk];
                if (myBlock.trash) {
                    // Don't save blocks in the trash.
                    continue;
                }

                if (myBlock.isValueBlock() || myBlock.name === 'loadFile') {
                    // FIX ME: scale image if it exceeds a maximum size.
                    var args = {
                        'value': myBlock.value
                    };
                } else if (myBlock.name === 'start' || myBlock.name === 'drum') {
                    // Find the turtle associated with this block.
                    var turtle = turtles.turtleList[myBlock.value];
                    if (turtle == null) {
                        var args = {
                            'collapsed': false,
                            'xcor': 0,
                            'ycor': 0,
                            'heading': 0,
                            'color': 0,
                            'shade': 50,
                            'pensize': 5,
                            'grey': 100
                        };
                    } else {
                        var args = {
                            'collapsed': myBlock.collapsed,
                            'xcor': turtle.x,
                            'ycor': turtle.y,
                            'heading': turtle.orientation,
                            'color': turtle.color,
                            'shade': turtle.value,
                            'pensize': turtle.stroke,
                            'grey': turtle.chroma
                        };
                    }
                } else if (myBlock.name === 'action') {
                    var args = {
                        'collapsed': myBlock.collapsed
                    }
                } else if(myBlock.name === 'matrix') {
                    var args = {
                        'collapsed' : myBlock.collapsed
                    }
                } else if(myBlock.name === 'pitchdrummatrix') {
                    var args = {
                        'collapsed' : myBlock.collapsed
                    }
                } else if(myBlock.name === 'status') {
                    var args = {
                        'collapsed' : myBlock.collapsed
                    }
                } else if (myBlock.name === 'namedbox') {
                    var args = {
                        'value': myBlock.privateData
                    }
                } else if (myBlock.name === 'nameddo') {
                    var args = {
                        'value': myBlock.privateData
                    }
                } else if (myBlock.name === 'nameddoArg') {
                    var args = {
                        'value': myBlock.privateData
                    }
                } else if (myBlock.name === 'namedcalc') {
                    var args = {
                        'value': myBlock.privateData
                    }
                } else if (myBlock.name === 'namedcalcArg') {
                    var args = {
                        'value': myBlock.privateData
                    }
                } else if (myBlock.name === 'namedarg') {
                    var args = {
                        'value': myBlock.privateData
                    }
                } else if (myBlock.name === 'matrixData') {
                    var args = {
                        'notes': window.savedMatricesNotes, 'count': window.savedMatricesCount
                    }
                    hasMatrixDataBlock = true;
                } else {
                    var args = {}
                }

                connections = [];
                for (var c = 0; c < myBlock.connections.length; c++) {
                    var mapConnection = blockMap.indexOf(myBlock.connections[c]);
                    if (myBlock.connections[c] == null || mapConnection === -1) {
                        connections.push(null);
                    } else {
                        connections.push(mapConnection);
                    }
                }
                data.push([blockMap.indexOf(blk), [myBlock.name, args], myBlock.container.x, myBlock.container.y, connections]);
            }

            return JSON.stringify(data);
        };

        function doOpenPlugin() {
            // Click on the plugin open chooser in the DOM (.json).
            pluginChooser.focus();
            pluginChooser.click();
        };

        function saveToFile() {
            var filename = prompt('Filename:');
            if (fileExt(filename) !== 'tb') {
                filename += '.tb';
            }
            download(filename, 'data:text/plain;charset=utf-8,' + encodeURIComponent(prepareExport()));
        };

        function _hideStopButton() {
            stopTurtleContainer.visible = false;
        };

        function _showStopButton() {
            // stopTurtleContainer.x = onscreenButtons[0].x;
            // stopTurtleContainer.y = onscreenButtons[0].y;
            stopTurtleContainer.visible = true;
        };

        function blinkPasteButton(bitmap) {
            function handleComplete() {
                createjs.Tween.get(bitmap).to({alpha:1, visible:true}, 500);
            };

            createjs.Tween.get(bitmap).to({alpha:0, visible:false}, 1000).call(
handleComplete);
        };

        function updatePasteButton() {
            if (pasteImage === null) {

                var img = new Image();

                img.onload = function () {
                    var originalSize = 55; // this is the original svg size
                    var halfSize = Math.floor(cellSize / 2);

                    var bitmap = new createjs.Bitmap(img);
                    if (cellSize !== originalSize) {
                        bitmap.scaleX = cellSize / originalSize;
                        bitmap.scaleY = cellSize / originalSize;
                    }
                    bitmap.regX = halfSize / bitmap.scaleX;
                    bitmap.regY = halfSize / bitmap.scaleY;
                    pasteContainer.addChild(bitmap);
                    pasteImage = bitmap;

                    update = true;
                };

                img.src = 'header-icons/paste-button.svg';
            } else {
                blinkPasteButton(pasteImage);
            }
        };

        function _setupAndroidToolbar(showPalettesPopover) {
            if (headerContainer !== undefined) {
                stage.removeChild(headerContainer);
                for (var i in onscreenButtons) {
                    stage.removeChild(onscreenButtons[i]);
                }
            }

            headerContainer = new createjs.Shape();
            headerContainer.graphics.f(platformColor.header).r(0, 0, screen.width / turtleBlocksScale, cellSize);

            if (platformColor.doHeaderShadow) {
                headerContainer.shadow = new createjs.Shadow('#777', 0, 2, 2);
            }

            stage.addChild(headerContainer);

            // Buttons used when running turtle programs
            // name / onpress function / label / onlongpress function / onextralongpress function / onlongpress icon / onextralongpress icon
            if (_THIS_IS_MUSIC_BLOCKS_) {
                var buttonNames = [
                    ['run', _doFastButton, _('Run fast / long press to run slowly / extra-long press to run music slowly'), _doSlowButton, _doSlowMusicButton, 'slow-button', 'slow-music-button'],
                    ['step', _doStepButton, _('Run step by step'), null, null, null, null],
                    ['step-music', _doStepMusicButton, _('Run note by note'), null, null, null, null],
                    ['stop-turtle', doStopButton, _('Stop'), null, null, null, null],
                    ['clear', _allClear, _('Clean'), null, null, null, null],
                    // ['palette', _changePaletteVisibility, _('Show/hide palettes'), null, null, null, null],
                    ['hide-blocks', _changeBlockVisibility, _('Show/hide blocks'), null, null, null, null],
                    ['collapse-blocks', _toggleCollapsibleStacks, _('Expand/collapse collapsable blocks'), null, null, null, null],
                    ['go-home', _findBlocks, _('Home'), null, null, null, null],
                    ['help', _showHelp, _('Help'), null, null, null, null]
                ];
            } else {
                var buttonNames = [
                    ['run', _doFastButton, _('Run fast / long press to run slowly'), _doSlowButton, null, 'slow-button', null],
                    ['step', _doStepButton, _('Run step by step'), null, null, null, null],
                    ['stop-turtle', doStopButton, _('Stop'), null, null, null, null],
                    ['clear', _allClear, _('Clean'), null, null, null, null],
                    ['hide-blocks', _changeBlockVisibility, _('Show/hide blocks'), null, null, null, null],
                    ['collapse-blocks', _toggleCollapsibleStacks, _('Expand/collapse collapsable blocks'), null, null, null, null],
                    ['go-home', _findBlocks, _('Home'), null, null, null, null],
                    ['help', _showHelp, _('Help'), null, null, null, null]
                ];
            }

            if (sugarizerCompatibility.isInsideSugarizer()) {
                buttonNames.push(['sugarizer-stop', function () {
                    sugarizerCompatibility.data.blocks = prepareExport();
                    sugarizerCompatibility.saveLocally(function () {
                        sugarizerCompatibility.sugarizerStop();
                    });
                }])
            }

            if (showPalettesPopover) {
                buttonNames.unshift(['popdown-palette', doPopdownPalette])
            }

            var btnSize = cellSize;
            var x = Math.floor(btnSize / 2);
            var y = x;
            var dx = btnSize;
            var dy = 0;

            for (var i = 0; i < buttonNames.length; i++) {
                if (!getMainToolbarButtonNames(buttonNames[i][0])) {
                    console.log('continue');
                    continue;
                }

                var container = _makeButton(buttonNames[i][0] + '-button', buttonNames[i][2], x, y, btnSize, 0);
                _loadButtonDragHandler(container, x, y, buttonNames[i][1], buttonNames[i][3], buttonNames[i][4], buttonNames[i][5], buttonNames[i][6]);
                onscreenButtons.push(container);

                if (buttonNames[i][0] === 'stop-turtle') {
                    stopTurtleContainer = container;
                } else if (buttonNames[i][0] === 'go-home') {
                    homeButtonContainers = [];
                    homeButtonContainers.push(container);
                    var container2 = _makeButton('go-home-faded-button', _('Home'), x, y, btnSize, 0);
                    _loadButtonDragHandler(container2, x, y, buttonNames[i][1], null, null, null, null);
                    homeButtonContainers.push(container2);
                    onscreenButtons.push(container2);
                    homeButtonContainers[0].visible = false;
                    homeButtonContainers[1].visible = true;
                    boundary.hide();
                    blocks.setHomeContainers(homeButtonContainers, boundary);
                }

                x += dx;
                y += dy;
            }

            _setupRightMenu(turtleBlocksScale);
        };

        function _setupRightMenu(turtleBlocksScale) {
            if (menuContainer !== undefined) {
                stage.removeChild(menuContainer);
                for (var i in onscreenMenu) {
                    stage.removeChild(onscreenMenu[i]);
                }
            }

            // Misc. other buttons
            if (_THIS_IS_MUSIC_BLOCKS_) {
                var menuNames = [
                    ['planet', _doOpenSamples, _('Load samples from server')],
                    ['open', doLoad, _('Load project from files')],
                    ['save', doSave, _('Save project')],
                    // ['lilypond', _doLilypond, _('Save sheet music')],
                    ['paste-disabled', pasteStack, _('Paste')],
                    ['Cartesian', _doCartesian, _('Cartesian')],
                    ['polar', _doPolar, _('Polar')],
                    ['utility', _doUtilityBox, _('Settings')],
                    ['empty-trash', _deleteBlocksBox, _('Delete all')],
                    ['restore-trash', _restoreTrash, _('Undo')]
                ];
            } else {
                var menuNames = [
                    ['planet', _doOpenSamples, _('Load samples from server')],
                    ['open', doLoad, _('Load project from files')],
                    ['save', doSave, _('Save project')],
                    ['paste-disabled', pasteStack, _('Paste')],
                    ['Cartesian', _doCartesian, _('Cartesian')],
                    ['polar', _doPolar, _('Polar')],
                    ['utility', _doUtilityBox, _('Settings')],
                    ['empty-trash', _deleteBlocksBox, _('Delete all')],
                    ['restore-trash', _restoreTrash, _('Undo')]
                ];
            }

            document.querySelector('#myOpenFile')
                    .addEventListener('change', function (event) {
                        thumbnails.model.controller.hide();
            });

            var btnSize = cellSize;
            var x = Math.floor(canvas.width / turtleBlocksScale) - btnSize / 2;
            var y = Math.floor(btnSize / 2);

            var dx = 0;
            var dy = btnSize;

            menuContainer = _makeButton('menu-button', '', x, y, btnSize, menuButtonsVisible ? 90 : undefined);
            _loadButtonDragHandler(menuContainer, x, y, _doMenuButton, null, null, null, null);

            for (var i = 0; i < menuNames.length; i++) {
                if (!getAuxToolbarButtonNames(menuNames[i][0])) {
                    continue;
                }

                x += dx;
                y += dy;
                var container = _makeButton(menuNames[i][0] + '-button', menuNames[i][2], x, y, btnSize, 0);
                _loadButtonDragHandler(container, x, y, menuNames[i][1], null, null, null, null);
                onscreenMenu.push(container);
                if (menuNames[i][0] === 'utility') {
                    utilityButton = container;
                } else if (menuNames[i][0] === 'save') {
                    saveButton = container;
                }

                container.visible = false;
            }

            if (menuButtonsVisible) {
                for (var button in onscreenMenu) {
                    onscreenMenu[button].visible = true;
                }
            }
        };

        function doPopdownPalette() {
            console.log('doPopdownPalette');
            var p = new PopdownPalette(palettes);
            p.popdown();
        };

        function _showHelp(firstTime) {
            helpIdx = 0;

            if (firstTime) {
                if (helpContainer == null) {
                    helpContainer = new createjs.Container();
                    stage.addChild(helpContainer);
                    helpContainer.x = 65;
                    helpContainer.y = 65;

                    helpContainer.on('click', function (event) {
                        var bounds = helpContainer.getBounds();
                        if (event.stageY < helpContainer.y + bounds.height / 2) {
                            helpContainer.visible = false;
                            docById('helpElem').style.visibility = 'hidden';
                        } else {
                            helpIdx += 1;
                            if (helpIdx >= HELPCONTENT.length) {
                                helpIdx = 0;
                            }
                            var imageScale = 55 * turtleBlocksScale;
                            helpElem.innerHTML = '<img src ="' + HELPCONTENT[helpIdx][2] + '" style="height:' + imageScale + 'px; width: auto"></img> <h2>' + HELPCONTENT[helpIdx][0] + '</h2><p>' + HELPCONTENT[helpIdx][1] + '</p>';
                        }
                        update = true;
                    });

                    var img = new Image();
                    img.onload = function () {
                        console.log(turtleBlocksScale);
                        var bitmap = new createjs.Bitmap(img);
                        /*
                        if (turtleBlocksScale > 1) {
                            bitmap.scaleX = bitmap.scaleY = bitmap.scale = turtleBlocksScale;
                        } else {
                            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 1.125;
                        }
                        */
                        if (helpContainer.children.length > 0) {
                            console.log('delete old help container');
                            helpContainer.removeChild(helpContainer.children[0]);
                        }
                        helpContainer.addChild(bitmap)

                        var bounds = helpContainer.getBounds();
                        var hitArea = new createjs.Shape();
                        hitArea.graphics.beginFill('#FFF').drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
                        hitArea.x = 0;
                        hitArea.y = 0;
                        helpContainer.hitArea = hitArea;

                        docById('helpElem').innerHTML = '<img src ="' + HELPCONTENT[helpIdx][2] + '"</img> <h2>' + HELPCONTENT[helpIdx][0] + '</h2><p>' + HELPCONTENT[helpIdx][1] + '</p>';
                        if (!doneTour) {
                            docById('helpElem').style.visibility = 'visible';
                        }
                        update = true;
                    };

                    img.src = 'images/help-container.svg';
                }

                var helpElem = docById('helpElem');
                helpElem.style.position = 'absolute';
                helpElem.style.display = 'block';
                helpElem.style.paddingLeft = 20 * turtleBlocksScale + 'px';
                helpElem.style.paddingRight = 20 * turtleBlocksScale + 'px';
                helpElem.style.paddingTop = '0px';
                helpElem.style.paddingBottom = 20 * turtleBlocksScale + 'px';
                helpElem.style.fontSize = 20 + 'px'; //  * turtleBlocksScale + 'px';
                helpElem.style.color = '#000000';  // '#ffffff';
                helpElem.style.left = 65 * turtleBlocksScale + 'px';
                helpElem.style.top = 105 * turtleBlocksScale + 'px';
                var w = Math.min(300, 300); //  * turtleBlocksScale);
                var h = Math.min(300, 300); //  * turtleBlocksScale);
                helpElem.style.width = w + 'px';
                helpElem.style.height = h + 'px';

                if (turtleBlocksScale > 1) {
                    var bitmap = helpContainer.children[0];
                    if (bitmap != undefined) {
                        // bitmap.scaleX = bitmap.scaleY = bitmap.scale = turtleBlocksScale;
                    }
                }

            }

            doneTour = storage.doneTour === 'true';

            if (firstTime && doneTour) {
                docById('helpElem').style.visibility = 'hidden';
                helpContainer.visible = false;
            } else {
                if (sugarizerCompatibility.isInsideSugarizer()) {
                    sugarizerCompatibility.data.doneTour = 'true';
                } else {
                    storage.doneTour = 'true';
                }
                docById('helpElem').innerHTML = '<img src ="' + HELPCONTENT[helpIdx][2] + '"</img> <h2>' + HELPCONTENT[helpIdx][0] + '</h2><p>' + HELPCONTENT[helpIdx][1] + '</p>';
                docById('helpElem').style.visibility = 'visible';
                helpContainer.visible = true;
                update = true;

                // Make sure the palettes and the secondary menus are
                // visible while help is shown.
                palettes.show();
                if (!menuButtonsVisible) {
                    doMenuAnimation(1);
                }
            }
        };

        function _doMenuButton() {
            _doMenuAnimation(1);
        };

        function _doMenuAnimation() {
            var bitmap = last(menuContainer.children);
            if (bitmap != null) {
                var r = bitmap.rotation;
                createjs.Tween.get(bitmap)
                    .to({
                        rotation: r
                    })
                    .to({
                        rotation: r + 90
                    }, 500);
            } else {
                // Race conditions during load
                setTimeout(_doMenuAnimation, 50);
            }

            setTimeout(function () {
                if (menuButtonsVisible) {
                    menuButtonsVisible = false;
                    for (var button in onscreenMenu) {
                        onscreenMenu[button].visible = false;
                    }
                } else {
                    menuButtonsVisible = true;
                    for (var button in onscreenMenu) {
                        onscreenMenu[button].visible = true;
                    }
                }
                update = true;
            }, 500);
        };

        function _toggleToolbar() {
            buttonsVisible = !buttonsVisible;
            menuContainer.visible = buttonsVisible;
            headerContainer.visible = buttonsVisible;
            for (var button in onscreenButtons) {
                onscreenButtons[button].visible = buttonsVisible;
            }

            for (var button in onscreenMenu) {
                onscreenMenu[button].visible = buttonsVisible;
            }

            update = true;
        };

        function _makeButton(name, label, x, y, size, rotation, parent) {
            var container = new createjs.Container();
            if (name === 'paste-disabled-button') {
                pasteContainer = container;
            }

            if (parent == undefined) {
                stage.addChild(container);
            } else {
                parent.addChild(container);
            }

            container.x = x;
            container.y = y;

            var text = new createjs.Text(label, '14px Sans', '#282828');
            if (container.y < 55) {
                if (container.x < 55) {
                    text.textAlign = 'left';
                    text.x = -14;
                } else {
                    text.textAlign = 'center';
                    text.x = 0;
                }
                text.y = 30;
            } else {
                text.textAlign = 'right';
                text.x = -28;
                text.y = 0;
            }

            text.visible = false;

            container.on('mouseover', function (event) {
                for (var c = 0; c < container.children.length; c++) {
                    if (container.children[c].text != undefined) {
                        container.children[c].visible = true;
                        break;
                    }
                }
            });

            container.on('mouseout', function (event) {
                for (var c = 0; c < container.children.length; c++) {
                    if (container.children[c].text != undefined) {
                        container.children[c].visible = false;
                        break;
                    }
                }
            });

            var img = new Image();

            img.onload = function () {
                var originalSize = 55; // this is the original svg size
                var halfSize = Math.floor(size / 2);

                var bitmap = new createjs.Bitmap(img);
                if (size !== originalSize) {
                    bitmap.scaleX = size / originalSize;
                    bitmap.scaleY = size / originalSize;
                }

                bitmap.regX = halfSize / bitmap.scaleX;
                bitmap.regY = halfSize / bitmap.scaleY;
                if (rotation !== undefined) {
                    bitmap.rotation = rotation;
                }

                container.addChild(bitmap);
                var hitArea = new createjs.Shape();
                hitArea.graphics.beginFill('#FFF').drawEllipse(-halfSize, -halfSize, size, size);
                hitArea.x = 0;
                hitArea.y = 0;
                container.hitArea = hitArea;
                bitmap.cache(0, 0, size, size);
                bitmap.updateCache();
                update = true;
            };

            img.src = 'header-icons/' + name + '.svg';
            container.addChild(text);

            return container;
        };

        function _loadButtonDragHandler(container, ox, oy, action, longAction, extraLongAction, longImg, extraLongImg) {
            // Prevent multiple button presses (i.e., debounce).
            var locked = false;

            if (longAction === null) {
                longAction = action;
            }

            if (extraLongAction === null) {
                extraLongAction = longAction;
            }

            // Long and extra-long press variables declaration
            var pressTimer, pressTimerExtra, isLong = false, isExtraLong = false;
            var formerContainer = container;

            container.on('mousedown', function (event) {
                var moved = true;
                var offset = {
                    x: container.x - Math.round(event.stageX / turtleBlocksScale),
                    y: container.y - Math.round(event.stageY / turtleBlocksScale)
                };

                pressTimer = setTimeout(function () {
                    isLong = true;
                    if (longImg !== null) {
                        container.visible = false;
                        container = _makeButton(longImg, '', ox, oy, cellSize, 0);
                    }
                }, 500);

                pressTimerExtra = setTimeout(function () {
                    isExtraLong = true;
                    if (extraLongImg !== null) {
                        container.visible = false;
                        container = _makeButton(extraLongImg, '', ox, oy, cellSize, 0);
                    }
                }, 1000);

                var circles = showButtonHighlight(ox, oy, cellSize / 2, event, turtleBlocksScale, stage);

                container.on('pressup', function (event) {
                    hideButtonHighlight(circles, stage);
                    container.x = ox;
                    container.y = oy;

                    if (longImg !== null || extraLongImg !== null) {
                        container.visible = false;
                        container = formerContainer;
                        container.visible = true;
                    }

                    if (action != null && moved && !locked) {
                        locked = true;

                        setTimeout(function () {
                            locked = false;
                        }, 500);

                        clearTimeout(pressTimer);
                        clearTimeout(pressTimerExtra);

                        if (!isLong) {
                            action();
                        } else if (!isExtraLong) {
                            longAction();
                        } else {
                            extraLongAction();
                        }
                    }
                    moved = false;
                });

                isLong = false;
                isExtraLong = false;
            });

        };
    };
});
