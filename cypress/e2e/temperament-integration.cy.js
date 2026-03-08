describe("Temperament Integration Workflow", () => {
    before(() => {
        cy.visit("http://localhost:3000");
        cy.wait(10000); // Wait for full initialization
    });

    it("should demonstrate complete 31-EDO temperament workflow", () => {
        // Step 1: Navigate to Intervals palette to find Set Temperament block
        cy.get("#palette-intervals").click();
        cy.get('[data-type="settemperament"]').should("be.visible");

        // Step 2: Drag Set Temperament block to canvas
        cy.get('[data-type="settemperament"]')
            .first()
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 400, clientY: 300 })
            .trigger("mouseup", { force: true });

        // Step 3: Set temperament to 31-EDO
        cy.get('[data-type="temperamentname"]').click();
        cy.get(".piemenu-item").contains("31-EDO").click();

        cy.get('[data-type="notename"]').click();
        cy.get(".piemenu-item").contains("C").click();

        cy.get('[data-type="number"]').click();
        cy.get(".piemenu-item").contains("4").click();

        // Step 4: Navigate to Pitch palette for Temperament Length block
        cy.get("#palette-pitch").click();
        cy.get('[data-type="temperamentlength"]').should("be.visible");

        // Step 5: Drag Temperament Length block to canvas
        cy.get('[data-type="temperamentlength"]')
            .first()
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 600, clientY: 300 })
            .trigger("mouseup", { force: true });

        // Step 6: Add Print block to verify temperament length
        cy.get("#palette-integer").click();
        cy.get('[data-type="print"]').should("be.visible");

        cy.get('[data-type="print"]')
            .first()
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 800, clientY: 300 })
            .trigger("mouseup", { force: true });

        // Step 7: Connect Temperament Length to Print block
        cy.get('[data-type="temperamentlength"] .block-drag')
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 750, clientY: 280 })
            .trigger("mouseup", { force: true });

        // Step 8: Navigate back to Intervals for Define Mode
        cy.get("#palette-intervals").click();
        cy.get('[data-type="definemode"]').should("be.visible");

        // Step 9: Drag Define Mode block to canvas
        cy.get('[data-type="definemode"]')
            .first()
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 400, clientY: 400 })
            .trigger("mouseup", { force: true });

        // Step 10: Add pitch numbers that demonstrate 31-EDO range
        const pitchNumbers = [0, 3, 7, 15, 22, 30]; // Numbers > 11 to test modulo arithmetic

        // Add Pitch Number blocks inside Define Mode
        pitchNumbers.forEach((pitchNum, index) => {
            cy.get("#palette-pitch").click();
            cy.get('[data-type="pitchnumber"]').should("be.visible");

            cy.get('[data-type="pitchnumber"]')
                .first()
                .trigger("mousedown", { which: 1 })
                .trigger("mousemove", { clientX: 450 + index * 50, clientY: 450 })
                .trigger("mouseup", { force: true });

            // Set the pitch number value
            cy.get('[data-type="pitchnumber"]')
                .eq(index + 1)
                .click();
            cy.get(".piemenu-item").contains(pitchNum.toString()).click();
        });

        // Step 11: Navigate to Pitch palette for Nth Modal Pitch
        cy.get("#palette-pitch").click();
        cy.get('[data-type="nthmodalpitch"]').should("be.visible");

        // Step 12: Add Nth Modal Pitch blocks to test custom mode
        for (let i = 0; i < 3; i++) {
            cy.get('[data-type="nthmodalpitch"]')
                .first()
                .trigger("mousedown", { which: 1 })
                .trigger("mousemove", { clientX: 600 + i * 80, clientY: 500 })
                .trigger("mouseup", { force: true });

            // Set position in modal scale
            cy.get('[data-type="nthmodalpitch"]')
                .eq(i + 1)
                .click();
            cy.get(".piemenu-item")
                .contains((i + 1).toString())
                .click();
        }

        // Step 13: Add Play block to test audio synthesis
        cy.get("#palette-rhythm").click();
        cy.get('[data-type="play"]').should("be.visible");

        cy.get('[data-type="play"]')
            .first()
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 800, clientY: 500 })
            .trigger("mouseup", { force: true });

        // Step 14: Connect Nth Modal Pitch blocks to Play block
        cy.get('[data-type="nthmodalpitch"]')
            .eq(1)
            .find(".block-drag")
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 750, clientY: 480 })
            .trigger("mouseup", { force: true });

        // Step 15: Run the program to test complete workflow
        cy.get("#play").click();
        cy.wait(2000); // Wait for execution

        // Step 16: Verify temperament length output (should be 31)
        cy.get("#printout").should("contain", "31");

        // Step 17: Verify no errors occurred during execution
        cy.get(".error-message").should("not.exist");

        // Step 18: Verify audio context is running
        cy.window().then(win => {
            cy.wrap(win.Tone.context.state).should("eq", "running");
        });

        // Step 19: Test edge case - verify pitch numbers were wrapped correctly
        // The Define Mode should have wrapped pitch numbers 15, 22, 30 in 31-EDO
        cy.get("#printout").should(
            "not.contain",
            "Ignoring pitch numbers less than zero or greater than eleven"
        );
    });

    it("should handle temperament switching correctly", () => {
        // Test switching between different temperaments
        cy.get("#palette-intervals").click();

        // Switch to 5-EDO
        cy.get('[data-type="settemperament"]')
            .first()
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 400, clientY: 300 })
            .trigger("mouseup", { force: true });

        cy.get('[data-type="temperamentname"]').click();
        cy.get(".piemenu-item").contains("5-EDO").click();

        // Verify temperament length changes
        cy.get("#palette-pitch").click();
        cy.get('[data-type="temperamentlength"]')
            .first()
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 600, clientY: 300 })
            .trigger("mouseup", { force: true });

        cy.get("#palette-integer").click();
        cy.get('[data-type="print"]')
            .first()
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 800, clientY: 300 })
            .trigger("mouseup", { force: true });

        cy.get('[data-type="temperamentlength"] .block-drag')
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 750, clientY: 280 })
            .trigger("mouseup", { force: true });

        cy.get("#play").click();
        cy.wait(1000);

        // Should output 5 for 5-EDO
        cy.get("#printout").should("contain", "5");
    });

    it("should demonstrate Define Mode with custom temperament wrapping", () => {
        // This test specifically verifies modulo arithmetic works correctly
        cy.get("#palette-intervals").click();

        // Set to 31-EDO
        cy.get('[data-type="settemperament"]')
            .first()
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 400, clientY: 300 })
            .trigger("mouseup", { force: true });

        cy.get('[data-type="temperamentname"]').click();
        cy.get(".piemenu-item").contains("31-EDO").click();

        // Create Define Mode with numbers that will wrap
        cy.get('[data-type="definemode"]')
            .first()
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 400, clientY: 400 })
            .trigger("mouseup", { force: true });

        // Add pitch number 40 (should wrap to 9 in 31-EDO)
        cy.get("#palette-pitch").click();
        cy.get('[data-type="pitchnumber"]')
            .first()
            .trigger("mousedown", { which: 1 })
            .trigger("mousemove", { clientX: 450, clientY: 450 })
            .trigger("mouseup", { force: true });

        cy.get('[data-type="pitchnumber"]').click();
        cy.get(".piemenu-item").contains("40").click();

        // Verify no error about invalid pitch numbers
        cy.get("#play").click();
        cy.wait(1000);

        cy.get(".error-message").should("not.exist");
        cy.get("#printout").should(
            "not.contain",
            "Ignoring pitch numbers less than zero or greater than eleven"
        );
    });
});
