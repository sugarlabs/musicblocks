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

        it("initializes key and mode from turtle keySignature when provided", () => {
            const turtleActivity = {
                ...mockActivity,
                turtles: {
                    ithTurtle: jest.fn().mockReturnValue({
                        singer: { keySignature: "G dorian" }
                    })
                }
            };
            const customWidget = new ChordBuilderWidget(turtleActivity, {
                ChordBuilderAudio: jest.fn().mockImplementation(() => mockAudio)
            });
            expect(customWidget.rootKey).toBe("G");
            expect(customWidget.mode).toBe("dorian");
            expect(customWidget.diatonicChords[0].name).toBe("Gm");
        });

        it("falls back to major and notifies user when turtle mode is not a supported diatonic mode", () => {
            const turtleActivity = {
                ...mockActivity,
                turtles: {
                    ithTurtle: jest.fn().mockReturnValue({
                        singer: { keySignature: "C pentatonic" }
                    })
                }
            };
            const customWidget = new ChordBuilderWidget(turtleActivity, {
                ChordBuilderAudio: jest.fn().mockImplementation(() => mockAudio)
            });
            expect(customWidget.rootKey).toBe("C");
            expect(customWidget.mode).toBe("major");
            expect(turtleActivity.textMsg).toHaveBeenCalledWith(
                "Mode not supported by chord progression widget. Defaulting to major.",
                3000
            );
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

        it("rejects non-diatonic mode in setKeyAndMode and defaults to major", () => {
            widget.setKeyAndMode("D", "blues");
            expect(widget.rootKey).toBe("D");
            expect(widget.mode).toBe("major");
            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Mode not supported by chord progression widget. Defaulting to major.",
                3000
            );
        });
    });

    describe("Progression Management", () => {
        it("auditions chord without adding to progression", () => {
            const chord = widget.diatonicChords[0];
            widget.auditionChord(chord);

            expect(widget.progression).toHaveLength(0);
            expect(mockAudio.playChord).toHaveBeenCalledWith(chord, 0.4, { octave: 4 });
        });

        it("syncs key and mode from turtle state via syncKeyAndModeFromTurtle", () => {
            widget.turtles = {
                ithTurtle: jest.fn().mockReturnValue({
                    singer: { keySignature: "D minor" }
                })
            };
            widget.syncKeyAndModeFromTurtle(0);

            expect(widget.rootKey).toBe("D");
            expect(widget.mode).toBe("minor");
            expect(widget.diatonicChords[0].name).toBe("Dm");
        });

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

        it("shows error message if all beats are empty", () => {
            widget.progression = [null, null, null];
            widget.saveToBlocks();

            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                "Add chords to your progression before saving."
            );
            expect(mockBlocks.loadNewBlocks).not.toHaveBeenCalled();
        });

        it.each([[[3]], [[0, 2]], [[1, 3]]])(
            "preserves empty beats when saving chords in cells %j",
            cells => {
                const body = mockWindow.getWidgetBody();
                cells.forEach(cellIndex => {
                    body.querySelectorAll(".bar-grid-cell")[cellIndex].click();
                    const picker = body.querySelector(".bar-grid-cell select");
                    picker.value = "0";
                    picker.dispatchEvent(new Event("change", { bubbles: true }));
                });
                const progression = widget.progression.slice();

                body.querySelector("#chordSaveBtn").click();

                expect(mockBlocks.loadNewBlocks).toHaveBeenCalledTimes(1);
                const stack = mockBlocks.loadNewBlocks.mock.calls[0][0];
                const notes = stack.filter(block => block[1][0] === "newnote");
                expect(notes).toHaveLength(cells[cells.length - 1] + 1);
                let previousBlock = stack[0];
                notes.forEach((note, index) => {
                    const content = stack[note[4][2]];
                    const isChord = cells.includes(index);
                    const flowBlock = isChord ? stack[note[4][0]] : note;
                    expect(previousBlock[4][previousBlock[4].length - 1]).toBe(flowBlock[0]);
                    expect(flowBlock[4][0]).toBe(previousBlock[0]);
                    expect(content[1][0]).toBe(isChord ? "pitch" : "rest2");
                    expect(content[4][0]).toBe(note[0]);
                    if (isChord) {
                        expect(flowBlock[1][0]).toBe("chordinterval");
                        expect(flowBlock[4][2]).toBe(note[0]);
                        expect(stack[content[4][1]][1][1].value).toBe("C");
                    }
                    const duration = stack[note[4][1]];
                    expect(duration[1][0]).toBe("divide");
                    expect(stack[duration[4][1]][1][1].value).toBe(1);
                    expect(stack[duration[4][2]][1][1].value).toBe(4);
                    previousBlock = isChord ? flowBlock : stack[note[4][3]];
                });
                expect(previousBlock[4][previousBlock[4].length - 1]).toBeNull();
                expect(stack.filter(block => block[1][0] === "chordinterval")).toHaveLength(
                    cells.length
                );
                expect(widget.progression).toEqual(progression);
                expect(mockActivity.errorMsg).not.toHaveBeenCalled();
                expect(mockActivity.textMsg).toHaveBeenCalledWith(
                    "New chord progression blocks generated.",
                    3000
                );
            }
        );

        it("generates and loads block stack for chord progression", () => {
            widget.loadPreset("pop"); // 4 chords: C, G, Am, F
            widget.saveToBlocks();

            expect(mockBlocks.loadNewBlocks).toHaveBeenCalled();
            const stack = mockBlocks.loadNewBlocks.mock.calls[0][0];

            expect(Array.isArray(stack)).toBe(true);

            // Stack starts with start block only — BPM is intentionally omitted
            expect(stack[0][1][0]).toBe("start");
            // No setbpm block in the export
            expect(stack.find(b => b[1][0] === "setbpm")).toBeUndefined();

            // Contains chordinterval blocks for each progression chord
            const chordBlocks = stack.filter(b => b[1][0] === "chordinterval");
            expect(chordBlocks).toHaveLength(4);
            // start block's flow slot (index 1) points to the first chord block
            expect(stack[0][4][1]).toBe(chordBlocks[0][0]);

            // Contains exported playable notes with root and octave
            const noteBlocks = stack.filter(b => b[1][0] === "newnote");
            expect(noteBlocks).toHaveLength(4);

            const pitchBlocks = stack.filter(b => b[1][0] === "pitch");
            expect(pitchBlocks).toHaveLength(4);

            const notenameBlocks = stack.filter(b => b[1][0] === "notename");
            expect(notenameBlocks).toHaveLength(4);
            expect(notenameBlocks.map(b => b[1][1].value)).toEqual(["C", "G", "A", "F"]);

            // No vspace blocks in the export
            expect(stack.filter(b => b[1][0] === "vspace")).toHaveLength(0);

            // newnote body slot (index 2) connects directly to pitch — no vspace
            chordBlocks.forEach(chordBlock => {
                const innerNoteId = chordBlock[4][2];
                const noteBlock = stack.find(b => b[0] === innerNoteId);
                expect(noteBlock).toBeDefined();
                expect(noteBlock[1][0]).toBe("newnote");

                // Body slot is directly the pitch block, not a vspace
                const pitchId = noteBlock[4][2];
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

    describe("UI and UX Interactions", () => {
        let body;

        beforeEach(() => {
            body = mockWindow.getWidgetBody();
        });

        it("displays active key and scale/mode badges without dropdown selects or BPM input", () => {
            const keyDisplay = body.querySelector("#chordKeyDisplay");
            const modeDisplay = body.querySelector("#chordModeDisplay");
            expect(keyDisplay).not.toBeNull();
            expect(keyDisplay.textContent).toBe("C");
            expect(modeDisplay).not.toBeNull();
            expect(modeDisplay.textContent).toBe("Major");

            // Redundant dropdowns and tempo inputs are removed
            expect(body.querySelector("#chordKeySelect")).toBeNull();
            expect(body.querySelector("#chordModeSelect")).toBeNull();
            expect(body.querySelector("#chordTempoInput")).toBeNull();
        });

        it("clicking chord card auditions chord without adding it to progression", () => {
            const card = body.querySelector(".diatonic-chord-card");
            expect(card).not.toBeNull();

            card.click();
            expect(mockAudio.playChord).toHaveBeenCalledWith(widget.diatonicChords[0], 0.4, {
                octave: 4
            });
            expect(widget.progression).toHaveLength(0);
        });

        it("clicking add button on card adds chord to progression", () => {
            const addBtn = body.querySelector(".chord-card-add-btn");
            expect(addBtn).not.toBeNull();

            addBtn.click();
            expect(widget.progression).toHaveLength(1);
            expect(widget.progression[0].name).toBe("C");
        });

        it("renders bar-grid table with bar rows and beat columns", () => {
            widget.loadPreset("pop"); // 4 chords
            const table = body.querySelector("#chordBarGridTable");
            expect(table).not.toBeNull();

            // Default 4 bars × 4 beats = 16 cells
            const cells = body.querySelectorAll(".bar-grid-cell");
            expect(cells.length).toBe(widget.numBars * widget.beatsPerBar);

            // First 4 cells (bar 1) should show the pop preset chords
            const filledCells = Array.from(cells).filter(c => c.querySelector("div") !== null);
            expect(filledCells.length).toBe(4);
        });

        it("allows keyboard activation on chord card via Enter and Space", () => {
            const card = body.querySelector(".diatonic-chord-card");
            expect(card).not.toBeNull();

            const enterEvent = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
            Object.defineProperty(enterEvent, "target", { value: card });
            card.dispatchEvent(enterEvent);

            expect(mockAudio.playChord).toHaveBeenCalledWith(widget.diatonicChords[0], 0.4, {
                octave: 4
            });

            mockAudio.playChord.mockClear();
            const spaceEvent = new KeyboardEvent("keydown", { key: " ", bubbles: true });
            Object.defineProperty(spaceEvent, "target", { value: card });
            card.dispatchEvent(spaceEvent);

            expect(mockAudio.playChord).toHaveBeenCalledWith(widget.diatonicChords[0], 0.4, {
                octave: 4
            });
        });

        it("does not hijack keyboard events when child element inside card is focused", () => {
            const card = body.querySelector(".diatonic-chord-card");
            const addBtn = body.querySelector(".chord-card-add-btn");
            mockAudio.playChord.mockClear();

            const enterEvent = new KeyboardEvent("keydown", {
                key: "Enter",
                bubbles: true,
                cancelable: true
            });
            Object.defineProperty(enterEvent, "target", { value: addBtn });
            card.dispatchEvent(enterEvent);

            expect(enterEvent.defaultPrevented).toBe(false);
            expect(mockAudio.playChord).not.toHaveBeenCalled();
        });

        it("handles card click and card add button click/keydown", () => {
            jest.useFakeTimers();
            const card = body.querySelector(".diatonic-chord-card");
            const addBtn = card.querySelector(".chord-card-add-btn");

            // Click add button
            const stopPropSpy = jest.fn();
            addBtn.onclick({ stopPropagation: stopPropSpy });
            expect(stopPropSpy).toHaveBeenCalled();
            expect(widget.progression.length).toBeGreaterThan(0);

            // Keydown on add button
            const stopPropKeySpy = jest.fn();
            addBtn.onkeydown({ stopPropagation: stopPropKeySpy });
            expect(stopPropKeySpy).toHaveBeenCalled();

            // Click card to audition and test timer
            card.onclick();
            expect(mockAudio.playChord).toHaveBeenCalled();
            jest.advanceTimersByTime(250);
            expect(card.style.background).toBe("rgba(255, 255, 255, 0.95)");
            jest.useRealTimers();
        });

        it("handles preset select change and meter input changes", () => {
            const presetSelect = body.querySelector("#chordPresetSelect");
            expect(presetSelect).not.toBeNull();

            presetSelect.onchange({ target: { value: "canon" } });
            expect(widget.progression.length).toBe(8);

            presetSelect.onchange({ target: { value: "" } });
            // should not throw and progression remains unchanged
            expect(widget.progression.length).toBe(8);

            const barsInput = body.querySelector("#chordNumBarsInput");
            barsInput.onchange({ target: { value: "6" } });
            expect(widget.numBars).toBe(6);

            // invalid input ignored
            barsInput.onchange({ target: { value: "0" } });
            expect(widget.numBars).toBe(6);
            barsInput.onchange({ target: { value: "20" } });
            expect(widget.numBars).toBe(6);

            const beatsSelect = body.querySelector("#chordBeatsSelect");
            beatsSelect.onchange({ target: { value: "3" } });
            expect(widget.beatsPerBar).toBe(3);
        });

        it("handles play/stop button toggling and progression playback callbacks", () => {
            widget.progression = [{ name: "C", roman: "I", notes: ["C", "E", "G"] }];

            let stepCb, doneCb;
            mockAudio.playProgression.mockImplementation((prog, tempo, onStep, onDone) => {
                stepCb = onStep;
                doneCb = onDone;
            });

            // play button when not playing
            mockAudio.isPlaying = false;
            widget.playBtn.onclick();
            expect(mockAudio.playProgression).toHaveBeenCalled();

            // trigger callbacks
            stepCb(0);
            expect(widget.activeStep).toBe(0);

            doneCb();
            expect(widget.activeStep).toBe(-1);

            // play button when playing
            mockAudio.isPlaying = true;
            widget.playBtn.onclick();
            expect(mockAudio.stop).toHaveBeenCalled();
        });

        it("handles table cell remove button and empty cell chord picker", () => {
            widget.progression = [{ name: "C", roman: "I", notes: ["C", "E", "G"] }];
            widget._renderBarGrid();

            // Cell with chord: click remove button
            const firstCell = body.querySelector(".bar-grid-cell");
            const removeBtn = firstCell.querySelector("button");
            expect(removeBtn).not.toBeNull();
            const stopSpy = jest.fn();
            removeBtn.onclick({ stopPropagation: stopSpy });
            expect(stopSpy).toHaveBeenCalled();
            expect(widget.progression.length).toBe(0);

            // Empty cell: click to open inline picker
            const emptyCell = body.querySelectorAll(".bar-grid-cell")[0];
            emptyCell.onclick();
            const picker = emptyCell.querySelector("select");
            expect(picker).not.toBeNull();

            // Select a chord
            picker.onchange({ target: { value: "0" } });
            expect(widget.progression.length).toBe(1);

            // Open picker on cell 2 and blur
            const secondCell = body.querySelectorAll(".bar-grid-cell")[1];
            secondCell.onclick();
            const picker2 = secondCell.querySelector("select");
            expect(picker2).not.toBeNull();
            picker2.onblur();
            expect(body.querySelectorAll(".bar-grid-cell")[1].querySelector("select")).toBeNull();

            // Null-padding when cellIndex > progression.length
            widget.progression = [];
            widget._renderBarGrid();
            const cell3 = body.querySelectorAll(".bar-grid-cell")[3];
            cell3.onclick();
            const picker3 = cell3.querySelector("select");
            picker3.onchange({ target: { value: "1" } });
            expect(widget.progression.length).toBe(4);

            // Replace chord when cellIndex < progression.length
            const cell1 = body.querySelectorAll(".bar-grid-cell")[1];
            cell1.onclick();
            const picker1 = cell1.querySelector("select");
            picker1.onchange({ target: { value: "2" } });
            expect(widget.progression[1]).not.toBeNull();
        });
    });

    describe("Edge Cases and Fallback Logic", () => {
        it("calculates diatonic notes using internal interval patterns when scaleBuilder is unavailable", () => {
            const origBuildScale = global.buildScale;
            try {
                // Force scaleBuilder check to fail/throw
                global.buildScale = jest.fn(() => null);
                expect(widget._getScaleNotes("C", "major")).toHaveLength(7);
                expect(widget._getScaleNotes("A", "minor")).toHaveLength(7);
                expect(widget._getScaleNotes("D", "dorian")).toHaveLength(7);
                expect(widget._getScaleNotes("E", "phrygian")).toHaveLength(7);
                expect(widget._getScaleNotes("F", "lydian")).toHaveLength(7);
                expect(widget._getScaleNotes("G", "mixolydian")).toHaveLength(7);
                expect(widget._getScaleNotes("B", "locrian")).toHaveLength(7);
                expect(widget._getScaleNotes("C", "unknown")).toHaveLength(7);

                global.buildScale = jest.fn(() => {
                    throw new Error("fail");
                });
                expect(widget._getScaleNotes("C", "major")).toHaveLength(7);
            } finally {
                global.buildScale = origBuildScale;
            }
        });

        it("detects augmented triad quality when intervalThird is 4 and intervalFifth is 8", () => {
            const origGetScaleNotes = widget._getScaleNotes;
            widget._getScaleNotes = jest.fn().mockReturnValue(["C", "D", "E", "F", "G#", "A", "B"]);
            const chords = widget._buildDiatonicChords("C", "custom");
            expect(chords[0].quality).toBe("augmented");
            expect(chords[0].name).toBe("C+");
            expect(chords[0].roman).toBe("I+");
            widget._getScaleNotes = origGetScaleNotes;
        });

        it("handles window onclose cleanup properly", () => {
            mockActivity.logo.insideChordBuilder = true;
            mockActivity.logo.chordBuilderWidget = widget;
            expect(mockWindow.onclose).toBeDefined();

            mockWindow.onclose();
            expect(mockActivity.logo.insideChordBuilder).toBe(false);
            expect(mockActivity.logo.chordBuilderWidget).toBeNull();
            expect(mockAudio.stop).toHaveBeenCalled();
        });
    });
});
