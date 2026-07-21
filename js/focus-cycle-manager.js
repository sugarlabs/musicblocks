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

/* global ActivityContext */

/* exported FocusCycleManager */

/**
 * FocusCycleManager
 * ==================
 * Cycles focus between Workspace → Toolbar → Palette on Tab / Shift+Tab.
 *
 * Design rules:
 *  1. KEYBOARD ONLY – all zone logic is gated behind `_keyboardMode`.
 *  2. Any mousedown immediately turns `_keyboardMode` off and removes all
 *     visual rings – mouse clicks go through completely unchanged.
 *  3. The focus rings / palette state are never changed unless the user
 *     reached the current element via the Tab key.
 */
class FocusCycleManager {
    constructor() {
        this._zones = ["workspace", "toolbar", "palette"];
        this._currentZone = null;
        this._keyboardMode = false; // true only while Tab-navigating
        this._lastFocusedButton = null; // last toolbar button focused by keyboard
        this._liveRegion = null;
        this._initialized = false; // guards against duplicate listener registration

        // Bind handlers so they can be removed if needed.
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onFocusIn = this._onFocusIn.bind(this);
    }

    init() {
        // Calling init() twice on the same instance must not register
        // duplicate document-level listeners.
        if (this._initialized) return;
        this._initialized = true;

        // Capture phase so we intercept Tab before anything else.
        document.addEventListener("keydown", this._onKeyDown, true);
        // BUBBLE phase for mousedown — canvas and other elements receive
        // the click first; we only clean up keyboard state afterwards.
        document.addEventListener("mousedown", this._onMouseDown, false);
        // Track last-focused toolbar button for memory restoration.
        document.addEventListener("focusin", this._onFocusIn, true);

        // Visually-hidden ARIA live region for screen readers. Reattach the
        // existing node if a previous instance already created it (e.g. after
        // an init → dispose → init cycle) so announcements are not lost.
        const existingRegion = document.getElementById("fcm-announcer");
        if (existingRegion) {
            this._liveRegion = existingRegion;
        } else {
            const r = document.createElement("div");
            r.id = "fcm-announcer";
            r.setAttribute("aria-live", "polite");
            Object.assign(r.style, {
                position: "absolute",
                width: "1px",
                height: "1px",
                margin: "-1px",
                overflow: "hidden",
                clip: "rect(0,0,0,0)",
                whiteSpace: "nowrap",
                border: "0"
            });
            document.body.appendChild(r);
            this._liveRegion = r;
        }
    }

    _getActivity() {
        try {
            if (
                typeof ActivityContext !== "undefined" &&
                ActivityContext &&
                typeof ActivityContext.getActivity === "function"
            ) {
                return ActivityContext.getActivity();
            }
        } catch {
            // ActivityContext is optional in older embeds and tests.
        }

        try {
            const context = globalThis?.ActivityContext;
            if (context && typeof context.getActivity === "function") {
                return context.getActivity();
            }
        } catch {
            // Global activity context may not exist.
        }

        return null;
    }

    _isWithin(el, target) {
        return Boolean(el && target && typeof el.contains === "function" && el.contains(target));
    }

    _workspaceElements() {
        return {
            holder: document.getElementById("canvasHolder"),
            container: document.getElementById("canvasContainer"),
            overlay: document.getElementById("canvas"),
            canvas: document.getElementById("myCanvas")
        };
    }

    _isWorkspaceTarget(target) {
        if (!target) return false;

        if (
            ["canvasHolder", "canvasContainer", "canvas", "myCanvas", "overlayCanvas"].includes(
                target.id
            )
        ) {
            return true;
        }

        if (typeof target.closest === "function") {
            const workspaceAncestor = target.closest(
                "#canvasHolder, #canvasContainer, #canvas, #myCanvas, #overlayCanvas"
            );
            if (workspaceAncestor) {
                return true;
            }
        }

        const ws = this._workspaceElements();
        return (
            this._isWithin(ws.holder, target) ||
            this._isWithin(ws.container, target) ||
            this._isWithin(ws.overlay, target) ||
            this._isWithin(ws.canvas, target)
        );
    }

