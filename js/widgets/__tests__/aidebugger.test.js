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

const AIDebuggerWidget = require("../aidebugger.js");

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

        test("_isProcessing starts as false", () => {
            const debuggerWidget = new AIDebuggerWidget();
            expect(debuggerWidget._isProcessing).toBe(false);
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

            test("returns null for number block with no value property", () => {
                const blockMap = {
                    id1: ["id1", ["number", null]]
                };
                expect(debuggerWidget._getNumericValue("id1", blockMap)).toBeUndefined();
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

            test("returns null for null blockId", () => {
                expect(debuggerWidget._getTextValue(null, {})).toBeNull();
            });

            test("returns null for text block with non-array type", () => {
                const blockMap = {
                    id1: ["id1", "text"]
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

            test("returns null for null blockId", () => {
                expect(debuggerWidget._getDrumName(null, {})).toBeNull();
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

            test("returns null for null blockId", () => {
                expect(debuggerWidget._getNamedBoxValue(null, {})).toBeNull();
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

            test("handles empty string", () => {
                expect(debuggerWidget._isBase64Data("")).toBe(false);
            });

            test("handles undefined", () => {
                expect(debuggerWidget._isBase64Data(undefined)).toBe(false);
            });

            test("recognizes various image formats", () => {
                expect(debuggerWidget._isBase64Data("data:image/jpeg;base64,/9j/4A")).toBe(true);
                expect(debuggerWidget._isBase64Data("data:image/svg+xml;base64,PHN2")).toBe(true);
                expect(debuggerWidget._isBase64Data("data:image/gif;base64,R0lGOD")).toBe(true);
            });

            test("recognizes audio formats", () => {
                expect(debuggerWidget._isBase64Data("data:audio/wav;base64,UklGR")).toBe(true);
                expect(debuggerWidget._isBase64Data("data:audio/ogg;base64,T2dnUw")).toBe(true);
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

            test("formats back block", () => {
                const blockMap = {
                    back1: ["back1", ["back", null], [null, "dist"]],
                    dist: ["dist", ["number", { value: 50 }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "back",
                    null,
                    blockMap["back1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Move Backward → 50 Steps");
            });

            test("formats right block", () => {
                const blockMap = {
                    right1: ["right1", ["right", null], [null, "angle"]],
                    angle: ["angle", ["number", { value: 90 }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "right",
                    null,
                    blockMap["right1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Rotate Right → 90°");
            });

            test("formats left block", () => {
                const blockMap = {
                    left1: ["left1", ["left", null], [null, "angle"]],
                    angle: ["angle", ["number", { value: 45 }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "left",
                    null,
                    blockMap["left1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Rotate Left → 45°");
            });

            test("formats forever block", () => {
                const blockMap = {
                    forever1: ["forever1", ["forever", null], [null]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "forever",
                    null,
                    blockMap["forever1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Forever Loop (Repeats Indefinitely)");
            });

            test("formats penup block", () => {
                const blockMap = {
                    penup1: ["penup1", ["penup", null], [null]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "penup",
                    null,
                    blockMap["penup1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Pen Up (Lifts Pen from Canvas)");
            });

            test("formats pendown block", () => {
                const blockMap = {
                    pd1: ["pd1", ["pendown", null], [null]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "pendown",
                    null,
                    blockMap["pd1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Pen Down");
            });

            test("formats newnote block", () => {
                const blockMap = {
                    note1: ["note1", ["newnote", null], [null]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "newnote",
                    null,
                    blockMap["note1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Note");
            });

            test("formats playdrum block", () => {
                const blockMap = {
                    pd1: ["pd1", ["playdrum", null], [null, "drum"]],
                    drum: ["drum", ["drumname", { value: "kick drum" }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "playdrum",
                    null,
                    blockMap["pd1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Play Drum → kick drum");
            });

            test("formats setheading block", () => {
                const blockMap = {
                    sh1: ["sh1", ["setheading", null], [null, "h"]],
                    h: ["h", ["number", { value: 180 }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "setheading",
                    null,
                    blockMap["sh1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Set Heading → 180°");
            });

            test("formats text block", () => {
                const blockMap = {
                    t1: ["t1", ["text", { value: "hello" }], [null]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "text",
                    { value: "hello" },
                    blockMap["t1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe('"hello"');
            });

            test("formats nameddo block", () => {
                const blockMap = {
                    nd1: ["nd1", ["nameddo", { value: "myAction" }], [null]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "nameddo",
                    { value: "myAction" },
                    blockMap["nd1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe('Do action --> "myAction"');
            });

            test("formats storein2 block", () => {
                const blockMap = {
                    s1: ["s1", ["storein2", { value: "counter" }], [null, "val"]],
                    val: ["val", ["number", { value: 5 }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "storein2",
                    { value: "counter" },
                    blockMap["s1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe('Store Variable "counter" → 5');
            });

            test("formats namedbox block", () => {
                const blockMap = {
                    nb1: ["nb1", ["namedbox", { value: "x" }], [null]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "namedbox",
                    { value: "x" },
                    blockMap["nb1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe('Variable: "x"');
            });

            test("formats solfege block returns null", () => {
                const blockMap = {
                    sol1: ["sol1", ["solfege", { value: "do" }], [null]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "solfege",
                    { value: "do" },
                    blockMap["sol1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBeNull();
            });

            test("formats settransposition block", () => {
                const blockMap = {
                    st1: ["st1", ["settransposition", null], [null, "val"]],
                    val: ["val", ["number", { value: 2 }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "settransposition",
                    null,
                    blockMap["st1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Set Transposition --> 2");
            });

            test("formats unknown block with value", () => {
                const blockMap = {
                    u1: ["u1", ["customblock", { value: 99 }], [null]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "customblock",
                    { value: 99 },
                    blockMap["u1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("customblock: 99");
            });

            test("formats unknown block without value", () => {
                const blockMap = {
                    u1: ["u1", ["myblock", null], [null]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "myblock",
                    null,
                    blockMap["u1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Myblock");
            });

            test("formats repeat block with numeric count", () => {
                const blockMap = {
                    r1: ["r1", ["repeat", null], [null, "cnt", null]],
                    cnt: ["cnt", ["number", { value: 4 }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "repeat",
                    null,
                    blockMap["r1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Repeat (4) Times");
            });

            test("formats divide block as duration in newnote context", () => {
                const blockMap = {
                    d1: ["d1", ["divide", null], [null, "num", "den"]],
                    num: ["num", ["number", { value: 1 }]],
                    den: ["den", ["number", { value: 4 }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "divide",
                    null,
                    blockMap["d1"],
                    blockMap,
                    1,
                    false,
                    "newnote"
                );
                expect(result).toBe("Duration --> 1/4 = 0.25");
            });

            test("formats divide block standalone", () => {
                const blockMap = {
                    d1: ["d1", ["divide", null], [null, "num", "den"]],
                    num: ["num", ["number", { value: 3 }]],
                    den: ["den", ["number", { value: 2 }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "divide",
                    null,
                    blockMap["d1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Divide Block --> 3/2 = 1.50");
            });

            test("formats plus block", () => {
                const blockMap = {
                    p1: ["p1", ["plus", null], [null, "a", "b"]],
                    a: ["a", ["number", { value: 3 }]],
                    b: ["b", ["number", { value: 7 }]]
                };
                const result = debuggerWidget._getBlockRepresentation(
                    "plus",
                    null,
                    blockMap["p1"],
                    blockMap,
                    1,
                    false,
                    null
                );
                expect(result).toBe("Add --> 3 + 7 = 10.00");
            });
        });
    });

    describe("_convertProjectToLLMFormat", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
        });

        test("returns error for non-array input", () => {
            expect(debuggerWidget._convertProjectToLLMFormat("not an array")).toBe(
                "Invalid JSON format: Expected a list at the root."
            );
        });

        test("returns warning for empty array", () => {
            expect(debuggerWidget._convertProjectToLLMFormat([])).toBe(
                "Warning: No blocks found in input!"
            );
        });

        test("processes a simple project with a forward block", () => {
            const projectData = [
                [
                    0,
                    [
                        "start",
                        {
                            id: 0,
                            xcor: 0,
                            ycor: 0,
                            heading: 0,
                            color: 0,
                            shade: 50,
                            pensize: 5,
                            grey: 100
                        }
                    ],
                    100,
                    100,
                    [null, 1, null]
                ],
                [1, ["forward", null], 0, 0, [0, 2, null]],
                [2, ["number", { value: 100 }], 0, 0, [1]]
            ];
            const result = debuggerWidget._convertProjectToLLMFormat(projectData);
            expect(result).toContain("Start of Project");
            expect(result).toContain("Start Block");
            expect(result).toContain("Move Forward → 100 Steps");
        });
    });

    describe("_addMessageToUI", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.chatLog = document.createElement("div");
        });

        test("adds user message with correct styling", () => {
            const msg = {
                type: "user",
                content: "Hello",
                timestamp: new Date().toISOString()
            };
            debuggerWidget._addMessageToUI(msg);
            const added = debuggerWidget.chatLog.children[0];
            expect(added).toBeDefined();
            expect(added.style.alignSelf).toBe("flex-end");
            expect(added.style.backgroundColor).toBe("rgb(33, 150, 243)");
        });

        test("adds bot message with correct styling", () => {
            const msg = {
                type: "bot",
                content: "Hi there",
                timestamp: new Date().toISOString()
            };
            debuggerWidget._addMessageToUI(msg);
            const added = debuggerWidget.chatLog.children[0];
            expect(added.style.alignSelf).toBe("flex-start");
        });

        test("adds system message with correct styling", () => {
            const msg = {
                type: "system",
                content: "System notice",
                timestamp: new Date().toISOString()
            };
            debuggerWidget._addMessageToUI(msg);
            const added = debuggerWidget.chatLog.children[0];
            expect(added.style.alignSelf).toBe("center");
            expect(added.style.fontStyle).toBe("italic");
        });
    });

    describe("_sendMessage", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.messageInput = document.createElement("input");
            debuggerWidget._sendToBackend = jest.fn();
            debuggerWidget._updateMessageCount = jest.fn();
            debuggerWidget._consentGiven = true;
        });

        test("does nothing with empty input", () => {
            debuggerWidget.messageInput.value = "   ";
            debuggerWidget._sendMessage();
            expect(debuggerWidget.chatHistory).toHaveLength(0);
        });

        test("does nothing when processing", () => {
            debuggerWidget.messageInput.value = "Hello";
            debuggerWidget._isProcessing = true;
            debuggerWidget._sendMessage();
            expect(debuggerWidget.chatHistory).toHaveLength(0);
        });

        test("sends message and clears input", () => {
            debuggerWidget.messageInput.value = "Hello AI";
            debuggerWidget._sendMessage();
            expect(debuggerWidget.chatHistory).toHaveLength(1);
            expect(debuggerWidget.chatHistory[0].type).toBe("user");
            expect(debuggerWidget.chatHistory[0].content).toBe("Hello AI");
            expect(debuggerWidget.messageInput.value).toBe("");
            expect(debuggerWidget._isProcessing).toBe(true);
            expect(debuggerWidget._sendToBackend).toHaveBeenCalledWith("Hello AI");
        });

        test("does not send message and shows consent banner if consent not given", () => {
            debuggerWidget._consentGiven = false;
            debuggerWidget._showConsentBanner = jest.fn();
            debuggerWidget.messageInput.value = "Hello AI";
            debuggerWidget._sendMessage();
            expect(debuggerWidget.chatHistory).toHaveLength(0);
            expect(debuggerWidget._showConsentBanner).toHaveBeenCalled();
        });
    });

    describe("_resetConversation", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.activity = { textMsg: jest.fn(), prepareExport: jest.fn(() => "[]") };
            debuggerWidget._loadProjectAndInitialize = jest.fn();
            debuggerWidget._updateMessageCount = jest.fn();
        });

        test("resets chat history and prompt count", () => {
            debuggerWidget.chatHistory = [{ type: "user", content: "test" }];
            debuggerWidget.promptCount = 5;
            const oldId = debuggerWidget.conversationId;

            debuggerWidget._resetConversation();

            expect(debuggerWidget.chatHistory).toEqual([]);
            expect(debuggerWidget.promptCount).toBe(0);
            expect(debuggerWidget.conversationId).not.toBe(oldId);
            expect(debuggerWidget._loadProjectAndInitialize).toHaveBeenCalled();
        });
    });

    describe("_showTypingIndicator and _hideTypingIndicator", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.chatLog = document.createElement("div");
        });

        test("shows and hides typing indicator", () => {
            debuggerWidget._showTypingIndicator();
            expect(debuggerWidget.chatLog.querySelectorAll(".typing-indicator").length).toBe(1);

            debuggerWidget._hideTypingIndicator();
            expect(debuggerWidget.chatLog.querySelectorAll(".typing-indicator").length).toBe(0);
        });
    });

    describe("_clearChat", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.activity = { textMsg: jest.fn() };
        });

        test("clears the chat log", () => {
            const child = document.createElement("div");
            debuggerWidget.chatLog.appendChild(child);
            expect(debuggerWidget.chatLog.children.length).toBe(1);

            debuggerWidget._clearChat();
            expect(debuggerWidget.chatLog.children.length).toBe(0);
            expect(debuggerWidget.activity.textMsg).toHaveBeenCalledWith("Chat cleared.");
        });
    });

    describe("_exportChat", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.activity = {
                textMsg: jest.fn(),
                prepareExport: jest.fn(() => "[]")
            };
        });

        test("shows message when no conversation to export", () => {
            debuggerWidget.chatHistory = [];
            debuggerWidget._exportChat();
            expect(debuggerWidget.activity.textMsg).toHaveBeenCalledWith(
                "No conversation to export."
            );
        });
    });
});
