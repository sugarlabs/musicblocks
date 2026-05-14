/*
 * Copyright (c) 2025 Music Blocks Contributors
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the The GNU Affero General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA
 */

/* global docById */

/**
 * Music Blocks Accessibility Module
 * Provides keyboard navigation, focus management, and WCAG 2.1 AA compliance
 */

const AccessibilityHelper = {
    /**
     * Initialize all accessibility features
     */
    init() {
        this.setupDropdownKeyboardNavigation();
        this.setupToolbarKeyboardNavigation();
        this.setupFocusManagement();
        this.setupAriaUpdates();
        this.setupTabFocusTracking();
        this.ensureProperTabOrder();
    },

    /**
     * Ensure all visible interactive elements are in proper tab order
     */
    ensureProperTabOrder() {
        // Find ALL interactive elements with role="button" or type="button"
        const allButtons = document.querySelectorAll("[role='button'], button, a[role='button']");

        allButtons.forEach(btn => {
            // Get computed style to detect hidden elements (CSS or inline)
            const computedStyle = window.getComputedStyle(btn);
            const isHidden =
                computedStyle.display === "none" ||
                computedStyle.visibility === "hidden" ||
                btn.hidden ||
                btn.getAttribute("aria-hidden") === "true";

            if (isHidden) {
                // Hidden elements should not be in tab order
                btn.setAttribute("tabindex", "-1");
            } else {
                // Visible interactive elements should be in tab order
                if (btn.getAttribute("tabindex") !== "-1") {
                    btn.setAttribute("tabindex", "0");
                }
            }
        });
    },

    /**
     * Track Tab key presses for visual feedback
     */
    setupTabFocusTracking() {
        document.addEventListener("keydown", e => {
            if (e.key === "Tab") {
                document.body.classList.add("keyboard-nav-active");
            }
        });

        document.addEventListener("keyup", e => {
            if (e.key === "Tab") {
                // Keep the indicator on during keyboard navigation
                setTimeout(() => {
                    if (document.activeElement && document.activeElement !== document.body) {
                        document.body.classList.add("keyboard-nav-active");
                    }
                }, 100);
            }
        });

        // Remove indicator when mouse is used
        document.addEventListener("mousedown", () => {
            document.body.classList.remove("keyboard-nav-active");
        });
    },

    /**
     * Setup keyboard navigation for dropdown menus
     */
    setupDropdownKeyboardNavigation() {
        const dropdownTriggers = document.querySelectorAll("[data-activates]");
        dropdownTriggers.forEach(trigger => {
            trigger.addEventListener("keydown", e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    trigger.click();
                    this.focusFirstDropdownItem(trigger);
                }
                if (e.key === "Escape") {
                    e.preventDefault();
                    this.closeDropdown(trigger);
                    trigger.focus();
                }
            });
        });
    },

    /**
     * Focus the first item in a dropdown menu
     */
    focusFirstDropdownItem(trigger) {
        const dropdownId = trigger.getAttribute("data-activates");
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            setTimeout(() => {
                const firstItem = dropdown.querySelector("a, button, input");
                if (firstItem) {
                    firstItem.focus();
                }
            }, 100);
        }
    },

    /**
     * Close a dropdown menu
     */
    closeDropdown(trigger) {
        const dropdownId = trigger.getAttribute("data-activates");
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.style.display = "none";
            trigger.setAttribute("aria-expanded", "false");
        }
    },

    /**
     * Setup keyboard navigation for toolbar
     */
    setupToolbarKeyboardNavigation() {
        const toolbarButtons = document.querySelectorAll(
            "#toolbars a[role='button'], #aux-toolbar a[role='button']"
        );

        toolbarButtons.forEach((btn, index) => {
            btn.addEventListener("keydown", e => {
                let targetBtn = null;

                if (e.key === "ArrowRight") {
                    e.preventDefault();
                    targetBtn = toolbarButtons[index + 1] || toolbarButtons[0];
                } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    targetBtn =
                        toolbarButtons[index - 1] || toolbarButtons[toolbarButtons.length - 1];
                }

                if (targetBtn) {
                    targetBtn.focus();
                }
            });
        });
    },

    /**
     * Setup focus management to prevent focus loss
     */
    setupFocusManagement() {
        // Prevent focus from being lost when elements are hidden
        const originalSetAttribute = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function (name, value) {
            originalSetAttribute.call(this, name, value);

            if (
                name === "style" &&
                (value.includes("display: none") || value.includes("display:none"))
            ) {
                const focused = document.activeElement;
                if (this.contains(focused)) {
                    // Move focus to a safe element
                    const safeElement = document.getElementById("canvas") || document.body;
                    safeElement.focus();
                }
            }
        };

        // Restore focus after modal dialogs close
        document.addEventListener("keydown", e => {
            if (e.key === "Escape") {
                setTimeout(() => {
                    const focused = document.activeElement;
                    if (focused === document.body || !document.body.contains(focused)) {
                        const canvas = document.getElementById("canvas");
                        if (canvas) canvas.focus();
                    }
                }, 100);
            }
        });
    },

    /**
     * Update aria-expanded attributes when dropdowns are toggled
     */
    setupAriaUpdates() {
        const dropdownTriggers = document.querySelectorAll(
            "[data-activates][aria-haspopup='menu']"
        );

        dropdownTriggers.forEach(trigger => {
            const originalClick = trigger.onclick;

            trigger.addEventListener("click", e => {
                const isExpanded = trigger.getAttribute("aria-expanded") === "true";
                trigger.setAttribute("aria-expanded", !isExpanded);

                if (originalClick) {
                    originalClick.call(trigger, e);
                }
            });
        });

        // Close all dropdowns when clicking outside
        document.addEventListener("click", e => {
            const isDropdownTrigger = e.target.closest("[data-activates]");
            if (!isDropdownTrigger) {
                dropdownTriggers.forEach(trigger => {
                    trigger.setAttribute("aria-expanded", "false");
                });
            }
        });
    },

    /**
     * Announce messages to screen readers
     */
    announceToScreenReader(message, priority = "polite") {
        let liveRegion = document.getElementById("sr-announce");
        if (!liveRegion) {
            liveRegion = document.createElement("div");
            liveRegion.id = "sr-announce";
            liveRegion.setAttribute("aria-live", priority);
            liveRegion.setAttribute("aria-atomic", "true");
            liveRegion.style.position = "absolute";
            liveRegion.style.left = "-10000px";
            document.body.appendChild(liveRegion);
        }

        liveRegion.setAttribute("aria-live", priority);
        liveRegion.textContent = message;
    },

    /**
     * Make elements keyboard focusable
     */
    makeFocusable(element, tabindex = 0) {
        if (!element) return;

        element.setAttribute("tabindex", tabindex);
        if (!element.getAttribute("role")) {
            element.setAttribute("role", "button");
        }
    },

    /**
     * Trap focus within a modal or container
     */
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            "a, button, input, select, textarea, [tabindex]"
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        container.addEventListener("keydown", e => {
            if (e.key !== "Tab") return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    },

    /**
     * Update focus ring color when theme changes
     */
    updateFocusRingForTheme(theme) {
        let focusColor = "#1976d2"; // Light theme default

        if (theme === "dark") {
            focusColor = "#90caf9";
        } else if (theme === "highcontrast") {
            focusColor = "#ffff00";
        }

        // Update CSS variable if it exists
        document.documentElement.style.setProperty("--focus-color", focusColor);
    }
};

/* Ensure accessibility helper is available globally */
if (typeof window !== "undefined") {
    window.AccessibilityHelper = AccessibilityHelper;
}

/* Export for testing */
if (typeof module !== "undefined" && module.exports) {
    module.exports = AccessibilityHelper;
}
