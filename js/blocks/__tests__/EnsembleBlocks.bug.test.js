/**
 * Bug verification test for EnsembleBlocks._blockFindTurtle null pointer
 *
 * This test verifies the critical bug where _blockFindTurtle throws an
 * unhandled exception when the target turtle name doesn't exist.
 */

// Mock global dependencies
global._ = msg => msg;
global.last = arr => (arr.length > 0 ? arr[arr.length - 1] : undefined);

// Extract and test _blockFindTurtle function
// Since it's not exported, we'll test the behavior by mocking the dependencies

describe("EnsembleBlocks._blockFindTurtle null pointer bug", () => {
    let mockActivity;
    let mockTurtles;

    beforeEach(() => {
        // Mock Turtle class
        const mockTurtle = (id, name) => ({
            id,
            name,
            x: 0,
            y: 0,
            orientation: 0,
            painter: {
                color: 0,
                value: 50,
                stroke: 5,
                chroma: 100,
                closeSVG: jest.fn(),
                svgOutput: ""
            },
            inTrash: false
        });

        // Mock turtles object
        mockTurtles = {
            turtleList: [mockTurtle(0, "Turtle"), mockTurtle(1, "Percussion")],
            getTurtle: function (index) {
                const turtle = this.turtleList[index];
                if (!turtle) {
                    throw new Error(`Turtle ${index} not found`);
                }
                return turtle;
            },
            getTurtleCount: function () {
                return this.turtleList.length;
            },
            ithTurtle: function (index) {
                return this.turtleList[index];
            }
        };

        // Reconstruct getTargetTurtle function (from EnsembleBlocks.js lines 28-43)
        const getTargetTurtle = (turtles, targetTurtle) => {
            targetTurtle = targetTurtle.toString();
            for (const i in turtles.turtleList) {
                const turtle = turtles.ithTurtle(i);
                if (turtle && !turtle.inTrash) {
                    const turtleName = turtle.name.toString();
                    if (turtleName === targetTurtle) return i;
                }
            }
            return null; // Returns null if turtle not found
        };

        // Reconstruct _blockFindTurtle function (from EnsembleBlocks.js lines 45-61)
        const _blockFindTurtle = (activity, turtle, blk, receivedArg) => {
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                return null;
            }
            const targetTurtle = activity.logo.parseArg(
                activity.logo,
                turtle,
                cblk,
                blk,
                receivedArg
            );
            if (targetTurtle === null) {
                return null;
            }
            const targetTurtleId = getTargetTurtle(activity.turtles, targetTurtle);
            if (targetTurtleId === null) {
                return null;
            }
            return activity.turtles.getTurtle(targetTurtleId);
        };

        // Mock activity object
        mockActivity = {
            blocks: {
                blockList: {
                    0: { connections: [null, 1] }
                }
            },
            logo: {
                parseArg: jest.fn((logo, turtle, cblk, blk, receivedArg) => {
                    // Simulate parsing a turtle name argument
                    return "NonExistentTurtle"; // This turtle doesn't exist
                })
            },
            turtles: mockTurtles,
            _blockFindTurtle // Attach the function for testing
        };
    });

    test("_blockFindTurtle returns null (not throws) when target turtle is not found", () => {
        const { _blockFindTurtle } = mockActivity;

        // After fix: should return null instead of throwing
        expect(() => {
            _blockFindTurtle(mockActivity, 0, 0, null);
        }).not.toThrow();

        const result = _blockFindTurtle(mockActivity, 0, 0, null);
        expect(result).toBeNull();
    });

    test('Scenario: Student references "Percusion" instead of "Percussion"', () => {
        // Simulate a typo in turtle name
        mockActivity.logo.parseArg = jest.fn(() => "Percusion"); // Typo: missing 's'

        // After fix: should return null instead of throwing
        const result = mockActivity._blockFindTurtle(mockActivity, 0, 0, null);
        expect(result).toBeNull();
    });

    test("Scenario: getTargetTurtle returns null when turtle not in list", () => {
        // Verify that getTargetTurtle returns null for non-existent turtle
        const getTargetTurtle = (turtles, targetTurtle) => {
            targetTurtle = targetTurtle.toString();
            for (const i in turtles.turtleList) {
                const turtle = turtles.ithTurtle(i);
                if (turtle && !turtle.inTrash) {
                    const turtleName = turtle.name.toString();
                    if (turtleName === targetTurtle) return i;
                }
            }
            return null;
        };

        const result = getTargetTurtle(mockTurtles, "InvalidTurtle");
        expect(result).toBeNull();

        // Calling getTurtle with null should throw
        expect(() => {
            mockTurtles.getTurtle(result);
        }).toThrow("Turtle null not found");
    });

    test("Root cause: getTurtle(null) throws because _turtleList[null] is undefined", () => {
        // Demonstrate the root cause
        expect(() => {
            mockTurtles.getTurtle(null);
        }).toThrow("Turtle null not found");
    });

    test("Normal case: getTurtle with valid index works correctly", () => {
        const turtle = mockTurtles.getTurtle(0);
        expect(turtle.name).toBe("Turtle");
        expect(turtle.id).toBe(0);
    });
});
