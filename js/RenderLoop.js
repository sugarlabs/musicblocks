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
   exported RenderLoop
*/

/**
 * Encapsulates the requestAnimationFrame-driven stage update loop.
 *
 * The loop only redraws when the stage is dirty, CreateJS tweens are active,
 * or animated GIFs are running.
 */
class RenderLoop {
    /**
     * @param {Object} options - Render loop dependencies.
     * @param {Function} options.getStage - Returns the current stage instance.
     * @param {Function} options.getGifAnimator - Returns the current GIF animator.
     * @param {Object} [options.createjsRef] - Optional CreateJS reference for testing.
     * @param {Function} [options.requestAnimationFrameFn] - Optional rAF override.
     * @param {Function} [options.cancelAnimationFrameFn] - Optional cancel override.
     */
    constructor({
        getStage,
        getGifAnimator,
        createjsRef,
        requestAnimationFrameFn,
        cancelAnimationFrameFn
    }) {
        this._getStage = getStage;
        this._getGifAnimator = getGifAnimator;
        this._createjs =
            createjsRef || (typeof createjs !== "undefined" ? createjs : { Tween: null });
        this._requestAnimationFrame =
            requestAnimationFrameFn ||
            (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function"
                ? window.requestAnimationFrame.bind(window)
                : typeof requestAnimationFrame !== "undefined"
                  ? requestAnimationFrame
                  : null);
        this._cancelAnimationFrame =
            cancelAnimationFrameFn ||
            (typeof window !== "undefined" && typeof window.cancelAnimationFrame === "function"
                ? window.cancelAnimationFrame.bind(window)
                : typeof cancelAnimationFrame !== "undefined"
                  ? cancelAnimationFrame
                  : null);

        this._stageDirty = false;
        this._rafId = null;
        this._running = false;
    }

    /**
     * Returns the current dirty state.
     * @returns {boolean}
     */
    get dirty() {
        return this._stageDirty;
    }

    /**
     * Updates the current dirty state.
     * @param {boolean} value - Whether the stage needs redraw.
     */
    set dirty(value) {
        this._stageDirty = !!value;
    }

    /**
     * Marks the stage as needing redraw.
     */
    markDirty() {
        this._stageDirty = true;
    }

    /**
     * Starts the render loop if it is not already running.
     */
    start() {
        if (this._running || typeof this._requestAnimationFrame !== "function") {
            return;
        }

        this._running = true;
        this._rafId = this._requestAnimationFrame(() => this._renderFrame());
    }

    /**
     * Stops the render loop and cancels the pending animation frame.
     */
    stop() {
        this._running = false;

        if (this._rafId !== null && typeof this._cancelAnimationFrame === "function") {
            this._cancelAnimationFrame(this._rafId);
        }

        this._rafId = null;
    }

    /**
     * Performs one animation frame and schedules the next one.
     * @private
     */
    _renderFrame() {
        if (!this._running) {
            return;
        }

        const stage = typeof this._getStage === "function" ? this._getStage() : null;
        const gifAnimator =
            typeof this._getGifAnimator === "function" ? this._getGifAnimator() : null;
        const tweenApi = this._createjs && this._createjs.Tween;
        const hasActiveTweens =
            tweenApi && typeof tweenApi.hasActiveTweens === "function"
                ? tweenApi.hasActiveTweens()
                : false;
        const hasActiveGifs =
            gifAnimator && typeof gifAnimator.getActiveCount === "function"
                ? gifAnimator.getActiveCount() > 0
                : false;

        if (stage && (this._stageDirty || hasActiveTweens || hasActiveGifs)) {
            stage.update();
            this._stageDirty = false;
        }

        this._rafId = this._requestAnimationFrame(() => this._renderFrame());
    }
}

if (typeof globalThis !== "undefined") {
    globalThis.RenderLoop = RenderLoop;
}

if (typeof define === "function" && define.amd) {
    define([], function () {
        return RenderLoop;
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = RenderLoop;
}
