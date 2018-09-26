// Copyright (c) 2014-18 Walter Bender
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

const _ERRORMSGTIMEOUT_ = 15000;

const LEADING = 0;

if (_THIS_IS_TURTLE_BLOCKS_) {
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
            js.src = 'https://connect.facebook.net/en_US/sdk.js';
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    } catch (e) {
    };
}

if (_THIS_IS_MUSIC_BLOCKS_) {
    try {
        // console.log(localStorage.beginnerMode);

        if (localStorage.beginnerMode !== null) {
            // console.log('setting mode from local storage');
            // console.log(localStorage.beginnerMode);
            beginnerMode = localStorage.beginnerMode;
            if (typeof(beginnerMode) === 'string') {
                if (beginnerMode === 'false') {
                    beginnerMode = false;
                } else {
                    beginnerMode = true;
                }
            }
        } else {
            beginnerMode = true;
        }
    } catch (e) {
        console.log(e);
        beginnerMode = true;
    }
} else {
    beginnerMode = false;
}

if (beginnerMode) {
    console.log('BEGINNER MODE');
} else {
    console.log('ADVANCED MODE');
}

try {
    console.log(localStorage.languagePreference);

    if (localStorage.languagePreference) {
        console.log('setting language from local storage');
        try {
            lang = localStorage.languagePreference;
            document.webL10n.setLanguage(lang);
        } catch (e) {
            console.log(e);
        }
    } else {
        var lang = document.webL10n.getLanguage();
        if (lang.indexOf('-') !== -1) {
            lang = lang.slice(0, lang.indexOf('-'));
            document.webL10n.setLanguage(lang);
        }
    }
} catch (e) {
    console.log(e);
}

var MYDEFINES = [
    'activity/sugarizer-compatibility',
    'utils/platformstyle',
    'easeljs.min',
    'tweenjs.min',
    'preloadjs.min',
    'howler',
    'p5.min',
    'p5.sound.min',
    'p5.dom.min',
    'mespeak',
    'Chart',
    'utils/utils',
    'activity/artwork',
    'widgets/status',
    'widgets/help',
    'utils/munsell',
    'activity/trash',
    'activity/boundary',
    'activity/turtle',
    'activity/palette',
    'activity/protoblocks',
    'activity/blocks',
    'activity/block',
    'activity/turtledefs',
    'activity/logo',
    // 'activity/clearbox',
    'activity/savebox',
    'activity/languagebox',
    // 'activity/utilitybox',
    'activity/basicblocks',
    'activity/blockfactory',
    'activity/rubrics',
    'activity/macros',
    'activity/SaveInterface',
    'utils/musicutils',
    'utils/synthutils',
    // 'activity/playbackbox',
    'activity/pastebox',
    'prefixfree.min'
];

if (_THIS_IS_MUSIC_BLOCKS_) {
    var MUSICBLOCKS_EXTRAS = [
        'Tone.min',
        'widgets/modewidget',
        'widgets/pitchtimematrix',
        'widgets/pitchdrummatrix',
        'widgets/rhythmruler',
        'widgets/pitchstaircase',
        'widgets/tempo',
        'widgets/pitchslider',
        'widgets/timbre',
        'activity/lilypond',
        'activity/abc'
    ];
    MYDEFINES = MYDEFINES.concat(MUSICBLOCKS_EXTRAS);
}

