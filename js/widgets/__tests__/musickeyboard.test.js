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
                    setTooltip: jest.fn(),
                    sliceSelectedAttr: {},
                    sliceHoverAttr: {},
                    titleSelectedAttr: {},
                    titleHoverAttr: {}
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

describe("MusicKeyboard widgetWindow.onclose & event cleanup", () => {
    let originalWidgetWindows;
    let originalPlatformColor;
    let originalTranslate;
    let mockActivity;

    beforeEach(() => {
        originalWidgetWindows = global.window.widgetWindows;
        originalPlatformColor = global.platformColor;
        originalTranslate = global._;
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
            }
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
            orange: "#ff5722"
        };
        global._ = jest.fn(str => str);
        global.docById = id => document.getElementById(id) || { style: {}, remove: jest.fn() };
    });

    afterEach(() => {
        global.window.widgetWindows = originalWidgetWindows;
        global.platformColor = originalPlatformColor;
        global._ = originalTranslate;
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
});
