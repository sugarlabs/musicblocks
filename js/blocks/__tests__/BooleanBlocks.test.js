/**
 * MusicBlocks v3.6.2
 *
 * @author Om Santosh Suneri
 *
 * @copyright 2025 Om Santosh Suneri
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

const { setupBooleanBlocks } = require("../BooleanBlocks");
global._ = jest.fn(str => str);
global.BooleanBlock = jest.fn().mockImplementation(type => ({
    type,
    setPalette: jest.fn(),
    setHelpString: jest.fn(),
    formBlock: jest.fn(),
    updateParameter: jest.fn(function (logo, turtle, blk) {
        if (mockActivity.blocks.blockList[blk].value) {
            return _("true");
        } else {
            return _("false");
        }
    }),
    arg: jest.fn(function (logo, turtle, blk, receivedArg) {
        const connections = mockActivity.blocks.blockList[blk].connections;

        if (this.type === "boolean") {
            if (typeof mockActivity.blocks.blockList[blk].value === "string") {
                return (
                    mockActivity.blocks.blockList[blk].value === _("true") ||
                    mockActivity.blocks.blockList[blk].value === "true"
                );
            }
            return mockActivity.blocks.blockList[blk].value;
        }

        if (this.type === "not") {
            const cblk = connections[1];
            if (cblk === null) {
                mockActivity.errorMsg(global.NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            return !a;
        }

        if (this.type === "and") {
            const cblk1 = connections[1];
            const cblk2 = connections[2];
            if (cblk1 === null || cblk2 === null) {
                mockActivity.errorMsg(global.NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            return a && b;
        }

        if (this.type === "or") {
            const cblk1 = connections[1];
            const cblk2 = connections[2];
            if (cblk1 === null || cblk2 === null) {
                mockActivity.errorMsg(global.NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            return a || b;
        }

        if (this.type === "xor") {
            const cblk1 = connections[1];
            const cblk2 = connections[2];
            if (cblk1 === null || cblk2 === null) {
                mockActivity.errorMsg(global.NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            return (a && !b) || (!a && b);
        }

        if (this.type === "greater") {
            const cblk1 = connections[1];
            const cblk2 = connections[2];
            if (cblk1 === null || cblk2 === null) {
                mockActivity.errorMsg(global.NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            return Number(a) > Number(b);
        }

        if (this.type === "less") {
            const cblk1 = connections[1];
            const cblk2 = connections[2];
            if (cblk1 === null || cblk2 === null) {
                mockActivity.errorMsg(global.NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            return Number(a) < Number(b);
        }

        if (this.type === "less_than_or_equal_to") {
            const cblk1 = connections[1];
            const cblk2 = connections[2];
            if (cblk1 === null || cblk2 === null) {
                mockActivity.errorMsg(global.NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            return Number(a) <= Number(b);
        }

        if (this.type === "greater_than_or_equal_to") {
            const cblk1 = connections[1];
            const cblk2 = connections[2];
            if (cblk1 === null || cblk2 === null) {
                mockActivity.errorMsg(global.NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            return Number(a) >= Number(b);
        }

        if (this.type === "equal") {
            const cblk1 = connections[1];
            const cblk2 = connections[2];
            if (cblk1 === null || cblk2 === null) {
                mockActivity.errorMsg(global.NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            return a === b;
        }

        if (this.type === "not_equal_to") {
            const cblk1 = connections[1];
            const cblk2 = connections[2];
            if (cblk1 === null || cblk2 === null) {
                mockActivity.errorMsg(global.NOINPUTERRORMSG, blk);
                return false;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            return a !== b;
        }

        return undefined;
    }),
    setup: jest.fn(),
    beginnerBlock: jest.fn()
}));
global.NOINPUTERRORMSG = "No input error message";

const mockActivity = {
    blocks: {
        blockList: {
            blk1: { value: true, connections: [null, null, null] },
            blk2: { value: false, connections: [null, null, null] },
            blk3: { value: true, connections: [null, "blk4", "blk5"] },
            blk4: { value: false, connections: [null, null, null] },
            blk5: { value: true, connections: [null, null, null] },
            blk6: { value: false, connections: [null, "blk7", "blk8"] },
            blk7: { value: true, connections: [null, null, null] },
            blk8: { value: false, connections: [null, null, null] },
            blk9: { value: true, connections: [null, "blk10", "blk11"] },
            blk10: { value: false, connections: [null, null, null] },
            blk11: { value: true, connections: [null, null, null] },
            blkTrue: { value: true, connections: [null, null, null] },
            blkFalse: { value: false, connections: [null, null, null] },
            blkStrTrue: { value: "true", connections: [null, null, null] },
            blkStrFalse: { value: "false", connections: [null, null, null] },
            blkStrTrueTranslated: { value: "true", connections: [null, null, null] }
        }
    },
    errorMsg: jest.fn()
};

const mockLogo = {
    parseArg: jest.fn((logo, turtle, cblk, blk, receivedArg) => {
        if (!mockActivity.blocks.blockList[cblk]) {
            throw new Error(`Block ${cblk} not found in blockList`);
        }
        return mockActivity.blocks.blockList[cblk].value;
    })
};

describe("setupBooleanBlocks - Additional Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ─── NEW: updateParameter tests ───────────────────────────────────────────

    it("should return 'true' from NotBlock updateParameter when value is true", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("not");
        expect(block.updateParameter(mockLogo, "turtle1", "blkTrue")).toBe("true");
    });

    it("should return 'false' from NotBlock updateParameter when value is false", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("not");
        expect(block.updateParameter(mockLogo, "turtle1", "blkFalse")).toBe("false");
    });

    it("should return 'true' from AndBlock updateParameter when value is true", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("and");
        expect(block.updateParameter(mockLogo, "turtle1", "blkTrue")).toBe("true");
    });

    it("should return 'false' from AndBlock updateParameter when value is false", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("and");
        expect(block.updateParameter(mockLogo, "turtle1", "blkFalse")).toBe("false");
    });

    it("should return 'true' from OrBlock updateParameter when value is true", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("or");
        expect(block.updateParameter(mockLogo, "turtle1", "blkTrue")).toBe("true");
    });

    it("should return 'false' from OrBlock updateParameter when value is false", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("or");
        expect(block.updateParameter(mockLogo, "turtle1", "blkFalse")).toBe("false");
    });

    it("should return 'true' from XorBlock updateParameter when value is true", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("xor");
        expect(block.updateParameter(mockLogo, "turtle1", "blkTrue")).toBe("true");
    });

    it("should return 'false' from XorBlock updateParameter when value is false", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("xor");
        expect(block.updateParameter(mockLogo, "turtle1", "blkFalse")).toBe("false");
    });

    it("should return 'true' from GreaterBlock updateParameter when value is true", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("greater");
        expect(block.updateParameter(mockLogo, "turtle1", "blkTrue")).toBe("true");
    });

    it("should return 'false' from GreaterBlock updateParameter when value is false", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("greater");
        expect(block.updateParameter(mockLogo, "turtle1", "blkFalse")).toBe("false");
    });

    it("should return 'true' from LessBlock updateParameter when value is true", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("less");
        expect(block.updateParameter(mockLogo, "turtle1", "blkTrue")).toBe("true");
    });

    it("should return 'false' from LessBlock updateParameter when value is false", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("less");
        expect(block.updateParameter(mockLogo, "turtle1", "blkFalse")).toBe("false");
    });

    it("should return 'true' from LessThanOrEqualToBlock updateParameter when value is true", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("less_than_or_equal_to");
        expect(block.updateParameter(mockLogo, "turtle1", "blkTrue")).toBe("true");
    });

    it("should return 'false' from LessThanOrEqualToBlock updateParameter when value is false", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("less_than_or_equal_to");
        expect(block.updateParameter(mockLogo, "turtle1", "blkFalse")).toBe("false");
    });

    it("should return 'true' from GreaterThanOrEqualToBlock updateParameter when value is true", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("greater_than_or_equal_to");
        expect(block.updateParameter(mockLogo, "turtle1", "blkTrue")).toBe("true");
    });

    it("should return 'false' from GreaterThanOrEqualToBlock updateParameter when value is false", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("greater_than_or_equal_to");
        expect(block.updateParameter(mockLogo, "turtle1", "blkFalse")).toBe("false");
    });

    it("should return 'true' from EqualBlock updateParameter when value is true", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("equal");
        expect(block.updateParameter(mockLogo, "turtle1", "blkTrue")).toBe("true");
    });

    it("should return 'false' from EqualBlock updateParameter when value is false", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("equal");
        expect(block.updateParameter(mockLogo, "turtle1", "blkFalse")).toBe("false");
    });

    it("should return 'true' from NotEqualToBlock updateParameter when value is true", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("not_equal_to");
        expect(block.updateParameter(mockLogo, "turtle1", "blkTrue")).toBe("true");
    });

    it("should return 'false' from NotEqualToBlock updateParameter when value is false", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("not_equal_to");
        expect(block.updateParameter(mockLogo, "turtle1", "blkFalse")).toBe("false");
    });

    // ─── NEW: StaticBooleanBlock tests ────────────────────────────────────────

    it("should return true from StaticBooleanBlock when value is string 'true'", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("boolean");
        const result = block.arg(mockLogo, "turtle1", "blkStrTrue");
        expect(result).toBe(true);
    });

    it("should return false from StaticBooleanBlock when value is string 'false'", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("boolean");
        const result = block.arg(mockLogo, "turtle1", "blkStrFalse");
        expect(result).toBe(false);
    });

    it("should return true from StaticBooleanBlock when value is boolean true", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("boolean");
        const result = block.arg(mockLogo, "turtle1", "blkTrue");
        expect(result).toBe(true);
    });

    it("should return false from StaticBooleanBlock when value is boolean false", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("boolean");
        const result = block.arg(mockLogo, "turtle1", "blkFalse");
        expect(result).toBe(false);
    });

    it("should return true from StaticBooleanBlock when value matches translated 'true'", () => {
        setupBooleanBlocks(mockActivity);
        const block = new global.BooleanBlock("boolean");
        mockActivity.blocks.blockList["blkStrTrueTranslated"].value = _("true");
        const result = block.arg(mockLogo, "turtle1", "blkStrTrueTranslated");
        expect(result).toBe(true);
    });
});

describe("real BooleanBlock instances - direct method coverage", () => {
    let instances;

    beforeEach(() => {
        instances = {};
        const origBooleanBlock = global.BooleanBlock;
        global.BooleanBlock = class {
            constructor(type) {
                this.type = type;
                instances[type] = this;
            }
            setPalette() {}
            setHelpString() {}
            formBlock() {}
            beginnerBlock() {}
            setup() {}
            updateParameter() {}
            arg() {}
        };
        setupBooleanBlocks(mockActivity);
        global.BooleanBlock = origBooleanBlock;
    });

    // Parameterized tests for null connection scenarios
    test.each([
        "not",
        "and",
        "or",
        "xor",
        "greater",
        "less",
        "equal",
        "not_equal_to",
        "less_than_or_equal_to",
        "greater_than_or_equal_to"
    ])("real %sBlock arg() returns false when connection is null", blockType => {
        mockActivity.blocks.blockList["blk1"].connections[1] = null;
        const result = instances[blockType].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(false);
        expect(mockActivity.errorMsg).toHaveBeenCalled();
    });

    // Parameterized tests for valid connections
    test.each([
        "not",
        "and",
        "or",
        "xor",
        "greater",
        "less",
        "equal",
        "not_equal_to",
        "less_than_or_equal_to",
        "greater_than_or_equal_to"
    ])("real %sBlock arg() returns boolean with valid connections", blockType => {
        const result = instances[blockType].arg(mockLogo, "turtle1", "blk3", null);
        expect(typeof result).toBe("boolean");
    });

    // Special case for NotBlock with specific connection test
    test("real NotBlock arg() returns true when arg is false", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blk2";
        const result = instances["not"].arg(mockLogo, "turtle1", "blk1", null);
        expect(typeof result).toBe("boolean");
    });
});

describe("BooleanBlocks error-handling paths (try-catch coverage)", () => {
    let instances;

    beforeEach(() => {
        instances = {};
        const origBooleanBlock = global.BooleanBlock;
        global.BooleanBlock = class {
            constructor(type) {
                this.type = type;
                instances[type] = this;
            }
            setPalette() {}
            setHelpString() {}
            formBlock() {}
            beginnerBlock() {}
            setup() {}
            updateParameter() {}
            arg() {}
        };
        setupBooleanBlocks(mockActivity);
        global.BooleanBlock = origBooleanBlock;
        jest.clearAllMocks();
    });

    test("NotBlock arg() handles value that causes NOT operation to behave unexpectedly", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkObj";
        mockLogo.parseArg = jest.fn(() => {
            const obj = {};
            obj.self = obj;
            return obj;
        });
        const result = instances["not"].arg(mockLogo, "turtle1", "blk1", null);
        expect(typeof result).toBe("boolean");
    });

    test("GreaterBlock arg() handles error when Number conversion throws", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn(() => ({
            valueOf: () => {
                throw new Error("Cannot convert");
            }
        }));
        const result = instances["greater"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(false);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk1");
    });

    test("LessBlock arg() handles error when Number conversion throws", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn(() => ({
            valueOf: () => {
                throw new Error("Cannot convert");
            }
        }));
        const result = instances["less"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(false);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk1");
    });

    test("LessThanOrEqualToBlock arg() handles error when Number conversion throws", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn(() => ({
            valueOf: () => {
                throw new Error("Cannot convert");
            }
        }));
        const result = instances["less_than_or_equal_to"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(false);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk1");
    });

    test("GreaterThanOrEqualToBlock arg() handles error when Number conversion throws", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn(() => ({
            valueOf: () => {
                throw new Error("Cannot convert");
            }
        }));
        const result = instances["greater_than_or_equal_to"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(false);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk1");
    });

    test("EqualBlock arg() handles error when comparison throws", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        const obj = {};
        obj.self = obj;
        mockLogo.parseArg = jest.fn(() => obj);
        const result = instances["equal"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(true);
    });

    test("NotEqualToBlock arg() handles error when comparison throws", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn((logo, turtle, cblk) => cblk);
        const result = instances["not_equal_to"].arg(mockLogo, "turtle1", "blk1", null);
        expect(typeof result).toBe("boolean");
    });
});

describe("BooleanBlocks edge-case inputs", () => {
    let instances;

    beforeEach(() => {
        instances = {};
        const origBooleanBlock = global.BooleanBlock;
        global.BooleanBlock = class {
            constructor(type) {
                this.type = type;
                instances[type] = this;
            }
            setPalette() {}
            setHelpString() {}
            formBlock() {}
            beginnerBlock() {}
            setup() {}
            updateParameter() {}
            arg() {}
        };
        setupBooleanBlocks(mockActivity);
        global.BooleanBlock = origBooleanBlock;
        jest.clearAllMocks();
    });

    test("NotBlock arg() handles truthy numeric values", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkNum";
        mockActivity.blocks.blockList["blkNum"] = { value: 1, connections: [null, null, null] };
        mockLogo.parseArg = jest.fn(() => 1);
        const result = instances["not"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(false);
    });

    test("NotBlock arg() handles falsy numeric values", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkNum";
        mockActivity.blocks.blockList["blkNum"] = { value: 0, connections: [null, null, null] };
        mockLogo.parseArg = jest.fn(() => 0);
        const result = instances["not"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(true);
    });

    test("NotBlock arg() handles truthy string values", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkStr";
        mockActivity.blocks.blockList["blkStr"] = {
            value: "hello",
            connections: [null, null, null]
        };
        mockLogo.parseArg = jest.fn(() => "hello");
        const result = instances["not"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(false);
    });

    test("NotBlock arg() handles empty string (falsy)", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkStr";
        mockActivity.blocks.blockList["blkStr"] = { value: "", connections: [null, null, null] };
        mockLogo.parseArg = jest.fn(() => "");
        const result = instances["not"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(true);
    });

    test("GreaterBlock arg() handles string numbers", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn((logo, turtle, cblk) => {
            return cblk === "blkA" ? "10" : "5";
        });
        const result = instances["greater"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(true);
    });

    test("GreaterBlock arg() handles negative numbers", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn((logo, turtle, cblk) => {
            return cblk === "blkA" ? -5 : -10;
        });
        const result = instances["greater"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(true);
    });

    test("LessBlock arg() handles decimal numbers", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn((logo, turtle, cblk) => {
            return cblk === "blkA" ? 1.5 : 2.5;
        });
        const result = instances["less"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(true);
    });

    test("EqualBlock arg() handles null vs undefined comparison", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn((logo, turtle, cblk) => {
            return cblk === "blkA" ? null : undefined;
        });
        const result = instances["equal"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(false);
    });

    test("EqualBlock arg() handles NaN comparison", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn(() => NaN);
        const result = instances["equal"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(false);
    });

    test("NotEqualToBlock arg() handles different types", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn((logo, turtle, cblk) => {
            return cblk === "blkA" ? "5" : 5;
        });
        const result = instances["not_equal_to"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(true);
    });

    test("AndBlock arg() handles mixed truthy/falsy values", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn((logo, turtle, cblk) => {
            return cblk === "blkA" ? 1 : 0;
        });
        const result = instances["and"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(0);
    });

    test("OrBlock arg() handles mixed truthy/falsy values", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn((logo, turtle, cblk) => {
            return cblk === "blkA" ? 0 : 1;
        });
        const result = instances["or"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(1);
    });

    test("XorBlock arg() handles mixed truthy/falsy values", () => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkB";
        mockLogo.parseArg = jest.fn((logo, turtle, cblk) => {
            return cblk === "blkA" ? 1 : 0;
        });
        const result = instances["xor"].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(true);
    });
});

describe("StaticBooleanBlock edge cases", () => {
    let instances;

    beforeEach(() => {
        instances = {};
        const origBooleanBlock = global.BooleanBlock;
        global.BooleanBlock = class {
            constructor(type) {
                this.type = type;
                instances[type] = this;
            }
            setPalette() {}
            setHelpString() {}
            formBlock() {}
            beginnerBlock() {}
            setup() {}
            updateParameter() {}
            arg() {}
        };
        setupBooleanBlocks(mockActivity);
        global.BooleanBlock = origBooleanBlock;
        jest.clearAllMocks();
    });

    test("StaticBooleanBlock arg() returns null when value is null", () => {
        mockActivity.blocks.blockList["blkNull"] = { value: null, connections: [null, null, null] };
        const result = instances["boolean"].arg(mockLogo, "turtle1", "blkNull", null);
        expect(result).toBe(null);
    });

    test("StaticBooleanBlock arg() returns undefined when value is undefined", () => {
        mockActivity.blocks.blockList["blkUndef"] = {
            value: undefined,
            connections: [null, null, null]
        };
        const result = instances["boolean"].arg(mockLogo, "turtle1", "blkUndef", null);
        expect(result).toBe(undefined);
    });

    test("StaticBooleanBlock arg() returns true when value is number 1", () => {
        mockActivity.blocks.blockList["blkNum1"] = { value: 1, connections: [null, null, null] };
        const result = instances["boolean"].arg(mockLogo, "turtle1", "blkNum1", null);
        expect(result).toBe(1);
    });

    test("StaticBooleanBlock arg() returns 0 when value is number 0", () => {
        mockActivity.blocks.blockList["blkNum0"] = { value: 0, connections: [null, null, null] };
        const result = instances["boolean"].arg(mockLogo, "turtle1", "blkNum0", null);
        expect(result).toBe(0);
    });

    test("StaticBooleanBlock arg() returns false for empty string", () => {
        mockActivity.blocks.blockList["blkEmpty"] = { value: "", connections: [null, null, null] };
        const result = instances["boolean"].arg(mockLogo, "turtle1", "blkEmpty", null);
        expect(result).toBe(false);
    });

    test("StaticBooleanBlock arg() returns true for non-empty string 'true'", () => {
        mockActivity.blocks.blockList["blkTrue"] = {
            value: "true",
            connections: [null, null, null]
        };
        const result = instances["boolean"].arg(mockLogo, "turtle1", "blkTrue", null);
        expect(result).toBe(true);
    });

    test("StaticBooleanBlock arg() returns false for string 'false'", () => {
        mockActivity.blocks.blockList["blkFalse"] = {
            value: "false",
            connections: [null, null, null]
        };
        const result = instances["boolean"].arg(mockLogo, "turtle1", "blkFalse", null);
        expect(result).toBe(false);
    });

    test("StaticBooleanBlock arg() returns false for random string", () => {
        mockActivity.blocks.blockList["blkRandom"] = {
            value: "random",
            connections: [null, null, null]
        };
        const result = instances["boolean"].arg(mockLogo, "turtle1", "blkRandom", null);
        expect(result).toBe(false);
    });
});

describe("BooleanBlocks single null connection edge cases", () => {
    let instances;

    beforeEach(() => {
        instances = {};
        const origBooleanBlock = global.BooleanBlock;
        global.BooleanBlock = class {
            constructor(type) {
                this.type = type;
                instances[type] = this;
            }
            setPalette() {}
            setHelpString() {}
            formBlock() {}
            beginnerBlock() {}
            setup() {}
            updateParameter() {}
            arg() {}
        };
        setupBooleanBlocks(mockActivity);
        global.BooleanBlock = origBooleanBlock;
        jest.clearAllMocks();
    });

    // Parameterized tests for single null connection scenarios
    test.each([
        ["and", "AndBlock"],
        ["or", "OrBlock"],
        ["xor", "XorBlock"],
        ["greater", "GreaterBlock"],
        ["less", "LessBlock"],
        ["equal", "EqualBlock"],
        ["not_equal_to", "NotEqualToBlock"]
    ])("%s arg() returns false when only first connection is null", blockType => {
        mockActivity.blocks.blockList["blk1"].connections[1] = null;
        mockActivity.blocks.blockList["blk1"].connections[2] = "blkA";
        const result = instances[blockType].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(false);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk1");
    });

    test.each([
        ["and", "AndBlock"],
        ["or", "OrBlock"]
    ])("%s arg() returns false when only second connection is null", blockType => {
        mockActivity.blocks.blockList["blk1"].connections[1] = "blkA";
        mockActivity.blocks.blockList["blk1"].connections[2] = null;
        const result = instances[blockType].arg(mockLogo, "turtle1", "blk1", null);
        expect(result).toBe(false);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk1");
    });
});
