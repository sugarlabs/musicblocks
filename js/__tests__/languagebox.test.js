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
    textMsg: jest.fn(),
    refreshLanguage: jest.fn()
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

// Mock i18next
global.i18next = {
    changeLanguage: jest.fn((lang, cb) => {
        if (cb) cb(null, val => val);
    }),
    language: "enUS"
};

// Mock history.pushState
const pushStateMock = jest.fn();
Object.defineProperty(global, "window", {
    value: {
        location: {
            href: "http://localhost:3000/",
            toString: () => "http://localhost:3000/"
        },
        history: {
            pushState: pushStateMock
        }
    },
    writable: true
});

// Fix for URLSearchParams in Jest environment if needed
if (typeof URL === "undefined") {
    global.URL = require("url").URL;
}

describe("LanguageBox Class", () => {
    let languageBox;

    beforeEach(() => {
        jest.clearAllMocks();
        languageBox = new LanguageBox(mockActivity);
        // Reset window.location
        global.window.location = new URL("http://localhost:3000/");
    });

    it("should call i18next.changeLanguage when a language is selected", () => {
        languageBox.changeLanguage("es");
        expect(i18next.changeLanguage).toHaveBeenCalledWith("es", expect.any(Function));
    });

    it("should update localStorage", () => {
        languageBox.changeLanguage("es");
        expect(localStorage.setItem).toHaveBeenCalledWith("languagePreference", "es");
    });

    it("should update window.history", () => {
        languageBox.changeLanguage("es");
        expect(pushStateMock).toHaveBeenCalled();
        // Check if called with state object, empty string, and URL containing lang=es
        const urlArg = pushStateMock.mock.calls[0][2];
        expect(urlArg.toString()).toContain("lang=es");
    });

    it("should call activity.refreshLanguage", () => {
        languageBox.changeLanguage("es");
        expect(mockActivity.refreshLanguage).toHaveBeenCalled();
    });

    it("should set kana preference for Japanese", () => {
        languageBox.ja_onclick();
        expect(mockActivity.storage.kanaPreference).toBe("kanji");
        expect(i18next.changeLanguage).toHaveBeenCalledWith("ja", expect.any(Function));

        languageBox.kana_onclick();
        expect(mockActivity.storage.kanaPreference).toBe("kana");
        expect(i18next.changeLanguage).toHaveBeenCalledWith("ja", expect.any(Function));
    });

    // Test specific language click handlers
    describe("Language click handlers", () => {
        it("enUS_onclick calls changeLanguage('enUS')", () => {
            const spy = jest.spyOn(languageBox, "changeLanguage");
            languageBox.enUS_onclick();
            expect(spy).toHaveBeenCalledWith("enUS");
        });

        it("es_onclick calls changeLanguage('es')", () => {
            const spy = jest.spyOn(languageBox, "changeLanguage");
            languageBox.es_onclick();
            expect(spy).toHaveBeenCalledWith("es");
        });

        it("ja_onclick calls changeLanguage('ja', 'kanji')", () => {
            const spy = jest.spyOn(languageBox, "changeLanguage");
            languageBox.ja_onclick();
            expect(spy).toHaveBeenCalledWith("ja", "kanji");
        });
    });
});
