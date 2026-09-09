# Module test-plan extractor and test-generation bridge

A small, deterministic AST analysis utility. Given a JavaScript source file it
produces a JSON description of what the module exposes and what is therefore
worth testing: exported functions and classes, their parameters, shallow
structural counts (branches, `return`, `throw`), `require`/`import`
dependencies, referenced free identifiers, and leading JSDoc.

On top of that plan sits a **generation layer** that turns a plan into a
structured, deterministic request and finally a prompt string for a future
test-generation provider:

```sh
source file
    -> AST extractor            (extract-module.js / module-test-plan.js)
    -> ModuleTestPlan            (JSON)
    -> generation request       (generation-request.js)
    -> deterministic prompt      (prompt-builder.js)
    -> provider                  (llm-client.js: NoopClient / ManualClient / ...)
    -> generated Jest test       (in-memory string)
    -> validator                 (validate-generated.js: { valid, errors, warnings })
    -> safe writer               (write-generated.js -> *.generated.test.js)
```

The extractor reads and parses the analysed source but never executes it. The
generation layer does not read source files, write to the source tree, require a
credential, or make a network call. The only providers shipped are credential-free
(`noop`, `manual`); a real model-backed provider is left for a later change and
would be a new class in `llm-client.js` only.

The **validator** and **safe writer** are the deterministic safety layer between
a generated string and the repository. A candidate that fails validation never
reaches the writer; the writer itself only ever creates a single, predictable
file inside the module's own `__tests__/` directory and never overwrites
anything. `write-generated.js` is the only file here that touches the
filesystem, and only under the guards described below.

## Usage

```sh
# Print the plan as JSON
node scripts/generate-tests/cli.js js/utils/utils-logic.js

# Compare against a committed expected plan without writing anything.
# Exit 0 on match, 1 on mismatch. The expected file defaults to the source
# path with `.js` replaced by `.plan.json`; an explicit path may be given.
node scripts/generate-tests/cli.js path/to/module.js --check
node scripts/generate-tests/cli.js path/to/module.js --check path/to/expected.json

# Print the deterministic test-generation prompt for a module.
node scripts/generate-tests/cli.js js/utils/utils-logic.js --prompt

# Run the generation pipeline through a credential-free provider and print the
# candidate test source (nothing is written to disk).
node scripts/generate-tests/cli.js js/utils/utils-logic.js --generate
node scripts/generate-tests/cli.js js/utils/utils-logic.js --generate=manual

# Generate a candidate, validate it, and report the exact path the safe writer
# would use. Nothing is written without --write; a candidate that fails
# validation is reported and the command exits non-zero.
node scripts/generate-tests/cli.js js/utils/utils-logic.js --emit
node scripts/generate-tests/cli.js js/utils/utils-logic.js --emit --write
```

`--check`, `--prompt`, `--generate` and `--emit` are mutually exclusive;
`--write` only applies together with `--emit`. `node cli.js --help` prints the
same summary.

`--generate` vs `--emit` (easy to confuse):

|              | `--generate`                       | `--emit`                                               |
| ------------ | ---------------------------------- | ------------------------------------------------------ |
| output       | raw candidate **source** to stdout | a one-line **verdict** + the path the writer would use |
| validation   | none                               | full `validateGeneratedTest`                           |
| exit code    | 0 unless the provider errors       | 1 if the candidate is invalid                          |
| touches disk | never                              | only with `--emit --write`, and only a valid candidate |

Use `--generate` to eyeball what a provider produced; use `--emit` to see
whether that output is safe to keep, and `--emit --write` to actually keep it.

## Programmatic API

```js
const { extractFile } = require("./extract-module");
const { buildGenerationRequest } = require("./generation-request");
const { buildPrompt, buildPromptFromPlan } = require("./prompt-builder");
const { generateTests, createClient, NoopClient, ManualClient } = require("./llm-client");
const { validateGeneratedTest } = require("./validate-generated");
const { writeGeneratedTest, generatedTestPathFor } = require("./write-generated");

const plan = extractFile("js/utils/utils-logic.js");
const prompt = buildPromptFromPlan(plan); // string, deterministic

// Full pipeline, defaulting to the NoopClient:
const { request, prompt: p, source, meta } = await generateTests(plan);

// Bring your own provider (any object with `name` and `generate(request)`):
await generateTests(plan, { client: myClient });
await generateTests(plan, { provider: "manual", clientOptions: { responses } });

// Validate a candidate against the plan, then write it only if it is valid.
const result = validateGeneratedTest(source, { plan });
// -> { valid, errors: [...], warnings: [...], modulePath }

if (result.valid) {
    const { written, path } = writeGeneratedTest(source, { plan }); // or { dryRun: true }
}
```

