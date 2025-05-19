/**
 * Utility class for pitch-related calculations
 */
class PitchUtils {
    /**
     * @param {string} note
     * @param {string} accidental
     * @param {number} octave
     */
    static getMIDIPitch(note, accidental, octave) {
        const baseNotes = { "C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11 };
        const accidentalValues = { "bb": -2, "b": -1, "": 0, "#": 1, "x": 2 };
        
        return baseNotes[note] + accidentalValues[accidental] + (octave + 1) * 12;
    }

    /**
     * @param {number} midiPitch
     */
    static getLetterClass(midiPitch) {
        const noteNames = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"];
        return noteNames[midiPitch % 12].split("/")[0][0];
    }

    /**
     * @param {number} pitch1
     * @param {number} pitch2
     */
    static intervalBetween(pitch1, pitch2) {
        return Math.abs(pitch2 - pitch1);
    }
}

module.exports = { PitchUtils };
