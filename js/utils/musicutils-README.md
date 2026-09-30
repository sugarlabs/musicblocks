# musicutils.js file map

`js/utils/musicutils.js` used to be a single ~3,000-line file holding almost all of Music
Blocks' music-theory code. It has since been split into the smaller files below, one topic
each, so it's easier to find where a given function or table lives. `musicutils.js` itself is
now just the aggregator: it requires every file below and re-exports their combined surface, so
existing code that does `require("./musicutils")` or relies on the bare globals keeps working
unchanged.

Each file follows the same pattern: a RequireJS/CommonJS guard at the top that imports what it
needs from earlier files in the list, `var` declarations (not `const`/`let` — see below), and an
aggregate object (e.g. `MusicUtilsConstants`) exported both via `module.exports` and as a
`window` global for the browser's classic `<script>` loading.

| File                        | Global                  | What it owns                                                                                                                                                                                                                                                |
| --------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `musicutils-constants.js`   | `MusicUtilsConstants`   | Pure-literal constants: note/pitch symbol tables, accidental conversion maps, chord and mode name lists, MIDI maps, default values. No functions.                                                                                                           |
| `musicutils-i18n.js`        | `MusicUtilsI18n`        | Tables built by calling `_()` at load time (translated strings), e.g. `SOLFEGECONVERSIONTABLE`, `SELECTORSTRINGS`, `DEGREES`.                                                                                                                               |
| `musicutils-temperament.js` | `MusicUtilsTemperament` | Temperament tables and every function that reads or reassigns them: `TEMPERAMENTS`, `octaveRatio`, `getCurrentEDO`, `generateNoteNames`, `getTemperament`, `addTemperamentToList`, etc.                                                                     |
| `musicutils-pitch.js`       | `MusicUtilsPitch`       | Pitch-name/number/frequency helpers that don't depend on a key signature: `frequencyToPitch`, `parseNoteString`, `noteToPitchOctave`, `calcOctave`, `normalizeNoteAccidentals`.                                                                             |
| `musicutils-lookups.js`     | `MusicUtilsLookups`     | Name/value lookups by category: drum, voice, noise, filter, oscillator, interval and MIDI-map getters.                                                                                                                                                      |
| `musicutils-rhythm.js`      | `MusicUtilsRhythm`      | Fraction and duration helpers: `reducedFraction`, `durationToNoteValue`, `calcNoteValueToDisplay`, `convertFactor`; measure position: `getMeasurePosition`, `getMeterAnchor`.                                                                               |
| `musicutils-solfege.js`     | `MusicUtilsSolfege`     | Solfege name parsing and conversion: `noteIsSolfege`, `splitSolfege`, `i18nSolfege`, `convertFromSolfege`.                                                                                                                                                  |
| `musicutils-modewheel.js`   | `MusicUtilsModeWheel`   | Helpers for the mode pie-menu widget: `getModeNamesForGroup`, `getModeLabel`, `getModeSliceColors`, `configureWheel`.                                                                                                                                       |
| `musicutils-modecore.js`    | `MusicUtilsModeCore`    | Mode/chord core, including `modeMapper` (the big key+mode switch) and everything that depends on it: `MUSICALMODES`, `customMode`, `getModeNumbers`, `getCustomNote`, `getModePattern`.                                                                     |
| `musicutils-pitchscale.js`  | `MusicUtilsPitchScale`  | The core pitch/scale functions, which are mutually recursive and had to move as one unit: `getNote`, `numberToPitch`, `pitchToNumber`, `getNoteFromInterval`, `getNoteFromSolfege`, `keySignatureToMode`, `getScaleAndHalfSteps`, `getSharpFlatPreference`. |
| `musicutils-buildscale.js`  | `MusicUtilsBuildScale`  | Scale construction and the layer built on top of the pitch/scale cycle: `buildScale`, `pitchToFrequency`, `getInterval`, `scaleDegreeToPitchMapping`, `getSolfege`.                                                                                         |
| `musicutils-pitchinfo.js`   | `MusicUtilsPitchInfo`   | The last, top-level consumers of everything above: `getStepSizeUp`/`getStepSizeDown` (used by `js/turtle-singer.js` and `js/turtleactions/PitchActions.js`) and `getPitchInfo` (used by `js/blocks/PitchBlocks.js`).                                        |

Files are listed in dependency order — each one only imports from files above it in this table
(plus `js/utils/utils.js` and `js/utils/utils-logic.js`), so there are no cross-file cycles.
`js/loader.js`'s RequireJS shim config and `js/activity.js`'s `MYDEFINES` list both load them in
this same order, immediately before `utils/musicutils` itself.

## Why `var`, not `const`/`let`

`musicutils.js`'s CommonJS guard does `var { SHARP, FLAT, ... } = MusicUtilsConstants;` and
similar destructures for every module above. In the browser, `var` is hoisted to the top of the
enclosing script; a hoisted `var` cannot redeclare a top-level `const` or `let` in the same
shared script scope. Since these files are still loaded as classic (non-module) `<script>` tags
in the browser, every top-level declaration in every `musicutils-*.js` file has to be `var`.

## Adding to one of these files

- Match the existing pattern: `var`, a `/* global */` header listing only real external globals
  the file uses (not other declarations in the same file), and an `/* exported */` header
  listing everything this file exports, ending with its own aggregate name.
- If what you're adding needs something from a file later in the table above, that's a sign it
  belongs in that later file (or a new one) instead, to avoid an import cycle.
- Update the exported object at the bottom of the file, and if you're adding a brand-new file,
  register it in `js/loader.js` (RequireJS shim `deps`) and in `js/activity.js`'s `MYDEFINES`.
