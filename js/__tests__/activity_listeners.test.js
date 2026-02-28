const fs = require("fs");
const path = require("path");
const vm = require("vm");

describe("Activity Event Listener Management", () => {
    let Activity;
    let activity;
    let target;
    let listener;

    beforeAll(() => {
        // Load activity.js manually to bypass RequireJS/Global complexity
        const activityPath = path.resolve(__dirname, "../activity.js");
        let code = fs.readFileSync(activityPath, "utf8");

        // Strip the instantiation and require calls at the end to prevent side effects
        // We look for 'const activity = new Activity();'
        const splitPoint = code.indexOf("const activity = new Activity();");
        if (splitPoint !== -1) {
            code = code.substring(0, splitPoint);
        }

        // Short-circuit the constructor to avoid dependencies
        code = code.replace(
            /constructor\s*\(\)\s*\{/,
            "constructor() { this._listeners = []; return;"
        );

        // Mock global environment required by activity.js
        const sandbox = {
            window: global.window,
            document: global.document,
            console: global.console,
            _: key => key, // Mock translation function
            define: () => {},
            require: () => {},
            setTimeout: setTimeout,
            createjs: {},

            // Mock classes instantiated in constructor
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

            // Globals
            globalActivity: null,
            _THIS_IS_MUSIC_BLOCKS_: true,
            LEADING: 0,
            MYDEFINES: []
        };

        // We need to execute the file.
        // Note: activity.js has 'export class Activity' or just 'class Activity'?
        // The file viewer showed:
        // 7833: }
        // 7835: const activity = new Activity();
        // and
        // 7845: define(MYDEFINES, compatibility => { ... });

        // So 'class Activity' IS defined in the file's top scope.
        // We can capture it by running the script in a context.

        // Expose Activity class to sandbox
        code += "\n this.Activity = Activity;";

        vm.createContext(sandbox);
        try {
            vm.runInContext(code, sandbox);
        } catch (e) {
            console.error("VM Execution Error:", e);
        }

        Activity = sandbox.Activity;
    });

    beforeEach(() => {
        if (!Activity) {
            console.error("Activity class not loaded");
            throw new Error("Could not load Activity class");
        }

        // Instantiate lightly - might need to mock constructor calls
        // Constructor does: this._listeners = []; this.prepSearchWidget(); ...
        // We might need to mock prototype methods that run in constructor to avoid side effects

        // Mock prototypes to silence constructor noise
        const originalPrep = Activity.prototype.prepSearchWidget;
        Activity.prototype.prepSearchWidget = () => {};
        Activity.prototype._create2Ddrag = () => {};
        Activity.prototype._createDrag = () => {};

        activity = new Activity();

        // Restore if needed, but for these tests we don't need them

        // Mock a DOM element as target
        target = document.createElement("div");
        listener = jest.fn();
    });

    afterEach(() => {
        activity.cleanupEventListeners();
    });

    test("should track listeners when added", () => {
        activity.addEventListener(target, "click", listener);
        expect(activity._listeners).toHaveLength(1);
        expect(activity._listeners[0]).toEqual(
            expect.objectContaining({
                target,
                type: "click",
                listener
            })
        );
    });

    test("should remove listeners from tracking when removed", () => {
        activity.addEventListener(target, "click", listener);
        activity.removeEventListener(target, "click", listener);
        expect(activity._listeners).toHaveLength(0);
    });

    test("should handle object options in removeEventListener (robust equality)", () => {
        const options1 = { capture: true };
        const options2 = { capture: true }; // Different reference, same content

        activity.addEventListener(target, "click", listener, options1);

        // Should now work due to _areOptionsEqual normalization
        activity.removeEventListener(target, "click", listener, options2);
        expect(activity._listeners).toHaveLength(0);
    });

    test("should clean up all listeners", () => {
        const listenerHit = jest.fn();
        activity.addEventListener(target, "click", listenerHit);

        activity.cleanupEventListeners();

        expect(activity._listeners).toHaveLength(0);
    });

    test("should handle boolean options vs object options", () => {
        // true === { capture: true } in our logic?
        // _areOptionsEqual logic: normalize boolean to boolean, object to !!opt.capture
        // so true -> true. { capture: true } -> true. They should match.

        activity.addEventListener(target, "click", listener, true);
        activity.removeEventListener(target, "click", listener, { capture: true });

        expect(activity._listeners).toHaveLength(0);
    });
});
