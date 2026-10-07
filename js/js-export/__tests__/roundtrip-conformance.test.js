/**
 * MusicBlocks v3.8.0
 *
 * @author Music Blocks Contributors
 *
 * @copyright 2026 Music Blocks Contributors
 *
 * @license
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

const {
    setupEnvironment,
    resolveProtoBlock,
    loadBlockListIntoActivity,
    exportBlocksToJS,
    importJSToBlocks,
    runRoundTrip,
    stripAstLocations,
    verifySecondExportStability,
    formatConformanceDiagnostics
} = require("./conformance-harness");

const {
    parseBlockNameInfo,
    indexBlockList,
    normalizeArgumentNode,
    normalizeStatementSequence,
    normalizeBlockStructure
} = require("./conformance-normalize");

const {
    basicValuesAndExpressions,
    variablesAndBoxes,
    actionsAndCalls,
    controlFlow,
    pitchAndPitches,
    switchCases,
    allCorpusCases
} = require("./conformance-corpus");

describe("Round-Trip Conformance Test Harness", () => {
    beforeEach(() => {
        setupEnvironment();
    });

    describe("Harness Foundation", () => {
        test("resolves correct protoblock metadata for representative block types", () => {
            expect(resolveProtoBlock("start")).toEqual({ style: "hat", args: 0 });
            expect(resolveProtoBlock("action")).toEqual({ style: "hat", args: 1 });
            expect(resolveProtoBlock("repeat", 4)).toEqual({ style: "clamp", args: 2 });
            expect(resolveProtoBlock("if", 4)).toEqual({ style: "clamp", args: 2 });
            expect(resolveProtoBlock("ifthenelse", 5)).toEqual({ style: "doubleclamp", args: 3 });
            expect(resolveProtoBlock("number", 1)).toEqual({ style: "value", args: 0 });
            expect(resolveProtoBlock("plus", 3)).toEqual({ style: "arg", args: 2 });
            expect(resolveProtoBlock("forward", 3)).toEqual({ style: "command", args: 1 });
            expect(resolveProtoBlock("pitch", 4)).toEqual({ style: "command", args: 2 });
            expect(resolveProtoBlock("storein2", 3)).toEqual({ style: "command", args: 1 });
            expect(resolveProtoBlock("namedbox", 1)).toEqual({ style: "value", args: 0 });
        });

        test("loads block list into Activity data structure for JSGenerate", () => {
            const blocks = [
                [0, "start", 200, 200, [null, 1, null]],
                [1, "forward", 0, 0, [0, 2, null]],
                [2, ["number", { value: 100 }], 0, 0, [1]]
            ];

            const activity = loadBlockListIntoActivity(blocks);
            expect(activity.blocks.stackList).toEqual([0]);
            expect(activity.blocks.blockList[0].name).toBe("start");
            expect(activity.blocks.blockList[1].name).toBe("forward");
            expect(activity.blocks.blockList[2].value).toBe(100);
        });

        test("exports blocks to production JavaScript using JSGenerate", () => {
            const blocks = [
                [0, "start", 200, 200, [null, 1, null]],
                [1, "forward", 0, 0, [0, 2, null]],
                [2, ["number", { value: 100 }], 0, 0, [1]]
            ];

            const code = exportBlocksToJS(blocks);
            expect(code).toContain("new Mouse(async mouse => {");
            expect(code).toContain("await mouse.goForward(100);");
            expect(code).toContain("return mouse.ENDMOUSE;");
            expect(code).toContain("MusicBlocks.run();");
        });

        test("imports JavaScript back to blocks using production AST2BlockList", () => {
            const code = `new Mouse(async mouse => {
    await mouse.goForward(100);
    return mouse.ENDMOUSE;
});
MusicBlocks.run();`;

            const recovered = importJSToBlocks(code);
            expect(Array.isArray(recovered)).toBe(true);
            expect(recovered.length).toBe(3);
            expect(recovered[0][1]).toBe("start");
            expect(recovered[1][1]).toBe("forward");
            expect(recovered[2][1]).toEqual(["number", { value: 100 }]);
        });

        test("executes end-to-end round trip for basic movement stack", () => {
            const blocks = [
                [0, "start", 200, 200, [null, 1, null]],
                [1, "forward", 0, 0, [0, 2, null]],
                [2, ["number", { value: 100 }], 0, 0, [1]]
            ];

            const result = runRoundTrip(blocks);
            expect(result.code).toContain("await mouse.goForward(100);");
            expect(result.recoveredBlocks.length).toBe(3);
            expect(result.recoveredBlocks[0][1]).toBe("start");
            expect(result.recoveredBlocks[1][1]).toBe("forward");
            expect(result.recoveredBlocks[2][1]).toEqual(["number", { value: 100 }]);
        });

        test("stripAstLocations strips parser metadata while preserving AST structure", () => {
            const rawNode = {
                type: "Literal",
                value: 42,
                raw: "42",
                start: 0,
                end: 2,
                loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 2 } }
            };
            const stripped = stripAstLocations(rawNode);
            expect(stripped).toEqual({
                type: "Literal",
                value: 42
            });
        });

        test("formatConformanceDiagnostics formats clear diagnostic report", () => {
            const diagnostic = formatConformanceDiagnostics({
                caseName: "test_case_diagnostic",
                stage: "NORMALIZED_DIFF",
                error: new Error("Structural mismatch"),
                diff: { expected: "forward", actual: "back" },
                code1: "await mouse.goForward(100);",
                code2: "await mouse.goForward(100);",
                originalBlocks: [[0, "start", 0, 0, [null]]],
                recoveredBlocks: [[0, "start", 0, 0, [null]]]
            });
            expect(diagnostic).toContain("CONFORMANCE FAILURE DIAGNOSTIC");
            expect(diagnostic).toContain("Case: test_case_diagnostic");
            expect(diagnostic).toContain("Stage: NORMALIZED_DIFF");
            expect(diagnostic).toContain("Structural mismatch");
            expect(diagnostic).toContain("await mouse.goForward(100);");
            expect(diagnostic).toContain("--- Original Blocks ---");
            expect(diagnostic).toContain("--- Recovered Blocks ---");
        });
    });

    describe("Normalization Engine", () => {
        test("parses block name info correctly for both scalar strings and complex value arrays", () => {
            expect(parseBlockNameInfo("start")).toEqual({
                name: "start",
                value: null,
                privateData: null
            });
            expect(parseBlockNameInfo(["number", { value: 42 }])).toEqual({
                name: "number",
                value: 42,
                privateData: 42
            });
            expect(parseBlockNameInfo(["namedbox", { value: "box1" }])).toEqual({
                name: "namedbox",
                value: "box1",
                privateData: "box1"
            });
            expect(parseBlockNameInfo(["text", "literalText"])).toEqual({
                name: "text",
                value: "literalText",
                privateData: "literalText"
            });
        });

        test("normalizes argument trees while skipping horizontal spacers (hspace)", () => {
            const blocks = [
                [0, "start", 200, 200, [null, 1, null]],
                [1, "forward", 0, 0, [0, 2, null]],
                [2, "hspace", 0, 0, [1, 3]],
                [3, ["number", { value: 50 }], 0, 0, [2]]
            ];

            const indexed = indexBlockList(blocks);
            const arg = normalizeArgumentNode(2, indexed);
            expect(arg).toEqual({ name: "number", value: 50 });
        });

        test("normalizes statement sequence while skipping non-semantic vertical spacers (vspace/hidden)", () => {
            const blocks = [
                [0, "start", 200, 200, [null, 1, null]],
                [1, "forward", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 100 }], 0, 0, [1]],
                [3, "vspace", 0, 0, [1, 4]],
                [4, "hidden", 0, 0, [3, 5]],
                [5, "right", 0, 0, [4, 6, null]],
                [6, ["number", { value: 90 }], 0, 0, [5]]
            ];

            const indexed = indexBlockList(blocks);
            const stmts = normalizeStatementSequence(1, indexed);
            expect(stmts).toEqual([
                { name: "forward", args: [{ name: "number", value: 100 }] },
                { name: "right", args: [{ name: "number", value: 90 }] }
            ]);
        });

        test("normalizes structural equivalence regardless of arbitrary block IDs or canvas coordinates", () => {
            const programA = [
                [0, "start", 200, 200, [null, 1, null]],
                [1, "forward", 0, 0, [0, 2, null]],
                [2, ["number", { value: 100 }], 0, 0, [1]]
            ];

            const programB = [
                [10, "start", 999, 888, [null, 20, null]],
                [20, "forward", 0, 0, [10, 30, null]],
                [30, ["number", { value: 100, collapsed: false }], 0, 0, [20]]
            ];

            expect(normalizeBlockStructure(programA)).toEqual(normalizeBlockStructure(programB));
        });

        test("preserves distinct block semantics and does not falsely equate differing operations", () => {
            const forwardProg = [
                [0, "start", 200, 200, [null, 1, null]],
                [1, "forward", 0, 0, [0, 2, null]],
                [2, ["number", { value: 100 }], 0, 0, [1]]
            ];

            const rightProg = [
                [0, "start", 200, 200, [null, 1, null]],
                [1, "right", 0, 0, [0, 2, null]],
                [2, ["number", { value: 100 }], 0, 0, [1]]
            ];

            expect(normalizeBlockStructure(forwardProg)).not.toEqual(
                normalizeBlockStructure(rightProg)
            );
        });

        test("verifies normalized structural match on round-trip conversion", () => {
            const blocks = [
                [0, "start", 200, 200, [null, 1, null]],
                [1, "forward", 0, 0, [0, 2, null]],
                [2, ["number", { value: 100 }], 0, 0, [1]]
            ];

            const { recoveredBlocks } = runRoundTrip(blocks);
            const normalizedOriginal = normalizeBlockStructure(blocks);
            const normalizedRecovered = normalizeBlockStructure(recoveredBlocks);

            expect(normalizedRecovered).toEqual(normalizedOriginal);
        });
    });

    describe("Basic Values and Expressions Corpus", () => {
        test.each(basicValuesAndExpressions)("$description ($name)", ({ blocks }) => {
            const { recoveredBlocks } = runRoundTrip(blocks);
            const normalizedOriginal = normalizeBlockStructure(blocks);
            const normalizedRecovered = normalizeBlockStructure(recoveredBlocks);
            expect(normalizedRecovered).toEqual(normalizedOriginal);
        });
    });

    describe("Variables and Boxes Corpus", () => {
        test.each(variablesAndBoxes)("$description ($name)", ({ blocks }) => {
            const { recoveredBlocks } = runRoundTrip(blocks);
            const normalizedOriginal = normalizeBlockStructure(blocks);
            const normalizedRecovered = normalizeBlockStructure(recoveredBlocks);
            expect(normalizedRecovered).toEqual(normalizedOriginal);
        });
    });

    describe("Actions and Calls Corpus", () => {
        test.each(actionsAndCalls)("$description ($name)", ({ blocks }) => {
            const { recoveredBlocks } = runRoundTrip(blocks);
            const normalizedOriginal = normalizeBlockStructure(blocks);
            const normalizedRecovered = normalizeBlockStructure(recoveredBlocks);
            expect(normalizedRecovered).toEqual(normalizedOriginal);
        });
    });

    describe("Control Flow and Repetition Corpus", () => {
        test.each(controlFlow)("$description ($name)", ({ blocks }) => {
            const { recoveredBlocks } = runRoundTrip(blocks);
            const normalizedOriginal = normalizeBlockStructure(blocks);
            const normalizedRecovered = normalizeBlockStructure(recoveredBlocks);
            expect(normalizedRecovered).toEqual(normalizedOriginal);
        });
    });

    describe("Pitch and Pitch Expressions Corpus", () => {
        test.each(pitchAndPitches)("$description ($name)", ({ blocks }) => {
            const { recoveredBlocks } = runRoundTrip(blocks);
            const normalizedOriginal = normalizeBlockStructure(blocks);
            const normalizedRecovered = normalizeBlockStructure(recoveredBlocks);
            expect(normalizedRecovered).toEqual(normalizedOriginal);
        });
    });

    describe("Switch and Branch Selection Corpus", () => {
        test.each(switchCases)("$description ($name)", ({ blocks }) => {
            const { recoveredBlocks } = runRoundTrip(blocks);
            const normalizedOriginal = normalizeBlockStructure(blocks);
            const normalizedRecovered = normalizeBlockStructure(recoveredBlocks);
            expect(normalizedRecovered).toEqual(normalizedOriginal);
        });
    });

    describe("Second-Export Stability and Fixed-Point Invariance", () => {
        test.each(allCorpusCases)("$description ($name)", ({ blocks, name }) => {
            const result = verifySecondExportStability(blocks);
            if (!result.isStable) {
                const diagnostic = formatConformanceDiagnostics({
                    caseName: name,
                    stage: "SECOND_EXPORT_STABILITY",
                    code1: result.code1,
                    code2: result.code2,
                    originalBlocks: blocks,
                    recoveredBlocks: result.recoveredBlocks,
                    diff: { ast1: result.ast1, ast2: result.ast2 }
                });
                console.error(diagnostic);
            }
            expect(result.isStable).toBe(true);
            expect(result.ast1).toEqual(result.ast2);
        });
    });
});
