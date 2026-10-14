// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const { setupSearchController } = require("../search-controller.js");
const { SearchUI } = require("../../search-ui.js");

function makeProtoBlock(name, label) {
    return {
        name,
        staticLabels: [label],
        palette: {
            name: "test-palette",
            model: { makeBlockInfo: () => ({ artwork64: "" }) }
        }
    };
}

function makeActivity(protoBlocks) {
    const activity = {
        blocks: { protoBlockDict: protoBlocks, moveBlock: jest.fn() },
        blocksContainer: { x: 0, y: 0 },
        palettes: {
            dict: {
                "test-palette": {
                    makeBlockFromSearch: jest.fn((proto, name, callback) => callback(42))
                }
            }
        }
    };
    activity.searchUI = new SearchUI(activity);
    return activity;
}

// Exercise both search renderers with real DOM events and jQuery rows.
describe.each(["controller", "ui"])("Search result placement (%s)", renderer => {
    let activity, row, placeBlock, listeners;
    const $ = jest.requireActual("jquery");
    let originalAutocomplete;

    beforeEach(() => {
        document.body.innerHTML = '<input id="search"><ul id="touch-search-results"></ul>';
        originalAutocomplete = $.fn.autocomplete;
        const instance = {};
        $.fn.autocomplete = jest.fn(function (arg) {
            return arg === "instance" ? instance : this;
        });
        window.jQuery = $;
        listeners = jest.spyOn(document, "addEventListener");

        const block = makeProtoBlock("forward", "forward");
        activity = makeActivity({ forward: block });
        activity.searchWidget = document.getElementById("search");
        placeBlock = activity.palettes.dict["test-palette"].makeBlockFromSearch;
        setupSearchController(activity);
        activity.searchController.doSearch();
        const item = { label: "forward", value: "forward", specialDict: block };
        const ul = $("#touch-search-results");
        if (renderer === "controller") {
            row = instance._renderItem(ul, item)[0];
        } else {
            row = activity.searchUI._renderMainItem($, ul, item, (proto, x, y) => {
                placeBlock(proto, proto.name, newBlock => {
                    activity.blocks.moveBlock(newBlock, x, y);
                });
            })[0];
        }
    });

    afterEach(() => {
        for (const [type, listener, options] of listeners.mock.calls) {
            document.removeEventListener(type, listener, options);
        }
        listeners.mockRestore();
        $.fn.autocomplete = originalAutocomplete;
        delete window.jQuery;
        document.body.innerHTML = "";
    });

    function touch(type, x, y) {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperty(event, "touches", {
            value: type === "touchend" ? [] : [{ clientX: x, clientY: y }]
        });
        return event;
    }

    test("places a block after a touch tap without movement", () => {
        row.dispatchEvent(touch("touchstart", 150, 180));
        document.dispatchEvent(touch("touchend", 150, 180));

        expect(placeBlock).toHaveBeenCalledTimes(1);
        expect(activity.blocks.moveBlock).toHaveBeenCalledWith(42, 150, 180);
    });

    test("places a dragged block at the last touch position", () => {
        row.dispatchEvent(touch("touchstart", 150, 180));
        document.dispatchEvent(touch("touchmove", 300, 350));
        document.dispatchEvent(touch("touchend", 300, 350));

        expect(placeBlock).toHaveBeenCalledTimes(1);
        expect(activity.blocks.moveBlock).toHaveBeenCalledWith(42, 300, 350);
    });

    test("still places a block after a mouse click", () => {
        row.dispatchEvent(
            new MouseEvent("mousedown", { bubbles: true, clientX: 150, clientY: 180 })
        );
        document.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));

        expect(placeBlock).toHaveBeenCalledTimes(1);
        expect(activity.blocks.moveBlock).toHaveBeenCalledWith(42, 150, 180);
    });
});
