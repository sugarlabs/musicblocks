# Logo State Ownership Record

## Purpose

This document records who owns the important state in the Logo subsystem. It is based on the current implementations and on every relevant read and write in the surrounding code. It explains the scope of each field and why that field belongs with its current owner.

## Ownership Contract

```text
Logo
 ├── global execution
 ├── widget/session
 ├── synth/transport
 ├── resources
 └── notation/export

Turtle
 └── per-turtle lifecycle/transport

Singer
 └── per-turtle music

Painter
 └── per-turtle drawing
```

A field is not considered per-turtle just because its data is indexed by a turtle. The owner is determined by the operations that create, update, reset, and share the state.

## Audit Table

### Global execution state

| Field                                                                                                            | Current owner | Actual scope                                             | Decision       | Evidence                                                                                            |
| ---------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| `deps`                                                                                                           | `Logo`        | Injected subsystem dependencies                          | Keep with Logo | Constructed and consumed by `LogoDependencies`; used throughout `logo.js`.                          |
| `activity`                                                                                                       | `Logo`        | Compatibility facade and legacy integration context      | Keep with Logo | `Logo` preserves the Activity reference; `Notation`, plugins, and legacy callers use it.            |
| `blocks`, `turtles`, `stage`, `blockList`                                                                        | `Logo`        | Shared execution dependencies and executable block graph | Keep with Logo | Bound from `LogoDependencies`; dispatch, cleanup, highlighting, and turtle orchestration use them.  |
| `evalFlowDict`, `evalArgDict`, `evalParameterDict`, `evalSetterDict`                                             | `Logo`        | Global plugin registries                                 | Keep with Logo | `plugin-utils.js` writes them and interpreter dispatch reads them.                                  |
| `evalOnStartList`, `evalOnStopList`, `pluginVars`, `pluginReturnValue`                                           | `Logo`        | Run/plugin session state                                 | Keep with Logo | Plugin lifecycle execution is global to a Logo run.                                                 |
| `eventList`                                                                                                      | `Logo`        | Shared event registry                                    | Keep with Logo | Event blocks register and dispatch through `logo.eventList`.                                        |
| `receivedArg`                                                                                                    | `Logo`        | Current interpreter dispatch context                     | Keep with Logo | `runFromBlock` sets it; argument/block and embedded-graphics code reads it.                         |
| `boxes`                                                                                                          | `Logo`        | Shared named-box namespace                               | Keep with Logo | Box blocks and note counting read/write one shared namespace; `Singer.noteCounter` snapshots it.    |
| `actions`                                                                                                        | `Logo`        | Shared named-action table                                | Keep with Logo | Action blocks build and dispatch the table for all turtles.                                         |
| `returns`                                                                                                        | `Logo`        | Per-turtle return stacks managed by the interpreter      | Keep with Logo | Action blocks index it by turtle, while `Logo` creates, resets, and consumes it.                    |
| `switchCases`, `switchBlocks`                                                                                    | `Logo`        | Per-turtle switch execution bookkeeping                  | Keep with Logo | Switch blocks and `Logo` dispatch/reset logic own this interpreter state.                           |
| `connectionStore`, `connectionStoreLock`                                                                         | `Logo`        | Shared duplicate/connection restoration state            | Keep with Logo | Flow blocks write it; `Logo._restoreConnections()` restores block links.                            |
| `stopTurtle`                                                                                                     | `Logo`        | Global cancellation flag                                 | Keep with Logo | Blocks, timers, synth callbacks, and all turtle dispatch paths read it.                             |
| `_lastNoteTimeout`, `_valueBarTimeout`, `_alreadyRunning`, `_prematureRestart`                                   | `Logo`        | Global run lifecycle and cleanup                         | Keep with Logo | Run start/stop and completion paths own these timers and flags.                                     |
| `_runningBlock`, `_ignoringBlock`, `_currentlyHighlightedBlock`                                                  | `Logo`        | Current execution/UI coordination                        | Keep with Logo | Interpreter and block highlighting use one current execution context.                               |
| `time`, `firstNoteTime`, `firstNoteAudioTime`                                                                    | `Logo`        | Run/performance timing                                   | Keep with Logo | Timing is consumed by widgets, export, and run orchestration rather than one turtle.                |
| `specialArgs`                                                                                                    | `Logo`        | Run-level execution arguments                            | Keep with Logo | Reset at run start and consumed by dispatch paths.                                                  |
| `_syncCounter`, `_YIELD_AFTER_SYNC_RUNS`, `_EXPORT_YIELD_AFTER_SYNC_RUNS`, `_iterationBudget`, `_MAX_ITERATIONS` | `Logo`        | Global interpreter scheduling and safety limits          | Keep with Logo | `runFromBlock` and `runLogoCommands` update these counters and limits.                              |
| `stepQueue`, `_unhighlightStepQueue`                                                                             | `Logo`        | Per-turtle step queues coordinated by global stepping    | Keep with Logo | `Logo.step()` creates, drains, and unhighlights these queues; they are not Turtle lifecycle fields. |
| `turtleDelay`, `_turtleDelay`                                                                                    | `Logo`        | Global execution delay/mode                              | Keep with Logo | Toolbar and widgets set it; `runFromBlock` applies it to every turtle.                              |
| `_timerManager`, `_graphicsScheduler`                                                                            | `Logo`        | Shared execution/timer services                          | Keep with Logo | Stop cleanup cancels all managed timers and Logo owns embedded graphics scheduling.                 |

