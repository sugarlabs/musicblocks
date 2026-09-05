require("../turtle");
const Turtle = global.Turtle;
// Mock all external dependencies
global.importMembers = jest.fn();
global.Singer = jest.fn().mockImplementation(() => ({
    attack: [],
    decay: [],
    sustain: [],
    release: [],
    scalarTransposition: 0,
    scalarTranspositionValues: [],
    transposition: 0,
    transpositionValues: [],
    register: 0,
    beatFactor: 1,
    dotCount: 0,
    noteBeat: {},
    noteValue: {},
    oscList: {},
    noteDrums: {},
    notePitches: {},
    noteOctaves: {},
    noteCents: {},
    noteHertz: {},
    noteBeatValues: {},
    embeddedGraphics: {},
    lastNotePlayed: null,
    previousNotePlayed: null,
    noteStatus: null,
    noteDirection: 0,
    pitchNumberOffset: 39,
    currentOctave: 4,
    inHarmonic: [],
    partials: [],
    inNeighbor: [],
    neighborStepPitch: [],
    neighborNoteValue: [],
    inDefineMode: false,
    defineMode: [],
    notesPlayed: [0, 1],
    whichNoteToCount: 1,
    movable: false,
    bpm: [],
    previousTurtleTime: 0,
    turtleTime: 0,
    pushedNote: false,
    duplicateFactor: 1,
    inDuplicate: false,
    skipFactor: 1,
    skipIndex: 0,
    instrumentNames: [],
    inCrescendo: [],
    crescendoDelta: [],
    crescendoInitialVolume: {},
    intervals: [],
    semitoneIntervals: [],
    staccato: [],
    glide: [],
    glideOverride: 0,
    swing: [],
    swingTarget: [],
    swingCarryOver: 0,
    tie: false,
    tieNotePitches: [],
    tieNoteExtras: [],
    tieCarryOver: 0,
    tieFirstDrums: [],
    drift: 0,
    maxLagCorrectionRatio: 0.25,
    drumStyle: [],
    voices: [],
    backward: [],
    vibratoIntensity: [],
    vibratoRate: [],
    distortionAmount: [],
    tremoloFrequency: [],
    tremoloDepth: [],
    rate: [],
    octaves: [],
    baseFrequency: [],
    chorusRate: [],
    delayTime: [],
    chorusDepth: [],
    neighborArgNote1: [],
    neighborArgNote2: [],
    neighborArgBeat: [],
    neighborArgCurrentBeat: [],
    inNoteBlock: [],
    multipleVoices: false,
    invertList: [],
    beatList: [],
    factorList: [],
    keySignature: "",
    pitchDrumTable: {},
    defaultStrongBeats: false,
    pickup: 0,
    beatsPerMeasure: 4,
    noteValuePerBeat: 4,
    currentBeat: 0,
    currentMeasure: 0,
    justCounting: [],
    justMeasuring: [],
    firstPitch: [],
    lastPitch: [],
    suppressOutput: false,
    dispatchFactor: 1,
    runningFromEvent: false
}));
global.Painter = jest.fn().mockImplementation(() => ({
    cp1x: 0,
    cp1y: 100,
    cp2x: 100,
    cp2y: 100
}));
global.delayExecution = jest.fn();
global.DEFAULTVOICE = "electronic synth";
global.DEFAULTVOLUME = 50;

