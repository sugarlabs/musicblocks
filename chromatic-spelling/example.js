/** @typedef {import('./ChromaticSpeller').ChromaticSpeller} ChromaticSpeller */
/** @typedef {import('./tests/testUtils').MockScale} Scale */

const { ChromaticSpeller } = require("./ChromaticSpeller");
const { MockScale: Scale } = require("./tests/testUtils");

/** @type {ChromaticSpeller} */
const speller = new ChromaticSpeller(new Scale("G", "major"));

/** @type {ReadonlyArray<{pitch: number, next: number|null}>} */
const melody = Object.freeze([
    Object.freeze({ pitch: 68, next: 68 }), // G#
    Object.freeze({ pitch: 68, next: 68 }), // G#
    Object.freeze({ pitch: 68, next: 66 }), // G#
    Object.freeze({ pitch: 66, next: 64 }), // F#
    Object.freeze({ pitch: 64, next: 64 }), // E
    Object.freeze({ pitch: 64, next: 63 }), // E
    Object.freeze({ pitch: 63, next: 63 }), // D#
    Object.freeze({ pitch: 63, next: 62 }), // D#
    Object.freeze({ pitch: 62, next: 63 }), // Cx
    Object.freeze({ pitch: 63, next: null }) // D#
]);

melody.forEach((note) => {
    const spelling = speller.spellPitch(note.pitch, note.next);
    console.log(`Pitch ${note.pitch} spelled as: ${spelling}`);
});
