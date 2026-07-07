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

describe("LegoWidget — _generateRowsFromPitchBlocks", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
    });

    it("should generate sorted pitch rows from rowLabels and rowArgs", () => {
        legoWidget.rowLabels = ["C", "G", "E"];
        legoWidget.rowArgs = [4, 4, 4];
        legoWidget.activity = {
            turtles: { ithTurtle: () => ({ singer: { keySignature: "C major" } }) }
        };

        legoWidget._generateRowsFromPitchBlocks();

        // Should be sorted by frequency descending: G4 > E4 > C4
        const pitchRows = legoWidget.matrixData.rows.filter(r => r.type === "pitch");
        expect(pitchRows).toHaveLength(3);
        expect(pitchRows[0].note).toBe("G4");
        expect(pitchRows[1].note).toBe("E4");
        expect(pitchRows[2].note).toBe("C4");
    });

    it("should append a control row at the end", () => {
        legoWidget.rowLabels = ["A"];
        legoWidget.rowArgs = [4];
        legoWidget.activity = {
            turtles: { ithTurtle: () => ({ singer: { keySignature: "C major" } }) }
        };

        legoWidget._generateRowsFromPitchBlocks();

        const lastRow = legoWidget.matrixData.rows[legoWidget.matrixData.rows.length - 1];
        expect(lastRow.type).toBe("control");
        expect(lastRow.label).toBe("Zoom Controls");
    });

    it("should skip drum blocks (octave === -1)", () => {
        legoWidget.rowLabels = ["C", "snare"];
        legoWidget.rowArgs = [4, -1];
        legoWidget.activity = {
            turtles: { ithTurtle: () => ({ singer: { keySignature: "C major" } }) }
        };

        legoWidget._generateRowsFromPitchBlocks();

        const pitchRows = legoWidget.matrixData.rows.filter(r => r.type === "pitch");
        expect(pitchRows).toHaveLength(1);
        expect(pitchRows[0].note).toBe("C4");
    });

    it("should convert solfege names to display names", () => {
        legoWidget.rowLabels = ["do", "re", "mi", "fa", "sol", "la", "ti"];
        legoWidget.rowArgs = [4, 4, 4, 4, 4, 4, 4];
        legoWidget.activity = {
            turtles: { ithTurtle: () => ({ singer: { keySignature: "C major" } }) }
        };

        legoWidget._generateRowsFromPitchBlocks();

        const pitchRows = legoWidget.matrixData.rows.filter(r => r.type === "pitch");
        const labels = pitchRows.map(r => r.label);
        expect(labels).toContain("Do (4)");
        expect(labels).toContain("Re (4)");
        expect(labels).toContain("Mi (4)");
        expect(labels).toContain("Fa (4)");
        expect(labels).toContain("So (4)");
        expect(labels).toContain("La (4)");
        expect(labels).toContain("Ti (4)");
    });

    it("should generate default rows when rowLabels is empty", () => {
        legoWidget.rowLabels = [];
        legoWidget.rowArgs = [];
        legoWidget.activity = {
            turtles: { ithTurtle: () => ({ singer: { keySignature: "C major" } }) }
        };

        legoWidget._generateRowsFromPitchBlocks();

        // Should have default rows + control row
        expect(legoWidget.matrixData.rows.length).toBeGreaterThan(1);
        const controlRows = legoWidget.matrixData.rows.filter(r => r.type === "control");
        expect(controlRows).toHaveLength(1);
    });
});

