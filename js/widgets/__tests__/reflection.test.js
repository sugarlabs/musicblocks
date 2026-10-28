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

const { escapeHTML, isSafeUrl } = require("../../utils/utils");
global.escapeHTML = escapeHTML;
global.isSafeUrl = isSafeUrl;

const ManagedTimer = require("../../utils/ManagedTimer.js");
global.ManagedTimer = ManagedTimer;

const ReflectionMatrix = require("../reflection");
const { aiWidgetConsent } = require("../../utils/ai-widget-lifecycle");

// Mock globals
global._ = str => str;

// Mock window.widgetWindows and widget
function createMockWidgetWindow() {
    const widgetBody = document.createElement("div");
    return {
        clear: jest.fn(),
        show: jest.fn(),
        sendToCenter: jest.fn(),
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
    // Consent is shared by the AI widgets for the page session, so each test
    // starts from a child who has not agreed yet.
    aiWidgetConsent.given = false;

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
                code: "ALAN",
                report: "REPORT"
            });
            expect(reflection.triggerFirst).toBe(false);
            expect(reflection.projectAlgorithm).toBe("");
            expect(reflection.code).toBe("");
            expect(reflection.pendingMessages).toEqual([]);
            expect(reflection.isProcessingPendingMessage).toBe(false);
            expect(reflection._lifecycle.isMounted).toBe(false);
            expect(reflection._lifecycle.pendingRequests.size).toBe(0);
        });
    });
    describe("backendURL()", () => {
        test("uses the local server on localhost", () => {
            expect(ReflectionMatrix.backendURL("localhost")).toBe("http://localhost:8000");
            expect(ReflectionMatrix.backendURL("127.0.0.1")).toBe("http://127.0.0.1:8000");
        });

        test("uses the HTTPS API on the hosted site", () => {
            expect(ReflectionMatrix.backendURL("musicblocks.sugarlabs.org")).toBe(
                "https://api.musicblocks.sugarlabs.org"
            );
        });

        test("uses the HTTPS API on the GitHub Pages site", () => {
            expect(ReflectionMatrix.backendURL("sugarlabs.github.io")).toBe(
                "https://api.musicblocks.sugarlabs.org"
            );
        });

        test("uses the HTTPS API on a subdomain of the hosted site", () => {
            expect(ReflectionMatrix.backendURL("staging.musicblocks.sugarlabs.org")).toBe(
                "https://api.musicblocks.sugarlabs.org"
            );
        });

        test("returns null on a host without a known backend", () => {
            expect(ReflectionMatrix.backendURL("example.com")).toBeNull();
            expect(ReflectionMatrix.backendURL("musicblocks.sugarlabs.org.example.com")).toBeNull();
        });

        test("does not read an inherited object property as a backend", () => {
            expect(ReflectionMatrix.backendURL("constructor")).toBeNull();
            expect(ReflectionMatrix.backendURL("toString")).toBeNull();
        });

        test("falls back to the host the page is served from", () => {
            expect(ReflectionMatrix.backendURL()).toBe("http://localhost:8000");
        });

        test("sends nothing and reports when no backend is configured", async () => {
            const reflection = new ReflectionMatrix();
            reflection.PORT = null;
            reflection.activity = mockActivity;

            await expect(reflection.generateAlgorithm("code")).resolves.toBeNull();

            expect(mockActivity.errorMsg).toHaveBeenCalled();
            expect(global.fetch).not.toHaveBeenCalled();
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
            expect(reflection.PORT).toBe("http://localhost:8000");

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

        test("Asks again when reopened after closing before the first reply", () => {
            const reflection = new ReflectionMatrix();
            const start = jest.spyOn(reflection, "startChatSession").mockImplementation(() => {
                reflection.triggerFirst = true;
            });

            reflection.init(mockActivity);
            mockWidgetWindow.onclose();
            expect(reflection.triggerFirst).toBe(false);

            reflection.init(mockActivity);
            expect(start).toHaveBeenCalledTimes(2);
        });

        test("Asks again when the block runs while the first description is pending", async () => {
            const reflection = new ReflectionMatrix();
            reflection._lifecycle.giveConsent();
            // The first description never comes back.
            global.fetch.mockImplementation(() => new Promise(() => {}));
            const flush = async () => {
                for (let i = 0; i < 10; i++) await Promise.resolve();
            };

            reflection.init(mockActivity);
            await flush();
            reflection.init(mockActivity);
            await flush();

            expect(global.fetch).toHaveBeenCalledTimes(2);
            expect(global.fetch.mock.calls[1][0]).toBe(`${reflection.PORT}/projectcode`);
        });

        test("Grows the chat with the window when maximized", () => {
            const reflection = new ReflectionMatrix();
            jest.spyOn(reflection, "startChatSession").mockImplementation(() => {});
            reflection.init(mockActivity);
            const body = mockWidgetWindow.getWidgetBody();

            mockWidgetWindow.isMaximized = jest.fn(() => true);
            mockWidgetWindow.onmaximize();
            expect(body.style.width).toBe("100%");
            expect(body.style.height).toBe("100%");

            mockWidgetWindow.isMaximized.mockReturnValue(false);
            mockWidgetWindow.onmaximize();
            expect(body.style.width).toBe(ReflectionMatrix.OUTERWINDOWWIDTH);
            expect(body.style.height).toBe(ReflectionMatrix.OUTERWINDOWHEIGHT);
        });

        test("Opens when the browser blocks localStorage", () => {
            const reflection = new ReflectionMatrix();
            jest.spyOn(reflection, "startChatSession").mockImplementation(() => {});
            jest.spyOn(console, "warn").mockImplementation(() => {});
            jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
                throw new Error("SecurityError");
            });

            reflection.init(mockActivity);

            expect(reflection.summary).toBe("No reports available");
            expect(reflection.chatLog).toBeDefined();
        });

        test("Keeps messages within the length the server accepts", () => {
            const reflection = new ReflectionMatrix();
            jest.spyOn(reflection, "startChatSession").mockImplementation(() => {});

            reflection.init(mockActivity);

            // ChatRequest.query in mb-server-ai/widgets.py is at most 2000.
            expect(reflection.input.maxLength).toBe(2000);
        });

        test("Does not send when Enter confirms a word in an input method", () => {
            const reflection = new ReflectionMatrix();
            jest.spyOn(reflection, "startChatSession").mockImplementation(() => {});
            jest.spyOn(reflection, "sendMessage").mockImplementation(() => {});

            reflection.init(mockActivity);
            reflection.input.onkeydown({ key: "Enter", isComposing: true });
            // Safari reports the confirming Enter with keyCode 229 instead.
            reflection.input.onkeydown({ key: "Enter", isComposing: false, keyCode: 229 });

            expect(reflection.sendMessage).not.toHaveBeenCalled();
        });

        test("Sets up onclose handler", () => {
            const reflection = new ReflectionMatrix();
            jest.spyOn(reflection, "startChatSession").mockImplementation(() => {});

            reflection.init(mockActivity);

            expect(mockWidgetWindow.onclose).not.toBeNull();

            // Trigger close
            reflection.dotsInterval = setInterval(() => {}, 1000);
            const abortSpy = jest.fn();
            reflection._lifecycle.pendingRequests.add({ abort: abortSpy });
            mockWidgetWindow.onclose();

            expect(reflection.isOpen).toBe(false);
            expect(reflection._lifecycle.isMounted).toBe(false);
            expect(mockActivity.isInputON).toBe(false);
            expect(abortSpy).toHaveBeenCalled();
            expect(reflection._lifecycle.pendingRequests.size).toBe(0);
            expect(reflection.pendingMessages).toEqual([]);
            expect(reflection.isProcessingPendingMessage).toBe(false);
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

        test("Starts a new conversation when reopened in a different project", () => {
            let projectId = "first";
            mockActivity.planet = { getCurrentProjectID: () => projectId };
            const reflection = new ReflectionMatrix();
            jest.spyOn(reflection, "startChatSession").mockImplementation(() => {});
            jest.spyOn(reflection, "renderChatHistory").mockImplementation(() => {});

            reflection.init(mockActivity);
            reflection.chatHistory = [{ role: "user", content: "Hi" }];
            reflection.projectAlgorithm = "1. Play a C major scale.";
            reflection.code = "old code";
            reflection.triggerFirst = true;
            mockWidgetWindow.onclose();

            // Reopened in the same project, the chat comes back.
            reflection.init(mockActivity);
            expect(reflection.renderChatHistory).toHaveBeenCalledTimes(1);
            mockWidgetWindow.onclose();

            projectId = "second";
            reflection.init(mockActivity);
            expect(reflection.chatHistory).toEqual([]);
            expect(reflection.projectAlgorithm).toBe("");
            expect(reflection.code).toBe("");
            expect(reflection.renderChatHistory).toHaveBeenCalledTimes(1);
            expect(reflection.startChatSession).toHaveBeenCalledTimes(2);
        });
    });

    describe("Consent before sending", () => {
        const flush = async () => {
            for (let i = 0; i < 10; i++) await Promise.resolve();
        };
        const banner = reflection => reflection.chatLog.querySelector(".reflection-consent-banner");

        test("asks before sending the project, and sends nothing when declined", async () => {
            const reflection = new ReflectionMatrix();

            reflection.init(mockActivity);
            await flush();

            expect(global.fetch).not.toHaveBeenCalled();
            expect(mockActivity.prepareExport).not.toHaveBeenCalled();
            expect(banner(reflection).textContent).toContain("Before we start");
            expect(banner(reflection).textContent).toContain(reflection.PORT);

            reflection.chatLog.querySelector(".reflection-cancel-btn").onclick();
            await flush();

            expect(global.fetch).not.toHaveBeenCalled();
            expect(banner(reflection)).toBeNull();
            expect(reflection.chatLog.textContent).toContain("Nothing was sent");
            expect(reflection._lifecycle.hasConsent()).toBe(false);
            expect(reflection.triggerFirst).toBe(false);
        });

        test("starts the session once the child agrees", async () => {
            const reflection = new ReflectionMatrix();
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({ algorithm: "alg", response: "Hello" })
            });

            reflection.init(mockActivity);
            banner(reflection).querySelectorAll("button")[0].onclick();
            await flush();

            expect(global.fetch).toHaveBeenCalledTimes(1);
            expect(global.fetch.mock.calls[0][0]).toBe(`${reflection.PORT}/projectcode`);
            expect(banner(reflection)).toBeNull();
            expect(reflection.projectAlgorithm).toBe("alg");
        });

        test("does not ask again once the child agreed in either AI widget", async () => {
            const reflection = new ReflectionMatrix();
            // As if the child agreed in the AI Debugger earlier.
            aiWidgetConsent.given = true;
            global.fetch.mockImplementation(() => new Promise(() => {}));

            reflection.init(mockActivity);
            await flush();

            expect(banner(reflection)).toBeNull();
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        test("asks again when reopened after declining", async () => {
            const reflection = new ReflectionMatrix();

            reflection.init(mockActivity);
            reflection.chatLog.querySelector(".reflection-cancel-btn").onclick();
            mockWidgetWindow.onclose();
            reflection.init(mockActivity);
            await flush();

            expect(banner(reflection)).not.toBeNull();
            expect(global.fetch).not.toHaveBeenCalled();
        });

        test("Refresh before consent asks instead of sending", async () => {
            const reflection = new ReflectionMatrix();

            reflection.init(mockActivity);
            reflection.chatLog.querySelector(".reflection-cancel-btn").onclick();
            await reflection.updateProjectCode();

            expect(banner(reflection)).not.toBeNull();
            expect(mockActivity.prepareExport).not.toHaveBeenCalled();
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    describe("UI Methods", () => {
        test("showTypingIndicator creates indicator and animates dots", () => {
            const reflection = new ReflectionMatrix();
            reflection.chatLog = document.createElement("div");
            reflection._lifecycle.isMounted = true;
            reflection.isOpen = true;

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
            reflection._lifecycle.isMounted = true;
            reflection.isOpen = true;

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
            reflection._lifecycle.isMounted = true;
            reflection._lifecycle.giveConsent();
            reflection.isOpen = true;
            reflection.PORT = ReflectionMatrix.backendURL();

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
            // Otherwise reopening the window would stay blank.
            expect(reflection.triggerFirst).toBe(false);
        });

        test("updateProjectCode waits for the first description", async () => {
            reflection.triggerFirst = true;
            jest.spyOn(reflection, "generateNewAlgorithm");

            await reflection.updateProjectCode();

            expect(mockActivity.prepareExport).not.toHaveBeenCalled();
            expect(reflection.generateNewAlgorithm).not.toHaveBeenCalled();
        });

        test("updateProjectCode shows the input after the first description failed", async () => {
            reflection.inputContainer.style.display = "none";
            jest.spyOn(reflection, "generateNewAlgorithm").mockResolvedValue({
                algorithm: "alg",
                response: "Your project plays a scale."
            });

            await reflection.updateProjectCode();

            expect(reflection.inputContainer.style.display).toBe("flex");
        });

        test("shows the server's error text, such as the rate limit", async () => {
            const limit = "That is a lot of requests in one minute. Please wait a little.";
            global.fetch.mockResolvedValue({
                ok: false,
                status: 429,
                json: jest.fn().mockResolvedValue({ error: limit })
            });
            reflection.pendingMessages = [{ text: "Hi", mentor: "meta", algorithm: "alg" }];

            await reflection.processPendingMessages();

            expect(mockActivity.errorMsg).toHaveBeenCalledWith(limit, 3000);
        });

        test("treats a reply without a response as an error", async () => {
            global.fetch.mockResolvedValue({
                ok: false,
                status: 404,
                json: jest.fn().mockResolvedValue({ detail: "Not Found" })
            });
            jest.spyOn(reflection, "appendBotReply");
            reflection.pendingMessages = [{ text: "Hi", mentor: "meta", algorithm: "alg" }];

            await reflection.processPendingMessages();

            expect(reflection.appendBotReply).not.toHaveBeenCalled();
            expect(mockActivity.errorMsg).toHaveBeenCalledWith("Failed to send message.", 3000);
        });

        test("appendBotReply enables the summary button when getAnalysis allows it", () => {
            reflection.chatHistory = new Array(9).fill({ role: "user", content: "Hi" });
            reflection.summaryButton = { style: { removeProperty: jest.fn() } };

            reflection.appendBotReply({ response: "Tenth message" });

            expect(reflection.chatHistory.length).toBe(10);
            expect(reflection.summaryButton.style.removeProperty).toHaveBeenCalledWith(
                "background"
            );
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
                json: jest.fn().mockResolvedValue({ algorithm: "alg", response: "Hi" })
            });

            const data = await reflection.generateAlgorithm("some_code");

            expect(global.fetch).toHaveBeenCalledWith(
                `${reflection.PORT}/projectcode`,
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: expect.anything(),
                    body: JSON.stringify({ code: "some_code" })
                })
            );
            expect(data).toEqual({ algorithm: "alg", response: "Hi" });
        });

        test("generateAlgorithm catches errors", async () => {
            global.fetch.mockRejectedValue(new Error("Net Error"));

            const data = await reflection.generateAlgorithm("some_code");

            expect(data).toEqual({ error: "Failed to send message." });
        });

        test("generateNewAlgorithm makes correct API call", async () => {
            reflection.code = "old_code";
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({ algorithm: "new_alg", response: "Hi" })
            });

            const data = await reflection.generateNewAlgorithm("new_code");

            expect(global.fetch).toHaveBeenCalledWith(
                `${reflection.PORT}/updatecode`,
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ oldcode: "old_code", newcode: "new_code" })
                })
            );
            expect(data).toEqual({ algorithm: "new_alg", response: "Hi" });
        });

        test("generateBotReply makes correct API call", async () => {
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({ response: "AI reply" })
            });

            const data = await reflection.generateBotReply("msg", [], "meta", "alg");

            expect(reflection.showTypingIndicator).toHaveBeenCalled();
            expect(global.fetch).toHaveBeenCalledWith(
                `${reflection.PORT}/chat`,
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        query: "msg",
                        messages: [],
                        mentor: "meta",
                        algorithm: "alg",
                        conversation_summary: null,
                        summarized_up_to: 0
                    })
                })
            );
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
                true,
                "report"
            );
            expect(reflection.saveReport).toHaveBeenCalledWith({ response: "Analysis body" });
        });

        test("generateAnalysis catches errors", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            global.fetch.mockRejectedValue(new Error("Net Error"));

            const data = await reflection.generateAnalysis();

            expect(data).toEqual({ error: "Failed to send message." });
            expect(consoleSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
        });

        test("sendMessage skips if input is empty", () => {
            reflection.input.value = "   ";
            reflection.sendMessage();

            expect(reflection.chatHistory).toEqual([]);
        });

        test("sendMessage queues user input, updates UI, and starts processing", () => {
            jest.spyOn(reflection, "processPendingMessages").mockResolvedValue();
            reflection.input.value = "Hello AI";

            reflection.sendMessage();

            // Check UI
            expect(reflection.chatLog.childNodes.length).toBe(1);
            expect(reflection.chatLog.childNodes[0].classList.contains("user")).toBe(true);
            expect(reflection.chatLog.childNodes[0].lastChild.innerText).toBe("Hello AI");

            // Check queue
            expect(reflection.pendingMessages).toEqual([
                {
                    text: "Hello AI",
                    mentor: "meta",
                    algorithm: ""
                }
            ]);

            // Input cleared
            expect(reflection.input.value).toBe("");

            // Triggered queue processor
            expect(reflection.processPendingMessages).toHaveBeenCalled();
        });

        test("sendMessage queues input instead of dropping it while a reply is pending", () => {
            reflection.isProcessingPendingMessage = true;
            reflection.input.value = "Hello again";

            reflection.sendMessage();

            expect(reflection.pendingMessages).toEqual([
                {
                    text: "Hello again",
                    mentor: "meta",
                    algorithm: ""
                }
            ]);
            expect(reflection.chatLog.childNodes[0].lastChild.innerText).toBe("Hello again");
        });

        test("processPendingMessages sends queued messages in order", async () => {
            reflection.pendingMessages = [
                { text: "First", mentor: "meta", algorithm: "alg-1" },
                { text: "Second", mentor: "code", algorithm: "alg-2" }
            ];

            jest.spyOn(reflection, "generateBotReply")
                .mockResolvedValueOnce({ response: "Reply 1" })
                .mockResolvedValueOnce({ response: "Reply 2" });
            jest.spyOn(reflection, "appendBotReply").mockImplementation(() => {});

            await reflection.processPendingMessages();

            expect(reflection.generateBotReply).toHaveBeenCalledTimes(2);
            expect(reflection.generateBotReply.mock.calls[0][0]).toBe("First");
            expect(reflection.generateBotReply.mock.calls[0][2]).toBe("meta");
            expect(reflection.generateBotReply.mock.calls[0][3]).toBe("alg-1");
            expect(reflection.generateBotReply.mock.calls[1][0]).toBe("Second");
            expect(reflection.generateBotReply.mock.calls[1][2]).toBe("code");
            expect(reflection.generateBotReply.mock.calls[1][3]).toBe("alg-2");
            expect(reflection.appendBotReply).toHaveBeenNthCalledWith(
                1,
                { response: "Reply 1" },
                "meta"
            );
            expect(reflection.appendBotReply).toHaveBeenNthCalledWith(
                2,
                { response: "Reply 2" },
                "code"
            );
            expect(reflection.chatHistory).toEqual([
                { role: "user", content: "First" },
                { role: "user", content: "Second" }
            ]);
            expect(reflection.pendingMessages).toEqual([]);
            expect(reflection.isProcessingPendingMessage).toBe(false);
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

    describe("Async lifecycle", () => {
        let reflection;

        beforeEach(() => {
            reflection = new ReflectionMatrix();
            reflection.activity = mockActivity;
            reflection.chatLog = document.createElement("div");
            reflection.input = document.createElement("input");
            reflection._lifecycle.isMounted = true;
            reflection._lifecycle.giveConsent();
            reflection.isOpen = true;
            reflection.PORT = ReflectionMatrix.backendURL();
        });

        test("sendMessage ignores input after the widget is closed", () => {
            reflection.input.value = "Hello AI";
            reflection._lifecycle.isMounted = false;

            reflection.sendMessage();

            expect(reflection.chatLog.childNodes.length).toBe(0);
            expect(reflection.pendingMessages).toEqual([]);
        });

        test("processPendingMessages stops and drops queued messages after close", async () => {
            reflection.pendingMessages = [
                { text: "First", mentor: "meta", algorithm: "alg-1" },
                { text: "Second", mentor: "code", algorithm: "alg-2" }
            ];
            reflection._lifecycle.isMounted = false;

            await reflection.processPendingMessages();

            expect(reflection.chatHistory).toEqual([]);
            expect(reflection.isProcessingPendingMessage).toBe(false);
        });

        test("processPendingMessages ignores late replies after close", async () => {
            reflection.pendingMessages = [{ text: "First", mentor: "meta", algorithm: "alg-1" }];
            const appendSpy = jest.spyOn(reflection, "appendBotReply");

            let resolveFetch;
            global.fetch.mockImplementation(
                () =>
                    new Promise(resolve => {
                        resolveFetch = resolve;
                    })
            );

            const processing = reflection.processPendingMessages();
            reflection._lifecycle.isMounted = false;

            resolveFetch({ json: jest.fn().mockResolvedValue({ response: "Late reply" }) });
            await processing;

            expect(reflection.chatHistory).toEqual([{ role: "user", content: "First" }]);
            expect(appendSpy).not.toHaveBeenCalled();
        });

        test("botReplyDiv preserves the mentor selected when the request started", async () => {
            reflection.chatHistory = [];
            reflection.AImentor = "meta";
            reflection.projectAlgorithm = "alg";

            let resolveFetch;
            global.fetch.mockImplementation(
                () =>
                    new Promise(resolve => {
                        resolveFetch = resolve;
                    })
            );

            const replyPromise = reflection.botReplyDiv("Hello");
            reflection.AImentor = "code";
            resolveFetch({ json: jest.fn().mockResolvedValue({ response: "Still from Rohan" }) });
            await replyPromise;

            expect(reflection.chatHistory[reflection.chatHistory.length - 1]).toEqual({
                role: "meta",
                content: "Still from Rohan"
            });
            expect(reflection.chatLog.lastChild.firstChild.innerText).toBe("ROHAN");
        });

        test("updateProjectCode ignores repeat clicks while a request is in flight", async () => {
            reflection.code = "old_code";
            reflection.inputContainer = document.createElement("div");

            let resolveExport;
            mockActivity.prepareExport.mockImplementation(
                () =>
                    new Promise(resolve => {
                        resolveExport = resolve;
                    })
            );
            const generateSpy = jest
                .spyOn(reflection, "generateNewAlgorithm")
                .mockResolvedValue({ algorithm: "new_alg", response: "Updated" });

            const first = reflection.updateProjectCode();
            const second = reflection.updateProjectCode();

            resolveExport("new_code");
            await Promise.all([first, second]);

            expect(generateSpy).toHaveBeenCalledTimes(1);
            expect(reflection._isUpdatingProjectCode).toBe(false);
        });

        test("updateProjectCode releases the in-flight flag on error", async () => {
            reflection.code = "old_code";
            reflection.inputContainer = document.createElement("div");
            mockActivity.prepareExport.mockResolvedValue("new_code");
            jest.spyOn(reflection, "generateNewAlgorithm").mockResolvedValue(null);

            await reflection.updateProjectCode();

            expect(reflection._isUpdatingProjectCode).toBe(false);
        });

        test("startChatSession can start a new session after an aborted request", async () => {
            reflection.inputContainer = document.createElement("div");

            let resolveFetch;
            mockActivity.prepareExport.mockResolvedValue("mocked_code");
            global.fetch.mockImplementation(
                () =>
                    new Promise(resolve => {
                        resolveFetch = resolve;
                    })
            );

            const first = reflection.startChatSession();
            await Promise.resolve();
            reflection._lifecycle.isMounted = false;
            reflection.isOpen = false;
            resolveFetch({ json: jest.fn().mockResolvedValue({ response: "Late" }) });
            await first;

            expect(reflection.triggerFirst).toBe(false);

            reflection._lifecycle.isMounted = true;
            reflection.isOpen = true;
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({ algorithm: "alg", response: "Hello" })
            });

            await reflection.startChatSession();

            expect(reflection.triggerFirst).toBe(true);
            expect(reflection.projectAlgorithm).toBe("alg");
        });

        test("startChatSession ignores a response that lands after a close and reopen", async () => {
            reflection.inputContainer = document.createElement("div");
            reflection.projectAlgorithm = "current_alg";
            const replySpy = jest.spyOn(reflection, "botReplyDiv").mockResolvedValue(undefined);

            let resolveFetch;
            mockActivity.prepareExport.mockResolvedValue("mocked_code");
            global.fetch.mockImplementation(
                () =>
                    new Promise(resolve => {
                        resolveFetch = resolve;
                    })
            );

            const stale = reflection.startChatSession();
            await Promise.resolve();

            // The widget is closed and opened again while the request is in flight.
            reflection._lifecycle.unmount();
            reflection._lifecycle.mount();
            reflection.triggerFirst = false;

            resolveFetch({
                json: jest.fn().mockResolvedValue({ algorithm: "stale_alg", response: "Late" })
            });
            await stale;

            expect(replySpy).not.toHaveBeenCalled();
            expect(reflection.projectAlgorithm).toBe("current_alg");
            expect(reflection.triggerFirst).toBe(false);
        });

        test("updateProjectCode leaves the refresh flag of a reopened widget alone", async () => {
            reflection.code = "old_code";
            reflection.inputContainer = document.createElement("div");

            let resolveExport;
            mockActivity.prepareExport.mockImplementation(
                () =>
                    new Promise(resolve => {
                        resolveExport = resolve;
                    })
            );
            const generateSpy = jest.spyOn(reflection, "generateNewAlgorithm");

            const stale = reflection.updateProjectCode();

            reflection._lifecycle.unmount();
            reflection._lifecycle.mount();
            // The reopened widget has started a refresh of its own.
            reflection._isUpdatingProjectCode = true;

            resolveExport("new_code");
            await stale;

            expect(generateSpy).not.toHaveBeenCalled();
            expect(reflection._isUpdatingProjectCode).toBe(true);
        });

        test("_postJSON aborts the request when it times out", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

            global.fetch.mockImplementation(
                (url, request) =>
                    new Promise((resolve, reject) => {
                        request.signal.addEventListener("abort", () => {
                            const error = new Error("The operation was aborted");
                            error.name = "AbortError";
                            reject(error);
                        });
                    })
            );

            const dataPromise = reflection.generateAlgorithm("some_code");
            jest.advanceTimersByTime(ReflectionMatrix.REQUEST_TIMEOUT + 1);
            const data = await dataPromise;

            expect(data).toEqual({ error: "Failed to send message." });
            expect(reflection._lifecycle.pendingRequests.size).toBe(0);

            consoleSpy.mockRestore();
        });

        test("getAnalysis ignores repeat clicks while a request is in flight", async () => {
            reflection.chatHistory = new Array(10).fill({});
            reflection.typingDiv = document.createElement("div");
            const generateSpy = jest.spyOn(reflection, "generateAnalysis");

            await reflection.getAnalysis();

            expect(generateSpy).not.toHaveBeenCalled();
        });

        test("Summary on a short chat says the chat has to be longer", async () => {
            reflection.chatHistory = new Array(9).fill({ role: "user", content: "Hi" });

            await reflection.getAnalysis();

            expect(global.fetch).not.toHaveBeenCalled();
            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                expect.stringContaining("longer"),
                3000
            );
        });

        test("labels the summary as a report, not as the selected mentor", async () => {
            reflection.summaryButton = document.createElement("button");
            reflection.chatHistory = new Array(10).fill({ role: "user", content: "Hi" });
            reflection.AImentor = "music";
            // The report is Markdown. Sanitizing is tested in ai-markdown.test.js.
            global.DOMPurify = { sanitize: html => html };
            jest.spyOn(reflection, "saveReport").mockImplementation(() => {});
            global.fetch.mockResolvedValue({
                json: jest.fn().mockResolvedValue({ response: "Your report" })
            });

            await reflection.getAnalysis();

            expect(reflection.chatHistory[10]).toEqual({ role: "report", content: "Your report" });
            expect(reflection.chatLog.lastChild.firstChild.innerText).toBe("REPORT");

            reflection.renderChatHistory();
            expect(reflection.chatLog.lastChild.firstChild.innerText).toBe("REPORT");
            delete global.DOMPurify;
        });

        test("closing takes back a message that was still waiting for its reply", async () => {
            const widget = new ReflectionMatrix();
            const answered = [
                { role: "meta", content: "Your project plays a scale." },
                { role: "user", content: "Why?" },
                { role: "meta", content: "To practise." }
            ];
            widget.chatHistory = answered.slice();
            widget._lifecycle.giveConsent();
            global.fetch.mockImplementation(
                (url, request) =>
                    new Promise((resolve, reject) => {
                        request.signal.addEventListener("abort", () => {
                            const error = new Error("The operation was aborted");
                            error.name = "AbortError";
                            reject(error);
                        });
                    })
            );

            widget.init(mockActivity);
            widget.input.value = "Can it be faster?";
            widget.sendMessage();
            expect(widget.chatHistory.length).toBe(4);

            mockWidgetWindow.onclose();
            for (let i = 0; i < 10; i++) await Promise.resolve();

            expect(widget.chatHistory).toEqual(answered);
            widget.init(mockActivity);
            expect(widget.chatLog.querySelectorAll(".message-container").length).toBe(3);
        });
    });

    describe("HTML Security and Markdown", () => {
        let reflection;

        beforeEach(() => {
            reflection = new ReflectionMatrix();
        });

        test("escapeHTML replaces special characters", () => {
            const input = "<div id='test'>&\"</div>";
            const output = escapeHTML(input);
            expect(output).toBe("&lt;div id=&#039;test&#039;&gt;&amp;&quot;&lt;/div&gt;");
        });

        test("isUnsafeUrl flags javascript/data/vbscript correctly", () => {
            expect(reflection.isUnsafeUrl("javascript:alert(1)")).toBe(true);
            expect(reflection.isUnsafeUrl("jAvAsCrIpT:alert(1)")).toBe(true);
            expect(reflection.isUnsafeUrl("data:text/html,<script>")).toBe(true);
            expect(reflection.isUnsafeUrl("vbscript:msgbox(1)")).toBe(true);
            expect(reflection.isUnsafeUrl("  javascript:  ")).toBe(true);

            expect(reflection.isUnsafeUrl("http://google.com")).toBe(false);
            expect(reflection.isUnsafeUrl("https://example.com")).toBe(false);
            expect(reflection.isUnsafeUrl("mailto:test@test.com")).toBe(true);

            // Bypass attempts
            expect(reflection.isUnsafeUrl("&#106;avascript:alert(1)")).toBe(true);
            expect(reflection.isUnsafeUrl("javascript&colon;alert(1)")).toBe(true);
            expect(reflection.isUnsafeUrl("java\tscript:alert(1)")).toBe(true);
            expect(reflection.isUnsafeUrl("jav\rascript:alert(1)")).toBe(true);
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

            const input2 = '<a href="javascript&#58;alert(1)">Bypass Link</a>';
            const output2 = reflection.sanitizeHTML(input2);
            expect(output2).not.toContain('href="javascript&#58;alert(1)"');
            expect(output2).not.toContain('href="javascript:alert(1)"');
        });

        test("sanitizeHTML removes unsafe src and style attributes", () => {
            const input = `<div>
                <img src="javascript:alert(1)" alt="bad">
                <img src="http://good.com/img.png" alt="good">
                <div style="color: red; background-image: url('javascript:alert(1)')">Bad Style</div>
                <div style="color: blue;">Good Style</div>
            </div>`;
            const output = reflection.sanitizeHTML(input);

            expect(output).not.toContain('src="javascript:alert(1)"');
            expect(output).toContain('src="http://good.com/img.png"');
            expect(output).not.toContain(
                "style=\"color: red; background-image: url('javascript:alert(1)')\""
            );
            expect(output).toContain('style="color: blue;"');
        });

        test("sanitizeHTML removes forbidden tags", () => {
            const input = `<div>
                <p>Safe</p>
                <script>alert(1)</script>
                <iframe src="http://example.com"></iframe>
                <object data="bad.swf"></object>
            </div>`;
            const output = reflection.sanitizeHTML(input);

            expect(output).toContain("<p>Safe</p>");
            expect(output).not.toContain("<script>");
            expect(output).not.toContain("<iframe>");
            expect(output).not.toContain("<object>");
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

    describe("timer fallback without ManagedTimer", () => {
        let reflection;
        let timeouts;
        let intervals;

        beforeEach(() => {
            timeouts = new Map();
            intervals = new Map();
            let nextTimeoutId = 1;
            let nextIntervalId = 1;

            jest.spyOn(global, "setTimeout").mockImplementation(cb => {
                const id = nextTimeoutId++;
                timeouts.set(id, cb);
                return id;
            });
            jest.spyOn(global, "clearTimeout").mockImplementation(id => {
                timeouts.delete(id);
            });

            jest.spyOn(global, "setInterval").mockImplementation(cb => {
                const id = nextIntervalId++;
                intervals.set(id, cb);
                return id;
            });
            jest.spyOn(global, "clearInterval").mockImplementation(id => {
                intervals.delete(id);
            });

            reflection = new ReflectionMatrix();
            reflection._timerManager = null;
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("_setWidgetTimeout tracks timeout and executes callback, then un-tracks", () => {
            const callback = jest.fn();
            const id = reflection._setWidgetTimeout(callback, 500);

            expect(reflection._activeTimeouts.has(id)).toBe(true);
            expect(timeouts.has(id)).toBe(true);

            timeouts.get(id)();

            expect(callback).toHaveBeenCalledTimes(1);
            expect(reflection._activeTimeouts.has(id)).toBe(false);
        });

        it("_clearWidgetTimeout returns false for null, undefined, or untracked ids", () => {
            expect(reflection._clearWidgetTimeout(null)).toBe(false);
            expect(reflection._clearWidgetTimeout(undefined)).toBe(false);
            expect(reflection._clearWidgetTimeout(999999)).toBe(false);
        });

        it("_clearWidgetTimeout cancels a tracked timeout before it fires", () => {
            const callback = jest.fn();
            const id = reflection._setWidgetTimeout(callback, 500);

            expect(reflection._clearWidgetTimeout(id)).toBe(true);
            expect(reflection._activeTimeouts.has(id)).toBe(false);
            expect(timeouts.has(id)).toBe(false);
        });

        it("_setWidgetInterval tracks interval and executes callback", () => {
            const callback = jest.fn();
            const id = reflection._setWidgetInterval(callback, 500);

            expect(reflection._activeIntervals.has(id)).toBe(true);
            expect(intervals.has(id)).toBe(true);

            intervals.get(id)();
            expect(callback).toHaveBeenCalledTimes(1);
            expect(reflection._activeIntervals.has(id)).toBe(true);
        });

        it("_clearWidgetInterval returns false for null, undefined, or untracked ids", () => {
            expect(reflection._clearWidgetInterval(null)).toBe(false);
            expect(reflection._clearWidgetInterval(undefined)).toBe(false);
            expect(reflection._clearWidgetInterval(999999)).toBe(false);
        });

        it("_clearWidgetInterval cancels a tracked interval", () => {
            const callback = jest.fn();
            const id = reflection._setWidgetInterval(callback, 500);

            expect(reflection._clearWidgetInterval(id)).toBe(true);
            expect(reflection._activeIntervals.has(id)).toBe(false);
            expect(intervals.has(id)).toBe(false);
        });

        it("_clearWidgetTimers cancels tracked timeouts/intervals, clears properties, and returns count", () => {
            reflection._setWidgetTimeout(jest.fn(), 500);
            reflection._setWidgetTimeout(jest.fn(), 700);
            reflection.startChatTypingTimeout = reflection._setWidgetTimeout(jest.fn(), 1000);
            reflection.dotsInterval = reflection._setWidgetInterval(jest.fn(), 500);

            const count = reflection._clearWidgetTimers();

            expect(count).toBe(4);
            expect(reflection._activeTimeouts.size).toBe(0);
            expect(reflection._activeIntervals.size).toBe(0);
            expect(reflection.startChatTypingTimeout).toBeNull();
            expect(reflection.dotsInterval).toBeNull();
        });

        it("onclose invokes _clearWidgetTimers and cancels active timers", () => {
            jest.spyOn(reflection, "startChatSession").mockImplementation(() => {});
            reflection.init(mockActivity);

            reflection._setWidgetTimeout(jest.fn(), 500);
            reflection._setWidgetInterval(jest.fn(), 500);

            mockWidgetWindow.onclose();

            expect(reflection._activeTimeouts.size).toBe(0);
            expect(reflection._activeIntervals.size).toBe(0);
            expect(mockWidgetWindow.destroy).toHaveBeenCalledTimes(1);
        });
    });

    describe("timer delegation to ManagedTimer", () => {
        let reflection;

        beforeEach(() => {
            reflection = new ReflectionMatrix();
        });

        afterEach(() => {
            reflection._clearWidgetTimers();
        });

        it("initializes with ManagedTimer when available", () => {
            expect(reflection._timerManager).toBeInstanceOf(ManagedTimer);
        });

        it("_setWidgetTimeout delegates to the timer manager", () => {
            const callback = jest.fn();
            reflection._timerManager = {
                setTimeout: jest.fn().mockReturnValue(42),
                clearAll: jest.fn().mockReturnValue(0)
            };

            expect(reflection._setWidgetTimeout(callback, 500)).toBe(42);
            expect(reflection._timerManager.setTimeout).toHaveBeenCalledWith(callback, 500);
        });

        it("_clearWidgetTimeout delegates to the timer manager", () => {
            reflection._timerManager = {
                clearTimeout: jest.fn().mockReturnValue(true),
                clearAll: jest.fn().mockReturnValue(0)
            };

            expect(reflection._clearWidgetTimeout(42)).toBe(true);
            expect(reflection._timerManager.clearTimeout).toHaveBeenCalledWith(42);
        });

        it("_setWidgetInterval delegates to the timer manager", () => {
            const callback = jest.fn();
            reflection._timerManager = {
                setInterval: jest.fn().mockReturnValue(99),
                clearAll: jest.fn().mockReturnValue(0)
            };

            expect(reflection._setWidgetInterval(callback, 300)).toBe(99);
            expect(reflection._timerManager.setInterval).toHaveBeenCalledWith(callback, 300);
        });

        it("_clearWidgetInterval delegates to the timer manager", () => {
            reflection._timerManager = {
                clearInterval: jest.fn().mockReturnValue(true),
                clearAll: jest.fn().mockReturnValue(0)
            };

            expect(reflection._clearWidgetInterval(99)).toBe(true);
            expect(reflection._timerManager.clearInterval).toHaveBeenCalledWith(99);
        });

        it("_clearWidgetTimers delegates to timer manager clearAll and returns total cleared", () => {
            reflection._timerManager = {
                clearAll: jest.fn().mockReturnValue(3)
            };

            expect(reflection._clearWidgetTimers()).toBe(3);
            expect(reflection._timerManager.clearAll).toHaveBeenCalledTimes(1);
        });

        it("cleans up active indicator timers on hideTypingIndicator", () => {
            reflection.showTypingIndicator = ReflectionMatrix.prototype.showTypingIndicator;
            reflection.hideTypingIndicator = ReflectionMatrix.prototype.hideTypingIndicator;

            reflection.chatLog = document.createElement("div");
            document.body.appendChild(reflection.chatLog);
            reflection._lifecycle.isMounted = true;
            reflection.isOpen = true;

            reflection.showTypingIndicator("Testing");
            expect(reflection.dotsInterval).not.toBeNull();

            reflection.hideTypingIndicator();
            expect(reflection.dotsInterval).toBeNull();
            expect(reflection.typingDiv).toBeNull();
        });
    });
});
