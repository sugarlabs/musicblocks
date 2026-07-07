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

try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("layoutProfiling")) {
        window.__ENABLE_REFRESH_PROFILING__ = urlParams.get("layoutProfiling") !== "false";
    } else {
        window.__ENABLE_REFRESH_PROFILING__ = false;
    }
} catch (e) {
    window.__ENABLE_REFRESH_PROFILING__ = false;
}

/*
   global

   ALTO, analyzeProject, BASS, BIGGERBUTTON, BIGGERDISABLEBUTTON, debugLog,
   ErrorHandler, ActivityContext,
   Boundary, CARTESIAN, changeImage, closeWidgets, doRecordButton, setupActivityRecorder,
   setupGridController, setupGridRenderer, setupPluginController, setupToolbarController, setupAlertController, setupAlertRenderer, setupPaletteLoader, PluginDialog,
   setupSearchController, setupSearchUI,
   setupActivityAbcParser, setupActivityIdleWatcher,
   COLLAPSEBLOCKSBUTTON, COLLAPSEBUTTON, createDefaultStack,
   createHelpContent, createjs, DATAOBJS, DEFAULTBLOCKSCALE,
   DEFAULTDELAY, define, doBrowserCheck, doBrowserCheck, docByClass,
   doSVG, EMPTYHEAPERRORMSG, EXPANDBUTTON, FILLCOLORS,
   getMacroExpansion, getOctaveRatio, getTemperament, transcribeMidi,
   GOHOMEBUTTON, GOHOMEFADEDBUTTON, GRAND, HelpWidget, HIDEBLOCKSFADEDBUTTON,
   hideDOMLabel, initBasicProtoBlocks, initPalettes,
   INLINECOLLAPSIBLES, JSEditor, LanguageBox, ThemeBox, MSGBLOCK,
   NANERRORMSG, NOACTIONERRORMSG, NOBOXERRORMSG, NOINPUTERRORMSG,
   NOMICERRORMSG, NOSQRTERRORMSG, NOSTRINGERRORMSG, PALETTEFILLCOLORS,
   PALETTESTROKECOLORS, PALETTEHIGHLIGHTCOLORS, HIGHLIGHTSTROKECOLORS,
   Palettes, PasteBox, PlanetInterface, platform, platformColor,
   piemenuKey, POLAR, preparePluginExports, processMacroData,
   processPluginData, processRawPluginData, SaveInterface,
   SHOWBLOCKSBUTTON, SMALLERBUTTON, SMALLERDISABLEBUTTON, SOPRANO,
   SPECIALINPUTS, STANDARDBLOCKHEIGHT, StatsWindow, STROKECOLORS,
   TENOR, TITLESTRING, Toolbar, Trashcan, TREBLE, TURTLESVG,
   updatePluginObj, ZERODIVIDEERRORMSG, GRAND_G, GRAND_F,
   SHARP, FLAT, buildScale, TREBLE_F, TREBLE_G, GIFAnimator,
   MUSICALMODES, waitForReadiness, i18next, wheelnav, slicePath,
   base64Encode, disableHorizScrollIcon, toFraction, CARTESIANBUTTON,
   SELECTBUTTON, CLEARBUTTON, piemenuGrid, Midi, ABCJS, ensureABCJS,
   extractProjectDataFromHTML,unescapeHTML, pubsub
 */

/*
   exported

   Activity, LEADING, _THIS_IS_MUSIC_BLOCKS_, _THIS_IS_TURTLE_BLOCKS_,
   globalActivity, hideArrows, doAnalyzeProject
 */
const LEADING = 0;
const BLOCKSCALES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4];
const _THIS_IS_MUSIC_BLOCKS_ = true;
const _THIS_IS_TURTLE_BLOCKS_ = !_THIS_IS_MUSIC_BLOCKS_;

// Responsive breakpoint constants
const RESPONSIVE_BREAKPOINT_TABLET = 768;
const RESPONSIVE_BREAKPOINT_MOBILE = 600;

let MYDEFINES = [
    "utils/platformstyle",
    "easeljs.min",
    "tweenjs.min",
    "howler",
    // p5.min, p5-sound-adapter, and p5.dom.min are NOT loaded eagerly.
    // They are only needed by the JS-export feature and will be loaded
    // on demand via require() when that feature is used, saving ~10-15 MB
    // of heap memory on every page load.
    // "p5.min",
    // "p5-sound-adapter",
    // "p5.dom.min",
    // Chart.js is only used by the statistics widget and will be loaded
    // on demand when the widget is opened, saving ~3-5 MB of heap memory.
    // "Chart",
    "utils/utils-logic",
    "utils/utils",
    "utils/retryWithBackoff",
    "utils/error-handler",
    "utils/debugLog",
    "activity/artwork",
    "widgets/status",
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

    "activity/recorder",
    "activity/idle-watcher",
    "activity/grid-controller",
    "activity/grid-renderer",
    "activity/plugin-controller",
    "activity/toolbar-controller",
    "activity/alert-controller",
    "activity/alert-renderer",
    "palette/palette-loader",
    "activity/search-controller",
    "search-ui",
    "widgets/plugin-dialog",
    "utils/musicutils",
    "utils/synthutils",
    "utils/mathutils",
    "activity/pastebox",
    "prefixfree.min",
    "Tone",
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
    "widgets/widgetWindows"
];

/**
 * Dynamically load one or more RequireJS modules on demand.
 * Returns a Promise that resolves once all modules are loaded.
 * RequireJS caches modules, so subsequent calls are instant.
 *
 * @param {string|string[]} modulePaths - Module path(s) to load.
 * @returns {Promise<void>}
 */
function lazyLoad(modulePaths) {
    // In Node/Jest (CommonJS), modules are already available as globals — resolve immediately.
    if (typeof define !== "function" || !define.amd) {
        return Promise.resolve();
    }

    // In browser with RequireJS (AMD), load modules dynamically.
    return new Promise(resolve => {
        require(Array.isArray(modulePaths) ? modulePaths : [modulePaths], function () {
            resolve();
        });
    });
}

if (_THIS_IS_MUSIC_BLOCKS_) {
    const MUSICBLOCKS_EXTRAS = [
        "widgets/modewidget",
        "widgets/meterwidget",
        "widgets/PhraseMakerUtils",
        "widgets/PhraseMakerGrid",
        "widgets/PhraseMakerUI",
        "widgets/PhraseMakerAudio",
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
        "widgets/legobricks"
    ];
    MYDEFINES = MYDEFINES.concat(MUSICBLOCKS_EXTRAS);
}

// Module-scoped singleton reference to the active Activity instance.
// • Used by plugins (weather.rtp, etc.) that are eval()'d inside this module's
//   closure scope and therefore can close over `globalActivity` directly.
// • External modules (synthutils, etc.) should use ActivityContext.getActivity()
//   instead of reaching through window.* globals.
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

let exporters;

