// Karma configuration for all the tests

sharedConfig = require("./karma-shared.conf.js");

module.exports = function (config) {
    var testFiles = [
        {
            pattern: 'test/**/*Spec.js',
            included: false
        }
    ];

    sharedConfig(config);

    config.files = config.files.concat(testFiles);
};
