/**
 * @license
 * MusicBlocks v3.7.1
 * Copyright (C) 2026 Sugar Labs
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Command-line entry point for the deterministic module test-plan extractor
 * and test-generation bridge. A "module" here is the one production source
 * file you want candidate Jest tests for; select it either as a bare
 * positional argument or with `--module <path>` (the two are equivalent -
 * use whichever reads more clearly, but not both at once).
 *
 *   node scripts/generate-tests/cli.js path/to/module.js
 *   node scripts/generate-tests/cli.js --module path/to/module.js
 *       Prints the module test plan as JSON to stdout: what the AST pipeline
 *       discovered (exports, functions, classes, dependencies, ...).
 *
 *   ... --check [expected.json]
 *       Compares the freshly generated plan against a committed expected plan
 *       without writing anything. Exits 0 when they match, 1 when they differ.
 *       The expected file defaults to the source path with `.js` replaced by
 *       `.plan.json`.
 *
 *   ... --prompt
 *       Prints the deterministic test-generation prompt for the module. No
 *       provider is invoked.
 *
 *   ... --generate[=provider]
 *       Runs the generation pipeline through a credential-free provider
 *       ("noop" by default, or "manual") and prints the raw candidate test
 *       source to stdout. Nothing is written to disk and no network call is
 *       made. Use this to eyeball a candidate before validating it.
 *
 *   ... --emit[=provider] [--write]
 *       Generates one candidate, runs it through the deterministic validator
 *       (./validate-generated.js), and reports a summary: the module, how
 *       many exports/functions/classes the plan found, whether the candidate
 *       was accepted or rejected (with reasons), and the exact path the safe
 *       writer would use. This is the dry-run / preview step - without
 *       --write nothing is ever written. With --write, a valid candidate is
 *       written to `<dir>/__tests__/<module>.generated.test.js` (an existing
 *       file - generated or hand-written - is never overwritten). Exits
 *       non-zero when the candidate is invalid or cannot be written.
 *
 * Every mode above only reads and parses the target file; only `--emit
 * --write` touches disk, and only to add the one file described above. The
 * target module is never required, imported or executed.
 */

const fs = require("fs");
const path = require("path");
const { extractFile, stringifyPlan } = require("./extract-module");
const { buildGenerationRequest } = require("./generation-request");
const { buildPrompt } = require("./prompt-builder");
const { createClient } = require("./llm-client");
const { validateGeneratedTest } = require("./validate-generated");
const { writeGeneratedTest, generatedTestPathFor } = require("./write-generated");

const USAGE =
    "usage: node scripts/generate-tests/cli.js (<module.js> | --module <module.js>) " +
    "[--check [expected.json] | --prompt | --generate[=provider] | --emit[=provider] [--write]]";

const HELP = [
    USAGE,
    "",
    "What this is: a deterministic, offline pipeline that reads one JavaScript",
    'module, describes what it exports (a "module test plan"), and can turn',
    "that plan into a candidate Jest test - a *starting point* for a real test,",
    "never a finished one. Every candidate is statically validated before it can",
    "be written, and nothing is ever written without --emit --write.",
    "",
    "select a module (pick one form):",
    "  <module.js>          positional argument, e.g. js/utils/example.js",
    "  --module <module.js> equivalent explicit form; cannot be combined with",
    "                       the positional form",
    "",
    "modes (mutually exclusive; default is the plan below):",
    "  (none)              print the module test plan as JSON: exports, functions,",
    "                      classes, dependencies - what the AST pipeline discovered",
    "  --check [file]      compare the plan against a committed expected plan; exit 1 on mismatch",
    "  --prompt            print the deterministic generation prompt; no provider is run",
    "  --generate[=prov]   run the pipeline through a provider and print the RAW candidate source.",
    "                      No validation, no file path, nothing written. For eyeballing output.",
    "  --emit[=prov]       generate one candidate, VALIDATE it, and print a summary: module,",
    "                      exports/functions/classes considered, accepted/rejected (with reasons",
    "                      when rejected), and the exact path the safe writer would use.",
    "                      This is the dry-run / preview step - nothing is written yet.",
    "                      Exit 1 if the candidate is invalid.",
    "    --write           with --emit only: actually write a valid candidate to",
    "                      <dir>/__tests__/<module>.generated.test.js. Never overwrites an",
    "                      existing file (generated or hand-written), never traverses out of",
    "                      the module's own __tests__/ directory.",
    "",
    'provider is "noop" (default) or "manual"; both are credential-free and offline.',
    "",
    "safety restrictions (cannot be bypassed by --module or any other option):",
    "  - the target module is only ever read and parsed, never required or executed;",
    "  - a candidate that fails static validation is never written, with --write or without;",
    "  - the writer creates exactly one path per module and refuses to overwrite it;",
    "  - a generated test is a CANDIDATE - always read it before trusting it, and run it",
    "    with the normal `npm test` before relying on it.",
    "",
    "example - inspect, preview, then keep a candidate for one module:",
    "  npm run generate-tests -- --module js/utils/utils-logic.js",
    "  npm run generate-tests -- --module js/utils/utils-logic.js --emit",
    "  npm run generate-tests -- --module js/utils/utils-logic.js --emit --write"
].join("\n");

