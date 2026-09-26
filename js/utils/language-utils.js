/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2014-2026 Walter Bender
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/* exported normalizeLanguageCode */

/**
 * The language menu identifies languages by the id of its dropdown entries
 * (enUS, enUK, zhCN, kana, ...), but the locale files in locales/ are named
 * after the translation codes (en, en_GB, zh_CN, ja, ...). Passing a menu code
 * straight to i18next asks the backend for a file that does not exist, which
 * 404s and silently falls back to English.
 *
 * Keep this mapping as the single place that translates between the two.
 */
const LANGUAGE_CODE_TO_LOCALE = {
    "enUS": "en",
    "enUK": "en_GB",
    "zhCN": "zh_CN",
    "kana": "ja",
    "ja-kana": "ja",
    "ja-kanji": "ja"
};

/**
 * Maps a stored language preference onto the locale file that backs it.
 *
 * @param {string} language - a language menu code or a translation code.
 * @returns {string} the code matching a file in locales/.
 */
function normalizeLanguageCode(language) {
    if (typeof language !== "string" || language === "") {
        return "en";
    }

    if (Object.prototype.hasOwnProperty.call(LANGUAGE_CODE_TO_LOCALE, language)) {
        return LANGUAGE_CODE_TO_LOCALE[language];
    }

    // Any other Japanese variant also resolves to the ja translations.
    return language.startsWith("ja") ? "ja" : language;
}

const LanguageUtils = {
    LANGUAGE_CODE_TO_LOCALE,
    normalizeLanguageCode
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = LanguageUtils;
}

if (typeof window !== "undefined") {
    window.LanguageUtils = LanguageUtils;
    Object.assign(window, LanguageUtils);
}
