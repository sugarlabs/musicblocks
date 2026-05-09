/**
 * @file Tests for TemperamentWidget
 * Tests for Goal 5 (Visualizer) and Goal 6 (Import/Export)
 */

const TemperamentWidget = require("../../js/widgets/temperament.js");
global.isCustomTemperament = jest.fn((t) => t === "custom");
global._ = jest.fn((str) => str);
describe("TemperamentWidget", () => {
    let widget;

    beforeEach(() => {
        widget = new TemperamentWidget();
        widget.inTemperament = "equal";
        widget.powerBase = 2;
        widget.pitchNumber = 12;
        widget.ratios = [1, 1.059, 1.122, 1.189, 1.260, 1.335, 1.414, 1.498, 1.587, 1.682, 1.782, 1.888, 2];
        widget.notes = ["C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4", "C5"];
        widget.frequencies = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88, 523.25];
    });

    describe("_freqToCents", () => {
        test("returns 0 cents when freq equals baseFreq", () => {
            expect(widget._freqToCents(440, 440)).toBe(0);
        });

        test("returns 1200 cents for one octave up", () => {
            expect(widget._freqToCents(880, 440)).toBeCloseTo(1200, 1);
        });

        test("returns -1200 cents for one octave down", () => {
            expect(widget._freqToCents(220, 440)).toBeCloseTo(-1200, 1);
        });
    });

    describe("_centsToFreq", () => {
        test("returns baseFreq when cents is 0", () => {
            expect(widget._centsToFreq(0, 440)).toBe(440);
        });

        test("returns double frequency for 1200 cents", () => {
            expect(widget._centsToFreq(1200, 440)).toBeCloseTo(880, 1);
        });

        test("is inverse of _freqToCents", () => {
            const freq = 523.25;
            const base = 440;
            const cents = widget._freqToCents(freq, base);
            expect(widget._centsToFreq(cents, base)).toBeCloseTo(freq, 1);
        });
    });

    describe("_exportTemperament", () => {
        test("exports correct data structure", () => {
            let exportedData = null;
            global.Blob = function (content) {
                exportedData = JSON.parse(content[0]);
                return { type: "application/json" };
            };
            global.URL.createObjectURL = jest.fn(() => "blob:mock");
            global.URL.revokeObjectURL = jest.fn();
            const mockAnchor = { href: "", download: "", click: jest.fn() };
            jest.spyOn(document, "createElement").mockReturnValueOnce(mockAnchor);

            widget._exportTemperament();

            expect(exportedData).not.toBeNull();
            expect(exportedData.name).toBe("equal");
            expect(exportedData.powerBase).toBe(2);
            expect(exportedData.pitchNumber).toBe(12);
            expect(exportedData.ratios).toHaveLength(13);
            expect(exportedData.frequencies).toHaveLength(13);
        });
    });

    describe("_importTemperament", () => {
        test("restores temperament state from valid data", () => {
            const mockData = {
                name: "custom",
                powerBase: 2,
                pitchNumber: 5,
                ratios: [1, 1.2, 1.4, 1.6, 1.8, 2],
                notes: ["C", "D", "E", "F", "G", "A"],
                frequencies: [261, 313, 365, 417, 469, 522]
            };

            widget._circleOfNotes = jest.fn();
            widget.activity = {
                errorMsg: jest.fn(),
                textMsg: jest.fn()
            };

            // Simulate file read
            const reader = {
                onload: null,
                readAsText: function () {
                    this.onload({ target: { result: JSON.stringify(mockData) } });
                }
            };
            global.FileReader = jest.fn(() => reader);

            const mockInput = {
                type: "", accept: "",
                onchange: null,
                click: function () {
                    this.onchange({ target: { files: [{}] } });
                }
            };
            jest.spyOn(document, "createElement").mockReturnValueOnce(mockInput);

            widget._importTemperament();

            expect(widget.inTemperament).toBe("custom");
            expect(widget.pitchNumber).toBe(5);
            expect(widget.ratios).toHaveLength(6);
            expect(widget._circleOfNotes).toHaveBeenCalled();
        });
    });
});