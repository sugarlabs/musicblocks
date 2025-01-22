const setupDictActions = require('../DictActions');
describe('setupDictActions', () => {
  let activity;
  let turtle;
  let targetTurtle;

  beforeAll(() => {
    global.Turtle = {
      DictActions: {}
    };

    global._ = jest.fn((key) => key); 
  });

  beforeEach(() => {
    activity = {
      turtles: {
        ithTurtle: jest.fn(),
        screenX2turtleX: jest.fn(),
        screenY2turtleY: jest.fn(),
      },
      logo: {
        turtleDicts: {}
      },
      textMsg: jest.fn()
    };

    turtle = 0;
    targetTurtle = {
      painter: {
        color: 'red',
        value: 10,
        chroma: 0.5,
        pensize: 2,
        font: 'Arial',
        orientation: 90,
        doSetColor: jest.fn(),
        doSetValue: jest.fn(),
        doSetChroma: jest.fn(),
        doSetPensize: jest.fn(),
        doSetFont: jest.fn(),
        doSetHeading: jest.fn(),
        doSetXY: jest.fn()
      },
      container: {
        x: 100,
        y: 200
      },
      singer: {
        notesPlayed: [1, 2],
        lastNotePlayed: ['C4'],
        notePitches: ['C'],
        noteOctaves: [4],
        keySignature: 'C',
        movable: true,
        pitchNumberOffset: 0
      }
    };
    activity.turtles.ithTurtle.mockReturnValue(targetTurtle);
    activity.turtles.screenX2turtleX.mockReturnValue(100);
    activity.turtles.screenY2turtleY.mockReturnValue(200);
    setupDictActions(activity);
  });

  it('should set the turtle color correctly', () => {
    Turtle.DictActions.SetDictValue(0, turtle, 'color', 'blue');
    expect(targetTurtle.painter.doSetColor).toHaveBeenCalledWith('blue');
  });

  it('should get the turtle color correctly', () => {
    const color = Turtle.DictActions._GetDict(0, turtle, 'color');
    expect(color).toBe('red');
  });

  it('should return error message if dictionary does not exist', () => {
    activity.logo.turtleDicts[turtle] = {};
    const result = Turtle.DictActions.getValue('nonexistentDict', 'color', turtle);
    expect(result).toBe('Dictionary with this name does not exist');
  });

  it('should set and get values in the turtle dictionary', () => {
    activity.logo.turtleDicts[turtle] = {};
    Turtle.DictActions.setValue('customDict', 'color', 'green', turtle);
    expect(activity.logo.turtleDicts[turtle].customDict.color).toBe('green');
    const value = Turtle.DictActions.getValue('customDict', 'color', turtle);
    expect(value).toBe('green');
  });
});
