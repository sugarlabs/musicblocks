/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2024 omsuneri
 *
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
global.window = {
    btoa: jest.fn(str => Buffer.from(str, "utf8").toString("base64"))
};

const {
    scaleDegreeToPitchMapping,
    buildScale,
    getNote,
    getModeLength,
    nthDegreeToPitch,
    getInterval,
    _calculate_pitch_number,
    _getStepSize,
    reducedFraction,
    toFraction,
    durationToNoteValue,
    calcNoteValueToDisplay,
    noteToPitchOctave,
    pitchToFrequency,
    noteIsSolfege,
    getSolfege,
    splitSolfege,
    i18nSolfege,
    splitScaleDegree,
    getNumNote,
    calcOctave,
    calcOctaveInterval,
    isInt,
    convertFromSolfege,
    convertFactor,
    getPitchInfo,
    noteToFrequency,
    setOctaveRatio,
    getOctaveRatio,
    TEMPERAMENT,
    getTemperamentsList,
    getTemperament,
    getTemperamentKeys,
    addTemperamentToList,
    addTemperamentToDictionary,
    updateTemperaments,
    deleteTemperamentFromList,
    DEFAULTINVERT,
    DEFAULTMODE,
    customMode,
    getInvertMode,
    getIntervalNumber,
    getIntervalDirection,
    getIntervalRatio,
    getModeNumbers,
    getDrumIndex,
    getDrumName,
    getDrumSymbol,
    getFilterTypes,
    getOscillatorTypes,
    getDrumIcon,
    getDrumSynthName,
    getNoiseName,
    getNoiseIcon,
    getNoiseSynthName,
    getVoiceName,
    getVoiceIcon,
    getVoiceSynthName,
    isCustomTemperament,
    getTemperamentName,
    noteToObj,
    frequencyToPitch,
    getArticulation,
    keySignatureToMode,
    getScaleAndHalfSteps,
    modeMapper,
    getSharpFlatPreference,
    getCustomNote,
    pitchToNumber,
    numberToPitchSharp,
    getNumber,
    getNoteFromInterval,
    numberToPitch,
    GetNotesForInterval,
    base64Encode,
    MUSICALMODES,
    getStepSizeUp,
    getStepSizeDown
} = require("../musicutils");

describe("musicutils", () => {
    it("should set and get Octave Ratio", () => {
        setOctaveRatio(4);
        const octaveR = getOctaveRatio();
        expect(octaveR).toBe(4);
    });
});

describe("Temperament Functions", () => {
    global.TEMPERAMENTS = [
        [_("Equal (12EDO)"), "equal", "equal"],
        [_("Equal (5EDO)"), "equal5", "equal5"],
        [_("Equal (7EDO)"), "equal7", "equal7"],
        [_("Equal (19EDO)"), "equal19", "equal19"],
        [_("Equal (31EDO)"), "equal31", "equal31"],
        [_("5-limit Just Intonation"), "just intonation", "just intonation"],
        [_("Pythagorean (3-limit JI)"), "Pythagorean", "Pythagorean"],
        [_("Meantone") + " (1/3)", "1/3 comma meantone", "meantone (1/3)"],
        [_("Meantone") + " (1/4)", "1/4 comma meantone", "meantone (1/4)"],
        [_("custom"), "custom", "custom"]
    ];
    global.INITIALTEMPERAMENTS = [
        [_("Equal (12EDO)"), "equal", "equal"],
        [_("Equal (5EDO)"), "equal5", "equal5"],
        [_("Equal (7EDO)"), "equal7", "equal7"],
        [_("Equal (19EDO)"), "equal19", "equal19"],
        [_("Equal (31EDO)"), "equal31", "equal31"],
        [_("5-limit Just Intonation"), "just intonation", "just intonation"],
        [_("Pythagorean (3-limit JI)"), "Pythagorean", "Pythagorean"],
        [_("Meantone") + " (1/3)", "1/3 comma meantone", "meantone (1/3)"],
        [_("Meantone") + " (1/4)", "1/4 comma meantone", "meantone (1/4)"]
    ];

    global.PreDefinedTemperaments = {
        "equal": true,
        "equal5": true,
        "equal7": true,
        "equal19": true,
        "equal31": true,
        "just intonation": true,
        "Pythagorean": true,
        "1/3 comma meantone": true,
        "1/4 comma meantone": true
    };

    it("getTemperamentsList should return the list of temperaments", () => {
        expect(getTemperamentsList()).toEqual([
            [_("Equal (12EDO)"), "equal", "equal"],
            [_("Equal (5EDO)"), "equal5", "equal5"],
            [_("Equal (7EDO)"), "equal7", "equal7"],
            [_("Equal (19EDO)"), "equal19", "equal19"],
            [_("Equal (31EDO)"), "equal31", "equal31"],
            [_("5-limit Just Intonation"), "just intonation", "just intonation"],
            [_("Pythagorean (3-limit JI)"), "Pythagorean", "Pythagorean"],
            [_("Meantone") + " (1/3)", "1/3 comma meantone", "meantone (1/3)"],
            [_("Meantone") + " (1/4)", "1/4 comma meantone", "meantone (1/4)"],
            [_("custom"), "custom", "custom"]
        ]);
    });

    describe("getTemperament", () => {
        it("should return the correct temperament for a valid key", () => {
            const equalTemperament = getTemperament("equal");
            expect(equalTemperament).toHaveProperty("perfect 1");
            expect(equalTemperament).toHaveProperty("minor 2");
            expect(equalTemperament).toHaveProperty("pitchNumber", 12);
        });

        it("should return the correct temperament for equal5 key", () => {
            const equal5Temperament = getTemperament("equal5");
            expect(equal5Temperament).toHaveProperty("perfect 1");
            expect(equal5Temperament).toHaveProperty("minor 2");
            expect(equal5Temperament).toHaveProperty("pitchNumber", 5);
        });

        it("should return undefined for an invalid key", () => {
            const invalidTemperament = getTemperament("invalid");
            expect(invalidTemperament).toBeUndefined();
        });
    });

    describe("getTemperamentKeys", () => {
        it("should return an array with the correct length", () => {
            const keys = getTemperamentKeys();
            expect(keys.length).toBe(10);
        });

        it("should return an array containing all keys", () => {
            const keys = getTemperamentKeys();
            expect(keys).toEqual(
                expect.arrayContaining([
                    "equal",
                    "equal5",
                    "equal7",
                    "equal19",
                    "equal31",
                    "just intonation",
                    "Pythagorean",
                    "1/3 comma meantone",
                    "1/4 comma meantone",
                    "custom"
                ])
            );
        });
    });

    describe("addTemperamentToList", () => {
        it("adds a new entry to TEMPERAMENTS if not predefined", () => {
            const newEntry = ["custom", "custom", "custom"];
            addTemperamentToList(newEntry);
            expect(TEMPERAMENTS).toContainEqual(newEntry);
        });

        it("does not add a duplicate entry if already present", () => {
            const duplicateEntry = ["Equal (12EDO)", "equal", "equal"];
            addTemperamentToList(duplicateEntry);
            expect(TEMPERAMENTS.filter(entry => entry[1] === "equal").length).toBe(1);
        });
    });

    describe("addTemperamentToDictionary", () => {
        it("add the new entry to temparment", () => {
            addTemperamentToDictionary("music", "blocks");
            expect(TEMPERAMENT["music"]).toBe("blocks");
        });
    });

    describe("deleteTemperamentFromList", () => {
        it("removes an entry from TEMPERAMENT by key", () => {
            TEMPERAMENT["custom"] = true;
            deleteTemperamentFromList("custom");
            expect(TEMPERAMENT["custom"]).toBeUndefined();
        });

        it("does nothing if the key does not exist", () => {
            deleteTemperamentFromList("doesn't exist");
            expect(TEMPERAMENT["doesn't exist"]).toBeUndefined();
        });
    });
    describe("updateTemperaments", () => {
        it("should reset TEMPERAMENTS to INITIALTEMPERAMENTS", () => {
            updateTemperaments();

            INITIALTEMPERAMENTS.forEach(temp => {
                expect(TEMPERAMENTS).toContainEqual(temp);
            });
        });
    });
});

describe("Constants", () => {
    it("should have correct default values", () => {
        expect(DEFAULTINVERT).toBe("even");
        expect(DEFAULTMODE).toBe("major");
    });
});

describe("customMode", () => {
    it("should return custom mode from MUSICALMODES", () => {
        expect(customMode).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    });
});

describe("getInvertMode", () => {
    it("should return the correct invert mode name", () => {
        expect(getInvertMode("even")).toBe("even");
        expect(getInvertMode("scalar")).toBe("scalar");
        expect(getInvertMode("nonexistent")).toBe("nonexistent");
    });
});

describe("getIntervalNumber", () => {
    it("should return the number of semi-tones for a given interval", () => {
        expect(getIntervalNumber("perfect 5")).toBe(7);
        expect(getIntervalNumber("major 3")).toBe(4);
    });
});

describe("getIntervalDirection", () => {
    it("should return the direction of the interval", () => {
        expect(getIntervalDirection("diminished 6")).toBe(-1);
        expect(getIntervalDirection("minor 3")).toBe(-1);
    });
});

describe("getIntervalRatio", () => {
    it("should return the ratio for a given interval", () => {
        expect(getIntervalRatio("perfect 5")).toBe(1.5);
        expect(getIntervalRatio("major 3")).toBe(1.25);
    });
});

describe("getModeNumbers", () => {
    it("should return the correct mode numbers for a valid mode", () => {
        expect(getModeNumbers("chromatic")).toBe("0 1 2 3 4 5 6 7 8 9 10 11");
        expect(getModeNumbers("major")).toBe("0 2 4 5 7 9 11");
        expect(getModeNumbers("minor")).toBe("0 2 3 5 7 8 10");
    });

    it("should return an empty string for an invalid mode", () => {
        expect(getModeNumbers("invalidMode")).toBe("");
    });

    it("should handle custom mode correctly", () => {
        expect(getModeNumbers("custom")).toBe("0 1 2 3 4 5 6 7 8 9 10 11");
    });
});

