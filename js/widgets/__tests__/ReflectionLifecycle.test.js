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

const ReflectionLifecycle = global.ReflectionLifecycle;
const METHODS = [
    "_setWidgetTimeout",
    "_clearWidgetTimeout",
    "_setWidgetInterval",
    "_clearWidgetInterval",
    "_clearWidgetTimers",
    "_isWidgetActive",
    "_isSameMount"
];

describe("ReflectionLifecycle", () => {
    let widgetWindow;
    let activity;

    const open = reflection => {
        reflection.chatHistory = [{ role: "meta", content: "Hi" }];
        reflection.init(activity);
        return reflection;
    };

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
        activity = {
            textMsg: jest.fn(),
            errorMsg: jest.fn(),
            prepareExport: jest.fn().mockResolvedValue("code")
        };
        global.fetch = jest.fn(() => new Promise(() => {}));
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test("holds exactly the lifecycle methods", () => {
        const names = Object.getOwnPropertyNames(ReflectionLifecycle.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts each method on the widget", () => {
        for (const name of METHODS) {
            expect(ReflectionMatrix.prototype[name]).toBe(ReflectionLifecycle.prototype[name]);
        }
    });

    describe("with ManagedTimer", () => {
        test("runs a timeout once and forgets it", () => {
            const reflection = new ReflectionMatrix();
            const callback = jest.fn();

            const id = reflection._setWidgetTimeout(callback, 100);
            jest.advanceTimersByTime(100);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(reflection._clearWidgetTimeout(id)).toBe(false);
        });

        test("cancels a timeout before it runs", () => {
            const reflection = new ReflectionMatrix();
            const callback = jest.fn();

            const id = reflection._setWidgetTimeout(callback, 100);
            expect(reflection._clearWidgetTimeout(id)).toBe(true);
            jest.advanceTimersByTime(200);

            expect(callback).not.toHaveBeenCalled();
        });

        test("repeats an interval until it is cleared", () => {
            const reflection = new ReflectionMatrix();
            const callback = jest.fn();

            const id = reflection._setWidgetInterval(callback, 50);
            jest.advanceTimersByTime(150);
            expect(reflection._clearWidgetInterval(id)).toBe(true);
            jest.advanceTimersByTime(150);

            expect(callback).toHaveBeenCalledTimes(3);
        });

        test("ignores an id it does not own", () => {
            const reflection = new ReflectionMatrix();

            expect(reflection._clearWidgetTimeout(null)).toBe(false);
            expect(reflection._clearWidgetTimeout(undefined)).toBe(false);
            expect(reflection._clearWidgetInterval(12345)).toBe(false);
        });
    });

    describe("without ManagedTimer", () => {
        let reflection;

        beforeEach(() => {
            reflection = new ReflectionMatrix();
            reflection._timerManager = null;
        });

        test("tracks a timeout until it runs", () => {
            const callback = jest.fn();

            reflection._setWidgetTimeout(callback, 100);
            expect(reflection._activeTimeouts.size).toBe(1);
            jest.advanceTimersByTime(100);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(reflection._activeTimeouts.size).toBe(0);
        });

        test("clears every tracked timer and counts them", () => {
            const callback = jest.fn();
            reflection._setWidgetTimeout(callback, 100);
            reflection._setWidgetTimeout(callback, 200);
            reflection._setWidgetInterval(callback, 50);

            expect(reflection._clearWidgetTimers()).toBe(3);
            jest.advanceTimersByTime(500);

            expect(callback).not.toHaveBeenCalled();
            expect(reflection._activeTimeouts.size).toBe(0);
            expect(reflection._activeIntervals.size).toBe(0);
        });
    });

    test("_clearWidgetTimers stops the typing indicator's timers", () => {
        const reflection = open(new ReflectionMatrix());
        reflection.showTypingIndicator();
        reflection.startChatTypingTimeout = reflection._setWidgetTimeout(() => {}, 1000);

        reflection._clearWidgetTimers();

        expect(reflection.dotsInterval).toBeNull();
        expect(reflection.startChatTypingTimeout).toBeNull();
    });

    test("_isWidgetActive follows opening and closing", () => {
        const reflection = new ReflectionMatrix();
        expect(reflection._isWidgetActive()).toBe(false);

        open(reflection);
        expect(reflection._isWidgetActive()).toBe(true);

        widgetWindow.onclose();
        expect(reflection._isWidgetActive()).toBe(false);
    });

    test("_isSameMount is false once the widget closes or the block runs again", () => {
        const reflection = open(new ReflectionMatrix());
        const first = reflection._lifecycle.generation;
        expect(reflection._isSameMount(first)).toBe(true);

        reflection.init(activity);
        const second = reflection._lifecycle.generation;
        expect(reflection._isSameMount(first)).toBe(false);
        expect(reflection._isSameMount(second)).toBe(true);

        widgetWindow.onclose();
        expect(reflection._isSameMount(second)).toBe(false);
    });
});
