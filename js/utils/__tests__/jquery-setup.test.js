/**
 * @license
 * MusicBlocks v3.7.1
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

/**
 * @file jquery-setup.test.js
 * @description Tests for js/utils/jquery-setup.js
 */

describe("jquery-setup", () => {
    let readyCallbacks;
    let mockSearch;
    let mockInstance;
    let mockDropdown;
    let originalJQuery;
    let errorSpy;

    beforeEach(() => {
        jest.resetModules();
        jest.useFakeTimers();

        readyCallbacks = [];

        mockDropdown = {
            style: {}
        };

        mockInstance = {
            _renderMenu: jest.fn()
        };

        mockSearch = {
            length: 1,
            data: jest.fn(() => true),
            autocomplete: jest.fn(() => mockInstance)
        };

        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        originalJQuery = global.jQuery;

        const mockJQuery = jest.fn(selector => {
            if (selector === document) {
                return {
                    ready: callback => {
                        readyCallbacks.push(callback);
                    }
                };
            }

            if (selector === "#search") {
                return mockSearch;
            }

            return {};
        });

        mockJQuery.ui = {
            autocomplete: {}
        };

        mockJQuery.fn = {
            autocomplete: jest.fn()
        };

        mockJQuery.widget = {
            bridge: jest.fn()
        };

        global.jQuery = mockJQuery;
        global.$ = mockJQuery;

        document.body.innerHTML = `
            <input id="search" />
        `;

        document.querySelector = jest.fn(selector => {
            if (selector === "#search") {
                return {
                    getBoundingClientRect: () => ({
                        left: 100,
                        bottom: 200,
                        width: 300
                    })
                };
            }

            return null;
        });
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();

        errorSpy.mockRestore();

        global.jQuery = originalJQuery;
        delete global.$;
        delete window.fixSearchAutocompletePosition;
    });

    test("registers a single document ready callback", () => {
        require("../jquery-setup");

        expect(readyCallbacks).toHaveLength(1);
    });

    test("bridges jQuery UI autocomplete with Materialize autocomplete", () => {
        require("../jquery-setup");

        readyCallbacks[0]();

        expect(jQuery.fn.materializeAutocomplete).toBe(jQuery.fn.autocomplete);

        expect(jQuery.widget.bridge).toHaveBeenCalledTimes(1);

        expect(jQuery.widget.bridge).toHaveBeenCalledWith("autocomplete", jQuery.ui.autocomplete);
    });

    test("does not bridge autocomplete when jQuery.ui.autocomplete is unavailable", () => {
        global.jQuery.ui = {};

        require("../jquery-setup");

        readyCallbacks[0]();

        expect(jQuery.widget.bridge).not.toHaveBeenCalled();

        expect(jQuery.fn.materializeAutocomplete).toBeUndefined();
    });

    test("exposes fixSearchAutocompletePosition as a global function", () => {
        require("../jquery-setup");

        expect(typeof window.fixSearchAutocompletePosition).toBe("function");
    });

    test("applies the position fix and reports success when the widget exists", () => {
        const originalRenderMenu = jest.fn();

        mockInstance._renderMenu = originalRenderMenu;

        require("../jquery-setup");

        const applied = window.fixSearchAutocompletePosition();

        expect(applied).toBe(true);

        expect(mockSearch.autocomplete).toHaveBeenCalledWith("instance");

        const wrappedRenderMenu = mockInstance._renderMenu;

        const ul = [mockDropdown];
        const items = [];

        wrappedRenderMenu.call(mockInstance, ul, items);

        expect(originalRenderMenu).toHaveBeenCalledWith(ul, items);

        jest.advanceTimersByTime(0);

        expect(mockDropdown.style.position).toBe("fixed");
        expect(mockDropdown.style.left).toBe("100px");
        expect(mockDropdown.style.top).toBe("202px");
        expect(mockDropdown.style.width).toBe("300px");
    });

    test("returns false without logging when the widget has not been initialised", () => {
        mockSearch.data = jest.fn(() => false);

        require("../jquery-setup");

        expect(window.fixSearchAutocompletePosition()).toBe(false);

        expect(console.error).not.toHaveBeenCalled();
    });

    test("returns false when the search element is missing", () => {
        mockSearch.length = 0;

        require("../jquery-setup");

        expect(window.fixSearchAutocompletePosition()).toBe(false);
    });

    test("returns false when the autocomplete instance is null", () => {
        mockSearch.autocomplete = jest.fn(() => null);

        require("../jquery-setup");

        expect(window.fixSearchAutocompletePosition()).toBe(false);

        expect(mockSearch.autocomplete).toHaveBeenCalledWith("instance");
    });

    test("does not modify dropdown styles when searchInput is null", () => {
        document.querySelector = jest.fn(() => null);

        const originalRenderMenu = jest.fn();

        mockInstance._renderMenu = originalRenderMenu;

        require("../jquery-setup");

        window.fixSearchAutocompletePosition();

        const wrappedRenderMenu = mockInstance._renderMenu;

        const ul = [mockDropdown];
        const items = [];

        wrappedRenderMenu.call(mockInstance, ul, items);

        jest.advanceTimersByTime(0);

        expect(mockDropdown.style.position).toBeUndefined();
        expect(mockDropdown.style.left).toBeUndefined();
        expect(mockDropdown.style.top).toBeUndefined();
        expect(mockDropdown.style.width).toBeUndefined();
    });

    test("calls original _renderMenu before applying dropdown positioning", () => {
        const originalRenderMenu = jest.fn();

        mockInstance._renderMenu = originalRenderMenu;

        require("../jquery-setup");

        window.fixSearchAutocompletePosition();

        const wrappedRenderMenu = mockInstance._renderMenu;

        const ul = [mockDropdown];
        const items = ["item"];

        wrappedRenderMenu.call(mockInstance, ul, items);

        expect(originalRenderMenu).toHaveBeenCalledWith(ul, items);
    });

    test("is idempotent: a second call does not re-wrap _renderMenu", () => {
        const originalRenderMenu = jest.fn();

        mockInstance._renderMenu = originalRenderMenu;

        require("../jquery-setup");

        expect(window.fixSearchAutocompletePosition()).toBe(true);

        const wrappedRenderMenu = mockInstance._renderMenu;

        expect(window.fixSearchAutocompletePosition()).toBe(false);

        expect(mockInstance._renderMenu).toBe(wrappedRenderMenu);

        const ul = [mockDropdown];
        const items = [];

        wrappedRenderMenu.call(mockInstance, ul, items);

        expect(originalRenderMenu).toHaveBeenCalledTimes(1);
    });
});
