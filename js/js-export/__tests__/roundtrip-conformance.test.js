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
    runRoundTrip
} = require("./conformance-harness");

describe("Round-Trip Conformance Test Harness", () => {
    beforeEach(() => {
        setupEnvironment();
    });

    describe("Harness Foundation", () => {
        test("resolves correct protoblock metadata for representative block types", () => {
            expect(resolveProtoBlock("start")).toEqual({ style: "hat", args: 0 });
            expect(resolveProtoBlock("action")).toEqual({ style: "hat", args: 1 });
            expect(resolveProtoBlock("repeat", 4)).toEqual({ style: "clamp", args: 2 });
            expect(resolveProtoBlock("if", 5)).toEqual({ style: "doubleclamp", args: 3 });
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
    });
});
