class GIFAnimator {
    constructor() {
        this.animations = new Map();
        this.frameRequestId = null;
        this.isRunning = false;
        this.gifCounter = 0;
    }

    isAnimatedGIF(dataURL) {
        return typeof dataURL === "string" && dataURL.startsWith("data:image/gif");
    }

    generateGifId() {
        return `gif_${Date.now()}_${this.gifCounter++}`;
    }

    async createAnimation(dataURL, canvas, x, y, width, height, rotation) {
        try {
            if (!window.SuperGif) {
                throw new Error("libgif.js (SuperGif) is not loaded");
            }

            const img = document.createElement("img");
            img.src = dataURL;
            img.style.display = "none";
            document.body.appendChild(img);

            const gifPlayer = new SuperGif({ gif: img });
            await new Promise(resolve => gifPlayer.load(resolve));

            const totalFrames = gifPlayer.get_length();
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

    renderFrame(animation) {
        const ctx = animation.canvas.getContext("2d");
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

        animation.gifPlayer.move_to(animation.currentFrame);
        const frameImage = animation.gifPlayer.get_canvas();

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

    animate(timestamp) {
        if (!this.isRunning) return;

        const FRAME_DELAY = 120;
        this.animations.forEach((animation, gifId) => {
            if (animation.disposed) {
                animation.gifPlayer.pause();
                document.body.removeChild(animation.imgElement);
                this.animations.delete(gifId);
                return;
            }

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

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.frameRequestId = requestAnimationFrame(ts => this.animate(ts));
        }
    }

    updatePosition(gifId, x, y, rotation) {
        const animation = this.animations.get(gifId);
        if (animation && !animation.disposed) {
            animation.x = x;
            animation.y = y;
            animation.rotation = rotation;
        }
    }

    stopAnimation(gifId) {
        const animation = this.animations.get(gifId);
        if (animation) {
            animation.disposed = true;
            this.animations.delete(gifId);
        }
    }

    stopAll() {
        this.animations.forEach(anim => (anim.disposed = true));
        this.animations.clear();
        if (this.frameRequestId) {
            cancelAnimationFrame(this.frameRequestId);
            this.frameRequestId = null;
        }
        this.isRunning = false;
    }

    getActiveCount() {
        return this.animations.size;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = GIFAnimator;
}