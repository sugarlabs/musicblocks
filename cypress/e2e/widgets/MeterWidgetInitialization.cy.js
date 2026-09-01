// cypress/e2e/widgets/MeterWidgetInitialization.cy.js
describe("MeterWidget Defensive Initialization", () => {
    beforeEach(() => {
        cy.visit("/");
        cy.waitForAppReady();
    });
    it("Should clamp zero/negative beats and prevent wheelnav crash", () => {
        cy.window().then(win => {
            const activity = win.ActivityContext.getActivity();
            const logo = activity.logo;
            const blocks = activity.blocks;

            // Generate a mock meter block
            const meterBlockId = blocks.blockList.length;
            blocks.blockList.push({
                name: "meter",
                connections: [null, null, null, null],
                value: 4,
                offScreen: () => false,
                trash: false
            });

            // Generate a mock number block with an invalid zero value
            const numberBlockId = blocks.blockList.length;
            blocks.blockList.push({
                name: "number",
                connections: [null],
                value: 0,
                offScreen: () => false,
                trash: false
            });

            // Connect the number block to the meter block's beat count input
            blocks.blockList[meterBlockId].connections[1] = numberBlockId;
            blocks.blockList[numberBlockId].connections[0] = meterBlockId;

            logo._meterBlock = meterBlockId;

            return new Cypress.Promise((resolve, reject) => {
                win.require(["widgets/meterwidget"], () => {
                    try {
                        // Initialize the widget
                        if (win.widgetWindows.openWindows["meter"]) {
                            win.widgetWindows.openWindows["meter"].destroy();
                        }
                        const MeterWidget = win.eval(
                            'typeof MeterWidget !== "undefined" ? MeterWidget : null'
                        );
                        if (!MeterWidget) throw new Error("MeterWidget not loaded");
                        const meterWidget = new MeterWidget(activity, meterBlockId);

                        // Assert the DOM inputs were clamped to the minimum valid value (1)
                        const beatValueInput = meterWidget.widgetWindow._toolbar.querySelector(
                            'input[type="number"][min="1"][max="16"]'
                        );
                        expect(beatValueInput.value).to.equal("1");

                        // Assert the pie wheel container was generated (meaning no crash occurred)
                        const meterWheelDiv = win.document.getElementById("meterWheelDiv");
                        expect(meterWheelDiv.style.display).to.equal("flex");
                        resolve();
                    } catch (err) {
                        // If wheelnav crashes, the test explicitly fails
                        reject(new Error(`Widget crashed during initialization: ${err.message}`));
                    }
                });
            });
        });
    });
});
