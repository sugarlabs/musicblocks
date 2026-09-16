/* global cy, Cypress, describe, it, before, beforeEach, afterEach, after, expect */

// Suppress non-fatal uncaught exceptions (such as async audio/widget teardowns or RequireJS timing variances)
Cypress.on("uncaught:exception", () => false);

/**
 * Helper to resolve a CSS custom property into its computed color format.
 * Dynamically binds to the active document/window context so tests remain
 * tied directly to semantic design tokens without hardcoded color assumptions.
 *
 * @param {Window} win - Browser window instance
 * @param {string} tokenName - CSS custom property name (e.g. '--color-bg-primary')
 * @param {Element} [scopeElement=win.document.body] - Element from which the variable is resolved
 * @returns {string} Computed color value (e.g. 'rgb(...)')
 */
function resolveTokenColor(win, tokenName, scopeElement = win.document.body) {
    const rawValue = win.getComputedStyle(scopeElement).getPropertyValue(tokenName).trim();
    expect(rawValue, `Token "${tokenName}" should be defined on the element`).to.not.be.empty;

    const probe = win.document.createElement("div");
    probe.style.color = rawValue;
    win.document.body.appendChild(probe);
    const resolvedColor = win.getComputedStyle(probe).color;
    probe.remove();
    return resolvedColor;
}

