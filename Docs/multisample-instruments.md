<!-- Copyright (c) 2026 Music Blocks contributors. Licensed under AGPL-3.0-or-later. -->

# Multisample instruments

A multisample instrument groups uploaded WAV recordings of one instrument. Each
recording has an explicit **root pitch**, its original pitch. Ordinary **Set
Instrument** programs select and transpose these recordings to play other notes.
The existing single-sample Sampler and its cents tuning remain separate.

## Create and edit

1. Stop the program, close other widget windows and open Sampler. Choose
   **New multisample instrument…**.
   This opens a blank draft named **My instrument**; it does not copy or convert
   Sampler's recording or cents. Sampler preview, tuning and microphone work pause
   and do not restart automatically on return.
2. Name the instrument and choose **Add recordings…**. Select one or more WAVs.
   Rows follow picker order, including repeated filenames. Roots start unassigned;
   filenames do not determine pitch. Picker cancellation changes nothing.
3. Use **Listen** to hear each original recording before choosing its root.
   Assign distinct roots from C1 through B8. Enharmonic equivalents count as the
   same sounding root. Missing roots, duplicate roots and failed uploads prevent
   Apply. Repair failed rows with **Replace…** or **Remove**; successful additions
   from a mixed batch remain in the draft.
4. Use **Preview instrument** to hear the complete instrument at the chosen target
   pitch, initially C4. The editable field accepts note names or numeric frequency
   in Hz; suggestions are not a target-pitch limit. **Stop** ends preparation or
   playback and permits immediate retry. There is one audition at a time, without
   project effects. Editing the draft stops it.
5. **Apply** checks and decodes every recording before publishing the complete
   instrument. New creation adds an independent Set Instrument stack containing
   the saved instrument value. Add ordinary notes inside that stack. Activate the
   value block to reopen its editor without running the stack.

Replacement keeps the previous recording and root if upload fails or is cancelled.
A successful replacement retains the root and asks you to check it. Remove changes
only the draft; **Undo removal** restores the latest removed row if capacity permits.
One recording is valid; zero is incomplete. Repeated names never merge instruments.

Apply replaces one whole saved value. Undo/Redo restore complete edits; copies are
independently editable. An unchanged edit closes without another history entry.
Cancel, Close and Escape offer **Keep editing / Discard changes** for a dirty draft.
A normal project switch offers the same choice. If the owner changes or is removed,
Apply is disabled: close and reopen it rather than overwriting a newer value.
An unavoidable project replacement discards and announces unapplied edits.

Programs must remain stopped while editing, including when the editor is rolled
up or hidden. Finish or cancel editing before Play, Step or running a stack.
Other widgets, including hidden or rolled-up ones, must be closed before opening
the editor so their auditions cannot compete. Entry refusal preserves their state;
Sampler is the exception because its audition/tuning/microphone work is paused.
Controls support native keyboard navigation; Escape dismisses native pitch
suggestions/selects before requesting editor close. The recording list scrolls
in small windows, with Apply and Cancel outside the list.

## Limits and playback behavior

| Resource                                                    | Limit      |
| ----------------------------------------------------------- | ---------- |
| Recordings per instrument                                   | 1–16       |
| Original WAV bytes per recording                            | 1,000,000  |
| Original WAV bytes per instrument                           | 8,000,000  |
| Admitted decoded PCM per turtle/instrument or preview owner | 32 MiB     |
| Combined admitted decoded PCM for this feature              | 64 MiB     |
| Whole-instrument preparation deadline                       | 30 seconds |

File-byte limits exclude base64/JSON overhead. At 48 kHz, PCM16 WAV allows about
10.4 seconds mono or 5.2 seconds stereo per recording before additional headers.
Resampling and other WAV encodings can increase decoded size. Only embedded WAV
is supported, with verified RIFF/WAVE bytes; an extension alone is insufficient.
No remote audio, MP3, Ogg, automatic pitch detection, velocity layers, recording
tools, loops or time stretching are provided by this editor.

Tone's Sampler rounds the requested MIDI pitch for root selection and chooses the
higher root at equal distance. It retains the fractional remainder when transposing;
this is not exact nearest-root selection on the continuous target frequency.
Transposition changes recording duration and timbre. Root limits C1–B8 do not cap
target pitches. A target Tone cannot play produces a named error and stops the run.

Cold Play prepares supported, structurally valid saved instruments outside trash
for every participating turtle **before** clocks, actions or notes start. This
includes unused instruments: they add time and memory, and their decode, budget or
timeout errors can block Play. Correct or remove/trash an unwanted candidate and
retry. Values passed through boxes/actions use their prepared pair. A value or
turtle introduced during the score without preparation stops with an explicit
error; it does not decode during the score. Silent notation/counting validate
actual use without audio preparation. The first Step click is retained during
preparation; additional clicks are busy rather than queued.

Each turtle owns separate decoded audio and a separate Sampler, preserving ordinary
chords, volume, effects and pan. Startup preserves existing scheduling precision;
there is no new sample-accurate timing guarantee. Stop abandons work immediately
and silently. Timeout is a visible failure. Retry does not wait for old decoding,
and late results cannot play or overwrite fresh work.

