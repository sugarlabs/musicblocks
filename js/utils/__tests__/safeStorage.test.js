// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * @jest-environment jsdom
 */

describe("safeStorage", () => {
    let safeStorage;

    beforeEach(() => {
        jest.resetModules();
        localStorage.clear();
        safeStorage = require("../safeStorage");
        safeStorage._resetMemFallback();
    });

    it("should set and get a value via native localStorage", () => {
        safeStorage.setItem("key1", "value1");

        expect(localStorage.getItem("key1")).toBe("value1");
        expect(safeStorage.getItem("key1")).toBe("value1");
    });

    it("should fall back to in-memory store on QuotaExceededError", () => {
        const quotaError = new DOMException("quota exceeded", "QuotaExceededError");
        const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw quotaError;
        });
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

        safeStorage.setItem("key2", "value2");

        expect(warnSpy).toHaveBeenCalledWith(
            expect.stringContaining("QuotaExceededError")
        );

        // Native localStorage should not contain the value
        spy.mockRestore();
        expect(localStorage.getItem("key2")).toBeNull();

        // But safeStorage should return it from memory
        expect(safeStorage.getItem("key2")).toBe("value2");

        warnSpy.mockRestore();
    });

    it("should re-throw non-quota errors from setItem", () => {
        const securityError = new DOMException("blocked", "SecurityError");
        jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw securityError;
        });

        expect(() => safeStorage.setItem("key3", "value3")).toThrow("blocked");

        jest.restoreAllMocks();
    });

    it("should return null for unknown keys", () => {
        expect(safeStorage.getItem("nonexistent")).toBeNull();
    });

    it("should remove a key from both native and memory stores", () => {
        safeStorage.setItem("key4", "value4");
        expect(safeStorage.getItem("key4")).toBe("value4");

        safeStorage.removeItem("key4");
        expect(safeStorage.getItem("key4")).toBeNull();
        expect(localStorage.getItem("key4")).toBeNull();
    });

    it("should clear both native and in-memory stores", () => {
        safeStorage.setItem("a", "1");
        safeStorage.setItem("b", "2");

        // Force one into memory fallback
        const quotaError = new DOMException("quota exceeded", "QuotaExceededError");
        jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw quotaError;
        });
        jest.spyOn(console, "warn").mockImplementation(() => {});
        safeStorage.setItem("c", "3");
        jest.restoreAllMocks();

        expect(safeStorage.getItem("c")).toBe("3");

        safeStorage.clear();

        expect(safeStorage.getItem("a")).toBeNull();
        expect(safeStorage.getItem("b")).toBeNull();
        expect(safeStorage.getItem("c")).toBeNull();
    });

    it("should handle getItem when native localStorage throws", () => {
        // Put value in memory fallback first
        const quotaError = new DOMException("quota exceeded", "QuotaExceededError");
        jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw quotaError;
        });
        jest.spyOn(console, "warn").mockImplementation(() => {});
        safeStorage.setItem("memKey", "memVal");
        jest.restoreAllMocks();

        // Now make getItem throw too
        jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("storage unavailable");
        });

        // Should fall back to memory
        expect(safeStorage.getItem("memKey")).toBe("memVal");

        jest.restoreAllMocks();
    });
});
