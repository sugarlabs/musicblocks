/*
   exported LegoWidget
*/

/*
   global

   _, ManagedTimer, LegoBricksRows, LegoBricksLayout, LegoBricksExport, LegoBricksMedia,
   LegoBricksEyeDropper, LegoBricksColor, LegoBricksPlayback, LegoBricksVisualization
*/
/*
    Globals location
    - js/utils/utils.js
        _
    - js/utils/ManagedTimer.js
        ManagedTimer
    - js/widgets/LegoBricksRows.js, LegoBricksLayout.js, LegoBricksExport.js,
      LegoBricksMedia.js, LegoBricksEyeDropper.js, LegoBricksColor.js,
      LegoBricksPlayback.js, LegoBricksVisualization.js
        LegoBricksRows, LegoBricksLayout, LegoBricksExport, LegoBricksMedia,
        LegoBricksEyeDropper, LegoBricksColor, LegoBricksPlayback, LegoBricksVisualization
*/

/** AMD module dependencies for lazy loading. */
LegoWidget.dependencies = [
    "widgets/LegoBricksRows",
    "widgets/LegoBricksLayout",
    "widgets/LegoBricksExport",
    "widgets/LegoBricksMedia",
    "widgets/LegoBricksEyeDropper",
    "widgets/LegoBricksColor",
    "widgets/LegoBricksPlayback",
    "widgets/LegoBricksVisualization",
    "widgets/legobricks"
];

/**
 * Represents a LEGO Bricks Widget with Phrase Maker functionality.
 * @constructor
 */
function LegoWidget() {
    LegoWidget.installModules(this);

    // Matrix data structure with pitch mappings
    this.matrixData = {
        rows: [
            {
                type: "pitch",
                label: "High C (Do)",
                icon: "HighC.png",
                color: "pitch-row",
                note: "C5"
            },
            { type: "pitch", label: "B (Ti)", icon: "B.png", color: "pitch-row", note: "B4" },
            { type: "pitch", label: "A (La)", icon: "A.png", color: "pitch-row", note: "A4" },
            { type: "pitch", label: "G (So)", icon: "G.png", color: "pitch-row", note: "G4" },
            { type: "pitch", label: "F (Fa)", icon: "F.png", color: "pitch-row", note: "F4" },
            { type: "pitch", label: "E (Mi)", icon: "E.png", color: "pitch-row", note: "E4" },
            { type: "pitch", label: "D (Re)", icon: "D.png", color: "pitch-row", note: "D4" },
            {
                type: "pitch",
                label: "Middle C (Do)",
                icon: "MiddleC.png",
                color: "pitch-row",
                note: "C4"
            },
            {
                type: "pitch",
                label: "B (Low Ti)",
                icon: "LowB.png",
                color: "pitch-row",
                note: "B3"
            },
            {
                type: "pitch",
                label: "Low C (Low Do)",
                icon: "LowC.png",
                color: "pitch-row",
                note: "C3"
            },
            { type: "pitch", label: "Zoom Controls", icon: "LowC.png", color: "pitch-row" }
        ],
        columns: 8,
        selectedCells: new Set()
    };

    // Widget properties
    this.widgetWindow = null;
    this.activity = null;
    this.isPlaying = false;
    this.isDragging = false;
    this.currentZoom = 1;
    this.verticalSpacing = 50;
    this.imageWrapper = null;
    this.synth = null;
    this.selectedInstrument = "electronic synth";
    this.hasGeneratedVisualization = false; // Flag to prevent double PNG downloads
    this._polyphonicTimeout = null;
    this._resolvePolyphonicWait = null;
    this._playingNotes = new Set();
    this._polyphonicPlaybackId = 0;
    this._fileInput = null;
    this._animationFrameId = null;

    /**
     * Timer manager for managing all widget timeouts safely.
     * @type {ManagedTimer|null}
     * @private
     */
    this._timerManager = typeof ManagedTimer !== "undefined" ? new ManagedTimer() : null;

    /**
     * Fallback timeout tracking for test/runtime environments where ManagedTimer is unavailable.
     * @type {Set<number>}
     * @private
     */
    this._activeTimeouts = new Set();

    // Eye dropper and background color properties
    this.eyeDropperMode = false;
    this.selectedBackgroundColor = { name: "green", hue: 120 }; // Default green background
    this.eyeDropperCursor = null;

    // Drag handler references for cleanup
    this._dragMoveHandler = null;
    this._dragUpHandler = null;

    // Off-screen canvas for pixel sampling — created once per media load and
    // reused across all animation frames to avoid per-frame canvas allocations.
    this._offscreenCanvas = null;
    this._offscreenCtx = null;
    this._offscreenIsVideo = false;
    this._offscreenMediaElement = null;

    // Pitch block handling properties (similar to PhraseMaker)
    this.rowLabels = [];
    this.rowArgs = [];
    this._rowBlocks = [];
    this._rowMap = [];
    this._rowOffset = [];
    this._notesToPlay = []; // Array to store notes for action block export

    /**
     * Initializes the LEGO Widget with Phrase Maker functionality.
     * @param {object} activity - The activity object.
     * @returns {void}
     */
    this.init = function (activity) {
        this.activity = activity;
        this.running = true;

        // Initialize audio synthesizer
        this._initAudio();

        const widgetWindow = this._createWidgetWindow();
        this._createToolbarButtons(widgetWindow);

        // Create main container
        this.createMainContainer();

        widgetWindow.sendToCenter();
        this.widgetWindow = widgetWindow;

        // Generate rows based on pitch blocks
        this._generateRowsFromPitchBlocks();

        // Re-initialize row headers with the dynamic rows
        this._initializeRowHeaders();

        this._scale();
        this.activity.textMsg(
            _(
                "LEGO Bricks - Phrase Maker with %s pitch rows (sorted by frequency, Instrument)"
            ).replace(/%s/g, this.rowLabels.length.toString())
        );
    };

    /**
     * Shows the widget.
     * @returns {void}
     */
    this.show = function () {
        if (this.widgetWindow) {
            this.widgetWindow.show();
        }
    };

    /**
     * Updates widget parameters.
     * @param {object} params - The parameters to update.
     * @returns {void}
     */
    this.updateParams = function (params) {
        // Handle parameter updates if needed
        if (params.zoom && this.zoomSlider) {
            this.zoomSlider.value = params.zoom;
            this._handleZoom();
        }
    };
}

