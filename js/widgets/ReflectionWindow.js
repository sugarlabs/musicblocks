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

/* exported ReflectionWindow */

/**
 * @file ReflectionWindow.js
 * @description Reflection widget window: the toolbar, the message input, closing the window and
 * switching mentors.
 *
 * The methods are moved as they were from the ReflectionMatrix class, which copies them onto
 * ReflectionMatrix.prototype (see ReflectionMatrix.installModules), so `this` is still the
 * widget.
 */
class ReflectionWindow {
    /**
     * Adds the Summary, Save, mentor and Refresh buttons to the widget toolbar.
     * @private
     * @returns {void}
     */
    _addToolbar() {
        this.summaryButton = this.widgetWindow.addButton(
            "notes_icon.svg",
            ReflectionMatrix.ICONSIZE,
            _("Summary")
        );

        this.summaryButton.onclick = () => this.getAnalysis();

        if (this.chatHistory.length < ReflectionMatrix.ANALYSIS_MIN_MESSAGES) {
            this.summaryButton.style.background = "gray";
        }

        this.widgetWindow.addButton(
            "save-button-dark.svg",
            ReflectionMatrix.ICONSIZE,
            _("Save")
        ).onclick = () => this.downloadAsTxt(this.chatHistory); // text download

        this.metaButton = this.widgetWindow.addButton(
            "general_mentor.svg",
            ReflectionMatrix.ICONSIZE,
            _("Talk with Rohan")
        );
        this.metaButton.onclick = () => this.changeMentor("meta");

        this.codeButton = this.widgetWindow.addButton(
            "code.svg",
            ReflectionMatrix.ICONSIZE,
            _("Talk with Alan")
        );
        this.codeButton.onclick = () => this.changeMentor("code");

        this.musicButton = this.widgetWindow.addButton(
            "music.svg",
            ReflectionMatrix.ICONSIZE,
            _("Talk with Beethoven")
        );
        this.musicButton.onclick = () => this.changeMentor("music");

        this.reloadButton = this.widgetWindow.addButton(
            "reload.svg",
            ReflectionMatrix.ICONSIZE,
            _("Refresh")
        );
        this.reloadButton.onclick = () => this.updateProjectCode();

        this.changeMentor(this.AImentor);
    }

    /**
     * Adds the message input and the Send button under the chat log.
     * @private
     * @returns {void}
     */
    _makeInput() {
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
        this.input.placeholder = _("Type a message");
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
        sendBtn.innerText = _("Send");
        sendBtn.onclick = () => this.sendMessage();
        this.inputContainer.appendChild(sendBtn);

        // first message
        this.chatInterface.appendChild(this.inputContainer);
    }

    /**
     * Closes the widget: stops its timers and requests and drops the queued messages.
     * @private
     * @returns {void}
     */
    _closeWindow() {
        this.isOpen = false;
        this.activity.isInputON = false;
        this._endSession();
        this.widgetWindow.destroy();
    }

    /**
     * Ends the current open of the widget: stops its timers and requests and drops the queued
     * messages. Runs when the window closes and when the block runs again while it is open,
     * since the replies the old open is waiting for are discarded either way.
     * @private
     * @returns {void}
     */
    _endSession() {
        this._lifecycle.unmount();
        this.hideTypingIndicator();
        this._clearWidgetTimers();
        this._lifecycle.abortPendingRequests();
        this.pendingMessages = [];
        this.isProcessingPendingMessage = false;
        this._isUpdatingProjectCode = false;
        // A first reply still in flight is aborted, so the next open has to ask again.
        this.triggerFirst = false;
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
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ReflectionWindow;
}
