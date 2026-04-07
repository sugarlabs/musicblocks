Cypress.on("uncaught:exception", err => {
    const ignored = [
        "ResizeObserver loop limit exceeded",
        "Cannot read properties of undefined (reading 'postMessage')",
        "_ is not defined",
        "Permissions check failed"
    ];
    return !ignored.some(msg => err.message.includes(msg));
});

describe("MusicBlocks Application", () => {
    before(() => {
        cy.visit("http://localhost:3000");
        cy.waitForAppReady();
    });

    describe("Loading and Initial Render", () => {
        it("should display the loading animation container", () => {
            cy.get("#loading-image-container").should("exist");
        });

        it("should display the canvas after loading", () => {
            cy.get("#canvas").should("be.visible");
        });

        it("should display the Musicblocks guide page", () => {
            cy.get(".heading").contains("Welcome to Music Blocks");
        });
    });

    describe("Audio Controls", () => {
        it("should have a functional play button", () => {
            cy.get("#play").should("be.visible").click();
            cy.window().then(win => {
                const audioContext = win.Tone.context;
                cy.wrap(audioContext.state).should("eq", "running");
            });
        });

        it("should have a functional stop button", () => {
            cy.get("#stop").should("be.visible").click();
        });
    });

    describe("Toolbar and Navigation", () => {
        it("should open the language selection dropdown", () => {
            cy.get("#aux-toolbar").invoke("show");
            cy.get("#languageSelectIcon").click();
            cy.get("#languagedropdown").should("be.visible");
        });

        it("should verify fullscreen button exists and is visible", () => {
            cy.get("#FullScreen").should("exist").and("be.visible");
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
            cy.get("#load").click();
            cy.get("#myOpenFile").should("exist");
        });

        it("should open the save dropdown", () => {
            cy.get("#saveButton").click();
            cy.get("#saveddropdownbeg").should("be.visible");
        });

        it("should display all file save options", () => {
            cy.get("#saveddropdownbeg").should("be.visible");
            cy.get("#save-html-beg").should("exist");
            cy.get("#save-png-beg").should("exist");
        });

        it("should show New Project dialog on new file click", () => {
            cy.get("#newFile > .material-icons").should("exist").and("be.visible").click();
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
                cy.get(selector).should("exist").and("be.visible").click();
            });
        });

        it("should verify that Grid, Clear, and Collapse elements exist and are visible", () => {
            const elements = ["#Grid > img", "#Clear", "#Collapse > img"];
            elements.forEach(selector => {
                cy.get(selector).should("exist").and("be.visible");
            });
        });

        it("should verify that all palette rows exist and are visible", () => {
            for (let i = 1; i <= 6; i++) {
                cy.get(`[width="126"] > tbody > :nth-child(${i})`)
                    .should("exist")
                    .and("be.visible");
            }
        });
    });

    describe("Planet Page Interaction", () => {
        it("should open the Planet iframe on planet icon click", () => {
            cy.get("#planetIcon > .material-icons").should("exist").and("be.visible").click();

            cy.get("#planet-iframe", { timeout: 10000 })
                .should("be.visible")
                .and("have.attr", "src")
                .and("not.be.empty");

            cy.window().then(win => {
                const activity = win.ActivityContext?.getActivity();
                if (activity?.planet) {
                    activity.planet.closePlanet();
                }
            });

            cy.get("#planet-iframe").should("not.be.visible");
            cy.get("#canvas").should("exist").and("be.visible");
        });
    });

    describe("Core Workflows", () => {
        it("should transition audio context correctly on play and stop", () => {
            cy.get("#play").click();

            cy.window().then(win => {
                const ctx = win.Tone.context;
                expect(ctx.state).to.eq("running");
            });

            cy.get("#stop").click();

            cy.window().then(win => {
                const ctx = win.Tone.context;
                expect(ctx.state === "suspended" || ctx.state === "running").to.be.true;
            });

            cy.get("#canvas").should("exist").and("be.visible");
        });
    });
});
