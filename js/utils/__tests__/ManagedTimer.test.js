const ManagedTimer = require("../ManagedTimer.js");

describe("ManagedTimer pause and resume", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(0);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("pauses and resumes a timeout from its remaining time", () => {
        const timer = new ManagedTimer();
        const callback = jest.fn();

        timer.setTimeout(callback, 1000);

        jest.advanceTimersByTime(400);
        jest.setSystemTime(400);
        timer.pauseAll();

        jest.advanceTimersByTime(1000);
        expect(callback).not.toHaveBeenCalled();

        jest.setSystemTime(1400);
        timer.resumeAll();

        jest.advanceTimersByTime(599);
        expect(callback).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledTimes(1);
    });

    test("pauses and resumes an interval without losing the next tick", () => {
        const timer = new ManagedTimer();
        const callback = jest.fn();

        timer.setInterval(callback, 500);

        jest.advanceTimersByTime(200);
        jest.setSystemTime(200);
        timer.pauseAll();

        jest.advanceTimersByTime(1000);
        expect(callback).not.toHaveBeenCalled();

        jest.setSystemTime(1200);
        timer.resumeAll();

        jest.advanceTimersByTime(299);
        expect(callback).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(500);
        expect(callback).toHaveBeenCalledTimes(2);
    });
});
