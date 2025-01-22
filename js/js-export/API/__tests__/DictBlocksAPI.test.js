const JSInterface = {
    validateArgs: jest.fn(),
};
global.JSInterface = JSInterface;

global.globalActivity = {
    turtles: {
        ithTurtle: jest.fn(() => ({ name: "defaultDict" })),
    },
};

const DictBlocksAPI = require("../DictBlocksAPI");

describe("DictBlocksAPI", () => {
  let dictBlocksAPI;

  beforeEach(() => {
    dictBlocksAPI = new DictBlocksAPI();
    dictBlocksAPI.turIndex = 0; 
    dictBlocksAPI.runCommand = jest.fn(); 
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getDict calls runCommand with correct arguments", () => {
    JSInterface.validateArgs.mockReturnValue(["mockDict"]);

    dictBlocksAPI.getDict("testDict");

    expect(JSInterface.validateArgs).toHaveBeenCalledWith("getDict", ["testDict"]);
    expect(dictBlocksAPI.runCommand).toHaveBeenCalledWith("getDict", ["mockDict", 0]);
  });

  test("getDict uses default turIndex when no dict is provided", () => {
    JSInterface.validateArgs.mockReturnValue(["defaultDict"]);

    dictBlocksAPI.getDict();

    expect(JSInterface.validateArgs).toHaveBeenCalledWith("getDict", [0]);
    expect(dictBlocksAPI.runCommand).toHaveBeenCalledWith("getDict", ["defaultDict", 0]);
  });

  test("showDict calls runCommand with correct arguments", () => {
    JSInterface.validateArgs.mockReturnValue(["mockDict"]);

    dictBlocksAPI.showDict("testDict");

    expect(JSInterface.validateArgs).toHaveBeenCalledWith("showDict", ["testDict"]);
    expect(dictBlocksAPI.runCommand).toHaveBeenCalledWith("showDict", ["mockDict", 0]);
  });

  test("showDict uses default turIndex when no dict is provided", () => {
    JSInterface.validateArgs.mockReturnValue(["defaultDict"]);

    dictBlocksAPI.showDict();

    expect(JSInterface.validateArgs).toHaveBeenCalledWith("showDict", [0]);
    expect(dictBlocksAPI.runCommand).toHaveBeenCalledWith("showDict", ["defaultDict", 0]);
  });

  test("setValue calls runCommand with correct arguments", () => {
    JSInterface.validateArgs.mockReturnValue(["key", "value", "testDict"]);

    dictBlocksAPI.setValue("key", "value", "testDict");

    expect(JSInterface.validateArgs).toHaveBeenCalledWith("setValue", ["key", "value", "testDict"]);
    expect(dictBlocksAPI.runCommand).toHaveBeenCalledWith("setValue", ["testDict", "key", "value", 0]);
  });

  test("setValue uses default dict when no dict is provided", () => {
    JSInterface.validateArgs.mockReturnValue(["key", "value", "defaultDict"]);
    global.globalActivity.turtles.ithTurtle.mockReturnValue({ name: "defaultDict" });

    dictBlocksAPI.setValue("key", "value");

    expect(JSInterface.validateArgs).toHaveBeenCalledWith("setValue", ["key", "value", "defaultDict"]);
    expect(dictBlocksAPI.runCommand).toHaveBeenCalledWith("setValue", ["defaultDict", "key", "value", 0]);
  });

  test("getValue calls runCommand with correct arguments", () => {
    JSInterface.validateArgs.mockReturnValue(["key", "testDict"]);

    dictBlocksAPI.getValue("key", "testDict");

    expect(JSInterface.validateArgs).toHaveBeenCalledWith("getValue", ["key", "testDict"]);
    expect(dictBlocksAPI.runCommand).toHaveBeenCalledWith("getValue", ["testDict", "key", 0]);
  });

  test("getValue uses default dict when no dict is provided", () => {
    JSInterface.validateArgs.mockReturnValue(["key", "defaultDict"]);
    global.globalActivity.turtles.ithTurtle.mockReturnValue({ name: "defaultDict" });

    dictBlocksAPI.getValue("key");

    expect(JSInterface.validateArgs).toHaveBeenCalledWith("getValue", ["key", "defaultDict"]);
    expect(dictBlocksAPI.runCommand).toHaveBeenCalledWith("getValue", ["defaultDict", "key", 0]);
  });
});
