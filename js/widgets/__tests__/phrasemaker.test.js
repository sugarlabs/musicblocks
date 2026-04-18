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

const PhraseMaker = require("../phrasemaker.js");

// --- Global Mocks ---
global._ = msg => msg;
global.last = arr => arr[arr.length - 1];
global.LCD = (a, b) => (a * b) / gcd(a, b);
function gcd(a, b) {
    return b === 0 ? a : gcd(b, a % b);
}
global.DEFAULTVOICE = "electronic synth";
global.DEFAULTDRUM = "kick drum";
global.DEFAULTVOLUME = 50;
global.PREVIEWVOLUME = 50;
global.SHARP = "♯";
global.FLAT = "♭";
global.MATRIXSOLFEHEIGHT = 30;
global.MATRIXSOLFEWIDTH = 80;
global.EIGHTHNOTEWIDTH = 24;
global.DRUMS = [];
global.NOTESYMBOLS = {};
global.SOLFEGECONVERSIONTABLE = {};
global.platformColor = {
    labelColor: "#90c100",
    selectorBackground: "#f0f0f0",
    selectorBackgroundHOVER: "#e0e0e0",
    paletteColors: {}
};

global.toFraction = jest.fn(n => [1, n]);
global.getDrumName = jest.fn(() => null);
global.getDrumIcon = jest.fn(() => "");
global.getDrumSynthName = jest.fn(() => "kick");
global.noteIsSolfege = jest.fn(() => false);
global.isCustomTemperament = jest.fn(() => false);
global.i18nSolfege = jest.fn(s => s);
global.getNote = jest.fn(() => ["C", "", 4]);
global.noteToFrequency = jest.fn(() => 440);
global.calcNoteValueToDisplay = jest.fn(() => ["1/4", "♩"]);
global.delayExecution = jest.fn(ms => new Promise(r => setTimeout(r, ms)));
global.getTemperament = jest.fn(() => ({ pitchNumber: 12 }));
global.docBySelector = jest.fn(() => []);
global.Singer = { RhythmActions: { getNoteValue: jest.fn(() => 0.25) } };

global.docById = jest.fn(() => ({
    style: {},
    innerHTML: "",
    insertRow: jest.fn(() => ({
        insertCell: jest.fn(() => ({
            style: {},
            appendChild: jest.fn(),
            setAttribute: jest.fn(),
            addEventListener: jest.fn(),
            innerHTML: ""
        })),
        style: {},
        setAttribute: jest.fn()
    })),
    appendChild: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    setAttribute: jest.fn(),
    addEventListener: jest.fn(),
    getBoundingClientRect: jest.fn(() => ({ width: 800, height: 600 }))
}));

