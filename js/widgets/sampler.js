// Copyright (c) 2021 Liam Norman
// Copyright (c) 2025 Anvita Prasad DMP'25
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

   DOUBLEFLAT, FLAT, NATURAL, SHARP, DOUBLESHARP, getVoiceSynthName, ManagedTimer,
   SamplerBlocks, SamplerPlayback, SamplerPitch, SamplerFiles, SamplerUI, SamplerPieMenu,
   SamplerCanvas, SamplerTuner
*/

/* exported SampleWidget, resolveBackendURL */
/** AMD module dependencies for lazy loading. */
SampleWidget.dependencies = [
    "widgets/tuner",
    "widgets/SamplerBlocks",
    "widgets/SamplerPlayback",
    "widgets/SamplerPitch",
    "widgets/SamplerFiles",
    "widgets/SamplerUI",
    "widgets/SamplerPieMenu",
    "widgets/SamplerCanvas",
    "widgets/SamplerTuner",
    "widgets/sampler"
];

/**
 * Resolves the AI backend service URL based on global configuration or query parameter overrides.
 * @param {Location} [loc] Optional location object for testability.
 * @returns {string}
 */
function resolveBackendURL(loc) {
    if (
        typeof window !== "undefined" &&
        typeof window.AI_SAMPLE_ENDPOINT === "string" &&
        window.AI_SAMPLE_ENDPOINT.trim()
    ) {
        return window.AI_SAMPLE_ENDPOINT.trim().replace(/\/+$/, "");
    }

    try {
        const location =
            loc !== undefined ? loc : typeof window !== "undefined" ? window.location : null;
        if (!location) {
            return "";
        }

        const search = location.search || "";
        const params = new URLSearchParams(search);
        if (params.has("backend")) {
            return params.get("backend").replace(/\/+$/, "");
        }
        if (params.has("backend_url")) {
            return params.get("backend_url").replace(/\/+$/, "");
        }

        return "";
    } catch (e) {
        return "";
    }
}

/**
 * Represents a Sample Widget.
 * @constructor
 */