jest.mock("../musicutils", () => {
    const actualModule = jest.requireActual("../musicutils");
    return {
        ...actualModule,
        getDrumIndex: jest.fn(),
        getDrumName: jest.fn(),
        getDrumSymbol: jest.fn()
    };
});

describe("getDrum", () => {
    let DRUMNAMES, DEFAULTDRUM;

    beforeEach(() => {
        DRUMNAMES = [
            ["snare drum", "snare drum", "images/snaredrum.svg", "sn", "drum"],
            ["kick drum", "kick drum", "images/kick.svg", "hh", "drum"],
            ["tom tom", "tom tom", "images/tom.svg", "tomml", "drum"],
            ["floor tom", "floor tom", "images/floortom.svg", "tomfl", "drum"],
            ["bass drum", "bass drum", "images/kick.svg", "tomfl", "drum"],
            ["hi hat", "hi hat", "images/hihat.svg", "hh", "bell"]
        ];
        DEFAULTDRUM = "kick drum";

        // Mock for getDrumIndex
        require("../musicutils").getDrumIndex.mockImplementation(name => {
            if (name.slice(0, 4) === "http") return null;
            if (name === "") return DRUMNAMES.findIndex(drum => drum[0] === DEFAULTDRUM);

            const index = DRUMNAMES.findIndex(drum => drum[0].toLowerCase() === name.toLowerCase());
            return index >= 0 ? index : -1;
        });

        // Mock for getDrumName
        require("../musicutils").getDrumName.mockImplementation(name => {
            if (name === "") name = DEFAULTDRUM;
            if (name.slice(0, 4) === "http") return null;

            for (let drum = 0; drum < DRUMNAMES.length; drum++) {
                if (DRUMNAMES[drum][0].toLowerCase() === name.toLowerCase()) {
                    return DRUMNAMES[drum][0];
                } else if (DRUMNAMES[drum][1].toLowerCase() === name.toLowerCase()) {
                    return DRUMNAMES[drum][1];
                }
            }

            return null;
        });

        require("../musicutils").getDrumSymbol.mockImplementation(name => {
            if (name === "") return "hh";

            for (let drum = 0; drum < DRUMNAMES.length; drum++) {
                if (DRUMNAMES[drum][0].toLowerCase() === name.toLowerCase()) {
                    return DRUMNAMES[drum][3];
                } else if (DRUMNAMES[drum][1].toLowerCase() === name.toLowerCase()) {
                    return "hh";
                }
            }

            return "hh";
        });
    });

    describe("getDrumIndex", () => {
        it("should return the index of a valid drum name", () => {
            expect(getDrumIndex("snare drum")).toBe(0);
            expect(getDrumIndex("kick drum")).toBe(1);
            expect(getDrumIndex("floor tom")).toBe(3);
        });

        it("should return -1 for an invalid drum name", () => {
            expect(getDrumIndex("invalid drum")).toBe(-1);
        });

        it("should return the index of the DEFAULTDRUM for empty input", () => {
            expect(getDrumIndex("")).toBe(1);
        });

        it("should ignore case sensitivity when matching drum names", () => {
            expect(getDrumIndex("SNARE DRUM")).toBe(0);
        });

        it('should return null for names starting with "http"', () => {
            expect(getDrumIndex("http")).toBe(null);
        });
    });

    describe("getDrumName", () => {
        it("should return the name of a valid drum", () => {
            expect(getDrumName("snare drum")).toBe("snare drum");
            expect(getDrumName("kick drum")).toBe("kick drum");
        });

        it("should return the DEFAULTDRUM name for empty input", () => {
            expect(getDrumName("")).toBe("kick drum");
        });

        it('should return null for names starting with "http"', () => {
            expect(getDrumName("http")).toBe(null);
        });

        it("should ignore case sensitivity when matching drum names", () => {
            expect(getDrumName("SNARE DRUM")).toBe("snare drum");
            expect(getDrumName("KICK DRUM")).toBe("kick drum");
        });

        it("should return null for an invalid drum name", () => {
            expect(getDrumName("invalid drum")).toBe(null);
        });

        it("should match the second element of DRUMNAMES if provided", () => {
            expect(getDrumName("kick drum")).toBe("kick drum");
        });
    });

    describe("getDrumSymbol", () => {
        it("should return the correct symbol for a valid drum name", () => {
            expect(getDrumSymbol("snare drum")).toBe("sn");
            expect(getDrumSymbol("kick drum")).toBe("hh");
            expect(getDrumSymbol("floor tom")).toBe("tomfl");
        });

        it('should return "hh" for an empty name', () => {
            expect(getDrumSymbol("")).toBe("hh");
        });

        it('should return "hh" for an invalid drum name', () => {
            expect(getDrumSymbol("invalid drum")).toBe("hh");
        });

        it('should return "hh" for a name matching the second element of DRUMNAMES', () => {
            expect(getDrumSymbol("snare drum")).toBe("sn");
            expect(getDrumSymbol("kick drum")).toBe("hh"); // As per logic
        });

        it("should ignore case sensitivity when matching drum names", () => {
            expect(getDrumSymbol("SNARE DRUM")).toBe("sn");
            expect(getDrumSymbol("KICK DRUM")).toBe("hh");
        });
    });
});

describe("getFilterTypes", () => {
    it("should return default filter type", () => {
        expect(getFilterTypes("")).toBe("highpass"); //DEFAULTFILTERTYPES
    });
    it("should return correct filter types", () => {
        expect(getFilterTypes("highpass")).toBe("highpass");
        expect(getFilterTypes("notch")).toBe("notch");
    });
});

describe("getOscillatorTypes", () => {
    beforeEach(() => {
        global.OSCTYPES = [
            ["sine", "sine"],
            ["square", "square"],
            ["triangle", "triangle"],
            ["sawtooth", "sawtooth"]
        ];
    });

    it("should return correct oscillator type for valid display names", () => {
        expect(getOscillatorTypes("sine")).toBe("sine");
        expect(getOscillatorTypes("square")).toBe("square");
    });
    it("should handle case insensitive matching", () => {
        expect(getOscillatorTypes("SINE")).toBe("sine");
        expect(getOscillatorTypes("SawTooth")).toBe("sawtooth");
    });
    it("should return null for invalid oscillator types", () => {
        expect(getOscillatorTypes("invalid")).toBe(null);
        expect(getOscillatorTypes("random")).toBe(null);
    });
});

describe("getDrumIcon", () => {
    beforeEach(() => {
        global.DRUMNAMES = [
            ["snare drum", "snare drum", "images/snaredrum.svg"],
            ["kick drum", "kick drum", "images/kick.svg"],
            ["tom tom", "tom tom", "images/tom.svg"],
            ["floor tom", "floor tom", "images/floortom.svg"],
            ["bass drum", "bass drum", "images/kick.svg"],
            ["hi hat", "hi hat", "images/hihat.svg"]
        ];
        global.DEFAULTDRUM = "kick drum";
    });

    it("should return correct icon path for exact drum names", () => {
        expect(getDrumIcon("snare drum")).toBe("images/snaredrum.svg");
        expect(getDrumIcon("hi hat")).toBe("images/hihat.svg");
    });
    it("should handle case insensitive matching", () => {
        expect(getDrumIcon("SNARE DRUM")).toBe("images/snaredrum.svg");
        expect(getDrumIcon("HI HAT")).toBe("images/hihat.svg");
    });
    it("should return default drum icon for invalid drum names", () => {
        expect(getDrumIcon("invalid drum")).toBe("images/drum.svg");
        expect(getDrumIcon("123")).toBe("images/drum.svg");
    });
});

describe("getDrumSynthName", () => {
    beforeEach(() => {
        global.DRUMNAMES = [
            ["snare drum", "snare drum", "images/snaredrum.svg"],
            ["kick drum", "kick drum", "images/kick.svg"],
            ["tom tom", "tom tom", "images/tom.svg"],
            ["floor tom", "floor tom", "images/floortom.svg"],
            ["bass drum", "bass drum", "images/kick.svg"],
            ["hi hat", "hi hat", "images/hihat.svg"]
        ];
        global.DEFAULTDRUM = "kick drum";
    });

    it("should return correct synth name for exact matches", () => {
        expect(getDrumSynthName("snare drum")).toBe("snare drum");
        expect(getDrumSynthName("tom tom")).toBe("tom tom");
    });
    it("should return null for null", () => {
        expect(getDrumSynthName(null)).toBeNull();
    });
});

describe("getNoiseName", () => {
    beforeEach(() => {
        global.NOISENAMES = [
            ["white noise", "noise1", "images/noise1.svg"],
            ["brown noise", "noise2", "images/noise2.svg"],
            ["pink noise", "noise3", "images/noise3.svg"],
            ["", "custom noise", "images/custom.svg"]
        ];
        global.DEFAULTNOISE = "noise1";
    });

    it("should return display name of default noise for empty string", () => {
        expect(getNoiseName("")).toBe("white noise");
    });
    it("should return corresponding display name for valid identifiers", () => {
        expect(getNoiseName("noise1")).toBe("white noise");
        expect(getNoiseName("noise3")).toBe("pink noise");
    });
});

describe("getNoiseIcon", () => {
    beforeEach(() => {
        global.NOISENAMES = [
            ["white noise", "noise1", "images/noise1.svg"],
            ["brown noise", "noise2", "images/noise2.svg"],
            ["pink noise", "noise3", "images/noise3.svg"],
            ["", "custom noise", "images/custom.svg"]
        ];
        global.DEFAULTNOISE = "noise1";
    });

    it("should return icon path for default noise when input is empty", () => {
        expect(getNoiseIcon("")).toBe("images/noise1.svg");
    });
    it("should return correct icon path when searching by display name", () => {
        expect(getNoiseIcon("white noise")).toBe("images/noise1.svg");
        expect(getNoiseIcon("pink noise")).toBe("images/noise3.svg");
    });
    it("should return correct icon path when searching by identifier", () => {
        expect(getNoiseIcon("noise1")).toBe("images/noise1.svg");
    });
    it("should handle custom noise with empty display name", () => {
        expect(getNoiseIcon("custom noise")).toBe("images/custom.svg");
    });
    it("should return default synth.svg for non-existent noise names", () => {
        expect(getNoiseIcon("nonexistent")).toBe("images/synth.svg");
    });
    it("should be case sensitive for noise names", () => {
        expect(getNoiseIcon("WHITE NOISE")).toBe("images/synth.svg");
    });
});

