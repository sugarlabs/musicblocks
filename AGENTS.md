# AGENTS.md

Use this when working on a bug fix, addition/improving a feature.

## 1. Understand Before Editing

**Do not guess. Read the code path that actually owns the problem.**

Before changing code:

- Check whether the reported bug is already fixed on the current branch.
- Read the exact files involved before proposing or writing a fix.
- Inspect 2-3 nearby examples in the same subsystem and copy existing patterns.
- If the issue is unclear, say what is unclear instead of making up behavior.

Quick repo map:

- `js/activity.js` - app entry point, load order, runtime wiring
- `js/loader.js` - RequireJS bootstrap, module dependency graph, load order
- `js/block.js` - behavior of a single block in the UI
- `js/blocks.js` - workspace block management, connections, drag/drop, stack behavior
- `js/basicblocks.js` - registration of the main block sets
- `js/blocks/*.js` - block definitions by palette
- `js/turtleactions/*.js` - runtime behavior triggered by blocks
- `js/logo.js` - project execution engine
- `js/artwork.js` - block artwork and palette visuals
- `js/turtledefs.js` - block palette registration, beginner/advanced mode filtering, default stacks
- `js/palette.js` - palette rendering, palette button creation, palette menus
- `js/macros.js` - built-in macro definitions (changing keys breaks saved projects)
- `js/turtle-singer.js` - `Singer` class, all music-specific turtle runtime behavior
- `js/turtle-painter.js` - `Painter` class, all graphics-specific turtle runtime behavior
- `js/turtles.js` - turtle container management, turtle creation/deletion
- `js/widgets/*.js` - larger UI widgets (phrase maker, tempo, keyboard, etc.)
- `js/js-export/` - JavaScript code generation from block programs (AST-based)
- `js/utils/utils.js` - DOM helpers (`docById`, `_`), `escapeHTML`, platform detection
- `js/utils/musicutils.js` - core music theory (note names, intervals, scales, temperaments)
- `js/utils/synthutils.js` - Tone.js integration, audio synthesis, instrument management
- `js/utils/*.js` - other shared helpers, often high impact
- `planet/` - cloud sharing system (Planet), separate subsystem with its own tests
- `lib/` - vendored third-party libraries — **never modify** (see §4)
- `css/` - stylesheets (SCSS source)
- `locales/` - i18n translation JSON files
- `sounds/` - audio samples for instruments and drums
- `header-icons/` - SVG icons for the toolbar and UI

Use the smallest path that matches the issue. Example:

- wrong block UI or menu -> `js/block.js`, `js/artwork.js`, relevant file in `js/blocks/`
- wrong block behavior -> relevant file in `js/blocks/` and matching file in `js/turtleactions/`
- execution bug -> `js/logo.js`
- drag/drop or stack behavior -> `js/blocks.js`
- startup or load-order bug -> `js/activity.js`, `js/loader.js`
- palette not showing blocks -> `js/turtledefs.js`, `js/palette.js`
- macro expansion broken -> `js/macros.js`
- cloud save/load issue -> `planet/js/*.js`
- translation missing -> `locales/*.json`
- audio/synthesis bug -> `js/utils/synthutils.js`, `js/turtle-singer.js`
- i18n or language switch -> `js/loader.js`, `js/languagebox.js`

### Global state

Music Blocks uses a singleton `Activity` instance (`globalActivity`) created in
`js/activity.js`. Most subsystems are properties on this object:

- `globalActivity.logo` — the Logo execution engine
- `globalActivity.blocks` — the Blocks workspace manager
- `globalActivity.turtles` — the Turtles container
- `globalActivity.palettes` — the Palettes manager
- `globalActivity.stage` — the EaselJS stage (canvas)

These are wired during `setupDependencies()` and should never be re-instantiated.
Access them through the existing global references or `ActivityContext.getActivity()`.

Do not shadow these names with local variables in the same scope.
Do not create new instances of `Logo`, `Blocks`, `Turtles`, or `Palettes`.

## 2. Fix The Real Problem

**Do not be a lazy AI. Do not hide the symptom and call it fixed.**

- Trace the issue through the real execution path.
- Identify the source of truth and fix the bug there.
- Do not stop at the first patch that makes the current reproduction steps disappear.
- Avoid one-off guards, scattered conditionals, duplicated special cases, and UI-only masking.
- If a temporary workaround is the only safe option, say so explicitly.
- If the bug is not fixed after 2-3 iterations, write console logs to see what is going wrong.

If the issue is already fixed or cannot be reproduced from the current code, tell the user that
clearly instead of forcing a hypothetical patch.

## 3. Keep Changes Surgical

**Minimum code that solves the requested problem. Nothing speculative.**

- Do not add features that were not requested.
- Do not refactor unrelated code.
- Do not "clean up" nearby files just because you are already there.
- Match the existing style and structure of the file you are editing.
- Every changed line should trace back to the issue being solved.

### Commit messages

Use conventional-style prefixes:

- `fix:` — bug fix
- `feat:` — new feature
- `docs:` — documentation only
- `style:` — formatting, no code change
- `refactor:` — code restructuring without behavior change
- `test:` — adding or updating tests
- `ci:` — CI/workflow changes
- `perf:` — performance improvement

Reference related issues: `fix: resolve off-by-one in note duration (Related to #1234)`

Keep the first line under 72 characters. Add a blank line before any extended description.

## 4. Follow Music Blocks Patterns