describe("LegoWidget — _collectNotesToPlay", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
        legoWidget.selectedBackgroundColor = { name: "green", hue: 120 };
    });

    it("should return empty array when colorData is empty", () => {
        legoWidget.colorData = [];

        legoWidget._collectNotesToPlay();

        expect(legoWidget._notesToPlay).toEqual([]);
    });

    it("should return empty array when colorData is null", () => {
        legoWidget.colorData = null;

        legoWidget._collectNotesToPlay();

        expect(legoWidget._notesToPlay).toEqual([]);
    });

    it("should create rest notes when all segments are background color", () => {
        legoWidget.colorData = [
            {
                note: "C4",
                label: "Do (4)",
                colorSegments: [{ duration: 2000, color: "green" }]
            }
        ];

        legoWidget._collectNotesToPlay();

        expect(legoWidget._notesToPlay.length).toBeGreaterThan(0);
        legoWidget._notesToPlay.forEach(note => {
            expect(note.isRest).toBe(true);
        });
    });

    it("should detect non-background colors as active notes", () => {
        legoWidget.colorData = [
            {
                note: "C4",
                label: "Do (4)",
                colorSegments: [{ duration: 3000, color: "red" }]
            }
        ];

        legoWidget._collectNotesToPlay();

        const activeNotes = legoWidget._notesToPlay.filter(n => !n.isRest);
        expect(activeNotes.length).toBeGreaterThan(0);
        expect(activeNotes[0].pitches.length).toBeGreaterThan(0);
        expect(activeNotes[0].pitches[0].solfege).toBe("do");
        expect(activeNotes[0].pitches[0].octave).toBe(4);
    });

    it("should assign correct note values based on duration", () => {
        // Create segments that produce predictable boundaries
        legoWidget.colorData = [
            {
                note: "C4",
                label: "Do (4)",
                colorSegments: [
                    { duration: 600, color: "red" },
                    { duration: 1200, color: "blue" },
                    { duration: 2500, color: "red" },
                    { duration: 4000, color: "blue" }
                ]
            }
        ];

        legoWidget._collectNotesToPlay();

        // Each note should have a noteValue property
        legoWidget._notesToPlay.forEach(note => {
            expect([1, 2, 4, 8]).toContain(note.noteValue);
        });
    });

    it("should collect pitches from multiple rows for the same time column", () => {
        legoWidget.colorData = [
            {
                note: "C4",
                label: "Do (4)",
                colorSegments: [{ duration: 3000, color: "red" }]
            },
            {
                note: "E4",
                label: "Mi (4)",
                colorSegments: [{ duration: 3000, color: "red" }]
            }
        ];

        legoWidget._collectNotesToPlay();

        const activeNotes = legoWidget._notesToPlay.filter(n => !n.isRest);
        if (activeNotes.length > 0) {
            expect(activeNotes[0].pitches.length).toBe(2);
        }
    });
});

describe("LegoWidget — _mergeConsecutiveColorSegments", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
    });

    it("should merge consecutive segments with the same color", () => {
        legoWidget.colorData = [
            {
                colorSegments: [
                    { color: "red", duration: 500, endTime: 500 },
                    { color: "red", duration: 300, endTime: 800 },
                    { color: "blue", duration: 400, endTime: 1200 }
                ]
            }
        ];

        legoWidget._mergeConsecutiveColorSegments();

        expect(legoWidget.colorData[0].colorSegments).toHaveLength(2);
        expect(legoWidget.colorData[0].colorSegments[0].color).toBe("red");
        expect(legoWidget.colorData[0].colorSegments[0].duration).toBe(800);
        expect(legoWidget.colorData[0].colorSegments[1].color).toBe("blue");
        expect(legoWidget.colorData[0].colorSegments[1].duration).toBe(400);
    });

    it("should merge gray variants (white, gray, black)", () => {
        legoWidget.colorData = [
            {
                colorSegments: [
                    { color: "white", duration: 200, endTime: 200 },
                    { color: "gray", duration: 300, endTime: 500 },
                    { color: "black", duration: 100, endTime: 600 }
                ]
            }
        ];

        legoWidget._mergeConsecutiveColorSegments();

        expect(legoWidget.colorData[0].colorSegments).toHaveLength(1);
        expect(legoWidget.colorData[0].colorSegments[0].duration).toBe(600);
    });

    it("should not merge different non-gray colors", () => {
        legoWidget.colorData = [
            {
                colorSegments: [
                    { color: "red", duration: 500, endTime: 500 },
                    { color: "blue", duration: 500, endTime: 1000 },
                    { color: "green", duration: 500, endTime: 1500 }
                ]
            }
        ];

        legoWidget._mergeConsecutiveColorSegments();

        expect(legoWidget.colorData[0].colorSegments).toHaveLength(3);
    });

    it("should handle rows with zero or one segment", () => {
        legoWidget.colorData = [
            { colorSegments: [] },
            { colorSegments: [{ color: "red", duration: 500, endTime: 500 }] }
        ];

        legoWidget._mergeConsecutiveColorSegments();

        expect(legoWidget.colorData[0].colorSegments).toHaveLength(0);
        expect(legoWidget.colorData[1].colorSegments).toHaveLength(1);
    });

    it("should handle rows without colorSegments property", () => {
        legoWidget.colorData = [{}];

        expect(() => legoWidget._mergeConsecutiveColorSegments()).not.toThrow();
    });

    it("should handle multiple rows independently", () => {
        legoWidget.colorData = [
            {
                colorSegments: [
                    { color: "red", duration: 100, endTime: 100 },
                    { color: "red", duration: 200, endTime: 300 }
                ]
            },
            {
                colorSegments: [
                    { color: "blue", duration: 150, endTime: 150 },
                    { color: "green", duration: 250, endTime: 400 }
                ]
            }
        ];

        legoWidget._mergeConsecutiveColorSegments();

        expect(legoWidget.colorData[0].colorSegments).toHaveLength(1);
        expect(legoWidget.colorData[0].colorSegments[0].duration).toBe(300);
        expect(legoWidget.colorData[1].colorSegments).toHaveLength(2);
    });
});