describe("getNoiseSynthName", () => {
    beforeEach(() => {
        global.NOISENAMES = [
            ["white noise", "noise1", "images/noise1.svg"],
            ["brown noise", "noise2", "images/noise2.svg"],
            ["pink noise", "noise3", "images/noise3.svg"],
            ["", "custom noise", "images/custom.svg"]
        ];
        global.DEFAULTNOISE = "noise1";
    });

    it("should return null for null input", () => {
        expect(getNoiseSynthName(null)).toBeNull();
    });
    it("should return null for undefined input", () => {
        expect(getNoiseSynthName(undefined)).toBeNull();
    });
    it("should return default noise for empty string", () => {
        expect(getNoiseSynthName("")).toEqual("noise1");
    });
    it("should handle undefined NOISENAMES", () => {
        global.NOISENAMES = undefined;
        expect(() => getNoiseSynthName("any")).toThrow();
    });
});

describe("getVoiceName", () => {
    beforeEach(() => {
        global.VOICENAMES = [
            ["piano", "piano", "images/piano.svg"],
            ["violin", "violin", "images/violin.svg"],
            ["guitar", "guitar", "images/guitar.svg"],
            ["", "custom voice", "images/custom.svg"],
            ["electronic synth", "synth", "images/synth.svg"]
        ];
        global.DEFAULTVOICE = "electronic synth";
    });

    it("should return default voice for empty string", () => {
        expect(getVoiceName("")).toBe("electronic synth");
    });
    it("should return null for http links", () => {
        expect(getVoiceName("http://example.com")).toBeNull();
        expect(getVoiceName("https://example.com")).toBeNull();
    });
    it("should return voice name for exact matches", () => {
        expect(getVoiceName("piano")).toBe("piano");
        expect(getVoiceName("guitar")).toBe("guitar");
    });
    it("should be case sensitive", () => {
        expect(getVoiceName("PIANO")).toBe("electronic synth");
    });
});

describe("Voice and Temperament Functions", () => {
    beforeEach(() => {
        global.VOICENAMES = [
            ["piano", "piano_synth", "images/piano.svg"],
            ["violin", "violin_synth", "images/violin.svg"],
            ["electronic synth", "synth", "images/synth.svg"],
            ["", "custom voice", "images/custom.svg"]
        ];
        global.CUSTOMSAMPLES = [
            ["custom_sample1", "sample1", "images/sample1.svg"],
            ["custom_sample2", "sample2", "images/sample2.svg"]
        ];
        global.DEFAULTVOICE = "electronic synth";
        global.PreDefinedTemperaments = {
            "equal": true,
            "just intonation": true
        };
    });

    describe("getVoiceIcon", () => {
        it("should return icon path for default voice when input is empty", () => {
            expect(getVoiceIcon("")).toBe("images/synth.svg");
        });
        it("should return correct icon path when searching by synth name", () => {
            expect(getVoiceIcon("piano_synth")).toBe("images/piano.svg");
        });
        it("should handle custom samples", () => {
            expect(getVoiceIcon("custom_sample1")).toBe("custom_sample1");
        });
    });

    describe("getVoiceSynthName", () => {
        it("should return null for null/undefined input", () => {
            expect(getVoiceSynthName(null)).toBeNull();
            expect(getVoiceSynthName(undefined)).toBeNull();
        });
        it("should return default voice synth name for empty string", () => {
            expect(getVoiceSynthName("")).toBe("synth");
        });
        it("should return the same http link", () => {
            const url = "http://example.com/sound.mp3";
            expect(getVoiceSynthName(url)).toBe(url);
        });
        it("should return correct synth name for display names", () => {
            expect(getVoiceSynthName("piano")).toBe("piano_synth");
            expect(getVoiceSynthName("violin")).toBe("violin_synth");
        });
    });

    describe("isCustomTemperament", () => {
        it("should return false for predefined temperaments", () => {
            expect(isCustomTemperament("equal")).toBeFalsy();
            expect(isCustomTemperament("just intonation")).toBeFalsy();
        });
        it("should return true for custom temperaments", () => {
            expect(isCustomTemperament("custom_temp")).toBeTruthy();
        });
    });
});

describe("getTemperamentName", () => {
    beforeEach(() => {
        global.TEMPERAMENTS = [
            ["equal", "equal"],
            ["just", "just"],
            ["pythagorean", "pythagorean"]
        ];
        global.DEFAULTTEMPERAMENT = "equal";
    });

    it("should return default temperament when input is empty string", () => {
        expect(getTemperamentName("")).toBe("equal");
    });
    it("should be case insensitive when matching names", () => {
        expect(getTemperamentName("EQUAL")).toBe("equal");
        expect(getTemperamentName("Equal")).toBe("equal");
    });
});

describe("noteToObj", () => {
    it("should correctly parse note with octave", () => {
        expect(noteToObj("C4")).toEqual(["C", 4]);
        expect(noteToObj("G3")).toEqual(["G", 3]);
    });
    it("should handle notes with accidentals and octave", () => {
        expect(noteToObj("C#4")).toEqual(["C#", 4]);
        expect(noteToObj("F#5")).toEqual(["F#", 5]);
    });
    it("should default to octave 4 when no octave is specified", () => {
        expect(noteToObj("C")).toEqual(["C", 4]);
        expect(noteToObj("Bb")).toEqual(["Bb", 4]);
    });
});

describe("frequencyToPitch", () => {
    beforeEach(() => {
        global.A0 = 27.5;
        global.C8 = 4186.01;
        global.C10 = 16744.04;
        global.TWELVEHUNDRETHROOT2 = Math.pow(2, 1 / 1200);
        global.PITCHES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    });

    it("should handle frequencies below A0", () => {
        expect(frequencyToPitch(20)).toEqual(["A", 0, 0]);
        expect(frequencyToPitch(27.4)).toEqual(["A", 0, 0]);
    });

    // 1. Verify the loop actually reaches the new upper octaves (C9)
    it("should correctly map frequencies in the extended C9 range", () => {
        // C9 is approx 8372 Hz. This proves the loop goes past 8.
        const c9 = frequencyToPitch(8372);
        expect(c9).toEqual(["C", 9, 0]);
    });

    // 2. Verify standard notes didn't break (Regression Check)
    it("should correctly map standard notes (Regression Check)", () => {
        // A0 (Lowest note)
        expect(frequencyToPitch(27.5)).toEqual(["A", 0, 0]);
        // A4 (Standard Concert Pitch)
        expect(frequencyToPitch(440)).toEqual(["A", 4, 0]);
        // C4 (Middle C)
        expect(frequencyToPitch(261.63)).toEqual(["C", 4, 0]);
    });

    it("should handle frequencies above C10", () => {
        expect(frequencyToPitch(17000)).toEqual(["C", 10, 0]);
        expect(frequencyToPitch(20000)).toEqual(["C", 10, 0]);
    });

    it("should handle frequencies with cents deviation", () => {
        const result = frequencyToPitch(442);
        expect(result[0]).toBe("A");
        expect(result[1]).toBe(4);
        const result2 = frequencyToPitch(438);
        expect(result2[0]).toBe("A");
        expect(result2[2]).toBeLessThan(0);
    });

    it("should map intermediate frequencies to nearest note", () => {
        const intermediateFreq = A0 * Math.pow(2, 1 / 3);
        const result = frequencyToPitch(intermediateFreq);
        expect(result[0]).toBe("D♭");
        expect(result[1]).toBe(1);
    });
});

describe("getArticulation", () => {
    it("should remove solfege syllables", () => {
        expect(getArticulation("do")).toBe("");
        expect(getArticulation("re")).toBe("");
    });
    it("should handle combinations of articulations", () => {
        expect(getArticulation("do^")).toBe("");
        expect(getArticulation("C^^")).toBe("");
    });
    it("should preserve non-articulation characters", () => {
        expect(getArticulation("X")).toBe("X");
        expect(getArticulation("123")).toBe("123");
    });
    it("should handle empty and special cases", () => {
        expect(getArticulation("")).toBe("");
        expect(getArticulation("doremifa")).toBe("");
    });
});

describe("keySignatureToMode", () => {
    beforeEach(() => {
        global.MAQAMTABLE = {};
        global.BTOFLAT = {};
        global.STOSHARP = {};
        global.FLAT = "b";
        global.SHARP = "#";
        global.SOLFEGENAMES1 = [];
        global.NOTESSHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        global.NOTESFLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
        global.MUSICALMODES = {
            major: [2, 2, 1, 2, 2, 2, 1],
            minor: [2, 1, 2, 2, 1, 2, 2]
        };
    });

    it("should handle empty and null inputs", () => {
        expect(keySignatureToMode("")).toEqual(["C", "major"]);
        expect(keySignatureToMode(null)).toEqual(["C", "major"]);
    });
    it("should handle basic major keys", () => {
        expect(keySignatureToMode("C major")).toEqual(["C", "major"]);
        expect(keySignatureToMode("D major")).toEqual(["D", "major"]);
    });
    it("should handle full minor key names", () => {
        expect(keySignatureToMode("A minor")).toEqual(["A", "minor"]);
        expect(keySignatureToMode("E minor")).toEqual(["E", "minor"]);
    });
});

describe("getScaleAndHalfSteps", () => {
    beforeEach(() => {
        global.SOLFMAPPER = [
            "do",
            "do",
            "re",
            "re",
            "mi",
            "fa",
            "fa",
            "sol",
            "sol",
            "la",
            "la",
            "ti"
        ];
        global.SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];
        global.NOTESSHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        global.NOTESFLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
        global.MUSICALMODES = {
            major: [2, 2, 1, 2, 2, 2, 1],
            minor: [2, 1, 2, 2, 1, 2, 2]
        };
        global.EXTRATRANSPOSITIONS = {};
        global.MAQAMTABLE = {};
        global.BTOFLAT = {};
        global.STOSHARP = {};
        global.FLAT = "♭";
        global.SHARP = "#";
        global.SOLFEGENAMES1 = [];
    });

    it(" should handle major scale correctly", () => {
        const result = getScaleAndHalfSteps("C major");
        expect(result).toEqual([
            ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"],
            ["do", "", "re", "", "mi", "fa", "", "sol", "", "la", "", "ti"],
            "C",
            "major"
        ]);
    });
    it("should handle minor scale correctly", () => {
        const result = getScaleAndHalfSteps("A minor");
        expect(result).toEqual([
            ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"],
            ["do", "", "re", "mi", "", "fa", "", "sol", "la", "", "ti", ""],
            "A",
            "minor"
        ]);
    });
});

