# Testing Guide

How to write unit tests for block files.

## Running Tests

```bash
npm test                                    # Run all tests
npm test -- path/to/file.test.js           # Run specific test file
npm test -- --coverage                      # Run with coverage report
```

## Testing Blocks

Block files (in `js/blocks/`) need specific mocks. Copy this template and modify for your block:

### Basic Template

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
