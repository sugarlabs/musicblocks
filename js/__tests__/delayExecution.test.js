const { delayExecution } = require("../utils/utils");

describe("delayExecution utility", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("resolves after specified delay", async () => {
        const promise = delayExecution(1000);

        jest.advanceTimersByTime(1000);

        await expect(promise).resolves.toBe(true);
    });

    test("multiple calls resolve independently", async () => {
        const p1 = delayExecution(500);
        const p2 = delayExecution(1000);

        jest.advanceTimersByTime(500);
        await expect(p1).resolves.toBe(true);

        jest.advanceTimersByTime(500);
        await expect(p2).resolves.toBe(true);
    });
});