    _clearToolbarFocus() {
        document.querySelectorAll(".toolbar-btn-focused").forEach(btn => {
            btn.classList.remove("toolbar-btn-focused");
            if (typeof btn.blur === "function") {
                btn.blur();
            }
        });

        const active = document.activeElement;
        const toolbars = document.getElementById("toolbars");
        if (this._isWithin(toolbars, active) && typeof active.blur === "function") {
            active.blur();
        }
    }

    _focusWorkspaceFromMouse() {
        const { holder, overlay } = this._workspaceElements();
        if (!holder) return;

        if (typeof holder.hasAttribute !== "function" || !holder.hasAttribute("tabindex")) {
            holder.setAttribute("tabindex", "-1");
        }

        holder.focus({ preventScroll: true });

        if (overlay && typeof overlay.dispatchEvent === "function") {
            const opts = { bubbles: true, cancelable: false };
            overlay.dispatchEvent(new PointerEvent("pointerdown", opts));
            overlay.dispatchEvent(new PointerEvent("pointerup", opts));
        }

        this._currentZone = "workspace";
    }

    // ------------------------------------------------------------------
    // Mouse interaction – runs AFTER the element receives the click
    // (bubble phase). Clears keyboard-mode state and visual rings so
    // that clicking the canvas/workspace always feels completely normal.
    // ------------------------------------------------------------------
    _onMouseDown(e) {
        // Always exit keyboard mode on any mouse interaction.
        this._keyboardMode = false;

        const toolbars = document.getElementById("toolbars");
        const paletteEl = document.getElementById("palette");
        const clickedToolbar = this._isWithin(toolbars, e.target);
        const clickedPalette = this._isWithin(paletteEl, e.target);
        const clickedWorkspace = this._isWorkspaceTarget(e.target);

        // Remove the keyboard focus ring from every zone container.
        this._clearAllRings();

        if (!clickedToolbar) {
            this._clearToolbarFocus();
        }

        try {
            const activity = this._getActivity();
            const p = activity?.palettes;
            if (p && typeof p.resetKeyboardNavigation === "function") {
                p.resetKeyboardNavigation({
                    closeMenus: clickedWorkspace,
                    blur: !clickedPalette
                });
            } else if (p) {
                p._keyboardNavActive = false;
            }

            if (clickedWorkspace && activity?.blocks) {
                activity.blocks.activeBlock = null;
            }
        } catch {
            // Mouse handoff should not fail if palette state is unavailable.
        }

        if (clickedWorkspace) {
            this._focusWorkspaceFromMouse();
            return;
        }

        // Reset tracked zone so next Tab always starts relative to the new
        // focus position rather than stale keyboard-navigation state.
        this._currentZone = null;
    }

    // ------------------------------------------------------------------
    // Keep track of the last toolbar button focused by ANY means so
    // we can restore it when re-entering via Tab.
    // ------------------------------------------------------------------
    _onFocusIn(e) {
        const toolbars = document.getElementById("toolbars");
        if (toolbars && toolbars.contains(e.target)) {
            // Only record if it's an interactive element (button / link)
            const tag = e.target.tagName.toLowerCase();
            if (tag === "a" || tag === "button" || e.target.getAttribute("role") === "button") {
                this._lastFocusedButton = e.target;
            }
            if (this._keyboardMode) this._currentZone = "toolbar";
        } else if (this._keyboardMode) {
            const palette = document.getElementById("palette");
            if (palette && palette.contains(e.target)) {
                this._currentZone = "palette";
            } else if (["canvasHolder", "canvas", "canvasContainer"].includes(e.target.id)) {
                this._currentZone = "workspace";
            }
        }
    }

