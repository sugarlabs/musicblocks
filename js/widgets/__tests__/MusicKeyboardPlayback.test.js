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

global._ = text => text;
global.SHARP = "♯";
global.FLAT = "♭";
global.platformColor = { selectorBackground: "lightblue" };

const MusicKeyboardPlayback = require("../MusicKeyboardPlayback.js");

const PLAYBACK_METHODS = [
    "stopMetronome",
    "_updatePlayButtonIcon",
    "playAll",
    "playOne",
    "_playChord"
];

const column = (notes, duration, objIds = notes.map((_, i) => "whiteRow" + i)) => ({
    noteOctave: notes,
    objId: objIds,
    duration: notes.map(() => duration),
    voice: notes.map(() => "piano"),
    blockNumber: notes.map(() => null)
});

const makeKeyboard = (getSelectedNotes = () => []) => {
    const keyboard = {
        bpm: 120,
        keyboardShown: true,
        playingNow: false,
        playButton: document.createElement("div"),
        _chordTimeouts: [],
        activity: { logo: { synth: { trigger: jest.fn() } } },
        _mkbEl: id => document.getElementById(id),
        _setWidgetTimeout: (callback, delay) => setTimeout(callback, delay),
        _clearWidgetTimeout: id => clearTimeout(id),
        _setWidgetInterval: (callback, delay) => setInterval(callback, delay),
        _clearWidgetInterval: jest.fn(id => clearInterval(id)),
        _clearPlaybackTimers: jest.fn(),
        _createKeyboard: jest.fn(),
        _createTable: jest.fn(),
        _updateWidgetWindowSize: jest.fn()
    };
    MusicKeyboardPlayback.install.call(keyboard, { ICONSIZE: 32, getSelectedNotes });
    return keyboard;
};

const drawKeys = count => {
    document.body.replaceChildren();
    for (let i = 0; i < count; i++) {
        const key = document.createElement("td");
        key.id = "whiteRow" + i;
        document.body.append(key);
    }
};

