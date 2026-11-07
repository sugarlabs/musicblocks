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

global.clampNumber = require("../utils-logic").clampNumber;

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

        // Mock requestAnimationFrame and cancelAnimationFrame
        window.requestAnimationFrame = jest.fn().mockImplementation(cb => {
            cb();
            return 1;
        });
        window.cancelAnimationFrame = jest.fn();
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

    describe("Accessibility and Keyboard Navigation", () => {
        test("sets W3C ARIA semantics, aria-modal, and labelledby/describedby IDs for alert and prompt", () => {
            window.MBDialog.alert("Alert Message", "Alert Title");
            const alertFrame = document.querySelector(".windowFrame");
            const alertTitle = document.querySelector(".wftTitle");
            const alertMessage = alertFrame.querySelector(".wfbWidget > div");

            expect(alertFrame.getAttribute("role")).toBe("alertdialog");
            expect(alertFrame.getAttribute("aria-modal")).toBe("true");
            expect(alertFrame.getAttribute("aria-labelledby")).toBe(alertTitle.id);
            expect(alertFrame.getAttribute("aria-describedby")).toBe(alertMessage.id);
            expect(alertTitle.id).toMatch(/^mb-dialog-\d+-\d+-title$/);
            expect(alertMessage.id).toMatch(/^mb-dialog-\d+-\d+-message$/);

            // Opening prompt replaces alert
            window.MBDialog.prompt({ title: "Prompt Title", message: "Prompt Message" });
            const promptFrame = document.querySelector(".windowFrame");
            const promptTitle = document.querySelector(".wftTitle");
            const promptMessage = promptFrame.querySelector(".wfbWidget > div");

            expect(promptFrame.getAttribute("role")).toBe("dialog");
            expect(promptFrame.getAttribute("aria-modal")).toBe("true");
            expect(promptFrame.getAttribute("aria-labelledby")).toBe(promptTitle.id);
            expect(promptFrame.getAttribute("aria-describedby")).toBe(promptMessage.id);
        });

        test("moves initial focus to okButton on alert and restores focus on close", () => {
            const triggerButton = document.createElement("button");
            triggerButton.id = "triggerBtn";
            document.body.appendChild(triggerButton);
            triggerButton.focus();
            expect(document.activeElement).toBe(triggerButton);

            window.MBDialog.alert("Focus Alert");
            const okButton = document.querySelector(".confirm-button");
            expect(document.activeElement).toBe(okButton);

            okButton.click();
            expect(document.querySelector(".windowFrame")).toBeNull();
            expect(document.activeElement).toBe(triggerButton);
        });

        test("makes top-bar close button keyboard-accessible with role, tabindex, and Enter/Space activation", () => {
            const onCloseMock = jest.fn();
            window.MBDialog.alert("Accessible Close", "Title", { onClose: onCloseMock });

            const closeBtn = document.querySelector(".wftButton.close");
            expect(closeBtn.getAttribute("role")).toBe("button");
            expect(closeBtn.getAttribute("tabindex")).toBe("0");

            // Enter key activation
            const enterEvent = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
            closeBtn.dispatchEvent(enterEvent);

            expect(document.querySelector(".windowFrame")).toBeNull();
            expect(onCloseMock).toHaveBeenCalledTimes(1);

            // Re-open and test Space key activation
            window.MBDialog.alert("Space Close");
            const closeBtn2 = document.querySelector(".wftButton.close");
            const spaceEvent = new KeyboardEvent("keydown", { key: " ", bubbles: true });
            closeBtn2.dispatchEvent(spaceEvent);

            expect(document.querySelector(".windowFrame")).toBeNull();
        });

        test("intercepts Escape and stops immediate propagation so document capture handlers are not triggered", () => {
            const parentCaptureHandler = jest.fn();
            document.addEventListener("keydown", parentCaptureHandler, true);

            try {
                window.MBDialog.alert("Escape Intercept");
                expect(document.querySelector(".windowFrame")).toBeTruthy();

                const escapeEvent = new KeyboardEvent("keydown", {
                    key: "Escape",
                    bubbles: true,
                    cancelable: true
                });
                const stopImmediateSpy = jest.spyOn(escapeEvent, "stopImmediatePropagation");

                window.dispatchEvent(escapeEvent);

                expect(stopImmediateSpy).toHaveBeenCalled();
                expect(document.querySelector(".windowFrame")).toBeNull();
                expect(parentCaptureHandler).not.toHaveBeenCalled();
            } finally {
                document.removeEventListener("keydown", parentCaptureHandler, true);
            }
        });

        test("traps focus cyclically inside alert dialog on Tab and Shift+Tab", () => {
            window.MBDialog.alert("Tab Trap Alert");
            const closeBtn = document.querySelector(".wftButton.close");
            const okButton = document.querySelector(".confirm-button");

            // Initial focus is on okButton (the last focusable element in alert)
            expect(document.activeElement).toBe(okButton);

            // Tab forward from last element wraps to first element (closeBtn)
            const forwardTab = new KeyboardEvent("keydown", {
                key: "Tab",
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(forwardTab);
            expect(document.activeElement).toBe(closeBtn);

            // Shift+Tab backward from first element wraps to last element (okButton)
            const backwardTab = new KeyboardEvent("keydown", {
                key: "Tab",
                shiftKey: true,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(backwardTab);
            expect(document.activeElement).toBe(okButton);
        });

        test("traps focus cyclically inside prompt dialog across input, buttons, and close button", () => {
            window.MBDialog.prompt({ title: "Prompt Trap", message: "Enter value" });
            const closeBtn = document.querySelector(".wftButton.close");
            const input = document.querySelector("input[type='text']");
            const cancelBtn = document.querySelector(".cancel-button");
            const confirmBtn = document.querySelector(".confirm-button");

            // Focus on confirmBtn (last element)
            confirmBtn.focus();
            expect(document.activeElement).toBe(confirmBtn);

            // Tab from last element wraps to closeBtn (first element)
            const tabEvent = new KeyboardEvent("keydown", {
                key: "Tab",
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(tabEvent);
            expect(document.activeElement).toBe(closeBtn);

            // Shift+Tab from closeBtn wraps to confirmBtn (last element)
            const shiftTabEvent = new KeyboardEvent("keydown", {
                key: "Tab",
                shiftKey: true,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(shiftTabEvent);
            expect(document.activeElement).toBe(confirmBtn);
        });
    });
});
