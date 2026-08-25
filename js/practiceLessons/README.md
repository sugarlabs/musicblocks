# Practice Lessons and Explorer Journal

This folder holds the guided lesson track that ships with Music Blocks, together with the Explorer Journal that records what a learner has finished.
It is self-contained: the lessons are data, not code, so most contributions here mean editing JSON rather than writing JavaScript.

For the learner-facing description of these panels, see [Using Music Blocks](../../Docs/documentation/README.md#11-practice-lessons).

## What lives here

| File                          | Role                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `practiceLessons.json`        | Every lesson, as data. The story text, the goal, the badges, and the rules used to check the work.      |
| `practiceLessons.<lang>.json` | Display strings for one language. Never lesson logic.                                                   |
| `practiceProblems.js`         | Loads the lesson file, picks the right translation, and exposes `PracticeProblems` and `PracticeTheme`. |
| `practiceUI.js`               | Draws both panels: `PracticeUI` for lessons, `ExplorerJournalUI` for the journal.                       |
| `practiceValidator.js`        | Reads the blocks on the canvas and decides whether the lesson goal and each badge have been met.        |
| `practiceManager.js`          | Persists progress, badges, and journal pages to `localStorage`.                                         |
| `practiceEntry.js`            | Two globals the toolbar calls to open each panel.                                                       |
| `practice.css`                | Styling for both panels, including the CSS-only lesson artwork.                                         |
| `__tests__/`                  | Jest tests.                                                                                             |

Starter projects live one folder up, in `js/practice_projects/`.

## How a lesson reaches the screen

The Help menu items defined in `index.html` and labelled in `js/toolbar.js` call `window.startPracticeMode()` and `window.openExplorerJournal()` from `practiceEntry.js`.

`PracticeUI.open()` calls `loadPracticeLessons()`, which fetches `practiceLessons.json`, overlays the translation for the active language, and normalises each entry.
`renderLevelMenu()` then lists the lessons, and `renderLevel(level)` draws one of them and loads its starter blocks onto the canvas.

Pressing **Check My Work** runs `PracticeValidator.validate(problem)` for the lesson goal and `PracticeValidator.assessBadges(problem)` for the badges.
A passing result goes to `PracticeManager.completeLevel()`, which records the lesson, awards badges, and unlocks an island badge if that was the last lesson on the island.

While a lesson is open, `startBadgeMonitor()` re-checks the badge criteria every 1200 ms.
Hidden discovery badges are therefore awarded as soon as the learner earns them, without waiting for **Check My Work**.

## Adding a new lesson

### 1. Build the starter project

Assemble the blocks a learner should start from, export the project, and save it as `js/practice_projects/<name>_level<N>.tb`.
Keep it minimal: it is a starting point, not the answer.

### 2. Register the starter project

`PracticeUI.loadStarterBlocks()` in `practiceUI.js` maps a level number to a filename.
Add your entry there, or the lesson will open with an empty canvas.

```js
const projectFiles = {
    1: "hcb_level1.tb",
    // ...
    9: "your_new_level9.tb"
};
```

Note that opening a lesson calls `sendAllToTrash()` before loading, so it replaces whatever is on the canvas.

### 3. Add the lesson entry

Append an object to `problems` in `practiceLessons.json`.
See the schema reference below for every field.
Keep `level` numbers unique; the panel lists lessons in array order, so position the entry where it belongs in the sequence.

### 4. Teach the validator how to check it

If the lesson can be expressed as a sequence of chunk names, use `expected.pattern` and no new code is needed.
Anything else needs a method on `PracticeValidator` and a branch in `validate()`.
See [Validators](#validators).

### 5. Add the badges

Every lesson needs one badge whose `criterion` proves the lesson is finished, plus any number of hidden discovery badges.
A new completion criterion must also be listed in `COMPLETION_CRITERIA` at the top of `practiceUI.js`.
If you skip that step the badge monitor treats it as a hidden discovery and awards it silently, so the lesson never reports itself as complete.

### 6. Translate the display strings

Add the lesson's text to each `practiceLessons.<lang>.json`.
See [Translations](#translations).

### 7. Test

Add a case to `__tests__/practiceValidator.test.js` that builds a fake block list and asserts your validator accepts a correct solution and rejects a near miss.
Then run the gates listed in [Running the checks](#running-the-checks).

## Lesson schema reference

| Field             | Required | Meaning                                                                                                            |
| ----------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `level`           | yes      | Unique number. Used as the storage key, the starter-project key, and the label.                                    |
| `island`          | yes      | Groups lessons for the island badge. Every lesson sharing an island must be complete before that badge is awarded. |
| `title`           | yes      | Short lesson name.                                                                                                 |
| `description`     | yes      | The lesson body, as an HTML string. Styled by the classes in `practice.css`.                                       |
| `journal`         | yes      | `title`, `island`, `learned` (a list of concepts), and optionally `completeTitle` for the success notice heading.  |
| `expected`        | yes      | The rules the validator checks. See [Validators](#validators).                                                     |
| `rewards`         | no       | Lines shown in the Quest Rewards card.                                                                             |
| `badges`          | yes      | Badge definitions. See below.                                                                                      |
| `bigBadgeId`      | no       | Key into `theme.bigBadges`. Resolved to `bigBadge` when the file loads.                                            |
| `secretHelpCards` | no       | Extra actions. See [Extra actions](#extra-actions).                                                                |
| `incomplete`      | no       | `title` and `message` shown when **Check My Work** fails. A generic hint is used if omitted.                       |

A badge looks like this:

```json
{
    "id": "bridge_builder",
    "label": "Bridge Builder",
    "shortLabel": "Bridge",
    "iconKey": "bridge",
    "criterion": "completePattern",
    "message": "The stone tablet begins to glow."
}
```

`id` must be unique within the lesson, because it is what gets stored once earned.
`iconKey` selects the artwork and must match a `.level-badge-<key>` rule in `practice.css`; unknown keys fall back to `discovery`.

## Validators

`PracticeValidator.validate(problem)` dispatches on the first key it finds in `expected`, in this order:

| `expected` key        | Runs                                 |
| --------------------- | ------------------------------------ |
| `circularRhythmRing`  | `validateCircularRhythmRing()`       |
| `twinklePhraseMaker`  | `validateTwinklePhraseMaker()`       |
| `animatedPolyrhythm`  | `validateAnimatedPolyrhythm()`       |
| `basicShapeSet`       | `validateBasicShapeSet()`            |
| `phraseMakerWorkflow` | `validatePhraseMakerLesson(problem)` |
| `rhythmMakerWorkflow` | `validateRhythmMakerWorkflow()`      |
| `metronomeWorkflow`   | `validateMetronome()`                |
| `pattern`             | `validatePattern()`, the default     |

The order matters: a lesson that sets two of these keys only ever runs the first match.

### Pattern lessons

`expected.pattern` is the sequence of action chunks expected under the `start` block, with `repeat` blocks expanded.
Matching is done by shape, not by name.
`matchesPattern()` accepts any renaming as long as it is one-to-one, so a learner who calls their chunks `Verse` and `Chorus` still passes a lesson written as `["A", "A", "B", "A"]`.
This is deliberate, and it is why `renamedChunks` can be a badge rather than a failure.

### Writing a new validator

Read the canvas through `this.getBlockList()`, which returns the raw `blockList` keyed by block id, and always skip entries with `block.trash` set.
Helpers already exist for the common questions:

| Helper                                                          | Answers                                                                |
| --------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `hasBlockNamed(names)`                                          | Is any of these blocks on the canvas?                                  |
| `hasConnectedBlockNamed(names)`                                 | Is any of these blocks actually attached to a stack?                   |
| `hasLoopContainingBlockNamed(names)`                            | Is one of these inside a loop?                                         |
| `hasLoopWithBlockInside(names)`                                 | Is one of these anywhere inside a loop, including within a note clamp? |
| `countStartBlocks()`                                            | How many mice are there?                                               |
| `getPitchOctaves()`, `getRhythmDivisors()`, `getSetDrumNames()` | Read specific arguments back out.                                      |

Prefer composing those over walking the block list again.
Add your method, then add a branch to `validate()` keyed on a new `expected` field.

## Badge criteria

`assessBadges()` keeps the badges whose `criterion` currently has evidence.
These are the criteria `hasBadgeEvidence()` understands.

Completion criteria, which mean the lesson itself is finished:

| Criterion                    | Proves                                                        |
| ---------------------------- | ------------------------------------------------------------- |
| `completePattern`            | The chunk sequence matches `expected.pattern`.                |
| `completeRhythmWorkflow`     | The Rhythm Maker workflow was carried out.                    |
| `completePhraseWorkflow`     | The Phrase Maker workflow was carried out.                    |
| `completeBasicShapeSet`      | Triangle, square, and pentagon programs all exist.            |
| `completeAnimatedPolyrhythm` | Duplet and triplet rhythms with an avatar and a note action.  |
| `completeCircularRhythmRing` | A conductor plus at least four drum mice, wired by broadcast. |
| `completeTwinkleForm`        | The Twinkle sections appear in the order A1 A2 B B A1 A2.     |
| `completeMetronome`          | A loop holds at least two different drum sounds.              |

Hidden discovery criteria, awarded by the background monitor as the learner experiments:

| Criterion                       | Looks for                                                              |
| ------------------------------- | ---------------------------------------------------------------------- |
| `renamedChunks`                 | Action names other than those in `expected.chunkNames`.                |
| `changedOctave`                 | Pitch octaves other than those in `expected.octaves`.                  |
| `usedTranspose`                 | `settransposition`, `setscalartransposition`, `setratio`, or `octave`. |
| `createdVariation`              | A sequence that differs from `expected.pattern`.                       |
| `usedRepeatLoop`                | A connected `repeat`.                                                  |
| `changedRhythmLength`           | The rhythm length was edited.                                          |
| `changedDrumSound`              | A different drum was selected.                                         |
| `savedDrumMachine`              | The drum machine was saved as an action.                               |
| `changedPhraseDrums`            | The Phrase Maker drums were changed.                                   |
| `createdPhraseVariation`        | An extra phrase beyond the required ones.                              |
| `completedTwoPartForm`          | A two-part form was built.                                             |
| `usedGeometryDivision`          | A connected `divide`.                                                  |
| `usedBoxVariable`               | `namedbox`, `storein`, `storein2`, `box`, `box1`, or `box2`.           |
| `readBoxValue`                  | `namedbox`, `box`, `box1`, or `box2`.                                  |
| `changedShapeColor`             | `setcolor`, `sethue`, `setshade`, or `setgrey`.                        |
| `createdExtraPolygon`           | A polygon with a side count outside 3, 4, and 5.                       |
| `usedDupletTripletRhythms`      | Rhythm divisors 2 and 3.                                               |
| `createdExtraPolyrhythmDivisor` | A divisor beyond 2 and 3.                                              |
| `usedAvatarAnimation`           | `turtleshell`.                                                         |
| `usedEveryNoteAction`           | `everybeatdo`.                                                         |
| `usedNoteValueMotion`           | `turtlenote`, `turtlenote2`, `turtleelapsednotes`, or `elapsednotes`.  |
| `createdPitchPolyrhythm`        | `pitch` or `settimbre`.                                                |
| `changedAnimationTurn`          | `right`, `left`, or `setheading`.                                      |
| `usedOneMinusToggle`            | A stored value toggled with one-minus.                                 |
| `playedRingDrum`                | `playdrum` or `setdrum`.                                               |
| `builtMouseRing`                | At least four `start` blocks.                                          |
| `addedHarmonyVoice`             | At least two `start` blocks.                                           |
| `swungThePendulum`              | `setheading`.                                                          |
| `changedTempo`                  | `setmasterbpm`, `setmasterbpm2`, `setbpm`, `setbpm2`, or `setbpm3`.    |
| `setTheMeter`                   | `meter`.                                                               |
| `paintedTheBeat`                | `beatvalue`.                                                           |

An unrecognised criterion returns `false`, so a typo shows up as a badge that can never be earned.

## Extra actions

`secretHelpCards` are the buttons under the "Hidden Petals" style headings.
Each key in the object matches a `data-secret-help="<key>"` attribute in the lesson's `description` HTML, and `attachSecretHelpCards()` wires them together.

There are two kinds.
A block card opens the standard block help:

```json
"changeOctave": { "title": "Change octave", "type": "block", "blockName": "pitch" }
```

A prose card opens a written explanation instead:

```json
"makeLonger": {
    "title": "Make it longer",
    "heading": "Make the sound last longer",
    "description": "Add another action chunk after the song...",
    "singlePage": true
}
```

These buttons only explain an idea.
They award nothing on their own; the matching badge is earned by the criterion, not by opening the card.

## Explorer Journal

Completing a lesson calls `ensureJournalPage()`, which creates a page seeded from the lesson's `journal` block.
A page carries the lesson title, the island, the list of concepts learned, and buckets for artifacts.
Only the `notes` bucket is used today; `drawings`, `stickers`, `badges`, `images`, `audio`, and `videos` exist so a page can grow without a storage migration.

Learners can also create general notes that are not tied to any lesson.
Those live in `journal.generalNotes` and are managed by the `createGeneralNote`, `updateGeneralNoteTitle`, `saveGeneralNoteEntry`, and `deleteGeneralNote` methods on `PracticeManager`.

## Storage

Everything is kept in the browser, so progress does not follow a learner to another device.

| Key                   | Holds                                                               |
| --------------------- | ------------------------------------------------------------------- |
| `mb_practice_levels`  | Per-level completion and earned badge ids, plus a `bigBadges` list. |
| `mb_explorer_journal` | Journal pages and general notes, under a `version` field.           |

`getLevelRecord()` still understands the older format where a level was stored as plain `true`, and upgrades it on read.
Keep that tolerance in mind before changing the shape of a record.

## Translations

Lesson text is translated by `practiceLessons.<lang>.json`, which is fetched alongside the English file and overlaid onto it.
A translation supplies display strings only; the lesson logic always comes from `practiceLessons.json`.
A missing or malformed translation is ignored so the panel still opens.

Only these keys are read from a translation:

| Location                                 | Translatable keys                                                     |
| ---------------------------------------- | --------------------------------------------------------------------- |
| `theme`                                  | `title`, `subtitle`, `intro`                                          |
| `theme.bigBadges.<id>`                   | `label`, `shortLabel`, `message`                                      |
| `problems.<level>`                       | `title`, `description`, `rewards`                                     |
| `problems.<level>.journal`               | `title`, `island`, `completeTitle`, `learned`                         |
| `problems.<level>.incomplete`            | `title`, `message`                                                    |
| `problems.<level>.badges.<id>`           | `label`, `shortLabel`, `message`                                      |
| `problems.<level>.secretHelpCards.<key>` | `title`, `heading`, `description`, `musicHeading`, `musicDescription` |

`rewards` and `journal.learned` are lists matched by position, so keep the same number of entries in the same order.

Panel chrome such as **Check My Work** and **Next Lesson** is not part of these files.
Those strings go through `_()` and live in `po/<lang>.po`.
After editing a `.po` file, regenerate the runtime catalogue rather than editing `locales/` by hand:

```bash
python3 convert_po_to_json.py po/hi.po locales
```

Japanese is a special case: `ja.po` and `ja-kana.po` are merged into a single `locales/ja.json`.

## Running the checks

```bash
npx jest js/practiceLessons          # tests for this folder
npm test                             # full suite, with coverage thresholds
npm run lint                         # eslint
npx prettier --check js/practiceLessons
```

To try a lesson end to end, start the server and open the Help menu:

```bash
npm start                            # or PORT=3001 npm start if 3000 is busy
```

Progress is cached in `localStorage`, so clear `mb_practice_levels` and `mb_explorer_journal` when you need to test a lesson from a clean slate.
