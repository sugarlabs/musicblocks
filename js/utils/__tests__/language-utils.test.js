/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2014-2026 Walter Bender
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const fs = require("fs");
const path = require("path");

const { normalizeLanguageCode } = require("../language-utils");

const ROOT = path.join(__dirname, "..", "..", "..");
const LOCALES_DIR = path.join(ROOT, "locales");

describe("normalizeLanguageCode", () => {
    it("maps the English menu codes onto their locale files", () => {
        expect(normalizeLanguageCode("enUS")).toBe("en");
        expect(normalizeLanguageCode("enUK")).toBe("en_GB");
    });

    it("maps the Chinese menu code onto its locale file", () => {
        expect(normalizeLanguageCode("zhCN")).toBe("zh_CN");
    });

    it("collapses the Japanese variants onto ja", () => {
        expect(normalizeLanguageCode("ja")).toBe("ja");
        expect(normalizeLanguageCode("kana")).toBe("ja");
        expect(normalizeLanguageCode("ja-kana")).toBe("ja");
        expect(normalizeLanguageCode("ja-kanji")).toBe("ja");
    });

    it("passes through codes that already name a locale file", () => {
        expect(normalizeLanguageCode("fr")).toBe("fr");
        expect(normalizeLanguageCode("zh_CN")).toBe("zh_CN");
        expect(normalizeLanguageCode("en_GB")).toBe("en_GB");
    });

    it("falls back to en for empty or non-string input", () => {
        expect(normalizeLanguageCode("")).toBe("en");
        expect(normalizeLanguageCode(undefined)).toBe("en");
        expect(normalizeLanguageCode(null)).toBe("en");
    });
});

describe("language dropdown coverage", () => {
    const dropdownIds = (() => {
        const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
        const block = html.match(/<ul id="languagedropdown"[\s\S]*?<\/ul>/);
        expect(block).not.toBeNull();
        return [...block[0].matchAll(/<a id="([^"]+)"/g)].map(match => match[1]);
    })();

    it("finds the language entries in index.html", () => {
        expect(dropdownIds.length).toBeGreaterThan(0);
    });

    it.each(dropdownIds)("resolves %s to a locale file that exists", id => {
        const locale = normalizeLanguageCode(id);
        expect(fs.existsSync(path.join(LOCALES_DIR, `${locale}.json`))).toBe(true);
    });
});
