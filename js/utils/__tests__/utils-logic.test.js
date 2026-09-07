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

global._ = msg => msg;

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
    GCD,
    rationalSum,
    LCD,
    clampNumber,
    rgbToHex,
    hexToRGB,
    hex2rgb,
    resolveObject,
    safeJSONParse,
    escapeHTML,
    unescapeHTML,
    deepClone,
    isSafeUrl,
    isUnsafeObjectKey,
    isValidHex,
    safeNumber,
    toArray,
    formatSeconds
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

        it("returns null fallback by default for invalid JSON", () => {
            expect(safeJSONParse("invalid")).toBeNull();
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
            expect(oneHundredToFraction(55)).toEqual([9, 16]);
            expect(oneHundredToFraction(97)).toEqual([31, 32]);
        });
    });

    describe("rationalToFraction()", () => {
        it("converts float to fraction", () => {
            expect(rationalToFraction(0.5)).toEqual([1, 2]);
            expect(rationalToFraction(2)).toEqual([2, 1]);
            expect(rationalToFraction(1)).toEqual([1, 1]);
            expect(rationalToFraction(4 / 3)).toEqual([4, 3]);
        });

        it("handles 0, NaN, Infinity, -Infinity", () => {
            expect(rationalToFraction(0)).toEqual([0, 1]);
            expect(rationalToFraction(NaN)).toEqual([0, 1]);
            expect(rationalToFraction(Infinity)).toEqual([0, 1]);
            expect(rationalToFraction(-Infinity)).toEqual([0, 1]);
        });

        it("handles negative numbers preserving sign on numerator", () => {
            expect(rationalToFraction(-0.5)).toEqual([-1, 2]);
            expect(rationalToFraction(-2.5)).toEqual([-5, 2]);
            expect(rationalToFraction(-0.75)).toEqual([-3, 4]);
        });

        it("handles values greater than one that exhaust iteration cap without reciprocal bug (pi, e)", () => {
            const [nPi, dPi] = rationalToFraction(Math.PI);
            expect(nPi / dPi).toBeGreaterThan(1);
            expect(Math.abs(nPi / dPi - Math.PI)).toBeLessThan(0.001);
            expect(GCD(nPi, dPi)).toBe(1);
            expect(dPi).toBeGreaterThan(0);

            const [nE, dE] = rationalToFraction(Math.E);
            expect(nE / dE).toBeGreaterThan(1);
            expect(Math.abs(nE / dE - Math.E)).toBeLessThan(0.001);
            expect(GCD(nE, dE)).toBe(1);
            expect(dE).toBeGreaterThan(0);
        });

        it("handles negative numbers greater than one without unreduced denominator", () => {
            const [n, d] = rationalToFraction(-Math.PI);
            expect(n).toBeLessThan(0);
            expect(d).toBeGreaterThan(0);
            expect(d).toBeLessThan(5000);
            expect(Math.abs(n / d - -Math.PI)).toBeLessThan(0.001);
            expect(GCD(Math.abs(n), d)).toBe(1);
        });

        it("reduces fractions via GCD on iteration cap", () => {
            const [n, d] = rationalToFraction(0.0003);
            expect(GCD(n, d)).toBe(1);
            expect(n).toBe(1);
            expect(d).toBe(3334);
        });

        it("ensures standard musical subdivisions stay exact and reduced", () => {
            for (let j = 1; j <= 64; j++) {
                const [n, d] = rationalToFraction(j / 64);
                expect(Math.abs(n / d - j / 64)).toBeLessThan(0.000001);
                expect(GCD(n, d)).toBe(1);
                expect(d).toBeGreaterThan(0);
            }
        });
    });

    describe("rationalSum()", () => {
        it("adds simple fractions", () => {
            expect(rationalSum([1, 2], [1, 2])).toEqual([[2, 2], null]);
        });

        it("handles unequal denominators", () => {
            expect(rationalSum([1, 3], [1, 6])).toEqual([[3, 6], null]);
        });

        it("handles invalid input", () => {
            const [result] = rationalSum(null, [1, 2]);
            expect(result).toEqual([0, 1]);
        });

        it("handles zero values", () => {
            expect(rationalSum([0, 1], [1, 2])).toEqual([[1, 2], null]);
            expect(rationalSum([1, 2], [0, 1])).toEqual([[1, 2], null]);
        });

        it("handles negative values", () => {
            expect(rationalSum([-1, 2], [1, 2])).toEqual([[0, 2], null]);
            expect(rationalSum([1, 2], [-1, 2])).toEqual([[0, 2], null]);
        });

        it("handles zero denominator", () => {
            const [result1] = rationalSum([1, 0], [1, 2]);
            expect(result1).toEqual([0, 1]);
            const [result2] = rationalSum([1, 2], [1, 0]);
            expect(result2).toEqual([0, 1]);
        });
    });

    describe("clampNumber()", () => {
        it("clamps values within range", () => {
            expect(clampNumber(5, 0, 10)).toBe(5);
        });

        it("clamps values below lower bound", () => {
            expect(clampNumber(-5, 0, 10)).toBe(0);
        });

        it("clamps values above upper bound", () => {
            expect(clampNumber(15, 0, 10)).toBe(10);
        });

        it("handles inverted min and max bounds", () => {
            expect(clampNumber(5, 10, 0)).toBe(5);
            expect(clampNumber(-2, 10, 0)).toBe(0);
            expect(clampNumber(12, 10, 0)).toBe(10);
        });

        it("returns fallback for non-numeric or NaN inputs", () => {
            expect(clampNumber("invalid", 0, 10)).toBe(0);
            expect(clampNumber(NaN, 0, 10, 5)).toBe(5);
            expect(clampNumber(null, 0, 10)).toBe(0);
        });
    });

    describe("safeNumber()", () => {
        it("returns finite numbers as is", () => {
            expect(safeNumber(42)).toBe(42);
            expect(safeNumber(3.14)).toBe(3.14);
            expect(safeNumber(0)).toBe(0);
            expect(safeNumber(-10)).toBe(-10);
        });

        it("parses valid numeric strings", () => {
            expect(safeNumber("42")).toBe(42);
            expect(safeNumber("  100  ")).toBe(100);
            expect(safeNumber("-15.5")).toBe(-15.5);
        });

        it("returns fallback for non-numeric, NaN, or non-finite inputs", () => {
            expect(safeNumber("invalid", 10)).toBe(10);
            expect(safeNumber(NaN, 5)).toBe(5);
            expect(safeNumber(Infinity, 0)).toBe(0);
            expect(safeNumber(null, 7)).toBe(7);
            expect(safeNumber(undefined, 0)).toBe(0);
            expect(safeNumber({}, 0)).toBe(0);
        });
    });

    describe("toArray()", () => {
        it("returns the original array if input is already an array", () => {
            const arr = [1, 2, 3];
            expect(toArray(arr)).toBe(arr);
            expect(toArray([])).toEqual([]);
        });

        it("wraps single non-array values in an array", () => {
            expect(toArray(42)).toEqual([42]);
            expect(toArray("hello")).toEqual(["hello"]);
            expect(toArray(true)).toEqual([true]);
            expect(toArray({ key: "val" })).toEqual([{ key: "val" }]);
        });

        it("returns an empty array for null or undefined", () => {
            expect(toArray(null)).toEqual([]);
            expect(toArray(undefined)).toEqual([]);
        });
    });

    describe("formatSeconds()", () => {
        it("formats seconds into MM:SS format", () => {
            expect(formatSeconds(0)).toBe("00:00");
            expect(formatSeconds(5)).toBe("00:05");
            expect(formatSeconds(65)).toBe("01:05");
            expect(formatSeconds(125)).toBe("02:05");
        });

        it("formats large durations into HH:MM:SS format", () => {
            expect(formatSeconds(3600)).toBe("01:00:00");
            expect(formatSeconds(3665)).toBe("01:01:05");
        });

        it("handles numeric string inputs", () => {
            expect(formatSeconds("125")).toBe("02:05");
            expect(formatSeconds("65.8")).toBe("01:05");
        });

        it("returns fallback 00:00 for invalid or negative inputs", () => {
            expect(formatSeconds(-10)).toBe("00:00");
            expect(formatSeconds(NaN)).toBe("00:00");
            expect(formatSeconds(null)).toBe("00:00");
            expect(formatSeconds(undefined)).toBe("00:00");
            expect(formatSeconds("invalid")).toBe("00:00");
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

        it("converts shorthand 3-digit hex to rgb object", () => {
            expect(hexToRGB("#fff")).toEqual({ r: 255, g: 255, b: 255 });
            expect(hexToRGB("f00")).toEqual({ r: 255, g: 0, b: 0 });
            expect(hexToRGB("#0f0")).toEqual({ r: 0, g: 255, b: 0 });
        });

        it("returns null for invalid hex or non-string inputs", () => {
            expect(hexToRGB("#zzz")).toBeNull();
            expect(hexToRGB(null)).toBeNull();
            expect(hexToRGB(123)).toBeNull();
        });
    });

    describe("hex2rgb()", () => {
        it("converts hex to rgba string", () => {
            expect(hex2rgb("ff0000")).toBe("rgba(255,0,0,1)");
        });

        it("handles leading hash prefix", () => {
            expect(hex2rgb("#ff0000")).toBe("rgba(255,0,0,1)");
            expect(hex2rgb("#00ff00")).toBe("rgba(0,255,0,1)");
        });

        it("handles 3-digit shorthand hex codes", () => {
            expect(hex2rgb("#f00")).toBe("rgba(255,0,0,1)");
            expect(hex2rgb("f00")).toBe("rgba(255,0,0,1)");
            expect(hex2rgb("#abc")).toBe("rgba(170,187,204,1)");
        });

        it("supports custom alpha transparency values", () => {
            expect(hex2rgb("#ff0000", 0.5)).toBe("rgba(255,0,0,0.5)");
            expect(hex2rgb("#00ff00", 0)).toBe("rgba(0,255,0,0)");
        });

        it("clamps alpha value between 0 and 1", () => {
            expect(hex2rgb("#ff0000", 1.5)).toBe("rgba(255,0,0,1)");
            expect(hex2rgb("#ff0000", -0.5)).toBe("rgba(255,0,0,0)");
            expect(hex2rgb("#ff0000", "invalid")).toBe("rgba(255,0,0,1)");
        });

        it("returns fallback rgba for invalid or non-string inputs", () => {
            expect(hex2rgb(null)).toBe("rgba(0,0,0,1)");
            expect(hex2rgb("invalid")).toBe("rgba(0,0,0,1)");
        });
    });

    describe("isValidHex()", () => {
        it("returns true for valid 6-digit hex color codes with or without hash prefix", () => {
            expect(isValidHex("#ffffff")).toBe(true);
            expect(isValidHex("ffffff")).toBe(true);
            expect(isValidHex("#FF0031")).toBe(true);
            expect(isValidHex("00FF00")).toBe(true);
        });

        it("returns true for valid 3-digit shorthand hex color codes with or without hash prefix", () => {
            expect(isValidHex("#fff")).toBe(true);
            expect(isValidHex("fff")).toBe(true);
            expect(isValidHex("#f00")).toBe(true);
            expect(isValidHex("ABC")).toBe(true);
        });

        it("returns false for invalid length or non-hex characters", () => {
            expect(isValidHex("#12345")).toBe(false);
            expect(isValidHex("#1234567")).toBe(false);
            expect(isValidHex("#gggggg")).toBe(false);
            expect(isValidHex("invalid")).toBe(false);
            expect(isValidHex("")).toBe(false);
        });

        it("returns false for non-string inputs", () => {
            expect(isValidHex(null)).toBe(false);
            expect(isValidHex(undefined)).toBe(false);
            expect(isValidHex(123456)).toBe(false);
            expect(isValidHex({})).toBe(false);
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
        });
        it("identifies unsafe urls", () => {
            expect(isSafeUrl("mailto:test@example.com")).toBe(false);
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

    describe("isUnsafeObjectKey()", () => {
        it("flags reserved prototype-related keys", () => {
            expect(isUnsafeObjectKey("__proto__")).toBe(true);
            expect(isUnsafeObjectKey("constructor")).toBe(true);
            expect(isUnsafeObjectKey("prototype")).toBe(true);
        });

        it("allows ordinary keys", () => {
            expect(isUnsafeObjectKey("myPlugin")).toBe(false);
            expect(isUnsafeObjectKey("FLOWPLUGINS")).toBe(false);
            expect(isUnsafeObjectKey("")).toBe(false);
        });
    });

    describe("GCD()", () => {
        it("returns the greatest common divisor of two positive integers", () => {
            expect(GCD(12, 18)).toBe(6);
            expect(GCD(17, 5)).toBe(1);
            expect(GCD(100, 10)).toBe(10);
        });

        it("is symmetric in its arguments", () => {
            expect(GCD(48, 36)).toBe(GCD(36, 48));
        });

        it("ignores the sign of either argument", () => {
            expect(GCD(-12, 18)).toBe(6);
            expect(GCD(12, -18)).toBe(6);
            expect(GCD(-12, -18)).toBe(6);
        });

        it("treats zero as the identity element", () => {
            expect(GCD(0, 7)).toBe(7);
            expect(GCD(7, 0)).toBe(7);
            expect(GCD(0, 0)).toBe(0);
        });

        it("returns a value that divides both inputs exactly", () => {
            for (const [a, b] of [
                [24, 36],
                [81, 27],
                [1071, 462],
                [13, 91]
            ]) {
                const g = GCD(a, b);
                expect(a % g).toBe(0);
                expect(b % g).toBe(0);
            }
        });
    });

    describe("LCD()", () => {
        it("returns the least common multiple of two integers", () => {
            expect(LCD(4, 6)).toBe(12);
            expect(LCD(3, 5)).toBe(15);
            expect(LCD(6, 6)).toBe(6);
        });

        it("ignores the sign of either argument", () => {
            expect(LCD(-4, 6)).toBe(12);
            expect(LCD(4, -6)).toBe(12);
        });

        it("is zero when either argument is zero", () => {
            expect(LCD(0, 7)).toBe(0);
        });

        it("returns a value that is a multiple of both inputs", () => {
            for (const [a, b] of [
                [4, 6],
                [9, 12],
                [7, 3],
                [10, 15]
            ]) {
                const m = LCD(a, b);
                expect(m % a).toBe(0);
                expect(m % b).toBe(0);
            }
        });

        it("satisfies GCD(a, b) * LCD(a, b) === |a * b|", () => {
            for (const [a, b] of [
                [4, 6],
                [12, 18],
                [7, 13],
                [21, 6]
            ]) {
                expect(GCD(a, b) * LCD(a, b)).toBe(Math.abs(a * b));
            }
        });
    });

    describe("rationalToFraction() — additional cases", () => {
        it("approximates a fraction whose value is below one", () => {
            expect(rationalToFraction(0.6)).toEqual([3, 5]);
            expect(rationalToFraction(0.75)).toEqual([3, 4]);
        });

        it("approximates a fraction whose value is above one", () => {
            expect(rationalToFraction(1.5)).toEqual([3, 2]);
        });

        it("returns numerator and denominator that approximate the input", () => {
            for (const value of [0.2, 0.333333333, 0.875, 1.25, 2.5]) {
                const result = rationalToFraction(value);
                expect(Array.isArray(result)).toBe(true);
                expect(result[1]).not.toBe(0);
                expect(Math.abs(result[0] / result[1] - value)).toBeLessThan(1e-6);
            }
        });

        it("returns a bounded reduced approximation for a sub-one value that never converges", () => {
            // The existing suite already covers pi and e, which are > 1 and so
            // take the reciprocal path. 1/pi is below one, so the iteration cap
            // is reached without inversion. Whichever way the loop exits, the
            // observable contract holds: a finite, fully reduced
            // [numerator, denominator] pair with a positive denominator whose
            // value stays close to the input.
            const target = 1 / Math.PI;
            const [num, den] = rationalToFraction(target);

            expect(Number.isInteger(num)).toBe(true);
            expect(Number.isInteger(den)).toBe(true);
            expect(den).toBeGreaterThan(0);
            expect(GCD(Math.abs(num), den)).toBe(1);

            const error = Math.abs(num / den - target);
            expect(error).toBeLessThan(1e-3);
            // Non-zero because no integer ratio equals 1/pi — distinguishes the
            // estimate-and-stop path from an exact match such as 0.75 -> [3, 4].
            expect(error).toBeGreaterThan(0);
        });
    });

    describe("rationalSum() — non-integer components", () => {
        it("normalizes a non-integer numerator on either side before summing", () => {
            expect(rationalSum([1.5, 2], [1, 2])).toEqual([[5, 4], null]);
            expect(rationalSum([1, 2], [1.5, 2])).toEqual([[5, 4], null]);
        });

        it("normalizes a non-integer denominator on either side before summing", () => {
            expect(rationalSum([1, 2.5], [1, 2])).toEqual([[9, 10], null]);
            expect(rationalSum([1, 2], [1, 2.5])).toEqual([[9, 10], null]);
        });

        it("keeps the result unreduced for a shared denominator", () => {
            expect(rationalSum([3, 4], [1, 4])).toEqual([[4, 4], null]);
        });

        it("is commutative in the value of the sum", () => {
            const [[num1, den1]] = rationalSum([1, 3], [2, 7]);
            const [[num2, den2]] = rationalSum([2, 7], [1, 3]);
            expect(num1 / den1).toBeCloseTo(num2 / den2, 10);
        });
    });

    describe("mixedNumber() — rounding edges", () => {
        it("carries a fractional part that rounds up to a whole number", () => {
            expect(mixedNumber(1.9999999999)).toBe("2");
        });

        it("falls back to a two-decimal string when the denominator is large", () => {
            expect(mixedNumber(2.123456)).toBe("2.12");
        });

        it("returns a bare fraction when the whole part is zero", () => {
            expect(mixedNumber(0.25)).toBe("1/4");
        });
    });

    describe("oneHundredToFraction() — full domain", () => {
        it("clamps values outside the 1-99 range to the extremes", () => {
            expect(oneHundredToFraction(0)).toEqual([1, 64]);
            expect(oneHundredToFraction(0.5)).toEqual([1, 64]);
            expect(oneHundredToFraction(-5)).toEqual([1, 64]);
            expect(oneHundredToFraction(99.5)).toEqual([1, 1]);
            expect(oneHundredToFraction(100)).toEqual([1, 1]);
        });

        it("returns a defined fraction for every integer percent from 1 to 99", () => {
            for (let d = 1; d <= 99; d++) {
                const result = oneHundredToFraction(d);
                expect(Array.isArray(result)).toBe(true);
                expect(result).toHaveLength(2);
                expect(typeof result[0]).toBe("number");
                expect(result[1]).toBeGreaterThan(0);
            }
        });

        it("stays within 0.06 of the requested ratio across the whole domain", () => {
            for (let d = 1; d <= 99; d++) {
                const result = oneHundredToFraction(d);
                expect(Array.isArray(result)).toBe(true);
                expect(Math.abs(result[0] / result[1] - d / 100)).toBeLessThan(0.06);
            }
        });

        it("is monotonically non-decreasing across the domain", () => {
            let previous = -Infinity;
            for (let d = 1; d <= 99; d++) {
                const result = oneHundredToFraction(d);
                expect(Array.isArray(result)).toBe(true);
                const value = result[0] / result[1];
                expect(value).toBeGreaterThanOrEqual(previous);
                previous = value;
            }
        });

        it("returns the expected fraction at representative points", () => {
            // A handful of anchor values spread across the domain, including
            // the two single-value cases (1, 2), a plateau interior (85 -> 5/6)
            // and the last in-range value (99). Not a transcription of the
            // whole table — just enough to catch a wholesale mismapping.
            expect(oneHundredToFraction(1)).toEqual([1, 64]);
            expect(oneHundredToFraction(2)).toEqual([1, 48]);
            expect(oneHundredToFraction(3)).toEqual([1, 32]);
            expect(oneHundredToFraction(25)).toEqual([1, 4]);
            expect(oneHundredToFraction(50)).toEqual([1, 2]);
            expect(oneHundredToFraction(85)).toEqual([5, 6]);
            expect(oneHundredToFraction(99)).toEqual([63, 64]);
        });

        it("holds a value constant within a plateau and steps up at its edges", () => {
            // The 48..52 plateau maps to 1/2; the neighbours on each side are
            // strictly smaller / larger. This pins the step structure without
            // enumerating every case.
            const half = oneHundredToFraction(48);
            expect(half).toEqual([1, 2]);
            for (let d = 48; d <= 52; d++) {
                expect(oneHundredToFraction(d)).toEqual(half);
            }

            const below = oneHundredToFraction(47);
            const above = oneHundredToFraction(53);
            expect(below[0] / below[1]).toBeLessThan(half[0] / half[1]);
            expect(above[0] / above[1]).toBeGreaterThan(half[0] / half[1]);
        });
    });

    describe("escapeHTML() / unescapeHTML() round trip", () => {
        it("recovers the original string after escaping", () => {
            for (const original of [
                "<div>\"Hello\" & 'World'</div>",
                "a<b>c&d'e\"f",
                "&amp;lt; already-entity-looking text",
                "plain text with no special characters",
                ""
            ]) {
                expect(unescapeHTML(escapeHTML(original))).toBe(original);
            }
        });
    });

    describe("resolveObject() — error handling", () => {
        it("returns undefined when traversing a path throws", () => {
            let getterWasCalled = false;
            global.MbResolveThrows = new Proxy(
                {},
                {
                    get() {
                        getterWasCalled = true;
                        throw new Error("boom");
                    }
                }
            );
            try {
                expect(resolveObject("MbResolveThrows.value")).toBeUndefined();
                // Guards against a regression that returns undefined without
                // ever walking into the throwing property.
                expect(getterWasCalled).toBe(true);
            } finally {
                delete global.MbResolveThrows;
            }
        });

        it("returns undefined for an empty path", () => {
            expect(resolveObject("")).toBeUndefined();
        });
    });
});
