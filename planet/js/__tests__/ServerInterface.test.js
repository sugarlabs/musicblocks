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
            const serverResponse = { success: true, data: { name: "New Project" } };
            const callback = jest.fn();

            server.getProjectDetails("123", callback);

            await new Promise(process.nextTick);
            const ajaxInstance = jQuery.ajax.mock.results[0].value;
            ajaxInstance._done(serverResponse);

            await new Promise(process.nextTick);

            expect(callback).toHaveBeenCalledWith(serverResponse);
            expect(mockCacheManager.cacheMetadata).toHaveBeenCalledWith("123", serverResponse.data);
        });
    });

    describe("request handling", () => {
        it("should append the API Key to every request", () => {
            const callback = jest.fn();
            server.getTagManifest(callback);

            const sentData = jQuery.ajax.mock.calls[0][0].data;
            expect(sentData["api-key"]).toBe(window.MB_PLANET_API_KEY);
            expect(sentData.action).toBe("getTagManifest");
        });

        it("should use throttled requests for read operations", () => {
            server.getTagManifest(jest.fn());
            expect(mockRequestManager.throttledRequest).toHaveBeenCalled();
        });

        it("should send likes without throttling", () => {
            server.likeProject("123", true, jest.fn());
            expect(mockRequestManager.throttledRequest).not.toHaveBeenCalled();
            expect(jQuery.ajax).toHaveBeenCalled();
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
            const serverResponse = { success: true, data: { blocks: [1] } };

            server.downloadProject("p1", callback);
            await new Promise(process.nextTick);

            const ajaxInstance = jQuery.ajax.mock.results[0].value;
            ajaxInstance._done(serverResponse);

            await new Promise(process.nextTick);

            expect(callback).toHaveBeenCalledWith(serverResponse);
            expect(mockCacheManager.cacheProject).toHaveBeenCalledWith("p1", serverResponse.data);
        });
    });

    describe("endpoint methods", () => {
        it("should call addProject using a direct request", () => {
            const callback = jest.fn();
            server.addProject("{}", callback);

            const sentData = jQuery.ajax.mock.calls[0][0].data;
            expect(sentData.action).toBe("addProject");
            expect(sentData.ProjectJSON).toBe("{}");
            expect(sentData["api-key"]).toBe(server.APIKey);
        });

        it("should call reportProject using a direct request", () => {
            const callback = jest.fn();
            server.reportProject("p1", "spam", callback);

            const sentData = jQuery.ajax.mock.calls[0][0].data;
            expect(sentData.action).toBe("reportProject");
            expect(sentData.ProjectID).toBe("p1");
            expect(sentData.Description).toBe("spam");
        });

        it("should use throttledRequest for searchProjects", () => {
            server.searchProjects("q", "recent", 0, 10, jest.fn());
            expect(mockRequestManager.throttledRequest).toHaveBeenCalled();
        });

        it("should use throttledRequest for convertFile", () => {
            server.convertFile("abc", "mid", "DATA", jest.fn());
            expect(mockRequestManager.throttledRequest).toHaveBeenCalled();
        });

        it("should send correct action for downloadProjectList", () => {
            server.downloadProjectList(["tag"], "recent", 0, 10, jest.fn());
            const sentData = jQuery.ajax.mock.calls[0][0].data;
            expect(sentData.action).toBe("downloadProjectList");
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
});
