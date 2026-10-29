# Test Suite Guidelines

The Music Blocks repository follows a structured approach for testing using **Jest**. All tests should be placed inside the `_tests_` directory to ensure consistency and maintainability.

## 🛠 Setting Up the Test Environment

Before running or writing tests, ensure that dependencies are installed:

```sh
npm install
```

To run the test suite, use:

```sh
npm test
```

For running tests with detailed logs:

```sh
npm test -- --verbose
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
npm test _tests_/filename.test.js
```

To watch tests while coding:

```sh
npm test -- --watch
```

## 🔄 Updating Snapshots

If using Jest snapshots, update them with:

```sh
npm test -- -u
```

## Code Coverage

### Running Coverage Locally

To generate a coverage report, run:

```sh
npm run test:coverage
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

### Coverage Policy

There is no fixed coverage minimum in `jest.config.js`. Instead, the Coverage delta workflow (`.github/workflows/coverage-delta.yml`) runs on pull requests to `master`, except Renovate's:

1. It measures coverage on the base commit and on the pull request merged with the base, in separate jobs.
2. It compares statements, branches, functions and lines between the two.
3. The **Coverage delta vs base** check fails if any of them drops by more than 0.1 percentage points. The comparison table is printed in that job's log.

So a pull request that adds code should also add tests for it, or overall coverage will drop.

### How CI Reports Coverage on PRs

The main CI workflow (`.github/workflows/ci.yml`) runs `npm test -- --coverage --ci` and uploads the result to Codecov, which posts a coverage report on the pull request. A failed upload does not fail the job.

## 🎯 Contribution Guidelines

- Ensure all tests pass before creating a PR.
- Maintain code readability and add comments where needed.
- Adhere to the **import/export conventions** stated above.
- **Do not merge** without proper test coverage.
- **Always update or refactor test cases when adding or modifying functions to ensure the test suite remains accurate and reliable.**
