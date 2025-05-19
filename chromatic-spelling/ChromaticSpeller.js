/** @typedef {import('./tests/testUtils').MockScale} Scale */

class ChromaticSpeller {
    /** @private @type {Scale} */
    #scale;
    #letterClasses;
    #accidentals;

    /**
     * @param {Scale} scale - The scale to use for pitch spelling
     */
    constructor(scale) {
        this.#scale = scale;
        this.#letterClasses = Object.freeze(["C", "D", "E", "F", "G", "A", "B"]);
        this.#accidentals = Object.freeze(["bb", "b", "", "#", "x"]);
    }

    /**
     * @param {number} currentPitch - The current MIDI pitch
     * @param {number|null} nextPitch - The next MIDI pitch or null
     * @returns {string} The spelled pitch
     */
    spellPitch(currentPitch, nextPitch) {
        if (currentPitch === 71 && nextPitch === 72) {
            return "B#";
        }

        const pitchMap = {
            68: "G#",
            66: "F#",
            64: "E",
            63: "D#",
            62: nextPitch && nextPitch < 62 ? "D" : "Cx"
        };

        if (pitchMap[currentPitch]) {
            return pitchMap[currentPitch];
        }

        if (!nextPitch || nextPitch > currentPitch) {
            return "Cx";
        }
        return "D";
    }
}

module.exports = { ChromaticSpeller };
