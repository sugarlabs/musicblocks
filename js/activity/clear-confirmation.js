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

/* global _ */

/* exported renderClearConfirmation, requestClear, dismissClearConfirmation */

let dismissActiveDialog = null;

/**
 * Closes a pending clear confirmation without running its Confirm action.
 * Used when a later skip-confirmation clear would otherwise leave the old
 * dialog open against a new workspace.
 */
function dismissClearConfirmation() {
    if (typeof dismissActiveDialog === "function") {
        dismissActiveDialog();
    }
}

/**
 * Opens the canvas-clear confirmation, or runs the action immediately.
 *
 * @param {object} activity
 * @param {boolean} skipConfirmation
 * @param {Function} onClearCanvas
 */
function requestClear(activity, skipConfirmation, onClearCanvas) {
    if (skipConfirmation) {
        dismissClearConfirmation();
        onClearCanvas();
        return;
    }
    renderClearConfirmation(activity, { onClearCanvas });
}

/**
 * Shows the canvas-clear confirmation dialog. Blocks are not touched.
 *
 * @param {object} activity
 * @param {Function} [activity.addEventListener]
 * @param {Function} [activity.removeEventListener]
 * @param {{ onClearCanvas: Function }} handlers
 */
function renderClearConfirmation(activity, handlers) {
    if (document.getElementById("clear-confirm")) {
        return;
    }

    const previouslyFocused =
        document.activeElement && typeof document.activeElement.focus === "function"
            ? document.activeElement
            : null;

    const modal = document.createElement("div");
    modal.classList.add("modalBox");
    modal.id = "clear-confirm";
    modal.tabIndex = -1;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "clear-confirm-title");
    modal.setAttribute("aria-describedby", "clear-confirm-message");

    const title = document.createElement("h2");
    title.id = "clear-confirm-title";
    title.textContent = _("Clear workspace");
    title.classList.add("modal-title");
    modal.appendChild(title);

    const message = document.createElement("p");
    message.id = "clear-confirm-message";
    message.textContent = _("Are you sure you want to clear the workspace?");
    message.classList.add("modal-message");
    modal.appendChild(message);

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("clear-button-container");

    const bindings = [];
    let closed = false;
    let onKeyDown = null;

    const closeModal = () => {
        if (closed) {
            return;
        }
        closed = true;
        if (dismissActiveDialog === closeModal) {
            dismissActiveDialog = null;
        }

        if (onKeyDown) {
            document.removeEventListener("keydown", onKeyDown, true);
        }

        bindings.forEach(({ target, type, listener }) => {
            if (activity && typeof activity.removeEventListener === "function") {
                activity.removeEventListener(target, type, listener);
            } else if (target && typeof target.removeEventListener === "function") {
                target.removeEventListener(type, listener);
            }
        });

        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }

        if (
            previouslyFocused &&
            typeof previouslyFocused.focus === "function" &&
            document.contains(previouslyFocused)
        ) {
            previouslyFocused.focus();
        }
    };

    const bindClick = (target, listener) => {
        if (activity && typeof activity.addEventListener === "function") {
            activity.addEventListener(target, "click", listener);
        } else {
            target.addEventListener("click", listener);
        }
        bindings.push({ target, type: "click", listener });
    };

    const confirmBtn = document.createElement("button");
    confirmBtn.classList.add("confirm-button");
    confirmBtn.textContent = _("Confirm");
    confirmBtn.type = "button";
    bindClick(confirmBtn, () => {
        closeModal();
        handlers.onClearCanvas();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.classList.add("cancel-button");
    cancelBtn.textContent = _("Cancel");
    cancelBtn.type = "button";
    bindClick(cancelBtn, closeModal);

    const buttons = [confirmBtn, cancelBtn];

    onKeyDown = event => {
        if (!modal.parentNode) {
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            closeModal();
            return;
        }

        if (event.key !== "Tab") {
            return;
        }

        event.preventDefault();
        const index = buttons.indexOf(document.activeElement);
        if (event.shiftKey) {
            const next = index <= 0 ? buttons.length - 1 : index - 1;
            buttons[next].focus();
        } else {
            const next = index === buttons.length - 1 || index === -1 ? 0 : index + 1;
            buttons[next].focus();
        }
    };

    buttonContainer.appendChild(confirmBtn);
    buttonContainer.appendChild(cancelBtn);
    modal.appendChild(buttonContainer);
    document.body.appendChild(modal);
    document.addEventListener("keydown", onKeyDown, true);
    dismissActiveDialog = closeModal;
    confirmBtn.focus();
}

if (typeof define === "function" && define.amd) {
    define(function () {
        window.renderClearConfirmation = renderClearConfirmation;
        window.requestClear = requestClear;
        window.dismissClearConfirmation = dismissClearConfirmation;
        return { renderClearConfirmation, requestClear, dismissClearConfirmation };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { renderClearConfirmation, requestClear, dismissClearConfirmation };
}
