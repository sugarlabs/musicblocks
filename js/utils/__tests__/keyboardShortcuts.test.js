/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Music Blocks contributors
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

global._ = value => value;

const KeyboardShortcuts = require("../keyboardShortcuts");

describe("KeyboardShortcuts", () => {
    const makeEvent = options => ({
        key: options.key,
        ctrlKey: options.ctrlKey || false,
        metaKey: options.metaKey || false,
        target: options.target || { tagName: "BODY" },
        preventDefault: jest.fn(),
        stopPropagation: jest.fn()
    });

    const makeActivity = () => ({
        blocks: {
            activeBlock: 0,
            lastSelectedBlock: null,
            blockList: [
                { blockIndex: 0, trash: false },
                { blockIndex: 1, trash: false },
                { blockIndex: 2, trash: true }
            ],
            trashStacks: [4],
            moveStackRelative: jest.fn(),
            blockMoved: jest.fn(),
            adjustDocks: jest.fn(),
            sendStackToTrash: jest.fn()
        },
        _restoreTrashById: jest.fn(),
        textMsg: jest.fn(),
        stageDirty: false
    });

    test("deletes the active block with Delete", () => {
        const activity = makeActivity();
        const event = makeEvent({ key: "Delete" });

        expect(KeyboardShortcuts.handleKeyDown(event, activity)).toBe(true);
        expect(activity.blocks.sendStackToTrash).toHaveBeenCalledWith(activity.blocks.blockList[0]);
        expect(activity.blocks.activeBlock).toBeNull();
        expect(activity.stageDirty).toBe(true);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    test("nudges the last selected block when activeBlock has been cleared", () => {
        const activity = makeActivity();
        activity.blocks.activeBlock = null;
        activity.blocks.lastSelectedBlock = 1;
        const event = makeEvent({ key: "ArrowRight" });

        expect(KeyboardShortcuts.handleKeyDown(event, activity)).toBe(true);
        expect(activity.blocks.activeBlock).toBe(1);
        expect(activity.blocks.moveStackRelative).toHaveBeenCalledWith(1, 10, 0);
        expect(activity.blocks.blockMoved).toHaveBeenCalledWith(1);
        expect(activity.blocks.adjustDocks).toHaveBeenCalledWith(1, true);
        expect(activity.stageDirty).toBe(true);
    });

    test("tracks the last selected block when activeBlock changes", () => {
        const blocks = {
            activeBlock: null
        };

        KeyboardShortcuts.trackBlockSelection(blocks);
        blocks.activeBlock = 1;
        blocks.activeBlock = null;

        expect(blocks.activeBlock).toBeNull();
        expect(blocks.lastSelectedBlock).toBe(1);
    });

    test("restores the last deleted block with Ctrl+Z", () => {
        const activity = makeActivity();
        const event = makeEvent({ key: "z", ctrlKey: true });

        expect(KeyboardShortcuts.handleKeyDown(event, activity)).toBe(true);
        expect(activity._restoreTrashById).toHaveBeenCalledWith(4);
        expect(event.preventDefault).toHaveBeenCalled();
    });

    test("restores the last deleted block with Cmd+Z", () => {
        const activity = makeActivity();
        const event = makeEvent({ key: "z", metaKey: true });

        expect(KeyboardShortcuts.handleKeyDown(event, activity)).toBe(true);
        expect(activity._restoreTrashById).toHaveBeenCalledWith(4);
    });

    test("does not run shortcuts while typing in an input", () => {
        const activity = makeActivity();
        const event = makeEvent({ key: "Backspace", target: { tagName: "INPUT" } });

        expect(KeyboardShortcuts.handleKeyDown(event, activity)).toBe(false);
        expect(activity.blocks.sendStackToTrash).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    test("does not nudge a trashed last selected block", () => {
        const activity = makeActivity();
        activity.blocks.activeBlock = null;
        activity.blocks.lastSelectedBlock = 2;
        const event = makeEvent({ key: "ArrowUp" });

        expect(KeyboardShortcuts.handleKeyDown(event, activity)).toBe(false);
        expect(activity.blocks.moveStackRelative).not.toHaveBeenCalled();
    });
});
