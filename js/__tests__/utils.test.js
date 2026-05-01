/**
 * Tests for safe storage utilities in js/utils/utils.js
 */

const { safeGetItem, safeSetItem, safeRemoveItem } = require("../utils/utils");

describe("Safe Storage Helpers", () => {
    let originalLocalStorage;

    beforeEach(() => {
        originalLocalStorage = global.localStorage;
    });

    afterEach(() => {
        global.localStorage = originalLocalStorage;
    });

    describe("safeGetItem", () => {
        it("should return stored value when localStorage is available", () => {
            const mockStorage = { getItem: jest.fn(() => "storedValue") };
            Object.defineProperty(global, "localStorage", {
                value: mockStorage,
                writable: true
            });

            const result = safeGetItem("testKey", "default");
            expect(result).toBe("storedValue");
            expect(mockStorage.getItem).toHaveBeenCalledWith("testKey");
        });

        it("should return default value when key is not found", () => {
            const mockStorage = { getItem: jest.fn(() => null) };
            Object.defineProperty(global, "localStorage", {
                value: mockStorage,
                writable: true
            });

            const result = safeGetItem("missingKey", "default");
            expect(result).toBe("default");
        });

        it("should return default value when localStorage throws", () => {
            Object.defineProperty(global, "localStorage", {
                value: {
                    getItem: jest.fn(() => {
                        throw new Error("SecurityError");
                    })
                },
                writable: true
            });

            const result = safeGetItem("testKey", "default");
            expect(result).toBe("default");
        });
    });

    describe("safeSetItem", () => {
        it("should set value when localStorage is available", () => {
            const mockStorage = { setItem: jest.fn() };
            Object.defineProperty(global, "localStorage", {
                value: mockStorage,
                writable: true
            });

            safeSetItem("testKey", "testValue");
            expect(mockStorage.setItem).toHaveBeenCalledWith("testKey", "testValue");
        });

        it("should not throw when localStorage throws", () => {
            Object.defineProperty(global, "localStorage", {
                value: {
                    setItem: jest.fn(() => {
                        throw new Error("SecurityError");
                    })
                },
                writable: true
            });

            expect(() => safeSetItem("testKey", "testValue")).not.toThrow();
        });
    });

    describe("safeRemoveItem", () => {
        it("should remove item when localStorage is available", () => {
            const mockStorage = { removeItem: jest.fn() };
            Object.defineProperty(global, "localStorage", {
                value: mockStorage,
                writable: true
            });

            safeRemoveItem("testKey");
            expect(mockStorage.removeItem).toHaveBeenCalledWith("testKey");
        });

        it("should not throw when localStorage throws", () => {
            Object.defineProperty(global, "localStorage", {
                value: {
                    removeItem: jest.fn(() => {
                        throw new Error("SecurityError");
                    })
                },
                writable: true
            });

            expect(() => safeRemoveItem("testKey")).not.toThrow();
        });
    });
});
