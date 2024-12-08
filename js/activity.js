// Copyright (c) 2014-22 Walter Bender
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

/*
   globals

   _, ALTO, analyzeProject, BASS, BIGGERBUTTON, BIGGERDISABLEBUTTON,
   Blocks, Boundary, CARTESIAN, changeImage, closeWidgets,
   COLLAPSEBLOCKSBUTTON, COLLAPSEBUTTON, createDefaultStack,
   createHelpContent, createjs, DATAOBJS, DEFAULTBLOCKSCALE,
   DEFAULTDELAY, define, doBrowserCheck, doBrowserCheck, docByClass,
   docById, doSVG, EMPTYHEAPERRORMSG, EXPANDBUTTON, FILLCOLORS,
   getMacroExpansion, getOctaveRatio, getTemperament, GOHOMEBUTTON,
   GOHOMEFADEDBUTTON, GRAND, HelpWidget, HIDEBLOCKSFADEDBUTTON,
   hideDOMLabel, initBasicProtoBlocks, initPalettes,
   INLINECOLLAPSIBLES, jQuery, JSEditor, LanguageBox, Logo, MSGBLOCK,
   NANERRORMSG, NOACTIONERRORMSG, NOBOXERRORMSG, NOINPUTERRORMSG,
   NOMICERRORMSG, NOSQRTERRORMSG, NOSTRINGERRORMSG, PALETTEFILLCOLORS,
   PALETTESTROKECOLORS, PALETTEHIGHLIGHTCOLORS, HIGHLIGHTSTROKECOLORS,
   Palettes, PasteBox, PlanetInterface, platform, platformColor,
   piemenuKey, POLAR, preparePluginExports, processMacroData,
   processPluginData, processRawPluginData, require, SaveInterface,
   SHOWBLOCKSBUTTON, SMALLERBUTTON, SMALLERDISABLEBUTTON, SOPRANO,
   SPECIALINPUTS, STANDARDBLOCKHEIGHT, StatsWindow, STROKECOLORS,
   TENOR, TITLESTRING, Toolbar, Trashcan, TREBLE, Turtles, TURTLESVG,
   updatePluginObj, ZERODIVIDEERRORMSG, GRAND_G, GRAND_F,
   SHARP, FLAT, buildScale, TREBLE_F, TREBLE_G
 */

/*
   exported

   Activity, LEADING, _THIS_IS_MUSIC_BLOCKS_, _THIS_IS_TURTLE_BLOCKS_,
   globalActivity, hideArrows, doAnalyzeProject
 */
const LEADING = 0;
const BLOCKSCALES = [1, 1.5, 2, 3, 4];
const _THIS_IS_MUSIC_BLOCKS_ = true;
const _THIS_IS_TURTLE_BLOCKS_ = !_THIS_IS_MUSIC_BLOCKS_;

const _ERRORMSGTIMEOUT_ = 15000;
const _MSGTIMEOUT_ = 60000;

let MYDEFINES = [
    "utils/platformstyle",
    "easeljs.min",
    "tweenjs.min",
    "preloadjs.min",
    "howler",
    "p5.min",
    "p5.sound.min",
    "p5.dom.min",
    // 'mespeak',
    "Chart",
    "utils/utils",
    "activity/artwork",
    "widgets/status",
    "widgets/help",
    "utils/munsell",
    "activity/toolbar",
    "activity/trash",
    "activity/boundary",
    "activity/palette",
    "activity/protoblocks",
    "activity/blocks",
    "activity/block",
    "activity/turtledefs",
    "activity/notation",
    "activity/logo",
    "activity/turtle",
    "activity/turtles",
    "activity/turtle-singer",
    "activity/turtle-painter",
    "activity/languagebox",
    "activity/basicblocks",
    "activity/blockfactory",
    "activity/piemenus",
    "activity/planetInterface",
    "activity/rubrics",
    "activity/macros",
    "activity/SaveInterface",
    "utils/musicutils",
    "utils/synthutils",
    "utils/mathutils",
    "activity/pastebox",
    "prefixfree.min",
    "Tone",
    "activity/js-export/samples/sample",
    "activity/js-export/export",
    "activity/js-export/interface",
    "activity/js-export/constraints",
    "activity/js-export/ASTutils",
    "activity/js-export/generate",
    "activity/js-export/API/GraphicsBlocksAPI",
    "activity/js-export/API/PenBlocksAPI",
    "activity/js-export/API/RhythmBlocksAPI",
    "activity/js-export/API/MeterBlocksAPI",
    "activity/js-export/API/PitchBlocksAPI",
    "activity/js-export/API/IntervalsBlocksAPI",
    "activity/js-export/API/ToneBlocksAPI",
    "activity/js-export/API/OrnamentBlocksAPI",
    "activity/js-export/API/VolumeBlocksAPI",
    "activity/js-export/API/DrumBlocksAPI",
    "activity/js-export/API/DictBlocksAPI",
    "activity/turtleactions/RhythmActions",
    "activity/turtleactions/MeterActions",
    "activity/turtleactions/PitchActions",
    "activity/turtleactions/IntervalsActions",
    "activity/turtleactions/ToneActions",
    "activity/turtleactions/OrnamentActions",
    "activity/turtleactions/VolumeActions",
    "activity/turtleactions/DrumActions",
    "activity/turtleactions/DictActions",
    "activity/blocks/RhythmBlocks",
    "activity/blocks/MeterBlocks",
    "activity/blocks/PitchBlocks",
    "activity/blocks/IntervalsBlocks",
    "activity/blocks/ToneBlocks",
    "activity/blocks/OrnamentBlocks",
    "activity/blocks/VolumeBlocks",
    "activity/blocks/DrumBlocks",
    "activity/blocks/WidgetBlocks",
    "activity/blocks/RhythmBlockPaletteBlocks",
    "activity/blocks/ActionBlocks",
    "activity/blocks/FlowBlocks",
    "activity/blocks/NumberBlocks",
    "activity/blocks/BoxesBlocks",
    "activity/blocks/BooleanBlocks",
    "activity/blocks/HeapBlocks",
    "activity/blocks/DictBlocks",
    "activity/blocks/ExtrasBlocks",
    "activity/blocks/ProgramBlocks",
    "activity/blocks/GraphicsBlocks",
    "activity/blocks/PenBlocks",
    "activity/blocks/MediaBlocks",
    "activity/blocks/SensorsBlocks",
    "activity/blocks/EnsembleBlocks",
    "widgets/widgetWindows",
    "widgets/statistics",
    "widgets/jseditor"
];

if (_THIS_IS_MUSIC_BLOCKS_) {
    const MUSICBLOCKS_EXTRAS = [
        "widgets/modewidget",
        "widgets/meterwidget",
        "widgets/phrasemaker",
        "widgets/arpeggio",
        "widgets/aiwidget",
        "widgets/pitchdrummatrix",
        "widgets/rhythmruler",
        "widgets/pitchstaircase",
        "widgets/temperament",
        "widgets/tempo",
        "widgets/pitchslider",
        "widgets/musickeyboard",
        "widgets/timbre",
        "widgets/oscilloscope",
        "widgets/sampler",
        "activity/lilypond",
        "activity/abc",
        "activity/mxml"
    ];
    MYDEFINES = MYDEFINES.concat(MUSICBLOCKS_EXTRAS);
}

// Create a global variable from the Activity obj to provide access to
// blocks, logo, palettes, and turtles for plugins and js-export.
let globalActivity;

/**
 * Performs analysis on the project using the global activity.
 * @returns {object} - The analysis result.
 */
const doAnalyzeProject = function() {
    return analyzeProject(globalActivity);
};

/**
 * Represents an activity in the application.
 */
