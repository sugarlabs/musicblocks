const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const SCRIPT = path.join(__dirname, "compare-coverage.js");

function writeSummary(dir, name, percentages) {
    const filePath = path.join(dir, name);

    const summary = {
        total: {
            statements: { pct: percentages.statements },
            branches: { pct: percentages.branches },
            functions: { pct: percentages.functions },
            lines: { pct: percentages.lines }
        }
    };

    fs.writeFileSync(filePath, JSON.stringify(summary));
    return filePath;
}

describe("compare-coverage.js", () => {
    let tempDir;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "compare-coverage-"));
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    test("passes when coverage stays the same", () => {
        const base = writeSummary(tempDir, "base.json", {
            statements: 80,
            branches: 70,
            functions: 75,
            lines: 80
        });

        const pr = writeSummary(tempDir, "pr.json", {
            statements: 80,
            branches: 70,
            functions: 75,
            lines: 80
        });

        const result = spawnSync("node", [SCRIPT, base, pr], {
            encoding: "utf8"
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("No coverage regressions");
    });

    test("passes when coverage increases", () => {
        const base = writeSummary(tempDir, "base.json", {
            statements: 80,
            branches: 70,
            functions: 75,
            lines: 80
        });

        const pr = writeSummary(tempDir, "pr.json", {
            statements: 81,
            branches: 72,
            functions: 76,
            lines: 82
        });

        const result = spawnSync("node", [SCRIPT, base, pr], {
            encoding: "utf8"
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("No coverage regressions");
    });

    test("fails when coverage decreases", () => {
        const base = writeSummary(tempDir, "base.json", {
            statements: 80,
            branches: 70,
            functions: 75,
            lines: 80
        });

        const pr = writeSummary(tempDir, "pr.json", {
            statements: 79,
            branches: 68,
            functions: 75,
            lines: 78
        });

        const result = spawnSync("node", [SCRIPT, base, pr], {
            encoding: "utf8"
        });

        expect(result.status).toBe(1);
        expect(result.stdout).toContain("Coverage dropped on");
        expect(result.stderr).toContain("coverage metric(s) dropped");
    });

    test("ignores small floating-point differences within epsilon", () => {
        const base = writeSummary(tempDir, "base.json", {
            statements: 80,
            branches: 70,
            functions: 75,
            lines: 80
        });

        const pr = writeSummary(tempDir, "pr.json", {
            statements: 79.995,
            branches: 69.995,
            functions: 74.995,
            lines: 79.995
        });

        const result = spawnSync("node", [SCRIPT, base, pr], {
            encoding: "utf8"
        });

        expect(result.status).toBe(0);
        expect(result.stdout).toContain("No coverage regressions");
    });

    test("returns usage error when arguments are missing", () => {
        const result = spawnSync("node", [SCRIPT], {
            encoding: "utf8"
        });

        expect(result.status).toBe(2);
        expect(result.stderr).toContain("Usage:");
    });
});
