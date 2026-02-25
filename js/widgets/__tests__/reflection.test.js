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

// Load the ReflectionMatrix class by reading the source and evaluating it
const source = fs.readFileSync(path.resolve(__dirname, "../reflection.js"), "utf-8");
// We put ReflectionMatrix in global scope
new Function(
    source + "\nif (typeof global !== 'undefined') { global.ReflectionMatrix = ReflectionMatrix; }"
)();

// Mock globals
global._ = str => str;

// Mock window.widgetWindows and widget
function createMockWidgetWindow() {
    const widgetBody = document.createElement("div");
    return {
        clear: jest.fn(),
        show: jest.fn(),
        onclose: null,
        addButton: jest.fn(() => {
            const btn = document.createElement("button");
            return btn;
        }),
        getWidgetBody: jest.fn(() => widgetBody),
        destroy: jest.fn()
    };
}

let mockWidgetWindow;
let mockActivity;

beforeEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockWidgetWindow = createMockWidgetWindow();
    window.widgetWindows = {
        windowFor: jest.fn(() => mockWidgetWindow)
    };

    mockActivity = {
        isInputON: false,
        textMsg: jest.fn(),
        errorMsg: jest.fn(),
        prepareExport: jest.fn().mockResolvedValue("mocked_code")
    };

    // Keep original fetch and localStorage just in case, but usually we mock them
    global.fetch = jest.fn();

    // Mock URL.createObjectURL/revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
});

