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
 * Turns a deterministic ModuleTestPlan (see ./module-test-plan.js) into a
 * structured "generation request": the plan plus a fixed set of instructions,
 * test requirements and project conventions that a downstream generator needs in
 * order to produce Jest tests.
 *
 * This layer is intentionally dumb and completely deterministic:
 *   - It never reads a file, runs code, or contacts a network service.
 *   - It does not know or care which generator (LLM or otherwise) will consume
 *     the request; that coupling lives in ./llm-client.js.
 *   - Given the same plan and options it returns byte-for-byte identical output.
 *
 * The request object is deliberately close to the plan so it stays easy to
 * validate and diff. The prompt string is built from it separately by
 * ./prompt-builder.js.
 */

/**
 * What the generator is being asked to do. Phrased as imperative sentences so
 * they can be dropped into a prompt verbatim.
 */
const DEFAULT_INSTRUCTIONS = Object.freeze([
    "Write Jest tests for the module identified in this request.",
    "Test observable behaviour through the module's public exports; do not reach into private implementation details.",
    "Do not mock the module under test. Use its real exported functions and classes.",
    "Use real inputs and assert on concrete return values, thrown errors and state the caller can observe.",
    "Cover the documented parameters, return values, thrown errors and branches described in the plan.",
    "Do not try to generate a test for every AST node; skip trivial, unreachable or purely structural code.",
    "Do not add snapshot assertions unless the value under test is a genuinely stable serialised structure.",
    "Do not modify, write to, or import any production source file other than the module under test.",
    "Produce only test source code; never emit code that edits files on disk."
]);

/**
 * Constraints on the shape of the generated tests.
 */
const DEFAULT_TEST_REQUIREMENTS = Object.freeze([
    "Use only the Jest APIs already used in this repository: describe, it, expect, beforeEach.",
    "Give every exported function or class its own describe block.",
    "Name each test after the behaviour it verifies, not after the function name alone.",
    "For a function that throws, exercise both the normal path and the documented error path.",
    "For a class, construct real instances and assert on observable state transitions.",
    "Keep every test deterministic: no wall-clock time, randomness, timers or network access."
]);

/**
 * How this repository already writes tests. Descriptive, not imperative.
 */
const DEFAULT_CONVENTIONS = Object.freeze([
    "Tests live in a __tests__/ directory and are named <module>.test.js.",
    "The Jest test environment is jsdom (see jest.config.js).",
    "Production modules use CommonJS: module.exports to export, require() to import.",
    "Indentation is four spaces, strings are double-quoted, and statements end with semicolons (see .prettierrc).",
    "Each source file begins with the project's GNU AGPL license header."
]);

/**
 * Coerces a value that should be a string array into one, dropping anything that
 * is not a non-empty string. Used so a partial or hand-written plan cannot crash
 * the builder.
 *
 * @param {*} value - candidate array.
 * @returns {Array<object>} the value when it is an array, else an empty array.
 */
function asArray(value) {
    return Array.isArray(value) ? value : [];
}

/**
 * Produces a defensive, fully-populated copy of a plan so downstream code can
 * read every field without guarding. Ordering is preserved (the extractor
 * already sorts every list); nothing is re-sorted or re-derived here.
 *
 * @param {object} plan - a plan from ../extract-module, or a partial stand-in.
 * @returns {object} a plan with every documented field present.
 */
function normalizePlan(plan) {
    const totals = plan && typeof plan.totals === "object" && plan.totals ? plan.totals : {};
    return {
        file: typeof plan.file === "string" ? plan.file : "<unknown>",
        sourceType: typeof plan.sourceType === "string" ? plan.sourceType : "script",
        exports: asArray(plan.exports),
        functions: asArray(plan.functions),
        classes: asArray(plan.classes),
        dependencies: asArray(plan.dependencies),
        referencedGlobals: asArray(plan.referencedGlobals),
        jsdoc: asArray(plan.jsdoc),
        totals: {
            branches: Number.isFinite(totals.branches) ? totals.branches : 0,
            returns: Number.isFinite(totals.returns) ? totals.returns : 0,
            throws: Number.isFinite(totals.throws) ? totals.throws : 0
        }
    };
}

