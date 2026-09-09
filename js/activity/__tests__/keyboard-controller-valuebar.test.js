/**
 * Verifies the printText.show guard in __keyPressed() is scoped to the
 * value-bar case (#4931) and no longer blocks unrelated status messages.
 */
const path = require("path");

beforeAll(() => {
    global._ = key => key;
    global.platformColor = { stopIconcolor: "red" };
    global.STANDARDBLOCKHEIGHT = 20;
    global.disableHorizScrollIcon = { style: { display: "none" } };
});

let setupKeyboardController;
beforeAll(() => {
    jest.resetModules();
    ({ setupKeyboardController } = require(path.resolve(__dirname, "../keyboard-controller.js")));
});

beforeEach(() => {
    document.getElementById = jest.fn(id => {
        if (id === "labelDiv") return { classList: { contains: () => false } };
        if (["lilypondModal", "planet-iframe", "wheelDiv"].includes(id)) return { style: {} };
        return null;
    });
    document.getElementsByClassName = jest.fn(() => []);
    global.window.widgetWindows = { isOpen: jest.fn(() => false), openWindows: {} };
});

test("an unrelated status message (e.g. Alt-R Play) does not block ENTER-to-stop", () => {
    const doHardStop = jest.fn();
    const activity = {
        keyboardEnableFlag: true,
        currentKeyCode: 0,
        currentKey: "",
        printText: { classList: { contains: c => c === "show" } },
        isInputON: false,
        searchWidget: { style: { visibility: "hidden" } },
        helpfulSearchWidget: { style: { visibility: "hidden" } },
        pasteBox: { createBox: jest.fn(), show: jest.fn(), getPos: jest.fn(() => [10, 20]) },
        paste: { style: { visibility: "hidden" }, value: "", focus: jest.fn() },
        turtles: { running: jest.fn(() => true), setStageScale: jest.fn() },
        blocks: { activeBlock: null },
        _doHardStopButton: doHardStop,
        textMsg: jest.fn()
    };

    const controller = setupKeyboardController(activity);
    const event = new Event("keydown", { cancelable: true });
    Object.defineProperty(event, "keyCode", { value: 13, configurable: true });
    Object.defineProperty(event, "altKey", { value: false, configurable: true });

    controller.__keyPressed(event);
    controller.dispose();

    // Before the fix this failed: doHardStop was never called because the
    // old printText.show guard returned early before ENTER's own handling ran.
    expect(doHardStop).toHaveBeenCalledTimes(1);
});

test("value-bar display still blocks hotkeys (the original #4931 protection is preserved)", () => {
    const doHardStop = jest.fn();
    const activity = {
        keyboardEnableFlag: true,
        currentKeyCode: 0,
        currentKey: "",
        printText: { classList: { contains: () => false } },
        valueBarVisible: true,
        isInputON: false,
        searchWidget: { style: { visibility: "hidden" } },
        helpfulSearchWidget: { style: { visibility: "hidden" } },
        pasteBox: { createBox: jest.fn(), show: jest.fn(), getPos: jest.fn(() => [10, 20]) },
        paste: { style: { visibility: "hidden" }, value: "", focus: jest.fn() },
        turtles: { running: jest.fn(() => true), setStageScale: jest.fn() },
        blocks: { activeBlock: null },
        _doHardStopButton: doHardStop,
        textMsg: jest.fn()
    };

    const controller = setupKeyboardController(activity);
    const event = new Event("keydown", { cancelable: true });
    Object.defineProperty(event, "keyCode", { value: 13, configurable: true });
    Object.defineProperty(event, "altKey", { value: false, configurable: true });

    controller.__keyPressed(event);
    controller.dispose();

    expect(doHardStop).not.toHaveBeenCalled();
});
