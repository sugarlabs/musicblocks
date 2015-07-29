// Copyright (c) 2014,2015 Walter Bender
// Modified by Yash Khandelwal, GSoC'15
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 3 of the License, or
// (at your option) any later version.
//
// You should have received a copy of the GNU General Public License
// along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA
//
// Note: This code is inspired by the Python Turtle Blocks project
// (https://github.com/walterbender/turtleart), but implemented from
// scratch. -- Walter Bender, October 2014.

var lang = document.webL10n.getLanguage();
if (lang.indexOf("-") != -1) {
    lang = lang.slice(0, lang.indexOf("-"));
    document.webL10n.setLanguage(lang);
}

define(function(require) {
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
    require('activity/turtle');
    require('activity/palette');
    require('activity/protoblocks');
    require('activity/blocks');
    require('activity/block');
    require('activity/logo');
    require('activity/clearbox');
    require('activity/utilitybox');
    require('activity/samplesviewer');
    require('activity/basicblocks');
    require('activity/blockfactory');
    require('activity/analytics');
    require('prefixfree.min');
    require('activity/matrix');
    require('activity/assemble');
    
    require('activity/musicnotation');

    // Manipulate the DOM only when it is ready.
    require(['domReady!'], function(doc) {
        window.scroll(0, 0);
//document.getElementById("solfamenu").style.visibility = "hidden";

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
        var allFilesChooser = docById('myOpenAll')

        // Are we running off of a server?
        var server = true;
        var scale = 1;
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
        var menuButtonsVisible = false;
        var menuContainer = null;
        var workspaceContainer = null;
        var currentKey = '';
        var currentKeyCode = 0;
        var lastKeyCode = 0;
        var pasteContainer = null;
        var chartBitmap = null;
        var workspace = false;

        // Calculate the palette colors.
        for (var p in PALETTECOLORS) {
            PALETTEFILLCOLORS[p] = getMunsellColor(PALETTECOLORS[p][0], PALETTECOLORS[p][1], PALETTECOLORS[p][2]);
            PALETTESTROKECOLORS[p] = getMunsellColor(PALETTECOLORS[p][0], PALETTECOLORS[p][1] - 30, PALETTECOLORS[p][2]);
            PALETTEHIGHLIGHTCOLORS[p] = getMunsellColor(PALETTECOLORS[p][0], PALETTECOLORS[p][1] + 10, PALETTECOLORS[p][2]);
            HIGHLIGHTSTROKECOLORS[p] = getMunsellColor(PALETTECOLORS[p][0], PALETTECOLORS[p][1] - 50, PALETTECOLORS[p][2]);
            // console.log(p + ' ' + PALETTEFILLCOLORS[p]  + ' ' + PALETTESTROKECOLORS[p] + ' ' + PALETTEHIGHLIGHTCOLORS[p] + ' ' + HIGHLIGHTSTROKECOLORS[p]);
        }

        pluginObjs = {
            'PALETTEPLUGINS': {},
            'PALETTEFILLCOLORS': {},
            'PALETTESTROKECOLORS': {},
            'PALETTEHIGHLIGHTCOLORS': {},
            'FLOWPLUGINS': {},
            'ARGPLUGINS': {},
            'BLOCKPLUGINS': {}
        };

        //Matrix
        window.savedMatricesNotes = [];
        window.savedMatricesCount = 0;        

        // Stacks of blocks saved in local storage
        var macroDict = {};

        var stopTurtleContainer = null;
        var stopTurtleContainerX = 0;
        var stopTurtleContainerY = 0;
        var cameraID = null;
        var toLang = null;
        var fromLang = null;

        // initial scroll position
        var scrollX = 0;
        var scrollY = 0;

        // default values
        var CAMERAVALUE = '##__CAMERA__##';
        var VIDEOVALUE = '##__VIDEO__##';

        var DEFAULTDELAY = 500;  // milleseconds
        var TURTLESTEP = -1;  // Run in step-by-step mode

        var blockscale = 2;
        var blockscales = [1, 1.5, 2, 3, 4];

        // Time when we hit run
        var time = 0;

        // Used by pause block
        var waitTime = {};

        // Used to track mouse state for mouse button block
        var stageMouseDown = false;
        var stageX = 0;
        var stageY = 0;

        var onXO = (screen.width == 1200 && screen.height == 900) || (screen.width == 900 && screen.height == 1200);
        console.log('on XO? ' + onXO);

        var cellSize = 55;
        if (onXO) {
            cellSize = 75;
        };

        var onscreenButtons = [];
        var onscreenMenu = [];

        var helpContainer = null;
        var helpIdx = 0;
        var HELPCONTENT = [[_('Welcome to Mouse Music'), _('Mouse Music is a Logo-inspired mouse that plays Music'), 'activity/activity-icon-color.svg'],
                           [_('Palette buttons'), _('This toolbar contains the palette buttons: click to show the palettes of blocks (Matrix, Music, Media, etc.). You can drag blocks from the palettes onto the canvas to use them.'), 'images/icons.svg'],
                           [_('Clean'), _('Clears the Matrix and Music-Notations.'), 'icons/clear-button.svg'],
                           [_('Show/hide palettes'), _('Hide or show the block palettes.'), 'icons/palette-button.svg'],
                           [_('Show/hide blocks'), _('Hide or show the blocks and the palettes.'), 'icons/hide-blocks-button.svg'],
                           [_('Expand/collapse collapsable blocks'), _('Expand or collapse stacks of blocks, e.g, start and action stacks.'), 'icons/collapse-blocks-button.svg'],
                           [_('Save Notations'), _('Click to Download the Music Notations in png format'), 'icons/download-button.svg'],
                           [_('Help'), _('Show these messages.'), 'icons/help-button.svg'],
                           [_('Play'), _('Plays the Music which is inside the start block.'), 'icons/play-button.svg'],
                           [_('Stop'), _('Stop the Music.'), 'icons/stop-turtle-button.svg'],
                           [_('Expand/collapse option toolbar'), _('Click this button to expand or collapse the auxillary toolbar.'), 'icons/menu-button.svg'],
                           [_('Copy'), _('The copy button copies a stack to the clipboard. It appears after a "long press" on a stack.'), 'icons/copy-button.svg'],
                           [_('Paste'), _('The paste button is enabled when there are blocks copied onto the clipboard.'), 'icons/paste-disabled-button.svg'],
                           [_('Save stack'), _('The save-stack button saves a stack onto a custom palette. It appears after a "long press" on a stack.'), 'icons/save-blocks-button.svg'],
                           [_('Settings'), _('Open a panel for configuring Mouse Music.'), 'icons/utility-button.svg'],
                           [_('Decrease block size'), _('Decrease the size of the blocks.'), 'icons/smaller-button.svg'],
                           [_('Increase block size'), _('Increase the size of the blocks.'), 'icons/bigger-button.svg'],
                           [_('Delete all'), _('Remove all content on the canvas, including the blocks.'), 'icons/empty-trash-button.svg'],
                           [_('Undo'), _('Restore blocks from the trash.'), 'icons/restore-trash-button.svg'],
                           [_('Congratulations.'), _('You have finished the tour. Please enjoy Music Blocks!'), 'activity/activity-icon-color.svg']]

        pluginsImages = {};

        function allClear() {
            
            logo.boxes = {};
            logo.time = 0;
            hideMsgs();
            logo.setBackgroundColor(-1);
            for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                turtles.turtleList[turtle].doClear();
            }

            Element.prototype.remove = function() {
            this.parentElement.removeChild(this);
            }
            NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
            for(var i = 0, len = this.length; i < len; i++) {
                if(this[i] && this[i].parentElement) {
                    this[i].parentElement.removeChild(this[i]);
                    }
                }
            }
            var table = document.getElementById("myTable");
            if(table != null)
            {
                table.remove();
            }

            var canvas = document.getElementById("music");
            var context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);
            document.getElementById('musicNotation').innerHTML = "";
            document.getElementById('musicNotation').style.display = 'none';
            if(musicnotation != null)
            {
                musicnotation.musicContainer.removeAllChildren();
                musicnotation.notationIndex = 0;
            }
            blocksContainer.x = 0;
            blocksContainer.y = 0;

            matrix.clearTurtles();
            var i = 1;
            while(logo.blocks.protoBlockDict['namedsavematrix' + i])
                    {
                        var cont = logo.blocks.blockList[blk].container;
                    
                        delete logo.blocks.protoBlockDict['namedsavematrix' + i];
                        delete ProtoBlock('namedsavematrix' + i);
                        cont.updateCache();
                        window.savedMatricesCount -= 1;
                        i += 1;
                    }
            }

        function doAnalytics() {
            document.body.style.cursor = 'wait';
            var myChart = docById('myChart');
            var ctx = myChart.getContext('2d');
            var myRadarChart = null;
            var scores = analyzeProject(blocks);
            console.log(scores);
            var data = scoreToChartData(scores);

            var callback = function() {
                var imageData = myRadarChart.toBase64Image();
                var img = new Image();
                img.onload = function () {
                    chartBitmap = new createjs.Bitmap(img);
                    stage.addChild(chartBitmap);
                    chartBitmap.x = (canvas.width / (2 * scale)) - (300);
                    chartBitmap.y = 0;
                    chartBitmap.scaleX = chartBitmap.scaleY = chartBitmap.scale = 600 / chartBitmap.image.width;
                    logo.hideBlocks();
                    update = true;
                    document.body.style.cursor = 'default';
                };
                img.src = imageData;
            }

            var options = getChartOptions(callback);
            console.log('creating new chart');
            myRadarChart = new Chart(ctx).Radar(data, options);
        }

        function doBiggerFont() {
            if (blockscale < blockscales.length - 1) {
                blockscale += 1;
                blocks.setBlockScale(blockscales[blockscale]);
            }
        }

        function doSmallerFont() {
            if (blockscale > 0) {
                blockscale -= 1;
                blocks.setBlockScale(blockscales[blockscale]);
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
        var ERRORARTWORK = ['emptybox', 'emptyheap', 'negroot', 'noinput', 'zerodivide', 'notanumber', 'nostack', 'notastring', 'nomicrophone'];

        var assemble = null;
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

            createMsgContainer('#ffffff', '#7a7a7a', function(text) {
                msgText = text;
            }, 55);

            createMsgContainer('#ffcbc4', '#ff0031', function(text) {
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
            stage.addChild(turtleContainer, trashContainer, blocksContainer,
                           palettesContainer);
            setupBlocksContainerEvents();

            trashcan = new Trashcan(canvas, trashContainer, cellSize, refreshCanvas);
            turtles = new Turtles(canvas, turtleContainer, refreshCanvas);
            blocks = new Blocks(canvas, blocksContainer, refreshCanvas, trashcan, stage.update);
            palettes = initPalettes(canvas, refreshCanvas, palettesContainer, cellSize, refreshCanvas, trashcan, blocks);
            musicnotation = new MusicNotation(turtles, stage);
            matrix = new Matrix(canvas, stage, turtles, trashcan, musicnotation);

            //palettes.buttons['assemble'].visible = false;

            //setting bgcolor of canvas that will be download as image for music notation
            var can = document.getElementById('canvasToSave');
            var ctx = can.getContext('2d');
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0,0,525,800);

            palettes.setBlocks(blocks);
            turtles.setBlocks(blocks);
            blocks.setTurtles(turtles);
            blocks.setErrorMsg(errorMsg);
            blocks.makeCopyPasteButtons(makeButton, updatePasteButton);

            // TODO: clean up this mess.
            logo = new Logo(matrix, canvas, blocks, turtles, turtleContainer,
                            refreshCanvas,
                            textMsg, errorMsg, hideMsgs, onStopTurtle,
                            onRunTurtle, prepareExport, getStageX, getStageY,
                            getStageMouseDown, getCurrentKeyCode,
                            clearCurrentKeyCode, meSpeak, saveLocally);
            blocks.setLogo(logo);

            // Set the default background color...
            logo.setBackgroundColor(-1);

            clearBox = new ClearBox(canvas, stage, refreshCanvas, sendAllToTrash);

            utilityBox = new UtilityBox(canvas, stage, refreshCanvas, doBiggerFont, doSmallerFont, doOpenPlugin, doAnalytics);

            thumbnails = new SamplesViewer(canvas, stage, refreshCanvas, loadProject, loadRawProject, sendAllToTrash);

            initBasicProtoBlocks(palettes, blocks);

            // Load any macros saved in local storage.
            var macroData = localStorage.getItem('macros');
            if (macroData != null) {
                processMacroData(macroData, palettes, blocks, macroDict);
            }
            // Blocks and palettes need access to the macros dictionary.
            blocks.setMacroDictionary(macroDict);
            palettes.setMacroDictionary(macroDict);

            // Load any plugins saved in local storage.
            var pluginData = localStorage.getItem('plugins');
            if (pluginData != null) {
                var obj = processPluginData(pluginData, palettes, blocks, logo.evalFlowDict, logo.evalArgDict, logo.evalParameterDict, logo.evalSetterDict);
                updatePluginObj(obj);
            }

            fileChooser.addEventListener('click', function(event) { this.value = null; });
            fileChooser.addEventListener('change', function(event) {

                // Read file here.
                var reader = new FileReader();

                reader.onload = (function(theFile) {
                    // Show busy cursor.
                    document.body.style.cursor = 'wait';
                    setTimeout(function() {
                        var rawData = reader.result;
                        var cleanData = rawData.replace('\n', ' ');
                        console.log(cleanData);
                        var obj = JSON.parse(cleanData);
                        console.log(obj)
                        blocks.loadNewBlocks(obj);
                        // Restore default cursor.
                        document.body.style.cursor = 'default';
                    }, 200);
                });

                reader.readAsText(fileChooser.files[0]);
            }, false);

            allFilesChooser.addEventListener('click', function(event) { this.value = null; });

            pluginChooser.addEventListener('click', function(event) {
                window.scroll(0, 0);
                this.value = null;
            });
            pluginChooser.addEventListener('change', function(event) {
                window.scroll(0, 0)

                // Read file here.
                var reader = new FileReader();

                reader.onload = (function(theFile) {
                    // Show busy cursor.
                    document.body.style.cursor = 'wait';
                    setTimeout(function() {
                        obj = processRawPluginData(reader.result, palettes, blocks, errorMsg, logo.evalFlowDict, logo.evalArgDict, logo.evalParameterDict, logo.evalSetterDict);
                        // Save plugins to local storage.
                        if (obj != null) {
                            var foo = preparePluginExports(obj);
                            console.log(foo);
                            localStorage.setItem('plugins', foo); // preparePluginExports(obj));
                        }

                        // Refresh the palettes.
                        setTimeout(function() {
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
            try {
                httpGet(null);
                console.log('running from server or the user can access to examples.');
                server = true;
            } catch (e) {
                console.log('running from filesystem or the connection isnt secure');
                server = false;
            }

            setupAndroidToolbar();

            // Scale the canvas relative to the screen size.
            onResize();

            if (URL.indexOf('?') > 0) {
                var urlParts = URL.split('?');
                if (urlParts[1].indexOf('=') > 0) {
                    var projectName = urlParts[1].split('=')[1];
                }
            }
            if (projectName != null) {
                setTimeout(function () { console.log('load ' + projectName); loadProject(projectName); }, 2000);
            } else {
                setTimeout(function () { loadStart(); }, 2000);
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
                if (stage.getObjectUnderPoint() !== null | turtles.running()) {
                    stage.on('stagemouseup', function (event) {
                        stageMouseDown = false;
                    });
                    return;
                }
                moving = true;
                lastCords = {x: event.stageX, y: event.stageY};

                stage.on('stagemousemove', function (event) {
                    if (!moving) {
                        return;
                    }
                    blocksContainer.x += event.stageX - lastCords.x;
                    blocksContainer.y += event.stageY - lastCords.y;
                    lastCords = {x: event.stageX, y: event.stageY};
                    refreshCanvas();
                });

                stage.on('stagemouseup', function (event) {
                    stageMouseDown = false;
                    moving = false;
                }, null, true);  // once = true
            });
        }

        function scrollEvent(event) {
            var data = event.wheelDelta || -event.detail;
            var delta = Math.max(-1, Math.min(1, (data)));
            var scrollSpeed = 3;

            if (event.clientX < cellSize) {
                palettes.menuScrollEvent(delta, scrollSpeed);
            } else {
                palette = palettes.findPalette(event.clientX/scale, event.clientY/scale);
                if (palette) {
                    palette.scrollEvent(delta, scrollSpeed);
                }
            }
        }

        function getStageX() {
            return turtles.screenX2turtleX(stageX / blocks.scale);
        }

        function getStageY() {
            return turtles.screenY2turtleY(stageY / blocks.scale);
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

            bitmap = new createjs.Bitmap(img);
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
            img.onload = function() {
                var msgBlock = new createjs.Bitmap(img);
                container.addChild(msgBlock);
                text = new createjs.Text('your message here',
                    '20px Arial', '#000000');
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

                container.on('click', function(event) {
                    container.visible = false;
                    // On the possibility that there was an error
                    // arrow associated with this container
                    if (errorMsgArrow !== null) {
                        errorMsgArrow.removeAllChildren(); // Hide the error arrow.
                    }
                    update = true;
                });
                callback(text);
                blocks.setMsgText(text);
            }
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
                img.onload = function() {
                    console.log('creating error message artwork for ' + img.src);
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

                    container.on('click', function(event) {
                        container.visible = false;
                        // On the possibility that there was an error
                        // arrow associated with this container
                        if (errorMsgArrow !== null) {
                            errorMsgArrow.removeAllChildren(); // Hide the error arrow.
                        }
                        update = true;
                    });
                }
                img.src = 'images/' + name + '.svg';
        }

        function keyPressed(event) {
            if (docById('labelDiv').classList.contains('hasKeyboard')) {
                return;
            }

            var ESC = 27;
            var ALT = 18;
            var CTRL = 17;
            var SHIFT = 16;
            var RETURN = 13;
            var SPACE = 32;

            // Captured by browser
            var PAGE_UP = 33;
            var PAGE_DOWN = 34;
            var KEYCODE_LEFT = 37;
            var KEYCODE_RIGHT = 39;
            var KEYCODE_UP = 38;
            var KEYCODE_DOWN = 40;

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
            } else if (event.ctrlKey) {} else {
                switch (event.keyCode) {
                    case ESC:
                        // toggle full screen
                        toggleToolbar();
                        break
                    case RETURN:
                        // toggle run
                        logo.runLogoCommands();
                        break
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
                    scale = smallSide / (cellSize * 11);
                } else {
                    scale = Math.max(smallSide / (cellSize * 11), 0.75);
                }
            } else {
                var mobileSize = false;
                if (w > h) {
                    scale = w / 1200;
                } else {
                    scale = w / 900;
                }
            }
            stage.scaleX = scale;
            stage.scaleY = scale;

            stage.canvas.width = w;
            stage.canvas.height = h;

            console.log('Resize: scale ' + scale +
                ', windowW ' + w + ', windowH ' + h +
                ', canvasW ' + canvas.width + ', canvasH ' + canvas.height +
                ', screenW ' + screen.width + ', screenH ' + screen.height);

            turtles.setScale(scale);
            blocks.setScale(scale);
            palettes.setScale(scale);
            trashcan.resizeEvent(scale);
            setupAndroidToolbar(mobileSize);

            // Reposition coordinate grids.
            cartesianBitmap.x = (canvas.width / (2 * scale)) - (600);
            cartesianBitmap.y = (canvas.height / (2 * scale)) - (450);
            polarBitmap.x = (canvas.width / (2 * scale)) - (600);
            polarBitmap.y = (canvas.height / (2 * scale)) - (450);
            update = true;

            // Setup help now that we have calculated scale.
            showHelp(true);

            // Hide palette icons on mobile
            if (mobileSize) {
                palettes.hide();
            } else {
                palettes.show();
                palettes.bringToTop();
            }

            if(matrix.isMatrix == 1)
            {
                matrixTable = document.getElementById("myTable");
                matrixTable.setAttribute("width", w/2 + 'px');

            }

            if(workspace)
                {
                    console.log("clearing canvas");
                    assemble.clearAll();
                    clearMenus();
                }
        }

        window.onresize = function() {
            onResize();
        }

        function restoreTrash() {
            var dx = 0;
            var dy = -cellSize * 3; // Reposition blocks about trash area.
            for (var blk in blocks.blockList) {
                if (blocks.blockList[blk].trash) {
                    blocks.blockList[blk].trash = false;
                    blocks.moveBlockRelative(blk, dx, dy);
                    blocks.blockList[blk].show();
                    if (blocks.blockList[blk].name == 'start') {
                        turtle = blocks.blockList[blk].value;
                        turtles.turtleList[turtle].trash = false;
                        turtles.turtleList[turtle].container.visible = true;
                    }
                }
            }
            update = true;
        }

        function deleteBlocksBox() {
            clearBox.show(scale);
        }

        function doUtilityBox() {
            utilityBox.show(scale);
        }

        // FIXME: confirm???
        function sendAllToTrash(addStartBlock, doNotSave) {
            var dx = 2000;
            var dy = cellSize;
            for (var blk in blocks.blockList) {
                blocks.blockList[blk].trash = true;
                blocks.moveBlockRelative(blk, dx, dy);
                blocks.blockList[blk].hide();
                if (blocks.blockList[blk].name == 'start') {
                    console.log('start blk ' + blk + ' value is ' + blocks.blockList[blk].value)
                    turtle = blocks.blockList[blk].value;
                    if (turtle != null) {
                        console.log('sending turtle ' + turtle + ' to trash');
                        turtles.turtleList[turtle].trash = true;
                        turtles.turtleList[turtle].container.visible = false;
                    }
                }
            }
            if (addStartBlock) {
                function postprocess() {
                    last(blocks.blockList).x = 250;
                    last(blocks.blockList).y = 250;
                    last(blocks.blockList).connections = [null, null, null];
                    turtles.add(last(blocks.blockList));
                    last(blocks.blockList).value = turtles.turtleList.length - 1;
                    blocks.updateBlockPositions();
                    if (!doNotSave) {
                        console.log('save locally');
                        saveLocally();
                    }
                }

                blocks.makeNewBlock('start', postprocess);
            }

            if (!doNotSave) {
                // Overwrite session data too.
                console.log('save locally');
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

        function saveMusicNotations() {

            var canvas = document.getElementById("canvasToSave");
            var img    = canvas.toDataURL("image/png");
            //document.write('<img src="'+img+'"/>');*/
            var link = document.createElement('a');
            link.href = img;
            link.download = 'Download.png';
            document.body.appendChild(link);
            link.click();
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
            console.log('save locally');
            saveLocally();
            thumbnails.show()
        }

        function saveLocally() {
            console.log('overwriting session data');

            if (localStorage.currentProject === undefined) {
                try {
                    localStorage.currentProject = 'My Project';
                    localStorage.allProjects = JSON.stringify(['My Project'])
                } catch (e) {
                    // Edge case, eg. Firefox localSorage DB corrupted
                    console.log(e);
                }
            }

            try {
                var p = localStorage.currentProject;
                var allData = prepareExport();
                localStorage['SESSION' + p] = allData["data"];
                localStorage['SESSIONworkspacea'] = allData["workspaceaData"];
                //console.log("workspaceaData "+ localStorage["SESSIONworkspacea"]);
            } catch (e) { console.log(e); }

            if (isSVGEmpty(turtles)) {
                return;
            }

            var img = new Image();
            var svgData = doSVG(canvas, logo, turtles, 320, 240, 320 / canvas.width);
            img.onload = function() {
                var bitmap = new createjs.Bitmap(img);
                var bounds = bitmap.getBounds();
                bitmap.cache(bounds.x, bounds.y, bounds.width, bounds.height);
                try {
                    localStorage['SESSIONIMAGE' + p] = bitmap.getCacheDataURL();
                } catch (e) { console.log(e); }
            }
            img.src = 'data:image/svg+xml;base64,' +
                      window.btoa(unescape(encodeURIComponent(svgData)));
        }

        function loadProject(projectName) {
            // Show busy cursor.
            document.body.style.cursor = 'wait';
            // palettes.updatePalettes();
            setTimeout(function() {
                if (fileExt(projectName) != 'tb') {
                    projectName += '.tb';
                }
                try {
                    if (server) {
                        var rawData = httpGet(projectName);
                        console.log('receiving ' + rawData);
                        var cleanData = rawData.replace('\n', '');
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

            docById('loading-image-container').style.display = 'none';
        }

        function loadRawProject(data) {
            console.log('loadRawProject ' + data);
            document.body.style.cursor = 'wait';
            allClear();
            var obj = JSON.parse(data);
            blocks.loadNewBlocks(obj);

            docById('loading-image-container').style.display = 'none';
            document.body.style.cursor = 'default';
        }

        function saveProject(projectName) {
            // palettes.updatePalettes();
            // Show busy cursor.
            document.body.style.cursor = 'wait';
            setTimeout(function() {
                var punctuationless = projectName.replace(/['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^`{|}~']/g, '');
                projectName = punctuationless.replace(/ /g, '_');
                if (fileExt(projectName) != 'tb') {
                    projectName += '.tb';
                }
                try {
                    // Post the project
                    var returnValue = httpPost(projectName, prepareExport());
                    errorMsg('Saved ' + projectName + ' to ' + window.location.host);

                    var img = new Image();
                    var svgData = doSVG(canvas, logo, turtles, 320, 240, 320 / canvas.width);
                    img.onload = function() {
                        var bitmap = new createjs.Bitmap(img);
                        var bounds = bitmap.getBounds();
                        bitmap.cache(bounds.x, bounds.y, bounds.width, bounds.height);
                        // and base64-encoded png
                        httpPost(projectName.replace('.tb', '.b64'), bitmap.getCacheDataURL());
                    }
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

            justLoadStart = function() {
                console.log('loading start');
                postProcess = function(thisBlock) {
                    blocks.blockList[0].x = 250;
                    blocks.blockList[0].y = 250;
                    blocks.blockList[0].connections = [null, null, null];
                    blocks.blockList[0].value = turtles.turtleList.length;
                    blocks.blockList[0].collapsed = false;
                    turtles.add(blocks.blockList[0]);
                    blocks.updateBlockPositions();
                }
                blocks.makeNewBlock('start', postProcess, null);
            }

            sessionData = null;
            // Try restarting where we were when we hit save.
            if (typeof(Storage) !== 'undefined') {
                // localStorage is how we'll save the session (and metadata)
                var currentProject = localStorage.currentProject;
                sessionData = localStorage['SESSION' + currentProject];
            }
            if (sessionData) {
                try {
                    if (sessionData == 'undefined' || sessionData == '[]') {
                        console.log('empty session found: loading start');
                        justLoadStart();
                    } else {
                        var i = 0;
                        var data = JSON.parse(sessionData);
                        
                        console.log("data "+data);    
                        console.log('restoring session: ' + sessionData);
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
            if (errorMsgArrow !== null) {
                errorMsgArrow.removeAllChildren();
                refreshCanvas();
            }
            msgText.parent.visible = false;
            for(var i in errorArtwork) {
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

            if (blk !== undefined && blk !== null
                && !blocks.blockList[blk].collapsed) {
                var fromX = (canvas.width - 1000) / 2;
                var fromY = 128;
                var toX = blocks.blockList[blk].x + blocksContainer.x;
                var toY = blocks.blockList[blk].y + blocksContainer.y;

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

        function pasteStack() {
            blocks.pasteStack();
        }

        function prepareExport() {
            // We don't save blocks in the trash, so we need to
            // consolidate the block list and remap the connections.
            var blockMap = [];
            for (var blk = 0; blk < blocks.blockList.length; blk++) {
                var myBlock = blocks.blockList[blk];
                if (myBlock.trash || myBlock.name.substring(0,15) == 'namedsavematrix') {
                    // Don't save blocks in the trash.
                    continue;
                }
                blockMap.push(blk);
            }

            var data = [];
            var workspaceaData = [];
            for (var blk = 0; blk < blocks.blockList.length; blk++) {
                var myBlock = blocks.blockList[blk];
                if (myBlock.trash || myBlock.name.substring(0,15) == 'namedsavematrix') {
                    // Don't save blocks in the trash.
                    connections = [];
                    for (var c = 0; c < myBlock.connections.length; c++) {
                        var mapConnection = blockMap.indexOf(myBlock.connections[c]);
                        if (myBlock.connections[c] == null || mapConnection == -1) {
                            connections.push(null);
                        } else {
                            connections.push(mapConnection);
                        }
                    }
                    workspaceaData.push([blockMap.indexOf(blk), [myBlock.name, args], myBlock.container.x, myBlock.container.y, connections]);

                    continue;
                }
                if (blocks.blockList[blk].isValueBlock() || blocks.blockList[blk].name == 'loadFile') {
                    // FIX ME: scale image if it exceeds a maximum size.
                    var args = {'value': myBlock.value};
                } else  if (myBlock.name == 'start') {
                    // It's a turtle.
                    turtle = turtles.turtleList[myBlock.value];
                    var args = {'collapsed': myBlock.collapsed,
                                'xcor': turtle.x,
                                'ycor': turtle.y,
                                'heading': turtle.orientation,
                                'color': turtle.color,
                                'shade': turtle.value,
                                'pensize': turtle.stroke,
                                'grey': turtle.chroma};
                } else if (myBlock.name == 'action') {
                    var args = {'collapsed': myBlock.collapsed}
                } else if (myBlock.name == 'namedbox') {
                    var args = {'value': myBlock.privateData}
                } else if (myBlock.name == 'nameddo') {
                    var args = {'value': myBlock.privateData}
                } else {
                    var args = {};
                }

                connections = [];
                for (var c = 0; c < myBlock.connections.length; c++) {
                    var mapConnection = blockMap.indexOf(myBlock.connections[c]);
                    if (myBlock.connections[c] == null || mapConnection == -1) {
                        connections.push(null);
                    } else {
                        connections.push(mapConnection);
                    }
                }
                data.push([blockMap.indexOf(blk), [myBlock.name, args], myBlock.container.x, myBlock.container.y, connections]);
            }
            return {"data" : JSON.stringify(data), "workspaceaData" : JSON.stringify(workspaceaData) };
        }

        function doOpenPlugin() {
            // Click on the plugin open chooser in the DOM (.json).
            pluginChooser.focus();
            pluginChooser.click();
        }

        function saveToFile() {
            var filename = prompt('Filename:');
            if (fileExt(filename) != 'tb') {
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
                if (myBlock.name == 'start')
                {
                    var topBlock = logo.blocks.findTopBlock(thisBlock);
                    console.log('Playing through Play Button');
                    logo.runLogoCommands(topBlock);
                } 
            }
        }

        function stopMusic(){
            logo.doStopTurtle();
            Tone.Transport.stop();

        }

        function updatePasteButton() {
            pasteContainer.removeChild(pasteContainer.children[0]);
            var img = new Image();
            img.onload = function() {
                var originalSize = 55; // this is the original svg size
                var halfSize = Math.floor(cellSize / 2);

                bitmap = new createjs.Bitmap(img);
                if (cellSize != originalSize) {
                    bitmap.scaleX = cellSize / originalSize;
                    bitmap.scaleY = cellSize / originalSize;
                }
                bitmap.regX = halfSize / bitmap.scaleX;
                bitmap.regY = halfSize / bitmap.scaleY;
                pasteContainer.addChild(bitmap)
                update = true;
            }
            img.src = 'icons/paste-button.svg';
        }

        function setupAndroidToolbar(showPalettesPopover) {
            if (headerContainer !== undefined) {
                stage.removeChild(headerContainer);
                for (i in onscreenButtons) {
                    stage.removeChild(onscreenButtons[i]);
                }
            }

            headerContainer = new createjs.Shape();
            headerContainer.graphics.f(platformColor.header).r(0, 0,
                screen.width / scale, cellSize);
            if (platformColor.doHeaderShadow) {
                headerContainer.shadow = new createjs.Shadow('#777', 0, 2, 2);
            }
            stage.addChild(headerContainer);

            // Buttons used when running turtle programs
            var buttonNames = [
                /*['fast', doFastButton],
                ['slow', doSlowButton],
                ['step', doStepButton],
                ['stop-turtle', doStopButton],*/
                ['clear', allClear],
                ['palette', changePaletteVisibility],
                ['hide-blocks', changeBlockVisibility],
                ['collapse-blocks', toggleCollapsibleStacks],
                ['download', saveMusicNotations],//'save-notations'
                ['help', showHelp],
                ['play', playMusic],
                ['stop-turtle', stopMusic]
            ];

            if (showPalettesPopover) {
                buttonNames.unshift(['popdown-palette', doPopdownPalette])
            }

            var btnSize = cellSize;
            var x = Math.floor(btnSize / 2);
            var y = x;
            var dx = btnSize;
            var dy = 0;

            for (var name in buttonNames) {
                if ( buttonNames[name][0] == 'play')
                    x += Math.floor(screen.width / scale*0.5) - btnSize / 2;
                var container = makeButton(buttonNames[name][0] + '-button',
                    x, y, btnSize);
                loadButtonDragHandler(container, x, y, buttonNames[name][1]);
                onscreenButtons.push(container);

                if (buttonNames[name][0] == 'stop-turtle') {
                    stopTurtleContainer = container;
                    stopTurtleContainerX = x;
                    stopTurtleContainerY = y;
                }

                x += dx;
                y += dy;
            }

            //setupPlayButton();
            setupRightMenu(scale);
        }

        function setupPlayButton(){
              
        }

        function setupRightMenu(scale) {
            if (menuContainer !== undefined) {
                stage.removeChild(menuContainer);
                for (i in onscreenMenu) {
                    stage.removeChild(onscreenMenu[i]);
                }
            }

            // Misc. other buttons
            var menuNames = [
                ['planet', doOpenSamples],
                ['paste-disabled', pasteStack],
                ['utility', doUtilityBox],
                ['empty-trash', deleteBlocksBox],
                ['restore-trash', restoreTrash]
            ];

            var btnSize = cellSize;
            var x = Math.floor(canvas.width / scale) - btnSize / 2;
            var y = Math.floor(btnSize / 2);

            var dx = 0;
            var dy = btnSize;

            menuContainer = makeButton('menu-button', x, y, btnSize,
                                       menuButtonsVisible? 90 : undefined);
            loadButtonDragHandler(menuContainer, x, y, doMenuButton);

            for (var name in menuNames) {
                x += dx;
                y += dy;
                var container = makeButton(menuNames[name][0] + '-button',
                    x, y, btnSize);
                loadButtonDragHandler(container, x, y, menuNames[name][1]);
                onscreenMenu.push(container);
                container.visible = false;
            }

            if (menuButtonsVisible) {
                for (button in onscreenMenu) {
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

                    helpContainer.on('click', function(event) {
                        var bounds = helpContainer.getBounds();
                        if (event.stageY < helpContainer.y + bounds.height / 2) {
                            helpContainer.visible = false;
                            docById('helpElem').style.visibility = 'hidden';
                        } else {
                            helpIdx += 1;
                            if (helpIdx >= HELPCONTENT.length) {
                                helpIdx = 0;
                            }
                            var imageScale = 55 * scale; 
                            helpElem.innerHTML = '<img src ="' + HELPCONTENT[helpIdx][2] + '" style="height:' + imageScale + 'px; width: auto"></img> <h2>' + HELPCONTENT[helpIdx][0] + '</h2><p>' + HELPCONTENT[helpIdx][1] + '</p>'
                        }
                        update = true;
                    });

                    var img = new Image();
                    img.onload = function() {
                        // console.log(scale);
                        bitmap = new createjs.Bitmap(img);
                        if (scale > 1) {
                            bitmap.scaleX = bitmap.scaleY = bitmap.scale = scale;
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

                        docById('helpElem').innerHTML = '<img src ="' + HELPCONTENT[helpIdx][2] + '"</img> <h2>' + HELPCONTENT[helpIdx][0] + '</h2><p>' + HELPCONTENT[helpIdx][1] + '</p>'
                        if (!doneTour) {
                            docById('helpElem').style.visibility = 'visible';
                        }
                        update = true;
                    }

                    img.src = 'images/help-container.svg';
                }

                var helpElem = docById('helpElem');
                helpElem.style.position= 'absolute';
                helpElem.style.display = 'block';
                helpElem.style.paddingLeft = 20 * scale + 'px';
                helpElem.style.paddingRight = 20 * scale + 'px';
                helpElem.style.paddingTop = '0px';
                helpElem.style.paddingBottom = 20 * scale + 'px';
                helpElem.style.fontSize = 20 * scale + 'px';
                helpElem.style.color = '#ffffff';
                helpElem.style.left = 65 * scale + 'px';
                helpElem.style.top = 105 * scale + 'px';
                var w = Math.min(300, 300 * scale);
                var h = Math.min(300, 300 * scale);
                helpElem.style.width = w + 'px';
                helpElem.style.height = h + 'px';

                if (scale > 1) {
                    bitmap.scaleX = bitmap.scaleY = bitmap.scale = scale;
                }
            }

            var doneTour = localStorage.doneTour === 'true';

            if (firstTime && doneTour) {
                docById('helpElem').style.visibility = 'hidden';
                helpContainer.visible = false;
            } else {
                localStorage.doneTour = 'true';
                docById('helpElem').innerHTML = '<img src ="' + HELPCONTENT[helpIdx][2] + '"</img> <h2>' + HELPCONTENT[helpIdx][0] + '</h2><p>' + HELPCONTENT[helpIdx][1] + '</p>'
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
            if (bitmap !== null) {
                var r = bitmap.rotation;
                createjs.Tween.get(bitmap)
                    .to({rotation: r})
                    .to({rotation: r + 90}, 500);
            } else {
                // Race conditions during load
                setTimeout(doMenuAnimation, 50);
            }
            setTimeout(function() {
                if (menuButtonsVisible) {
                    menuButtonsVisible = false;
                    for (button in onscreenMenu) {
                        onscreenMenu[button].visible = false;
                    }
                } else {
                    menuButtonsVisible = true;
                    for (button in onscreenMenu) {
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
            for (button in onscreenButtons) {
                onscreenButtons[button].visible = buttonsVisible;
            }
            for (button in onscreenMenu) {
                onscreenMenu[button].visible = buttonsVisible;
            }
            update = true;
        }

        function makeButton(name, x, y, size, rotation) {
            var container = new createjs.Container();
            if (name == 'paste-disabled-button') {
                pasteContainer = container;
            }

            stage.addChild(container);
            container.x = x;
            container.y = y;

            var img = new Image();

            img.onload = function() {
                var originalSize = 55; // this is the original svg size
                var halfSize = Math.floor(size / 2);

                bitmap = new createjs.Bitmap(img);
                if (size != originalSize) {
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
            }

            img.src = 'icons/' + name + '.svg';

            return container;
        }

        function loadButtonDragHandler(container, ox, oy, action) {
            // Prevent multiple button presses (i.e., debounce).
            var locked = false;

            container.on('mousedown', function(event) {
                var moved = true;
                var offset = {
                    x: container.x - Math.round(event.stageX / blocks.scale),
                    y: container.y - Math.round(event.stageY / blocks.scale)
                };

                var circles = showButtonHighlight(ox, oy, cellSize / 2,
                                                  event, scale, stage);
                container.on('pressup', function(event) {
                    hideButtonHighlight(circles, stage);

                    container.x = ox;
                    container.y = oy;
                    if (action != null && moved && !locked) {
                        locked = true;
                        setTimeout(function() {
                            locked = false;
                        }, 500);
                        action();
                    }
                    moved = false;
                });
            });
        }

        function clearMenus(){
            if (headerContainer !== undefined) {
                stage.removeChild(headerContainer);
                for (i in onscreenButtons) {
                    stage.removeChild(onscreenButtons[i]);
                }
            }

            if (menuContainer !== undefined) {
                stage.removeChild(menuContainer);
                for (i in onscreenMenu) {
                    stage.removeChild(onscreenMenu[i]);
                }
            }

        }
        function doOpenWorkspaceAssemble(){
            //window.location.pathname = "/Music-Blocks/workspacea.html";
            //var workspacea = null;
            workspace = true;
            assemble = new Assemble(palettes, matrix, canvas, blocks, turtles, turtleContainer, prepareExport, saveLocally, menuContainer);
            //assemble.deleteBlocks();
            assemble.clearAll();
            clearMenus();
        }


        function doOpenHome(){
            restoreHome();
            palettes.dict['assemble'].hide();

        }

        function restoreHome(){

            setupAndroidToolbar();
            blocks.show();
            for (var b = 0; b < blocks.blockList.length; b++) {
            var blk = blocks.blockList[b];
            if(blk.name == "forever" || blk.name == 'repeat' || blk.name == 'chunkTranspose')
            {   
                blocks.blockList[b].trash = true;
                blocks.blockList[b].hide();
            }
            blocks.refreshCanvas();
            palettes.show();
    }


        }
        function makeWorkspaces(){
                if (workspaceContainer !== undefined) {
                stage.removeChild(workspaceContainer);
                
            }

            // Misc. other buttons
            var workspaceNames = [
                ['a', doOpenHome],
                ['b', doOpenWorkspaceAssemble]  
            ];

            var btnSize = cellSize;
            var x = Math.floor(canvas.width / scale) - btnSize / 2 - 100;
            var y = Math.floor(canvas.height / scale) - btnSize / 2;//Math.floor(btnSize / 2);

            var dx = 50;
            var dy = 0;

            for (var name in workspaceNames) {
                x += dx;
                y += dy;
                var container = makeButton(workspaceNames[name][0] + '-button',
                    x, y, btnSize);
                loadButtonDragHandler(container, x, y, workspaceNames[name][1]);
                //onscreenMenu.push(container);
                container.visible = true;
            }

            
        }
        makeWorkspaces();
        //}
    });
});
