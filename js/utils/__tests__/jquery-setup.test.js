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
    });

    test("registers both document ready callbacks", () => {
        require("../jquery-setup");

        expect(readyCallbacks).toHaveLength(2);
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

    test("schedules autocomplete position fix after initial timeout", () => {
        require("../jquery-setup");

        readyCallbacks[1]();

        expect(jest.getTimerCount()).toBeGreaterThan(0);
    });

    test("updates dropdown position styles when autocomplete instance exists", () => {
        const originalRenderMenu = jest.fn();

        mockInstance._renderMenu = originalRenderMenu;

        require("../jquery-setup");

        readyCallbacks[1]();

        jest.advanceTimersByTime(1000);

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

    test("retries setup when autocomplete instance is unavailable", () => {
        mockSearch.data = jest.fn(() => false);

        require("../jquery-setup");

        readyCallbacks[1]();

        jest.advanceTimersByTime(1000);

        expect(jest.getTimerCount()).toBeGreaterThan(0);
    });

    test("logs error after maximum retry attempts", () => {
        mockSearch.data = jest.fn(() => false);

        require("../jquery-setup");

        readyCallbacks[1]();

        jest.advanceTimersByTime(11000);

        expect(console.error).toHaveBeenCalledTimes(1);

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining(
                "Autocomplete setup failed: Could not initialize ui-autocomplete"
            )
        );
    });

    test("does not throw when search element is missing", () => {
        mockSearch.length = 0;

        require("../jquery-setup");

        readyCallbacks[1]();

        expect(() => {
            jest.advanceTimersByTime(11000);
        }).not.toThrow();
    });

    test("does not modify dropdown styles when searchInput is null", () => {
        document.querySelector = jest.fn(() => null);

        const originalRenderMenu = jest.fn();

        mockInstance._renderMenu = originalRenderMenu;

        require("../jquery-setup");

        readyCallbacks[1]();

        jest.advanceTimersByTime(1000);

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

    test("does not override _renderMenu when autocomplete instance is null", () => {
        mockSearch.autocomplete = jest.fn(() => null);

        require("../jquery-setup");

        readyCallbacks[1]();

        jest.advanceTimersByTime(1000);

        expect(mockSearch.autocomplete).toHaveBeenCalledWith("instance");
    });

    test("calls original _renderMenu before applying dropdown positioning", () => {
        const originalRenderMenu = jest.fn();

        mockInstance._renderMenu = originalRenderMenu;

        require("../jquery-setup");

        readyCallbacks[1]();

        jest.advanceTimersByTime(1000);

        const wrappedRenderMenu = mockInstance._renderMenu;

        const ul = [mockDropdown];
        const items = ["item"];

        wrappedRenderMenu.call(mockInstance, ul, items);

        expect(originalRenderMenu).toHaveBeenCalledWith(ul, items);
    });
});
