/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Music Blocks Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const releaseconfig = require("../releaseconfig");

describe("releaseconfig globals", () => {
    describe("Query Parameter & Hostname Resolution (resolveIsMusicBlocks)", () => {
        test("resolves turtle query param to false (Turtle Blocks)", () => {
            const result = releaseconfig.resolveIsMusicBlocks({
                search: "?turtle",
                hostname: "localhost"
            });
            expect(result).toBe(false);
        });

        test("resolves music query param to true (Music Blocks)", () => {
            const result = releaseconfig.resolveIsMusicBlocks({
                search: "?music",
                hostname: "localhost"
            });
            expect(result).toBe(true);
        });

        test("detects Turtle Blocks when hostname contains 'turtle'", () => {
            const result = releaseconfig.resolveIsMusicBlocks({
                search: "",
                hostname: "turtle.sugarlabs.org"
            });
            expect(result).toBe(false);
        });

        test("detects Music Blocks when hostname contains 'music'", () => {
            const result = releaseconfig.resolveIsMusicBlocks({
                search: "",
                hostname: "musicblocks.sugarlabs.org"
            });
            expect(result).toBe(true);
        });

        test("defaults to Music Blocks for localhost or unrecognized hostnames", () => {
            const result = releaseconfig.resolveIsMusicBlocks({
                search: "",
                hostname: "localhost"
            });
            expect(result).toBe(true);
        });

        test("handles null or undefined location gracefully", () => {
            expect(releaseconfig.resolveIsMusicBlocks(null)).toBe(true);
            expect(releaseconfig.resolveIsMusicBlocks(undefined)).toBe(true);
        });
    });

    describe("Splash Screen Resolution & Localization", () => {
        test("returns Turtle inline SVG splash screen when in Turtle mode", () => {
            const splash = releaseconfig.getSplashScreenSrc(true);
            expect(splash).toContain("data:image/svg+xml;base64,");
        });

        test("returns default Music Blocks splash screen in Music mode", () => {
            const splash = releaseconfig.getSplashScreenSrc(false);
            expect(splash).toBe("images/logo.svg");
        });

        test("returns Japanese splash screen when language preference is 'ja'", () => {
            try {
                localStorage.languagePreference = "ja";
            } catch (e) {
                // Ignore storage errors in test environment
            }

            const splash = releaseconfig.getSplashScreenSrc(false);
            expect(splash).toBe("images/mb_logo_ja.svg");

            try {
                delete localStorage.languagePreference;
            } catch (e) {
                // Ignore storage cleanup errors in test environment
            }
        });
    });

    describe("Exported Constants & Globals", () => {
        test("defines window release flags upon module loading", () => {
            expect(window._THIS_IS_MUSIC_BLOCKS_).toBeDefined();
            expect(window._THIS_IS_TURTLE_BLOCKS_).toBeDefined();
            expect(window.THIS_IS_MUSIC_BLOCKS).toBeDefined();
            expect(window.THIS_IS_TURTLE_BLOCKS).toBeDefined();
        });

        test("exports tab title and loading texts", () => {
            expect(typeof releaseconfig.RELEASE_TAB_TITLE).toBe("string");
            expect(Array.isArray(releaseconfig.LOADING_TEXTS)).toBe(true);
            expect(releaseconfig.LOADING_TEXTS.length).toBeGreaterThan(0);
        });
    });
});
