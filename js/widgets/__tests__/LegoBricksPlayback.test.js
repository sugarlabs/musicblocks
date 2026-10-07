/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks contributors
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

global.LegoBricksRows = require("../LegoBricksRows");
global.LegoBricksLayout = require("../LegoBricksLayout");
global.LegoBricksExport = require("../LegoBricksExport");
global.LegoBricksMedia = require("../LegoBricksMedia");
global.LegoBricksEyeDropper = require("../LegoBricksEyeDropper");
global.LegoBricksColor = require("../LegoBricksColor");
global.LegoBricksPlayback = require("../LegoBricksPlayback");
global.LegoBricksVisualization = require("../LegoBricksVisualization");
global.LegoWidget = require("../legobricks");

const LegoWidget = global.LegoWidget;
const LegoBricksPlayback = global.LegoBricksPlayback;
const METHODS = [
    "_setWidgetTimeout",
    "_clearWidgetTimeout",
    "_clearWidgetTimers",
    "_initAudio",
    "_playNote",
    "_changeInstrument",
    "_createInstrumentPieMenu",
    "_playPhrase",
    "_animateLines",
    "_isLineBeyondImageHorizontally",
    "_finishScanLine",
    "_stopPolyphonicPlayback",
    "_stopPlayback",
    "playColorMusicPolyphonic"
];

const makeSynth = () => ({
    loadSamples: jest.fn(),
    createSynth: jest.fn(),
    trigger: jest.fn(),
    stopSound: jest.fn()
});

