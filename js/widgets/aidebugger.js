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

/* global _THIS_IS_MUSIC_BLOCKS_, renderChatMarkdown */

if (typeof module !== "undefined" && module.exports) {
    // Under Jest the shared helper resolves through CommonJS. In the browser it
    // arrives as window.createWidgetLifecycle, loaded first by the RequireJS
    // shim in js/loader.js. Calling require() there would be a synchronous
    // RequireJS lookup for a module that may not have been evaluated yet.
    var { createWidgetLifecycle } = require("../utils/ai-widget-lifecycle");
}

/* This widget provides an AI-powered debugging interface for Music Blocks projects,
offering intelligent assistance, cool suggestions, and helping take your musical creations to new heights! */

/** AMD module dependencies for lazy loading. */
AIDebuggerWidget.dependencies = [
    "utils/ai-widget-lifecycle",
    "utils/ai-markdown",
    "widgets/aidebugger"
];

/**
 * Represents a AI Widget.
 * @constructor
 */
function AIDebuggerWidget() {
    const ICONSIZE = 32;
    const CHATWIDTH = 900;
    const CHATHEIGHT = 600;

    /**
     * Allowed backend origins. On unrecognized hosts the debugger
     * will refuse to send data rather than guessing a backend URL.
     */
    const ALLOWED_BACKENDS = {
        "localhost": "http://localhost:8000",
        "127.0.0.1": "http://127.0.0.1:8000",
        "musicblocks.sugarlabs.org": "https://api.musicblocks.sugarlabs.org",
        "sugarlabs.github.io": "https://api.musicblocks.sugarlabs.org"
    };

    const BACKEND_CONFIG = {
        BASE_URL: (() => {
            const host = window.location.hostname;
            if (ALLOWED_BACKENDS[host]) {
                return ALLOWED_BACKENDS[host];
            }
            // Check subdomain match for *.musicblocks.sugarlabs.org
            if (host.endsWith(".musicblocks.sugarlabs.org")) {
                return "https://api.musicblocks.sugarlabs.org";
            }
            // Unknown host: no automatic backend derivation
            console.warn(
                "AI Debugger: unrecognized host '" +
                    host +
                    "'. " +
                    "Backend URL must be added to ALLOWED_BACKENDS."
            );
            return null;
        })(),
        ENDPOINTS: {
            ANALYZE: "/analyze",
            FIX: "/fix",
            MAKE: "/make"
        },
        TIMEOUT: 30000,
        // Rewriting a project takes the model longer than a chat reply.
        FIX_TIMEOUT: 120000
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
     * Flag to prevent concurrent message sends
     * @type {boolean}
     */
    this._isProcessing = false;

    /**
     * The project as it was before the last change from the Edit tab, for Undo.
     * @type {string|null}
     */
    this._projectBeforeFix = null;

    /**
     * Whether the user has consented to send project data to the backend.
     * No data leaves the browser until this is true.
     * @type {boolean}
     */
    this._consentGiven = false;

    /**
     * Shared mount tracking and request cancellation for chat widgets
     * @type {object}
     */
    const createLifecycle =
        (typeof createWidgetLifecycle !== "undefined" && createWidgetLifecycle) ||
        window.createWidgetLifecycle;

    this._lifecycle = createLifecycle(this, () => this.widgetWindow && this.chatLog);

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
        this._lifecycle.mount();

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
            this._clearBlockHighlights();
            this._lifecycle.unmount();
            this._lifecycle.abortPendingRequests();
            this._isProcessing = false;
            this._hideTypingIndicator();
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

        this._undoButton = widgetWindow.addButton(
            "restore-button.svg",
            ICONSIZE,
            _("Undo the change")
        );
        this._undoButton.style.display = this._projectBeforeFix ? "" : "none";
        this._undoButton.onclick = () => {
            this._undoFix();
        };

        this._createLayout();
        this._showStart();
        widgetWindow.sendToCenter();
        this.activity.textMsg(_("Debugger initialized"));
    };

    /**
     * Returns true if the widget is still mounted and can safely update UI
     * @returns {boolean}
     * @private
     */
    this._isWidgetActive = function () {
        return this._lifecycle.isWidgetActive();
    };

    /**
     * Returns true if the caller still belongs to the mount it started in.
     * Async work captures the generation before awaiting and passes it back
     * here, so a continuation from a previous open never touches a reopened
     * widget.
     * @param {number} generation - Generation captured before the request
     * @returns {boolean}
     * @private
     */
    this._isSameMount = function (generation) {
        return this._lifecycle.isSameMount(generation);
    };

    /**
     * Sends a backend request while tracking widget lifecycle and cancellation
     * @param {object} payload
     * @returns {Promise<object|null>}
     * @private
     */
    this._postToBackend = function (payload) {
        return this._lifecycle.postJSON(
            `${BACKEND_CONFIG.BASE_URL}${BACKEND_CONFIG.ENDPOINTS.ANALYZE}`,
            payload,
            BACKEND_CONFIG.TIMEOUT,
            null,
            true
        );
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

        // Both tabs share one chat log, so an edit can use what the chat found.
        const tabBar = document.createElement("div");
        tabBar.className = "aidebugger-tabs";
        tabBar.style.display = "flex";
        tabBar.style.borderBottom = "1px solid var(--color-border-primary)";
        tabBar.style.backgroundColor = "var(--color-bg-primary)";
        this._tabButtons = {};
        [
            ["chat", _("Chat")],
            ["edit", _("Edit project")]
        ].forEach(([name, label]) => {
            const tab = document.createElement("button");
            tab.className = "aidebugger-tab";
            tab.textContent = label;
            tab.style.flex = "1";
            tab.style.padding = "10px";
            tab.style.border = "none";
            tab.style.background = "transparent";
            tab.style.color = "var(--color-text-primary)";
            tab.style.cursor = "pointer";
            tab.style.fontSize = "14px";
            tab.style.fontWeight = "bold";
            tab.onclick = () => this._showTab(name);
            this._tabButtons[name] = tab;
            tabBar.appendChild(tab);
        });
        chatContainer.appendChild(tabBar);

        // Chat log area
        this.chatLog = document.createElement("div");
        this.chatLog.className = "chatLog aidebugger-chat-log";
        this.chatLog.style.flex = "1";
        // Without this a flex child grows with its messages instead of scrolling.
        this.chatLog.style.minHeight = "0";
        this.chatLog.style.overflowY = "auto";
        this.chatLog.style.padding = "15px";
        this.chatLog.style.backgroundColor = "var(--color-bg-primary)";
        this.chatLog.style.color = "var(--color-text-primary)";
        this.chatLog.style.display = "flex";
        this.chatLog.style.flexDirection = "column";
        this.chatLog.style.gap = "10px";

        chatContainer.appendChild(this.chatLog);

        // Input area
        const inputContainer = document.createElement("div");
        inputContainer.className = "aidebugger-input-container";
        inputContainer.style.display = "flex";
        inputContainer.style.padding = "15px";
        inputContainer.style.backgroundColor = "var(--color-bg-primary)";
        inputContainer.style.borderTop = "1px solid var(--color-border-primary)";
        inputContainer.style.gap = "10px";

        // Message input
        this.messageInput = document.createElement("input");
        this.messageInput.type = "text";
        this.messageInput.className = "aidebugger-input";
        this.messageInput.placeholder = "Type your message here...";
        this.messageInput.style.flex = "1";
        this.messageInput.style.padding = "12px";
        this.messageInput.style.backgroundColor = "var(--color-bg-primary)";
        this.messageInput.style.color = "var(--color-text-primary)";
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
        this.sendButton.textContent = _("Send");
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
        this._chatInput = inputContainer;

        const editContainer = document.createElement("div");
        editContainer.className = "aidebugger-input-container";
        editContainer.style.display = "none";
        editContainer.style.flexDirection = "column";
        editContainer.style.padding = "15px";
        editContainer.style.gap = "10px";
        editContainer.style.backgroundColor = "var(--color-bg-primary)";
        editContainer.style.borderTop = "1px solid var(--color-border-primary)";

        this.editInput = document.createElement("textarea");
        this.editInput.className = "aidebugger-input";
        this.editInput.rows = 2;
        this.editInput.placeholder = _(
            "What should I change in your project, or what new project should I make?"
        );
        this.editInput.style.padding = "12px";
        this.editInput.style.border = "1px solid #ddd";
        this.editInput.style.borderRadius = "12px";
        this.editInput.style.fontSize = "14px";
        this.editInput.style.resize = "none";
        this.editInput.style.fontFamily = "inherit";

        const editButtons = document.createElement("div");
        editButtons.style.display = "flex";
        editButtons.style.gap = "10px";
        editButtons.appendChild(
            this._createActionButton(_("Change my project"), () =>
                this._fixProject(this.editInput.value)
            )
        );
        editButtons.appendChild(
            this._createActionButton(_("Make a new project"), () =>
                this._makeProject(this.editInput.value)
            )
        );

        editContainer.appendChild(this.editInput);
        editContainer.appendChild(editButtons);
        chatContainer.appendChild(editContainer);
        this._editInput = editContainer;

        container.appendChild(chatContainer);
        this._showTab("chat");
    };

    /**
     * Creates a blue rounded button like Send.
     * @param {string} label
     * @param {Function} onClick
     * @returns {HTMLButtonElement}
     * @private
     */
    this._createActionButton = function (label, onClick) {
        const button = document.createElement("button");
        button.textContent = label;
        button.style.flex = "1";
        button.style.padding = "10px 16px";
        button.style.backgroundColor = "#2196F3";
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "25px";
        button.style.cursor = "pointer";
        button.style.fontSize = "14px";
        button.style.fontWeight = "bold";
        button.onclick = onClick;
        return button;
    };

    /**
     * Shows the Chat or the Edit input under the shared chat log.
     * @param {string} name - "chat" or "edit".
     * @private
     */
    this._showTab = function (name) {
        this._activeTab = name;
        this._chatInput.style.display = name === "chat" ? "flex" : "none";
        this._editInput.style.display = name === "edit" ? "flex" : "none";
        for (const [tab, button] of Object.entries(this._tabButtons)) {
            button.style.borderBottom =
                tab === name ? "3px solid #2196F3" : "3px solid transparent";
        }
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
     * What the widget shows when it opens. Nothing is sent yet, so the child
     * goes straight to asking in Chat or changing the project in Edit project.
     * @private
     */
    this._showStart = function () {
        this._addWelcomeMessage();
    };

    /**
     * Sends a message
     * @private
     */
    this._sendMessage = function () {
        const messageText = this.messageInput.value.trim();
        if (messageText === "") return;
        if (!this._isWidgetActive() || this._isProcessing) return;

        if (!this._consentGiven) {
            this._showConsentBanner(() => this._sendMessage());
            return;
        }

        this._isProcessing = true;

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
        if (!this._isWidgetActive()) {
            return;
        }

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
            messageDiv.className = "aidebugger-message aidebugger-message-user";
            messageDiv.style.alignSelf = "flex-end";
            messageDiv.textContent = message.content;
            messageDiv.appendChild(timeDiv);
        } else if (message.type === "bot") {
            messageDiv.className = "aidebugger-message aidebugger-message-bot";
            messageDiv.style.alignSelf = "flex-start";
            messageDiv.style.backgroundColor = "var(--color-bg-tertiary)";
            messageDiv.style.color = "var(--color-text-primary)";
            messageDiv.style.border = "1px solid var(--color-border-primary)";
            const render =
                (typeof renderChatMarkdown !== "undefined" && renderChatMarkdown) ||
                window.renderChatMarkdown;
            if (render) {
                // Escaped and sanitized in utils/ai-markdown.js.
                const body = document.createElement("div");
                body.className = "ai-chat-markdown";
                body.innerHTML = render(message.content);
                this._linkBlockNames(body);
                messageDiv.appendChild(body);
            } else {
                messageDiv.textContent = message.content;
            }
            messageDiv.appendChild(timeDiv);
        } else if (message.type === "system") {
            messageDiv.className = "aidebugger-message aidebugger-message-system";
            messageDiv.style.alignSelf = "center";
            messageDiv.style.backgroundColor = "var(--color-warning-bg)";
            messageDiv.style.color = "var(--color-text-primary)";
            messageDiv.style.border = "1px solid var(--color-border-primary)";
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
        if (!BACKEND_CONFIG.BASE_URL) {
            this._isProcessing = false;
            this._addMessageToUI({
                type: "system",
                content: _("AI Debugger backend is not configured for this host."),
                timestamp: new Date().toISOString()
            });
            return;
        }

        const typingIndicator = this._showTypingIndicator();
        const generation = this._lifecycle.generation;
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

        this._postToBackend(payload)
            .then(data => {
                if (!this._isSameMount(generation) || !this._isWidgetActive() || !data) {
                    return;
                }

                if (data.response) {
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
                console.error("Backend connection error:", error);

                if (!this._isSameMount(generation) || !this._isWidgetActive()) {
                    return;
                }

                this._removeTypingIndicator(typingIndicator);
                this.activity.textMsg(_("Server error: Unable to connect to AI backend."));

                if (error instanceof TypeError && error.message.includes("fetch")) {
                    console.error("Network/CORS error. Backend connection failed");
                }

                const fallbackResponse = {
                    type: "bot",
                    content: _(
                        "Could not reach the AI assistant. Please check your connection and try again."
                    ),
                    timestamp: new Date().toISOString()
                };

                this.chatHistory.push(fallbackResponse);
                this._addMessageToUI(fallbackResponse);
                this._updateMessageCount();
            })
            .finally(() => {
                // A reopened widget owns the indicator and the processing flag now.
                if (!this._isSameMount(generation)) {
                    return;
                }

                this._removeTypingIndicator(typingIndicator);
                this._isProcessing = false;
            });
    };

    /**
     * Shows typing indicator
     * @private
     */
    this._showTypingIndicator = function () {
        if (!this._isWidgetActive()) {
            return null;
        }

        const typingDiv = document.createElement("div");
        typingDiv.className = "typing-indicator aidebugger-typing-indicator";
        typingDiv.style.alignSelf = "flex-start";
        typingDiv.style.backgroundColor = "var(--color-bg-tertiary)";
        typingDiv.style.color = "var(--color-text-secondary)";
        typingDiv.style.border = "1px solid var(--color-border-primary)";
        typingDiv.style.padding = "12px 16px";
        typingDiv.style.borderRadius = "18px";
        typingDiv.style.marginBottom = "8px";
        typingDiv.style.fontSize = "14px";
        typingDiv.style.fontStyle = "italic";
        typingDiv.textContent = _("Debugger is typing...");

        // Add animation
        let dots = 0;
        const animateTyping = setInterval(() => {
            dots = (dots + 1) % 4;
            typingDiv.textContent = _("Debugger is typing") + ".".repeat(dots);
        }, 500);

        typingDiv.setAttribute("data-animation-id", animateTyping);

        this.chatLog.appendChild(typingDiv);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;

        return typingDiv;
    };

    /**
     * Hides typing indicator
     * @private
     */
    this._hideTypingIndicator = function () {
        if (!this.chatLog) {
            return;
        }

        this._removeTypingIndicator(null);
    };

    /**
     * Removes a specific typing indicator, or all of them when none is given.
     * A replacement indicator shown by a newer request is left alone.
     * @param {HTMLElement|null} indicator - The indicator to remove.
     * @private
     */
    this._removeTypingIndicator = function (indicator) {
        if (!this.chatLog) {
            return;
        }

        const typingIndicators = this.chatLog.querySelectorAll(".typing-indicator");
        typingIndicators.forEach(current => {
            if (indicator !== null && current !== indicator) {
                return;
            }

            const animationId = current.getAttribute("data-animation-id");
            if (animationId) {
                clearInterval(parseInt(animationId, 10));
            }
            current.remove();
        });
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
     * Shows a consent banner explaining what data will be sent and where.
     * No project data leaves the browser until the user explicitly agrees. It
     * is asked the first time something is about to be sent, and that request
     * is sent once agreed, so the child goes on with what they pressed.
     * @param {Function} [afterConsent] - The request to send once the user agrees.
     * @private
     */
    this._showConsentBanner = function (afterConsent) {
        for (const old of this.chatLog.querySelectorAll(".aidebugger-consent-banner")) {
            old.remove();
        }
        const banner = document.createElement("div");
        banner.className = "aidebugger-consent-banner";
        banner.style.padding = "16px 20px";
        banner.style.margin = "12px";
        banner.style.borderRadius = "12px";
        banner.style.backgroundColor = "var(--color-warning-bg)";
        banner.style.border = "1px solid var(--color-border-primary)";
        banner.style.color = "var(--color-text-primary)";
        banner.style.fontSize = "13px";
        banner.style.lineHeight = "1.5";

        const title = document.createElement("div");
        title.style.fontWeight = "bold";
        title.style.marginBottom = "8px";
        title.style.fontSize = "14px";
        title.textContent = _("Before we start");

        const body = document.createElement("div");
        body.style.marginBottom = "12px";
        body.textContent = _(
            "The AI Debugger will send your current project data to an external server for analysis. Your project blocks and structure will be shared with: "
        );

        const urlSpan = document.createElement("strong");
        urlSpan.textContent = BACKEND_CONFIG.BASE_URL;
        body.appendChild(urlSpan);

        const btnRow = document.createElement("div");
        btnRow.style.display = "flex";
        btnRow.style.gap = "8px";
        btnRow.style.marginTop = "4px";

        const acceptBtn = document.createElement("button");
        acceptBtn.textContent = _("Agree and continue");
        acceptBtn.style.padding = "8px 16px";
        acceptBtn.style.border = "none";
        acceptBtn.style.borderRadius = "6px";
        acceptBtn.style.backgroundColor = "#198754";
        acceptBtn.style.color = "white";
        acceptBtn.style.cursor = "pointer";
        acceptBtn.style.fontSize = "13px";
        acceptBtn.style.fontWeight = "600";

        const declineBtn = document.createElement("button");
        declineBtn.className = "cancel-button aidebugger-cancel-btn";
        declineBtn.textContent = _("Cancel");
        declineBtn.style.padding = "8px 16px";
        declineBtn.style.border = "1px solid var(--color-border-primary)";
        declineBtn.style.borderRadius = "6px";
        declineBtn.style.backgroundColor = "var(--color-bg-primary)";
        declineBtn.style.color = "var(--color-text-primary)";
        declineBtn.style.cursor = "pointer";
        declineBtn.style.fontSize = "13px";

        acceptBtn.onclick = () => {
            this._consentGiven = true;
            banner.remove();
            if (afterConsent) {
                afterConsent();
            } else {
                this._loadProjectAndInitialize();
            }
        };

        declineBtn.onclick = () => {
            banner.remove();
            const msg = {
                type: "system",
                content: _("Nothing was sent. Your project stays here until you agree."),
                timestamp: new Date().toISOString()
            };
            this._addMessageToUI(msg);
        };

        btnRow.appendChild(acceptBtn);
        btnRow.appendChild(declineBtn);
        banner.appendChild(title);
        banner.appendChild(body);
        banner.appendChild(btnRow);
        this.chatLog.appendChild(banner);
    };

    /**
     * Loads current project data and initializes conversation with backend.
     * Only called after the user gives explicit consent.
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
                content: _("Loading your current project and initializing AI assistant..."),
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
                content: _("Could not load project data. Starting with basic assistant..."),
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
        if (!BACKEND_CONFIG.BASE_URL) {
            this._addMessageToUI({
                type: "system",
                content: _(
                    "AI Debugger is not available on this host. The backend URL could not be determined."
                ),
                timestamp: new Date().toISOString()
            });
            return;
        }

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
        const typingIndicator = this._showTypingIndicator();
        const generation = this._lifecycle.generation;

        this._postToBackend(initPayload)
            .then(data => {
                if (!this._isSameMount(generation) || !this._isWidgetActive() || !data) {
                    return;
                }

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
                console.error("Backend initialization error:", error);

                if (!this._isSameMount(generation) || !this._isWidgetActive()) {
                    return;
                }

                this._removeTypingIndicator(typingIndicator);
                this.activity.textMsg(_("Server error: Failed to initialize AI debugger."));

                if (error instanceof TypeError && error.message.includes("fetch")) {
                    console.error("Network/CORS error. Backend connection failed");
                }

                const errorMessage = {
                    type: "system",
                    content: _(
                        "Could not reach the AI assistant. Please check your connection and try again."
                    ),
                    timestamp: new Date().toISOString()
                };
                this._addMessageToUI(errorMessage);

                this._addWelcomeMessage();
            })
            .finally(() => {
                // A reopened widget owns the indicator now.
                if (this._isSameMount(generation)) {
                    this._removeTypingIndicator(typingIndicator);
                }
            });
    };

    /**
     * Blocks on the canvas that a reply's `code` span names, such as
     * "repeat 4" or "pitch name E, octave 5". A label at the start of the
     * text beats one further in, as in "master beats per minute bpm 180" for
     * the "beats per minute" block. Then the longest label wins.
     * @param {string} text
     * @returns {number[]} Block ids.
     * @private
     */
    this._blocksNamedBy = function (text) {
        const blocks = this.activity && this.activity.blocks;
        if (!blocks || !blocks.blockList) return [];

        const wanted = String(text).trim().toLowerCase();
        const padded = ` ${wanted} `;
        let best = 0;
        let found = [];
        Object.keys(blocks.blockList).forEach(id => {
            const block = blocks.blockList[id];
            if (!block || block.trash || !block.protoblock) return;
            const staticLabels = block.protoblock.staticLabels || [];
            const labels = [block.name, staticLabels[0]]
                .filter(label => typeof label === "string" && label.trim())
                .map(label => label.trim().toLowerCase());
            for (const label of labels) {
                const atStart = wanted === label || wanted.startsWith(label + " ");
                if (!atStart && !padded.includes(` ${label} `)) continue;
                const score = (atStart ? 1000 : 0) + label.length;
                if (score > best) {
                    best = score;
                    found = [];
                }
                if (score === best && !found.includes(Number(id))) {
                    found.push(Number(id));
                }
            }
        });
        return found;
    };

    /**
     * Makes each `code` span that names blocks on the canvas light them up on hover.
     * @param {HTMLElement} body - A rendered reply.
     * @private
     */
    this._linkBlockNames = function (body) {
        body.querySelectorAll("code").forEach(code => {
            if (this._blocksNamedBy(code.textContent).length === 0) return;
            code.classList.add("ai-block-link");
            code.title = _("Hover to see this block in your project");
            code.addEventListener("mouseenter", () => this._highlightBlocks(code.textContent));
            code.addEventListener("mouseleave", () => this._clearBlockHighlights());
        });
    };

    /**
     * Highlights the blocks a reply names, as Music Blocks does while running.
     * @param {string} text
     * @private
     */
    this._highlightBlocks = function (text) {
        this._clearBlockHighlights();
        const blocks = this.activity.blocks;
        this._highlightedBlocks = this._blocksNamedBy(text);
        this._highlightedBlocks.forEach(id => blocks.blockList[id].highlight());
        if (typeof this.activity.refreshCanvas === "function") this.activity.refreshCanvas();
    };

    /**
     * Removes the highlights added by _highlightBlocks.
     * @private
     */
    this._clearBlockHighlights = function () {
        const ids = this._highlightedBlocks || [];
        this._highlightedBlocks = [];
        if (ids.length === 0 || !this.activity || !this.activity.blocks) return;
        ids.forEach(id => {
            const block = this.activity.blocks.blockList[id];
            if (block) block.unhighlight();
        });
        if (typeof this.activity.refreshCanvas === "function") this.activity.refreshCanvas();
    };

    /**
     * Replaces the blocks on the canvas, keeping this widget open. The old
     * blocks go to the trash, as when a saved moment is restored.
     * @param {Array} blocks - Project data, as prepareExport() makes it.
     * @private
     */
    this._loadBlocks = function (blocks) {
        this.activity.sendAllToTrash(false, true, false);
        this.activity.blocks.loadNewBlocks(blocks);
    };

    /**
     * Adds a system notice to the chat.
     * @param {string} content
     * @private
     */
    this._notice = function (content) {
        this._addMessageToUI({
            type: "system",
            content: content,
            timestamp: new Date().toISOString()
        });
    };

    /**
     * The Edit tab's "Change my project". Asks the backend to change the
     * project as the request and the chat describe, then loads the result.
     * With no request, the chat so far says what to fix.
     * @param {string} [requestText]
     * @private
     */
    this._fixProject = function (requestText) {
        const request = (requestText || "").trim();
        if (!request && !this.chatHistory.some(msg => msg.type === "user")) {
            this._notice(_("Tell me what to change first, then I can do it for you."));
            return;
        }

        // Taken before the request is added to the chat. The request goes as
        // the prompt, so the backend would see it twice otherwise.
        const history = this.chatHistory
            .filter(msg => msg.type !== "system")
            .map(msg => ({
                role: msg.type === "user" ? "user" : "assistant",
                content: msg.content
            }));
        this._requestProject(
            BACKEND_CONFIG.ENDPOINTS.FIX,
            code => ({ code: code, prompt: request, history: history }),
            request,
            _("I changed your project. Press Undo to go back.")
        );
    };

    /**
     * The Edit tab's "Make a new project". Loads a new project in place of the
     * current one, which is kept for Undo.
     * @param {string} description
     * @private
     */
    this._makeProject = function (description) {
        const text = (description || "").trim();
        if (text.length < 3) {
            this._notice(_("Tell me what project to make, for example a drum beat or a song."));
            return;
        }

        this._requestProject(
            BACKEND_CONFIG.ENDPOINTS.MAKE,
            code => ({ description: text, code: code }),
            `${_("Make")}: ${text}`,
            _("I made a new project. Press Undo to get yours back.")
        );
    };

    /**
     * Sends an Edit request and loads the project the backend returns.
     * @param {string} endpoint - Backend path.
     * @param {Function} makePayload - Builds the request body from the current project.
     * @param {string} userText - What to show as the child's message, or "".
     * @param {string} doneMessage - Status message after loading.
     * @private
     */
    this._requestProject = function (endpoint, makePayload, userText, doneMessage) {
        if (!this._isWidgetActive() || this._isProcessing) return;

        if (!this._consentGiven) {
            this._showConsentBanner(() =>
                this._requestProject(endpoint, makePayload, userText, doneMessage)
            );
            return;
        }

        if (!BACKEND_CONFIG.BASE_URL) {
            this._notice(_("AI Debugger backend is not configured for this host."));
            return;
        }

        this._isProcessing = true;
        const projectBefore = this.activity.prepareExport();
        const payload = makePayload(projectBefore);

        if (userText) {
            const userMessage = {
                type: "user",
                content: userText,
                timestamp: new Date().toISOString()
            };
            this.chatHistory.push(userMessage);
            this._addMessageToUI(userMessage);
            if (this.editInput) this.editInput.value = "";
        }

        const typingIndicator = this._showTypingIndicator();
        const generation = this._lifecycle.generation;
        const failed = _("Could not change the project. Please try again.");

        this._lifecycle
            .postJSON(
                `${BACKEND_CONFIG.BASE_URL}${endpoint}`,
                payload,
                BACKEND_CONFIG.FIX_TIMEOUT,
                failed
            )
            .then(data => {
                if (!this._isSameMount(generation) || !this._isWidgetActive() || !data) {
                    return;
                }

                if (data.error || !Array.isArray(data.project)) {
                    this._notice(data.error || failed);
                    return;
                }

                this._loadBlocks(data.project);
                this._projectBeforeFix = projectBefore;
                this._undoButton.style.display = "";

                const botResponse = {
                    type: "bot",
                    content: data.response,
                    timestamp: new Date().toISOString()
                };
                this.chatHistory.push(botResponse);
                this._addMessageToUI(botResponse);
                this._updateMessageCount();
                this.activity.textMsg(doneMessage);
            })
            .finally(() => {
                if (!this._isSameMount(generation)) {
                    return;
                }

                this._removeTypingIndicator(typingIndicator);
                this._isProcessing = false;
            });
    };

    /**
     * Puts back the project from before the last fix.
     * @private
     */
    this._undoFix = function () {
        if (!this._projectBeforeFix || this._isProcessing) return;

        try {
            this._loadBlocks(JSON.parse(this._projectBeforeFix));
        } catch (error) {
            console.error("Could not undo the fix:", error);
            return;
        }

        this._projectBeforeFix = null;
        this._undoButton.style.display = "none";
        this._addMessageToUI({
            type: "system",
            content: _("Your project is back to how it was before the change."),
            timestamp: new Date().toISOString()
        });
    };

    /**
     * Resets the conversation and initializes with project data
     * @private
     */
    this._resetConversation = function () {
        this._lifecycle.abortPendingRequests();
        this.chatHistory = [];
        this.promptCount = 0; // Reset prompt count
        this.conversationId = this._generateConversationId();
        this._removeTypingIndicator(null);
        this.chatLog.replaceChildren();

        if (this._consentGiven) {
            this._loadProjectAndInitialize();
        } else {
            this._showStart();
        }
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
        this.chatLog.replaceChildren();
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
                if (!(
                    childBlockType === "divide" &&
                    (parentBlockType === "newnote" ||
                        parentBlockType === "setmasterbpm2" ||
                        parentBlockType === "arc")
                )) {
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
                let bpmOutput = `Set Master BPM → ${bpmValue ?? "?"} BPM`;

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
                    return `Duration --> ${numerator ?? "?"}/${denominator ?? "?"} = ${result}`;
                }
                return `Divide Block --> ${numerator ?? "?"}/${denominator ?? "?"} = ${result}`;
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
                        repeatText = repeatCount ?? "?";
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
                return `Move Forward → ${forwardDist ?? "?"} Steps`;
            }

            case "back": {
                const backDist = this._getNumericValue(connections[1], blockMap);
                return `Move Backward → ${backDist ?? "?"} Steps`;
            }

            case "right": {
                const rightAngle = this._getNumericValue(connections[1], blockMap);
                return `Rotate Right → ${rightAngle ?? "?"}°`;
            }

            case "left": {
                const leftAngle = this._getNumericValue(connections[1], blockMap);
                return `Rotate Left → ${leftAngle ?? "?"}°`;
            }

            case "setheading": {
                const heading = this._getNumericValue(connections[1], blockMap);
                return `Set Heading → ${heading || "0"}°`;
            }

            case "show": {
                const showValue = this._getNumericValue(connections[2], blockMap);
                return `Show Number: ${showValue ?? "?"}`;
            }

            case "increment": {
                const incColor = this._getNumericValue(connections[1], blockMap);
                const incAmount = this._getNumericValue(connections[2], blockMap);
                return `Increment --> Color: ${incColor ?? "?"}, Amount: ${incAmount ?? "?"}`;
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
                        angle = this._getNumericValue(connections[3], blockMap) ?? "?";
                    }
                }
                const radius = this._getNumericValue(connections[2], blockMap);
                return `Draw Arc --> Angle: ${angle}°, Radius: ${radius ?? "?"}`;
            }

            case "print": {
                const printText = this._getTextValue(connections[2], blockMap);
                return `Print: "${printText || ""}"`;
            }

            case "plus": {
                const add1 = this._getNumericValue(connections[1], blockMap);
                const add2 = this._getNumericValue(connections[2], blockMap);
                return `Add --> ${add1 ?? "?"} + ${add2 ?? "?"} = ${
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

                return `Pitch --> Solfege: ${solfege}, Octave: ${octave ?? "?"}`;
            }

            case "solfege":
                return null;

            case "nameddo": {
                const actionCalled = blockArgs?.value || "unnamed";
                return `Do action --> "${actionCalled}"`;
            }

            case "settransposition": {
                const transpositionValue = this._getNumericValue(connections[1], blockMap);
                return `Set Transposition --> ${transpositionValue ?? "?"}`;
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

if (typeof module !== "undefined" && module.exports) {
    module.exports = AIDebuggerWidget;
}