describe("modeMapper", () => {
    beforeEach(() => {
        global.SHARP = "♯";
        global.FLAT = "♭";
    });

    it("should map Ionian to major", () => {
        expect(modeMapper("C", "ionian")).toEqual(["c", "major"]);
        expect(modeMapper("D", "ionian")).toEqual(["d", "major"]);
    });
    it("should handle flats in Dorian mode", () => {
        expect(modeMapper("E♭", "dorian")).toEqual(["e♭", "minor"]);
        expect(modeMapper("B♭", "dorian")).toEqual(["f", "minor"]);
    });
    it("should handle flats in Locrian mode", () => {
        expect(modeMapper("E♭", "locrian")).toEqual(["d♭", "minor"]);
        expect(modeMapper("B♭", "locrian")).toEqual(["d♭", "minor"]);
    });
});

describe("getSharpFlatPreference", () => {
    beforeEach(() => {
        global.SHARPPREFERENCE = ["g major", "d major", "a major", "e major", "b major"];
        global.FLATPREFERENCE = ["f major", "bb major", "eb major", "ab major", "db major"];
    });

    it('should return "sharp" for keys that traditionally use sharps', () => {
        expect(getSharpFlatPreference("G")).toBe("sharp");
        expect(getSharpFlatPreference("D")).toBe("sharp");
    });
    it('should return "natural" for C major and keys not in sharp/flat preferences', () => {
        expect(getSharpFlatPreference("C")).toBe("natural");
        expect(getSharpFlatPreference("Am")).toBe("natural");
    });
});

describe("getCustomNote", () => {
    beforeEach(() => {
        global.DOUBLEFLAT = "𝄫";
        global.FLAT = "♭";
        global.DOUBLESHARP = "𝄪";
        global.SHARP = "♯";
    });

    it("should handle array input by taking first element", () => {
        expect(getCustomNote(["C", "other"])).toBe("C");
        expect(getCustomNote(["D#", "other"])).toBe("D♯");
    });
    it("should convert double flat notation", () => {
        expect(getCustomNote("Cbb")).toBe("C𝄫");
        expect(getCustomNote("Dbb")).toBe("D𝄫");
    });
});

describe("pitchToNumber", () => {
    beforeEach(() => {
        global.DOUBLEFLAT = "𝄫";
        global.FLAT = "♭";
        global.DOUBLESHARP = "𝄪";
        global.SHARP = "♯";
        global.PITCHES = ["C", "D", "E", "F", "G", "A", "B"];
        global.FIXEDSOLFEGE1 = {
            do: "C",
            re: "D",
            mi: "E",
            fa: "F",
            sol: "G",
            la: "A",
            ti: "B"
        };
        global.getScaleAndHalfSteps = jest.fn().mockImplementation(keySignature => {
            const defaultScale = ["C", "D", "E", "F", "G", "A", "B"];
            const defaultSolfege = ["do", "re", "mi", "fa", "sol", "la", "ti"];
            return [defaultScale, defaultSolfege];
        });
        global.console.debug = jest.fn();
    });

    it("should handle rest notes", () => {
        expect(pitchToNumber("R", 4, "C major")).toBe(0);
        expect(pitchToNumber("r", 4, "C major")).toBe(0);
    });
    it("should handle basic notes", () => {
        expect(pitchToNumber("C", 4, "C major")).toBe(39);
        expect(pitchToNumber("A", 4, "C major")).toBe(48);
    });
});

describe("numberToPitchSharp", () => {
    beforeEach(() => {
        global.SHARP = "♯";
        global.PITCHES2 = ["A", "A♯", "B", "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯"];
    });

    it("should convert 0 to A0", () => {
        expect(numberToPitchSharp(0)).toEqual(["A", 0]);
    });
    it("should convert positive numbers within first octave", () => {
        expect(numberToPitchSharp(1)).toEqual(["A♯", 0]);
        expect(numberToPitchSharp(2)).toEqual(["B", 0]);
    });
});

describe("getNumber", () => {
    beforeEach(() => {
        global.DOUBLEFLAT = "𝄫";
        global.FLAT = "♭";
        global.DOUBLESHARP = "𝄪";
        global.SHARP = "♯";
        global.NOTESTEP = {
            C: 0,
            D: 2,
            E: 4,
            F: 5,
            G: 7,
            A: 9,
            B: 11
        };
    });

    it("should handle natural notes in octave 4", () => {
        expect(getNumber("C", 4)).toBe(37);
        expect(getNumber("D", 4)).toBe(39);
    });
    it("should handle negative octaves", () => {
        expect(getNumber("C", -1)).toBe(1);
    });
    it("should handle flat notes", () => {
        expect(getNumber("Bb", 4)).toBe(47);
        expect(getNumber("Eb", 4)).toBe(40);
    });
});

describe("getNoteFromInterval", () => {
    beforeEach(() => {
        global.DOUBLEFLAT = "𝄫";
        global.FLAT = "♭";
        global.DOUBLESHARP = "𝄪";
        global.SHARP = "♯";
        global.INTERVALVALUES = {
            "major 2": [2, 1],
            "major 3": [4, 1],
            "major 6": [9, 1],
            "major 7": [11, 1],
            "perfect 1": [0, 1],
            "perfect 4": [5, 1],
            "perfect 5": [7, 1],
            "perfect 8": [12, 1],
            "minor 2": [1, 1],
            "minor 3": [3, 1],
            "minor 6": [8, 1],
            "minor 7": [10, 1],
            "diminished 4": [4, 1],
            "diminished 5": [6, 1],
            "diminished 8": [11, 1],
            "augmented 1": [1, 1],
            "augmented 2": [3, 1],
            "augmented 3": [5, 1],
            "augmented 4": [6, 1],
            "augmented 5": [8, 1],
            "augmented 6": [10, 1],
            "augmented 7": [12, 1],
            "augmented 8": [13, 1]
        };
        global.pitchToNumber = jest.fn((note, octave) => {
            const pitches = ["C", "D", "E", "F", "G", "A", "B"];
            return octave * 12 + pitches.indexOf(note);
        });

        global.numberToPitch = jest.fn(num => {
            const pitches = ["C", "D", "E", "F", "G", "A", "B"];
            const octave = Math.floor(num / 12);
            const note = pitches[num % 12];
            return [note, octave];
        });

        global.numberToPitchSharp = jest.fn(num => {
            const pitches = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
            const octave = Math.floor(num / 12);
            const note = pitches[num % 12];
            return [note, octave];
        });

        global.getNumber = jest.fn((note, octave) => {
            const pitches = ["C", "D", "E", "F", "G", "A", "B"];
            return octave * 12 + pitches.indexOf(note);
        });
    });

    it("should calculate major 2nd correctly", () => {
        expect(getNoteFromInterval("C4", "major 2")).toEqual(["D", 4]);
        expect(getNoteFromInterval("F4", "major 2")).toEqual(["G", 4]);
    });
    it("should calculate augmented intervals correctly", () => {
        expect(getNoteFromInterval("C4", "augmented 4")).toEqual(["F♯", 4]);
        expect(getNoteFromInterval("F4", "augmented 5")).toEqual(["C♯", 5]);
    });
});

describe("numberToPitch", () => {
    beforeEach(() => {
        global.PITCHES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
        global.TEMPERAMENT = {
            "equal": {
                pitchNumber: 12,
                interval: [
                    "perfect 1",
                    "minor 2",
                    "major 2",
                    "minor 3",
                    "major 3",
                    "perfect 4",
                    "diminished 5",
                    "perfect 5",
                    "minor 6",
                    "major 6",
                    "minor 7",
                    "major 7"
                ]
            },
            "just intonation": {
                pitchNumber: 12,
                0: [1, "C", 4],
                1: [16 / 15, "D♭", 4],
                2: [9 / 8, "D", 4],
                3: [6 / 5, "E♭", 4],
                4: [5 / 4, "E", 4],
                5: [4 / 3, "F", 4],
                6: [45 / 32, "G♭", 4],
                7: [3 / 2, "G", 4],
                8: [8 / 5, "A♭", 4],
                9: [5 / 3, "A", 4],
                10: [9 / 5, "B♭", 4],
                11: [15 / 8, "B", 4]
            }
        };
        global.isCustomTemperament = jest.fn(temp => {
            return temp !== "equal" && temp in global.TEMPERAMENT;
        });
        global.getNoteFromInterval = jest.fn((pitch, interval) => {
            if (!interval) return ["C", 4];
            return ["C", 4];
        });
        global.console.debug = jest.fn();
    });

    it("should convert single-digit positive numbers", () => {
        expect(numberToPitch(0, "equal")).toEqual(["A", 0]);
        expect(numberToPitch(1, "equal")).toEqual(["B♭", 0]);
    });
    it("should handle octave transitions", () => {
        expect(numberToPitch(11, "equal")).toEqual(["A♭", 1]);
        expect(numberToPitch(13, "equal")).toEqual(["B♭", 1]);
    });
    it("should maintain correct ratios", () => {
        const result1 = numberToPitch(4, "just intonation", "C4", 0);
        const result2 = numberToPitch(7, "just intonation", "C4", 0);
        expect(Array.isArray(result1)).toBe(true);
        expect(Array.isArray(result2)).toBe(true);
    });
});

