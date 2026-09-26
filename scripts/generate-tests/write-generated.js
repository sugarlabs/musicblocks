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
 * The safe writer at the end of the generation pipeline:
 *
 *     ModuleTestPlan -> generated source -> validate -> (if valid) safe write
 *
 * It writes a validated candidate to a single, deterministic location - the
 * module's own `__tests__/` directory, as `<module>.generated.test.js` - and
 * refuses everything else:
 *
 *   - it never writes outside that `__tests__/` directory (checked both
 *     lexically and, before writing, against the real path so a symlink in the
 *     existing directory tree cannot redirect the write out of the repo);
 *   - it never overwrites an existing file (generated or hand-written): the
 *     actual create uses the `wx` open flag, which fails atomically if the path
 *     already exists;
 *   - it never writes a production (non-`.generated.test.js`) file;
 *   - it rejects `..` path traversal and absolute path overrides;
 *   - it creates the `__tests__/` directory only when it is missing;
 *   - it always reports the exact path it would write;
 *   - `dryRun` reports that path and writes nothing.
 *
 * `writeGeneratedTest` additionally runs ./validate-generated.js first, so an
 * invalid candidate is never written. That validator is a static, heuristic
 * check on known-unsafe constructs, not a JavaScript sandbox - see its own
 * header. This writer's guarantee is narrower and concrete: whatever string it
 * is handed, it only ever creates one new file at the deterministic path below.
 */

const fs = require("fs");
const path = require("path");

const { validateGeneratedTest } = require("./validate-generated");

const GENERATED_SUFFIX = ".generated.test.js";

/**
 * Resolves the deterministic output path for a module's generated test.
 *
 *   `js/utils/utils-logic.js` -> `js/utils/__tests__/utils-logic.generated.test.js`
 *
 * @param {string} modulePath - repo-relative path of the module under test.
 * @returns {string} a repo-relative POSIX path.
 * @throws {Error} when `modulePath` is empty, absolute, escapes the repo, or is
 *     not a `.js` file.
 */
function generatedTestPathFor(modulePath) {
    if (typeof modulePath !== "string" || modulePath.trim() === "") {
        throw new Error("generatedTestPathFor: a module path is required");
    }
    const normalized = modulePath.split(path.sep).join("/");
    if (path.isAbsolute(modulePath) || /^[a-zA-Z]:/.test(modulePath)) {
        throw new Error(
            `generatedTestPathFor: module path must be repo-relative, got "${modulePath}"`
        );
    }
    const parts = normalized.split("/");
    if (parts.includes("..") || parts.includes(".")) {
        throw new Error(
            `generatedTestPathFor: module path must not contain "." or "..": "${modulePath}"`
        );
    }
    if (!normalized.endsWith(".js")) {
        throw new Error(
            `generatedTestPathFor: module under test must be a .js file: "${modulePath}"`
        );
    }
    const dir = parts.slice(0, -1).join("/");
    const base = parts[parts.length - 1].replace(/\.js$/, "");
    const prefix = dir === "" ? "" : `${dir}/`;
    return `${prefix}__tests__/${base}${GENERATED_SUFFIX}`;
}

/**
 * Lexical safety check on `candidatePath`: repo-relative, no `..` traversal,
 * inside a `__tests__/` directory, ending in the generated suffix, and - after
 * `path.resolve(root, candidatePath)` - still lexically under `root`.
 *
 * This is string-level only. It does not resolve symlinks; the real-path check
 * that closes that gap lives in {@link safeWrite}, which has a concrete `cwd`.
 *
 * @param {string} candidatePath - repo-relative path proposed for the write.
 * @param {string} root - absolute path the write must stay within (the repo).
 * @returns {string} the absolute, lexically-verified path.
 * @throws {Error} with a specific reason when the path is unsafe.
 */
