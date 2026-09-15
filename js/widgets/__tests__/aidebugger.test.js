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
global.fetch = jest.fn();

// Mock URL methods for exports
global.URL.createObjectURL = jest.fn(() => "blob:http://localhost/mock-url");
global.URL.revokeObjectURL = jest.fn();

// Location mocking setup
function withHostname(host, fn) {
    const syms = Object.getOwnPropertySymbols(window.location);
    let target = null;
    for (const sym of syms) {
        const impl = window.location[sym];
        if (impl && impl._url) {
            target = impl._url;
            break;
        }
    }
    const prev = target ? target.host : "localhost";
    if (target) {
        target.host = host;
    }
    try {
        fn();
    } finally {
        if (target) {
            target.host = prev;
        }
    }
}

describe("AIDebuggerWidget", () => {
    beforeEach(() => {
        global.fetch.mockReset();
    });

    describe("Constructor and Host Resolution", () => {
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

        test("resolves BACKEND_CONFIG for subdomain match", () => {
            withHostname("app.musicblocks.sugarlabs.org", () => {
                const widget = new AIDebuggerWidget();
                expect(widget.chatHistory).toBeDefined();
            });
        });

        test("handles unrecognized host with console.warn", () => {
            const warnSpy = jest.spyOn(global.console, "warn").mockImplementation(() => {});
            withHostname("unknown-host.org", () => {
                const widget = new AIDebuggerWidget();
                expect(warnSpy).toHaveBeenCalledWith(
                    expect.stringContaining("unrecognized host 'unknown-host.org'")
                );
            });
            warnSpy.mockRestore();
        });
    });

    describe("Initialization and Window Integration", () => {
        let debuggerWidget;
        let mockActivity;
        let mockWidgetWindow;
        let mockWidgetBody;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();

            mockWidgetBody = document.createElement("div");
            mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                getWidgetBody: jest.fn(() => mockWidgetBody),
                destroy: jest.fn(),
                addButton: jest.fn(() => document.createElement("button")),
                sendToCenter: jest.fn(),
                isMaximized: jest.fn(() => false)
            };

            window.widgetWindows = {
                windowFor: jest.fn(() => mockWidgetWindow)
            };

            mockActivity = {
                isInputON: false,
                textMsg: jest.fn(),
                prepareExport: jest.fn(() => "[]")
            };
        });

        test("init sets up window, buttons, and layout", () => {
            debuggerWidget.conversationId = null;
            debuggerWidget.init(mockActivity);

            expect(mockActivity.isInputON).toBe(true);
            expect(debuggerWidget.conversationId).not.toBeNull();
            expect(mockWidgetWindow.clear).toHaveBeenCalled();
            expect(mockWidgetWindow.show).toHaveBeenCalled();
            expect(mockWidgetWindow.sendToCenter).toHaveBeenCalled();
            expect(mockActivity.textMsg).toHaveBeenCalledWith("Debugger initialized");

            // Test reset button action
            debuggerWidget._resetConversation = jest.fn();
            debuggerWidget._resetButton.onclick();
            expect(debuggerWidget._resetConversation).toHaveBeenCalled();

            // Test export button action
            debuggerWidget._exportChat = jest.fn();
            debuggerWidget._exportButton.onclick();
            expect(debuggerWidget._exportChat).toHaveBeenCalled();

            // Test onclose callback
            debuggerWidget._hideTypingIndicator = jest.fn();
            mockWidgetWindow.onclose();
            expect(debuggerWidget._hideTypingIndicator).toHaveBeenCalled();
            expect(mockWidgetWindow.destroy).toHaveBeenCalled();
            expect(mockActivity.isInputON).toBe(false);

            // Test onmaximize callback triggers scale styling
            mockWidgetWindow.onmaximize();
            expect(mockWidgetBody.style.width).toBe("900px");
        });
    });

    describe("UI Event Handlers and Interactions", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();

            const container = document.createElement("div");
            debuggerWidget.widgetWindow = {
                getWidgetBody: () => container
            };
            debuggerWidget._createLayout();
        });

        test("messageInput focus and blur styling", () => {
            debuggerWidget.messageInput.onfocus();
            expect(debuggerWidget.messageInput.style.borderColor).toBe("rgb(33, 150, 243)");

            debuggerWidget.messageInput.onblur();
            expect(debuggerWidget.messageInput.style.borderColor).toBe("rgb(221, 221, 221)");
        });

        test("sendButton mouseover and mouseout styling", () => {
            debuggerWidget.sendButton.onmouseover();
            expect(debuggerWidget.sendButton.style.backgroundColor).toBe("rgb(25, 118, 210)");

            debuggerWidget.sendButton.onmouseout();
            expect(debuggerWidget.sendButton.style.backgroundColor).toBe("rgb(33, 150, 243)");
        });

        test("keypress handler triggers _sendMessage on Enter and ignores other keys", () => {
            debuggerWidget._sendMessage = jest.fn();

            debuggerWidget.messageInput.onkeypress({ key: "a" });
            expect(debuggerWidget._sendMessage).not.toHaveBeenCalled();

            debuggerWidget.messageInput.onkeypress({ key: "Enter" });
            expect(debuggerWidget._sendMessage).toHaveBeenCalledTimes(1);
        });

        test("sendButton click triggers _sendMessage", () => {
            debuggerWidget._sendMessage = jest.fn();
            debuggerWidget.sendButton.onclick();
            expect(debuggerWidget._sendMessage).toHaveBeenCalled();
        });
    });

    describe("_addWelcomeMessage", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.chatLog = document.createElement("div");
        });

        test("adds welcome message for Music Blocks", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = true;
            debuggerWidget._addWelcomeMessage();
            expect(debuggerWidget.chatLog.children[0].textContent).toContain(
                "Welcome to Music Blocks Debugger!"
            );
        });

        test("adds welcome message for Turtle Blocks when _THIS_IS_MUSIC_BLOCKS_ is false", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = false;
            debuggerWidget._addWelcomeMessage();
            expect(debuggerWidget.chatLog.children[0].textContent).toContain(
                "Welcome to Turtle Blocks Debugger!"
            );
            global._THIS_IS_MUSIC_BLOCKS_ = true;
        });
    });

    describe("_showConsentBanner", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.chatLog = document.createElement("div");
        });

        test("accept button gives consent and loads project", () => {
            debuggerWidget._loadProjectAndInitialize = jest.fn();
            debuggerWidget._showConsentBanner();

            const banner = debuggerWidget.chatLog.children[0];
            const buttons = banner.querySelectorAll("button");
            const acceptBtn = buttons[0];

            acceptBtn.onclick();
            expect(debuggerWidget._consentGiven).toBe(true);
            expect(debuggerWidget._loadProjectAndInitialize).toHaveBeenCalled();
            expect(debuggerWidget.chatLog.contains(banner)).toBe(false);
        });

        test("decline button removes banner and displays system message", () => {
            debuggerWidget._showConsentBanner();

            const banner = debuggerWidget.chatLog.children[0];
            const buttons = banner.querySelectorAll("button");
            const declineBtn = buttons[1];

            declineBtn.onclick();
            expect(debuggerWidget._consentGiven).toBe(false);
            expect(debuggerWidget.chatLog.contains(banner)).toBe(false);
            expect(debuggerWidget.chatLog.children[0].textContent).toContain(
                "AI analysis was not started"
            );
        });
    });

    describe("_loadProjectAndInitialize", () => {
        let debuggerWidget;
        let mockActivity;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.chatLog = document.createElement("div");
            mockActivity = {
                textMsg: jest.fn(),
                prepareExport: jest.fn(() => '["test"]')
            };
            debuggerWidget.activity = mockActivity;
            debuggerWidget._initializeBackendWithProject = jest.fn();
        });

        test("loads project data successfully and calls initialization", () => {
            debuggerWidget._loadProjectAndInitialize();
            expect(mockActivity.prepareExport).toHaveBeenCalled();
            expect(debuggerWidget._initializeBackendWithProject).toHaveBeenCalledWith('["test"]');
        });

        test("handles JSON parse error in project data gracefully", () => {
            const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            mockActivity.prepareExport.mockReturnValue("invalid json");

            debuggerWidget._loadProjectAndInitialize();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Debugger error: Invalid project data format."
            );
            expect(debuggerWidget._initializeBackendWithProject).toHaveBeenCalledWith(
                "invalid json"
            );
            errSpy.mockRestore();
        });

        test("handles prepareExport exception gracefully with fallback to welcome message", () => {
            const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            mockActivity.prepareExport.mockImplementation(() => {
                throw new Error("Export failure");
            });
            debuggerWidget._addWelcomeMessage = jest.fn();

            debuggerWidget._loadProjectAndInitialize();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Debugger error: Could not load project data."
            );
            expect(debuggerWidget._addWelcomeMessage).toHaveBeenCalled();
            errSpy.mockRestore();
        });
    });

    describe("_initializeBackendWithProject", () => {
        let debuggerWidget;
        let mockActivity;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.chatLog = document.createElement("div");
            mockActivity = { textMsg: jest.fn() };
            debuggerWidget.activity = mockActivity;
            debuggerWidget.chatHistory = [{ type: "user", content: "hi" }];
        });

        test("handles missing BACKEND_CONFIG.BASE_URL", () => {
            const warnSpy = jest.spyOn(global.console, "warn").mockImplementation(() => {});
            withHostname("unknown-host.com", () => {
                const widget = new AIDebuggerWidget();
                widget.chatLog = document.createElement("div");

                widget._initializeBackendWithProject("[]");

                expect(widget.chatLog.children[0].textContent).toContain(
                    "AI Debugger is not available on this host"
                );
            });
            warnSpy.mockRestore();
        });

        test("handles successful backend initialization", async () => {
            const mockResponse = { response: "Initial AI analysis complete." };
            global.fetch.mockImplementation(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(mockResponse)
                })
            );

            debuggerWidget._initializeBackendWithProject("[]");

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(debuggerWidget.chatHistory).toHaveLength(2);
            expect(debuggerWidget.chatHistory[1].content).toBe("Initial AI analysis complete.");
            expect(debuggerWidget.promptCount).toBe(1);
        });

        test("handles backend response missing response property", async () => {
            global.fetch.mockImplementation(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({})
                })
            );
            debuggerWidget._addWelcomeMessage = jest.fn();

            debuggerWidget._initializeBackendWithProject("[]");

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Server error: No initial response from AI backend."
            );
            expect(debuggerWidget._addWelcomeMessage).toHaveBeenCalled();
        });

        test("handles HTTP response error (non-ok response)", async () => {
            global.fetch.mockImplementation(() =>
                Promise.resolve({
                    ok: false,
                    status: 500,
                    statusText: "Server Error"
                })
            );
            debuggerWidget._addWelcomeMessage = jest.fn();

            debuggerWidget._initializeBackendWithProject("[]");

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Server error: Failed to initialize AI debugger."
            );
            expect(debuggerWidget._addWelcomeMessage).toHaveBeenCalled();
        });

        test("handles TypeError fetch failure (network/CORS)", async () => {
            const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            global.fetch.mockImplementation(() => Promise.reject(new TypeError("Failed to fetch")));
            debuggerWidget._addWelcomeMessage = jest.fn();

            debuggerWidget._initializeBackendWithProject("[]");

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(errSpy).toHaveBeenCalledWith("Network/CORS error. Backend connection failed");
            expect(debuggerWidget._addWelcomeMessage).toHaveBeenCalled();
            errSpy.mockRestore();
        });
    });

    describe("_sendMessage and _sendToBackend", () => {
        let debuggerWidget;
        let mockActivity;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.chatLog = document.createElement("div");
            debuggerWidget.messageInput = document.createElement("input");
            mockActivity = {
                textMsg: jest.fn(),
                prepareExport: jest.fn(() => '["code"]')
            };
            debuggerWidget.activity = mockActivity;
            debuggerWidget.chatHistory = [];
        });

        test("ignores empty or whitespace-only input", () => {
            debuggerWidget.messageInput.value = "   ";
            debuggerWidget._showConsentBanner = jest.fn();
            debuggerWidget._sendToBackend = jest.fn();

            debuggerWidget._sendMessage();

            expect(debuggerWidget._showConsentBanner).not.toHaveBeenCalled();
            expect(debuggerWidget._sendToBackend).not.toHaveBeenCalled();
            expect(debuggerWidget.chatHistory).toHaveLength(0);
        });

        test("ignores input when _isProcessing is true", () => {
            debuggerWidget.messageInput.value = "Hello";
            debuggerWidget._isProcessing = true;
            debuggerWidget._showConsentBanner = jest.fn();
            debuggerWidget._sendToBackend = jest.fn();

            debuggerWidget._sendMessage();

            expect(debuggerWidget._showConsentBanner).not.toHaveBeenCalled();
            expect(debuggerWidget._sendToBackend).not.toHaveBeenCalled();
            expect(debuggerWidget.chatHistory).toHaveLength(0);
        });

        test("shows consent banner when consent not given", () => {
            debuggerWidget._consentGiven = false;
            debuggerWidget.messageInput.value = "Hello";
            debuggerWidget._showConsentBanner = jest.fn();

            debuggerWidget._sendMessage();

            expect(debuggerWidget._showConsentBanner).toHaveBeenCalled();
        });

        test("sends message to backend when consent given", () => {
            debuggerWidget._consentGiven = true;
            debuggerWidget.messageInput.value = "User message";
            debuggerWidget._sendToBackend = jest.fn();

            debuggerWidget._sendMessage();

            expect(debuggerWidget.chatHistory).toHaveLength(1);
            expect(debuggerWidget.chatHistory[0].type).toBe("user");
            expect(debuggerWidget.chatHistory[0].content).toBe("User message");
            expect(debuggerWidget.messageInput.value).toBe("");
            expect(debuggerWidget._isProcessing).toBe(true);
            expect(debuggerWidget._sendToBackend).toHaveBeenCalledWith("User message");
        });

        test("handles missing BACKEND_CONFIG.BASE_URL when sending message", () => {
            const warnSpy = jest.spyOn(global.console, "warn").mockImplementation(() => {});
            withHostname("unknown-host.com", () => {
                const widget = new AIDebuggerWidget();
                widget.chatLog = document.createElement("div");
                widget.activity = { textMsg: jest.fn() };

                widget._sendToBackend("Hello");

                expect(widget._isProcessing).toBe(false);
                expect(widget.chatLog.children[0].textContent).toContain(
                    "AI Debugger backend is not configured for this host"
                );
            });
            warnSpy.mockRestore();
        });

        test("filters out system messages in chat history before fetch payload", async () => {
            debuggerWidget.chatHistory = [
                { type: "system", content: "Welcome banner" },
                { type: "user", content: "Previous question" },
                { type: "bot", content: "Previous answer" }
            ];

            global.fetch.mockImplementation(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ response: "New AI answer" })
                })
            );

            debuggerWidget._sendToBackend("Current question");

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(global.fetch).toHaveBeenCalled();
            const body = JSON.parse(global.fetch.mock.calls[0][1].body);
            expect(body.history).toEqual([
                { role: "user", content: "Previous question" },
                { role: "assistant", content: "Previous answer" }
            ]);
        });

        test("handles exception during prepareExport inside _sendToBackend", async () => {
            const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            mockActivity.prepareExport.mockImplementation(() => {
                throw new Error("Prepare error");
            });

            global.fetch.mockImplementation(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ response: "AI reply" })
                })
            );

            debuggerWidget._sendToBackend("My query");

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Debugger error: Could not prepare project data."
            );
            expect(debuggerWidget.chatHistory[0].content).toBe("AI reply");
            errSpy.mockRestore();
        });

        test("handles successful backend message send and response", async () => {
            global.fetch.mockImplementation(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ response: "AI answer" })
                })
            );

            debuggerWidget._sendToBackend("User prompt");

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(debuggerWidget._isProcessing).toBe(false);
            expect(debuggerWidget.chatHistory[0].content).toBe("AI answer");
        });

        test("handles response without response property", async () => {
            global.fetch.mockImplementation(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({})
                })
            );

            debuggerWidget._sendToBackend("Prompt");

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Server error: Invalid response from AI backend."
            );
            expect(debuggerWidget.chatHistory[0].content).toContain(
                "Could not reach the AI assistant"
            );
        });

        test("handles HTTP response error (non-ok response)", async () => {
            global.fetch.mockImplementation(() =>
                Promise.resolve({
                    ok: false,
                    status: 500,
                    statusText: "Internal Server Error"
                })
            );

            debuggerWidget._sendToBackend("Prompt");

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(debuggerWidget.chatHistory[0].content).toContain(
                "Could not reach the AI assistant"
            );
        });

        test("handles fetch rejection with network/CORS error", async () => {
            const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            global.fetch.mockImplementation(() => Promise.reject(new TypeError("Failed to fetch")));

            debuggerWidget._sendToBackend("Query");

            await new Promise(resolve => setTimeout(resolve, 10));

            expect(errSpy).toHaveBeenCalledWith("Network/CORS error. Backend connection failed");
            expect(debuggerWidget.chatHistory[0].content).toContain(
                "Could not reach the AI assistant"
            );
            errSpy.mockRestore();
        });
    });

    describe("Typing Indicator Animation", () => {
        let debuggerWidget;

        beforeEach(() => {
            jest.useFakeTimers();
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.chatLog = document.createElement("div");
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test("animates typing indicator dots over time", () => {
            debuggerWidget._showTypingIndicator();

            const indicator = debuggerWidget.chatLog.querySelector(".typing-indicator");
            expect(indicator.textContent).toBe("Debugger is typing...");

            jest.advanceTimersByTime(500);
            expect(indicator.textContent).toBe("Debugger is typing.");

            jest.advanceTimersByTime(500);
            expect(indicator.textContent).toBe("Debugger is typing..");

            jest.advanceTimersByTime(500);
            expect(indicator.textContent).toBe("Debugger is typing...");

            debuggerWidget._hideTypingIndicator();
            expect(debuggerWidget.chatLog.querySelector(".typing-indicator")).toBeNull();
        });
    });

    describe("_resetConversation", () => {
        let debuggerWidget;
        let mockActivity;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            debuggerWidget.chatLog = document.createElement("div");
            mockActivity = { textMsg: jest.fn(), prepareExport: jest.fn(() => "[]") };
            debuggerWidget.activity = mockActivity;
            debuggerWidget._loadProjectAndInitialize = jest.fn();
        });

        test("resets chat history, prompt count, and calls initialization", () => {
            debuggerWidget.chatHistory = [{ type: "user", content: "test" }];
            debuggerWidget.promptCount = 5;
            const oldId = debuggerWidget.conversationId;

            debuggerWidget._resetConversation();

            expect(debuggerWidget.chatHistory).toEqual([]);
            expect(debuggerWidget.promptCount).toBe(0);
            expect(debuggerWidget.conversationId).not.toBe(oldId);
            expect(debuggerWidget._loadProjectAndInitialize).toHaveBeenCalled();
            expect(mockActivity.textMsg).toHaveBeenCalledWith("Conversation reset.");
        });
    });

    describe("_exportChat", () => {
        let debuggerWidget;
        let mockActivity;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
            mockActivity = {
                textMsg: jest.fn(),
                prepareExport: jest.fn(() => "[]")
            };
            debuggerWidget.activity = mockActivity;
        });

        test("shows message when no conversation to export", () => {
            debuggerWidget.chatHistory = [];
            debuggerWidget._exportChat();
            expect(mockActivity.textMsg).toHaveBeenCalledWith("No conversation to export.");
        });

        test("exports chat successfully with valid project data", () => {
            debuggerWidget.chatHistory = [
                { type: "user", content: "Hi" },
                { type: "bot", content: "Hello" }
            ];

            const clickSpy = jest.fn();
            const originalCreateElement = document.createElement.bind(document);
            jest.spyOn(document, "createElement").mockImplementation(tagName => {
                const el = originalCreateElement(tagName);
                if (tagName === "a") {
                    el.click = clickSpy;
                }
                return el;
            });

            debuggerWidget._exportChat();

            expect(clickSpy).toHaveBeenCalled();
            expect(global.URL.createObjectURL).toHaveBeenCalled();
            expect(global.URL.revokeObjectURL).toHaveBeenCalled();
            expect(mockActivity.textMsg).toHaveBeenCalledWith("Chat exported successfully.");

            document.createElement.mockRestore();
        });

        test("handles JSON parse error in project data during export", () => {
            const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            debuggerWidget.chatHistory = [{ type: "user", content: "Hi" }];
            mockActivity.prepareExport.mockReturnValue("invalid json");

            const clickSpy = jest.fn();
            const originalCreateElement = document.createElement.bind(document);
            jest.spyOn(document, "createElement").mockImplementation(tagName => {
                const el = originalCreateElement(tagName);
                if (tagName === "a") {
                    el.click = clickSpy;
                }
                return el;
            });

            debuggerWidget._exportChat();

            expect(clickSpy).toHaveBeenCalled();
            document.createElement.mockRestore();
            errSpy.mockRestore();
        });

        test("handles prepareExport throwing an exception during export", () => {
            const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            debuggerWidget.chatHistory = [{ type: "user", content: "Hi" }];
            mockActivity.prepareExport.mockImplementation(() => {
                throw new Error("Export error");
            });

            const clickSpy = jest.fn();
            const originalCreateElement = document.createElement.bind(document);
            jest.spyOn(document, "createElement").mockImplementation(tagName => {
                const el = originalCreateElement(tagName);
                if (tagName === "a") {
                    el.click = clickSpy;
                }
                return el;
            });

            debuggerWidget._exportChat();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Debugger error: Could not retrieve project data for export."
            );
            expect(clickSpy).toHaveBeenCalled();

            document.createElement.mockRestore();
            errSpy.mockRestore();
        });

        test("exports chat using Turtle Blocks app name when _THIS_IS_MUSIC_BLOCKS_ is false", () => {
            global._THIS_IS_MUSIC_BLOCKS_ = false;
            debuggerWidget.chatHistory = [{ type: "user", content: "Hi" }];

            const clickSpy = jest.fn();
            const originalCreateElement = document.createElement.bind(document);
            jest.spyOn(document, "createElement").mockImplementation(tagName => {
                const el = originalCreateElement(tagName);
                if (tagName === "a") {
                    el.click = clickSpy;
                }
                return el;
            });

            debuggerWidget._exportChat();

            expect(clickSpy).toHaveBeenCalled();

            document.createElement.mockRestore();
            global._THIS_IS_MUSIC_BLOCKS_ = true;
        });
    });

    describe("_processBlock and Advanced Representation Edge Cases", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
        });

        test("replaces base64 string in blockArgs with 'data'", () => {
            const block = [1, ["imageblock", { img: "data:image/png;base64,iVBORw0K" }], [null]];
            const blockMap = { 1: block };
            const visited = new Set();

            const res = debuggerWidget._processBlock(block, blockMap, visited, 1);
            expect(block[1][1].img).toBe("data");
        });

        test("processes vspace and hidden blocks correctly", () => {
            const blockMap = {
                1: [1, "vspace", [2]],
                2: [2, "hidden", [3]],
                3: [3, ["forward", null], [null, 4]],
                4: [4, ["number", { value: 50 }]]
            };
            const visited = new Set();

            const res = debuggerWidget._processBlock(blockMap[1], blockMap, visited, 1);
            expect(res.join("\n")).toContain("Move Forward → 50 Steps");
        });

        test("handles unvisited non-hidden/vspace blocks in _convertProjectToLLMFormat", () => {
            const projectData = [
                [
                    1,
                    [
                        "start",
                        {
                            id: 1,
                            xcor: 0,
                            ycor: 0,
                            heading: 0,
                            color: 0,
                            shade: 50,
                            pensize: 5,
                            grey: 100
                        }
                    ],
                    [null]
                ],
                [2, "hidden", [null]],
                [3, "vspace", [null]],
                [4, ["forward", null], [null, 5]],
                [5, ["number", { value: 20 }]]
            ];

            const result = debuggerWidget._convertProjectToLLMFormat(projectData);
            expect(result).toContain("Start Block");
            expect(result).toContain("Move Forward → 20 Steps");
        });

        test("returns empty output if block is already visited or returns null representation", () => {
            const blockMap = {
                1: [1, ["solfege", { value: "do" }], [null]]
            };
            const visited = new Set([1]);

            expect(debuggerWidget._processBlock(blockMap[1], blockMap, visited, 1)).toEqual([]);

            const visited2 = new Set();
            expect(debuggerWidget._processBlock(blockMap[1], blockMap, visited2, 1)).toEqual([]);
        });

        test("processes start and action blocks trailing line formatting", () => {
            const blockMap = {
                1: [
                    1,
                    [
                        "start",
                        {
                            id: 1,
                            xcor: 0,
                            ycor: 0,
                            heading: 0,
                            color: 0,
                            shade: 50,
                            pensize: 5,
                            grey: 100
                        }
                    ],
                    [null]
                ],
                2: [2, ["action", null], [null, 3]],
                3: [3, ["text", { value: "myAction" }]]
            };
            const visited = new Set();

            const res1 = debuggerWidget._processBlock(blockMap[1], blockMap, visited, 1);
            expect(res1).toContain("│");

            const visited2 = new Set();
            const res2 = debuggerWidget._processBlock(blockMap[2], blockMap, visited2, 1);
            expect(res2).toContain("│");
        });

        test("filters divide block when child of newnote, setmasterbpm2, or arc", () => {
            const blockMap = {
                1: [1, ["newnote", null], [2]],
                2: [2, ["divide", null], [null, 3, 4]],
                3: [3, ["number", { value: 1 }]],
                4: [4, ["number", { value: 4 }]]
            };

            const visited = new Set();
            const res = debuggerWidget._processBlock(
                blockMap[1],
                blockMap,
                visited,
                1,
                false,
                null
            );
            expect(res.join("\n")).not.toContain("Divide Block");
        });

        test("processes block connections next block link", () => {
            const blockMap = {
                1: [1, ["pendown", null], [null, 2]],
                2: [2, ["forward", null], [null, 3]],
                3: [3, ["number", { value: 10 }]]
            };
            const visited = new Set();

            const res = debuggerWidget._processBlock(blockMap[1], blockMap, visited, 1);
            expect(res.join("\n")).toContain("Pen Down");
            expect(res.join("\n")).toContain("Move Forward → 10 Steps");
        });
    });

    describe("_getBlockRepresentation Detailed Mappings", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
        });

        test("divide block representation standalone and invalid cases", () => {
            const blockMap = {
                1: [1, ["divide", null], [null, 2, 3]],
                2: [2, ["number", { value: 10 }]],
                3: [3, ["number", { value: 0 }]],
                4: [4, ["divide", null], [null, null, null]]
            };

            expect(
                debuggerWidget._getBlockRepresentation(
                    "divide",
                    null,
                    blockMap[1],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Divide Block --> 10/? = ?");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "divide",
                    null,
                    blockMap[4],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Divide Block --> ?/? = ?");
        });

        test("divide block in newnote context with null/zero values", () => {
            const blockMap = {
                1: [1, ["divide", null], [null, 2, 3]],
                2: [2, ["number", { value: 1 }]],
                3: [3, ["number", { value: 0 }]],
                4: [4, ["divide", null], [null, null, null]]
            };
            expect(
                debuggerWidget._getBlockRepresentation(
                    "divide",
                    null,
                    blockMap[1],
                    blockMap,
                    1,
                    false,
                    "newnote"
                )
            ).toBe("Duration --> 1/? = ?");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "divide",
                    null,
                    blockMap[4],
                    blockMap,
                    1,
                    false,
                    "newnote"
                )
            ).toBe("Duration --> ?/? = ?");
        });

        test("setmasterbpm2 with divide block", () => {
            const blockMap = {
                1: [1, ["setmasterbpm2", null], [null, 2, 3]],
                2: [2, ["number", { value: 120 }]],
                3: [3, "divide", [null, 4, 5]],
                4: [4, ["number", { value: 1 }]],
                5: [5, ["number", { value: 4 }]]
            };
            const res = debuggerWidget._getBlockRepresentation(
                "setmasterbpm2",
                null,
                blockMap[1],
                blockMap,
                1,
                false,
                null
            );
            expect(res).toContain("Set Master BPM → 120 BPM");
            expect(res).toContain("beat value --> 1/4 = 0.25");
        });

        test("repeat with divide block count vs number count vs unknown count", () => {
            const blockMap = {
                1: [1, ["repeat", null], [null, 2]],
                2: [2, ["divide", null], [null, 3, 4]],
                3: [3, ["number", { value: 4 }]],
                4: [4, ["number", { value: 2 }]],
                5: [5, ["repeat", null], [null, 6]],
                6: [6, ["number", { value: 5 }]],
                7: [7, ["repeat", null], [null, null]],
                8: [8, ["repeat", null], [null, 9]],
                9: [9, ["unknown", { value: 5 }]],
                10: [10, ["repeat", null], [null, 11]],
                11: [11, ["number", null]]
            };
            const res1 = debuggerWidget._getBlockRepresentation(
                "repeat",
                null,
                blockMap[1],
                blockMap,
                1,
                false,
                null
            );
            expect(res1).toBe("Repeat (4/2 = 2.00) Times");

            const res2 = debuggerWidget._getBlockRepresentation(
                "repeat",
                null,
                blockMap[5],
                blockMap,
                1,
                false,
                null
            );
            expect(res2).toBe("Repeat (5) Times");

            const res3 = debuggerWidget._getBlockRepresentation(
                "repeat",
                null,
                blockMap[7],
                blockMap,
                1,
                false,
                null
            );
            expect(res3).toBe("Repeat (?) Times");

            const res4 = debuggerWidget._getBlockRepresentation(
                "repeat",
                null,
                blockMap[8],
                blockMap,
                1,
                false,
                null
            );
            expect(res4).toBe("Repeat (?) Times");

            const res5 = debuggerWidget._getBlockRepresentation(
                "repeat",
                null,
                blockMap[10],
                blockMap,
                1,
                false,
                null
            );
            expect(res5).toBe("Repeat (?) Times");
        });

        test("movement and direction blocks with null connections", () => {
            const blockMap = {
                1: [1, ["forward", null], [null, null]],
                2: [2, ["back", null], [null, null]],
                3: [3, ["right", null], [null, null]],
                4: [4, ["left", null], [null, null]],
                5: [5, ["setheading", null], [null, null]],
                6: [6, ["penup", null], [null]],
                7: [7, ["pendown", null], [null]]
            };

            expect(
                debuggerWidget._getBlockRepresentation(
                    "forward",
                    null,
                    blockMap[1],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Move Forward → ? Steps");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "back",
                    null,
                    blockMap[2],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Move Backward → ? Steps");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "right",
                    null,
                    blockMap[3],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Rotate Right → ?°");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "left",
                    null,
                    blockMap[4],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Rotate Left → ?°");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "setheading",
                    null,
                    blockMap[5],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Set Heading → 0°");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "penup",
                    null,
                    blockMap[6],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Pen Up (Lifts Pen from Canvas)");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "pendown",
                    null,
                    blockMap[7],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Pen Down");
        });

        test("show, increment, and incrementOne blocks", () => {
            const blockMap = {
                1: [1, ["show", null], [null, null, 2]],
                2: [2, ["number", { value: 99 }]],
                3: [3, ["increment", null], [null, 4, 5]],
                4: [4, ["number", { value: 10 }]],
                5: [5, ["number", { value: 2 }]],
                6: [6, ["incrementOne", null], [null, 7]],
                7: [7, ["namedbox", { value: "myVar" }]],
                8: [8, ["incrementOne", null], [null, null]]
            };

            expect(
                debuggerWidget._getBlockRepresentation(
                    "show",
                    null,
                    blockMap[1],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Show Number: 99");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "increment",
                    null,
                    blockMap[3],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Increment --> Color: 10, Amount: 2");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "incrementOne",
                    null,
                    blockMap[6],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Increment Variable: "myVar"');
            expect(
                debuggerWidget._getBlockRepresentation(
                    "incrementOne",
                    null,
                    blockMap[8],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Increment Variable: "?"');
        });

        test("arc block with divide angle and number radius", () => {
            const blockMap = {
                1: [1, ["arc", null], [null, null, 2, 3]],
                2: [2, ["number", { value: 50 }]],
                3: [3, ["divide", null], [null, 4, 5]],
                4: [4, ["number", { value: 360 }]],
                5: [5, ["number", { value: 4 }]]
            };
            const res = debuggerWidget._getBlockRepresentation(
                "arc",
                null,
                blockMap[1],
                blockMap,
                1,
                false,
                null
            );
            expect(res).toBe("Draw Arc --> Angle: 90.00°, Radius: 50");
        });

        test("arc block with simple angle", () => {
            const blockMap = {
                1: [1, ["arc", null], [null, null, 2, 3]],
                2: [2, ["number", { value: 30 }]],
                3: [3, ["number", { value: 180 }]]
            };
            const res = debuggerWidget._getBlockRepresentation(
                "arc",
                null,
                blockMap[1],
                blockMap,
                1,
                false,
                null
            );
            expect(res).toBe("Draw Arc --> Angle: 180°, Radius: 30");
        });

        test("print block formatting", () => {
            const blockMap = {
                1: [1, ["print", null], [null, null, 2]],
                2: [2, ["text", { value: "Hello World" }]]
            };
            const res = debuggerWidget._getBlockRepresentation(
                "print",
                null,
                blockMap[1],
                blockMap,
                1,
                false,
                null
            );
            expect(res).toBe('Print: "Hello World"');
        });

        test("plus block with numeric and null connections", () => {
            const blockMap = {
                1: [1, ["plus", null], [null, 2, 3]],
                2: [2, ["number", { value: 5 }]],
                3: [3, ["number", { value: 15 }]],
                4: [4, ["plus", null], [null, null, null]]
            };

            expect(
                debuggerWidget._getBlockRepresentation(
                    "plus",
                    null,
                    blockMap[1],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Add --> 5 + 15 = 20.00");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "plus",
                    null,
                    blockMap[4],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Add --> ? + ? = ?");
        });

        test("pitch block with text solfege, solfege block solfege, and unknown block solfege", () => {
            const blockMap = {
                1: [1, ["pitch", null], [null, 2, 3]],
                2: [2, ["text", { value: "do" }]],
                3: [3, ["number", { value: 4 }]],
                4: [4, ["pitch", null], [null, 5, 3]],
                5: [5, ["solfege", { value: "re" }]],
                6: [6, ["pitch", null], [null, null, null]],
                7: [7, ["pitch", null], [null, 8, 3]],
                8: [8, ["unknown", { value: "mi" }]]
            };

            const res1 = debuggerWidget._getBlockRepresentation(
                "pitch",
                null,
                blockMap[1],
                blockMap,
                1,
                false,
                null
            );
            expect(res1).toBe("Pitch --> Solfege: do, Octave: 4");

            const res2 = debuggerWidget._getBlockRepresentation(
                "pitch",
                null,
                blockMap[4],
                blockMap,
                1,
                false,
                null
            );
            expect(res2).toBe("Pitch --> Solfege: re, Octave: 4");

            const res3 = debuggerWidget._getBlockRepresentation(
                "pitch",
                null,
                blockMap[6],
                blockMap,
                1,
                false,
                null
            );
            expect(res3).toBe("Pitch --> Solfege: ?, Octave: ?");

            const res4 = debuggerWidget._getBlockRepresentation(
                "pitch",
                null,
                blockMap[7],
                blockMap,
                1,
                false,
                null
            );
            expect(res4).toBe("Pitch --> Solfege: ?, Octave: 4");
        });

        test("solfege block returns null", () => {
            expect(
                debuggerWidget._getBlockRepresentation(
                    "solfege",
                    null,
                    [1, ["solfege", null], [null]],
                    {},
                    1,
                    false,
                    null
                )
            ).toBeNull();
        });

        test("settransposition block with numeric and null value", () => {
            const blockMap = {
                1: [1, ["settransposition", null], [null, 2]],
                2: [2, ["number", { value: 5 }]],
                3: [3, ["settransposition", null], [null, null]]
            };

            expect(
                debuggerWidget._getBlockRepresentation(
                    "settransposition",
                    null,
                    blockMap[1],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Set Transposition --> 5");
            expect(
                debuggerWidget._getBlockRepresentation(
                    "settransposition",
                    null,
                    blockMap[3],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Set Transposition --> ?");
        });
    });

    describe("Helper Value Extractor Edge Cases", () => {
        let debuggerWidget;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();
        });

        test("_getNumericValue returns null for invalid blocks", () => {
            expect(debuggerWidget._getNumericValue(null, {})).toBeNull();
            expect(debuggerWidget._getNumericValue("missing", {})).toBeNull();
            expect(debuggerWidget._getNumericValue("b1", { b1: [1, "not-number"] })).toBeNull();
        });

        test("_getTextValue returns null for invalid blocks", () => {
            expect(debuggerWidget._getTextValue(null, {})).toBeNull();
            expect(debuggerWidget._getTextValue("missing", {})).toBeNull();
            expect(debuggerWidget._getTextValue("b1", { b1: [1, ["not-text", {}]] })).toBeNull();
        });

        test("_getDrumName returns null for invalid blocks", () => {
            expect(debuggerWidget._getDrumName(null, {})).toBeNull();
            expect(debuggerWidget._getDrumName("missing", {})).toBeNull();
            expect(debuggerWidget._getDrumName("b1", { b1: [1, ["not-drum", {}]] })).toBeNull();
            expect(debuggerWidget._getDrumName("b2", { b2: [1, "drumname"] })).toBeNull();
        });

        test("_getNamedBoxValue returns null for invalid blocks", () => {
            expect(debuggerWidget._getNamedBoxValue(null, {})).toBeNull();
            expect(debuggerWidget._getNamedBoxValue("missing", {})).toBeNull();
            expect(
                debuggerWidget._getNamedBoxValue("b1", { b1: [1, ["not-namedbox", {}]] })
            ).toBeNull();
        });

        test("_convertProjectToLLMFormat non-array and empty array", () => {
            expect(debuggerWidget._convertProjectToLLMFormat("not an array")).toBe(
                "Invalid JSON format: Expected a list at the root."
            );
            expect(debuggerWidget._convertProjectToLLMFormat([])).toBe(
                "Warning: No blocks found in input!"
            );
        });

        test("_clearChat clears chat log children and shows textMsg", () => {
            const widget = new AIDebuggerWidget();
            widget.chatLog = document.createElement("div");
            widget.chatLog.appendChild(document.createElement("span"));
            widget.activity = { textMsg: jest.fn() };

            widget._clearChat();

            expect(widget.chatLog.children.length).toBe(0);
            expect(widget.activity.textMsg).toHaveBeenCalledWith("Chat cleared.");
        });

        test("_processBlock returns output unchanged if _getBlockRepresentation returns null", () => {
            const widget = new AIDebuggerWidget();
            const blockMap = {
                1: [1, "custom_type", 0, 0, []]
            };
            const visited = new Set();
            widget._getBlockRepresentation = jest.fn(() => null);
            const result = widget._processBlock(blockMap[1], blockMap, visited);
            expect(result).toEqual([]);
        });

        test("additional block representations: storein2, namedbox, forever, playdrum, nameddo, default with value", () => {
            const widget = new AIDebuggerWidget();
            const blockMap = {
                1: [1, ["storein2", { value: "myVar" }], [null, 2]],
                2: [2, ["number", { value: 42 }], []],
                3: [3, "storein2", [null, null]],
                4: [4, ["namedbox", { value: "myBox" }], []],
                5: [5, "namedbox", []],
                6: [6, "forever", []],
                7: [7, "playdrum", [null, 8]],
                8: [8, ["drumname", { value: "snare" }], []],
                9: [9, "playdrum", [null, null]],
                10: [10, ["nameddo", { value: "myFunc" }], []],
                11: [11, "nameddo", []],
                12: [12, ["mycustomtype", { value: "val123" }], []]
            };

            expect(
                widget._getBlockRepresentation(
                    "storein2",
                    { value: "myVar" },
                    blockMap[1],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Store Variable "myVar" → 42');
            expect(
                widget._getBlockRepresentation(
                    "storein2",
                    null,
                    blockMap[3],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Store Variable "unnamed" → ?');
            expect(
                widget._getBlockRepresentation(
                    "namedbox",
                    { value: "myBox" },
                    blockMap[4],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Variable: "myBox"');
            expect(
                widget._getBlockRepresentation(
                    "namedbox",
                    null,
                    blockMap[5],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Variable: "unnamed"');
            expect(
                widget._getBlockRepresentation(
                    "forever",
                    null,
                    blockMap[6],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Forever Loop (Repeats Indefinitely)");
            expect(
                widget._getBlockRepresentation(
                    "playdrum",
                    null,
                    blockMap[7],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Play Drum → snare");
            expect(
                widget._getBlockRepresentation(
                    "playdrum",
                    null,
                    blockMap[9],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("Play Drum → ?");
            expect(
                widget._getBlockRepresentation(
                    "nameddo",
                    { value: "myFunc" },
                    blockMap[10],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Do action --> "myFunc"');
            expect(
                widget._getBlockRepresentation(
                    "nameddo",
                    null,
                    blockMap[11],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe('Do action --> "unnamed"');
            expect(
                widget._getBlockRepresentation(
                    "mycustomtype",
                    { value: "val123" },
                    blockMap[12],
                    blockMap,
                    1,
                    false,
                    null
                )
            ).toBe("mycustomtype: val123");
        });
    });

    describe("_scale", () => {
        let debuggerWidget;
        let mockWidgetWindow;
        let mockBody;

        beforeEach(() => {
            debuggerWidget = new AIDebuggerWidget();

            mockBody = document.createElement("div");
            mockWidgetWindow = {
                getWidgetBody: () => mockBody,
                isMaximized: jest.fn()
            };
            debuggerWidget.widgetWindow = mockWidgetWindow;
        });

        test("sets 100% width/height when maximized", () => {
            mockWidgetWindow.isMaximized.mockReturnValue(true);
            debuggerWidget._scale();
            expect(mockBody.style.width).toBe("100%");
            expect(mockBody.style.height).toBe("100%");
        });

        test("sets fixed width/height when not maximized", () => {
            mockWidgetWindow.isMaximized.mockReturnValue(false);
            debuggerWidget._scale();
            expect(mockBody.style.width).toBe("900px");
            expect(mockBody.style.height).toBe("600px");
        });
    });
});
