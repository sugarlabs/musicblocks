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

const ManagedTimer = require("../../utils/ManagedTimer");

global._ = msg => msg;
global.TempoWindow = require("../TempoWindow.js");
global.TempoRows = require("../TempoRows.js");
global.TempoKeyboard = require("../TempoKeyboard.js");
global.TempoTap = require("../TempoTap.js");
global.TempoControls = require("../TempoControls.js");
global.TempoMetronome = require("../TempoMetronome.js");
global.TempoSave = require("../TempoSave.js");
global.Tempo = require("../tempo.js");

const TempoTap = global.TempoTap;
const METHODS = ["_flashTapButton", "_scheduleTapReset", "tapTempo"];

describe("TempoTap", () => {
    let tempo;

    const tapAt = (time, id = 0) => {
        jest.setSystemTime(time);
        return tempo.tapTempo(id);
    };

    beforeEach(() => {
        jest.useFakeTimers();
        tempo = new Tempo();
        tempo.widgetWindow = { timerManager: new ManagedTimer() };
        tempo.activity = { textMsg: jest.fn() };
        tempo.tapBtn = document.createElement("button");
        tempo.BPMs = [100, 100];
        tempo.BPMInputs = [{ value: 100 }, { value: 100 }];
        tempo._updateBPM = jest.fn();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("holds exactly the methods moved out of Tempo", () => {
        const names = Object.getOwnPropertyNames(TempoTap.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on Tempo.prototype", () => {
        expect(Tempo.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(Tempo.prototype[name]).toBe(TempoTap.prototype[name]);
            expect(Object.getOwnPropertyDescriptor(Tempo.prototype, name).enumerable).toBe(false);
        }
    });

    describe("tapTempo", () => {
        test("the first tap asks for another and changes nothing", () => {
            expect(tapAt(10000)).toBeNull();

            expect(tempo.activity.textMsg).toHaveBeenCalledWith("Tap again to set tempo", 1500);
            expect(tempo.BPMs[0]).toBe(100);
            expect(tempo._updateBPM).not.toHaveBeenCalled();
        });

        test("the second tap sets the tempo from the time between them", () => {
            tapAt(10000);

            expect(tapAt(10500)).toBe(120);
            expect(tempo.BPMs[0]).toBe(120);
            expect(tempo.BPMInputs[0].value).toBe(120);
            expect(tempo._updateBPM).toHaveBeenCalledWith(0);
        });

        test("averages the last four intervals", () => {
            tapAt(10000);
            tapAt(10500);
            tapAt(11000);
            // The 1000 ms gap is averaged with the 500 ms ones: 2000 ms over 3 gaps.
            expect(tapAt(12000)).toBe(90);

            tapAt(12500);
            // Only the last five taps count: 2500 ms over 4 gaps.
            expect(tempo._tapTimes).toHaveLength(5);
            expect(tapAt(13000)).toBe(96);
        });

        test("a tap more than two seconds after the last starts again", () => {
            tapAt(10000);

            expect(tapAt(12500)).toBeNull();
            expect(tempo._tapTimes).toEqual([12500]);
        });

        test("the taps are forgotten two seconds after the last one", () => {
            tapAt(10000);
            jest.advanceTimersByTime(2001);

            expect(tempo._tapTimes).toEqual([]);
            expect(tempo._lastTapIndex).toBeNull();
            expect(tempo._tapTimeout).toBeNull();
        });

        test("tapping another row starts again", () => {
            tapAt(10000, 0);

            expect(tapAt(10500, 1)).toBeNull();
            expect(tempo.activeBPMIndex).toBe(1);
            expect(tapAt(11000, 1)).toBe(120);
            expect(tempo.BPMs).toEqual([100, 120]);
        });

        test.each([-1, 2])("taps the first row for row %s", id => {
            tapAt(10000, id);
            tapAt(10500, id);

            expect(tempo.BPMs[0]).toBe(120);
            expect(tempo.activeBPMIndex).toBe(0);
        });

        test("taps at the same time are ignored", () => {
            tapAt(10000);

            expect(tapAt(10000)).toBeNull();
            expect(tempo._updateBPM).not.toHaveBeenCalled();
        });

        test.each([
            [1999, 30],
            [50, 1000]
        ])("taps %s ms apart are held at %s", (gap, bpm) => {
            tapAt(10000);

            expect(tapAt(10000 + gap)).toBe(bpm);
        });

        test("does nothing without a row", () => {
            tempo.BPMs = [];

            expect(tapAt(10000)).toBeNull();
            expect(tempo.activity.textMsg).not.toHaveBeenCalled();
        });

        test("works without a timer manager", () => {
            tempo.widgetWindow = null;

            tapAt(10000);
            expect(tapAt(10600)).toBe(100);
            jest.advanceTimersByTime(2001);
            expect(tempo._tapTimes).toEqual([]);
        });
    });

    describe("_flashTapButton", () => {
        test("lights the tap button for 150 ms", () => {
            tempo._flashTapButton();

            let img = tempo.tapBtn.querySelector("img");
            expect(img.src).toContain("header-icons/tap-active-button.svg");
            expect(img.alt).toBe("Tap tempo");

            jest.advanceTimersByTime(150);

            img = tempo.tapBtn.querySelector("img");
            expect(img.src).toContain("header-icons/tap-button.svg");
            expect(tempo.tapBtn.querySelectorAll("img")).toHaveLength(1);
            expect(tempo._tapButtonTimeout).toBeNull();
        });

        test("a second tap keeps the button lit for another 150 ms", () => {
            tempo._flashTapButton();
            jest.advanceTimersByTime(100);
            tempo._flashTapButton();
            jest.advanceTimersByTime(100);

            expect(tempo.tapBtn.querySelector("img").src).toContain("tap-active-button.svg");

            jest.advanceTimersByTime(50);
            expect(tempo.tapBtn.querySelector("img").src).not.toContain("tap-active");
        });

        test("does nothing without a tap button", () => {
            tempo.tapBtn = null;

            expect(() => tempo._flashTapButton()).not.toThrow();
            expect(tempo._tapButtonTimeout).toBeNull();
        });
    });
});
