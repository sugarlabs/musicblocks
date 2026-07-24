/**
 * MusicBlocks v3.6.2
 *
 * @author Lavjeet Kumar Rai
 *
 * @copyright 2026 Lavjeet Kumar Rai
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

/**
 * Tests for PluginDialog
 */

global._ = msg => msg;

const { PluginDialog } = require("../plugin-dialog.js");

describe("PluginDialog", () => {
    let mockPluginChooser;
    let originalScroll;
    let originalPrompt;

    beforeEach(() => {
        // Mock scroll and prompt
        originalScroll = window.scroll;
        originalPrompt = window.prompt;
        window.scroll = jest.fn();
        window.prompt = jest.fn();

        // Create a dummy plugin chooser element
        mockPluginChooser = document.createElement("input");
        mockPluginChooser.id = "myOpenPlugin";
        mockPluginChooser.type = "file";
        document.body.appendChild(mockPluginChooser);
    });

    afterEach(() => {
        // Clean up the DOM and restore globals
        if (mockPluginChooser.parentNode) {
            mockPluginChooser.parentNode.removeChild(mockPluginChooser);
        }
        window.scroll = originalScroll;
        window.prompt = originalPrompt;
        jest.clearAllMocks();
    });

    describe("constructor and setupEventListeners", () => {
        it("initializes without options", () => {
            const dialog = new PluginDialog();
            expect(dialog.options).toEqual({});
            expect(dialog.pluginChooser).toBe(mockPluginChooser);
        });

        it("initializes with options", () => {
            const options = { someOption: true };
            const dialog = new PluginDialog(options);
            expect(dialog.options).toBe(options);
        });

        it("initializes gracefully if pluginChooser element is missing", () => {
            document.body.removeChild(mockPluginChooser);
            const dialog = new PluginDialog();
            expect(dialog.pluginChooser).toBeNull();
            // Should not throw an error during setupEventListeners
        });

        it("click event resets value and scrolls to 0,0", () => {
            const dialog = new PluginDialog();
            // Set up a mock for value setter, as jsdom restricts setting value on type="file"
            Object.defineProperty(mockPluginChooser, "value", {
                get: jest.fn().mockReturnValue("some/path"),
                set: jest.fn(),
                configurable: true
            });

            // Using dispatchEvent to trigger the click listener
            const clickEvent = new Event("click");
            // Mock currentTarget
            Object.defineProperty(clickEvent, "currentTarget", {
                value: mockPluginChooser
            });

            mockPluginChooser.dispatchEvent(clickEvent);

            expect(window.scroll).toHaveBeenCalledWith(0, 0);

            // Check that the set method of the mock value descriptor was called with empty string
            const valueSetter = Object.getOwnPropertyDescriptor(mockPluginChooser, "value").set;
            expect(valueSetter).toHaveBeenCalledWith("");
        });

        it("change event scrolls to 0,0 and triggers onFileSelected if a file is present", () => {
            const onFileSelected = jest.fn();
            const dialog = new PluginDialog({ onFileSelected });

            // Mocking the files array on the input element
            const mockFile = new File(["dummy content"], "plugin.json", {
                type: "application/json"
            });
            Object.defineProperty(mockPluginChooser, "files", {
                value: [mockFile],
                configurable: true
            });

            const changeEvent = new Event("change");
            mockPluginChooser.dispatchEvent(changeEvent);

            expect(window.scroll).toHaveBeenCalledWith(0, 0);
            expect(onFileSelected).toHaveBeenCalledWith(mockFile);
        });

        it("change event scrolls to 0,0 but does not trigger onFileSelected if no file is present", () => {
            const onFileSelected = jest.fn();
            const dialog = new PluginDialog({ onFileSelected });

            Object.defineProperty(mockPluginChooser, "files", {
                value: [],
                configurable: true
            });

            const changeEvent = new Event("change");
            mockPluginChooser.dispatchEvent(changeEvent);

            expect(window.scroll).toHaveBeenCalledWith(0, 0);
            expect(onFileSelected).not.toHaveBeenCalled();
        });

        it("change event scrolls to 0,0 if onFileSelected is not a function", () => {
            const dialog = new PluginDialog({ onFileSelected: "not a function" });

            const mockFile = new File(["dummy content"], "plugin.json", {
                type: "application/json"
            });
            Object.defineProperty(mockPluginChooser, "files", {
                value: [mockFile],
                configurable: true
            });

            const changeEvent = new Event("change");
            mockPluginChooser.dispatchEvent(changeEvent);

            expect(window.scroll).toHaveBeenCalledWith(0, 0);
        });
    });

    describe("openPlugin", () => {
        let mockModal, mockInput, mockSubmitBtn, mockCloseBtn, mockText;

        beforeEach(() => {
            mockModal = document.createElement("div");
            mockModal.id = "pluginNameModal";
            document.body.appendChild(mockModal);

            mockText = document.createElement("div");
            mockText.id = "pluginNameText";
            document.body.appendChild(mockText);

            mockInput = document.createElement("input");
            mockInput.id = "pluginNameInput";
            document.body.appendChild(mockInput);

            mockSubmitBtn = document.createElement("button");
            mockSubmitBtn.id = "submitPluginName";
            document.body.appendChild(mockSubmitBtn);

            mockCloseBtn = document.createElement("span");
            mockCloseBtn.id = "pluginModalClose";
            document.body.appendChild(mockCloseBtn);
        });

        afterEach(() => {
            [mockModal, mockText, mockInput, mockSubmitBtn, mockCloseBtn].forEach(el => {
                if (el.parentNode) el.parentNode.removeChild(el);
            });
        });

        it("calls closeAuxToolbar with showHideAuxMenu if closeAuxToolbar is a function", () => {
            const closeAuxToolbar = jest.fn();
            const showHideAuxMenu = jest.fn();
            const dialog = new PluginDialog({ closeAuxToolbar, showHideAuxMenu });

            dialog.openPlugin();

            expect(closeAuxToolbar).toHaveBeenCalledWith(showHideAuxMenu);
        });

        it("shows the modal when opened", () => {
            const dialog = new PluginDialog();
            dialog.openPlugin();

            expect(mockModal.style.display).toBe("block");
        });

        it("does not crash if required modal elements are missing", () => {
            document.body.removeChild(mockModal);
            const dialog = new PluginDialog();

            expect(() => {
                dialog.openPlugin();
            }).not.toThrow();
        });

        it("calls onLoadBuiltIn with trimmed lowercase name on submit if input is not empty", () => {
            const onLoadBuiltIn = jest.fn();
            const dialog = new PluginDialog({ onLoadBuiltIn });

            dialog.openPlugin();
            mockInput.value = "  MyPlugin  ";
            mockSubmitBtn.onclick();

            expect(onLoadBuiltIn).toHaveBeenCalledWith("myplugin");
            expect(mockModal.style.display).toBe("none");
        });

        it("does not call onLoadBuiltIn on submit if onLoadBuiltIn is not a function", () => {
            const dialog = new PluginDialog({ onLoadBuiltIn: "not a function" });
            dialog.openPlugin();
            mockInput.value = "MyPlugin";

            const clickSpy = jest.spyOn(mockPluginChooser, "click");
            mockSubmitBtn.onclick();

            expect(clickSpy).not.toHaveBeenCalled();
        });

        it("clicks pluginChooser on submit if input is empty string", () => {
            const dialog = new PluginDialog();
            dialog.openPlugin();
            mockInput.value = "   ";

            const clickSpy = jest.spyOn(mockPluginChooser, "click");
            mockSubmitBtn.onclick();

            expect(clickSpy).toHaveBeenCalled();
        });

        it("does not crash on submit with empty input if pluginChooser is null", () => {
            document.body.removeChild(mockPluginChooser);
            const dialog = new PluginDialog();
            dialog.openPlugin();
            mockInput.value = "";

            expect(() => {
                mockSubmitBtn.onclick();
            }).not.toThrow();
        });

        it("closes the modal without side effects when close button is clicked", () => {
            const onLoadBuiltIn = jest.fn();
            const dialog = new PluginDialog({ onLoadBuiltIn });
            dialog.openPlugin();

            mockCloseBtn.onclick();

            expect(mockModal.style.display).toBe("none");
            expect(onLoadBuiltIn).not.toHaveBeenCalled();
        });
    });

    describe("deletePlugin", () => {
        it("calls onDelete if it is a function", () => {
            const onDelete = jest.fn();
            const dialog = new PluginDialog({ onDelete });

            dialog.deletePlugin();

            expect(onDelete).toHaveBeenCalled();
        });

        it("does nothing if onDelete is not a function", () => {
            const dialog = new PluginDialog({ onDelete: "not a function" });

            expect(() => {
                dialog.deletePlugin();
            }).not.toThrow();
        });
    });
});