    // ------------------------------------------------------------------
    // Tab key handler – the only place keyboard mode is turned ON.
    // ------------------------------------------------------------------
    _onKeyDown(e) {
        if (e.key !== "Tab") return;
        if (this._shouldBypass(e)) return;

        e.preventDefault();
        e.stopPropagation();

        this._keyboardMode = true;
        this._cycle(e.shiftKey);
    }

    _shouldBypass(e) {
        if (e.ctrlKey || e.altKey || e.metaKey) return true;
        const active = document.activeElement;
        if (!active) return false;
        const tag = active.nodeName.toLowerCase();
        if ((tag === "input" && active.type !== "file") || tag === "textarea" || tag === "select")
            return true;
        if (active.isContentEditable) return true;
        if (active.closest('.sweet-alert, .modal, [role="dialog"], .widget, .dropdown-content')) {
            return true;
        }
        return false;
    }

    // ------------------------------------------------------------------
    // Determine next zone and transfer focus.
    // ------------------------------------------------------------------
    _cycle(reverse) {
        // Determine current zone. If unknown (no zone focused yet OR the active
        // element is body/document), treat as 'workspace' so the first Tab
        // always lands on the toolbar (workspace → Tab → toolbar).
        if (this._currentZone === null) {
            const detected = this._zoneOf(document.activeElement);
            this._currentZone = detected ?? "workspace";
        }

        const idx = this._zones.indexOf(this._currentZone);
        const nextIdx =
            idx === -1
                ? 1 // safety fallback → toolbar
                : reverse
                  ? (idx - 1 + this._zones.length) % this._zones.length
                  : (idx + 1) % this._zones.length;

        // Clean up the zone we are leaving.
        this._leaveZone(this._currentZone);

        const next = this._zones[nextIdx];
        this._currentZone = next;
        this._enterZone(next);
    }

    _zoneOf(el) {
        if (!el) return null;
        const toolbars = document.getElementById("toolbars");
        const palette = document.getElementById("palette");
        if (toolbars && toolbars.contains(el)) return "toolbar";
        if (palette && palette.contains(el)) return "palette";
        if (["canvasHolder", "canvas", "canvasContainer"].includes(el.id)) return "workspace";
        return null;
    }

    // ------------------------------------------------------------------
    // Visual cleanup when leaving a zone.
    // ------------------------------------------------------------------
    _leaveZone(zone) {
        this._clearRingForZone(zone);

        if (zone === "toolbar") {
            // Strip the toolbar's own keyboard-focus class so arrow-key logic
            // goes dormant.
            document.querySelectorAll(".toolbar-btn-focused").forEach(b => {
                b.classList.remove("toolbar-btn-focused");
                b.blur();
            });
        }

        if (zone === "palette") {
            try {
                const p = this._getActivity()?.palettes;
                if (p && typeof p.resetKeyboardNavigation === "function") {
                    p.resetKeyboardNavigation({ closeMenus: true, blur: true });
                } else if (p) {
                    p._keyboardNavActive = false;
                }
            } catch {
                // Leaving the palette should still continue if cleanup is unavailable.
            }
        }
    }

