/**
 * @license
 * Music Blocks v3.0.0
 * Copyright (C) 2026 Walter Bender
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
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
