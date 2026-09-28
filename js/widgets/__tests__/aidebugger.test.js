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

// Polyfill Blob.prototype.text for jsdom if absent
if (typeof Blob !== "undefined" && !Blob.prototype.text) {
    Blob.prototype.text = function () {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(this);
        });
    };
}

describe("AIDebuggerWidget", () => {
    afterEach(() => {
        global._THIS_IS_MUSIC_BLOCKS_ = true;
        jest.useRealTimers();
    });

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
            expect(debuggerWidget._lifecycle.isMounted).toBe(false);
            expect(debuggerWidget._lifecycle.pendingRequests.size).toBe(0);
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

            test.each([
                [
                    "setmasterbpm2",
                    ["bpm", ["setmasterbpm2", null], [null, "zero"]],
                    null,
                    "Set Master BPM → 0 BPM"
                ],
                [
                    "divide numerator",
                    ["divide", ["divide", null], [null, "zero", "four"]],
                    null,
                    "Divide Block --> 0/4 = 0.00"
                ],
                [
                    "newnote duration",
                    ["divide", ["divide", null], [null, "zero", "four"]],
                    "newnote",
                    "Duration --> 0/4 = 0.00"
                ],
                [
                    "divide denominator",
                    ["divide", ["divide", null], [null, "four", "zero"]],
                    null,
                    "Divide Block --> 4/0 = ?"
                ],
                [
                    "repeat",
                    ["repeat", ["repeat", null], [null, "zero", null]],
                    null,
                    "Repeat (0) Times"
                ],
                [
                    "forward",
                    ["forward", ["forward", null], [null, "zero"]],
                    null,
                    "Move Forward → 0 Steps"
                ],
                ["back", ["back", ["back", null], [null, "zero"]], null, "Move Backward → 0 Steps"],
                ["right", ["right", ["right", null], [null, "zero"]], null, "Rotate Right → 0°"],
                ["left", ["left", ["left", null], [null, "zero"]], null, "Rotate Left → 0°"],
                ["show", ["show", ["show", null], [null, null, "zero"]], null, "Show Number: 0"],
                [
                    "increment",
                    ["increment", ["increment", null], [null, "zero", "zero"]],
                    null,
                    "Increment --> Color: 0, Amount: 0"
                ],
                [
                    "arc",
                    ["arc", ["arc", null], [null, null, "zero", "zero"]],
                    null,
                    "Draw Arc --> Angle: 0°, Radius: 0"
                ],
                [
                    "plus",
                    ["plus", ["plus", null], [null, "zero", "zero"]],
                    null,
                    "Add --> 0 + 0 = 0.00"
                ],
                [
                    "pitch",
                    ["pitch", ["pitch", null], [null, "solfege", "zero"]],
                    null,
                    "Pitch --> Solfege: do, Octave: 0"
                ],
                [
                    "settransposition",
                    ["settransposition", ["settransposition", null], [null, "zero"]],
                    null,
                    "Set Transposition --> 0"
                ]
            ])("preserves zero in %s block output", (label, block, parentBlockType, expected) => {
                const blockType = block[1][0];
                const blockMap = {
                    [block[0]]: block,
                    zero: ["zero", ["number", { value: 0 }]],
                    four: ["four", ["number", { value: 4 }]],
                    solfege: ["solfege", ["solfege", { value: "do" }]]
                };

                expect(
                    debuggerWidget._getBlockRepresentation(
                        blockType,
                        null,
                        block,
                        blockMap,
                        1,
                        false,
                        parentBlockType
                    )
                ).toBe(expected);
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
            debuggerWidget.widgetWindow = {};
            debuggerWidget._lifecycle.isMounted = true;
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
            debuggerWidget.widgetWindow = {};
            debuggerWidget._lifecycle.isMounted = true;
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

        test("shows consent banner and does not send message if consent not given", () => {
            debuggerWidget._consentGiven = false;
            debuggerWidget.messageInput.value = "Hello AI";
            debuggerWidget._showConsentBanner = jest.fn();
            debuggerWidget._sendMessage();
            expect(debuggerWidget.chatHistory).toHaveLength(0);
            expect(debuggerWidget._showConsentBanner).toHaveBeenCalled();
            expect(debuggerWidget._sendToBackend).not.toHaveBeenCalled();
        });

        test("sends message and clears input", () => {
            debuggerWidget.messageInput.value = "Hello AI";
            debuggerWidget._consentGiven = true;
            debuggerWidget._sendMessage();
            expect(debuggerWidget.chatHistory).toHaveLength(1);
            expect(debuggerWidget.chatHistory[0].type).toBe("user");
            expect(debuggerWidget.chatHistory[0].content).toBe("Hello AI");
            expect(debuggerWidget.messageInput.value).toBe("");
            expect(debuggerWidget._isProcessing).toBe(true);
            expect(debuggerWidget._sendToBackend).toHaveBeenCalledWith("Hello AI");
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
            debuggerWidget.widgetWindow = {};
            debuggerWidget._lifecycle.isMounted = true;
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test("shows and hides typing indicator", () => {
            debuggerWidget._showTypingIndicator();
            expect(debuggerWidget.chatLog.querySelectorAll(".typing-indicator").length).toBe(1);

            debuggerWidget._hideTypingIndicator();
            expect(debuggerWidget.chatLog.querySelectorAll(".typing-indicator").length).toBe(0);
        });

        test("animates typing indicator dots over time", () => {
            jest.useFakeTimers();
            debuggerWidget._showTypingIndicator();
            const indicator = debuggerWidget.chatLog.querySelector(".typing-indicator");
            expect(indicator.textContent).toBe("Debugger is typing...");

            jest.advanceTimersByTime(500);
            expect(indicator.textContent).toBe("Debugger is typing.");

            jest.advanceTimersByTime(500);
            expect(indicator.textContent).toBe("Debugger is typing..");

            debuggerWidget._hideTypingIndicator();
            expect(jest.getTimerCount()).toBe(0);
            jest.useRealTimers();
        });
    });

    describe("Async lifecycle handling", () => {
        let debuggerWidget;
        let mockWidgetWindow;
        let mockActivity;

        beforeEach(() => {
            document.body.innerHTML = "";
            jest.clearAllMocks();

            const widgetBody = document.createElement("div");
            mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                onclose: null,
                onmaximize: null,
                addButton: jest.fn(() => document.createElement("button")),
                getWidgetBody: jest.fn(() => widgetBody),
                sendToCenter: jest.fn(),
                destroy: jest.fn()
            };
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
            jest.spyOn(debuggerWidget, "_showConsentBanner").mockImplementation(() => {});

            debuggerWidget.init(mockActivity);

            const abortSpy = jest.fn();
            debuggerWidget._lifecycle.pendingRequests.add({ abort: abortSpy });
            mockWidgetWindow.onclose();

            expect(debuggerWidget._lifecycle.isMounted).toBe(false);
            expect(abortSpy).toHaveBeenCalled();
            expect(mockWidgetWindow.destroy).toHaveBeenCalled();
            expect(mockActivity.isInputON).toBe(false);
        });

        test("_sendMessage skips after the widget is closed", () => {
            debuggerWidget.activity = mockActivity;
            debuggerWidget.widgetWindow = mockWidgetWindow;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.messageInput = document.createElement("input");
            debuggerWidget.messageInput.value = "Help me debug";
            debuggerWidget._lifecycle.isMounted = false;
            debuggerWidget._consentGiven = true;

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
            debuggerWidget._lifecycle.isMounted = true;

            let resolveFetch;
            global.fetch.mockImplementation(
                () =>
                    new Promise(resolve => {
                        resolveFetch = resolve;
                    })
            );

            debuggerWidget._sendToBackend("Why is this broken?");
            debuggerWidget._lifecycle.isMounted = false;

            resolveFetch({
                ok: true,
                json: jest.fn().mockResolvedValue({ response: "Late reply" })
            });

            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            expect(debuggerWidget.chatHistory).toEqual([]);
        });

        test("_sendToBackend leaves a reopened widget untouched", async () => {
            debuggerWidget.activity = mockActivity;
            debuggerWidget.widgetWindow = mockWidgetWindow;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.messageInput = document.createElement("input");
            debuggerWidget._lifecycle.mount();

            let resolveFetch;
            global.fetch.mockImplementation(
                () =>
                    new Promise(resolve => {
                        resolveFetch = resolve;
                    })
            );

            debuggerWidget._sendToBackend("Why is this broken?");

            // Closed and opened again before the response arrives.
            debuggerWidget._lifecycle.unmount();
            debuggerWidget._lifecycle.mount();
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget._isProcessing = true;

            resolveFetch({
                ok: true,
                json: jest.fn().mockResolvedValue({ response: "Late reply" })
            });

            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            expect(debuggerWidget.chatHistory).toEqual([]);
            expect(debuggerWidget.chatLog.children.length).toBe(0);
            expect(debuggerWidget._isProcessing).toBe(true);
        });

        test("_initializeBackendWithProject ignores late responses after widget unmount", async () => {
            debuggerWidget.activity = mockActivity;
            debuggerWidget.widgetWindow = mockWidgetWindow;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.messageInput = document.createElement("input");
            debuggerWidget._lifecycle.isMounted = true;

            let resolveFetch;
            global.fetch.mockImplementation(
                () =>
                    new Promise(resolve => {
                        resolveFetch = resolve;
                    })
            );

            debuggerWidget._initializeBackendWithProject("[]");
            debuggerWidget._lifecycle.isMounted = false;

            resolveFetch({ ok: true, json: jest.fn().mockResolvedValue({ response: "Analysis" }) });

            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            expect(debuggerWidget.chatHistory).toEqual([]);
        });

        test("_resetConversation aborts pending work before reinitializing", () => {
            debuggerWidget.activity = mockActivity;
            debuggerWidget.widgetWindow = mockWidgetWindow;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget._lifecycle.isMounted = true;
            debuggerWidget.chatHistory = [{ type: "user", content: "hello" }];
            debuggerWidget.promptCount = 3;

            const abortSpy = jest.fn();
            debuggerWidget._lifecycle.pendingRequests.add({ abort: abortSpy });
            const loadSpy = jest
                .spyOn(debuggerWidget, "_loadProjectAndInitialize")
                .mockImplementation(() => {});

            debuggerWidget._resetConversation();

            expect(abortSpy).toHaveBeenCalled();
            expect(debuggerWidget.chatHistory).toEqual([]);
            expect(debuggerWidget.promptCount).toBe(0);
            expect(loadSpy).toHaveBeenCalled();
        });

        test("reset keeps the replacement typing indicator when the aborted request settles", async () => {
            debuggerWidget.activity = mockActivity;
            debuggerWidget.widgetWindow = mockWidgetWindow;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.messageInput = document.createElement("input");
            debuggerWidget._lifecycle.isMounted = true;
            debuggerWidget._consentGiven = true;

            let resolveFirst;
            global.fetch.mockImplementation(() => {
                if (resolveFirst) {
                    return Promise.resolve({
                        ok: true,
                        json: jest.fn().mockResolvedValue({ response: "Replacement" })
                    });
                }

                return new Promise(resolve => {
                    resolveFirst = resolve;
                });
            });

            debuggerWidget._sendToBackend("Waiting message");
            debuggerWidget._resetConversation();

            const indicators = debuggerWidget.chatLog.querySelectorAll(".typing-indicator");
            expect(indicators.length).toBe(1);

            resolveFirst({
                ok: true,
                json: jest.fn().mockResolvedValue({ response: "Aborted reply" })
            });

            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            expect(debuggerWidget.chatLog.querySelectorAll(".typing-indicator").length).toBe(1);
        });

        test("_addMessageToUI returns early if widget is not active", () => {
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.widgetWindow = null;
            debuggerWidget._lifecycle.isMounted = false;
            debuggerWidget._addMessageToUI({ type: "user", content: "test" });
            expect(debuggerWidget.chatLog.children.length).toBe(0);
        });

        test("_showTypingIndicator returns null if widget is not active", () => {
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.widgetWindow = null;
            debuggerWidget._lifecycle.isMounted = false;
            expect(debuggerWidget._showTypingIndicator()).toBeNull();
        });

        test("_hideTypingIndicator and _removeTypingIndicator return early if chatLog is missing", () => {
            debuggerWidget.chatLog = null;
            expect(() => debuggerWidget._hideTypingIndicator()).not.toThrow();
            expect(() => debuggerWidget._removeTypingIndicator(null)).not.toThrow();
        });

        test("_removeTypingIndicator preserves other indicators when removing a specific one", () => {
            debuggerWidget.chatLog = document.createElement("div");
            const ind1 = document.createElement("div");
            ind1.className = "typing-indicator";
            const ind2 = document.createElement("div");
            ind2.className = "typing-indicator";
            debuggerWidget.chatLog.appendChild(ind1);
            debuggerWidget.chatLog.appendChild(ind2);

            debuggerWidget._removeTypingIndicator(ind1);
            expect(debuggerWidget.chatLog.contains(ind1)).toBe(false);
            expect(debuggerWidget.chatLog.contains(ind2)).toBe(true);
        });

        test("_sendToBackend ignores network error when widget is unmounted", async () => {
            debuggerWidget.activity = mockActivity;
            debuggerWidget.widgetWindow = mockWidgetWindow;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget._lifecycle.mount();

            let rejectFetch;
            global.fetch.mockImplementation(
                () =>
                    new Promise((_, reject) => {
                        rejectFetch = reject;
                    })
            );

            debuggerWidget._sendToBackend("prompt");
            debuggerWidget._lifecycle.unmount();

            rejectFetch(new Error("Network failed"));

            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            expect(debuggerWidget.chatHistory).toEqual([]);
        });

        test("_initializeBackendWithProject ignores error when widget is unmounted", async () => {
            debuggerWidget.activity = mockActivity;
            debuggerWidget.widgetWindow = mockWidgetWindow;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget._lifecycle.mount();

            let rejectFetch;
            global.fetch.mockImplementation(
                () =>
                    new Promise((_, reject) => {
                        rejectFetch = reject;
                    })
            );

            debuggerWidget._initializeBackendWithProject("[]");
            debuggerWidget._lifecycle.unmount();

            rejectFetch(new Error("Init failed"));

            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();

            expect(debuggerWidget.chatHistory).toEqual([]);
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
        let originalCreateObjectURL;
        let originalRevokeObjectURL;
        let createElementSpy;
        let clickMock;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.activity = {
                textMsg: jest.fn(),
                prepareExport: jest.fn(() => "[]")
            };

            originalCreateObjectURL = global.URL.createObjectURL;
            originalRevokeObjectURL = global.URL.revokeObjectURL;
            global.URL.createObjectURL = jest.fn(() => "blob:mock-export-url");
            global.URL.revokeObjectURL = jest.fn();

            clickMock = jest.fn();
            const originalCreateElement = document.createElement.bind(document);
            createElementSpy = jest.spyOn(document, "createElement").mockImplementation(tag => {
                const el = originalCreateElement(tag);
                if (tag === "a") {
                    el.click = clickMock;
                }
                return el;
            });
        });

        afterEach(() => {
            createElementSpy.mockRestore();
            global.URL.createObjectURL = originalCreateObjectURL;
            global.URL.revokeObjectURL = originalRevokeObjectURL;
            global._THIS_IS_MUSIC_BLOCKS_ = true;
        });

        test("shows message when no conversation to export", () => {
            debuggerWidget.chatHistory = [];
            debuggerWidget._exportChat();
            expect(debuggerWidget.activity.textMsg).toHaveBeenCalledWith(
                "No conversation to export."
            );
        });

        test("exports full chat history and project representation when messages exist", async () => {
            debuggerWidget.chatHistory = [
                { type: "user", content: "How does repeat work?" },
                { type: "bot", content: "Repeat repeats blocks." }
            ];
            debuggerWidget.activity.prepareExport = jest.fn(() =>
                JSON.stringify([
                    ["b1", "start", null, null, ["b2"]],
                    ["b2", "forward", null, null, []]
                ])
            );

            debuggerWidget._exportChat();

            expect(global.URL.createObjectURL).toHaveBeenCalled();
            expect(clickMock).toHaveBeenCalled();
            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-export-url");
            expect(debuggerWidget.activity.textMsg).toHaveBeenCalledWith(
                "Chat exported successfully."
            );

            const blob = global.URL.createObjectURL.mock.calls[0][0];
            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe("text/plain");
            const text = await blob.text();
            expect(text).toContain("Music Blocks Debugger Chat Export\n");
            expect(text).toContain("Generated at: ");
            expect(text).toContain("Project Code (Human Readable Format):\n");
            expect(text).toContain("Chat History:\n\n");
            expect(text).toContain("User:\nHow does repeat work?\n\n");
            expect(text).toContain("Music Blocks Debugger:\nRepeat repeats blocks.\n\n");
        });

        test("handles prepareExport JSON parse error during chat export gracefully", async () => {
            debuggerWidget.chatHistory = [{ type: "user", content: "Hello" }];
            debuggerWidget.activity.prepareExport = jest.fn(() => "invalid json {{");

            debuggerWidget._exportChat();

            expect(debuggerWidget.activity.textMsg).toHaveBeenCalledWith(
                "Chat exported successfully."
            );

            const blob = global.URL.createObjectURL.mock.calls[0][0];
            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe("text/plain");
            const text = await blob.text();
            expect(text).toContain("Could not convert project to readable format");
            expect(text).toContain("User:\nHello\n\n");
        });

        test("handles prepareExport exception during chat export gracefully", async () => {
            debuggerWidget.chatHistory = [{ type: "user", content: "Hello" }];
            debuggerWidget.activity.prepareExport = jest.fn(() => {
                throw new Error("Export failed");
            });

            debuggerWidget._exportChat();

            expect(debuggerWidget.activity.textMsg).toHaveBeenCalledWith(
                "Debugger error: Could not retrieve project data for export."
            );
            expect(debuggerWidget.activity.textMsg).toHaveBeenCalledWith(
                "Chat exported successfully."
            );

            const blob = global.URL.createObjectURL.mock.calls[0][0];
            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe("text/plain");
            const text = await blob.text();
            expect(text).toContain("Could not convert project to readable format");
            expect(text).toContain("User:\nHello\n\n");
        });

        test("exports using Turtle Blocks branding when _THIS_IS_MUSIC_BLOCKS_ is false", async () => {
            global._THIS_IS_MUSIC_BLOCKS_ = false;
            debuggerWidget.chatHistory = [
                { type: "user", content: "Hi" },
                { type: "bot", content: "Hello Turtle" }
            ];

            debuggerWidget._exportChat();

            expect(debuggerWidget.activity.textMsg).toHaveBeenCalledWith(
                "Chat exported successfully."
            );

            const blob = global.URL.createObjectURL.mock.calls[0][0];
            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe("text/plain");
            const text = await blob.text();
            expect(text).toContain("Turtle Blocks Debugger Chat Export\n");
            expect(text).toContain("User:\nHi\n\n");
            expect(text).toContain("Turtle Blocks Debugger:\nHello Turtle\n\n");
        });
    });

    describe("Backend URL and Hostname Resolution", () => {
        test("resolves localhost backend URL", () => {
            const w = new AIDebuggerWidget();
            w.chatLog = document.createElement("div");
            w._showConsentBanner();
            expect(w.chatLog.querySelector("strong").textContent).toBe("http://localhost:8000");
        });
    });

    describe("init and Widget Window Lifecycle", () => {
        let debuggerWidget;
        let mockActivity;
        let mockWidgetWindow;
        let originalWidgetWindows;

        beforeEach(() => {
            mockActivity = {
                isInputON: false,
                textMsg: jest.fn(),
                prepareExport: jest.fn(() => "[]")
            };

            const body = document.createElement("div");
            let maximized = false;
            mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                destroy: jest.fn(),
                sendToCenter: jest.fn(),
                isMaximized: jest.fn(() => maximized),
                setMaximized: val => {
                    maximized = val;
                },
                getWidgetBody: jest.fn(() => body),
                addButton: jest.fn((icon, size, title) => {
                    const btn = document.createElement("button");
                    btn.title = title;
                    return btn;
                }),
                onclose: null,
                onmaximize: null
            };

            originalWidgetWindows = window.widgetWindows;
            window.widgetWindows = {
                windowFor: jest.fn(() => mockWidgetWindow)
            };

            debuggerWidget = new AIDebuggerWidget();
        });

        afterEach(() => {
            window.widgetWindows = originalWidgetWindows;
            global._THIS_IS_MUSIC_BLOCKS_ = true;
        });

        test("initializes window, sets dimensions, event handlers, and buttons", () => {
            debuggerWidget.init(mockActivity);

            expect(mockActivity.isInputON).toBe(true);
            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(debuggerWidget, "Debugger");
            expect(mockWidgetWindow.clear).toHaveBeenCalled();
            expect(mockWidgetWindow.show).toHaveBeenCalled();
            expect(mockWidgetWindow.sendToCenter).toHaveBeenCalled();
            expect(mockActivity.textMsg).toHaveBeenCalledWith("Debugger initialized");

            expect(mockWidgetWindow.getWidgetBody().style.width).toBe("900px");
            expect(mockWidgetWindow.getWidgetBody().style.height).toBe("600px");

            expect(mockWidgetWindow.addButton).toHaveBeenCalledWith(
                "reload.svg",
                32,
                "Reset conversation"
            );
            expect(mockWidgetWindow.addButton).toHaveBeenCalledWith(
                "download.svg",
                32,
                "Export chat"
            );

            // Verify reset button click triggers _resetConversation
            const resetSpy = jest
                .spyOn(debuggerWidget, "_resetConversation")
                .mockImplementation(() => {});
            debuggerWidget._resetButton.onclick();
            expect(resetSpy).toHaveBeenCalled();
            resetSpy.mockRestore();

            // Verify export button click triggers _exportChat
            const exportSpy = jest
                .spyOn(debuggerWidget, "_exportChat")
                .mockImplementation(() => {});
            debuggerWidget._exportButton.onclick();
            expect(exportSpy).toHaveBeenCalled();
            exportSpy.mockRestore();

            // Verify onclose handler
            const hideTypingSpy = jest.spyOn(debuggerWidget, "_hideTypingIndicator");
            mockWidgetWindow.onclose();
            expect(hideTypingSpy).toHaveBeenCalled();
            expect(mockWidgetWindow.destroy).toHaveBeenCalled();
            expect(mockActivity.isInputON).toBe(false);

            // Verify onmaximize handler binds to _scale
            expect(typeof mockWidgetWindow.onmaximize).toBe("function");
        });

        test("preserves existing conversationId if already generated", () => {
            debuggerWidget.conversationId = "conv_pre_existing_id";
            debuggerWidget.init(mockActivity);
            expect(debuggerWidget.conversationId).toBe("conv_pre_existing_id");
        });

        test("generates new conversationId if null when initializing", () => {
            debuggerWidget.conversationId = null;
            debuggerWidget.init(mockActivity);
            expect(debuggerWidget.conversationId).not.toBeNull();
            expect(debuggerWidget.conversationId.startsWith("conv_")).toBe(true);
        });
    });

    describe("Layout & Chat UI Elements", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            const body = document.createElement("div");
            debuggerWidget.widgetWindow = {
                getWidgetBody: () => body
            };
            debuggerWidget._lifecycle.mount();
            debuggerWidget._createLayout();
        });

        test("sets up messageInput focus and blur styling", () => {
            expect(debuggerWidget.messageInput).not.toBeNull();

            debuggerWidget.messageInput.onfocus();
            expect(["#2196F3", "rgb(33, 150, 243)"]).toContain(
                debuggerWidget.messageInput.style.borderColor
            );
            expect(debuggerWidget.messageInput.style.boxShadow).toBe(
                "0 0 5px rgba(33, 150, 243, 0.3)"
            );

            debuggerWidget.messageInput.onblur();
            expect(["#ddd", "rgb(221, 221, 221)"]).toContain(
                debuggerWidget.messageInput.style.borderColor
            );
            expect(debuggerWidget.messageInput.style.boxShadow).toBe("none");
        });

        test("sets up sendButton mouseover and mouseout styling", () => {
            expect(debuggerWidget.sendButton).not.toBeNull();

            debuggerWidget.sendButton.onmouseover();
            expect(["#1976D2", "rgb(25, 118, 210)"]).toContain(
                debuggerWidget.sendButton.style.backgroundColor
            );

            debuggerWidget.sendButton.onmouseout();
            expect(["#2196F3", "rgb(33, 150, 243)"]).toContain(
                debuggerWidget.sendButton.style.backgroundColor
            );
        });

        test("clicking sendButton triggers _sendMessage", () => {
            const sendSpy = jest.spyOn(debuggerWidget, "_sendMessage").mockImplementation(() => {});
            debuggerWidget.sendButton.onclick();
            expect(sendSpy).toHaveBeenCalled();
            sendSpy.mockRestore();
        });

        test("Enter keypress on messageInput triggers _sendMessage, other keys do not", () => {
            const sendSpy = jest.spyOn(debuggerWidget, "_sendMessage").mockImplementation(() => {});

            debuggerWidget.messageInput.onkeypress({ key: "a" });
            expect(sendSpy).not.toHaveBeenCalled();

            debuggerWidget.messageInput.onkeypress({ key: "Enter" });
            expect(sendSpy).toHaveBeenCalled();
            sendSpy.mockRestore();
        });

        test("_addWelcomeMessage respects _THIS_IS_MUSIC_BLOCKS_ flag", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = true;
            debuggerWidget._addWelcomeMessage();
            expect(debuggerWidget.chatLog.textContent).toContain(
                "Welcome to Music Blocks Debugger!"
            );

            global._THIS_IS_MUSIC_BLOCKS_ = false;
            debuggerWidget._addWelcomeMessage();
            expect(debuggerWidget.chatLog.textContent).toContain(
                "Welcome to Turtle Blocks Debugger!"
            );
        });
    });

    describe("Privacy Consent Banner Lifecycle", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.widgetWindow = {};
            debuggerWidget._lifecycle.mount();
        });

        test("renders consent banner with title, description, and action buttons", () => {
            debuggerWidget._showConsentBanner();
            const banner = debuggerWidget.chatLog.querySelector("div");
            expect(banner).not.toBeNull();
            expect(banner.textContent).toContain("Before we start");
            expect(banner.textContent).toContain(
                "The AI Debugger will send your current project data"
            );
            const buttons = banner.querySelectorAll("button");
            expect(buttons.length).toBe(2);
            expect(buttons[0].textContent).toBe("Analyze my project");
            expect(buttons[1].textContent).toBe("Cancel");
        });

        test("accepting banner sets consent, removes banner, and loads project", () => {
            const loadProjectSpy = jest
                .spyOn(debuggerWidget, "_loadProjectAndInitialize")
                .mockImplementation(() => {});

            debuggerWidget._showConsentBanner();
            const acceptBtn = debuggerWidget.chatLog.querySelectorAll("button")[0];
            acceptBtn.onclick();

            expect(debuggerWidget._consentGiven).toBe(true);
            expect(debuggerWidget.chatLog.querySelector("button")).toBeNull();
            expect(loadProjectSpy).toHaveBeenCalled();
            loadProjectSpy.mockRestore();
        });

        test("canceling banner removes banner and adds system decline message", () => {
            debuggerWidget._showConsentBanner();
            const declineBtn = debuggerWidget.chatLog.querySelectorAll("button")[1];
            declineBtn.onclick();

            expect(debuggerWidget._consentGiven).toBe(false);
            expect(debuggerWidget.chatLog.querySelector("button")).toBeNull();
            expect(debuggerWidget.chatLog.textContent).toContain(
                "AI analysis was not started. You can type a question below, but project data will not be sent until you agree."
            );
        });
    });

    describe("Project Loading and Backend Initialization", () => {
        let debuggerWidget;
        let mockActivity;
        let originalFetch;
        const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

        beforeEach(() => {
            originalFetch = global.fetch;
            global.fetch = jest.fn();

            mockActivity = {
                textMsg: jest.fn(),
                prepareExport: jest.fn(() => JSON.stringify([["b1", "start", null, null, []]]))
            };

            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.activity = mockActivity;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.widgetWindow = {};
            debuggerWidget._lifecycle.mount();
        });

        afterEach(() => {
            global.fetch = originalFetch;
        });

        test("_loadProjectAndInitialize initiates backend initialization with project data", () => {
            const initBackendSpy = jest
                .spyOn(debuggerWidget, "_initializeBackendWithProject")
                .mockImplementation(() => {});

            debuggerWidget._loadProjectAndInitialize();

            expect(debuggerWidget.chatLog.textContent).toContain(
                "Loading your current project and initializing AI assistant..."
            );
            expect(initBackendSpy).toHaveBeenCalledWith(
                JSON.stringify([["b1", "start", null, null, []]])
            );
            initBackendSpy.mockRestore();
        });

        test("_loadProjectAndInitialize catches invalid JSON format in prepareExport", () => {
            mockActivity.prepareExport = jest.fn(() => "invalid json {");
            const initBackendSpy = jest
                .spyOn(debuggerWidget, "_initializeBackendWithProject")
                .mockImplementation(() => {});
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            debuggerWidget._loadProjectAndInitialize();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Debugger error: Invalid project data format."
            );
            expect(initBackendSpy).toHaveBeenCalledWith("invalid json {");

            errorSpy.mockRestore();
            initBackendSpy.mockRestore();
        });

        test("_loadProjectAndInitialize handles general throw from prepareExport", () => {
            mockActivity.prepareExport = jest.fn(() => {
                throw new Error("Disk read error");
            });
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const welcomeSpy = jest.spyOn(debuggerWidget, "_addWelcomeMessage");

            debuggerWidget._loadProjectAndInitialize();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Debugger error: Could not load project data."
            );
            expect(debuggerWidget.chatLog.textContent).toContain(
                "Could not load project data. Starting with basic assistant..."
            );
            expect(welcomeSpy).toHaveBeenCalled();

            errorSpy.mockRestore();
            welcomeSpy.mockRestore();
        });

        test("_initializeBackendWithProject sends project data and processes successful response", async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ response: "Hello! I see your start block." })
            });

            debuggerWidget.chatHistory = [{ type: "user", content: "Previous note" }];
            debuggerWidget._initializeBackendWithProject("[]");

            expect(global.fetch).toHaveBeenCalledWith(
                "http://localhost:8000/analyze",
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                })
            );

            await flushPromises();

            expect(debuggerWidget.promptCount).toBe(1);
            expect(debuggerWidget.chatHistory.length).toBe(2);
            expect(debuggerWidget.chatHistory[1].content).toBe("Hello! I see your start block.");
            expect(debuggerWidget.chatLog.textContent).toContain("Hello! I see your start block.");
        });

        test("_initializeBackendWithProject handles missing response field from backend", async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            });
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            debuggerWidget._initializeBackendWithProject("[]");

            await flushPromises();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Server error: No initial response from AI backend."
            );
            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Server error: Failed to initialize AI debugger."
            );
            expect(debuggerWidget.chatLog.textContent).toContain(
                "Could not reach the AI assistant. Please check your connection and try again."
            );
            errorSpy.mockRestore();
        });

        test("_initializeBackendWithProject handles non-OK HTTP response", async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 503,
                statusText: "Service Unavailable"
            });
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            debuggerWidget._initializeBackendWithProject("[]");

            await flushPromises();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Server error: Failed to initialize AI debugger."
            );
            expect(debuggerWidget.chatLog.textContent).toContain(
                "Could not reach the AI assistant. Please check your connection and try again."
            );
            errorSpy.mockRestore();
        });

        test("_initializeBackendWithProject handles network/fetch TypeError", async () => {
            global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            debuggerWidget._initializeBackendWithProject("[]");

            await flushPromises();

            expect(errorSpy).toHaveBeenCalledWith("Network/CORS error. Backend connection failed");
            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Server error: Failed to initialize AI debugger."
            );
            errorSpy.mockRestore();
        });
    });

    describe("Backend Message Dispatching (_sendToBackend)", () => {
        let debuggerWidget;
        let mockActivity;
        let originalFetch;
        const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

        beforeEach(() => {
            originalFetch = global.fetch;
            global.fetch = jest.fn();

            mockActivity = {
                textMsg: jest.fn(),
                prepareExport: jest.fn(() => JSON.stringify([["b1", "start", null, null, []]]))
            };

            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.activity = mockActivity;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.widgetWindow = {};
            debuggerWidget._lifecycle.mount();
            debuggerWidget._isProcessing = true;
        });

        afterEach(() => {
            global.fetch = originalFetch;
        });

        test("handles prepareExport error by defaulting projectData to empty array string", async () => {
            mockActivity.prepareExport = jest.fn(() => {
                throw new Error("Export error");
            });
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ response: "Bot answer" })
            });

            debuggerWidget._sendToBackend("Explain project");

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Debugger error: Could not prepare project data."
            );
            expect(global.fetch).toHaveBeenCalledWith(
                "http://localhost:8000/analyze",
                expect.objectContaining({
                    body: expect.stringContaining('"code":"[]"')
                })
            );

            await flushPromises();

            expect(debuggerWidget._isProcessing).toBe(false);
            errorSpy.mockRestore();
        });

        test("filters system messages and maps user/assistant history correctly in payload", async () => {
            debuggerWidget.chatHistory = [
                { type: "system", content: "System message" },
                { type: "user", content: "User question" },
                { type: "bot", content: "Bot answer" }
            ];

            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ response: "Next answer" })
            });

            debuggerWidget._sendToBackend("Follow-up question");

            const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
            expect(requestBody.history).toEqual([
                { role: "user", content: "User question" },
                { role: "assistant", content: "Bot answer" }
            ]);
            expect(requestBody.prompt).toBe("Follow-up question");
            expect(requestBody.prompt_count).toBe(1);

            await flushPromises();

            expect(debuggerWidget._isProcessing).toBe(false);
            expect(debuggerWidget.chatHistory[debuggerWidget.chatHistory.length - 1].content).toBe(
                "Next answer"
            );
        });

        test("handles missing response property from backend", async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({})
            });
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            debuggerWidget._sendToBackend("Prompt");

            await flushPromises();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Server error: Invalid response from AI backend."
            );
            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Server error: Unable to connect to AI backend."
            );
            expect(debuggerWidget._isProcessing).toBe(false);
            errorSpy.mockRestore();
        });

        test("handles non-200 HTTP response and displays fallback response", async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: "Internal Server Error"
            });
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            debuggerWidget._sendToBackend("Prompt");

            await flushPromises();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Server error: Unable to connect to AI backend."
            );
            expect(debuggerWidget.chatLog.textContent).toContain(
                "Could not reach the AI assistant. Please check your connection and try again."
            );
            expect(debuggerWidget._isProcessing).toBe(false);
            errorSpy.mockRestore();
        });

        test("handles network fetch TypeError and logs CORS warning", async () => {
            global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            debuggerWidget._sendToBackend("Prompt");

            await flushPromises();

            expect(errorSpy).toHaveBeenCalledWith("Network/CORS error. Backend connection failed");
            expect(debuggerWidget.chatLog.textContent).toContain(
                "Could not reach the AI assistant. Please check your connection and try again."
            );
            expect(debuggerWidget._isProcessing).toBe(false);
            errorSpy.mockRestore();
        });
    });

    describe("Window Scaling (_scale)", () => {
        let debuggerWidget;
        let mockWidgetWindow;
        let isMax;

        beforeEach(() => {
            isMax = false;
            const body = document.createElement("div");
            mockWidgetWindow = {
                isMaximized: () => isMax,
                getWidgetBody: () => body
            };
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.widgetWindow = mockWidgetWindow;
        });

        test("scales to 100% when maximized", () => {
            isMax = true;
            debuggerWidget._scale();
            expect(mockWidgetWindow.getWidgetBody().style.width).toBe("100%");
            expect(mockWidgetWindow.getWidgetBody().style.height).toBe("100%");
        });

        test("scales to fixed dimensions when not maximized", () => {
            isMax = false;
            debuggerWidget._scale();
            expect(mockWidgetWindow.getWidgetBody().style.width).toBe("900px");
            expect(mockWidgetWindow.getWidgetBody().style.height).toBe("600px");
        });
    });

    describe("Advanced Block AST & LLM Representation Branches", () => {
        let debuggerWidget;
        const defaultTurtleArgs = {
            id: 0,
            xcor: 0,
            ycor: 0,
            heading: 0,
            color: 0,
            shade: 50,
            pensize: 5,
            grey: 100
        };

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
        });

        test("sanitizes base64 data in block args to 'data'", () => {
            const projectData = [
                ["b1", ["start", defaultTurtleArgs], null, null, ["b2"]],
                [
                    "b2",
                    [
                        "text",
                        {
                            value: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                        }
                    ],
                    null,
                    null,
                    []
                ]
            ];
            const text = debuggerWidget._convertProjectToLLMFormat(projectData);
            expect(text).toContain('"data"');
        });

        test("traverses vspace and hidden blocks correctly", () => {
            const projectData = [
                ["b1", ["start", defaultTurtleArgs], null, null, ["v1"]],
                ["v1", "vspace", null, null, ["h1"]],
                ["h1", "hidden", null, null, ["f1"]],
                ["f1", "forward", null, null, []]
            ];
            const text = debuggerWidget._convertProjectToLLMFormat(projectData);
            expect(text).toContain("Forward");
        });

        test("formats disconnected unvisited blocks in projectData", () => {
            const projectData = [
                ["b1", ["start", defaultTurtleArgs], null, null, []],
                ["d1", "forward", null, null, []],
                ["v_skip", "vspace", null, null, []],
                ["h_skip", "hidden", null, null, []]
            ];
            const text = debuggerWidget._convertProjectToLLMFormat(projectData);
            expect(text).toContain("Start Block");
            expect(text).toContain("Forward");
        });

        test("formats setmasterbpm2 with nested divide block for beat value", () => {
            const blockMap = {
                bpm1: ["bpm1", "setmasterbpm2", null, null, ["prev", "num1", "div1"]],
                num1: ["num1", ["number", { value: 120 }]],
                div1: ["div1", "divide", null, null, ["prev", "n1", "d1"]],
                n1: ["n1", ["number", { value: 1 }]],
                d1: ["d1", ["number", { value: 4 }]]
            };
            const repr = debuggerWidget._getBlockRepresentation(
                "setmasterbpm2",
                null,
                blockMap.bpm1,
                blockMap,
                1,
                false,
                null
            );
            expect(repr).toContain("Set Master BPM → 120 BPM");
            expect(repr).toContain("beat value --> 1/4 = 0.25");
        });

        test("formats repeat block with nested divide count block", () => {
            const blockMap = {
                rep1: ["rep1", "repeat", null, null, ["prev", "div1"]],
                div1: ["div1", ["divide"], null, null, ["prev", "n1", "d1"]],
                n1: ["n1", ["number", { value: 8 }]],
                d1: ["d1", ["number", { value: 2 }]]
            };
            const repr = debuggerWidget._getBlockRepresentation(
                "repeat",
                null,
                blockMap.rep1,
                blockMap,
                1,
                false,
                null
            );
            expect(repr).toBe("Repeat (8/2 = 4.00) Times");
        });

        test("formats show block", () => {
            const blockMap = {
                s1: ["s1", "show", null, null, ["prev", null, "num1"]],
                num1: ["num1", ["number", { value: 99 }]]
            };
            const repr = debuggerWidget._getBlockRepresentation(
                "show",
                null,
                blockMap.s1,
                blockMap,
                1,
                false,
                null
            );
            expect(repr).toBe("Show Number: 99");
        });

        test("formats increment block", () => {
            const blockMap = {
                inc1: ["inc1", "increment", null, null, ["prev", "c1", "a1"]],
                c1: ["c1", ["number", { value: 10 }]],
                a1: ["a1", ["number", { value: 5 }]]
            };
            const repr = debuggerWidget._getBlockRepresentation(
                "increment",
                null,
                blockMap.inc1,
                blockMap,
                1,
                false,
                null
            );
            expect(repr).toBe("Increment --> Color: 10, Amount: 5");
        });

        test("formats incrementOne block", () => {
            const blockMap = {
                incOne1: ["incOne1", "incrementOne", null, null, ["prev", "box1"]],
                box1: ["box1", ["namedbox", { value: "counter" }]]
            };
            const repr = debuggerWidget._getBlockRepresentation(
                "incrementOne",
                null,
                blockMap.incOne1,
                blockMap,
                1,
                false,
                null
            );
            expect(repr).toBe('Increment Variable: "counter"');
        });

        test("formats arc block with divide block and simple number for angle", () => {
            const blockMapDivide = {
                arc1: ["arc1", "arc", null, null, ["prev", null, "rad1", "div1"]],
                rad1: ["rad1", ["number", { value: 50 }]],
                div1: ["div1", ["divide"], null, null, ["prev", "n1", "d1"]],
                n1: ["n1", ["number", { value: 180 }]],
                d1: ["d1", ["number", { value: 2 }]]
            };
            const repr1 = debuggerWidget._getBlockRepresentation(
                "arc",
                null,
                blockMapDivide.arc1,
                blockMapDivide,
                1,
                false,
                null
            );
            expect(repr1).toBe("Draw Arc --> Angle: 90.00°, Radius: 50");

            const blockMapSimple = {
                arc2: ["arc2", "arc", null, null, ["prev", null, "rad2", "ang2"]],
                rad2: ["rad2", ["number", { value: 25 }]],
                ang2: ["ang2", ["number", { value: 45 }]]
            };
            const repr2 = debuggerWidget._getBlockRepresentation(
                "arc",
                null,
                blockMapSimple.arc2,
                blockMapSimple,
                1,
                false,
                null
            );
            expect(repr2).toBe("Draw Arc --> Angle: 45°, Radius: 25");
        });

        test("formats print block", () => {
            const blockMap = {
                p1: ["p1", "print", null, null, ["prev", null, "t1"]],
                t1: ["t1", ["text", { value: "MusicBlocks Rocks" }]]
            };
            const repr = debuggerWidget._getBlockRepresentation(
                "print",
                null,
                blockMap.p1,
                blockMap,
                1,
                false,
                null
            );
            expect(repr).toBe('Print: "MusicBlocks Rocks"');
        });

        test("formats pitch block with text solfege and solfege block", () => {
            const blockMapText = {
                pitch1: ["pitch1", "pitch", null, null, ["prev", "solfText", "oct1"]],
                solfText: ["solfText", ["text", { value: "do" }]],
                oct1: ["oct1", ["number", { value: 4 }]]
            };
            const repr1 = debuggerWidget._getBlockRepresentation(
                "pitch",
                null,
                blockMapText.pitch1,
                blockMapText,
                1,
                false,
                null
            );
            expect(repr1).toBe("Pitch --> Solfege: do, Octave: 4");

            const blockMapSolfege = {
                pitch2: ["pitch2", "pitch", null, null, ["prev", "solfBlock", "oct2"]],
                solfBlock: ["solfBlock", ["solfege", { value: "re" }]],
                oct2: ["oct2", ["number", { value: 5 }]]
            };
            const repr2 = debuggerWidget._getBlockRepresentation(
                "pitch",
                null,
                blockMapSolfege.pitch2,
                blockMapSolfege,
                1,
                false,
                null
            );
            expect(repr2).toBe("Pitch --> Solfege: re, Octave: 5");
        });

        test("returns early from _processBlock when block representation is null", () => {
            const block = ["b1", "custom", null, null, []];
            const blockMap = { b1: block };
            const visited = new Set();
            const spy = jest
                .spyOn(debuggerWidget, "_getBlockRepresentation")
                .mockReturnValueOnce(null);
            const res = debuggerWidget._processBlock(block, blockMap, visited, 1);
            expect(res).toEqual([]);
            spy.mockRestore();
        });
    });

    describe("Comprehensive Fallbacks and Edge Cases", () => {
        let debuggerWidget;
        let mockActivity;
        let originalFetch;
        const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

        beforeEach(() => {
            originalFetch = global.fetch;
            global.fetch = jest.fn();

            mockActivity = {
                textMsg: jest.fn(),
                prepareExport: jest.fn(() => JSON.stringify([["b1", "start", null, null, []]]))
            };

            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.activity = mockActivity;
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.widgetWindow = {};
            debuggerWidget._lifecycle.mount();
        });

        afterEach(() => {
            global.fetch = originalFetch;
        });

        test("re-prompts with consent banner if message submitted when consent was declined", () => {
            debuggerWidget._showConsentBanner();
            const declineBtn = debuggerWidget.chatLog.querySelectorAll("button")[1];
            declineBtn.onclick();

            expect(debuggerWidget._consentGiven).toBe(false);
            expect(debuggerWidget.chatLog.textContent).toContain(
                "AI analysis was not started. You can type a question below, but project data will not be sent until you agree."
            );

            // User types message and sends
            const sendToBackendSpy = jest.spyOn(debuggerWidget, "_sendToBackend");
            debuggerWidget.messageInput = document.createElement("input");
            debuggerWidget.messageInput.value = "Can you help me?";
            debuggerWidget._sendMessage();

            // Must NOT send to backend without consent
            expect(sendToBackendSpy).not.toHaveBeenCalled();
            // Re-shows consent banner
            expect(debuggerWidget.chatLog.textContent).toContain("Before we start");
        });

        test("handles backend failure with full fallback: resets _isProcessing, hides indicator, and displays fallback message", async () => {
            debuggerWidget._isProcessing = true;
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 502,
                statusText: "Bad Gateway"
            });
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            debuggerWidget._sendToBackend("Explain project");
            await flushPromises();

            expect(debuggerWidget._isProcessing).toBe(false);
            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Server error: Unable to connect to AI backend."
            );
            expect(debuggerWidget.chatHistory[debuggerWidget.chatHistory.length - 1]).toEqual({
                type: "bot",
                content:
                    "Could not reach the AI assistant. Please check your connection and try again.",
                timestamp: expect.any(String)
            });
            expect(debuggerWidget.chatLog.textContent).toContain(
                "Could not reach the AI assistant. Please check your connection and try again."
            );
            errorSpy.mockRestore();
        });

        test("falls back to welcome message when _initializeBackendWithProject fails", async () => {
            global.fetch.mockRejectedValueOnce(new Error("Connection refused"));
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const welcomeSpy = jest.spyOn(debuggerWidget, "_addWelcomeMessage");

            debuggerWidget._initializeBackendWithProject("[]");
            await flushPromises();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Server error: Failed to initialize AI debugger."
            );
            expect(debuggerWidget.chatLog.textContent).toContain(
                "Could not reach the AI assistant. Please check your connection and try again."
            );
            expect(welcomeSpy).toHaveBeenCalled();

            errorSpy.mockRestore();
            welcomeSpy.mockRestore();
        });

        test("falls back to welcome message when _loadProjectAndInitialize fails during prepareExport", () => {
            mockActivity.prepareExport = jest.fn(() => {
                throw new Error("Filesystem locked");
            });
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const welcomeSpy = jest.spyOn(debuggerWidget, "_addWelcomeMessage");

            debuggerWidget._loadProjectAndInitialize();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Debugger error: Could not load project data."
            );
            expect(debuggerWidget.chatLog.textContent).toContain(
                "Could not load project data. Starting with basic assistant..."
            );
            expect(welcomeSpy).toHaveBeenCalled();

            errorSpy.mockRestore();
            welcomeSpy.mockRestore();
        });

        test("handles chat export when prepareExport throws error by inserting readable fallback string", async () => {
            const originalCreateObjectURL = global.URL.createObjectURL;
            const originalRevokeObjectURL = global.URL.revokeObjectURL;
            global.URL.createObjectURL = jest.fn(() => "blob:mock-export-url");
            global.URL.revokeObjectURL = jest.fn();

            const clickMock = jest.fn();
            const originalCreateElement = document.createElement.bind(document);
            const createElementSpy = jest
                .spyOn(document, "createElement")
                .mockImplementation(tag => {
                    const el = originalCreateElement(tag);
                    if (tag === "a") {
                        el.click = clickMock;
                    }
                    return el;
                });

            debuggerWidget.chatHistory = [{ type: "user", content: "Need help" }];
            debuggerWidget.activity.prepareExport = jest.fn(() => {
                throw new Error("Export failure");
            });
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            try {
                debuggerWidget._exportChat();

                expect(debuggerWidget.activity.textMsg).toHaveBeenCalledWith(
                    "Debugger error: Could not retrieve project data for export."
                );
                expect(debuggerWidget.activity.textMsg).toHaveBeenCalledWith(
                    "Chat exported successfully."
                );
                expect(global.URL.createObjectURL).toHaveBeenCalled();
                const blob = global.URL.createObjectURL.mock.calls[0][0];
                expect(blob).toBeInstanceOf(Blob);
                expect(blob.type).toBe("text/plain");
                const text = await blob.text();
                expect(text).toContain("Could not convert project to readable format");
                expect(text).toContain("User:\nNeed help\n\n");
            } finally {
                errorSpy.mockRestore();
                createElementSpy.mockRestore();
                global.URL.createObjectURL = originalCreateObjectURL;
                global.URL.revokeObjectURL = originalRevokeObjectURL;
            }
        });

        test("handles division by zero fallbacks in AST block representations", () => {
            // setmasterbpm2 with divide having denominator 0
            const bpmBlockMap = {
                bpm1: ["bpm1", "setmasterbpm2", null, null, ["prev", "num1", "div1"]],
                num1: ["num1", ["number", { value: 120 }]],
                div1: ["div1", "divide", null, null, ["prev", "n1", "d0"]],
                n1: ["n1", ["number", { value: 1 }]],
                d0: ["d0", ["number", { value: 0 }]]
            };
            const bpmRepr = debuggerWidget._getBlockRepresentation(
                "setmasterbpm2",
                null,
                bpmBlockMap.bpm1,
                bpmBlockMap,
                1,
                false,
                null
            );
            expect(bpmRepr).toBe("Set Master BPM → 120 BPM");

            // divide with denominator 0 standalone
            const divBlockMap = {
                div1: ["div1", "divide", null, null, ["prev", "n1", "d0"]],
                n1: ["n1", ["number", { value: 4 }]],
                d0: ["d0", ["number", { value: 0 }]]
            };
            const divRepr = debuggerWidget._getBlockRepresentation(
                "divide",
                null,
                divBlockMap.div1,
                divBlockMap,
                1,
                false,
                null
            );
            expect(divRepr).toBe("Divide Block --> 4/0 = ?");

            // divide with denominator 0 in newnote
            const noteDivRepr = debuggerWidget._getBlockRepresentation(
                "divide",
                null,
                divBlockMap.div1,
                divBlockMap,
                1,
                false,
                "newnote"
            );
            expect(noteDivRepr).toBe("Duration --> 4/0 = ?");

            // repeat with divide having denominator 0
            const repBlockMap = {
                r1: ["r1", "repeat", null, null, ["prev", "div0"]],
                div0: ["div0", ["divide"], null, null, ["prev", "n1", "d0"]],
                n1: ["n1", ["number", { value: 8 }]],
                d0: ["d0", ["number", { value: 0 }]]
            };
            const repRepr = debuggerWidget._getBlockRepresentation(
                "repeat",
                null,
                repBlockMap.r1,
                repBlockMap,
                1,
                false,
                null
            );
            expect(repRepr).toBe("Repeat (?) Times");

            // arc with divide having denominator 0
            const arcBlockMap = {
                arc1: ["arc1", "arc", null, null, ["prev", null, "rad1", "div0"]],
                rad1: ["rad1", ["number", { value: 50 }]],
                div0: ["div0", ["divide"], null, null, ["prev", "n1", "d0"]],
                n1: ["n1", ["number", { value: 90 }]],
                d0: ["d0", ["number", { value: 0 }]]
            };
            const arcRepr = debuggerWidget._getBlockRepresentation(
                "arc",
                null,
                arcBlockMap.arc1,
                arcBlockMap,
                1,
                false,
                null
            );
            expect(arcRepr).toBe("Draw Arc --> Angle: ?°, Radius: 50");
        });

        test("handles missing arguments and connections fallbacks in AST block representations", () => {
            const emptyBlockMap = {
                s1: ["s1", "storein2", null, null, ["prev", null]],
                box1: ["box1", "namedbox", null, null, []],
                do1: ["do1", "nameddo", null, null, []],
                act1: ["act1", "action", null, null, ["prev", null]],
                head1: ["head1", "setheading", null, null, ["prev", null]],
                sh1: ["sh1", "show", null, null, ["prev", null, null]],
                inc1: ["inc1", "increment", null, null, ["prev", null, null]],
                incone1: ["incone1", "incrementOne", null, null, ["prev", null]],
                drum1: ["drum1", "playdrum", null, null, ["prev", null]],
                plus1: ["plus1", "plus", null, null, ["prev", null, null]],
                pitch1: ["pitch1", "pitch", null, null, ["prev", null, null]],
                print1: ["print1", "print", null, null, ["prev", null, null]]
            };

            expect(
                debuggerWidget._getBlockRepresentation(
                    "storein2",
                    null,
                    emptyBlockMap.s1,
                    emptyBlockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Store Variable "unnamed" → ?');
            expect(
                debuggerWidget._getBlockRepresentation(
                    "namedbox",
                    null,
                    emptyBlockMap.box1,
                    emptyBlockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Variable: "unnamed"');
            expect(
                debuggerWidget._getBlockRepresentation(
                    "nameddo",
                    null,
                    emptyBlockMap.do1,
                    emptyBlockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Do action --> "unnamed"');
            expect(
                debuggerWidget._getBlockRepresentation(
                    "action",
                    null,
                    emptyBlockMap.act1,
                    emptyBlockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Action: "unnamed"');
            expect(
                debuggerWidget._getBlockRepresentation(
                    "setheading",
                    null,
                    emptyBlockMap.head1,
                    emptyBlockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Set Heading → 0°");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "show",
                    null,
                    emptyBlockMap.sh1,
                    emptyBlockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Show Number: ?");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "increment",
                    null,
                    emptyBlockMap.inc1,
                    emptyBlockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Increment --> Color: ?, Amount: ?");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "incrementOne",
                    null,
                    emptyBlockMap.incone1,
                    emptyBlockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Increment Variable: "?"');
            expect(
                debuggerWidget._getBlockRepresentation(
                    "playdrum",
                    null,
                    emptyBlockMap.drum1,
                    emptyBlockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Play Drum → ?");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "plus",
                    null,
                    emptyBlockMap.plus1,
                    emptyBlockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Add --> ? + ? = ?");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "pitch",
                    null,
                    emptyBlockMap.pitch1,
                    emptyBlockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Pitch --> Solfege: ?, Octave: ?");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "print",
                    null,
                    emptyBlockMap.print1,
                    emptyBlockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Print: ""');
        });

        test("handles _getDrumName and _getNamedBoxValue when block type is string format", () => {
            const blockMap = {
                d1: ["d1", "drumname"],
                n1: ["n1", "namedbox"],
                o1: ["o1", "other"]
            };
            expect(debuggerWidget._getDrumName("d1", blockMap)).toBeNull();
            expect(debuggerWidget._getDrumName("o1", blockMap)).toBeNull();
            expect(debuggerWidget._getNamedBoxValue("n1", blockMap)).toBeNull();
            expect(debuggerWidget._getNamedBoxValue("o1", blockMap)).toBeNull();
        });

        test("formats project fallback when no start block is present and handles missing connections", () => {
            const projectWithoutStart = [["f1", "forward", null, null, ["missingChild"]]];
            const text = debuggerWidget._convertProjectToLLMFormat(projectWithoutStart);
            expect(text).toContain("Forward");
        });

        test("safely removes typing indicator without data-animation-id attribute", () => {
            const indicator = document.createElement("div");
            indicator.className = "typing-indicator";
            debuggerWidget.chatLog.appendChild(indicator);

            expect(debuggerWidget.chatLog.children.length).toBe(1);
            debuggerWidget._hideTypingIndicator();
            expect(debuggerWidget.chatLog.children.length).toBe(0);
        });

        test("safely appends message with unrecognized message type", () => {
            const customMessage = {
                type: "custom_alert",
                content: "A custom notice",
                timestamp: new Date().toISOString()
            };
            debuggerWidget._addMessageToUI(customMessage);

            expect(debuggerWidget.chatLog.children.length).toBe(1);
        });
    });
});
