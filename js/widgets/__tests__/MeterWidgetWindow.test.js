/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks contributors
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

const { clampNumber, rationalToFraction } = require("../../utils/utils-logic.js");

global._ = msg => msg;
global.last = arr => arr[arr.length - 1];
global.clampNumber = clampNumber;
global.rationalToFraction = rationalToFraction;
global.Singer = { masterVolume: [80], defaultBPMFactor: 4, masterBPM: 90 };
global.TONEBPM = 240;
global.MeterWidgetWindow = require("../MeterWidgetWindow.js");
global.MeterWidgetMeter = require("../MeterWidgetMeter.js");
global.MeterWidgetPlayback = require("../MeterWidgetPlayback.js");
global.MeterWidgetWheel = require("../MeterWidgetWheel.js");
global.MeterWidgetSave = require("../MeterWidgetSave.js");
const MeterWidget = require("../meterwidget.js");
global.MeterWidget = MeterWidget;

const MeterWidgetWindow = global.MeterWidgetWindow;
const METHODS = [
    "_close",
    "_scale",
    "_get_click_lock",
    "_setPlayButtonIcon",
    "_makePlayButton",
    "_makeInputs",
    "_reset"
];

const numberBlock = (value, parent) => ({
    name: "number",
    value,
    connections: [parent],
    text: { text: String(value) },
    container: { children: [{}], setChildIndex: jest.fn() }
});

