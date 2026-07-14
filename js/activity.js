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
   setupProjectManager,
   setupKeyboardController,
   setupSearchController, setupSearchUI, setupWorkspaceLayoutController, setupSelectionController,
   setupTrashController,
   setupHelpController,
   setupBlockScaleController,
   setupContextMenuController,
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

    "project-manager",
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
    "activity/workspace-layout-controller",
    "activity/trash-controller",
    "activity/help-controller",
    "activity/block-scale-controller",
    "activity/context-menu-controller",
    "search-ui",
    "keyboard-controller",
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
        "widgets/tuner",
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
        setupProjectManager(this);
        setupKeyboardController(this);
        setupPluginController(this);
        setupToolbarController(this);
        setupAlertController(this);
        setupAlertRenderer(this);
        setupPaletteLoader(this);
        this.searchUI = setupSearchUI(this);
        setupSearchController(this, this.searchUI);
        setupWorkspaceLayoutController(this);
        setupSelectionController(this);
        setupBlockScaleController(this);
        setupContextMenuController(this);
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
                    const isInteracting =
                        this.selectionController.isDragging || this.selectionController.isSelecting;

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

        // Context menu / helpful wheel / bottom toolbar functionality has been
        // extracted to ContextMenuController (js/context-menu-controller.js).
        // setupContextMenuController() installs the delegation stubs below:
        // setHelpfulSearchDiv, _displayHelpfulSearchDiv, _hideHelpfulSearchWidget,
        // doContextMenus, displayHelpfulWheel, setupPaletteMenu, makeButton,
        // loadButtonDragHandler, openAuxMenu, _showHideAuxMenu, showHideAuxMenu,
        // hideAuxMenu, deltaY.

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

        // Workspace layout ("Home" button) functionality has been extracted to
        // WorkspaceLayoutController (js/activity/workspace-layout-controller.js).
        // setupWorkspaceLayoutController() installs the delegation stubs below:
        // findBlocks, setHomeContainers, repositionBlocks, _handleRepositionBlocksOnResize.

        //if any window resize event occurs:
        this.addEventListener(window, "resize", this._handleRepositionBlocksOnResize);

        // Sets up HelpController (js/help-controller.js), which owns the help
        // window, about page, keyboard shortcuts dialog, statistics window,
        // JavaScript editor launch, and the Alt-H save-help-block workflow.
        // this.showHelp, this.showAboutPage, this.showKeyboardShortcuts,
        // this.toggleJSWindow, this.doAnalytics, and this._saveHelpBlocks are
        // delegation stubs installed by setupHelpController() so external
        // callers continue to work unchanged.
        setupHelpController(this);

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
        // Exposed so ContextMenuController (activity/context-menu-controller.js) can
        // reference it from the helpfulWheelItems registry it builds.
        this.setScroller = setScroller;

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

        this.doLoadAnimation = (...args) => this.projectManager.doLoadAnimation(...args);

        this.stopLoadAnimation = (...args) => this.projectManager.stopLoadAnimation(...args);

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
                                    that.doLargerBlocks();
                                } else {
                                    that.doSmallerBlocks();
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
                    delY < 0 ? that.doLargerBlocks() : that.doSmallerBlocks();
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
         * Keyboard shortcut dispatch, current-key-code state, and listener
         * lifecycle are owned by KeyboardController (js/keyboard-controller.js).
         */
        this.__keyPressed = (...args) => this.keyboardController.__keyPressed(...args);

        /**
         * @returns currentKeyCode
         */
        this.getCurrentKeyCode = (...args) => this.keyboardController.getCurrentKeyCode(...args);

        /*
         * Sets current key code to 0
         */
        this.clearCurrentKeyCode = (...args) =>
            this.keyboardController.clearCurrentKeyCode(...args);

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
            this.setupPaletteMenu();

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
                this.setupPaletteMenu();
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

        // Sets up TrashController (js/trash-controller.js), which owns restoring
        // blocks from the trash (individually, in bulk, or the most recent one),
        // rendering the trash panel, and the restoreIcon click handling.
        // this.restoreTrash, this.restoreTrashPop, this._restoreTrashById,
        // this._renderTrashView, this._showTrashPreviewPopup, and
        // this._hideTrashPreviewPopup are delegation stubs installed by
        // setupTrashController() so external callers continue to work unchanged.
        setupTrashController(this);

        // Aux menu open/close/toggle (_openAuxMenu, _showHideAuxMenu, showHideAuxMenu,
        // hideAuxMenu) has been extracted to ContextMenuController; see the
        // delegation stubs installed by setupContextMenuController() above.

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
        // Exposed so ContextMenuController (activity/context-menu-controller.js) can
        // reference it from the helpfulWheelItems registry it builds.
        this.changeBlockVisibility = changeBlockVisibility;

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
        // Exposed so ContextMenuController (activity/context-menu-controller.js) can
        // reference it from the helpfulWheelItems registry it builds.
        this.toggleCollapsibleStacks = toggleCollapsibleStacks;

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
            this.toolbar.closeAuxToolbar(this.showHideAuxMenu);
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
        // Exposed so ContextMenuController (activity/context-menu-controller.js) can
        // reference it from the helpfulWheelItems registry it builds.
        this.chooseKeyMenu = chooseKeyMenu;

        window.prepareExport = (...args) => this.projectManager.prepareExport(...args);

        this.runProject = (...args) => this.projectManager.runProject(...args);

        this.getClosestStandardNoteValue = (...args) =>
            this.projectManager.getClosestStandardNoteValue(...args);

        this._loadProject = (...args) => this.projectManager._loadProject(...args);
        setupActivityAbcParser(this);
        this.loadStartWrapper = (...args) => this.projectManager.loadStartWrapper(...args);

        this.showContents = (...args) => this.projectManager.showContents(...args);

        this.justLoadStart = (...args) => this.projectManager.justLoadStart(...args);

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
        this.prepareExport = (...args) => this.projectManager.prepareExport(...args);

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

        // Palette/bottom-toolbar menu construction (_setupPaletteMenu and the
        // helpfulWheelItems registry it builds) has been extracted to
        // ContextMenuController; see the setupPaletteMenu delegation stub
        // installed by setupContextMenuController() above.

        /*
         * Shows search widget on helpfulSearchDiv
         */
        this.showHelpfulSearchWidget = () => this.searchController.showHelpfulSearchWidget();

        this.doHelpfulSearch = () => this.searchController.doHelpfulSearch();

        // Non-toolbar button creation and drag handling (_makeButton,
        // _loadButtonDragHandler) has been extracted to ContextMenuController;
        // see the makeButton/loadButtonDragHandler delegation stubs installed
        // by setupContextMenuController() above.

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

        // deltaY (repositions elements on screen when the aux toolbar opens/closes)
        // has been extracted to ContextMenuController; see the delegation stub
        // installed by setupContextMenuController() above.

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

        this.__saveLocally = (...args) => this.projectManager.saveLocally(...args);

        // 2D drag-selection and multi-selection are owned by
        // SelectionController (js/activity/selection-controller.js).
        // setupSelectionController() installs the delegation stubs below
        // (setupMouseEvents, deselectSelectedBlocks, deleteMultipleBlocks,
        // copyMultipleBlocks, selectMode, _create2Ddrag, _createDrag,
        // drawSelectionArea, rectanglesOverlap, selectBlocksInDragArea,
        // unhighlightSelectedBlocks, isEqual, setSelectionMode).

        // end the drag on navbar
        this.addEventListener(document.getElementById("toolbars"), "mouseover", () => {
            this.selectionController.isDragging = false;
        });

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
                if (!this.selectionController.hasMouseMoved) {
                    if (this.selectionController.selectionModeOn) {
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
                this.showHelp();
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

            this.toolbar.renderLogoIcon(this.showAboutPage);
            this.toolbar.renderPlayIcon(doFastButton);
            this.toolbar.renderStopIcon(doHardStopButton);
            this.toolbar.renderNewProjectIcon(() => this.projectManager.newProject());
            this.toolbar.renderLoadIcon(() => this.projectManager.doLoad());
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
            this.toolbar.renderMenuIcon(this.showHideAuxMenu);
            this.toolbar.renderHelpIcon(this.showHelp, this.showKeyboardShortcuts);
            this.toolbar.renderModeSelectIcon(
                doSwitchMode,
                () => doRecordButton(this),
                this.doAnalytics,
                doOpenPlugin,
                deletePlugin,
                setScroller
            );
            this.toolbar.renderRunSlowlyIcon(doSlowButton);
            this.toolbar.renderRunStepIcon(doStepButton);
            this.toolbar.renderThemeSelectIcon(this.themeBox, this.themes);
            this.toolbar.renderMergeIcon(() => this.projectManager.doMergeLoad());
            this.toolbar.renderRestoreIcon(this.restoreTrash);
            if (_THIS_IS_MUSIC_BLOCKS_) {
                this.toolbar.renderChooseKeyIcon(chooseKeyMenu);
            }
            this.toolbar.renderJavaScriptIcon(this.toggleJSWindow);
            this.toolbar.renderLanguageSelectIcon(this.languageBox);
            this.toolbar.renderWrapIcon();
            this._perfMark("activity.init.ui_ready");

            initPalettes(this.palettes);

            if (this.planet !== undefined) {
                this.saveLocally = this.planet.saveLocally.bind(this.planet);
            } else {
                this.saveLocally = (...args) => this.projectManager.saveLocally(...args);
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

            this._onResize(true);
            this.projectManager.start();

            this.prepSearchWidget();

            // initialize doSearch
            this.doSearch();

            // create functionality of 2D drag to select blocks in bulk
            this._create2Ddrag();

            // Keyboard shortcut listener registration/cleanup is owned by
            // KeyboardController (set up earlier in the constructor).
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
