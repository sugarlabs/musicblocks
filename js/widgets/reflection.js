// Copyright (c) 2025 Diwangshu Kakoty
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* This widget provides a chat interface for users to interact with AI mentors for project reflection and analysis.*/

/* global _, escapeHTML, isSafeUrl, DOMPurify */

/**
 * Represents Reflection Widget.
 * @constructor
 */

class ReflectionMatrix {
    /** AMD module dependencies for lazy loading. */
    static dependencies = ["widgets/reflection"];

    static BUTTONDIVWIDTH = 535;
    static OUTERWINDOWWIDTH = "858px";
    static OUTERWINDOWHEIGHT = "550px";
    static INNERWINDOWWIDTH = 730;
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;

    constructor() {
        /**
         * Chat history array to store the conversation
         * @type {Array}
         */
        this.chatHistory = [];

        /**
         * Default AI mentor
         * @type {string}
         */
        this.AImentor = "meta";

        /**
         * Map to display mentor names
         * @type {Object}
         */
        this.mentorsMap = {
            user: "YOU",
            meta: "ROHAN",
            music: "BEETHOVEN",
            code: "ALAN"
        };

        /**
         * Flag to check if init function has been called once
         * @type {boolean}
         */
        this.triggerFirst = false;

        /**
         * Project algorithm string
         * @type {string}
         */
        this.projectAlgorithm = "";

        /**
         * MusicBlocks code
         * @type {string}
         */
        this.code = "";

        /**
         * Conversation summary
         * @type {string}
         */
        this.conversationSummary = "";

        /**
         * Index up to which messages have been summarized
         * @type {number}
         */
        this.summarizedUpTo = 0;

        this.startChatTypingTimeout = null;

        /**
         * User messages waiting to be sent to the backend
         * @type {Array}
         */
        this.pendingMessages = [];

        /**
         * Whether a queued user message is currently being processed
         * @type {boolean}
         */
        this.isProcessingPendingMessage = false;

        /**
         * Tracks whether the widget is mounted and can still update UI safely
         * @type {boolean}
         */
        this._isMounted = false;

        /**
         * Tracks in-flight fetch controllers so they can be aborted on close
         * @type {Set<AbortController>}
         */
        this._pendingRequests = new Set();
    }

    /**
     * Initializes the reflection widget.
     */

    init(activity) {
        this.activity = activity;
        this.isOpen = true;
        this._isMounted = true;
        this.isMaximized = false;
        this.activity.isInputON = true;
        this.PORT = "http://3.105.177.138:8000"; // http://127.0.0.1:8000

        const widgetWindow = window.widgetWindows.windowFor(this, "reflection", "reflection");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        widgetWindow.getWidgetBody().style.height = ReflectionMatrix.OUTERWINDOWHEIGHT;
        widgetWindow.getWidgetBody().style.width = ReflectionMatrix.OUTERWINDOWWIDTH;

        widgetWindow.onclose = () => {
            this.isOpen = false;
            this._isMounted = false;
            this.activity.isInputON = false;
            this.hideTypingIndicator();
            this._abortPendingRequests();
            this.pendingMessages = [];
            this.isProcessingPendingMessage = false;
            widgetWindow.destroy();
        };

        // retrieve string from localStorage
        this.summary = this.readReport() || "No reports available";

        this.chatInterface = document.createElement("div");
        this.chatInterface.className = "chatInterface";
        widgetWindow.getWidgetBody().append(this.chatInterface);

        this.summaryButton = widgetWindow.addButton(
            "notes_icon.svg",
            ReflectionMatrix.ICONSIZE,
            _("Summary")
        );

        this.summaryButton.onclick = () => this.getAnalysis();

        if (this.chatHistory.length < 10) {
            this.summaryButton.style.background = "gray";
        }

        widgetWindow.addButton(
            "save-button-dark.svg",
            ReflectionMatrix.ICONSIZE,
            _("Save")
        ).onclick = () => this.downloadAsTxt(this.chatHistory); // text download

        this.metaButton = widgetWindow.addButton(
            "general_mentor.svg",
            ReflectionMatrix.ICONSIZE,
            _("Talk with Rohan")
        );
        this.metaButton.onclick = () => this.changeMentor("meta");

        this.codeButton = widgetWindow.addButton(
            "code.svg",
            ReflectionMatrix.ICONSIZE,
            _("Talk with Alan")
        );
        this.codeButton.onclick = () => this.changeMentor("code");

        this.musicButton = widgetWindow.addButton(
            "music.svg",
            ReflectionMatrix.ICONSIZE,
            _("Talk with Beethoven")
        );
        this.musicButton.onclick = () => this.changeMentor("music");

        this.reloadButton = widgetWindow.addButton(
            "reload.svg",
            ReflectionMatrix.ICONSIZE,
            _("Refresh")
        );
        this.reloadButton.onclick = () => this.updateProjectCode();

        this.changeMentor(this.AImentor);

        this.chatLog = document.createElement("div");
        this.chatLog.className = "chatLog";
        this.chatInterface.appendChild(this.chatLog);

        // Input Container
        this.inputContainer = document.createElement("div");
        this.inputContainer.className = "inputContainer";
        this.inputContainer.style.paddingBottom = "10px";

        if (!(this.chatHistory.length > 0)) {
            this.inputContainer.style.display = "none";
        } else {
            this.inputContainer.style.display = "flex";
        }

        this.input = document.createElement("input");
        this.input.className = "input-query";
        this.input.placeholder = "Type a message";
        this.input.style.marginLeft = "10px";
        this.inputContainer.appendChild(this.input);

        this.input.onkeydown = e => {
            if (e.key === "Enter") {
                this.sendMessage();
            }
        };

        const sendBtn = document.createElement("button");
        sendBtn.className = "confirm-button";
        sendBtn.style.marginRight = "10px";
        sendBtn.innerText = "Send";
        sendBtn.onclick = () => this.sendMessage();
        this.inputContainer.appendChild(sendBtn);

        // first message
        this.chatInterface.appendChild(this.inputContainer);

        if (this.chatHistory.length > 0) {
            this.renderChatHistory();
        } else {
            this.startChatSession();
        }

        widgetWindow.sendToCenter();
        activity.textMsg(_("Reflect on your project."), 3000);
    }

