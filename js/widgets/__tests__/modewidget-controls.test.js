/**
 * @license
 * MusicBlocks
 * Copyright (C) 2026 Music Blocks contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const ModeWidget = require("../modewidget");
const { makeKeyboardAccessible } = require("../../utils/dom-helpers");

describe("ModeWidget control bar keyboard access", () => {
    let widget;
    let table;
    const pattern = [2, 2, 1, 2, 2, 2, 1];

    beforeEach(() => {
        global._ = text => text;
        global.docById = id => document.getElementById(id);
        global.makeKeyboardAccessible = makeKeyboardAccessible;
        global.getSavedCustomModes = () => [{ name: "test mode", pattern }];
        global.DEFAULTMODE = "major";
        table = document.createElement("table");
        table.id = "modeTable";
        document.body.appendChild(table);

        // Exercise the real control builder without constructing the SVG wheels.
        widget = Object.create(ModeWidget.prototype);
        Object.assign(widget, {
            _selectedModeName: "test mode",
            _modeBlock: null,
            _onModePieButtonClick: jest.fn(),
            _calculateMode: jest.fn().mockReturnValue(pattern),
            _saveCustomMode: jest.fn().mockReturnValue(true),
            _deleteCustomMode: jest.fn(),
            _setModeName: jest.fn(),
            _save: jest.fn(),
            textMsg: jest.fn(),
            errorMsg: jest.fn(),
            _initEdoSelect: jest.fn(select => {
                const option = document.createElement("option");
                option.value = "equal";
                option.textContent = "12-EDO (Equal)";
                select.appendChild(option);
            }),
            _wireEdoSelect: jest.fn()
        });
        widget._buildControlBar();
        widget._nameInput.value = " test mode ";
    });

    afterEach(() => {
        table.remove();
        delete global.docById;
        delete global.makeKeyboardAccessible;
        delete global.getSavedCustomModes;
        delete global.DEFAULTMODE;
    });

    function button(label) {
        return table.querySelector(`[role="button"][aria-label="${label}"]`);
    }

    function expectAction(label) {
        if (label === "Switch mode") {
            expect(widget._onModePieButtonClick).toHaveBeenCalledTimes(1);
        } else if (label === "Save") {
            expect(widget._saveCustomMode).toHaveBeenCalledWith("test mode", pattern);
            expect(widget._saveCustomMode).toHaveBeenCalledTimes(1);
            expect(widget._save).toHaveBeenCalledTimes(1);
        } else {
            expect(widget._deleteCustomMode).toHaveBeenCalledWith("test mode");
            expect(widget._deleteCustomMode).toHaveBeenCalledTimes(1);
        }
    }

    describe.each(["Switch mode", "Save", "Delete"])("%s", label => {
        test.each(["Enter", " "])("activates once with %p and prevents page shortcuts", key => {
            const control = button(label);
            control.focus();
            expect(document.activeElement).toBe(control);
            const propagated = jest.fn();
            table.addEventListener("keydown", propagated);
            const event = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });

            control.dispatchEvent(event);

            expectAction(label);
            expect(event.defaultPrevented).toBe(true);
            expect(propagated).not.toHaveBeenCalled();
        });

        test("keeps mouse activation", () => {
            button(label).click();
            expectAction(label);
        });
    });

    test("does not save repeatedly when a key is held or an arrow key is pressed", () => {
        const save = button("Save");
        save.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", repeat: true }));
        save.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
        expect(widget._save).not.toHaveBeenCalled();
        expect(widget._saveCustomMode).not.toHaveBeenCalled();
    });

    test("keeps name validation when Save is activated from the keyboard", () => {
        widget._nameInput.value = "   ";
        button("Save").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
        expect(widget.errorMsg).toHaveBeenCalledWith("Please enter a mode name.");
        expect(widget._saveCustomMode).not.toHaveBeenCalled();
        expect(widget._save).not.toHaveBeenCalled();
    });

    test("exposes only the native temperament selector as a keyboard control", () => {
        const select = table.querySelector('select[aria-label="temperament"]');
        const icon = select.previousElementSibling;
        expect(icon.getAttribute("aria-hidden")).toBe("true");
        expect(icon.hasAttribute("role")).toBe(false);
        expect(icon.tabIndex).toBe(-1);
        expect(select.disabled).toBe(false);
        expect(select.tabIndex).toBe(0);
        select.focus();
        expect(document.activeElement).toBe(select);
        expect(widget._wireEdoSelect).toHaveBeenCalledWith(select);
    });
});
