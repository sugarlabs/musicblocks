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

// Global mocks
global._ = msg => msg;
global.DEFAULTVOICE = "piano";

const ChordBuilderWidget = require("../chordbuilder.js");

describe("ChordBuilderWidget", () => {
    let mockActivity;
    let mockBlocks;
    let mockWindow;
    let mockAudio;
    let widget;

    beforeEach(() => {
        mockBlocks = {
            loadNewBlocks: jest.fn()
        };

        mockAudio = {
            playChord: jest.fn(),
            playProgression: jest.fn(),
            stop: jest.fn(),
            isPlaying: false
        };

        mockWindow = {
            clear: jest.fn(),
            show: jest.fn(),
            destroy: jest.fn(),
            getWidgetBody: jest.fn().mockReturnValue(document.createElement("div")),
            onclose: null
        };

        if (typeof window === "undefined") {
            global.window = {};
        }
        window.widgetWindows = {
            windowFor: jest.fn().mockReturnValue(mockWindow)
        };

        mockActivity = {
            logo: {
                synth: { trigger: jest.fn(), stop: jest.fn() },
                insideChordBuilder: false,
                chordBuilderWidget: null
            },
            blocks: mockBlocks,
            textMsg: jest.fn(),
            errorMsg: jest.fn(),
            hideMsgs: jest.fn()
        };

        widget = new ChordBuilderWidget(mockActivity, {
            ChordBuilderAudio: jest.fn().mockImplementation(() => mockAudio)
        });
    });

    describe("Initialization", () => {
        it("initializes with default values", () => {
            expect(widget.rootKey).toBe("C");
            expect(widget.mode).toBe("major");
            expect(widget.tempo).toBe(120);
            expect(widget.octave).toBe(4);
            expect(widget.progression).toEqual([]);
            expect(widget.diatonicChords).toHaveLength(7);
        });

        it("opens widget window with chord progression title", () => {
            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
                widget,
                "chord progression"
            );
            expect(mockWindow.clear).toHaveBeenCalled();
            expect(mockWindow.show).toHaveBeenCalled();
        });

        it("handles window onclose cleanup", () => {
            mockActivity.logo.insideChordBuilder = true;
            mockActivity.logo.chordBuilderWidget = widget;

            mockWindow.onclose();

            expect(mockAudio.stop).toHaveBeenCalled();
            expect(mockActivity.logo.insideChordBuilder).toBe(false);
            expect(mockActivity.logo.chordBuilderWidget).toBeNull();
            expect(mockWindow.destroy).toHaveBeenCalled();
        });
    });

    describe("Diatonic Chord Calculations", () => {
        it("calculates 7 diatonic chords for C Major correctly", () => {
            const chords = widget._buildDiatonicChords("C", "major");
            expect(chords).toHaveLength(7);

            // I: C Major (C - E - G)
            expect(chords[0].roman).toBe("I");
            expect(chords[0].name).toBe("C");
            expect(chords[0].quality).toBe("major");
            expect(chords[0].notes).toEqual(["C", "E", "G"]);

            // ii: D Minor (D - F - A)
            expect(chords[1].roman).toBe("ii");
            expect(chords[1].name).toBe("Dm");
            expect(chords[1].quality).toBe("minor");
            expect(chords[1].notes).toEqual(["D", "F", "A"]);

            // iii: E Minor (E - G - B)
            expect(chords[2].roman).toBe("iii");
            expect(chords[2].name).toBe("Em");
            expect(chords[2].quality).toBe("minor");
            expect(chords[2].notes).toEqual(["E", "G", "B"]);

            // IV: F Major (F - A - C)
            expect(chords[3].roman).toBe("IV");
            expect(chords[3].name).toBe("F");
            expect(chords[3].quality).toBe("major");
            expect(chords[3].notes).toEqual(["F", "A", "C"]);

            // V: G Major (G - B - D)
            expect(chords[4].roman).toBe("V");
            expect(chords[4].name).toBe("G");
            expect(chords[4].quality).toBe("major");
            expect(chords[4].notes).toEqual(["G", "B", "D"]);

            // vi: A Minor (A - C - E)
            expect(chords[5].roman).toBe("vi");
            expect(chords[5].name).toBe("Am");
            expect(chords[5].quality).toBe("minor");
            expect(chords[5].notes).toEqual(["A", "C", "E"]);

            // vii°: B Diminished (B - D - F)
            expect(chords[6].roman).toBe("vii°");
            expect(chords[6].name).toBe("B°");
            expect(chords[6].quality).toBe("diminished");
            expect(chords[6].notes).toEqual(["B", "D", "F"]);
        });

        it("calculates diatonic chords for A Minor correctly", () => {
            const chords = widget._buildDiatonicChords("A", "minor");
            expect(chords).toHaveLength(7);

            // i: A Minor (A - C - E)
            expect(chords[0].roman).toBe("i");
            expect(chords[0].name).toBe("Am");
            expect(chords[0].quality).toBe("minor");

            // ii°: B Diminished (B - D - F)
            expect(chords[1].roman).toBe("ii°");
            expect(chords[1].name).toBe("B°");
            expect(chords[1].quality).toBe("diminished");

            // III: C Major (C - E - G)
            expect(chords[2].roman).toBe("III");
            expect(chords[2].name).toBe("C");
            expect(chords[2].quality).toBe("major");

            // iv: D Minor (D - F - A)
            expect(chords[3].roman).toBe("iv");
            expect(chords[3].name).toBe("Dm");
            expect(chords[3].quality).toBe("minor");

            // v: E Minor (E - G - B)
            expect(chords[4].roman).toBe("v");
            expect(chords[4].name).toBe("Em");
            expect(chords[4].quality).toBe("minor");

            // VI: F Major (F - A - C)
            expect(chords[5].roman).toBe("VI");
            expect(chords[5].name).toBe("F");
            expect(chords[5].quality).toBe("major");

            // VII: G Major (G - B - D)
            expect(chords[6].roman).toBe("VII");
            expect(chords[6].name).toBe("G");
            expect(chords[6].quality).toBe("major");
        });

        it("updates chords when changing key or mode via setKeyAndMode", () => {
            widget.setKeyAndMode("G", "major");
            expect(widget.rootKey).toBe("G");
            expect(widget.diatonicChords[0].name).toBe("G");
            expect(widget.diatonicChords[4].name).toBe("D"); // V of G is D
        });
    });

    describe("Progression Management", () => {
        it("adds chord to progression and plays audition sound", () => {
            const chord = widget.diatonicChords[0];
            widget.addChord(chord);

            expect(widget.progression).toHaveLength(1);
            expect(widget.progression[0].name).toBe("C");
            expect(mockAudio.playChord).toHaveBeenCalledWith(chord, 0.4, { octave: 4 });
        });

        it("removes chord at index", () => {
            widget.addChord(widget.diatonicChords[0]); // C
            widget.addChord(widget.diatonicChords[4]); // G
            expect(widget.progression).toHaveLength(2);

            widget.removeChord(0);
            expect(widget.progression).toHaveLength(1);
            expect(widget.progression[0].name).toBe("G");
        });

        it("clears entire progression and stops audio", () => {
            widget.addChord(widget.diatonicChords[0]);
            widget.addChord(widget.diatonicChords[3]);
            expect(widget.progression).toHaveLength(2);

            widget.clearProgression();
            expect(widget.progression).toEqual([]);
            expect(mockAudio.stop).toHaveBeenCalled();
        });

        it("loads pop preset (I - V - vi - IV)", () => {
            widget.loadPreset("pop");

            expect(widget.progression).toHaveLength(4);
            expect(widget.progression[0].roman).toBe("I");
            expect(widget.progression[1].roman).toBe("V");
            expect(widget.progression[2].roman).toBe("vi");
            expect(widget.progression[3].roman).toBe("IV");
        });

        it("loads jazz preset (ii - V - I)", () => {
            widget.loadPreset("jazz");

            expect(widget.progression).toHaveLength(3);
            expect(widget.progression[0].roman).toBe("ii");
            expect(widget.progression[1].roman).toBe("V");
            expect(widget.progression[2].roman).toBe("I");
        });
    });

    describe("Playback", () => {
        it("does not trigger playback if progression is empty", () => {
            widget.progression = [];
            widget.playProgression();

            expect(mockAudio.playProgression).not.toHaveBeenCalled();
        });

        it("delegates progression playback to audio engine", () => {
            widget.loadPreset("pop");
            widget.playProgression();

            expect(mockAudio.playProgression).toHaveBeenCalledWith(
                widget.progression,
                widget.tempo,
                expect.any(Function),
                expect.any(Function),
                { octave: 4 }
            );
        });

        it("stops playback when _stopPlayback is called", () => {
            widget.loadPreset("pop");
            widget.playProgression();
            widget._stopPlayback();

            expect(mockAudio.stop).toHaveBeenCalled();
            expect(widget.activeStep).toBe(-1);
        });
    });

    describe("Save to Blocks", () => {
        it("shows error message if blocks engine is missing", () => {
            widget.blocks = null;
            widget.saveToBlocks();

            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                "Cannot save: blocks engine is unavailable."
            );
            expect(mockBlocks.loadNewBlocks).not.toHaveBeenCalled();
        });

        it("shows error message if progression is empty", () => {
            widget.progression = [];
            widget.saveToBlocks();

            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                "Add chords to your progression before saving."
            );
            expect(mockBlocks.loadNewBlocks).not.toHaveBeenCalled();
        });

        it("generates and loads block stack for chord progression", () => {
            widget.loadPreset("pop"); // 4 chords: C, G, Am, F
            widget.saveToBlocks();

            expect(mockBlocks.loadNewBlocks).toHaveBeenCalled();
            const stack = mockBlocks.loadNewBlocks.mock.calls[0][0];

            expect(Array.isArray(stack)).toBe(true);
            // Stack starts with start block and setbpm block
            expect(stack[0][1][0]).toBe("start");
            expect(stack[1][1][0]).toBe("setbpm");

            // setbpm block contains 4 connections with progression in slot 2 and trailing null
            const setbpmBlock = stack[1];
            expect(setbpmBlock[4]).toHaveLength(4);
            expect(setbpmBlock[4][0]).toBe(0); // parent (start)
            expect(setbpmBlock[4][1]).toBe(2); // bpm value
            expect(setbpmBlock[4][3]).toBeNull(); // trailing flow slot

            // Contains chordinterval blocks for each progression chord
            const chordBlocks = stack.filter(b => b[1][0] === "chordinterval");
            expect(chordBlocks).toHaveLength(4);
            expect(setbpmBlock[4][2]).toBe(chordBlocks[0][0]); // setbpm child is first chord

            // Contains exported playable notes with root and octave
            const noteBlocks = stack.filter(b => b[1][0] === "newnote");
            expect(noteBlocks).toHaveLength(4);

            const pitchBlocks = stack.filter(b => b[1][0] === "pitch");
            expect(pitchBlocks).toHaveLength(4);

            const notenameBlocks = stack.filter(b => b[1][0] === "notename");
            expect(notenameBlocks).toHaveLength(4);
            expect(notenameBlocks.map(b => b[1][1].value)).toEqual(["C", "G", "A", "F"]);

            // Octave blocks match widget.octave
            chordBlocks.forEach(chordBlock => {
                const innerNoteId = chordBlock[4][2];
                const noteBlock = stack.find(b => b[0] === innerNoteId);
                expect(noteBlock).toBeDefined();
                expect(noteBlock[1][0]).toBe("newnote");

                const vspaceId = noteBlock[4][2];
                const vspaceBlock = stack.find(b => b[0] === vspaceId);
                const pitchId = vspaceBlock[4][1];
                const pitchBlock = stack.find(b => b[0] === pitchId);
                expect(pitchBlock).toBeDefined();
                expect(pitchBlock[1][0]).toBe("pitch");

                const octaveBlockId = pitchBlock[4][2];
                const octaveBlock = stack.find(b => b[0] === octaveBlockId);
                expect(octaveBlock[1][1].value).toBe(widget.octave);
            });

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "New chord progression blocks generated.",
                3000
            );
        });
    });
});
