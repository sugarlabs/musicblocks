/**
 * @file Graphics Adapter for Music Blocks
 * Bridges legacy CreateJS (EaselJS/TweenJS) calls to PixiJS and GSAP.
 * This allows replacing the abandoned CreateJS package with modern alternatives
 * without immediately refactoring 370+ files.
 */

(function (window) {
    // If PIXI is not available, we should load it asynchronously or fail gracefully
    if (typeof PIXI === 'undefined') {
        console.warn('PixiJS not found. Graphics adapter will not function.');
        return;
    }

    const createjs = {
        Stage: class {
            constructor(canvas) {
                this.app = new PIXI.Application({
                    view: canvas,
                    width: canvas.width,
                    height: canvas.height,
                    transparent: true,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true,
                });
                this.container = this.app.stage;
                this.children = [];
            }
            addChild(child) {
                this.container.addChild(child);
                this.children.push(child);
            }
            removeChild(child) {
                this.container.removeChild(child);
                const index = this.children.indexOf(child);
                if (index > -1) this.children.splice(index, 1);
            }
            update() {
                // Pixi renders automatically, but we can call manual render if needed
            }
        },
        Container: class extends PIXI.Container {
            constructor() {
                super();
                // CreateJS compatibility properties
                this.regX = 0;
                this.regY = 0;
            }
            getBounds() {
                const b = super.getBounds();
                return { x: b.x, y: b.y, width: b.width, height: b.height };
            }
            cache(x, y, width, height) {
                // Pixi handles caching differently via 'cacheAsBitmap'
                this.cacheAsBitmap = true;
            }
            updateCache() {
                this.cacheAsBitmap = false;
                this.cacheAsBitmap = true;
            }
        },
        Bitmap: class extends PIXI.Sprite {
            constructor(imageOrUrl) {
                let texture;
                if (typeof imageOrUrl === 'string') {
                    texture = PIXI.Texture.from(imageOrUrl);
                } else if (imageOrUrl instanceof HTMLImageElement) {
                    texture = PIXI.Texture.from(imageOrUrl);
                }
                super(texture);
                this.regX = 0;
                this.regY = 0;
            }
        },
        Shape: class extends PIXI.Graphics {
            constructor() {
                super();
                this.graphics = this; // Compatibility with .graphics accessor
            }
        },
        Text: class extends PIXI.Text {
            constructor(text, font, color) {
                super(text, {
                    fontFamily: font ? font.split(' ')[1] : 'Arial',
                    fontSize: font ? parseInt(font) : 12,
                    fill: color || 'black'
                });
            }
        },
        Ticker: {
            get framerate() { return 60; },
            set framerate(val) { /* handle */ },
            addEventListener: (type, listener) => {
                if (type === 'tick') {
                    PIXI.Ticker.shared.add(listener);
                }
            }
        },
        Tween: {
            get: function (target, props) {
                return {
                    target: target,
                    to: function (vars, duration) {
                        gsap.to(this.target, {
                            ...vars,
                            duration: (duration || 0) / 1000 // duration is ms in TweenJS
                        });
                        return this;
                    },
                    wait: function (duration) {
                        gsap.to(this.target, { delay: duration / 1000 });
                        return this;
                    }
                };
            }
        }
    };

    window.createjs = createjs;
    console.log('✅ CreateJS compatibility layer initialized via PixiJS and GSAP.');

})(window);
