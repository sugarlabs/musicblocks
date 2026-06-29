const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { PubSub } = require("../pubsub");

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

    const recoverable = jest.fn();
    const pubsub = new PubSub();
    const sandbox = {
        ErrorHandler: {
            recoverable,
            capture: jest.fn(),
            warn: jest.fn(),
            userFacing: jest.fn()
        },
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
        MYDEFINES: [],
        setupActivityAbcParser: () => {},
        pubsub
    };

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    return { loadStart: sandbox.loadStart, recoverable, pubsub };
};

describe("Activity startup recovery", () => {
    let loadStart;
    let recoverable;
    let pubsub;

    beforeAll(() => {
        ({ loadStart, recoverable, pubsub } = loadLoadStart());
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("clears malformed session data and falls back to a clean start", async () => {
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

        expect(recoverable).toHaveBeenCalledTimes(1);
        const [errorArg, contextArg] = recoverable.mock.calls[0];
        expect(errorArg).toBeDefined();
        expect(errorArg.name).toBe("SyntaxError");
        expect(errorArg.message).toMatch(/Unexpected end of JSON input/);
        expect(contextArg).toEqual({ operation: "loadSessionData" });
        expect(recoverable).toHaveBeenCalledWith(errorArg, contextArg);
        expect(removeItem).toHaveBeenCalledWith("SESSIONCorrupt Project");
        expect(activity.justLoadStart).toHaveBeenCalledTimes(1);
        expect(activity.blocks.loadNewBlocks).not.toHaveBeenCalled();
        expect(activity.update).toBe(true);

        pubsub.emit("finishedLoading");
    });
});
