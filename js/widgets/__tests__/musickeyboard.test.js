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
            [1, ["solfege", { value: "do♯" }], 0, 0, [0]],
            [2, ["number", { value: 392 }], 0, 0, [0]]
        ]);
    });

    test("creates pie submenu and sets z-index, top position, and exit wheel correctly", () => {
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
    });

    test("creates column pie submenu and sets z-index, top position, and exit wheel correctly", () => {
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
});
