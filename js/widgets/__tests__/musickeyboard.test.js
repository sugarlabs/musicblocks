global.localStorage = {
    beginnerMode: "false"
};

const MusicKeyboard = require("../musickeyboard.js");

describe("MusicKeyboard document key handler lifecycle", () => {
    let originalOnKeyDown;
    let originalOnKeyUp;

    beforeEach(() => {
        originalOnKeyDown = document.onkeydown;
        originalOnKeyUp = document.onkeyup;
        document.onkeydown = null;
        document.onkeyup = null;
    });

    afterEach(() => {
        document.onkeydown = originalOnKeyDown;
        document.onkeyup = originalOnKeyUp;
    });

    test("captures the handlers active when the keyboard is opened", () => {
        const firstHandler = jest.fn();
        const newerHandler = jest.fn();
        const newerKeyUpHandler = jest.fn();

        document.onkeydown = firstHandler;
        const keyboard = new MusicKeyboard({});

        document.onkeydown = newerHandler;
        document.onkeyup = newerKeyUpHandler;

        keyboard._cacheDocumentKeyHandlers();

        document.onkeydown = jest.fn();
        document.onkeyup = jest.fn();
        keyboard._restoreDocumentKeyHandlers();

        expect(document.onkeydown).toBe(newerHandler);
        expect(document.onkeyup).toBe(newerKeyUpHandler);
    });

    test("does not overwrite the saved handlers after the first snapshot", () => {
        const preservedOnKeyDown = jest.fn();
        const preservedOnKeyUp = jest.fn();

        document.onkeydown = preservedOnKeyDown;
        document.onkeyup = preservedOnKeyUp;

        const keyboard = new MusicKeyboard({});

        keyboard._cacheDocumentKeyHandlers();
        document.onkeydown = null;
        document.onkeyup = jest.fn();
        keyboard._cacheDocumentKeyHandlers();
        keyboard._restoreDocumentKeyHandlers();

        expect(document.onkeydown).toBe(preservedOnKeyDown);
        expect(document.onkeyup).toBe(preservedOnKeyUp);
    });

    test("clears the saved snapshot after restoring handlers", () => {
        const previousOnKeyDown = jest.fn();
        const previousOnKeyUp = jest.fn();

        document.onkeydown = previousOnKeyDown;
        document.onkeyup = previousOnKeyUp;

        const keyboard = new MusicKeyboard({});

        keyboard._cacheDocumentKeyHandlers();
        keyboard._restoreDocumentKeyHandlers();

        expect(keyboard._savedDocumentOnKeyDown).toBeUndefined();
        expect(keyboard._savedDocumentOnKeyUp).toBeUndefined();
    });
});

describe("MusicKeyboard add-row submenu", () => {
    let originalDocById;
    let originalPlatformColor;
    let originalSlicePath;
    let originalWheelnav;
    let originalTranslate;

    beforeEach(() => {
        document.body.innerHTML = '<div id="wheelDivptm"></div><div id="addnotes"></div>';
        document.getElementById("addnotes").getBoundingClientRect = () => ({ x: 0, y: 0 });

        originalDocById = global.docById;
        originalPlatformColor = global.platformColor;
        originalSlicePath = global.slicePath;
        originalWheelnav = global.wheelnav;
        originalTranslate = global._;

        global.docById = id => document.getElementById(id);
        global.platformColor = {
            paletteColors: { pitch: ["#000", "#fff"] },
            exitWheelcolors: ["#000", "#fff"]
        };
        global.slicePath = () => ({
            DonutSlice: jest.fn(),
            DonutSliceCustomization: () => ({})
        });
        global._ = value => value;
        global.wheelnav = function () {
            this.raphael = {};
            this.navItems = [];
            this.selectedNavItemIndex = 0;
            this.createWheel = labels => {
                this.navItems = labels.map(() => ({
                    navigateFunction: null,
                    setTooltip: jest.fn()
                }));
            };
            this.removeWheel = jest.fn();
        };
    });

    afterEach(() => {
        global.docById = originalDocById;
        global.platformColor = originalPlatformColor;
        global.slicePath = originalSlicePath;
        global.wheelnav = originalWheelnav;
        global._ = originalTranslate;
        document.body.innerHTML = "";
    });

    test("adds a pitch without throwing when the layout only contains hertz rows", () => {
        const loadNewBlocks = jest.fn();
        const keyboard = new MusicKeyboard({
            canvas: { width: 800, height: 600 },
            getStageScale: () => 1,
            blocks: {
                blockList: [],
                loadNewBlocks
            }
        });

        keyboard.layout = [
            { noteName: "hertz", noteOctave: 392, blockNumber: 100001 },
            { noteName: "hertz", noteOctave: 436, blockNumber: 100002 }
        ];

        keyboard._createAddRowPieSubmenu();

        expect(() => keyboard._menuWheel.navItems[0].navigateFunction()).not.toThrow();
        expect(loadNewBlocks).toHaveBeenCalledWith([
            [0, ["pitch", {}], 0, 0, [null, 1, 2, null]],
            [1, ["solfege", { value: "do♯" }], 0, 0, [0]],
            [2, ["number", { value: 392 }], 0, 0, [0]]
        ]);
    });
});

