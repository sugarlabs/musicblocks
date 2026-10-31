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

global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
global.SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];
Object.assign(global, require("../../utils/musicutils.js"));
global._ = text => text;
global.platformColor = { orange: "orange" };

const MusicKeyboardInput = require("../MusicKeyboardInput.js");

const INPUT_METHODS = ["addKeyboardShortcuts", "_refreshNoteToKeyMap", "doMIDI", "shiftOctave"];

// A keyboard with C4 (whiteRow0), D4 (whiteRow1) and E4 (whiteRow2) keys.
const makeKeyboard = () => {
    const keyboard = {
        bpm: 120,
        meterArgs: [4, 1 / 4],
        layout: [
            { noteName: "C", noteOctave: 4, objId: "whiteRow0" },
            { noteName: "D", noteOctave: 4, objId: "whiteRow1" },
            { noteName: "E", noteOctave: 4, objId: "whiteRow2" }
        ],
        noteMapper: { whiteRow0: "C4", whiteRow1: "D4", whiteRow2: "E4" },
        instrumentMapper: { whiteRow0: "piano", whiteRow1: "piano", whiteRow2: "piano" },
        blockNumberMapper: { whiteRow0: 10, whiteRow1: 11, whiteRow2: 12 },
        noteToKeyMap: {},
        _notesPlayed: [],
        midiButton: { style: {} },
        activity: {
            logo: { synth: { trigger: jest.fn(), stopSound: jest.fn(), inTemperament: "equal" } },
            textMsg: jest.fn(),
            errorMsg: jest.fn()
        },
        _mkbEl: id => document.getElementById(id),
        _createTable: jest.fn(),
        _updateWidgetWindowSize: jest.fn(),
        // Seconds to a note value at 120 bpm: one second is a half note.
        _secondsToNoteValue: jest.fn(seconds => (seconds * 120) / 240),
        _roundNoteDuration: jest.fn(value => value),
        _registerDocumentKeyHandlers(keyDown, keyUp) {
            this._boundKeyDown = keyDown;
            this._boundKeyUp = keyUp;
        }
    };
    MusicKeyboardInput.install.call(keyboard, {
        BLACKKEYS: [81, 87, 69, 82, 84, 89, 85, 73, 79, 80],
        WHITEKEYS: [65, 83, 68, 70, 71, 72, 74, 75, 76],
        HERTZKEYS: [49, 50, 51, 52, 53, 54, 55, 56, 57, 48],
        SPACE: 32,
        unit: 16,
        resolveSynthNoteName: (name, octave) => name + octave
    });
    return keyboard;
};

const drawKeys = () => {
    document.body.replaceChildren();
    ["C", "D", "E"].forEach((name, i) => {
        const key = document.createElement("td");
        key.id = "whiteRow" + i;
        key.setAttribute("alt", `${name}__4__${10 + i}`);
        document.body.append(key);
    });
};

