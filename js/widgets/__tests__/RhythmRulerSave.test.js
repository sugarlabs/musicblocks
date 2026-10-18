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

const RhythmRulerSave = global.RhythmRulerSave;
const METHODS = [
    "_save",
    "_saveTuplets",
    "_saveTupletsMerged",
    "_saveMachine",
    "_saveDrumMachine",
    "_saveVoiceMachine",
    "_mergeRulers"
];

describe("RhythmRulerSave", () => {
    test("holds exactly the methods moved out of RhythmRuler", () => {
        const names = Object.getOwnPropertyNames(RhythmRulerSave.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on RhythmRuler.prototype", () => {
        expect(RhythmRuler.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(RhythmRuler.prototype[name]).toBe(RhythmRulerSave.prototype[name]);
            // Like a method declared in the class: not enumerable.
            expect(Object.getOwnPropertyDescriptor(RhythmRuler.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    describe("_saveTupletsMerged", () => {
        beforeEach(() => {
            global._ = text => text;
            global.activity = { textMsg: jest.fn() };
            global.rationalToFraction = require("../../utils/utils-logic.js").rationalToFraction;
        });

        afterEach(() => {
            delete global.activity;
        });

        test("merges repeated note values into one rhythm block", () => {
            const loadNewBlocks = jest.fn();
            const widget = {
                activity: {
                    palettes: { dict: { rhythm: { hideMenu: jest.fn() } } },
                    refreshCanvas: jest.fn(),
                    blocks: { loadNewBlocks }
                }
            };

            RhythmRulerSave.prototype._saveTupletsMerged.call(widget, [4, 4, 8]);

            const stack = loadNewBlocks.mock.calls[0][0];
            const rhythms = stack.filter(block => block[1] === "rhythm2");
            expect(rhythms).toHaveLength(2);
            // Two quarter notes in the first rhythm block, one eighth note in the second.
            expect(stack[rhythms[0][0] + 1][1]).toEqual(["number", { value: 2 }]);
            expect(stack[rhythms[0][0] + 4][1]).toEqual(["number", { value: 4 }]);
            expect(stack[rhythms[1][0] + 1][1]).toEqual(["number", { value: 1 }]);
            expect(stack[rhythms[1][0] + 4][1]).toEqual(["number", { value: 8 }]);
            expect(global.activity.textMsg).toHaveBeenCalled();
        });
    });

    describe("_saveMachine", () => {
        beforeEach(() => {
            global.DRUMNAMES = [
                ["kick", "kick drum"],
                ["clang", "clang"]
            ];
            global.EFFECTSNAMES = ["clang"];
            global.VOICENAMES = [["guitar", "guitar"]];
        });

        const dispatch = name => {
            const widget = {
                _getDrumName: () => name,
                _saveDrumMachine: jest.fn(),
                _saveVoiceMachine: jest.fn()
            };
            RhythmRulerSave.prototype._saveMachine.call(widget, 2);
            return widget;
        };

        test("saves a drum machine for a drum", () => {
            expect(dispatch("kick drum")._saveDrumMachine).toHaveBeenCalledWith(
                2,
                "kick drum",
                false
            );
        });

        test("saves an effects drum machine for an effect", () => {
            expect(dispatch("clang")._saveDrumMachine).toHaveBeenCalledWith(2, "clang", true);
        });

        test("saves a voice machine for a voice", () => {
            const widget = dispatch("guitar");
            expect(widget._saveVoiceMachine).toHaveBeenCalledWith(2, "guitar");
            expect(widget._saveDrumMachine).not.toHaveBeenCalled();
        });

        test("does nothing for an unknown name", () => {
            const widget = dispatch("theremin");
            expect(widget._saveDrumMachine).not.toHaveBeenCalled();
            expect(widget._saveVoiceMachine).not.toHaveBeenCalled();
        });
    });

    describe("drum and voice machines", () => {
        let loadNewBlocks;

        beforeEach(() => {
            jest.useFakeTimers();
            global._ = text => text;
            global.activity = { textMsg: jest.fn() };
            global.rationalToFraction = require("../../utils/utils-logic.js").rationalToFraction;
            loadNewBlocks = jest.fn();
        });

        afterEach(() => {
            jest.useRealTimers();
            delete global.activity;
        });

        // One ruler per entry in noteValues; a negative value is a rest.
        const makeWidget = (noteValues, drumName = "kick drum") => ({
            activity: {
                palettes: { dict: { rhythm: { hideMenu: jest.fn() } } },
                refreshCanvas: jest.fn(),
                blocks: { loadNewBlocks }
            },
            _rulers: noteValues.map(values => ({ cells: values.map(() => ({})) })),
            Rulers: noteValues.map(values => [values, []]),
            Drums: noteValues.map((_values, i) => 10 + i),
            _getDrumName: () => drumName,
            _saveMachine: jest.fn()
        });

        const names = stack =>
            stack.map(block => (Array.isArray(block[1]) ? block[1][0] : block[1]));
        const valueOf = (stack, name) => stack.find(block => block[1][0] === name)[1][1].value;

        test("a drum machine plays notes, rests and repeated notes", () => {
            const widget = makeWidget([[4, 4, -8, 2]]);

            RhythmRulerSave.prototype._saveDrumMachine.call(widget, 0, "kick drum", false);
            expect(loadNewBlocks).not.toHaveBeenCalled();
            jest.advanceTimersByTime(500);

            const stack = loadNewBlocks.mock.calls[0][0];
            expect(stack[1][1]).toEqual(["text", { value: "kick action" }]);
            // The two quarter notes become one note inside a repeat 2.
            const repeat = stack.find(block => block[1] === "repeat");
            expect(stack[repeat[0] + 1][1]).toEqual(["number", { value: 2 }]);
            expect(names(stack).filter(name => name === "rest2")).toHaveLength(1);
            expect(names(stack).filter(name => name === "playdrum")).toHaveLength(2);
            expect(valueOf(stack, "drumname")).toBe("kick drum");
            expect(names(stack)).not.toContain("effectsname");
            // Only one ruler, so it doesn't go on to save another.
            expect(widget._saveMachine).not.toHaveBeenCalled();
        });

        test("an effects machine uses the effect name and saves the next ruler", () => {
            const widget = makeWidget([[4], [8]], "clang");

            RhythmRulerSave.prototype._saveDrumMachine.call(widget, 0, "clang", true);
            jest.advanceTimersByTime(500);

            const stack = loadNewBlocks.mock.calls[0][0];
            expect(valueOf(stack, "effectsname")).toBe("clang");
            expect(names(stack)).not.toContain("drumname");
            expect(widget._saveMachine).toHaveBeenCalledWith(1);
        });

        test("a voice machine sets the timbre before its notes", () => {
            const widget = makeWidget([[2, -4, 4, 4]], "guitar");

            RhythmRulerSave.prototype._saveVoiceMachine.call(widget, 0, "guitar");
            jest.advanceTimersByTime(500);

            const stack = loadNewBlocks.mock.calls[0][0];
            expect(stack[2][1]).toBe("settimbre");
            expect(stack[3][1]).toEqual(["voicename", { value: "guitar" }]);
            expect(names(stack).filter(name => name === "rest2")).toHaveLength(1);
            const repeat = stack.find(block => block[1] === "repeat");
            expect(stack[repeat[0] + 1][1]).toEqual(["number", { value: 2 }]);
            expect(widget._saveMachine).not.toHaveBeenCalled();
        });
    });
});
