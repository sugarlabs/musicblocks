/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Sugar Labs
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Proof of Concept: Asset Analysis & Minification Groundwork
 * This script investigates the current asset structure and estimates
 * potential gains from a formal production build process.
 */

const JS_DIR = path.join(__dirname, "../js");
const LIB_DIR = path.join(__dirname, "../lib");

function getFiles(dir, extension) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file, extension));
        } else if (file.endsWith(extension)) {
            results.push(file);
        }
    });
    return results;
}

function analyzeDir(name, dir) {
    console.log(`--- Analyzing ${name} ---`);
    const files = getFiles(dir, ".js");
    let totalSize = 0;

    files.forEach(file => {
        const stats = fs.statSync(file);
        totalSize += stats.size;
    });

    console.log(`Count: ${files.length} files`);
    console.log(`Total Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    // Estimate minification (conservative 30% reduction)
    console.log(
        `Estimated Minified Size: ${((totalSize * 0.7) / 1024 / 1024).toFixed(2)} MB (-30%)`
    );
}

console.log("Music Blocks Production Build Optimization Strategy - Investigation Phase\n");
analyzeDir("Application Logic (js/)", JS_DIR);
console.log("");
analyzeDir("Third-party Libraries (lib/)", LIB_DIR);

console.log("\n--- Strategic Recommendations ---");
console.log("1. Selective Bundling: Grouping the 200+ JS files into 3-5 logical chunks.");
console.log("2. Content Hashing: Using hashes (e.g., style.[hash].css) for better SW caching.");
console.log("3. AMD Optimization: Using r.js or a modern equivalent to trace dependencies.");
console.log(
    "4. Pre-minification: Shipping minified versions of large files like artwork.js and activity.js."
);
