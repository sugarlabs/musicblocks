/**
 * MusicBlocks v3.6.2
 *
 * @author nidhi-9900
 *
 * @copyright 2026 nidhi-9900
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

/**
 * My Analysis of FlowBlocks.js
 * -----------------------------
 * After reading through the FlowBlocks.js file, here's what I found:
 * 
 * The file has 17 different block classes for flow control (loops, conditionals, etc.)
 * I studied ActionBlocks.test.js to understand the testing pattern.
 * 
 * Total Classes found: 17
 * 
 * List of classes to test:
 * 1. BackwardBlock (extends FlowClampBlock)
 * 2. DuplicateBlock (extends FlowClampBlock) - Has a complex flow method involving locks
 * 3. DefaultCaseBlock (extends FlowClampBlock) - Used in Switch
 * 4. CaseBlock (extends FlowClampBlock) - Used in Switch
 * 5. SwitchBlock (extends FlowClampBlock) - Main switch controller
 * 6. ClampBlock (extends FlowClampBlock) - Hidden block
 * 7. BreakBlock (extends BaseBlock) - Breaks loops
 * 8. WaitForBlock (extends FlowBlock)
 * 9. UntilBlock (extends FlowClampBlock)
 * 10. WhileBlock (extends FlowClampBlock)
 * 11. IfThenElseBlock (extends FlowClampBlock)
 * 12. IfBlock (extends FlowClampBlock)
 * 13. ForeverBlock (extends FlowClampBlock)
 * 14. RepeatBlock (extends FlowClampBlock)
 * 15. DuplicateFactorBlock (extends ValueBlock)
 * 16. HiddenNoFlowBlock (extends FlowBlock)
 * 17. HiddenBlock (extends FlowBlock)
 * 
 * Test Strategy:
 * - I'll set up the mocks similar to ActionBlocks.test.js since that seems to be the standard.
 * - I will test the simple blocks first (like Forever, Repeat) to make sure setup works.
 * - Then I'll move to the conditional blocks (If, IfThenElse).
 * - Finally I'll test the more complex ones like Switch/Case and Duplicate.
 */

// First, import the main function we're testing
const { setupFlowBlocks } = jest.requireActual("../FlowBlocks");

// --- MOCK SETUP START ---
// Note to self: These mocks are similar to ActionBlocks.test.js
// They provide just enough functionality to test block registration
// Copied and adapted from ActionBlocks.test.js to ensure meaningful tests for blocks
// It seems we need to mock global classes that FlowBlocks.js relies on

global._ = s => s; // Translation function - required by FlowBlocks.js
global.__ = s => s; // Keeping this just in case, but single underscore is what failed
global.NOACTIONERRORMSG = "NO_ACTION";
global.POSNUMBER = "POSITIVE_NUMBER";
global.ZERODIVIDEERRORMSG = "ZERO_DIVIDE";
global.NOINPUTERRORMSG = "NO_INPUT";

// Mocking Queue class since it's used in flow methods
global.Queue = class Queue {
    constructor(child, factor, parentBlk, receivedArg) {
        this.child = child;
        this.factor = factor;
        this.parentBlk = parentBlk;
        this.receivedArg = receivedArg;
    }
};

// BaseBlock mock - key methods are setup, setPalette etc.
class BaseBlock {
    constructor(name) {
        this.name = name;
        this.dockTypes = [null];
        this.size = 1;
        this.lang = "en";
        this.hidden = false;
    }

    setPalette(palette) {
        this.palette = palette;
    }

    setHelpString(help) {
        this.help = help;
    }

    formBlock(defn) {
        this.formDefn = defn;
    }

    beginnerBlock(flag) {
        this.isBeginner = flag;
    }

    changeName(name) {
        this.name = name;
    }

    makeMacro(macro) {
        this.macro = macro;
    }

    updateDockValue(idx, type) {
        // Mock method for updating dock types
        if (!this.dockTypes) this.dockTypes = [];
        this.dockTypes[idx] = type;
    }

    setup(activity) {
        // This is important: it registers the block to the activity
        activity.registeredBlocks = activity.registeredBlocks || {};
        activity.registeredBlocks[this.name] = this;
        return this;
    }
}

// FlowBlock extends BaseBlock
class FlowBlock extends BaseBlock {
    constructor(name) {
        super(name);
    }
    flow() { }
}

