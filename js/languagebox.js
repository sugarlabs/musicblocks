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
   global _, createHelpContent
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
    enUS_onclick() {
        this._language = "enUS";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    enUK_onclick() {
        this._language = "enUK";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    ko_onclick() {
        this._language = "ko";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    ja_onclick() {
        this._language = "ja-kanji";
        this.activity.storage.kanaPreference = "kanji";
        this.hide();
    }

    kana_onclick() {
        this._language = "ja-kana";
        this.activity.storage.kanaPreference = "kana";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    es_onclick() {
        this._language = "es";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    pt_onclick() {
        this._language = "pt";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    zhCN_onclick() {
        this._language = "zh_CN";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    th_onclick() {
        this._language = "th";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    hi_onclick() {
        this._language = "hi";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    ibo_onclick() {
        this._language = "ibo";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    ar_onclick() {
        this._language = "ar";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    he_onclick() {
        this._language = "he";
        this.hide();
    }
    /**
     * @public
     * @returns {void}
     */
    te_onclick() {
        this._language = "te";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    tr_onclick() {
        this._language = "tr";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    ayc_onclick() {
        this._language = "ayc";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    quz_onclick() {
        this._language = "quz";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    bn_onclick() {
        this._language = "bn";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    gug_onclick() {
        this._language = "gug";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    ur_onclick() {
        this._language = "ur";
        this.hide();
    }

    reload() {
        window.location.reload();
    }

    hide() {
        let lang = this._language;

        // Extract base language code for Japanese variations
        if (lang.includes("ja")) {
            lang = lang.split("-")[0];
        }

        // Save the project before switching languages to prevent data loss
        if (this.activity && typeof this.activity.saveLocally === "function") {
            this.activity.saveLocally();
        }

        // Update localStorage with the new language setting
        try {
            localStorage.setItem("languagePreference", lang);
        } catch (e) {
            console.warn("Could not save language preference:", e);
        }

        // Force a browser reload to apply the new language
        window.location.reload();
    }
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = LanguageBox;
}
