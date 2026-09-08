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
// Blink lifecycle
//
// blink() hides the turtle for 100ms to acknowledge a note. stopBlink() is what
// guarantees it comes back: if it ever declines to run while the turtle is
// hidden, the turtle stays invisible for the rest of the session.
// ---------------------------------------------------------------------------

describe("Turtle blink lifecycle", () => {
    let turtle, mockActivity;

    beforeEach(() => {
        mockActivity = { refreshCanvas: jest.fn() };
        turtle = new Turtle(mockActivity, 0, "turtle1", {}, null);
        // importMembers is stubbed for this suite, so the view members these
        // methods touch are supplied directly.
        turtle.container = { visible: true };
        turtle.listeners = {};
        turtle._id = 0;
        global.delayExecution = jest.fn(() => Promise.resolve(99));
    });

    describe("stopBlink", () => {
        it("does nothing when there is no blink in flight", () => {
            turtle._blinkTimeout = null;
            turtle._blinkFinished = true;
            turtle.container.visible = false;

            turtle.stopBlink();

            // Left alone precisely because nothing was blinking.
            expect(turtle.container.visible).toBe(false);
            expect(mockActivity.refreshCanvas).not.toHaveBeenCalled();
        });

        it("restores the turtle when a blink is unfinished", () => {
            turtle._blinkTimeout = null;
            turtle._blinkFinished = false;
            turtle.container.visible = false;

            turtle.stopBlink();

            expect(turtle.container.visible).toBe(true);
            expect(turtle._blinkFinished).toBe(true);
            expect(mockActivity.refreshCanvas).toHaveBeenCalled();
        });

        it("restores the turtle when a timeout is outstanding", () => {
            turtle._blinkTimeout = 123;
            turtle._blinkFinished = true;
            turtle.container.visible = false;

            turtle.stopBlink();

            expect(turtle._blinkTimeout).toBeNull();
            expect(turtle.container.visible).toBe(true);
        });

        it("treats an undefined timeout as no timeout", () => {
            // The guard is a loose != null on purpose, so a turtle that has
            // never blinked (timeout undefined, not null) is not woken up.
            turtle._blinkTimeout = undefined;
            turtle._blinkFinished = true;
            turtle.container.visible = false;

            turtle.stopBlink();

            expect(mockActivity.refreshCanvas).not.toHaveBeenCalled();
        });
    });

    describe("blink", () => {
        it("declines to blink for a note shorter than 1/16", () => {
            // t = 1 / duration, so a bigger duration is a shorter note and
            // there is no time to show the blink.
            return turtle.blink(32, 50).then(() => {
                expect(turtle.container.visible).toBe(true);
                expect(global.delayExecution).not.toHaveBeenCalled();
            });
        });

        it("declines to blink while a cursor sensor is listening", () => {
            // Blinking here would fire the sensor repeatedly.
            turtle.listeners["CursorOver0"] = jest.fn();

            return turtle.blink(4, 50).then(() => {
                expect(global.delayExecution).not.toHaveBeenCalled();
            });
        });

        it("declines for CursorOut as well as CursorOver", () => {
            turtle.listeners["CursorOut0"] = jest.fn();

            return turtle.blink(4, 50).then(() => {
                expect(global.delayExecution).not.toHaveBeenCalled();
            });
        });

        it("hides the turtle and brings it back", async () => {
            await turtle.blink(4, 50);

            expect(global.delayExecution).toHaveBeenCalledWith(100);
            expect(turtle.container.visible).toBe(true);
            expect(turtle._blinkFinished).toBe(true);
            // Once to hide, once to show.
            expect(mockActivity.refreshCanvas.mock.calls.length).toBeGreaterThanOrEqual(2);
        });

        it("clears any blink already running before starting its own", async () => {
            turtle._blinkTimeout = 7;
            turtle._blinkFinished = false;

            await turtle.blink(4, 50);

            expect(turtle._blinkFinished).toBe(true);
            expect(turtle.container.visible).toBe(true);
        });
    });
});

// ---------------------------------------------------------------------------
// TurtleModel.rename
//
// Renaming has to reach the start block too, because that label is what the
// user actually reads, and the block's value carries the turtle's index.
// ---------------------------------------------------------------------------

describe("Turtle.TurtleModel.rename", () => {
    const makeModel = startBlock =>
        new Turtle.TurtleModel(
            { refreshCanvas: jest.fn() },
            3,
            "original",
            { getIndexOfTurtle: jest.fn(() => 7) },
            startBlock
        );

    it("renames the turtle and its start block label", () => {
        const startBlock = {
            overrideName: "original",
            collapseText: { text: "original" },
            regenerateArtwork: jest.fn(),
            value: null
        };
        const model = makeModel(startBlock);

        model.rename("soprano");

        expect(model._name).toBe("soprano");
        expect(startBlock.overrideName).toBe("soprano");
        expect(startBlock.collapseText.text).toBe("soprano");
        expect(startBlock.regenerateArtwork).toHaveBeenCalledWith(false);
    });

    it("stores the turtle's index on the start block", () => {
        const startBlock = {
            collapseText: { text: "" },
            regenerateArtwork: jest.fn(),
            value: null
        };
        const model = makeModel(startBlock);

        model.rename("alto");

        expect(model._turtles.getIndexOfTurtle).toHaveBeenCalledWith(model);
        expect(startBlock.value).toBe(7);
    });

    it("renames a turtle that has no start block", () => {
        const model = makeModel(null);

        expect(() => model.rename("tenor")).not.toThrow();
        expect(model._name).toBe("tenor");
    });

    it("treats an undefined start block as absent", () => {
        // The guard is a loose != null so undefined is covered too.
        const model = makeModel(undefined);

        expect(() => model.rename("bass")).not.toThrow();
        expect(model._name).toBe("bass");
    });
});
