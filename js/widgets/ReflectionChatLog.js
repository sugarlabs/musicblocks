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

/* global _, DOMPurify, ReflectionMatrix */
/*
    Globals location
    - js/utils/utils.js
        _
    - lib/purify.min.js
        DOMPurify
    - js/widgets/reflection.js
        ReflectionMatrix
*/

/* exported ReflectionChatLog */

/**
 * @file ReflectionChatLog.js
 * @description Reflection chat log: the typing indicator, adding user and mentor messages, and
 * drawing the saved conversation again.
 *
 * The methods are moved as they were from the ReflectionMatrix class, which copies them onto
 * ReflectionMatrix.prototype (see ReflectionMatrix.installModules), so `this` is still the
 * widget.
 */
class ReflectionChatLog {
    /**
     * Displays a typing indicator with animated dots.
     * @returns {void}
     */
    showTypingIndicator(action) {
        if (!this._isWidgetActive() || this.typingDiv) return;

        this.typingDiv = document.createElement("div");
        this.typingDiv.className = "typing-indicator";

        const textElement = document.createElement("span");
        textElement.textContent = action ? action : _("Thinking");
        this.typingDiv.appendChild(textElement);

        this.dotsContainer = document.createElement("span");
        this.typingDiv.appendChild(this.dotsContainer);

        this.chatLog.appendChild(this.typingDiv);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;

        // Start animation
        let dotCount = 0;
        const maxDots = 3;
        this.dotsInterval = this._setWidgetInterval(() => {
            dotCount = (dotCount + 1) % (maxDots + 1);
            this.dotsContainer.textContent = ".".repeat(dotCount);
        }, 500);
    }

    /**
     * Hides the typing indicator and stops the animation.
     * @returns {void}
     */
    hideTypingIndicator() {
        if (this.startChatTypingTimeout !== null) {
            this._clearWidgetTimeout(this.startChatTypingTimeout);
            this.startChatTypingTimeout = null;
        }

        if (this.dotsInterval !== null) {
            this._clearWidgetInterval(this.dotsInterval);
            this.dotsInterval = null;
        }

        if (this.typingDiv) {
            this.typingDiv.remove();
            this.typingDiv = null;
        }
    }

    /**
     * Appends a user message to the chat log.
     * @param {string} text - The user's message.
     * @returns {void}
     */
    appendUserMessage(text) {
        if (!this._isWidgetActive()) return;

        const messageContainer = document.createElement("div");
        messageContainer.classList.add("message-container", "user");

        const senderName = document.createElement("div");
        senderName.classList.add("sender-name");
        senderName.style.fontSize = "12px";
        senderName.style.fontWeight = "bold";
        senderName.style.marginBottom = "4px";
        senderName.style.color = "var(--color-text-secondary)";
        senderName.style.overflowWrap = "break-word";
        senderName.style.alignSelf = "flex-start";
        senderName.innerText = this.mentorsMap.user;

        const userMsg = document.createElement("div");
        userMsg.innerText = text;

        messageContainer.appendChild(senderName);
        messageContainer.appendChild(userMsg);

        this.chatLog.appendChild(messageContainer);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;
    }

    /**
     * Appends a bot reply to the chat log.
     * @param {Object} reply - The backend response containing the bot reply.
     * @param {string} role - The mentor role that generated the reply.
     * @param {boolean} md - Whether the reply should be rendered as markdown.
     * @returns {void}
     */
    appendBotReply(reply, role = this.AImentor, md = false) {
        if (!this._isWidgetActive()) return;

        const entry = {
            role: role,
            content: reply.response
        };
        this.chatHistory.push(entry);
        if (md) {
            this._markdownReplies.add(entry);
        }

        if (this.chatHistory.length >= ReflectionMatrix.ANALYSIS_MIN_MESSAGES) {
            this.summaryButton.style.removeProperty("background");
        }

        const messageContainer = document.createElement("div");
        messageContainer.className = "message-container";

        const senderName = document.createElement("div");
        senderName.classList.add("sender-name");
        senderName.style.fontSize = "12px";
        senderName.style.fontWeight = "bold";
        senderName.style.marginBottom = "4px";
        senderName.style.color = "var(--color-text-secondary)";
        senderName.style.alignSelf = "flex-start";
        senderName.innerText = this.mentorsMap[role];

        const botReply = document.createElement("div");

        if (md) {
            this._setMarkdown(botReply, reply.response);
        } else {
            botReply.innerText = reply.response;
        }

        messageContainer.appendChild(senderName);
        messageContainer.appendChild(botReply);

        this.chatLog.appendChild(messageContainer);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;
    }

    /**
     * Shows a Markdown reply in an element.
     *
     * mdToHTML marks each link to open in a new tab, but DOMPurify drops the target attribute
     * unless it is allowed, and a link that opens in this tab leaves the project.
     * @private
     * @param {HTMLElement} element - The element to fill.
     * @param {string} text - The Markdown text.
     * @returns {void}
     */
    _setMarkdown(element, text) {
        element.innerHTML = DOMPurify.sanitize(this.mdToHTML(text), { ADD_ATTR: ["target"] });
    }

    /**
     * Renders the chat history in the chat log.
     * @returns {void}
     */
    renderChatHistory() {
        this.chatLog.textContent = "";

        this.chatHistory.forEach(msg => {
            const messageContainer = document.createElement("div");
            messageContainer.className = "message-container";

            const senderName = document.createElement("div");
            senderName.classList.add("sender-name");
            senderName.style.fontSize = "12px";
            senderName.style.fontWeight = "bold";
            senderName.style.marginBottom = "4px";
            senderName.style.color = "var(--color-text-secondary)";
            senderName.style.overflowWrap = "break-word";
            senderName.style.alignSelf = "flex-start";

            const userMsg = document.createElement("div");
            if (this._markdownReplies.has(msg)) {
                this._setMarkdown(userMsg, msg.content);
            } else {
                userMsg.innerText = msg.content;
            }

            messageContainer.appendChild(senderName);
            messageContainer.appendChild(userMsg);

            if (msg.role === "user") {
                messageContainer.classList.add("user");
            }

            senderName.innerText = this.mentorsMap[msg.role];

            this.chatLog.appendChild(messageContainer);
        });

        this.chatLog.scrollTop = this.chatLog.scrollHeight;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ReflectionChatLog;
}
