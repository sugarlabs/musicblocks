/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Sugar Labs
 */

const fs = require("fs");
const path = require("path");

const JS_DIR = path.join(__dirname, "../js");
const BASELINE_FILE = path.join(__dirname, "console-usage-baseline.json");
const CONSOLE_CALL = /\bconsole\s*\.\s*(log|debug|warn|error)\s*\(/g;
const SKIP_DIRS = new Set(["__tests__", "node_modules"]);

/**
 * Counts direct console.log/debug/warn/error calls in a string.
 *
 * @param {string} text - Source text to scan.
 * @returns {number} - Number of matching calls.
 */
function countInText(text) {
    const matches = String(text).match(CONSOLE_CALL);
    return matches ? matches.length : 0;
}

/**
 * Counts direct console calls in a single file.
 *
 * @param {string} filePath - Path to the file.
 * @returns {number} - Number of matching calls.
 */
function countInFile(filePath) {
    return countInText(fs.readFileSync(filePath, "utf8"));
}

/**
 * Walks a directory and returns per-file console-call counts, skipping
 * test directories and non-JavaScript files.
 *
 * @param {string} dir - Directory to scan.
 * @param {Array<Object>} [results] - Accumulator used by recursion.
 * @returns {Array<Object>} - Entries of the form { file, count }.
 */
function scanDirectory(dir, results) {
    const output = results || [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach(entry => {
        if (entry.isDirectory()) {
            if (!SKIP_DIRS.has(entry.name)) {
                scanDirectory(path.join(dir, entry.name), output);
            }
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
            const filePath = path.join(dir, entry.name);
            const count = countInFile(filePath);
            if (count > 0) {
                output.push({ file: filePath, count });
            }
        }
    });

    return output;
}

/**
 * Sums the per-file counts.
 *
 * @param {Array<Object>} results - Entries of the form { file, count }.
 * @returns {number} - Total number of console calls.
 */
function summarize(results) {
    return results.reduce((total, entry) => total + entry.count, 0);
}

/**
 * Compares the current count against the committed baseline.
 *
 * @param {number} current - Current console-call count.
 * @param {Object} baseline - Parsed baseline file.
 * @returns {{current: number, allowed: number, ok: boolean, delta: number}} - Result.
 */
function compareBaseline(current, baseline) {
    const allowed = baseline && Number.isFinite(baseline.count) ? baseline.count : 0;
    return {
        current,
        allowed,
        ok: current <= allowed,
        delta: current - allowed
    };
}

function main(argv) {
    const results = scanDirectory(JS_DIR);
    const current = summarize(results);

    if (argv.indexOf("--update") !== -1) {
        fs.writeFileSync(BASELINE_FILE, JSON.stringify({ count: current }, null, 4) + "\n");
        console.log(
            "Updated " + path.relative(process.cwd(), BASELINE_FILE) + " to " + current + "."
        );
        return 0;
    }

    let baseline;
    try {
        baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));
    } catch (e) {
        console.error("Missing or invalid " + path.relative(process.cwd(), BASELINE_FILE) + ".");
        console.error("Run: node scripts/check-console-usage.js --update");
        return 1;
    }

    const result = compareBaseline(current, baseline);
    if (!result.ok) {
        console.error("Console usage increased: " + result.current + " > " + result.allowed + ".");
        results
            .slice()
            .sort((a, b) => b.count - a.count)
            .forEach(entry => {
                console.error("  " + path.relative(process.cwd(), entry.file) + ": " + entry.count);
            });
        console.error("Route new logging through ErrorHandler or debugLog instead.");
        return 1;
    }

    console.log("Console usage: " + result.current + " (baseline " + result.allowed + ").");
    return 0;
}

if (require.main === module) {
    process.exitCode = main(process.argv.slice(2));
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        countInText,
        countInFile,
        scanDirectory,
        summarize,
        compareBaseline,
        main
    };
}
