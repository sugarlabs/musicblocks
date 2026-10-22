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

/* global _, ReflectionMatrix */
/*
    Globals location
    - js/utils/utils.js
        _
    - js/widgets/reflection.js
        ReflectionMatrix
*/

/* exported ReflectionBackend */

/**
 * @file ReflectionBackend.js
 * @description Reflection backend requests: the JSON calls to /projectcode, /updatecode, /chat and
 * /analysis.
 *
 * The methods are moved as they were from the ReflectionMatrix class, which copies them onto
 * ReflectionMatrix.prototype (see ReflectionMatrix.installModules), so `this` is still the
 * widget.
 */
class ReflectionBackend {
    /**
     * Sends JSON to the backend through the shared lifecycle tracker.
     * @param {string} path - Backend path suffix.
     * @param {Object} payload - Request payload.
     * @returns {Promise<Object|null>} Backend response, or null when no backend
     *     is configured for this host.
     */
    _postJSON(path, payload) {
        if (!this.PORT) {
            this.activity.errorMsg(
                _(
                    "Reflection is not available on this host. The backend URL could not be determined."
                ),
                3000
            );
            return Promise.resolve(null);
        }

        return this._lifecycle.postJSON(
            `${this.PORT}${path}`,
            payload,
            ReflectionMatrix.REQUEST_TIMEOUT,
            "Failed to send message"
        );
    }

    /**
     * Sends the project code to the server and retrieves the algorithm.
     * @param {string} code - The project code.
     * @returns {Promise<Object>} - The server response containing the algorithm.
     */
    async generateAlgorithm(code) {
        return this._postJSON("/projectcode", {
            code: code
        });
    }

    /**
     * Sends the previous algorithm and new code to the server to get an updated algorithm.
     * @param {string} previousAlgorithm - The previous project algorithm.
     * @param {string} code - The new project code.
     * @returns {Promise<Object>} - The server response containing the updated algorithm.
     */
    async generateNewAlgorithm(code) {
        return this._postJSON("/updatecode", {
            oldcode: this.code,
            newcode: code
        });
    }

    /**
     * Sends a message to the server and retrieves the bot's reply.
     *  @param {string} message - The user's message.
     *  @param {Array} chatHistory - The chat history.
     *  @param {string} mentor - The current mentor.
     *  @param {string} algorithm - The project algorithm.
     *  @returns {Promise<Object>} - The server response containing the bot's reply.
     */
    async generateBotReply(message, chatHistory, mentor, algorithm) {
        const generation = this._lifecycle.generation;
        this.showTypingIndicator();

        const safeIndex = Math.min(this.summarizedUpTo, chatHistory.length);
        const unsummarizedMessages = chatHistory.slice(safeIndex);

        const data = await this._postJSON("/chat", {
            query: message,
            messages: unsummarizedMessages,
            mentor: mentor,
            algorithm: algorithm,
            conversation_summary: this.conversationSummary || null,
            summarized_up_to: this.summarizedUpTo
        });

        // Summary state and the typing indicator belong to the current mount.
        if (!this._isSameMount(generation)) return null;

        this.hideTypingIndicator();

        if (data && data.conversation_summary && data.summarized_up_to !== undefined) {
            this.conversationSummary = data.conversation_summary;
            this.summarizedUpTo = data.summarized_up_to;
        }

        return data;
    }

    /**
     * Sends the chat history and summary to the server to get analysis.
     *  @returns {Promise<Object>} - The server response containing the analysis.
     */
    async generateAnalysis() {
        return this._postJSON("/analysis", {
            messages: this.chatHistory,
            summary: this.summary
        });
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ReflectionBackend;
}