describe("GetNotesForInterval", () => {
    global.last = jest.fn(arr => arr[arr.length - 1]);

    it("should handle basic note status with two notes", () => {
        const tur = {
            singer: {
                noteStatus: [["C4", "E4"]]
            }
        };
        expect(GetNotesForInterval(tur)).toEqual({
            firstNote: "C",
            secondNote: "E",
            octave: 0
        });
    });
    it("should handle note pitches with accidentals", () => {
        const tur = {
            singer: {
                noteStatus: null,
                notePitches: { 1: ["C♯", "E♭"] },
                inNoteBlock: [1]
            }
        };
        expect(GetNotesForInterval(tur)).toEqual({
            firstNote: "C#",
            secondNote: "Eb",
            octave: 0
        });
    });
    it("should handle empty tur object", () => {
        const tur = {
            singer: {}
        };
        expect(GetNotesForInterval(tur)).toEqual({
            firstNote: "C",
            secondNote: "C",
            octave: 0
        });
    });
});

describe("base64Encode", () => {
    it("should handle empty string", () => {
        const input = "";
        const result = base64Encode(input);
        expect(result.length).toBe(0);
    });
    it("should handle special characters and Unicode", () => {
        const input = "¡Hola! 你好";
        const result = base64Encode(input);
        const bytes = new TextEncoder().encode(input);
        expect(result.length).toBe(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            expect(result.charCodeAt(i)).toBe(bytes[i]);
        }
    });
});

describe("getNote", () => {
    it("should return rest note", () => {
        expect(getNote("rest")).toEqual(["R", "", 0]);
        expect(getNote("r")).toEqual(["R", "", 0]);
    });

    it("should return the correct note for C4 in C major", () => {
        const result = getNote("C", 4, 0, "C major");
        expect(result).toEqual(["C", 4, 0]);
    });

    it("should return the correct note for C4 with transposition in C major", () => {
        const result = getNote("C", 4, 2, "C major");
        expect(result).toEqual(["D", 4, 0]);
    });

    it("should return the correct note for F4 in F major", () => {
        const result = getNote("F", 4, 0, "F major");
        expect(result).toEqual(["F", 4, 0]);
    });

    it("should return the correct note for F♯4 in F major", () => {
        const result = getNote("F♯", 4, 0, "F major");
        expect(result).toEqual(["F♯", 4, 0]);
    });

    it("should return the correct note for G♯4 in G major", () => {
        const result = getNote("G♯", 4, 0, "G major");
        expect(result).toEqual(["G♯", 4, 0]);
    });
});

describe("buildScale", () => {
    const testCases = [
        {
            keySignature: "C♭ major",
            expected: [
                ["C♭", "D♭", "E♭", "F♭", "G♭", "A♭", "B♭", "C♭"], // Scale notes
                [2, 2, 1, 2, 2, 2, 1] //Intervals
            ]
        },
        {
            keySignature: "F♭ major",
            expected: [
                ["F♭", "G♭", "A♭", "B𝄫", "C♭", "D♭", "E♭", "F♭"],
                [2, 2, 1, 2, 2, 2, 1]
            ]
        },
        {
            keySignature: "D major",
            expected: [
                ["D", "E", "F♯", "G", "A", "B", "C♯", "D"],
                [2, 2, 1, 2, 2, 2, 1]
            ]
        },
        {
            keySignature: "C major",
            expected: [
                ["C", "D", "E", "F", "G", "A", "B", "C"],
                [2, 2, 1, 2, 2, 2, 1]
            ]
        },
        {
            keySignature: "G major",
            expected: [
                ["G", "A", "B", "C", "D", "E", "F♯", "G"],
                [2, 2, 1, 2, 2, 2, 1]
            ]
        },
        {
            keySignature: "A minor",
            expected: [
                ["A", "B", "C", "D", "E", "F", "G", "A"],
                [2, 1, 2, 2, 1, 2, 2]
            ]
        },
        {
            keySignature: "F♯ major",
            expected: [
                ["F♯", "G♯", "A♯", "B", "C♯", "D♯", "E♯", "F♯"],
                [2, 2, 1, 2, 2, 2, 1]
            ]
        },
        {
            keySignature: "Bb major",
            expected: [
                ["B♭", "C", "D", "E♭", "F", "G", "A", "B♭"],
                [2, 2, 1, 2, 2, 2, 1]
            ]
        },
        {
            keySignature: "E major",
            expected: [
                ["E", "F♯", "G♯", "A", "B", "C♯", "D♯", "E"],
                [2, 2, 1, 2, 2, 2, 1]
            ]
        }
    ];

    testCases.forEach(({ keySignature, expected }) => {
        it(`should return the correct scale and intervals for ${keySignature}`, () => {
            const result = buildScale(keySignature);
            expect(result).toEqual(expected);
        });
    });

    it("should handle invalid key signatures gracefully", () => {
        const result = buildScale(""); // Invalid key signature
        expect(result).toEqual([
            ["C", "D", "E", "F", "G", "A", "B", "C"],
            [2, 2, 1, 2, 2, 2, 1]
        ]); // Default C major scale
    });
});

//Both getStepSizeUp and getStepSizeDown function uses _getStepSize
describe("getStepSize", () => {
    it('should return the correct step size for "C" in "C major" going up', () => {
        const result = _getStepSize("C major", "C", "up", 0, "equal");
        expect(result).toBe(2);
    });

    it('should return the correct step size for "C" in "C major" going down', () => {
        const result = _getStepSize("C major", "C", "down", 0, "equal");
        expect(result).toBe(-1);
    });

    it('should return the correct step size for "F" in "F major" going up', () => {
        const result = _getStepSize("F major", "F", "up", 0, "equal");
        expect(result).toBe(2);
    });

    it('should return the correct step size for "F" in "F major" going down', () => {
        const result = _getStepSize("F major", "F", "down", 0, "equal");
        expect(result).toBe(-1);
    });

    it('should return the correct step size for "G" in "G major" going up', () => {
        const result = _getStepSize("G major", "G", "up", 0, "equal");
        expect(result).toBe(2);
    });

    it('should return the correct step size for "G" in "G major" going down', () => {
        const result = _getStepSize("G major", "G", "down", 0, "equal");
        expect(result).toBe(-1);
    });

    it('should return the correct step size for "F#" in "F# major" going up', () => {
        const result = _getStepSize("F# major", "F#", "up", 0, "equal");
        expect(result).toBe(0);
    });

    it('should return the correct step size for "G#" in "G# major" going down', () => {
        const result = _getStepSize("G# major", "G#", "down", 0, "equal");
        expect(result).toBe(0);
    });

    it('should return 0 for "C" going down in a key without a lower note', () => {
        const result = _getStepSize("C major", "C", "down", 0, "equal");
        expect(result).toBe(-1);
    });

    it("should return an error or appropriate value for invalid key signature", () => {
        const result = _getStepSize("Invalid key", "C", "up", 0, "equal");
        expect(result).toBe(2);
    });

    // Test for a non-standard temperament
    it('should return the correct step size for "C" in "C major" with a non-standard temperament', () => {
        const result = _getStepSize("C major", "C", "up", 0, "just");
        expect(result).toBe(0);
    });
});

describe("getModeLength", () => {
    it("should return length", () => {
        const modeLength = getModeLength("");
        expect(modeLength).toBe(7);
    });
    it("should return length", () => {
        const modeLength = getModeLength("E major");
        expect(modeLength).toBe(7);
    });
});

describe("nthDegreeToPitch", () => {
    it("should return the correct note for the 2nd scale degree in C major", () => {
        const result = nthDegreeToPitch("C major", 2);
        expect(result).toEqual(["D", 0]);
    });

    it("should handle a scale degree larger than the scale length (wrapping case)", () => {
        const result = nthDegreeToPitch("C major", 8);
        expect(result).toEqual(["C", 1]);
    });

    it("should return the note below the root for scale degree 0 in C major (downward wrapping)", () => {
        const result = nthDegreeToPitch("C major", 0);
        expect(result).toEqual(["B", -1]);
    });

    it("should return the correct note for the 5th scale degree in A minor", () => {
        const result = nthDegreeToPitch("A minor", 5);
        expect(result).toEqual(["E", 0]);
    });

    it("should handle negative scale degrees (reverse wrapping)", () => {
        const result = nthDegreeToPitch("C major", -1);
        expect(result).toEqual(["A", -1]);
    });

    it("should fallback to C major for a scale degree when the key signature is unknown", () => {
        const result = nthDegreeToPitch("Unknown", 2); //default keysignature will be C major
        expect(result).toEqual(["D", 0]);
    });
});

describe("getInterval", () => {
    it("should return the correct interval for a pitch in the scale", () => {
        const result = getInterval(2, "C major", "E");
        expect(result).toBe(3); // Example: `E` is the 3rd degree in C major.
    });
    it("should wrap around when pitch is not in the current scale", () => {
        const result = getInterval(5, "C major", "B");
        expect(result).toBe(8);
    });

    it("should return 0 for a pitch not found in equivalent mappings", () => {
        const result = getInterval(2, "C major", "Z");
        expect(result).toBe(0);
    });

    it("should correctly shift pitches up or down if they are not in the consonant scale", () => {
        const resultUp = getInterval(1, "C major", "B");
        expect(resultUp).toBe(1);

        const resultDown = getInterval(-1, "C major", "Cb");
        expect(resultDown).toBe(-2);
    });
});

describe("reducedFraction", () => {
    global.NSYMBOLS = { 1: "𝅝", 2: "𝅗𝅥", 4: "♩", 8: "♪", 16: "𝅘𝅥𝅯" };

    it("should return reduced fraction with a common numerator and denominator", () => {
        expect(reducedFraction(4, 8)).toBe("1<br>&mdash;<br>2<br>𝅗𝅥");
        expect(reducedFraction(8, 16)).toBe("1<br>&mdash;<br>2<br>𝅗𝅥");
    });

    it("should return a fraction without symbols for non-standard denominators", () => {
        expect(reducedFraction(10, 15)).toBe("2<br>&mdash;<br>3<br><br>");
        expect(reducedFraction(25, 50)).toBe("1<br>&mdash;<br>2<br>𝅗𝅥");
    });

    it("should handle edge case where denominator is 0", () => {
        expect(reducedFraction(5, 0)).toBe("1<br>&mdash;<br>0<br><br>");
    });

    it("should handle positive and negative fractions correctly", () => {
        expect(reducedFraction(-4, 8)).toBe("1<br>&mdash;<br>-2<br><br>");
        expect(reducedFraction(5, -15)).toBe("1<br>&mdash;<br>-3<br><br>");
    });
});

