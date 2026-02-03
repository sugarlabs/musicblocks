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
        ],
        // Phase 2: Offline Mode & Cloud Sync modules
        "WorkspaceStorage": "../js/WorkspaceStorage",
        "SyncManager": "../js/SyncManager",
        "ConflictResolver": "../js/ConflictResolver",
        // Phase 3: Version Control
        "VersionControl": "../js/VersionControl"
    },
    packages: []
});

requirejs(["i18next", "i18nextHttpBackend"], function (i18next, i18nextHttpBackend) {
    function updateContent() {
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
        await initializeI18next();

        const lang = "en";

        i18next.changeLanguage(lang, function (err) {
            if (err) {
                console.error("Error changing language:", err);
                return;
            }
            updateContent();
        });

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