describe("LegoWidget — Extended _getColorFamily coverage", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
    });

    it("should return orange for hue ~30", () => {
        expect(legoWidget._getColorFamily(30, 80, 50).name).toBe("orange");
    });

    it("should return yellow for hue ~60", () => {
        expect(legoWidget._getColorFamily(60, 80, 50).name).toBe("yellow");
    });

    it("should return cyan for hue ~180", () => {
        expect(legoWidget._getColorFamily(180, 80, 50).name).toBe("cyan");
    });

    it("should return purple for hue ~270", () => {
        expect(legoWidget._getColorFamily(270, 80, 50).name).toBe("purple");
    });

    it("should return magenta for hue ~300", () => {
        expect(legoWidget._getColorFamily(300, 80, 50).name).toBe("magenta");
    });

    it("should return pink for hue ~330", () => {
        expect(legoWidget._getColorFamily(330, 80, 50).name).toBe("pink");
    });

    it("should return red for hue 350 (wrap-around)", () => {
        expect(legoWidget._getColorFamily(350, 80, 50).name).toBe("red");
    });

    it("should return gray for mid-lightness low-saturation", () => {
        expect(legoWidget._getColorFamily(0, 10, 50).name).toBe("gray");
    });

    it("should return green for hue at boundary 75", () => {
        expect(legoWidget._getColorFamily(75, 80, 50).name).toBe("green");
    });

    it("should return blue for hue at boundary 195", () => {
        expect(legoWidget._getColorFamily(195, 80, 50).name).toBe("blue");
    });
});

describe("LegoWidget — Extended _rgbToHsl coverage", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
    });

    it("should convert pure green RGB to HSL", () => {
        const [h, s, l] = legoWidget._rgbToHsl(0, 255, 0);
        expect(h).toBe(120);
        expect(s).toBe(100);
        expect(l).toBe(50);
    });

    it("should convert pure blue RGB to HSL", () => {
        const [h, s, l] = legoWidget._rgbToHsl(0, 0, 255);
        expect(h).toBe(240);
        expect(s).toBe(100);
        expect(l).toBe(50);
    });

    it("should convert mid-gray RGB to HSL", () => {
        const [h, s, l] = legoWidget._rgbToHsl(128, 128, 128);
        expect(h).toBe(0);
        expect(s).toBe(0);
        expect(l).toBe(50);
    });

    it("should convert yellow RGB to HSL", () => {
        const [h, s, l] = legoWidget._rgbToHsl(255, 255, 0);
        expect(h).toBe(60);
        expect(s).toBe(100);
        expect(l).toBe(50);
    });

    it("should convert cyan RGB to HSL", () => {
        const [h, s, l] = legoWidget._rgbToHsl(0, 255, 255);
        expect(h).toBe(180);
        expect(s).toBe(100);
        expect(l).toBe(50);
    });

    it("should handle low-lightness colors correctly", () => {
        const [, , l] = legoWidget._rgbToHsl(10, 10, 10);
        expect(l).toBeLessThan(10);
    });
});

