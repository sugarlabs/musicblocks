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

requirejs(["i18next", "i18nextHttpBackend"], function(i18next, i18nextHttpBackend) {

    function updateContent() {
        console.log("updateContent() called");  // Debugging line
        const elements = document.querySelectorAll("[data-i18n]");

        elements.forEach((element) => {
            const key = element.getAttribute("data-i18n");
            const translation = i18next.t(key);
            element.textContent = translation;
        });
    }

    async function initializeI18next() {
        return new Promise((resolve, reject) => {
            i18next
                .use(i18nextHttpBackend)
                .init({
                    lng: "en",
                    fallbackLng: "en",
                    keySeparator: false,
                    nsSeparator: false,
                    interpolation: {
                        escapeValue: false
                    },
                    backend: {
                        loadPath: "locales/{{lng}}.json?v="+Date.now()
                    }
                }, function(err, t) {
                    if (err) {
                        console.error("i18next init failed:", err);
                        reject(err);
                    } else {
                        console.log("i18next initialized");
                        window.i18next = i18next;
                        console.log("i18next Store:", i18next.store.data);
                        resolve(i18next);
                    }
                });
            

            i18next.on("initialized", function() {
                console.log("i18next initialized");
            });

            i18next.on("loaded", function(loaded) {
                console.log("i18next loaded:", loaded);
            });

         

    
        });
    }

    async function main() {
        try {
            await initializeI18next();

            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", function() {
                    updateContent();
                });
            } else {
                console.log("DOM already loaded, updating content immediately");
                updateContent();
            }
        } catch (error) {
            console.error("Error initializing i18next:", error);
        }
    }

    main().then(() => {
        requirejs(["utils/utils", "activity/activity"]);
    });

    i18next.changeLanguage(lang, (err, t) => {
        if (err) {
            console.error("Error changing language:", err);
            return;
        }
        updateContent();
    });

    i18next.on("languageChanged", function() {
        updateContent();
    });
});

// requirejs(["utils/utils", "activity/activity"]);
