// Copyright (c) 2015-2024 Yash Khandelwal
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global requirejs */

// DEBUG: Catch RequireJS errors to identify anonymous define() sources
requirejs.onError = function (err) {
    console.error("=== RequireJS Error ===");
    console.error("Type:", err.requireType);
    console.error("Modules:", err.requireModules);
    console.error("Original Error:", err);
    if (err.requireType === "mismatch") {
        console.error("MISMATCH DETECTED - Check for anonymous define() in:", err.requireModules);
    }
    throw err;
};

requirejs.config({
    baseUrl: "./",
    urlArgs: window.location.protocol === "file:" ? "" : "v=999999_fix5",
    waitSeconds: 60,
    shim: {
        "easeljs.min": {
            exports: "createjs"
        },
        "tweenjs.min": {
            exports: "createjs"
        },
        "preloadjs.min": {
            exports: "createjs"
        },
        "Tone": {
            exports: "Tone"
        },
        "howler": {
            exports: "Howl"
        },
        "Chart": {
            exports: "Chart"
        },
        "p5.min": {
            exports: "p5"
        },
        // p5-adapter: Wraps p5.min, saves Tone.js and AudioContext before p5.sound loads
        // This prevents p5.sound from hijacking Music Blocks' audio infrastructure
        "p5-adapter": {
            deps: ["p5.min"]  // p5 must load before adapter
        },
        // p5.sound: Must load AFTER p5-adapter to preserve Tone.js and AudioContext
        // p5-adapter saves original Tone.js before p5.sound can overwrite it
        "p5.sound.min": {
            deps: ["p5-adapter"]  // Ensures p5 loads first, then adapter, then p5.sound
        },
        "p5.dom.min": {
            deps: ["p5.min"]
        },
        "p5-sound-adapter": {
            deps: ["p5.sound.min"]
        },
        "utils/utils": {
            deps: ["utils/platformstyle"],
            exports: "_"
        },
        "activity/turtledefs": {
            deps: ["utils/utils"],
            exports: "createDefaultStack"
        },
        "activity/block": {
            deps: ["activity/turtledefs"],
            exports: "Block"
        },
        "activity/blocks": {
            deps: ["activity/block"],
            exports: "Blocks"
        },
        "activity/logoconstants": {
            deps: ["utils/utils"],
            exports: "TARGETBPM"  // Exports TARGETBPM, TONEBPM, and other constants
        },
        "activity/turtle-painter": {
            exports: "Painter"
        },
        "activity/turtle": {
            deps: ["activity/turtledefs", "activity/turtle-singer", "activity/turtle-painter"],
            exports: "Turtle"
        },
        "activity/turtles": {
            deps: ["activity/turtle"],
            exports: "Turtles"
        },
        "activity/notation": {
            exports: "Notation"
        },
        "utils/synthutils": {
            deps: ["utils/utils"],
            exports: "Synth"
        },
        "activity/logo": {
            deps: ["activity/turtles", "activity/notation", "utils/synthutils"],
            exports: "Logo"
        },
        "activity/activity": {
            deps: ["utils/utils", "activity/logo", "activity/blocks", "activity/turtles"],
            exports: "Activity"
        },
        // Materialize: Bundles Velocity and Hammer internally. 
        // We've extracted these as named defines in lib/materialize.min.js
        // to satisfy RequireJS architecture rules.
        "materialize": {
            deps: ["jquery", "velocity", "hammerjs"],
            exports: "M"
        },
        "velocity": {
            deps: ["jquery"],
            exports: "jQuery.Velocity"
        },
        "hammerjs": {
            deps: ["jquery"],
            exports: "Hammer"
        },
        "jquery-ui": {
            deps: ["jquery"]
        },
        "abc": {
            exports: "ABCJS"
        },
        // libgif (SuperGif): External CDN library for GIF frame extraction
        // Loaded from CDN, exports SuperGif to window
        "libgif": {
            exports: "SuperGif"
        },
        "highlight": {
            exports: "hljs"
        },
        "midi": {
            exports: "Midi"
        },
        "raphael": {
            exports: "Raphael"
        },
        "wheelnav": {
            deps: ["raphael"],
            exports: "wheelnav"
        },
        "jquery.ruler": {
            deps: ["jquery"]
        },
        "astring": {
            exports: "astring"
        },
        "acorn": {
            exports: "acorn"
        }
    },
    paths: {
        "utils": "js/utils",
        "widgets": "js/widgets",
        "activity": "js",
        "easeljs.min": "lib/easeljs.min",
        "tweenjs.min": "lib/tweenjs.min",
        "preloadjs.min": "lib/preloadjs.min",
        "prefixfree.min": "lib/prefixfree.min",
        "howler": "lib/howler",
        "Chart": "lib/Chart",
        "samples": "sounds/samples",
        "planet": "js/planet",
        "tonejsMidi": "node_modules/@tonejs/midi/dist/Midi",
        "p5.min": "lib/p5.min",
        "p5.sound.min": "lib/p5.sound.min",
        "p5.dom.min": "lib/p5.dom.min",
        "p5.dom": "lib/p5.dom.min",  // Alias for p5.dom without .min suffix
        "p5-adapter": "js/p5-adapter",
        "p5-sound-adapter": "js/p5-sound-adapter",
        "domReady": "lib/domReady",
        "jquery": "lib/jquery-3.7.1.min",
        "jquery-ui": "lib/jquery-ui",
        "materialize": "lib/materialize.min",
        "velocity": "lib/materialize.min",
        "hammerjs": "lib/materialize.min",
        "abc": "lib/abc.min",
        "libgif": "https://cdn.jsdelivr.net/gh/buzzfeed/libgif-js/libgif",
        "Tone": "lib/Tone",
        "highlight": "lib/codejar/highlight.pack",
        "midi": "lib/midi",
        "webL10n": "lib/webL10n",
        "jquery.ruler": "lib/jquery.ruler",
        "modernizr": "lib/modernizr-2.6.2.min",
        "raphael": "lib/raphael.min",
        "wheelnav": "lib/wheelnav",
        "codejar": "lib/codejar/codejar.min",
        "astring": "lib/astring.min",
        "acorn": "lib/acorn.min",
        "i18next": [
            "lib/i18next.min",
            "https://cdn.jsdelivr.net/npm/i18next@23.11.5/dist/umd/i18next.min"
        ],
        "i18nextHttpBackend": [
            "lib/i18nextHttpBackend.min",
            "https://cdn.jsdelivr.net/npm/i18next-http-backend@2.5.1/i18nextHttpBackend.min"
        ]
    },
    packages: []
});


