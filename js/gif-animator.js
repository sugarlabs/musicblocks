/**
 * @file GIF Animation Manager for Music Blocks
 * @author Music Blocks Contributors
 * 
 * Manages animated GIF playback on HTML5 canvas using gifuct-js library
 */

/* exported GIFAnimator */

/**
 * Manages animated GIF playback on canvas
 * @class
 */
class GIFAnimator {
    /**
     * Creates a new GIF animator instance
     * @constructor
     */
    constructor() {
        this.animations = new Map(); // gifId -> animation state
        this.frameRequestId = null;
        this.isRunning = false;
        this.gifCounter = 0; // For generating unique IDs
    }

    /**
     * Checks if image data URL is a GIF
     * @param {string} dataURL - The image data URL
     * @returns {boolean} True if the data URL is a GIF
     */
    isAnimatedGIF(dataURL) {
        if (!dataURL || typeof dataURL !== 'string') {
            return false;
        }
        return dataURL.startsWith('data:image/gif');
    }

    /**
     * Generates a unique ID for a GIF animation
     * @returns {string} Unique GIF identifier
     */
    generateGifId() {
        return `gif_${Date.now()}_${this.gifCounter++}`;
    }

    /**
     * Creates and starts animation from GIF data URL
     * @async
     * @param {string} dataURL - Base64 encoded GIF data URL
     * @param {HTMLCanvasElement} canvas - Target canvas to render on
     * @param {number} x - X position on canvas
     * @param {number} y - Y position on canvas
     * @param {number} width - Width to render GIF
     * @param {number} height - Height to render GIF
     * @param {number} rotation - Rotation angle in degrees
     * @returns {Promise<string|null>} GIF ID if successful, null if not animated
     */
    async createAnimation(dataURL, canvas, x, y, width, height, rotation) {
    try {
        if (!window.SuperGif) {
            throw new Error("libgif.js (SuperGif) is not loaded");
        }

        // Create hidden image element
        const img = document.createElement("img");
        img.src = dataURL;
        img.style.display = "none";
        document.body.appendChild(img);

        const gifPlayer = new SuperGif({ gif: img });
        
        await new Promise(resolve => gifPlayer.load(resolve));

        const totalFrames = gifPlayer.get_length();

        // Match OLD behavior: reject non-animated GIFs
        if (totalFrames <= 1) {
            document.body.removeChild(img);
            return null;
        }

        const frameCanvas = document.createElement("canvas");
        const internalCanvas = gifPlayer.get_canvas();

        frameCanvas.width = internalCanvas.width;
        frameCanvas.height = internalCanvas.height;


        const frameCtx = frameCanvas.getContext("2d");

        const gifId = this.generateGifId();

        const animation = {
            gifPlayer,
            frames: totalFrames,      // preserved semantic meaning
            frameCanvas,
            frameCtx,
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
     * Renders a single frame of the GIF animation
     * @param {Object} animation - Animation state object
     */
    renderFrame(animation) {
    const ctx = animation.canvas.getContext("2d");

    //CLEAR ONLY THE PREVIOUS GIF REGION
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

    // MOVE GIF DECODER TO CURRENT FRAME
    animation.gifPlayer.move_to(animation.currentFrame);

    const frameImage = animation.gifPlayer.get_canvas();

    //  DRAW NEW FRAME CLEANLY
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
     * Main animation loop - updates all active GIF animations
     * @param {DOMHighResTimeStamp} timestamp - Current time from requestAnimationFrame
     */
    animate(timestamp) {
    if (!this.isRunning) return;

    const FRAME_DELAY = 120; // ✅ 120ms per frame (~8.3 FPS). Change this to tune speed.

    this.animations.forEach((animation, gifId) => {
        if (animation.disposed) {
            animation.gifPlayer.pause();
            document.body.removeChild(animation.imgElement);
            this.animations.delete(gifId);
            return;
        }

        // ✅ First frame bootstrap
        if (!animation.lastFrameTime) {
            animation.lastFrameTime = timestamp;
            this.renderFrame(animation);
            return;
        }

        // ✅ Only advance frame when enough time has passed
        if (timestamp - animation.lastFrameTime >= FRAME_DELAY) {
            this.renderFrame(animation);

            animation.currentFrame =
                (animation.currentFrame + 1) % animation.frames;

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
     * Starts the animation loop
     */
    start() {
        if (this.isRunning) {
            return;
        }
        
        this.isRunning = true;
        this.frameRequestId = requestAnimationFrame((ts) => this.animate(ts));
    }

    /**
     * Updates position and rotation of a specific GIF animation
     * @param {string} gifId - The GIF identifier
     * @param {number} x - New X position
     * @param {number} y - New Y position
     * @param {number} rotation - New rotation angle in degrees
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
     * Stops and removes a specific animation
     * @param {string} gifId - The GIF identifier to stop
     */
    stopAnimation(gifId) {
        const animation = this.animations.get(gifId);
        if (animation) {
            animation.disposed = true;
            this.animations.delete(gifId);
        }
    }

    /**
     * Stops all animations and clears the animation loop
     */
    stopAll() {
        // Mark all animations as disposed
        this.animations.forEach((anim, id) => {
            anim.disposed = true;
        });
        
        // Clear the map
        this.animations.clear();
        
        // Cancel animation frame
        if (this.frameRequestId) {
            cancelAnimationFrame(this.frameRequestId);
            this.frameRequestId = null;
        }
        
        this.isRunning = false;
    }

    /**
     * Gets the number of active animations
     * @returns {number} Number of active GIF animations
     */
    getActiveCount() {
        return this.animations.size;
    }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = GIFAnimator;
}