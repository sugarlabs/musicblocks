# Using the Kokoro voice in Music Blocks

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
