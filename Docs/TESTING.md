# Testing Guide

How to write unit tests for block files.

## Running Tests

```bash
npm test                                    # Run all tests
npm test -- path/to/file.test.js           # Run specific test file
npm test -- --coverage                      # Run with coverage report
```

## Shared Test Infrastructure

Music Blocks provides a shared test infrastructure to reduce duplication, improve consistency, and make test suites easier to maintain.

Before adding new mocks or setup code, check whether similar functionality already exists in the shared test infrastructure.

### Project Structure

```text
test/
├── setup/
│   └── globalSetup.js
├── utils/
│   ├── activityFactory.js
│   ├── domFactory.js
│   ├── domMocks.js
│   ├── imageMock.js
│   └── svgMock.js
└── setupTests.js
```

### `test/setupTests.js`

`test/setupTests.js` is loaded automatically before every test suite through Jest using `setupFilesAfterEnv`.

Use this file only for test infrastructure that should be available to every test suite.

Examples include:

- Common Jest lifecycle hooks.
- Browser API polyfills.
- Shared browser mocks.
- Common Music Blocks globals and constants.
- Project-wide test environment initialization.

Example:

```javascript
afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
});
```

Avoid placing widget-specific or feature-specific mocks in this file.

---

### `test/setup/`

The `test/setup/` directory contains reusable setup helpers for initializing shared test state.

If multiple test suites require the same setup logic, extract it into a helper in this directory instead of duplicating it.

Example:

```javascript
const { setupGlobalEnvironment } = require("../../test/setup/globalSetup");

beforeEach(() => {
    setupGlobalEnvironment();
});
```

---

### `test/utils/`

The `test/utils/` directory contains reusable mock factories and helper utilities.

If the same mock or helper is needed by multiple test suites, prefer creating or reusing a helper here instead of duplicating the implementation.

#### Activity helper

Use `activityFactory.js` to create mock activity objects.

```javascript
const { createMockActivity } = require("../../test/utils/activityFactory");

const activity = createMockActivity({
    beginnerMode: true
});
```

Instead of manually creating the same activity object in every test.

---

#### DOM helpers

Use `domFactory.js` and `domMocks.js` when tests require reusable DOM structures or `docById` mocks.

```javascript
const { createMockDOM } = require("../../test/utils/domFactory");
const { mockDocById } = require("../../test/utils/domMocks");

const { container, body } = createMockDOM();

mockDocById({
    palette: container,
    PaletteBody: body
});
```

Instead of manually recreating the same DOM structure across multiple test files.

---

#### SVG and Image helpers

Use the shared helpers instead of redefining `SVG` or `Image` mocks in every test file.

```javascript
const { setupSVGMock } = require("../../test/utils/svgMock");
const { setupImageMock } = require("../../test/utils/imageMock");

beforeEach(() => {
    setupSVGMock();
    setupImageMock();
});
```

---

### When should I add to the shared infrastructure?

Move code into the shared infrastructure when:

- The same setup is duplicated across multiple test files.
- The helper is generic and reusable.
- The helper represents common testing infrastructure instead of application behavior.

Examples include:

- Activity factories.
- Generic DOM helpers.
- Shared browser mocks.
- Common setup functions.

---

### When should setup remain inside a test?

Keep setup local to the test file when it represents behavior specific to a single widget, block, or feature.

Examples include:

- Widget-specific DOM structure.
- Feature-specific event listeners.
- Mocks whose behavior differs between test suites.
- Test data that is only meaningful for a particular component.

For example:

```javascript
jest.spyOn(document, "getElementsByClassName")
    .mockReturnValue([{ style: {} }]);
```

If a mock or setup is only required by a single test suite, it should remain in that test file. Move it into the shared infrastructure only when it becomes generic enough to be reused across multiple test suites.

---

### General Guidelines

Before introducing new setup code:

1. Check whether a shared helper already exists.
2. Reuse existing helpers whenever possible.
3. Create a new shared helper only when the logic is generic and reusable across multiple test suites.
4. Keep feature-specific setup local to the corresponding test file.
5. Prefer small, focused helper modules over large, test-specific utilities.

## Testing Blocks

Block files (in `js/blocks/`) need specific mocks. Copy this template and modify for your block:

### Basic Template

Add a license header at the top of your test file:

```javascript
/**
 * MusicBlocks v3.6.2
 *
 * @author Your Name
 *
 * @copyright 2026 Your Name
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
```

Then add the test code:

```javascript
const { setupYourBlocks } = jest.requireActual("../YourBlocks");

global._ = s => s;
global.NOINPUTERRORMSG = "NO_INPUT";

class BaseBlock {
    constructor(name) {
        this.name = name;
    }
    setPalette(palette) {
        this.palette = palette;
    }
    setHelpString(help) {
        this.help = help;
    }
    formBlock(defn) {
        this.formDefn = defn;
    }
    setup(activity) {
        activity.registeredBlocks = activity.registeredBlocks || {};
        activity.registeredBlocks[this.name] = this;
        return this;
    }
}

class FlowBlock extends BaseBlock {
    constructor(name) {
        super(name);
    }
    flow() {}
}

class ValueBlock extends BaseBlock {
    constructor(name) {
        super(name);
    }
    arg() {}
}

global.BaseBlock = BaseBlock;
global.FlowBlock = FlowBlock;
global.ValueBlock = ValueBlock;

describe("YourBlocks", () => {
    let activity;
    let logo;

    beforeEach(() => {
        jest.clearAllMocks();

        activity = {
            registeredBlocks: {},
            blocks: {
                blockList: [],
                palettes: { dict: {} }
            },
            turtles: {
                ithTurtle: jest.fn(() => ({
                    singer: { justCounting: [] }
                }))
            },
            errorMsg: jest.fn()
        };

        logo = {
            parseArg: jest.fn(),
            runFromBlock: jest.fn()
        };

        setupYourBlocks(activity);
    });

    const getBlock = name => activity.registeredBlocks[name];

    test("registers blocks", () => {
        expect(activity.registeredBlocks).toHaveProperty("yourblock");
    });

    test("block flow works", () => {
        const block = getBlock("yourblock");
        // Replace with actual args for your block
        const result = block.flow([1 / 4, "sol"], logo, 0, 5);
        expect(result).toEqual(["sol", 1]);
    });
});
```

### Common Mocks

| Global                         | Purpose                            |
| ------------------------------ | ---------------------------------- |
| `activity.errorMsg`            | Captures error messages            |
| `activity.blocks.blockList`    | Simulates block connections        |
| `logo.parseArg`                | Returns values for block arguments |
| `activity.turtles.ithTurtle()` | Returns turtle state               |

### Tips

1. Check the source file's `flow()` or `arg()` method to understand what it expects
2. Mock only what's needed for the specific test
3. Use `jest.fn()` for methods you want to verify were called
4. Run `npx prettier --write` on your test file before committing
