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

const fs = require("fs");
const path = require("path");

const { extractFile } = require("../extract-module");
const { validateGeneratedTest } = require("../validate-generated");
const { generatedTestPathFor } = require("../write-generated");
const {
    STATUS,
    classifyCandidate,
    buildReviewReport,
    formatReviewReport
} = require("../review-report");

const FIXTURES = path.join(__dirname, "fixtures", "generated");
const fixture = name => fs.readFileSync(path.join(FIXTURES, name), "utf8");
const utilsLogicPlan = () => extractFile("js/utils/utils-logic.js");

/** Builds the `{ provider, validation, outPath }` shape review-report.js expects. */
const candidateFor = (source, options = {}) => {
    const plan = options.plan || utilsLogicPlan();
    const validation = validateGeneratedTest(source, { plan, ...options.validateOptions });
    return {
        provider: options.provider || "noop",
        validation,
        outPath: generatedTestPathFor(plan.file)
    };
};

describe("classifyCandidate", () => {
    it("is REJECTED whenever errors is non-empty, regardless of warnings", () => {
        expect(classifyCandidate({ valid: false, errors: ["bad"], warnings: [] })).toBe(
            STATUS.REJECTED
        );
        expect(classifyCandidate({ valid: false, errors: ["bad"], warnings: ["also"] })).toBe(
            STATUS.REJECTED
        );
    });

    it("is WARNING when valid but warnings is non-empty", () => {
        expect(classifyCandidate({ valid: true, errors: [], warnings: ["heads up"] })).toBe(
            STATUS.WARNING
        );
    });

    it("is ACCEPTED when valid with no warnings", () => {
        expect(classifyCandidate({ valid: true, errors: [], warnings: [] })).toBe(STATUS.ACCEPTED);
    });
});

describe("buildReviewReport: accepted candidate", () => {
    it("reports ACCEPTED with empty errors/warnings and wouldWrite true", () => {
        const report = buildReviewReport(utilsLogicPlan(), [
            candidateFor(fixture("valid-utils-logic.txt"))
        ]);

        expect(report.candidates).toHaveLength(1);
        expect(report.candidates[0]).toMatchObject({
            index: 0,
            provider: "noop",
            status: STATUS.ACCEPTED,
            errors: [],
            warnings: [],
            wouldWrite: true
        });
        expect(report.candidates[0].outPath).toBe(
            "js/utils/__tests__/utils-logic.generated.test.js"
        );
        expect(report.summary).toEqual({ total: 1, accepted: 1, warning: 0, rejected: 0 });
    });
});

describe("buildReviewReport: rejected candidate", () => {
    it("carries the validator's own errors, unmodified, and wouldWrite false", () => {
        const plan = utilsLogicPlan();
        const validation = validateGeneratedTest("not valid javascript {{{", { plan });
        expect(validation.valid).toBe(false); // sanity: this candidate really is invalid

        const report = buildReviewReport(plan, [
            { provider: "noop", validation, outPath: generatedTestPathFor(plan.file) }
        ]);

        expect(report.candidates[0].status).toBe(STATUS.REJECTED);
        expect(report.candidates[0].errors).toEqual(validation.errors);
        expect(report.candidates[0].wouldWrite).toBe(false);
        expect(report.summary).toEqual({ total: 1, accepted: 0, warning: 0, rejected: 1 });
    });

    it("reflects real validator rejection reasons for a meaningless-assertion candidate", () => {
        const plan = utilsLogicPlan();
        const validation = validateGeneratedTest(
            'const target = require("../utils-logic");\n' +
                'describe("x", () => { it("y", () => { expect(target).toBeDefined(); }); });\n',
            { plan }
        );
        const report = buildReviewReport(plan, [
            { provider: "noop", validation, outPath: generatedTestPathFor(plan.file) }
        ]);

        expect(report.candidates[0].status).toBe(STATUS.REJECTED);
        expect(report.candidates[0].errors).toEqual(validation.errors);
        expect(report.candidates[0].errors.join(" ")).toMatch(/no meaningful assertions/);
    });
});

describe("buildReviewReport: warning candidate", () => {
    it("is WARNING, not REJECTED, and still wouldWrite true", () => {
        const report = buildReviewReport(utilsLogicPlan(), [
            candidateFor(fixture("warning-utils-logic.txt"))
        ]);

        expect(report.candidates[0].status).toBe(STATUS.WARNING);
        expect(report.candidates[0].errors).toEqual([]);
        expect(report.candidates[0].warnings).toEqual([
            "constructs `new Date()` with no argument; use a fixed timestamp for a deterministic test"
        ]);
        expect(report.candidates[0].wouldWrite).toBe(true);
        expect(report.summary).toEqual({ total: 1, accepted: 0, warning: 1, rejected: 0 });
    });

    it("never turns a warning into a rejection, even alongside other accepted/rejected candidates", () => {
        const plan = utilsLogicPlan();
        const report = buildReviewReport(plan, [
            candidateFor(fixture("valid-utils-logic.txt"), { plan }),
            candidateFor(fixture("warning-utils-logic.txt"), { plan }),
            {
                provider: "noop",
                validation: validateGeneratedTest("{{{", { plan }),
                outPath: generatedTestPathFor(plan.file)
            }
        ]);

        expect(report.candidates.map(c => c.status)).toEqual([
            STATUS.ACCEPTED,
            STATUS.WARNING,
            STATUS.REJECTED
        ]);
        expect(report.summary).toEqual({ total: 3, accepted: 1, warning: 1, rejected: 1 });
    });
});

