// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* exported setupAlertController, AlertController */

class AlertController {
    static get MSG_TIMEOUT() {
        return 60000;
    }

    static get ERROR_MSG_TIMEOUT() {
        return 15000;
    }

    constructor() {
        this.msgTimeoutID = null;
        this.errorMsgTimeoutID = null;
    }

    /**
     * Shows a text message by setting up state/timeouts and executing rendering callback.
     * @param {number} [duration] - Timeout duration in milliseconds.
     * @param {function} onShow - Callback to render show behavior.
     * @param {function} onHide - Callback to render hide/cleanup behavior.
     */
    showText(duration, onShow, onHide) {
        if (this.msgTimeoutID !== null) {
            clearTimeout(this.msgTimeoutID);
            this.msgTimeoutID = null;
        }

        const calculatedDuration = duration !== undefined ? duration : AlertController.MSG_TIMEOUT;

        if (typeof onShow === "function") {
            onShow();
        }

        if (calculatedDuration > 0) {
            this.msgTimeoutID = setTimeout(() => {
                this.msgTimeoutID = null;
                if (typeof onHide === "function") {
                    onHide();
                }
            }, calculatedDuration);
        }
    }

    /**
     * Shows an error message by setting up state/timeouts and executing rendering callback.
     * @param {number} [duration] - Timeout duration in milliseconds.
     * @param {function} onShow - Callback to render show behavior.
     * @param {function} onHide - Callback to render hide/cleanup behavior.
     */
    showError(duration, onShow, onHide) {
        if (this.errorMsgTimeoutID !== null) {
            clearTimeout(this.errorMsgTimeoutID);
            this.errorMsgTimeoutID = null;
        }

        const calculatedDuration =
            duration !== undefined ? duration : AlertController.ERROR_MSG_TIMEOUT;

        if (typeof onShow === "function") {
            onShow();
        }

        if (calculatedDuration > 0) {
            this.errorMsgTimeoutID = setTimeout(() => {
                this.errorMsgTimeoutID = null;
                if (typeof onHide === "function") {
                    onHide();
                }
            }, calculatedDuration);
        }
    }

    /**
     * Clears text message active timeout.
     */
    clearTextTimeout() {
        if (this.msgTimeoutID !== null) {
            clearTimeout(this.msgTimeoutID);
            this.msgTimeoutID = null;
        }
    }

    /**
     * Clears error message active timeout.
     */
    clearErrorTimeout() {
        if (this.errorMsgTimeoutID !== null) {
            clearTimeout(this.errorMsgTimeoutID);
            this.errorMsgTimeoutID = null;
        }
    }

    /**
     * Clears all active timeouts.
     */
    hideAll() {
        this.clearTextTimeout();
        this.clearErrorTimeout();
    }
}

/**
 * Attaches an AlertController instance to the activity.
 * Called once from the Activity constructor, before setupDependencies().
 * @param {object} activity - The Activity instance.
 */
const setupAlertController = activity => {
    activity.alertController = new AlertController();
};

if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupAlertController = setupAlertController;
        window.AlertController = AlertController;
        return { setupAlertController, AlertController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { setupAlertController, AlertController };
}
