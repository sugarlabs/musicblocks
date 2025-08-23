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
    static OUTERWINDOWWIDTH = 858;
    static INNERWINDOWWIDTH = 730;
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;

    constructor() {
        this.chatHistory = [];
        this.AImentor = "meta";
        this.mentorsMap = {
            user: "YOU",
            meta: "ROHAN",
            music: "BEETHOVEN",
            code: "STEVE"
        };

        this.triggerFirst = false;
        this.projectAlgorithm = "";
    }

    /**
     * Initializes the reflection widget.
     */
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
        widgetWindow.getWidgetBody().style.height = "550px";
        widgetWindow.getWidgetBody().style.width = "900px";

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

        widgetWindow.addButton("notes_icon.svg", 32, _("Summary")).onclick = () =>
            this.getAnalysis();
        widgetWindow.addButton("save-button-dark.svg", 32, _("Save")).onclick = () =>
            this.downloadAsTxt(this.chatHistory); // text download

        this.metaButton = widgetWindow.addButton("general_mentor.svg", 32, _("Talk with Rohan"));
        this.metaButton.onclick = () => this.changeMentor("meta");

        this.codeButton = widgetWindow.addButton("code.svg", 32, _("Talk with Steve"));
        this.codeButton.onclick = () => this.changeMentor("code");

        this.musicButton = widgetWindow.addButton("music.svg", 32, _("Talk with Beethoven"));
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
    }

    changeMentor(mentor) {
        this.AImentor = mentor;
        console.log(this.chatHistory);

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

    async startChatSession() {
        if (this.triggerFirst == true) return;
        this.triggerFirst = true;
        const code = await this.activity.prepareExport();
        const data = await this.generateAlgorithm(code);
        if (data && !data.error) {
            this.inputContainer.style.display = "flex";
            this.botReplyDiv(data, false);
        } else {
            this.activity.errorMsg(_(data.error), 3000);
        }
        this.projectAlgorithm = data.algorithm;
    }

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

    async generateBotReply(message, chatHistory, mentor, algorithm) {
        try {
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
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error :", error);
            return { error: "Failed to send message" };
        }
    }

    async getAnalysis() {
        if (!this.chatHistory.length > 10) return;
        const data = await this.generateAnalysis();
        console.log(data);
        if (data) {
            this.botReplyDiv(data, false);
        }
        await this.saveReport(data);
    }

    async generateAnalysis() {
        try {
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
        botReply.innerText = reply.response || reply.error;

        messageContainer.appendChild(senderName);
        messageContainer.appendChild(botReply);

        this.chatLog.appendChild(messageContainer);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;
    }

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

    saveReport(data) {
        const key = "musicblocks_analysis";
        const conversation = {
            analysis: data
        };
        localStorage.setItem(key, JSON.stringify(conversation));
        console.log("Conversation saved in localStorage.");
    }

    readReport() {
        const key = "musicblocks_analysis";
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    downloadAsTxt(conversationData) {

        const transcript = conversationData
            .map((item) => `${this.mentorsMap[item.role] || item.role.toUpperCase()}: ${item.content}`)
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
