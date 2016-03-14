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
}

/*
try {
    (function (d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
            return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
} catch (e) {
}
*/

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
    require('howler');
    require('mespeak');
    require('Chart');
    require('activity/utils');
    require('activity/artwork');
    require('activity/munsell');
    require('activity/trash');
    require('activity/boundary');
    require('activity/turtle');
    require('activity/palette');
    require('activity/protoblocks');
    require('activity/blocks');
    require('activity/block');
    require('activity/logo');
    require('activity/musicutils');
    require('activity/clearbox');
    require('activity/utilitybox');
    require('activity/samplesviewer');
    require('activity/basicblocks');
    require('activity/blockfactory');
    require('activity/analytics');
    require('prefixfree.min');
    require('activity/matrix');

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
        var musicBlocksScale = 1;
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
        const HELPCONTENT = [
            [_('Welcome to Music Blocks'), _('Music Blocks is a collection of manipulative tools for exploring fundamental musical concepts in an integrative and fun way.'), 'activity/activity-icon-mouse-color.svg'],
            [_('Meet Mr. Mouse!'), _('Mr. Mouse is our Music Blocks conductor. Mr. Mouse encourages you to explore Music Blocks. Let us start our tour!'), 'activity/activity-icon-mouse-color.svg'],
            [_('Palette buttons'), _('This toolbar contains the palette buttons Matrix, Notes, Tone, Turtle, and more. Click to show the palettes of blocks and drag blocks from the palettes onto the canvas to use them.'), 'images/icons.svg'],
            [_('Run fast'), _('Click to run the project in fast mode.'), 'header-icons/fast-button.svg'],
            [_('Run slow'), _('Click to run the project in slow mode.'), 'header-icons/slow-button.svg'],
            [_('Run music slow'), _('Click to run just the music in slow mode.'), 'header-icons/slow-music-button.svg'],
            [_('Run step by step'), _('Click to run the project step by step.'), 'header-icons/step-button.svg'],
            [_('Run note by note'), _('Click to run the music note by note.'), 'header-icons/step-music-button.svg'],
            [_('Stop'), _('Stop the music (and the turtles).'), 'header-icons/stop-turtle-button.svg'],
            [_('Clean'), _('Clear the screen and return the turtles to their initial positions.'), 'header-icons/clear-button.svg'],
            [_('Show/hide palettes'), _('Hide or show the block palettes.'), 'header-icons/palette-button.svg'],
            [_('Show/hide blocks'), _('Hide or show the blocks and the palettes.'), 'header-icons/hide-blocks-button.svg'],
            [_('Expand/collapse collapsable blocks'), _('Expand or collapse start and action stacks.'), 'header-icons/collapse-blocks-button.svg'],
            [_('Home'), _('Return all blocks to the center of the screen.'), 'header-icons/go-home-button.svg'],
            [_('Help'), _('Show these messages.'), 'header-icons/help-button.svg'],
            [_('Expand/collapse option toolbar'), _('Click this button to expand or collapse the auxillary toolbar.'), 'header-icons/menu-button.svg'],
            [_('Load samples from server'), _('This button opens a viewer for loading example projects.'), 'header-icons/planet-button.svg'],
            [_('Load project from files'), _('You can also load projects from the file system.'), 'header-icons/open-button.svg'],
            [_('Save project'), _('Save your project to a file.'), 'header-icons/save-button.svg'],
            [_('Save sheet music'), _('Save your project to as a Lilypond file.'), 'header-icons/lilypond-button.svg'],
            [_('Copy'), _('The copy button copies a stack to the clipboard. It appears after a "long press" on a stack.'), 'header-icons/copy-button.svg'],
            [_('Paste'), _('The paste button is enabled when there are blocks copied onto the clipboard.'), 'header-icons/paste-disabled-button.svg'],
            [_('Save stack'), _('The save-stack button saves a stack onto a custom palette. It appears after a "long press" on a stack.'), 'header-icons/save-blocks-button.svg'],
            [_('Cartesian'), _('Show or hide a Cartesian-coordinate grid.'), 'header-icons/Cartesian-button.svg'],
            [_('Polar'), _('Show or hide a polar-coordinate grid.'), 'header-icons/polar-button.svg'],
            [_('Settings'), _('Open a panel for configuring Music Blocks.'), 'header-icons/utility-button.svg'],
            [_('Decrease block size'), _('Decrease the size of the blocks.'), 'header-icons/smaller-button.svg'],
            [_('Increase block size'), _('Increase the size of the blocks.'), 'header-icons/bigger-button.svg'],
            [_('Display statistics'), _('Display statistics about your Music project.'), 'header-icons/chart-button.svg'],
            [_('Load plugin from file'), _('You can load new blocks from the file system.'), 'header-icons/plugins-button-white.svg'],
            [_('Enable scrolling'), _('You can scroll the blocks on the canvas.'), 'header-icons/scroll-unlock-button-white.svg'],
            [_('Delete all'), _('Remove all content on the canvas, including the blocks.'), 'header-icons/empty-trash-button.svg'],
            [_('Undo'), _('Restore blocks from the trash.'), 'header-icons/restore-trash-button.svg'],
            [_('Congratulations.'), _('You have finished the tour. Please enjoy Music Blocks!'), 'activity/activity-icon-mouse-color.svg']
        ]

        const DATAOBJS =
            [[0, 'start', 250, 150, [null, null, null]],
             [1, 'matrix', 800, 50, [null, 2, 25]],

             [2, 'pitch', 0, 0, [1, 3, 4, 5]],
             [3, ['solfege', {value:'ti'}], 0, 0, [2]],
             [4, ['number', {value:'4'}], 0, 0, [2]],

             [5, 'pitch', 0, 0, [2, 6, 7, 8]],
             [6, ['solfege', {value:'la'}], 0, 0, [5]],
             [7, ['number', {value:'4'}], 0, 0, [5]],

             [8, 'pitch', 0, 0, [5, 9, 10, 11]],
             [9, ['solfege', {value:'sol'}], 0, 0, [8]],
             [10, ['number', {value:'4'}], 0, 0, [8]],

             [11, 'pitch', 0, 0, [8, 12, 13, 14]],
             [12, ['solfege', {value:'mi'}], 0, 0, [11]],
             [13, ['number', {value:'4'}], 0, 0, [11]],

             [14, 'pitch', 0, 0, [11, 15, 16, 17]],
             [15, ['solfege', {value:'re'}], 0, 0, [14]],
             [16, ['number', {value:'4'}], 0, 0, [14]],

             [17, "repeat", 0, 0, [14, 18, 19, null]],
             [18, ["number", {"value":2}], 0, 0, [17]],

             [19, "rhythm", 0, 0, [17, 20, 21, 22]],
             [20, ["number", {"value":6}], 0, 0, [19]],
             [21, ["number", {"value":4}], 0, 0, [19]],

             [22, "rhythm", 0, 0, [19, 23, 24, null]],
             [23, ["number", {"value":1}], 0, 0, [22]],
             [24, ["number", {"value":2}], 0, 0, [22]],
             [25, 'hidden', 0, 0, [1, null]]
            ];

        pluginsImages = {};

        function findBlocks() {
            logo.showBlocks();
            blocksContainer.x = 0;
            blocksContainer.y = 0;
            palettes.initial_x = 55;
            palettes.initial_y = 55;
            palettes.updatePalettes();
            var x = 100 * musicBlocksScale;
            var y = 100 * musicBlocksScale;
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
                        x += 200 * musicBlocksScale;
                        if (x > (canvas.width - 100) / (musicBlocksScale)) {
                            x = 100 * musicBlocksScale;
                            y += 100 * musicBlocksScale;
                        }
                    }
                    /*
                    // Collapse collapsible stacks.
                    if (['start', 'action', 'drum', 'matrix'].indexOf(myBlock.name) !== -1 && !myBlock.trash) {
                        if (!myBlock.collapsed) {
                            myBlock.collapseToggle();
                        }
                    }
                    */
                }
            }
            // Blocks are all home, so reset go-home-button.
            homeButtonContainers[0].visible = false;
            homeButtonContainers[1].visible = true;
            boundary.hide();
        }

        function allClear() {
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

            var canvas = document.getElementById("music");
            var context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
        }

        function doFastButton(env) {
            logo.setTurtleDelay(0);
            if (docById('matrix').style.visibility === 'visible') {
                matrix.playAll();
            } else if (!turtles.running()) {
                logo.runLogoCommands(null, env);
            } else {
                logo.step(null, env);
            }
        }

        function doSlowButton() {
            logo.setTurtleDelay(DEFAULTDELAY);
            if (docById('matrix').style.visibility === 'visible') {
                matrix.playAll();
            } else if (!turtles.running()) {
                logo.runLogoCommands();
            } else {
                logo.step();
            }
        }

        function doStepButton() {
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
        }

        function doSlowMusicButton() {
            logo.setNoteDelay(DEFAULTDELAY);
            if (docById('matrix').style.visibility === 'visible') {
                matrix.playAll();
            } else if (!turtles.running()) {
                logo.runLogoCommands();
            } else {
                logo.stepNotes();
            }
        }

        function doStepMusicButton() {
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
        }

        var stopTurtle = false;

        function doStopButton() {
            logo.doStopTurtle();
        }

        var cartesianVisible = false;

        function doCartesian() {
            if (cartesianVisible) {
                hideCartesian();
                cartesianVisible = false;
            } else {
                showCartesian();
                cartesianVisible = true;
            }
        }

        var polarVisible = false;

        function doPolar() {
            if (polarVisible) {
                hidePolar();
                polarVisible = false;
            } else {
                showPolar();
                polarVisible = true;
            }
        }

        function toggleScroller() {
            scrollBlockContainer = !scrollBlockContainer;
        }

        function closeAnalytics(chartBitmap, ctx) {
            var button = this;
            button.x = (canvas.width / (2 * musicBlocksScale))  + (300 / Math.sqrt(2));
            button.y = 300.00 - (300.00 / Math.sqrt(2));
            this.closeButton = makeButton('cancel-button', _('Close'), button.x, button.y, 55, 0);
            this.closeButton.on('click', function(event) {
                console.log('Deleting Chart');
                button.closeButton.visible = false;
                stage.removeChild(chartBitmap);
                logo.showBlocks();
                update = true;
                ctx.clearRect(0, 0, 600, 600);
            });
        }

        function isCanvasBlank(canvas) {
            var blank = document.createElement('canvas');
            blank.width = canvas.width;
            blank.height = canvas.height;
            return canvas.toDataURL() == blank.toDataURL();
        }

        function doAnalytics() {
            var myChart = docById('myChart');
             if(isCanvasBlank(myChart) == false) {
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

            var callback = function () {
                var imageData = myRadarChart.toBase64Image();
                var img = new Image();
                img.onload = function () {
                    var chartBitmap = new createjs.Bitmap(img);
                    stage.addChild(chartBitmap);
                    chartBitmap.x = (canvas.width / (2 * musicBlocksScale)) - (300);
                    chartBitmap.y = 0;
                    chartBitmap.scaleX = chartBitmap.scaleY = chartBitmap.scale = 600 / chartBitmap.image.width;
                    logo.hideBlocks();
                    update = true;
                    document.body.style.cursor = 'default';
                    Analytics.close(chartBitmap, ctx);
                };
                img.src = imageData;
            };

            var options = getChartOptions(callback);
            console.log('creating new chart');
            myRadarChart = new Chart(ctx).Radar(data, options);
        }

        function doBiggerFont() {
            if (blockscale < BLOCKSCALES.length - 1) {
                blockscale += 1;
                blocks.setBlockScale(BLOCKSCALES[blockscale]);
            }
        }

        function doSmallerFont() {
            if (blockscale > 0) {
                blockscale -= 1;
                blocks.setBlockScale(BLOCKSCALES[blockscale]);
            }
        }

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
            createjs.Ticker.addEventListener('tick', tick);

            createMsgContainer('#ffffff', '#7a7a7a', function (text) {
                msgText = text;
            }, 55);

            createMsgContainer('#ffcbc4', '#ff0031', function (text) {
                errorMsgText = text;
            }, 110);

            createErrorContainers();

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
            setupBlocksContainerEvents();

            trashcan = new Trashcan(canvas, trashContainer, cellSize, refreshCanvas);
            turtles = new Turtles(canvas, turtleContainer, refreshCanvas);
            // Put the boundary in the blocks container so it scrolls
            // with the blocks.
            boundary = new Boundary(canvas, blocksContainer, refreshCanvas);
            blocks = new Blocks(canvas, blocksContainer, refreshCanvas, trashcan, stage.update);
            palettes = initPalettes(canvas, refreshCanvas, palettesContainer, cellSize, refreshCanvas, trashcan, blocks);

            matrix = new Matrix();

            palettes.setBlocks(blocks);
            turtles.setBlocks(blocks);
            blocks.setTurtles(turtles);
            blocks.setErrorMsg(errorMsg);
            blocks.makeCopyPasteButtons(makeButton, updatePasteButton);

            // TODO: clean up this mess.
            logo = new Logo(matrix, canvas,
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
                        console.log(cleanData);
                        var obj = JSON.parse(cleanData);
                        console.log(obj)
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

            cartesianBitmap = createGrid('images/Cartesian.svg');

            polarBitmap = createGrid('images/polar.svg');

            var URL = window.location.href;
            var projectName = null;
            var runProjectOnLoad = false;

            setupAndroidToolbar();

            // Scale the canvas relative to the screen size.
            onResize();

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
                    console.log('load ' + projectName);
                    loadProject(projectName, runProjectOnLoad, env);
                }, 2000);
            } else {
                setTimeout(function () {
                    loadStart();
                }, 2000);
            }

            document.addEventListener('mousewheel', scrollEvent, false);
            document.addEventListener('DOMMouseScroll', scrollEvent, false);

            this.document.onkeydown = keyPressed;
        }

        function setupBlocksContainerEvents() {
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
                        blocks.copyButton.visible = false;
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
        }

        function scrollEvent(event) {
            var data = event.wheelDelta || -event.detail;
            var delta = Math.max(-1, Math.min(1, (data)));
            var scrollSpeed = 3;

            if (event.clientX < cellSize) {
                palettes.menuScrollEvent(delta, scrollSpeed);
            } else {
                palette = palettes.findPalette(event.clientX / musicBlocksScale, event.clientY / musicBlocksScale);
                if (palette) {
                    palette.scrollEvent(delta, scrollSpeed);
                }
            }
        }

        function getStageX() {
            return turtles.screenX2turtleX(stageX / musicBlocksScale);
        }

        function getStageY() {
            return turtles.screenY2turtleY(stageY / musicBlocksScale);
        }

        function getStageMouseDown() {
            return stageMouseDown;
        }

        function setCameraID(id) {
            cameraID = id;
        }

        function createGrid(imagePath) {
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

        function createMsgContainer(fillColor, strokeColor, callback, y) {
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

        function createErrorContainers() {
            // Some error messages have special artwork.
            for (var i = 0; i < ERRORARTWORK.length; i++) {
                var name = ERRORARTWORK[i];
                makeErrorArtwork(name);
            }
        }

        function makeErrorArtwork(name) {
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
        }

        function keyPressed(event) {
            if (docById('labelDiv').classList.contains('hasKeyboard')) {
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

            // Captured by browser
            const PAGE_UP = 33;
            const PAGE_DOWN = 34;
            const KEYCODE_LEFT = 37;
            const KEYCODE_RIGHT = 39;
            const KEYCODE_UP = 38;
            const KEYCODE_DOWN = 40;

            if (event.altKey) {
                switch (event.keyCode) {
                case 69: // 'E'
                    allClear();
                    break;
                case 82: // 'R'
                    doFastButton();
                    break;
                case 83: // 'S'
                    logo.doStopTurtle();
                    break;
                }
            } else if (event.ctrlKey) {
            } else {
                switch (event.keyCode) {
                case HOME:
                    findBlocks();
                    break;
                case TAB:
                    break;
                case ESC:
                    // toggle full screen
                    toggleToolbar();
                    break;
                case RETURN:
                    // toggle run
                    logo.runLogoCommands();
                    break;
                default:
                    currentKey = String.fromCharCode(event.keyCode);
                    currentKeyCode = event.keyCode;
                    break;
                }
            }
        }

        function getCurrentKeyCode() {
            return currentKeyCode;
        }

        function clearCurrentKeyCode() {
            currentKey = '';
            currentKeyCode = 0;
        }

        function onResize() {
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
                    musicBlocksScale = smallSide / (cellSize * 11);
                } else {
                    musicBlocksScale = Math.max(smallSide / (cellSize * 11), 0.75);
                }
            } else {
                var mobileSize = false;
                if (w / 1200 > h / 900) {
                    musicBlocksScale = w / 1200;
                } else {
                    musicBlocksScale = h / 900;
                }
            }
            stage.scaleX = musicBlocksScale;
            stage.scaleY = musicBlocksScale;

            stage.canvas.width = w;
            stage.canvas.height = h;

            console.log('Resize: scale ' + musicBlocksScale +
            ', windowW ' + w + ', windowH ' + h +
            ', canvasW ' + canvas.width + ', canvasH ' + canvas.height +
            ', screenW ' + screen.width + ', screenH ' + screen.height);

            turtles.setScale(musicBlocksScale);
            blocks.setScale(musicBlocksScale);
            boundary.setScale(musicBlocksScale);
            palettes.setScale(musicBlocksScale);
            trashcan.resizeEvent(musicBlocksScale);
            setupAndroidToolbar(mobileSize);

            // Reposition coordinate grids.
            cartesianBitmap.x = (canvas.width / (2 * musicBlocksScale)) - (600);
            cartesianBitmap.y = (canvas.height / (2 * musicBlocksScale)) - (450);
            polarBitmap.x = (canvas.width / (2 * musicBlocksScale)) - (600);
            polarBitmap.y = (canvas.height / (2 * musicBlocksScale)) - (450);
            update = true;

            // Setup help now that we have calculated musicBlocksScale.
            showHelp(true);

            // Hide palette icons on mobile
            if (mobileSize) {
                palettes.hide();
            } else {
                palettes.show();
                palettes.bringToTop();
            }

            // Music stuff
            if (matrix.isMatrix === 1) {
                matrixTable = document.getElementById("myTable");
                if (matrixTable) {
                    matrixTable.setAttribute("width", w/2 + 'px');
                }
            }
        }

        window.onresize = function () {
            onResize();
        };

        function restoreTrash() {
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
                var actionArg = blocks.blockList[blocks.blockList[thisBlock].connections[1]];
                if (actionArg) {
                    var actionName = actionArg.value;
                    if (actionName !== _('action')) {
                        blocks.checkPaletteEntries('action');
                    }
                }
            }

            blocks.refreshCanvas();
        }

        function deleteBlocksBox() {
            clearBox.show(musicBlocksScale);
        }

        function doUtilityBox() {
            utilityBox.init(musicBlocksScale, utilityButton.x - 27, utilityButton.y, makeButton);
        }

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

                blocks.blockList[blk].trash = true;
                blocks.moveBlockRelative(blk, dx, dy);
                blocks.blockList[blk].hide();
                if (blocks.blockList[blk].name === 'start' || blocks.blockList[blk].name === 'drum') {
                    console.log('start blk ' + blk + ' value is ' + blocks.blockList[blk].value)
                    var turtle = blocks.blockList[blk].value;
                    if (turtle != null) {
                        console.log('sending turtle ' + turtle + ' to trash');
                        turtles.turtleList[turtle].trash = true;
                        turtles.turtleList[turtle].container.visible = false;
                    }
                } else if (blocks.blockList[blk].name === 'action') {
                    blocks.deleteActionBlock(blocks.blockList[blk]);
                }
            }

            if (addStartBlock) {
                blocks.loadNewBlocks(DATAOBJS);
            } else if (!doNotSave) {
                // Overwrite session data too.
                saveLocally();
            }

            update = true;
        }

        function changePaletteVisibility() {
            if (palettes.visible) {
                palettes.hide();
            } else {
                palettes.show();
                palettes.bringToTop();
            }
        }

        function changeBlockVisibility() {
            if (blocks.visible) {
                logo.hideBlocks();
            } else {
                if (chartBitmap != null) {
                    stage.removeChild(chartBitmap);
                    chartBitmap = null;
                }
                logo.showBlocks();
            }
        }

        function toggleCollapsibleStacks() {
            if (blocks.visible) {
                console.log('calling toggleCollapsibles');
                blocks.toggleCollapsibles();
            }
        }

        function stop() {
            // FIXME: who calls this???
            createjs.Ticker.removeEventListener('tick', tick);
        }

        function onStopTurtle() {
            // TODO: plugin support
            if (!buttonsVisible) {
                hideStopButton();
            }
        }

        function onRunTurtle() {
            // TODO: plugin support
            // If the stop button is hidden, show it.
            if (!buttonsVisible) {
                showStopButton();
            }
        }

        function refreshCanvas() {
            update = true;
        }

        function tick(event) {
            // This set makes it so the stage only re-renders when an
            // event handler indicates a change has happened.
            if (update) {
                update = false; // Only update once
                stage.update(event);
            }
        }

        function doOpenSamples() {
            if(document.getElementById('matrix').style.visibility !== 'hidden') {
                console.log('hide matrix');
                document.getElementById('matrix').style.visibility = 'hidden';
                document.getElementById('matrix').style.border = 0;
            }
            localStorage.setItem("isMatrixHidden",document.getElementById('matrix').style.visibility);
            console.log('save locally');
            saveLocally();
            thumbnails.show()
        }

        function doSave() {
            console.log('Saving .tb file');
            var name = 'My Project';
            download(name + '.tb',
                'data:text/plain;charset=utf-8,' + prepareExport());
        }

        function doLoad() {
            console.log('Loading .tb file');
            document.querySelector('#myOpenFile').focus();
            document.querySelector('#myOpenFile').click();
            window.scroll(0, 0);
        }

        function doLilypond() {
            // Show busy cursor.
            document.body.style.cursor = 'wait';

            console.log('Saving .ly file');
            logo.lilypondSaveOnly = true;
            logo.lilypondOutput = LILYPONDHEADER;
            logo.lilypondNotes = {};
            for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                logo.lilypondStaging[turtle] = [];
                turtles.turtleList[turtle].doClear();
            }
            logo.runLogoCommands();
        }

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
                        console.log('receiving ' + rawData);
                        var cleanData = rawData.replace('\n', '');
                    }

                    // First, hide the palettes as they will need updating.
                    for (var name in blocks.palettes.dict) {
                        blocks.palettes.dict[name].hideMenu(true);
                    }

                    var obj = JSON.parse(cleanData);
                    blocks.loadNewBlocks(obj);
                    console.log('save locally');
                    saveLocally();
                } catch (e) {
                    console.log(e);
                    loadStart();
                }
                // Restore default cursor
                document.body.style.cursor = 'default';
                update = true;
            }, 200);
            if (run) {
                setTimeout(function () {
                    changeBlockVisibility();
                    doFastButton(env);
                }, 2000);
            }
            docById('loading-image-container').style.display = 'none';
        }

        function loadRawProject(data) {
            console.log('loadRawProject ' + data);
            document.body.style.cursor = 'wait';
            allClear();

            // First, hide the palettes as they will need updating.
            for (var name in blocks.palettes.dict) {
                blocks.palettes.dict[name].hideMenu(true);
            }

            var obj = JSON.parse(data);
            blocks.loadNewBlocks(obj);

            docById('loading-image-container').style.display = 'none';
            document.body.style.cursor = 'default';
        }

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
        }

        function loadStart() {
            // where to put this?
            // palettes.updatePalettes();
            console.log(" LOAD START")
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

            docById('loading-image-container').style.display = 'none';
        }

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
        }

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
        }

        function errorMsg(msg, blk, text) {
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
        }

        function hideCartesian() {
            cartesianBitmap.visible = false;
            cartesianBitmap.updateCache();
            update = true;
        }

        function showCartesian() {
            cartesianBitmap.visible = true;
            cartesianBitmap.updateCache();
            update = true;
        }

        function hidePolar() {
            polarBitmap.visible = false;
            polarBitmap.updateCache();
            update = true;
        }

        function showPolar() {
            polarBitmap.visible = true;
            polarBitmap.updateCache();
            update = true;
        }

        function pasteStack() {
            blocks.pasteStack();
        }

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
                } else if (myBlock.name === 'action') {
                    var args = {
                        'collapsed': myBlock.collapsed
                    }
                } else if(myBlock.name === 'matrix') {
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
        }

        function doOpenPlugin() {
            // Click on the plugin open chooser in the DOM (.json).
            pluginChooser.focus();
            pluginChooser.click();
        }

        function saveToFile() {
            var filename = prompt('Filename:');
            if (fileExt(filename) !== 'tb') {
                filename += '.tb';
            }
            download(filename, 'data:text/plain;charset=utf-8,' + encodeURIComponent(prepareExport()));
        };

        function hideStopButton() {
            stopTurtleContainer.x = stopTurtleContainerX;
            stopTurtleContainer.y = stopTurtleContainerY;
            stopTurtleContainer.visible = false;
        }

        function showStopButton() {
            stopTurtleContainer.x = onscreenButtons[0].x;
            stopTurtleContainer.y = onscreenButtons[0].y;
            stopTurtleContainer.visible = true;
        }

        function playMusic(){
            for (var blk in logo.blocks.blockList) {
                var myBlock = logo.blocks.blockList[blk];
                var thisBlock = myBlock.blocks.blockList.indexOf(myBlock);
                if (myBlock.name === 'start' || myBlock.name === 'drum') {
                    var topBlock = logo.blocks.findTopBlock(thisBlock);
                    console.log('Playing through Play Button');
                    logo.runLogoCommands(topBlock);
                }
            }
        }

        function stopMusic() {
            logo.doStopTurtle();
            Tone.Transport.stop();
        }

        function updatePasteButton() {
            pasteContainer.removeChild(pasteContainer.children[0]);
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
                pasteContainer.addChild(bitmap)
                update = true;
            };

            img.src = 'header-icons/paste-button.svg';
        }

        function setupAndroidToolbar(showPalettesPopover) {
            if (headerContainer !== undefined) {
                stage.removeChild(headerContainer);
                for (var i in onscreenButtons) {
                    stage.removeChild(onscreenButtons[i]);
                }
            }

            headerContainer = new createjs.Shape();
            headerContainer.graphics.f(platformColor.header).r(0, 0,
                screen.width / musicBlocksScale, cellSize);
            if (platformColor.doHeaderShadow) {
                headerContainer.shadow = new createjs.Shadow('#777', 0, 2, 2);
            }
            stage.addChild(headerContainer);

            // Buttons used when running turtle programs
            var buttonNames = [
                ['fast', doFastButton, _('Run fast')],
                ['slow', doSlowButton, _('Run slow')],
                ['step', doStepButton, _('Run step by step')],
                ['slow-music', doSlowMusicButton, _('Run music slow')],
                ['step-music', doStepMusicButton, _('Run note by note')],
                ['stop-turtle', doStopButton, _('Stop')],
                ['clear', allClear, _('Clean')],
                ['palette', changePaletteVisibility, _('Show/hide palettes')],
                ['hide-blocks', changeBlockVisibility, _('Show/hide blocks')],
                ['collapse-blocks', toggleCollapsibleStacks, _('Expand/collapse collapsable blocks')],
                ['go-home', findBlocks, _('Home')],
                ['help', showHelp, _('Help')]
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

            for (var name in buttonNames) {
                var container = makeButton(buttonNames[name][0] + '-button', buttonNames[name][2], x, y, btnSize, 0);
                loadButtonDragHandler(container, x, y, buttonNames[name][1]);
                onscreenButtons.push(container);

                if (buttonNames[name][0] === 'stop-turtle') {
                    stopTurtleContainer = container;
                    stopTurtleContainerX = x;
                    stopTurtleContainerY = y;
                } else if (buttonNames[name][0] === 'go-home') {
                    homeButtonContainers = [];
                    homeButtonContainers.push(container);
                    homeButtonContainersX = x;
                    homeButtonContainersY = y;
                    var container2 = makeButton('go-home-faded-button', _('Home'), x, y, btnSize, 0);
                    loadButtonDragHandler(container2, x, y, buttonNames[name][1]);
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

            setupRightMenu(musicBlocksScale);
        }

        function setupRightMenu(musicBlocksScale) {
            if (menuContainer !== undefined) {
                stage.removeChild(menuContainer);
                for (var i in onscreenMenu) {
                    stage.removeChild(onscreenMenu[i]);
                }
            }

            // Misc. other buttons
            var menuNames = [
                ['planet', doOpenSamples, _('Load samples from server')],
                ['open', doLoad, _('Load project from files')],
                ['save', doSave, _('Save project')],
                ['lilypond', doLilypond, _('Save sheet music')],
                ['paste-disabled', pasteStack, _('Paste')],
                ['Cartesian', doCartesian, _('Cartesian')],
                ['polar', doPolar, _('Polar')],
                ['utility', doUtilityBox, _('Settings')],
                ['empty-trash', deleteBlocksBox, _('Delete all')],
                ['restore-trash', restoreTrash, _('Undo')]
            ];

            document.querySelector('#myOpenFile')
                    .addEventListener('change', function(event) {
                        thumbnails.model.controller.hide();
            });

            var btnSize = cellSize;
            var x = Math.floor(canvas.width / musicBlocksScale) - btnSize / 2;
            var y = Math.floor(btnSize / 2);

            var dx = 0;
            var dy = btnSize;

            menuContainer = makeButton('menu-button', '', x, y, btnSize, menuButtonsVisible ? 90 : undefined);
            loadButtonDragHandler(menuContainer, x, y, doMenuButton);

            for (var name in menuNames) {
                x += dx;
                y += dy;
                var container = makeButton(menuNames[name][0] + '-button', menuNames[name][2], x, y, btnSize, 0);
                loadButtonDragHandler(container, x, y, menuNames[name][1]);
                onscreenMenu.push(container);
                if (menuNames[name][0] === 'utility') {
                    utilityButton = container;
                }
                container.visible = false;
            }

            if (menuButtonsVisible) {
                for (var button in onscreenMenu) {
                    onscreenMenu[button].visible = true;
                }
            }
        }

        function doPopdownPalette() {
            var p = new PopdownPalette(palettes);
            p.popdown();
        }

        function showHelp(firstTime) {
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
                            var imageScale = 55 * musicBlocksScale;
                            helpElem.innerHTML = '<img src ="' + HELPCONTENT[helpIdx][2] + '" style="height:' + imageScale + 'px; width: auto"></img> <h2>' + HELPCONTENT[helpIdx][0] + '</h2><p>' + HELPCONTENT[helpIdx][1] + '</p>';
                        }
                        update = true;
                    });

                    var img = new Image();
                    img.onload = function () {
                        // console.log(musicBlocksScale);
                        var bitmap = new createjs.Bitmap(img);
                        if (musicBlocksScale > 1) {
                            bitmap.scaleX = bitmap.scaleY = bitmap.scale = musicBlocksScale;
                        } else {
                            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 1.125;
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
                helpElem.style.paddingLeft = 20 * musicBlocksScale + 'px';
                helpElem.style.paddingRight = 20 * musicBlocksScale + 'px';
                helpElem.style.paddingTop = '0px';
                helpElem.style.paddingBottom = 20 * musicBlocksScale + 'px';
                helpElem.style.fontSize = 20 * musicBlocksScale + 'px';
                helpElem.style.color = '#ffffff';
                helpElem.style.left = 65 * musicBlocksScale + 'px';
                helpElem.style.top = 105 * musicBlocksScale + 'px';
                var w = Math.min(300, 300 * musicBlocksScale);
                var h = Math.min(300, 300 * musicBlocksScale);
                helpElem.style.width = w + 'px';
                helpElem.style.height = h + 'px';

                if (musicBlocksScale > 1) {
                    var bitmap = helpContainer.children[0];
                    if (bitmap != undefined) {
                        bitmap.scaleX = bitmap.scaleY = bitmap.scale = musicBlocksScale;
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
        }

        function doMenuButton() {
            doMenuAnimation(1);
        }

        function doMenuAnimation() {
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
                setTimeout(doMenuAnimation, 50);
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
        }

        function toggleToolbar() {
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
        }

        function makeButton(name, label, x, y, size, rotation, parent) {
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
        }

        function loadButtonDragHandler(container, ox, oy, action) {
            // Prevent multiple button presses (i.e., debounce).
            var locked = false;

            container.on('mousedown', function (event) {
                var moved = true;
                var offset = {
                    x: container.x - Math.round(event.stageX / musicBlocksScale),
                    y: container.y - Math.round(event.stageY / musicBlocksScale)
                };

                var circles = showButtonHighlight(ox, oy, cellSize / 2,
                    event, musicBlocksScale, stage);
                container.on('pressup', function (event) {
                    hideButtonHighlight(circles, stage);

                    container.x = ox;
                    container.y = oy;
                    if (action != null && moved && !locked) {
                        locked = true;
                        setTimeout(function () {
                            locked = false;
                        }, 500);
                        action();
                    }
                    moved = false;
                });
            });
        }

        // More music stuff we may not need
        function clearMenus() {
            if (headerContainer !== undefined) {
                stage.removeChild(headerContainer);
                for (var i in onscreenButtons) {
                    stage.removeChild(onscreenButtons[i]);
                }
            }

            if (menuContainer !== undefined) {
                stage.removeChild(menuContainer);
                for (var i in onscreenMenu) {
                    stage.removeChild(onscreenMenu[i]);
                }
            }
        }

        function restoreHome() {
            setupAndroidToolbar();
            blocks.show();
            for (var b = 0; b < blocks.blockList.length; b++) {
                var blk = blocks.blockList[b];
                if (blk.name === "forever" || blk.name === 'repeat' || blk.name === 'chunkTranspose') {
                    blocks.blockList[b].trash = true;
                    blocks.blockList[b].hide();
                }
                blocks.refreshCanvas();
                palettes.show();
            }
        }

    }
});
