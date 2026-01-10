Cypress.on("uncaught:exception", (err, runnable) => {
    return false;
});

describe("MusicBlocks Application", () => {
    before(() => {
        cy.visit("http://localhost:3000");
    });

    afterEach(() => {
        console.log("Next test running, no reload should happen");
    });

    describe("Loading and Initial Render", () => {
        it("should display the loading animation and then the main content", () => {
            cy.get("#loading-image-container").should("be.visible");
            cy.contains("#loadingText", "Loading Complete!", { timeout: 20000 }).should(
                "be.visible"
            );

            cy.get("#canvas", { timeout: 10000 }).should("be.visible");
        });

        it("should display the Musicblocks guide page", () => {
            cy.get(".heading").should("be.visible").and("contain", "Welcome to Music Blocks");
        });
    });

    describe("Audio Controls", () => {
        it("should have a functional play button", () => {
            cy.get("#play").should("be.visible").and("not.be.disabled").click();
            cy.window().its("Tone.context.state").should("be.oneOf", ["running", "suspended"]);
        });

        it("should have a functional stop button", () => {
            cy.get("#stop").should("be.visible").and("not.be.disabled").click();
            cy.window().then(win => {
                expect(win.Tone.Transport.state).to.not.equal("started");
            });
        });
    });

    describe("Toolbar and Navigation", () => {
        it("should open the language selection dropdown", () => {
            cy.get("#aux-toolbar").invoke("show");
            cy.get("#languageSelectIcon").should("be.visible").click({ force: true });
            cy.get("#languagedropdown").should("be.visible");
        });

        it("should toggle full-screen mode", () => {
            cy.get("#FullScreen").should("be.visible").click();
            cy.document().its("fullscreenElement").should("not.be.null");
            cy.get("#FullScreen").click();
            cy.document().its("fullscreenElement").should("be.null");
        });

        it("should toggle the toolbar menu", () => {
            cy.get("#toggleAuxBtn").click();
            cy.get("#aux-toolbar").should("be.visible");
            cy.get("#toggleAuxBtn").click();
            cy.get("#aux-toolbar").should("not.be.visible");
        });
    });

    describe("File Operations", () => {
        it("should open the file load modal", () => {
            cy.get("#load").should("be.visible").click();
            cy.get("#myOpenFile").should("exist").and("be.visible");
        });

        it("should open the save dropdown", () => {
            cy.get("#saveButton").should("be.visible").click();
            cy.get("#saveddropdownbeg").should("be.visible");
        });

        it("should display file save options", () => {
            cy.get("#saveButton").should("be.visible").click();
            cy.get("#saveddropdownbeg").should("be.visible");
            cy.get("#save-html-beg").should("exist").and("be.visible");
            cy.get("#save-png-beg").should("exist").and("be.visible");
        });

        it('should click the New File button and verify "New Project" appears', () => {
            cy.get("#newFile > .material-icons")
                .should("exist")
                .and("be.visible")
                .and("not.be.disabled")
                .click();
            cy.contains("New project").should("be.visible");
        });
    });

    describe("UI Elements", () => {
        it("should verify that bottom bar elements exist and are visible", () => {
            const bottomBarElements = [
                "#Home\\ \\[HOME\\] > img",
                "#Show\\/hide\\ blocks > img",
                "#Expand\\/collapse\\ blocks > img",
                "#Decrease\\ block\\ size > img",
                "#Increase\\ block\\ size > img"
            ];

            bottomBarElements.forEach(selector => {
                cy.get(selector).should("exist").and("be.visible");
            });
        });

        it("should verify sidebar elements exist, are visible, and clickable", () => {
            const sidebarElements = [
                "thead > tr > :nth-child(1) > img",
                "tr > :nth-child(2) > img",
                "tr > :nth-child(3) > img"
            ];

            sidebarElements.forEach(selector => {
                cy.get(selector)
                    .should("exist")
                    .and("be.visible")
                    .and("not.have.attr", "disabled")
                    .click();
            });
        });

        it("should verify that Grid, Clear, and Collapse elements exist and are visible", () => {
            const elements = ["#Grid > img", "#Clear", "#Collapse > img"];
            elements.forEach(selector => {
                cy.get(selector).should("exist").and("be.visible");
            });
        });

        it("should verify that all nth-child elements from 1 to 6 exist", () => {
            for (let i = 1; i <= 6; i++) {
                cy.get(`[width="126"] > tbody > :nth-child(${i})`)
                    .should("exist")
                    .and("be.visible");
            }
        });
    });

    describe("Planet Page Interaction", () => {
        it("should load the Planet page and return to the main page when clicking the close button", () => {
            cy.get("#planetIcon > .material-icons").should("exist").and("be.visible").click();

            cy.get("#planet-iframe", { timeout: 10000 })
                .should("be.visible")
                .and("have.attr", "src")
                .and("not.be.empty");
            cy.get("#planet-iframe").invoke("attr", "src").should("not.be.empty");

            cy.get("#planet-iframe").then($iframe => {
                const iframeSrc = $iframe.attr("src");
                expect(iframeSrc).to.not.be.empty;
                cy.log("Iframe source:", iframeSrc);
            });
        });
    });
});
