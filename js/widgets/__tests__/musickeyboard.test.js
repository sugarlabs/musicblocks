/**
 * MusicBlocks v3.6.2
 *
 * @author Lakshay
 *
 * @copyright 2026 Lakshay
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

// --- Global Mocks (must be set before require) ---
global._ = msg => msg;
global.last = arr => arr[arr.length - 1];
global.platformColor = {
    labelColor: "#90c100",
    selectorBackground: "#f0f0f0",
    selectorBackgroundHOVER: "#e0e0e0"
};
global.FIXEDSOLFEGE = ["do", "re", "mi", "fa", "sol", "la", "ti"];
global.FIXEDSOLFEGE1 = [
    "do",
    "do#",
    "re",
    "re#",
    "mi",
    "fa",
    "fa#",
    "sol",
    "sol#",
    "la",
    "la#",
    "ti"
];
global.SHARP = "♯";
global.FLAT = "♭";
global.EIGHTHNOTEWIDTH = 24;
global.MATRIXSOLFEHEIGHT = 30;
global.MATRIXSOLFEWIDTH = 80;
global.PITCHES = ["C", "D", "E", "F", "G", "A", "B"];
global.PITCHES2 = ["C", "D", "E", "F", "G", "A", "B"];
global.PITCHES3 = ["C", "D", "E", "F", "G", "A", "B"];
global.SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];
global.SOLFEGECONVERSIONTABLE = {};
global.NOTESSHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
global.NOTESFLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
global.DEFAULTVOICE = "electronic synth";
global.PREVIEWVOLUME = 50;
global.convertFromSolfege = jest.fn(n => n);
global.noteToFrequency = jest.fn(() => 440);
global.toFraction = jest.fn(n => [1, n]);
global.getNote = jest.fn(() => ["C", "", 4]);
global.i18nSolfege = jest.fn(s => s);
global.Singer = { RhythmActions: { getNoteValue: jest.fn(() => 0.25) } };

global.docById = jest.fn(() => ({
    style: {},
    innerHTML: "",
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    setAttribute: jest.fn(),
    insertRow: jest.fn(() => ({
        insertCell: jest.fn(() => ({
            style: {},
            innerHTML: "",
            appendChild: jest.fn()
        }))
    }))
}));

global.wheelnav = jest.fn();
global.slicePath = jest.fn();

global.window = {
    innerWidth: 1200,
    widgetWindows: {
        windowFor: jest.fn().mockReturnValue({
            clear: jest.fn(),
            show: jest.fn(),
            addButton: jest.fn().mockReturnValue({ onclick: null }),
            addInputButton: jest.fn().mockReturnValue({
                value: "",
                addEventListener: jest.fn()
            }),
            getWidgetBody: jest.fn().mockReturnValue({
                appendChild: jest.fn(),
                append: jest.fn(),
                style: {},
                innerHTML: ""
            }),
            sendToCenter: jest.fn(),
            updateTitle: jest.fn(),
            onclose: null,
            onmaximize: null,
            destroy: jest.fn()
        })
    }
};

global.document = {
    createElement: jest.fn(() => ({
        style: {},
        innerHTML: "",
        appendChild: jest.fn(),
        append: jest.fn(),
        setAttribute: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        insertRow: jest.fn(() => ({
            insertCell: jest.fn(() => ({
                style: {},
                innerHTML: "",
                appendChild: jest.fn()
            }))
        }))
    })),
    getElementById: jest.fn(() => ({
        style: {},
        innerHTML: ""
    })),
    onkeydown: null,
    onkeyup: null
};

global.localStorage = { beginnerMode: "false" };

const MusicKeyboard = require("../musickeyboard.js");

describe("MusicKeyboard Widget", () => {
    let keyboard;
    let mockActivity;

    beforeEach(() => {
        mockActivity = {
            logo: {
                synth: {
                    loadSynth: jest.fn(),
                    trigger: jest.fn(),
                    stopSound: jest.fn()
                },
                turtleDelay: 0,
                blocks: {
                    blockList: {}
                }
            },
            blocks: {
                blockList: {},
                loadNewBlocks: jest.fn()
            },
            turtles: {
                ithTurtle: jest.fn(() => ({
                    singer: {
                        keySignature: "C major"
                    }
                }))
            },
            refreshCanvas: jest.fn(),
            saveLocally: jest.fn(),
            textMsg: jest.fn(),
            errorMsg: jest.fn(),
            hideMsgs: jest.fn(),
            beginnerMode: false
        };

        keyboard = new MusicKeyboard(mockActivity);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        test("should store activity reference", () => {
            expect(keyboard.activity).toBe(mockActivity);
        });

        test("should initialize _stopOrCloseClicked to false", () => {
            expect(keyboard._stopOrCloseClicked).toBe(false);
        });

        test("should initialize playingNow to false", () => {
            expect(keyboard.playingNow).toBe(false);
        });

        test("should initialize empty instruments array", () => {
            expect(keyboard.instruments).toEqual([]);
        });

        test("should initialize empty noteNames array", () => {
            expect(keyboard.noteNames).toEqual([]);
        });

        test("should initialize empty octaves array", () => {
            expect(keyboard.octaves).toEqual([]);
        });

        test("should initialize keyboardShown to true", () => {
            expect(keyboard.keyboardShown).toBe(true);
        });

        test("should initialize empty layout", () => {
            expect(keyboard.layout).toEqual([]);
        });

        test("should initialize empty idContainer", () => {
            expect(keyboard.idContainer).toEqual([]);
        });

        test("should initialize tick to false", () => {
            expect(keyboard.tick).toBe(false);
        });

        test("should initialize metronomeInterval to false", () => {
            expect(keyboard.metronomeInterval).toBe(false);
        });

        test("should initialize meterArgs", () => {
            expect(keyboard.meterArgs).toEqual([4, 0.25]);
        });

        test("should initialize empty noteMapper and blockNumberMapper", () => {
            expect(keyboard.noteMapper).toEqual({});
            expect(keyboard.blockNumberMapper).toEqual({});
        });
    });

    describe("data management", () => {
        test("should store instruments", () => {
            keyboard.instruments.push("piano");
            keyboard.instruments.push("violin");
            expect(keyboard.instruments).toEqual(["piano", "violin"]);
        });

        test("should store noteNames", () => {
            keyboard.noteNames.push("C");
            keyboard.noteNames.push("D");
            keyboard.noteNames.push("E");
            expect(keyboard.noteNames).toHaveLength(3);
        });

        test("should store octaves", () => {
            keyboard.octaves.push(4);
            keyboard.octaves.push(4);
            keyboard.octaves.push(5);
            expect(keyboard.octaves).toEqual([4, 4, 5]);
        });

        test("should store layout data", () => {
            keyboard.layout.push({ noteName: "C", octave: 4 });
            keyboard.layout.push({ noteName: "D", octave: 4 });
            expect(keyboard.layout).toHaveLength(2);
        });
    });

    describe("state management", () => {
        test("should toggle playingNow", () => {
            expect(keyboard.playingNow).toBe(false);
            keyboard.playingNow = true;
            expect(keyboard.playingNow).toBe(true);
        });

        test("should toggle keyboardShown", () => {
            expect(keyboard.keyboardShown).toBe(true);
            keyboard.keyboardShown = false;
            expect(keyboard.keyboardShown).toBe(false);
        });

        test("should toggle _stopOrCloseClicked", () => {
            expect(keyboard._stopOrCloseClicked).toBe(false);
            keyboard._stopOrCloseClicked = true;
            expect(keyboard._stopOrCloseClicked).toBe(true);
        });

        test("should toggle tick", () => {
            expect(keyboard.tick).toBe(false);
            keyboard.tick = true;
            expect(keyboard.tick).toBe(true);
        });
    });
});
