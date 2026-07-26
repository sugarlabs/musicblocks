// Set up i18n function before loading musicutils
global._ = x => x;

// Set up TextEncoder for Node.js environment
if (typeof global.TextEncoder === "undefined") {
    const { TextEncoder } = require("util");
    global.TextEncoder = TextEncoder;
}

// Set up globals needed by musicutils.js
global.INVALIDPITCH = "Not a valid pitch name";

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
} = require("./js/utils/musicutils.js");

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

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    writable: true,
    value: jest.fn(type => {
        // Return null for non-2d contexts
        if (type !== "2d") return null;

        return mockContext;
    })
});