describe("toFraction", () => {
    it("should return array with numerator and denomrator from floating point number", () => {
        expect(toFraction(2.2)).toEqual([11, 5]);
        expect(toFraction(0.1)).toEqual([1, 10]);
    });
    it("should return array with numerator and denomrator from floating point number", () => {
        expect(toFraction(0.0)).toEqual([0, 2]);
    });

    it("should handle common musical note fractions correctly", () => {
        expect(toFraction(0.5)).toEqual([1, 2]);
        expect(toFraction(0.25)).toEqual([1, 4]);
        expect(toFraction(0.125)).toEqual([1, 8]);
    });

    it("should handle whole numbers by flipping numerator and denominator", () => {
        expect(toFraction(2)).toEqual([2, 1]);
        expect(toFraction(4)).toEqual([4, 1]);
        expect(toFraction(8)).toEqual([8, 1]);
    });

    it("should handle thirds correctly", () => {
        const result = toFraction(1 / 3);
        expect(result[0]).toBe(1);
        expect(result[1]).toBe(3);
    });

    it("should handle dotted note values (1.5 = 3/2)", () => {
        expect(toFraction(1.5)).toEqual([3, 2]);
        expect(toFraction(0.75)).toEqual([3, 4]);
    });

    it("should handle value equal to 1", () => {
        expect(toFraction(1)).toEqual([1, 1]);
    });

    it("should handle very small positive decimals", () => {
        const result = toFraction(0.0625);
        expect(result[0]).toBe(1);
        expect(result[1]).toBe(16);
    });

    it("should handle sixths correctly", () => {
        const result = toFraction(1 / 6);
        expect(result[0]).toBe(1);
        expect(result[1]).toBe(6);
    });
});

describe("calcNoteValueToDisplay", () => {
    global.NSYMBOLS = { 1: "𝅝", 2: "𝅗𝅥", 4: "♩", 8: "♪", 16: "𝅘𝅥𝅯" };

    it("should return a note value with a symbol when the note value is in NSYMBOLS", () => {
        const result = calcNoteValueToDisplay(1, 2);
        expect(result).toBe("2<br>&mdash;<br>1<br>𝅝");
    });

    it("should return a reduced fraction when note value is not in NSYMBOLS", () => {
        const result = calcNoteValueToDisplay(3, 4); // Result will not be in NSYMBOLS
        expect(result).toBe("4<br>&mdash;<br>3<br>𝅝.");
    });

    it("should handle note values with fractional components and display them correctly", () => {
        const result = calcNoteValueToDisplay(1, 3);
        expect(result).toBe("3<br>&mdash;<br>1<br>𝅝");
    });

    it("should handle cases where note value cannot be found in NSYMBOLS and returns a reduced fraction", () => {
        const result = calcNoteValueToDisplay(5, 6); // Not in NSYMBOLS
        expect(result).toBe("6<br>&mdash;<br>5<br>𝅝.");
    });

    it("should return a note value with a symbol for valid inputs that map to an NSYMBOL", () => {
        const result = calcNoteValueToDisplay(8, 8); // 1 should map to a symbol
        expect(result).toBe("1<br>&mdash;<br>1<br>𝅝");
    });

    it("should handle larger numerators and denominators properly", () => {
        const result = calcNoteValueToDisplay(100, 200); // Should return a reduced fraction
        expect(result).toBe("2<br>&mdash;<br>1<br>𝅝");
    });

    it("should handle when enter 0 as a parameter", () => {
        expect(calcNoteValueToDisplay(1, 0)).toBe("0<br>&mdash;<br>1<br>𝅝");
    });
});

describe("durationToNoteValue", () => {
    global.POWER2 = [1, 2, 4, 8, 16, 32, 64, 128];

    it("should correctly convert a duration to a note value with no dots", () => {
        const result = durationToNoteValue(1); // Expect a whole note
        expect(result).toEqual([1, 0, null]);
    });

    it("should correctly convert a duration to a note value with one dot", () => {
        const result = durationToNoteValue(1.5); // 1.5 = whole note + dotted
        expect(result).toEqual([1, 0, [3, 0.5], 1]);
    });

    it("should correctly convert a duration to a note value with two dots", () => {
        const result = durationToNoteValue(1.75);
        expect(result).toEqual([1, 0, [3.5, 0.5], 1]);
    });

    it("should round down durations that do not match exact note values in POWER2", () => {
        const result = durationToNoteValue(0.3);
        expect(result).toEqual([1, 0, [0.6, 0.5], 1]);
    });

    it("should correctly return the note value for durations in POWER2", () => {
        const result = durationToNoteValue(2);
        expect(result).toEqual([2, 0, null]);
    });

    it("should return the default rounded value for durations without an exact tuplet factor", () => {
        const result = durationToNoteValue(0.5);
        expect(result).toEqual([1, 0, [1, 0.5], 1]);
    });
});

describe("noteToPitchOctave", () => {
    it("should correctly extract pitch and octave from a note string with a single character", () => {
        const result = noteToPitchOctave("C4");
        expect(result).toEqual(["C", 4]); // Pitch is 'C' and octave is 4
    });

    it("should correctly extract pitch and octave from a note string with a sharp note", () => {
        const result = noteToPitchOctave("C#5");
        expect(result).toEqual(["C#", 5]); // Pitch is 'C#' and octave is 5
    });

    it("should correctly extract pitch and octave from a note string with a flat note", () => {
        const result = noteToPitchOctave("Db6");
        expect(result).toEqual(["Db", 6]); // Pitch is 'Db' and octave is 6
    });

    it("should correctly handle a note string with a lowercase pitch", () => {
        const result = noteToPitchOctave("g3");
        expect(result).toEqual(["g", 3]); // Pitch is 'g' and octave is 3
    });

    it("should handle multi-character note names with no octave", () => {
        const result = noteToPitchOctave("B#");
        expect(result).toEqual(["B", NaN]); // No octave, returns NaN for octave
    });
});

describe("pitchToFrequency", () => {
    global.TWELTHROOT2 = 1.0594630943592953;
    global.TWELVEHUNDRETHROOT2 = 1.0005777895065549;
    global.A0 = 27.5;

    it("calculates frequency with 0 cents", () => {
        const result = pitchToFrequency("A", 4, 0, "C");
        expect(result).toBe(A0 * Math.pow(TWELTHROOT2, 48));
    });

    it("calculates frequency with non-zero cents", () => {
        const result = pitchToFrequency("A", 4, 50, "C");
        expect(result).toBe(A0 * Math.pow(TWELVEHUNDRETHROOT2, 48 * 100 + 50));
    });

    it("handles edge case with extreme pitch number", () => {
        const result = pitchToFrequency("C", 8, 0, "C");
        expect(result).toBe(A0 * Math.pow(TWELTHROOT2, 87));
    });

    it("throws error if pitchToNumber fails", () => {
        expect(pitchToFrequency("Z", 4, 0, "C")).toBe(A0 * Math.pow(TWELTHROOT2, 39));
    });
});

describe("noteToFrequency", () => {
    global.TWELTHROOT2 = 1.0594630943592953;
    global.TWELVEHUNDRETHROOT2 = 1.0005777895065549;
    global.A0 = 27.5;
    it("converts note to frequency correctly", () => {
        const result = noteToFrequency("A4", "C");
        expect(result).toBe(A0 * Math.pow(TWELTHROOT2, 48));
    });

    it("handles invalid note input gracefully", () => {
        expect(noteToFrequency("X9", "C")).toBe(A0 * Math.pow(TWELTHROOT2, 99));
    });
});

describe("noteIsSolfege", () => {
    const SHARP = "♯";
    const FLAT = "♭";

    global.SOLFEGECONVERSIONTABLE = {
        "C♭": "do" + FLAT,
        "C": "do",
        "C♯": "do" + SHARP,
        "D♭": "re" + FLAT,
        "D": "re",
        "D♯": "re" + SHARP,
        "E♭": "mi" + FLAT,
        "E": "mi",
        "F": "fa",
        "F♯": "fa" + SHARP,
        "G♭": "sol" + FLAT,
        "G": "sol",
        "G♯": "sol" + SHARP,
        "A♭": "la" + FLAT,
        "A": "la",
        "A♯": "la" + SHARP,
        "B♭": "ti" + FLAT,
        "B": "ti",
        "B♯": "ti" + SHARP,
        "R": _("rest")
    };

    it("should return false for standard note without solfege conversion", () => {
        expect(noteIsSolfege("C")).toBe(false);
    });

    it("should return false for a rest note", () => {
        expect(noteIsSolfege("R")).toBe(false);
    });

    it("should return true for a note with an unrecognized sharp (e.g., E♯)", () => {
        expect(noteIsSolfege("E♯")).toBe(true);
    });
});

describe("getSolfege", () => {});

describe("getSolfege", () => {
    const SHARP = "♯";
    const FLAT = "♭";

    global.SOLFEGECONVERSIONTABLE = {
        "C♭": "do" + FLAT,
        "C": "do",
        "C♯": "do" + SHARP,
        "D♭": "re" + FLAT,
        "D": "re",
        "D♯": "re" + SHARP,
        "E♭": "mi" + FLAT,
        "E": "mi",
        "F": "fa",
        "F♯": "fa" + SHARP,
        "G♭": "sol" + FLAT,
        "G": "sol",
        "G♯": "sol" + SHARP,
        "A♭": "la" + FLAT,
        "A": "la",
        "A♯": "la" + SHARP,
        "B♭": "ti" + FLAT,
        "B": "ti",
        "B♯": "ti" + SHARP,
        "R": _("rest")
    };

    it("should return the note itself if it is already a solfege note", () => {
        expect(getSolfege("C")).toBe("do");
        expect(getSolfege("R")).toBe("rest");
    });

    it("should return the correct solfege for standard notes", () => {
        expect(getSolfege("C♭")).toBe("do" + FLAT);
        expect(getSolfege("D")).toBe("re");
    });

    it("should return the correct solfege for sharp and flat notes", () => {
        expect(getSolfege("G♯")).toBe("sol" + SHARP);
        expect(getSolfege("A♯")).toBe("la" + SHARP);
    });

    it("should return undefined for invalid notes not present in the conversion table", () => {
        expect(getSolfege("X")).toBe("X");
    });
});