/**
 * Parses argv into `{ file, check, expected, ... }`. The module may be given
 * as a bare positional argument or as `--module <path>` / `--module=<path>` -
 * both populate the same `file` field; supplying both is a conflict error.
 *
 * @param {string[]} argv - arguments after `node cli.js`.
 * @returns {{ file: string, check: boolean, expected: string|null }}
 */
function parseArgs(argv) {
    let file = null;
    let moduleOption = null;
    let check = false;
    let expected = null;
    let prompt = false;
    let generate = null;
    let emit = null;
    let write = false;

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === "--module") {
            const next = argv[i + 1];
            if (!next || next.startsWith("--")) {
                throw new Error("--module requires a path, e.g. --module js/utils/example.js");
            }
            moduleOption = next;
            i += 1;
        } else if (arg.startsWith("--module=")) {
            moduleOption = arg.slice("--module=".length);
            if (moduleOption === "") throw new Error("--module= requires a path");
        } else if (arg === "--write") {
            write = true;
        } else if (arg === "--emit") {
            emit = "noop";
        } else if (arg.startsWith("--emit=")) {
            emit = arg.slice("--emit=".length);
            if (emit === "") throw new Error("--emit= requires a provider name");
        } else if (arg === "--check") {
            check = true;
            const next = argv[i + 1];
            if (next && !next.startsWith("--")) {
                expected = next;
                i += 1;
            }
        } else if (arg.startsWith("--check=")) {
            check = true;
            expected = arg.slice("--check=".length);
            if (expected === "") throw new Error("--check= requires a path");
        } else if (arg === "--prompt") {
            prompt = true;
        } else if (arg === "--generate") {
            generate = "noop";
        } else if (arg.startsWith("--generate=")) {
            generate = arg.slice("--generate=".length);
            if (generate === "") throw new Error("--generate= requires a provider name");
        } else if (arg === "--help" || arg === "-h") {
            process.stdout.write(HELP + "\n");
            process.exit(0);
        } else if (arg.startsWith("--")) {
            throw new Error(`unknown option: ${arg} (run --help for the list of options)`);
        } else if (file === null) {
            file = arg;
        } else {
            throw new Error(
                `unexpected argument: ${arg} (module already set to "${file}"; ` +
                    "pass only one module path)"
            );
        }
    }

    if (moduleOption !== null) {
        if (file !== null) {
            throw new Error(
                `cannot combine a positional module path ("${file}") with --module ` +
                    `("${moduleOption}"); pass the module once, either way`
            );
        }
        file = moduleOption;
    }

    if (!file) throw new Error(USAGE);
    const modes = [check, prompt, generate !== null, emit !== null].filter(Boolean).length;
    if (modes > 1) {
        throw new Error("--check, --prompt, --generate and --emit are mutually exclusive");
    }
    if (write && emit === null) throw new Error("--write only applies together with --emit");
    return { file, check, expected, prompt, generate, emit, write };
}

/**
 * @param {string} sourcePath - the analysed source file.
 * @param {string|null} explicit - an explicit expected-plan path, if given.
 * @returns {string}
 */
function expectedPathFor(sourcePath, explicit) {
    if (explicit) return explicit;
    return sourcePath.replace(/\.js$/, "") + ".plan.json";
}

/**
 * Runs the CLI.
 *
 * @param {string[]} argv - arguments after `node cli.js`.
 * @returns {number} process exit code.
 */
