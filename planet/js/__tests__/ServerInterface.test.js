/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 e-esakman
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const ServerInterface = require("../ServerInterface");

describe("ServerInterface", () => {
    let server;
    let mockPlanet;
    let mockRequestManager;
    let mockCacheManager;
    let originalEnv;
    let originalConsoleError;
    let originalConsoleDebug;

    beforeEach(() => {
        originalEnv = window.MB_ENV;
        originalConsoleError = console.error;
        originalConsoleDebug = console.debug;

        window.MB_PLANET_API_KEY = "3f2d3a4c-c7a4-4c3c-892e-ac43784f7381";

        mockRequestManager = {
            throttledRequest: jest.fn((data, logic) => {
                return new Promise(resolve => logic(resolve));
            }),
            getStats: jest.fn()
        };
        global.RequestManager = jest.fn(() => mockRequestManager);

        // Mock CacheManager
        mockCacheManager = {
            init: jest.fn().mockResolvedValue(true),
            getMetadata: jest.fn().mockResolvedValue(null),
            cacheMetadata: jest.fn().mockResolvedValue(true),
            getProject: jest.fn().mockResolvedValue(null),
            cacheProject: jest.fn().mockResolvedValue(true),
            clearAll: jest.fn().mockResolvedValue(true),
            clearExpired: jest.fn().mockResolvedValue(0),
            getStats: jest.fn().mockResolvedValue({
                metadata: 0,
                projects: 0,
                thumbnails: 0
            })
        };
        global.CacheManager = jest.fn(() => mockCacheManager);

        // Mock jQuery
        global.jQuery = {
            ajax: jest.fn().mockReturnValue({
                done: function (cb) {
                    this._done = cb;
                    return this;
                },
                fail: function (cb) {
                    this._fail = cb;
                    return this;
                }
            })
        };

        mockPlanet = {};
        window.MB_ENV = "production";

        server = new ServerInterface(mockPlanet);

        console.error = jest.fn();
        console.debug = jest.fn();
    });

    afterEach(() => {
        console.error = originalConsoleError;
        console.debug = originalConsoleDebug;

        window.MB_ENV = originalEnv;

        delete global.jQuery;
        delete global.RequestManager;
        delete global.CacheManager;
        delete window.MB_PLANET_API_KEY;

        jest.clearAllMocks();
    });

    describe("caching behavior", () => {
        it("should retrieve project details from cache if available", async () => {
            const cachedData = { name: "Cached Project" };
            mockCacheManager.getMetadata.mockResolvedValue(cachedData);
            const callback = jest.fn();

            await server.getProjectDetails("123", callback);

            expect(mockCacheManager.getMetadata).toHaveBeenCalledWith("123");
            expect(callback).toHaveBeenCalledWith({ success: true, data: cachedData });
            expect(jQuery.ajax).not.toHaveBeenCalled();
        });

        it("should fetch and cache when metadata is missing", async () => {
            mockCacheManager.getMetadata.mockResolvedValue(null);
            const serverResponse = {
                repoName: "123",
                projectName: "New Project",
                description: "desc"
            };
            jest.spyOn(server, "_get").mockResolvedValue(serverResponse);
            const callback = jest.fn();

            await server.getProjectDetails("123", callback);

            expect(callback).toHaveBeenCalledWith({
                success: true,
                data: server._normaliseProjectRow(serverResponse)
            });
            expect(mockCacheManager.cacheMetadata).toHaveBeenCalledWith(
                "123",
                server._normaliseProjectRow(serverResponse)
            );
        });
    });

    describe("request handling", () => {
        it("should call _get for getTagManifest", async () => {
            const manifest = { music: { TagName: "Music" } };
            jest.spyOn(server, "_get").mockResolvedValue({ success: true, data: manifest });
            const callback = jest.fn();
            await server.getTagManifest(callback);
            expect(server._get).toHaveBeenCalledWith("/tagManifest");
            expect(callback).toHaveBeenCalledWith({ success: true, data: manifest });
        });

        it("should use throttled requests for convertFile", () => {
            server.convertFile("abc", "mid", "DATA", jest.fn());
            expect(mockRequestManager.throttledRequest).toHaveBeenCalled();
        });

        it("should send likes without throttling", async () => {
            jest.spyOn(server, "_post").mockResolvedValue({ success: true, likes: 1 });
            const callback = jest.fn();
            await server.likeProject("123", true, callback);
            expect(mockRequestManager.throttledRequest).not.toHaveBeenCalled();
            expect(server._post).toHaveBeenCalledWith(
                "/like",
                expect.objectContaining({
                    repoName: "123",
                    like: true
                })
            );
            expect(callback).toHaveBeenCalledWith({ success: true, likes: 1 });
        });
    });

    describe("Environment Configuration", () => {
        it("should disable cache when not in production", () => {
            window.MB_ENV = "development";
            const devServer = new ServerInterface(mockPlanet);
            expect(devServer.disablePlanetCache).toBe(true);
        });
    });

    describe("request (raw request compatibility)", () => {
        it("should call callback with response on success", () => {
            const callback = jest.fn();
            server.request({ action: "getTagManifest" }, callback);

            const ajaxInstance = jQuery.ajax.mock.results[0].value;
            ajaxInstance._done({ success: true, data: "ok" });

            expect(callback).toHaveBeenCalledWith({ success: true, data: "ok" });
            const sentData = jQuery.ajax.mock.calls[0][0].data;
            expect(sentData["api-key"]).toBe(server.APIKey);
        });

        it("should call callback with ConnectionFailureData on failure", () => {
            const callback = jest.fn();
            server.request({ action: "getTagManifest" }, callback);

            const ajaxInstance = jQuery.ajax.mock.results[0].value;
            ajaxInstance._fail();

            expect(callback).toHaveBeenCalledWith(server.ConnectionFailureData);
        });
    });

    describe("throttledRequest (retry + failure handling)", () => {
        it("should call callback with ConnectionFailureData when ajax fails", async () => {
            const callback = jest.fn();
            server.throttledRequest({ action: "getTagManifest" }, callback);

            await new Promise(process.nextTick);
            const ajaxInstance = jQuery.ajax.mock.results[0].value;
            ajaxInstance._fail();

            await new Promise(process.nextTick);
            expect(callback).toHaveBeenCalledWith(server.ConnectionFailureData);
        });

        it("should catch RequestManager errors and return ConnectionFailureData", async () => {
            mockRequestManager.throttledRequest.mockRejectedValueOnce(new Error("boom"));
            const callback = jest.fn();

            await server.throttledRequest({ action: "getTagManifest" }, callback);

            expect(console.error).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledWith(server.ConnectionFailureData);
        });
    });

    describe("downloadProject (project data caching)", () => {
        it("should return cached project when available", async () => {
            const cachedProject = { blocks: [] };
            mockCacheManager.getProject.mockResolvedValueOnce(cachedProject);
            const callback = jest.fn();

            await server.downloadProject("p1", callback);

            expect(mockCacheManager.getProject).toHaveBeenCalledWith("p1");
            expect(callback).toHaveBeenCalledWith({ success: true, data: cachedProject });
            expect(jQuery.ajax).not.toHaveBeenCalled();
        });

        it("should fetch from network and cache project when not cached", async () => {
            mockCacheManager.getProject.mockResolvedValueOnce(null);
            const callback = jest.fn();
            const serverResponse = { content: '[[0,"start",100,100,[null]]]' };
            jest.spyOn(server, "_get").mockResolvedValue(serverResponse);

            await server.downloadProject("p1", callback);

            expect(server._get).toHaveBeenCalledWith("/getProjectData?repoName=p1");
            expect(callback).toHaveBeenCalledWith({ success: true, data: serverResponse.content });
            expect(mockCacheManager.cacheProject).toHaveBeenCalledWith(
                "p1",
                serverResponse.content
            );
        });
    });

    describe("endpoint methods", () => {
        it("should call addProject using POST /create", async () => {
            const callback = jest.fn();
            const projectData = { ProjectName: "Test", ProjectData: "{}" };
            jest.spyOn(server, "_post").mockResolvedValue({
                success: true,
                repository: "test-org/test",
                key: "key-123"
            });
            await server.addProject(JSON.stringify(projectData), callback);

            expect(server._post).toHaveBeenCalledWith(
                "/create",
                expect.objectContaining({
                    projectName: "Test"
                })
            );
            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: true,
                    repository: "test-org/test"
                })
            );
        });

        it("should call reportProject using POST /report", async () => {
            const callback = jest.fn();
            jest.spyOn(server, "_post").mockResolvedValue({ success: true });
            await server.reportProject("p1", "spam", callback);

            expect(server._post).toHaveBeenCalledWith("/report", {
                repoName: "p1",
                description: "spam"
            });
            expect(callback).toHaveBeenCalledWith({ success: true });
        });

        it("should search projects using GET /search", async () => {
            jest.spyOn(server, "_get").mockResolvedValue({ data: [] });
            const callback = jest.fn();
            await server.searchProjects("q", "recent", 0, 10, callback);

            expect(server._get).toHaveBeenCalledWith(expect.stringContaining("/search?q=q"));
            expect(callback).toHaveBeenCalled();
        });

        it("should use throttledRequest for convertFile", () => {
            server.convertFile("abc", "mid", "DATA", jest.fn());
            expect(mockRequestManager.throttledRequest).toHaveBeenCalled();
        });

        it("should fetch project list using GET /allRepos", async () => {
            jest.spyOn(server, "_get").mockResolvedValue({ data: [] });
            const callback = jest.fn();
            await server.downloadProjectList(["tag"], "recent", 0, 10, callback);

            expect(server._get).toHaveBeenCalledWith(
                expect.stringContaining("/allRepos?page=1&limit=10")
            );
            expect(callback).toHaveBeenCalled();
        });
    });

    describe("Stats and cache helpers", () => {
        it("should combine request and cache stats", async () => {
            mockRequestManager.getStats.mockReturnValueOnce({ totalRequests: 1 });
            mockCacheManager.getStats.mockResolvedValueOnce({
                metadata: 2,
                projects: 3,
                thumbnails: 4
            });

            const stats = await server.getStats();
            expect(stats).toEqual({
                requests: { totalRequests: 1 },
                cache: { metadata: 2, projects: 3, thumbnails: 4 }
            });
        });

        it("should call CacheManager.clearAll", async () => {
            await server.clearCache();
            expect(mockCacheManager.clearAll).toHaveBeenCalled();
        });

        it("should call CacheManager.clearExpired", async () => {
            await server.clearExpiredCache();
            expect(mockCacheManager.clearExpired).toHaveBeenCalled();
        });
    });

    describe("init", () => {
        it("should init cache when caching is enabled (production)", async () => {
            await server.init();
            expect(mockCacheManager.init).toHaveBeenCalled();
        });

        it("should not init cache when caching is disabled", async () => {
            window.MB_ENV = "development";
            const devServer = new ServerInterface(mockPlanet);
            await devServer.init();
            expect(devServer.disablePlanetCache).toBe(true);
        });
    });

    describe("paging windows", () => {
        // A backend with 60 projects that pages by page number and limit, like
        // /allRepos and /search do.
        const rows = Array.from({ length: 60 }, (_, i) => ({
            repoName: `p${i}`,
            updatedAt: `t${i}`
        }));
        const fakeBackend = () =>
            jest.spyOn(server, "_get").mockImplementation(async path => {
                const params = new URLSearchParams(path.split("?")[1]);
                const page = Number(params.get("page"));
                const limit = Number(params.get("limit"));
                return { data: rows.slice((page - 1) * limit, page * limit) };
            });
        const names = callback => callback.mock.calls[0][0].data.map(row => row[0]);
        const range = (from, to) => Array.from({ length: to - from }, (_, i) => `p${from + i}`);

        it("paginates USER_PROJECTS across Load More windows", async () => {
            const ownedProjects = Array.from({ length: 26 }, (_, i) => [`p${i}`, `t${i}`]);
            const ownedProjectsSpy = jest
                .spyOn(server, "_getOwnedProjectList")
                .mockReturnValue(ownedProjects);

            try {
                const windows = [
                    [0, 25],
                    [24, 49]
                ];
                const batches = [];

                for (const [start, end] of windows) {
                    const callback = jest.fn();
                    await server.downloadProjectList(
                        "USER_PROJECTS",
                        "RECENT",
                        start,
                        end,
                        callback
                    );
                    batches.push(names(callback));
                }

                expect(batches[0]).toEqual(range(0, 25));
                expect(batches[1]).toEqual(range(24, 26));
            } finally {
                ownedProjectsSpy.mockRestore();
            }
        });

        // GlobalPlanet asks for index..index+25 and advances index by 24.
        it("returns the next rows on each Load More, not the first page again", async () => {
            fakeBackend();
            const windows = [
                [0, 25],
                [24, 49],
                [48, 73]
            ];
            const batches = [];
            for (const [start, end] of windows) {
                const callback = jest.fn();
                await server.downloadProjectList("ALL_PROJECTS", "RECENT", start, end, callback);
                batches.push(names(callback));
            }

            expect(batches[0]).toEqual(range(0, 25));
            expect(batches[1]).toEqual(range(24, 49));
            expect(batches[2]).toEqual(range(48, 60));
        });

        it("makes a single request when the window starts on a page boundary", async () => {
            const get = fakeBackend();
            const callback = jest.fn();
            await server.downloadProjectList("ALL_PROJECTS", "RECENT", 0, 25, callback);

            expect(get).toHaveBeenCalledTimes(1);
            expect(get).toHaveBeenCalledWith(expect.stringContaining("page=1&limit=25"));
        });

        it("stops after a short page instead of asking past the end", async () => {
            const get = fakeBackend();
            const callback = jest.fn();
            await server.downloadProjectList("ALL_PROJECTS", "RECENT", 48, 73, callback);

            // page 2 is full (25-49), page 3 is short (50-59), so no page 4
            expect(get).toHaveBeenCalledTimes(2);
            expect(names(callback)).toEqual(range(48, 60));
        });

        it("reports a connection failure when a page fails", async () => {
            jest.spyOn(server, "_get")
                .mockResolvedValueOnce({ data: rows.slice(0, 25) })
                .mockResolvedValueOnce(null);
            const callback = jest.fn();
            await server.downloadProjectList("ALL_PROJECTS", "RECENT", 24, 49, callback);

            expect(callback).toHaveBeenCalledWith(server.ConnectionFailureData);
        });

        it("pages search results the same way", async () => {
            fakeBackend();
            const callback = jest.fn();
            await server.searchProjects("p", "RECENT", 24, 49, callback);

            expect(names(callback)).toEqual(range(24, 49));
        });
    });

    describe("_get timeout", () => {
        afterEach(() => {
            jest.useRealTimers();
            delete global.fetch;
        });

        it("gives up on a request that never answers", async () => {
            jest.useFakeTimers();
            // A server that accepts the connection and then goes quiet.
            global.fetch = jest.fn(
                (url, { signal }) =>
                    new Promise((resolve, reject) => {
                        signal.addEventListener("abort", () =>
                            reject(new DOMException("aborted", "AbortError"))
                        );
                    })
            );

            const pending = server._get("/allRepos?page=1&limit=25");
            jest.advanceTimersByTime(server.RequestTimeout);

            await expect(pending).resolves.toBeNull();
        });

        it("clears the timer once the request answers", async () => {
            jest.useFakeTimers();
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ data: [] })
            });

            await expect(server._get("/allRepos?page=1&limit=25")).resolves.toEqual({ data: [] });
            expect(jest.getTimerCount()).toBe(0);
        });
    });
});
