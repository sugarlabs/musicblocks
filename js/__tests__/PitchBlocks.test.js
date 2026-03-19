const setupPitchBlocks = require("../blocks/PitchBlocks.js");

describe("PitchBlocks", () => {
  let registeredBlocks;

  beforeEach(() => {
    registeredBlocks = [];
  });

  it("should register pitch blocks", () => {
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