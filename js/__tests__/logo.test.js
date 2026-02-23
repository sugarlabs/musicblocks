/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Music Blocks Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Setup global mocks BEFORE requiring the module
global._ = str => str;
global.Notation = jest.fn().mockImplementation(() => ({
    notationStaging: {},
    notationDrumStaging: {},
    pickupPoint: {},
    pickupPOW2: {},
    doUpdateNotation: jest.fn(),
    notationInsertTie: jest.fn()
}));
global.Synth = jest.fn().mockImplementation(() => ({
    newTone: jest.fn(),
    createDefaultSynth: jest.fn(),
    loadSynth: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    stopSound: jest.fn(),
    changeInTemperament: false,
    recorder: null
}));
global.Singer = {
    setSynthVolume: jest.fn(),
    setMasterVolume: jest.fn(),
    masterBPM: 90,
    defaultBPMFactor: 1
};
global.instruments = {};
global.instrumentsFilters = {};
global.instrumentsEffects = {};
global.DEFAULTVOICE = "electronic synth";
global.StatusMatrix = jest.fn();
global.last = arr => arr[arr.length - 1];
global.getIntervalDirection = jest.fn(() => 1);
global.getIntervalNumber = jest.fn(() => 5);
global.mixedNumber = jest.fn(n => n.toString());
global.rationalToFraction = jest.fn(n => [1, Math.round(1 / n)]);
global.doStopVideoCam = jest.fn();
global.CAMERAVALUE = "camera:";
global.VIDEOVALUE = "video:";
global.doUseCamera = jest.fn();
global.delayExecution = jest.fn((ms, callback) => {
    if (typeof callback === "function") {
        callback();
    }
});
global.getStatsFromNotation = jest.fn();
global.Tone = {
    UserMedia: jest.fn().mockImplementation(() => ({
        open: jest.fn()
    }))
};

// Mock Tone.js
jest.mock("tone", () => ({
    UserMedia: jest.fn().mockImplementation(() => ({
        open: jest.fn()
    }))
}));

// Now require the module after globals are set up
const {
    Queue,
    Logo,
    DEFAULTVOLUME,
    PREVIEWVOLUME,
    DEFAULTDELAY,
    OSCVOLUMEADJUSTMENT,
    TONEBPM,
    TARGETBPM,
    TURTLESTEP,
    NOTEDIV,
    NOMICERRORMSG,
    NANERRORMSG,
    NOSTRINGERRORMSG,
    NOBOXERRORMSG,
    NOACTIONERRORMSG,
    NOINPUTERRORMSG,
    NOSQRTERRORMSG,
    ZERODIVIDEERRORMSG,
    EMPTYHEAPERRORMSG,
    POSNUMBER
} = require("../logo");

describe("Queue Class", () => {
    test("constructor initializes all properties correctly", () => {
        const queue = new Queue(1, 5, 0, ["arg1", "arg2"]);

        expect(queue.blk).toBe(1);
        expect(queue.count).toBe(5);
        expect(queue.parentBlk).toBe(0);
        expect(queue.args).toEqual(["arg1", "arg2"]);
    });

    test("constructor handles null arguments", () => {
        const queue = new Queue(null, 0, null, null);

        expect(queue.blk).toBeNull();
        expect(queue.count).toBe(0);
        expect(queue.parentBlk).toBeNull();
        expect(queue.args).toBeNull();
    });

    test("constructor handles empty array args", () => {
        const queue = new Queue(10, 3, 5, []);

        expect(queue.args).toEqual([]);
    });
});

describe("Logo Constants", () => {
    test("DEFAULTVOLUME is 50", () => {
        expect(DEFAULTVOLUME).toBe(50);
    });

    test("PREVIEWVOLUME is 80", () => {
        expect(PREVIEWVOLUME).toBe(80);
    });

    test("DEFAULTDELAY is 500", () => {
        expect(DEFAULTDELAY).toBe(500);
    });

    test("OSCVOLUMEADJUSTMENT is 1.5", () => {
        expect(OSCVOLUMEADJUSTMENT).toBe(1.5);
    });

    test("TONEBPM is 240", () => {
        expect(TONEBPM).toBe(240);
    });

    test("TARGETBPM is 90", () => {
        expect(TARGETBPM).toBe(90);
    });

    test("TURTLESTEP is -1", () => {
        expect(TURTLESTEP).toBe(-1);
    });

    test("NOTEDIV is 8", () => {
        expect(NOTEDIV).toBe(8);
    });

    test("Error messages are defined correctly", () => {
        expect(NOMICERRORMSG).toBe("The microphone is not available.");
        expect(NANERRORMSG).toBe("Not a number.");
        expect(NOSTRINGERRORMSG).toBe("Not a string.");
        expect(NOBOXERRORMSG).toBe("Cannot find box");
        expect(NOACTIONERRORMSG).toBe("Cannot find action.");
        expect(NOINPUTERRORMSG).toBe("Missing argument.");
        expect(NOSQRTERRORMSG).toBe("Cannot take square root of negative number.");
        expect(ZERODIVIDEERRORMSG).toBe("Cannot divide by zero.");
        expect(EMPTYHEAPERRORMSG).toBe("empty heap.");
        expect(POSNUMBER).toBe("Argument must be a positive number");
    });
});

