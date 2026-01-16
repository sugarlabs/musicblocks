// Copyright (c) 2015-2024 Yash Khandelwal
//
// AGPL v3+

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
        tween: "../lib/tweenjs", // FIXED typo (twewn → tween)
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
    }
});

/**
 * Bootstrap i18n, then load the app
 */
requirejs(
    ["i18next", "i18nextHttpBackend"],
    function (i18next, i18nextHttpBackend) {

        function updateContent() {
            document
                .querySelectorAll("[data-i18n]")
                .forEach(el => {
                    const key = el.getAttribute("data-i18n");
                    el.textContent = i18next.t(key);
                });
        }

        function initI18n(lang) {
            return new Promise(resolve => {
                i18next
                    .use(i18nextHttpBackend)
                    .init(
                        {
                            lng: lang,
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
                        err => {
                            if (err) {
                                console.error("i18next init failed:", err);
                            }
                            window.i18next = i18next;
                            resolve();
                        }
                    );
            });
        }

        async function main() {
            const lang = "en"; // single source of truth

            await initI18n(lang);

            // Initial render
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", updateContent);
            } else {
                updateContent();
            }

            // Re-render on language change
            i18next.on("languageChanged", updateContent);

            // Load the actual application AFTER i18n is ready
            requirejs(["utils/utils", "activity/activity"]);
        }

        main();
    }
);
