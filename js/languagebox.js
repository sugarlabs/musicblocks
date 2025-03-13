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
        
        // Map of language codes to display names for search functionality
        this.languageMap = {
            "enUS": "English (US)",
            "enUK": "English (UK)",
            "ko": "Korean",
            "ja": "Japanese",
            "kana": "Japanese (Kana)",
            "es": "Spanish",
            "pt": "Portuguese",
            "zhCN": "Chinese",
            "th": "Thai",
            "hi": "Hindi",
            "ibo": "Igbo",
            "ar": "Arabic",
            "he": "Hebrew",
            "te": "Telugu",
            "ayc": "Aymara",
            "quz": "Quechua",
            "gug": "Guarani",
            "ur": "Urdu"
        };
        
        // Initialize search functionality after dropdown is rendered
        this.initSearchBar();
    }
    
    /**
     * @public
     * @returns {void}
     */
    initSearchBar() {
        // Initialize after a short delay to ensure DOM is ready
        setTimeout(() => {
            this._createSearchBar();
            this._setupDropdownBehavior();
        }, 500);
    }

    /**
     * @private
     * @returns {void}
     */
    _createSearchBar() {
        // Create search container
        const searchContainer = document.createElement("li");
        searchContainer.className = "language-search-container";
        searchContainer.style.padding = "10px";
        
        // Create search input
        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.id = "language-search-input";
        searchInput.placeholder = "Search languages...";
        searchInput.className = "language-search-input";
        searchInput.style.width = "100%";
        searchInput.style.padding = "8px";
        searchInput.style.boxSizing = "border-box";
        searchInput.style.border = "1px solid #ccc";
        searchInput.style.borderRadius = "4px";
        
        // Add event listener for input changes
        searchInput.addEventListener("input", (e) => this._filterLanguages(e.target.value));
        
        // Add click event that stops propagation to prevent dropdown from closing
        searchInput.addEventListener("click", (e) => {
            e.stopPropagation();
        });
        
        // Append search input to container
        searchContainer.appendChild(searchInput);
        
        // Find the language dropdown
        const languageDropdown = document.getElementById("languagedropdown");
        
        if (languageDropdown) {
            // Insert search container at the top of the dropdown
            languageDropdown.insertBefore(searchContainer, languageDropdown.firstChild);
        } else {
            console.warn("Could not find language dropdown element");
        }
    }
    
    /**
     * @private
     * @returns {void}
     */
    _setupDropdownBehavior() {
        // Get the language select icon
        const languageSelectIcon = document.getElementById("languageSelectIcon");
        if (!languageSelectIcon) return;
        
        // Override MaterializeCSS dropdown behavior
        if (typeof M !== 'undefined' && M.Dropdown) {
            // If MaterializeCSS is already initialized
            const dropdownInstance = M.Dropdown.getInstance(languageSelectIcon);
            
            if (dropdownInstance) {
                // Configure existing dropdown
                dropdownInstance.options.closeOnClick = false;
                dropdownInstance.options.constrainWidth = false;
            } else {
                // Initialize with custom options
                M.Dropdown.init(languageSelectIcon, {
                    closeOnClick: false,
                    constrainWidth: false,
                    coverTrigger: false
                });
            }
        }
        
        // Add event listeners to prevent dropdown from closing when clicking on search
        const languageDropdown = document.getElementById("languagedropdown");
        if (languageDropdown) {
            languageDropdown.addEventListener("click", (e) => {
                if (e.target.id === "language-search-input" || 
                    e.target.closest(".language-search-container")) {
                    e.stopPropagation();
                }
            });
        }
    }
    
    /**
     * @private
     * @param {string} query - The search query
     * @returns {void}
     */
    _filterLanguages(query) {
        query = query.toLowerCase();
        
        // Get the language dropdown
        const languageDropdown = document.getElementById("languagedropdown");
        if (!languageDropdown) return;
        
        // Get all language option elements (li > a)
        const languageOptions = languageDropdown.querySelectorAll("li");
        
        languageOptions.forEach(li => {
            // Skip the search container itself
            if (li.className === "language-search-container") return;
            
            const a = li.querySelector("a");
            if (!a) return;
            
            // Get the language code from the anchor id
            const languageCode = a.id;
            if (!languageCode) return;
            
            // Get language display name
            const languageName = this.languageMap[languageCode] || languageCode;
            
            // Check if the language name or code contains the query
            if (languageName.toLowerCase().includes(query) || 
                languageCode.toLowerCase().includes(query)) {
                li.style.display = "block";
            } else {
                li.style.display = "none";
            }
        });
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
    ur_onclick() {
        this._language = "ur"; 
        this.hide();
    }
    
    
    /**
     * @public
     * @returns {void}
     */
    OnClick() {
        window.location.reload();    
    }
    hide() {
        const MSGPrefix =
        "<a href='#' class='language-link' " +
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
	    te: "మీ భాష ప్రాధాన్యతను మార్చడానికి మీ బ్రౌజర్‌ని రిఫ్రెష్ చేయండి.",
            ibo: "Mee ka nchọgharị gị gbanwee mmasị asụsụ gị.",
            ar: "حدث المتصفح لتغيير تفضيلات اللغة.",
            he: "רענן את הדפדפן כדי לשנות את העדפת השפה שלך.",
            ayc: "Actualice su navegador para cambiar su preferencia de idioma.",
            quz: "Actualice su navegador para cambiar su preferencia de idioma.",
            gug: "Actualice su navegador para cambiar su preferencia de idioma.",
            ur:"اپنی زبان کی ترجیح کو تبدیل کرنے کے لئے اپنے براؤزر کو تازہ دم کریں۔"
        };
        if (localStorage.getItem("languagePreference") === this._language) {
            this.activity.textMsg(_("Music Blocks is already set to this language."));
        }
        else{
            this.activity.storage.languagePreference = this._language;
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

if (typeof module !== "undefined" && module.exports) {
    module.exports = LanguageBox;
}