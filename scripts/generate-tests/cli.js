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
 * Command-line entry point for the deterministic module test-plan extractor.
 *
 *   node scripts/generate-tests/cli.js path/to/module.js
 *       Prints the plan as JSON to stdout.
 *
 *   node scripts/generate-tests/cli.js path/to/module.js --check [expected.json]
 *       Compares the freshly generated plan against a committed expected plan
 *       without writing anything. Exits 0 when they match, 1 when they differ.
 *       The expected file defaults to the source path with `.js` replaced by
 *       `.plan.json`.
 *
 *   node scripts/generate-tests/cli.js path/to/module.js --prompt
 *       Prints the deterministic test-generation prompt for the module. No
 *       provider is invoked.
 *
 *   node scripts/generate-tests/cli.js path/to/module.js --generate[=provider]
 *       Runs the generation pipeline through a credential-free provider
 *       ("noop" by default, or "manual") and prints the candidate test source
 *       to stdout. Nothing is written to disk and no network call is made.
 *
 *   node scripts/generate-tests/cli.js path/to/module.js --emit[=provider] [--write]
 *       Generates a candidate, runs it through the deterministic validator
 *       (./validate-generated.js) and reports the result plus the exact path
 *       the safe writer would use. Without --write nothing is written; with
 *       --write a valid candidate is written to
 *       `<dir>/__tests__/<module>.generated.test.js` (an existing file is never
 *       overwritten). Exits non-zero when the candidate is invalid.
 *
 * Without --emit --write this tool only reads and parses the target file. It
 * never requires, imports or executes it.
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
    "usage: node scripts/generate-tests/cli.js <module.js> " +
    "[--check [expected.json] | --prompt | --generate[=provider] | --emit[=provider] [--write]]";

const HELP = [
    USAGE,
    "",
    "modes (mutually exclusive):",
    "  (none)              print the module test plan as JSON",
    "  --check [file]      compare the plan against a committed expected plan; exit 1 on mismatch",
    "  --prompt            print the deterministic generation prompt; no provider is run",
    "  --generate[=prov]   run the pipeline through a provider and print the RAW candidate source.",
    "                      No validation, no file path, nothing written. For eyeballing output.",
    "  --emit[=prov]       run the pipeline, then VALIDATE the candidate and report the exact",
    "                      path the safe writer would use. Exit 1 if the candidate is invalid.",
    "    --write           with --emit only: actually write a valid candidate to",
    "                      <dir>/__tests__/<module>.generated.test.js (never overwrites).",
    "",
    'provider is "noop" (default) or "manual"; both are credential-free and offline.'
].join("\n");

/**
 * Parses argv into `{ file, check, expected }`.
 *
 * @param {string[]} argv - arguments after `node cli.js`.
 * @returns {{ file: string, check: boolean, expected: string|null }}
 */
function parseArgs(argv) {
    let file = null;
    let check = false;
    let expected = null;
    let prompt = false;
    let generate = null;
    let emit = null;
    let write = false;

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === "--write") {
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
            throw new Error(`unknown option: ${arg}`);
        } else if (file === null) {
            file = arg;
        } else {
            throw new Error(`unexpected argument: ${arg}`);
        }
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

        for (const warning of validation.warnings) {
            process.stderr.write(`warning: ${warning}\n`);
        }
        if (!validation.valid) {
            for (const error of validation.errors) {
                process.stderr.write(`invalid: ${error}\n`);
            }
            process.stderr.write(`${plan.file}: candidate rejected; nothing written\n`);
            return 1;
        }

        if (!args.write) {
            process.stdout.write(`${plan.file}: candidate is valid; would write ${outPath}\n`);
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
