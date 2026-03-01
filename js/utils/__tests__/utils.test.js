/* eslint-disable max-lines */
/**
 * Cleaned tests for utils.js — focused, non-duplicated.
 */

global.window = {
    btoa: str => Buffer.from(str, "utf8").toString("base64"),
    outerHeight: 600,
    outerWidth: 800,
    innerHeight: 400,
    innerWidth: 600,
    devicePixelRatio: 2,
    widgetWindows: { hideAllWindows: jest.fn(), hideWindow: jest.fn() },
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

global.self = { location: { href: "file:///" }, console: console };

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

describe("utils.js — cleaned unit tests", () => {
    describe("string / filename helpers", () => {
        test("toTitleCase: capitalizes first char", () => {
            expect(toTitleCase("hello")).toBe("Hello");
        });
        test("toTitleCase: non-string returns undefined", () => {
            expect(toTitleCase(123)).toBeUndefined();
        });

        test("fileExt: returns extension or empty", () => {
            expect(fileExt("image.png")).toBe("png");
            expect(fileExt("archive.tar.gz")).toBe("gz");
            expect(fileExt("filename")).toBe("");
            expect(fileExt(null)).toBe("");
        });

        test("fileBasename: strips last extension only", () => {
            expect(fileBasename("image.png")).toBe("image");
            expect(fileBasename("archive.tar.gz")).toBe("archive.tar");
            expect(fileBasename("filename")).toBe("filename");
            expect(fileBasename(".env")).toBe(".env");
        });

        test("last: returns final element or null", () => {
            expect(last([1, 2, 3])).toBe(3);
            expect(last([])).toBeNull();
        });

        test("safeSVG: escapes & < >", () => {
            expect(safeSVG("<div>&</div>")).toBe("&lt;div&gt;&amp;&lt;/div&gt;");
            expect(safeSVG(123)).toBe(123);
        });
    });

    describe("number formatting", () => {
        test("toFixed2: decimals preserved, integers unchanged", () => {
            expect(toFixed2(3.14159)).toBe("3.14");
            expect(toFixed2(3)).toBe("3");
            expect(toFixed2("abc")).toBe("abc");
        });

        test("mixedNumber: fractional and integer behaviour (including negative)", () => {
            expect(mixedNumber(2.25)).toBe("2 1/4");
            expect(mixedNumber(1)).toBe("1/1");
            expect(mixedNumber(2)).toBe("2/1");
            expect(mixedNumber(0)).toBe("0/1");
            expect(mixedNumber("abc")).toBe("abc");
            // negative fraction branch
            expect(mixedNumber(-1.5)).toBe("-2 1/2");
        });
    });

    describe("rational & beat helpers", () => {
        test("rationalToFraction: basic cases and edge inputs", () => {
            expect(rationalToFraction(0.5)).toEqual([1, 2]);
            expect(rationalToFraction(0)).toEqual([0, 1]);
            expect(rationalToFraction(NaN)).toEqual([0, 1]);
            expect(rationalToFraction(Infinity)).toEqual([0, 1]);
            expect(rationalToFraction(2)).toEqual([2, 1]); // >1 case
        });

        test("rationalSum: adds fractions and handles zero", () => {
            expect(rationalSum([1, 2], [1, 2])).toEqual([2, 2]);
            expect(rationalSum(0, [1, 2])).toEqual([0, 1]);
            expect(rationalSum([1, 3], [1, 6])).toEqual([3, 6]);
            expect(rationalSum(0, 0)).toEqual([0, 1]);
            expect(rationalSum([-1, 2], [1, 2])).toEqual([0, 2]);
        });

        test("nearestBeat and oneHundredToFraction quick checks", () => {
            expect(nearestBeat(50, 8)).toEqual([4, 8]);
            expect(nearestBeat(1, 8)).toEqual([0, 8]);
            expect(oneHundredToFraction(50)).toEqual([1, 2]);
            expect(oneHundredToFraction(1)).toEqual([1, 64]);
            expect(oneHundredToFraction(100)).toEqual([1, 1]);
            expect(oneHundredToFraction(97)).toEqual([97, 100]); // default branch
        });
    });

    describe("color helpers", () => {
        test("rgbToHex & hexToRGB & hex2rgb", () => {
            expect(rgbToHex(255, 0, 0)).toBe("#ff0000");
            expect(rgbToHex(0, 0, 0)).toBe("#000000");
            expect(rgbToHex(255, 255, 255)).toBe("#ffffff");

            expect(hexToRGB("#ff0000")).toEqual({ r: 255, g: 0, b: 0 });
            expect(hexToRGB("ff0000")).toEqual({ r: 255, g: 0, b: 0 });
            expect(hexToRGB("#zzz")).toBeNull();

            expect(hex2rgb("ff0000")).toBe("rgba(255,0,0,1)");
        });
    });

    describe("format function", () => {
        test("simple replacements and nested properties", () => {
            expect(format("Hello {name}!", { name: "World" })).toBe("Hello World!");
            expect(format("{greeting} {name}!", { greeting: "Hi", name: "User" })).toBe("Hi User!");
            expect(format("Name: {user.name}", { user: { name: "Alice" } })).toBe("Name: Alice");
            expect(format("Value: {missing}", { other: "data" })).toBe("Value: ");
            expect(format("Static", {})).toBe("Static");
        });

        test("numeric and null values", () => {
            expect(format("{num}", { num: 42 })).toBe("42");
            expect(format("{val}", { val: null })).toBe("null");
        });

        test("underscore placeholder fallback (calls exported `_`) - returns key when i18next missing", () => {
            // format handles {_key} by calling exported _() with 'key'
            // In test environment i18next is not defined so _() falls through and returns the input key
            expect(format("{_hello}", {})).toBe("hello");
        });
    });

    describe("timers and DOM helpers", () => {
        it("delayExecution resolves after the timeout (fake timers)", async () => {
            jest.useFakeTimers();
            const p = delayExecution(500);
            jest.advanceTimersByTime(500);
            await expect(p).resolves.toBe(true);
            jest.useRealTimers();
        });

        it("closeWidgets uses widgetWindows API", () => {
            window.widgetWindows = { hideAllWindows: jest.fn(), hideWindow: jest.fn() };
            closeWidgets();
            expect(window.widgetWindows.hideAllWindows).toHaveBeenCalled();
        });

        it("closeBlkWidgets hides matching widget", () => {
            window.widgetWindows = { hideAllWindows: jest.fn(), hideWindow: jest.fn() };
            document.getElementsByClassName = jest.fn(() => [{ innerHTML: "X" }]);
            closeBlkWidgets("X");
            expect(window.widgetWindows.hideWindow).toHaveBeenCalledWith("X");
        });

        it("closeBlkWidgets does nothing when no match", () => {
            window.widgetWindows = { hideAllWindows: jest.fn(), hideWindow: jest.fn() };
            document.getElementsByClassName = jest.fn(() => [{ innerHTML: "Other" }]);
            closeBlkWidgets("NoMatch");
            expect(window.widgetWindows.hideWindow).not.toHaveBeenCalled();
        });
    });

    describe("object resolution & importMembers", () => {
        beforeAll(() => {
            global.TestNamespace = { Sub: { value: 42 } };
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
            global.TestController = {
                TestControllerModel: DummyModel,
                TestControllerView: DummyView
            };
        });

        test("resolveObject resolves nested path and handles invalid inputs", () => {
            expect(resolveObject("TestNamespace.Sub.value")).toBe(42);
            expect(resolveObject("No.Such.Path")).toBeUndefined();
            expect(resolveObject(null)).toBeUndefined();
            expect(resolveObject(123)).toBeUndefined();
        });

        test("resolveObject warns and returns undefined on unexpected error", () => {
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
            const originalSplit = String.prototype.split;
            // force an error during resolution by making split throw
            String.prototype.split = () => {
                throw new Error("forced error");
            };
            expect(resolveObject("Any.Path")).toBeUndefined();
            expect(warnSpy).toHaveBeenCalled();
            // restore
            String.prototype.split = originalSplit;
            warnSpy.mockRestore();
        });

        test("importMembers copies model/view members onto object", () => {
            class TestController {}
            const obj = new TestController();
            importMembers(obj);
            expect(obj.modelVar).toBe(10);
            expect(obj.viewVar).toBe(20);
            expect(obj.modelMethod()).toBe("model");
            expect(obj.viewMethod()).toBe("view");
        });

        test("importMembers with explicit className imports that class only", () => {
            // create a simple constructor and attach to global namespace
            class Solo {
                constructor() {
                    this.soloVar = 5;
                }
                soloMethod() {
                    return "solo";
                }
            }
            global.Solo = Solo;

            class Host {}
            const host = new Host();
            // pass className so importMembers resolves Solo and adds members
            importMembers(host, "Solo");
            expect(host.soloVar).toBe(5);
            expect(host.soloMethod()).toBe("solo");

            // cleanup
            delete global.Solo;
        });
    });
});
