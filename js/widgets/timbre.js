// Copyright (c) 2017-21 Walter Bender
// Copyright (c) 2017 Tayba Wasim
// Copyright (c) 2017 Prachi Agrawal
// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   DEFAULTOSCILLATORTYPE, platformColor,
   Singer, instrumentsEffects:writeable, instrumentsFilters:writeable,
   docById, ManagedTimer, announceToScreenReader, _,
   TimbreState, TimbrePanels, TimbreAudio, TimbreBlocks
 */

/*
   Global locations
    js/utils/musicutils.js
        DEFAULTOSCILLATORTYPE
    js/utils/platformstyle.js
        platformColor
    js/utils/utils.js
        docById, _
    js/utils/ManagedTimer.js
        ManagedTimer
    js/utils/synthutils.js
        instrumentsEffects, instrumentsFilters
    js/turtle-singer.js
        Singer
    js/widgets/TimbreState.js
        TimbreState
    js/widgets/TimbrePanels.js
        TimbrePanels
    js/widgets/TimbreAudio.js
        TimbreAudio
    js/widgets/TimbreBlocks.js
        TimbreBlocks
*/

/* exported TimbreWidget */

class TimbreWidget {
    /** AMD module dependencies for lazy loading. */
    static dependencies = [
        "widgets/TimbreState",
        "widgets/TimbrePanels",
        "widgets/TimbreAudio",
        "widgets/TimbreBlocks",
        "widgets/timbre"
    ];

    static BUTTONSIZE = 53;
    static ICONSIZE = 32;

    /**
     * Whether installModules has copied the module methods onto the prototype.
     * @type {boolean}
     */
    static _modulesInstalled = false;

    /**
     * Copies the methods of the Timbre modules (TimbreState.js, TimbrePanels.js,
     * TimbreAudio.js, and TimbreBlocks.js) onto TimbreWidget.prototype, keeping
     * their names and property descriptors, so they behave exactly like methods
     * declared in this class and `this` inside them is the widget.
     * @returns {boolean} Whether the methods are installed.
     */
    static installModules() {
        if (TimbreWidget._modulesInstalled) {
            return true;
        }

        const modules = [
            typeof TimbreState !== "undefined" ? TimbreState : null,
            typeof TimbrePanels !== "undefined" ? TimbrePanels : null,
            typeof TimbreAudio !== "undefined" ? TimbreAudio : null,
            typeof TimbreBlocks !== "undefined" ? TimbreBlocks : null
        ];
        if (modules.includes(null)) {
            return false;
        }

        for (const module of modules) {
            for (const name of Object.getOwnPropertyNames(module.prototype)) {
                if (name !== "constructor") {
                    Object.defineProperty(
                        TimbreWidget.prototype,
                        name,
                        Object.getOwnPropertyDescriptor(module.prototype, name)
                    );
                }
            }
        }

        TimbreWidget._modulesInstalled = true;
        return true;
    }

