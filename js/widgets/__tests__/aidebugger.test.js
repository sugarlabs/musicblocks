/**
 * MusicBlocks
 *
 * @author kh-ub-ayb
 *
 * @copyright 2026 kh-ub-ayb
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

const fs = require("fs");
const path = require("path");

// Load the AIDebuggerWidget class by reading the source and evaluating it
const source = fs.readFileSync(path.resolve(__dirname, "../aidebugger.js"), "utf-8");
new Function(
    source + "\nif (typeof global !== 'undefined') { global.AIDebuggerWidget = AIDebuggerWidget; }"
)();

// Mock globals
global._ = str => str;
global._THIS_IS_MUSIC_BLOCKS_ = true;

describe("AIDebuggerWidget", () => {
    describe("Constructor", () => {
        test("initializes basic properties", () => {
            const debuggerWidget = new AIDebuggerWidget();

            expect(debuggerWidget.chatHistory).toEqual([]);
            expect(debuggerWidget.promptCount).toBe(0);
            expect(typeof debuggerWidget.conversationId).toBe("string");
            expect(debuggerWidget.conversationId.startsWith("conv_")).toBe(true);

            expect(debuggerWidget.activity).toBeNull();
            expect(debuggerWidget.widgetWindow).toBeNull();
            expect(debuggerWidget.chatLog).toBeNull();
            expect(debuggerWidget.messageInput).toBeNull();
            expect(debuggerWidget.sendButton).toBeNull();
        });

        test("_generateConversationId returns unique IDs", () => {
            const debuggerWidget = new AIDebuggerWidget();
            const id1 = debuggerWidget._generateConversationId();
            const id2 = debuggerWidget._generateConversationId();

            expect(id1).not.toBe(id2);
            expect(id1.startsWith("conv_")).toBe(true);
        });
    });

    describe("Debugging Helper Methods", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
        });

        describe("_getNumericValue", () => {
            test("returns null for invalid blockId or blockMap", () => {
                expect(debuggerWidget._getNumericValue(null, {})).toBeNull();
                expect(debuggerWidget._getNumericValue("id1", {})).toBeNull();
            });

            test("returns value for number block (simple)", () => {
                const blockMap = {
                    id1: ["id1", "number"]
                };
                expect(debuggerWidget._getNumericValue("id1", blockMap)).toBe("number");
            });

            test("returns value for number block (array format)", () => {
                const blockMap = {
                    id1: ["id1", ["number", { value: 42 }]]
                };
                expect(debuggerWidget._getNumericValue("id1", blockMap)).toBe(42);
            });

            test("returns null for non-number block", () => {
                const blockMap = {
                    id1: ["id1", ["text", { value: "hello" }]]
                };
                expect(debuggerWidget._getNumericValue("id1", blockMap)).toBeNull();
            });
        });

        describe("_getTextValue", () => {
            test("returns value for text block", () => {
                const blockMap = {
                    id1: ["id1", ["text", { value: "hello world" }]]
                };
                expect(debuggerWidget._getTextValue("id1", blockMap)).toBe("hello world");
            });

            test("returns null for non-text block", () => {
                const blockMap = {
                    id1: ["id1", ["number", { value: 42 }]]
                };
                expect(debuggerWidget._getTextValue("id1", blockMap)).toBeNull();
            });
        });

        describe("_getDrumName", () => {
            test("returns value for drumname block", () => {
                const blockMap = {
                    id1: ["id1", ["drumname", { value: "snare" }]]
                };
                expect(debuggerWidget._getDrumName("id1", blockMap)).toBe("snare");
            });

            test("returns null for non-drumname block", () => {
                const blockMap = {
                    id1: ["id1", ["number", { value: 42 }]]
                };
                expect(debuggerWidget._getDrumName("id1", blockMap)).toBeNull();
            });
        });

        describe("_getNamedBoxValue", () => {
            test("returns value for namedbox block", () => {
                const blockMap = {
                    id1: ["id1", ["namedbox", { value: "myVar" }]]
                };
                expect(debuggerWidget._getNamedBoxValue("id1", blockMap)).toBe("myVar");
            });

            test("returns value for namedarg block", () => {
                const blockMap = {
                    id1: ["id1", ["namedarg", { value: "myArg" }]]
                };
                expect(debuggerWidget._getNamedBoxValue("id1", blockMap)).toBe("myArg");
            });

            test("returns null for non-namedbox block", () => {
                const blockMap = {
                    id1: ["id1", ["text", { value: "hello" }]]
                };
                expect(debuggerWidget._getNamedBoxValue("id1", blockMap)).toBeNull();
            });
        });

        describe("_isBase64Data", () => {
            test("flags valid base64 image prefixes correctly", () => {
                expect(debuggerWidget._isBase64Data("data:image/png;base64,iVBORw0K")).toBe(true);
                expect(debuggerWidget._isBase64Data("data:audio/mp3;base64,SUQzBAA")).toBe(true);
            });

            test("flags invalid base64 prefixes correctly", () => {
                expect(debuggerWidget._isBase64Data("data:text/html;base64,PGh0bWw+")).toBe(false);
                expect(debuggerWidget._isBase64Data("https://example.com/image.png")).toBe(false);
                expect(debuggerWidget._isBase64Data(12345)).toBe(false);
                expect(debuggerWidget._isBase64Data(null)).toBe(false);
            });
        });

        describe("_getBlockRepresentation", () => {
            test("formats basic action block", () => {
                const blockMap = {
                    action1: ["action1", ["action", null], [null, "action_name"]],
                    action_name: ["action_name", ["text", { value: "Jump" }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "action",
                    null,
                    blockMap["action1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe('Action: "Jump"');
            });

            test("formats forward block", () => {
                const blockMap = {
                    forward1: ["forward1", ["forward", null], [null, "dist"]],
                    dist: ["dist", ["number", { value: 100 }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "forward",
                    null,
                    blockMap["forward1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Move Forward → 100 Steps");
            });

            test("formats setmasterbpm2 block", () => {
                const blockMap = {
                    bpm1: ["bpm1", ["setmasterbpm2", null], null, [null, "val"]],
                    val: ["val", ["number", { value: 120 }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "setmasterbpm2",
                    null,
                    blockMap["bpm1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Set Master BPM → 120 BPM");
            });
        });
    });
});
