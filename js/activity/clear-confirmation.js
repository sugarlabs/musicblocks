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

/* exported renderClearConfirmation, requestClear */

/**
 * Opens the Clear workspace dialog, or runs the canvas-clear action immediately.
 *
 * @param {object} activity
 * @param {boolean} skipConfirmation
 * @param {Function} onClearCanvas
 * @param {Function} onClearAll
 */
function requestClear(activity, skipConfirmation, onClearCanvas, onClearAll) {
    if (skipConfirmation) {
        onClearCanvas();
        return;
    }
    renderClearConfirmation(activity, { onClearCanvas, onClearAll });
}

/**
 * Shows the Clear workspace dialog with canvas-only and clear-all choices.
 *
 * @param {object} activity
 * @param {Function} [activity.addEventListener]
 * @param {Function} [activity.removeEventListener]
 * @param {{ onClearCanvas: Function, onClearAll: Function }} handlers
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
    message.textContent = _("Clear only the drawings, or also send every block to the trash?");
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

    const canvasBtn = document.createElement("button");
    canvasBtn.classList.add("confirm-button");
    canvasBtn.textContent = _("Clear canvas");
    canvasBtn.type = "button";
    bindClick(canvasBtn, () => {
        closeModal();
        handlers.onClearCanvas();
    });

    const allBtn = document.createElement("button");
    allBtn.classList.add("clear-all-button");
    allBtn.textContent = _("Clear all");
    allBtn.type = "button";
    bindClick(allBtn, () => {
        closeModal();
        handlers.onClearAll();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.classList.add("cancel-button");
    cancelBtn.textContent = _("Cancel");
    cancelBtn.type = "button";
    bindClick(cancelBtn, closeModal);

    const buttons = [canvasBtn, allBtn, cancelBtn];

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

    buttonContainer.appendChild(canvasBtn);
    buttonContainer.appendChild(allBtn);
    buttonContainer.appendChild(cancelBtn);
    modal.appendChild(buttonContainer);
    document.body.appendChild(modal);
    document.addEventListener("keydown", onKeyDown, true);
    canvasBtn.focus();
}

if (typeof define === "function" && define.amd) {
    define(function () {
        window.renderClearConfirmation = renderClearConfirmation;
        window.requestClear = requestClear;
        return { renderClearConfirmation, requestClear };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { renderClearConfirmation, requestClear };
}
