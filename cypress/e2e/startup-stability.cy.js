describe("startup stability", () => {
    const startupRuns = 8;
    const startupTimeout = 60000;

    it("loads the app repeatedly without startup failures", () => {
        const consoleErrors = [];
        const pageErrors = [];
        const promiseRejections = [];
        const alerts = [];

        for (let i = 0; i < startupRuns; i++) {
            cy.visit(`http://127.0.0.1:3000/?startupRun=${i}`, {
                timeout: startupTimeout,
                onBeforeLoad(win) {
                    const originalConsoleError = win.console.error.bind(win.console);

                    win.console.error = (...args) => {
                        consoleErrors.push(args.map(String).join(" "));
                        originalConsoleError(...args);
                    };

                    win.addEventListener("error", event => {
                        pageErrors.push(event.message || "Unknown window error");
                    });

                    win.addEventListener("unhandledrejection", event => {
                        const reason = event.reason;
                        promiseRejections.push(
                            reason && reason.message ? reason.message : String(reason)
                        );
                    });

                    win.alert = message => {
                        alerts.push(String(message));
                    };
                }
            });

            cy.get("#hideContents", { timeout: startupTimeout }).should("be.visible");
            cy.get("#load-container", { timeout: startupTimeout }).should("not.be.visible");
            cy.get("#toolbars", { timeout: startupTimeout }).should("be.visible");
            cy.get("#myCanvas", { timeout: startupTimeout }).should("be.visible");

            cy.window({ timeout: startupTimeout }).then(win => {
                expect(win.createjs, `createjs should exist on run ${i + 1}`).to.exist;
                expect(win.i18next, `i18next should exist on run ${i + 1}`).to.exist;

                if (win.ActivityContext && typeof win.ActivityContext.getActivity === "function") {
                    expect(
                        win.ActivityContext.getActivity(),
                        `Activity singleton should exist on run ${i + 1}`
                    ).to.exist;
                }
            });

            cy.clearLocalStorage();
        }

        cy.then(() => {
            const startupConsoleErrors = consoleErrors.filter(message =>
                /(FATAL:|Core bootstrap failed|Failed to load Music Blocks|Main execution failed|Failed to load activity\/activity)/i.test(
                    message
                )
            );

            expect(startupConsoleErrors, "startup console errors").to.deep.equal([]);
            expect(pageErrors, "window errors").to.deep.equal([]);
            expect(promiseRejections, "unhandled promise rejections").to.deep.equal([]);
            expect(alerts, "unexpected startup alerts").to.deep.equal([]);
        });
    });
});
