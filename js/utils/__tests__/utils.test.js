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
        hideWindow: jest.fn(),
        closeWindow: jest.fn()
    },
    server: "http://localhost/",
    onload: null,
    addEventListener: jest.fn(),
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

global.i18next = {
    language: "en",
    t: jest.fn(key => key)
};

global.base64Encode = jest.fn(str => str);

global.fetch = jest.fn();

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
    importMembers,
    changeImage,
    fnBrowserDetect,
    canvasPixelRatio,
    windowHeight,
    windowWidth,
    httpGet,
    httpPost,
    HttpRequest,
    docByClass,
    docByTagName,
    docById,
    docByName,
    docBySelector,
    getTextWidth,
    doSVG,
    isSVGEmpty,
    prepareMacroExports,
    processMacroData,
    hideDOMLabel,
    displayMsg,
    _
} = require("../utils.js");

describe("Utility Functions (logic-only)", () => {
    describe("load handler registration", () => {
        it("registers the IE check without overwriting an existing window.onload", () => {
            const existingOnload = jest.fn();
            const originalOnload = window.onload;
            const addEventListenerSpy = jest.spyOn(window, "addEventListener");

            jest.resetModules();
            window.onload = existingOnload;

            jest.isolateModules(() => {
                require("../utils.js");
            });

            expect(window.onload).toBe(existingOnload);
            expect(addEventListenerSpy).toHaveBeenCalledWith("load", expect.any(Function));

            addEventListenerSpy.mockRestore();
            window.onload = originalOnload;
        });
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

        it("handles hidden files like .env", () => {
            expect(fileBasename(".env")).toBe(".env");
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

        it("escapes &, < and >", () => {
            expect(safeSVG("<div>&</div>")).toBe("&lt;div&gt;&amp;&lt;/div&gt;");
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

        it("returns fraction only if floor is 0", () => {
            expect(mixedNumber(0.5)).toBe("1/2");
        });

        it("returns d if not number", () => {
            expect(mixedNumber("abc")).toBe("abc");
        });
    });

    describe("nearestBeat()", () => {
        it("finds nearest beat", () => {
            expect(nearestBeat(50, 8)).toEqual([4, 8]);
        });
        it("handles large numbers", () => {
            expect(nearestBeat(123.456, 8)).toEqual([10, 8]);
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

        it("handles mid range values", () => {
            expect(oneHundredToFraction(75)).toEqual([3, 4]);
            expect(oneHundredToFraction(30)).toEqual([5, 16]);
        });

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

    describe("rationalToFraction()", () => {
        it("converts float to fraction", () => {
            expect(rationalToFraction(0.5)).toEqual([1, 2]);
        });

        it("handles 0, NaN, Infinity", () => {
            expect(rationalToFraction(0)).toEqual([0, 1]);
            expect(rationalToFraction(NaN)).toEqual([0, 1]);
            expect(rationalToFraction(Infinity)).toEqual([0, 1]);
        });

        it("handles numbers greater than 1", () => {
            expect(rationalToFraction(2)).toEqual([2, 1]);
        });
    });

    describe("rgbToHex()", () => {
        it("converts rgb to hex", () => {
            expect(rgbToHex(255, 0, 0)).toBe("#ff0000");
            expect(rgbToHex(0, 255, 0)).toBe("#00ff00");
            expect(rgbToHex(0, 0, 255)).toBe("#0000ff");
        });

        it("handles zero values", () => {
            expect(rgbToHex(0, 0, 0)).toBe("#000000");
        });

        it("handles max values", () => {
            expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
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

        it("should return empty string for missing nested property", () => {
            const result = format("User: {user.age}", { user: { name: "Alice" } });
            expect(result).toBe("User: ");
        });

        it("should return original string if no placeholders exist", () => {
            const result = format("Hello world", { name: "User" });
            expect(result).toBe("Hello world");
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

        it("adds unequal denominators", () => {
            expect(rationalSum([2, 5], [1, 10])).toEqual([5, 10]);
        });

        it("handles negative + positive", () => {
            expect(rationalSum([-1, 3], [1, 3])).toEqual([0, 3]);
        });
    });
    describe("hexToRGB() without hash", () => {
        it("parses hex without #", () => {
            expect(hexToRGB("ff0000")).toEqual({ r: 255, g: 0, b: 0 });
        });
    });
    describe("closeWidgets()", () => {
        beforeEach(() => {
            window.widgetWindows = {
                hideAllWindows: jest.fn(),
                hideWindow: jest.fn(),
                closeWindow: jest.fn()
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
                hideWindow: jest.fn(),
                closeWindow: jest.fn()
            };
        });

        it("closes matching widget by name", () => {
            const mockElement = { innerHTML: "TestWidget" };

            document.getElementsByClassName = jest.fn(() => [mockElement]);

            closeBlkWidgets("TestWidget");

            expect(window.widgetWindows.closeWindow).toHaveBeenCalledWith("TestWidget");
        });

        it("does nothing if no match found", () => {
            document.getElementsByClassName = jest.fn(() => [{ innerHTML: "OtherWidget" }]);

            closeBlkWidgets("TestWidget");

            expect(window.widgetWindows.closeWindow).not.toHaveBeenCalled();
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

        afterAll(() => {
            delete global.TestNamespace;
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
        it("returns undefined for empty string", () => {
            expect(resolveObject("")).toBeUndefined();
        });
        it("returns undefined for boolean input", () => {
            expect(resolveObject(true)).toBeUndefined();
        });
        it("returns undefined for object input", () => {
            expect(resolveObject({})).toBeUndefined();
        });
        it("returns undefined when null encountered in path", () => {
            global.TestNull = { A: null };
            expect(resolveObject("TestNull.A.B")).toBeUndefined();
            delete global.TestNull;
        });
        it("returns undefined and warns if an error occurs during resolution", () => {
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

            const originalSplit = String.prototype.split;
            String.prototype.split = () => {
                throw new Error("forced error");
            };
            expect(resolveObject("Any.Path")).toBeUndefined();
            expect(warnSpy).toHaveBeenCalled();
            String.prototype.split = originalSplit;
            warnSpy.mockRestore();
        });
    });
    describe("delayExecution()", () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });
        afterEach(() => {
            jest.useRealTimers();
        });
        it("resolves after the specified duration", async () => {
            const promise = delayExecution(1000);
            jest.advanceTimersByTime(1000);
            await expect(promise).resolves.toBe(true);
        });
        it("does not resolve before duration", async () => {
            const promise = delayExecution(1000);

            let resolved = false;
            promise.then(() => {
                resolved = true;
            });
            jest.advanceTimersByTime(500);
            await Promise.resolve();
            expect(resolved).toBe(false);
            jest.advanceTimersByTime(500);
        });
        it("resolves immediately when duration is 0", async () => {
            const promise = delayExecution(0);
            jest.advanceTimersByTime(0);
            await expect(promise).resolves.toBe(true);
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

        afterAll(() => {
            delete global.TestController;
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

describe("_() i18n translation", () => {
    let getItemSpy;

    beforeEach(() => {
        i18next.language = "en";
        i18next.t.mockReset();
        i18next.t.mockImplementation(key => key);
        getItemSpy = jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    });

    afterEach(() => {
        getItemSpy.mockRestore();
    });

    it("returns empty string for falsy input", () => {
        expect(_("")).toBe("");
        expect(_(null)).toBe("");
        expect(_(undefined)).toBe("");
    });

    it("returns translated text for non-Japanese language", () => {
        i18next.t.mockImplementation(() => "translated");
        expect(_("hello")).toBe("translated");
    });

    it("returns original text when translation returns empty string", () => {
        i18next.t.mockImplementation(() => "");
        expect(_("hello")).toBe("hello");
    });

    it("returns original text when i18next throws", () => {
        i18next.t.mockImplementation(() => {
            throw new Error("i18next failure");
        });
        expect(_("hello")).toBe("hello");
    });

    it("resolves Japanese kanji translation when lang is ja", () => {
        i18next.language = "ja";
        getItemSpy.mockReturnValue("kanji");
        i18next.t.mockReturnValue({ kanji: "漢字テキスト", kana: "かなテキスト" });
        expect(_("test")).toBe("漢字テキスト");
    });

    it("resolves Japanese kana translation when preference is kana", () => {
        i18next.language = "ja";
        getItemSpy.mockReturnValue("kana");
        i18next.t.mockReturnValue({ kanji: "漢字テキスト", kana: "かなテキスト" });
        expect(_("test")).toBe("かなテキスト");
    });

    it("defaults to kanji when kanaPreference is not set", () => {
        i18next.language = "ja-JP";
        getItemSpy.mockReturnValue(null);
        i18next.t.mockReturnValue({ kanji: "漢字", kana: "かな" });
        expect(_("test")).toBe("漢字");
    });

    it("returns key when Japanese translation object lacks the script key", () => {
        i18next.language = "ja";
        getItemSpy.mockReturnValue("kanji");
        i18next.t.mockReturnValue({ other: "value" });
        expect(_("test")).toBe("test");
    });

    it("returns string translation directly for Japanese when result is a string", () => {
        i18next.language = "ja";
        getItemSpy.mockReturnValue("kanji");
        i18next.t.mockReturnValue("simple string");
        expect(_("test")).toBe("simple string");
    });

    it("returns key when Japanese translation returns non-object non-string", () => {
        i18next.language = "ja";
        getItemSpy.mockReturnValue("kanji");
        i18next.t.mockReturnValue(null);
        expect(_("test")).toBe("test");
    });

    it("passes options to i18next.t for non-Japanese", () => {
        i18next.language = "fr";
        i18next.t.mockReturnValue("bonjour");
        _("hello", { ns: "custom" });
        expect(i18next.t).toHaveBeenCalledWith("hello", { ns: "custom" });
    });
});

describe("format() additional branches", () => {
    it("resolves {_item} placeholders using the _ translation function", () => {
        i18next.language = "en";
        i18next.t.mockImplementation(key => key.toUpperCase());
        const result = format("Label: {_greeting}", {});
        expect(result).toBe("Label: GREETING");
    });
});

describe("fnBrowserDetect()", () => {
    const originalUserAgent = navigator.userAgent;

    afterEach(() => {
        Object.defineProperty(navigator, "userAgent", {
            value: originalUserAgent,
            configurable: true
        });
    });

    it("detects Chrome", () => {
        Object.defineProperty(navigator, "userAgent", {
            value: "Mozilla/5.0 Chrome/120.0",
            configurable: true
        });
        expect(fnBrowserDetect()).toBe("chrome");
    });

    it("detects Firefox", () => {
        Object.defineProperty(navigator, "userAgent", {
            value: "Mozilla/5.0 Firefox/121.0",
            configurable: true
        });
        expect(fnBrowserDetect()).toBe("firefox");
    });

    it("detects Safari", () => {
        Object.defineProperty(navigator, "userAgent", {
            value: "Mozilla/5.0 Safari/605.1.15",
            configurable: true
        });
        expect(fnBrowserDetect()).toBe("safari");
    });

    it("detects Opera", () => {
        Object.defineProperty(navigator, "userAgent", {
            value: "Mozilla/5.0 OPR/106.0",
            configurable: true
        });
        expect(fnBrowserDetect()).toBe("opera");
    });

    it("detects Edge", () => {
        Object.defineProperty(navigator, "userAgent", {
            value: "Mozilla/5.0 Edg/120.0",
            configurable: true
        });
        expect(fnBrowserDetect()).toBe("edge");
    });

    it("returns fallback for unknown browsers", () => {
        Object.defineProperty(navigator, "userAgent", {
            value: "CustomBot/1.0",
            configurable: true
        });
        expect(fnBrowserDetect()).toBe("No browser detection");
    });
});

describe("canvasPixelRatio()", () => {
    it("returns the ratio of device pixel ratio to backing store ratio", () => {
        window.devicePixelRatio = 2;
        document.querySelector = jest.fn(() => ({
            getContext: jest.fn(() => ({
                backingStorePixelRatio: 1
            }))
        }));
        expect(canvasPixelRatio()).toBe(2);
    });

    it("falls back to 1 when devicePixelRatio is undefined", () => {
        const saved = window.devicePixelRatio;
        window.devicePixelRatio = undefined;
        document.querySelector = jest.fn(() => ({
            getContext: jest.fn(() => ({}))
        }));
        expect(canvasPixelRatio()).toBe(1);
        window.devicePixelRatio = saved;
    });
});

describe("windowHeight()", () => {
    const originalUserAgent = navigator.userAgent;

    afterEach(() => {
        Object.defineProperty(navigator, "userAgent", {
            value: originalUserAgent,
            configurable: true
        });
    });

    it("returns outerHeight on Android", () => {
        Object.defineProperty(navigator, "userAgent", {
            value: "Android 13; Pixel 7",
            configurable: true
        });
        expect(windowHeight()).toBe(window.outerHeight);
    });

    it("returns innerHeight on non-Android", () => {
        Object.defineProperty(navigator, "userAgent", {
            value: "NodeTest",
            configurable: true
        });
        expect(windowHeight()).toBe(window.innerHeight);
    });
});

describe("windowWidth()", () => {
    const originalUserAgent = navigator.userAgent;

    afterEach(() => {
        Object.defineProperty(navigator, "userAgent", {
            value: originalUserAgent,
            configurable: true
        });
    });

    it("returns outerWidth on Android", () => {
        Object.defineProperty(navigator, "userAgent", {
            value: "Android 13; Pixel 7",
            configurable: true
        });
        expect(windowWidth()).toBe(window.outerWidth);
    });

    it("returns innerWidth on non-Android", () => {
        Object.defineProperty(navigator, "userAgent", {
            value: "NodeTest",
            configurable: true
        });
        expect(windowWidth()).toBe(window.innerWidth);
    });
});

describe("httpGet()", () => {
    const savedServer = window.server;

    beforeEach(() => {
        fetch.mockReset();
        window.server = "http://localhost/";
    });

    afterEach(() => {
        window.server = savedServer;
    });

    it("fetches from server with project name", async () => {
        fetch.mockResolvedValue({ ok: true, text: () => Promise.resolve("data") });
        const result = await httpGet("myproject");
        expect(fetch).toHaveBeenCalledWith("http://localhost/myproject", expect.any(Object));
        expect(result).toBe("data");
    });

    it("fetches from base server URL when project is null", async () => {
        fetch.mockResolvedValue({ ok: true, text: () => Promise.resolve("root") });
        await httpGet(null);
        expect(fetch).toHaveBeenCalledWith("http://localhost/", expect.any(Object));
    });

    it("throws on non-ok response", async () => {
        fetch.mockResolvedValue({ ok: false, status: 500 });
        await expect(httpGet("bad")).rejects.toThrow("Error from server");
    });
});

describe("httpPost()", () => {
    const savedServer = window.server;

    beforeEach(() => {
        fetch.mockReset();
        window.server = "http://localhost/";
    });

    afterEach(() => {
        window.server = savedServer;
    });

    it("posts data to server", async () => {
        fetch.mockResolvedValue({ ok: true, text: () => Promise.resolve("ok") });
        const result = await httpPost("project", "payload");
        expect(fetch).toHaveBeenCalledWith(
            "http://localhost/project",
            expect.objectContaining({ method: "POST", body: "payload" })
        );
        expect(result).toBe("ok");
    });

    it("throws on non-ok response", async () => {
        fetch.mockResolvedValue({ ok: false, status: 403 });
        await expect(httpPost("project", "data")).rejects.toThrow("Error from server");
    });
});

describe("HttpRequest()", () => {
    it("creates a request with handler and url", () => {
        const handler = jest.fn();
        const req = new HttpRequest("http://example.com", handler);
        expect(req.url).toBe("http://example.com");
        expect(req.handler).toBe(handler);
    });

    it("sets localmode for file protocol", () => {
        global.self = { location: { href: "file:///index.html" }, console: console };
        const req = new HttpRequest("http://example.com", jest.fn());
        expect(req.localmode).toBe(true);
    });

    it("stores optional user callback", () => {
        const cb = jest.fn();
        const req = new HttpRequest("http://example.com", jest.fn(), cb);
        expect(req.userCallback).toBe(cb);
    });

    it("calls userCallback on network error", () => {
        const userCb = jest.fn();
        global.XMLHttpRequest = class {
            open() {
                throw new Error("network");
            }
        };
        const req = new HttpRequest("http://bad.com", jest.fn(), userCb);
        expect(userCb).toHaveBeenCalledWith(false, "network error");
        expect(req.request).toBeNull();

        global.XMLHttpRequest = class {
            open() {}
            setRequestHeader() {}
            send() {}
        };
    });
});

describe("DOM query helpers", () => {
    beforeEach(() => {
        document.getElementById = jest.fn(() => null);
        document.getElementsByClassName = jest.fn(() => []);
        document.getElementsByTagName = jest.fn(() => []);
        document.getElementsByName = jest.fn(() => []);
        document.querySelector = jest.fn(() => null);
    });

    it("docById delegates to getElementById", () => {
        docById("test");
        expect(document.getElementById).toHaveBeenCalledWith("test");
    });

    it("docByClass delegates to getElementsByClassName", () => {
        docByClass("myClass");
        expect(document.getElementsByClassName).toHaveBeenCalledWith("myClass");
    });

    it("docByTagName delegates to getElementsByTagName", () => {
        docByTagName("div");
        expect(document.getElementsByTagName).toHaveBeenCalledWith("div");
    });

    it("docByName delegates to getElementsByName", () => {
        docByName("field");
        expect(document.getElementsByName).toHaveBeenCalledWith("field");
    });

    it("docBySelector delegates to querySelector", () => {
        docBySelector("#app > .main");
        expect(document.querySelector).toHaveBeenCalledWith("#app > .main");
    });
});

describe("getTextWidth()", () => {
    it("measures text width using canvas context", () => {
        document.createElement = jest.fn(() => ({
            getContext: jest.fn(() => ({
                font: "",
                measureText: () => ({ width: 100 })
            }))
        }));
        expect(getTextWidth("hello", "16px Arial")).toBe(100);
    });
});

describe("changeImage()", () => {
    it("replaces image source with the new SVG", () => {
        const from = "<svg>old</svg>";
        const to = "<svg>new</svg>";
        const oldSrc = "data:image/svg+xml;base64," + window.btoa(from);
        const newSrc = "data:image/svg+xml;base64," + window.btoa(to);
        const img = { src: oldSrc };
        changeImage(img, from, to);
        expect(img.src).toBe(newSrc);
    });
});

describe("doSVG()", () => {
    it("returns SVG string when turtles have output", () => {
        const turtles = {
            turtleList: { 0: {} },
            getTurtle: jest.fn(() => ({
                painter: {
                    closeSVG: jest.fn(),
                    svgOutput: "<circle/>"
                }
            }))
        };
        const logo = { svgOutput: "<rect/>" };
        const result = doSVG({}, logo, turtles, 800, 600, 1);
        expect(result).toContain("<svg");
        expect(result).toContain("<rect/>");
        expect(result).toContain("<circle/>");
        expect(result).toContain("</svg>");
    });

    it("returns empty string when turtle SVG is empty", () => {
        const turtles = {
            turtleList: { 0: {} },
            getTurtle: jest.fn(() => ({
                painter: {
                    closeSVG: jest.fn(),
                    svgOutput: ""
                }
            }))
        };
        const logo = { svgOutput: "<rect/>" };
        expect(doSVG({}, logo, turtles, 800, 600, 1)).toBe("");
    });
});

describe("isSVGEmpty()", () => {
    it("returns true when all turtles have empty SVG output", () => {
        const turtles = {
            turtleList: { 0: {}, 1: {} },
            getTurtle: jest.fn(() => ({
                painter: { closeSVG: jest.fn(), svgOutput: "" }
            }))
        };
        expect(isSVGEmpty(turtles)).toBe(true);
    });

    it("returns false when any turtle has SVG output", () => {
        const outputs = ["<line/>", ""];
        let callCount = 0;
        const turtles = {
            turtleList: { 0: {}, 1: {} },
            getTurtle: jest.fn(() => ({
                painter: {
                    closeSVG: jest.fn(),
                    svgOutput: outputs[callCount++]
                }
            }))
        };
        expect(isSVGEmpty(turtles)).toBe(false);
    });
});

describe("processMacroData()", () => {
    it("parses macro JSON and adds entries to the dictionary", () => {
        const macroDict = {};
        const palettes = {
            add: jest.fn(),
            makePalettes: jest.fn()
        };
        const blocks = { addToMyPalette: jest.fn() };
        const data = JSON.stringify({ myMacro: [[0, "start", 100, 100, [null, 1]]] });
        processMacroData(data, palettes, blocks, macroDict);
        expect(macroDict.myMacro).toBeDefined();
        expect(palettes.add).toHaveBeenCalledWith("myblocks", "black", "#a0a0a0");
        expect(blocks.addToMyPalette).toHaveBeenCalled();
        expect(palettes.makePalettes).toHaveBeenCalledWith(1);
    });

    it("does nothing when macroData is undefined", () => {
        const macroDict = {};
        const palettes = { add: jest.fn(), makePalettes: jest.fn() };
        const blocks = { addToMyPalette: jest.fn() };
        processMacroData(undefined, palettes, blocks, macroDict);
        expect(palettes.add).not.toHaveBeenCalled();
    });

    it("does nothing when macroData is an empty object string", () => {
        const macroDict = {};
        const palettes = { add: jest.fn(), makePalettes: jest.fn() };
        const blocks = { addToMyPalette: jest.fn() };
        processMacroData("{}", palettes, blocks, macroDict);
        expect(palettes.add).not.toHaveBeenCalled();
    });

    it("handles invalid JSON gracefully", () => {
        const macroDict = {};
        const palettes = { add: jest.fn(), makePalettes: jest.fn() };
        const blocks = { addToMyPalette: jest.fn() };
        const spy = jest.spyOn(console, "debug").mockImplementation(() => {});
        processMacroData("{invalid", palettes, blocks, macroDict);
        expect(palettes.makePalettes).not.toHaveBeenCalled();
        spy.mockRestore();
    });
});

describe("prepareMacroExports()", () => {
    it("adds stack to macroDict under given name and returns JSON", () => {
        const macroDict = {};
        const stack = [[0, "start", 100, 100, [null, 1]]];
        const result = prepareMacroExports("testMacro", stack, macroDict);
        expect(macroDict.testMacro).toEqual(stack);
        expect(JSON.parse(result)).toEqual({ testMacro: stack });
    });

    it("returns existing dict as JSON when name is null", () => {
        const macroDict = { existing: [1, 2, 3] };
        const result = prepareMacroExports(null, [], macroDict);
        expect(JSON.parse(result)).toEqual({ existing: [1, 2, 3] });
    });
});

describe("hideDOMLabel()", () => {
    it("hides textLabel, numberLabel, and wheelDiv when they exist", () => {
        const textLabel = { style: { display: "block" } };
        const numberLabel = { style: { display: "block" } };
        const piemenu = { style: { display: "block" } };
        document.getElementById = jest.fn(id => {
            if (id === "textLabel") return textLabel;
            if (id === "numberLabel") return numberLabel;
            if (id === "wheelDiv") return piemenu;
            return null;
        });
        hideDOMLabel();
        expect(textLabel.style.display).toBe("none");
        expect(numberLabel.style.display).toBe("none");
        expect(piemenu.style.display).toBe("none");
    });

    it("does not throw when elements are missing", () => {
        document.getElementById = jest.fn(() => null);
        expect(() => hideDOMLabel()).not.toThrow();
    });
});

describe("displayMsg()", () => {
    it("returns undefined", () => {
        expect(displayMsg()).toBeUndefined();
    });
});

describe("importMembers() additional branches", () => {
    it("imports members using explicit className", () => {
        class ExplicitModel {
            constructor() {
                this.val = 99;
            }
            method() {
                return "explicit";
            }
        }
        global.ExplicitModel = ExplicitModel;
        class Ctrl {}
        const obj = new Ctrl();
        importMembers(obj, "ExplicitModel");
        expect(obj.val).toBe(99);
        expect(obj.method()).toBe("explicit");
        delete global.ExplicitModel;
    });

    it("passes constructor arguments to model and view", () => {
        class ArgModel {
            constructor(x) {
                this.x = x;
            }
        }
        class ArgView {
            constructor(y) {
                this.y = y;
            }
        }
        global.ArgCtrl = {
            ArgCtrlModel: ArgModel,
            ArgCtrlView: ArgView
        };
        class ArgCtrl {}
        const obj = new ArgCtrl();
        importMembers(obj, "", [10], [20]);
        expect(obj.x).toBe(10);
        expect(obj.y).toBe(20);
        delete global.ArgCtrl;
    });

    it("handles missing model or view class gracefully", () => {
        global.Lonely = {};
        class Lonely {}
        const obj = new Lonely();
        expect(() => importMembers(obj)).not.toThrow();
        delete global.Lonely;
    });
});
