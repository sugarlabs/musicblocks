describe("widgetWindows outside-click behavior", () => {
    beforeEach(() => {
        jest.resetModules();
        document.body.innerHTML =
            '<div id="floatingWindows"></div><canvas id="myCanvas"></canvas><nav></nav>';

        global.docById = jest.fn(id => document.getElementById(id));
        global._ = msg => msg;
        global.ManagedTimer = function () {
            this.clearAll = jest.fn();
        };

        window.widgetWindows = undefined;
        require("../widgets/widgetWindows.js");
    });

    afterEach(() => {
        jest.restoreAllMocks();
        document.body.innerHTML = "";
    });

    test("minimizes the focused window when clicking outside all open windows", () => {
        const win = window.widgetWindows.windowFor({}, "help", "help", false);
        win.takeFocus();
        win._rollButton = document.createElement("div");

        const rollupSpy = jest.spyOn(win, "_rollup").mockImplementation(() => {
            win._rolled = true;
            return win;
        });

        window.widgetWindows._handleGlobalMouseDown({
            target: document.body,
            preventDefault: jest.fn(),
            stopPropagation: jest.fn()
        });

        expect(rollupSpy).toHaveBeenCalledTimes(1);
        expect(win._rollButton.classList.contains("plus")).toBe(true);
        expect(window.widgetWindows.focused).toBeNull();
    });

    test("does not minimize the focused window when clicking inside it", () => {
        const win = window.widgetWindows.windowFor({}, "help", "help", false);
        win.takeFocus();
        win._rollButton = document.createElement("div");

        const rollupSpy = jest.spyOn(win, "_rollup").mockImplementation(() => {
            win._rolled = true;
            return win;
        });

        window.widgetWindows._handleGlobalMouseDown({
            target: win._frame,
            preventDefault: jest.fn(),
            stopPropagation: jest.fn()
        });

        expect(rollupSpy).not.toHaveBeenCalled();
        expect(window.widgetWindows.focused).toBe(win);
    });
});
