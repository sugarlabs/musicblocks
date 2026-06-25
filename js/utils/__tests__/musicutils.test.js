describe("getSolfege with temperament", () => {
    it("should work with default 12-EDO (equal temperament)", () => {
        expect(getSolfege("C", "C major", true, "equal")).toBe("do");
        expect(getSolfege("F#", "G major", true, "equal")).toBe("ti");
    });

    it("should handle movable solfege in major and minor keys", () => {
        // C Major: C=do, D=re, E=mi, F=fa, G=sol, A=la, B=ti
        expect(getSolfege("C", "C major", true, "equal")).toBe("do");
        expect(getSolfege("D", "C major", true, "equal")).toBe("re");
        expect(getSolfege("E", "C major", true, "equal")).toBe("mi");
        // A minor (relative of C): A=la, B=ti, C=do, D=re, E=mi, F=fa, G=sol
        expect(getSolfege("A", "A minor", true, "equal")).toBe("la");
        expect(getSolfege("C", "A minor", true, "equal")).toBe("do");
    });

    it("should fall back to fixed-do when movable is false", () => {
        expect(getSolfege("C", "C major", false, "equal")).toBe("do");
        expect(getSolfege("A", "C major", false, "equal")).toBe("la");
    });
});

describe("_getStepSize with temperament", () => {
    it("should work with equal temperament (12-EDO)", () => {
        expect(_getStepSize("C major", "C", "up", 0, "equal")).toBe(2);
        expect(_getStepSize("C major", "C", "down", 0, "equal")).toBe(-1);
    });

    it("should return correct step size for sharps and flats", () => {
        expect(_getStepSize("F# major", "F#", "up", 0, "equal")).toBe(0);
        expect(_getStepSize("G# major", "G#", "down", 0, "equal")).toBe(0);
    });

    it("should return transposition for custom temperaments", () => {
        expect(_getStepSize("C major", "C", "up", 5, "custom")).toBe(5);
        expect(_getStepSize("C major", "C", "down", 3, "custom")).toBe(3);
    });
});

describe("numberToPitch custom temperament fallback", () => {
    it("falls back to equal temperament for missing custom temperament entries", () => {
        addTemperamentToDictionary("test19", {
            pitchNumber: 19,
            interval: TEMPERAMENT.equal.interval
        });
        // Pitch 0 in 19-EDO = A (starting pitch)
        expect(numberToPitch(0, "test19", "A4", 0)).toEqual(["A", 4]);
        // Pitch 19 in 19-EDO = A in next octave
        expect(numberToPitch(19, "test19", "A4", 0)).toEqual(["A", 5]);
    });

    it("reports error and falls back when temperament is missing", () => {
        const activity = { errorMsg: jest.fn() };
        expect(numberToPitch(0, "nonexistent", "C4", 0, activity)).toEqual(["C", 4]);
        expect(activity.errorMsg).toHaveBeenCalled();
    });
});