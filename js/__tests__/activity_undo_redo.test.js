const fs = require("fs");
const path = require("path");
const vm = require("vm");

describe("UndoRedoManager regressions", () => {
    let UndoRedoManager;
    let Action;
    let MoveBlockCommand;

    beforeAll(() => {
        const activityPath = path.resolve(__dirname, "../activity.js");
        let code = fs.readFileSync(activityPath, "utf8");
        const splitPoint = code.indexOf("class Activity");
        code = code.substring(0, splitPoint);
        code += "\nthis.UndoRedoManager = UndoRedoManager;";
        code += "\nthis.Action = Action;";
        code += "\nthis.MoveBlockCommand = MoveBlockCommand;";

        const sandbox = {
            window: {},
            console,
            globalActivity: null
        };

        vm.createContext(sandbox);
        vm.runInContext(code, sandbox);

        UndoRedoManager = sandbox.UndoRedoManager;
        Action = sandbox.Action;
        MoveBlockCommand = sandbox.MoveBlockCommand;
    });

    test("extra undo after history is exhausted is a no-op", () => {
        const manager = new UndoRedoManager();
        const state = { inserted: true };

        manager.addAction(
            new Action(
                () => {
                    state.inserted = true;
                },
                () => {
                    state.inserted = false;
                },
                "Add blocks"
            )
        );

        manager.undo();
        expect(state.inserted).toBe(false);
        expect(manager.canUndo()).toBe(false);

        expect(() => manager.undo()).not.toThrow();
        expect(state.inserted).toBe(false);
        expect(manager.canRedo()).toBe(true);
    });

    test("clear removes stale history from non-user loads", () => {
        const manager = new UndoRedoManager();
        const state = { deleted: false };

        manager.addAction(
            new Action(
                () => {
                    state.deleted = true;
                },
                () => {
                    state.deleted = false;
                },
                "Delete Block"
            )
        );

        manager.clear();

        expect(manager.canUndo()).toBe(false);
        expect(manager.canRedo()).toBe(false);
        expect(() => manager.undo()).not.toThrow();
        expect(() => manager.redo()).not.toThrow();
        expect(state.deleted).toBe(false);
    });

    test("insert and delete actions still round-trip through undo and redo", () => {
        const manager = new UndoRedoManager();
        const state = { inserted: true, deleted: false };

        manager.addAction(
            new Action(
                () => {
                    state.inserted = true;
                },
                () => {
                    state.inserted = false;
                },
                "Add blocks"
            )
        );

        manager.addAction(
            new Action(
                () => {
                    state.deleted = true;
                },
                () => {
                    state.deleted = false;
                },
                "Delete Block"
            )
        );

        manager.undo();
        expect(state.deleted).toBe(false);
        manager.redo();
        expect(state.deleted).toBe(true);

        manager.undo();
        manager.undo();
        expect(state.deleted).toBe(false);
        expect(state.inserted).toBe(false);

        manager.redo();
        manager.redo();
        expect(state.inserted).toBe(true);
        expect(state.deleted).toBe(true);
    });

    test("move commands still restore original and new positions", () => {
        const block = {
            trash: false,
            container: { x: 10, y: 20 },
            connections: [null],
            isClampBlock: jest.fn(() => false),
            isExpandableBlock: jest.fn(() => false)
        };

        const blocks = {
            _isUndoingMove: false,
            _isRebuildingLayout: false,
            blockList: [block],
            clampBlocksToCheck: [],
            adjustDocks: jest.fn(),
            _cleanupStacks: jest.fn(),
            adjustExpandableClampBlock: jest.fn(),
            activity: { refreshCanvas: jest.fn() }
        };

        const manager = new UndoRedoManager();
        const command = new MoveBlockCommand(
            blocks,
            [0],
            new Map([[0, { x: 10, y: 20 }]]),
            new Map([[0, { x: 50, y: 70 }]]),
            new Map([[0, [null]]]),
            new Map([[0, [null]]]),
            new Map(),
            new Map(),
            new Map(),
            new Map()
        );

        manager.executeCommand(command);
        expect(block.container.x).toBe(50);
        expect(block.container.y).toBe(70);

        manager.undo();
        expect(block.container.x).toBe(10);
        expect(block.container.y).toBe(20);

        manager.redo();
        expect(block.container.x).toBe(50);
        expect(block.container.y).toBe(70);
    });
});
