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
const { aiWidgetConsent } = require("../../utils/ai-widget-lifecycle");

const ReflectionSession = global.ReflectionSession;
const METHODS = [
    "processPendingMessages",
    "startChatSession",
    "showConsentBanner",
    "updateProjectCode",
    "getAnalysis",
    "botReplyDiv",
    "sendMessage"
];

describe("ReflectionSession", () => {
    let widgetWindow;
    let activity;
    // What the fake backend answers, by path.
    let answers;

    const settle = async () => {
        for (let i = 0; i < 20; i++) {
            await Promise.resolve();
        }
    };
    const requests = path =>
        global.fetch.mock.calls
            .filter(call => call[0].endsWith(path))
            .map(call => JSON.parse(call[1].body));
    const shown = reflection =>
        [...reflection.chatLog.querySelectorAll(".message-container")].map(
            m => m.firstChild.innerText + ": " + m.lastChild.innerText
        );
    const open = async (history = []) => {
        const reflection = new ReflectionMatrix();
        reflection.chatHistory = history;
        reflection.init(activity);
        await settle();
        return reflection;
    };
    const send = async (reflection, text) => {
        reflection.input.value = text;
        reflection.sendMessage();
        await settle();
    };

    beforeEach(() => {
        aiWidgetConsent.given = true;
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
        activity = {
            textMsg: jest.fn(),
            errorMsg: jest.fn(),
            prepareExport: jest.fn().mockResolvedValue("code v1")
        };
        answers = {
            "/projectcode": { algorithm: "alg v1", response: "What did you make?" },
            "/updatecode": { algorithm: "alg v2", response: "I see the change." },
            "/chat": { response: "Tell me more." },
            "/analysis": { response: "## Report" }
        };
        global.fetch = jest.fn(url => {
            const path = Object.keys(answers).find(p => url.endsWith(p));
            return Promise.resolve({ json: () => Promise.resolve(answers[path]) });
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        localStorage.clear();
    });

    test("holds exactly the session methods", () => {
        const names = Object.getOwnPropertyNames(ReflectionSession.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts each method on the widget", () => {
        for (const name of METHODS) {
            expect(ReflectionMatrix.prototype[name]).toBe(ReflectionSession.prototype[name]);
        }
    });

    describe("startChatSession", () => {
        test("sends the project and shows the first question", async () => {
            const reflection = await open();

            expect(requests("/projectcode")).toEqual([{ code: "code v1" }]);
            expect(shown(reflection)).toEqual(["ROHAN: What did you make?"]);
            expect(reflection.inputContainer.style.display).toBe("flex");
            expect(reflection.projectAlgorithm).toBe("alg v1");
            expect(reflection.code).toBe("code v1");
        });

        test("starts only once per open", async () => {
            const reflection = await open();

            await reflection.startChatSession();

            expect(requests("/projectcode")).toHaveLength(1);
        });

        test("starts afresh after the summary state of an earlier chat", async () => {
            const reflection = new ReflectionMatrix();
            reflection.conversationSummary = "old summary";
            reflection.summarizedUpTo = 8;
            reflection.init(activity);
            await settle();

            expect(reflection.conversationSummary).toBe("");
            expect(reflection.summarizedUpTo).toBe(0);
        });
    });

    describe("sendMessage", () => {
        test("shows your message and the mentor's answer", async () => {
            const reflection = await open();

            await send(reflection, "  A song  ");

            expect(shown(reflection)).toEqual([
                "ROHAN: What did you make?",
                "YOU: A song",
                "ROHAN: Tell me more."
            ]);
            expect(reflection.input.value).toBe("");
            expect(requests("/chat")[0]).toMatchObject({
                query: "A song",
                mentor: "meta",
                algorithm: "alg v1"
            });
        });

        test("ignores an empty message", async () => {
            const reflection = await open();

            await send(reflection, "   ");

            expect(requests("/chat")).toHaveLength(0);
        });

        test("asks the mentor that was chosen when the message was sent", async () => {
            const reflection = await open();
            reflection.changeMentor("code");

            await send(reflection, "My loops");

            expect(requests("/chat")[0].mentor).toBe("code");
            expect(shown(reflection).pop()).toBe("ALAN: Tell me more.");
        });

        test("reports a failed reply", async () => {
            const reflection = await open();
            answers["/chat"] = { error: "Failed to send message." };

            await send(reflection, "Hello");

            expect(activity.errorMsg).toHaveBeenCalledWith("Failed to send message.", 3000);
            expect(reflection.isProcessingPendingMessage).toBe(false);
        });
    });

    describe("updateProjectCode", () => {
        test("says so when the project has not changed", async () => {
            const reflection = await open();

            await reflection.updateProjectCode();

            expect(activity.textMsg).toHaveBeenCalledWith(
                "No changes were detected in your project.",
                2500
            );
            expect(requests("/updatecode")).toHaveLength(0);
        });

        test("sends the old and new code and keeps the new algorithm", async () => {
            const reflection = await open();
            activity.prepareExport.mockResolvedValue("code v2");

            await reflection.updateProjectCode();

            expect(requests("/updatecode")).toEqual([{ oldcode: "code v1", newcode: "code v2" }]);
            expect(reflection.projectAlgorithm).toBe("alg v2");
            expect(reflection.code).toBe("code v2");
            expect(shown(reflection).pop()).toBe("ROHAN: I see the change.");
        });

        test("keeps the old code when the algorithm is unchanged", async () => {
            const reflection = await open();
            activity.prepareExport.mockResolvedValue("code v1 with a comment");
            answers["/updatecode"] = { algorithm: "unchanged", response: "Same as before." };

            await reflection.updateProjectCode();

            expect(reflection.projectAlgorithm).toBe("alg v1");
            expect(reflection.code).toBe("code v1");
        });
    });

    describe("getAnalysis", () => {
        const history = length =>
            Array.from({ length }, (_, i) => ({ role: i % 2 ? "user" : "meta", content: "m" }));

        test("does nothing while the chat is short", async () => {
            const reflection = await open(history(9));

            await reflection.getAnalysis();

            expect(requests("/analysis")).toHaveLength(0);
        });

        test("sends the chat with the last report and saves the new one", async () => {
            localStorage.setItem("musicblocks_analysis", "Last time");
            const reflection = await open(history(10));

            await reflection.getAnalysis();

            expect(requests("/analysis")).toEqual([
                { messages: history(10), summary: "Last time" }
            ]);
            expect(localStorage.getItem("musicblocks_analysis")).toBe("## Report");
            expect(reflection.chatLog.lastChild.querySelector("h2").textContent).toBe("Report");
        });

        test("does not save a failed analysis", async () => {
            localStorage.setItem("musicblocks_analysis", "Last time");
            const reflection = await open(history(10));
            answers["/analysis"] = { error: "Failed to send message." };

            await reflection.getAnalysis();

            expect(localStorage.getItem("musicblocks_analysis")).toBe("Last time");
            expect(activity.errorMsg).toHaveBeenCalledWith("Failed to send message.", 3000);
        });
    });

    describe("botReplyDiv", () => {
        test("shows a reply it is given without asking the backend", async () => {
            const reflection = await open([{ role: "meta", content: "Hi" }]);

            await reflection.botReplyDiv({ response: "Given" }, false);

            expect(requests("/chat")).toHaveLength(0);
            expect(shown(reflection).pop()).toBe("ROHAN: Given");
        });

        test("asks the backend for a user query", async () => {
            const reflection = await open([{ role: "meta", content: "Hi" }]);

            await reflection.botReplyDiv("Question");

            expect(requests("/chat")[0].query).toBe("Question");
            expect(shown(reflection).pop()).toBe("ROHAN: Tell me more.");
        });
    });
});
