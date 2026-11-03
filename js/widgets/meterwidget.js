// Copyright (c) 2019-21 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global

   Singer, _, PREVIEWVOLUME, ManagedTimer, MeterWidgetWindow, MeterWidgetMeter,
   MeterWidgetPlayback, MeterWidgetWheel, MeterWidgetSave
*/

/*
     Globals location
     - js/utils/utils.js
         _

     - js/utils/ManagedTimer.js
         ManagedTimer

     - js/turtle-singer.js
         Singer

     - js/logo.js
         PREVIEWVOLUME

     - js/widgets/MeterWidgetWindow.js, MeterWidgetMeter.js, MeterWidgetPlayback.js,
       MeterWidgetWheel.js, MeterWidgetSave.js
         MeterWidgetWindow, MeterWidgetMeter, MeterWidgetPlayback, MeterWidgetWheel,
         MeterWidgetSave
*/

/**
 * MeterWidget class for creating and managing a pie menu meter for strong beats.
 *
 * @class
 * @classdesc Represents a MeterWidget that utilizes pie menu for strong beat selection.
 * @memberof global
 * @requires Singer
 * @requires _
 * @requires PREVIEWVOLUME
 * @exports MeterWidget
 */
class MeterWidget {
    /** AMD module dependencies for lazy loading. */
    static dependencies = [
        "widgets/MeterWidgetWindow",
        "widgets/MeterWidgetMeter",
        "widgets/MeterWidgetPlayback",
        "widgets/MeterWidgetWheel",
        "widgets/MeterWidgetSave",
        "widgets/meterwidget"
    ];

    // A pie menu is used to show the meter and strong beats
    /**
     * Width of the button div.
     *
     * @type {number}
     * @static
     */
    static BUTTONDIVWIDTH = 535;

    /**
     * Size of the button.
     *
     * @type {number}
     * @static
     */
    static BUTTONSIZE = 53;

    /**
     * Size of the icon.
     *
     * @type {number}
     * @static
     */
    static ICONSIZE = 32;

    /**
     * Whether installModules has copied the module methods onto the prototype.
     *
     * @type {boolean}
     * @static
     */
    static _modulesInstalled = false;

    /**
     * Copies the methods of the Meter widget modules (MeterWidgetWindow.js, MeterWidgetMeter.js,
     * MeterWidgetPlayback.js, MeterWidgetWheel.js and MeterWidgetSave.js) onto
     * MeterWidget.prototype, keeping their names and property descriptors, so they behave
     * exactly like methods declared in this class and `this` inside them is the widget.
     *
     * RequireJS loads the modules alongside this file in no fixed order, so this runs when the
     * file loads (if the modules are already defined) and again from the constructor, which
     * only runs once every dependency has loaded.
     *
     * @returns {boolean} Whether the methods are installed.
     */
    static installModules() {
        if (MeterWidget._modulesInstalled) {
            return true;
        }

        const modules = [
            typeof MeterWidgetWindow !== "undefined" ? MeterWidgetWindow : null,
            typeof MeterWidgetMeter !== "undefined" ? MeterWidgetMeter : null,
            typeof MeterWidgetPlayback !== "undefined" ? MeterWidgetPlayback : null,
            typeof MeterWidgetWheel !== "undefined" ? MeterWidgetWheel : null,
            typeof MeterWidgetSave !== "undefined" ? MeterWidgetSave : null
        ];
        if (modules.includes(null)) {
            return false;
        }

        for (const module of modules) {
            for (const name of Object.getOwnPropertyNames(module.prototype)) {
                if (name !== "constructor") {
                    Object.defineProperty(
                        MeterWidget.prototype,
                        name,
                        Object.getOwnPropertyDescriptor(module.prototype, name)
                    );
                }
            }
        }

        MeterWidget._modulesInstalled = true;
        return true;
    }

