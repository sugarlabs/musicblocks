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

const ReflectionBackend = global.ReflectionBackend;
const METHODS = [
    "_postJSON",
    "generateAlgorithm",
    "generateNewAlgorithm",
    "generateBotReply",
    "generateAnalysis"
];

describe("ReflectionBackend", () => {
    let reflection;
    let answer;

    const lastRequest = () => {
        const [url, request] = global.fetch.mock.calls[global.fetch.mock.calls.length - 1];
        return { url, method: request.method, body: JSON.parse(request.body) };
    };

    beforeEach(() => {
        answer = { response: "ok" };
        global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(answer) }));

        reflection = new ReflectionMatrix();
        reflection.activity = { errorMsg: jest.fn() };
        reflection.PORT = "http://localhost:8000";
        reflection.isOpen = true;
        reflection.chatLog = document.createElement("div");
        reflection._lifecycle.mount();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("holds exactly the backend methods", () => {
        const names = Object.getOwnPropertyNames(ReflectionBackend.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts each method on the widget", () => {
        for (const name of METHODS) {
            expect(ReflectionMatrix.prototype[name]).toBe(ReflectionBackend.prototype[name]);
        }
    });

    describe("_postJSON", () => {
        test("posts JSON to the backend path", async () => {
            const data = await reflection._postJSON("/chat", { query: "Hi" });

            expect(data).toEqual({ response: "ok" });
            expect(lastRequest()).toEqual({
                url: "http://localhost:8000/chat",
                method: "POST",
                body: { query: "Hi" }
            });
            expect(global.fetch.mock.calls[0][1].headers).toEqual({
                "Content-Type": "application/json"
            });
        });

        test("sends nothing and says why without a backend", async () => {
            reflection.PORT = null;

            const data = await reflection._postJSON("/chat", { query: "Hi" });

            expect(data).toBeNull();
            expect(global.fetch).not.toHaveBeenCalled();
            expect(reflection.activity.errorMsg).toHaveBeenCalledTimes(1);
        });

        test("turns a network failure into an error reply", async () => {
            jest.spyOn(console, "error").mockImplementation(() => {});
            global.fetch = jest.fn(() => Promise.reject(new TypeError("Failed to fetch")));

            const data = await reflection._postJSON("/chat", {});

            expect(data).toEqual({ error: "Failed to send message" });
        });
    });

    test("generateAlgorithm sends the project code", async () => {
        await reflection.generateAlgorithm("the code");

        expect(lastRequest().url).toBe("http://localhost:8000/projectcode");
        expect(lastRequest().body).toEqual({ code: "the code" });
    });

    test("generateNewAlgorithm sends the code the chat knows and the new code", async () => {
        reflection.code = "old";

        await reflection.generateNewAlgorithm("new");

        expect(lastRequest().url).toBe("http://localhost:8000/updatecode");
        expect(lastRequest().body).toEqual({ oldcode: "old", newcode: "new" });
    });

    test("generateAnalysis sends the chat and the last report", async () => {
        reflection.chatHistory = [{ role: "meta", content: "Hi" }];
        reflection.summary = "Last report";

        await reflection.generateAnalysis();

        expect(lastRequest().url).toBe("http://localhost:8000/analysis");
        expect(lastRequest().body).toEqual({
            messages: [{ role: "meta", content: "Hi" }],
            summary: "Last report"
        });
    });

    describe("generateBotReply", () => {
        const history = [
            { role: "meta", content: "1" },
            { role: "user", content: "2" },
            { role: "meta", content: "3" },
            { role: "user", content: "4" }
        ];

        test("sends only the messages the backend has not summarized", async () => {
            reflection.conversationSummary = "We talked about drums.";
            reflection.summarizedUpTo = 2;

            await reflection.generateBotReply("4", history, "music", "alg");

            expect(lastRequest().body).toEqual({
                query: "4",
                messages: history.slice(2),
                mentor: "music",
                algorithm: "alg",
                conversation_summary: "We talked about drums.",
                summarized_up_to: 2
            });
        });

        test("sends no summary before there is one", async () => {
            await reflection.generateBotReply("4", history, "meta", "alg");

            expect(lastRequest().body.messages).toEqual(history);
            expect(lastRequest().body.conversation_summary).toBeNull();
        });

        test("never slices past the end of the history", async () => {
            reflection.summarizedUpTo = 10;

            await reflection.generateBotReply("4", history, "meta", "alg");

            expect(lastRequest().body.messages).toEqual([]);
        });

        test("keeps the summary the backend sends back", async () => {
            answer = {
                response: "ok",
                conversation_summary: "New summary",
                summarized_up_to: 4
            };

            await reflection.generateBotReply("4", history, "meta", "alg");

            expect(reflection.conversationSummary).toBe("New summary");
            expect(reflection.summarizedUpTo).toBe(4);
        });

        test("drops a reply that comes back after the widget closed", async () => {
            let resolve;
            global.fetch = jest.fn(
                () =>
                    new Promise(r => {
                        resolve = r;
                    })
            );
            answer = { response: "late", conversation_summary: "late", summarized_up_to: 4 };

            const pending = reflection.generateBotReply("4", history, "meta", "alg");
            reflection._lifecycle.unmount();
            resolve({ json: () => Promise.resolve(answer) });

            expect(await pending).toBeNull();
            expect(reflection.conversationSummary).toBe("");
        });
    });
});