describe("LegoBricksPlayback", () => {
    let widget;

    beforeEach(() => {
        global._ = text => text;
        global.Synth = jest.fn(makeSynth);
        widget = new LegoWidget();
        widget.activity = { textMsg: jest.fn(), hideMsgs: jest.fn() };
    });

    afterEach(() => {
        widget._clearWidgetTimers();
        delete global._;
        delete global.Synth;
        delete global.piemenuVoices;
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test("holds exactly the methods moved out of LegoWidget", () => {
        const target = {};
        LegoBricksPlayback.call(target);
        expect(Object.keys(target).sort()).toEqual([...METHODS].sort());
    });

    test("installModules sets the same methods on each widget instance", () => {
        const target = {};
        LegoBricksPlayback.call(target);
        for (const name of METHODS) {
            expect(Object.prototype.hasOwnProperty.call(widget, name)).toBe(true);
            expect(widget[name].toString()).toBe(target[name].toString());
        }
    });

    describe("widget timers without a ManagedTimer", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            widget._timerManager = null;
        });

        test("runs a callback once and forgets its id", () => {
            const callback = jest.fn();
            const id = widget._setWidgetTimeout(callback, 100);
            expect(widget._activeTimeouts.has(id)).toBe(true);

            jest.advanceTimersByTime(100);
            expect(callback).toHaveBeenCalledTimes(1);
            expect(widget._activeTimeouts.has(id)).toBe(false);
        });

        test("clears a pending callback", () => {
            const callback = jest.fn();
            const id = widget._setWidgetTimeout(callback, 100);
            expect(widget._clearWidgetTimeout(id)).toBe(true);
            expect(widget._clearWidgetTimeout(id)).toBe(false);
            expect(widget._clearWidgetTimeout(null)).toBe(false);

            jest.advanceTimersByTime(200);
            expect(callback).not.toHaveBeenCalled();
        });

        test("_clearWidgetTimers cancels everything, the polyphonic wait included", () => {
            const callbacks = [jest.fn(), jest.fn()];
            widget._setWidgetTimeout(callbacks[0], 50);
            widget._polyphonicTimeout = widget._setWidgetTimeout(callbacks[1], 50);

            expect(widget._clearWidgetTimers()).toBe(2);
            expect(widget._polyphonicTimeout).toBeNull();

            jest.advanceTimersByTime(100);
            callbacks.forEach(callback => expect(callback).not.toHaveBeenCalled());
        });
    });

    describe("audio", () => {
        test("_initAudio builds a synth for the selected instrument", () => {
            widget._initAudio();
            expect(widget.synth.loadSamples).toHaveBeenCalled();
            expect(widget.synth.createSynth).toHaveBeenCalledWith(
                0,
                "electronic synth",
                "electronic synth",
                null
            );
        });

        test("_playNote triggers the row's note on the current instrument", () => {
            widget._initAudio();
            widget.selectedInstrument = "piano";
            widget._playNote("C♯4", 0.25);
            expect(widget.synth.trigger).toHaveBeenCalledWith(
                0,
                "C♯4",
                0.25,
                "piano",
                null,
                null,
                false,
                0
            );
        });

        test("_playNote is silent before the synth exists and survives synth errors", () => {
            expect(() => widget._playNote("C4")).not.toThrow();

            jest.spyOn(console, "error").mockImplementation(() => {});
            widget._initAudio();
            widget.synth.trigger.mockImplementation(() => {
                throw new Error("no audio");
            });
            expect(() => widget._playNote("C4")).not.toThrow();
            expect(console.error).toHaveBeenCalled();
        });

        test("_changeInstrument rebuilds the synth from the select box", () => {
            widget._initAudio();
            widget.instrumentSelect = { value: "violin" };
            widget._changeInstrument();

            expect(widget.selectedInstrument).toBe("violin");
            expect(widget.synth.createSynth).toHaveBeenLastCalledWith(0, "violin", "violin", null);
            expect(widget.activity.textMsg).toHaveBeenCalledWith("Instrument changed to: violin");
        });
    });

    describe("_createInstrumentPieMenu", () => {
        let menuBlock;

        beforeEach(() => {
            global.piemenuVoices = jest.fn(block => {
                menuBlock = block;
            });
            widget._initAudio();
            widget.instrumentButton = document.createElement("button");
            widget._createInstrumentPieMenu();
        });

        test("opens the voice menu on the current instrument", () => {
            const [, labels, values, categories, selected, rotate] =
                global.piemenuVoices.mock.calls[0];
            expect(labels).toHaveLength(values.length);
            expect(values).toContain("electronic synth");
            expect(values).toContain("triangle");
            expect(categories).toEqual([]);
            expect(selected).toBe("electronic synth");
            expect(rotate).toBe(false);
        });

        test("picking a voice switches the instrument and the button label", () => {
            menuBlock.updateValue("cello");

            expect(widget.selectedInstrument).toBe("cello");
            expect(widget.instrumentButton.textContent).toBe("Cello");
            expect(widget.synth.createSynth).toHaveBeenLastCalledWith(0, "cello", "cello", null);
            expect(menuBlock.value).toBe("cello");
        });

        test("a label written back by the menu maps to its voice value", () => {
            menuBlock.text.text = "Acoustic Guitar";
            expect(widget.selectedInstrument).toBe("acoustic guitar");
            expect(widget.instrumentButton.textContent).toBe("Acoustic guitar");
        });
    });

    describe("_playPhrase", () => {
        beforeEach(() => {
            widget.gridOverlay = document.createElement("div");
            widget.gridOverlay.getBoundingClientRect = () => ({ height: 80, width: 300 });
            widget.matrixData.rows = [
                { note: "D4", label: "Re (4)" },
                { note: "C4", label: "Do (4)" },
                { note: "B3", label: "Ti (3)" },
                { type: "control", label: "Zoom Controls" }
            ];
            widget._animateLines = jest.fn();
        });

        test("puts one scanning line on every row that fits the overlay", () => {
            widget._playPhrase();

            expect(widget.scanningLines).toHaveLength(2);
            expect(widget.scanningLines.map(line => line.rowIndex)).toEqual([0, 1]);
            expect(widget.gridOverlay.querySelectorAll("[data-line-id]")).toHaveLength(2);
            expect(widget.isPlaying).toBe(true);
            expect(widget._animateLines).toHaveBeenCalled();
        });

        test("fills a row below the overlay with the background color", () => {
            widget._playPhrase();

            expect(widget.colorData[2].colorSegments).toEqual([
                expect.objectContaining({ color: "green", duration: 5000 })
            ]);
            expect(widget.colorData[3]).toBeUndefined();
        });
    });

    describe("_animateLines", () => {
        let rafSpy;

        beforeEach(() => {
            rafSpy = jest.spyOn(global, "requestAnimationFrame").mockImplementation(() => 1);
            widget.gridOverlay = document.createElement("div");
            widget.gridOverlay.getBoundingClientRect = () => ({ width: 100, left: 0 });
            widget.isPlaying = true;
            widget.lastFrameTime = performance.now() - 100;
            widget._sampleAndDetectColor = jest.fn();
        });

        test("moves each line by the column speed and asks for another frame", () => {
            const line = { element: document.createElement("div"), currentX: 0, rowIndex: 0 };
            widget.scanningLines = [line];

            widget._animateLines();

            // verticalSpacing 50px per 0.5s, so roughly 10px after 100ms
            expect(line.currentX).toBeGreaterThan(5);
            expect(line.element.style.left).toBe(line.currentX + "px");
            expect(widget._sampleAndDetectColor).toHaveBeenCalledWith(line, expect.any(Number));
            expect(rafSpy).toHaveBeenCalled();
        });

        test("stops once every line has left the overlay", () => {
            widget._stopPlayback = jest.fn();
            widget.scanningLines = [
                { element: document.createElement("div"), currentX: 500, rowIndex: 0 }
            ];

            widget._animateLines();

            expect(widget.scanningLines[0].completed).toBe(true);
            expect(widget._stopPlayback).toHaveBeenCalled();
            expect(rafSpy).not.toHaveBeenCalled();
        });

        describe("the color a line is on when it reaches the edge", () => {
            const makeLine = (currentX, startedAgo) => ({
                element: document.createElement("div"),
                currentX,
                rowIndex: 0,
                currentColor: { name: "red", hue: 0 },
                colorStartTime: performance.now() - startedAgo
            });

            beforeEach(() => {
                widget._stopPlayback = jest.fn();
                widget.colorData = [];
            });

            test("is saved when the line leaves the overlay", () => {
                widget.scanningLines = [makeLine(500, 4000)];

                widget._animateLines();

                const segments = widget.colorData[0].colorSegments;
                expect(segments).toHaveLength(1);
                expect(segments[0].color).toBe("red");
                // In milliseconds, like the segments saved on a color change.
                expect(segments[0].duration).toBeGreaterThanOrEqual(4000);
                expect(segments[0].duration).toBeLessThan(5000);
            });

            test("is saved when the line passes the image's right edge", () => {
                widget._isLineBeyondImageHorizontally = jest.fn(() => true);
                widget.scanningLines = [makeLine(10, 3000)];

                widget._animateLines();

                expect(widget.scanningLines[0].completed).toBe(true);
                expect(widget.colorData[0].colorSegments).toEqual([
                    expect.objectContaining({ color: "red" })
                ]);
            });

            test("follows a segment saved on an earlier color change", () => {
                widget._addColorSegment(0, { name: "blue", hue: 240 }, 2000);
                widget.scanningLines = [makeLine(500, 1500)];

                widget._animateLines();

                expect(widget.colorData[0].colorSegments.map(s => s.color)).toEqual([
                    "blue",
                    "red"
                ]);
            });

            test("is not saved when it lasted a second or less", () => {
                widget.scanningLines = [makeLine(500, 500)];

                widget._animateLines();

                expect(widget.colorData[0]).toBeUndefined();
            });

            test("nothing is saved for a line that never found a color", () => {
                widget.scanningLines = [
                    { element: document.createElement("div"), currentX: 500, rowIndex: 0 }
                ];

                widget._animateLines();

                expect(widget.colorData[0]).toBeUndefined();
            });
        });

        test("does nothing when playback is off", () => {
            widget.isPlaying = false;
            widget.scanningLines = [{ currentX: 0 }];
            widget._animateLines();
            expect(widget.scanningLines[0].currentX).toBe(0);
        });
    });

    test("_isLineBeyondImageHorizontally compares the line with the image's right edge", () => {
        widget.gridOverlay = document.createElement("div");
        widget.gridOverlay.getBoundingClientRect = () => ({ left: 100 });
        expect(widget._isLineBeyondImageHorizontally({ currentX: 999 })).toBe(false);

        widget.imageWrapper = document.createElement("div");
        const img = document.createElement("img");
        img.getBoundingClientRect = () => ({ left: 120, width: 200 });
        widget.imageWrapper.appendChild(img);

        expect(widget._isLineBeyondImageHorizontally({ currentX: 219 })).toBe(false);
        expect(widget._isLineBeyondImageHorizontally({ currentX: 220 })).toBe(true);
    });

    test("_stopPolyphonicPlayback silences held notes and wakes a pending wait", () => {
        widget._initAudio();
        widget._playingNotes = new Set(["C4", "E4"]);
        const resolve = jest.fn();
        widget._resolvePolyphonicWait = resolve;
        const before = widget._polyphonicPlaybackId;

        widget._stopPolyphonicPlayback();

        expect(widget._polyphonicPlaybackId).toBe(before + 1);
        expect(resolve).toHaveBeenCalled();
        expect(widget._resolvePolyphonicWait).toBeNull();
        expect(widget.synth.stopSound).toHaveBeenCalledWith(0, "electronic synth", "C4");
        expect(widget.synth.stopSound).toHaveBeenCalledWith(0, "electronic synth", "E4");
        expect(widget._playingNotes.size).toBe(0);
    });

    describe("_stopPlayback", () => {
        test("removes the scanning lines and resets the play button", () => {
            widget.playButton = document.createElement("div");
            widget.playButton.appendChild(document.createElement("img"));
            const overlay = document.createElement("div");
            const element = document.createElement("div");
            overlay.appendChild(element);
            widget.scanningLines = [{ element, rowIndex: 0 }];
            widget.isPlaying = true;

            widget._stopPlayback();

            expect(widget.isPlaying).toBe(false);
            expect(overlay.children).toHaveLength(0);
            expect(widget.scanningLines).toBeNull();
            expect(widget.playButton.querySelector("img").src).toContain(
                "header-icons/play-button.svg"
            );
            expect(widget.activity.hideMsgs).toHaveBeenCalled();
        });

        test("records the color a line was still on when it stops", () => {
            jest.spyOn(performance, "now").mockReturnValue(5000);
            widget.colorData = [];
            widget.scanningLines = [
                { rowIndex: 0, currentColor: { name: "red" }, colorStartTime: 1000 },
                { rowIndex: 1, currentColor: { name: "blue" }, colorStartTime: 4500 }
            ];
            widget._setWidgetTimeout = jest.fn();

            widget._stopPlayback();

            expect(widget.colorData[0].colorSegments).toEqual([
                expect.objectContaining({ color: "red", duration: 4000 })
            ]);
            expect(widget.colorData[1]).toBeUndefined();
            expect(widget.hasGeneratedVisualization).toBe(true);
            expect(widget._setWidgetTimeout).toHaveBeenCalledTimes(1);
        });

        test("does not generate the visualization twice", () => {
            widget.colorData = [{ colorSegments: [{ color: "red", duration: 2000 }] }];
            widget._setWidgetTimeout = jest.fn();

            widget._stopPlayback();
            widget._stopPlayback();

            expect(widget._setWidgetTimeout).toHaveBeenCalledTimes(1);
        });
    });

    describe("playColorMusicPolyphonic", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            widget._timerManager = null;
            widget._initAudio();
        });

        test("plays a note while its row has a non-background color", async () => {
            const colorData = [
                {
                    note: "C4",
                    colorSegments: [
                        { color: "green", duration: 2000 },
                        { color: "red", duration: 2000 }
                    ]
                }
            ];
            widget.colorData = colorData;

            const done = widget.playColorMusicPolyphonic(colorData);
            await jest.advanceTimersByTimeAsync(2000);
            expect(widget.synth.trigger).toHaveBeenCalledWith(
                0,
                "C4",
                999,
                "electronic synth",
                null,
                null,
                false,
                0
            );
            await jest.advanceTimersByTimeAsync(2000);
            await done;

            expect(widget.synth.stopSound).toHaveBeenCalledWith(0, "electronic synth", "C4");
            expect(widget._playingNotes.size).toBe(0);
        });

        test("plays nothing for a row that only shows the background", async () => {
            const colorData = [{ note: "C4", colorSegments: [{ color: "green", duration: 3000 }] }];
            widget.colorData = colorData;

            await widget.playColorMusicPolyphonic(colorData);

            expect(widget.synth.trigger).not.toHaveBeenCalled();
        });

        test("a newer playback cancels the one still waiting", async () => {
            const colorData = [
                {
                    note: "C4",
                    colorSegments: [
                        { color: "green", duration: 2000 },
                        { color: "red", duration: 2000 }
                    ]
                }
            ];
            widget.colorData = colorData;

            const first = widget.playColorMusicPolyphonic(colorData);
            widget._stopPolyphonicPlayback();
            await first;

            expect(widget.synth.trigger).not.toHaveBeenCalled();
        });
    });
});
