/**
 * MusicBlocks v3.8.0
 *
 * @author SuspiciousChip
 *
 * @copyright 2026 SuspiciousChip
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/* global cy */

describe("Compact-screen editing", () => {
    beforeEach(() => {
        cy.viewport(375, 667);
        cy.visit("http://localhost:3000");
        cy.waitForAppReady();
        cy.get("body").then($body => {
            const tourClose = $body.find(".help-widget-frame .wftButton.close");
            if (tourClose.length) {
                cy.wrap(tourClose).click({ force: true });
            }
        });
    });

    it("switches between Play and Edit without losing workspace blocks", () => {
        cy.get("body").should("have.class", "play-only");
        cy.get("#palette").should("not.be.visible");
        cy.get("#showHideBlocksButton").should("not.be.visible");
        cy.get("#expandCollapseBlocksButton").should("not.be.visible");
        cy.get("#decreaseBlockSizeButton").should("not.be.visible");
        cy.get("#increaseBlockSizeButton").should("not.be.visible");
        cy.get("#compactModeToggle")
            .should("be.visible")
            .and("have.text", "edit")
            .and("not.have.attr", "aria-pressed");
        cy.get("#compactModeToggle").click();

        cy.get("body").should("have.class", "compact-edit").and("not.have.class", "play-only");
        cy.get("#palette").should("be.visible");
        cy.get("#showHideBlocksButton").should("be.visible");
        cy.get("#PaletteBody_items").should("not.exist");
        cy.get("#palette tr").contains("Rhythm").click();
        cy.get("#PaletteBody_items").should("be.visible");
        cy.get("#accessibleBlocks").then($container => {
            const initialCount = $container.find('[aria-label="silence block"]').length;
            cy.get('#PaletteBody_items [role=button][aria-label="rest2"]')
                .find("img")
                .then($img => {
                    const rect = $img[0].getBoundingClientRect();
                    const x = rect.left + 20;
                    const y = rect.top + 20;
                    cy.window().then(win => {
                        const start = new win.Touch({
                            identifier: 1,
                            target: $img[0],
                            clientX: x,
                            clientY: y
                        });
                        const end = new win.Touch({
                            identifier: 1,
                            target: $img[0],
                            clientX: 215,
                            clientY: 190
                        });
                        // Cypress does not dispatch synthetic touchstart to this DOM0 handler.
                        $img[0].ontouchstart(
                            new win.TouchEvent("touchstart", { touches: [start] })
                        );
                        win.document.dispatchEvent(
                            new win.TouchEvent("touchmove", { touches: [end] })
                        );
                        win.document.dispatchEvent(new win.TouchEvent("touchend"));
                    });
                });

            cy.get('#accessibleBlocks [aria-label="silence block"]').should(
                "have.length.greaterThan",
                initialCount
            );
        });

        cy.get('#accessibleBlocks [aria-label="silence block"]')
            .last()
            .invoke("attr", "id")
            .then(blockId => {
                cy.get("#compactModeToggle")
                    .should("have.text", "Play")
                    .and("not.have.attr", "aria-pressed");
                cy.get("#compactModeToggle").click();
                cy.get("body").should("have.class", "play-only");
                cy.get("#palette").should("not.be.visible");
                cy.get(`#${blockId}`).should("exist");
                cy.get("#compactModeToggle").click();
                cy.get("body").should("have.class", "compact-edit");
                cy.get(`#${blockId}`).should("exist");
            });

        cy.document().should(doc => {
            expect(doc.documentElement.scrollWidth).to.be.at.most(doc.defaultView.innerWidth);
        });
    });

    it("returns to Play after expanding to desktop and shrinking again", () => {
        cy.get("#compactModeToggle").click();
        cy.get("body").should("have.class", "compact-edit");
        cy.get("#palette tr").contains("Rhythm").click();
        cy.get("#PaletteBody").should("be.visible");

        cy.viewport(1200, 900);
        cy.get("body").should("not.have.class", "compact-screen");
        cy.get("#compactModeToggle").should("not.be.visible");
        cy.get("#palette").should("be.visible");
        cy.get("#PaletteBody").should("be.visible");

        cy.viewport(375, 667);
        cy.get("body").should("have.class", "play-only");
        cy.get("#compactModeToggle").should("have.text", "edit");
        cy.get("#palette").should("not.be.visible");
        cy.get("#PaletteBody").should("not.exist");
        cy.window().then(win => {
            const palettes = win.ActivityContext.getActivity().palettes;
            expect(palettes.activePalette).to.be.null;
            expect(palettes.lastActivePalette).to.equal("rhythm");
        });
    });

    it("keeps the palette toggle accessible while its contents scroll", () => {
        cy.get("#compactModeToggle").click();
        cy.get("#palette > div:first-child")
            .scrollTo("bottom")
            .should($list => {
                expect($list[0].scrollTop).to.be.greaterThan(0);
            });

        cy.get("#paletteToggle").click();
        cy.get("#paletteToggle").should("be.visible").and("have.attr", "aria-expanded", "false");
        cy.get("#paletteToggle").click();
        cy.get("#paletteToggle").should("have.attr", "aria-expanded", "true");
    });

    it("keeps editor controls hidden while Planet hides the workspace", () => {
        cy.get("#buttoncontainerBOTTOM").invoke("css", "display", "none").should("not.be.visible");
        cy.get("#buttoncontainerBOTTOM")
            .invoke("css", "display", "block")
            .should("have.css", "display", "flex");

        cy.get("#compactModeToggle").click();
        cy.get("#buttoncontainerBOTTOM").invoke("css", "display", "none").should("not.be.visible");
        cy.get("#buttoncontainerBOTTOM")
            .invoke("css", "display", "block")
            .should("have.css", "display", "flex");
    });

    it("closes the block context wheel when entering Play", () => {
        cy.get("#compactModeToggle").click();
        cy.window().then(win => {
            win._contextWheelIgnoreNextClick = true;
            win.document.getElementById("contextWheelDiv").style.display = "block";
        });

        cy.get("#compactModeToggle").click();
        cy.get("#contextWheelDiv").should($wheel => {
            expect($wheel[0].style.display).to.equal("none");
        });
        cy.get("#contextWheelDiv")
            .invoke("css", "display", "block")
            .should("have.css", "display", "none");
    });

    it("translates the mode actions on startup and language changes", () => {
        cy.visit("http://localhost:3000", {
            onBeforeLoad(win) {
                win.localStorage.setItem("languagePreference", "es");
            }
        });
        cy.waitForAppReady();

        cy.get("#compactModeToggle").should("have.text", "editar").click();
        cy.get("#compactModeToggle").should("have.text", "Tocar");
        cy.window().then(win => win.i18next.changeLanguage("fr"));
        cy.get("#compactModeToggle").should("have.text", "Jouer").click();
        cy.get("#compactModeToggle").should("have.text", "modifier");
    });
});
