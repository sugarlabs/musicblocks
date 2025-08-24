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

/* */

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
            code: "STEVE"
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
    }

    /**
     * Initializes the reflection widget.
     */

    // download current summary
    // download analysis as text file
    // .md to html conversion
    init(activity) {
        this.activity = activity;
        this.isOpen = true;
        this.isMaximized = false;
        this.activity.isInputON = true;
        this.PORT = "http://52.65.37.66:8000";

        const widgetWindow = window.widgetWindows.windowFor(this, "reflection", "reflection");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        widgetWindow.getWidgetBody().style.height = ReflectionMatrix.OUTERWINDOWHEIGHT;
        widgetWindow.getWidgetBody().style.width = ReflectionMatrix.OUTERWINDOWWIDTH;

        widgetWindow.onclose = () => {
            this.isOpen = false;
            this.activity.isInputON = false;
            widgetWindow.destroy();
        };

        // retrieve string from localStorage
        this.summary = this.readReport() || "No reports available";

        this.chatInterface = document.createElement("div");
        this.chatInterface.className = "chatInterface";
        widgetWindow.getWidgetBody().append(this.chatInterface);

        widgetWindow.addButton(
            "notes_icon.svg",
            ReflectionMatrix.ICONSIZE,
            _("Summary")
        ).onclick = () => this.getAnalysis();
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
            _("Talk with Steve")
        );
        this.codeButton.onclick = () => this.changeMentor("code");

        this.musicButton = widgetWindow.addButton(
            "music.svg",
            ReflectionMatrix.ICONSIZE,
            _("Talk with Beethoven")
        );
        this.musicButton.onclick = () => this.changeMentor("music");

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

        this.input.onkeydown = (e) => {
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
    showTypingIndicator() {
        if (this.typingDiv) return;

        this.typingDiv = document.createElement("div");
        this.typingDiv.className = "typing-indicator";

        const textElement = document.createElement("span");
        textElement.textContent = "Thinking";
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
            this.showTypingIndicator();
        }, 1000);

        const code = await this.activity.prepareExport();
        const data = await this.generateAlgorithm(code);

        this.hideTypingIndicator();

        if (data && !data.error) {
            this.inputContainer.style.display = "flex";
            this.botReplyDiv(data, false);
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
        this.showTypingIndicator();
        const data = await this.generateAnalysis();
        console.log(data.analysis);
        this.hideTypingIndicator();
        if (data) {
            this.botReplyDiv(data, false);
        }
        await this.saveReport(data);
    }

    /**
     * Sends the chat history and summary to the server to get analysis.
     *  @returns {Promise<Object>} - The server response containing the analysis.
     */
    async generateAnalysis() {
        try {
            console.log(this.summary);
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
    async botReplyDiv(message, user_query = true) {
        let reply;
        // check if message is from user or bot
        if (user_query === true) {
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
        botReply.innerText = reply.response;

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

        this.chatHistory.forEach((msg) => {
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
        localStorage.setItem(key, data.response);
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
                (item) =>
                    `${this.mentorsMap[item.role] || item.role.toUpperCase()}: ${item.content}`
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
