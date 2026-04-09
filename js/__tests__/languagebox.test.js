/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Justin Charles
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const LanguageBox = require("../languagebox");

const mockActivity = {
    storage: {
        languagePreference: "enUS",
        kanaPreference: null
    },
    textMsg: jest.fn()
};

Object.defineProperty(global, "localStorage", {
    value: {
        getItem: jest.fn(),
        setItem: jest.fn()
    },
    writable: true
});

document.querySelectorAll = jest.fn(() => []);

global._ = jest.fn(str => str);

describe("LanguageBox Class", () => {
    let languageBox;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset storage to initial state
        mockActivity.storage.languagePreference = "enUS";
        mockActivity.storage.kanaPreference = null;
        languageBox = new LanguageBox(mockActivity);
    });

    // ===== CONSTRUCTOR TESTS =====
    describe("Constructor", () => {
        it("should initialize successfully", () => {
            expect(languageBox).toBeDefined();
        });

        it("should have language property initialized", () => {
            expect(languageBox._language).toBeDefined();
        });
    });

    // ===== ONCLICK TEST =====
    describe("OnClick method", () => {
        it("should call reload method when OnClick is called", () => {
            const reloadSpy = jest.spyOn(languageBox, "reload").mockImplementation(() => {});
            languageBox.OnClick();
            expect(reloadSpy).toHaveBeenCalled();
            reloadSpy.mockRestore();
        });
    });

    // ===== HIDE METHOD - BASIC TESTS =====
    describe("hide method", () => {
        it("should display 'already set' message when the selected language is the same", () => {
            localStorage.getItem.mockReturnValue("enUS");
            mockActivity.textMsg.mockImplementation();

            languageBox._language = "enUS";
            languageBox.hide();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Music Blocks is already set to this language."
            );
        });

        it("should display the refresh message when a new language is selected", () => {
            localStorage.getItem.mockReturnValue("ja");
            mockActivity.textMsg.mockImplementation();

            languageBox._language = "enUS";
            languageBox.hide();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                expect.stringContaining("Refresh your browser to change your language preference.")
            );
        });

        it("should display the correct message when hide is called for 'ja'", () => {
            localStorage.getItem.mockReturnValue("enUS");
            mockActivity.textMsg.mockImplementation();

            languageBox._language = "ja";
            languageBox.hide();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                expect.stringContaining("言語を変えるには、ブラウザをこうしんしてください。")
            );
        });

        it("should display kana message when Japanese language is selected with kana preference", () => {
            localStorage.getItem.mockReturnValue("enUS");
            mockActivity.storage.kanaPreference = "kana";
            mockActivity.textMsg.mockImplementation();

            languageBox._language = "ja";
            languageBox.hide();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                expect.stringContaining("げんごを かえるには、ブラウザを こうしんしてください。")
            );
        });

        it("should display kanji message when Japanese language is selected with kanji preference", () => {
            localStorage.getItem.mockReturnValue("enUS");
            mockActivity.storage.kanaPreference = "kanji";
            mockActivity.textMsg.mockImplementation();

            languageBox._language = "ja-kanji";
            languageBox.hide();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                expect.stringContaining("言語を変えるには、ブラウザをこうしんしてください。")
            );
        });

        it("should handle when localStorage.getItem returns null", () => {
            localStorage.getItem.mockReturnValue(null);
            mockActivity.textMsg.mockImplementation();

            languageBox._language = "enUS";
            languageBox.hide();

            expect(mockActivity.textMsg).toHaveBeenCalled();
        });

        it("should handle French (fr) language correctly", () => {
            localStorage.getItem.mockReturnValue("enUS");
            mockActivity.textMsg.mockImplementation();

            languageBox._language = "fr";
            languageBox.hide();

            expect(mockActivity.textMsg).toHaveBeenCalled();
        });

        it("should handle German (de) language correctly", () => {
            localStorage.getItem.mockReturnValue("enUS");
            mockActivity.textMsg.mockImplementation();

            languageBox._language = "de";
            languageBox.hide();

            expect(mockActivity.textMsg).toHaveBeenCalled();
        });

        it("should call activity.textMsg exactly once per hide() call", () => {
            localStorage.getItem.mockReturnValue("enUS");
            mockActivity.textMsg.mockImplementation();

            languageBox._language = "enUS";
            languageBox.hide();

            expect(mockActivity.textMsg).toHaveBeenCalledTimes(1);
        });

        it("should attach click listeners to language links when hide is called", () => {
            const mockLinks = [{ addEventListener: jest.fn() }, { addEventListener: jest.fn() }];
            document.querySelectorAll.mockReturnValue(mockLinks);

            languageBox.hide();

            mockLinks.forEach(link => {
                expect(link.addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
            });
        });

        it("should query for language elements in the DOM", () => {
            const mockLinks = [{ addEventListener: jest.fn() }];
            document.querySelectorAll.mockReturnValue(mockLinks);

            languageBox.hide();

            expect(document.querySelectorAll).toHaveBeenCalled();
        });
    });

    // ===== LANGUAGE SELECTION TESTS =====
    describe("Language selection methods", () => {
        it("should set language to enUS and call hide when enUS_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.enUS_onclick();

            expect(languageBox._language).toBe("enUS");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to enUK and call hide when enUK_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.enUK_onclick();

            expect(languageBox._language).toBe("enUK");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ko and call hide when ko_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.ko_onclick();

            expect(languageBox._language).toBe("ko");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ja, set kanji preference, and call hide when ja_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.ja_onclick();

            expect(languageBox._language).toBe("ja-kanji");
            expect(mockActivity.storage.kanaPreference).toBe("kanji");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ja, set kana preference, and call hide when kana_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.kana_onclick();

            expect(languageBox._language).toBe("ja-kana");
            expect(mockActivity.storage.kanaPreference).toBe("kana");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to es and call hide when es_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.es_onclick();

            expect(languageBox._language).toBe("es");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to pt and call hide when pt_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.pt_onclick();

            expect(languageBox._language).toBe("pt");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to zh_CN and call hide when zhCN_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.zhCN_onclick();

            expect(languageBox._language).toBe("zh_CN");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to th and call hide when th_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.th_onclick();

            expect(languageBox._language).toBe("th");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to hi and call hide when hi_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.hi_onclick();

            expect(languageBox._language).toBe("hi");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ibo and call hide when ibo_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.ibo_onclick();

            expect(languageBox._language).toBe("ibo");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ar and call hide when ar_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.ar_onclick();

            expect(languageBox._language).toBe("ar");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to he and call hide when he_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.he_onclick();

            expect(languageBox._language).toBe("he");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to te and call hide when te_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.te_onclick();

            expect(languageBox._language).toBe("te");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ayc and call hide when ayc_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.ayc_onclick();

            expect(languageBox._language).toBe("ayc");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to quz and call hide when quz_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.quz_onclick();

            expect(languageBox._language).toBe("quz");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to gug and call hide when gug_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.gug_onclick();

            expect(languageBox._language).toBe("gug");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ur and call hide when ur_onclick is called", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.ur_onclick();

            expect(languageBox._language).toBe("ur");
            expect(hideSpy).toHaveBeenCalled();
        });
    });

    // ===== LANGUAGE PREFERENCE TESTS =====
    describe("Language preference updates", () => {
        it("should update storage.languagePreference when language changes", () => {
            jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.enUS_onclick();
            expect(mockActivity.storage.languagePreference).toBe("enUS");
        });

        it("should store kanji preference when ja_onclick is called", () => {
            jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.ja_onclick();
            expect(mockActivity.storage.kanaPreference).toBe("kanji");
        });

        it("should store kana preference when kana_onclick is called", () => {
            jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.kana_onclick();
            expect(mockActivity.storage.kanaPreference).toBe("kana");
        });
    });

    // ===== JAPANESE VARIANT HANDLING =====
    describe("Japanese kana handling", () => {
        it("should switch between ja-kanji and ja-kana correctly", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.ja_onclick();
            expect(languageBox._language).toBe("ja-kanji");
            expect(mockActivity.storage.kanaPreference).toBe("kanji");

            languageBox.kana_onclick();
            expect(languageBox._language).toBe("ja-kana");
            expect(mockActivity.storage.kanaPreference).toBe("kana");
        });
    });

    // ===== SEQUENTIAL LANGUAGE CHANGES =====
    describe("Sequential language changes", () => {
        it("should update language correctly when changing multiple times", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.enUS_onclick();
            expect(languageBox._language).toBe("enUS");

            languageBox.ja_onclick();
            expect(languageBox._language).toBe("ja-kanji");

            languageBox.es_onclick();
            expect(languageBox._language).toBe("es");

            expect(hideSpy).toHaveBeenCalledTimes(3);
        });

        it("should handle switching from Spanish to Korean and back", () => {
            const hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();

            languageBox.es_onclick();
            expect(languageBox._language).toBe("es");

            languageBox.ko_onclick();
            expect(languageBox._language).toBe("ko");

            languageBox.es_onclick();
            expect(languageBox._language).toBe("es");

            expect(hideSpy).toHaveBeenCalledTimes(3);
        });
    });
});
