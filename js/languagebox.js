// Copyright (c) 2018-21 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

//A dropdown for selecting language

/*
   global _
*/

/* exported LanguageBox */

class LanguageBox {
    /**
     * @constructor
     */
    constructor(activity) {
        this.activity = activity;
        this._language = activity.storage.languagePreference;
    }

    /**
     * @public
     * @returns {void}
     */
    changeLanguage(lang, kanaVal = null) {
        if (typeof i18next === "undefined") {
            console.error("i18next is not defined");
            return;
        }

        // Handle Japanese kana/kanji preference
        if (kanaVal) {
            this.activity.storage.kanaPreference = kanaVal;
        }

        // Update local storage
        try {
            localStorage.setItem("languagePreference", lang);
        } catch (e) {
            console.warn("Could not save language preference:", e);
        }

        this._language = lang;

        // Change language in i18next
        i18next.changeLanguage(lang, (err, t) => {
            if (err) {
                console.error("something went wrong loading", err);
                return;
            }

            // Update URL without reloading
            const url = new URL(window.location);
            url.searchParams.set("lang", lang);
            window.history.pushState({}, "", url);

            // Trigger activity refresh
            if (this.activity && typeof this.activity.refreshLanguage === "function") {
                this.activity.refreshLanguage();
            }

            this.hide();
        });
    }

    /**
     * @public
     * @returns {void}
     */
    enUS_onclick() {
        this.changeLanguage("enUS");
    }

    /**
     * @public
     * @returns {void}
     */
    enUK_onclick() {
        this.changeLanguage("enUK");
    }

    /**
     * @public
     * @returns {void}
     */
    ko_onclick() {
        this.changeLanguage("ko");
    }

    /**
     * @public
     * @returns {void}
     */
    ja_onclick() {
        this.changeLanguage("ja", "kanji");
    }

    kana_onclick() {
        this.changeLanguage("ja", "kana");
    }

    /**
     * @public
     * @returns {void}
     */
    es_onclick() {
        this.changeLanguage("es");
    }

    /**
     * @public
     * @returns {void}
     */
    pt_onclick() {
        this.changeLanguage("pt");
    }

    /**
     * @public
     * @returns {void}
     */
    zhCN_onclick() {
        this.changeLanguage("zh_CN");
    }

    /**
     * @public
     * @returns {void}
     */
    th_onclick() {
        this.changeLanguage("th");
    }

    /**
     * @public
     * @returns {void}
     */
    hi_onclick() {
        this.changeLanguage("hi");
    }

    /**
     * @public
     * @returns {void}
     */
    ibo_onclick() {
        this.changeLanguage("ibo");
    }

    /**
     * @public
     * @returns {void}
     */
    ar_onclick() {
        this.changeLanguage("ar");
    }

    /**
     * @public
     * @returns {void}
     */
    he_onclick() {
        this.changeLanguage("he");
    }
    /**
     * @public
     * @returns {void}
     */
    te_onclick() {
        this.changeLanguage("te");
    }

    /**
     * @public
     * @returns {void}
     */
    tr_onclick() {
        this.changeLanguage("tr");
    }

    /**
     * @public
     * @returns {void}
     */
    ayc_onclick() {
        this.changeLanguage("ayc");
    }

    /**
     * @public
     * @returns {void}
     */
    quz_onclick() {
        this.changeLanguage("quz");
    }

    /**
     * @public
     * @returns {void}
     */
    bn_onclick() {
        this.changeLanguage("bn");
    }

    /**
     * @public
     * @returns {void}
     */
    gug_onclick() {
        this.changeLanguage("gug");
    }

    /**
     * @public
     * @returns {void}
     */
    ur_onclick() {
        this.changeLanguage("ur");
    }

    /**
     * @public
     * @returns {void}
     */
    OnClick() {
        // No longer needed to reload
    }

    /**
     * @public
     * @returns {void}
     */
    reload() {
        // Deprecated
        // window.location.reload();
    }

    hide() {
        const languageLinks = document.querySelectorAll(".language-link");
        languageLinks.forEach(link => {
            // Updated to not force reload on generic click if handled by specific handlers
            // link.addEventListener("click", () => this.OnClick());
        });
    }
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = LanguageBox;
}
