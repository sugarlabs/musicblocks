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
        it("calls closeAuxToolbar with showHideAuxMenu if closeAuxToolbar is a function", () => {
            const closeAuxToolbar = jest.fn();
            const showHideAuxMenu = jest.fn();
            const dialog = new PluginDialog({ closeAuxToolbar, showHideAuxMenu });

            window.prompt.mockReturnValue(null);

            dialog.openPlugin();

            expect(closeAuxToolbar).toHaveBeenCalledWith(showHideAuxMenu);
        });

        it("stops execution if prompt returns null", () => {
            const onLoadBuiltIn = jest.fn();
            const dialog = new PluginDialog({ onLoadBuiltIn });

            window.prompt.mockReturnValue(null);

            const clickSpy = jest.spyOn(mockPluginChooser, "click");

            dialog.openPlugin();

            expect(onLoadBuiltIn).not.toHaveBeenCalled();
            expect(clickSpy).not.toHaveBeenCalled();
        });

        it("calls onLoadBuiltIn with trimmed lowercase name if prompt input is not empty", () => {
            const onLoadBuiltIn = jest.fn();
            const dialog = new PluginDialog({ onLoadBuiltIn });

            window.prompt.mockReturnValue("  MyPlugin  ");

            dialog.openPlugin();

            expect(onLoadBuiltIn).toHaveBeenCalledWith("myplugin");
        });

        it("does not call onLoadBuiltIn if input is not empty but onLoadBuiltIn is not a function", () => {
            const dialog = new PluginDialog({ onLoadBuiltIn: "not a function" });

            window.prompt.mockReturnValue("  MyPlugin  ");

            const clickSpy = jest.spyOn(mockPluginChooser, "click");

            dialog.openPlugin();

            expect(clickSpy).not.toHaveBeenCalled(); // Make sure it also didn't fall through to the else branch
        });

        it("clicks pluginChooser if prompt input is empty string", () => {
            const dialog = new PluginDialog();
            window.prompt.mockReturnValue("   ");

            const clickSpy = jest.spyOn(mockPluginChooser, "click");

            dialog.openPlugin();

            expect(clickSpy).toHaveBeenCalled();
        });

        it("does not crash if prompt input is empty string and pluginChooser is null", () => {
            document.body.removeChild(mockPluginChooser);
            const dialog = new PluginDialog();
            window.prompt.mockReturnValue("");

            expect(() => {
                dialog.openPlugin();
            }).not.toThrow();
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
