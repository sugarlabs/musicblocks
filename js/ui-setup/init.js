/**
 * MusicBlocks Link
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

// Initialize CreateJS Stage
let canvas, stage;
function init() {
    canvas = document.getElementById("canvas");
    stage = new createjs.Stage(canvas);

    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick", stage);
}
document.addEventListener("DOMContentLoaded", init);

// Service Worker Registration
if ("serviceWorker" in navigator) {
    if (navigator.serviceWorker.controller) {
        console.debug("[PWA Builder] active service worker found, no need to register");
    } else {
        // Register the service worker
        navigator.serviceWorker.register("/sw.js").then(function (reg) {
            console.debug(
                "[PWA Builder] Service worker has been registered for scope: " + reg.scope
            );
        });
    }
}

// Initial Search Call
$(document).ready(function () {
    if (typeof doSearch === "function") {
        doSearch();
    }
});

let isDragging = false;