class Activity {
    /**
     * Creates an Activity instance.
     */
    constructor() {
        globalActivity = this;

        this.cellSize = 55;
        this.searchSuggestions = [];
        this.homeButtonContainer;

        this.msgTimeoutID = null;
        this.msgText = null;
        this.errorMsgTimeoutID = null;
        this.errorMsgText = null;
        this.errorMsgArrow = null;
        this.errorArtwork = {};

        this.cartesianBitmap = null;
        this.polarBitmap = null;
        this.trebleBitmap = null;
        this.trebleSharpBitmap = [null, null, null, null, null, null, null];
        this.trebleFlatBitmap = [null, null, null, null, null, null, null];
        this.grandBitmap = null;
        this.grandSharpBitmap = [null, null, null, null, null, null, null];
        this.grandFlatBitmap = [null, null, null, null, null, null, null];
        this.sopranoBitmap = null;
        this.sopranoSharpBitmap = [null, null, null, null, null, null, null];
        this.sopranoFlatBitmap = [null, null, null, null, null, null, null];
        this.altoBitmap = null;
        this.altoSharpBitmap = [null, null, null, null, null, null, null];
        this.altoFlatBitmap = [null, null, null, null, null, null, null];
        this.tenorBitmap = null;
        this.tenorSharpBitmap = [null, null, null, null, null, null, null];
        this.tenorFlatBitmap = [null, null, null, null, null, null, null];
        this.bassBitmap = null;
        this.bassSharpBitmap = [null, null, null, null, null, null, null];
        this.bassFlatBitmap = [null, null, null, null, null, null, null];

        const ERRORARTWORK = [
            "emptybox",
            "emptyheap",
            "negroot",
            "noinput",
            "zerodivide",
            "notanumber",
            "nostack",
            "notastring",
            "nomicrophone"
        ];

        this.saveLocally = null;
        this.scrollBlockContainer = false;
        this.blockRefreshCanvas = false;
        this.statsWindow = null;

        this.firstTimeUser = false;
        this.beginnerMode = false;

        // Flag to disable keyboard during loading of MB
        this.keyboardEnableFlag;
        this.inTempoWidget = false;
        this.projectID = null;
        this.storage = localStorage;

        // Flag to indicate whether the user is performing a 2D drag operation.
        this.isDragging = false;

        // Flag to indicate whether user is selecting
        this.isSelecting = false;

        // Flag to indicate the selection mode is on
        this.selectionModeOn = false;

        // Flag to check if the helpful search widget is active or not (for "click" event handler purpose)
        this.isHelpfulSearchWidgetOn = false;

        this.beginnerMode = true;
        try {
            if (this.storage.beginnerMode === undefined) {
                this.firstTimeUser = true;
            } else if (this.storage.beginnerMode !== null) {
                this.beginnerMode = this.storage.beginnerMode;
                if (typeof this.beginnerMode === "string") {
                    if (this.beginnerMode === "false") {
                        this.beginnerMode = false;
                    }
                }
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }

        try {
            let lang = "en";
            if (this.storage.languagePreference !== undefined) {
                lang = this.storage.languagePreference;
                document.webL10n.setLanguage(lang);
            } else {
                lang = navigator.language;
                if (lang.includes("-")) {
                    lang = lang.slice(0, lang.indexOf("-"));
                    document.webL10n.setLanguage(lang);
                }
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }

        this.KeySignatureEnv = ["C", "major", false];
        try {
            if (this.storage.KeySignatureEnv !== undefined) {
                // eslint-disable-next-line no-console
                console.log(this.storage.KeySignatureEnv);
                this.KeySignatureEnv = this.storage.KeySignatureEnv.split(",");
                this.KeySignatureEnv[2] = (this.KeySignatureEnv[2] === "true");
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error(e);
        }

        /**
         * Initialises major variables and renders default stack.
         * Sets up the initial state and dependencies of the activity.
         */
        this.setupDependencies = () => {
            createDefaultStack();
            createHelpContent(this);
            window.scroll(0, 0);

            /*
            try {
                meSpeak.loadConfig('lib/mespeak_config.json');
                lang = document.webL10n.getLanguage();

                if (['es', 'ca', 'de', 'el', 'eo', 'fi', 'fr', 'hu', 'it', 'kn', 'la', 'lv', 'nl', 'pl', 'pt', 'ro', 'sk', 'sv', 'tr', 'zh'].indexOf(lang) !== -1) {
                    meSpeak.loadVoice('lib/voices/' + lang + '.json');
                } else {
                    meSpeak.loadVoice('lib/voices/en/en.json');
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.debug(e);
            }
            */

            document.title = TITLESTRING;
            this.canvas = docById("myCanvas");

            // Set up a file chooser for the doOpen function.
            this.fileChooser = docById("myOpenFile");
            // Set up a file chooser for the doOpenPlugin function.
            this.pluginChooser = docById("myOpenPlugin");
            // The file chooser for all files
            this.allFilesChooser = docById("myOpenAll");
            this.auxToolbar = docById("aux-toolbar");
            // Error message containers
            this.errorText = docById("errorText");
            this.errorTextContent = docById("errorTextContent");
            // Hide Arrow on hiding error message
            this.errorText.addEventListener("click", this._hideArrows);
            // Show and populate the printText div.
            this.printText = docById("printText");
            this.printTextContent = docById("printTextContent");

            // Are we running off of a server?
            this.server = true;
            this.turtleBlocksScale = 1;
            this.mousestage = null;
            this.stage = null;
            this.turtles = null;
            this.palettes = null;
            this.blocks = null;
            this.logo = null;
            this.pasteBox = null;
            this.languageBox = null;
            this.planet = null;
            window.converter = null;
            this.buttonsVisible = true;
            this.headerContainer = null;
            this.swiping = false;
            this.menuButtonsVisible = false;
            this.scrollBlockContainer = false;
            this.currentKeyCode = 0;
            this.merging = false;
            this.loading = false;
            // On-screen buttons
            this.smallerContainer = null;
            this.largerContainer = null;
            this.resizeDebounce = false;
            this.hideBlocksContainer = null;
            this.collapseBlocksContainer = null;

            this.searchWidget = docById("search");
            this.searchWidget.style.visibility = "hidden";
            this.searchWidget.placeholder = _("Search for blocks");

            this.helpfulSearchWidget = document.createElement("input");
            this.helpfulSearchWidget.setAttribute("id", "helpfulSearch");
            this.helpfulSearchWidget.style.visibility = "hidden";
            this.helpfulSearchWidget.placeholder = _("Search for blocks");
            this.helpfulSearchWidget.classList.add("ui-autocomplete");
            this.helpfulSearchWidget.style.cssText = `
                padding: 2px;
                border: 2px solid grey;
                width: 220px;
                height: 20px;
                font-size: large;
            `;
            this.progressBar = docById("myProgress");
            this.progressBar.style.visibility = "hidden";

            new createjs.DOMElement(docById("paste"));
            this.paste = docById("paste");
            this.paste.style.visibility = "hidden";

            this.toolbarHeight = document.getElementById("toolbars").offsetHeight;

            this.helpfulWheelItems = [];

            this.setHelpfulSearchDiv();
        };

        /*
         * creates helpfulSearchDiv for search
         */
        this.setHelpfulSearchDiv = () => {
            if (docById("helpfulSearchDiv")) {
                docById("helpfulSearchDiv").parentNode.removeChild(
                    docById("helpfulSearchDiv")
                );
            }
            this.helpfulSearchDiv = document.createElement("div");
            this.helpfulSearchDiv.setAttribute("id", "helpfulSearchDiv");
            this.helpfulSearchDiv.style.cssText = `
                position: absolute;
                background-color: #f0f0f0;
                padding: 5px;
                border: 1px solid #ccc;
                width: 230px;
                display: none;
                z-index: 1;
            `;

            document.body.appendChild(this.helpfulSearchDiv);

            if (docById("helpfulSearch")) {
                docById("helpfulSearch").parentNode.removeChild(
                    docById("helpfulSearch")
                );
            }
            this.helpfulSearchDiv.appendChild(this.helpfulSearchWidget);
        }

        /*
         * displays helpfulSearchDiv on canvas
         */
        this._displayHelpfulSearchDiv = () => {
            this.helpfulSearchDiv.style.left = docById("helpfulWheelDiv").offsetLeft + 80 * this.getStageScale() + "px";
            this.helpfulSearchDiv.style.top = docById("helpfulWheelDiv").offsetTop + 110 * this.getStageScale() + "px";

            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            this.helpfulSearchDiv.style.display = "block";
            const menuWidth = this.helpfulSearchDiv.offsetWidth;
            const menuHeight = this.helpfulSearchDiv.offsetHeight;

            if (this.helpfulSearchDiv.offsetLeft + menuWidth > windowWidth) {
                this.helpfulSearchDiv.style.left = (windowWidth - menuWidth) + "px";
            }
            if (this.helpfulSearchDiv.offsetTop + menuHeight > windowHeight) {
                this.helpfulSearchDiv.style.top = (windowHeight - menuHeight) + "px";
            }

            this.showHelpfulSearchWidget();
            this.isHelpfulSearchWidgetOn = true;
        }

        // hides helpfulSearchDiv on canvas

        this._hideHelpfulSearchWidget = (e) => {
                if (docById("helpfulWheelDiv").style.display !== "none") {
                    docById("helpfulWheelDiv").style.display = "none";
                }
                if (docById("helpfulSearchDiv").style.display !== "none" && e.target.id !== "helpfulSearch") {
                    docById("helpfulSearchDiv").style.display = "none";
                }
                that.__tick();
        }

        /*
         * Sets up right click functionality opening the context menus
         * (if block is right clicked)
         */
        this.doContextMenus = () => {
            document.addEventListener(
                "contextmenu",
                (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!this.beginnerMode) {
                        if (event.target.id === "myCanvas") {
                            this._displayHelpfulWheel(event);
                        }
                    }
                },
                false
            );
        };

        /*
         * displays helpfulWheel on canvas on right click
         */
        this._displayHelpfulWheel = (event) => {
            docById("helpfulWheelDiv").style.position = "absolute";

            const x = event.clientX;
            const y = event.clientY;
        
            const canvasLeft = this.canvas.offsetLeft + 28 * this.getStageScale();
            const canvasTop = this.canvas.offsetTop + 6 * this.getStageScale();
        
            const helpfulWheelLeft = Math.max(Math.round(x * this.getStageScale() + canvasLeft) - 150, canvasLeft);
            const helpfulWheelTop = Math.max(Math.round(y * this.getStageScale() + canvasTop) - 150, canvasTop);

            docById("helpfulWheelDiv").style.left = helpfulWheelLeft + "px";
           
            docById("helpfulWheelDiv").style.top = helpfulWheelTop + "px";
            
            const windowWidth = window.innerWidth - 20;
            const windowHeight = window.innerHeight - 20;
            
            if (helpfulWheelLeft + 350 > windowWidth) {
                docById("helpfulWheelDiv").style.left = (windowWidth - 350) + "px";
            }
            if (helpfulWheelTop + 350 > windowHeight) {
                docById("helpfulWheelDiv").style.top = (windowHeight - 350) + "px";
            }

            docById("helpfulWheelDiv").style.display = "";

            const wheel = new wheelnav("helpfulWheelDiv", null, 300, 300);
            wheel.colors = platformColor.wheelcolors;
            wheel.slicePathFunction = slicePath().DonutSlice;
            wheel.slicePathCustom = slicePath().DonutSliceCustomization();
            wheel.slicePathCustom.minRadiusPercent = 0.45;
            wheel.slicePathCustom.maxRadiusPercent = 1.0;
            wheel.sliceSelectedPathCustom = wheel.slicePathCustom;
            wheel.sliceInitPathCustom = wheel.slicePathCustom;
            wheel.clickModeRotate = false;
            const wheelItems = this.helpfulWheelItems.filter(ele => ele.display);
            wheel.initWheel(wheelItems.map(ele => ele.icon));
            wheel.createWheel();

            wheel.navItems[0].selected = false;

            wheelItems.forEach((ele, i) => {
                wheel.navItems[i].setTooltip(_(ele.label));
                wheel.navItems[i].navigateFunction = () => ele.fn(this);
            })
        }

        /**
        * Sets up plugin and palette boilerplate.
        * This function initializes various properties related to the plugin objects,
        * palette colors, and other settings used throughout the application.
        */
        this.doPluginsAndPaletteCols = () => {
            // Calculate the palette colors.
            for (const p in platformColor.paletteColors) {
                PALETTEFILLCOLORS[p] = platformColor.paletteColors[p][0];
                PALETTESTROKECOLORS[p] = platformColor.paletteColors[p][1];
                PALETTEHIGHLIGHTCOLORS[p] = platformColor.paletteColors[p][2];
                HIGHLIGHTSTROKECOLORS[p] = platformColor.paletteColors[p][1];
            }

            this.pluginObjs = {
                PALETTEPLUGINS: {},
                PALETTEFILLCOLORS: {},
                PALETTESTROKECOLORS: {},
                PALETTEHIGHLIGHTCOLORS: {},
                FLOWPLUGINS: {},
                ARGPLUGINS: {},
                BLOCKPLUGINS: {},
                MACROPLUGINS: {},
                ONLOAD: {},
                ONSTART: {},
                ONSTOP: {}
            };

            // Stacks of blocks saved in local storage
            this.macroDict = {};

            // default values
            this.DEFAULTDELAY = 500; // milleseconds
            this.TURTLESTEP = -1; // Run in step-by-step mode
            this.blockscale = BLOCKSCALES.indexOf(DEFAULTBLOCKSCALE);
            if (this.blockscale === -1) {
                this.blockscale = 1;
            }

            // Used to track mouse state for mouse button block
            this.stageMouseDown = false;
            this.stageX = 0;
            this.stageY = 0;

            // OLPC hardware
            const onXO =
                (screen.width === 1200 && screen.height === 900) ||
                (screen.width === 900 && screen.height === 1200);

            this.cellSize = 55;
            if (onXO) {
                this.cellSize = 75;
            }

            this.onscreenButtons = [];
            this.onscreenMenu = [];

            this.firstRun = true;

            this.pluginsImages = {};
        };

        /**
        * Recenters blocks by updating their position on the screen.
        * 
        * This function triggers the `_findBlocks` method on the provided `activity` object,
        * which recalculates the positions of blocks. If the 'helpfulWheelDiv' element is visible,
        * it is hidden, and the `__tick` method is called to update the activity state.
        * 
        * @param {Object} activity - The activity instance containing the blocks to recenter.
        * @constructor
        */
        const findBlocks = (activity) => {
            activity._findBlocks();
            if (docById("helpfulWheelDiv").style.display !== "none") {
                docById("helpfulWheelDiv").style.display = "none";
                activity.__tick();
            }
        };

        /**
        * Finds and organizes blocks within the workspace.
        * Blocks are positioned based on their connections and availability within the canvas area.
        * This method is part of the internal mechanism to ensure that blocks are displayed correctly and efficiently.
        * @constructor
        */
        this._findBlocks = () => {
            // Ensure visibility of blocks
            if (!this.blocks.visible) {
                this._changeBlockVisibility();
            }

            // Reset active block and hide DOM label
            this.blocks.activeBlock = null;
            hideDOMLabel();

            // Show blocks and set initial container position
            this.blocks.showBlocks();
            this.blocksContainer.x = 0;
            this.blocksContainer.y = 0;

            // Calculate top and left positions for block placement
            let toppos;
            if (this.auxToolbar.style.display === "block") {
                toppos = 90 + this.toolbarHeight;
            } else {
                toppos = 90;
            }
            const leftpos = Math.floor(this.canvas.width / 4);

            // Update palettes and calculate initial block position
            this.palettes.updatePalettes();
            let x = Math.floor(leftpos * this.turtleBlocksScale);
            let y = Math.floor(toppos * this.turtleBlocksScale);
            let even = true;

            // Position start blocks first
            for (const blk in this.blocks.blockList) {
                if (!this.blocks.blockList[blk].trash) {
                    const myBlock = this.blocks.blockList[blk];
                    if (myBlock.name !== "start") {
                        continue;
                    }

                    // Move block and its connected group
                    if (myBlock.connections[0] === null) {
                        const dx = x - myBlock.container.x;
                        const dy = y - myBlock.container.y;
                        this.blocks.moveBlockRelative(blk, dx, dy);
                        this.blocks.findDragGroup(blk);
                        if (this.blocks.dragGroup.length > 0) {
                            for (let b = 0; b < this.blocks.dragGroup.length; b++) {
                                const bblk = this.blocks.dragGroup[b];
                                if (b !== 0) {
                                    this.blocks.moveBlockRelative(bblk, dx, dy);
                                }
                            }
                        }

                        // Update x and y positions for next block placement
                        x += Math.floor(150 * this.turtleBlocksScale);
                        if (x > (this.canvas.width * 7) / 8 / this.turtleBlocksScale) {
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

            // Position other blocks
            for (const blk in this.blocks.blockList) {
                if (!this.blocks.blockList[blk].trash) {
                    const myBlock = this.blocks.blockList[blk];
                    if (myBlock.name === "start") {
                        continue;
                    }

                    // Move block and its connected group
                    if (myBlock.connections[0] === null) {
                        const dx = x - myBlock.container.x;
                        const dy = y - myBlock.container.y;
                        this.blocks.moveBlockRelative(blk, dx, dy);
                        this.blocks.findDragGroup(blk);
                        if (this.blocks.dragGroup.length > 0) {
                            for (let b = 0; b < this.blocks.dragGroup.length; b++) {
                                const bblk = this.blocks.dragGroup[b];
                                if (b !== 0) {
                                    this.blocks.moveBlockRelative(bblk, dx, dy);
                                }
                            }
                        }

                        // Update x and y positions for next block placement
                        x += 150 * this.turtleBlocksScale;
                        if (x > (this.canvas.width * 7) / 8 / this.turtleBlocksScale) {
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
            this.setHomeContainers(false);
            this.boundary.hide();

            // Return mice to the center of the screen.
            // Reset turtles' positions to center of the screen
            for (let turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
                const savedPenState = this.turtles.turtleList[turtle].painter.penState;
                this.turtles.turtleList[turtle].painter.penState = false;
                this.turtles.turtleList[turtle].painter.doSetXY(0, 0);
                this.turtles.turtleList[turtle].painter.doSetHeading(0);
                this.turtles.turtleList[turtle].painter.penState = savedPenState;
            }
        };

        /**
        * Toggles the visibility of the home button container.
        * 
        * Depending on the state provided, this method will either hide or show the home button container.
        * If the home button container is not initialized, the function will exit early.
        * 
        * @param {boolean} homeState - If true, shows the container; if false, hides it.
        * @constructor
        */
        this.setHomeContainers = (homeState) => {
            if (this.homeButtonContainer === null) {
                return;
            }

            if (homeState) {
                changeImage(this.homeButtonContainer.children[0], GOHOMEFADEDBUTTON, GOHOMEBUTTON);
            } else {
                changeImage(this.homeButtonContainer.children[0], GOHOMEBUTTON, GOHOMEFADEDBUTTON);
            }
        };

        /**
        * Saves the artwork for an individual help block.
        * The process involves clearing the block list, generating the help blocks,
        * and saving them as SVG files.
        *
        * @param {string} name - The name of the help block.
        * @param {number} delay - The delay before executing the save process (in milliseconds).
        */
        this.__saveHelpBlock = (name, delay) => {
            // Save the artwork for an individual help block.
            // (1) clear the block list
            // (2) generate the help blocks
            // (3) save the blocks as svg

            const that = this;
            setTimeout(() => {
                that.sendAllToTrash(false, true);
                setTimeout(() => {
                    const message = that.blocks.protoBlockDict[name].helpString;
                    if (message.length < 4) {
                        // If there is nothing specified, just load the block.
                        const obj = that.palettes.getProtoNameAndPalette(name);
                        const protoblk = obj[0];
                        const paletteName = obj[1];
                        const protoName = obj[2];
                        // eslint-disable-next-line no-prototype-builtins
                        if (that.blocks.protoBlockDict.hasOwnProperty(protoName)) {
                            that.palettes.dict[paletteName].makeBlockFromSearch(
                                protoblk,
                                protoName,
                                (newBlock) => {
                                    that.blocks.moveBlock(newBlock, 0, 0);
                                }
                            );
                        }
                    } else if (typeof message[3] === "string") {
                        // If it is a string, load the macro associated with this block.
                        const blocksToLoad = getMacroExpansion(that, message[3], 0, 0);
                        that.blocks.loadNewBlocks(blocksToLoad);
                    } else {
                        // Load the block.
                        const blocksToLoad = message[3];
                        that.blocks.loadNewBlocks(blocksToLoad);
                    }

                    setTimeout(() => {
                        // eslint-disable-next-line no-console
                        console.log("Saving help artwork: " + name + "_block.svg");
                        const svg = "data:image/svg+xml;utf8," + that.printBlockSVG();
                        that.save.download("svg", svg, name + "_block.svg");
                    }, 500);
                }, 500);
            }, delay + 1000);
        };

        this._saveHelpBlocks = () => {
            // Save the artwork for every help block.
            const blockHelpList = [];
            for (const key in this.blocks.protoBlockDict) {
                if (
                    this.blocks.protoBlockDict[key].helpString !== undefined &&
                    this.blocks.protoBlockDict[key].helpString.length !== 0
                ) {
                    blockHelpList.push(key);
                }
            }

            let i = 0;
            for (const name in blockHelpList) {
                this.__saveHelpBlock(blockHelpList[name], i * 2000);
                i += 1;
            }

            this.sendAllToTrash(true, true);
        };

        /**
         * @returns {SVG} returns SVG of blocks
         */
        this.printBlockSVG = () => {
            this.blocks.activeBlock = null;
            let startCounter = 0;
            let svg = "";
            let xMax = 0;
            let yMax = 0;
            let parts;
            for (let i = 0; i < this.blocks.blockList.length; i++) {
                if (this.blocks.blockList[i].ignore()) {
                    continue;
                }

                if (this.blocks.blockList[i].container.x + this.blocks.blockList[i].width > xMax) {
                    xMax = this.blocks.blockList[i].container.x + this.blocks.blockList[i].width;
                }

                if (this.blocks.blockList[i].container.y + this.blocks.blockList[i].height > yMax) {
                    yMax = this.blocks.blockList[i].container.y + this.blocks.blockList[i].height;
                }

                if (this.blocks.blockList[i].collapsed) {
                    parts = this.blocks.blockCollapseArt[i].split("><");
                } else {
                    parts = this.blocks.blockArt[i].split("><");
                }

                if (this.blocks.blockList[i].isCollapsible()) {
                    svg += "<g>";
                }

                svg +=
                    '<g transform="translate(' +
                    this.blocks.blockList[i].container.x +
                    ", " +
                    this.blocks.blockList[i].container.y +
                    ')">';
                if (SPECIALINPUTS.includes(this.blocks.blockList[i].name)) {
                    for (let p = 1; p < parts.length; p++) {
                        // FIXME: This is fragile.
                        if (p === 1) {
                            svg += "<" + parts[p] + "><";
                        } else if (p === 2) {
                            // skip filter
                        } else if (p === 3) {
                            svg += parts[p].replace("filter:url(#dropshadow);", "") + "><";
                        } else if (p === 5) {
                            // Add block value to SVG between tspans
                            if (typeof this.blocks.blockList[i].value === "string") {
                                svg += parts[p] + ">" + _(this.blocks.blockList[i].value) + "<";
                            } else {
                                svg += parts[p] + ">" + this.blocks.blockList[i].value + "<";
                            }
                        } else if (p === parts.length - 2) {
                            svg += parts[p] + ">";
                        } else if (p === parts.length - 1) {
                            // skip final </svg>
                        } else {
                            svg += parts[p] + "><";
                        }
                    }
                } else {
                    for (let p = 1; p < parts.length; p++) {
                        // FIXME: This is fragile.
                        if (p === 1) {
                            svg += "<" + parts[p] + "><";
                        } else if (p === 2) {
                            // skip filter
                        } else if (p === 3) {
                            svg += parts[p].replace("filter:url(#dropshadow);", "") + "><";
                        } else if (p === parts.length - 2) {
                            svg += parts[p] + ">";
                        } else if (p === parts.length - 1) {
                            // skip final </svg>
                        } else {
                            svg += parts[p] + "><";
                        }
                    }
                }

                svg += "</g>";

                if (this.blocks.blockList[i].isCollapsible()) {
                    let y;
                    if (INLINECOLLAPSIBLES.includes(this.blocks.blockList[i].name)) {
                        y = this.blocks.blockList[i].container.y + 4;
                    } else {
                        y = this.blocks.blockList[i].container.y + 12;
                    }

                    svg +=
                        '<g transform="translate(' +
                        this.blocks.blockList[i].container.x +
                        ", " +
                        y +
                        ') scale(0.5 0.5)">';
                    if (this.blocks.blockList[i].collapsed) {
                        parts = EXPANDBUTTON.split("><");
                    } else {
                        parts = COLLAPSEBUTTON.split("><");
                    }

                    for (let p = 2; p < parts.length - 1; p++) {
                        svg += "<" + parts[p] + ">";
                    }

                    svg += "</g>";
                }

                if (this.blocks.blockList[i].name === "start") {
                    const x = this.blocks.blockList[i].container.x + 110;
                    const y = this.blocks.blockList[i].container.y + 12;
                    svg += '<g transform="translate(' + x + ", " + y + ') scale(0.4 0.4)">';

                    parts = TURTLESVG.replace(/fill_color/g, FILLCOLORS[startCounter])
                        .replace(/stroke_color/g, STROKECOLORS[startCounter])
                        .split("><");

                    startCounter += 1;
                    if (startCounter > 9) {
                        startCounter = 0;
                    }

                    for (let p = 2; p < parts.length - 1; p++) {
                        svg += "<" + parts[p] + ">";
                    }

                    svg += "</g>";
                }

                if (this.blocks.blockList[i].isCollapsible()) {
                    svg += "</g>";
                }
            }

            svg += "</svg>";

            return (
                '<svg xmlns="http://www.w3.org/2000/svg" width="' +
                xMax +
                '" height="' +
                yMax +
                '">' +
                encodeURIComponent(svg)
            );
        };

        /*
         * Clears "canvas"
         */
        this._allClear = (noErase) => {
            this.blocks.activeBlock = null;
            hideDOMLabel();

            this.logo.boxes = {};
            this.logo.time = 0;
            this.hideMsgs();
            this.hideGrids();
            this.turtles.setBackgroundColor(-1);
            this.logo.svgOutput = "";
            this.logo.notationOutput = "";
            for (let turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
                this.logo.turtleHeaps[turtle] = [];
                this.logo.turtleDicts[turtle] = {};
                this.logo.notation.notationStaging[turtle] = [];
                this.logo.notation.notationDrumStaging[turtle] = [];
                if (noErase === undefined || !noErase) {
                    this.turtles.turtleList[turtle].painter.doClear(true, true, true);
                }
            }

            this.blocksContainer.x = 0;
            this.blocksContainer.y = 0;

            // Code specific to cleaning up Music Blocks
            Element.prototype.remove = () => {
                this.parentElement.removeChild(this);
            };

            NodeList.prototype.remove = HTMLCollection.prototype.remove = () => {
                for (let i = 0, len = this.length; i < len; i++) {
                    if (this[i] && this[i].parentElement) {
                        this[i].parentElement.removeChild(this[i]);
                    }
                }
            };

            const table = docById("myTable");
            if (table !== null) {
                table.remove();
            }

            if (docById("helpfulWheelDiv").style.display !== "none") {
                docById("helpfulWheelDiv").style.display = "none";
                this.__tick();
            }
        };

        /**
         * Sets up play button functionality; runs Music Blocks.
         * @param env {specifies environment}
         */
        const doFastButton = (activity, env) => {
            activity._doFastButton(env);
        };

        this._doFastButton = (env) => {
            this.blocks.activeBlock = null;
            hideDOMLabel();

            const currentDelay = this.logo.turtleDelay;
            this.logo.turtleDelay = 0;
            this.logo.synth.resume();
            const widgetTitle = document.getElementsByClassName("wftTitle");
            for (let i = 0; i < widgetTitle.length; i++) {
                if (widgetTitle[i].innerHTML === "tempo") {
                    if (this.logo.tempo.isMoving) {
                        this.logo.tempo.pause();
                    }

                    this.logo.tempo.resume();
                    break;
                }
            }

            if (!this.turtles.running()) {
                if (!this.turtles.isShrunk()) {
                    this.blocks.hideBlocks();
                    this.showBlocksAfterRun = true;
                }

                this.logo.runLogoCommands(null, env);
            } else {
                if (currentDelay !== 0) {
                    // Keep playing at full speed.
                    this.logo.step();
                } else {
                    // Stop and restart.
                    document.getElementById("stop").style.color = "white";
                    this.logo.doStopTurtles();

                    const that = this;
                    setTimeout(() => {
                        document.getElementById("stop").style.color = "#ea174c";
                        that.logo.runLogoCommands(null, env);
                    }, 500);
                }
            }
        };

        let isExecuting = false; // Flag variable to track execution status

        /**
         * Sets up a record button functionality for the given activity.
         * @param {object} activity - The activity context.
         */
        const doRecordButton = (activity) => {
            /**
             * Executes the record button functionality if execution is not already in progress.
             */
            if (isExecuting) {
                return; // Exit the function if execution is already in progress
            }

            isExecuting = true; // Set the flag to indicate execution has started
            activity._doRecordButton();
        };

        /**
         * Functionality for the record button.
         * @private
         */
        this._doRecordButton = () => {
            const start = document.getElementById("record"),
                recInside = document.getElementById("rec_inside");
            let mediaRecorder;
            var clickEvent = new Event("click");
            let flag = 0;

            /**
             * Records the screen using the browser's media devices API.
             * @returns {Promise<MediaStream>} A promise resolving to the recorded media stream.
             */
            async function recordScreen() {
                flag = 1;
                return await navigator.mediaDevices.getDisplayMedia(
                    {
                        preferCurrentTab: "True",
                        systemAudio: "include",
                        audio: "True",
                        video: {mediaSource: "tab"},
                        bandwidthProfile: {
                            video: {
                                clientTrackSwitchOffControl: "auto",
                                contentPreferencesMode: "auto"
                            }
                        },
                        preferredVideoCodecs: "auto"
                    }
                );
            }

            const that = this;

            /**
             * Saves the recorded chunks as a video file.
             * @param {Blob[]} recordedChunks - The recorded video chunks.
             */
            function saveFile(recordedChunks) {
                flag = 1;
                recInside.classList.remove("blink");
                const blob = new Blob(
                    recordedChunks,
                    {
                        type: "video/webm"
                    }
                );

                const filename = window.prompt("Enter file name"),
                    downloadLink = document.createElement("a");
                downloadLink.href = URL.createObjectURL(blob);
                downloadLink.download = `${filename}.webm`;

                document.body.appendChild(downloadLink);
                downloadLink.click();
                URL.revokeObjectURL(blob);
                document.body.removeChild(downloadLink);
                flag = 0;
                // eslint-disable-next-line no-use-before-define
                recording();
                doRecordButton();
                that.textMsg("click on stop sharing");
            }
            /**
             * Stops the recording process.
             */
            function stopRec() {
                flag = 0;
                mediaRecorder.stop();
                const node = document.createElement("p");
                node.textContent = "Stopped recording";
                document.body.appendChild(node);
            }

            /**
             * Creates a media recorder instance.
             * @param {MediaStream} stream - The media stream to be recorded.
             * @param {string} mimeType - The MIME type of the recording.
             * @returns {MediaRecorder} The created media recorder instance.
             */
            function createRecorder (stream, mimeType) {
                flag = 1;
                recInside.classList.add("blink");
                start.removeEventListener(
                    "click",
                    createRecorder,
                    true
                );
                let recordedChunks = [];
                const mediaRecorder = new MediaRecorder(stream);
                stream.oninactive = function () {
                    // eslint-disable-next-line no-console
                    console.log("Recording is ready to save");
                    stopRec();
                    flag = 0;
                };

                mediaRecorder.onstop = function() {
                    saveFile(recordedChunks);
                    recordedChunks = [];
                    flag=0;
                    recInside.setAttribute("fill", "#ffffff");
                };

                mediaRecorder.ondataavailable = function (e) {
                    if (e.data.size > 0) {
                        recordedChunks.push(e.data);
                    }
                };

                mediaRecorder.start(200);
                setTimeout(() => {
                    // eslint-disable-next-line no-console
                    console.log("Resizing for Record", that.canvas.height);
                    that._onResize();
                }, 500);
                return mediaRecorder;
            }

            /**
             * Handles the recording process.
             */
            function recording() {
                start.addEventListener(
                    "click",
                    async function handler() {
                        const stream = await recordScreen();
                        const mimeType = "video/webm";
                        mediaRecorder = createRecorder(stream, mimeType);
                        if (flag == 1) {
                            this.removeEventListener("click",handler);
                        }
                        const node = document.createElement("p");
                        node.textContent = "Started recording";
                        document.body.appendChild(node);
                        recInside.setAttribute("fill", "red");
                    }
                );
            }

            // Start recording process if not already executing
            if (flag == 0 && isExecuting) {
                recording();
                start.dispatchEvent(clickEvent);
                flag = 1;
            };

            // Stop recording if already executing
            if (flag == 1 && isExecuting){
                start.addEventListener("click", stopRec);
                flag = 0;
            }

        };

        /*
         * Runs Music Blocks at a slower rate
         */
        const doSlowButton = (activity) => {
            activity._doSlowButton();
        };

        /**
         * Executes slow button functionality.
         * Resets active block, hides DOM labels, adjusts turtle delay, resumes synth, and runs or steps logo commands.
         * @private
         */
        this._doSlowButton = () => {
            this.blocks.activeBlock = null;
            hideDOMLabel();

            this.logo.turtleDelay = DEFAULTDELAY;
            this.logo.synth.resume();

            if (!this.turtles.running()) {
                this.logo.runLogoCommands();
            } else {
                this.logo.step();
            }
        };

        /*
         * Runs music blocks step by step
         */
        const doStepButton = (activity) => {
            activity._doStepButton();
        };

        /**
         * Executes step button functionality.
         * Resets active block, hides DOM labels, adjusts turtle delay, resumes synth, and runs or steps logo commands.
         * @private
         */
        this._doStepButton = () => {
            this.blocks.activeBlock = null;
            hideDOMLabel();

            const turtleCount = Object.keys(this.logo.stepQueue).length;
            this.logo.synth.resume();

            if (turtleCount === 0 || this.logo.turtleDelay !== this.TURTLESTEP) {
                // Either we haven't set up a queue or we are
                // switching modes.
                this.logo.turtleDelay = this.TURTLESTEP;
                // Queue and take first step.
                if (!this.turtles.running()) {
                    this.logo.runLogoCommands();
                }
                this.logo.step();
            } else {
                this.logo.turtleDelay = this.TURTLESTEP;
                this.logo.step();
            }
        };

        /**
         * Stops running of music blocks; stops all mid-way synths.
         * @param onblur {when object loses focus}
         */
        const doHardStopButton = (activity, onblur) => {
            activity._doHardStopButton(onblur);
        };

        /**
         * Stops running of music blocks and stops all mid-way synths.
         * @param {boolean} onblur - Indicates if the function is triggered by loss of focus.
         * @private
         */
        this._doHardStopButton = (onblur) => {
            this.blocks.activeBlock = null;
            hideDOMLabel();

            if (onblur === undefined) {
                onblur = false;
            }

            if (onblur && _THIS_IS_MUSIC_BLOCKS_) {
                return;
            }

            this.logo.doStopTurtles();

            const widgetTitle = document.getElementsByClassName("wftTitle");
            for (let i = 0; i < widgetTitle.length; i++) {
                if (widgetTitle[i].innerHTML === "tempo") {
                    if (this.logo.tempo.isMoving) {
                        this.logo.tempo.pause();
                    }
                    break;
                }
            }
        };

        /*
         * Switches between beginner/advanced mode
         */
        const doSwitchMode = (activity) => {
            // Update toolbar
            activity.toolbar.renderSaveIcons(
                activity.save.saveHTML.bind(activity.save),
                doSVG,
                activity.save.saveSVG.bind(activity.save),
                activity.save.savePNG.bind(activity.save),
                activity.save.saveWAV.bind(activity.save),
                activity.save.saveLilypond.bind(activity.save),
                activity.save.saveAbc.bind(activity.save),
                activity.save.saveMxml.bind(activity.save),
                activity.save.saveBlockArtwork.bind(activity.save)
            );
        
            // Regenerate palettes
            if (activity.regeneratePalettes) {
                activity.regeneratePalettes();
            }
        
            // Force immediate canvas refresh
            activity.refreshCanvas();
        };

        /*
         * Initialises the functionality of the horizScrollIcon
         */
        const setScroller = (activity) => {
            activity._setScroller();
            activity._setupBlocksContainerEvents();
            if (docById("helpfulWheelDiv").style.display !== "none") {
                docById("helpfulWheelDiv").style.display = "none";
            }
        };

        /**
         * Initializes the functionality of the horizontal scroll icon.
         * Toggles horizontal scrolling and updates corresponding UI elements.
         * @private
         */
        this._setScroller = () => {
            this.blocks.activeBlock = null;
            this.scrollBlockContainer = !this.scrollBlockContainer;
            const enableHorizScrollIcon = docById("enableHorizScrollIcon");
            const disableHorizScrollIcon = docById("disableHorizScrollIcon");
            if (this.scrollBlockContainer && !this.beginnerMode) {
                enableHorizScrollIcon.style.display = "none";
                disableHorizScrollIcon.style.display = "block";

                this.helpfulWheelItems.forEach(ele => {
                    if (ele.label === "Enable horizontal scrolling")
                        ele.display = false;
                    else if (ele.label === "Disable horizontal scrolling")
                        ele.display = true;
                })
            } else {
                enableHorizScrollIcon.style.display = "block";
                disableHorizScrollIcon.style.display = "none";

                this.helpfulWheelItems.forEach(ele => {
                    if (ele.label === "Enable horizontal scrolling")
                        ele.display = true;
                    else if (ele.label === "Disable horizontal scrolling")
                        ele.display = false;
                })
            }
        };

        /**
         * Displays loading animation with random messages.
         * @private
         */
        this.doLoadAnimation = () => {
            const messages = {
                load_messages: [
                    _("Catching mice"),
                    _("Cleaning the instruments"),
                    _("Testing key pieces"),
                    _("Sight-reading"),
                    _("Combining math and music"),
                    _("Generating more blocks"),
                    _("Do Re Mi Fa Sol La Ti Do"),
                    _("Tuning string instruments"),
                    _("Pressing random keys")
                ]
            };

            document.getElementById("load-container").style.display = "block";

            let counter = 0;

            const changeText = () => {
                const randomLoadMessage =
                      messages.load_messages[
                          Math.floor(Math.random() * messages.load_messages.length)
                      ];
                document.getElementById("messageText").innerHTML = randomLoadMessage + "...";
                counter++;
                if (counter >= messages.load_messages.length) {
                    counter = 0;
                }
            };

            setInterval(changeText, 2000);
        };

        /**
         * Increases the size of blocks in the activity.
         * @param {object} activity - The activity object.
         */
        const doLargerBlocks = async(activity) => {
            await activity._doLargerBlocks();
            if (docById("helpfulWheelDiv").style.display !== "none") {
                docById("helpfulWheelDiv").style.display = "none";
                activity.__tick();
            }
        };

        this._doLargerBlocks = async() => {
            this.blocks.activeBlock = null;

            if (!this.resizeDebounce) {
                if (this.blockscale < BLOCKSCALES.length - 1) {
                    this.resizeDebounce = true;
                    this.blockscale += 1;
                    await this.blocks.setBlockScale(BLOCKSCALES[this.blockscale]);
                }

                const that = this;
                that.resizeDebounce = false;
                await this.setSmallerLargerStatus();

            }
            if (typeof(this.activity)!="undefined"){
                 await this.activity.refreshCanvas();
               }
            document.getElementById("hideContents").click();
        };

        /**
         * Decreases the size of blocks in the activity.
         * @param {object} activity - The activity object.
         */
        const doSmallerBlocks = async(activity) => {
            await activity._doSmallerBlocks();
            if (docById("helpfulWheelDiv").style.display !== "none") {
                docById("helpfulWheelDiv").style.display = "none";
                activity.__tick();
            }
        };

        
        /**
         * Manages the resizing of blocks to handle larger size.
         */
        this._doSmallerBlocks = async() => {
            this.blocks.activeBlock = null;

            if (!this.resizeDebounce) {
                if (this.blockscale > 0) {
                    this.resizeDebounce = true;
                    this.blockscale -= 1;
                    await this.blocks.setBlockScale(BLOCKSCALES[this.blockscale]);
                }

                const that = this;
                that.resizeDebounce = false;

            }

            await this.setSmallerLargerStatus();
            if (typeof(this.activity)!="undefined"){
                await this.activity.refreshCanvas();
            }
            document.getElementById("hideContents").click();
        };

        /*
         * If either the block size has reached its minimum or maximum,
         * then the icons to make them smaller/bigger will be hidden.
         * Sets the status of the smaller and larger block icons based on the current block size.
         */
        this.setSmallerLargerStatus = async() => {
            if (BLOCKSCALES[this.blockscale] < DEFAULTBLOCKSCALE) {
                await changeImage(this.smallerContainer.children[0], SMALLERBUTTON, SMALLERDISABLEBUTTON);
            } else {
                await changeImage(this.smallerContainer.children[0], SMALLERDISABLEBUTTON, SMALLERBUTTON);
            }

            if (BLOCKSCALES[this.blockscale] === 4) {
                await changeImage(this.largerContainer.children[0], BIGGERBUTTON, BIGGERDISABLEBUTTON);
            } else {
                await changeImage(this.largerContainer.children[0], BIGGERDISABLEBUTTON, BIGGERBUTTON);
            }
        };


        /**
         * Deletes a plugin palette from local storage based on the active palette.
         * @param {object} activity - The activity object.
         */
        const deletePlugin = (activity) => {
            activity._deletePlugin();
        };

        /**
         * Deletes a plugin palette from local storage.
         */
        this._deletePlugin = () => {
            if (this.palettes.activePalette !== null) {
                const obj = JSON.parse(this.storage.plugins);

                if (this.palettes.activePalette in obj["PALETTEPLUGINS"]) {
                    delete obj["PALETTEPLUGINS"][this.palettes.activePalette];
                }
                if (this.palettes.activePalette in obj["PALETTEFILLCOLORS"]) {
                    delete obj["PALETTEFILLCOLORS"][this.palettes.activePalette];
                }
                if (this.palettes.activePalette in obj["PALETTESTROKECOLORS"]) {
                    delete obj["PALETTESTROKECOLORS"][this.palettes.activePalette];
                }
                if (this.palettes.activePalette in obj["PALETTEHIGHLIGHTCOLORS"]) {
                    delete obj["PALETTEHIGHLIGHTCOLORS"][this.palettes.activePalette];
                }
                for (
                    let i = 0;
                    i < this.palettes.dict[this.palettes.activePalette].protoList.length;
                    i++
                ) {
                    const name = this.palettes.dict[this.palettes.activePalette].protoList[i]["name"];
                    if (name in obj["FLOWPLUGINS"]) {
                        // eslint-disable-next-line no-console
                        console.log("deleting " + name);
                        delete obj["FLOWPLUGINS"][name];
                    }
                    if (name in obj["BLOCKPLUGINS"]) {
                        // eslint-disable-next-line no-console
                        console.log("deleting " + name);
                        delete obj["BLOCKPLUGINS"][name];
                    }
                    if (name in obj["ARGPLUGINS"]) {
                        // eslint-disable-next-line no-console
                        console.log("deleting " + name);
                        delete obj["ARGPLUGINS"][name];
                    }
                }
                if (this.palettes.activePalette in obj["MACROPLUGINS"]) {
                    delete obj["MACROPLUGINS"][this.palettes.activePalette];
                }
                if (this.palettes.activePalette in obj["ONLOAD"]) {
                    delete obj["ONLOAD"][this.palettes.activePalette];
                }
                if (this.palettes.activePalette in obj["ONSTART"]) {
                    delete obj["ONSTART"][this.palettes.activePalette];
                }
                if (this.palettes.activePalette in obj["ONSTOP"]) {
                    delete obj["ONSTOP"][this.palettes.activePalette];
                }

                this.storage.plugins = JSON.stringify(obj);
                this.textMsg(
                    this.palettes.activePalette + " " + _("plugins will be removed upon restart.")
                );
            }
        };

        /*
         * Hides all grids (Cartesian/polar/treble/et al.)
         */
        this.hideGrids = () => {
            this.turtles.setGridLabel(_("show Cartesian"));
            this._hideCartesian();
            this._hidePolar();
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this._hideTreble();
                this._hideGrand();
                this._hideSoprano();
                this._hideAlto();
                this._hideTenor();
                this._hideBass();
            }
        };

        /*
         * Renders Cartesian/Polar/Treble/et al. grids
         */
        this._doCartesianPolar = () => {
            switch (this.turtles.currentGrid) {
                case 1:
                    this._hideCartesian();
                    break;
                case 2:
                    this._hideCartesian();
                    this._hidePolar();
                    break;
                case 3:
                    this._hidePolar();
                    break;
                case 4:
                    this._hideTreble();
                    break;
                case 5:
                    this._hideGrand();
                    break;
                case 6:
                    this._hideSoprano();
                    break;
                case 7:
                    this._hideAlto();
                    break;
                case 8:
                    this._hideTenor();
                    break;
                case 9:
                    this._hideBass();
                    break;
            }

            switch (this.turtles.gridWheel.selectedNavItemIndex) {
                case 1:
                    this._showCartesian();
                    break;
                case 2:
                    this._showCartesian();
                    this._showPolar();
                    break;
                case 3:
                    this._showPolar();
                    break;
                case 4:
                    this._showTreble();
                    break;
                case 5:
                    this._showGrand();
                    break;
                case 6:
                    this._showSoprano();
                    break;
                case 7:
                    this._showAlto();
                    break;
                case 8:
                    this._showTenor();
                    break;
                case 9:
                    this._showBass();
                    break;
            }
            this.turtles.currentGrid = this.turtles.gridWheel.selectedNavItemIndex;
            this.update = true;
        };

        /*
         * Sets up block actions with regards to different mouse events
         */
        this._setupBlocksContainerEvents = () => {
            const moving = false;
            const that = this;
            let lastCoords = { x: 0, y: 0, delta: 0 };

            /**
             * Closes any open menus and labels.
             */
            const closeAnyOpenMenusAndLabels = () => {
                ['wheelDiv', 'contextWheelDiv', 'helpfulWheelDiv', 'textLabel', 'numberLabel'].forEach(id => {
                    const elem = docById(id);
                    if (elem) elem.style.display = 'none';
                });
            };

            /**
             * Normalizes wheel event data across different browsers.
             * @param {WheelEvent} event - The wheel event object.
             * @returns {Object} - Normalized pixelX and pixelY values.
             */
            const normalizeWheel = (event) => {
                const PIXEL_STEP = 10;
                const LINE_HEIGHT = 40;
                const PAGE_HEIGHT = 800;

                let sX = 0,
                    sY = 0, // spinX, spinY
                    pX = 0,
                    pY = 0; // pixelX, pixelY

                // Determine scroll values based on different event properties
                if ("detail" in event) sY = event.detail;
                if ("wheelDelta" in event) sY = -event.wheelDelta / 120;
                if ("wheelDeltaY" in event) sY = -event.wheelDeltaY / 120;
                if ("wheelDeltaX" in event) sX = -event.wheelDeltaX / 120;

                // side scrolling on FF with DOMMouseScroll
                // Handle horizontal scrolling on Firefox
                if ("axis" in event && event.axis === event.HORIZONTAL_AXIS) {
                    sX = sY;
                    sY = 0;
                }

                pX = sX * PIXEL_STEP;
                pY = sY * PIXEL_STEP;

                // Determine delta values based on deltaMode
                if ("deltaY" in event) pY = event.deltaY;
                if ("deltaX" in event) pX = event.deltaX;

                // Adjust pixel values based on deltaMode
                if ((pX || pY) && event.deltaMode) {
                    if (event.deltaMode === 1) {
                        // ff uses deltamode = 1
                        pX *= LINE_HEIGHT;
                        pY *= LINE_HEIGHT;
                    } else {
                        // delta in PAGE units
                        pX *= PAGE_HEIGHT;
                        pY *= PAGE_HEIGHT;
                    }
                }

                // Fall-back if spin cannot be determined
                if (pX && !sX) sX = pX < 1 ? -1 : 1;
                if (pY && !sY) sY = pY < 1 ? -1 : 1;

                return { pixelX: pX, pixelY: pY };
            };

            // Assuming you have defined 'that' and 'closeAnyOpenMenusAndLabels' elsewhere in your code

            const myCanvas = document.getElementById("myCanvas");
            const initialTouches = [[null, null], [null, null]]; // Array to track two fingers (Y and X coordinates)

            /**
             * Handles touch start event on the canvas.
             * @param {TouchEvent} event - The touch event object.
             */
            myCanvas.addEventListener("touchstart", (event) => {
                if (event.touches.length === 2) {
                    for (let i = 0; i < 2; i++) {
                        initialTouches[i][0] = event.touches[i].clientY;
                        initialTouches[i][1] = event.touches[i].clientX;
                    }
                }
            });

            /**
             * Handles touch move event on the canvas.
             * @param {TouchEvent} event - The touch event object.
             */
            myCanvas.addEventListener("touchmove", (event) => {
                if (event.touches.length === 2) {
                    for (let i = 0; i < 2; i++) {
                        const touchY = event.touches[i].clientY;
                        const touchX = event.touches[i].clientX;

                        if (initialTouches[i][0] !== null && initialTouches[i][1] !== null) {
                            const deltaY = touchY - initialTouches[i][0];
                            const deltaX = touchX - initialTouches[i][1];

                            if (deltaY !== 0) {
                                closeAnyOpenMenusAndLabels();
                                that.blocksContainer.y -= deltaY;
                            }

                            if (deltaX !== 0) {
                                closeAnyOpenMenusAndLabels();
                                that.blocksContainer.x -= deltaX;
                            }

                            initialTouches[i][0] = touchY;
                            initialTouches[i][1] = touchX;
                        }
                    }

                    that.refreshCanvas();
                }
            });

            /**
             * Handles touch end event on the canvas.
             */
            myCanvas.addEventListener("touchend", () => {
                for (let i = 0; i < 2; i++) {
                    initialTouches[i][0] = null;
                    initialTouches[i][1] = null;
                }
            });

            /**
             * Handles wheel event on the canvas.
             * @param {WheelEvent} event - The wheel event object.
             */
            const __wheelHandler = (event) => {
                const data = normalizeWheel(event);
                const delY = data.pixelY;
                const delX = data.pixelX;
    
                if (event.ctrlKey) {
                    event.preventDefault();
                    delY < 0 ? doLargerBlocks(that) : doSmallerBlocks(that);
                } else if (delY !== 0 && event.axis === event.VERTICAL_AXIS) {
                    closeAnyOpenMenusAndLabels();
                    that.blocksContainer.y -= delY;
                } else if (that.scrollBlockContainer && delX !== 0 && event.axis === event.HORIZONTAL_AXIS) {
                    closeAnyOpenMenusAndLabels();
                    that.blocksContainer.x -= delX;
                } else {
                    event.preventDefault();
                }
    
                that.refreshCanvas();
            };

            docById("myCanvas").addEventListener("wheel", __wheelHandler, false);

            /**
             * Handles stage mouse up event.
             * @param {MouseEvent} event - The mouse event object.
             */
            const __stageMouseUpHandler = (event) => {
                that.stageMouseDown = false;
                that.moving = false;

                if (that.stage.getObjectUnderPoint() === null && lastCoords.delta < 4) {
                    that.stageX = event.stageX;
                    that.stageY = event.stageY;
                }
            };

            /**
             * Handles mouse movement on the stage.
             * @param {object} event - The mouse event object.
             */
            this.stage.on("stagemousemove", (event) => {
                that.stageX = event.stageX;
                that.stageY = event.stageY;
            });

            /**
             * Handles mouse down event on the stage.
             * @param {object} event - The mouse event object.
             */
            this.stage.on("stagemousedown", (event) => {
                that.stageMouseDown = true;
                if ((that.stage.getObjectUnderPoint() !== null) | that.turtles.running()) {
                    that.stage.removeAllEventListeners("stagemouseup");
                    that.stage.on("stagemouseup", __stageMouseUpHandler);
                    return;
                }

                that.moving = true;
                lastCoords = {
                    x: event.stageX,
                    y: event.stageY,
                    delta: 0
                };

                hideDOMLabel();

                that.stage.removeAllEventListeners("stagemousemove");
                that.stage.on("stagemousemove", (event) => {
                    that.stageX = event.stageX;
                    that.stageY = event.stageY;
    
                    if (!that.moving) return;

                    // if we are moving the block container, deselect the active block.
                    // Deselect active block if moving the block container
                    that.blocks.activeBlock = null;

                    // eslint-disable-next-line max-len
                    const delta = Math.abs(event.stageX - lastCoords.x) + Math.abs(event.stageY - lastCoords.y);

                    if (that.scrollBlockContainer) {
                        that.blocksContainer.x += event.stageX - lastCoords.x;
                    }

                    that.blocksContainer.y += event.stageY - lastCoords.y;
                    lastCoords = {
                        x: event.stageX,
                        y: event.stageY,
                        delta: lastCoords.delta + delta
                    };

                    that.refreshCanvas();
                });

                that.stage.removeAllEventListeners("stagemouseup");
                that.stage.on("stagemouseup", __stageMouseUpHandler);
            });
        };

        /**
         * Sets up scrolling functionality in palette and across canvas
         * Retrieves the scale of the stage.
         * @returns {number} - The scale of the stage.
         */
        this.getStageScale = () => {
            return this.turtleBlocksScale;
        };

        /**
         * Retrieves the X coordinate of the stage.
         * @returns {number} - The X coordinate of the stage.
         */
        this.getStageX = () => {
            return this.turtles.screenX2turtleX(this.stageX / this.turtleBlocksScale);
        };

        /**
         * Retrieves the Y coordinate of the stage.
         * @returns {number} - The Y coordinate of the stage.
         */
        this.getStageY = () => {
            return this.turtles.screenY2turtleY(
                (this.stageY - this.toolbarHeight) / this.turtleBlocksScale
            );
        };

        /**
         * Retrieves the mouse down state of the stage.
         * @returns {boolean} - The mouse down state of the stage.
         */
        this.getStageMouseDown = () => {
            return this.stageMouseDown;
        };

        /**
         * Creates and renders a grid on the stage.
         * @param {string} imagePath - The path of the grid image.
         * @returns {object} - The created grid object.
         */
        this._createGrid = (imagePath) => {
            const img = new Image();
            img.src = imagePath;
            const container = new createjs.Container();
            this.stage.addChild(container);

            const bitmap = new createjs.Bitmap(img);
            container.addChild(bitmap);
            bitmap.cache(0, 0, 1200, 900);

            bitmap.x = (this.canvas.width - 1200) / 2;
            bitmap.y = (this.canvas.height - 900) / 2;
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 1;
            bitmap.visible = false;
            bitmap.updateCache();

            return bitmap;
        };

        /**
         * Creates and renders a message container.
         * @param {string} fillColor - The fill color of the message container.
         * @param {string} strokeColor - The stroke color of the message container.
         * @param {function} callback - The callback function assigned to the message container.
         * @param {number} y - The position on the canvas.
         */
        this._createMsgContainer = (fillColor, strokeColor, callback, y) => {
            const container = new createjs.Container();
            this.stage.addChild(container);
            container.x = (this.canvas.width) / 2;
            container.y = y;
            container.visible = false;

            const img = new Image();
            const svgData = MSGBLOCK.replace("fill_color", fillColor).replace(
                "stroke_color",
                strokeColor
            );

            const that = this;

            img.onload = () => {
                const msgBlock = new createjs.Bitmap(img);
                container.addChild(msgBlock);
                const text = new createjs.Text("your message here", "20px Arial", "#000000");
                container.addChild(text);
                text.textAlign = "center";
                text.textBaseline = "alphabetic";
                text.x = 500;
                text.y = 30;

                const bounds = container.getBounds();
                container.cache(bounds.x, bounds.y, bounds.width, bounds.height);

                const hitArea = new createjs.Shape();
                hitArea.graphics.beginFill("#FFF").drawRect(0, 0, 1000, 42);
                hitArea.x = 0;
                hitArea.y = 0;
                container.hitArea = hitArea;

                // eslint-disable-next-line no-unused-vars
                container.on("click", (event) => {
                    container.visible = false;
                    // On the possibility that there was an error
                    // arrow associated with this container
                    if (that.errorMsgArrow !== null) {
                        that.errorMsgArrow.removeAllChildren(); // Hide the error arrow.
                    }

                    that.update = true;
                });

                callback(text);
                that.msgText = text;
            };

            img.src = "data:image/svg+xml;base64," + window.btoa(base64Encode(svgData));
        };

        /*
         * Creates and renders error message containers with appropriate artwork.
         * Some error messages have special artwork.
         */
        this._createErrorContainers = () => {
            for (let i = 0; i < ERRORARTWORK.length; i++) {
                const name = ERRORARTWORK[i];
                this._makeErrorArtwork(name);
            }
        };

        /**
         * Renders an error message with appropriate artwork.
         * @param {string} name - The name specifying the SVG to be rendered.
         */
        this._makeErrorArtwork = (name) => {
            const container = new createjs.Container();
            this.stage.addChild(container);
            container.x = (this.canvas.width) / 2;
            container.y = 80;
            this.errorArtwork[name] = container;
            this.errorArtwork[name].name = name;
            this.errorArtwork[name].visible = false;

            const img = new Image();
            img.onload = () => {
                const artwork = new createjs.Bitmap(img);
                container.addChild(artwork);
                const text = new createjs.Text("", "20px Sans", "#000000");
                container.addChild(text);
                text.x = 70;
                text.y = 10;

                const bounds = container.getBounds();
                container.cache(bounds.x, bounds.y, bounds.width, bounds.height);

                const hitArea = new createjs.Shape();
                hitArea.graphics.beginFill("#FFF").drawRect(0, 0, bounds.width, bounds.height);
                hitArea.x = 0;
                hitArea.y = 0;
                container.hitArea = hitArea;

                const that = this;
                // eslint-disable-next-line no-unused-vars
                container.on("click", (event) => {
                    container.visible = false;
                    // On the possibility that there was an error
                    // arrow associated with this container
                    if (that.errorMsgArrow !== null && that.errorMsgArrow !== undefined) {
                        that.errorMsgArrow.removeAllChildren(); // Hide the error arrow.
                    }
                    that.update = true;
                });
            };

            img.src = "images/" + name + ".svg";
        };

        /*
          Prepare a list of blocks for the search bar autocompletion.
         */
        this.prepSearchWidget = () => {
            //searchWidget.style.visibility = "hidden";
            this.searchBlockPosition = [100, 100];

            this.searchSuggestions = [];
            this.deprecatedBlockNames = [];

            for (const i in this.blocks.protoBlockDict) {
                const block = this.blocks.protoBlockDict[i];
                const blockLabel = block.staticLabels.join(" ");
                const artwork = block.palette.model.makeBlockInfo(0, block, block.name, block.name)[
                    "artwork64"
                ];
                if (blockLabel || block.extraSearchTerms !== undefined) {
                    if (block.deprecated) {
                        this.deprecatedBlockNames.push(blockLabel);
                    } else {
                        if (blockLabel.length === 0) {
                            // Swap in a preferred name when there is no label.
                            let label = _(block.name);
                            switch(block.name) {
                                case "scaledegree2":
                                    label = _("scale degree");
                                    break;
                                case "voicename":
                                    label = _("voice name");
                                    break;
                                case "invertmode":
                                    label = _("invert mode");
                                    break;
                                case "outputtools":
                                    label = _("output tools");
                                    break;
                                case "customNote":
                                    label = _("custom note");
                                    break;
                                case "accidentalname":
                                    label = _("accidental name");
                                    break;
                                case "eastindiansolfege":
                                    label = _("east indian solfege");
                                    break;
                                case "notename":
                                    label = _("note name");
                                    break;
                                case "temperamentname":
                                    label = _("temperament name");
                                    break;
                                case "modename":
                                    label = _("mode name");
                                    break;
                                case "chordname":
                                    label = _("chord name");
                                    break;
                                case "intervalname":
                                    label = _("interval name");
                                    break;
                                case "filtertype":
                                    label = _("filter type");
                                    break;
                                case "oscillatortype":
                                    label = _("oscillator type");
                                    break;
                                case "audiofile":
                                    label = _("audio file");
                                    break;
                                case "noisename":
                                    label = _("noise name");
                                    break;
                                case "drumname":
                                    label = _("drum name");
                                    break;
                                case "effectsname":
                                    label = _("effects name");
                                    break;
                                case "wrapmode":
                                    label = _("wrap mode");
                                    break;
                                case "loadFile":
                                    label = _("load file");
                                    break;
                            }
                            this.searchSuggestions.push({
                                label: label,
                                value: block.name,
                                specialDict: block,
                                artwork: artwork
                            });
                        } else {
                            this.searchSuggestions.push({
                                label: blockLabel,
                                value: block.name,
                                specialDict: block,
                                artwork: artwork
                            });
                        }
                        if (block.extraSearchTerms !== undefined) {
                            for (let i = 0; i < block.extraSearchTerms.length; i++) {
                                this.searchSuggestions.push({
                                    label: block.extraSearchTerms[i],
                                    value: block.name,
                                    specialDict: block,
                                    artwork: artwork
                                });
                            }
                        }
                    }
                }
            }

            this.searchSuggestions = this.searchSuggestions.reverse();
        };

        /*
         * Hides search widget
         */
        this.hideSearchWidget = () => {
            // Hide the jQuery search results widget.
            const obj = docByClass("ui-menu");
            if (obj.length > 0) {
                obj[0].style.visibility = "hidden";
            }

            this.searchWidget.style.visibility = "hidden";
            this.searchWidget.idInput_custom = "";
        };

        /*
         * Shows search widget
         */
        this.showSearchWidget = () => {
            // Bring widget to top.
            this.searchWidget.style.zIndex = 1001;
            this.searchWidget.style.border = "2px solid blue";
            if (this.searchWidget.style.visibility === "visible") {
                this.hideSearchWidget();
            } else {
                const obj = docByClass("ui-menu");
                if (obj.length > 0) {
                    obj[0].style.visibility = "visible";
                }

                this.searchWidget.value = null;
                this.searchWidget.style.visibility = "visible";
                this.searchWidget.style.left =
                    this.palettes.getSearchPos()[0] * this.turtleBlocksScale * 1.5 + "px";
                this.searchWidget.style.top =
                    this.palettes.getSearchPos()[1] * this.turtleBlocksScale * 0.95 + "px";

                this.searchBlockPosition = [100, 100];
                this.prepSearchWidget();

                const that = this;
                const closeListener = (e) => {
                    if (
                        docById("search").style.visibility === "visible" &&
                        (e.target === docById("search") || docById("search").contains(e.target))
                    ) {
                        //do nothing when clicked in the input field
                    } else if (
                        docById("ui-id-1") && docById("ui-id-1").style.display === "block" &&
                        (e.target === docById("ui-id-1") || docById("ui-id-1").contains(e.target))
                    ) {
                        //do nothing when clicked on the menu
                    } else if (document.getElementsByTagName("tr")[2].contains(e.target)) {
                        //do nothing when clicked on the search row
                    } else if (e.target.id === "myCanvas") {
                        that.hideSearchWidget();
                        document.removeEventListener("mousedown", closeListener);
                    }
                };
                document.addEventListener("mousedown", closeListener);

                // Give the browser time to update before selecting
                // focus.
                setTimeout(() => {
                    that.searchWidget.focus();
                    that.doSearch();
                }, 500);
            }
        };

        /*
         * Uses JQuery to add autocompleted search suggestions
         */
        this.doSearch = () => {
            const $j = jQuery.noConflict();

            const that = this;
            $j("#search").autocomplete({
                source: that.searchSuggestions,
                select: (event, ui) => {
                    event.preventDefault();
                    that.searchWidget.value = ui.item.label;
                    that.searchWidget.idInput_custom = ui.item.value;
                    that.searchWidget.protoblk = ui.item.specialDict;
                    that.doSearch();
                    if (event.keyCode === 13) this.searchWidget.style.visibility = "visible";
                },
                focus: (event) => {
                    event.preventDefault();
                }
            });

            $j("#search").autocomplete("instance")._renderItem = (ul, item) => {
                return $j("<li></li>")
                    .data("item.autocomplete", item)
                    .append(
                        '<img src="' +
                            item.artwork +
                            '" height="20px">' +
                            "<a> " +
                            item.label +
                            "</a>"
                    )
                    .appendTo(ul.css({
                        "z-index": 9999,
                        "max-height": "200px",
                        "overflow-y": "auto"
                    }));
            };
            const searchInput = this.searchWidget.idInput_custom;
            if (!searchInput || searchInput.length <= 0) return;

            const protoblk = this.searchWidget.protoblk;
            const paletteName = protoblk.palette.name;
            const protoName = protoblk.name;

            // eslint-disable-next-line no-prototype-builtins
            if (this.blocks.protoBlockDict.hasOwnProperty(protoName)) {
                this.palettes.dict[paletteName].makeBlockFromSearch(
                    protoblk,
                    protoName,
                    (newBlock) => {
                        that.blocks.moveBlock(
                            newBlock,
                            100 + that.searchBlockPosition[0] - that.blocksContainer.x,
                            that.searchBlockPosition[1] - that.blocksContainer.y
                        );
                    }
                );

                // Move the position of the next newly created block.
                this.searchBlockPosition[0] += STANDARDBLOCKHEIGHT;
                this.searchBlockPosition[1] += STANDARDBLOCKHEIGHT;
            } else if (this.deprecatedBlockNames.indexOf(searchInput) > -1) {
                this.errorMsg(_("This block is deprecated."));
            } else {
                this.errorMsg(_("Block cannot be found."));
            }

            this.searchWidget.value = "";
            this.update = true;
        };

        /*
         * Makes initial "start up" note for a brand new MB project
         */
        this.__makeNewNote = (octave, solf) => {
            const newNote = [
                [
                    0,
                    "newnote",
                    300 - this.blocksContainer.x,
                    300 - this.blocksContainer.y,
                    [null, 1, 4, 8]
                ],
                [1, "divide", 0, 0, [0, 2, 3]],
                [
                    2,
                    [
                        "number",
                        {
                            value: 1
                        }
                    ],
                    0,
                    0,
                    [1]
                ],
                [
                    3,
                    [
                        "number",
                        {
                            value: 4
                        }
                    ],
                    0,
                    0,
                    [1]
                ],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "pitch", 0, 0, [4, 6, 7, null]],
                [
                    6,
                    [
                        "solfege",
                        {
                            value: solf
                        }
                    ],
                    0,
                    0,
                    [5]
                ],
                [
                    7,
                    [
                        "number",
                        {
                            value: octave
                        }
                    ],
                    0,
                    0,
                    [5]
                ],
                [8, "hidden", 0, 0, [0, null]]
            ];

            this.blocks.loadNewBlocks(newNote);
            if (this.blocks.activeBlock !== null) {
                // Connect the newly created block to the active block (if
                // it is a hidden block at the end of a new note block).
                const bottom = this.blocks.findBottomBlock(this.blocks.activeBlock);
                if (
                    this.blocks.blockList[bottom].name === "hidden" &&
                    this.blocks.blockList[this.blocks.blockList[bottom].connections[0]].name ===
                        "newnote"
                ) {
                    // The note block macro creates nine blocks.
                    const newlyCreatedBlock = this.blocks.blockList.length - 9;

                    // Set last connection of active block to the
                    // newly created block.
                    const lastConnection = this.blocks.blockList[bottom].connections.length - 1;
                    this.blocks.blockList[bottom].connections[lastConnection] = newlyCreatedBlock;

                    // Set first connection of the newly created block to
                    // the active block.
                    this.blocks.blockList[newlyCreatedBlock].connections[0] = bottom;
                    // Adjust the dock positions to realign the stack.
                    this.blocks.adjustDocks(bottom, true);
                }
            }

            // Set new hidden block at the end of the newly created
            // note block to the active block.
            this.blocks.activeBlock = this.blocks.blockList.length - 1;
        };

        /*
         * Handles keyboard shortcuts in MB
         */
        this.__keyPressed = (event) => {
            if (window.widgetWindows.isOpen("JavaScript Editor") === true) return;

            if (!this.keyboardEnableFlag) {
                return;
            }
            if (docById("labelDiv").classList.contains("hasKeyboard")) {
                return;
            }
            if (this.keyboardEnableFlag) {
                if (
                    docById("BPMInput") !== null &&
                    docById("BPMInput").classList.contains("hasKeyboard")
                ) {
                    return;
                }

                if (
                    docById("musicratio1") !== null &&
                    docById("musicratio1").classList.contains("hasKeyboard")
                ) {
                    return;
                }

                if (
                    docById("musicratio2") !== null &&
                    docById("musicratio2").classList.contains("hasKeyboard")
                ) {
                    return;
                }

                if (
                    docById("dissectNumber") !== null &&
                    docById("dissectNumber").classList.contains("hasKeyboard")
                ) {
                    return;
                }

                if (
                    docById("timbreName") !== null &&
                    docById("timbreName").classList.contains("hasKeyboard")
                ) {
                    return;
                }
            }

            // const BACKSPACE = 8;
            const TAB = 9;

            if (event.keyCode === TAB) {
                // Prevent browser from grabbing TAB key
                event.preventDefault();
                return false;
            }

            const ESC = 27;
            // const ALT = 18;
            // const CTRL = 17;
            // const SHIFT = 16;
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

            const disableKeys =
                docById("lilypondModal").style.display === "block" ||
                this.searchWidget.style.visibility === "visible" ||
                this.helpfulSearchWidget.style.visibility === "visible" ||
                docById("planet-iframe").style.display === "" ||
                docById("paste").style.visibility === "visible" ||
                docById("wheelDiv").style.display === "" ||
                this.turtles.running();

            const widgetTitle = document.getElementsByClassName("wftTitle");
            for (let i = 0; i < widgetTitle.length; i++) {
                if (widgetTitle[i].innerHTML === "tempo") {
                    this.inTempoWidget = true;
                    break;
                }
            }

            if ((event.altKey && !disableKeys) || (event.keyCode == 13) || (event.key == '/') || (event.key == '\\') ) {
                switch (event.keyCode) {
                    case 66: // 'B'
                        this.textMsg("Alt-B " + _("Saving block artwork"));
                        this.save.saveBlockArtwork();
                        break;
                    case 67: // 'C'
                        this.textMsg("Alt-C " + _("Copy"));
                        this.blocks.prepareStackForCopy();
                        break;
                    case 68: // 'D'
                        this.palettes.dict["myblocks"].promptMacrosDelete();
                        break;
                    case 69: // 'E'
                        this.textMsg("Alt-E " + _("Erase"));
                        this._allClear(false);
                        break;
                    case 82: // 'R or ENTER'
                        this.textMsg("Alt-R " + _("Play"));
                        let stopbtn = document.getElementById("stop");
                        if (stopbtn) {
                            stopbtn.style.color = platformColor.stopIconcolor;
                        }
                        this._doFastButton();
                        break;
                    case 13: // 'R or ENTER'
                        if (this.searchWidget.style.visibility === 'visible') {
                            return;
                        }
                        this.textMsg("Enter " + _("Play"));
                        let stopbt = document.getElementById("stop");
                        if (stopbt) {
                            stopbt.style.color = platformColor.stopIconcolor;
                        }
                        this._doFastButton();
                        break;
                    case 83: // 'S'
                        this.textMsg("Alt-S " + _("Stop"));
                        this.logo.doStopTurtles();
                        break;
                    case 86: // 'V'
                        this.textMsg("Alt-V " + _("Paste"));
                        this.blocks.pasteStack();
                        break;
                    case 72: // 'H' save block help
                        this.textMsg("Alt-H " + _("Save block help"));
                        this._saveHelpBlocks();
                        break;
                    case 191:
                        if (event.key=='/' && (!this.beginnerMode) && (disableHorizScrollIcon.style.display == "block")) {
                           this.blocksContainer.x += this.canvas.width / 10;
                           this.stage.update();
                        }
                    case 220:
                        if (event.key=='\\' && (!this.beginnerMode) && (disableHorizScrollIcon.style.display == "block")) {
                            this.blocksContainer.x -= this.canvas.width / 10;
                            this.stage.update();
                        }
    
                }
            } else if (event.ctrlKey) {
                switch (event.keyCode) {
                    case V:
                        this.textMsg("Ctl-V " + _("Paste"));
                        this.pasteBox.createBox(this.turtleBlocksScale, 200, 200);
                        this.pasteBox.show();
                        docById("paste").style.left =
                            (this.pasteBox.getPos()[0] + 10) * this.turtleBlocksScale + "px";
                        docById("paste").style.top =
                            (this.pasteBox.getPos()[1] + 10) * this.turtleBlocksScale + "px";
                        docById("paste").focus();
                        docById("paste").style.visibility = "visible";
                        this.update = true;
                        break;
                }
            } else if (event.shiftKey && !disableKeys) {
                const solfnotes_ = _("ti la sol fa mi re do").split(" ");
                switch (event.keyCode) {
                    case KEYCODE_D:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            this.textMsg("D " + solfnotes_[6]);
                            this.__makeNewNote(5, "do");
                        }
                        break;
                    case KEYCODE_R:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            this.textMsg("R " + solfnotes_[5]);
                            this.__makeNewNote(5, "re");
                        }
                        break;
                    case KEYCODE_M:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            this.textMsg("M " + solfnotes_[4]);
                            this.__makeNewNote(5, "mi");
                        }
                        break;
                    case KEYCODE_F:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            this.textMsg("F " + solfnotes_[3]);
                            this.__makeNewNote(5, "fa");
                        }
                        break;
                    case KEYCODE_S:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            this.textMsg("S " + solfnotes_[2]);
                            this.__makeNewNote(5, "sol");
                        }
                        break;
                    case KEYCODE_L:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            this.textMsg("L " + solfnotes_[1]);
                            this.__makeNewNote(5, "la");
                        }
                        break;
                    case KEYCODE_T:
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            this.textMsg("T " + solfnotes_[0]);
                            this.__makeNewNote(5, "ti");
                        }
                        break;
                }
            } else {
                if (docById("paste").style.visibility === "visible" && event.keyCode === RETURN) {
                    if (docById("paste").value.length > 0) {
                        this.pasted();
                    }
                } else if (!disableKeys) {
                    const solfnotes_ = _("ti la sol fa mi re do").split(" ");
                    switch (event.keyCode) {
                        case END:
                            this.textMsg("END " + _("Jumping to the bottom of the page."));
                            this.blocksContainer.y =
                                -this.blocks.bottomMostBlock() + this.canvas.height / 2;
                            this.stage.update();
                            break;
                        case PAGE_UP:
                            this.textMsg("PAGE_UP " + _("Scrolling up."));
                            this.blocksContainer.y += this.canvas.height / 2;
                            this.stage.update();
                            break;
                        case PAGE_DOWN:
                            this.textMsg("PAGE_DOWN " + _("Scrolling down."));
                            this.blocksContainer.y -= this.canvas.height / 2;
                            this.stage.update();
                            break;
                        case DEL:
                            this.textMsg("DEL " + _("Extracting block"));
                            this.blocks.extract();
                            break;
                        case KEYCODE_UP:
                            if (this.inTempoWidget) {
                                this.logo.tempo.speedUp(0);
                            } else {
                                if (this.blocks.activeBlock !== null) {
                                    this.textMsg("UP ARROW " + _("Moving block up."));
                                    this.blocks.moveStackRelative(
                                        this.blocks.activeBlock,
                                        0,
                                        -STANDARDBLOCKHEIGHT / 2
                                    );
                                    this.blocks.blockMoved(this.blocks.activeBlock);
                                    this.blocks.adjustDocks(this.blocks.activeBlock, true);
                                } else if (this.palettes.activePalette !== null) {
                                    this.palettes.activePalette.scrollEvent(STANDARDBLOCKHEIGHT, 1);
                                } else {
                                    this.blocksContainer.y += 20;
                                }
                                this.stage.update();
                            }
                            break;
                        case KEYCODE_DOWN:
                            if (this.inTempoWidget) {
                                this.logo.tempo.slowDown(0);
                            } else {
                                if (this.blocks.activeBlock !== null) {
                                    this.textMsg("DOWN ARROW " + _("Moving block down."));
                                    this.blocks.moveStackRelative(
                                        this.blocks.activeBlock,
                                        0,
                                        STANDARDBLOCKHEIGHT / 2
                                    );
                                    this.blocks.blockMoved(this.blocks.activeBlock);
                                    this.blocks.adjustDocks(this.blocks.activeBlock, true);
                                } else if (this.palettes.activePalette !== null) {
                                    this.palettes.activePalette.scrollEvent(
                                        -STANDARDBLOCKHEIGHT, 1
                                    );
                                } else {
                                    this.blocksContainer.y -= 20;
                                }
                                this.stage.update();
                            }
                            break;
                        case KEYCODE_LEFT:
                            if (!this.inTempoWidget) {
                                if (this.blocks.activeBlock !== null) {
                                    this.textMsg("LEFT ARROW " + _("Moving block left."));
                                    this.blocks.moveStackRelative(
                                        this.blocks.activeBlock,
                                        -STANDARDBLOCKHEIGHT / 2,
                                        0
                                    );
                                    this.blocks.blockMoved(this.blocks.activeBlock);
                                    this.blocks.adjustDocks(this.blocks.activeBlock, true);
                                } else if (this.scrollBlockContainer) {
                                    this.blocksContainer.x += 20;
                                }
                                this.stage.update();
                            }
                            break;
                        case KEYCODE_RIGHT:
                            if (!this.inTempoWidget) {
                                if (this.blocks.activeBlock !== null) {
                                    this.textMsg("RIGHT ARROW " + _("Moving block right."));
                                    this.blocks.moveStackRelative(
                                        this.blocks.activeBlock,
                                        STANDARDBLOCKHEIGHT / 2,
                                        0
                                    );
                                    this.blocks.blockMoved(this.blocks.activeBlock);
                                    this.blocks.adjustDocks(this.blocks.activeBlock, true);
                                } else if (this.scrollBlockContainer) {
                                    this.blocksContainer.x -= 20;
                                }
                                this.stage.update();
                            }
                            break;
                        case HOME:
                            this.textMsg("HOME " + _("Jump to home position."));
                            if (this.palettes.mouseOver) {
                                const dy = Math.max(55 - this.palettes.buttons["rhythm"].y, 0);
                                this.palettes.menuScrollEvent(1, dy);
                                this.palettes.hidePaletteIconCircles();
                            } else if (this.palettes.activePalette !== null) {
                                this.palettes.activePalette.scrollEvent(
                                    -this.palettes.activePalette.scrollDiff,
                                    1
                                );
                            } else {
                                // Bring all the blocks "home".
                                this._findBlocks();
                            }
                            this.stage.update();
                            break;
                        case TAB:
                            break;
                        case SPACE:
                            if (this.turtleContainer.scaleX === 1) {
                                this.turtles.setStageScale(0.5);
                            } else {
                                this.turtles.setStageScale(1);
                            }
                            break;
                        case ESC:
                            if (this.searchWidget.style.visibility === "visible") {
                                this.textMsg("ESC " + _("Hide blocks"));
                                this.searchWidget.style.visibility = "hidden";
                            }
                            break;
                        case RETURN:
                            this.textMsg("Return " + _("Play"));
                            if (this.inTempoWidget) {
                                if (this.logo.tempo.isMoving) {
                                    this.logo.tempo.pause();
                                }
                                this.logo.tempo.resume();
                            }
                            if (
                                this.blocks.activeBlock === null ||
                                !SPECIALINPUTS.includes(
                                    this.blocks.blockList[this.blocks.activeBlock].name
                                )
                            ) {
                                this.logo.runLogoCommands();
                            }
                            break;
                        case KEYCODE_D:
                            if (_THIS_IS_MUSIC_BLOCKS_) {
                                this.textMsg("d " + solfnotes_[6]);
                                this.__makeNewNote(4, "do");
                            }
                            break;
                        case KEYCODE_R:
                            if (_THIS_IS_MUSIC_BLOCKS_) {
                                this.textMsg("r " + solfnotes_[5]);
                                this.__makeNewNote(4, "re");
                            }
                            break;
                        case KEYCODE_M:
                            if (_THIS_IS_MUSIC_BLOCKS_) {
                                this.textMsg("m " + solfnotes_[4]);
                                this.__makeNewNote(4, "mi");
                            }
                            break;
                        case KEYCODE_F:
                            if (_THIS_IS_MUSIC_BLOCKS_) {
                                this.textMsg("f " + solfnotes_[3]);
                                this.__makeNewNote(4, "fa");
                            }
                            break;
                        case KEYCODE_S:
                            if (_THIS_IS_MUSIC_BLOCKS_) {
                                this.textMsg("s " + solfnotes_[2]);
                                this.__makeNewNote(4, "sol");
                            }
                            break;
                        case KEYCODE_L:
                            if (_THIS_IS_MUSIC_BLOCKS_) {
                                this.textMsg("l " + solfnotes_[1]);
                                this.__makeNewNote(4, "la");
                            }
                            break;
                        case KEYCODE_T:
                            if (_THIS_IS_MUSIC_BLOCKS_) {
                                this.textMsg("t " + solfnotes_[0]);
                                this.__makeNewNote(4, "ti");
                            }
                            break;
                        default:
                            break;
                    }
                }

                // Always store current key so as not to mask it from
                // the keyboard block.
                this.currentKeyCode = event.keyCode;
            }
        };

        /**
         * @returns currentKeyCode
         */
        this.getCurrentKeyCode = () => {
            return this.currentKeyCode;
        };

        /*
         * Sets current key code to 0
         */
        this.clearCurrentKeyCode = () => {
            this.currentKey = "";
            this.currentKeyCode = 0;
        };

        /*
         * Handles resizing for MB.
         * Detects width/height changes and closes any menus before actual resize.
         * Repositions containers/palette/home buttons
         */
        this._onResize = (force) => {
            if (!force) {
                if (this.saveLocally !== null) {
                    this.saveLocally();
                }
            }

            const $j = jQuery.noConflict();
            let w = 0,
                h = 0;
            if (typeof platform !== 'undefined' &&
                    !platform.androidWebkit) {
                w = window.innerWidth;
                h = window.innerHeight;
            } else {
                w = window.outerWidth;
                h = window.outerHeight;
            }

            this._clientWidth = document.body.clientWidth;
            this._clientHeight = document.body.clientHeight;
            this._innerWidth = window.innerWidth;
            this._innerHeight = window.innerHeight;
            this._outerWidth = window.outerWidth;
            this._outerHeight = window.outerHeight;
    
            if (docById("labelDiv").classList.contains("hasKeyboard")) {
                return;
            }

            const smallSide = Math.min(w, h);
            let mobileSize;
            if (smallSide < this.cellSize * 9) {
                mobileSize = false;
                /*
                if (w < this.cellSize * 10) {
                    this.turtleBlocksScale = smallSide / (this.cellSize * 11);
                } else {
                    this.turtleBlocksScale = Math.max(smallSide / (this.cellSize * 11), 0.75);
                }
                */
            } else {
                mobileSize = false;
                /*
                if (w / 1200 > h / 900) {
                    this.turtleBlocksScale = w / 1200;
                } else {
                    this.turtleBlocksScale = h / 900;
                }
                */
            }

            this.turtleBlocksScale = 1.0;

            this.stage.scaleX = this.turtleBlocksScale;
            this.stage.scaleY = this.turtleBlocksScale;

            this.stage.canvas.width = w;
            this.stage.canvas.height = h;

            this.turtles.doScale(w, h, this.turtleBlocksScale);

            this.boundary.setScale(w, h, this.turtleBlocksScale);
            this.trashcan.resizeEvent(this.turtleBlocksScale);

            // We need to reposition the palette buttons
            this._setupPaletteMenu();

            // Reposition coordinate grids.
            const newX = this.canvas.width / (2 * this.turtleBlocksScale) - 600;
            const newY = this.canvas.height / (2 * this.turtleBlocksScale) - 450;
            this.cartesianBitmap.x = newX;
            this.cartesianBitmap.y = newY;
            this.polarBitmap.x = newX;
            this.polarBitmap.y = newY;
            this.trebleBitmap.x = newX;
            this.trebleBitmap.y = newY;
            this.grandBitmap.x = newX;
            this.grandBitmap.y = newY;
            this.sopranoBitmap.x = newX;
            this.sopranoBitmap.y = newY;
            this.altoBitmap.x = newX;
            this.altoBitmap.y = newY;
            this.tenorBitmap.x = newX;
            this.tenorBitmap.y = newY;
            this.bassBitmap.x = newX;
            this.bassBitmap.y = newY;
            // The accidental overlays
            for (let i = 0; i < 7; i++) {
                this.grandSharpBitmap[i].x = newX;
                this.grandFlatBitmap[i].x = newX;
                this.trebleSharpBitmap[i].x = newX;
                this.trebleFlatBitmap[i].x = newX;
                this.sopranoSharpBitmap[i].x = newX;
                this.sopranoFlatBitmap[i].x = newX;
                this.altoSharpBitmap[i].x = newX;
                this.altoFlatBitmap[i].x = newX;
                this.tenorSharpBitmap[i].x = newX;
                this.tenorFlatBitmap[i].x = newX;
                this.bassSharpBitmap[i].x = newX;
                this.bassFlatBitmap[i].x = newX;
            }
            // Position the sharps and flats
            this.grandSharpBitmap[0].y = newY;
            this.grandSharpBitmap[1].y = this.canvas.height / (2 * this.turtleBlocksScale) - 412.5;
            this.grandSharpBitmap[2].y = this.canvas.height / (2 * this.turtleBlocksScale) - 462.5;
            this.grandSharpBitmap[3].y = this.canvas.height / (2 * this.turtleBlocksScale) - 425;
            this.grandSharpBitmap[4].y = this.canvas.height / (2 * this.turtleBlocksScale) - 387.5;
            this.grandSharpBitmap[5].y = this.canvas.height / (2 * this.turtleBlocksScale) - 437.5;
            this.grandSharpBitmap[6].y = this.canvas.height / (2 * this.turtleBlocksScale) - 400;
            this.grandFlatBitmap[0].y = newY;
            this.grandFlatBitmap[1].y = this.canvas.height / (2 * this.turtleBlocksScale) - 487.5;
            this.grandFlatBitmap[2].y = this.canvas.height / (2 * this.turtleBlocksScale) - 437.5;
            this.grandFlatBitmap[3].y = this.canvas.height / (2 * this.turtleBlocksScale) - 475;
            this.grandFlatBitmap[4].y = this.canvas.height / (2 * this.turtleBlocksScale) - 425;
            this.grandFlatBitmap[5].y = this.canvas.height / (2 * this.turtleBlocksScale) - 462.5;
            this.grandFlatBitmap[6].y = this.canvas.height / (2 * this.turtleBlocksScale) - 412.5;

            for (let i = 0; i < 7; i++) {
                this.trebleSharpBitmap[i].y = this.grandSharpBitmap[i].y;
                this.trebleFlatBitmap[i].y = this.grandFlatBitmap[i].y;
                this.sopranoSharpBitmap[i].y = this.grandSharpBitmap[i].y;
                this.sopranoFlatBitmap[i].y = this.grandFlatBitmap[i].y;
                this.altoSharpBitmap[i].y = this.grandSharpBitmap[i].y;
                this.altoFlatBitmap[i].y = this.grandFlatBitmap[i].y;
                this.tenorSharpBitmap[i].y = this.grandSharpBitmap[i].y;
                this.tenorFlatBitmap[i].y = this.grandFlatBitmap[i].y;
                this.bassSharpBitmap[i].y = this.grandSharpBitmap[i].y;
                this.bassFlatBitmap[i].y = this.grandFlatBitmap[i].y;
            }

            // Some accidentals on the Soprano staff shift by an octave.
            this.sopranoSharpBitmap[4].y -= 87.5;
            this.sopranoSharpBitmap[6].y -= 87.5;
            this.sopranoFlatBitmap[0].y -= 87.5;
            this.sopranoFlatBitmap[2].y -= 87.5;
            this.sopranoFlatBitmap[4].y -= 87.5;
            this.sopranoFlatBitmap[6].y -= 87.5;

            for (let i = 0; i < 7; i++) {
                this.sopranoSharpBitmap[i].y += 87.5;
                this.sopranoFlatBitmap[i].y += 87.5;
            }

            for (let i = 0; i < 7; i++) {
                this.altoSharpBitmap[i].y += 87.5;
                this.altoFlatBitmap[i].y += 87.5;
            }

            // Some accidentals on the tenor staff shift by an octave.
            this.tenorSharpBitmap[0].y += + 87.5;
            this.tenorSharpBitmap[2].y += 87.5;

            for (let i = 0; i < 7; i++) {
                this.tenorSharpBitmap[i].y += 87.5;
                this.tenorFlatBitmap[i].y += 87.5;
            }

            for (let i = 0; i < 7; i++) {
                this.bassSharpBitmap[i].y += 175;
                this.bassFlatBitmap[i].y += 175;
            }

            this.update = true;

            // Hide tooltips on mobile
            if (typeof platform !== 'undefined' &&
                    platform.mobile) {
                // palettes.setMobile(true);
                // palettes.hide();
                this.toolbar.disableTooltips($j);
            } else {
                this.palettes.setMobile(false);
            }

            for (let turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
                this.turtles.turtleList[turtle].painter.doClear(false, false, true);
            }

            const artcanvas = docById("overlayCanvas");
            // Workaround for #795.5
            if (mobileSize) {
                artcanvas.width = w * 2;
                artcanvas.height = h * 2;
            } else {
                artcanvas.width = w;
                artcanvas.height = h;
            }

            this.blocks.checkBounds();
        };
        
        const container = document.getElementById("canvasContainer");
        const canvas = document.getElementById("myCanvas");
        const overCanvas = document.getElementById("canvas");
        const canvasHolder = document.getElementById("canvasHolder");
        const defaultWidth = 1600;
        const defaultHeight = 900;

        function handleResize() {
            const isMaximized = (
                window.innerWidth ===
                    window.screen.width && window.innerHeight ===
                    window.screen.height
            );
            if (isMaximized) {
                container.style.width = defaultWidth + "px";
                container.style.height = defaultHeight + "px";
                canvas.width = defaultWidth;
                canvas.height = defaultHeight;
                overCanvas.width = canvas.width;
                overCanvas.height =canvas.width;
                canvasHolder.width = defaultWidth;
                canvasHolder.height = defaultHeight;

            } else {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                container.style.width = windowWidth + "px";
                container.style.height = windowHeight + "px";
                canvas.width = windowWidth;
                canvas.height = windowHeight;
                overCanvas.width = canvas.width;
                overCanvas.height =canvas.width;
                canvasHolder.width = canvas.width;
                canvasHolder.height = canvas.height;
            }
            document.getElementById("hideContents").click();
            that.refreshCanvas();
        }

        let resizeTimeout;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                handleResize();
                this._setupPaletteMenu();
            }, 100);
        });
        window.addEventListener("orientationchange",  handleResize);
        const that = this;        
        const resizeCanvas_ = () => {
            try {
                that._onResize(false);
                document.getElementById("hideContents").click();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error("An error occurred in resizeCanvas_:", error);
            }
        };
        
        resizeCanvas_();
        window.addEventListener("orientationchange", resizeCanvas_);
        
        /*
         * Restore last stack pushed to trashStack back onto canvas.
         * Hides palettes before update
         * Repositions blocks about trash area
         */
        const restoreTrash = (activity) => {
            if (!activity.blocks || !activity.blocks.trashStacks || activity.blocks.trashStacks.length === 0) {
                activity.textMsg(
                    _("Nothing in the trash to restore."),
                    3000 
                );
                return;
            }
            activity._restoreTrash();
            activity.textMsg(
                _("Item restored from the trash."),
                3000 
            );
        
            if (docById("helpfulWheelDiv").style.display !== "none") {
                docById("helpfulWheelDiv").style.display = "none";
                activity.__tick();
            }
        };

        this._restoreTrash = () => {
            for (const name in this.palettes.dict) {
                this.palettes.dict[name].hideMenu(true);
            }
            
            this.blocks.activeBlock = null;
            this.refreshCanvas();

            const dx = 0;
            const dy = -this.cellSize * 3; // Reposition

            if (this.blocks.trashStacks.length === 0) {
                return;
            }

            const thisBlock = this.blocks.trashStacks.pop();

            // Restore drag group in trash
            this.blocks.findDragGroup(thisBlock);
            for (let b = 0; b < this.blocks.dragGroup.length; b++) {
                const blk = this.blocks.dragGroup[b];
                this.blocks.blockList[blk].trash = false;
                this.blocks.moveBlockRelative(blk, dx, dy);
                this.blocks.blockList[blk].show();
            }

            this.blocks.raiseStackToTop(thisBlock);

            if (
                this.blocks.blockList[thisBlock].name === "start" ||
                this.blocks.blockList[thisBlock].name === "drum"
            ) {
                const turtle = this.blocks.blockList[thisBlock].value;
                this.turtles.turtleList[turtle].inTrash = false;
                this.turtles.turtleList[turtle].container.visible = true;
            } else if (this.blocks.blockList[thisBlock].name === "action") {
                // We need to add a palette entry for this action.
                // But first we need to ensure we have a unqiue name,
                // as the name could have been taken in the interim.
                const actionArg = this.blocks.blockList[
                    this.blocks.blockList[thisBlock].connections[1]
                ];
                if (actionArg !== null) {
                    let label;
                    const oldName = actionArg.value;
                    // Mark the action block as still being in the
                    // trash so that its name won't be considered when
                    // looking for a unique name.
                    this.blocks.blockList[thisBlock].trash = true;
                    const uniqueName = this.blocks.findUniqueActionName(oldName);
                    this.blocks.blockList[thisBlock].trash = false;

                    if (uniqueName !== actionArg) {
                        actionArg.value = uniqueName;

                        label = actionArg.value.toString();
                        if (label.length > 8) {
                            label = label.substr(0, 7) + "...";
                        }
                        actionArg.text.text = label;

                        if (actionArg.label !== null) {
                            actionArg.label.value = uniqueName;
                        }

                        actionArg.container.updateCache();

                        // Check the drag group to ensure any do blocks are updated (in case of recursion).
                        for (let b = 0; b < this.blocks.dragGroup.length; b++) {
                            const me = this.blocks.blockList[this.blocks.dragGroup[b]];
                            if (
                                ["nameddo", "nameddoArg", "namedcalc", "namedcalcArg"].includes(
                                    me.name
                                ) &&
                                me.privateData === oldName
                            ) {
                                me.privateData = uniqueName;
                                me.value = uniqueName;

                                label = me.value.toString();
                                if (label.length > 8) {
                                    label = label.substr(0, 7) + "...";
                                }
                                me.text.text = label;
                                me.overrideName = label;
                                me.regenerateArtwork();
                                me.container.updateCache();
                            }
                        }
                    }
                }
            }

            this.refreshCanvas();
        };

        this.handleKeyDown = (event) => {
            
            if (event.ctrlKey && event.key === "z") {
                this._restoreTrash(activity);
                activity.__tick();
                event.preventDefault();
            }
        };

        // Attach keydown event listener to document
        document.addEventListener("keydown", this.handleKeyDown);

        /*
         * Open aux menu
         */
        this._openAuxMenu = () => {
            if (!this.turtles.running() && this.toolbarHeight === 0) {
                this._showHideAuxMenu(false);
            }
        };

        /*
         * Toggles Aux menu visibility and positioning
         */
        const showHideAuxMenu = (activity, resize) => {
            activity._showHideAuxMenu(resize);
        };

        this._showHideAuxMenu = (resize) => {
            const cellsize = 55;
            let dy;

            // function to increase or decrease the "top" property of the top-right corner buttons

            const topRightButtons = document.querySelectorAll("#buttoncontainerTOP .tooltipped");
            const btnY = document.getElementById("Grid").getBoundingClientRect().top;

            this.changeTopButtonsPosition = (value) => {
                topRightButtons.forEach((child) => {
                    child.style.top = `${btnY + value}px`;
                });
            };
            
              if (!resize && this.toolbarHeight === 0) {
                dy = cellsize + LEADING + 5;
                
                this.toolbarHeight = dy;
                this.palettes.deltaY(dy);
                this.turtles.deltaY(dy);
                this.blocksContainer.y += dy;
                this.changeTopButtonsPosition(dy);

                this.cartesianBitmap.y += dy;
                this.polarBitmap.y += dy;
                this.trebleBitmap.y += dy;
                this.grandBitmap.y += dy;
                this.sopranoBitmap.y += dy;
                this.altoBitmap.y += dy;
                this.tenorBitmap.y += dy;
                this.bassBitmap.y += dy;
                this.blocks.checkBounds();
            
            } else{
                dy = this.toolbarHeight ;
                this.toolbarHeight = 0; 
                
                this.turtles.deltaY(-dy);
                this.palettes.deltaY(-dy);
                this.blocksContainer.y -= dy
                this.changeTopButtonsPosition(-dy);
                
                this.cartesianBitmap.y -= dy;
                this.polarBitmap.y -= dy;
                this.trebleBitmap.y -= dy;
                this.grandBitmap.y -= dy;
                this.sopranoBitmap.y -= dy;
                this.altoBitmap.y -= dy;
                this.tenorBitmap.y -= dy;
                this.bassBitmap.y -= dy;
            }

            this.refreshCanvas();
        };

        /*
         * Hides aux menu
         */
        this.hideAuxMenu = () => {
            if (this.toolbarHeight > 0) {
                this._showHideAuxMenu(false);
                this.menuButtonsVisible = false;
            }
        };

        /**
         * Hide the palettes before update, then deletes everything/sends all to trash.
         * @param {boolean} addStartBlock {if true adds a new start block to new project instance}
         * @param {boolean} doNotSave     {if true discards any changes to project}
         */
        this.sendAllToTrash = (addStartBlock, doNotSave) => {
            // Return to home position after loading new blocks.
            this.blocksContainer.x = 0;
            this.blocksContainer.y = 0;
            for (const name in this.blocks.palettes.dict) {
                this.palettes.dict[name].hideMenu(true);
            }

            hideDOMLabel();
            this.refreshCanvas();

            let actionBlockCounter = 0;
            const dx = 0;
            const dy = this.cellSize * 3;
            for (const blk in this.blocks.blockList) {
                // If this block is at the top of a stack, push it
                // onto the trashStacks list.
                if (this.blocks.blockList[blk].connections[0] === null) {
                    this.blocks.trashStacks.push(blk);
                }

                if (
                    this.blocks.blockList[blk].name === "start" ||
                    this.blocks.blockList[blk].name === "drum"
                ) {
                    const turtle = this.blocks.blockList[blk].value;
                    if (!this.blocks.blockList[blk].trash && turtle !== null) {
                        this.turtles.turtleList[turtle].inTrash = true;
                        this.turtles.turtleList[turtle].container.visible = false;
                    }
                } else if (this.blocks.blockList[blk].name === "action") {
                    if (!this.blocks.blockList[blk].trash) {
                        this.blocks.deleteActionBlock(this.blocks.blockList[blk]);
                        actionBlockCounter += 1;
                    }
                }

                this.blocks.blockList[blk].trash = true;
                this.blocks.moveBlockRelative(blk, dx, dy);
                this.blocks.blockList[blk].hide();
            }

            if (addStartBlock) {
                this.blocks.loadNewBlocks(DATAOBJS);
                this._allClear(false);
            } else if (!doNotSave) {
                // Overwrite session data too.
                this.saveLocally();
            }

            // Wait for palette to clear (#891)
            // We really need to signal when each palette item is deleted
            const that = this;
            setTimeout(() => {
                that.stage.dispatchEvent("trashsignal");
            }, 100 * actionBlockCounter); // 1000

            this.update = true;

            // Close any open widgets.
            closeWidgets();
        };

        /*
         * Toggles block/palette visibility
         */
        const changeBlockVisibility = (activity) => {
            activity._changeBlockVisibility();
            if (docById("helpfulWheelDiv").style.display !== "none") {
                docById("helpfulWheelDiv").style.display = "none";
                activity.__tick();
            }
        };

        this._changeBlockVisibility = () => {
            hideDOMLabel();

            if (this.blocks.visible) {
                this.blocks.hideBlocks();
                this.showBlocksAfterRun = false;
                this.palettes.hide();
                changeImage(
                    this.hideBlocksContainer.children[0],
                    SHOWBLOCKSBUTTON,
                    HIDEBLOCKSFADEDBUTTON
                );
            } else {
                changeImage(
                    this.hideBlocksContainer.children[0],
                    HIDEBLOCKSFADEDBUTTON,
                    SHOWBLOCKSBUTTON
                );
                this.blocks.showBlocks();
                this.palettes.show();
            }
        };

        /*
         * Toggles collapsible stacks (if collapsed stacks expand and vice versa)
         */
        const toggleCollapsibleStacks = (activity) => {
            activity._toggleCollapsibleStacks();
            if (docById("helpfulWheelDiv").style.display !== "none") {
                docById("helpfulWheelDiv").style.display = "none";
                activity.__tick();
            }
        };

        this._toggleCollapsibleStacks = () => {
            hideDOMLabel();

            if (this.blocks.visible) {
                this.blocks.toggleCollapsibles();
            }
        };

        /*
         * When turtle stops running restore stop button to normal state
         */
        this.onStopTurtle = () => {
            // TODO: plugin support
        };

        /*
         * When turtle starts running change stop button to running state
         */
        this.onRunTurtle = () => {
            // TODO: plugin support
        };

        /*
         * Updates all canvas elements
         */
        this.refreshCanvas = () => {
            if (this.blockRefreshCanvas) {
                return;
            }

            this.blockRefreshCanvas = true;

            const that = this;
            setTimeout(() => {
                that.blockRefreshCanvas = false;
            }, 5);

            this.stage.update(event);
            this.update = true;
        };

        /*
         * This set makes it so the stage only re-renders when an
         * event handler indicates a change has happened.
         */
        this.__tick = (event) => {
            if (this.update || createjs.Tween.hasActiveTweens()) {
                this.update = false; // Only update once
                this.stage.update(event);
            }
        };

        /*
         * Opens samples on planet after closing all sub menus.
         */
        const doOpenSamples = (that) => {
            that._doOpenSamples();
        };

        this._doOpenSamples = () => {
            if (docById("palette").style.display !== "none") docById("palette").style.display = "none";
            this.toolbar.closeAuxToolbar(showHideAuxMenu);
            this.planet.openPlanet();
            if (docById("buttoncontainerBOTTOM").style.display !== "none")
                docById("buttoncontainerBOTTOM").style.display = "none";
            if (docById("buttoncontainerTOP").style.display !== "none")
                docById("buttoncontainerTOP").style.display = "none";
        };

        /*
         * Uploads MB file to Planet
         */
        this.doUploadToPlanet = () => {
            this.planet.openPlanet();
        };

        /*
         * Opens piemenu for selecting master key signature
         */
        const chooseKeyMenu = (that) => {
            piemenuKey(that);
            if (docById("helpfulWheelDiv").style.display !== "none") {
                docById("helpfulWheelDiv").style.display = "none";
            }
        };

        /*
         * @param merge {if specified the selected file's blocks merge into current project}
         *  Loads/merges existing MB file
         */
        const doLoad = (that, merge) => {
            that.toolbar.closeAuxToolbar(showHideAuxMenu);
            if (merge === undefined) {
                merge = false;
            }

            if (merge) {
                that.merging = true;
            } else {
                that.merging = false;
            }

            document.querySelector("#myOpenFile").focus();
            document.querySelector("#myOpenFile").click();
            window.scroll(0, 0);
            doHardStopButton(that);
            that._allClear(true);
        };

        window.prepareExport = this.prepareExport;

        /**
         * Runs music blocks project.
         * @param env {specifies environment}
         */
        this.runProject = (env) => {
            document.removeEventListener("finishedLoading", this.runProject);

            const that = this;
            setTimeout(() => {
                that._changeBlockVisibility();
                that._doFastButton(env);
            }, 5000);
        };

  
        const standardDurations = [
            { value: "1/1", duration: 1 },
            { value: "1/2", duration: 0.5 },
            { value: "1/4", duration: 0.25 },
            { value: "1/8", duration: 0.125 },
            { value: "1/16", duration: 0.0625 },
            { value: "1/32", duration: 0.03125 },
            { value: "1/64", duration: 0.015625 },
            { value: "1/128", duration: 0.0078125 }
        ];
        
        this.getClosestStandardNoteValue = function(duration) {
            let closest = standardDurations[0];
            let minDiff = Math.abs(duration - closest.duration);
            
            for (let i = 1; i < standardDurations.length; i++) {
                let diff = Math.abs(duration - standardDurations[i].duration);
                if (diff < minDiff) {
                    closest = standardDurations[i];
                    minDiff = diff;
                }
            }
            
            return closest.value.split('/').map(Number);
        }
        
        this.transcribeMidi = async function(midi) {
            let currentMidi = midi;        
            let jsONON = [] ;
            let actionBlockCounter = 0; // Counter for action blocks
            let actionBlockNames = []; // Array to store action block names
            let totalnoteblockCount = 0; // Initialize noteblock counter
            let noteblockCount = 0;
            let MAX_NOTEBLOCKS = 100;
            let shortestNoteDenominator = 0;
            let offset = 100;
            let stopProcessing = false;
            let trackCount = 0;
            let actionBlockPerTrack = [];
            let instruments = [];
            let defaultTempo=90;
            let currentMidiTempoBpm = currentMidi.header.tempos;
            if (currentMidiTempoBpm && currentMidiTempoBpm.length > 0) {
                currentMidiTempoBpm = Math.round(currentMidiTempoBpm[0].bpm);
            } else {
                currentMidiTempoBpm = defaultTempo;
            }
            
            let defaultTimeSignature = [4, 4];
            let currentMidiTimeSignature = currentMidi.header.timeSignatures;
            if (currentMidiTimeSignature && currentMidiTimeSignature.length > 0) {
                currentMidiTimeSignature = currentMidiTimeSignature[0].timeSignature;
            } else {
                currentMidiTimeSignature = defaultTimeSignature;
            }
            
            let precurssionFlag = false;
            const isPercussion=[];
            // console.log("tempoBpm is: ", currentMidiTempoBpm);
            // console.log("tempo is : ",currentMidi.header.tempos);
            // console.log("time signatures are: ", currentMidi.header.timeSignatures);
            currentMidi.tracks.forEach((track, trackIndex) => {
                let k = 0;
                if (stopProcessing) return; // Exit if flag is set
                let isPercussionTrack =(track.instrument.percussion && (track.channel===9 || track.channel===10))
                isPercussion.push(isPercussionTrack);
                if (!track.notes.length) return;
                let r = jsONON.length; 
                // console.log("notes: ",track.notes);
                if(track.instrument.percussion && (track.channel==9 || track.channel==10) && precurssionFlag==false){
                    jsONON.push(
                       [0,"mapdrum",1120,-296,[194,1,3,2]],
                       [1,["drumname",{"value":"bass drum"}],1297,-296,[0]],
                       [2,"hidden",1120,-170,[0,195]],
                       [3,"pitch",1134,-264,[0,4,5,null]],
                       [4,["notename",{"value":"B"}],1208,-264,[3]],
                       [5,["number",{"value":1}],1208,-232,[3]],
                       [6,"mapdrum",1120,397,[86,7,14,11]],
                       [7,["drumname",{"value":"tom tom"}],1297,397,[6]],
                       [8,"pitch",1134,681,[12,9,10,180]],
                       [9,["notename",{"value":"F"}],1208,681,[8]],
                       [10,["number",{"value":2}],1208,713,[8]],
                       [11,"hidden",1120,649,[6,12]],
                       [12,"mapdrum",1120,649,[11,13,8,17]],
                       [13,["drumname",{"value":"floor tom"}],1297,649,[12]],
                       [14,"pitch",1134,429,[6,15,16,174]],
                       [15,["notename",{"value":"B"}],1208,429,[14]],
                       [16,["number",{"value":2}],1208,461,[14]],
                       [17,"hidden",1120,901,[12,42]],
                       [18,"mapdrum",1120,-44,[197,19,20,23]],
                       [19,["drumname",{"value":"cup drum"}],1297,-44,[18]],
                       [20,"pitch",1134,-12,[18,21,22,null]],
                       [21,["notename",{"value":"C♯"}],1208,-12,[20]],
                       [22,["number",{"value":2}],1208,20,[20]],
                       [23,"hidden",1120,82,[18,63]],
                       [24,"mapdrum",1120,2665,[77,25,26,29]],
                       [25,["drumname",{"value":"clang"}],1297,2665,[24]],
                       [26,"pitch",1134,2697,[24,27,28,null]],
                       [27,["notename",{"value":"A♯"}],1208,2697,[26]],
                       [28,["number",{"value":4}],1208,2729,[26]],
                       [29,"hidden",1120,2791,[24,93]],
                       [30,"mapdrum",1120,1657,[41,31,32,35]],
                       [31,["drumname",{"value":"cow bell"}],1297,1657,[30]],
                       [32,"pitch",1134,1689,[30,33,34,null]],
                       [33,["notename",{"value":"G♯"}],1208,1689,[32]],
                       [34,["number",{"value":3}],1208,1721,[32]],
                       [35,"hidden",1120,1783,[30,105]],
                       [36,"mapdrum",1120,1531,[92,37,38,41]],
                       [37,["drumname",{"value":"ride bell"}],1297,1531,[36]],
                       [38,"pitch",1134,1563,[36,39,40,null]],
                       [39,["notename",{"value":"F"}],1208,1563,[38]],
                       [40,["number",{"value":3}],1208,1595,[38]],
                       [41,"hidden",1120,1657,[36,30]],
                       [42,"mapdrum",1120,901,[17,43,44,47]],
                       [43,["drumname",{"value":"hi hat"}],1297,901,[42]],
                       [44,"pitch",1134,933,[42,45,46,168]],
                       [45,["notename",{"value":"F♯"}],1208,933,[44]],
                       [46,["number",{"value":2}],1208,965,[44]],
                       [47,"hidden",1120,1153,[42,87]],
                       [48,"mapdrum",1120,2224,[59,49,150,53]],
                       [49,["drumname",{"value":"japanese drum"}],1297,2224,[48]],
                       [50,"pitch",1134,1941,[54,51,52,156]],
                       [51,["notename",{"value":"C"}],1208,1941,[50]],
                       [52,["number",{"value":4}],1208,1973,[50]],
                       [53,"hidden",1120,2476,[48,72]],
                       [54,"mapdrum",1120,1909,[110,55,50,59]],
                       [55,["drumname",{"value":"darbuka drum"}],1297,1909,[54]],
                       [56,"pitch",1134,2067,[156,57,58,147]],
                       [57,["notename",{"value":"D♯"}],1208,2067,[56]],
                       [58,["number",{"value":4}],1208,2099,[56]],
                       [59,"hidden",1120,2224,[54,48]],
                       [60,"mapdrum",1120,2980,[98,61,141,62]],
                       [61,["drumname",{"value":"cup drum"}],1297,2980,[60]],
                       [62,"hidden",1120,3106,[60,78]],
                       [63,"mapdrum",1120,82,[23,64,65,68]],
                       [64,["drumname",{"value":"snare drum"}],1297,82,[63]],
                       [65,"pitch",1134,114,[63,66,67,183]],
                       [66,["notename",{"value":"D"}],1208,114,[65]],
                       [67,["number",{"value":2}],1208,146,[65]],
                       [68,"hidden",1120,271,[63,81]],
                       [69,"pitch",1134,-138,[195,70,71,null]],
                       [70,["notename",{"value":"C"}],1208,-138,[69]],
                       [71,["number",{"value":2}],1208,-106,[69]],
                       [72,"mapdrum",1120,2476,[53,73,129,77]],
                       [73,["drumname",{"value":"raindrop"}],1297,2476,[72]],
                       [74,"pitch",1134,2571,[129,75,76,null]],
                       [75,["notename",{"value":"A"}],1208,2571,[74]],
                       [76,["number",{"value":4}],1208,2603,[74]],
                       [77,"hidden",1120,2665,[72,24]],
                       [78,"mapdrum",1120,3106,[62,79,138,80]],
                       [79,["drumname",{"value":"slap"}],1297,3106,[78]],
                       [80,"hidden",1120,3295,[78,99]],
                       [81,"mapdrum",1120,271,[68,82,83,86]],
                       [82,["drumname",{"value":"clap"}],1297,271,[81]],
                       [83,"pitch",1134,303,[81,84,85,null]],
                       [84,["notename",{"value":"D♯"}],1208,303,[83]],
                       [85,["number",{"value":2}],1208,335,[83]],
                       [86,"hidden",1120,397,[81,6]],
                       [87,"mapdrum",1120,1153,[47,88,89,92]],
                       [88,["drumname",{"value":"crash"}],1297,1153,[87]],
                       [89,"pitch",1134,1185,[87,90,91,159]],
                       [90,["notename",{"value":"C♯"}],1208,1185,[89]],
                       [91,["number",{"value":3}],1208,1217,[89]],
                       [92,"hidden",1120,1531,[87,36]],
                       [93,"mapdrum",1120,2791,[29,94,95,98]],
                       [94,["drumname",{"value":"gong"}],1297,2791,[93]],
                       [95,"pitch",1134,2823,[93,96,97,117]],
                       [96,["notename",{"value":"B"}],1208,2823,[95]],
                       [97,["number",{"value":4}],1208,2855,[95]],
                       [98,"hidden",1120,2980,[93,60]],
                       [99,"mapdrum",1120,3295,[80,100,189,104]],
                       [100,["drumname",{"value":"chime"}],1297,3295,[99]],
                       [101,"pitch",1134,3453,[186,102,103,132]],
                       [102,["notename",{"value":"F♯"}],1208,3453,[101]],
                       [103,["number",{"value":5}],1208,3485,[101]],
                       [104,"hidden",1120,3610,[99,111]],
                       [105,"mapdrum",1120,1783,[35,106,107,110]],
                       [106,["drumname",{"value":"finger cymbals"}],1297,1783,[105]],
                       [107,"pitch",1134,1815,[105,108,109,null]],
                       [108,["notename",{"value":"E"}],1208,1815,[107]],
                       [109,["number",{"value":3}],1208,1847,[107]],
                       [110,"hidden",1120,1909,[105,54]],[111,"mapdrum",1120,3610,[104,112,113,116]],
                       [112,["drumname",{"value":"triangle bell"}],1297,3610,[111]],
                       [113,"pitch",1134,3642,[111,114,115,162]],
                       [114,["notename",{"value":"A"}],1208,3642,[113]],
                       [115,["number",{"value":5}],1208,3674,[113]],
                       [116,"hidden",1120,3799,[111,null]],
                       [117,"pitch",1134,2886,[95,118,119,null]],
                       [118,["notename",{"value":"C"}],1208,2886,[117]],
                       [119,["number",{"value":5}],1208,2918,[117]],
                       [120,"pitch",1134,1374,[126,121,122,123]],
                       [121,["notename",{"value":"A"}],1208,1374,[120]],
                       [122,["number",{"value":3}],1208,1406,[120]],
                       [123,"pitch",1134,1437,[120,124,125,null]],
                       [124,["notename",{"value":"B"}],1208,1437,[123]],
                       [125,["number",{"value":3}],1208,1469,[123]],
                       [126,"pitch",1134,1311,[159,127,128,120]],
                       [127,["notename",{"value":"G"}],1208,1311,[126]],
                       [128,["number",{"value":3}],1208,1343,[126]],
                       [129,"pitch",1134,2508,[72,130,131,74]],
                       [130,["notename",{"value":"G"}],1208,2508,[129]],
                       [131,["number",{"value":4}],1208,2540,[129]],
                       [132,"pitch",1134,3516,[101,133,134,null]],
                       [133,["notename",{"value":"G"}],1208,3516,[132]],
                       [134,["number",{"value":5}],1208,3548,[132]],
                       [135,"pitch",1134,3201,[138,136,137,null]],
                       [136,["notename",{"value":"F"}],1208,3201,[135]],
                       [137,["number",{"value":5}],1208,3233,[135]],
                       [138,"pitch",1134,3138,[78,139,140,135]],
                       [139,["notename",{"value":"E"}],1208,3138,[138]],
                       [140,["number",{"value":5}],1208,3170,[138]],
                       [141,"pitch",1134,3012,[60,142,143,null]],
                       [142,["notename",{"value":"C♯"}],1208,3012,
                       [141]],[143,["number",{"value":5}],1208,3044,[141]],
                       [144,"pitch",1134,2319,[150,145,146,153]],
                       [145,["notename",{"value":"F♯"}],1208,2319,[144]],
                       [146,["number",{"value":4}],1208,2351,[144]],
                       [147,"pitch",1134,2130,[56,148,149,null]],
                       [148,["notename",{"value":"F"}],1208,2130,[147]],
                       [149,["number",{"value":4}],1208,2162,[147]],
                       [150,"pitch",1134,2256,[48,151,152,144]],
                       [151,["notename",{"value":"E"}],1208,2256,[150]],
                       [152,["number",{"value":4}],1208,2288,[150]],
                       [153,"pitch",1134,2382,[144,154,155,null]],
                       [154,["notename",{"value":"G♯"}],1208,2382,[153]],
                       [155,["number",{"value":4}],1208,2414,[153]],
                       [156,"pitch",1134,2004,[50,157,158,56]],
                       [157,["notename",{"value":"D"}],1208,2004,[156]],
                       [158,["number",{"value":4}],1208,2036,[156]],
                       [159,"pitch",1134,1248,[89,160,161,126]],
                       [160,["notename",{"value":"D♯"}],1208,1248,[159]],
                       [161,["number",{"value":3}],1208,1280,[159]],
                       [162,"pitch",1134,3705,[113,163,164,null]],
                       [163,["notename",{"value":"G♯"}],1208,3705,[162]],
                       [164,["number",{"value":5}],1208,3737,[162]],
                       [165,"pitch",1134,1059,[168,166,167,null]],
                       [166,["notename",{"value":"A♯"}],1208,1059,[165]],
                       [167,["number",{"value":2}],1208,1091,[165]],
                       [168,"pitch",1134,996,[44,169,170,165]],
                       [169,["notename",{"value":"G♯"}],1208,996,[168]],
                       [170,["number",{"value":2}],1208,1028,[168]],
                       [171,"pitch",1134,555,[174,172,173,null]],
                       [172,["notename",{"value":"D"}],1208,555,[171]],
                       [173,["number",{"value":3}],1208,587,[171]],
                       [174,"pitch",1134,492,[14,175,176,171]],
                       [175,["notename",{"value":"C"}],1208,492,[174]],
                       [176,["number",{"value":3}],1208,524,[174]],
                       [177,"pitch",1134,807,[180,178,179,null]],
                       [178,["notename",{"value":"A"}],1208,807,[177]],
                       [179,["number",{"value":2}],1208,839,[177]],
                       [180,"pitch",1134,744,[8,181,182,177]],
                       [181,["notename",{"value":"G"}],1208,744,[180]],
                       [182,["number",{"value":2}],1208,776,[180]],
                       [183,"pitch",1134,177,[65,184,185,null]],
                       [184,["notename",{"value":"E"}],1208,177,[183]],
                       [185,["number",{"value":2}],1208,209,[183]],
                       [186,"pitch",1134,3390,[189,187,188,101]],
                       [187,["notename",{"value":"A♯"}],1208,3390,[186]],
                       [188,["number",{"value":3}],1208,3422,[186]],
                       [189,"pitch",1134,3327,[99,190,191,186]],
                       [190,["notename",{"value":"F♯"}],1208,3327,[189]],
                       [191,["number",{"value":3}],1208,3359,[189]],
                       [192,["action",{"collapsed":false}],1106,-337, [null,193,194,null]],
                       [193,["text",{"value":"MIDI-conversion"}],1238,-328,[192]],
                       [194,"hidden",1120,-296,[192,0]],
                       [195,"mapdrum",1120,-170,[2,196,69,197]],
                       [196,["drumname",{"value":"kick drum"}],1297,-170,[195]],
                       [197,"hidden",1120,-44,[195,18]],
                    )
                    precurssionFlag=true;
                    r+=198;
                }
                // find matching instrument
                let instrument = "electronic synth";
                if (track.instrument.name) {
                    for (let voices of VOICENAMES) {
                        if (track.instrument.name.indexOf(voices[1]) > -1) {
                            instrument = voices[0];
                        }
                    }
                }
                actionBlockPerTrack[trackCount] = 0;
                instruments[trackCount] = instrument;
        
                let actionBlockName = `track${trackCount}chunk${actionBlockCounter}`;
        
                jsONON.push(
                    [r, ["action", { collapsed: false }], 150, 100, [null, r+1, r+2, null]],
                    [r+1, ["text", { value: actionBlockName }], 0, 0, [r]]
                );

                let sched = [];
                for (let noteIndex in track.notes) {
                    let note = track.notes[noteIndex];
                    let name = note.name;
                    let first = sched.length == 0;
                    let start =Math.round(note.time*100)/100;
                    let end = Math.round((note.duration + note.time)*100)/100;
                    if (note.duration == 0) continue;
                    if (first) {
                        if (note.time > 0) {
                            sched.push({
                                start: 0,
                                end: start,
                                notes: ["R"]
                            });
                        }
                        sched.push({
                            start: start,
                            end: end,
                            notes: [name]
                        });
                        continue;
                    }
                    let lastNotes=[];
                    let lastNote = sched[sched.length - 1];
                    // let secondLastNote = sched.length > 1 ? sched[sched.length - 2] : null;
                
                    if (sched[sched.length - 1].start === start && sched[sched.length - 1].end === end) {
                        sched[sched.length - 1].notes.push(name);
                    }
                    else if (lastNote.start > start) {
                        while(lastNote.start >= start){
                        lastNotes.push(sched[sched.length-1]);
                        sched.pop();
                        lastNote = sched[sched.length - 1];
                        }
                        lastNote = sched[sched.length - 1];
                        // let secondLastNote = sched.length > 1 ? sched[sched.length - 2] : null;
                        if (lastNote) {
                            let oldEnd2 = lastNote.end;
                            let prevNotes2 = [...lastNote.notes];
                            let newNotes2 = [...prevNotes2];
                            newNotes2.push(name);
                            lastNote.end = start;
                
                            if (start < oldEnd2) {
                                sched.push({
                                    start: start,
                                    end: oldEnd2,
                                    notes: newNotes2
                                });
                            }
                        }
                        while (lastNotes.length>0) {
                            let prevNotes = [...lastNotes[lastNotes.length-1].notes];
                            let oldEnd = lastNotes[lastNotes.length-1].end;
                            let oldStart = lastNotes[lastNotes.length-1].start;
                            let newNotes = [...prevNotes];
                            newNotes.push(name);
                
                            if (lastNotes[lastNotes.length-1].end <= end) {
                                sched.push(
                                    {
                                        start: oldStart,
                                        end: oldEnd,
                                        notes: newNotes
                                    }
                                );
                                if (end > oldEnd && lastNotes.length==1) {
                                    sched.push(
                                        {
                                            start: oldEnd,
                                            end: end,
                                            notes: [name]
                                        }
                                    );
                                }
                                lastNotes.pop();
                            } else if (lastNotes[lastNotes.length-1].end > end) {
                                sched.push(
                                    {
                                        start: oldStart,
                                        end: end,
                                        notes: newNotes
                                    }
                                );
                                if (oldEnd > end && lastNotes.length==1) {
                                    sched.push(
                                        {
                                            start: end,
                                            end: oldEnd,
                                            notes: prevNotes
                                        }
                                    );
                                }
                                lastNotes.pop();
                            }
                        }
                    } else if ( lastNote.start < start && lastNote.end > start && lastNote.end >= end) {
                        let prevNotes = [...lastNote.notes];
                        let oldEnd = lastNote.end;
                        lastNote.end = start;
                        let newNotes = [...prevNotes];
                        newNotes.push(name);
                        sched.push(
                            {
                                start: start,
                                end: end,
                                notes: newNotes
                            }
                        );
                        if (oldEnd > end) {
                            sched.push(
                                {
                                    start: end,
                                    end: oldEnd,
                                    notes: prevNotes
                                }
                            );
                        }
                    } else if (lastNote.start < start  && lastNote.end > start && lastNote.end <= end) {
                        let prevNotes = [...lastNote.notes];
                        let oldEnd = lastNote.end;
                        sched[sched.length - 1].end = start;
                        let newNotes = [...prevNotes];
                        newNotes.push(name);
                        if (start < oldEnd) {
                            sched.push(
                                {
                                    start: start,
                                    end: oldEnd,
                                    notes: newNotes
                                }
                            );
                        }
                        if (end > oldEnd) {
                            sched.push(
                                {
                                    start: oldEnd,
                                    end: end,
                                    notes: [name]
                                }
                            );
                        }
                    } else if (lastNote.end <= start) {
                        if (start > lastNote.end) {
                            let integerPart = Math.floor(start - lastNote.end);
                            for (let c = 0; c < integerPart; c += 2) {
                                sched.push(
                                    {
                                        start: lastNote.end,
                                        end: lastNote.end + 2,
                                        notes: ["R"]
                                    }
                                );
                                lastNote.end += 2;
                            }
                        }
                        sched.push(
                            {
                                start: start,
                                end: end,
                                notes: [name]
                            }
                        );
                    }
                }

                let noteSum = 0;
                let currentActionBlock = [];
        
                let addNewActionBlock = (isLastBlock=false) => {
                    let r = jsONON.length;
                    let actionBlockName = `track${trackCount}chunk${actionBlockCounter}`;
                    actionBlockNames.push(actionBlockName);
                    actionBlockPerTrack[trackCount]++;
                    if (k == 0) {
                        jsONON.push(
                            ...currentActionBlock
                        );
                        k = 1;
                    } else {
                        let settimbreIndex = r;
                        // Adjust the first note block's top connection to settimbre
                        currentActionBlock[0][4][0] = settimbreIndex;
                        jsONON.push(
                            [r, ["action", { collapsed: false }], 100+offset, 100+offset, [null, r+1, settimbreIndex+2, null]],
                            [r+1, ["text", { value: actionBlockName }], 0, 0, [r]],
                            ...currentActionBlock
                        );
                        
                    }
                    if (isLastBlock) {
                        let lastIndex = jsONON.length - 1;
                        // Set the last hidden block's second value to null
                        jsONON[lastIndex][4][1] = null;
                    }
            
                    currentActionBlock = [];
                    actionBlockCounter++; // Increment the action block counter
                    offset+=100;
                };
                //Using for loop for finding the shortest note value
                for (let j in sched) {
                    let st = sched[j].start;
                    let ed= sched[j].end;
                    let dur = ed - st;
                    let temp = this.getClosestStandardNoteValue(dur * 3 / 8);
                    shortestNoteDenominator=Math.max(shortestNoteDenominator,temp[1]);
                }
        
                for (let i in sched) {
                    if (stopProcessing) break; // Exit inner loop if flag is set
                    let notes = sched[i].notes;
                    let start = sched[i].start;
                    let end = sched[i].end;
                    let duration = end - start;
                    noteSum += duration;
                    let isLastNoteInBlock = (noteSum >= 16) || (noteblockCount > 0 && noteblockCount % 24 === 0);
                    if (isLastNoteInBlock) {
                        totalnoteblockCount+=noteblockCount;
                        noteblockCount = 0;
                        noteSum = 0;
                    }
                    let isLastNoteInSched = (i == sched.length - 1);
                    let last = isLastNoteInBlock || isLastNoteInSched;
                    let first = (i == 0);
                    let val = jsONON.length + currentActionBlock.length;
                    let getPitch = (x, notes, prev) => {
                        let ar = [];
                        if (notes[0] == "R") {
                            ar.push(
                                [x, "rest2", 0, 0, [prev, null]]
                            );
                        } else {
                            for (let na in notes) {
                                let name = notes[na];
                                let first = na == 0;
                                let last = na == notes.length - 1;
                                ar.push(
                                    [x, "pitch", 0, 0, [first ? prev : x-3, x+1, x+2, last ? null : x+3]],
                                    [x+1, ["notename", {"value": name.substring(0, name.length-1)}], 0, 0, [x]],
                                    [x+2, ["number", {"value": parseInt(name[name.length-1])}], 0, 0, [x]]
                                );
                                x += 3;
                            }
                        }
                        return ar;
                    };
                    let obj = this.getClosestStandardNoteValue(duration * 3 / 8);
                    // let scalingFactor=1;
                    // if(shortestNoteDenominator>32)
                    // scalingFactor=shortestNoteDenominator/32;

                    // if(obj[1]>=scalingFactor)
                    // obj[1]=obj[1]/scalingFactor;
                    // else
                    // obj[0]=obj[0]*scalingFactor;
                    
                    // To get the reduced fraction for 4/2 to 2/1
                    obj=this.getClosestStandardNoteValue(obj[0]/obj[1]);
                
                    // Since we are going to add action block in the front later
                    if (k != 0) val = val + 2;
                    let pitches = getPitch(val + 5, notes, val);
                    currentActionBlock.push(
                        [val, ["newnote", {"collapsed": true}], 0, 0, [first ? val-2 : val-1, val+1, val+4, val+pitches.length+5]], 
                        [val + 1, "divide", 0, 0, [val, val+2, val+3]], 
                        [val + 2, ["number", { value: obj[0] }], 0, 0, [val + 1]], 
                        [val + 3, ["number", { value: obj[1] }], 0, 0, [val + 1]],
                        [val + 4, "vspace", 0, 0, [val, val + 5]],
                    );
                    noteblockCount++;
                    pitches[0][4][0] = val + 4;
                    currentActionBlock = currentActionBlock.concat(pitches);
        
                    let newLen = jsONON.length + currentActionBlock.length;
                    if (k != 0) newLen = newLen + 2;
                    currentActionBlock.push(
                        [newLen, "hidden", 0, 0, [val, last ? null : newLen + 1]]
                    );
                    if (isLastNoteInBlock || isLastNoteInSched ) {
                        addNewActionBlock(isLastNoteInSched);
                    }
        
                    if (totalnoteblockCount >= MAX_NOTEBLOCKS) {
                        this.textMsg("MIDI file is too large.. Generating only 100 noteblocks");
                        stopProcessing = true;
                        break;
                    }
                }
        
                if (currentActionBlock.length > 0) {
                    addNewActionBlock(true);  
                }
        
                trackCount++;
                // console.log("current action block: ", currentActionBlock);
                // console.log("current json: ", jsONON);
                // console.log("noteblockCount: ", noteblockCount);
                // console.debug('finished when you see: "block loading finished "');
                document.body.style.cursor = "wait";
            });
        
            let len = jsONON.length;
            let m = 0;
            let actionIndex = 0;
            
            for (let i = 0; i < trackCount; i++) {
                 let vspaceIndex=len+m+6;
                 let startIndex=len+m;
                 let flag=true;
                if(isPercussion[i])
                {
                    jsONON.push(
                        [len + m, ["start", { collapsed: false }], 300 + offset, 100, [null, len + m + 14+actionBlockPerTrack[i], null]],
                        [len + m +1,"meter",0,0,[len + m +14 + actionBlockPerTrack[i],len + m +2,len + m +3,len + m + 6]],
                        [len + m + 2, ["number",{value: currentMidiTimeSignature[0]}],0,0,[len+m+1]],
                        [len + m + 3,"divide",0,0,[len + m +1,len + m + 4,len + m + 5]],
                        [len + m + 4,["number", {value : 1}],0,0,[len+m+3]],
                        [len + m + 5,["number", {value : currentMidiTimeSignature[1]}],0,0,[len+m+3]],
                        [len + m + 6,"vspace",0,0,[len + m + 1,len + m + 8 + actionBlockPerTrack[i]]],
                        [len + m + 7, ["nameddo", { value: "MIDI-conversion" }], 0, 0, [len + m +13 +actionBlockPerTrack[i], len + m + 8]],
                    );
                    flag=false;
                    m+=8;
                }
                else{
                jsONON.push(
                    [len + m, ["start", { collapsed: false }], 300 + offset, 100, [null, len + m+16+actionBlockPerTrack[i], null]],
                    [len + m +1,"meter",0,0,[len + m+16+actionBlockPerTrack[i],len + m +2,len + m +3,len + m + 6]],
                    [len + m + 2, ["number",{value: currentMidiTimeSignature[0]}],0,0,[len+m+1]],
                    [len + m + 3,"divide",0,0,[len + m +1,len + m + 4,len + m + 5]],
                    [len + m + 4,["number", {value : 1}],0,0,[len+m+3]],
                    [len + m + 5,["number", {value : currentMidiTimeSignature[1]}],0,0,[len+m+3]],
                    [len + m + 6,"vspace",0,0,[len + m + 1,len + m + 10 + actionBlockPerTrack[i]]],
                    [len + m + 7, "settimbre", 0, 0, [len + m +15 +actionBlockPerTrack[i], len + m + 8, len + m + 10, len + m + 9]],
                    [len + m + 8, ["voicename", { value: instruments[i] }], 0, 0, [len + m + 7]],
                    [len + m + 9, "hidden", 0, 0, [len + m + 7, null]]
                );
                m += 10;
                }
                for (let j = 0; j < actionBlockPerTrack[i]; j++) {
                    jsONON.push(
                        [len + m, ["nameddo", { value: actionBlockNames[actionIndex] }], 0, 0, [flag?len+m-3:len + m - 1, len + m + 1]]
                    );
                    m++;
                    flag=false;
                    actionIndex++;
                }
                jsONON[len + m - 1][4][1] = null;
                let setBpmIndex=jsONON.length;
                jsONON.push(
                    [setBpmIndex, ["setbpm3"], 0, 0, [vspaceIndex, setBpmIndex + 1, setBpmIndex + 2, setBpmIndex + 5]],
                    [setBpmIndex + 1, ["number", { value: currentMidiTempoBpm}], 0, 0, [setBpmIndex]],
                    [setBpmIndex + 2, "divide", 0, 0, [setBpmIndex, setBpmIndex + 3, setBpmIndex + 4]],
                    [setBpmIndex + 3, ["number", { value: 1 }], 0, 0, [setBpmIndex + 2]],
                    [setBpmIndex + 4, ["number", { value: currentMidiTimeSignature[1] }], 0, 0, [setBpmIndex + 2]],
                    [setBpmIndex + 5, "vspace", 0, 0, [setBpmIndex, vspaceIndex + 1]],
                );
                m+=6;
                jsONON.push(
                    [len + m, "setturtlename2", 0, 0, [startIndex, len + m + 1,startIndex+1]],
                    [len + m + 1, ["text", { value: `track${i}` }], 0, 0, [len + m]]
                );
                m+=2;

            }
            
            this.blocks.loadNewBlocks(jsONON);
            // this.textMsg("MIDI import is not currently precise. Consider changing the speed with the Beats Per Minute block or modifying note value with the Multiply Note Value block");
            return null;
        };
        
        /**
         * Loads MB project from Planet.
         * @param  projectID {Planet project ID}
         * @param  flags     {parameteres}
         * @param  env       {specifies environment}
         */
        const loadProject = (activity, projectID, flags, env) => {
            activity._loadProject(projectID, flags, env);
        };

        const loadStart = async (that) => {
            const __afterLoad = async () => {
                if (!that.turtles.running()) {
                    that.stage.update(event);
                    for (let turtle = 0; turtle < that.turtles.turtleList.length; turtle++) {
                        that.logo.turtleHeaps[turtle] = [];
                        that.logo.turtleDicts[turtle] = {};
                        that.logo.notation.notationStaging[turtle] = [];
                        that.logo.notation.notationDrumStaging[turtle] = [];
                        that.turtles.turtleList[turtle].painter.doClear(true, true, false);
                    }
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        const imgUrl =
                              "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+IDxzdmcgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgaWQ9InN2ZzExMjEiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDM0LjEzMTI0OSAxNC41NTIwODkiIGhlaWdodD0iNTUuMDAwMDE5IiB3aWR0aD0iMTI5Ij4gPGRlZnMgaWQ9ImRlZnMxMTE1Ij4gPGNsaXBQYXRoIGlkPSJjbGlwUGF0aDQzMzciIGNsaXBQYXRoVW5pdHM9InVzZXJTcGFjZU9uVXNlIj4gPHJlY3QgeT0iNTUyIiB4PSI1ODgiIGhlaWdodD0iMTQzNiIgd2lkdGg9IjE5MDAiIGlkPSJyZWN0NDMzOSIgc3R5bGU9ImZpbGw6I2EzYjVjNDtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MTU7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDwvY2xpcFBhdGg+IDwvZGVmcz4gPG1ldGFkYXRhIGlkPSJtZXRhZGF0YTExMTgiPiA8cmRmOlJERj4gPGNjOldvcmsgcmRmOmFib3V0PSIiPiA8ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD4gPGRjOnR5cGUgcmRmOnJlc291cmNlPSJodHRwOi8vcHVybC5vcmcvZGMvZGNtaXR5cGUvU3RpbGxJbWFnZSIgLz4gPGRjOnRpdGxlPjwvZGM6dGl0bGU+IDwvY2M6V29yaz4gPC9yZGY6UkRGPiA8L21ldGFkYXRhPiA8ZyB0cmFuc2Zvcm09Im1hdHJpeCgxLjA4Njc4MiwwLDAsMS4wODY3ODIsLTEuNTQ3MzI0NSwtMS4zMDU3OTkpIiBpZD0iZzE4MTIiPiA8ZWxsaXBzZSB0cmFuc2Zvcm09Im1hdHJpeCgwLjAxMDQ2MDk5LDAsMCwwLjAxMDQ2MDk5LDEuMDE2NzM4OSwtNi4yMDQ4NTI5KSIgY2xpcC1wYXRoPSJ1cmwoI2NsaXBQYXRoNDMzNykiIHJ5PSI3NjgiIHJ4PSI3NDgiIGN5PSIxNDc2IiBjeD0iMTU0MCIgaWQ9InBhdGg0MzMzIiBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDojYTNiNWM0O2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDoxNTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIgLz4gPGVsbGlwc2Ugcnk9IjEuNzgyNjg1OSIgcng9IjEuNjkzOTIxNiIgY3k9IjguODM0MzUzNCIgY3g9IjE2LjQ0NjczOSIgaWQ9InBhdGg0MjU2IiBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDojYzlkYWQ4O2ZpbGwtb3BhY2l0eToxO3N0cm9rZTojYzlkYWQ4O3N0cm9rZS13aWR0aDowLjEwNDYwOTk7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDxwYXRoIGlkPSJwYXRoNDMyOCIgZD0ibSAxNy42MzAyNjYsMTMuNDg3MDkgMC4zMjU0NywwLjM5MjA0NCAwLjM0NzY2LDAuMjczNjkgMC4zMTA2NzYsMC4xMTA5NTUgMC4yMzY3MDUsLTAuMDUxNzggMC4xNDA1NDQsLTAuMTg0OTI2IDAuMTk5NzIsMC4wODEzNyAwLjE1NTMzOCwwLjA0NDM4IDAuNjEzOTU0LC0wLjQyMTYzMiAwLjQyMTYzMSwtMC4yNTE0OTkgYyAwLDAgMC44ODc2NDUsLTAuMDA3NCAxLjYwNTE1NywtMC41NTQ3NzcgMC43MTc1MTMsLTAuNTQ3MzgxIDAuNDk1NjAyLC0wLjY1MDkzOSAwLjQ5NTYwMiwtMC42NTA5MzkgbCAtMC4wMzY5OSwtMC40MjkwMjkgLTAuNTM5OTg0LC0wLjcxNzUxMyAtMC41NTQ3NzcsLTAuNTY5NTcxIC0wLjIyOTMwOSwtMC4xNDc5NDEgYyAwLDAgLTAuMDIyMTksLTAuMDQ0MzggLTAuMDczOTcsLTAuMDQ0MzggLTAuMDUxNzgsMCAtMC4yNDQxMDMsLTAuMDczOTcgLTAuNTE3NzkzLDAuMDQ0MzggLTAuMjczNjkxLDAuMTE4MzUzIC0wLjQ2NjAxNCwwLjE3MDEzMiAtMC44NDMyNjMsMC4zODQ2NDYgLTAuMzc3MjQ4LDAuMjE0NTE0IC0wLjcxMDExNSwwLjQyMTYzMSAtMC44MzU4NjUsMC40OTU2MDIgLTAuMTI1NzUsMC4wNzM5NyAtMC43NDcxLDAuNDI5MDI4IC0wLjc0NzEsMC40MjkwMjggbCAtMC4wOTYxNiwwLjY1ODMzNiB6IiBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDojZjhmOGY4O2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpldmVub2RkO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDowLjAxMDQ2MDk5cHg7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46bWl0ZXI7c3Ryb2tlLW9wYWNpdHk6MSIgLz4gPHBhdGggaWQ9InBhdGg0MzMwIiBkPSJtIDE4LjA4MTQ4NSwxMy4xMTcyMzkgYyAwLDAgMS4wMTcyMDIsMC4yMTk4MDggMS40OTA2MTMsLTAuMTM1MjUgMC42ODI1NSwtMC42NzQwOTcgMS42NTU4OTMsLTEuMTU0NzMxIDEuODcwMzU1LC0xLjc0NTMwOCAwLjEwODI1NywtMC4yOTgxMTYgMC4wOTI2NSwtMC4zNzIzNzcgLTAuMDgwMTgsLTAuNjM3MTkxIC0wLjc4NDA4NSwtMS4xMTY5NTIzIC0yLjE4NjAyMywwLjQ4MzU2MyAtMi4xODYwMjMsMC40ODM1NjMgbCAtMS4yMjA1MTEsMS4wNDI5ODMgeiIgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6I2M5ZGFkODtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4wMTA0NjA5OXB4O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDxwYXRoIGlkPSJwYXRoNDI4MSIgZD0ibSAxOC45MjM2MzgsMTEuOTExMTY2IGMgMCwwIC0yLjI2MjA3MywwLjM2MDA3MyAtMS4yNDU4MDcsMS42MzE0MjYgMS4wMTYyNjgsMS4yNzEzNTQgMS4zMzE1OSwwLjQ2ODQxNSAxLjMzMTU5LDAuNDY4NDE1IDAsMCAwLjIzNzM2NCwwLjI4NDAyMSAwLjU1MDIyMSwtMC4wMTI4OSAwLjMxMjg1NywtMC4yOTY5MSAwLjgwMTY1NywtMC40ODY1NjMgMC44MDE2NTcsLTAuNDg2NTYzIDAsMCAwLjgzMzQxOSwtMC4wODE1OCAxLjcyODg1MSwtMC42NDAzNDUgMC44OTU0MzIsLTAuNTU4NzY5IDAuMDI1NDUsLTEuNDk0NjQ0IDAuMDI1NDUsLTEuNDk0NjQ0IDAsMCAtMC43MDQwMDIsLTAuOTE0MzA1IC0xLjE5MTE1OCwtMS4wNjIwMDQgLTAuNDg3MTU1LC0wLjE0NzY5OSAtMS4yNjAyMDYsLTAuMjA1OTYzIC0xLjI2MDIwNiwtMC4yMDU5NjMgeiIgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6bm9uZTtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6IzUwNTA1MDtzdHJva2Utd2lkdGg6MC4xMDQ2MDk5O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDxwYXRoIGlkPSJwYXRoNTkyNiIgZD0ibSAxNi44ODkxNjUsMy45OTA3MDY3IGMgLTAuMjA1OTI1LDAuMDA5MDIgLTAuNDkwNTg0LDAuMDE2NDUyIC0wLjY4MjQzNCwwLjA5NDMwNiAtMC4zNjM1MSwwLjExMzE2MjUgLTAuNzg0MDE5LDAuMzA2NTkxNiAtMS4xMDIwMzksMC40MTQ1MTk3IEMgMTQuODA1NzA3LDQuNjAwOTk5MyAxNC41MjgzODMsNC44Njc1ODQxIDE0LjQ0MjUxNSw0Ljc3MDc2NzYgMTQuMzE0ODUsNC42MjY4MjQ0IDE0LjIyNDM1Myw0LjU5NTM2MyAxNC4wNDU2ODksNC40OTc1NTkgMTMuODAxNzgxLDQuMzk5NTA1IDEzLjg3Mzc3Myw0LjQ0NDgyNzIgMTMuNjYwODY2LDQuMzg2MzI4MyAxMy41MTM2ODEsNC4zNDU4ODcxIDEzLjQ0ODI5LDQuMjg4Mjk1OCAxMy4wNDc5NTQsNC4zMDIzNTY3IGMgLTAuMjE2MDg3LDAuMDA3NTkgLTAuNDczNTEsMC4wMDgwNCAtMC42NjAwODEsMC4wODk3MjUgLTAuMzc0NjE1LDAuMTY0MDE3OCAtMC4yOTksMC4yNDg0NzU3IC0wLjUzODU3MiwwLjQ5MDAyNTIgLTAuMTY1MTA4LDAuMTY2NDcwOSAtMC4yMjMwMjksMC41NzQ5ODMxIC0wLjI4MjA0MSwwLjgxODg1OCAtMC4wNjkzOSwwLjI4Njc3NzYgLTAuMDU0NywwLjYwMTAzOTMgLTAuMDIwMzEsMC45Njc0MDMxIDAuMDI3NjEsMC4yOTQxOTY1IDAuMDkxNzMsMC40OTczOTM5IDAuMjQ5Mzg4LDAuNzU5MDYzIDAuMTM1MDg0LDAuMjI0MTk4OSAwLjMyNDU2MSwwLjI4MzU4MjggMC41NDY1OSwwLjQ5NzI4OTMgMC4wNzc3NCwwLjA3NDgzIDAuMzY4Mzk4LC0wLjAzODk2NSAwLjQ4NDg4LC0wLjAxNTEwNCAwLjEwODcwOSwwLjAyMjI3IC0wLjA0ODE3LDAuMjE2NzA4OCAtMC4wNTMyLDAuMjQ1MzgzNCAtMC4wNTM4LDAuMjM5NTE2OSAtMC4xMTA1MDMsMC4wODc3NzEgLTAuMDgwNiwwLjYyNzQyNjEgMC4zNDgxMjMsMi4wMjY2ODkyIDEuMDA1MDg5LC0xLjA2NzI2NDcgMC4zMjY2NDksMC42Njg2MTk0IC0wLjA1Mjk4LDAuMTM1NTY0IC0wLjQzNzU5NCwwLjM4ODgwNjggLTAuNTAzMzY4LDAuNTg2ODUzOCAtMC4wMTI2NywwLjE2NTEwOSAwLjE5NzgzNSwwLjE5NDA4IDAuMzE4OTk3LDAuMTc4MDQ5IDAuMDYyNjYsMC40ODAzOTUgMC4xMjQ5ODIsMS4wNDIwNDggMC41MjIyNDIsMS4zNzI0MzkgMC4xMjAxNzcsMC4xMDY0MDIgMC4yODY2NTIsMC4wOTQ0NyAwLjQyOTMxNywwLjEyNjQ0MyAwLjIyMTY0MSwwLjI2ODEyOCAwLjQ0ODY2OCwwLjU1NzA2NiAwLjc4NDA4NywwLjY4OTc3NCAwLjI4Mzg0NSwwLjE0ODQzNSAwLjYyNDkxMywwLjA1MSAwLjg5NjEzOCwwLjIzMzA2NSAwLjcxMjkyNSwwLjM2MDkwMSAxLjU5NDM3LDAuMjI3NDI0IDIuMjQwMzA3LC0wLjIxNDM2NyAwLjIzOTczNiwtMC4wMjU4NCAwLjUwMTI0MywwLjA1MTE5IDAuNzUxMzkxLDAuMDIyMjIgMC41NzU4OTgsLTAuMDIwMDYgMS4xNjcyMDcsLTAuMjQwMDA1IDEuNTIzOTYyLC0wLjcxMTUwMiAwLjA3MjksLTAuMDY2IDAuMTAyMDgxLC0wLjE3ODE0IDAuMTY4ODAzLC0wLjI0MDYzNSAwLjA2NjE2LDAuMDgzMyAwLjIwMTA3OSwwLjE2NTI4OSAwLjI4NTY1MywwLjA1NTAyIDAuMTkzMDcyLC0wLjI1MzQzNiAwLjIyMzQxMywtMC41OTUxMDQgMC4zMjcxNDUsLTAuODgyNTU5IDAuMDg2NTgsMC4wMzY0MSAwLjA4NDIsMC4yNjU3MzQgMC4xOTA4MiwwLjE3NTk2OCAwLjA4ODU4LC0wLjI3NzUxIDAuMjMxMDU1LC0wLjU4OTU1NCAwLjE1NzQ4NywtMC44NzUxMDMgQyAyMS4wOTQ5NjgsOS44NjQxNTE0IDIwLjk5NDc5OSw5LjcxMDk4NzkgMjAuOTU5NzUxLDkuNjcwOTkxNCAyMS4wNjk3Myw5LjY2NDkyMTQgMjEuMzkyMTQ2LDkuNjA3NDEyNCAyMS4zNjQyMjYsOS40MzQyNzkgMjEuMjg0OTAyLDkuMjY0MDY1MSAyMC45MzAzMjQsOS4wNTgwODkzIDIwLjc4MTQ3LDguOTYzNjg5MyAyMC42Mjc0ODksNy4wODIzNjI5IDIwLjgzMTk0MSw3Ljk3MzAwNDMgMjAuMzc0NDc1LDYuNTcyMTY2OCAyMC4yODY2OTMsNi4yOTYzNjYgMjAuMTc5NTgyLDYuMDI1MzkwOCAyMC4wMzkxNDksNS43NjczNzc4IDE5LjgxNDE1NSw1LjM1NDAwNzYgMTkuNTAzNjMsNC45NzM5MDc1IDE5LjA1MDAzMSw0LjY2MDUzMjggMTguNjk0MTU3LDQuNDg2NjE1NyAxOC43NzkxNjcsNC40MTI0NTc4IDE4LjQxNjMxOSw0LjI4NDIxMTggMTguMDQwOTE2LDQuMTE0ODkzIDE3LjkyMzEyNiw0LjExNDQyOTQgMTcuNzA2MjE3LDQuMDQ5NTUxNCAxNy40MjE5OTMsNC4wMDQyMzgyIDE3LjE3NjIyNiwzLjk5MzQ2MTEgMTYuODg5MTY1LDMuOTkwNzA2NyBaIG0gLTAuNDE2Nzc3LDMuNzcwMjM0NSBjIDAuMjU4MDA1LDAuMDA5NzYgMC40MjkyNTksMC4yNTQ4MTQgMC41Mjc1MDEsMC40Njg0NDEgLTAuMDQ2NTEsMC4xMjA5MTIzIC0wLjIxNzYxMywwLjE4MDMzMTggLTAuMzE0MzE2LDAuMjcwODAwNSAtMC4wNTIyNywwLjAzMDg5OCAtMC4xOTUwNTcsMC4xNDE5ODI5IC0wLjA3Mzk3LDAuMTc2MjU4MyAwLjE2NzU3NCwtMC4wMDgwMSAwLjM0MTEyNSwtMC4xMDE3NzYgMC41MDIzNjMsLTAuMDgxMjUzIDAuMDM4OCwwLjMxMzY5MjcgMC4wMTAzOCwwLjcyNTUwMzEgLTAuMjk1OTM5LDAuOTAyMTQ5NSAtMC4zMTY4ODQsMC4wODI4MjcgLTAuNTYyMDUzLC0wLjIxMjE0MTYgLTAuNjc2ODI5LC0wLjQ3MTYxOCAtMC4xNDcwOTYsLTAuMzY2NjkwMiAtMC4xODU5MzQsLTAuODQyODQzMSAwLjA3NjUxLC0xLjE2Njk5ODggMC4wNjUzMSwtMC4wNjgyNjggMC4xNjAwMTEsLTAuMTA2MzQ3NSAwLjI1NDY3OCwtMC4wOTc3OCB6IG0gMi44NTkyNDQsMi41NzU3ODc4IGMgLTAuMDc2NzMsMC4xODQ3NTggLTAuMjMwNjU5LDAuMzMwMTU2IC0wLjQwNzAxMSwwLjQxMzI1MiAtMC4wNTUzOSwwLjE1MDcwNSAwLjA0MDA0LDAuMzU0MzggMC4wMjk3LDAuNDgzMjM0IC0wLjA0OTA3LC0wLjE2MDM1NyAtMC4wMDE2LC0wLjM2MTQyNiAtMC4xMDg4NzUsLTAuNDk2NzU3IC0wLjA3MDE4LC0wLjAyMjcxIC0wLjE0Nzc0NywtMC4wMjgxIC0wLjIxMTc0MSwtMC4wNzIwNiAwLjIxMjc5NCwwLjExNzcxNyAwLjQ5NTYxLDAuMDM5MjQgMC42MDQ3NjYsLTAuMTgyMDk0IDAuMDI5MzQsLTAuMDM3NjIgMC4wODE1OSwtMC4xNDU1NzUgMC4wOTMxNiwtMC4xNDU1NzEgeiBtIC0wLjk2NTM3MiwwLjE0MTk4OCBjIDAuMDQ1NjYsMC4wMzQwOSAwLjIwNDg5NywwLjE2Mjg1NyAwLjA3NzQ0LDAuMDY3ODUgLTAuMDE2NDEsLTAuMDExMzggLTAuMDkwMTksLTAuMDcwODYgLTAuMDc3NDQsLTAuMDY3ODUgeiIgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6I2M5ZGFkODtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4wNTIzMDQ5NTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIgLz4gPHBhdGggaWQ9InBhdGg0MjU3IiBkPSJtIDE4LjU2MjI5Miw0LjM0MDY1NDMgYyAwLDAgLTAuMDE4MjMsLTAuMTI2MDkyNSAwLjA1NTAzLC0wLjI2MzA5MTEgMC4xMDcwNjUsLTAuMjAwMjExOCAwLjM2NDA0MywtMC40MDk5NDg1IDAuNjYxOTUxLC0wLjU5NjUyOTEgMC4zOTA1NzksLTAuMjQ0NjIwMiAwLjg3ODEwNSwtMC40MDE1NzcyIDEuNDU3NjUzLDAuMDM1OTg1IDAuMTUwMzMxLDAuMTEzNTAwOCAwLjI3NTEyLDAuMzU2MTg0OSAwLjQzNjUyLDAuNTQ2MjQ1OCAwLDAgMC40NDM4MjIsMC41MzI1ODcxIDAuMDU5MTgsMS43OTAwODI5IEMgMjAuODQ3OTc4LDcuMTEwODQ1IDIwLjI0MTQyLDYuNTMzODc1NCAyMC4yNDE0Miw2LjUzMzg3NTQgWiIgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6I2M5ZGFkODtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4wMTA0NjA5OXB4O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDxwYXRoIGlkPSJwYXRoNDI1OSIgZD0ibSAxNS41NDQ5NjIsNC4zMTU2Mjk4IGMgMC42NzQwMTYsMC44NjIwMTcgMi4yMjQ5NDUsMy4zNjQ2NDY3IDIuNTUyNDgxLDIuMTM1NzQ3MSAwLjIwOTIyLC0wLjkxMDEwNjEgMC4wMTUzMiwtMi4zMDI1OTczIDAuMDE1MzIsLTIuMzAyNTk3MyAwLDAgLTEuMjUyMDM4LC0wLjQ2NTg4NTcgLTIuNTY3ODAyLDAuMTY2ODUwMiB6IiBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDojODk5YmIwO2ZpbGwtb3BhY2l0eToxO2ZpbGwtcnVsZTpldmVub2RkO3N0cm9rZTojODk5YmIwO3N0cm9rZS13aWR0aDowLjEwNDYwOTk7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDxwYXRoIGlkPSJwYXRoNDI3NiIgZD0ibSAxNC41NTMyNiw5LjMxOTI1NjMgYyAwLDAgLTAuMTY3Mzc2LDAuMDUyMzA1IDEuMDk4NDA0LDAuMzM0NzUxNyAxLjI2NTc4LDAuMjgyNDQ2NyAxLjYyMTQ1MywtMC42Njk1MDM0IDEuNjIxNDUzLC0wLjY2OTUwMzQgMCwwIDEuMDM1NjM4LC0xLjUxNjg0MzYgMi4xNDQ1MDMsLTAuMzAzMzY4NyAwLDAgMC4yODI0NDcsMC4zMDMzNjg3IDAuNzg0NTc1LDAuMjkyOTA3NyAwLDAgMC4zMTM4MjksLTAuMTc3ODM2OCAwLjU3NTM1NCwtMC4wMTA0NjEgMC4yNjE1MjUsMC4xNjczNzU5IDAuNDkxNjY3LDAuMzI0MjkwNyAwLjQ5MTY2NywwLjMyNDI5MDcgMCwwIDAuMzg3MDU2LDAuMzY2MTM0NyAtMC4yOTI5MDgsMC4zNTU2NzM3IDAsMCAwLjQyODksMC4xMDQ2MDk5IC0wLjA4MzY5LDEuMzM5MDA3IGwgLTAuMTQ2NDU0LC0wLjMzNDc1MiBjIDAsMCAtMC4yMDkyMiwxLjQwMTc3MyAtMC41NzUzNTQsMC44NjgyNjIgMCwwIC0wLjE2ODU2NywwLjI4NDA0MiAtMC41NDkzMzUsMC41MzgxMTEgLTAuNDYxNzA0LDAuMzA4MDczIC0xLjIwMDYyLDAuNTc5MDM0IC0xLjg4Mjg0NiwwLjMzNTM4MiAwLDAgLTAuOTI5NDM2LDEuMDIzNTYzIC0yLjUxMjQwMiwwLjEyMTEyNSAwLDAgLTAuODcxNzI4LDAuMTY2NTUyIC0xLjQ1NzU0MywtMC44MTY3ODEgMCwwIC0wLjgwNTQ5NiwwLjE5ODc1OSAtMC45NTE5NSwtMS40OTU5MjIgMCwwIC0wLjY3OTk2NSwwLjA0MTg0IC0wLjA0MTg0LC0wLjU0Mzk3MSAwLjYzODEyLC0wLjU4NTgxNTUgMS4yMDMwMTQsLTAuNDYwMjgzNiAxLjIwMzAxNCwtMC40NjAyODM2IHoiIHN0eWxlPSJkaXNwbGF5OmlubGluZTtmaWxsOiNmOGY4Zjg7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjAuMDEwNDYwOTlweDtzdHJva2UtbGluZWNhcDpidXR0O3N0cm9rZS1saW5lam9pbjptaXRlcjtzdHJva2Utb3BhY2l0eToxIiAvPiA8cGF0aCBpZD0icGF0aDQzNjUiIGQ9Im0gMTMuNTM4NTQ0LDUuMzE3OTI3NiBjIC0wLjAxNjk4LDAuMDAzMzMgLTAuMjk1NDI5LDAuMDA0MTEgLTAuNTQyNjE0LC0wLjEyODc4OTQgLTAuMTI2Mjk4LC0wLjA2NzkwNiAtMC4yNDcwMjYsLTAuMTI3MDA2OSAtMC4yOTEyNywtMC4xODU5ODA3IC0wLjAzNTY0LC0wLjA0NzUwOCAwLjAwNDEsLTAuMTExNDU4NyAtMC4wNjY4NSwtMC4wNTMwMjIgLTAuOTQ5ODUyLDAuNzgyODExNiAtMC40ODU4NjcsMi4wNDg5MTU3IDAuMzkxNTE4LDIuMzgxNzQ5OSAwLDAgMC4xNjgwMywtMC45MzA1MDIgMS4wODQ1NzEsLTEuOTg3ODA1NyIgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6I2Y4ZjhmODtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4wMTA0NjA5OTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIgLz4gPHBhdGggaWQ9InBhdGg0MzY3IiBkPSJtIDE4Ljk2OTEyOSw0LjU1MTQ2OTcgYyAwLDAgMC45NjE2MTUsMC42ODA1MjcxIDEuMTk4MzIsMS42MTI1NTQzIDAsMCAxLjE1MzkzOSwtMS43MzA5MDY4IC0wLjA3Mzk3LC0yLjQyNjIyODIgMCwwIC0wLjIwNzExOCwwLjc5ODg4IC0xLjEyNDM1MSwwLjgxMzY3MzkgeiIgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6I2Y4ZjhmODtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4wMTA0NjA5OXB4O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDxwYXRoIGlkPSJwYXRoNDIxNSIgZD0ibSAxMi44Mzg2ODUsMTAuMjA5MDE4IGMgMC4xNDQzOTksMS43NjE2ODIgMC45Mzg2MDEsMS40NzI4ODIgMC45Mzg2MDEsMS40NzI4ODIgMC42MzUzNiwxLjAxMDggMS40Mjk1NjEsMC44MjMwOCAxLjQyOTU2MSwwLjgyMzA4IDEuMzcxODAyLDAuODM3NTIyIDIuNTI3MDAzLC0wLjEwMTA3OSAyLjUyNzAwMywtMC4xMDEwNzkgMS45MzQ5NjMsMC4zMTc2OCAyLjQxMTQ4MywtMC45MjQxNjIgMi40MTE0ODMsLTAuOTI0MTYyIDAuMzc1NDQxLDAuNTc3NjAxIDAuNjA2NDgxLC0wLjgwODY0MSAwLjYwNjQ4MSwtMC44MDg2NDEgMC4wNTc3NiwtMC4xMTU1MiAwLjE0NDQwMSwwLjM0NjU2IDAuMTQ0NDAxLDAuMzQ2NTYgMC40NjIwNzksLTEuMjEyOTYwNSAwLjA4MzI0LC0xLjM3NzgzMyAwLjA4MzI0LC0xLjM3NzgzMyAxLjAxMDgwMSwwLjAyODg4IC0wLjIwMzYyNiwtMC43MDI4NzQgLTAuMjAzNjI2LC0wLjcwMjg3NCAtMC4wMjU1MywtMS4wNTkwNjU0IC0wLjAyNTA4LC0xLjMyOTIxMzEgLTAuMzkwMDU0LC0yLjMzMzQzNzggMC44MDk3OTcsMC4yMTYzODc3IDAuODExMDU3LC0wLjk2MDY1ODkgMC45NDkxNywtMS4yMjk3ODc3IDAuMTk5OTE5LC0wLjUzOTAyNDUgLTAuMDM1NiwtMS41MDQ0OTA0IC0wLjY3OTY0MSwtMS45MTk1MzIzIC0wLjI2NTQxMSwtMC4xNzEwMzg3IC0wLjYwMDIsLTAuMjQ4NjAwOSAtMS4wMDI0ODYsLTAuMTY0MzE5OCAtMC4zMDI3NTUsMC4xMzkwMTI4IC0wLjY5MjU0LDAuMzk0OTg5NSAtMC45MDc2MjgsMC42MDg2NjE5IC0wLjE5MzYxMywwLjE5MjMzOTUgLTAuMjE5NjQ5LDAuMzAzMjExNCAtMC4xOTU0NDIsMC40MTU1NTciIHN0eWxlPSJmaWxsOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOiM1MDUwNTA7c3Ryb2tlLXdpZHRoOjAuMTA0NjA5OTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIgLz4gPHBhdGggaWQ9InBhdGg0MjI3IiBkPSJtIDEyLjgzODY4NSwxMC4yMTE0OTUgYyAwLDAgLTAuOTA5NzIxLDAuMDk4NiAwLjI1OTkyLC0wLjgxMTExNzkgMCwwIDAuNDkwOTYsLTAuNDE4NzYwOCAxLjQ3Mjg4MSwtMC4wNTc3NiIgc3R5bGU9ImZpbGw6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6IzUwNTA1MDtzdHJva2Utd2lkdGg6MC4xMDQ2MDk5O3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxIiAvPiA8cGF0aCBpZD0icGF0aDQyMjkiIGQ9Ik0gMTIuOTA0OTA0LDkuNTY1NTUzIEMgMTIuNTA1NjUzLDguNzczODU0OCAxMi42NzA3OTcsOC4xNjU2MDM3IDEyLjg1MDI0NCw3Ljk1ODI5NCIgc3R5bGU9ImZpbGw6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6IzUwNTA1MDtzdHJva2Utd2lkdGg6MC4xMDQ2MDk5O3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxIiAvPiA8cGF0aCBpZD0icGF0aDQyMDEiIGQ9Im0gMTQuNTgxMzAzLDQuODIyNzY5MiBjIDAsMCAxLjc5NTc0OSwtMS40NTE3MDY2IDMuOTY3MjA3LC0wLjUxNTAzMDkiIHN0eWxlPSJkaXNwbGF5OmlubGluZTtmaWxsOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOiM1MDUwNTA7c3Ryb2tlLXdpZHRoOjAuMTA0NjA5OTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIgLz4gPHBhdGggc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6IzUwNTA1MDtzdHJva2Utd2lkdGg6MC4xMDQ2MDk5O3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxIiBkPSJNIDEyLjkxMzUyNyw3Ljg5OTY1ODEgQyAxMC44OTQzNTYsOC4zNTIwMTQzIDExLjE2ODQwMiw0LjI1NDUyNDcgMTIuNzY0OTUyLDQuMzAyNTA3MyAxMy4zODM1NjksNC4yODU3MzczIDE0LjA5NzQyNCw0LjI2Nzg1NSAxNC42NTY4MSw1LjAwMTUxMyIgaWQ9InBhdGg0MjA3IiAvPiA8cGF0aCBpZD0icGF0aDQyMzMiIGQ9Im0gMTguMzQwMzMxLDEwLjQ1NDQ5OSBjIDAsMCAwLjY2NDI0LDAuNzIyIDEuMDEwODAxLC0wLjE3MzI4IiBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDpub25lO2ZpbGwtcnVsZTpldmVub2RkO3N0cm9rZTojNTA1MDUwO3N0cm9rZS13aWR0aDowLjEwNDYwOTk7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDxwYXRoIGlkPSJwYXRoNDIzNSIgZD0ibSAxOC44ODkwNTIsMTAuNzI4ODU5IDAuMDcyMiwwLjU2MzE2IiBzdHlsZT0iZGlzcGxheTppbmxpbmU7ZmlsbDpub25lO2ZpbGwtcnVsZTpldmVub2RkO3N0cm9rZTojNTA1MDUwO3N0cm9rZS13aWR0aDowLjEwNDYwOTk7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDxwYXRoIGlkPSJwYXRoNDI1MSIgZD0ibSAxNC4xMzQ4Miw1LjM0NDA4MDEgYyAtMC4xNzgzOTEsMCAtMC42MzI5NDYsMC4wMDY5OCAtMC45OTQxOTIsLTAuMDg2ODE2IEMgMTIuOTA4NzMsNS4xOTcwNTE5IDEyLjcxNTI4NCw1LjA5NTMxMjUgMTIuNjU4MDI2LDQuOTIzNTM3OCIgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6IzUwNTA1MDtzdHJva2Utd2lkdGg6MC4xMDQ2MDk5O3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxIiAvPiA8cGF0aCBpZD0icGF0aDQzMDEiIGQ9Im0gMTIuNjcyOTA2LDExLjI0OTk1OSBjIDAsMCAtMS4yMTMxMTMsMC44ODAyNDcgLTAuNzI0OTA5LDEuNTQ1OTgxIGwgMC41OTkxNiwwLjUzMjU4NiAwLjgyMTA3MiwwLjQ0MzgyMyAxLjIyNzkwNywwLjA2NjU3IDAuODA2Mjc3LC0wLjE0Nzk0MSAwLjQxNDIzNCwtMC4xODQ5MjYgMC40NDM4MjIsMC4zNzcyNSAwLjM5OTQ0MSwwLjAxNDc5IDAuMjI5MzA4LC0wLjExMDk1NiAwLjY4NzkyNCwtMC4yNzM2OTEgMC4zNjI0NTYsLTAuMjg0Nzg2IDAuMjA3MTE3LC0wLjMxNDM3MyAtMC4wMjk1OSwtMC4zNDAyNjQgYyAwLDAgLTAuMzg0NjQ2LC0xLjE2MTMzNSAtMC43OTg4OCwtMS4zNDYyNjEgMCwwIC0wLjUzMjU4NywtMC41NzY5NjkgLTEuMjcyMjkxLC0wLjA4MTM3IDAsMCAtMS4xMTY5NTIsMC4zNjk4NTIgLTIuMDg1OTY0LDAuMDQ0MzggLTAuOTY5MDEyLC0wLjMyNTQ3IC0xLjI4NzA4NSwwLjA1OTE4IC0xLjI4NzA4NSwwLjA1OTE4IHoiIHN0eWxlPSJkaXNwbGF5OmlubGluZTtmaWxsOiNmOGY4Zjg7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOm5vbmU7c3Ryb2tlLXdpZHRoOjAuMDEwNDYwOTlweDtzdHJva2UtbGluZWNhcDpidXR0O3N0cm9rZS1saW5lam9pbjptaXRlcjtzdHJva2Utb3BhY2l0eToxIiAvPiA8cGF0aCBpZD0icGF0aDQzMjUiIGQ9Im0gMTEuODUzMTgsMTIuNDgxMDk0IGMgMCwwIDEuMjIwNTExLC0wLjcwMjcxOSAzLjA2OTc3LC0wLjE4NDkyNyAwLDAgMC45MTcyMzQsMC4xNjI3MzYgMS41MDg5OTYsLTAuMDY2NTcgMC41OTE3NjQsLTAuMjI5MzA5IDAuNzkxNDgzLDAuMjczNjkgMC43OTE0ODMsMC4yNzM2OSAwLDAgMC40NjYwMTQsMC44NDMyNjIgMC4zOTk0NCwwLjkwMjQzOCBsIDAuMTc3NTI5LC0wLjA1MTc4IDAuMjY2MjkzLC0wLjM0MDI2NCAwLjA3Mzk3LC0wLjI1ODg5NyAtMC4xNDA1NDMsLTAuNDI5MDI4IC0wLjI3MzY5MSwtMC41NzY5NjggLTAuMzEwNjc2LC0wLjQ0MzgyMiAtMC4yNTE0OTksLTAuMTg0OTI3IC0wLjQyMTYzMSwtMC4xODQ5MjUgLTAuNDA2ODM4LDAuMDI5NTkgLTAuNjA2NTU2LDAuMjUxNDk5IGMgMCwwIC0xLjAyODE4OSwwLjI4ODQ4NSAtMi4yNDg3LC0wLjE4NDkyNSAwLDAgLTAuOTAyNDM4LC0wLjE2MjczNiAtMS41MTYzOTIsMC45ODM4MDYgbCAtMC4xMTgzNTMsMC4zOTk0MzkgeiIgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6I2M5ZGFkODtmaWxsLW9wYWNpdHk6MTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4wMTA0NjA5OXB4O3N0cm9rZS1saW5lY2FwOmJ1dHQ7c3Ryb2tlLWxpbmVqb2luOm1pdGVyO3N0cm9rZS1vcGFjaXR5OjEiIC8+IDxwYXRoIGlkPSJwYXRoNDI3OSIgZD0ibSAxNi44MzM2NzIsMTMuNzg1MjE3IGMgMC4xNTM0MjMsLTAuMTAyOTY3IDEuNDU0MTIyLC0wLjQwNTE0NCAxLjI3MTUzLC0xLjEwNzA1MiAtMC4xODI1OSwtMC43MDE5MDYgLTAuODEwNDg4LC0yLjE4MzA4IC0xLjk2Mjc0OSwtMS42MjExNTEgLTEuMTUyMjY0LDAuNTYxOTMyIC0yLjQyODI3MSwwLjA0NDIyIC0yLjQyODI3MSwwLjA0NDIyIDAsMCAtMC41MDI1NzUsLTAuMTkxMTk4IC0wLjkxNzEzNywwLjA0NDc1IC0wLjQxNDU2MiwwLjIzNTk1MSAtMC44MzU2OTEsMC42MjQyODUgLTAuOTY5NjcsMS4yNjM4MzYgLTAuMTMzOTgyLDAuNjM5NTU3IDEuNTU5NzQ1LDEuMzQxOTkxIDEuNTU5NzQ1LDEuMzQxOTkxIDAsMCAxLjYyODU2NywwLjIzODgxMyAyLjM5NTY5MywtMC4yNzYwMzUgMCwwIDAuNjI5NzI5LDAuNjk3NzcxIDEuMDUwODU5LDAuMzA5NDM3IHoiIHN0eWxlPSJkaXNwbGF5OmlubGluZTtmaWxsOm5vbmU7ZmlsbC1vcGFjaXR5OjE7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOiM1MDUwNTA7c3Ryb2tlLXdpZHRoOjAuMTA0NjA5OTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIgLz4gPHBhdGggZD0ibSAxNy4xMTQwMTYsOC41MDk4MjQxIGEgMC45NDk4OTcwOCwwLjU4NjQwNTg3IDc4LjA3ODA2MiAwIDEgLTAuMzQwNjEzLDEuMDQwNjk1NSAwLjk0OTg5NzA4LDAuNTg2NDA1ODcgNzguMDc4MDYyIDAgMSAtMC43NzY1NjIsLTAuNjc4NzU2IDAuOTQ5ODk3MDgsMC41ODY0MDU4NyA3OC4wNzgwNjIgMCAxIDAuMjM5NTYsLTEuMTI5MDIxNiAwLjk0OTg5NzA4LDAuNTg2NDA1ODcgNzguMDc4MDYyIDAgMSAwLjgwNzczNiwwLjUzMTgzNzIgbCAtMC41MDM4NzgsMC4zNTYzODM5IHoiIGlkPSJwYXRoNDI2NSIgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6IzUwNTA1MDtmaWxsLW9wYWNpdHk6MTtzdHJva2Utd2lkdGg6MC4xMDQ2MDk5NDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIgLz4gPHBhdGggZD0iTSAyMC40MTM5NzcsOC4wMzE1OTA2IEEgMC44NTY3NjMyNSwwLjUyODkxMDk1IDc4LjA3ODA2MiAwIDEgMjAuMTA2NzYsOC45NzAyNDk4IDAuODU2NzYzMjUsMC41Mjg5MTA5NSA3OC4wNzgwNjIgMCAxIDE5LjQwNjMzNiw4LjM1ODA0MzEgMC44NTY3NjMyNSwwLjUyODkxMDk1IDc4LjA3ODA2MiAwIDEgMTkuNjIyNDA3LDcuMzM5NzE3NiAwLjg1Njc2MzI1LDAuNTI4OTEwOTUgNzguMDc4MDYyIDAgMSAyMC4zNTA5NDgsNy44MTk0MTA4IGwgLTAuNDU0NDc0LDAuMzIxNDQxNiB6IiBpZD0icGF0aDQyNjUtMiIgc3R5bGU9ImRpc3BsYXk6aW5saW5lO2ZpbGw6IzUwNTA1MDtmaWxsLW9wYWNpdHk6MTtzdHJva2Utd2lkdGg6MC4xMDQ2MDk5NDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZSIgLz4gPHBhdGggaWQ9InBhdGg1NzIwIiBkPSJtIDIxLjEzNDgzMiw3LjY5NjM2MzQgYyAtMC4xMTIzMTgsLTAuMDI3NzU3IC0wLjI2MjQ5NywtMC4wODEwNTQgLTAuMzMzNzMxLC0wLjExODQzODMgLTAuMTQ0MDA1LC0wLjA3NTU3MyAtMC4yOTkzMjksLTAuMjY5ODY1MyAtMC4yOTkzMjksLTAuMzc0NDI2IDAsLTAuMDk2NjA3IC0wLjE5MzI5OCwtMC44NDY4MTQgLTAuMjk0MTMzLC0xLjE0MTU1OTcgQyAxOS45MTc4NSw1LjIxNDg4MjcgMTkuNDI2NzM2LDQuNjc1ODIwNSAxOC44MDY4MDgsNC41MjQzNDIzIDE4LjU3NDU0Myw0LjQ2NzU4OTMgMTguMzc3OTYsNC4zNzc3MTcyIDE4LjM3Nzk2LDQuMzI4Mjg1MSBjIDAsLTAuMTE2NTg3NCAwLjUxODc4NywtMC4zNzIwNTkgMC43NTU1ODcsLTAuMzcyMDgxOCAwLjIyNTEyOSwtMi4wOWUtNSAwLjU1MTc3MywwLjE5NTUxMDUgMC43NTQwMDcsMC40NTEzNTU2IDAuMDg5NTgsMC4xMTMzMjYgMC4zMzY4NDMsMC41NTg3ODc0IDAuNTQ5NDc2LDAuOTg5OTE0MSAwLjYzMDg5MSwxLjI3OTE3MTkgMS4xMjc0NjQsMS45Njg0NzM4IDEuNTY3NTYzLDIuMTc1OTYzMyAwLjIxNzMwOCwwLjEwMjQ1MTggMC4yMjYxMTYsMC4xMTE5NDIgMC4xMzA4ODEsMC4xNDEwMjE1IC0wLjE1OTgzNSwwLjA0ODgwNCAtMC43NzQ5NSwwLjAzNzY4MSAtMS4wMDA2NDIsLTAuMDE4MDk0IHoiIHN0eWxlPSJmaWxsOiMwMDAwMDA7ZmlsbC1vcGFjaXR5OjA7c3Ryb2tlLXdpZHRoOjAuMDUyMzA0OTU7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kO3N0cm9rZS1taXRlcmxpbWl0OjQ7c3Ryb2tlLWRhc2hhcnJheTpub25lIiAvPiA8cGF0aCBpZD0icGF0aDQyNDUiIGQ9Im0gMTUuNTQ0Mzg3LDQuMzE0MzcwOSBjIDAsMCAxLjU1NTIyNiwyLjEwODgwNTMgMi4wNzgyNzYsMi4yNzYxODExIDAuNTIzMDQ5LDAuMTY3Mzc1OSAwLjU1MDA5OSwtMS4yNjczOTM5IDAuNTUwMDk5LC0xLjI2NzM5MzkgMCwwIDAuMDEwNDYsLTAuODA1NDk2MiAtMC4wMzEzOCwtMS4xNjExNyIgc3R5bGU9ImZpbGw6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6MC4xMDQ2MDk5O3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtbWl0ZXJsaW1pdDo0O3N0cm9rZS1kYXNoYXJyYXk6bm9uZTtzdHJva2Utb3BhY2l0eToxIiAvPiA8cGF0aCBpZD0icGF0aDQyNDkiIGQ9Im0gMTguOTQ0Mzc3LDQuNTQ1NjI2MiBjIDAuMjUwMTgyLDAuMDI5NjUgMC44NTMyMzUsLTAuMDU1OTAzIDEuMTM0NjY1LC0wLjc3MjM2OTQiIHN0eWxlPSJmaWxsOm5vbmU7ZmlsbC1ydWxlOmV2ZW5vZGQ7c3Ryb2tlOiM1MDUwNTA7c3Ryb2tlLXdpZHRoOjAuMTA0NjA5OTtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQ7c3Ryb2tlLW1pdGVybGltaXQ6NDtzdHJva2UtZGFzaGFycmF5Om5vbmU7c3Ryb2tlLW9wYWNpdHk6MSIgLz4gPHRleHQgaWQ9InRleHQ0MjQ1IiB5PSIyLjA1MTI3MTQiIHg9IjExLjU1NzI5OSIgc3R5bGU9ImZvbnQtc3R5bGU6bm9ybWFsO2ZvbnQtd2VpZ2h0Om5vcm1hbDtmb250LXNpemU6MC4xMjU1MzE4OHB4O2xpbmUtaGVpZ2h0OjAlO2ZvbnQtZmFtaWx5OnNhbnMtc2VyaWY7bGV0dGVyLXNwYWNpbmc6MHB4O3dvcmQtc3BhY2luZzowcHg7ZmlsbDojMDAwMDAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZTpub25lO3N0cm9rZS13aWR0aDowLjAxMDQ2MDk5cHg7c3Ryb2tlLWxpbmVjYXA6YnV0dDtzdHJva2UtbGluZWpvaW46bWl0ZXI7c3Ryb2tlLW9wYWNpdHk6MSIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PHRzcGFuIHN0eWxlPSJmb250LXNpemU6MC40MTg0Mzk2cHg7bGluZS1oZWlnaHQ6MS4yNTtzdHJva2Utd2lkdGg6MC4wMTA0NjA5OXB4IiB5PSIyLjA1MTI3MTQiIHg9IjExLjU1NzI5OSIgaWQ9InRzcGFuNDI0NyI+wqA8L3RzcGFuPjwvdGV4dD4gPC9nPiA8L3N2Zz4=";
                        // eslint-disable-next-line no-console
                        console.log(
                            "%cMusic Blocks",
                            "font-size: 24px; font-weight: bold; font-family: sans-serif; padding:20px 0 0 110px; background: url(" +
                                imgUrl +
                                ") no-repeat;"
                        );
                        // eslint-disable-next-line no-console
                        console.log(
                            "%cMusic Blocks is a collection of tools for exploring fundamental musical concepts in a fun way.",
                            "font-size: 16px; font-family: sans-serif; font-weight: bold;"
                        );
                    } else {
                        // eslint-disable-next-line no-console
                        console.log(
                            "%cTurtle Blocks is a collection of tools for exploring  concepts from Logo in a fun way.",
                            "font-size: 16px; font-family: sans-serif; font-weight: bold;"
                        );
                    }
                    // Set flag to 1 to enable keyboard after MB finishes loading
                    that.keyboardEnableFlag = 1;
                }

                document.removeEventListener("finishedLoading", __afterLoad);
            };

            // Set the flag to zero to disable keyboard
            that.keyboardEnableFlag = 0;

            that.sessionData = null;

            // Try restarting where we were when we hit save.
            if (that.planet) {
                that.sessionData = await that.planet.openCurrentProject();
            } else {
                const currentProject = that.storage.currentProject;
                that.sessionData = that.storage["SESSION" + currentProject];
            }

            // After we have finished loading the project, clear all
            // to ensure a clean start.
            if (document.addEventListener) {
                document.addEventListener("finishedLoading", __afterLoad);
            } else {
                document.attachEvent("finishedLoading", __afterLoad);
            }

            if (that.sessionData) {
                that.doLoadAnimation();
                try {
                    if (that.sessionData === "undefined" || that.sessionData === "[]") {
                        that.justLoadStart();
                    } else {
                        window.loadedSession = that.sessionData;
                        that.blocks.loadNewBlocks(JSON.parse(that.sessionData));
                    }
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error(e);
                }
            } else {
                that.justLoadStart();
            }

            that.update = true;
        };

        // eslint-disable-next-line no-unused-vars
        this._loadProject = (projectID, flags, env) => {
            if (this.planet === undefined) {
                return;
            }

            // Set default value of run.
            flags =
                typeof flags !== "undefined"
                    ? flags
                    : {
                        run: false,
                        show: false,
                        collapse: false
                    };
            this.loading = true;
            document.body.style.cursor = "wait";
            this.doLoadAnimation();

            // palettes.updatePalettes();
            this.textMsg(this.planet.getCurrentProjectName());

            const that = this;
            setTimeout(() => {
                try {
                    that.planet.openProjectFromPlanet(projectID, () => {
                        that.loadStartWrapper(loadStart);
                    });
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error(e);
                    that.loadStartWrapper(loadStart);
                }

                that.planet.initialiseNewProject();
                // Restore default cursor
                that.loading = false;

                document.body.style.cursor = "default";
                that.update = true;
            }, 2500);

            const run = flags.run;
            const show = flags.show;
            const collapse = flags.collapse;

            const __functionload = () => {
                setTimeout(() => {
                    if (!collapse && that.firstRun) {
                        that._toggleCollapsibleStacks();
                    }

                    if (run && that.firstRun) {
                        for (let turtle = 0; turtle < that.turtles.turtleList.length; turtle++) {
                            that.turtles.turtleList[turtle].painter.doClear(true, true, false);
                        }

                        that.textMsg(_("Click the run button to run the project."));

                        if (show) {
                            that._changeBlockVisibility();
                        }

                        if (!collapse) {
                            that._toggleCollapsibleStacks();
                        }
                    } else if (!show) {
                        that._changeBlockVisibility();
                    }

                    document.removeEventListener("finishedLoading", __functionload);
                    that.firstRun = false;
                }, 1000);
            };

            if (document.addEventListener) {
                document.addEventListener("finishedLoading", __functionload, false);
            } else {
                document.attachEvent("finishedLoading", __functionload);
            }
        };
        // Function to convert ABC pitch to MB pitch
        function _adjustPitch(note, keySignature) {
            const accidental = keySignature.accidentals.find(acc => {
                const noteToCompare = acc.note.toUpperCase().replace(',', '');
                note = note.replace(',', '');
                return noteToCompare.toLowerCase() === note.toLowerCase();
            });
        
            if (accidental) {
                return note + (accidental.acc === "sharp" ? "♯" : (accidental.acc === "flat" ? "♭" : ""));
            } else {
                return note;
            }
        }
        // When converting to pitch value from ABC to MB there is issue
        // with the octave conversion. We map the pitch to audible pitch.
        function _abcToStandardValue(pitchValue) {
            const octave = Math.floor(pitchValue/ 7) + 4; 
            return  octave;
        }
        // Creates pitch which consist of note pitch notename you could
        // see them in the function.
        function _createPitchBlocks(pitches, blockId, pitchDuration,keySignature,actionBlock,triplet,meterDen) {
            const blocks = [];
            
            const pitch = pitches;
            pitchDuration = toFraction(pitchDuration);          
            const adjustedNote = _adjustPitch(pitch.name , keySignature).toUpperCase();
            if (triplet !== undefined && triplet !== null){
                pitchDuration[1] = meterDen * triplet
            }
          
            actionBlock.push(
                [blockId, ["newnote", {"collapsed": true}], 0, 0, [blockId - 1, blockId + 1, blockId + 4, blockId + 8]],
                [blockId + 1, "divide", 0, 0, [blockId, blockId + 2, blockId + 3]],
                [blockId + 2, ["number", {value: pitchDuration[0]}], 0, 0, [blockId + 1]],
                [blockId + 3, ["number", {value: pitchDuration[1]}], 0, 0, [blockId + 1]],
                [blockId + 4, "vspace", 0, 0, [blockId, blockId + 5]],
                [blockId + 5, "pitch", 0, 0, [blockId + 4, blockId + 6, blockId + 7, null]],
                [blockId + 6, ["notename", {value: adjustedNote}], 0, 0, [blockId + 5]],
                [blockId + 7, ["number", {value: _abcToStandardValue(pitch.pitch)}], 0, 0, [blockId + 5]],
                [blockId + 8, "hidden", 0, 0, [blockId, blockId + 9]],
            );
            return blocks;
        }

        // Function to search index for particular type of block
        // mainly used to find nammeddo block in repeat block.
        function _searchIndexForMusicBlock(array, x) {
            // Iterate over each sub-array in the main array
            for (let i = 0; i < array.length; i++) {
                // Check if the 0th element of the sub-array matches x
                if (array[i][0] === x) {
                    // Return the index if a match is found
                    return i;
                }
            }
            // Return -1 if no match is found
            return -1;
        }

        /*
          The parseABC function converts ABC notation to Music Blocks
          and is able to convert almost all the ABC notation to Music
          Blocks. However, the following aspects need work:

          Hammers, pulls, and sliding offs grace notes (breaking the
          conversion) Alternate endings (not failing but not showing
          correctly) and DS al coda Bass voicing (failing)
        */
        this.parseABC = async function (tune) {
            let musicBlocksJSON = [];
            let staffBlocksMap = {};
            let organizeBlock={}
            let blockId = 0;
            let tripletFinder = null
            const title = (tune.metaText?.title ?? "title").toString().toLowerCase();
            const instruction = (tune.metaText?.instruction ?? "guitar").toString().toLowerCase();

            tune.lines?.forEach(line => {
                line.staff?.forEach((staff,staffIndex) => {
                    if (!organizeBlock.hasOwnProperty(staffIndex)) {
                        organizeBlock[staffIndex] = {
                         arrangedBlocks:[]
                        };
                   
                    }

                   organizeBlock[staffIndex].arrangedBlocks.push(staff)
                });
            });
            for (const lineId in organizeBlock) {
                organizeBlock[lineId].arrangedBlocks?.forEach((staff) => {
                    if (!staffBlocksMap.hasOwnProperty(lineId)) {
                        staffBlocksMap[lineId] = {
                            meterNum: staff?.meter?.value[0]?.num || 4,
                            meterDen: staff?.meter?.value[0]?.den || 4,
                            keySignature: staff.key,
                            baseBlocks: [],
                            startBlock: [
                                [blockId, ["start", {collapsed: false}], 100, 100, [null, blockId + 1, null]],
                                [blockId + 1, "print", 0, 0, [blockId, blockId + 2, blockId + 3]],
                                [blockId + 2, ["text", {value: title}], 0, 0, [blockId + 1]],
                                [blockId + 3, "setturtlename2", 0, 0, [blockId + 1, blockId + 4, blockId + 5]],
                                [blockId + 4, ["text", {value: `Voice ${parseInt(lineId)+1 } `}], 0, 0, [blockId + 3]],
                                [blockId + 5, "meter", 0, 0, [blockId + 3, blockId + 6, blockId + 7, blockId + 10]],
                                [blockId + 6, ["number", {value: staff?.meter?.value[0]?.num || 4}], 0, 0, [blockId + 5]],
                                [blockId + 7, "divide", 0, 0, [blockId + 5, blockId + 8, blockId + 9]],
                                [blockId + 8, ["number", {value: 1}], 0, 0, [blockId + 7]],
                                [blockId + 9, ["number", {value:  staff?.meter?.value[0]?.den || 4}], 0, 0, [blockId + 7]],
                                [blockId + 10, "vspace", 0, 0, [blockId + 5, blockId + 11]],
                                [blockId + 11, "setkey2", 0, 0, [blockId + 10, blockId + 12, blockId + 13, blockId + 14]],
                                [blockId + 12, ["notename", {value: staff.key.root}], 0, 0, [blockId + 11]],
                                [blockId + 13, ["modename", {value: staff.key.mode == "m" ? "minor" : "major"}], 0, 0, [blockId + 11]],
                                //In Settimbre instead of null it should be nameddoblock of first action block
                                [blockId + 14, "settimbre", 0, 0, [blockId + 11, blockId + 15, null, blockId + 16]],
                                [blockId + 15, ["voicename", {value: instruction}], 0, 0, [blockId + 14]],
                                [blockId + 16, "hidden", 0, 0, [blockId + 14, null]]
                            ],
                            repeatBlock:[],
                            repeatArray:[],
                            nameddoArray:{},
                        };

                        // For adding 17 blocks above 
                        blockId += 17
                    }

                    let actionBlock=[]
                    staff.voices.forEach(voice => {
                        voice.forEach(element => {
                            if (element.el_type === "note") {
                                //check if triplet exists 
                                if (element?.startTriplet !== null&&element?.startTriplet !== undefined) {
                                    tripletFinder = element.startTriplet;
                                }
                                
                                // Check and set tripletFinder to null
                                // if element?.endTriplets exists.
                                _createPitchBlocks(element.pitches[0], blockId,element.duration,staff.key,actionBlock,tripletFinder,staffBlocksMap[lineId].meterDen);
                                if (element?.endTriplet !== null && element?.endTriplet !== undefined) {
                                    tripletFinder = null;
                                }
                                blockId = blockId + 9;
                            } else if(element.el_type === "bar") {
                                if (element.type === "bar_left_repeat") {
                                    staffBlocksMap[lineId].repeatArray.push({start: staffBlocksMap[lineId].baseBlocks.length, end: -1})
                                } else if (element.type === "bar_right_repeat") {
                                    const endBlockSearch = staffBlocksMap[lineId].repeatArray;

                                    for (const repeatbar in endBlockSearch) {
                                        if (endBlockSearch[repeatbar].end === -1) {
                                            staffBlocksMap[lineId].repeatArray[repeatbar].end = staffBlocksMap[lineId].baseBlocks.length;
                                        }
                                    }                     

                                }

                            }
                        });
                        
                        // Update the newnote connection with hidden
                        actionBlock[0][4][0] = blockId + 3;
                        actionBlock[actionBlock.length-1][4][1] = null;
                        
                        // Update the namedo block if not first
                        // nameddo block appear
                        if (staffBlocksMap[lineId].baseBlocks.length != 0) {
                            staffBlocksMap[lineId].baseBlocks[staffBlocksMap[lineId].baseBlocks.length - 1][0][staffBlocksMap[lineId].baseBlocks[staffBlocksMap[lineId].baseBlocks.length - 1][0].length-4][4][1] = blockId;
                        }
                        // Add the nameddo action text and hidden
                        // block for each line
                        actionBlock.push(
                            [blockId,
                             [
                                 "nameddo",
                                 {
                                     value: `V: ${parseInt(lineId)+1} Line ${staffBlocksMap[lineId]?.baseBlocks?.length + 1}`
                                 }
                             ],
                             0,
                             0,
                             [
                                 staffBlocksMap[lineId].baseBlocks.length === 0 ? null : staffBlocksMap[lineId].baseBlocks[staffBlocksMap[lineId].baseBlocks.length - 1][0][staffBlocksMap[lineId].baseBlocks[staffBlocksMap[lineId].baseBlocks.length - 1][0].length-4][0],
                                 null]
                            ],
                            [
                                blockId + 1,
                                ["action", {collapsed: false}],
                                100,
                                100,
                                [null, blockId + 2, blockId + 3, null]],
                            [
                                blockId + 2,
                                [
                                    "text",
                                    {value: `V: ${parseInt(lineId)+1} Line ${staffBlocksMap[lineId]?.baseBlocks?.length + 1}`}
                                ],
                                0,
                                0,
                                [blockId + 1]
                            ],
                            [
                                blockId + 3,
                                "hidden",
                                0,
                                0,
                                [blockId + 1, actionBlock[0][0]]
                            ]
                        ); // blockid of topaction block
                        
                        if (!staffBlocksMap[lineId].nameddoArray) {
                            staffBlocksMap[lineId].nameddoArray = {};
                        }
                        
                        // Ensure the array at nameddoArray[lineId] is initialized if it doesn't exist
                        if (!staffBlocksMap[lineId].nameddoArray[lineId]) {
                            staffBlocksMap[lineId].nameddoArray[lineId] = [];
                        }
                        
                        staffBlocksMap[lineId].nameddoArray[lineId].push(blockId);
                        blockId += 4;

                        musicBlocksJSON.push(actionBlock);
                        staffBlocksMap[lineId].baseBlocks.push([actionBlock]);
                    });
                });
            }
         
            let finalBlock = [];
            // Some Error are here need to be fixed 
            for (const staffIndex in staffBlocksMap) {
                staffBlocksMap[staffIndex].startBlock[staffBlocksMap[staffIndex].startBlock.length - 3][4][2] = staffBlocksMap[staffIndex].baseBlocks[0][0][staffBlocksMap[staffIndex].baseBlocks[0][0].length - 4][0];
                // Update the first namedo block with settimbre
                staffBlocksMap[staffIndex].baseBlocks[0][0][staffBlocksMap[staffIndex].baseBlocks[0][0].length - 4][4][0] = staffBlocksMap[staffIndex].startBlock[staffBlocksMap[staffIndex].startBlock.length - 3][0];
                let repeatblockids = staffBlocksMap[staffIndex].repeatArray;
                for (const repeatId of repeatblockids) {
                    if (repeatId.start==0) {
                        staffBlocksMap[staffIndex].repeatBlock.push(
                            [blockId,"repeat",0,0,[ staffBlocksMap[staffIndex].startBlock[staffBlocksMap[staffIndex].startBlock.length - 3][0]/*setribmre*/,blockId+1,staffBlocksMap[staffIndex].nameddoArray[staffIndex][0],staffBlocksMap[staffIndex].nameddoArray[staffIndex][repeatId.end+1] === null ? null :staffBlocksMap[staffIndex].nameddoArray[staffIndex][repeatId.end+1]]]
                        );
                        staffBlocksMap[staffIndex].repeatBlock.push(
                            [blockId + 1, ["number", {value: 2}], 100, 100, [blockId]]
                        );

                        // Update the settrimbre block
                        staffBlocksMap[staffIndex].startBlock[staffBlocksMap[staffIndex].startBlock.length - 3][4][2] = blockId;
                        let firstnammedo = _searchIndexForMusicBlock(staffBlocksMap[staffIndex].baseBlocks[0][0], staffBlocksMap[staffIndex].nameddoArray[staffIndex][0]);
                        let endnammedo = _searchIndexForMusicBlock(staffBlocksMap[staffIndex].baseBlocks[repeatId.end][0], staffBlocksMap[staffIndex].nameddoArray[staffIndex][repeatId.end]);
                        // Because its [0] is the first nammeddo block
                        // obviously. Check if
                        // staffBlocksMap[staffIndex].baseBlocks[repeatId.end+1
                        // exists and has a [0] element
                    if (staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1] && staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0]) {
                        let secondnammedo = _searchIndexForMusicBlock(
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0], 
                            staffBlocksMap[staffIndex].nameddoArray[staffIndex][repeatId.end + 1]
                        );

                        if (secondnammedo != -1) {
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0][secondnammedo][4][0] = blockId;
                        }
                    }
                        staffBlocksMap[staffIndex].baseBlocks[0][0][firstnammedo][4][0] =blockId
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.end][0][endnammedo][4][1] = null

                        blockId += 2;
                    } else {
                        const currentnammeddo =_searchIndexForMusicBlock(staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0],staffBlocksMap[staffIndex].nameddoArray[staffIndex][repeatId.start]);
                        let prevnameddo = _searchIndexForMusicBlock(staffBlocksMap[staffIndex].baseBlocks[repeatId.start-1][0],staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][currentnammeddo][4][0]);
                        let afternamedo = _searchIndexForMusicBlock(staffBlocksMap[staffIndex].baseBlocks[repeatId.end][0],staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][currentnammeddo][4][1]);
                        let prevrepeatnameddo = -1;
                        if (prevnameddo === -1) {
                            prevrepeatnameddo = _searchIndexForMusicBlock(staffBlocksMap[staffIndex].repeatBlock,staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][currentnammeddo][4][0]);
                        }
                        const prevBlockId = staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][currentnammeddo][4][0];
                        const currentBlockId = staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][currentnammeddo][0];

                        // Needs null checking optmizie
                        let nextBlockId = staffBlocksMap[staffIndex].nameddoArray[staffIndex][repeatId.end+1];
                    
                        staffBlocksMap[staffIndex].repeatBlock.push(
                            [blockId,"repeat",0,0,[staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][currentnammeddo][4][0],blockId+1, currentBlockId,nextBlockId === null ? null : nextBlockId]]
                        );
                        staffBlocksMap[staffIndex].repeatBlock.push(
                            [blockId + 1, ["number", {value: 2}], 100, 100, [blockId]]
                        );
                        if (prevnameddo != -1) {
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.start-1][0][prevnameddo][4][1] = blockId;
                        } else {
                            staffBlocksMap[staffIndex].repeatBlock[prevrepeatnameddo][4][3] = blockId;
                        }
                        if (afternamedo !== -1) {
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end][0][afternamedo][4][1] = null;;
                        }
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][currentnammeddo][4][0] = blockId;
                        if (nextBlockId  !== null ) {
                            const nextnameddo = _searchIndexForMusicBlock(staffBlocksMap[staffIndex].baseBlocks[repeatId.end+1][0],nextBlockId);
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end +1][0][nextnameddo][4][0] = blockId;
                        }
                        blockId += 2;
                    }
                }

                let lineBlock = staffBlocksMap[staffIndex].baseBlocks.reduce((acc, curr) => acc.concat(curr), []);
                // Flatten the multidimensional array
                let flattenedLineBlock = lineBlock.flat();
                let combinedBlock = [...staffBlocksMap[staffIndex].startBlock, ...flattenedLineBlock];
                
                finalBlock.push(...staffBlocksMap[staffIndex].startBlock);
                finalBlock.push(...flattenedLineBlock);
                finalBlock.push(...staffBlocksMap[staffIndex].repeatBlock);
                    
            }
            this.blocks.loadNewBlocks(finalBlock);
            return null;
        }

        /**
         * Calculate time such that no matter how long it takes to load the program, the loading
         * animation will cycle at least once.
         * @param loadProject all params are from load project function
         */
        this.loadStartWrapper = async (func, arg1, arg2, arg3) => {
            const time1 = new Date();
            await func(this, arg1, arg2, arg3);

            const time2 = new Date();
            const elapsedTime = time2.getTime() - time1.getTime();
            const timeLeft = Math.max(6000 - elapsedTime);
            setTimeout(this.showContents, timeLeft);
        };

        /*
         * Hides the loading animation and unhides the background.
         * Shows contents of MB after loading screen.
         */
        this.showContents = () => {
            docById("loading-image-container").style.display = "none";
            docById("palette").style.display = "block";
            // docById('canvas').style.display = 'none';
            docById("hideContents").style.display = "block";
            docById("buttoncontainerBOTTOM").style.display = "block";
            docById("buttoncontainerTOP").style.display = "block";
        };

        this.justLoadStart = () => {
            this.blocks.loadNewBlocks(DATAOBJS);
        };

        /*
         * Sets up a new "clean" MB i.e. new project instance
         */
        const _afterDelete = (that) => {
            if (that.turtles.running()) {
                that._doHardStopButton();
            }

            // Use the planet New Project mechanism if it is available,
            // but only if the current project has a name.
            if (that.planet !== undefined && that.planet.getCurrentProjectName() !== _("My Project")) {
                that.planet.saveLocally();
                that.planet.initialiseNewProject();
                loadStart(that);
                that.planet.saveLocally();
            } else {
                that.toolbar.closeAuxToolbar(showHideAuxMenu);

                setTimeout(() => {
                    // Don't create the new blocks in sendAllToTrash so as to
                    // avoid clearing the screen of any graphics. Do it here
                    // instead.
                    that.sendAllToTrash(false, false);
                    that.blocks.loadNewBlocks(DATAOBJS);
                }, 1000);
            }
        };

        /*
         * Hides all message containers
         */
        this.hideMsgs = () => {
            // FIXME: When running before everything is set up.
            if (this.errorMsgText === null) {
                return;
            }
            this.errorMsgText.parent.visible = false;
            this.errorText.classList.remove("show");
            this._hideArrows();

            this.msgText.parent.visible = false;
            this.printText.classList.remove("show");
            for (const i in this.errorArtwork) {
                this.errorArtwork[i].visible = false;
            }

            this.refreshCanvas();
        };

        // Accessed from index.html
        // eslint-disable-next-line no-unused-vars
        const hideArrows = () => {
            globalActivity._hideArrows();
        };

        this._hideArrows = () => {
            if (this.errorMsgArrow !== null) {
                this.errorMsgArrow.removeAllChildren();
                this.refreshCanvas();
            }
        };

        this.textMsg = (msg,duration = _MSGTIMEOUT_) => {
            if (this.msgTimeoutID !== null) {
                clearTimeout(this.msgTimeoutID);
                this.msgTimeoutID = null;
            }

            if (this.msgText === null) {
                // The container may not be ready yet, so do nothing.
                return;
            }

            this.printText.classList.add("show");
            this.printTextContent.innerHTML = msg;

            const that = this;
            this.msgTimeoutID = setTimeout(() => {
                that.printText.classList.remove("show");
                that.msgTimeoutID = null;
            }, duration);
        };

        this.errorMsg = (msg, blk, text, timeout) => {
            if (this.errorMsgTimeoutID !== null) {
                clearTimeout(this.errorMsgTimeoutID);
            }

            // The container may not be ready yet, so do nothing.
            if (this.errorMsgText === null) {
                return;
            }

            if (
                blk !== undefined &&
                blk !== null &&
                blk in this.blocks.blockList &&
                !this.blocks.blockList[blk].collapsed
            ) {
                const fromX = (this.canvas.width) / 2;
                const fromY = 128;
                const toX = this.blocks.blockList[blk].container.x + this.blocksContainer.x;
                const toY = this.blocks.blockList[blk].container.y + this.blocksContainer.y;

                if (this.errorMsgArrow === null) {
                    this.errorMsgArrow = new createjs.Container();
                    this.stage.addChild(this.errorMsgArrow);
                }

                const line = new createjs.Shape();
                this.errorMsgArrow.addChild(line);
                line.graphics
                    .setStrokeStyle(4)
                    .beginStroke("#ff0031")
                    .moveTo(fromX, fromY)
                    .lineTo(toX, toY);
                this.stage.setChildIndex(this.errorMsgArrow, this.stage.children.length - 1);

                const angle = (Math.atan2(toX - fromX, fromY - toY) / Math.PI) * 180;
                const head = new createjs.Shape();
                this.errorMsgArrow.addChild(head);
                head.graphics
                    .setStrokeStyle(4)
                    .beginStroke("#ff0031")
                    .moveTo(-10, 18)
                    .lineTo(0, 0)
                    .lineTo(10, 18);
                head.x = toX;
                head.y = toY;
                head.rotation = angle;
            }

            switch (msg) {
                case NOMICERRORMSG:
                    this.errorArtwork["nomicrophone"].visible = true;
                    this.stage.setChildIndex(
                        this.errorArtwork["nomicrophone"],
                        this.stage.children.length - 1
                    );
                    break;
                case NOSTRINGERRORMSG:
                    this.errorArtwork["notastring"].visible = true;
                    this.stage.setChildIndex(
                        this.errorArtwork["notastring"],
                        this.stage.children.length - 1
                    );
                    break;
                case EMPTYHEAPERRORMSG:
                    this.errorArtwork["emptyheap"].visible = true;
                    this.stage.setChildIndex(
                        this.errorArtwork["emptyheap"],
                        this.stage.children.length - 1
                    );
                    break;
                case NOSQRTERRORMSG:
                    this.errorArtwork["negroot"].visible = true;
                    this.stage.setChildIndex(
                        this.errorArtwork["negroot"],
                        this.stage.children.length - 1
                    );
                    break;
                case NOACTIONERRORMSG:
                    if (text === null) {
                        text = "foo";
                    }

                    this.errorArtwork["nostack"].children[1].text = text;
                    this.errorArtwork["nostack"].visible = true;
                    this.errorArtwork["nostack"].updateCache();
                    this.stage.setChildIndex(
                        this.errorArtwork["nostack"],
                        this.stage.children.length - 1
                    );
                    break;
                case NOBOXERRORMSG:
                    if (text === null) {
                        text = "foo";
                    }

                    this.errorArtwork["emptybox"].children[1].text = text;
                    this.errorArtwork["emptybox"].visible = true;
                    this.errorArtwork["emptybox"].updateCache();
                    this.stage.setChildIndex(
                        this.errorArtwork["emptybox"],
                        this.stage.children.length - 1
                    );
                    break;
                case ZERODIVIDEERRORMSG:
                    this.errorArtwork["zerodivide"].visible = true;
                    this.stage.setChildIndex(
                        this.errorArtwork["zerodivide"],
                        this.stage.children.length - 1
                    );
                    break;
                case NANERRORMSG:
                    this.errorArtwork["notanumber"].visible = true;
                    this.stage.setChildIndex(
                        this.errorArtwork["notanumber"],
                        this.stage.children.length - 1
                    );
                    break;
                case NOINPUTERRORMSG:
                    this.errorArtwork["noinput"].visible = true;
                    this.stage.setChildIndex(
                        this.errorArtwork["noinput"],
                        this.stage.children.length - 1
                    );
                    break;
                default:
                    // Show and populate errorText div
                    this.errorText.classList.add("show");
                    this.errorTextContent.innerHTML = msg;
                    break;
            }

            let myTimeout = _ERRORMSGTIMEOUT_;
            if (timeout !== undefined) {
                myTimeout = timeout;
            }

            if (myTimeout > 0) {
                const that = this;
                this.errorMsgTimeoutID = setTimeout(() => {
                    that.hideMsgs();
                }, myTimeout);
            }

            this.refreshCanvas();
        };

        /*
         * Hides cartesian grid
         */
        this._hideCartesian = () => {
            this.cartesianBitmap.visible = false;
            this.cartesianBitmap.updateCache();
            this.update = true;
        };

        /*
         * Shows cartesian grid
         */
        this._showCartesian = () => {
            this.cartesianBitmap.visible = true;
            this.cartesianBitmap.updateCache();
            this.update = true;
        };

        /*
         * Hides polar grid
         */
        this._hidePolar = () => {
            this.polarBitmap.visible = false;
            this.polarBitmap.updateCache();
            this.update = true;
        };

        /*
         * Shows polar grid
         */
        this._showPolar = () => {
            this.polarBitmap.visible = true;
            this.polarBitmap.updateCache();
            this.update = true;
        };

        /*
         * Hides accidentals
         */
        this._hideAccidentals = () => {
            const newX = this.canvas.width / (2 * this.turtleBlocksScale) - 600;
            for (let i = 0; i < 7; i++) {
                this.grandSharpBitmap[i].visible = false;
                this.grandSharpBitmap[i].x = newX;
                this.grandSharpBitmap[i].updateCache();
                this.grandFlatBitmap[i].visible = false;
                this.grandFlatBitmap[i].x = newX;
                this.grandFlatBitmap[i].updateCache();

                this.trebleSharpBitmap[i].visible = false;
                this.trebleSharpBitmap[i].x = newX;
                this.trebleSharpBitmap[i].updateCache();
                this.trebleFlatBitmap[i].visible = false;
                this.trebleFlatBitmap[i].x = newX;
                this.trebleFlatBitmap[i].updateCache();

                this.sopranoSharpBitmap[i].visible = false;
                this.sopranoSharpBitmap[i].x = newX;
                this.sopranoSharpBitmap[i].updateCache();
                this.sopranoFlatBitmap[i].visible = false;
                this.sopranoFlatBitmap[i].x = newX;
                this.sopranoFlatBitmap[i].updateCache();

                this.altoSharpBitmap[i].visible = false;
                this.altoSharpBitmap[i].x = newX;
                this.altoSharpBitmap[i].updateCache();
                this.altoFlatBitmap[i].visible = false;
                this.altoFlatBitmap[i].x = newX;
                this.altoFlatBitmap[i].updateCache();

                this.tenorSharpBitmap[i].visible = false;
                this.tenorSharpBitmap[i].x = newX;
                this.tenorSharpBitmap[i].updateCache();
                this.tenorFlatBitmap[i].visible = false;
                this.tenorFlatBitmap[i].x = newX;
                this.tenorFlatBitmap[i].updateCache();

                this.bassSharpBitmap[i].visible = false;
                this.bassSharpBitmap[i].x = newX;
                this.bassSharpBitmap[i].updateCache();
                this.bassFlatBitmap[i].visible = false;
                this.bassFlatBitmap[i].x = newX;
                this.bassFlatBitmap[i].updateCache();
            }
            this.update = true;
        };

        /*
         * Hides musical treble staff
         */
        this._hideTreble = () => {
            this.trebleBitmap.visible = false;
            this.trebleBitmap.updateCache();
            this._hideAccidentals();
            this.update = true;
        };

        /*
         * Shows musical treble staff
         */
        this._showTreble = () => {
            this.trebleBitmap.visible = true;
            this.trebleBitmap.updateCache();
            this._hideAccidentals();
            // eslint-disable-next-line no-console
            console.log(this.KeySignatureEnv[0] + " " + this.KeySignatureEnv[1]);
            const scale = buildScale(this.KeySignatureEnv[0] + " " + this.KeySignatureEnv[1])[0];
            // eslint-disable-next-line no-console
            console.log(scale);
            const _sharps = ["F" + SHARP, "C" + SHARP, "G" + SHARP, "D" + SHARP, "A" + SHARP, "E" + SHARP, "B" + SHARP];
            const _flats = ["B" + FLAT, "E" + FLAT, "A" + FLAT, "D" + FLAT, "G" + FLAT, "C" + FLAT, "F" + FLAT];
            let dx = 0;
            for (let i = 0; i < 7; i++) {
                if (scale.includes(_sharps[i])) {
                    this.trebleSharpBitmap[i].x += dx;
                    this.trebleSharpBitmap[i].visible = true;
                    this.trebleSharpBitmap[i].updateCache();
                    dx += 15;
                }
                if (scale.includes(_flats[i])) {
                    this.trebleFlatBitmap[i].x += dx;
                    this.trebleFlatBitmap[i].visible = true;
                    this.trebleFlatBitmap[i].updateCache();
                    dx += 15;
                }
            }

            this.update = true;
        };

        /*
         * Hides musical grand staff
         */
        this._hideGrand = () => {
            this.grandBitmap.visible = false;
            this.grandBitmap.updateCache();
            this._hideAccidentals();
            this.update = true;
        };

        /*
         * Shows musical grand staff
         */
        this._showGrand = () => {
            this.grandBitmap.visible = true;
            this.grandBitmap.updateCache();
            this._hideAccidentals();
            // eslint-disable-next-line no-console
            console.log(this.KeySignatureEnv[0] + " " + this.KeySignatureEnv[1]);
            const scale = buildScale(this.KeySignatureEnv[0] + " " + this.KeySignatureEnv[1])[0];
            // eslint-disable-next-line no-console
            console.log(scale);
            const _sharps = ["F" + SHARP, "C" + SHARP, "G" + SHARP, "D" + SHARP, "A" + SHARP, "E" + SHARP, "B" + SHARP];
            const _flats = ["B" + FLAT, "E" + FLAT, "A" + FLAT, "D" + FLAT, "G" + FLAT, "C" + FLAT, "F" + FLAT];
            let dx = 0;
            for (let i = 0; i < 7; i++) {
                if (scale.includes(_sharps[i])) {
                    this.grandSharpBitmap[i].x += dx;
                    this.grandSharpBitmap[i].visible = true;
                    this.grandSharpBitmap[i].updateCache();
                    dx += 15;
                }
                if (scale.includes(_flats[i])) {
                    this.grandFlatBitmap[i].x += dx;
                    this.grandFlatBitmap[i].visible = true;
                    this.grandFlatBitmap[i].updateCache();
                    dx += 15;
                }
            }
            this.update = true;
        };

        /*
         * Hides musical soprano staff
         */
        this._hideSoprano = () => {
            this.sopranoBitmap.visible = false;
            this.sopranoBitmap.updateCache();
            this.update = true;
        };

        /*
         * Shows musical soprano staff
         */
        this._showSoprano = () => {
            this.sopranoBitmap.visible = true;
            this.sopranoBitmap.updateCache();
            this._hideAccidentals();
            // eslint-disable-next-line no-console
            console.log(this.KeySignatureEnv[0] + " " + this.KeySignatureEnv[1]);
            const scale = buildScale(this.KeySignatureEnv[0] + " " + this.KeySignatureEnv[1])[0];
            // eslint-disable-next-line no-console
            console.log(scale);
            const _sharps = ["F" + SHARP, "C" + SHARP, "G" + SHARP, "D" + SHARP, "A" + SHARP, "E" + SHARP, "B" + SHARP];
            const _flats = ["B" + FLAT, "E" + FLAT, "A" + FLAT, "D" + FLAT, "G" + FLAT, "C" + FLAT, "F" + FLAT];
            let dx = 0;
            for (let i = 0; i < 7; i++) {
                if (scale.includes(_sharps[i])) {
                    this.sopranoSharpBitmap[i].x += dx;
                    this.sopranoSharpBitmap[i].visible = true;
                    this.sopranoSharpBitmap[i].updateCache();
                    dx += 15;
                }
                if (scale.includes(_flats[i])) {
                    this.sopranoFlatBitmap[i].x += dx;
                    this.sopranoFlatBitmap[i].visible = true;
                    this.sopranoFlatBitmap[i].updateCache();
                    dx += 15;
                }
            }

            this.update = true;
        };

        /*
         * Hides musical alto staff
         */
        this._hideAlto = () => {
            this.altoBitmap.visible = false;
            this.altoBitmap.updateCache();
            this._hideAccidentals();
            this.update = true;
        };

        this.__showAltoAccidentals = () => {
        };

        /*
         * Shows musical alto staff
         */
        this._showAlto = () => {
            this.altoBitmap.visible = true;
            this.altoBitmap.updateCache();
            this._hideAccidentals();
            // eslint-disable-next-line no-console
            console.log(this.KeySignatureEnv[0] + " " + this.KeySignatureEnv[1]);
            const scale = buildScale(this.KeySignatureEnv[0] + " " + this.KeySignatureEnv[1])[0];
            // eslint-disable-next-line no-console
            console.log(scale);
            const _sharps = ["F" + SHARP, "C" + SHARP, "G" + SHARP, "D" + SHARP, "A" + SHARP, "E" + SHARP, "B" + SHARP];
            const _flats = ["B" + FLAT, "E" + FLAT, "A" + FLAT, "D" + FLAT, "G" + FLAT, "C" + FLAT, "F" + FLAT];
            let dx = 0;
            for (let i = 0; i < 7; i++) {
                if (scale.includes(_sharps[i])) {
                    this.altoSharpBitmap[i].x += dx;
                    this.altoSharpBitmap[i].visible = true;
                    this.altoSharpBitmap[i].updateCache();
                    dx += 15;
                }
                if (scale.includes(_flats[i])) {
                    this.altoFlatBitmap[i].x += dx;
                    this.altoFlatBitmap[i].visible = true;
                    this.altoFlatBitmap[i].updateCache();
                    dx += 15;
                }
            }

            this.update = true;
        };

        /*
         * Hides musical tenor staff
         */
        this._hideTenor = () => {
            this.tenorBitmap.visible = false;
            this.tenorBitmap.updateCache();
            this.update = true;
        };

        /*
         * Shows musical tenor staff
         */
        this._showTenor = () => {
            this.tenorBitmap.visible = true;
            this.tenorBitmap.updateCache();
            this._hideAccidentals();
            // eslint-disable-next-line no-console
            console.log(this.KeySignatureEnv[0] + " " + this.KeySignatureEnv[1]);
            const scale = buildScale(this.KeySignatureEnv[0] + " " + this.KeySignatureEnv[1])[0];
            // eslint-disable-next-line no-console
            console.log(scale);
            const _sharps = ["F" + SHARP, "C" + SHARP, "G" + SHARP, "D" + SHARP, "A" + SHARP, "E" + SHARP, "B" + SHARP];
            const _flats = ["B" + FLAT, "E" + FLAT, "A" + FLAT, "D" + FLAT, "G" + FLAT, "C" + FLAT, "F" + FLAT];
            let dx = 0;
            for (let i = 0; i < 7; i++) {
                if (scale.includes(_sharps[i])) {
                    this.tenorSharpBitmap[i].x += dx;
                    this.tenorSharpBitmap[i].visible = true;
                    this.tenorSharpBitmap[i].updateCache();
                    dx += 15;
                }
                if (scale.includes(_flats[i])) {
                    this.tenorFlatBitmap[i].x += dx;
                    this.tenorFlatBitmap[i].visible = true;
                    this.tenorFlatBitmap[i].updateCache();
                    dx += 15;
                }
            }

            this.update = true;
        };

        /*
         * Hides musical bass staff
         */
        this._hideBass = () => {
            this.bassBitmap.visible = false;
            this.bassBitmap.updateCache();
            this._hideAccidentals();
            this.update = true;
        };

        /*
         * Shows musical bass staff
         */
        this._showBass = () => {
            this.bassBitmap.visible = true;
            this.bassBitmap.updateCache();
            this._hideAccidentals();
            // eslint-disable-next-line no-console
            console.log(this.KeySignatureEnv[0] + " " + this.KeySignatureEnv[1]);
            const scale = buildScale(this.KeySignatureEnv[0] + " " + this.KeySignatureEnv[1])[0];
            // eslint-disable-next-line no-console
            console.log(scale);
            const _sharps = ["F" + SHARP, "C" + SHARP, "G" + SHARP, "D" + SHARP, "A" + SHARP, "E" + SHARP, "B" + SHARP];
            const _flats = ["B" + FLAT, "E" + FLAT, "A" + FLAT, "D" + FLAT, "G" + FLAT, "C" + FLAT, "F" + FLAT];
            let dx = 0;
            for (let i = 0; i < 7; i++) {
                if (scale.includes(_sharps[i])) {
                    this.bassSharpBitmap[i].x += dx;
                    this.bassSharpBitmap[i].visible = true;
                    this.bassSharpBitmap[i].updateCache();
                    dx += 15;
                }
                if (scale.includes(_flats[i])) {
                    this.bassFlatBitmap[i].x += dx;
                    this.bassFlatBitmap[i].visible = true;
                    this.bassFlatBitmap[i].updateCache();
                    dx += 15;
                }
            }

            this.update = true;
        };

        /*
         * We don't save blocks in the trash, so we need to
         * consolidate the block list and remap the connections.
         */
        this.prepareExport = () => {
            const blockMap = [];
            this.hasMatrixDataBlock = false;
            for (let blk = 0; blk < this.blocks.blockList.length; blk++) {
                const myBlock = this.blocks.blockList[blk];
                if (myBlock.trash) {
                    // Don't save blocks in the trash.
                    continue;
                }

                blockMap.push(blk);
            }

            const data = [];
            for (let blk = 0; blk < this.blocks.blockList.length; blk++) {
                const myBlock = this.blocks.blockList[blk];
                let args = null;

                if (myBlock.trash) {
                    // Don't save blocks in the trash.
                    continue;
                }

                if (
                    myBlock.isValueBlock() ||
                    myBlock.name === "loadFile" ||
                    myBlock.name === "boolean"
                ) {
                    // FIX ME: scale image if it exceeds a maximum size.
                    switch (myBlock.name) {
                        case "namedbox":
                        case "namedarg":
                            args = {
                                value: myBlock.privateData
                            };
                            break;
                        default:
                            args = {
                                value: myBlock.value
                            };
                    }
                } else {
                    switch (myBlock.name) {
                        case "start":
                        case "drum":
                            // Find the turtle associated with this block.
                            // eslint-disable-next-line no-case-declarations
                            const turtle = this.turtles.turtleList[myBlock.value];
                            if (turtle === null || turtle === undefined) {
                                args = {
                                    id: this.turtles.turtleList.length,
                                    collapsed: false,
                                    xcor: 0,
                                    ycor: 0,
                                    heading: 0,
                                    color: 0,
                                    shade: 50,
                                    pensize: 5,
                                    grey: 100
                                };
                            } else {
                                args = {
                                    id: turtle.id,
                                    collapsed: myBlock.collapsed,
                                    xcor: turtle.x,
                                    ycor: turtle.y,
                                    heading: turtle.orientation,
                                    color: turtle.painter.color,
                                    shade: turtle.painter.value,
                                    pensize: turtle.painter.stroke,
                                    grey: turtle.painter.chroma
                                    // 'name': turtle.name
                                };
                            }
                            break;
                        case "temperament1":
                            if (this.blocks.customTemperamentDefined) {
                                // If a define temperament block is
                                // present, find the value of the arg
                                // block to get the name of the custom
                                // temperament.
                                let customName = "custom";
                                if (myBlock.connections[1] !== null) {
                                    // eslint-disable-next-line max-len
                                    customName = this.blocks.blockList[myBlock.connections[1]].value;
                                }
                                // eslint-disable-next-line no-console
                                console.log(customName);
                                args = {
                                    customName: customName,
                                    customTemperamentNotes: getTemperament(customName),
                                    startingPitch: this.logo.synth.startingPitch,
                                    octaveSpace: getOctaveRatio()
                                };
                            }
                            break;
                        case "interval":
                        case "newnote":
                        case "action":
                        case "matrix":
                        case "pitchdrummatrix":
                        case "rhythmruler":
                        case "timbre":
                        case "pitchstaircase":
                        case "tempo":
                        case "pitchslider":
                        case "musickeyboard":
                        case "modewidget":
                        case "meterwidget":
                        case "status":
                            args = {
                                collapsed: myBlock.collapsed
                            };
                            break;
                        case "storein2":
                        case "nameddo":
                        case "nameddoArg":
                        case "namedcalc":
                        case "namedcalcArg":
                        case "outputtools":
                            args = {
                                value: myBlock.privateData
                            };
                            break;
                        case "nopValueBlock":
                        case "nopZeroArgBlock":
                        case "nopOneArgBlock":
                        case "nopTwoArgBlock":
                        case "nopThreeArgBlock":
                            // restore original block name
                            myBlock.name = myBlock.privateData;
                            break;
                        case "matrixData":
                            // deprecated
                            args = {
                                notes: window.savedMatricesNotes,
                                count: window.savedMatricesCount
                            };
                            this.hasMatrixDataBlock = true;
                            break;
                        case "wrapmode":
                            args = {
                                value: myBlock.value
                            };
                            break;
                        default:
                            break;
                    }
                }

                const connections = [];
                for (let c = 0; c < myBlock.connections.length; c++) {
                    const mapConnection = blockMap.indexOf(myBlock.connections[c]);
                    if (myBlock.connections[c] === null || mapConnection === -1) {
                        connections.push(null);
                    } else {
                        connections.push(mapConnection);
                    }
                }

                if (args === null) {
                    data.push([
                        blockMap.indexOf(blk),
                        myBlock.name,
                        myBlock.container.x,
                        myBlock.container.y,
                        connections
                    ]);
                } else {
                    data.push([
                        blockMap.indexOf(blk),
                        [myBlock.name, args],
                        myBlock.container.x,
                        myBlock.container.y,
                        connections
                    ]);
                }
            }

            return JSON.stringify(data);
        };

        /*
         * Opens plugin by clicking on the plugin open chooser in the DOM (.json).
         */
        const doOpenPlugin = (activity) => {
            activity._doOpenPlugin();
        };

        this._doOpenPlugin = () => {
            this.toolbar.closeAuxToolbar(showHideAuxMenu);
            this.pluginChooser.focus();
            this.pluginChooser.click();
        };

        /*
         * Specifies that loading an MB project should merge it
         * within the existing project
         */
        const _doMergeLoad = (that) => {
            doLoad(that, true);
        };

        /*
         * Sets up palette buttons and functions
         * e.g. Home, Collapse, Expand
         * These menu items are on the canvas, not the toolbar.
         */
        this._setupPaletteMenu = () => {
            const btnSize = this.cellSize;
            const createButton = (icon, label, action) => {
                const button = this._makeButton(icon, label, x, y, btnSize, 0);
                this._loadButtonDragHandler(button, action, this);
                x += btnSize;
                return button;
            };

            let x = window.innerWidth - 4 * btnSize - 27.5;
            const y = window.innerHeight - 57.5;

            const removeButtonContainer = docById("buttoncontainerBOTTOM");
            if (removeButtonContainer) {
                removeButtonContainer.parentNode.removeChild(removeButtonContainer);
            }

            const ButtonHolder = document.createElement("div");
            ButtonHolder.setAttribute("id", "buttoncontainerBOTTOM");
            ButtonHolder.style.display = "block";
            document.body.appendChild(ButtonHolder);

            this.homeButtonContainer = createButton(GOHOMEFADEDBUTTON,
                _("Home") + " [" + _("Home").toUpperCase() + "]",
                findBlocks
            );
            this.boundary.hide();

            if (!this.helpfulWheelItems.find(ele => ele.label === "Home [HOME]")) 
                this.helpfulWheelItems.push({label: "Home [HOME]", icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(GOHOMEFADEDBUTTON)), display: true, fn: findBlocks});

            this.hideBlocksContainer = createButton(SHOWBLOCKSBUTTON, _("Show/hide block"),
                changeBlockVisibility);

            if (!this.helpfulWheelItems.find(ele => ele.label === "Show/hide block")) 
                this.helpfulWheelItems.push({label: "Show/hide block", icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(SHOWBLOCKSBUTTON)), display: true, fn: changeBlockVisibility});
            
            this.collapseBlocksContainer = createButton(COLLAPSEBLOCKSBUTTON, _("Expand/collapse blocks"),
                toggleCollapsibleStacks);

            if (!this.helpfulWheelItems.find(ele => ele.label === "Expand/collapse blocks")) 
                this.helpfulWheelItems.push({label: "Expand/collapse blocks", icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(COLLAPSEBLOCKSBUTTON)), display: true, fn: toggleCollapsibleStacks});
            
            this.smallerContainer = createButton(SMALLERBUTTON, _("Decrease block size"),
                doSmallerBlocks);
            
            if (!this.helpfulWheelItems.find(ele => ele.label === "Decrease block size")) 
                this.helpfulWheelItems.push({label: "Decrease block size", icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(SMALLERBUTTON)), display: true, fn: doSmallerBlocks});
            
            this.largerContainer = createButton(BIGGERBUTTON, _("Increase block size"),
                doLargerBlocks);
            
            if (!this.helpfulWheelItems.find(ele => ele.label === "Increase block size")) 
                this.helpfulWheelItems.push({label: "Increase block size", icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(BIGGERBUTTON)), display: true, fn: doLargerBlocks});

            if (!this.helpfulWheelItems.find(ele => ele.label === "Restore")) 
                this.helpfulWheelItems.push({label: "Restore", icon: "imgsrc:header-icons/restore-from-trash.svg", display: true, fn: restoreTrash});
            
            if (!this.helpfulWheelItems.find(ele => ele.label === "Turtle Wrap Off"))
                this.helpfulWheelItems.push({label: "Turtle Wrap Off", icon: "imgsrc:header-icons/wrap-text.svg", display: true, fn: this.toolbar.changeWrap});

            if (!this.helpfulWheelItems.find(ele => ele.label === "Turtle Wrap On"))
                this.helpfulWheelItems.push({label: "Turtle Wrap On", icon: "imgsrc:header-icons/wrap-text.svg", display: false, fn: this.toolbar.changeWrap});

            if (!this.helpfulWheelItems.find(ele => ele.label === "Enable horizontal scrolling")) 
                this.helpfulWheelItems.push({label: "Enable horizontal scrolling", icon: "imgsrc:header-icons/compare-arrows.svg", display: this.beginnerMode ? false: true, fn: setScroller});
            
            if (!this.helpfulWheelItems.find(ele => ele.label === "Disable horizontal scrolling")) 
                this.helpfulWheelItems.push({label: "Disable horizontal scrolling", icon: "imgsrc:header-icons/lock.svg", display: false, fn: setScroller});
            
            if (_THIS_IS_MUSIC_BLOCKS_ && !this.helpfulWheelItems.find(ele => ele.label === "Set Pitch Preview")) 
                this.helpfulWheelItems.push({label: "Set Pitch Preview", icon: "imgsrc:header-icons/music-note.svg", display: true, fn: chooseKeyMenu});
        
            if (!this.helpfulWheelItems.find(ele => ele.label === "Grid")) 
                this.helpfulWheelItems.push({label: "Grid", icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(CARTESIANBUTTON)), display: true, fn: piemenuGrid});

            if (!this.helpfulWheelItems.find(ele => ele.label === "Select")) 
                this.helpfulWheelItems.push({label: "Select", icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(SELECTBUTTON)), display: true, fn: this.selectMode });
        
            if (!this.helpfulWheelItems.find(ele => ele.label === "Clean")) 
                this.helpfulWheelItems.push({label: "Clean", icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(CLEARBUTTON)), display: true, fn: () => this._allClear(false)});
            
            if (!this.helpfulWheelItems.find(ele => ele.label === "Collapse")) 
                this.helpfulWheelItems.push({label: "Collapse", icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(COLLAPSEBUTTON)), display: true, fn: this.turtles.collapse});
        
            if (!this.helpfulWheelItems.find(ele => ele.label === "Expand")) 
                this.helpfulWheelItems.push({label: "Expand", icon: "imgsrc:data:image/svg+xml;base64," + window.btoa(base64Encode(EXPANDBUTTON)), display: false, fn: this.turtles.expand});
        
            if (!this.helpfulWheelItems.find(ele => ele.label === "Search for Blocks")) 
                this.helpfulWheelItems.push({label: "Search for Blocks", icon: "imgsrc:header-icons/search-button.svg", display: true, fn: this._displayHelpfulSearchDiv});
        
            if (!this.helpfulWheelItems.find(ele => ele.label === "Paste previous stack")) 
                this.helpfulWheelItems.push({label: "Paste previous stack", icon: "imgsrc:header-icons/copy-button.svg", display: false, fn: this.turtles.expand});
            if(!this.helpfulWheelItems.find(ele => ele.label=== "Close"))
                this.helpfulWheelItems.push({label: "Close", icon: "imgsrc:header-icons/cancel-button.svg",
                display: true, fn: this._hideHelpfulSearchWidget});
        
        };

        /*
         * Shows search widget on helpfulSearchDiv
         */
        this.showHelpfulSearchWidget = () => {
            // Bring widget to top.
            const $j = jQuery.noConflict();
            if ($j("#helpfulSearch")) {
                try {
                    $j("#helpfulSearch").autocomplete("destroy");
                } catch {}
            }
            this.helpfulSearchWidget.style.zIndex = 1001;
            this.helpfulSearchWidget.idInput_custom = "";
            if (this.helpfulSearchDiv.style.display === "block") {

                this.helpfulSearchWidget.value = null;
                this.helpfulSearchWidget.style.visibility = "visible";

                this.searchBlockPosition = [100, 100];
                this.prepSearchWidget();

                const that = this;
                setTimeout(() => {
                    that.helpfulSearchWidget.focus();
                    that.doHelpfulSearch();
                }, 500);

                docById("helpfulWheelDiv").style.display = "none";
            }
        };

        /*
         * Uses JQuery to add autocompleted search suggestions
         */
        this.doHelpfulSearch = () => {
            const $j = jQuery.noConflict();

            const that = this;
            $j("#helpfulSearch").autocomplete({
                source: that.searchSuggestions,
                select: (event, ui) => {
                    event.preventDefault();
                    that.helpfulSearchWidget.value = ui.item.label;
                    that.helpfulSearchWidget.idInput_custom = ui.item.value;
                    that.helpfulSearchWidget.protoblk = ui.item.specialDict;
                    that.doHelpfulSearch();
                },
                focus: (event, ui) => {
                    event.preventDefault();
                    that.helpfulSearchWidget.value = ui.item.label;
                }
            });

            $j("#helpfulSearch").autocomplete("widget").addClass("scrollSearch");

            $j("#helpfulSearch").autocomplete("instance")._renderItem = (ul, item) => {
                return $j("<li></li>")
                    .data("item.autocomplete", item)
                    .append(
                        '<img src="' +
                            item.artwork +
                            '" height = "20px">' +
                            "<a>" +
                            " " +
                            item.label +
                            "</a>"
                    )
                    .appendTo(ul.css("z-index", 9999));
            };
            const searchInput = this.helpfulSearchWidget.idInput_custom;
            if (!searchInput || searchInput.length <= 0) return;

            const protoblk = this.helpfulSearchWidget.protoblk;
            const paletteName = protoblk.palette.name;
            const protoName = protoblk.name;

            // eslint-disable-next-line no-prototype-builtins
            if (this.blocks.protoBlockDict.hasOwnProperty(protoName)) {
                this.palettes.dict[paletteName].makeBlockFromSearch(
                    protoblk,
                    protoName,
                    (newBlock) => {
                        that.blocks.moveBlock(
                            newBlock,
                            100 + that.searchBlockPosition[0] - that.blocksContainer.x,
                            that.searchBlockPosition[1] - that.blocksContainer.y
                        );
                    }
                );

                // Move the position of the next newly created block.
                this.searchBlockPosition[0] += STANDARDBLOCKHEIGHT;
                this.searchBlockPosition[1] += STANDARDBLOCKHEIGHT;
            } else if (this.deprecatedBlockNames.indexOf(searchInput) > -1) {
                this.errorMsg(_("This block is deprecated."));
            } else {
                this.errorMsg(_("Block cannot be found."));
            }

            this.helpfulSearchWidget.value = "";
            // Hide search div after search is complete.
            docById("helpfulSearchDiv").style.display = "none";
            this.update = true;
        };

        /**
         * Toggles display of javaScript editor widget.
         */
        const toggleJSWindow = (activity) => {
            new JSEditor(activity);
        };

        const doAnalytics = (activity) => {
            activity.statsWindow = new StatsWindow(activity);
        };

        /*
         * Shows help page
         */
        const showHelp = (activity) => {
            activity._showHelp();
        };

        this._showHelp = () => {
            // Will show welcome page by default.
            new HelpWidget(this, false);
        };

        /*
         * Shows about page
         */
        const showAboutPage = (activity) => {
            activity._showAboutPage();
        };

        this._showAboutPage = () => {
            // Will show welcome page by default.
            new HelpWidget(this, false);
        };

        /*
         * Makes non-toolbar buttons, e.g., the palette menu buttons
         */
        this._makeButton = (name, label, x, y) => {
            const container = document.createElement("div");
            container.setAttribute("id", "" + label);
            container.setAttribute("class", "tooltipped");
            container.setAttribute("data-tooltip", label);
            container.setAttribute("data-position", "top");
            jQuery.noConflict()(".tooltipped").tooltip({
                html: true,
                delay: 100
            });

            const that = this;
            // eslint-disable-next-line no-unused-vars
            container.onmouseover = (event) => {
                if (!that.loading) {
                    document.body.style.cursor = "pointer";
                    container.style.transition = '0.12s ease-out';
                    container.style.transform = 'scale(1.15)';
                }
            };

            // eslint-disable-next-line no-unused-vars
            container.onmouseout = (event) => {
                if (!that.loading) {
                    document.body.style.cursor = "default";
                    container.style.transition = '0.15s ease-out';
                    container.style.transform = 'scale(1)';
                }
            };

            const img = new Image();
            img.src = "data:image/svg+xml;base64," + window.btoa(base64Encode(name));

            container.appendChild(img);
            container.setAttribute(
                "style",
                "position: absolute; right:" +
                    (document.body.clientWidth - x) +
                    "px;  top: " +
                    y +
                    "px;"
            );
            docById("buttoncontainerBOTTOM").appendChild(container);
            return container;
        };

        /**
         * Handles button dragging, long hovering and prevents multiple button presses.
         * @param container longAction
         * @param hoverAction extraLongImg
         */
        this._loadButtonDragHandler = (container, actionClick, arg) => {
            const that = this;
            // eslint-disable-next-line no-unused-vars
            container.onmousedown = (event) => {
                if (!that.loading) {
                    document.body.style.cursor = "default";
                }
                actionClick(arg);
            };
        };

        /*
         * Handles pasted strings into input fields
         */
        this.pasted = () => {
            const rawData = docById("paste").value;
            let obj = "";
            if (rawData === null || rawData === "") {
                return;
            }

            const cleanData = rawData.replace("\n", " ");
            try {
                obj = JSON.parse(cleanData);
            } catch (e) {
                this.errorMsg(_("Could not parse JSON input."));
                return;
            }

            for (const name in this.palettes.dict) {
                this.palettes.dict[name].hideMenu(true);
            }

            this.refreshCanvas();

            this.blocks.loadNewBlocks(obj);
            this.pasteBox.hide();
        };

        /**
         * Handles changes in y coordinates of elements when aux toolbar is opened.
         * Repositions elements on screen by a certain amount (dy).
         * @param dy how much of a change in y
         */
        this.deltaY = (dy) => {
            this.toolbarHeight += dy;
            for (let i = 0; i < this.onscreenButtons.length; i++) {
                this.onscreenButtons[i].y += dy;
            }

            for (let i = 0; i < this.onscreenMenu.length; i++) {
                this.onscreenMenu[i].y += dy;
            }

            this.palettes.deltaY(dy);
            this.turtles.deltaY(dy);

            // this.menuContainer.y += dy;
            this.blocksContainer.y += dy;
            this.refreshCanvas();
        };

        /*
         * Ran once dom is ready and editable
         * Sets up dependencies and vars
         */
        // eslint-disable-next-line no-unused-vars
        this.domReady = async (doc) => {
            this.saveLocally = undefined;

            // Do we need to update the stage?
            this.update = true;

            // Get things started
            await this.init();
        };

        this.__saveLocally = () => {
            const data = this.prepareExport();

            if (this.storage.currentProject === undefined) {
                try {
                    this.storage.currentProject = "My Project";
                    this.storage.allProjects = JSON.stringify(["My Project"]);
                } catch (e) {
                    // Edge case, eg. Firefox localSorage DB corrupted
                    // eslint-disable-next-line no-console
                    console.error(e);
                }
            }

            let p = "";
            try {
                p = this.storage.currentProject;
                this.storage["SESSION" + p] = data;
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);
            }

            const img = new Image();
            const svgData = doSVG(
                this.canvas,
                this.logo,
                this.turtles,
                320,
                240,
                320 / this.canvas.width
            );

            img.onload = () => {
                const bitmap = new createjs.Bitmap(img);
                const bounds = bitmap.getBounds();
                bitmap.cache(bounds.x, bounds.y, bounds.width, bounds.height);
                try {
                    that.storage["SESSIONIMAGE" + p] = bitmap.bitmapCache.getCacheDataURL();
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.error(e);
                }
            };

            img.src = "data:image/svg+xml;base64," + window.btoa(base64Encode(svgData));
        };

        // Setup mouse events to start the drag

        this.setupMouseEvents = () => {
            document.addEventListener(
                "mousedown",
                (event) => {
                    if (!this.isSelecting) return;
                    this.moving = false;
                    // event.preventDefault();
                    // event.stopPropagation();
                    if (event.target.id === "myCanvas") {
                        this._createDrag(event);
                    }
                },
                false
            );
        };

        // deselect the selected blocks

        this.deselectSelectedBlocks = () => {
            this.unhighlightSelectedBlocks(false);
            this.setSelectionMode(false);
        }
 
        // end the drag on navbar
        document.getElementById("toolbars").addEventListener("mouseover", () => {this.isDragging = false;});

        this.selectMode = () => {
            this.moving = false;
            this.isSelecting = !this.isSelecting;
            (this.isSelecting) ? this.textMsg(_("Select is enabled.")) : this.textMsg(_("Select is disabled."));
        }

        this._create2Ddrag = () => {
            this.dragArea = {};
            this.selectedBlocks = [];
            this.startX = 0;
            this.startY = 0;
            this.currentX = 0;
            this.currentY = 0;
            this.hasMouseMoved = false;
            this.selectionArea = document.createElement("div");
            document.body.appendChild(this.selectionArea);
            
            this.setupMouseEvents();

            document.addEventListener("mousemove", (event) => {
                this.hasMouseMoved = true;
                // event.preventDefault();
                // this.selectedBlocks = [];
                if (this.isDragging && this.isSelecting){
                    this.currentX = event.clientX;
                    this.currentY = event.clientY;
                    if (!this.blocks.isBlockMoving && !this.turtles.running()) {
                        this.setSelectionMode(true);
                        this.drawSelectionArea();
                        this.selectedBlocks = this.selectBlocksInDragArea();
                        this.unhighlightSelectedBlocks(true, true);
                        this.blocks.setSelectedBlocks(this.selectedBlocks);
                    }    
                }
            })

            document.addEventListener("mouseup", (event) => {
               // event.preventDefault();
                if (!this.isSelecting) return;
                this.isDragging = false;
                this.selectionArea.style.display = "none";
                this.startX = 0;
                this.startY = 0;
                this.currentX = 0;
                this.currentY = 0;
                setTimeout(() => {
                    this.hasMouseMoved = false;
                }, 100);
            })
            
        };

        // Set starting points of the drag

        this._createDrag = (event) => {
            this.isDragging = true;
            this.startX = event.clientX;
            this.startY = event.clientY;
        };

        // Draw the area that has been dragged

        this.drawSelectionArea = () => {
            let x = Math.min(this.startX, this.currentX);
            let y = Math.min(this.startY, this.currentY);
            let width = Math.abs(this.currentX - this.startX);
            let height = Math.abs(this.currentY - this.startY);

            this.selectionArea.style.display = "flex";
            this.selectionArea.style.position = "absolute";
            this.selectionArea.style.left = x + "px";
            this.selectionArea.style.top = y + "px";
            this.selectionArea.style.height = height + "px";
            this.selectionArea.style.width = width + "px";
            this.selectionArea.style.zIndex = "9989";
            this.selectionArea.style.backgroundColor = "rgba(137, 207, 240, 0.5)";
            this.selectionArea.style.pointerEvents = "none";

            this.dragArea = { x, y, width, height };
        };

        // Check if the block is overlapping the dragged area.

        this.rectanglesOverlap = (rect1, rect2) => {
            return (
                rect1.x + rect1.width > rect2.x &&
                rect1.x < rect2.x + rect2.width &&
                rect1.y + rect1.height > rect2.y &&
                rect1.y < rect2.y + rect2.height
            );
        }

        // Select the blocks that overlap the dragged area.

        this.selectBlocksInDragArea = (dragArea, blocks) => {
            let selectedBlocks = [];
            this.dragRect = this.dragArea;

            this.blocks.blockList.forEach((block) => {
                    this.blockRect = {
                        x: this.scrollBlockContainer ? block.container.x + this.blocksContainer.x : block.container.x,
                        y: block.container.y + this.blocksContainer.y,
                        height: block.height,
                        width: block.width
                    };
                
                if (this.rectanglesOverlap(this.blockRect, this.dragRect)){
                    selectedBlocks.push(block);
                }
            })
            return selectedBlocks;
        }

        // Unhighlight the selected blocks

        this.unhighlightSelectedBlocks = (unhighlight, selectionModeOn) => {
            for (let i = 0; i < this.selectedBlocks.length; i++) {
                for (const blk in this.blocks.blockList) {
                        if (this.isEqual(this.blocks.blockList[blk], this.selectedBlocks[i])){
                            if (unhighlight) {
                                this.blocks.unhighlightSelectedBlocks(blk, true);
                            } else {
                                this.blocks.highlight(blk, true);
                                this.refreshCanvas();
                            }
                    }
                }
            }
        }

        // Check if two blocks are same or not.

        this.isEqual = (obj1, obj2) => {
            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);

            if (keys1.length !== keys2.length) {
                return false;
            }

            for (let key of keys1) {
                if (!obj2.hasOwnProperty(key)) {
                    return false;
                }
            }

            for (let key of keys1) {
                if (obj1[key] !== obj2[key]) {
                    return false;
                }
            }

            return true;
        };

        this.setSelectionMode = (selection) => {
            if (selection) {
                if (!this.selectionModeOn) {
                    if (this.selectedBlocks.length !== 0) {
                        this.selectedBlocks = [];
                        this.selectionModeOn = selection;
                        this.blocks.setSelection(this.selectionModeOn);
                    }
                }
            } else {
                this.selectedBlocks = [];
                this.selectionModeOn = selection;
                this.blocks.setSelection(this.selectionModeOn);
            }
        }


        /*
         * Inits everything. The main function.
         */
        this.init = async () => {
            this._clientWidth = document.body.clientWidth;
            this._clientHeight = document.body.clientHeight;
            this._innerWidth = window.innerWidth;
            this._innerHeight = window.innerHeight;
            this._outerWidth = window.outerWidth;
            this._outerHeight = window.outerHeight;

            docById("loader").className = "loader";

            /*
             * Run browser check before implementing onblur -->
             * stop MB functionality
             * (This is being done to stop MB to lose focus when
             * increasing/decreasing volume on Firefox)
             */

            doBrowserCheck();

            const that = this;

            if (!jQuery.browser.mozilla) {
                window.onblur = () => {
                    doHardStopButton(that, true);
                };
            }

            this.stage = new createjs.Stage(this.canvas);
            createjs.Touch.enable(this.stage);

            // createjs.Ticker.timingMode = createjs.Ticker.RAF_SYNCHED;
            // createjs.Ticker.framerate = 15;
            // createjs.Ticker.addEventListener('tick', this.stage);
            // createjs.Ticker.addEventListener('tick', that.__tick);

            let mouseEvents = 0;
            document.addEventListener("mousemove", () => {
                mouseEvents++;
                if (mouseEvents % 4 === 0) {
                    that.__tick();
                }
            });

            document.addEventListener("click", (e) => {
                if (!this.hasMouseMoved){
                    if (this.selectionModeOn) {
                        this.deselectSelectedBlocks();
                    } else {
                        this._hideHelpfulSearchWidget(e);
                    }
                }
            });

            this._createMsgContainer(
                "#ffffff",
                "#7a7a7a",
                (text) => {
                    that.msgText = text;
                },
                130
            );

            this._createMsgContainer(
                "#ffcbc4",
                "#ff0031",
                (text) =>{
                    that.errorMsgText = text;
                },
                130
            );

            this._createErrorContainers();

            /* Z-Order (top to bottom):
             *   menus
             *   palettes
             *   blocks
             *   trash
             *   turtles
             *   logo (drawing)
             */
            this.blocksContainer = new createjs.Container();
            this.trashContainer = new createjs.Container();
            this.turtleContainer = new createjs.Container();
            this.stage.addChild(this.turtleContainer);
            this.stage.addChild(this.trashContainer);
            this.stage.addChild(this.blocksContainer);
            this._setupBlocksContainerEvents();

            this.trashcan = new Trashcan(this);
            this.turtles = new Turtles(this);
            this.boundary = new Boundary(this.blocksContainer);
            this.blocks = new Blocks(this);
            this.palettes = new Palettes(this);
            this.palettes.init();
            this.logo = new Logo(this);

            this.pasteBox = new PasteBox(this);
            this.languageBox = new LanguageBox(this);

            // Show help on startup if first-time user.
            if (this.firstTimeUser) {
                this._showHelp();
            }

            try {
                this.planet = new PlanetInterface(this);
                await this.planet.init();
            } catch (e) {
                this.planet = undefined;
            }

            this.save = new SaveInterface(this);

            this.toolbar = new Toolbar();
            this.toolbar.init(this);

            this.toolbar.renderLogoIcon(showAboutPage);
            this.toolbar.renderPlayIcon(doFastButton);
            this.toolbar.renderStopIcon(doHardStopButton);
            this.toolbar.renderNewProjectIcon(_afterDelete);
            this.toolbar.renderLoadIcon(doLoad);
            this.toolbar.renderSaveIcons(
                this.save.saveHTML.bind(this.save),
                doSVG,
                this.save.saveSVG.bind(this.save),
                this.save.savePNG.bind(this.save),
                this.save.saveWAV.bind(this.save),
                this.save.saveLilypond.bind(this.save),
                this.save.saveAbc.bind(this.save),
                this.save.saveMxml.bind(this.save),
                this.save.saveBlockArtwork.bind(this.save)
            );
            this.toolbar.renderPlanetIcon(this.planet, doOpenSamples);
            this.toolbar.renderMenuIcon(showHideAuxMenu);
            this.toolbar.renderHelpIcon(showHelp);
            this.toolbar.renderModeSelectIcon(doSwitchMode, doRecordButton, doAnalytics, doOpenPlugin, deletePlugin, setScroller);
            this.toolbar.renderRunSlowlyIcon(doSlowButton);
            this.toolbar.renderRunStepIcon(doStepButton);
            this.toolbar.renderMergeIcon(_doMergeLoad);
            this.toolbar.renderRestoreIcon(restoreTrash);
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.toolbar.renderChooseKeyIcon(chooseKeyMenu);
            }
            this.toolbar.renderJavaScriptIcon(toggleJSWindow);
            this.toolbar.renderLanguageSelectIcon(this.languageBox);
            this.toolbar.renderWrapIcon();

            initPalettes(this.palettes);

            if (this.planet !== undefined) {
                this.saveLocally = this.planet.saveLocally.bind(this.planet);
            } else {
                this.saveLocally = this.__saveLocally;
            }

            window.saveLocally = this.saveLocally;

            initBasicProtoBlocks(this);

            // Load any macros saved in local storage.
            // this.storage.macros = null;
            this.macroData = this.storage.macros;
            if (this.macroData !== null) {
                processMacroData(this.macroData, this.palettes, this.blocks, this.macroDict);
            }

            // Load any plugins saved in local storage.
            this.pluginData = this.storage.plugins;
            if (this.pluginData !== null && this.pluginData !== "null") {
                updatePluginObj(this, processPluginData(this, this.pluginData));
            }

            // Load custom mode saved in local storage.
            const custommodeData = this.storage.custommode;
            if (custommodeData !== undefined) {
                // FIX ME
                // eslint-disable-next-line no-unused-vars
                const customMode = JSON.parse(custommodeData);
            }

            // eslint-disable-next-line no-unused-vars
            this.fileChooser.addEventListener("click", (event) => {
                that.value = null;
            });

            this.fileChooser.addEventListener(
                "change",
                // eslint-disable-next-line no-unused-vars
                (event) => {
                    // Read file here.
                    const reader = new FileReader();
                    const midiReader = new FileReader();
            
                    // eslint-disable-next-line no-unused-vars
                    reader.onload = (theFile) => {
                        that.loading = true;
                        document.body.style.cursor = "wait";
                        that.doLoadAnimation();
            
                        setTimeout(() => {
                            const rawData = reader.result;
                            if (rawData === null || rawData === "") {
                                that.errorMsg(
                                    _("Cannot load project from the file. Please check the file type.")
                                );
                            } else {
                                const cleanData = rawData.replace("\n", " ");
                                let obj;
                                try {
                                    if (cleanData.includes("html")) {
                                        obj = JSON.parse(
                                            cleanData.match('<div class="code">(.+?)</div>')[1]
                                        );
                                    } else {
                                        obj = JSON.parse(cleanData);
                                    }
                                    // First, hide the palettes as they will need updating.
                                    for (const name in that.palettes.dict) {
                                        that.palettes.dict[name].hideMenu(true);
                                    }
            
                                    that.stage.removeAllEventListeners("trashsignal");
            
                                    if (!that.merging) {
                                        // Wait for the old blocks to be removed.
                                        // eslint-disable-next-line no-unused-vars
                                        const __listener = (event) => {
                                            that.blocks.loadNewBlocks(obj);
                                            that.stage.removeAllEventListeners("trashsignal");
                                            if (that.planet) {
                                                that.planet.saveLocally();
                                            }
                                        };
            
                                        that.stage.addEventListener("trashsignal", __listener, false);
                                        that.sendAllToTrash(false, false);
                                        that._allClear(false);
                                        if (that.planet) {
                                            that.planet.closePlanet();
                                            that.planet.initialiseNewProject(
                                                that.fileChooser.files[0].name.substr(
                                                    0,
                                                    that.fileChooser.files[0].name.lastIndexOf(".")
                                                )
                                            );
                                        }
                                    } else {
                                        that.merging = false;
                                        that.blocks.loadNewBlocks(obj);
                                    }
            
                                    that.loading = false;
                                    that.refreshCanvas();
                                } catch (e) {
                                    that.errorMsg(
                                        _(
                                            "Cannot load project from the file. Please check the file type."
                                        )
                                    );
                                    // eslint-disable-next-line no-console
                                    console.error(e);
                                    document.body.style.cursor = "default";
                                    that.loading = false;
                                }
                            }
                        }, 200);
                    };
            
                    midiReader.onload = (e) => {
                        const midi = new Midi(e.target.result);
                        console.debug(midi);
                        this.transcribeMidi(midi);
                    };
            
                    const file = that.fileChooser.files[0];
                    if (file) {
                        const extension = file.name.split('.').pop().toLowerCase();
                        const isMidi = (extension === "mid") || (extension === "midi");
                        if (isMidi) {
                            midiReader.readAsArrayBuffer(file);
                        } else {
                            reader.readAsText(file);
                        }
                    }
                },
                false
            );
            

            const __handleFileSelect = (event) => {
                event.stopPropagation();
                event.preventDefault();

                const files = event.dataTransfer.files;
                const reader = new FileReader();
                let midiReader = new FileReader();

                const abcReader = new FileReader();
                // eslint-disable-next-line no-unused-vars
                reader.onload = (theFile) => {
                    that.loading = true;
                    document.body.style.cursor = "wait";
                    // doLoadAnimation();

                    setTimeout(() => {
                        const rawData = reader.result;
                        if (rawData === null || rawData === "") {
                            that.errorMsg(
                                _("Cannot load project from the file. Please check the file type.")
                            );
                        } else {
                            const cleanData = rawData.replace("\n", " ");
                            let obj;
                            try {
                                if (cleanData.includes("html")) {
                                    obj = JSON.parse(
                                        cleanData.match('<div class="code">(.+?)</div>')[1]
                                    );
                                } 
                                else {
                                    obj = JSON.parse(cleanData);
                                }
                                for (const name in that.blocks.palettes.dict) {
                                    that.palettes.dict[name].hideMenu(true);
                                }

                                that.stage.removeAllEventListeners("trashsignal");

                                const __afterLoad = () => {
                                    document.removeEventListener("finishedLoading", __afterLoad);
                                };

                                // Wait for the old blocks to be removed.
                                // eslint-disable-next-line no-unused-vars
                                const __listener = (event) => {
                                    that.blocks.loadNewBlocks(obj);
                                    that.stage.removeAllEventListeners("trashsignal");

                                    if (document.addEventListener) {
                                        document.addEventListener("finishedLoading", __afterLoad);
                                    } else {
                                        document.attachEvent("finishedLoading", __afterLoad);
                                    }
                                };

                                that.stage.addEventListener("trashsignal", __listener, false);
                                that.sendAllToTrash(false, false);
                                if (that.planet !== undefined) {
                                    that.planet.initialiseNewProject(
                                        files[0].name.substr(0, files[0].name.lastIndexOf("."))
                                    );
                                }

                                that.loading = false;
                                that.refreshCanvas();
                            } catch (e) {
                                // eslint-disable-next-line no-console
                                console.error(e);
                                that.errorMsg(
                                    _("Cannot load project from the file. Please check the file type.")
                                );
                                document.body.style.cursor = "default";
                                that.loading = false;
                            }
                        }
                    }, 200);
                };
                midiReader.onload = (e) => {
                    const midi = new Midi(e.target.result)
                    console.debug(midi);
                    this.transcribeMidi(midi);
                }

                // Music Block Parser from abc to MB
                abcReader.onload = (event) => {
                    //get the abc data and replace the / so that the block does not break
                    let abcData = event.target.result;
                    abcData = abcData.replace(/\\/g, '');
                    
                    const tunebook = new ABCJS.parseOnly(abcData);
                    
                    console.log(tunebook)
                    tunebook.forEach(tune => {
                        //call parseABC to parse abcdata to MB json
                        this.parseABC(tune);
                    
                    });
                 
                
                };

                // Music Block Parser from abc to MB
                abcReader.onload = (event) => {
                    //get the abc data and replace the / so that the block does not break
                    let abcData = event.target.result;
                    abcData = abcData.replace(/\\/g, '');
                    
                    const tunebook = new ABCJS.parseOnly(abcData);
                    
                    console.log(tunebook)
                    tunebook.forEach(tune => {
                        //call parseABC to parse abcdata to MB json
                        this.parseABC(tune);
                    
                    });
                 
                
                };

                // Work-around in case the handler is called by the
                // widget drag & drop code.
                if (files[0] !== undefined) {
                    let extension = files[0].name.split('.').pop().toLowerCase();  //file extension from input file

                    let isMidi = (extension == "mid") || (extension == "midi");
                    if (isMidi){
                        midiReader.readAsArrayBuffer(files[0]);
                        return;
                    }

                    let isABC = (extension == "abc");
                    if (isABC) {
                        abcReader.readAsText(files[0]);
                        console.log('abc')
                        return;
                    }
                    reader.readAsText(files[0]);
                    reader.readAsText(files[0]);
                    window.scroll(0, 0);
                }
            };

            const __handleDragOver = (event) => {
                event.stopPropagation();
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
            };

            const dropZone = docById("canvasHolder");
            dropZone.addEventListener("dragover", __handleDragOver, false);
            dropZone.addEventListener("drop", __handleFileSelect, false);

            // eslint-disable-next-line no-unused-vars
            this.allFilesChooser.addEventListener("click", (event) => {
                this.value = null;
            });

            // eslint-disable-next-line no-unused-vars
            this.pluginChooser.addEventListener("click", (event) => {
                window.scroll(0, 0);
                this.value = null;
            });

            this.pluginChooser.addEventListener(
                "change",
                // eslint-disable-next-line no-unused-vars
                (event) => {
                    window.scroll(0, 0);

                    // Read file here.
                    const reader = new FileReader();

                    // eslint-disable-next-line no-unused-vars
                    reader.onload = (theFile) =>{
                        that.loading = true;
                        document.body.style.cursor = "wait";
                        //doLoadAnimation();

                        setTimeout(() => {
                            const obj = processRawPluginData(that, reader.result);
                            // Save plugins to local storage.
                            if (obj !== null) {
                                that.storage.plugins = preparePluginExports(that, obj);
                            }

                            // Refresh the palettes.
                            setTimeout(() => {
                                if (that.palettes.visible) {
                                    that.palettes.hide();
                                }
                            }, 1000);

                            document.body.style.cursor = "default";
                            that.loading = false;
                        }, 200);
                    };

                    reader.readAsText(that.pluginChooser.files[0]);
                },
                false
            );

            // Workaround to chrome security issues
            // createjs.LoadQueue(true, null, true);

            // Enable touch interactions if supported on the current device.
            createjs.Touch.enable(this.stage, false, true);

            // Keep tracking the mouse even when it leaves the canvas.
            this.stage.mouseMoveOutside = true;

            // Enabled mouse over and mouse out events.
            this.stage.enableMouseOver(10); // default is 20

            this.cartesianBitmap = this._createGrid(
                "data:image/svg+xml;base64," + window.btoa(base64Encode(CARTESIAN))
            );
            this.polarBitmap = this._createGrid(
                "data:image/svg+xml;base64," + window.btoa(base64Encode(POLAR))
            );
            this.trebleBitmap = this._createGrid(
                "data:image/svg+xml;base64," + window.btoa(base64Encode(TREBLE))
            );
            this.grandBitmap = this._createGrid(
                "data:image/svg+xml;base64," + window.btoa(base64Encode(GRAND))
            );
            this.sopranoBitmap = this._createGrid(
                "data:image/svg+xml;base64," + window.btoa(base64Encode(SOPRANO))
            );
            this.altoBitmap = this._createGrid(
                "data:image/svg+xml;base64," + window.btoa(base64Encode(ALTO))
            );
            this.tenorBitmap = this._createGrid(
                "data:image/svg+xml;base64," + window.btoa(base64Encode(TENOR))
            );
            this.bassBitmap = this._createGrid(
                "data:image/svg+xml;base64," + window.btoa(base64Encode(BASS))
            );

            // We use G (one sharp) and F (one flat) as prototypes for all
            // of the accidentals. When applied, these graphics are offset
            // vertically to rendering different sharps and flats and
            // horizonally so as not to overlap.
            for (let i = 0; i < 7; i++) {
                this.grandSharpBitmap[i] = this._createGrid(
                    "data:image/svg+xml;base64," + window.btoa(base64Encode(GRAND_G))
                );
                this.grandFlatBitmap[i] = this._createGrid(
                    "data:image/svg+xml;base64," + window.btoa(base64Encode(GRAND_F))
                );
                this.trebleSharpBitmap[i] = this._createGrid(
                    "data:image/svg+xml;base64," + window.btoa(base64Encode(TREBLE_G))
                );
                this.trebleFlatBitmap[i] = this._createGrid(
                    "data:image/svg+xml;base64," + window.btoa(base64Encode(TREBLE_F))
                );
                this.sopranoSharpBitmap[i] = this._createGrid(
                    "data:image/svg+xml;base64," + window.btoa(base64Encode(TREBLE_G))
                );
                this.sopranoFlatBitmap[i] = this._createGrid(
                    "data:image/svg+xml;base64," + window.btoa(base64Encode(TREBLE_F))
                );
                this.altoSharpBitmap[i] = this._createGrid(
                    "data:image/svg+xml;base64," + window.btoa(base64Encode(TREBLE_G))
                );
                this.altoFlatBitmap[i] = this._createGrid(
                    "data:image/svg+xml;base64," + window.btoa(base64Encode(TREBLE_F))
                );
                this.tenorSharpBitmap[i] = this._createGrid(
                    "data:image/svg+xml;base64," + window.btoa(base64Encode(TREBLE_G))
                );
                this.tenorFlatBitmap[i] = this._createGrid(
                    "data:image/svg+xml;base64," + window.btoa(base64Encode(TREBLE_F))
                );
                this.bassSharpBitmap[i] = this._createGrid(
                    "data:image/svg+xml;base64," + window.btoa(base64Encode(TREBLE_G))
                );
                this.bassFlatBitmap[i] = this._createGrid(
                    "data:image/svg+xml;base64," + window.btoa(base64Encode(TREBLE_F))
                );
            }

            const URL = window.location.href;
            const flags = {
                run: false,
                show: false,
                collapse: false
            };

            // Scale the canvas relative to the screen size.
            this._onResize(true);

            let urlParts;
            const env = [];

            if (URL.indexOf("?") > 0) {
                let args, url;
                urlParts = URL.split("?");
                if (urlParts[1].indexOf("&") > 0) {
                    const newUrlParts = urlParts[1].split("&");
                    for (let i = 0; i < newUrlParts.length; i++) {
                        if (newUrlParts[i].indexOf("=") > 0) {
                            args = newUrlParts[i].split("=");
                            switch (args[0].toLowerCase()) {
                                case "file":
                                    break;
                                case "id":
                                    this.projectID = args[1];
                                    break;
                                case "run":
                                    if (args[1].toLowerCase() === "true") flags.run = true;
                                    break;
                                case "show":
                                    if (args[1].toLowerCase() === "true") flags.show = true;
                                    break;
                                case "collapse":
                                    if (args[1].toLowerCase() === "true") flags.collapse = true;
                                    break;
                                case "inurl":
                                    url = args[1];
                                    // eslint-disable-next-line no-case-declarations
                                    const getJSON = (url) =>{
                                        return new Promise((resolve, reject) =>{
                                            const xhr = new XMLHttpRequest();
                                            xhr.open("get", url, true);
                                            xhr.responseType = "json";
                                            xhr.onload = () => {
                                                const status = xhr.status;
                                                if (status === 200) {
                                                    resolve(xhr.response);
                                                } else {
                                                    reject(status);
                                                }
                                            };
                                            xhr.send();
                                        });
                                    };

                                    getJSON(url).then(
                                        (data) => {
                                            const n = data.arg;
                                            env.push(parseInt(n));
                                        },
                                        // eslint-disable-next-line no-unused-vars
                                        (status) =>{
                                            alert(
                                                "Something went wrong reading JSON-encoded project data."
                                            );
                                        }
                                    );
                                    break;
                                case "outurl":
                                    url = args[1];
                                    break;
                                default:
                                    this.errorMsg(_("Invalid parameters"));
                                    break;
                            }
                        }
                    }
                } else {
                    if (urlParts[1].indexOf("=") > 0) {
                        args = urlParts[1].split("=");
                    }

                    //ID is the only arg that can stand alone
                    if (args[0].toLowerCase() === "id") {
                        this.projectID = args[1];
                    }
                }
            }

            if (this.projectID !== null) {
                setTimeout(() => {
                    that.loadStartWrapper(loadProject, that.projectID, flags, env);
                }, 200); // 2000
            } else {
                setTimeout(() => {
                    that.loadStartWrapper(loadStart);
                }, 200); // 2000
            }

            this.prepSearchWidget();

            // create functionality of 2D drag to select blocks in bulk
            
            this._create2Ddrag();

            /*
            document.addEventListener("mousewheel", scrollEvent, false);
            document.addEventListener("DOMMouseScroll", scrollEvent, false);
            */

            const activity = this;
            document.onkeydown = () => {
                activity.__keyPressed(event);
            };

            if (this.planet !== undefined) {
                this.planet.planet.setAnalyzeProject(doAnalyzeProject);
            }
        };
    }

    /**
     * Saves the current state locally
     * @returns {void}
     */
    saveLocally() {
        try {
            localStorage.setItem('beginnerMode', this.beginnerMode.toString());
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    /**
     * Regenerates all palettes based on current mode
     * @returns {void}
     */
    regeneratePalettes() {
        try {
            // Store current palette positions
            const palettePositions = {};
            if (this.palettes && this.palettes.dict) {
                for (const name in this.palettes.dict) {
                    const palette = this.palettes.dict[name];
                    if (palette && palette.container && typeof palette.container.x !== 'undefined') {
                        palettePositions[name] = {
                            x: palette.container.x,
                            y: palette.container.y,
                            visible: !!palette.visible
                        };
                    }
                }
            }
    
            // Safely hide and clear existing palettes
            if (!this.palettes) {
                console.warn('Palettes object not initialized');
                return;
            }
    
            if (typeof this.palettes.hide !== 'function') {
                console.warn('Palettes hide method not available');
            } else {
                this.palettes.hide();
            }
    
            if (typeof this.palettes.clear !== 'function') {
                console.warn('Palettes clear method not available');
                // Fallback clear implementation
                this.palettes.dict = {};
                this.palettes.visible = false;
                this.palettes.activePalette = null;
                this.palettes.paletteObject = null;
            } else {
                this.palettes.clear();
            }
    
            // Reinitialize palettes
            initPalettes(this.palettes);
            
            // Reinitialize blocks
            if (this.blocks) {
                initBasicProtoBlocks(this);
            }
    
            // Restore palette positions
            if (this.palettes && this.palettes.dict) {
                for (const name in palettePositions) {
                    const palette = this.palettes.dict[name];
                    const pos = palettePositions[name];
                    
                    if (palette && palette.container && pos) {
                        palette.container.x = pos.x;
                        palette.container.y = pos.y;
                        
                        if (pos.visible) {
                            palette.showMenu(true);
                        }
                    }
                }
            }
    
            // Update the palette display
            if (this.palettes && typeof this.palettes.updatePalettes === 'function') {
                this.palettes.updatePalettes();
            }
            
            // Update blocks
            if (this.blocks && typeof this.blocks.updateBlockPositions === 'function') {
                this.blocks.updateBlockPositions();
            }
            
            this.refreshCanvas();
    
        } catch (e) {
            console.error('Error regenerating palettes:', e);
            this.errorMsg(_('Error regenerating palettes. Please refresh the page.'));
        }
    }
}

const activity = new Activity();

require(["domReady!"], (doc) =>{
    setTimeout(() => {
        activity.setupDependencies();
        activity.domReady(doc);
    }, 5000);
});

// eslint-disable-next-line no-unused-vars
define(MYDEFINES, (compatibility) =>{
    activity.setupDependencies();
    activity.doContextMenus();
    activity.doPluginsAndPaletteCols();
});