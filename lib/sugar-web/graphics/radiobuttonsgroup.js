/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2015 Walter Bender
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

define(function () {

    'use strict';

    var radioButtonsGroup = {};

    // ## RadioButtonsGroup
    //
    // A group of elements where only one can be active at the same
    // time.
    //
    // When an element is clicked, it becomes the active one.  The
    // active element gains the 'active' CSS class.
    //
    // Parameters:
    //
    // * **elems** Array of elements of the group.
    radioButtonsGroup.RadioButtonsGroup = function (elems) {
        this.elems = elems;
        var active;

        for (var i = 0; i < elems.length; i++) {
            var elem = elems[i];
            elem.addEventListener("click", clickHandler);

            // The first element that has 'active' CSS class is made
            // the active of the group on startup.
            if (active === undefined && elem.classList.contains('active')) {
                active = elem;
            }
        }

        // If no element has 'active' CSS class, the first element of
        // the array is made the active.
        if (active === undefined) {
            active = elems[0];
            updateClasses();
        }

        function clickHandler(evt) {
            active = evt.target;
            updateClasses();
        }

        function updateClasses() {
            for (i = 0; i < elems.length; i++) {
                var elem = elems[i];
                elem.classList.remove('active');
            }
            active.classList.add('active');
        }

        // Get the active element.
        this.getActive = function () {
            return active;
        };

    };

    return radioButtonsGroup;

});