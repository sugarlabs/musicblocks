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

const ReflectionReport = global.ReflectionReport;
const METHODS = ["saveReport", "readReport", "downloadAsTxt"];
const KEY = "musicblocks_analysis";

describe("ReflectionReport", () => {
    let reflection;

    beforeEach(() => {
        reflection = new ReflectionMatrix();
        reflection.activity = { errorMsg: jest.fn() };
    });

    afterEach(() => {
        jest.restoreAllMocks();
        localStorage.clear();
    });

    test("holds exactly the report methods", () => {
        const names = Object.getOwnPropertyNames(ReflectionReport.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts each method on the widget", () => {
        for (const name of METHODS) {
            expect(ReflectionMatrix.prototype[name]).toBe(ReflectionReport.prototype[name]);
        }
    });

    describe("saveReport and readReport", () => {
        test("keep the last report between opens", () => {
            reflection.saveReport({ response: "Report one" });
            reflection.saveReport({ response: "Report two" });

            expect(new ReflectionMatrix().readReport()).toBe("Report two");
            expect(localStorage.getItem(KEY)).toBe("Report two");
        });

        test("readReport gives null before any report", () => {
            expect(reflection.readReport()).toBeNull();
        });

        test("saveReport warns when storage is full and keeps the report for this open", () => {
            jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
                throw new DOMException("Quota exceeded", "QuotaExceededError");
            });
            const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

            expect(() => reflection.saveReport({ response: "Report" })).not.toThrow();

            expect(warn).toHaveBeenCalledTimes(1);
            expect(reflection.summary).toBe("Report");
        });

        test("readReport warns and gives null when storage is blocked", () => {
            jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
                throw new DOMException("The operation is insecure.", "SecurityError");
            });
            const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

            expect(reflection.readReport()).toBeNull();
            expect(warn).toHaveBeenCalledTimes(1);
        });
    });

    describe("downloadAsTxt", () => {
        let blobParts;
        let link;

        beforeEach(() => {
            blobParts = null;
            jest.spyOn(global, "Blob").mockImplementation((parts, options) => {
                blobParts = { parts, options };
            });
            URL.createObjectURL = jest.fn(() => "blob:conversation");
            URL.revokeObjectURL = jest.fn();
            jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
                link = { href: this.href, download: this.download, inPage: this.isConnected };
            });
        });

        test("says there is nothing to save for an empty chat", () => {
            reflection.downloadAsTxt([]);

            expect(reflection.activity.errorMsg).toHaveBeenCalledWith(
                "No conversation to save.",
                2000
            );
            expect(blobParts).toBeNull();
        });

        test("saves each message under its sender's name", () => {
            reflection.downloadAsTxt([
                { role: "meta", content: "Hi" },
                { role: "user", content: "A song" },
                { role: "music", content: "Nice" },
                { role: "guest", content: "Hello" }
            ]);

            expect(blobParts.parts).toEqual([
                "ROHAN: Hi\n\nYOU: A song\n\nBEETHOVEN: Nice\n\nGUEST: Hello"
            ]);
            expect(blobParts.options).toEqual({ type: "text/plain" });
        });

        test("downloads conversation.txt and cleans up after", () => {
            reflection.downloadAsTxt([{ role: "meta", content: "Hi" }]);

            expect(link).toEqual({
                href: "blob:conversation",
                download: "conversation.txt",
                inPage: true
            });
            expect(document.querySelector("a[download]")).toBeNull();
            expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:conversation");
        });
    });
});
