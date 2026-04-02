describe("Meter Palette Tests", () => {
    let activity;
    let logo;
    let blockRegistry;

    const meterBlocks = [
        "currentmeter",
        "beatfactor", 
        "bpmfactor",
        "measurevalue",
        "beatvalue",
        "notecounter",
        "notecounter2", 
        "elapsednotes",
        "elapsednotes2",
        "drift",
        "offbeatdo",
        "onbeatdo",
        "everybeatdonew",
        "everybeatdo",
        "setmasterbpm2",
        "setmasterbpm",
        "setbpm3",
        "setbpm2",
        "setbpm",
        "pickup",
        "meter"
    ];

    beforeEach(() => {
        // Setup global mocks
        global._ = message => message;
        global.NOINPUTERRORMSG = "NO_INPUT";
        global.NOACTIONERRORMSG = "NO_ACTION";
        global.TONEBPM = 600;

        // Setup block registry
        blockRegistry = {};

        // Mock activity
        activity = {
            beginnerMode: false,
            blocks: {
                blockList: {}
            },
            turtles: {
                ithTurtle: jest.fn(() => ({
                    singer: {
                        beatFactor: 0,
                        bpm: []
                    }
                }))
            },
            errorMsg: jest.fn()
        };

        // Mock logo
        logo = {
            inStatusMatrix: false,
            statusFields: [],
            actions: {},
            notation: {
                notationTempo: jest.fn()
            },
            tempo: {
                BPMBlocks: [],
                BPMs: []
            },
            inTempo: false,
            insideMeterWidget: false,
            inMusicKeyboard: false,
            musicKeyboard: {},
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            parseArg: jest.fn().mockReturnValue(0.25)
        };

        // Mock Singer
        global.Singer = {
            MeterActions: {
                getCurrentMeter: jest.fn(() => "4/4"),
                getBeatFactor: jest.fn(() => 0.5),
                getBPM: jest.fn(() => 120),
                getMeasureCount: jest.fn(() => 3),
                getBeatCount: jest.fn(() => 2),
                getWholeNotesPlayed: jest.fn(() => 4),
                getNotesPlayed: jest.fn(() => 8),
                setNoClock: jest.fn(),
                onWeakBeatDo: jest.fn(),
                onStrongBeatDo: jest.fn(),
                onEveryBeatDo: jest.fn(),
                onEveryNoteDo: jest.fn(),
                setMasterBPM: jest.fn(),
                setBPM: jest.fn(),
                setPickup: jest.fn(),
                setMeter: jest.fn()
            },
            noteCounter: jest.fn(() => 11),
            numberOfNotes: jest.fn(() => 12),
            masterBPM: 0,
            defaultBPMFactor: 0
        };

        // Mock block classes
        global.ValueBlock = class {
            constructor(name, label) {
                this.name = name;
                this.label = label;
                this.lang = "en";
                blockRegistry[name] = this;
            }

            setPalette(palette, activityRef) {
                this.palette = palette;
                this.activityRef = activityRef;
            }

            setHelpString(help) {
                this.help = help;
            }

            formBlock(schema) {
                this.schema = schema;
            }

            makeMacro(factory) {
                this.macroFactory = factory;
            }

            beginnerBlock(flag) {
                this.beginnerFlag = flag;
            }

            setup(activityRef) {
                this.setupActivity = activityRef;
            }

            updateParameter(activity, block, name) {
                if (activity.blocks.blockList[name]) {
                    return activity.blocks.blockList[name].value;
                }
                return 0;
            }

            arg(logo, turtle, blk) {
                return this.updateParameter(activity, turtle, blk);
            }

            setter(logo, value, turtle) {
                // Mock setter implementation
            }
        };

        global.LeftBlock = class extends global.ValueBlock {};
        global.FlowBlock = class extends global.ValueBlock {
            flow(args, logo, turtle, blk) {
                return [];
            }
        };
        global.FlowClampBlock = class extends global.FlowBlock {};
    });

    describe("Meter Block Registration", () => {
        test("all meter blocks should be defined in block registry", () => {
            // Load MeterBlocks module
            require("../js/blocks/MeterBlocks")(activity);
            
            meterBlocks.forEach(blockName => {
                expect(blockRegistry[blockName]).toBeDefined();
                expect(blockRegistry[blockName].name).toBe(blockName);
            });
        });

        test("meter blocks should have correct properties", () => {
            require("../js/blocks/MeterBlocks")(activity);
            
            // Test a few key blocks
            const meterBlock = blockRegistry["meter"];
            const currentMeterBlock = blockRegistry["currentmeter"];
            const setBpmBlock = blockRegistry["setbpm"];
            
            expect(meterBlock).toBeDefined();
            expect(currentMeterBlock).toBeDefined();
            expect(setBpmBlock).toBeDefined();
        });
    });

    describe("Meter Block Functionality", () => {
        beforeEach(() => {
            require("../js/blocks/MeterBlocks")(activity);
        });

        test("currentmeter should return current meter", () => {
            const block = blockRegistry["currentmeter"];
            activity.blocks.blockList.current = {
                value: "4/4",
                connections: ["printBlock"]
            };
            
            logo.inStatusMatrix = false;
            const result = block.arg(logo, 0, "current");
            
            expect(result).toBe("4/4");
            expect(global.Singer.MeterActions.getCurrentMeter).toHaveBeenCalled();
        });

        test("beatfactor should handle beat factor operations", () => {
            const block = blockRegistry["beatfactor"];
            const turtle = { singer: { beatFactor: 0 } };
            activity.turtles.ithTurtle.mockReturnValue(turtle);
            
            block.setter(logo, 0.75, 2);
            expect(turtle.singer.beatFactor).toBe(0.75);
        });

        test("meter block should set meter with defaults", () => {
            const block = blockRegistry["meter"];
            
            block.flow([null, null], logo, 1, "meterBlk");
            
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, "meterBlk");
            expect(global.Singer.MeterActions.setMeter).toHaveBeenCalledWith(4, 0.25, 1);
        });

        test("setbpm should validate BPM range", () => {
            const block = blockRegistry["setbpm"];
            const turtle = { singer: { bpm: [] } };
            activity.turtles.ithTurtle.mockReturnValue(turtle);
            
            // Test minimum BPM
            block.flow([20, "next"], logo, 0, "legacyBpm");
            expect(activity.errorMsg).toHaveBeenCalledWith("Beats per minute must be > 30.", "legacyBpm");
            expect(turtle.singer.bpm).toEqual([30]);
            
            // Test maximum BPM
            block.flow([5000, "next"], logo, 0, "legacyBpm");
            expect(activity.errorMsg).toHaveBeenCalledWith("Maximum beats per minute is 1000.", "legacyBpm");
        });

        test("pickup should validate input", () => {
            const block = blockRegistry["pickup"];
            
            block.flow(["invalid"], logo, 0, "pickup");
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, "pickup");
            
            block.flow([2], logo, 0, "pickup");
            expect(global.Singer.MeterActions.setPickup).toHaveBeenCalledWith(2, 0, activity);
        });

        test("drift should handle flow control", () => {
            const block = blockRegistry["drift"];
            
            // Test with no next block
            const result1 = block.flow([], logo, 0, "drift");
            expect(global.Singer.MeterActions.setNoClock).not.toHaveBeenCalled();
            expect(result1).toBeUndefined();
            
            // Test with next block
            const result2 = block.flow(["next"], logo, 0, "drift");
            expect(global.Singer.MeterActions.setNoClock).toHaveBeenCalledWith(0, "drift");
            expect(result2).toEqual(["next", 1]);
        });
    });

    describe("Status Matrix Integration", () => {
        beforeEach(() => {
            require("../js/blocks/MeterBlocks")(activity);
        });

        test("blocks should report to status matrix when enabled", () => {
            const currentMeterBlock = blockRegistry["currentmeter"];
            const beatFactorBlock = blockRegistry["beatfactor"];
            
            activity.blocks.blockList.current = {
                value: "4/4",
                connections: ["printBlock"]
            };
            activity.blocks.blockList.printBlock = { name: "print" };
            activity.blocks.blockList.beatfactor = {
                value: 0.5,
                connections: ["printBlock"]
            };
            
            logo.inStatusMatrix = true;
            
            currentMeterBlock.arg(logo, 0, "current");
            beatFactorBlock.arg(logo, 0, "beatfactor");
            
            expect(logo.statusFields).toContainEqual(["current", "currentmeter"]);
            expect(logo.statusFields).toContainEqual(["beatfactor", "beatfactor"]);
        });
    });

    describe("Parameter Update Tests", () => {
        beforeEach(() => {
            require("../js/blocks/MeterBlocks")(activity);
        });

        test("parameter blocks should update correctly", () => {
            const parameterBlocks = [
                "currentmeter",
                "beatfactor", 
                "bpmfactor",
                "measurevalue",
                "beatvalue",
                "notecounter",
                "notecounter2",
                "elapsednotes",
                "elapsednotes2"
            ];

            parameterBlocks.forEach((blockName, index) => {
                const block = blockRegistry[blockName];
                activity.blocks.blockList[blockName] = { value: index };
                
                const result = block.updateParameter(activity, 0, blockName);
                expect(result).toBe(index);
            });
        });
    });
});
