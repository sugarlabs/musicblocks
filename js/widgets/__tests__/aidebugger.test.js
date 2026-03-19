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

function createMockWidgetWindow() {
    const widgetBody = document.createElement("div");
    return {
        clear: jest.fn(),
        show: jest.fn(),
        onclose: null,
        onmaximize: null,
        addButton: jest.fn(() => document.createElement("button")),
        getWidgetBody: jest.fn(() => widgetBody),
        sendToCenter: jest.fn(),
        destroy: jest.fn()
    };
}

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
            expect(debuggerWidget._isProcessing).toBe(false);
            expect(debuggerWidget._isInitializing).toBe(false);
            expect(debuggerWidget._isMounted).toBe(false);
            expect(debuggerWidget._pendingRequests.size).toBe(0);
        });

        test("_generateConversationId returns unique IDs", () => {
            const debuggerWidget = new AIDebuggerWidget();
            const id1 = debuggerWidget._generateConversationId();
            const id2 = debuggerWidget._generateConversationId();

            expect(id1).not.toBe(id2);
            expect(id1.startsWith("conv_")).toBe(true);
        });
    });

    describe("Async lifecycle handling", () => {
        let debuggerWidget;
        let mockWidgetWindow;
        let mockActivity;

        beforeEach(() => {
            document.body.innerHTML = "";
            jest.clearAllMocks();

            mockWidgetWindow = createMockWidgetWindow();
            window.widgetWindows = {
                windowFor: jest.fn(() => mockWidgetWindow)
            };

            mockActivity = {
                isInputON: false,
                textMsg: jest.fn(),
                prepareExport: jest.fn(() => "[]")
            };

            global.fetch = jest.fn();
            debuggerWidget = new AIDebuggerWidget();
        });

        test("init aborts pending requests on close", () => {
            jest.spyOn(debuggerWidget, "_loadProjectAndInitialize").mockImplementation(() => {});

            debuggerWidget.init(mockActivity);

            const abortSpy = jest.fn();
            debuggerWidget._pendingRequests.add({ abort: abortSpy });
            mockWidgetWindow.onclose();

            expect(debuggerWidget._isMounted).toBe(false);
            expect(abortSpy).toHaveBeenCalled();
            expect(mockWidgetWindow.destroy).toHaveBeenCalled();
            expect(mockActivity.isInputON).toBe(false);
        });

        test("_sendMessage skips while initialization is in progress", () => {
            debuggerWidget.activity = mockActivity;
            debuggerWidget.widgetWindow = mockWidgetWindow;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.messageInput = document.createElement("input");
            debuggerWidget.sendButton = document.createElement("button");
            debuggerWidget.messageInput.value = "Help me debug";
            debuggerWidget._isMounted = true;
            debuggerWidget._isInitializing = true;

            const sendSpy = jest.spyOn(debuggerWidget, "_sendToBackend");

            debuggerWidget._sendMessage();

            expect(debuggerWidget.chatHistory).toEqual([]);
            expect(sendSpy).not.toHaveBeenCalled();
        });

        test("_sendToBackend ignores late responses after widget unmount", async () => {
            debuggerWidget.activity = mockActivity;
            debuggerWidget.widgetWindow = mockWidgetWindow;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.messageInput = document.createElement("input");
            debuggerWidget.sendButton = document.createElement("button");
            debuggerWidget._isMounted = true;

            let resolveFetch;
            global.fetch.mockImplementation(
                () =>
                    new Promise(resolve => {
                        resolveFetch = resolve;
                    })
            );

            debuggerWidget._sendToBackend("Why is this broken?");
            debuggerWidget._isMounted = false;

            resolveFetch({
                ok: true,
                json: jest.fn().mockResolvedValue({ response: "Late response" })
            });

            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            expect(debuggerWidget.chatHistory).toEqual([]);
        });

        test("_initializeBackendWithProject ignores late responses after widget unmount", async () => {
            debuggerWidget.activity = mockActivity;
            debuggerWidget.widgetWindow = mockWidgetWindow;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.messageInput = document.createElement("input");
            debuggerWidget.sendButton = document.createElement("button");
            debuggerWidget._isMounted = true;

            let resolveFetch;
            global.fetch.mockImplementation(
                () =>
                    new Promise(resolve => {
                        resolveFetch = resolve;
                    })
            );

            debuggerWidget._initializeBackendWithProject("[]");
            debuggerWidget._isMounted = false;

            resolveFetch({
                ok: true,
                json: jest.fn().mockResolvedValue({ response: "Initial analysis" })
            });

            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            expect(debuggerWidget.chatHistory).toEqual([]);
        });

        test("_resetConversation aborts pending work before reinitializing", () => {
            debuggerWidget.activity = mockActivity;
            debuggerWidget.widgetWindow = mockWidgetWindow;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.messageInput = document.createElement("input");
            debuggerWidget.sendButton = document.createElement("button");
            debuggerWidget._isMounted = true;
            debuggerWidget.chatHistory = [{ type: "user", content: "hello" }];
            debuggerWidget.promptCount = 3;

            const abortSpy = jest.fn();
            debuggerWidget._pendingRequests.add({ abort: abortSpy });
            const loadSpy = jest
                .spyOn(debuggerWidget, "_loadProjectAndInitialize")
                .mockImplementation(() => {});

            debuggerWidget._resetConversation();

            expect(abortSpy).toHaveBeenCalled();
            expect(debuggerWidget.chatHistory).toEqual([]);
            expect(debuggerWidget.promptCount).toBe(0);
            expect(loadSpy).toHaveBeenCalled();
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