    /**
     * Displays a typing indicator with animated dots.
     * @returns {void}
     */
    showTypingIndicator(action) {
        if (!this._isWidgetActive() || this.typingDiv) return;

        this.typingDiv = document.createElement("div");
        this.typingDiv.className = "typing-indicator";

        const textElement = document.createElement("span");
        textElement.textContent = action ? action : "Thinking";
        this.typingDiv.appendChild(textElement);

        this.dotsContainer = document.createElement("span");
        this.typingDiv.appendChild(this.dotsContainer);

        this.chatLog.appendChild(this.typingDiv);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;

        // Start animation
        let dotCount = 0;
        const maxDots = 3;
        this.dotsInterval = setInterval(() => {
            dotCount = (dotCount + 1) % (maxDots + 1);
            this.dotsContainer.textContent = ".".repeat(dotCount);
        }, 500);
    }

    /**
     * Hides the typing indicator and stops the animation.
     * @returns {void}
     */
    hideTypingIndicator() {
        if (this.startChatTypingTimeout) {
            clearTimeout(this.startChatTypingTimeout);
            this.startChatTypingTimeout = null;
        }

        if (this.typingDiv) {
            clearInterval(this.dotsInterval);
            this.typingDiv.remove();
            this.typingDiv = null;
        }
    }

    /**
     * Returns true if the widget is still mounted and safe to update.
     * @returns {boolean}
     */
    _isWidgetActive() {
        return Boolean(this._isMounted && this.isOpen && this.chatLog);
    }

    /**
     * Aborts all in-flight widget requests.
     * @returns {void}
     */
    _abortPendingRequests() {
        this._pendingRequests.forEach(controller => controller.abort());
        this._pendingRequests.clear();
    }

