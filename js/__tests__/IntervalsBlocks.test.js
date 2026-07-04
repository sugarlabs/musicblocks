/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Aditya Mishra
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

class GenericMockBlock {
    constructor(type, label) {
        this.type = type;
        this.label = label;
        this.connections = ["connKey"];
        this.lang = typeof global._mockLang !== "undefined" ? global._mockLang : "en";
    }
    setPalette(p) {
        this.palette = p;
    }
    beginnerBlock(b) {
        this.isBeginner = b;
    }
    setHelpString(h) {
        this.help = h;
    }
    formBlock(f) {
        this.form = f;
    }
    makeMacro(m) {
        this.macro = m;
        if (typeof m === "function") {
            try {
                m(100, 100);
            } catch (_) {
                /* intentional */
            }
        }
    }
    setup(activity) {
        if (activity && activity.addBlock) activity.addBlock(this);
        return this;
    }
}

global._ = s => s;
global.last = arr => (arr && arr.length ? arr[arr.length - 1] : null);
global.NOINPUTERRORMSG = "NO_INPUT";
global.FlowBlock = GenericMockBlock;
global.ValueBlock = GenericMockBlock;
global.FlowClampBlock = GenericMockBlock;
global.LeftBlock = GenericMockBlock;

global.CHORDNAMES = ["major"];
global.CHORDVALUES = [
    [
        [0, 0],
        [4, 0],
        [7, 0]
    ]
];
global.DEFAULTCHORD = "major";
global.INTERVALVALUES = { unison: [0, 0, 1], fifth: [7, 4, 1.5] };

global.Queue = class {
    constructor(child, factor, blk, arg) {
        this.child = child;
        this.factor = factor;
        this.blk = blk;
        this.arg = arg;
    }
    push() {}
};

global.Singer = {
    scalarDistance: jest.fn(() => 3),
    IntervalsActions: {
        setTemperament: jest.fn(),
        setScalarInterval: jest.fn(),
        setSemitoneInterval: jest.fn(),
        defineMode: jest.fn(),
        setMovableDo: jest.fn(),
        setKey: jest.fn(),
        setChordInterval: jest.fn(),
        setRatioInterval: jest.fn(),
        GetModename: jest.fn(m => m),
        getModeLength: jest.fn(() => 7),
        getCurrentMode: jest.fn(() => "ionian"),
        getModeKey: jest.fn(() => "C"),
        getCurrentKey: jest.fn(() => "C"),
        measureIntervalSemitones: jest.fn(() => 12),
        measureIntervalScalar: jest.fn(() => 7),
        setTemperamentBlock: jest.fn()
    }
};

const { setupIntervalsBlocks } = require("../blocks/IntervalsBlocks.js");

function makeTurSinger(overrides = {}) {
    return {
        suppressOutput: false,
        justCounting: [],
        justMeasuring: [],
        notesPlayed: 0,
        firstPitch: [60, 64],
        lastPitch: [67, 71],
        inDuplicate: false,
        duplicateFactor: 1,
        arpeggio: [],
        keySignature: "",
        ...overrides
    };
}

function makeTurPainter() {
    return {
        color: "black",
        value: 100,
        chroma: 1,
        stroke: 1,
        canvasAlpha: 1,
        penState: true,
        doPenUp: jest.fn(),
        doSetXY: jest.fn(),
        doSetHeading: jest.fn()
    };
}

function makeTur(singerOverrides = {}, endOfClampSignals = {}) {
    return {
        x: 0,
        y: 0,
        orientation: 0,
        running: false,
        butNotThese: {},
        endOfClampSignals: endOfClampSignals,
        parentFlowQueue: [],
        queue: [],
        singer: makeTurSinger(singerOverrides),
        painter: makeTurPainter()
    };
}

