# Temperament Engine PoC

Proof of concept for the GSoC "Backporting v4 Temperament to v3" project.

## The Problem

Music Blocks v3 computes note frequencies using a **static lookup table** where every note is a fixed ratio from one starting pitch (`temperamentChanged()` in `synthutils.js`). This produces correct intervals from the starting pitch, but **wrong intervals between other pairs of notes**.

Example: In Just Intonation starting from C, the D-to-F interval is 32/27 (Pythagorean minor third, ~294 cents) instead of 6/5 (just minor third, ~316 cents). The ~21.5-cent error (the syntonic comma) is clearly audible when playing chords rooted on non-starting pitches.

Additionally, `pitchToFrequency()` always uses the 12-ET formula `A0 * 2^(n/12)` regardless of the active temperament, and pitch arithmetic throughout the codebase hardcodes `% 12` and `SEMITONES = 12`.

## The Approach

`js/utils/temperament-engine.js` introduces a centralized, temperament-aware frequency computation module:

- **`getFrequency(pitch, octave, temperament, rootPitch, rootOctave)`** - Computes frequency using the temperament's interval ratios relative to a specified root pitch (not a hardcoded starting pitch).
- **`getChordFrequencies(chordRoot, chordOctave, notes, temperament)`** - Computes chord note frequencies relative to the chord root, fixing the syntonic comma bug.
- **`getPitchCount(temperament)`** / **`stepsBetween()`** / **`ratioForSteps()`** - Replaces hardcoded `% 12` arithmetic with temperament-aware pitch count.

The key design decisions:
1. Temperament is an **explicit parameter**, not implicit global state
2. **No hardcoded 12-tone assumptions** - uses `pitchNumber` from the TEMPERAMENT data
3. **Pure functions** - no DOM, no synth, fully testable
4. **Backward compatible** - defaults to "equal" temperament, reproducing existing v3 behavior

## Files

```
js/utils/temperament-engine.js            # The engine module (~270 lines)
js/utils/__tests__/temperament-engine.test.js  # Tests (~340 lines)
```

## Run

```bash
npm test -- --testPathPattern="temperament-engine"
```

## What the Tests Prove

| Test | What it shows |
|------|---------------|
| `OLD method: D-F interval in JI = 32/27` | Reproduces the bug: static grid gives Pythagorean minor 3rd (~294 cents) |
| `NEW method: D-F interval in chord = 6/5` | Fix: chord-root-relative computation gives pure just minor 3rd (~316 cents) |
| `the error is exactly the syntonic comma` | Quantifies the bug: 21.5-cent difference between old and new |
| `C major chord is correct in BOTH methods` | Starting-pitch chords are unaffected (backward compat) |
| `equal temperament is unaffected` | 12-ET has no comma - both methods agree |
| `19-EDO / 31-EDO / 5-EDO / 7-EDO` | Non-12-tone temperaments work with parameterized pitch count |
| `backward compatibility` | Engine matches existing `pitchToFrequency()` for equal temperament |
