// Copyright (c) 2016-2021 Walter Bender
// Copyright (c) 2016 Hemant Kasat
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget enable us to create new pitches with help of a initial
// pitch value by applying music ratios.

/*
   global

   _, ManagedTimer, PitchStaircaseTimers, PitchStaircaseLayout, PitchStaircaseSteps,
   PitchStaircasePlayback, PitchStaircaseSave, PitchStaircaseWindow
 */

/*
   Global locations
    - js/utils/utils.js
        _
    - js/utils/ManagedTimer.js
        ManagedTimer
    - js/widgets/PitchStaircaseTimers.js, PitchStaircaseLayout.js, PitchStaircaseSteps.js,
      PitchStaircasePlayback.js, PitchStaircaseSave.js, PitchStaircaseWindow.js
        PitchStaircaseTimers, PitchStaircaseLayout, PitchStaircaseSteps, PitchStaircasePlayback,
        PitchStaircaseSave, PitchStaircaseWindow
*/
/* exported PitchStaircase */

class PitchStaircase {
    /** AMD module dependencies for lazy loading. */
    static dependencies = [
        "widgets/PitchStaircaseTimers",
        "widgets/PitchStaircaseLayout",
        "widgets/PitchStaircaseSteps",
        "widgets/PitchStaircasePlayback",
        "widgets/PitchStaircaseSave",
        "widgets/PitchStaircaseWindow",
        "widgets/pitchstaircase"
    ];

    static BUTTONDIVWIDTH = 476; // 8 buttons 476 = (55 + 4) * 8
    static OUTERWINDOWWIDTH = 685;
    static INNERWINDOWWIDTH = 600;
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;
    static DEFAULTFREQUENCY = 220.0;
    static MIN_FREQUENCY = 27.5; // A0
    static MAX_FREQUENCY = 16744.04; // C10

    /**
     * Whether installModules has copied the module methods onto the prototype.
     * @type {boolean}
     */
    static _modulesInstalled = false;

    /**
     * Copies the methods of the Pitch Staircase modules (PitchStaircaseTimers.js,
     * PitchStaircaseLayout.js, PitchStaircaseSteps.js, PitchStaircasePlayback.js,
     * PitchStaircaseSave.js and PitchStaircaseWindow.js) onto PitchStaircase.prototype,
     * keeping their names and property descriptors, so they behave exactly like
     * methods declared in this class and `this` inside them is the widget.
     *
     * RequireJS loads the modules alongside this file in no fixed order, so this
     * runs when the file loads (if the modules are already defined) and again from
     * the constructor, which only runs once every dependency has loaded.
     * @returns {boolean} Whether the methods are installed.
     */
    static installModules() {
        if (PitchStaircase._modulesInstalled) {
            return true;
        }

        const modules = [
            typeof PitchStaircaseTimers !== "undefined" ? PitchStaircaseTimers : null,
            typeof PitchStaircaseLayout !== "undefined" ? PitchStaircaseLayout : null,
            typeof PitchStaircaseSteps !== "undefined" ? PitchStaircaseSteps : null,
            typeof PitchStaircasePlayback !== "undefined" ? PitchStaircasePlayback : null,
            typeof PitchStaircaseSave !== "undefined" ? PitchStaircaseSave : null,
            typeof PitchStaircaseWindow !== "undefined" ? PitchStaircaseWindow : null
        ];
        if (modules.includes(null)) {
            return false;
        }

        for (const module of modules) {
            for (const name of Object.getOwnPropertyNames(module.prototype)) {
                if (name !== "constructor") {
                    Object.defineProperty(
                        PitchStaircase.prototype,
                        name,
                        Object.getOwnPropertyDescriptor(module.prototype, name)
                    );
                }
            }
        }

        PitchStaircase._modulesInstalled = true;
        return true;
    }

    /**
     * @constructor
     */
    constructor() {
        PitchStaircase.installModules();

        this.Stairs = [];
        this.stairPitchBlocks = [];
        this._stepTables = [];
        this._musicRatio1 = null;
        this._musicRatio2 = null;
        this._playingRowIndex = null;
        this._rowStopTimeout = null;
        this._isPlayingAll = false;
        this._playAllTimeout = null;
        this._isPlayingScale = false;
        this._scaleStopped = false;
        this._scaleStepTimeout = null;
        this._scaleHighlightTimeout = null;
        if (typeof ManagedTimer !== "undefined") {
            this._timerManager = new ManagedTimer();
        } else if (typeof require !== "undefined") {
            try {
                const ManagedTimerCtor = require("../utils/ManagedTimer");
                this._timerManager = new ManagedTimerCtor();
            } catch (e) {
                this._timerManager = null;
            }
        } else {
            this._timerManager = null;
        }
    }

    /**
     * Opens the widget, or rebuilds the stairs if it is already open.
     * @param {Activity} activity - The activity.
     * @returns {void}
     */
    init(activity) {
        this.activity = activity;

        for (let i = 0; i < this.Stairs.length; i++) {
            if (this.Stairs[i].length === 7) {
                this.Stairs[i].push(this.Stairs[i][2]); // initial frequency
                this.Stairs[i].push(this.Stairs[i][2]); // parent frequency
            }
        }

        // this._initialFrequency = this.Stairs[0][2];
        this._history = [];

        const w = window.innerWidth;
        this._cellScale = w / 1200;

        if (
            window.widgetWindows &&
            window.widgetWindows.openWindows &&
            window.widgetWindows.openWindows["pitch staircase"]
        ) {
            // Previously this branch just returned, meaning any block value
            // feeding this widget could change (via reInitWidget()) while
            // the widget was open, without the visible stairs table ever
            // reflecting it. this._refresh() (which calls
            // this._makeStairs(true)) rebuilds the table from the current
            // this.Stairs data without recreating the widgetWindow/buttons,
            // so it can't reintroduce an #8234-style duplicate-buttons bug.
            // Reported by @walterbender: "Changing the value in the
            // pitchstaircase pitch still seems to break the open pitch
            // staircase."
            this._refresh();
            return;
        }

        const widgetWindow = this._openWindow();
        this._addToolbar(widgetWindow);

        // The pitch-staircase (psc) table
        this._pscTable = document.createElement("table");
        widgetWindow.getWidgetBody().append(this._pscTable);
        this._refresh();

        activity.textMsg(_("Click on a note to create a new step."), 3000);

        widgetWindow.onmaximize = () => {
            this._onMaximize(widgetWindow);
        };
    }
}
PitchStaircase.installModules();

if (typeof module !== "undefined") {
    module.exports = PitchStaircase;
}
