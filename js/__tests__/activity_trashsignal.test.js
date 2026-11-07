// Copyright (c) 2026 Sugar Labs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const { loadActivitySandbox } = require("./helpers/activity-vm-sandbox");

const makeActivity = (clearTimeoutImplementation = timerId => global.clearTimeout(timerId)) => {
    const clearTimeoutSpy = jest.fn(clearTimeoutImplementation);
    const { Activity } = loadActivitySandbox({
        overrides: {
            clearTimeout: clearTimeoutSpy,
            closeWidgets: jest.fn()
        }
    });
    const activity = new Activity();
    activity.blocksContainer = { x: 100, y: 200 };
    activity.palettes = { dict: {} };
    activity.refreshCanvas = jest.fn();
    activity.stage = { dispatchEvent: jest.fn() };
    activity.blocks = {
        palettes: { dict: {} },
        blockList: [],
        trashStacks: [],
        trashPreviews: {},
        blockArt: {},
        blockCollapseArt: {},
        _beginDeferCheckBounds: jest.fn(),
        _endDeferCheckBounds: jest.fn(),
        captureStackPreview: jest.fn(() => null),
        deleteActionBlock: jest.fn(),
        moveBlockRelative: jest.fn()
    };
    activity.saveLocally = jest.fn();
    activity.clearTimeoutSpy = clearTimeoutSpy;
    return activity;
};

const addActionBlocks = (activity, count) => {
    for (let i = 0; i < count; i++) {
        activity.blocks.blockList.push({
            name: "action",
            trash: false,
            connections: [null, null],
            hide: jest.fn(),
            container: { uncache: jest.fn() }
        });
    }
};

describe("Activity trash signal scheduling", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("dispatches trashsignal after the no-action delay", () => {
        const activity = makeActivity();

        activity.sendAllToTrash(false, true, false);

        expect(activity.stage.dispatchEvent).not.toHaveBeenCalled();
        jest.advanceTimersByTime(0);
        expect(activity.stage.dispatchEvent).toHaveBeenCalledTimes(1);
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("trashsignal");
    });

    test("cancels an obsolete timer when a newer operation starts", () => {
        const activity = makeActivity();
        addActionBlocks(activity, 25);

        activity.sendAllToTrash(false, true, false);
        activity.sendAllToTrash(false, true, false);

        expect(activity.clearTimeoutSpy).toHaveBeenCalledTimes(1);
        jest.advanceTimersByTime(0);
        expect(activity.stage.dispatchEvent).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(2500);
        expect(activity.stage.dispatchEvent).toHaveBeenCalledTimes(1);
    });

    test("ignores an obsolete callback when timer cancellation is too late", () => {
        const activity = makeActivity(() => {});
        addActionBlocks(activity, 25);

        activity.sendAllToTrash(false, true, false);
        activity.sendAllToTrash(false, true, false);

        jest.advanceTimersByTime(2500);
        expect(activity.clearTimeoutSpy).toHaveBeenCalledTimes(1);
        expect(activity.stage.dispatchEvent).toHaveBeenCalledTimes(1);
    });

    test("preserves the 100 milliseconds per action block delay", () => {
        const activity = makeActivity();
        addActionBlocks(activity, 25);

        activity.sendAllToTrash(false, true, false);

        jest.advanceTimersByTime(2499);
        expect(activity.stage.dispatchEvent).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(activity.stage.dispatchEvent).toHaveBeenCalledTimes(1);
        expect(activity.blocks.deleteActionBlock).toHaveBeenCalledTimes(25);
    });
});
