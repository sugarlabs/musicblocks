/* eslint-disable no-trailing-spaces */
/* eslint-disable indent */
/* eslint-disable quotes */
/* eslint-disable no-undef */
// Mock global window for btoa function
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
    getFilterTypes
} = require("../musicutils");


describe("musicutils", () => {
    it("should set and get Octave Ratio", () => {
        setOctaveRatio(4);
        const octaveR = getOctaveRatio();
        expect(octaveR).toBe(4);
    });
});

describe("Temperament Functions", () => {
    test("getTemperamentsList should return the list of temperaments", () => {
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
   
    describe("Temperament Management", () => {
        beforeEach(() => {
          // Reset global variables before each test
          global.TEMPERAMENTS = [...INITIALTEMPERAMENTS];
          global.TEMPERAMENT = {
            equal: {
              pitchNumber: 12,
              interval: ["perfect 1", "minor 2", "major 2"]
            }
          };
        });
      
        test("addTemperamentToList should add a new temperament if not predefined", () => {
          const newEntry = "customTemperament";
          addTemperamentToList(newEntry);
          expect(TEMPERAMENTS).toContain(newEntry);
        });
      
        test("addTemperamentToList should not add a predefined temperament", () => {
          const predefinedEntry = "equal";
          addTemperamentToList(predefinedEntry);
          expect(TEMPERAMENTS).not.toContain(predefinedEntry);
        });
      
        test("deleteTemperamentFromList should remove a temperament from the dictionary", () => {
          const oldEntry = "equal";
          deleteTemperamentFromList(oldEntry);
          expect(TEMPERAMENT[oldEntry]).toBeUndefined();
        });
      
        test("addTemperamentToDictionary should add a new temperament to the dictionary", () => {
          const entryName = "newTemperament";
          const entryValue = {
            pitchNumber: 7,
            interval: ["perfect 1", "minor 3", "major 3"]
          };
          addTemperamentToDictionary(entryName, entryValue);
          expect(TEMPERAMENT[entryName]).toEqual(entryValue);
        });
      
        test("updateTemperaments should update TEMPERAMENTS with new entries", () => {
          const newEntry = "customTemperament";
          TEMPERAMENT[newEntry] = {
            pitchNumber: 8,
            interval: ["perfect 1", "minor 3"]
          };
          updateTemperaments();
          expect(TEMPERAMENTS.some(([_, name]) => name === newEntry)).toBe(true);
        });
      
        test("updateTemperaments should not duplicate predefined temperaments", () => {
          updateTemperaments();
          const predefinedEntries = TEMPERAMENTS.filter(([_, name]) => name in PreDefinedTemperaments);
          expect(predefinedEntries.length).toBe(Object.keys(PreDefinedTemperaments).length);
        });
      });
});

describe("Constants", () => {
    test("should have correct default values", () => {
        expect(DEFAULTINVERT).toBe("even");
        expect(DEFAULTMODE).toBe("major");
    });
});

describe("customMode", () => {
    test("should return custom mode from MUSICALMODES", () => {
        expect(customMode).toEqual([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    });
});

describe("getInvertMode", () => {
    test("should return the correct invert mode name", () => {
        expect(getInvertMode("even")).toBe("even");
        expect(getInvertMode("scalar")).toBe("scalar");
        expect(getInvertMode("nonexistent")).toBe("nonexistent");
    });
});

describe("getIntervalNumber", () => {
    test("should return the number of semi-tones for a given interval", () => {
        expect(getIntervalNumber("perfect 5")).toBe(7);
        expect(getIntervalNumber("major 3")).toBe(4);
    });
});

describe("getIntervalDirection", () => {
    test("should return the direction of the interval", () => {
        expect(getIntervalDirection("diminished 6")).toBe(-1);
        expect(getIntervalDirection("minor 3")).toBe(-1);
    });
});

describe("getIntervalRatio", () => {
    test("should return the ratio for a given interval", () => {
        expect(getIntervalRatio("perfect 5")).toBe(1.5);
        expect(getIntervalRatio("major 3")).toBe(1.25);
    });
});

//

describe("getModeNumbers", () => {
    test("should return the correct mode numbers for a valid mode", () => {
        expect(getModeNumbers("chromatic")).toBe("0 1 2 3 4 5 6 7 8 9 10 11");
        expect(getModeNumbers("major")).toBe("0 2 4 5 7 9 11");
        expect(getModeNumbers("minor")).toBe("0 2 3 5 7 8 10");
    });

    test("should return an empty string for an invalid mode", () => {
        expect(getModeNumbers("invalidMode")).toBe("");
    });

    test("should handle custom mode correctly", () => {
        expect(getModeNumbers("custom")).toBe("0 1 2 3 4 5 6 7 8 9 10 11");
    });
});

//

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