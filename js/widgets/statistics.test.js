const StatsWindow = require('./statistics.js');

describe('StatsWindow', () => {
    let mockActivity;
    let mockWidgetWindow;

    beforeEach(() => {
        // 1. Mock the Activity object
        mockActivity = {
            blocks: { showBlocks: jest.fn(), hideBlocks: jest.fn(), activeBlock: null },
            logo: { statsWindow: null },
            loading: false,
            showBlocksAfterRun: true
        };

        // 2. Mock the Widget Window
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

        // 3. Mock window.widgetWindows
        window.widgetWindows = {
            windowFor: jest.fn().mockReturnValue(mockWidgetWindow)
        };

        // 4. CRITICAL FIX: Mock docById to return a fake Canvas with getContext
        global.docById = jest.fn().mockReturnValue({
            getContext: jest.fn().mockReturnValue({
                // Fake context methods if needed (not strictly needed for this test)
            })
        });

        // 5. Mock external analysis functions (global scope)
        global.analyzeProject = jest.fn().mockReturnValue({});
        global.runAnalytics = jest.fn();
        global.scoreToChartData = jest.fn().mockReturnValue({});
        global.getChartOptions = jest.fn().mockReturnValue({});
        
        // Mock the Chart.js library
        global.Chart = jest.fn().mockImplementation(() => ({
            Radar: jest.fn()
        }));
    });

    test('displayInfo should correctly format note statistics and Hz calculations', () => {
        const statsWindow = new StatsWindow(mockActivity);

        // Prepare dummy data
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

        // Run the function
        statsWindow.displayInfo(mockStats);

        // Check results
        const outputHtml = statsWindow.jsonObject.innerHTML;

        expect(outputHtml).toContain('441Hz'); // 440 + 0.5 rounded
        expect(outputHtml).toContain('524Hz'); // 523.25 + 0.5 rounded
        expect(outputHtml).toContain('duples: 5');
        expect(outputHtml).toContain('triplets: 2');
        expect(outputHtml).toContain('pitch names: A, C#, E');
    });
});