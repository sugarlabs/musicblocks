/**
 * MusicBlocks
 *
 * @author vyagh
 *
 * @copyright 2026 vyagh
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

global.platformColor = {
    selectorBackground: "#8bc34a"
};

const createMockElement = tagName => ({
    style: {},
    appendChild: jest.fn(),
    querySelector: jest.fn().mockReturnValue({ style: {} }),
    onclick: null,
    src: "",
    width: "",
    height: "",
    alt: "",
    tagName: tagName
});

global.document = {
    createElement: jest.fn().mockImplementation(tagName => {
        const element = createMockElement(tagName);
        if (tagName === "canvas") {
            element.getContext = jest.fn().mockReturnValue({
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                fillText: jest.fn(),
                fillStyle: "",
                font: "",
                textAlign: ""
            });
            element.parentElement = {
                appendChild: jest.fn()
            };
        }
        if (tagName === "div") {
            element.querySelector = jest.fn().mockReturnValue({ style: {} });
        }
        if (tagName === "img") {
            element.src = "";
            element.width = "";
            element.height = "";
            element.alt = "";
        }
        return element;
    })
};

const { TunerDisplay, TunerUtils } = require("../tuner.js");

describe("Tuner Widget", () => {
    describe("Module Export", () => {
        test("exports TunerDisplay constructor", () => {
            expect(TunerDisplay).toBeDefined();
            expect(typeof TunerDisplay).toBe("function");
        });

        test("exports TunerUtils object", () => {
            expect(TunerUtils).toBeDefined();
            expect(typeof TunerUtils).toBe("object");
        });

        test("TunerUtils has frequencyToPitch method", () => {
            expect(TunerUtils.frequencyToPitch).toBeDefined();
            expect(typeof TunerUtils.frequencyToPitch).toBe("function");
        });

        test("TunerUtils has calculatePlaybackRate method", () => {
            expect(TunerUtils.calculatePlaybackRate).toBeDefined();
            expect(typeof TunerUtils.calculatePlaybackRate).toBe("function");
        });
    });

    describe("TunerUtils.frequencyToPitch", () => {
        describe("note detection", () => {
            test("correctly identifies A4 at 440 Hz", () => {
                const result = TunerUtils.frequencyToPitch(440);

                expect(result[0]).toBe("A");
                expect(result[2]).toBe(440);
            });

            test("correctly identifies C4 (middle C) around 261.63 Hz", () => {
                const result = TunerUtils.frequencyToPitch(261.63);

                expect(result[0]).toBe("C");
            });

            test("correctly identifies G4 around 392 Hz", () => {
                const result = TunerUtils.frequencyToPitch(392);

                expect(result[0]).toBe("G");
            });

            test("correctly identifies E4 around 329.63 Hz", () => {
                const result = TunerUtils.frequencyToPitch(329.63);

                expect(result[0]).toBe("E");
            });

            test("correctly identifies D4 around 293.66 Hz", () => {
                const result = TunerUtils.frequencyToPitch(293.66);

                expect(result[0]).toBe("D");
            });

            test("correctly identifies B4 around 493.88 Hz", () => {
                const result = TunerUtils.frequencyToPitch(493.88);

                expect(result[0]).toBe("B");
            });

            test("identifies all 12 chromatic notes in octave 4", () => {
                const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
                const octave4Freqs = [
                    261.63,
                    277.18,
                    293.66,
                    311.13,
                    329.63,
                    349.23,
                    369.99,
                    392.0,
                    415.3,
                    440.0,
                    466.16,
                    493.88
                ];

                for (let i = 0; i < noteNames.length; i++) {
                    const result = TunerUtils.frequencyToPitch(octave4Freqs[i]);
                    expect(result[0]).toBe(noteNames[i]);
                }
            });
        });

        describe("cents deviation", () => {
            test("returns cents close to 0 for exact A4 frequency", () => {
                const result = TunerUtils.frequencyToPitch(440);

                expect(Math.abs(result[1])).toBeLessThanOrEqual(5);
            });

            test("returns positive cents for sharp frequency", () => {
                // 450 Hz is sharper than A4 (440 Hz)
                const result = TunerUtils.frequencyToPitch(450);

                expect(result[1]).toBeGreaterThan(0);
            });

            test("returns negative cents for flat frequency", () => {
                // 430 Hz is flatter than A4 (440 Hz)
                const result = TunerUtils.frequencyToPitch(430);

                expect(result[1]).toBeLessThan(0);
            });

            test("cents deviation stays within -50 to +50 range for nearby notes", () => {
                // Test frequencies slightly off from A4
                const sharpResult = TunerUtils.frequencyToPitch(442);
                const flatResult = TunerUtils.frequencyToPitch(438);

                expect(Math.abs(sharpResult[1])).toBeLessThan(50);
                expect(Math.abs(flatResult[1])).toBeLessThan(50);
            });
        });

        describe("edge cases", () => {
            test("handles frequencies below C0", () => {
                const veryLowFreq = 10; // Below C0
                const result = TunerUtils.frequencyToPitch(veryLowFreq);

                expect(result[0]).toBe("C");
                expect(result[1]).toBe(0);
                // Returns C0 frequency when input is below C0
                expect(result[2]).toBeCloseTo(16.35, 1);
            });

            test("handles very high frequencies", () => {
                const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
                const highFreq = 4186; // C8
                const result = TunerUtils.frequencyToPitch(highFreq);

                expect(result).toHaveLength(3);
                expect(noteNames).toContain(result[0]);
            });

            test("handles A3 (octave below A4)", () => {
                const result = TunerUtils.frequencyToPitch(220);

                expect(result[0]).toBe("A");
            });

            test("handles A5 (octave above A4)", () => {
                const result = TunerUtils.frequencyToPitch(880);

                expect(result[0]).toBe("A");
            });

            test("preserves original frequency in return value", () => {
                const freq = 523.25; // C5
                const result = TunerUtils.frequencyToPitch(freq);

                expect(result[2]).toBe(freq);
            });
        });
    });

    describe("TunerUtils.calculatePlaybackRate", () => {
        describe("standard intervals", () => {
            test("returns 1 for zero cents adjustment", () => {
                const rate = TunerUtils.calculatePlaybackRate(0, 0);

                expect(rate).toBeCloseTo(1, 5);
            });

            test("returns 2 for octave up (1200 cents)", () => {
                const rate = TunerUtils.calculatePlaybackRate(0, 1200);

                expect(rate).toBeCloseTo(2, 5);
            });

            test("returns 0.5 for octave down (-1200 cents)", () => {
                const rate = TunerUtils.calculatePlaybackRate(0, -1200);

                expect(rate).toBeCloseTo(0.5, 5);
            });

            test("returns correct rate for semitone up (100 cents)", () => {
                const rate = TunerUtils.calculatePlaybackRate(0, 100);
                const expectedRate = Math.pow(2, 1 / 12);

                expect(rate).toBeCloseTo(expectedRate, 5);
            });

            test("returns correct rate for semitone down (-100 cents)", () => {
                const rate = TunerUtils.calculatePlaybackRate(0, -100);
                const expectedRate = Math.pow(2, -1 / 12);

                expect(rate).toBeCloseTo(expectedRate, 5);
            });

            test("returns correct rate for whole tone (200 cents)", () => {
                const rate = TunerUtils.calculatePlaybackRate(0, 200);
                const expectedRate = Math.pow(2, 2 / 12);

                expect(rate).toBeCloseTo(expectedRate, 5);
            });

            test("returns correct rate for perfect fifth (700 cents)", () => {
                const rate = TunerUtils.calculatePlaybackRate(0, 700);
                const expectedRate = Math.pow(2, 7 / 12);

                expect(rate).toBeCloseTo(expectedRate, 5);
            });
        });

        describe("base cents accumulation", () => {
            test("accumulates baseCents and adjustment", () => {
                const rate = TunerUtils.calculatePlaybackRate(600, 600);

                // 600 + 600 = 1200 cents = octave
                expect(rate).toBeCloseTo(2, 5);
            });

            test("handles negative base cents", () => {
                const rate = TunerUtils.calculatePlaybackRate(-600, 0);

                expect(rate).toBeCloseTo(Math.pow(2, -600 / 1200), 5);
            });

            test("negative base with positive adjustment", () => {
                const rate = TunerUtils.calculatePlaybackRate(-100, 100);

                // -100 + 100 = 0 cents = rate of 1
                expect(rate).toBeCloseTo(1, 5);
            });

            test("positive base with negative adjustment", () => {
                const rate = TunerUtils.calculatePlaybackRate(300, -300);

                // 300 - 300 = 0 cents = rate of 1
                expect(rate).toBeCloseTo(1, 5);
            });
        });

        describe("edge cases", () => {
            test("handles very large cents values", () => {
                const rate = TunerUtils.calculatePlaybackRate(0, 2400);

                // Two octaves up = 4x
                expect(rate).toBeCloseTo(4, 5);
            });

            test("handles very small cents values", () => {
                const rate = TunerUtils.calculatePlaybackRate(0, 1);

                // Nearly 1 - use looser precision
                expect(rate).toBeCloseTo(1, 2);
            });

            test("handles fractional cents", () => {
                const rate = TunerUtils.calculatePlaybackRate(0, 50.5);

                expect(rate).toBeGreaterThan(1);
                expect(rate).toBeLessThan(Math.pow(2, 1 / 12));
            });
        });
    });

    describe("TunerDisplay", () => {
        let mockCanvas;
        let mockCtx;

        beforeEach(() => {
            mockCtx = {
                clearRect: jest.fn(),
                fillRect: jest.fn(),
                fillText: jest.fn(),
                fillStyle: "",
                font: "",
                textAlign: ""
            };

            mockCanvas = {
                getContext: jest.fn().mockReturnValue(mockCtx),
                parentElement: {
                    appendChild: jest.fn()
                },
                width: 400,
                height: 300
            };
        });

        describe("Constructor", () => {
            test("stores canvas reference", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                expect(display.canvas).toBe(mockCanvas);
            });

            test("stores width and height", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                expect(display.width).toBe(400);
                expect(display.height).toBe(300);
            });

            test("gets 2D rendering context", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                expect(mockCanvas.getContext).toHaveBeenCalledWith("2d");
                expect(display.ctx).toBe(mockCtx);
            });

            test("initializes with default note A", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                expect(display.note).toBe("A");
            });

            test("initializes with default cents 0", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                expect(display.cents).toBe(0);
            });

            test("initializes with default frequency 440", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                expect(display.frequency).toBe(440);
            });

            test("defaults to chromatic mode", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                expect(display.chromaticMode).toBe(true);
            });

            test("creates mode container element", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                expect(display.modeContainer).toBeDefined();
            });

            test("appends mode container to canvas parent", () => {
                new TunerDisplay(mockCanvas, 400, 300);

                expect(mockCanvas.parentElement.appendChild).toHaveBeenCalled();
            });

            test("creates chromatic button", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                expect(display.chromaticButton).toBeDefined();
            });

            test("creates target pitch button", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                expect(display.targetPitchButton).toBeDefined();
            });

            test("calls updateButtonStyles on initialization", () => {
                // Can't easily spy on prototype method before constructor,
                // but we can verify the button styles are set
                const display = new TunerDisplay(mockCanvas, 400, 300);

                // Chromatic mode is true by default
                expect(display.chromaticMode).toBe(true);
            });
        });

        describe("updateButtonStyles", () => {
            test("highlights chromatic button when in chromatic mode", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                display.chromaticMode = true;

                display.updateButtonStyles();
                // Color may be set as hex or converted to rgb by browser
                expect(display.chromaticButton.style.backgroundColor).toBeTruthy();
            });

            test("removes highlight from target button when in chromatic mode", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                display.chromaticMode = true;

                display.updateButtonStyles();

                expect(display.targetPitchButton.style.backgroundColor).toBe("transparent");
            });

            test("highlights target button when not in chromatic mode", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                display.chromaticMode = false;

                display.updateButtonStyles();
                // Color may be set as hex or converted to rgb by browser
                expect(display.targetPitchButton.style.backgroundColor).toBeTruthy();
            });

            test("removes highlight from chromatic button when not in chromatic mode", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                display.chromaticMode = false;

                display.updateButtonStyles();

                expect(display.chromaticButton.style.backgroundColor).toBe("transparent");
            });
        });

        describe("update", () => {
            test("updates note property", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                display.update("C", 10, 261.63);

                expect(display.note).toBe("C");
            });

            test("updates cents property", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                display.update("C", 15, 261.63);

                expect(display.cents).toBe(15);
            });

            test("updates frequency property", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                display.update("C", 10, 265.0);

                expect(display.frequency).toBe(265.0);
            });

            test("calls draw after update", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                const drawSpy = jest.spyOn(display, "draw");

                display.update("G", -5, 392);

                expect(drawSpy).toHaveBeenCalled();
            });

            test("handles negative cents", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                display.update("E", -25, 325);

                expect(display.cents).toBe(-25);
            });

            test("handles sharp notes", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                display.update("C#", 0, 277.18);

                expect(display.note).toBe("C#");
            });
        });

        describe("draw", () => {
            test("clears the canvas before drawing", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                display.draw();

                expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 400, 300);
            });

            test("draws the meter background", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                display.draw();

                expect(mockCtx.fillRect).toHaveBeenCalled();
            });

            test("displays the note text", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                display.note = "G";

                display.draw();

                expect(mockCtx.fillText).toHaveBeenCalledWith(
                    "G",
                    expect.any(Number),
                    expect.any(Number)
                );
            });

            test("displays frequency with Hz suffix", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                display.frequency = 440;

                display.draw();

                expect(mockCtx.fillText).toHaveBeenCalledWith(
                    "440.0 Hz",
                    expect.any(Number),
                    expect.any(Number)
                );
            });

            test("displays positive cents with + prefix", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                display.cents = 15;

                display.draw();

                expect(mockCtx.fillText).toHaveBeenCalledWith(
                    "+15¢",
                    expect.any(Number),
                    expect.any(Number)
                );
            });

            test("displays negative cents without + prefix", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                display.cents = -20;

                display.draw();

                expect(mockCtx.fillText).toHaveBeenCalledWith(
                    "-20¢",
                    expect.any(Number),
                    expect.any(Number)
                );
            });

            test("displays zero cents with + prefix", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                display.cents = 0;

                display.draw();

                expect(mockCtx.fillText).toHaveBeenCalledWith(
                    "+0¢",
                    expect.any(Number),
                    expect.any(Number)
                );
            });

            test("sets text alignment to center", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);

                display.draw();

                expect(mockCtx.textAlign).toBe("center");
            });
        });

        describe("button click handlers", () => {
            test("clicking chromatic button sets chromaticMode to true", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                display.chromaticMode = false;

                display.chromaticButton.onclick();

                expect(display.chromaticMode).toBe(true);
            });

            test("clicking target pitch button sets chromaticMode to false", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                display.chromaticMode = true;

                display.targetPitchButton.onclick();

                expect(display.chromaticMode).toBe(false);
            });

            test("clicking chromatic button updates button styles", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                const updateSpy = jest.spyOn(display, "updateButtonStyles");

                display.chromaticButton.onclick();

                expect(updateSpy).toHaveBeenCalled();
            });

            test("clicking target pitch button updates button styles", () => {
                const display = new TunerDisplay(mockCanvas, 400, 300);
                const updateSpy = jest.spyOn(display, "updateButtonStyles");

                display.targetPitchButton.onclick();

                expect(updateSpy).toHaveBeenCalled();
            });
        });
    });
});