describe("MusicKeyboard core logic", () => {
    let savedNoteToFrequency;
    let savedLast;
    let savedEighthNoteWidth;
    let savedDocById;
    let savedBeginnerMode;

    beforeEach(() => {
        savedNoteToFrequency = global.noteToFrequency;
        savedLast = global.last;
        savedEighthNoteWidth = global.EIGHTHNOTEWIDTH;
        savedDocById = global.docById;
        savedBeginnerMode = global.beginnerMode;

        global.noteToFrequency = jest.fn(name => ({ do4: 261, sol4: 392 })[name] ?? 0);
        global.last = array => array[array.length - 1];
        global.EIGHTHNOTEWIDTH = 24;
        global.docById = jest.fn(() => ({ getAttribute: () => "0.5" }));
        global.beginnerMode = "false";
    });

    afterEach(() => {
        global.noteToFrequency = savedNoteToFrequency;
        global.last = savedLast;
        global.EIGHTHNOTEWIDTH = savedEighthNoteWidth;
        global.docById = savedDocById;
        global.beginnerMode = savedBeginnerMode;
    });

    describe("addRowBlock", () => {
        test("appends a row block", () => {
            const keyboard = new MusicKeyboard({});
            keyboard._rowBlocks = [];

            keyboard.addRowBlock(5);

            expect(keyboard._rowBlocks).toEqual([5]);
        });

        test("offsets duplicate row blocks to keep them unique", () => {
            const keyboard = new MusicKeyboard({});
            keyboard._rowBlocks = [5];

            keyboard.addRowBlock(5);

            expect(keyboard._rowBlocks).toEqual([5, 1000005]);
        });
    });

    describe("_noteWidth", () => {
        test("scales the width by the note value and cell scale", () => {
            const keyboard = new MusicKeyboard({});
            keyboard._cellScale = 1;

            expect(keyboard._noteWidth(0.25)).toBe(48);
        });

        test("never returns less than the minimum width", () => {
            const keyboard = new MusicKeyboard({});
            keyboard._cellScale = 1;

            expect(keyboard._noteWidth(0.001)).toBe(15);
        });
    });

    describe("clearBlocks", () => {
        test("resets the note names and octaves", () => {
            const keyboard = new MusicKeyboard({});
            keyboard.noteNames = ["do", "re"];
            keyboard.octaves = [4, 4];

            keyboard.clearBlocks();

            expect(keyboard.noteNames).toEqual([]);
            expect(keyboard.octaves).toEqual([]);
        });
    });

    describe("_sortLayout", () => {
        test("orders pitches by frequency and pushes hertz rows to the end", () => {
            const keyboard = new MusicKeyboard({});
            keyboard.activity = {
                turtles: { ithTurtle: () => ({ singer: { keySignature: "C major" } }) }
            };
            keyboard.keyboardShown = true;
            keyboard._createKeyboard = jest.fn();
            keyboard._removePitchBlock = jest.fn();
            keyboard.layout = [
                { noteName: "sol", noteOctave: 4, blockNumber: 3 },
                { noteName: "hertz", noteOctave: 440, blockNumber: 5 },
                { noteName: "do", noteOctave: 4, blockNumber: 1 }
            ];

            keyboard._sortLayout();

            expect(keyboard.layout.map(item => item.noteName)).toEqual(["do", "sol", "hertz"]);
            expect(keyboard._createKeyboard).toHaveBeenCalled();
            expect(keyboard._removePitchBlock).not.toHaveBeenCalled();
        });

        test("removes a duplicate pitch and rebuilds the table when hidden", () => {
            const keyboard = new MusicKeyboard({});
            keyboard.activity = {
                turtles: { ithTurtle: () => ({ singer: { keySignature: "C major" } }) }
            };
            keyboard.keyboardShown = false;
            keyboard._createTable = jest.fn();
            keyboard._removePitchBlock = jest.fn();
            keyboard.layout = [
                { noteName: "do", noteOctave: 4, blockNumber: 1 },
                { noteName: "do", noteOctave: 4, blockNumber: 2 }
            ];

            keyboard._sortLayout();

            expect(keyboard.layout).toHaveLength(1);
            expect(keyboard._removePitchBlock).toHaveBeenCalledWith(2);
            expect(keyboard._createTable).toHaveBeenCalled();
        });
    });

    describe("_updateDuration", () => {
        test("rounds the matching note duration to the nearest eighth", () => {
            const keyboard = new MusicKeyboard({});
            keyboard._createTable = jest.fn();
            keyboard._notesPlayed = [
                { startTime: 0, duration: 1 },
                { startTime: 100, duration: 1 }
            ];

            keyboard._updateDuration(0, [1, 4]);

            expect(keyboard._notesPlayed[0].duration).toBe(0.25);
            expect(keyboard._notesPlayed[1].duration).toBe(1);
            expect(keyboard._createTable).toHaveBeenCalled();
        });
    });

    describe("_addNotes", () => {
        test("appends divided copies and shifts later notes forward", () => {
            const keyboard = new MusicKeyboard({});
            keyboard._createTable = jest.fn();
            keyboard._notesPlayed = [
                { startTime: 0, duration: 1, noteOctave: "do4" },
                { startTime: 100, duration: 1, noteOctave: "re4" }
            ];

            keyboard._addNotes("cell0", 0, 2);

            expect(keyboard._notesPlayed).toHaveLength(4);
            expect(keyboard._notesPlayed.map(note => note.startTime)).toEqual([
                0, 1000, 2000, 1100
            ]);
            expect(keyboard._createTable).toHaveBeenCalled();
        });
    });

    describe("_deleteNotes", () => {
        test("removes every note sharing the given start time", () => {
            const keyboard = new MusicKeyboard({});
            keyboard._createTable = jest.fn();
            keyboard._notesPlayed = [
                { startTime: 0, duration: 1 },
                { startTime: 100, duration: 1 }
            ];

            keyboard._deleteNotes(0);

            expect(keyboard._notesPlayed).toHaveLength(1);
            expect(keyboard._notesPlayed[0].startTime).toBe(100);
            expect(keyboard._createTable).toHaveBeenCalled();
        });
    });

    describe("_divideNotes", () => {
        test("splits a note into equal shorter notes", () => {
            const keyboard = new MusicKeyboard({});
            keyboard._createTable = jest.fn();
            keyboard._notesPlayed = [{ startTime: 0, duration: 1, noteOctave: "do4" }];

            keyboard._divideNotes(0, 2);

            expect(keyboard._notesPlayed).toHaveLength(2);
            expect(keyboard._notesPlayed.map(note => note.duration)).toEqual([0.5, 0.5]);
            expect(keyboard._notesPlayed.map(note => note.startTime)).toEqual([0, 500]);
        });

        test("leaves the note untouched when the division is too short", () => {
            const keyboard = new MusicKeyboard({});
            keyboard._createTable = jest.fn();
            keyboard._notesPlayed = [{ startTime: 0, duration: 1, noteOctave: "do4" }];

            keyboard._divideNotes(0, 100);

            expect(keyboard._notesPlayed).toHaveLength(1);
            expect(keyboard._notesPlayed[0].duration).toBe(1);
        });
    });

    describe("_removePitchBlock", () => {
        test("splices the block out of its connection chain and trashes it", () => {
            const keyboard = new MusicKeyboard({});
            const blockList = {
                10: { connections: [2, 99, 20] },
                2: { name: "musickeyboard", connections: [0, 10] },
                20: { connections: [10, null] }
            };
            const sendStackToTrash = jest.fn();
            const refreshCanvas = jest.fn();
            keyboard.blockNo = 10;
            keyboard.activity = {
                blocks: {
                    blockList,
                    sendStackToTrash,
                    adjustDocks: jest.fn(),
                    clampBlocksToCheck: []
                },
                refreshCanvas
            };

            keyboard._removePitchBlock(10);

            expect(blockList[2].connections[1]).toBe(20);
            expect(blockList[20].connections[0]).toBe(2);
            expect(blockList[10].connections[2]).toBeNull();
            expect(sendStackToTrash).toHaveBeenCalledWith(blockList[10]);
            expect(keyboard.activity.blocks.clampBlocksToCheck).toEqual([[10, 0]]);
            expect(refreshCanvas).toHaveBeenCalled();
        });
    });
});
