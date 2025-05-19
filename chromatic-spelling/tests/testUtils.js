/**
 * Mock Scale class for testing
 */
class MockScale {
    /** @private @type {string} */
    #tonic;
    #mode;

    /**
     * @param {string} tonic
     * @param {string} mode
     */
    constructor(tonic, mode) {
        this.#tonic = tonic;
        this.#mode = mode;
    }

    /**
     * @returns {number[]} The scale pitches
     */
    getPitches() {
        return [67, 69, 71, 72, 74, 76, 78];
    }
}

module.exports = { MockScale };
