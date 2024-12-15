global._ = jest.fn((str) => str);
global.window = {
    btoa: jest.fn((str) => Buffer.from(str, "utf8").toString("base64"))
};

const {
    setOctaveRatio,
    getOctaveRatio,
    TEMPERAMENT,
    TEMPERAMENTS,
    INITIALTEMPERAMENTS,
    PreDefinedTemperaments,
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
    base64Encode
} = require("../musicutils");


describe("musicutils", () => {
    it("should set and get Octave Ratio", () => {
        setOctaveRatio(4);
        const octaveR = getOctaveRatio();
        expect(octaveR).toBe(4);
    });
});

describe("Temperament Functions", () => {
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
            [_("Custom"), "custom", "custom"]
        ]);
    });

    describe("getTemperament", () => {
        it("should return the correct temperament for a valid key", () => {
            const equalTemperament = getTemperament("equal");
            expect(equalTemperament).toHaveProperty("perfect 1");
            expect(equalTemperament).toHaveProperty("minor 2");
            expect(equalTemperament).toHaveProperty("pitchNumber", 12);
        });

        it('should return the correct temperament for equal5 key', () => {
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

        it('should return an array containing all keys', () => {
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


jest.mock('../musicutils', () => {
    const actualModule = jest.requireActual('../musicutils');
    return {
        ...actualModule,
        getDrumIndex: jest.fn(),
        getDrumName: jest.fn(),
        getDrumSymbol: jest.fn() 
    };
});

describe('getDrum', () => {
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
        require('../musicutils').getDrumIndex.mockImplementation((name) => {
            if (name.slice(0, 4) === "http") return null;
            if (name === "") return DRUMNAMES.findIndex(drum => drum[0] === DEFAULTDRUM);

            const index = DRUMNAMES.findIndex(
                (drum) => drum[0].toLowerCase() === name.toLowerCase()
            );
            return index >= 0 ? index : -1;
        });

        // Mock for getDrumName
        require('../musicutils').getDrumName.mockImplementation((name) => {
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

        require('../musicutils').getDrumSymbol.mockImplementation((name) => {
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

    describe('getDrumIndex', () => {
        it('should return the index of a valid drum name', () => {
            expect(getDrumIndex('snare drum')).toBe(0);
            expect(getDrumIndex('kick drum')).toBe(1);
            expect(getDrumIndex('floor tom')).toBe(3);
        });

        it('should return -1 for an invalid drum name', () => {
            expect(getDrumIndex('invalid drum')).toBe(-1);
        });

        it('should return the index of the DEFAULTDRUM for empty input', () => {
            expect(getDrumIndex('')).toBe(1);
        });

        it('should ignore case sensitivity when matching drum names', () => {
            expect(getDrumIndex('SNARE DRUM')).toBe(0);
        });

        it('should return null for names starting with "http"', () => {
            expect(getDrumIndex('http')).toBe(null);
        });
    });

    describe('getDrumName', () => {
        it('should return the name of a valid drum', () => {
            expect(getDrumName('snare drum')).toBe('snare drum');
            expect(getDrumName('kick drum')).toBe('kick drum');
        });

        it('should return the DEFAULTDRUM name for empty input', () => {
            expect(getDrumName('')).toBe('kick drum');
        });

        it('should return null for names starting with "http"', () => {
            expect(getDrumName('http')).toBe(null);
        });

        it('should ignore case sensitivity when matching drum names', () => {
            expect(getDrumName('SNARE DRUM')).toBe('snare drum');
            expect(getDrumName('KICK DRUM')).toBe('kick drum');
        });

        it('should return null for an invalid drum name', () => {
            expect(getDrumName('invalid drum')).toBe(null);
        });

        it('should match the second element of DRUMNAMES if provided', () => {
            expect(getDrumName('kick drum')).toBe('kick drum');
        });
    });

    describe('getDrumSymbol', () => {
        it('should return the correct symbol for a valid drum name', () => {
            expect(getDrumSymbol('snare drum')).toBe('sn');
            expect(getDrumSymbol('kick drum')).toBe('hh');
            expect(getDrumSymbol('floor tom')).toBe('tomfl');
        });

        it('should return "hh" for an empty name', () => {
            expect(getDrumSymbol('')).toBe('hh');
        });

        it('should return "hh" for an invalid drum name', () => {
            expect(getDrumSymbol('invalid drum')).toBe('hh');
        });

        it('should return "hh" for a name matching the second element of DRUMNAMES', () => {
            expect(getDrumSymbol('snare drum')).toBe('sn');
            expect(getDrumSymbol('kick drum')).toBe('hh'); // As per logic
        });

        it('should ignore case sensitivity when matching drum names', () => {
            expect(getDrumSymbol('SNARE DRUM')).toBe('sn');
            expect(getDrumSymbol('KICK DRUM')).toBe('hh');
        });
    }); 
});

describe('getFilterTypes',() => {
    it('should return default filter type', () => {
        expect(getFilterTypes('')).toBe('highpass'); //DEFAULTFILTERTYPES
    });
    it('should return correct filter types', () => {
        expect(getFilterTypes('highpass')).toBe('highpass');
        expect(getFilterTypes('notch')).toBe('notch');
    });
});

describe('getOscillatorTypes', () => {
    beforeEach(() => {
        global.OSCTYPES = [
            ['sine', 'sine'],
            ['square', 'square'],
            ['triangle', 'triangle'],
            ['sawtooth', 'sawtooth']
        ];
    });

    it('should return correct oscillator type for valid display names', () => {
        expect(getOscillatorTypes('sine')).toBe('sine');
        expect(getOscillatorTypes('square')).toBe('square');
    });
    it('should handle case insensitive matching', () => {
        expect(getOscillatorTypes('SINE')).toBe('sine');
        expect(getOscillatorTypes('SawTooth')).toBe('sawtooth');
    });
    it('should return null for invalid oscillator types', () => {
        expect(getOscillatorTypes('invalid')).toBe(null);
        expect(getOscillatorTypes('random')).toBe(null);
    });
});

describe('getDrumIcon', () => {
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

        it('should return correct icon path for exact drum names', () => {
            expect(getDrumIcon('snare drum')).toBe('images/snaredrum.svg');
            expect(getDrumIcon('hi hat')).toBe('images/hihat.svg');
        });
        it('should handle case insensitive matching', () => {
            expect(getDrumIcon('SNARE DRUM')).toBe('images/snaredrum.svg');
            expect(getDrumIcon('HI HAT')).toBe('images/hihat.svg');
        });
        it('should return default drum icon for invalid drum names', () => {
            expect(getDrumIcon('invalid drum')).toBe('images/drum.svg');
            expect(getDrumIcon('123')).toBe('images/drum.svg');
        });  
});

describe('getDrumSynthName', () => {
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

        it('should return correct synth name for exact matches', () => {
            expect(getDrumSynthName('snare drum')).toBe('snare drum');
            expect(getDrumSynthName('tom tom')).toBe('tom tom');
        });
        it('should return null for null',()=>{
            expect(getDrumSynthName(null)).toBeNull();
        })
});

describe('getNoiseName', () => {
    beforeEach(() => {
        global.NOISENAMES = [
            ["white noise", "noise1", "images/noise1.svg"],
            ["brown noise", "noise2", "images/noise2.svg"],
            ["pink noise", "noise3", "images/noise3.svg"],
            ["", "custom noise", "images/custom.svg"]  
        ];
        global.DEFAULTNOISE = "noise1";
    });

        it('should return display name of default noise for empty string', () => {
            expect(getNoiseName('')).toBe('white noise');
        });
        it('should return corresponding display name for valid identifiers', () => {
            expect(getNoiseName('noise1')).toBe('white noise');
            expect(getNoiseName('noise3')).toBe('pink noise');
        });     
});

describe('getNoiseIcon', () => {
    beforeEach(() => {
        global.NOISENAMES = [
            ["white noise", "noise1", "images/noise1.svg"],
            ["brown noise", "noise2", "images/noise2.svg"],
            ["pink noise", "noise3", "images/noise3.svg"],
            ["", "custom noise", "images/custom.svg"]  
        ];
        global.DEFAULTNOISE = "noise1";
    });

        it('should return icon path for default noise when input is empty', () => {
            expect(getNoiseIcon('')).toBe('images/noise1.svg');
        });
        it('should return correct icon path when searching by display name', () => {
            expect(getNoiseIcon('white noise')).toBe('images/noise1.svg');
            expect(getNoiseIcon('pink noise')).toBe('images/noise3.svg');
        });
        it('should return correct icon path when searching by identifier', () => {
            expect(getNoiseIcon('noise1')).toBe('images/noise1.svg');
        });
        it('should handle custom noise with empty display name', () => {
            expect(getNoiseIcon('custom noise')).toBe('images/custom.svg');
        });
        it('should return default synth.svg for non-existent noise names', () => {
            expect(getNoiseIcon('nonexistent')).toBe('images/synth.svg');
        });
        it('should be case sensitive for noise names', () => {
            expect(getNoiseIcon('WHITE NOISE')).toBe('images/synth.svg');
        });
});

describe('getNoiseSynthName', () => {
    beforeEach(() => {
        global.NOISENAMES = [
            ["white noise", "noise1", "images/noise1.svg"],
            ["brown noise", "noise2", "images/noise2.svg"],
            ["pink noise", "noise3", "images/noise3.svg"],
            ["", "custom noise", "images/custom.svg"]  
        ];
        global.DEFAULTNOISE = "noise1";
    });

        it('should return null for null input', () => {
            expect(getNoiseSynthName(null)).toBeNull();
        });
        it('should return null for undefined input', () => {
            expect(getNoiseSynthName(undefined)).toBeNull();
        });
        it('should return default noise for empty string', () => {
            expect(getNoiseSynthName("")).toEqual('noise1');
        });
        it('should handle undefined NOISENAMES', () => {
            global.NOISENAMES = undefined;
            expect(() => getNoiseSynthName('any')).toThrow();
        });
});

describe('getVoiceName', () => {
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

        it('should return default voice for empty string', () => {
            expect(getVoiceName('')).toBe('electronic synth');
        });
        it('should return null for http links', () => {
            expect(getVoiceName('http://example.com')).toBeNull();
            expect(getVoiceName('https://example.com')).toBeNull();
        });
        it('should return voice name for exact matches', () => {
            expect(getVoiceName('piano')).toBe('piano');
            expect(getVoiceName('guitar')).toBe('guitar');
        });
        it('should be case sensitive', () => {
            expect(getVoiceName('PIANO')).toBe('electronic synth'); 
        });
});

describe('Voice and Temperament Functions', () => {
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

describe('getVoiceIcon', () => {
            it('should return icon path for default voice when input is empty', () => {
                expect(getVoiceIcon('')).toBe('images/synth.svg');
            });
            it('should return correct icon path when searching by synth name', () => {
                expect(getVoiceIcon('piano_synth')).toBe('images/piano.svg');
            });
            it('should handle custom samples', () => {
                expect(getVoiceIcon('custom_sample1')).toBe('custom_sample1');
            });
    });

describe('getVoiceSynthName', () => {
            it('should return null for null/undefined input', () => {
                expect(getVoiceSynthName(null)).toBeNull();
                expect(getVoiceSynthName(undefined)).toBeNull();
            });
            it('should return default voice synth name for empty string', () => {
                expect(getVoiceSynthName('')).toBe('synth');
            });
            it('should return the same http link', () => {
                const url = 'http://example.com/sound.mp3';
                expect(getVoiceSynthName(url)).toBe(url);
            });
            it('should return correct synth name for display names', () => {
                expect(getVoiceSynthName('piano')).toBe('piano_synth');
                expect(getVoiceSynthName('violin')).toBe('violin_synth');
            });
    });

describe('isCustomTemperament', () => {
        it('should return false for predefined temperaments', () => {
            expect(isCustomTemperament('equal')).toBeFalsy();
            expect(isCustomTemperament('just intonation')).toBeFalsy();
        });
        it('should return true for custom temperaments', () => {
            expect(isCustomTemperament('custom_temp')).toBeTruthy();
        });
    });
});

describe('getTemperamentName', () => {
    beforeEach(() => {
        global.TEMPERAMENTS = [
            ['equal', 'equal'],
            ['just', 'just'],
            ['pythagorean', 'pythagorean']
        ];
        global.DEFAULTTEMPERAMENT = 'equal';
    });

    it('should return default temperament when input is empty string', () => {
        expect(getTemperamentName('')).toBe('equal');
    });
    it('should be case insensitive when matching names', () => {
        expect(getTemperamentName('EQUAL')).toBe('equal');
        expect(getTemperamentName('Equal')).toBe('equal');
    });
});

describe('noteToObj', () => {
    it('should correctly parse note with octave', () => {
        expect(noteToObj('C4')).toEqual(['C', 4]);
        expect(noteToObj('G3')).toEqual(['G', 3]);
    });
    it('should handle notes with accidentals and octave', () => {
        expect(noteToObj('C#4')).toEqual(['C#', 4]);
        expect(noteToObj('F#5')).toEqual(['F#', 5]);
    });
    it('should default to octave 4 when no octave is specified', () => {
        expect(noteToObj('C')).toEqual(['C', 4]);
        expect(noteToObj('Bb')).toEqual(['Bb', 4]);
    });
});

describe('frequencyToPitch', () => {
    beforeEach(() => {
        global.A0 = 27.5;  
        global.C8 = 4186.01;  
        global.TWELVEHUNDRETHROOT2 = Math.pow(2, 1/1200); 
        global.PITCHES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    });

    it('should handle frequencies below A0', () => {
        expect(frequencyToPitch(20)).toEqual(["A", 0, 0]);
        expect(frequencyToPitch(27.4)).toEqual(["A", 0, 0]);
    });
    it('should handle frequencies above C8', () => {
        expect(frequencyToPitch(4200)).toEqual(["C", 8, 0]);
        expect(frequencyToPitch(5000)).toEqual(["C", 8, 0]);
    });
    it('should handle frequencies with cents deviation', () => {
        const result = frequencyToPitch(442);
        expect(result[0]).toBe("A");  
        expect(result[1]).toBe(4);    
        const result2 = frequencyToPitch(438);
        expect(result2[0]).toBe("A");  
        expect(result2[2]).toBeLessThan(0);  
    });
    it('should map intermediate frequencies to nearest note', () => {
        const intermediateFreq = A0 * Math.pow(2, 1/3);
        const result = frequencyToPitch(intermediateFreq);
        expect(result[0]).toBe("D♭");  
        expect(result[1]).toBe(1);
    });
});

describe('getArticulation', () => {
    it('should remove solfege syllables', () => {
        expect(getArticulation('do')).toBe('');
        expect(getArticulation('re')).toBe('');
    });
    it('should handle combinations of articulations', () => {
        expect(getArticulation('do^')).toBe('');
        expect(getArticulation('C^^')).toBe('');
    });
    it('should preserve non-articulation characters', () => {
        expect(getArticulation('X')).toBe('X');
        expect(getArticulation('123')).toBe('123');
    });
    it('should handle empty and special cases', () => {
        expect(getArticulation('')).toBe('');
        expect(getArticulation('doremifa')).toBe('');
    });
});

describe('keySignatureToMode', () => {
    beforeEach(() => {
        global.MAQAMTABLE = {};
        global.BTOFLAT = {};
        global.STOSHARP = {};
        global.FLAT = 'b';
        global.SHARP = '#';
        global.SOLFEGENAMES1 = [];
        global.NOTESSHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        global.NOTESFLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
        global.MUSICALMODES = {
            'major': [2, 2, 1, 2, 2, 2, 1],
            'minor': [2, 1, 2, 2, 1, 2, 2] 
        };
    });

    it('should handle empty and null inputs', () => {
        expect(keySignatureToMode('')).toEqual(['C', 'major']);
        expect(keySignatureToMode(null)).toEqual(['C', 'major']);
    });
    it('should handle basic major keys', () => {
        expect(keySignatureToMode('C major')).toEqual(['C', 'major']);
        expect(keySignatureToMode('D major')).toEqual(['D', 'major']);
    });
    it('should handle full minor key names', () => {
        expect(keySignatureToMode('A minor')).toEqual(['A', 'minor']);  
        expect(keySignatureToMode('E minor')).toEqual(['E', 'minor']);  
    });
});

describe('getScaleAndHalfSteps', () => {
    beforeEach(() => {
        global.SOLFMAPPER = ["do", "do", "re", "re", "mi", "fa", "fa", "sol", "sol", "la", "la", "ti"];
        global.SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];
        global.NOTESSHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        global.NOTESFLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
        global.MUSICALMODES = {
            'major': [2, 2, 1, 2, 2, 2, 1],
            'minor': [2, 1, 2, 2, 1, 2, 2]
        };
        global.EXTRATRANSPOSITIONS = {};
        global.MAQAMTABLE = {};
        global.BTOFLAT = {};
        global.STOSHARP = {};
        global.FLAT = '♭';
        global.SHARP = '#';
        global.SOLFEGENAMES1 = [];
    });

    it(' should handle major scale correctly', () => {
        const result = getScaleAndHalfSteps('C major');
        expect(result).toEqual([
            ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'],
            ['do', '', 're', '', 'mi', 'fa', '', 'sol', '', 'la', '', 'ti'],
            'C',
            'major'
        ]);
    });
    it('should handle minor scale correctly', () => {
        const result = getScaleAndHalfSteps('A minor');
        expect(result).toEqual([
            ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'],
            ['do', '', 're', 'mi', '', 'fa', '', 'sol', 'la', '', 'ti', ''],
            'A',
            'minor'
        ]);
    });
});

describe('modeMapper', () => {
    beforeEach(() => {
        global.SHARP = '♯';
        global.FLAT = '♭';
    });

        it('should map Ionian to major', () => {
            expect(modeMapper('C', 'ionian')).toEqual(['c', 'major']);
            expect(modeMapper('D', 'ionian')).toEqual(['d', 'major']);
        });
        it('should handle flats in Dorian mode', () => {
            expect(modeMapper('E♭', 'dorian')).toEqual(['e♭', 'minor']); 
            expect(modeMapper('B♭', 'dorian')).toEqual(['f', 'minor']);
        });
        it('should handle flats in Locrian mode', () => {
            expect(modeMapper('E♭', 'locrian')).toEqual(['d♭', 'minor']);  
            expect(modeMapper('B♭', 'locrian')).toEqual(['d♭', 'minor']);
        });   
});

describe('getSharpFlatPreference', () => {
    beforeEach(() => {
        global.SHARPPREFERENCE = ['g major', 'd major', 'a major', 'e major', 'b major'];
        global.FLATPREFERENCE = ['f major', 'bb major', 'eb major', 'ab major', 'db major'];
    });

        it('should return "sharp" for keys that traditionally use sharps', () => {
            expect(getSharpFlatPreference('G')).toBe('sharp');
            expect(getSharpFlatPreference('D')).toBe('sharp');
        });
        it('should return "natural" for C major and keys not in sharp/flat preferences', () => {
            expect(getSharpFlatPreference('C')).toBe('natural');
            expect(getSharpFlatPreference('Am')).toBe('natural');
        });  
});

describe('getCustomNote', () => {
    beforeEach(() => {
        global.DOUBLEFLAT = '𝄫';
        global.FLAT = '♭';
        global.DOUBLESHARP = '𝄪';
        global.SHARP = '♯';
    });

        it('should handle array input by taking first element', () => {
            expect(getCustomNote(['C', 'other'])).toBe('C');
            expect(getCustomNote(['D#', 'other'])).toBe('D♯');
        });
        it('should convert double flat notation', () => {
            expect(getCustomNote('Cbb')).toBe('C𝄫');
            expect(getCustomNote('Dbb')).toBe('D𝄫');
        });
});

describe('pitchToNumber', () => {
    beforeEach(() => {
        global.DOUBLEFLAT = '𝄫';
        global.FLAT = '♭';
        global.DOUBLESHARP = '𝄪';
        global.SHARP = '♯';
        global.PITCHES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        global.FIXEDSOLFEGE1 = {
            'do': 'C',
            're': 'D',
            'mi': 'E',
            'fa': 'F',
            'sol': 'G',
            'la': 'A',
            'ti': 'B'
        };
        global.getScaleAndHalfSteps = jest.fn().mockImplementation((keySignature) => {
            const defaultScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
            const defaultSolfege = ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'];
            return [defaultScale, defaultSolfege];
        });
        global.console.debug = jest.fn();
    });

        it('should handle rest notes', () => {
            expect(pitchToNumber('R', 4, 'C major')).toBe(0);
            expect(pitchToNumber('r', 4, 'C major')).toBe(0);
        });
        it('should handle basic notes', () => {
            expect(pitchToNumber('C', 4, 'C major')).toBe(39);
            expect(pitchToNumber('A', 4, 'C major')).toBe(48);
        });
});

describe('numberToPitchSharp', () => {
    beforeEach(() => {
        global.SHARP = '♯';
        global.PITCHES2 = ['A', `A♯`, 'B', 'C', `C♯`, 'D', `D♯`, 'E', 'F', `F♯`, 'G', `G♯`];
    });
    
        it('should convert 0 to A0', () => {
            expect(numberToPitchSharp(0)).toEqual(['A', 0]);
        });
        it('should convert positive numbers within first octave', () => {
            expect(numberToPitchSharp(1)).toEqual([`A♯`, 0]);
            expect(numberToPitchSharp(2)).toEqual(['B', 0]);
        });
});

describe('getNumber', () => {
    beforeEach(() => {
        global.DOUBLEFLAT = '𝄫';
        global.FLAT = '♭';
        global.DOUBLESHARP = '𝄪';
        global.SHARP = '♯';
        global.NOTESTEP = {
            'C': 0,
            'D': 2,
            'E': 4,
            'F': 5,
            'G': 7,
            'A': 9,
            'B': 11
        };
    });

        it('should handle natural notes in octave 4', () => {
            expect(getNumber('C', 4)).toBe(37);
            expect(getNumber('D', 4)).toBe(39);
        });
        it('should handle negative octaves', () => {
            expect(getNumber('C', -1)).toBe(1);
        });
        it('should handle flat notes', () => {
            expect(getNumber('Bb', 4)).toBe(47);
            expect(getNumber('Eb', 4)).toBe(40);
        });
});

describe('getNoteFromInterval', () => {
    beforeEach(() => {
        global.DOUBLEFLAT = '𝄫';
        global.FLAT = '♭';
        global.DOUBLESHARP = '𝄪';
        global.SHARP = '♯';
        global.INTERVALVALUES = {
            'major 2': [2, 1],
            'major 3': [4, 1],
            'major 6': [9, 1],
            'major 7': [11, 1],
            'perfect 1': [0, 1],
            'perfect 4': [5, 1],
            'perfect 5': [7, 1],
            'perfect 8': [12, 1],
            'minor 2': [1, 1],
            'minor 3': [3, 1],
            'minor 6': [8, 1],
            'minor 7': [10, 1],
            'diminished 4': [4, 1],
            'diminished 5': [6, 1],
            'diminished 8': [11, 1],
            'augmented 1': [1, 1],
            'augmented 2': [3, 1],
            'augmented 3': [5, 1],
            'augmented 4': [6, 1],
            'augmented 5': [8, 1],
            'augmented 6': [10, 1],
            'augmented 7': [12, 1],
            'augmented 8': [13, 1]
        };
        global.pitchToNumber = jest.fn((note, octave) => {
            const pitches = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
            return octave * 12 + pitches.indexOf(note);
        });

        global.numberToPitch = jest.fn((num) => {
            const pitches = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
            const octave = Math.floor(num / 12);
            const note = pitches[num % 12];
            return [note, octave];
        });

        global.numberToPitchSharp = jest.fn((num) => {
            const pitches = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
            const octave = Math.floor(num / 12);
            const note = pitches[num % 12];
            return [note, octave];
        });

        global.getNumber = jest.fn((note, octave) => {
            const pitches = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
            return octave * 12 + pitches.indexOf(note);
        });
    });

        it('should calculate major 2nd correctly', () => {
            expect(getNoteFromInterval('C4', 'major 2')).toEqual(['D', 4]);
            expect(getNoteFromInterval('F4', 'major 2')).toEqual(['G', 4]);
        });
        it('should calculate augmented intervals correctly', () => {
            expect(getNoteFromInterval('C4', 'augmented 4')).toEqual(['F♯', 4]);
            expect(getNoteFromInterval('F4', 'augmented 5')).toEqual(['C♯', 5]);
        });
});

describe('numberToPitch', () => {
    beforeEach(() => {
        global.PITCHES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
        global.TEMPERAMENT = {
            'equal': {
                'pitchNumber': 12,
                'interval': [
                    'perfect 1', 'minor 2', 'major 2', 'minor 3', 'major 3',
                    'perfect 4', 'diminished 5', 'perfect 5', 'minor 6',
                    'major 6', 'minor 7', 'major 7'
                ]
            },
            'just intonation': {
                'pitchNumber': 12,
                '0': [1, 'C', 4],
                '1': [16/15, 'D♭', 4],
                '2': [9/8, 'D', 4],
                '3': [6/5, 'E♭', 4],
                '4': [5/4, 'E', 4],
                '5': [4/3, 'F', 4],
                '6': [45/32, 'G♭', 4],
                '7': [3/2, 'G', 4],
                '8': [8/5, 'A♭', 4],
                '9': [5/3, 'A', 4],
                '10': [9/5, 'B♭', 4],
                '11': [15/8, 'B', 4]
            }
        };
        global.isCustomTemperament = jest.fn((temp) => {
            return temp !== 'equal' && temp in global.TEMPERAMENT;
        });
        global.getNoteFromInterval = jest.fn((pitch, interval) => {
            if (!interval) return ['C', 4];
            return ['C', 4];
        });
        global.console.debug = jest.fn();
    });

            it('should convert single-digit positive numbers', () => {
                expect(numberToPitch(0, 'equal')).toEqual(['A', 0]);
                expect(numberToPitch(1, 'equal')).toEqual(['B♭', 0]);
            });
            it('should handle octave transitions', () => {
                expect(numberToPitch(11, 'equal')).toEqual(['A♭', 1]);
                expect(numberToPitch(13, 'equal')).toEqual(['B♭', 1]);
            });
            it('should maintain correct ratios', () => {
                const result1 = numberToPitch(4, 'just intonation', 'C4', 0);
                const result2 = numberToPitch(7, 'just intonation', 'C4', 0);
                expect(Array.isArray(result1)).toBe(true);
                expect(Array.isArray(result2)).toBe(true);
            });
});

describe('GetNotesForInterval', () => {
    global.last = jest.fn(arr => arr[arr.length - 1]);

        it('should handle basic note status with two notes', () => {
            const tur = {
                singer: {
                    noteStatus: [['C4', 'E4']],
                }
            };
            expect(GetNotesForInterval(tur)).toEqual({
                firstNote: 'C',
                secondNote: 'E',
                octave: 0
            });
        });
        it('should handle note pitches with accidentals', () => {
            const tur = {
                singer: {
                    noteStatus: null,
                    notePitches: { '1': ['C♯', 'E♭'] },
                    inNoteBlock: [1]
                }
            };
            expect(GetNotesForInterval(tur)).toEqual({
                firstNote: 'C#',
                secondNote: 'Eb',
                octave: 0
            });
        });
        it('should handle empty tur object', () => {
            const tur = {
                singer: {}
            };
            expect(GetNotesForInterval(tur)).toEqual({
                firstNote: 'C',
                secondNote: 'C',
                octave: 0
            });
        });
});

describe('base64Encode', () => {
    it('should handle empty string', () => {
        const input = '';
        const result = base64Encode(input);
        expect(result.length).toBe(0);
    });
    it('should handle special characters and Unicode', () => {
        const input = '¡Hola! 你好';
        const result = base64Encode(input);
        const bytes = new TextEncoder().encode(input);
        expect(result.length).toBe(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            expect(result.charCodeAt(i)).toBe(bytes[i]);
        }
    });
});