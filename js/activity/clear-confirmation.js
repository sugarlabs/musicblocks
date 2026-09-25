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

/* exported renderClearConfirmation */

/**
 * Shows the Clear workspace dialog with canvas-only and clear-all choices.
 *
 * @param {object} activity
 * @param {Function} activity.addEventListener
 * @param {{ onClearCanvas: Function, onClearAll: Function }} handlers
 */
function renderClearConfirmation(activity, handlers) {
    if (document.getElementById("clear-confirm")) {
        return;
    }

    const modal = document.createElement("div");
    modal.classList.add("modalBox");
    modal.id = "clear-confirm";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "clear-confirm-title");

    const title = document.createElement("h2");
    title.id = "clear-confirm-title";
    title.textContent = _("Clear workspace");
    title.classList.add("modal-title");
    modal.appendChild(title);

    const message = document.createElement("p");
    message.textContent = _("Clear only the drawings, or also send every block to the trash?");
    message.classList.add("modal-message");
    modal.appendChild(message);

    const buttonContainer = document.createElement("div");
    buttonContainer.classList.add("clear-button-container");

    const closeModal = () => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
    };

    const canvasBtn = document.createElement("button");
    canvasBtn.classList.add("confirm-button");
    canvasBtn.textContent = _("Clear canvas");
    canvasBtn.type = "button";
    activity.addEventListener(canvasBtn, "click", () => {
        closeModal();
        handlers.onClearCanvas();
    });

    const allBtn = document.createElement("button");
    allBtn.classList.add("clear-all-button");
    allBtn.textContent = _("Clear all");
    allBtn.type = "button";
    activity.addEventListener(allBtn, "click", () => {
        closeModal();
        handlers.onClearAll();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.classList.add("cancel-button");
    cancelBtn.textContent = _("Cancel");
    cancelBtn.type = "button";
    activity.addEventListener(cancelBtn, "click", closeModal);

    buttonContainer.appendChild(canvasBtn);
    buttonContainer.appendChild(allBtn);
    buttonContainer.appendChild(cancelBtn);
    modal.appendChild(buttonContainer);
    document.body.appendChild(modal);
}

if (typeof define === "function" && define.amd) {
    define(function () {
        window.renderClearConfirmation = renderClearConfirmation;
        return { renderClearConfirmation };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { renderClearConfirmation };
}
