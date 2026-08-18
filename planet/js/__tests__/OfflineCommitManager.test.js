// Copyright (c) 2026 Harihara Vardhan
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

// Mock NetworkMonitor before requiring OfflineCommitManager
class MockNetworkMonitor {
    constructor(onOnline, onOffline) {
        this.onOnline = onOnline;
        this.onOffline = onOffline;
        this.isOnline = true;
    }
    destroy() {}
}
global.NetworkMonitor = MockNetworkMonitor;

const OfflineCommitManager = require("../OfflineCommitManager");

describe("OfflineCommitManager", () => {
    let storage;
    let server;
    let manager;
    let postedMessages;

    beforeEach(() => {
        postedMessages = [];
        const mockPostMessage = jest.fn(msg => postedMessages.push(msg));
        global.window.parent = {
            postMessage: mockPostMessage
        };

        storage = {
            data: {
                Projects: {
                    p1: {
                        ProjectName: "My Jazz Project",
                        ProjectData: { blocks: ["sample1"] },
                        GitRepoData: {
                            repoName: "my-jazz-project-12345678",
                            hashedKey: "hashed-key-p1"
                        },
                        commitDrafts: [],
                        cachedCommits: [],
                        pendingRepoCreation: null
                    }
                }
            },
            dataLoaded: Promise.resolve(),
            addCommitDraft: jest.fn(async (id, draft) => {
                const proj = storage.data.Projects[id];
                if (!proj) return false;
                if (!proj.commitDrafts) proj.commitDrafts = [];
                const pending = proj.commitDrafts.filter(d => d.status === "pending").length;
                if (pending >= 5) return false;
                proj.commitDrafts.push(draft);
                return true;
            }),
            setPendingRepoCreation: jest.fn(async (id, details) => {
                storage.data.Projects[id].pendingRepoCreation = {
                    ...details,
                    status: "pending"
                };
            }),
            clearPendingRepoCreation: jest.fn(async id => {
                if (storage.data.Projects[id]) {
                    storage.data.Projects[id].pendingRepoCreation = null;
                }
            }),
            addGitRepoData: jest.fn(async (id, repoName, desc, tags, key) => {
                storage.data.Projects[id].GitRepoData = {
                    repoName,
                    description: desc,
                    tags,
                    hashedKey: key
                };
            }),
            getCachedCommits: jest.fn(id => storage.data.Projects[id]?.cachedCommits || []),
            setCachedCommits: jest.fn(async (id, commits) => {
                storage.data.Projects[id].cachedCommits = commits.slice(0, 3);
            }),
            updateDraftStatus: jest.fn(async (id, draftId, status, sha) => {
                const draft = (storage.data.Projects[id]?.commitDrafts || []).find(
                    d => d.id === draftId
                );
                if (draft) {
                    draft.status = status;
                    if (sha) draft.sha = sha;
                }
            })
        };

        server = {
            addProject: jest.fn(),
            editProject: jest.fn(),
            getCommitHistory: jest.fn()
        };

        manager = new OfflineCommitManager(storage, server);
    });

    afterEach(() => {
        manager.destroy();
    });

    describe("Naming and UUID helpers", () => {
        test("_buildRepoName sanitizes names and adds a unique suffix", () => {
            const name1 = manager._buildRepoName("My Cool Song! (v1.0)");
            expect(name1).toMatch(/^My-Cool-Song-v1.0-[0-9a-f]{8}$/);

            const name2 = manager._buildRepoName("");
            expect(name2).toMatch(/^untitled-[0-9a-f]{8}$/);
        });

        test("_uuid returns a valid v4 UUID string", () => {
            const id = manager._uuid();
            expect(typeof id).toBe("string");
            expect(id.length).toBe(36);
            expect(id).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            );
        });
    });

    describe("Draft Saving & 5-Draft Cap", () => {
        test("saveDraft successfully saves when under the 5-draft cap", async () => {
            const res = await manager.saveDraft("p1", { note: "C4" }, "first offline edit");

            expect(res.saved).toBe(true);
            expect(storage.addCommitDraft).toHaveBeenCalledWith(
                "p1",
                expect.objectContaining({
                    message: "first offline edit",
                    data: { note: "C4" },
                    status: "pending",
                    sha: null
                })
            );
            expect(storage.data.Projects.p1.commitDrafts.length).toBe(1);
        });

        test("saveDraft enforces the 5-draft cap and rejects when full", async () => {
            // Fill up with 5 drafts
            for (let i = 1; i <= 5; i++) {
                storage.data.Projects.p1.commitDrafts.push({
                    id: `draft-${i}`,
                    message: `Draft ${i}`,
                    status: "pending",
                    timestamp: Date.now() + i
                });
            }

            const res = await manager.saveDraft("p1", { note: "D4" }, "6th draft");

            expect(res.saved).toBe(false);
            expect(res.reason).toBe("cap");
            expect(storage.data.Projects.p1.commitDrafts.length).toBe(5);
        });
    });

    describe("Offline Repo Creation", () => {
        test("queueRepoCreation stores pendingRepoCreation and assigns placeholder GitRepoData", async () => {
            storage.data.Projects.p2 = {
                ProjectName: "Brand New Track",
                ProjectData: {},
                commitDrafts: []
            };

            const details = {
                projectName: "Brand New Track",
                description: "Beats",
                tags: ["music", "jazz"],
                creatorName: "Student A",
                thumbnail: "data:image/png;base64,abc"
            };

            const res = await manager.queueRepoCreation("p2", details);

            expect(res.success).toBe(true);
            expect(res.offline).toBe(true);
            expect(res.repository).toMatch(/^Brand-New-Track-[0-9a-f]{8}$/);

            expect(storage.setPendingRepoCreation).toHaveBeenCalledWith(
                "p2",
                expect.objectContaining({
                    projectName: "Brand New Track",
                    repoName: res.repository
                })
            );

            expect(storage.addGitRepoData).toHaveBeenCalledWith(
                "p2",
                res.repository,
                "Beats",
                ["music", "jazz"],
                ""
            );
        });
    });

    describe("Syncing Pending Commits", () => {
        test("syncPending pushes all pending drafts sequentially oldest-first", async () => {
            const draft1 = {
                id: "d1",
                message: "Added chords",
                data: { step: 1 },
                timestamp: 1000,
                status: "pending"
            };
            const draft2 = {
                id: "d2",
                message: "Added drums",
                data: { step: 2 },
                timestamp: 2000,
                status: "pending"
            };
            storage.data.Projects.p1.commitDrafts = [draft2, draft1]; // out of order

            server.editProject.mockImplementation((repo, key, data, msg, cb) => {
                if (msg === "Added chords") {
                    cb({ success: true, sha: "sha-chords-1" });
                } else if (msg === "Added drums") {
                    cb({ success: true, sha: "sha-drums-2" });
                }
            });

            server.getCommitHistory.mockImplementation((repo, cb) => {
                cb({
                    success: true,
                    data: [
                        { sha: "sha-drums-2", message: "Added drums", date: "2026-08-18" },
                        { sha: "sha-chords-1", message: "Added chords", date: "2026-08-18" }
                    ]
                });
            });

            const result = await manager.syncPending(
                "p1",
                "my-jazz-project-12345678",
                "hashed-key-p1"
            );

            expect(result.success).toBe(true);
            expect(result.synced).toBe(2);

            expect(server.editProject).toHaveBeenCalledTimes(2);
            expect(server.editProject.mock.calls[0][3]).toBe("Added chords"); // oldest first
            expect(server.editProject.mock.calls[1][3]).toBe("Added drums");

            expect(storage.updateDraftStatus).toHaveBeenCalledWith(
                "p1",
                "d1",
                "synced",
                "sha-chords-1"
            );
            expect(storage.updateDraftStatus).toHaveBeenCalledWith(
                "p1",
                "d2",
                "synced",
                "sha-drums-2"
            );
        });

        test("syncPending halts on first failure without corrupting remaining drafts", async () => {
            const draft1 = {
                id: "d1",
                message: "Added chords",
                data: { step: 1 },
                timestamp: 1000,
                status: "pending"
            };
            const draft2 = {
                id: "d2",
                message: "Added drums",
                data: { step: 2 },
                timestamp: 2000,
                status: "pending"
            };
            storage.data.Projects.p1.commitDrafts = [draft1, draft2];

            server.editProject.mockImplementation((repo, key, data, msg, cb) => {
                if (msg === "Added chords") {
                    cb({ success: false, error: "Network timeout" });
                }
            });

            const result = await manager.syncPending(
                "p1",
                "my-jazz-project-12345678",
                "hashed-key-p1"
            );

            expect(result.success).toBe(false);
            expect(result.synced).toBe(0);
            expect(result.error).toBe("Network timeout");
            expect(server.editProject).toHaveBeenCalledTimes(1);
            expect(storage.updateDraftStatus).not.toHaveBeenCalled();
        });

        test("syncPending prevents concurrent syncs on the same project", async () => {
            manager._syncingProjects.p1 = true;

            const res = await manager.syncPending(
                "p1",
                "my-jazz-project-12345678",
                "hashed-key-p1"
            );

            expect(res.success).toBe(false);
            expect(res.error).toBe("sync_in_progress");
            expect(server.editProject).not.toHaveBeenCalled();
        });
    });

    describe("Automatic On-Reconnect Sync (_onOnline)", () => {
        test("creates pending repos first, updates GitRepoData, and syncs all drafts", async () => {
            storage.data.Projects.p_off = {
                ProjectName: "Offline Song",
                ProjectData: { melody: [1, 2, 3] },
                commitDrafts: [
                    {
                        id: "d_off_1",
                        message: "Recorded melody",
                        data: { melody: [1, 2, 3] },
                        timestamp: 100,
                        status: "pending"
                    }
                ],
                pendingRepoCreation: {
                    status: "pending",
                    projectName: "Offline Song",
                    repoName: "Offline-Song-abcdef12",
                    description: "Offline draft",
                    tags: ["folk"]
                },
                GitRepoData: {
                    repoName: "Offline-Song-abcdef12",
                    hashedKey: ""
                }
            };

            server.addProject.mockImplementation((payloadStr, cb) => {
                cb({
                    success: true,
                    repository: "Offline-Song-abcdef12",
                    key: "real-secret-key-123"
                });
            });

            server.editProject.mockImplementation((repo, key, data, msg, cb) => {
                cb({ success: true, sha: "sha-created-draft-1" });
            });

            server.getCommitHistory.mockImplementation((repo, cb) => {
                cb({
                    success: true,
                    data: [{ sha: "sha-created-draft-1", message: "Recorded melody" }]
                });
            });

            await manager._onOnline();

            expect(server.addProject).toHaveBeenCalledTimes(1);
            expect(storage.addGitRepoData).toHaveBeenCalledWith(
                "p_off",
                "Offline-Song-abcdef12",
                "Offline draft",
                ["folk"],
                "real-secret-key-123"
            );
            expect(storage.clearPendingRepoCreation).toHaveBeenCalledWith("p_off");

            // Check postMessage sent to parent window
            expect(window.parent.postMessage).toHaveBeenCalledWith(
                {
                    type: "MB_GIT_STATE",
                    repoName: "Offline-Song-abcdef12",
                    hashedKey: "real-secret-key-123"
                },
                "*"
            );

            expect(window.parent.postMessage).toHaveBeenCalledWith(
                { type: "MB_SYNC_COMPLETE", synced: expect.any(Number) },
                "*"
            );
        });
    });

    describe("Local History & Cached Commits", () => {
        test("getLocalHistory combines pending drafts and cached commits newest-first", () => {
            storage.data.Projects.p1.commitDrafts = [
                {
                    id: "draft-1",
                    message: "Draft 1",
                    data: {},
                    timestamp: new Date("2026-08-15T10:00:00.000Z").getTime(),
                    status: "pending"
                }
            ];
            storage.data.Projects.p1.cachedCommits = [
                {
                    sha: "sha-synced-1",
                    message: "Synced 1",
                    author: "Student",
                    date: "2026-08-10T10:00:00.000Z"
                }
            ];

            const history = manager.getLocalHistory("p1");

            expect(history.length).toBe(2);
            expect(history[0].message).toBe("Draft 1");
            expect(history[0].status).toBe("pending");
            expect(history[1].sha).toBe("sha-synced-1");
            expect(history[1].status).toBe("synced");
        });

        test("refreshCache caps commit cache to 3 entries", async () => {
            server.getCommitHistory.mockImplementation((repo, cb) => {
                cb({
                    success: true,
                    data: [
                        { sha: "s5", message: "Five", date: "2026-08-05" },
                        { sha: "s4", message: "Four", date: "2026-08-04" },
                        { sha: "s3", message: "Three", date: "2026-08-03" },
                        { sha: "s2", message: "Two", date: "2026-08-02" },
                        { sha: "s1", message: "One", date: "2026-08-01" }
                    ]
                });
            });

            await manager.refreshCache("p1", "my-jazz-project-12345678");

            expect(storage.setCachedCommits).toHaveBeenCalledWith("p1", [
                expect.objectContaining({ sha: "s5" }),
                expect.objectContaining({ sha: "s4" }),
                expect.objectContaining({ sha: "s3" })
            ]);
        });
    });
});
