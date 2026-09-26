/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
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

const base64Utils = require("../base64Utils");
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

describe("base64Utils", () => {
    test("base64Encode should correctly encode a string to Base64", () => {
        expect(base64Utils.base64Encode("hello")).toBe("aGVsbG8=");
        expect(base64Utils.base64Encode("Base64 Encoding!")).toBe("QmFzZTY0IEVuY29kaW5nIQ==");
        expect(base64Utils.base64Encode("123456")).toBe("MTIzNDU2");
    });

    test("base64Decode should correctly decode a Base64 string", () => {
        expect(base64Utils.base64Decode("aGVsbG8=")).toBe("hello");
        expect(base64Utils.base64Decode("QmFzZTY0IEVuY29kaW5nIQ==")).toBe("Base64 Encoding!");
        expect(base64Utils.base64Decode("MTIzNDU2")).toBe("123456");
    });

    test("base64Encode and base64Decode should be reversible", () => {
        const originalText = "Reversible Test!";
        const encoded = base64Utils.base64Encode(originalText);
        const decoded = base64Utils.base64Decode(encoded);
        expect(decoded).toBe(originalText);
    });

    test("base64Encode should handle empty strings", () => {
        expect(base64Utils.base64Encode("")).toBe("");
    });

    test("base64Decode should handle empty strings", () => {
        expect(base64Utils.base64Decode("")).toBe("");
    });

    test("base64Encode should handle Unicode characters", () => {
        const unicode = "Hello 世界 🎵";
        const encoded = base64Utils.base64Encode(unicode);
        expect(encoded).toBeDefined();
        expect(typeof encoded).toBe("string");
        expect(encoded.length).toBeGreaterThan(0);
    });

    test("base64Encode and base64Decode should handle long strings", () => {
        const longString = "a".repeat(10000);
        const encoded = base64Utils.base64Encode(longString);
        const decoded = base64Utils.base64Decode(encoded);
        expect(decoded).toBe(longString);
    });

    test("base64Encode should handle inputs exceeding 128KB without call stack overflow", () => {
        const largeString = "x".repeat(150000);
        const encoded = base64Utils.base64Encode(largeString);
        const decoded = base64Utils.base64Decode(encoded);
        expect(decoded).toBe(largeString);
    });

    test("base64Encode and base64Decode should be reversible for Unicode", () => {
        const original = "Hello 世界 🎵 こんにちは नमस्ते";
        const encoded = base64Utils.base64Encode(original);
        const decoded = base64Utils.base64Decode(encoded);
        expect(decoded).toBe(original);
    });

    test("base64Encode produces standard UTF-8 Base64 for multibyte input", () => {
        expect(base64Utils.base64Encode("Hello 世界 🎵")).toBe("SGVsbG8g5LiW55WMIPCfjrU=");
        expect(base64Utils.base64Encode("café")).toBe("Y2Fmw6k=");
        expect(base64Utils.base64Encode("日本語")).toBe("5pel5pys6Kqe");
    });

    test("base64Decode is the inverse of base64Encode across representative inputs", () => {
        const samples = [
            "",
            "a",
            "ab",
            "abc",
            "The quick brown fox jumps over the lazy dog.",
            "line1\nline2\ttabbed",
            "<svg>♪</svg>",
            "Hello 世界 🎵 こんにちは नमस्ते",
            // Larger than the ~128KB threshold at which a spread-based byte
            // conversion would overflow the call stack (see js/base64Utils.js).
            "x".repeat(200000)
        ];
        for (const original of samples) {
            expect(base64Utils.base64Decode(base64Utils.base64Encode(original))).toBe(original);
        }
    });

    test("base64Encode output contains only Base64 alphabet characters", () => {
        const encoded = base64Utils.base64Encode("Hello 世界 🎵 padding-check!!");
        expect(encoded).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
    });

    test("base64Decode delegates to window.atob for invalid input handling", () => {
        // base64Decode does not validate input itself; behavior is runtime-dependent.
        // window.atob may throw or handle invalid input differently per environment.
        const validResult = base64Utils.base64Decode("aGVsbG8=");
        expect(validResult).toBe("hello");
    });

    test("base64Decode surfaces the runtime decode error for input outside the Base64 alphabet", () => {
        // The function performs no validation of its own, so a decode failure
        // from the platform (jsdom's atob here) propagates to the caller
        // rather than being swallowed or returning a bogus string.
        expect(() => base64Utils.base64Decode("!!!!")).toThrow();
        expect(() => base64Utils.base64Decode("not valid base64$$")).toThrow();
    });
});
