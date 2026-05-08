/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Shivang Kumar Dubey
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

"use strict";

const { extractNotes, compareAssignment } = require("../assignmentChecker");

// ABCJS is a browser library — mock parseOnly for Node/Jest
global.ABCJS = {
    parseOnly: jest.fn()
};

const makeTune = pitches => ({
    lines: [
        {
            staff: [
                {
                    voices: [
                        [
                            ...pitches.map(p => ({
                                el_type: "note",
                                pitches: [{ pitch: p }],
                                duration: 0.25
                            }))
                        ]
                    ]
                }
            ]
        }
    ]
});

describe("extractNotes", () => {
    it("returns pitch integers from a tune", () => {
        expect(extractNotes(makeTune([0, 1, 2]))).toEqual([0, 1, 2]);
    });

    it("returns empty array for tune with no notes", () => {
        const tune = { lines: [{ staff: [{ voices: [[{ el_type: "bar" }]] }] }] };
        expect(extractNotes(tune)).toEqual([]);
    });

    it("skips elements without pitches array", () => {
        const tune = {
            lines: [
                {
                    staff: [
                        {
                            voices: [
                                [
                                    { el_type: "note", pitches: [] },
                                    { el_type: "note", pitches: [{ pitch: 3 }] }
                                ]
                            ]
                        }
                    ]
                }
            ]
        };
        expect(extractNotes(tune)).toEqual([3]);
    });

    it("handles empty lines", () => {
        expect(extractNotes({ lines: [] })).toEqual([]);
    });
});

describe("compareAssignment", () => {
    beforeEach(() => {
        global.ABCJS.parseOnly.mockReset();
    });

    it("returns 100 when all notes match", () => {
        global.ABCJS.parseOnly
            .mockReturnValueOnce([makeTune([0, 1, 2])])
            .mockReturnValueOnce([makeTune([0, 1, 2])]);
        expect(compareAssignment("target", "student")).toEqual({
            score: 100,
            matched: 3,
            total: 3
        });
    });

    it("returns 0 when no notes match", () => {
        global.ABCJS.parseOnly
            .mockReturnValueOnce([makeTune([0, 1, 2])])
            .mockReturnValueOnce([makeTune([5, 6, 7])]);
        const result = compareAssignment("target", "student");
        expect(result.score).toBe(0);
        expect(result.matched).toBe(0);
    });

    it("scores partial matches correctly", () => {
        global.ABCJS.parseOnly
            .mockReturnValueOnce([makeTune([0, 1, 2, 3])])
            .mockReturnValueOnce([makeTune([0, 1, 5, 6])]);
        const result = compareAssignment("target", "student");
        expect(result.matched).toBe(2);
        expect(result.total).toBe(4);
        expect(result.score).toBe(50);
    });

    it("handles student with more notes than target", () => {
        global.ABCJS.parseOnly
            .mockReturnValueOnce([makeTune([0, 1])])
            .mockReturnValueOnce([makeTune([0, 1, 2, 3])]);
        const result = compareAssignment("target", "student");
        expect(result.total).toBe(2);
        expect(result.score).toBe(100);
    });

    it("returns zero score when target is empty", () => {
        global.ABCJS.parseOnly
            .mockReturnValueOnce([makeTune([])])
            .mockReturnValueOnce([makeTune([0, 1])]);
        expect(compareAssignment("target", "student")).toEqual({ score: 0, matched: 0, total: 0 });
    });

    it("returns zero score when parseOnly returns empty array", () => {
        global.ABCJS.parseOnly.mockReturnValue([]);
        expect(compareAssignment("target", "student")).toEqual({ score: 0, matched: 0, total: 0 });
    });
});
