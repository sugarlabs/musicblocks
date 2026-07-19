// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

const constants = require("../block-constants");

describe("block-constants", () => {
    test("module loads and exports an object", () => {
        expect(constants).toBeDefined();
        expect(typeof constants).toBe("object");
    });

    test("constants have correct values", () => {
        expect(constants.MINIMUMDOCKDISTANCE).toBe(400);
        expect(constants.LONGSTACK).toBe(300);
        expect(constants.SPATIAL_GRID_CELL_SIZE).toBe(50);
        expect(constants.CAMERAVALUE).toBe("##__CAMERA__##");
        expect(constants.VIDEOVALUE).toBe("##__VIDEO__##");
    });

    test("exports exactly the expected set of keys", () => {
        const expectedKeys = [
            "MINIMUMDOCKDISTANCE",
            "LONGSTACK",
            "SPATIAL_GRID_CELL_SIZE",
            "CAMERAVALUE",
            "VIDEOVALUE"
        ];
        expect(Object.keys(constants).sort()).toEqual(expectedKeys.sort());
    });

    test("does not pollute the global scope", () => {
        expect(global.MINIMUMDOCKDISTANCE).toBeUndefined();
        expect(global.LONGSTACK).toBeUndefined();
        expect(global.SPATIAL_GRID_CELL_SIZE).toBeUndefined();
    });
});
