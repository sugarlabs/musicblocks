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

/*
   global

   _, ManagedTimer, ReflectionLifecycle, ReflectionWindow, ReflectionChatLog,
   ReflectionSession, ReflectionBackend, ReflectionReport, ReflectionMarkdown
*/

/*
   Globals location
    - js/utils/utils.js
        _
    - js/utils/ManagedTimer.js
        ManagedTimer
    - js/widgets/ReflectionLifecycle.js, ReflectionWindow.js, ReflectionChatLog.js,
      ReflectionSession.js, ReflectionBackend.js, ReflectionReport.js, ReflectionMarkdown.js
        ReflectionLifecycle, ReflectionWindow, ReflectionChatLog, ReflectionSession,
        ReflectionBackend, ReflectionReport, ReflectionMarkdown
*/
/* exported ReflectionMatrix */

if (typeof module !== "undefined" && module.exports) {
    // Under Jest the shared helper resolves through CommonJS. In the browser it
    // arrives as window.createWidgetLifecycle, loaded first by the RequireJS
    // shim in js/loader.js. Calling require() there would be a synchronous
    // RequireJS lookup for a module that may not have been evaluated yet.
    var { createWidgetLifecycle } = require("../utils/ai-widget-lifecycle");
}

/**
 * Represents Reflection Widget.
 *
 * Most of its methods live in ReflectionLifecycle.js, ReflectionWindow.js, ReflectionChatLog.js,
 * ReflectionSession.js, ReflectionBackend.js, ReflectionReport.js and ReflectionMarkdown.js; see
 * installModules.
 * @constructor
 */

class ReflectionMatrix {
    /** AMD module dependencies for lazy loading. */
    static dependencies = [
        "utils/ai-widget-lifecycle",
        "widgets/ReflectionLifecycle",
        "widgets/ReflectionWindow",
        "widgets/ReflectionChatLog",
        "widgets/ReflectionSession",
        "widgets/ReflectionBackend",
        "widgets/ReflectionReport",
        "widgets/ReflectionMarkdown",
        "widgets/reflection"
    ];

    static BUTTONDIVWIDTH = 535;
    static OUTERWINDOWWIDTH = "858px";
    static OUTERWINDOWHEIGHT = "550px";
    static INNERWINDOWWIDTH = 730;
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;
    static REQUEST_TIMEOUT = 30000;
    /**
     * Backend origins the widget may talk to, keyed by host name.
     *
     * The hosted site is served over HTTPS, so it has to use its own API origin;
     * a plain-HTTP backend is blocked there as mixed content. The local servers
     * are listed for development.
     *
     * @type {Object}
     */
    static BACKENDS = {
        "localhost": "http://localhost:8000",
        "127.0.0.1": "http://127.0.0.1:8000",
        "musicblocks.sugarlabs.org": "https://api.musicblocks.sugarlabs.org"
    };

    /**
     * Resolves the backend origin to send requests to.
     *
     * @param {string} [host] - Host name to resolve; defaults to the page host.
     * @returns {string|null} Backend origin without a trailing slash, or null
     *     when the host is not one this widget knows a backend for.
     */
    static backendURL(host) {
        const name = host === undefined ? window.location.hostname : host;

        if (Object.prototype.hasOwnProperty.call(ReflectionMatrix.BACKENDS, name)) {
            return ReflectionMatrix.BACKENDS[name];
        }

        if (name.endsWith(".musicblocks.sugarlabs.org")) {
            return "https://api.musicblocks.sugarlabs.org";
        }

        return null;
    }

    /**
     * Whether installModules has copied the module methods onto the prototype.
     * @type {boolean}
     */
    static _modulesInstalled = false;