define(MYDEFINES, function (compatibility) {

    // Manipulate the DOM only when it is ready.
    require(['domReady!','activity/sugarizer-compatibility'], function (doc) {
        if (sugarizerCompatibility.isInsideSugarizer()) {
            window.addEventListener('localized', function () {
                sugarizerCompatibility.loadData(function () {
                    var planet=document.getElementById('planet-iframe');
                    planet.onload = function() {
                        console.log('load');
                        domReady(doc);
                    };
                });
            });

            document.webL10n.setLanguage(sugarizerCompatibility.getLanguage());
        } else {
            console.log('loaded');
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
            if (sugarizerCompatibility.isInsideSugarizer()) {
                lang = sugarizerCompatibility.getLanguage();
            }

            if (['es', 'ca', 'de', 'el', 'eo', 'fi', 'fr', 'hu', 'it', 'kn', 'la', 'lv', 'nl', 'pl', 'pt', 'ro', 'sk', 'sv', 'tr', 'zh'].indexOf(lang) !== -1) {
                meSpeak.loadVoice('lib/voices/' + lang + '.json');
            } else {
                meSpeak.loadVoice('lib/voices/en/en.json');
            }
        } catch (e) {
            console.log(e);
        }

        document.title = TITLESTRING;

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
        var mousestage;
        var stage;
        var turtles;
        var palettes;
        var blocks;
        var logo;
        // var clearBox;
        var pasteBox;
        var utilityBox;
        var languageBox = null;
        // var playbackBox = null;
        var planet;
        window.converter;
        var storage;
        var buttonsVisible = true;
        var headerContainer = null;
        var swiping = false;
        var menuButtonsVisible = false;
        var menuContainer = null;
        var scrollBlockContainer = false;
        var currentKeyCode = 0;
        var pasteContainer = null;
        var pasteImage = null;
        // For updatePasteButton function
        var bitmapActivePaste, bitmapDisablePaste;
        var gridContainer = null;
        var gridButtonLabel = null;
        var gridImages = [];
        var chartBitmap = null;
        // var saveBox;
        var merging = false;
        var loading = false;
        // For auxillary menus
        var utilityContainer = null;
        var beginnerModeContainer = null;
        var advancedModeContainer = null;
        var languageContainer = null;
        var smallerContainer = null;
        var largerContainer = null;
        var smallerOffContainer = null;
        var largerOffContainer = null;
        var pluginsContainer = null;
        var deletePluginContainer = null;
        var statusContainer = null;
        var scrollOnContainer = null;
        var scrollOffContainer = null;
        var newContainer = null;
        var confirmContainer = null;        
        var saveContainer = null;
        var saveHTMLContainer = null;
        var saveSVGContainer = null;
        var savePNGContainer = null;
        var saveWAVContainer = null;
        var uploadContainer = null;
        var saveLilypondContainer = null;
        var saveABCContainer = null;
        var saveArtworkContainer = null;
        var planetContainer = null;
        var restoreContainer = null;
        var openContainer = null;

        var searchWidget = docById('search');
        searchWidget.style.visibility = 'hidden';

        var progressBar = docById('myProgress');
        progressBar.style.visibility = 'hidden';

        new createjs.DOMElement(docById('paste'));
        var paste = docById('paste');
        paste.style.visibility = 'hidden';

        closeContextWheel = function () {
            // docById('contextWheelDiv').style.display = 'none';
        };

        // Do something on right click
        document.addEventListener("contextmenu", function(event) {
            stageX = event.x;
            stageY = event.y;

            event.preventDefault();
            event.stopPropagation();

            blocks.stageClick = true;

            if (blocks.activeBlock === null) {
                // Stage context menu
                // _piemenuStageContext();
            } else {
                // Block context menu
                // Would be better to trigger this from the block
                // container, but it doesn't seem to work from there.
                var activeBlock = blocks.activeBlock;
                piemenuBlockContext(activeBlock);
            }
        }, false);

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
            'MACROPLUGINS': {},
            'ONLOAD': {},
            'ONSTART': {},
            'ONSTOP': {}
        };

        // Stacks of blocks saved in local storage
        var macroDict = {};

        var stopTurtleContainer = null;
        var hardStopTurtleContainer = null;
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
        // var utilityButton = null;
        // var playbackButton = null;
        // var saveButton = null;
        // var deleteAllButton = null;

        var firstRun = true;

        pluginsImages = {};

        window.onblur = function () {
            doHardStopButton(true);
        };

        function _findBlocks() {
            var leftpos = Math.floor(canvas.width / 4);
            var toppos = 90;
            blocks.activeBlock = null;
            hideDOMLabel();
            logo.showBlocks();
            blocksContainer.x = 0;
            blocksContainer.y = 0;
            palettes.updatePalettes();
            var x = Math.floor(leftpos * turtleBlocksScale);
            var y = Math.floor(toppos * turtleBlocksScale);
            var even = true;

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

                        x += Math.floor(150 * turtleBlocksScale);
                        if (x > (canvas.width * 7 / 8) / (turtleBlocksScale)) {
                            even = !even;
                            if (even) {
                                x = Math.floor(leftpos);
                            } else {
                                x = Math.floor(leftpos + STANDARDBLOCKHEIGHT);
                            }

                            y += STANDARDBLOCKHEIGHT;
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
                        x += 150 * turtleBlocksScale;
                        if (x > (canvas.width * 7 / 8) / (turtleBlocksScale)) {
                            even = !even;
                            if (even) {
                                x = Math.floor(leftpos);
                            } else {
                                x = Math.floor(leftpos + STANDARDBLOCKHEIGHT);
                            }

                            y += STANDARDBLOCKHEIGHT;
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
            blocks.activeBlock = null;
            var startCounter = 0;
            var svg = '';
            var xMax = 0;
            var yMax = 0;
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

                if (blocks.blockList[i].inCollapsed) {
                    continue;
                }

                if (blocks.blockList[i].container.x + blocks.blockList[i].width > xMax) {
                    xMax = blocks.blockList[i].container.x + blocks.blockList[i].width;
                }

                if (blocks.blockList[i].container.y + blocks.blockList[i].height > yMax) {
                    yMax = blocks.blockList[i].container.y + blocks.blockList[i].height;
                }

                if (blocks.blockList[i].collapsed) {
                    var parts = blocks.blockCollapseArt[i].split('><');
                } else {
                    var parts = blocks.blockArt[i].split('><');
                }

                if (blocks.blockList[i].isCollapsible()) {
                    svg += '<g>';
                }

                svg += '<g transform="translate(' + blocks.blockList[i].container.x + ', ' + blocks.blockList[i].container.y + ')">';
                if (SPECIALINPUTS.indexOf(blocks.blockList[i].name) !== -1) { 
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
                } else {
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
                }

                svg += '</g>';

                if (blocks.blockList[i].isCollapsible()) {
                    if (INLINECOLLAPSIBLES.indexOf(blocks.blockList[i].name) !== -1) {
                        var y = blocks.blockList[i].container.y + 4;
                    } else {
                        var y = blocks.blockList[i].container.y + 12;
                    }

                    svg += '<g transform="translate(' + blocks.blockList[i].container.x + ', ' + y + ') scale(0.5 0.5)">';
                    if (blocks.blockList[i].collapsed) {
                        var parts = EXPANDBUTTON.split('><');
                    } else {
                        var parts = COLLAPSEBUTTON.split('><');
                    }

                    for (var p = 2; p < parts.length - 1; p++) {
                        svg += '<' +  parts[p] + '>';
                    }

                    svg += '</g>';
                }

                if (blocks.blockList[i].name === 'start') {
                    var x = blocks.blockList[i].container.x + 110;
                    var y = blocks.blockList[i].container.y + 12;
                    svg += '<g transform="translate(' + x + ', ' + y + ') scale(0.4 0.4)">';

                    var parts = TURTLESVG.replace(/fill_color/g, FILLCOLORS[startCounter]).replace(/stroke_color/g, STROKECOLORS[startCounter]).split('><');

                    startCounter += 1;
                    if (startCounter > 9) {
                        startCounter = 0;
                    }

                    for (var p = 2; p < parts.length - 1; p++) {
                        svg += '<' +  parts[p] + '>';
                    }

                    svg += '</g>';
                }

                if (blocks.blockList[i].isCollapsible()) {
                    svg += '</g>';
                }
            }

            svg += '</svg>';

            return '<svg xmlns="http://www.w3.org/2000/svg" width="' + xMax + '" height="' + yMax + '">' + encodeURIComponent(svg);
        };

        function _allClear() {
            blocks.activeBlock = null;
            hideDOMLabel();

            if (chartBitmap != null) {
                stage.removeChild(chartBitmap);
                chartBitmap = null;
            }

            logo.boxes = {};
            logo.time = 0;
            hideMsgs();
            logo.setBackgroundColor(-1);
            logo.notationOutput = '';
            for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                logo.turtleHeaps[turtle] = [];
                logo.notationStaging[turtle] = [];
                logo.notationDrumStaging[turtle] = [];
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

            var table = docById('myTable');
            if(table != null) {
                table.remove();
            }
        };

        function _doFastButton(env) {
            blocks.activeBlock = null;
            hideDOMLabel();

            stage.on('stagemousemove', function (event) {
                stageX = event.stageX;
                stageY = event.stageY;
            });

            var currentDelay = logo.turtleDelay;
            var playingWidget = false;
            logo.setTurtleDelay(0);
            if (_THIS_IS_MUSIC_BLOCKS_) {
                logo.synth.resume();

                if (docById('ptmDiv').style.visibility === 'visible') {
                    playingWidget = true;
                    logo.pitchTimeMatrix.playAll();
                }

                if (docById('pscDiv').style.visibility === 'visible') {
                    playingWidget = true;
                    logo.pitchStaircase.playUpAndDown();
                }

                if (docById('rulerDiv').style.visibility === 'visible') {
                    // If the tempo widget is open, sync it up with the
                    // rhythm ruler.
                    if (docById('tempoDiv').style.visibility === 'visible') {
                        if (logo.tempo.isMoving) {
                            logo.tempo.pause();
                        }

                        logo.tempo.resume();
                    }

                    playingWidget = true;
                    logo.rhythmRuler.playAll();
                }

                // We were using the run button to play a widget, not
                // the turtles.
                if (playingWidget) {
                    return;
                }

                // Restart tempo widget and run blocks.
                if (docById('tempoDiv').style.visibility === 'visible') {
                    if (logo.tempo.isMoving) {
                        logo.tempo.pause();
                    }

                    logo.tempo.resume();
                }
            }

            if (!turtles.running()) {
                console.log('running');
                logo.hideBlocks(true);
                logo.runLogoCommands(null, env);
            } else {
                if (currentDelay !== 0) {
                    // keep playing at full speed
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
            blocks.activeBlock = null;
            hideDOMLabel();

            stage.on('stagemousemove', function (event) {
                stageX = event.stageX;
                stageY = event.stageY;
            });

            logo.setTurtleDelay(DEFAULTDELAY);
            if (_THIS_IS_MUSIC_BLOCKS_) {
                logo.synth.resume();
            }

            if (_THIS_IS_MUSIC_BLOCKS_ && docById('ptmDiv').style.visibility === 'visible') {
                logo.pitchTimeMatrix.playAll();
            } else if (!turtles.running()) {
                logo.runLogoCommands();
            } else {
                logo.step();
            }
        };

        function _doStepButton() {
            blocks.activeBlock = null;
            hideDOMLabel();

            stage.on('stagemousemove', function (event) {
                stageX = event.stageX;
                stageY = event.stageY;
            });

            var turtleCount = Object.keys(logo.stepQueue).length;
            if (_THIS_IS_MUSIC_BLOCKS_) {
                logo.synth.resume();
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
            blocks.activeBlock = null;
            hideDOMLabel();

            stage.on('stagemousemove', function (event) {
                stageX = event.stageX;
                stageY = event.stageY;
            });

            logo.setNoteDelay(DEFAULTDELAY);
            if (_THIS_IS_MUSIC_BLOCKS_) {
                logo.synth.resume();
            }

            if (docById('ptmDiv').style.visibility === 'visible') {
                logo.pitchTimeMatrix.playAll();
            } else if (!turtles.running()) {
                logo.runLogoCommands();
            } else {
                logo.stepNote();
            }
        };

        function _doStepMusicButton() {
            blocks.activeBlock = null;
            hideDOMLabel();

            stage.on('stagemousemove', function (event) {
                stageX = event.stageX;
                stageY = event.stageY;
            });

            var turtleCount = Object.keys(logo.stepQueue).length;
            if (_THIS_IS_MUSIC_BLOCKS_) {
                logo.synth.resume();
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

        function doHardStopButton(onblur) {
            blocks.activeBlock = null;
            hideDOMLabel();

            if (onblur == undefined) {
                onblur = false;
            }

            if (onblur && _THIS_IS_MUSIC_BLOCKS_ && logo.recordingStatus()) {
                console.log('ignoring hard stop due to blur');
                return;
            }

            logo.doStopTurtle();

            if (_THIS_IS_MUSIC_BLOCKS_) {
                logo._setMasterVolume(0);

                if (docById('tempoDiv') != null && docById('tempoDiv').style.visibility === 'visible') {
                    if (logo.tempo.isMoving) {
                        logo.tempo.pause();
                    }
                }
            }
        };

        function doSwitchMode() {
            blocks.activeBlock = null;
            if (beginnerMode) {
                textMsg(_('Refresh your browser to change to advanced mode.'));
                localStorage.setItem('beginnerMode', false);
                beginnerModeContainer.visible = false;
                advancedModeContainer.visible = true;
            } else {
                textMsg(_('Refresh your browser to change to beginner mode.'));
                localStorage.setItem('beginnerMode', true);
                beginnerModeContainer.visible = true;
                advancedModeContainer.visible = false;
            }

            refreshCanvas();
        };

        function doStopButton() {
            blocks.activeBlock = null;
            logo.doStopTurtle();
        };

        function doMuteButton() {
            logo._setMasterVolume(0);
        };

        function _hideBoxes() {
            blocks.activeBlock = null;
            hideDOMLabel();

            pasteBox.hide();
            // clearBox.hide();
            // saveBox.hide();
            languageBox.hide();
            // utilityBox.hide();
            // playbackBox.hide();
        };

        function _doCartesianPolar() {
            blocks.activeBlock = null;
            closeSubMenus();
            if (cartesianBitmap.visible && polarBitmap.visible) {
                _hideCartesian();
                //.TRANS: hide Polar coordinate overlay grid
                gridButtonLabel.text = _('hide grid');
                gridImages[1].visible = false;
                gridImages[2].visible = false;
                gridImages[3].visible = true;
            } else if (!cartesianBitmap.visible && polarBitmap.visible) {
                _hidePolar();
                //.TRANS: show Cartesian coordinate overlay grid
                gridButtonLabel.text = _('Cartesian');
                gridImages[1].visible = false;
                gridImages[2].visible = false;
                gridImages[3].visible = false;
            } else if (!cartesianBitmap.visible && !polarBitmap.visible) {
                _showCartesian();
                gridButtonLabel.text = _('Cartesian') + ' + ' + _('Polar');
                gridImages[1].visible = true;
                gridImages[2].visible = false;
                gridImages[3].visible = false;
            } else if (cartesianBitmap.visible && !polarBitmap.visible) {
                _showPolar();
                //.TRANS: show Polar coordinate overlay grid
                gridButtonLabel.text = _('Polar');
                gridImages[1].visible = false;
                gridImages[2].visible = true;
                gridImages[3].visible = false;
            }

            update = true;
        };

        function setScroller(state) {
            blocks.activeBlock = null;
            scrollBlockContainer = state;
            setScrollerButton();
        };

        function setScrollerButton() {
            if (scrollBlockContainer) {
                scrollOffContainer.visible = true;
                scrollOnContainer.visible = false;
            } else {
                scrollOffContainer.visible = false;
                scrollOnContainer.visible = true;
            }

            refreshCanvas();
        };

        function closeAnalytics(chartBitmap, ctx) {
            blocks.activeBlock = null;
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
            beginnerModeContainer.visible = false;
            advancedModeContainer.visible = false;
            languageContainer.visible = false;
            smallerContainer.visible = false;
            largerContainer.visible = false;
            smallerOffContainer.visible = false;
            largerOffContainer.visible = false;
            pluginsContainer.visible = false;
            deletePluginContainer.visible = false;
            statsContainer.visible = false;
            scrollOnContainer.visible = false;
            scrollOffContainer.visible = false;
            deltaY(-55 - LEADING);
            _showHideAuxMenu(false);

            blocks.activeBlock = null;
            var myChart = docById('myChart');

             if(_isCanvasBlank(myChart) == false) {
                return ;
             }

            var ctx = myChart.getContext('2d');
            loading = true;
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
                    loading = false;
                    Analytics.close(chartBitmap, ctx);
                };
                img.src = imageData;
            };

            var options = getChartOptions(__callback);
            console.log('creating new chart');
            myRadarChart = new Chart(ctx).Radar(data, options);
        };

        function doOptimize (state) {
            blocks.activeBlock = null;
            console.log('Setting optimize to ' + state);
            logo.setOptimize(state);
        };

        function doLargerBlocks() {
            blocks.activeBlock = null;
            // hideDOMLabel();

            if (blockscale < BLOCKSCALES.length - 1) {
                blockscale += 1;
                blocks.setBlockScale(BLOCKSCALES[blockscale]);
            }

            setSmallerLargerStatus();
        };

        function doSmallerBlocks() {
            blocks.activeBlock = null;
            // hideDOMLabel();

            if (blockscale > 0) {
                blockscale -= 1;
                blocks.setBlockScale(BLOCKSCALES[blockscale]);
            }

            setSmallerLargerStatus();
        };

        function setSmallerLargerStatus() {
            if (BLOCKSCALES[blockscale] > 1) {
                // utilityBox._decreaseStatus = true;
                smallerContainer.visible = true;
                smallerOffContainer.visible = false;
            } else {
                smallerOffContainer.visible = true;
                smallerContainer.visible = false;
                // utilityBox._decreaseStatus = false;
            }

            if (BLOCKSCALES[blockscale] == 4) {
                // utilityBox._increaseStatus = false;
                largerOffContainer.visible = true;
                largerContainer.visible = false;
            } else {
                // utilityBox._increaseStatus = true;
                largerContainer.visible = true;
                largerOffContainer.visible = false;
            }
        };

        function deletePlugin() {
            blocks.activeBlock = null;
            if (palettes.paletteObject !== null) {
                palettes.paletteObject._promptPaletteDelete();
            }
        };

        function getPlaybackQueueStatus () {
            return Object.keys(logo.playbackQueue).length > 0;
        };

        function setPlaybackStatus () {
            // if (playbackBox != null) {
            //     playbackBox.setPlaybackStatus();
            // }
        };

        function doPausePlayback () {
            blocks.activeBlock = null;
            logo.restartPlayback = false;
            logo.playback(-1);
            // playbackBox.playButton.visible = true;
            // playbackBox.pauseButton.visible = false;
        };

        function doPlayback() {
            blocks.activeBlock = null;
            progressBar.style.visibility = 'visible';
            progressBar.style.left = (playbackBox.getPos()[0] + 10) * turtleBlocksScale + 'px';
            progressBar.style.top = (playbackBox.getPos()[1] + 10) * turtleBlocksScale + 'px';
            logo.playback(-1);
            // playbackBox.playButton.visible = false;
            // playbackBox.pauseButton.visible = true;
            // playbackBox.norewindButton.visible = false;
            // playbackBox.rewindButton.visible = true;
        };

        function doRestartPlayback() {
            blocks.activeBlock = null;
            logo.doStopTurtle();
            logo.restartPlayback = true;
            
            /*
            setTimeout(function () {
                // logo.playback(-1);
                playbackBox.playButton.visible = true;
                playbackBox.pauseButton.visible = false;
                playbackBox.norewindButton.visible = true;
                playbackBox.rewindButton.visible = false;
            }, 500);
            */
        };

        function doCompile() {
            blocks.activeBlock = null;
            logo.restartPlayback = true;
            document.body.style.cursor = 'wait';
            console.log('Compiling music for playback');

            // Suppress music and turtle output when generating
            // compiled output.
            logo.setTurtleDelay(0);  // Compile at full speed.
            logo.playbackQueue = {};
            logo.playbackTime = 0;
            logo.compiling = true;
            logo.runLogoCommands();
        };

        var saveLocally;

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
        var errorMsgTimeoutID = null;
        var errorArtwork = {};
        const ERRORARTWORK = ['emptybox', 'emptyheap', 'negroot', 'noinput', 'zerodivide', 'notanumber', 'nostack', 'notastring', 'nomicrophone'];

        // Get things started
        init();

        function init() {
            if (sugarizerCompatibility.isInsideSugarizer()) {
                //sugarizerCompatibility.data.blocks = prepareExport();
                storage = sugarizerCompatibility.data;
            } else {
                storage = localStorage;
            }

            docById('loader').className = 'loader';

            stage = new createjs.Stage(canvas);
            createjs.Touch.enable(stage);

            createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
            createjs.Ticker.framerate = 30;
            // createjs.Ticker.addEventListener('tick', stage);
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
            /*
            console.log(turtleContainer);
            turtleContainer.scaleX = 0.5;
            turtleContainer.scaleY = 0.5;
            turtleContainer.x = 100;
            turtleContainer.y = 100;
            */
            stage.addChild(turtleContainer);
            stage.addChild(trashContainer, blocksContainer, palettesContainer);
            _setupBlocksContainerEvents();

            trashcan = new Trashcan();
            trashcan
                .setCanvas(canvas)
                .setStage(trashContainer)
                .setSize(cellSize)
                .setRefreshCanvas(refreshCanvas)
                .init();

            // Put the boundary in the turtles container so it scrolls
            // with the blocks.
            turtles = new Turtles();
            turtles
                .setCanvas(canvas)
                .setHideMenu(hideAuxMenu)
                .setMasterStage(stage)
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
                .setSetPlaybackStatus(setPlaybackStatus)
                .setErrorMsg(errorMsg)
                .setContextMenu(piemenuBlockContext);
            blocks.makeCopyPasteButtons(_makeButton, updatePasteButton);

            turtles.setBlocks(blocks);

            palettes = new Palettes();
            palettes
                .setCanvas(canvas)
                .setStage(palettesContainer)
                .setRefreshCanvas(refreshCanvas)
                .setSize(cellSize)
                .setTrashcan(trashcan)
                .setSearch(showSearchWidget, hideSearchWidget)
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
                .setSetPlaybackStatus(setPlaybackStatus);

            blocks.setLogo(logo);

            // Set the default background color...
            logo.setBackgroundColor(-1);

            pasteBox = new PasteBox();
            pasteBox
                .setCanvas(canvas)
                .setStage(stage)
                .setRefreshCanvas(refreshCanvas)
                .setPaste(paste);

            languageBox = new LanguageBox();
            languageBox
                .setCanvas(canvas)
                .setStage(stage)
                .setMessage(textMsg)
                .setRefreshCanvas(refreshCanvas);

            /*
            utilityBox = new UtilityBox();
            console.log(utilityBox);
            utilityBox
                .setStage(stage)
                .setRefreshCanvas(refreshCanvas)
                // .setLarger(doLargerFont)
                // .setSmaller(doSmallerFont)
                // .setPlugins(doOpenPlugin)
                // .deletePlugins(deletePlugin)
                // .setStats(doAnalytics)
                // .setScroller(setScroller)
                // .setLanguage(doLanguageBox, languageBox)
                // .setSwitchMode(doSwitchMode)
                .setOptimize(doOptimize);
            */
            /*
            playbackBox = new PlaybackBox();
            playbackBox
                .setStage(stage)
                .setRefreshCanvas(refreshCanvas)
                .setQueueStatus(getPlaybackQueueStatus)
                .setPlay(doPlayback)
                .setCompile(doCompile)
                .setPause(doPausePlayback)
                .setRewind(doRestartPlayback);
            */

            playbackOnLoad = function() {
                /*
                if (_THIS_IS_TURTLE_BLOCKS_) {
                    // Play playback queue if there is one.
                    for (turtle in logo.playbackQueue) {
                        if (logo.playbackQueue[turtle].length > 0) {
                            setTimeout(function () {
                                logo.playback(-1);
                            }, 3000);
                            break;
                        }
                    }
                }
                */
            };

            function PlanetInterface(storage) {
                this.planet = null;
                this.iframe = null;
                this.mainCanvas = null;

                this.hideMusicBlocks = function() {
                    hideSearchWidget();
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        storage.setItem('isMatrixHidden', docById('ptmDiv').style.visibility);
                        storage.setItem('isStaircaseHidden', docById('pscDiv').style.visibility);
                        storage.setItem('isTimbreHidden', docById('timbreDiv').style.visibility);
                        storage.setItem('isPitchDrumMatrixHidden', docById('pdmDiv').style.visibility);
                        storage.setItem('isRhythmRulerHidden', docById('rulerDiv').style.visibility);
                        storage.setItem('isModeWidgetHidden', docById('modeDiv').style.visibility);
                        storage.setItem('isSliderHidden', docById('sliderDiv').style.visibility);
                        storage.setItem('isTempoHidden', docById('tempoDiv').style.visibility);

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

                        if (docById('timbreDiv').style.visibility !== 'hidden') {
                            docById('timbreDiv').style.visibility = 'hidden';
                            docById('timbreTableDiv').style.visibility = 'hidden';
                            docById('timbreButtonsDiv').style.visibility = 'hidden';
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

                    storage.setItem('isStatusHidden', docById('statusDiv').style.visibility);
                    logo.doStopTurtle();
                    docById('helpElem').style.visibility = 'hidden';
                    document.querySelector('.canvasHolder').classList.add('hide');
                    document.querySelector('#canvas').style.display = 'none';
                    document.querySelector('#theme-color').content = '#8bc34a';
                    setTimeout(function () {
                        // Time to release the mouse
                        stage.enableDOMEvents(false);
                    }, 250);
                    window.scroll(0, 0);
                }

                this.showMusicBlocks = function () {
                    docById('statusDiv').style.visibility = storage.getItem('isStatusHidden');
                    docById('statusButtonsDiv').style.visibility = storage.getItem('isStatusHidden');
                    docById('statusTableDiv').style.visibility = storage.getItem('isStatusHidden');

                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        docById('ptmDiv').style.visibility = storage.getItem('isMatrixHidden');
                        docById('ptmButtonsDiv').style.visibility = storage.getItem('isMatrixHidden');
                        docById('ptmTableDiv').style.visibility = storage.getItem('isMatrixHidden');
                        docById('pscDiv').style.visibility = storage.getItem('isStaircaseHidden');
                        docById('pscButtonsDiv').style.visibility = storage.getItem('isStaircaseHidden');
                        docById('pscTableDiv').style.visibility = storage.getItem('isStaircaseHidden');
                        docById('timbreDiv').style.visibility = storage.getItem('isTimbreHidden');
                        docById('timbreButtonsDiv').style.visibility = storage.getItem('isTimbreHidden');
                        docById('timbreTableDiv').style.visibility = storage.getItem('isTimbreHidden');
                        docById('sliderDiv').style.visibility = storage.getItem('isSliderHidden');
                        docById('sliderButtonsDiv').style.visibility = storage.getItem('isSliderHidden');
                        docById('sliderTableDiv').style.visibility = storage.getItem('isSliderHidden');
                        docById('pdmDiv').style.visibility = storage.getItem('isPitchDrumMatrixHidden');
                        docById('pdmButtonsDiv').style.visibility = storage.getItem('isPitchDrumMatrixHidden');
                        docById('pdmTableDiv').style.visibility = storage.getItem('isPitchDrumMatrixHidden');
                        docById('rulerDiv').style.visibility = storage.getItem('isRhythmRulerHidden');
                        docById('rulerButtonsDiv').style.visibility = storage.getItem('isRhythmRulerHidden');
                        docById('rulerTableDiv').style.visibility = storage.getItem('isRhythmRulerHidden');
                        docById('modeDiv').style.visibility = storage.getItem('isModeWidgetHidden');
                        docById('modeButtonsDiv').style.visibility = storage.getItem('isModeWidgetHidden');
                        docById('modeTableDiv').style.visibility = storage.getItem('isModeWidgetHidden');
                        // Don't reopen the tempo widget since we didn't just hide it, but also closed it.
                        // docById('tempoDiv').style.visibility = localStorage.getItem('isTempoHidden');
                        // docById('tempoButtonsDiv').style.visibility = localStorage.getItem('isTempoHidden');
                    }
                    document.querySelector('.canvasHolder').classList.remove('hide');
                    document.querySelector('#canvas').style.display = '';
                    document.querySelector('#theme-color').content = platformColor.header;
                    stage.enableDOMEvents(true);
                    window.scroll(0, 0);
                };

                this.showPlanet = function() {
                    this.planet.open(this.mainCanvas.toDataURL('image/png'));
                    this.iframe.style.display = 'block';
                    try {
                        this.iframe.contentWindow.document.getElementById('local-tab').click();
                    } catch (e) {
                        console.log(e);
                    }
                };

                this.hidePlanet = function() {
                    this.iframe.style.display = 'none';
                };

                this.openPlanet = function() {
                    console.log('save locally');
                    this.saveLocally();
                    this.hideMusicBlocks();
                    this.showPlanet();
                };

                this.closePlanet = function() {
                    this.hidePlanet();
                    this.showMusicBlocks();
                };

                this.loadProjectFromData = function(data, merge) {
                    if (merge===undefined) {
                        merge=false;
                    }

                    this.closePlanet();
                    if (!merge) {
                        sendAllToTrash(false, true);
                    }

                    if (data == undefined) {
                        console.log('loadRawProject: data is undefined... punting');
                        errorMsg('loadRawProject: project undefined');
                        return;
                    }

                    console.log('loadRawProject ' + data);
                    loading = true;
                    document.body.style.cursor = 'wait';
                    _allClear();

                    // First, hide the palettes as they will need updating.
                    for (var name in blocks.palettes.dict) {
                        blocks.palettes.dict[name].hideMenu(true);
                    }

                    var __afterLoad = function () {
                        // playbackOnLoad();
                        document.removeEventListener('finishedLoading', __afterLoad);
                    };

                    if (document.addEventListener) {
                        document.addEventListener('finishedLoading', __afterLoad);
                    } else {
                        document.attachEvent('finishedLoading', __afterLoad);
                    }

                    try {
                        var obj = JSON.parse(data);
                        logo.playbackQueue = {};
                        blocks.loadNewBlocks(obj);
                        setPlaybackStatus();


                    } catch (e) {
                        console.log('loadRawProject: could not parse project data');
                        errorMsg(e);
                    }

                    loading = false;
                    document.body.style.cursor = 'default';
                };

                this.loadProjectFromFile = function() {
                    console.log('OPEN');
                    document.querySelector('#myOpenFile').focus();
                    document.querySelector('#myOpenFile').click();
                    window.scroll(0, 0);
                };

                this.newProject = function() {
                    this.closePlanet();
                    this.initialiseNewProject();
                };

                this.initialiseNewProject = function(name) {
                    this.planet.ProjectStorage.initialiseNewProject(name);
                    blocks.trashStacks = [];
                    this.saveLocally();
                };

                this.saveLocally = function() {
                    console.log('overwriting session data');
                    var data = prepareExport();
                    var svgData = doSVG(canvas, logo, turtles, 320, 240, 320 / canvas.width);
                    if (svgData === null || svgData === '') {
                        this.planet.ProjectStorage.saveLocally(data, null);
                    } else {
                        var img = new Image();
                        var t = this;
                        img.onload = function () {
                            var bitmap = new createjs.Bitmap(img);
                            var bounds = bitmap.getBounds();
                            bitmap.cache(bounds.x, bounds.y, bounds.width, bounds.height);
                            try {
                                t.planet.ProjectStorage.saveLocally(data, bitmap.bitmapCache.getCacheDataURL());
                            } catch (e) {
                                console.log(e);
                            }
                        };
                        img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(svgData)));
                    }
                    //if (sugarizerCompatibility.isInsideSugarizer()) {
                    //    sugarizerCompatibility.saveLocally();
                    //}
                };

                this.openCurrentProject = function() {
                    return this.planet.ProjectStorage.getCurrentProjectData();
                };

                this.openProjectFromPlanet = function(id,error) {
                    this.planet.openProjectFromPlanet(id,error);
                };

                this.onConverterLoad = function() {
                    window.Converter = this.planet.Converter;
                };

                this.getCurrentProjectName = function() {
                    return this.planet.ProjectStorage.getCurrentProjectName();
                };

                this.getCurrentProjectDescription = function() {
                    return this.planet.ProjectStorage.getCurrentProjectDescription();
                };

                this.getCurrentProjectImage = function() {
                    return this.planet.ProjectStorage.getCurrentProjectImage();
                };

                this.getTimeLastSaved = function() {
                    return this.planet.ProjectStorage.TimeLastSaved;
                };

                this.init = function() {
                    this.iframe = document.getElementById('planet-iframe');
                    try {
                        this.iframe.contentWindow.makePlanet(_THIS_IS_MUSIC_BLOCKS_, storage);
                        this.planet = this.iframe.contentWindow.p;
                        this.planet.setLoadProjectFromData(this.loadProjectFromData.bind(this));
                        this.planet.setPlanetClose(this.closePlanet.bind(this));
                        this.planet.setLoadNewProject(this.newProject.bind(this));
                        this.planet.setLoadProjectFromFile(this.loadProjectFromFile.bind(this));
                        this.planet.setOnConverterLoad(this.onConverterLoad.bind(this));
                    } catch (e) {
                        console.log('Planet not available');
                        this.planet = null;
                    }

                    window.Converter = this.planet.Converter;
                    this.mainCanvas = canvas;
                };
            };

            try {
                planet = new PlanetInterface(storage);
                planet.init();
            } catch (e) {
                planet = undefined;
            }

            save = new SaveInterface(planet);
            save.setVariables([
                ['logo', logo],
                ['turtles', turtles],
                ['storage', storage],
                ['printBlockSVG', _printBlockSVG],
                ['planet', planet]
            ]);
            save.init();

            if (planet != undefined) {
                saveLocally = planet.saveLocally.bind(planet);
            } else {

                __saveLocally = function() {
                    console.log('overwriting session data (local)');
                    var data = prepareExport();
                    var svgData = doSVG(canvas, logo, turtles, 320, 240, 320 / canvas.width);

                    if (sugarizerCompatibility.isInsideSugarizer()) {
                        //sugarizerCompatibility.data.blocks = prepareExport();
                        storage = sugarizerCompatibility.data;
                    } else {
                        storage = localStorage;
                    }

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

                    var img = new Image();
                    var svgData = doSVG(canvas, logo, turtles, 320, 240, 320 / canvas.width);

                    img.onload = function () {
                        var bitmap = new createjs.Bitmap(img);
                        var bounds = bitmap.getBounds();
                        bitmap.cache(bounds.x, bounds.y, bounds.width, bounds.height);
                        try {
                            storage['SESSIONIMAGE' + p] = bitmap.bitmapCache.getCacheDataURL();
                        } catch (e) {
                            console.log(e);
                        }
                    };

                    img.src = 'data:image/svg+xml;base64,' +
                        window.btoa(unescape(encodeURIComponent(svgData)));
                    if (sugarizerCompatibility.isInsideSugarizer()) {
                        sugarizerCompatibility.saveLocally();
                    }
                }

                saveLocally = __saveLocally;
            }

            window.saveLocally = saveLocally;
            logo.setSaveLocally(saveLocally);

            /*
            saveBox = new SaveBox();
            if (planet) {
                var planetItem = ['_doSavePlanet', doUploadToPlanet];
            } else {
                var planetItem = ['_doSavePlanet', null];
            }

            saveBox.setVariables([
                ['_canvas', canvas],
                ['_stage', stage],
                ['_refreshCanvas', refreshCanvas],
                ['_doSaveHTML', save.saveHTML.bind(save)],
                ['_doSaveSVG', save.saveSVG.bind(save)],
                ['_doSavePNG', save.savePNG.bind(save)],
                ['_doSavePlanet', doUploadToPlanet],
                ['_doSaveBlockArtwork', save.saveBlockArtwork.bind(save)]
            ]);

            if (_THIS_IS_MUSIC_BLOCKS_) {
                saveBox.setVariables([
                    ['_doSaveWAV', save.saveWAV.bind(save)],
                    ['_doSaveAbc', save.saveAbc.bind(save)],
                    ['_doSaveLilypond', save.saveLilypond.bind(save)]
                ]);
            } else {
                saveBox.setVariables([
                    ['_doShareOnFacebook', doShareOnFacebook]
                ]);
            }
            */

            var __clearFunction = function () {
                sendAllToTrash(true, false);
                if (planet !== undefined) {
                    planet.initialiseNewProject.bind(planet);
                }
            };

            /*
            clearBox = new ClearBox();
            clearBox
                .setCanvas(canvas)
                .setStage(stage)
                .setRefreshCanvas(refreshCanvas)
                .setClear(__clearFunction);
            */

            // FIXME: Third arg indicates beginner mode
            if (_THIS_IS_MUSIC_BLOCKS_) {
                initBasicProtoBlocks(palettes, blocks, beginnerMode);
            } else {
                initBasicProtoBlocks(palettes, blocks);
            }

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
                var obj = processPluginData(pluginData, palettes, blocks, logo.evalFlowDict, logo.evalArgDict, logo.evalParameterDict, logo.evalSetterDict, logo.evalOnStartList, logo.evalOnStopList, palettes.pluginMacros);
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
                    loading = true;
                    document.body.style.cursor = 'wait';

                    setTimeout(function () {
                        var rawData = reader.result;
                        if (rawData == null || rawData === '') {
                            console.log('rawData is ' + rawData);
                            errorMsg(_('Cannot load project from the file. Please check the file type.'));
                        } else {
                            var cleanData = rawData.replace('\n', ' ');

                            try {
                                if (cleanData.includes('html')) {
                                    var obj = JSON.parse(cleanData.match('<div class="code">(.+?)<\/div>')[1]);
                                } else {
                                    var obj = JSON.parse(cleanData);
                                }
                                // First, hide the palettes as they will need updating.
                                for (var name in blocks.palettes.dict) {
                                    blocks.palettes.dict[name].hideMenu(true);
                                }

                                stage.removeAllEventListeners('trashsignal');

                                if (!merging) {
                                    // Wait for the old blocks to be removed.
                                    var __listener = function (event) {
                                        logo.playbackQueue = {};
                                        blocks.loadNewBlocks(obj);
                                        setPlaybackStatus();
                                        stage.removeAllEventListeners('trashsignal');
                                    };

                                    stage.addEventListener('trashsignal', __listener, false);
                                    sendAllToTrash(false, false);
                                    if (planet) {
                                        planet.initialiseNewProject(fileChooser.files[0].name.substr(0, fileChooser.files[0].name.lastIndexOf('.')));
                                    }
                                } else {
                                    merging = false;
                                    logo.playbackQueue = {};
                                    blocks.loadNewBlocks(obj);
                                    setPlaybackStatus();
                                }

                                loading = false;
                                refreshCanvas();
                            } catch (e) {
                                errorMsg(_('Cannot load project from the file. Please check the file type.'));
                                console.log(e);
                                document.body.style.cursor = 'default';
                                loading = false;
                            }
                        }
                    }, 200);
                });

                reader.readAsText(fileChooser.files[0]);
            }, false);

            var __handleFileSelect = function (event) {
                event.stopPropagation();
                event.preventDefault();

                var files = event.dataTransfer.files;
                var reader = new FileReader();

                reader.onload = (function (theFile) {
                    loading = true;
                    document.body.style.cursor = 'wait';

                    setTimeout(function () {
                        var rawData = reader.result;
                        if (rawData == null || rawData === '') {
                            errorMsg(_('Cannot load project from the file. Please check the file type.'));
                        } else {
                            var cleanData = rawData.replace('\n', ' ');

                            try {
                                if (cleanData.includes('html')) {
                                    dat = cleanData.match('<div class="code">(.+?)<\/div>');
                                    var obj = JSON.parse(dat[1]);
                                } else {
                                    var obj = JSON.parse(cleanData);
                                }
                                for (var name in blocks.palettes.dict) {
                                    blocks.palettes.dict[name].hideMenu(true);
                                }

                                stage.removeAllEventListeners('trashsignal');

                                var __afterLoad = function () {
                                    // playbackOnLoad();
                                    document.removeEventListener('finishedLoading', __afterLoad);
                                };

                                // Wait for the old blocks to be removed.
                                var __listener = function (event) {
                                    logo.playbackQueue = {};
                                    blocks.loadNewBlocks(obj);
                                    setPlaybackStatus();
                                    stage.removeAllEventListeners('trashsignal');

                                    if (document.addEventListener) {
                                        document.addEventListener('finishedLoading', __afterLoad);
                                    } else {
                                        document.attachEvent('finishedLoading', __afterLoad);
                                    }
                                };

                                stage.addEventListener('trashsignal', __listener, false);
                                sendAllToTrash(false, false);
                                if (planet !== undefined) {
                                    planet.initialiseNewProject(files[0].name.substr(0, files[0].name.lastIndexOf('.')));
                                }

                                loading = false;
                                refreshCanvas();
                            } catch (e) {
                                console.log(e);
                                errorMsg(_('Cannot load project from the file. Please check the file type.'));
                                document.body.style.cursor = 'default';
                                loading = false;
                            }
                        }
                    }, 200);
                });

                // Work-around in case the handler is called by the
                // widget drag & drop code.
                if (files[0] != undefined) {
                    reader.readAsText(files[0]);
                    window.scroll(0, 0)
                }
            };

            var __handleDragOver = function (event) {
                event.stopPropagation();
                event.preventDefault();
                event.dataTransfer.dropEffect = 'copy';
            };

            var dropZone = docById('canvasHolder');
            dropZone.addEventListener('dragover', __handleDragOver, false);
            dropZone.addEventListener('drop', __handleFileSelect, false);

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
                    loading = true;
                    document.body.style.cursor = 'wait';

                    setTimeout(function () {
                        obj = processRawPluginData(reader.result, palettes, blocks, errorMsg, logo.evalFlowDict, logo.evalArgDict, logo.evalParameterDict, logo.evalSetterDict, logo.evalOnStartList, logo.evalOnStopList, palettes.pluginMacros);
                        // Save plugins to local storage.
                        if (obj != null) {
                            var pluginObj = preparePluginExports(obj);
                            // console.log(pluginObj);
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

                        document.body.style.cursor = 'default';
                        loading = false;
                    }, 200);
                });

                reader.readAsText(pluginChooser.files[0]);
            }, false);

            // Workaround to chrome security issues
            // createjs.LoadQueue(true, null, true);

            // Enable touch interactions if supported on the current device.
            createjs.Touch.enable(stage, false, true);

            // Keep tracking the mouse even when it leaves the canvas.
            stage.mouseMoveOutside = true;

            // Enabled mouse over and mouse out events.
            stage.enableMouseOver(10); // default is 20

            cartesianBitmap = _createGrid('data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(CARTESIAN))));
            polarBitmap = _createGrid('data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(POLAR))));

            var URL = window.location.href;
            var projectID = null;
            var flags = {run: false, show: false, collapse: false};

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
                                console.log('Warning: old Music Blocks URLs will no longer work.');
                                break;
                            case 'id':
                                projectID = args[1];
                            case 'run':
                                if (args[1].toLowerCase() === 'true')
                                    flags.run = true;
                                break;
                            case 'show':
                                if (args[1].toLowerCase() === 'true')
                                    flags.show = true;
                                break;
                            case 'collapse':
                                if (args[1].toLowerCase() === 'true')
                                    flags.collapse = true;
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
                                    // console.log('Your JSON result is:  ' + data.arg);
                                    n = data.arg;
                                    env.push(parseInt(n));
                                }, function (status) {
                                    alert('Something went wrong reading JSON-encoded project data.');
                                });
                                break;
                            case 'outurl':
                                var url = args[1];
                                break;
                            default:
                                errorMsg('Invalid parameters');
                            }
                        }
                    }
                } else {
                    if (urlParts[1].indexOf('=') > 0) {
                        var args = urlParts[1].split('=');
                    }

                    //ID is the only arg that can stand alone
                    if (args[0].toLowerCase() === 'id') {
                        projectID = args[1];
                    }
                }
            }

            if (projectID != null) {
                setTimeout(function () {
                    console.log('loading ' + projectID);
                    loadStartWrapper(loadProject, projectID, flags, env);
                }, 200); // 2000
            } else {
                setTimeout(function () {
                    console.log('load new Start block');
                    loadStartWrapper(_loadStart);
                }, 200); // 2000
            }

            document.addEventListener('mousewheel', scrollEvent, false);
            document.addEventListener('DOMMouseScroll', scrollEvent, false);

            this.document.onkeydown = __keyPressed;
            _hideStopButton();
        };

        function _setupBlocksContainerEvents() {
            var moving = false;
            var lastCoords = {
                x: 0,
                y: 0,
                delta: 0
            };

            var __wheelHandler = function (event) {
                // vertical scroll
                if (event.deltaY != 0 && event.axis === event.VERTICAL_AXIS) { 
                    if (palettes.paletteVisible) {
                        if (event.clientX > cellSize + MENUWIDTH) {
                            blocksContainer.y -= event.deltaY;
                        }    
                    } else {
                        if (event.clientX > cellSize) {
                            blocksContainer.y -= event.deltaY;
                        }
                    }   
                }

                // horizontal scroll 
                if (scrollBlockContainer) {
                    if (event.deltaX != 0 && event.axis === event.HORIZONTAL_AXIS) { 
                        if (palettes.paletteVisible) {
                            if (event.clientX > cellSize + MENUWIDTH) {
                                blocksContainer.x -= event.deltaX;
                            }    
                        } else {
                            if (event.clientX > cellSize) {
                                blocksContainer.x -= event.deltaX;
                            }
                        }   
                    }
                } else {
                    event.preventDefault();
                }

                refreshCanvas();
            };

            docById('myCanvas').addEventListener('wheel', __wheelHandler, false);

            var __stageMouseUpHandler = function (event) {
                stageMouseDown = false;
                moving = false;

                if (stage.getObjectUnderPoint() === null && lastCoords.delta < 4) {
                    stageX = event.stageX;
                    stageY = event.stageY;
                    // blocks.stageClick = true;
                    // _piemenuStageContext();
                }

            };

            stage.on('stagemousedown', function (event) {
                stageMouseDown = true;
                if (stage.getObjectUnderPoint() !== null | turtles.running()) {
                    stage.removeAllEventListeners('stagemouseup');
                    stage.on('stagemouseup', __stageMouseUpHandler);
                    return;
                }

                moving = true;
                lastCoords = {
                    x: event.stageX,
                    y: event.stageY,
                    delta: 0
                };

                hideDOMLabel();

                stage.removeAllEventListeners('stagemousemove');
                stage.on('stagemousemove', function (event) {
                    if (!moving) {
                        return;
                    }

                    // if we are moving the block container, deselect the active block.
                    blocks.activeBlock = null;

                    var delta = Math.abs(event.stageX - lastCoords.x) + Math.abs(event.stageY - lastCoords.y);

                    if (scrollBlockContainer) {
                        blocksContainer.x += event.stageX - lastCoords.x;
                    }

                    blocksContainer.y += event.stageY - lastCoords.y;
                    lastCoords = {
                        x: event.stageX,
                        y: event.stageY,
                        delta: lastCoords.delta + delta
                    };

                    refreshCanvas();
                });

                stage.removeAllEventListeners('stagemouseup');
                stage.on('stagemouseup', __stageMouseUpHandler);
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
                    // if we are moving the palettes, deselect the active block.
                    blocks.activeBlock = null;

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

        // Prepare the search widget
        searchWidget.style.visibility = 'hidden';
        var searchBlockPosition = [100, 100];

        var searchSuggestions = [];
        var deprecatedBlockNames = [];

        for (var i in blocks.protoBlockDict) {
            var blockLabel = blocks.protoBlockDict[i].staticLabels[0];
            if (blockLabel) {
                if (blocks.protoBlockDict[i].hidden) {
                    deprecatedBlockNames.push(blockLabel);
                } else {
                    searchSuggestions.push(blockLabel);
                }
            }
        }

        searchSuggestions = searchSuggestions.reverse();

        searchWidget.onclick = function() {
            doSearch();
        };

        function hideSearchWidget() {
            // Hide the jQuery search results widget
            var obj = docByClass('ui-menu');
            if (obj.length > 0) {
                obj[0].style.visibility = 'hidden';
            }

            searchWidget.style.visibility = 'hidden';
        };

        function showSearchWidget() {
            if (searchWidget.style.visibility === 'visible') {
                hideSearchWidget();
            } else {
                var obj = docByClass('ui-menu');
                if (obj.length > 0) {
                    obj[0].style.visibility = 'visible';
                }

                searchWidget.value = null;
                docById('searchResults').style.visibility = 'visible';
                searchWidget.style.visibility = 'visible';
                searchWidget.style.left = palettes.getSearchPos()[0] * turtleBlocksScale + 'px';
                searchWidget.style.top = palettes.getSearchPos()[1] * turtleBlocksScale + 'px';

                searchBlockPosition = [100, 100];

                // Give the browser time to update before selecting
                // focus.
                setTimeout(function () {
                    searchWidget.focus();
                    doSearch();
                }, 500);
            }
        };

        function doSearch() {
            var $j = jQuery.noConflict();

            $j('#search').autocomplete({
                source: searchSuggestions
            });

            $j('#search').autocomplete('widget').addClass('scrollSearch');

            var searchInput = searchWidget.value;
            var obj = palettes.getProtoNameAndPalette(searchInput);
            var protoblk = obj[0];
            var paletteName = obj[1];
            var protoName = obj[2];

            var searchResult = blocks.protoBlockDict.hasOwnProperty(protoName);

            if (searchInput.length > 0) {
                if (searchResult) {
                    palettes.dict[paletteName].makeBlockFromSearch(protoblk, protoName, function (newBlock) {
                        blocks.moveBlock(newBlock, 100 + searchBlockPosition[0] - blocksContainer.x, searchBlockPosition[1] - blocksContainer.y);
                    });

                    // Move the position of the next newly created block.
                    searchBlockPosition[0] += STANDARDBLOCKHEIGHT;
                    searchBlockPosition[1] += STANDARDBLOCKHEIGHT;
                } else if (deprecatedBlockNames.indexOf(searchInput) > -1) {
                    blocks.errorMsg(_('This block is deprecated.'));
                } else {
                    blocks.errorMsg(_('Block cannot be found.'));
                }

                searchWidget.value = '';
                update = true;
            }
        };

        function __makeNewNote(octave, solf) {
            var newNote = [
                [0, 'newnote', 300 - blocksContainer.x, 300 - blocksContainer.y, [null, 1, 4, 8]],
                [1, 'divide', 0, 0, [0, 2, 3]],
                [2, ['number', {'value': 1}], 0, 0, [1]],
                [3, ['number', {'value': 4}], 0, 0, [1]],
                [4, 'vspace', 0, 0, [0, 5]],
                [5, 'pitch', 0, 0, [4, 6, 7, null]],
                [6, ['solfege', {'value': solf}], 0, 0, [5]],
                [7, ['number', {'value': octave}], 0, 0, [5]],
                [8, 'hidden', 0, 0, [0, null]]
            ];

            blocks.loadNewBlocks(newNote);
            if (blocks.activeBlock !== null) {
                // Connect the newly created block to the active block
                // (if it is a hidden block at the end of a new note
                // block).
                var bottom = blocks.findBottomBlock(blocks.activeBlock);
                console.log(blocks.activeBlock + ' ' + bottom);
                if (blocks.blockList[bottom].name === 'hidden' && blocks.blockList[blocks.blockList[bottom].connections[0]].name === 'newnote') {

                    // The note block macro creates nine blocks.
                    var newlyCreatedBlock = blocks.blockList.length - 9;

                    // Set last connection of active block to the
                    // newly created block.
                    var lastConnection = blocks.blockList[bottom].connections.length - 1
                    blocks.blockList[bottom].connections[lastConnection] = newlyCreatedBlock;

                    // Set first connection of the newly created block to
                    // the active block.
                    blocks.blockList[newlyCreatedBlock].connections[0] = bottom;
                    // Adjust the dock positions to realign the stack.
                    blocks.adjustDocks(bottom, true);
                }
            }

            // Set new hidden block at the end of the newly created
            // note block to the active block.
            blocks.activeBlock = blocks.blockList.length - 1;
        }

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

                if (docById('timbreName') !== null) {
                    if (docById('timbreName').classList.contains('hasKeyboard')) {
                        return;
                    }
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
            const END = 35;
            const PAGE_UP = 33;
            const PAGE_DOWN = 34;
            const KEYCODE_LEFT = 37;
            const KEYCODE_RIGHT = 39;
            const KEYCODE_UP = 38;
            const KEYCODE_DOWN = 40;
            const DEL = 46;
            const V = 86;

            // Shortcuts for creating new notes
            const KEYCODE_D = 68; // do
            const KEYCODE_R = 82; // re
            const KEYCODE_M = 77; // mi
            const KEYCODE_F = 70; // fa
            const KEYCODE_S = 83; // so
            const KEYCODE_L = 76; // la
            const KEYCODE_T = 84; // ti

            // Check for RETURN in search widget ahead of other events.
            if (event.keyCode === RETURN && docById('search').value.length > 0) {
                doSearch();
                palettes.hide();
                palettes.show();
            }

            if (_THIS_IS_MUSIC_BLOCKS_) {
                var disableKeys = docById('lilypondModal').style.display === 'block' || searchWidget.style.visibility === 'visible' || docById('planet-iframe').style.display === '' || docById('paste').style.visibility === 'visible' || docById('wheelDiv').style.display === '' || logo.turtles.running();
            } else {
                var disableKeys = searchWidget.style.visibility === 'visible' || docById('paste').style.visibility === 'visible' || logo.turtles.running();
            }

            var disableArrowKeys = _THIS_IS_MUSIC_BLOCKS_ && (docById('sliderDiv').style.visibility === 'visible' || docById('tempoDiv').style.visibility === 'visible');

            if (event.altKey && !disableKeys) {
                switch (event.keyCode) {
                case 66: // 'B'
                    save.saveBlockArtwork();
                    break;
                case 67: // 'C'
                    blocks.prepareStackForCopy();
                    break;
                case 69: // 'E'
                    _allClear();
                    break;
                case 80: // 'P'
                    // logo.playback(-1);
                    break;
                case 82: // 'R'
                    _doFastButton();
                    break;
                case 83: // 'S'
                    logo.doStopTurtle();
                    break;
                case 86: // 'V'
                    blocks.pasteStack();
                    break;
                }
            } else if (event.ctrlKey) {
                switch (event.keyCode) {
                case V:
                    pasteBox.createBox(turtleBlocksScale, 200, 200);
                    pasteBox.show();
                    docById('paste').style.left = (pasteBox.getPos()[0] + 10) * turtleBlocksScale + 'px';
                    docById('paste').style.top = (pasteBox.getPos()[1] + 10) * turtleBlocksScale + 'px';
                    docById('paste').focus();
                    docById('paste').style.visibility = 'visible';
                    update = true;
                    break;
                }
            } else if (event.shiftKey && !disableKeys) {
                switch (event.keyCode) {
                case KEYCODE_D:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(5, 'do');
                    }
                    break;
                case KEYCODE_R:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(5, 're');
                    }
                    break;
                case KEYCODE_M:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(5, 'mi');
                    }
                    break;
                case KEYCODE_F:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(5, 'fa');
                    }
                    break;
                case KEYCODE_S:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(5, 'sol');
                    }
                    break;
                case KEYCODE_L:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(5, 'la');
                    }
                    break;
                case KEYCODE_T:
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        __makeNewNote(5, 'ti');
                    }
                    break;
                }
            } else {
                if (docById('paste').style.visibility === 'visible' && event.keyCode === RETURN) {
                    if (docById('paste').value.length > 0) {
                        pasted();
                    }
                } else if (!disableKeys) {
                    switch (event.keyCode) {
                    case END:
                        blocksContainer.y = -blocks.bottomMostBlock() + logo.canvas.height / 2;
                        break;
                    case PAGE_UP:
                        blocksContainer.y += logo.canvas.height / 2;
                        stage.update();
                        break;
                    case PAGE_DOWN:
                        blocksContainer.y -= logo.canvas.height / 2;
                        stage.update();
                        break;
                    case DEL:
                        blocks.extract();
                        break;
                    case KEYCODE_UP:
                        if (disableArrowKeys) {
                        } else if (blocks.activeBlock != null) {
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
                        stage.update();
                        break;
                    case KEYCODE_DOWN:
                        if (disableArrowKeys) {
                        } else if (blocks.activeBlock != null) {
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
                        stage.update();
                        break;
                    case KEYCODE_LEFT:
                        if (disableArrowKeys) {
                        } else if (blocks.activeBlock != null) {
                            blocks.moveStackRelative(blocks.activeBlock, -STANDARDBLOCKHEIGHT / 2, 0);
                            blocks.blockMoved(blocks.activeBlock);
                            blocks.adjustDocks(blocks.activeBlock, true);
                        } else if (scrollBlockContainer) {
                            blocksContainer.x -= 20;
                        }
                        stage.update();
                        break;
                    case KEYCODE_RIGHT:
                        if (disableArrowKeys) {
                        } else if (blocks.activeBlock != null) {
                            blocks.moveStackRelative(blocks.activeBlock, STANDARDBLOCKHEIGHT / 2, 0);
                            blocks.blockMoved(blocks.activeBlock);
                            blocks.adjustDocks(blocks.activeBlock, true);
                        } else if (scrollBlockContainer) {
                            blocksContainer.x += 20;
                        }
                        stage.update();
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
                        stage.update();
                        break;
                    case TAB:
                        break;
                    case SPACE:
                        if (turtleContainer.scaleX == 1) {
                            turtles.scaleStage(0.5);
                        } else {
                            turtles.scaleStage(1);
                        }
                        break;
                    case ESC:
                        if (searchWidget.style.visibility === 'visible') {
                            searchWidget.style.visibility = 'hidden';
                        } else {
                            // toggle full screen
                            _toggleToolbar();
                        }
                        break;
                    case RETURN:
                        if (disableArrowKeys) {
                        } else if (docById('search').value.length > 0) {
                            doSearch();
                        } else {
                            if (blocks.activeBlock == null || SPECIALINPUTS.indexOf(blocks.blockList[blocks.activeBlock].name) === -1) {
                                logo.runLogoCommands();
                            }
                        }
                        break;
                    case KEYCODE_D:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            __makeNewNote(4, 'do');
                        }
                        break;
                    case KEYCODE_R:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            __makeNewNote(4, 're');
                        }
                        break;
                    case KEYCODE_M:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            __makeNewNote(4, 'mi');
                        }
                        break;
                    case KEYCODE_F:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            __makeNewNote(4, 'fa');
                        }
                        break;
                    case KEYCODE_S:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            __makeNewNote(4, 'sol');
                        }
                        break;
                    case KEYCODE_L:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            __makeNewNote(4, 'la');
                        }
                        break;
                    case KEYCODE_T:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            __makeNewNote(4, 'ti');
                        }
                        break;
                    default:
                        break;
                    }
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

            // If any menus were open, close them.
            if (confirmContainer !== null && newContainer.visible) {
                if (headerContainer.y > 0) {
                    _showHideAuxMenu(true);
                }
            }

            if (!platform.androidWebkit) {
                var w = window.innerWidth;
                var h = window.innerHeight;
            } else {
                var w = window.outerWidth;
                var h = window.outerHeight;
            }

            var smallSide = Math.min(w, h);

            if (smallSide < cellSize * 9) {
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

            turtleBlocksScale = 1.0;
            /*
            console.log('=====================');
            console.log(turtleBlocksScale);
            if (turtleBlocksScale < 0.5) {
                turtleBlocksScale = 0.5;
            } else if (turtleBlocksScale < 1) {
                turtleBlocksScale = 1;
            } else if (turtleBlocksScale < 1.5) {
                turtleBlocksScale = 1.5;
            } else {
                turtleBlocksScale = 2;
            }
            console.log(turtleBlocksScale);
            console.log('=====================')
            */

            stage.scaleX = turtleBlocksScale;
            stage.scaleY = turtleBlocksScale;

            stage.canvas.width = w;
            stage.canvas.height = h;

            /*
            console.log('Resize: scale ' + turtleBlocksScale +
            ', stageW ' + w + ', stageH ' + h +
            ', canvasW ' + canvas.width + ', canvasH ' + canvas.height +
            ', screenW ' + screen.width + ', screenH ' + screen.height);
            */

            turtles.setScale(w, h, turtleBlocksScale);

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
            if (storage.doneTour) {
            } else {
                _showHelp();
            }

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

            var artcanvas = docById('overlayCanvas');
            // Workaround for #795
            if (mobileSize) {
                artcanvas.width = w * 2;
                artcanvas.height = h * 2;
            } else {
                artcanvas.width = w;
                artcanvas.height = h;
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

            blocks.activeBlock = null;
            closeSubMenus();
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

        function closeSubMenus() {
            if (confirmContainer.visible) {
                confirmContainer.visible = false;
                saveContainer.y = 82.5 + LEADING;
                gridContainer.y = 82.5 + LEADING;
                newContainer.y = 82.5 + LEADING;
                planetContainer.y = 82.5 + LEADING;
                restoreContainer.y = 82.5 + LEADING;
                openContainer.y = 82.5 + LEADING;
                pasteContainer.y = 82.5 + LEADING;
                utilityContainer.y = 82.5 + LEADING;
                deltaY(-55 - LEADING);
            } else if (uploadContainer.visible) {
                saveHTMLContainer.visible = false;
                uploadContainer.visible = false;
                saveSVGContainer.visible = false;
                savePNGContainer.visible = false;
                saveArtworkContainer.visible = false;
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    saveWAVContainer.visible = false;
                    saveLilypondContainer.visible = false;
                    saveABCContainer.visible = false;
                }

                saveContainer.y = 82.5 + LEADING;
                gridContainer.y = 82.5 + LEADING;
                newContainer.y = 82.5 + LEADING;
                utilityContainer.y = 82.5 + LEADING;
                planetContainer.y = 82.5 + LEADING;
                restoreContainer.y = 82.5 + LEADING;
                openContainer.y = 82.5 + LEADING;
                pasteContainer.y = 82.5 + LEADING;
                deltaY(-55 - LEADING);
            } else if (languageContainer.visible) {
                beginnerModeContainer.visible = false;
                advancedModeContainer.visible = false;
                languageContainer.visible = false;
                smallerContainer.visible = false;
                largerContainer.visible = false;
                smallerOffContainer.visible = false;
                largerOffContainer.visible = false;
                pluginsContainer.visible = false;
                deletePluginContainer.visible = false;
                statsContainer.visible = false;
                scrollOnContainer.visible = false;
                scrollOffContainer.visible = false;

                saveContainer.y = 82.5 + LEADING;
                gridContainer.y = 82.5 + LEADING;
                newContainer.y = 82.5 + LEADING;
                planetContainer.y = 82.5 + LEADING;
                restoreContainer.y = 82.5 + LEADING;
                openContainer.y = 82.5 + LEADING;
                pasteContainer.y = 82.5 + LEADING;
                utilityContainer.y = 82.5 + LEADING;
                deltaY(-55 - LEADING);
            }
        };

        function _deleteBlocksBox() {
            // _hideBoxes();
            // clearBox.createBox(turtleBlocksScale, deleteAllButton.x - 27, deleteAllButton.y - 55);
            // if save or settings is open, close them.
            if (!confirmContainer.visible) {
                closeSubMenus();
                confirmContainer.visible = true;
                if (beginnerMode) {
                    confirmContainer.x = 55 * 6 + 27.5;
                } else {
                    confirmContainer.x = 55 * 6 + 27.5;
                }

                confirmContainer.y = 27.5;
                deltaY(55 + LEADING);
            } else {
                confirmContainer.visible = false;
                deltaY(-55 - LEADING);
            }
        };

        function hideAuxMenu() {
            if (headerContainer.y > 0) {
                _showHideAuxMenu(false);
                menuButtonsVisible = false;
            }
        };

        function _afterDelete() {
            sendAllToTrash(true, false);
            if (planet !== undefined) {
                planet.initialiseNewProject.bind(planet);
            }

            confirmContainer.visible = false;
            deltaY(-55 - LEADING);
            _showHideAuxMenu(false);
        };

        function doLanguageBox() {
            // _hideBoxes();
            languageBox.createBox(turtleBlocksScale, 55 * 7, 150); // saveButton.x - 27, saveButton.y - 55);
            languageBox.show();
            beginnerModeContainer.visible = false;
            advancedModeContainer.visible = false;
            languageContainer.visible = false;
            smallerContainer.visible = false;
            largerContainer.visible = false;
            smallerOffContainer.visible = false;
            largerOffContainer.visible = false;
            pluginsContainer.visible = false;
            deletePluginContainer.visible = false;
            statsContainer.visible = false;
            scrollOnContainer.visible = false;
            scrollOffContainer.visible = false;
            deltaY(-55 - LEADING);
        };

        function _doUtilityBox() {
            // _hideBoxes();
            // utilityBox.init(turtleBlocksScale, utilityButton.x - 27, utilityButton.y, _makeButton, palettes.pluginsDeleteStatus);
            if (!languageContainer.visible) {        
                closeSubMenus();
                languageContainer.visible = true;
                smallerContainer.visible = true;
                largerContainer.visible = true;
                if (beginnerMode) {
                    beginnerModeContainer.visible = true;
                    pluginsContainer.visible = false;
                    deletePluginContainer.visible = false;
                    statsContainer.visible = false;
                    scrollOnContainer.visible = false;
                    scrollOffContainer.visible = false;

                    beginnerModeContainer.x = 55 * 4;
                    advancedModeContainer.x = 55 * 4;
                    languageContainer.x = 55 * 5;
                    smallerContainer.x = 55 * 6;
                    largerContainer.x = 55 * 7;
                    smallerOffContainer.x = 55 * 6;
                    largerOffContainer.x = 55 * 7;
                } else {
                    advancedModeContainer.visible = true;
                    pluginsContainer.visible = true;
                    deletePluginContainer.visible = true;
                    statsContainer.visible = true;
                    setScrollerButton();

                    beginnerModeContainer.x = 55 * 1 + 27.5;
                    advancedModeContainer.x = 55 * 1 + 27.5;
                    languageContainer.x = 55 * 2 + 27.5;
                    smallerContainer.x = 55 * 3 + 27.5;
                    largerContainer.x = 55 * 4 + 27.5;
                    smallerOffContainer.x = 55 * 3 + 27.5;
                    largerOffContainer.x = 55 * 4 + 27.5;
                    pluginsContainer.x = 55 * 5 + 27.5;
                    deletePluginContainer.x = 55 * 6 + 27.5;
                    statsContainer.x = 55 * 7 + 27.5;
                    scrollOnContainer.x = 55 * 8 + 27.5;
                    scrollOffContainer.x = 55 * 8 + 27.5;
                }

                setSmallerLargerStatus();

                beginnerModeContainer.y = 27.5;
                advancedModeContainer.y = 27.5;
                languageContainer.y = 27.5;
                smallerContainer.y = 27.5;
                largerContainer.y = 27.5;
                smallerOffContainer.y = 27.5;
                largerOffContainer.y = 27.5;
                pluginsContainer.y = 27.5;
                deletePluginContainer.y = 27.5;
                statsContainer.y = 27.5;
                scrollOnContainer.y = 27.5;
                scrollOffContainer.y = 27.5;
                deltaY(55 + LEADING);
            } else {
                // Hide everything
                beginnerModeContainer.visible = false;
                advancedModeContainer.visible = false;
                languageContainer.visible = false;
                smallerContainer.visible = false;
                largerContainer.visible = false;
                smallerOffContainer.visible = false;
                largerOffContainer.visible = false;
                pluginsContainer.visible = false;
                deletePluginContainer.visible = false;
                statsContainer.visible = false;
                scrollOnContainer.visible = false;
                scrollOffContainer.visible = false;
                // Move it down since we are about to move it up.
                utilityContainer.y = 82.5 + LEADING;
                deltaY(-55 - LEADING);
            }
        };

        function _doPlaybackBox() {
            // _hideBoxes();
            // playbackBox.init(turtleBlocksScale, playbackButton.x - 27, playbackButton.y, _makeButton, logo);
        };

        function sendAllToTrash(addStartBlock, doNotSave) {
            // First, hide the palettes as they will need updating.
            for (var name in blocks.palettes.dict) {
                blocks.palettes.dict[name].hideMenu(true);
            }

            hideDOMLabel();
            refreshCanvas();

            var actionBlockCounter = 0;
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
                        actionBlockCounter += 1;
                    }
                }

                blocks.blockList[blk].trash = true;
                blocks.moveBlockRelative(blk, dx, dy);
                blocks.blockList[blk].hide();
            }

            if (addStartBlock) {
                logo.playbackQueue = {};
                blocks.loadNewBlocks(DATAOBJS);
                setPlaybackStatus();
            } else if (!doNotSave) {
                // Overwrite session data too.
                saveLocally();
            }

            // Wait for palette to clear (#891)
            // We really need to signal when each palette item is deleted
            setTimeout(function() {
                stage.dispatchEvent('trashsignal');
           }, 100 * actionBlockCounter); // 1000

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
            hideDOMLabel();

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
            hideDOMLabel();

            if (blocks.visible) {
                console.log('calling toggleCollapsibles');
                blocks.toggleCollapsibles();
            }
        };

        function onStopTurtle() {
            // TODO: plugin support
            if (stopTurtleContainer.visible) {
                _hideStopButton();
                setPlaybackStatus();
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
            if (update || createjs.Tween.hasActiveTweens()) {
                update = false; // Only update once
                stage.update(event);
            }
        };

        function _doOpenSamples() {
            closeSubMenus();
            planet.openPlanet();
        };

        function doSave() {
            if (false) { // (beginnerMode) {
                closeSubMenus();
                save.saveHTML(_('My Project'));
            } else {
                // _hideBoxes();
                // saveBox.init(turtleBlocksScale, saveButton.x - 27, saveButton.y - 97, _makeButton);
                if (!saveHTMLContainer.visible) {
                    closeSubMenus();
                    saveHTMLContainer.visible = true;
                    uploadContainer.visible = true;
                    saveSVGContainer.visible = true;
                    savePNGContainer.visible = true;
                    saveArtworkContainer.visible = true;
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        saveWAVContainer.visible = true;
                        saveLilypondContainer.visible = true;
                        saveABCContainer.visible = true;

                        saveHTMLContainer.x = 55 * 0 + 27.5;
                        uploadContainer.x = 55 * 1 + 27.5;
                        saveSVGContainer.x = 55 * 2 + 27.5;
                        savePNGContainer.x = 55 * 3 + 27.5;
                        saveWAVContainer.x = 55 * 4 + 27.5;
                        saveLilypondContainer.x = 55 * 5 + 27.5;
                        saveABCContainer.x = 55 * 6 + 27.5;
                        saveArtworkContainer.x = 55 * 7 + 27.5;
                    } else {
                        saveHTMLContainer.x = 55 * 2 + 27.5;
                        uploadContainer.x = 55 * 3 + 27.5;
                        saveSVGContainer.x = 55 * 4 + 27.5;
                        savePNGContainer.x = 55 * 5 + 27.5;
                        saveArtworkContainer.x = 55 * 6 + 27.5;
                    }

                    saveHTMLContainer.y = 27.5;
                    uploadContainer.y = 27.5;
                    saveSVGContainer.y = 27.5;
                    savePNGContainer.y = 27.5;
                    saveArtworkContainer.y = 27.5;
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        saveWAVContainer.y = 27.5;
                        saveLilypondContainer.y = 27.5;
                        saveABCContainer.y = 27.5;
                    }

                    deltaY(55 + LEADING);
                } else {
                    saveHTMLContainer.visible = false;
                    uploadContainer.visible = false;
                    saveSVGContainer.visible = false;
                    savePNGContainer.visible = false;
                    saveArtworkContainer.visible = false;
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        saveWAVContainer.visible = false;
                        saveLilypondContainer.visible = false;
                        saveABCContainer.visible = false;
                    }

                    // Move it down since we are about to move it up.
                    saveContainer.y = 82.5 + LEADING;
                    deltaY(-55 - LEADING);
                }
            }
        };

        function doUploadToPlanet() {
            planet.openPlanet();
        };

        function doShareOnFacebook() {
            alert('Facebook Sharing : disabled');    // remove when add fb share link
            // add code for facebook share link
        };

        function doLoad(merge) {
            closeSubMenus();
            if (merge === undefined) {
                merge = false;
            }

            if (merge) {
                console.log('merge load');
                merging = true;
            } else {
                merging = false;
            }

            console.log('Loading .tb file');
            document.querySelector('#myOpenFile').focus();
            document.querySelector('#myOpenFile').click();
            window.scroll(0, 0);
            doStopButton();
            _allClear();
        };

        window.prepareExport = prepareExport;

        function runProject (env) {
            console.log('Running Project from Event');
            document.removeEventListener('finishedLoading', runProject);
            setTimeout(function () {
                console.log('Run');
                _changeBlockVisibility();
                _doFastButton(env);
            }, 5000);
        }

        function loadProject (projectID, flags, env) {
            //set default value of run
            flags = typeof flags !== 'undefined' ? flags : {run: false, show: false, collapse: false};
            loading = true;
            document.body.style.cursor = 'wait';

            // palettes.updatePalettes();
            setTimeout(function () {
                try {
                    planet.openProjectFromPlanet(projectID, function() {loadStartWrapper(_loadStart);});
                } catch (e) {
                    console.log(e);
                    console.log('_loadStart on error');
                    loadStartWrapper(_loadStart);
                }

                planet.initialiseNewProject();
                // Restore default cursor
                loading = false;
                document.body.style.cursor = 'default';
                update = true;
            }, 200);

            var run = flags.run;
            var show = flags.show;
            var collapse = flags.collapse;

            var __functionload = function () {
                setTimeout(function () {
                    if (!collapse && firstRun) {
                        _toggleCollapsibleStacks();
                    }

                    if (run && firstRun) {
                        for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                            turtles.turtleList[turtle].doClear(true, true, false);
                        }

                        runProject(env);

                        if (show) {
                            _changeBlockVisibility();
                        }

                        if (!collapse) {
                            _toggleCollapsibleStacks();
                        }
                    } else if (!show) {
                        _changeBlockVisibility();
                    }

                    document.removeEventListener('finishedLoading', __functionload);
                    firstRun = false;
                }, 1000);
            }

            if (document.addEventListener) {
                document.addEventListener('finishedLoading', __functionload, false);
            } else {
                document.attachEvent('finishedLoading', __functionload);
            }
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
        function showContents() {
            docById('loading-image-container').style.display = 'none';
            // docById('canvas').style.display = 'none';
            docById('hideContents').style.display = 'block';

            /*
            // Warn the user -- chrome only -- if the browser level is
            // not set to 100%
            if (window.innerWidth !== window.outerWidth) {
                blocks.errorMsg(_('Please set browser zoom level to 100%'));
                console.log('zoom level is not 100%: ' + window.innerWidth + ' !== ' + window.outerWidth);
            }
            */
        };

        function _loadStart() {
            // where to put this?
            // palettes.updatePalettes();
            justLoadStart = function () {
                console.log('loading start and a matrix');
                logo.playbackQueue = {};
                blocks.loadNewBlocks(DATAOBJS);
                setPlaybackStatus();
            };

            sessionData = null;

            // Try restarting where we were when we hit save.
            if (planet) {
                sessionData = planet.openCurrentProject();
            } else {
                var currentProject = storage.currentProject;
                sessionData = storage['SESSION' + currentProject];
            }

            var __afterLoad = function () {
                if (!turtles.running()) {
                    setTimeout(function() { 
                        console.log('reset turtles ' + turtles.turtleList.length);
                 
                        for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                            logo.turtleHeaps[turtle] = [];
                            logo.notationStaging[turtle] = [];
                            logo.notationDrumStaging[turtle] = [];
                            turtles.turtleList[turtle].doClear(true, true, false);
                        }

                        // playbackOnLoad();
                    }, 1000);
                }

                document.removeEventListener('finishedLoading', __afterLoad);
            };

            // After we have finished loading the project, clear all
            // to ensure a clean start.
            if (document.addEventListener) {
                document.addEventListener('finishedLoading', __afterLoad);
            } else {
                document.attachEvent('finishedLoading', __afterLoad);
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

                        logo.playbackQueue = {};
                        blocks.loadNewBlocks(JSON.parse(sessionData));
                        setPlaybackStatus();
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
            console.log('hiding messages');
            errorMsgText.parent.visible = false;
            if (errorMsgArrow != null) {
                errorMsgArrow.removeAllChildren();
                refreshCanvas();
            }

            msgText.parent.visible = false;
            for (var i in errorArtwork) {
                errorArtwork[i].visible = false;
            }

            refreshCanvas();
        };

        function textMsg(msg) {
            if (msgText == null) {
                // The container may not be ready yet, so do nothing.
                return;
            }

            var msgContainer = msgText.parent;
            msgContainer.visible = true;
            console.log(msgContainer.x + ' ' + msgContainer.y);
            msgText.text = msg;
            msgContainer.updateCache();
            stage.setChildIndex(msgContainer, stage.children.length - 1);
	    refreshCanvas();
        };

        function errorMsg(msg, blk, text, timeout) {
	    /*
            if (logo.optimize) {
                return;
            }
            */
            if (errorMsgTimeoutID != null) {
                clearTimeout(errorMsgTimeoutID);
            }

            // Hide the button, as the program is going to be
            // terminated.
            _hideStopButton();

            if (errorMsgText == null) {
                // The container may not be ready yet, so do nothing.
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
                stage.setChildIndex(errorMsgArrow, stage.children.length - 1);

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
                stage.setChildIndex(errorArtwork['nomicrophone'], stage.children.length - 1);
                break;
            case NOSTRINGERRORMSG:
                errorArtwork['notastring'].visible = true;
                stage.setChildIndex(errorArtwork['notastring'], stage.children.length - 1);
                break;
            case EMPTYHEAPERRORMSG:
                errorArtwork['emptyheap'].visible = true;
                stage.setChildIndex(errorArtwork['emptyheap'], stage.children.length - 1);
                break;
            case NOSQRTERRORMSG:
                errorArtwork['negroot'].visible = true;
                stage.setChildIndex(errorArtwork['negroot'], stage.children.length - 1);
                break;
            case NOACTIONERRORMSG:
                if (text == null) {
                    text = 'foo';
                }

                errorArtwork['nostack'].children[1].text = text;
                errorArtwork['nostack'].visible = true;
                errorArtwork['nostack'].updateCache();
                stage.setChildIndex(errorArtwork['nostack'], stage.children.length - 1);
                break;
            case NOBOXERRORMSG:
                if (text == null) {
                    text = 'foo';
                }

                errorArtwork['emptybox'].children[1].text = text;
                errorArtwork['emptybox'].visible = true;
                errorArtwork['emptybox'].updateCache();
                stage.setChildIndex(errorArtwork['emptybox'], stage.children.length - 1);
                break;
            case ZERODIVIDEERRORMSG:
                errorArtwork['zerodivide'].visible = true;
                stage.setChildIndex(errorArtwork['zerodivide'], stage.children.length - 1);
                break;
              case NANERRORMSG:
                errorArtwork['notanumber'].visible = true;
                stage.setChildIndex(errorArtwork['notanumber'], stage.children.length - 1);
                break;
            case NOINPUTERRORMSG:
                errorArtwork['noinput'].visible = true;
                stage.setChildIndex(errorArtwork['noinput'], stage.children.length - 1);
                break;
            default:
                var errorMsgContainer = errorMsgText.parent;
                errorMsgContainer.visible = true;
                errorMsgText.text = msg;
                stage.setChildIndex(errorMsgContainer, stage.children.length - 1);
                errorMsgContainer.updateCache();
                break;
            }

            if (timeout != undefined) {
                var myTimeout = timeout;
            } else {
                var myTimeout = _ERRORMSGTIMEOUT_;
            }

            if (myTimeout > 0) {
                errorMsgTimeoutID = setTimeout(function () {
                    hideMsgs();
                }, myTimeout);
            }

	    refreshCanvas();
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
            closeSubMenus();
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

                if (myBlock.isValueBlock() || myBlock.name === 'loadFile' || myBlock.name === 'boolean') {
                    // FIX ME: scale image if it exceeds a maximum size.
                    var args = {
                        'value': myBlock.value
                    };
                } else {
                    switch (myBlock.name) {
                    case 'start':
                    case 'drum':
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
                        break;
                    case 'newnote':
                    case 'action':
                    case 'matrix':
                    case 'pitchdrummatrix':
                    case 'rhythmruler':
                    case 'timbre':
                    case 'pitchstaircase':
                    case 'tempo':
                    case 'pitchslider':
                    case 'modewidget':
                    case 'status':
                        var args = {
                            'collapsed': myBlock.collapsed
                        }
                        break;
                    case 'namedbox':
                    case 'storein2':
                    case 'nameddo':
                    case 'nameddoArg':
                    case 'namedcalc':
                    case 'namedcalcArg':
                    case 'namedarg':
                        var args = {
                            'value': myBlock.privateData
                        }
                        break;
                    case 'nopValueBlock':
                    case 'nopZeroArgBlock':
                    case 'nopOneArgBlock':
                    case 'nopTwoArgBlock':
                    case 'nopThreeArgBlock':
                        // restore original block name
                        myBlock.name = myBlock.privateData;
                        var args = {}
                        break;
                    case 'matrixData':
                        // deprecated
                        var args = {
                            'notes': window.savedMatricesNotes,
                            'count': window.savedMatricesCount
                        }
                        hasMatrixDataBlock = true;
                        break;
                    default:
                        var args = {}
                        break;
                    }
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

            // Next, save the playback queue, but don't save the
            // playback queue if we are saving to Lilypond.

            if (logo.runningLilypond) {
                logo.playbackQueue = {};
            }

            var i = data.length;
            if (i > 0) {
                for (var turtle = 0; turtle < turtles.turtleList.length; turtle++) {
                    if (turtle in logo.playbackQueue) {
                        for (var j = 0; j < logo.playbackQueue[turtle].length; j++) {
                            data.push([i, turtle, logo.playbackQueue[turtle][j]]);
                            i += 1;
                        }
                    }
                }
            }

            return JSON.stringify(data);
        };

        function doOpenPlugin() {
            // Click on the plugin open chooser in the DOM (.json).
            pluginChooser.focus();
            pluginChooser.click();
        };

        function _hideStopButton() {
            stopTurtleContainer.visible = false;
            hardStopTurtleContainer.visible = true;
        };

        function _showStopButton() {
            // stopTurtleContainer.x = onscreenButtons[0].x;
            // stopTurtleContainer.y = onscreenButtons[0].y;
            stopTurtleContainer.visible = true;
            hardStopTurtleContainer.visible = false;
        };

        function blinkPasteButton(bitmap) {
            function handleComplete() {
                createjs.Tween.get(bitmap).to({alpha:1, visible:true}, 500);
            };

            createjs.Tween.get(bitmap).to({alpha:0, visible:false}, 1000).call(
handleComplete);
        };

        function updatePasteButton() {
            if (blocks.selectedBlocksObj == null) {
                pasteContainer.removeAllChildren();
                var img = new Image();

                img.onload = function () {
                    var originalSize = 55; // this is the original svg size
                    var halfSize = Math.floor(cellSize / 2);

                    bitmapDisablePaste = new createjs.Bitmap(img);
                    if (cellSize !== originalSize) {
                        bitmapDisablePaste.scaleX = cellSize / originalSize;
                        bitmapDisablePaste.scaleY = cellSize / originalSize;
                    }

                    bitmapDisablePaste.regX = halfSize / bitmapDisablePaste.scaleX;
                    bitmapDisablePaste.regY = halfSize / bitmapDisablePaste.scaleY;
                    pasteContainer.addChild(bitmapDisablePaste);

                    update = true;
                };

                img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(PASTEDISABLEDBUTTON)))
                return;
            }

            if (pasteImage === null) {
                console.log('Updating paste button');
                var img = new Image();

                img.onload = function () {
                    var originalSize = 55; // this is the original svg size
                    var halfSize = Math.floor(cellSize / 2);

                    bitmapActivePaste = new createjs.Bitmap(img);
                    if (cellSize !== originalSize) {
                        bitmapActivePaste.scaleX = cellSize / originalSize;
                        bitmapActivePaste.scaleY = cellSize / originalSize;
                    }

                    bitmapActivePaste.regX = halfSize / bitmapActivePaste.scaleX;
                    bitmapActivePaste.regY = halfSize / bitmapActivePaste.scaleY;
                    pasteContainer.addChild(bitmapActivePaste);
                    pasteImage = bitmapActivePaste;

                    update = true;
                };

                img.src = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(PASTEBUTTON)))
            } else {
                pasteContainer.addChild(bitmapActivePaste);
                console.log('Blinking paste button');
                blinkPasteButton(pasteImage);
            }
        };

        function _setupAndroidToolbar(showPalettesPopover) {
            // NOTE: see getMainToolbarButtonNames in turtledefs.js

            if (headerContainer !== undefined) {
                stage.removeChild(headerContainer);
                for (var i in onscreenButtons) {
                    stage.removeChild(onscreenButtons[i]);
                }
            }

            headerContainer = new createjs.Shape();
            headerContainer.graphics.f(platformColor.header).r(0, -cellSize * 2 + 2 * LEADING, screen.width / turtleBlocksScale, 3 * cellSize + 3 * LEADING);

            if (platformColor.doHeaderShadow) {
                headerContainer.shadow = new createjs.Shadow('#777', 0, 2, 2);
            }

            headerContainer.removeAllEventListeners('mousedown');
            swiping = false;
            headerContainer.on('mousedown', function (event) {
                scrolling = true;
                var firstY = event.stageY;

                headerContainer.removeAllEventListeners('pressup');
                headerContainer.on('pressup', function (event) {
                    scrolling = false;
                    var diff = event.stageY - firstY;
                    if (diff > 55 && !menuButtonsVisible) {
                        _doMenuAnimation(false);
                    } else if (diff < -55 && menuButtonsVisible) {
                        _doMenuAnimation(false);
                    }
                }, null, true);

                headerContainer.removeAllEventListeners('mouseup');
                headerContainer.on('mouseup', function (event) {
                    scrolling = false;
                    var diff = event.stageY - firstY;
                    if (diff > 55 && !menuButtonsVisible) {
                        _doMenuAnimation(false);
                    } else if (diff < -55 && menuButtonsVisible) {
                        _doMenuAnimation(false);
                    }
                }, null, true);
            });

            stage.addChild(headerContainer);

            // Buttons used when running turtle programs:
            // button name, on-press function, hover label,
            // on-long-press function, on-extra-long-press function,
            // on-long-press icon, on-extra-long-press icon
            if (_THIS_IS_MUSIC_BLOCKS_) {
                if (beginnerMode) {
                    var buttonNames = [
                        ['run', _doFastButton, _('Play'), null, null, null, null],
                        ['hard-stop-turtle', doHardStopButton, _('Hard stop') + ' [Alt-S]', null, null, null, null],
                        ['stop-turtle', doStopButton, _('Stop') + ' [Alt-S]', doHardStopButton, null, 'stop-turtle-button', null],
                        ['clear', _allClear, _('Clean') + ' [Alt-E]', null, null, null, null],
                        ['hide-blocks', _changeBlockVisibility, _('Show/hide blocks'), null, null, null, null],
                        ['collapse-blocks', _toggleCollapsibleStacks, _('Expand/collapse collapsable blocks'), null, null, null, null],
                        ['go-home', _findBlocks, _('Home') + ' [HOME]', null, null, null, null],
                        // ['beginner', doSwitchMode, _('Switch to advanced mode'), null, null, null, null],
                    ];
                } else {
                    var buttonNames = [
                        ['run', _doFastButton, _('Run fast') + ' / ' + _('long press to run slowly') + ' / ' + _('extra-long press to run music slowly') + ' [ENTER]', _doSlowButton, _doSlowMusicButton, 'slow-button', 'slow-music-button'],
                        ['step', _doStepButton, _('Run step by step'), null, null, null, null],
                        ['step-music', _doStepMusicButton, _('Run note by note'), null, null, null, null],
                        ['hard-stop-turtle', doHardStopButton, _('Stop') + ' [Alt-S]', null, null, null, null],
                        ['stop-turtle', doStopButton, _('Stop') + ' [Alt-S]', doHardStopButton, null, 'stop-turtle-button', null],
                        ['clear', _allClear, _('Clean') + ' [Alt-E]', null, null, null, null],
                        ['hide-blocks', _changeBlockVisibility, _('Show/hide blocks'), null, null, null, null],
                        ['collapse-blocks', _toggleCollapsibleStacks, _('Expand/collapse collapsable blocks'), null, null, null, null],
                        ['go-home', _findBlocks, _('Home') + ' [HOME]', null, null, null, null],
                        // ['advanced', doSwitchMode, _('Switch to beginner mode'), null, null, null, null],
                    ];
                }

                buttonNames.push(['help', _showHelp, _('Help'), null, null, null, null]);
            } else {
                var buttonNames = [
                    ['run', _doFastButton, _('Run fast') + ' / ' + _('long press to run slowly') + ' [ENTER]', _doSlowButton, null, 'slow-button', null],
                    ['step', _doStepButton, _('Run step by step'), null, null, null, null],
                    ['hard-stop-turtle', doHardStopButton, _('Hard stop') + ' [Alt-S]', null, null, null, null],
                    ['stop-turtle', doStopButton, _('Stop') + ' [Alt-S]', null, null, null, null],
                    ['clear', _allClear, _('Clean') + ' [Alt-E]', null, null, null, null],
                    ['hide-blocks', _changeBlockVisibility, _('Show/hide blocks'), null, null, null, null],
                    ['collapse-blocks', _toggleCollapsibleStacks, _('Expand/collapse collapsable blocks'), null, null, null, null],
                    ['go-home', _findBlocks, _('Home') + ' [HOME]', null, null, null, null],
                    ['help', _showHelp, _('Help'), null, null, null, null]
                ];
            }

            if (sugarizerCompatibility.isInsideSugarizer()) {
                buttonNames.push(['sugarizer-stop', function () {
                    sugarizerCompatibility.data.blocks = prepareExport();
                    sugarizerCompatibility.saveLocally(function () {
                        sugarizerCompatibility.sugarizerStop();
                    });
                }, 'Stop', null, null, null, null]);
            }

            if (showPalettesPopover) {
                buttonNames.unshift(['popdown-palette', doPopdownPalette]);
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
                } else if (buttonNames[i][0] === 'hard-stop-turtle') {
                    console.log('hard stop turtle');
                    hardStopTurtleContainer = container;
                } else if (buttonNames[i][0] === 'go-home') {
                    homeButtonContainers = [];
                    homeButtonContainers.push(container);
                    var container2 = _makeButton('go-home-faded-button', _('Home') + ' [HOME]', x, y, btnSize, 0);
                    _loadButtonDragHandler(container2, x, y, buttonNames[i][1], null, null, null, null);
                    homeButtonContainers.push(container2);
                    onscreenButtons.push(container2);
                    homeButtonContainers[0].visible = false;
                    homeButtonContainers[1].visible = true;
                    boundary.hide();
                    blocks.setHomeContainers(homeButtonContainers, boundary);
                }

                // Ensure that stop-turtle button is placed on top of
                // hard-stop-turtle button.
                if (!(buttonNames[i][0] === 'hard-stop-turtle' && buttonNames[i + 1][0] === 'stop-turtle')) {
                    x += dx;
                    y += dy;
                }
                //x += dx;
                //y += dy;
            }

            _setupAuxMenu(turtleBlocksScale);
            _setupBoxMenus(turtleBlocksScale);
        };

        function _doMergeLoad() {
            console.log('merge load');
            doLoad(true);
        };

        function _setupBoxMenus(turtleBlocksScale) {
            // Each box menu is positioned above the Aux menus
            var cellsize = 55;
            var y = Math.floor(-3 * cellsize / 2);

            var __addEventHandlers = function(container, action, arg) {

                if (arg !== undefined) {
                    container.on('click', function (event) {
                        action(arg);
                    });
                } else {
                    container.on('click', function (event) {
                        action();
                    });
                }

                container.on('mouseover', function (event) {
                    if (!loading) {
                        document.body.style.cursor = 'pointer';
                    }
                });

                container.on('mouseout', function (event) {
                    if (!loading) {
                        document.body.style.cursor = 'default';
                    }
                });
            };

            // Advanced Save Box Buttons: HTML, SVG, etc.
            // Force left-aligned labels
            var x = 27.5;
            saveHTMLContainer = _makeButton('save-button-dark', _('Save project'), x, y, cellsize, 0);
            saveHTMLContainer.visible = false;
            __addEventHandlers(saveHTMLContainer, save.saveHTML.bind(save));

            if (planet) {
                uploadContainer = _makeButton('upload-planet', _('Share project'), x, y, cellsize, 0);
                uploadContainer.visible = false;
                __addEventHandlers(uploadContainer, doUploadToPlanet);
            } else {
                uploadContainer = _makeButton('planet-disabled-button', _('Offline. Sharing is unavailable.'), x, y, cellsize, 0);
                uploadContainer.visible = false;
            }

            // Force center-aligned labels
            var x = 82.5 + LEADING;
            saveSVGContainer = _makeButton('save-svg', _('Save as .svg'), x, y, cellsize, 0);
            saveSVGContainer.visible = false;
            __addEventHandlers(saveSVGContainer, save.saveSVG.bind(save));

            savePNGContainer = _makeButton('save-png', _('Save as .png'), x, y, cellsize, 0);
            savePNGContainer.visible = false;
            __addEventHandlers(savePNGContainer, save.savePNG.bind(save));

            if (_THIS_IS_MUSIC_BLOCKS_) {
                saveWAVContainer = _makeButton('save-wav', _('Save as .wav'), x, y, cellsize, 0);
                saveWAVContainer.visible = false;
                __addEventHandlers(saveWAVContainer, save.saveWAV.bind(save));

                saveLilypondContainer = _makeButton('save-lilypond', _('Save sheet music'), x, y, cellsize, 0);
                saveLilypondContainer.visible = false;
                __addEventHandlers(saveLilypondContainer, save.saveLilypond.bind(save));

                saveABCContainer = _makeButton('save-abc', _('Save as .abc'), x, y, cellsize, 0);
                saveABCContainer.visible = false;
                __addEventHandlers(saveABCContainer, save.saveAbc.bind(save));
            }

            saveArtworkContainer = _makeButton('save-block-artwork', _('Save block artwork'), x, y, cellsize, 0);
            saveArtworkContainer.visible = false;
            __addEventHandlers(saveArtworkContainer, save.saveBlockArtwork.bind(save));

            // Settings Box Buttons: Mode, Language, Smaller, Larger
            // Force left-aligned labels
            var x = 27.5;
            beginnerModeContainer = _makeButton('beginner-button', _('Switch to advanced mode'), x, y, cellsize, 0);
            beginnerModeContainer.visible = false;
            __addEventHandlers(beginnerModeContainer, doSwitchMode);

            advancedModeContainer = _makeButton('advanced-button', _('Switch to beginner mode'), x, y, cellsize, 0);
            
            advancedModeContainer.visible = false;
            __addEventHandlers(advancedModeContainer, doSwitchMode);

            // Force center-aligned labels
            var x = 82.5 + LEADING;
            languageContainer = _makeButton('language-button', _('Select language'), x, y, cellsize, 0);
            languageContainer.visible = false;
            __addEventHandlers(languageContainer, doLanguageBox);

            smallerContainer = _makeButton('smaller-button', _('Decrease block size'), x, y, cellsize, 0);
            smallerContainer.visible = false;
            __addEventHandlers(smallerContainer, doSmallerBlocks);

            largerContainer = _makeButton('bigger-button', _('Increase block size'), x, y, cellsize, 0);
            largerContainer.visible = false;
            __addEventHandlers(largerContainer, doLargerBlocks);

            smallerOffContainer = _makeButton('smaller-disable-button', _('Cannot be further decreased'), x, y, cellsize, 0);
            smallerOffContainer.visible = false;

            largerOffContainer = _makeButton('bigger-disable-button', _('Cannot be further increased'), x, y, cellsize, 0);
            largerOffContainer.visible = false;

            // ALways create these buttons (but not use them in beginner mode)
            statsContainer = _makeButton('stats-button', _('Display statistics'), x, y, cellsize, 0);
            statsContainer.visible = false;
            __addEventHandlers(statsContainer, doAnalytics);

            pluginsContainer = _makeButton('plugins-button', _('Load plugin from file'), x, y, cellsize, 0);
            pluginsContainer.visible = false;
            __addEventHandlers(pluginsContainer, doOpenPlugin);

            deletePluginContainer = _makeButton('plugins-delete-button', _('Delete plugin'), x, y, cellsize, 0);
            deletePluginContainer.visible = false;
            __addEventHandlers(deletePluginContainer, deletePlugin);

            scrollOnContainer = _makeButton('scroll-unlock-button', _('Enable horizontal scrolling'), x, y, cellsize, 0);
            scrollOnContainer.visible = false;
            __addEventHandlers(scrollOnContainer, setScroller, true);

            scrollOffContainer = _makeButton('scroll-lock-button', _('Disable horizontal scrolling'), x, y, cellsize, 0);
            scrollOffContainer.visible = false;
            __addEventHandlers(scrollOffContainer, setScroller, false);

            // Clear Box Confirm Button
            confirmContainer = _makeButton('empty-trash-confirm-button', _('confirm'), x, y, cellsize, 0);
            confirmContainer.visible = false;
            __addEventHandlers(confirmContainer, _afterDelete);

        };

        function _setupAuxMenu(turtleBlocksScale) {
            if (menuContainer !== undefined) {
                stage.removeChild(menuContainer);
                for (var i in onscreenMenu) {
                    stage.removeChild(onscreenMenu[i]);
                }
            }

            onscreenMenu = [];

            // NOTE: see getAuxToolbarButtonNames in turtledefs.js
            // Misc. other buttons
            // name / onpress function / label / onlongpress function / onextralongpress function / onlongpress icon / onextralongpress icon
            if (planet) {
                var planetMenuItem = ['planet', _doOpenSamples, _('Find and share projects'), null, null, null, null];
            } else {
                var planetMenuItem = ['planet-disabled', null, _('Offline. Sharing is unavailable.'), null, null, null, null];
            }

            if (_THIS_IS_MUSIC_BLOCKS_) {
                if (beginnerMode) {
                    var menuNames = [
                        planetMenuItem,
                        ['open', doLoad, _('Load project from files'), _doMergeLoad, _doMergeLoad, 'open-merge-button', 'open-merge-button'],
                        ['save', doSave, _('Save project'), null, null, null, null],
                        ['paste-disabled', pasteStack, _('Right-click to copy.') + ' [Alt-C] ' + _('Click here to paste.') + ' [Alt-V]', null, null, null, null],
                        ['Cartesian', _doCartesianPolar, _('Cartesian') + '/' + _('Polar'), null, null, null, null],
                        ['utility', _doUtilityBox, _('Settings'), null, null, null, null],
                        ['new', _deleteBlocksBox, _('New Project'), null, null, null, null],
                        ['restore-trash', _restoreTrash, _('Restore'), null, null, null, null]
                    ];
                } else {
                    var menuNames = [
                        planetMenuItem,
                        ['open', doLoad, _('Load project from files'), _doMergeLoad, _doMergeLoad, 'open-merge-button', 'open-merge-button'],
                        ['save', doSave, _('Save project'), null, null, null, null],
                        ['paste-disabled', pasteStack, _('Right-click to copy.') + ' [Alt-C] ' + _('Click here to paste.') + ' [Alt-V]', null, null, null, null],
                        ['Cartesian', _doCartesianPolar, _('Cartesian') + '/' + _('Polar'), null, null, null, null],
                        // ['compile', _doPlaybackBox, _('playback'), null, null, null, null],
                        ['utility', _doUtilityBox, _('Settings'), null, null, null, null],
                        ['new', _deleteBlocksBox, _('New Project'), null, null, null, null],
                        ['restore-trash', _restoreTrash, _('Restore'), null, null, null, null]
                    ];
                }
            } else {
                var menuNames = [
                    planetMenuItem,
                    ['open', doLoad, _('Load project from files'), _doMergeLoad, _doMergeLoad, 'open-merge-button', 'open-merge-button'],
                    ['save', doSave, _('Save project'), null, null, null, null],
                    ['paste-disabled', pasteStack, _('Paste'), null, null, null, null],
                    ['Cartesian', _doCartesianPolar, _('Cartesian') + '/' + _('Polar'), null, null, null, null],
                    // ['compile', _doPlaybackBox, _('playback'), null, null, null, null],
                    ['utility', _doUtilityBox, _('Settings'), null, null, null, null],
                    ['new', _deleteBlocksBox, _('Delete all'), null, null, null, null],
                    ['restore-trash', _restoreTrash, _('Restore'), null, null, null, null]
                ];
            }

            if (planet) {
                document.querySelector('#myOpenFile').addEventListener('change', function (event) {
                    planet.closePlanet();
                });
            }

            var btnSize = cellSize;
            /*
            var dx = 0;
            var dy = btnSize;
            */

            var x = Math.floor(canvas.width / turtleBlocksScale) - btnSize / 2;
            var y = Math.floor(btnSize / 2);

            menuContainer = _makeButton('menu-button', '', x, y, btnSize, menuButtonsVisible ? 90 : undefined);
            _loadButtonDragHandler(menuContainer, x, y, _doMenuButton, null, null, null, null);

            var x = Math.floor(-btnSize / 2);
            var y = Math.floor(btnSize / 2);

            var dx = btnSize;
            var dy = 0;

            for (var i = 0; i < menuNames.length; i++) {
                if (!getAuxToolbarButtonNames(menuNames[i][0])) {
                    continue;
                }

                x += dx;
                y += dy;
                var container = _makeButton(menuNames[i][0] + '-button', menuNames[i][2], x, y, btnSize, 0);
                // Save a reference to the containers as we have to move them around.
                if (menuNames[i][0] === 'paste-disabled') {
                    pasteContainer = container;
                } else if (menuNames[i][0] === 'Cartesian') {
                    gridContainer = container;

                    var gridButtons = ['header-icons/Cartesian-polar-button.svg', 'header-icons/polar-button.svg', 'header-icons/no-grid-button.svg'];
                    for (var j = 0; j < gridButtons.length; j++) {
                        _makeExtraGridButtons(gridButtons[j], 250 + j * 250);
                    }
                } else if (menuNames[i][0] === 'utility') {
                    utilityContainer = container;
                } else if (menuNames[i][0] === 'save') {
                    saveContainer = container;
                } else if (menuNames[i][0] === 'new') {
                    newContainer = container;
                } else if (menuNames[i][0] === 'open') {
                    openContainer = container;
                } else if (menuNames[i][0] === 'restore-trash') {
                    restoreContainer = container;
                } else if (menuNames[i][0] === 'planet' || menuNames[i][0] === 'planet-disabled') {
                    planetContainer = container;
                }

                _loadButtonDragHandler(container, x, y, menuNames[i][1],menuNames[i][3],menuNames[i][4],menuNames[i][5],menuNames[i][6]);
                onscreenMenu.push(container);
                container.visible = false;
            }

            // Always start with menuButton off.
            menuButtonsVisible = false;
        };

        function _makeExtraGridButtons(name, delay) {
            setTimeout(function () {
                var img = new Image();

                img.onload = function () {
                    var originalSize = 55;
                    var halfSize = Math.floor(cellSize / 2);

                    var bitmap = new createjs.Bitmap(img);
                    if (cellSize !== originalSize) {
                        bitmap.scaleX = cellSize / originalSize;
                        bitmap.scaleY = cellSize / originalSize;
                    }

                    bitmap.regX = halfSize / bitmap.scaleX;
                    bitmap.regY = halfSize / bitmap.scaleY;
                    gridContainer.addChild(bitmap);
                    bitmap.visible = false;
                    gridImages.push(bitmap);

                    update = true;
                };

                img.src = name;
            }, delay);
        };

        function doPopdownPalette() {
            console.log('doPopdownPalette');
            var p = new PopdownPalette(palettes);
            p.popdown();
        };

        function _showHelp() {
            var helpWidget = new HelpWidget();
            helpWidget.init(null);
        };

        function _doMenuButton() {
            _doMenuAnimation(true);
        };

        function _doMenuAnimation(arg) {
            if (arg === undefined) {
                var animate = true;
            } else {
                var animate = arg;
            }

            if (animate) {
                var timeout = 500;
            } else {
                var timeout = 50;
            }

            var bitmap = last(menuContainer.children);
            if (bitmap != null) {
                if (animate) {
                    var r = bitmap.rotation;
                    if (r % 90 !== 0) {
                        return;
                    }

                    createjs.Tween.get(bitmap)
                        .to({
                            rotation: r
                        })
                        .to({
                            rotation: r + 90
                        }, 500);
                } else {
                    bitmap.rotation += 90;
                }
            } else {
                // Race conditions during load
                setTimeout(_doMenuAnimation, 50);
            }

            setTimeout(function () {
                if (menuButtonsVisible) {
                    menuButtonsVisible = false;
                    _showHideAuxMenu(false);
                } else {
                    menuButtonsVisible = true;
                    for (var button in onscreenMenu) {
                        onscreenMenu[button].visible = true;
                    }

                    _showHideAuxMenu(false);
                }
                update = true;
            }, timeout);
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

            if (parent == undefined) {
                stage.addChild(container);
            } else {
                parent.addChild(container);
            }

            container.x = x;
            container.y = y;

            var text = new createjs.Text(label, '14px Sans', '#282828');
            if (container.x < 55) {
                text.textAlign = 'left';
                text.x = -14;
            } else {
                text.textAlign = 'center';
                text.x = 0;
            }

            text.y = 30;
            text.visible = false;

            var circles;
            container.on('mouseover', function (event) {
                for (var c = 0; c < container.children.length; c++) {
                    if (container.children[c].text != undefined) {
                        container.children[c].visible = true;
                        // Do we need to add a background?
                        // Should be image and text, hence === 2
                        // The exception is the Cartesian grid
                        if ([2, 5, 8].indexOf(container.children.length) !== -1) {
                            var b = container.children[c].getBounds();
                            var bg = new createjs.Shape();
                            if (container.children[c].textAlign === 'center') {
                                bg.graphics.beginFill('#FFF').drawRoundRect(b.x - 8, container.children[c].y - 2 , b.width + 16, b.height + 4, 5, 5, 5, 5);
                            } else {
                                bg.graphics.beginFill('#FFF').drawRoundRect(b.x - 22, container.children[c].y - 2 , b.width + 16, b.height + 4, 5, 5, 5, 5);
                            }
                            container.addChildAt(bg, 0);
                        }

                        container.children[0].visible = true;
                        stage.update();
                        break;
                    }
                }

                var r = size / 2;
                circles = showButtonHighlight(container.x, container.y, r, event, palettes.scale, stage);
            });

            container.on('mouseout', function (event) {
                hideButtonHighlight(circles, stage);
                for (var c = 0; c < container.children.length; c++) {
                    if (container.children[c].text != undefined) {
                        container.children[c].visible = false;
                        container.children[0].visible = false;
                        stage.update();
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

                if (name === 'Cartesian-button') {
                    gridButtonLabel = text;
                    gridImages = [bitmap];
                }

            };

            img.src = 'header-icons/' + name + '.svg';
            container.addChild(text);
            return container;
        };

        function _loadButtonDragHandler(container, ox, oy, action, longAction, extraLongAction, longImg, extraLongImg) {
            // Prevent multiple button presses (i.e., debounce).
            var lockTimer = null;
            var locked = false;

            if (longAction === null) {
                longAction = action;
            }

            if (extraLongAction === null) {
                extraLongAction = longAction;
            }

            // Long and extra-long press variables declaration
            var pressTimer = null;
            var isLong = false;
            var pressTimerExtra = null;
            var isExtraLong = false;

            var formerContainer = container;

            container.on('mouseover', function (event) {
                if (!loading) {
                    document.body.style.cursor = 'pointer';
                }
            });

            container.on('mouseout', function (event) {
                if (!loading) {
                    document.body.style.cursor = 'default';
                }
            });

            container.on('mousedown', function (event) {
                if (locked) {
                    return;
                } else {
                    locked = true;

                    lockTimer = setTimeout(function () {
                        locked = false;

                        clearTimeout(pressTimer);
                        clearTimeout(pressTimerExtra);
                        if (longImg !== null || extraLongImg !== null) {
                            container.visible = false;
                            container = formerContainer;
                            container.visible = true;
                        }
                    }, 1500);
                }

                var mousedown = true;

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

                function __pressupFunction (event) {
                    clearTimeout(lockTimer);

                    hideButtonHighlight(circles, stage);
                    // container.x = ox;
                    // container.y = oy;

                    if (longImg !== null || extraLongImg !== null) {
                        container.visible = false;
                        container = formerContainer;
                        container.visible = true;
                    }

                    locked = false;

                    if (action != null && mousedown && !locked) {
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

                    mousedown = false;
                };

                // Remove the previous listener, if any, so we don't
                // get multiple listeners added to the event.
                container.removeAllEventListeners('pressup');
                var closure = container.on('pressup', __pressupFunction);

                isLong = false;
                isExtraLong = false;
            });
        };

        function pasted () {
            var pasteinput = docById('paste').value;
            var rawData = pasteinput;
            if (rawData == null || rawData == '') {
                return;
            }

            var cleanData = rawData.replace('\n', ' ');
            try {
                var obj = JSON.parse(cleanData);
            } catch (e) {
                errorMsg(_('Could not parse JSON input.'));
                return;
            }

            for (var name in blocks.palettes.dict) {
                blocks.palettes.dict[name].hideMenu(true);
            }

            refreshCanvas();

            blocks.loadNewBlocks(obj);
            pasteBox.hide();
        };

        function deltaY (dy) {
            headerContainer.y += dy;
            for (var i = 0; i < onscreenButtons.length; i++) {
                onscreenButtons[i].y += dy;
            }

            for (var i = 0; i < onscreenMenu.length; i++) {
                onscreenMenu[i].y += dy;
            }

            palettes.deltaY(dy);
            turtles.deltaY(dy);
            blocksContainer.y += dy;

            refreshCanvas();
        };

        function _showHideAuxMenu (resize) {
            var cellsize = 55;
            if (!resize && headerContainer.y === 0) {
                dy = cellsize + LEADING;
                headerContainer.y = dy;
                for (var i = 0; i < onscreenButtons.length; i++) {
                    onscreenButtons[i].y += dy;
                }

                for (var i = 0; i < onscreenMenu.length; i++) {
                    onscreenMenu[i].y = cellsize / 2;
                    onscreenMenu[i].visible = true;
                }

                palettes.deltaY(dy);
                turtles.deltaY(dy);
                blocksContainer.y += dy;
            } else {
                var dy = headerContainer.y;
                headerContainer.y = 0;
                for (var i = 0; i < onscreenButtons.length; i++) {
                    onscreenButtons[i].y = cellsize / 2;
                }

                for (var i = 0; i < onscreenMenu.length; i++) {
                    onscreenMenu[i].y = -cellsize;
                    onscreenMenu[i].visible = false;
                }

                palettes.deltaY(-dy);
                turtles.deltaY(-dy);
                blocksContainer.y -= dy;
            }

            confirmContainer.visible = false;
            beginnerModeContainer.visible = false;
            advancedModeContainer.visible = false;
            languageContainer.visible = false;
            smallerContainer.visible = false;
            largerContainer.visible = false;
            smallerOffContainer.visible = false;
            largerOffContainer.visible = false;
            statsContainer.visible = false;
            pluginsContainer.visible = false;
            deletePluginContainer.visible = false;
            scrollOnContainer.visible = false;
            scrollOffContainer.visible = false;
            saveHTMLContainer.visible = false;
            uploadContainer.visible = false;
            saveSVGContainer.visible = false;
            savePNGContainer.visible = false;
            saveArtworkContainer.visible = false;
            if (_THIS_IS_MUSIC_BLOCKS_) {
                saveWAVContainer.visible = false;
                saveLilypondContainer.visible = false;
                saveABCContainer.visible = false;
            }

            refreshCanvas();
        };

        function _piemenuStageContext_x () {
            // A submenu menu to replace the top and right toolbars
            docById('submenuWheelDiv').style.width = '900px';
            docById('submenuWheelDiv').style.height = '900px';
            docById('submenuWheelDiv').style.left = '192px';
            docById('submenuWheelDiv').style.top = '-375px';
            docById('submenuWheelDiv').style.position = 'absolute';
            docById('submenuWheelDiv').style.display = '';

            // Main menu items, [submenu index], function
            var wheelValues = [
                ['imgsrc:header-icons/hide-blocks-button.svg', _doOpenSamples],
                ['imgsrc:header-icons/collapse-blocks-button.svg', doLoad],
                ['imgsrc:header-icons/go-home-button.svg', doSave],
                ['imgsrc:header-icons/help-button.svg', pasteStack],
                [null], [null], [null], [null],
            ];

            var subwheelValues = [
                ['imgsrc:header-icons/planet-button.svg', _doOpenSamples],
                ['imgsrc:header-icons/open-button.svg', doLoad],
                ['imgsrc:header-icons/save-button.svg', doSave],
                ['imgsrc:header-icons/paste-button.svg', pasteStack],
                ['imgsrc:header-icons/Cartesian-button.svg', _doCartesianPolar],
                ['imgsrc:header-icons/utility-button.svg', _doUtilityBox],
                ['imgsrc:header-icons/new-button.svg', _deleteBlocksBox],
                ['imgsrc:header-icons/restore-trash-button.svg', _restoreTrash],
                [null], [null], [null], [null],
                [null], [null], [null], [null],
            ];

            var wheelLabels = [];
            for (var i = 0; i < wheelValues.length; i++) {
                wheelLabels.push(wheelValues[i][0]);
            }

            var subwheelLabels = [];
            for (var i = 0; i < subwheelValues.length; i++) {
                subwheelLabels.push(subwheelValues[i][0]);
            }

            var wheel = new wheelnav('submenuWheelDiv', null, 450, 450);
            var submenuWheel = new wheelnav('_submenuWheel', wheel.raphael);

            wheelnav.cssMode = true;

            wheel.keynavigateEnabled = true;

            wheel.colors = ['#2584af'];
            wheel.slicePathFunction = slicePath().DonutSlice;
            wheel.slicePathCustom = slicePath().DonutSliceCustomization();
            wheel.slicePathCustom.minRadiusPercent = 0.1;
            wheel.slicePathCustom.maxRadiusPercent = 0.4;
            wheel.sliceSelectedPathCustom = wheel.slicePathCustom;
            wheel.sliceInitPathCustom = wheel.slicePathCustom;
            wheel.animatetime = 300;
            wheel.navAngle = 360 / (2 * wheelLabels.length);
            wheel.clickModeRotate = false;
            wheel.createWheel(wheelLabels);

            /*
            wheel.navItems[0].setTooltip(_('Close'));
            wheel.navItems[1].setTooltip(_('Run'));
            wheel.navItems[2].setTooltip(_('Stop'));
            wheel.navItems[3].setTooltip(_('Clean'));
            wheel.navItems[4].setTooltip(_('Show/hide blocks'));
            wheel.navItems[5].setTooltip(_('Expand/collapse collapsible blocks'));
            wheel.navItems[6].setTooltip(_('Home'));
            wheel.navItems[7].setTooltip(_('More'));
            wheel.navItems[8].setTooltip(_('Help'));
            */

            submenuWheel.colors = ['#489eca'];
            submenuWheel.slicePathFunction = slicePath().DonutSlice;
            submenuWheel.slicePathCustom = slicePath().DonutSliceCustomization();
            submenuWheel.slicePathCustom.minRadiusPercent = 0.4;
            submenuWheel.slicePathCustom.maxRadiusPercent = 0.7;
            submenuWheel.sliceSelectedPathCustom = submenuWheel.slicePathCustom;
            submenuWheel.sliceInitPathCustom = submenuWheel.slicePathCustom;
            submenuWheel.clickModeRotate = false;
            // submenuWheel.navAngle = -180 / wheelValues.length + 180 / (wheelValues.length * submenuWheelValues[0].length);
            submenuWheel.navAngle = 360 / (2 * subwheelLabels.length);
            submenuWheel.createWheel(subwheelLabels);

            /*
            submenuWheel.navItems[0].setTooltip(_('Run step by step'));
            submenuWheel.navItems[1].setTooltip(_('Run slowly'));
            submenuWheel.navItems[2].setTooltip(_('Run fast'));

            if (_THIS_IS_MUSIC_BLOCKS_) {
                submenuWheel.navItems[3].setTooltip(_('Run music slowly'));
                submenuWheel.navItems[4].setTooltip(_('Run music step by step'));

                if (planet) {
                    submenuWheel.navItems[5].setTooltip(_('Load samples from server'));
                } else {
                    submenuWheel.navItems[5].setTooltip(_('The Planet is unavailable.'));
                }

                submenuWheel.navItems[6].setTooltip(_('Load project from file'));
                submenuWheel.navItems[7].setTooltip(_('Merge project from file'));
                submenuWheel.navItems[8].setTooltip(_('Save project'));
                submenuWheel.navItems[9].setTooltip(_('Click here to paste'));

                if (cartesianBitmap.visible && polarBitmap.visible) {
                    //.TRANS: show Polar coordinate overlay grid
                    submenuWheel.navItems[10].setTooltip(_('Polar'));
                } else if (!cartesianBitmap.visible && polarBitmap.visible) {
                    //.TRANS: hide Polar coordinate overlay grid
                    submenuWheel.navItems[10].setTooltip(_('hide grid'));
                } else if (!cartesianBitmap.visible && !polarBitmap.visible) {
                    submenuWheel.navItems[10].setTooltip(_('Cartesian'));
                } else if (cartesianBitmap.visible && !polarBitmap.visible) {
                    //.TRANS: show Cartesian coordinate overlay grid
                    submenuWheel.navItems[10].setTooltip(_('Cartesian') + ' + ' + _('Polar'));
                }

                submenuWheel.navItems[11].setTooltip(_('playback'));
                submenuWheel.navItems[12].setTooltip(_('Settings'));
                submenuWheel.navItems[13].setTooltip(_('New Project'));
                submenuWheel.navItems[14].setTooltip(_('Restore'));

                if (beginnerMode) {
                    submenuWheel.navItems[15].setTooltip(_('Switch to advanced mode'));
                } else {
                    submenuWheel.navItems[15].setTooltip(_('Switch to beginner mode'));
                }
            } else {
                if (planet) {
                    submenuWheel.navItems[3].setTooltip(_('Load samples from server'));
                } else {
                    submenuWheel.navItems[3].setTooltip(_('The Planet is unavailable.'));
                }

                submenuWheel.navItems[4].setTooltip(_('Load project from file'));
                submenuWheel.navItems[5].setTooltip(_('Merge project from file'));
                submenuWheel.navItems[6].setTooltip(_('Save project'));
                submenuWheel.navItems[7].setTooltip(_('Click here to paste'));

                if (cartesianBitmap.visible && polarBitmap.visible) {
                    //.TRANS: show Polar coordinate overlay grid
                    submenuWheel.navItems[8].setTooltip(_('Polar'));
                } else if (!cartesianBitmap.visible && polarBitmap.visible) {
                    //.TRANS: hide Polar coordinate overlay grid
                    submenuWheel.navItems[8].setTooltip(_('hide grid'));
                } else if (!cartesianBitmap.visible && !polarBitmap.visible) {
                    submenuWheel.navItems[8].setTooltip(_('Cartesian'));
                } else if (cartesianBitmap.visible && !polarBitmap.visible) {
                    //.TRANS: show Cartesian coordinate overlay grid
                    submenuWheel.navItems[8].setTooltip(_('Cartesian') + ' + ' + _('Polar'));
                }

                submenuWheel.navItems[9].setTooltip(_('Settings'));
                submenuWheel.navItems[10].setTooltip(_('New Project'));
                submenuWheel.navItems[11].setTooltip(_('Restore'));
            }

            var __selectionChanged = function () {
                var i = submenuWheel.selectedNavItemIndex;
                if (submenuWheelValues[i][1] !== null) {
                    __exitMenu();
                    submenuWheelValues[i][1]();
                }
            };
            */
            var __exitMenu = function () {
                var d = new Date();
                piemenuExitTime = d.getTime();
                docById('submenuWheelDiv').style.display = 'none';
                wheel.removeWheel();
            };

            var __showHide = function () {
                var i = wheel.selectedNavItemIndex;
                /*
                var subitems = wheelValues[i][1];
                if (subitems === null) {
                    for (var j = 0; j < submenuWheelValues.length; j++) {
                        submenuWheel.navItems[j].navItem.hide();
                    }
                } else {
                    for (var j = 0; j < submenuWheelValues.length; j++) {
                        if (j < subitems[0] || j > subitems[1]) {
                            submenuWheel.navItems[j].navItem.hide();
                        } else {
                            submenuWheel.navItems[j].navItem.show();
                        }
                    }
                }
                */
            };

            wheel.navItems[0].navigateFunction = function () {
                // __exitMenu();
            };

            var __action = function () {
                var i = wheel.selectedNavItemIndex;
                console.log('action: ' + i);
                __showHide();

                if (wheelValues[i][2] !== null) {
                   // __exitMenu();
                    wheelValues[i][2]();
                }
            };

            for (var i = 1; i < wheelValues.length; i++) {
                wheel.navItems[i].navigateFunction = __action;
            }

            /*
            // Hide the widget when the selection is made.
            for (var i = 0; i < tabsLabels.length; i++) {
                submenuWheel.navItems[i].navigateFunction = function () {
                    __selectionChanged();
                    __exitMenu();
                };
            }
            */

            // wheel.navigateWheel(1);

            setTimeout(function () {
                blocks.stageClick = false;
            }, 500);
        };

        function piemenuBlockContext (activeBlock) {
            if (activeBlock === null) {
                return;
            }

            // piemenu version of ruler

            // Position the widget centered over the note block.
            var x = blocks.blockList[activeBlock].container.x;
            var y = blocks.blockList[activeBlock].container.y;

            var canvasLeft = blocks.canvas.offsetLeft + 28 * blocks.getStageScale();
            var canvasTop = blocks.canvas.offsetTop + 6 * blocks.getStageScale();

            docById('contextWheelDiv').style.position = 'absolute';
            docById('contextWheelDiv').style.left = Math.min(blocks.turtles._canvas.width - 300, Math.max(0, Math.round((x + blocks.stage.x) * blocks.getStageScale() + canvasLeft) - 150)) + 'px';
            docById('contextWheelDiv').style.top = Math.min(blocks.turtles._canvas.height - 350, Math.max(0, Math.round((y + blocks.stage.y) * blocks.getStageScale() + canvasTop) - 150)) + 'px';
            docById('contextWheelDiv').style.display = '';

            labels = ['imgsrc:header-icons/copy-button.svg',
                      'imgsrc:header-icons/paste-disabled-button.svg',
                      'imgsrc:header-icons/extract-button.svg',
                      'imgsrc:header-icons/empty-trash-button.svg',
                      'imgsrc:header-icons/cancel-button.svg'];

            var topBlock = blocks.findTopBlock(activeBlock);
            if (blocks.blockList[topBlock].name === 'action') {
                labels.push('imgsrc:header-icons/save-blocks-button.svg');
            }

            var name = blocks.blockList[blocks.activeBlock].name;
            if (name in BLOCKHELP) {
                labels.push('imgsrc:header-icons/help-button.svg');
                var helpButton = labels.length - 1;
            } else {
                var helpButton = null;
            }

            var wheel = new wheelnav('contextWheelDiv', null, 150, 150);
            wheel.colors = ['#808080', '#909090', '#808080', '#909090', '#707070'];
            wheel.slicePathFunction = slicePath().DonutSlice;
            wheel.slicePathCustom = slicePath().DonutSliceCustomization();
            wheel.slicePathCustom.minRadiusPercent = 0.4;
            wheel.slicePathCustom.maxRadiusPercent = 1.0;
            wheel.sliceSelectedPathCustom = wheel.slicePathCustom;
            wheel.sliceInitPathCustom = wheel.slicePathCustom;
            wheel.clickModeRotate = false;
            wheel.initWheel(labels);
            wheel.createWheel();

            wheel.navItems[0].setTooltip(_('Copy'));
            wheel.navItems[1].setTooltip(_('Paste'));
            wheel.navItems[2].setTooltip(_('Extract'));
            wheel.navItems[3].setTooltip(_('Move to trash'));
            wheel.navItems[4].setTooltip(_('Close'));
            if (blocks.blockList[topBlock].name === 'action') {
                wheel.navItems[5].setTooltip(_('Save stack'));
            }

            if (helpButton !== null) {
                wheel.navItems[helpButton].setTooltip(_('Help'));
            }

            wheel.navItems[0].selected = false;

            wheel.navItems[0].navigateFunction = function () {
                blocks.activeBlock = activeBlock;
                blocks.prepareStackForCopy();
                wheel.navItems[1].setTitle('imgsrc:header-icons/paste-button.svg');
                wheel.navItems[1].refreshNavItem(true);
                wheel.refreshWheel();
            };

            wheel.navItems[1].navigateFunction = function () {
                blocks.pasteStack();
            };

            wheel.navItems[2].navigateFunction = function () {
                blocks.activeBlock = activeBlock;
                blocks.extract();
            };

            wheel.navItems[3].navigateFunction = function () {
                blocks.activeBlock = activeBlock;
                blocks.extract();
                blocks.sendStackToTrash(blocks.blockList[activeBlock]);
                docById('contextWheelDiv').style.display = 'none';
            };

            wheel.navItems[4].navigateFunction = function () {
                docById('contextWheelDiv').style.display = 'none';
            };

            if (blocks.blockList[activeBlock].name === 'action') {
                wheel.navItems[5].navigateFunction = function () {
                    blocks.activeBlock = activeBlock;
                    blocks.saveStack();
                };
            }

            if (helpButton !== null) {
                wheel.navItems[helpButton].navigateFunction = function () {
                    blocks.activeBlock = activeBlock;
                    var helpWidget = new HelpWidget();
                    helpWidget.init(blocks);
                };
            }

            setTimeout(function () {
                blocks.stageClick = false;
            }, 500);
        };

    };
});