function assertSafeTestPath(candidatePath, root) {
    if (typeof candidatePath !== "string" || candidatePath.trim() === "") {
        throw new Error("assertSafeTestPath: a path is required");
    }
    if (path.isAbsolute(candidatePath) || /^[a-zA-Z]:/.test(candidatePath)) {
        throw new Error(`refusing an absolute output path: "${candidatePath}"`);
    }
    const posix = candidatePath.split(path.sep).join("/");
    if (posix.split("/").includes("..")) {
        throw new Error(`refusing a path that traverses upward ("..") : "${candidatePath}"`);
    }
    if (!posix.endsWith(GENERATED_SUFFIX)) {
        throw new Error(
            `refusing to write "${candidatePath}": generated tests must end in "${GENERATED_SUFFIX}"`
        );
    }
    if (!posix.split("/").includes("__tests__")) {
        throw new Error(`refusing to write outside a __tests__/ directory: "${candidatePath}"`);
    }
    const resolvedRoot = path.resolve(root);
    const absolute = path.resolve(resolvedRoot, candidatePath);
    const contained = absolute === resolvedRoot || absolute.startsWith(resolvedRoot + path.sep);
    if (!contained) {
        throw new Error(`refusing to write outside the repository: "${candidatePath}"`);
    }
    return absolute;
}

/**
 * Real-path containment: walks up from `absolute` to the nearest ancestor that
 * exists on disk, resolves its symlinks, and confirms the result is still inside
 * the resolved `root`. This catches a symlinked `__tests__/` (or any ancestor)
 * that lexical checks cannot see.
 *
 * @param {string} absolute - the absolute target path.
 * @param {string} root - the repository root.
 * @param {string} relPath - repo-relative path, for the error message.
 * @throws {Error} when the real destination is outside the repository.
 */
function assertRealContainment(absolute, root, relPath) {
    let realRoot;
    try {
        realRoot = fs.realpathSync(root);
    } catch (err) {
        throw new Error(`safeWrite: repository root "${root}" is not accessible (${err.code})`);
    }

    let probe = absolute;
    while (!fs.existsSync(probe)) {
        const parent = path.dirname(probe);
        if (parent === probe) break;
        probe = parent;
    }

    let realProbe;
    try {
        realProbe = fs.realpathSync(probe);
    } catch {
        realProbe = probe;
    }

    if (realProbe !== realRoot && !realProbe.startsWith(realRoot + path.sep)) {
        throw new Error(
            `refusing to write "${relPath}": its real path resolves outside the repository ` +
                `(a symlink in the existing path escapes "${realRoot}")`
        );
    }
}

/**
 * Writes an already-produced source string to a module's generated-test path,
 * with every safety guard applied. Does not validate the source - callers that
 * want validation should use {@link writeGeneratedTest}.
 *
 * @param {string} source - the test source to write.
 * @param {object} options
 * @param {string} options.modulePath - repo-relative path of the module under test.
 * @param {boolean} [options.dryRun=false] - report the path, write nothing.
 * @param {string} [options.cwd] - repository root (defaults to `process.cwd()`).
 * @returns {{ path: string, absolutePath: string, written: boolean, created: boolean, dryRun: boolean }}
 * @throws {Error} when the source is empty, the path is unsafe, or the target
 *     already exists.
 */
