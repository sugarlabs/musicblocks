// Copyright (c) 2026 Harihara Vardhan
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * mb-dialog.js
 *
 * Lightweight, dependency-free dialog helper for Music Blocks.
 *
 * Goals:
 * - Provide non-blocking alert/prompt dialogs without browser `alert()`/`prompt()`.
 * - Use a modal overlay that blocks background interaction (prompt-like behavior).
 * - Allow dragging via the title bar for better usability.
 * - Reuse existing widget window styles for visual consistency.
 * - Respect light/dark themes via CSS variables.
 * - Be safe to call early (before Activity or i18n are fully initialized).
 *
 * Public API:
 * - window.MBDialog.alert(message, title?, options?)
 *   Shows a modal dialog with an OK button.
 *
 * - window.MBDialog.prompt(options)
 *   Returns a Promise resolving to the input string, or null if canceled.
 *   Options: { title, message, defaultValue, okText, cancelText }
 */

(function () {
    "use strict";

    const DIALOG_CLASS = "mb-system-dialog";
    const DEFAULT_TITLE = "Music Blocks";

    const t = text => (typeof window._ === "function" ? window._(text) : text);

    const getPreferredTheme = () => {
        try {
            const stored = localStorage.getItem("themePreference");
            if (stored) return stored;
        } catch (e) {
            // Ignore storage errors
        }
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return "dark";
        }
        return "light";
    };

    const ensureThemeClass = () => {
        if (!document.body) return;
        if (document.body.classList.contains("dark") || document.body.classList.contains("light")) {
            return;
        }
        const theme = getPreferredTheme();
        document.body.classList.add(theme);
    };

    let activeCleanup = null;

    const removeExistingDialogs = () => {
        document.querySelectorAll(`.${DIALOG_CLASS}`).forEach(el => el.remove());
    };

    const centerDialog = frame => {
        const rect = frame.getBoundingClientRect();
        const left = Math.max((window.innerWidth - rect.width) / 2, 8);
        const top = Math.max((window.innerHeight - rect.height) / 2, 72);
        frame.style.left = `${left}px`;
        frame.style.top = `${top}px`;
    };

    const createDialog = options => {
        ensureThemeClass();
        if (typeof activeCleanup === "function") {
            activeCleanup();
            activeCleanup = null;
        }
        removeExistingDialogs();

        const container = document.getElementById("floatingWindows") || document.body;

        const overlay = document.createElement("div");
        overlay.className = `mb-dialog-overlay ${DIALOG_CLASS}`;
        overlay.setAttribute("aria-hidden", "true");
        overlay.style.position = "fixed";
        overlay.style.left = "0";
        overlay.style.top = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.35)";
        overlay.style.zIndex = "10000";

        const frame = document.createElement("div");
        frame.className = `windowFrame ${DIALOG_CLASS}`;
        frame.setAttribute("role", "dialog");
        frame.setAttribute("aria-modal", "true");
        frame.setAttribute("aria-label", options.title || DEFAULT_TITLE);
        frame.style.position = "fixed";
        frame.style.maxWidth = "640px";
        frame.style.minWidth = "320px";
        frame.style.zIndex = "10001";
        frame.style.backgroundColor = "var(--bg)";
        frame.style.borderColor = "var(--border)";

        const topBar = document.createElement("div");
        topBar.className = "wfTopBar";

        const closeButton = document.createElement("div");
        closeButton.className = "wftButton close";
        closeButton.title = t("Close");
        closeButton.setAttribute("aria-label", t("Close"));

        const titleEl = document.createElement("div");
        titleEl.className = "wftTitle";
        titleEl.textContent = options.title || DEFAULT_TITLE;

        const spacer = document.createElement("div");
        spacer.style.width = "21px";

        topBar.appendChild(closeButton);
        topBar.appendChild(titleEl);
        topBar.appendChild(spacer);

        const body = document.createElement("div");
        body.className = "wfWinBody";

        const widget = document.createElement("div");
        widget.className = "wfbWidget";
        widget.style.padding = "16px";
        widget.style.display = "flex";
        widget.style.flexDirection = "column";
        widget.style.gap = "16px";
        widget.style.minWidth = "0";
        widget.style.backgroundColor = "var(--panel-bg)";
        widget.style.color = "var(--fg)";

        const message = document.createElement("div");
        message.textContent = options.message || "";
        message.style.whiteSpace = "pre-wrap";

        const actions = document.createElement("div");
        actions.style.display = "flex";
        actions.style.justifyContent = "center";
        actions.style.gap = "8px";

        const okButton = document.createElement("button");
        okButton.className = "confirm-button";
        okButton.type = "button";
        okButton.textContent = options.okText || t("OK");

        const cancelButton = document.createElement("button");
        cancelButton.className = "cancel-button";
        cancelButton.type = "button";
        cancelButton.textContent = options.cancelText || t("Cancel");

        if (options.showCancel) {
            actions.appendChild(cancelButton);
        }
        actions.appendChild(okButton);

        widget.appendChild(message);
        if (options.input) {
            widget.appendChild(options.input);
        }
        widget.appendChild(actions);
        body.appendChild(widget);

        frame.appendChild(topBar);
        frame.appendChild(body);
        container.appendChild(overlay);
        container.appendChild(frame);

        const cleanup = () => {
            window.removeEventListener("resize", onResize);
            document.removeEventListener("keydown", onKeyDown, true);
            document.removeEventListener("mousemove", onMouseMove, true);
            document.removeEventListener("mouseup", onMouseUp, true);
            frame.remove();
            overlay.remove();
            if (typeof options.onClose === "function") {
                options.onClose();
            }
        };

        const onResize = () => centerDialog(frame);
        const onKeyDown = event => {
            if (event.key === "Escape") {
                event.preventDefault();
                if (typeof options.onCancel === "function") {
                    options.onCancel();
                }
                cleanup();
            }
        };

        let dragging = false;
        let dragDx = 0;
        let dragDy = 0;

        const onMouseMove = event => {
            if (!dragging) return;
            const x = event.clientX - dragDx;
            const y = event.clientY - dragDy;
            const maxLeft = Math.max(window.innerWidth - frame.offsetWidth, 8);
            const maxTop = Math.max(window.innerHeight - frame.offsetHeight, 64);
            frame.style.left = `${Math.min(Math.max(x, 8), maxLeft)}px`;
            frame.style.top = `${Math.min(Math.max(y, 64), maxTop)}px`;
        };

        const onMouseUp = () => {
            dragging = false;
        };

        topBar.addEventListener("mousedown", event => {
            if (event.target && event.target.closest && event.target.closest(".wftButton")) {
                return;
            }
            dragging = true;
            const rect = frame.getBoundingClientRect();
            dragDx = event.clientX - rect.left;
            dragDy = event.clientY - rect.top;
            event.preventDefault();
        });

        closeButton.onclick = () => {
            if (typeof options.onCancel === "function") {
                options.onCancel();
            }
            cleanup();
        };
        cancelButton.onclick = () => {
            if (typeof options.onCancel === "function") {
                options.onCancel();
            }
            cleanup();
        };
        okButton.onclick = () => {
            if (typeof options.onConfirm === "function") {
                options.onConfirm();
            }
            cleanup();
        };

        overlay.addEventListener(
            "wheel",
            event => {
                event.preventDefault();
            },
            { passive: false }
        );

        document.addEventListener("mousemove", onMouseMove, true);
        document.addEventListener("mouseup", onMouseUp, true);
        window.addEventListener("resize", onResize);
        document.addEventListener("keydown", onKeyDown, true);

        centerDialog(frame);
        frame.tabIndex = -1;
        frame.focus();

        activeCleanup = cleanup;
        return { okButton, cancelButton, cleanup };
    };

    window.MBDialog = {
        alert(message, title, options = {}) {
            createDialog({
                message,
                title: title || DEFAULT_TITLE,
                okText: options.okText,
                onClose: options.onClose
            });
        },
        prompt(options = {}) {
            const title = options.title || DEFAULT_TITLE;
            const message = options.message || "";
            const defaultValue = options.defaultValue || "";
            return new Promise(resolve => {
                let resolved = false;
                const input = document.createElement("input");
                input.type = "text";
                input.value = defaultValue;
                input.style.width = "100%";
                input.style.padding = "8px";
                input.style.borderRadius = "4px";
                input.style.border = "1px solid var(--border)";
                input.style.backgroundColor = "var(--bg)";
                input.style.color = "var(--fg)";
                input.style.boxSizing = "border-box";

                const finish = value => {
                    if (resolved) return;
                    resolved = true;
                    resolve(value);
                };

                const dialog = createDialog({
                    title,
                    message,
                    input,
                    okText: options.okText || t("OK"),
                    cancelText: options.cancelText || t("Cancel"),
                    showCancel: true,
                    onConfirm: () => finish(input.value),
                    onCancel: () => finish(null)
                });

                input.addEventListener("keydown", event => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        if (dialog && dialog.okButton) {
                            dialog.okButton.click();
                        } else {
                            finish(input.value);
                        }
                    }
                });
                input.focus();
                input.select();
            });
        }
    };
})();