    /**
     * Copies the methods of the Reflection modules (ReflectionLifecycle.js, ReflectionWindow.js,
     * ReflectionChatLog.js, ReflectionSession.js, ReflectionBackend.js,
     * ReflectionReport.js and ReflectionMarkdown.js) onto ReflectionMatrix.prototype, keeping
     * their names and property descriptors, so they behave exactly like methods declared in this
     * class and `this` inside them is the widget.
     *
     * RequireJS loads the modules alongside this file in no fixed order, so this runs when the
     * file loads (if the modules are already defined) and again from the constructor, which only
     * runs once every dependency has loaded.
     *
     * @returns {boolean} Whether the methods are installed.
     */
    static installModules() {
        if (ReflectionMatrix._modulesInstalled) {
            return true;
        }

        const modules = [
            typeof ReflectionLifecycle !== "undefined" ? ReflectionLifecycle : null,
            typeof ReflectionWindow !== "undefined" ? ReflectionWindow : null,
            typeof ReflectionChatLog !== "undefined" ? ReflectionChatLog : null,
            typeof ReflectionSession !== "undefined" ? ReflectionSession : null,
            typeof ReflectionBackend !== "undefined" ? ReflectionBackend : null,
            typeof ReflectionReport !== "undefined" ? ReflectionReport : null,
            typeof ReflectionMarkdown !== "undefined" ? ReflectionMarkdown : null
        ];
        if (modules.includes(null)) {
            return false;
        }

        for (const module of modules) {
            for (const name of Object.getOwnPropertyNames(module.prototype)) {
                if (name !== "constructor") {
                    Object.defineProperty(
                        ReflectionMatrix.prototype,
                        name,
                        Object.getOwnPropertyDescriptor(module.prototype, name)
                    );
                }
            }
        }

        ReflectionMatrix._modulesInstalled = true;
        return true;
    }

    constructor() {
        ReflectionMatrix.installModules();

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
        this.dotsInterval = null;

        /**
         * Centralized timer management instance for tracking/cancelling timers.
         * @type {ManagedTimer|null}
         * @private
         */
        this._timerManager = typeof ManagedTimer !== "undefined" ? new ManagedTimer() : null;

        /**
         * Fallback timeout tracking for test/runtime environments where ManagedTimer is unavailable.
         * @type {Set<number>}
         * @private
         */
        this._activeTimeouts = new Set();

        /**
         * Fallback interval tracking for test/runtime environments where ManagedTimer is unavailable.
         * @type {Set<number>}
         * @private
         */
        this._activeIntervals = new Set();

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
         * Whether a project-code refresh is in flight
         * @type {boolean}
         */
        this._isUpdatingProjectCode = false;

        /**
         * Shared mount state and request tracking
         * @type {Object}
         */
        const createLifecycle =
            (typeof createWidgetLifecycle !== "undefined" && createWidgetLifecycle) ||
            window.createWidgetLifecycle;

        this._lifecycle = createLifecycle(this, () => this.isOpen && this.chatLog);
    }

    /**
     * Initializes the reflection widget.
     */

    init(activity) {
        this.activity = activity;
        if (this.isOpen) {
            // The block ran again with the widget still open.
            this._endSession();
        }
        this.isOpen = true;
        this._lifecycle.mount();
        this.isMaximized = false;
        this.activity.isInputON = true;
        this.PORT = ReflectionMatrix.backendURL();

        const widgetWindow = window.widgetWindows.windowFor(this, "reflection", "reflection");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        widgetWindow.getWidgetBody().style.height = ReflectionMatrix.OUTERWINDOWHEIGHT;
        widgetWindow.getWidgetBody().style.width = ReflectionMatrix.OUTERWINDOWWIDTH;

        widgetWindow.onclose = () => this._closeWindow();

        // retrieve string from localStorage
        this.summary = this.readReport() || "No reports available";

        this.chatInterface = document.createElement("div");
        this.chatInterface.className = "chatInterface";
        widgetWindow.getWidgetBody().append(this.chatInterface);

        this._addToolbar();

        this.chatLog = document.createElement("div");
        this.chatLog.className = "chatLog";
        this.chatInterface.appendChild(this.chatLog);

        this._makeInput();

        if (this.chatHistory.length > 0) {
            this.renderChatHistory();
        } else {
            this.startChatSession();
        }

        widgetWindow.sendToCenter();
        activity.textMsg(_("Reflect on your project."), 3000);
    }
}

ReflectionMatrix.installModules();

if (typeof module !== "undefined" && module.exports) {
    module.exports = ReflectionMatrix;
}
