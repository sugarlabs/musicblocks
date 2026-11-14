# Using the Kokoro voice in Music Blocks

## Experimental Sing block

The **Sing** clamp in the **Tone** palette turns one Kokoro syllable into a
pitched singing voice. Place ordinary **Note value** and **Pitch** blocks inside
it. The text input must be a literal text block, for example `la`, `ah`, or `oh`.
Use separate Sing clamps for different syllables. A newly dragged Sing block
already contains a playable quarter note. Singing also works inside called
actions, including recursive actions.

Load `examples/kokoro-singing.tb` for a four-note `la` melody. Press **Run** and
wait for the model and syllable to prepare before playback starts. **Stop**
also cancels playback that is waiting for preparation. Unlike Speak, Sing
explicitly requests Kokoro and does not require `?kokoro=true`.

This is experimental pitch-shifted speech, not a trained singing model.
Pitch changes also change the voice's formants. Whole phrases are not aligned
to individual notes. Notes support 20–4000 Hz and durations up to 30 seconds;
a project can prepare up to 32 distinct syllables, each at most 40 characters.
Prepared syllables are cached locally across page reloads, keyed by model,
precision, voice and text. A cache hit skips model loading and inference.
Storage failures fall back to ordinary synthesis. The disk cache retains at
most 32 entries, each no larger than 4 MiB. Rendered pitch/duration buffers
are reused across Stop and replay, with an 8 MiB / 64-note memory limit.
Changing a pitch or duration renders that variant once.

Held notes of at least 0.75 seconds gain a subtle automatic vibrato: the pitch
stays steady for the first 0.25 seconds, then eases over 0.4 seconds into a
5.5 Hz variation of up to 20 cents in either direction. Shorter notes stay
steady. This runs in the existing audio renderer, without extra model inference.

The first uncached syllable still needs the model download and inference;
playback waits for preparation rather than letting the music run ahead.
Progress distinguishes model download from syllable preparation.

Model loading failures are shown rather than silently replacing the singing
voice with an oscillator. Preparation is skipped for notation and MIDI export.

The browser regression tests in `cypress/e2e/singing.cy.js` cover playback,
cached replay, reload without model inference, save serialization, Stop during
preparation, and recovery from a synthesis failure. They stub the Kokoro model boundary so CI does not
download weights; scheduling, audio processing, and the sampler remain real.

## Speak block

The Speak block can use Kokoro, a more natural sounding AI voice that runs in
your browser. The normal browser speech voice is still the default, so Kokoro
is completely optional.

## Quick start

1. Open Music Blocks in a modern browser such as Chrome, Edge, or Firefox.
2. Add `?kokoro=true` to the end of the Music Blocks URL.

    For example:

    ```text
    https://musicblocks.sugarlabs.org/?kokoro=true
    ```

3. Open the **Media** palette.
4. Drag a **Speak** block onto the workspace.
5. Type some words into the block, such as `Hello from Music Blocks`.
6. Press the **Run** button.
7. Allow audio if your browser asks for permission.

The first time you run a Speak block with Kokoro enabled, Music Blocks downloads
the voice files. This download is about 92 MB, so it can take a little while.
You will see the download progress in a popup. Later runs reuse the cached files
and start much faster.

## Keep Kokoro enabled

The `?kokoro=true` option only applies to the current browser tab. To enable
Kokoro every time you open Music Blocks, open the browser developer console and
run this line:

```js
localStorage.setItem("kokoroSpeech", "on");
```

Reload the page afterwards. To switch back to the normal browser voice, run:

```js
localStorage.removeItem("kokoroSpeech");
```

## If it does not speak

- Make sure the URL contains `?kokoro=true`, or that `kokoroSpeech` is set to
  `on` in local storage.
- Check that your device is connected to the internet for the first download.
- Keep the Music Blocks tab open while the voice files are downloading.
- Click the page once before pressing **Run** if the browser has blocked audio.
- If Kokoro cannot load, the Speak block uses the browser's normal speech voice
  instead.

## Notes for teachers and students

Kokoro runs locally in the browser after its files have been downloaded. Text is
not sent to a Music Blocks server by this feature. A project can contain several
Speak blocks, and they are played in order so the phrases do not talk over one
another.