describe("Logo Class", () => {
    let mockActivity;
    let logo;

    beforeEach(() => {
        // Reset global mocks
        global.instruments = { 0: {} };
        global.instrumentsFilters = { 0: {} };
        global.instrumentsEffects = { 0: {} };

        // Mock Tone.UserMedia for initMediaDevices tests
        global.Tone = {
            UserMedia: jest.fn(() => ({
                open: jest.fn()
            }))
        };

        mockActivity = {
            blocks: {
                blockList: [],
                findStacks: jest.fn(),
                stackList: [],
                unhighlightAll: jest.fn(),
                bringToTop: jest.fn(),
                showBlocks: jest.fn(),
                unhighlight: jest.fn(),
                visible: true,
                clearParameterBlocks: jest.fn(),
                sameGeneration: jest.fn(() => false)
            },
            turtles: {
                turtleList: [],
                getTurtleCount: jest.fn(() => 1),
                turtleCount: jest.fn(() => 1),
                ithTurtle: jest.fn(i => ({
                    singer: {
                        synthVolume: {},
                        backward: [],
                        inDuplicate: false,
                        notesPlayed: [0, 1],
                        pickup: 0,
                        noteValuePerBeat: 1,
                        beatsPerMeasure: 4
                    },
                    listeners: {},
                    parameterQueue: [],
                    initTurtle: jest.fn()
                })),
                getTurtle: jest.fn(i => ({
                    painter: { color: 50 },
                    container: { x: 0, y: 0 },
                    x: 0,
                    y: 0,
                    running: false,
                    inTrash: false,
                    companionTurtle: null,
                    doShowImage: jest.fn(),
                    doShowURL: jest.fn(),
                    doShowText: jest.fn()
                })),
                markAllAsStopped: jest.fn(),
                add: jest.fn(),
                addTurtle: jest.fn(),
                turtleX2screenX: jest.fn(x => x),
                turtleY2screenY: jest.fn(y => y)
            },
            stage: {
                removeEventListener: jest.fn(),
                addEventListener: jest.fn(),
                update: jest.fn()
            },
            onStopTurtle: jest.fn(),
            onRunTurtle: jest.fn(),

            errorMsg: jest.fn(),
            saveLocally: jest.fn(),
            hideMsgs: jest.fn(),
            showBlocksAfterRun: false
        };

        // Add window mock
        global.window = {
            widgetWindows: {
                isOpen: jest.fn(() => false)
            }
        };
        global.document = {
            body: { style: { cursor: "default" } },
            getElementById: jest.fn(() => ({ style: { color: "" } }))
        };

        logo = new Logo(mockActivity);
    });

    describe("Constructor", () => {
        test("initializes activity reference", () => {
            expect(logo.activity).toBe(mockActivity);
        });

        test("initializes default volume-related properties", () => {
            expect(logo.stopTurtle).toBe(false);
            expect(logo.time).toBe(0);
            expect(logo.firstNoteTime).toBeNull();
        });

        test("initializes widget properties to null/false", () => {
            expect(logo.reflection).toBeNull();
            expect(logo.phraseMaker).toBeNull();
            expect(logo.inMatrix).toBe(false);
            expect(logo.inPitchDrumMatrix).toBe(false);
            expect(logo.inRhythmRuler).toBe(false);
        });

        test("initializes empty dictionaries", () => {
            expect(logo.boxes).toEqual({});
            expect(logo.actions).toEqual({});
            expect(logo.returns).toEqual({});
            expect(logo.turtleHeaps).toEqual({});
            expect(logo.turtleDicts).toEqual({});
        });

        test("initializes notation object", () => {
            expect(logo._notation).toBeDefined();
        });

        test("initializes synth", () => {
            expect(logo.synth).toBeDefined();
        });
    });

    describe("Setters and Getters", () => {
        test("onStopTurtle getter and setter work correctly", () => {
            const mockCallback = jest.fn();
            logo.onStopTurtle = mockCallback;
            expect(logo.onStopTurtle).toBe(mockCallback);
        });

        test("onRunTurtle getter and setter work correctly", () => {
            const mockCallback = jest.fn();
            logo.onRunTurtle = mockCallback;
            expect(logo.onRunTurtle).toBe(mockCallback);
        });

        test("turtleDelay getter and setter work correctly", () => {
            logo.turtleDelay = 100;
            expect(logo.turtleDelay).toBe(100);
        });

        test("notation getter returns notation object", () => {
            expect(logo.notation).toBe(logo._notation);
        });
    });

    describe("setCameraID", () => {
        test("sets cameraID property", () => {
            logo.setCameraID("camera123");
            expect(logo.cameraID).toBe("camera123");
        });
    });

    describe("clearNoteParams", () => {
        test("clears all note parameters for a turtle", () => {
            const mockTurtle = {
                singer: {
                    oscList: {},
                    noteBeat: {},
                    noteBeatValues: {},
                    noteValue: {},
                    notePitches: {},
                    noteOctaves: {},
                    noteCents: {},
                    noteHertz: {},
                    embeddedGraphics: {},
                    noteDrums: {}
                }
            };

            logo.clearNoteParams(mockTurtle, 0, null);

            expect(mockTurtle.singer.oscList[0]).toEqual([]);
            expect(mockTurtle.singer.noteBeat[0]).toEqual([]);
            expect(mockTurtle.singer.noteValue[0]).toBeNull();
            expect(mockTurtle.singer.notePitches[0]).toEqual([]);
            expect(mockTurtle.singer.noteDrums[0]).toEqual([]);
        });

        test("uses provided drums array when not null", () => {
            const mockTurtle = {
                singer: {
                    oscList: {},
                    noteBeat: {},
                    noteBeatValues: {},
                    noteValue: {},
                    notePitches: {},
                    noteOctaves: {},
                    noteCents: {},
                    noteHertz: {},
                    embeddedGraphics: {},
                    noteDrums: {}
                }
            };

            logo.clearNoteParams(mockTurtle, 0, ["kick", "snare"]);

            expect(mockTurtle.singer.noteDrums[0]).toEqual(["kick", "snare"]);
        });
    });

    describe("setTurtleListener", () => {
        test("adds event listener to stage", () => {
            const listener = jest.fn();
            mockActivity.turtles.ithTurtle = jest.fn(() => ({
                listeners: {}
            }));

            logo.setTurtleListener(0, "testListener", listener);

            expect(mockActivity.stage.addEventListener).toHaveBeenCalledWith(
                "testListener",
                listener,
                false
            );
        });

        test("removes existing listener before adding new one", () => {
            const oldListener = jest.fn();
            const newListener = jest.fn();
            mockActivity.turtles.ithTurtle = jest.fn(() => ({
                listeners: { testListener: oldListener }
            }));

            logo.setTurtleListener(0, "testListener", newListener);

            expect(mockActivity.stage.removeEventListener).toHaveBeenCalledWith(
                "testListener",
                oldListener,
                false
            );
        });
    });

    describe("initTurtle", () => {
        test("initializes connection store for turtle", () => {
            mockActivity.turtles.ithTurtle = jest.fn(() => ({
                initTurtle: jest.fn()
            }));

            logo.initTurtle(0);

            expect(logo.connectionStore[0]).toEqual({});
            expect(logo.switchCases[0]).toEqual({});
            expect(logo.switchBlocks[0]).toEqual([]);
            expect(logo.returns[0]).toEqual([]);
        });
    });

    describe("doStopTurtles", () => {
        test("sets stopTurtle to true", () => {
            logo.sounds = [];
            logo.synth = {
                stop: jest.fn(),
                stopSound: jest.fn(),
                recorder: null
            };

            logo.doStopTurtles();

            expect(logo.stopTurtle).toBe(true);
        });

        test("marks all turtles as stopped", () => {
            logo.sounds = [];
            logo.synth = {
                stop: jest.fn(),
                stopSound: jest.fn(),
                recorder: null
            };

            logo.doStopTurtles();

            expect(mockActivity.turtles.markAllAsStopped).toHaveBeenCalled();
        });

        test("stops all sounds", () => {
            const mockSound = { stop: jest.fn() };
            logo.sounds = [mockSound];
            logo.synth = {
                stop: jest.fn(),
                stopSound: jest.fn(),
                recorder: null
            };

            logo.doStopTurtles();

            expect(mockSound.stop).toHaveBeenCalled();
            expect(logo.sounds).toEqual([]);
        });

        test("clears step queue", () => {
            logo.sounds = [];
            logo.synth = {
                stop: jest.fn(),
                stopSound: jest.fn(),
                recorder: null
            };
            logo.stepQueue = { 0: [1, 2, 3] };

            logo.doStopTurtles();

            expect(logo.stepQueue).toEqual({});
        });
    });

    describe("step", () => {
        test("processes step queue for each turtle", () => {
            logo.stepQueue = { 0: [1] };
            logo._unhighlightStepQueue = { 0: 5 };
            logo.runFromBlockNow = jest.fn();
            mockActivity.blocks.visible = true;

            logo.step();

            expect(mockActivity.blocks.unhighlight).toHaveBeenCalledWith(5);
        });

        test("handles empty step queue", () => {
            logo.stepQueue = { 0: [] };
            logo.runFromBlockNow = jest.fn();

            logo.step();

            expect(logo.runFromBlockNow).not.toHaveBeenCalled();
        });
    });

    describe("_restoreConnections", () => {
        test("restores broken connections", () => {
            const mockBlock0 = { connections: [null, 2] };
            const mockBlock2 = { connections: [null] };
            logo.blockList = [mockBlock0, null, mockBlock2];
            logo.connectionStore = {
                0: {
                    5: [[0, 1, 2]]
                }
            };

            logo._restoreConnections();

            expect(mockBlock0.connections[1]).toBe(2);
            expect(mockBlock2.connections[0]).toBe(0);
        });

        test("handles empty connection store", () => {
            logo.connectionStore = {};

            expect(() => logo._restoreConnections()).not.toThrow();
        });
    });

    describe("doBreak", () => {
        test("pops from queue when no parent loop found", () => {
            const mockTurtle = {
                queue: [{ blk: 0, parentBlk: 1 }],
                parentFlowQueue: []
            };
            logo.blockList = [{ name: "print" }, { name: "print" }];

            logo.doBreak(mockTurtle);

            expect(mockTurtle.queue.length).toBe(0);
        });
    });
});

