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
 * Turns a ModuleTestPlan plus one or more already-computed
 * ./validate-generated.js results into a small, deterministic "review report":
 * what the AST pipeline discovered about the module, and for each generated
 * candidate, whether it is safe to keep, why, and what path it would be
 * written to.
 *
 *     ModuleTestPlan + { validation, provider, outPath }[]
 *         -> { module, discovered, candidates, summary }
 *
 * This module does not validate anything itself - it only reads the `valid`,
 * `errors` and `warnings` already produced by validateGeneratedTest and sorts
 * them into a status. Rejection reasons and warnings in the report are always
 * the validator's own strings, verbatim; nothing here re-implements or
 * second-guesses a validation rule.
 *
 * It never reads a file, executes anything, or touches the filesystem or a
 * network - it is pure data shaping over objects the caller already has in
 * memory. Given the same plan and candidate results it always returns the
 * same report, in the same order the candidates were supplied in (the plan's
 * own lists are already sorted by ../module-test-plan.js).
 *
 * Three, and only three, candidate statuses exist:
 *
 *   - REJECTED  the validator's `errors` is non-empty; the candidate must not
 *               be written, with or without --write.
 *   - WARNING   `errors` is empty but `warnings` is not; the candidate is
 *               still safe to write - a warning must never silently become a
 *               rejection.
 *   - ACCEPTED  `errors` and `warnings` are both empty.
 */

const { normalizePlan } = require("./generation-request");

const STATUS = Object.freeze({
    ACCEPTED: "ACCEPTED",
    WARNING: "WARNING",
    REJECTED: "REJECTED"
});

/**
 * Fixed reminder printed with every report: what static validation does and
 * does not guarantee. Kept as one constant so the CLI output and the README
 * stay word-for-word in sync.
 */
const REVIEW_DISCLAIMER =
    "validation is static and heuristic, not proof of correctness; an ACCEPTED " +
    "or WARNING candidate still needs a human read before it is trusted, and " +
    "must be run with Jest after writing";

/**
 * @param {object} validation - a validateGeneratedTest() result, or a partial
 *     stand-in.
 * @returns {"ACCEPTED"|"WARNING"|"REJECTED"}
 */
function classifyCandidate(validation) {
    if (!validation || validation.valid !== true) return STATUS.REJECTED;
    const warnings = Array.isArray(validation.warnings) ? validation.warnings : [];
    return warnings.length > 0 ? STATUS.WARNING : STATUS.ACCEPTED;
}

/**
 * @param {object} candidate - `{ provider, validation, outPath }`.
 * @param {number} index - position in the supplied candidate list.
 * @returns {object} one reviewed candidate entry.
 */
function reviewCandidate(candidate, index) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const validation =
        source.validation && typeof source.validation === "object"
            ? source.validation
            : { valid: false, errors: [], warnings: [] };
    const errors = Array.isArray(validation.errors) ? [...validation.errors] : [];
    const warnings = Array.isArray(validation.warnings) ? [...validation.warnings] : [];
    const status = classifyCandidate(validation);

    return {
        index,
        provider: typeof source.provider === "string" ? source.provider : null,
        status,
        errors,
        warnings,
        outPath: typeof source.outPath === "string" ? source.outPath : null,
        // Informational only - this module never writes anything. A REJECTED
        // candidate is never written; ACCEPTED and WARNING candidates both are,
        // once the caller passes --write. A warning is never a reason to skip
        // the write.
        wouldWrite: status !== STATUS.REJECTED
    };
}

/**
 * Builds a deterministic review report from a ModuleTestPlan and the results
 * already produced for one or more generated candidates.
 *
 * @param {object} plan - a ModuleTestPlan from ../extract-module (or a partial
 *     stand-in; missing fields are treated as empty, matching
 *     ./generation-request.js's normalizePlan).
 * @param {object[]} [candidates] - `{ provider, validation, outPath }` entries,
 *     one per generated candidate, in the order they were produced. An empty
 *     or omitted list produces a report with no candidates.
 * @returns {{
 *     module: string,
 *     discovered: { exports: object[], functions: string[], classes: string[] },
 *     candidates: object[],
 *     summary: { total: number, accepted: number, warning: number, rejected: number }
 * }}
 */
function buildReviewReport(plan, candidates = []) {
    const normalized = normalizePlan(plan && typeof plan === "object" ? plan : {});
    const discovered = {
        exports: normalized.exports.map(entry => ({
            name: entry && typeof entry.name === "string" ? entry.name : null,
            kind: entry && typeof entry.kind === "string" ? entry.kind : null
        })),
        functions: normalized.functions
            .map(fn => (fn && typeof fn.name === "string" ? fn.name : null))
            .filter(name => name !== null),
        classes: normalized.classes
            .map(cls => (cls && typeof cls.name === "string" ? cls.name : null))
            .filter(name => name !== null)
    };

    const reviewed = (Array.isArray(candidates) ? candidates : []).map((candidate, index) =>
        reviewCandidate(candidate, index)
    );

    const summary = {
        total: reviewed.length,
        accepted: reviewed.filter(c => c.status === STATUS.ACCEPTED).length,
        warning: reviewed.filter(c => c.status === STATUS.WARNING).length,
        rejected: reviewed.filter(c => c.status === STATUS.REJECTED).length
    };

    return { module: normalized.file, discovered, candidates: reviewed, summary };
}

/**
 * Renders a review report as simple, deterministic text for a terminal.
 *
 * @param {object} report - a {@link buildReviewReport} result.
 * @returns {string} ending in a single newline.
 */
function formatReviewReport(report) {
    const lines = [];
    lines.push(`review report: ${report.module}`);
    lines.push(
        `discovered: ${report.discovered.exports.length} export(s), ` +
            `${report.discovered.functions.length} function(s), ` +
            `${report.discovered.classes.length} class(es)`
    );

    if (report.candidates.length === 0) {
        lines.push("candidates: none generated");
    }
    for (const candidate of report.candidates) {
        const label = candidate.provider ? ` (provider: ${candidate.provider})` : "";
        lines.push(`candidate ${candidate.index + 1}${label}: ${candidate.status}`);
        if (candidate.errors.length > 0) {
            lines.push("  reasons:");
            for (const reason of candidate.errors) lines.push(`    - ${reason}`);
        }
        if (candidate.warnings.length > 0) {
            lines.push("  warnings:");
            for (const warning of candidate.warnings) lines.push(`    - ${warning}`);
        }
        if (candidate.outPath) lines.push(`  path: ${candidate.outPath}`);
    }

    lines.push(
        `summary: ${report.summary.accepted} accepted, ${report.summary.warning} warning, ` +
            `${report.summary.rejected} rejected (of ${report.summary.total})`
    );
    lines.push(`note: ${REVIEW_DISCLAIMER}`);
    return lines.join("\n") + "\n";
}

module.exports = {
    STATUS,
    REVIEW_DISCLAIMER,
    classifyCandidate,
    buildReviewReport,
    formatReviewReport
};
