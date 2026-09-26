# Module test-plan extractor and test-generation bridge

New to this tool? Jump to [Contributor workflow](#contributor-workflow) for a
five-minute walkthrough built around `npm run generate-tests`, finishing with
`npx jest` on the file it writes.

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
    -> review report             (review-report.js: ACCEPTED / WARNING / REJECTED)
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

## Contributor workflow

You do not need to know the AST internals to use this tool. The diagram below
is the complete pipeline, run through `npm run generate-tests -- <options>`;
a given invocation only executes the stages its mode calls for - `--generate`
stops before validation, `--emit` without `--write` stops before writing, and
only `--emit --write` performs the final write:

```text
module
  ↓
AST extraction        (extract-module.js / module-test-plan.js - read & parse only)
  ↓
ModuleTestPlan         (JSON: exports, functions, classes, dependencies, ...)
  ↓
candidate generation   (llm-client.js - offline, credential-free providers only)
  ↓
static validation      (validate-generated.js - parses the candidate, never runs it)
  ↓
review report          (review-report.js - ACCEPTED / WARNING / REJECTED, with reasons)
  ↓
human review           (you - read the report and the candidate before trusting either)
  ↓
write                  (write-generated.js - one path, never overwrites; --write only)
  ↓
Jest                   (npm test - the candidate becomes a real test only once it runs green)
```

**Generate → Validate → Review → Write → Run Jest**, in the order they actually
run (validation happens before the report is built, since the report only
describes what the validator already decided):

- **Generate** - a provider (`llm-client.js`) turns the plan into one candidate
  test, as an in-memory string. Nothing is checked yet.
- **Validate** - `validate-generated.js` parses that string and returns
  `{ valid, errors, warnings }`. This is the only place any safety rule is
  decided; every later stage only reads this result.
- **Review** - `review-report.js` turns the plan and the validation result into
  a small report: what was discovered in the module, the candidate's status
  (`ACCEPTED`, `WARNING` or `REJECTED`), the validator's own reasons, and the
  path a write would use. It never re-validates or second-guesses the
  validator. `--emit` prints this report and stops - no file is touched.
- **Write** - only `--emit --write` reaches this stage, and only for an
  `ACCEPTED` or `WARNING` candidate; `write-generated.js` writes the single
  deterministic path described above and never overwrites an existing file. A
  `REJECTED` candidate is never written, with or without `--write`.
- **Run Jest** - `npx jest <path>` on the file that was written. This is the
  only stage that ever actually executes generated code.

A **generated test is a candidate**, not a finished test: it is a syntactically
valid, heuristically-screened starting point for a human to read, edit and run.
Nothing in this pipeline promises the candidate is _correct_ - only that it is
safe to look at and, once you accept it, safe to add to the repository at a
single predictable path.

**Why the validator never executes the candidate.** Running arbitrary
generated code - even to "just see if it passes" - would mean executing
untrusted output on your machine and against the real module. The validator
is a static, heuristic filter instead: it parses the candidate and rejects
known-unsafe or known-meaningless _patterns_ (filesystem access, mocking the
module under test, disallowed imports, no-op assertions, ...). See
[Validation and safe writing](#validation-and-safe-writing) below for the full
rule list and its limits - it is a filter, not a sandbox. The only thing that
ever actually _runs_ a generated test is `npm test`, on a file you have
already read.

Five commands cover the whole workflow for one module:

```sh
# 1-2. Select a module and inspect what the AST pipeline discovered.
npm run generate-tests -- --module js/utils/utils-logic.js

# 3-4. Generate a candidate and see it, unvalidated, for a quick look.
npm run generate-tests -- --module js/utils/utils-logic.js --generate

# 5. Review: generate + validate, with no file written. Prints a review report
#    - what the plan discovered, the candidate's status (ACCEPTED / WARNING /
#    REJECTED, with the validator's own reasons), and the exact path a write
#    would use. See "Example review report" below.
npm run generate-tests -- --module js/utils/utils-logic.js --emit

# 6. Write: only after you are satisfied with the report above. Still fails
#    (and writes nothing) if the candidate was rejected, or if a file already
#    exists at the target path.
npm run generate-tests -- --module js/utils/utils-logic.js --emit --write

# 7. The written file is a normal Jest spec - read it, then run it for real.
npx jest js/utils/__tests__/utils-logic.generated.test.js
```

**Example review report.** `NoopClient`'s placeholder candidate only asserts
that the module imported successfully, which the validator correctly treats
as a meaningless assertion - so a fresh `--emit` on a real module is rejected
out of the box, and this is exactly what that looks like:

```text
$ npm run generate-tests -- --module js/utils/utils-logic.js --emit
review report: js/utils/utils-logic.js
discovered: 28 export(s), 28 function(s), 0 class(es)
candidate 1 (provider: noop): REJECTED
  reasons:
    - contains no meaningful assertions (only literal-vs-literal checks such as expect(true).toBe(true), or bare existence checks on the import)
  path: js/utils/__tests__/utils-logic.generated.test.js
summary: 0 accepted, 0 warning, 1 rejected (of 1)
note: validation is static and heuristic, not proof of correctness; an ACCEPTED or WARNING candidate still needs a human read before it is trusted, and must be run with Jest after writing
```

(`invalid: ...` and the final `candidate rejected; nothing written` line are
printed separately, to stderr.) A candidate with a real assertion but, say, an
uncontrolled `new Date()` would show `candidate 1 (provider: ...): WARNING`
with a `warnings:` list instead of `reasons:` - still safe to write, but worth
reading before you do. An `ACCEPTED` candidate prints only its status and
path: no `reasons:` or `warnings:` block, because it has none.

`--module <path>` and a bare positional path (`... cli.js js/utils/x.js`) are
equivalent ways to select the module; use whichever reads more clearly, but
not both in the same command. `node scripts/generate-tests/cli.js --help`
prints this same summary from the terminal.

**Safety guarantees you can rely on, end to end:**

- the target module is only ever read and parsed - never required, imported,
  or executed, at any stage, with or without `--module`;
- a REJECTED candidate is never written, `--write` or not - see
  [Validation and safe writing](#validation-and-safe-writing);
- the writer creates exactly one deterministic path per module and refuses to
  overwrite an existing file there, generated or hand-written;
- nothing is written anywhere until you explicitly pass `--emit --write`.

This tool intentionally generates tests for **one module at a time**, on
request. It does not scan the repository, does not run automatically, and
does not modify any existing test file - see
[Deliberate limitations](#deliberate-limitations) for the rest of what is out
of scope by design.

## Usage

```sh
# Print the plan as JSON
node scripts/generate-tests/cli.js js/utils/utils-logic.js
node scripts/generate-tests/cli.js --module js/utils/utils-logic.js

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

# Generate a candidate, validate it, and print a review report: status
# (ACCEPTED / WARNING / REJECTED, with reasons), and the exact path the safe
# writer would use. Nothing is written without --write; a REJECTED candidate
# is reported and the command exits non-zero.
node scripts/generate-tests/cli.js js/utils/utils-logic.js --emit
node scripts/generate-tests/cli.js js/utils/utils-logic.js --emit --write
```

`--check`, `--prompt`, `--generate` and `--emit` are mutually exclusive;
`--write` only applies together with `--emit`. The module may be given as a
bare positional path or as `--module <path>` (equivalent; combining both is a
deterministic argument error). `node cli.js --help` prints the same summary.

`--generate` vs `--emit` (easy to confuse):

|              | `--generate`                       | `--emit`                                                              |
| ------------ | ---------------------------------- | --------------------------------------------------------------------- |
| output       | raw candidate **source** to stdout | a **review report**: status + reasons, and the path a write would use |
| validation   | none                               | full `validateGeneratedTest`, summarised by `review-report.js`        |
| exit code    | 0 unless the provider errors       | 1 if the candidate is REJECTED                                        |
| touches disk | never                              | only with `--emit --write`, and only an ACCEPTED/WARNING candidate    |

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
const { buildReviewReport, formatReviewReport } = require("./review-report");

const plan = extractFile("js/utils/utils-logic.js");
const prompt = buildPromptFromPlan(plan); // string, deterministic

// Full pipeline, defaulting to the NoopClient:
const { request, prompt: p, source, meta } = await generateTests(plan);

// Bring your own provider (any object with `name` and `generate(request)`):
await generateTests(plan, { client: myClient });
await generateTests(plan, { provider: "manual", clientOptions: { responses } });

// Validate a candidate against the plan, then build a review report from the
// result - the report never re-validates, it only reads what the validator
// already decided.
const result = validateGeneratedTest(source, { plan });
// -> { valid, errors: [...], warnings: [...], modulePath }

const outPath = generatedTestPathFor(plan.file);
const report = buildReviewReport(plan, [{ provider: "noop", validation: result, outPath }]);
// -> { module, discovered, candidates: [{ status: "ACCEPTED"|"WARNING"|"REJECTED", ... }], summary }

console.log(formatReviewReport(report)); // deterministic text, for a terminal

if (report.candidates[0].status !== "REJECTED") {
    const { written, path } = writeGeneratedTest(source, { plan }); // or { dryRun: true }
}
```

## Files

| File                    | Responsibility                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `extract-module.js`     | Reads a file, parses it with the vendored Acorn (`lib/acorn.min.js`), returns a plan.                 |
| `module-test-plan.js`   | Pure AST walker that builds the plan structure.                                                       |
| `generation-request.js` | Turns a plan into a structured `{ module, plan, instructions, ... }` request.                         |
| `prompt-builder.js`     | Renders a request as one deterministic prompt string.                                                 |
| `llm-client.js`         | Provider seam: `NoopClient`, `ManualClient`, `createClient`, `generateTests`.                         |
| `validate-generated.js` | Deterministic safety checks on a generated candidate; returns `{ valid, errors, warnings }`.          |
| `review-report.js`      | Turns a plan + validation result(s) into a deterministic ACCEPTED/WARNING/REJECTED report; no I/O.    |
| `write-generated.js`    | Safe writer: one deterministic `*.generated.test.js` path, never overwrites, no traversal.            |
| `cli.js`                | Command-line wrapper: `--module`/positional, `--check`, `--prompt`, `--generate`, `--emit [--write]`. |
| `__tests__/`            | Jest tests plus fixtures and their committed `.plan.json` plans.                                      |

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

## Review report

**`buildReviewReport(plan, candidates)`** turns a plan and one or more
already-computed `validateGeneratedTest` results into a small, deterministic
object:

```js
{
  module: "js/utils/utils-logic.js",
  discovered: { exports: [...], functions: [...], classes: [...] },
  candidates: [
    { index, provider, status, errors, warnings, outPath, wouldWrite }
  ],
  summary: { total, accepted, warning, rejected }
}
```

`status` is exactly one of three values, derived only from the validation
result already passed in - `review-report.js` never parses or re-checks the
candidate itself:

- **`REJECTED`** - `validation.errors` is non-empty. `errors` on the candidate
  is that list, verbatim; never written, `--write` or not.
- **`WARNING`** - `errors` is empty but `validation.warnings` is not. Still
  safe to write - a warning never silently becomes a rejection.
- **`ACCEPTED`** - both lists are empty.

**`formatReviewReport(report)`** renders that object as the plain text `--emit`
prints (see [Example review report](#contributor-workflow) above): the module,
what was discovered, one block per candidate with its status and the
validator's own reasons/warnings, a summary count, and a fixed one-line
reminder - **validation is static and heuristic, not proof of correctness; an
ACCEPTED or WARNING candidate still needs a human read before it is trusted,
and must be run with Jest after writing.**

Both functions are pure: no file or network access at call time, and the same
inputs always produce the same output, in the order the candidates were
supplied. `--emit` builds the report from exactly the `validateGeneratedTest`
result it already computed - the report is a view over that result, not a
second opinion.

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

## Choosing modules for generated-test assistance

Pure utility modules under `js/utils/` are a good starting point for this
pipeline: they are stateless, take primitive inputs, and return primitive
outputs, so a candidate is easy to both generate a prompt for and judge on
review. That does not make the pipeline utility-only, and it should not be
used to justify generating tests for every module in the repository.

The extractor is useful anywhere a module exposes deterministic, inspectable
behaviour, including outside `js/utils/`. Before pointing it at a non-utility
module, run the same inspection the contributor workflow above describes
(`--module`, then `--emit` for a dry run) and weigh the exports against the
project's usual line: functions that are pure given their arguments, don't
reach into DOM/canvas/`createjs` state, don't depend on Tone.js or timing, and
don't require a live `activity`/`logo`/widget instance to call meaningfully
are good fits. A class or function that only makes sense wired into the
running application's lifecycle is not — write that test by hand against a
real or minimally-mocked instance instead, the way the integration-phase
tests under `js/__tests__/` already do.

A generated candidate is a starting point regardless of which kind of module
it targets, and with no model-backed provider configured it is rejected on
`--emit` by default — see [Example review report](#contributor-workflow)
above for what that looks like and why it's expected. From there:

- Turn the placeholder's `it.todo` lines into real assertions by hand, using
  the module's own documented contract (a header comment, a JSDoc block, an
  inline comment explaining a fallback) or an external, independently-known
  reference (a fixed table of values, a documented ordering) to ground the
  expected value — never the target function's own formula fed back at
  itself.
- Skip branches that are only reachable in an environment the test runner
  can't represent (for example, a `typeof window === "undefined"` fallback
  under Jest's jsdom environment) rather than forcing coverage of them.

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