### Widget/session

| Field                                                                                                                               | Current owner | Actual scope                                  | Decision       | Evidence                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------- |
| `reflection`, `phraseMaker`, `legoWidget`, `pitchDrumMatrix`, `arpeggio`, `rhythmRuler`                                             | `Logo`        | Widget instances shared by the activity       | Keep with Logo | Widget blocks and widget modules access these through `activity.logo`.                               |
| `timbre`, `pitchStaircase`, `temperament`, `tempo`, `pitchSlider`, `musicKeyboard`                                                  | `Logo`        | Widget/session instances                      | Keep with Logo | Widget construction and block dispatch use Logo-level references.                                    |
| `modeWidget`, `Oscilloscope`, `oscilloscopeTurtles`, `meterWidget`, `statusMatrix`, `legobricks`, `sample`, `aiMusic`, `aiDebugger` | `Logo`        | Widget/session state                          | Keep with Logo | These objects are selected, opened, or initialized by activity/widget code through Logo.             |
| `showPitchDrumMatrix`                                                                                                               | `Logo`        | Shared widget visibility/session flag         | Keep with Logo | Matrix UI code treats it as Logo-level state.                                                        |
| `inMatrix`                                                                                                                          | `Logo`        | Shared matrix/widget execution context        | Keep with Logo | Matrix and rhythm blocks read it through Logo; it describes the active widget session, not a turtle. |
| `inTimbre`                                                                                                                          | `Logo`        | Shared timbre-builder execution context       | Keep with Logo | Tone and widget blocks read it and update the shared `logo.timbre` builder.                          |
| `inPitchDrumMatrix`                                                                                                                 | `Logo`        | Shared pitch/drum matrix execution context    | Keep with Logo | Singer and drum blocks use it to route rows/columns to `logo.pitchDrumMatrix`.                       |
| `inRhythmRuler`, `rhythmRulerMeasure`                                                                                               | `Logo`        | Shared rhythm-ruler session state             | Keep with Logo | Drum actions and rhythm blocks coordinate one widget and detect polyphony globally.                  |
| `inPitchStaircase`, `inTempo`, `inPitchSlider`, `inMusicKeyboard`, `inArpeggio`                                                     | `Logo`        | Shared widget execution flags                 | Keep with Logo | Action/widget code reads these flags through `activity.logo`.                                        |
| `insideModeWidget`, `insideMeterWidget`, `insideTemperament`                                                                        | `Logo`        | Shared widget nesting/session flags           | Keep with Logo | Widget blocks set and clear them around shared widget operations.                                    |
| `_currentDrumBlock`, `modeBlock`, `_meterBlock`                                                                                     | `Logo`        | Shared widget selection/context               | Keep with Logo | Widget modules read these block identifiers from Logo.                                               |
| `inStatusMatrix`, `inOscilloscope`, `updatingStatusMatrix`, `statusFields`                                                          | `Logo`        | Shared status/oscilloscope collection context | Keep with Logo | Block implementations append status fields; status widgets consume them.                             |
| `pitchBlocks`, `drumBlocks`                                                                                                         | `Logo`        | Matrix widget block collections               | Keep with Logo | Singer and rhythm actions add blocks for the shared matrix widget.                                   |

