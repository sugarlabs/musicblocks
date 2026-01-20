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
        tween: "../lib/tweenjs",
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

requirejs(["i18next", "i18nextHttpBackend"], function (i18next, i18nextHttpBackend) {
    function updateContent() {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            el.textContent = i18next.t(key);
        });
    }

    function initI18n(lang) {
        return new Promise(resolve => {
            i18next.use(i18nextHttpBackend).init(
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
        const lang = "en";

        await initI18n(lang);

        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", updateContent);
        } else {
            updateContent();
        }

        i18next.on("languageChanged", updateContent);

        // Load app only after i18n is ready
        requirejs(["utils/utils", "activity/activity"]);
    }

    main();
});
