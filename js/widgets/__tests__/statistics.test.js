/**
 * MusicBlocks v3.6.2
 *
 * @author Codex
 *
 * @copyright 2026
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const StatsWindow = require("../statistics.js");

describe("StatsWindow.displayInfo", () => {
    let statsWindow;

    beforeEach(() => {
        statsWindow = Object.create(StatsWindow.prototype);
        statsWindow.jsonObject = { innerHTML: "" };
    });

    test("renders project statistics into list items", () => {
        statsWindow.displayInfo({
            duples: 2,
            triplets: 3,
            quintuplets: 1,
            pitchNames: new Set(["C4", "E4", "G4"]),
            numberOfNotes: 16,
            lowestNote: ["C4", null, 261.1],
            highestNote: ["C6", null, 1046.2],
            rests: 4,
            ornaments: 5
        });

        expect(statsWindow.jsonObject.innerHTML).toContain("<li>duples: 2</li>");
        expect(statsWindow.jsonObject.innerHTML).toContain("<li>triplets: 3</li>");
        expect(statsWindow.jsonObject.innerHTML).toContain("<li>quintuplets: 1</li>");
        expect(statsWindow.jsonObject.innerHTML).toContain("pitch names: C4, E4, G4");
        expect(statsWindow.jsonObject.innerHTML).toContain("<li>number of notes: 16</li>");
        expect(statsWindow.jsonObject.innerHTML).toContain("lowest note: C4,262Hz");
        expect(statsWindow.jsonObject.innerHTML).toContain("highest note: C6,1047Hz");
        expect(statsWindow.jsonObject.innerHTML).toContain("<li>rests used: 4</li>");
        expect(statsWindow.jsonObject.innerHTML).toContain("<li>ornaments used: 5</li>");
    });

    test("replaces previous content on subsequent renders", () => {
        statsWindow.jsonObject.innerHTML = "<li>old value</li>";

        statsWindow.displayInfo({
            duples: 0,
            triplets: 0,
            quintuplets: 0,
            pitchNames: [],
            numberOfNotes: 0,
            lowestNote: ["A3", null, 220],
            highestNote: ["A4", null, 440],
            rests: 0,
            ornaments: 0
        });

        expect(statsWindow.jsonObject.innerHTML).not.toContain("old value");
        expect(statsWindow.jsonObject.innerHTML).toContain("pitch names: ");
        expect(statsWindow.jsonObject.innerHTML).toContain("lowest note: A3,221Hz");
        expect(statsWindow.jsonObject.innerHTML).toContain("highest note: A4,441Hz");
    });
});
