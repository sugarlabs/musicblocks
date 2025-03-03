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

define(["sugar-web/graphics/radiobuttonsgroup"], function (
    radioButtonsGroup) {

    'use strict';

    var elem1;
    var elem2;
    var elem3;

    beforeEach(function () {
        elem1 = document.createElement('button');
        elem2 = document.createElement('button');
        elem3 = document.createElement('button');
    });

    describe("radioToolButton", function () {
        var wasClicked;

        it("should construct", function () {
            var radio = new radioButtonsGroup.RadioButtonsGroup(
            [elem1, elem2, elem3]);
            expect(radio.elems.length).toBe(3);
        });

        it("should start active the first by default", function () {
            var radio = new radioButtonsGroup.RadioButtonsGroup(
            [elem1, elem2, elem3]);
            expect(radio.getActive()).toBe(elem1);
        });

        it("should start active the first with 'active' class", function () {
            elem2.className = "active red";
            elem3.className = "active blue";
            var radio = new radioButtonsGroup.RadioButtonsGroup(
            [elem1, elem2, elem3]);
            expect(radio.getActive()).toBe(elem2);
        });

        it("should add 'active' class to the selected item", function () {
            var radio = new radioButtonsGroup.RadioButtonsGroup(
            [elem1, elem2, elem3]);
            var elem = radio.getActive();
            expect(elem.classList.contains('active')).toBe(true);
        });

        it("should change the active one on click", function () {
            var radio = new radioButtonsGroup.RadioButtonsGroup(
            [elem1, elem2, elem3]);

            // let's click elem2

            runs(function () {
                wasClicked = false;

                elem2.onclick = function () {
                    wasClicked = true;
                };

                elem2.click();
            });

            waitsFor(function () {
                return wasClicked;
            }, "the element should be clicked");

            runs(function () {
                var elem = radio.getActive();
                expect(elem).toBe(elem2);
                expect(elem.classList.contains('active')).toBe(true);
            });

            // now let's click elem1

            runs(function () {
                wasClicked = false;

                elem1.onclick = function () {
                    wasClicked = true;
                };

                elem1.click();
            });

            waitsFor(function () {
                return wasClicked;
            }, "the element should be clicked");

            runs(function () {
                var elem = radio.getActive();
                expect(elem).toBe(elem1);
                expect(elem.classList.contains('active')).toBe(true);
            });
        });

    });

});
