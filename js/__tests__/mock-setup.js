global._ = function(text) {
  return text;
};

global.NOINPUTERRORMSG = "Missing input";

global.Turtle = {
  PitchActions: {
    setKey: jest.fn(),
    setScale: jest.fn(),
    transposeNote: jest.fn(),
    getNote: jest.fn(),
    validateKey: jest.fn().mockReturnValue(true)
  }
};

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

const setupBlockMethod = function(activity) {
  this.setPalette("pitch", activity);
  return this;
};

global.ConsonantStepSizeDownBlock = class ConsonantStepSizeDownBlock extends global.FlowBlock {
  constructor() {
    super("consonantstepsizedown");
  }
  
  setup(activity) {
    return setupBlockMethod.call(this, activity);
  }
};

global.ConsonantStepSizeUpBlock = class ConsonantStepSizeUpBlock extends global.FlowBlock {
  constructor() {
    super("consonantstepsizeup");
  }
  
  setup(activity) {
    return setupBlockMethod.call(this, activity);
  }
};

global.RestBlock = class RestBlock extends global.FlowBlock {
  constructor() {
    super("rest");
  }
  
  setup(activity) {
    return setupBlockMethod.call(this, activity);
  }
};

global.SquareBlock = class SquareBlock extends global.FlowBlock {
  constructor() {
    super("square");
  }
  
  setup(activity) {
    return setupBlockMethod.call(this, activity);
  }
};