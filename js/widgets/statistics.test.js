const { StatsWindow } = require('./statistics');
describe('StatsWindow', () => {
    let mockActivity;
    let mockWidgetWindow;   

    beforeEach(() => {
        // Mock the Activity object
        mockActivity = {
            blocks: { showBlocks: jest.fn(), hideBlocks: jest.fn(), activeBlock: null },
            logo: { statsWindow: null },
            loading: false,
            showBlocksAfterRun: true
        };

        // Mock the Widget Window
        mockWidgetWindow = {
            clear: jest.fn(),
            show: jest.fn(),
            destroy: jest.fn(),
            sendToCenter: jest.fn(),
            onclose: null,
            onmaximize: null,
            getWidgetBody: jest.fn().mockReturnValue(document.createElement('div')),
            getWidgetFrame: jest.fn().mockReturnValue({ getBoundingClientRect: () => ({ height: 500 }) }),
            isMaximized: jest.fn().mockReturnValue(false)
        };

        // Mock window.widgetWindows
        window.widgetWindows = {
            windowFor: jest.fn().mockReturnValue(mockWidgetWindow)
        };

        // Mock docById to return a fake canvas
        global.docById = jest.fn().mockReturnValue({
            getContext: jest.fn().mockReturnValue({})
        });

        // Mock external analytics functions
        global.analyzeProject = jest.fn().mockReturnValue({});
        global.runAnalytics = jest.fn();
        global.scoreToChartData = jest.fn().mockReturnValue({});
        global.getChartOptions = jest.fn().mockReturnValue({});

        // Mock Chart.js
        global.Chart = jest.fn().mockImplementation(() => ({
            Radar: jest.fn()
        }));
    });

    test('displayInfo formats note statistics and Hz calculations correctly', () => {
        const statsWindow = new StatsWindow(mockActivity);

        const mockStats = {
            duples: 5,
            triplets: 2,
            quintuplets: 0,
            pitchNames: new Set(['A', 'C#', 'E']),
            numberOfNotes: 20,
            lowestNote: ['A4', 60, 440],
            highestNote: ['C5', 72, 523.25],
            rests: 4,
            ornaments: 1
        };

        statsWindow.displayInfo(mockStats);

        const outputHtml = statsWindow.jsonObject.innerHTML;

        expect(outputHtml).toContain('441Hz');
        expect(outputHtml).toContain('524Hz');
        expect(outputHtml).toContain('duples: 5');
        expect(outputHtml).toContain('triplets: 2');
        expect(outputHtml).toContain('pitch names: A, C#, E');
    });
});