describe("Logo parseArg", () => {
    let mockActivity;
    let logo;

    beforeEach(() => {
        mockActivity = {
            blocks: {
                blockList: []
            },
            turtles: {
                ithTurtle: jest.fn(() => ({
                    parameterQueue: [],
                    singer: { noteDirection: 0 }
                }))
            },
            errorMsg: jest.fn()
        };

        logo = new Logo(mockActivity);
    });

    test("returns null for null block", () => {
        const result = logo.parseArg(logo, 0, null, 0, null);

        expect(result).toBeNull();
        expect(mockActivity.errorMsg).toHaveBeenCalled();
    });

    test("handles value blocks", () => {
        logo.blockList = [
            {
                name: "number",
                value: 42,
                protoblock: { parameter: false },
                isValueBlock: () => true
            }
        ];

        const result = logo.parseArg(logo, 0, 0, null, null);

        expect(result).toBe(42);
    });

    test("handles interval name blocks", () => {
        mockActivity.turtles.ithTurtle = jest.fn(() => ({
            parameterQueue: [],
            singer: { noteDirection: 0 }
        }));
        logo.blockList = [
            {
                name: "intervalname",
                value: "fifth",
                protoblock: { parameter: false },
                isValueBlock: () => false
            }
        ];

        const result = logo.parseArg(logo, 0, 0, null, null);

        expect(getIntervalNumber).toHaveBeenCalledWith("fifth");
    });
});

