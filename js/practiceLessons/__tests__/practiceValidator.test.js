/**
 * MusicBlocks v3.6.2
 *
 * @author Stuti Jain
 *
 * @copyright 2026 Stuti Jain
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

function makePolygonStack(startId, repeatId, sideCount, turnBlock) {
    const numberId = `${repeatId}-count`;
    const forwardId = `${repeatId}-forward`;
    const forwardNumberId = `${repeatId}-forward-number`;
    const rightId = `${repeatId}-right`;

    return {
        [startId]: { name: "start", trash: false, connections: [null, repeatId, null] },
        [repeatId]: {
            name: "repeat",
            trash: false,
            connections: [startId, numberId, forwardId, null]
        },
        [numberId]: { name: "number", value: sideCount, trash: false, connections: [repeatId] },
        [forwardId]: {
            name: "forward",
            trash: false,
            connections: [repeatId, forwardNumberId, rightId]
        },
        [forwardNumberId]: { name: "number", value: 100, trash: false, connections: [forwardId] },
        [rightId]: { name: "right", trash: false, connections: [forwardId, turnBlock.id, null] },
        ...turnBlock.blocks
    };
}

function numberTurn(id, value) {
    return {
        id,
        blocks: {
            [id]: { name: "number", value, trash: false, connections: [] }
        }
    };
}

function dividedTurn(id, sides) {
    return {
        id,
        blocks: {
            [id]: {
                name: "divide",
                trash: false,
                connections: [null, `${id}-whole`, `${id}-sides`]
            },
            [`${id}-whole`]: { name: "number", value: 360, trash: false, connections: [id] },
            [`${id}-sides`]: { name: "number", value: sides, trash: false, connections: [id] }
        }
    };
}

function makeRhythmBlock(id, divisor) {
    return {
        [`setdrum-${id}`]: {
            name: "setdrum",
            trash: false,
            connections: [null, `drum-${id}`, `rhythm-${id}`, null]
        },
        [`drum-${id}`]: {
            name: "drumname",
            value: "snare drum",
            trash: false,
            connections: [`setdrum-${id}`]
        },
        [`rhythm-${id}`]: {
            name: "rhythm2",
            trash: false,
            connections: [`setdrum-${id}`, `count-${id}`, `divide-${id}`, null]
        },
        [`count-${id}`]: {
            name: "number",
            value: 1,
            trash: false,
            connections: [`rhythm-${id}`]
        },
        [`divide-${id}`]: {
            name: "divide",
            trash: false,
            connections: [`rhythm-${id}`, `numerator-${id}`, `denominator-${id}`]
        },
        [`numerator-${id}`]: {
            name: "number",
            value: 1,
            trash: false,
            connections: [`divide-${id}`]
        },
        [`denominator-${id}`]: {
            name: "number",
            value: divisor,
            trash: false,
            connections: [`divide-${id}`]
        }
    };
}

describe("PracticeValidator geometry levels", () => {
    beforeEach(() => {
        window.ActivityContext = {
            getActivity: jest.fn(() => ({
                blocks: {
                    blockList: {}
                }
            }))
        };
    });

    test("validates separate triangle square and pentagon programs", () => {
        const blockList = {
            ...makePolygonStack(
                "start-triangle",
                "repeat-triangle",
                3,
                numberTurn("turn-triangle", 120)
            ),
            ...makePolygonStack("start-square", "repeat-square", 4, numberTurn("turn-square", 90)),
            ...makePolygonStack(
                "start-pentagon",
                "repeat-pentagon",
                5,
                dividedTurn("turn-pentagon", 5)
            )
        };

        window.ActivityContext.getActivity.mockReturnValue({ blocks: { blockList } });

        expect(PracticeValidator.validate({ expected: { basicShapeSet: true } })).toBe(true);
    });

    test("detects an extra polygon beyond the required shape set", () => {
        const blockList = makePolygonStack(
            "start-hexagon",
            "repeat-hexagon",
            6,
            dividedTurn("turn-hexagon", 6)
        );

        window.ActivityContext.getActivity.mockReturnValue({ blocks: { blockList } });

        expect(PracticeValidator.hasBadgeEvidence({}, "createdExtraPolygon")).toBe(true);
    });

    test("validates animated polyrhythm with duplet triplet avatar and note action", () => {
        const blockList = {
            "start": { name: "start", trash: false, connections: [null, "every-note", null] },
            "every-note": {
                name: "everybeatdo",
                trash: false,
                connections: ["start", "action-text", "avatar"]
            },
            "action-text": {
                name: "text",
                value: "action",
                trash: false,
                connections: ["every-note"]
            },
            "avatar": {
                name: "turtleshell",
                trash: false,
                connections: ["every-note", "avatar-size", "avatar-media", null]
            },
            "avatar-size": { name: "number", value: 55, trash: false, connections: ["avatar"] },
            "avatar-media": { name: "media", trash: false, connections: ["avatar"] },
            ...makeRhythmBlock("duplet", 2),
            ...makeRhythmBlock("triplet", 3)
        };

        window.ActivityContext.getActivity.mockReturnValue({ blocks: { blockList } });

        expect(PracticeValidator.validate({ expected: { animatedPolyrhythm: true } })).toBe(true);
    });

    test("detects an extra rhythm divisor beyond the duplet and triplet starter", () => {
        const blockList = {
            ...makeRhythmBlock("duplet", 2),
            ...makeRhythmBlock("triplet", 3),
            ...makeRhythmBlock("extra", 5)
        };

        window.ActivityContext.getActivity.mockReturnValue({ blocks: { blockList } });

        expect(PracticeValidator.hasBadgeEvidence({}, "createdExtraPolyrhythmDivisor")).toBe(true);
    });
});

const useBlocks = blockList => {
    window.ActivityContext = { getActivity: () => ({ blocks: { blockList } }) };
};

const chunkFlow = (names, firstId = "c0") => {
    const blocks = {
        start: { name: "start", trash: false, connections: [null, firstId, null] }
    };

    names.forEach((name, index) => {
        blocks[`c${index}`] = {
            name: "nameddo",
            value: name,
            trash: false,
            connections: [
                index === 0 ? "start" : `c${index - 1}`,
                index === names.length - 1 ? null : `c${index + 1}`
            ]
        };
    });

    return blocks;
};

const actionNamed = (id, label) => ({
    [id]: { name: "action", trash: false, connections: [null, `${id}-label`, null] },
    [`${id}-label`]: { name: "text", value: label, trash: false, connections: [id] }
});

const pitchAtOctave = (id, octave) => ({
    [id]: { name: "pitch", trash: false, connections: [null, `${id}-solfege`, `${id}-octave`] },
    [`${id}-solfege`]: { name: "solfege", value: "do", trash: false, connections: [id] },
    [`${id}-octave`]: { name: "number", value: octave, trash: false, connections: [id] }
});

describe("PracticeValidator.getBlockList", () => {
    test("returns nothing when Music Blocks has not started", () => {
        delete window.ActivityContext;

        expect(PracticeValidator.getBlockList()).toEqual({});
        expect(PracticeValidator.getCurrentSequence()).toEqual([]);
    });

    test("returns nothing when the activity context throws", () => {
        window.ActivityContext = {
            getActivity: () => {
                throw new Error("not ready");
            }
        };

        expect(PracticeValidator.getBlockList()).toEqual({});
    });
});

describe("PracticeValidator.getCurrentSequence", () => {
    test("is empty when there is no start block to read from", () => {
        useBlocks({ lonely: { name: "nameddo", value: "A", trash: false, connections: [null] } });

        expect(PracticeValidator.getCurrentSequence()).toEqual([]);
    });

    test("reads the chunks under start in order", () => {
        useBlocks(chunkFlow(["A", "A", "B", "A"]));

        expect(PracticeValidator.getCurrentSequence()).toEqual(["A", "A", "B", "A"]);
    });

    test("expands a repeat into the sequence it plays", () => {
        useBlocks({
            start: { name: "start", trash: false, connections: [null, "rep", null] },
            rep: { name: "repeat", trash: false, connections: ["start", "count", "c0", null] },
            count: { name: "number", value: 3, trash: false, connections: ["rep"] },
            c0: { name: "nameddo", value: "A", trash: false, connections: ["rep", "c1"] },
            c1: { name: "nameddo", value: "B", trash: false, connections: ["c0", null] }
        });

        expect(PracticeValidator.getCurrentSequence()).toEqual(["A", "B", "A", "B", "A", "B"]);
    });

    test("treats a repeat with no count as playing once", () => {
        useBlocks({
            start: { name: "start", trash: false, connections: [null, "rep", null] },
            rep: { name: "repeat", trash: false, connections: ["start", null, "c0", null] },
            c0: { name: "nameddo", value: "A", trash: false, connections: ["rep", null] }
        });

        expect(PracticeValidator.getCurrentSequence()).toEqual(["A"]);
    });

    test("sees through the hidden blocks Music Blocks inserts inside clamps", () => {
        useBlocks({
            start: { name: "start", trash: false, connections: [null, "hide", null] },
            hide: { name: "hidden", trash: false, connections: ["start", "c0"] },
            c0: { name: "nameddo", value: "A", trash: false, connections: ["hide", null] }
        });

        expect(PracticeValidator.getCurrentSequence()).toEqual(["A"]);
    });

    test("stops at a chunk that has been thrown away", () => {
        const blocks = chunkFlow(["A", "B"]);
        blocks.c1.trash = true;
        useBlocks(blocks);

        expect(PracticeValidator.getCurrentSequence()).toEqual(["A"]);
    });
});

describe("PracticeValidator.matchesPattern", () => {
    test("accepts the exact sequence", () => {
        expect(PracticeValidator.matchesPattern(["A", "A", "B"], ["A", "A", "B"])).toBe(true);
    });

    test("accepts chunks the learner renamed, as long as the shape holds", () => {
        expect(
            PracticeValidator.matchesPattern(
                ["Verse", "Verse", "Chorus", "Verse"],
                ["A", "A", "B", "A"]
            )
        ).toBe(true);
    });

    test("rejects a renaming that collapses two different chunks into one", () => {
        expect(PracticeValidator.matchesPattern(["A", "A", "A", "A"], ["A", "A", "B", "A"])).toBe(
            false
        );
    });

    test("rejects one chunk used under two different names", () => {
        expect(PracticeValidator.matchesPattern(["X", "Y", "B", "X"], ["A", "A", "B", "A"])).toBe(
            false
        );
    });

    test("rejects a sequence of the wrong length", () => {
        expect(PracticeValidator.matchesPattern(["A", "A"], ["A", "A", "B"])).toBe(false);
    });

    test("rejects a sequence with a gap in it", () => {
        expect(PracticeValidator.matchesPattern([undefined, "A"], ["A", "B"])).toBe(false);
    });
});

describe("PracticeValidator.validate", () => {
    test("fails a lesson that declares nothing to check", () => {
        useBlocks({});

        expect(PracticeValidator.validate({})).toBe(false);
        expect(PracticeValidator.validate(null)).toBe(false);
    });

    test("checks the chunk pattern when that is all the lesson asks for", () => {
        useBlocks(chunkFlow(["A", "A", "B", "A"]));

        expect(PracticeValidator.validate({ expected: { pattern: ["A", "A", "B", "A"] } })).toBe(
            true
        );
        expect(PracticeValidator.validate({ expected: { pattern: ["A", "B"] } })).toBe(false);
    });
});

describe("PracticeValidator chunk renaming", () => {
    test("is not evidence when the lesson lists no original names", () => {
        useBlocks(actionNamed("a1", "Verse"));

        expect(PracticeValidator.hasRenamedChunks(undefined)).toBe(false);
    });

    test("is not evidence while the starter names are untouched", () => {
        useBlocks({ ...actionNamed("a1", "A"), ...actionNamed("a2", "B") });

        expect(PracticeValidator.hasRenamedChunks(["A", "B"])).toBe(false);
    });

    test("is evidence once a chunk carries a name of the learner's own", () => {
        useBlocks({ ...actionNamed("a1", "A"), ...actionNamed("a2", "Chorus") });

        expect(PracticeValidator.hasRenamedChunks(["A", "B"])).toBe(true);
    });

    test("ignores an action that has been thrown away", () => {
        const blocks = actionNamed("a1", "Chorus");
        blocks.a1.trash = true;
        useBlocks(blocks);

        expect(PracticeValidator.hasRenamedChunks(["A"])).toBe(false);
    });
});

describe("PracticeValidator pitch octaves", () => {
    test("reads every pitch octave in ascending order", () => {
        useBlocks({ ...pitchAtOctave("p1", 5), ...pitchAtOctave("p2", 3) });

        expect(PracticeValidator.getPitchOctaves()).toEqual([3, 5]);
    });

    test("is not evidence while the octaves match the starter project", () => {
        useBlocks({ ...pitchAtOctave("p1", 4), ...pitchAtOctave("p2", 4) });

        expect(PracticeValidator.hasChangedPitchOctave([4, 4])).toBe(false);
    });

    test("is evidence once an octave has been moved", () => {
        useBlocks({ ...pitchAtOctave("p1", 4), ...pitchAtOctave("p2", 6) });

        expect(PracticeValidator.hasChangedPitchOctave([4, 4])).toBe(true);
    });

    test("without a baseline, anything other than octave four counts", () => {
        useBlocks(pitchAtOctave("p1", 5));

        expect(PracticeValidator.hasChangedPitchOctave()).toBe(true);
    });

    test("without a baseline, octave four alone does not count", () => {
        useBlocks(pitchAtOctave("p1", 4));

        expect(PracticeValidator.hasChangedPitchOctave()).toBe(false);
    });
});

describe("PracticeValidator block presence", () => {
    test("finds a block that is merely sitting on the canvas", () => {
        useBlocks({ loose: { name: "repeat", trash: false, connections: [null, null] } });

        expect(PracticeValidator.hasBlockNamed(["repeat"])).toBe(true);
    });

    test("does not count a loose block as connected", () => {
        useBlocks({ loose: { name: "repeat", trash: false, connections: [null, null] } });

        expect(PracticeValidator.hasConnectedBlockNamed(["repeat"])).toBe(false);
    });

    test("counts a block once it is attached to a stack", () => {
        useBlocks({
            start: { name: "start", trash: false, connections: [null, "rep", null] },
            rep: { name: "repeat", trash: false, connections: ["start", null, null, null] }
        });

        expect(PracticeValidator.hasConnectedBlockNamed(["repeat"])).toBe(true);
    });

    test("counts the mice on the canvas", () => {
        useBlocks({
            s1: { name: "start", trash: false, connections: [] },
            s2: { name: "start", trash: false, connections: [] },
            s3: { name: "start", trash: true, connections: [] }
        });

        expect(PracticeValidator.countStartBlocks()).toBe(2);
    });
});

describe("PracticeValidator variations", () => {
    test("is not evidence without a baseline pattern", () => {
        useBlocks(chunkFlow(["A"]));

        expect(PracticeValidator.hasCreatedVariation(undefined)).toBe(false);
    });

    test("is not evidence while the song is still the required length", () => {
        useBlocks(chunkFlow(["A", "B"]));

        expect(PracticeValidator.hasCreatedVariation(["A", "B"])).toBe(false);
    });

    test("is evidence once the learner extends the song beyond the lesson", () => {
        useBlocks(chunkFlow(["A", "B", "B"]));

        expect(PracticeValidator.hasCreatedVariation(["A", "B"])).toBe(true);
    });
});

describe("PracticeValidator stored values", () => {
    test("spots a value toggled with one minus", () => {
        useBlocks({
            s: { name: "storein", trash: false, connections: [null, "name", "calc", null] },
            name: { name: "text", value: "flip", trash: false, connections: ["s"] },
            calc: { name: "minus", trash: false, connections: ["s", "one", "box"] },
            one: { name: "number", value: 1, trash: false, connections: ["calc"] },
            box: { name: "namedbox", trash: false, connections: ["calc"] }
        });

        expect(PracticeValidator.hasToggleStore()).toBe(true);
    });

    test("reads the value slot of the second store block shape", () => {
        useBlocks({
            s: { name: "storein2", trash: false, connections: [null, "calc", null] },
            calc: { name: "minus", trash: false, connections: ["s", "one", "box"] },
            one: { name: "number", value: 1, trash: false, connections: ["calc"] },
            box: { name: "namedbox", trash: false, connections: ["calc"] }
        });

        expect(PracticeValidator.hasToggleStore()).toBe(true);
    });

    test("a plain store is not a toggle", () => {
        useBlocks({
            s: { name: "storein", trash: false, connections: [null, "name", "one", null] },
            name: { name: "text", value: "count", trash: false, connections: ["s"] },
            one: { name: "number", value: 1, trash: false, connections: ["s"] }
        });

        expect(PracticeValidator.hasToggleStore()).toBe(false);
    });
});

describe("PracticeValidator.assessBadges", () => {
    test("returns nothing for a lesson that defines no badges", () => {
        useBlocks({});

        expect(PracticeValidator.assessBadges({})).toEqual([]);
        expect(PracticeValidator.assessBadges({ badges: "nope" })).toEqual([]);
    });

    test("keeps only the badges the canvas can currently prove", () => {
        useBlocks({
            start: { name: "start", trash: false, connections: [null, "rep", null] },
            rep: { name: "repeat", trash: false, connections: ["start", null, null, null] }
        });

        const badges = PracticeValidator.assessBadges({
            badges: [
                { id: "loop", criterion: "usedRepeatLoop" },
                { id: "drum", criterion: "playedRingDrum" }
            ]
        });

        expect(badges.map(badge => badge.id)).toEqual(["loop"]);
    });

    test("a criterion nobody implemented can never be earned", () => {
        useBlocks({});

        expect(PracticeValidator.hasBadgeEvidence({}, "notARealCriterion")).toBe(false);
    });
});

// An action block holds its label in connection 1 and the first block of its body in connection 2.
const actionWithBody = (id, label, bodyFirstId, bodyBlocks) => ({
    [id]: { name: "action", trash: false, connections: [null, `${id}-label`, bodyFirstId, null] },
    [`${id}-label`]: { name: "text", value: label, trash: false, connections: [id] },
    ...bodyBlocks
});

describe("PracticeValidator rhythm maker workflow", () => {
    const rhythmAction = actionWithBody("act", "drumbeat", "body", {
        body: { name: "rhythm2", trash: false, connections: ["act", "n1", "n2", null] },
        n1: { name: "number", value: 4, trash: false, connections: ["body"] },
        n2: { name: "number", value: 4, trash: false, connections: ["body"] }
    });

    test("passes once the exported rhythm action is played from start", () => {
        useBlocks({ ...rhythmAction, ...chunkFlow(["drumbeat"]) });

        expect(PracticeValidator.validate({ expected: { rhythmMakerWorkflow: true } })).toBe(true);
    });

    test("fails while the rhythm action is never played", () => {
        useBlocks(rhythmAction);

        expect(PracticeValidator.validate({ expected: { rhythmMakerWorkflow: true } })).toBe(false);
    });

    test("fails when start plays an action that holds no rhythm", () => {
        useBlocks({
            ...actionWithBody("act", "drumbeat", "body", {
                body: { name: "playdrum", trash: false, connections: ["act", null, null] }
            }),
            ...chunkFlow(["drumbeat"])
        });

        expect(PracticeValidator.validate({ expected: { rhythmMakerWorkflow: true } })).toBe(false);
    });

    test("accepts a tuplet as a rhythm too", () => {
        useBlocks({
            ...actionWithBody("act", "drumbeat", "body", {
                body: { name: "stuplet", trash: false, connections: ["act", null, null, null] }
            }),
            ...chunkFlow(["drumbeat"])
        });

        expect(PracticeValidator.validateRhythmMakerWorkflow()).toBe(true);
    });
});

describe("PracticeValidator circular rhythm ring", () => {
    const ringBlocks = () => ({
        // A broadcast whose name is calculated rather than typed.
        "send": { name: "dispatch", trash: false, connections: [null, "name-calc", null] },
        "name-calc": { name: "plus", trash: false, connections: ["send", "txt", "num"] },
        "txt": { name: "text", value: "drum", trash: false, connections: ["name-calc"] },
        "num": { name: "number", value: 1, trash: false, connections: ["name-calc"] },
        // A loop that draws the ring.
        "rep": { name: "repeat", trash: false, connections: [null, "count", "arc", null] },
        "count": { name: "number", value: 12, trash: false, connections: ["rep"] },
        "arc": { name: "arc", trash: false, connections: ["rep", null, null, null] },
        // Wrap-around maths, attached to something.
        "modulo": { name: "mod", trash: false, connections: ["rep", null, null] },
        // A mouse that listens and moves.
        ...actionWithBody("listener", "ring", "listen-blk", {
            "listen-blk": { name: "listen", trash: false, connections: ["listener", null, "move"] },
            "move": { name: "setxy", trash: false, connections: ["listen-blk", null, null, null] }
        })
    });

    test("passes when the broadcast, the arc loop, the wrap maths, and the listener all exist", () => {
        useBlocks(ringBlocks());

        expect(PracticeValidator.validate({ expected: { circularRhythmRing: true } })).toBe(true);
    });

    test("fails when the broadcast name is not built from a calculation", () => {
        const blocks = ringBlocks();
        blocks["name-calc"].name = "text";

        useBlocks(blocks);

        expect(PracticeValidator.validateCircularRhythmRing()).toBe(false);
    });

    test("fails when nothing draws the ring", () => {
        const blocks = ringBlocks();
        delete blocks.arc;

        useBlocks(blocks);

        expect(PracticeValidator.validateCircularRhythmRing()).toBe(false);
    });

    test("fails when the listener never moves the mouse", () => {
        const blocks = ringBlocks();
        blocks.move.name = "print";

        useBlocks(blocks);

        expect(PracticeValidator.validateCircularRhythmRing()).toBe(false);
    });
});

describe("PracticeValidator animated polyrhythm", () => {
    test("needs the avatar as well as the two rhythms", () => {
        useBlocks({
            ...makeRhythmBlock("duplet", 2),
            ...makeRhythmBlock("triplet", 3),
            start: { name: "start", trash: false, connections: [null, "every", null] },
            every: { name: "everybeatdo", trash: false, connections: ["start", null, null] }
        });

        expect(PracticeValidator.validate({ expected: { animatedPolyrhythm: true } })).toBe(false);
    });

    test("needs both rhythms, not just one", () => {
        useBlocks({
            ...makeRhythmBlock("duplet", 2),
            start: { name: "start", trash: false, connections: [null, "every", null] },
            every: { name: "everybeatdo", trash: false, connections: ["start", null, "shell"] },
            shell: { name: "turtleshell", trash: false, connections: ["every", null, null, null] }
        });

        expect(PracticeValidator.validate({ expected: { animatedPolyrhythm: true } })).toBe(false);
    });
});

describe("PracticeValidator drum choices", () => {
    const withDrum = drum => ({
        sd: { name: "setdrum", trash: false, connections: [null, "name", null, null] },
        name: { name: "drumname", value: drum, trash: false, connections: ["sd"] }
    });

    test("reads back the drums that were chosen", () => {
        useBlocks(withDrum("snare drum"));

        expect(PracticeValidator.getSetDrumNames()).toContain("snare drum");
    });

    test("the starter drum on its own is not a discovery", () => {
        useBlocks(withDrum("snare drum"));

        expect(PracticeValidator.hasChangedDrumSound()).toBe(false);
    });

    test("picking a different drum is a discovery", () => {
        useBlocks(withDrum("cow bell"));

        expect(PracticeValidator.hasChangedDrumSound()).toBe(true);
    });
});

describe("PracticeValidator badge criteria that look for one block", () => {
    // Each criterion is satisfied by a single block attached to something.
    const CRITERIA = [
        ["usedRepeatLoop", "repeat"],
        ["usedTranspose", "settransposition"],
        ["usedGeometryDivision", "divide"],
        ["usedBoxVariable", "storein"],
        ["readBoxValue", "namedbox"],
        ["changedShapeColor", "setcolor"],
        ["usedAvatarAnimation", "turtleshell"],
        ["usedEveryNoteAction", "everybeatdo"],
        ["usedNoteValueMotion", "turtlenote"],
        ["createdPitchPolyrhythm", "pitch"],
        ["changedAnimationTurn", "right"],
        ["playedRingDrum", "playdrum"]
    ];

    test.each(CRITERIA)("%s is proved by a connected %s block", (criterion, blockName) => {
        useBlocks({
            start: { name: "start", trash: false, connections: [null, "target", null] },
            target: { name: blockName, trash: false, connections: ["start", null, null] }
        });

        expect(PracticeValidator.hasBadgeEvidence({}, criterion)).toBe(true);
    });

    test.each(CRITERIA)("%s is not proved by a loose %s block", (criterion, blockName) => {
        useBlocks({ target: { name: blockName, trash: false, connections: [null, null, null] } });

        expect(PracticeValidator.hasBadgeEvidence({}, criterion)).toBe(false);
    });

    test("builtMouseRing needs four mice", () => {
        const mice = count =>
            Object.fromEntries(
                Array.from({ length: count }, (unused, index) => [
                    `s${index}`,
                    { name: "start", trash: false, connections: [] }
                ])
            );

        useBlocks(mice(3));
        expect(PracticeValidator.hasBadgeEvidence({}, "builtMouseRing")).toBe(false);

        useBlocks(mice(4));
        expect(PracticeValidator.hasBadgeEvidence({}, "builtMouseRing")).toBe(true);
    });

    test("addedHarmonyVoice needs a second mouse", () => {
        useBlocks({ s0: { name: "start", trash: false, connections: [] } });
        expect(PracticeValidator.hasBadgeEvidence({}, "addedHarmonyVoice")).toBe(false);

        useBlocks({
            s0: { name: "start", trash: false, connections: [] },
            s1: { name: "start", trash: false, connections: [] }
        });
        expect(PracticeValidator.hasBadgeEvidence({}, "addedHarmonyVoice")).toBe(true);
    });

    test("completePattern defers to the lesson's own pattern check", () => {
        useBlocks(chunkFlow(["A", "B"]));

        expect(
            PracticeValidator.hasBadgeEvidence(
                { expected: { pattern: ["A", "B"] } },
                "completePattern"
            )
        ).toBe(true);
    });
});

// Mirrors the note value drum shape Music Blocks builds: newnote { vspace -> playdrum }.
const drumNote = (id, drum, prev, next) => ({
    [id]: { name: "newnote", trash: false, connections: [prev, `${id}-div`, `${id}-body`, next] },
    [`${id}-div`]: { name: "divide", trash: false, connections: [id, `${id}-n1`, `${id}-n4`] },
    [`${id}-n1`]: { name: "number", value: 1, trash: false, connections: [`${id}-div`] },
    [`${id}-n4`]: { name: "number", value: 4, trash: false, connections: [`${id}-div`] },
    [`${id}-body`]: { name: "vspace", trash: false, connections: [id, `${id}-drum`] },
    [`${id}-drum`]: {
        name: "playdrum",
        trash: false,
        connections: [`${id}-body`, `${id}-name`, null]
    },
    [`${id}-name`]: { name: "drumname", value: drum, trash: false, connections: [`${id}-drum`] }
});

const metronome = (drums, { inLoop = true } = {}) => {
    const first = "n0";
    const blocks = inLoop
        ? {
              start: { name: "start", trash: false, connections: [null, "loop", null] },
              loop: { name: "forever", trash: false, connections: ["start", first, null] }
          }
        : { start: { name: "start", trash: false, connections: [null, first, null] } };

    drums.forEach((drum, index) => {
        Object.assign(
            blocks,
            drumNote(
                `n${index}`,
                drum,
                index === 0 ? (inLoop ? "loop" : "start") : `n${index - 1}`,
                index === drums.length - 1 ? null : `n${index + 1}`
            )
        );
    });

    return blocks;
};

describe("PracticeValidator metronome", () => {
    test("passes once a loop holds two different drum sounds", () => {
        useBlocks(metronome(["kick drum", "hi hat"]));

        expect(PracticeValidator.validate({ expected: { metronomeWorkflow: true } })).toBe(true);
    });

    test("fails on the starter project, which has only one drum", () => {
        useBlocks(metronome(["snare drum"]));

        expect(PracticeValidator.validate({ expected: { metronomeWorkflow: true } })).toBe(false);
    });

    test("fails when both drums make the same sound, because that is not a tick and a tock", () => {
        useBlocks(metronome(["snare drum", "snare drum"]));

        expect(PracticeValidator.validateMetronome()).toBe(false);
    });

    test("fails when the drums are not inside a loop, so the pulse never repeats", () => {
        useBlocks(metronome(["kick drum", "hi hat"], { inLoop: false }));

        expect(PracticeValidator.validateMetronome()).toBe(false);
    });

    test("accepts a repeat loop as well as forever", () => {
        const blocks = metronome(["kick drum", "hi hat"]);
        blocks.loop = { name: "repeat", trash: false, connections: ["start", "times", "n0", null] };
        blocks.times = { name: "number", value: 8, trash: false, connections: ["loop"] };
        useBlocks(blocks);

        expect(PracticeValidator.validateMetronome()).toBe(true);
    });

    test("reads drum names from both playdrum and setdrum blocks", () => {
        useBlocks({
            ...metronome(["kick drum", "hi hat"]),
            "sd": { name: "setdrum", trash: false, connections: [null, "sd-name", null, null] },
            "sd-name": { name: "drumname", value: "cow bell", trash: false, connections: ["sd"] }
        });

        expect(new Set(PracticeValidator.getPlayedDrumNames())).toEqual(
            new Set(["kick drum", "hi hat", "cow bell"])
        );
    });

    test("ignores a drum that has been thrown away", () => {
        const blocks = metronome(["kick drum", "hi hat"]);
        blocks["n1-drum"].trash = true;
        useBlocks(blocks);

        expect(PracticeValidator.validateMetronome()).toBe(false);
    });
});

describe("PracticeValidator metronome discoveries", () => {
    const connected = name => ({
        start: { name: "start", trash: false, connections: [null, "target", null] },
        target: { name, trash: false, connections: ["start", null, null] }
    });

    test.each([
        ["swungThePendulum", "setheading"],
        ["changedTempo", "setmasterbpm2"],
        ["setTheMeter", "meter"],
        ["paintedTheBeat", "beatvalue"]
    ])("%s is proved by a connected %s block", (criterion, blockName) => {
        useBlocks(connected(blockName));

        expect(PracticeValidator.hasBadgeEvidence({}, criterion)).toBe(true);
    });

    test("the tempo badge accepts any of the beats per minute blocks", () => {
        useBlocks(connected("setbpm3"));

        expect(PracticeValidator.hasBadgeEvidence({}, "changedTempo")).toBe(true);
    });

    test("none of them are proved by an empty canvas", () => {
        useBlocks({});

        ["swungThePendulum", "changedTempo", "setTheMeter", "paintedTheBeat"].forEach(criterion => {
            expect(PracticeValidator.hasBadgeEvidence({}, criterion)).toBe(false);
        });
    });
});

// A piano key: a mouse with a name whose listen block answers a click.
const pianoKey = (id, keyName, eventBlock = "myclick") => ({
    [id]: { name: "start", trash: false, connections: [null, `${id}-name`, null] },
    [`${id}-name`]: {
        name: "setturtlename2",
        trash: false,
        connections: [id, `${id}-text`, `${id}-listen`]
    },
    [`${id}-text`]: { name: "text", value: keyName, trash: false, connections: [`${id}-name`] },
    [`${id}-listen`]: {
        name: "listen",
        trash: false,
        connections: [`${id}-name`, `${id}-event`, `${id}-do`, null]
    },
    [`${id}-event`]: { name: eventBlock, trash: false, connections: [`${id}-listen`] },
    [`${id}-do`]: { name: "text", value: keyName, trash: false, connections: [`${id}-listen`] }
});

const noteAction = (id, note, inner = "pitch") => ({
    [id]: { name: "action", trash: false, connections: [null, `${id}-label`, `${id}-body`, null] },
    [`${id}-label`]: { name: "text", value: note, trash: false, connections: [id] },
    [`${id}-body`]: { name: "hidden", trash: false, connections: [id, `${id}-note`] },
    [`${id}-note`]: {
        name: "newnote",
        trash: false,
        connections: [`${id}-body`, `${id}-div`, `${id}-v`, null]
    },
    [`${id}-div`]: { name: "divide", trash: false, connections: [`${id}-note`] },
    [`${id}-v`]: { name: "vspace", trash: false, connections: [`${id}-note`, `${id}-inner`] },
    [`${id}-inner`]: {
        name: inner,
        trash: false,
        connections: [`${id}-v`, `${id}-arg`, `${id}-oct`, null]
    },
    [`${id}-arg`]: { name: "solfege", value: note, trash: false, connections: [`${id}-inner`] },
    [`${id}-oct`]: { name: "number", value: 4, trash: false, connections: [`${id}-inner`] }
});

const piano = (keys, { event = "myclick", inner = "pitch" } = {}) => {
    const blocks = {};
    keys.forEach((keyName, index) => {
        Object.assign(blocks, pianoKey(`k${index}`, keyName, event));
        Object.assign(blocks, noteAction(`a${index}`, keyName, inner));
    });
    return blocks;
};

describe("PracticeValidator piano keys", () => {
    test("passes once two mice answer a click by playing a note", () => {
        useBlocks(piano(["sol", "mi"]));

        expect(PracticeValidator.validate({ expected: { pianoKeysWorkflow: true } })).toBe(true);
    });

    test("fails on the starter project, which has only one key", () => {
        useBlocks(piano(["sol"]));

        expect(PracticeValidator.validate({ expected: { pianoKeysWorkflow: true } })).toBe(false);
    });

    test("fails when nothing listens for a click", () => {
        useBlocks(piano(["sol", "mi"], { event: "keyboard" }));

        expect(PracticeValidator.validatePianoKeys()).toBe(false);
    });

    test("fails when the action makes no sound", () => {
        useBlocks(piano(["sol", "mi"], { inner: "forward" }));

        expect(PracticeValidator.validatePianoKeys()).toBe(false);
    });

    test("accepts a key that answers with a drum instead of a pitch", () => {
        useBlocks(piano(["sol", "mi"], { inner: "playdrum" }));

        expect(PracticeValidator.validatePianoKeys()).toBe(true);
    });

    test("ignores a listen block that has been thrown away", () => {
        const blocks = piano(["sol", "mi"]);
        blocks["k0-listen"].trash = true;
        blocks["k1-listen"].trash = true;
        useBlocks(blocks);

        expect(PracticeValidator.hasClickListener()).toBe(false);
    });
});

describe("PracticeValidator piano discoveries", () => {
    const connected = name => ({
        start: { name: "start", trash: false, connections: [null, "target", null] },
        target: { name, trash: false, connections: ["start", null, null] }
    });

    test.each([
        ["spacedTheKeys", "setxy"],
        ["spacedTheKeys", "setxyturtle"],
        ["namedTheKeys", "setturtlename2"],
        ["namedTheKeys", "turtlename"]
    ])("%s is proved by a connected %s block", (criterion, blockName) => {
        useBlocks(connected(blockName));

        expect(PracticeValidator.hasBadgeEvidence({}, criterion)).toBe(true);
    });

    test("the avatar and drum badges reuse the criteria earlier lessons already had", () => {
        useBlocks(connected("turtleshell"));
        expect(PracticeValidator.hasBadgeEvidence({}, "usedAvatarAnimation")).toBe(true);

        useBlocks(connected("playdrum"));
        expect(PracticeValidator.hasBadgeEvidence({}, "playedRingDrum")).toBe(true);
    });

    test("neither key badge is proved by an empty canvas", () => {
        useBlocks({});

        expect(PracticeValidator.hasBadgeEvidence({}, "spacedTheKeys")).toBe(false);
        expect(PracticeValidator.hasBadgeEvidence({}, "namedTheKeys")).toBe(false);
    });
});
