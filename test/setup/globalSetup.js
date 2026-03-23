function setupGlobalEnvironment() {
    global.localStorage = { kanaPreference: "default" };
}

module.exports = { setupGlobalEnvironment };