describe("Browser-Level CSS Cascade Tests for Async Stylesheet Loading", () => {
    const CORE_ASYNC_STYLESHEETS = ["activities.css", "windows.css", "darkmode.css", "style.css"];

    before(() => {
        // Pre-configure localStorage before page script execution to guarantee deterministic startup
        cy.visit("http://127.0.0.1:3000", {
            onBeforeLoad(win) {
                win.localStorage.setItem("themePreference", "light");
                win.localStorage.setItem("beginnerMode", "false");
            }
        });
        cy.waitForAppReady();
        cy.waitForStylesheetsToLoad(CORE_ASYNC_STYLESHEETS);
    });

    beforeEach(() => {
        // Ensure any floating windows are dismissed before test execution
        cy.get("body").then($body => {
            const openWindows = $body.find(".windowFrame .wftButton.close");
            if (openWindows.length) {
                cy.wrap(openWindows).click({ multiple: true, force: true });
            }
        });
    });

    afterEach(() => {
        // Dismiss any lingering dialogs or modals
        cy.get("body").then($body => {
            const closeButtons = $body.find(".windowFrame .wftButton.close, .mb-dialog-overlay");
            if (closeButtons.length) {
                cy.wrap(closeButtons).click({ multiple: true, force: true });
            }
        });

        // Reset theme to light mode and restore desktop viewport cleanly between tests
        cy.window().then(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            if (
                activity &&
                activity.themeBox &&
                typeof activity.themeBox.light_onclick === "function"
            ) {
                activity.themeBox.light_onclick();
            }
        });
        cy.get("body").should("not.have.class", "dark").should("not.have.class", "highcontrast");
        cy.viewport(1400, 1000);
    });

    after(() => {
        // Clear localStorage so subsequent specs run in a clean environment
        cy.clearLocalStorage();
    });

    it("verifies required async stylesheets finish loading and transition to rel='stylesheet'", () => {
        cy.document().should(doc => {
            const allElements = Array.from(doc.querySelectorAll("link, style[data-href]"));
            CORE_ASYNC_STYLESHEETS.forEach(sheetName => {
                const match = allElements.find(el => {
                    const href =
                        el.getAttribute("data-href") || el.getAttribute("href") || el.href || "";
                    return href.includes(sheetName);
                });
                expect(match, `Preloaded stylesheet "${sheetName}" must exist in document head`).to
                    .exist;
                if (match.tagName.toLowerCase() === "link") {
                    expect(
                        match.getAttribute("rel"),
                        `Stylesheet "${sheetName}" must have transitioned to rel="stylesheet"`
                    ).to.eq("stylesheet");
                } else {
                    expect(
                        match.hasAttribute("data-href"),
                        `Stylesheet "${sheetName}" was converted to style[data-href]`
                    ).to.be.true;
                }
            });
        });

        cy.window().should(win => {
            const sheetSources = Array.from(win.document.styleSheets).map(s => {
                return (
                    s.href ||
                    (s.ownerNode &&
                        (s.ownerNode.getAttribute("data-href") ||
                            s.ownerNode.getAttribute("href"))) ||
                    ""
                );
            });
            CORE_ASYNC_STYLESHEETS.forEach(sheetName => {
                const found = sheetSources.some(src => src.includes(sheetName));
                expect(
                    found,
                    `Stylesheet "${sheetName}" must be registered in document.styleSheets`
                ).to.be.true;
            });
        });
    });

    it("verifies Light Mode CSS cascade computes canonical token background and layout", () => {
        cy.window().should(win => {
            const expectedBg = resolveTokenColor(win, "--color-bg-primary");
            const computedBg = win.getComputedStyle(win.document.body).backgroundColor;
            expect(
                computedBg,
                "Body background must match resolved --color-bg-primary token"
            ).to.eq(expectedBg);
        });

        // Verify workspace core elements are rendered in layout
        cy.get("#canvas").should("be.visible");
        cy.get("#toolbars").should("be.visible");
        cy.get("#palette").should("be.visible");
    });

    it("verifies Dark Mode CSS cascade resolves properly across async stylesheets without specificity bugs", () => {
        cy.window().should(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            expect(activity, "Activity singleton should exist").to.exist;
            expect(activity.themeBox, "ThemeBox should exist").to.exist;
        });

        // Switch to Dark Mode
        cy.window().then(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            activity.themeBox.dark_onclick();
        });

        cy.get("body").should("have.class", "dark");

        // Verify computed background matches the dynamic dark token without hardcoded RGB
        cy.window().should(win => {
            const expectedDarkBg = resolveTokenColor(win, "--color-bg-primary");
            const computedDarkBg = win.getComputedStyle(win.document.body).backgroundColor;
            expect(
                computedDarkBg,
                "Dark mode body background must match resolved dark token"
            ).to.eq(expectedDarkBg);

            // Canvas background under dark mode must also match --color-bg-primary
            const canvasEl = win.document.getElementById("canvas");
            if (canvasEl) {
                const computedCanvasBg = win.getComputedStyle(canvasEl).backgroundColor;
                expect(
                    computedCanvasBg,
                    "Dark mode canvas background must match resolved --color-bg-primary token"
                ).to.eq(expectedDarkBg);
            }
        });
    });

    it("verifies High-Contrast Mode CSS cascade resolves properly", () => {
        cy.window().should(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            expect(activity, "Activity singleton should exist").to.exist;
            expect(activity.themeBox, "ThemeBox should exist").to.exist;
        });

        // Switch to High-Contrast Mode
        cy.window().then(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            activity.themeBox.highcontrast_onclick();
        });

        cy.get("body").should("have.class", "highcontrast");

        // Verify computed background matches resolved high-contrast token
        cy.window().should(win => {
            const expectedHighContrastBg = resolveTokenColor(win, "--color-bg-primary");
            const computedHighContrastBg = win.getComputedStyle(win.document.body).backgroundColor;
            expect(
                computedHighContrastBg,
                "High contrast body background must match resolved token"
            ).to.eq(expectedHighContrastBg);

            const expectedTextColor = resolveTokenColor(win, "--color-text-primary");
            const computedTextColor = win.getComputedStyle(win.document.body).color;
            expect(
                computedTextColor,
                "High contrast body color must match resolved --color-text-primary token"
            ).to.eq(expectedTextColor);
        });
    });

    it("verifies multi-theme cascade transitions (Light -> Dark -> High-Contrast -> Light) without residual style leakage", () => {
        cy.window().then(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;

            // 1. Initial Light
            const lightBg = resolveTokenColor(win, "--color-bg-primary");
            expect(win.getComputedStyle(win.document.body).backgroundColor).to.eq(lightBg);

            // 2. Switch to Dark
            activity.themeBox.dark_onclick();
        });

        cy.get("body").should("have.class", "dark");
        cy.window().should(win => {
            const darkBg = resolveTokenColor(win, "--color-bg-primary");
            expect(win.getComputedStyle(win.document.body).backgroundColor).to.eq(darkBg);
        });

        // 3. Switch to High-Contrast
        cy.window().then(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            activity.themeBox.highcontrast_onclick();
        });

        cy.get("body").should("have.class", "highcontrast");
        cy.window().should(win => {
            const highContrastBg = resolveTokenColor(win, "--color-bg-primary");
            expect(win.getComputedStyle(win.document.body).backgroundColor).to.eq(highContrastBg);
        });

        // 4. Return to Light
        cy.window().then(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            activity.themeBox.light_onclick();
        });

        cy.get("body").should("not.have.class", "dark").should("not.have.class", "highcontrast");

        cy.window().should(win => {
            const restoredLightBg = resolveTokenColor(win, "--color-bg-primary");
            expect(win.getComputedStyle(win.document.body).backgroundColor).to.eq(restoredLightBg);
            expect(win.document.body.style.background).to.eq("");
        });
    });

    it("verifies floating widget windows compute token styles correctly under the async stylesheet cascade", () => {
        // Open status floating window
        cy.window().then(win => {
            expect(win.widgetWindows, "widgetWindows manager should exist").to.exist;
            win.widgetWindows.windowFor({}, "status", "status", true);
        });

        cy.get(".windowFrame", { timeout: 30000 }).should("be.visible");

        // Verify Light Mode window frame tokens dynamically resolved from CSS variables
        cy.window().should(win => {
            const windowFrame = win.document.querySelector(".windowFrame");
            expect(windowFrame, "Window frame element should exist").to.exist;

            const expectedFrameBg = resolveTokenColor(win, "--color-widget-frame-bg", windowFrame);
            const expectedFrameBorder = resolveTokenColor(
                win,
                "--color-widget-frame-border",
                windowFrame
            );
            const expectedTitleText = resolveTokenColor(win, "--color-text-secondary", windowFrame);

            const computedFrame = win.getComputedStyle(windowFrame);
            expect(
                computedFrame.backgroundColor,
                "Window frame bg must match --color-widget-frame-bg"
            ).to.eq(expectedFrameBg);
            expect(
                computedFrame.borderTopColor,
                "Window frame border must match --color-widget-frame-border"
            ).to.eq(expectedFrameBorder);

            const titleEl = windowFrame.querySelector(".wftTitle");
            if (titleEl) {
                expect(
                    win.getComputedStyle(titleEl).color,
                    "Desktop title text must match --color-text-secondary"
                ).to.eq(expectedTitleText);
            }
        });

        // Switch to Dark Mode while window is open
        cy.window().then(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            activity.themeBox.dark_onclick();
        });

        cy.get("body").should("have.class", "dark");

        // Verify Dark Mode window frame tokens update dynamically according to the cascade
        cy.window().should(win => {
            const windowFrame = win.document.querySelector(".windowFrame");
            expect(windowFrame, "Window frame element should exist in dark mode").to.exist;

            const expectedDarkFrameBg = resolveTokenColor(
                win,
                "--color-widget-frame-bg",
                windowFrame
            );
            const expectedDarkFrameBorder = resolveTokenColor(
                win,
                "--color-widget-frame-border",
                windowFrame
            );
            const expectedDarkTitleText = resolveTokenColor(
                win,
                "--color-text-secondary",
                windowFrame
            );

            const computedDarkFrame = win.getComputedStyle(windowFrame);
            expect(
                computedDarkFrame.backgroundColor,
                "Dark window frame bg must match dark --color-widget-frame-bg"
            ).to.eq(expectedDarkFrameBg);
            expect(
                computedDarkFrame.borderTopColor,
                "Dark window frame border must match dark --color-widget-frame-border"
            ).to.eq(expectedDarkFrameBorder);

            const titleEl = windowFrame.querySelector(".wftTitle");
            if (titleEl) {
                expect(
                    win.getComputedStyle(titleEl).color,
                    "Dark desktop title text must match dark --color-text-secondary"
                ).to.eq(expectedDarkTitleText);
            }
        });

        // Close floating window and verify cleanup
        cy.get(".windowFrame .wftButton.close").first().click({ force: true });
        cy.get(".windowFrame").should("not.exist");
    });

    it("verifies overlay and modal backdrop tokens resolve consistently across themes", () => {
        // Open a real modal dialog via MBDialog
        cy.window().then(win => {
            expect(win.MBDialog, "MBDialog system should exist").to.exist;
            win.MBDialog.alert("Modal backdrop cascade verification", "Modal Title");
        });

        cy.get(".mb-dialog-overlay").should("exist");
        cy.get(".windowFrame.mb-system-dialog").should("be.visible");

        // Verify Light Mode modal panel and backdrop computed styles against design tokens
        cy.window().should(win => {
            const overlayEl = win.document.querySelector(".mb-dialog-overlay");
            const panelEl = win.document.querySelector(".windowFrame.mb-system-dialog .wfbWidget");
            expect(overlayEl, "Overlay backdrop element should exist").to.exist;
            expect(panelEl, "Modal panel element should exist").to.exist;

            const expectedBackdrop = resolveTokenColor(win, "--color-overlay-backdrop");
            const expectedPanelBg = resolveTokenColor(win, "--color-panel-bg", panelEl);

            expect(
                win.getComputedStyle(overlayEl).backgroundColor,
                "Overlay backdrop must match --color-overlay-backdrop in light mode"
            ).to.eq(expectedBackdrop);
            expect(
                win.getComputedStyle(panelEl).backgroundColor,
                "Modal panel bg must match --color-panel-bg in light mode"
            ).to.eq(expectedPanelBg);
        });

        // Switch to Dark Mode while modal is open
        cy.window().then(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            activity.themeBox.dark_onclick();
        });

        cy.get("body").should("have.class", "dark");

        // Verify Dark Mode modal panel and backdrop computed styles against updated design tokens
        cy.window().should(win => {
            const overlayEl = win.document.querySelector(".mb-dialog-overlay");
            const panelEl = win.document.querySelector(".windowFrame.mb-system-dialog .wfbWidget");

            const darkExpectedBackdrop = resolveTokenColor(win, "--color-overlay-backdrop");
            const darkExpectedPanelBg = resolveTokenColor(win, "--color-panel-bg", panelEl);

            expect(
                win.getComputedStyle(overlayEl).backgroundColor,
                "Overlay backdrop must match --color-overlay-backdrop in dark mode"
            ).to.eq(darkExpectedBackdrop);
            expect(
                win.getComputedStyle(panelEl).backgroundColor,
                "Modal panel bg must match --color-panel-bg in dark mode"
            ).to.eq(darkExpectedPanelBg);
        });

        // Close the modal dialog and verify cleanup
        cy.get(".windowFrame.mb-system-dialog .wftButton.close").first().click({ force: true });
        cy.get(".mb-dialog-overlay").should("not.exist");
    });

    it("verifies widget window titlebar cascade under mobile viewport breakpoint", () => {
        cy.viewport(400, 700);
        cy.window().then(win => {
            expect(win.widgetWindows, "widgetWindows manager should exist").to.exist;
            win.widgetWindows.windowFor({}, "status", "status", true);
        });

        cy.get(".windowFrame", { timeout: 30000 }).should("be.visible");

        // Switch to Dark Mode on mobile
        cy.window().then(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            activity.themeBox.dark_onclick();
        });

        cy.get("body").should("have.class", "dark");

        // Under mobile dark mode, .wftTitle matches --color-widget-titlebar-text
        cy.window().should(win => {
            const windowFrame = win.document.querySelector(".windowFrame");
            expect(windowFrame).to.exist;
            const titleEl = windowFrame.querySelector(".wftTitle");
            if (titleEl) {
                const expectedMobileDarkTitle = resolveTokenColor(
                    win,
                    "--color-widget-titlebar-text",
                    windowFrame
                );
                expect(
                    win.getComputedStyle(titleEl).color,
                    "Mobile dark title text must match --color-widget-titlebar-text"
                ).to.eq(expectedMobileDarkTitle);
            }
        });

        // Close floating window and restore desktop viewport
        cy.get(".windowFrame .wftButton.close").first().click({ force: true });
        cy.get(".windowFrame").should("not.exist");
        cy.viewport(1400, 1000);
    });

    it("verifies search suggestion cascade rules consume design tokens without specificity leakage", () => {
        // Open search through palette
        cy.contains("#palette tbody tr", "Search").click();
        cy.get("#search").should("be.visible");
        cy.focused().should("have.id", "search").type("forward");
        cy.get("ul.ui-autocomplete", { timeout: 10000 }).should("be.visible");

        // Verify Light Mode autocomplete suggestion dropdown computed styles against design tokens
        cy.window().should(win => {
            const autocompleteEl = win.document.querySelector("ul.ui-autocomplete");
            expect(autocompleteEl, "Autocomplete dropdown element should exist").to.exist;

            const expectedSearchBg = resolveTokenColor(win, "--color-bg-primary");
            const expectedSearchText = resolveTokenColor(win, "--color-text-primary");

            const computed = win.getComputedStyle(autocompleteEl);
            expect(
                computed.backgroundColor,
                "Autocomplete dropdown bg must match --color-bg-primary in light mode"
            ).to.eq(expectedSearchBg);
            expect(
                computed.color,
                "Autocomplete dropdown text color must match --color-text-primary in light mode"
            ).to.eq(expectedSearchText);
        });

        // Switch to Dark Mode while autocomplete is open
        cy.window().then(win => {
            const activity = win.ActivityContext
                ? win.ActivityContext.getActivity()
                : win.globalActivity;
            activity.themeBox.dark_onclick();
        });

        cy.get("body").should("have.class", "dark");

        // Verify Dark Mode autocomplete suggestion dropdown computed styles against design tokens
        cy.window().should(win => {
            const autocompleteEl = win.document.querySelector("ul.ui-autocomplete");
            const expectedDarkSearchBg = resolveTokenColor(win, "--color-bg-primary");
            const expectedDarkSearchText = resolveTokenColor(win, "--color-text-primary");

            const computed = win.getComputedStyle(autocompleteEl);
            expect(
                computed.backgroundColor,
                "Autocomplete dropdown bg must match --color-bg-primary in dark mode"
            ).to.eq(expectedDarkSearchBg);
            expect(
                computed.color,
                "Autocomplete dropdown text color must match --color-text-primary in dark mode"
            ).to.eq(expectedDarkSearchText);
        });

        // Dismiss search widget and autocomplete
        cy.get("#search").clear().type("{esc}");
        cy.get("body").type("{esc}");
    });
});
