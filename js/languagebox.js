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
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    enUK_onclick() {
        this._language = "enUK";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    ko_onclick() {
        this._language = "ko";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    ja_onclick() {
        this._language = "ja";
        this.activity.storage.kanaPreference = "kanji";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    kana_onclick() {
        this._language = "ja";
        this.activity.storage.kanaPreference = "kana";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    es_onclick() {
        this._language = "es";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    pt_onclick() {
        this._language = "pt";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    zhCN_onclick() {
        this._language = "zhCN";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    th_onclick() {
        this._language = "th";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    hi_onclick() {
        this._language = "hi";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    ibo_onclick() {
        this._language = "ibo";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    ar_onclick() {
        this._language = "ar";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    he_onclick() {
        this._language = "he";
        this.setPreference();
    }
    /**
     * @public
     * @returns {void}
     */
    te_onclick() {
        this._language = "te";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    ayc_onclick() {
        this._language = "ayc";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    quz_onclick() {
        this._language = "quz";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    gug_onclick() {
        this._language = "gug";
        this.setPreference();
    }

    /**
     * @public
     * @returns {void}
     */
    ur_onclick() {
        this._language = "ur"; 
        this.setPreference();
    }
    
    
    /**
     * @public
     * @returns {void}
     */
    reload() {
        window.location.reload();    
    }
    setPreference() {
        if (localStorage.getItem("languagePreference") === this._language) {
            this.activity.textMsg(_("Music Blocks is already set to this language."));
        }
        else{
            this.activity.storage.languagePreference = this._language;
            this.reload();
        }

    }
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = LanguageBox;
}