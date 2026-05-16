/**
 * MusicBlocks v3.4.1
 *
 * @author Sapnil Biswas
 *
 * @copyright 2026 Music Blocks contributors
 *
 * @license
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

global._ = jest.fn(str => str);
global.GlobalTag = jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    select: jest.fn(),
    unselect: jest.fn(),
    selected: false,
    specialTag: false,
    id: null
}));
global.GlobalCard = jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    render: jest.fn(),
    cleanup: jest.fn()
}));
global.jQuery = jest.fn(() => ({
    tooltip: jest.fn(),
    material_select: jest.fn(),
    siblings: jest.fn(() => ({
        on: jest.fn()
    }))
}));
global.debounce = jest.fn(fn => fn);
global.ProjectViewer = jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    open: jest.fn()
}));

const { GlobalPlanet } = require("../GlobalPlanet");

describe("GlobalPlanet", () => {
    let gp;
    let mockPlanet;

    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = `
            <div id="global-projects"></div>
            <div id="global-load" style="display:none;"></div>
            <div id="load-more-projects" style="display:none;"></div>
            <div id="tagscontainer" style="display:block;"></div>
            <select id="sort-select"><option value="RECENT">Recent</option></select>
            <input id="global-search" value="" />
            <input id="global-search-2" value="" />
            <div id="search-close" style="display:none;"></div>
            <div id="search-close-2" style="display:none;"></div>
            <div id="global-tab"></div>
            <div id="local-tab"></div>
            <div id="searchcontainer-one" style="display:block;"></div>
            <div id="globaltitle"></div>
            <div id="globalcontents"></div>
        `;

        mockPlanet = {
            IsMusicBlocks: true,
            ConnectedToServer: true,
            TagsManifest: {
                1: { TagName: "Music", IsDisplayTag: "1" },
                2: { TagName: "Art", IsDisplayTag: "0" }
            },
            ServerInterface: {
                downloadProjectList: jest.fn(),
                searchProjects: jest.fn(),
                getProjectDetails: jest.fn(),
                downloadProject: jest.fn()
            },
            ProjectStorage: {
                decodeTB: jest.fn(data => data),
                initialiseNewProject: jest.fn(),
                getCurrentProjectName: jest.fn().mockReturnValue("My Project")
            },
            loadProjectFromData: jest.fn()
        };

        gp = new GlobalPlanet(mockPlanet);
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    describe("constructor", () => {
        it("should initialize with correct default values", () => {
            expect(gp.Planet).toBe(mockPlanet);
            expect(gp.ProjectViewer).toBeNull();
            expect(gp.tags).toEqual([]);
            expect(gp.defaultTag).toBe(false);
            expect(gp.searchMode).toBeNull();
            expect(gp.index).toBe(0);
            expect(gp.page).toBe(24);
            expect(gp.sortBy).toBeNull();
            expect(gp.cache).toEqual({});
            expect(gp.loadCount).toBe(0);
            expect(gp.cards).toEqual([]);
            expect(gp.loadButtonShown).toBe(true);
            expect(gp.searching).toBe(false);
            expect(gp.searchString).toBe("");
            expect(gp.oldSearchString).toBe("");
        });

        it("should set remixPrefix from translation", () => {
            expect(gp.remixPrefix).toBe("Remix of");
        });
    });

    describe("searchAllProjects", () => {
        it("should set searchMode to ALL_PROJECTS and call refreshProjects", () => {
            const spy = jest.spyOn(gp, "refreshProjects").mockImplementation(() => {});
            gp.searchAllProjects();
            expect(gp.searchMode).toBe("ALL_PROJECTS");
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe("searchMyProjects", () => {
        it("should set searchMode to USER_PROJECTS and call refreshProjects", () => {
            const spy = jest.spyOn(gp, "refreshProjects").mockImplementation(() => {});
            gp.searchMyProjects();
            expect(gp.searchMode).toBe("USER_PROJECTS");
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe("searchTags", () => {
        it("should set searchMode to JSON of tag IDs", () => {
            const spy = jest.spyOn(gp, "refreshProjects").mockImplementation(() => {});
            gp.searchTags(["1", "2"]);
            expect(gp.searchMode).toBe(JSON.stringify(["1", "2"]));
            spy.mockRestore();
        });
    });

    describe("refreshProjects", () => {
        it("should reset index and clean up existing cards", () => {
            gp.index = 50;
            gp.cards = [{ cleanup: jest.fn() }];
            gp.searchMode = "ALL_PROJECTS";
            gp.refreshProjects();

            expect(gp.index).toBe(0);
            expect(gp.cards).toEqual([]);
        });

        it("should call downloadProjectList when no search string", () => {
            gp.oldSearchString = "";
            gp.searchMode = "ALL_PROJECTS";
            gp.sortBy = "RECENT";
            gp.refreshProjects();

            expect(mockPlanet.ServerInterface.downloadProjectList).toHaveBeenCalledWith(
                "ALL_PROJECTS",
                "RECENT",
                0,
                25,
                expect.any(Function)
            );
        });

        it("should call searchProjects when search string exists", () => {
            gp.oldSearchString = "test query";
            gp.searchMode = "ALL_PROJECTS";
            gp.sortBy = "RECENT";
            gp.refreshProjects();

            expect(mockPlanet.ServerInterface.searchProjects).toHaveBeenCalledWith(
                "test query",
                "RECENT",
                0,
                25,
                expect.any(Function)
            );
        });
    });

    describe("_cleanupCards", () => {
        it("should call cleanup on each card and reset the array", () => {
            const mockCard1 = { cleanup: jest.fn() };
            const mockCard2 = { cleanup: jest.fn() };
            gp.cards = [mockCard1, mockCard2];

            gp._cleanupCards();

            expect(mockCard1.cleanup).toHaveBeenCalled();
            expect(mockCard2.cleanup).toHaveBeenCalled();
            expect(gp.cards).toEqual([]);
        });

        it("should handle cards without cleanup method", () => {
            gp.cards = [{ noCleanup: true }, null];
            expect(() => gp._cleanupCards()).not.toThrow();
            expect(gp.cards).toEqual([]);
        });

        it("should handle non-array cards gracefully", () => {
            gp.cards = null;
            expect(() => gp._cleanupCards()).not.toThrow();
        });
    });

    describe("afterRefreshProjects", () => {
        it("should call addProjects on success", () => {
            const spy = jest.spyOn(gp, "addProjects").mockImplementation(() => {});
            gp.afterRefreshProjects({ success: true, data: [] });
            expect(spy).toHaveBeenCalledWith([]);
            spy.mockRestore();
        });

        it("should call throwOfflineError on failure", () => {
            const spy = jest.spyOn(gp, "throwOfflineError").mockImplementation(() => {});
            gp.afterRefreshProjects({ success: false });
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe("addProjectToCache", () => {
        it("should add project data to cache on success", () => {
            const callback = jest.fn();
            gp.loadCount = 1;
            gp.addProjectToCache(
                "proj1",
                { success: true, data: { ProjectName: "Test" } },
                callback
            );

            expect(gp.cache["proj1"].ProjectName).toBe("Test");
            expect(gp.cache["proj1"].ProjectData).toBeNull();
            expect(callback).toHaveBeenCalled();
        });

        it("should call throwOfflineError on failure", () => {
            const spy = jest.spyOn(gp, "throwOfflineError").mockImplementation(() => {});
            const callback = jest.fn();
            gp.loadCount = 1;
            gp.addProjectToCache("proj1", { success: false }, callback);

            expect(spy).toHaveBeenCalled();
            expect(callback).toHaveBeenCalled();
            spy.mockRestore();
        });

        it("should not invoke callback until loadCount reaches zero", () => {
            const callback = jest.fn();
            gp.loadCount = 3;
            gp.addProjectToCache("p1", { success: true, data: {} }, callback);
            expect(callback).not.toHaveBeenCalled();

            gp.addProjectToCache("p2", { success: true, data: {} }, callback);
            expect(callback).not.toHaveBeenCalled();

            gp.addProjectToCache("p3", { success: true, data: {} }, callback);
            expect(callback).toHaveBeenCalled();
        });
    });

    describe("showLoading / hideLoading", () => {
        it("should show the loading element", () => {
            gp.showLoading();
            expect(document.getElementById("global-load").style.display).toBe("block");
        });

        it("should hide the loading element", () => {
            gp.hideLoading();
            expect(document.getElementById("global-load").style.display).toBe("none");
        });
    });

    describe("showLoadMore / hideLoadMore", () => {
        it("should show the load-more button", () => {
            gp.showLoadMore();
            expect(document.getElementById("load-more-projects").style.display).toBe("block");
            expect(gp.loadButtonShown).toBe(true);
        });

        it("should hide the load-more button", () => {
            gp.hideLoadMore();
            expect(document.getElementById("load-more-projects").style.display).toBe("none");
            expect(gp.loadButtonShown).toBe(false);
        });
    });

    describe("showTags / hideTags", () => {
        it("should show the tags container", () => {
            gp.showTags();
            expect(document.getElementById("tagscontainer").style.display).toBe("block");
        });

        it("should hide the tags container", () => {
            gp.hideTags();
            expect(document.getElementById("tagscontainer").style.display).toBe("none");
        });
    });

    describe("throwOfflineError", () => {
        it("should hide loading and load-more, and show offline message", () => {
            gp.throwOfflineError();
            const el = document.getElementById("global-projects");
            expect(el.innerHTML).toContain("Feature unavailable");
            expect(document.getElementById("global-load").style.display).toBe("none");
            expect(document.getElementById("load-more-projects").style.display).toBe("none");
        });
    });

    describe("throwNoProjectsError", () => {
        it("should show no-projects message", () => {
            gp.throwNoProjectsError();
            const el = document.getElementById("global-projects");
            expect(el.innerHTML).toContain("No results found.");
        });
    });

    describe("afterAddProjects", () => {
        it("should increment index by page size", () => {
            gp.index = 0;
            gp.oldSearchString = "";
            gp.afterAddProjects();
            expect(gp.index).toBe(24);
        });

        it("should call afterSearch when search string exists", () => {
            const spy = jest.spyOn(gp, "afterSearch").mockImplementation(() => {});
            gp.oldSearchString = "query";
            gp.afterAddProjects();
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe("afterSearch", () => {
        it("should set searching to false", () => {
            gp.searching = true;
            gp.searchString = "";
            gp.oldSearchString = "";
            gp.afterSearch();
            expect(gp.searching).toBe(false);
        });

        it("should call search again if searchString changed", () => {
            const spy = jest.spyOn(gp, "search").mockImplementation(() => {});
            gp.searchString = "new query";
            gp.oldSearchString = "old query";
            gp.afterSearch();
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe("afterDownloadData", () => {
        it("should store data in cache and call callback on success", () => {
            gp.cache["proj1"] = { ProjectData: null };
            const callback = jest.fn();
            gp.afterDownloadData("proj1", { success: true, data: "projectData" }, callback, null);

            expect(gp.cache["proj1"].ProjectData).toBe("projectData");
            expect(callback).toHaveBeenCalledWith("projectData");
        });

        it("should call callback with decoded data when id is not in cache", () => {
            const callback = jest.fn();
            gp.afterDownloadData("unknown", { success: true, data: "rawData" }, callback, null);
            expect(callback).toHaveBeenCalledWith("rawData");
        });

        it("should call error callback on failure", () => {
            const callback = jest.fn();
            const errorFn = jest.fn();
            gp.afterDownloadData("proj1", { success: false }, callback, errorFn);
            expect(errorFn).toHaveBeenCalled();
            expect(callback).not.toHaveBeenCalled();
        });

        it("should not throw when error callback is null and data fails", () => {
            const callback = jest.fn();
            expect(() => {
                gp.afterDownloadData("proj1", { success: false }, callback, null);
            }).not.toThrow();
        });
    });

    describe("selectSpecialTag / unselectSpecialTags", () => {
        it("should unselect all tags then select the given one", () => {
            const mockTag1 = {
                unselect: jest.fn(),
                select: jest.fn(),
                func: jest.fn(),
                specialTag: true
            };
            const mockTag2 = {
                unselect: jest.fn(),
                select: jest.fn(),
                func: jest.fn(),
                specialTag: false
            };
            gp.tags = [mockTag1, mockTag2];

            gp.selectSpecialTag(mockTag1);

            expect(mockTag1.unselect).toHaveBeenCalled();
            expect(mockTag2.unselect).toHaveBeenCalled();
            expect(mockTag1.select).toHaveBeenCalled();
            expect(mockTag1.func).toHaveBeenCalled();
        });

        it("unselectSpecialTags should only unselect special tags", () => {
            const special = { unselect: jest.fn(), specialTag: true };
            const regular = { unselect: jest.fn(), specialTag: false };
            gp.tags = [special, regular];

            gp.unselectSpecialTags();

            expect(special.unselect).toHaveBeenCalled();
            expect(regular.unselect).not.toHaveBeenCalled();
        });
    });
});
