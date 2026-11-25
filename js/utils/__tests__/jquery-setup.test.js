// Copyright (c) 2026 Sugar Labs
//
// This program is free software; you can redistribute it and/or modify it under the terms of
// the GNU Affero General Public License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public License along with this
// library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
// MA 02110-1335 USA

/**
 * @jest-environment jsdom
 */

describe("jquery-setup", () => {
    let originalTooltip;
    let readyCallback;
    let mockSearchInstance;
    let searchEl;

    function loadModule({ withUi = true, withSearch = true, withAutocomplete = true } = {}) {
        jest.resetModules();
        readyCallback = null;
        originalTooltip = jest.fn().mockReturnValue("tooltip-result");
        mockSearchInstance = {
            _renderMenu: jest.fn()
        };

        document.body.innerHTML = "";
        searchEl = null;
        if (withSearch) {
            searchEl = document.createElement("input");
            searchEl.id = "search";
            searchEl.getBoundingClientRect = jest.fn(() => ({
                left: 120,
                bottom: 48,
                width: 240
            }));
            document.body.appendChild(searchEl);
        }

        const mockAutocomplete = jest.fn();
        const jQueryMock = jest.fn(arg => {
            if (arg === document) {
                return {
                    ready: cb => {
                        readyCallback = cb;
                    }
                };
            }
            if (arg === "#search") {
                return {
                    length: withSearch ? 1 : 0,
                    data: jest.fn(key =>
                        key === "ui-autocomplete" && withAutocomplete ? mockSearchInstance : null
                    ),
                    autocomplete: jest.fn(cmd => (cmd === "instance" ? mockSearchInstance : null))
                };
            }
            return {};
        });

        jQueryMock.fn = {
            autocomplete: mockAutocomplete,
            tooltip: originalTooltip
        };
        if (withUi) {
            jQueryMock.ui = { autocomplete: { widgetName: "autocomplete" } };
        }
        jQueryMock.widget = {
            bridge: jest.fn()
        };

        global.jQuery = jQueryMock;
        delete window.fixSearchAutocompletePosition;
        require("../jquery-setup");
        return { jQueryMock, mockAutocomplete };
    }

    afterEach(() => {
        jest.useRealTimers();
        delete global.jQuery;
        delete window.fixSearchAutocompletePosition;
    });

    test("bridges jQuery UI autocomplete while preserving Materialize autocomplete on ready", () => {
        const { jQueryMock, mockAutocomplete } = loadModule({ withUi: true });

        expect(typeof readyCallback).toBe("function");
        readyCallback();

        expect(jQueryMock.fn.materializeAutocomplete).toBe(mockAutocomplete);
        expect(jQueryMock.widget.bridge).toHaveBeenCalledWith(
            "autocomplete",
            jQueryMock.ui.autocomplete
        );
    });

    test("skips autocomplete bridge on ready when jQuery.ui is absent", () => {
        const { jQueryMock } = loadModule({ withUi: false });

        readyCallback();

        expect(jQueryMock.fn.materializeAutocomplete).toBeUndefined();
        expect(jQueryMock.widget.bridge).not.toHaveBeenCalled();
    });

    test("fixSearchAutocompletePosition returns false when #search or ui-autocomplete is missing", () => {
        loadModule({ withSearch: false });
        expect(window.fixSearchAutocompletePosition()).toBe(false);

        loadModule({ withSearch: true, withAutocomplete: false });
        expect(window.fixSearchAutocompletePosition()).toBe(false);
    });

    test("fixSearchAutocompletePosition wraps _renderMenu once and anchors dropdown position", () => {
        jest.useFakeTimers();
        loadModule();

        const origRender = mockSearchInstance._renderMenu;
        expect(window.fixSearchAutocompletePosition()).toBe(true);
        expect(mockSearchInstance._mbPositionFixApplied).toBe(true);
        // Calling a second time is a no-op
        expect(window.fixSearchAutocompletePosition()).toBe(false);

        const dropdownEl = document.createElement("ul");
        mockSearchInstance._renderMenu([dropdownEl], ["a", "b"]);
        expect(origRender).toHaveBeenCalledWith([dropdownEl], ["a", "b"]);

        jest.runAllTimers();
        expect(dropdownEl.style.position).toBe("fixed");
        expect(dropdownEl.style.left).toBe("120px");
        expect(dropdownEl.style.top).toBe("50px");
        expect(dropdownEl.style.width).toBe("240px");
    });

    test("tooltip wrapper natively removes existing tooltip node unless option is 'remove'", () => {
        const { jQueryMock } = loadModule();

        const tooltipNode = document.createElement("div");
        tooltipNode.id = "tt-1";
        document.body.appendChild(tooltipNode);

        const triggerEl = document.createElement("button");
        triggerEl.setAttribute("data-tooltip-id", "tt-1");

        const targetCollection = {
            each: cb => cb.call(triggerEl)
        };

        const res = jQueryMock.fn.tooltip.call(targetCollection, { delay: 50 });
        expect(res).toBe("tooltip-result");
        expect(document.getElementById("tt-1")).toBeNull();
        expect(originalTooltip).toHaveBeenCalledWith({ delay: 50 });

        // Passing "remove" skips native removal and forwards directly
        const tooltipNode2 = document.createElement("div");
        tooltipNode2.id = "tt-2";
        document.body.appendChild(tooltipNode2);
        triggerEl.setAttribute("data-tooltip-id", "tt-2");

        jQueryMock.fn.tooltip.call(targetCollection, "remove");
        expect(document.getElementById("tt-2")).not.toBeNull();
        expect(originalTooltip).toHaveBeenCalledWith("remove");
    });
});
