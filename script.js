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

$(document).ready(function() {
    /**
     * The user's selected mode, stored in local storage.
     * @type {string}
     */
    var mode;
    try {
        mode = localStorage.getItem("beginnerMode") || "true";
    } catch (error) {
        console.error("Error accessing localStorage:", error);

        mode = "true";
    }

    /**
     * The icon element that displays the user's current mode.
     * @type {HTMLElement}
     */
    var modeIcon = document.getElementById("mode");

    /**
     * The text element that displays the tooltip for the mode icon.
     * @type {HTMLElement}
     */
    var modeText = document.getElementById("modeText");

    // Set the mode icon and tooltip based on the user's selected mode.
    if (mode === null || mode === "true") {
        modeIcon.innerHTML = "star_border";
        modeText.setAttribute("data-tooltip", "Switch to advanced mode");
    } else {
        modeIcon.innerHTML = "star";
        modeText.setAttribute("data-tooltip", "Switch to beginner mode");
    }

    // Initialize Materialize tooltips.
    $(".tooltipped").tooltip();

    // Initialize Materialize dropdowns.
    $(".materialize-iso, .dropdown-trigger").dropdown({
        constrainWidth: false,
        hover: false, // Activate on click
        belowOrigin: true, // Displays dropdown below the button
    });
});
