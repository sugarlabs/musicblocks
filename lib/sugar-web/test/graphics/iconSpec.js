/*
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Sugar Labs
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
define(["sugar-web/graphics/icon"], function (icon) {

    'use strict';

    describe("icon", function () {
        var wasLoaded;
        var iconUrlResult;

        it("should be able to change icon more than once", function () {
            var elem = document.createElement('div');
            var iconUrl;

            function callback(url) {
                iconUrlResult = url;
                wasLoaded = true;
            }

            runs(function () {
                wasLoaded = false;
                iconUrl = "/base/graphics/icons/actions/dialog-ok-active.svg";
                var iconInfo = {
                    "uri": iconUrl,
                    "strokeColor": '#B20008',
                    "fillColor": '#FF2B34'
                };
                icon.load(iconInfo, callback);
            });

            waitsFor(function () {
                return wasLoaded;
            }, "icon loaded");

            runs(function () {
                expect(iconUrlResult).not.toBe(iconUrl);
            });

            runs(function () {
                wasLoaded = false;
                iconUrl = iconUrlResult;
                var iconInfo = {
                    "uri": iconUrl,
                    "strokeColor": '#FF2B34',
                    "fillColor": '#B20008'
                };
                icon.load(iconInfo, callback);
            });

            waitsFor(function () {
                return wasLoaded;
            }, "icon loaded");

            runs(function () {
                expect(iconUrlResult).not.toBe(iconUrl);
            });

        });
    });

});
