const { createWidgetLifecycle } = require("../ai-widget-lifecycle");

describe("ai-widget-lifecycle", () => {
    let lifecycle;
    let isActive;

    beforeEach(() => {
        global.fetch = jest.fn();
        isActive = jest.fn(() => true);
        lifecycle = createWidgetLifecycle({}, isActive);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("starts unmounted with no pending requests", () => {
        expect(lifecycle.isMounted).toBe(false);
        expect(lifecycle.pendingRequests.size).toBe(0);
        expect(lifecycle.isWidgetActive()).toBe(false);
    });

    it("reports active only while mounted and the callback passes", () => {
        lifecycle.isMounted = true;
        expect(lifecycle.isWidgetActive()).toBe(true);

        isActive.mockReturnValue(false);
        expect(lifecycle.isWidgetActive()).toBe(false);
    });

    it("aborts and clears pending requests", () => {
        const abortSpy = jest.fn();
        lifecycle.pendingRequests.add({ abort: abortSpy });

        lifecycle.abortPendingRequests();

        expect(abortSpy).toHaveBeenCalled();
        expect(lifecycle.pendingRequests.size).toBe(0);
    });

    it("tracks in-flight requests and releases them on success", async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ result: "ok" })
        });

        const promise = lifecycle.postJSON("http://localhost/api", { a: 1 });
        expect(lifecycle.pendingRequests.size).toBe(1);

        await expect(promise).resolves.toEqual({ result: "ok" });
        expect(lifecycle.pendingRequests.size).toBe(0);
    });

    it("releases a request after a network failure", async () => {
        global.fetch.mockRejectedValue(new Error("network down"));

        await expect(
            lifecycle.postJSON("http://localhost/api", {}, undefined, "request failed")
        ).resolves.toEqual({ error: "request failed" });
        expect(lifecycle.pendingRequests.size).toBe(0);
    });

    it("releases a request after an abort", async () => {
        global.fetch.mockImplementation(
            () =>
                new Promise((resolve, reject) => {
                    const controller = lifecycle.pendingRequests.values().next().value;
                    controller.signal.addEventListener("abort", () => {
                        const error = new Error("aborted");
                        error.name = "AbortError";
                        reject(error);
                    });
                })
        );

        const promise = lifecycle.postJSON("http://localhost/api", {});
        lifecycle.abortPendingRequests();

        await expect(promise).resolves.toBeNull();
        expect(lifecycle.pendingRequests.size).toBe(0);
    });

    describe("with fake timers", () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it("aborts a stalled request after the timeout and returns the error value", async () => {
            global.fetch.mockImplementation(
                () =>
                    new Promise((resolve, reject) => {
                        const controller = lifecycle.pendingRequests.values().next().value;
                        controller.signal.addEventListener("abort", () => {
                            const error = new Error("aborted");
                            error.name = "AbortError";
                            reject(error);
                        });
                    })
            );

            const promise = lifecycle.postJSON("http://localhost/api", {}, 1000, "timed out");

            const assertion = expect(promise).resolves.toEqual({ error: "timed out" });
            await Promise.resolve();
            jest.advanceTimersByTime(1001);
            await assertion;
        });

        it("throws on timeout when throwOnError is set", async () => {
            global.fetch.mockImplementation(
                () =>
                    new Promise((resolve, reject) => {
                        const controller = lifecycle.pendingRequests.values().next().value;
                        controller.signal.addEventListener("abort", () => {
                            const error = new Error("aborted");
                            error.name = "AbortError";
                            reject(error);
                        });
                    })
            );

            const promise = lifecycle.postJSON("http://localhost/api", {}, 1000, null, true);

            const assertion = expect(promise).rejects.toThrow();
            await Promise.resolve();
            jest.advanceTimersByTime(1001);
            await assertion;
        });
    });

    it("throws on HTTP error when throwOnError is set", async () => {
        global.fetch.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            json: async () => ({})
        });

        await expect(
            lifecycle.postJSON("http://localhost/api", {}, null, null, true)
        ).rejects.toThrow("HTTP 500: Internal Server Error");
    });
});