function SampleWidget() {
    const ICONSIZE = 32;
    const SAMPLEWIDTH = 800;
    const SAMPLEHEIGHT = 400;
    // Don't include natural when construcing the note name...
    const EXPORTACCIDENTALNAMES = [DOUBLEFLAT, FLAT, "", SHARP, DOUBLESHARP];
    // ...but display it in the selector.
    const ACCIDENTALNAMES = [DOUBLEFLAT, FLAT, NATURAL, SHARP, DOUBLESHARP];
    const SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti", "do"];
    const PITCHNAMES = ["C", "D", "E", "F", "G", "A", "B"];
    const MAJORSCALE = [0, 2, 4, 5, 7, 9, 11];
    const REFERENCESAMPLE = "electronic synth";
    const DEFAULTSAMPLE = "electronic synth";
    const CENTERPITCHHERTZ = 220;
    const SAMPLEWAITTIME = 500;

    // Oscilloscope constants
    const SAMPLEANALYSERSIZE = 8192;
    const SAMPLEOSCCOLORS = ["#3030FF", "#FF3050"];

    /**
     * Reference to the timbre block.
     * @type {number | null}
     */
    this.timbreBlock;

    /**
     * Array to store sample-related data.
     * @type {Array}
     */
    this.sampleArray;

    /**
     * String representing sample data.
     * @type {string}
     */
    this.sampleData = "";

    /**
     * Name of the sample.
     * @type {string}
     */
    this.sampleName = DEFAULTSAMPLE;

    /**
     * Pitch of the sample.
     * @type {string}
     */
    this.samplePitch = "sol";

    /**
     * Octave of the sample.
     * @type {string}
     */
    this.sampleOctave = "4";

    /**
     * Pitch center.
     * @type {number}
     */
    this.pitchCenter = 9;

    /**
     * Accidental center.
     * @type {number}
     */
    this.accidentalCenter = 2;

    /**
     * Octave center.
     * @type {number}
     */
    this.octaveCenter = 4;

    /**
     * Sample length.
     * @type {number}
     */
    this.sampleLength = 1000;

    /**
     * Pitch analyzers.
     * @type {object}
     */
    this.pitchAnalysers = {};

    // Add tuner related properties
    this.tunerEnabled = false;
    this.tunerAnalyser = null;
    this.tunerMic = null;
    this.tunerCanvas = null;
    this.tunerContext = null;
    this.tunerAnimationFrame = null;
    this.tunerSegments = [];
    this.centsValue = 0;
    this.sliderVisible = false;
    this.sliderDiv = null;

    // Manual cent adjustment properties
    this.centAdjustmentWindow = null;
    this.centAdjustmentVisible = false;
    this.centAdjustmentSlider = null;
    this.centAdjustmentValue = 0;
    this.centAdjustmentOn = false;
    this.currentNoteObj = null;
    this.player = null;

    // Pitch detection resource tracking (to prevent memory leaks)
    this.pitchDetectionAudioContext = null;
    this.pitchDetectionStream = null;
    this.pitchDetectionAnimationId = null;
    this.isPitchDetectionRunning = false;

    /**
     * Tracks timers owned by this widget so they can be cancelled when the widget closes.
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

    /**
     * Fallback interval tracking for test/runtime environments where ManagedTimer is unavailable.
     * @type {Set<number>}
     * @private
     */
    this._activeIntervals = new Set();

    /**
     * Interval ID for blinking status message during prompt generation.
     * @type {number|null}
     * @private
     */
    this._promptBlinkInterval = null;

    /**
     * Timeout ID for debouncing the save sample button.
     * @type {number|null}
     * @private
     */
    this._saveTimeout = null;

    /**
     * Timeout ID for debouncing tuner mode toggle.
     * @type {number|null}
     * @private
     */
    this._tunerModeTimeout = null;

    /**
     * Timeout ID for restarting reference pitch after cent adjustment.
     * @type {number|null}
     * @private
     */
    this._restartPitchTimeout = null;

    /**
     * Timeout ID for the _waitAndPlaySample delay.
     * Cleared in pause() so a stale timer cannot fire during a subsequent play.
     * @type {number|null}
     * @private
     */
    this._playbackWaitTimeout = null;

    /**
     * Timeout ID for the _waitAndEndPlaying delay.
     * Cleared in pause() so a stale end-of-play timer cannot call pause() again.
     * @type {number|null}
     * @private
     */
    this._endPlayingTimeout = null;

    /**
     * Schedules a timeout owned by the widget lifecycle.
     * @private
     * @param {Function} callback - Callback to run after the delay.
     * @param {number} delay - Delay in milliseconds.
     * @returns {number} Timer ID.
     */
    this._setWidgetTimeout = function (callback, delay) {
        if (this._timerManager !== null) {
            return this._timerManager.setTimeout(callback, delay);
        }

        let id;
        id = setTimeout(() => {
            this._activeTimeouts.delete(id);
            callback();
        }, delay);
        this._activeTimeouts.add(id);
        return id;
    };

    /**
     * Clears a timeout owned by the widget lifecycle.
     * @private
     * @param {number} id - Timer ID returned by _setWidgetTimeout.
     * @returns {boolean} Whether the timeout was tracked and cleared.
     */
    this._clearWidgetTimeout = function (id) {
        if (id === null || id === undefined) {
            return false;
        }

        if (this._timerManager !== null && this._timerManager.clearTimeout(id)) {
            return true;
        }

        if (this._activeTimeouts.has(id)) {
            clearTimeout(id);
            this._activeTimeouts.delete(id);
            return true;
        }

        return false;
    };

    /**
     * Schedules an interval owned by the widget lifecycle.
     * @private
     * @param {Function} callback - Callback to run repeatedly.
     * @param {number} interval - Interval in milliseconds.
     * @returns {number} Interval ID.
     */
    this._setWidgetInterval = function (callback, interval) {
        if (this._timerManager !== null) {
            return this._timerManager.setInterval(callback, interval);
        }

        const id = setInterval(callback, interval);
        this._activeIntervals.add(id);
        return id;
    };

    /**
     * Clears an interval owned by the widget lifecycle.
     * @private
     * @param {number} id - Interval ID returned by _setWidgetInterval.
     * @returns {boolean} Whether the interval was tracked and cleared.
     */
    this._clearWidgetInterval = function (id) {
        if (id === null || id === undefined) {
            return false;
        }

        if (this._timerManager !== null && this._timerManager.clearInterval(id)) {
            return true;
        }

        if (this._activeIntervals.has(id)) {
            clearInterval(id);
            this._activeIntervals.delete(id);
            return true;
        }

        return false;
    };

    /**
     * Clears all timers owned by the widget lifecycle.
     * @private
     * @returns {number} Number of tracked timers and intervals cleared.
     */
    this._clearWidgetTimers = function () {
        let count = 0;

        if (this._timerManager !== null) {
            count += this._timerManager.clearAll();
        }

        for (const id of this._activeTimeouts) {
            clearTimeout(id);
            count++;
        }
        this._activeTimeouts.clear();

        for (const id of this._activeIntervals) {
            clearInterval(id);
            count++;
        }
        this._activeIntervals.clear();

        this._promptBlinkInterval = null;
        this._saveTimeout = null;
        this._tunerModeTimeout = null;
        this._restartPitchTimeout = null;
        this._playbackWaitTimeout = null;
        this._endPlayingTimeout = null;

        return count;
    };

    // The widget's methods live in these modules, which add them to this instance.
    SamplerBlocks.install.call(this);
    SamplerPlayback.install.call(this, {
        ICONSIZE,
        MAJORSCALE,
        REFERENCESAMPLE,
        CENTERPITCHHERTZ,
        SAMPLEWAITTIME,
        SAMPLEANALYSERSIZE
    });
    SamplerPitch.install.call(this, {
        EXPORTACCIDENTALNAMES,
        ACCIDENTALNAMES,
        SOLFEGENAMES,
        PITCHNAMES,
        MAJORSCALE
    });
    SamplerFiles.install.call(this);
    SamplerUI.install.call(this, { ICONSIZE, SAMPLEWIDTH, SAMPLEHEIGHT });
    SamplerPieMenu.install.call(this);
    SamplerCanvas.install.call(this, {
        SAMPLEWIDTH,
        SAMPLEHEIGHT,
        EXPORTACCIDENTALNAMES,
        SOLFEGENAMES,
        SAMPLEOSCCOLORS
    });
    SamplerTuner.install.call(this);
}

// Add smoothing for pitch detection
class PitchSmoother {
    constructor(smoothingSize = 5) {
        this.pitchHistory = [];
        this.smoothingSize = smoothingSize;
    }

    addPitch(pitch) {
        if (pitch > 0) {
            this.pitchHistory.push(pitch);
            if (this.pitchHistory.length > this.smoothingSize) {
                this.pitchHistory.shift();
            }
        }
    }

    getSmoothedPitch() {
        if (this.pitchHistory.length === 0) return -1;

        // Remove outliers
        const sorted = [...this.pitchHistory].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length / 4)];
        const q3 = sorted[Math.floor((3 * sorted.length) / 4)];
        const iqr = q3 - q1;
        const validPitches = this.pitchHistory.filter(
            p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr
        );

        if (validPitches.length === 0) return -1;
        return validPitches.reduce((a, b) => a + b) / validPitches.length;
    }

    reset() {
        this.pitchHistory = [];
    }
}

if (typeof module !== "undefined") {
    module.exports = { SampleWidget, PitchSmoother, resolveBackendURL };
}
