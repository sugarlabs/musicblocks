// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

global._ = jest.fn(str => str);

const jQueryStub = jest.fn(() => ({
    modal: jest.fn(),
    on: jest.fn(),
    ready: jest.fn()
}));
jQueryStub.ready = jest.fn();
global.$ = jQueryStub;

global.document = {
    getElementById: jest.fn(() => null),
    addEventListener: jest.fn(),
    cookie: ""
};

const { buildShareURL, buildEmbedSnippet, isSafeMusicBlocksURL } = require("../helper");

const BASE = "https://musicblocks.sugarlabs.org/index.html";
const SAMPLE_URL = `${BASE}?id=42&run=True`;

// ─── buildShareURL ────────────────────────────────────────────────────────────

describe("buildShareURL", () => {
    it("starts with the canonical Music Blocks base URL", () => {
        expect(buildShareURL("abc").startsWith(BASE)).toBe(true);
    });

    it("uses the ?id= query parameter", () => {
        expect(buildShareURL("myid")).toContain("?id=myid");
    });

    it("encodes special characters in the id", () => {
        const url = buildShareURL("id with spaces");
        expect(url).toContain("id%20with%20spaces");
        expect(url).not.toContain(" ");
    });

    it("appends &run=True when options.run is true", () => {
        expect(buildShareURL("123", { run: true })).toContain("&run=True");
    });

    it("appends &show=True when options.show is true", () => {
        expect(buildShareURL("123", { show: true })).toContain("&show=True");
    });

    it("appends &collapse=True when options.collapse is true", () => {
        expect(buildShareURL("123", { collapse: true })).toContain("&collapse=True");
    });

    it("appends all three flags when all options are true", () => {
        const url = buildShareURL("123", { run: true, show: true, collapse: true });
        expect(url).toContain("&run=True");
        expect(url).toContain("&show=True");
        expect(url).toContain("&collapse=True");
    });

    it("does not append flags when options are false", () => {
        const url = buildShareURL("123", { run: false, show: false, collapse: false });
        expect(url).not.toContain("run");
        expect(url).not.toContain("show");
        expect(url).not.toContain("collapse");
    });

    it("does not append flags when no options object is provided", () => {
        const url = buildShareURL("123");
        expect(url).not.toContain("run");
        expect(url).not.toContain("show");
        expect(url).not.toContain("collapse");
    });
});

// ─── isSafeMusicBlocksURL ─────────────────────────────────────────────────────

describe("isSafeMusicBlocksURL", () => {
    it("accepts a valid Music Blocks https URL", () => {
        expect(isSafeMusicBlocksURL(SAMPLE_URL)).toBe(true);
    });

    it("rejects javascript: URLs", () => {
        expect(isSafeMusicBlocksURL("javascript:alert(1)")).toBe(false);
    });

    it("rejects data: URLs", () => {
        expect(isSafeMusicBlocksURL("data:text/html,<script>alert(1)</script>")).toBe(false);
    });

    it("rejects vbscript: URLs", () => {
        expect(isSafeMusicBlocksURL("vbscript:msgbox(1)")).toBe(false);
    });

    it("rejects http: (non-https) Music Blocks URLs", () => {
        expect(isSafeMusicBlocksURL("http://musicblocks.sugarlabs.org/index.html?id=1")).toBe(false);
    });

    it("rejects URLs from other domains", () => {
        expect(isSafeMusicBlocksURL("https://evil.com/index.html?id=1")).toBe(false);
    });

    it("rejects bare strings without protocol", () => {
        expect(isSafeMusicBlocksURL("musicblocks.sugarlabs.org")).toBe(false);
    });

    it("rejects empty string", () => {
        expect(isSafeMusicBlocksURL("")).toBe(false);
    });
});

// ─── buildEmbedSnippet ────────────────────────────────────────────────────────

describe("buildEmbedSnippet", () => {
    it("returns a string starting with <iframe", () => {
        expect(buildEmbedSnippet(SAMPLE_URL).startsWith("<iframe")).toBe(true);
    });

    it("ends with </iframe>", () => {
        expect(buildEmbedSnippet(SAMPLE_URL).endsWith("</iframe>")).toBe(true);
    });

    it("includes the given URL as the src", () => {
        expect(buildEmbedSnippet(SAMPLE_URL)).toContain(`src="${SAMPLE_URL}"`);
    });

    it("includes a sandbox attribute for security", () => {
        expect(buildEmbedSnippet(SAMPLE_URL)).toContain("sandbox=");
    });

    it("sandboxes allow-scripts and allow-same-origin", () => {
        const snippet = buildEmbedSnippet(SAMPLE_URL);
        expect(snippet).toContain("allow-scripts");
        expect(snippet).toContain("allow-same-origin");
    });

    it("includes width and height attributes", () => {
        const snippet = buildEmbedSnippet(SAMPLE_URL);
        expect(snippet).toContain("width=");
        expect(snippet).toContain("height=");
    });

    it("uses 800x600 dimensions for usable embed size", () => {
        const snippet = buildEmbedSnippet(SAMPLE_URL);
        expect(snippet).toContain('width="800"');
        expect(snippet).toContain('height="600"');
    });

    it("includes a title attribute for accessibility", () => {
        expect(buildEmbedSnippet(SAMPLE_URL)).toContain("title=");
    });

    it("uses the project name in the title when provided", () => {
        expect(buildEmbedSnippet(SAMPLE_URL, "My Song")).toContain("My Song");
    });

    it("falls back to a default title when no project name is provided", () => {
        expect(buildEmbedSnippet(SAMPLE_URL)).toContain("Music Blocks Project");
    });

    it("produces different snippets for different URLs", () => {
        const s1 = buildEmbedSnippet(`${BASE}?id=1`);
        const s2 = buildEmbedSnippet(`${BASE}?id=2`);
        expect(s1).not.toBe(s2);
    });

    it("returns empty string for javascript: URL", () => {
        expect(buildEmbedSnippet("javascript:alert(1)")).toBe("");
    });

    it("returns empty string for data: URL", () => {
        expect(buildEmbedSnippet("data:text/html,<script>alert(1)</script>")).toBe("");
    });

    it("returns empty string for a non-Music Blocks https URL", () => {
        expect(buildEmbedSnippet("https://evil.com/page")).toBe("");
    });

    it("returns empty string for an empty string", () => {
        expect(buildEmbedSnippet("")).toBe("");
    });

    it("escapes quotes in project name to prevent XSS", () => {
        const snippet = buildEmbedSnippet(SAMPLE_URL, 'My Project" onload="alert(1)');
        expect(snippet).not.toContain('onload="alert(1)"');
        expect(snippet).toContain("&quot;");
    });

    it("escapes angle brackets in project name", () => {
        const snippet = buildEmbedSnippet(SAMPLE_URL, "<script>bad</script>");
        expect(snippet).not.toContain("<script>");
        expect(snippet).toContain("&lt;script&gt;");
    });
});
