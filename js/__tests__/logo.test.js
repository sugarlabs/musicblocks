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
global.delayExecution = jest.fn((ms, callback) => callback());
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
                addEventListener: jest.fn()
            },
            onStopTurtle: jest.fn(),
            onRunTurtle: jest.fn(),
            meSpeak: {
                speak: jest.fn()
            },
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

    describe("processSpeak", () => {
        test("filters text to only valid characters", () => {
            // The code uses this._meSpeak
            logo._meSpeak = { speak: jest.fn() };
            logo.processSpeak("Hello, World! 123");

            expect(logo._meSpeak.speak).toHaveBeenCalledWith("Hello, World ");
        });

        test("handles empty string", () => {
            logo._meSpeak = { speak: jest.fn() };
            logo.processSpeak("");

            expect(logo._meSpeak.speak).toHaveBeenCalledWith("");
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
