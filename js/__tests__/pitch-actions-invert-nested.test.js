/**
 * @license
 * MusicBlocks
 * Copyright (C) 2026 Music Blocks Contributors
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

/**
 * Regression coverage for issue #8189: the Invert block's clamp-close listener
 * (`Singer.PitchActions.invert`, js/turtleactions/PitchActions.js) used to set
 * `tur.singer.inverted = false` unconditionally, even when an ancestor Invert
 * block was still open. `tur.singer.inverted` is a single turtle-global flag,
 * not scoped per-block, so an inner Invert closing would stomp on an outer
 * Invert that hadn't closed yet.
 *
 * `tur.singer.inverted` has exactly one consumer, `Singer.PitchActions.stepPitch`
 * (js/turtleactions/PitchActions.js), which trusts it to decide whether to
 * un-invert `lastNotePlayed` before computing a relative scale step. Every other
 * inversion-state consumer in the codebase already checks `invertList.length > 0`
 * directly, which is the correct source of truth these tests hold `inverted`
 * against.
 *
 * These tests drive the real `Singer.PitchActions.invert()` (not a stand-in) and
 * fire its dispatch listener the same way the real interpreter does — via the
 * `_invert_<turtle>` handler registered through `activity.logo.setTurtleListener`
 * — mirroring the direct-state-assertion style already used by
 * `turtle-singer.test.js` for this file family.
 */

global._ = str => str;
global.calcOctave = require("../utils/musicutils").calcOctave;
global.MusicBlocks = { isRun: false };

const Singer = require("../turtle-singer");
const setupPitchActions = require("../turtleactions/PitchActions");

function createActivity(turtle) {
    const listeners = {};
    return {
        listeners,
        turtles: { ithTurtle: jest.fn().mockReturnValue(turtle) },
        blocks: { blockList: {} },
        logo: {
            setTurtleListener: (_turtle, name, fn) => {
                listeners[name] = fn;
            },
            setDispatchBlock: jest.fn(),
            synth: { inTemperament: "equal" }
        },
        errorMsg: jest.fn()
    };
}

describe("Singer.PitchActions.invert — nested Invert blocks", () => {
    let turtle, activity;

    beforeEach(() => {
        turtle = { singer: null };
        turtle.singer = new Singer(turtle);
        activity = createActivity(turtle);
        setupPitchActions(activity);
    });

    test("a single, non-nested Invert block clears both invertList and inverted on close", () => {
        Singer.PitchActions.invert("sol", 4, "even", 0, "onlyBlk");
        expect(turtle.singer.invertList.length).toBe(1);

        activity.listeners["_invert_0"]();

        expect(turtle.singer.invertList.length).toBe(0);
        expect(turtle.singer.inverted).toBe(false);
    });

    test("closing an inner Invert block does not clear inverted while an outer Invert is still open", () => {
        Singer.PitchActions.invert("sol", 4, "even", 0, "outerBlk");
        Singer.PitchActions.invert("sol", 4, "even", 0, "innerBlk");
        expect(turtle.singer.invertList.length).toBe(2);

        // A note played while both Invert blocks were open, correctly setting
        // `inverted`, exactly as js/turtle-singer.js:1074/1358 do at note-start.
        turtle.singer.inverted = true;

        // The inner Invert block's clamp closes.
        activity.listeners["_invert_0"]();

        expect(turtle.singer.invertList.length).toBe(1); // outer Invert still open
        expect(turtle.singer.inverted).toBe(true);
    });

    test("closing the outer Invert block after the inner one has already closed clears inverted", () => {
        Singer.PitchActions.invert("sol", 4, "even", 0, "outerBlk");
        Singer.PitchActions.invert("sol", 4, "even", 0, "innerBlk");
        turtle.singer.inverted = true;

        activity.listeners["_invert_0"](); // inner closes — outer still open
        expect(turtle.singer.inverted).toBe(true);

        activity.listeners["_invert_0"](); // outer closes — nothing left open
        expect(turtle.singer.invertList.length).toBe(0);
        expect(turtle.singer.inverted).toBe(false);
    });

    test("three levels of nesting: inverted stays true until every Invert block has closed", () => {
        Singer.PitchActions.invert("sol", 4, "even", 0, "a");
        Singer.PitchActions.invert("sol", 4, "even", 0, "b");
        Singer.PitchActions.invert("sol", 4, "even", 0, "c");
        turtle.singer.inverted = true;

        activity.listeners["_invert_0"](); // closes "c"
        expect(turtle.singer.invertList.length).toBe(2);
        expect(turtle.singer.inverted).toBe(true);

        activity.listeners["_invert_0"](); // closes "b"
        expect(turtle.singer.invertList.length).toBe(1);
        expect(turtle.singer.inverted).toBe(true);

        activity.listeners["_invert_0"](); // closes "a"
        expect(turtle.singer.invertList.length).toBe(0);
        expect(turtle.singer.inverted).toBe(false);
    });
});