    // ------------------------------------------------------------------
    // Set focus & visual ring when entering a zone.
    // ------------------------------------------------------------------
    _enterZone(zone) {
        const container = this._containerEl(zone);

        if (zone === "workspace") {
            const ws = document.getElementById("canvasHolder");
            const cv = document.getElementById("canvas");
            if (ws) {
                if (typeof ws.hasAttribute !== "function" || !ws.hasAttribute("tabindex")) {
                    ws.setAttribute("tabindex", "-1");
                }
                if (container) container.classList.add("focus-zone-active");
                ws.focus({ preventScroll: true });
                // Dispatching a synthetic pointerdown+up on the canvas re-engages
                // the browser's native scroll target. This is what normally happens
                // when the user physically clicks the canvas, and is needed when
                // focus moves here via keyboard (especially after using arrow keys
                // in the palette which can steal the scroll-active element).
                if (cv && typeof cv.dispatchEvent === "function") {
                    const opts = { bubbles: true, cancelable: false };
                    cv.dispatchEvent(new PointerEvent("pointerdown", opts));
                    cv.dispatchEvent(new PointerEvent("pointerup", opts));
                }
                this._announce("Workspace active");
            }
            return;
        }

        if (zone === "toolbar") {
            const toolbars = document.getElementById("toolbars");
            if (!toolbars) return;
            // Prefer the last button the user was on; fallback to first visible.
            let target = this._lastFocusedButton;
            if (!target || !toolbars.contains(target) || !this._visible(target)) {
                const buttons = Array.from(
                    toolbars.querySelectorAll('[tabindex="0"], a[role="button"], button')
                );
                target = buttons.find(b => this._visible(b)) || toolbars;
            }
            if (container) container.classList.add("focus-zone-active");
            target.focus({ preventScroll: true });
            this._announce("Toolbar active");
            return;
        }

        if (zone === "palette") {
            const palette = document.getElementById("palette");
            if (!palette) return;
            if (container) container.classList.add("focus-zone-active");

            // Sync palette.js's internal state so arrow keys work immediately.
            let p = null;
            try {
                p = this._getActivity()?.palettes;
                if (p) {
                    p._keyboardNavActive = true;
                }
            } catch {
                // Palette keyboard state sync is best-effort.
            }

            // Give native focus to the palette container (it has tabindex).
            // This must happen after palette.js knows we arrived via keyboard,
            // otherwise the collapsed palette will not auto-expand on Tab.
            palette.focus({ preventScroll: true });

            try {
                if (p) {
                    // Only set to blocks section if there are rows and nothing is already focused.
                    const listBody = palette.children[0]?.children[1]?.children[1];
                    const rows = listBody ? Array.from(listBody.children) : [];
                    const alreadyFocused = rows.some(r => r.dataset.keyboardFocus);
                    if (!alreadyFocused && rows.length > 0) {
                        const targetRow = rows.length > 1 ? rows[1] : rows[0];
                        targetRow.dataset.keyboardFocus = "true";
                        targetRow.style.backgroundColor =
                            window.platformColor?.hoverColor || "#0CAFFF";
                        p._navSection = "blocks";
                        p._navBlockIndex = rows.length > 1 ? 1 : 0;
                    }
                }
            } catch {
                // Palette keyboard state sync is best-effort.
            }
            this._announce("Palette active");
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    _containerEl(zone) {
        if (zone === "workspace") return document.getElementById("canvasHolder");
        if (zone === "toolbar") return document.getElementById("toolbars");
        if (zone === "palette") return document.getElementById("palette");
        return null;
    }

    _clearRingForZone(zone) {
        const el = this._containerEl(zone);
        if (el) el.classList.remove("focus-zone-active");
    }

    _clearAllRings() {
        ["workspace", "toolbar", "palette"].forEach(z => this._clearRingForZone(z));
    }

    _visible(el) {
        if (!el) return false;
        const s = window.getComputedStyle(el);
        return s.display !== "none" && s.visibility !== "hidden" && el.offsetWidth > 0;
    }

    _announce(msg) {
        if (this._liveRegion) this._liveRegion.textContent = msg;
    }

    /**
     * Removes all document-level event listeners attached by init().
     * Must be called when the FocusCycleManager is no longer needed.
     *
     * @returns {void}
     */
    dispose() {
        document.removeEventListener("keydown", this._onKeyDown, true);
        document.removeEventListener("mousedown", this._onMouseDown, false);
        document.removeEventListener("focusin", this._onFocusIn, true);
        this._liveRegion = null;
        this._initialized = false;
    }
}

if (typeof define === "function" && define.amd) {
    define(function () {
        window.FocusCycleManager = FocusCycleManager;
        return FocusCycleManager;
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = FocusCycleManager;
}