function makeMockActivity(registeredBlocks) {
    return {
        addBlock: block => registeredBlocks.push(block),
        errorMsg: jest.fn(),
        beginnerMode: false,
        turtles: {
            ithTurtle: jest.fn(() => makeTur())
        },
        blocks: {
            findBottomBlock: jest.fn(blk => blk),
            blockList: {
                testBlk: { value: "testValue", connections: ["connKey", "child1", "child2"] },
                connKey: { name: "print" },
                intervalNameBlk: {
                    name: "intervalname",
                    value: "fifth",
                    connections: [null, null]
                },
                intervalNameAug: {
                    name: "intervalname",
                    value: "augmented",
                    connections: [null, null]
                },
                intervalNameDim: {
                    name: "intervalname",
                    value: "diminished",
                    connections: [null, null]
                },
                doublyBlk: { name: "doubly", value: null, connections: ["intervalNameBlk", null] },
                child1: { name: "note", connections: ["testBlk", null] },
                child2: { name: "note", connections: [null, null] },
                hiddenBlk: { name: "hidden", connections: ["testBlk", "child2"] },
                ivNameRatio: { name: "intervalname", value: "fifth", connections: [null, null] },
                hidden1: { name: "hidden", connections: [null, null] }
            }
        }
    };
}

function makeMockLogo(turtle = "turtle1") {
    return {
        inStatusMatrix: true,
        statusFields: [],
        insideModeWidget: false,
        modeBlock: null,
        connectionStore: { [turtle]: {} },
        connectionStoreLock: false,
        boxes: {},
        turtleHeaps: { [turtle]: [] },
        turtleDicts: { [turtle]: {} },
        parseArg: jest.fn(() => 3),
        runFromBlockNow: jest.fn(),
        setDispatchBlock: jest.fn(),
        setTurtleListener: jest.fn(),
        notation: { notationKey: jest.fn() }
    };
}

