describe("mb-dialog basic test", () => {
    test("should return light theme if nothing is set", () => {
        // mock localStorage
        global.localStorage = {
            getItem: jest.fn(() => null)
        };

        // mock matchMedia
        window.matchMedia = jest.fn().mockImplementation(query => ({
            matches: false
        }));

        const getPreferredTheme = () => {
            try {
                const stored = localStorage.getItem("themePreference");
                if (stored) return stored;
            } catch (e) {
                //ignore
            }

            if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
                return "dark";
            }

            return "light";
        };

        expect(getPreferredTheme()).toBe("light");
    });
});
