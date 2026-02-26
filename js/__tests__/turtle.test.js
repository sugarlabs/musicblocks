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
});