/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Aditya Mishra
 *
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

describe("ActivityContext", () => {
    let ActivityContext;

    beforeEach(() => {
        jest.resetModules();
        ActivityContext = require("../activity-context.js");
    });

    describe("setActivity", () => {
        it("stores a valid activity instance without throwing", () => {
            const mockActivity = { name: "TestActivity" };
            expect(() => ActivityContext.setActivity(mockActivity)).not.toThrow();
        });

        it("throws when called with null", () => {
            expect(() => ActivityContext.setActivity(null)).toThrow(
                "Cannot set ActivityContext with a falsy value"
            );
        });

        it("throws when called with undefined", () => {
            expect(() => ActivityContext.setActivity(undefined)).toThrow(
                "Cannot set ActivityContext with a falsy value"
            );
        });

        it("throws when called with 0", () => {
            expect(() => ActivityContext.setActivity(0)).toThrow(
                "Cannot set ActivityContext with a falsy value"
            );
        });

        it("throws when called with empty string", () => {
            expect(() => ActivityContext.setActivity("")).toThrow(
                "Cannot set ActivityContext with a falsy value"
            );
        });

        it("accepts a truthy string value", () => {
            expect(() => ActivityContext.setActivity("activity")).not.toThrow();
        });

        it("accepts a truthy number value", () => {
            expect(() => ActivityContext.setActivity(42)).not.toThrow();
        });
    });

    describe("getActivity", () => {
        it("throws when activity has not been set", () => {
            expect(() => ActivityContext.getActivity()).toThrow(
                "Activity not initialized yet. Use dependency injection or wait for initialization."
            );
        });

        it("returns the instance that was set", () => {
            const mockActivity = { id: 1, name: "Music" };
            ActivityContext.setActivity(mockActivity);
            expect(ActivityContext.getActivity()).toBe(mockActivity);
        });

        it("returns the most recently set instance", () => {
            const first = { id: 1 };
            const second = { id: 2 };
            ActivityContext.setActivity(first);
            ActivityContext.setActivity(second);
            expect(ActivityContext.getActivity()).toBe(second);
        });
    });

    describe("module shape", () => {
        it("exports setActivity as a function", () => {
            expect(typeof ActivityContext.setActivity).toBe("function");
        });

        it("exports getActivity as a function", () => {
            expect(typeof ActivityContext.getActivity).toBe("function");
        });

        it("exports exactly two keys", () => {
            expect(Object.keys(ActivityContext)).toEqual(["setActivity", "getActivity"]);
        });
    });

    describe("singleton behaviour", () => {
        it("returns the same object reference across requires", () => {
            const a = require("../activity-context.js");
            const b = require("../activity-context.js");
            expect(a).toBe(b);
        });

        it("shares state across references", () => {
            const a = require("../activity-context.js");
            const b = require("../activity-context.js");
            a.setActivity({ singleton: true });
            expect(b.getActivity()).toEqual({ singleton: true });
        });
    });

    describe("global fallback", () => {
        it("attaches to globalThis as ActivityContext", () => {
            expect(globalThis.ActivityContext).toBeDefined();
            expect(typeof globalThis.ActivityContext.setActivity).toBe("function");
            expect(typeof globalThis.ActivityContext.getActivity).toBe("function");
        });
    });
});
