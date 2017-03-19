// Copyright (c) 2014-16 Walter Bender
// Copyright (c) Yash Khandelwal, GSoC'15
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
if (lang.indexOf("-") !== -1) {
    lang = lang.slice(0, lang.indexOf("-"));
    document.webL10n.setLanguage(lang);
}


// sugarizerCompatibility.ifInsideSugarizerHideLoading();

define(function (require) {
    require("activity/sugarizer-compatibility");
    require('activity/platformstyle');

    require('easeljs');
    require('tweenjs');
    require('preloadjs');
    require('prefixfree.min');
    require('howler');
    require('mespeak');
    require('Chart');
    require('jquery.ruler');
    require('modernizr-2.6.2.min');

    require('activity/utils');

    // Constants used by both Turtle and Music Blocks
    require('activity/artwork');
    require('activity/musicutils');

    require('activity/munsell');
    require('activity/trash');
    require('activity/boundary');
    require('activity/turtle');
    require('activity/palette');
    require('activity/protoblocks');
    require('activity/blocks');
    require('activity/block');
    require('activity/clearbox');
    require('activity/utilitybox');
    require('activity/samplesviewer');
    require('activity/blockfactory');

    // Music Block-specific modules
    require('activity/turtledefs');
    require('activity/lilypond');
    require('activity/status');
    require('activity/modewidget');
    require('activity/logo');
    require('activity/basicblocks');
    require('activity/analytics');
    require('activity/soundsamples');
    require('activity/pitchtimematrix');
    require('activity/pitchdrummatrix');
    require('activity/rhythmruler');
    require('activity/pitchstaircase');
    require('activity/tempo');
    require('activity/pitchslider');
    // Manipulate the DOM only when it is ready.
    require(['domReady!'], function (doc) {
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

        var txt = "";
        txt += "innerWidth: " + window.innerWidth + " ";
        txt += "innerHeight: " + window.innerHeight + " ";
        txt += "outerWidth: " + window.outerWidth + " ";
        txt += "outerHeight: " + window.outerHeight + " ";
        console.log(txt);

        try {
            meSpeak.loadConfig('lib/mespeak_config.json');
            meSpeak.loadVoice('lib/voices/en/en.json');
        } catch (e) {
            console.log(e);
        }

        var canvas = docById('myCanvas');

        var queue = new createjs.LoadQueue(false);

        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            var files = true;
        } else {
            alert('The File APIs are not fully supported in this browser.');
            var files = false;
        }

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
        var toolbarButtonsVisible = true;
        var menuButtonsVisible = true;
        var menuContainer = null;
        var scrollBlockContainer = false;
        var currentKey = '';
        var currentKeyCode = 0;
        var lastKeyCode = 0;
        var pasteContainer = null;
        var pasteImage = null;
        var chartBitmap = null;

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
        var stopTurtleContainerX = 0;
        var stopTurtleContainerY = 0;
        var homeButtonContainers = [];
        var homeButtonContainersX = 0;
        var homeButtonContainersY = 0;

        var cameraID = null;
        var toLang = null;
        var fromLang = null;

        // initial scroll position
        var scrollX = 0;
        var scrollY = 0;

        // default values
        const DEFAULTDELAY = 500; // milleseconds
        const TURTLESTEP = -1; // Run in step-by-step mode

        const BLOCKSCALES = [1, 1.5, 2, 3, 4];
        var blockscale = BLOCKSCALES.indexOf(DEFAULTBLOCKSCALE);
        if (blockscale === -1) {
            blockscale = 1;
        }

        // Time when we hit run
        var time = 0;

        // Used by pause block
        var waitTime = {};

        // Used to track mouse state for mouse button block
        var stageMouseDown = false;
        var stageX = 0;
        var stageY = 0;

        var onXO = (screen.width === 1200 && screen.height === 900) || (screen.width === 900 && screen.height === 1200);
        console.log('on XO? ' + onXO);

        var cellSize = 55;
        if (onXO) {
            cellSize = 75;
        }

        var onscreenButtons = [];
        var onscreenMenu = [];
        var utilityButton = null;

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

        window.onblur = function() {
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
            for (var blk in blocks.blockList) {
                if (!blocks.blockList[blk].trash) {
                    var myBlock = blocks.blockList[blk];
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

        function _allClear() {
            if (chartBitmap != null) {
                stage.removeChild(chartBitmap);
                chartBitmap = null;
            }

            logo.boxes = {};
            logo.time = 0;
            hideMsgs();
            logo.setBackgroundColor(-1);
            logo.lilypondOutput = LILYPONDHEADER;
            for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                logo.turtleHeaps[turtle] = [];
                logo.lilypondStaging[turtle] = [];
                turtles.turtleList[turtle].doClear();
            }

            blocksContainer.x = 0;
            blocksContainer.y = 0;

            // Code specific to cleaning up music blocks
            Element.prototype.remove = function() {
                this.parentElement.removeChild(this);
            };

            NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
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
            if (docById('ptmDiv').style.visibility === 'visible') {
                playingWidget = true;
                matrix.playAll();
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

            // We were using the run button to play a widget, not the turtles.
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
            if (docById('ptmDiv').style.visibility === 'visible') {
                matrix.playAll();
            } else if (!turtles.running()) {
                logo.runLogoCommands();
            } else {
                logo.step();
            }
        };

        function _doStepButton() {
            var turtleCount = 0;
            for (var turtle in logo.stepQueue) {
                turtleCount += 1;
            }

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
                matrix.playAll();
            } else if (!turtles.running()) {
                logo.runLogoCommands();
            } else {
                logo.stepNote();
            }
        };

        function _doStepMusicButton() {
            var turtleCount = 0;
            for (var turtle in logo.stepQueue) {
                turtleCount += 1;
            }

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

        var stopTurtle = false;

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
            this.closeButton.on('click', function(event) {
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

        // The dictionary of action name: block
        var actions = {};

        // The dictionary of box name: value
        var boxes = {};

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

            trashcan = new Trashcan(canvas, trashContainer, cellSize, refreshCanvas);
            turtles = new Turtles(canvas, turtleContainer, refreshCanvas);
            // Put the boundary in the blocks container so it scrolls
            // with the blocks.
            boundary = new Boundary(canvas, blocksContainer, refreshCanvas);
            blocks = new Blocks(canvas, blocksContainer, refreshCanvas, trashcan, stage.update, getStageScale);
            palettes = initPalettes(canvas, refreshCanvas, palettesContainer, cellSize, refreshCanvas, trashcan, blocks);

            matrix = new Matrix();
            pitchdrummatrix = new PitchDrumMatrix();
            rhythmruler = new RhythmRuler();
            pitchstaircase = new PitchStairCase();
            tempo = new Tempo();
            pitchslider = new PitchSlider();

            palettes.setBlocks(blocks);
            turtles.setBlocks(blocks);
            blocks.setTurtles(turtles);
            blocks.setErrorMsg(errorMsg);
            blocks.makeCopyPasteButtons(_makeButton, updatePasteButton);

            // TODO: clean up this mess.
            logo = new Logo(matrix, pitchdrummatrix, rhythmruler, pitchstaircase, tempo, pitchslider, canvas,
                blocks, turtles, turtleContainer, refreshCanvas,
                textMsg, errorMsg, hideMsgs, onStopTurtle,
                onRunTurtle, getStageX, getStageY,
                getStageMouseDown, getCurrentKeyCode,
                clearCurrentKeyCode, meSpeak, saveLocally);
            blocks.setLogo(logo);

            // Set the default background color...
            logo.setBackgroundColor(-1);

            clearBox = new ClearBox(canvas, stage, refreshCanvas, sendAllToTrash);
            utilityBox = new UtilityBox(canvas, stage, refreshCanvas, doBiggerFont, doSmallerFont, doOpenPlugin, doAnalytics, toggleScroller);
            thumbnails = new SamplesViewer(canvas, stage, refreshCanvas, loadProject, loadRawProject, sendAllToTrash);
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
                        var obj = JSON.parse(cleanData);
                        // First, hide the palettes as they will need updating.
                        for (var name in blocks.palettes.dict) {
                            blocks.palettes.dict[name].hideMenu(true);
                        }

                        refreshCanvas();

                        blocks.loadNewBlocks(obj);
                        // Restore default cursor.
                        document.body.style.cursor = 'default';
                    }, 200);
                });

                reader.readAsText(fileChooser.files[0]);
            }, false);

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
                    if (blocks.inLongPress) {
                        blocks.saveStackButton.visible = false;
                        blocks.dismissButton.visible = false;
                        blocks.inLongPress = false;
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
                }, null, true); // once = true
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

            if (docById('BPMInput').classList.contains('hasKeyboard')) {
                return ;
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

            const BACKSPACE = 8;
            const TAB = 9;
            if (event.keyCode === TAB || event.keyCode === BACKSPACE) {
                // Prevent browser from grabbing TAB key
                event.preventDefault();
            }

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
                        blocksContainer.y -= 21;
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
                        blocksContainer.y += 21;
                    }
                    break;
                case KEYCODE_LEFT:
                    if (blocks.activeBlock != null) {
                        blocks.moveStackRelative(blocks.activeBlock, -STANDARDBLOCKHEIGHT / 2, 0);
                        blocks.blockMoved(blocks.activeBlock);
                        blocks.adjustDocks(blocks.activeBlock, true);
                    } else if (scrollBlockContainer) {
                        blocksContainer.x -= 21;
                    }
                    break;
                case KEYCODE_RIGHT:
                    if (blocks.activeBlock != null) {
                        blocks.moveStackRelative(blocks.activeBlock, STANDARDBLOCKHEIGHT / 2, 0);
                        blocks.blockMoved(blocks.activeBlock);
                        blocks.adjustDocks(blocks.activeBlock, true);
                    } else if (scrollBlockContainer) {
                        blocksContainer.x += 21;
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
                    // currentKey = String.fromCharCode(event.keyCode);
                    // currentKeyCode = event.keyCode;
                    break;
                }
                // Always store current key so as not to mask it from
                // the keyboard block.
                currentKey = String.fromCharCode(event.keyCode);
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

            console.log('Resize: scale ' + turtleBlocksScale +
            ', windowW ' + w + ', windowH ' + h +
            ', canvasW ' + canvas.width + ', canvasH ' + canvas.height +
            ', screenW ' + screen.width + ', screenH ' + screen.height);

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
                var tur = turtles.turtleList[turtle];
                tur.clearPenStrokes();
                tur.container.x = tur.turtles.turtleX2screenX(tur.x);
                tur.container.y = tur.turtles.turtleY2screenY(tur.y);
                tur.turtles.refreshCanvas();
            }

            var artcanvas = document.getElementById("overlayCanvas");
            artcanvas.width = w;
            artcanvas.height = h;

            // Music stuff
            if (matrix.isMatrix === 1) {
                matrixTable = document.getElementById("myTable");
                if (matrixTable) {
                    matrixTable.setAttribute("width", w/2 + 'px');
                }
            }
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
            } else {
                if (chartBitmap != null) {
                    stage.removeChild(chartBitmap);
                    chartBitmap = null;
                }
                logo.showBlocks();
            }
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
            localStorage.setItem('isMatrixHidden', document.getElementById('ptmDiv').style.visibility);
            localStorage.setItem('isStaircaseHidden', document.getElementById('pscDiv').style.visibility);
            localStorage.setItem('isPitchDrumMatrixHidden', document.getElementById('pitchdrummatrix').style.visibility);
            localStorage.setItem('isRhythmRulerHidden', document.getElementById('rulerDiv').style.visibility);
            localStorage.setItem('isStatusHidden', document.getElementById('statusmatrix').style.visibility);
            localStorage.setItem('isModeWidgetHidden', document.getElementById('modewidget').style.visibility);
            localStorage.setItem('isSliderHidden', document.getElementById('pitchSliderDiv').style.visibility);
            localStorage.setItem('isTempoHidden', document.getElementById('tempoDiv').style.visibility);

            if (document.getElementById('ptmDiv').style.visibility !== 'hidden') {
                document.getElementById('ptmDiv').style.visibility = 'hidden';
                document.getElementById('ptmTableDiv').style.visibility = 'hidden';
                document.getElementById('ptmButtonsDiv').style.visibility = 'hidden';
            }

            if (document.getElementById('pitchdrummatrix').style.visibility !== 'hidden') {
                document.getElementById('pitchdrummatrix').style.visibility = 'hidden';
                document.getElementById('pitchdrummatrix').style.border = 0;
            }

            if (document.getElementById('rulerDiv').style.visibility !== 'hidden') {
                document.getElementById('rulerDiv').style.visibility = 'hidden';
                document.getElementById('rulerTableDiv').style.visibility = 'hidden';
                document.getElementById('rulerButtonsDiv').style.visibility = 'hidden';
            }

            if (document.getElementById('pscDiv').style.visibility !== 'hidden') {
                document.getElementById('pscDiv').style.visibility = 'hidden';
                document.getElementById('pscTableDiv').style.visibility = 'hidden';
                document.getElementById('pscButtonsDiv').style.visibility = 'hidden';
            }

            if (document.getElementById('statusmatrix').style.visibility !== 'hidden') {
                document.getElementById('statusmatrix').style.visibility = 'hidden';
                document.getElementById('statusmatrix').style.border = 0;
            }

            if (document.getElementById('pitchSliderDiv').style.visibility !== 'hidden') {
                document.getElementById('pitchSliderDiv').style.visibility = 'hidden';
                document.getElementById('moveUpSliderDiv').style.visibility = 'hidden';
                document.getElementById('moveDownSliderDiv').style.visibility = 'hidden';
                document.getElementById('pitchSliderDiv').style.border = 0;
            }

            if (document.getElementById('modewidget').style.visibility !== 'hidden') {
                document.getElementById('modewidget').style.visibility = 'hidden';
                document.getElementById('modewidget').style.border = 0;
            }

            if (document.getElementById('tempoDiv').style.visibility !== 'hidden') {
                document.getElementById('tempoDiv').style.visibility = 'hidden';
                document.getElementById('tempoCanvas').style.visibility = 'hidden';
                document.getElementById('tempoDiv').style.border = 0;
            }

            logo.doStopTurtle();
            helpContainer.visible = false;
            docById('helpElem').style.visibility = 'hidden';
            console.log('save locally');
            saveLocally();
            thumbnails.show()
        };

        function doSave() {
            console.log('Saving .tb file');
            var name = 'My Project';
            download(name + '.tb', 'data:text/plain;charset=utf-8,' + prepareExport());
        };

        function doLoad() {
            console.log('Loading .tb file');
            document.querySelector('#myOpenFile').focus();
            document.querySelector('#myOpenFile').click();
            window.scroll(0, 0);
        };

        function _doLilypond() {
            // Show busy cursor.
            document.body.style.cursor = 'wait';

            console.log('Saving .ly file');
            // Suppress music and turtle output when generating
            // Lilypond output.
            logo.runningLilypond = true;
            logo.lilypondOutput = LILYPONDHEADER;
            logo.lilypondNotes = {};
            for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                logo.lilypondStaging[turtle] = [];
                turtles.turtleList[turtle].doClear();
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

        function runProject(env){
            console.log("Running Project from Event");
            document.removeEventListener("finishedLoading", runProject);
            setTimeout(function () {
                console.log("Run");
                _changeBlockVisibility();
                _doFastButton(env);
            }, 5000);
        }

        function loadProject(projectName, run, env) {
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
                    document.addEventListener('finishedLoading', function(){runProject(env);}, false);
                } else {
                    document.attachEvent('finishedLoading', function(){runProject(env);});
                }
            }
            firstRun = false;
        };

        function loadRawProject(data) {
            console.log('loadRawProject ' + data);
            document.body.style.cursor = 'wait';
            _allClear();

            // First, hide the palettes as they will need updating.
            for (var name in blocks.palettes.dict) {
                blocks.palettes.dict[name].hideMenu(true);
            }

            var obj = JSON.parse(data);
            blocks.loadNewBlocks(obj);
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
            docById('canvas').style.display = 'none';
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
            // stopTurtleContainer.x = stopTurtleContainerX;
            // stopTurtleContainer.y = stopTurtleContainerY;
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
            var buttonNames = [
                ['run', _doFastButton, _('Run fast / long press to run slow / extra-long press to run music slow'), _doSlowButton, _doSlowMusicButton, 'slow-button', 'slow-music-button'],
                ['step', _doStepButton, _('Run step by step'), null, null, null, null],
                ['step-music', _doStepMusicButton, _('Run note by note'), null, null, null, null],
                ['stop-turtle', doStopButton, _('Stop'), null, null, null, null],
                ['clear', _allClear, _('Clean'), null, null, null, null],
                ['palette', _changePaletteVisibility, _('Show/hide palettes'), null, null, null, null],
                ['hide-blocks', _changeBlockVisibility, _('Show/hide blocks'), null, null, null, null],
                ['collapse-blocks', _toggleCollapsibleStacks, _('Expand/collapse collapsable blocks'), null, null, null, null],
                ['go-home', _findBlocks, _('Home'), null, null, null, null],
                ['help', _showHelp, _('Help'), null, null, null, null]
            ];

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
                    stopTurtleContainerX = x;
                    stopTurtleContainerY = y;
                } else if (buttonNames[i][0] === 'go-home') {
                    homeButtonContainers = [];
                    homeButtonContainers.push(container);
                    homeButtonContainersX = x;
                    homeButtonContainersY = y;
                    var container2 = _makeButton('go-home-faded-button', _('Home'), x, y, btnSize, 0);
                    _loadButtonDragHandler(container2, x, y, buttonNames[i][1]);
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
            var menuNames = [
                ['planet', _doOpenSamples, _('Load samples from server')],
                ['open', doLoad, _('Load project from files')],
                ['save', doSave, _('Save project')],
                ['lilypond', _doLilypond, _('Save sheet music')],
                ['paste-disabled', pasteStack, _('Paste')],
                ['Cartesian', _doCartesian, _('Cartesian')],
                ['polar', _doPolar, _('Polar')],
                ['utility', _doUtilityBox, _('Settings')],
                ['empty-trash', _deleteBlocksBox, _('Delete all')],
                ['restore-trash', _restoreTrash, _('Undo')]
            ];

            document.querySelector('#myOpenFile')
                    .addEventListener('change', function(event) {
                        thumbnails.model.controller.hide();
            });

            var btnSize = cellSize;
            var x = Math.floor(canvas.width / turtleBlocksScale) - btnSize / 2;
            var y = Math.floor(btnSize / 2);

            var dx = 0;
            var dy = btnSize;

            menuContainer = _makeButton('menu-button', '', x, y, btnSize, menuButtonsVisible ? 90 : undefined);
            _loadButtonDragHandler(menuContainer, x, y, _doMenuButton);

            for (var i = 0; i < menuNames.length; i++) {
                if (!getAuxToolbarButtonNames(menuNames[i][0])) {
                    continue;
                }

                x += dx;
                y += dy;
                var container = _makeButton(menuNames[i][0] + '-button', menuNames[i][2], x, y, btnSize, 0);
                _loadButtonDragHandler(container, x, y, menuNames[i][1]);
                onscreenMenu.push(container);
                if (menuNames[i][0] === 'utility') {
                    utilityButton = container;
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

            container.on('mouseover', function(event) {
                for (var c = 0; c < container.children.length; c++) {
                    if (container.children[c].text != undefined) {
                        container.children[c].visible = true;
                        break;
                    }
                }
            });

            container.on('mouseout', function(event) {
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

        function _loadButtonDragHandler(container, ox, oy, action, long_action = action, extra_long_action = long_action, long_img = null, extra_long_img = null) {
            // Prevent multiple button presses (i.e., debounce).
            var locked = false;

            if (long_action === null)
                long_action = action;
            if (extra_long_action === null)
                extra_long_action = long_action;

            // Long and extra-long press variables declaration
            var pressTimer, pressTimerExtra, isLong = false, isExtraLong = false;
            var formerContainer = container;

            container.on('mousedown', function (event) {
                var moved = true;
                var offset = {
                    x: container.x - Math.round(event.stageX / turtleBlocksScale),
                    y: container.y - Math.round(event.stageY / turtleBlocksScale)
                };

                pressTimer = setTimeout(function() {
                    isLong = true;
                    if (long_img !== null) {
                        container.visible = false;
                        container = _makeButton(long_img, "", ox, oy, cellSize, 0);
                    }
                }, 500);

                pressTimerExtra = setTimeout(function() {
                    isExtraLong = true;
                    if (extra_long_img !== null) {
                        container.visible = false;
                        container = _makeButton(extra_long_img, "", ox, oy, cellSize, 0);
                    }
                }, 1000);

                var circles = showButtonHighlight(ox, oy, cellSize / 2, event, turtleBlocksScale, stage);

                container.on('pressup', function (event) {
                    hideButtonHighlight(circles, stage);
                    container.x = ox;
                    container.y = oy;

                    if (long_img !== null || extra_long_img !== null) {
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

                        if (!isLong)
                            action();
                        else if (!isExtraLong)
                            long_action();
                        else
                            extra_long_action();
                    }
                    moved = false;
                });
                isLong = false;
                isExtraLong = false;
            });
        };
    };
});
    