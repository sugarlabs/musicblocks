const setupOrnamentActions = require('../OrnamentActions');
describe('OrnamentActions', () => {
    let activity, turtleMock;

    beforeEach(() => {
        global.Singer = {
            OrnamentActions: null,
        };

        turtleMock = {
            singer: {
                staccato: [],
                justCounting: [],
                inNeighbor: [],
                neighborStepPitch: [],
                neighborNoteValue: [],
            },
        };

        activity = {
            turtles: {
                ithTurtle: jest.fn(() => turtleMock),
            },
            blocks: {
                blockList: { 1: {} }, 
            },
            logo: {
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn(),
                notation: {
                    notationBeginSlur: jest.fn(),
                    notationEndSlur: jest.fn(),
                },
            },
        };

        global.MusicBlocks = { isRun: true }; 
        global.Mouse = {
            getMouseFromTurtle: jest.fn(() => ({
                MB: { listeners: [] },
            })),
        };
        setupOrnamentActions(activity);
    });

    test('setStaccato sets up staccato properly', () => {
        Singer.OrnamentActions.setStaccato(2, 0, 1);
        expect(turtleMock.singer.staccato).toContain(1 / 2);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, '_staccato_0');
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
            0,
            '_staccato_0',
            expect.any(Function)
        );
    });

    test('setSlur sets up slur properly', () => {
        Singer.OrnamentActions.setSlur(2, 0, 1);
        expect(turtleMock.singer.staccato).toContain(-1 / 2);
        expect(activity.logo.notation.notationBeginSlur).toHaveBeenCalledWith(0);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, '_staccato_0');
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
            0,
            '_staccato_0',
            expect.any(Function)
        );
    });

    test('doNeighbor sets up neighbor action properly', () => {
        Singer.OrnamentActions.doNeighbor(3, 4, 0, 1);
        expect(turtleMock.singer.inNeighbor).toContain(1);
        expect(turtleMock.singer.neighborStepPitch).toContain(3);
        expect(turtleMock.singer.neighborNoteValue).toContain(4);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, '_neighbor_0_1');
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
            0,
            '_neighbor_0_1',
            expect.any(Function)
        );
    });
});

