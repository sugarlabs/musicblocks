// graphics-adapter.js
// Compatibility layer that maps a subset of the CreateJS API to PixiJS (v8) and GSAP (v3).
// This enables the existing Music Blocks codebase, which expects a global `createjs`
// object, to run unchanged while using the modern rendering/animation stack.

/* global PIXI, gsap */

(function () {
    // Ensure we are in a browser environment.
    if (typeof window === 'undefined') return;

    // Create a namespace similar to the original CreateJS library.
    window.createjs = window.createjs || {};
    const createjs = window.createjs;

    // ---------------------------------------------------------------------------
    // Stage – wraps a PIXI.Application. The original CreateJS Stage expects a canvas
    // element and provides an `addChild` method and a `ticker` for animation.
    // ---------------------------------------------------------------------------
    class Stage {
        constructor(canvas) {
            // PIXI will use the supplied canvas element as its view.
            this.app = new PIXI.Application({ view: canvas, backgroundAlpha: 0 });
            this.container = this.app.stage;
        }
        addChild(child) {
            this.container.addChild(child);
        }
        // In CreateJS the Stage has an `update` method that forces a render. PixiJS
        // renders automatically each tick, so we provide a no‑op for compatibility.
        update() { }
        // Expose the ticker so existing code that does `stage.ticker.add(...)`
        // continues to work.
        get ticker() {
            return this.app.ticker;
        }
    }
    createjs.Stage = Stage;

    // ---------------------------------------------------------------------------
    // Container – direct alias to PIXI.Container.
    // ---------------------------------------------------------------------------
    createjs.Container = PIXI.Container;

    // ---------------------------------------------------------------------------
    // Bitmap – thin wrapper around PIXI.Sprite that mimics the CreateJS Bitmap API.
    // ---------------------------------------------------------------------------
    class Bitmap extends PIXI.Sprite {
        constructor(image) {
            // `image` can be a URL string or an HTMLImageElement.
            const texture = typeof image === 'string' ? PIXI.Texture.from(image) : PIXI.Texture.from(image);
            super(texture);
        }
        set image(img) {
            this.texture = PIXI.Texture.from(img);
        }
        get image() {
            return this.texture.baseTexture.resource.source;
        }
    }
    createjs.Bitmap = Bitmap;

    // ---------------------------------------------------------------------------
    // Shape – alias to PIXI.Graphics, which provides the drawing primitives used
    // by Music Blocks (e.g., `drawRect`, `drawCircle`).
    // ---------------------------------------------------------------------------
    createjs.Shape = PIXI.Graphics;

    // ---------------------------------------------------------------------------
    // Tween – a very small wrapper around GSAP. The original CreateJS Tween has a
    // fluent API; for our purposes we expose a `get` method that returns a GSAP
    // timeline so existing code can chain `.to(...)` calls.
    // ---------------------------------------------------------------------------
    createjs.Tween = {
        get(target) {
            // Return a GSAP timeline bound to the target.
            return gsap.timeline().set(target, {});
        },
        // Helper that mirrors `createjs.Tween.get(target).to(...)` usage.
        to(target, vars) {
            return gsap.to(target, vars);
        },
    };
})();
