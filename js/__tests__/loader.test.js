/**
 * @jest-environment jsdom
 */

describe('loader.js', () => {
    let mockI18next;

    beforeEach(() => {
        // Clear the module cache so we can re-require the loader for each test
        jest.resetModules();

        // 1. Mock RequireJS global functions
        window.requirejs = jest.fn((deps, callback) => {
            // This simulates RequireJS loading i18next and calling the main function
            if (callback) callback(mockI18next, {});
        });
        window.requirejs.config = jest.fn();

        // 2. Mock i18next with all methods used in loader.js
        mockI18next = {
            use: jest.fn().mockReturnThis(),
            init: jest.fn((config, cb) => cb(null)),
            t: jest.fn((key) => `translated_${key}`),
            changeLanguage: jest.fn((lng, cb) => cb(null)),
            on: jest.fn(),
            language: 'en'
        };

        // 3. Set up a mock DOM with elements to translate
        document.body.innerHTML = `
            <div data-i18n="test_title">Original Title</div>
            <button data-i18n="test_button">Original Button</button>
        `;

        // Mock console.error to check for error coverage
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should configure requirejs with correct paths and baseUrl', () => {
        require('../loader.js');
        expect(window.requirejs.config).toHaveBeenCalledWith(expect.objectContaining({
            baseUrl: "lib",
            paths: expect.any(Object)
        }));
    });

    test('should translate DOM elements when main() runs', async () => {
        require('../loader.js');
        
        // Wait for async main() and Promises to resolve
        await new Promise(resolve => setTimeout(resolve, 0));

        const title = document.querySelector('[data-i18n="test_title"]');
        expect(title.textContent).toBe('translated_test_title');
    });

    test('should log an error if i18next init fails (for 100% coverage)', async () => {
        // Simulate an initialization error
        mockI18next.init = jest.fn((config, cb) => cb('Init Error'));
        
        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(console.error).toHaveBeenCalledWith("i18next init failed:", 'Init Error');
    });

    test('should log an error if changeLanguage fails (for 100% coverage)', async () => {
        // Simulate a language change error
        mockI18next.changeLanguage = jest.fn((lng, cb) => cb('Change Error'));
        
        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(console.error).toHaveBeenCalledWith("Error changing language:", 'Change Error');
    });

    test('should listen for languageChanged events', async () => {
        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(mockI18next.on).toHaveBeenCalledWith("languageChanged", expect.any(Function));
    });
});