# Test Suite Guidelines

The Music Blocks repository follows a structured approach for testing using **Jest**. All tests should be placed inside the `_tests_` directory to ensure consistency and maintainability.

## 🛠 Setting Up the Test Environment

Before running or writing tests, ensure that dependencies are installed:

```sh
pnpm install
```

To run the test suite, use:

```sh
pnpm test
```

For running tests with detailed logs:

```sh
pnpm test -- --verbose
```

## 📂 Directory Structure

```
/musicblocks
│── js/                 # Source code
│── js/_tests_/         # Test directory
│── js/utils/_tests_/   # Tests for the utils subdirectory (same format is followed for each directory)
│── jest.config.js      # Jest configuration (try not to edit this)
│── package.json        # Project dependencies
│── js/guide_test.md    # This guide
```

## 📌 Key Guidelines Before Writing Tests

### ✅ General Rules

- All test files **must be placed inside the `_tests_` folder of the respective directory**.
- Follow the naming convention: **`<filename>.test.js`**.
- Ensure **100% function coverage** when adding tests.
- **Mock dependencies** where necessary to isolate unit tests.
- **Whenever a function is added or its functionality is changed, ensure that the corresponding test cases are added, updated, or refactored.** This ensures that the test suite remains accurate and reliable.

### 🔄 Import/Export Conventions

- The Music Blocks repository **strictly follows `const` for imports and exports**.
- **For CommonJS (`require/module.exports`)**, use:

    ```js
    const { functionName } = require("../src/file.js");
    ```

    Ensure `file.js` contains:

    ```js
    if (typeof module !== "undefined" && module.exports) {
        module.exports = { functionName };
    }
    ```

### 📑 Writing Tests

- Use `describe` blocks to group related tests.
- Use `test` or `it` for defining test cases.
- Use **Jest matchers** like `toBe`, `toEqual`, `toHaveBeenCalled`.

#### 🔹 Example Test Structure:

```js
const { myFunction } = require("../src/myFile.js");

describe("My Function Tests", () => {
    test("should return expected output", () => {
        expect(myFunction()).toBe("expectedValue");
    });
});
```

## 🛑 Common Mistakes to Avoid

❌ Making changes in the root file.  
❌ Modifying `jest.config.js` unnecessarily.  
❌ Placing test files **outside** `_tests_` (always keep them inside).  
❌ Using `var` or `let` for imports (always use `const`).  
❌ Forgetting to mock dependencies when needed.  
❌ Not handling async tests properly (use `async/await` or `done`).
❌ **Neglecting to update or refactor test cases when adding or modifying functions.**

## 🚀 Running Specific Tests

To run a specific test file:

```sh
pnpm test _tests_/filename.test.js
```

To watch tests while coding:

```sh
pnpm test -- --watch
```

## 🔄 Updating Snapshots

If using Jest snapshots, update them with:

```sh
pnpm test -- -u
```

## Code Coverage

### Running Coverage Locally

To generate a coverage report, run:

```sh
pnpm run test:coverage
```

This executes `jest --coverage`, which collects coverage data according to the settings in `jest.config.js`.

### Where Reports Are Generated

After the command finishes, reports are written to the `coverage/` directory at the project root. The configured reporters (`jest.config.js` → `coverageReporters`) produce:

| Reporter       | Output                                              |
| -------------- | --------------------------------------------------- |
| `text-summary` | One-line summary printed to the terminal            |
| `text`         | Per-file table printed to the terminal              |
| `lcov`         | `coverage/lcov-report/index.html` (browsable)       |
| `json-summary` | `coverage/coverage-summary.json` (machine-readable) |

Open `coverage/lcov-report/index.html` in a browser to explore line-by-line coverage.

> **Note:** The `coverage/` directory is listed in `.gitignore` and should never be committed.

### Current Threshold Policy

The `coverageThreshold` in `jest.config.js` enforces minimum global coverage. If any metric drops below its threshold, `jest --coverage` exits with a non-zero code and the CI build fails.

| Metric     | Minimum |
| ---------- | ------- |
| Statements | 34 %    |
| Branches   | 29 %    |
| Functions  | 41 %    |
| Lines      | 34 %    |

These thresholds are intentionally kept as a ratchet — they should only go **up** as new tests are added, never down.

### How CI Posts Coverage on PRs

The GitHub Actions workflow (`.github/workflows/pr-jest-tests.yml`) runs on every pull request:

1. Checks out the PR head commit and runs `pnpm test -- --coverage`.
2. Reads `coverage/coverage-summary.json` to extract per-metric percentages.
3. Posts a comment on the PR with the coverage summary and pass/fail status.
4. If any test fails, the comment lists the failing test files.

You can check the latest coverage numbers directly in the PR comment without downloading the CI logs.

## 🎯 Contribution Guidelines

- Ensure all tests pass before creating a PR.
- Maintain code readability and add comments where needed.
- Adhere to the **import/export conventions** stated above.
- **Do not merge** without proper test coverage.
- **Always update or refactor test cases when adding or modifying functions to ensure the test suite remains accurate and reliable.**
