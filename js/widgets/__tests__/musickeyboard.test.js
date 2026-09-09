global.localStorage = {
    beginnerMode: "false"
};
global._ = x => x;
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
global.last = arr => arr[arr.length - 1];
global.PITCHES2 = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
global.SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];

const musicutils = require("../../utils/musicutils.js");
Object.assign(global, musicutils);
global.debugLog = jest.fn();

const ManagedTimer = require("../../utils/ManagedTimer");
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
    let originalI18nSolfege;

    beforeEach(() => {
        document.body.innerHTML = '<div id="wheelDivptm"></div><div id="addnotes"></div>';
        document.getElementById("addnotes").getBoundingClientRect = () => ({ x: 0, y: 0 });

        originalDocById = global.docById;
        originalPlatformColor = global.platformColor;
        originalSlicePath = global.slicePath;
        originalWheelnav = global.wheelnav;
        originalTranslate = global._;
        originalI18nSolfege = global.i18nSolfege;

        global.docById = id => document.getElementById(id);
        global.platformColor = {
            paletteColors: { pitch: ["#000", "#fff"] },
            exitWheelcolors: ["#000", "#fff"],
            pitchWheelcolors: ["#000", "#fff"],
            blockLabelsWheelcolors: ["#000", "#fff"]
        };
        global.slicePath = () => ({
            DonutSlice: jest.fn(),
            DonutSliceCustomization: () => ({})
        });
        global._ = value => value;
        global.i18nSolfege = val => val;
        global.wheelnav = function () {
            this.raphael = {};
            this.navItems = [];
            this.selectedNavItemIndex = 0;
            this.createWheel = labels => {
                this.navItems = labels.map(() => ({
                    navigateFunction: null,
                    setTooltip: jest.fn(),
                    sliceSelectedAttr: {},
                    sliceHoverAttr: {},
                    titleSelectedAttr: {},
                    titleHoverAttr: {},
                    navItem: { hide: jest.fn(), show: jest.fn() }
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
        global.i18nSolfege = originalI18nSolfege;
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
            [1, ["solfege", { value: "do" }], 0, 0, [0]],
            [2, ["number", { value: 4 }], 0, 0, [0]]
        ]);
    });

    test("adds next sequential pitch when layout contains existing pitch rows and inherits octave", () => {
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
            { noteName: "do", noteOctave: 5, blockNumber: 100001 },
            { noteName: "hertz", noteOctave: 440, blockNumber: 100002 }
        ];

        keyboard._createAddRowPieSubmenu();

        expect(() => keyboard._menuWheel.navItems[0].navigateFunction()).not.toThrow();
        // After 'do', next pitch in chromatic solfege is 'do♯', and octave 5 is inherited from previous pitch
        expect(loadNewBlocks).toHaveBeenCalledWith([
            [0, ["pitch", {}], 0, 0, [null, 1, 2, null]],
            [1, ["solfege", { value: "do♯" }], 0, 0, [0]],
            [2, ["number", { value: 5 }], 0, 0, [0]]
        ]);
    });

    test("increments octave when rolling over from the last pitch label", () => {
        const loadNewBlocks = jest.fn();
        const keyboard = new MusicKeyboard({
            canvas: { width: 800, height: 600 },
            getStageScale: () => 1,
            blocks: {
                blockList: [],
                loadNewBlocks
            }
        });

        // 'ti' is the 12th / last pitch label in default solfege scale
        keyboard.layout = [{ noteName: "ti", noteOctave: 4, blockNumber: 100001 }];

        keyboard._createAddRowPieSubmenu();

        expect(() => keyboard._menuWheel.navItems[0].navigateFunction()).not.toThrow();
        // When rolling over after 'ti', next is 'do' and octave increments from 4 to 5
        expect(loadNewBlocks).toHaveBeenCalledWith([
            [0, ["pitch", {}], 0, 0, [null, 1, 2, null]],
            [1, ["solfege", { value: "do" }], 0, 0, [0]],
            [2, ["number", { value: 5 }], 0, 0, [0]]
        ]);
    });

    test("logs via debugLog for unrecognized label and when no valid aboveBlock exists", () => {
        const loadNewBlocks = jest.fn();
        const keyboard = new MusicKeyboard({
            canvas: { width: 800, height: 600 },
            getStageScale: () => 1,
            blocks: {
                blockList: [],
                loadNewBlocks
            },
            errorMsg: jest.fn()
        });

        keyboard.layout = [
            { noteName: "hertz", noteOctave: 392, blockNumber: 100001 },
            { noteName: "hertz", noteOctave: 436, blockNumber: 100002 }
        ];

        keyboard._createAddRowPieSubmenu();

        // Force selectedNavItemIndex out of bounds so VALUESLABEL[index] is undefined,
        // hitting the default case in the switch statement.
        keyboard._menuWheel.selectedNavItemIndex = 5;
        global.debugLog.mockClear();

        expect(() => keyboard._menuWheel.navItems[0].navigateFunction()).not.toThrow();

        // The default case logs the unrecognized label.
        expect(global.debugLog).toHaveBeenCalledWith("Nothing to do for undefined");
        // All blockNumbers >= FAKEBLOCKNUMBER so else-branch fires too.
        expect(global.debugLog).toHaveBeenCalledWith(
            "Could not find anywhere to insert new block."
        );
    });

    test("initializes noteToKeyMap and safely updates when inserting a new note block via pie menu", () => {
        jest.useFakeTimers();
        global.FIXEDSOLFEGE1 = { "do♯": "C#" };
        const blockList = [{ connections: [null, null] }];
        const loadNewBlocks = jest.fn().mockImplementation(() => {
            blockList.push({ connections: [null, null] });
            return [blockList.length - 1];
        });
        const keyboard = new MusicKeyboard({
            canvas: { width: 800, height: 600 },
            getStageScale: () => 1,
            refreshCanvas: jest.fn(),
            turtles: {
                ithTurtle: () => ({ singer: { keySignature: "C" } })
            },
            blocks: {
                blockList: blockList,
                loadNewBlocks,
                adjustExpandableClampBlock: jest.fn()
            }
        });

        expect(keyboard.noteToKeyMap).toBeDefined();
        expect(typeof keyboard.noteToKeyMap).toBe("object");

        keyboard.layout = [
            { noteName: "do", noteOctave: 4, blockNumber: 0, voice: 0, objId: "cell-0" }
        ];

        keyboard._addNotesBlockBetween = jest.fn();
        keyboard._sortLayout = jest.fn();
        keyboard._createKeyboard = jest.fn();
        keyboard._createTable = jest.fn().mockImplementation(() => {
            if (keyboard.layout.length > 0) {
                keyboard.layout[keyboard.layout.length - 1].objId = "cell-new";
            }
        });
        keyboard._syncLayouts = jest.fn();

        keyboard._createAddRowPieSubmenu();
        keyboard._menuWheel.selectedNavItemIndex = 0;
        keyboard._menuWheel.navItems[0].navigateFunction();

        expect(() => jest.advanceTimersByTime(500)).not.toThrow();
        expect(keyboard.noteToKeyMap).toBeDefined();
        expect(keyboard.noteToKeyMap["do♯4"]).toBe("cell-new");
        expect(keyboard.noteToKeyMap["C#4"]).toBe("cell-new");
        jest.useRealTimers();
    });

    test("safely handles if noteToKeyMap is null or undefined when inserting a new note block", () => {
        jest.useFakeTimers();
        global.FIXEDSOLFEGE1 = { "do♯": "C#" };
        const blockList = [{ connections: [null, null] }];
        const loadNewBlocks = jest.fn().mockImplementation(() => {
            blockList.push({ connections: [null, null] });
            return [blockList.length - 1];
        });
        const keyboard = new MusicKeyboard({
            canvas: { width: 800, height: 600 },
            getStageScale: () => 1,
            refreshCanvas: jest.fn(),
            turtles: {
                ithTurtle: () => ({ singer: { keySignature: "C" } })
            },
            blocks: {
                blockList: blockList,
                loadNewBlocks,
                adjustExpandableClampBlock: jest.fn()
            }
        });

        keyboard.noteToKeyMap = null;
        keyboard.layout = [
            { noteName: "do", noteOctave: 4, blockNumber: 0, voice: 0, objId: "cell-0" }
        ];

        keyboard._addNotesBlockBetween = jest.fn();
        keyboard._sortLayout = jest.fn();
        keyboard._createKeyboard = jest.fn();
        keyboard._createTable = jest.fn().mockImplementation(() => {
            if (keyboard.layout.length > 0) {
                keyboard.layout[keyboard.layout.length - 1].objId = "cell-new";
            }
        });
        keyboard._syncLayouts = jest.fn();

        keyboard._createAddRowPieSubmenu();
        keyboard._menuWheel.selectedNavItemIndex = 0;
        keyboard._menuWheel.navItems[0].navigateFunction();

        expect(() => jest.advanceTimersByTime(500)).not.toThrow();
        expect(keyboard.noteToKeyMap).toBeDefined();
        expect(keyboard.noteToKeyMap["do♯4"]).toBe("cell-new");
        expect(keyboard.noteToKeyMap["C#4"]).toBe("cell-new");
        jest.useRealTimers();
    });

    test("doMIDI populates noteToKeyMap from layout including solfege conversion", async () => {
        global.FIXEDSOLFEGE1 = { do: "C", re: "D" };
        const keyboard = new MusicKeyboard({
            canvas: { width: 800, height: 600 },
            getStageScale: () => 1,
            textMsg: jest.fn(),
            errorMsg: jest.fn()
        });

        keyboard.layout = [
            { noteName: "do", noteOctave: 4, objId: "cell-do4" },
            { noteName: "D", noteOctave: 4, objId: "cell-d4" }
        ];

        const originalRequestMIDIAccess = navigator.requestMIDIAccess;
        navigator.requestMIDIAccess = jest.fn().mockResolvedValue({ inputs: new Map() });

        keyboard.doMIDI();

        expect(keyboard.noteToKeyMap).toBeDefined();
        expect(keyboard.noteToKeyMap["do4"]).toBe("cell-do4");
        expect(keyboard.noteToKeyMap["C4"]).toBe("cell-do4");
        expect(keyboard.noteToKeyMap["D4"]).toBe("cell-d4");

        // allow promise to resolve cleanly
        await Promise.resolve();

        navigator.requestMIDIAccess = originalRequestMIDIAccess;
    });

    test("creates pie submenu and sets z-index, top position, and exit wheel correctly", () => {
        window.configureExitWheel = jest.fn();
        document.body.innerHTML =
            '<div id="wheelDivptm"></div><div id="_exitWheel"></div><div id="_tabsWheel"></div><div id="_durationWheel"></div><div id="cell-0"></div>';
        document.getElementById("cell-0").getBoundingClientRect = () => ({ x: 100, y: 400 });

        const keyboard = new MusicKeyboard({
            canvas: { width: 800, height: 600 },
            getStageScale: () => 1
        });

        expect(() => {
            keyboard._createpiesubmenu("cell-0", "0");
        }).not.toThrow();

        expect(docById("wheelDivptm").style.zIndex).toBe("10001");
        expect(docById("wheelDivptm").style.top).toBe("350px"); // min(600 - 250, 400) = 350
        expect(keyboard._exitWheel.selectedNavItemIndex).toBeNull();
        expect(keyboard._exitWheel.navItems[1].enabled).toBe(false);
        expect(keyboard._exitWheel.navItems[0].sliceSelectedAttr.cursor).toBe("pointer");
        expect(window.configureExitWheel).toHaveBeenCalledWith(keyboard._exitWheel);
    });

    test("creates column pie submenu and sets z-index, top position, and exit wheel correctly", () => {
        window.configureExitWheel = jest.fn();
        document.body.innerHTML =
            '<div id="wheelDivptm"></div><div id="_exitWheel"></div><div id="labelcol0"></div>';
        document.getElementById("labelcol0").getBoundingClientRect = () => ({ x: 100, y: 400 });

        const keyboard = new MusicKeyboard({
            canvas: { width: 800, height: 600 },
            getStageScale: () => 1,
            blocks: {
                blockList: [{ connections: [null, 1, null] }, { value: 392 }]
            }
        });
        keyboard.layout = [{ noteName: "hertz", noteOctave: 392, blockNumber: 0 }];

        expect(() => {
            keyboard._createColumnPieSubmenu(0, "synthsblocks");
        }).not.toThrow();

        expect(docById("wheelDivptm").style.zIndex).toBe("10001");
        expect(docById("wheelDivptm").style.top).toBe("300px"); // min(600 - 300, 400) = 300
        expect(keyboard._exitWheel.selectedNavItemIndex).toBeNull();
        expect(keyboard._exitWheel.navItems[1].enabled).toBe(false);
        expect(keyboard._exitWheel.navItems[0].sliceSelectedAttr.cursor).toBe("pointer");
        expect(window.configureExitWheel).toHaveBeenCalledWith(keyboard._exitWheel);
    });
    test("creates keyboard without throwing and sets up idContainer", () => {
        global.PITCHES3 = ["C", "D", "E", "F", "G", "A", "B"];
        global.SHARP = "♯";
        global.FLAT = "♭";
        const keyboard = new MusicKeyboard({
            canvas: { width: 800, height: 600 },
            getStageScale: () => 1
        });

        keyboard.keyboardDiv = document.createElement("div");
        document.body.appendChild(keyboard.keyboardDiv);

        keyboard.displayLayout = [
            { noteName: "hertz", noteOctave: 392, blockNumber: 100001 },
            { noteName: "drum", noteOctave: 436, blockNumber: 100002 },
            { noteName: "C", noteOctave: 4, blockNumber: 100003 },
            { noteName: "C#", noteOctave: 4, blockNumber: 100004 },
            { noteName: "Db", noteOctave: 4, blockNumber: 100005 }
        ];
        keyboard.layout = keyboard.displayLayout;
        keyboard.noteNames = [];
        keyboard.octaves = [];
        keyboard.loadHandler = jest.fn();
        keyboard.addKeyboardShortcuts = jest.fn();

        expect(() => keyboard._createKeyboard()).not.toThrow();
        expect(keyboard.idContainer.length).toBeGreaterThan(0);

        document.body.removeChild(keyboard.keyboardDiv);
        delete global.PITCHES3;
        delete global.SHARP;
        delete global.FLAT;
    });
});

