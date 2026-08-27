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
 * Reads a JavaScript source file, parses it with the repository's vendored Acorn
 * parser, and produces a deterministic module test plan (see
 * ./module-test-plan.js).
 *
 * The target file is never required, imported or executed - only its text is
 * read and parsed. Parse errors are reported with the filename attached.
 */

const fs = require("fs");
const path = require("path");
const acorn = require("../../lib/acorn.min");
const { buildTestPlan } = require("./module-test-plan");

/**
 * Acorn options mirroring how the rest of the repository parses source
 * (`ecmaVersion: 2020`). Scripts are the norm here; the module fallback covers
 * files that use `import`/`export`.
 */
const PARSE_OPTIONS = { ecmaVersion: 2020, locations: true };

/**
 * Parses source text into an ESTree AST plus its block comments.
 *
 * @param {string} source - JavaScript source text.
 * @param {string} file - path used in error messages.
 * @returns {{ ast: object, comments: object[] }}
 * @throws {Error} a parse error whose message begins with `file`.
 */
function parseSource(source, file) {
    const label = file || "<anonymous>";
    let lastError = null;

    for (const sourceType of ["script", "module"]) {
        const comments = [];
        try {
            const ast = acorn.parse(source, { ...PARSE_OPTIONS, sourceType, onComment: comments });
            return { ast, comments };
        } catch (err) {
            lastError = err;
        }
    }

    const where =
        lastError && lastError.loc
            ? ` (line ${lastError.loc.line}, column ${lastError.loc.column})`
            : "";
    const message = lastError
        ? lastError.message.replace(/\s*\(\d+:\d+\)\s*$/, "")
        : "unknown parse error";
    const error = new Error(`${label}: ${message}${where}`);
    error.file = label;
    if (lastError && lastError.loc) error.loc = lastError.loc;
    throw error;
}

/**
 * Produces the test plan for already-loaded source text.
 *
 * @param {string} source - JavaScript source text.
 * @param {string} file - value recorded as `plan.file` and used in errors.
 * @returns {object} deterministic, JSON-compatible plan.
 */
function extractModule(source, file) {
    const { ast, comments } = parseSource(source, file);
    return buildTestPlan(ast, { file, source, comments });
}

/**
 * Reads a file from disk and produces its test plan.
 *
 * @param {string} filePath - path to a `.js` source file.
 * @param {object} [options] - `{ cwd }` to control how `plan.file` is rendered.
 * @returns {object} deterministic, JSON-compatible plan.
 * @throws {Error} when the file cannot be read or parsed (filename attached).
 */
function extractFile(filePath, options = {}) {
    const cwd = options.cwd || process.cwd();
    const absolute = path.resolve(cwd, filePath);

    let source;
    try {
        source = fs.readFileSync(absolute, "utf8");
    } catch (err) {
        const error = new Error(`${filePath}: unable to read file (${err.code || err.message})`);
        error.file = filePath;
        throw error;
    }

    const relative = path.relative(cwd, absolute).split(path.sep).join("/");
    return extractModule(source, relative || filePath);
}

/**
 * Serialises a plan to canonical JSON (two-space indent, trailing newline) so
 * that CLI output and committed fixtures compare byte-for-byte.
 *
 * @param {object} plan - a plan from {@link extractModule} / {@link extractFile}.
 * @returns {string}
 */
function stringifyPlan(plan) {
    return JSON.stringify(plan, null, 2) + "\n";
}

module.exports = { parseSource, extractModule, extractFile, stringifyPlan };
