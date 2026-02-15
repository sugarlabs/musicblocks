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

requirejs.config({
    baseUrl: "./",
    urlArgs: window.location.protocol === "file:" ? "" : "v=999999_fix7",
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
        "p5-adapter": {
            deps: ["p5.min"]
        },
        "p5.sound.min": {
            deps: ["p5-adapter"]
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
        "activity/turtle-singer": {
            exports: "Singer"
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
            deps: [
                "activity/turtles",
                "activity/notation",
                "utils/synthutils",
                "activity/logoconstants"
            ],
            exports: "Logo"
        },
        "activity/activity": {
            deps: ["utils/utils", "activity/logo", "activity/blocks", "activity/turtles"],
            exports: "Activity"
        },
        "materialize": {
            deps: ["jquery"],
            exports: "M"
        },
        "jquery-ui": {
            deps: ["jquery"]
        },
        "abc": {
            exports: "ABCJS"
        },
        "libgif": {
            exports: "SuperGif"
        },
        "highlight": {
            exports: "hljs"
        },
        "activity/js-export/constraints": {
            deps: ["activity/js-export/interface"]
        },
        "activity/js-export/generate": {
            deps: ["activity/js-export/ASTutils"]
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
        "p5-adapter": "js/p5-adapter",
        "p5-sound-adapter": "js/p5-sound-adapter",
        "domReady": "lib/domReady",
        "jquery": "lib/jquery-3.7.1.min",
        "jquery-ui": "lib/jquery-ui",
        "materialize": "lib/materialize.min",
        "abc": "lib/abc.min",
        "libgif": "https://cdn.jsdelivr.net/gh/buzzfeed/libgif-js/libgif",
        "Tone": "lib/Tone",
        "highlight": "//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min",
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

requirejs(["i18next", "i18nextHttpBackend"], function (i18next, i18nextHttpBackend) {
    // Use globally-loaded jQuery and Materialize (avoids AMD conflicts)
    var $ = window.jQuery;
    // Materialize v0.100.2 (bundled) uses 'Materialize' as global, not 'M'
    var M = window.Materialize || window.M;

    // Ensure both M and Materialize are available for compatibility
    if (typeof M !== "undefined") {
        window.M = M;
        window.Materialize = M;
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

            // Only pre-define modules that are loaded via script tags in index.html
            // These modules are already available as globals before RequireJS loads them
            const PRELOADED_SCRIPTS = [
                { name: "easeljs.min", export: () => window.createjs },
                { name: "tweenjs.min", export: () => window.createjs }
            ];

            PRELOADED_SCRIPTS.forEach(mod => {
                if (!requirejs.defined(mod.name) && mod.export && mod.export()) {
                    define(mod.name, [], function () {
                        return mod.export();
                    });
                }
            });

            // Note: Other modules like activity/*, utils/* are loaded by RequireJS
            // from their file paths as configured in requirejs.config().
            // Do NOT pre-define them here as that prevents RequireJS from loading the actual files.

            const CORE_BOOTSTRAP_MODULES = [
                "easeljs.min",
                "tweenjs.min",
                "preloadjs.min",
                "utils/platformstyle",
                "utils/utils",
                "activity/turtledefs",
                "activity/block",
                "activity/blocks",
                "activity/turtle-singer",
                "activity/turtle-painter",
                "activity/turtle",
                "activity/turtles",
                "utils/synthutils",
                "activity/notation",
                "activity/logo"
            ];

            requirejs(
                CORE_BOOTSTRAP_MODULES,
                function () {
                    // Give scripts a moment to finish executing and set globals
                    setTimeout(function () {
                        // Verify core dependencies are loaded
                        const verificationStatus = {
                            createjs: typeof window.createjs !== "undefined",
                            createDefaultStack: typeof window.createDefaultStack !== "undefined",
                            Logo: typeof window.Logo !== "undefined",
                            Blocks: typeof window.Blocks !== "undefined",
                            Turtles: typeof window.Turtles !== "undefined"
                        };

                        // Check critical dependencies (only createjs is truly critical)
                        if (typeof window.createjs === "undefined") {
                            console.error(
                                "FATAL: createjs (EaselJS/TweenJS) not found. Cannot proceed."
                            );
                            alert("Failed to load EaselJS. Please refresh the page.");
                            return;
                        }

                        // Proceed with activity loading
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
                    }, 100); // Small delay to allow globals to be set
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
});
