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

### 🔄 Import/Export Conventions  
- The Music Blocks repository **strictly follows `const` for imports and exports**.  
- **For CommonJS (`require/module.exports`)**, use:  

  ```js
  const { functionName } = require('../src/file.js');
  ```  

  Ensure `file.js` contains:  

  ```js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { functionName };
  }
  ```  

### 📑 Writing Tests  
- Use `describe` blocks to group related tests.  
- Use `test` or `it` for defining test cases.  
- Use **Jest matchers** like `toBe`, `toEqual`, `toHaveBeenCalled`.  

#### 🔹 Example Test Structure:  

```js
const { myFunction } = require('../src/myFile.js');

describe('My Function Tests', () => {
    test('should return expected output', () => {
        expect(myFunction()).toBe('expectedValue');
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

## 🎯 Contribution Guidelines  
- Ensure all tests pass before creating a PR.  
- Maintain code readability and add comments where needed.  
- Adhere to the **import/export conventions** stated above.  
- **Do not merge** without proper test coverage.  
