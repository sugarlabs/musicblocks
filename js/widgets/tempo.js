// Copyright (c) 2016-21 Walter Bender
// Copyright (c) 2016 Hemant Kasat
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget enable us to manipulate the beats per minute. It
// behaves like a metronome and updates the master BPM block.

/*
   global
   _, getDrumSynthName, TempoWindow, TempoRows, TempoKeyboard, TempoTap, TempoControls,
   TempoMetronome, TempoSave
 */

/*
   Global locations
    js/utils/musicutils.js
        getDrumSynthName
    js/utils/utils.js
        _
    js/widgets/TempoWindow.js, TempoRows.js, TempoKeyboard.js, TempoTap.js, TempoControls.js,
      TempoMetronome.js, TempoSave.js
        TempoWindow, TempoRows, TempoKeyboard, TempoTap, TempoControls, TempoMetronome, TempoSave
*/

/* exported Tempo */
class Tempo {
    /** AMD module dependencies for lazy loading. */
    static dependencies = [
        "widgets/TempoWindow",
        "widgets/TempoRows",
        "widgets/TempoKeyboard",
        "widgets/TempoTap",
        "widgets/TempoControls",
        "widgets/TempoMetronome",
        "widgets/TempoSave",
        "widgets/tempo"
    ];

    static TEMPOSYNTH = "bottle";
    static TEMPOINTERVAL = 5;
    static BUTTONDIVWIDTH = 476; // 8 buttons 476 = (55 + 4) * 8
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;
    static TEMPOWIDTH = 700;
    static TEMPOHEIGHT = 100;
    static YRADIUS = 75;

    /**
     * Whether installModules has copied the module methods onto the prototype.
     * @type {boolean}
     */
    static _modulesInstalled = false;

    /**
     * Copies the methods of the Tempo modules (TempoWindow.js, TempoRows.js, TempoKeyboard.js,
     * TempoTap.js, TempoControls.js, TempoMetronome.js and TempoSave.js) onto Tempo.prototype,
     * keeping their names and property descriptors, so they behave exactly like methods
     * declared in this class and `this` inside them is the widget.
     *
     * RequireJS loads the modules alongside this file in no fixed order, so this runs when the
     * file loads (if the modules are already defined) and again from the constructor, which
     * only runs once every dependency has loaded.
     * @returns {boolean} Whether the methods are installed.
     */
    static installModules() {
        if (Tempo._modulesInstalled) {
            return true;
        }

        const modules = [
            typeof TempoWindow !== "undefined" ? TempoWindow : null,
            typeof TempoRows !== "undefined" ? TempoRows : null,
            typeof TempoKeyboard !== "undefined" ? TempoKeyboard : null,
            typeof TempoTap !== "undefined" ? TempoTap : null,
            typeof TempoControls !== "undefined" ? TempoControls : null,
            typeof TempoMetronome !== "undefined" ? TempoMetronome : null,
            typeof TempoSave !== "undefined" ? TempoSave : null
        ];
        if (modules.includes(null)) {
            return false;
        }

        for (const module of modules) {
            for (const name of Object.getOwnPropertyNames(module.prototype)) {
                if (name !== "constructor") {
                    Object.defineProperty(
                        Tempo.prototype,
                        name,
                        Object.getOwnPropertyDescriptor(module.prototype, name)
                    );
                }
            }
        }

        Tempo._modulesInstalled = true;
        return true;
    }

    constructor() {
        Tempo.installModules();

        this._xradius = Tempo.YRADIUS / 3;
        this.BPMs = [];
        this.BPMInputs = [];
        this.BPMBlocks = [];
        // The turtle that ran each BPM block, so a set BPM row changes only that turtle's tempo.
        // The turtle itself rather than its index, which shifts when a turtle is removed.
        this.BPMTurtles = [];
        this.tempoCanvases = [];
        this.activeBPMIndex = 0;
        this._keyHandler = null;
        this.pauseBtn = null;
        this.tapBtn = null;
        this._tapTimes = [];
        this._tapTimeout = null;
        this._tapButtonTimeout = null;
        this._lastTapIndex = null;
        this._lastCanvasIndex = null;
    }

    init(activity) {
        this.activity = activity;
        this._directions = [];
        this._widgetFirstTimes = [];
        this._widgetNextTimes = [];
        this._firstClickTime = null;
        this._intervals = [];
        this._tapTimes = [];
        this._lastTapIndex = null;
        this._lastCanvasIndex = null;
        if (this._tapTimeout) {
            if (this.widgetWindow && this.widgetWindow.timerManager) {
                this.widgetWindow.timerManager.clearTimeout(this._tapTimeout);
            } else {
                clearTimeout(this._tapTimeout);
            }
            this._tapTimeout = null;
        }
        if (this._tapButtonTimeout) {
            if (this.widgetWindow && this.widgetWindow.timerManager) {
                this.widgetWindow.timerManager.clearTimeout(this._tapButtonTimeout);
            } else {
                clearTimeout(this._tapButtonTimeout);
            }
            this._tapButtonTimeout = null;
        }
        this.isMoving = true;
        if (this._intervalID !== undefined && this._intervalID !== null) {
            if (this.widgetWindow && this.widgetWindow.timerManager) {
                this.widgetWindow.timerManager.clearInterval(this._intervalID);
            } else {
                clearInterval(this._intervalID);
            }
        }

        this._intervalID = null;
        this.activity.logo.synth.loadSynth(0, getDrumSynthName(Tempo.TEMPOSYNTH));

        this._removeKeyHandler();
        const widgetWindow = window.widgetWindows.windowFor(this, "tempo", "tempo", true);
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        if (typeof widgetWindow.takeFocus === "function") {
            widgetWindow.takeFocus();
        }

        widgetWindow.onclose = () => this._closeWindow(widgetWindow);

        this._addToolbar(widgetWindow);

        this.bodyTable = document.createElement("table");
        this.widgetWindow.getWidgetBody().appendChild(this.bodyTable);

        this._makeRows(widgetWindow);

        this._addKeyHandler(widgetWindow);

        this.activity.textMsg(_("Adjust the tempo with the buttons."), 3000);
        this.resume();

        widgetWindow.sendToCenter();
    }
}

Tempo.installModules();

if (typeof module !== "undefined") {
    module.exports = Tempo;
}
