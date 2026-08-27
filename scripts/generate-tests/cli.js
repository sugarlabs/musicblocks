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
 * This tool only reads and parses the target file. It never requires, imports,
 * executes or modifies it, and it never writes to the source tree.
 */

const fs = require("fs");
const path = require("path");
const { extractFile, stringifyPlan } = require("./extract-module");

const USAGE = "usage: node scripts/generate-tests/cli.js <module.js> [--check [expected.json]]";

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

    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === "--check") {
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
        } else if (arg === "--help" || arg === "-h") {
            process.stdout.write(USAGE + "\n");
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
    return { file, check, expected };
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