global.window = {
    innerWidth: 1200,
    innerHeight: 800,
    btoa: jest.fn(s => s),
    widgetWindows: {
        windowFor: jest.fn().mockReturnValue({
            clear: jest.fn(),
            show: jest.fn(),
            addButton: jest.fn().mockReturnValue({
                onclick: null,
                innerHTML: "",
                style: {}
            }),
            addInputButton: jest.fn().mockReturnValue({
                value: "",
                addEventListener: jest.fn()
            }),
            getWidgetBody: jest.fn().mockReturnValue({
                appendChild: jest.fn(),
                append: jest.fn(),
                style: {},
                insertRow: jest.fn(() => ({
                    insertCell: jest.fn(() => ({
                        appendChild: jest.fn(),
                        setAttribute: jest.fn(),
                        style: {},
                        innerHTML: ""
                    }))
                }))
            }),
            getWidgetFrame: jest.fn().mockReturnValue({
                getBoundingClientRect: jest.fn(() => ({ width: 800, height: 600 }))
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
        insertAdjacentHTML: jest.fn(),
        getContext: jest.fn(() => ({
            clearRect: jest.fn(),
            beginPath: jest.fn(),
            fill: jest.fn(),
            closePath: jest.fn()
        })),
        querySelectorAll: jest.fn(() => []),
        insertRow: jest.fn(() => ({
            insertCell: jest.fn(() => ({ style: {}, innerHTML: "" }))
        }))
    })),
    getElementById: jest.fn(() => ({
        style: {},
        innerHTML: "",
        querySelectorAll: jest.fn(() => [])
    })),
    createTextNode: jest.fn(t => t)
};

describe("PhraseMaker Widget", () => {
    let phraseMaker;
    let mockDeps;

    beforeEach(() => {
        jest.useFakeTimers();

        mockDeps = {
            platformColor: global.platformColor,
            docById: global.docById,
            _: global._,
            wheelnav: jest.fn(),
            slicePath: jest.fn(),
            DEFAULTVOICE: "electronic synth"
        };

        phraseMaker = new PhraseMaker(mockDeps);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        test("should initialize with empty rowLabels", () => {
            expect(phraseMaker.rowLabels).toEqual([]);
        });

        test("should initialize with empty rowArgs", () => {
            expect(phraseMaker.rowArgs).toEqual([]);
        });

        test("should initialize with isInitial true", () => {
            expect(phraseMaker.isInitial).toBe(true);
        });

        test("should initialize with sorted false", () => {
            expect(phraseMaker.sorted).toBe(false);
        });

        test("should initialize with empty _notesToPlay", () => {
            expect(phraseMaker._notesToPlay).toEqual([]);
        });

        test("should initialize _noteBlocks as false", () => {
            expect(phraseMaker._noteBlocks).toBe(false);
        });

        test("should initialize empty arrays for row/col blocks", () => {
            expect(phraseMaker._rowBlocks).toEqual([]);
            expect(phraseMaker._colBlocks).toEqual([]);
        });

        test("should initialize empty blockMap", () => {
            expect(phraseMaker._blockMap).toEqual({});
        });

        test("should initialize lyricsON as false", () => {
            expect(phraseMaker.lyricsON).toBe(false);
        });

        test("should accept deps via constructor", () => {
            expect(phraseMaker.platformColor).toBe(global.platformColor);
            expect(phraseMaker._).toBe(global._);
        });

        test("should use default instrumentName", () => {
            expect(phraseMaker._instrumentName).toBe("electronic synth");
        });

        test("should initialize paramsEffects with all effects disabled", () => {
            expect(phraseMaker.paramsEffects.doVibrato).toBe(false);
            expect(phraseMaker.paramsEffects.doDistortion).toBe(false);
            expect(phraseMaker.paramsEffects.doTremolo).toBe(false);
            expect(phraseMaker.paramsEffects.doPhaser).toBe(false);
            expect(phraseMaker.paramsEffects.doChorus).toBe(false);
        });

        test("should initialize with zero effects values", () => {
            expect(phraseMaker.paramsEffects.vibratoIntensity).toBe(0);
            expect(phraseMaker.paramsEffects.distortionAmount).toBe(0);
            expect(phraseMaker.paramsEffects.tremoloFrequency).toBe(0);
        });
    });

    describe("data management", () => {
        test("should store row labels when pushed", () => {
            phraseMaker.rowLabels.push("sol");
            phraseMaker.rowLabels.push("mi");
            expect(phraseMaker.rowLabels).toEqual(["sol", "mi"]);
        });

        test("should store row args when pushed", () => {
            phraseMaker.rowArgs.push(4);
            phraseMaker.rowArgs.push(5);
            expect(phraseMaker.rowArgs).toEqual([4, 5]);
        });

        test("should track _rowBlocks", () => {
            phraseMaker._rowBlocks.push(10);
            phraseMaker._rowBlocks.push(20);
            expect(phraseMaker._rowBlocks).toHaveLength(2);
        });

        test("should track _colBlocks", () => {
            phraseMaker._colBlocks.push([1, 0]);
            phraseMaker._colBlocks.push([2, 1]);
            expect(phraseMaker._colBlocks).toHaveLength(2);
        });

        test("should store blockMap entries", () => {
            phraseMaker._blockMap["0,0"] = true;
            phraseMaker._blockMap["1,2"] = true;
            expect(Object.keys(phraseMaker._blockMap)).toHaveLength(2);
        });

        test("loads default drum row synths before grid preview playback", () => {
            const loadSynth = jest.fn();
            const setSynthVolume = jest.fn();
            const instrumentNames = [];
            const pm = new PhraseMaker({
                getDrumName: jest.fn(label => (label === "snare drum" ? "snare drum" : null)),
                Singer: { setSynthVolume }
            });

            pm.activity = {
                logo: {
                    synth: { loadSynth }
                },
                turtles: {
                    ithTurtle: jest.fn(() => ({
                        singer: { instrumentNames }
                    }))
                }
            };
            pm.rowLabels = ["snare drum", "sol", "snare drum"];

            pm._loadDrumSynthsForRows();

            expect(instrumentNames).toEqual(["snare drum"]);
            expect(loadSynth).toHaveBeenCalledTimes(1);
            expect(loadSynth).toHaveBeenCalledWith(0, "snare drum");
            expect(setSynthVolume).toHaveBeenCalledWith(pm.activity.logo, 0, "snare drum", 50);
        });

        test("should track lyrics", () => {
            phraseMaker._lyrics.push("do");
            phraseMaker._lyrics.push("re");
            expect(phraseMaker._lyrics).toEqual(["do", "re"]);
        });

        test("should track _notesCounter", () => {
            phraseMaker._notesCounter = 5;
            expect(phraseMaker._notesCounter).toBe(5);
        });
    });

    describe("state management", () => {
        test("should toggle _stopOrCloseClicked", () => {
            expect(phraseMaker._stopOrCloseClicked).toBe(false);
            phraseMaker._stopOrCloseClicked = true;
            expect(phraseMaker._stopOrCloseClicked).toBe(true);
        });

        test("should track sorted state", () => {
            expect(phraseMaker.sorted).toBe(false);
            phraseMaker.sorted = true;
            expect(phraseMaker.sorted).toBe(true);
        });

        test("should update _matrixHasTuplets", () => {
            expect(phraseMaker._matrixHasTuplets).toBe(false);
            phraseMaker._matrixHasTuplets = true;
            expect(phraseMaker._matrixHasTuplets).toBe(true);
        });
    });

    describe("effects parameters", () => {
        test("should allow updating vibrato parameters", () => {
            phraseMaker.paramsEffects.doVibrato = true;
            phraseMaker.paramsEffects.vibratoIntensity = 5;
            phraseMaker.paramsEffects.vibratoFrequency = 10;
            expect(phraseMaker.paramsEffects.doVibrato).toBe(true);
            expect(phraseMaker.paramsEffects.vibratoIntensity).toBe(5);
            expect(phraseMaker.paramsEffects.vibratoFrequency).toBe(10);
        });

        test("should allow updating distortion parameters", () => {
            phraseMaker.paramsEffects.doDistortion = true;
            phraseMaker.paramsEffects.distortionAmount = 40;
            expect(phraseMaker.paramsEffects.doDistortion).toBe(true);
            expect(phraseMaker.paramsEffects.distortionAmount).toBe(40);
        });

        test("should allow updating tremolo parameters", () => {
            phraseMaker.paramsEffects.doTremolo = true;
            phraseMaker.paramsEffects.tremoloFrequency = 5;
            phraseMaker.paramsEffects.tremoloDepth = 50;
            expect(phraseMaker.paramsEffects.doTremolo).toBe(true);
            expect(phraseMaker.paramsEffects.tremoloDepth).toBe(50);
        });

        test("should allow updating chorus parameters", () => {
            phraseMaker.paramsEffects.doChorus = true;
            phraseMaker.paramsEffects.chorusRate = 0.5;
            phraseMaker.paramsEffects.delayTime = 3.5;
            phraseMaker.paramsEffects.chorusDepth = 70;
            expect(phraseMaker.paramsEffects.doChorus).toBe(true);
            expect(phraseMaker.paramsEffects.chorusRate).toBe(0.5);
        });
    });

    describe("init() turtleIndex parameter", () => {
        /**
         * Builds a minimal activity mock. ithTurtle() returns singer data for
         * turtles defined in meterByIndex; omitted turtles return undefined
         * beats/noteValue, which exercises the `|| 4` fallback in init().
         */
        function makeActivity(meterByIndex) {
            return {
                turtles: {
                    ithTurtle: jest.fn(i => ({
                        singer: {
                            beatsPerMeasure: meterByIndex[i]?.beats,
                            noteValuePerBeat: meterByIndex[i]?.noteValue,
                            keySignature: "C major"
                        }
                    }))
                }
            };
        }

        /**
         * Invoke init() and absorb any downstream errors thrown once the DOM
         * setup begins (after _measureLimit has already been set). This lets us
         * assert on _measureLimit without providing full DOM stubs for the rest
         * of the 400-line init() method.
         */
        function callInitPartial(pm, activity, turtleIndex) {
            try {
                pm.init(activity, turtleIndex);
            } catch (_) {
                // Tolerated: errors from un-stubbed DOM APIs further in init().
                // _measureLimit is computed before any DOM access.
            }
        }

        test("defaults to turtle 0 when turtleIndex is omitted", () => {
            const pm = new PhraseMaker(mockDeps);
            const activity = makeActivity({ 0: { beats: 4, noteValue: 4 } });
            callInitPartial(pm, activity, undefined);
            // 4/4: 4 / 4 = 1.0
            expect(pm._measureLimit).toBeCloseTo(1.0);
            expect(activity.turtles.ithTurtle).toHaveBeenCalledWith(0);
        });

        test("uses turtleIndex 0 explicitly to read 4/4 meter", () => {
            const pm = new PhraseMaker(mockDeps);
            const activity = makeActivity({ 0: { beats: 4, noteValue: 4 } });
            callInitPartial(pm, activity, 0);
            expect(pm._measureLimit).toBeCloseTo(1.0);
            expect(activity.turtles.ithTurtle).toHaveBeenCalledWith(0);
        });

        test("uses turtleIndex 1 to read 3/4 meter from turtle 1", () => {
            const pm = new PhraseMaker(mockDeps);
            const activity = makeActivity({
                0: { beats: 4, noteValue: 4 },
                1: { beats: 3, noteValue: 4 }
            });
            callInitPartial(pm, activity, 1);
            // 3/4: 3 / 4 = 0.75
            expect(pm._measureLimit).toBeCloseTo(0.75);
            expect(activity.turtles.ithTurtle).toHaveBeenCalledWith(1);
        });

        test("falls back to 4/4 when singer meter is not yet initialized", () => {
            const pm = new PhraseMaker(mockDeps);
            // meterByIndex is empty: beats/noteValue are undefined, || 4 applies
            const activity = makeActivity({});
            callInitPartial(pm, activity, 0);
            // undefined || 4 = 4; 4 / 4 = 1.0
            expect(pm._measureLimit).toBeCloseTo(1.0);
        });
    });

    describe("dependency injection", () => {
        test("should use injected deps", () => {
            const customDeps = {
                platformColor: { labelColor: "#fff" },
                docById: jest.fn(),
                _: s => s.toUpperCase(),
                wheelnav: jest.fn(),
                slicePath: jest.fn(),
                DEFAULTVOICE: "piano"
            };

            const pm = new PhraseMaker(customDeps);
            expect(pm.platformColor.labelColor).toBe("#fff");
            expect(pm._instrumentName).toBe("piano");
            expect(pm._("hello")).toBe("HELLO");
        });

        test("should handle missing deps gracefully", () => {
            const pm = new PhraseMaker({});
            expect(pm.rowLabels).toEqual([]);
        });

        test("should handle null deps", () => {
            const pm = new PhraseMaker(null);
            expect(pm.rowLabels).toEqual([]);
        });
    });
});