## Files

| File                    | Responsibility                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| `extract-module.js`     | Reads a file, parses it with the vendored Acorn (`lib/acorn.min.js`), returns a plan.        |
| `module-test-plan.js`   | Pure AST walker that builds the plan structure.                                              |
| `generation-request.js` | Turns a plan into a structured `{ module, plan, instructions, ... }` request.                |
| `prompt-builder.js`     | Renders a request as one deterministic prompt string.                                        |
| `llm-client.js`         | Provider seam: `NoopClient`, `ManualClient`, `createClient`, `generateTests`.                |
| `validate-generated.js` | Deterministic safety checks on a generated candidate; returns `{ valid, errors, warnings }`. |
| `write-generated.js`    | Safe writer: one deterministic `*.generated.test.js` path, never overwrites, no traversal.   |
| `cli.js`                | Command-line wrapper: `--check`, `--prompt`, `--generate`, `--emit [--write]`.               |
| `__tests__/`            | Jest tests plus fixtures and their committed `.plan.json` plans.                             |

## Generation layer

- **`buildGenerationRequest(plan, options)`** produces a plain object holding a
  normalized copy of the plan, a module summary, and three fixed lists:
  `instructions` (what to generate), `testRequirements` (shape of the tests) and
  `conventions` (how this repo writes tests). A partial or hand-written plan is
  tolerated - missing lists become empty. Each list can be overridden through
  `options`.
- **`buildPrompt(request)`** is pure text formatting. Every list it prints is
  already sorted by the extractor, so the same request always yields the same
  string (ending in a single newline).
- **Providers** are any object exposing `name` and
  `generate(request) -> { source, meta }` (sync or async). `NoopClient` returns
  a syntactically valid Jest skeleton (`it.todo` per export, parse-checked in
  the tests); `ManualClient` returns a
  pre-registered response or the prompt wrapped in a comment. `createClient`
  throws a clear error for a named-but-unimplemented provider (`openai`, ...).
- The prompt instructs a generator to test **observable behaviour** through the
  public API, not to emit a test per AST node, not to mock the module under
  test, and never to emit code that writes to disk.

## Validation and safe writing

**`validateGeneratedTest(source, { plan, modulePath, existingTitles, allowedGlobals, allowedModules })`**
parses the candidate with the vendored Acorn and returns
`{ valid, errors, warnings, modulePath }`. It never executes the candidate,
never reads the module under test, and never touches the filesystem. The same
inputs always produce the same result.

It is a **static, heuristic filter**, not a JavaScript security sandbox: it
rejects the known-unsafe and known-meaningless _patterns_ listed below, but it
cannot catch a construct it has no rule for, and code that only does its damage
at runtime will pass the parse-only check. Access through a **string literal**
is covered (`fs["writeFileSync"]`, `require("fs")`), but **fully dynamic**
access - a method name or module specifier held in a variable, `eval`,
`Function(...)` - is out of scope. The concrete "a bad string cannot corrupt the
repo" guarantee comes from the writer (one deterministic path, `wx` create), not
from this list.

A candidate is **rejected** (an `error`) when it:

- does not parse as JavaScript, or is empty;
- declares no `it()`/`test()` case, or contains no `expect()` assertion;
- does not `require`/`import` the real module the plan describes;
- `jest.mock`s / `doMock`s / `setMock`s the module under test;
- `require`s / `import`s **anything other than the module under test** - a
  relative path to another file, _or a bare package specifier_ - unless it is
  listed in `options.allowedModules`. Bare package imports are not trusted: an
  installed package is opaque to every rule below;
- `require`s `fs`/`fs-extra` or `child_process`/`worker_threads` (these can
  never be allow-listed);
- uses an unsafe filesystem call (`writeFileSync`, `rmSync`, `mkdtempSync`, ...),
  including computed `obj["writeFileSync"]` access;
- assigns `module.exports` / `exports.*` (a test must not add exports anywhere);
- reaches into `_`-prefixed private members (member access, computed
  `obj["_x"]`, or destructuring);
- has only meaningless assertions - literal-vs-equal-literal
  (`expect(true).toBe(true)`), bare existence checks on the import
  (`expect(target).toBeDefined()`), or only `toMatchSnapshot()`;
