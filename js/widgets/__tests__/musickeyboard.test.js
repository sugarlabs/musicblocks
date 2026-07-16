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

// =============================================================================
// Pointer Events – piano keys (loadHandler)
// =============================================================================
describe("MusicKeyboard loadHandler – Pointer Events on piano keys", () => {
    let keyboard;
    let mockElement;
    let mockSynth;

    /**
     * Build a minimal fake DOM element that records every addEventListener call
     * so we can look up and fire individual event handlers in tests.
     */
    function makeMockPianoKey(id = "whiteRow0") {
        const listeners = {};
        return {
            id,
            style: { backgroundColor: "white", touchAction: "" },
            setPointerCapture: jest.fn(),
            getAttribute: jest.fn(attr => (attr === "cellColor" ? "#e0e0e0" : null)),
            setAttribute: jest.fn(),
            addEventListener: jest.fn((type, handler) => {
                listeners[type] = handler;
            }),
            _listeners: listeners
        };
    }

    beforeEach(() => {
        mockSynth = { trigger: jest.fn(), stopSound: jest.fn() };

        global.platformColor = { orange: "#ff8c00" };
        global.FIXEDSOLFEGE1 = {};
        global.SHARP = "♯";
        global.FLAT = "♭";

        keyboard = new MusicKeyboard({ logo: { synth: mockSynth } });
        keyboard.displayLayout = [{ noteName: "C", noteOctave: 4, voice: "piano" }];
        keyboard.blockNumberMapper = {};
        keyboard.instrumentMapper = {};
        keyboard.noteMapper = {};
        keyboard._notesPlayed = [];
        keyboard._createTable = jest.fn();
        keyboard._updateWidgetWindowSize = jest.fn();

        mockElement = makeMockPianoKey("whiteRow0");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("loadHandler sets touch-action to pan-x so horizontal scrolling still works", () => {
        keyboard.loadHandler(mockElement, 0, 1);
        expect(mockElement.style.touchAction).toBe("pan-x");
    });

    test("loadHandler registers pointerdown, pointerup, and pointercancel (not legacy onmousedown)", () => {
        keyboard.loadHandler(mockElement, 0, 1);

        const registeredTypes = mockElement.addEventListener.mock.calls.map(c => c[0]);
        expect(registeredTypes).toContain("pointerdown");
        expect(registeredTypes).toContain("pointerup");
        expect(registeredTypes).toContain("pointercancel");
        // Legacy inline handler must NOT be set.
        expect(mockElement.onmousedown).toBeUndefined();
    });

    test("pointerdown highlights the key and triggers the synth", () => {
        keyboard.loadHandler(mockElement, 0, 1);
        mockElement._listeners["pointerdown"]({ preventDefault: jest.fn(), pointerId: 1 });

        expect(mockElement.style.backgroundColor).toBe("#ff8c00");
        expect(mockSynth.trigger).toHaveBeenCalledTimes(1);
    });

    test("pointerdown calls setPointerCapture with the correct pointerId", () => {
        keyboard.loadHandler(mockElement, 0, 1);
        mockElement._listeners["pointerdown"]({ preventDefault: jest.fn(), pointerId: 99 });

        expect(mockElement.setPointerCapture).toHaveBeenCalledWith(99);
    });

    test("pointerup stops the sound and records the played note", () => {
        keyboard.loadHandler(mockElement, 0, 1);
        mockElement._listeners["pointerdown"]({ preventDefault: jest.fn(), pointerId: 1 });
        mockElement._listeners["pointerup"]();

        expect(mockSynth.stopSound).toHaveBeenCalledTimes(1);
        expect(keyboard._notesPlayed).toHaveLength(1);
    });

    test("pointerup restores white key colour to white", () => {
        keyboard.loadHandler(mockElement, 0, 1);
        mockElement._listeners["pointerdown"]({ preventDefault: jest.fn(), pointerId: 1 });
        mockElement._listeners["pointerup"]();

        expect(mockElement.style.backgroundColor).toBe("white");
    });

    test("pointerup restores black key colour to black", () => {
        const blackKey = makeMockPianoKey("blackRow0");
        keyboard.loadHandler(blackKey, 0, 1);
        blackKey._listeners["pointerdown"]({ preventDefault: jest.fn(), pointerId: 1 });
        blackKey._listeners["pointerup"]();

        expect(blackKey.style.backgroundColor).toBe("black");
    });

    test("pointercancel stops the sound and records the note (same as pointerup)", () => {
        keyboard.loadHandler(mockElement, 0, 1);
        mockElement._listeners["pointerdown"]({ preventDefault: jest.fn(), pointerId: 1 });
        mockElement._listeners["pointercancel"]();

        expect(mockSynth.stopSound).toHaveBeenCalledTimes(1);
        expect(keyboard._notesPlayed).toHaveLength(1);
    });
});

// =============================================================================
// Pointer Events – note-grid cells (makeClickable)
// =============================================================================
describe("MusicKeyboard makeClickable – Pointer Events on note-grid cells", () => {
    let keyboard;
    let savedDocById;
    let savedElementFromPoint;

    /**
     * Creates a fake table cell whose addEventListener calls are stored so that
     * tests can retrieve and fire individual handlers directly.
     */
    function makeFakeCell(id, bgColor = "#cccccc") {
        const listeners = {};
        const cell = {
            id,
            style: { backgroundColor: bgColor, touchAction: "" },
            getAttribute: jest.fn(attr => (attr === "cellColor" ? "#cccccc" : null)),
            setAttribute: jest.fn(),
            addEventListener: jest.fn((type, fn) => {
                listeners[type] = fn;
            }),
            setPointerCapture: jest.fn(),
            _listeners: listeners
        };
        return cell;
    }

    /**
     * Builds a minimal keyboard + DOM and calls makeClickable(), returning all
     * the created fake cells so tests can interact with their event handlers.
     */
    function setupMakeClickable(rowCount = 1, colCount = 2) {
        keyboard = new MusicKeyboard({});
        keyboard.layout = Array.from({ length: rowCount }, (_, i) => ({
            noteName: "C",
            noteOctave: 4 + i,
            blockNumber: i
        }));
        keyboard._setNotes = jest.fn();

        const allCells = [];
        savedDocById = global.docById;
        global.docById = jest.fn(id => {
            if (id === "mkbNoteDurationRow") return { cells: [] };
            const rowIndex = Number(id.replace("mkb", ""));
            const cells = Array.from({ length: colCount }, (_, j) => {
                const cell = makeFakeCell(`${rowIndex}:${j}`);
                allCells.push(cell);
                return cell;
            });
            return { cells };
        });

        keyboard.makeClickable();

        global.docById = savedDocById;
        return allCells;
    }

    afterEach(() => {
        if (savedDocById) global.docById = savedDocById;
        if (savedElementFromPoint !== undefined) document.elementFromPoint = savedElementFromPoint;
        jest.clearAllMocks();
    });

    test("makeClickable sets touchAction to pan-x on every grid cell", () => {
        const cells = setupMakeClickable(1, 3);
        for (const cell of cells) {
            expect(cell.style.touchAction).toBe("pan-x");
        }
    });

    test("makeClickable registers pointerdown on grid cells, never onmousedown", () => {
        const cells = setupMakeClickable(1, 2);
        for (const cell of cells) {
            expect(cell.addEventListener).toHaveBeenCalledWith("pointerdown", expect.any(Function));
            expect(cell.onmousedown).toBeUndefined();
        }
    });

    test("makeClickable registers pointermove for drag-paint on every grid cell", () => {
        const cells = setupMakeClickable(1, 2);
        for (const cell of cells) {
            expect(cell.addEventListener).toHaveBeenCalledWith("pointermove", expect.any(Function));
        }
    });

    test("makeClickable registers pointerup and pointercancel on every grid cell", () => {
        const cells = setupMakeClickable(1, 2);
        for (const cell of cells) {
            expect(cell.addEventListener).toHaveBeenCalledWith("pointerup", expect.any(Function));
            expect(cell.addEventListener).toHaveBeenCalledWith(
                "pointercancel",
                expect.any(Function)
            );
        }
    });

    test("pointerdown on a light cell turns it black and calls _setNotes(col, true)", () => {
        const cells = setupMakeClickable(1, 2);
        const cell = cells[0]; // id "0:0"
        cell.style.backgroundColor = "#cccccc";

        cell._listeners["pointerdown"]({
            preventDefault: jest.fn(),
            pointerId: 1,
            currentTarget: cell
        });

        expect(cell.style.backgroundColor).toBe("black");
        expect(keyboard._setNotes).toHaveBeenCalledWith(0, true);
    });

    test("pointerdown on a black cell restores cellColor and calls _setNotes(col, false)", () => {
        const cells = setupMakeClickable(1, 2);
        const cell = cells[1]; // id "0:1"
        cell.style.backgroundColor = "black";
        cell.getAttribute.mockImplementation(attr => (attr === "cellColor" ? "#aaddaa" : null));

        cell._listeners["pointerdown"]({
            preventDefault: jest.fn(),
            pointerId: 1,
            currentTarget: cell
        });

        expect(cell.style.backgroundColor).toBe("#aaddaa");
        expect(keyboard._setNotes).toHaveBeenCalledWith(1, false);
    });

    test("pointerdown calls setPointerCapture with the event's pointerId", () => {
        const cells = setupMakeClickable(1, 1);
        const cell = cells[0];
        cell.style.backgroundColor = "#cccccc";

        cell._listeners["pointerdown"]({
            preventDefault: jest.fn(),
            pointerId: 7,
            currentTarget: cell
        });

        expect(cell.setPointerCapture).toHaveBeenCalledWith(7);
    });

    test("pointermove while pressed uses elementFromPoint to toggle the hovered cell", () => {
        const cells = setupMakeClickable(1, 2);
        const pressedCell = cells[0];
        const hoveredCell = cells[1];
        pressedCell.style.backgroundColor = "#cccccc";
        hoveredCell.style.backgroundColor = "#cccccc";
        hoveredCell.id = "0:1";

        // Press down on the first cell.
        pressedCell._listeners["pointerdown"]({
            preventDefault: jest.fn(),
            pointerId: 1,
            currentTarget: pressedCell
        });

        // Simulate pointer move so elementFromPoint returns the second cell.
        savedElementFromPoint = document.elementFromPoint;
        document.elementFromPoint = jest.fn(() => hoveredCell);

        pressedCell._listeners["pointermove"]({
            clientX: 50,
            clientY: 10,
            currentTarget: pressedCell
        });

        document.elementFromPoint = savedElementFromPoint;

        expect(hoveredCell.style.backgroundColor).toBe("black");
        expect(keyboard._setNotes).toHaveBeenCalledWith(1, true);
    });

    test("pointermove is a no-op when elementFromPoint returns null", () => {
        const cells = setupMakeClickable(1, 2);
        const cell = cells[0];
        cell.style.backgroundColor = "#cccccc";

        cell._listeners["pointerdown"]({
            preventDefault: jest.fn(),
            pointerId: 1,
            currentTarget: cell
        });

        const callsBefore = keyboard._setNotes.mock.calls.length;
        savedElementFromPoint = document.elementFromPoint;
        document.elementFromPoint = jest.fn(() => null);

        cell._listeners["pointermove"]({ clientX: 999, clientY: 999, currentTarget: cell });

        document.elementFromPoint = savedElementFromPoint;
        expect(keyboard._setNotes.mock.calls.length).toBe(callsBefore);
    });

    test("pointerup resets drag state so subsequent pointermove does nothing", () => {
        const cells = setupMakeClickable(1, 2);
        const cell = cells[0];
        const adjacent = cells[1];
        cell.style.backgroundColor = "#cccccc";
        adjacent.style.backgroundColor = "#cccccc";

        cell._listeners["pointerdown"]({
            preventDefault: jest.fn(),
            pointerId: 1,
            currentTarget: cell
        });
        cell._listeners["pointerup"]();

        const callsBefore = keyboard._setNotes.mock.calls.length;
        savedElementFromPoint = document.elementFromPoint;
        document.elementFromPoint = jest.fn(() => adjacent);

        cell._listeners["pointermove"]({ clientX: 50, clientY: 10, currentTarget: cell });

        document.elementFromPoint = savedElementFromPoint;
        expect(keyboard._setNotes.mock.calls.length).toBe(callsBefore);
    });

    test("pointercancel resets drag state so subsequent pointermove does nothing", () => {
        const cells = setupMakeClickable(1, 2);
        const cell = cells[0];
        const adjacent = cells[1];
        cell.style.backgroundColor = "#cccccc";

        cell._listeners["pointerdown"]({
            preventDefault: jest.fn(),
            pointerId: 1,
            currentTarget: cell
        });
        cell._listeners["pointercancel"]();

        const callsBefore = keyboard._setNotes.mock.calls.length;
        savedElementFromPoint = document.elementFromPoint;
        document.elementFromPoint = jest.fn(() => adjacent);

        cell._listeners["pointermove"]({ clientX: 50, clientY: 10, currentTarget: cell });

        document.elementFromPoint = savedElementFromPoint;
        expect(keyboard._setNotes.mock.calls.length).toBe(callsBefore);
    });
});
