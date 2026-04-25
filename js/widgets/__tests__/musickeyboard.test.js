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
