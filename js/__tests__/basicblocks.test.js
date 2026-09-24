/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Justin Charles
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

const { initBasicProtoBlocks, BACKWARDCOMPATIBILITYDICT } = require("../basicblocks");

const mockActivity = {
    blocks: {
        palettes: {},
        protoBlockDict: {
            block1: { palette: { add: jest.fn() } },
            block2: { palette: { add: jest.fn() } },
            blockWithoutPalette: {}
        }
    },
    palettes: {}
};

const setupFunctions = [
    "setupRhythmBlockPaletteBlocks",
    "setupRhythmBlocks",
    "setupMeterBlocks",
    "setupPitchBlocks",
    "setupIntervalsBlocks",
    "setupToneBlocks",
    "setupOrnamentBlocks",
    "setupVolumeBlocks",
    "setupDrumBlocks",
    "setupWidgetBlocks",
    "setupFlowBlocks",
    "setupNumberBlocks",
    "setupActionBlocks",
    "setupBoxesBlocks",
    "setupBooleanBlocks",
    "setupHeapBlocks",
    "setupDictBlocks",
    "setupExtrasBlocks",
    "setupProgramBlocks",
    "setupGraphicsBlocks",
    "setupPenBlocks",
    "setupMediaBlocks",
    "setupSensorsBlocks",
    "setupEnsembleBlocks"
];

setupFunctions.forEach(fnName => {
    global[fnName] = jest.fn();
});

describe("initBasicProtoBlocks", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should assign palettes to activity.blocks.palettes", () => {
        initBasicProtoBlocks(mockActivity);
        expect(mockActivity.blocks.palettes).toBe(mockActivity.palettes);
    });

    it("should call all setup functions with activity", () => {
        initBasicProtoBlocks(mockActivity);
        setupFunctions.forEach(fnName => {
            expect(global[fnName]).toHaveBeenCalledWith(mockActivity);
        });
    });

    it("should add blocks with palettes to their respective palettes", () => {
        initBasicProtoBlocks(mockActivity);

        expect(mockActivity.blocks.protoBlockDict.block1.palette.add).toHaveBeenCalledWith(
            mockActivity.blocks.protoBlockDict.block1
        );
        expect(mockActivity.blocks.protoBlockDict.block2.palette.add).toHaveBeenCalledWith(
            mockActivity.blocks.protoBlockDict.block2
        );
        expect(mockActivity.blocks.protoBlockDict.blockWithoutPalette.palette).toBeUndefined();
    });

    it("should safely handle empty protoBlockDict without throwing", () => {
        const emptyActivity = {
            blocks: {
                palettes: {},
                protoBlockDict: {}
            },
            palettes: {}
        };
        expect(() => initBasicProtoBlocks(emptyActivity)).not.toThrow();
    });
});

describe("BACKWARDCOMPATIBILITYDICT", () => {
    it("should be defined and not empty", () => {
        expect(BACKWARDCOMPATIBILITYDICT).toBeDefined();
        expect(Object.keys(BACKWARDCOMPATIBILITYDICT).length).toBeGreaterThan(0);
    });

    it("correctly maps arithmetic and comparison block names", () => {
        expect(BACKWARDCOMPATIBILITYDICT.plus2).toBe("plus");
        expect(BACKWARDCOMPATIBILITYDICT.minus2).toBe("minus");
        expect(BACKWARDCOMPATIBILITYDICT.product2).toBe("multiply");
        expect(BACKWARDCOMPATIBILITYDICT.division2).toBe("divide");
        expect(BACKWARDCOMPATIBILITYDICT.remainder2).toBe("mod");
        expect(BACKWARDCOMPATIBILITYDICT.greater2).toBe("greater");
        expect(BACKWARDCOMPATIBILITYDICT.less2).toBe("less");
        expect(BACKWARDCOMPATIBILITYDICT.equal2).toBe("equal");
        expect(BACKWARDCOMPATIBILITYDICT.random2).toBe("random");
    });

    it("correctly maps turtle and coordinate block names", () => {
        expect(BACKWARDCOMPATIBILITYDICT.xcor).toBe("x");
        expect(BACKWARDCOMPATIBILITYDICT.ycor).toBe("y");
        expect(BACKWARDCOMPATIBILITYDICT.setxy2).toBe("setxy");
        expect(BACKWARDCOMPATIBILITYDICT.seth).toBe("setheading");
        expect(BACKWARDCOMPATIBILITYDICT.shell).toBe("turtleshell");
    });

    it("correctly maps color and graphics block names", () => {
        expect(BACKWARDCOMPATIBILITYDICT.setvalue).toBe("setshade");
        expect(BACKWARDCOMPATIBILITYDICT.setchroma).toBe("setgrey");
        expect(BACKWARDCOMPATIBILITYDICT.setgray).toBe("setgrey");
        expect(BACKWARDCOMPATIBILITYDICT.gray).toBe("grey");
        expect(BACKWARDCOMPATIBILITYDICT.chroma).toBe("grey");
        expect(BACKWARDCOMPATIBILITYDICT.value).toBe("shade");
        expect(BACKWARDCOMPATIBILITYDICT.hue).toBe("color");
        expect(BACKWARDCOMPATIBILITYDICT.startfill).toBe("beginfill");
        expect(BACKWARDCOMPATIBILITYDICT.stopfill).toBe("endfill");
        expect(BACKWARDCOMPATIBILITYDICT.fullscreen).toBe("vspace");
        expect(BACKWARDCOMPATIBILITYDICT.fillscreen2).toBe("fillscreen");
    });

    it("correctly maps flow control and stack aliases", () => {
        expect(BACKWARDCOMPATIBILITYDICT.sandwichclampcollapsed).toBe("clamp");
        expect(BACKWARDCOMPATIBILITYDICT.ifelse).toBe("ifthenelse");
        expect(BACKWARDCOMPATIBILITYDICT.stack).toBe("do");
        expect(BACKWARDCOMPATIBILITYDICT.hat).toBe("action");
        expect(BACKWARDCOMPATIBILITYDICT.stopstack).toBe("break");
        expect(BACKWARDCOMPATIBILITYDICT.clean).toBe("clear");
        expect(BACKWARDCOMPATIBILITYDICT.string).toBe("text");
    });

    it("maps the old turtlelapsednotes name so old Turtle Blocks projects still load (#8701)", () => {
        expect(BACKWARDCOMPATIBILITYDICT.turtlelapsednotes).toBe("turtleelapsednotes");
    });

    it("ensures every entry maps to a valid, non-empty string target", () => {
        for (const [oldName, newName] of Object.entries(BACKWARDCOMPATIBILITYDICT)) {
            expect(typeof oldName).toBe("string");
            expect(oldName.trim().length).toBeGreaterThan(0);
            expect(typeof newName).toBe("string");
            expect(newName.trim().length).toBeGreaterThan(0);
        }
    });
});