    /**
     * @constructor
     */
    constructor() {
        TimbreWidget.installModules();

        this.notesToPlay = [];
        this.env = [];
        this.ENVs = [];
        this._eventListeners = {}; // Store event listeners for cleanup
        this._timerManager = typeof ManagedTimer !== "undefined" ? new ManagedTimer() : null;
        this._activeTimeouts = new Set();
        this._previewTimerId = null;
        this.synthVals = {
            oscillator: {
                type: "sine6",
                source: DEFAULTOSCILLATORTYPE
            },
            envelope: {
                attack: 0.01,
                decay: 0.5,
                sustain: 0.6,
                release: 0.01
            }
        };

        this.adsrMap = ["attack", "decay", "sustain", "release"];
        this.amSynthParamvals = {
            harmonicity: 3
        };

        this.fmSynthParamvals = {
            modulationIndex: 10
        };

        this.noiseSynthParamvals = {
            noise: {
                type: "white"
            }
        };

        this.duoSynthParamVals = {
            vibratoAmount: 0.5,
            vibratoRate: 5
        };

        this.fil = [];
        this.filterParams = [];
        this.osc = [];
        this.oscParams = [];
        this.tremoloEffect = [];
        this.tremoloParams = [];
        this.vibratoEffect = [];
        this.vibratoParams = [];
        this.chorusEffect = [];
        this.chorusParams = [];
        this.phaserEffect = [];
        this.phaserParams = [];
        this.distortionEffect = [];
        this.distortionParams = [];
        this.AMSynthesizer = [];
        this.AMSynthParams = [];
        this.FMSynthesizer = [];
        this.FMSynthParams = [];
        this.NoiseSynthesizer = [];
        this.NoiseSynthParams = [];
        this.duoSynthesizer = [];
        this.duoSynthParams = [];
        this.activeParams = [
            "synth",
            "amsynth",
            "fmsynth",
            "noisesynth",
            "duosynth",
            "envelope",
            "oscillator",
            "filter",
            "effects",
            "chorus",
            "vibrato",
            "phaser",
            "distortion",
            "tremolo"
        ];
        this.isActive = {};

        for (let i = 0; i < this.activeParams.length; i++) {
            this.isActive[this.activeParams[i]] = false;
        }

        this._undoStack = [];

        this.blockNo = null; // index no. of the timbre widget block
        this.instrumentName = "custom";
        this.lastSelectedEffect = null;
        this.lastSelectedSynth = null;

        if (!(this.instrumentName in instrumentsFilters[0])) {
            instrumentsFilters[0][this.instrumentName] = [];
        }

        if (!(this.instrumentName in instrumentsEffects[0])) {
            instrumentsEffects[0][this.instrumentName] = [];
        }

        this.timbreTableDiv = document.createElement("div");
    }

    /**
     * Initialises the timbre widget.
     * @returns {void}
     */
    init(activity) {
        const widgetWindow = this._createWidgetWindow(activity);
        this._createToolbarButtons(activity, widgetWindow);
    }

    /**
     * @private
     * Creates and configures the timbre widget window.
     * @param {Object} activity
     * @returns {Object} the created widgetWindow.
     */
    _createWidgetWindow(activity) {
        this.activity = activity;
        this._delta = 0;

        this._playing = false;
        this._undoStack = [];

        const widgetWindow = window.widgetWindows.windowFor(this, "timbre", "timbre", true);
        announceToScreenReader(_("Timbre Widget opened"));
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        const w = window.innerWidth;
        this._cellScale = w / 1200;

        widgetWindow.getWidgetBody().append(this.timbreTableDiv);
        widgetWindow.getWidgetBody().style.height = "500px";
        widgetWindow.getWidgetBody().style.width = "600px";
        widgetWindow.getWidgetBody().style.overflowY = "auto";

        widgetWindow.onclose = () => {
            this._playing = false;
            this._clearWidgetTimers();
            // Clean up all event listeners
            this._cleanupEventListeners();
            this._undoStack = [];
            if (this.activity && this.activity.hideMsgs) {
                this.activity.hideMsgs();
            }
            announceToScreenReader(_("Timbre Widget closed"));
            widgetWindow.destroy();
        };

        return widgetWindow;
    }

