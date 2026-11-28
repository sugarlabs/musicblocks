"use strict";

const NetworkMonitor = require("../NetworkMonitor");
global.NetworkMonitor = NetworkMonitor;
const OfflineCommitManager = require("../OfflineCommitManager");

test("retries an offline draft when an unhealthy backend recovers", async () => {
    const originalFetch = global.fetch;
    const originalOnline = Object.getOwnPropertyDescriptor(navigator, "onLine");
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    const draft = { id: "draft", status: "pending", data: "song", timestamp: 1 };
    const storage = {
        data: {
            Projects: {
                p: { GitRepoData: { repoName: "song", hashedKey: "key" }, commitDrafts: [draft] }
            }
        },
        dataLoaded: Promise.resolve(),
        updateDraftStatus: jest.fn(async () => {
            draft.status = "synced";
        }),
        setCachedCommits: jest.fn(async () => {}),
        removeSyncedDrafts: jest.fn(async () => {})
    };
    const server = {
        editProject: jest.fn((repo, key, data, message, callback) =>
            callback({ success: true, sha: "sha" })
        ),
        getCommitHistory: jest.fn((repo, callback) => callback({ success: true, data: [] }))
    };
    const manager = new OfflineCommitManager(storage, server);
    try {
        await Promise.resolve();
        expect(manager.isOnline).toBe(false);
        expect(server.editProject).not.toHaveBeenCalled();
        global.fetch.mockResolvedValue({ ok: true, status: 200 });
        const sync = jest.spyOn(manager, "_onOnline");
        await manager._monitor.forceProbe();
        await sync.mock.results[0].value;
        expect(server.editProject).toHaveBeenCalledTimes(1);
        expect(draft.status).toBe("synced");
    } finally {
        manager.destroy();
        global.fetch = originalFetch;
        if (originalOnline) Object.defineProperty(navigator, "onLine", originalOnline);
        else delete navigator.onLine;
    }
});