describe("buildReviewReport: ordering and determinism", () => {
    it("preserves the input candidate order in its own index and array position", () => {
        const plan = utilsLogicPlan();
        const inputs = [
            candidateFor(fixture("warning-utils-logic.txt"), { plan, provider: "manual" }),
            candidateFor(fixture("valid-utils-logic.txt"), { plan, provider: "noop" })
        ];
        const report = buildReviewReport(plan, inputs);

        expect(report.candidates.map(c => c.index)).toEqual([0, 1]);
        expect(report.candidates.map(c => c.provider)).toEqual(["manual", "noop"]);
        expect(report.candidates.map(c => c.status)).toEqual([STATUS.WARNING, STATUS.ACCEPTED]);
    });

    it("running the same inputs through buildReviewReport twice yields identical JSON", () => {
        const plan = utilsLogicPlan();
        const candidates = [candidateFor(fixture("valid-utils-logic.txt"), { plan })];

        const first = JSON.stringify(buildReviewReport(plan, candidates));
        const second = JSON.stringify(buildReviewReport(plan, candidates));
        expect(first).toBe(second);
    });

    it("formatReviewReport is byte-identical across two calls on the same report", () => {
        const report = buildReviewReport(utilsLogicPlan(), [
            candidateFor(fixture("valid-utils-logic.txt"))
        ]);
        expect(formatReviewReport(report)).toBe(formatReviewReport(report));
    });
});

describe("buildReviewReport: empty candidate set", () => {
    it("produces a report with no candidates and an all-zero summary", () => {
        const report = buildReviewReport(utilsLogicPlan(), []);
        expect(report.candidates).toEqual([]);
        expect(report.summary).toEqual({ total: 0, accepted: 0, warning: 0, rejected: 0 });
    });

    it("defaults candidates to an empty list when omitted", () => {
        const report = buildReviewReport(utilsLogicPlan());
        expect(report.candidates).toEqual([]);
    });

    it("formatReviewReport says so instead of printing an empty section", () => {
        const report = buildReviewReport(utilsLogicPlan(), []);
        expect(formatReviewReport(report)).toMatch(/candidates: none generated/);
    });
});

describe("buildReviewReport: invalid / partial module input", () => {
    it("tolerates a plan missing every field instead of throwing", () => {
        expect(() => buildReviewReport({}, [])).not.toThrow();
        const report = buildReviewReport({}, []);
        expect(report.module).toBe("<unknown>");
        expect(report.discovered).toEqual({ exports: [], functions: [], classes: [] });
    });

    it("tolerates a candidate with a missing/malformed validation object", () => {
        const report = buildReviewReport(utilsLogicPlan(), [{ provider: "noop" }, {}]);
        expect(report.candidates.map(c => c.status)).toEqual([STATUS.REJECTED, STATUS.REJECTED]);
        expect(report.candidates[1].provider).toBeNull();
    });

    it("discovers real export/function names from a real plan, in source order", () => {
        const plan = utilsLogicPlan();
        const report = buildReviewReport(plan, []);
        expect(report.discovered.exports.length).toBeGreaterThan(0);
        expect(report.discovered.exports.map(e => e.name)).toEqual(plan.exports.map(e => e.name));
        expect(report.discovered.functions).toEqual(plan.functions.map(f => f.name));
    });
});

describe("report reflects the actual validator result (no duplicated validation logic)", () => {
    it("errors/warnings on the candidate are the exact same array contents the validator returned", () => {
        const plan = utilsLogicPlan();
        const validation = validateGeneratedTest(fixture("warning-utils-logic.txt"), { plan });
        const report = buildReviewReport(plan, [
            { provider: "noop", validation, outPath: generatedTestPathFor(plan.file) }
        ]);

        expect(report.candidates[0].errors).toEqual(validation.errors);
        expect(report.candidates[0].warnings).toEqual(validation.warnings);
    });
});

describe("formatReviewReport output", () => {
    it("renders reasons for a REJECTED candidate and no warnings section when there are none", () => {
        const plan = utilsLogicPlan();
        const validation = validateGeneratedTest("{{{", { plan });
        const report = buildReviewReport(plan, [
            { provider: "noop", validation, outPath: generatedTestPathFor(plan.file) }
        ]);
        const text = formatReviewReport(report);

        expect(text).toMatch(/candidate 1 \(provider: noop\): REJECTED/);
        expect(text).toMatch(/ {2}reasons:/);
        expect(text).not.toMatch(/ {2}warnings:/);
        expect(text).toMatch(/summary: 0 accepted, 0 warning, 1 rejected \(of 1\)/);
        expect(text).toMatch(/note: validation is static and heuristic/);
    });

    it("renders warnings for a WARNING candidate and no reasons section", () => {
        const report = buildReviewReport(utilsLogicPlan(), [
            candidateFor(fixture("warning-utils-logic.txt"))
        ]);
        const text = formatReviewReport(report);

        expect(text).toMatch(/candidate 1 \(provider: noop\): WARNING/);
        expect(text).toMatch(/ {2}warnings:/);
        expect(text).not.toMatch(/ {2}reasons:/);
    });

    it("renders neither section for an ACCEPTED candidate", () => {
        const report = buildReviewReport(utilsLogicPlan(), [
            candidateFor(fixture("valid-utils-logic.txt"))
        ]);
        const text = formatReviewReport(report);

        expect(text).toMatch(/candidate 1 \(provider: noop\): ACCEPTED/);
        expect(text).not.toMatch(/ {2}reasons:/);
        expect(text).not.toMatch(/ {2}warnings:/);
    });

    it("ends in a single trailing newline", () => {
        const report = buildReviewReport(utilsLogicPlan(), []);
        const text = formatReviewReport(report);
        expect(text.endsWith("\n")).toBe(true);
        expect(text.endsWith("\n\n")).toBe(false);
    });
});
