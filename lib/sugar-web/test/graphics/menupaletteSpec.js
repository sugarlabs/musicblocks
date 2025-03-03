/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2015  Walter Bender
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

define(["sugar-web/graphics/menupalette", "sugar-web/graphics/palette"], function (menupalette, palette) {

    'use strict';

    describe("menupalette", function () {

        var invoker;
        var menuData;
        var menuPalette;

        beforeEach(function () {
            invoker = document.createElement('button');

            menuData = [
                {
                    label: "One",
                    id: "one-button",
                    icon: true
                },
                {
                    label: "Two",
                    id: "two-button",
                    icon: true
                },
                {
                    label: "Three",
                    id: "three-button",
                    icon: true
                }
            ];

            menuPalette = new menupalette.MenuPalette(invoker, undefined,
                menuData);
        });

        it("should have a fixed number of clickable items", function () {
            var buttons = menuPalette.getPalette().
            querySelectorAll('.container button');
            expect(buttons.length).toBe(menuData.length);
        });

        it("should emit a signal with the clicked item", function () {
            var button;
            var buttonSelected;

            function onItemSelected(event) {
                button = event.detail.target;
                buttonSelected = true;
            }

            runs(function () {
                buttonSelected = false;
                menuPalette.addEventListener('selectItem', onItemSelected);

                var buttons = menuPalette.getPalette().
                querySelectorAll('.container button');
                buttons[1].click();
            });

            waitsFor(function () {
                return buttonSelected;
            }, "should have selected a button");

            runs(function () {
                expect(button.id).toBe("two-button");
            });
        });

        it("should be an instance of the child class", function () {
            expect(menuPalette instanceof menupalette.MenuPalette).toBe(true);
        });

        it("should be an instance of the parent class", function () {
            expect(menuPalette instanceof palette.Palette).toBe(true);
        });

    });
});
