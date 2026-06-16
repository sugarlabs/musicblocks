/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Nirav Sharma
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

global._ = jest.fn(str => str);
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

const {
    getCurrentEDO,
    TEMPERAMENT,
    frequencyToPitch,
    pitchToFrequency,
    pitchToNumber
} = require("../utils/musicutils");

describe("getCurrentEDO", () => {
    it("should return 12 for standard equal temperament", () => {
        expect(getCurrentEDO("equal")).toBe(12);
    });

    it("should return 19 for equal19 temperament", () => {
        expect(getCurrentEDO("equal19")).toBe(19);
    });

    it("should return the correct pitchNumber for just intonation", () => {
        const just = TEMPERAMENT["just intonation"];
        if (just && just.pitchNumber) {
            expect(getCurrentEDO("just intonation")).toBe(just.pitchNumber);
        }
    });

    it("should return 12 when temperament is undefined", () => {
        expect(getCurrentEDO(undefined)).toBe(12);
    });

    it("should return 12 when temperament is null", () => {
        expect(getCurrentEDO(null)).toBe(12);
    });

    it("should return 12 for a nonexistent temperament", () => {
        expect(getCurrentEDO("nonexistent")).toBe(12);
    });

    it("should return 12 for an empty string", () => {
        expect(getCurrentEDO("")).toBe(12);
    });
});

describe("frequencyToPitch", () => {
    it("should return A4 for 440 Hz in 12-EDO", () => {
        const result = frequencyToPitch(440, "equal");
        expect(result[0]).toBe("A");
        expect(result[1]).toBe(4);
    });

    it("should return C4 for 261.63 Hz in 12-EDO", () => {
        const result = frequencyToPitch(261.63, "equal");
        expect(result[0]).toBe("C");
        expect(result[1]).toBe(4);
    });

    it("should accept temperament param for 19-EDO without crashing", () => {
        const result = frequencyToPitch(440, "equal19");
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(3);
    });

    it("should default to 12-EDO when no temperament given", () => {
        const result = frequencyToPitch(440);
        expect(result[0]).toBe("A");
        expect(result[1]).toBe(4);
    });

    it("should handle sub-A0 frequencies", () => {
        const result = frequencyToPitch(20, "equal");
        expect(result[0]).toBe("A");
        expect(result[1]).toBe(0);
    });

    it("should handle above-C10 frequencies", () => {
        const result = frequencyToPitch(20000, "equal");
        expect(result[0]).toBe("C");
        expect(result[1]).toBe(10);
    });
});

describe("pitchToNumber", () => {
    it("should return 39 for C4 in 12-EDO", () => {
        expect(pitchToNumber("C", 4, null, "equal")).toBe(39);
    });

    it("should return 67 for C4 in 19-EDO", () => {
        expect(pitchToNumber("C", 4, null, "equal19")).toBe(67);
    });

    it("should default to 12-EDO when no temperament given", () => {
        expect(pitchToNumber("C", 4, null)).toBe(39);
    });

    it("should return 48 for A4 in 12-EDO", () => {
        expect(pitchToNumber("A", 4, null, "equal")).toBe(48);
    });

    it("should return 76 for A4 in 19-EDO", () => {
        expect(pitchToNumber("A", 4, null, "equal19")).toBe(76);
    });
});

describe("pitchToFrequency", () => {
    it("should return ~440 Hz for A4 in 12-EDO", () => {
        const result = pitchToFrequency("A", 4, 0, null, "equal");
        expect(result).toBeCloseTo(440, 0);
    });

    it("should return ~440 Hz for A4 in 19-EDO", () => {
        const result = pitchToFrequency("A", 4, 0, null, "equal19");
        expect(result).toBeCloseTo(440, 0);
    });

    it("should return ~261.63 Hz for C4 in 12-EDO", () => {
        const result = pitchToFrequency("C", 4, 0, null, "equal");
        expect(result).toBeCloseTo(261.63, 0);
    });

    it("should return a different frequency for C4 in 19-EDO vs 12-EDO", () => {
        const freq12 = pitchToFrequency("C", 4, 0, null, "equal");
        const freq19 = pitchToFrequency("C", 4, 0, null, "equal19");
        expect(freq19).not.toBeCloseTo(freq12, 0);
    });

    it("should default to 12-EDO when no temperament given", () => {
        expect(pitchToFrequency("A", 4, 0, null)).toBeCloseTo(440, 0);
    });
});
