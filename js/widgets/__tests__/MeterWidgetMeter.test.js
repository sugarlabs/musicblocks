/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks contributors
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

const { clampNumber, rationalToFraction } = require("../../utils/utils-logic.js");

global._ = msg => msg;
global.clampNumber = clampNumber;
global.rationalToFraction = rationalToFraction;
global.MeterWidgetWindow = require("../MeterWidgetWindow.js");
global.MeterWidgetMeter = require("../MeterWidgetMeter.js");
global.MeterWidgetPlayback = require("../MeterWidgetPlayback.js");
global.MeterWidgetWheel = require("../MeterWidgetWheel.js");
global.MeterWidgetSave = require("../MeterWidgetSave.js");
const MeterWidget = require("../meterwidget.js");

const MeterWidgetMeter = global.MeterWidgetMeter;
const METHODS = ["_readMeterBlock", "_noteValue", "_writeMeterBlock", "_setBlockValue"];

const numberBlock = (value, parent) => ({
    name: "number",
    value,
    connections: [parent],
    text: { text: String(value) },
    container: { children: [{}, {}], setChildIndex: jest.fn() }
});

// Meter (beats) (numerator / denominator), the block the widget's macro makes.
const fractionMeter = (beats, numerator, denominator) => ({
    1: { name: "meter", connections: [null, 2, 3, null] },
    2: numberBlock(beats, 1),
    3: { name: "divide", value: numerator / denominator, connections: [1, 4, 5] },
    4: numberBlock(numerator, 3),
    5: numberBlock(denominator, 3)
});

// Meter (beats) (beat value), with the beat value as one number.
const numberMeter = (beats, beatValue) => ({
    1: { name: "meter", connections: [null, 2, 3, null] },
    2: numberBlock(beats, 1),
    3: numberBlock(beatValue, 1)
});

