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

const { buildShareURL, buildEmbedSnippet } = require("../helper");

const BASE = "https://musicblocks.sugarlabs.org/index.html";

describe("buildShareURL", () => {
    it("returns a URL containing the project id", () => {
        expect(buildShareURL("12345")).toContain("12345");
    });

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

describe("buildEmbedSnippet", () => {
    const sampleURL = "https://musicblocks.sugarlabs.org/index.html?id=42&run=True";

    it("returns a string starting with <iframe", () => {
        expect(buildEmbedSnippet(sampleURL).startsWith("<iframe")).toBe(true);
    });

    it("ends with </iframe>", () => {
        expect(buildEmbedSnippet(sampleURL).endsWith("</iframe>")).toBe(true);
    });

    it("includes the given URL as the src", () => {
        expect(buildEmbedSnippet(sampleURL)).toContain(`src="${sampleURL}"`);
    });

    it("includes a sandbox attribute for security", () => {
        expect(buildEmbedSnippet(sampleURL)).toContain("sandbox=");
    });

    it("sandboxes allow-scripts and allow-same-origin", () => {
        const snippet = buildEmbedSnippet(sampleURL);
        expect(snippet).toContain("allow-scripts");
        expect(snippet).toContain("allow-same-origin");
    });

    it("includes width and height attributes", () => {
        const snippet = buildEmbedSnippet(sampleURL);
        expect(snippet).toContain("width=");
        expect(snippet).toContain("height=");
    });

    it("produces different snippets for different URLs", () => {
        const s1 = buildEmbedSnippet("https://musicblocks.sugarlabs.org/index.html?id=1");
        const s2 = buildEmbedSnippet("https://musicblocks.sugarlabs.org/index.html?id=2");
        expect(s1).not.toBe(s2);
    });
});
