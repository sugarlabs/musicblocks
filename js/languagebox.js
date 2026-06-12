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

    /**
     * @public
     * @returns {void}
     */
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
    de_onclick() {
        this._language = "de";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    fr_onclick() {
        this._language = "fr";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    it_onclick() {
        this._language = "it";
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
    ta_onclick() {
        this._language = "ta";
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

    /**
     * @public
     * @returns {void}
     */
    OnClick() {
        this.reload();
    }

    /**
     * @public
     * @returns {void}
     */
    reload() {
        const reloadWindow = () => {
            window.location.reload();
        };

        if (!this.activity || typeof this.activity.saveLocally !== "function") {
            reloadWindow();
            return;
        }

        try {
            const saveResult = this.activity.saveLocally();
            if (saveResult && typeof saveResult.then === "function") {
                saveResult
                    .then(() => {
                        reloadWindow();
                    })
                    .catch(error => {
                        console.error(error);
                    });
                return;
            }
        } catch (e) {
            console.error(e);
            return;
        }

        reloadWindow();
    }

    hide() {
        if (localStorage.getItem("languagePreference") === this._language) {
            if (this._language.includes("ja")) {
                this._language = this._language.split("-")[0];
            }

            try {
                localStorage.setItem("languagePreference", this._language);
            } catch (e) {
                console.warn("Could not save language preference:", e);
            }
            this.activity.textMsg(_("Music Blocks is already set to this language."));
        } else {
            this.activity.storage.languagePreference = this._language;

            if (this._language.includes("ja")) {
                this._language = this._language.split("-")[0];
            }

            this.reload();
        }
    }
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = LanguageBox;
}
