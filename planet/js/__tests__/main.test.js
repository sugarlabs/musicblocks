// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.

"use strict";

class PlanetMock {
    constructor(isMusicBlocks, storage) {
        this.isMusicBlocks = isMusicBlocks;
        this.storage = storage;
        this.initCalled = false;
        PlanetMock.instances.push(this);
    }

    async init() {
        this.initCalled = true;
    }
}
PlanetMock.instances = [];
global.Planet = PlanetMock;

const mockParent = {};
Object.defineProperty(window, "parent", {
    value: mockParent,
    writable: true,
    configurable: true
});

require("../main.js");

describe("main.js", () => {
    beforeEach(() => {
        PlanetMock.instances = [];
        window.p = undefined;
        window._ = undefined;
        window._mbPlatformColor = undefined;
        window._mbBlockDisplayNames = undefined;
        document.body.className = "";
    });

    describe("makePlanet", () => {
        it("should initialize window.p as a Planet instance and call init", async () => {
            const mockStorage = { get: jest.fn(), set: jest.fn() };
            const mockTranslationFn = jest.fn(str => str);

            await window.makePlanet(true, mockStorage, mockTranslationFn);

            expect(window._).toBe(mockTranslationFn);
            expect(window.p).toBeInstanceOf(PlanetMock);
            expect(window.p.isMusicBlocks).toBe(true);
            expect(window.p.storage).toBe(mockStorage);
            expect(window.p.initCalled).toBe(true);
        });
    });

    describe("message event listener", () => {
        it("should ignore events not originating from window.parent", () => {
            const event = new MessageEvent("message", {
                data: { type: "MB_PLATFORM_COLOR", payload: { orange: "#ff5722" } },
                source: window
            });
            window.dispatchEvent(event);

            expect(window._mbPlatformColor).toBeUndefined();
        });

        it("should ignore messages with empty or invalid type", () => {
            const event = new MessageEvent("message", {
                data: { payload: { orange: "#ff5722" } },
                source: window.parent
            });
            window.dispatchEvent(event);

            expect(window._mbPlatformColor).toBeUndefined();
        });

        it("should handle MB_PLATFORM_COLOR type messages", () => {
            const colorPayload = { orange: "#ff5722", blue: "#0000ff" };
            const event = new MessageEvent("message", {
                data: { type: "MB_PLATFORM_COLOR", payload: colorPayload },
                source: window.parent
            });
            window.dispatchEvent(event);

            expect(window._mbPlatformColor).toEqual(colorPayload);
        });

        it("should handle MB_BLOCK_NAMES type messages", () => {
            const displayNames = { note: "Play Note", drum: "Play Drum" };
            const event = new MessageEvent("message", {
                data: { type: "MB_BLOCK_NAMES", payload: displayNames },
                source: window.parent
            });
            window.dispatchEvent(event);

            expect(window._mbBlockDisplayNames).toEqual(displayNames);
        });

        it("should handle MB_APPLY_THEME type messages to add and remove classes", () => {
            document.body.classList.add("old-theme", "another-class");

            const event = new MessageEvent("message", {
                data: {
                    type: "MB_APPLY_THEME",
                    payload: {
                        add: ["new-theme", "extra-class"],
                        remove: ["old-theme"]
                    }
                },
                source: window.parent
            });
            window.dispatchEvent(event);

            expect(document.body.classList.contains("old-theme")).toBe(false);
            expect(document.body.classList.contains("another-class")).toBe(true);
            expect(document.body.classList.contains("new-theme")).toBe(true);
            expect(document.body.classList.contains("extra-class")).toBe(true);
        });

        it("should ignore MB_PLATFORM_COLOR messages with missing or null payloads", () => {
            const event = new MessageEvent("message", {
                data: { type: "MB_PLATFORM_COLOR", payload: null },
                source: window.parent
            });
            window.dispatchEvent(event);

            expect(window._mbPlatformColor).toBeUndefined();
        });

        it("should ignore MB_BLOCK_NAMES messages with missing or null payloads", () => {
            const event = new MessageEvent("message", {
                data: { type: "MB_BLOCK_NAMES", payload: null },
                source: window.parent
            });
            window.dispatchEvent(event);

            expect(window._mbBlockDisplayNames).toBeUndefined();
        });

        it("should handle MB_APPLY_THEME safely if add/remove are non-arrays or missing", () => {
            document.body.classList.add("baseline-theme");

            const event = new MessageEvent("message", {
                data: {
                    type: "MB_APPLY_THEME",
                    payload: {
                        add: "not-an-array"
                    }
                },
                source: window.parent
            });
            window.dispatchEvent(event);

            expect(document.body.classList.contains("baseline-theme")).toBe(true);
            expect(document.body.classList.contains("not-an-array")).toBe(false);
        });
    });
});