describe("MusicKeyboardInput", () => {
    let originalRequestMIDIAccess;

    beforeEach(() => {
        drawKeys();
        originalRequestMIDIAccess = navigator.requestMIDIAccess;
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2026, 0, 1, 0, 0, 0));
    });

    afterEach(() => {
        jest.useRealTimers();
        navigator.requestMIDIAccess = originalRequestMIDIAccess;
        document.body.replaceChildren();
    });

    test("install adds the input methods to the keyboard", () => {
        const keyboard = makeKeyboard();

        for (const name of INPUT_METHODS) {
            expect(typeof keyboard[name]).toBe("function");
        }
    });

    test("each keyboard gets its own methods", () => {
        const first = makeKeyboard();
        const second = makeKeyboard();

        for (const name of INPUT_METHODS) {
            expect(first[name]).not.toBe(second[name]);
        }
    });

    describe("MIDI", () => {
        // Turns MIDI on with one fake input and returns a function that sends it bytes.
        const connect = async keyboard => {
            let handler = null;
            const input = {
                addEventListener: (type, fn) => {
                    handler = fn;
                },
                removeEventListener: jest.fn()
            };
            navigator.requestMIDIAccess = jest
                .fn()
                .mockResolvedValue({ inputs: new Map([["in", input]]) });
            keyboard.doMIDI();
            await Promise.resolve();
            await Promise.resolve();
            return bytes => handler({ data: bytes });
        };

        const NOTE_ON = 0x90;
        const NOTE_OFF = 0x80;
        const C4 = 60;
        const E4 = 64;

        test("plays and records a note from note on to note off", async () => {
            const keyboard = makeKeyboard();
            const send = await connect(keyboard);
            const start = Date.now();

            send([NOTE_ON, C4, 100]);
            jest.advanceTimersByTime(1000);
            send([NOTE_OFF, C4, 0]);

            const { synth } = keyboard.activity.logo;
            expect(synth.trigger).toHaveBeenCalledWith(0, "C4", 1, "piano", null, null);
            expect(synth.stopSound).toHaveBeenCalledWith(0, "piano", "C4");
            expect(keyboard._notesPlayed).toEqual([
                {
                    startTime: start,
                    noteOctave: "C4",
                    objId: "whiteRow0",
                    duration: 0.5,
                    voice: "piano",
                    blockNumber: 10
                }
            ]);
        });

        test.each([
            ["sustain pedal down", [0xb0, 64, 127]],
            ["sustain pedal up", [0xb0, 64, 0]],
            ["pitch bend", [0xe0, 60, 64]],
            ["channel pressure", [0xd0, 62]],
            ["key pressure", [0xa0, 60, 40]],
            ["program change", [0xc0, 60]],
            ["timing clock", [0xf8]]
        ])("ignores a %s message", async (name, bytes) => {
            const keyboard = makeKeyboard();
            const send = await connect(keyboard);

            // Hold C4, D4 and E4: the second byte of each message is one of them.
            send([NOTE_ON, C4, 100]);
            send([NOTE_ON, 62, 100]);
            send([NOTE_ON, E4, 100]);
            send(bytes);

            expect(keyboard._notesPlayed).toEqual([]);
            expect(keyboard.activity.logo.synth.stopSound).not.toHaveBeenCalled();
            expect(keyboard.activity.logo.synth.trigger).toHaveBeenCalledTimes(3);
        });

        test("takes notes from every MIDI channel", async () => {
            const keyboard = makeKeyboard();
            const send = await connect(keyboard);

            // Note on and note off on channel 2.
            send([NOTE_ON + 1, E4, 100]);
            jest.advanceTimersByTime(500);
            send([NOTE_OFF + 1, E4, 0]);

            expect(keyboard.activity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                "E4",
                1,
                "piano",
                null,
                null
            );
            expect(keyboard._notesPlayed.map(note => note.noteOctave)).toEqual(["E4"]);
        });

        test("a note on with velocity 0 ends the note", async () => {
            const keyboard = makeKeyboard();
            const send = await connect(keyboard);

            send([NOTE_ON, C4, 100]);
            jest.advanceTimersByTime(500);
            send([NOTE_ON, C4, 0]);

            expect(keyboard._notesPlayed).toHaveLength(1);
            expect(keyboard._notesPlayed[0].duration).toBe(0.25);
        });

        test("times overlapping notes from their own note on", async () => {
            const keyboard = makeKeyboard();
            const send = await connect(keyboard);
            const start = Date.now();

            send([NOTE_ON, C4, 100]);
            jest.advanceTimersByTime(500);
            send([NOTE_ON, E4, 100]);
            jest.advanceTimersByTime(500);
            send([NOTE_OFF, C4, 0]);
            jest.advanceTimersByTime(500);
            send([NOTE_OFF, E4, 0]);

            expect(
                keyboard._notesPlayed.map(note => [note.noteOctave, note.startTime, note.duration])
            ).toEqual([
                ["C4", start, 0.5],
                ["E4", start + 500, 0.5]
            ]);
            expect(keyboard._secondsToNoteValue.mock.calls).toEqual([[1], [1]]);
        });

        test("notes struck together start together, so they record as a chord", async () => {
            const keyboard = makeKeyboard();
            const send = await connect(keyboard);

            send([NOTE_ON, C4, 100]);
            jest.advanceTimersByTime(20);
            send([NOTE_ON, E4, 100]);
            jest.advanceTimersByTime(980);
            send([NOTE_OFF, E4, 0]);
            send([NOTE_OFF, C4, 0]);

            const [first, second] = keyboard._notesPlayed;
            expect(first.startTime).toBe(second.startTime);
        });

        test("ignores a note off for a key it did not start", async () => {
            const keyboard = makeKeyboard();
            const send = await connect(keyboard);

            send([NOTE_OFF, C4, 0]);

            expect(keyboard._notesPlayed).toEqual([]);
            expect(keyboard.activity.logo.synth.stopSound).not.toHaveBeenCalled();
        });

        test("uses the same clock as the mouse and computer keyboard", async () => {
            const keyboard = makeKeyboard();
            const send = await connect(keyboard);

            jest.advanceTimersByTime(3000);
            send([NOTE_ON, C4, 100]);
            send([NOTE_OFF, C4, 0]);

            expect(keyboard._notesPlayed[0].startTime).toBe(Date.now());
        });

        test("says MIDI is unavailable when the browser has no Web MIDI", () => {
            const keyboard = makeKeyboard();
            navigator.requestMIDIAccess = undefined;

            expect(() => keyboard.doMIDI()).not.toThrow();
            expect(keyboard.activity.errorMsg).toHaveBeenCalledWith(
                "Failed to get MIDI access in browser.",
                3000
            );
            expect(keyboard.midiON).toBe(false);
        });
    });

    describe("computer keyboard", () => {
        test("records how long a key was held as a note value at the tempo", () => {
            const keyboard = makeKeyboard();
            // A 6/8 meter does not change how long a note is.
            keyboard.meterArgs = [6, 1 / 8];
            keyboard.addKeyboardShortcuts();

            keyboard._boundKeyDown({ keyCode: 65 });
            jest.advanceTimersByTime(500);
            keyboard._boundKeyUp({ keyCode: 65 });

            expect(keyboard._secondsToNoteValue).toHaveBeenCalledWith(0.5);
            expect(keyboard._notesPlayed.map(note => [note.noteOctave, note.duration])).toEqual([
                ["C4", 0.25]
            ]);
        });

        test("records the gap before a note as a rest while the metronome is on", () => {
            const keyboard = makeKeyboard();
            keyboard.addKeyboardShortcuts();
            keyboard.tick = true;
            keyboard.firstNote = true;
            keyboard.endTime = Date.now();

            jest.advanceTimersByTime(1000);
            keyboard._boundKeyDown({ keyCode: 65 });

            expect(keyboard._notesPlayed).toEqual([
                { startTime: keyboard.endTime, noteOctave: "R", objId: null, duration: 0.5 }
            ]);
        });
    });
});
