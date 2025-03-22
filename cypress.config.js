const { defineConfig } = require("cypress");

module.exports = defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            // implement node event listeners here
        },
        viewportWidth: 1400,
        viewportHeight: 1000,
        testIsolation: false
    },
});
