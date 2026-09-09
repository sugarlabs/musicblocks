const { readTotal, arrow, main } = require("./compare-coverage");
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

describe("main (in-process)", () => {
    let tmpDir, exitSpy, logSpy, errorSpy, originalArgv, originalStepSummary;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cov-inproc-"));
        originalArgv = process.argv;
        originalStepSummary = process.env.GITHUB_STEP_SUMMARY;
        exitSpy = jest.spyOn(process, "exit").mockImplementation(() => {});
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        process.argv = originalArgv;
        originalStepSummary === undefined
            ? delete process.env.GITHUB_STEP_SUMMARY
            : (process.env.GITHUB_STEP_SUMMARY = originalStepSummary);
        jest.restoreAllMocks();
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test("passes when coverage increases (direct call)", () => {
        const base = writeSummary(tmpDir, "base.json", {
            statements: 80,
            branches: 70,
            functions: 75,
            lines: 80
        });
        const pr = writeSummary(tmpDir, "pr.json", {
            statements: 85,
            branches: 75,
            functions: 80,
            lines: 85
        });
        process.argv = ["node", "compare-coverage.js", base, pr];
        main();
        expect(exitSpy).not.toHaveBeenCalledWith(1);
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("No coverage regressions"));
    });

    test("returns usage error when arguments are missing (direct call)", () => {
        process.argv = ["node", "compare-coverage.js"];
        main();
        expect(exitSpy).toHaveBeenCalledWith(2);
    });

    test("writes to GITHUB_STEP_SUMMARY when set", () => {
        const base = writeSummary(tmpDir, "base.json", {
            statements: 80,
            branches: 70,
            functions: 75,
            lines: 80
        });
        const pr = writeSummary(tmpDir, "pr.json", {
            statements: 85,
            branches: 75,
            functions: 80,
            lines: 85
        });
        const summaryFile = path.join(tmpDir, "step-summary.md");
        fs.writeFileSync(summaryFile, "");
        process.env.GITHUB_STEP_SUMMARY = summaryFile;
        process.argv = ["node", "compare-coverage.js", base, pr];
        main();
        expect(fs.readFileSync(summaryFile, "utf8")).toContain("Coverage delta vs. base branch");
    });
});

describe("readTotal", () => {
    test("throws when the file has no total key", () => {
        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cov-readtotal-"));
        const badFile = path.join(tmpDir, "bad.json");
        fs.writeFileSync(badFile, JSON.stringify({ notTotal: {} }));
        expect(() => readTotal(badFile)).toThrow(/has no "total" key/);
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });
});

describe("arrow", () => {
    test("up when delta exceeds epsilon", () => expect(arrow(0.02)).toBe("⬆️"));
    test("down when delta is below negative epsilon", () => expect(arrow(-0.02)).toBe("⬇️"));
    test("flat within epsilon", () => expect(arrow(0.005)).toBe("➡️"));
});
