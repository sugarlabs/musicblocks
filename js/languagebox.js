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
        this._language = "ja";
        this.activity.storage.kanaPreference = "kanji";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    kana_onclick() {
        this._language = "ja";
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
        this._language = "zhCN";
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
    gug_onclick() {
        this._language = "gug";
        this.hide();
    }

    /**
     * @public
     * @returns {void}
     */
    OnClick() {
        this.activity.storage.languagePreference = this._language;
        window.location.reload();    
    }
    hide() {
        const MSGPrefix =
        "<a href='#' class='language-link' " +
            "onMouseOver='this.style.opacity = 0.5'" +
            "onMouseOut='this.style.opacity = 1'>";
        const MSGSuffix = "</a>";
        const SetLanguage={
            default: _("Music Blocks is already set to this language."),
            enUS: "Music Blocks is already set to this language.",
            enUK: "Music Blocks is already set to this language.",
            ja: "Music Blocksは既にこの言語に設定されています。",
            kana: "ミュージック ブロックス イズ オールレディ セット トゥ ディス ランゲージ。",
            ko: "뮤직 블록스는 이미 이 언어로 설정되어 있습니다.",
            es:"Music Blocks ya está configurado en este idioma.",
            pt:"O Music Blocks já está configurado para este idioma.",
            zhCN: "音乐积木已设置为该语言。",
            th:"Music Blocks ได้รับการตั้งค่าเป็นภาษานี้แล้ว",
            hi: "म्यूजिक ब्लॉक्स पहले से ही इस भाषा पर सेट है।",
	    te: "మ్యూజిక్ బ్లాక్స్ ఇప్పటికే ఈ భాషకు సెట్ అయింది.",
            ibo: "Music Blocks dị ọhụrụ bụla n'ụzọ asụsụ a.",
            ar: "تم تعيين كتل الموسيقى بالفعل على هذه اللغة.",
            he: "Music Blocks כבר מוגדר לשפה זו.",
            ayc: "Music Blocks ya está configurado en este idioma.",
            quz:"Music Blocks ya está configurado en este idioma.",
            gug:"Music Blocks ya está configurado en este idioma."

        }
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
	    te: "మీ భాష ప్రాధాన్యతను మార్చడానికి మీ బ్రౌజర్‌ని రిఫ్రెష్ చేయండి.",
            ibo: "Mee ka nchọgharị gị gbanwee mmasị asụsụ gị.",
            ar: "حدث المتصفح لتغيير تفضيلات اللغة.",
            he: "רענן את הדפדפן כדי לשנות את העדפת השפה שלך.",
            ayc: "Actualice su navegador para cambiar su preferencia de idioma.",
            quz: "Actualice su navegador para cambiar su preferencia de idioma.",
            gug: "Actualice su navegador para cambiar su preferencia de idioma."
        };
        if (localStorage.getItem("languagePreference") === this._language) {
            this.activity.textMsg( SetLanguage[this._language] );
        }
        else{
            if (this._language === "ja" && this.activity.storage.kanaPreference === "kana") {
                this.activity.textMsg(MSGPrefix + MSG["kana"] + MSGSuffix);
            } else {
                this.activity.textMsg(MSGPrefix + MSG[this._language] + MSGSuffix);
            }
        }

         const languageLinks = document.querySelectorAll('.language-link');
         languageLinks.forEach(link => {
             link.addEventListener('click', () => this.OnClick());
         });
    }
}