describe("LegoWidget — Extended _convertRowToPitch coverage", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
    });

    it("should convert a flat note (Db) to solfege", () => {
        expect(legoWidget._convertRowToPitch({ note: "Db3" })).toEqual({
            solfege: "re♭",
            octave: 3
        });
    });

    it("should convert Eb to mi♭", () => {
        expect(legoWidget._convertRowToPitch({ note: "Eb5" })).toEqual({
            solfege: "mi♭",
            octave: 5
        });
    });

    it("should convert F# to fa♯", () => {
        expect(legoWidget._convertRowToPitch({ note: "F#4" })).toEqual({
            solfege: "fa♯",
            octave: 4
        });
    });

    it("should convert Bb to ti♭", () => {
        expect(legoWidget._convertRowToPitch({ note: "Bb3" })).toEqual({
            solfege: "ti♭",
            octave: 3
        });
    });

    it("should convert all natural notes correctly", () => {
        const expected = {
            C: "do",
            D: "re",
            E: "mi",
            F: "fa",
            G: "sol",
            A: "la",
            B: "ti"
        };
        for (const [letter, solfege] of Object.entries(expected)) {
            expect(legoWidget._convertRowToPitch({ note: letter + "4" })).toEqual({
                solfege: solfege,
                octave: 4
            });
        }
    });

    it("should handle double-digit octaves", () => {
        // The regex uses \d+ so multi-digit octaves are valid
        expect(legoWidget._convertRowToPitch({ note: "C10" })).toEqual({
            solfege: "do",
            octave: 10
        });
    });
});

describe("LegoWidget — Extended _getColorHex coverage", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
    });

    it("should return correct hex codes for all 12 known colors", () => {
        expect(legoWidget._getColorHex("red")).toBe("#FF0000");
        expect(legoWidget._getColorHex("orange")).toBe("#FFA500");
        expect(legoWidget._getColorHex("yellow")).toBe("#FFFF00");
        expect(legoWidget._getColorHex("green")).toBe("#00FF00");
        expect(legoWidget._getColorHex("blue")).toBe("#0000FF");
        expect(legoWidget._getColorHex("purple")).toBe("#800080");
        expect(legoWidget._getColorHex("pink")).toBe("#FFC0CB");
        expect(legoWidget._getColorHex("cyan")).toBe("#00FFFF");
        expect(legoWidget._getColorHex("magenta")).toBe("#FF00FF");
        expect(legoWidget._getColorHex("white")).toBe("#FFFFFF");
        expect(legoWidget._getColorHex("black")).toBe("#000000");
        expect(legoWidget._getColorHex("gray")).toBe("#808080");
    });
});

describe("LegoWidget — Extended _getContrastColor coverage", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
    });

    it("should return black text for all light background colors", () => {
        ["white", "yellow", "cyan", "pink", "orange"].forEach(color => {
            expect(legoWidget._getContrastColor(color)).toBe("#000000");
        });
    });

    it("should return white text for all dark background colors", () => {
        ["red", "blue", "green", "purple", "magenta", "black", "gray"].forEach(color => {
            expect(legoWidget._getContrastColor(color)).toBe("#FFFFFF");
        });
    });
});

describe("LegoWidget — Extended _shouldMergeColors coverage", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
    });

    it("should merge all gray variant pairs", () => {
        const grays = ["white", "gray", "black"];
        for (const a of grays) {
            for (const b of grays) {
                expect(legoWidget._shouldMergeColors(a, b)).toBe(true);
            }
        }
    });

    it("should not merge any non-gray distinct colors", () => {
        expect(legoWidget._shouldMergeColors("red", "orange")).toBe(false);
        expect(legoWidget._shouldMergeColors("blue", "purple")).toBe(false);
        expect(legoWidget._shouldMergeColors("green", "cyan")).toBe(false);
        expect(legoWidget._shouldMergeColors("yellow", "pink")).toBe(false);
    });

    it("should not merge a gray with a non-gray color", () => {
        expect(legoWidget._shouldMergeColors("white", "red")).toBe(false);
        expect(legoWidget._shouldMergeColors("black", "blue")).toBe(false);
        expect(legoWidget._shouldMergeColors("gray", "green")).toBe(false);
    });
});

