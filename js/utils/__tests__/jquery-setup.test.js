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
    let originalJQuery;

    beforeEach(() => {
        jest.resetModules();

        readyCallbacks = [];
        originalJQuery = global.jQuery;

        const mockJQuery = jest.fn(selector => {
            if (selector === document) {
                return {
                    ready: callback => {
                        readyCallbacks.push(callback);
                    }
                };
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
    });

    afterEach(() => {
        global.jQuery = originalJQuery;
        delete global.$;
    });

    test("registers document ready callback", () => {
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
});
