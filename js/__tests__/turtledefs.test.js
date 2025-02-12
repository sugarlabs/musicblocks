global._ = jest.fn((str) => str);  
global._THIS_IS_TURTLE_BLOCKS_ = true;
const {
    createDefaultStack,
    LOGOJA1,
    NUMBERBLOCKDEFAULT,
    DEFAULTPALETTE,
    TITLESTRING
} = require('../turtledefs');

global.GUIDEURL = "guide url";
global.RUNBUTTON = "RUNBUTTON";
global.STOPBUTTON = "STOPBUTTON";
global.HELPTURTLEBUTTON = "HELPTURTLEBUTTON";
global.LANGUAGEBUTTON = "LANGUAGEBUTTON";

if (GUIDEURL === "guide url") {
  GUIDEURL = "https://github.com/sugarlabs/turtleblocksjs/tree/master/guide/README.md"; 
}

describe("turtledefs.js", () => {
  test("LOGOJA1 should be properly initialized", () => {
    expect(LOGOJA1).toBeDefined();
    expect(typeof LOGOJA1).toBe("string");
  });

  test("NUMBERBLOCKDEFAULT should be initialized correctly", () => {
    expect(NUMBERBLOCKDEFAULT).toBeDefined();
    expect(NUMBERBLOCKDEFAULT).toBe(100);
  });

  test("DEFAULTPALETTE should have correct value", () => {
    expect(DEFAULTPALETTE).toBe("turtle");
  });

  test("GUIDEURL should default to the correct URL", () => {
    expect(GUIDEURL).toBe("https://github.com/sugarlabs/turtleblocksjs/tree/master/guide/README.md");
  });

  test("TITLESTRING should be defined", () => {
    expect(TITLESTRING).toBeDefined();
  });

  test("createDefaultStack function should be callable", () => {
    expect(typeof createDefaultStack).toBe("function");
  });
});
