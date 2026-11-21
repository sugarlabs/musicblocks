/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks Contributors
 *
 * @license
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

const SamplerUI = require("../SamplerUI.js");

const METHODS = ["init"];
const DEPS = { ICONSIZE: 32, SAMPLEWIDTH: 800, SAMPLEHEIGHT: 400 };

const makeWidget = (deps = DEPS) => {
    const widget = {};
    SamplerUI.install.call(widget, deps);
    return widget;
};

/**
 * Builds a widget with the methods that init() calls but that the other sampler
 * modules (SamplerPlayback, SamplerTuner, SamplerFiles) normally provide.
 * @returns {object} The widget, with those methods replaced by mocks.
 */
const makeInitializableWidget = () => {
    const widget = makeWidget();
    widget._scale = jest.fn();
    widget._parseSamplePitch = jest.fn();
    widget.getPitchName = jest.fn();
    widget.setTimbre = jest.fn();
    widget.pause = jest.fn();
    widget.drag_and_drop = jest.fn();
    widget._clearWidgetTimers = jest.fn();
    widget.stopPitchDetection = jest.fn();
    return widget;
};

/**
 * Builds a fake widget window with the parts of the window API that init() uses.
 * @returns {object} The fake window.
 */
const makeWidgetWindow = () => ({
    _toolbar: document.createElement("div"),
    addButton: jest.fn(() => document.createElement("button")),
    sendToCenter: jest.fn(),
    show: jest.fn(),
    destroy: jest.fn(),
    isMaximized: jest.fn(() => false),
    getWidgetBody: jest.fn(() => document.createElement("div")),
    clearScreen: jest.fn()
});

describe("SamplerUI", () => {
    test("install adds exactly the methods moved out of SampleWidget", () => {
        expect(Object.keys(makeWidget()).sort()).toEqual([...METHODS].sort());
    });

    test("each widget gets its own methods", () => {
        const first = makeWidget();
        const second = makeWidget();
        for (const name of METHODS) {
            expect(typeof first[name]).toBe("function");
            expect(first[name]).not.toBe(second[name]);
        }
    });
});

describe("SamplerUI init guard", () => {
    let widget;
    let activity;

    beforeEach(() => {
        global._ = msg => msg;
        global.platformColor = { textColor: "#000000" };
        global.docById = id => (id === "wheelDivptm" ? document.createElement("div") : null);
        global.docByClass = () => [];

        window.widgetWindows = { windowFor: jest.fn(() => makeWidgetWindow()) };
        activity = { textMsg: jest.fn(), errorMsg: jest.fn() };
        widget = makeInitializableWidget();
    });

    afterEach(() => {
        delete global._;
        delete global.platformColor;
        delete global.docById;
        delete global.docByClass;
        delete window.widgetWindows;
    });

    /**
     * Returns the window that the nth call to windowFor created.
     * @param {number} n - Zero-based call index.
     * @returns {object} The fake window.
     */
    const windowCreatedBy = n => window.widgetWindows.windowFor.mock.results[n].value;

    test("a second init call does not add a second toolbar", () => {
        widget.init(activity, 0);
        widget.init(activity, 0);

        const first = windowCreatedBy(0);
        expect(first._toolbar.querySelectorAll(".wfbtItem")).toHaveLength(1);
    });

    test("a second init call shows the open window instead of building another", () => {
        widget.init(activity, 0);
        const first = windowCreatedBy(0);
        const sendToCenterCalls = first.sendToCenter.mock.calls.length;

        widget.init(activity, 0);

        expect(window.widgetWindows.windowFor).toHaveBeenCalledTimes(1);
        expect(first.show).toHaveBeenCalledTimes(1);
        expect(first.sendToCenter).toHaveBeenCalledTimes(sendToCenterCalls);
    });

    test("init builds a new window after the open one is closed", () => {
        widget.init(activity, 0);
        const first = windowCreatedBy(0);
        first.onclose();

        widget.init(activity, 0);

        const second = windowCreatedBy(1);
        expect(window.widgetWindows.windowFor).toHaveBeenCalledTimes(2);
        expect(first.destroy).toHaveBeenCalledTimes(1);
        expect(second._toolbar.querySelectorAll(".wfbtItem")).toHaveLength(1);
    });
});
