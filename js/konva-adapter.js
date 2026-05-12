/**
 * konva-adapter.js
 *
 * Compatibility shim: exposes a global `createjs` object whose API surface
 * matches the EaselJS / TweenJS subset used by MusicBlocks, implemented on
 * top of Konva.js.
 *
 * Purpose: allow files to be migrated from CreateJS to Konva one at a time.
 * Un-migrated files continue to use `createjs.*`; migrated files use Konva
 * directly. Once all files are migrated this adapter can be deleted.
 *
 * Usage: load konva.js first, then this file, then the rest of the app.
 *
 * NOTE: Property access style differences
 *   EaselJS uses plain properties:  node.x = 10; node.alpha = 0.5;
 *   Konva uses getter/setters:      node.x(10);  node.opacity(0.5);
 *
 * The wrapper classes below restore plain-property semantics so existing
 * code needs minimal edits. Each wrapper proxies reads/writes to the
 * underlying Konva node via Object.defineProperty.
 */

/* global Konva */

(function (global) {
    "use strict";

    if (typeof Konva === "undefined") {
        console.error("konva-adapter: Konva must be loaded before konva-adapter.js");
        return;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Parse a CSS font string ("20px Arial") into { fontSize, fontFamily }.
     * Falls back gracefully on unexpected input.
     */
    function parseFont(fontStr) {
        if (!fontStr || typeof fontStr !== "string") {
            return { fontSize: 14, fontFamily: "Sans" };
        }
        const m = fontStr.match(/(\d+(?:\.\d+)?)px\s+(.*)/);
        if (m) return { fontSize: parseFloat(m[1]), fontFamily: m[2].trim() };
        return { fontSize: 14, fontFamily: fontStr.trim() };
    }

    /**
     * Bind a plain property on `obj` that proxies to a Konva getter/setter.
     * konvaKey defaults to jsKey when omitted.
     */
    function proxy(obj, jsKey, konvaNode, konvaKey) {
        const kKey = konvaKey || jsKey;
        Object.defineProperty(obj, jsKey, {
            get() {
                return konvaNode[kKey]();
            },
            set(v) {
                konvaNode[kKey](v);
            },
            enumerable: true,
            configurable: true
        });
    }

    // Tracks active tween count — replaces createjs.Tween.hasActiveTweens()
    let _activeTweens = 0;

    // Invert color filter for Konva
    function _invertFilter(imageData) {
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
            d[i] = 255 - d[i];
            d[i + 1] = 255 - d[i + 1];
            d[i + 2] = 255 - d[i + 2];
        }
    }

    // ── Container (EaselJS Container → Konva.Group) ──────────────────────────

    function Container() {
        this._node = new Konva.Group();
        this._wrappers = new Map(); // konva node → adapter wrapper, for children iteration
        proxy(this, "x", this._node);
        proxy(this, "y", this._node);
        proxy(this, "scaleX", this._node);
        proxy(this, "scaleY", this._node);
        proxy(this, "rotation", this._node);
        proxy(this, "visible", this._node);
        Object.defineProperty(this, "alpha", {
            get() {
                return this._node.opacity();
            },
            set(v) {
                this._node.opacity(v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(this, "name", {
            get() {
                return this._name || "";
            },
            set(v) {
                this._name = v;
                this._node.name(v);
            },
            enumerable: true,
            configurable: true
        });
        // children: returns adapter wrappers (not raw Konva nodes) so .name etc. work
        Object.defineProperty(this, "children", {
            get() {
                return (this._node.children || []).map(k => this._wrappers.get(k) || k);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(this, "numChildren", {
            get() {
                return (this._node.children || []).length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(this, "scale", {
            get() {
                return this._node.scaleX();
            },
            set(v) {
                this._node.scaleX(v);
                this._node.scaleY(v);
            },
            enumerable: true,
            configurable: true
        });
    }

    Container.prototype.addChild = function (...nodes) {
        nodes.forEach(n => {
            const kNode = n._node || n;
            this._node.add(kNode);
            if (n._node) this._wrappers.set(kNode, n);
        });
        return nodes[nodes.length - 1];
    };

    Container.prototype.removeChild = function (...nodes) {
        nodes.forEach(n => {
            const k = n._node || n;
            k.remove();
            this._wrappers.delete(k);
        });
    };

    Container.prototype.removeAllChildren = function () {
        this._node.destroyChildren();
        this._wrappers.clear();
    };

    Container.prototype.getChildAt = function (i) {
        return (this._node.children || [])[i];
    };

    Container.prototype.contains = function (node) {
        const k = node._node || node;
        return this._node.children && this._node.children.includes(k);
    };

    Container.prototype.setChildIndex = function (node, index) {
        const k = node._node || node;
        k.zIndex(index);
    };

    Container.prototype.getBounds = function () {
        return this._node.getClientRect();
    };

    Container.prototype.cache = function (x, y, w, h) {
        if (w > 0 && h > 0) this._node.cache(x, y, w, h);
        this._cached = true;
    };

    Container.prototype.updateCache = function () {
        this._node.clearCache();
        const r = this._node.getClientRect({ skipTransform: true });
        if (r.width > 0 && r.height > 0) this._node.cache(r.x, r.y, r.width, r.height);
    };

    Container.prototype.uncache = function () {
        this._node.clearCache();
        this._cached = false;
    };

    Object.defineProperty(Container.prototype, "bitmapCache", {
        get() {
            return this._cached ? this._node : null;
        },
        configurable: true
    });

    Object.defineProperty(Container.prototype, "hitArea", {
        set(v) {
            /* no-op — Konva handles hit detection natively */
        },
        get() {
            return null;
        },
        configurable: true
    });

    Container.prototype.on = function (evt, fn) {
        this._node.on(evt, fn);
        return this;
    };

    Container.prototype.off = function (evt, fn) {
        this._node.off(evt, fn);
        return this;
    };

    // ── Bitmap (EaselJS Bitmap → Konva.Image) ────────────────────────────────

    function Bitmap(imageOrSrc) {
        const isEl =
            imageOrSrc instanceof HTMLImageElement || imageOrSrc instanceof HTMLCanvasElement;
        this._node = new Konva.Image({
            image: isEl ? imageOrSrc : null
        });
        if (typeof imageOrSrc === "string") {
            const img = new Image();
            img.onload = () => {
                this._node.image(img);
            };
            img.src = imageOrSrc;
        }
        proxy(this, "x", this._node);
        proxy(this, "y", this._node);
        proxy(this, "scaleX", this._node);
        proxy(this, "scaleY", this._node);
        proxy(this, "rotation", this._node);
        proxy(this, "visible", this._node);
        Object.defineProperty(this, "alpha", {
            get() {
                return this._node.opacity();
            },
            set(v) {
                this._node.opacity(v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(this, "image", {
            get() {
                return this._node.image();
            },
            set(v) {
                this._node.image(v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(this, "name", {
            get() {
                return this._name || "";
            },
            set(v) {
                this._name = v;
                this._node.name(v);
            },
            enumerable: true,
            configurable: true
        });
        // scale: EaselJS shorthand that sets both scaleX and scaleY
        Object.defineProperty(this, "scale", {
            get() {
                return this._node.scaleX();
            },
            set(v) {
                this._node.scaleX(v);
                this._node.scaleY(v);
            },
            enumerable: true,
            configurable: true
        });
        // regX / regY = EaselJS registration point (pivot) → Konva offsetX / offsetY
        Object.defineProperty(this, "regX", {
            get() {
                return this._node.offsetX();
            },
            set(v) {
                this._node.offsetX(v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(this, "regY", {
            get() {
                return this._node.offsetY();
            },
            set(v) {
                this._node.offsetY(v);
            },
            enumerable: true,
            configurable: true
        });
        // cursor — stored as a data attribute; no-op visually (handled by stage CSS)
        Object.defineProperty(this, "cursor", {
            get() {
                return this._cursor || "default";
            },
            set(v) {
                this._cursor = v;
            },
            enumerable: true,
            configurable: true
        });
        // filters: EaselJS assigns an array of filter objects; apply them via Konva filters
        Object.defineProperty(this, "filters", {
            get() {
                return this._filters || [];
            },
            set(arr) {
                this._filters = arr;
                if (!arr || !arr.length) {
                    this._node.filters([]);
                    this._node.clearCache();
                    return;
                }
                this._node.filters(arr.map(f => f._konvaFilter || (d => d)));
            },
            enumerable: true,
            configurable: true
        });
    }

    Bitmap.prototype.cache = function (x, y, w, h) {
        if (w > 0 && h > 0) this._node.cache(x, y, w, h);
    };

    Bitmap.prototype.updateCache = function () {
        const r = this._node.getClientRect({ skipTransform: true });
        if (r.width > 0 && r.height > 0) {
            this._node.clearCache();
            this._node.cache(r.x, r.y, r.width, r.height);
        }
    };

    Bitmap.prototype.uncache = function () {
        this._node.clearCache();
    };

    Bitmap.prototype.clone = function () {
        const c = new Bitmap(this._node.image());
        c.x = this.x;
        c.y = this.y;
        c.scaleX = this.scaleX;
        c.scaleY = this.scaleY;
        c.regX = this.regX;
        c.regY = this.regY;
        c.rotation = this.rotation;
        c.alpha = this.alpha;
        return c;
    };

    Bitmap.prototype.getBounds = function () {
        return this._node.getClientRect();
    };

    Bitmap.prototype.on = function (evt, fn) {
        this._node.on(evt, fn);
        return this;
    };

    Bitmap.prototype.off = function (evt, fn) {
        this._node.off(evt, fn);
        return this;
    };

    // ── Text (EaselJS Text → Konva.Text) ─────────────────────────────────────

    function Text(str, font, color) {
        const { fontSize, fontFamily } = parseFont(font);
        this._node = new Konva.Text({
            text: str || "",
            fontSize: fontSize,
            fontFamily: fontFamily,
            fill: color || "#000000"
        });
        proxy(this, "x", this._node);
        proxy(this, "y", this._node);
        proxy(this, "scaleX", this._node);
        proxy(this, "scaleY", this._node);
        proxy(this, "rotation", this._node);
        proxy(this, "visible", this._node);
        Object.defineProperty(this, "alpha", {
            get() {
                return this._node.opacity();
            },
            set(v) {
                this._node.opacity(v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(this, "text", {
            get() {
                return this._node.text();
            },
            set(v) {
                this._node.text(v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(this, "color", {
            get() {
                return this._node.fill();
            },
            set(v) {
                this._node.fill(v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(this, "textAlign", {
            get() {
                return this._node.align();
            },
            set(v) {
                this._node.align(v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(this, "textBaseline", {
            get() {
                return this._textBaseline || "alphabetic";
            },
            set(v) {
                this._textBaseline = v;
            },
            enumerable: true,
            configurable: true
        });
    }

    Text.prototype.getMeasuredWidth = function () {
        return this._node.getTextWidth();
    };

    Text.prototype.getMeasuredHeight = function () {
        return this._node.getTextHeight();
    };

    Text.prototype.on = function (evt, fn) {
        this._node.on(evt, fn);
        return this;
    };

    // ── Shape (EaselJS Shape → Konva.Shape) ──────────────────────────────────

    function Shape() {
        this._node = new Konva.Shape({
            sceneFunc: function (ctx, shape) {
                shape._drawFn && shape._drawFn(ctx);
                shape.fillStrokeShape(shape);
            }
        });
        this._node._drawFn = null;

        // Expose a minimal EaselJS Graphics-like object
        this.graphics = {
            _cmds: [],
            _fillColor: null,
            _strokeColor: null,
            _strokeWidth: 1,
            _node: this._node,
            beginFill(color) {
                this._fillColor = color;
                return this;
            },
            // .f() is EaselJS shorthand for beginFill()
            f(color) {
                return this.beginFill(color);
            },
            beginStroke(color) {
                this._strokeColor = color;
                return this;
            },
            setStrokeStyle(w) {
                this._strokeWidth = w;
                return this;
            },
            drawRect(x, y, w, h) {
                const fill = this._fillColor;
                const stroke = this._strokeColor;
                const sw = this._strokeWidth;
                this._node.sceneFunc(function (ctx, shape) {
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.closePath();
                    if (fill) {
                        ctx.setAttr("fillStyle", fill);
                        ctx.fill();
                    }
                    if (stroke) {
                        ctx.setAttr("strokeStyle", stroke);
                        ctx.setAttr("lineWidth", sw);
                        ctx.stroke();
                    }
                    shape.fillStrokeShape(shape);
                });
                return this;
            },
            drawCircle(cx, cy, r) {
                const fill = this._fillColor;
                const stroke = this._strokeColor;
                const sw = this._strokeWidth;
                this._node.sceneFunc(function (ctx, shape) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, 0, Math.PI * 2);
                    ctx.closePath();
                    if (fill) {
                        ctx.setAttr("fillStyle", fill);
                        ctx.fill();
                    }
                    if (stroke) {
                        ctx.setAttr("strokeStyle", stroke);
                        ctx.setAttr("lineWidth", sw);
                        ctx.stroke();
                    }
                    shape.fillStrokeShape(shape);
                });
                return this;
            },
            moveTo(x, y) {
                this._pathCmds = this._pathCmds || [];
                this._pathCmds.push({ cmd: "moveTo", x, y });
                this._buildPath();
                return this;
            },
            lineTo(x, y) {
                this._pathCmds = this._pathCmds || [];
                this._pathCmds.push({ cmd: "lineTo", x, y });
                this._buildPath();
                return this;
            },
            _buildPath() {
                const cmds = this._pathCmds || [];
                const fill = this._fillColor;
                const stroke = this._strokeColor;
                const sw = this._strokeWidth;
                this._node.sceneFunc(function (ctx, shape) {
                    ctx.beginPath();
                    cmds.forEach(c => {
                        if (c.cmd === "moveTo") ctx.moveTo(c.x, c.y);
                        else if (c.cmd === "lineTo") ctx.lineTo(c.x, c.y);
                    });
                    if (fill) {
                        ctx.setAttr("fillStyle", fill);
                        ctx.fill();
                    }
                    if (stroke) {
                        ctx.setAttr("strokeStyle", stroke);
                        ctx.setAttr("lineWidth", sw);
                        ctx.stroke();
                    }
                    shape.fillStrokeShape(shape);
                });
            },
            clear() {
                this._fillColor = null;
                this._strokeColor = null;
                this._pathCmds = [];
                this._node.sceneFunc(null);
                return this;
            }
        };

        proxy(this, "x", this._node);
        proxy(this, "y", this._node);
        proxy(this, "scaleX", this._node);
        proxy(this, "scaleY", this._node);
        proxy(this, "rotation", this._node);
        proxy(this, "visible", this._node);
        Object.defineProperty(this, "alpha", {
            get() {
                return this._node.opacity();
            },
            set(v) {
                this._node.opacity(v);
            },
            enumerable: true,
            configurable: true
        });
    }

    Shape.prototype.on = function (evt, fn) {
        this._node.on(evt, fn);
        return this;
    };

    // ── ColorFilter (EaselJS ColorFilter → Konva custom filter) ─────────────

    /**
     * EaselJS signature: new ColorFilter(redMultiplier, greenMultiplier,
     *   blueMultiplier, alphaMultiplier, redOffset, greenOffset, blueOffset)
     *
     * The only usage in MusicBlocks is the invert pattern:
     *   new ColorFilter(-1,-1,-1, 1, 255,255,255)
     *
     * We detect that pattern and apply the built-in invert filter; all other
     * combinations fall back to a general RGBA-multiplier implementation.
     */
    function ColorFilter(rm, gm, bm, am, ro, go, bo) {
        this.rm = rm ?? 1;
        this.gm = gm ?? 1;
        this.bm = bm ?? 1;
        this.am = am ?? 1;
        this.ro = ro ?? 0;
        this.go = go ?? 0;
        this.bo = bo ?? 0;

        const isInvert =
            rm === -1 && gm === -1 && bm === -1 && ro === 255 && go === 255 && bo === 255;
        this._konvaFilter = isInvert ? _invertFilter : this._generalFilter.bind(this);
    }

    ColorFilter.prototype._generalFilter = function (imageData) {
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
            d[i] = d[i] * this.rm + this.ro;
            d[i + 1] = d[i + 1] * this.gm + this.go;
            d[i + 2] = d[i + 2] * this.bm + this.bo;
            d[i + 3] = d[i + 3] * this.am;
        }
    };

    /**
     * Apply this filter to a Konva node.
     * Usage (replaces bitmap.filters = [filter]; bitmap.cache(...)):
     *   adapter.applyColorFilter(konvaNode, colorFilter);
     */
    ColorFilter.applyToNode = function (konvaNode, colorFilter) {
        konvaNode.filters([colorFilter._konvaFilter]);
        const rect = konvaNode.getClientRect();
        konvaNode.cache(rect.x, rect.y, rect.width, rect.height);
    };

    // ── Stage (EaselJS Stage → Konva.Stage) ──────────────────────────────────

    function Stage(canvasOrId) {
        let container;
        if (typeof canvasOrId === "string") {
            container = document.getElementById(canvasOrId);
        } else if (canvasOrId instanceof HTMLCanvasElement) {
            // Konva needs a div — wrap the canvas's parent or create a sibling div
            container = canvasOrId.parentElement;
            if (!container) {
                container = document.createElement("div");
                document.body.appendChild(container);
            }
        } else {
            container = canvasOrId;
        }

        const w = (container && container.offsetWidth) || window.innerWidth;
        const h = (container && container.offsetHeight) || window.innerHeight;

        this._stage = new Konva.Stage({ container, width: w, height: h });
        this._layer = new Konva.Layer();
        this._stage.add(this._layer);

        // Mirror the EaselJS container API on the stage
        proxy(this, "x", this._stage);
        proxy(this, "y", this._stage);
        proxy(this, "scaleX", this._stage);
        proxy(this, "scaleY", this._stage);
        proxy(this, "visible", this._stage);
        Object.defineProperty(this, "alpha", {
            get() {
                return this._stage.opacity();
            },
            set(v) {
                this._stage.opacity(v);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(this, "canvas", {
            get() {
                return this._stage.content && this._stage.content.querySelector("canvas");
            },
            enumerable: true,
            configurable: true
        });
    }

    Stage.prototype.addChild = function (...nodes) {
        nodes.forEach(n => this._layer.add(n._node || n));
        return nodes[nodes.length - 1];
    };

    Stage.prototype.removeChild = function (...nodes) {
        nodes.forEach(n => {
            const k = n._node || n;
            k.remove();
        });
    };

    Stage.prototype.removeAllChildren = function () {
        this._layer.destroyChildren();
    };

    Stage.prototype.update = function () {
        this._layer.batchDraw();
    };

    Stage.prototype.getObjectsUnderPoint = function (x, y) {
        return this._stage.getAllIntersections({ x, y });
    };

    Stage.prototype.setChildIndex = function (node, index) {
        const k = node._node || node;
        k.zIndex(index);
    };

    Object.defineProperty(Stage.prototype, "children", {
        get() {
            return this._layer.children || [];
        },
        configurable: true
    });

    Stage.prototype.on = function (evt, fn) {
        this._stage.on(evt, fn);
        return this;
    };

    Stage.prototype.off = function (evt, fn) {
        this._stage.off(evt, fn);
        return this;
    };

    Stage.prototype.enableMouseOver = function () {
        /* no-op; Konva always tracks hover */
    };

    // ── Ticker (EaselJS Ticker → requestAnimationFrame) ──────────────────────

    const Ticker = {
        _framerate: 60,
        _listeners: [],
        _rafId: null,
        _lastTime: 0,

        get framerate() {
            return this._framerate;
        },
        set framerate(v) {
            this._framerate = v;
            if (this._rafId) this._restart();
        },

        addEventListener(evt, fn) {
            if (evt === "tick") this._listeners.push(fn);
            if (!this._rafId) this._start();
        },

        removeEventListener(evt, fn) {
            this._listeners = this._listeners.filter(l => l !== fn);
            if (!this._listeners.length) this._stop();
        },

        _start() {
            const tick = now => {
                const interval = 1000 / this._framerate;
                if (now - this._lastTime >= interval) {
                    this._lastTime = now;
                    const e = { delta: now - this._lastTime };
                    this._listeners.forEach(fn =>
                        typeof fn === "object" ? fn.handleEvent(e) : fn(e)
                    );
                }
                this._rafId = requestAnimationFrame(tick);
            };
            this._rafId = requestAnimationFrame(tick);
        },

        _stop() {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        },
        _restart() {
            this._stop();
            if (this._listeners.length) this._start();
        },

        hasActiveTweens() {
            return false;
        }
    };

    // ── Touch ─────────────────────────────────────────────────────────────────

    const Touch = {
        enable() {
            /* Konva handles touch natively — no-op */
        },
        disable() {
            /* no-op */
        }
    };

    // ── Tween (EaselJS Tween → Konva.Tween) ──────────────────────────────────

    /**
     * Minimal Tween wrapper. EaselJS uses a fluent chain: .get(node).to({}, ms, ease).set({})
     * Konva.Tween is node-bound at construction with seconds-based duration.
     */
    function TweenChain(node) {
        this._node = node;
        this._queue = [];
    }

    TweenChain.prototype.to = function (props, durationMs, ease) {
        const durationSec = (durationMs || 0) / 1000;
        const easing = ease ? Ease._konvaEasing(ease) : Konva.Easings.Linear;
        this._queue.push({ type: "to", props, durationSec, easing });
        this._run();
        return this;
    };

    TweenChain.prototype.set = function (props) {
        this._queue.push({ type: "set", props });
        this._run();
        return this;
    };

    TweenChain.prototype._run = function () {
        if (this._running) return;
        this._running = true;
        this._next();
    };

    // Properties that Konva.Tween cannot animate (not numeric) — applied immediately
    const _immediateProps = new Set(["visible"]);

    TweenChain.prototype._next = function () {
        if (!this._queue.length) {
            this._running = false;
            return;
        }
        const step = this._queue.shift();
        const kNode = this._node._node || this._node;

        const _applyImmediate = props => {
            Object.entries(props).forEach(([k, v]) => {
                const mapped = _propMap[k] || k;
                if (typeof kNode[mapped] === "function") kNode[mapped](v);
            });
        };

        if (step.type === "set") {
            _applyImmediate(step.props);
            this._next();
        } else {
            // Split props: non-numeric ones (e.g. visible) applied immediately
            const konvaProps = {};
            const immediateApply = {};
            Object.entries(step.props).forEach(([k, v]) => {
                const mapped = _propMap[k] || k;
                if (_immediateProps.has(k) || typeof v !== "number") {
                    immediateApply[k] = v;
                } else {
                    konvaProps[mapped] = v;
                }
            });
            _applyImmediate(immediateApply);

            // Duration=0 or no numeric props → skip Konva.Tween and advance immediately
            if (step.durationSec === 0 || !Object.keys(konvaProps).length) {
                _applyImmediate(step.props);
                this._next();
                return;
            }

            _activeTweens++;
            const tw = new Konva.Tween({
                node: kNode,
                duration: step.durationSec,
                easing: step.easing,
                onFinish: () => {
                    _activeTweens--;
                    this._next();
                },
                ...konvaProps
            });
            tw.play();
        }
    };

    // EaselJS property name → Konva property name
    const _propMap = {
        alpha: "opacity",
        scaleX: "scaleX",
        scaleY: "scaleY",
        rotation: "rotation",
        x: "x",
        y: "y",
        visible: "visible"
    };

    const Tween = {
        get(node, opts) {
            if (opts && opts.override) {
                // cancel existing tweens on this node — approximated by doing nothing
            }
            return new TweenChain(node);
        },
        hasActiveTweens() {
            return _activeTweens > 0;
        }
    };

    // ── Ease ──────────────────────────────────────────────────────────────────

    const Ease = {
        circInOut: "circInOut",
        linear: "linear",
        quadInOut: "quadInOut",
        cubicIn: "cubicIn",
        bounceOut: "bounceOut",

        _konvaEasing(e) {
            const map = {
                circInOut: Konva.Easings.EaseInOut,
                linear: Konva.Easings.Linear,
                quadInOut: Konva.Easings.EaseInOut,
                cubicIn: Konva.Easings.EaseIn,
                bounceOut: Konva.Easings.BounceEaseOut
            };
            return map[e] || Konva.Easings.Linear;
        }
    };

    // ── Graphics (minimal — only getRGB is used) ──────────────────────────────

    const Graphics = {
        getRGB(r, g, b, a) {
            if (a !== undefined && a !== 1) return `rgba(${r},${g},${b},${a})`;
            return `rgb(${r},${g},${b})`;
        }
    };

    // ── DOMElement (stub — position a real DOM element over the canvas) ───────

    function DOMElement(el) {
        this.el = el;
        this._node = new Konva.Group({ visible: false }); // placeholder node
        Object.defineProperty(this, "x", {
            get() {
                return parseFloat(this.el.style.left) || 0;
            },
            set(v) {
                this.el.style.left = v + "px";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(this, "y", {
            get() {
                return parseFloat(this.el.style.top) || 0;
            },
            set(v) {
                this.el.style.top = v + "px";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(this, "visible", {
            get() {
                return this.el.style.display !== "none";
            },
            set(v) {
                this.el.style.display = v ? "" : "none";
            },
            enumerable: true,
            configurable: true
        });
        this.el.style.position = "absolute";
    }

    // ── LoadQueue (stub — not used in critical paths) ─────────────────────────

    function LoadQueue() {
        this._queue = [];
        this._listeners = {};
    }

    LoadQueue.prototype.on = function (evt, fn) {
        this._listeners[evt] = fn;
        return this;
    };

    LoadQueue.prototype.loadFile = function (item) {
        const img = new Image();
        img.onload = () => {
            this._listeners.complete && this._listeners.complete({ result: img });
        };
        img.onerror = () => {
            this._listeners.error && this._listeners.error();
        };
        img.src = typeof item === "string" ? item : item.src;
    };

    LoadQueue.prototype.loadManifest = function (items) {
        let loaded = 0;
        items.forEach(item => {
            const img = new Image();
            img.onload = () => {
                loaded++;
                if (loaded === items.length) this._listeners.complete && this._listeners.complete();
            };
            img.src = typeof item === "string" ? item : item.src;
        });
    };

    // ── Assemble `createjs` global ────────────────────────────────────────────

    global.createjs = {
        Stage,
        Container,
        Bitmap,
        Text,
        Shape,
        ColorFilter,
        Ticker,
        Touch,
        Tween,
        Ease,
        Graphics,
        DOMElement,
        LoadQueue
    };
})(typeof window !== "undefined" ? window : global);
