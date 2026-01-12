/**
 * MusicBlocks Splash Screen
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
    let loadL10nSplashScreen = function () {
        console.debug("The browser is set to " + navigator.language);
        let lang = navigator.language;
        if (localStorage.languagePreference) {
            console.debug("Music Blocks is set to " + localStorage.languagePreference);
            lang = localStorage.languagePreference;
        }

        console.debug("Using " + lang);
        if (lang === undefined) {
            lang = "enUS";
            console.debug("Reverting to " + lang);
        }

        const container = document.getElementById("loading-media");
        const content = lang.startsWith("ja")
            ? `<img src="loading-animation-ja.svg" loading="eager" fetchpriority="high" style="width: 70%; height: 90%; object-fit: contain;" alt="Loading animation">`
            : `<video loop autoplay muted playsinline fetchpriority="high" style="width: 90%; height: 100%; object-fit: contain;">
                <source src="loading-animation.webm" type="video/webm">
                <source src="loading-animation.mp4" type="video/mp4">
               </video>`;
        container.innerHTML = `<div class="media-wrapper" style="width: 100%; aspect-ratio: 16/9; max-height: 500px; display: flex; justify-content: center; align-items: center;">${content}</div>`;
    };

    loadL10nSplashScreen();

    setTimeout(function () {
        const loadingText = document.getElementById("loadingText");
        const texts = [
            _("Do, Re, Mi, Fa, Sol, La, Ti, Do"),
            _("Loading Music Blocks..."),
            _("Reading Music...")
        ];
        let index = 0;

        const intervalId = setInterval(function () {
            loadingText.textContent = texts[index];
            index = (index + 1) % texts.length;
        }, 1500);

        // Stop changing text and finalize loading after 6 seconds
        setTimeout(function () {
            clearInterval(intervalId);
            loadingText.textContent = _("Loading Complete!");
            loadingText.style.opacity = 1;
        }, 6000);
    }, 3000);
});