    /**
     * Sends JSON to the backend while tracking the widget lifecycle.
     * @param {string} path - Backend path suffix.
     * @param {Object} payload - Request payload.
     * @returns {Promise<Object|null>}
     */
    async _postJSON(path, payload) {
        const controller = typeof AbortController !== "undefined" ? new AbortController() : null;

        if (controller) {
            this._pendingRequests.add(controller);
        }

        try {
            const request = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            };

            if (controller) {
                request.signal = controller.signal;
            }

            const response = await fetch(`${this.PORT}${path}`, request);
            const data = await response.json();
            return data;
        } catch (error) {
            if (error && error.name === "AbortError") {
                return null;
            }

            console.error("Error :", error);
            return { error: "Failed to send message" };
        } finally {
            if (controller) {
                this._pendingRequests.delete(controller);
            }
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
        senderName.style.fontSize = "12px";
        senderName.style.fontWeight = "bold";
        senderName.style.marginBottom = "4px";
        senderName.style.color = "#555";
        senderName.style.overflowWrap = "break-word";
        senderName.style.alignSelf = "flex-start";
        senderName.innerText = "You";

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

        this.chatHistory.push({
            role: role,
            content: reply.response
        });

        if (this.chatHistory.length > 10) {
            this.summaryButton.style.removeProperty("background");
        }

        const messageContainer = document.createElement("div");
        messageContainer.className = "message-container";

        const senderName = document.createElement("div");
        senderName.style.fontSize = "12px";
        senderName.style.fontWeight = "bold";
        senderName.style.marginBottom = "4px";
        senderName.style.color = "#383838ff";
        senderName.style.alignSelf = "flex-start";
        senderName.innerText = this.mentorsMap[role];

        const botReply = document.createElement("div");

        if (md) {
            let html = this.mdToHTML(reply.response);
            botReply.innerHTML = DOMPurify.sanitize(html);
        } else {
            botReply.innerText = reply.response;
        }

        messageContainer.appendChild(senderName);
        messageContainer.appendChild(botReply);

        this.chatLog.appendChild(messageContainer);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;
    }

