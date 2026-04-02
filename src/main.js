// Music Blocks Unified ESM Entry Point

// 1. Initialize Globals (Legacy Support)
window._THIS_IS_MUSIC_BLOCKS_ = true;
window._THIS_IS_TURTLE_BLOCKS_ = false;

// 2. Import Styles (Vite handles these automatically when imported)
import "../css/activities.css";
import "../dist/css/style.css";
import "../dist/css/keyboard.css";
import "../dist/css/windows.css";
import "../lib/materialize-iso.css";
import "../css/darkmode.css";
import "../css/themes.css";

// 3. Import Libraries (Legacy/Lib-based)
// These are loaded as side-effects to set global variables
import "../lib/jquery-3.7.1.min.js";
import "../lib/jquery-ui.js";
import "../lib/materialize.min.js";
import "../lib/Tone.js";
import "../lib/midi.js";
import "../lib/easeljs.min.js";
import "../lib/tweenjs.min.js";
import "../lib/modernizr-2.6.2.min.js";
import "../lib/raphael.min.js";
import "../lib/wheelnav.js";
import "../lib/abc.min.js";
import "../lib/codejar/codejar.min.js";
import "../lib/codejar/highlight.pack.js";
import "../lib/astring.min.js";
import "../lib/acorn.min.js";
import "../lib/reqwest.js";
import "../js/utils/mb-dialog.js";
import "../js/gif-animator.js";

// 4. Import Core Modules
import { Activity } from "../js/activity.js";

document.addEventListener("DOMContentLoaded", () => {
    console.log("Music Blocks: Unified Bootstrap Starting...");

    // Initialize jQuery logic that was previously inline in index.html
    if (typeof jQuery !== "undefined") {
        jQuery(document).ready(function () {
            if (jQuery.ui && jQuery.ui.autocomplete) {
                jQuery.fn.materializeAutocomplete = jQuery.fn.autocomplete;
                jQuery.widget.bridge("autocomplete", jQuery.ui.autocomplete);
            }

            const fixAutocompletePosition = function () {
                const $search = jQuery("#search");
                if ($search.length && $search.data("ui-autocomplete")) {
                    const instance = $search.autocomplete("instance");
                    if (instance) {
                        const originalRenderMenu = instance._renderMenu;
                        instance._renderMenu = function (ul, items) {
                            originalRenderMenu.call(this, ul, items);
                            setTimeout(() => {
                                const searchInput = document.querySelector("#search");
                                const dropdown = ul[0];
                                if (searchInput && dropdown) {
                                    const rect = searchInput.getBoundingClientRect();
                                    dropdown.style.position = "fixed";
                                    dropdown.style.left = rect.left + "px";
                                    dropdown.style.top = rect.bottom + 2 + "px";
                                    dropdown.style.width = rect.width + "px";
                                }
                            }, 0);
                        };
                    }
                } else {
                    setTimeout(fixAutocompletePosition, 500);
                }
            };
            setTimeout(fixAutocompletePosition, 1000);
        });
    }

    // Initialize CreateJS logic that was previously inline in index.html
    const initCreateJS = () => {
        if (typeof createjs === "undefined") {
            setTimeout(initCreateJS, 50);
            return;
        }
        const canvas = document.getElementById("canvas");
        if (canvas) {
            window.stage = new createjs.Stage(canvas);
            createjs.Ticker.framerate = 60;
        }
    };
    initCreateJS();

    // Load AST config
    fetch("js/js-export/ast2blocks.min.json")
        .then(response => response.json())
        .then(data => {
            window.ast2blocklist_config = data;
        });

    // Initialize main Activity
    const activity = new Activity();
    window.activity = activity;

    // Start initialization
    activity.setupDependencies();
    activity._startRenderLoop();

    // PWA Service Worker
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").then(
            function (registration) {
                console.log(
                    "ServiceWorker registration successful with scope: ",
                    registration.scope
                );
            },
            function (err) {
                console.log("ServiceWorker registration failed: ", err);
            }
        );
    }

    console.log("Music Blocks: Unified Bootstrap Complete.");
});
