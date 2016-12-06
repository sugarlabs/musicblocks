// Karma configuration
// Generated on Mon May 13 2013 10:01:17 GMT-0300 (ART)


// list of files / patterns to load in the browser
module.exports = function (config) {
    config.set({
        frameworks: ['jasmine', 'requirejs'],


        // base path, that will be used to resolve files and exclude
        basePath: '..',


        files: [
            'test/loader.js',
            {
                pattern: 'lib/**/*.js',
                included: false
            }, {
                pattern: '*.js',
                included: false
            }, {
                pattern: 'activity/**/*.js',
                included: false
            }, {
                pattern: 'graphics/**/*',
                included: false
            }
        ],


        // list of files to exclude
        exclude: [],


        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit'
        reporters: ['progress'],


        // web server port
        port: 9876,


        // cli runner port
        runnerPort: 9100,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO ||
        // LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file
        // changes
        autoWatch: true,


        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 60000,


        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false,

        preprocessors: {}
    });
};
