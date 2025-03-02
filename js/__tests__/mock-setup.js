// Create a mock setup for pitch blocks testing
// This file should be saved as mock-setup.js

// Mock translation function
global._ = function(text) {
  return text;
};

// Constants
global.NOINPUTERRORMSG = "Missing input";

// Mock Turtle namespace with PitchActions
global.Turtle = {
  PitchActions: {
    setKey: jest.fn(),
    setScale: jest.fn(),
    transposeNote: jest.fn(),
    getNote: jest.fn(),
    validateKey: jest.fn().mockReturnValue(true)
  }
};

// Mock required block classes if they're not already defined
if (!global.ValueBlock) {
  global.ValueBlock = class ValueBlock {
    constructor(name, label) {
      this.name = name;
      this.label = label || name;
    }
    
    setPalette() { return this; }
    setHelpString() { return this; }
    formBlock() { return this; }
    makeMacro() { return this; }
    adjustWidthToLabel() { return this; }
    beginnerBlock() { return true; }
  };
}

if (!global.FlowBlock) {
  global.FlowBlock = class FlowBlock {
    constructor(name, label) {
      this.name = name;
      this.label = label || name;
    }
    
    setPalette() { return this; }
    setHelpString() { return this; }
    formBlock() { return this; }
    makeMacro() { return this; }
    adjustWidthToLabel() { return this; }
    beginnerBlock() { return true; }
  };
}

if (!global.FlowClampBlock) {
  global.FlowClampBlock = class FlowClampBlock {
    constructor(name, label) {
      this.name = name;
      this.label = label || name;
    }
    
    setPalette() { return this; }
    setHelpString() { return this; }
    formBlock() { return this; }
    makeMacro() { return this; }
    adjustWidthToLabel() { return this; }
    beginnerBlock() { return true; }
  };
}

// Mock the LeftBlock class
global.LeftBlock = class LeftBlock {
  constructor(name, label) {
    this.name = name;
    this.label = label || name;
    this.palette = null;
    this.size = 0;
    this.connections = [];
  }

  setPalette(name, activity) {
    this.palette = name;
    return this;
  }

  setHelpString(helpContent) {
    this.helpString = helpContent;
    return this;
  }

  formBlock(options = {}) {
    this.blockOptions = options;
    return this;
  }

  beginnerBlock() {
    return this;
  }

  staticLabels(labels) {
    this.labels = labels;
    return this;
  }
};

// Create a function to generate mock activity instances
global.createMockActivity = function() {
  const activity = {
    blocks: {
      registerBlockType: jest.fn(),
      setPalette: jest.fn(),
      makeBlock: jest.fn(),
      protoBlockDict: {},
      palettes: {
        add: jest.fn()
      },
      findBlockInstance: jest.fn()
    },
    errorMsg: jest.fn()
  };
  return activity;
};

// Do not overwrite FlowBlock with Block
// global.FlowBlock = global.Block;

// Add these to your mock-setup.js file

// Base method for all block setup functions
const setupBlockMethod = function(activity) {
  this.setPalette("pitch", activity);
  return this;
};

// ConsonantStepSizeDownBlock
global.ConsonantStepSizeDownBlock = class ConsonantStepSizeDownBlock extends global.FlowBlock {
  constructor() {
    super("consonantstepsizedown");
  }
  
  setup(activity) {
    return setupBlockMethod.call(this, activity);
  }
};

// ConsonantStepSizeUpBlock
global.ConsonantStepSizeUpBlock = class ConsonantStepSizeUpBlock extends global.FlowBlock {
  constructor() {
    super("consonantstepsizeup");
  }
  
  setup(activity) {
    return setupBlockMethod.call(this, activity);
  }
};

// RestBlock
global.RestBlock = class RestBlock extends global.FlowBlock {
  constructor() {
    super("rest");
  }
  
  setup(activity) {
    return setupBlockMethod.call(this, activity);
  }
};

// SquareBlock
global.SquareBlock = class SquareBlock extends global.FlowBlock {
  constructor() {
    super("square");
  }
  
  setup(activity) {
    return setupBlockMethod.call(this, activity);
  }
};

// You'll likely need to add similar definitions for any other block classes 
// that might be instantiated in setupPitchBlocks