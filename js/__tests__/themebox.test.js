global._ = jest.fn((str) => str); 
const ThemeBox = require("../themebox");

describe("ThemeBox", () => {
    let mockActivity;
    let themeBox;

    beforeEach(() => {
        mockActivity = {
            storage: {
                themePreference: "light"
            },
            textMsg: jest.fn()
        };

        jest.spyOn(global.Storage.prototype, "getItem").mockImplementation((key) => {
            return key === "themePreference" ? "light" : null;
        });
        jest.spyOn(global.Storage.prototype, "setItem").mockImplementation(() => {});

        Object.defineProperty(window, "location", {
            value: { reload: jest.fn() },
            writable: true,
        });

        themeBox = new ThemeBox(mockActivity);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("constructor initializes theme from activity storage", () => {
        expect(themeBox._theme).toBe("light");
    });

    test("light_onclick() sets theme to light and updates preference", () => {
        themeBox.light_onclick();
        expect(themeBox._theme).toBe("light");
        expect(localStorage.getItem).toHaveBeenCalledWith("themePreference");
        expect(mockActivity.textMsg).toHaveBeenCalledWith("Music Blocks is already set to this theme.");
    });

    test("dark_onclick() sets theme to dark and updates preference", () => {
        themeBox.dark_onclick();
        expect(themeBox._theme).toBe("dark");
        expect(mockActivity.storage.themePreference).toBe("dark");
        expect(window.location.reload).toHaveBeenCalled();
    });

    test("setPreference() updates theme and reloads if different", () => {
        localStorage.getItem.mockReturnValue("dark"); // Correctly mocked now
        themeBox.light_onclick();
        expect(mockActivity.storage.themePreference).toBe("light");
        expect(window.location.reload).toHaveBeenCalled();
    });

    test("setPreference() does not reload if theme is unchanged", () => {
        themeBox.light_onclick();
        expect(window.location.reload).not.toHaveBeenCalled();
    });
});
