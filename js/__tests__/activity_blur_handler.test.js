const fs = require("fs");
const path = require("path");
const vm = require("vm");

const loadActivity = ({ isMusicBlocks = true, isMozilla = false } = {}) => {
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
        jQuery: {
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
});
