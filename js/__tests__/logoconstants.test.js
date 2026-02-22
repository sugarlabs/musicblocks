/**
 * @license
 * MusicBlocks v3.4.1
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
global._ = jest.fn(s => s);

const constants = require("../logoconstants");

describe("logoconstants", () => {
    test("module loads and exports an object", () => {
        expect(constants).toBeDefined();
        expect(typeof constants).toBe("object");
    });

    test("numeric defaults have correct values", () => {
        expect(constants.DEFAULTVOLUME).toBe(50);
        expect(constants.PREVIEWVOLUME).toBe(80);
        expect(constants.DEFAULTDELAY).toBe(500);
        expect(constants.OSCVOLUMEADJUSTMENT).toBe(1.5);
        expect(constants.TONEBPM).toBe(240);
        expect(constants.TARGETBPM).toBe(90);
        expect(constants.TURTLESTEP).toBe(-1);
        expect(constants.NOTEDIV).toBe(8);
    });

    test("error message strings are non-empty strings", () => {
        const msgKeys = [
            "NOMICERRORMSG",
            "NANERRORMSG",
            "NOSTRINGERRORMSG",
            "NOBOXERRORMSG",
            "NOACTIONERRORMSG",
            "NOINPUTERRORMSG",
            "NOSQRTERRORMSG",
            "ZERODIVIDEERRORMSG",
            "EMPTYHEAPERRORMSG",
            "POSNUMBER"
        ];
        for (const key of msgKeys) {
            expect(typeof constants[key]).toBe("string");
            expect(constants[key].length).toBeGreaterThan(0);
        }
    });

    test("INVALIDPITCH has the expected translation string", () => {
        expect(typeof constants.INVALIDPITCH).toBe("string");
        expect(constants.INVALIDPITCH).toBe("Not a valid pitch name");
    });

    test("notation index constants are sequential integers starting at 0", () => {
        expect(constants.NOTATIONNOTE).toBe(0);
        expect(constants.NOTATIONDURATION).toBe(1);
        expect(constants.NOTATIONDOTCOUNT).toBe(2);
        expect(constants.NOTATIONTUPLETVALUE).toBe(3);
        expect(constants.NOTATIONROUNDDOWN).toBe(4);
        expect(constants.NOTATIONINSIDECHORD).toBe(5);
        expect(constants.NOTATIONSTACCATO).toBe(6);
    });

    test("exports exactly the expected set of keys", () => {
        const expectedKeys = [
            "DEFAULTVOLUME",
            "PREVIEWVOLUME",
            "DEFAULTDELAY",
            "OSCVOLUMEADJUSTMENT",
            "TONEBPM",
            "TARGETBPM",
            "TURTLESTEP",
            "NOTEDIV",
            "NOMICERRORMSG",
            "NANERRORMSG",
            "NOSTRINGERRORMSG",
            "NOBOXERRORMSG",
            "NOACTIONERRORMSG",
            "NOINPUTERRORMSG",
            "NOSQRTERRORMSG",
            "ZERODIVIDEERRORMSG",
            "EMPTYHEAPERRORMSG",
            "POSNUMBER",
            "INVALIDPITCH",
            "NOTATIONNOTE",
            "NOTATIONDURATION",
            "NOTATIONDOTCOUNT",
            "NOTATIONTUPLETVALUE",
            "NOTATIONROUNDDOWN",
            "NOTATIONINSIDECHORD",
            "NOTATIONSTACCATO"
        ];
        expect(Object.keys(constants).sort()).toEqual(expectedKeys.sort());
    });

    test("does not pollute the global scope", () => {
        expect(global.DEFAULTVOLUME).toBeUndefined();
        expect(global.TONEBPM).toBeUndefined();
        expect(global.NOTATIONNOTE).toBeUndefined();
    });
});