    /**
     * Sends queued user messages one at a time so input is not lost.
     * @returns {Promise<void>}
     */
    async processPendingMessages() {
        if (this.isProcessingPendingMessage) return;

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
     * Changes the current mentor.
     * @param {string} mentor - The mentor to switch to.
     */
    changeMentor(mentor) {
        this.AImentor = mentor;

        if (mentor === "meta") {
            this.metaButton.style.background = "orange";
        } else {
            this.metaButton.style.removeProperty("background");
        }

        if (mentor === "code") {
            this.codeButton.style.background = "orange";
        } else {
            this.codeButton.style.removeProperty("background");
        }

        if (mentor === "music") {
            this.musicButton.style.background = "orange";
        } else {
            this.musicButton.style.removeProperty("background");
        }
    }

    /**
     * Starts the chat session by sending the project code to the server.
     *  @returns {Promise<void>}
     */
    async startChatSession() {
        if (this.triggerFirst === true || !this._isWidgetActive()) return;

        this.triggerFirst = true;

        // Reset summarization state for a fresh session
        this.conversationSummary = "";
        this.summarizedUpTo = 0;
        this.startChatTypingTimeout = setTimeout(() => {
            this.startChatTypingTimeout = null;
            if (this.isOpen) {
                this.showTypingIndicator("Reading code");
            }
        }, 1000);

        const code = await this.activity.prepareExport();
        const data = await this.generateAlgorithm(code);

        this.hideTypingIndicator();

        if (!this._isWidgetActive() || !data) {
            return;
        }

        if (!data.error) {
            this.inputContainer.style.display = "flex";
            this.botReplyDiv(data, false, false);
            this.projectAlgorithm = data.algorithm;
            this.code = code;
        } else {
            this.activity.errorMsg(_(data.error), 3000);
        }
    }

    /**
     * Updates the project code and retrieves the new algorithm from the server.
     * @returns {Promise<void>}
     */
    async updateProjectCode() {
        if (this.typingDiv || !this._isWidgetActive()) {
            return;
        }

        const code = await this.activity.prepareExport();
        if (code === this.code) {
            this.activity.textMsg(_("No changes were detected in your project."), 2500);
            return; // No changes in code
        }

        this.showTypingIndicator("Reading code");
        const data = await this.generateNewAlgorithm(code);
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

        this.hideTypingIndicator();

        if (data && data.conversation_summary && data.summarized_up_to !== undefined) {
            this.conversationSummary = data.conversation_summary;
            this.summarizedUpTo = data.summarized_up_to;
        }

        return data;
    }

    /**
     * Fetches analysis from the server and updates the chat log.
     * @returns {Promise<void>}
     */
    async getAnalysis() {
        if (this.chatHistory.length < 10 || this.typingDiv || !this._isWidgetActive()) return;
        this.showTypingIndicator("Analyzing");
        const data = await this.generateAnalysis();
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
     * Sends the chat history and summary to the server to get analysis.
     *  @returns {Promise<Object>} - The server response containing the analysis.
     */
    async generateAnalysis() {
        return this._postJSON("/analysis", {
            messages: this.chatHistory,
            summary: this.summary
        });
    }

    /**
     * Appends the bot's reply to the chat log.
     * @param {string} message - The bot's reply message.
     * @param {boolean} user_query - Flag indicating if the message is from the user.
     * @returns {Promise<void>}
     */
    async botReplyDiv(message, user_query = true, md = false) {
        const replyMentor = this.AImentor;
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
            senderName.style.fontSize = "12px";
            senderName.style.fontWeight = "bold";
            senderName.style.marginBottom = "4px";
            senderName.style.color = "#555";
            senderName.style.overflowWrap = "break-word";
            senderName.style.alignSelf = "flex-start";

            const userMsg = document.createElement("div");
            userMsg.innerText = msg.content;

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

    /**
     * Saves the analysis report to localStorage.
     * @param {Object} data - The analysis data to save.
     * @returns {Promise<void>}
     */
    saveReport(data) {
        const key = "musicblocks_analysis";
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
    /**
     * Sanitizes HTML content using DOMParser to prevent XSS.
     * Removes unsafe attributes and ensures links are safe.
     * @param {string} htmlString - The HTML string to sanitize.
     * @returns {string} - The sanitized HTML string.
     */
    sanitizeHTML(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");

        // Sanitize all elements
        const elements = doc.body.querySelectorAll("*");
        for (const el of elements) {
            const tagName = el.tagName.toLowerCase();

            // Remove forbidden tags that can execute code or change page behavior
            const forbiddenTags = ["script", "iframe", "object", "embed", "base", "form"];
            if (forbiddenTags.includes(tagName)) {
                el.remove();
                continue;
            }

            const attrs = el.attributes;

            for (let i = attrs.length - 1; i >= 0; i--) {
                const attrName = attrs[i].name.toLowerCase();
                const attrValue = attrs[i].value;

                // Remove all event handlers
                if (attrName.startsWith("on")) {
                    el.removeAttribute(attrName);
                    continue;
                }

                // Sanitize URL attributes (href, src)
                if (attrName === "href" || attrName === "src") {
                    if (!isSafeUrl(attrValue)) {
                        el.removeAttribute(attrName);
                    } else if (tagName === "a" && attrName === "href") {
                        // Enforce security attributes for external links
                        el.setAttribute("target", "_blank");
                        el.setAttribute("rel", "noopener noreferrer");
                    }
                    continue;
                }

                // Sanitize style attribute
                if (attrName === "style") {
                    // Check for dangerous keywords in style properties
                    const dangerousStyleKeywords = ["javascript:", "url(", "expression", "eval"];
                    if (dangerousStyleKeywords.some(kw => attrValue.toLowerCase().includes(kw))) {
                        el.removeAttribute(attrName);
                    }
                    continue;
                }

                // Remove other potentially dangerous attributes (like action, formaction, etc.)
                const sensitiveAttrs = ["action", "formaction", "data", "codebase"];
                if (sensitiveAttrs.includes(attrName)) {
                    el.removeAttribute(attrName);
                }
            }
        }

        return doc.body.innerHTML;
    }

    /**
     * Checks if a URL is unsafe.
     * @param {string} url - The URL to check.
     * @returns {boolean} - True if unsafe, false otherwise.
     */
    isUnsafeUrl(url) {
        return !isSafeUrl(url);
    }

    /**
     * Converts Markdown text to HTML.
     * @param {string} md - The Markdown text.
     * @returns {string} - The converted HTML text.
     */
    mdToHTML(md) {
        // Step 1: Escape HTML first to prevent XSS attacks from raw tags
        let html = escapeHTML(md);

        // Step 2: Convert Markdown syntax to HTML

        // Headings
        html = html.replace(/^###### (.*$)/gim, "<h6>$1</h6>");
        html = html.replace(/^##### (.*$)/gim, "<h5>$1</h5>");
        html = html.replace(/^#### (.*$)/gim, "<h4>$1</h4>");
        html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
        html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
        html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

        // Bold & Italic
        html = html.replace(/\*\*(.*?)\*\*/gim, "<b>$1</b>");
        html = html.replace(/\*(.*?)\*/gim, "<i>$1</i>");

        // Links - Create raw anchor tags, sanitization happens in Step 3
        html = html.replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2'>$1</a>");

        // Line breaks
        html = html.replace(/\n/gim, "<br>");

        // Step 3: Sanitize the generated HTML using DOMParser
        return this.sanitizeHTML(html);
    }
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = ReflectionMatrix;
}