requirejs(
    // CORE BOOTSTRAP: These libraries are now exclusively managed by RequireJS.
    // Script tags for these were removed from index.html to prevent duplicate loading
    // and "Mismatched anonymous define()" errors.
    [
        "i18next",
        "i18nextHttpBackend",
        "jquery",
        "materialize",
        "jquery-ui"
    ],
    function (i18next, i18nextHttpBackend, $, M) {
        // Materialize exports M
        if (typeof M !== "undefined") {
            window.M = M;
        }
        // Ensure jQuery is global for legacy plugins
        if (typeof $ !== "undefined") {
            window.jQuery = window.$ = $;
        }

        // Define essential globals for core modules
        window._THIS_IS_MUSIC_BLOCKS_ = true;
        window._THIS_IS_TURTLE_BLOCKS_ = false;

        // Load highlight optionally
        requirejs(
            ["highlight"],
            function (hljs) {
                if (hljs) {
                    window.hljs = hljs;
                    hljs.highlightAll();
                }
            },
            function (err) {
                console.warn("Highlight.js failed to load, moving on...", err);
            }
        );

        function updateContent() {
            if (!i18next.isInitialized) return;
            const elements = document.querySelectorAll("[data-i18n]");
            elements.forEach(element => {
                const key = element.getAttribute("data-i18n");
                element.textContent = i18next.t(key);
            });
        }

        function initializeI18next() {
            return new Promise(resolve => {
                i18next.use(i18nextHttpBackend).init(
                    {
                        lng: "en",
                        fallbackLng: "en",
                        keySeparator: false,
                        nsSeparator: false,
                        interpolation: {
                            escapeValue: false
                        },
                        backend: {
                            loadPath: "locales/{{lng}}.json?v=" + Date.now()
                        }
                    },
                    function (err) {
                        if (err) {
                            console.error("i18next init failed:", err);
                        }
                        window.i18next = i18next;
                        resolve(i18next);
                    }
                );
            });
        }

        async function main() {
            try {
                await initializeI18next();

                if (typeof M !== "undefined" && M.AutoInit) {
                    M.AutoInit();
                }

                const lang = "en";
                i18next.changeLanguage(lang, function (err) {
                    if (err) {
                        console.error("Error changing language:", err);
                    }
                    updateContent();
                });

                if (document.readyState === "loading") {
                    document.addEventListener("DOMContentLoaded", updateContent);
                } else {
                    updateContent();
                }

                i18next.on("languageChanged", updateContent);

                // Two-phase bootstrap: load core modules first, then application modules
                const waitForGlobals = async (retryCount = 0) => {
                    if (typeof window.createjs === "undefined" && retryCount < 50) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                        return waitForGlobals(retryCount + 1);
                    }
                };

                await waitForGlobals();

                // No manual define hacks - we use proper AMD modules now
                const CORE_BOOTSTRAP_MODULES = [
                    "jquery",  // Must load first - many modules depend on it
                    "easeljs.min",
                    "tweenjs.min",
                    "preloadjs.min",
                    "libgif",
                    "Tone",
                    "midi",
                    "abc",
                    "highlight",
                    "utils/platformstyle",
                    "utils/utils",
                    "activity/turtledefs",
                    "activity/block",
                    "activity/blocks",
                    "utils/synthutils",
                    "activity/notation",
                    "activity/logoconstants",  // Must load before turtle-singer (provides TARGETBPM, TONEBPM)
                    "activity/logo",
                    "activity/turtle-singer",
                    "activity/turtle-painter",
                    "activity/turtle",
                    "activity/turtles"
                ];

                requirejs(
                    CORE_BOOTSTRAP_MODULES,
                    function () {
                        // Verify critical globals are initialized
                        const verificationErrors = [];

                        if (typeof window.createjs === "undefined") {
                            verificationErrors.push("createjs (EaselJS/TweenJS) not found");
                        }

                        if (
                            typeof window.createDefaultStack === "undefined" &&
                            typeof arguments[11] === "undefined"
                        ) {
                            verificationErrors.push("createDefaultStack not initialized");
                        }

                        if (
                            typeof window.Logo === "undefined" &&
                            typeof arguments[20] === "undefined"
                        ) {
                            verificationErrors.push("Logo not initialized");
                        }

                        if (
                            typeof window.Blocks === "undefined" &&
                            typeof arguments[13] === "undefined"
                        ) {
                            verificationErrors.push("Blocks not initialized");
                        }

                        if (
                            typeof window.Turtles === "undefined" &&
                            typeof arguments[17] === "undefined"
                        ) {
                            verificationErrors.push("Turtles not initialized");
                        }

                        if (verificationErrors.length > 0) {
                            console.error(
                                "FATAL: Core bootstrap verification failed:",
                                verificationErrors
                            );
                            alert(
                                "Failed to initialize Music Blocks core modules. Please refresh the page.\n\nMissing: " +
                                verificationErrors.join(", ")
                            );
                            throw new Error(
                                "Core bootstrap failed: " + verificationErrors.join(", ")
                            );
                        }

                        requirejs(
                            ["activity/activity"],
                            function () {
                                // Activity loaded successfully
                            },
                            function (err) {
                                console.error("Failed to load activity/activity:", err);
                                alert("Failed to load Music Blocks. Please refresh the page.");
                            }
                        );
                    },
                    function (err) {
                        console.error("Core bootstrap failed:", err);
                        alert(
                            "Failed to initialize Music Blocks core. Please refresh the page.\n\nError: " +
                            (err.message || err)
                        );
                    }
                );
            } catch (e) {
                console.error("Error in main bootstrap:", e);
            }
        }

        main().catch(err => console.error("Main execution failed:", err));
    }
);