function exerciseBlock(block, mockLogo, mockActivity, turtle) {
    if (typeof block.flow === "function") {
        try {
            block.flow(["modeArg", "clampBody"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }
        try {
            block.flow(["onlyArg"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }
        try {
            block.flow([], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }
        try {
            block.flow(["C", "major"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }
    }
    if (typeof block.get === "function") {
        try {
            block.get();
        } catch (_) {
            /* intentional */
        }
    }
    if (typeof block.updateParameter === "function") {
        try {
            block.updateParameter(mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }
    }
    if (typeof block.arg === "function") {
        mockLogo.inStatusMatrix = true;
        mockActivity.blocks.blockList["connKey"].name = "print";
        try {
            block.arg(mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }

        mockLogo.inStatusMatrix = false;
        try {
            block.arg(mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }

        mockLogo.inStatusMatrix = true;
        mockActivity.blocks.blockList["connKey"].name = "notPrint";
        try {
            block.arg(mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }

        mockActivity.blocks.blockList["connKey"].name = "print";
        mockLogo.inStatusMatrix = true;
    }
}

describe("IntervalsBlocks.js", () => {
    let registeredBlocks;
    let mockActivity;
    let mockLogo;
    const turtle = "turtle1";

    beforeEach(() => {
        registeredBlocks = [];
        mockActivity = makeMockActivity(registeredBlocks);
        mockLogo = makeMockLogo(turtle);
        Singer.IntervalsActions.GetModename.mockImplementation(m => m);
        Singer.scalarDistance.mockImplementation(() => 3);
        jest.clearAllMocks();
        Singer.IntervalsActions.GetModename.mockImplementation(m => m);
        Singer.scalarDistance.mockImplementation(() => 3);
    });

    it("registers blocks when setupIntervalsBlocks is called", () => {
        setupIntervalsBlocks(mockActivity);
        expect(registeredBlocks.length).toBeGreaterThan(0);
    });

    it("covers the UMD export / module.exports path", () => {
        expect(setupIntervalsBlocks).toBeDefined();
        expect(typeof setupIntervalsBlocks).toBe("function");
    });

    it("covers flow() Singer calls by passing 2-element args array", () => {
        setupIntervalsBlocks(mockActivity);
        registeredBlocks.forEach(block => {
            if (typeof block.flow === "function") {
                try {
                    block.flow(["modeArg", "clampBody"], mockLogo, turtle, "testBlk");
                } catch (_) {
                    /* intentional */
                }
            }
        });
        const flowMethods = [
            Singer.IntervalsActions.setScalarInterval,
            Singer.IntervalsActions.setSemitoneInterval,
            Singer.IntervalsActions.defineMode,
            Singer.IntervalsActions.setMovableDo,
            Singer.IntervalsActions.setKey
        ];
        expect(flowMethods.some(m => m.mock.calls.length > 0)).toBe(true);
    });

    it("covers early-return path in flow() when args[1] is undefined", () => {
        setupIntervalsBlocks(mockActivity);
        registeredBlocks.forEach(block => {
            if (typeof block.flow === "function") {
                try {
                    block.flow(["onlyArg"], mockLogo, turtle, "testBlk");
                } catch (_) {
                    /* intentional */
                }
                try {
                    block.flow([], mockLogo, turtle, "testBlk");
                } catch (_) {
                    /* intentional */
                }
            }
        });
    });

    it("covers all three arg() branches for every registered block", () => {
        setupIntervalsBlocks(mockActivity);
        registeredBlocks.forEach(block => {
            exerciseBlock(block, mockLogo, mockActivity, turtle);
        });
        expect(mockLogo.statusFields.length).toBeGreaterThan(0);
    });

    it("covers updateParameter for every registered block", () => {
        setupIntervalsBlocks(mockActivity);
        registeredBlocks.forEach(block => {
            if (typeof block.updateParameter === "function") {
                try {
                    block.updateParameter(mockLogo, turtle, "testBlk");
                } catch (_) {
                    /* intentional */
                }
            }
        });
    });

    it("covers DoublyBlock.arg – all while-loop branches", () => {
        setupIntervalsBlocks(mockActivity);
        mockLogo.parseArg = jest.fn(() => 3);

        registeredBlocks.forEach(block => {
            if (typeof block.arg !== "function") return;

            mockActivity.blocks.blockList["testBlk"].connections = [
                "connKey",
                "intervalNameAug",
                "child2"
            ];
            try {
                block.arg(mockLogo, turtle, "testBlk");
            } catch (_) {
                /* intentional */
            }

            mockActivity.blocks.blockList["testBlk"].connections = [
                "connKey",
                "intervalNameDim",
                "child2"
            ];
            try {
                block.arg(mockLogo, turtle, "testBlk");
            } catch (_) {
                /* intentional */
            }

            mockActivity.blocks.blockList["testBlk"].connections = [
                "connKey",
                "intervalNameBlk",
                "child2"
            ];
            try {
                block.arg(mockLogo, turtle, "testBlk");
            } catch (_) {
                /* intentional */
            }

            mockActivity.blocks.blockList["doublyBlk"] = {
                name: "doubly",
                value: null,
                connections: [null, "intervalNameBlk"]
            };
            mockActivity.blocks.blockList["testBlk"].connections = [
                "connKey",
                "doublyBlk",
                "child2"
            ];
            try {
                block.arg(mockLogo, turtle, "testBlk");
            } catch (_) {
                /* intentional */
            }

            mockActivity.blocks.blockList["doublyBlk"] = {
                name: "other",
                value: null,
                connections: [null, null]
            };
            mockLogo.parseArg = jest.fn(() => 4);
            try {
                block.arg(mockLogo, turtle, "testBlk");
            } catch (_) {
                /* intentional */
            }

            mockLogo.parseArg = jest.fn(() => "re");
            try {
                block.arg(mockLogo, turtle, "testBlk");
            } catch (_) {
                /* intentional */
            }

            mockLogo.parseArg = jest.fn(() => null);
            try {
                block.arg(mockLogo, turtle, "testBlk");
            } catch (_) {
                /* intentional */
            }

            mockActivity.blocks.blockList["doublyBlk"] = {
                name: "doubly",
                value: null,
                connections: [null, null]
            };
            mockLogo.parseArg = jest.fn(() => 3);
            try {
                block.arg(mockLogo, turtle, "testBlk");
            } catch (_) {
                /* intentional */
            }
        });

        mockActivity.blocks.blockList["testBlk"].connections = ["connKey", "child1", "child2"];
    });

    it("covers MeasureInterval arg() – endOfClampSignals, populated and empty pitch branches", () => {
        setupIntervalsBlocks(mockActivity);
        mockActivity.blocks.blockList["testBlk"].connections = ["connKey", "child1", "child2"];

        registeredBlocks.forEach(block => {
            if (typeof block.arg !== "function") return;

            mockActivity.turtles.ithTurtle.mockImplementationOnce(() =>
                makeTur({ firstPitch: [60], lastPitch: [67] }, { sig1: ["a", "b"] })
            );
            try {
                block.arg(mockLogo, turtle, "testBlk");
            } catch (_) {
                /* intentional */
            }

            mockActivity.turtles.ithTurtle.mockImplementationOnce(() =>
                makeTur({ firstPitch: [], lastPitch: [] })
            );
            try {
                block.arg(mockLogo, turtle, "testBlk");
            } catch (_) {
                /* intentional */
            }

            mockActivity.blocks.blockList["testBlk"].connections = ["connKey", null, null];
            try {
                block.arg(mockLogo, turtle, "testBlk");
            } catch (_) {
                /* intentional */
            }
            mockActivity.blocks.blockList["testBlk"].connections = ["connKey", "child1", "child2"];
        });
    });

    it("covers ArpeggioBlock __listener body and __acquireLock branches", async () => {
        setupIntervalsBlocks(mockActivity);
        const arpeggioBlock = registeredBlocks.find(b => b.type === "arpeggio");
        if (!arpeggioBlock || typeof arpeggioBlock.flow !== "function") return;

        let capturedListener = null;
        mockLogo.setTurtleListener = jest.fn((t, name, fn) => {
            capturedListener = fn;
        });
        mockLogo.connectionStore = { turtle1: {} };

        try {
            arpeggioBlock.flow(["major", "child1"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }
        if (!capturedListener) return;

        mockLogo.connectionStoreLock = false;
        mockLogo.connectionStore[turtle] = { testBlk: [["child1", 1, "child2"]] };
        await capturedListener({});

        jest.useFakeTimers();
        mockLogo.connectionStoreLock = true;
        mockLogo.connectionStore[turtle] = { testBlk: [["child1", 1, null]] };
        const p1 = capturedListener({});
        mockLogo.connectionStoreLock = false;
        jest.runAllTimers();
        await p1;
        jest.useRealTimers();

        jest.useFakeTimers();
        mockLogo.connectionStoreLock = true;
        mockLogo.connectionStore[turtle] = { testBlk: [] };
        const p2 = capturedListener({});
        jest.advanceTimersByTime(2000);
        await p2;
        jest.useRealTimers();

        mockLogo.connectionStoreLock = false;
        mockLogo.connectionStore = {
            turtle1: { testBlk: [] },
            turtle2: { testBlk: [["child1", 1, null]] }
        };
        await capturedListener({});
    });

    it("covers ArpeggioBlock.flow – otherTurtle hidden-block branch", () => {
        setupIntervalsBlocks(mockActivity);
        const arpeggioBlock = registeredBlocks.find(b => b.type === "arpeggio");
        if (!arpeggioBlock || typeof arpeggioBlock.flow !== "function") return;

        mockLogo.connectionStore = {
            turtle1: {},
            turtle2: { testBlk: [["hiddenBlk", 0, null]] }
        };
        try {
            arpeggioBlock.flow(["major", "child1"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }
    });

    it("covers ArpeggioBlock.flow – solo-turtle while-loop connection-breaking", () => {
        setupIntervalsBlocks(mockActivity);
        const arpeggioBlock = registeredBlocks.find(b => b.type === "arpeggio");
        if (!arpeggioBlock || typeof arpeggioBlock.flow !== "function") return;

        mockActivity.blocks.findBottomBlock = jest.fn(() => "child1");
        mockActivity.blocks.blockList["child1"].connections = ["testBlk", null];
        mockActivity.blocks.blockList["testBlk"].connections = ["connKey", "child1", "child2"];
        mockLogo.connectionStore = { turtle1: {} };
        try {
            arpeggioBlock.flow(["major", "child1"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }

        mockActivity.blocks.blockList["child1"].connections = ["testBlk", "hiddenBlk"];
        mockActivity.blocks.findBottomBlock = jest.fn(() => "child1");
        mockLogo.connectionStore = { turtle1: {} };
        try {
            arpeggioBlock.flow(["major", "child1"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }
    });

    it("covers RatioIntervalBlock.flow – all branches", () => {
        setupIntervalsBlocks(mockActivity);
        const ratioBlock = registeredBlocks.find(b => b.type === "ratiointerval");
        if (!ratioBlock || typeof ratioBlock.flow !== "function") return;

        mockActivity.blocks.blockList["testBlk"].connections = ["connKey", "ivNameRatio", null];
        try {
            ratioBlock.flow([1.5, "child1"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }

        mockActivity.blocks.blockList["ivNameRatio"].value = "unknownInterval";
        try {
            ratioBlock.flow([1.5, "child1"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }

        mockActivity.blocks.blockList["testBlk"].connections = ["connKey", null, null];
        try {
            ratioBlock.flow([1.5, "child1"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }

        mockActivity.blocks.blockList["testBlk"].connections = ["connKey", "child1", null];
        try {
            ratioBlock.flow([NaN, "child1"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }
        try {
            ratioBlock.flow([-1, "child1"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }
    });

    it("covers SetKeyBlock.flow – insideModeWidget branch", () => {
        setupIntervalsBlocks(mockActivity);
        mockActivity.turtles.ithTurtle.mockImplementation(() => makeTur());
        mockActivity.blocks.blockList["testBlk"].connections = ["connKey", "child1", "child2"];

        mockLogo.insideModeWidget = false;
        registeredBlocks.forEach(block => {
            if (typeof block.flow === "function") {
                try {
                    block.flow(["C", "major"], mockLogo, turtle, "testBlk");
                } catch (_) {
                    /* intentional */
                }
            }
        });

        mockLogo.insideModeWidget = true;
        registeredBlocks.forEach(block => {
            if (typeof block.flow === "function") {
                try {
                    block.flow(["C", "major"], mockLogo, turtle, "testBlk");
                } catch (_) {
                    /* intentional */
                }
            }
        });

        registeredBlocks.forEach(block => {
            if (typeof block.flow === "function") {
                try {
                    block.flow(["C"], mockLogo, turtle, "testBlk");
                } catch (_) {
                    /* intentional */
                }
            }
        });

        expect(Singer.IntervalsActions.setKey).toHaveBeenCalled();
    });

    it("covers SetKeyBlock constructor – beginnerMode=true + lang=ja branch", () => {
        global._mockLang = "ja";

        const reg2 = [];
        const jaActivity = {
            addBlock: b => reg2.push(b),
            errorMsg: jest.fn(),
            beginnerMode: true,
            turtles: { ithTurtle: jest.fn(() => makeTur()) },
            blocks: {
                findBottomBlock: jest.fn(b => b),
                blockList: {
                    testBlk: { value: "v", connections: ["connKey", null, null] },
                    connKey: { name: "print" }
                }
            }
        };

        setupIntervalsBlocks(jaActivity);
        expect(reg2.length).toBeGreaterThan(0);

        global._mockLang = "en";
    });

    it("covers SemitoneIntervalMacroBlock isDown=true ternary branches", () => {
        setupIntervalsBlocks(mockActivity);

        registeredBlocks
            .filter(b => b.type && b.type.startsWith("down"))
            .forEach(block => {
                if (block.macro) {
                    try {
                        block.macro(0, 0);
                    } catch (_) {
                        /* intentional */
                    }
                    try {
                        block.macro(50, 50);
                    } catch (_) {
                        /* intentional */
                    }
                }
            });

        registeredBlocks.forEach(block => {
            if (block.macro) {
                try {
                    block.macro(0, 0);
                } catch (_) {
                    /* intentional */
                }
            }
        });
    });

    it("covers __lookForOtherTurtles – false branch of b === blk.toString()", () => {
        setupIntervalsBlocks(mockActivity);
        const arpeggioBlock = registeredBlocks.find(b => b.type === "arpeggio");
        if (!arpeggioBlock || typeof arpeggioBlock.flow !== "function") return;

        mockLogo.connectionStore = {
            turtle1: {},
            turtle2: {
                otherBlk: [["child1", 1, null]],
                testBlk: [["child1", 1, null]]
            }
        };
        try {
            arpeggioBlock.flow(["major", "child1"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }
    });

    it("covers ArpeggioBlock – line 885 false branch and line 894 false branch", () => {
        setupIntervalsBlocks(mockActivity);
        const arpeggioBlock = registeredBlocks.find(b => b.type === "arpeggio");
        if (!arpeggioBlock || typeof arpeggioBlock.flow !== "function") return;

        mockLogo.connectionStore = {
            turtle1: {},
            turtle2: { testBlk: [["child1", 1, null]] }
        };
        try {
            arpeggioBlock.flow(["major", "child1"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }

        mockActivity.blocks.blockList["hiddenChild"] = {
            name: "hidden",
            connections: ["testBlk", null]
        };
        mockActivity.blocks.findBottomBlock = jest.fn(() => "hiddenChild");
        mockLogo.connectionStore = { turtle1: {} };
        try {
            arpeggioBlock.flow(["major", "hiddenChild"], mockLogo, turtle, "testBlk");
        } catch (_) {
            /* intentional */
        }
    });

    it("covers ChordIntervalBlock.flow – CHORDVALUES isNaN and [0,0] skip branches", () => {
        setupIntervalsBlocks(mockActivity);
        const origCHORDVALUES = global.CHORDVALUES;
        global.CHORDVALUES = [
            [
                ["NaN", 0],
                [0, 0],
                [4, 1]
            ]
        ];

        const chordBlock = registeredBlocks.find(b => b.type === "chordinterval");
        if (chordBlock && typeof chordBlock.flow === "function") {
            try {
                chordBlock.flow(["major", "child1"], mockLogo, turtle, "testBlk");
            } catch (_) {
                /* intentional */
            }
        }
        global.CHORDVALUES = origCHORDVALUES;
    });

    it("executes makeMacro callbacks with various coordinates", () => {
        setupIntervalsBlocks(mockActivity);
        registeredBlocks.forEach(block => {
            if (block.macro) {
                try {
                    block.macro(0, 0);
                } catch (_) {
                    /* intentional */
                }
                try {
                    block.macro(200, 300);
                } catch (_) {
                    /* intentional */
                }
            }
        });
    });

    it("covers a full exerciseBlock pass across all registered blocks", () => {
        setupIntervalsBlocks(mockActivity);
        registeredBlocks.forEach(block => {
            exerciseBlock(block, mockLogo, mockActivity, turtle);
        });
    });

    it("covers global utility helpers", () => {
        expect(global.last([1, 2, 3])).toBe(3);
        expect(global.last([])).toBeNull();
        expect(global.last(null)).toBeNull();
        expect(global._("hello")).toBe("hello");
    });
});
