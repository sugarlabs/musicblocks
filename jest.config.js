module.exports = {
    testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).[jt]s?(x)'],
    clearMocks: true,
    moduleFileExtensions: ['js', 'json', 'node'],
    testEnvironment: 'jsdom',
    transform: {
      '^.+\\.jsx?$': 'babel-jest', 
      },
      transformIgnorePatterns: [
        '/node_modules/(?!(tone)/)', 
      ],
      setupFiles: ['./jest.setup.js'],
};
