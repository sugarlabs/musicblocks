// Copyright (c) 2025 Om Santosh Suneri
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* This widget provides an AI-powered debugging interface for Music Blocks projects,
offering intelligent assistance, cool suggestions, and helping take your musical creations to new heights! */

/**
 * Represents a AI Widget.
 * @constructor
 */
function AIDebuggerWidget() {
    const ICONSIZE = 32;
    const CHATWIDTH = 900;
    const CHATHEIGHT = 600;

    const BACKEND_CONFIG = {
        BASE_URL: (() => {
            if (
                window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1"
            ) {
                return "http://localhost:8000";
            } else if (window.location.hostname.includes("musicblocks.sugarlabs.org")) {
                return `${window.location.protocol}//api.musicblocks.sugarlabs.org`;
            } else {
                return `${window.location.protocol}//${window.location.hostname}:8000`;
            }
        })(),
        ENDPOINTS: {
            ANALYZE: "/analyze"
        },
        TIMEOUT: 30000
    };

    /**
     * Chat history array to store conversation
     * @type {Array}
     */
    this.chatHistory = [];

    /**
     * Prompt count for tracking conversation progression
     * @type {number}
     */
    this.promptCount = 0;

    /**
     * Current conversation ID for tracking sessions
     * @type {string}
     */
    this.conversationId = null;

    /**
     * Reference to the activity object
     * @type {object}
     */
    this.activity = null;

    /**
     * Widget window reference
     * @type {object}
     */
    this.widgetWindow = null;

    /**
     * Chat log container
     * @type {HTMLElement}
     */
    this.chatLog = null;

    /**
     * Input field for messages
     * @type {HTMLElement}
     */
    this.messageInput = null;

    /**
     * Send button
     * @type {HTMLElement}
     */
    this.sendButton = null;

    /**
     * Generates a unique conversation ID
     * @returns {string} Unique conversation identifier
     * @private
     */
    this._generateConversationId = function () {
        return "conv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11);
    };

    this.conversationId = this._generateConversationId();

    /**
     * Initializes the Debugger Widget.
     * @param {object} activity
     * @returns {void}
     */
    this.init = function (activity) {
        this.activity = activity;
        this.activity.isInputON = true;

        if (!this.conversationId) {
            this.conversationId = this._generateConversationId();
        }

        const widgetWindow = window.widgetWindows.windowFor(this, "Debugger");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        widgetWindow.getWidgetBody().style.width = CHATWIDTH + "px";
        widgetWindow.getWidgetBody().style.height = CHATHEIGHT + "px";

        widgetWindow.onclose = () => {
            widgetWindow.destroy();
            this.activity.isInputON = false;
        };

        widgetWindow.onmaximize = this._scale.bind(this);

        this._resetButton = widgetWindow.addButton("reload.svg", ICONSIZE, _("Reset conversation"));
        this._resetButton.onclick = () => {
            this._resetConversation();
        };

        this._exportButton = widgetWindow.addButton("download.svg", ICONSIZE, _("Export chat"));
        this._exportButton.onclick = () => {
            this._exportChat();
        };

        this._createLayout();
        this._loadProjectAndInitialize();
        widgetWindow.sendToCenter();
        this.activity.textMsg(_("Debugger initialized"));
    };

    /**
     * Creates the main layout structure
     * @private
     */
    this._createLayout = function () {
        const mainContainer = document.createElement("div");
        mainContainer.style.display = "flex";
        mainContainer.style.height = "100%";
        mainContainer.style.width = "100%";

        this._createChatArea(mainContainer);
        this.widgetWindow.getWidgetBody().appendChild(mainContainer);
    };

    /**
     * Creates the main chat area
     *
     * @param {HTMLElement} container
     * @private
     */
    this._createChatArea = function (container) {
        const chatContainer = document.createElement("div");
        chatContainer.style.width = "100%";
        chatContainer.style.display = "flex";
        chatContainer.style.flexDirection = "column";
        chatContainer.style.height = "100%";

        // Chat log area
        this.chatLog = document.createElement("div");
        this.chatLog.className = "chatLog";
        this.chatLog.style.flex = "1";
        this.chatLog.style.overflowY = "auto";
        this.chatLog.style.padding = "15px";
        this.chatLog.style.backgroundColor = "#fafafa";
        this.chatLog.style.display = "flex";
        this.chatLog.style.flexDirection = "column";
        this.chatLog.style.gap = "10px";

        chatContainer.appendChild(this.chatLog);

        // Input area
        const inputContainer = document.createElement("div");
        inputContainer.style.display = "flex";
        inputContainer.style.padding = "15px";
        inputContainer.style.backgroundColor = "#fff";
        inputContainer.style.borderTop = "1px solid #ddd";
        inputContainer.style.gap = "10px";

        // Message input
        this.messageInput = document.createElement("input");
        this.messageInput.type = "text";
        this.messageInput.placeholder = "Type your message here...";
        this.messageInput.style.flex = "1";
        this.messageInput.style.padding = "12px";
        this.messageInput.style.border = "1px solid #ddd";
        this.messageInput.style.borderRadius = "25px";
        this.messageInput.style.fontSize = "14px";
        this.messageInput.style.outline = "none";

        // Focus styling
        this.messageInput.onfocus = function () {
            this.style.borderColor = "#2196F3";
            this.style.boxShadow = "0 0 5px rgba(33, 150, 243, 0.3)";
        };
        this.messageInput.onblur = function () {
            this.style.borderColor = "#ddd";
            this.style.boxShadow = "none";
        };

        // Send button
        this.sendButton = document.createElement("button");
        this.sendButton.textContent = "Send";
        this.sendButton.style.padding = "12px 20px";
        this.sendButton.style.backgroundColor = "#2196F3";
        this.sendButton.style.color = "white";
        this.sendButton.style.border = "none";
        this.sendButton.style.borderRadius = "25px";
        this.sendButton.style.cursor = "pointer";
        this.sendButton.style.fontSize = "14px";
        this.sendButton.style.fontWeight = "bold";
        this.sendButton.style.transition = "background-color 0.3s";

        this.sendButton.onmouseover = function () {
            this.style.backgroundColor = "#1976D2";
        };
        this.sendButton.onmouseout = function () {
            this.style.backgroundColor = "#2196F3";
        };

        // Event listeners
        this.sendButton.onclick = () => {
            this._sendMessage();
        };

        this.messageInput.onkeypress = e => {
            if (e.key === "Enter") {
                this._sendMessage();
            }
        };

        inputContainer.appendChild(this.messageInput);
        inputContainer.appendChild(this.sendButton);
        chatContainer.appendChild(inputContainer);
        container.appendChild(chatContainer);
    };

    /**
     * Adds welcome message to chat
     * @private
     */
    this._addWelcomeMessage = function () {
        const welcomeMessage = {
            type: "system",
            content: _THIS_IS_MUSIC_BLOCKS_
                ? "Welcome to Music Blocks Debugger! I can help you with music composition, Music Blocks programming, and general music theory questions."
                : "Welcome to Turtle Blocks Debugger! I can help you with programming, turtle graphics, and general coding questions.",
            timestamp: new Date().toISOString()
        };
        this._addMessageToUI(welcomeMessage);
    };

    /**
     * Sends a message
     * @private
     */
    this._sendMessage = function () {
        const messageText = this.messageInput.value.trim();
        if (messageText === "") return;

        const userMessage = {
            type: "user",
            content: messageText,
            timestamp: new Date().toISOString()
        };

        this.chatHistory.push(userMessage);
        this._addMessageToUI(userMessage);
        this.messageInput.value = "";
        this._updateMessageCount();
        this._sendToBackend(messageText);
    };

    /**
     * Adds a message to the UI
     * @param {object} message
     * @private
     */
    this._addMessageToUI = function (message) {
        const messageDiv = document.createElement("div");
        messageDiv.style.maxWidth = "80%";
        messageDiv.style.padding = "12px 16px";
        messageDiv.style.borderRadius = "18px";
        messageDiv.style.marginBottom = "8px";
        messageDiv.style.wordWrap = "break-word";
        messageDiv.style.fontSize = "14px";
        messageDiv.style.lineHeight = "1.4";

        const timeDiv = document.createElement("div");
        timeDiv.style.fontSize = "11px";
        timeDiv.style.opacity = "0.7";
        timeDiv.style.marginTop = "4px";
        timeDiv.textContent = new Date(message.timestamp).toLocaleTimeString();

        if (message.type === "user") {
            messageDiv.style.alignSelf = "flex-end";
            messageDiv.style.backgroundColor = "#2196F3";
            messageDiv.style.color = "white";
            messageDiv.textContent = message.content;
            messageDiv.appendChild(timeDiv);
        } else if (message.type === "bot") {
            messageDiv.style.alignSelf = "flex-start";
            messageDiv.style.backgroundColor = "#e0e0e0";
            messageDiv.style.color = "#333";
            messageDiv.textContent = message.content;
            messageDiv.appendChild(timeDiv);
        } else if (message.type === "system") {
            messageDiv.style.alignSelf = "center";
            messageDiv.style.backgroundColor = "#fff3cd";
            messageDiv.style.color = "#856404";
            messageDiv.style.border = "1px solid #ffeaa7";
            messageDiv.style.fontStyle = "italic";
            messageDiv.textContent = message.content;
            messageDiv.appendChild(timeDiv);
        }

        this.chatLog.appendChild(messageDiv);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;
    };

    /**
     * Sends message to backend
     * @param {string} message
     * @private
     */
    this._sendToBackend = function (message) {
        this._showTypingIndicator();
        this.promptCount++;
        let projectData;
        try {
            const rawProjectData = this.activity.prepareExport();
            const parsedData = JSON.parse(rawProjectData);
            projectData = rawProjectData;
        } catch (error) {
            console.error("Error getting project data:", error);
            this.activity.textMsg(_("Debugger error: Could not prepare project data."));
            projectData = "[]";
        }

        const history = this.chatHistory
            .filter(msg => msg.type !== "system")
            .map(msg => ({
                role: msg.type === "user" ? "user" : "assistant",
                content: msg.content
            }));

        const payload = {
            code: projectData,
            prompt: message,
            history: history,
            prompt_count: this.promptCount
        };

        fetch(`${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.ANALYZE}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                this._hideTypingIndicator();

                if (data && data.response) {
                    const botResponse = {
                        type: "bot",
                        content: data.response,
                        timestamp: new Date().toISOString()
                    };

                    this.chatHistory.push(botResponse);
                    this._addMessageToUI(botResponse);
                    this._updateMessageCount();
                } else {
                    this.activity.textMsg(_("Server error: Invalid response from AI backend."));
                    throw new Error("No response from backend");
                }
            })
            .catch(error => {
                this._hideTypingIndicator();
                console.error("Backend connection error:", error.message);

                this.activity.textMsg(_("Server error: Unable to connect to AI backend."));

                if (error instanceof TypeError && error.message.includes("fetch")) {
                    console.error("Network/CORS error. Backend connection failed");
                }

                const fallbackResponse = {
                    type: "bot",
                    content: `I'm sorry, I'm having trouble connecting to the AI backend. Error: ${error.message}. Please check your connection and try again.`,
                    timestamp: new Date().toISOString()
                };

                this.chatHistory.push(fallbackResponse);
                this._addMessageToUI(fallbackResponse);
                this._updateMessageCount();
            });
    };

    /**
     * Shows typing indicator
     * @private
     */
    this._showTypingIndicator = function () {
        const typingDiv = document.createElement("div");
        typingDiv.className = "typing-indicator";
        typingDiv.style.alignSelf = "flex-start";
        typingDiv.style.backgroundColor = "#e0e0e0";
        typingDiv.style.color = "#666";
        typingDiv.style.padding = "12px 16px";
        typingDiv.style.borderRadius = "18px";
        typingDiv.style.marginBottom = "8px";
        typingDiv.style.fontSize = "14px";
        typingDiv.style.fontStyle = "italic";
        typingDiv.textContent = "Debugger is typing...";

        // Add animation
        let dots = 0;
        const animateTyping = setInterval(() => {
            dots = (dots + 1) % 4;
            typingDiv.textContent = "Debugger is typing" + ".".repeat(dots);
        }, 500);

        typingDiv.setAttribute("data-animation-id", animateTyping);

        this.chatLog.appendChild(typingDiv);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;
    };

    /**
     * Hides typing indicator
     * @private
     */
    this._hideTypingIndicator = function () {
        const typingIndicator = this.chatLog.querySelector(".typing-indicator");
        if (typingIndicator) {
            const animationId = typingIndicator.getAttribute("data-animation-id");
            if (animationId) {
                clearInterval(parseInt(animationId));
            }
            typingIndicator.remove();
        }
    };

    /**
     * Updates message count
     * @private
     */
    this._updateMessageCount = function () {
        // removed message count display
        // This method is kept for compatibility with existing calls
    };

    /**
     * Loads current project data and initializes conversation with backend
     * @private
     */
    this._loadProjectAndInitialize = function () {
        try {
            // Get current project data as JSON
            const projectData = this.activity.prepareExport();

            try {
                const parsedData = JSON.parse(projectData);
            } catch (parseError) {
                console.error("Error parsing project data:", parseError);
                this.activity.textMsg(_("Debugger error: Invalid project data format."));
            }

            // Show loading message
            const loadingMessage = {
                type: "system",
                content: "Loading your current project and initializing AI assistant...",
                timestamp: new Date().toISOString()
            };
            this._addMessageToUI(loadingMessage);

            // Send project data to backend for initialization
            this._initializeBackendWithProject(projectData);
        } catch (error) {
            console.error("Error loading project data:", error);

            // Show error message to user
            this.activity.textMsg(_("Debugger error: Could not load project data."));

            // Show error message and fall back to simple welcome
            const errorMessage = {
                type: "system",
                content: "Could not load project data. Starting with basic assistant...",
                timestamp: new Date().toISOString()
            };
            this._addMessageToUI(errorMessage);

            // Fallback to simple welcome
            this._addWelcomeMessage();
        }
    };

    /**
     * Initializes backend with current project data
     * @param {string} projectData
     * @private
     */
    this._initializeBackendWithProject = function (projectData) {
        // convert chat history to the format expected by the backend
        const history = this.chatHistory.map(msg => ({
            role: msg.type === "user" ? "user" : "assistant",
            content: msg.content
        }));

        const initPayload = {
            code: projectData,
            prompt: "", // Empty prompt for initial analysis
            history: history,
            prompt_count: 1
        };

        // Show typing indicator during initialization
        this._showTypingIndicator();

        fetch(`${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.ANALYZE}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(initPayload)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                this._hideTypingIndicator();

                if (data.response) {
                    // Add the backend's initial response
                    const botResponse = {
                        type: "bot",
                        content: data.response,
                        timestamp: new Date().toISOString()
                    };

                    this.chatHistory.push(botResponse);
                    this._addMessageToUI(botResponse);
                    this._updateMessageCount();
                    this.promptCount = 1; // Set initial prompt count
                } else {
                    this.activity.textMsg(_("Server error: No initial response from AI backend."));
                    throw new Error("No initial response from backend");
                }
            })
            .catch(error => {
                this._hideTypingIndicator();
                console.error("Backend initialization error:", error.message);
                this.activity.textMsg(_("Server error: Failed to initialize AI debugger."));

                if (error instanceof TypeError && error.message.includes("fetch")) {
                    console.error("Network/CORS error. Backend connection failed");
                }

                const errorMessage = {
                    type: "system",
                    content: `Could not connect to AI backend: ${error.message}. Please check your connection and try again.`,
                    timestamp: new Date().toISOString()
                };
                this._addMessageToUI(errorMessage);

                this._addWelcomeMessage();
            });
    };

    /**
     * Resets the conversation and initializes with project data
     * @private
     */
    this._resetConversation = function () {
        this.chatHistory = [];
        this.promptCount = 0; // Reset prompt count
        this.conversationId = this._generateConversationId();
        this.chatLog.innerHTML = "";

        this._loadProjectAndInitialize();
        this._updateMessageCount();
        this.activity.textMsg(_("Conversation reset."));
    };

    /**
     * Exports the chat conversation as a text file
     * @private
     */
    this._exportChat = function () {
        if (this.chatHistory.length === 0) {
            this.activity.textMsg(_("No conversation to export."));
            return;
        }

        let convertedText = "";
        try {
            const projectData = this.activity.prepareExport();
            try {
                const parsedData = JSON.parse(projectData);
                convertedText = this._convertProjectToLLMFormat(parsedData);
            } catch (parseError) {
                convertedText = "Could not convert project to readable format";
            }
        } catch (error) {
            console.error("Error getting project data for export:", error);
            this.activity.textMsg(_("Debugger error: Could not retrieve project data for export."));
            convertedText = "Could not convert project to readable format";
        }

        const appName = _THIS_IS_MUSIC_BLOCKS_ ? "Music Blocks" : "Turtle Blocks";
        let exportContent = `${appName} Debugger Chat Export\n`;
        exportContent += "Generated at: " + new Date().toLocaleString() + "\n\n";
        exportContent += "Project Code (Human Readable Format):\n";
        exportContent += convertedText + "\n\n";
        exportContent += "Chat History:\n\n";

        this.chatHistory.forEach(message => {
            const role = message.type === "user" ? "User" : `${appName} Debugger`;
            exportContent += role + ":\n";
            exportContent += message.content + "\n\n";
        });

        const blob = new Blob([exportContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
            "music_blocks_chat_" +
            new Date().toISOString().replace(/[:.]/g, "-").split("T")[0] +
            "_" +
            new Date().toTimeString().split(" ")[0].replace(/:/g, "") +
            ".txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.activity.textMsg(_("Chat exported successfully."));
    };

    /**
     * Converts project JSON to advanced text representation
     * @param {Array} projectData
     * @returns {string}
     * @private
     */
    this._convertProjectToLLMFormat = function (projectData) {
        if (!Array.isArray(projectData)) {
            return "Invalid JSON format: Expected a list at the root.";
        }

        if (projectData.length === 0) {
            return "Warning: No blocks found in input!";
        }

        const outputLines = ["Start of Project"];
        const blockMap = Object.fromEntries(projectData.map(block => [block[0], block]));
        const visited = new Set();

        const rootBlock =
            projectData.find(block => {
                const blockType = Array.isArray(block[1]) ? block[1][0] : block[1];
                return blockType === "start";
            }) || projectData[0];

        outputLines.push(...this._processBlock(rootBlock, blockMap, visited, 1));

        for (const block of projectData) {
            const blockId = block[0];
            if (!visited.has(blockId)) {
                const blockType = Array.isArray(block[1]) ? block[1][0] : block[1];
                if (blockType !== "hidden" && blockType !== "vspace" && blockId !== rootBlock[0]) {
                    outputLines.push(...this._processBlock(block, blockMap, visited, 1));
                }
            }
        }

        return outputLines.join("\n");
    };

    /**
     * Clears the chat display
     * @private
     */
    this._clearChat = function () {
        this.chatLog.innerHTML = "";
        this.activity.textMsg(_("Chat cleared."));
    };

    /**
     * Processes a block and its children recursively
     * @param {Array} block
     * @param {Object} blockMap
     * @param {Set} visited
     * @param {number} indent
     * @param {boolean} isClamp
     * @param {string} parentBlockType
     * @returns {Array}
     * @private
     */
    this._processBlock = function (
        block,
        blockMap,
        visited,
        indent = 1,
        isClamp = false,
        parentBlockType = null
    ) {
        const output = [];
        const blockId = block[0];

        if (visited.has(blockId)) {
            return output;
        }

        visited.add(blockId);

        let blockType = block[1];
        let blockArgs = null;
        if (Array.isArray(blockType)) {
            blockArgs = blockType[1];
            blockType = blockType[0];

            if (blockArgs && typeof blockArgs === "object") {
                for (const key in blockArgs) {
                    if (typeof blockArgs[key] === "string" && this._isBase64Data(blockArgs[key])) {
                        blockArgs[key] = "data";
                    }
                }
            }
        }

        if (["vspace", "hidden"].includes(blockType)) {
            const connections = Array.isArray(block[block.length - 1])
                ? block[block.length - 1]
                : [];
            for (const childId of connections) {
                if (blockMap[childId]) {
                    output.push(
                        ...this._processBlock(
                            blockMap[childId],
                            blockMap,
                            visited,
                            indent,
                            isClamp,
                            blockType
                        )
                    );
                }
            }
            return output;
        }

        if (blockType === "number" || blockType === "drumname" || blockType === "solfege") {
            return output;
        }

        const blockRepresentation = this._getBlockRepresentation(
            blockType,
            blockArgs,
            block,
            blockMap,
            indent,
            isClamp,
            parentBlockType
        );
        if (!blockRepresentation) {
            return output;
        }

        const prefix = "│   ".repeat(indent - 1) + "├── ";
        output.push(`${prefix}${blockRepresentation}`);

        const connections = Array.isArray(block[block.length - 1]) ? block[block.length - 1] : [];

        for (let i = 0; i < connections.length - 1; i++) {
            const childId = connections[i];
            if (childId !== null && blockMap[childId]) {
                const childBlockType = Array.isArray(blockMap[childId][1])
                    ? blockMap[childId][1][0]
                    : blockMap[childId][1];
                if (
                    !(
                        childBlockType === "divide" &&
                        (parentBlockType === "newnote" ||
                            parentBlockType === "setmasterbpm2" ||
                            parentBlockType === "arc")
                    )
                ) {
                    output.push(
                        ...this._processBlock(
                            blockMap[childId],
                            blockMap,
                            visited,
                            indent + 1,
                            true,
                            blockType
                        )
                    );
                }
            }
        }

        if (connections.length > 0 && connections[connections.length - 1] !== null) {
            const childId = connections[connections.length - 1];
            if (blockMap[childId]) {
                output.push(
                    ...this._processBlock(
                        blockMap[childId],
                        blockMap,
                        visited,
                        indent,
                        false,
                        blockType
                    )
                );
            }
        }

        if (blockType === "start" || blockType === "action") {
            output.push("│   ".repeat(indent - 1) + "│");
        }

        return output;
    };

    /**
     * Gets advanced block representation
     * @param {string} blockType
     * @param {Object} blockArgs
     * @param {Array} block
     * @param {Object} blockMap
     * @param {number} indent
     * @param {boolean} isClamp
     * @param {string} parentBlockType
     * @returns {string}
     * @private
     */
    this._getBlockRepresentation = function (
        blockType,
        blockArgs,
        block,
        blockMap,
        indent,
        isClamp,
        parentBlockType
    ) {
        const connections = block[block.length - 1] || [];

        switch (blockType) {
            case "start": {
                const turtleInfo = [
                    `ID: ${blockArgs.id}`,
                    `Position: (${blockArgs.xcor.toFixed(2)}, ${blockArgs.ycor.toFixed(2)})`,
                    `Heading: ${blockArgs.heading}°`,
                    `Color: ${blockArgs.color}, Shade: ${blockArgs.shade}`,
                    `Pen Size: ${blockArgs.pensize}, Grey: ${blockArgs.grey.toFixed(2)}`
                ].join(", ");
                return `Start Block --> {${turtleInfo}}`;
            }

            case "setmasterbpm2": {
                const bpmValue = this._getNumericValue(connections[1], blockMap);
                let bpmOutput = `Set Master BPM → ${bpmValue || "?"} BPM`;

                if (
                    connections[2] &&
                    blockMap[connections[2]] &&
                    blockMap[connections[2]][1] === "divide"
                ) {
                    const divideBlock = blockMap[connections[2]];
                    const numerator = this._getNumericValue(
                        divideBlock[divideBlock.length - 1][1],
                        blockMap
                    );
                    const denominator = this._getNumericValue(
                        divideBlock[divideBlock.length - 1][2],
                        blockMap
                    );
                    if (numerator !== null && denominator !== null && denominator !== 0) {
                        bpmOutput += `\n${"│   ".repeat(
                            indent
                        )}├── beat value --> ${numerator}/${denominator} = ${(
                            numerator / denominator
                        ).toFixed(2)}`;
                    }
                }
                return bpmOutput;
            }

            case "divide": {
                const numerator = this._getNumericValue(connections[1], blockMap);
                const denominator = this._getNumericValue(connections[2], blockMap);
                let result = "?";
                if (numerator !== null && denominator !== null && denominator !== 0) {
                    result = (numerator / denominator).toFixed(2);
                }

                if (parentBlockType === "newnote") {
                    return `Duration --> ${numerator || "?"}/${denominator || "?"} = ${result}`;
                }
                return `Divide Block --> ${numerator || "?"}/${denominator || "?"} = ${result}`;
            }

            case "storein2": {
                const varName = blockArgs?.value || "unnamed";
                const varValue = this._getNumericValue(connections[1], blockMap);
                return `Store Variable "${varName}" → ${varValue !== null ? varValue : "?"}`;
            }

            case "namedbox":
                return `Variable: "${blockArgs?.value || "unnamed"}"`;

            case "action": {
                const actionName = this._getTextValue(connections[1], blockMap);
                return `Action: "${actionName || "unnamed"}"`;
            }

            case "repeat": {
                let repeatCount = "?";
                let repeatText = "?";

                if (connections[1] && blockMap[connections[1]]) {
                    const countBlock = blockMap[connections[1]];
                    if (Array.isArray(countBlock[1]) && countBlock[1][0] === "divide") {
                        const num = this._getNumericValue(
                            countBlock[countBlock.length - 1][1],
                            blockMap
                        );
                        const den = this._getNumericValue(
                            countBlock[countBlock.length - 1][2],
                            blockMap
                        );
                        if (num !== null && den !== null && den !== 0) {
                            repeatCount = (num / den).toFixed(2);
                            repeatText = `${num}/${den} = ${repeatCount}`;
                        }
                    } else {
                        repeatCount = this._getNumericValue(connections[1], blockMap);
                        repeatText = repeatCount || "?";
                    }
                }
                return `Repeat (${repeatText}) Times`;
            }

            case "forever":
                return "Forever Loop (Repeats Indefinitely)";

            case "penup":
                return "Pen Up (Lifts Pen from Canvas)";

            case "pendown":
                return "Pen Down";

            case "forward": {
                const forwardDist = this._getNumericValue(connections[1], blockMap);
                return `Move Forward → ${forwardDist || "?"} Steps`;
            }

            case "back": {
                const backDist = this._getNumericValue(connections[1], blockMap);
                return `Move Backward → ${backDist || "?"} Steps`;
            }

            case "right": {
                const rightAngle = this._getNumericValue(connections[1], blockMap);
                return `Rotate Right → ${rightAngle || "?"}°`;
            }

            case "left": {
                const leftAngle = this._getNumericValue(connections[1], blockMap);
                return `Rotate Left → ${leftAngle || "?"}°`;
            }

            case "setheading": {
                const heading = this._getNumericValue(connections[1], blockMap);
                return `Set Heading → ${heading || "0"}°`;
            }

            case "show": {
                const showValue = this._getNumericValue(connections[2], blockMap);
                return `Show Number: ${showValue || "?"}`;
            }

            case "increment": {
                const incColor = this._getNumericValue(connections[1], blockMap);
                const incAmount = this._getNumericValue(connections[2], blockMap);
                return `Increment --> Color: ${incColor || "?"}, Amount: ${incAmount || "?"}`;
            }

            case "incrementOne": {
                const incOneVar = this._getNamedBoxValue(connections[1], blockMap);
                return `Increment Variable: "${incOneVar || "?"}"`;
            }

            case "newnote":
                return "Note";

            case "playdrum": {
                const drumName = this._getDrumName(connections[1], blockMap);
                return `Play Drum → ${drumName || "?"}`;
            }

            case "arc": {
                let angle = "?";
                if (connections[3] && blockMap[connections[3]]) {
                    const angleBlock = blockMap[connections[3]];
                    if (Array.isArray(angleBlock[1]) && angleBlock[1][0] === "divide") {
                        const num = this._getNumericValue(
                            angleBlock[angleBlock.length - 1][1],
                            blockMap
                        );
                        const den = this._getNumericValue(
                            angleBlock[angleBlock.length - 1][2],
                            blockMap
                        );
                        if (num !== null && den !== null && den !== 0) {
                            angle = (num / den).toFixed(2);
                        }
                    } else {
                        angle = this._getNumericValue(connections[3], blockMap) || "?";
                    }
                }
                const radius = this._getNumericValue(connections[2], blockMap);
                return `Draw Arc --> Angle: ${angle}°, Radius: ${radius || "?"}`;
            }

            case "print": {
                const printText = this._getTextValue(connections[2], blockMap);
                return `Print: "${printText || ""}"`;
            }

            case "plus": {
                const add1 = this._getNumericValue(connections[1], blockMap);
                const add2 = this._getNumericValue(connections[2], blockMap);
                return `Add --> ${add1 || "?"} + ${add2 || "?"} = ${
                    add1 !== null && add2 !== null ? (add1 + add2).toFixed(2) : "?"
                }`;
            }

            case "text":
                return `"${blockArgs?.value || ""}"`;

            case "pitch": {
                let solfege = "?";
                let octave = this._getNumericValue(connections[2], blockMap);

                if (connections[1] && blockMap[connections[1]]) {
                    const solfegeBlock = blockMap[connections[1]];
                    const solfegeBlockType = Array.isArray(solfegeBlock[1])
                        ? solfegeBlock[1][0]
                        : solfegeBlock[1];

                    if (solfegeBlockType === "text" && Array.isArray(solfegeBlock[1])) {
                        solfege = solfegeBlock[1][1]?.value || "?";
                    } else if (solfegeBlockType === "solfege" && Array.isArray(solfegeBlock[1])) {
                        solfege = solfegeBlock[1][1]?.value || "?";
                    }
                }

                return `Pitch --> Solfege: ${solfege}, Octave: ${octave || "?"}`;
            }

            case "solfege":
                return null;

            case "nameddo": {
                const actionCalled = blockArgs?.value || "unnamed";
                return `Do action --> "${actionCalled}"`;
            }

            case "settransposition": {
                const transpositionValue = this._getNumericValue(connections[1], blockMap);
                return `Set Transposition --> ${transpositionValue || "?"}`;
            }

            default:
                if (blockArgs?.value !== undefined) {
                    return `${blockType}: ${blockArgs.value}`;
                }
                return blockType.charAt(0).toUpperCase() + blockType.slice(1);
        }
    };

    /**
     * Gets numeric value from a block
     * @param {string} blockId
     * @param {Object} blockMap
     * @returns {number}
     * @private
     */
    this._getNumericValue = function (blockId, blockMap) {
        if (blockId === null || !blockMap[blockId]) return null;

        const block = blockMap[blockId];
        const blockType = Array.isArray(block[1]) ? block[1][0] : block[1];

        if (blockType === "number") {
            return Array.isArray(block[1]) ? block[1][1]?.value : block[1];
        }
        return null;
    };

    /**
     * Gets text value from a block
     * @param {string} blockId
     * @param {Object} blockMap
     * @returns {string}
     * @private
     */
    this._getTextValue = function (blockId, blockMap) {
        if (blockId === null || !blockMap[blockId]) return null;

        const block = blockMap[blockId];
        const blockType = Array.isArray(block[1]) ? block[1][0] : block[1];

        if (blockType === "text" && Array.isArray(block[1])) {
            return block[1][1]?.value;
        }
        return null;
    };

    /**
     * Gets drum name from a block
     * @param {string} blockId
     * @param {Object} blockMap
     * @returns {string}
     * @private
     */
    this._getDrumName = function (blockId, blockMap) {
        if (blockId === null || !blockMap[blockId]) return null;

        const block = blockMap[blockId];
        const blockType = Array.isArray(block[1]) ? block[1][0] : block[1];

        if (blockType === "drumname" && Array.isArray(block[1])) {
            return block[1][1]?.value;
        }
        return null;
    };

    /**
     * Gets named box value from a block
     * @param {string} blockId
     * @param {Object} blockMap
     * @returns {string}
     * @private
     */
    this._getNamedBoxValue = function (blockId, blockMap) {
        if (blockId === null || !blockMap[blockId]) return null;

        const block = blockMap[blockId];
        const blockType = Array.isArray(block[1]) ? block[1][0] : block[1];

        if ((blockType === "namedbox" || blockType === "namedarg") && Array.isArray(block[1])) {
            return block[1][1]?.value;
        }
        return null;
    };

    /**
     * Checks if string is base64 data
     * @param {string} str
     * @returns {boolean}
     * @private
     */
    this._isBase64Data = function (str) {
        return typeof str === "string" && /^data:(image|audio)\/[a-zA-Z0-9+.-]+;base64,/.test(str);
    };

    /**
     * Scales the widget window
     * @private
     */
    this._scale = function () {
        if (this.widgetWindow.isMaximized()) {
            const body = this.widgetWindow.getWidgetBody();
            body.style.width = "100%";
            body.style.height = "100%";
        } else {
            const body = this.widgetWindow.getWidgetBody();
            body.style.width = CHATWIDTH + "px";
            body.style.height = CHATHEIGHT + "px";
        }
    };
}
