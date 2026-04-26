global.localStorage = {
    beginnerMode: "false"
};

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
