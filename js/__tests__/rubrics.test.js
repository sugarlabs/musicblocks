global._ = (str) => str;
const {
    TACAT,
    TAPAL,
    TASCORE,
    PALS,
    PALLABELS,
    analyzeProject,
    scoreToChartData,
    getChartOptions,
    runAnalytics,
    getStatsFromNotation
} = require('../rubrics');
const { isCustomTemperament } = require('../utils/musicutils');

global.last = jest.fn();
global.isCustomTemperament = isCustomTemperament;
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

jest.mock('../utils/musicutils', () => ({
    isCustomTemperament: jest.fn(() => false),
    getTemperament: jest.fn(() => [])
}));
jest.mock('../utils/utils.js', () => ({
    _: jest.fn((str) => str)
}));

describe('rubrics.js test suite', () => {
    
    describe('analyzeProject', () => {
        it('should return an array of scores', () => {
            const activity = {
                blocks: {
                    blockList: [
                        { name: "note", connections: [null, {}] },
                        { name: "setbpm", connections: [null, {}, {}] },
                        { name: "random", connections: [null] }
                    ]
                }
            };
            const result = analyzeProject(activity);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(PALS.length);
        });

        it('should ignore blocks in trash', () => {
            const activity = {
                blocks: {
                    blockList: [
                        { name: "note", trash: true, connections: [null, {}] },
                        { name: "setbpm", trash: false, connections: [null, {}, {}] }
                    ]
                }
            };
            const result = analyzeProject(activity);
            expect(result).toBeInstanceOf(Array);
        });
    });

    describe('scoreToChartData', () => {
        it('should return a properly formatted chart data object', () => {
            const scores = [10, 20, 30, 40, 50];
            const chartData = scoreToChartData(scores);

            expect(chartData).toHaveProperty('labels');
            expect(chartData).toHaveProperty('datasets');
            expect(Array.isArray(chartData.labels)).toBe(true);
            expect(chartData.datasets).toHaveLength(1);
            expect(chartData.datasets[0]).toHaveProperty('data');
            expect(chartData.datasets[0].data.length).toBe(scores.length);
        });
    });

    describe('getChartOptions', () => {
        it('should return an object with correct chart settings', () => {
            const callback = jest.fn();
            const options = getChartOptions(callback);

            expect(options).toHaveProperty('onAnimationComplete', callback);
            expect(options).toHaveProperty('scaleShowLine', true);
            expect(options).toHaveProperty('datasetFill', true);
        });
    });

    describe('runAnalytics', () => {
        it('should set correct properties on logo object', () => {
            const activity = {
                logo: {
                    runningLilypond: false,
                    collectingStats: false,
                    notation: {
                        notationStaging: {},
                        notationDrumStaging: {}
                    },
                    runLogoCommands: jest.fn()
                },
                turtles: {
                    turtleList: [
                        { painter: { doClear: jest.fn() } }
                    ],
                    getTurtleCount: jest.fn(() => 1),
                    getTurtle: jest.fn((id) => ({
                    painter: { doClear: jest.fn() }
                }))
                }
            };

            runAnalytics(activity);
            
            expect(activity.logo.runningLilypond).toBe(true);
            expect(activity.logo.collectingStats).toBe(true);
            expect(activity.logo.runLogoCommands).toHaveBeenCalled();
        });
    });

    describe('getStatsFromNotation', () => {
        it('should return an object with musical statistics', () => {
            const activity = {
                logo: {
                    notation: {
                        notationStaging: {
                            0: [["C4", "D4"], 3],
                            1: [["E4", "F4"], 5]
                        }
                    },
                    synth: {
                        inTemperament: false,
                        _getFrequency: jest.fn((note) => note.length * 100)
                    }
                },
                blocks: {
                    blockList: [{ name: "rest2", trash: false, protoblock: { palette: { name: "ornaments" } } }]
                }
            };

            const stats = getStatsFromNotation(activity);

            expect(stats).toHaveProperty('numberOfNotes');
            expect(stats.numberOfNotes).toBeGreaterThan(0);
            expect(stats).toHaveProperty('rests', 1);
            expect(stats).toHaveProperty('ornaments', 1);
        });
    });

});
