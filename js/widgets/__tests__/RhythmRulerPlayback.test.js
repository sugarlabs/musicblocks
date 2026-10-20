/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks Contributors
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

global.RhythmRulerLayout = require("../RhythmRulerLayout.js");
global.RhythmRulerHistory = require("../RhythmRulerHistory.js");
global.RhythmRulerEditing = require("../RhythmRulerEditing.js");
global.RhythmRulerPlayback = require("../RhythmRulerPlayback.js");
global.RhythmRulerSave = require("../RhythmRulerSave.js");
global.RhythmRulerCircular = require("../RhythmRulerCircular.js");
global.RhythmRuler = require("../rhythmruler.js");

const RhythmRulerPlayback = global.RhythmRulerPlayback;
const METHODS = [
    "__pause",
    "playAll",
    "__resume",
    "_playAll",
    "_playOne",
    "_getDrumName",
    "__loop"
];

describe("RhythmRulerPlayback", () => {
    test("holds exactly the methods moved out of RhythmRuler", () => {
        const names = Object.getOwnPropertyNames(RhythmRulerPlayback.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on RhythmRuler.prototype", () => {
        expect(RhythmRuler.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(RhythmRuler.prototype[name]).toBe(RhythmRulerPlayback.prototype[name]);
            // Like a method declared in the class: not enumerable.
            expect(Object.getOwnPropertyDescriptor(RhythmRuler.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    describe("_getDrumName", () => {
        const drumName = (widget, ruler = 0) =>
            RhythmRulerPlayback.prototype._getDrumName.call(widget, ruler);

        test("falls back to snare drum without a drum block", () => {
            expect(drumName({ Drums: [null] })).toBe("snare drum");
            expect(drumName({ Drums: [5], activity: { blocks: { blockList: [] } } })).toBe(
                "snare drum"
            );
        });

        test("reads the drum name connected to the drum block", () => {
            const blockList = [];
            blockList[5] = { connections: [null, 6] };
            blockList[6] = { value: "kick drum" };
            expect(drumName({ Drums: [5], activity: { blocks: { blockList } } })).toBe("kick drum");
        });

        test("falls back when the connected value is not a name", () => {
            const blockList = [];
            blockList[5] = { connections: [null, 6] };
            blockList[6] = { value: 3 };
            expect(drumName({ Drums: [5], activity: { blocks: { blockList } } })).toBe(
                "snare drum"
            );
        });
    });

    describe("__loop", () => {
        beforeEach(() => {
            global.Singer = { defaultBPMFactor: 0.25 };
            global.platformColor = { rulerHighlight: "#f00" };
            global.DRUMNAMES = [["kick-drum", "kick drum"]];
            global.VOICENAMES = [["guitar", "guitar"]];
        });

        // One ruler with the given note values; a negative value is a rest.
        const makeWidget = (noteValues, drumName = "kick drum") => {
            const scheduled = [];
            const widget = {
                _rulers: [{ cells: noteValues.map(() => ({ style: {} })) }],
                Rulers: [[noteValues, []]],
                _playing: true,
                _startingTime: Date.now(),
                _elapsedTimes: [0],
                _offsets: [0],
                activity: { logo: { synth: { trigger: jest.fn() } } },
                _getDrumName: () => drumName,
                _calculateZebraStripes: jest.fn(),
                _drawCircularView: jest.fn(),
                _setWidgetTimeout: (callback, delay) => scheduled.push({ callback, delay })
            };
            widget.__loop = RhythmRulerPlayback.prototype.__loop;
            return { widget, scheduled };
        };

        test("stops when the ruler is gone", () => {
            const { widget, scheduled } = makeWidget([4]);
            widget._rulers = [null];

            widget.__loop(0, 0, 0);

            expect(scheduled).toHaveLength(0);
        });

        test("plays a drum note, highlights its cell and schedules the next one", () => {
            const { widget, scheduled } = makeWidget([4, 8]);

            widget.__loop(0, 0, 0);

            expect(widget._calculateZebraStripes).toHaveBeenCalledWith(0);
            expect(widget.activity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                ["C4"],
                0.25 / 4,
                "kick drum",
                null,
                null
            );
            expect(widget._rulers[0].cells[0].style.backgroundColor).toBe("#f00");
            expect(scheduled).toHaveLength(1);
            // A quarter note at this tempo lasts 0.25 * 1000 / 4 ms.
            expect(scheduled[0].delay).toBeCloseTo(62.5 - widget._offsets[0], 5);
            expect(widget._elapsedTimes[0]).toBe(62.5);
        });

        test("plays a voice with a single pitch", () => {
            const { widget } = makeWidget([2], "guitar");

            widget.__loop(0, 0, 0);

            expect(widget.activity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                "C4",
                0.25 / 2,
                "guitar",
                null,
                null,
                false
            );
        });

        test("plays a drum shown under its translated name with the English name", () => {
            // DRUMNAMES rows are [shown name, English name]; the shown name can have "-".
            global.DRUMNAMES = [["bombo-grande", "kick drum"]];
            const { widget } = makeWidget([4], "bombo grande");

            widget.__loop(0, 0, 0);

            expect(widget.activity.logo.synth.trigger.mock.calls[0][3]).toBe("kick drum");
        });

        test("stays quiet on a rest but still moves on", () => {
            const { widget, scheduled } = makeWidget([-4, 4]);

            widget.__loop(0, 0, 0);

            expect(widget.activity.logo.synth.trigger).not.toHaveBeenCalled();
            expect(scheduled).toHaveLength(1);
        });

        test("updates the circular view highlight when it is showing", () => {
            const { widget } = makeWidget([4, 4]);
            widget._circularView = true;
            widget._circularCanvas = {};
            widget._circularHighlight = [];

            widget.__loop(0, 0, 1);

            expect(widget._circularHighlight[0]).toBe(1);
            expect(widget._drawCircularView).toHaveBeenCalled();
        });

        test("wraps back to the first cell and stops once playback stops", () => {
            const { widget, scheduled } = makeWidget([4, 4]);

            widget.__loop(0, 0, 1);
            scheduled[0].callback();
            // The second cell was the last, so the next step is the first cell again.
            expect(widget._calculateZebraStripes).toHaveBeenCalledWith(0);
            expect(scheduled).toHaveLength(2);

            widget._playing = false;
            scheduled[1].callback();
            expect(scheduled).toHaveLength(2);
        });
    });
});