describe("MeterWidgetMeter", () => {
    let widget;

    const makeWidget = (blockList, meterBlock = 1) => {
        widget = Object.create(MeterWidget.prototype);
        widget.activity = { blocks: { blockList } };
        widget._meterBlock = meterBlock;
        widget._beatValue = 1 / 4;
        return widget;
    };

    test("holds exactly the methods moved out of MeterWidget", () => {
        const names = Object.getOwnPropertyNames(MeterWidgetMeter.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on MeterWidget.prototype", () => {
        expect(MeterWidget.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(MeterWidget.prototype[name]).toBe(MeterWidgetMeter.prototype[name]);
        }
    });

    describe("_readMeterBlock", () => {
        test("reads the beats, the beat value and the blocks Reset writes to", () => {
            makeWidget(fractionMeter(6, 1, 8));

            expect(widget._readMeterBlock()).toEqual({
                beats: 6,
                beatCountBlock: 2,
                beatValueBlock: 3,
                noteValueBlock: 5
            });
            expect(widget._beatValue).toBe(1 / 8);
        });

        test("reads a beat value given as one number", () => {
            makeWidget(numberMeter(3, 0.375));

            expect(widget._readMeterBlock()).toEqual({
                beats: 3,
                beatCountBlock: 2,
                beatValueBlock: 3,
                noteValueBlock: null
            });
            expect(widget._beatValue).toBe(0.375);
        });

        test("keeps the number of beats between 1 and 16", () => {
            makeWidget(fractionMeter(20, 1, 4));
            expect(widget._readMeterBlock().beats).toBe(16);

            makeWidget(fractionMeter(0, 1, 4));
            expect(widget._readMeterBlock().beats).toBe(1);
        });

        test("uses 4 beats when the beat count is not a number", () => {
            const blockList = fractionMeter(4, 1, 4);
            blockList[2].value = "four";
            makeWidget(blockList);

            expect(widget._readMeterBlock().beats).toBe(4);
        });

        test("keeps the default beat value without a beat value block", () => {
            const blockList = fractionMeter(4, 1, 8);
            blockList[1].connections[2] = null;
            makeWidget(blockList);

            const meter = widget._readMeterBlock();

            expect(meter.beatValueBlock).toBeNull();
            expect(meter.noteValueBlock).toBeNull();
            expect(widget._beatValue).toBe(1 / 4);
        });

        test.each([
            ["no Meter block", null],
            ["a Meter block that was disposed", 9]
        ])("reads nothing with %s", (_label, meterBlock) => {
            makeWidget(fractionMeter(3, 1, 8), meterBlock);

            expect(widget._readMeterBlock()).toEqual({
                beats: undefined,
                beatCountBlock: null,
                beatValueBlock: null,
                noteValueBlock: null
            });
            expect(widget._beatValue).toBe(1 / 4);
        });
    });

    describe("_noteValue", () => {
        test.each([
            [1, 4, 4],
            [1, 8, 8],
            [3, 8, 8],
            [2, 4, 4]
        ])("is the denominator of %s / %s", (numerator, denominator, expected) => {
            makeWidget(fractionMeter(4, numerator, denominator));

            expect(widget._noteValue(widget._readMeterBlock())).toBe(expected);
        });

        test.each([
            [0.25, 4],
            [0.375, 8],
            [0.5, 2]
        ])("is the denominator of a beat value of %s", (beatValue, expected) => {
            makeWidget(numberMeter(4, beatValue));

            expect(widget._noteValue(widget._readMeterBlock())).toBe(expected);
        });

        test("is 4 without a Meter block", () => {
            makeWidget({}, null);

            expect(widget._noteValue(widget._readMeterBlock())).toBe(4);
        });
    });

    describe("_writeMeterBlock", () => {
        test("writes the beats and the denominator and keeps the numerator", () => {
            const blockList = fractionMeter(2, 3, 8);
            makeWidget(blockList);

            widget._writeMeterBlock(widget._readMeterBlock(), 5, 4);

            expect(blockList[2].value).toBe(5);
            expect(blockList[4].value).toBe(3);
            expect(blockList[5].value).toBe(4);
            expect(blockList[2].text.text).toBe("5");
            expect(blockList[5].text.text).toBe("4");
        });

        test("keeps 3/8 as it is when the note value is not changed", () => {
            const blockList = fractionMeter(2, 3, 8);
            makeWidget(blockList);
            const meter = widget._readMeterBlock();

            widget._writeMeterBlock(meter, 2, widget._noteValue(meter));

            expect([blockList[4].value, blockList[5].value]).toEqual([3, 8]);
        });

        test("keeps the numerator of a beat value given as one number", () => {
            const blockList = numberMeter(3, 0.375);
            makeWidget(blockList);

            widget._writeMeterBlock(widget._readMeterBlock(), 3, 4);

            expect(blockList[3].value).toBe(0.75);
            expect(blockList[3].text.text).toBe("0.75");
        });

        test("does not write a beat value that is not a number block", () => {
            const blockList = numberMeter(3, 0.25);
            blockList[3] = {
                name: "box",
                value: 0.25,
                connections: [1, null],
                text: { text: "box" }
            };
            makeWidget(blockList);

            widget._writeMeterBlock(widget._readMeterBlock(), 3, 8);

            expect(blockList[3].value).toBe(0.25);
            expect(blockList[3].text.text).toBe("box");
        });

        test("does not write into the operands of another expression", () => {
            // Meter 3 (0.5 * 0.5)
            const blockList = fractionMeter(3, 1, 4);
            blockList[3].name = "multiply";
            blockList[4].value = 0.5;
            blockList[5].value = 0.5;
            makeWidget(blockList);

            const meter = widget._readMeterBlock();
            widget._writeMeterBlock(meter, 3, 8);

            expect(meter.noteValueBlock).toBeNull();
            expect(widget._noteValue(meter)).toBe(4);
            expect([blockList[4].value, blockList[5].value]).toEqual([0.5, 0.5]);
        });

        test("does not write into a denominator that is not a number block", () => {
            const blockList = fractionMeter(3, 1, 4);
            blockList[5] = { name: "box", value: 4, connections: [3, null], text: { text: "box" } };
            makeWidget(blockList);

            const meter = widget._readMeterBlock();
            widget._writeMeterBlock(meter, 3, 8);

            expect(meter.noteValueBlock).toBeNull();
            expect(blockList[5].value).toBe(4);
            expect(blockList[5].text.text).toBe("box");
        });

        test("does nothing without a Meter block", () => {
            makeWidget({}, null);

            expect(() => widget._writeMeterBlock(widget._readMeterBlock(), 3, 8)).not.toThrow();
        });
    });

    describe("_setBlockValue", () => {
        test("brings the label to the front", () => {
            const blk = numberBlock(4, 1);
            makeWidget({});

            widget._setBlockValue(blk, 7);

            expect(blk.container.setChildIndex).toHaveBeenCalledWith(blk.text, 1);
        });

        test("ignores a missing block", () => {
            makeWidget({});

            expect(() => widget._setBlockValue(undefined, 7)).not.toThrow();
        });
    });
});