describe("Turtle", () => {
    let turtle;
    let mockActivity;

    beforeEach(() => {
        mockActivity = { refreshCanvas: jest.fn() };
        turtle = new Turtle(mockActivity, 0, "turtle1", {}, null);
    });

    describe("blinking()", () => {
        it("should return false when _blinkFinished is true", () => {
            turtle._blinkFinished = true;
            expect(turtle.blinking()).toBe(false);
        });

        it("should return true when _blinkFinished is false", () => {
            turtle._blinkFinished = false;
            expect(turtle.blinking()).toBe(true);
        });
    });

    describe("doWait()", () => {
        it("should set _waitTime in milliseconds", () => {
            turtle.doWait(2);
            expect(turtle._waitTime).toBe(2000);
        });

        it("should handle decimal seconds", () => {
            turtle.doWait(0.5);
            expect(turtle._waitTime).toBe(500);
        });

        it("should handle string input by converting to number", () => {
            turtle.doWait("3");
            expect(turtle._waitTime).toBe(3000);
        });

        it("should set _waitTime to 0 when called with 0", () => {
            turtle.doWait(0);
            expect(turtle._waitTime).toBe(0);
        });
    });

    describe("initTurtle()", () => {
        it("should reset _waitTime to 0", () => {
            turtle.doWait(5);
            turtle.initTurtle(false);
            expect(turtle._waitTime).toBe(0);
        });

        it("should set embeddedGraphicsFinished to true", () => {
            turtle.embeddedGraphicsFinished = false;
            turtle.initTurtle(false);
            expect(turtle.embeddedGraphicsFinished).toBe(true);
        });

        it("should set inSetTimbre to false", () => {
            turtle.inSetTimbre = true;
            turtle.initTurtle(false);
            expect(turtle.inSetTimbre).toBe(false);
        });

        it("should reset singer.scalarTransposition to 0", () => {
            turtle.initTurtle(false);
            expect(turtle.singer.scalarTransposition).toBe(0);
        });

        it("should reset singer.register to 0", () => {
            turtle.initTurtle(false);
            expect(turtle.singer.register).toBe(0);
        });

        it("should reset singer.beatFactor to 1", () => {
            turtle.initTurtle(false);
            expect(turtle.singer.beatFactor).toBe(1);
        });

        it("should set singer.keySignature to C major", () => {
            turtle.initTurtle(false);
            expect(turtle.singer.keySignature).toBe("C major");
        });

        it("should set singer.beatsPerMeasure to 4", () => {
            turtle.initTurtle(false);
            expect(turtle.singer.beatsPerMeasure).toBe(4);
        });

        it("should set singer.noteValuePerBeat to 4", () => {
            turtle.initTurtle(false);
            expect(turtle.singer.noteValuePerBeat).toBe(4);
        });

        it("should set singer.currentOctave to 4", () => {
            turtle.initTurtle(false);
            expect(turtle.singer.currentOctave).toBe(4);
        });

        it("should set singer.suppressOutput to the passed argument", () => {
            turtle.initTurtle(true);
            expect(turtle.singer.suppressOutput).toBe(true);
        });

        it("should set singer.suppressOutput to false when passed false", () => {
            turtle.initTurtle(false);
            expect(turtle.singer.suppressOutput).toBe(false);
        });

        it("should initialize singer.notesPlayed to [0, 1]", () => {
            turtle.initTurtle(false);
            expect(turtle.singer.notesPlayed).toEqual([0, 1]);
        });

        it("should reset singer.tie to false", () => {
            turtle.singer.tie = true;
            turtle.initTurtle(false);
            expect(turtle.singer.tie).toBe(false);
        });

        it("should reset singer.transposition to 0", () => {
            turtle.initTurtle(false);
            expect(turtle.singer.transposition).toBe(0);
        });

        it("should initialize endOfClampSignals as empty object", () => {
            turtle.initTurtle(false);
            expect(turtle.endOfClampSignals).toEqual({});
        });

        it("should initialize butNotThese as empty object", () => {
            turtle.initTurtle(false);
            expect(turtle.butNotThese).toEqual({});
        });
    });

    describe("Cache Management (_createCache & updateCache)", () => {
        beforeEach(() => {
            global.retryWithBackoff = jest.fn(async ({ check, onSuccess, onRetry }) => {
                const res = check ? check() : true;
                if (onRetry) onRetry(0);
                if (onSuccess) await onSuccess(res);
                return res;
            });
        });

        it("_createCache should get bounds and cache container", async () => {
            const mockBounds = { x: 5, y: 15, width: 80, height: 80 };
            turtle.container = {
                getBounds: jest.fn().mockReturnValue(mockBounds),
                cache: jest.fn()
            };

            await turtle._createCache();

            expect(turtle.bounds).toEqual(mockBounds);
            expect(turtle.container.cache).toHaveBeenCalledWith(5, 15, 80, 80);
        });

        it("updateCache should update container cache and refresh canvas", async () => {
            turtle.bounds = { x: 0, y: 0, width: 100, height: 100 };
            turtle.container = {
                bitmapCache: {},
                updateCache: jest.fn()
            };

            await turtle.updateCache();

            expect(turtle.container.updateCache).toHaveBeenCalled();
            expect(mockActivity.refreshCanvas).toHaveBeenCalled();
        });
    });
});

// ---------------------------------------------------------------------------
// stopBlink
//
// The guard is what makes this worth pinning. It runs only when a blink is
// pending or unfinished, and a turtle that is not blinking must be left alone
// rather than have its container forced visible.
// ---------------------------------------------------------------------------

