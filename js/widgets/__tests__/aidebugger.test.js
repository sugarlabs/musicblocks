/**
 * MusicBlocks v3.6.2
 *
 * @author Gemini Assistant
 *
 * @copyright 2026 Sugar Labs
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

// --- Global Mocks (Fake the Browser Environment) ---
global._ = msg => msg; // Mock translation function
global._THIS_IS_MUSIC_BLOCKS_ = true;

// Mock fetch for backend API calls
global.fetch = jest.fn();

// Mock URL APIs
global.URL = {
    createObjectURL: jest.fn(() => "blob:test-url"),
    revokeObjectURL: jest.fn()
};
global.Blob = jest.fn((content, options) => ({ content, options }));

// Mock console to prevent test output noise
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn()
};

// Mock window object
global.window = {
    location: {
        hostname: "localhost",
        protocol: "http:"
    },
    widgetWindows: {
        windowFor: jest.fn().mockReturnValue({
            clear: jest.fn(),
            show: jest.fn(),
            destroy: jest.fn(),
            addButton: jest.fn().mockReturnValue({ onclick: null }),
            getWidgetBody: jest.fn().mockReturnValue({
                style: {},
                appendChild: jest.fn(),
                innerHTML: ""
            }),
            sendToCenter: jest.fn(),
            isMaximized: jest.fn().mockReturnValue(false),
            onclose: null,
            onmaximize: null
        })
    }
};

// Mock document object
global.document = {
    createElement: jest.fn().mockImplementation(tag => ({
        tagName: tag.toUpperCase(),
        style: {},
        type: "",
        placeholder: "",
        className: "",
        textContent: "",
        value: "",
        href: "",
        download: "",
        innerHTML: "",
        appendChild: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        remove: jest.fn(),
        click: jest.fn(),
        querySelector: jest.fn().mockReturnValue(null),
        scrollTop: 0,
        scrollHeight: 100,
        onfocus: null,
        onblur: null,
        onmouseover: null,
        onmouseout: null,
        onclick: null,
        onkeypress: null
    })),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    }
};

describe("AIDebuggerWidget", () => {
    let widget;
    let mockActivity;

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Create widget instance
        widget = new AIDebuggerWidget();

        // Mock the activity object
        mockActivity = {
            isInputON: false,
            prepareExport: jest.fn().mockReturnValue("[]"),
            textMsg: jest.fn(),
            errorMsg: jest.fn()
        };

        // Initialize chat-related properties for testing
        widget.chatHistory = [];
        widget.promptCount = 0;
        widget.activity = mockActivity;
        widget.chatLog = {
            appendChild: jest.fn(),
            scrollTop: 0,
            scrollHeight: 100,
            innerHTML: "",
            querySelector: jest.fn().mockReturnValue(null)
        };
        widget.messageInput = { value: "" };
    });

    // ============================================
    // Test: Constructor and Initial State
    // ============================================
    describe("Constructor and Initial State", () => {
        test("should initialize with empty chat history", () => {
            const newWidget = new AIDebuggerWidget();
            expect(newWidget.chatHistory).toEqual([]);
        });

        test("should initialize with zero prompt count", () => {
            const newWidget = new AIDebuggerWidget();
            expect(newWidget.promptCount).toBe(0);
        });

        test("should generate a conversation ID on creation", () => {
            const newWidget = new AIDebuggerWidget();
            expect(newWidget.conversationId).toBeDefined();
            expect(newWidget.conversationId).toMatch(/^conv_\d+_[a-z0-9]+$/);
        });
    });

    // ============================================
    // Test: _generateConversationId
    // ============================================
    describe("_generateConversationId", () => {
        test("should generate unique conversation IDs", () => {
            const id1 = widget._generateConversationId();
            const id2 = widget._generateConversationId();

            expect(id1).not.toEqual(id2);
        });

        test("should generate ID with correct format (conv_timestamp_random)", () => {
            const id = widget._generateConversationId();

            expect(id).toMatch(/^conv_\d+_[a-z0-9]+$/);
            expect(id.startsWith("conv_")).toBe(true);
        });

        test("should generate ID with timestamp component", () => {
            const beforeTime = Date.now();
            const id = widget._generateConversationId();
            const afterTime = Date.now();

            const timestampPart = parseInt(id.split("_")[1]);
            expect(timestampPart).toBeGreaterThanOrEqual(beforeTime);
            expect(timestampPart).toBeLessThanOrEqual(afterTime);
        });
    });

    // ============================================
    // Test: _isBase64Data
    // ============================================
    describe("_isBase64Data", () => {
        test("should return true for valid image base64 data", () => {
            expect(widget._isBase64Data("data:image/png;base64,iVBORw0KGgo=")).toBe(true);
            expect(widget._isBase64Data("data:image/jpeg;base64,/9j/4AAQSkZ")).toBe(true);
            expect(widget._isBase64Data("data:image/gif;base64,R0lGODlh")).toBe(true);
            expect(widget._isBase64Data("data:image/svg+xml;base64,PHN2Zz4=")).toBe(true);
        });

        test("should return true for valid audio base64 data", () => {
            expect(widget._isBase64Data("data:audio/mp3;base64,//uQxAA")).toBe(true);
            expect(widget._isBase64Data("data:audio/wav;base64,UklGRi")).toBe(true);
            expect(widget._isBase64Data("data:audio/ogg;base64,T2dnUw")).toBe(true);
        });

        test("should return false for non-base64 strings", () => {
            expect(widget._isBase64Data("hello world")).toBe(false);
            expect(widget._isBase64Data("https://example.com/image.png")).toBe(false);
            expect(widget._isBase64Data("")).toBe(false);
            expect(widget._isBase64Data("regular text")).toBe(false);
        });

        test("should return false for non-string inputs", () => {
            expect(widget._isBase64Data(null)).toBe(false);
            expect(widget._isBase64Data(undefined)).toBe(false);
            expect(widget._isBase64Data(123)).toBe(false);
            expect(widget._isBase64Data({})).toBe(false);
            expect(widget._isBase64Data([])).toBe(false);
        });

        test("should return false for video base64 data (only image/audio supported)", () => {
            expect(widget._isBase64Data("data:video/mp4;base64,AAAA")).toBe(false);
        });
    });

    // ============================================
    // Test: _getNumericValue
    // ============================================
    describe("_getNumericValue", () => {
        test("should return numeric value from a number block", () => {
            const blockMap = {
                1: [1, ["number", { value: 42 }], 0, 0, [null]]
            };
            expect(widget._getNumericValue(1, blockMap)).toBe(42);
        });

        test("should return null for non-number blocks", () => {
            const blockMap = {
                1: [1, "text", 0, 0, [null]]
            };
            expect(widget._getNumericValue(1, blockMap)).toBe(null);
        });

        test("should return null for null blockId", () => {
            const blockMap = {};
            expect(widget._getNumericValue(null, blockMap)).toBe(null);
        });

        test("should return null for missing block in blockMap", () => {
            const blockMap = {};
            expect(widget._getNumericValue(999, blockMap)).toBe(null);
        });

        test("should handle number block without array format", () => {
            const blockMap = {
                1: [1, "number", 0, 0, [null]]
            };
            expect(widget._getNumericValue(1, blockMap)).toBe("number");
        });
    });

    // ============================================
    // Test: _getTextValue
    // ============================================
    describe("_getTextValue", () => {
        test("should return text value from a text block", () => {
            const blockMap = {
                1: [1, ["text", { value: "hello" }], 0, 0, [null]]
            };
            expect(widget._getTextValue(1, blockMap)).toBe("hello");
        });

        test("should return null for non-text blocks", () => {
            const blockMap = {
                1: [1, ["number", { value: 42 }], 0, 0, [null]]
            };
            expect(widget._getTextValue(1, blockMap)).toBe(null);
        });

        test("should return null for null blockId", () => {
            expect(widget._getTextValue(null, {})).toBe(null);
        });

        test("should return null for missing block in blockMap", () => {
            expect(widget._getTextValue(999, {})).toBe(null);
        });

        test("should return null when text block is not in array format", () => {
            const blockMap = {
                1: [1, "text", 0, 0, [null]]
            };
            expect(widget._getTextValue(1, blockMap)).toBe(null);
        });
    });

    // ============================================
    // Test: _getDrumName
    // ============================================
    describe("_getDrumName", () => {
        test("should return drum name from a drumname block", () => {
            const blockMap = {
                1: [1, ["drumname", { value: "kick drum" }], 0, 0, [null]]
            };
            expect(widget._getDrumName(1, blockMap)).toBe("kick drum");
        });

        test("should return null for non-drumname blocks", () => {
            const blockMap = {
                1: [1, ["number", { value: 42 }], 0, 0, [null]]
            };
            expect(widget._getDrumName(1, blockMap)).toBe(null);
        });

        test("should return null for null blockId", () => {
            expect(widget._getDrumName(null, {})).toBe(null);
        });

        test("should return null for missing block in blockMap", () => {
            expect(widget._getDrumName(999, {})).toBe(null);
        });
    });

    // ============================================
    // Test: _getNamedBoxValue
    // ============================================
    describe("_getNamedBoxValue", () => {
        test("should return value from a namedbox block", () => {
            const blockMap = {
                1: [1, ["namedbox", { value: "myVariable" }], 0, 0, [null]]
            };
            expect(widget._getNamedBoxValue(1, blockMap)).toBe("myVariable");
        });

        test("should return value from a namedarg block", () => {
            const blockMap = {
                1: [1, ["namedarg", { value: "argName" }], 0, 0, [null]]
            };
            expect(widget._getNamedBoxValue(1, blockMap)).toBe("argName");
        });

        test("should return null for other block types", () => {
            const blockMap = {
                1: [1, ["number", { value: 42 }], 0, 0, [null]]
            };
            expect(widget._getNamedBoxValue(1, blockMap)).toBe(null);
        });

        test("should return null for null blockId", () => {
            expect(widget._getNamedBoxValue(null, {})).toBe(null);
        });

        test("should return null for missing block in blockMap", () => {
            expect(widget._getNamedBoxValue(999, {})).toBe(null);
        });
    });

    // ============================================
    // Test: _convertProjectToLLMFormat
    // ============================================
    describe("_convertProjectToLLMFormat", () => {
        test("should return error message for non-array input", () => {
            expect(widget._convertProjectToLLMFormat(null)).toBe(
                "Invalid JSON format: Expected a list at the root."
            );
            expect(widget._convertProjectToLLMFormat({})).toBe(
                "Invalid JSON format: Expected a list at the root."
            );
            expect(widget._convertProjectToLLMFormat("string")).toBe(
                "Invalid JSON format: Expected a list at the root."
            );
        });

        test("should return warning for empty array", () => {
            expect(widget._convertProjectToLLMFormat([])).toBe("Warning: No blocks found in input!");
        });

        test("should process simple project with start block", () => {
            const projectData = [
                [0, ["start", { id: 0, xcor: 0, ycor: 0, heading: 0, color: 0, shade: 50, pensize: 5, grey: 100 }], 100, 100, [null, 1, null]],
                [1, ["number", { value: 4 }], 0, 0, [0]]
            ];
            const result = widget._convertProjectToLLMFormat(projectData);

            expect(result).toContain("Start of Project");
            expect(result).toContain("Start");
        });

        test("should handle project without start block", () => {
            const projectData = [
                [0, ["number", { value: 4 }], 100, 100, [null]]
            ];
            const result = widget._convertProjectToLLMFormat(projectData);

            expect(result).toContain("Start of Project");
        });
    });

    // ============================================
    // Test: _resetConversation
    // ============================================
    describe("_resetConversation", () => {
        test("should clear chat history", () => {
            widget.chatHistory = [
                { type: "user", content: "test", timestamp: "2026-01-01T00:00:00.000Z" }
            ];

            // Mock _loadProjectAndInitialize to prevent side effects
            widget._loadProjectAndInitialize = jest.fn();
            widget._updateMessageCount = jest.fn();

            widget._resetConversation();

            expect(widget.chatHistory).toEqual([]);
        });

        test("should reset prompt count to 0", () => {
            widget.promptCount = 5;

            widget._loadProjectAndInitialize = jest.fn();
            widget._updateMessageCount = jest.fn();

            widget._resetConversation();

            expect(widget.promptCount).toBe(0);
        });

        test("should generate new conversation ID", () => {
            const oldId = widget.conversationId;

            widget._loadProjectAndInitialize = jest.fn();
            widget._updateMessageCount = jest.fn();

            widget._resetConversation();

            expect(widget.conversationId).not.toBe(oldId);
        });

        test("should clear chat log innerHTML", () => {
            widget.chatLog.innerHTML = "<div>Some content</div>";

            widget._loadProjectAndInitialize = jest.fn();
            widget._updateMessageCount = jest.fn();

            widget._resetConversation();

            expect(widget.chatLog.innerHTML).toBe("");
        });

        test("should call _loadProjectAndInitialize", () => {
            widget._loadProjectAndInitialize = jest.fn();
            widget._updateMessageCount = jest.fn();

            widget._resetConversation();

            expect(widget._loadProjectAndInitialize).toHaveBeenCalled();
        });

        test("should show reset message to user", () => {
            widget._loadProjectAndInitialize = jest.fn();
            widget._updateMessageCount = jest.fn();

            widget._resetConversation();

            expect(mockActivity.textMsg).toHaveBeenCalledWith("Conversation reset.");
        });
    });

    // ============================================
    // Test: _clearChat
    // ============================================
    describe("_clearChat", () => {
        test("should clear chat log innerHTML", () => {
            widget.chatLog.innerHTML = "<div>Some content</div>";

            widget._clearChat();

            expect(widget.chatLog.innerHTML).toBe("");
        });

        test("should show clear message to user", () => {
            widget._clearChat();

            expect(mockActivity.textMsg).toHaveBeenCalledWith("Chat cleared.");
        });
    });

    // ============================================
    // Test: _exportChat
    // ============================================
    describe("_exportChat", () => {
        test("should show message when no conversation to export", () => {
            widget.chatHistory = [];

            widget._exportChat();

            expect(mockActivity.textMsg).toHaveBeenCalledWith("No conversation to export.");
        });

        test("should create Blob for non-empty chat history", () => {
            widget.chatHistory = [
                { type: "user", content: "Hello", timestamp: "2026-01-01T00:00:00.000Z" },
                { type: "bot", content: "Hi there!", timestamp: "2026-01-01T00:00:01.000Z" }
            ];

            widget._exportChat();

            // Verify Blob was created with text content
            expect(global.Blob).toHaveBeenCalled();
            const blobCall = global.Blob.mock.calls[0];
            expect(blobCall[1]).toEqual({ type: "text/plain" });
        });

        test("should revoke object URL after download", () => {
            widget.chatHistory = [
                { type: "user", content: "test", timestamp: "2026-01-01T00:00:00.000Z" }
            ];

            widget._exportChat();

            expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
        });

        test("should show success message after export", () => {
            widget.chatHistory = [
                { type: "user", content: "test", timestamp: "2026-01-01T00:00:00.000Z" }
            ];

            widget._exportChat();

            expect(mockActivity.textMsg).toHaveBeenCalledWith("Chat exported successfully.");
        });
    });

    // ============================================
    // Test: _sendMessage
    // ============================================
    describe("_sendMessage", () => {
        beforeEach(() => {
            widget._addMessageToUI = jest.fn();
            widget._updateMessageCount = jest.fn();
            widget._sendToBackend = jest.fn();
        });

        test("should not send empty message", () => {
            widget.messageInput.value = "";

            widget._sendMessage();

            expect(widget._addMessageToUI).not.toHaveBeenCalled();
            expect(widget._sendToBackend).not.toHaveBeenCalled();
        });

        test("should not send whitespace-only message", () => {
            widget.messageInput.value = "   ";

            widget._sendMessage();

            expect(widget._addMessageToUI).not.toHaveBeenCalled();
            expect(widget._sendToBackend).not.toHaveBeenCalled();
        });

        test("should add user message to chat history", () => {
            widget.messageInput.value = "Hello AI";

            widget._sendMessage();

            expect(widget.chatHistory.length).toBe(1);
            expect(widget.chatHistory[0].type).toBe("user");
            expect(widget.chatHistory[0].content).toBe("Hello AI");
        });

        test("should clear input field after sending", () => {
            widget.messageInput.value = "Hello AI";

            widget._sendMessage();

            expect(widget.messageInput.value).toBe("");
        });

        test("should call _addMessageToUI with user message", () => {
            widget.messageInput.value = "Hello AI";

            widget._sendMessage();

            expect(widget._addMessageToUI).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: "user",
                    content: "Hello AI"
                })
            );
        });

        test("should call _sendToBackend with message text", () => {
            widget.messageInput.value = "Hello AI";

            widget._sendMessage();

            expect(widget._sendToBackend).toHaveBeenCalledWith("Hello AI");
        });
    });

    // ============================================
    // Test: _processBlock
    // ============================================
    describe("_processBlock", () => {
        test("should not process already visited blocks", () => {
            const block = [1, "start", 0, 0, [null]];
            const blockMap = { 1: block };
            const visited = new Set([1]);

            const result = widget._processBlock(block, blockMap, visited);

            expect(result).toEqual([]);
        });

        test("should skip vspace blocks and process children", () => {
            const vspaceBlock = [1, "vspace", 0, 0, [null, 2, null]];
            const childBlock = [2, "start", 0, 0, [1, null]];
            const blockMap = {
                1: vspaceBlock,
                2: childBlock
            };
            const visited = new Set();

            widget._getBlockRepresentation = jest.fn().mockReturnValue("Start");
            const result = widget._processBlock(vspaceBlock, blockMap, visited);

            expect(visited.has(1)).toBe(true);
        });

        test("should skip hidden blocks and process children", () => {
            const hiddenBlock = [1, "hidden", 0, 0, [null, 2, null]];
            const childBlock = [2, "start", 0, 0, [1, null]];
            const blockMap = {
                1: hiddenBlock,
                2: childBlock
            };
            const visited = new Set();

            widget._getBlockRepresentation = jest.fn().mockReturnValue("Start");
            const result = widget._processBlock(hiddenBlock, blockMap, visited);

            expect(visited.has(1)).toBe(true);
        });

        test("should skip number blocks", () => {
            const block = [1, "number", 0, 0, [null]];
            const blockMap = { 1: block };
            const visited = new Set();

            const result = widget._processBlock(block, blockMap, visited);

            expect(result).toEqual([]);
        });

        test("should skip drumname blocks", () => {
            const block = [1, "drumname", 0, 0, [null]];
            const blockMap = { 1: block };
            const visited = new Set();

            const result = widget._processBlock(block, blockMap, visited);

            expect(result).toEqual([]);
        });

        test("should skip solfege blocks", () => {
            const block = [1, "solfege", 0, 0, [null]];
            const blockMap = { 1: block };
            const visited = new Set();

            const result = widget._processBlock(block, blockMap, visited);

            expect(result).toEqual([]);
        });

        test("should handle base64 data in block args", () => {
            const block = [1, ["media", { value: "data:image/png;base64,iVBORw0KGgo=" }], 0, 0, [null]];
            const blockMap = { 1: block };
            const visited = new Set();

            widget._getBlockRepresentation = jest.fn().mockReturnValue("Media: data");
            const result = widget._processBlock(block, blockMap, visited);

            // The block should be processed (base64 replaced with "data")
            expect(visited.has(1)).toBe(true);
        });
    });

    // ============================================
    // Test: _scale
    // ============================================
    describe("_scale", () => {
        test("should set 100% dimensions when maximized", () => {
            const mockBody = { style: {} };
            widget.widgetWindow = {
                isMaximized: jest.fn().mockReturnValue(true),
                getWidgetBody: jest.fn().mockReturnValue(mockBody)
            };

            widget._scale();

            expect(mockBody.style.width).toBe("100%");
            expect(mockBody.style.height).toBe("100%");
        });

        test("should set fixed dimensions when not maximized", () => {
            const mockBody = { style: {} };
            widget.widgetWindow = {
                isMaximized: jest.fn().mockReturnValue(false),
                getWidgetBody: jest.fn().mockReturnValue(mockBody)
            };

            widget._scale();

            expect(mockBody.style.width).toBe("900px");
            expect(mockBody.style.height).toBe("600px");
        });
    });

    // ============================================
    // Test: _showTypingIndicator & _hideTypingIndicator
    // ============================================
    describe("Typing Indicator", () => {
        test("_showTypingIndicator should append typing element to chat log", () => {
            widget._showTypingIndicator();

            expect(widget.chatLog.appendChild).toHaveBeenCalled();
        });

        test("_hideTypingIndicator should remove typing indicator if present", () => {
            const mockIndicator = {
                getAttribute: jest.fn().mockReturnValue("123"),
                remove: jest.fn()
            };
            widget.chatLog.querySelector = jest.fn().mockReturnValue(mockIndicator);

            // Mock clearInterval
            global.clearInterval = jest.fn();

            widget._hideTypingIndicator();

            expect(mockIndicator.remove).toHaveBeenCalled();
            expect(global.clearInterval).toHaveBeenCalledWith(123);
        });

        test("_hideTypingIndicator should do nothing if no indicator present", () => {
            widget.chatLog.querySelector = jest.fn().mockReturnValue(null);

            // Should not throw
            expect(() => widget._hideTypingIndicator()).not.toThrow();
        });
    });
});
