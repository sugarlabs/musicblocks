/**
 * MusicBlocks v3.6.2
 *
 * @author Nirav Sharma
 *
 * @copyright 2026 Nirav Sharma
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

const LegoWidget = require("../legobricks");

describe("LegoWidget Core Logic", () => {
    let legoWidget;

    beforeEach(() => {
        global._ = val => val;
        global.platformColor = {
            background: "#ffffff",
            strokeColor: "#333333",
            selectorSelected: "#0066FF",
            textColor: "#000000",
            selectorBackgroundHOFF: "#f8f8f8"
        };
        global.Synth = jest.fn().mockImplementation(() => ({
            loadSamples: jest.fn(),
            createSynth: jest.fn(),
            trigger: jest.fn(),
            stopSound: jest.fn()
        }));
        legoWidget = new LegoWidget();
    });

    afterEach(() => {
        delete global._;
        delete global.platformColor;
        delete global.Synth;
    });

    describe("_calculateFallbackFrequency", () => {
        it("should return 440 Hz for A4 (standard reference pitch)", () => {
            const frequency = legoWidget._calculateFallbackFrequency("A", 4);
            expect(frequency).toBeCloseTo(440.0, 1);
        });

        it("should return 440 Hz for la4 (solfege equivalent)", () => {
            const frequency = legoWidget._calculateFallbackFrequency("la", 4);
            expect(frequency).toBeCloseTo(440.0, 1);
        });

        it("should return correct frequencies for all letter names in octave 4", () => {
            expect(legoWidget._calculateFallbackFrequency("C", 4)).toBeCloseTo(261.63, 1);
            expect(legoWidget._calculateFallbackFrequency("D", 4)).toBeCloseTo(293.66, 1);
            expect(legoWidget._calculateFallbackFrequency("E", 4)).toBeCloseTo(329.63, 1);
            expect(legoWidget._calculateFallbackFrequency("F", 4)).toBeCloseTo(349.23, 1);
            expect(legoWidget._calculateFallbackFrequency("G", 4)).toBeCloseTo(392.0, 1);
            expect(legoWidget._calculateFallbackFrequency("A", 4)).toBeCloseTo(440.0, 1);
            expect(legoWidget._calculateFallbackFrequency("B", 4)).toBeCloseTo(493.88, 1);
        });

        it("should return correct frequencies for all solfege names in octave 4", () => {
            expect(legoWidget._calculateFallbackFrequency("do", 4)).toBeCloseTo(261.63, 1);
            expect(legoWidget._calculateFallbackFrequency("re", 4)).toBeCloseTo(293.66, 1);
            expect(legoWidget._calculateFallbackFrequency("mi", 4)).toBeCloseTo(329.63, 1);
            expect(legoWidget._calculateFallbackFrequency("fa", 4)).toBeCloseTo(349.23, 1);
            expect(legoWidget._calculateFallbackFrequency("sol", 4)).toBeCloseTo(392.0, 1);
            expect(legoWidget._calculateFallbackFrequency("la", 4)).toBeCloseTo(440.0, 1);
            expect(legoWidget._calculateFallbackFrequency("ti", 4)).toBeCloseTo(493.88, 1);
        });

        it("should handle case insensitivity correctly", () => {
            expect(legoWidget._calculateFallbackFrequency("c", 4)).toBeCloseTo(261.63, 1);
            expect(legoWidget._calculateFallbackFrequency("C", 4)).toBeCloseTo(261.63, 1);
            expect(legoWidget._calculateFallbackFrequency("DO", 4)).toBeCloseTo(261.63, 1);
            expect(legoWidget._calculateFallbackFrequency("Do", 4)).toBeCloseTo(261.63, 1);
        });

        it("should calculate correct frequencies for different octaves", () => {
            const c4 = legoWidget._calculateFallbackFrequency("C", 4);
            const c5 = legoWidget._calculateFallbackFrequency("C", 5);
            const c3 = legoWidget._calculateFallbackFrequency("C", 3);
            expect(c5).toBeCloseTo(c4 * 2, 1);
            expect(c3).toBeCloseTo(c4 / 2, 1);
        });

        it("should handle edge cases for octaves", () => {
            expect(legoWidget._calculateFallbackFrequency("A", 0)).toBeCloseTo(27.5, 1);
            expect(legoWidget._calculateFallbackFrequency("A", 8)).toBeCloseTo(7040.0, 1);
        });

        it("should fallback to C frequency for invalid pitch names", () => {
            const invalidPitchFreq = legoWidget._calculateFallbackFrequency("X", 4);
            const c4Freq = legoWidget._calculateFallbackFrequency("C", 4);
            expect(invalidPitchFreq).toBeCloseTo(c4Freq, 1);
        });

        it("should handle empty and null pitch names", () => {
            const emptyFreq = legoWidget._calculateFallbackFrequency("", 4);
            const c4Freq = legoWidget._calculateFallbackFrequency("C", 4);
            expect(emptyFreq).toBeCloseTo(c4Freq, 1);
        });
    });

    describe("_rgbToHsl", () => {
        it("should convert red RGB to HSL", () => {
            const [h, s, l] = legoWidget._rgbToHsl(255, 0, 0);
            expect(h).toBe(0);
            expect(s).toBe(100);
            expect(l).toBe(50);
        });

        it("should convert white RGB to HSL", () => {
            const [h, s, l] = legoWidget._rgbToHsl(255, 255, 255);
            expect(l).toBe(100);
        });

        it("should convert black RGB to HSL", () => {
            const [h, s, l] = legoWidget._rgbToHsl(0, 0, 0);
            expect(l).toBe(0);
        });
    });

    describe("_getColorFamily", () => {
        it("should return red for hue 0", () => {
            expect(legoWidget._getColorFamily(0, 80, 50).name).toBe("red");
        });

        it("should return green for hue 120", () => {
            expect(legoWidget._getColorFamily(120, 80, 50).name).toBe("green");
        });

        it("should return blue for hue 240", () => {
            expect(legoWidget._getColorFamily(240, 80, 50).name).toBe("blue");
        });

        it("should return white for low saturation high lightness", () => {
            expect(legoWidget._getColorFamily(0, 5, 95).name).toBe("white");
        });

        it("should return black for low saturation low lightness", () => {
            expect(legoWidget._getColorFamily(0, 5, 10).name).toBe("black");
        });
    });

    describe("_getColorHex", () => {
        it("should return correct hex for red", () => {
            expect(legoWidget._getColorHex("red")).toBe("#FF0000");
        });

        it("should return correct hex for blue", () => {
            expect(legoWidget._getColorHex("blue")).toBe("#0000FF");
        });

        it("should return gray hex for unknown color", () => {
            expect(legoWidget._getColorHex("unknown")).toBe("#808080");
        });
    });

    describe("_shouldMergeColors", () => {
        it("should merge identical colors", () => {
            expect(legoWidget._shouldMergeColors("red", "red")).toBe(true);
        });

        it("should merge gray variants", () => {
            expect(legoWidget._shouldMergeColors("white", "gray")).toBe(true);
        });

        it("should not merge different colors", () => {
            expect(legoWidget._shouldMergeColors("red", "blue")).toBe(false);
        });
    });

    describe("_getContrastColor", () => {
        it("should return black for light colors", () => {
            expect(legoWidget._getContrastColor("white")).toBe("#000000");
            expect(legoWidget._getContrastColor("yellow")).toBe("#000000");
        });

        it("should return white for dark colors", () => {
            expect(legoWidget._getContrastColor("blue")).toBe("#FFFFFF");
            expect(legoWidget._getContrastColor("red")).toBe("#FFFFFF");
        });
    });

    describe("clearBlocks", () => {
        it("should reset the row tracking arrays", () => {
            legoWidget._rowBlocks = [1];
            legoWidget._rowMap = [0];
            legoWidget._rowOffset = [0];

            legoWidget.clearBlocks();

            expect(legoWidget._rowBlocks).toEqual([]);
            expect(legoWidget._rowMap).toEqual([]);
            expect(legoWidget._rowOffset).toEqual([]);
        });
    });

    describe("addRowBlock", () => {
        it("should append a row block and update the row map and offset", () => {
            legoWidget._rowBlocks = [];
            legoWidget._rowMap = [];
            legoWidget._rowOffset = [];

            legoWidget.addRowBlock(5);

            expect(legoWidget._rowBlocks).toEqual([5]);
            expect(legoWidget._rowMap).toEqual([0]);
            expect(legoWidget._rowOffset).toEqual([0]);
        });

        it("should offset duplicate row blocks to keep them unique", () => {
            legoWidget._rowBlocks = [5];
            legoWidget._rowMap = [0];
            legoWidget._rowOffset = [0];

            legoWidget.addRowBlock(5);

            expect(legoWidget._rowBlocks).toEqual([5, 1000005]);
            expect(legoWidget._rowMap).toEqual([0, 1]);
        });
    });

    describe("_filterSmallSegments", () => {
        it("should return the boundaries unchanged when there are two or fewer", () => {
            expect(legoWidget._filterSmallSegments([0, 500])).toEqual([0, 500]);
        });

        it("should drop boundaries that create sub-minimum segments", () => {
            expect(legoWidget._filterSmallSegments([0, 500, 2000, 2500, 4000])).toEqual([
                0, 2000, 4000
            ]);
        });

        it("should keep the final boundary when everything else is filtered out", () => {
            expect(legoWidget._filterSmallSegments([0, 100, 200])).toEqual([0, 200]);
        });
    });

    describe("_analyzeColumnBoundaries", () => {
        it("should collect cumulative segment end times across rows", () => {
            legoWidget.colorData = [
                { colorSegments: [{ duration: 1000 }, { duration: 1000 }] },
                { colorSegments: [{ duration: 2000 }] }
            ];

            expect(legoWidget._analyzeColumnBoundaries()).toEqual([0, 1000, 2000]);
        });

        it("should merge boundaries that fall within the merge threshold", () => {
            legoWidget.colorData = [{ colorSegments: [{ duration: 300 }] }];

            expect(legoWidget._analyzeColumnBoundaries()).toEqual([0]);
        });
    });

    describe("_convertRowToPitch", () => {
        it("should return null when there is no note", () => {
            expect(legoWidget._convertRowToPitch({})).toBeNull();
        });

        it("should return null for an unparseable note string", () => {
            expect(legoWidget._convertRowToPitch({ note: "xyz" })).toBeNull();
        });

        it("should convert a natural note to solfege and octave", () => {
            expect(legoWidget._convertRowToPitch({ note: "C4" })).toEqual({
                solfege: "do",
                octave: 4
            });
        });

        it("should convert a sharp note to its solfege equivalent", () => {
            expect(legoWidget._convertRowToPitch({ note: "G#5" })).toEqual({
                solfege: "sol♯",
                octave: 5
            });
        });

        it("should fall back to do for a note name outside the map", () => {
            expect(legoWidget._convertRowToPitch({ note: "Cb4" })).toEqual({
                solfege: "do",
                octave: 4
            });
        });
    });

    describe("_getColorFamilyByName", () => {
        it("should return the color family for a known name", () => {
            expect(legoWidget._getColorFamilyByName("blue")).toEqual({
                name: "blue",
                hue: 240
            });
        });

        it("should return null for an unknown name", () => {
            expect(legoWidget._getColorFamilyByName("nonexistent")).toBeNull();
        });
    });

    describe("_colorsAreSimilar", () => {
        it("should return false when either color is missing", () => {
            expect(legoWidget._colorsAreSimilar(null, { name: "red" })).toBe(false);
        });

        it("should treat identical names as similar", () => {
            expect(legoWidget._colorsAreSimilar({ name: "red" }, { name: "red" })).toBe(true);
        });

        it("should allow close gray variants but not distant ones", () => {
            expect(
                legoWidget._colorsAreSimilar(
                    { name: "white", lightness: 95 },
                    { name: "gray", lightness: 90 }
                )
            ).toBe(true);
            expect(
                legoWidget._colorsAreSimilar(
                    { name: "white", lightness: 95 },
                    { name: "black", lightness: 5 }
                )
            ).toBe(false);
        });

        it("should compare saturated colors by HSL distance", () => {
            const red = { name: "red", hue: 0, saturation: 80, lightness: 50 };
            const nearRed = { name: "orange", hue: 10, saturation: 80, lightness: 50 };
            const blue = { name: "blue", hue: 240, saturation: 80, lightness: 50 };

            expect(legoWidget._colorsAreSimilar(red, nearRed)).toBe(true);
            expect(legoWidget._colorsAreSimilar(red, blue)).toBe(false);
        });
    });

    describe("_isLineBeyondImageHorizontally", () => {
        it("should return false when there is no media element", () => {
            legoWidget.imageWrapper = null;

            expect(legoWidget._isLineBeyondImageHorizontally({ currentX: 100 })).toBe(false);
        });

        it("should report whether the scan line passed the image right edge", () => {
            const mediaElement = {
                getBoundingClientRect: () => ({ left: 50, width: 100 })
            };
            legoWidget.imageWrapper = {
                querySelector: selector => (selector === "img" ? mediaElement : null)
            };
            legoWidget.gridOverlay = { getBoundingClientRect: () => ({ left: 0 }) };

            expect(legoWidget._isLineBeyondImageHorizontally({ currentX: 200 })).toBe(true);
            expect(legoWidget._isLineBeyondImageHorizontally({ currentX: 100 })).toBe(false);
        });
    });

    describe("_addColorSegment and sparse colorData safety", () => {
        it("should safely add color segment when colorData has holes/sparse elements", () => {
            legoWidget.matrixData = {
                rows: [
                    { note: "C4", label: "C (4)" },
                    null, // non-note row
                    { note: "E4", label: "E (4)" }
                ]
            };
            legoWidget.colorData = [];

            // Add color segment for index 2 (sparse slot)
            legoWidget._addColorSegment(2, { name: "red" }, 1500);

            expect(legoWidget.colorData[2]).toBeDefined();
            expect(legoWidget.colorData[2].note).toBe("E4");
            expect(legoWidget.colorData[2].label).toBe("E (4)");
            expect(legoWidget.colorData[2].colorSegments).toHaveLength(1);
            expect(legoWidget.colorData[2].colorSegments[0].color).toBe("red");
            expect(legoWidget.colorData[2].colorSegments[0].duration).toBe(1500);
        });

        it("should safely handle sparse arrays in _mergeConsecutiveColorSegments", () => {
            legoWidget.colorData = [];
            legoWidget.colorData[0] = {
                note: "C4",
                colorSegments: [
                    { color: "red", duration: 1000 },
                    { color: "red", duration: 1500 }
                ]
            };
            // colorData[1] is undefined/hole

            expect(() => legoWidget._mergeConsecutiveColorSegments()).not.toThrow();
            expect(legoWidget.colorData[0].colorSegments).toHaveLength(1);
            expect(legoWidget.colorData[0].colorSegments[0].duration).toBe(2500);
        });

        it("should safely handle sparse arrays in _analyzeColumnBoundaries", () => {
            legoWidget.colorData = [];
            legoWidget.colorData[2] = {
                note: "E4",
                colorSegments: [{ duration: 1000 }]
            };
            // colorData[0] and colorData[1] are empty/undefined

            let boundaries;
            expect(() => {
                boundaries = legoWidget._analyzeColumnBoundaries();
            }).not.toThrow();
            expect(boundaries).toEqual([0, 1000]);
        });

        it("should safely handle sparse arrays in _collectNotesToPlay", () => {
            legoWidget.colorData = [];
            legoWidget.colorData[2] = {
                note: "E4",
                label: "E (4)",
                colorSegments: [{ color: "red", duration: 1500 }]
            };
            legoWidget.colorData[3] = {
                note: "E4",
                label: "E (4)",
                colorSegments: [{ color: "red", duration: 1500 }]
            };
            legoWidget.colorData[4] = {
                note: "G4",
                label: "G (4)",
                colorSegments: [{ color: "red", duration: 200 }]
            };
            legoWidget.selectedBackgroundColor = { name: "green" };
            legoWidget.powerBase = 2;

            // mock pitch converter
            legoWidget._convertRowToPitch = rowData => {
                if (rowData.note === "E4") {
                    return { solfege: "mi", octave: 4 };
                }
                return { solfege: "sol", octave: 4 };
            };

            expect(() => legoWidget._collectNotesToPlay()).not.toThrow();
        });

        it("should play phrase and generate scanning lines", () => {
            legoWidget.activity = {
                textMsg: jest.fn(),
                hideMsgs: jest.fn()
            };
            legoWidget.playButton = {
                querySelector: jest.fn(() => ({ src: "" }))
            };
            legoWidget.gridOverlay = {
                querySelectorAll: jest.fn(() => []),
                appendChild: jest.fn(),
                getBoundingClientRect: () => ({ height: 30, width: 200 })
            };
            legoWidget.matrixData = {
                rows: [
                    { note: "C4", label: "C (4)" },
                    { note: "E4", label: "E (4)" }, // outside bounds
                    { note: null, label: "Zoom" }
                ]
            };
            legoWidget.selectedBackgroundColor = { name: "green" };

            // Mock window/animation globals
            const originalRequestAnimationFrame = global.requestAnimationFrame;
            const originalPerformance = global.performance;
            global.requestAnimationFrame = jest.fn();
            global.performance = { now: () => 1000 };

            legoWidget._playPhrase();

            expect(legoWidget.isPlaying).toBe(true);
            expect(legoWidget.colorData[0]).toBeDefined();
            expect(legoWidget.colorData[1]).toBeDefined(); // covered by the outside bounds block
            expect(legoWidget.colorData[1].colorSegments[0].color).toBe("green");
            expect(legoWidget.gridOverlay.appendChild).toHaveBeenCalled();

            // Clean up
            global.requestAnimationFrame = originalRequestAnimationFrame;
            global.performance = originalPerformance;
        });

        it("should stop playback and generate visualization after timeout", () => {
            jest.useFakeTimers();

            legoWidget.activity = {
                textMsg: jest.fn(),
                hideMsgs: jest.fn()
            };
            legoWidget.playButton = {
                querySelector: jest.fn(() => ({ src: "" }))
            };

            legoWidget.colorData = [];
            legoWidget.colorData[0] = {
                note: "C4",
                colorSegments: [{ color: "red", duration: 1500 }]
            };
            legoWidget.isPlaying = true;
            legoWidget.hasGeneratedVisualization = false;

            legoWidget._generateColorVisualization = jest.fn();
            legoWidget._drawColumnLinesOnCanvas = jest.fn();

            legoWidget._stopPlayback();

            jest.runAllTimers();

            expect(legoWidget.isPlaying).toBe(false);
            expect(legoWidget._generateColorVisualization).toHaveBeenCalled();
            expect(legoWidget._drawColumnLinesOnCanvas).toHaveBeenCalled();

            jest.useRealTimers();
        });

        it("should safely generate color visualization", () => {
            const originalCreateObjectURL = global.URL.createObjectURL;
            const originalRevokeObjectURL = global.URL.revokeObjectURL;
            global.URL.createObjectURL = jest.fn(() => "blob:url");
            global.URL.revokeObjectURL = jest.fn();

            legoWidget.colorData = [];
            legoWidget.colorData[0] = {
                note: "C4",
                label: "C (4)",
                colorSegments: [{ color: "red", duration: 1500 }]
            };

            // Mock canvas elements
            const mockCanvas = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => ({
                    fillRect: jest.fn(),
                    fillText: jest.fn(),
                    strokeRect: jest.fn(),
                    beginPath: jest.fn(),
                    moveTo: jest.fn(),
                    lineTo: jest.fn(),
                    stroke: jest.fn()
                })),
                toBlob: jest.fn(callback => callback(new Blob()))
            };

            const originalCreateElement = document.createElement;
            document.createElement = jest.fn(tag => {
                if (tag === "canvas") return mockCanvas;
                if (tag === "a") {
                    const link = originalCreateElement.call(document, "a");
                    link.click = jest.fn();
                    return link;
                }
                return originalCreateElement.call(document, tag);
            });

            legoWidget._drawColumnLines = jest.fn();
            legoWidget.playColorMusicPolyphonic = jest.fn();

            expect(() => legoWidget._generateColorVisualization()).not.toThrow();
            expect(mockCanvas.toBlob).toHaveBeenCalled();

            // Clean up
            global.URL.createObjectURL = originalCreateObjectURL;
            global.URL.revokeObjectURL = originalRevokeObjectURL;
            document.createElement = originalCreateElement;
        });

        it("should execute playColorMusicPolyphonic without crash", async () => {
            legoWidget.synth = {
                trigger: jest.fn(),
                stopSound: jest.fn()
            };
            legoWidget.selectedInstrument = "viola";
            legoWidget.selectedBackgroundColor = { name: "green" };
            legoWidget.colorData = [];
            legoWidget.colorData[0] = {
                note: "C4",
                label: "C (4)",
                colorSegments: [
                    { color: "red", duration: 1500 },
                    { color: "red", duration: 1500 },
                    { color: "red", duration: 200 }
                ]
            };

            legoWidget._analyzeColumnBoundaries = () => [0, 1500, 3000, 3100];
            legoWidget._filterSmallSegments = boundaries => boundaries;

            await expect(
                legoWidget.playColorMusicPolyphonic(legoWidget.colorData)
            ).resolves.not.toThrow();
        });

        it("should safely handle onclose cleanup without crash even if eyeDropperButton is undefined", () => {
            const mockWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                addButton: jest.fn(() => ({
                    querySelector: jest.fn(() => ({ src: "" }))
                })),
                getWidgetBody: jest.fn(() => document.createElement("div")),
                sendToCenter: jest.fn(),
                destroy: jest.fn()
            };
            const originalWidgetWindows = window.widgetWindows;
            window.widgetWindows = {
                windowFor: jest.fn(() => mockWindow)
            };

            legoWidget.matrixData = { rows: [] };
            legoWidget._stopPlayback = jest.fn();
            legoWidget._stopWebcam = jest.fn();
            legoWidget._cleanupDragListeners = jest.fn();

            legoWidget.init({ textMsg: jest.fn() });

            // Trigger onclose callback set by init
            expect(mockWindow.onclose).toBeDefined();
            expect(() => mockWindow.onclose()).not.toThrow();

            expect(legoWidget._stopPlayback).toHaveBeenCalled();
            expect(legoWidget._stopWebcam).toHaveBeenCalled();
            expect(legoWidget._cleanupDragListeners).toHaveBeenCalled();
            expect(legoWidget.imageWrapper).toBeNull();
            expect(legoWidget.webcamVideo).toBeNull();
            expect(mockWindow.destroy).toHaveBeenCalled();

            window.widgetWindows = originalWidgetWindows;
        });
    });
});