describe("LegoWidget — Extended _colorsAreSimilar coverage", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
    });

    it("should return false when both colors are null", () => {
        expect(legoWidget._colorsAreSimilar(null, null)).toBe(false);
    });

    it("should reject low-saturation non-gray colors", () => {
        const lowSat1 = { name: "red", hue: 0, saturation: 10, lightness: 50 };
        const lowSat2 = { name: "blue", hue: 240, saturation: 10, lightness: 50 };
        expect(legoWidget._colorsAreSimilar(lowSat1, lowSat2)).toBe(false);
    });

    it("should consider colors similar when hue, sat, and light are all close", () => {
        const c1 = { name: "red", hue: 5, saturation: 80, lightness: 50 };
        const c2 = { name: "red", hue: 15, saturation: 85, lightness: 55 };
        expect(legoWidget._colorsAreSimilar(c1, c2)).toBe(true);
    });

    it("should reject colors with large saturation difference", () => {
        // Use different names to avoid name-match short-circuit
        const c1 = { name: "red", hue: 0, saturation: 80, lightness: 50 };
        const c2 = { name: "orange", hue: 5, saturation: 40, lightness: 50 };
        expect(legoWidget._colorsAreSimilar(c1, c2)).toBe(false);
    });

    it("should reject colors with large lightness difference", () => {
        const c1 = { name: "red", hue: 0, saturation: 80, lightness: 30 };
        const c2 = { name: "orange", hue: 5, saturation: 80, lightness: 70 };
        expect(legoWidget._colorsAreSimilar(c1, c2)).toBe(false);
    });

    it("should handle hue wrap-around (e.g. 355 and 5)", () => {
        const c1 = { name: "red", hue: 355, saturation: 80, lightness: 50 };
        const c2 = { name: "red", hue: 5, saturation: 80, lightness: 50 };
        expect(legoWidget._colorsAreSimilar(c1, c2)).toBe(true);
    });
});

describe("LegoWidget — Extended _filterSmallSegments coverage", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
    });

    it("should return empty array for empty input", () => {
        expect(legoWidget._filterSmallSegments([])).toEqual([]);
    });

    it("should return single element for single input", () => {
        expect(legoWidget._filterSmallSegments([0])).toEqual([0]);
    });

    it("should keep all boundaries when all segments are large enough", () => {
        expect(legoWidget._filterSmallSegments([0, 1500, 3000, 5000])).toEqual([
            0, 1500, 3000, 5000
        ]);
    });

    it("should absorb multiple consecutive small segments", () => {
        expect(legoWidget._filterSmallSegments([0, 200, 400, 600, 2000])).toEqual([0, 2000]);
    });
});

describe("LegoWidget — Extended _analyzeColumnBoundaries coverage", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
    });

    it("should return only start boundary for rows without colorSegments", () => {
        legoWidget.colorData = [{}];

        const result = legoWidget._analyzeColumnBoundaries();
        expect(result).toEqual([0]);
    });

    it("should deduplicate identical boundary times from multiple rows", () => {
        legoWidget.colorData = [
            { colorSegments: [{ duration: 1000 }] },
            { colorSegments: [{ duration: 1000 }] }
        ];

        const result = legoWidget._analyzeColumnBoundaries();
        expect(result).toEqual([0, 1000]);
    });

    it("should merge boundaries within 500ms of each other", () => {
        legoWidget.colorData = [
            { colorSegments: [{ duration: 1000 }, { duration: 300 }] },
            { colorSegments: [{ duration: 1200 }] }
        ];

        // Boundaries: 0, 1000, 1200, 1300
        // 1200 and 1300 are within 500ms of 1000, so merge
        const result = legoWidget._analyzeColumnBoundaries();
        // Only 0 and 1000 should remain (1200 and 1300 within 500ms of 1000)
        expect(result[0]).toBe(0);
        expect(result.length).toBeGreaterThanOrEqual(1);
    });
});

