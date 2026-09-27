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

global.RequestManager = jest.fn(() => ({
    throttledRequest: jest.fn(),
    getStats: jest.fn()
}));
global.CacheManager = jest.fn();

const ServerInterface = require("../ServerInterface");

describe("ServerInterface - Git Endpoints & Integration", () => {
    let server;
    let mockPlanet;
    let mockOfflineManager;
    let mockCacheManager;

    beforeEach(() => {
        localStorage.clear();

        mockCacheManager = {
            init: jest.fn().mockResolvedValue(true),
            cacheProject: jest.fn().mockResolvedValue(true),
            getProject: jest.fn().mockResolvedValue(null)
        };

        mockOfflineManager = {
            isOnline: true,
            saveDraft: jest.fn().mockResolvedValue({ saved: true }),
            refreshCache: jest.fn().mockResolvedValue(true)
        };

        mockPlanet = {
            UserID: "user-12345",
            ProjectStorage: {
                data: {
                    Projects: {
                        p1: {
                            GitRepoData: {
                                repoName: "test-org/my-song",
                                hashedKey: "key-abc"
                            }
                        }
                    }
                }
            }
        };

        server = new ServerInterface(mockPlanet);
        server.offlineManager = mockOfflineManager;
        server.cacheManager = mockCacheManager;
        server.cacheInitialized = true;
    });

    describe("editProject", () => {
        test("calls PUT /edit and invalidates project cache on success", async () => {
            const mockPost = jest
                .spyOn(server, "_post")
                .mockResolvedValue({ success: true, sha: "sha-1" });

            const cb = jest.fn();
            await server.editProject(
                "test-org/my-song",
                "key-abc",
                { blocks: [1] },
                "Added intro",
                cb
            );

            expect(mockPost).toHaveBeenCalledWith(
                "/edit",
                {
                    repoName: "test-org/my-song",
                    key: "key-abc",
                    projectData: { blocks: [1] },
                    commitMessage: "Added intro"
                },
                "PUT"
            );

            expect(mockCacheManager.cacheProject).toHaveBeenCalledWith("test-org/my-song", null);
            expect(cb).toHaveBeenCalledWith({ success: true });
        });

        test("returns failure data when _post throws an error", async () => {
            jest.spyOn(server, "_post").mockRejectedValue(new Error("Network fail"));

            const cb = jest.fn();
            await server.editProject("test-org/my-song", "key-abc", {}, "edit", cb);

            expect(cb).toHaveBeenCalledWith(server.ConnectionFailureData);
        });
    });

    describe("forkProject", () => {
        test("calls POST /fork, saves key in localStorage, and returns new repo details", async () => {
            jest.spyOn(server, "_post").mockResolvedValue({
                repoName: "test-org/my-song-remix",
                key: "remix-key-456",
                projectData: { blocks: [2] },
                description: "A remix"
            });

            const cb = jest.fn();
            await server.forkProject("test-org/my-song", cb);

            expect(cb).toHaveBeenCalledWith({
                success: true,
                repository: "test-org/my-song-remix",
                key: "remix-key-456",
                projectData: { blocks: [2] },
                description: "A remix"
            });

            expect(server.getKey("test-org/my-song-remix")).toBe("remix-key-456");
        });
    });

    describe("likeProject", () => {
        test("calls POST /like with repoName and user ID", async () => {
            const mockPost = jest
                .spyOn(server, "_post")
                .mockResolvedValue({ success: true, likes: 42 });

            const cb = jest.fn();
            await server.likeProject("test-org/my-song", true, cb);

            expect(mockPost).toHaveBeenCalledWith("/like", {
                repoName: "test-org/my-song",
                userId: "user-12345",
                like: true
            });

            expect(cb).toHaveBeenCalledWith({ success: true, likes: 42 });
        });
    });

    describe("reportProject", () => {
        test("calls POST /report with reason description", async () => {
            const mockPost = jest.spyOn(server, "_post").mockResolvedValue({ success: true });

            const cb = jest.fn();
            await server.reportProject("test-org/my-song", "Inappropriate content", cb);

            expect(mockPost).toHaveBeenCalledWith("/report", {
                repoName: "test-org/my-song",
                description: "Inappropriate content"
            });

            expect(cb).toHaveBeenCalledWith({ success: true });
        });
    });

    describe("getCommitHistory", () => {
        test("calls GET /commitHistory and returns array of commits", async () => {
            const history = [
                { sha: "sha-2", message: "Second", date: "2026-08-18" },
                { sha: "sha-1", message: "First", date: "2026-08-17" }
            ];
            jest.spyOn(server, "_get").mockResolvedValue(history);

            const cb = jest.fn();
            await server.getCommitHistory("test-org/my-song", cb);

            expect(cb).toHaveBeenCalledWith({ success: true, data: history });
        });
    });

    describe("commitProject (Online vs Offline routing)", () => {
        test("routes to online editProject and refreshes cache when online", async () => {
            mockOfflineManager.isOnline = true;
            jest.spyOn(server, "editProject").mockImplementation((repo, key, data, msg, cb) => {
                cb({ success: true });
            });

            const cb = jest.fn();
            await server.commitProject(
                "p1",
                "test-org/my-song",
                "key-abc",
                { blocks: [3] },
                "Online save",
                cb
            );

            expect(server.editProject).toHaveBeenCalledWith(
                "test-org/my-song",
                "key-abc",
                { blocks: [3] },
                "Online save",
                expect.any(Function)
            );
            expect(mockOfflineManager.refreshCache).toHaveBeenCalledWith("p1", "test-org/my-song");
            expect(cb).toHaveBeenCalledWith({ success: true });
        });

        test("routes to OfflineCommitManager.saveDraft when offline", async () => {
            mockOfflineManager.isOnline = false;

            const cb = jest.fn();
            await server.commitProject(
                "p1",
                "test-org/my-song",
                "key-abc",
                { blocks: [4] },
                "Offline snapshot",
                cb,
                true // forceOffline
            );

            expect(mockOfflineManager.saveDraft).toHaveBeenCalledWith(
                "p1",
                { blocks: [4] },
                "Offline snapshot"
            );
        });
    });

    describe("Key storage helpers", () => {
        test("saveKey and getKey store and retrieve keys by repository slug", () => {
            server.saveKey("org/slug-1", "secret-token-xyz");
            expect(server.getKey("org/slug-1")).toBe("secret-token-xyz");
            expect(server.getKey("non-existent")).toBeNull();
        });
    });
});
