/**
 * @license
 * MusicBlocks v3.6.2
 * Copyright (C) 2025 Anubhab
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Mock setup that runs BEFORE IntervalsActions is loaded
global._ = x => x;
global.NOINPUTERRORMSG = "NOINPUT";
global.window = {};
global.TEMPERAMENT = {
    equal: {
        "pitchNumber": 12,
        "perfect 1": 1,
        "major 2": 1.122462,
        "perfect 8": 2
    },
    custom31: {
        "pitchNumber": 31,
        "perfect 1": 1,
        "perfect 8": 2
    },
    custom: {
        "pitchNumber": 31,
        "perfect 1": 1,
        "perfect 8": 2
    }
};

global.PreDefinedTemperaments = {
    equal: true,
    major: true,
    minor: true,
    harmonicminor: true,
    ionian: true,
    dorian: true,
    phrygian: true,
    lydian: true,
    mixolydian: true,
    aeolian: true,
    blues: true,
    chromatic: true,
    whole: true,
    pentatonic: true,
    pythagorean: true,
    just: true,
    quarter: true,
    "31-EDO": true,
    "19-EDO": true,
    "5-EDO": true,
    "7-EDO": true,
    custom31: false,
    custom: false
};

global.isCustomTemperament = (temperament) => {
    return !global.PreDefinedTemperaments[temperament];
};

global.getTemperament = (entry) => {
    return global.TEMPERAMENT[entry];
};

global.MUSICALMODES = {
    major: [2, 2, 1, 2, 2, 2, 1],
    minor: [2, 1, 2, 2, 1, 2, 2]
};

global.ALLNOTESTEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
global.NOTENAMES = ["C", "D", "E", "F", "G", "A", "B"];

global.SEMITONETOINTERVALMAP = Array(13)
    .fill(null)
    .map(() => Array(7).fill("perfect"));

global.GetNotesForInterval = jest.fn(() => ({
    firstNote: "C",
    secondNote: "G",
    octave: 0
}));

global.getNote = jest.fn(() => ["C"]);
global.getModeLength = jest.fn(() => 7);

global.MusicBlocks = { isRun: false };
global.Mouse = { getMouseFromTurtle: jest.fn() };
global.Singer = {};