The PCM limits count admitted partial preparations, ready instruments and previews
as `frames × channels × 4` bytes. They do **not** cap native decoder allocation,
browser/process memory, encoded data, history snapshots, nodes, effects or other
application audio. Native decoding can continue after Stop; immediate memory
recovery is not promised. No automatic eviction or shared audio cache is used.

## Keep and share your recordings

**Apply saves to blocks in this project.** Use ordinary project Save/Export to
keep or share a durable copy. Native project, local session, custom-stack and
HTML round trips retain embedded recordings, roots, names and order without the
original upload files. HTML reopening means importing into the updated Music
Blocks application; normal runtime/network/hosting requirements still apply.
It is not a fully offline copy of the application. Older application builds need
not understand the new value block.

If local saving fails, applied blocks and audio remain available. Retry saving or
export a native Music Blocks project before leaving. Independent copies and Undo
snapshots duplicate embedded storage; PCM limits do not bound project storage.
Invalid or future-version saved values remain recoverable opaque JSON through
copy/export. They show an invalid/unsupported indication and refuse editing or
actual playback rather than silently replacing or erasing recordings.

Ordinary Set Instrument music and silent notation/counting are supported.
Phrase Maker, Music Keyboard, Sampler, Rhythm Ruler and Timbre capture cannot
preserve the descriptor and refuse its actual use before publishing partial output.
JavaScript export also refuses affected programs, preserves existing editor text
and recommends native project export. No runtime instrument handle is saved.

## Developer contract and validation

The value block owns version-1 JSON: `type: "multisample"`, `version: 1`, a trimmed
nonblank `name`, and ordered `samples` with recording `name`, scientific `root`
and embedded WAV `data`. Preserve filenames and exact audio bytes. Do not persist
aliases, UUIDs, decoded sizes, buffers, Samplers, readiness or preview state.
Legacy four/five-field sample arrays and cents remain unchanged.

Uploads normalize recognized WAV MIME aliases, absent MIME and
`application/octet-stream` only after signature/byte validation. Supported saved
values require a recognized WAV MIME and valid base64/signature/limits; upload
normalization does not relax arbitrary saved input. Signature validity alone does
not establish decodability. Unknown/invalid values, including extra fields, remain
opaque JSON and are excluded from startup preparation, failing only on actual use.

[Synth](../js/utils/synthutils.js) owns validation, session aliases, sequential
static `Tone.ToneAudioBuffer.load`, atomic publication and synchronous PCM admission.
Static loading stays outside Tone's global loading queue and assumes empty baseUrl.
Repeated callers reuse one live owner attempt; other turtles/aliases are independent.
Failure/Stop/timeout/disposal release application references and accounting.
[Logo](../js/logo.js) prepares after prior-run cleanup, connection restoration and
local save, before startup actions/clocks/dispatch. Request/epoch and actual owner
identity/revision checks reject stale callbacks and equal-value replacements.
[The editor](../js/widgets/multisample.js) owns detached drafts and one bounded
audition, sharing Synth preparation. Apply releases audition before fresh checking.
Block restoration/history and generic project serialization own saved snapshots.

Use Node 20 (see `.nvmrc`) and the [testing guide](TESTING.md). There is no typecheck
script in this browser JavaScript project. Run focused adjacent Jest, repository
lint, Prettier on modified files only and full Jest:

```sh
npm test -- --runInBand --coverage=false js/utils/__tests__/synthutils.test.js js/widgets/__tests__/multisample.test.js
npm run lint
npx prettier --check <modified-files>
npm test -- --runInBand --coverage=false --silent
npm run serve:dev
```

With `http://127.0.0.1:3000` serving this checkout, run Cypress in Chrome with
retries disabled. Feature specs are `multisample-editor`, `multisample-programs`,
`multisample-safeguards`, `project-persistence` and `multisample-audio` under
`cypress/e2e/`. Include legacy `real-project-playback`, `maker-widgets` and
`music-keyboard`. Generated WAV fixtures test uploaded bytes, installed Tone PCM,
root selection/pitch, readiness/timing, persistence/history, recovery and cleanup.
The connected legacy fixture is
[legacy-connected-samples.tb](../cypress/fixtures/legacy-connected-samples.tb).
Keep deterministic controlled-buffer/deadline tests distinct from native decoding,
and rendered PCM distinct from human listening.

### Release qualification

Desktop automated Chrome, reported Firefox workflows/accessibility and requested
headphone checks have evidence. This establishes development progress, not classroom
release readiness. Representative lower-memory classroom-device testing is deferred
and **unrun**. Native/process peak allocation and retainer attribution remain
unresolved; settled feature PCM alone cannot prove no growing native resources.
The desktop tested has approximately 23.36 GiB RAM and is not the classroom target.
Reported Firefox/NVDA checks lack exact NVDA/Windows versions, and headphone model
and constant-volume metadata were not supplied. Earlier Firefox quietness and a
turtle-cache warning remain disclosed observations; the separate focus/viewport
bug was corrected. Do not infer zero regressions, broader issue closure or merge
approval. Complete missing device/resource evidence before classroom release.
