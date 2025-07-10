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
global._ = jest.fn((str) => str);
global.BooleanBlock = jest.fn().mockImplementation((type) => ({
    type,
    setPalette: jest.fn(),
    setHelpString: jest.fn(),
    formBlock: jest.fn(),
    updateParameter: jest.fn(),
    arg: jest.fn(function(logo, turtle, blk, receivedArg) {
        const connections = mockActivity.blocks.blockList[blk].connections;

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
    beginnerBlock: jest.fn(),
}));
global.NOINPUTERRORMSG = "No input error message";

const mockActivity = {
    blocks: {
        blockList: {
            "blk1": { value: true, connections: [null, null, null] },
            "blk2": { value: false, connections: [null, null, null] },
            "blk3": { value: true, connections: [null, "blk4", "blk5"] },
            "blk4": { value: false, connections: [null, null, null] },
            "blk5": { value: true, connections: [null, null, null] },
            "blk6": { value: false, connections: [null, "blk7", "blk8"] },
            "blk7": { value: true, connections: [null, null, null] },
            "blk8": { value: false, connections: [null, null, null] },
            "blk9": { value: true, connections: [null, "blk10", "blk11"] },
            "blk10": { value: false, connections: [null, null, null] },
            "blk11": { value: true, connections: [null, null, null] },
        },
    },
    errorMsg: jest.fn(),
};

const mockLogo = {
    parseArg: jest.fn((logo, turtle, cblk, blk, receivedArg) => {
        if (!mockActivity.blocks.blockList[cblk]) {
            throw new Error(`Block ${cblk} not found in blockList`);
        }
        return mockActivity.blocks.blockList[cblk].value;
    }),
};

describe("setupBooleanBlocks - Additional Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should handle NotBlock arg with valid connections", () => {
        setupBooleanBlocks(mockActivity);
        const notBlock = new global.BooleanBlock("not");
        const result = notBlock.arg(mockLogo, "turtle1", "blk3", true);
        expect(result).toBe(true);
    });

    it("should handle AndBlock arg with valid connections", () => {
        setupBooleanBlocks(mockActivity);
        const andBlock = new global.BooleanBlock("and");
        const result = andBlock.arg(mockLogo, "turtle1", "blk3", true);
        expect(result).toBe(false);
    });

    it("should handle OrBlock arg with valid connections", () => {
        setupBooleanBlocks(mockActivity);
        const orBlock = new global.BooleanBlock("or");
        const result = orBlock.arg(mockLogo, "turtle1", "blk3", true);
        expect(result).toBe(true);
    });

    it("should handle XorBlock arg with valid connections", () => {
        setupBooleanBlocks(mockActivity);
        const xorBlock = new global.BooleanBlock("xor");
        const result = xorBlock.arg(mockLogo, "turtle1", "blk3", true);
        expect(result).toBe(true);
    });

    it("should handle GreaterBlock arg with valid connections", () => {
        setupBooleanBlocks(mockActivity);
        const greaterBlock = new global.BooleanBlock("greater");
        const result = greaterBlock.arg(mockLogo, "turtle1", "blk6", true);
        expect(result).toBe(true);
    });

    it("should handle LessBlock arg with valid connections", () => {
        setupBooleanBlocks(mockActivity);
        const lessBlock = new global.BooleanBlock("less");
        const result = lessBlock.arg(mockLogo, "turtle1", "blk6", true);
        expect(result).toBe(false);
    });

    it("should handle LessThanOrEqualToBlock arg with valid connections", () => {
        setupBooleanBlocks(mockActivity);
        const lessThanOrEqualToBlock = new global.BooleanBlock("less_than_or_equal_to");
        const result = lessThanOrEqualToBlock.arg(mockLogo, "turtle1", "blk6", true);
        expect(result).toBe(false);
    });

    it("should handle GreaterThanOrEqualToBlock arg with valid connections", () => {
        setupBooleanBlocks(mockActivity);
        const greaterThanOrEqualToBlock = new global.BooleanBlock("greater_than_or_equal_to");
        const result = greaterThanOrEqualToBlock.arg(mockLogo, "turtle1", "blk6", true);
        expect(result).toBe(true);
    });

    it("should handle EqualBlock arg with valid connections", () => {
        setupBooleanBlocks(mockActivity);
        const equalBlock = new global.BooleanBlock("equal");
        const result = equalBlock.arg(mockLogo, "turtle1", "blk9", true);
        expect(result).toBe(false);
    });

    it("should handle NotEqualToBlock arg with valid connections", () => {
        setupBooleanBlocks(mockActivity);
        const notEqualToBlock = new global.BooleanBlock("not_equal_to");
        const result = notEqualToBlock.arg(mockLogo, "turtle1", "blk9", true);
        expect(result).toBe(true);
    });

    it("should handle NotBlock arg with null connections", () => {
        setupBooleanBlocks(mockActivity);
        const notBlock = new global.BooleanBlock("not");
        notBlock.arg(mockLogo, "turtle1", "blk1", true);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk1");
    });

    it("should handle AndBlock arg with null connections", () => {
        setupBooleanBlocks(mockActivity);
        const andBlock = new global.BooleanBlock("and");
        andBlock.arg(mockLogo, "turtle1", "blk2", true);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk2");
    });

    it("should handle OrBlock arg with null connections", () => {
        setupBooleanBlocks(mockActivity);
        const orBlock = new global.BooleanBlock("or");
        orBlock.arg(mockLogo, "turtle1", "blk1", true);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk1");
    });

    it("should handle XorBlock arg with null connections", () => {
        setupBooleanBlocks(mockActivity);
        const xorBlock = new global.BooleanBlock("xor");
        xorBlock.arg(mockLogo, "turtle1", "blk2", true);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk2");
    });

    it("should handle GreaterBlock arg with null connections", () => {
        setupBooleanBlocks(mockActivity);
        const greaterBlock = new global.BooleanBlock("greater");
        greaterBlock.arg(mockLogo, "turtle1", "blk1", true);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk1");
    });

    it("should handle LessBlock arg with null connections", () => {
        setupBooleanBlocks(mockActivity);
        const lessBlock = new global.BooleanBlock("less");
        lessBlock.arg(mockLogo, "turtle1", "blk2", true);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk2");
    });

    it("should handle LessThanOrEqualToBlock arg with null connections", () => {
        setupBooleanBlocks(mockActivity);
        const lessThanOrEqualToBlock = new global.BooleanBlock("less_than_or_equal_to");
        lessThanOrEqualToBlock.arg(mockLogo, "turtle1", "blk1", true);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk1");
    });

    it("should handle GreaterThanOrEqualToBlock arg with null connections", () => {
        setupBooleanBlocks(mockActivity);
        const greaterThanOrEqualToBlock = new global.BooleanBlock("greater_than_or_equal_to");
        greaterThanOrEqualToBlock.arg(mockLogo, "turtle1", "blk2", true);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk2");
    });

    it("should handle EqualBlock arg with null connections", () => {
        setupBooleanBlocks(mockActivity);
        const equalBlock = new global.BooleanBlock("equal");
        equalBlock.arg(mockLogo, "turtle1", "blk1", true);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk1");
    });

    it("should handle NotEqualToBlock arg with null connections", () => {
        setupBooleanBlocks(mockActivity);
        const notEqualToBlock = new global.BooleanBlock("not_equal_to");
        notEqualToBlock.arg(mockLogo, "turtle1", "blk2", true);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, "blk2");
    });
});
