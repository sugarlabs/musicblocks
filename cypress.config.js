const { defineConfig } = require("cypress");

module.exports = defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
        viewportWidth: 1400,
        viewportHeight: 1000,
        testIsolation: false,
        // Re-run a failed spec up to twice in CI before reporting failure.
        // The E2E suite drives real audio/Tone.js state transitions whose
        // timing depends on the CI runner's load, so an occasional slow
        // transition should not red the whole job. Interactive runs are not
        // retried so local failures stay visible immediately.
        retries: { runMode: 2, openMode: 0 }
    }
});
