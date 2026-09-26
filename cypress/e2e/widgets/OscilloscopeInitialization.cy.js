// cypress/e2e/widgets/OscilloscopeInitialization.cy.js
describe("Oscilloscope Widget Initialization", () => {
    beforeEach(() => {
        cy.visit("/");
        cy.waitForAppReady();
    });

    it("initializes cleanly and renders the canvas", () => {
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();

            // Prepare minimal deterministic Oscilloscope dependencies
            activity.logo.oscilloscopeTurtles = [
                {
                    inTrash: false,
                    running: false,
                    painter: { _canvasColor: "#ff0000" }
                }
            ];

            // Safely stub the method on the existing object instead of overwriting activity.turtles
            cy.stub(activity.turtles, "getIndexOfTurtle").returns(0);

            // The global instruments object might already exist, so we populate it safely
            win.instruments = win.instruments || {};
            win.instruments[0] = {
                mockSynth: { connect: cy.stub() }
            };

            return new Cypress.Promise((resolve, reject) => {
                win.require(
                    ["widgets/oscilloscope"],
                    () => {
                        try {
                            const Oscilloscope = win.eval(
                                'typeof Oscilloscope !== "undefined" ? Oscilloscope : null'
                            );
                            if (!Oscilloscope) {
                                throw new Error("Oscilloscope class not found after require");
                            }

                            const widget = new Oscilloscope(activity);

                            expect(widget.widgetWindow).to.exist;

                            const canvas = win.document.querySelector(".oscilloscopeCanvas");
                            expect(canvas).to.exist;
                            expect(canvas.width).to.be.greaterThan(0);
                            expect(canvas.height).to.be.greaterThan(0);

                            widget.close();

                            expect(win.document.querySelector(".oscilloscopeCanvas")).to.not.exist;

                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    },
                    reject
                );
            });
        });
    });
});
