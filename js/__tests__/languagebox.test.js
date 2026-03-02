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
    saveLocally: jest.fn(),
    textMsg: jest.fn()
};

Object.defineProperty(global, "localStorage", {
    value: {
        getItem: jest.fn(),
        setItem: jest.fn()
    },
    writable: true
});

// Mock window.location.reload
const reloadMock = jest.fn();
Object.defineProperty(window, "location", {
    value: {
        reload: reloadMock
    },
    writable: true
});

document.querySelectorAll = jest.fn(() => []);

global._ = jest.fn(str => str);

describe("LanguageBox Class", () => {
    let languageBox;

    beforeEach(() => {
        jest.clearAllMocks();
        languageBox = new LanguageBox(mockActivity);
    });

    it("should save project, update localStorage, and reload when hide is called", () => {
        languageBox._language = "es";
        languageBox.hide();

        expect(mockActivity.saveLocally).toHaveBeenCalled();
        expect(localStorage.setItem).toHaveBeenCalledWith("languagePreference", "es");
        expect(reloadMock).toHaveBeenCalled();
    });

    it("should handle Japanese variations correctly (ja-kanji truncates to ja)", () => {
        languageBox._language = "ja-kanji";
        languageBox.hide();

        expect(mockActivity.saveLocally).toHaveBeenCalled();
        expect(localStorage.setItem).toHaveBeenCalledWith("languagePreference", "ja");
        expect(reloadMock).toHaveBeenCalled();
    });

    // Test each language selection method calls hide
    describe("Language selection methods", () => {
        let hideSpy;
        
        beforeEach(() => {
             hideSpy = jest.spyOn(languageBox, "hide").mockImplementation();
        });

        it("should set language to enUS and call hide when enUS_onclick is called", () => {
            languageBox.enUS_onclick();
            expect(languageBox._language).toBe("enUS");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to enUK and call hide when enUK_onclick is called", () => {
            languageBox.enUK_onclick();
            expect(languageBox._language).toBe("enUK");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ko and call hide when ko_onclick is called", () => {
            languageBox.ko_onclick();
            expect(languageBox._language).toBe("ko");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ja, set kanji preference, and call hide when ja_onclick is called", () => {
            languageBox.ja_onclick();
            expect(languageBox._language).toBe("ja-kanji");
            expect(mockActivity.storage.kanaPreference).toBe("kanji");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ja, set kana preference, and call hide when kana_onclick is called", () => {
            languageBox.kana_onclick();
            expect(languageBox._language).toBe("ja-kana");
            expect(mockActivity.storage.kanaPreference).toBe("kana");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to es and call hide when es_onclick is called", () => {
            languageBox.es_onclick();
            expect(languageBox._language).toBe("es");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to pt and call hide when pt_onclick is called", () => {
            languageBox.pt_onclick();
            expect(languageBox._language).toBe("pt");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to zh_CN and call hide when zhCN_onclick is called", () => {
            languageBox.zhCN_onclick();
            expect(languageBox._language).toBe("zh_CN");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to th and call hide when th_onclick is called", () => {
            languageBox.th_onclick();
            expect(languageBox._language).toBe("th");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to hi and call hide when hi_onclick is called", () => {
            languageBox.hi_onclick();
            expect(languageBox._language).toBe("hi");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ibo and call hide when ibo_onclick is called", () => {
            languageBox.ibo_onclick();
            expect(languageBox._language).toBe("ibo");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ar and call hide when ar_onclick is called", () => {
            languageBox.ar_onclick();
            expect(languageBox._language).toBe("ar");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to he and call hide when he_onclick is called", () => {
            languageBox.he_onclick();
            expect(languageBox._language).toBe("he");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to te and call hide when te_onclick is called", () => {
            languageBox.te_onclick();
            expect(languageBox._language).toBe("te");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ayc and call hide when ayc_onclick is called", () => {
            languageBox.ayc_onclick();
            expect(languageBox._language).toBe("ayc");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to quz and call hide when quz_onclick is called", () => {
            languageBox.quz_onclick();
            expect(languageBox._language).toBe("quz");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to gug and call hide when gug_onclick is called", () => {
            languageBox.gug_onclick();
            expect(languageBox._language).toBe("gug");
            expect(hideSpy).toHaveBeenCalled();
        });

        it("should set language to ur and call hide when ur_onclick is called", () => {
            languageBox.ur_onclick();
            expect(languageBox._language).toBe("ur");
            expect(hideSpy).toHaveBeenCalled();
        });
    });
});