describe("ReflectionMatrix", () => {
    describe("Constructor and Constants", () => {
        test("Initializes constants correctly", () => {
            expect(ReflectionMatrix.BUTTONDIVWIDTH).toBe(535);
            expect(ReflectionMatrix.OUTERWINDOWWIDTH).toBe("858px");
            expect(ReflectionMatrix.OUTERWINDOWHEIGHT).toBe("550px");
            expect(ReflectionMatrix.INNERWINDOWWIDTH).toBe(730);
            expect(ReflectionMatrix.BUTTONSIZE).toBe(53);
            expect(ReflectionMatrix.ICONSIZE).toBe(32);
        });

        test("Initializes constructor properties correctly", () => {
            const reflection = new ReflectionMatrix();
            expect(reflection.chatHistory).toEqual([]);
            expect(reflection.AImentor).toBe("meta");
            expect(reflection.mentorsMap).toEqual({
                user: "YOU",
                meta: "ROHAN",
                music: "BEETHOVEN",
                code: "ALAN"
            });
            expect(reflection.triggerFirst).toBe(false);
            expect(reflection.projectAlgorithm).toBe("");
            expect(reflection.code).toBe("");
        });
    });

    describe("init()", () => {
        test("Sets up widget window and basic properties", () => {
            const reflection = new ReflectionMatrix();

            // Spy on class methods called during init
            jest.spyOn(reflection, "changeMentor");
            jest.spyOn(reflection, "startChatSession").mockImplementation(() => {});

            reflection.init(mockActivity);

            expect(reflection.activity).toBe(mockActivity);
            expect(reflection.isOpen).toBe(true);
            expect(reflection.isMaximized).toBe(false);
            expect(mockActivity.isInputON).toBe(true);
            expect(reflection.PORT).toBe("http://3.105.177.138:8000");

            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
                reflection,
                "reflection",
                "reflection"
            );
            expect(mockWidgetWindow.clear).toHaveBeenCalled();
            expect(mockWidgetWindow.show).toHaveBeenCalled();

            const body = mockWidgetWindow.getWidgetBody();
            expect(body.style.height).toBe(ReflectionMatrix.OUTERWINDOWHEIGHT);
            expect(body.style.width).toBe(ReflectionMatrix.OUTERWINDOWWIDTH);
        });

        test("Sets up onclose handler", () => {
            const reflection = new ReflectionMatrix();
            jest.spyOn(reflection, "startChatSession").mockImplementation(() => {});

            reflection.init(mockActivity);

            expect(mockWidgetWindow.onclose).not.toBeNull();

            // Trigger close
            reflection.dotsInterval = setInterval(() => {}, 1000);
            mockWidgetWindow.onclose();

            expect(reflection.isOpen).toBe(false);
            expect(mockActivity.isInputON).toBe(false);
            expect(mockWidgetWindow.destroy).toHaveBeenCalled();
        });

        test("Creates buttons with appropriate actions", () => {
            const reflection = new ReflectionMatrix();
            jest.spyOn(reflection, "startChatSession").mockImplementation(() => {});
            jest.spyOn(reflection, "getAnalysis").mockImplementation(() => {});
            jest.spyOn(reflection, "downloadAsTxt").mockImplementation(() => {});
            jest.spyOn(reflection, "changeMentor");
            jest.spyOn(reflection, "updateProjectCode").mockImplementation(() => {});

            reflection.init(mockActivity);

            expect(mockWidgetWindow.addButton).toHaveBeenCalledTimes(6);

            // Trigger summary button
            reflection.summaryButton.onclick();
            expect(reflection.getAnalysis).toHaveBeenCalled();

            // Trigger meta button
            reflection.metaButton.onclick();
            expect(reflection.changeMentor).toHaveBeenCalledWith("meta");

            // Trigger code button
            reflection.codeButton.onclick();
            expect(reflection.changeMentor).toHaveBeenCalledWith("code");

            // Trigger music button
            reflection.musicButton.onclick();
            expect(reflection.changeMentor).toHaveBeenCalledWith("music");

            // Trigger reload button
            reflection.reloadButton.onclick();
            expect(reflection.updateProjectCode).toHaveBeenCalled();
        });

        test("Sets up input field and chat interface", () => {
            const reflection = new ReflectionMatrix();
            jest.spyOn(reflection, "startChatSession").mockImplementation(() => {});
            jest.spyOn(reflection, "sendMessage").mockImplementation(() => {});

            reflection.init(mockActivity);

            expect(reflection.chatInterface).toBeDefined();
            expect(reflection.chatLog).toBeDefined();
            expect(reflection.inputContainer).toBeDefined();
            expect(reflection.input).toBeDefined();

            // Test enter key
            reflection.input.onkeydown({ key: "Enter" });
            expect(reflection.sendMessage).toHaveBeenCalled();
        });

        test("Calls startChatSession if history is empty", () => {
            const reflection = new ReflectionMatrix();
            jest.spyOn(reflection, "startChatSession").mockImplementation(() => {});
            jest.spyOn(reflection, "renderChatHistory").mockImplementation(() => {});

            reflection.init(mockActivity);

            expect(reflection.startChatSession).toHaveBeenCalled();
            expect(reflection.renderChatHistory).not.toHaveBeenCalled();
            expect(reflection.inputContainer.style.display).toBe("none");
        });

        test("Calls renderChatHistory if history exists", () => {
            const reflection = new ReflectionMatrix();
            reflection.chatHistory = [{ role: "user", content: "Hi" }];
            jest.spyOn(reflection, "startChatSession").mockImplementation(() => {});
            jest.spyOn(reflection, "renderChatHistory").mockImplementation(() => {});

            reflection.init(mockActivity);

            expect(reflection.startChatSession).not.toHaveBeenCalled();
            expect(reflection.renderChatHistory).toHaveBeenCalled();
            expect(reflection.inputContainer.style.display).toBe("flex");
        });
    });

    describe("UI Methods", () => {
        test("showTypingIndicator creates indicator and animates dots", () => {
            const reflection = new ReflectionMatrix();
            reflection.chatLog = document.createElement("div");

            reflection.showTypingIndicator("Thinking");

            expect(reflection.typingDiv).toBeDefined();
            expect(reflection.typingDiv.textContent).toContain("Thinking");
            expect(reflection.dotsContainer).toBeDefined();

            // Fast forward timers for animations
            jest.advanceTimersByTime(500);
            expect(reflection.dotsContainer.textContent).toBe(".");
            jest.advanceTimersByTime(500);
            expect(reflection.dotsContainer.textContent).toBe("..");
            jest.advanceTimersByTime(500);
            expect(reflection.dotsContainer.textContent).toBe("...");
            jest.advanceTimersByTime(500);
            expect(reflection.dotsContainer.textContent).toBe("");
        });

        test("hideTypingIndicator removes indicator and clears interval", () => {
            const reflection = new ReflectionMatrix();
            reflection.chatLog = document.createElement("div");

            reflection.showTypingIndicator("Thinking");
            const typingDiv = reflection.typingDiv;
            const removeSpy = jest.spyOn(typingDiv, "remove");

            reflection.hideTypingIndicator();

            expect(removeSpy).toHaveBeenCalled();
            expect(reflection.typingDiv).toBeNull();
        });

        test("changeMentor updates active mentor and button colors", () => {
            const reflection = new ReflectionMatrix();
            reflection.metaButton = { style: { removeProperty: jest.fn() } };
            reflection.codeButton = { style: { removeProperty: jest.fn() } };
            reflection.musicButton = { style: { removeProperty: jest.fn() } };

            reflection.changeMentor("code");
            expect(reflection.AImentor).toBe("code");
            expect(reflection.codeButton.style.background).toBe("orange");
            expect(reflection.metaButton.style.removeProperty).toHaveBeenCalledWith("background");

            reflection.changeMentor("music");
            expect(reflection.AImentor).toBe("music");
            expect(reflection.musicButton.style.background).toBe("orange");
            expect(reflection.codeButton.style.removeProperty).toHaveBeenCalledWith("background");
        });
    });

    describe("Chat Logic and API Calls", () => {
        // We'll mock botReplyDiv and show/hide indicators extensively
        let reflection;

        beforeEach(() => {
            reflection = new ReflectionMatrix();
            reflection.activity = mockActivity;
            reflection.inputContainer = document.createElement("div");
            reflection.chatLog = document.createElement("div");
            reflection.input = document.createElement("input");
            reflection.summaryButton = document.createElement("button");

            jest.spyOn(reflection, "showTypingIndicator").mockImplementation(() => {});
            jest.spyOn(reflection, "hideTypingIndicator").mockImplementation(() => {});
            jest.spyOn(reflection, "botReplyDiv").mockImplementation(() => {});
        });

        test("startChatSession handles successful API response", async () => {
            jest.spyOn(reflection, "generateAlgorithm").mockResolvedValue({
                algorithm: "mocked_algorithm",
                response: "Hello"
            });

            await reflection.startChatSession();

            expect(reflection.triggerFirst).toBe(true);
            expect(mockActivity.prepareExport).toHaveBeenCalled();
            expect(reflection.generateAlgorithm).toHaveBeenCalledWith("mocked_code");
            expect(reflection.inputContainer.style.display).toBe("flex");
            expect(reflection.botReplyDiv).toHaveBeenCalledWith(
                {
                    algorithm: "mocked_algorithm",
                    response: "Hello"
                },
                false,
                false
            );
            expect(reflection.projectAlgorithm).toBe("mocked_algorithm");
            expect(reflection.code).toBe("mocked_code");
        });

        test("startChatSession handles API error", async () => {
            jest.spyOn(reflection, "generateAlgorithm").mockResolvedValue({
                error: "Network error"
            });

            await reflection.startChatSession();

            expect(reflection.inputContainer.style.display).not.toBe("flex"); // Should not show
            expect(mockActivity.errorMsg).toHaveBeenCalledWith("Network error", 3000);
            expect(reflection.botReplyDiv).not.toHaveBeenCalled();
        });

        test("updateProjectCode skips if code unchanged", async () => {
            reflection.code = "mocked_code"; // Same as prepareExport mock
            jest.spyOn(reflection, "generateNewAlgorithm");

            await reflection.updateProjectCode();

            expect(reflection.generateNewAlgorithm).not.toHaveBeenCalled();
        });

        test("updateProjectCode updates algorithm and calls botReplyDiv on success", async () => {
            reflection.code = "old_code";
            jest.spyOn(reflection, "generateNewAlgorithm").mockResolvedValue({
                algorithm: "new_algorithm",
                response: "Updated"
            });

            await reflection.updateProjectCode();

            expect(reflection.generateNewAlgorithm).toHaveBeenCalledWith("mocked_code");
            expect(reflection.projectAlgorithm).toBe("new_algorithm");
            expect(reflection.code).toBe("mocked_code");
            expect(reflection.botReplyDiv).toHaveBeenCalledWith(
                {
                    algorithm: "new_algorithm",
                    response: "Updated"
                },
                false,
                false
            );
        });

        test("generateAlgorithm makes correct API call", async () => {
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({ algorithm: "alg" })
            });

            const data = await reflection.generateAlgorithm("some_code");

            expect(global.fetch).toHaveBeenCalledWith(`${reflection.PORT}/projectcode`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: "some_code" })
            });
            expect(data).toEqual({ algorithm: "alg" });
        });

        test("generateAlgorithm catches errors", async () => {
            global.fetch.mockRejectedValue(new Error("Net Error"));

            const data = await reflection.generateAlgorithm("some_code");

            expect(data).toEqual({ error: "Failed to send message" });
        });

        test("generateNewAlgorithm makes correct API call", async () => {
            reflection.code = "old_code";
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({ algorithm: "new_alg" })
            });

            const data = await reflection.generateNewAlgorithm("new_code");

            expect(global.fetch).toHaveBeenCalledWith(`${reflection.PORT}/updatecode`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ oldcode: "old_code", newcode: "new_code" })
            });
            expect(data).toEqual({ algorithm: "new_alg" });
        });

        test("generateBotReply makes correct API call", async () => {
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({ response: "AI reply" })
            });

            const data = await reflection.generateBotReply("msg", [], "meta", "alg");

            expect(reflection.showTypingIndicator).toHaveBeenCalled();
            expect(global.fetch).toHaveBeenCalledWith(`${reflection.PORT}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: "msg",
                    messages: [],
                    mentor: "meta",
                    algorithm: "alg"
                })
            });
            expect(reflection.hideTypingIndicator).toHaveBeenCalled();
            expect(data).toEqual({ response: "AI reply" });
        });

        test("getAnalysis calls generateAnalysis and saveReport if length >= 10", async () => {
            reflection.chatHistory = new Array(10).fill({});
            jest.spyOn(reflection, "generateAnalysis").mockResolvedValue({
                response: "Analysis body"
            });
            jest.spyOn(reflection, "saveReport").mockImplementation(() => {});

            await reflection.getAnalysis();

            expect(reflection.generateAnalysis).toHaveBeenCalled();
            expect(reflection.botReplyDiv).toHaveBeenCalledWith(
                { response: "Analysis body" },
                false,
                true
            );
            expect(reflection.saveReport).toHaveBeenCalledWith({ response: "Analysis body" });
        });

        test("sendMessage skips if input is empty", () => {
            reflection.input.value = "   ";
            reflection.sendMessage();

            expect(reflection.chatHistory).toEqual([]);
        });

        test("sendMessage adds user msg to history, updates UI, and triggers botReplyDiv", () => {
            reflection.input.value = "Hello AI";
            reflection.sendMessage();

            // Check history
            expect(reflection.chatHistory.length).toBe(1);
            expect(reflection.chatHistory[0]).toEqual({ role: "user", content: "Hello AI" });

            // Check UI
            expect(reflection.chatLog.childNodes.length).toBe(1);
            expect(reflection.chatLog.childNodes[0].classList.contains("user")).toBe(true);

            // Input cleared
            expect(reflection.input.value).toBe("");

            // Triggered bot
            expect(reflection.botReplyDiv).toHaveBeenCalledWith("Hello AI");
        });

        test("renderChatHistory clears log and appends history", () => {
            reflection.chatHistory = [
                { role: "user", content: "msg1" },
                { role: "meta", content: "msg2" }
            ];

            reflection.renderChatHistory();

            expect(reflection.chatLog.childNodes.length).toBe(2);
            expect(reflection.chatLog.childNodes[0].classList.contains("user")).toBe(true);
            expect(reflection.chatLog.childNodes[1].classList.contains("user")).toBe(false);
        });

        test("saveReport stores data in localStorage", () => {
            const setItemSpy = jest.spyOn(Storage.prototype, "setItem");

            reflection.saveReport({ response: "data" });

            expect(setItemSpy).toHaveBeenCalledWith("musicblocks_analysis", "data");
        });

        test("readReport retrieves data from localStorage", () => {
            jest.spyOn(Storage.prototype, "getItem").mockReturnValue("local_data");

            const result = reflection.readReport();

            expect(result).toBe("local_data");
        });

        test("downloadAsTxt does not download if empty history", () => {
            const anchorSpy = jest.spyOn(document, "createElement");

            reflection.downloadAsTxt([]);

            expect(reflection.activity.errorMsg).toHaveBeenCalled();
            expect(anchorSpy).not.toHaveBeenCalledWith("a");
        });

        test("downloadAsTxt creates anchor and clicks it", () => {
            const mockClick = jest.fn();
            // Since we use document.createElement inside, we intercept "a" creation
            const originalCreate = document.createElement.bind(document);
            const spy = jest.spyOn(document, "createElement").mockImplementation(tag => {
                if (tag === "a") {
                    const el = originalCreate(tag);
                    el.click = mockClick;
                    return el;
                }
                return originalCreate(tag);
            });

            reflection.downloadAsTxt([{ role: "user", content: "Hello" }]);

            expect(mockClick).toHaveBeenCalled();
            expect(global.URL.createObjectURL).toHaveBeenCalled();
            expect(global.URL.revokeObjectURL).toHaveBeenCalled();

            spy.mockRestore();
        });
    });

    describe("HTML Security and Markdown", () => {
        let reflection;

        beforeEach(() => {
            reflection = new ReflectionMatrix();
        });

        test("escapeHTML replaces special characters", () => {
            const input = "<div id='test'>&\"</div>";
            const output = reflection.escapeHTML(input);
            expect(output).toBe("&lt;div id=&#x27;test&#x27;&gt;&amp;&quot;&lt;/div&gt;");
        });

        test("isUnsafeUrl flags javascript/data/vbscript correctly", () => {
            expect(reflection.isUnsafeUrl("javascript:alert(1)")).toBe(true);
            expect(reflection.isUnsafeUrl("jAvAsCrIpT:alert(1)")).toBe(true);
            expect(reflection.isUnsafeUrl("data:text/html,<script>")).toBe(true);
            expect(reflection.isUnsafeUrl("vbscript:msgbox(1)")).toBe(true);
            expect(reflection.isUnsafeUrl("  javascript:  ")).toBe(true);

            expect(reflection.isUnsafeUrl("http://google.com")).toBe(false);
            expect(reflection.isUnsafeUrl("https://example.com")).toBe(false);
            expect(reflection.isUnsafeUrl("mailto:test@test.com")).toBe(false);
        });

        test("sanitizeHTML removes unsafe hrefs and adds target blank", () => {
            const input = `<div>
                <a href="javascript:alert(1)">Bad Link</a>
                <a href="http://good.com">Good Link</a>
            </div>`;
            const output = reflection.sanitizeHTML(input);

            expect(output).not.toContain('href="javascript:alert(1)"');
            expect(output).toContain('href="http://good.com"');
            expect(output).toContain('target="_blank"');
            expect(output).toContain('rel="noopener noreferrer"');
        });

        test("mdToHTML converts markdown to safe HTML", () => {
            // Note: because mdToHTML escapes everything first, bold and link
            // transformations are applied on the escaped string.
            const markdown = `
# Head
**Bold**
*Italic*
[Link](http://a.com)
<script>alert(1)</script>
            `.trim();

            const html = reflection.mdToHTML(markdown);

            expect(html).toContain("<h1>Head</h1>");
            expect(html).toContain("<b>Bold</b>");
            expect(html).toContain("<i>Italic</i>");
            expect(html).toContain(
                '<a href="http://a.com" target="_blank" rel="noopener noreferrer">Link</a>'
            );

            // XSS script tags should be escaped, so they appear as text, not tags
            expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
            expect(html).not.toContain("<script>");
        });
    });
});
