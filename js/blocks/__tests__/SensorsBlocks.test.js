/**
 * MusicBlocks v3.6.2
 *
 * @author Alok Dangre
 *
 * @copyright 2025 Alok Dangre
 *
 * @license
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

const { setupSensorsBlocks } = require("../SensorsBlocks");

// --- Dummy Base Classes ---

class DummyFlowBlock {
    constructor(name, displayName) {
        this.name = name;
        this.displayName = displayName;
        DummyFlowBlock.createdBlocks[name] = this;
    }
    setPalette(palette, activity) {
        this.palette = palette;
        return this;
    }
    beginnerBlock(flag) {
        this.isBeginner = flag;
        return this;
    }
    setHelpString(helpArray) {
        this.help = helpArray;
        return this;
    }
    formBlock(params) {
        this.blockParams = params;
        return this;
    }
    makeMacro(macroFunc) {
        this.macro = macroFunc;
        return this;
    }
    setup(activity) {
        // In production, this registers the block.
        return this;
    }
}
DummyFlowBlock.createdBlocks = {};

class DummyValueBlock extends DummyFlowBlock {}
class DummyLeftBlock extends DummyFlowBlock {}
class DummyBooleanSensorBlock extends DummyValueBlock {}

// Expose dummy classes globally.
global.FlowBlock = DummyFlowBlock;
global.ValueBlock = DummyValueBlock;
global.LeftBlock = DummyLeftBlock;
global.BooleanSensorBlock = DummyBooleanSensorBlock;

// --- Persistent Dummy DOM Elements ---

// Create a persistent store for dummy elements.
const documentElements = {
    labelDiv: {
        innerHTML: "",
        classList: { add: jest.fn(), remove: jest.fn() },
        style: {},
        addEventListener: jest.fn()
    },
    textLabel: {
        value: "",
        placeholder: "",
        style: {},
        focus: jest.fn(),
        blur: jest.fn(),
        addEventListener: jest.fn()
    },
    overlayCanvas: {
        getContext: jest.fn(() => ({
            getImageData: jest.fn((x, y, w, h) => {
                return { data: [100, 150, 200, 255] };
            })
        }))
    }
};

global.docById = function (id) {
    return documentElements[id] || null;
};

// --- Dummy Utility Functions ---

global.toFixed2 = function (value) {
    return Number(value).toFixed(2);
};

global.hex2rgb = function (hex) {
    // Dummy conversion: simply return a fixed rgb string.
    return "rgb(100,150,200)";
};

global.searchColors = function (r, g, b) {
    return `rgb(${r},${g},${b})`;
};

global.Tone = {
    Analyser: class {
        constructor(options) {
            this.type = options.type;
            this.size = options.size;
            this.smoothing = options.smoothing;
            this.sampleTime = 0.01;
        }
        getValue() {
            return Array(this.size).fill(-100).map((val, i) => val + i);
        }
    }
};

global.platformColor = {
    background: "rgb(200,200,200)"
};

global._THIS_IS_MUSIC_BLOCKS_ = true;

// --- Dummy Stage Functions ---

function dummyStageX() {
    return 123;
}
function dummyStageY() {
    return 456;
}
function dummyStageMouseDown() {
    return true;
}
function dummyCurrentKeyCode() {
    return 65;
}
function dummyClearCurrentKeyCode() {
    // For testing, do nothing.
}

// --- Dummy Turtle ---

const dummyTurtle = {
    id: "t1",
    container: { x: 50, y: 100, visible: true },
    painter: { canvasColor: "rgb(255,0,0)" },
    doWait: jest.fn()
};

const createDummyTurtle = () => {
    return { ...dummyTurtle };
};

// --- Test Suite for SensorBlocks ---

describe("setupSensorsBlocks", () => {
    let activity, logo, turtleIndex;

    beforeEach(() => {
        // Reset created blocks.
        DummyFlowBlock.createdBlocks = {};

        // Define global constants.
        global.NOINPUTERRORMSG = "No input provided";
        global.NANERRORMSG = "Not a number";

        // Dummy internationalization.
        global._ = jest.fn((str) => str);

        // Dummy activity.
        activity = {
            errorMsg: jest.fn(),
            blocks: { blockList: {} },
            getStageX: dummyStageX,
            getStageY: dummyStageY,
            getStageMouseDown: dummyStageMouseDown,
            getCurrentKeyCode: dummyCurrentKeyCode,
            clearCurrentKeyCode: dummyClearCurrentKeyCode,
            refreshCanvas: jest.fn()
        };

        // Dummy turtles.
        activity.turtles = {
            turtleObjs: {},
            getTurtle(turtle) {
                if (!this.turtleObjs[turtle]) {
                    this.turtleObjs[turtle] = createDummyTurtle();
                }
                return this.turtleObjs[turtle];
            },
            ithTurtle(turtle) {
                return this.getTurtle(turtle);
            }
        };

        // Dummy logo.
        logo = {
            inStatusMatrix: false,
            statusFields: [],
            inputValues: {},
            lastKeyCode: null,
            clearTurtleRun: jest.fn(),
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn()
        };

        turtleIndex = 0;

        // Initialize sensor blocks.
        setupSensorsBlocks(activity);
    });

    describe("GetColorPixelBlock", () => {
        let block, logo, turtle;
        let originalDocById;
    
        beforeEach(() => {
            block = DummyFlowBlock.createdBlocks["getcolorpixel"];
            logo = {
                inStatusMatrix: false,
                statusFields: [],
                inputValues: {},
                lastKeyCode: null,
                clearTurtleRun: jest.fn(),
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn()
            };
            turtle = 0;
    
            // Save the original docById and set up the mock
            originalDocById = global.docById;
            global.docById = jest.fn((id) => documentElements[id] || null);
    
            // Ensure the turtle is set up correctly
            activity.turtles.getTurtle = jest.fn((turtle) => {
                const t = createDummyTurtle();
                if (turtle === 999) {
                    throw new Error(`Turtle ${turtle} not found`);
                }
                return t;
            });
        });
    
        afterEach(() => {
            // Restore the original docById after each test
            global.docById = originalDocById;
        });
    
        describe("arg", () => {
            it("should return a color value for a pixel", () => {
                const color = block.arg(logo, turtle);
                expect(color).toBe("rgb(100,150,200)");
            });
    
            it("should return fallback color if turtle is not found", () => {
                const color = block.arg(logo, 999);
                expect(color).toBe("rgb(128,128,128)");
            });
    
            it("should return fallback color if turtle container is missing", () => {
                activity.turtles.getTurtle = jest.fn(() => ({})); // Turtle exists but no container
                const color = block.arg(logo, turtle);
                expect(color).toBe("rgb(128,128,128)");
            });
    
            it("should handle canvas errors and return fallback color", () => {
                global.docById = jest.fn(() => null); // Simulate canvas failure
                const color = block.arg(logo, turtle);
                expect(color).toBe("rgb(128,128,128)");
            });
    
            it("should restore turtle visibility after successful execution", () => {
                const turtleObj = createDummyTurtle();
                activity.turtles.getTurtle = jest.fn(() => turtleObj);
                block.arg(logo, turtle);
                expect(turtleObj.container.visible).toBe(true);
            });
    
            it("should not attempt to restore visibility if turtle is not found", () => {
                const color = block.arg(logo, 999);
                expect(color).toBe("rgb(128,128,128)");
            });
    
            it("should not attempt to restore visibility if container is missing", () => {
                const turtleObj = { container: null };
                activity.turtles.getTurtle = jest.fn(() => turtleObj);
                const color = block.arg(logo, turtle);
                expect(color).toBe("rgb(128,128,128)");
            });
        });
    
        describe("getPixelData", () => {
            it("should return pixel data from the canvas", () => {
                const pixelData = block.getPixelData(50, 100);
                expect(pixelData).toEqual([100, 150, 200, 255]);
            });
    
            it("should throw an error if canvas context is unavailable", () => {
                global.docById = jest.fn(() => null);
                expect(() => block.getPixelData(50, 100)).toThrow("Canvas context unavailable");
            });
        });
    
        describe("detectColor", () => {
            it("should return color index for opaque pixel", () => {
                const pixelData = [100, 150, 200, 255];
                const color = block.detectColor(pixelData);
                expect(color).toBe("rgb(100,150,200)");
            });
    
            it("should return background color for transparent pixel", () => {
                const pixelData = [100, 150, 200, 0];
                const color = block.detectColor(pixelData);
                expect(color).toBe("rgb(200,200,200)");
            });
    
            it("should throw an error for invalid pixel data", () => {
                const pixelData = [100, 150]; // Invalid length
                expect(() => block.detectColor(pixelData)).toThrow("Invalid pixel data");
            });
        });
    
        describe("getBackgroundColor", () => {
            it("should parse and return background color", () => {
                const color = block.getBackgroundColor();
                expect(color).toBe("rgb(200,200,200)");
            });
        });
    
        describe("getFallbackColor", () => {
            it("should return a default gray color", () => {
                const color = block.getFallbackColor();
                expect(color).toBe("rgb(128,128,128)");
            });
        });
    });

    describe("InputBlock", () => {
        it("should set up the input form and wait for input", () => {
            const inputBlock = DummyFlowBlock.createdBlocks["input"];
            // Stub doWait on the turtle.
            activity.turtles.ithTurtle(turtleIndex).doWait = jest.fn();
            // Set up dummy block connections.
            activity.blocks.blockList["blkInput"] = {
                connections: [null, "cblk1"]
            };
            activity.blocks.blockList["cblk1"] = { value: "Enter text" };
            inputBlock.flow([], logo, turtleIndex, "blkInput");
            const labelDiv = docById("labelDiv");
            expect(labelDiv.innerHTML).toContain("input id=\"textLabel\"");
            expect(activity.turtles.ithTurtle(turtleIndex).doWait).toHaveBeenCalledWith(120);
            // Note: we are not simulating the keypress event.
        });
    });

    describe("InputValueBlock", () => {
        it("should return input value if present", () => {
            logo.inputValues[turtleIndex] = 42;
            const inputValueBlock = DummyFlowBlock.createdBlocks["inputvalue"];
            expect(inputValueBlock.updateParameter(logo, turtleIndex)).toEqual(42);
            expect(inputValueBlock.arg(logo, turtleIndex, "blkIV")).toEqual(42);
        });
        it("should call errorMsg and return 0 if no input value", () => {
            const inputValueBlock = DummyFlowBlock.createdBlocks["inputvalue"];
            const ret = inputValueBlock.arg(logo, turtleIndex, "blkIV");
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", "blkIV");
            expect(ret).toEqual(0);
        });
    });

    describe("PitchnessBlock", () => {
        it("should return a frequency based on pitch analyser", () => {
            logo.mic = { connect: jest.fn() };
            logo.pitchAnalyser = null;
            logo.limit = 16;
            const pitchBlock = DummyFlowBlock.createdBlocks["pitchness"];
            const freq = pitchBlock.arg(logo);
            expect(typeof freq).toEqual("number");
        });
    });

    describe("LoudnessBlock", () => {
        it("should return computed loudness", () => {
            logo.mic = { connect: jest.fn() };
            logo.volumeAnalyser = null;
            logo.limit = 16;
            const loudnessBlock = DummyFlowBlock.createdBlocks["loudness"];
            const loudness = loudnessBlock.arg(logo);
            expect(typeof loudness).toEqual("number");
        });
    });

    describe("MyClickBlock", () => {
        it("should return a click event string with turtle id", () => {
            activity.turtles.getTurtle = jest.fn(() => ({ id: "T123" }));
            const clickBlock = DummyFlowBlock.createdBlocks["myclick"];
            const ret = clickBlock.arg(logo, turtleIndex);
            expect(ret).toEqual("clickT123");
        });
    });

    describe("MouseYBlock", () => {
        it("should return stage Y position", () => {
            const mouseYBlock = DummyFlowBlock.createdBlocks["mousey"];
            const ret = mouseYBlock.arg(logo, turtleIndex, "blkMY");
            expect(ret).toEqual(dummyStageY());
        });
    });

    describe("ToASCIIBlock", () => {
        it("should convert a number to a character", () => {
            activity.blocks.blockList["blkASCII"] = { connections: [null, "cblkASCII"] };
            activity.blocks.blockList["cblkASCII"] = {};
            logo.parseArg = jest.fn(() => 65);
            const asciiBlock = DummyFlowBlock.createdBlocks["toascii"];
            const ret = asciiBlock.arg(logo, turtleIndex, "blkASCII", 65);
            expect(ret).toEqual("A");
        });
        it("should call errorMsg and return 0 for non-number input", () => {
            activity.blocks.blockList["blkASCII2"] = { connections: [null, "cblkASCII2"] };
            activity.blocks.blockList["cblkASCII2"] = {};
            logo.parseArg = jest.fn(() => "NaN");
            const asciiBlock = DummyFlowBlock.createdBlocks["toascii"];
            const ret = asciiBlock.arg(logo, turtleIndex, "blkASCII2", "NaN");
            expect(activity.errorMsg).toHaveBeenCalledWith("Not a number", "blkASCII2");
            expect(ret).toEqual(0);
        });
    });

    describe("KeyboardBlock", () => {
        it("should return the last key code and clear it", () => {
            logo.lastKeyCode = 66;
            activity.getCurrentKeyCode = jest.fn(() => 66);
            activity.clearCurrentKeyCode = jest.fn();
            const keyboardBlock = DummyFlowBlock.createdBlocks["keyboard"];
            const ret = keyboardBlock.arg(logo);
            expect(ret).toEqual(66);
            expect(activity.clearCurrentKeyCode).toHaveBeenCalled();
        });
    });

    describe("TimeBlock", () => {
        it("should return elapsed time in seconds", () => {
            logo.time = new Date().getTime() - 5000;
            const timeBlock = DummyFlowBlock.createdBlocks["time"];
            const ret = timeBlock.arg(logo);
            expect(ret).toBeGreaterThanOrEqual(4.9);
            expect(ret).toBeLessThanOrEqual(5.1);
        });
    });

    describe("MouseXBlock", () => {
        it("should return stage X position", () => {
            const mouseXBlock = DummyFlowBlock.createdBlocks["mousex"];
            const ret = mouseXBlock.arg(logo, turtleIndex, "blkMX");
            expect(ret).toEqual(dummyStageX());
        });
    });

    describe("MouseButtonBlock", () => {
        it("should return stage mouse down state", () => {
            const mouseButtonBlock = DummyFlowBlock.createdBlocks["mousebutton"];
            const ret = mouseButtonBlock.arg(logo);
            expect(ret).toEqual(dummyStageMouseDown());
        });
    });
});
