/**
 * MusicBlocks Fullscreen Logic
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
var elem = document.documentElement;
function openFullscreen() {
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
        // For safari browser
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
        // For IE(supported above 10)
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    } else if (elem.mozRequestFullscreen) {
        elem.mozRequestFullscreen();
    }
}

function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        /* IE11 */
        document.msExitFullscreen();
    } else if (document.mozExitFullscreen) {
        /* IE11 */
        document.mozExitFullscreen();
    }
}
var count = 0;
function setIcon() {
    var property = document.getElementById("FullScreen");
    var iconCode = document.querySelector("#FullScrIcon");
    //Calling full Screen
    if (count == 0) {
        openFullscreen();
        iconCode.textContent = "\ue5d1";
        count = 1;
    }
    //Closing full Screen
    else {
        closeFullscreen();
        iconCode.textContent = "\ue5d0";
        count = 0;
    }
}
document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
document.addEventListener("mozfullscreenchange", handleFullscreenChange);
document.addEventListener("MSFullscreenChange", handleFullscreenChange);

function handleFullscreenChange() {
    var iconCode = document.querySelector("#FullScrIcon");
    count =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
            ? 1
            : 0;
    iconCode.textContent = count ? "\ue5d1" : "\ue5d0";
}
