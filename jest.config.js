module.exports = {
    // Use jsdom to simulate a browser environment
    testEnvironment: 'jest-environment-jsdom',

    // Specify where Jest should look for test files
    testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],

    // Transform JavaScript files using Babel (if needed)
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
    },

    // Clear mocks between tests for isolation
    clearMocks: true,

    // Collect coverage information and specify the directory
    collectCoverage: true,
    coverageDirectory: 'coverage',

    // Specify file extensions Jest will process
    moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

    // Define any global variables for the tests
    globals: {
        'window': {},
    },
    // Set up files to run before tests (e.g., polyfills, setup scripts)
    setupFiles: ['./jest.setup.js'], // Optional, if you have a setup file
};
