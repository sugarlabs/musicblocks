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
define(["sugar-web/graphics/palette"], function (palette) {

    'use strict';

    describe("palette", function () {
        it("should start down", function () {
            var invoker = document.createElement('button');
            var myPalette = new palette.Palette(invoker);
            expect(myPalette.isDown()).toBe(true);
        });

        it("should toggle", function () {
            var invoker = document.createElement('button');
            var myPalette = new palette.Palette(invoker);
            myPalette.toggle();
            expect(myPalette.isDown()).toBe(false);
            myPalette.toggle();
            expect(myPalette.isDown()).toBe(true);
        });

        it("if one palette in a group popups, the others popdown", function () {
            var invokerA = document.createElement('button');
            var invokerB = document.createElement('button');
            var myPaletteA = new palette.Palette(invokerA);
            var myPaletteB = new palette.Palette(invokerB);
            myPaletteA.toggle();
            expect(myPaletteA.isDown()).toBe(false);
            expect(myPaletteB.isDown()).toBe(true);
            myPaletteB.toggle();
            expect(myPaletteA.isDown()).toBe(true);
            expect(myPaletteB.isDown()).toBe(false);
        });

    });

});