describe("splitSolfege", () => {
    global.SOLFNOTES = ["ti", "la", "sol", "fa", "mi", "re", "do"];

    it("should correctly split solfege notes without attributes", () => {
        expect(splitSolfege("do")).toEqual(["do", ""]);
        expect(splitSolfege("la")).toEqual(["la", ""]);
        expect(splitSolfege("ti")).toEqual(["ti", ""]);
    });

    it("should correctly split solfege notes with sharp (♯) or flat (♭) attributes", () => {
        expect(splitSolfege("do♯")).toEqual(["do", "♯"]);
        expect(splitSolfege("ti♯")).toEqual(["ti", "♯"]);
        expect(splitSolfege("do♭")).toEqual(["do", "♭"]);
    });

    it("should correctly handle solfege with compound attributes (e.g., 'sol♯♯')", () => {
        expect(splitSolfege("sol♯♯")).toEqual(["sol", "♯♯"]);
        expect(splitSolfege("do♯♯")).toEqual(["do", "♯♯"]);
    });

    it("should return ['sol', ''] if input is null or not a valid string", () => {
        expect(splitSolfege(null)).toEqual(["sol", ""]);
        expect(splitSolfege(undefined)).toEqual(["sol", ""]);
        expect(splitSolfege(123)).toEqual(["sol", ""]);
        expect(splitSolfege({})).toEqual(["sol", ""]);
    });
});

describe("i18nSolfege", () => {
    global.SOLFNOTES = ["ti", "la", "sol", "fa", "mi", "re", "do"];

    it("should return the internationalized version of a solfege note", () => {
        expect(i18nSolfege("do")).toEqual("do");
        expect(i18nSolfege("ti")).toEqual("ti");
    });

    it("should return internationalized solfege notes with attributes", () => {
        expect(i18nSolfege("do♯")).toEqual("do♯");
        expect(i18nSolfege("ti♭")).toEqual("ti♭");
    });

    it("should return the same note if it's not a valid solfege note", () => {
        expect(i18nSolfege("C♯")).toEqual("C♯");
        expect(i18nSolfege("G")).toEqual("G");
        expect(i18nSolfege("B♭")).toEqual("B♭");
        expect(i18nSolfege("R")).toEqual("R"); // Assuming R is a rest note.
    });

    it("should handle null or undefined values gracefully", () => {
        expect(i18nSolfege(null)).toEqual("sol"); //default
    });
});

describe("splitScaleDegree", () => {
    global.NATURAL = "♮";

    it("should split a scale degree into note and attributes", () => {
        expect(splitScaleDegree("C")).toEqual(["C", ""]);
        expect(splitScaleDegree("C♯")).toEqual(["C", "♯"]);
        expect(splitScaleDegree("B♭")).toEqual(["B", "♭"]);
    });

    it("should return default natural attribute when no attributes are provided", () => {
        expect(splitScaleDegree("")).toEqual([5, NATURAL]);
        expect(splitScaleDegree(null)).toEqual([5, NATURAL]);
    });

    it("should handle invalid or undefined inputs gracefully", () => {
        expect(splitScaleDegree(undefined)).toEqual([5, NATURAL]);
        expect(splitScaleDegree("")).toEqual([5, NATURAL]);
    });
});

describe("getNumNote", () => {
    const SHARP = "♯";
    global.NOTESTABLE = {
        1: "do",
        2: "do" + SHARP,
        3: "re",
        4: "re" + SHARP,
        5: "mi",
        6: "fa",
        7: "fa" + SHARP,
        8: "sol",
        9: "sol" + SHARP,
        10: "la",
        11: "la" + SHARP,
        0: "ti"
    };

    it("should correctly convert a value to a note and octave", () => {
        expect(getNumNote(7, 0)).toEqual(["fa♯", 1]);

        expect(getNumNote(9, 0)).toEqual(["sol♯", 1]);

        expect(getNumNote(8, 1)).toEqual(["sol♯", 1]);

        expect(getNumNote(13, 1)).toEqual(["do♯", 2]);
    });
});

describe("calcOctave", () => {
    const SHARP = "♯";
    const FLAT = "♭";
    const DOUBLESHARP = "𝄪";
    const DOUBLEFLAT = "𝄫";

    global.SOLFEGENAMES1 = [
        "do",
        "do" + SHARP,
        "do" + DOUBLESHARP,
        "re" + DOUBLEFLAT,
        "re" + FLAT,
        "re",
        "re" + SHARP,
        "re" + DOUBLESHARP,
        "mi" + DOUBLEFLAT,
        "mi" + FLAT,
        "mi",
        "fa",
        "fa" + SHARP,
        "fa" + DOUBLESHARP,
        "sol" + DOUBLEFLAT,
        "sol" + FLAT,
        "sol",
        "sol" + SHARP,
        "sol" + DOUBLESHARP,
        "la",
        "la" + DOUBLEFLAT,
        "la" + FLAT,
        "la" + SHARP,
        "la" + DOUBLESHARP,
        "ti" + DOUBLEFLAT,
        "ti" + FLAT,
        "ti"
    ];
    global.FIXEDSOLFEGE1 = {
        "do𝄫": "B",
        "do♭": "C" + FLAT,
        "do": "C",
        "do♯": "C" + SHARP,
        "do𝄪": "D",
        "re𝄫": "C",
        "re♭": "D" + FLAT,
        "re": "D",
        "re♯": "D" + SHARP,
        "re𝄪": "E",
        "mi𝄫": "D",
        "mi♭": "E" + FLAT,
        "mi": "E",
        "mi♯": "E" + SHARP,
        "mi𝄪": "G",
        "fa𝄫": "E" + FLAT,
        "fa♭": "F" + FLAT,
        "fa": "F",
        "fa♯": "F" + SHARP,
        "fa𝄪": "G" + SHARP,
        "sol𝄫": "E",
        "sol♭": "G" + FLAT,
        "sol": "G",
        "sol♯": "G" + SHARP,
        "sol𝄪": "A",
        "la𝄫": "G",
        "la♭": "A" + FLAT,
        "la": "A",
        "la♯": "A" + SHARP,
        "la𝄪": "B",
        "ti𝄫": "A",
        "ti♭": "B" + FLAT,
        "ti": "B",
        "ti♯": "B" + SHARP,
        "ti𝄪": "C",
        "R": _("rest")
    };

    it("should return correct octave for a numeric argument", () => {
        expect(calcOctave(4, 5, null, "C")).toBe(5);
    });

    it("should return correct octave based on currentNote and lastNotePlayed", () => {
        expect(calcOctave(4, "next", ["C"], "C")).toBe(5);
        expect(calcOctave(4, "next", ["C"], "D")).toBe(5);
        expect(calcOctave(4, "previous", ["C"], "D")).toBe(3);
    });

    it("should correctly calculate octave based on half-steps between notes", () => {
        expect(calcOctave(4, "current", ["C"], "G")).toBe(3);
        expect(calcOctave(4, "next", ["C"], "B")).toBe(4);
        expect(calcOctave(4, "previous", ["C"], "A")).toBe(2);
    });

    it("should be able to handle default case", () => {
        expect(calcOctave(4, "default", ["do"], "do")).toBe(4);
    });
});

describe("calcOctaveInterval", () => {
    it("should return correct octave value for argument 'next'", () => {
        expect(calcOctaveInterval("next")).toBe(1);
        expect(calcOctaveInterval(_("next"))).toBe(1);
    });

    it("should return correct octave value for argument 'previous'", () => {
        expect(calcOctaveInterval("previous")).toBe(-1);
        expect(calcOctaveInterval(_("previous"))).toBe(-1);
    });

    it("should return correct octave value for argument 'current'", () => {
        expect(calcOctaveInterval("current")).toBe(0);
        expect(calcOctaveInterval(_("current"))).toBe(0);
    });

    it("should return correct octave value for numeric arguments", () => {
        expect(calcOctaveInterval(1)).toBe(1);
        expect(calcOctaveInterval(0)).toBe(0);
        expect(calcOctaveInterval(-1)).toBe(-1);
        expect(calcOctaveInterval(2)).toBe(2);
        expect(calcOctaveInterval(-2)).toBe(-2);
    });

    it("should return default value of 0 for invalid or undefined arguments", () => {
        expect(calcOctaveInterval(undefined)).toBe(0);
        expect(calcOctaveInterval(null)).toBe(0);
        expect(calcOctaveInterval("invalid")).toBe(0);
    });
});

describe("isInt", () => {
    it("should return true for integer values", () => {
        expect(isInt(1)).toBe(true);
        expect(isInt(-10)).toBe(true);
        expect(isInt(123456)).toBe(true);
    });

    it("should return false for non-integer values", () => {
        expect(isInt(1.23)).toBe(false); // Decimal numbers
        expect(isInt(-0.56)).toBe(false); // Negative decimals
        expect(isInt("abc")).toBe(false); // Non-numeric string
    });

    it("should return false for NaN", () => {
        expect(isInt(NaN)).toBe(false); // NaN value
    });

    it("should return false for numeric strings", () => {
        expect(isInt("1")).toBe(false); // String containing an integer
        expect(isInt("-10")).toBe(false); // String containing a negative integer
    });
});

