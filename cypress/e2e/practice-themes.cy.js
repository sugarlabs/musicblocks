// Copyright (c) 2026 macayu17
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global cy, describe, beforeEach, it, expect */

const parseColor = color => color.match(/[\d.]+/g).map(Number);

const luminance = channels => {
    const linear = channels.slice(0, 3).map(channel => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};

const assertReadable = (selector, minimum = 4.5) => {
    cy.get(selector).should($elements => {
        const win = $elements[0].ownerDocument.defaultView;
        $elements.each((_, element) => {
            let background = [0, 0, 0];
            let transparency = 1;
            for (
                let surface = element;
                surface && transparency > 0;
                surface = surface.parentElement
            ) {
                const rgba = parseColor(win.getComputedStyle(surface).backgroundColor);
                const alpha = rgba[3] ?? 1;
                background = background.map((value, i) => value + rgba[i] * alpha * transparency);
                transparency *= 1 - alpha;
            }
            const foreground = luminance(parseColor(win.getComputedStyle(element).color));
            const backdrop = luminance(background);
            const contrast =
                (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05);
            expect(contrast, `${selector}: ${element.textContent.trim()}`).to.be.at.least(minimum);
        });
    });
};

describe("Practice panel themes", () => {
    beforeEach(() => {
        cy.visit("http://127.0.0.1:3000", {
            onBeforeLoad(win) {
                win.localStorage.clear();
                win.localStorage.setItem("themePreference", "light");
            }
        });
        cy.waitForAppReady();
        cy.waitForStylesheetsToLoad();
        cy.get(".windowFrame .wftButton.close").click({ multiple: true, force: true });
        cy.window().then(win => win.startPracticeMode());
        cy.get("#practice-panel").should("be.visible");
    });

    ["light", "dark", "highcontrast"].forEach(theme => {
        it(`keeps the overview, lesson cards and journal controls readable in ${theme}`, () => {
            cy.window().then(win => {
                win.ActivityContext.getActivity().themeBox[`${theme}_onclick`]();
            });
            assertReadable(".quest-title h3, .quest-title p, #practice-content > .story-card p");
            assertReadable(".practice-menu-header h3", 3);
            assertReadable("#close-practice, .practice-panel-collapse-toggle", 3);

            cy.get('.level-btn[data-level="1"]').click();
            assertReadable(".practice-description p, .practice-description h4, .reward-card li");
            cy.window().then(win => win.openExplorerJournal());
            cy.get("#explorer-journal-panel").should("be.visible");
            assertReadable(".practice-menu-header h3", 3);
            assertReadable("#close-explorer-journal, .practice-panel-collapse-toggle", 3);
        });
    });
});
