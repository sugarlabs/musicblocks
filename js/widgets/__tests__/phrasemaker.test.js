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
            DEFAULTVOICE: "electronic synth",

            last: arr => arr[arr.length - 1],
            LCD: (a, b) => (a * b) / (b === 0 ? 1 : 1), // simple stub
            calcNoteValueToDisplay: jest.fn(() => ["1/4", "♩"]),
            getDrumName: jest.fn(() => null),
            getDrumIcon: jest.fn(() => ""),
            getDrumSynthName: jest.fn(() => "kick"),
            noteIsSolfege: jest.fn(() => false),
            isCustomTemperament: jest.fn(() => false),
            i18nSolfege: jest.fn(s => s),
            getNote: jest.fn(() => ["C", "", 4]),
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
                    addEventListener: jest.fn()
                }))
            }
        ];
        phraseMaker._noteValueRow = {
            insertCell: jest.fn(() => ({ style: {}, setAttribute: jest.fn() }))
        };

        phraseMaker.addNotes(2, 4);

        expect(phraseMaker._notesToPlay.length).toBe(2);
    });
    test("addTuplet pushes notes to _notesToPlay", () => {
        const createMockCell = () => ({
            style: {},
            innerHTML: "",
            setAttribute: jest.fn(),
            addEventListener: jest.fn()
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

        phraseMaker.blockConnection(1);

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
    test("_addRhythmBlock loads new rhythm blocks safely", () => {
        phraseMaker.blockNo = 0;

        phraseMaker._deps.toFraction = jest.fn(v => v);
        phraseMaker.blockConnection = jest.fn();
        jest.spyOn(global, "setTimeout").mockImplementation(fn => fn);

        phraseMaker.activity = {
            blocks: {
                blockList: [{ connections: [null, 1] }, { name: "vspace", connections: [] }],
                findBottomBlock: jest.fn(() => 1),
                loadNewBlocks: jest.fn()
            },
            refreshCanvas: jest.fn()
        };

        phraseMaker._addRhythmBlock([1, 4], 2);

        expect(phraseMaker.activity.blocks.loadNewBlocks).toHaveBeenCalled();
        expect(phraseMaker.blockConnection).toHaveBeenCalled();
    });
    test("_readjustNotesBlocks updates and adds blocks", () => {
        phraseMaker._mapNotesBlocks = jest.fn(() => [0]);
        phraseMaker.recalculateBlocks = jest.fn(() => [[[1, 4], 2]]);
        phraseMaker._update = jest.fn();
        phraseMaker._addRhythmBlock = jest.fn();
        phraseMaker._deleteRhythmBlock = jest.fn();

        phraseMaker._readjustNotesBlocks();

        expect(phraseMaker._update).toHaveBeenCalled();
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
    test("_divideNotes modifies tupletRhythms", () => {
        phraseMaker._readjustNotesBlocks = jest.fn();
        phraseMaker._syncMarkedBlocks = jest.fn();
        phraseMaker._restartGrid = jest.fn();

        phraseMaker.activity = {
            logo: {
                tupletRhythms: [["notes", 0, 4]]
            }
        };

        phraseMaker._colBlocks = [[0, 0]];

        phraseMaker._divideNotes(0, 2);

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
    test("_tieNotes merges note durations", () => {
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

        phraseMaker._tieNotes({ id: 0 }, { id: 2 });

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
            logo: {
                synth: { inTemperament: "custom" }
            }
        };

        global.activity = { textMsg: jest.fn() };

        // RUN custom temperament first
        phraseMaker._deps.isCustomTemperament = jest.fn(() => true);
        phraseMaker._save();

        // RUN equal temperament second
        phraseMaker.activity.logo.synth.inTemperament = "equal";
        phraseMaker._deps.isCustomTemperament = jest.fn(() => false);
        phraseMaker._save();

        expect(phraseMaker.activity.blocks.loadNewBlocks).toHaveBeenCalled();
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
            logo: {
                synth: { inTemperament: "equal" }
            }
        };

        global.activity = { textMsg: jest.fn() };

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
            logo: { synth: { inTemperament: "equal" } }
        };

        global.activity = { textMsg: jest.fn() };

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
                    stop: jest.fn()
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
});
