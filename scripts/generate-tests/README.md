# Module test-plan extractor

A small, deterministic AST analysis utility. Given a JavaScript source file it
produces a JSON description of what the module exposes and what is therefore
worth testing: exported functions and classes, their parameters, shallow
structural counts (branches, `return`, `throw`), `require`/`import`
dependencies, referenced free identifiers, and leading JSDoc.

This is the **extraction / planning layer only**. It does not generate tests,
call any external service, or run the analysed code.

## Usage

```sh
# Print the plan as JSON
node scripts/generate-tests/cli.js js/utils/utils-logic.js

# Compare against a committed expected plan without writing anything.
# Exit 0 on match, 1 on mismatch. The expected file defaults to the source
# path with `.js` replaced by `.plan.json`; an explicit path may be given.
node scripts/generate-tests/cli.js path/to/module.js --check
node scripts/generate-tests/cli.js path/to/module.js --check path/to/expected.json
```

## Files

| File                  | Responsibility                                                                        |
| --------------------- | ------------------------------------------------------------------------------------- |
| `extract-module.js`   | Reads a file, parses it with the vendored Acorn (`lib/acorn.min.js`), returns a plan. |
| `module-test-plan.js` | Pure AST walker that builds the plan structure.                                       |
| `cli.js`              | Command-line wrapper, including `--check`.                                            |
| `__tests__/`          | Jest tests plus fixtures and their committed `.plan.json` plans.                      |

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