LegoWidget.ICONSIZE = 32;
LegoWidget.WIDGETWIDTH = 1200;
LegoWidget.WIDGETHEIGHT = 700;
LegoWidget.ROW_HEIGHT = 40; // Fixed row height for both matrix and image canvas

// Hex codes for the color families used by the eye dropper and color
// detection visualization.
LegoWidget.COLOR_HEX_MAP = {
    red: "#FF0000",
    orange: "#FFA500",
    yellow: "#FFFF00",
    green: "#00FF00",
    blue: "#0000FF",
    purple: "#800080",
    pink: "#FFC0CB",
    cyan: "#00FFFF",
    magenta: "#FF00FF",
    white: "#FFFFFF",
    black: "#000000",
    gray: "#808080"
};

/**
 * Creates a thin vertical separator span used between toolbar control groups.
 * @returns {HTMLElement} The separator element.
 */
LegoWidget.createControlSeparator = () => {
    const separator = document.createElement("span");
    separator.textContent = "|";
    separator.style.margin = "0 8px";
    separator.style.color = "#888";
    return separator;
};

/**
 * Creates an absolutely-positioned, draggable-ready wrapper div for
 * displaying an uploaded image or webcam feed.
 * @returns {HTMLElement} The wrapper element.
 */
LegoWidget.createImageWrapper = () => {
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = "0px";
    wrapper.style.top = "0px";
    wrapper.style.transformOrigin = "top left";
    wrapper.style.cursor = "grab";
    return wrapper;
};

/**
 * Sets the methods of the LEGO Bricks modules (LegoBricksRows.js, LegoBricksLayout.js,
 * LegoBricksExport.js, LegoBricksMedia.js, LegoBricksEyeDropper.js, LegoBricksColor.js,
 * LegoBricksPlayback.js and LegoBricksVisualization.js) on a widget instance. Each module is a
 * function that assigns its methods to `this`, the same way the constructor used to, so the
 * methods stay own properties of the widget.
 *
 * RequireJS loads the modules before the widget is created (see LegoWidget.dependencies), so they
 * are always defined by the time the constructor runs.
 * @param {LegoWidget} widget - The widget being constructed.
 * @returns {void}
 * @throws {Error} If any module is missing. The error names the missing modules, and no module
 *     is installed, so a half-built widget is never returned.
 */
LegoWidget.installModules = function (widget) {
    const modules = {
        LegoBricksRows: typeof LegoBricksRows !== "undefined" ? LegoBricksRows : null,
        LegoBricksLayout: typeof LegoBricksLayout !== "undefined" ? LegoBricksLayout : null,
        LegoBricksExport: typeof LegoBricksExport !== "undefined" ? LegoBricksExport : null,
        LegoBricksMedia: typeof LegoBricksMedia !== "undefined" ? LegoBricksMedia : null,
        LegoBricksEyeDropper:
            typeof LegoBricksEyeDropper !== "undefined" ? LegoBricksEyeDropper : null,
        LegoBricksColor: typeof LegoBricksColor !== "undefined" ? LegoBricksColor : null,
        LegoBricksPlayback: typeof LegoBricksPlayback !== "undefined" ? LegoBricksPlayback : null,
        LegoBricksVisualization:
            typeof LegoBricksVisualization !== "undefined" ? LegoBricksVisualization : null
    };
    const missing = Object.keys(modules).filter(name => typeof modules[name] !== "function");
    if (missing.length > 0) {
        throw new Error("LegoWidget: LEGO Bricks module not loaded: " + missing.join(", "));
    }

    for (const name in modules) {
        modules[name].call(widget);
    }
};

if (typeof module !== "undefined") {
    module.exports = LegoWidget;
}
