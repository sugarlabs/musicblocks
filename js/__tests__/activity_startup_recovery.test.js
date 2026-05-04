const fs = require("fs");
const path = require("path");
const vm = require("vm");

const loadLoadStart = () => {
    const activityPath = path.resolve(__dirname, "../activity.js");
    let code = fs.readFileSync(activityPath, "utf8");

    const startPoint = code.indexOf("const loadStart = async that => {");
    const endPoint = code.indexOf("        this.loadStartWrapper = async", startPoint);
    if (startPoint === -1 || endPoint === -1) {
        throw new Error("Could not locate loadStart in activity.js");
    }
    code = code.slice(startPoint, endPoint);
    code += "\nthis.loadStart = loadStart;";

    const sandbox = {
        window: global.window,
        document: global.document,
        console,
        _: key => key,
        define: () => {},
        require: () => {},
        setTimeout,
        createjs: {},
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
        _THIS_IS_MUSIC_BLOCKS_: true,
        LEADING: 0,
        MYDEFINES: []
    };

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    return sandbox.loadStart;
};

describe("Activity startup recovery", () => {
    let loadStart;

    beforeAll(() => {
        loadStart = loadLoadStart();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("clears malformed session data and falls back to a clean start", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const removeItem = jest.fn();
        const activity = {
            storage: {
                currentProject: "Corrupt Project",
                removeItem,
                ["SESSIONCorrupt Project"]: '{"broken":'
            },
            planet: null,
            sessionData: null,
            turtles: {
                running: jest.fn(() => true)
            },
            stage: {
                update: jest.fn(),
                dispatchEvent: jest.fn()
            },
            logo: {
                turtleHeaps: [],
                turtleDicts: [],
                notation: {
                    notationStaging: [],
                    notationDrumStaging: []
                }
            },
            blocks: {
                loadNewBlocks: jest.fn()
            },
            justLoadStart: jest.fn(),
            doLoadAnimation: jest.fn(),
            update: false
        };

        await loadStart(activity);

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        expect(consoleSpy.mock.calls[0][0]).toHaveProperty("name", "SyntaxError");
        expect(consoleSpy.mock.calls[0][0].message).toMatch(/Unexpected end of JSON input/);
        expect(removeItem).toHaveBeenCalledWith("SESSIONCorrupt Project");
        expect(activity.justLoadStart).toHaveBeenCalledTimes(1);
        expect(activity.blocks.loadNewBlocks).not.toHaveBeenCalled();
        expect(activity.update).toBe(true);

        document.dispatchEvent(new Event("finishedLoading"));

        consoleSpy.mockRestore();
    });
});
