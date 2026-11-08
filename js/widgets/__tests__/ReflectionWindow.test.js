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

const ReflectionWindow = global.ReflectionWindow;
const METHODS = ["_addToolbar", "_makeInput", "_closeWindow", "_endSession", "changeMentor"];

describe("ReflectionWindow", () => {
    let widgetWindow;
    let buttons;
    let activity;

    const open = (history = [{ role: "meta", content: "Hi" }]) => {
        const reflection = new ReflectionMatrix();
        reflection.chatHistory = history;
        reflection.init(activity);
        return reflection;
    };
    const button = label => buttons.find(b => b.label === label).element;

    beforeEach(() => {
        const body = document.createElement("div");
        buttons = [];
        widgetWindow = {
            clear: jest.fn(),
            show: jest.fn(),
            sendToCenter: jest.fn(),
            destroy: jest.fn(),
            getWidgetBody: () => body,
            addButton: jest.fn((icon, size, label) => {
                const element = document.createElement("button");
                buttons.push({ icon, label, element });
                return element;
            })
        };
        window.widgetWindows = { windowFor: () => widgetWindow };
        activity = {
            isInputON: false,
            textMsg: jest.fn(),
            errorMsg: jest.fn(),
            prepareExport: jest.fn().mockResolvedValue("code")
        };
        global.fetch = jest.fn(() => new Promise(() => {}));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("holds exactly the window methods", () => {
        const names = Object.getOwnPropertyNames(ReflectionWindow.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts each method on the widget", () => {
        for (const name of METHODS) {
            expect(ReflectionMatrix.prototype[name]).toBe(ReflectionWindow.prototype[name]);
        }
    });

    describe("_addToolbar", () => {
        test("adds the six buttons in order", () => {
            open();

            expect(buttons.map(b => [b.icon, b.label])).toEqual([
                ["notes_icon.svg", "Summary"],
                ["save-button-dark.svg", "Save"],
                ["general_mentor.svg", "Talk with Rohan"],
                ["code.svg", "Talk with Alan"],
                ["music.svg", "Talk with Beethoven"],
                ["reload.svg", "Refresh"]
            ]);
        });

        test("grays the Summary button while the chat is short", () => {
            open();

            expect(button("Summary").style.background).toBe("gray");
        });

        test("wires each button to its action", () => {
            const reflection = open();
            const analysis = jest.spyOn(reflection, "getAnalysis").mockResolvedValue();
            const download = jest.spyOn(reflection, "downloadAsTxt").mockImplementation(() => {});
            const refresh = jest.spyOn(reflection, "updateProjectCode").mockResolvedValue();

            button("Summary").onclick();
            button("Save").onclick();
            button("Talk with Alan").onclick();
            expect(reflection.AImentor).toBe("code");
            button("Talk with Beethoven").onclick();
            expect(reflection.AImentor).toBe("music");
            button("Talk with Rohan").onclick();
            expect(reflection.AImentor).toBe("meta");
            button("Refresh").onclick();

            expect(analysis).toHaveBeenCalledTimes(1);
            expect(download).toHaveBeenCalledWith(reflection.chatHistory);
            expect(refresh).toHaveBeenCalledTimes(1);
        });

        test("highlights the mentor chosen before the widget opened", () => {
            const reflection = new ReflectionMatrix();
            reflection.AImentor = "music";
            reflection.chatHistory = [{ role: "music", content: "Hi" }];
            reflection.init(activity);

            expect(button("Talk with Beethoven").style.background).toBe("orange");
            expect(button("Talk with Rohan").style.background).toBe("");
        });
    });

    describe("_makeInput", () => {
        test("hides the message box until the chat has started", () => {
            const reflection = open([]);

            expect(reflection.inputContainer.style.display).toBe("none");
        });

        test("shows the message box when there is a chat", () => {
            const reflection = open();

            expect(reflection.inputContainer.style.display).toBe("flex");
            expect(reflection.inputContainer.parentNode).toBe(reflection.chatInterface);
            expect(reflection.inputContainer.firstChild).toBe(reflection.input);
        });

        test("sends on Enter and on the Send button", () => {
            const reflection = open();
            const send = jest.spyOn(reflection, "sendMessage").mockImplementation(() => {});

            reflection.input.onkeydown({ key: "a" });
            expect(send).not.toHaveBeenCalled();
            reflection.input.onkeydown({ key: "Enter" });
            reflection.inputContainer.querySelector("button").onclick();

            expect(send).toHaveBeenCalledTimes(2);
        });
    });

    describe("_closeWindow", () => {
        test("closes the window and gives the keyboard back", () => {
            const reflection = open();
            expect(activity.isInputON).toBe(true);

            widgetWindow.onclose();

            expect(reflection.isOpen).toBe(false);
            expect(activity.isInputON).toBe(false);
            expect(widgetWindow.destroy).toHaveBeenCalledTimes(1);
        });

        test("aborts the requests in flight and drops queued messages", async () => {
            const reflection = open();
            let signal;
            global.fetch = jest.fn((url, request) => {
                signal = request.signal;
                return new Promise(() => {});
            });
            reflection.input.value = "First";
            reflection.sendMessage();
            reflection.pendingMessages.push({ text: "Second", mentor: "meta", algorithm: "" });
            await Promise.resolve();

            widgetWindow.onclose();

            expect(signal.aborted).toBe(true);
            expect(reflection.pendingMessages).toEqual([]);
            expect(reflection.isProcessingPendingMessage).toBe(false);
            expect(reflection.typingDiv).toBeNull();
        });
    });

    describe("_endSession", () => {
        test("resets the open without closing the window", () => {
            const reflection = open();
            reflection._isUpdatingProjectCode = true;
            reflection.triggerFirst = true;
            const generation = reflection._lifecycle.generation;

            reflection._endSession();

            expect(widgetWindow.destroy).not.toHaveBeenCalled();
            expect(reflection._isSameMount(generation)).toBe(false);
            expect(reflection._isUpdatingProjectCode).toBe(false);
            expect(reflection.triggerFirst).toBe(false);
        });

        test("does not run when the widget opens for the first time", () => {
            const reflection = new ReflectionMatrix();
            const end = jest.spyOn(reflection, "_endSession");
            reflection.chatHistory = [{ role: "meta", content: "Hi" }];

            reflection.init(activity);
            expect(end).not.toHaveBeenCalled();
            reflection.init(activity);
            expect(end).toHaveBeenCalledTimes(1);
        });
    });

    describe("changeMentor", () => {
        test("highlights only the chosen mentor", () => {
            const reflection = open();
            const cleared = [];
            // jsdom shares removeProperty between style objects, so use plain stubs.
            for (const name of ["metaButton", "codeButton", "musicButton"]) {
                reflection[name] = { style: { removeProperty: () => cleared.push(name) } };
            }

            reflection.changeMentor("code");

            expect(reflection.AImentor).toBe("code");
            expect(reflection.codeButton.style.background).toBe("orange");
            expect(cleared.sort()).toEqual(["metaButton", "musicButton"]);
        });
    });
});
