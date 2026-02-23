const fs = require("fs");
const path = require("path");
const vm = require("vm");

describe("Search Widget Listener Fix", () => {
    let activity;
    let Activity;
    let sandbox;

    beforeAll(() => {
        const activityPath = path.resolve(__dirname, "../activity.js");
        let code = fs.readFileSync(activityPath, "utf8");

        // Strip the trailing instantiation
        const splitPoint = code.indexOf("const activity = new Activity();");
        if (splitPoint !== -1) {
            code = code.substring(0, splitPoint);
        }

        const elementCache = {};
        const jQueryMock = jest.fn(() => ({
            data: jest.fn(() => false),
            autocomplete: jest.fn(),
            on: jest.fn(),
            off: jest.fn()
        }));
        jQueryMock.fn = jQueryMock;

        sandbox = {
            window: global.window,
            jQuery: jQueryMock,
            $: jQueryMock,
            document: {
                getElementById: jest.fn(id => {
                    if (elementCache[id]) return elementCache[id];

                    let el;
                    if (id === "search") {
                        el = {
                            style: { visibility: "hidden" },
                            contains: jest.fn(target => target === el),
                            focus: jest.fn(),
                            addEventListener: jest.fn(),
                            value: ""
                        };
                    } else if (id === "ui-id-1") {
                        el = {
                            style: { display: "none" },
                            contains: jest.fn(target => target === el),
                            addEventListener: jest.fn()
                        };
                    } else if (id === "myCanvas") {
                        el = { addEventListener: jest.fn() };
                    } else {
                        el = {
                            style: { visibility: "hidden", display: "none" },
                            addEventListener: jest.fn(),
                            appendChild: jest.fn(),
                            contains: jest.fn(target => target === el)
                        };
                    }
                    elementCache[id] = el;
                    return el;
                }),
                getElementsByTagName: jest.fn(name => {
                    if (name === "tr") {
                        const tr = { contains: jest.fn(() => false) };
                        return [{}, {}, tr];
                    }
                    return [];
                }),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                body: { appendChild: jest.fn() },
                querySelector: jest.fn(() => null)
            },
            console: { log: jest.fn(), debug: jest.fn(), error: jest.fn() },
            _: key => key,
            define: jest.fn(),
            require: jest.fn(),
            setTimeout: jest.fn(cb => cb()),
            setInterval: jest.fn(),
            requestAnimationFrame: jest.fn(),
            cancelAnimationFrame: jest.fn(),
            createjs: {
                Stage: class { on() { } removeAllEventListeners() { } addChild() { } getBounds() { return { x: 0, y: 0, width: 0, height: 0 }; } },
                Container: class { addChild() { } on() { } cache() { } getBounds() { return { x: 0, y: 0, width: 0, height: 0 }; } },
                Text: class { },
                Bitmap: class { },
                Ticker: { framerate: 60 }
            },
            Image: class { set src(val) { if (this.onload) this.onload(); } },
            docByClass: jest.fn(() => []),
            docById: jest.fn(id => sandbox.document.getElementById(id)),
            base64Encode: jest.fn(),
            MSGBLOCK: "",
            ERRORARTWORK: [],
            LEADING: 0,
            MYDEFINES: [],
            _THIS_IS_MUSIC_BLOCKS_: true,

            Turtles: class { constructor() { this.running = () => false; } },
            Palettes: class { constructor() { this.getSearchPos = () => [0, 0]; } },
            Blocks: class { constructor() { this.protoBlockDict = {}; } },
            Logo: class { },
            LanguageBox: class { },
            ThemeBox: class { updateThemeIcon() { } },
            SaveInterface: class { },
            StatsWindow: class { },
            Trashcan: class { },
            PasteBox: class { },
            HelpWidget: class { },
        };

        code = "const localStorage = this.localStorage;\n" +
            "const jQuery = this.jQuery;\n" +
            "const $ = this.$;\n" + code;
        code += "\n this.Activity = Activity;";

        vm.createContext(sandbox);
        vm.runInContext(code, sandbox);
        Activity = sandbox.Activity;
    });

    beforeEach(() => {
        // Suppress constructor noise
        Activity.prototype.prepSearchWidget = jest.fn();
        Activity.prototype._create2Ddrag = jest.fn();
        Activity.prototype._createDrag = jest.fn();
        Activity.prototype._createGrid = jest.fn();
        Activity.prototype._createMsgContainer = jest.fn();
        Activity.prototype._createErrorContainers = jest.fn();
        Activity.prototype._initIdleWatcher = jest.fn();

        activity = new Activity();
        activity.turtleBlocksScale = 1;

        // Fresh mocks for each instance
        activity = new Activity();
        activity.turtleBlocksScale = 1;

        // Re-inject mocks that might be overwritten or needed
        activity.searchWidget = sandbox.document.getElementById("search");
        activity.searchWidget.style.visibility = "hidden";
        activity.palettes = new sandbox.Palettes();
        activity.doSearch = jest.fn();

        sandbox.document.addEventListener.mockClear();
        sandbox.document.removeEventListener.mockClear();
    });

    test("showSearchWidget should add a mousedown listener", () => {
        try {
            activity.showSearchWidget();
        } catch (e) {
            console.error("showSearchWidget crash:", e);
            throw e;
        }

        const addCalls = sandbox.document.addEventListener.mock.calls.filter(c => c[0] === "mousedown");
        expect(addCalls.length).toBe(1);
    });

    test("showSearchWidget should NOT accumulate listeners when toggled", () => {
        activity.showSearchWidget(); // Toggles ON
        expect(sandbox.document.addEventListener.mock.calls.filter(c => c[0] === "mousedown").length).toBe(1);

        activity.showSearchWidget(); // Toggles OFF

        expect(sandbox.document.removeEventListener.mock.calls.filter(c => c[0] === "mousedown").length).toBe(1);
        // addEventListener should NOT have been called again during toggle OFF
        expect(sandbox.document.addEventListener.mock.calls.filter(c => c[0] === "mousedown").length).toBe(1);
    });

    test("hideSearchWidget should remove the listener", () => {
        activity.showSearchWidget();

        // Capture the listener added
        const listener = sandbox.document.addEventListener.mock.calls.find(c => c[0] === "mousedown")[1];

        activity.hideSearchWidget();

        expect(sandbox.document.removeEventListener).toHaveBeenCalledWith("mousedown", listener);
    });

    test("clicking inside search should NOT remove listener", () => {
        activity.showSearchWidget();
        const listener = sandbox.document.addEventListener.mock.calls.find(c => c[0] === "mousedown")[1];

        const searchElem = activity.searchWidget;
        searchElem.style.visibility = "visible";
        searchElem.contains.mockReturnValue(true);

        listener({ target: searchElem });

        // Restore mock to default behavior so it doesn't leak
        searchElem.contains.mockImplementation(target => target === searchElem);

        // Verify removeEventListener was NOT called for this listener
        const removeCalls = sandbox.document.removeEventListener.mock.calls.filter(c => c[1] === listener);
        expect(removeCalls.length).toBe(0);
    });

    test("clicking outside search SHOULD remove listener and hide widget", () => {
        activity.showSearchWidget();
        const listener = sandbox.document.addEventListener.mock.calls.find(c => c[0] === "mousedown")[1];
        const hideSpy = jest.spyOn(activity, "hideSearchWidget");

        // Clicked outside
        listener({ target: {} });

        expect(hideSpy).toHaveBeenCalled();
        expect(sandbox.document.removeEventListener).toHaveBeenCalledWith("mousedown", listener);
        hideSpy.mockRestore();
    });
});
