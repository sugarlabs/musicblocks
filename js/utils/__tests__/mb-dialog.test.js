/**
 * MusicBlocks v3.6.2
 *
 * @author eyeaadil
 *
 * @copyright 2026 eyeaadil
 *
 * @license
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

// Load the file which attaches MBDialog to window
require("../mb-dialog");

describe("MBDialog", () => {
    beforeEach(() => {
        // Clear DOM and classes before each test
        document.body.innerHTML = "";
        document.body.className = "";

        // Mock matchMedia
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: jest.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn()
            }))
        });

        // Mock localStorage
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            clear: jest.fn()
        };
        Object.defineProperty(window, "localStorage", { value: localStorageMock });
    });

    afterEach(() => {
        jest.clearAllMocks();
        // Remove left-over dialogs if any
        document.querySelectorAll(".mb-system-dialog").forEach(el => el.remove());
    });

    describe("MBDialog.alert()", () => {
        test("creates an alert dialog with message and default title", () => {
            window.MBDialog.alert("Test Alert Message");

            const overlay = document.querySelector(".mb-dialog-overlay");
            const frame = document.querySelector(".windowFrame");
            const title = document.querySelector(".wftTitle");
            const message = document.querySelector(".wfbWidget > div");
            const okButton = document.querySelector(".confirm-button");

            expect(overlay).toBeTruthy();
            expect(frame).toBeTruthy();
            expect(title.textContent).toBe("Music Blocks"); // Default title
            expect(message.textContent).toBe("Test Alert Message");
            expect(okButton).toBeTruthy();
            expect(okButton.textContent).toBe("OK");
        });

        test("creates an alert dialog with custom title and OK text", () => {
            window.MBDialog.alert("Hello", "Custom Title", { okText: "Got it" });

            expect(document.querySelector(".wftTitle").textContent).toBe("Custom Title");
            expect(document.querySelector(".confirm-button").textContent).toBe("Got it");
        });

        test("closes the dialog when OK is clicked", () => {
            const onCloseMock = jest.fn();
            window.MBDialog.alert("Message", "Title", { onClose: onCloseMock });

            expect(document.querySelector(".windowFrame")).toBeTruthy();

            const okButton = document.querySelector(".confirm-button");
            okButton.click();

            expect(document.querySelector(".windowFrame")).toBeNull();
            expect(onCloseMock).toHaveBeenCalledTimes(1);
        });

        test("closes the dialog when top-bar close button is clicked", () => {
            window.MBDialog.alert("Message");
            const closeBtn = document.querySelector(".wftButton.close");
            closeBtn.click();
            expect(document.querySelector(".windowFrame")).toBeNull();
        });

        test("closes the dialog when Escape key is pressed", () => {
            window.MBDialog.alert("Message");
            expect(document.querySelector(".windowFrame")).toBeTruthy();

            const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
            document.dispatchEvent(escapeEvent);

            expect(document.querySelector(".windowFrame")).toBeNull();
        });

        test("ignores other key presses", () => {
            window.MBDialog.alert("Message");

            const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
            document.dispatchEvent(enterEvent);

            expect(document.querySelector(".windowFrame")).toBeTruthy(); // Should still be open
        });
    });

    describe("MBDialog.prompt()", () => {
        test("creates a prompt dialog with an input field", () => {
            window.MBDialog.prompt({
                title: "Prompt Title",
                message: "Enter name",
                defaultValue: "Default Name",
                okText: "Submit",
                cancelText: "Abort"
            });

            const input = document.querySelector("input[type='text']");
            const confirmBtn = document.querySelector(".confirm-button");
            const cancelBtn = document.querySelector(".cancel-button");

            expect(input).toBeTruthy();
            expect(input.value).toBe("Default Name");
            expect(document.querySelector(".wftTitle").textContent).toBe("Prompt Title");
            expect(confirmBtn.textContent).toBe("Submit");
            expect(cancelBtn.textContent).toBe("Abort");
        });

        test("resolves the promise with input value when OK is clicked", async () => {
            const promptPromise = window.MBDialog.prompt({ defaultValue: "My Input" });

            const confirmBtn = document.querySelector(".confirm-button");
            confirmBtn.click();

            const result = await promptPromise;
            expect(result).toBe("My Input");
            expect(document.querySelector(".windowFrame")).toBeNull(); // ensures closed
        });

        test("resolves the promise with input value when Enter key is pressed in input field", async () => {
            const promptPromise = window.MBDialog.prompt({ defaultValue: "Typing..." });

            const input = document.querySelector("input[type='text']");
            const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
            input.dispatchEvent(enterEvent);

            const result = await promptPromise;
            expect(result).toBe("Typing...");
            expect(document.querySelector(".windowFrame")).toBeNull();
        });

        test("resolves with null when Cancel button is clicked", async () => {
            const promptPromise = window.MBDialog.prompt({});

            const cancelBtn = document.querySelector(".cancel-button");
            cancelBtn.click();

            const result = await promptPromise;
            expect(result).toBeNull();
        });

        test("resolves with null when Escape key is pressed", async () => {
            const promptPromise = window.MBDialog.prompt({});

            const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
            document.dispatchEvent(escapeEvent);

            const result = await promptPromise;
            expect(result).toBeNull();
        });

        test("resolves with null when top-bar close button is clicked", async () => {
            const promptPromise = window.MBDialog.prompt({});

            const closeBtn = document.querySelector(".wftButton.close");
            closeBtn.click();

            const result = await promptPromise;
            expect(result).toBeNull();
        });
    });

    describe("Theme Management", () => {
        test("uses localStorage theme preference if available", () => {
            window.localStorage.getItem.mockReturnValue("dark");
            window.MBDialog.alert("Dark Mode Test");
            expect(document.body.classList.contains("dark")).toBe(true);
        });

        test("falls back to matchMedia preferred-color-scheme if no localStorage", () => {
            window.matchMedia.mockImplementation(query => ({
                matches: query === "(prefers-color-scheme: dark)", // true for dark mode
                addListener: jest.fn(),
                removeListener: jest.fn()
            }));

            window.MBDialog.alert("Media Query Dark Mode Test");
            expect(document.body.classList.contains("dark")).toBe(true);
        });

        test("defaults to light theme if no preferences found", () => {
            window.MBDialog.alert("Light Mode Test");
            expect(document.body.classList.contains("light")).toBe(true);
        });

        test("does not override existing theme on body", () => {
            document.body.classList.add("dark");
            window.localStorage.getItem.mockReturnValue("light"); // Should ignore this

            window.MBDialog.alert("Keep Existing Theme Test");
            expect(document.body.classList.contains("dark")).toBe(true);
            expect(document.body.classList.contains("light")).toBe(false);
        });
    });

    describe("Dialog lifecycle constraints", () => {
        test("creating a new dialog removes active ones", () => {
            window.MBDialog.alert("First Alert");
            expect(document.querySelectorAll(".windowFrame").length).toBe(1);

            window.MBDialog.alert("Second Alert");
            expect(document.querySelectorAll(".windowFrame").length).toBe(1);
            expect(document.querySelector(".wfbWidget > div").textContent).toBe("Second Alert");
        });
    });

    describe("Dragging functionality", () => {
        test("allows dragging the dialog via the title bar", () => {
            window.MBDialog.alert("Draggable Alert");
            const frame = document.querySelector(".windowFrame");
            const topBar = document.querySelector(".wfTopBar");

            // Mock getBoundingClientRect
            frame.getBoundingClientRect = jest.fn(() => ({
                top: 100,
                left: 100,
                width: 300,
                height: 200
            }));

            // Mouse down on top bar
            topBar.dispatchEvent(
                new MouseEvent("mousedown", { clientX: 150, clientY: 110, bubbles: true })
            );

            // Mouse move on document
            document.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 150 }));

            // Dialog should have moved
            expect(frame.style.left).toBe("150px"); // 100 + (200 - 150)
            expect(frame.style.top).toBe("140px"); // 100 + (150 - 110)

            // Mouse up stops dragging
            document.dispatchEvent(new MouseEvent("mouseup"));

            // Subsequent moves shouldn't affect position
            document.dispatchEvent(new MouseEvent("mousemove", { clientX: 500, clientY: 500 }));
            expect(frame.style.left).toBe("150px");
        });
    });
});
