/* eslint-disable no-undef */

global._THIS_IS_MUSIC_BLOCKS_ = true;

// Mock base block classes
class MockBlock {
  setup = jest.fn();
}

global.FlowBlock = MockBlock;
global.StackClampBlock = MockBlock;

// Mock widgets and utilities
global.MeterWidget = jest.fn();
global.TemperamentWidget = jest.fn();
global.TimbreWidget = jest.fn();
global.ModeWidget = jest.fn();
global.Tempo = jest.fn();
global.PitchDrumMatrix = jest.fn();
global.PhraseMaker = jest.fn();
global.StatusMatrix = jest.fn();
global.RhythmRuler = jest.fn();
global.PitchSlider = jest.fn();
global.MusicKeyboard = jest.fn();
global.PitchStaircase = jest.fn();
global.SampleWidget = jest.fn();
global.Arpeggio = jest.fn();
global.Oscilloscope = jest.fn();
global.LegoWidget = jest.fn();
global.AIDebuggerWidget = jest.fn();
global.ReflectionMatrix = jest.fn();

// Globals and helpers
global._ = s => s;
global.last = arr => arr[arr.length - 1];
global.NOINPUTERRORMSG = "No input";
global.DEFAULTVOICE = "default";
global.DEFAULTMODE = "major";
global.DEFAULTFILTERTYPE = "lowpass";
global.FILTERTYPES = {};
global.instrumentsEffects = {};
global.instrumentsFilters = {};

// Import the file (defines setupWidgetBlocks globally)
require("../WidgetBlocks");




const mockActivity = () => ({
  beginnerMode: false,
  lang: "en",
  turtles: {
    turtleList: [],
    getTurtleCount: () => 0,
    getTurtle: () => ({})
  },
  blocks: {
    blockList: {}
  },
  errorMsg: jest.fn()
});

describe("WidgetBlocks", () => {
  test("WidgetBlocks file loads without throwing", () => {
    expect(() => {
      require("../WidgetBlocks");
    }).not.toThrow();
  });
});

 

