const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { TextEncoder } = require("util");

const loadMusicutilsConstants = () => {
    const sourcePath = path.resolve(__dirname, "../../utils/musicutils.js");
    const source = fs.readFileSync(sourcePath, "utf8");
    const sandbox = {
        module: { exports: {} },
        exports: {},
        require,
        console,
        TextEncoder,
        window: {
            btoa: str => Buffer.from(str, "utf8").toString("base64")
        },
        _: str => str,
        last: arr => arr[arr.length - 1],
        INVALIDPITCH: "Not a valid pitch name"
    };

    vm.createContext(sandbox);
    vm.runInContext(
        `${source}
module.exports = {
    NOTENAMES,
    SOLFEGENAMES1,
    ALLNOTENAMES,
    NOTENAMES1,
    PITCHES1,
    PITCHES3,
    MUSICALMODES
};
`,
        sandbox,
        { filename: sourcePath }
    );

    return sandbox.module.exports;
};

describe("musicutils core constants", () => {
    const { NOTENAMES, SOLFEGENAMES1, ALLNOTENAMES, NOTENAMES1, PITCHES1, PITCHES3, MUSICALMODES } =
        loadMusicutilsConstants();

    it("keeps NOTENAMES as the seven natural note letters", () => {
        expect(NOTENAMES).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
    });

    it("keeps the expected solfege base syllables in SOLFEGENAMES1 without duplicates", () => {
        const baseSolfegeNames = [
            ...new Set(SOLFEGENAMES1.map(name => name.replace(/[♯♭𝄪𝄫]/gu, "")))
        ];

        expect(baseSolfegeNames).toEqual(["do", "re", "mi", "fa", "sol", "la", "ti"]);
        expect(baseSolfegeNames).toHaveLength(7);
    });

    it("preserves the first and last entries for NOTENAMES and SOLFEGENAMES1", () => {
        expect(NOTENAMES[0]).toBe("C");
        expect(NOTENAMES[NOTENAMES.length - 1]).toBe("B");
        expect(SOLFEGENAMES1[0]).toBe("do");
        expect(SOLFEGENAMES1[SOLFEGENAMES1.length - 1]).toBe("ti");
    });

    it("includes sharps, flats, and double accidentals in ALLNOTENAMES", () => {
        expect(ALLNOTENAMES).toEqual(expect.arrayContaining(["C#", "Db", "Cx", "Dbb", "Fx", "Cb"]));
    });

    it("keeps note and pitch collections as non-empty arrays of strings", () => {
        [NOTENAMES, ALLNOTENAMES, NOTENAMES1, PITCHES1, PITCHES3].forEach(collection => {
            expect(Array.isArray(collection)).toBe(true);
            expect(collection.length).toBeGreaterThan(0);
            expect(collection.every(item => typeof item === "string")).toBe(true);
        });
    });

    it("keeps major and minor mode definitions at seven steps and one octave", () => {
        expect(MUSICALMODES.major).toHaveLength(7);
        expect(MUSICALMODES.minor).toHaveLength(7);
        expect(MUSICALMODES.major.reduce((sum, step) => sum + step, 0)).toBe(12);
        expect(MUSICALMODES.minor.reduce((sum, step) => sum + step, 0)).toBe(12);
    });
});
