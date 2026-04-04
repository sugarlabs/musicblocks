// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * @file performanceTracker.js
 * @description Developer-only performance instrumentation for Music Blocks.
 *
 * This module provides lightweight, non-invasive performance tracking
 * that measures execution time, memory usage delta, and maximum
 * execution depth during a program run.
 *
 * Instrumentation is disabled by default. Enable via:
 *   - URL parameter: ?performance=true
 *   - Global flag:   window.DEBUG_PERFORMANCE = true
 *
 * No UI changes. Console output only.
 */

/*
   exported

   performanceTracker
 */

// ============================================================================
// Internal state — not exposed as globals
// ============================================================================

/** @type {number|null} Timestamp when tracking started */
let _startTime = null;

/** @type {number|null} Timestamp when tracking ended */
let _endTime = null;

/** @type {number|null} Computed execution time in ms */
let _executionTime = null;

/** @type {number|null} Heap size at start (bytes), or null if unsupported */
let _memoryStart = null;

/** @type {number|null} Heap size at end (bytes), or null if unsupported */
let _memoryEnd = null;

/** @type {number|null} Memory delta (bytes), or null if unsupported */
let _memoryDelta = null;

/** @type {number} Maximum recursion / scope depth reached */
let _maxDepth = 0;

/** @type {number} Current recursion / scope depth */
let _currentDepth = 0;

/** @type {boolean} Whether instrumentation is currently enabled */
var _enabled = false;

// ============================================================================
// Timing helpers — prefer high-resolution timer with fallback
// ============================================================================

/**
 * Returns the current time using the highest-resolution timer available.
 * @returns {number} Current time in milliseconds.
 */
function _now() {
    // performance.now() provides sub-millisecond precision
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
        return performance.now();
    }
    // Fallback for environments without Performance API
    return Date.now();
}

// ============================================================================
// Memory helpers — gracefully degrade when unsupported
// ============================================================================

/**
 * Returns the current JS heap size in bytes, or null if the browser
 * does not expose performance.memory (Chrome/Edge only).
 * @returns {number|null}
 */
function _getHeapSize() {
    try {
        if (
            typeof performance !== "undefined" &&
            performance.memory &&
            typeof performance.memory.usedJSHeapSize === "number"
        ) {
            return performance.memory.usedJSHeapSize;
        }
    } catch (e) {
        // Silently ignore — memory tracking is best-effort
    }
    return null;
}

// ============================================================================
// Public API — Detection
// ============================================================================

/**
 * Checks whether performance instrumentation is enabled.
 *
 * Enabled when either:
 *   1) The URL contains the query parameter  ?performance=true
 *   2) The global flag  window.DEBUG_PERFORMANCE === true
 *
 * @returns {boolean} True if performance mode is active.
 */

function isPerformanceModeEnabled() {
    // Check global flag first (fastest path)
    if (typeof window !== "undefined" && window.DEBUG_PERFORMANCE === true) {
        return true;
    }

    // Check URL query parameter
    try {
        if (typeof window !== "undefined" && window.location && window.location.search) {
            var params = new URLSearchParams(window.location.search);
            return params.get("performance") === "true";
        }
    } catch (e) {
        // URLSearchParams may not exist in very old browsers — fail silently
    }

    return false;
}

// ============================================================================
// Public API — Tracking lifecycle
// ============================================================================

/**
 * Begins a new performance measurement session.
 * Captures start time and initial memory snapshot.
 * Resets depth counters for a clean measurement.
 */

function startPerformanceTracking() {
    // Reset all state for a fresh run
    _startTime = _now();
    _endTime = null;
    _executionTime = null;
    _memoryStart = _getHeapSize();
    _memoryEnd = null;
    _memoryDelta = null;
    _maxDepth = 0;
    _currentDepth = 0;
}

/**
 * Ends the current performance measurement session.
 * Captures end time, computes execution duration, and memory delta.
 */

function endPerformanceTracking() {
    _endTime = _now();
    _executionTime = _endTime - _startTime;

    // Capture memory snapshot at end of run
    _memoryEnd = _getHeapSize();

    // Compute memory delta if both snapshots are available
    if (_memoryStart !== null && _memoryEnd !== null) {
        _memoryDelta = _memoryEnd - _memoryStart;
    } else {
        _memoryDelta = null;
    }
}

