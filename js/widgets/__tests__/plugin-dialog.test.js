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

global.platformColor = {
    headingColor: "#333",
    blueButton: "#005d9e",
    blueButtonText: "#fff"
};

const { PluginDialog } = require("../plugin-dialog.js");

describe("PluginDialog", () => {
    let mockPluginChooser;
    let originalScroll;

    beforeEach(() => {
        // Mock scroll
        originalScroll = window.scroll;
        window.scroll = jest.fn();

        // Create a dummy plugin chooser element
        mockPluginChooser = document.createElement("input");
        mockPluginChooser.id = "myOpenPlugin";
        mockPluginChooser.type = "file";
        document.body.appendChild(mockPluginChooser);
    });

    afterEach(() => {
        // Clean up the DOM and restore globals
        document.body.innerHTML = "";
        window.scroll = originalScroll;
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
        });

        it("click event resets value and scrolls to 0,0", () => {
            const dialog = new PluginDialog();
            Object.defineProperty(mockPluginChooser, "value", {
                get: jest.fn().mockReturnValue("some/path"),
                set: jest.fn(),
                configurable: true
            });

            const clickEvent = new Event("click");
            Object.defineProperty(clickEvent, "currentTarget", {
                value: mockPluginChooser
            });

            mockPluginChooser.dispatchEvent(clickEvent);

            expect(window.scroll).toHaveBeenCalledWith(0, 0);
            const valueSetter = Object.getOwnPropertyDescriptor(mockPluginChooser, "value").set;
            expect(valueSetter).toHaveBeenCalledWith("");
        });

        it("change event scrolls to 0,0 and triggers onFileSelected if a file is present", () => {
            const onFileSelected = jest.fn();
            const dialog = new PluginDialog({ onFileSelected });

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

            dialog.openPlugin();

            expect(closeAuxToolbar).toHaveBeenCalledWith(showHideAuxMenu);
        });

        it("creates a DOM modal with backdrop, select, and buttons", () => {
            const dialog = new PluginDialog();
            dialog.openPlugin();

            const modal = document.getElementById("open-plugin-modal");
            expect(modal).toBeTruthy();
            expect(modal.querySelector("h2").textContent).toBe("Load Plugin");
            expect(modal.querySelector(".plugin-modal-select")).toBeTruthy();
            expect(modal.querySelectorAll("button").length).toBe(3);
            expect(document.querySelector(".plugin-modal-backdrop")).toBeTruthy();
        });

        it("clicking Cancel button removes the modal and backdrop from the DOM", () => {
            const dialog = new PluginDialog();
            dialog.openPlugin();

            const modal = document.getElementById("open-plugin-modal");
            const cancelBtn = modal.querySelector(".cancel-button");

            cancelBtn.click();
            expect(document.getElementById("open-plugin-modal")).toBeNull();
            expect(document.querySelector(".plugin-modal-backdrop")).toBeNull();
        });

        it("clicking backdrop removes the modal", () => {
            const dialog = new PluginDialog();
            dialog.openPlugin();

            const backdrop = document.querySelector(".plugin-modal-backdrop");
            backdrop.click();

            expect(document.getElementById("open-plugin-modal")).toBeNull();
            expect(document.querySelector(".plugin-modal-backdrop")).toBeNull();
        });

        it("clicking Load triggers onLoadBuiltIn if a built-in plugin is selected", () => {
            const onLoadBuiltIn = jest.fn();
            const dialog = new PluginDialog({ onLoadBuiltIn });
            dialog.openPlugin();

            const modal = document.getElementById("open-plugin-modal");
            const select = modal.querySelector("select");
            const loadBtn = modal.querySelector(".confirm-button");

            select.value = "maths";
            loadBtn.click();

            expect(onLoadBuiltIn).toHaveBeenCalledWith("maths");
            expect(document.getElementById("open-plugin-modal")).toBeNull();
        });

        it("does not call onLoadBuiltIn if Load is clicked but input is empty", () => {
            const onLoadBuiltIn = jest.fn();
            const dialog = new PluginDialog({ onLoadBuiltIn });
            dialog.openPlugin();

            const modal = document.getElementById("open-plugin-modal");
            const select = modal.querySelector("select");
            const loadBtn = modal.querySelector(".confirm-button");

            select.value = "";
            loadBtn.click();

            expect(onLoadBuiltIn).not.toHaveBeenCalled();
            expect(document.getElementById("open-plugin-modal")).toBeTruthy();
        });

        it("does not crash if Load is clicked but onLoadBuiltIn is not a function", () => {
            const dialog = new PluginDialog({ onLoadBuiltIn: "not a function" });
            dialog.openPlugin();

            const modal = document.getElementById("open-plugin-modal");
            const select = modal.querySelector("select");
            const loadBtn = modal.querySelector(".confirm-button");

            select.value = "maths";

            expect(() => {
                loadBtn.click();
            }).not.toThrow();
            expect(document.getElementById("open-plugin-modal")).toBeNull();
        });

        it("clicking Upload File clicks the pluginChooser input", () => {
            const dialog = new PluginDialog();
            dialog.openPlugin();

            const modal = document.getElementById("open-plugin-modal");
            const uploadBtn = modal.querySelector(".plugin-upload-button");

            const clickSpy = jest.spyOn(mockPluginChooser, "click");
            uploadBtn.click();

            expect(clickSpy).toHaveBeenCalled();
            expect(document.getElementById("open-plugin-modal")).toBeNull();
        });
    });

    describe("deletePlugin", () => {
        it("creates a DOM modal with backdrop, select, and buttons", () => {
            const getLoadedPlugins = jest.fn().mockReturnValue(["maths", "rodi"]);
            const dialog = new PluginDialog({ getLoadedPlugins });

            dialog.deletePlugin();

            const modal = document.getElementById("delete-plugin-confirm");
            expect(modal).toBeTruthy();
            expect(modal.querySelector("h2").textContent).toBe("Delete Plugin");

            const select = modal.querySelector(".plugin-modal-select");
            expect(select).toBeTruthy();
            expect(select.options.length).toBe(2);
            expect(select.options[0].value).toBe("maths");
            expect(document.querySelector(".plugin-modal-backdrop")).toBeTruthy();
        });

        it("shows a no-plugins modal instead of alert when no plugins are loaded", () => {
            const getLoadedPlugins = jest.fn().mockReturnValue([]);
            const dialog = new PluginDialog({ getLoadedPlugins });

            dialog.deletePlugin();

            const noPluginsModal = document.getElementById("no-plugins-msg");
            expect(noPluginsModal).toBeTruthy();
            expect(noPluginsModal.querySelector(".modal-message").textContent).toBe(
                "No custom plugins are currently loaded."
            );
            expect(document.getElementById("delete-plugin-confirm")).toBeNull();
        });

        it("OK button on no-plugins modal closes it", () => {
            const getLoadedPlugins = jest.fn().mockReturnValue([]);
            const dialog = new PluginDialog({ getLoadedPlugins });

            dialog.deletePlugin();

            const noPluginsModal = document.getElementById("no-plugins-msg");
            const okBtn = noPluginsModal.querySelector(".confirm-button");
            okBtn.click();

            expect(document.getElementById("no-plugins-msg")).toBeNull();
        });

        it("clicking Cancel removes the modal and backdrop", () => {
            const getLoadedPlugins = jest.fn().mockReturnValue(["maths"]);
            const dialog = new PluginDialog({ getLoadedPlugins });

            dialog.deletePlugin();
            const modal = document.getElementById("delete-plugin-confirm");
            const cancelBtn = modal.querySelector(".cancel-button");

            cancelBtn.click();
            expect(document.getElementById("delete-plugin-confirm")).toBeNull();
            expect(document.querySelector(".plugin-modal-backdrop")).toBeNull();
        });

        it("clicking Delete triggers onDelete with the selected plugin", () => {
            const getLoadedPlugins = jest.fn().mockReturnValue(["maths", "rodi"]);
            const onDelete = jest.fn();
            const dialog = new PluginDialog({ getLoadedPlugins, onDelete });

            dialog.deletePlugin();
            const modal = document.getElementById("delete-plugin-confirm");
            const select = modal.querySelector("select");
            const deleteBtn = modal.querySelector(".confirm-button");

            select.value = "rodi";
            deleteBtn.click();

            expect(onDelete).toHaveBeenCalledWith("rodi");
            expect(document.getElementById("delete-plugin-confirm")).toBeNull();
        });

        it("does not crash if Delete is clicked but onDelete is not a function", () => {
            const getLoadedPlugins = jest.fn().mockReturnValue(["maths", "rodi"]);
            const dialog = new PluginDialog({ getLoadedPlugins, onDelete: "not a function" });

            dialog.deletePlugin();
            const modal = document.getElementById("delete-plugin-confirm");
            const select = modal.querySelector("select");
            const deleteBtn = modal.querySelector(".confirm-button");

            select.value = "rodi";
            expect(() => {
                deleteBtn.click();
            }).not.toThrow();
            expect(document.getElementById("delete-plugin-confirm")).toBeNull();
        });

        it("handles getLoadedPlugins not being a function gracefully", () => {
            const dialog = new PluginDialog({ getLoadedPlugins: "not a function" });

            dialog.deletePlugin();

            const noPluginsModal = document.getElementById("no-plugins-msg");
            expect(noPluginsModal).toBeTruthy();
            expect(document.getElementById("delete-plugin-confirm")).toBeNull();
        });

        it("pre-selects the active plugin when getActivePlugin returns a loaded plugin", () => {
            const getLoadedPlugins = jest.fn().mockReturnValue(["maths", "rodi", "weather"]);
            const getActivePlugin = jest.fn().mockReturnValue("rodi");
            const dialog = new PluginDialog({ getLoadedPlugins, getActivePlugin });

            dialog.deletePlugin();
            const modal = document.getElementById("delete-plugin-confirm");
            const select = modal.querySelector("select");

            expect(select.value).toBe("rodi");
        });
    });
});
