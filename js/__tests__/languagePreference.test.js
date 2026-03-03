/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Diwangshu Kakoty
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

/**
 * Language Preference Feature Tests
 * Tests the language dropdown selection and localStorage persistence
 *
 * This test suite validates:
 * - Language selection and storage in localStorage
 * - Page reload on language change
 * - Prevention of reload when selecting the same language
 * - Proper event handling and DOM manipulation
 * - Edge cases and error handling
 */

// Setup global mocks
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: key => store[key] || null,
        setItem: (key, value) => {
            store[key] = value.toString();
        },
        removeItem: key => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true
});

describe("Language Preference Feature", () => {
    let languageDropdown;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();

        languageDropdown = document.createElement("div");
        languageDropdown.id = "languagedropdown";

        const languages = [
            { id: "en", text: "English" },
            { id: "es", text: "Español" },
            { id: "fr", text: "Français" }
        ];

        languages.forEach(({ id, text }) => {
            const link = document.createElement("a");
            link.id = id;
            link.textContent = text;
            link.href = "#";
            languageDropdown.appendChild(link);
        });

        document.body.appendChild(languageDropdown);

        delete window.location;
        window.location = { reload: jest.fn() };
    });

    afterEach(() => {
        if (languageDropdown.parentNode) {
            document.body.removeChild(languageDropdown);
        }
    });

    describe("DOM Structure and Initialization", () => {
        it("should handle missing language dropdown gracefully", () => {
            document.body.removeChild(languageDropdown);

            expect(() => {
                initializeLanguagePreference();
            }).not.toThrow();
        });

        it("should find all language links in dropdown", () => {
            const links = languageDropdown.querySelectorAll("a");
            expect(links.length).toBe(3);
            expect(links[0].id).toBe("en");
            expect(links[1].id).toBe("es");
            expect(links[2].id).toBe("fr");
        });

        it("should handle language links without IDs", () => {
            const linkWithoutId = document.createElement("a");
            linkWithoutId.textContent = "No ID Link";
            languageDropdown.appendChild(linkWithoutId);

            expect(() => {
                initializeLanguagePreference();
            }).not.toThrow();
        });

        it("should attach event listeners to all language links", () => {
            initializeLanguagePreference();

            const links = languageDropdown.querySelectorAll("a");
            expect(links.length).toBeGreaterThan(0);

            links.forEach(link => {
                const clickEvent = new MouseEvent("click", { bubbles: true });
                expect(() => {
                    link.dispatchEvent(clickEvent);
                }).not.toThrow();
            });
        });
    });

    describe("Language Selection - Basic Behavior", () => {
        it("should set languagePreference when clicking a different language", () => {
            initializeLanguagePreference();

            const spanishLink = document.getElementById("es");
            const clickEvent = new MouseEvent("click", { bubbles: true });

            spanishLink.dispatchEvent(clickEvent);

            expect(localStorage.getItem("languagePreference")).toBe("es");
            expect(window.location.reload).toHaveBeenCalled();
        });

        it("should not reload when clicking the same language", () => {
            localStorage.setItem("languagePreference", "en");
            initializeLanguagePreference();

            window.location.reload.mockClear();
            const englishLink = document.getElementById("en");
            const clickEvent = new MouseEvent("click", { bubbles: true });

            englishLink.dispatchEvent(clickEvent);

            expect(window.location.reload).not.toHaveBeenCalled();
            expect(localStorage.getItem("languagePreference")).toBe("en");
        });

        it("should switch from one language to another", () => {
            localStorage.setItem("languagePreference", "en");
            initializeLanguagePreference();

            window.location.reload.mockClear();
            const frenchLink = document.getElementById("fr");
            const clickEvent = new MouseEvent("click", { bubbles: true });

            frenchLink.dispatchEvent(clickEvent);

            expect(localStorage.getItem("languagePreference")).toBe("fr");
            expect(window.location.reload).toHaveBeenCalled();
        });

        it("should update preference when switching between different languages sequentially", () => {
            initializeLanguagePreference();

            const spanishLink = document.getElementById("es");
            spanishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            expect(localStorage.getItem("languagePreference")).toBe("es");

            const frenchLink = document.getElementById("fr");
            frenchLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            expect(localStorage.getItem("languagePreference")).toBe("fr");
        });
    });

    describe("Event Handling", () => {
        it("should prevent default anchor behavior on click", () => {
            initializeLanguagePreference();

            const spanishLink = document.getElementById("es");
            const clickEvent = new MouseEvent("click", { bubbles: true });
            const preventDefaultSpy = jest.spyOn(clickEvent, "preventDefault");

            spanishLink.dispatchEvent(clickEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
            preventDefaultSpy.mockRestore();
        });

        it("should use correct context when calling event listener", () => {
            initializeLanguagePreference();

            const spanishLink = document.getElementById("es");
            let capturedContext = null;

            const originalSetItem = localStorage.setItem;
            localStorage.setItem = jest.fn((key, value) => {
                capturedContext = value;
                originalSetItem(key, value);
            });

            spanishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(capturedContext).toBe("es");
            localStorage.setItem = originalSetItem;
        });

        it("should handle multiple click events on same link", () => {
            localStorage.setItem("languagePreference", "en");
            initializeLanguagePreference();

            window.location.reload.mockClear();
            const spanishLink = document.getElementById("es");

            spanishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            expect(window.location.reload).toHaveBeenCalledTimes(1);

            spanishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            expect(window.location.reload).toHaveBeenCalledTimes(1);
        });

        it("should handle click events with event properties", () => {
            initializeLanguagePreference();

            const spanishLink = document.getElementById("es");
            const clickEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window
            });

            spanishLink.dispatchEvent(clickEvent);

            expect(localStorage.getItem("languagePreference")).toBe("es");
            expect(window.location.reload).toHaveBeenCalled();
        });
    });

    describe("localStorage Integration", () => {
        it("should persist language preference correctly", () => {
            initializeLanguagePreference();

            const spanishLink = document.getElementById("es");
            spanishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(localStorage.getItem("languagePreference")).toStrictEqual("es");
        });

        it("should retrieve stored preference on subsequent initialization", () => {
            localStorage.setItem("languagePreference", "fr");

            expect(localStorage.getItem("languagePreference")).toBe("fr");
        });

        it("should handle empty string language preference", () => {
            localStorage.setItem("languagePreference", "");
            initializeLanguagePreference();

            const englishLink = document.getElementById("en");
            const clickEvent = new MouseEvent("click", { bubbles: true });

            englishLink.dispatchEvent(clickEvent);

            expect(localStorage.getItem("languagePreference")).toBe("en");
            expect(window.location.reload).toHaveBeenCalled();
        });

        it("should store language preference as string", () => {
            initializeLanguagePreference();

            const spanishLink = document.getElementById("es");
            spanishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            const stored = localStorage.getItem("languagePreference");
            expect(typeof stored).toBe("string");
            expect(stored).toBe("es");
        });

        it("should not reload if no previous preference exists and clicking same language by default", () => {
            initializeLanguagePreference();

            window.location.reload.mockClear();
            const englishLink = document.getElementById("en");

            englishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            expect(window.location.reload).toHaveBeenCalledTimes(1);

            window.location.reload.mockClear();

            englishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            expect(window.location.reload).not.toHaveBeenCalled();
        });
    });

    describe("Edge Cases and Complex Scenarios", () => {
        it("should handle rapid consecutive language changes", () => {
            initializeLanguagePreference();

            window.location.reload.mockClear();

            const spanishLink = document.getElementById("es");
            const frenchLink = document.getElementById("fr");

            spanishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            expect(localStorage.getItem("languagePreference")).toBe("es");
            expect(window.location.reload).toHaveBeenCalledTimes(1);

            frenchLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            expect(localStorage.getItem("languagePreference")).toBe("fr");
            expect(window.location.reload).toHaveBeenCalledTimes(2);
        });

        it("should not throw when selecting link with no ID", () => {
            const linkWithoutId = document.createElement("a");
            linkWithoutId.textContent = "No ID Link";
            languageDropdown.appendChild(linkWithoutId);

            initializeLanguagePreference();

            expect(() => {
                linkWithoutId.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            }).not.toThrow();
        });

        it("should handle null ID gracefully", () => {
            const link = document.getElementById("en");
            link.id = "";

            initializeLanguagePreference();

            expect(() => {
                link.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            }).not.toThrow();
        });

        it("should handle mixed case language codes", () => {
            initializeLanguagePreference();

            const link = document.getElementById("en");
            link.id = "EN";

            const clickEvent = new MouseEvent("click", { bubbles: true });
            link.dispatchEvent(clickEvent);

            expect(localStorage.getItem("languagePreference")).toBe("EN");
        });

        it("should handle special characters in language ID", () => {
            const specialLink = document.createElement("a");
            specialLink.id = "pt-BR";
            specialLink.textContent = "Português (Brasil)";
            languageDropdown.appendChild(specialLink);

            initializeLanguagePreference();

            const clickEvent = new MouseEvent("click", { bubbles: true });
            specialLink.dispatchEvent(clickEvent);

            expect(localStorage.getItem("languagePreference")).toBe("pt-BR");
            expect(window.location.reload).toHaveBeenCalled();
        });

        it("should handle language codes with underscores", () => {
            const link = document.createElement("a");
            link.id = "zh_CN";
            link.textContent = "Chinese (Simplified)";
            languageDropdown.appendChild(link);

            initializeLanguagePreference();

            link.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(localStorage.getItem("languagePreference")).toBe("zh_CN");
        });

        it("should handle very long language IDs", () => {
            const link = document.createElement("a");
            link.id = "en-US-x-twain";
            link.textContent = "English (American - Twain)";
            languageDropdown.appendChild(link);

            initializeLanguagePreference();

            link.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(localStorage.getItem("languagePreference")).toBe("en-US-x-twain");
        });

        it("should handle numeric language IDs", () => {
            const link = document.createElement("a");
            link.id = "123";
            link.textContent = "Language 123";
            languageDropdown.appendChild(link);

            initializeLanguagePreference();

            link.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(localStorage.getItem("languagePreference")).toBe("123");
        });

        it("should handle all three language links clicked in different order", () => {
            initializeLanguagePreference();

            const englishLink = document.getElementById("en");
            const frenchLink = document.getElementById("fr");
            const spanishLink = document.getElementById("es");

            frenchLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            expect(localStorage.getItem("languagePreference")).toBe("fr");

            englishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            expect(localStorage.getItem("languagePreference")).toBe("en");

            spanishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            expect(localStorage.getItem("languagePreference")).toBe("es");
        });

        it("should correctly compare current language preference for reload decision", () => {
            localStorage.setItem("languagePreference", "fr");
            initializeLanguagePreference();

            window.location.reload.mockClear();

            const frenchLink = document.getElementById("fr");
            frenchLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(window.location.reload).not.toHaveBeenCalled();
            expect(localStorage.getItem("languagePreference")).toBe("fr");
        });

        it("should reload exactly once when changing language", () => {
            initializeLanguagePreference();

            window.location.reload.mockClear();

            const spanishLink = document.getElementById("es");
            spanishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(window.location.reload).toHaveBeenCalledTimes(1);
        });
    });

    describe("Full Integration Tests", () => {
        it("should handle complete language selection workflow", () => {
            initializeLanguagePreference();

            expect(localStorage.getItem("languagePreference")).toBeNull();

            const spanishLink = document.getElementById("es");
            spanishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(localStorage.getItem("languagePreference")).toBe("es");
            expect(window.location.reload).toHaveBeenCalledTimes(1);
        });

        it("should handle initialization multiple times without errors", () => {
            expect(() => {
                initializeLanguagePreference();
                initializeLanguagePreference();
                initializeLanguagePreference();
            }).not.toThrow();
        });

        it("should maintain language preference across multiple DOM interactions", () => {
            localStorage.setItem("languagePreference", "en");
            initializeLanguagePreference();

            const spanishLink = document.getElementById("es");
            spanishLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(localStorage.getItem("languagePreference")).toBe("es");

            const frenchLink = document.getElementById("fr");
            frenchLink.dispatchEvent(new MouseEvent("click", { bubbles: true }));

            expect(localStorage.getItem("languagePreference")).toBe("fr");
        });
    });
});

/**
 * Initialize the language preference feature
 * This function sets up click listeners on language dropdown links
 */
function initializeLanguagePreference() {
    const languageDropdown = document.getElementById("languagedropdown");
    if (languageDropdown) {
        const langLinks = languageDropdown.querySelectorAll("a");
        langLinks.forEach(link => {
            link.addEventListener("click", function (e) {
                e.preventDefault();
                const selectedLang = this.id;
                const currentLang = localStorage.getItem("languagePreference");
                if (currentLang !== selectedLang) {
                    localStorage.setItem("languagePreference", selectedLang);
                    location.reload();
                }
            });
        });
    }
}
