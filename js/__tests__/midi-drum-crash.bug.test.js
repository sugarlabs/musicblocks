// BUG: midi.js transcribeMidi() crashes when a percussion track contains a
// MIDI note number absent from REVERSE_DRUM_MIDI_MAP (e.g. 35, 44, 51).
//
// At js/midi.js:212 inside getPitch():
//   const drumname = drumMidi[track.notes[0].midi][0] || "kick drum";
//
// If drumMidi[midiNote] is undefined, indexing [0] throws:
//   TypeError: Cannot read properties of undefined (reading '0')
// The "|| kick drum" fallback is never reached.
//
// Affected: any GM MIDI file whose drum track uses notes outside the 18-entry
// allowlist in REVERSE_DRUM_MIDI_MAP (musicutils.js:2254-2273).
// Common missing notes: 35 (acoustic bass drum), 44 (pedal hi-hat),
// 51 (ride cymbal 1), 37 (side stick), 54 (tambourine).

describe("BUG: getPitch() crashes when drum MIDI note is absent from REVERSE_DRUM_MIDI_MAP", () => {
    // Partial REVERSE_DRUM_MIDI_MAP as defined in musicutils.js.
    // Note 35 (acoustic bass drum) is intentionally absent — it is one of the
    // most common GM percussion notes but is not in the map.
    const drumMidi = {
        36: ["kick drum"],
        38: ["snare drum"],
        42: ["hi hat"]
    };

    // Mirrors the exact logic at midi.js:212 (the bug line).
    const getPitchBuggy = midiNote => {
        const drumname = drumMidi[midiNote][0] || "kick drum"; // crashes if midiNote absent
        return drumname;
    };

    // Fixed version with a guard.
    const getPitchFixed = midiNote => {
        const entry = drumMidi[midiNote];
        const drumname = (entry && entry[0]) || "kick drum";
        return drumname;
    };

    test("BUG CONFIRMED: note 35 (acoustic bass drum) — absent from map — throws TypeError", () => {
        expect(() => getPitchBuggy(35)).toThrow(TypeError);
    });

    test("BUG CONFIRMED: note 44 (pedal hi-hat) — absent from map — throws TypeError", () => {
        expect(() => getPitchBuggy(44)).toThrow(TypeError);
    });

    test("BUG CONFIRMED: note 51 (ride cymbal 1) — absent from map — throws TypeError", () => {
        expect(() => getPitchBuggy(51)).toThrow(TypeError);
    });

    test("fix: guard prevents crash and falls back to kick drum for missing notes", () => {
        expect(() => getPitchFixed(35)).not.toThrow();
        expect(getPitchFixed(35)).toBe("kick drum");
        expect(getPitchFixed(44)).toBe("kick drum");
        expect(getPitchFixed(51)).toBe("kick drum");
    });

    test("fix: in-map notes still resolve correctly after guard", () => {
        expect(getPitchFixed(36)).toBe("kick drum");
        expect(getPitchFixed(38)).toBe("snare drum");
        expect(getPitchFixed(42)).toBe("hi hat");
    });
});