describe("Logo comprehensive method coverage", () => {
    let logo;
    let mockActivity;
    let turtle0;
    let turtle1;
    let timeoutSpy;

    const buildTurtle = () => ({
        singer: {
            synthVolume: {},
            backward: [],
            inDuplicate: false,
            notesPlayed: [5, 1],
            pickup: 0,
            noteValuePerBeat: 1,
            beatsPerMeasure: 4,
            inNoteBlock: [],
            justCounting: [],
            suppressOutput: false,
            dispatchFactor: 1,
            embeddedGraphics: {},
            runningFromEvent: false
        },
        queue: [],
        parentFlowQueue: [],
        unhighlightQueue: [],
        parameterQueue: [],
        listeners: {},
        endOfClampSignals: {},
        butNotThese: {},
        embeddedGraphicsFinished: true,
        running: false,
        inTrash: false,
        waitTime: 0,
        doWait: jest.fn(),
        delayTimeout: null,
        delayParameters: null,
        painter: {
            color: 50,
            penState: true,
            closeSVG: jest.fn(),
            doPenUp: jest.fn(),
            doPenDown: jest.fn(),
            doSetColor: jest.fn(),
            doSetHue: jest.fn(),
            doSetValue: jest.fn(),
            doSetPenAlpha: jest.fn(),
            doSetChroma: jest.fn(),
            doSetPensize: jest.fn(),
            doSetXY: jest.fn(),
            doSetHeading: jest.fn(),
            doRight: jest.fn(),
            doForward: jest.fn(),
            doArc: jest.fn(),
            doScrollXY: jest.fn(),
            doBezier: jest.fn(),
            doStartFill: jest.fn(),
            doEndFill: jest.fn(),
            doStartHollowLine: jest.fn(),
            doEndHollowLine: jest.fn()
        },
        container: { x: 0, y: 0 },
        x: 0,
        y: 0,
        companionTurtle: null,
        doShowImage: jest.fn(),
        doShowURL: jest.fn(),
        doShowText: jest.fn()
    });

    beforeEach(() => {
        jest.clearAllMocks();
        global.instruments = { 0: { flute: {} } };
        global.instrumentsFilters = { 0: { flute: ["lp"] } };
        global.instrumentsEffects = { 0: { flute: { reverb: 0.5 } } };

        turtle0 = buildTurtle();
        turtle1 = buildTurtle();

        mockActivity = {
            blocks: {
                blockList: [],
                findStacks: jest.fn(),
                stackList: [],
                unhighlightAll: jest.fn(),
                bringToTop: jest.fn(),
                showBlocks: jest.fn(),
                unhighlight: jest.fn(),
                highlight: jest.fn(),
                clearParameterBlocks: jest.fn(),
                updateParameterBlock: jest.fn(),
                sameGeneration: jest.fn(() => false),
                visible: true
            },
            turtles: {
                turtleList: [turtle0, turtle1],
                ithTurtle: jest.fn(i => (String(i) === "1" ? turtle1 : turtle0)),
                getTurtle: jest.fn(i => (String(i) === "1" ? turtle1 : turtle0)),
                getTurtleCount: jest.fn(() => 2),
                turtleCount: jest.fn(() => 2),
                turtleX2screenX: jest.fn(v => v),
                turtleY2screenY: jest.fn(v => v),
                add: jest.fn(),
                addTurtle: jest.fn(),
                markAllAsStopped: jest.fn(),
                running: jest.fn(() => false)
            },
            stage: {
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
                update: jest.fn()
            },
            errorMsg: jest.fn(),
            textMsg: jest.fn(),
            hideMsgs: jest.fn(),
            saveLocally: jest.fn(),
            refreshCanvas: jest.fn(),
            onStopTurtle: jest.fn(),
            onRunTurtle: jest.fn(),
            meSpeak: { speak: jest.fn() },
            save: {
                afterSaveLilypond: jest.fn(),
                afterSaveAbc: jest.fn(),
                afterSaveMxml: jest.fn(),
                afterSaveMIDI: jest.fn()
            },
            statsWindow: { displayInfo: jest.fn() },
            showBlocksAfterRun: false
        };

        if (!global.window) {
            global.window = {};
        }
        global.window.widgetWindows = {
            isOpen: jest.fn(() => false)
        };

        if (!global.document) {
            global.document = { body: { style: {} } };
        }
        if (!global.document.body) {
            global.document.body = { style: {} };
        }
        if (!global.document.body.style) {
            global.document.body.style = {};
        }
        global.document.body.style.cursor = "pointer";
        global.document.getElementById = jest.fn(() => ({ style: { color: "" } }));

        logo = new Logo(mockActivity);
        mockActivity.logo = logo;
    });

    afterEach(() => {
        if (timeoutSpy) {
            timeoutSpy.mockRestore();
            timeoutSpy = null;
        }
    });

    test("prepSynths initializes synths and copies instruments per turtle", () => {
        logo.prepSynths();

        expect(logo.synth.newTone).toHaveBeenCalled();
        expect(logo.synth.createDefaultSynth).toHaveBeenCalled();
        expect(logo.synth.loadSynth).toHaveBeenCalledWith("1", "flute");
        expect(global.instrumentsFilters[1].flute).toEqual(["lp"]);
        expect(global.instrumentsEffects[1].flute).toEqual({ reverb: 0.5 });
        expect(Singer.setSynthVolume).toHaveBeenCalledWith(logo, "0", "electronic synth", 50);
    });

    test("resetSynth creates default synth, resets volumes, and starts synth engine", () => {
        turtle0.singer.synthVolume = { "electronic synth": [40], "flute": [22] };
        turtle1.singer.synthVolume = { "electronic synth": [50] };

        logo.resetSynth(0);

        expect(logo.synth.createDefaultSynth).toHaveBeenCalledWith(0);
        expect(Singer.setMasterVolume).toHaveBeenCalledWith(logo, 50);
        expect(Singer.setSynthVolume).toHaveBeenCalledWith(logo, "0", "electronic synth", 50);
        expect(Singer.setSynthVolume).toHaveBeenCalledWith(logo, "0", "flute", 50);
        expect(logo.synth.start).toHaveBeenCalled();
    });

    test("runLogoCommands executes startHere path", () => {
        logo.prepSynths = jest.fn();
        logo._restoreConnections = jest.fn();
        logo.initTurtle = jest.fn();
        logo.runFromBlock = jest.fn();
        logo.blockList = [{ name: "start", value: 0, trash: false, connections: [] }];

        logo.runLogoCommands(0, { test: true });

        expect(logo._restoreConnections).toHaveBeenCalled();
        expect(mockActivity.saveLocally).toHaveBeenCalled();
        expect(logo.prepSynths).toHaveBeenCalled();
        expect(logo.initTurtle).toHaveBeenCalledWith("0");
        expect(logo.runFromBlock).toHaveBeenCalledWith(logo, 0, 0, 0, { test: true });
        expect(mockActivity.refreshCanvas).toHaveBeenCalled();
    });

    test("runLogoCommands executes startBlocks branch including delayed non-status stacks", () => {
        timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
            fn();
            return 1;
        });

        logo.prepSynths = jest.fn();
        logo.initTurtle = jest.fn();
        logo.runFromBlock = jest.fn();
        mockActivity.blocks.stackList = [0, 1];
        logo.blockList = [
            { name: "status", value: 0, trash: false, connections: [] },
            { name: "start", value: 1, trash: false, connections: [] }
        ];

        logo.runLogoCommands(null, null);

        expect(logo.runFromBlock).toHaveBeenCalledWith(logo, 0, 0, 0, null);
        expect(logo.runFromBlock).toHaveBeenCalledWith(logo, 1, 1, 0, null);
    });

    test("runLogoCommands falls back to default cursor when no start stacks", () => {
        mockActivity.blocks.stackList = [];
        logo.blockList = [];
        logo.prepSynths = jest.fn();
        logo.initTurtle = jest.fn();

        logo.runLogoCommands(null, null);

        expect(document.body.style.cursor).toBe("default");
    });

    test("runFromBlock queues step mode when turtle delay is TURTLESTEP", () => {
        turtle0.waitTime = 30;
        logo.turtleDelay = TURTLESTEP;
        logo.stopTurtle = false;

        logo.runFromBlock(logo, 0, 9, 0, ["arg"]);

        expect(turtle0.doWait).toHaveBeenCalledWith(0);
        expect(logo.stepQueue[0]).toEqual([9]);
    });

    test("runFromBlock schedules runFromBlockNow through mocked setTimeout", () => {
        timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
            fn();
            return 5;
        });
        logo.runFromBlockNow = jest.fn();
        logo.turtleDelay = 25;
        logo.stopTurtle = false;
        turtle0.waitTime = 10;

        logo.runFromBlock(logo, 0, 3, 1, "x");

        expect(timeoutSpy).toHaveBeenCalled();
        expect(logo.runFromBlockNow).toHaveBeenCalledWith(logo, 0, 3, 1, "x");
    });

    test("runFromBlockNow executes flow block and queues next block", () => {
        logo.runFromBlock = jest.fn();
        logo.blockList = [
            {
                name: "print",
                value: null,
                protoblock: {
                    args: 0,
                    dockTypes: ["flow"],
                    flow: jest.fn(() => null)
                },
                connections: [null, 1],
                isValueBlock: () => false,
                isArgBlock: () => false
            },
            {
                name: "print",
                protoblock: { args: 0, dockTypes: ["flow"], flow: jest.fn(() => null) },
                connections: [null],
                isValueBlock: () => false,
                isArgBlock: () => false
            }
        ];

        logo.runFromBlockNow(logo, 0, 0, 0, null);

        expect(mockActivity.blocks.highlight).toHaveBeenCalledWith(0, false);
        expect(logo.runFromBlock).toHaveBeenCalledWith(logo, 0, 1, 0, null);
    });

    test("updateNotation delegates without split and splits across measure boundaries", () => {
        logo.notation.notationDrumStaging[0] = [];

        logo.updateNotation(["C4"], 4, 0, false, null, false);
        expect(logo.notation.doUpdateNotation).toHaveBeenCalled();

        logo.notation.doUpdateNotation.mockClear();
        logo.updateNotation(["C4"], 0.5, 0, false, null, true);
        expect(logo.notation.notationInsertTie).toHaveBeenCalledWith(0);
        expect(logo.notation.doUpdateNotation).toHaveBeenCalled();
    });

    test("notationMIDI collects MIDI records and normalizes drum array", () => {
        logo._midiData = {};

        logo.notationMIDI("C4", ["kick"], 0.5, 0, 90, "piano");
        logo.notationMIDI("D4", null, 0.25, 0, 120, "flute");

        expect(logo._midiData[0]).toEqual([
            { note: "C4", duration: 0.5, bpm: 90, instrument: "piano", drum: "kick" },
            { note: "D4", duration: 0.25, bpm: 120, instrument: "flute", drum: null }
        ]);
    });

    test("initMediaDevices sets mic/limit on success and reports microphone errors", () => {
        const open = jest.fn();
        // Update logo.deps.Tone since it was captured at constructor time
        logo.deps.Tone = { UserMedia: jest.fn(() => ({ open })) };

        logo.initMediaDevices();
        expect(open).toHaveBeenCalled();
        expect(logo.limit).toBe(16384);
        expect(logo.mic).toBeTruthy();

        // Test error case - mock open to throw
        const errorOpen = jest.fn(() => {
            throw new Error("no mic");
        });
        logo.deps.Tone = {
            UserMedia: jest.fn(() => ({
                open: errorOpen
            }))
        };
        logo.initMediaDevices();
        expect(mockActivity.errorMsg).toHaveBeenCalledWith("The microphone is not available.");
        expect(logo.mic).toBeNull();
    });

    test("processShow handles image/url/loadFile/default branches", () => {
        logo.processShow(0, null, 100, "data:image/png;base64,AAAA");
        expect(turtle0.doShowImage).toHaveBeenCalledWith(100, "data:image/png;base64,AAAA");

        logo.processShow(0, null, 100, "https://example.com/a.png");
        expect(turtle0.doShowURL).toHaveBeenCalledWith(100, "https://example.com/a.png");

        logo.blockList = [{ connections: [null, null, 1] }, { name: "loadFile" }];
        logo.processShow(0, 0, 55, ["file", "hello-world"]);
        expect(turtle0.doShowText).toHaveBeenCalledWith(55, "hello-world");

        logo.processShow(0, null, 20, 999);
        expect(turtle0.doShowText).toHaveBeenCalledWith(20, 999);
    });

    test("dispatchTurtleSignals handles early exits and executes embedded clear action", async () => {
        timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
            fn();
            return 2;
        });
        // Update logo.deps.utils.delayExecution since it was captured at constructor time
        logo.deps.utils.delayExecution = jest.fn((ms, callback) => {
            if (typeof callback === "function") {
                callback();
            }
        });

        turtle0.singer.embeddedGraphics = {};
        await logo.dispatchTurtleSignals(0, 0.5, 3, 0);
        expect(logo.deps.utils.delayExecution).not.toHaveBeenCalled();

        turtle0.singer.embeddedGraphics = { 3: [] };
        await logo.dispatchTurtleSignals(0, 0.5, 3, 0);
        expect(logo.deps.utils.delayExecution).not.toHaveBeenCalled();

        turtle0.singer.embeddedGraphics = { 3: [1] };
        logo.blockList = [null, { name: "clear", connections: [] }];
        await logo.dispatchTurtleSignals(0, 0.5, 3, 0.1);

        expect(turtle0.painter.doSetHeading).toHaveBeenCalledWith(0);
        expect(turtle0.painter.doSetXY).toHaveBeenCalledWith(0, 0);
        expect(logo.deps.utils.delayExecution).toHaveBeenCalledWith(500);
        expect(turtle0.embeddedGraphicsFinished).toBe(true);
    });

    test("runLogoCommands handles already-running state and status widget initialization", () => {
        const clearTimeoutSpy = jest.spyOn(global, "clearTimeout").mockImplementation(() => {});
        logo._alreadyRunning = true;
        logo._runningBlock = 7;
        logo._lastNoteTimeout = 99;
        logo.prepSynths = jest.fn();
        logo.initTurtle = jest.fn();
        logo.blockList = [];
        mockActivity.blocks.stackList = [];
        window.widgetWindows.isOpen.mockReturnValue(true);
        const statusInit = jest.fn();
        global.StatusMatrix.mockImplementation(() => ({ init: statusInit }));

        logo.runLogoCommands(null, null);

        expect(clearTimeoutSpy).toHaveBeenCalledWith(99);
        expect(logo._ignoringBlock).toBe(7);
        expect(statusInit).toHaveBeenCalledWith(mockActivity);
        clearTimeoutSpy.mockRestore();
    });

    test("runLogoCommands builds actions dictionary from action stack", () => {
        logo.prepSynths = jest.fn();
        logo.initTurtle = jest.fn();
        mockActivity.blocks.stackList = [0];
        logo.blockList = [
            { name: "action", connections: [null, 1, 2], trash: false },
            {
                name: "number",
                value: "my-action",
                protoblock: { parameter: false },
                isValueBlock: () => true
            },
            { name: "print", connections: [null] }
        ];

        logo.runLogoCommands(null, null);

        expect(logo.actions["my-action"]).toBe(2);
    });

    test("parseArg covers dectofrac, hue status mode, and returnValue branches", () => {
        logo.statusFields = [];
        logo.inStatusMatrix = false;
        logo.returns[0] = [1234];
        logo.blockList = [
            {
                name: "dectofrac",
                value: null,
                connections: [3, 1],
                protoblock: { parameter: false, dockTypes: ["numberout"] },
                isValueBlock: () => false
            },
            {
                name: "number",
                value: 0.5,
                protoblock: { parameter: false },
                isValueBlock: () => true
            },
            {
                name: "hue",
                value: null,
                connections: [3],
                protoblock: { parameter: false, dockTypes: ["numberout"] },
                isValueBlock: () => false
            },
            { name: "print" },
            {
                name: "returnValue",
                value: null,
                connections: [],
                protoblock: { parameter: false, dockTypes: ["numberout"] },
                isValueBlock: () => false
            }
        ];

        expect(logo.parseArg(logo, 0, 0, null, null)).toBe("0.5");
        logo.inStatusMatrix = true;
        logo.parseArg(logo, 0, 2, null, null);
        expect(logo.statusFields).toContainEqual([2, "color"]);
        expect(logo.parseArg(logo, 0, 4, null, null)).toBe(1234);
    });

    test("doStopTurtles covers companion/camera/recorder/showBlocks branches", () => {
        const clearIntervalSpy = jest.spyOn(global, "clearInterval").mockImplementation(() => {});
        // Update deps.instruments since it was captured at constructor time
        logo.deps.instruments = { 0: { flute: {} }, 1: { piano: {} } };
        // Populate turtleList so the for loop iterates over both turtles
        mockActivity.turtles.turtleList = [turtle0, turtle1];
        turtle0.singer.killAllVoices = jest.fn();
        turtle0.companionTurtle = 1;
        turtle1.interval = 888;
        logo.sounds = [{ stop: jest.fn() }];
        logo.cameraID = "cam-1";
        logo.synth = {
            stop: jest.fn(),
            stopSound: jest.fn(),
            recorder: { state: "recording", stop: jest.fn() }
        };
        logo._restoreConnections = jest.fn();
        mockActivity.showBlocksAfterRun = true;

        logo.doStopTurtles();

        expect(turtle0.singer.killAllVoices).toHaveBeenCalled();
        expect(logo.synth.stopSound).toHaveBeenCalledWith("0", "flute");
        expect(logo.synth.stopSound).toHaveBeenCalledWith("1", "piano");
        expect(clearIntervalSpy).toHaveBeenCalledWith(888);
        expect(logo.synth.recorder.stop).toHaveBeenCalled();
        expect(doStopVideoCam).toHaveBeenCalledWith("cam-1", logo.setCameraID);
        expect(mockActivity.blocks.showBlocks).toHaveBeenCalled();
        expect(document.getElementById).toHaveBeenCalledWith("stop");
        clearIntervalSpy.mockRestore();
    });

    test("runFromBlockNow arg-block path prints and stops turtle", () => {
        timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
            fn();
            return 6;
        });
        logo.parseArg = jest.fn(() => 77);
        logo.blockList = [
            {
                name: "width",
                value: 77,
                protoblock: { args: 0, dockTypes: ["numberout"] },
                connections: [],
                isValueBlock: () => false,
                isArgBlock: () => true
            }
        ];

        logo.runFromBlockNow(logo, 0, 0, 0, null);

        expect(mockActivity.textMsg).toHaveBeenCalledWith("width: 77");
        expect(logo.stopTurtle).toBe(true);
    });

    test("runFromBlockNow completion branch handles runningMIDI save", () => {
        timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
            fn();
            return 11;
        });
        logo.runningMIDI = true;
        logo.blockList = [
            {
                name: "print",
                protoblock: { args: 0, dockTypes: ["flow"], flow: jest.fn(() => null) },
                connections: [null],
                isValueBlock: () => false,
                isArgBlock: () => false
            }
        ];

        logo.runFromBlockNow(logo, 0, 0, 0, null);

        expect(mockActivity.save.afterSaveMIDI).toHaveBeenCalled();
        expect(logo.runningMIDI).toBe(false);
    });

    test("dispatchTurtleSignals covers broad graphics switch with deterministic timers", async () => {
        timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
            fn();
            return 13;
        });
        logo.parseArg = jest.fn(() => 9);
        logo.processShow = jest.fn();
        logo.processSpeak = jest.fn();
        // Update logo.deps.utils.delayExecution since it was captured at constructor time
        logo.deps.utils.delayExecution = jest.fn((ms, callback) => {
            if (typeof callback === "function") {
                callback();
            }
        });

        turtle0.singer.suppressOutput = false;
        turtle0.embeddedGraphicsFinished = false;

        logo.blockList = [];
        const names = [
            "setcolor",
            "sethue",
            "setshade",
            "settranslucency",
            "setgrey",
            "setpensize",
            "penup",
            "pendown",
            "fill",
            "hollowline",
            "controlpoint1",
            "controlpoint2",
            "bezier",
            "setheading",
            "right",
            "left",
            "forward",
            "back",
            "setxy",
            "scrollxy",
            "show",
            "speak",
            "print",
            "arc"
        ];

        names.forEach((name, index) => {
            logo.blockList[index + 1] = { name, connections: [null, 101, 102] };
        });

        turtle0.singer.embeddedGraphics = {
            5: names.map((_, index) => index + 1)
        };

        await logo.dispatchTurtleSignals(0, 1, 5, 0);

        expect(turtle0.painter.doSetColor).toHaveBeenCalled();
        expect(turtle0.painter.doSetHue).toHaveBeenCalled();
        expect(turtle0.painter.doSetValue).toHaveBeenCalled();
        expect(turtle0.painter.doSetPenAlpha).toHaveBeenCalled();
        expect(turtle0.painter.doSetChroma).toHaveBeenCalled();
        expect(turtle0.painter.doSetPensize).toHaveBeenCalled();
        expect(turtle0.painter.doPenUp).toHaveBeenCalled();
        expect(turtle0.painter.doPenDown).toHaveBeenCalled();
        expect(turtle0.painter.doStartFill).toHaveBeenCalled();
        expect(turtle0.painter.doStartHollowLine).toHaveBeenCalled();
        expect(turtle0.painter.doBezier).toHaveBeenCalled();
        expect(turtle0.painter.doSetHeading).toHaveBeenCalled();
        expect(turtle0.painter.doRight).toHaveBeenCalled();
        expect(turtle0.painter.doForward).toHaveBeenCalled();
        expect(turtle0.painter.doArc).toHaveBeenCalled();
        expect(turtle0.painter.doSetXY).toHaveBeenCalled();
        expect(turtle0.painter.doScrollXY).toHaveBeenCalled();
        expect(logo.processShow).toHaveBeenCalled();
        expect(logo.processSpeak).toHaveBeenCalled();
        expect(mockActivity.textMsg).toHaveBeenCalledWith("9");
        expect(logo.deps.utils.delayExecution).toHaveBeenCalledWith(1000);
    });

    test("constructor supports explicit dependency object mode", () => {
        const deps = {
            blocks: mockActivity.blocks,
            turtles: mockActivity.turtles,
            stage: mockActivity.stage,
            errorHandler: jest.fn(),
            messageHandler: { hide: jest.fn() },
            storage: { saveLocally: jest.fn() },
            config: { showBlocksAfterRun: false },
            callbacks: { onStopTurtle: jest.fn(), onRunTurtle: jest.fn() },
            meSpeak: { speak: jest.fn() },
            // Add missing required fields
            instruments: {},
            instrumentsFilters: {},
            instrumentsEffects: {},
            Singer: {},
            Tone: {},
            widgetWindows: { isOpen: jest.fn(() => false) },
            classes: {
                Notation: jest.fn().mockImplementation(() => ({})),
                Synth: jest.fn().mockImplementation(() => ({})),
                StatusMatrix: jest.fn().mockImplementation(() => ({}))
            },
            utils: {
                doUseCamera: jest.fn(),
                doStopVideoCam: jest.fn(),
                getIntervalDirection: jest.fn(),
                getIntervalNumber: jest.fn(),
                mixedNumber: jest.fn(),
                rationalToFraction: jest.fn(),
                getStatsFromNotation: jest.fn(),
                delayExecution: jest.fn(),
                last: jest.fn(arr => arr[arr.length - 1])
            }
        };

        const depLogo = new Logo(deps);

        expect(depLogo.activity.blocks).toBe(mockActivity.blocks);
        expect(depLogo.activity.turtles).toBe(mockActivity.turtles);
        expect(depLogo.activity.stage).toBe(mockActivity.stage);
    });

    test("clearTurtleRun clears timeout and resumes execution", () => {
        const clearTimeoutSpy = jest.spyOn(global, "clearTimeout").mockImplementation(() => {});
        turtle0.delayTimeout = 123;
        turtle0.delayParameters = { blk: 4, flow: 1, arg: ["p"] };
        logo.runFromBlockNow = jest.fn();

        logo.clearTurtleRun(0);

        expect(clearTimeoutSpy).toHaveBeenCalledWith(123);
        expect(turtle0.delayTimeout).toBeNull();
        expect(logo.runFromBlockNow).toHaveBeenCalledWith(logo, 0, 4, 1, ["p"]);
        clearTimeoutSpy.mockRestore();
    });

    test("setDispatchBlock adds clamp signal for normal and backward traversal", () => {
        turtle0.endOfClampSignals = {};
        logo.blockList = [
            { name: "forward", connections: [2, null, 2] },
            { name: "backward", connections: [null, 0] },
            { name: "print", connections: [null] }
        ];

        logo.setDispatchBlock(0, 0, "sig-a");
        expect(turtle0.endOfClampSignals[2]).toEqual(["sig-a"]);

        turtle0.singer.backward = [1];
        mockActivity.blocks.sameGeneration.mockReturnValue(true);
        logo.setDispatchBlock(0, 0, "sig-b");
        expect(turtle0.endOfClampSignals[2]).toEqual(["sig-a", "sig-b"]);
    });

    test("doBreak handles while-loop parent and enqueues child flow", () => {
        const tur = { queue: [{ blk: 0, parentBlk: 0 }], parentFlowQueue: [] };
        logo.blockList = [
            { name: "while", connections: [null, 3] },
            { name: "print" },
            { name: "print" },
            { name: "print" }
        ];

        logo.doBreak(tur);

        expect(tur.parentFlowQueue).toEqual([0]);
        expect(tur.queue[0].blk).toBe(3);
    });

    test("parseArg covers arg-function, non-string interval, and fallback id branches", () => {
        logo.blockList = [
            {
                name: "dynamic",
                value: 0,
                protoblock: { parameter: true, arg: jest.fn(() => 88) },
                isValueBlock: () => false
            },
            {
                name: "intervalname",
                value: 42,
                protoblock: { parameter: false },
                isValueBlock: () => false
            },
            {
                name: "flowblk",
                value: null,
                protoblock: { parameter: false, dockTypes: ["flow"] },
                isValueBlock: () => false
            }
        ];

        expect(logo.parseArg(logo, 0, 0, null, null)).toBe(88);
        expect(turtle0.parameterQueue).toContain(0);
        expect(logo.parseArg(logo, 0, 1, null, null)).toBe(0);
        expect(logo.parseArg(logo, 0, 2, null, null)).toBe(2);
    });

    test("runFromBlockNow completion handles lilypond stats and notation buffering", () => {
        timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
            fn();
            return 17;
        });

        logo.blockList = [
            {
                name: "print",
                protoblock: { args: 0, dockTypes: ["flow"], flow: jest.fn(() => null) },
                connections: [null],
                isValueBlock: () => false,
                isArgBlock: () => false
            }
        ];

        logo.runningLilypond = true;
        logo.collectingStats = true;
        logo.notationOutput = ["n1"];
        logo.notationNotes = { a: 1 };
        logo.notation.notationStaging[0] = ["st0"];
        logo.notation.notationDrumStaging[0] = ["dr0"];
        logo.recordingBuffer = {
            hasData: false,
            notationOutput: null,
            notationNotes: null,
            notationStaging: {},
            notationDrumStaging: {}
        };

        logo.runFromBlockNow(logo, 0, 0, 0, null);

        expect(getStatsFromNotation).toHaveBeenCalledWith(mockActivity);
        expect(mockActivity.statsWindow.displayInfo).toHaveBeenCalled();
        expect(logo.runningLilypond).toBe(false);

        logo.runningLilypond = false;
        logo.collectingStats = false;
        logo.runFromBlockNow(logo, 0, 0, 0, null);
        expect(logo.recordingBuffer.hasData).toBe(true);
    });

    test("runFromBlockNow completion handles abc/mxml and suppressOutput-ready paths", () => {
        timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
            fn();
            return 21;
        });
        logo.blockList = [
            {
                name: "print",
                protoblock: { args: 0, dockTypes: ["flow"], flow: jest.fn(() => null) },
                connections: [null],
                isValueBlock: () => false,
                isArgBlock: () => false
            }
        ];

        logo.runningAbc = true;
        logo.runFromBlockNow(logo, 0, 0, 0, null);
        expect(mockActivity.save.afterSaveAbc).toHaveBeenCalled();

        logo.runningMxml = true;
        logo.runFromBlockNow(logo, 0, 0, 0, null);
        expect(mockActivity.save.afterSaveMxml).toHaveBeenCalled();

        turtle0.singer.suppressOutput = true;
        logo.recording = false;
        logo.runFromBlockNow(logo, 0, 0, 0, null);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith("Playback is ready.");
    });

    test("runFromBlockNow dispatches end-of-clamp signals and updates status matrix", () => {
        timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
            fn();
            return 31;
        });
        logo.statusMatrix = { isOpen: true, updateAll: jest.fn() };
        logo.blockList = [
            {
                name: "print",
                protoblock: { args: 0, dockTypes: ["flow"], flow: jest.fn(() => [5, 2, null]) },
                connections: [null],
                isValueBlock: () => false,
                isArgBlock: () => false
            },
            null,
            null,
            null,
            null,
            {
                name: "print",
                protoblock: { args: 0, dockTypes: ["flow"], flow: jest.fn(() => null) },
                connections: [null],
                isValueBlock: () => false,
                isArgBlock: () => false
            }
        ];
        turtle0.endOfClampSignals = { 0: ["sig1", "sig2"] };
        turtle0.butNotThese = { 0: [1] };
        turtle0.parameterQueue = [10];
        logo.turtleDelay = 10;

        logo.runFromBlockNow(logo, 0, 0, 0, null);

        expect(mockActivity.stage.dispatchEvent).toHaveBeenCalledWith("sig1");
        expect(logo.statusMatrix.updateAll).toHaveBeenCalled();
        expect(mockActivity.blocks.updateParameterBlock).toHaveBeenCalledWith(logo, 0, 10);
    });

    test("dispatchTurtleSignals with suppressOutput true executes immediate graphics operations", async () => {
        global.delayExecution = jest.fn(() => Promise.resolve());
        turtle0.singer.suppressOutput = true;
        logo.parseArg = jest.fn(() => 7);
        logo.blockList = [
            null,
            { name: "setheading", connections: [null, 9] },
            { name: "setxy", connections: [null, 9, 10] },
            { name: "scrollxy", connections: [null, 9, 10] },
            { name: "right", connections: [null, 9] },
            { name: "forward", connections: [null, 9] },
            { name: "arc", connections: [null, 9, 10] },
            { name: "fill", connections: [] },
            { name: "hollowline", connections: [] }
        ];
        turtle0.singer.embeddedGraphics = { 6: [1, 2, 3, 4, 5, 6, 7, 8] };

        await logo.dispatchTurtleSignals(0, 0.2, 6, 0);

        expect(turtle0.painter.doSetHeading).toHaveBeenCalledWith(7);
        expect(turtle0.painter.doSetXY).toHaveBeenCalledWith(7, 7);
        expect(turtle0.painter.doScrollXY).toHaveBeenCalledWith(7, 7);
        expect(turtle0.painter.doRight).toHaveBeenCalledWith(7);
        expect(turtle0.painter.doForward).toHaveBeenCalledWith(7);
        expect(turtle0.painter.doArc).toHaveBeenCalledWith(7, 7);
        expect(turtle0.painter.doStartFill).toHaveBeenCalled();
        expect(turtle0.painter.doStartHollowLine).toHaveBeenCalled();
    });

    test("dispatchTurtleSignals adjusts dispatchFactor for large stepTime", async () => {
        global.delayExecution = jest.fn(() => Promise.resolve());
        turtle0.singer.suppressOutput = false;
        turtle0.singer.dispatchFactor = 1;
        logo.parseArg = jest.fn(() => 8);
        logo.blockList = [null, { name: "setcolor", connections: [null, 1] }];
        turtle0.singer.embeddedGraphics = { 8: [1] };

        await logo.dispatchTurtleSignals(0, 3, 8, 0);

        expect(turtle0.singer.dispatchFactor).toBe(NOTEDIV / 32);
    });

    test("processShow covers camera/video/file-url and missing file object branches", () => {
        const originalCameraValue = global.CAMERAVALUE;
        const originalVideoValue = global.VIDEOVALUE;
        global.CAMERAVALUE = "camera:1234567";
        global.VIDEOVALUE = "video:1234567";

        logo.processShow(0, null, 1, "camera:1234567");
        logo.processShow(0, null, 2, "video:1234567");
        logo.processShow(0, null, 3, "file://tmp/a.png");
        expect(doUseCamera.mock.calls.some(call => call[3] === false)).toBe(true);
        expect(doUseCamera.mock.calls.some(call => call[3] === true)).toBe(true);
        expect(turtle0.doShowURL).toHaveBeenCalledWith(3, "file://tmp/a.png");

        logo.blockList = [{ connections: [null, null, 1] }, { name: "loadFile" }];
        logo.processShow(0, 0, 12, null);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith("You must select a file.");

        global.CAMERAVALUE = originalCameraValue;
        global.VIDEOVALUE = originalVideoValue;
    });
});