### Synth/transport

| Field                                                                 | Current owner                | Actual scope                                             | Decision       | Evidence                                                                         |
| --------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------- |
| `synth`                                                               | `Logo`                       | One shared synthesizer/resource manager for the activity | Keep with Logo | `prepSynths`, blocks, widgets, Singer actions, and cleanup all use `logo.synth`. |
| `synth.transport`                                                     | `Synth` referenced by `Logo` | One shared Tone transport                                | Keep with Logo | `Logo` starts/cancels/resets it; scheduling uses the shared transport.           |
| `_synthsInitialized`                                                  | `Logo`                       | Run-level synth lifecycle                                | Keep with Logo | `prepSynths` and cleanup use it to manage all turtle instruments.                |
| `temperamentSelected`, `_userTemperament`, `customTemperamentDefined` | `Logo`                       | Session-level synth configuration                        | Keep with Logo | Temperament widgets and run initialization update shared synth configuration.    |

Per-turtle transport state is intentionally elsewhere:

| Field                                                            | Current owner | Actual scope                                      | Decision         | Evidence                                                                                                            |
| ---------------------------------------------------------------- | ------------- | ------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| `_transportTime`, `_transportEventId`, `delayParameters`         | `Turtle`      | Per-turtle transport position and scheduled event | Keep with Turtle | Each turtle receives independent values; Logo schedules the shared transport event using the active turtle's state. |
| `queue`, `parentFlowQueue`, `unhighlightQueue`, `parameterQueue` | `Turtle`      | Per-turtle execution/lifecycle queues             | Keep with Turtle | Turtle model initializes independent arrays; Logo coordinates them but does not own the storage.                    |

### Resources

| Field                             | Current owner | Actual scope                    | Decision       | Evidence                                                                    |
| --------------------------------- | ------------- | ------------------------------- | -------------- | --------------------------------------------------------------------------- |
| `sounds`                          | `Logo`        | Shared active sound collection  | Keep with Logo | Media blocks and completion cleanup stop and clear the shared collection.   |
| `cameraID`                        | `Logo`        | Shared camera resource handle   | Keep with Logo | Media blocks read it; camera utilities stop it through `logo.setCameraID`.  |
| `mic`                             | `Logo`        | Shared microphone resource      | Keep with Logo | Sensor blocks create/read the microphone through Logo.                      |
| `volumeAnalyser`, `pitchAnalyser` | `Logo`        | Shared audio analyser resources | Keep with Logo | Sensor blocks and audio widgets access the analyser resources through Logo. |
| `lastKeyCode`                     | `Logo`        | Shared input/session state      | Keep with Logo | Keyboard/activity paths use one activity-level value.                       |

### Notation/export

