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

if (typeof requirejs !== "undefined") {
    requirejs.config({
        baseUrl: "lib",
        shim: {
            easel: {
                exports: "createjs"
            }
        },
        paths: {
            utils: "../js/utils",
            widgets: "../js/widgets",
            activity: "../js",
            easel: "../lib/easeljs",
            twewn: "../lib/tweenjs",
            prefixfree: "../bower_components/prefixfree/prefixfree.min",
            samples: "../sounds/samples",
            planet: "../js/planet",
            tonejsMidi: "../node_modules/@tonejs/midi/dist/Midi",
            i18next: [
                "../lib/i18next.min",
                "https://cdn.jsdelivr.net/npm/i18next@23.11.5/dist/umd/i18next.min"
            ],
            i18nextHttpBackend: [
                "../lib/i18nextHttpBackend.min",
                "https://cdn.jsdelivr.net/npm/i18next-http-backend@2.5.1/i18nextHttpBackend.min"
            ]
        },
        packages: []
    });

    requirejs(["i18next", "i18nextHttpBackend"], function (i18next, i18nextHttpBackend) {
        let l10nElements = null;

        function getLanguage() {
            let lang = navigator.language;
            if (localStorage.languagePreference) {
                lang = localStorage.languagePreference;
            }
            return lang || "enUS";
        }

requirejs.config({
    baseUrl: "lib",
    shim: {
        "easel": {
            exports: "createjs"
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
        }
    },
    paths: {
        "utils": "../js/utils",
        "widgets": "../js/widgets",
        "activity": "../js",
        "easel": "../lib/easeljs",
        "twewn": "../lib/tweenjs",
        "prefixfree": "../bower_components/prefixfree/prefixfree.min",
        "samples": "../sounds/samples",
        "planet": "../js/planet",
        "tonejsMidi": "../node_modules/@tonejs/midi/dist/Midi",
        "p5.min": "../lib/p5.min",
        "p5.sound.min": "../lib/p5.sound.min",
        "p5.dom.min": "../lib/p5.dom.min",
        "p5-adapter": "../js/p5-adapter",
        "p5-sound-adapter": "../js/p5-sound-adapter",
        "i18next": [
            "../lib/i18next.min",
            "https://cdn.jsdelivr.net/npm/i18next@23.11.5/dist/umd/i18next.min"
        ],
        "i18nextHttpBackend": [
            "../lib/i18nextHttpBackend.min",
            "https://cdn.jsdelivr.net/npm/i18next-http-backend@2.5.1/i18nextHttpBackend.min"
        ]
    },
    packages: []
});


        function updateContent() {
            console.log("updateContent() called");
            if (!l10nElements) {
                l10nElements = document.querySelectorAll("[data-i18n]");
            }


            l10nElements.forEach(element => {
                const key = element.getAttribute("data-i18n");
                const translation = i18next.t(key);
                if (element.textContent !== translation) {
                    element.textContent = translation;

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
            });
        }

        const APP_VERSION = "3.4.1";

        async function initializeI18next() {
            return new Promise((resolve, reject) => {
                i18next.use(i18nextHttpBackend).init(
                    {
                        lng: getLanguage(),
                        fallbackLng: "en",
                        dontVars: true,
                        keySeparator: false,
                        nsSeparator: false,
                        interpolation: {
                            escapeValue: false
                        },
                        backend: {
                            loadPath: "locales/{{lng}}.json?v=" + APP_VERSION
                        }
                    },
                    function (err, t) {
                        if (err) {
                            console.error("i18next init failed:", err);
                            reject(err);
                        } else {
                            console.log("i18next initialized");
                            window.i18next = i18next;
                            resolve(i18next);
                        }
                    }
                );
            });
        }

        async function main() {
            try {
                await initializeI18next();

                // Setup language change listener
                i18next.on("languageChanged", function () {
                    // Reset elements cache on language change if needed, 
                    // though DOM structure usually stays same
                    updateContent();
                });

                if (document.readyState === "loading") {
                    document.addEventListener("DOMContentLoaded", function () {
                        updateContent();
                    });
                } else {
                    console.log("DOM already loaded, updating content immediately");
                    updateContent();
                }

                // Load application logic after i18n is ready
                requirejs(["utils/utils", "activity/activity"]);

            } catch (error) {
                console.error("Error initializing app:", error);
            }
        }


        main();
    });
}
=======
    main();
});