    /**
     * @private
     * Creates the toolbar buttons and wires their onclick handlers.
     * @param {Object} activity
     * @param {Object} widgetWindow
     * @returns {void}
     */
    _createToolbarButtons(activity, widgetWindow) {
        this.playButton = widgetWindow.addButton(
            "play-button.svg",
            TimbreWidget.ICONSIZE,
            _("Play")
        );

        this.playButton.onclick = () => {
            this._play();
        };

        widgetWindow.addButton("export-chunk.svg", TimbreWidget.ICONSIZE, _("Save")).onclick =
            () => {
                this._save();
            };

        let _unhighlightButtons; // defined later to avoid circular dependency

        const synthButtonCell = widgetWindow.addButton(
            "synth.svg",
            TimbreWidget.ICONSIZE,
            _("Synthesizer")
        );
        synthButtonCell.id = "synthButtonCell";
        this.isActive["synth"] = false;

        synthButtonCell.onclick = () => {
            _unhighlightButtons(synthButtonCell);
            this._setActiveExclusive("synth");

            if (this.osc.length === 0) {
                this._synth();
            } else {
                activity.errorMsg(_("Unable to use synth due to existing oscillator."), 3000);
            }
        };

        const oscillatorButtonCell = widgetWindow.addButton(
            "oscillator.svg",
            TimbreWidget.ICONSIZE,
            _("Oscillator")
        );
        oscillatorButtonCell.id = "oscillatorButtonCell";
        this.isActive["oscillator"] = false;

        oscillatorButtonCell.onclick = async () => {
            _unhighlightButtons(oscillatorButtonCell);
            this._setActiveExclusive("oscillator");

            if (this.osc.length === 0) {
                const targetBlock = this.activity.blocks.blockList[this.blockNo];
                if (!targetBlock) {
                    return;
                }
                const topOfClamp = targetBlock.connections[2];
                const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                const OSCILLATOROBJ = [
                    [0, ["oscillator", {}], 0, 0, [null, 2, 1, null]],
                    [1, ["number", { value: 6 }], 0, 0, [0]],
                    [2, ["oscillatortype", { value: DEFAULTOSCILLATORTYPE }], 0, 0, [0]]
                ];
                this.activity.blocks.loadNewBlocks(OSCILLATOROBJ);

                await delayExecution(100);
                const n = this.activity.blocks.blockList.length - 3;
                this.osc.push(n);
                this.oscParams.push(DEFAULTOSCILLATORTYPE);
                this.oscParams.push(6);

                await delayExecution(500);
                this.blockConnection(3, bottomOfClamp);

                this._oscillator(true);
            } else {
                this._oscillator(false);
            }

            if (
                this.osc.length !== 0 &&
                (this.AMSynthesizer.length !== 0 ||
                    this.FMSynthesizer.length !== 0 ||
                    this.duoSynthesizer.length !== 0)
            ) {
                this._oscillator(false);
            }
        };

        const envelopeButtonCell = widgetWindow.addButton(
            "envelope.svg",
            TimbreWidget.ICONSIZE,
            _("Envelope")
        );
        envelopeButtonCell.id = "envelopeButtonCell";
        this.isActive["envelope"] = false;

        envelopeButtonCell.onclick = async () => {
            _unhighlightButtons(envelopeButtonCell);
            this._setActiveExclusive("envelope");

            if (this.env.length === 0) {
                const targetBlock = this.activity.blocks.blockList[this.blockNo];
                if (!targetBlock) {
                    return;
                }
                const topOfClamp = targetBlock.connections[2];
                const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                const ENVOBJ = [
                    [0, ["envelope", {}], 0, 0, [null, 1, 2, 3, 4, null]],
                    [1, ["number", { value: 1 }], 0, 0, [0]],
                    [2, ["number", { value: 50 }], 0, 0, [0]],
                    [3, ["number", { value: 60 }], 0, 0, [0]],
                    [4, ["number", { value: 1 }], 0, 0, [0]]
                ];
                this.activity.blocks.loadNewBlocks(ENVOBJ);

                await delayExecution(100);
                const n = this.activity.blocks.blockList.length - 5;
                this.env.push(n);
                this.ENVs.push(1);
                this.ENVs.push(50);
                this.ENVs.push(60);
                this.ENVs.push(1);

                await delayExecution(500);
                this.blockConnection(5, bottomOfClamp);

                this._envelope(true); // create a new synth instrument
            } else {
                this._envelope(false);
            }
        };

        const effectsButtonCell = widgetWindow.addButton(
            "effects.svg",
            TimbreWidget.ICONSIZE,
            _("Effects")
        );
        effectsButtonCell.id = "effectsButtonCell";
        this.isActive["effects"] = false;

        effectsButtonCell.onclick = () => {
            _unhighlightButtons(effectsButtonCell);
            this._setActiveExclusive("effects");
            this._effects();
        };

        const filterButtonCell = widgetWindow.addButton(
            "filter.svg",
            TimbreWidget.ICONSIZE,
            _("Filter")
        );
        filterButtonCell.id = "filterButtonCell";
        this.isActive["filter"] = false;

        filterButtonCell.onclick = async () => {
            _unhighlightButtons(filterButtonCell);
            this._setActiveExclusive("filter");

            if (this.fil.length === 0) {
                const targetBlock = this.activity.blocks.blockList[this.blockNo];
                if (!targetBlock) {
                    return;
                }
                const topOfClamp = targetBlock.connections[2];
                const bottomOfClamp = this.activity.blocks.findBottomBlock(topOfClamp);

                const FILTEROBJ = [
                    [0, ["filter", {}], 0, 0, [null, 3, 1, 2, null]],
                    [1, ["number", { value: -12 }], 0, 0, [0]],
                    [2, ["number", { value: 392 }], 0, 0, [0]],
                    [3, ["filtertype", { value: DEFAULTFILTERTYPE }], 0, 0, [0]]
                ];
                this.activity.blocks.loadNewBlocks(FILTEROBJ);

                await delayExecution(100);
                const n = this.activity.blocks.blockList.length - 4;
                this.fil.push(n);
                this.filterParams.push(DEFAULTFILTERTYPE);
                this.filterParams.push(-12);
                this.filterParams.push(392);

                await delayExecution(500);
                this.blockConnection(4, bottomOfClamp);
            }

            this._filter();
        };

        const addFilterButtonCell = widgetWindow.addButton(
            "filter+.svg",
            TimbreWidget.ICONSIZE,
            _("Add filter")
        );
        addFilterButtonCell.style.backgroundColor = "#808080";

        addFilterButtonCell.onclick = () => {
            if (this.isActive["filter"]) {
                this._addFilter();
            }
        };

        addFilterButtonCell.onmouseover = () => {};

        addFilterButtonCell.onmouseout = () => {};

        widgetWindow.addButton("restore-button.svg", TimbreWidget.ICONSIZE, _("Undo")).onclick =
            () => {
                this._undo();
            };

        // cell.onclick = function () {
        //     docById('timbreDiv').style.visibility = 'hidden';
        //     docById('timbreButtonsDiv').style.visibility = 'hidden';
        //     docById('this.timbreTableDiv').style.visibility = 'hidden';
        //     docById('timbreName').classList.remove('hasKeyboard');
        //     this.activity.logo.hideMsgs();
        // };

        _unhighlightButtons = button => {
            addFilterButtonCell.style.backgroundColor = platformColor.widgetButton;
            synthButtonCell.style.backgroundColor = platformColor.widgetButton;
            oscillatorButtonCell.style.backgroundColor = platformColor.widgetButton;
            envelopeButtonCell.style.backgroundColor = platformColor.widgetButton;
            effectsButtonCell.style.backgroundColor = platformColor.widgetButton;
            filterButtonCell.style.backgroundColor = platformColor.widgetButton;
            button.style.backgroundColor = platformColor.widgetButtonSelect;
        };

        activity.textMsg(_("Click on buttons to open the timbre design tools."), 3000);
        widgetWindow.sendToCenter();
    }
}

if (typeof require !== "undefined") {
    if (typeof TimbreState === "undefined") {
        global.TimbreState = require("./TimbreState.js");
    }
    if (typeof TimbrePanels === "undefined") {
        global.TimbrePanels = require("./TimbrePanels.js");
    }
    if (typeof TimbreAudio === "undefined") {
        global.TimbreAudio = require("./TimbreAudio.js");
    }
    if (typeof TimbreBlocks === "undefined") {
        global.TimbreBlocks = require("./TimbreBlocks.js");
    }
}
TimbreWidget.installModules();

if (typeof window !== "undefined") {
    window.TimbreWidget = TimbreWidget;
}

if (typeof module !== "undefined") {
    module.exports = TimbreWidget;
}
