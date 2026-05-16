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

const {
    toTitleCase,
    fileExt,
    fileBasename,
    last,
    safeSVG,
    toFixed2,
    mixedNumber,
    nearestBeat,
    oneHundredToFraction,
    rationalToFraction,
    rationalSum,
    rgbToHex,
    hexToRGB,
    hex2rgb,
    resolveObject,
    safeJSONParse,
    escapeHTML,
    unescapeHTML,
    deepClone,
    isSafeUrl
} = require("../utils-logic.js");

describe("Utility Logic Functions", () => {
    describe("safeJSONParse()", () => {
        it("parses valid JSON", () => {
            expect(safeJSONParse('{"a":1}')).toEqual({ a: 1 });
        });

        it("returns fallback for invalid JSON", () => {
            expect(safeJSONParse("invalid", "fallback")).toBe("fallback");
        });

        it("returns fallback for non-string input", () => {
            expect(safeJSONParse(null, "fallback")).toBe("fallback");
        });
    });

    describe("toTitleCase()", () => {
        it("converts first character to uppercase", () => {
            expect(toTitleCase("hello")).toBe("Hello");
        });

        it("returns undefined if not a string", () => {
            expect(toTitleCase(123)).toBeUndefined();
        });

        it("returns empty string for empty input", () => {
            expect(toTitleCase("")).toBe("");
        });
    });

    describe("fileExt()", () => {
        it("returns file extension", () => {
            expect(fileExt("image.png")).toBe("png");
            expect(fileExt("archive.tar.gz")).toBe("gz");
        });

        it("returns empty string if no extension", () => {
            expect(fileExt("filename")).toBe("");
            expect(fileExt(null)).toBe("");
        });
    });

    describe("fileBasename()", () => {
        it("returns basename without extension", () => {
            expect(fileBasename("image.png")).toBe("image");
            expect(fileBasename("archive.tar.gz")).toBe("archive.tar");
        });

        it("handles files without extension", () => {
            expect(fileBasename("filename")).toBe("filename");
        });

        it("handles hidden files like .env", () => {
            expect(fileBasename(".env")).toBe(".env");
        });

        it("returns empty string for null input", () => {
            expect(fileBasename(null)).toBe("");
        });
    });

    describe("last()", () => {
        it("returns last element of array", () => {
            expect(last([1, 2, 3])).toBe(3);
            expect(last(["a", "b", "c"])).toBe("c");
        });

        it("returns null if empty array", () => {
            expect(last([])).toBeNull();
        });
    });

    describe("safeSVG()", () => {
        it("escapes HTML entities", () => {
            expect(safeSVG("<svg>")).toBe("&lt;svg&gt;");
            expect(safeSVG("Hello & goodbye")).toBe("Hello &amp; goodbye");
        });

        it("returns non-string as is", () => {
            expect(safeSVG(123)).toBe(123);
        });
    });

    describe("toFixed2()", () => {
        it("formats number to two decimals if needed", () => {
            expect(toFixed2(3.14159)).toBe("3.14");
            expect(toFixed2(3)).toBe("3");
        });

        it("returns input as is if not a number", () => {
            expect(toFixed2("abc")).toBe("abc");
        });
    });

    describe("mixedNumber()", () => {
        it("returns mixed fraction for fractional numbers", () => {
            expect(mixedNumber(2.25)).toBe("2 1/4");
            expect(mixedNumber(0.5)).toBe("1/2");
        });

        it("returns number/1 for integer", () => {
            expect(mixedNumber(2)).toBe("2/1");
        });

        it("returns input if not a number", () => {
            expect(mixedNumber("abc")).toBe("abc");
        });
    });

    describe("nearestBeat()", () => {
        it("finds nearest beat", () => {
            expect(nearestBeat(50, 8)).toEqual([4, 8]);
        });

        it("returns zero beat when very small", () => {
            expect(nearestBeat(1, 8)).toEqual([0, 8]);
        });
    });

    describe("oneHundredToFraction()", () => {
        it("returns fraction for given number", () => {
            expect(oneHundredToFraction(50)).toEqual([1, 2]);
            expect(oneHundredToFraction(1)).toEqual([1, 64]);
            expect(oneHundredToFraction(100)).toEqual([1, 1]);
        });

        it("handles exhaustive branch coverage", () => {
            expect(oneHundredToFraction(0)).toEqual([1, 64]);
            expect(oneHundredToFraction(150)).toEqual([1, 1]);
            expect(oneHundredToFraction(2)).toEqual([1, 48]);
            expect(oneHundredToFraction(7)).toEqual([1, 16]);
            expect(oneHundredToFraction(18)).toEqual([3, 16]);
            expect(oneHundredToFraction(40)).toEqual([2, 5]);
            expect(oneHundredToFraction(53)).toEqual([17, 32]);
            expect(oneHundredToFraction(66)).toEqual([2, 3]);
            expect(oneHundredToFraction(81)).toEqual([13, 16]);
            expect(oneHundredToFraction(91)).toEqual([11, 12]);
            expect(oneHundredToFraction(96)).toEqual([31, 32]);
            expect(oneHundredToFraction(99)).toEqual([63, 64]);
            expect(oneHundredToFraction(97)).toEqual([97, 100]);
        });
    });

    describe("rationalToFraction()", () => {
        it("converts float to fraction", () => {
            expect(rationalToFraction(0.5)).toEqual([1, 2]);
            expect(rationalToFraction(2)).toEqual([2, 1]);
        });

        it("handles 0, NaN, Infinity", () => {
            expect(rationalToFraction(0)).toEqual([0, 1]);
            expect(rationalToFraction(NaN)).toEqual([0, 1]);
            expect(rationalToFraction(Infinity)).toEqual([0, 1]);
        });
    });

    describe("rationalSum()", () => {
        it("adds simple fractions", () => {
            expect(rationalSum([1, 2], [1, 2])).toEqual([2, 2]);
        });

        it("handles unequal denominators", () => {
            expect(rationalSum([1, 3], [1, 6])).toEqual([3, 6]);
        });

        it("handles invalid input", () => {
            expect(rationalSum(null, [1, 2])).toEqual([0, 1]);
        });

        it("handles zero values", () => {
            expect(rationalSum([0, 1], [1, 2])).toEqual([1, 2]);
            expect(rationalSum([1, 2], [0, 1])).toEqual([1, 2]);
        });

        it("handles negative values", () => {
            expect(rationalSum([-1, 2], [1, 2])).toEqual([0, 2]);
            expect(rationalSum([1, 2], [-1, 2])).toEqual([0, 2]);
        });

        it("handles zero denominator", () => {
            expect(rationalSum([1, 0], [1, 2])).toEqual([0, 1]);
            expect(rationalSum([1, 2], [1, 0])).toEqual([0, 1]);
        });
    });

    describe("rgbToHex()", () => {
        it("converts rgb to hex", () => {
            expect(rgbToHex(255, 0, 0)).toBe("#ff0000");
            expect(rgbToHex(0, 0, 0)).toBe("#000000");
            expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
        });
    });

    describe("hexToRGB()", () => {
        it("converts hex to rgb object", () => {
            expect(hexToRGB("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
            expect(hexToRGB("00ff00")).toEqual({ r: 0, g: 255, b: 0 });
        });

        it("returns null for invalid hex", () => {
            expect(hexToRGB("#zzz")).toBeNull();
        });
    });

    describe("hex2rgb()", () => {
        it("converts hex to rgba string", () => {
            expect(hex2rgb("ff0000")).toBe("rgba(255,0,0,1)");
        });
    });

    describe("resolveObject()", () => {
        beforeAll(() => {
            global.TestNamespace = { Sub: { value: 42 } };
        });

        afterAll(() => {
            delete global.TestNamespace;
        });

        it("resolves nested path", () => {
            expect(resolveObject("TestNamespace.Sub.value")).toBe(42);
        });

        it("returns undefined for invalid path", () => {
            expect(resolveObject("TestNamespace.Invalid.prop")).toBeUndefined();
        });

        it("returns undefined for non-string input", () => {
            expect(resolveObject(123)).toBeUndefined();
        });
    });

    describe("escapeHTML() and unescapeHTML()", () => {
        it("escapes special characters", () => {
            const original = "<div>\"Hello\" & 'World'</div>";
            const escaped = "&lt;div&gt;&quot;Hello&quot; &amp; &#039;World&#039;&lt;/div&gt;";
            expect(escapeHTML(original)).toBe(escaped);
        });

        it("unescapes special characters", () => {
            const escaped = "&lt;div&gt;&quot;Hello&quot; &amp; &#039;World&#039;&lt;/div&gt;";
            const unescaped = "<div>\"Hello\" & 'World'</div>";
            expect(unescapeHTML(escaped)).toBe(unescaped);
        });
    });

    describe("deepClone()", () => {
        it("clones objects", () => {
            const obj = { a: 1, b: { c: 2 } };
            const cloned = deepClone(obj);
            expect(cloned).toEqual(obj);
            expect(cloned).not.toBe(obj);
            expect(cloned.b).not.toBe(obj.b);
        });

        it("clones nested arrays and objects", () => {
            const obj = {
                a: [1, 2, { b: 3 }],
                c: { d: [4, 5], e: 6 }
            };
            const cloned = deepClone(obj);
            expect(cloned).toEqual(obj);
            expect(cloned.a).not.toBe(obj.a);
            expect(cloned.a[2]).not.toBe(obj.a[2]);
            expect(cloned.c.d).not.toBe(obj.c.d);
        });
    });

    describe("isSafeUrl()", () => {
        it("identifies safe urls", () => {
            expect(isSafeUrl("http://example.com")).toBe(true);
            expect(isSafeUrl("https://example.com")).toBe(true);
            expect(isSafeUrl("mailto:test@example.com")).toBe(true);
        });
        it("identifies unsafe urls", () => {
            expect(isSafeUrl("javascript:alert(1)")).toBe(false);
            expect(isSafeUrl("data:text/html,Hello")).toBe(false);
            expect(isSafeUrl("vbscript:alert(1)")).toBe(false);
            expect(isSafeUrl("file:///etc/passwd")).toBe(false);
            expect(isSafeUrl("blob:https://example.com/uuid")).toBe(false);
            expect(isSafeUrl("tel:123456789")).toBe(false);
            expect(isSafeUrl("sms:123456789")).toBe(false);
            expect(isSafeUrl("chrome://settings")).toBe(false);
            expect(isSafeUrl("about:blank")).toBe(false);
            expect(isSafeUrl("invalid-url")).toBe(false);
            expect(isSafeUrl(null)).toBe(false);
            expect(isSafeUrl(undefined)).toBe(false);
            expect(isSafeUrl(123)).toBe(false);
        });
        it("identifies bypass attempts", () => {
            expect(isSafeUrl("&#106;avascript:alert(1)")).toBe(false);
            expect(isSafeUrl("javascript&colon;alert(1)")).toBe(false);
            expect(isSafeUrl("java\tscript:alert(1)")).toBe(false);
            expect(isSafeUrl("jav\rascript:alert(1)")).toBe(false);
            expect(isSafeUrl(" javascript:alert(1)")).toBe(false);
        });
    });
});
