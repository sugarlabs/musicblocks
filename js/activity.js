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
   doSVG, EMPTYHEAPERRORMSG, EXPANDBUTTON, FILLCOLORS,
   getMacroExpansion, getOctaveRatio, getTemperament, transcribeMidi,
   GOHOMEBUTTON, GOHOMEFADEDBUTTON, GRAND, HelpWidget, HIDEBLOCKSFADEDBUTTON,
   hideDOMLabel, initBasicProtoBlocks, initPalettes,
   INLINECOLLAPSIBLES, jQuery, JSEditor, LanguageBox, ThemeBox, Logo, MSGBLOCK,
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
   SHARP, FLAT, buildScale, TREBLE_F, TREBLE_G, GIFAnimator,
   MUSICALMODES
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

// Responsive breakpoint constants
const RESPONSIVE_BREAKPOINT_TABLET = 768;
const RESPONSIVE_BREAKPOINT_MOBILE = 600;

let MYDEFINES = [
    "utils/platformstyle",
    "easeljs.min",
    "tweenjs.min",
    "preloadjs.min",
    "howler",
    "p5.min",
    "p5-sound-adapter",
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
    "activity/themebox",
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
    "activity/js-export/ast2blocklist",
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
        "widgets/aidebugger",
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
        "widgets/reflection",
        "widgets/legobricks",
        "activity/lilypond",
        "activity/abc",
        "activity/midi",
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
const doAnalyzeProject = function () {
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
        this._listeners = [];

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

        /* Global bridge functions for inline HTML event handlers.
         * Inline onclick attributes require functions to exist on the global
         * window object. These wrappers safely delegate the calls to the
         * active Activity instance, keeping UI logic within Activity.
         */
        window.hidePrintText = () => {
            if (globalActivity) {
                globalActivity.hidePrintText();
            }
        };

        window.hideErrorText = () => {
            if (globalActivity) {
                globalActivity.hideErrorText();
            }
        };

        this.saveLocally = null;
        this.scrollBlockContainer = false;
        this.blockRefreshCanvas = false;
        this.statsWindow = null;

        this.firstTimeUser = false;
        this.beginnerMode = false;
        this.runMode = "normal";

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

        //Flag to check if any other input box is active or not
        this.isInputON = false;

        // Interval ID for the loading animation (to allow cleanup)
        this.loadAnimationIntervalId = null;

        // Initialize GIF animator
        this.gifAnimator = new GIFAnimator();

        // Dirty flag for canvas rendering optimization
        // When true, the stage needs to be redrawn on the next animation frame
        this.stageDirty = false;

        this.themes = ["light", "dark", "highcontrast"];
        try {
            for (let i = 0; i < this.themes.length; i++) {
                if (this.themes[i] === this.storage.themePreference) {
                    body.classList.add(this.themes[i]);
                } else {
                    body.classList.remove(this.themes[i]);
                }
            }
        } catch (e) {
            console.error("Error accessing themePreference storage:", e);
        }

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
                if (lang.startsWith("ja")) lang = "ja"; // normalize Japanese
                i18next.changeLanguage(lang);
            } else {
                lang = navigator.language;
                if (lang.includes("-")) {
                    lang = lang.slice(0, lang.indexOf("-"));
                }
                i18next.changeLanguage(lang);
            }
        } catch (e) {
            console.error(e);
        }

        this.KeySignatureEnv = ["C", "major", false];
        try {
            if (this.storage.KeySignatureEnv !== undefined) {
                // eslint-disable-next-line no-console
                console.log(this.storage.KeySignatureEnv);
                this.KeySignatureEnv = this.storage.KeySignatureEnv.split(",");
                this.KeySignatureEnv[2] = this.KeySignatureEnv[2] === "true";
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
            this.cleanupEventListeners();
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
            this.canvas = document.getElementById("myCanvas");

            // Set up a file chooser for the doOpen function.
            this.fileChooser = document.getElementById("myOpenFile");
            // Set up a file chooser for the doOpenPlugin function.
            this.pluginChooser = document.getElementById("myOpenPlugin");
            // The file chooser for all files
            this.allFilesChooser = document.getElementById("myOpenAll");
            this.auxToolbar = document.getElementById("aux-toolbar");
            // Error message containers
            this.errorText = document.getElementById("errorText");
            this.errorTextContent = document.getElementById("errorTextContent");
            // Hide Arrow on hiding error message
            this.addEventListener(this.errorText, "click", this._hideArrows);
            // Show and populate the printText div.
            this.printText = document.getElementById("printText");
            this.printTextContent = document.getElementById("printTextContent");

            // Are we running off of a server?
            this.server = true;
            this.turtleBlocksScale = 1;
            this.mousestage = null;
            this.stage = null;
            this.turtles = null;
            this.palettes = null;
            this.blocks = null;
            this.logo = null;
            this.gif = null;
            this.pasteBox = null;
            this.languageBox = null;
            this.themeBox = null;
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

            this.searchWidget = document.getElementById("search");
            this.searchWidget.style.visibility = "hidden";
            this.searchWidget.placeholder = _("Search for blocks");

            this.helpfulSearchWidget = document.createElement("input");
            this.helpfulSearchWidget.setAttribute("id", "helpfulSearch");
            this.helpfulSearchWidget.style.visibility = "hidden";
            this.helpfulSearchWidget.placeholder = _("Search for blocks");
            this.helpfulSearchWidget.classList.add("ui-autocomplete");
            this.progressBar = document.getElementById("myProgress");
            this.progressBar.style.visibility = "hidden";

            new createjs.DOMElement(document.getElementById("paste"));
            this.paste = document.getElementById("paste");
            this.paste.style.visibility = "hidden";

            this.toolbarHeight = document.getElementById("toolbars").offsetHeight;

            this.helpfulWheelItems = [];

            this.setHelpfulSearchDiv();
        };

        /*
         * Optimized canvas rendering using dirty flag pattern.
         * The stage only updates when:
         * 1. stageDirty flag is set (something changed)
         * 2. Active tweens are running
         * 3. GIF animations are playing
         * This eliminates unnecessary 60fps updates when idle.
         */
        const renderLoop = () => {
            if (this.stage) {
                const hasActiveTweens = createjs.Tween.hasActiveTweens();
                const hasActiveGifs = this.gifAnimator && this.gifAnimator.getActiveCount() > 0;

                if (this.stageDirty || hasActiveTweens || hasActiveGifs) {
                    this.stage.update();
                    this.stageDirty = false;
                }
            }
            requestAnimationFrame(renderLoop);
        };
        requestAnimationFrame(renderLoop);

        /*
         * creates helpfulSearchDiv for search
         */
        this.setHelpfulSearchDiv = () => {
            if (document.getElementById("helpfulSearchDiv")) {
                document
                    .getElementById("helpfulSearchDiv")
                    .parentNode.removeChild(document.getElementById("helpfulSearchDiv"));
            }
            this.helpfulSearchDiv = document.createElement("div");
            this.helpfulSearchDiv.setAttribute("id", "helpfulSearchDiv");

            document.body.appendChild(this.helpfulSearchDiv);

            // Create the div for the close button (cross button)
            const closeButtonDiv = document.createElement("div");
            closeButtonDiv.style.cssText =
                "position: absolute;" + "top: 10px;" + "right: 10px;" + "cursor: pointer;";

            // Create the cross button itself
            const closeButton = document.createElement("button");
            closeButton.textContent = "×";
            closeButton.id = "crossButton";
            document.body.appendChild(closeButton);

            closeButtonDiv.appendChild(closeButton);

            this.helpfulSearchDiv.appendChild(closeButtonDiv);

            // Add event listener to remove the search div from the DOM
            const modeButton = document.getElementById("begIconText");
            this.addEventListener(closeButton, "click", this._hideHelpfulSearchWidget);
            this.addEventListener(modeButton, "click", this._hideHelpfulSearchWidget);

            this.helpfulSearchDiv.appendChild(this.helpfulSearchWidget);
        };

        /*
         * displays helpfulSearchDiv on canvas
         */
        this._displayHelpfulSearchDiv = () => {
            if (!document.getElementById("helpfulSearchDiv")) {
                this.setHelpfulSearchDiv(); // Re-create and append the div if it's not found
            }
            this.helpfulSearchDiv.style.left =
                document.getElementById("helpfulWheelDiv").offsetLeft +
                80 * this.getStageScale() +
                "px";
            this.helpfulSearchDiv.style.top =
                document.getElementById("helpfulWheelDiv").offsetTop +
                110 * this.getStageScale() +
                "px";

            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            this.helpfulSearchDiv.style.display = "block";
            const menuWidth = this.helpfulSearchDiv.offsetWidth;
            const menuHeight = this.helpfulSearchDiv.offsetHeight;

            if (this.helpfulSearchDiv.offsetLeft + menuWidth > windowWidth) {
                this.helpfulSearchDiv.style.left = windowWidth - menuWidth + "px";
            }
            if (this.helpfulSearchDiv.offsetTop + menuHeight > windowHeight) {
                this.helpfulSearchDiv.style.top = windowHeight - menuHeight + "px";
            }

            this.showHelpfulSearchWidget();
            this.isHelpfulSearchWidgetOn = true;
        };

        // hides helpfulSearchDiv on canvas

        this._hideHelpfulSearchWidget = e => {
            if (document.getElementById("helpfulWheelDiv").style.display !== "none") {
                document.getElementById("helpfulWheelDiv").style.display = "none";
            }
            if (this.helpfulSearchDiv && this.helpfulSearchDiv.parentNode) {
                this.helpfulSearchDiv.parentNode.removeChild(this.helpfulSearchDiv);
            }
            that.__tick();
        };

        /*
         * Sets up right click functionality opening the context menus
         * (if block is right clicked)
         */
        this.doContextMenus = () => {
            this.addEventListener(
                document,
                "contextmenu",
                event => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (this.beginnerMode) return;
                    if (this.isHelpfulSearchWidgetOn) {
                        this._hideHelpfulSearchWidget();
                    }
                    if (
                        !this.blocks.isCoordinateOnBlock(event.clientX, event.clientY) &&
                        event.target.id === "myCanvas"
                    ) {
                        this._displayHelpfulWheel(event);
                    }
                },
                false
            );
        };

        /*
         * displays helpfulWheel on canvas on right click
         */
        this._displayHelpfulWheel = event => {
            document.getElementById("helpfulWheelDiv").style.position = "absolute";

            const x = event.clientX;
            const y = event.clientY;

            const canvasLeft = this.canvas.offsetLeft + 28 * this.getStageScale();
            const canvasTop = this.canvas.offsetTop + 6 * this.getStageScale();

            const helpfulWheelLeft = Math.max(
                Math.round(x * this.getStageScale() + canvasLeft) - 150,
                canvasLeft
            );
            const helpfulWheelTop = Math.max(
                Math.round(y * this.getStageScale() + canvasTop) - 150,
                canvasTop
            );

            document.getElementById("helpfulWheelDiv").style.left = helpfulWheelLeft + "px";

            document.getElementById("helpfulWheelDiv").style.top = helpfulWheelTop + "px";

            const windowWidth = window.innerWidth - 20;
            const windowHeight = window.innerHeight - 20;

            if (helpfulWheelLeft + 350 > windowWidth) {
                document.getElementById("helpfulWheelDiv").style.left = windowWidth - 350 + "px";
            }
            if (helpfulWheelTop + 350 > windowHeight) {
                document.getElementById("helpfulWheelDiv").style.top = windowHeight - 350 + "px";
            }

            document.getElementById("helpfulWheelDiv").style.display = "";

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
            });
            const closeHelpfulWheel = e => {
                const isClickInside = helpfulWheelDiv.contains(e.target);
                if (!isClickInside) {
                    helpfulWheelDiv.style.display = "none";
                    this.removeEventListener(document, "click", closeHelpfulWheel);
                }
            };

            this.addEventListener(document, "click", closeHelpfulWheel);
        };

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
        const findBlocks = activity => {
            activity._findBlocks();
            if (document.getElementById("helpfulWheelDiv").style.display !== "none") {
                document.getElementById("helpfulWheelDiv").style.display = "none";
                activity.__tick();
            }
        };

        /**
         * Ensures blocks stay within canvas boundaries when resized.
         * Ensures that music blocks are responsive to horizontal resizing.
         * Ensures that overall integrity of blocks isn't hampered with.
         */
        function repositionBlocks(activity) {
            const canvasWidth = window.innerWidth;
            const processedBlocks = new Set();

            //Array for storing individual dragGroups (the chunks of code linked together which are not connected)
            const dragGroups = [];

            // Identifying individual dragGroups
            Object.values(activity.blocks.blockList).forEach(block => {
                if (!processedBlocks.has(block.id)) {
                    activity.blocks.findDragGroup(block.id);

                    if (activity.blocks.dragGroup.length > 0) {
                        dragGroups.push([...activity.blocks.dragGroup]); // Store the group into dragGroups
                        activity.blocks.dragGroup.forEach(id => processedBlocks.add(id)); // Process individual groups
                    }
                }
            });

            // Repositioning of dragGroups according to horizontal resizing
            dragGroups.forEach(group => {
                const referenceBlock = activity.blocks.blockList[group[0]];

                // Store initial positions
                if (!referenceBlock.initialPosition) {
                    referenceBlock.initialPosition = {
                        x: referenceBlock.container.x,
                        y: referenceBlock.container.y
                    };
                }

                if (
                    canvasWidth < RESPONSIVE_BREAKPOINT_TABLET &&
                    !referenceBlock.beforeMobilePosition
                ) {
                    referenceBlock.beforeMobilePosition = {
                        x: referenceBlock.container.x,
                        y: referenceBlock.container.y
                    };
                }

                if (
                    canvasWidth >= RESPONSIVE_BREAKPOINT_TABLET &&
                    referenceBlock.beforeMobilePosition
                ) {
                    const dx = referenceBlock.beforeMobilePosition.x - referenceBlock.container.x;
                    const dy = referenceBlock.beforeMobilePosition.y - referenceBlock.container.y;
                    group.forEach(blockId => {
                        const block = activity.blocks.blockList[blockId];
                        block.container.x += dx;
                        block.container.y += dy;
                    });
                    referenceBlock.beforeMobilePosition = null; // Clear stored position
                    //this prevents old groups from affecting new calculations.
                }

                if (
                    canvasWidth < RESPONSIVE_BREAKPOINT_MOBILE &&
                    !referenceBlock.before600pxPosition
                ) {
                    referenceBlock.before600pxPosition = {
                        x: referenceBlock.container.x,
                        y: referenceBlock.container.y
                    };
                }

                if (
                    canvasWidth >= RESPONSIVE_BREAKPOINT_MOBILE &&
                    referenceBlock.before600pxPosition
                ) {
                    const dx = referenceBlock.before600pxPosition.x - referenceBlock.container.x;
                    const dy = referenceBlock.before600pxPosition.y - referenceBlock.container.y;

                    group.forEach(blockId => {
                        const block = activity.blocks.blockList[blockId];
                        block.container.x += dx;
                        block.container.y += dy;
                    });
                    referenceBlock.before600pxPosition = null;
                }

                // Ensure blocks stay within horizontal boundary
                const rightmostX = Math.max(
                    ...group.map(
                        id =>
                            activity.blocks.blockList[id].container.x +
                            activity.blocks.blockList[id].width
                    )
                );

                if (rightmostX > canvasWidth) {
                    const shiftX = Math.max(10, canvasWidth - rightmostX - 10);

                    group.forEach(blockId => {
                        activity.blocks.blockList[blockId].container.x += shiftX;
                    });
                }

                // Ensures that blocks do not go hide behind the search for blocks div
                const leftmostX = Math.min(
                    ...group.map(id => activity.blocks.blockList[id].container.x)
                );
                if (leftmostX < 0) {
                    const shiftX = 100 - leftmostX;

                    group.forEach(blockId => {
                        activity.blocks.blockList[blockId].container.x += shiftX;
                    });
                }
            });

            activity._findBlocks();
        }

        //if any window resize event occurs:
        this._handleRepositionBlocksOnResize = () => repositionBlocks(this);
        this.addEventListener(window, "resize", this._handleRepositionBlocksOnResize);

        /**
         * Finds and organizes blocks within the workspace.
         * Arranges blocks in grid format on wide screens and vertically on narrow screens.
         */
        this._findBlocks = () => {
            if (!this.blocks.visible) {
                this._changeBlockVisibility();
            }

            this.blocks.activeBlock = null;
            hideDOMLabel();
            this.blocks.showBlocks();
            this.blocksContainer.x = 0;
            this.blocksContainer.y = 0;

            const screenWidth = window.innerWidth;
            const isNarrowScreen = screenWidth < RESPONSIVE_BREAKPOINT_MOBILE;
            const minColumnWidth = 400;
            const numColumns = isNarrowScreen ? 1 : Math.floor(screenWidth / minColumnWidth);

            const toppos = this.auxToolbar.style.display === "block" ? 90 + this.toolbarHeight : 90;
            const x = isNarrowScreen
                ? Math.floor(screenWidth / 2)
                : Math.floor(this.canvas.width / 4);
            let y = Math.floor(toppos * this.turtleBlocksScale);
            const verticalSpacing = Math.floor(40 * this.turtleBlocksScale);

            const columnSpacing = (screenWidth / numColumns) * 1.2;
            const columnXPositions = Array.from({ length: numColumns }, (_, i) =>
                Math.floor(i * columnSpacing + columnSpacing / 2)
            );
            const columnYPositions = Array(numColumns).fill(y);

            for (const blk in this.blocks.blockList) {
                if (!this.blocks.blockList[blk].trash) {
                    const myBlock = this.blocks.blockList[blk];

                    // Store original position only once
                    if (!myBlock.originalPosition) {
                        myBlock.originalPosition = {
                            x: myBlock.container.x,
                            y: myBlock.container.y
                        };
                    }

                    if (myBlock.connections[0] === null) {
                        if (isNarrowScreen) {
                            const dx = x - myBlock.container.x;
                            const dy = y - myBlock.container.y;
                            this.blocks.moveBlockRelative(blk, dx, dy);
                            y += myBlock.height + verticalSpacing;
                        } else {
                            const minYIndex = columnYPositions.indexOf(
                                Math.min(...columnYPositions)
                            );
                            const dx = columnXPositions[minYIndex] - myBlock.container.x;
                            const dy = columnYPositions[minYIndex] - myBlock.container.y;
                            this.blocks.moveBlockRelative(blk, dx, dy);
                            columnYPositions[minYIndex] += myBlock.height + verticalSpacing;
                        }
                    }

                    // Making code to make sure that
                    if (myBlock.connections.length > 0) {
                        myBlock.connections.forEach(conn => {
                            if (conn !== null) {
                                const innerBlock = this.blocks.blockList[conn];
                                if (innerBlock) {
                                    innerBlock.container.x =
                                        myBlock.container.x + innerBlock.relativeX;
                                    innerBlock.container.y =
                                        myBlock.container.y + innerBlock.relativeY;
                                }
                            }
                        });
                    }
                }
            }

            repositionBlocks(this);
            this.setHomeContainers(false);
            this.boundary.hide();

            for (let turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
                const savedPenState = this.turtles.turtleList[turtle].painter.penState;
                this.turtles.turtleList[turtle].painter.penState = false;
                this.turtles.turtleList[turtle].painter.doSetXY(0, 0);
                this.turtles.turtleList[turtle].painter.doSetHeading(0);
                this.turtles.turtleList[turtle].painter.penState = savedPenState;
            }
        };

        /**
         * Finds and organizes blocks within the workspace.
         * Blocks are positioned based on their connections and availability within the canvas area.
         * This method is part of the internal mechanism to ensure that blocks are displayed correctly and efficiently.
         * @constructor
         */
        // Flag to track number of clicks and for alternate mode switching while clicking
        this._isFirstHomeClick = true;

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

            if (this._isFirstHomeClick) {
                // First clicked logic (arrange blocks in rows may have overlapping of blocks)
                let toppos;
                if (this.auxToolbar.style.display === "block") {
                    toppos = 90 + this.toolbarHeight;
                } else {
                    toppos = 90;
                }
                const leftpos = Math.floor(this.canvas.width / 4);

                this.palettes.updatePalettes();
                let x = Math.floor(leftpos * this.turtleBlocksScale);
                let y = Math.floor(toppos * this.turtleBlocksScale);
                let even = true;

                // Position "start" blocks first
                for (const blk in this.blocks.blockList) {
                    if (!this.blocks.blockList[blk].trash) {
                        const myBlock = this.blocks.blockList[blk];
                        if (myBlock.name !== "start") {
                            continue;
                        }
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
            } else {
                // Second click logic (arrange blocks in columns this avoid overlapping of blocks)
                let toppos;
                if (this.auxToolbar.style.display === "block") {
                    toppos = 90 + this.toolbarHeight;
                } else {
                    toppos = 90;
                }

                /**
                 * Device type resolution ranges and typical orientation:
                 * Desktop: 1024x768 to 5120x2880 (Landscape primary, Portrait supported)
                 * Tablet: 768x1024 to 2560x1600 (Portrait common, Landscape supported)
                 * Mobile: 320x480 to 1440x3200 (Portrait primary, Landscape supported)
                 * Minimum column width is set to 400px to ensure readability and usability.
                 */

                const screenWidth = window.innerWidth;
                const minColumnWidth = 320;
                const numColumns =
                    screenWidth <= 320 ? 1 : Math.floor(screenWidth / minColumnWidth);

                const baseColumnSpacing = screenWidth / numColumns;
                const columnSpacing = baseColumnSpacing * 1.2;

                const initialY = Math.floor(toppos * this.turtleBlocksScale);
                const baseVerticalSpacing = Math.floor(20 * this.turtleBlocksScale);
                const verticalSpacing = baseVerticalSpacing * 1.2;

                const columnXPositions = Array.from({ length: numColumns }, (_, i) =>
                    Math.floor(i * columnSpacing + columnSpacing / 2)
                );
                const columnYPositions = Array(numColumns).fill(initialY);

                for (const blk in this.blocks.blockList) {
                    if (!this.blocks.blockList[blk].trash) {
                        const myBlock = this.blocks.blockList[blk];
                        if (myBlock.connections[0] === null) {
                            let minYIndex = 0;
                            for (let i = 1; i < numColumns; i++) {
                                if (columnYPositions[i] < columnYPositions[minYIndex]) {
                                    minYIndex = i;
                                }
                            }

                            const dx = columnXPositions[minYIndex] - myBlock.container.x;
                            const dy = columnYPositions[minYIndex] - myBlock.container.y;
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
                            columnYPositions[minYIndex] += myBlock.height + verticalSpacing;
                        }
                    }
                }
            }

            // Reset go-home button
            this.setHomeContainers(false);
            this.boundary.hide();

            // Return mice to the center of the screen.
            // Reset turtles' positions to center of the screen
            for (let turtle = 0; turtle < this.turtles.getTurtleCount(); turtle++) {
                const requiredTurtle = this.turtles.getTurtle(turtle);
                const savedPenState = requiredTurtle.painter.penState;
                requiredTurtle.painter.penState = false;
                requiredTurtle.painter.doSetXY(0, 0);
                requiredTurtle.painter.doSetHeading(0);
                requiredTurtle.painter.penState = savedPenState;
            }
            // Alternate mode switching on clicking Home button
            this._isFirstHomeClick = !this._isFirstHomeClick;
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
        this.setHomeContainers = homeState => {
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
                                newBlock => {
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

        /**
         * @returns {PNG} returns PNG of block artwork
         */
        this.printBlockPNG = async () => {
            // Setps to convert the SVG to PNG of BlockArtwork
            // Step 1: Generate the SVG content
            // Step 2: Create a Canvas element
            // Step 3: Convert SVG to an Image object
            // Step 4: Draw SVG on the Canvas and export as PNG

            const svgContent = this.printBlockSVG();
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const parser = new DOMParser();
            const svgDoc = parser.parseFromString(decodeURIComponent(svgContent), "image/svg+xml");
            const svgElement = svgDoc.documentElement;
            const width = parseInt(svgElement.getAttribute("width"), 10);
            const height = parseInt(svgElement.getAttribute("height"), 10);
            canvas.width = width;
            canvas.height = height;
            const img = new Image();
            const svgBlob = new Blob([decodeURIComponent(svgContent)], {
                type: "image/svg+xml;charset=utf-8"
            });
            const url = URL.createObjectURL(svgBlob);
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    URL.revokeObjectURL(url);
                    const pngDataUrl = canvas.toDataURL("image/png");
                    resolve(pngDataUrl);
                };
                img.onerror = err => {
                    URL.revokeObjectURL(url);
                    reject(err);
                };
                img.src = url;
            });
        };

        const midiImportBlocks = midi => {
            if (document.getElementById("import-midi")) return;

            const modal = document.createElement("div");
            modal.classList.add("modalBox");
            modal.id = "import-midi";
            const title = document.createElement("h2");
            title.textContent = _("Import MIDI");
            title.classList.add("modal-title");
            modal.appendChild(title);

            const container = document.createElement("div");
            container.classList.add("message-container");
            const message = document.createElement("p");
            message.textContent = _("Set the max blocks to generate :");
            message.classList.add("modal-message");
            container.appendChild(message);

            const select = document.createElement("select");
            select.classList.add("block-count-dropdown");

            // 12 choices for block generation (100 to 1200)
            for (let i = 1; i <= 12; i++) {
                const option = document.createElement("option");
                option.value = i * 100;
                option.textContent = i * 100;
                select.appendChild(option);
            }

            container.appendChild(select);
            modal.appendChild(container);

            const importConfirm = document.createElement("button");
            importConfirm.classList.add("confirm-button");
            importConfirm.textContent = _("Confirm");
            importConfirm.addEventListener("click", () => {
                const maxNoteBlocks = select.value;
                transcribeMidi(midi, maxNoteBlocks);
                document.body.removeChild(modal);
            });
            modal.appendChild(importConfirm);

            const cancelBtn = document.createElement("button");
            cancelBtn.classList.add("cancel-button");
            cancelBtn.textContent = _("Cancel");
            cancelBtn.addEventListener("click", () => {
                document.body.removeChild(modal);
            });
            modal.appendChild(cancelBtn);

            document.body.appendChild(modal);
        };

        /*
         * Clears "canvas"
         */
        const renderClearConfirmation = clearCanvasAction => {
            if (document.getElementById("clear-confirm")) return;
            // Create a custom modal for confirmation
            const modal = document.createElement("div");
            modal.classList.add("modalBox");
            modal.id = "clear-confirm";
            const title = document.createElement("h2");
            title.textContent = _("Clear Workspace");
            title.classList.add("modal-title");

            modal.appendChild(title);
            const message = document.createElement("p");
            message.textContent = _("Are you sure you want to clear the workspace?");
            message.classList.add("modal-message");
            modal.appendChild(message);

            const buttonContainer = document.createElement("div");
            buttonContainer.classList.add("clear-button-container");

            const confirmBtn = document.createElement("button");
            confirmBtn.classList.add("confirm-button");
            confirmBtn.textContent = _("Confirm");
            confirmBtn.style.backgroundColor = platformColor.blueButton;
            confirmBtn.style.color = "white";
            confirmBtn.style.border = "none";
            confirmBtn.style.borderRadius = "4px";
            confirmBtn.style.padding = "8px 16px";
            confirmBtn.style.fontWeight = "bold";
            confirmBtn.style.cursor = "pointer";
            confirmBtn.style.marginRight = "16px";
            this.addEventListener(confirmBtn, "click", () => {
                document.body.removeChild(modal);
                clearCanvasAction();
            });

            const cancelBtn = document.createElement("button");
            cancelBtn.classList.add("cancel-button");
            cancelBtn.textContent = _("Cancel");
            cancelBtn.style.backgroundColor = "#f1f1f1";
            cancelBtn.style.color = "black";
            cancelBtn.style.border = "none";
            cancelBtn.style.borderRadius = "4px";
            cancelBtn.style.padding = "8px 16px";
            cancelBtn.style.fontWeight = "bold";
            cancelBtn.style.cursor = "pointer";
            this.addEventListener(cancelBtn, "click", () => {
                document.body.removeChild(modal);
            });

            buttonContainer.appendChild(confirmBtn);
            buttonContainer.appendChild(cancelBtn);
            modal.appendChild(buttonContainer);
            document.body.appendChild(modal);
        };

        this._allClear = (noErase, skipConfirmation = false) => {
            const clearCanvasAction = () => {
                this.blocks.activeBlock = null;
                hideDOMLabel();

                // Stop all GIF animations and clear overlay canvas (Issue #4907)
                if (this.gifAnimator) {
                    this.gifAnimator.stopAll();
                    const overlayCanvas = document.getElementById("overlayCanvas");
                    if (overlayCanvas) {
                        const ctx = overlayCanvas.getContext("2d");
                        ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                    }
                }

                this.logo.boxes = {};
                this.logo.time = 0;
                this.hideMsgs();
                this.hideGrids();
                this.turtles.setBackgroundColor(-1);
                this.logo.svgOutput = "";
                this.logo.notationOutput = "";

                // Clear the recording buffer (Issue #2330)
                this.logo.recordingBuffer.hasData = false;
                this.logo.recordingBuffer.notationOutput = "";
                this.logo.recordingBuffer.notationNotes = {};
                this.logo.recordingBuffer.notationStaging = {};
                this.logo.recordingBuffer.notationDrumStaging = {};

                for (let turtle = 0; turtle < this.turtles.getTurtleCount(); turtle++) {
                    this.logo.turtleHeaps[turtle] = [];
                    this.logo.turtleDicts[turtle] = {};
                    this.logo.notation.notationStaging[turtle] = [];
                    this.logo.notation.notationDrumStaging[turtle] = [];
                    if (noErase === undefined || !noErase) {
                        this.turtles.getTurtle(turtle).painter.doClear(true, true, true);
                    }
                }

                this.blocksContainer.x = 0;
                this.blocksContainer.y = 0;

                const table = document.getElementById("myTable");
                if (table !== null) {
                    table.remove();
                }

                if (document.getElementById("helpfulWheelDiv").style.display !== "none") {
                    document.getElementById("helpfulWheelDiv").style.display = "none";
                    this.__tick();
                }
            };

            if (skipConfirmation) {
                clearCanvasAction();
            } else {
                renderClearConfirmation(clearCanvasAction);
            }
        };
        /**
         * Sets up play button functionality; runs Music Blocks.
         * @param env {specifies environment}
         */
        const doFastButton = (activity, env) => {
            activity.runMode = "normal";
            activity._doFastButton(env);
        };

        this._doFastButton = env => {
            this._onResize();
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
        const doRecordButton = activity => {
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
                return await navigator.mediaDevices.getDisplayMedia({
                    preferCurrentTab: "True",
                    systemAudio: "include",
                    audio: "True",
                    video: { mediaSource: "tab" },
                    bandwidthProfile: {
                        video: {
                            clientTrackSwitchOffControl: "auto",
                            contentPreferencesMode: "auto"
                        }
                    },
                    preferredVideoCodecs: "auto"
                });
            }

            const that = this;

            /**
             * Saves the recorded chunks as a video file.
             * @param {Blob[]} recordedChunks - The recorded video chunks.
             */
            function saveFile(recordedChunks) {
                flag = 1;
                recInside.classList.remove("blink");
                const blob = new Blob(recordedChunks, {
                    type: "video/webm"
                });

                const filename = window.prompt(_("Enter file name"));
                if (filename === null || filename.trim() === "") {
                    alert(_("File save canceled"));
                    flag = 0;
                    recording();
                    doRecordButton();
                    return; // Exit without saving the file
                }

                const downloadLink = document.createElement("a");
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
                that.textMsg(_("Click on stop saving"));
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
            function createRecorder(stream, mimeType) {
                flag = 1;
                recInside.classList.add("blink");
                start.removeEventListener("click", createRecorder, true);
                let recordedChunks = [];
                const mediaRecorder = new MediaRecorder(stream);
                stream.oninactive = function () {
                    // eslint-disable-next-line no-console
                    console.log("Recording is ready to save");
                    stopRec();
                    flag = 0;
                };

                mediaRecorder.onstop = function () {
                    saveFile(recordedChunks);
                    recordedChunks = [];
                    flag = 0;
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
                start.addEventListener("click", async function handler() {
                    const stream = await recordScreen();
                    const mimeType = "video/webm";
                    mediaRecorder = createRecorder(stream, mimeType);
                    if (flag == 1) {
                        this.removeEventListener("click", handler);
                    }
                    const node = document.createElement("p");
                    node.textContent = "Started recording";
                    document.body.appendChild(node);
                    recInside.setAttribute("fill", "red");
                });
            }

            // Start recording process if not already executing
            if (flag == 0 && isExecuting) {
                recording();
                start.dispatchEvent(clickEvent);
                flag = 1;
            }

            // Stop recording if already executing
            if (flag == 1 && isExecuting) {
                start.addEventListener("click", stopRec);
                flag = 0;
            }
        };

        /*
         * Runs Music Blocks at a slower rate
         */
        const doSlowButton = activity => {
            activity.runMode = "slow";
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
        const doStepButton = activity => {
            activity.runMode = "step";
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
                    document.getElementById("stop").style.color =
                        this.toolbar.stopIconColorWhenPlaying;
                }
                this.logo.step();
            } else {
                const noBlocks = Object.keys(this.logo.stepQueue).every(
                    key => this.logo.stepQueue[key].length === 0
                );
                if (noBlocks) {
                    this.logo.doStopTurtles();
                    document.getElementById("stop").style.color = "white";
                    return;
                }
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
        this._doHardStopButton = onblur => {
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
        const doSwitchMode = activity => {
            // Update toolbar
            activity.toolbar.renderSaveIcons(
                activity.save.saveHTML.bind(activity.save),
                doSVG,
                activity.save.saveSVG.bind(activity.save),
                activity.save.saveMIDI.bind(activity.save),
                activity.save.savePNG.bind(activity.save),
                activity.save.saveWAV.bind(activity.save),
                activity.save.saveLilypond.bind(activity.save),
                activity.save.afterSaveLilypondLY.bind(activity.save),
                activity.save.saveAbc.bind(activity.save),
                activity.save.saveMxml.bind(activity.save),
                activity.save.saveBlockArtwork.bind(activity.save),
                activity.save.saveBlockArtworkPNG.bind(activity.save)
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
        const setScroller = activity => {
            activity._setScroller();
            activity._setupBlocksContainerEvents();
            if (document.getElementById("helpfulWheelDiv").style.display !== "none") {
                document.getElementById("helpfulWheelDiv").style.display = "none";
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
            const enableHorizScrollIcon = document.getElementById("enableHorizScrollIcon");
            const disableHorizScrollIcon = document.getElementById("disableHorizScrollIcon");
            if (this.scrollBlockContainer && !this.beginnerMode) {
                enableHorizScrollIcon.style.display = "none";
                disableHorizScrollIcon.style.display = "block";

                this.helpfulWheelItems.forEach(ele => {
                    if (ele.label === "Enable horizontal scrolling") ele.display = false;
                    else if (ele.label === "Disable horizontal scrolling") ele.display = true;
                });
                activity.textMsg("Horizontal scrolling enabled.", 3000);
            } else {
                enableHorizScrollIcon.style.display = "block";
                disableHorizScrollIcon.style.display = "none";

                this.helpfulWheelItems.forEach(ele => {
                    if (ele.label === "Enable horizontal scrolling") ele.display = true;
                    else if (ele.label === "Disable horizontal scrolling") ele.display = false;
                });
                activity.textMsg("Horizontal scrolling disabled.", 3000);
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

            this.loadAnimationIntervalId = setInterval(changeText, 2000);
        };

        /**
         * Stops the loading animation and clears the interval.
         * This prevents the interval from running indefinitely in the background.
         */
        this.stopLoadAnimation = () => {
            if (this.loadAnimationIntervalId !== null) {
                clearInterval(this.loadAnimationIntervalId);
                this.loadAnimationIntervalId = null;
            }
            const loadContainer = document.getElementById("load-container");
            if (loadContainer) {
                loadContainer.style.display = "none";
            }
        };

        /**
         * Increases the size of blocks in the activity.
         * @param {object} activity - The activity object.
         */
        const doLargerBlocks = async activity => {
            await activity._doLargerBlocks();
            if (document.getElementById("helpfulWheelDiv").style.display !== "none") {
                document.getElementById("helpfulWheelDiv").style.display = "none";
                activity.__tick();
            }
        };

        this._doLargerBlocks = async () => {
            this.blocks.activeBlock = null;

            if (!this.resizeDebounce) {
                if (this.blockscale < BLOCKSCALES.length - 1) {
                    this.resizeDebounce = true;
                    this.blockscale += 1;
                    this.clearCache();
                    await this.blocks.setBlockScale(BLOCKSCALES[this.blockscale]);
                    this.blocks.checkBounds();
                    this.refreshCanvas();
                }

                const that = this;
                setTimeout(() => {
                    that.resizeDebounce = false;
                }, 200);
            }

            await this.setSmallerLargerStatus();
            await this.stage.update();
        };

        /**
         * Decreases the size of blocks in the activity.
         * @param {object} activity - The activity object.
         */
        const doSmallerBlocks = async activity => {
            await activity._doSmallerBlocks();
            if (document.getElementById("helpfulWheelDiv").style.display !== "none") {
                document.getElementById("helpfulWheelDiv").style.display = "none";
                activity.__tick();
            }
        };

        /**
         * Manages the resizing of blocks to handle larger size.
         */
        this._doSmallerBlocks = async () => {
            this.blocks.activeBlock = null;

            if (!this.resizeDebounce) {
                if (this.blockscale > 0) {
                    this.resizeDebounce = true;
                    this.blockscale -= 1;
                    this.clearCache();
                    await this.blocks.setBlockScale(BLOCKSCALES[this.blockscale]);
                    this.blocks.checkBounds();
                    this.refreshCanvas();
                }

                const that = this;
                setTimeout(() => {
                    that.resizeDebounce = false;
                }, 200);
            }

            await this.setSmallerLargerStatus();
            await this.stage.update();
        };

        /*
         * If either the block size has reached its minimum or maximum,
         * then the icons to make them smaller/bigger will be hidden.
         * Sets the status of the smaller and larger block icons based on the current block size.
         */
        this.setSmallerLargerStatus = async () => {
            if (BLOCKSCALES[this.blockscale] < DEFAULTBLOCKSCALE) {
                await changeImage(
                    this.smallerContainer.children[0],
                    SMALLERBUTTON,
                    SMALLERDISABLEBUTTON
                );
            } else {
                await changeImage(
                    this.smallerContainer.children[0],
                    SMALLERDISABLEBUTTON,
                    SMALLERBUTTON
                );
            }

            if (BLOCKSCALES[this.blockscale] === 4) {
                await changeImage(
                    this.largerContainer.children[0],
                    BIGGERBUTTON,
                    BIGGERDISABLEBUTTON
                );
            } else {
                await changeImage(
                    this.largerContainer.children[0],
                    BIGGERDISABLEBUTTON,
                    BIGGERBUTTON
                );
            }
        };

        /**
         * Deletes a plugin palette from local storage based on the active palette.
         * @param {object} activity - The activity object.
         */
        const deletePlugin = activity => {
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
                    const name =
                        this.palettes.dict[this.palettes.activePalette].protoList[i]["name"];
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
                [
                    "wheelDiv",
                    "contextWheelDiv",
                    "helpfulWheelDiv",
                    "textLabel",
                    "numberLabel"
                ].forEach(id => {
                    const elem = document.getElementById(id);
                    if (elem) elem.style.display = "none";
                });
            };

            /**
             * Normalizes wheel event data across different browsers.
             * @param {WheelEvent} event - The wheel event object.
             * @returns {Object} - Normalized pixelX and pixelY values.
             */
            const normalizeWheel = event => {
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
            const initialTouches = [
                [null, null],
                [null, null]
            ]; // Array to track two fingers (Y and X coordinates)

            /**
             * Handles touch start event on the canvas.
             * @param {TouchEvent} event - The touch event object.
             */
            myCanvas.addEventListener("touchstart", event => {
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
            myCanvas.addEventListener("touchmove", event => {
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

                            if (that.scrollBlockContainer && deltaX !== 0) {
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
            const __wheelHandler = event => {
                const data = normalizeWheel(event);
                const delY = data.pixelY;
                const delX = data.pixelX;

                if (event.ctrlKey) {
                    event.preventDefault();
                    delY < 0 ? doLargerBlocks(that) : doSmallerBlocks(that);
                } else {
                    closeAnyOpenMenusAndLabels();
                    if (that.scrollBlockContainer) {
                        // Horizontal scrolling enabled (Advanced)
                        if (delY !== 0) that.blocksContainer.y -= delY;
                        if (delX !== 0) that.blocksContainer.x -= delX;
                    } else {
                        // Vertical scrolling only (Beginner / Default)
                        if (event.axis === event.VERTICAL_AXIS && delY !== 0) {
                            that.blocksContainer.y -= delY;
                        }
                    }
                }

                that.refreshCanvas();
            };

            this.addEventListener(
                document.getElementById("myCanvas"),
                "wheel",
                __wheelHandler,
                false
            );

            /**
             * Handles stage mouse up event.
             * @param {MouseEvent} event - The mouse event object.
             */
            const __stageMouseUpHandler = event => {
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
            this.stage.on("stagemousemove", event => {
                that.stageX = event.stageX;
                that.stageY = event.stageY;
            });

            /**
             * Handles mouse down event on the stage.
             * @param {object} event - The mouse event object.
             */
            this.stage.on("stagemousedown", event => {
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
                that.stage.on("stagemousemove", event => {
                    that.stageX = event.stageX;
                    that.stageY = event.stageY;

                    if (!that.moving) return;

                    // if we are moving the block container, deselect the active block.
                    // Deselect active block if moving the block container
                    that.blocks.activeBlock = null;

                    // eslint-disable-next-line max-len
                    const delta =
                        Math.abs(event.stageX - lastCoords.x) +
                        Math.abs(event.stageY - lastCoords.y);

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
        this._createGrid = imagePath => {
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
            container.x = this.canvas.width / 2;
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

                container.on("click", () => {
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
        this._makeErrorArtwork = name => {
            const container = new createjs.Container();
            this.stage.addChild(container);
            container.x = this.canvas.width / 2;
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
                container.on("click", () => {
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
                            switch (block.name) {
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
            this.searchWidget.style.border = "2px solid lightblue";
            if (this.helpfulSearchDiv) {
                this._hideHelpfulSearchWidget();
            }
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
                const closeListener = e => {
                    if (
                        document.getElementById("search").style.visibility === "visible" &&
                        (e.target === document.getElementById("search") ||
                            document.getElementById("search").contains(e.target))
                    ) {
                        //do nothing when clicked in the input field
                    } else if (
                        document.getElementById("ui-id-1") &&
                        document.getElementById("ui-id-1").style.display === "block" &&
                        (e.target === document.getElementById("ui-id-1") ||
                            document.getElementById("ui-id-1").contains(e.target))
                    ) {
                        //do nothing when clicked on the menu
                    } else if (document.getElementsByTagName("tr")[2].contains(e.target)) {
                        //do nothing when clicked on the search row
                    } else {
                        // this will hide the search bar if someone clicks on menu items
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
                focus: event => {
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
                    .appendTo(
                        ul.css({
                            "z-index": 9999,
                            "max-height": "200px",
                            "overflow-y": "auto"
                        })
                    );
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
                    newBlock => {
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

        //To create a sampler widget
        this.makeSamplerWidget = (sampleName, sampleData) => {
            const samplerStack = [
                [
                    0,
                    "sampler",
                    300 - this.blocksContainer.x,
                    300 - this.blocksContainer.y,
                    [null, 1, 8]
                ],
                [1, "settimbre", 0, 0, [0, 2, 6, 7]],
                [2, ["customsample", { value: ["", "", "do", 4] }], 0, 0, [1, 3, 4, 5]],
                [3, ["audiofile", { value: [sampleName, sampleData] }], 0, 0, [2]],
                [4, ["solfege", { value: "do" }], 0, 0, [2]],
                [5, ["number", { value: 4 }], 0, 0, [2]],
                [6, "vspace", 0, 0, [1, null]],
                [7, "hidden", 0, 0, [1, null]],
                [8, "hiddennoflow", 0, 0, [0, null]]
            ];
            this.blocks.loadNewBlocks(samplerStack);
        };

        /*
         * Handles keyboard shortcuts in MB
         */
        this.__keyPressed = event => {
            // First, check if the pitch slider is open
            if (window.widgetWindows.isOpen("slider") === true) {
                // If the event is an arrow key, let the PitchSlider handle it
                if (
                    event.keyCode === 37 ||
                    event.keyCode === 38 ||
                    event.keyCode === 39 ||
                    event.keyCode === 40
                ) {
                    // Simply prevent default behavior here
                    // The actual pitch slider handling is done in the PitchSlider class
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            }

            if (window.widgetWindows.isOpen("JavaScript Editor") === true) return;
            if (!this.keyboardEnableFlag) {
                return;
            }
            if (document.getElementById("labelDiv").classList.contains("hasKeyboard")) {
                return;
            }
            // Skip hotkeys when value bar is visible (prevents accidental block creation)
            if (this.printText && this.printText.classList.contains("show")) {
                return;
            }

            if (this.keyboardEnableFlag) {
                if (
                    document.getElementById("BPMInput") !== null &&
                    document.getElementById("BPMInput").classList.contains("hasKeyboard")
                ) {
                    return;
                }
                if (
                    document.getElementById("musicratio1") !== null &&
                    document.getElementById("musicratio1").classList.contains("hasKeyboard")
                ) {
                    return;
                }
                if (
                    document.getElementById("musicratio2") !== null &&
                    document.getElementById("musicratio2").classList.contains("hasKeyboard")
                ) {
                    return;
                }
                if (
                    document.getElementById("dissectNumber") !== null &&
                    document.getElementById("dissectNumber").classList.contains("hasKeyboard")
                ) {
                    return;
                }
                if (
                    document.getElementById("timbreName") !== null &&
                    document.getElementById("timbreName").classList.contains("hasKeyboard")
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
            const disableKeys =
                document.getElementById("lilypondModal").style.display === "block" ||
                this.searchWidget.style.visibility === "visible" ||
                this.helpfulSearchWidget.style.visibility === "visible" ||
                this.isInputON ||
                document.getElementById("samplerPrompt") ||
                document.getElementById("planet-iframe").style.display === "" ||
                document.getElementById("paste").style.visibility === "visible" ||
                document.getElementById("wheelDiv").style.display === "" ||
                this.turtles.running();
            const widgetTitle = document.getElementsByClassName("wftTitle");
            for (let i = 0; i < widgetTitle.length; i++) {
                if (widgetTitle[i].innerHTML === "tempo") {
                    this.inTempoWidget = true;
                    break;
                }
            }
            if (
                (event.altKey && !disableKeys) ||
                event.keyCode == 13 ||
                event.key == "/" ||
                event.key == "\\"
            ) {
                switch (event.keyCode) {
                    case 66: // 'B'
                        this.textMsg("Alt-B " + _("Saving block artwork"));
                        this.save.saveBlockArtwork();
                        break;
                    case 67: // 'C'
                        this.textMsg("Alt-C " + _("Copy"));
                        this.blocks.prepareStackForCopy();
                        break;
                    case 69: // 'E'
                        this.textMsg("Alt-E " + _("Erase"));
                        this._allClear(false);
                        break;
                    case 82: {
                        // 'R or ENTER'
                        this.textMsg("Alt-R " + _("Play"));
                        const stopbtn = document.getElementById("stop");
                        if (stopbtn) {
                            stopbtn.style.color = platformColor.stopIconcolor;
                        }
                        this._doFastButton();
                        break;
                    }
                    case 13: {
                        // 'R or ENTER'
                        if (this.isInputON) return;

                        if (this.searchWidget.style.visibility === "visible") {
                            return;
                        }
                        if (document.getElementById("paste").style.visibility === "visible") {
                            this.pasted();
                            document.getElementById("paste").style.visibility = "hidden";
                            return;
                        }
                        this.textMsg("Enter " + _("Play"));
                        const stopbt = document.getElementById("stop");
                        if (stopbt) {
                            stopbt.style.color = platformColor.stopIconcolor;
                        }
                        this._doFastButton();
                        break;
                    }
                    case 83: // 'S'
                        this.textMsg("Alt-S " + _("Stop"));
                        this.logo.doStopTurtles();
                        break;
                    case 86: // 'V'
                        // this.textMsg("Alt-V " + _("Paste"));
                        this.blocks.pasteStack();
                        break;
                    case 72: // 'H' save block help
                        this.textMsg("Alt-H " + _("Save block help"));
                        this._saveHelpBlocks();
                        break;
                    case 191:
                        if (
                            event.key == "/" &&
                            !this.beginnerMode &&
                            disableHorizScrollIcon.style.display == "block"
                        ) {
                            this.blocksContainer.x += this.canvas.width / 10;
                            this.stage.update();
                        }
                    // fall through
                    case 220:
                        if (
                            event.key == "\\" &&
                            !this.beginnerMode &&
                            disableHorizScrollIcon.style.display == "block"
                        ) {
                            this.blocksContainer.x -= this.canvas.width / 10;
                            this.stage.update();
                        }
                }
            } else if (event.ctrlKey) {
                switch (event.keyCode) {
                    case V:
                        // this.textMsg("Ctl-V " + _("Paste"));
                        this.pasteBox.createBox(this.turtleBlocksScale, 200, 200);
                        this.pasteBox.show();
                        document.getElementById("paste").style.left =
                            (this.pasteBox.getPos()[0] + 10) * this.turtleBlocksScale + "px";
                        document.getElementById("paste").style.top =
                            (this.pasteBox.getPos()[1] + 10) * this.turtleBlocksScale + "px";
                        document.getElementById("paste").focus();
                        document.getElementById("paste").style.visibility = "visible";
                        this.update = true;
                        break;
                }
            } else if (event.shiftKey && !disableKeys) {
                switch (event.keyCode) {
                    case SPACE:
                        event.preventDefault();
                        if (this.turtleContainer.scaleX === 1) {
                            this.turtles.setStageScale(0.5);
                        } else {
                            this.turtles.setStageScale(1);
                        }
                        break;
                }
            } else {
                if (
                    document.getElementById("paste").style.visibility === "visible" &&
                    event.keyCode === RETURN
                ) {
                    if (document.getElementById("paste").value.length > 0) {
                        this.pasted();
                    }
                } else if (event.keyCode === SPACE) {
                    // Check if any widget window is open
                    const hasOpenWidget = Object.values(window.widgetWindows.openWindows).some(
                        w => w
                    );
                    if (this.turtles.running()) {
                        event.preventDefault();
                        this._doHardStopButton();
                    } else if (!disableKeys && !hasOpenWidget) {
                        event.preventDefault();
                        this._doFastButton();
                    }
                } else if (!disableKeys) {
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
                                        -STANDARDBLOCKHEIGHT,
                                        1
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
        this._onResize = force => {
            if (!force) {
                if (this.saveLocally !== null) {
                    this.saveLocally();
                }
            }
            if (!this.stage) {
                return;
            }

            const $j = jQuery.noConflict();
            let w = 0,
                h = 0;
            if (typeof platform !== "undefined" && !platform.androidWebkit) {
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

            if (document.getElementById("labelDiv").classList.contains("hasKeyboard")) {
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
            this.tenorSharpBitmap[0].y += +87.5;
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
            if (typeof platform !== "undefined" && platform.mobile) {
                // palettes.setMobile(true);
                // palettes.hide();
                this.toolbar.disableTooltips($j);
            } else {
                this.palettes.setMobile(false);
            }

            for (let turtle = 0; turtle < this.turtles.getTurtleCount(); turtle++) {
                this.turtles.getTurtle(turtle).painter.doClear(false, false, true);
            }

            const artcanvas = document.getElementById("overlayCanvas");
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
            const isMaximized =
                window.innerWidth === window.screen.width &&
                window.innerHeight === window.screen.height;
            if (isMaximized) {
                container.style.width = defaultWidth + "px";
                container.style.height = defaultHeight + "px";
                canvas.width = defaultWidth;
                canvas.height = defaultHeight;
                overCanvas.width = canvas.width;
                overCanvas.height = canvas.width;
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
                overCanvas.height = canvas.width;
                canvasHolder.width = canvas.width;
                canvasHolder.height = canvas.height;
            }
            document.getElementById("hideContents").click();
            that.refreshCanvas();
        }

        let resizeTimeout;
        this._handleWindowResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                handleResize();
                this._setupPaletteMenu();
            }, 100);
        };
        this.addEventListener(window, "resize", this._handleWindowResize);
        this._handleOrientationChangeResize = handleResize;
        this.addEventListener(window, "orientationchange", this._handleOrientationChangeResize);
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
        this._handleOrientationChangeResizeCanvas = resizeCanvas_;
        this.addEventListener(
            window,
            "orientationchange",
            this._handleOrientationChangeResizeCanvas
        );

        /*
         * Restore last stack pushed to trashStack back onto canvas.
         * Hides palettes before update
         * Repositions blocks about trash area
         */
        const restoreTrash = activity => {
            if (
                !activity.blocks ||
                !activity.blocks.trashStacks ||
                activity.blocks.trashStacks.length === 0
            ) {
                activity.textMsg(_("Trash can is empty."), 3000);
                return;
            }

            if (document.getElementById("helpfulWheelDiv").style.display !== "none") {
                document.getElementById("helpfulWheelDiv").style.display = "none";
                activity.__tick();
            }
        };

        const restoreTrashPop = activity => {
            if (
                !activity.blocks ||
                !activity.blocks.trashStacks ||
                activity.blocks.trashStacks.length === 0
            ) {
                activity.textMsg(_("Trash can is empty."), 3000);
                return;
            }
            this._restoreTrashById(this.blocks.trashStacks[this.blocks.trashStacks.length - 1]);
            activity.textMsg(_("Item restored from the trash."), 3000);

            if (document.getElementById("helpfulWheelDiv").style.display !== "none") {
                document.getElementById("helpfulWheelDiv").style.display = "none";
                activity.__tick();
            }
        };

        this._restoreTrashById = blockId => {
            const blockIndex = this.blocks.trashStacks.indexOf(blockId);
            if (blockIndex === -1) return; // Block not found in trash

            this.blocks.trashStacks.splice(blockIndex, 1); // Remove from trash

            for (const name in this.palettes.dict) {
                this.palettes.dict[name].hideMenu(true);
            }
            this.blocks.activeBlock = null;
            this.refreshCanvas();

            const dx = 0;
            const dy = -this.cellSize * 3; // Reposition

            // Restore drag group
            this.blocks.findDragGroup(blockId);
            for (let b = 0; b < this.blocks.dragGroup.length; b++) {
                const blk = this.blocks.dragGroup[b];
                this.blocks.blockList[blk].trash = false;
                this.blocks.moveBlockRelative(blk, dx, dy);
                this.blocks.blockList[blk].show();
            }

            this.blocks.raiseStackToTop(blockId);
            const restoredBlock = this.blocks.blockList[blockId];

            if (restoredBlock.name === "start" || restoredBlock.name === "drum") {
                const turtle = restoredBlock.value;
                this.turtles.getTurtle(turtle).inTrash = false;
                this.turtles.getTurtle(turtle).container.visible = true;
            } else if (restoredBlock.name === "action") {
                const actionArg = this.blocks.blockList[restoredBlock.connections[1]];
                if (actionArg !== null) {
                    let label;
                    const oldName = actionArg.value;
                    restoredBlock.trash = true;
                    const uniqueName = this.blocks.findUniqueActionName(oldName);
                    restoredBlock.trash = false;

                    if (uniqueName !== actionArg) {
                        actionArg.value = uniqueName;
                        label =
                            uniqueName.length > 8 ? uniqueName.substr(0, 7) + "..." : uniqueName;
                        actionArg.text.text = label;

                        if (actionArg.label !== null) {
                            actionArg.label.value = uniqueName;
                        }
                        actionArg.container.updateCache();
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
                                label =
                                    uniqueName.length > 8
                                        ? uniqueName.substr(0, 7) + "..."
                                        : uniqueName;
                                me.text.text = label;
                                me.overrideName = label;
                                me.regenerateArtwork();
                                me.container.updateCache();
                            }
                        }
                    }
                }
            }
            activity.textMsg(_("Item restored from the trash."), 3000);

            this.refreshCanvas();
        };

        // Add event listener for trash icon click
        document.getElementById("restoreIcon").addEventListener("click", () => {
            this._renderTrashView();
        });

        // function to hide trashView from canvas
        function handleClickOutsideTrashView(trashView) {
            let firstClick = true;
            document.addEventListener("click", event => {
                if (firstClick) {
                    firstClick = false;
                    return;
                }
                if (!trashView.contains(event.target) && event.target !== trashView) {
                    trashView.style.display = "none";
                }
            });
        }

        this._renderTrashView = () => {
            if (
                !activity.blocks ||
                !activity.blocks.trashStacks ||
                activity.blocks.trashStacks.length === 0
            ) {
                return;
            }
            const trashList = document.getElementById("trashList");
            const trashView = document.createElement("div");
            trashView.id = "trashView";
            trashView.classList.add("trash-view");

            // Sticky icons
            const buttonContainer = document.createElement("div");
            buttonContainer.classList.add("button-container");

            const restoreLastIcon = document.createElement("a");
            restoreLastIcon.id = "restoreLastIcon";
            restoreLastIcon.classList.add("restore-last-icon");
            restoreLastIcon.innerHTML = '<i class="material-icons md-48">restore_from_trash</i>';
            restoreLastIcon.addEventListener("click", () => {
                this._restoreTrashById(this.blocks.trashStacks[this.blocks.trashStacks.length - 1]);
                trashView.classList.add("hidden");
            });

            const restoreAllIcon = document.createElement("a");
            restoreAllIcon.id = "restoreAllIcon";
            restoreAllIcon.classList.add("restore-all-icon");
            restoreAllIcon.innerHTML = '<i class="material-icons md-48">delete_sweep</i>';
            restoreAllIcon.addEventListener("click", () => {
                while (this.blocks.trashStacks.length > 0) {
                    this._restoreTrashById(this.blocks.trashStacks[0]);
                }
                trashView.classList.add("hidden");
            });
            restoreLastIcon.setAttribute("title", _("Restore last item"));
            restoreAllIcon.setAttribute("title", _("Restore all items"));

            buttonContainer.appendChild(restoreLastIcon);
            buttonContainer.appendChild(restoreAllIcon);
            trashView.appendChild(buttonContainer);

            // Render trash items
            this.blocks.trashStacks.forEach(blockId => {
                const block = this.blocks.blockList[blockId];
                const listItem = document.createElement("div");
                listItem.classList.add("trash-item");

                const svgData = block.artwork;
                const encodedData = "data:image/svg+xml;utf8," + encodeURIComponent(svgData);

                const img = document.createElement("img");
                img.src = encodedData;
                img.alt = "Block Icon";
                img.classList.add("trash-item-icon");

                const textNode = document.createTextNode(block.name);

                listItem.appendChild(img);
                listItem.appendChild(textNode);
                listItem.dataset.blockId = blockId;

                listItem.addEventListener("mouseover", () => listItem.classList.add("hover"));
                listItem.addEventListener("mouseout", () => listItem.classList.remove("hover"));
                listItem.addEventListener("click", () => {
                    this._restoreTrashById(blockId);
                    trashView.classList.add("hidden");
                });
                handleClickOutsideTrashView(trashView);

                trashView.appendChild(listItem);
            });

            const existingView = document.getElementById("trashView");
            if (existingView) {
                trashList.replaceChild(trashView, existingView);
            } else {
                trashList.appendChild(trashView);
            }
        };

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

        this._showHideAuxMenu = resize => {
            const cellsize = 55;
            let dy;

            // function to increase or decrease the "top" property of the top-right corner buttons

            const topRightButtons = document.querySelectorAll("#buttoncontainerTOP .tooltipped");
            const gridElement = document.getElementById("Grid");
            const btnY = gridElement ? gridElement.getBoundingClientRect().top : 70 + LEADING + 6;

            this.changeTopButtonsPosition = value => {
                topRightButtons.forEach(child => {
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
            } else {
                dy = this.toolbarHeight;
                this.toolbarHeight = 0;

                this.turtles.deltaY(-dy);
                this.palettes.deltaY(-dy);
                this.blocksContainer.y -= dy;
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
         * @param {boolean} closeAllWidgets  {if true close all open widgets}
         */
        this.sendAllToTrash = (addStartBlock, doNotSave, closeAllWidgets = true) => {
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
                        this.turtles.getTurtle(turtle).inTrash = true;
                        this.turtles.getTurtle(turtle).container.visible = false;
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
            if (closeAllWidgets) {
                closeWidgets();
            }
        };

        /*
         * Toggles block/palette visibility
         */
        const changeBlockVisibility = activity => {
            activity._changeBlockVisibility();
            if (document.getElementById("helpfulWheelDiv").style.display !== "none") {
                document.getElementById("helpfulWheelDiv").style.display = "none";
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
        const toggleCollapsibleStacks = activity => {
            activity._toggleCollapsibleStacks();
            if (document.getElementById("helpfulWheelDiv").style.display !== "none") {
                document.getElementById("helpfulWheelDiv").style.display = "none";
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
         * Clears cache for all blocks
         */
        this.clearCache = () => {
            this.blocks.blockList.forEach(block => {
                if (block.container) {
                    block.container.uncache();
                    block.container.cache();
                }
                if (block.bitmap) {
                    block.bitmap.uncache();
                    block.bitmap.cache();
                }
            });
        };

        /*
         * Updates all canvas elements by marking stage as dirty.
         * The actual render will happen on the next animation frame.
         */
        this.refreshCanvas = () => {
            if (this.blockRefreshCanvas) {
                return;
            }

            this.blockRefreshCanvas = true;
            // Mark stage as needing update
            this.stageDirty = true;
            this.update = true;

            const that = this;
            setTimeout(() => {
                that.blockRefreshCanvas = false;
                that.stageDirty = true;
            }, 5);
        };

        /*
         * This sets the dirty flag so the stage re-renders on the next
         * animation frame when an event handler indicates a change has happened.
         */
        this.__tick = event => {
            if (this.update || createjs.Tween.hasActiveTweens()) {
                this.update = false;
                this.stageDirty = true;
            }
        };

        /*
         * Marks the stage as needing a redraw on the next animation frame.
         * Call this whenever visual changes occur that need to be rendered.
         */
        this.markStageDirty = () => {
            this.stageDirty = true;
        };

        /*
         * Opens samples on planet after closing all sub menus.
         */
        const doOpenSamples = that => {
            that._doOpenSamples();
        };

        this._doOpenSamples = () => {
            if (document.getElementById("palette").style.display !== "none")
                document.getElementById("palette").style.display = "none";
            this.toolbar.closeAuxToolbar(showHideAuxMenu);
            this.planet.openPlanet();
            if (document.getElementById("buttoncontainerBOTTOM").style.display !== "none")
                document.getElementById("buttoncontainerBOTTOM").style.display = "none";
            if (document.getElementById("buttoncontainerTOP").style.display !== "none")
                document.getElementById("buttoncontainerTOP").style.display = "none";
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
        const chooseKeyMenu = that => {
            piemenuKey(that);
            if (document.getElementById("helpfulWheelDiv").style.display !== "none") {
                document.getElementById("helpfulWheelDiv").style.display = "none";
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
            that._allClear(true, true);
        };

        window.prepareExport = this.prepareExport;

        /**
         * Runs music blocks project.
         * @param env {specifies environment}
         */
        this.runProject = env => {
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

        this.getClosestStandardNoteValue = function (duration) {
            let closest = standardDurations[0];
            let minDiff = Math.abs(duration - closest.duration);

            for (let i = 1; i < standardDurations.length; i++) {
                let diff = Math.abs(duration - standardDurations[i].duration);
                if (diff < minDiff) {
                    closest = standardDurations[i];
                    minDiff = diff;
                }
            }

            return closest.value.split("/").map(Number);
        };

        /**
         * Loads MB project from Planet.
         * @param  projectID {Planet project ID}
         * @param  flags     {parameters}
         * @param  env       {specifies environment}
         */
        const loadProject = (activity, projectID, flags, env) => {
            activity._loadProject(projectID, flags, env);
        };

        const loadStart = async that => {
            const __afterLoad = async () => {
                if (!that.turtles.running()) {
                    that.stage.update(event);
                    for (let turtle = 0; turtle < that.turtles.getTurtleCount(); turtle++) {
                        that.logo.turtleHeaps[turtle] = [];
                        that.logo.turtleDicts[turtle] = {};
                        that.logo.notation.notationStaging[turtle] = [];
                        that.logo.notation.notationDrumStaging[turtle] = [];
                        that.turtles.getTurtle(turtle).painter.doClear(true, true, false);
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

        this._loadProject = (projectID, flags) => {
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
                        for (let turtle = 0; turtle < that.turtles.getTurtleCount(); turtle++) {
                            that.turtles.getTurtle(turtle).painter.doClear(true, true, false);
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
                const noteToCompare = acc.note.toUpperCase().replace(",", "");
                note = note.replace(",", "");
                return noteToCompare.toLowerCase() === note.toLowerCase();
            });

            if (accidental) {
                return (
                    note + (accidental.acc === "sharp" ? "♯" : accidental.acc === "flat" ? "♭" : "")
                );
            } else {
                return note;
            }
        }
        // When converting to pitch value from ABC to MB there is issue
        // with the octave conversion. We map the pitch to audible pitch.
        function _abcToStandardValue(pitchValue) {
            const octave = Math.floor(pitchValue / 7) + 4;
            return octave;
        }
        // Creates pitch which consist of note pitch notename you could
        // see them in the function.
        function _createPitchBlocks(
            pitches,
            blockId,
            pitchDuration,
            keySignature,
            actionBlock,
            triplet,
            meterDen
        ) {
            const blocks = [];

            const pitch = pitches;
            pitchDuration = toFraction(pitchDuration);
            const adjustedNote = _adjustPitch(pitch.name, keySignature).toUpperCase();
            if (triplet !== undefined && triplet !== null) {
                pitchDuration[1] = meterDen * triplet;
            }

            actionBlock.push(
                [
                    blockId,
                    ["newnote", { collapsed: true }],
                    0,
                    0,
                    [blockId - 1, blockId + 1, blockId + 4, blockId + 8]
                ],
                [blockId + 1, "divide", 0, 0, [blockId, blockId + 2, blockId + 3]],
                [blockId + 2, ["number", { value: pitchDuration[0] }], 0, 0, [blockId + 1]],
                [blockId + 3, ["number", { value: pitchDuration[1] }], 0, 0, [blockId + 1]],
                [blockId + 4, "vspace", 0, 0, [blockId, blockId + 5]],
                [blockId + 5, "pitch", 0, 0, [blockId + 4, blockId + 6, blockId + 7, null]],
                [blockId + 6, ["notename", { value: adjustedNote }], 0, 0, [blockId + 5]],
                [
                    blockId + 7,
                    ["number", { value: _abcToStandardValue(pitch.pitch) }],
                    0,
                    0,
                    [blockId + 5]
                ],
                [blockId + 8, "hidden", 0, 0, [blockId, blockId + 9]]
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
            const musicBlocksJSON = [];
            const staffBlocksMap = {};
            const organizeBlock = {};
            let blockId = 0;
            let tripletFinder = null;
            const title = (tune.metaText?.title ?? "title").toString().toLowerCase();
            const instruction = (tune.metaText?.instruction ?? "guitar").toString().toLowerCase();

            tune.lines?.forEach(line => {
                line.staff?.forEach((staff, staffIndex) => {
                    if (!organizeBlock.hasOwnProperty(staffIndex)) {
                        organizeBlock[staffIndex] = {
                            arrangedBlocks: []
                        };
                    }

                    organizeBlock[staffIndex].arrangedBlocks.push(staff);
                });
            });
            for (const lineId in organizeBlock) {
                organizeBlock[lineId].arrangedBlocks?.forEach(staff => {
                    if (!staffBlocksMap.hasOwnProperty(lineId)) {
                        staffBlocksMap[lineId] = {
                            meterNum: staff?.meter?.value[0]?.num || 4,
                            meterDen: staff?.meter?.value[0]?.den || 4,
                            keySignature: staff.key,
                            baseBlocks: [],
                            startBlock: [
                                [
                                    blockId,
                                    ["start", { collapsed: false }],
                                    100,
                                    100,
                                    [null, blockId + 1, null]
                                ],
                                [blockId + 1, "print", 0, 0, [blockId, blockId + 2, blockId + 3]],
                                [blockId + 2, ["text", { value: title }], 0, 0, [blockId + 1]],
                                [
                                    blockId + 3,
                                    "setturtlename2",
                                    0,
                                    0,
                                    [blockId + 1, blockId + 4, blockId + 5]
                                ],
                                [
                                    blockId + 4,
                                    ["text", { value: `Voice ${parseInt(lineId) + 1} ` }],
                                    0,
                                    0,
                                    [blockId + 3]
                                ],
                                [
                                    blockId + 5,
                                    "meter",
                                    0,
                                    0,
                                    [blockId + 3, blockId + 6, blockId + 7, blockId + 10]
                                ],
                                [
                                    blockId + 6,
                                    ["number", { value: staff?.meter?.value[0]?.num || 4 }],
                                    0,
                                    0,
                                    [blockId + 5]
                                ],
                                [
                                    blockId + 7,
                                    "divide",
                                    0,
                                    0,
                                    [blockId + 5, blockId + 8, blockId + 9]
                                ],
                                [blockId + 8, ["number", { value: 1 }], 0, 0, [blockId + 7]],
                                [
                                    blockId + 9,
                                    ["number", { value: staff?.meter?.value[0]?.den || 4 }],
                                    0,
                                    0,
                                    [blockId + 7]
                                ],
                                [blockId + 10, "vspace", 0, 0, [blockId + 5, blockId + 11]],
                                [
                                    blockId + 11,
                                    "setkey2",
                                    0,
                                    0,
                                    [blockId + 10, blockId + 12, blockId + 13, blockId + 14]
                                ],
                                [
                                    blockId + 12,
                                    ["notename", { value: staff.key.root }],
                                    0,
                                    0,
                                    [blockId + 11]
                                ],
                                [
                                    blockId + 13,
                                    [
                                        "modename",
                                        { value: staff.key.mode == "m" ? "minor" : "major" }
                                    ],
                                    0,
                                    0,
                                    [blockId + 11]
                                ],
                                //In Settimbre instead of null it should be nameddoblock of first action block
                                [
                                    blockId + 14,
                                    "settimbre",
                                    0,
                                    0,
                                    [blockId + 11, blockId + 15, null, blockId + 16]
                                ],
                                [
                                    blockId + 15,
                                    ["voicename", { value: instruction }],
                                    0,
                                    0,
                                    [blockId + 14]
                                ],
                                [blockId + 16, "hidden", 0, 0, [blockId + 14, null]]
                            ],
                            repeatBlock: [],
                            repeatArray: [],
                            nameddoArray: {}
                        };

                        // For adding 17 blocks above
                        blockId += 17;
                    }

                    const actionBlock = [];
                    staff.voices.forEach(voice => {
                        voice.forEach(element => {
                            if (element.el_type === "note") {
                                //check if triplet exists
                                if (
                                    element?.startTriplet !== null &&
                                    element?.startTriplet !== undefined
                                ) {
                                    tripletFinder = element.startTriplet;
                                }

                                // Check and set tripletFinder to null
                                // if element?.endTriplets exists.
                                _createPitchBlocks(
                                    element.pitches[0],
                                    blockId,
                                    element.duration,
                                    staff.key,
                                    actionBlock,
                                    tripletFinder,
                                    staffBlocksMap[lineId].meterDen
                                );
                                if (
                                    element?.endTriplet !== null &&
                                    element?.endTriplet !== undefined
                                ) {
                                    tripletFinder = null;
                                }
                                blockId = blockId + 9;
                            } else if (element.el_type === "bar") {
                                if (element.type === "bar_left_repeat") {
                                    staffBlocksMap[lineId].repeatArray.push({
                                        start: staffBlocksMap[lineId].baseBlocks.length,
                                        end: -1
                                    });
                                } else if (element.type === "bar_right_repeat") {
                                    const endBlockSearch = staffBlocksMap[lineId].repeatArray;

                                    for (const repeatbar in endBlockSearch) {
                                        if (endBlockSearch[repeatbar].end === -1) {
                                            staffBlocksMap[lineId].repeatArray[repeatbar].end =
                                                staffBlocksMap[lineId].baseBlocks.length;
                                        }
                                    }
                                }
                            }
                        });

                        // Update the newnote connection with hidden
                        actionBlock[0][4][0] = blockId + 3;
                        actionBlock[actionBlock.length - 1][4][1] = null;

                        // Update the namedo block if not first
                        // nameddo block appear
                        if (staffBlocksMap[lineId].baseBlocks.length != 0) {
                            staffBlocksMap[lineId].baseBlocks[
                                staffBlocksMap[lineId].baseBlocks.length - 1
                            ][0][
                                staffBlocksMap[lineId].baseBlocks[
                                    staffBlocksMap[lineId].baseBlocks.length - 1
                                ][0].length - 4
                            ][4][1] = blockId;
                        }
                        // Add the nameddo action text and hidden
                        // block for each line
                        actionBlock.push(
                            [
                                blockId,
                                [
                                    "nameddo",
                                    {
                                        value: `V: ${parseInt(lineId) + 1} Line ${
                                            staffBlocksMap[lineId]?.baseBlocks?.length + 1
                                        }`
                                    }
                                ],
                                0,
                                0,
                                [
                                    staffBlocksMap[lineId].baseBlocks.length === 0
                                        ? null
                                        : staffBlocksMap[lineId].baseBlocks[
                                              staffBlocksMap[lineId].baseBlocks.length - 1
                                          ][0][
                                              staffBlocksMap[lineId].baseBlocks[
                                                  staffBlocksMap[lineId].baseBlocks.length - 1
                                              ][0].length - 4
                                          ][0],
                                    null
                                ]
                            ],
                            [
                                blockId + 1,
                                ["action", { collapsed: false }],
                                100,
                                100,
                                [null, blockId + 2, blockId + 3, null]
                            ],
                            [
                                blockId + 2,
                                [
                                    "text",
                                    {
                                        value: `V: ${parseInt(lineId) + 1} Line ${
                                            staffBlocksMap[lineId]?.baseBlocks?.length + 1
                                        }`
                                    }
                                ],
                                0,
                                0,
                                [blockId + 1]
                            ],
                            [blockId + 3, "hidden", 0, 0, [blockId + 1, actionBlock[0][0]]]
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

            const finalBlock = [];
            // Some Error are here need to be fixed
            for (const staffIndex in staffBlocksMap) {
                staffBlocksMap[staffIndex].startBlock[
                    staffBlocksMap[staffIndex].startBlock.length - 3
                ][4][2] =
                    staffBlocksMap[staffIndex].baseBlocks[0][0][
                        staffBlocksMap[staffIndex].baseBlocks[0][0].length - 4
                    ][0];
                // Update the first namedo block with settimbre
                staffBlocksMap[staffIndex].baseBlocks[0][0][
                    staffBlocksMap[staffIndex].baseBlocks[0][0].length - 4
                ][4][0] =
                    staffBlocksMap[staffIndex].startBlock[
                        staffBlocksMap[staffIndex].startBlock.length - 3
                    ][0];
                const repeatblockids = staffBlocksMap[staffIndex].repeatArray;
                for (const repeatId of repeatblockids) {
                    if (repeatId.start == 0) {
                        staffBlocksMap[staffIndex].repeatBlock.push([
                            blockId,
                            "repeat",
                            0,
                            0,
                            [
                                staffBlocksMap[staffIndex].startBlock[
                                    staffBlocksMap[staffIndex].startBlock.length - 3
                                ][0] /*setribmre*/,
                                blockId + 1,
                                staffBlocksMap[staffIndex].nameddoArray[staffIndex][0],
                                staffBlocksMap[staffIndex].nameddoArray[staffIndex][
                                    repeatId.end + 1
                                ] === null
                                    ? null
                                    : staffBlocksMap[staffIndex].nameddoArray[staffIndex][
                                          repeatId.end + 1
                                      ]
                            ]
                        ]);
                        staffBlocksMap[staffIndex].repeatBlock.push([
                            blockId + 1,
                            ["number", { value: 2 }],
                            100,
                            100,
                            [blockId]
                        ]);

                        // Update the settrimbre block
                        staffBlocksMap[staffIndex].startBlock[
                            staffBlocksMap[staffIndex].startBlock.length - 3
                        ][4][2] = blockId;
                        const firstnammedo = _searchIndexForMusicBlock(
                            staffBlocksMap[staffIndex].baseBlocks[0][0],
                            staffBlocksMap[staffIndex].nameddoArray[staffIndex][0]
                        );
                        const endnammedo = _searchIndexForMusicBlock(
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end][0],
                            staffBlocksMap[staffIndex].nameddoArray[staffIndex][repeatId.end]
                        );
                        // Because its [0] is the first nammeddo block
                        // obviously. Check if
                        // staffBlocksMap[staffIndex].baseBlocks[repeatId.end+1
                        // exists and has a [0] element
                        if (
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1] &&
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0]
                        ) {
                            const secondnammedo = _searchIndexForMusicBlock(
                                staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0],
                                staffBlocksMap[staffIndex].nameddoArray[staffIndex][
                                    repeatId.end + 1
                                ]
                            );

                            if (secondnammedo != -1) {
                                staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0][
                                    secondnammedo
                                ][4][0] = blockId;
                            }
                        }
                        staffBlocksMap[staffIndex].baseBlocks[0][0][firstnammedo][4][0] = blockId;
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.end][0][endnammedo][4][1] =
                            null;

                        blockId += 2;
                    } else {
                        const currentnammeddo = _searchIndexForMusicBlock(
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0],
                            staffBlocksMap[staffIndex].nameddoArray[staffIndex][repeatId.start]
                        );
                        const prevnameddo = _searchIndexForMusicBlock(
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.start - 1][0],
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][
                                currentnammeddo
                            ][4][0]
                        );
                        const afternamedo = _searchIndexForMusicBlock(
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end][0],
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][
                                currentnammeddo
                            ][4][1]
                        );
                        let prevrepeatnameddo = -1;
                        if (prevnameddo === -1) {
                            prevrepeatnameddo = _searchIndexForMusicBlock(
                                staffBlocksMap[staffIndex].repeatBlock,
                                staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][
                                    currentnammeddo
                                ][4][0]
                            );
                        }
                        const prevBlockId =
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][
                                currentnammeddo
                            ][4][0];
                        const currentBlockId =
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][
                                currentnammeddo
                            ][0];

                        // Needs null checking optmizie
                        const nextBlockId =
                            staffBlocksMap[staffIndex].nameddoArray[staffIndex][repeatId.end + 1];

                        staffBlocksMap[staffIndex].repeatBlock.push([
                            blockId,
                            "repeat",
                            0,
                            0,
                            [
                                staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][
                                    currentnammeddo
                                ][4][0],
                                blockId + 1,
                                currentBlockId,
                                nextBlockId === null ? null : nextBlockId
                            ]
                        ]);
                        staffBlocksMap[staffIndex].repeatBlock.push([
                            blockId + 1,
                            ["number", { value: 2 }],
                            100,
                            100,
                            [blockId]
                        ]);
                        if (prevnameddo != -1) {
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.start - 1][0][
                                prevnameddo
                            ][4][1] = blockId;
                        } else {
                            staffBlocksMap[staffIndex].repeatBlock[prevrepeatnameddo][4][3] =
                                blockId;
                        }
                        if (afternamedo !== -1) {
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end][0][
                                afternamedo
                            ][4][1] = null;
                        }
                        staffBlocksMap[staffIndex].baseBlocks[repeatId.start][0][
                            currentnammeddo
                        ][4][0] = blockId;
                        if (nextBlockId !== null) {
                            const nextnameddo = _searchIndexForMusicBlock(
                                staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0],
                                nextBlockId
                            );
                            staffBlocksMap[staffIndex].baseBlocks[repeatId.end + 1][0][
                                nextnameddo
                            ][4][0] = blockId;
                        }
                        blockId += 2;
                    }
                }

                const lineBlock = staffBlocksMap[staffIndex].baseBlocks.reduce(
                    (acc, curr) => acc.concat(curr),
                    []
                );
                // Flatten the multidimensional array
                const flattenedLineBlock = lineBlock.flat();
                const combinedBlock = [
                    ...staffBlocksMap[staffIndex].startBlock,
                    ...flattenedLineBlock
                ];

                finalBlock.push(...staffBlocksMap[staffIndex].startBlock);
                finalBlock.push(...flattenedLineBlock);
                finalBlock.push(...staffBlocksMap[staffIndex].repeatBlock);
            }
            this.blocks.loadNewBlocks(finalBlock);
            return null;
        };

        /**
         * @param loadProject all params are from load project function
         */
        this.loadStartWrapper = async (func, arg1, arg2, arg3) => {
            await func(this, arg1, arg2, arg3);
            this.showContents();
        };

        /*
         * Hides the loading animation and unhides the background.
         * Shows contents of MB after loading screen.
         */
        this.showContents = () => {
            clearInterval(window.intervalId);
            document.getElementById("loadingText").textContent = _("Loading Complete!");

            setTimeout(() => {
                document.getElementById("loadingText").textContent = null;
                document.getElementById("loading-image-container").style.display = "none";
                document.getElementById("bottom-right-logo").style.display = "none";
                document.getElementById("palette").style.display = "block";
                // document.getElementById('canvas').style.display = 'none';
                document.getElementById("hideContents").style.display = "block";
                document.getElementById("buttoncontainerBOTTOM").style.display = "block";
                document.getElementById("buttoncontainerTOP").style.display = "block";
            }, 500);
        };

        this.justLoadStart = () => {
            this.blocks.loadNewBlocks(DATAOBJS);
        };

        /*
         * Sets up a new "clean" MB i.e. new project instance
         */
        const _afterDelete = that => {
            if (that.turtles.running()) {
                that._doHardStopButton();
            }

            // Use the planet New Project mechanism if it is available,
            // but only if the current project has a name.
            if (
                that.planet !== undefined &&
                that.planet.getCurrentProjectName() !== _("My Project")
            ) {
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

        const hideArrows = () => {
            globalActivity._hideArrows();
        };

        this._hideArrows = () => {
            if (this.errorMsgArrow !== null) {
                this.errorMsgArrow.removeAllChildren();
                this.refreshCanvas();
            }
        };

        this.textMsg = (msg, duration = _MSGTIMEOUT_) => {
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
                const fromX = this.canvas.width / 2;
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
         * Hides Error Text
         */
        this.hideErrorText = () => {
            if (this.errorText) {
                this.errorText.style.display = "none";
            }
        };
        /*
         * Hides Print Text
         */
        this.hidePrintText = () => {
            if (this.printText) {
                this.printText.classList.remove("show");
            }
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
            const _sharps = [
                "F" + SHARP,
                "C" + SHARP,
                "G" + SHARP,
                "D" + SHARP,
                "A" + SHARP,
                "E" + SHARP,
                "B" + SHARP
            ];
            const _flats = [
                "B" + FLAT,
                "E" + FLAT,
                "A" + FLAT,
                "D" + FLAT,
                "G" + FLAT,
                "C" + FLAT,
                "F" + FLAT
            ];
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
            const _sharps = [
                "F" + SHARP,
                "C" + SHARP,
                "G" + SHARP,
                "D" + SHARP,
                "A" + SHARP,
                "E" + SHARP,
                "B" + SHARP
            ];
            const _flats = [
                "B" + FLAT,
                "E" + FLAT,
                "A" + FLAT,
                "D" + FLAT,
                "G" + FLAT,
                "C" + FLAT,
                "F" + FLAT
            ];
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
            const _sharps = [
                "F" + SHARP,
                "C" + SHARP,
                "G" + SHARP,
                "D" + SHARP,
                "A" + SHARP,
                "E" + SHARP,
                "B" + SHARP
            ];
            const _flats = [
                "B" + FLAT,
                "E" + FLAT,
                "A" + FLAT,
                "D" + FLAT,
                "G" + FLAT,
                "C" + FLAT,
                "F" + FLAT
            ];
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

        this.__showAltoAccidentals = () => {};

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
            const _sharps = [
                "F" + SHARP,
                "C" + SHARP,
                "G" + SHARP,
                "D" + SHARP,
                "A" + SHARP,
                "E" + SHARP,
                "B" + SHARP
            ];
            const _flats = [
                "B" + FLAT,
                "E" + FLAT,
                "A" + FLAT,
                "D" + FLAT,
                "G" + FLAT,
                "C" + FLAT,
                "F" + FLAT
            ];
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
            const _sharps = [
                "F" + SHARP,
                "C" + SHARP,
                "G" + SHARP,
                "D" + SHARP,
                "A" + SHARP,
                "E" + SHARP,
                "B" + SHARP
            ];
            const _flats = [
                "B" + FLAT,
                "E" + FLAT,
                "A" + FLAT,
                "D" + FLAT,
                "G" + FLAT,
                "C" + FLAT,
                "F" + FLAT
            ];
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
            const _sharps = [
                "F" + SHARP,
                "C" + SHARP,
                "G" + SHARP,
                "D" + SHARP,
                "A" + SHARP,
                "E" + SHARP,
                "B" + SHARP
            ];
            const _flats = [
                "B" + FLAT,
                "E" + FLAT,
                "A" + FLAT,
                "D" + FLAT,
                "G" + FLAT,
                "C" + FLAT,
                "F" + FLAT
            ];
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
                            const turtle = this.turtles.getTurtle(myBlock.value);
                            if (turtle === null || turtle === undefined) {
                                args = {
                                    id: this.turtles.getTurtleCount(),
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
                                    customName =
                                        this.blocks.blockList[myBlock.connections[1]].value;
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
        const doOpenPlugin = activity => {
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
        const _doMergeLoad = that => {
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

            const removeButtonContainer = document.getElementById("buttoncontainerBOTTOM");
            if (removeButtonContainer) {
                removeButtonContainer.parentNode.removeChild(removeButtonContainer);
            }

            const ButtonHolder = document.createElement("div");
            ButtonHolder.setAttribute("id", "buttoncontainerBOTTOM");
            ButtonHolder.style.display = "block";
            document.body.appendChild(ButtonHolder);

            this.homeButtonContainer = createButton(
                GOHOMEFADEDBUTTON,
                _("Home") + " [" + _("Home").toUpperCase() + "]",
                findBlocks
            );
            this.boundary.hide();

            if (!this.helpfulWheelItems.find(ele => ele.label === "Home [HOME]"))
                this.helpfulWheelItems.push({
                    label: "Home [HOME]",
                    icon:
                        "imgsrc:data:image/svg+xml;base64," +
                        window.btoa(base64Encode(GOHOMEFADEDBUTTON)),
                    display: true,
                    fn: findBlocks
                });

            this.hideBlocksContainer = createButton(
                SHOWBLOCKSBUTTON,
                _("Show/hide blocks"),
                changeBlockVisibility
            );

            if (!this.helpfulWheelItems.find(ele => ele.label === "Show/hide blocks"))
                this.helpfulWheelItems.push({
                    label: "Show/hide blocks",
                    icon:
                        "imgsrc:data:image/svg+xml;base64," +
                        window.btoa(base64Encode(SHOWBLOCKSBUTTON)),
                    display: true,
                    fn: changeBlockVisibility
                });

            this.collapseBlocksContainer = createButton(
                COLLAPSEBLOCKSBUTTON,
                _("Expand/collapse blocks"),
                toggleCollapsibleStacks
            );

            if (!this.helpfulWheelItems.find(ele => ele.label === "Expand/collapse blocks"))
                this.helpfulWheelItems.push({
                    label: "Expand/collapse blocks",
                    icon:
                        "imgsrc:data:image/svg+xml;base64," +
                        window.btoa(base64Encode(COLLAPSEBLOCKSBUTTON)),
                    display: true,
                    fn: toggleCollapsibleStacks
                });

            this.smallerContainer = createButton(
                SMALLERBUTTON,
                _("Decrease block size"),
                doSmallerBlocks
            );

            if (!this.helpfulWheelItems.find(ele => ele.label === "Decrease block size"))
                this.helpfulWheelItems.push({
                    label: "Decrease block size",
                    icon:
                        "imgsrc:data:image/svg+xml;base64," +
                        window.btoa(base64Encode(SMALLERBUTTON)),
                    display: true,
                    fn: doSmallerBlocks
                });

            this.largerContainer = createButton(
                BIGGERBUTTON,
                _("Increase block size"),
                doLargerBlocks
            );

            if (!this.helpfulWheelItems.find(ele => ele.label === "Increase block size"))
                this.helpfulWheelItems.push({
                    label: "Increase block size",
                    icon:
                        "imgsrc:data:image/svg+xml;base64," +
                        window.btoa(base64Encode(BIGGERBUTTON)),
                    display: true,
                    fn: doLargerBlocks
                });

            if (!this.helpfulWheelItems.find(ele => ele.label === "Restore"))
                this.helpfulWheelItems.push({
                    label: "Restore",
                    icon: "imgsrc:header-icons/restore-from-trash.svg",
                    display: true,
                    fn: restoreTrashPop
                });

            if (!this.helpfulWheelItems.find(ele => ele.label === "Turtle Wrap Off"))
                this.helpfulWheelItems.push({
                    label: "Turtle Wrap Off",
                    icon: "imgsrc:header-icons/wrap-text.svg",
                    display: true,
                    fn: this.toolbar.changeWrap
                });

            if (!this.helpfulWheelItems.find(ele => ele.label === "Turtle Wrap On"))
                this.helpfulWheelItems.push({
                    label: "Turtle Wrap On",
                    icon: "imgsrc:header-icons/wrap-text.svg",
                    display: false,
                    fn: this.toolbar.changeWrap
                });

            if (!this.helpfulWheelItems.find(ele => ele.label === "Enable horizontal scrolling"))
                this.helpfulWheelItems.push({
                    label: "Enable horizontal scrolling",
                    icon: "imgsrc:header-icons/compare-arrows.svg",
                    display: this.beginnerMode ? false : true,
                    fn: setScroller
                });

            if (!this.helpfulWheelItems.find(ele => ele.label === "Disable horizontal scrolling"))
                this.helpfulWheelItems.push({
                    label: "Disable horizontal scrolling",
                    icon: "imgsrc:header-icons/lock.svg",
                    display: false,
                    fn: setScroller
                });

            if (
                _THIS_IS_MUSIC_BLOCKS_ &&
                !this.helpfulWheelItems.find(ele => ele.label === "Set Pitch Preview")
            )
                this.helpfulWheelItems.push({
                    label: "Set Pitch Preview",
                    icon: "imgsrc:header-icons/music-note.svg",
                    display: true,
                    fn: chooseKeyMenu
                });

            if (!this.helpfulWheelItems.find(ele => ele.label === "Grid"))
                this.helpfulWheelItems.push({
                    label: "Grid",
                    icon:
                        "imgsrc:data:image/svg+xml;base64," +
                        window.btoa(base64Encode(CARTESIANBUTTON)),
                    display: true,
                    fn: piemenuGrid
                });

            if (!this.helpfulWheelItems.find(ele => ele.label === "Select"))
                this.helpfulWheelItems.push({
                    label: "Select",
                    icon:
                        "imgsrc:data:image/svg+xml;base64," +
                        window.btoa(base64Encode(SELECTBUTTON)),
                    display: true,
                    fn: this.selectMode
                });

            if (!this.helpfulWheelItems.find(ele => ele.label === "Clear"))
                this.helpfulWheelItems.push({
                    label: "Clear",
                    icon:
                        "imgsrc:data:image/svg+xml;base64," +
                        window.btoa(base64Encode(CLEARBUTTON)),
                    display: true,
                    fn: () => this._allClear(false)
                });

            if (!this.helpfulWheelItems.find(ele => ele.label === "Collapse"))
                this.helpfulWheelItems.push({
                    label: "Collapse",
                    icon:
                        "imgsrc:data:image/svg+xml;base64," +
                        window.btoa(base64Encode(COLLAPSEBUTTON)),
                    display: true,
                    fn: this.turtles.collapse
                });

            if (!this.helpfulWheelItems.find(ele => ele.label === "Expand"))
                this.helpfulWheelItems.push({
                    label: "Expand",
                    icon:
                        "imgsrc:data:image/svg+xml;base64," +
                        window.btoa(base64Encode(EXPANDBUTTON)),
                    display: false,
                    fn: this.turtles.expand
                });

            if (!this.helpfulWheelItems.find(ele => ele.label === "Search for Blocks"))
                this.helpfulWheelItems.push({
                    label: "Search for Blocks",
                    icon: "imgsrc:header-icons/search-button.svg",
                    display: true,
                    fn: this._displayHelpfulSearchDiv
                });

            if (!this.helpfulWheelItems.find(ele => ele.label === "Paste previous stack"))
                this.helpfulWheelItems.push({
                    label: "Paste previous stack",
                    icon: "imgsrc:header-icons/copy-button.svg",
                    display: false,
                    fn: this.turtles.expand
                });
            if (!this.helpfulWheelItems.find(ele => ele.label === "Close"))
                this.helpfulWheelItems.push({
                    label: "Close",
                    icon: "imgsrc:header-icons/cancel-button.svg",
                    display: true,
                    fn: this._hideHelpfulSearchWidget
                });
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
                } catch {
                    //
                }
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

                document.getElementById("helpfulWheelDiv").style.display = "none";
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
                focus: event => {
                    event.preventDefault();
                }
            });

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
                    newBlock => {
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
            document.getElementById("helpfulSearchDiv").style.display = "none";
            this.update = true;
        };

        /**
         * Toggles display of javaScript editor widget.
         */
        const toggleJSWindow = activity => {
            new JSEditor(activity);
        };

        const doAnalytics = activity => {
            if (!activity.statsWindow || !activity.statsWindow.isOpen) {
                activity.statsWindow = new StatsWindow(activity);
            }
        };

        /*
         * Shows help page
         */
        const showHelp = activity => {
            activity._showHelp();
        };

        this._showHelp = () => {
            // Will show welcome page by default.
            new HelpWidget(this, false);
        };

        /*
         * Shows about page
         */
        const showAboutPage = activity => {
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
            container.onmouseover = () => {
                if (!that.loading) {
                    document.body.style.cursor = "pointer";
                    container.style.transition = "0.12s ease-out";
                    container.style.transform = "scale(1.15)";
                }
            };

            container.onmouseout = () => {
                if (!that.loading) {
                    document.body.style.cursor = "default";
                    container.style.transition = "0.15s ease-out";
                    container.style.transform = "scale(1)";
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
            document.getElementById("buttoncontainerBOTTOM").appendChild(container);
            return container;
        };

        /**
         * Handles button dragging, long hovering and prevents multiple button presses.
         * @param container longAction
         * @param hoverAction extraLongImg
         */
        this._loadButtonDragHandler = (container, actionClick, arg) => {
            const that = this;
            container.onmousedown = () => {
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
            const rawData = document.getElementById("paste").value;
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
        this.deltaY = dy => {
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
        this.domReady = async () => {
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
            this.addEventListener(
                document,
                "mousedown",
                event => {
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
        };

        // end the drag on navbar
        this.addEventListener(document.getElementById("toolbars"), "mouseover", () => {
            this.isDragging = false;
        });

        this.deleteMultipleBlocks = () => {
            if (this.blocks.selectionModeOn) {
                const blocksArray = this.blocks.selectedBlocks;
                // figure out which of the blocks in selectedBlocks are clamp blocks and nonClamp blocks.
                const clampBlocks = [];
                const nonClampBlocks = [];

                for (let i = 0; i < blocksArray.length; i++) {
                    if (this.blocks.selectedBlocks[i].isClampBlock()) {
                        clampBlocks.push(this.blocks.selectedBlocks[i]);
                    } else if (this.blocks.selectedBlocks[i].isDisconnected()) {
                        nonClampBlocks.push(this.blocks.selectedBlocks[i]);
                    }
                }

                for (let i = 0; i < clampBlocks.length; i++) {
                    this.blocks.sendStackToTrash(clampBlocks[i]);
                }

                for (let i = 0; i < nonClampBlocks.length; i++) {
                    this.blocks.sendStackToTrash(nonClampBlocks[i]);
                }
                // set selection mode to false
                this.blocks.setSelectionToActivity(false);
                this.refreshCanvas();
                document.getElementById("helpfulWheelDiv").style.display = "none";
            }
        };

        this.copyMultipleBlocks = () => {
            if (this.blocks.selectionModeOn && this.blocks.selectedBlocks.length) {
                const blocksArray = this.blocks.selectedBlocks;
                let pasteDx = 0,
                    pasteDy = 0;
                const map = new Map();
                for (let i = 0; i < blocksArray.length; i++) {
                    const idx = this.blocks.blockList.indexOf(blocksArray[i]);
                    map.set(
                        idx,
                        blocksArray[i].connections.filter(blk => blk !== null)
                    );

                    if (
                        blocksArray[i].connections.some(blkno => {
                            const a = map.get(blkno);
                            return a && a.some(b => b === idx);
                        }) ||
                        blocksArray[i].trash
                    )
                        continue;

                    this.blocks.activeBlock = idx;
                    this.blocks.pasteDx = pasteDx;
                    this.blocks.pasteDy = pasteDy;
                    this.blocks.prepareStackForCopy();
                    this.blocks.pasteStack();
                    pasteDx += 21;
                    pasteDy += 21;
                }

                this.setSelectionMode(false);
                this.selectedBlocks = [];
                this.unhighlightSelectedBlocks(false, false);
                this.blocks.setSelectedBlocks(this.selectedBlocks);
                this.refreshCanvas();
                document.getElementById("helpfulWheelDiv").style.display = "none";
            }
        };

        this.selectMode = () => {
            this.moving = false;
            this.isSelecting = !this.isSelecting;
            this.isSelecting
                ? this.textMsg(_("Select is enabled."))
                : this.textMsg(_("Select is disabled."));
            document.getElementById("helpfulWheelDiv").style.display = "none";
        };

        this._create2Ddrag = () => {
            this.dragArea = {};
            this.selectedBlocks = [];
            this.startX = 0;
            this.startY = 0;
            this.currentX = 0;
            this.currentY = 0;
            this.hasMouseMoved = false;
            if (this.selectionArea && this.selectionArea.parentNode) {
                this.selectionArea.parentNode.removeChild(this.selectionArea);
            }
            this.selectionArea = document.createElement("div");
            document.body.appendChild(this.selectionArea);

            this.setupMouseEvents();

            this.addEventListener(document, "mousemove", event => {
                this.hasMouseMoved = true;
                // event.preventDefault();
                // this.selectedBlocks = [];
                if (this.isDragging && this.isSelecting) {
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
            });

            this.addEventListener(document, "mouseup", event => {
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
            });
        };

        // Set starting points of the drag

        this._createDrag = event => {
            this.isDragging = true;
            this.startX = event.clientX;
            this.startY = event.clientY;
        };

        // Draw the area that has been dragged

        this.drawSelectionArea = () => {
            const x = Math.min(this.startX, this.currentX);
            const y = Math.min(this.startY, this.currentY);
            const width = Math.abs(this.currentX - this.startX);
            const height = Math.abs(this.currentY - this.startY);

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
        };

        // Select the blocks that overlap the dragged area.

        this.selectBlocksInDragArea = (dragArea, blocks) => {
            const selectedBlocks = [];
            this.dragRect = this.dragArea;

            this.blocks.blockList.forEach(block => {
                this.blockRect = {
                    x: this.scrollBlockContainer
                        ? block.container.x + this.blocksContainer.x
                        : block.container.x,
                    y: block.container.y + this.blocksContainer.y,
                    height: block.height,
                    width: block.width
                };

                if (this.rectanglesOverlap(this.blockRect, this.dragRect)) {
                    selectedBlocks.push(block);
                }
            });
            return selectedBlocks;
        };

        // Unhighlight the selected blocks

        this.unhighlightSelectedBlocks = (unhighlight, selectionModeOn) => {
            for (let i = 0; i < this.selectedBlocks.length; i++) {
                for (const blk in this.blocks.blockList) {
                    if (this.isEqual(this.blocks.blockList[blk], this.selectedBlocks[i])) {
                        if (unhighlight) {
                            this.blocks.unhighlightSelectedBlocks(blk, true);
                        } else {
                            this.blocks.highlight(blk, true);
                            this.refreshCanvas();
                        }
                    }
                }
            }
        };

        // Check if two blocks are same or not.

        this.isEqual = (obj1, obj2) => {
            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);

            if (keys1.length !== keys2.length) {
                return false;
            }

            for (const key of keys1) {
                if (!obj2.hasOwnProperty(key)) {
                    return false;
                }
            }

            for (const key of keys1) {
                if (obj1[key] !== obj2[key]) {
                    return false;
                }
            }

            return true;
        };

        this.setSelectionMode = selection => {
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
        };

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

            document.getElementById("loader").className = "loader";

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

            document.addEventListener("click", e => {
                if (!this.hasMouseMoved) {
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
                text => {
                    that.msgText = text;
                },
                130
            );

            this._createMsgContainer(
                "#ffcbc4",
                "#ff0031",
                text => {
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
            this.themeBox = new ThemeBox(this);

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
                this.save.saveMIDI.bind(this.save),
                this.save.savePNG.bind(this.save),
                this.save.saveWAV.bind(this.save),
                this.save.saveLilypond.bind(this.save),
                this.save.saveAbc.bind(this.save),
                this.save.saveMxml.bind(this.save),
                this.save.saveBlockArtwork.bind(this.save),
                this.save.saveBlockArtworkPNG.bind(this.save)
            );
            this.toolbar.renderPlanetIcon(this.planet, doOpenSamples);
            this.toolbar.renderMenuIcon(showHideAuxMenu);
            this.toolbar.renderHelpIcon(showHelp);
            this.toolbar.renderModeSelectIcon(
                doSwitchMode,
                doRecordButton,
                doAnalytics,
                doOpenPlugin,
                deletePlugin,
                setScroller
            );
            this.toolbar.renderRunSlowlyIcon(doSlowButton);
            this.toolbar.renderRunStepIcon(doStepButton);
            this.toolbar.renderThemeSelectIcon(this.themeBox, this.themes);
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
                updatePluginObj(
                    this,
                    processPluginData(this, this.pluginData, "localStorage:plugins")
                );
            }

            // Load custom mode saved in local storage.
            const custommodeData = this.storage.custommode;
            if (custommodeData !== undefined) {
                // Parse and update the custom musical mode with saved data.
                try {
                    const customModeDataObj = JSON.parse(custommodeData);
                    Object.assign(MUSICALMODES["custom"], customModeDataObj);
                } catch (e) {
                    console.error("Error parsing custommode data:", e);
                }
            }

            this.fileChooser.addEventListener("click", () => {
                that.value = null;
            });

            this.fileChooser.addEventListener(
                "change",
                () => {
                    // Read file here.
                    const reader = new FileReader();
                    const midiReader = new FileReader();

                    reader.onload = () => {
                        that.loading = true;
                        document.body.style.cursor = "wait";
                        that.doLoadAnimation();

                        setTimeout(() => {
                            const rawData = reader.result;
                            if (rawData === null || rawData === "") {
                                that.errorMsg(
                                    _(
                                        "Cannot load project from the file. Please check the file type."
                                    )
                                );
                            } else {
                                const cleanData = rawData.replace("\n", " ");
                                let obj;
                                try {
                                    if (cleanData.includes("html")) {
                                        if (cleanData.includes('id="codeBlock"')) {
                                            obj = JSON.parse(
                                                cleanData.match(
                                                    '<div class="code" id="codeBlock">(.+?)</div>'
                                                )[1]
                                            );
                                        } else {
                                            obj = JSON.parse(
                                                cleanData.match('<div class="code">(.+?)</div>')[1]
                                            );
                                        }
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
                                        const __listener = () => {
                                            that.blocks.loadNewBlocks(obj);
                                            that.stage.removeAllEventListeners("trashsignal");
                                            if (that.planet) {
                                                that.planet.saveLocally();
                                            }
                                        };

                                        that.stage.addEventListener(
                                            "trashsignal",
                                            __listener,
                                            false
                                        );
                                        that.sendAllToTrash(false, false);
                                        that._allClear(false, true);
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

                    midiReader.onload = e => {
                        const midi = new Midi(e.target.result);
                        // eslint-disable-next-line no-console
                        console.debug(midi);
                        midiImportBlocks(midi);
                    };

                    const file = that.fileChooser.files[0];
                    if (file) {
                        const extension = file.name.split(".").pop().toLowerCase();
                        const isMidi = extension === "mid" || extension === "midi";
                        if (isMidi) {
                            midiReader.readAsArrayBuffer(file);
                        } else {
                            reader.readAsText(file);
                        }
                    }
                },
                false
            );

            const __handleFileSelect = event => {
                event.stopPropagation();
                event.preventDefault();

                const files = event.dataTransfer.files;
                const reader = new FileReader();
                const midiReader = new FileReader();

                const abcReader = new FileReader();
                reader.onload = () => {
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
                                } else {
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
                                const __listener = () => {
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
                                    _(
                                        "Cannot load project from the file. Please check the file type."
                                    )
                                );
                                document.body.style.cursor = "default";
                                that.loading = false;
                            }
                        }
                    }, 200);
                };
                midiReader.onload = e => {
                    const midi = new Midi(e.target.result);
                    // eslint-disable-next-line no-console
                    console.debug(midi);
                    midiImportBlocks(midi);
                };

                // Music Block Parser from abc to MB
                abcReader.onload = event => {
                    //get the abc data and replace the / so that the block does not break
                    let abcData = event.target.result;
                    abcData = abcData.replace(/\\/g, "");

                    const tunebook = new ABCJS.parseOnly(abcData);
                    // eslint-disable-next-line no-console
                    console.log(tunebook);
                    tunebook.forEach(tune => {
                        //call parseABC to parse abcdata to MB json
                        this.parseABC(tune);
                    });
                };

                // Work-around in case the handler is called by the
                // widget drag & drop code.
                if (files[0] !== undefined) {
                    const extension = files[0].name.split(".").pop().toLowerCase(); //file extension from input file

                    const isMidi = extension == "mid" || extension == "midi";
                    if (isMidi) {
                        midiReader.readAsArrayBuffer(files[0]);
                        return;
                    }

                    const isABC = extension == "abc";
                    if (isABC) {
                        abcReader.readAsText(files[0]);
                        return;
                    }
                    reader.readAsText(files[0]);
                    window.scroll(0, 0);
                }
            };

            const __handleDragOver = event => {
                event.stopPropagation();
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
            };

            const dropZone = document.getElementById("canvasHolder");
            dropZone.addEventListener("dragover", __handleDragOver, false);
            dropZone.addEventListener("drop", __handleFileSelect, false);

            this.allFilesChooser.addEventListener("click", () => {
                this.value = null;
            });

            this.pluginChooser.addEventListener("click", () => {
                window.scroll(0, 0);
                this.value = null;
            });

            this.pluginChooser.addEventListener(
                "change",
                () => {
                    window.scroll(0, 0);

                    // Read file here.
                    const reader = new FileReader();
                    const pluginFile = that.pluginChooser.files[0];

                    reader.onload = () => {
                        that.loading = true;
                        document.body.style.cursor = "wait";
                        //doLoadAnimation();

                        setTimeout(() => {
                            const obj = processRawPluginData(
                                that,
                                reader.result,
                                pluginFile && pluginFile.name ? pluginFile.name : "local-file"
                            );
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

                    reader.readAsText(pluginFile);
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
            // horizontally so as not to overlap.
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
                                    const getJSON = url => {
                                        return new Promise((resolve, reject) => {
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
                                        data => {
                                            const n = data.arg;
                                            env.push(parseInt(n));
                                        },
                                        () => {
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
     * Managed addEventListener that tracks listeners for cleanup.
     * @param {EventTarget} target - The DOM element or object to attach the listener to.
     * @param {string} type - The event type.
     * @param {Function} listener - The callback function.
     * @param {Object|boolean} [options] - listener options.
     */
    addEventListener(target, type, listener, options) {
        if (!target || typeof target.addEventListener !== "function") return;
        target.addEventListener(type, listener, options);
        this._listeners.push({ target, type, listener, options });
    }

    /**
     * Managed removeEventListener that also updates the tracker.
     * @param {EventTarget} target - The DOM element or object to remove the listener from.
     * @param {string} type - The event type.
     * @param {Function} listener - The callback function.
     * @param {Object|boolean} [options] - listener options.
     */
    removeEventListener(target, type, listener, options) {
        if (!target || typeof target.removeEventListener !== "function") return;
        target.removeEventListener(type, listener, options);
        this._listeners = this._listeners.filter(
            l =>
                l.target !== target ||
                l.type !== type ||
                l.listener !== listener ||
                !this._areOptionsEqual(l.options, options)
        );
    }

    /**
     * Checks if two event listener option sets are equivalent for the purpose of removal.
     * @param {Object|boolean} opt1 - First option set.
     * @param {Object|boolean} opt2 - Second option set.
     * @returns {boolean} True if they are effectively equal.
     */
    _areOptionsEqual(opt1, opt2) {
        // Normalize options to booleans for capture flag, as that's the primary discriminator for removal
        const getCapture = opt => {
            if (typeof opt === "boolean") return opt;
            if (typeof opt === "object" && opt !== null) return !!opt.capture;
            return false;
        };
        return getCapture(opt1) === getCapture(opt2);
    }

    /**
     * Removes all tracked event listeners.
     */
    cleanupEventListeners() {
        while (this._listeners.length > 0) {
            const { target, type, listener, options } = this._listeners.pop();
            if (target && typeof target.removeEventListener === "function") {
                target.removeEventListener(type, listener, options);
            }
        }
    }

    /**
     * Saves the current state locally
     * @returns {void}
     */
    saveLocally() {
        try {
            localStorage.setItem("beginnerMode", this.beginnerMode.toString());
            localStorage.setItem("themePreference", this.themePreference.toString());
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Error saving to localStorage:", e);
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
                    if (
                        palette &&
                        palette.container &&
                        typeof palette.container.x !== "undefined"
                    ) {
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
                // eslint-disable-next-line no-console
                console.warn("Palettes object not initialized");
                return;
            }

            if (typeof this.palettes.hide !== "function") {
                // eslint-disable-next-line no-console
                console.warn("Palettes hide method not available");
            } else {
                this.palettes.hide();
            }

            if (typeof this.palettes.clear !== "function") {
                // eslint-disable-next-line no-console
                console.warn("Palettes clear method not available");
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
            if (this.palettes && typeof this.palettes.updatePalettes === "function") {
                this.palettes.updatePalettes();
            }

            // Update blocks
            if (this.blocks && typeof this.blocks.updateBlockPositions === "function") {
                this.blocks.updateBlockPositions();
            }

            this.refreshCanvas();
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Error regenerating palettes:", e);
            this.errorMsg(_("Error regenerating palettes. Please refresh the page."));
        }
    }
}

const activity = new Activity();

// Execute initialization once all RequireJS modules are loaded AND DOM is ready
define(["domReady!"].concat(MYDEFINES), doc => {
    const initialize = () => {
        if (typeof createDefaultStack !== "undefined") {
            activity.setupDependencies();
            activity.domReady(doc);
            activity.doContextMenus();
            activity.doPluginsAndPaletteCols();
        } else {
            // Race condition in Firefox: non-AMD scripts might not have
            // finished global assignment yet.
            setTimeout(initialize, 10);
        }
    };
    initialize();
});
