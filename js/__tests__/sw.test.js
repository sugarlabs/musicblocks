/**
 * @license
 * MusicBlocks v3.4.1
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const fs = require("fs");
const path = require("path");

describe("Service worker cache refresh safeguards", () => {
    let swSource;

    beforeAll(() => {
        swSource = fs.readFileSync(path.join(__dirname, "..", "..", "sw.js"), "utf8");
    });

    it("uses a versioned cache key", () => {
        expect(swSource).toContain("const CACHE_PREFIX = \"pwabuilder-precache\";");
        expect(swSource).toContain("const CACHE_VERSION = \"v2\";");
        expect(swSource).toContain("const CACHE = `${CACHE_PREFIX}-${CACHE_VERSION}`;");
    });

    it("cleans stale pwabuilder caches during activate", () => {
        expect(swSource).toMatch(
            /caches\.keys\(\)[\s\S]*cacheName\.startsWith\(CACHE_PREFIX\)[\s\S]*caches\.delete\(cacheName\)/
        );
    });

    it("uses network-first strategy for navigation requests", () => {
        expect(swSource).toContain("const isNavigationRequest =");
        expect(swSource).toContain("event.request.mode === \"navigate\"");
        expect(swSource).toMatch(
            /if \(isNavigationRequest\)[\s\S]*const response = await fetch\(event\.request\)[\s\S]*return await fromCache\(event\.request\)/
        );
    });

    it("falls back to cached index on navigation network failure", () => {
        expect(swSource).toContain("const cachedIndex = await caches.match(\"./index.html\");");
    });
});