class Activity {
    /**
     * Creates an Activity instance.
     */
    constructor() {
        globalActivity = this;

        // Register with ActivityContext – the single authority for the Activity singleton.
        // activity-context.js is declared as a RequireJS dep of this module (loader.js shim),
        // so window.ActivityContext is guaranteed to exist before this constructor runs.
        if (window.ActivityContext && typeof window.ActivityContext.setActivity === "function") {
            window.ActivityContext.setActivity(this);
        }

        this._listeners = [];

        this.cellSize = 55;
        this.homeButtonContainer;

        this.msgText = null;
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
        Object.defineProperty(this, "runMode", {
            get: () => (this.toolbarController ? this.toolbarController.runMode : "normal"),
            set: val => {
                if (this.toolbarController) {
                    this.toolbarController.runMode = val;
                }
            },
            configurable: true,
            enumerable: true
        });

        // Flag to disable keyboard during loading of MB
        this.keyboardEnableFlag;
        this.inTempoWidget = false;
        this.projectID = null;
        try {
            this.storage = localStorage;
        } catch (e) {
            // Fall back to in-memory storage when browser storage is restricted.
            this.storage = {};
        }

        // Flag to indicate whether the user is performing a 2D drag operation.
        this.isDragging = false;

        // Flag to indicate whether user is selecting
        this.isSelecting = false;

        // Flag to indicate the selection mode is on
        this.selectionModeOn = false;

        //Flag to check if any other input box is active or not
        this.isInputON = false;

        // Interval ID for the loading animation (to allow cleanup)
        this.loadAnimationIntervalId = null;

        // Initialize GIF animator
        if (typeof GIFAnimator !== "undefined") {
            this.gifAnimator = new GIFAnimator();
        } else {
            console.debug("GIFAnimator not yet available in constructor");
            this.gifAnimator = null;
        }

        // Dirty flag for canvas rendering optimization
        // When true, the stage needs to be redrawn on the next animation frame
        this.stageDirty = false;
        this._renderLoopRafId = null;
        this._renderLoopRunning = false;
        this.firefoxWarningShown = false;

        this.themes = ["light", "dark", "highcontrast"];

        if (navigator.userAgent.includes("Firefox")) {
            let lastPixelRatio = window.devicePixelRatio;

            setInterval(() => {
                if (window.devicePixelRatio !== lastPixelRatio) {
                    lastPixelRatio = window.devicePixelRatio;

                    if (typeof this._onResize === "function") {
                        this._onResize(false);
                    }
                }
            }, 1000);
        }
        try {
            // Detect system theme preference (using same logic as ThemeBox)
            const getSystemTheme = () => {
                if (
                    window.matchMedia &&
                    window.matchMedia("(prefers-color-scheme: dark)").matches
                ) {
                    return "dark";
                }
                return "light";
            };

            // Use stored preference, fallback to system preference
            const activeTheme = this.storage.themePreference || getSystemTheme();

            for (let i = 0; i < this.themes.length; i++) {
                if (this.themes[i] === activeTheme) {
                    document.body.classList.add(this.themes[i]);
                } else {
                    document.body.classList.remove(this.themes[i]);
                }
            }
        } catch (e) {
            ErrorHandler.capture(e, { operation: "loadThemePreference" });
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
            ErrorHandler.recoverable(e, { operation: "loadBeginnerMode" });
        }

        try {
            let lang = "en";
            if (this.storage.languagePreference !== undefined) {
                lang = this.storage.languagePreference;
                if (lang === "kana" || lang === "ja-kana") {
                    this.storage.languagePreference = "ja";
                    this.storage.kanaPreference = "kana";
                    lang = "ja";
                } else if (lang === "ja-kanji") {
                    this.storage.languagePreference = "ja";
                    this.storage.kanaPreference = "kanji";
                    lang = "ja";
                } else if (lang.startsWith("ja")) {
                    lang = "ja"; // normalize Japanese
                }
                i18next.changeLanguage(lang);
            } else {
                lang = navigator.language;
                if (lang.includes("-")) {
                    lang = lang.slice(0, lang.indexOf("-"));
                }
                i18next.changeLanguage(lang);
            }
        } catch (e) {
            ErrorHandler.recoverable(e, { operation: "loadLanguagePreference" });
        }

        this.KeySignatureEnv = ["C", "major", false];
        try {
            if (this.storage.KeySignatureEnv !== undefined) {
                this.KeySignatureEnv = this.storage.KeySignatureEnv.split(",");
                this.KeySignatureEnv[2] = this.KeySignatureEnv[2] === "true";
            }
        } catch (e) {
            ErrorHandler.recoverable(e, { operation: "loadKeySignatureEnv" });
        }

        setupActivityIdleWatcher(this);
        setupPluginController(this);
        setupToolbarController(this);
        setupAlertController(this);
        setupAlertRenderer(this);
        setupPaletteLoader(this);
        this.searchUI = setupSearchUI(this);
        setupSearchController(this, this.searchUI);
        this.pluginDialog = new PluginDialog({
            onLoadBuiltIn: name => this._loadBuiltInPlugin(name),
            onDelete: () => this._deletePlugin(),
            onFileSelected: file => this.handlePluginFileSelected(file),
            closeAuxToolbar: callback => this.toolbar.closeAuxToolbar(callback),
            showHideAuxMenu: (activity, resize) => activity._showHideAuxMenu(resize)
        });

        /**
         * Initialises major variables and renders default stack.
         * Sets up the initial state and dependencies of the activity.
         */
        this.setupDependencies = () => {
            this._stopRenderLoop();
            this.cleanupEventListeners();
            if (this.toolbar && typeof this.toolbar.dispose === "function") {
                this.toolbar.dispose();
            }
            createDefaultStack();
            createHelpContent(this);
            window.scroll(0, 0);

            document.title = TITLESTRING;
            this.canvas = document.getElementById("myCanvas");

            // Set up a file chooser for the doOpen function.
            this.fileChooser = document.getElementById("myOpenFile");
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

            // --- DOM reads (batched to avoid forced synchronous layout) ---
            this.searchWidget = document.getElementById("search");
            this.progressBar = document.getElementById("myProgress");
            const pasteEl = document.getElementById("paste");
            new createjs.DOMElement(pasteEl);
            this.paste = pasteEl;
            this.toolbarHeight = document.getElementById("toolbars").offsetHeight;

            // --- DOM writes (after all reads complete) ---
            this.searchWidget.style.visibility = "hidden";
            this.searchWidget.placeholder = _("Search for blocks");

            this.searchUI.createSearchUI();
            this.progressBar.style.visibility = "hidden";
            this.paste.style.visibility = "hidden";

            this.helpfulWheelItems = [];

            this.setHelpfulSearchDiv();

            // Late initialization of GIF animator if it was missed in constructor
            if (!this.gifAnimator && typeof GIFAnimator !== "undefined") {
                this.gifAnimator = new GIFAnimator();
            }
        };

        /*
         * Optimized canvas rendering using dirty flag pattern.
         * The stage only updates when:
         * 1. stageDirty flag is set (something changed)
         * 2. Active tweens are running
         * 3. GIF animations are playing
         * This eliminates unnecessary 60fps updates when idle.
         */
        // Track last container position to avoid per-frame culling recompute.
        this._lastCullContainerX = undefined;
        this._lastCullContainerY = undefined;

        this._startRenderLoop = () => {
            if (this._renderLoopRunning) return;
            this._renderLoopRunning = true;

            const renderLoop = () => {
                if (!this._renderLoopRunning) return;

                if (this.stage) {
                    const hasActiveTweens = createjs.Tween.hasActiveTweens();
                    const hasActiveGifs = this.gifAnimator && this.gifAnimator.getActiveCount() > 0;
                    const isInteracting = this.isDragging || this.isSelecting;

                    if (this.stageDirty || hasActiveTweens || hasActiveGifs || isInteracting) {
                        // Recompute culling when container moved.
                        if (
                            this.blocks &&
                            this.blocksContainer &&
                            (this._lastCullContainerX !== this.blocksContainer.x ||
                                this._lastCullContainerY !== this.blocksContainer.y)
                        ) {
                            this.blocks._updateViewportCulling();
                            this._lastCullContainerX = this.blocksContainer.x;
                            this._lastCullContainerY = this.blocksContainer.y;
                        }

                        this.stage.update();
                        this.stageDirty = false;
                        // Continue the loop if there's work or ongoing interaction
                        this._renderLoopRafId = requestAnimationFrame(renderLoop);
                    } else {
                        // Nothing to render — let the loop go idle
                        this._renderLoopRunning = false;
                        this._renderLoopRafId = null;
                    }
                } else {
                    this._renderLoopRafId = requestAnimationFrame(renderLoop);
                }
            };

            this._renderLoopRafId = requestAnimationFrame(renderLoop);
        };

        this._stopRenderLoop = () => {
            this._renderLoopRunning = false;
            if (this._renderLoopRafId !== null) {
                cancelAnimationFrame(this._renderLoopRafId);
                this._renderLoopRafId = null;
            }
        };

        /*
         * creates helpfulSearchDiv for search
         */
        this.setHelpfulSearchDiv = () => this.searchController.setHelpfulSearchDiv();

        /*
         * displays helpfulSearchDiv on canvas
         */
        this._displayHelpfulSearchDiv = () => this.searchController._displayHelpfulSearchDiv();

        this._hideHelpfulSearchWidget = e => this.searchController._hideHelpfulSearchWidget(e);

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
                    if (this.searchUI.isHelpfulSearchWidgetOn) {
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
            // Cache DOM element reference for performance (7 lookups reduced to 1)
            const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
            helpfulWheelDiv.style.position = "absolute";

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

            helpfulWheelDiv.style.left = helpfulWheelLeft + "px";

            helpfulWheelDiv.style.top = helpfulWheelTop + "px";

            const windowWidth = window.innerWidth - 20;
            const windowHeight = window.innerHeight - 20;

            if (helpfulWheelLeft + 350 > windowWidth) {
                helpfulWheelDiv.style.left = windowWidth - 350 + "px";
            }
            if (helpfulWheelTop + 350 > windowHeight) {
                helpfulWheelDiv.style.top = windowHeight - 350 + "px";
            }

            helpfulWheelDiv.style.display = "";

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
            wheel.initWheel(wheelItems.map(ele => _(ele.label)));

            wheelItems.forEach((ele, i) => {
                if (ele.icon) {
                    wheel.navItems[i].setTitle(ele.icon);
                }
            });

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
            this.paletteLoader.initializePaletteColors();

            this.pluginController.initializePluginState();

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
            // Cache DOM element reference for performance
            const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
            if (helpfulWheelDiv.style.display !== "none") {
                helpfulWheelDiv.style.display = "none";
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

                // Defer checkBounds during bulk block moves to avoid O(N²)
                // overhead: each moveBlockRelative call triggers checkBounds()
                // which scans all blocks, so N moves × N blocks = O(N²).
                this.blocks._beginDeferCheckBounds();

                // Position "start" blocks first
                for (const blk in this.blocks.blockList) {
                    if (this.blocks.blockList[blk] && !this.blocks.blockList[blk].trash) {
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
                    if (this.blocks.blockList[blk] && !this.blocks.blockList[blk].trash) {
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

                this.blocks._endDeferCheckBounds();
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

                // Defer checkBounds during bulk block moves (see first-click path).
                this.blocks._beginDeferCheckBounds();

                for (const blk in this.blocks.blockList) {
                    if (this.blocks.blockList[blk] && !this.blocks.blockList[blk].trash) {
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

                this.blocks._endDeferCheckBounds();
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
            if (this.homeButtonContainer === null || this.homeButtonContainer === undefined) {
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
                        debugLog("Saving help artwork: " + name + "_block.svg");
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
            for (const name of blockHelpList) {
                this.__saveHelpBlock(name, i * 2000);
                i++;
            }
            this.sendAllToTrash(true, true);
        };

        /**
         * @returns {SVG} returns SVG of blocks
         */
        this.printBlockSVG = () => {
            return exporters.printBlockSVG(this);
        };

        /**
         * @returns {PNG} returns PNG of block artwork
         */
        this.printBlockPNG = async () => {
            return exporters.printBlockPNG(this);
        };

        const midiImportBlocks = midi => {
            if (document.getElementById("import-midi")) return;

            const modal = document.createElement("div");
            modal.classList.add("modalBox");
            modal.id = "import-midi";
            const title = document.createElement("h2");
            title.textContent = _("Import MIDI");
            title.classList.add("modal-title");
            title.style.color = platformColor.headingColor;
            modal.appendChild(title);

            const container = document.createElement("div");
            container.classList.add("message-container");
            const message = document.createElement("p");
            message.textContent = _("Set the max blocks to generate:");
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
            importConfirm.style.backgroundColor = platformColor.blueButton;
            importConfirm.style.color = platformColor.blueButtonText;
            importConfirm.style.border = "none";
            importConfirm.style.borderRadius = "4px";
            importConfirm.style.padding = "8px 16px";
            importConfirm.style.fontWeight = "bold";
            importConfirm.style.cursor = "pointer";
            importConfirm.style.marginRight = "16px";
            importConfirm.addEventListener("click", () => {
                const maxNoteBlocks = select.value;
                require(["activity/midi"], function () {
                    transcribeMidi(midi, maxNoteBlocks);
                });
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
            title.textContent = _("Clear workspace");
            title.classList.add("modal-title");
            title.style.color = platformColor.headingColor;

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
            confirmBtn.style.color = platformColor.blueButtonText;
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

                // Cache DOM element reference for performance
                const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
                if (helpfulWheelDiv.style.display !== "none") {
                    helpfulWheelDiv.style.display = "none";
                    this.__tick();
                }

                if (this.cleanupIdleWatcher) {
                    this.cleanupIdleWatcher();
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
            // Prevent spam-clicking by checking if already running
            if (this.logo._alreadyRunning) {
                return;
            }

            this._onResize();
            this.blocks.activeBlock = null;
            hideDOMLabel();

            // If music is currently playing, stop it first
            if (this.turtles.running()) {
                this.logo.doStopTurtles();
            }

            const currentDelay = this.logo.turtleDelay;

            // Delegate logic / execution control to the ToolbarController
            this.toolbarController.runFast(env, currentDelay);

            // Keep DOM queries, colors, and block visibilities in activity.js
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

                this.toolbar.highlightStop(window.platformColor.stopIconcolor);
            } else {
                if (currentDelay === 0) {
                    this.toolbar.dimThenRestoreStop(window.platformColor.stopIconcolor);
                }
            }
        };

        setupActivityRecorder(this);

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

            this.toolbarController.runSlow();
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

            const didRunStart = this.toolbarController.runStep();

            if (didRunStart === "started") {
                this.toolbar.highlightStop(this.toolbar.stopIconColorWhenPlaying);
            } else if (didRunStart === "stopped") {
                this.toolbar.resetStop();
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

            const stopped = this.toolbarController.hardStop(onblur);
            if (!stopped) {
                return;
            }

            if (this.cleanupIdleWatcher) {
                this.cleanupIdleWatcher();
            }

            this.toolbar.resetStop();

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

            // Update record button and dropdown visibility
            if (activity.toolbar && typeof activity.toolbar.updateRecordButton === "function") {
                activity.toolbar.updateRecordButton(() => doRecordButton(activity));
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
            // Cache DOM element reference for performance
            const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
            if (helpfulWheelDiv.style.display !== "none") {
                helpfulWheelDiv.style.display = "none";
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
                activity.textMsg(_("Horizontal scrolling enabled."), 3000);
            } else {
                enableHorizScrollIcon.style.display = "block";
                disableHorizScrollIcon.style.display = "none";

                this.helpfulWheelItems.forEach(ele => {
                    if (ele.label === "Enable horizontal scrolling") ele.display = true;
                    else if (ele.label === "Disable horizontal scrolling") ele.display = false;
                });
                activity.textMsg(_("Horizontal scrolling disabled."), 3000);
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
                document.getElementById("messageText").textContent = randomLoadMessage + "...";
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
            // Cache DOM element reference for performance
            const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
            if (helpfulWheelDiv.style.display !== "none") {
                helpfulWheelDiv.style.display = "none";
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
            this.stageDirty = true;
        };

        /**
         * Decreases the size of blocks in the activity.
         * @param {object} activity - The activity object.
         */
        const doSmallerBlocks = async activity => {
            await activity._doSmallerBlocks();
            // Cache DOM element reference for performance
            const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
            if (helpfulWheelDiv.style.display !== "none") {
                helpfulWheelDiv.style.display = "none";
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
            this.stageDirty = true;
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

        const deletePlugin = activity => {
            activity.pluginDialog.deletePlugin();
        };

        /**
         * Deletes a plugin palette from local storage.
         */
        this._deletePlugin = () => {
            if (this.palettes.activePalette !== null) {
                const paletteName = this.palettes.activePalette;
                const protoList = this.palettes.dict[paletteName].protoList;
                const deleted = this.pluginController.deletePluginFromStorage(
                    paletteName,
                    protoList
                );
                if (deleted) {
                    this.textMsg(paletteName + " " + _("plugins will be removed upon restart."));
                }
            }
        };

        /*
         * Sets up block actions with regards to different mouse events
         */
        this._setupBlocksContainerEvents = () => {
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
            let initialPinchDistance = null;

            /**
             * Handles touch start event on the canvas.
             * @param {TouchEvent} event - The touch event object.
             */
            myCanvas.addEventListener(
                "touchstart",
                event => {
                    if (event.touches.length === 2) {
                        for (let i = 0; i < 2; i++) {
                            initialTouches[i][0] = event.touches[i].clientY;
                            initialTouches[i][1] = event.touches[i].clientX;
                        }
                        const dx = event.touches[0].clientX - event.touches[1].clientX;
                        const dy = event.touches[0].clientY - event.touches[1].clientY;
                        initialPinchDistance = Math.hypot(dx, dy);
                    }
                },
                { passive: true }
            );

            myCanvas.style.touchAction = "none";

            /**
             * Handles touch move event on the canvas.
             * @param {TouchEvent} event - The touch event object.
             */
            myCanvas.addEventListener(
                "touchmove",
                event => {
                    if (event.touches.length === 2) {
                        event.preventDefault();
                        const dx = event.touches[0].clientX - event.touches[1].clientX;
                        const dy = event.touches[0].clientY - event.touches[1].clientY;
                        const currentPinchDistance = Math.hypot(dx, dy);

                        if (initialPinchDistance !== null && !that.resizeDebounce) {
                            const pinchDelta = currentPinchDistance - initialPinchDistance;
                            if (Math.abs(pinchDelta) > 20) {
                                if (pinchDelta > 0) {
                                    doLargerBlocks(that);
                                } else {
                                    doSmallerBlocks(that);
                                }
                                initialPinchDistance = currentPinchDistance;
                            }
                        }

                        let totalDeltaY = 0;
                        let totalDeltaX = 0;
                        let count = 0;

                        for (let i = 0; i < 2; i++) {
                            const touchY = event.touches[i].clientY;
                            const touchX = event.touches[i].clientX;

                            if (initialTouches[i][0] !== null && initialTouches[i][1] !== null) {
                                totalDeltaY += touchY - initialTouches[i][0];
                                totalDeltaX += touchX - initialTouches[i][1];
                                count++;
                            }

                            initialTouches[i][0] = touchY;
                            initialTouches[i][1] = touchX;
                        }

                        if (count > 0) {
                            const avgDeltaY = totalDeltaY / count;
                            const avgDeltaX = totalDeltaX / count;

                            if (avgDeltaY !== 0) {
                                closeAnyOpenMenusAndLabels();
                                that.blocksContainer.y -= avgDeltaY;
                            }

                            if (that.scrollBlockContainer && avgDeltaX !== 0) {
                                closeAnyOpenMenusAndLabels();
                                that.blocksContainer.x -= avgDeltaX;
                            }
                        }

                        that.refreshCanvas();
                    }
                },
                { passive: false }
            );

            /**
             * Handles touch end event on the canvas.
             */
            myCanvas.addEventListener("touchend", () => {
                for (let i = 0; i < 2; i++) {
                    initialTouches[i][0] = null;
                    initialTouches[i][1] = null;
                }
                initialPinchDistance = null;
            });

            /**
             * Handles wheel event on the canvas.
             * @param {WheelEvent} event - The wheel event object.
             */
            const __wheelHandler = event => {
                const data = normalizeWheel(event);
                // Apply scroll speed multiplier for smoother scrolling
                const SCROLL_SPEED_MULTIPLIER = 2;
                const delY = data.pixelY * SCROLL_SPEED_MULTIPLIER;
                const delX = data.pixelX * SCROLL_SPEED_MULTIPLIER;

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

            // Remove previous wheel event listener if it exists
            if (this._wheelHandler) {
                this.removeEventListener(
                    document.getElementById("myCanvas"),
                    "wheel",
                    this._wheelHandler,
                    false
                );
            }

            // Store the handler reference for future cleanup
            this._wheelHandler = __wheelHandler;

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
            // Do NOT cache the bitmap here. Each cached grid allocates a
            // 1200x900x4 = ~4.3 MB backing canvas, and with 8 grids that
            // totals ~35 MB even though at most 1 grid is visible at a time.
            // Instead, we cache lazily in _show*() and uncache in _hide*().

            bitmap.x = (this.canvas.width - 1200) / 2;
            bitmap.y = (this.canvas.height - 900) / 2;
            bitmap.scaleX = bitmap.scaleY = bitmap.scale = 1;
            bitmap.visible = false;

            // Apply color filter based on theme
            const isDarkMode = document.body.classList.contains("dark");
            const isHighContrastMode = document.body.classList.contains("highcontrast");
            if (isDarkMode || isHighContrastMode) {
                // Create an invert filter to turn black elements white
                const invertFilter = new createjs.ColorFilter(-1, -1, -1, 1, 255, 255, 255);
                bitmap.filters = [invertFilter];
            }

            return bitmap;
        };

        /**
         * Creates and renders a message container.
         * @param {string} fillColor - The fill color of the message container.
         * @param {string} strokeColor - The stroke color of the message container.
         * @param {function} callback - The callback function assigned to the message container.
         * @param {number} y - The position on the canvas.


        /**
         * Initialize an idle watcher that throttles the application's framerate
         * when the application is inactive and no music is playing.
         * This significantly reduces CPU usage and improves battery life.
         *
         * Listeners and intervals are properly cleaned up via stopIdleWatcher()
         * to prevent accumulation on re-initialization.
         */
        this._initIdleWatcher = () => {
            // Ensure any prior idle watcher is cleaned up before reinitializing
            this._stopIdleWatcher();

            const IDLE_THRESHOLD = 5000; // 5 seconds
            const ACTIVE_RESET_INTERVAL = 500;
            const ACTIVE_FPS = 60;
            const IDLE_FPS = 1;
            const idleEvents = ["mousemove", "mousedown", "keydown", "touchstart", "wheel"];

            if (this._idleWatcherResetHandler) {
                idleEvents.forEach(eventType => {
                    window.removeEventListener(eventType, this._idleWatcherResetHandler);
                });
            }

            if (this._idleWatcherIntervalId) {
                clearInterval(this._idleWatcherIntervalId);
                this._idleWatcherIntervalId = null;
            }

            let lastActivity = Date.now();
            let lastIdleReset = lastActivity;
            this.isAppIdle = false;

            // Prevent duplicate intervals
            if (this._idleWatcherIntervalId) {
                clearInterval(this._idleWatcherIntervalId);
            }

            // Wake up function - restores full framerate
            // Stored as instance property for cleanup
            this._resetIdleTimer = () => {
                const now = Date.now();
                if (!this.isAppIdle && now - lastIdleReset < ACTIVE_RESET_INTERVAL) {
                    return;
                }

                lastActivity = now;
                lastIdleReset = now;
                if (this.isAppIdle) {
                    this.isAppIdle = false;
                    createjs.Ticker.framerate = ACTIVE_FPS;
                    // Force immediate redraw for responsiveness
                    this.stageDirty = true;
                }
            };

            // Track user activity using managed addEventListener for proper cleanup
            this.addEventListener(window, "mousemove", this._resetIdleTimer);
            this.addEventListener(window, "mousedown", this._resetIdleTimer);
            this.addEventListener(window, "keydown", this._resetIdleTimer);
            this.addEventListener(window, "touchstart", this._resetIdleTimer);
            this.addEventListener(window, "wheel", this._resetIdleTimer, { passive: true });

            // Periodic check for idle state - store interval ID for cleanup
            this._idleWatcherInterval = setInterval(() => {
                // Check if music/code is playing
                const isMusicPlaying = this.logo?._alreadyRunning || false;

                if (!isMusicPlaying && Date.now() - lastActivity > IDLE_THRESHOLD) {
                    if (!this.isAppIdle) {
                        this.isAppIdle = true;
                        createjs.Ticker.framerate = IDLE_FPS;
                        debugLog("⚡ Idle mode: Throttling to 1 FPS to save battery");
                    }
                } else if (this.isAppIdle && isMusicPlaying) {
                    // Music started playing - wake up immediately
                    this._resetIdleTimer();
                }
            }, 1000);
        };

        /**
         * Stop the idle watcher and clean up its listeners and interval.
         * Called during Activity lifecycle teardown to prevent listener/interval accumulation.
         * It is safe to call this method even if the idle watcher was never started.
         */
        this._stopIdleWatcher = () => {
            // Clear the periodic interval
            if (typeof this._idleWatcherInterval !== "undefined") {
                clearInterval(this._idleWatcherInterval);
                this._idleWatcherInterval = undefined;
            }

            // Remove event listeners if they were registered
            if (typeof this._resetIdleTimer === "function") {
                this.removeEventListener(window, "mousemove", this._resetIdleTimer);
                this.removeEventListener(window, "mousedown", this._resetIdleTimer);
                this.removeEventListener(window, "keydown", this._resetIdleTimer);
                this.removeEventListener(window, "touchstart", this._resetIdleTimer);
                this.removeEventListener(window, "wheel", this._resetIdleTimer);
                this._resetIdleTimer = undefined;
            }
        };

        /*
         * Builds the block list for search bar autocompletion.
         */
        this.prepSearchWidget = () => this.searchController.prepSearchWidget();

        /*
         * Hides search widget
         */
        this.hideSearchWidget = () => this.searchController.hideSearchWidget();

        /*
         * Shows search widget
         */
        this.showSearchWidget = () => this.searchController.showSearchWidget();

        this.doSearch = () => this.searchController.doSearch();

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
                const active = document.activeElement;
                const isCanvasOrBody =
                    active === document.body ||
                    active === document.getElementById("canvas") ||
                    active === document.getElementById("myCanvas");
                if (isCanvasOrBody) {
                    event.preventDefault();
                    return false;
                }
                return;
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
            const lilypondModal = document.getElementById("lilypondModal");
            const samplerPrompt = document.getElementById("samplerPrompt");
            const planetIframe = document.getElementById("planet-iframe");
            const pasteEl = this.paste;
            const wheelDiv = document.getElementById("wheelDiv");
            const disableKeys =
                lilypondModal.style.display === "block" ||
                this.searchWidget.style.visibility === "visible" ||
                this.helpfulSearchWidget.style.visibility === "visible" ||
                this.isInputON ||
                samplerPrompt ||
                planetIframe.style.display === "" ||
                pasteEl.style.visibility === "visible" ||
                wheelDiv.style.display === "" ||
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
                event.keyCode === 13 ||
                event.key === "/" ||
                event.key === "\\"
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
                        this.toolbar.highlightStop(platformColor.stopIconcolor);
                        this._doFastButton();
                        break;
                    }
                    case 13: {
                        // Alt+ENTER
                        if (this.isInputON) return;

                        if (this.searchWidget.style.visibility === "visible") {
                            return;
                        }
                        if (pasteEl.style.visibility === "visible") {
                            this.pasted();
                            pasteEl.style.visibility = "hidden";
                            return;
                        }

                        // Check if any widget window is open
                        const hasOpenWidget = Object.values(window.widgetWindows.openWindows).some(
                            w => w
                        );
                        if (this.turtles.running()) {
                            this._doHardStopButton();
                        } else if (!hasOpenWidget) {
                            this.toolbar.highlightStop(platformColor.stopIconcolor);
                            this._doFastButton();
                        }
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
                            event.key === "/" &&
                            !this.beginnerMode &&
                            disableHorizScrollIcon.style.display === "block"
                        ) {
                            this.blocksContainer.x += this.canvas.width / 10;
                            this.stageDirty = true;
                        }
                    // fall through
                    case 220:
                        if (
                            event.key === "\\" &&
                            !this.beginnerMode &&
                            disableHorizScrollIcon.style.display === "block"
                        ) {
                            this.blocksContainer.x -= this.canvas.width / 10;
                            this.stageDirty = true;
                        }
                }
            } else if (event.ctrlKey) {
                switch (event.keyCode) {
                    case V:
                        // this.textMsg("Ctl-V " + _("Paste"));
                        this.pasteBox.createBox(this.turtleBlocksScale, 200, 200);
                        this.pasteBox.show();
                        pasteEl.style.left =
                            (this.pasteBox.getPos()[0] + 10) * this.turtleBlocksScale + "px";
                        pasteEl.style.top =
                            (this.pasteBox.getPos()[1] + 10) * this.turtleBlocksScale + "px";
                        pasteEl.focus();
                        pasteEl.style.visibility = "visible";
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
                if (pasteEl.style.visibility === "visible" && event.keyCode === RETURN) {
                    if (pasteEl.value.length > 0) {
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
                        this.toolbar.highlightStop(platformColor.stopIconcolor);
                        this._doFastButton();
                    }
                } else if (!disableKeys) {
                    switch (event.keyCode) {
                        case END:
                            this.textMsg("END " + _("Jumping to the bottom of the page."));
                            this.blocksContainer.y =
                                -this.blocks.bottomMostBlock() + this.canvas.height / 2;
                            this.stageDirty = true;
                            break;
                        case PAGE_UP:
                            this.textMsg("PAGE_UP " + _("Scrolling up."));
                            this.blocksContainer.y += this.canvas.height / 2;
                            this.stageDirty = true;
                            break;
                        case PAGE_DOWN:
                            this.textMsg("PAGE_DOWN " + _("Scrolling down."));
                            this.blocksContainer.y -= this.canvas.height / 2;
                            this.stageDirty = true;
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
                                this.stageDirty = true;
                            }
                            break;
                        case KEYCODE_DOWN:
                            if (this.inTempoWidget) {
                                this.logo.tempo.slowDown(0);
                            } else {
                                if (this.blocks.activeBlock !== null) {
                                    this.textMsg(`DOWN ARROW ${_("Moving block down.")}`);
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
                                this.stageDirty = true;
                            }
                            break;
                        case KEYCODE_LEFT:
                            if (!this.inTempoWidget) {
                                if (this.blocks.activeBlock !== null) {
                                    this.textMsg(`LEFT ARROW ${_("Moving block left.")}`);
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
                                this.stageDirty = true;
                            }
                            break;
                        case KEYCODE_RIGHT:
                            if (!this.inTempoWidget) {
                                if (this.blocks.activeBlock !== null) {
                                    this.textMsg(`RIGHT ARROW ${_("Moving block right.")}`);
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
                                this.stageDirty = true;
                            }
                            break;
                        case HOME:
                            this.textMsg(`HOME ${_("Jump to home position.")}`);
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
                            this.stageDirty = true;
                            break;
                        case TAB:
                            break;
                        case ESC:
                            if (this.searchWidget.style.visibility === "visible") {
                                this.textMsg(`ESC ${_("Hide blocks")}`);
                                this.searchWidget.style.visibility = "hidden";
                            }
                            break;
                        case RETURN: {
                            // Check if any widget window is open
                            const hasOpenWidget = Object.values(
                                window.widgetWindows.openWindows
                            ).some(w => w);
                            if (this.turtles.running()) {
                                event.preventDefault();
                                this._doHardStopButton();
                            } else if (!disableKeys && !hasOpenWidget) {
                                event.preventDefault();
                                this.toolbar.highlightStop(platformColor.stopIconcolor);
                                this._doFastButton();
                            }
                            break;
                        }
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

            // Skip resize when the tab is hidden — canvas reports 0×0
            // and any layout work would corrupt positions.
            if (document.hidden) {
                return;
            }

            const $j = window.jQuery;
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

            // Guard against zero or invalid dimensions to prevent
            // division-by-zero and ResizeObserver loop errors
            if (w <= 0 || h <= 0) {
                return;
            }

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

            // Viewport size changed — recompute culling on next render frame.
            this._lastCullContainerX = undefined;
            this._lastCullContainerY = undefined;

            // Firefox large canvas warning
            const isFirefox = navigator.userAgent.includes("Firefox");
            const canvasArea = w * h;
            const FIREFOX_CANVAS_THRESHOLD = 4000000;
            const warningMsg = _(
                "Firefox performance may be affected because the canvas is unusually large. For the best experience, consider resetting the browser zoom to 100%."
            );

            if (isFirefox) {
                if (canvasArea > FIREFOX_CANVAS_THRESHOLD) {
                    const isShown = this.printText && this.printText.classList.contains("show");
                    const hasMsg =
                        this.printTextContent && this.printTextContent.textContent === warningMsg;

                    // Re-show if not shown or if message was overwritten/hidden
                    if (!this.firefoxWarningShown || !isShown || !hasMsg) {
                        this.firefoxWarningShown = true;
                        this.textMsg(warningMsg, 1000000);
                    }
                } else if (this.firefoxWarningShown) {
                    if (this.printTextContent && this.printTextContent.textContent === warningMsg) {
                        this.hidePrintText();
                    }
                    this.firefoxWarningShown = false;
                }
            }

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
            // Skip resize when the tab is hidden to prevent 0×0 canvas
            if (document.hidden) {
                return;
            }

            const isMaximized =
                window.innerWidth === window.screen.width &&
                window.innerHeight === window.screen.height;
            if (isMaximized) {
                container.style.width = defaultWidth + "px";
                container.style.height = defaultHeight + "px";
                canvas.width = defaultWidth;
                canvas.height = defaultHeight;
                overCanvas.width = canvas.width;
                overCanvas.height = canvas.height;
                canvasHolder.width = defaultWidth;
                canvasHolder.height = defaultHeight;
            } else {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;

                // Guard against zero or invalid dimensions
                if (windowWidth <= 0 || windowHeight <= 0) {
                    return;
                }

                container.style.width = windowWidth + "px";
                container.style.height = windowHeight + "px";
                overCanvas.width = canvas.width;
                overCanvas.height = canvas.height;
                canvasHolder.width = canvas.width;
                canvasHolder.height = canvas.height;
            }
            const hideContents = document.getElementById("hideContents");
            if (hideContents) {
                hideContents.click();
            }
            that.refreshCanvas();
        }

        let resizeTimeout;
        this._handleWindowResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                handleResize();
                this._setupPaletteMenu();
            }, 200);
        };
        this.addEventListener(window, "resize", this._handleWindowResize);
        this._handleOrientationChangeResize = handleResize;
        this.addEventListener(window, "orientationchange", this._handleOrientationChangeResize);

        // When the user returns to the Music Blocks tab after it was
        // hidden, re-apply the correct dimensions.  While the tab was
        // hidden the resize guards above intentionally skipped any
        // layout work, so we need to catch up now.
        this._handleVisibilityChange = () => {
            if (document.hidden) {
                if (typeof this.__saveLocally === "function") {
                    this.__saveLocally();
                }
                if (
                    typeof this.saveLocally === "function" &&
                    this.saveLocally !== this.__saveLocally
                ) {
                    this.saveLocally();
                }
                // Pause render loop while tab is hidden
                this._stopRenderLoop();
                return;
            }

            if (this.stage) {
                // Use a short delay to let the browser finish
                // exposing the tab and reporting real dimensions.
                setTimeout(() => {
                    handleResize();
                    this._onResize(false);
                }, 250);
            }
            // Resume render loop when tab becomes visible again
            this.stageDirty = true;
            this._startRenderLoop();
        };
        this.addEventListener(document, "visibilitychange", this._handleVisibilityChange);

        const that = this;
        const resizeCanvas_ = () => {
            try {
                that._onResize(false);
                const hideContents = document.getElementById("hideContents");
                if (hideContents) {
                    hideContents.click();
                }
            } catch (error) {
                ErrorHandler.recoverable(error, { operation: "resizeCanvas" });
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

            // Cache DOM element reference for performance
            const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
            if (helpfulWheelDiv.style.display !== "none") {
                helpfulWheelDiv.style.display = "none";
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

            // Cache DOM element reference for performance
            const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
            if (helpfulWheelDiv.style.display !== "none") {
                helpfulWheelDiv.style.display = "none";
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

                const block = this.blocks.blockList[blk];

                // Re-populate blocks.blockArt[blk] if it was deleted on trash.
                // sendStackToTrash() and sendAllToTrash() both delete blockArt[blk]
                // to free memory. Without regeneration, printBlockSVG() receives
                // undefined here, passes it to DOMParser.parseFromString(undefined),
                // and injects a <parsererror> node into every Save Block Artwork
                // export (activity.js ~line 1394).
                if (!this.blocks.blockArt[blk]) {
                    block.regenerateArtwork(block.isCollapsible());
                }

                // Re-cache the container if it was uncached to save
                // memory in sendStackToTrash().
                if (block.container && !block.container.bitmapCache) {
                    block.container.cache(
                        0,
                        0,
                        Math.max(block.width, 1),
                        Math.max(block.height, 1)
                    );
                }

                this.blocks.blockList[blk].show();
            }
            this.blocks.raiseStackToTop(blockId);
            const restoredBlock = this.blocks.blockList[blockId];

            if (restoredBlock.name === "start" || restoredBlock.name === "drum") {
                const turtle = restoredBlock.value;
                const primaryTurtle = this.turtles.getTurtle(turtle);
                primaryTurtle.inTrash = false;
                primaryTurtle.container.visible = true;

                // FIX: Restore the companion turtle if one exists.
                // sendStackToTrash() in blocks.js (~line 7257) sets BOTH the primary
                // and companion turtle to inTrash=true / visible=false when trashing a
                // start/drum block. Without this mirror restore, the companion stays
                // inTrash=true permanently, and logo.js (~line 1519) silently skips it:
                //   if (!tur.inTrash) { tur.running = true; ... }
                // This means onEveryBeatDo callbacks are dead after any trash+restore.
                const comp = primaryTurtle.companionTurtle;
                if (comp !== null && comp !== undefined) {
                    const companionTurtle = this.turtles.getTurtle(comp);
                    if (companionTurtle) {
                        companionTurtle.inTrash = false;
                        companionTurtle.container.visible = true;
                    }
                }
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
                        const translatedName = _(uniqueName);
                        label =
                            translatedName.length > 8
                                ? translatedName.substr(0, 7) + "..."
                                : translatedName;
                        actionArg.text.text = label;

                        if (actionArg.label !== null) {
                            actionArg.label.value = translatedName;
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
                                const translatedMeName = _(uniqueName);
                                label =
                                    translatedMeName.length > 8
                                        ? translatedMeName.substr(0, 7) + "..."
                                        : translatedMeName;
                                me.text.text = label;
                                me.overrideName = label;
                                me.regenerateArtwork();
                                me.container.updateCache();
                            }
                        }
                    }

                    // Re-add the action to the palette
                    const actionName = actionArg.value;
                    this.blocks.newNameddoBlock(
                        actionName,
                        this.blocks.actionHasReturn(blockId),
                        this.blocks.actionHasArgs(blockId)
                    );
                    this.palettes.updatePalettes("action");
                }
            }
            activity.textMsg(_("Item restored from the trash."), 3000);

            this.refreshCanvas();
        };

        // Add event listener for trash icon click
        document.getElementById("restoreIcon").addEventListener("click", () => {
            this._renderTrashView();
        });

        // Store the click handler reference for proper cleanup
        let trashViewClickHandler = null;

        // function to hide trashView from canvas
        function handleClickOutsideTrashView(trashView) {
            // Remove existing listener to prevent duplicates
            if (trashViewClickHandler) {
                document.removeEventListener("click", trashViewClickHandler);
            }

            let firstClick = true;
            trashViewClickHandler = event => {
                if (firstClick) {
                    firstClick = false;
                    return;
                }
                if (!trashView.contains(event.target) && event.target !== trashView) {
                    trashView.style.display = "none";
                    // Clean up listener when trashView is hidden
                    document.removeEventListener("click", trashViewClickHandler);
                    trashViewClickHandler = null;
                }
            };
            document.addEventListener("click", trashViewClickHandler);
        }

        this._renderTrashView = () => {
            if (!this.blocks || !this.blocks.trashStacks || this.blocks.trashStacks.length === 0) {
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

                const preview = this.blocks.trashPreviews[blockId];
                let imgSrc;
                if (preview) {
                    imgSrc = preview;
                } else {
                    const svgData = block.artwork;
                    imgSrc = "data:image/svg+xml;utf8," + encodeURIComponent(svgData);
                }

                const img = document.createElement("img");
                img.src = imgSrc;
                img.alt = "Block Icon";
                img.classList.add("trash-item-icon");

                const textNode = document.createTextNode(block.name);

                listItem.appendChild(img);
                listItem.appendChild(textNode);
                listItem.dataset.blockId = blockId;

                listItem.addEventListener("mouseover", () => {
                    listItem.classList.add("hover");
                });
                listItem.addEventListener("mouseout", () => {
                    listItem.classList.remove("hover");
                });

                img.addEventListener("mouseover", event => {
                    this._showTrashPreviewPopup(imgSrc, event);
                });
                img.addEventListener("mousemove", event => {
                    this._showTrashPreviewPopup(imgSrc, event);
                });
                img.addEventListener("mouseout", () => {
                    this._hideTrashPreviewPopup();
                });

                listItem.addEventListener("click", () => {
                    this._restoreTrashById(blockId);
                    this._hideTrashPreviewPopup();
                    trashView.classList.add("hidden");
                });

                trashView.appendChild(listItem);
            });

            // Attach outside-click listener once, after all items are rendered
            handleClickOutsideTrashView(trashView);

            const existingView = document.getElementById("trashView");
            if (existingView) {
                trashList.replaceChild(trashView, existingView);
            } else {
                trashList.appendChild(trashView);
            }
        };

        /**
         * Shows a larger preview popup for trashed items.
         * @param {string} imgSrc - The source of the image.
         * @param {MouseEvent} event - The mouse event.
         * @private
         */
        this._showTrashPreviewPopup = (imgSrc, event) => {
            let popup = document.getElementById("trashPreviewPopup");
            if (!popup) {
                popup = document.createElement("div");
                popup.id = "trashPreviewPopup";
                popup.classList.add("trash-preview-popup");
                const img = document.createElement("img");
                popup.appendChild(img);
                document.body.appendChild(popup);
            }
            const img = popup.firstChild;
            if (img.src !== imgSrc) {
                img.src = imgSrc;
            }
            popup.style.display = "block";

            // Position next to cursor
            const xOffset = 20;
            const yOffset = 20;
            let x = event.clientX + xOffset;
            let y = event.clientY + yOffset;

            // Flip if near right edge
            if (x + 300 > window.innerWidth) {
                x = event.clientX - 320;
            }
            // Flip if near bottom edge
            if (y + 300 > window.innerHeight) {
                y = event.clientY - 320;
            }

            popup.style.left = x + "px";
            popup.style.top = y + "px";
        };

        /**
         * Hides the trash preview popup.
         * @private
         */
        this._hideTrashPreviewPopup = () => {
            const popup = document.getElementById("trashPreviewPopup");
            if (popup) {
                popup.style.display = "none";
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

            // Defer checkBounds during bulk block moves to avoid O(N²)
            // overhead: each moveBlockRelative call triggers checkBounds()
            // which scans all blocks, so N moves × N blocks = O(N²).
            this.blocks._beginDeferCheckBounds();

            for (const blk in this.blocks.blockList) {
                const myBlock = this.blocks.blockList[blk];
                if (!myBlock) continue;

                // If this block is at the top of a stack, push it
                // onto the trashStacks list.
                if (this.blocks.blockList[blk].connections[0] === null) {
                    const preview = this.blocks.captureStackPreview(blk);
                    if (preview) {
                        this.blocks.trashPreviews[blk] = preview;
                    }
                    this.blocks.trashStacks.push(blk);
                }

                if (
                    this.blocks.blockList[blk].name === "start" ||
                    this.blocks.blockList[blk].name === "drum"
                ) {
                    const turtle = this.blocks.blockList[blk].value;

                    if (!this.blocks.blockList[blk].trash && turtle !== null) {
                        const primaryTurtle = this.turtles.getTurtle(turtle);

                        primaryTurtle.inTrash = true;
                        primaryTurtle.container.visible = false;

                        const comp = primaryTurtle.companionTurtle;

                        if (comp !== null && comp !== undefined) {
                            const companionTurtle = this.turtles.getTurtle(comp);

                            if (companionTurtle) {
                                companionTurtle.inTrash = true;
                                companionTurtle.container.visible = false;
                            }
                        }
                    }
                } else if (myBlock.name === "action") {
                    if (!myBlock.trash) {
                        this.blocks.deleteActionBlock(this.blocks.blockList[blk]);
                        actionBlockCounter += 1;
                    }
                }

                this.blocks.blockList[blk].trash = true;
                this.blocks.moveBlockRelative(blk, dx, dy);
                this.blocks.blockList[blk].hide();

                // Free the backing canvas memory for trashed blocks.
                // Each cached block holds a bitmap canvas (~0.5-2 MB).
                // This matches the cleanup pattern in sendStackToTrash().
                if (this.blocks.blockList[blk].container) {
                    this.blocks.blockList[blk].container.uncache();
                }

                // Clean up SVG art strings to free memory.
                if (this.blocks.blockArt[blk]) {
                    delete this.blocks.blockArt[blk];
                }
                if (this.blocks.blockCollapseArt[blk]) {
                    delete this.blocks.blockCollapseArt[blk];
                }
            }

            this.blocks._endDeferCheckBounds();

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
            // Cache DOM element reference for performance
            const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
            if (helpfulWheelDiv.style.display !== "none") {
                helpfulWheelDiv.style.display = "none";
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
            // Cache DOM element reference for performance
            const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
            if (helpfulWheelDiv.style.display !== "none") {
                helpfulWheelDiv.style.display = "none";
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
            if (this.showBlocksAfterRun) {
                this.blocks.showBlocks();
                this.showBlocksAfterRun = false;
            }

            this.toolbar.resetStop();

            const saveBtn = document.getElementById("saveButton");
            const saveBtnAdv = document.getElementById("saveButtonAdvanced");
            const recordBtn = document.getElementById("record");

            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.classList.remove("grey-text", "inactiveLink");
            }
            if (saveBtnAdv) {
                saveBtnAdv.disabled = false;
                saveBtnAdv.classList.remove("grey-text", "inactiveLink");
            }
            if (recordBtn) {
                recordBtn.classList.remove("grey-text", "inactiveLink");
            }

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
                // Skip trashed blocks — they are hidden and their backing
                // canvases are freed in sendStackToTrash(). Re-caching them
                // here would waste ~0.5–2 MB per trashed block.
                if (block.trash) return;

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
        let refreshCount = 0;
        let totalRefreshTime = 0;
        let maxRefreshTime = 0;
        let lastRefreshReport = performance.now();

        this.refreshCanvas = () => {
            this.stageDirty = true;
            this.update = true;
            this._startRenderLoop();
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
            // Cache DOM element reference for performance
            const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
            if (helpfulWheelDiv.style.display !== "none") {
                helpfulWheelDiv.style.display = "none";
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
            pubsub.off("finishedLoading", this.runProject);

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
                    /* istanbul ignore next -- loadStart's __afterLoad runs post-project-load in a browser-only path; inaccessible from Jest */
                    that.stage.update();
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

                        console.log(
                            "%cMusic Blocks",
                            "font-size: 24px; font-weight: bold; font-family: sans-serif; padding:20px 0 0 110px; background: url(" +
                                imgUrl +
                                ") no-repeat;"
                        );

                        console.log(
                            "%cMusic Blocks is a collection of tools for exploring fundamental musical concepts in a fun way.",
                            "font-size: 16px; font-family: sans-serif; font-weight: bold;"
                        );
                    } else {
                        console.log(
                            "%cTurtle Blocks is a collection of tools for exploring  concepts from Logo in a fun way.",
                            "font-size: 16px; font-family: sans-serif; font-weight: bold;"
                        );
                    }
                    // Set flag to 1 to enable keyboard after MB finishes loading
                    that.keyboardEnableFlag = 1;
                }

                pubsub.off("finishedLoading", __afterLoad);
            };

            // Set the flag to zero to disable keyboard
            that.keyboardEnableFlag = 0;

            that.sessionData = null;
            const currentProject = that.storage.currentProject;
            const sessionKey = currentProject !== undefined ? "SESSION" + currentProject : null;

            // Try restarting where we were when we hit save.
            if (that.planet) {
                that.sessionData = await that.planet.openCurrentProject();
                if (!that.sessionData) {
                    if (currentProject !== undefined) {
                        that.sessionData = that.storage[sessionKey];
                    }
                }
            } else {
                if (sessionKey !== null) {
                    that.sessionData = that.storage[sessionKey];
                }
            }

            // After we have finished loading the project, clear all
            // to ensure a clean start.
            pubsub.on("finishedLoading", __afterLoad);

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
                    ErrorHandler.recoverable(e, { operation: "loadSessionData" });
                    if (sessionKey !== null) {
                        try {
                            if (typeof that.storage.removeItem === "function") {
                                that.storage.removeItem(sessionKey);
                            } else {
                                delete that.storage[sessionKey];
                            }
                        } catch (storageError) {
                            ErrorHandler.recoverable(storageError, {
                                operation: "removeBadSessionKey"
                            });
                        }
                    }
                    that.justLoadStart();
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
            try {
                const projectName =
                    this.planet && typeof this.planet.getCurrentProjectName === "function"
                        ? this.planet.getCurrentProjectName()
                        : _("My Project");
                this.textMsg(projectName);
            } catch (e) {
                ErrorHandler.recoverable(e, { operation: "loadProjectName" });
                this.textMsg(_("My Project"));
            }

            const that = this;
            setTimeout(() => {
                const finishLoading = () => {
                    that.loading = false;
                    document.body.style.cursor = "default";
                    that.update = true;
                };

                try {
                    if (that.planet && typeof that.planet.openProjectFromPlanet === "function") {
                        that.planet.openProjectFromPlanet(projectID, () => {
                            that.loadStartWrapper(loadStart);
                        });
                    } else {
                        throw new Error("Planet openProjectFromPlanet is unavailable.");
                    }
                } catch (e) {
                    ErrorHandler.recoverable(e, { operation: "openProjectFromPlanet" });
                    that.loadStartWrapper(loadStart);
                }

                if (that.planet && typeof that.planet.initialiseNewProject === "function") {
                    try {
                        that.planet.initialiseNewProject();
                    } catch (e) {
                        ErrorHandler.recoverable(e, { operation: "planetInitialiseNewProject" });
                    }
                } else {
                    ErrorHandler.warn("Planet initialiseNewProject is unavailable.", {
                        operation: "loadFromPlanet"
                    });
                }

                finishLoading();
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

                    pubsub.off("finishedLoading", __functionload);
                    that.firstRun = false;
                }, 1000);
            };

            pubsub.on("finishedLoading", __functionload);
        };
        setupActivityAbcParser(this);

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
                const loadingText = document.getElementById("loadingText");
                if (loadingText) loadingText.textContent = null;

                const loadingImageContainer = document.getElementById("loading-image-container");
                if (loadingImageContainer) loadingImageContainer.style.display = "none";

                // Try hiding load-container instead if it exists
                const loadContainer = document.getElementById("load-container");
                if (loadContainer) loadContainer.style.display = "none";

                const bottomRightLogo = document.getElementById("bottom-right-logo");
                if (bottomRightLogo) bottomRightLogo.style.display = "none";

                const palette = document.getElementById("palette");
                if (palette) palette.style.display = "block";

                // document.getElementById('canvas').style.display = 'none';

                const hideContents = document.getElementById("hideContents");
                if (hideContents) hideContents.style.display = "block";

                const btnBottom = document.getElementById("buttoncontainerBOTTOM");
                if (btnBottom) btnBottom.style.display = "block";

                const btnTop = document.getElementById("buttoncontainerTOP");
                if (btnTop) btnTop.style.display = "block";
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

            // Use the planet New Project mechanism if it is available
            // and Planet storage is actually initialized (planet.planet
            // is null when running from file:///index.html), but only
            // if the current project has a name.
            if (
                that.planet !== undefined &&
                that.planet.planet !== null &&
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

        /**


        /*
         * Hides all message containers
         */
        this.hideMsgs = () => {
            if (this.alertController) {
                this.alertController.hideAll();
            }
            this._hideAlertUI();
        };

        const hideArrows = () => {
            globalActivity._hideArrows();
        };

        /**
         * Displays a text message on the screen.
         * @param {string|HTMLElement|DocumentFragment} msg - The message to display.
         * @param {number} [duration=60000] - Duration in milliseconds before message disappears.
         */
        /**
         * Ensures a visually hidden aria-live region exists for screen reader announcements.
         * @returns {HTMLElement} The live region element.
         */
        const __ensureA11yLiveRegion = () => {
            let region = document.getElementById("mbA11yLiveRegion");
            if (region) return region;
            region = document.createElement("div");
            region.id = "mbA11yLiveRegion";
            region.setAttribute("role", "status");
            region.setAttribute("aria-live", "polite");
            region.setAttribute("aria-atomic", "true");
            region.style.cssText =
                "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;";
            document.body.appendChild(region);
            return region;
        };
        this.textMsg = (msg, duration = AlertController.MSG_TIMEOUT) => {
            if (this.msgText === null) {
                // The container may not be ready yet, so do nothing.
                return;
            }

            const showMsg = () => {
                this.alertRenderer.showTextMsg(msg);
            };
            // Announce to screen readers via aria-live region
            if (msg && typeof msg === "string") {
                __ensureA11yLiveRegion().textContent = msg;
            }

            const hideMsg = () => {
                this.alertRenderer.hideTextMsg();
            };

            if (this.alertController) {
                this.alertController.showText(duration, showMsg, hideMsg);
            } else {
                showMsg();
            }
        };

        /**
         * Displays an error message on the screen, drawing links or artwork if needed.
         * @param {string} msg - The error message identifier or text.
         * @param {string} [blk] - Block ID associated with the error.
         * @param {string} [text] - Supplemental text for the error.
         * @param {number} [timeout=15000] - Duration in milliseconds before error disappears.
         */
        this.errorMsg = (msg, blk, text, timeout = AlertController.ERROR_MSG_TIMEOUT) => {
            // The container may not be ready yet, so do nothing.
            if (this.errorMsgText === null) {
                return;
            }

            // Announce errors to screen readers via aria-live region
            if (msg && typeof msg === "string") {
                __ensureA11yLiveRegion().textContent = msg;
            }

            const showMsg = () => {
                this.alertRenderer.showErrorMsg(msg, blk, text);
            };

            const hideMsg = () => {
                this.alertRenderer.hideErrorMsg();
            };

            if (this.alertController) {
                this.alertController.showError(timeout, showMsg, hideMsg);
            } else {
                showMsg();
            }
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

        this.__showAltoAccidentals = () => {
            // No-op for Alto clef
        };

        /*
         * We don't save blocks in the trash, so we need to
         * consolidate the block list and remap the connections.
         */
        this.prepareExport = () => {
            const blockMap = [];
            const blockIndexById = new Map();
            this.hasMatrixDataBlock = false;
            for (let blk = 0; blk < this.blocks.blockList.length; blk++) {
                const myBlock = this.blocks.blockList[blk];
                if (myBlock && myBlock.trash) {
                    // Don't save blocks in the trash.
                    continue;
                } else if (!myBlock) {
                    continue;
                }

                blockIndexById.set(blk, blockMap.length);
                blockMap.push(blk);
            }

            const data = [];
            for (let blk = 0; blk < this.blocks.blockList.length; blk++) {
                const myBlock = this.blocks.blockList[blk];
                if (!myBlock || myBlock.trash) {
                    // Don't save blocks in the trash.
                    continue;
                }

                let args = null;
                let exportName = myBlock.name;

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
                        case "drum": {
                            // Find the turtle associated with this block.

                            const turtle =
                                myBlock.value !== null && myBlock.value !== undefined
                                    ? this.turtles.getTurtle(myBlock.value)
                                    : null;
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
                        }
                        case "temperament1":
                            if (this.blocks.customTemperamentDefined) {
                                // If a define temperament block is
                                // present, find the value of the arg
                                // block to get the name of the custom
                                // temperament.
                                let customName = "custom";
                                if (myBlock.connections[1] !== null) {
                                    customName =
                                        this.blocks.blockList[myBlock.connections[1]].value;
                                }

                                debugLog(customName);
                                args = {
                                    customName: customName,
                                    customTemperamentNotes: getTemperament(customName),
                                    startingPitch: this.logo?.synth?.startingPitch || 392,
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
                            exportName = myBlock.privateData;
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
                    const connection = myBlock.connections[c];
                    const mapConnection = blockIndexById.get(connection);
                    if (connection === null || mapConnection === undefined) {
                        connections.push(null);
                    } else {
                        connections.push(mapConnection);
                    }
                }

                const blockIndex = blockIndexById.get(blk);
                if (args === null) {
                    data.push([
                        blockIndex,
                        exportName,
                        myBlock.container.x,
                        myBlock.container.y,
                        connections
                    ]);
                } else {
                    data.push([
                        blockIndex,
                        [exportName, args],
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
            activity.pluginDialog.openPlugin();
        };

        this._loadBuiltInPlugin = name => {
            // Validate: only allow safe characters (alphanumeric, hyphens, and underscores).
            // This prevents path traversal attacks like "../../secrets" regardless of caller.
            if (!/^[a-z0-9\-_]+$/.test(name)) {
                ErrorHandler.warn("Invalid plugin name rejected: " + name, {
                    operation: "loadPlugin"
                });
                return;
            }
            const that = this;
            this.pluginController.loadBuiltInPluginFromXHR(name).then(success => {
                if (success) {
                    // Refresh the palettes.
                    setTimeout(() => {
                        if (that.palettes.visible) {
                            that.palettes.hide();
                        }
                    }, 1000);
                } else {
                    ErrorHandler.warn("Could not load built-in plugin: " + name, {
                        operation: "loadPlugin"
                    });
                }
            });
        };

        this.handlePluginFileSelected = file => {
            const that = this;
            const reader = new FileReader();

            reader.onload = () => {
                that.loading = true;
                document.body.style.cursor = "wait";

                setTimeout(async () => {
                    const source = file.name ? "file:" + file.name : "file:local-file";
                    await that.pluginController.loadPluginFromFileContent(reader.result, source);

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

            reader.readAsText(file);
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
            this.helpfulWheelItems = [];
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
                `${_("Home")} [${_("Home").toUpperCase()}]`,
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
        this.showHelpfulSearchWidget = () => this.searchController.showHelpfulSearchWidget();

        this.doHelpfulSearch = () => this.searchController.doHelpfulSearch();

        /**
         * Toggles display of javaScript editor widget.
         */
        const toggleJSWindow = async activity => {
            await lazyLoad([
                "widgets/jseditor",
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
                "activity/js-export/API/DictBlocksAPI"
            ]);
            new JSEditor(activity);
        };

        const doAnalytics = async activity => {
            if (!activity.statsWindow || !activity.statsWindow.isOpen) {
                await lazyLoad("widgets/statistics");
                activity.statsWindow = new StatsWindow(activity);
            }
        };

        /*
         * Shows help page
         */
        const showHelp = activity => {
            if (window.widgetWindows?.isOpen("keyboard-shortcuts")) {
                window.widgetWindows.clear("keyboard-shortcuts");
            }
            activity._showHelp();
        };

        this._showHelp = async () => {
            // Will show welcome page by default.
            await lazyLoad("widgets/help");
            new HelpWidget(this, false);
        };

        const showKeyboardShortcuts = activity => {
            if (window.widgetWindows?.isOpen("help")) {
                window.widgetWindows.clear("help");
            }
            activity._showKeyboardShortcuts();
        };

        this._showKeyboardShortcuts = () => {
            const platformKeys = (windowsKeys, macKeys = windowsKeys) =>
                `${_("Windows/Linux")}: ${windowsKeys}\n${_("Mac")}: ${macKeys}`;

            const shortcutSections = [
                {
                    title: _("Workspace"),
                    items: [
                        {
                            keys: platformKeys("Alt + R", "Option + R"),
                            action: _("Play project")
                        },
                        {
                            keys: platformKeys("Alt + S", "Option + S"),
                            action: _("Stop project")
                        },
                        {
                            keys: platformKeys("Alt + Enter", "Option + Enter"),
                            action: _("Play or stop depending on the current state")
                        },
                        {
                            keys: platformKeys("Space", "Space"),
                            action: _("Play or stop when no text input or widget is active")
                        },
                        {
                            keys: platformKeys("Shift + Space", "Shift + Space"),
                            action: _("Toggle stage scale")
                        },
                        {
                            keys: platformKeys("Home", "Home"),
                            action: _("Jump to home position")
                        },
                        {
                            keys: platformKeys("End", "End"),
                            action: _("Jump to the bottom of the workspace")
                        },
                        {
                            keys: platformKeys("Page Up", "Page Up"),
                            action: _("Scroll workspace up")
                        },
                        {
                            keys: platformKeys("Page Down", "Page Down"),
                            action: _("Scroll workspace down")
                        },
                        {
                            keys: platformKeys("Esc", "Esc"),
                            action: _("Hide block search when it is open")
                        },
                        {
                            keys: platformKeys("d,r,m,f,s,l,t", "d,r,m,f,s,l,t"),
                            action: _(
                                "You can type d to create a do block and r to create a re block etc."
                            )
                        }
                    ]
                },
                {
                    title: _("Editing"),
                    items: [
                        {
                            keys: platformKeys("Alt + C", "Option + C"),
                            action: _("Copy selected stack.")
                        },
                        {
                            keys: platformKeys("Alt + V", "Option + V"),
                            action: _("Paste previous stack.")
                        },
                        {
                            keys: platformKeys("Ctrl + V", "Control + V"),
                            action: _("Open the JSON paste box.")
                        },
                        {
                            keys: platformKeys("Enter", "Enter"),
                            action: _("Paste JSON when the paste box is focused.")
                        },
                        {
                            keys: platformKeys("Delete", "Delete"),
                            action: _("Extract the active block.")
                        },
                        {
                            keys: platformKeys("Alt + E", "Option + E"),
                            action: _("Clear workspace.")
                        },
                        {
                            keys: platformKeys("Alt + B", "Option + B"),
                            action: _("Save block artwork.")
                        },
                        {
                            keys: platformKeys("Alt + H", "Option + H"),
                            action: _("Save block help.")
                        }
                    ]
                },
                {
                    title: _("Navigation"),
                    items: [
                        {
                            keys: platformKeys("Tab / Shift + Tab", "Tab / Shift + Tab"),
                            action: _("Move focus between the toolbar, palettes, and workspace.")
                        },
                        {
                            keys: platformKeys(_("Arrow keys"), _("Arrow keys")),
                            action: _(
                                "Move the active block, scroll palettes, adjust the tempo widget, or pan the workspace depending on context."
                            )
                        },
                        {
                            keys: platformKeys("/", "/"),
                            action: _("Pan workspace right when horizontal scrolling is enabled.")
                        },
                        {
                            keys: platformKeys("\\", "\\"),
                            action: _("Pan workspace left when horizontal scrolling is enabled.")
                        }
                    ]
                },
                {
                    title: _("Toolbar"),
                    items: [
                        {
                            keys: platformKeys(
                                _("Arrow Left / Arrow Right"),
                                _("Arrow Left / Arrow Right")
                            ),
                            action: _("Move focus within the current toolbar.")
                        },
                        {
                            keys: platformKeys(
                                _("Arrow Up / Arrow Down"),
                                _("Arrow Up / Arrow Down")
                            ),
                            action: _("Move focus between main and auxiliary toolbars.")
                        },
                        {
                            keys: platformKeys("Enter", "Enter"),
                            action: _("Activate the focused toolbar button.")
                        },
                        {
                            keys: platformKeys("Esc", "Esc"),
                            action: _("Exit toolbar keyboard navigation.")
                        }
                    ]
                },
                {
                    title: _("Widget Windows"),
                    items: [
                        {
                            keys: platformKeys("Esc", "Esc"),
                            action: _("Close the focused widget window.")
                        },
                        {
                            keys: platformKeys("Ctrl + Shift + M", "Command + Shift + M"),
                            action: _("Maximize or restore the focused widget window.")
                        }
                    ]
                },
                {
                    title: _("Help and Pitch Slider"),
                    items: [
                        {
                            keys: platformKeys(
                                _("Arrow Left / Arrow Right"),
                                _("Arrow Left / Arrow Right")
                            ),
                            action: _("Move between help pages when Help is open.")
                        },
                        {
                            keys: platformKeys(_("Arrow keys"), _("Arrow keys")),
                            action: _("Adjust pitch by semitone when Pitch Slider is open.")
                        }
                    ]
                }
            ];

            const widgetWindow = window.widgetWindows.windowFor(
                this,
                _("Keyboard shortcuts"),
                "keyboard-shortcuts",
                true
            );
            widgetWindow.clear();
            widgetWindow.show();

            const widgetBody = widgetWindow.getWidgetBody();
            widgetBody.className = "wfbWidget keyboard-shortcuts-widget";
            widgetBody.style.padding = "0";
            widgetBody.style.display = "block";
            widgetBody.style.height = "min(72vh, 680px)";
            widgetBody.style.width = "min(68vw, 760px)";
            widgetBody.style.maxWidth = "100%";
            widgetBody.style.overflow = "hidden";

            const wrapper = document.createElement("div");
            wrapper.className = "keyboard-shortcuts-panel";

            const intro = document.createElement("div");
            intro.className = "keyboard-shortcuts-hero";
            const titleDiv = document.createElement("div");
            titleDiv.className = "keyboard-shortcuts-hero-title";
            titleDiv.textContent = _("Keyboard shortcuts");

            const copyDiv = document.createElement("div");
            copyDiv.className = "keyboard-shortcuts-hero-copy";
            copyDiv.textContent = _(
                "Shortcuts are context-sensitive. Some only work when a related panel, widget, or mode is active. Windows/Linux and Mac equivalents are shown together."
            );

            intro.appendChild(titleDiv);
            intro.appendChild(copyDiv);
            wrapper.appendChild(intro);

            shortcutSections.forEach(section => {
                const sectionCard = document.createElement("section");
                sectionCard.className = "keyboard-shortcuts-section";

                const heading = document.createElement("div");
                heading.textContent = section.title;
                heading.className = "keyboard-shortcuts-section-title";
                sectionCard.appendChild(heading);

                section.items.forEach(item => {
                    const row = document.createElement("div");
                    row.className = "keyboard-shortcuts-row";

                    const key = document.createElement("div");
                    key.textContent = item.keys;
                    key.className = "keyboard-shortcuts-key";

                    const action = document.createElement("div");
                    action.textContent = item.action;
                    action.className = "keyboard-shortcuts-action";

                    row.appendChild(key);
                    row.appendChild(action);
                    sectionCard.appendChild(row);
                });

                wrapper.appendChild(sectionCard);
            });

            widgetBody.appendChild(wrapper);
            widgetWindow.sendToCenter();
            requestAnimationFrame(() => widgetWindow.sendToCenter());
        };

        /*
         * Shows about page
         */
        const showAboutPage = activity => {
            activity._showAboutPage();
        };

        this._showAboutPage = async () => {
            // Will show welcome page by default.
            await lazyLoad("widgets/help");
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
            window.jQuery(".tooltipped").tooltip({
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
            // Accessibility: derive alt text from the button label
            const altText = label ? label.replace(/\s*\[.*\]$/, "") : "Toolbar button";
            img.setAttribute("alt", altText);

            // Batch DOM reads before writes to avoid forced synchronous layout
            const rightPos = document.body.clientWidth - x;
            container.appendChild(img);
            container.setAttribute(
                "style",
                "position: absolute; right:" + rightPos + "px;  top: " + y + "px;"
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
                this.errorMsg(
                    _(
                        "Invalid clipboard data. To paste blocks, first copy them from the Music Blocks canvas. To paste text, click inside an input field."
                    )
                );
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
            this._perfMark("activity.domReady.start");
            await this.init();
            this._perfMark("activity.domReady.end");
            this._perfMeasure(
                "activity.domReady_total",
                "activity.domReady.start",
                "activity.domReady.end"
            );
        };

        this.__saveLocally = () => {
            const data = this.prepareExport();

            if (this.storage.currentProject === undefined) {
                try {
                    this.storage.currentProject = "My Project";
                    this.storage.allProjects = JSON.stringify(["My Project"]);
                } catch (e) {
                    // Edge case, eg. Firefox localSorage DB corrupted
                    ErrorHandler.recoverable(e, { operation: "saveLocally_setCurrentProject" });
                }
            }

            let p = "";
            try {
                p = this.storage.currentProject;
                this.storage["SESSION" + p] = data;
            } catch (e) {
                ErrorHandler.recoverable(e, { operation: "saveLocally_saveSession" });
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
                // FIX: createjs.Bitmap.getBounds() returns null for any Bitmap
                // not added to a live EaselJS stage → TypeError: null.x crash.
                // doSVG() returns "" on blank canvas → naturalWidth = 0 → guaranteed crash.
                // Fix: use img.naturalWidth directly + plain offscreen canvas (no EaselJS needed).
                try {
                    if (!img.naturalWidth || !img.naturalHeight) {
                        // Blank canvas — doSVG() returned empty string, nothing to thumbnail.
                        // SESSION<p> JSON was already saved above, so this is safe to skip.
                        return;
                    }

                    const w = img.naturalWidth;
                    const h = img.naturalHeight;
                    const offscreen = document.createElement("canvas");
                    offscreen.width = w;
                    offscreen.height = h;
                    offscreen.getContext("2d").drawImage(img, 0, 0);
                    this.storage["SESSIONIMAGE" + p] = offscreen.toDataURL("image/png");
                } catch (e) {
                    ErrorHandler.recoverable(e, { operation: "saveLocally_thumbnail" });
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
                // Cache DOM element reference for performance
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
                    const idx = blocksArray[i].blockIndex;
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
                // Cache DOM element reference for performance
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
            // rAF guard for throttling drag-select mousemove
            this._dragSelectRafPending = false;
            if (this.selectionArea && this.selectionArea.parentNode) {
                this.selectionArea.parentNode.removeChild(this.selectionArea);
            }
            this.selectionArea = document.createElement("div");
            document.body.appendChild(this.selectionArea);

            this.setupMouseEvents();

            this.addEventListener(document, "mousemove", event => {
                this.hasMouseMoved = true;
                if (this.isDragging && this.isSelecting) {
                    this.currentX = event.clientX;
                    this.currentY = event.clientY;
                    // Throttle drag-select to one update per animation frame
                    if (
                        !this._dragSelectRafPending &&
                        !this.blocks.isBlockMoving &&
                        !this.turtles.running()
                    ) {
                        this._dragSelectRafPending = true;
                        requestAnimationFrame(() => {
                            this._dragSelectRafPending = false;
                            this.setSelectionMode(true);
                            this.drawSelectionArea();
                            this.selectedBlocks = this.selectBlocksInDragArea();
                            this.unhighlightSelectedBlocks(true, true);
                            this.blocks.setSelectedBlocks(this.selectedBlocks);
                        });
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

            // Batch all CSS writes into a single cssText assignment
            // to avoid multiple forced style recalculations.
            this.selectionArea.style.cssText =
                "display:flex;position:absolute;" +
                "left:" +
                x +
                "px;top:" +
                y +
                "px;" +
                "width:" +
                width +
                "px;height:" +
                height +
                "px;" +
                "z-index:9989;" +
                "background-color:rgba(137,207,240,0.5);" +
                "pointer-events:none;";

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
            const blockIndexMap = new Map();
            for (const [index, block] of this.blocks.blockList.entries()) {
                if (block) {
                    blockIndexMap.set(block, index);
                }
            }

            for (let i = 0; i < this.selectedBlocks.length; i++) {
                const blockIndex = blockIndexMap.get(this.selectedBlocks[i]);
                if (blockIndex === undefined) {
                    continue;
                }

                if (unhighlight) {
                    this.blocks.unhighlightSelectedBlocks(blockIndex, true);
                } else {
                    this.blocks.highlight(blockIndex, true);
                }
            }

            if (!unhighlight && this.selectedBlocks.length > 0) {
                this.refreshCanvas();
            }
        };

        // Check if two blocks are the same by identity (reference equality).

        this.isEqual = (obj1, obj2) => {
            return obj1 === obj2;
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
            // Guard against double initialization
            if (this._initialized) return;
            this._initialized = true;

            // Batch DOM reads before any writes to avoid forced synchronous layout
            this._perfMark("activity.init.start");
            this._clientWidth = document.body.clientWidth;
            this._clientHeight = document.body.clientHeight;
            this._innerWidth = window.innerWidth;
            this._innerHeight = window.innerHeight;
            this._outerWidth = window.outerWidth;
            this._outerHeight = window.outerHeight;
            const loaderEl = document.getElementById("loader");

            // DOM write: apply class after all geometry reads
            loaderEl.className = "loader";

            /*
             * Run browser check before implementing onblur -->
             * stop MB functionality
             * (This is being done to stop MB to lose focus when
             * increasing/decreasing volume on Firefox)
             */

            doBrowserCheck();

            const that = this;

            this.setupWindowBlurHandler(doHardStopButton);

            this.stage = new createjs.Stage(this.canvas);
            createjs.Touch.enable(this.stage);
            this._startRenderLoop();

            // Initialize Ticker with optimal framerate
            createjs.Ticker.framerate = 60;

            // ===== Idle Ticker Optimization =====
            // Throttle rendering when user is inactive and no music is playing
            this._initIdleWatcher();

            // Named event handlers for proper cleanup
            let mouseEvents = 0;
            this.handleMouseMove = () => {
                mouseEvents++;
                if (mouseEvents % 4 === 0) {
                    that.__tick();
                }
            };

            this.handleDocumentClick = e => {
                if (!this.hasMouseMoved) {
                    if (this.selectionModeOn) {
                        this.deselectSelectedBlocks();
                    } else {
                        this._hideHelpfulSearchWidget(e);
                    }
                }
            };

            // Use managed addEventListener for automatic cleanup
            this.addEventListener(document, "mousemove", this.handleMouseMove);
            this.addEventListener(document, "click", this.handleDocumentClick);
            this.addEventListener(window, "beforeunload", () => {
                // Save synchronously to SESSION* keys so manual reload/F5
                // still has recoverable data even if async saves are cut short.
                if (typeof this.__saveLocally === "function") {
                    this.__saveLocally();
                }
                if (
                    typeof this.saveLocally === "function" &&
                    this.saveLocally !== this.__saveLocally
                ) {
                    this.saveLocally();
                }
                this._stopRenderLoop();
                if (typeof this._stopAutoSave === "function") {
                    this._stopAutoSave();
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
            setupGridController(this);
            /* istanbul ignore next -- Activity constructor is browser-only; exercised manually but inaccessible from Jest */
            this.turtles = new Turtles(this);
            setupGridRenderer(this);
            this.boundary = new Boundary(this.blocksContainer);
            this.blocks = new Blocks(this);
            this.palettes = new Palettes(this);
            this.palettes.init();
            this.logo = new Logo(this);

            this.pasteBox = new PasteBox(this);
            this.languageBox = new LanguageBox(this);
            this.themeBox = new ThemeBox(this);
            // Initialize theme state on page load if method exists
            if (this.themeBox && typeof this.themeBox.initializeTheme === "function") {
                this.themeBox.initializeTheme();
            }

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
            this.toolbar.renderHelpIcon(showHelp, showKeyboardShortcuts);
            this.toolbar.renderModeSelectIcon(
                doSwitchMode,
                () => doRecordButton(this),
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
            this._perfMark("activity.init.ui_ready");

            initPalettes(this.palettes);

            if (this.planet !== undefined) {
                this.saveLocally = this.planet.saveLocally.bind(this.planet);
            } else {
                this.saveLocally = this.__saveLocally;
            }

            window.saveLocally = this.saveLocally;

            // Auto-save live workspace every 5 minutes to guard against
            // data loss from browser crashes (see issue #2994).
            // Deferred while the project is actively running to avoid
            // interrupting playback.
            if (typeof this._initAutoSave === "function") {
                this._initAutoSave();
            }

            initBasicProtoBlocks(this);

            // Load any macros saved in local storage.
            // this.storage.macros = null;
            this.macroData = this.storage.macros;
            if (this.macroData !== null) {
                processMacroData(this.macroData, this.palettes, this.blocks, this.macroDict);
            }

            // Load any plugins saved in local storage.
            await this.pluginController.loadStoredPlugins();

            // Load custom mode saved in local storage.
            const custommodeData = this.storage.custommode;
            if (custommodeData !== undefined) {
                // Parse and update the custom musical mode with saved data.
                try {
                    const customModeDataObj = JSON.parse(custommodeData);
                    Object.assign(MUSICALMODES["custom"], customModeDataObj);
                } catch (e) {
                    ErrorHandler.recoverable(e, { operation: "parseCustomMode" });
                }
            }

            this.fileChooser.addEventListener("click", event => {
                event.currentTarget.value = "";
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
                                /* istanbul ignore next -- file-chooser change handler is browser-only; inaccessible from Jest */
                                const cleanData = rawData.replace(/\n/g, " ");
                                let obj;
                                try {
                                    if (cleanData.includes("html")) {
                                        let extracted;
                                        extracted = extractProjectDataFromHTML(cleanData);
                                        if (!extracted) {
                                            that.errorMsg(
                                                _("Cannot find project data in this HTML file.")
                                            );
                                            finishLoading();
                                            return;
                                        }
                                        obj = JSON.parse(unescapeHTML(extracted));
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

                                    ErrorHandler.capture(e, { operation: "loadProjectFromFile" });
                                    document.body.style.cursor = "default";
                                    that.loading = false;
                                }
                            }
                        }, 200);
                    };

                    midiReader.onload = e => {
                        try {
                            const midi = new Midi(e.target.result);
                            console.debug(midi);
                            midiImportBlocks(midi);
                        } catch (err) {
                            ErrorHandler.capture(err, { operation: "midiImport" });
                            if (that && typeof that.errorMsg === "function") {
                                that.errorMsg(
                                    _(
                                        "Cannot load project from the file. Please check the file type."
                                    )
                                );
                            }
                        }
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
                            /* istanbul ignore next -- drag-and-drop file handler is browser-only; inaccessible from Jest */
                            const cleanData = rawData.replace(/\n/g, " ");
                            let obj;
                            try {
                                if (cleanData.includes("html")) {
                                    let extracted;
                                    extracted = extractProjectDataFromHTML(cleanData);
                                    if (!extracted) {
                                        that.errorMsg(
                                            _("Cannot find project data in this HTML file.")
                                        );
                                        finishLoading();
                                        return;
                                    }
                                    obj = JSON.parse(unescapeHTML(extracted));
                                } else {
                                    obj = JSON.parse(cleanData);
                                }
                                for (const name in that.blocks.palettes.dict) {
                                    that.palettes.dict[name].hideMenu(true);
                                }

                                that.stage.removeAllEventListeners("trashsignal");

                                const __afterLoad = () => {
                                    pubsub.off("finishedLoading", __afterLoad);
                                };

                                // Wait for the old blocks to be removed.
                                const __listener = () => {
                                    that.blocks.loadNewBlocks(obj);
                                    that.stage.removeAllEventListeners("trashsignal");

                                    pubsub.on("finishedLoading", __afterLoad);
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
                                ErrorHandler.capture(e, { operation: "loadFromFile" });
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
                    try {
                        const midi = new Midi(e.target.result);
                        console.debug(midi);
                        midiImportBlocks(midi);
                    } catch (err) {
                        ErrorHandler.capture(err, { operation: "midiImportBlocks" });
                        if (that && typeof that.errorMsg === "function") {
                            that.errorMsg(
                                _("Cannot load project from the file. Please check the file type.")
                            );
                        }
                    }
                };

                // Music Block Parser from abc to MB
                abcReader.onload = async event => {
                    //get the abc data and replace the / so that the block does not break
                    let abcData = event.target.result;
                    abcData = abcData.replace(/\\/g, "");

                    await ensureABCJS();
                    const tunebook = new ABCJS.parseOnly(abcData);

                    debugLog(tunebook);
                    tunebook.forEach(tune => {
                        //call parseABC to parse abcdata to MB json
                        this.parseABC(tune);
                    });
                };

                // Work-around in case the handler is called by the
                // widget drag & drop code.
                if (files[0] !== undefined) {
                    const extension = files[0].name.split(".").pop().toLowerCase(); //file extension from input file

                    const isMidi = extension === "mid" || extension === "midi";
                    if (isMidi) {
                        midiReader.readAsArrayBuffer(files[0]);
                        return;
                    }

                    const isABC = extension === "abc";
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

            this.allFilesChooser.addEventListener("click", event => {
                event.currentTarget.value = "";
            });

            // Enable touch interactions if supported on the current device.
            createjs.Touch.enable(this.stage, false, true);

            // Keep tracking the mouse even when it leaves the canvas.
            this.stage.mouseMoveOutside = true;

            // Enabled mouse over and mouse out events.
            this.stage.enableMouseOver(10); // default is 20

            // Cache encoded SVG data URIs to avoid re-encoding identical artwork on startup.
            const gridDataUri = svg =>
                "data:image/svg+xml;base64," + window.btoa(base64Encode(svg));
            const encodedGridUris = {
                cartesian: gridDataUri(CARTESIAN),
                polar: gridDataUri(POLAR),
                treble: gridDataUri(TREBLE),
                grand: gridDataUri(GRAND),
                soprano: gridDataUri(SOPRANO),
                alto: gridDataUri(ALTO),
                tenor: gridDataUri(TENOR),
                bass: gridDataUri(BASS),
                grandG: gridDataUri(GRAND_G),
                grandF: gridDataUri(GRAND_F),
                trebleG: gridDataUri(TREBLE_G),
                trebleF: gridDataUri(TREBLE_F)
            };

            this.cartesianBitmap = this._createGrid(encodedGridUris.cartesian);
            this.polarBitmap = this._createGrid(encodedGridUris.polar);
            this.trebleBitmap = this._createGrid(encodedGridUris.treble);
            this.grandBitmap = this._createGrid(encodedGridUris.grand);
            this.sopranoBitmap = this._createGrid(encodedGridUris.soprano);
            this.altoBitmap = this._createGrid(encodedGridUris.alto);
            this.tenorBitmap = this._createGrid(encodedGridUris.tenor);
            this.bassBitmap = this._createGrid(encodedGridUris.bass);

            // We use G (one sharp) and F (one flat) as prototypes for all
            // of the accidentals. When applied, these graphics are offset
            // vertically to rendering different sharps and flats and
            // horizontally so as not to overlap.
            for (let i = 0; i < 7; i++) {
                this.grandSharpBitmap[i] = this._createGrid(encodedGridUris.grandG);
                this.grandFlatBitmap[i] = this._createGrid(encodedGridUris.grandF);
                this.trebleSharpBitmap[i] = this._createGrid(encodedGridUris.trebleG);
                this.trebleFlatBitmap[i] = this._createGrid(encodedGridUris.trebleF);
                this.sopranoSharpBitmap[i] = this._createGrid(encodedGridUris.trebleG);
                this.sopranoFlatBitmap[i] = this._createGrid(encodedGridUris.trebleF);
                this.altoSharpBitmap[i] = this._createGrid(encodedGridUris.trebleG);
                this.altoFlatBitmap[i] = this._createGrid(encodedGridUris.trebleF);
                this.tenorSharpBitmap[i] = this._createGrid(encodedGridUris.trebleG);
                this.tenorFlatBitmap[i] = this._createGrid(encodedGridUris.trebleF);
                this.bassSharpBitmap[i] = this._createGrid(encodedGridUris.trebleG);
                this.bassFlatBitmap[i] = this._createGrid(encodedGridUris.trebleF);
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
                                            env.push(parseInt(n, 10));
                                        },
                                        () => {
                                            alert(
                                                _(
                                                    "Something went wrong reading JSON-encoded project data."
                                                )
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

            // initialize doSearch
            this.doSearch();

            // create functionality of 2D drag to select blocks in bulk
            this._create2Ddrag();

            // Named event handler for proper cleanup
            const activity = this;
            this.handleKeyDown = event => {
                activity.__keyPressed(event);
            };

            // Use managed addEventListener instead of onkeydown assignment
            this.addEventListener(document, "keydown", this.handleKeyDown);
            this.addEventListener(
                document,
                "keydown",
                event => {
                    if ((event.ctrlKey || event.metaKey) && event.code === "Space") {
                        event.preventDefault();
                        event.stopImmediatePropagation();
                        this._displayHelpfulSearchDiv();
                    }
                },
                true
            );

            if (this.planet !== undefined) {
                this.planet.planet.setAnalyzeProject(doAnalyzeProject);
            }

            this._perfMark("activity.init.end");
            this._perfMeasure("activity.init_total", "activity.init.start", "activity.init.end");
            this._perfMeasure(
                "activity.init_to_ui_ready",
                "activity.init.start",
                "activity.init.ui_ready"
            );
            this._perfMeasure(
                "loader_to_activity_init_complete",
                "loader.main.start",
                "activity.init.end"
            );

            if (
                typeof window !== "undefined" &&
                window.__mbPerf &&
                typeof window.__mbPerf.report === "function"
            ) {
                window.__mbPerf.report();
            }
        };
    }

    /**
     * Record a named performance mark in the global mbPerf tracker.
     * @param {string} markName - The mark identifier.
     * @returns {void}
     */
    _perfMark(markName) {
        if (
            typeof window === "undefined" ||
            !window.__mbPerf ||
            !window.__mbPerf.enabled ||
            !window.__mbPerf.marks
        ) {
            return;
        }
        if (typeof performance === "undefined" || typeof performance.now !== "function") {
            return;
        }
        window.__mbPerf.marks[markName] = performance.now();
    }

    /**
     * Measure elapsed milliseconds between two mbPerf marks.
     * @param {string} measureName - The measure identifier.
     * @param {string} startMark - Start mark name.
     * @param {string} endMark - End mark name.
     * @returns {void}
     */
    _perfMeasure(measureName, startMark, endMark) {
        if (
            typeof window === "undefined" ||
            !window.__mbPerf ||
            !window.__mbPerf.enabled ||
            !window.__mbPerf.marks ||
            !window.__mbPerf.measures
        ) {
            return;
        }
        const start = window.__mbPerf.marks[startMark];
        const end = window.__mbPerf.marks[endMark];
        if (typeof start !== "number" || typeof end !== "number") return;
        window.__mbPerf.measures[measureName] = +(end - start).toFixed(2);
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
     * Installs the shared blur-stop hook without overwriting any existing
     * global blur handler.
     *
     * @param {Function} doHardStopButton - Shared stop action callback.
     */
    setupWindowBlurHandler(doHardStopButton) {
        if (jQuery.browser.mozilla) {
            return;
        }

        this._handleWindowBlur = () => {
            doHardStopButton(this, true);
        };

        this.addEventListener(window, "blur", this._handleWindowBlur);
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

        // Keep idle watcher cleanup centralized to avoid stale field mismatches.
        if (typeof this._stopIdleWatcher === "function") {
            this._stopIdleWatcher();
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
            ErrorHandler.recoverable(e, { operation: "saveLocalStorage" });
        }
    }

    /**
     * Regenerates all palettes based on current mode
     * @returns {void}
     */
    regeneratePalettes() {
        this.paletteLoader.regeneratePalettes();
    }
}

// ---------------------------------------------------------------------------
// Hard Deprecation Guard — window.activity
//
// The Activity singleton is no longer exposed on window.activity.
// All code must use ActivityContext.getActivity() instead.
// This guard ensures:
//   • Silent-regression safety (warns loudly in console, not silently undefined)
//   • A migration window — replace with a hard removal in the next major version
// ---------------------------------------------------------------------------
(function installActivityDeprecationGuard() {
    if (typeof window === "undefined") return; // safety for SSR / Node test runners
    try {
        Object.defineProperty(window, "activity", {
            configurable: true, // allow removal in the next major version
            enumerable: false,
            get() {
                console.warn(
                    "[Deprecated] window.activity is removed. " +
                        "Use ActivityContext.getActivity() instead."
                );
                return undefined;
            },
            set() {
                console.error(
                    "[Deprecated] window.activity is removed and cannot be set. " +
                        "Use ActivityContext.setActivity() via activity-context.js."
                );
            }
        });
    } catch (e) {
        // Fail silently — defining the property must never break the app.

        console.warn("[ActivityDeprecationGuard] Could not install guard:", e);
    }
})();

const activity = new Activity();

// Execute initialization once all RequireJS modules are loaded AND DOM is ready
define(["domReady!", "activity/exporters"].concat(MYDEFINES), (doc, exportersModule) => {
    exporters = exportersModule;
    const initialize = () => {
        // Defensive check for multiple critical globals that may be delayed
        // due to 'defer' execution timing variances.
        const globalsReady =
            typeof createDefaultStack !== "undefined" &&
            typeof createjs !== "undefined" &&
            typeof Tone !== "undefined" &&
            typeof GIFAnimator !== "undefined" &&
            typeof SuperGif !== "undefined";

        if (globalsReady) {
            activity.setupDependencies();
            activity.domReady(doc);
            activity.doContextMenus();
            activity.doPluginsAndPaletteCols();
        } else {
            // Race condition in Firefox: non-AMD scripts might not have
            // finished global assignment yet.
            // Use readiness-based initialization for Firefox for better performance
            if (typeof jQuery !== "undefined" && jQuery.browser && jQuery.browser.mozilla) {
                waitForReadiness(
                    () => {
                        activity.setupDependencies();
                        activity.domReady(doc);
                        activity.doContextMenus();
                        activity.doPluginsAndPaletteCols();
                    },
                    {
                        maxWait: 10000,
                        minWait: 500,
                        checkInterval: 100
                    }
                );
            } else {
                setTimeout(initialize, 50); // Increased delay slightly
            }
        }
    };
    initialize();
});
