// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const constants = require("../block-constants");

describe("block-constants", () => {
    it("exports the expected block constants", () => {
        expect(constants.MINIMUMDOCKDISTANCE).toBe(400);
        expect(constants.LONGSTACK).toBe(300);
        expect(constants.CAMERAVALUE).toBe("##__CAMERA__##");
        expect(constants.VIDEOVALUE).toBe("##__VIDEO__##");
        expect(constants.NOTEBLOCKS).toEqual(["newnote", "osctime"]);
        expect(constants.PITCHBLOCKS).toEqual([
            "pitch",
            "steppitch",
            "hertz",
            "pitchnumber",
            "nthmodalpitch",
            "playdrum"
        ]);
    });

    it("exports docking compatibility through ALLOWED_CONNECTIONS", () => {
        expect(constants.ALLOWED_CONNECTIONS).toBeInstanceOf(Set);
        expect(constants.ALLOWED_CONNECTIONS.has("numberin:numberout")).toBe(true);
        expect(constants.ALLOWED_CONNECTIONS.has("numberout:numberin")).toBe(true);
        expect(constants.ALLOWED_CONNECTIONS.has("booleanout:numberout")).toBe(false);
    });

    it("does not pollute the Node global scope", () => {
        expect(global.MINIMUMDOCKDISTANCE).toBeUndefined();
        expect(global.ALLOWED_CONNECTIONS).toBeUndefined();
        expect(global.NOTEBLOCKS).toBeUndefined();
    });
});