describe("Turtle stopBlink()", () => {
    let turtle;
    let mockActivity;

    beforeEach(() => {
        mockActivity = { refreshCanvas: jest.fn() };
        turtle = new Turtle(mockActivity, 0, "turtle1", {}, null);
        turtle.container = { visible: false };
    });

    it("restores visibility and finishes the blink when one is pending", () => {
        turtle._blinkTimeout = 1234;
        turtle._blinkFinished = false;

        turtle.stopBlink();

        expect(turtle._blinkTimeout).toBeNull();
        expect(turtle.container.visible).toBe(true);
        expect(turtle._blinkFinished).toBe(true);
        expect(mockActivity.refreshCanvas).toHaveBeenCalledTimes(1);
    });

    it("runs when the blink is unfinished even with no pending timeout", () => {
        turtle._blinkTimeout = null;
        turtle._blinkFinished = false;

        turtle.stopBlink();

        expect(turtle._blinkFinished).toBe(true);
        expect(turtle.container.visible).toBe(true);
        expect(mockActivity.refreshCanvas).toHaveBeenCalledTimes(1);
    });

    it("clears the pending timeout so a queued blink cannot fire later", () => {
        const clearSpy = jest.spyOn(global, "clearTimeout");
        turtle._blinkTimeout = 4321;
        turtle._blinkFinished = false;

        turtle.stopBlink();

        expect(clearSpy).toHaveBeenCalledWith(4321);
        clearSpy.mockRestore();
    });

    it("leaves a turtle that is not blinking untouched", () => {
        turtle._blinkTimeout = null;
        turtle._blinkFinished = true;

        turtle.stopBlink();

        // The container stays hidden. Forcing it visible here would reveal a
        // turtle the caller had deliberately hidden.
        expect(turtle.container.visible).toBe(false);
        expect(mockActivity.refreshCanvas).not.toHaveBeenCalled();
    });

    it("is safe to call twice, refreshing the canvas only for the first call", () => {
        turtle._blinkTimeout = 99;
        turtle._blinkFinished = false;

        turtle.stopBlink();
        turtle.stopBlink();

        expect(mockActivity.refreshCanvas).toHaveBeenCalledTimes(1);
        expect(turtle._blinkTimeout).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Accessors
//
// Every one of these is a named door onto a private field, and callers across
// the codebase reach the turtle only through them. A setter wired to the wrong
// field would silently drop writes, so each pair is checked by writing through
// the setter and reading both the getter and the field behind it.
// ---------------------------------------------------------------------------

describe("Turtle accessors", () => {
    let turtle;

    beforeEach(() => {
        turtle = new Turtle({ refreshCanvas: jest.fn() }, 0, "turtle1", {}, null);
    });

    describe("read and write pairs", () => {
        it.each([
            ["startBlock", "_startBlock", { name: "start" }],
            ["queue", "_queue", [{ blk: 1 }]],
            ["parentFlowQueue", "_parentFlowQueue", [7]],
            ["unhighlightQueue", "_unhighlightQueue", [8]],
            ["parameterQueue", "_parameterQueue", [9]],
            ["listeners", "_listeners", { CursorOver0: () => {} }],
            ["media", "_media", [{ type: "gif" }]],
            ["x", "_x", 42],
            ["y", "_y", -17],
            ["running", "_running", true],
            ["inTrash", "_trash", true],
            ["container", "_container", { x: 1, y: 2 }],
            ["bitmap", "_bitmap", { scaleX: 1 }],
            ["imageContainer", "_imageContainer", { children: [] }],
            ["penstrokes", "_penstrokes", { image: null }],
            ["skinChanged", "_skinChanged", true],
            ["orientation", "_orientation", 90]
        ])("%s writes to %s and reads the same value back", (accessor, field, value) => {
            turtle[accessor] = value;

            expect(turtle[field]).toBe(value);
            expect(turtle[accessor]).toBe(value);
        });

        it("inTrash is backed by _trash, not by a field of its own name", () => {
            turtle.inTrash = true;

            // The accessor and the field deliberately differ in name here, so
            // a rename on either side has to keep this mapping.
            expect(turtle._trash).toBe(true);
            expect(turtle._inTrash).toBeUndefined();
        });

        it.each([
            ["x", 0],
            ["y", 0],
            ["orientation", 0]
        ])("%s accepts zero rather than treating it as unset", (accessor, zero) => {
            turtle[accessor] = 5;
            turtle[accessor] = zero;

            expect(turtle[accessor]).toBe(0);
        });

        it("x and y hold negative coordinates, since the canvas origin is centred", () => {
            turtle.x = -250;
            turtle.y = -125;

            expect(turtle.x).toBe(-250);
            expect(turtle.y).toBe(-125);
        });

        it("running and skinChanged keep false rather than falling back to a default", () => {
            turtle.running = true;
            turtle.running = false;
            turtle.skinChanged = true;
            turtle.skinChanged = false;

            expect(turtle.running).toBe(false);
            expect(turtle.skinChanged).toBe(false);
        });

        it("queue accepts an empty array, which is how a finished turtle is left", () => {
            turtle.queue = [{ blk: 1 }];
            turtle.queue = [];

            expect(turtle.queue).toEqual([]);
        });

        it("container accepts null, which is how a turtle is torn down", () => {
            turtle.container = { x: 0 };
            turtle.container = null;

            expect(turtle.container).toBeNull();
        });
    });

    describe("read only accessors", () => {
        it.each([
            ["waitTime", "_waitTime", 1500],
            ["id", "_id", 3],
            ["name", "_name", "Mr. Mouse"],
            ["turtles", "_turtles", { scale: 2 }],
            ["decorationBitmap", "_decorationBitmap", { name: "decoration" }],
            ["canvas", "_canvas", { width: 1200 }],
            ["ctx", "_ctx", { fillStyle: "#000" }]
        ])("%s reports what is held in %s", (accessor, field, value) => {
            turtle[field] = value;

            expect(turtle[accessor]).toBe(value);
        });

        it("id reports 0 rather than treating the first turtle as unset", () => {
            turtle._id = 0;

            expect(turtle.id).toBe(0);
        });

        it("waitTime reflects a wait set through doWait", () => {
            turtle.doWait(2);

            expect(turtle.waitTime).toBe(2000);
        });
    });
});

// ---------------------------------------------------------------------------
// Turtle.TurtleModel
//
// Constructed directly. The Turtle constructor folds the model in through
// importMembers, which is mocked in this file, so the model's own defaults are
// only observable on a real instance of it.
// ---------------------------------------------------------------------------

describe("Turtle.TurtleModel", () => {
    let activity;
    let turtles;

    beforeEach(() => {
        activity = { refreshCanvas: jest.fn() };
        turtles = { getIndexOfTurtle: jest.fn(() => 4) };
    });

    describe("constructor", () => {
        it("keeps the identity it is handed", () => {
            const startBlock = { name: "start" };
            const model = new Turtle.TurtleModel(activity, 2, "Mr. Mouse", turtles, startBlock);

            expect(model.activity).toBe(activity);
            expect(model._id).toBe(2);
            expect(model._name).toBe("Mr. Mouse");
            expect(model._turtles).toBe(turtles);
            expect(model._startBlock).toBe(startBlock);
        });

        it("starts every queue empty rather than undefined", () => {
            const model = new Turtle.TurtleModel(activity, 0, "t", turtles, null);

            expect(model._queue).toEqual([]);
            expect(model._parentFlowQueue).toEqual([]);
            expect(model._unhighlightQueue).toEqual([]);
            expect(model._parameterQueue).toEqual([]);
            expect(model._media).toEqual([]);
        });

        it("starts at the origin, stopped, and out of the trash", () => {
            const model = new Turtle.TurtleModel(activity, 0, "t", turtles, null);

            expect(model._x).toBe(0);
            expect(model._y).toBe(0);
            expect(model._running).toBe(false);
            expect(model._trash).toBe(false);
        });

        it("starts the signal and listener maps empty", () => {
            const model = new Turtle.TurtleModel(activity, 0, "t", turtles, null);

            expect(model._listeners).toEqual({});
            expect(model.endOfClampSignals).toEqual({});
            expect(model.butNotThese).toEqual({});
            expect(model.delayTimeout).toBeNull();
            expect(model.delayParameters).toEqual({});
        });

        it("gives each turtle its own queues rather than a shared array", () => {
            const first = new Turtle.TurtleModel(activity, 0, "a", turtles, null);
            const second = new Turtle.TurtleModel(activity, 1, "b", turtles, null);

            first._queue.push({ blk: 1 });

            expect(second._queue).toEqual([]);
        });
    });

    describe("rename", () => {
        /**
         * Builds a start block shaped the way rename expects to find one.
         * @returns {Object} A start block with the fields rename writes to.
         */
        function makeStartBlock() {
            return {
                overrideName: "",
                collapseText: { text: "" },
                value: null,
                regenerateArtwork: jest.fn()
            };
        }

        it("carries the new name onto the start block label", () => {
            const startBlock = makeStartBlock();
            const model = new Turtle.TurtleModel(activity, 0, "old", turtles, startBlock);

            model.rename("Mr. Mouse");

            expect(model._name).toBe("Mr. Mouse");
            expect(startBlock.overrideName).toBe("Mr. Mouse");
            expect(startBlock.collapseText.text).toBe("Mr. Mouse");
        });

        it("redraws the block and stamps its position in the turtle list", () => {
            const startBlock = makeStartBlock();
            const model = new Turtle.TurtleModel(activity, 0, "old", turtles, startBlock);

            model.rename("Mr. Mouse");

            expect(startBlock.regenerateArtwork).toHaveBeenCalledWith(false);
            expect(turtles.getIndexOfTurtle).toHaveBeenCalledWith(model);
            expect(startBlock.value).toBe(4);
        });

        it("renames a turtle that has no start block without throwing", () => {
            const model = new Turtle.TurtleModel(activity, 0, "old", turtles, null);

            expect(() => model.rename("Mr. Mouse")).not.toThrow();
            expect(model._name).toBe("Mr. Mouse");
            expect(turtles.getIndexOfTurtle).not.toHaveBeenCalled();
        });

        it("treats an undefined start block the same as a missing one", () => {
            const model = new Turtle.TurtleModel(activity, 0, "old", turtles, undefined);

            model.rename("Mr. Mouse");

            expect(model._name).toBe("Mr. Mouse");
            expect(turtles.getIndexOfTurtle).not.toHaveBeenCalled();
        });

        it("accepts an empty name, which clears the label rather than keeping the old one", () => {
            const startBlock = makeStartBlock();
            startBlock.overrideName = "old";
            const model = new Turtle.TurtleModel(activity, 0, "old", turtles, startBlock);

            model.rename("");

            expect(model._name).toBe("");
            expect(startBlock.overrideName).toBe("");
            expect(startBlock.collapseText.text).toBe("");
        });
    });
});

// ---------------------------------------------------------------------------
// Turtle.TurtleView
//
// Constructed directly, for the same reason as the model. The view reaches the
// turtle through members that importMembers folds in, so those are assigned on
// the instance here: on a real turtle they arrive the same way, as plain
// properties rather than as anything the view defines itself.
// ---------------------------------------------------------------------------

describe("Turtle.TurtleView", () => {
    let ctxStub;
    let canvasStub;
    let getElementByIdSpy;
    let images;

    beforeEach(() => {
        ctxStub = { fillStyle: "#000", clearRect: jest.fn() };
        canvasStub = { width: 1200, height: 900, getContext: jest.fn(() => ctxStub) };
        getElementByIdSpy = jest
            .spyOn(document, "getElementById")
            .mockImplementation(id => (id === "overlayCanvas" ? canvasStub : null));

        // Nothing loads in jsdom, so every Image is recorded and its onload is
        // fired by hand once the code under test has attached one.
        images = [];
        // Deliberately not square, so a width used where a height belongs
        // shows up as a wrong number rather than passing unnoticed.
        global.Image = function Image() {
            this.width = 55;
            this.height = 40;
            this.src = "";
            this.onload = null;
            images.push(this);
        };

        global.createjs = {
            Bitmap: function Bitmap(source) {
                this.source = source;
                this.x = 0;
                this.y = 0;
                this.regX = 0;
                this.regY = 0;
                this.scaleX = 1;
                this.scaleY = 1;
                this.scale = 1;
                this.rotation = 0;
                this.name = "";
                this.cursor = "";
                this.clone = jest.fn(() => new global.createjs.Bitmap(source));
            },
            Text: function Text(text, font, color) {
                this.text = text;
                this.font = font;
                this.color = color;
                this.x = 0;
                this.y = 0;
                this.rotation = 0;
                this.textAlign = "";
                this.textBaseline = "";
                // Ten pixels a character is enough to make wrapping decidable.
                this.getMeasuredWidth = () => this.text.length * 10;
                this.getMeasuredHeight = () => 20;
            },
            Shape: function Shape() {
                this.x = 0;
                this.y = 0;
                this.graphics = {
                    beginFill: jest.fn(function () {
                        return this;
                    }),
                    drawRect: jest.fn(function () {
                        return this;
                    })
                };
            }
        };

        global.base64Encode = jest.fn(data => "encoded:" + data);
        window.btoa = jest.fn(s => "b64(" + s + ")");
    });

    afterEach(() => {
        getElementByIdSpy.mockRestore();
    });

    /**
     * Builds a view with the members importMembers would have supplied.
     * @returns {Object} A TurtleView ready to draw.
     */
    function makeView() {
        const view = new Turtle.TurtleView();
        view.activity = { refreshCanvas: jest.fn(), gifAnimator: null };
        view.container = {
            x: 100,
            y: 50,
            hitArea: null,
            addChild: jest.fn(),
            removeChild: jest.fn(),
            uncache: jest.fn(),
            cache: jest.fn(),
            getBounds: jest.fn(() => ({ x: -30, y: -30, width: 60, height: 60 }))
        };
        view.orientation = 0;
        view._media = [];
        view._startBlock = null;
        view._createCache = jest.fn();
        view.painter = { font: "sans-serif", canvasColor: "#f00", svgOutput: "" };
        view.turtles = { scale: 1, stage: { canvas: canvasStub, addChild: jest.fn() } };
        return view;
    }

    /**
     * Builds a start block shaped the way the view expects to decorate one.
     * @returns {Object} A start block with a container and proto scale.
     */
    function makeStartBlock() {
        return {
            width: 200,
            protoblock: { scale: 2 },
            container: { addChild: jest.fn(), removeChild: jest.fn() },
            updateCache: jest.fn()
        };
    }

    describe("constructor", () => {
        it("starts with no artwork attached", () => {
            const view = new Turtle.TurtleView();

            expect(view._decorationBitmap).toBeNull();
            expect(view._container).toBeNull();
            expect(view._bitmap).toBeNull();
            expect(view._imageContainer).toBeNull();
            expect(view._penstrokes).toBeNull();
        });

        it("starts unrotated, unskinned, and at the documented base scale", () => {
            const view = new Turtle.TurtleView();

            expect(view._orientation).toBe(0);
            expect(view._skinChanged).toBe(false);
            expect(view._decorationBaseScale).toBe(0.5);
        });

        it("takes its drawing context from the overlay canvas", () => {
            const view = new Turtle.TurtleView();

            expect(getElementByIdSpy).toHaveBeenCalledWith("overlayCanvas");
            expect(view._canvas).toBe(canvasStub);
            expect(canvasStub.getContext).toHaveBeenCalledWith("2d");
            expect(view._ctx).toBe(ctxStub);
        });
    });

    describe("resizeDecoration", () => {
        it("places and scales the decoration from the block width and scale", () => {
            const view = makeView();
            view._decorationBitmap = new createjs.Bitmap("shell.png");

            view.resizeDecoration(2, 200);

            // x = width - (30 * scale) / 2, y = (20 * scale) / 2
            expect(view._decorationBitmap.x).toBe(170);
            expect(view._decorationBitmap.y).toBe(20);
        });

        it("keeps the three scale fields in step, since createjs reads all of them", () => {
            const view = makeView();
            view._decorationBitmap = new createjs.Bitmap("shell.png");

            view.resizeDecoration(2, 200);

            // (baseScale * scale) / 2, with the default base scale of 0.5
            expect(view._decorationBitmap.scaleX).toBe(0.5);
            expect(view._decorationBitmap.scaleY).toBe(0.5);
            expect(view._decorationBitmap.scale).toBe(0.5);
        });

        it("uses the base scale a shell image left behind rather than the default", () => {
            const view = makeView();
            view._decorationBitmap = new createjs.Bitmap("shell.png");
            view._decorationBaseScale = 0.25;

            view.resizeDecoration(2, 200);

            expect(view._decorationBitmap.scaleX).toBe(0.25);
        });

        it("collapses the decoration to nothing at a scale of zero", () => {
            const view = makeView();
            view._decorationBitmap = new createjs.Bitmap("shell.png");

            view.resizeDecoration(0, 100);

            expect(view._decorationBitmap.x).toBe(100);
            expect(view._decorationBitmap.y).toBe(0);
            expect(view._decorationBitmap.scale).toBe(0);
        });
    });

    describe("_updateMediaPositions", () => {
        it("moves static images onto the turtle and turns them with it", () => {
            const view = makeView();
            const bitmap = new createjs.Bitmap("photo.png");
            view._media = [bitmap];
            view.container.x = 120;
            view.container.y = -40;
            view.orientation = 90;

            view._updateMediaPositions();

            expect(bitmap.x).toBe(120);
            expect(bitmap.y).toBe(-40);
            expect(bitmap.rotation).toBe(90);
        });

        it("hands gif positions to the animator instead of moving them directly", () => {
            const view = makeView();
            view.activity.gifAnimator = { updatePosition: jest.fn() };
            view._media = [{ type: "gif", id: "gif-1" }];
            view.container.x = 10;
            view.container.y = 20;
            view.orientation = 45;

            view._updateMediaPositions();

            expect(view.activity.gifAnimator.updatePosition).toHaveBeenCalledWith(
                "gif-1",
                10,
                20,
                45
            );
        });

        it("leaves gifs alone when no animator is present", () => {
            const view = makeView();
            view.activity.gifAnimator = null;
            const gif = { type: "gif", id: "gif-1" };
            view._media = [gif];

            expect(() => view._updateMediaPositions()).not.toThrow();
            expect(gif.x).toBeUndefined();
        });

        it("moves the images in a mixed list and leaves the rest untouched", () => {
            const view = makeView();
            view.activity.gifAnimator = { updatePosition: jest.fn() };
            const bitmap = new createjs.Bitmap("photo.png");
            const text = new createjs.Text("hello", "12px sans-serif", "#000");
            view._media = [bitmap, { type: "gif", id: "g" }, text];
            view.container.x = 7;

            view._updateMediaPositions();

            expect(bitmap.x).toBe(7);
            expect(view.activity.gifAnimator.updatePosition).toHaveBeenCalledTimes(1);
            // Text is repositioned when it is drawn, not by this pass.
            expect(text.x).toBe(0);
        });

        it("does nothing when there is no media list at all", () => {
            const view = makeView();
            view._media = null;

            expect(() => view._updateMediaPositions()).not.toThrow();
        });

        it("does nothing for an empty media list", () => {
            const view = makeView();
            view._media = [];
            view.activity.gifAnimator = { updatePosition: jest.fn() };

            view._updateMediaPositions();

            expect(view.activity.gifAnimator.updatePosition).not.toHaveBeenCalled();
        });
    });

    describe("doTurtleShell", () => {
        it("ignores a null image rather than starting a load", () => {
            const view = makeView();

            view.doTurtleShell(55, null);

            expect(images).toHaveLength(0);
        });

        it("starts loading the image it was given", () => {
            const view = makeView();

            view.doTurtleShell(55, "shell.png");

            expect(images).toHaveLength(1);
            expect(images[0].src).toBe("shell.png");
        });

        it("swaps the old bitmap for the new one once the image loads", () => {
            const view = makeView();
            const previous = new createjs.Bitmap("old.png");
            view._bitmap = previous;

            view.doTurtleShell(55, "shell.png");
            images[0].onload();

            expect(view.container.removeChild).toHaveBeenCalledWith(previous);
            expect(view._bitmap).not.toBe(previous);
            expect(view.container.addChild).toHaveBeenCalledWith(view._bitmap);
        });

        it("scales the shell to the requested size and centres it on the turtle", () => {
            const view = makeView();
            view.orientation = 30;

            view.doTurtleShell(110, "shell.png");
            images[0].onload();

            // Image is 55 wide, so a 110 shell is scaled by two.
            expect(view._bitmap.scaleX).toBe(2);
            expect(view._bitmap.scaleY).toBe(2);
            expect(view._bitmap.scale).toBe(2);
            // Registration is half the image, and the image is 55 by 40, so
            // these must not agree with each other.
            expect(view._bitmap.regX).toBe(27.5);
            expect(view._bitmap.regY).toBe(20);
            expect(view._bitmap.x).toBe(0);
            expect(view._bitmap.y).toBe(0);
            expect(view._bitmap.rotation).toBe(30);
        });

        it("accepts the size as a string, as a block argument arrives", () => {
            const view = makeView();

            view.doTurtleShell("110", "shell.png");
            images[0].onload();

            expect(view._bitmap.scaleX).toBe(2);
        });

        it("marks the skin as changed and recaches against the new bounds", () => {
            const view = makeView();

            view.doTurtleShell(55, "shell.png");
            images[0].onload();

            expect(view._skinChanged).toBe(true);
            expect(view.container.uncache).toHaveBeenCalled();
            expect(view.container.cache).toHaveBeenCalledWith(-30, -30, 60, 60);
        });

        it("rebuilds the hit area to match the new bounds", () => {
            const view = makeView();

            view.doTurtleShell(55, "shell.png");
            images[0].onload();

            expect(view.container.hitArea).not.toBeNull();
            expect(view.container.hitArea.x).toBe(-30);
            expect(view.container.hitArea.y).toBe(-30);
            expect(view.container.hitArea.graphics.drawRect).toHaveBeenCalledWith(0, 0, 60, 60);
        });

        it("adds a decoration to the start block and records its base scale", () => {
            const view = makeView();
            const startBlock = makeStartBlock();
            view._startBlock = startBlock;

            view.doTurtleShell(55, "shell.png");
            images[0].onload();

            expect(startBlock.container.addChild).toHaveBeenCalledWith(view._decorationBitmap);
            expect(view._decorationBitmap.name).toBe("decoration");
            // 27.5 / image width of 55
            expect(view._decorationBaseScale).toBe(0.5);
            // scaleY is driven by the height instead, so the two differ.
            expect(view._decorationBitmap.scaleX).toBe(0.5);
            expect(view._decorationBitmap.scaleY).toBe(0.6875);
            expect(startBlock.updateCache).toHaveBeenCalled();
        });

        it("removes the previous decoration before adding the replacement", () => {
            const view = makeView();
            const startBlock = makeStartBlock();
            view._startBlock = startBlock;
            const previous = new createjs.Bitmap("old.png");
            view._decorationBitmap = previous;

            view.doTurtleShell(55, "shell.png");
            images[0].onload();

            expect(startBlock.container.removeChild).toHaveBeenCalledWith(previous);
            expect(view._decorationBitmap).not.toBe(previous);
        });

        it("skips the decoration entirely when there is no start block", () => {
            const view = makeView();
            view._startBlock = null;

            view.doTurtleShell(55, "shell.png");
            images[0].onload();

            expect(view._decorationBitmap).toBeNull();
            expect(view.activity.refreshCanvas).toHaveBeenCalled();
        });
    });

    describe("doShowText", () => {
        it("ignores null text rather than drawing an empty label", () => {
            const view = makeView();

            view.doShowText(20, null);

            expect(view.turtles.stage.addChild).not.toHaveBeenCalled();
            expect(view._media).toEqual([]);
        });

        it("draws the text on the stage and keeps it for later clearing", () => {
            const view = makeView();

            view.doShowText(20, "hi");

            expect(view.turtles.stage.addChild).toHaveBeenCalledTimes(1);
            expect(view._media).toHaveLength(1);
            expect(view._media[0].text).toBe("hi");
            expect(view.activity.refreshCanvas).toHaveBeenCalled();
        });

        it("builds the font from the size and the painter font", () => {
            const view = makeView();

            view.doShowText(24, "hi");

            expect(view._media[0].font).toBe("24px sans-serif");
            expect(view._media[0].color).toBe("#f00");
        });

        it("places the text at the turtle and turns it to match", () => {
            const view = makeView();
            view.container.x = 60;
            view.container.y = 25;
            view.orientation = 15;

            view.doShowText(20, "hi");

            expect(view._media[0].x).toBe(60);
            expect(view._media[0].y).toBe(25);
            expect(view._media[0].rotation).toBe(15);
        });

        it("turns a number into text rather than dropping it", () => {
            const view = makeView();

            view.doShowText(20, 42);

            expect(view._media).toHaveLength(1);
            expect(view._media[0].text).toBe("42");
        });

        it("draws each escaped newline as its own line, stacked downwards", () => {
            const view = makeView();

            view.doShowText(20, "one\\ntwo");

            expect(view._media).toHaveLength(2);
            expect(view._media[0].text).toBe("one");
            expect(view._media[1].text).toBe("two");
            expect(view._media[1].y).toBeGreaterThan(view._media[0].y);
        });

        it("wraps a line that will not fit the remaining canvas width", () => {
            const view = makeView();
            view.container.x = 0;
            view.turtles.stage.canvas = { width: 100 };

            // Eighty characters at ten pixels each cannot fit in the 80 that
            // remain once the twenty pixel margin is taken off.
            view.doShowText(20, "x".repeat(80));

            expect(view._media.length).toBeGreaterThan(1);
        });

        it("does not wrap rotated text, since the width no longer applies", () => {
            const view = makeView();
            view.container.x = 0;
            view.orientation = 45;
            view.turtles.stage.canvas = { width: 100 };

            view.doShowText(20, "x".repeat(80));

            expect(view._media).toHaveLength(1);
        });

        it("emits an svg text element carrying the scaled position and size", () => {
            const view = makeView();
            view.turtles.scale = 2;
            view.container.x = 30;
            view.container.y = 10;

            view.doShowText(20, "hi");

            expect(view.painter.svgOutput).toContain('x="60"');
            expect(view.painter.svgOutput).toContain('font-size = "40"');
            expect(view.painter.svgOutput).toContain(">hi</text>");
        });

        it("draws an empty string as a single empty line", () => {
            const view = makeView();

            view.doShowText(20, "");

            expect(view._media).toHaveLength(1);
            expect(view._media[0].text).toBe("");
        });
    });

    describe("doShowImage", () => {
        /**
         * Extends a view with the members doShowImage reaches for.
         * @param {Object} view - view returned by makeView
         * @returns {Object} The same view, ready to show an image.
         */
        function withImageMembers(view) {
            view.imageContainer = { addChild: jest.fn() };
            view._activeGifId = null;
            view._ctx = {
                save: jest.fn(),
                restore: jest.fn(),
                translate: jest.fn(),
                rotate: jest.fn(),
                clearRect: jest.fn()
            };
            return view;
        }

        it("ignores a null image rather than starting a load", async () => {
            const view = withImageMembers(makeView());

            await view.doShowImage(55, null);

            expect(images).toHaveLength(0);
            expect(view._media).toEqual([]);
        });

        it("draws a static image onto the turtle at the requested size", async () => {
            const view = withImageMembers(makeView());
            view.container.x = 80;
            view.container.y = 20;
            view.orientation = 15;

            await view.doShowImage(110, "photo.png");
            images[0].onload();

            const bitmap = view._media[0];
            expect(view.imageContainer.addChild).toHaveBeenCalledWith(bitmap);
            expect(bitmap.scaleX).toBe(2);
            expect(bitmap.scaleY).toBe(2);
            expect(bitmap.x).toBe(80);
            expect(bitmap.y).toBe(20);
            expect(bitmap.regX).toBe(27.5);
            expect(bitmap.regY).toBe(20);
            expect(bitmap.rotation).toBe(15);
            expect(view.activity.refreshCanvas).toHaveBeenCalled();
        });

        it("hands an animated gif to the animator instead of drawing a bitmap", async () => {
            const view = withImageMembers(makeView());
            view.activity.gifAnimator = {
                isAnimatedGIF: jest.fn(() => true),
                createAnimation: jest.fn(async () => "gif-7"),
                stopAnimation: jest.fn()
            };
            view.container.x = 30;
            view.container.y = 40;
            view.orientation = 90;

            await view.doShowImage(64, "dance.gif");

            expect(view.activity.gifAnimator.createAnimation).toHaveBeenCalledWith(
                "dance.gif",
                view._canvas,
                30,
                40,
                64,
                64,
                90
            );
            expect(view._activeGifId).toBe("gif-7");
            expect(view._media[0]).toMatchObject({ type: "gif", id: "gif-7" });
            // No static bitmap is loaded once the animator takes the frame.
            expect(images).toHaveLength(0);
        });

        it("gives the recorded gif a stop handle that reaches the animator", async () => {
            const view = withImageMembers(makeView());
            const gifAnimator = {
                isAnimatedGIF: jest.fn(() => true),
                createAnimation: jest.fn(async () => "gif-7"),
                stopAnimation: jest.fn()
            };
            view.activity.gifAnimator = gifAnimator;

            await view.doShowImage(64, "dance.gif");
            view._media[0].stop();

            expect(gifAnimator.stopAnimation).toHaveBeenCalledWith("gif-7");
        });

        it("stops and wipes a previous gif before loading the next one", async () => {
            const view = withImageMembers(makeView());
            view._activeGifId = "gif-old";
            view.container.x = 12;
            view.container.y = 34;
            view.orientation = 180;
            view.activity.gifAnimator = {
                isAnimatedGIF: jest.fn(() => false),
                createAnimation: jest.fn(),
                stopAnimation: jest.fn()
            };

            await view.doShowImage(55, "photo.png");

            expect(view.activity.gifAnimator.stopAnimation).toHaveBeenCalledWith("gif-old");
            expect(view._ctx.translate).toHaveBeenCalledWith(12, 34);
            expect(view._ctx.rotate).toHaveBeenCalledWith(Math.PI);
            expect(view._ctx.clearRect).toHaveBeenCalledWith(-500, -500, 1000, 1000);
            expect(view._ctx.save).toHaveBeenCalledTimes(1);
            expect(view._ctx.restore).toHaveBeenCalledTimes(1);
            expect(view._activeGifId).toBeNull();
        });

        it("does not wipe the canvas when no gif is active", async () => {
            const view = withImageMembers(makeView());
            view._activeGifId = null;

            await view.doShowImage(55, "photo.png");

            expect(view._ctx.clearRect).not.toHaveBeenCalled();
        });

        it("falls back to a static bitmap when the gif turns out to be single frame", async () => {
            const view = withImageMembers(makeView());
            view.activity.gifAnimator = {
                isAnimatedGIF: jest.fn(() => true),
                // A null id is how the animator reports a one frame gif.
                createAnimation: jest.fn(async () => null),
                stopAnimation: jest.fn()
            };

            await view.doShowImage(55, "still.gif");
            images[0].onload();

            expect(view._activeGifId).toBeNull();
            expect(view.imageContainer.addChild).toHaveBeenCalled();
            expect(view._media[0].source).toBe(images[0]);
        });

        it("falls back to a static bitmap when the animator throws", async () => {
            const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
            const view = withImageMembers(makeView());
            view.activity.gifAnimator = {
                isAnimatedGIF: jest.fn(() => true),
                createAnimation: jest.fn(async () => {
                    throw new Error("decode failed");
                }),
                stopAnimation: jest.fn()
            };

            await view.doShowImage(55, "broken.gif");
            images[0].onload();

            expect(warn).toHaveBeenCalled();
            expect(view.imageContainer.addChild).toHaveBeenCalled();
            expect(view._media).toHaveLength(1);
            warn.mockRestore();
        });

        it("treats a non-gif as a static image without asking the animator to animate", async () => {
            const view = withImageMembers(makeView());
            view.activity.gifAnimator = {
                isAnimatedGIF: jest.fn(() => false),
                createAnimation: jest.fn(),
                stopAnimation: jest.fn()
            };

            await view.doShowImage(55, "photo.png");

            expect(view.activity.gifAnimator.isAnimatedGIF).toHaveBeenCalledWith("photo.png");
            expect(view.activity.gifAnimator.createAnimation).not.toHaveBeenCalled();
            expect(images).toHaveLength(1);
        });

        it("loads a static image when there is no animator at all", async () => {
            const view = withImageMembers(makeView());
            view.activity.gifAnimator = null;

            await view.doShowImage(55, "photo.png");

            expect(images).toHaveLength(1);
            expect(images[0].src).toBe("photo.png");
        });

        it("accepts the size as a string, as a block argument arrives", async () => {
            const view = withImageMembers(makeView());

            await view.doShowImage("110", "photo.png");
            images[0].onload();

            expect(view._media[0].scaleX).toBe(2);
        });
    });

    describe("makeTurtleBitmap", () => {
        it("encodes the svg data into the image source", () => {
            const view = makeView();
            const activity = { refreshCanvas: jest.fn() };

            view.makeTurtleBitmap("<svg/>", activity, false);

            expect(global.base64Encode).toHaveBeenCalledWith("<svg/>");
            expect(images[0].src).toBe("data:image/svg+xml;base64,b64(encoded:<svg/>)");
        });

        it("attaches the bitmap to the turtle and caches it once loaded", () => {
            const view = makeView();
            const activity = { refreshCanvas: jest.fn() };

            view.makeTurtleBitmap("<svg/>", activity, false);
            images[0].onload();

            expect(view._bitmap).not.toBeNull();
            expect(view._bitmap.regX).toBe(27);
            expect(view._bitmap.regY).toBe(27);
            expect(view._bitmap.cursor).toBe("pointer");
            expect(view.container.addChild).toHaveBeenCalledWith(view._bitmap);
            expect(view._createCache).toHaveBeenCalled();
            expect(activity.refreshCanvas).toHaveBeenCalled();
        });

        it("clones the bitmap onto the start block when turtle artwork is used", () => {
            const view = makeView();
            const startBlock = makeStartBlock();
            view._startBlock = startBlock;
            const activity = { refreshCanvas: jest.fn() };

            view.makeTurtleBitmap("<svg/>", activity, true);
            images[0].onload();

            expect(view._bitmap.clone).toHaveBeenCalled();
            expect(startBlock.container.addChild).toHaveBeenCalledWith(view._decorationBitmap);
            expect(view._decorationBitmap.name).toBe("decoration");
            // x = width - (40 * scale) / 2, y = (35 * scale) / 2, scale 2
            expect(view._decorationBitmap.x).toBe(160);
            expect(view._decorationBitmap.y).toBe(35);
            expect(view._decorationBitmap.scale).toBe(0.5);
        });

        it("leaves the start block undecorated when turtle artwork is not used", () => {
            const view = makeView();
            const startBlock = makeStartBlock();
            view._startBlock = startBlock;
            const activity = { refreshCanvas: jest.fn() };

            view.makeTurtleBitmap("<svg/>", activity, false);
            images[0].onload();

            expect(view._decorationBitmap).toBeNull();
            expect(startBlock.container.addChild).not.toHaveBeenCalled();
        });

        it("skips the decoration when artwork is asked for but no start block exists", () => {
            const view = makeView();
            view._startBlock = null;
            const activity = { refreshCanvas: jest.fn() };

            view.makeTurtleBitmap("<svg/>", activity, true);
            images[0].onload();

            expect(view._decorationBitmap).toBeNull();
            expect(activity.refreshCanvas).toHaveBeenCalled();
        });
    });
});
