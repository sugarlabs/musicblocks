// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const NetworkMonitor = require("../NetworkMonitor");

describe("NetworkMonitor", () => {
    let originalFetch;
    let monitor;

    beforeEach(() => {
        originalFetch = global.fetch;
        jest.useFakeTimers();
    });

    afterEach(() => {
        monitor?.destroy();
        global.fetch = originalFetch;
        jest.useRealTimers();
    });

    test("ignores an older probe result after a newer probe reports offline", async () => {
        const requests = [];
        global.fetch = jest
            .fn()
            .mockResolvedValueOnce({ ok: true })
            .mockImplementation(
                () => new Promise((resolve, reject) => requests.push({ resolve, reject }))
            );
        const onOnline = jest.fn();
        const onOffline = jest.fn();
        monitor = new NetworkMonitor(onOnline, onOffline, "/health");
        await Promise.resolve();

        const older = monitor.forceProbe();
        const newer = monitor.forceProbe();

        requests[1].reject(new Error("offline"));
        await newer;
        expect(monitor.isOnline).toBe(false);
        expect(onOffline).toHaveBeenCalledTimes(1);

        requests[0].resolve({ ok: true });
        await older;
        expect(monitor.isOnline).toBe(false);
        expect(onOnline).not.toHaveBeenCalled();
    });
});
