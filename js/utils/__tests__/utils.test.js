/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2024 ravjot07
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

const fs = require("fs");
const path = require("path");

describe("Utility Functions (logic-only)", () => {
    let toTitleCase,
        fileExt,
        fileBasename,
        last,
        safeSVG,
        toFixed2,
        mixedNumber,
        nearestBeat,
        oneHundredToFraction,
        rationalToFraction,
        rgbToHex,
        hexToRGB,
        hex2rgb,
        format;

    beforeAll(() => {
        global.window = {
            btoa: str => Buffer.from(str, "utf8").toString("base64"),
            outerHeight: 600,
            outerWidth: 800,
            innerHeight: 400,
            innerWidth: 600,
            devicePixelRatio: 2,
            widgetWindows: {
                hideAllWindows: jest.fn(),
                hideWindow: jest.fn()
            },
            server: "http://localhost/",
            onload: null,
            setInterval: jest.fn(),
            clearInterval: jest.fn()
        };
        global.navigator = { userAgent: "NodeTest" };

        global.document = {
            getElementById: jest.fn(() => null),
            getElementsByClassName: jest.fn(() => []),
            getElementsByName: jest.fn(() => []),
            getElementsByTagName: jest.fn(() => []),
            querySelector: jest.fn(() => {
                return {
                    getContext: jest.fn(() => ({ measureText: () => ({ width: 42 }) }))
                };
            }),
            body: { innerHTML: "" },
            createElement: jest.fn(() => {
                return {
                    getContext: jest.fn(() => ({ measureText: () => ({ width: 42 }) }))
                };
            })
        };

        global.localStorage = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
            kanaPreference: ""
        };

        global.XMLHttpRequest = class {
            open() {}
            setRequestHeader() {}
            send() {
                this.status = 200;
                this.responseText = "Mock response";
            }
        };

        global.self = {
            location: { href: "file:///" },
            console: console
        };

        const code = fs.readFileSync(path.join(__dirname, "../utils.js"), "utf8");

        const wrapper = new Function(`
            ${code}
            return {
                toTitleCase: typeof toTitleCase !== "undefined" ? toTitleCase : undefined,
                fileExt: typeof fileExt !== "undefined" ? fileExt : undefined,
                fileBasename: typeof fileBasename !== "undefined" ? fileBasename : undefined,
                last: typeof last !== "undefined" ? last : undefined,
                safeSVG: typeof safeSVG !== "undefined" ? safeSVG : undefined,
                toFixed2: typeof toFixed2 !== "undefined" ? toFixed2 : undefined,
                mixedNumber: typeof mixedNumber !== "undefined" ? mixedNumber : undefined,
                nearestBeat: typeof nearestBeat !== "undefined" ? nearestBeat : undefined,
                oneHundredToFraction: typeof oneHundredToFraction !== "undefined" ? oneHundredToFraction : undefined,
                rationalToFraction: typeof rationalToFraction !== "undefined" ? rationalToFraction : undefined,
                rgbToHex: typeof rgbToHex !== "undefined" ? rgbToHex : undefined,
                hexToRGB: typeof hexToRGB !== "undefined" ? hexToRGB : undefined,
                hex2rgb: typeof hex2rgb !== "undefined" ? hex2rgb : undefined,
                format: typeof format !== "undefined" ? format : undefined
            };
        `);

        const exported = wrapper();

        toTitleCase = exported.toTitleCase;
        fileExt = exported.fileExt;
        fileBasename = exported.fileBasename;
        last = exported.last;
        safeSVG = exported.safeSVG;
        toFixed2 = exported.toFixed2;
        mixedNumber = exported.mixedNumber;
        nearestBeat = exported.nearestBeat;
        oneHundredToFraction = exported.oneHundredToFraction;
        rationalToFraction = exported.rationalToFraction;
        rgbToHex = exported.rgbToHex;
        hexToRGB = exported.hexToRGB;
        hex2rgb = exported.hex2rgb;
        format = exported.format;
    });

    describe("toTitleCase()", () => {
        it("converts first character to uppercase", () => {
            expect(toTitleCase("hello")).toBe("Hello");
        });

        it("returns undefined if not a string", () => {
            expect(toTitleCase(123)).toBeUndefined();
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
            expect(mixedNumber(1)).toBe("1/1");
        });

        it("returns number/1 for integer", () => {
            expect(mixedNumber(2)).toBe("2/1");
        });
    });

    describe("nearestBeat()", () => {
        it("finds nearest beat", () => {
            expect(nearestBeat(50, 8)).toEqual([4, 8]);
        });
    });

    describe("oneHundredToFraction()", () => {
        it("returns fraction for given number", () => {
            expect(oneHundredToFraction(50)).toEqual([1, 2]);
            expect(oneHundredToFraction(1)).toEqual([1, 64]);
            expect(oneHundredToFraction(100)).toEqual([1, 1]);
        });
    });

    describe("rationalToFraction()", () => {
        it("converts float to fraction", () => {
            expect(rationalToFraction(0.5)).toEqual([1, 2]);
        });

        it("handles 0, NaN, Infinity", () => {
            expect(rationalToFraction(0)).toEqual([0, 1]);
            expect(rationalToFraction(NaN)).toEqual([0, 1]);
            expect(rationalToFraction(Infinity)).toEqual([0, 1]);
        });
    });

    describe("rgbToHex()", () => {
        it("converts rgb to hex", () => {
            expect(rgbToHex(255, 0, 0)).toBe("#ff0000");
            expect(rgbToHex(0, 255, 0)).toBe("#00ff00");
            expect(rgbToHex(0, 0, 255)).toBe("#0000ff");
        });
    });

    describe("hexToRGB()", () => {
        it("converts hex to rgb object", () => {
            expect(hexToRGB("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
            expect(hexToRGB("#00ff00")).toEqual({ r: 0, g: 255, b: 0 });
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

    /**
     * @author Alok Dangre
     * @copyright 2026 Alok Dangre
     */
    describe("format() function logic", () => {
        it("should replace simple placeholders", () => {
            const result = format("Hello {name}!", { name: "World" });
            expect(result).toBe("Hello World!");
        });

        it("should replace multiple placeholders", () => {
            const result = format("{greeting} {name}!", { greeting: "Hi", name: "User" });
            expect(result).toBe("Hi User!");
        });

        it("should handle nested property access", () => {
            const result = format("Name: {user.name}", { user: { name: "Alice" } });
            expect(result).toBe("Name: Alice");
        });

        it("should replace undefined values with empty string", () => {
            const result = format("Value: {missing}", { other: "data" });
            expect(result).toBe("Value: ");
        });

        it("should handle empty data object", () => {
            const result = format("Static text", {});
            expect(result).toBe("Static text");
        });
    });
});
