// Copyright (c) 2026 Sugar Labs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const { loadActivitySandbox } = require("./helpers/activity-vm-sandbox");

describe("Activity Constructor Environment & Preference Initialization", () => {
    let warnSpy;
    let errorSpy;

    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        document.body.className = "";
        document.body.innerHTML = "";
    });

    afterEach(() => {
        warnSpy.mockRestore();
        errorSpy.mockRestore();
        document.body.className = "";
        document.body.innerHTML = "";
        jest.clearAllMocks();
    });

    it("defines runMode getter and setter that delegates to toolbarController", () => {
        const sandbox = loadActivitySandbox();
        const { Activity } = sandbox;
        const act = new Activity();

        act.toolbarController = { runMode: "slow" };
        expect(act.runMode).toBe("slow");

        act.runMode = "fast";
        expect(act.toolbarController.runMode).toBe("fast");

        // When toolbarController is falsy, defaults to "normal"
        act.toolbarController = null;
        expect(act.runMode).toBe("normal");
        // Setting runMode when toolbarController is null should not throw
        expect(() => {
            act.runMode = "step";
        }).not.toThrow();
    });

    it("applies theme preference from storage and falls back to prefers-color-scheme matchMedia", () => {
        // Case 1: stored preference
        const mockStorage1 = { themePreference: "highcontrast" };
        const sandbox1 = loadActivitySandbox({
            overrides: {
                localStorage: mockStorage1
            }
        });
        const act1 = new sandbox1.Activity();
        expect(act1.themes).toContain("highcontrast");
        expect(document.body.classList.contains("highcontrast")).toBe(true);

        // Case 2: no stored preference, matchMedia detects dark mode
        const mockStorage2 = {};
        const sandbox2 = loadActivitySandbox({
            overrides: {
                localStorage: mockStorage2,
                window: {
                    ...global.window,
                    matchMedia: query => ({
                        matches: query.includes("dark")
                    })
                }
            }
        });
        new sandbox2.Activity();
        expect(document.body.classList.contains("dark")).toBe(true);
        expect(document.body.classList.contains("light")).toBe(false);
    });

    it("detects firstTimeUser when storage.beginnerMode is undefined, and parses boolean strings", () => {
        const mockStorage = {};
        const sandbox = loadActivitySandbox({
            overrides: {
                localStorage: mockStorage
            }
        });
        const actFirst = new sandbox.Activity();
        expect(actFirst.firstTimeUser).toBe(true);
        expect(actFirst.beginnerMode).toBe(true);

        mockStorage.beginnerMode = "false";
        const actSecond = new sandbox.Activity();
        expect(actSecond.firstTimeUser).toBe(false);
        expect(actSecond.beginnerMode).toBe(false);
    });

    it("normalizes language preference including kana and ja-kanji overrides", () => {
        const changeLanguageMock = jest.fn();
        const mockStorage = { languagePreference: "ja-kana" };
        const sandbox = loadActivitySandbox({
            overrides: {
                localStorage: mockStorage,
                i18next: {
                    changeLanguage: changeLanguageMock
                },
                normalizeLanguageCode: code => code
            }
        });

        // ja-kana preference
        new sandbox.Activity();
        expect(mockStorage.languagePreference).toBe("ja");
        expect(mockStorage.kanaPreference).toBe("kana");
        expect(changeLanguageMock).toHaveBeenCalledWith("ja");

        // ja-kanji preference
        mockStorage.languagePreference = "ja-kanji";
        new sandbox.Activity();
        expect(mockStorage.kanaPreference).toBe("kanji");

        // navigator.language fallback when languagePreference is undefined
        delete mockStorage.languagePreference;
        sandbox.navigator = {
            userAgent: "Chrome",
            language: "es-ES"
        };
        new sandbox.Activity();
        expect(changeLanguageMock).toHaveBeenCalledWith("es");
    });

    it("parses stored KeySignatureEnv correctly", () => {
        const mockStorage = { KeySignatureEnv: "G,minor,true" };
        const sandbox = loadActivitySandbox({
            overrides: {
                localStorage: mockStorage
            }
        });
        const act = new sandbox.Activity();
        expect(act.KeySignatureEnv).toEqual(["G", "minor", true]);
    });

    it("isolates and synchronizes window.platformColor between sandbox loads", () => {
        const customColor = { stopIconcolor: "blue" };
        const sandbox1 = loadActivitySandbox();
        expect(sandbox1.window.platformColor).toEqual({ stopIconcolor: "red" });

        const sandbox2 = loadActivitySandbox({
            overrides: { platformColor: customColor }
        });
        expect(sandbox2.platformColor).toEqual(customColor);
        expect(sandbox2.window.platformColor).toEqual(customColor);
    });
});
