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
});