function safeWrite(source, options = {}) {
    if (typeof source !== "string" || source.trim() === "") {
        throw new Error("safeWrite: refusing to write empty source");
    }
    const cwd = options.cwd || process.cwd();
    const root = path.resolve(cwd);
    const relPath = generatedTestPathFor(options.modulePath);
    const absolute = assertSafeTestPath(relPath, root);
    assertRealContainment(absolute, root, relPath);

    const report = {
        path: relPath,
        absolutePath: absolute,
        written: false,
        created: false,
        dryRun: Boolean(options.dryRun)
    };

    if (options.dryRun) {
        // No atomic create happens in a dry run, so a plain existence check is
        // the only signal available; surface the collision the real write would
        // hit rather than silently reporting a path that could not be written.
        if (fs.existsSync(absolute)) {
            throw new Error(`refusing to overwrite an existing test: "${relPath}" already exists`);
        }
        return report;
    }

    const dir = path.dirname(absolute);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        report.created = true;
    }

    try {
        // `wx` fails with EEXIST if the path already exists. This single atomic
        // operation - not a preceding stat - is what guarantees no overwrite.
        fs.writeFileSync(absolute, source, { encoding: "utf8", flag: "wx" });
    } catch (err) {
        if (err.code === "EEXIST") {
            throw new Error(`refusing to overwrite an existing test: "${relPath}" already exists`);
        }
        throw err;
    }
    report.written = true;
    return report;
}

/**
 * Validates a generated test candidate and, only if it is valid, writes it to
 * its deterministic path. An invalid candidate is never written.
 *
 * The deterministic output path is resolved first (from `modulePath` / the
 * plan), so a malformed module path fails fast and every result - valid or not -
 * still reports the path that *would* have been used, for diagnostics.
 *
 * @param {string} source - the candidate test source.
 * @param {object} options
 * @param {object} [options.plan] - the ModuleTestPlan; also supplies `modulePath`.
 * @param {string} [options.modulePath] - repo-relative module path (overrides the plan).
 * @param {boolean} [options.dryRun=false] - validate and report the path only.
 * @param {string[]} [options.existingTitles] - forwarded to the validator.
 * @param {string[]} [options.allowedGlobals] - forwarded to the validator.
 * @param {string[]} [options.allowedModules] - forwarded to the validator.
 * @param {string} [options.cwd] - repository root.
 * @returns {{
 *     valid: boolean,
 *     validation: object,
 *     written: boolean,
 *     path: string|null,
 *     report: object|null
 * }}
 * @throws {Error} propagated from {@link safeWrite} once a candidate is *valid*
 *     and about to be written: the target file already exists, the resolved
 *     path is unsafe (absolute, `..` traversal, outside a `__tests__/` dir, or
 *     not `*.generated.test.js`), or a symlink in the existing path escapes the
 *     repository. A malformed module path and every validation failure are
 *     reported as `{ valid: false }`, never thrown.
 */
function writeGeneratedTest(source, options = {}) {
    const modulePath =
        typeof options.modulePath === "string"
            ? options.modulePath
            : options.plan && typeof options.plan.file === "string"
              ? options.plan.file
              : null;

    // Resolve (and validate) the output path before the heavier source
    // validation, and keep it on every return value for diagnostics.
    let plannedPath = null;
    if (modulePath) {
        try {
            plannedPath = generatedTestPathFor(modulePath);
        } catch (err) {
            return {
                valid: false,
                validation: { valid: false, errors: [err.message], warnings: [], modulePath },
                written: false,
                path: null,
                report: null
            };
        }
    }

    const validation = validateGeneratedTest(source, {
        plan: options.plan,
        modulePath: modulePath || undefined,
        existingTitles: options.existingTitles,
        allowedGlobals: options.allowedGlobals,
        allowedModules: options.allowedModules
    });

    if (!validation.valid) {
        return { valid: false, validation, written: false, path: plannedPath, report: null };
    }
    if (!modulePath) {
        return {
            valid: false,
            validation: {
                ...validation,
                valid: false,
                errors: [...validation.errors, "no module path available to derive an output path"]
            },
            written: false,
            path: null,
            report: null
        };
    }

    const report = safeWrite(source, {
        modulePath,
        dryRun: options.dryRun,
        cwd: options.cwd
    });

    return {
        valid: true,
        validation,
        written: report.written,
        path: report.path,
        report
    };
}

module.exports = {
    GENERATED_SUFFIX,
    generatedTestPathFor,
    assertSafeTestPath,
    assertRealContainment,
    safeWrite,
    writeGeneratedTest
};
