// Copyright (c) 2018,19 Walter Bender
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
   global _, language:writable
*/

/* exported LanguageBox */
class LanguageBox {
    language = localStorage.languagePreference;

    constructor() {
        this._message = null;
    }

    setMessage(message) {
        this._message = message;
        return this;
    }

    enUS_onclick() {
        language = "enUS";
        this.hide();
    }

    enUK_onclick() {
        language = "enUK";
        this.hide();
    }

    ko_onclick() {
        language = "ko";
        this.hide();
    }

    ja_onclick() {
        language = "ja";
        localStorage.kanaPreference = "kanji";
        this.hide();
    }

    kana_onclick() {
        language = "ja";
        localStorage.kanaPreference = "kana";
        this.hide();
    }

    es_onclick() {
        language = "es";
        this.hide();
    }

    pt_onclick() {
        language = "pt";
        this.hide();
    }

    zhCN_onclick() {
        language = "zhCN";
        this.hide();
    }

    th_onclick() {
        language = "th";
        this.hide();
    }

    hi_onclick() {
        language = "hi";
        this.hide();
    }

    ibo_onclick() {
        language = "ibo";
        this.hide();
    }

    ar_onclick() {
        language = "ar";
        this.hide();
    }

    he_onclick() {
        language = "he";
        this.hide();
    }

    ayc_onclick() {
        language = "ayc";
        this.hide();
    }

    quz_onclick() {
        language = "quz";
        this.hide();
    }

    gug_onclick() {
        language = "gug";
        this.hide();
    }

    hide() {
        const MSGPrefix =
            "<a href='#' " +
            "onClick='window.location.reload()'" +
            "onMouseOver='this.style.opacity = 0.5'" +
            "onMouseOut='this.style.opacity = 1'>";
        const MSGSuffix = "</a>";
        const MSG = {
            default: _("Refresh your browser to change your language preference."),
            enUS: "Refresh your browser to change your language preference.",
            enUK: "Refresh your browser to change your language preference.",
            ja: "言語を変えるには、ブラウザをこうしんしてください。",
            kana: "げんごを かえるには、ブラウザを こうしんしてください。",
            ko: "언어 기본 설정을 변경하려면 브라우저를 새로 고치십시오.",
            es: "Actualice su navegador para cambiar su preferencia de idioma.",
            pt: "Atualize seu navegador para alterar sua preferência de idioma.",
            zhCN: "刷新浏览器以更改您的语言偏好",
            th: "รีเฟรชเบราเซอร์เพื่อเปลี่ยนการตั้งค่าภาษาของคุณ",
            hi: "अपनी भाषा की वरीयता बदलने के लिए अपना ब्राउज़र ताज़ा करें",
            ibo: "Mee ka nchọgharị gị gbanwee mmasị asụsụ gị.",
            ar: "حدث المتصفح لتغيير تفضيلات اللغة.",
            he: "רענן את הדפדפן כדי לשנות את העדפת השפה שלך.",
            ayc: "Actualice su navegador para cambiar su preferencia de idioma.",
            quz: "Actualice su navegador para cambiar su preferencia de idioma.",
            gug: "Actualice su navegador para cambiar su preferencia de idioma."
        };

        localStorage.languagePreference = language;
        // console.debug(language);
        if (language === "ja" && localStorage.kanaPreference === "kana") {
            this._message(MSGPrefix + MSG["kana"] + MSGSuffix);
        } else {
            this._message(MSGPrefix + MSG[language] + MSGSuffix);
        }
    }
}
