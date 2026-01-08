/**
 * MusicBlocks v3.4.1
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

// Loading Dialog and Splash Screen
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

// Sticky Table Extensions for jQuery
(function ($) {
    $.fn.fixMe = function () {
        return this.each(function () {
            let $this = $(this),
                $t_fixed;

            function init() {
                $this.wrap('<div class="container" />');
                $t_fixed = $this.clone();
                $t_fixed.find("tbody").remove().end().addClass("fixed").insertBefore($this);
                resizeFixed();
            }

            function resizeFixed() {
                setTimeout(function () {
                    $t_fixed.find("th").each(function (index) {
                        $(this).css("width", $this.find("th").eq(index).outerWidth() + "px");
                    });
                }, 100);
            }

            function scrollFixed() {
                let offset = $(this).scrollTop(),
                    tableOffsetTop = $this.offset().top,
                    tableOffsetBottom =
                        tableOffsetTop + $this.height() - $this.find("thead").height();

                if (offset < tableOffsetTop || offset > tableOffsetBottom) {
                    $t_fixed.hide();
                } else if (
                    offset >= tableOffsetTop &&
                    offset <= tableOffsetBottom &&
                    $t_fixed.is(":hidden")
                ) {
                    $t_fixed.show();
                }
            }

            $(window).resize(resizeFixed);
            $(window).scroll(scrollFixed);
            init();
        });
    };
    jQuery;

    $(document).ready(function () {
        $("solfa").fixMe();
        $(".up").click(function () {
            $("html, body").animate(
                {
                    scrollTop: 0
                },
                2000
            );
        });
    });
})(jQuery);

let isDragging = false;

// Fullscreen Logic
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

// Play Only Mode Logic
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