describe("MusicKeyboardPlayback", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        drawKeys(3);
    });

    afterEach(() => {
        jest.useRealTimers();
        document.body.replaceChildren();
    });

    test("install adds the playback methods to the keyboard", () => {
        const keyboard = makeKeyboard();

        for (const name of PLAYBACK_METHODS) {
            expect(typeof keyboard[name]).toBe("function");
        }
    });

    test("each keyboard gets its own methods", () => {
        const first = makeKeyboard();
        const second = makeKeyboard();

        for (const name of PLAYBACK_METHODS) {
            expect(first[name]).not.toBe(second[name]);
        }
    });

    test("playAll does nothing when nothing was recorded", () => {
        const keyboard = makeKeyboard();

        keyboard.playAll();

        expect(keyboard.playingNow).toBe(false);
        expect(keyboard.activity.logo.synth.trigger).not.toHaveBeenCalled();
    });

    test("playAll reads selectedNotes when it runs, not when it was installed", () => {
        // processSelected, Clear and close replace the list instead of changing it.
        let selectedNotes = [];
        const keyboard = makeKeyboard(() => selectedNotes);
        selectedNotes = [column(["C4"], 1 / 4)];

        keyboard.playAll();
        jest.advanceTimersByTime(1);

        expect(keyboard.activity.logo.synth.trigger).toHaveBeenCalledWith(
            0,
            "C4",
            0.5,
            "piano",
            null,
            null
        );
    });

    test("plays each column for its note value at the tempo", () => {
        const selectedNotes = [
            column(["C4"], 1 / 4),
            column(["D4", "E4"], 1 / 2, ["whiteRow1", "whiteRow2"])
        ];
        const keyboard = makeKeyboard(() => selectedNotes);
        const { trigger } = keyboard.activity.logo.synth;

        keyboard.playAll();
        jest.advanceTimersByTime(1);
        expect(trigger.mock.calls.map(call => call[1])).toEqual(["C4"]);
        expect(document.getElementById("whiteRow0").style.backgroundColor).toBe("lightgrey");

        // A quarter note at 120 bpm lasts half a second.
        jest.advanceTimersByTime(498);
        expect(trigger).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(2);
        expect(trigger.mock.calls.map(call => [call[1], call[2]])).toEqual([
            ["C4", 0.5],
            ["D4", 1],
            ["E4", 1]
        ]);
        expect(document.getElementById("whiteRow0").style.backgroundColor).toBe("white");
        expect(document.getElementById("whiteRow2").style.backgroundColor).toBe("lightgrey");

        // After the half note the keyboard is drawn again and Play comes back.
        jest.advanceTimersByTime(1000);
        expect(keyboard.playingNow).toBe(false);
        expect(keyboard._createKeyboard).toHaveBeenCalled();
        expect(keyboard.playButton.querySelector("img").alt).toBe("Play");
    });

    test("the playOne timer reads selectedNotes when it fires", () => {
        let selectedNotes = [column(["C4"], 1 / 4), column(["D4"], 1 / 4)];
        const keyboard = makeKeyboard(() => selectedNotes);

        keyboard.playAll();
        // Clear empties the list while the first note is still playing.
        selectedNotes = [];
        jest.advanceTimersByTime(600);

        expect(keyboard.activity.logo.synth.trigger.mock.calls.map(call => call[1])).toEqual([
            "C4"
        ]);
        expect(keyboard.playingNow).toBe(false);
    });

    test("pressing Play again stops playback", () => {
        const selectedNotes = [column(["C4"], 1 / 4), column(["D4"], 1 / 4)];
        const keyboard = makeKeyboard(() => selectedNotes);

        keyboard.playAll();
        expect(keyboard.playButton.querySelector("img").alt).toBe("Stop");
        keyboard.playAll();
        jest.advanceTimersByTime(2000);

        expect(keyboard.playingNow).toBe(false);
        expect(keyboard.playButton.querySelector("img").alt).toBe("Play");
        expect(keyboard.activity.logo.synth.trigger.mock.calls.map(call => call[1])).toEqual([
            "C4"
        ]);
    });

    test("_playChord skips rests and plays every note of a chord", () => {
        const keyboard = makeKeyboard();
        const { trigger } = keyboard.activity.logo.synth;

        keyboard._playChord(["R"], [0.5], [undefined]);
        keyboard._playChord(["C4", "E4", "G4"], [0.5, 0.5, 0.5], ["piano", "piano", "piano"]);
        jest.advanceTimersByTime(1);

        expect(trigger.mock.calls.map(call => call[1])).toEqual(["C4", "E4", "G4"]);
        expect(keyboard._chordTimeouts).toHaveLength(3);
    });

    test("_playChord writes sharps and flats the way the synth reads them", () => {
        const selectedNotes = [column(["C♯4", "E♭4"], 1 / 4)];
        const keyboard = makeKeyboard(() => selectedNotes);

        keyboard.playAll();
        jest.advanceTimersByTime(1);

        expect(keyboard.activity.logo.synth.trigger.mock.calls.map(call => call[1])).toEqual([
            "C#4",
            "Eb4"
        ]);
    });

    test("stopMetronome stops the ticks and the countdown", () => {
        const keyboard = makeKeyboard();
        const countdown = document.createElement("div");
        countdown.id = "countdownContainer";
        document.body.append(countdown);
        keyboard.tickButton = { style: { removeProperty: jest.fn() } };
        keyboard.tick = true;
        keyboard.metronomeON = true;
        keyboard.loopTick = { stop: jest.fn() };
        keyboard.metronomeInterval = keyboard._setWidgetInterval(() => {}, 1000);

        keyboard.stopMetronome();

        expect(keyboard.loopTick.stop).toHaveBeenCalled();
        expect(keyboard._clearWidgetInterval).toHaveBeenCalled();
        expect(keyboard.metronomeInterval).toBeNull();
        expect(keyboard.tick).toBe(false);
        expect(keyboard.metronomeON).toBe(false);
        expect(keyboard.tickButton.style.removeProperty).toHaveBeenCalledWith("background");
        expect(document.getElementById("countdownContainer")).toBeNull();
    });

    test("_updatePlayButtonIcon shows the injected icon size", () => {
        const keyboard = makeKeyboard();

        keyboard._updatePlayButtonIcon(keyboard.playButton, true);

        const img = keyboard.playButton.querySelector("img");
        expect(img.src).toContain("stop-button.svg");
        expect(img.width).toBe(32);
    });
});
