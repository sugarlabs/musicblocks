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
 * Renders a structured generation request (see ./generation-request.js) as a
 * single deterministic prompt string.
 *
 * The rendering is pure text formatting: every list the request carries is
 * already sorted and de-duplicated by the AST extractor, so the same request
 * always produces the same prompt. Nothing here reads a file, runs code, or
 * talks to a provider.
 */

const { buildGenerationRequest } = require("./generation-request");

/**
 * Formats a parameter list as `(a, b, ...rest)`.
 *
 * @param {string[]} params - parameter descriptions from the plan.
 * @returns {string}
 */
function formatParams(params) {
    return "(" + (Array.isArray(params) ? params.join(", ") : "") + ")";
}

/**
 * One line describing an exported symbol.
 *
 * @param {object} entry - an entry from `plan.exports`.
 * @returns {string}
 */
function describeExportEntry(entry) {
    const name =
        entry.name === null || entry.name === undefined ? "(default namespace)" : entry.name;
    if (entry.kind === "function") {
        return `- ${name}${formatParams(entry.params)} - function, arity ${entry.arity}`;
    }
    if (entry.kind === "class") {
        const ext = entry.superClass ? ` extends ${entry.superClass}` : "";
        return `- ${name} - class${ext}`;
    }
    return `- ${name} - ${entry.kind || "value"}`;
}

/**
 * Lines describing a class and its members.
 *
 * @param {object} klass - an entry from `plan.classes`.
 * @returns {string[]}
 */
function describeClassBlock(klass) {
    const lines = [`- ${klass.name}${klass.superClass ? ` extends ${klass.superClass}` : ""}`];
    for (const member of klass.methods || []) {
        const parts = [];
        if (member.isStatic) parts.push("static");
        if (member.kind === "get" || member.kind === "set") parts.push(member.kind);
        parts.push(member.name);
        lines.push(`  - ${parts.join(" ")}${formatParams(member.params)}`);
    }
    return lines;
}

/**
 * Lines for a single JSDoc record.
 *
 * @param {object} doc - an entry from `plan.jsdoc`.
 * @returns {string[]}
 */
function describeJsdoc(doc) {
    const lines = [`### ${doc.target || "(file)"}`];
    if (doc.description) lines.push(doc.description);
    for (const tag of doc.tags || []) {
        lines.push(`- @${tag.tag}${tag.text ? ` ${tag.text}` : ""}`);
    }
    return lines;
}

/**
 * Renders a numbered list.
 *
 * @param {string[]} items - list items.
 * @returns {string[]}
 */
function numbered(items) {
    return items.map((item, index) => `${index + 1}. ${item}`);
}

/**
 * Renders a bullet list, or a single "(none)" line when empty.
 *
 * @param {string[]} items - list items.
 * @returns {string[]}
 */
function bullets(items) {
    if (!items || items.length === 0) return ["- (none)"];
    return items.map(item => `- ${item}`);
}

/**
 * Builds the deterministic prompt string from a structured request.
 *
 * @param {object} request - a request from {@link buildGenerationRequest}.
 * @returns {string} the prompt, ending with a single newline.
 */
function buildPrompt(request) {
    if (!request || typeof request !== "object") {
        throw new TypeError("buildPrompt: request must be an object");
    }
    const { module: mod, plan, instructions, testRequirements, conventions } = request;
    const sections = [];

    sections.push([
        "# Jest test generation request",
        "",
        "You are generating a Jest test file for one Music Blocks module. Base the",
        "tests only on the information below. Do not invent exports that are not listed."
    ]);

    sections.push([
        "## Target module",
        `- Source path: ${mod.path}`,
        `- Module system: ${mod.sourceType === "module" ? "ES module" : "script (CommonJS)"}`,
        `- Suggested test path: ${request.targetTestPath}`,
        `- Exported symbols: ${mod.exportCount}`
    ]);

    sections.push([
        "## Exports",
        ...(plan.exports.length > 0
            ? plan.exports.map(describeExportEntry)
            : ["- (no exports detected - the module may not be directly testable)"])
    ]);

    sections.push([
        "## Top-level functions",
        ...(plan.functions.length > 0
            ? plan.functions.map(
                  fn =>
                      `- ${fn.name}${formatParams(fn.params)}: ${fn.branches} branch(es), ` +
                      `${fn.returns} return(s), ${fn.throws} throw(s)` +
                      `${fn.isAsync ? ", async" : ""}${fn.isGenerator ? ", generator" : ""}`
              )
            : ["- (none)"])
    ]);

    const classLines = [];
    for (const klass of plan.classes) classLines.push(...describeClassBlock(klass));
    sections.push(["## Classes", ...(classLines.length > 0 ? classLines : ["- (none)"])]);

    sections.push([
        "## Control flow (whole file)",
        `- Branch points: ${plan.totals.branches}`,
        `- Return statements: ${plan.totals.returns}`,
        `- Throw statements: ${plan.totals.throws}`
    ]);

    sections.push(["## Dependencies (require / import)", ...bullets(plan.dependencies)]);
    sections.push(["## Referenced globals", ...bullets(plan.referencedGlobals)]);

    const jsdocLines = [];
    for (const doc of plan.jsdoc) jsdocLines.push(...describeJsdoc(doc));
    sections.push(["## JSDoc", ...(jsdocLines.length > 0 ? jsdocLines : ["- (none)"])]);

    sections.push(["## Instructions", ...numbered(instructions)]);
    sections.push(["## Test requirements", ...numbered(testRequirements)]);
    sections.push(["## Project conventions", ...bullets(conventions)]);

    return sections.map(lines => lines.join("\n")).join("\n\n") + "\n";
}

/**
 * Convenience wrapper: plan straight to prompt.
 *
 * @param {object} plan - a ModuleTestPlan.
 * @param {object} [options] - forwarded to {@link buildGenerationRequest}.
 * @returns {string}
 */
function buildPromptFromPlan(plan, options) {
    return buildPrompt(buildGenerationRequest(plan, options));
}

module.exports = { buildPrompt, buildPromptFromPlan };