    /**
     * Creates an instance of MeterWidget.
     *
     * @param {object} activity - The activity object.
     * @param {number} widgetBlock - The widget block number.
     * @param {number} [turtle] - The turtle that ran the Meter widget block.
     */
    constructor(activity, widgetBlock, turtle) {
        MeterWidget.installModules();

        /**
         * The activity object.
         *
         * @type {object}
         */
        this.activity = activity;

        /**
         * The turtle that ran the Meter widget block, whose tempo the beats are played at. The
         * turtle itself rather than its index, which shifts when a turtle is removed.
         *
         * @type {object|null}
         * @private
         */
        this._turtle = turtle !== undefined ? this.activity.turtles.ithTurtle(turtle) : null;

        /**
         * The meter block.
         *
         * @type {number}
         * @private
         */
        this._meterBlock = this.activity.logo._meterBlock;

        /**
         * Array to store strong beats.
         *
         * @type {Array}
         * @private
         */
        this._strongBeats = [];

        /**
         * Flag indicating if the widget is currently playing.
         *
         * @type {boolean}
         * @private
         */
        this._playing = false;

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
        this._playBeatTimeout = null;

        /**
         * Flag indicating if the widget is locked for clicks.
         *
         * @type {boolean}
         * @private
         */
        this._click_lock = false;

        /**
         * The beat value.
         *
         * @type {number}
         * @private
         */
        this._beatValue = 1 / 4;

        /**
         * The cell scale.
         *
         * @type {number}
         * @private
         */
        const w = window.innerWidth;
        this._cellScale = w / 1200;

        /**
         * The Meter widget block, which Reset runs again.
         *
         * @type {number}
         * @private
         */
        this._widgetBlock = widgetBlock;

        // Running the block again while the widget is open takes over its window: the window is
        // cleared and its close handler replaced, so the widget it replaces would keep playing.
        const previous = this.activity.logo.meterWidget;
        if (previous && previous !== this && typeof previous._stopPlayback === "function") {
            previous._stopPlayback();
        }

        /**
         * The widget window.
         *
         * @type {object}
         */
        const widgetWindow = window.widgetWindows.windowFor(this, "meter");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();

        this.activity.logo.synth.setMasterVolume(PREVIEWVOLUME);
        this.activity.logo.synth.loadSynth(0, "kick drum");
        Singer.setSynthVolume(this.activity.logo, 0, "kick drum", PREVIEWVOLUME);
        this.activity.logo.synth.loadSynth(0, "snare drum");
        Singer.setSynthVolume(this.activity.logo, 0, "snare drum", PREVIEWVOLUME);

        // For the button callbacks
        this.meterDiv = document.createElement("table");
        widgetWindow.getWidgetBody().append(this.meterDiv);

        widgetWindow.onclose = () => this._close();

        /**
         * Callback for the widget window maximize event.
         *
         * @private
         */
        widgetWindow.onmaximize = this._scale;

        this._click_lock = false;
        this._makePlayButton();

        widgetWindow.addButton("export-chunk.svg", MeterWidget.ICONSIZE, _("Save")).onclick =
            () => {
                this._save();
            };

        // The pie menu goes here.
        const meterTableDiv = this.meterDiv;
        meterTableDiv.style.display = "inline";
        meterTableDiv.style.visibility = "visible";
        meterTableDiv.style.border = "0px";
        meterTableDiv.textContent = "";
        const meterWheelDiv = document.createElement("div");
        meterWheelDiv.id = "meterWheelDiv";
        meterTableDiv.appendChild(meterWheelDiv);

        // Grab the number of beats and beat value from the meter block.
        const meter = this._readMeterBlock();
        this._piemenuMeter(meter.beats !== undefined ? meter.beats : 4, this._beatValue);

        this._makeInputs(meter);

        //TRANS.: Reset the widget layout
        widgetWindow.addButton("reload.svg", MeterWidget.ICONSIZE, _("Reset")).onclick = () => {
            this._reset(meter);
        };

        activity.textMsg(_("Click in the circle to select strong beats for the meter."), 3000);
        widgetWindow.sendToCenter();
        this._scale.call(this.widgetWindow);
    }
}

MeterWidget.installModules();

if (typeof module !== "undefined") {
    module.exports = MeterWidget;
}