describe("MusicKeyboard widgetWindow.onclose & event cleanup", () => {
    let originalWidgetWindows;
    let originalPlatformColor;
    let originalTranslate;
    let originalWheelnav;
    let originalNoteToFrequency;
    let originalConvertFromSolfege;
    let originalPitches;
    let originalPitches2;
    let originalSolfegeNames;
    let mockActivity;

    beforeEach(() => {
        originalWidgetWindows = global.window.widgetWindows;
        originalPlatformColor = global.platformColor;
        originalTranslate = global._;
        originalWheelnav = global.wheelnav;
        originalNoteToFrequency = global.noteToFrequency;
        originalConvertFromSolfege = global.convertFromSolfege;
        originalPitches = global.PITCHES;
        originalPitches2 = global.PITCHES2;
        originalSolfegeNames = global.SOLFEGENAMES;
        mockActivity = {
            turtles: {
                ithTurtle: jest.fn().mockReturnValue({
                    singer: {
                        bpm: [],
                        keySignature: "C Major",
                        movable: false
                    }
                })
            },
            logo: {
                errorMsg: jest.fn(),
                synth: {
                    inTemperament: "equal",
                    stopSound: jest.fn(),
                    trigger: jest.fn(),
                    setMasterVolume: jest.fn()
                }
            },
            canvas: {
                width: 1000,
                height: 1000
            },
            getStageScale: jest.fn().mockReturnValue(1)
        };
        global.window.widgetWindows = {
            windowFor: jest.fn().mockReturnValue({
                clear: jest.fn(),
                show: jest.fn(),
                destroy: jest.fn(),
                onclose: null,
                addButton: jest.fn().mockReturnValue({
                    onclick: null,
                    setAttribute: jest.fn(),
                    style: {
                        removeProperty: jest.fn()
                    }
                }),
                getWidgetBody: jest.fn().mockReturnValue({
                    append: jest.fn(el => document.body.appendChild(el)),
                    style: {}
                }),
                sendToCenter: jest.fn()
            })
        };
        global.Singer = {
            setSynthVolume: jest.fn(),
            masterBPM: 90
        };
        global.DEFAULTVOICE = "electronic synth";
        global.PREVIEWVOLUME = 0.5;
        global.normalizeNoteAccidentals = jest.fn(n => n.replace("𝄫", "bb").replace("♭", "b"));
        global.getNote = jest.fn().mockReturnValue(["F♭", 4]);
        global.FIXEDSOLFEGE1 = {};
        global.SHARP = "♯";
        global.FLAT = "♭";
        global.MATRIXSOLFEHEIGHT = 35;
        global.PITCHES3 = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        global.platformColor = {
            orange: "#ff5722",
            pitchWheelcolors: ["#000", "#fff"],
            blockLabelsWheelcolors: ["#000", "#fff"],
            accidentalsWheelcolors: [],
            accidentalsWheelcolorspush: "#fff"
        };
        global._ = jest.fn(str => str);
        global.docById = id =>
            document.getElementById(id) || {
                style: {},
                remove: jest.fn(),
                getBoundingClientRect: jest.fn().mockReturnValue({ x: 0, y: 0 })
            };
        global.i18nSolfege = jest.fn(str => str);
        global.slicePath = () => ({
            DonutSlice: jest.fn(),
            DonutSliceCustomization: () => ({})
        });
        global.noteToFrequency = jest.fn().mockReturnValue(261.63);
        global.convertFromSolfege = jest.fn(n => {
            if (n === "do") return "C";
            if (n === "re") return "D";
            if (n === "mi") return "E";
            if (n === "fa") return "F";
            if (n === "sol") return "G";
            if (n === "la") return "A";
            if (n === "ti") return "B";
            return n;
        });
        global.PITCHES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        global.PITCHES2 = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
        global.SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];
        global.wheelnav = function () {
            this.raphael = {};
            this.navItems = [];
            this.selectedNavItemIndex = 0;
            this.colors = [];
            this.createWheel = labels => {
                this.navItems = labels.map(() => ({
                    title: "",
                    navigateFunction: null,
                    setTooltip: jest.fn(),
                    sliceSelectedAttr: {},
                    sliceHoverAttr: {},
                    titleSelectedAttr: {},
                    titleHoverAttr: {}
                }));
            };
            this.removeWheel = jest.fn();
            this.setTooltips = jest.fn();
            this.navigateWheel = jest.fn();
        };
    });

    afterEach(() => {
        global.window.widgetWindows = originalWidgetWindows;
        global.platformColor = originalPlatformColor;
        global._ = originalTranslate;
        global.wheelnav = originalWheelnav;
        global.noteToFrequency = originalNoteToFrequency;
        global.convertFromSolfege = originalConvertFromSolfege;
        global.PITCHES = originalPitches;
        global.PITCHES2 = originalPitches2;
        global.SOLFEGENAMES = originalSolfegeNames;
    });

    test("wheel events on keyboardDiv and keyTable stop propagation", () => {
        const keyboard = new MusicKeyboard(mockActivity);
        keyboard.init();

        const wheelEvent = new Event("wheel", { bubbles: true });
        wheelEvent.stopPropagation = jest.fn();

        keyboard.keyboardDiv.dispatchEvent(wheelEvent);
        expect(wheelEvent.stopPropagation).toHaveBeenCalled();

        const domMouseScrollEvent = new Event("DOMMouseScroll", { bubbles: true });
        domMouseScrollEvent.stopPropagation = jest.fn();

        keyboard.keyTable.dispatchEvent(domMouseScrollEvent);
        expect(domMouseScrollEvent.stopPropagation).toHaveBeenCalled();
    });

    test("onclose stops sequence playback, releases active key, and stops all voices", () => {
        const keyboard = new MusicKeyboard(mockActivity);
        keyboard._keysLayout = jest.fn().mockReturnValue([]);

        keyboard.init();

        // Mock the activeKey by using pointerdown on an element
        keyboard.displayLayout = [{ noteName: "C", noteOctave: 4, voice: "electronic synth" }];
        const mockElement = {
            id: "whiteRow0",
            addEventListener: jest.fn(),
            style: {},
            setPointerCapture: jest.fn(),
            dispatchEvent: jest.fn()
        };
        keyboard.loadHandler(mockElement, 0, 100);

        const pointerDownListener = mockElement.addEventListener.mock.calls.find(
            call => call[0] === "pointerdown"
        )[1];
        pointerDownListener({ preventDefault: jest.fn(), pointerId: 1 });

        // Simulate close
        keyboard.widgetWindow.onclose();

        // 1. Playback flags reset
        expect(keyboard._stopOrCloseClicked).toBe(true);
        expect(keyboard.playingNow).toBe(false);

        // 2. Active key released
        expect(mockElement.dispatchEvent).toHaveBeenCalledWith(expect.any(Event));
        expect(mockElement.dispatchEvent.mock.calls[0][0].type).toBe("pointerup");

        // 3. Stopped all voices
        expect(mockActivity.logo.synth.stopSound).toHaveBeenCalledWith(0, "electronic synth");
    });

    test("pointerup forwards event to activeKey when released on a different key", () => {
        const keyboard = new MusicKeyboard(mockActivity);
        keyboard.displayLayout = [
            { noteName: "C", noteOctave: 4, voice: "electronic synth" },
            { noteName: "D", noteOctave: 4, voice: "electronic synth" }
        ];

        const mockElement1 = {
            id: "whiteRow0",
            addEventListener: jest.fn(),
            style: {},
            setPointerCapture: jest.fn(),
            dispatchEvent: jest.fn()
        };
        const mockElement2 = {
            id: "whiteRow1",
            addEventListener: jest.fn(),
            style: {},
            setPointerCapture: jest.fn(),
            dispatchEvent: jest.fn()
        };

        keyboard.loadHandler(mockElement1, 0, 100);
        keyboard.loadHandler(mockElement2, 1, 101);

        const pointerDown1 = mockElement1.addEventListener.mock.calls.find(
            call => call[0] === "pointerdown"
        )[1];
        const pointerUp2 = mockElement2.addEventListener.mock.calls.find(
            call => call[0] === "pointerup"
        )[1];

        // Press down on Key 1
        pointerDown1({ preventDefault: jest.fn(), pointerId: 1 });

        // Release on Key 2
        pointerUp2();

        // Key 1 should receive the pointerup event forwarded from Key 2
        expect(mockElement1.dispatchEvent).toHaveBeenCalled();
        expect(mockElement1.dispatchEvent.mock.calls[0][0].type).toBe("pointerup");
    });

    test("pointercancel forwards event to activeKey when canceled on a different key", () => {
        const keyboard = new MusicKeyboard(mockActivity);
        keyboard.displayLayout = [
            { noteName: "C", noteOctave: 4, voice: "electronic synth" },
            { noteName: "D", noteOctave: 4, voice: "electronic synth" }
        ];

        const mockElement1 = {
            id: "whiteRow0",
            addEventListener: jest.fn(),
            style: {},
            setPointerCapture: jest.fn(),
            dispatchEvent: jest.fn()
        };
        const mockElement2 = {
            id: "whiteRow1",
            addEventListener: jest.fn(),
            style: {},
            setPointerCapture: jest.fn(),
            dispatchEvent: jest.fn()
        };

        keyboard.loadHandler(mockElement1, 0, 100);
        keyboard.loadHandler(mockElement2, 1, 101);

        const pointerDown1 = mockElement1.addEventListener.mock.calls.find(
            call => call[0] === "pointerdown"
        )[1];
        const pointerCancel2 = mockElement2.addEventListener.mock.calls.find(
            call => call[0] === "pointercancel"
        )[1];

        // Press down on Key 1
        pointerDown1({ preventDefault: jest.fn(), pointerId: 1 });

        // Cancel on Key 2
        pointerCancel2();

        // Key 1 should receive the pointerup event forwarded from Key 2's cancel
        expect(mockElement1.dispatchEvent).toHaveBeenCalled();
        expect(mockElement1.dispatchEvent.mock.calls[0][0].type).toBe("pointerup");
    });

    test("__pitchPreview triggers synth with normalized note", () => {
        document.body.innerHTML = '<div id="wheelDivptm"></div>';
        const keyboard = new MusicKeyboard(mockActivity);
        mockActivity.blocks = {
            blockList: {
                100004: {
                    connections: [null, "dummyChildBlockId", "dummyOctaveBlockId"]
                },
                dummyChildBlockId: {
                    value: "C4",
                    text: { text: "" },
                    container: { children: [], setChildIndex: jest.fn() },
                    updateCache: jest.fn(),
                    blocks: { setPitchOctave: jest.fn() },
                    connections: ["dummyConnection0"]
                },
                dummyOctaveBlockId: {
                    value: 4
                }
            }
        };

        keyboard.init();
        keyboard.layout = [{ noteName: "C", noteOctave: 4, blockNumber: 100004 }];
        keyboard.displayLayout = [{ noteName: "C", noteOctave: 4, blockNumber: 100004 }];
        keyboard._createColumnPieSubmenu(0, "pitchblocks");

        // Set titles of mock wheel items
        keyboard._pitchWheel.navItems[0].title = "do";
        keyboard._accidentalsWheel.navItems[0].title = "♭";
        keyboard._octavesWheel.navItems[0].title = "4";

        keyboard._pitchWheel.selectedNavItemIndex = 0;
        keyboard._accidentalsWheel.selectedNavItemIndex = 0;
        keyboard._octavesWheel.selectedNavItemIndex = 0;

        // Call the navigate function
        keyboard._pitchWheel.navItems[0].navigateFunction();

        // Verify normalization and trigger
        expect(global.normalizeNoteAccidentals).toHaveBeenCalledWith("F♭4");
        expect(mockActivity.logo.synth.trigger).toHaveBeenCalled();
    });

    test("synchronizes layout and displayLayout correctly, preserving real block numbers", () => {
        const keyboard = new MusicKeyboard(mockActivity);
        keyboard.noteNames = ["do", "sol"];
        keyboard.octaves = [5, 4];
        keyboard._rowBlocks = [44, 47];
        keyboard.instruments = ["guitar", "guitar"];

        mockActivity.blocks = {
            blockList: {
                44: { name: "pitch", connections: [null, 45, 46, null] },
                45: { value: "do" },
                46: { value: 5 },
                47: { name: "pitch", connections: [null, 48, 49, null] },
                48: { value: "sol" },
                49: { value: 4 }
            },
            adjustDocks: jest.fn(),
            clampBlocksToCheck: [],
            adjustExpandableClampBlock: jest.fn(),
            sendStackToTrash: jest.fn()
        };

        keyboard.init();

        // Check if layout was synchronized correctly
        expect(keyboard.displayLayout.length).toBeGreaterThan(2);

        // Find C5 (do 5) in displayLayout
        const c5Item = keyboard.displayLayout.find(
            item => item.noteName === "C" && item.noteOctave === 5
        );
        expect(c5Item).toBeDefined();
        expect(c5Item.blockNumber).toBe(44); // Real blockNumber should be preserved

        const layoutC5Item = keyboard.layout.find(
            item => item.noteName === "do" && item.noteOctave === 5
        );
        expect(layoutC5Item).toBeDefined();
        expect(layoutC5Item.blockNumber).toBe(44);
    });

    test("handles sorting tie-breakers based on blockNumber", () => {
        const keyboard = new MusicKeyboard(mockActivity);
        // Add two notes with identical frequency (e.g. C4)
        keyboard.noteNames = ["do", "do"];
        keyboard.octaves = [4, 4];
        keyboard._rowBlocks = [99, 44]; // 44 is smaller, so it should sort first
        keyboard.instruments = ["guitar", "guitar"];

        mockActivity.blocks = {
            blockList: {
                44: { name: "pitch", connections: [null, 45, 46, null] },
                45: { value: "do" },
                46: { value: 4 },
                99: { name: "pitch", connections: [null, 100, 101, null] },
                100: { value: "do" },
                101: { value: 4 }
            },
            adjustDocks: jest.fn(),
            clampBlocksToCheck: [],
            adjustExpandableClampBlock: jest.fn(),
            sendStackToTrash: jest.fn()
        };

        keyboard.init();

        const c4Item = keyboard.displayLayout.find(
            item => item.noteName === "C" && item.noteOctave === 4
        );
        expect(c4Item).toBeDefined();
        expect(c4Item.blockNumber).toBe(44); // 44 should be kept as the blockNumber because it was sorted first
    });

    test("handles multi-octave gaps correctly in layout synchronization", () => {
        const keyboard = new MusicKeyboard(mockActivity);
        // E4 (mi 4) and C6 (do 6)
        keyboard.noteNames = ["mi", "do"];
        keyboard.octaves = [4, 6];
        keyboard._rowBlocks = [44, 47];
        keyboard.instruments = ["guitar", "guitar"];

        mockActivity.blocks = {
            blockList: {
                44: { name: "pitch", connections: [null, 45, 46, null] },
                45: { value: "mi" },
                46: { value: 4 },
                47: { name: "pitch", connections: [null, 48, 49, null] },
                48: { value: "do" },
                49: { value: 6 }
            },
            adjustDocks: jest.fn(),
            clampBlocksToCheck: [],
            adjustExpandableClampBlock: jest.fn(),
            sendStackToTrash: jest.fn()
        };

        keyboard.init();

        // Find E4 (mi 4) and C6 (do 6) in displayLayout
        const e4Item = keyboard.displayLayout.find(
            item => item.noteName === "E" && item.noteOctave === 4
        );
        const c6Item = keyboard.displayLayout.find(
            item => item.noteName === "C" && item.noteOctave === 6
        );
        expect(e4Item).toBeDefined();
        expect(c6Item).toBeDefined();

        // Verify that middle octave (e.g. C5) is filled in the displayLayout
        const c5Item = keyboard.displayLayout.find(
            item => item.noteName === "C" && item.noteOctave === 5
        );
        expect(c5Item).toBeDefined();

        // Verify that octave 4 notes (e.g. G4) are filled with octave 4
        const g4Item = keyboard.displayLayout.find(
            item => item.noteName === "G" && item.noteOctave === 4
        );
        expect(g4Item).toBeDefined();
    });

    test("gives every padded key a voice when the keyboard holds a single note", () => {
        const keyboard = new MusicKeyboard(mockActivity);
        // A keyboard built from exactly one pitch block: G4 (sol 4).
        keyboard.noteNames = ["sol"];
        keyboard.octaves = [4];
        keyboard._rowBlocks = [44];
        keyboard.instruments = ["guitar"];

        mockActivity.blocks = {
            blockList: {
                44: { name: "pitch", connections: [null, 45, 46, null] },
                45: { value: "sol" },
                46: { value: 4 }
            },
            adjustDocks: jest.fn(),
            clampBlocksToCheck: [],
            adjustExpandableClampBlock: jest.fn(),
            sendStackToTrash: jest.fn()
        };

        keyboard.init();

        // The keys generated above the single note used to be created without a
        // voice, which made them silent and threw when they were pressed. Every
        // key in the padded octave should carry the source note's voice.
        expect(keyboard.displayLayout).toHaveLength(13);
        expect(keyboard.displayLayout.every(item => item.voice === "guitar")).toBe(true);

        // The padded keys should carry the voice of the note they were built from.
        const c5Item = keyboard.displayLayout.find(
            item => item.noteName === "C" && item.noteOctave === 5
        );
        expect(c5Item).toBeDefined();
        expect(c5Item.voice).toBe("guitar");
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
        global.docById = jest.fn(() => ({ getAttribute: () => "0.5", remove: jest.fn() }));
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
            keyboard._syncLayouts = jest.fn();
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
            const adjustDocks = jest.fn();
            const refreshCanvas = jest.fn();
            keyboard.blockNo = 2;
            keyboard.activity = {
                blocks: {
                    blockList,
                    sendStackToTrash,
                    adjustDocks,
                    clampBlocksToCheck: []
                },
                refreshCanvas
            };

            keyboard._removePitchBlock(10);

            expect(blockList[2].connections[1]).toBe(20);
            expect(blockList[20].connections[0]).toBe(2);
            expect(blockList[10].connections[2]).toBeNull();
            expect(sendStackToTrash).toHaveBeenCalledWith(blockList[10]);
            expect(adjustDocks).toHaveBeenCalledWith(2, true);
            expect(keyboard.activity.blocks.clampBlocksToCheck).toEqual([[2, 0]]);
            expect(refreshCanvas).toHaveBeenCalled();
        });
    });

    describe("_roundNoteDuration", () => {
        test("rounds to the nearest sixteenth in normal mode", () => {
            const keyboard = new MusicKeyboard({});

            expect(keyboard._roundNoteDuration(0.3)).toBeCloseTo(0.3125);
        });

        test("rounds to the nearest eighth in beginner mode", () => {
            const savedBeginnerMode = global.localStorage.beginnerMode;
            global.localStorage.beginnerMode = "true";
            const keyboard = new MusicKeyboard({});
            global.localStorage.beginnerMode = savedBeginnerMode;

            expect(keyboard._roundNoteDuration(0.2)).toBeCloseTo(0.25);
        });

        test("clamps a rounded-to-zero duration to the minimum positive value", () => {
            const keyboard = new MusicKeyboard({});

            expect(keyboard._roundNoteDuration(0.01)).toBe(0.125);
        });

        test("returns a positive duration for a negative input", () => {
            const keyboard = new MusicKeyboard({});

            expect(keyboard._roundNoteDuration(-0.3)).toBeCloseTo(0.3125);
        });
    });

    describe("_updatePlayButtonIcon", () => {
        test("shows a stop icon while playing", () => {
            const keyboard = new MusicKeyboard({});
            const cell = document.createElement("td");

            keyboard._updatePlayButtonIcon(cell, true);

            const img = cell.querySelector("img");
            expect(img.src).toContain("header-icons/stop-button.svg");
            expect(img.title).toBe("Stop");
            expect(img.alt).toBe("Stop");
        });

        test("shows a play icon when stopped", () => {
            const keyboard = new MusicKeyboard({});
            const cell = document.createElement("td");

            keyboard._updatePlayButtonIcon(cell, false);

            const img = cell.querySelector("img");
            expect(img.src).toContain("header-icons/play-button.svg");
            expect(img.title).toBe("Play");
            expect(img.alt).toBe("Play");
        });
    });

    describe("Web MIDI cleanup on widget close", () => {
        test("resets onmidimessage handlers on all connected MIDI inputs when widgetWindow.onclose is called", () => {
            const mockInput1 = { onmidimessage: jest.fn() };
            const mockInput2 = { onmidimessage: jest.fn() };
            const mockMidiAccess = {
                inputs: [mockInput1, mockInput2]
            };

            const mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                destroy: jest.fn(),
                addButton: jest.fn().mockReturnValue({ onclick: null, setAttribute: jest.fn() }),
                addInputButton: jest.fn().mockReturnValue({
                    addEventListener: jest.fn(),
                    classList: { add: jest.fn() }
                }),
                getWidgetBody: jest.fn().mockReturnValue({
                    append: jest.fn(),
                    style: {}
                })
            };

            const origWidgetWindows = global.window.widgetWindows;
            global.window.widgetWindows = {
                windowFor: jest.fn().mockReturnValue(mockWidgetWindow)
            };

            try {
                const mockActivity = {
                    turtles: {
                        ithTurtle: jest.fn().mockReturnValue({
                            singer: { bpm: [90] }
                        })
                    },
                    logo: { synth: { stopSound: jest.fn() } }
                };

                const keyboard = new MusicKeyboard(mockActivity);
                keyboard._createWidgetWindow();

                keyboard.midiAccess = mockMidiAccess;
                keyboard.midiON = true;

                // Trigger actual onclose handler registered on widgetWindow
                mockWidgetWindow.onclose();

                expect(mockInput1.onmidimessage).toBeNull();
                expect(mockInput2.onmidimessage).toBeNull();
                expect(keyboard.midiON).toBe(false);
                expect(mockWidgetWindow.destroy).toHaveBeenCalled();
            } finally {
                global.window.widgetWindows = origWidgetWindows;
            }
        });

        test("doMIDI stores midiAccess reference when requestMIDIAccess succeeds", async () => {
            const mockInput = { onmidimessage: null };
            const mockMidiAccess = {
                inputs: new Map([["1", mockInput]])
            };

            const origRequestMIDIAccess = global.navigator.requestMIDIAccess;
            global.navigator.requestMIDIAccess = jest.fn().mockResolvedValue(mockMidiAccess);

            try {
                const keyboard = new MusicKeyboard({
                    textMsg: jest.fn()
                });
                keyboard.midiButton = { style: {} };

                keyboard.doMIDI();

                await Promise.resolve();

                expect(keyboard.midiAccess).toBe(mockMidiAccess);
                expect(mockInput.onmidimessage).toBeDefined();
            } finally {
                global.navigator.requestMIDIAccess = origRequestMIDIAccess;
            }
        });
    });
});