- uses `Math.random` with no `jest.spyOn`/stub, or `setTimeout`/`setInterval`
  with no `jest.useFakeTimers()`;
- references an undeclared global from another subsystem;
- duplicates a test title (full `describe › it` path) within the file or against
  the supplied `existingTitles`.

`warnings` (non-blocking) cover an uncontrolled `Date.now()` / `new Date()` and a
`describe` title that names a different module file.

**Allow-lists.** `options.allowedGlobals` (undeclared identifiers) and
`options.allowedModules` (extra `require`/`import` specifiers) are the only
escape hatches. For globals the effective list is three tiers:

1. the fixed JS / Node / Jest / jsdom surface (`ALLOWED_GLOBALS` in
   `validate-generated.js`);
2. the module's own `plan.referencedGlobals` - the module under test already
   depends on these, so its test legitimately may too;
3. `options.allowedGlobals` - an explicit, per-call escape hatch.

Widening either list only ever permits the named identifier / specifier. It does
**not** disable any other rule: an aliased `writeFileSync`, `Math.random`, a
bare timer, `fs`, `child_process` and so on are still caught by their own checks.
Both lists are **trusted configuration supplied by the calling code** - they
must never be derived from the candidate string or from provider output, or the
thing being validated could widen its own allow-list.

**`writeGeneratedTest(source, { plan, dryRun, cwd, existingTitles, allowedGlobals, allowedModules })`**
resolves the deterministic output path first (so a malformed module path fails
fast and every result still reports the path that _would_ be used), then
validates, and only when the candidate is valid calls the safe writer. The
writer:

- writes exactly one path -
  `<dir>/__tests__/<module>.generated.test.js` - derived deterministically from
  the plan's module path;
- refuses an absolute module/output path, any `..` traversal, a path outside a
  `__tests__/` directory, and any path not ending in `.generated.test.js`
  (`assertSafeTestPath`, lexical);
- before writing, resolves the real path of the nearest existing ancestor and
  refuses it if a symlink there escapes the repository
  (`assertRealContainment`);
- never overwrites an existing file: the create uses the `wx` open flag, which
  fails atomically if the path exists - there is no preceding `stat` to race -
  so a hand-written `<module>.test.js` or a previous generated run is always
  safe;
- creates the `__tests__/` directory only when it is missing;
- always reports the exact repo-relative path, and writes nothing under
  `dryRun`.

## What is extracted

- **exports** – `module.exports = <object>` (directly or through one identifier)
  is expanded one level into its members; `exports.x = ...`, direct
  class/function assignment, and ES module `export` forms are also recognised.
  Each entry carries `name`, `kind` (`function` / `class` / `object` / `value`),
  and – for functions – `params` and `arity`, or – for classes – `methods` and
  `superClass`.
- **functions** / **classes** – every top-level declaration, with per-function
  branch / `return` / `throw` counts (not descending into nested functions) and
  per-class method descriptions (constructor, methods, accessors, `static`).
- **dependencies** – string arguments to `require(...)` and `import`/`export`
  sources.
- **referencedGlobals** – identifiers used in a value position that are not bound
  anywhere in the file.
- **jsdoc** – `/** ... */` blocks that sit directly above a declaration, split
  into a description and a flat list of `@tag` entries. A class member's `target`
  is qualified with the class name (`Counter.tick`); a bare `target` is a
  top-level function, class or variable.
- **totals** – whole-file branch / `return` / `throw` counts.

`branches` (per-function and in `totals`) is a rough syntactic count – `if`,
conditional expression, each `&&` / `||` / `??`, and each non-default `switch`
case. It is **not** cyclomatic complexity or branch coverage: `a && b && c`
counts as two and loops are not counted.

## Deliberate limitations

- Everything is derived syntactically. The target file is never required,
  imported, executed or written to.
- Parsing uses the vendored Acorn (8.14.1) with `ecmaVersion: 2020`, matching the
  rest of the repository. Syntax newer than that is a parse error.
- `referencedGlobals` is name-based, not scope-accurate: a name bound anywhere in
  the file is treated as bound everywhere, so a global shadowed elsewhere may be
  omitted. Dependency detection uses the same heuristic to ignore a locally
  declared `require`.
- CommonJS exports are detected only at module scope (including the usual
  `if (typeof module !== "undefined" ...)` guard). `module.exports = ...` inside
  a nested function is ignored. Conditional or computed exports are not resolved.
- Parse errors are reported with the filename attached and never modify anything.
