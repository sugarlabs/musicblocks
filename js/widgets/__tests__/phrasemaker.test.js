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
global.PhraseMakerGrid = {
    mapNotesBlocks: jest.fn(() => []),
    clearBlocks: jest.fn(),
    addRowBlock: jest.fn(),
    addColBlock: jest.fn(),
    addNode: jest.fn(),
    removeNode: jest.fn(),
    lookForNoteBlocksOrRepeat: jest.fn(),
    syncMarkedBlocks: jest.fn()
};

global.PhraseMakerUtils = {
    generateDataURI: jest.fn(str => "data:text/html;base64," + str),
    recalculateBlocks: jest.fn(() => [
        [4, 1],
        [8, 2]
    ]),
    MATRIXGRAPHICS: [],
    MATRIXGRAPHICS2: []
};

global.PhraseMakerUI = {
    calculateNoteWidth: jest.fn(() => 100)
};
global.DEFAULTVOICE = "electronic synth";
global.DEFAULTDRUM = "kick drum";
global.DEFAULTVOLUME = 50;
global.PREVIEWVOLUME = 50;
global.normalizeNoteAccidentals = note => note;
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
global.parseNoteString = jest.fn(note => [note.slice(0, -1), Number(note.slice(-1))]);
global.noteToFrequency = jest.fn(() => 440);
global.calcNoteValueToDisplay = jest.fn(() => "1/4");
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
            DEFAULTVOICE: "electronic synth",

            last: arr => arr[arr.length - 1],
            LCD: (a, b) => (a * b) / (b === 0 ? 1 : 1), // simple stub
            calcNoteValueToDisplay: jest.fn(() => "1/4"),
            getDrumName: jest.fn(() => null),
            getDrumIcon: jest.fn(() => ""),
            getDrumSynthName: jest.fn(() => "kick"),
            noteIsSolfege: jest.fn(() => false),
            isCustomTemperament: jest.fn(() => false),
            i18nSolfege: jest.fn(s => s),
            getNote: jest.fn(() => ["C", "", 4]),
            parseNoteString: jest.fn(note => [note.slice(0, -1), Number(note.slice(-1))]),
            noteToFrequency: jest.fn(() => 440),
            toFraction: jest.fn(v => v)
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
    test("_generateDataURI calls PhraseMakerUtils", () => {
        const uri = phraseMaker._generateDataURI("<html></html>");
        expect(uri).toContain("data:text/html");
    });
    test("_get_save_lock returns save lock state", () => {
        phraseMaker._save_lock = true;
        expect(phraseMaker._get_save_lock()).toBe(true);
    });
    test("_blockReplace reconnects blocks", () => {
        const mockBlockList = [
            { connections: [null, 1], isClampBlock: () => false },
            { connections: [0, null], isClampBlock: () => false }
        ];

        phraseMaker.activity = {
            blocks: {
                blockList: mockBlockList,
                clampBlocksToCheck: [],
                adjustDocks: jest.fn(),
                sendStackToTrash: jest.fn()
            },
            refreshCanvas: jest.fn()
        };

        phraseMaker.blockNo = 0;

        phraseMaker._blockReplace(0, 1);

        expect(phraseMaker.activity.blocks.adjustDocks).toHaveBeenCalled();
    });
    test("addNotes populates _notesToPlay", () => {
        phraseMaker.rowLabels = ["C"];
        phraseMaker._rows = [
            {
                insertCell: jest.fn(() => ({
                    style: {},
                    setAttribute: jest.fn(),
                    addEventListener: jest.fn(),
                    appendChild: jest.fn()
                }))
            }
        ];
        phraseMaker._noteValueRow = {
            insertCell: jest.fn(() => ({
                style: {},
                setAttribute: jest.fn(),
                appendChild: jest.fn()
            }))
        };

        phraseMaker.addNotes(2, 4);

        expect(phraseMaker._notesToPlay.length).toBe(2);
    });
    test("addTuplet pushes notes to _notesToPlay", () => {
        const createMockCell = () => ({
            style: {},
            innerHTML: "",
            setAttribute: jest.fn(),
            addEventListener: jest.fn(),
            appendChild: jest.fn()
        });

        phraseMaker._rows = [
            {
                cells: [
                    { style: { width: "20px" } },
                    { style: { width: "20px" } },
                    { style: { width: "20px" } }
                ],
                insertCell: jest.fn(() => createMockCell())
            }
        ];

        phraseMaker._tupletNoteValueRow = {
            insertCell: jest.fn(() => createMockCell())
        };

        phraseMaker._tupletValueRow = {
            insertCell: jest.fn(() => createMockCell())
        };

        phraseMaker._noteValueRow = {
            insertCell: jest.fn(() => createMockCell())
        };

        phraseMaker._tupletNoteLabel = createMockCell();
        phraseMaker._tupletValueLabel = createMockCell();

        phraseMaker.rowLabels = ["C"];

        phraseMaker.addTuplet([
            [1, 4],
            [8, 8, 8]
        ]);

        expect(phraseMaker._notesToPlay.length).toBe(3);
    });
    test("_sort sets sorted true", () => {
        phraseMaker.init = jest.fn();
        phraseMaker.makeClickable = jest.fn();
        phraseMaker.rowLabels = ["C", "D"];
        phraseMaker.rowArgs = [4, 4];
        phraseMaker._rows = [{ cells: [] }, { cells: [] }];
        phraseMaker._noteStored = ["C4", "D4"];
        phraseMaker.columnBlocksMap = [[0], [1]];

        phraseMaker.activity = {
            turtles: { ithTurtle: () => ({ singer: { keySignature: 0 } }) },
            logo: { tupletRhythms: [] }
        };

        phraseMaker._sort();

        expect(phraseMaker.sorted).toBe(true);
    });
    test("recalculateBlocks calls PhraseMakerUtils", () => {
        phraseMaker.activity = {
            logo: { tupletRhythms: [] }
        };

        const result = phraseMaker.recalculateBlocks();
        expect(result.length).toBeGreaterThan(0);
    });
    test("_noteWidth delegates to PhraseMakerUI", () => {
        const width = phraseMaker._noteWidth(4);
        expect(width).toBe(100);
    });
    test("_update tupletnote branch fully updates both number blocks", () => {
        phraseMaker._deps.toFraction = jest.fn(v => v);

        phraseMaker.activity = {
            blocks: {
                blockList: [
                    // 0 main block
                    { connections: [null, 1] },

                    // 1 divide block
                    { connections: [null, 2, 3] },

                    // 2 denominator block
                    { value: 0, text: { text: "" }, updateCache: jest.fn() },

                    // 3 numerator block
                    { value: 0, text: { text: "" }, updateCache: jest.fn() }
                ]
            },
            refreshCanvas: jest.fn(),
            saveLocally: jest.fn()
        };

        phraseMaker._update(0, [1, 4], 2, "tupletnote");

        expect(phraseMaker.activity.blocks.blockList[2].value).toBe(4);

        expect(phraseMaker.activity.blocks.blockList[3].value).toBe(1);
    });
    test("blockConnection connects blocks correctly", () => {
        phraseMaker.blockNo = 0;

        phraseMaker.activity = {
            blocks: {
                blockList: [
                    { connections: [null, null, null] },
                    { connections: [null, null, null] }
                ],
                clampBlocksToCheck: [],
                adjustDocks: jest.fn()
            }
        };

        phraseMaker.blockConnection(1, null);

        expect(phraseMaker.activity.blocks.clampBlocksToCheck.length).toBe(1);
    });
    test("_deleteRhythmBlock sends stack to trash", () => {
        phraseMaker.blockNo = 0;

        phraseMaker.activity = {
            blocks: {
                blockList: [{ connections: [null, null, 1] }, { connections: [null] }],
                sendStackToTrash: jest.fn(),
                adjustDocks: jest.fn()
            },
            refreshCanvas: jest.fn()
        };

        phraseMaker._deleteRhythmBlock(0);

        expect(phraseMaker.activity.blocks.sendStackToTrash).toHaveBeenCalled();
    });
    test("_addRhythmBlock loads new rhythm blocks safely", async () => {
        phraseMaker.blockNo = 0;

        phraseMaker._deps.toFraction = jest.fn(v => v);
        phraseMaker.blockConnection = jest.fn();
        jest.spyOn(global, "setTimeout").mockImplementation(fn => fn());

        phraseMaker.activity = {
            blocks: {
                blockList: [{ connections: [null, 1] }, { name: "vspace", connections: [] }],
                findBottomBlock: jest.fn(() => 1),
                loadNewBlocks: jest.fn()
            },
            refreshCanvas: jest.fn()
        };

        await phraseMaker._addRhythmBlock([1, 4], 2);

        expect(phraseMaker.activity.blocks.loadNewBlocks).toHaveBeenCalled();
        expect(phraseMaker.blockConnection).toHaveBeenCalled();
    });
    test("_addRhythmBlock loads new rhythm blocks safely (non-vspace)", async () => {
        phraseMaker.blockNo = 0;

        phraseMaker._deps.toFraction = jest.fn(v => v);
        phraseMaker.blockConnection = jest.fn();
        jest.spyOn(global, "setTimeout").mockImplementation(fn => fn());

        phraseMaker.activity = {
            blocks: {
                blockList: [{ connections: [null, 1] }, { name: "action", connections: [] }],
                findBottomBlock: jest.fn(() => 1),
                loadNewBlocks: jest.fn()
            },
            refreshCanvas: jest.fn()
        };

        await phraseMaker._addRhythmBlock([1, 4], 2);

        expect(phraseMaker.activity.blocks.loadNewBlocks).toHaveBeenCalled();
        expect(phraseMaker.blockConnection).toHaveBeenCalledWith(7, 1);
    });
    test("_readjustNotesBlocks awaits sequentially to prevent concurrency regressions", async () => {
        phraseMaker._mapNotesBlocks = jest.fn(() => [0]);
        // Provide multiple blocks to recalculate to test loop concurrency
        phraseMaker.recalculateBlocks = jest.fn(() => [
            [[1, 4], 2],
            [[1, 8], 1],
            [[1, 4], 2]
        ]);
        phraseMaker._update = jest.fn();
        phraseMaker._deleteRhythmBlock = jest.fn();

        let activeCalls = 0;
        let maxConcurrentCalls = 0;
        phraseMaker._addRhythmBlock = jest.fn(async () => {
            activeCalls++;
            maxConcurrentCalls = Math.max(maxConcurrentCalls, activeCalls);
            // Yield back to the microtask queue to allow other promises to run if they were started concurrently
            await Promise.resolve();
            activeCalls--;
        });

        await phraseMaker._readjustNotesBlocks();

        expect(phraseMaker._update).toHaveBeenCalled();
        expect(phraseMaker._addRhythmBlock).toHaveBeenCalledTimes(2);
        // Ensures `await` is executed sequentially; if Promise.all were used, this would be 2
        expect(maxConcurrentCalls).toBe(1);
    });
    test("_restartGrid regenerates grid", () => {
        phraseMaker.init = jest.fn();
        phraseMaker.addTuplet = jest.fn();
        phraseMaker.addNotes = jest.fn();
        phraseMaker.makeClickable = jest.fn();

        phraseMaker._menuWheel = { removeWheel: jest.fn() };
        phraseMaker._exitWheel = { removeWheel: jest.fn() };

        phraseMaker.activity = {
            logo: {
                tupletRhythms: [["simple", 0, 1, 2]],
                tupletParams: [[1, 4]]
            }
        };

        phraseMaker._restartGrid();

        expect(phraseMaker.init).toHaveBeenCalled();
    });
    test("_clear resets matrix cells", () => {
        phraseMaker.rowLabels = ["C"];

        phraseMaker._rows = [
            {
                cells: [
                    {
                        style: { backgroundColor: "black" },
                        getAttribute: jest.fn(() => "white")
                    }
                ]
            }
        ];

        phraseMaker._notesToPlay = [[[1], 4]];
        phraseMaker._setNotes = jest.fn();

        phraseMaker._clear();

        expect(phraseMaker._setNotes).toHaveBeenCalled();
    });
    test("_divideNotes modifies tupletRhythms", async () => {
        phraseMaker._readjustNotesBlocks = jest.fn();
        phraseMaker._syncMarkedBlocks = jest.fn();
        phraseMaker._restartGrid = jest.fn();

        phraseMaker.activity = {
            logo: {
                tupletRhythms: [["notes", 0, 4]]
            }
        };

        phraseMaker._colBlocks = [[0, 0]];

        await phraseMaker._divideNotes(0, 2);

        expect(phraseMaker._readjustNotesBlocks).toHaveBeenCalled();
    });
    test("_updateTupletValue increases tuplet size", () => {
        phraseMaker._mapNotesBlocks = jest.fn(() => [0]);
        phraseMaker._restartGrid = jest.fn();
        phraseMaker._syncMarkedBlocks = jest.fn();
        phraseMaker._update = jest.fn();

        phraseMaker.activity = {
            logo: {
                tupletRhythms: [["notes", 0, 4, 4]]
            }
        };

        phraseMaker._colBlocks = [
            [0, 0],
            [0, 1]
        ];

        phraseMaker._updateTupletValue(0, 1, 3);

        expect(phraseMaker._update).toHaveBeenCalled();
    });
    test("_updateTupletValue increase and decrease paths", () => {
        phraseMaker._mapNotesBlocks = jest.fn(() => [0]);
        phraseMaker._restartGrid = jest.fn();
        phraseMaker._syncMarkedBlocks = jest.fn();
        phraseMaker._update = jest.fn();

        phraseMaker._colBlocks = [
            [0, 0],
            [0, 1],
            [0, 2]
        ];

        phraseMaker.activity = {
            logo: {
                tupletRhythms: [["notes", 0, 4, 4]]
            }
        };

        // Increase
        phraseMaker._updateTupletValue(0, 1, 3);

        // Decrease
        phraseMaker._updateTupletValue(0, 3, 1);

        expect(phraseMaker._update).toHaveBeenCalled();
    });
    test("_tieNotes merges note durations", async () => {
        phraseMaker._readjustNotesBlocks = jest.fn();
        phraseMaker._syncMarkedBlocks = jest.fn();
        phraseMaker._restartGrid = jest.fn();

        phraseMaker._colBlocks = [
            [0, 0],
            [0, 1],
            [0, 2]
        ];

        phraseMaker.activity = {
            logo: {
                tupletRhythms: [
                    ["notes", 0, 4],
                    ["notes", 0, 4],
                    ["notes", 0, 4]
                ]
            }
        };

        await phraseMaker._tieNotes({ id: 0 }, { id: 2 });

        expect(phraseMaker._readjustNotesBlocks).toHaveBeenCalled();
    });
    test("_setNoteCell handles pitch and hertz", () => {
        phraseMaker._noteStored = ["C4", "440"];
        phraseMaker.rowLabels = ["C", "hertz"];

        phraseMaker._rows = [
            { cells: [{ getAttribute: jest.fn(() => 1), style: {} }] },
            { cells: [{ getAttribute: jest.fn(() => 1), style: {} }] }
        ];

        phraseMaker._deps.getDrumName = jest.fn(() => null);
        phraseMaker._deps.Singer = {
            defaultBPMFactor: 1
        };

        phraseMaker.activity = {
            logo: {
                synth: {
                    trigger: jest.fn(),
                    inTemperament: "equal"
                }
            }
        };

        phraseMaker._setNoteCell(0, 0, phraseMaker._rows[0].cells[0], true);
        phraseMaker._setNoteCell(1, 0, phraseMaker._rows[1].cells[0], true);

        expect(phraseMaker.activity.logo.synth.trigger).toHaveBeenCalled();
    });
    test("_createpiesubmenu rhythmnote branch", () => {
        phraseMaker.docById = jest.fn(() => ({
            style: {},
            children: [{ textContent: "" }]
        }));

        phraseMaker.wheelnav = jest.fn(() => ({
            createWheel: jest.fn(),
            navItems: Array(20).fill({
                navigateFunction: null,
                navItem: { hide: jest.fn(), show: jest.fn() }
            }),
            slicePathCustom: {},
            removeWheel: jest.fn()
        }));

        phraseMaker.slicePath = jest.fn(() => ({
            DonutSlice: jest.fn(),
            DonutSliceCustomization: jest.fn(() => ({}))
        }));

        phraseMaker.platformColor = {};

        phraseMaker.activity = {
            canvas: { width: 800, height: 600 },
            getStageScale: jest.fn(() => 1)
        };

        phraseMaker._noteValueRow = {
            cells: [
                {
                    getBoundingClientRect: jest.fn(() => ({ x: 0, y: 0 }))
                }
            ]
        };

        phraseMaker._createpiesubmenu(0, 2, "rhythmnote");
    });
    test.each([
        ["value option", 1],
        ["decrease button", 3]
    ])("tuplet-value %s removes one subdivision", (_, menuIndex) => {
        const wheelDiv = { style: {} };
        const exitTitle = { children: [{ textContent: "" }] };
        phraseMaker.docById = jest.fn(id =>
            id === "wheelnav-_exitWheel-title-1" ? exitTitle : wheelDiv
        );

        phraseMaker.wheelnav = jest.fn(() => ({
            raphael: {},
            createWheel(labels) {
                this.navItems = labels.map(() => ({
                    navigateFunction: null,
                    navItem: { hide: jest.fn(), show: jest.fn() }
                }));
            },
            navItems: [],
            slicePathCustom: {},
            removeWheel: jest.fn()
        }));
        phraseMaker.slicePath = jest.fn(() => ({
            DonutSlice: jest.fn(),
            DonutSliceCustomization: jest.fn(() => ({}))
        }));
        phraseMaker._mapNotesBlocks = jest.fn(() => [0]);
        phraseMaker._restartGrid = jest.fn();
        phraseMaker._syncMarkedBlocks = jest.fn();
        phraseMaker._update = jest.fn();
        phraseMaker._colBlocks = [
            [0, 0],
            [0, 1],
            [0, 2]
        ];
        phraseMaker._noteValueRow = {
            cells: [{ getBoundingClientRect: jest.fn(() => ({ x: 0, y: 0 })) }]
        };
        phraseMaker.activity = {
            canvas: { width: 800, height: 600 },
            getStageScale: jest.fn(() => 1),
            logo: { tupletRhythms: [["notes", 0, 4, 4, 4]] }
        };

        phraseMaker._createpiesubmenu(0, 3, "tupletvalue");
        phraseMaker._menuWheel.selectedNavItemIndex = menuIndex;
        phraseMaker._menuWheel.navItems[menuIndex].navigateFunction();

        expect(phraseMaker.activity.logo.tupletRhythms[0]).toEqual(["notes", 0, 4, 4]);
    });
    test("_restartGrid handles default case", () => {
        phraseMaker.init = jest.fn();
        phraseMaker.addNotes = jest.fn();
        phraseMaker.makeClickable = jest.fn();

        phraseMaker._menuWheel = { removeWheel: jest.fn() };
        phraseMaker._exitWheel = { removeWheel: jest.fn() };

        phraseMaker.activity = {
            logo: {
                tupletRhythms: [["other", 2, 4]]
            }
        };

        phraseMaker._restartGrid();

        expect(phraseMaker.addNotes).toHaveBeenCalled();
    });
    test("_setNoteCell covers MATRIXSYNTHS branch", () => {
        phraseMaker._noteStored = ["sine: 440"];
        phraseMaker.rowLabels = ["C"];

        phraseMaker._rows = [{ cells: [{ getAttribute: jest.fn(() => 1), style: {} }] }];

        phraseMaker._deps.Singer = { defaultBPMFactor: 1 };
        phraseMaker._deps.getDrumName = jest.fn(() => null);

        global.PhraseMakerUtils = {
            MATRIXSYNTHS: ["sine"],
            MATRIXGRAPHICS: [],
            MATRIXGRAPHICS2: []
        };

        phraseMaker.activity = {
            logo: {
                synth: { trigger: jest.fn() }
            }
        };

        phraseMaker._setNoteCell(0, 0, phraseMaker._rows[0].cells[0], true);
    });
    test("_clear resets matrix safely", () => {
        phraseMaker.rowLabels = ["C"];
        phraseMaker._rows = [
            {
                cells: [
                    {
                        style: { backgroundColor: "black" },
                        getAttribute: jest.fn(() => "white")
                    }
                ]
            }
        ];

        phraseMaker._notesToPlay = [[["C"], 4]];
        phraseMaker._lyrics = ["text"];
        phraseMaker._setNotes = jest.fn();

        phraseMaker._clear();

        expect(phraseMaker._setNotes).toHaveBeenCalled();
    });
    test("makeClickable executes without crash", () => {
        phraseMaker.rowLabels = ["C"];
        phraseMaker._rows = [
            {
                cells: [
                    {
                        style: {},
                        setAttribute: jest.fn(),
                        addEventListener: jest.fn(),
                        removeEventListener: jest.fn(),
                        getAttribute: jest.fn(() => 1)
                    }
                ]
            }
        ];

        phraseMaker._noteValueRow = { cells: phraseMaker._rows[0].cells };
        phraseMaker._tupletValueRow = { cells: [] };

        phraseMaker._notesToPlay = [[["C"], 4]];
        phraseMaker._colBlocks = [[0, 0]];
        phraseMaker._rowBlocks = [0];
        phraseMaker._rowMap = [0];
        phraseMaker._rowOffset = [0];
        phraseMaker._blockMap = { 0: [] };
        phraseMaker.blockNo = 0;

        phraseMaker.makeClickable();
    });
    test("audio proxy methods execute", () => {
        global.PhraseMakerAudio = {
            playAll: jest.fn(),
            collectNotesToPlay: jest.fn(),
            __playNote: jest.fn(),
            _playChord: jest.fn(),
            _processGraphics: jest.fn()
        };

        global.PhraseMakerUI = {
            resetMatrix: jest.fn()
        };

        phraseMaker.playAll();
        phraseMaker.collectNotesToPlay();
        phraseMaker.__playNote(0, 0);
        phraseMaker._playChord([1, 2], 4);
        phraseMaker._processGraphics(["cmd"]);
        phraseMaker._resetMatrix();
    });
    test("FORCE full pitch decision tree", () => {
        phraseMaker._rows = [];
        phraseMaker._rowBlocks = [];
        phraseMaker._colBlocks = [];
        phraseMaker._blockMap = {};
        phraseMaker._rowMap = [];
        phraseMaker._rowOffset = [];

        phraseMaker.lyricsON = true;
        phraseMaker._lyrics = ["a", "b", "c", "d", "e", "f", "g", "h"];

        phraseMaker._notesToPlay = [
            [["R"], 4], // rest
            [["440"], 4], // hertz
            [["kick"], 4], // drum
            [["http://x.wav"], 4], // url
            [["forward: 100"], 4], // graphics 1 arg
            [["arc: 50: 90"], 4], // graphics 2 arg
            [["C♯4"], 4], // sharp
            [["D♭4"], 4], // flat
            [["E4"], 4], // plain pitch
            [["C4", "E4", "G4"], 4], // multi pitch
            [["C4"], 1.5] // dotted
        ];

        phraseMaker._outputAsTuplet = Array(11).fill([1, 4]);

        phraseMaker._deps.getDrumName = jest.fn(n => (n === "kick" ? "kick" : null));
        phraseMaker._deps.toFraction = jest.fn(() => [3, 2]);
        phraseMaker._deps.SOLFEGECONVERSIONTABLE = {
            "C": "do",
            "D": "re",
            "E": "mi",
            "G": "so",
            "C♯": "do#",
            "D♭": "re♭"
        };

        global.PhraseMakerUtils = {
            MATRIXGRAPHICS: ["forward", "arc"],
            MATRIXGRAPHICS2: ["arc"],
            MATRIXSYNTHS: []
        };

        phraseMaker.activity = {
            blocks: {
                palettes: { dict: {} },
                loadNewBlocks: jest.fn()
            },
            refreshCanvas: jest.fn(),
            textMsg: jest.fn(),
            logo: {
                synth: { inTemperament: "custom" }
            }
        };

        // RUN custom temperament first
        phraseMaker._deps.isCustomTemperament = jest.fn(() => true);
        phraseMaker._save();

        // RUN equal temperament second
        phraseMaker.activity.logo.synth.inTemperament = "equal";
        phraseMaker._deps.isCustomTemperament = jest.fn(() => false);
        phraseMaker._save();

        expect(phraseMaker.activity.blocks.loadNewBlocks).toHaveBeenCalled();
    });
    test("_save wires lastConnection identically across all block types (characterization)", () => {
        global.PhraseMakerAudio = { collectNotesToPlay: jest.fn() };

        phraseMaker._rows = [];
        phraseMaker._rowBlocks = [];
        phraseMaker._colBlocks = [];
        phraseMaker._blockMap = {};
        phraseMaker._rowMap = [];
        phraseMaker._rowOffset = [];

        phraseMaker.lyricsON = false;

        phraseMaker._notesToPlay = [
            [["440"], 4], // hertz
            [["kick"], 4], // drum
            [["http://x.wav"], 4], // drum url
            [["arc: 50: 90"], 4], // 2-arg graphics
            [["forward: 100"], 4], // 1-arg graphics
            [["E4"], 4], // plain pitch, single-length note
            [["C4", "G4"], 4] // multi pitch: exercises j !== length-1 vs j === length-1
        ];
        phraseMaker._outputAsTuplet = Array(7).fill([1, 4]);

        phraseMaker._deps.getDrumName = jest.fn(n => (n === "kick" ? "kick" : null));
        phraseMaker._deps.toFraction = jest.fn(() => [1, 4]);
        phraseMaker._deps.isCustomTemperament = jest.fn(() => false);
        phraseMaker._deps.SOLFEGECONVERSIONTABLE = { C: "do", G: "so" };

        global.PhraseMakerUtils = {
            MATRIXGRAPHICS: ["forward"],
            MATRIXGRAPHICS2: ["arc"],
            MATRIXSYNTHS: []
        };

        phraseMaker.activity = {
            blocks: {
                palettes: { dict: {} },
                loadNewBlocks: jest.fn()
            },
            refreshCanvas: jest.fn(),
            textMsg: jest.fn(),
            logo: { synth: { inTemperament: "equal" } }
        };

        phraseMaker._save();

        // Second run with lyricsON = true so the guard's `!this.lyricsON`
        // half is false, forcing every block into the thisBlock+offset
        // branch (the null branch is already exercised above).
        phraseMaker.lyricsON = true;
        phraseMaker._save();

        // Narrow, non-brittle signature: for every block whose connections
        // array is wired up by _computeLastConnection (hertz/playdrum/arc/
        // forward/pitch — the 6 call sites the helper replaced), record only
        // [blockType, lastConnection]. This pins down exactly what the
        // extraction must preserve without hardcoding the surrounding
        // newnote/vspace/divide/number scaffolding, which is unrelated to
        // this refactor and would make the test brittle against unrelated
        // future changes to _save()'s block-building logic.
        const LAST_CONNECTION_TYPES = ["hertz", "playdrum", "arc", "forward", "pitch"];
        const toLastConnectionSignature = newStack =>
            newStack
                .filter(entry => LAST_CONNECTION_TYPES.includes(entry[1]))
                .map(entry => [entry[1], entry[4][entry[4].length - 1]]);

        const [lyricsOffCall, lyricsOnCall] = phraseMaker.activity.blocks.loadNewBlocks.mock.calls;

        // lyricsON = false, every note[0] is length 1 except the trailing
        // multi-pitch note: the guard's `(note[0].length === 1 || ...)` half
        // is true for every single-length note, so lastConnection is null
        // there; the multi-pitch note's non-last pitch (C4) still resolves
        // to thisBlock+3 via the `j === note[0].length - 1` half being false.
        expect(toLastConnectionSignature(lyricsOffCall[0])).toEqual([
            ["hertz", null],
            ["playdrum", null], // kick
            ["playdrum", null], // http url
            ["arc", null],
            ["forward", null],
            ["pitch", null], // single-length E4
            ["pitch", 54], // multi-pitch C4, j=0, not last -> thisBlock(51)+3
            ["pitch", null] // multi-pitch G4, j=1, last
        ]);

        // lyricsON = true: the guard's `!this.lyricsON` half is always
        // false, so lastConnection is thisBlock+offset for every block,
        // regardless of position — pinning down each type's exact offset
        // (hertz/playdrum/forward: +2, arc/pitch: +3).
        expect(toLastConnectionSignature(lyricsOnCall[0])).toEqual([
            ["hertz", 9], // thisBlock(7)+2
            ["playdrum", 18], // kick, thisBlock(16)+2
            ["playdrum", 27], // http url, thisBlock(25)+2
            ["arc", 37], // thisBlock(34)+3
            ["forward", 46], // thisBlock(44)+2
            ["pitch", 56], // single-length E4, thisBlock(53)+3
            ["pitch", 66], // multi-pitch C4, j=0, thisBlock(63)+3
            ["pitch", 69] // multi-pitch G4, j=1, thisBlock(66)+3
        ]);

        expect(phraseMaker.activity.blocks.loadNewBlocks).toHaveBeenCalledTimes(2);
    });
    test("_save covers 7-block tuplet branch", () => {
        phraseMaker._rows = [];
        phraseMaker._rowBlocks = [];
        phraseMaker._colBlocks = [];
        phraseMaker._blockMap = {};
        phraseMaker._rowMap = [];
        phraseMaker._rowOffset = [];

        phraseMaker._notesToPlay = [[["C4"], 4]];

        // THIS triggers 7-block branch
        phraseMaker._outputAsTuplet = [
            [3, 4] // numerator ≠ 1 and integer denominator
        ];

        phraseMaker._deps.getDrumName = jest.fn(() => null);
        phraseMaker._deps.toFraction = jest.fn(() => [1, 4]);
        phraseMaker._deps.SOLFEGECONVERSIONTABLE = { C: "do" };

        phraseMaker.activity = {
            blocks: {
                palettes: { dict: {} },
                loadNewBlocks: jest.fn()
            },
            refreshCanvas: jest.fn(),
            textMsg: jest.fn(),
            logo: {
                synth: { inTemperament: "equal" }
            }
        };

        phraseMaker._save();

        expect(phraseMaker.activity.blocks.loadNewBlocks).toHaveBeenCalled();
    });
    test("_save covers non-integer tuplet branch", () => {
        phraseMaker._rows = [];
        phraseMaker._notesToPlay = [[["C4"], 4]];

        phraseMaker._outputAsTuplet = [
            [3, 4.5] // denominator not integer
        ];

        phraseMaker._deps.getDrumName = jest.fn(() => null);
        phraseMaker._deps.toFraction = jest.fn(() => [1, 4]);
        phraseMaker._deps.SOLFEGECONVERSIONTABLE = { C: "do" };

        phraseMaker.activity = {
            blocks: {
                palettes: { dict: {} },
                loadNewBlocks: jest.fn()
            },
            refreshCanvas: jest.fn(),
            textMsg: jest.fn(),
            logo: { synth: { inTemperament: "equal" } }
        };

        phraseMaker._save();
    });
    test("init builds grid deeply", () => {
        const mockActivity = {
            turtles: {
                ithTurtle: jest.fn(() => ({
                    singer: {
                        beatsPerMeasure: 4,
                        noteValuePerBeat: 4,
                        keySignature: 0
                    }
                }))
            },
            logo: {
                tupletRhythms: [],
                synth: {
                    inTemperament: "equal",
                    stopSound: jest.fn(),
                    stop: jest.fn(),
                    loadSynth: jest.fn()
                }
            },
            blocks: {
                protoBlockDict: {
                    forward: {
                        staticLabels: ["Forward"]
                    }
                }
            },
            canvas: { width: 800, height: 600 },
            getStageScale: jest.fn(() => 1),
            hideMsgs: jest.fn(),
            textMsg: jest.fn()
        };

        phraseMaker._rows = [];
        phraseMaker._headcols = [];
        phraseMaker._labelcols = [];
        phraseMaker._blockMap = {};
        phraseMaker.blockNo = 0;
        phraseMaker.rowLabels = ["C", "kick", "forward"];
        phraseMaker.rowArgs = [4, 4, 100];
        phraseMaker._deps.getDrumName = jest.fn(name => (name === "kick" ? "kick" : null));
        phraseMaker.lyricsON = true;
        mockActivity.logo.tupletRhythms = [["notes", 0, 4]];

        global.PhraseMakerUtils = {
            MATRIXGRAPHICS: ["forward"],
            MATRIXGRAPHICS2: [],
            MATRIXSYNTHS: []
        };

        global.window.widgetWindows = {
            windowFor: jest.fn().mockReturnValue({
                clear: jest.fn(),
                show: jest.fn(),
                addButton: jest.fn().mockReturnValue({
                    onclick: null,
                    innerHTML: "",
                    style: {},
                    setAttribute: jest.fn()
                }),
                getWidgetBody: jest.fn().mockReturnValue({
                    appendChild: jest.fn(),
                    append: jest.fn()
                }),
                sendToCenter: jest.fn(),
                destroy: jest.fn()
            })
        };
        global.PhraseMakerUI = {
            calculateNoteWidth: jest.fn(() => 80),
            resetMatrix: jest.fn()
        };
        phraseMaker.init(mockActivity);

        expect(mockActivity.textMsg).toHaveBeenCalled();
    });
    test("isInitial ensures the first-open message fires only once across repeated init() calls", () => {
        const mockActivity = {
            turtles: {
                ithTurtle: jest.fn(() => ({
                    singer: {
                        beatsPerMeasure: 4,
                        noteValuePerBeat: 4,
                        keySignature: 0
                    }
                }))
            },
            logo: {
                tupletRhythms: [["notes", 0, 4]],
                synth: {
                    inTemperament: "equal",
                    stopSound: jest.fn(),
                    stop: jest.fn(),
                    loadSynth: jest.fn()
                }
            },
            blocks: {
                protoBlockDict: {
                    forward: { staticLabels: ["Forward"] }
                }
            },
            canvas: { width: 800, height: 600 },
            getStageScale: jest.fn(() => 1),
            hideMsgs: jest.fn(),
            textMsg: jest.fn()
        };

        phraseMaker._rows = [];
        phraseMaker._headcols = [];
        phraseMaker._labelcols = [];
        phraseMaker._blockMap = {};
        phraseMaker.blockNo = 0;
        phraseMaker.rowLabels = ["C", "kick", "forward"];
        phraseMaker.rowArgs = [4, 4, 100];
        phraseMaker._deps.getDrumName = jest.fn(name => (name === "kick" ? "kick" : null));
        phraseMaker.lyricsON = true;

        global.PhraseMakerUtils = {
            MATRIXGRAPHICS: ["forward"],
            MATRIXGRAPHICS2: [],
            MATRIXSYNTHS: []
        };

        global.window.widgetWindows = {
            windowFor: jest.fn().mockReturnValue({
                clear: jest.fn(),
                show: jest.fn(),
                addButton: jest.fn().mockReturnValue({
                    onclick: null,
                    innerHTML: "",
                    style: {},
                    setAttribute: jest.fn()
                }),
                getWidgetBody: jest.fn().mockReturnValue({
                    appendChild: jest.fn(),
                    append: jest.fn()
                }),
                sendToCenter: jest.fn(),
                destroy: jest.fn()
            })
        };
        global.PhraseMakerUI = {
            calculateNoteWidth: jest.fn(() => 80),
            resetMatrix: jest.fn()
        };

        expect(phraseMaker.isInitial).toBe(true);

        phraseMaker.init(mockActivity);

        expect(mockActivity.textMsg).toHaveBeenCalledTimes(1);
        expect(mockActivity.textMsg).toHaveBeenCalledWith("Click on the table to add notes.", 3000);
        expect(phraseMaker.isInitial).toBe(false);

        // init() itself doesn't clear row-building state between calls (the
        // real caller always builds a fresh matrix); reset just enough of it
        // here so a second call completes, to prove the first-open message
        // does not repeat once isInitial has flipped to false.
        phraseMaker._rows = [];
        phraseMaker._headcols = [];
        phraseMaker._labelcols = [];
        phraseMaker._blockMap = {};

        phraseMaker.init(mockActivity);

        expect(mockActivity.textMsg).toHaveBeenCalledTimes(1);
        expect(phraseMaker.isInitial).toBe(false);
    });
    test("_createColumnPieSubmenu executes", () => {
        phraseMaker.platformColor = {
            pitchWheelcolors: [],
            exitWheelcolors: [],
            accidentalsWheelcolors: [],
            accidentalsWheelcolorspush: "#fff",
            octavesWheelcolors: [],
            piemenuVoicesColors: []
        };
        phraseMaker.docById = jest.fn(() => ({
            style: {},
            children: [{ textContent: "" }]
        }));
        phraseMaker._deps.DRUMS = ["kick", "snare"];
        phraseMaker._deps.getDrumIcon = jest.fn(() => "");
        phraseMaker._deps.getDrumSynthName = jest.fn(() => "kick");
        phraseMaker._labelcols = [
            {
                getBoundingClientRect: jest.fn(() => ({ x: 100, y: 100 })),
                style: {}
            }
        ];
        phraseMaker._noteBlocks = false;

        phraseMaker.columnBlocksMap = [[0]];

        phraseMaker.activity = {
            canvas: { width: 800, height: 600 },
            getStageScale: jest.fn(() => 1),
            turtles: {
                ithTurtle: jest.fn(() => ({
                    singer: { keySignature: 0 }
                }))
            },
            logo: {
                synth: { inTemperament: "equal" }
            },
            blocks: {
                blockList: [
                    {
                        connections: [null, 1, 2]
                    },
                    { value: "C" },
                    { value: 4 }
                ]
            }
        };

        function FakeWheel() {
            this.createWheel = jest.fn();
            this.navigateWheel = jest.fn();
            this.removeWheel = jest.fn();
            this.setTooltips = jest.fn();
            this.navItems = Array(12).fill({
                title: "C",
                navigateFunction: null,
                navItem: { hide: jest.fn(), show: jest.fn() }
            });
            this.colors = [];
            this.animatetime = 0;
            this.slicePathFunction = null;
            this.slicePathCustom = {};
            this.sliceSelectedPathCustom = {};
            this.sliceInitPathCustom = {};
            this.selectedNavItemIndex = 0;
            this.raphael = {};
        }

        phraseMaker.wheelnav = jest.fn().mockImplementation(function () {
            return new FakeWheel();
        });
        phraseMaker.platformColor.accidentalsWheelcolorspush = "#fff";
        phraseMaker.platformColor.exitWheelcolors = [];

        phraseMaker.slicePath = jest.fn(() => ({
            DonutSlice: jest.fn(),
            DonutSliceCustomization: jest.fn(() => ({}))
        }));

        phraseMaker._noteValueRow = {
            cells: [
                {
                    getBoundingClientRect: jest.fn(() => ({ x: 0, y: 0 }))
                }
            ]
        };
        phraseMaker._deps.slicePath = jest.fn(() => ({
            DonutSlice: jest.fn(),
            DonutSliceCustomization: jest.fn(() => ({
                minRadiusPercent: 0,
                maxRadiusPercent: 0
            }))
        }));

        phraseMaker._createColumnPieSubmenu(0, "pitchblocks");
    });
    test("_lookForNoteBlocksOrRepeat executes", () => {
        global.PhraseMakerGrid = {
            lookForNoteBlocksOrRepeat: jest.fn()
        };

        phraseMaker._lookForNoteBlocksOrRepeat();

        expect(PhraseMakerGrid.lookForNoteBlocksOrRepeat).toHaveBeenCalled();
    });
    test("_lookForNoteBlocksOrRepeat executes", () => {
        global.PhraseMakerGrid = {
            lookForNoteBlocksOrRepeat: jest.fn()
        };

        phraseMaker._lookForNoteBlocksOrRepeat();

        expect(PhraseMakerGrid.lookForNoteBlocksOrRepeat).toHaveBeenCalled();
    });
    test("_blockReplace deep branch", () => {
        phraseMaker.activity = {
            blocks: {
                blockList: [
                    { connections: [null, 1], isClampBlock: () => false },
                    { connections: [0, null], isClampBlock: () => false }
                ],
                clampBlocksToCheck: [],
                adjustDocks: jest.fn(),
                sendStackToTrash: jest.fn()
            },
            refreshCanvas: jest.fn()
        };

        phraseMaker._blockReplace(0, 1);
    });

    describe("refreshRowForBlock", () => {
        const buildMockCell = () => ({
            style: {},
            textContent: "",
            appendChild: jest.fn(),
            setAttribute: jest.fn()
        });

        beforeEach(() => {
            phraseMaker.blockNo = 42;
            phraseMaker.activity = {
                turtles: {
                    ithTurtle: jest.fn(() => ({
                        singer: { keySignature: 0 }
                    }))
                },
                logo: { synth: { inTemperament: "equal" } },
                errorMsg: jest.fn()
            };
            phraseMaker._rowBlocks = [7];
            phraseMaker.rowLabels = ["sol"];
            phraseMaker.rowArgs = [4];
            phraseMaker._headcols = [buildMockCell()];
            phraseMaker._labelcols = [buildMockCell()];
            phraseMaker._noteStored = [];
            phraseMaker._deps.getDrumName = jest.fn(() => null);
            phraseMaker._deps.noteIsSolfege = jest.fn(() => false);
            phraseMaker._deps.isCustomTemperament = jest.fn(() => false);
            global.window.widgetWindows = {
                isOpen: jest.fn(() => true)
            };
        });

        test("updates the matching row and repaints only that row's cells, without a full rebuild", () => {
            const initSpy = jest.spyOn(phraseMaker, "init");

            phraseMaker.refreshRowForBlock(7, "la", "", 5);

            expect(phraseMaker.rowLabels[0]).toBe("la");
            expect(phraseMaker.rowArgs[0]).toBe(5);
            expect(phraseMaker._labelcols[0].appendChild).toHaveBeenCalled();
            expect(phraseMaker._noteStored[0]).toBe("la5");
            // Reuses the existing row-scoped redraw; does not rebuild the whole matrix.
            expect(initSpy).not.toHaveBeenCalled();
        });

        test("resolves the row through getNote when a non-natural accidental is selected", () => {
            phraseMaker._deps.getNote = jest.fn(() => ["la#", 5]);

            phraseMaker.refreshRowForBlock(7, "la", "♯", 5);

            expect(phraseMaker._deps.getNote).toHaveBeenCalledWith(
                "la♯",
                5,
                0,
                0,
                false,
                null,
                phraseMaker.activity.errorMsg,
                "equal"
            );
            expect(phraseMaker.rowLabels[0]).toBe("la#");
            expect(phraseMaker.rowArgs[0]).toBe(5);
        });

        test("is a no-op when the pitch block is not a tracked row", () => {
            phraseMaker.refreshRowForBlock(999, "la", "", 5);

            expect(phraseMaker.rowLabels).toEqual(["sol"]);
            expect(phraseMaker.rowArgs).toEqual([4]);
            expect(phraseMaker._labelcols[0].appendChild).not.toHaveBeenCalled();
        });

        test("is a no-op when Phrase Maker is not currently open", () => {
            global.window.widgetWindows.isOpen = jest.fn(() => false);

            phraseMaker.refreshRowForBlock(7, "la", "", 5);

            expect(phraseMaker.rowLabels).toEqual(["sol"]);
            expect(phraseMaker.rowArgs).toEqual([4]);
        });

        test("is a no-op when window.widgetWindows itself is unavailable", () => {
            global.window.widgetWindows = undefined;

            expect(() => phraseMaker.refreshRowForBlock(7, "la", "", 5)).not.toThrow();
            expect(phraseMaker.rowLabels).toEqual(["sol"]);
            expect(phraseMaker.rowArgs).toEqual([4]);
        });

        test("paints a drum icon in both the header and label cells when the note resolves to a drum name", () => {
            phraseMaker._deps.getDrumName = jest.fn(label =>
                label === "kick" ? "kick drum" : null
            );

            phraseMaker.refreshRowForBlock(7, "kick", "", 5);

            expect(phraseMaker._headcols[0].appendChild).toHaveBeenCalled();
            expect(phraseMaker._labelcols[0].textContent).toBe("kick drum");
        });

        test("paints a bellset icon in the header cell for a bellset note at octave 4", () => {
            // "la" is a BELLSETIDX key; octave 4 is the bellset trigger condition.
            phraseMaker.refreshRowForBlock(7, "la", "", 4);

            expect(phraseMaker._headcols[0].appendChild).toHaveBeenCalledWith(
                expect.objectContaining({ src: expect.stringContaining("8_bellset_key_") })
            );
        });

        test("paints the top-C bellset icon in the header cell for note C at octave 5", () => {
            phraseMaker.refreshRowForBlock(7, "C", "", 5);

            // document.createElement runs against real jsdom here (the file-level
            // `global.document` mock doesn't apply inside jsdom's test environment),
            // so the appended node is a real <img>; only its src is asserted on.
            const appendedImg = phraseMaker._headcols[0].appendChild.mock.calls[0][0];
            expect(appendedImg.src).toContain("8_bellset_key_8.svg");
        });

        test("renders an i18n solfege label with an octave subscript when the note is solfege", () => {
            phraseMaker._deps.noteIsSolfege = jest.fn(() => true);
            phraseMaker._deps.i18nSolfege = jest.fn(label => `translated-${label}`);
            phraseMaker._deps.getNote = jest.fn(() => ["la", 6]);

            // Octave 6 avoids the unrelated bellset header branches (which trigger on 4/5).
            phraseMaker.refreshRowForBlock(7, "la", "", 6);

            const appendedTextNode = phraseMaker._labelcols[0].appendChild.mock.calls[0][0];
            expect(appendedTextNode.textContent).toBe("translated-la");
        });

        test("renders the raw label plus a translated sub-note when using a custom temperament", () => {
            phraseMaker._deps.isCustomTemperament = jest.fn(() => true);
            phraseMaker._deps.getNote = jest.fn(() => ["la", 6]);

            phraseMaker.refreshRowForBlock(7, "la", "", 6);

            expect(phraseMaker._deps.getNote).toHaveBeenCalled();
            const appendedTextNode = phraseMaker._labelcols[0].appendChild.mock.calls[0][0];
            expect(appendedTextNode.textContent).toBe("la");
        });

        test("is idempotent across repeated refreshes with the same value", () => {
            phraseMaker.refreshRowForBlock(7, "la", "", 5);
            const callsAfterFirst = phraseMaker._labelcols[0].appendChild.mock.calls.length;

            phraseMaker.refreshRowForBlock(7, "la", "", 5);

            expect(phraseMaker.rowLabels[0]).toBe("la");
            expect(phraseMaker.rowArgs[0]).toBe(5);
            // Each call repaints the row the same way; it doesn't accumulate state.
            expect(phraseMaker._labelcols[0].appendChild.mock.calls.length).toBe(
                callsAfterFirst * 2
            );
        });

        test("_repaintRowCells stores the drum name directly when called with a drumblocks condition", () => {
            // refreshRowForBlock always uses "pitchblocks"; the "drumblocks" noteStored
            // branch is only reachable via __selectionChanged's internal call, so it's
            // exercised directly here per the private-helper carve-out.
            phraseMaker._deps.getDrumName = jest.fn(() => "snare drum");
            phraseMaker.rowLabels = ["snare"];
            phraseMaker.rowArgs = [-1];

            phraseMaker._repaintRowCells(0, "drumblocks");

            expect(phraseMaker._noteStored[0]).toBe("snare drum");
        });
    });
});

describe("PhraseMaker.dependencies", () => {
    test("declares its AMD module dependencies as definition-attached metadata", () => {
        expect(Array.isArray(PhraseMaker.dependencies)).toBe(true);
        expect(PhraseMaker.dependencies).toEqual([
            "widgets/PhraseMakerUtils",
            "widgets/PhraseMakerGrid",
            "widgets/PhraseMakerUI",
            "widgets/PhraseMakerAudio",
            "widgets/phrasemaker"
        ]);
    });
});