describe("MusicKeyboard widget timer lifecycle", () => {
    let originalManagedTimer;
    let originalDocById;

    beforeEach(() => {
        jest.useFakeTimers();
        originalManagedTimer = global.ManagedTimer;
        originalDocById = global.docById;
        global.ManagedTimer = ManagedTimer;
        global.docById = jest.fn(() => null);
    });

    afterEach(() => {
        if (originalManagedTimer === undefined) {
            delete global.ManagedTimer;
        } else {
            global.ManagedTimer = originalManagedTimer;
        }

        if (originalDocById === undefined) {
            delete global.docById;
        } else {
            global.docById = originalDocById;
        }

        jest.useRealTimers();
    });

    test("tracks widget intervals through ManagedTimer", () => {
        const keyboard = new MusicKeyboard({});
        const callback = jest.fn();

        const id = keyboard._setWidgetInterval(callback, 1000);

        expect(keyboard._timerManager).toBeInstanceOf(ManagedTimer);
        expect(keyboard._timerManager.activeIntervalCount).toBe(1);

        jest.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalledTimes(1);

        expect(keyboard._clearWidgetInterval(id)).toBe(true);
        expect(keyboard._timerManager.activeIntervalCount).toBe(0);
    });

    test("stopMetronome clears the managed interval and audio loop", () => {
        const countdownContainer = { remove: jest.fn() };
        global.docById.mockImplementation(id =>
            id === "countdownContainer" ? countdownContainer : null
        );

        const keyboard = new MusicKeyboard({});
        const intervalCallback = jest.fn();
        keyboard.tickButton = { style: { removeProperty: jest.fn() } };
        keyboard.tick = true;
        keyboard.firstNote = true;
        keyboard.metronomeON = true;
        keyboard.loopTick = { stop: jest.fn() };
        keyboard.metronomeInterval = keyboard._setWidgetInterval(intervalCallback, 1000);

        keyboard.stopMetronome();
        jest.advanceTimersByTime(1000);

        expect(keyboard.tickButton.style.removeProperty).toHaveBeenCalledWith("background");
        expect(keyboard.loopTick.stop).toHaveBeenCalledTimes(1);
        expect(countdownContainer.remove).toHaveBeenCalledTimes(1);
        expect(intervalCallback).not.toHaveBeenCalled();
        expect(keyboard.tick).toBe(false);
        expect(keyboard.firstNote).toBe(false);
        expect(keyboard.metronomeON).toBe(false);
        expect(keyboard.metronomeInterval).toBeNull();
        expect(keyboard._timerManager.activeIntervalCount).toBe(0);
    });

    test("clearWidgetTimers cancels outstanding managed timers", () => {
        const keyboard = new MusicKeyboard({});
        const firstCallback = jest.fn();
        const secondCallback = jest.fn();

        keyboard._setWidgetInterval(firstCallback, 1000);
        keyboard._setWidgetInterval(secondCallback, 1000);

        expect(keyboard._timerManager.activeIntervalCount).toBe(2);
        expect(keyboard._clearWidgetTimers()).toBe(2);

        jest.advanceTimersByTime(1000);
        expect(firstCallback).not.toHaveBeenCalled();
        expect(secondCallback).not.toHaveBeenCalled();
        expect(keyboard._timerManager.activeIntervalCount).toBe(0);
    });
});