function main(argv) {
    let args;
    try {
        args = parseArgs(argv);
    } catch (err) {
        process.stderr.write(err.message + "\n");
        return 2;
    }

    let plan;
    try {
        plan = extractFile(args.file);
    } catch (err) {
        process.stderr.write(err.message + "\n");
        return 1;
    }

    if (args.prompt) {
        process.stdout.write(buildPrompt(buildGenerationRequest(plan)));
        return 0;
    }

    if (args.generate !== null) {
        let client;
        try {
            client = createClient(args.generate);
        } catch (err) {
            process.stderr.write(err.message + "\n");
            return 1;
        }
        const request = buildGenerationRequest(plan);
        let result;
        try {
            result = client.generate(request);
        } catch (err) {
            process.stderr.write(err.message + "\n");
            return 1;
        }
        process.stdout.write(result.source);
        return 0;
    }

    if (args.emit !== null) {
        let client;
        try {
            client = createClient(args.emit);
        } catch (err) {
            process.stderr.write(err.message + "\n");
            return 1;
        }

        // Generation and the deterministic output-path derivation can both throw
        // (a provider error, or a `plan.file` that resolves outside the repo);
        // convert either into the CLI's numeric failure contract.
        let source;
        let outPath;
        try {
            source = client.generate(buildGenerationRequest(plan)).source;
            outPath = generatedTestPathFor(plan.file);
        } catch (err) {
            process.stderr.write(err.message + "\n");
            return 1;
        }
        const validation = validateGeneratedTest(source, { plan });

        // Dry-run / preview summary: printed for both --emit and --emit --write,
        // so a contributor sees the same picture of what the pipeline found and
        // decided before anything is ever written.
        process.stdout.write(
            `module: ${plan.file} ` +
                `(exports: ${plan.exports.length}, functions: ${plan.functions.length}, ` +
                `classes: ${plan.classes.length})\n` +
                `provider: ${args.emit}; candidates generated: 1, ` +
                `accepted: ${validation.valid ? 1 : 0}, rejected: ${validation.valid ? 0 : 1}\n`
        );

        for (const warning of validation.warnings) {
            process.stderr.write(`warning: ${warning}\n`);
        }
        if (!validation.valid) {
            for (const error of validation.errors) {
                process.stderr.write(`invalid: ${error}\n`);
            }
            process.stderr.write(
                `${plan.file}: candidate rejected; nothing written (intended path: ${outPath})\n`
            );
            return 1;
        }

        if (!args.write) {
            process.stdout.write(
                `${plan.file}: candidate is valid; would write ${outPath} ` +
                    "(pass --write to create it)\n"
            );
            return 0;
        }

        let outcome;
        try {
            outcome = writeGeneratedTest(source, { plan });
        } catch (err) {
            process.stderr.write(err.message + "\n");
            return 1;
        }
        if (!outcome.written) {
            process.stderr.write(`${plan.file}: not written\n`);
            return 1;
        }
        process.stdout.write(`${plan.file}: wrote ${outcome.path}\n`);
        return 0;
    }

    const generated = stringifyPlan(plan);

    if (!args.check) {
        process.stdout.write(generated);
        return 0;
    }

    const expectedPath = expectedPathFor(args.file, args.expected);
    let expected;
    try {
        expected = fs.readFileSync(path.resolve(process.cwd(), expectedPath), "utf8");
    } catch (err) {
        process.stderr.write(
            `${expectedPath}: unable to read expected plan (${err.code || err.message})\n`
        );
        return 1;
    }

    let matches;
    try {
        matches = normalise(generated) === normalise(expected);
    } catch (err) {
        process.stderr.write(`${expectedPath}: invalid expected plan (${err.message})\n`);
        return 1;
    }

    if (matches) {
        process.stdout.write(`${args.file}: plan matches ${expectedPath}\n`);
        return 0;
    }

    process.stderr.write(`${args.file}: plan differs from ${expectedPath}\n`);
    return 1;
}

/**
 * @param {string} text - JSON text.
 * @returns {string} canonical form for comparison (tolerant of indentation and
 *     trailing-newline differences).
 * @throws {SyntaxError} when `text` is not valid JSON.
 */
function normalise(text) {
    return JSON.stringify(JSON.parse(text));
}

if (require.main === module) {
    process.exit(main(process.argv.slice(2)));
}

module.exports = { parseArgs, expectedPathFor, main };