/**
 * Builds a short factual summary of the module so the prompt builder (and a
 * human skimming the request) does not have to recompute it.
 *
 * @param {object} plan - a normalized plan.
 * @returns {object}
 */
function summarizeModule(plan) {
    const exportNames = plan.exports
        .map(entry => (entry && typeof entry.name === "string" ? entry.name : null))
        .filter(name => name !== null)
        .sort((a, b) => a.localeCompare(b));

    const hasExportedClass = plan.exports.some(entry => entry && entry.kind === "class");

    return {
        path: plan.file,
        sourceType: plan.sourceType,
        exportCount: plan.exports.length,
        exportNames,
        hasClasses: hasExportedClass || plan.classes.length > 0,
        hasThrows: plan.totals.throws > 0,
        hasBranches: plan.totals.branches > 0,
        dependencyCount: plan.dependencies.length
    };
}

/**
 * Builds a structured, deterministic generation request from a ModuleTestPlan.
 *
 * @param {object} plan - a plan produced by ../extract-module (extractFile /
 *     extractModule). A partial object is tolerated; missing lists are treated
 *     as empty.
 * @param {object} [options] - overrides.
 * @param {string[]} [options.instructions] - replaces the default instructions.
 * @param {string[]} [options.testRequirements] - replaces the default requirements.
 * @param {string[]} [options.conventions] - replaces the default conventions.
 * @param {string} [options.targetTestPath] - where the generated test is expected
 *     to live; recorded on the request for the generator's reference only.
 * @returns {{
 *     module: object,
 *     plan: object,
 *     instructions: string[],
 *     testRequirements: string[],
 *     conventions: string[],
 *     targetTestPath: string
 * }}
 * @throws {TypeError} when `plan` is not an object.
 */
function buildGenerationRequest(plan, options = {}) {
    if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
        throw new TypeError("buildGenerationRequest: plan must be an object");
    }

    const normalized = normalizePlan(plan);
    const module = summarizeModule(normalized);

    const meaningfulStrings = values =>
        asArray(values).filter(value => typeof value === "string" && value.trim() !== "");
    const instructions = meaningfulStrings(options.instructions);
    const testRequirements = meaningfulStrings(options.testRequirements);
    const conventions = meaningfulStrings(options.conventions);

    return {
        module,
        plan: normalized,
        instructions: instructions.length > 0 ? instructions : [...DEFAULT_INSTRUCTIONS],
        testRequirements:
            testRequirements.length > 0 ? testRequirements : [...DEFAULT_TEST_REQUIREMENTS],
        conventions: conventions.length > 0 ? conventions : [...DEFAULT_CONVENTIONS],
        targetTestPath:
            typeof options.targetTestPath === "string"
                ? options.targetTestPath
                : defaultTestPath(normalized.file)
    };
}

/**
 * Derives the conventional test path for a source file
 * (`a/b/mod.js` -> `a/b/__tests__/mod.test.js`).
 *
 * @param {string} sourcePath - the module's path.
 * @returns {string}
 */
function defaultTestPath(sourcePath) {
    if (typeof sourcePath !== "string" || sourcePath === "") return "<unknown>.test.js";
    const slash = sourcePath.lastIndexOf("/");
    const dir = slash === -1 ? "" : sourcePath.slice(0, slash + 1);
    const base = sourcePath.slice(slash + 1).replace(/\.js$/, "");
    return `${dir}__tests__/${base}.test.js`;
}

module.exports = {
    buildGenerationRequest,
    normalizePlan,
    summarizeModule,
    defaultTestPath,
    DEFAULT_INSTRUCTIONS,
    DEFAULT_TEST_REQUIREMENTS,
    DEFAULT_CONVENTIONS
};
