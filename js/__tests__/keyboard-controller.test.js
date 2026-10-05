// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

"use strict";

/* global _ */

global._ = jest.fn(str => str);

const { KeyboardController } = require("../activity/keyboard-controller");

const pressKey = (keyCode, options = {}) => {
    const event = new KeyboardEvent("keydown", {
        keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true,
        ...options
    });
    document.dispatchEvent(event);
    return event;
};

describe("KeyboardController - modifier precedence and runtime guard", () => {
    let activity;
    let controller;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="labelDiv"></div>
            <div id="lilypondModal" style="display: none;"></div>
            <div id="planet-iframe" style="display: none;"></div>
            <div id="wheelDiv" style="display: none;"></div>
        `;

        activity = {
            keyboardEnableFlag: 1,
            valueBarVisible: false,
            isInputON: false,
            searchWidget: { style: { visibility: "hidden" } },
            helpfulSearchWidget: { style: { visibility: "hidden" } },
            paste: { style: { visibility: "hidden" } },
            turtles: { running: jest.fn(() => false) },
            blocks: {
                undoAction: jest.fn()
            },
            palettes: { activePalette: null, dict: {} }
        };

        controller = new KeyboardController(activity);
    });

    afterEach(() => {
        controller.dispose();
        document.body.innerHTML = "";
    });

    it("triggers undo on Ctrl+Z (Windows/Linux) and Cmd+Z (macOS) when idle", () => {
        pressKey(90, { ctrlKey: true });
        expect(activity.blocks.undoAction).toHaveBeenCalledTimes(1);

        pressKey(90, { metaKey: true });
        expect(activity.blocks.undoAction).toHaveBeenCalledTimes(2);
    });

    it("blocks undo on both Ctrl+Z and Cmd+Z when turtles are running", () => {
        activity.turtles.running.mockReturnValue(true);

        pressKey(90, { ctrlKey: true });
        expect(activity.blocks.undoAction).not.toHaveBeenCalled();

        pressKey(90, { metaKey: true });
        expect(activity.blocks.undoAction).not.toHaveBeenCalled();
    });

    it("records the key code for an unsupported Ctrl shortcut", () => {
        const ctrlC = pressKey(67, { ctrlKey: true });
        expect(ctrlC.defaultPrevented).toBe(false);
        expect(activity.currentKeyCode).toBe(67);
    });
});
