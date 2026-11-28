/**
 * MusicBlocks v3.6.2
 *
 * @copyright 2026 Sugar Labs
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

const { PracticeValidator } = require("../practiceValidator");

const PHRASES = {
    A1: ["do4", "do4", "sol4", "sol4", "la4", "la4", "sol4"],
    A2: ["fa4", "fa4", "mi4", "mi4", "re4", "re4", "do4"],
    B: ["sol4", "sol4", "fa4", "fa4", "mi4", "mi4", "re4"]
};
const FORM = ["A1", "A2", "B", "B", "A1", "A2"];
const PROBLEM = { expected: { twinklePhraseMaker: true } };
const PITCH_NAME = /^([a-z]+)(\d+)$/;

const useBlocks = blockList => {
    window.ActivityContext = { getActivity: () => ({ blocks: { blockList } }) };
};

// A saved Phrase Maker phrase: an action whose body is one note clamp per pitch.
// With `nested: false` the pitch blocks hang straight off the action instead.
const phraseAction = (key, pitches, { label = key, nested = true } = {}) => {
    const id = `action-${key}`;
    const blocks = {
        [id]: {
            name: "action",
            trash: false,
            connections: [null, label ? `${id}-label` : null, `${id}-0`, null]
        }
    };
    if (label) {
        blocks[`${id}-label`] = { name: "text", value: label, trash: false, connections: [id] };
    }

    pitches.forEach((pitch, index) => {
        const [, name, octave] = pitch.match(PITCH_NAME);
        const slotId = `${id}-${index}`;
        const pitchId = nested ? `${slotId}-pitch` : slotId;
        const prevId = index === 0 ? id : `${id}-${index - 1}`;
        const nextId = index + 1 < pitches.length ? `${id}-${index + 1}` : null;

        blocks[pitchId] = {
            name: "pitch",
            trash: false,
            connections: [
                nested ? slotId : prevId,
                `${pitchId}-name`,
                `${pitchId}-octave`,
                nested ? null : nextId
            ]
        };
        blocks[`${pitchId}-name`] = {
            name: "solfege",
            value: name,
            trash: false,
            connections: [pitchId]
        };
        blocks[`${pitchId}-octave`] = {
            name: "number",
            value: Number(octave),
            trash: false,
            connections: [pitchId]
        };
        if (nested) {
            blocks[slotId] = {
                name: "newnote",
                trash: false,
                connections: [prevId, null, pitchId, nextId]
            };
        }
    });

    return blocks;
};

// A start block that calls each named action in turn.
const startCalling = names => {
    const blocks = { start: { name: "start", trash: false, connections: [null, "call-0", null] } };
    names.forEach((name, index) => {
        blocks[`call-${index}`] = {
            name: "nameddo",
            value: name,
            trash: false,
            connections: [
                index === 0 ? "start" : `call-${index - 1}`,
                index + 1 < names.length ? `call-${index + 1}` : null
            ]
        };
    });
    return blocks;
};

const matrix = { matrix: { name: "matrix", trash: false, connections: [] } };

const fullProgram = (form = FORM) => ({
    ...matrix,
    ...phraseAction("A1", PHRASES.A1),
    ...phraseAction("A2", PHRASES.A2),
    ...phraseAction("B", PHRASES.B),
    ...startCalling(form)
});

describe("PracticeValidator Twinkle Phrase Maker form", () => {
    afterEach(() => {
        delete window.ActivityContext;
    });

    test("fails closed when the workspace has no blocks", () => {
        useBlocks({});

        expect(PracticeValidator.validate(PROBLEM)).toBe(false);
    });

    test("fails closed when the activity cannot be read", () => {
        window.ActivityContext = {
            getActivity: () => {
                throw new Error("not ready");
            }
        };

        expect(PracticeValidator.validate(PROBLEM)).toBe(false);
    });

    test("accepts the three phrases called in song order", () => {
        useBlocks(fullProgram());

        expect(PracticeValidator.validate(PROBLEM)).toBe(true);
        expect(PracticeValidator.hasBadgeEvidence({}, "completeTwinkleForm")).toBe(true);
    });

    test("does not care what the child named the actions", () => {
        useBlocks({
            ...matrix,
            ...phraseAction("A1", PHRASES.A1, { label: "Twinkle" }),
            ...phraseAction("A2", PHRASES.A2, { label: "Little" }),
            ...phraseAction("B", PHRASES.B, { label: "Star" }),
            ...startCalling(["Twinkle", "Little", "Star", "Star", "Twinkle", "Little"])
        });

        expect(PracticeValidator.validate(PROBLEM)).toBe(true);
    });

    test("needs a Phrase Maker block on the canvas", () => {
        const program = fullProgram();
        delete program.matrix;
        useBlocks(program);

        expect(PracticeValidator.validate(PROBLEM)).toBe(false);
    });

    test("rejects the phrases called in the wrong order", () => {
        useBlocks(fullProgram(["A1", "B", "A2", "B", "A1", "A2"]));

        expect(PracticeValidator.validate(PROBLEM)).toBe(false);
    });

    test("rejects a song that is missing its last call", () => {
        useBlocks(fullProgram(FORM.slice(0, -1)));

        expect(PracticeValidator.validate(PROBLEM)).toBe(false);
    });

    test("rejects a song that keeps playing after the form ends", () => {
        useBlocks(fullProgram([...FORM, "A1"]));

        expect(PracticeValidator.validate(PROBLEM)).toBe(false);
    });

    test("rejects a program where one phrase was never built", () => {
        useBlocks({
            ...matrix,
            ...phraseAction("A1", PHRASES.A1),
            ...phraseAction("A2", PHRASES.A2),
            ...startCalling(FORM)
        });

        expect(PracticeValidator.validate(PROBLEM)).toBe(false);
    });

    test("ignores a trashed action", () => {
        const program = fullProgram();
        program["action-B"].trash = true;
        useBlocks(program);

        expect(PracticeValidator.validate(PROBLEM)).toBe(false);
    });

    test("ignores an action with no name to call it by", () => {
        useBlocks({
            ...matrix,
            ...phraseAction("A1", PHRASES.A1),
            ...phraseAction("A2", PHRASES.A2),
            ...phraseAction("B", PHRASES.B, { label: "" }),
            ...startCalling(FORM)
        });

        expect(PracticeValidator.validate(PROBLEM)).toBe(false);
    });

    test("ignores an action with no pitches in it", () => {
        const program = fullProgram();
        program["action-B"].connections[2] = null;
        useBlocks(program);

        expect(PracticeValidator.validate(PROBLEM)).toBe(false);
    });

    test("rejects a phrase with a wrong pitch", () => {
        const wrongA1 = [...PHRASES.A1];
        wrongA1[4] = "ti4";
        useBlocks({
            ...matrix,
            ...phraseAction("A1", wrongA1),
            ...phraseAction("A2", PHRASES.A2),
            ...phraseAction("B", PHRASES.B),
            ...startCalling(FORM)
        });

        expect(PracticeValidator.validate(PROBLEM)).toBe(false);
    });

    test("rejects a phrase sung in the wrong octave", () => {
        const program = fullProgram();
        program["action-A1-2-pitch-octave"].value = 5;
        useBlocks(program);

        expect(PracticeValidator.validate(PROBLEM)).toBe(false);
    });

    test("compares pitch names without regard to capitalisation", () => {
        const program = fullProgram();
        program["action-A1-0-pitch-name"].value = "DO";
        useBlocks(program);

        expect(PracticeValidator.validate(PROBLEM)).toBe(true);
    });

    test("a pitch with no readable octave drops out of its phrase", () => {
        const program = fullProgram();
        program["action-A2-0-pitch-octave"].value = "high";
        useBlocks(program);

        expect(PracticeValidator.validate(PROBLEM)).toBe(false);
    });

    // A1 A2, then B inside a repeat, then A1 A2.
    const programWithRepeatedB = count => ({
        ...matrix,
        ...phraseAction("A1", PHRASES.A1),
        ...phraseAction("A2", PHRASES.A2),
        ...phraseAction("B", PHRASES.B),
        start: { name: "start", trash: false, connections: [null, "a1", null] },
        a1: { name: "nameddo", value: "A1", trash: false, connections: ["start", "a2"] },
        a2: { name: "nameddo", value: "A2", trash: false, connections: ["a1", "loop"] },
        loop: { name: "repeat", trash: false, connections: ["a2", "times", "b", "a1b"] },
        times: { name: "number", value: count, trash: false, connections: ["loop"] },
        b: { name: "nameddo", value: "B", trash: false, connections: ["loop", null] },
        a1b: { name: "nameddo", value: "A1", trash: false, connections: ["loop", "a2b"] },
        a2b: { name: "nameddo", value: "A2", trash: false, connections: ["a1b", null] }
    });

    test("counts a repeat of the middle phrase as two calls", () => {
        useBlocks(programWithRepeatedB(2));

        expect(PracticeValidator.validate(PROBLEM)).toBe(true);
    });

    test.each([
        [2.5, true, "a fractional count is floored to two passes"],
        [3, false, "three passes is one B too many"],
        [1, false, "one pass leaves the middle phrase short"]
    ])("repeat count %p gives %p: %s", (count, expected) => {
        useBlocks(programWithRepeatedB(count));

        expect(PracticeValidator.validate(PROBLEM)).toBe(expected);
    });

    // A complete form (A1 A2 B B A1 A2) with a spare repeat of B tucked in after the second B.
    // The song is only right when that repeat runs zero times, so a validator that ran the body
    // once would be caught here, unlike on a form that was already short.
    const programWithSpareRepeatOfB = count => ({
        ...matrix,
        ...phraseAction("A1", PHRASES.A1),
        ...phraseAction("A2", PHRASES.A2),
        ...phraseAction("B", PHRASES.B),
        start: { name: "start", trash: false, connections: [null, "a1", null] },
        a1: { name: "nameddo", value: "A1", trash: false, connections: ["start", "a2"] },
        a2: { name: "nameddo", value: "A2", trash: false, connections: ["a1", "b1"] },
        b1: { name: "nameddo", value: "B", trash: false, connections: ["a2", "b2"] },
        b2: { name: "nameddo", value: "B", trash: false, connections: ["b1", "spare"] },
        spare: { name: "repeat", trash: false, connections: ["b2", "times", "extra", "a1b"] },
        times: { name: "number", value: count, trash: false, connections: ["spare"] },
        extra: { name: "nameddo", value: "B", trash: false, connections: ["spare", null] },
        a1b: { name: "nameddo", value: "A1", trash: false, connections: ["spare", "a2b"] },
        a2b: { name: "nameddo", value: "A2", trash: false, connections: ["a1b", null] }
    });

    test.each([
        [0, true, "a count below one runs the body zero times"],
        [0.5, true, "a count below one, even a fraction, runs the body zero times"],
        ["high", true, "a count that is not a number runs the body zero times"],
        [1, false, "one pass adds a third B"]
    ])("spare repeat of B with count %p gives %p: %s", (count, expected) => {
        useBlocks(programWithSpareRepeatOfB(count));

        expect(PracticeValidator.validate(PROBLEM)).toBe(expected);
    });

    test("reads pitches placed directly in an action as well as inside notes", () => {
        useBlocks({
            ...matrix,
            ...phraseAction("A1", PHRASES.A1, { nested: false }),
            ...phraseAction("A2", PHRASES.A2),
            ...phraseAction("B", PHRASES.B),
            ...startCalling(FORM)
        });

        expect(PracticeValidator.validate(PROBLEM)).toBe(true);
    });

    test("reads a phrase that loops back on itself once instead of forever", () => {
        const program = fullProgram();
        program[`action-A1-${PHRASES.A1.length - 1}`].connections[3] = "action-A1-0";
        useBlocks(program);

        // Each block is visited once, so the seven pitches are not repeated.
        expect(PracticeValidator.validate(PROBLEM)).toBe(true);
    });
});
