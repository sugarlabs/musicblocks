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
    querySelector: jest.fn(() => ({
        getContext: jest.fn(() => ({ measureText: () => ({ width: 42 }) }))
    })),
    body: { innerHTML: "" },
    createElement: jest.fn(() => ({
        getContext: jest.fn(() => ({ measureText: () => ({ width: 42 }) }))
    }))
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
    format,
    delayExecution,
    closeWidgets,
    closeBlkWidgets,
    resolveObject,
    importMembers
} = require("../utils.js");

describe("Utility Functions (logic-only)", () => {
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
        it("handles negative fraction", () => {
            expect(mixedNumber(-1.5)).toBe("-2 1/2");
        });

        it("handles zero", () => {
            expect(mixedNumber(0)).toBe("0/1");
        });
    });

    describe("nearestBeat()", () => {
        it("finds nearest beat", () => {
            expect(nearestBeat(50, 8)).toEqual([4, 8]);
        });
        it("handles large numbers", () => {
            expect(nearestBeat(123.456)).toBeDefined();
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
        describe("rgbToHex edge behavior", () => {
            it("handles zero values", () => {
                expect(rgbToHex(0, 0, 0)).toBe("#000000");
            });

            it("handles max values", () => {
                expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
            });
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
        describe("rgbToHex edge behavior", () => {
            it("handles zero values", () => {
                expect(rgbToHex(0, 0, 0)).toBe("#000000");
            });

            it("handles max values", () => {
                expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
            });
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

            it("handles numeric values", () => {
                expect(format("{num}", { num: 42 })).toBe("42");
            });

            it("handles null values", () => {
                expect(format("{val}", { val: null })).toBe("null");
            });

            it("ignores unmatched braces", () => {
                expect(format("Hello {name", { name: "A" })).toBe("Hello {name");
            });
        });
    });
    describe("fileBasename() edge cases", () => {
        it("handles hidden files like .env", () => {
            expect(fileBasename(".env")).toBe(".env");
        });
    });
    describe("safeSVG() multiple characters", () => {
        it("escapes &, < and >", () => {
            expect(safeSVG("<div>&</div>")).toBe("&lt;div&gt;&amp;&lt;/div&gt;");
        });
    });
    describe("rationalToFraction() > 1 case", () => {
        it("handles numbers greater than 1", () => {
            expect(rationalToFraction(2)).toEqual([2, 1]);
        });
    });
    describe("mixedNumber() additional cases", () => {
        it("returns fraction only if floor is 0", () => {
            expect(mixedNumber(0.5)).toBe("1/2");
        });

        it("returns d if not number", () => {
            expect(mixedNumber("abc")).toBe("abc");
        });
    });
    describe("nearestBeat() edge cases", () => {
        it("returns zero beat when very small", () => {
            expect(nearestBeat(1, 8)).toEqual([0, 8]);
        });
    });
    describe("oneHundredToFraction() more cases", () => {
        it("handles mid range values", () => {
            expect(oneHundredToFraction(75)).toEqual([3, 4]);
            expect(oneHundredToFraction(30)).toEqual([5, 16]);
        });

        it("handles default case", () => {
            expect(oneHundredToFraction(97)).toEqual([97, 100]);
        });
    });
    describe("rationalSum()", () => {
        it("adds simple fractions", () => {
            expect(rationalSum([1, 2], [1, 2])).toEqual([2, 2]);
        });

        it("handles zero input", () => {
            expect(rationalSum(0, [1, 2])).toEqual([0, 1]);
        });
        it("adds different denominators", () => {
            expect(rationalSum([1, 3], [1, 6])).toEqual([3, 6]);
        });

        it("handles both zero", () => {
            expect(rationalSum(0, 0)).toEqual([0, 1]);
        });

        it("handles negative values", () => {
            expect(rationalSum([-1, 2], [1, 2])).toEqual([0, 2]);
        });
        describe("rationalSum branch coverage", () => {
            it("adds unequal denominators", () => {
                expect(rationalSum([2, 5], [1, 10])).toEqual([5, 10]);
            });

            it("handles negative + positive", () => {
                expect(rationalSum([-1, 3], [1, 3])).toEqual([0, 3]);
            });
        });
    });
    describe("hexToRGB() without hash", () => {
        it("parses hex without #", () => {
            expect(hexToRGB("ff0000")).toEqual({ r: 255, g: 0, b: 0 });
        });
    });
    describe("oneHundredToFraction() exhaustive branch coverage", () => {
        it("handles <1", () => {
            expect(oneHundredToFraction(0)).toEqual([1, 64]);
        });

        it("handles >99", () => {
            expect(oneHundredToFraction(150)).toEqual([1, 1]);
        });

        it("handles 2", () => {
            expect(oneHundredToFraction(2)).toEqual([1, 48]);
        });

        it("handles 6-8 range", () => {
            expect(oneHundredToFraction(7)).toEqual([1, 16]);
        });

        it("handles 18-19", () => {
            expect(oneHundredToFraction(18)).toEqual([3, 16]);
        });

        it("handles 40-41", () => {
            expect(oneHundredToFraction(40)).toEqual([2, 5]);
        });

        it("handles 53-54", () => {
            expect(oneHundredToFraction(53)).toEqual([17, 32]);
        });

        it("handles 66-67", () => {
            expect(oneHundredToFraction(66)).toEqual([2, 3]);
        });

        it("handles 81-82", () => {
            expect(oneHundredToFraction(81)).toEqual([13, 16]);
        });

        it("handles 91-92", () => {
            expect(oneHundredToFraction(91)).toEqual([11, 12]);
        });

        it("handles 96", () => {
            expect(oneHundredToFraction(96)).toEqual([31, 32]);
        });

        it("handles 99", () => {
            expect(oneHundredToFraction(99)).toEqual([63, 64]);
        });

        it("handles default case", () => {
            expect(oneHundredToFraction(97)).toEqual([97, 100]);
        });
    });
    describe("delayExecution()", () => {
        jest.useFakeTimers();

        it("resolves after given duration", async () => {
            const promise = delayExecution(1000);

            jest.advanceTimersByTime(1000);

            await expect(promise).resolves.toBe(true);
        });
    });
    describe("closeWidgets()", () => {
        beforeEach(() => {
            window.widgetWindows = {
                hideAllWindows: jest.fn(),
                hideWindow: jest.fn()
            };
        });
        it("calls window.widgetWindows.hideAllWindows", () => {
            closeWidgets();
            expect(window.widgetWindows.hideAllWindows).toHaveBeenCalled();
        });
    });
    describe("closeBlkWidgets()", () => {
        beforeEach(() => {
            window.widgetWindows = {
                hideAllWindows: jest.fn(),
                hideWindow: jest.fn()
            };
        });

        it("hides matching widget by name", () => {
            const mockElement = { innerHTML: "TestWidget" };

            document.getElementsByClassName = jest.fn(() => [mockElement]);

            closeBlkWidgets("TestWidget");

            expect(window.widgetWindows.hideWindow).toHaveBeenCalledWith("TestWidget");
        });

        it("does nothing if no match found", () => {
            document.getElementsByClassName = jest.fn(() => [{ innerHTML: "OtherWidget" }]);

            closeBlkWidgets("TestWidget");

            expect(window.widgetWindows.hideWindow).not.toHaveBeenCalled();
        });
    });
    describe("resolveObject()", () => {
        beforeAll(() => {
            global.TestNamespace = {
                Sub: {
                    value: 42
                }
            };
        });

        it("resolves nested path", () => {
            expect(resolveObject("TestNamespace.Sub.value")).toBe(42);
        });

        it("returns undefined for invalid path", () => {
            expect(resolveObject("TestNamespace.Invalid.prop")).toBeUndefined();
        });

        it("returns undefined for null input", () => {
            expect(resolveObject(null)).toBeUndefined();
        });

        it("returns undefined for non-string input", () => {
            expect(resolveObject(123)).toBeUndefined();
        });
    });
    describe("importMembers()", () => {
        class DummyModel {
            constructor() {
                this.modelVar = 10;
            }

            modelMethod() {
                return "model";
            }
        }

        class DummyView {
            constructor() {
                this.viewVar = 20;
            }

            viewMethod() {
                return "view";
            }
        }

        beforeAll(() => {
            global.TestController = {
                TestControllerModel: DummyModel,
                TestControllerView: DummyView
            };
        });

        it("imports model and view members into object", () => {
            class TestController {}

            const obj = new TestController();

            importMembers(obj);

            expect(obj.modelVar).toBe(10);
            expect(obj.viewVar).toBe(20);
            expect(obj.modelMethod()).toBe("model");
            expect(obj.viewMethod()).toBe("view");
        });
    });
});
