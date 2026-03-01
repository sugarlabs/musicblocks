/**
 * Unit tests for ActivityContext
 *
 * Validates: setActivity, getActivity, hasActivity, whenReady, _resetForTests,
 * idempotency, and falsy-guard behaviour.
 */

const ActivityContext = require("../activity-context");

describe("ActivityContext", () => {
    // Start each test with a clean slate.
    beforeEach(() => {
        ActivityContext._resetForTests();
    });

    // -- setActivity / getActivity -------------------------------------------

    it("should store and return the activity instance", () => {
        const mockActivity = { name: "mock" };
        ActivityContext.setActivity(mockActivity);
        expect(ActivityContext.getActivity()).toBe(mockActivity);
    });

    it("should throw when getActivity is called before setActivity", () => {
        expect(() => ActivityContext.getActivity()).toThrow(/Activity not initialized yet/);
    });

    it("should throw when setActivity receives a falsy value", () => {
        expect(() => ActivityContext.setActivity(null)).toThrow(
            /Cannot set ActivityContext with a falsy value/
        );
        expect(() => ActivityContext.setActivity(undefined)).toThrow(
            /Cannot set ActivityContext with a falsy value/
        );
        expect(() => ActivityContext.setActivity(0)).toThrow(
            /Cannot set ActivityContext with a falsy value/
        );
        expect(() => ActivityContext.setActivity("")).toThrow(
            /Cannot set ActivityContext with a falsy value/
        );
    });

    // -- idempotency ---------------------------------------------------------

    it("should be idempotent when called with the same instance", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
        const mockActivity = { name: "mock" };

        ActivityContext.setActivity(mockActivity);
        ActivityContext.setActivity(mockActivity); // same instance — no warn

        expect(spy).not.toHaveBeenCalled();
        expect(ActivityContext.getActivity()).toBe(mockActivity);
        spy.mockRestore();
    });

    it("should warn when called with a different instance", () => {
        const spy = jest.spyOn(console, "warn").mockImplementation(() => {});
        const first = { name: "first" };
        const second = { name: "second" };

        ActivityContext.setActivity(first);
        ActivityContext.setActivity(second);

        expect(spy).toHaveBeenCalledWith(expect.stringContaining("DIFFERENT instance"));
        // Still updates to the new instance.
        expect(ActivityContext.getActivity()).toBe(second);
        spy.mockRestore();
    });

    // -- hasActivity ---------------------------------------------------------

    it("should return false before setActivity is called", () => {
        expect(ActivityContext.hasActivity()).toBe(false);
    });

    it("should return true after setActivity is called", () => {
        ActivityContext.setActivity({ name: "mock" });
        expect(ActivityContext.hasActivity()).toBe(true);
    });

    // -- whenReady -----------------------------------------------------------

    it("should resolve immediately if activity is already set", async () => {
        const mockActivity = { name: "mock" };
        ActivityContext.setActivity(mockActivity);

        const result = await ActivityContext.whenReady();
        expect(result).toBe(mockActivity);
    });

    it("should resolve once setActivity is called later", async () => {
        const mockActivity = { name: "mock" };

        // Start waiting *before* setting.
        const promise = ActivityContext.whenReady();

        // Simulate async init.
        setTimeout(() => ActivityContext.setActivity(mockActivity), 10);

        const result = await promise;
        expect(result).toBe(mockActivity);
    });

    // -- _resetForTests ------------------------------------------------------

    it("should clear state so getActivity throws again", () => {
        ActivityContext.setActivity({ name: "mock" });
        ActivityContext._resetForTests();

        expect(ActivityContext.hasActivity()).toBe(false);
        expect(() => ActivityContext.getActivity()).toThrow(/Activity not initialized yet/);
    });

    it("should create a fresh whenReady promise after reset", async () => {
        const first = { name: "first" };
        const second = { name: "second" };

        ActivityContext.setActivity(first);
        ActivityContext._resetForTests();

        const promise = ActivityContext.whenReady();

        setTimeout(() => ActivityContext.setActivity(second), 10);

        const result = await promise;
        expect(result).toBe(second);
    });
});