describe("convertFromSolfege", () => {
    const SHARP = "♯";
    const FLAT = "♭";
    global.FIXEDSOLFEGE1 = {
        "do𝄫": "B",
        "do♭": "C" + FLAT,
        "do": "C",
        "do♯": "C" + SHARP,
        "do𝄪": "D",
        "re𝄫": "C",
        "re♭": "D" + FLAT,
        "re": "D",
        "re♯": "D" + SHARP,
        "re𝄪": "E",
        "mi𝄫": "D",
        "mi♭": "E" + FLAT,
        "mi": "E",
        "mi♯": "E" + SHARP,
        "mi𝄪": "G",
        "fa𝄫": "E" + FLAT,
        "fa♭": "F" + FLAT,
        "fa": "F",
        "fa♯": "F" + SHARP,
        "fa𝄪": "G" + SHARP,
        "sol𝄫": "E",
        "sol♭": "G" + FLAT,
        "sol": "G",
        "sol♯": "G" + SHARP,
        "sol𝄪": "A",
        "la𝄫": "G",
        "la♭": "A" + FLAT,
        "la": "A",
        "la♯": "A" + SHARP,
        "la𝄪": "B",
        "ti𝄫": "A",
        "ti♭": "B" + FLAT,
        "ti": "B",
        "ti♯": "B" + SHARP,
        "ti𝄪": "C",
        "R": _("rest")
    };
    global.EQUIVALENTNATURALS = { "E♯": "F", "B♯": "C", "C♭": "B", "F♭": "E" };
    const testCases = [
        { input: "do𝄫", expected: "B" },
        { input: "do♭", expected: "B" },
        { input: "do♯", expected: "C♯" },
        { input: "re♯", expected: "D♯" },
        { input: "E♯", expected: "F" },
        { input: "R", expected: _("rest") }
    ];

    testCases.forEach(({ input, expected }) => {
        it(`should convert ${input} to ${expected}`, () => {
            expect(convertFromSolfege(input)).toBe(expected);
        });
    });

    it("should return the input if no conversion is available", () => {
        const nonSolfegeNote = "X";
        expect(convertFromSolfege(nonSolfegeNote)).toBe(nonSolfegeNote);
    });
});

describe("convertFactor", () => {
    const testCases = [
        { input: 0.0625, expected: "16" },
        { input: 0.125, expected: "8" },
        { input: 0.09375, expected: "16." },
        { input: 0.1875, expected: "8." },
        { input: 0.21875, expected: "8.." },
        { input: 0.25, expected: "4" },
        { input: 0.3125, expected: "4 16" },
        { input: 0.375, expected: "4." },
        { input: 0.4375, expected: "4.." },
        { input: 0.5, expected: "2" },
        { input: 0.5625, expected: "2 16" },
        { input: 0.675, expected: "2 8" },
        { input: 0.6875, expected: "2 8 16" },
        { input: 0.75, expected: "2." },
        { input: 0.8125, expected: "2 4 16" },
        { input: 0.875, expected: "2.." },
        { input: 0.9375, expected: "2 4 8 16" },
        { input: 1, expected: "1" }
    ];

    testCases.forEach(({ input, expected }) => {
        it(`should return "${expected}" for ${input}`, () => {
            expect(convertFactor(input)).toBe(expected);
        });
    });

    it("should return null for unknown factors", () => {
        expect(convertFactor(0)).toBeNull();
        expect(convertFactor("string")).toBeNull(); // Non-numeric input
    });
});

describe("scaleDegreeToPitchMapping", () => {
    it("maps scale degree to pitch with movable do", () => {
        const result = scaleDegreeToPitchMapping("C major", 1, true, null);
        expect(result).toBe("C");
    });

    it("maps pitch to scale degree with movable do", () => {
        const result = scaleDegreeToPitchMapping("C major", null, true, "C");
        expect(result).toEqual(["1", "♮", "8", "♮"]);
    });

    it("maps scale degree to pitch in a chosen mode", () => {
        const result = scaleDegreeToPitchMapping("D minior", 2, false, null);
        expect(result).toBe("E");
    });

    it("maps pitch to scale degree in a chosen mode", () => {
        const result = scaleDegreeToPitchMapping("D", null, false, "E");
        expect(result).toEqual(["2", "♮"]);
    });

    it("handles invalid pitch input gracefully", () => {
        const result = scaleDegreeToPitchMapping("C major", null, true, "Z");
        expect(result).toEqual([]);
    });

    it("handles undefined scale degree gracefully", () => {
        const result = scaleDegreeToPitchMapping("C major", 10, false, null);
        expect(result).toBeUndefined();
    });

    it("handles fallback to major scale for incomplete modes", () => {
        const result = scaleDegreeToPitchMapping("A minor", 5, false, null);
        expect(result).toBe("E");
    });

    it("handles edge cases for pitch alterations", () => {
        const result = scaleDegreeToPitchMapping("C major", null, false, "C#");
        expect(result).toEqual(["1", "8"]);
    });
});

describe("getPitchInfo", () => {
    let activity, tur;

    beforeEach(() => {
        activity = {
            errorMsg: jest.fn(),
            logo: {
                synth: {
                    _getFrequency: jest.fn(),
                    changeInTemperament: false
                }
            }
        };

        tur = {
            singer: {
                lastNotePlayed: null,
                inNoteBlock: {},
                notePitches: {},
                noteOctaves: {},
                keySignature: "C major",
                movable: false,
                pitchNumberOffset: 0
            }
        };
    });

    it("returns correct pitch for 'alphabet'", () => {
        expect(getPitchInfo(activity, "alphabet", "C4", tur)).toBe("C");
    });

    it("returns correct alphabet class", () => {
        expect(getPitchInfo(activity, "alphabet class", "C4", tur)).toBe("C");
        expect(getPitchInfo(activity, "letter class", "D#4", tur)).toBe("E");
    });

    it("returns correct solfege syllable (fixed do)", () => {
        tur.singer.movable = false;
        expect(getPitchInfo(activity, "solfege syllable", "C4", tur)).toBe("do");
    });

    it("returns correct solfege syllable (movable do)", () => {
        tur.singer.movable = true;
        tur.singer.keySignature = "G major";
        // In G major, G is Do.
        expect(getPitchInfo(activity, "solfege syllable", "G4", tur)).toBe("do");
    });

    it("returns correct pitch class", () => {
        const pClass = getPitchInfo(activity, "pitch class", "C4", tur);
        expect(typeof pClass).toBe("number");
    });

    it("returns correct scalar class", () => {
        const sClass = getPitchInfo(activity, "scalar class", "C4", tur);
        // Expect '1' for C in C Major
        expect(sClass).toBe("1");
    });

    it("returns correct scale degree", () => {
        const deg = getPitchInfo(activity, "scale degree", "C4", tur);
        expect(deg).toMatch(/^1/);
    });

    it("returns correct nth degree", () => {
        // C in C major is index 0
        expect(getPitchInfo(activity, "nth degree", "C4", tur)).toBe(0);
    });

    it("returns correct staff y", () => {
        const y = getPitchInfo(activity, "staff y", "C4", tur);
        // 0 * ... + 0 = 0
        expect(y).toBe(0);
    });

    it("returns pitch in hertz", () => {
        activity.logo.synth._getFrequency.mockReturnValue(261.63);
        const freq = getPitchInfo(activity, "pitch in hertz", "C4", tur);
        expect(freq).toBe(261.63);
    });

    it("returns color", () => {
        const color = getPitchInfo(activity, "pitch to color", "C4", tur);
        expect(typeof color).toBe("number");
    });

    it("returns shade", () => {
        // octave * 12.5 -> 4 * 12.5 = 50
        const shade = getPitchInfo(activity, "pitch to shade", "C4", tur);
        expect(shade).toBe(50);
    });

    it("handles invalid type", () => {
        expect(getPitchInfo(activity, "unknown type", "C4", tur)).toBe("__INVALID_INPUT__");
    });
});

describe("_calculate_pitch_number", () => {
    let activity, tur;

    beforeEach(() => {
        activity = {
            errorMsg: jest.fn()
        };

        tur = {
            singer: {
                lastNotePlayed: null,
                inNoteBlock: {},
                notePitches: {},
                noteOctaves: {},
                keySignature: "C major",
                movable: false,
                pitchNumberOffset: 0
            }
        };
    });

    it("calculates pitch number for a standard note string", () => {
        const val = _calculate_pitch_number(activity, "C4", tur);
        expect(typeof val).toBe("number");
    });

    it("calculates pitch number relative to another note", () => {
        const valC4 = _calculate_pitch_number(activity, "C4", tur);
        const valC5 = _calculate_pitch_number(activity, "C5", tur);
        expect(valC5).toBeGreaterThan(valC4);
    });
});

describe("MUSICALMODES", () => {
    it("should contain major mode with correct intervals", () => {
        expect(MUSICALMODES["major"]).toEqual([2, 2, 1, 2, 2, 2, 1]);
    });

    it("should contain minor mode with correct intervals", () => {
        expect(MUSICALMODES["minor"]).toEqual([2, 1, 2, 2, 1, 2, 2]);
    });

    it("should have chromatic mode with 12 semitones", () => {
        expect(MUSICALMODES["chromatic"]).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
        expect(MUSICALMODES["chromatic"].length).toBe(12);
    });

    it("should have pentatonic modes with 5 notes", () => {
        expect(MUSICALMODES["major pentatonic"].length).toBe(5);
        expect(MUSICALMODES["minor pentatonic"].length).toBe(5);
    });

    it("should have all mode intervals sum to 12 semitones", () => {
        const sum = arr => arr.reduce((a, b) => a + b, 0);
        expect(sum(MUSICALMODES["major"])).toBe(12);
        expect(sum(MUSICALMODES["minor"])).toBe(12);
        expect(sum(MUSICALMODES["dorian"])).toBe(12);
        expect(sum(MUSICALMODES["whole tone"])).toBe(12);
    });

    it("should contain custom mode for user definitions", () => {
        expect(MUSICALMODES["custom"]).toBeDefined();
        expect(Array.isArray(MUSICALMODES["custom"])).toBe(true);
    });

    it("should have ionian equivalent to major", () => {
        expect(MUSICALMODES["ionian"]).toEqual(MUSICALMODES["major"]);
    });

    it("should have aeolian equivalent to minor", () => {
        expect(MUSICALMODES["aeolian"]).toEqual(MUSICALMODES["minor"]);
    });
});
describe("getStepSizeDown", () => {
    it("should return the correct step size for D in C major going down", () => {
        const result = getStepSizeDown("C major", "D", 0, "equal");
        expect(result).toBe(-2);
    });

    it("should return 0 for an invalid temperament", () => {
        const result = getStepSizeDown("C major", "D", 0, "invalid");
        expect(result).toBe(0);
    });
});

describe("getStepSizeUp", () => {
    it("should return the correct step size for C in C major going up", () => {
        const result = getStepSizeUp("C major", "C", 0, "equal");
        expect(result).toBe(2);
    });

    it("should return 0 for an invalid temperament", () => {
        const result = getStepSizeUp("C major", "C", 0, "invalid");
        expect(result).toBe(0);
    });
});
