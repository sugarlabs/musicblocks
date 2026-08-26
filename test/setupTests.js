/**
 * MusicBlocks v3.4.1
 *
 * @author Music Blocks Contributors
 *
 * @copyright 2026 Music Blocks Contributors
 *
 * @license
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

afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

// Set up i18n function before loading musicutils
global._ = x => x;

// Set up TextEncoder for Node.js environment
if (typeof global.TextEncoder === "undefined") {
    const { TextEncoder } = require("util");
    global.TextEncoder = TextEncoder;
}

if (typeof global.window === "undefined") {
    global.window = {};
}
if (typeof global.window.btoa === "undefined") {
    global.window.btoa = str => Buffer.from(String(str), "binary").toString("base64");
}

// Set up globals needed by musicutils.js
global.INVALIDPITCH = "Not a valid pitch name";
global.EDOBOUNDEXCEEDED = "Pitch index exceeds EDO range";

// Load centralized music constants for all tests
const {
    SHARP,
    FLAT,
    NATURAL,
    DOUBLESHARP,
    DOUBLEFLAT,
    NOTENAMES,
    NOTENAMES1,
    SOLFEGENAMES,
    SOLFEGENAMES1,
    SOLFNOTES,
    ALLNOTENAMES,
    NOTESTEP,
    ALLNOTESTEP,
    NOTESFLAT,
    NOTESSHARP,
    SEMITONETOINTERVALMAP,
    SEMITONES,
    PITCHES,
    PITCHES1,
    PITCHES3,
    SCALENOTES,
    EQUIVALENTACCIDENTALS,
    INTERVALVALUES,
    FIXEDSOLFEGE,
    FIXEDSOLFEGE1,
    CENTSSYMBOL,
    MUSICALMODES
} = require("../js/utils/musicutils.js");

// Set commonly used constants as globals for backward compatibility with tests
global.SHARP = SHARP;
global.FLAT = FLAT;
global.NATURAL = NATURAL;
global.DOUBLESHARP = DOUBLESHARP;
global.DOUBLEFLAT = DOUBLEFLAT;
global.NOTENAMES = NOTENAMES;
global.NOTENAMES1 = NOTENAMES1;
global.SOLFEGENAMES = SOLFEGENAMES;
global.SOLFEGENAMES1 = SOLFEGENAMES1;
global.SOLFNOTES = SOLFNOTES;
global.ALLNOTENAMES = ALLNOTENAMES;
global.NOTESTEP = NOTESTEP;
global.ALLNOTESTEP = ALLNOTESTEP;
global.NOTESFLAT = NOTESFLAT;
global.NOTESSHARP = NOTESSHARP;
global.SEMITONETOINTERVALMAP = SEMITONETOINTERVALMAP;
global.SEMITONES = SEMITONES;
global.PITCHES = PITCHES;
global.PITCHES1 = PITCHES1;
global.PITCHES3 = PITCHES3;
global.SCALENOTES = SCALENOTES;
global.EQUIVALENTACCIDENTALS = EQUIVALENTACCIDENTALS;
global.INTERVALVALUES = INTERVALVALUES;
global.FIXEDSOLFEGE = FIXEDSOLFEGE;
global.FIXEDSOLFEGE1 = FIXEDSOLFEGE1;
global.CENTSSYMBOL = CENTSSYMBOL;
global.MUSICALMODES = MUSICALMODES;

// Provide ErrorHandler global for tests
global.ErrorHandler = {
    capture: jest.fn(),
    warn: jest.fn(),
    recoverable: jest.fn(),
    userFacing: jest.fn()
};

// Mock HTMLCanvasElement.getContext to suppress jsdom warnings

const mockContext = {
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    closePath: jest.fn(),
    ellipse: jest.fn(),
    arc: jest.fn(),
    drawImage: jest.fn(),
    measureText: jest.fn(() => ({
        width: 0,
        actualBoundingBoxAscent: 0,
        actualBoundingBoxDescent: 0
    })),
    scale: jest.fn(),
    setTransform: jest.fn(),
    save: jest.fn(),
    restore: jest.fn()
};

if (typeof HTMLCanvasElement !== "undefined") {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
        configurable: true,
        writable: true,
        value: jest.fn(type => {
            // Return null for non-2d contexts
            if (type !== "2d") return null;

            return mockContext;
        })
    });
}

// Minimal globals (ONLY safe defaults)
global.requestAnimationFrame = cb => setTimeout(cb, 0);