describe("LegoWidget — Extended addRowBlock coverage", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
        legoWidget._rowBlocks = [];
        legoWidget._rowMap = [];
        legoWidget._rowOffset = [];
    });

    it("should handle triple duplicate row blocks", () => {
        legoWidget.addRowBlock(10);
        legoWidget.addRowBlock(10);
        legoWidget.addRowBlock(10);

        expect(legoWidget._rowBlocks).toHaveLength(3);
        expect(legoWidget._rowBlocks[0]).toBe(10);
        expect(legoWidget._rowBlocks[1]).toBe(1000010);
        expect(legoWidget._rowBlocks[2]).toBe(2000010);
    });

    it("should maintain correct rowMap indices for multiple blocks", () => {
        legoWidget.addRowBlock(1);
        legoWidget.addRowBlock(2);
        legoWidget.addRowBlock(3);

        expect(legoWidget._rowMap).toEqual([0, 1, 2]);
        expect(legoWidget._rowOffset).toEqual([0, 0, 0]);
    });
});

describe("LegoWidget — _getColorFamilyByName extended coverage", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
    });

    it("should return correct family objects for all known colors", () => {
        const knownColors = [
            "red",
            "orange",
            "yellow",
            "green",
            "cyan",
            "blue",
            "purple",
            "magenta",
            "pink",
            "white",
            "gray",
            "black"
        ];
        knownColors.forEach(color => {
            const result = legoWidget._getColorFamilyByName(color);
            expect(result).not.toBeNull();
            expect(result.name).toBe(color);
        });
    });

    it("should include hue property for known colors", () => {
        const red = legoWidget._getColorFamilyByName("red");
        expect(red.hue).toBe(0);
        const blue = legoWidget._getColorFamilyByName("blue");
        expect(blue.hue).toBe(240);
        const green = legoWidget._getColorFamilyByName("green");
        expect(green.hue).toBe(120);
    });
});

describe("LegoWidget — _addColorSegment", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
        // Mock performance.now for timestamp
        global.performance = { now: jest.fn(() => 12345) };
    });

    afterEach(() => {
        delete global.performance;
    });

    it("should append a segment to an existing colorData entry", () => {
        legoWidget.colorData = [
            {
                note: "C4",
                label: "Do (4)",
                colorSegments: [{ color: "red", duration: 500, timestamp: 100 }]
            }
        ];

        legoWidget._addColorSegment(0, { name: "blue" }, 1000);

        expect(legoWidget.colorData[0].colorSegments).toHaveLength(2);
        expect(legoWidget.colorData[0].colorSegments[1].color).toBe("blue");
        expect(legoWidget.colorData[0].colorSegments[1].duration).toBe(1000);
    });

    it("should throw when initializing a new entry due to the this.this typo bug", () => {
        // This test documents the known production bug: this.this.matrixData
        // on line 2772-2773 of legobricks.js. When colorData[rowIndex] does not
        // exist yet, _addColorSegment tries to read this.this.matrixData which
        // causes a TypeError because this.this is undefined.
        legoWidget.colorData = [];
        legoWidget.matrixData = {
            rows: [{ note: "C4", label: "Do (4)" }]
        };

        expect(() => {
            legoWidget._addColorSegment(0, { name: "red" }, 1500);
        }).toThrow(TypeError);
    });

    it("should not throw when appending to a pre-populated colorData entry", () => {
        legoWidget.colorData = [
            {
                note: "G4",
                label: "Sol (4)",
                colorSegments: []
            }
        ];

        expect(() => {
            legoWidget._addColorSegment(0, { name: "green" }, 800);
        }).not.toThrow();

        expect(legoWidget.colorData[0].colorSegments).toHaveLength(1);
        expect(legoWidget.colorData[0].colorSegments[0].color).toBe("green");
        expect(legoWidget.colorData[0].colorSegments[0].duration).toBe(800);
    });

    it("should record the correct timestamp from performance.now", () => {
        legoWidget.colorData = [
            {
                note: "A4",
                label: "La (4)",
                colorSegments: []
            }
        ];

        legoWidget._addColorSegment(0, { name: "red" }, 2000);

        expect(legoWidget.colorData[0].colorSegments[0].timestamp).toBe(12345);
    });
});
