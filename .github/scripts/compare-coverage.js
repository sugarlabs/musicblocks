#!/usr/bin/env node
/**
 * Compares two Jest `coverage-summary.json` files (base branch vs. PR head)
 * and fails (exit 1) if any of statements/branches/functions/lines dropped.
 *
 * Usage: node compare-coverage.js <base-summary.json> <pr-summary.json>
 *
 * Writes a markdown delta table to $GITHUB_STEP_SUMMARY when set, so
 * reviewers see a base% -> PR% report on the workflow run without needing
 * write-scoped PR-comment permissions (this repo's CI intentionally avoids
 * pull_request_target / write tokens on fork PRs).
 */

const fs = require("fs");

const METRICS = ["statements", "branches", "functions", "lines"];
// Tolerate float rounding noise from Jest's coverage percentages.
const EPSILON = 0.01;

function readTotal(path) {
    const summary = JSON.parse(fs.readFileSync(path, "utf8"));
    if (!summary.total) {
        throw new Error(`"${path}" has no "total" key — not a coverage-summary.json file`);
    }
    return summary.total;
}

function arrow(delta) {
    if (delta > EPSILON) return "⬆️";
    if (delta < -EPSILON) return "⬇️";
    return "➡️";
}

function main() {
    const [, , basePath, prPath] = process.argv;
    if (!basePath || !prPath) {
        console.error("Usage: node compare-coverage.js <base-summary.json> <pr-summary.json>");
        process.exit(2);
        return;
    }

    const base = readTotal(basePath);
    const pr = readTotal(prPath);

    const rows = METRICS.map(metric => {
        const basePct = base[metric].pct;
        const prPct = pr[metric].pct;
        const delta = prPct - basePct;
        return { metric, basePct, prPct, delta };
    });

    const regressions = rows.filter(row => row.delta < -EPSILON);

    const lines = [
        "## Coverage delta vs. base branch",
        "",
        "| Metric | Base | PR | Delta |",
        "| --- | --- | --- | --- |",
        ...rows.map(
            row =>
                `| ${row.metric} | ${row.basePct.toFixed(2)}% | ${row.prPct.toFixed(2)}% | ${arrow(row.delta)} ${row.delta >= 0 ? "+" : ""}${row.delta.toFixed(2)}% |`
        ),
        ""
    ];

    if (regressions.length > 0) {
        lines.push(
            `**Coverage dropped on: ${regressions.map(row => row.metric).join(", ")}.** ` +
                "Add or update tests so this PR does not lower overall coverage."
        );
    } else {
        lines.push("No coverage regressions. ✅");
    }

    const report = lines.join("\n");
    console.log(report);

    if (process.env.GITHUB_STEP_SUMMARY) {
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + "\n");
    }

    if (regressions.length > 0) {
        console.error(
            `\nFAIL: ${regressions.length} coverage metric(s) dropped relative to the base branch.`
        );
        process.exit(1);
    }
}

module.exports = { readTotal, arrow, main };

if (require.main === module) {
    main();
}
