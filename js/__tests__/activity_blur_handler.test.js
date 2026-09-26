const fs = require("fs");
const path = require("path");
const vm = require("vm");

const loadActivity = ({
    isMusicBlocks = true,
    isMozilla = false,
    jQueryBrowserUndefined = false
} = {}) => {
    const activityPath = path.resolve(__dirname, "../activity.js");
    let code = fs.readFileSync(activityPath, "utf8");

    const splitPoint = code.indexOf("const activity = new Activity();");
    if (splitPoint !== -1) {
        code = code.substring(0, splitPoint);
    }

    code = code.replace(
        "const _THIS_IS_MUSIC_BLOCKS_ = true;",
        `const _THIS_IS_MUSIC_BLOCKS_ = ${isMusicBlocks};`
    );

    code = code.replace(/constructor\s*\(\)\s*\{/, "constructor() { this._listeners = []; return;");

    const sandbox = {
        window: global.window,
        document: global.document,
        console: global.console,
        _: key => key,
        define: () => {},
        require: () => {},
        setTimeout,
        createjs: {},
        jQuery: jQueryBrowserUndefined
            ? {}
            : {
                  browser: {
                      mozilla: isMozilla
                  }
              },
        Turtles: class {},
        Palettes: class {},
        Blocks: class {},
        Logo: class {},
        LanguageBox: class {},
        ThemeBox: class {},
        SaveInterface: class {},
        StatsWindow: class {},
        Trashcan: class {},
        PasteBox: class {},
        HelpWidget: class {},
        globalActivity: null,
        LEADING: 0,
        MYDEFINES: []
    };

    code += "\nthis.Activity = Activity;";

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    return sandbox.Activity;
};

describe("Activity blur handler setup", () => {
    const originalOnBlur = window.onblur;

    afterEach(() => {
        window.onblur = originalOnBlur;
        jest.clearAllMocks();
    });

    test("uses a tracked blur listener in Music Blocks without overwriting window.onblur", () => {
        const Activity = loadActivity({ isMusicBlocks: true, isMozilla: false });
        const activity = new Activity();
        const existingBlurHandler = jest.fn();
        const stopHandler = jest.fn();

        window.onblur = existingBlurHandler;
        activity.setupWindowBlurHandler(stopHandler);

        expect(window.onblur).toBe(existingBlurHandler);
        expect(activity._listeners).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    target: window,
                    type: "blur",
                    listener: expect.any(Function)
                })
            ])
        );

        activity._listeners[0].listener();

        expect(stopHandler).toHaveBeenCalledWith(activity, true);
    });

    test("uses a tracked blur listener for Turtle Blocks without overwriting window.onblur", () => {
        const Activity = loadActivity({ isMusicBlocks: false, isMozilla: false });
        const activity = new Activity();
        const existingBlurHandler = jest.fn();
        const stopHandler = jest.fn();

        window.onblur = existingBlurHandler;
        activity.setupWindowBlurHandler(stopHandler);

        expect(window.onblur).toBe(existingBlurHandler);
        expect(activity._listeners).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    target: window,
                    type: "blur",
                    listener: expect.any(Function)
                })
            ])
        );

        activity._listeners[0].listener();

        expect(stopHandler).toHaveBeenCalledWith(activity, true);
    });

    test("does not throw when jQuery.browser is unavailable (RequireJS timing race)", () => {
        const Activity = loadActivity({ jQueryBrowserUndefined: true });
        const activity = new Activity();
        const stopHandler = jest.fn();

        expect(() => activity.setupWindowBlurHandler(stopHandler)).not.toThrow();
        expect(activity._listeners).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    target: window,
                    type: "blur",
                    listener: expect.any(Function)
                })
            ])
        );
    });
});

/**
 * Commit 9b2d8197c guards `doBrowserCheck()` in Activity.init() the same way
 * the constructor already guards other timing-variable globals. init() is a
 * huge, browser-only method (canvas/createjs/Toolbar/Planet setup) that
 * can't be run whole under Jest, so this extracts just the guarded slice -
 * from the guard through the immediately-following setupWindowBlurHandler
 * call, so a false-positive "doesn't throw" can't hide a guard that
 * silently skipped the rest of init() too - and runs it in a fresh vm
 * context where `doBrowserCheck` is present or absent on purpose.
 */
describe("Activity.init() doBrowserCheck guard", () => {
    const START_MARKER = 'if (typeof doBrowserCheck === "function") {';
    const END_MARKER = "this.setupWindowBlurHandler(doHardStopButton);";

    const loadInitGuardSlice = (sandboxExtras = {}) => {
        const activityPath = path.resolve(__dirname, "../activity.js");
        const source = fs.readFileSync(activityPath, "utf8");
        const start = source.indexOf(START_MARKER);
        const end = source.indexOf(END_MARKER, start);
        if (start === -1 || end === -1) {
            throw new Error(
                "activity_blur_handler.test.js: could not locate the doBrowserCheck " +
                    "guard in activity.js - has commit 9b2d8197c's guard moved or changed?"
            );
        }
        const guardSlice = source.slice(start, end + END_MARKER.length);

        const sandbox = { runGuard: null, ...sandboxExtras };
        vm.createContext(sandbox);
        vm.runInContext(`runGuard = function (doHardStopButton) {\n${guardSlice}\n};`, sandbox);
        return sandbox.runGuard;
    };

    test("does not throw and still reaches setupWindowBlurHandler when doBrowserCheck is undefined", () => {
        const runGuard = loadInitGuardSlice();
        const fakeActivity = { setupWindowBlurHandler: jest.fn() };
        const stopHandler = () => {};

        expect(() => runGuard.call(fakeActivity, stopHandler)).not.toThrow();
        expect(fakeActivity.setupWindowBlurHandler).toHaveBeenCalledWith(stopHandler);
    });

    test("calls doBrowserCheck when it is available", () => {
        const doBrowserCheck = jest.fn();
        const runGuard = loadInitGuardSlice({ doBrowserCheck });
        const fakeActivity = { setupWindowBlurHandler: jest.fn() };
        const stopHandler = () => {};

        runGuard.call(fakeActivity, stopHandler);

        expect(doBrowserCheck).toHaveBeenCalledTimes(1);
        expect(fakeActivity.setupWindowBlurHandler).toHaveBeenCalledWith(stopHandler);
    });
});
