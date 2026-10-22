/**
 * MusicBlocks
 *
 * @copyright 2025 Diwangshu Kakoty
 * @copyright 2026 Music Blocks contributors
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/* global _ */
/*
    Globals location
    - js/utils/utils.js
        _
*/

/* exported ReflectionReport */

/**
 * @file ReflectionReport.js
 * @description Reflection reports: keeping the analysis report in localStorage and saving the
 * conversation as a text file.
 *
 * The methods are moved as they were from the ReflectionMatrix class, which copies them onto
 * ReflectionMatrix.prototype (see ReflectionMatrix.installModules), so `this` is still the
 * widget.
 */
class ReflectionReport {
    /**
     * Saves the analysis report to localStorage.
     * @param {Object} data - The analysis data to save.
     * @returns {Promise<void>}
     */
    saveReport(data) {
        const key = "musicblocks_analysis";
        // The next analysis is compared with this one, even if it could not be stored.
        this.summary = data.response;
        try {
            localStorage.setItem(key, data.response);
        } catch (e) {
            console.warn("Could not save analysis report to localStorage:", e);
        }
    }

    /** Reads the analysis report from localStorage.
     * @returns {String|null} - The retrieved analysis data or null if not found.
     */
    readReport() {
        const key = "musicblocks_analysis";
        const data = localStorage.getItem(key);
        return data;
    }

    /** Downloads the conversation as a text file.
     * @param {Array} conversationData - The chat history to download.
     * @returns {void}
     */
    downloadAsTxt(conversationData) {
        if (conversationData.length === 0) {
            this.activity.errorMsg(_("No conversation to save."), 2000);
            return;
        }
        const transcript = conversationData
            .map(
                item => `${this.mentorsMap[item.role] || item.role.toUpperCase()}: ${item.content}`
            )
            .join("\n\n");

        const blob = new Blob([transcript], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "conversation.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ReflectionReport;
}
