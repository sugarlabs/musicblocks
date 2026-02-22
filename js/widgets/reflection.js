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

/**
 * Represents Reflection Widget.
 * @constructor
 */

class ReflectionMatrix {
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
    }

    /**
     * Initializes the reflection widget.
     */

    init(activity) {
        this.activity = activity;
        this.isOpen = true;
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
            this.activity.isInputON = false;
            if (this.dotsInterval) {
                clearInterval(this.dotsInterval);
            }
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

        activity.textMsg(_("Reflect on your project."), 3000);
    }

    /**
     * Displays a typing indicator with animated dots.
     * @returns {void}
     */
    showTypingIndicator(action) {
        if (this.typingDiv) return;

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
        if (this.typingDiv) {
            clearInterval(this.dotsInterval);
            this.typingDiv.remove();
            this.typingDiv = null;
        }
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
        if (this.triggerFirst == true) return;

        this.triggerFirst = true;
        setTimeout(() => {
            this.showTypingIndicator("Reading code");
        }, 1000);

        const code = await this.activity.prepareExport();
        const data = await this.generateAlgorithm(code);

        this.hideTypingIndicator();

        if (data && !data.error) {
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
        const code = await this.activity.prepareExport();
        if (code === this.code) {
            console.log("No changes in code detected.");
            return; // No changes in code
        }

        this.showTypingIndicator("Reading code");
        const data = await this.generateNewAlgorithm(code);
        this.hideTypingIndicator();

        if (data && !data.error) {
            if (data.algorithm !== "unchanged") {
                this.projectAlgorithm = data.algorithm; // update algorithm
                this.code = code;
            } else {
                console.log("No changes in algorithm detected.");
            }
            this.botReplyDiv(data, false, false);
        } else {
            this.activity.errorMsg(_(data.error), 3000);
        }

        this.projectAlgorithm = data.algorithm;
    }

    /**
     * Sends the project code to the server and retrieves the algorithm.
     * @param {string} code - The project code.
     * @returns {Promise<Object>} - The server response containing the algorithm.
     */
    async generateAlgorithm(code) {
        try {
            const response = await fetch(`${this.PORT}/projectcode`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: code
                })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error :", error);
            return { error: "Failed to send message" };
        }
    }

    /**
     * Sends the previous algorithm and new code to the server to get an updated algorithm.
     * @param {string} previousAlgorithm - The previous project algorithm.
     * @param {string} code - The new project code.
     * @returns {Promise<Object>} - The server response containing the updated algorithm.
     */
    async generateNewAlgorithm(code) {
        try {
            const response = await fetch(`${this.PORT}/updatecode`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    oldcode: this.code,
                    newcode: code
                })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error :", error);
            return { error: "Failed to send message" };
        }
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
        try {
            this.showTypingIndicator();
            const response = await fetch(`${this.PORT}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: message,
                    messages: chatHistory,
                    mentor: mentor,
                    algorithm: algorithm
                })
            });
            this.hideTypingIndicator();
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error :", error);
            return { error: "Failed to send message" };
        }
    }

    /**
     * Fetches analysis from the server and updates the chat log.
     * @returns {Promise<void>}
     */
    async getAnalysis() {
        if (this.chatHistory.length < 10) return;
        this.showTypingIndicator("Analyzing");
        const data = await this.generateAnalysis();
        this.hideTypingIndicator();
        if (data) {
            this.botReplyDiv(data, false, true);
        }
        await this.saveReport(data);
    }

    /**
     * Sends the chat history and summary to the server to get analysis.
     *  @returns {Promise<Object>} - The server response containing the analysis.
     */
    async generateAnalysis() {
        try {
            console.log("Summary stored", this.summary);
            const response = await fetch(`${this.PORT}/analysis`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: this.chatHistory,
                    summary: this.summary
                })
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error :", error);
            return { error: "Failed to send message" };
        }
    }

    /**
     * Appends the bot's reply to the chat log.
     * @param {string} message - The bot's reply message.
     * @param {boolean} user_query - Flag indicating if the message is from the user.
     * @returns {Promise<void>}
     */
    async botReplyDiv(message, user_query = true, md = false) {
        let reply;
        // check if message is from user or bot
        if (user_query === true) {
            if (this.typingDiv) return;
            reply = await this.generateBotReply(
                message,
                this.chatHistory,
                this.AImentor,
                this.projectAlgorithm
            );
        } else {
            reply = message;
        }

        if (reply.error) {
            this.hideTypingIndicator();
            this.activity.errorMsg(_("Failed to send message"), 3000);
            return;
        }

        this.chatHistory.push({
            role: this.AImentor,
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
        senderName.innerText = this.mentorsMap[this.AImentor];

        const botReply = document.createElement("div");

        if (md) {
            botReply.innerHTML = this.mdToHTML(reply.response);
        } else {
            botReply.innerText = reply.response;
        }

        messageContainer.appendChild(senderName);
        messageContainer.appendChild(botReply);

        this.chatLog.appendChild(messageContainer);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;
    }

    /**
     * Handles sending user messages.
     * @returns {void}
     */
    sendMessage() {
        const text = this.input.value.trim();
        if (text === "") return;
        this.chatHistory.push({
            role: "user",
            content: text
        });

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
        this.input.value = "";
        this.botReplyDiv(text);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;
    }

    /**
     * Renders the chat history in the chat log.
     * @returns {void}
     */
    renderChatHistory() {
        this.chatLog.innerHTML = "";

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
        console.log("Conversation saved in localStorage.");
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
     * Escapes HTML special characters to prevent XSS attacks.
     * @param {string} text - The text to escape.
     * @returns {string} - The escaped text.
     */
    escapeHTML(text) {
        const escapeMap = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;"
        };
        return text.replace(/[&<>"']/g, char => escapeMap[char]);
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

        // Sanitize links
        const links = doc.getElementsByTagName("a");
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const href = link.getAttribute("href");

            // If no href, or it's unsafe, remove the attribute
            if (!href || this.isUnsafeUrl(href)) {
                link.removeAttribute("href");
            } else {
                // Enforce security attributes for external links
                link.setAttribute("target", "_blank");
                link.setAttribute("rel", "noopener noreferrer");
            }
        }

        return doc.body.innerHTML;
    }

    /**
     * Checks if a URL is unsafe (javascript:, data:, vbscript:).
     * @param {string} url - The URL to check.
     * @returns {boolean} - True if unsafe, false otherwise.
     */
    isUnsafeUrl(url) {
        const trimmed = url.trim().toLowerCase();
        const unsafeSchemes = ["javascript:", "data:", "vbscript:"];
        // Check if it starts with any unsafe scheme
        // Note: DOMParser handles HTML entity decoding, so we check the raw attribute safely here
        // But for extra safety against control characters, we rely on the fact that
        // we are operating on the parsed DOM attribute.
        return unsafeSchemes.some(scheme => trimmed.replace(/\s+/g, "").startsWith(scheme));
    }

    /**
     * Converts Markdown text to HTML.
     * @param {string} md - The Markdown text.
     * @returns {string} - The converted HTML text.
     */
    mdToHTML(md) {
        // Step 1: Escape HTML first to prevent XSS attacks from raw tags
        let html = this.escapeHTML(md);

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
