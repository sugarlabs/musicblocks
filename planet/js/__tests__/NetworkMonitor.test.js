// Copyright (c) 2026 @xtroon (Ome Tiwari)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

"use strict";

const NetworkMonitor = require("../NetworkMonitor");

describe("NetworkMonitor", () => {
    let originalFetch;
    let originalOnLine;
    let originalBackendUrl;
    let mockFetch;

    const setNavigatorOnLine = value => {
        Object.defineProperty(global.navigator, "onLine", {
            value,
            configurable: true,
            writable: true
        });
    };

    beforeEach(() => {
        jest.useFakeTimers();
        originalFetch = global.fetch;
        originalOnLine = Object.getOwnPropertyDescriptor(global.navigator, "onLine");
        originalBackendUrl = window.MB_GIT_BACKEND_URL;

        setNavigatorOnLine(true);

        mockFetch = jest.fn().mockResolvedValue({ ok: true, status: 200 });
        global.fetch = mockFetch;

        jest.spyOn(console, "debug").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        global.fetch = originalFetch;

        if (originalOnLine) {
            Object.defineProperty(global.navigator, "onLine", originalOnLine);
        }

        if (originalBackendUrl !== undefined) {
            window.MB_GIT_BACKEND_URL = originalBackendUrl;
        } else {
            delete window.MB_GIT_BACKEND_URL;
        }

        jest.restoreAllMocks();
    });

    describe("Initialization and probe URL configuration", () => {
        test("uses default probe URL if none is provided and MB_GIT_BACKEND_URL is not set", () => {
            delete window.MB_GIT_BACKEND_URL;
            const monitor = new NetworkMonitor();
            expect(monitor._probeUrl).toBe("https://git-planet.sugarlabs.org/health");
            monitor.destroy();
        });

        test("uses MB_GIT_BACKEND_URL when available, trimming trailing slashes", () => {
            window.MB_GIT_BACKEND_URL = "https://custom.planet.org/";
            const monitor = new NetworkMonitor();
            expect(monitor._probeUrl).toBe("https://custom.planet.org/health");
            monitor.destroy();
        });

        test("uses explicit probeUrl parameter if passed", () => {
            const monitor = new NetworkMonitor(null, null, "https://my-server.com/ping");
            expect(monitor._probeUrl).toBe("https://my-server.com/ping");
            monitor.destroy();
        });

        test("initializes cached isOnline from navigator.onLine", () => {
            setNavigatorOnLine(false);
            const monitor = new NetworkMonitor();
            expect(monitor.isOnline).toBe(false);
            monitor.destroy();
        });

        test("fires initial probe on instantiation", () => {
            const monitor = new NetworkMonitor();
            expect(mockFetch).toHaveBeenCalledTimes(1);
            expect(mockFetch).toHaveBeenCalledWith(
                "https://git-planet.sugarlabs.org/health",
                expect.objectContaining({
                    method: "HEAD",
                    cache: "no-store",
                    signal: expect.any(Object)
                })
            );
            monitor.destroy();
        });
    });

    describe("State transitions and callbacks", () => {
        test("calls onOnline when state transitions from offline to online", async () => {
            setNavigatorOnLine(false);
            const onOnline = jest.fn();
            const onOffline = jest.fn();

            mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

            const monitor = new NetworkMonitor(onOnline, onOffline);
            expect(monitor.isOnline).toBe(false);

            await Promise.resolve();

            expect(monitor.isOnline).toBe(true);
            expect(onOnline).toHaveBeenCalledTimes(1);
            expect(onOffline).not.toHaveBeenCalled();

            monitor.destroy();
        });

        test("calls onOffline when probe fails and state transitions from online to offline", async () => {
            setNavigatorOnLine(true);
            const onOnline = jest.fn();
            const onOffline = jest.fn();

            mockFetch.mockRejectedValueOnce(new Error("Network error"));

            const monitor = new NetworkMonitor(onOnline, onOffline);
            expect(monitor.isOnline).toBe(true);

            await Promise.resolve();

            expect(monitor.isOnline).toBe(false);
            expect(onOffline).toHaveBeenCalledTimes(1);
            expect(onOnline).not.toHaveBeenCalled();

            monitor.destroy();
        });

        test("does not call callbacks if probe result matches current cached state", async () => {
            setNavigatorOnLine(true);
            const onOnline = jest.fn();
            const onOffline = jest.fn();

            mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

            const monitor = new NetworkMonitor(onOnline, onOffline);
            await Promise.resolve();

            expect(monitor.isOnline).toBe(true);
            expect(onOnline).not.toHaveBeenCalled();
            expect(onOffline).not.toHaveBeenCalled();

            monitor.destroy();
        });

        test("handles undefined callbacks gracefully when transitioning state", async () => {
            setNavigatorOnLine(false);
            mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

            const monitor = new NetworkMonitor();
            await Promise.resolve();

            expect(monitor.isOnline).toBe(true);
            monitor.destroy();
        });
    });

    describe("Probe timeout handling", () => {
        test("aborts fetch and marks offline if request times out after 4 seconds", async () => {
            let abortSignal;
            mockFetch.mockImplementation((url, options) => {
                abortSignal = options.signal;
                return new Promise((resolve, reject) => {
                    abortSignal.addEventListener("abort", () => {
                        reject(new Error("The user aborted a request."));
                    });
                });
            });

            setNavigatorOnLine(true);
            const onOffline = jest.fn();
            const monitor = new NetworkMonitor(null, onOffline);

            jest.advanceTimersByTime(4000);
            await Promise.resolve();

            expect(monitor.isOnline).toBe(false);
            expect(onOffline).toHaveBeenCalledTimes(1);

            monitor.destroy();
        });
    });

    describe("Window events and periodic polling", () => {
        test("triggers probe on window online event", async () => {
            const monitor = new NetworkMonitor();
            expect(mockFetch).toHaveBeenCalledTimes(1);

            window.dispatchEvent(new Event("online"));
            expect(mockFetch).toHaveBeenCalledTimes(2);

            monitor.destroy();
        });

        test("triggers probe on window offline event", async () => {
            const monitor = new NetworkMonitor();
            expect(mockFetch).toHaveBeenCalledTimes(1);

            window.dispatchEvent(new Event("offline"));
            expect(mockFetch).toHaveBeenCalledTimes(2);

            monitor.destroy();
        });

        test("polls probe periodically every 30 seconds", () => {
            const monitor = new NetworkMonitor();
            expect(mockFetch).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(30000);
            expect(mockFetch).toHaveBeenCalledTimes(2);

            jest.advanceTimersByTime(30000);
            expect(mockFetch).toHaveBeenCalledTimes(3);

            monitor.destroy();
        });
    });

    describe("forceProbe", () => {
        test("forces a fresh probe and returns the boolean result", async () => {
            const monitor = new NetworkMonitor();
            expect(mockFetch).toHaveBeenCalledTimes(1);

            mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
            const resultOnline = await monitor.forceProbe();
            expect(resultOnline).toBe(true);

            mockFetch.mockRejectedValueOnce(new Error("Connection refused"));
            const resultOffline = await monitor.forceProbe();
            expect(resultOffline).toBe(false);

            monitor.destroy();
        });
    });

    describe("destroy", () => {
        test("cleans up event listeners and polling interval", () => {
            const monitor = new NetworkMonitor();
            expect(mockFetch).toHaveBeenCalledTimes(1);

            monitor.destroy();

            window.dispatchEvent(new Event("online"));
            window.dispatchEvent(new Event("offline"));
            expect(mockFetch).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(60000);
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });
});
