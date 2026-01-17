/**
 * MusicBlocks Play Only Mode
 *
 * @author Walter Bender
 *
 * @copyright 2026 Walter Bender
 *
 * @license
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
document.addEventListener("DOMContentLoaded", function () {
    let persistentNotification = null;

    function showPersistentNotification() {
        if (!persistentNotification) {
            persistentNotification = document.createElement("div");
            persistentNotification.id = "persistentNotification";
            persistentNotification.innerHTML =
                "Play only mode enabled. For full Music Blocks experience, use a larger display.";
            document.body.appendChild(persistentNotification);
        }
    }

    function removePersistentNotification() {
        if (persistentNotification) {
            persistentNotification.remove();
            persistentNotification = null;
        }
    }

    function hideElementById(elementId) {
        const elem = document.getElementById(elementId);
        if (elem) {
            elem.style.display = "none";
        }
    }

    function showElementById(elementId) {
        const elem = document.getElementById(elementId);
        if (elem) {
            elem.style.display = "";
        }
    }

    function togglePlayOnlyMode() {
        const isSmallScreen = window.innerWidth < 768 || window.innerHeight < 600;
        const body = document.body;
        const homeButton = document.getElementById("Home [HOME]");
        const buttonContainer = document.getElementById("buttoncontainerBOTTOM");

        if (isSmallScreen) {
            // Enable play-only mode
            body.classList.add("play-only");
            showPersistentNotification();

            if (buttonContainer) {
                buttonContainer.style.display = "flex";
                buttonContainer.style.justifyContent = "flex-end";
                buttonContainer.style.alignItems = "center";
            }
            if (homeButton) {
                homeButton.style.display = "flex";
                homeButton.style.position = "fixed";
                homeButton.style.right = "15px";
                homeButton.style.bottom = "15px";
                homeButton.style.zIndex = "10000";
            }

            // Hide certain elements
            hideElementById("Show/hide blocks");
            hideElementById("Expand/collapse blocks");
            hideElementById("Decrease block size");
            hideElementById("Increase block size");
            hideElementById("grid");
            hideElementById("palette");
        } else {
            // Disable play-only mode
            body.classList.remove("play-only");
            removePersistentNotification();

            if (homeButton) homeButton.style = "";
            if (buttonContainer) buttonContainer.style = "";

            showElementById("Show/hide blocks");
            showElementById("Expand/collapse blocks");
            showElementById("Decrease block size");
            showElementById("Increase block size");
            showElementById("grid");
            showElementById("palette");
        }
    }

    togglePlayOnlyMode();

    window.addEventListener("resize", togglePlayOnlyMode);
});
