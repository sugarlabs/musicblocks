import StatsWindow from './statistics.js';
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
            getWidgetFrame: jest.fn().mockReturnValue({
                getBoundingClientRect: () => ({ height: 500 })
            }),
            isMaximized: jest.fn().mockReturnValue(false)
        };

        // 3. Mock window.widgetWindows
        window.widgetWindows = {
            windowFor: jest.fn().mockReturnValue(mockWidgetWindow)
        };

        // 4. Mock docById (canvas)
        global.docById = jest.fn().mockReturnValue({
            getContext: jest.fn().mockReturnValue({})
        });

        // 5. Mock analytics helpers
        global.analyzeProject = jest.fn().mockReturnValue({});
        global.runAnalytics = jest.fn();
        global.scoreToChartData = jest.fn().mockReturnValue({});
        global.getChartOptions = jest.fn().mockReturnValue({});

        // 6. Mock Chart.js
        global.Chart = jest.fn().mockImplementation(() => ({
            Radar: jest.fn()
        }));
    });

    test('displayInfo formats note statistics correctly', () => {
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

        const html = statsWindow.jsonObject.innerHTML;

        // Basic stats
        expect(html).toContain('duples: 5');
        expect(html).toContain('triplets: 2');

        // Pitch names (order-independent)
        expect(html).toContain('pitch names:');
        expect(html).toContain('A');
        expect(html).toContain('C#');
        expect(html).toContain('E');

        // Hz values (rounding-safe)
        expect(html).toMatch(/44\dHz/);
        expect(html).toMatch(/52\dHz/);
    });
});