// FlowClampBlock extends FlowBlock
class FlowClampBlock extends FlowBlock {
    constructor(name) {
        super(name);
    }
}

// StackClampBlock extends FlowClampBlock (not sure if used but good to have)
class StackClampBlock extends FlowClampBlock {
    constructor(name) {
        super(name);
    }
}

// LeftBlock extends BaseBlock
class LeftBlock extends BaseBlock {
    constructor(name) {
        super(name);
    }
    arg() { }
}

// ValueBlock extends LeftBlock
class ValueBlock extends LeftBlock {
    constructor(name) {
        super(name);
    }
}

// Make these global so FlowBlocks.js can see them
global.BaseBlock = BaseBlock;
global.FlowBlock = FlowBlock;
global.FlowClampBlock = FlowClampBlock;
global.StackClampBlock = StackClampBlock;
global.LeftBlock = LeftBlock;
global.ValueBlock = ValueBlock;

// --- MOCK SETUP END ---

describe("FlowBlocks Unit Tests", () => {
    let activity;
    let logo;
    let mockTurtle;

    // Run this before every test to get a fresh environment
    beforeEach(() => {
        // Clear anything from previous tests
        jest.clearAllMocks();

        // Create a persistent turtle object for this test run
        mockTurtle = {
            queue: [],
            parentFlowQueue: [],
            singer: {
                justCounting: [],
                backward: [], // For BackwardBlock
                duplicateFactor: 1
            },
            endOfClampSignals: {},
            unhighlightQueue: [],
            doWait: jest.fn()
        };

        // Setup the activity object which holds all our blocks
        activity = {
            registeredBlocks: {},
            beginnerMode: false, // Default to normal mode
            blocks: {
                blockList: {},
                actionList: {},
                namedActionList: [],
                findStacks: jest.fn(() => []),
                updateBlockLabels: jest.fn(),
                findBottomBlock: jest.fn(blk => blk) // Simple mock
            },
            turtles: {
                ithTurtle: jest.fn(() => mockTurtle) // Return the same object!
            },
            errorMsg: jest.fn(),
            refreshCanvas: jest.fn(),
            stage: {
                dispatchEvent: jest.fn()
            },
            // Needed for SwitchBlock
            logo: {
                switchBlocks: {},
                switchCases: {}
            }
        };

        // Setup the logo object which handles execution flow
        logo = {
            returns: { 0: [] },
            runFromBlock: jest.fn(),
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            doBreak: jest.fn(),
            switchBlocks: {}, // Will be populated per turtle
            switchCases: {},
            parseArg: jest.fn(),
            stopTurtle: false,
            connectionStore: { 0: {} },
            connectionStoreLock: false
        };

        // Initialize switch structures for turtle 0
        logo.switchBlocks[0] = [];
        logo.switchCases[0] = {};

        // Helper to simulate "last" function which might be used
        global.last = arr => (arr && arr.length > 0 ? arr[arr.length - 1] : null);

        // Finally, run the setup!
        setupFlowBlocks(activity);
    });

    // Helper to easily get a registered block
    const getBlock = name => activity.registeredBlocks[name];

    // --- PHASE 1: Basic Registry Checks ---
    // I want to verify that calling setupFlowBlocks actually created the blocks in the registry.

    test("should register all expected flow blocks", () => {
        // List of all keys I expect to find in registeredBlocks
        const expectedBlocks = [
            "backward",
            // "forward", // Confirmed no forward block
            "duplicatenotes", // from DuplicateBlock
            "defaultcase", // from DefaultCaseBlock
            "case", // from CaseBlock
            "switch", // from SwitchBlock
            "clamp", // from ClampBlock
            "break", // from BreakBlock
            "waitFor", // from WaitForBlock
            "until", // from UntilBlock
            "while", // from WhileBlock
            "ifthenelse", // from IfThenElseBlock
            "if", // from IfBlock
            "forever", // from ForeverBlock
            "repeat", // from RepeatBlock
            "duplicatefactor", // from DuplicateFactorBlock
            "hiddennoflow", // from HiddenNoFlowBlock
            "hidden" // from HiddenBlock
        ];

        // Let's loop through and check each one exists
        expectedBlocks.forEach(name => {
            const block = getBlock(name);
            expect(block).toBeDefined(); // Fixed: expect takes only 1 arg
            // Also check that they are assigned to the "flow" palette
            expect(block.palette).toBe("flow");
        });
    });

    // --- PHASE 2: Testing Common Beginner Blocks ---
    // Starting with Repeat and Forever as they are common for students.

    describe("RepeatBlock Tests", () => {
        test("should have correct properties", () => {
            const block = getBlock("repeat");
            expect(block.isBeginner).toBe(true);
            expect(block.formDefn.name).toBe("repeat");
            expect(block.formDefn.defaults).toEqual([4]); // Defaults to 4 times
        });

        test("flow should return correct count", () => {
            const block = getBlock("repeat");

            // flow(args, logo, turtle, blk)
            // args: [number_of_repeats, next_block]
            const args = [5, "nextBlockId"];
            const result = block.flow(args, logo, 0, 100);

            // Should return [nextBlock, count]
            expect(result).toEqual(["nextBlockId", 5]);
        });

        test("should handle invalid inputs gracefully", () => {
            const block = getBlock("repeat");
            // Pass null as count
            const result = block.flow([null, "next"], logo, 0, 100);

            // Should error if not number
            // Actually, code says: if (args[0] === null ... ) return [null, 0]
            // But let's check what it does do.
            expect(result).toEqual([null, 0]);
        });
    });

    describe("ForeverBlock Tests", () => {
        test("should always return -1 for infinite loop", () => {
            const block = getBlock("forever");
            // args: [next_block]
            const result = block.flow(["someBlock"], logo, 0);
            // Count -1 usually means infinite in this codebase
            expect(result[1]).toBe(-1);
        });

        test("should be a beginner block", () => {
            expect(getBlock("forever").isBeginner).toBe(true);
        });
    });

    // --- PHASE 3: Conditionals ---
    // Testing If and IfThenElse logic.

    describe("IfBlock Tests", () => {
        test("should proceed if condition is true", () => {
            const block = getBlock("if");
            // args: [condition, block_to_run]
            // If condition true, return block and 1
            const result = block.flow([true, "doThisBlock"]);
            expect(result).toEqual(["doThisBlock", 1]);
        });

        test("should do nothing if condition is false", () => {
            const block = getBlock("if");
            // If condition false, it returns undefined (effectively stopping flow for this branch)
            const result = block.flow([false, "doThisBlock"]);
            expect(result).toBeUndefined();
        });
    });

    describe("IfThenElseBlock Tests", () => {
        test("should take 'then' path if true", () => {
            const block = getBlock("ifthenelse");
            // args: [condition, thenBlock, elseBlock]
            const result = block.flow([true, "thenBlock", "elseBlock"]);
            expect(result).toEqual(["thenBlock", 1]);
        });

        test("should take 'else' path if false", () => {
            const block = getBlock("ifthenelse");
            const result = block.flow([false, "thenBlock", "elseBlock"]);
            expect(result).toEqual(["elseBlock", 1]);
        });
    });

    // --- PHASE 4: Loops (While/Until) ---
    // These are slightly more complex because they involve requeuing.

    describe("WhileBlock Tests", () => {
        test("should setup queue if condition is true", () => {
            const block = getBlock("while");
            // Used to fail here because getBlock returned new turtle mock each time
            // Now it returns mockTurtle which is persistent for this test

            // Need to mock connection for parent
            activity.blocks.blockList[10] = { connections: ["parentBlock"] };

            // args: [true (condition), childBlock]
            const result = block.flow([true, 20], logo, 0, 10);

            // Should queue itself again
            expect(mockTurtle.queue.length).toBeGreaterThan(0);
            // And return child flow
            expect(result).toEqual([20, 1]);
        });
    });

    describe("UntilBlock Tests", () => {
        test("should setup queue if condition is false (repeat 'until' true)", () => {
            // Until runs WHILE the condition is FALSE.
            const block = getBlock("until");

            activity.blocks.blockList[10] = { connections: ["parentBlock"] };

            // args: [false, childBlock] -> Should repeat
            const result = block.flow([false, 30], logo, 0, 10);

            expect(mockTurtle.queue.length).toBeGreaterThan(0);
            expect(result).toEqual([30, 1]);
        });
    });

    // --- PHASE 5: Advanced Controls (Switch/Case) ---
    // This is the hardest part. I'll test basic structure first.

    describe("SwitchBlock & Case Tests", () => {
        test("SwitchBlock registers correctly", () => {
            const block = getBlock("switch");
            expect(block.palette).toBe("flow");
            expect(block.formDefn.name).toBe("switch");
        });

        test("CaseBlock works naturally", () => {
            const block = getBlock("case");
            expect(block).toBeDefined();
        });
    });

    // --- PHASE 6: Special Blocks ---

    describe("BackwardBlock", () => {
        test("flow should push to turtle backward stack", () => {
            const block = getBlock("backward");
            const blkId = 55;

            // Mock finding bottom block
            activity.blocks.findBottomBlock.mockReturnValue("someChild");
            // Important: Must have a next block (index 2) or it pops immediately!
            activity.blocks.blockList[blkId] = { connections: [null, null, "nextBlock"] };

            block.flow(["someChild"], logo, 0, blkId);

            // verify it pushed to stack
            expect(mockTurtle.singer.backward).toContain(blkId);
        });
    });

    describe("BreakBlock", () => {
        test("should call logo.doBreak", () => {
            const block = getBlock("break");
            // We expect this to call doBreak on the logo object

            // Mock parent block connection
            activity.blocks.blockList[99] = { connections: ["parent"] };

            block.flow([], logo, 0, 99);

            expect(logo.doBreak).toHaveBeenCalled();
        });
    });

    describe("DuplicateBlock", () => {
        // Testing name because flow is very complex with locks
        test("should be named duplicatenotes", () => {
            const block = getBlock("duplicatenotes");
            expect(block.name).toBe("duplicatenotes");
        });

        test("should handle invalid duplicates input", () => {
            const block = getBlock("duplicatenotes");
            const blkId = 88;
            const childId = "child";

            // Setup block dependencies to prevent crashes in the complex flow method
            activity.blocks.blockList[childId] = { name: "regularBlock", connections: [blkId] };
            activity.blocks.blockList[blkId] = { name: "duplicatenotes", connections: [] }; // Block itself must exist

            // Pass null as duplicate count to trigger error
            // flow(args, logo, turtle, blk, receivedArg)
            block.flow([null, childId], logo, 0, blkId);

            // Should verify it called errorMsg
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blkId);
        });
    });

    // --- PHASE 7: Hidden Blocks ---
    // Just making sure they exist and are hidden.

    describe("Advanced Scenarios (Student TODOs)", () => {

        test("Complex nested flow: Repeat inside If", () => {
            // Scenario: If (true) { Repeat(3) { runBlock } }
            // Setup:
            // 1. IfBlock (id: 100) -> RepeatBlock (id: 101)
            // 2. RepeatBlock (id: 101) -> runBlock (id: 102)

            const ifBlock = getBlock("if");
            const repeatBlock = getBlock("repeat");

            // Step 1: Run IfBlock with true condition
            // flow(args, logo, turtle, blk)
            const ifResult = ifBlock.flow([true, 101], logo, 0, 100);
            expect(ifResult).toEqual([101, 1]); // Proceed to RepeatBlock

            // Step 2: Run RepeatBlock (args: [count, child])
            const repeatResult = repeatBlock.flow([3, 102], logo, 0, 101);
            expect(repeatResult).toEqual([102, 3]); // Execute runBlock 3 times
        });

        test("Error handling: Negative numbers in Repeat", () => {
            const block = getBlock("repeat");
            // Pass negative number
            const result = block.flow([-5, "next"], logo, 0, 100);

            // Should activate error message
            expect(activity.errorMsg).toHaveBeenCalledWith(POSNUMBER, 100);
            // Should return [null, 0] effectively stopping flow
            expect(result).toEqual([null, 0]);
        });

        test("Edge case: Empty Queue handling", () => {
            // Test that running a flow with empty/null/undefined args doesn't crash
            const block = getBlock("repeat");
            // If args[0] is undefined
            const resultUndefined = block.flow([undefined, "next"], logo, 0, 100);
            // The code checks: if (args[1] === undefined) return;
            // if args[0] is not number...

            // Let's test missing child block
            const resultNoChild = block.flow([5], logo, 0, 100);
            expect(resultNoChild).toBeUndefined();
        });
    });

    describe("Hidden Blocks", () => {
        test("ClampBlock is hidden", () => {
            expect(getBlock("clamp").hidden).toBe(true);
        });

        test("HiddenNoFlowBlock is hidden and size 0", () => {
            const block = getBlock("hiddennoflow");
            expect(block.hidden).toBe(true);
            expect(block.size).toBe(0);
        });
    });
});
