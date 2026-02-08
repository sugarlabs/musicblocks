/**
 * @license
 * MusicBlocks v3.4.1
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const fs = require("fs");
const path = require("path");

describe("AIDebuggerWidget close cleanup", () => {
    let AIDebuggerWidget;

    const createWidgetWindowMock = () => {
        const widgetBody = { style: {} };
        return {
            clear: jest.fn(),
            show: jest.fn(),
            getWidgetBody: jest.fn(() => widgetBody),
            addButton: jest.fn(() => ({})),
            sendToCenter: jest.fn(),
            destroy: jest.fn(),
            isMaximized: jest.fn(() => false),
            onclose: null,
            onmaximize: null
        };
    };

    beforeAll(() => {
        global._ = jest.fn(str => str);
        const source = fs.readFileSync(path.join(__dirname, "..", "aidebugger.js"), "utf8");
        AIDebuggerWidget = new Function(`${source}; return AIDebuggerWidget;`)();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("clears typing animation interval when widget closes", () => {
        const widgetWindow = createWidgetWindowMock();
        window.widgetWindows = { windowFor: jest.fn(() => widgetWindow) };

        const widget = new AIDebuggerWidget();
        widget._createLayout = jest.fn();
        widget._loadProjectAndInitialize = jest.fn();

        widget.chatLog = document.createElement("div");
        const typingIndicator = document.createElement("div");
        typingIndicator.className = "typing-indicator";
        typingIndicator.setAttribute("data-animation-id", "42");
        widget.chatLog.appendChild(typingIndicator);

        const clearIntervalSpy = jest.spyOn(global, "clearInterval").mockImplementation(() => {});
        const activity = { isInputON: false, textMsg: jest.fn() };

        widget.init(activity);
        widgetWindow.onclose();

        expect(clearIntervalSpy).toHaveBeenCalledWith(42);
        expect(widget.chatLog.querySelector(".typing-indicator")).toBeNull();
        expect(widgetWindow.destroy).toHaveBeenCalledTimes(1);
        expect(activity.isInputON).toBe(false);
    });

    test("does not throw on close when chat log is not initialized", () => {
        const widgetWindow = createWidgetWindowMock();
        window.widgetWindows = { windowFor: jest.fn(() => widgetWindow) };

        const widget = new AIDebuggerWidget();
        widget._createLayout = jest.fn();
        widget._loadProjectAndInitialize = jest.fn();
        widget.chatLog = null;

        const activity = { isInputON: false, textMsg: jest.fn() };
        widget.init(activity);

        expect(() => widgetWindow.onclose()).not.toThrow();
        expect(widgetWindow.destroy).toHaveBeenCalledTimes(1);
        expect(activity.isInputON).toBe(false);
    });
});
