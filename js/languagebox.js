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
function LanguageBox() {
    var language = localStorage.languagePreference;
    this._message = null;

    this.setMessage = function(message) {
        this._message = message;
        return this;
    };

    this.enUS_onclick = function() {
        language = "enUS";
        this.hide();
    };

    this.enUK_onclick = function() {
        language = "enUK";
        this.hide();
    };

    this.ja_onclick = function() {
        language = "ja";
        localStorage.kanaPreference = "kanji";
        this.hide();
    };

    this.kana_onclick = function() {
        language = "ja";
        localStorage.kanaPreference = "kana";
        this.hide();
    };

    this.es_onclick = function() {
        language = "es";
        this.hide();
    };

    this.pt_onclick = function() {
        language = "pt";
        this.hide();
    };

    this.zhCN_onclick = function() {
        language = "zhCN";
        this.hide();
    };

    this.th_onclick = function() {
        language = "th";
        this.hide();
    };

    this.hi_onclick = function() {
        language = "hi";
        this.hide();
    };

    this.ibo_onclick = function() {
        language = "ibo";
        this.hide();
    };

    this.ar_onclick = function() {
        language = "ar";
        this.hide();
    };

    this.he_onclick = function() {
        language = "he";
        this.hide();
    };

    this.ayc_onclick = function() {
        language = "ayc";
        this.hide();
    };

    this.quz_onclick = function() {
        language = "quz";
        this.hide();
    };

    this.gug_onclick = function() {
        language = "gug";
        this.hide();
    };

    this.hide = function() {
        const MSGPrefix =
            "<a href='#' " +
            "onClick='window.location.reload()'" +
            "onMouseOver='this.style.opacity = 0.5'" +
            "onMouseOut='this.style.opacity = 1'>";
        const MSGSuffix = "</a>";
        const MSG = {
            default: _(
                "Refresh your browser to change your language preference."
            ),
            enUS: "Refresh your browser to change your language preference.",
            enUK: "Refresh your browser to change your language preference.",
            ja: "言語を変えるには、ブラウザをこうしんしてください。",
            kana: "げんごを かえるには、ブラウザを こうしんしてください。",
            es: "Actualice su navegador para cambiar su preferencia de idioma.",
            pt:
                "Atualize seu navegador para alterar sua preferência de idioma.",
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
        console.debug(language);
        if (language === "ja" && localStorage.kanaPreference === "kana") {
            this._message(MSGPrefix + MSG["kana"] + MSGSuffix);
        } else {
            this._message(MSGPrefix + MSG[language] + MSGSuffix);
        }
    };
}
