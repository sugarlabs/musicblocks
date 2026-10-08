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

global.ManagedTimer = require("../../utils/ManagedTimer");
global.PitchStaircaseTimers = require("../PitchStaircaseTimers.js");
global.PitchStaircaseLayout = require("../PitchStaircaseLayout.js");
global.PitchStaircaseSteps = require("../PitchStaircaseSteps.js");
global.PitchStaircasePlayback = require("../PitchStaircasePlayback.js");
global.PitchStaircaseSave = require("../PitchStaircaseSave.js");
global.PitchStaircaseWindow = require("../PitchStaircaseWindow.js");
global.PitchStaircase = require("../pitchstaircase.js");

global._ = msg => msg;
global.frequencyToPitch = require("../../utils/musicutils.js").frequencyToPitch;

const PitchStaircaseSave = global.PitchStaircaseSave;
const METHODS = ["_save", "_get_save_lock"];

describe("PitchStaircaseSave", () => {
    let psc;

    const clickOn = frequency => ({ target: { getAttribute: () => String(frequency) } });
    const savedStack = () => psc.activity.blocks.loadNewBlocks.mock.calls[0][0];
    const blockAt = (stack, index) => stack.find(block => block[0] === index);
    const valueOf = (stack, index) => blockAt(stack, index)[1][1].value;

    beforeEach(() => {
        psc = new PitchStaircase();
        psc.activity = {
            palettes: { dict: { pitch: { hideMenu: jest.fn() } } },
            refreshCanvas: jest.fn(),
            blocks: { loadNewBlocks: jest.fn() },
            textMsg: jest.fn()
        };
        psc._history = [];
        psc._musicRatio1 = { value: "3" };
        psc._musicRatio2 = { value: "2" };
        psc._makeStairs = jest.fn();
    });

    test("holds exactly the methods moved out of PitchStaircase", () => {
        const names = Object.getOwnPropertyNames(PitchStaircaseSave.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on PitchStaircase.prototype", () => {
        expect(PitchStaircase.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(PitchStaircase.prototype[name]).toBe(PitchStaircaseSave.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(PitchStaircase.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    test("hides the palettes and starts the stack with an action named stair", () => {
        psc.addStair("A", 3, 220, 1);

        psc._save();

        expect(psc.activity.palettes.dict.pitch.hideMenu).toHaveBeenCalledWith(true);
        expect(psc.activity.refreshCanvas).toHaveBeenCalled();
        const stack = savedStack();
        expect(stack[0][1][0]).toBe("action");
        expect(stack[1][1]).toEqual(["text", { value: "stair" }]);
        expect(psc.activity.textMsg).toHaveBeenCalledWith("New action block generated.", 3000);
    });

    test("saves a stair that is a note as a pitch block", () => {
        psc.addStair("A", 3, 220, 1);

        psc._save();

        const stack = savedStack();
        const pitch = stack.find(block => block[1] === "pitch");
        expect(pitch).toBeDefined();
        expect(valueOf(stack, pitch[4][1])).toBe("A");
        expect(valueOf(stack, pitch[4][2])).toBe(3);
    });

    test("saves a step from a pitch-block stair as initial frequency x ratio", () => {
        psc.addStair("A", 3, 220, 1);
        psc._dissectStair(clickOn(220));

        expect(() => psc._save()).not.toThrow();

        const stack = savedStack();
        const hertz = stack.find(block => block[1] === "hertz");
        const multiply = blockAt(stack, hertz[4][1]);
        const divide = blockAt(stack, multiply[4][2]);
        expect(valueOf(stack, multiply[4][1])).toBe("220.00");
        expect(valueOf(stack, divide[4][1])).toBe(3);
        expect(valueOf(stack, divide[4][2])).toBe(2);
    });

    test("saves a step from a hertz-block stair with the same ratio", () => {
        psc.addStair("C", 4, 300, 1);
        psc._dissectStair(clickOn(300));

        psc._save();

        const stack = savedStack();
        const hertzBlocks = stack.filter(block => block[1] === "hertz");
        expect(hertzBlocks).toHaveLength(2);
        const [step] = hertzBlocks;
        const multiply = blockAt(stack, step[4][1]);
        const divide = blockAt(stack, multiply[4][2]);
        expect(valueOf(stack, multiply[4][1])).toBe("300.00");
        expect(valueOf(stack, divide[4][1])).toBe(3);
        expect(valueOf(stack, divide[4][2])).toBe(2);
    });

    test("a step from a step keeps the first stair's frequency", () => {
        psc.addStair("A", 3, 220, 1);
        psc._dissectStair(clickOn(220));
        psc._dissectStair(clickOn(330));

        psc._save();

        const stack = savedStack();
        const [top] = stack.filter(block => block[1] === "hertz");
        const multiply = blockAt(stack, top[4][1]);
        const divide = blockAt(stack, multiply[4][2]);
        expect(valueOf(stack, multiply[4][1])).toBe("220.00");
        expect(valueOf(stack, divide[4][1])).toBe(9);
        expect(valueOf(stack, divide[4][2])).toBe(4);
    });

    test("chains the stairs one after another and ends the last one", () => {
        psc.addStair("A", 3, 220, 1);
        psc.addStair("A", 4, 440, 2);

        psc._save();

        const stack = savedStack();
        const hidden = stack.filter(block => block[1] === "hidden");
        expect(hidden).toHaveLength(2);
        expect(hidden[0][4][1]).toBe(hidden[1][0] - 3);
        expect(hidden[1][4][1]).toBeNull();
    });

    test("_get_save_lock reports the debounce lock", () => {
        psc._save_lock = true;
        expect(psc._get_save_lock()).toBe(true);
        psc._save_lock = false;
        expect(psc._get_save_lock()).toBe(false);
    });
});
