const { setupPitchBlocks } = require("../blocks/PitchBlocks.js");

global.JSInterface = { validateArgs: jest.fn().mockReturnValue(true), log: jest.fn() };

describe("PitchBlocks", () => {
  let registeredBlocks;

  beforeEach(() => {
    registeredBlocks = [];
  });

  it("should register pitch blocks", () => {
    global.ValueBlock = class { constructor(name) { this.name = name; } setPalette() { return this; } setHelpString() { return this; } beginnerBlock() { return this; } setup(activity) { if (activity && activity.addBlock) { activity.addBlock(this); } return this; } formBlock() { return this; } makeMacro() { return this; } };
    global.FlowBlock = class extends global.ValueBlock { };
    global.FlowClampBlock = class extends global.ValueBlock { };
    global.LeftBlock = class extends global.ValueBlock { };
    global.NOINPUTERRORMSG = "No input";
    global.last = arr => arr[arr.length - 1];
    global._ = jest.fn(s => s);

    const mockActivity = {
      addBlock: block => registeredBlocks.push(block),
      errorMsg: jest.fn(),
      turtles: { ithTurtle: jest.fn() },
      blocks: { blockList: {} }
    };

    setupPitchBlocks(mockActivity);

    expect(registeredBlocks.length).toBeGreaterThan(0);
  });
});