describe("MusicKeyboard note duration rounding and key handlers", () => {
    let origBeginnerMode;

    beforeEach(() => {
        origBeginnerMode = localStorage.beginnerMode;
    });

    afterEach(() => {
        if (origBeginnerMode === undefined) {
            delete localStorage.beginnerMode;
        } else {
            localStorage.beginnerMode = origBeginnerMode;
        }
    });

    test("rounds raw note durations to 1/16th grid in normal mode", () => {
        delete localStorage.beginnerMode;
        const keyboard = new MusicKeyboard({});

        // 0.26s -> 0.25s (nearest 1/16th)
        expect(keyboard._roundNoteDuration(0.26)).toBe(0.25);
        // 0.51s -> 0.5s
        expect(keyboard._roundNoteDuration(0.51)).toBe(0.5);
        // 0s falls back to 0.125s minimum
        expect(keyboard._roundNoteDuration(0)).toBe(0.125);
        // negative durations convert to positive
        expect(keyboard._roundNoteDuration(-0.5)).toBe(0.5);
    });

    test("rounds raw note durations to 1/8th grid in beginner mode", () => {
        localStorage.beginnerMode = "true";
        const keyboard = new MusicKeyboard({});

        // 0.26s -> 0.25s (nearest 1/8th)
        expect(keyboard._roundNoteDuration(0.26)).toBe(0.25);
        // 0.19s -> 0.25s (rounded to 2/8)
        expect(keyboard._roundNoteDuration(0.19)).toBe(0.25);
        // 0s falls back to 0.125s minimum
        expect(keyboard._roundNoteDuration(0)).toBe(0.125);
    });

    test("caches and restores document key handlers safely", () => {
        const keyboard = new MusicKeyboard({});
        const dummyKeyDown = jest.fn();
        const dummyKeyUp = jest.fn();

        document.onkeydown = dummyKeyDown;
        document.onkeyup = dummyKeyUp;

        // First cache
        keyboard._cacheDocumentKeyHandlers();
        expect(keyboard._savedDocumentOnKeyDown).toBe(dummyKeyDown);
        expect(keyboard._savedDocumentOnKeyUp).toBe(dummyKeyUp);

        // Re-caching should not overwrite original
        document.onkeydown = jest.fn();
        keyboard._cacheDocumentKeyHandlers();
        expect(keyboard._savedDocumentOnKeyDown).toBe(dummyKeyDown);

        // Restore
        keyboard._restoreDocumentKeyHandlers();
        expect(document.onkeydown).toBe(dummyKeyDown);
        expect(document.onkeyup).toBe(dummyKeyUp);
        expect(keyboard._savedDocumentOnKeyDown).toBeUndefined();
        expect(keyboard._savedDocumentOnKeyUp).toBeUndefined();
    });

    test("handles fallback timer calls when ManagedTimer is null", () => {
        jest.useFakeTimers();
        const keyboard = new MusicKeyboard({});
        keyboard._timerManager = null;

        const callback = jest.fn();
        const id = keyboard._setWidgetInterval(callback, 500);

        jest.advanceTimersByTime(500);
        expect(callback).toHaveBeenCalledTimes(1);

        expect(keyboard._clearWidgetInterval(id)).toBe(true);
        jest.useRealTimers();
    });
});

