/**
 * MusicBlocks
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

const { escapeHTML, isSafeUrl } = require("../../utils/utils");
global.escapeHTML = escapeHTML;
global.isSafeUrl = isSafeUrl;
global._ = text => text;
global.ManagedTimer = require("../../utils/ManagedTimer.js");
global.DOMPurify = require("../../../lib/purify.min.js");

global.ReflectionLifecycle = require("../ReflectionLifecycle.js");
global.ReflectionWindow = require("../ReflectionWindow.js");
global.ReflectionChatLog = require("../ReflectionChatLog.js");
global.ReflectionSession = require("../ReflectionSession.js");
global.ReflectionBackend = require("../ReflectionBackend.js");
global.ReflectionReport = require("../ReflectionReport.js");
global.ReflectionMarkdown = require("../ReflectionMarkdown.js");
const ReflectionMatrix = require("../reflection.js");
global.ReflectionMatrix = ReflectionMatrix;

const ReflectionChatLog = global.ReflectionChatLog;
const METHODS = [
    "showTypingIndicator",
    "hideTypingIndicator",
    "appendUserMessage",
    "appendBotReply",
    "_setMarkdown",
    "renderChatHistory"
];

describe("ReflectionChatLog", () => {
    let widgetWindow;
    let reflection;

    const messages = () => [...reflection.chatLog.querySelectorAll(".message-container")];
    const sender = message => message.firstChild.innerText;
    const text = message => message.lastChild.innerText;

    beforeEach(() => {
        jest.useFakeTimers();
        const body = document.createElement("div");
        widgetWindow = {
            clear: jest.fn(),
            show: jest.fn(),
            sendToCenter: jest.fn(),
            destroy: jest.fn(),
            getWidgetBody: () => body,
            addButton: jest.fn(() => document.createElement("button"))
        };
        window.widgetWindows = { windowFor: () => widgetWindow };
        global.fetch = jest.fn(() => new Promise(() => {}));

        reflection = new ReflectionMatrix();
        reflection.chatHistory = [{ role: "meta", content: "Hi" }];
        reflection.init({
            textMsg: jest.fn(),
            errorMsg: jest.fn(),
            prepareExport: jest.fn().mockResolvedValue("code")
        });
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test("holds exactly the chat log methods", () => {
        const names = Object.getOwnPropertyNames(ReflectionChatLog.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts each method on the widget", () => {
        for (const name of METHODS) {
            expect(ReflectionMatrix.prototype[name]).toBe(ReflectionChatLog.prototype[name]);
        }
    });

    describe("typing indicator", () => {
        test("animates up to three dots and starts over", () => {
            reflection.showTypingIndicator("Reading code");
            const dots = () => reflection.dotsContainer.textContent;

            expect(reflection.typingDiv.firstChild.textContent).toBe("Reading code");
            expect(dots()).toBe("");
            jest.advanceTimersByTime(500);
            expect(dots()).toBe(".");
            jest.advanceTimersByTime(1000);
            expect(dots()).toBe("...");
            jest.advanceTimersByTime(500);
            expect(dots()).toBe("");
        });

        test("shows only one indicator at a time", () => {
            reflection.showTypingIndicator();
            reflection.showTypingIndicator("Analyzing");

            expect(reflection.chatLog.querySelectorAll(".typing-indicator")).toHaveLength(1);
            expect(reflection.typingDiv.firstChild.textContent).toBe("Thinking");
        });

        test("hiding removes it and stops the dots", () => {
            reflection.showTypingIndicator();
            const dots = reflection.dotsContainer;

            reflection.hideTypingIndicator();
            jest.advanceTimersByTime(1000);

            expect(reflection.chatLog.querySelector(".typing-indicator")).toBeNull();
            expect(dots.textContent).toBe("");
            expect(reflection.dotsInterval).toBeNull();
        });

        test("hiding also cancels the delayed first indicator", () => {
            reflection.startChatTypingTimeout = reflection._setWidgetTimeout(
                () => reflection.showTypingIndicator("Reading code"),
                1000
            );

            reflection.hideTypingIndicator();
            jest.advanceTimersByTime(1000);

            expect(reflection.typingDiv).toBeFalsy();
        });

        test("is not shown in a closed widget", () => {
            widgetWindow.onclose();
            reflection.showTypingIndicator();

            expect(reflection.typingDiv).toBeFalsy();
        });
    });

    describe("appendUserMessage", () => {
        test("adds the message as text under your name", () => {
            reflection.appendUserMessage("<b>bold?</b>");

            const message = messages().pop();
            expect(message.classList.contains("user")).toBe(true);
            expect(sender(message)).toBe("YOU");
            expect(text(message)).toBe("<b>bold?</b>");
            expect(message.querySelector("b")).toBeNull();
        });

        test("does nothing in a closed widget", () => {
            widgetWindow.onclose();
            reflection.appendUserMessage("Hello");

            expect(messages()).toHaveLength(1);
        });
    });

    describe("appendBotReply", () => {
        test("adds the reply under the mentor's name and to the history", () => {
            reflection.appendBotReply({ response: "Tell me more" }, "code");

            const message = messages().pop();
            expect(message.classList.contains("user")).toBe(false);
            expect(sender(message)).toBe("ALAN");
            expect(text(message)).toBe("Tell me more");
            expect(reflection.chatHistory.pop()).toEqual({ role: "code", content: "Tell me more" });
        });

        test("uses the current mentor by default", () => {
            reflection.AImentor = "music";
            reflection.appendBotReply({ response: "Listen" });

            expect(sender(messages().pop())).toBe("BEETHOVEN");
        });

        test("keeps a plain reply as text", () => {
            reflection.appendBotReply({ response: "**not bold**" }, "meta");

            expect(messages().pop().querySelector("b")).toBeNull();
        });

        test("draws a Markdown reply as HTML", () => {
            reflection.appendBotReply({ response: "**bold**" }, "meta", true);

            expect(messages().pop().querySelector("b").textContent).toBe("bold");
        });

        test("does nothing in a closed widget", () => {
            widgetWindow.onclose();
            reflection.appendBotReply({ response: "Late" }, "meta");

            expect(reflection.chatHistory).toHaveLength(1);
        });
    });

    describe("renderChatHistory", () => {
        test("draws the history again in order", () => {
            reflection.chatHistory = [
                { role: "meta", content: "Hi" },
                { role: "user", content: "Hello" },
                { role: "code", content: "Show me" }
            ];
            reflection.chatLog.appendChild(document.createElement("p"));

            reflection.renderChatHistory();

            expect(reflection.chatLog.querySelector("p")).toBeNull();
            expect(messages().map(m => [sender(m), text(m)])).toEqual([
                ["ROHAN", "Hi"],
                ["YOU", "Hello"],
                ["ALAN", "Show me"]
            ]);
            expect(messages().map(m => m.classList.contains("user"))).toEqual([false, true, false]);
        });
    });

    describe("with the page's Markdown renderer", () => {
        const link = message => message.querySelector("a");

        beforeEach(() => {
            global.renderChatMarkdown = require("../../utils/ai-markdown.js").renderChatMarkdown;
        });

        afterEach(() => {
            delete global.renderChatMarkdown;
        });

        test("opens reply links in a new tab", () => {
            reflection.appendBotReply({ response: "[guide](https://example.com)" }, "meta");

            const reply = link(messages().pop());
            expect(reply.getAttribute("href")).toBe("https://example.com");
            expect(reply.getAttribute("target")).toBe("_blank");
            expect(reply.getAttribute("rel")).toBe("noopener noreferrer");
        });

        test("opens links in a new tab after reopening too", () => {
            reflection.chatHistory = [
                { role: "meta", content: "[guide](https://example.com)" },
                { role: "user", content: "[mine](https://example.com)" }
            ];

            reflection.renderChatHistory();

            const [reply, mine] = messages();
            expect(link(reply).getAttribute("target")).toBe("_blank");
            expect(link(reply).getAttribute("rel")).toBe("noopener noreferrer");
            expect(link(mine)).toBeNull();
            expect(text(mine)).toBe("[mine](https://example.com)");
        });
    });
});
