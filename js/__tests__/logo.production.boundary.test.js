/**
 * Regression tests for production boundary enforcement in logo.js
 *
 * Background: A Jest lifecycle hook (afterAll) leaked into logo.js —
 * a core production runtime file — causing browser startup crashes:
 *   "afterAll is not defined"
 *   "Logo is not defined"
 *
 * These tests scan the source code of logo.js directly to ensure
 * Jest globals never appear in production files.
 *
 * Related fix: PR #6451
 *
 * @author Sapna Choudhary <sapnachoudhary8269@gmail.com>
 */

"use strict";

const fs = require("fs");
const path = require("path");

// logo.js is at js/logo.js
// this test file is at js/__tests__/
// so go one level up from __dirname
const logoPath = path.resolve(__dirname, "..", "logo.js");

describe("logo.js production boundary — regression tests for PR #6451", () => {
    test("logo.js source file exists and is readable", () => {
        expect(fs.existsSync(logoPath)).toBe(true);
    });

    test("logo.js does not contain afterAll", () => {
        const source = fs.readFileSync(logoPath, "utf8");
        expect(source).not.toMatch(/\bafterAll\b/);
    });

    test("logo.js does not contain beforeAll", () => {
        const source = fs.readFileSync(logoPath, "utf8");
        expect(source).not.toMatch(/\bbeforeAll\b/);
    });

    test("logo.js does not contain afterEach", () => {
        const source = fs.readFileSync(logoPath, "utf8");
        expect(source).not.toMatch(/\bafterEach\b/);
    });

    test("logo.js does not contain beforeEach", () => {
        const source = fs.readFileSync(logoPath, "utf8");
        expect(source).not.toMatch(/\bbeforeEach\b/);
    });
});
