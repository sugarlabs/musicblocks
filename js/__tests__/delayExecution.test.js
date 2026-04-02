const { delayExecution } = require("../utils/utils");

describe("delayExecution utility", () => {

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("resolves after specified delay", async () => {
    const promise = delayExecution(1000);

    jest.advanceTimersByTime(1000);

    await expect(promise).resolves.toBe(true);
  });

  test("does not resolve before delay", async () => {
    const promise = delayExecution(1000);

    let resolved = false;
    promise.then(() => resolved = true);

    jest.advanceTimersByTime(500);

    await Promise.resolve();

    expect(resolved).toBe(false);
  });

  test("multiple delayExecution calls work independently", async () => {
    const p1 = delayExecution(500);
    const p2 = delayExecution(1000);

    jest.advanceTimersByTime(500);
    await expect(p1).resolves.toBe(true);

    jest.advanceTimersByTime(500);
    await expect(p2).resolves.toBe(true);
  });

});
