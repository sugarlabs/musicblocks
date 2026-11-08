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

const ManagedTimer = require("../../utils/ManagedTimer");

global.ManagedTimer = ManagedTimer;
global._ = msg => msg;
global.last = arr => arr[arr.length - 1];
global.TONEBPM = 240;
global.Singer = { defaultBPMFactor: 4, masterBPM: 90 };
global.MeterWidgetWindow = require("../MeterWidgetWindow.js");
global.MeterWidgetMeter = require("../MeterWidgetMeter.js");
global.MeterWidgetPlayback = require("../MeterWidgetPlayback.js");
global.MeterWidgetWheel = require("../MeterWidgetWheel.js");
global.MeterWidgetSave = require("../MeterWidgetSave.js");
const MeterWidget = require("../meterwidget.js");

const MeterWidgetPlayback = global.MeterWidgetPlayback;
const METHODS = [
    "_setWidgetTimeout",
    "_clearWidgetTimeout",
    "__playDrum",
    "__getPlayingStatus",
    "__getPauseStatus",
    "_hidePlaybackIndicator",
    "_stopPlayback",
    "__playOneBeat",
    "_playBeat"
];

describe("MeterWidgetPlayback", () => {
    let widget;
    let trigger;
    let events;

    const makeWheel = count => ({
        navItems: Array.from({ length: count }, (_unused, i) => ({
            navItem: {
                show: jest.fn(() => events.push(`show ${i}`)),
                hide: jest.fn(() => events.push(`hide ${i}`))
            }
        }))
    });

    const makeWidget = strongBeats => {
        const meter = Object.create(MeterWidget.prototype);
        meter.activity = { logo: { synth: { trigger } } };
        meter._strongBeats = strongBeats;
        meter._playWheel = makeWheel(strongBeats.length);
        meter._beatValue = 1 / 4;
        meter._playing = true;
        meter._turtle = null;
        meter._timerManager = new ManagedTimer();
        meter._playBeatTimeout = null;
        return meter;
    };

    beforeEach(() => {
        jest.useFakeTimers();
        trigger = jest.fn();
        events = [];
        widget = makeWidget([true, false, false, false]);
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    test("holds exactly the methods moved out of MeterWidget", () => {
        const names = Object.getOwnPropertyNames(MeterWidgetPlayback.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on MeterWidget.prototype", () => {
        expect(MeterWidget.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(MeterWidget.prototype[name]).toBe(MeterWidgetPlayback.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(MeterWidget.prototype, name).enumerable).toBe(
                false
            );
        }
    });

    describe("__playOneBeat", () => {
        test("plays a snare on a strong beat and a kick on a weak one", () => {
            widget.__playOneBeat(0, 500);
            jest.advanceTimersByTime(500);

            expect(trigger.mock.calls.map(call => call[3])).toEqual(["snare drum", "kick drum"]);
            expect(trigger).toHaveBeenCalledWith(0, "C4", 1, "snare drum", null, null);
        });

        test("moves the indicator from the previous beat to this one", () => {
            widget.__playOneBeat(2, 500);

            expect(events).toEqual(["hide 1", "show 2"]);
        });

        test("goes back to the first beat after the last one", () => {
            widget.__playOneBeat(3, 500);
            jest.advanceTimersByTime(500);

            expect(events).toEqual(["hide 2", "show 3", "hide 3", "show 0"]);
        });

        test("keeps the indicator on in a one-beat meter", () => {
            widget = makeWidget([false]);

            widget.__playOneBeat(0, 500);
            jest.advanceTimersByTime(1000);

            expect(events).toEqual(["hide 0", "show 0", "hide 0", "show 0", "hide 0", "show 0"]);
            expect(events[events.length - 1]).toBe("show 0");
        });

        test("plays nothing once stopped", () => {
            widget._playing = false;

            widget.__playOneBeat(0, 500);

            expect(trigger).not.toHaveBeenCalled();
            expect(events).toEqual(["hide 0", "hide 1", "hide 2", "hide 3"]);
        });

        test("does not throw without a play wheel", () => {
            widget._playWheel = undefined;

            expect(() => widget.__playOneBeat(0, 500)).not.toThrow();
            expect(trigger).toHaveBeenCalledTimes(1);
        });
    });

    describe("_stopPlayback", () => {
        test("cancels the next beat and hides the indicator", () => {
            widget.__playOneBeat(0, 500);
            events = [];

            widget._stopPlayback();
            jest.advanceTimersByTime(2000);

            expect(widget._playing).toBe(false);
            expect(widget._playBeatTimeout).toBeNull();
            expect(trigger).toHaveBeenCalledTimes(1);
            expect(events).toEqual(["hide 0", "hide 1", "hide 2", "hide 3"]);
        });

        test("works without a timer manager", () => {
            widget._timerManager = null;
            widget.__playOneBeat(0, 500);

            widget._stopPlayback();
            jest.advanceTimersByTime(2000);

            expect(trigger).toHaveBeenCalledTimes(1);
        });
    });

    describe("_playBeat", () => {
        test("plays at the master tempo without a turtle", () => {
            const playOneBeat = jest.spyOn(widget, "__playOneBeat");

            widget._playBeat();

            // TONEBPM / 90 beats per minute * 1000 ms * 1/4
            expect(playOneBeat).toHaveBeenCalledWith(0, (240 / 90) * 1000 * 0.25);
        });

        test("plays at the tempo the turtle set last", () => {
            widget._turtle = { singer: { bpm: [60, 120] } };
            const playOneBeat = jest.spyOn(widget, "__playOneBeat");

            widget._playBeat();

            expect(playOneBeat).toHaveBeenCalledWith(0, 500);
        });
    });

    describe("timers", () => {
        test("go through the timer manager and can be cleared", () => {
            const callback = jest.fn();
            const id = widget._setWidgetTimeout(callback, 100);

            expect(widget._clearWidgetTimeout(id)).toBe(true);
            jest.advanceTimersByTime(200);
            expect(callback).not.toHaveBeenCalled();
        });

        test("fall back to setTimeout without a timer manager", () => {
            widget._timerManager = null;
            const callback = jest.fn();

            widget._setWidgetTimeout(callback, 100);
            jest.advanceTimersByTime(100);
            expect(callback).toHaveBeenCalledTimes(1);

            const id = widget._setWidgetTimeout(callback, 100);
            expect(widget._clearWidgetTimeout(id)).toBe(true);
            jest.advanceTimersByTime(100);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test("clearing nothing returns false", () => {
            expect(widget._clearWidgetTimeout(null)).toBe(false);
            expect(widget._clearWidgetTimeout(undefined)).toBe(false);
        });
    });

    test("reports whether it is playing", () => {
        expect(widget.__getPlayingStatus()).toBe(true);
        expect(widget.__getPauseStatus()).toBe(false);

        widget._playing = false;

        expect(widget.__getPlayingStatus()).toBe(false);
        expect(widget.__getPauseStatus()).toBe(true);
    });
});
