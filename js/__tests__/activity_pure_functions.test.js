/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Sugar Labs
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
 * Tests for pure utility functions in activity.js.
 * These functions are extracted and tested standalone.
 */

describe("Activity Pure Functions", () => {
    // isEqual: Shallow equality check between two objects
    function isEqual(obj1, obj2) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;
        for (const key of keys1) {
            if (!obj2.hasOwnProperty(key)) return false;
        }
        for (const key of keys1) {
            if (obj1[key] !== obj2[key]) return false;
        }
        return true;
    }

    // rectanglesOverlap: Checks if two rectangles overlap
    function rectanglesOverlap(rect1, rect2) {
        return (
            rect1.x + rect1.width > rect2.x &&
            rect1.x < rect2.x + rect2.width &&
            rect1.y + rect1.height > rect2.y &&
            rect1.y < rect2.y + rect2.height
        );
    }

    // getClosestStandardNoteValue: Finds closest standard note duration
    const standardDurations = [
        { value: "1/1", duration: 1 },
        { value: "1/2", duration: 0.5 },
        { value: "1/4", duration: 0.25 },
        { value: "1/8", duration: 0.125 },
        { value: "1/16", duration: 0.0625 },
        { value: "1/32", duration: 0.03125 },
        { value: "1/64", duration: 0.015625 },
        { value: "1/128", duration: 0.0078125 }
    ];

    function getClosestStandardNoteValue(duration) {
        let closest = standardDurations[0];
        let minDiff = Math.abs(duration - closest.duration);
        for (let i = 1; i < standardDurations.length; i++) {
            let diff = Math.abs(duration - standardDurations[i].duration);
            if (diff < minDiff) {
                closest = standardDurations[i];
                minDiff = diff;
            }
        }
        return closest.value.split("/").map(Number);
    }

    // _adjustPitch: Converts ABC pitch to MB pitch
    function _adjustPitch(note, keySignature) {
        const accidental = keySignature.accidentals.find(acc => {
            const noteToCompare = acc.note.toUpperCase().replace(",", "");
            note = note.replace(",", "");
            return noteToCompare.toLowerCase() === note.toLowerCase();
        });
        if (accidental) {
            return note + (accidental.acc === "sharp" ? "♯" : accidental.acc === "flat" ? "♭" : "");
        }
        return note;
    }

    // _abcToStandardValue: Converts ABC pitch value to octave
    function _abcToStandardValue(pitchValue) {
        return Math.floor(pitchValue / 7) + 4;
    }

    describe("isEqual", () => {
        it("returns true for identical objects", () => {
            expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
        });

        it("returns false for different keys", () => {
            expect(isEqual({ a: 1 }, { b: 1 })).toBe(false);
        });

        it("returns false for different values", () => {
            expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
        });

        it("returns false for different key counts", () => {
            expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
        });

        it("returns true for empty objects", () => {
            expect(isEqual({}, {})).toBe(true);
        });
    });

    describe("rectanglesOverlap", () => {
        it("returns true when rectangles overlap", () => {
            const rect1 = { x: 0, y: 0, width: 10, height: 10 };
            const rect2 = { x: 5, y: 5, width: 10, height: 10 };
            expect(rectanglesOverlap(rect1, rect2)).toBe(true);
        });

        it("returns false when rectangles are separate", () => {
            const rect1 = { x: 0, y: 0, width: 10, height: 10 };
            const rect2 = { x: 20, y: 20, width: 10, height: 10 };
            expect(rectanglesOverlap(rect1, rect2)).toBe(false);
        });

        it("returns false when rectangles only touch", () => {
            const rect1 = { x: 0, y: 0, width: 10, height: 10 };
            const rect2 = { x: 10, y: 0, width: 10, height: 10 };
            expect(rectanglesOverlap(rect1, rect2)).toBe(false);
        });

        it("returns true when one contains another", () => {
            const rect1 = { x: 0, y: 0, width: 100, height: 100 };
            const rect2 = { x: 25, y: 25, width: 50, height: 50 };
            expect(rectanglesOverlap(rect1, rect2)).toBe(true);
        });
    });

    describe("getClosestStandardNoteValue", () => {
        it("returns [1, 1] for whole note", () => {
            expect(getClosestStandardNoteValue(1)).toEqual([1, 1]);
        });

        it("returns [1, 4] for quarter note", () => {
            expect(getClosestStandardNoteValue(0.25)).toEqual([1, 4]);
        });

        it("returns [1, 8] for eighth note", () => {
            expect(getClosestStandardNoteValue(0.125)).toEqual([1, 8]);
        });

        it("returns closest for in-between values", () => {
            expect(getClosestStandardNoteValue(0.2)).toEqual([1, 4]);
        });

        it("returns [1, 128] for very small durations", () => {
            expect(getClosestStandardNoteValue(0.001)).toEqual([1, 128]);
        });
    });

    describe("_adjustPitch", () => {
        it("adds sharp symbol", () => {
            const key = { accidentals: [{ note: "F", acc: "sharp" }] };
            expect(_adjustPitch("F", key)).toBe("F♯");
        });

        it("adds flat symbol", () => {
            const key = { accidentals: [{ note: "B", acc: "flat" }] };
            expect(_adjustPitch("B", key)).toBe("B♭");
        });

        it("returns unchanged when no accidental", () => {
            const key = { accidentals: [{ note: "F", acc: "sharp" }] };
            expect(_adjustPitch("C", key)).toBe("C");
        });

        it("handles empty accidentals", () => {
            const key = { accidentals: [] };
            expect(_adjustPitch("G", key)).toBe("G");
        });
    });

    describe("_abcToStandardValue", () => {
        it("returns octave 4 for pitch 0", () => {
            expect(_abcToStandardValue(0)).toBe(4);
        });

        it("returns octave 5 for pitch 7", () => {
            expect(_abcToStandardValue(7)).toBe(5);
        });

        it("returns octave 3 for negative pitch", () => {
            expect(_abcToStandardValue(-1)).toBe(3);
        });

        it("returns octave 6 for pitch 14", () => {
            expect(_abcToStandardValue(14)).toBe(6);
        });
    });
});
