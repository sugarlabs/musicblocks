/**
 * MusicBlocks v3.4.1
 *
 * @copyright 2026 Music Blocks contributors
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// Mock Planet class
global.Planet = class Planet {
    constructor(isMusicBlocks, storage) {
        this.isMusicBlocks = isMusicBlocks;
        this.storage = storage;
        this.initCalled = false;
    }
    async init() {
        this.initCalled = true;
    }
};

require("../main.js");

describe("planet/js/main.js", () => {
    beforeEach(() => {
        window.p = undefined;
        window._mbPlatformColor = undefined;
        window._mbBlockDisplayNames = undefined;
        document.body.className = "";
    });

    describe("makePlanet", () => {
        it("should initialize window.p and call init", async () => {
            const mockTranslation = jest.fn(str => str);
            const mockStorage = {};

            await window.makePlanet(true, mockStorage, mockTranslation);

            expect(window._).toBe(mockTranslation);
            expect(window.p).toBeDefined();
            expect(window.p.isMusicBlocks).toBe(true);
            expect(window.p.storage).toBe(mockStorage);
            expect(window.p.initCalled).toBe(true);
        });
    });

    describe("message event listener", () => {
        const dispatchMessage = (data, source = window.parent) => {
            const event = new MessageEvent("message", {
                data: data,
                source: source
            });
            window.dispatchEvent(event);
        };

        it("should ignore messages not from window.parent", () => {
            const foreignWindow = {};
            dispatchMessage(
                { type: "MB_PLATFORM_COLOR", payload: { color: "red" } },
                foreignWindow
            );
            expect(window._mbPlatformColor).toBeUndefined();
        });

        it("should handle MB_PLATFORM_COLOR message", () => {
            const payload = { background: "#000" };
            dispatchMessage({ type: "MB_PLATFORM_COLOR", payload });
            expect(window._mbPlatformColor).toEqual(payload);
        });

        it("should handle MB_BLOCK_NAMES message", () => {
            const payload = { start: "Start Block" };
            dispatchMessage({ type: "MB_BLOCK_NAMES", payload });
            expect(window._mbBlockDisplayNames).toEqual(payload);
        });

        it("should handle MB_APPLY_THEME message", () => {
            const payload = { add: ["dark"], remove: ["light"] };
            document.body.classList.add("light");
            dispatchMessage({ type: "MB_APPLY_THEME", payload });
            expect(document.body.classList.contains("dark")).toBe(true);
            expect(document.body.classList.contains("light")).toBe(false);
        });
    });
});
