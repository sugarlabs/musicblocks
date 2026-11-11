/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Sugar Labs
 */

const fs = require("fs");
const os = require("os");
const path = require("path");

const {
    countInText,
    scanDirectory,
    summarize,
    compareBaseline
} = require("../check-console-usage");

describe("check-console-usage", () => {
    describe("countInText", () => {
        it("counts direct console.log/debug/warn/error calls", () => {
            expect(countInText("console.log('a')")).toBe(1);
            expect(countInText("console.debug('a'); console.warn('b'); console.error('c');")).toBe(
                3
            );
        });

        it("tolerates whitespace between console, method, and paren", () => {
            expect(countInText("console . log ( 'a' )")).toBe(1);
        });

        it("ignores other console methods and non-calls", () => {
            expect(countInText("console.info('a'); console.table(rows);")).toBe(0);
            expect(countInText("console.log.bind(console)")).toBe(0);
            expect(countInText("myconsole.log('a')")).toBe(0);
        });
    });

    describe("scanDirectory", () => {
        it("skips __tests__ and non-JavaScript files", () => {
            const root = fs.mkdtempSync(path.join(os.tmpdir(), "mb-console-usage-"));

            try {
                fs.mkdirSync(path.join(root, "sub"));
                fs.mkdirSync(path.join(root, "__tests__"));
                fs.writeFileSync(
                    path.join(root, "a.js"),
                    "console.log('a');\nconsole.warn('b');\n"
                );
                fs.writeFileSync(path.join(root, "sub", "b.js"), "console.error('c');\n");
                fs.writeFileSync(
                    path.join(root, "__tests__", "c.test.js"),
                    "console.log('skip');\n"
                );
                fs.writeFileSync(path.join(root, "notes.txt"), "console.log('skip');\n");

                const results = scanDirectory(root);

                expect(results).toHaveLength(2);
                expect(summarize(results)).toBe(3);
            } finally {
                fs.rmSync(root, { recursive: true, force: true });
            }
        });
    });

    describe("compareBaseline", () => {
        it("passes when the count is at or below the baseline", () => {
            expect(compareBaseline(10, { count: 10 }).ok).toBe(true);
            expect(compareBaseline(9, { count: 10 }).ok).toBe(true);
        });

        it("fails when the count increases", () => {
            const result = compareBaseline(11, { count: 10 });

            expect(result.ok).toBe(false);
            expect(result.delta).toBe(1);
        });
    });
});
