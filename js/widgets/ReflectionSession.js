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

/* exported ReflectionSession */

/**
 * @file ReflectionSession.js
 * @description Reflection conversation flow: starting the chat, refreshing the project code, sending
 * queued messages and asking for the analysis.
 *
 * The methods are moved as they were from the ReflectionMatrix class, which copies them onto
 * ReflectionMatrix.prototype (see ReflectionMatrix.installModules), so `this` is still the
 * widget.
 */
class ReflectionSession {
    /**
     * Sends queued user messages one at a time so input is not lost.
     * @returns {Promise<void>}
     */
    async processPendingMessages() {
        if (this.isProcessingPendingMessage) return;

        const generation = this._lifecycle.generation;
        this.isProcessingPendingMessage = true;

        while (this.pendingMessages.length > 0 && this._isWidgetActive()) {
            const nextMessage = this.pendingMessages.shift();

            this.chatHistory.push({
                role: "user",
                content: nextMessage.text
            });

            const reply = await this.generateBotReply(
                nextMessage.text,
                this.chatHistory,
                nextMessage.mentor,
                nextMessage.algorithm
            );

            // The widget was reopened while this reply was in flight. Its queue
            // and flag belong to the new session now, so leave both alone.
            if (!this._isSameMount(generation)) return;

            if (!this._isWidgetActive() || !reply) {
                continue;
            }

            if (reply.error) {
                this.hideTypingIndicator();
                this.activity.errorMsg(_("Failed to send message."), 3000);
                continue;
            }

            this.appendBotReply(reply, nextMessage.mentor);
        }

        this.isProcessingPendingMessage = false;
    }

    /**
     * Starts the chat session by sending the project code to the server.
     *  @returns {Promise<void>}
     */
    async startChatSession() {
        if (this.triggerFirst === true || !this._isWidgetActive()) return;

        const generation = this._lifecycle.generation;
        this.triggerFirst = true;

        // Reset summarization state for a fresh session
        this.conversationSummary = "";
        this.summarizedUpTo = 0;
        this.startChatTypingTimeout = this._setWidgetTimeout(() => {
            this.startChatTypingTimeout = null;
            if (this.isOpen) {
                this.showTypingIndicator("Reading code");
            }
        }, 1000);

        const code = await this.activity.prepareExport();
        const data = await this.generateAlgorithm(code);

        // Belongs to a previous open: the indicator and triggerFirst below are
        // the reopened session's state, not ours.
        if (!this._isSameMount(generation)) return;

        this.hideTypingIndicator();

        if (!this._isWidgetActive() || !data) {
            this.triggerFirst = false;
            return;
        }

        if (!data.error) {
            this.inputContainer.style.display = "flex";
            this.botReplyDiv(data, false, false);
            this.projectAlgorithm = data.algorithm;
            this.code = code;
        } else {
            // Let Refresh or the next open try again.
            this.triggerFirst = false;
            this.activity.errorMsg(_(data.error), 3000);
        }
    }

    /**
     * Updates the project code and retrieves the new algorithm from the server.
     * @returns {Promise<void>}
     */
    async updateProjectCode() {
        if (this.typingDiv || this._isUpdatingProjectCode || !this._isWidgetActive()) {
            return;
        }

        // The chat never started, so there is no code to compare against yet.
        if (this.code === "") {
            return this.startChatSession();
        }

        const generation = this._lifecycle.generation;
        this._isUpdatingProjectCode = true;

        try {
            const code = await this.activity.prepareExport();
            if (!this._isSameMount(generation)) return;

            if (code === this.code) {
                this.activity.textMsg(_("No changes were detected in your project."), 2500);
                return; // No changes in code
            }

            this.showTypingIndicator("Reading code");
            const data = await this.generateNewAlgorithm(code);
            if (!this._isSameMount(generation)) return;

            this.hideTypingIndicator();

            if (!this._isWidgetActive() || !data) {
                return;
            }

            if (!data.error) {
                if (data.algorithm !== "unchanged") {
                    this.projectAlgorithm = data.algorithm; // update algorithm
                    this.code = code;
                }
                this.botReplyDiv(data, false, false);
            } else {
                this.activity.errorMsg(_(data.error), 3000);
            }
        } finally {
            // A reopened widget owns this flag now; releasing it here would let
            // its own refresh run twice.
            if (this._isSameMount(generation)) {
                this._isUpdatingProjectCode = false;
            }
        }
    }

    /**
     * Fetches analysis from the server and updates the chat log.
     * @returns {Promise<void>}
     */
    async getAnalysis() {
        if (this.chatHistory.length < 10 || this.typingDiv || !this._isWidgetActive()) return;
        const generation = this._lifecycle.generation;
        this.showTypingIndicator("Analyzing");
        const data = await this.generateAnalysis();
        if (!this._isSameMount(generation)) return;

        this.hideTypingIndicator();
        if (data && this._isWidgetActive()) {
            this.botReplyDiv(data, false, true);
            // Expected errors in data.error:
            // 1. Server-side errors returned by the API (e.g., 500s or rate limits).
            // 2. Network failures caught by generateAnalysis().
            if (!data.error) {
                await this.saveReport(data);
            }
        }
    }

    /**
     * Appends the bot's reply to the chat log.
     * @param {string} message - The bot's reply message.
     * @param {boolean} user_query - Flag indicating if the message is from the user.
     * @returns {Promise<void>}
     */
    async botReplyDiv(message, user_query = true, md = false) {
        const replyMentor = this.AImentor;
        const generation = this._lifecycle.generation;
        let reply;
        // check if message is from user or bot
        if (user_query === true) {
            if (!this._isWidgetActive()) return;
            reply = await this.generateBotReply(
                message,
                this.chatHistory,
                replyMentor,
                this.projectAlgorithm
            );

            if (!this._isSameMount(generation)) return;
        } else {
            reply = message;
        }

        if (!this._isWidgetActive() || !reply) {
            return;
        }

        if (reply.error) {
            this.hideTypingIndicator();
            this.activity.errorMsg(_("Failed to send message."), 3000);
            return;
        }

        this.appendBotReply(reply, replyMentor, md);
    }

    /**
     * Handles sending user messages.
     * @returns {void}
     */
    sendMessage() {
        const text = this.input.value.trim();
        if (text === "" || !this._isWidgetActive()) return;
        this.appendUserMessage(text);
        this.pendingMessages.push({
            text: text,
            mentor: this.AImentor,
            algorithm: this.projectAlgorithm
        });
        this.input.value = "";
        void this.processPendingMessages();
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ReflectionSession;
}