| Field                                                                    | Current owner     | Actual scope                                    | Decision       | Evidence                                                                                                                          |
| ------------------------------------------------------------------------ | ----------------- | ----------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `_notation`                                                              | `Logo`/`Notation` | Shared notation service                         | Keep with Logo | Logo constructs it; notation, Lilypond, ABC, and MXML code consume it.                                                            |
| `notationOutput`, `notationNotes`                                        | `Logo`            | Export buffers, with turtle-indexed note output | Keep with Logo | Lilypond/ABC/export code writes them and SaveInterface reads them. Turtle indexing does not make the export session Singer-owned. |
| `MIDIOutput`, `guitarOutputHead`, `guitarOutputEnd`                      | `Logo`            | Export buffers                                  | Keep with Logo | MIDI and notation exporters append/read these Logo buffers.                                                                       |
| `runningLilypond`, `runningAbc`, `runningMxml`, `runningMIDI`            | `Logo`            | Export mode flags                               | Keep with Logo | Export entry points and block behavior branch on these flags.                                                                     |
| `collectingStats`, `_checkingCompletionState`, `_exportNotationFinished` | `Logo`            | Export/statistics lifecycle                     | Keep with Logo | Export and completion orchestration update these flags.                                                                           |
| `recording`, `recordingBuffer`                                           | `Logo`            | Cross-run recording session                     | Keep with Logo | SaveInterface and recorder setup use one shared recording buffer.                                                                 |
| `_midiData`                                                              | `Logo`            | MIDI export buffer                              | Keep with Logo | SaveInterface writes, reads, and resets it.                                                                                       |
| `svgOutput`, `svgBackground`                                             | `Logo`            | Aggregated SVG/export rendering state           | Keep with Logo | Pen blocks, embedded graphics, and SVG utilities read/write Logo-level output.                                                    |

## Fields Requiring Further Review

These fields may look as though they belong to an individual turtle, but their ownership is not clear from their names alone. They remain with `Logo` because several parts of the interpreter and the widgets use them together. Any future ownership decision must consider all of those uses.

| Field                 | Current owner | Actual scope                                                                  | Decision               | Evidence                                                                                                                                            |
| --------------------- | ------------- | ----------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `inputValues`         | `Logo`        | Sensor values indexed by turtle                                               | Review before changing | Sensors blocks read/write it through `logo`; moving it requires deciding whether sensor state belongs to Turtle or a separate execution capability. |
| `turtleHeaps`         | `Logo`        | Program heaps with turtle-indexed and named/shared access                     | Review before changing | Heap, ensemble, program, interval, and Singer note-counter code read/write it; it is program state, not automatically Singer state.                 |
| `turtleDicts`         | `Logo`        | Program dictionaries indexed by turtle                                        | Review before changing | Dictionary blocks and `Singer.noteCounter` snapshot/restore it; changing its owner would alter how interpreter code accesses it.                    |
| `tupletRhythms`       | `Logo`        | Tuplet construction state supporting shared arrays and turtle-indexed objects | Review before changing | Rhythm palette blocks explicitly support both shapes; PhraseMaker and rhythm blocks also consume the array form.                                    |
| `addingNotesToTuplet` | `Logo`        | Tuplet construction flag supporting shared and turtle-indexed shapes          | Review before changing | Rhythm palette blocks branch on both scalar and turtle-indexed representations.                                                                     |
| `tuplet`              | `Logo`        | Tuplet execution context, sometimes indexed by turtle                         | Review before changing | Rhythm blocks and `Logo.initTurtle` use it; ownership must account for nested execution and compatibility.                                          |
| `tupletParams`        | `Logo`        | Tuplet construction parameters, sometimes indexed by turtle                   | Review before changing | Rhythm palette blocks and PhraseMaker consume it; changing its owner would require one consistent tuplets/session design.                           |

## Ownership Boundaries That Remain Unchanged

The following fields and boundaries remain with their current owners:

- `inputValues`, `turtleHeaps`, `turtleDicts`, and all tuplet fields remain with `Logo`;
- `inMatrix`, `inTimbre`, and `inPitchDrumMatrix` remain with `Logo`;
- `synth` and the shared `synth.transport` remain with `Logo`;
- Logo execution queues remain coordinated by `Logo`, while per-turtle queues remain on `Turtle`;
- the existing public interfaces, block behavior, dependencies, and RequireJS load order remain unchanged.

## Verification Checklist

The ownership tests verify:

- one `Logo` owns one shared `synth` and one shared `synth.transport`;
- each Turtle has independent `_transportTime`, `_transportEventId`, and execution queues;
- two Turtles have distinct Singer and Painter instances;
- `inMatrix`, `inTimbre`, and `inPitchDrumMatrix` remain Logo-level flags;
- notation/export buffers remain on Logo;
- `cameraID` and `mic` remain Logo-level resources.

The tests assert identity and mutation isolation, not merely field existence.
