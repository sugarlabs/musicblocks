// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.

// Mock global dependencies that Publisher.js expects in the browser
global._ = s => s; // i18n gettext stub
global.jQuery = global.$ = jest.fn(); // jQuery stub
global.Materialize = {}; // Materialize stub
global.document = global.document || {}; // ensure document exists

const Publisher = require("../Publisher");

describe("Publisher", () => {
    let mockPlanet;
    let publisher;

    beforeEach(() => {
        mockPlanet = {
            LocalPlanet: {
                ProjectTable: {}
            },
            analyzeProject: jest.fn(() => [false, true, true, true, true, true, false, false, true])
        };

        publisher = new Publisher(mockPlanet);
    });

    describe("dataToTags", () => {
        it("returns expected auto-tags for analyzable project data", () => {
            const projectData = JSON.stringify([
                [0, "start", 0, 0, [null]],
                [1, ["note", { value: 1 }], 0, 0, [0]]
            ]);

            const tags = publisher.dataToTags(projectData);

            expect(tags).toEqual(["2", "3", "5", "4"]);
            expect(mockPlanet.analyzeProject).toHaveBeenCalledTimes(1);
        });

        it("returns empty tags when project JSON is malformed", () => {
            const malformedData = "{not valid json";

            const tags = publisher.dataToTags(malformedData);

            expect(tags).toEqual([]);
            expect(mockPlanet.analyzeProject).not.toHaveBeenCalled();
        });

        it("returns empty tags when parsed project data is not an array", () => {
            const invalidShapeData = JSON.stringify({ blocks: [] });

            const tags = publisher.dataToTags(invalidShapeData);

            expect(tags).toEqual([]);
            expect(mockPlanet.analyzeProject).not.toHaveBeenCalled();
        });

        it("returns empty tags when project analysis throws", () => {
            mockPlanet.analyzeProject.mockImplementation(() => {
                throw new Error("analysis unavailable");
            });

            const projectData = JSON.stringify([[0, "start", 0, 0, [null]]]);

            const tags = publisher.dataToTags(projectData);

            expect(tags).toEqual([]);
        });
    });
});
