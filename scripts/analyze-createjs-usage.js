/**
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Sugar Labs
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const scanRoots = ["js", "planet/js"];
const ignoreDirs = new Set(["node_modules", ".git", "dist", "build", "coverage"]);

function walk(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (ignoreDirs.has(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...walk(fullPath));
        } else if (entry.isFile() && fullPath.endsWith(".js")) {
            results.push(fullPath);
        }
    }

    return results;
}

function toPosix(relativePath) {
    return relativePath.split(path.sep).join("/");
}

function main() {
    const files = scanRoots
        .map(root => path.join(repoRoot, root))
        .filter(root => fs.existsSync(root))
        .flatMap(walk);

    const usageByFile = [];
    const apiCounts = new Map();
    let totalMentions = 0;

    for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        const mentions = (content.match(/createjs\./g) || []).length;
        if (mentions === 0) continue;

        const relativeFile = toPosix(path.relative(repoRoot, file));
        usageByFile.push({ file: relativeFile, count: mentions });
        totalMentions += mentions;

        const apiMatches = content.matchAll(/createjs\.([A-Za-z0-9_]+)/g);
        for (const match of apiMatches) {
            const apiName = match[1];
            apiCounts.set(apiName, (apiCounts.get(apiName) || 0) + 1);
        }
    }

    usageByFile.sort((a, b) => b.count - a.count || a.file.localeCompare(b.file));
    const sortedApis = [...apiCounts.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    );

    const reportPath = path.join(repoRoot, "Docs", "architecture", "createjs-usage-report.md");
    const reportLines = [];

    reportLines.push("# CreateJS Usage Report");
    reportLines.push("");
    reportLines.push(`Generated: ${new Date().toISOString()}`);
    reportLines.push("");
    reportLines.push("## Summary");
    reportLines.push("");
    reportLines.push(`- Files scanned: ${files.length}`);
    reportLines.push(`- Files with CreateJS usage: ${usageByFile.length}`);
    reportLines.push(`- Total \`createjs.\` mentions: ${totalMentions}`);
    reportLines.push("");
    reportLines.push("## Top Files by CreateJS Mentions");
    reportLines.push("");
    reportLines.push("| File | Mentions |");
    reportLines.push("| --- | ---: |");
    for (const row of usageByFile.slice(0, 40)) {
        reportLines.push(`| \`${row.file}\` | ${row.count} |`);
    }
    reportLines.push("");
    reportLines.push("## CreateJS API Surface (by mention count)");
    reportLines.push("");
    reportLines.push("| API | Mentions |");
    reportLines.push("| --- | ---: |");
    for (const [api, count] of sortedApis) {
        reportLines.push(`| \`createjs.${api}\` | ${count} |`);
    }
    reportLines.push("");
    reportLines.push("## Notes");
    reportLines.push("");
    reportLines.push(
        "- This report is static source analysis; dynamic runtime calls are not included."
    );
    reportLines.push(
        "- Use this report to plan migration waves from highest-impact files/APIs first."
    );

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, reportLines.join("\n") + "\n", "utf8");

    console.log(
        `CreateJS usage report written to: ${toPosix(path.relative(repoRoot, reportPath))}`
    );
}

main();
