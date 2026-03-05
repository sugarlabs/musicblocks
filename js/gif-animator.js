// Copyright (c) 2025 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// This file depends on SuperGif (libgif.js), which is licensed
// under the MIT License. See: https://github.com/buzzfeed/libgif-js
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * GIF animation manager for Music Blocks.
 *
 * Handles animated GIF playback on the turtle canvas using the
 * SuperGif decoder from libgif.js. This module manages frame timing,
 * rendering, position updates, and cleanup of animation resources.
 */

/* exported GIFAnimator */

/**
 * Manages animated GIF playback on the canvas.
 */
class GIFAnimator {
    constructor() {
        this.animations = new Map(); // Tracks active GIF animations by ID
        this.frameRequestId = null;
        this.isRunning = false;
        this.gifCounter = 0; // Generates unique animation IDs
    }

    /**
     * Determines whether a data URL represents a GIF.
     */
    isAnimatedGIF(dataURL) {
        return typeof dataURL === "string" && dataURL.startsWith("data:image/gif");
    }

    /**
     * Creates a unique identifier for a GIF animation.
     */
    generateGifId() {
        return `gif_${Date.now()}_${this.gifCounter++}`;
    }

    /**
     * Creates and initializes a new GIF animation instance.
     *
     * Loads the GIF through SuperGif, extracts frame metadata, and registers
     * the animation for rendering.
     *
     * @returns {Promise<string|null>} A unique GIF ID or null if not animated.
     */
    async createAnimation(dataURL, canvas, x, y, width, height, rotation) {
        try {
            if (!window.SuperGif) {
                throw new Error("libgif.js (SuperGif) is not loaded");
            }

            // Hidden <img> element required by SuperGif
            const img = document.createElement("img");
            img.src = dataURL;
            img.style.display = "none";
            document.body.appendChild(img);

            const gifPlayer = new SuperGif({ gif: img });
            await new Promise(resolve => gifPlayer.load(resolve));

            const totalFrames = gifPlayer.get_length();

            // Ignore static (single-frame) GIFs
            if (totalFrames <= 1) {
                document.body.removeChild(img);
                return null;
            }

            const internalCanvas = gifPlayer.get_canvas();
            const frameCanvas = document.createElement("canvas");
            frameCanvas.width = internalCanvas.width;
            frameCanvas.height = internalCanvas.height;

            const animation = {
                gifPlayer,
                frames: totalFrames,
                frameCanvas,
                frameCtx: frameCanvas.getContext("2d"),
                currentFrame: 0,
                lastFrameTime: 0,
                canvas,
                x,
                y,
                width,
                height,
                rotation,
                disposed: false,
                imgElement: img
            };

            const gifId = this.generateGifId();
            this.animations.set(gifId, animation);

            if (!this.isRunning) {
                this.start();
            }

            return gifId;
        } catch (error) {
            console.error("Failed to create GIF animation:", error);
            return null;
        }
    }

    /**
     * Renders a single GIF frame to the target canvas.
     */
    renderFrame(animation) {
        const ctx = animation.canvas.getContext("2d");

        // Clear only the region occupied by the GIF
        ctx.save();
        ctx.translate(animation.x, animation.y);
        ctx.rotate((animation.rotation * Math.PI) / 180);
        ctx.clearRect(
            -animation.width / 2 - 2,
            -animation.height / 2 - 2,
            animation.width + 4,
            animation.height + 4
        );
        ctx.restore();

        // Decode the next frame
        animation.gifPlayer.move_to(animation.currentFrame);
        const frameImage = animation.gifPlayer.get_canvas();

        // Draw the frame
        ctx.save();
        ctx.translate(animation.x, animation.y);
        ctx.rotate((animation.rotation * Math.PI) / 180);
        ctx.drawImage(
            frameImage,
            -animation.width / 2,
            -animation.height / 2,
            animation.width,
            animation.height
        );
        ctx.restore();
    }

    /**
     * Main animation loop. Advances and renders frames based on time.
     */
    animate(timestamp) {
        if (!this.isRunning) return;

        const FRAME_DELAY = 120; // ~8 FPS

        this.animations.forEach((animation, gifId) => {
            if (animation.disposed) {
                animation.gifPlayer.pause();
                document.body.removeChild(animation.imgElement);
                this.animations.delete(gifId);
                return;
            }

            // Initialize first frame timestamp
            if (!animation.lastFrameTime) {
                animation.lastFrameTime = timestamp;
                this.renderFrame(animation);
                return;
            }

            if (timestamp - animation.lastFrameTime >= FRAME_DELAY) {
                this.renderFrame(animation);
                animation.currentFrame = (animation.currentFrame + 1) % animation.frames;
                animation.lastFrameTime = timestamp;
            }
        });

        if (this.animations.size > 0) {
            this.frameRequestId = requestAnimationFrame(ts => this.animate(ts));
        } else {
            this.isRunning = false;
        }
    }

    /**
     * Starts the animation loop.
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.frameRequestId = requestAnimationFrame(ts => this.animate(ts));
        }
    }

    /**
     * Updates position and rotation of an active animation.
     */
    updatePosition(gifId, x, y, rotation) {
        const animation = this.animations.get(gifId);
        if (animation && !animation.disposed) {
            animation.x = x;
            animation.y = y;
            animation.rotation = rotation;
        }
    }

    /**
     * Stops and removes a specific GIF animation.
     */
    stopAnimation(gifId) {
        const animation = this.animations.get(gifId);
        if (animation) {
            animation.disposed = true;
            this.animations.delete(gifId);
        }
    }

    /**
     * Stops all animations and resets internal state.
     */
    stopAll() {
        this.animations.forEach(anim => (anim.disposed = true));
        this.animations.clear();

        if (this.frameRequestId) {
            cancelAnimationFrame(this.frameRequestId);
            this.frameRequestId = null;
        }

        this.isRunning = false;
    }

    /**
     * Returns how many GIF animations are currently active.
     */
    getActiveCount() {
        return this.animations.size;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = GIFAnimator;
}

if (typeof window !== "undefined") {
    window.GIFAnimator = GIFAnimator;
}
