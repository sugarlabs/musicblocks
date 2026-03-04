const { fnBrowserDetect, windowHeight, windowWidth } = require("../utils");
describe("Browser and Window Utilities", () => {
    const originalUserAgent = navigator.userAgent;
    const originalOuterHeight = window.outerHeight;
    const originalInnerHeight = window.innerHeight;
    const originalOuterWidth = window.outerWidth;
    const originalInnerWidth = window.innerWidth;

    afterEach(() => {
        Object.defineProperty(navigator, "userAgent", {
            value: originalUserAgent,
            configurable: true
        });

        window.outerHeight = originalOuterHeight;
        window.innerHeight = originalInnerHeight;
        window.outerWidth = originalOuterWidth;
        window.innerWidth = originalInnerWidth;
    });

    describe("fnBrowserDetect", () => {
        test("detects Chrome", () => {
            Object.defineProperty(navigator, "userAgent", {
                value: "Mozilla/5.0 Chrome/90.0",
                configurable: true
            });
            expect(fnBrowserDetect()).toBe("chrome");
        });

        test("detects Firefox", () => {
            Object.defineProperty(navigator, "userAgent", {
                value: "Mozilla/5.0 Firefox/88.0",
                configurable: true
            });
            expect(fnBrowserDetect()).toBe("firefox");
        });

        test("detects Safari", () => {
            Object.defineProperty(navigator, "userAgent", {
                value: "Mozilla/5.0 Safari/605.1.15",
                configurable: true
            });
            expect(fnBrowserDetect()).toBe("safari");
        });

        test("returns default when unknown", () => {
            Object.defineProperty(navigator, "userAgent", {
                value: "UnknownBrowser",
                configurable: true
            });
            expect(fnBrowserDetect()).toBe("No browser detection");
        });
    });

    describe("windowHeight", () => {
        test("returns outerHeight on Android", () => {
            Object.defineProperty(navigator, "userAgent", {
                value: "Android",
                configurable: true
            });

            window.outerHeight = 900;
            window.innerHeight = 700;

            expect(windowHeight()).toBe(900);
        });

        test("returns innerHeight when not Android", () => {
            Object.defineProperty(navigator, "userAgent", {
                value: "Chrome",
                configurable: true
            });

            window.outerHeight = 900;
            window.innerHeight = 700;

            expect(windowHeight()).toBe(700);
        });
    });

    describe("windowWidth", () => {
        test("returns outerWidth on Android", () => {
            Object.defineProperty(navigator, "userAgent", {
                value: "Android",
                configurable: true
            });

            window.outerWidth = 1200;
            window.innerWidth = 1000;

            expect(windowWidth()).toBe(1200);
        });

        test("returns innerWidth when not Android", () => {
            Object.defineProperty(navigator, "userAgent", {
                value: "Chrome",
                configurable: true
            });

            window.outerWidth = 1200;
            window.innerWidth = 1000;

            expect(windowWidth()).toBe(1000);
        });
    });
});