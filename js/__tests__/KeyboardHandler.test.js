/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Music Blocks contributors
 *
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

const KeyboardHandler = require("../KeyboardHandler");

describe("KeyboardHandler", () => {
    let activity;
    let keyboardHandler;

    const createActivity = () => ({
        keyboardEnableFlag: true,
        currentKey: "",
        currentKeyCode: 0,
        printText: document.createElement("div"),
        searchWidget: { style: { visibility: "hidden" } },
        helpfulSearchWidget: { style: { visibility: "hidden" } },
        paste: {
            style: { visibility: "hidden", left: "", top: "" },
            value: "",
            focus: jest.fn()
        },
        isInputON: false,
        turtles: {
            running: jest.fn(() => false),
            setStageScale: jest.fn()
        },
        inTempoWidget: false,
        textMsg: jest.fn(),
        save: {
            saveBlockArtwork: jest.fn()
        },
        blocks: {
            prepareStackForCopy: jest.fn(),
            pasteStack: jest.fn(),
            bottomMostBlock: jest.fn(() => 100),
            extract: jest.fn(),
            activeBlock: null,
            moveStackRelative: jest.fn(),
            blockMoved: jest.fn(),
            adjustDocks: jest.fn()
        },
        _allClear: jest.fn(),
        _doFastButton: jest.fn(),
        pasted: jest.fn(),
        _doHardStopButton: jest.fn(),
        logo: {
            doStopTurtles: jest.fn(),
            tempo: {
                speedUp: jest.fn(),
                slowDown: jest.fn()
            }
        },
        _saveHelpBlocks: jest.fn(),
        beginnerMode: true,
        blocksContainer: { x: 0, y: 0 },
        canvas: { width: 1000, height: 800 },
        pasteBox: {
            createBox: jest.fn(),
            show: jest.fn(),
            getPos: jest.fn(() => [0, 0])
        },
        turtleBlocksScale: 1,
        turtleContainer: { scaleX: 1 },
        palettes: {
            activePalette: null,
            mouseOver: false,
            buttons: {
                rhythm: { y: 55 }
            },
            menuScrollEvent: jest.fn(),
            hidePaletteIconCircles: jest.fn()
        },
        scrollBlockContainer: false,
        _findBlocks: jest.fn(),
        stageDirty: false
    });

    const createEvent = overrides => ({
        keyCode: 65,
        key: "a",
        altKey: false,
        ctrlKey: false,
        shiftKey: false,
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        ...overrides
    });

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="labelDiv"></div>
            <div id="lilypondModal" style="display:none"></div>
            <div id="planet-iframe" style="display:none"></div>
            <div id="wheelDiv" style="display:none"></div>
            <button id="stop"></button>
        `;

        global._ = key => key;
        global.platformColor = { stopIconcolor: "#f00" };
        global.disableHorizScrollIcon = { style: { display: "none" } };
        window.widgetWindows = {
            openWindows: {},
            isOpen: jest.fn(() => false)
        };

        activity = createActivity();
        keyboardHandler = new KeyboardHandler(activity);
    });

    afterEach(() => {
        delete global._;
        delete global.platformColor;
        delete global.disableHorizScrollIcon;
        delete window.widgetWindows;
        jest.clearAllMocks();
    });

    test("handleKeyDown delegates to keyPressed", () => {
        const event = createEvent();
        const keyPressedSpy = jest.spyOn(keyboardHandler, "keyPressed").mockReturnValue("ok");

        const result = keyboardHandler.handleKeyDown(event);

        expect(keyPressedSpy).toHaveBeenCalledWith(event);
        expect(result).toBe("ok");
    });

    test("blocks arrow keys when the slider widget is open", () => {
        window.widgetWindows.isOpen.mockImplementation(name => name === "slider");
        const event = createEvent({ keyCode: 37, key: "ArrowLeft" });

        const result = keyboardHandler.keyPressed(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
        expect(result).toBe(false);
    });

    test("returns early when keyboard shortcuts are disabled", () => {
        activity.keyboardEnableFlag = false;
        const event = createEvent();

        keyboardHandler.keyPressed(event);

        expect(activity.currentKeyCode).toBe(0);
        expect(activity._doFastButton).not.toHaveBeenCalled();
    });

    test("stores currentKeyCode for regular key presses", () => {
        const event = createEvent({ keyCode: 65, key: "a" });

        keyboardHandler.keyPressed(event);

        expect(activity.currentKeyCode).toBe(65);
    });

    test("returns and clears the tracked key code", () => {
        activity.currentKey = "Enter";
        activity.currentKeyCode = 13;

        expect(keyboardHandler.getCurrentKeyCode()).toBe(13);

        keyboardHandler.clearCurrentKeyCode();

        expect(activity.currentKey).toBe("");
        expect(activity.currentKeyCode).toBe(0);
    });
});
