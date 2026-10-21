/**
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

const { TextEncoder } = require("util");

global.TextEncoder = TextEncoder;
global._ = jest.fn(str => str);

const constants = require("../../utils/musicutils-constants");
const modecore = require("../../utils/musicutils-modecore");

global.INTERVALVALUES = constants.INTERVALVALUES;
global.CHORDNAMES = constants.CHORDNAMES;
global.CHORDVALUES = modecore.CHORDVALUES;
global.HarmonyUtils = require("../HarmonyUtils");
global.rationalToFraction = d => {
    const fractions = { 1.25: [5, 4], 1.5: [3, 2], 2.5: [5, 2] };
    return fractions[d] || [Math.round(d * 1000), 1000];
};

const HarmonyWidget = require("../harmony");

// 12-EDO frequencies, A4 = 440 Hz.
const FREQUENCIES = { C4: 261.6256, E4: 329.6276, G4: 391.9954, E5: 659.2551 };

// One mouse whose latest note group holds the given sounds.
const makeTurtle = (sounds, previousTurtleTime = 0) => ({
    inTrash: false,
    singer: { pitchStatus: [].concat(sounds), previousTurtleTime }
});

describe("HarmonyWidget", () => {
    let activity;
    let widgetWindow;
    let body;

    beforeEach(() => {
        jest.spyOn(Date, "now").mockReturnValue(10500);
        global.requestAnimationFrame = jest.fn(() => 1);
        global.cancelAnimationFrame = jest.fn();

        body = document.createElement("div");
        widgetWindow = {
            clear: jest.fn(),
            show: jest.fn(),
            sendToCenter: jest.fn(),
            destroy: jest.fn(),
            getWidgetBody: () => body
        };
        window.widgetWindows = { windowFor: jest.fn(() => widgetWindow) };

        activity = {
            logo: {
                stopTurtle: false,
                synth: {
                    inTemperament: "equal",
                    changeInTemperament: false,
                    getFrequency: jest.fn(note =>
                        typeof note === "number" ? note : FREQUENCIES[note]
                    )
                }
            },
            turtles: { turtleList: [] }
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const rows = () =>
        Array.from(body.querySelectorAll("tr"))
            .slice(1)
            .map(tr => Array.from(tr.children).map(td => td.textContent));

    it("shows the intervals of notes played by different mice", () => {
        // Now is 10500 ms; every note sounds from 10000 to 11000 ms.
        activity.turtles.turtleList = [
            makeTurtle({ notes: ["C4"], start: 0, startsAt: 10000, endsAt: 11000 }),
            makeTurtle({ notes: ["E4"], start: 0, startsAt: 10000, endsAt: 11000 }),
            makeTurtle({ notes: ["G4"], start: 0, startsAt: 10000, endsAt: 11000 })
        ];

        new HarmonyWidget(activity);

        expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
            expect.any(HarmonyWidget),
            "harmony"
        );
        expect(body.textContent).toContain("C major");
        expect(rows()).toEqual([
            ["C4 → E4", "major 3", "5:4", "1.260", "+13.7"],
            ["C4 → G4", "perfect 5", "3:2", "1.498", "-2.0"]
        ]);
    });

    it("names compound intervals with the extra octaves", () => {
        activity.turtles.turtleList = [
            makeTurtle({ notes: ["C4", "E5"], start: 0, startsAt: 10000, endsAt: 11000 })
        ];

        new HarmonyWidget(activity);

        expect(rows()).toEqual([["C4 → E5", "major 3 + 1 octave", "5:2", "2.520", "+13.7"]]);
    });

    it("shows a just interval given in hertz as 0.0 cents", () => {
        activity.turtles.turtleList = [
            makeTurtle({ notes: [200], start: 0, startsAt: 10000, endsAt: 11000 }),
            makeTurtle({ notes: [250], start: 0, startsAt: 10000, endsAt: 11000 })
        ];

        new HarmonyWidget(activity);

        expect(rows()).toEqual([["200.0 Hz → 250.0 Hz", "major 3", "5:4", "1.250", "0.0"]]);
    });

    it("leaves out a mouse that has moved on to a rest or a drum", () => {
        activity.turtles.turtleList = [
            makeTurtle({ notes: ["C4"], start: 0, startsAt: 10000, endsAt: 11000 }),
            // Its last pitched note started at 0, but it is now past a later event.
            makeTurtle({ notes: ["E4"], start: 0, startsAt: 10000, endsAt: 10250 }, 0.25)
        ];

        new HarmonyWidget(activity);

        expect(rows()).toEqual([]);
        expect(body.textContent).toBe("Play two or more notes at the same time.");
    });

    it("leaves out a note once its sound has ended, after a short grace", () => {
        // A staccato note: its sound ends before the mouse moves on.
        activity.turtles.turtleList = [
            makeTurtle({ notes: ["C4"], start: 0, startsAt: 10000, endsAt: 11000 }),
            makeTurtle({ notes: ["E4"], start: 0, startsAt: 10000, endsAt: 10250 })
        ];
        new HarmonyWidget(activity);
        expect(rows()).toEqual([]);

        // Within 100 ms of its end, it is still listed.
        activity.turtles.turtleList[1].singer.pitchStatus[0].endsAt = 10450;
        new HarmonyWidget(activity);
        expect(rows()).toEqual([["C4 → E4", "major 3", "5:4", "1.260", "+13.7"]]);
    });

    it("shows nothing once the project is stopped", () => {
        activity.turtles.turtleList = [
            makeTurtle({ notes: ["C4"], start: 0, startsAt: 10000, endsAt: 11000 }),
            makeTurtle({ notes: ["E4"], start: 0, startsAt: 10000, endsAt: 11000 })
        ];
        activity.logo.stopTurtle = true;

        new HarmonyWidget(activity);

        expect(rows()).toEqual([]);
    });

    it("re-renders only when the sounding notes change", () => {
        activity.turtles.turtleList = [
            makeTurtle({ notes: ["C4"], start: 0, startsAt: 10000, endsAt: 11000 }),
            makeTurtle({ notes: ["E4"], start: 0, startsAt: 10000, endsAt: 11000 })
        ];
        const widget = new HarmonyWidget(activity);
        const calls = activity.logo.synth.getFrequency.mock.calls.length;

        widget._tick();
        expect(activity.logo.synth.getFrequency.mock.calls.length).toBe(calls);

        activity.turtles.turtleList[1].singer.pitchStatus = [
            { notes: ["G4"], start: 0, startsAt: 10000, endsAt: 11000 }
        ];
        widget._tick();
        expect(rows()).toEqual([["C4 → G4", "perfect 5", "3:2", "1.498", "-2.0"]]);
    });

    it("adds a note nested in another note of the same mouse", () => {
        // One mouse: a C4 note with an E4 note nested in it; another mouse plays G4.
        activity.turtles.turtleList = [
            makeTurtle([
                { notes: ["E4"], start: 0, startsAt: 10000, endsAt: 10667 },
                { notes: ["C4"], start: 0, startsAt: 10000, endsAt: 11333 }
            ]),
            makeTurtle({ notes: ["G4"], start: 0, startsAt: 10000, endsAt: 12667 })
        ];

        new HarmonyWidget(activity);

        expect(body.textContent).toContain("C major");
        expect(rows().map(row => row[0])).toEqual(["C4 → E4", "C4 → G4"]);
    });

    it("does not list a nested note before it starts", () => {
        // The second nested note starts at 10667 ms; now is 10500 ms.
        activity.turtles.turtleList = [
            makeTurtle([
                { notes: ["E4"], start: 0, startsAt: 10000, endsAt: 10667 },
                { notes: ["F4"], start: 0, startsAt: 10667, endsAt: 11333 }
            ]),
            makeTurtle({ notes: ["C4"], start: 0, startsAt: 10000, endsAt: 12667 })
        ];

        new HarmonyWidget(activity);

        expect(rows().map(row => row[0])).toEqual(["C4 → E4"]);
    });

    it("stops refreshing when closed", () => {
        const widget = new HarmonyWidget(activity);

        widgetWindow.onclose();

        expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
        expect(widgetWindow.destroy).toHaveBeenCalled();
        expect(widget._rafId).toBeNull();
    });
});