/**
 * Returns a snapshot of the current performance statistics.
 *
 * @returns {Object} Stats object with executionTime, memoryDelta, and maxDepth.
 */

function getPerformanceStats() {
    return {
        executionTime: _executionTime,
        memoryDelta: _memoryDelta,
        maxDepth: _maxDepth
    };
}

/**
 * Resets all internal tracking state to initial values.
 * Call this before starting a new measurement if needed.
 */

function resetPerformanceStats() {
    _startTime = null;
    _endTime = null;
    _executionTime = null;
    _memoryStart = null;
    _memoryEnd = null;
    _memoryDelta = null;
    _maxDepth = 0;
    _currentDepth = 0;
}

// ============================================================================
// Public API — Depth tracking helpers
// ============================================================================

/**
 * Called when entering a new execution scope (e.g., runFromBlockNow).
 * Increments current depth and updates max depth if a new peak is reached.
 *
 * This is a lightweight counter — it does NOT modify the interpreter's
 * recursion model or call stack.
 */

function enterExecutionScope() {
    _currentDepth++;
    if (_currentDepth > _maxDepth) {
        _maxDepth = _currentDepth;
    }
}

/**
 * Called when exiting an execution scope.
 * Decrements current depth safely (never goes below zero).
 */

function exitExecutionScope() {
    if (_currentDepth > 0) {
        _currentDepth--;
    }
}

// ============================================================================
// Console output — formatted stats display
// ============================================================================

/**
 * Logs performance statistics to the console in a collapsible group.
 * Uses console.groupCollapsed if available for a cleaner devtools experience.
 * @private
 */
function _logPerformanceStats() {
    var groupLabel = "🎵 Music Blocks Performance Stats";

    // Use groupCollapsed for a tidy console; fall back to group or plain log
    if (typeof console.groupCollapsed === "function") {
        console.groupCollapsed(groupLabel);
    } else if (typeof console.group === "function") {
        console.group(groupLabel);
    } else {
        console.log(groupLabel);
    }

    // Execution time
    console.log(
        "⏱  Execution Time: " +
            (_executionTime !== null ? _executionTime.toFixed(2) + " ms" : "N/A")
    );

    // Memory delta
    var memoryDisplay = _memoryDelta !== null ? _memoryDelta + " bytes" : "unsupported";
    console.log("💾  Memory Delta: " + memoryDisplay);

    // Max execution depth
    console.log("📊  Max Execution Depth: " + _maxDepth);

    if (typeof console.groupEnd === "function") {
        console.groupEnd();
    }
}

// ============================================================================
// Global performanceTracker object — the public API consumed by logo.js
// ============================================================================

var performanceTracker = {
    /** Enable instrumentation. */
    enable: function () {
        _enabled = true;
    },

    /** Disable instrumentation. */
    disable: function () {
        _enabled = false;
    },

    /** @returns {boolean} Whether instrumentation is currently active. */
    isEnabled: function () {
        return _enabled;
    },

    /** Begin a new measurement run (no-op if disabled). */
    startRun: function () {
        if (!_enabled) return;
        startPerformanceTracking();
    },

    /** End the current measurement run (no-op if disabled). */
    endRun: function () {
        if (!_enabled) return;
        endPerformanceTracking();
    },

    /** Log collected stats to the console (no-op if disabled). */
    logStats: function () {
        if (!_enabled) return;
        _logPerformanceStats();
    },

    /** Track entering an execution block (no-op if disabled). */
    enterBlock: function () {
        if (!_enabled) return;
        enterExecutionScope();
    },

    /** Track exiting an execution block (no-op if disabled). */
    exitBlock: function () {
        if (!_enabled) return;
        exitExecutionScope();
    },

    /** @returns {Object} Current stats snapshot. */
    getStats: function () {
        return getPerformanceStats();
    },

    /** Reset all internal tracking state. */
    reset: function () {
        resetPerformanceStats();
    }
};

// ============================================================================
// CommonJS exports (for Node.js / Jest testing)
// ============================================================================

if (typeof module !== "undefined" && module.exports) {
    module.exports = performanceTracker;
}