**This repo has sharp edges. Respect them.**

### Module system

- Main browser code in `js/` uses `sourceType: "script"`, RequireJS, and globals.
- Do not use ES `import` or `export` in main browser source files.
- There is no bundler (no Webpack, no Vite, no Rollup). The browser loads scripts
  via RequireJS (AMD).
- `js/loader.js` defines the RequireJS config: module paths, shims, and the two-phase
  bootstrap sequence. Changing load order here can break startup.
- If adding a new source file, register it in the `js/loader.js` shim config and
  add it to the `MYDEFINES` array in `js/activity.js`.
- Run locally with `npm start` or `npm run serve:dev` (static HTTP server on port 3000).
  There is no transpilation step for development.
- Keep accurate `/* global */` and `/* exported */` headers in browser scripts.
- If a file already uses guarded `module.exports` for Jest, preserve that pattern:
    ```js
    if (typeof module !== "undefined" && module.exports) {
        module.exports = { MyClass, myFunction };
    }
    ```
- `cypress/` is the exception — Cypress tests use `sourceType: "module"` (ES imports
  are OK there).

### Files and naming

- New files need the AGPL license header (see `CONTRIBUTING.md` for the template).
- Never modify `lib/` or `bower_components/`. These contain vendored third-party code
  (jQuery, EaselJS, Tone.js, p5.js, etc.) committed as-is. Never update or re-vendor
  without explicit maintainer approval.
- Do not casually reorder load-sensitive code in `js/activity.js`.
- Do not rename internal block names. Saved projects depend on them.
- Check `.nvmrc` for the expected Node version.

### Block and runtime rules

- `ValueBlock` implementations must return a value from `arg()`.
- `FlowBlock` implementations must return the expected flow result, not implicit `undefined`.
- `Singer.XxxActions` behavior belongs in static action methods.
- New block work may require coordinated updates across definitions, registration, artwork, help
  text, macros, and related mappings.

### Security

- Prefer `textContent` over `innerHTML` when inserting user-visible text.
- When HTML structure is needed, build DOM elements programmatically
  (`document.createElement`) rather than string concatenation into `innerHTML`.
- If dynamic content must be inserted as HTML, sanitize it with
  `escapeHTML()` from `js/utils/utils.js`.
- Never insert unsanitized user input, block names, or project data into `innerHTML`.

### Style

- 4 spaces, `printWidth: 100`
- double quotes
- semicolons
- no trailing commas
- `arrowParens: "avoid"`
- LF line endings
- comments only when they add real value
- See `.prettierrc` and `.editorconfig` for the full configuration.

## 5. Verify Intelligently

**Prove the fix. Do not just hope.**

- For logic bugs, add or update focused Jest coverage when possible.
- Verify the intended fix and the nearest related behavior so the change is not correct only for one narrow case.
- Start with the smallest relevant checks, then broaden if the change is risky.

Standard validation:

- `npm run lint`
- `npx prettier --check .` (only on files you modified)
- `npm test`

### Test file conventions

- Unit tests live in `__tests__/` directories adjacent to source:
    - `js/__tests__/*.test.js` — core module tests
    - `js/blocks/__tests__/*.test.js` — block definition tests
    - `js/turtleactions/__tests__/*.test.js` — turtle action tests
    - `js/widgets/__tests__/*.test.js` — widget tests
    - `planet/js/__tests__/*.test.js` — Planet subsystem tests
- Name test files `<ModuleName>.test.js` matching the source file name.
- Jest runs in `jsdom` environment with a custom `jest.setup.js` that mocks
  `HTMLCanvasElement.getContext`.
- When adding a new testable function, export it through the guarded
  `module.exports` pattern (see §4) and add a corresponding test in the
  nearest `__tests__/` directory.

### Browser testing

Ask the user for a browser check when the change affects UI, widgets, drag/drop, rendering, audio, persistence, startup behavior, or another interaction that tests do not fully cover.

When asking for browser testing, give exact steps:

1. Run `npm run dev` or `npm run serve:dev`
2. Open `http://127.0.0.1:3000`
3. Reproduce the issue with the smallest possible project
4. State the expected result
5. Report any browser console errors if they appear

For pure logic bugs with strong focused tests, do not block on manual browser testing.

## 6. Boundaries

### Always

- Run `npm run lint`, `npx prettier --check .`, and `npm test` before
  proposing a change as complete.
- Include the AGPL license header in every new source file.
- Keep `/* global */` and `/* exported */` comments accurate.
- Match the existing style of the file being edited.

### Ask first

- Modifying `js/loader.js` load order or adding new RequireJS dependencies.
- Changes to `package.json` (dependency versions, new scripts).
- Renaming or restructuring directories.
- Any change that touches more than 3 files across different subsystems.

### Never

- Modify anything in `lib/` or `bower_components/`.
- Use ES `import`/`export` in browser source files under `js/`.
- Rename internal block names (saved projects depend on them).
- Reorder load-sensitive code in `js/activity.js` without understanding
  the RequireJS dependency graph in `js/loader.js`.
- Commit `.env` files, API keys, or credentials.
- Force-push to `master` or other protected branches.

## 7. Report Clearly

**Leave the contributor and reviewer with a clear picture.**

- Say what changed.
- Say how it was verified.
- Say what remains unverified.
- If the current branch already contains the fix, say that plainly.

See also: [CONTRIBUTING.md](CONTRIBUTING.md) for human-facing contribution guidelines.