describe("MusicKeyboard sequencer matrix, note tracking, and chord grouping", () => {
    let activity;
    let keyboard;

    beforeEach(() => {
        activity = {
            turtles: {
                ithTurtle: jest.fn().mockReturnValue({
                    singer: {
                        bpm: [],
                        keySignature: "C Major",
                        movable: false
                    }
                })
            },
            logo: {
                errorMsg: jest.fn(),
                synth: {
                    inTemperament: "equal",
                    stopSound: jest.fn(),
                    trigger: jest.fn(),
                    setMasterVolume: jest.fn()
                }
            },
            canvas: {
                width: 1000,
                height: 1000
            },
            getStageScale: jest.fn().mockReturnValue(1)
        };

        global.docById = jest.fn();
        global.resolveSynthNoteName = jest.fn((name, oct) => `${name}${oct}`);
        global.platformColor = {
            orange: "#ff5722",
            selectorBackground: "#eeeeee"
        };
        global.FIXEDSOLFEGE1 = {};
        global.SHARP = "♯";
        global.FLAT = "♭";

        keyboard = new MusicKeyboard(activity);
        keyboard.layout = [
            { noteName: "c", noteOctave: "4", blockNumber: 1 },
            { noteName: "e", noteOctave: "4", blockNumber: 2 },
            { noteName: "g", noteOctave: "4", blockNumber: 3 }
        ];
        keyboard.displayLayout = [
            { objId: "obj1", voice: "electronic synth" },
            { objId: "obj2", voice: "electronic synth" },
            { objId: "obj3", voice: "electronic synth" }
        ];
        keyboard.instruments = ["electronic synth"];
    });

    describe("processSelected chord and polyphonic grouping engine", () => {
        test("sorts _notesPlayed chronologically by startTime and groups coincident chord notes", () => {
            keyboard._notesPlayed = [
                {
                    startTime: 200,
                    noteOctave: "g4",
                    objId: "obj3",
                    duration: 0.5,
                    voice: "synth",
                    blockNumber: 3
                },
                {
                    startTime: 0,
                    noteOctave: "c4",
                    objId: "obj1",
                    duration: 1.0,
                    voice: "synth",
                    blockNumber: 1
                },
                {
                    startTime: 0,
                    noteOctave: "e4",
                    objId: "obj2",
                    duration: 1.0,
                    voice: "synth",
                    blockNumber: 2
                },
                {
                    startTime: 100,
                    noteOctave: "d4",
                    objId: "obj1",
                    duration: 0.5,
                    voice: "synth",
                    blockNumber: 1
                }
            ];

            keyboard.processSelected();

            // Notes played must be sorted by startTime
            expect(keyboard._notesPlayed[0].startTime).toBe(0);
            expect(keyboard._notesPlayed[1].startTime).toBe(0);
            expect(keyboard._notesPlayed[2].startTime).toBe(100);
            expect(keyboard._notesPlayed[3].startTime).toBe(200);

            // Verify coincident notes at startTime 0 were grouped into a single chord for playback
            global.docById = jest.fn(() => ({ style: {} }));
            keyboard.playButton = document.createElement("div");
            keyboard._playChord = jest.fn();
            keyboard.playOne = jest.fn();
            keyboard.bpm = 90;

            keyboard.playAll();

            expect(keyboard._playChord).toHaveBeenCalledWith(["c4", "e4"], expect.any(Array), [
                "synth",
                "synth"
            ]);
            expect(keyboard.playOne).toHaveBeenCalledWith(
                1,
                expect.any(Number),
                keyboard.playButton
            );
        });

        test("safely handles empty _notesPlayed array without triggering synth playback", () => {
            keyboard._notesPlayed = [];

            keyboard.processSelected();

            expect(keyboard._notesPlayed).toEqual([]);

            // Verify downstream playback aborts cleanly when selectedNotes is empty
            keyboard.playAll();
            expect(activity.logo.synth.trigger).not.toHaveBeenCalled();
        });
    });

    describe("_setNotes column note and rest matrix scanner", () => {
        test("scans column cells and triggers _setNoteCell for each active cell", () => {
            const mockColCell = {
                getAttribute: jest.fn(attr => (attr === "start" ? "500" : "0.5"))
            };
            const cell0 = { style: { backgroundColor: "black" } };
            const cell1 = { style: { backgroundColor: "white" } };
            const cell2 = { style: { backgroundColor: "black" } };

            const mockRow0 = { cells: [cell0] };
            const mockRow1 = { cells: [cell1] };
            const mockRow2 = { cells: [cell2] };

            global.docById = jest.fn(id => {
                if (id === "cells-0") return mockColCell;
                if (id === "mkb0") return mockRow0;
                if (id === "mkb1") return mockRow1;
                if (id === "mkb2") return mockRow2;
                if (id === "0:0") return { getAttribute: () => "0.5" };
                if (id === "2:0") return { getAttribute: () => "0.5" };
                return null;
            });

            keyboard._setNoteCell = jest.fn();
            keyboard._notesPlayed = [
                { startTime: 500, noteOctave: "old" },
                { startTime: 1000, noteOctave: "keep" }
            ];

            keyboard._setNotes(0, true);

            expect(keyboard._notesPlayed).toEqual([{ startTime: 1000, noteOctave: "keep" }]);
            expect(keyboard._setNoteCell).toHaveBeenCalledTimes(2);
            expect(keyboard._setNoteCell).toHaveBeenCalledWith(0, 0, "500", true);
            expect(keyboard._setNoteCell).toHaveBeenCalledWith(2, 0, "500", true);
        });

        test("inserts a rest note when no cells in column are marked (silence)", () => {
            const mockColCell = {
                getAttribute: jest.fn(attr =>
                    attr === "start" ? "300" : attr === "dur" ? "0.25" : null
                )
            };
            const cell0 = { style: { backgroundColor: "white" } };
            const cell1 = { style: { backgroundColor: "white" } };
            const cell2 = { style: { backgroundColor: "white" } };

            global.docById = jest.fn(id => {
                if (id === "cells-1") return mockColCell;
                if (id === "mkb0") return { cells: [null, cell0] };
                if (id === "mkb1") return { cells: [null, cell1] };
                if (id === "mkb2") return { cells: [null, cell2] };
                return null;
            });

            keyboard._notesPlayed = [];

            keyboard._setNotes(1, false);

            expect(keyboard._notesPlayed).toHaveLength(1);
            expect(keyboard._notesPlayed[0]).toEqual({
                startTime: 300,
                noteOctave: "R",
                objId: null,
                duration: 0.25
            });
        });
    });

    describe("_setNoteCell note formatting and synth playback", () => {
        test("resolves standard pitch and appends note to _notesPlayed and triggers synth audio", () => {
            const mockCellElem = {
                getAttribute: jest.fn(attr => (attr === "alt" ? "0.5" : null))
            };
            global.docById = jest.fn(id => (id === "0:0" ? mockCellElem : null));

            keyboard._notesPlayed = [];

            // j = 0 maps to layout[3 - 0 - 1] = layout[2] = g4
            keyboard._setNoteCell(0, 0, "100", true);

            expect(keyboard._notesPlayed).toHaveLength(1);
            expect(keyboard._notesPlayed[0]).toEqual({
                startTime: 100,
                noteOctave: "g4",
                blockNumber: 3,
                duration: 0.5,
                objId: "obj3",
                voice: "electronic synth"
            });

            expect(activity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                "g4",
                "0.5",
                "electronic synth",
                null,
                null
            );
        });

        test("handles hertz frequency note without synth trigger when playNote is false", () => {
            keyboard.layout = [{ noteName: "hertz", noteOctave: 440, blockNumber: 10 }];
            keyboard.displayLayout = [{ objId: "hertzObj", voice: "electronic synth" }];

            const mockCellElem = {
                getAttribute: jest.fn(attr => (attr === "alt" ? "1.0" : null))
            };
            global.docById = jest.fn(id => (id === "0:0" ? mockCellElem : null));
            keyboard._notesPlayed = [];

            keyboard._setNoteCell(0, 0, "200", false);

            expect(keyboard._notesPlayed).toHaveLength(1);
            expect(keyboard._notesPlayed[0].noteOctave).toBe(440);
            expect(activity.logo.synth.trigger).not.toHaveBeenCalled();
        });

        test("handles drum note name translating to c2", () => {
            keyboard.layout = [{ noteName: "drum", noteOctave: "snare", blockNumber: 20 }];
            keyboard.displayLayout = [{ objId: "drumObj", voice: "electronic synth" }];

            const mockCellElem = {
                getAttribute: jest.fn(attr => (attr === "alt" ? "0.25" : null))
            };
            global.docById = jest.fn(id => (id === "0:0" ? mockCellElem : null));
            keyboard._notesPlayed = [];

            keyboard._setNoteCell(0, 0, "400", true);

            expect(keyboard._notesPlayed).toHaveLength(1);
            expect(keyboard._notesPlayed[0].noteOctave).toBe("c2");
            expect(activity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                "c2",
                "0.25",
                "electronic synth",
                null,
                null
            );
        });
    });

    describe("makeClickable DOM grid event registration", () => {
        test("binds duration header click and grid cell mouse interactions", () => {
            const headerCell0 = {
                getAttribute: jest.fn(attr =>
                    attr === "id" ? "hdr0" : attr === "start" ? "0" : "1.0"
                ),
                onclick: null
            };
            const mockHeaderRow = { cells: [headerCell0] };

            const gridCell00 = {
                setAttribute: jest.fn(),
                getAttribute: jest.fn(attr => (attr === "cellColor" ? "#ffffff" : null)),
                style: { backgroundColor: "white" },
                id: "0:0",
                onmousedown: null,
                onmouseover: null,
                onmouseup: null
            };
            const mockMkbRow0 = { cells: [gridCell00] };

            global.docById = jest.fn(id => {
                if (id === "mkbNoteDurationRow") return mockHeaderRow;
                if (id === "mkb0") return mockMkbRow0;
                if (id === "mkb1") return { cells: [] };
                if (id === "mkb2") return { cells: [] };
                return null;
            });

            keyboard._notesPlayed = [
                {
                    startTime: 0,
                    noteOctave: "c4",
                    objId: "o1",
                    duration: 1,
                    voice: "v",
                    blockNumber: 1
                }
            ];
            keyboard.processSelected();
            keyboard._createpiesubmenu = jest.fn();
            keyboard._setNotes = jest.fn();

            keyboard.makeClickable();

            // Test header cell click invokes _createpiesubmenu
            headerCell0.onclick({ target: headerCell0 });
            expect(keyboard._createpiesubmenu).toHaveBeenCalledWith("hdr0", "0", "1.0");

            // Test cell onmousedown toggles to black and calls _setNotes
            gridCell00.onmousedown({ target: gridCell00 });
            expect(gridCell00.style.backgroundColor).toBe("black");
            expect(keyboard._setNotes).toHaveBeenCalledWith(0, true);

            // Test second onmousedown toggles cell back to cellColor and calls _setNotes
            gridCell00.onmousedown({ target: gridCell00 });
            expect(gridCell00.style.backgroundColor).toBe("#ffffff");
            expect(keyboard._setNotes).toHaveBeenCalledWith(0, false);

            // Test onmouseover while isMouseDown is true toggles to black
            gridCell00.onmouseover();
            expect(gridCell00.style.backgroundColor).toBe("black");

            // Test onmouseup clears isMouseDown so subsequent mouseover does not change color
            gridCell00.onmouseup();
            gridCell00.onmouseover();
            expect(gridCell00.style.backgroundColor).toBe("black"); // Stays unchanged
        });
    });
});