describe("MeterWidgetWindow", () => {
    let widget;
    let widgetWindow;
    let blockList;

    beforeEach(() => {
        jest.useFakeTimers();
        blockList = {
            1: { name: "meter", connections: [null, 2, 3, null] },
            2: numberBlock(2, 1),
            3: { name: "divide", value: 3 / 8, connections: [1, 4, 5] },
            4: numberBlock(3, 3),
            5: numberBlock(8, 3)
        };
        widgetWindow = {
            _toolbar: document.createElement("div"),
            addButton: jest.fn((icon, size, label) => {
                const button = document.createElement("div");
                button.title = label;
                return button;
            }),
            destroy: jest.fn()
        };
        widget = Object.create(MeterWidget.prototype);
        widget.activity = {
            blocks: { blockList },
            logo: {
                synth: { setMasterVolume: jest.fn(), trigger: jest.fn() },
                resetSynth: jest.fn(),
                runLogoCommands: jest.fn(),
                turtleDelay: 100
            },
            hideMsgs: jest.fn()
        };
        widget.widgetWindow = widgetWindow;
        widget._meterBlock = 1;
        widget._widgetBlock = 7;
        widget._beatValue = 1 / 4;
        widget._strongBeats = [true, false];
        widget._playing = false;
        widget._click_lock = false;
        widget._timerManager = null;
        widget._playBeatTimeout = null;
        widget._turtle = null;
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    test("holds exactly the methods moved out of MeterWidget", () => {
        const names = Object.getOwnPropertyNames(MeterWidgetWindow.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on MeterWidget.prototype", () => {
        expect(MeterWidget.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(MeterWidget.prototype[name]).toBe(MeterWidgetWindow.prototype[name]);
        }
    });

    describe("_close", () => {
        test("stops the beats, restores the volume and destroys the window", () => {
            widget._stopPlayback = jest.fn();

            widget._close();

            expect(widget._stopPlayback).toHaveBeenCalled();
            expect(widget.activity.logo.synth.setMasterVolume).toHaveBeenCalledWith(80);
            expect(widget.activity.hideMsgs).toHaveBeenCalled();
            expect(widgetWindow.destroy).toHaveBeenCalled();
        });

        test("leaves the volume when no master volume was set", () => {
            const volumes = Singer.masterVolume;
            Singer.masterVolume = [];

            widget._close();

            expect(widget.activity.logo.synth.setMasterVolume).not.toHaveBeenCalled();
            Singer.masterVolume = volumes;
        });
    });

    describe("play button", () => {
        test("starts the beats and shows Stop", () => {
            widget._playBeat = jest.fn();
            const playBtn = widget._makePlayButton();

            playBtn.onclick();

            expect(widget._playing).toBe(true);
            expect(widget._playBeat).toHaveBeenCalled();
            expect(widget.activity.logo.turtleDelay).toBe(0);
            expect(widget.activity.logo.resetSynth).toHaveBeenCalledWith(0);
            expect(playBtn.querySelector("img").title).toBe("Stop");
            expect(playBtn.querySelector("img").getAttribute("src")).toBe(
                "header-icons/stop-button.svg"
            );
        });

        test("stops the beats on the next click and shows Play", () => {
            widget._playBeat = jest.fn();
            widget._stopPlayback = jest.fn(() => (widget._playing = false));
            const playBtn = widget._makePlayButton();

            playBtn.onclick();
            jest.advanceTimersByTime(1000);
            playBtn.onclick();

            expect(widget._stopPlayback).toHaveBeenCalledTimes(1);
            expect(widget._playing).toBe(false);
            expect(playBtn.querySelectorAll("img")).toHaveLength(1);
            expect(playBtn.querySelector("img").title).toBe("Play");
        });

        test("ignores a second click within a second", () => {
            widget._playBeat = jest.fn();
            const playBtn = widget._makePlayButton();

            playBtn.onclick();
            playBtn.onclick();

            expect(widget._playBeat).toHaveBeenCalledTimes(1);
            expect(widget._get_click_lock()).toBe(true);
            jest.advanceTimersByTime(1000);
            expect(widget._get_click_lock()).toBe(false);
        });
    });

    describe("_makeInputs", () => {
        test("shows the beats and the denominator of the beat value", () => {
            widget._makeInputs(widget._readMeterBlock());

            const inputs = widgetWindow._toolbar.querySelectorAll("input");
            expect([...inputs].map(input => input.id)).toEqual(["beatCount", "beatValue"]);
            expect(widget._beatCountInput.value).toBe("2");
            expect(widget._noteValueInput.value).toBe("8");
            expect(widget._noteValueInput.getAttribute("aria-label")).toBe("Beat note value");
        });
    });

    describe("_reset", () => {
        test("writes the toolbar values into the Meter block and runs the widget again", () => {
            const meter = widget._readMeterBlock();
            widget._makeInputs(meter);
            widget._beatCountInput.value = "5";
            widget._noteValueInput.value = "4";

            widget._reset(meter);

            expect(blockList[2].value).toBe(5);
            expect([blockList[4].value, blockList[5].value]).toEqual([3, 4]);
            expect(widget.activity.logo.runLogoCommands).toHaveBeenCalledWith(7);
        });

        test("keeps a 3/8 beat value when only the beats change", () => {
            const meter = widget._readMeterBlock();
            widget._makeInputs(meter);
            widget._beatCountInput.value = "4";

            widget._reset(meter);

            expect([blockList[4].value, blockList[5].value]).toEqual([3, 8]);
        });

        test("rounds and limits the toolbar values", () => {
            const meter = widget._readMeterBlock();
            widget._makeInputs(meter);
            widget._beatCountInput.value = "40";
            widget._noteValueInput.value = "2.6";

            widget._reset(meter);

            expect(widget._beatCountInput.value).toBe("16");
            expect(widget._noteValueInput.value).toBe("3");
            expect(blockList[2].value).toBe(16);
            expect(blockList[5].value).toBe(3);
        });

        test("keeps a note value above 35 that was not changed", () => {
            blockList[5].value = 64;
            const meter = widget._readMeterBlock();
            widget._makeInputs(meter);

            widget._reset(meter);

            expect(widget._noteValueInput.value).toBe("64");
            expect(blockList[5].value).toBe(64);
        });

        test("still limits a typed note value to 35", () => {
            const meter = widget._readMeterBlock();
            widget._makeInputs(meter);
            widget._noteValueInput.value = "64";

            widget._reset(meter);

            expect(blockList[5].value).toBe(35);
        });

        test("stops the beats first", () => {
            const meter = widget._readMeterBlock();
            widget._makeInputs(meter);
            widget._stopPlayback = jest.fn();

            widget._reset(meter);

            expect(widget._stopPlayback).toHaveBeenCalled();
        });
    });

    describe("_scale", () => {
        const scaleOn = maximized => {
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            const body = document.createElement("div");
            body.appendChild(svg);
            MeterWidget.prototype._scale.call({
                getWidgetFrame: () => ({ offsetHeight: 620 }),
                getDragElement: () => ({ offsetHeight: 20 }),
                getWidgetBody: () => body,
                isMaximized: () => maximized
            });
            return svg;
        };

        test("grows the wheel with a maximized window", () => {
            const svg = scaleOn(true);

            expect(svg.getAttribute("height")).toBe("600px");
            expect(svg.style.pointerEvents).toBe("none");
            jest.advanceTimersByTime(100);
            expect(svg.style.pointerEvents).toBe("auto");
        });

        test("keeps the wheel at 400px otherwise", () => {
            expect(scaleOn(false).getAttribute("width")).toBe("400px");
        });
    });
});
