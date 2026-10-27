/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
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

const PlanetInterface = require("../planetInterface");
const { PubSub } = require("../pubsub");
global.platformColor = {
    header: "#8bc34a"
};
global._THIS_IS_MUSIC_BLOCKS_ = {};
global.doSVG = jest.fn();
global.pubsub = new PubSub();

const mockActivity = {
    hideSearchWidget: jest.fn(),
    prepSearchWidget: jest.fn(),
    sendAllToTrash: jest.fn(),
    refreshCanvas: jest.fn(),
    justLoadStart: jest.fn(),
    doLoadAnimation: jest.fn(),
    textMsg: jest.fn(),
    errorMsg: jest.fn(),
    stage: { enableDOMEvents: jest.fn(), update: jest.fn() },
    blocks: {
        loadNewBlocks: jest.fn(),
        isLoading: jest.fn(() => false),
        runAfterLoad: jest.fn(),
        palettes: { _hideMenus: jest.fn() },
        trashStacks: []
    },
    logo: { doStopTurtles: jest.fn() },
    canvas: {},
    turtles: {},
    loading: false,
    prepareExport: jest.fn(),
    _allClear: jest.fn()
};

document.body.innerHTML = `
  <div id="helpElem"></div>
  <div class="canvasHolder"></div>
  <div id="canvas"></div>
  <meta id="theme-color">
  <div id="toolbars"></div>
  <div id="palette"></div>
  <div id="buttoncontainerBOTTOM"></div>
  <div id="buttoncontainerTOP"></div>
  <canvas id="overlayCanvas"></canvas>
  <iframe id="planet-iframe"></iframe>
  <input id="myOpenFile" type="file">
`;

const docById = jest.fn(id => document.getElementById(id));
global.docById = docById;

beforeAll(() => {
    mockCanvas = {
        click: jest.fn()
    };
    window.widgetWindows = {
        hideAllWindows: jest.fn(),
        showWindows: jest.fn()
    };
    window.scroll = jest.fn();
});

describe("PlanetInterface", () => {
    let planetInterface;

    beforeEach(() => {
        planetInterface = new PlanetInterface(mockActivity);
        mockActivity.errorMsg.mockClear();
    });

    test("hideMusicBlocks hides relevant elements and disables DOM events", () => {
        planetInterface.hideMusicBlocks();

        expect(mockActivity.hideSearchWidget).toHaveBeenCalled();
        expect(mockActivity.logo.doStopTurtles).toHaveBeenCalled();
        expect(docById("helpElem").style.visibility).toBe("hidden");
        expect(document.querySelector(".canvasHolder").classList.contains("hide")).toBe(true);
        expect(document.querySelector("#canvas").style.display).toBe("none");
        expect(document.querySelector("#theme-color").content).toBe("#8bc34a");
    });

    test("showMusicBlocks shows relevant elements and enables DOM events", () => {
        mockActivity.planet = { getCurrentProjectName: jest.fn(() => "Test Project") };

        planetInterface.showMusicBlocks();

        expect(document.title).toBe("Test Project");
        expect(docById("toolbars").style.display).toBe("block");
        expect(docById("palette").style.display).toBe("block");
        expect(mockActivity.prepSearchWidget).toHaveBeenCalled();
        expect(document.querySelector(".canvasHolder").classList.contains("hide")).toBe(false);
        expect(document.querySelector("#canvas").style.display).toBe("");
    });

    test("showMusicBlocks synchronizes toolbar height when activity.toolbar is present", () => {
        mockActivity.planet = { getCurrentProjectName: jest.fn(() => "Test Project") };
        mockActivity.toolbar = { syncToolbarHeight: jest.fn() };

        planetInterface.showMusicBlocks();

        expect(mockActivity.toolbar.syncToolbarHeight).toHaveBeenCalled();
        delete mockActivity.toolbar;
    });

    test("hidePlanet hides the planet interface", () => {
        planetInterface.iframe = document.querySelector("#planet-iframe");
        planetInterface.hidePlanet();
        expect(planetInterface.iframe.style.display).toBe("none");
    });

    test("openPlanet calls saveLocally, hideMusicBlocks, and showPlanet", () => {
        planetInterface.planet = { ProjectStorage: {}, open: jest.fn() };
        jest.spyOn(planetInterface, "saveLocally").mockImplementation(() => {});
        jest.spyOn(planetInterface, "hideMusicBlocks").mockImplementation(() => {});
        jest.spyOn(planetInterface, "showPlanet").mockImplementation(() => {});
        planetInterface.openPlanet();
        expect(planetInterface.saveLocally).toHaveBeenCalled();
        expect(planetInterface.hideMusicBlocks).toHaveBeenCalled();
        expect(planetInterface.showPlanet).toHaveBeenCalled();
    });

    test("openPlanet: does not crash when Planet backend is unavailable", () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        planetInterface.planet = null;
        jest.spyOn(planetInterface, "saveLocally");
        jest.spyOn(planetInterface, "hideMusicBlocks");
        jest.spyOn(planetInterface, "showPlanet");

        expect(() => planetInterface.openPlanet()).not.toThrow();
        expect(planetInterface.saveLocally).not.toHaveBeenCalled();
        expect(planetInterface.hideMusicBlocks).not.toHaveBeenCalled();
        expect(planetInterface.showPlanet).not.toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledWith(
            "[PlanetInterface] openPlanet called before Planet is ready."
        );
        errorSpy.mockRestore();
    });

    test("closePlanet calls hidePlanet and showMusicBlocks", () => {
        jest.spyOn(planetInterface, "hidePlanet").mockImplementation(() => {});
        jest.spyOn(planetInterface, "showMusicBlocks").mockImplementation(() => {});
        planetInterface.closePlanet();
        expect(planetInterface.hidePlanet).toHaveBeenCalled();
        expect(planetInterface.showMusicBlocks).toHaveBeenCalled();
    });

    test("newProject calls closePlanet, initialiseNewProject, justLoadStart, and saveLocally", () => {
        jest.spyOn(planetInterface, "closePlanet").mockImplementation(() => {});
        jest.spyOn(planetInterface, "initialiseNewProject").mockImplementation(() => {});
        jest.spyOn(planetInterface, "saveLocally").mockImplementation(() => {});
        planetInterface.newProject();
        expect(planetInterface.closePlanet).toHaveBeenCalled();
        expect(planetInterface.initialiseNewProject).toHaveBeenCalled();
        expect(mockActivity.justLoadStart).toHaveBeenCalled();
        expect(planetInterface.saveLocally).toHaveBeenCalled();
    });
    test("onConverterLoad sets window.Converter", () => {
        planetInterface.planet = { Converter: "mockConverter" };
        planetInterface.onConverterLoad();
        expect(window.Converter).toBe("mockConverter");
    });

    test("getCurrentProjectName returns name from ProjectStorage", () => {
        planetInterface.planet = {
            ProjectStorage: { getCurrentProjectName: jest.fn(() => "ProjectX") }
        };
        expect(planetInterface.getCurrentProjectName()).toBe("ProjectX");
    });
    test("initialiseNewProject should reset project state", () => {
        planetInterface.planet = {
            ProjectStorage: { initialiseNewProject: jest.fn().mockResolvedValue() }
        };
        planetInterface.initialiseNewProject("New Name");
        expect(planetInterface.planet.ProjectStorage.initialiseNewProject).toHaveBeenCalledWith(
            "New Name"
        );
        expect(mockActivity.sendAllToTrash).toHaveBeenCalled();
        expect(mockActivity.refreshCanvas).toHaveBeenCalled();
        expect(mockActivity.blocks.trashStacks).toEqual([]);
    });

    test("initialiseNewProject returns early when Planet storage is unavailable", () => {
        planetInterface.planet = null;

        expect(() => planetInterface.initialiseNewProject("New Name")).not.toThrow();
        expect(mockActivity.sendAllToTrash).not.toHaveBeenCalled();
        expect(mockActivity.refreshCanvas).not.toHaveBeenCalled();
    });

    test("initialiseNewProject can leave workspace clearing to an import", () => {
        planetInterface.planet = {
            ProjectStorage: { initialiseNewProject: jest.fn().mockResolvedValue() }
        };

        planetInterface.initialiseNewProject("Imported Project", false);

        expect(planetInterface.planet.ProjectStorage.initialiseNewProject).toHaveBeenCalledWith(
            "Imported Project"
        );
        expect(mockActivity.sendAllToTrash).not.toHaveBeenCalled();
        expect(mockActivity.refreshCanvas).not.toHaveBeenCalled();
        expect(mockActivity.blocks.trashStacks).toEqual([]);
    });

    test.each([
        ["Imported Project", false, "Imported Project"],
        [undefined, true, "My Project"]
    ])(
        "initialiseNewProject refreshes the title after initializing %s (#9716)",
        async (name, clearWorkspace, storedName) => {
            let finishInitialization;
            const initialization = new Promise(resolve => {
                finishInitialization = resolve;
            });
            planetInterface.planet = {
                ProjectStorage: {
                    initialiseNewProject: jest.fn(() => initialization),
                    getCurrentProjectName: jest.fn(() => storedName)
                }
            };
            document.title = "Previous Project";

            const result = planetInterface.initialiseNewProject(name, clearWorkspace);
            expect(document.title).toBe("Previous Project");
            finishInitialization("new-project-id");

            await expect(result).resolves.toBe("new-project-id");
            expect(document.title).toBe(storedName);
        }
    );

    test("initialiseNewProject preserves the title and rejection when initialization fails", async () => {
        const error = new Error("Could not save project");
        planetInterface.planet = {
            ProjectStorage: {
                initialiseNewProject: jest.fn().mockRejectedValue(error),
                getCurrentProjectName: jest.fn(() => "Unsaved Project")
            }
        };
        document.title = "Previous Project";

        await expect(planetInterface.initialiseNewProject("Unsaved Project", false)).rejects.toBe(
            error
        );
        expect(document.title).toBe("Previous Project");
        expect(planetInterface.planet.ProjectStorage.getCurrentProjectName).not.toHaveBeenCalled();
    });

    // Regression test for #7350: when running from file:///index.html,
    // planet.planet is null so getCurrentProjectName() must return ""
    // to prevent _afterDelete from entering the Planet branch.
    test("getCurrentProjectName returns empty string when inner Planet is null (#7350)", () => {
        planetInterface.planet = null;
        expect(planetInterface.getCurrentProjectName()).toBe("");
    });

    test("loadProjectFromData: default merge=false", () => {
        planetInterface.iframe = { style: { display: "block" } };
        mockActivity.blocks.loadNewBlocks.mockClear();

        planetInterface.getCurrentProjectName = jest.fn(() => "foo");
        planetInterface.loadProjectFromData(JSON.stringify({ whatever: 1 }));
        expect(mockActivity.sendAllToTrash).toHaveBeenCalledWith(false, true);
        expect(mockActivity.textMsg).toHaveBeenCalledWith("foo");
        expect(mockActivity.loading).toBe(false);
        expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalledWith({ whatever: 1 });
        expect(document.body.style.cursor).toBe("default");
    });

    test("loadProjectFromData forgets the trash and undo history of the replaced project", () => {
        planetInterface.closePlanet = jest.fn();
        mockActivity.blocks.trashStacks = ["3", "7"];
        mockActivity.blocks.actionHistory = [{ type: "trash", blockId: 3 }];
        mockActivity.blocks.redoActionHistory = [{ type: "trash", blockId: 7 }];

        planetInterface.loadProjectFromData(JSON.stringify([]));

        expect(mockActivity.blocks.trashStacks).toEqual([]);
        expect(mockActivity.blocks.actionHistory).toEqual([]);
        expect(mockActivity.blocks.redoActionHistory).toEqual([]);
    });

    test("loadProjectFromData keeps the trash history when merging", () => {
        planetInterface.closePlanet = jest.fn();
        mockActivity.blocks.trashStacks = ["3"];

        planetInterface.loadProjectFromData(JSON.stringify([]), true);

        expect(mockActivity.sendAllToTrash).not.toHaveBeenCalled();
        expect(mockActivity.blocks.trashStacks).toEqual(["3"]);
    });

    test("loadProjectFromFile focuses, clicks, scrolls", () => {
        const input = document.getElementById("myOpenFile");
        input.focus = jest.fn();
        input.click = jest.fn();

        planetInterface.loadProjectFromFile();

        expect(input.focus).toHaveBeenCalled();
        expect(input.click).toHaveBeenCalled();
        expect(window.scroll).toHaveBeenCalledWith(0, 0);
    });

    test("saveLocally: svgData empty → saveLocally(data, null)", () => {
        doSVG.mockReturnValue("");
        const D = { x: 1 };
        mockActivity.prepareExport.mockReturnValue(D);
        mockActivity.stage.update.mockClear();

        planetInterface.planet = { ProjectStorage: { saveLocally: jest.fn() } };

        return planetInterface.saveLocally().then(() => {
            expect(mockActivity.stage.update).toHaveBeenCalled();
            expect(planetInterface.planet.ProjectStorage.saveLocally).toHaveBeenCalledWith(D, null);
        });
    });

    test("saveLocally waits for a project load to finish instead of saving part of it", async () => {
        const saveLocally = jest.fn().mockResolvedValue();
        planetInterface.planet = {
            ProjectStorage: { saveLocally, getCurrentProjectID: () => "B" }
        };
        mockActivity.prepareExport.mockClear();
        mockActivity.blocks.runAfterLoad.mockClear();
        mockActivity.blocks.isLoading.mockReturnValueOnce(true);

        await expect(planetInterface.saveLocally()).resolves.toBeNull();

        expect(mockActivity.prepareExport).not.toHaveBeenCalled();
        expect(saveLocally).not.toHaveBeenCalled();
        expect(mockActivity.blocks.runAfterLoad).toHaveBeenCalledWith(planetInterface.saveLocally);

        const [saveAfterLoad] = mockActivity.blocks.runAfterLoad.mock.calls[0];
        doSVG.mockReturnValue("");
        mockActivity.prepareExport.mockReturnValue("[full project]");
        await saveAfterLoad();

        expect(saveLocally).toHaveBeenCalledWith("[full project]", null, "B");
    });

    test("saveLocally handles unavailable Planet storage according to its failure option", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        planetInterface.planet = null;

        await expect(planetInterface.saveLocally()).resolves.toBeNull();
        await expect(
            planetInterface.saveLocally({ rejectOnProjectSaveError: true })
        ).rejects.toThrow("[PlanetInterface] saveLocally called before Planet storage is ready.");
        expect(errorSpy).toHaveBeenCalledWith(
            "[PlanetInterface] saveLocally called before Planet storage is ready."
        );
        errorSpy.mockRestore();
    });

    test("saveLocally returns null and skips saving when Planet iframe is open", async () => {
        const saveLocally = jest.fn().mockResolvedValue();
        planetInterface.planet = {
            ProjectStorage: { saveLocally, getCurrentProjectID: () => "proj1" }
        };
        planetInterface.iframe = { style: { display: "block" } };

        const result = await planetInterface.saveLocally();
        expect(result).toBeNull();
        expect(saveLocally).not.toHaveBeenCalled();
    });

    test("saveLocally resumes saving normally once Planet iframe is closed", async () => {
        doSVG.mockReturnValue("");
        const D = { x: 1 };
        mockActivity.prepareExport.mockReturnValue(D);
        const saveLocally = jest.fn().mockResolvedValue();
        planetInterface.planet = {
            ProjectStorage: { saveLocally, getCurrentProjectID: () => "proj1" }
        };
        planetInterface.iframe = { style: { display: "none" } };

        await planetInterface.saveLocally();
        expect(saveLocally).toHaveBeenCalledWith(D, null, "proj1");
    });

    test("saveLocally: pending thumbnail callback executing after Planet opens, active project is deleted, and Planet closes does not overwrite replacement project or recreate deleted project", async () => {
        doSVG.mockReturnValue("<svg/>");
        mockActivity.prepareExport.mockReturnValue({ blocks: ["stale-snapshot"] });
        global.base64Encode = jest.fn(s => s);

        let pendingImage;
        global.Image = class {
            constructor() {
                pendingImage = this;
            }
            set src(_value) {}
        };
        global.createjs = {
            Bitmap: class {
                getBounds() {
                    return { x: 0, y: 0, width: 1, height: 1 };
                }
                cache() {
                    this.bitmapCache = { getCacheDataURL: () => "NEW_BITMAP_URL" };
                }
            }
        };

        const storageData = {
            CurrentProject: "proj1",
            Projects: {
                proj1: {
                    ProjectName: "Active Song",
                    ProjectData: { blocks: ["active-blocks"] },
                    ProjectImage: "img-A"
                },
                proj2: {
                    ProjectName: "Replacement Song",
                    ProjectData: { blocks: ["replacement-blocks"] },
                    ProjectImage: "img-B"
                }
            }
        };

        const realStorage = {
            data: storageData,
            getCurrentProjectID: () => storageData.CurrentProject,
            getCurrentProjectImage: () =>
                storageData.Projects[storageData.CurrentProject]?.ProjectImage || null,
            saveLocally: jest.fn(async (data, image, id) => {
                const target = id ?? storageData.CurrentProject;
                if (!storageData.Projects[target]) return;
                storageData.Projects[target].ProjectData = data;
                storageData.Projects[target].ProjectImage = image;
            })
        };

        planetInterface.planet = { ProjectStorage: realStorage };
        planetInterface.iframe = { style: { display: "none" } };

        // 1. Begin saving workspace data for active project (proj1) and hold thumbnail callback
        await planetInterface.saveLocally();

        // 2. Open Planet and delete active project
        planetInterface.iframe.style.display = "block";
        delete storageData.Projects["proj1"];

        // 3. Select or transition to replacement project (proj2)
        storageData.CurrentProject = "proj2";

        // 4. Close Planet before the pending thumbnail callback executes
        planetInterface.iframe.style.display = "none";

        // 5. Resolve the pending callback
        expect(pendingImage).toBeDefined();
        pendingImage.onload();
        await Promise.resolve();

        // 6. Verify that replacement project's data, name, image, and identity are NOT overwritten
        expect(storageData.CurrentProject).toBe("proj2");
        expect(storageData.Projects["proj2"].ProjectName).toBe("Replacement Song");
        expect(storageData.Projects["proj2"].ProjectData).toEqual({
            blocks: ["replacement-blocks"]
        });
        expect(storageData.Projects["proj2"].ProjectImage).toBe("img-B");

        // 7. Verify deleted project has NOT been recreated and no unintended project created
        expect(storageData.Projects["proj1"]).toBeUndefined();
        expect(Object.keys(storageData.Projects)).toEqual(["proj2"]);
    });

    test("saveLocally: pending thumbnail callback executing after Planet opens, project is switched, and Planet closes does not overwrite switched project", async () => {
        doSVG.mockReturnValue("<svg/>");
        mockActivity.prepareExport.mockReturnValue({ blocks: ["proj1-stale-blocks"] });
        global.base64Encode = jest.fn(s => s);

        let pendingImage;
        global.Image = class {
            constructor() {
                pendingImage = this;
            }
            set src(_value) {}
        };
        global.createjs = {
            Bitmap: class {
                getBounds() {
                    return { x: 0, y: 0, width: 1, height: 1 };
                }
                cache() {
                    this.bitmapCache = { getCacheDataURL: () => "NEW_BITMAP_URL" };
                }
            }
        };

        const storageData = {
            CurrentProject: "proj1",
            Projects: {
                proj1: {
                    ProjectName: "Song 1",
                    ProjectData: { blocks: ["proj1-blocks"] },
                    ProjectImage: "img-1"
                },
                proj2: {
                    ProjectName: "Song 2",
                    ProjectData: { blocks: ["proj2-blocks"] },
                    ProjectImage: "img-2"
                }
            }
        };

        const realStorage = {
            data: storageData,
            getCurrentProjectID: () => storageData.CurrentProject,
            getCurrentProjectImage: () =>
                storageData.Projects[storageData.CurrentProject]?.ProjectImage || null,
            saveLocally: jest.fn(async (data, image, id) => {
                const target = id ?? storageData.CurrentProject;
                if (!storageData.Projects[target]) return;
                storageData.Projects[target].ProjectData = data;
                storageData.Projects[target].ProjectImage = image;
            })
        };

        planetInterface.planet = { ProjectStorage: realStorage };
        planetInterface.iframe = { style: { display: "none" } };

        // 1. Begin save for proj1
        await planetInterface.saveLocally();

        // 2. Open Planet, switch to proj2, close Planet
        planetInterface.iframe.style.display = "block";
        storageData.CurrentProject = "proj2";
        planetInterface.iframe.style.display = "none";

        // 3. Resolve pending callback from proj1 save
        pendingImage.onload();
        await Promise.resolve();

        // 4. Verify proj2 has not been overwritten by proj1's stale snapshot
        expect(storageData.CurrentProject).toBe("proj2");
        expect(storageData.Projects["proj2"].ProjectData).toEqual({ blocks: ["proj2-blocks"] });
        expect(storageData.Projects["proj2"].ProjectImage).toBe("img-2");
    });

    test("saveLocally: delayed thumbnail callback from older snapshot A does not overwrite newer snapshot B on the same project", async () => {
        doSVG.mockReturnValue("<svg>thumbnail-A</svg>");
        mockActivity.prepareExport.mockReturnValue({ blocks: ["snapshot-A"] });
        global.base64Encode = jest.fn(s => s);

        const pendingImages = [];
        global.Image = class {
            constructor() {
                pendingImages.push(this);
            }
            set src(_value) {}
        };
        global.createjs = {
            Bitmap: class {
                constructor() {}
                getBounds() {
                    return { x: 0, y: 0, width: 1, height: 1 };
                }
                cache() {
                    this.bitmapCache = {
                        getCacheDataURL: () => "THUMBNAIL_URL_A"
                    };
                }
            }
        };

        const storageData = {
            CurrentProject: "proj1",
            Projects: {
                proj1: {
                    ProjectName: "My Project",
                    ProjectData: { blocks: ["snapshot-orig"] },
                    ProjectImage: "img-orig"
                }
            }
        };

        const realStorage = {
            data: storageData,
            getCurrentProjectID: () => storageData.CurrentProject,
            getCurrentProjectImage: () =>
                storageData.Projects[storageData.CurrentProject]?.ProjectImage || null,
            saveLocally: jest.fn(async (data, image, id) => {
                const target = id ?? storageData.CurrentProject;
                if (!storageData.Projects[target]) return;
                if (data !== undefined) {
                    storageData.Projects[target].ProjectData = data;
                }
                storageData.Projects[target].ProjectImage = image;
            }),
            saveThumbnail: jest.fn(async (image, id) => {
                const target = id ?? storageData.CurrentProject;
                if (!storageData.Projects[target]) return;
                storageData.Projects[target].ProjectImage = image;
            })
        };

        planetInterface.planet = { ProjectStorage: realStorage };
        planetInterface.iframe = { style: { display: "none" } };

        // 1. Start saving project proj1, capturing workspace data snapshot A
        await planetInterface.saveLocally();
        expect(storageData.Projects["proj1"].ProjectData).toEqual({ blocks: ["snapshot-A"] });
        expect(pendingImages.length).toBe(1);
        const olderImageCallbackA = pendingImages[0];

        // 2. Initial save completed, thumbnail callback A is deferred.
        // 3. Make a subsequent legitimate save of newer workspace data snapshot B to proj1
        mockActivity.prepareExport.mockReturnValue({ blocks: ["snapshot-B"] });
        doSVG.mockReturnValue("<svg>thumbnail-B</svg>");
        await planetInterface.saveLocally();
        expect(storageData.Projects["proj1"].ProjectData).toEqual({ blocks: ["snapshot-B"] });

        // 4. Resolve the older thumbnail callback from snapshot A
        olderImageCallbackA.onload();
        await Promise.resolve();

        // 5. Inspect project data: snapshot B must NOT be replaced with stale snapshot A
        expect(storageData.Projects["proj1"].ProjectData).toEqual({ blocks: ["snapshot-B"] });
        expect(storageData.Projects["proj1"].ProjectImage).toBe("THUMBNAIL_URL_A");
        expect(realStorage.saveThumbnail).toHaveBeenCalledWith("THUMBNAIL_URL_A", "proj1");
    });

    test("saveLocally: delayed thumbnail callback for proj1 executing after user switches to proj2 does not corrupt either project", async () => {
        doSVG.mockReturnValue("<svg>thumbnail-1</svg>");
        mockActivity.prepareExport.mockReturnValue({ blocks: ["proj1-blocks"] });
        global.base64Encode = jest.fn(s => s);

        let pendingImage;
        global.Image = class {
            constructor() {
                pendingImage = this;
            }
            set src(_value) {}
        };
        global.createjs = {
            Bitmap: class {
                getBounds() {
                    return { x: 0, y: 0, width: 1, height: 1 };
                }
                cache() {
                    this.bitmapCache = { getCacheDataURL: () => "THUMBNAIL_1_URL" };
                }
            }
        };

        const storageData = {
            CurrentProject: "proj1",
            Projects: {
                proj1: {
                    ProjectName: "Song 1",
                    ProjectData: { blocks: ["proj1-blocks"] },
                    ProjectImage: "img-1-old"
                },
                proj2: {
                    ProjectName: "Song 2",
                    ProjectData: { blocks: ["proj2-blocks"] },
                    ProjectImage: "img-2"
                }
            }
        };

        const realStorage = {
            data: storageData,
            getCurrentProjectID: () => storageData.CurrentProject,
            getCurrentProjectImage: () =>
                storageData.Projects[storageData.CurrentProject]?.ProjectImage || null,
            saveLocally: jest.fn(async (data, image, id) => {
                const target = id ?? storageData.CurrentProject;
                if (!storageData.Projects[target]) return;
                if (data !== undefined) {
                    storageData.Projects[target].ProjectData = data;
                }
                storageData.Projects[target].ProjectImage = image;
            }),
            saveThumbnail: jest.fn(async (image, id) => {
                const target = id ?? storageData.CurrentProject;
                if (!storageData.Projects[target]) return;
                storageData.Projects[target].ProjectImage = image;
            })
        };

        planetInterface.planet = { ProjectStorage: realStorage };
        planetInterface.iframe = { style: { display: "none" } };

        // 1. Begin save for proj1
        await planetInterface.saveLocally();

        // 2. Switch to proj2
        storageData.CurrentProject = "proj2";

        // 3. Resolve pending callback from proj1 save
        pendingImage.onload();
        await Promise.resolve();

        // 4. Verify proj1 received its thumbnail without corrupting proj2 or proj1 data
        expect(storageData.CurrentProject).toBe("proj2");
        expect(storageData.Projects["proj1"].ProjectData).toEqual({ blocks: ["proj1-blocks"] });
        expect(storageData.Projects["proj1"].ProjectImage).toBe("THUMBNAIL_1_URL");
        expect(storageData.Projects["proj2"].ProjectData).toEqual({ blocks: ["proj2-blocks"] });
        expect(storageData.Projects["proj2"].ProjectImage).toBe("img-2");
    });

    test("Check B: initial workspace save with no CurrentProject reliably captures projectId so delayed thumbnail does not corrupt switched project", async () => {
        doSVG.mockReturnValue("<svg>initial-thumbnail</svg>");
        mockActivity.prepareExport.mockReturnValue({ blocks: ["initial-project-data"] });
        global.base64Encode = jest.fn(s => s);

        let pendingImage;
        global.Image = class {
            constructor() {
                pendingImage = this;
            }
            set src(_value) {}
        };
        global.createjs = {
            Bitmap: class {
                getBounds() {
                    return { x: 0, y: 0, width: 1, height: 1 };
                }
                cache() {
                    this.bitmapCache = { getCacheDataURL: () => "RENDERED_INITIAL_THUMB" };
                }
            }
        };

        const storageData = {
            CurrentProject: undefined,
            Projects: {}
        };

        let resolveInit;
        const initPromise = new Promise(resolve => {
            resolveInit = resolve;
        });

        const realStorage = {
            data: storageData,
            getCurrentProjectID: () => storageData.CurrentProject,
            getCurrentProjectImage: () =>
                storageData.Projects[storageData.CurrentProject]?.ProjectImage || null,
            saveLocally: jest.fn(async (data, image, id) => {
                if (id !== undefined) {
                    if (!storageData.Projects[id]) return;
                    storageData.Projects[id].ProjectData = data;
                    storageData.Projects[id].ProjectImage = image;
                    return;
                }
                // Simulate asynchronous initialiseNewProject()
                await initPromise;
                const newId = "proj-initial-123";
                storageData.CurrentProject = newId;
                storageData.Projects[newId] = {
                    ProjectName: "My Song",
                    ProjectData: data,
                    ProjectImage: image,
                    DateLastModified: 1000
                };
            }),
            saveThumbnail: jest.fn(async (image, id) => {
                const target = id ?? storageData.CurrentProject;
                if (!storageData.Projects[target]) return;
                storageData.Projects[target].ProjectImage = image;
            })
        };

        planetInterface.planet = { ProjectStorage: realStorage };
        planetInterface.iframe = { style: { display: "none" } };

        // 1. Start first workspace save (starts with CurrentProject === undefined)
        const firstSavePromise = planetInterface.saveLocally();

        // 2. Control asynchronous initialization and thumbnail generation
        expect(pendingImage).toBeDefined();

        // 3. Allow project creation to complete
        resolveInit();
        await firstSavePromise;

        // Verify initial save completed and created the project
        expect(storageData.CurrentProject).toBe("proj-initial-123");
        expect(storageData.Projects["proj-initial-123"].ProjectData).toEqual({
            blocks: ["initial-project-data"]
        });

        // 4. Exercise a project switch before thumbnail callback resolves
        storageData.Projects["proj-other-456"] = {
            ProjectName: "Other Song",
            ProjectData: { blocks: ["other-data"] },
            ProjectImage: "other-image",
            DateLastModified: 2000
        };
        storageData.CurrentProject = "proj-other-456";

        // 5. Resolve callback
        pendingImage.onload();
        await Promise.resolve();

        // 6. Verify: delayed thumbnail writes to the original created project ("proj-initial-123"), NOT the switched project ("proj-other-456")
        expect(storageData.CurrentProject).toBe("proj-other-456");
        expect(storageData.Projects["proj-other-456"].ProjectData).toEqual({
            blocks: ["other-data"]
        });
        expect(storageData.Projects["proj-other-456"].ProjectImage).toBe("other-image");

        expect(storageData.Projects["proj-initial-123"].ProjectImage).toBe(
            "RENDERED_INITIAL_THUMB"
        );
        expect(storageData.Projects["proj-initial-123"].ProjectData).toEqual({
            blocks: ["initial-project-data"]
        });
    });

    test("Check B: initial workspace save with no CurrentProject reliably captures projectId so delayed thumbnail does not recreate deleted project", async () => {
        doSVG.mockReturnValue("<svg>initial-thumbnail</svg>");
        mockActivity.prepareExport.mockReturnValue({ blocks: ["initial-project-data"] });
        global.base64Encode = jest.fn(s => s);

        let pendingImage;
        global.Image = class {
            constructor() {
                pendingImage = this;
            }
            set src(_value) {}
        };
        global.createjs = {
            Bitmap: class {
                getBounds() {
                    return { x: 0, y: 0, width: 1, height: 1 };
                }
                cache() {
                    this.bitmapCache = { getCacheDataURL: () => "RENDERED_INITIAL_THUMB" };
                }
            }
        };

        const storageData = {
            CurrentProject: undefined,
            Projects: {}
        };

        const realStorage = {
            data: storageData,
            getCurrentProjectID: () => storageData.CurrentProject,
            getCurrentProjectImage: () =>
                storageData.Projects[storageData.CurrentProject]?.ProjectImage || null,
            saveLocally: jest.fn(async (data, image, id) => {
                if (id !== undefined) {
                    if (!storageData.Projects[id]) return;
                    storageData.Projects[id].ProjectData = data;
                    storageData.Projects[id].ProjectImage = image;
                    return;
                }
                const newId = "proj-initial-789";
                storageData.CurrentProject = newId;
                storageData.Projects[newId] = {
                    ProjectName: "My Song",
                    ProjectData: data,
                    ProjectImage: image,
                    DateLastModified: 1000
                };
            }),
            saveThumbnail: jest.fn(async (image, id) => {
                const target = id ?? storageData.CurrentProject;
                if (!storageData.Projects[target]) return;
                storageData.Projects[target].ProjectImage = image;
            })
        };

        planetInterface.planet = { ProjectStorage: realStorage };
        planetInterface.iframe = { style: { display: "none" } };

        // 1. Start initial save and complete creation
        await planetInterface.saveLocally();
        expect(storageData.CurrentProject).toBe("proj-initial-789");

        // 2. Delete the created project before thumbnail callback resolves
        delete storageData.Projects["proj-initial-789"];
        storageData.CurrentProject = undefined;

        // 3. Resolve callback
        pendingImage.onload();
        await Promise.resolve();

        // 4. Verify deleted project was NOT recreated and no phantom project was created
        expect(storageData.Projects["proj-initial-789"]).toBeUndefined();
        expect(Object.keys(storageData.Projects).length).toBe(0);
        expect(storageData.CurrentProject).toBeUndefined();
    });

    test("saveLocally: pending thumbnail callback executing while Planet remains open safely drops thumbnail if project was deleted or undefined", async () => {
        doSVG.mockReturnValue("<svg/>");
        mockActivity.prepareExport.mockReturnValue({ blocks: ["active-blocks"] });
        global.base64Encode = jest.fn(s => s);

        let pendingImage;
        global.Image = class {
            constructor() {
                pendingImage = this;
            }
            set src(_value) {}
        };
        global.createjs = {
            Bitmap: class {
                getBounds() {
                    return { x: 0, y: 0, width: 1, height: 1 };
                }
                cache() {
                    this.bitmapCache = { getCacheDataURL: () => "NEW_BITMAP_URL" };
                }
            }
        };

        const storageData = {
            CurrentProject: "proj1",
            Projects: {
                proj1: {
                    ProjectName: "Song 1",
                    ProjectData: { blocks: ["active-blocks"] },
                    ProjectImage: "img-1"
                }
            }
        };

        const realStorage = {
            data: storageData,
            getCurrentProjectID: () => storageData.CurrentProject,
            getCurrentProjectImage: () =>
                storageData.Projects[storageData.CurrentProject]?.ProjectImage || null,
            saveLocally: jest.fn(async (data, image, id) => {
                const target = id ?? storageData.CurrentProject;
                if (!storageData.Projects[target]) return;
                storageData.Projects[target].ProjectData = data;
                storageData.Projects[target].ProjectImage = image;
            }),
            saveThumbnail: jest.fn(async (image, id) => {
                const target = id ?? storageData.CurrentProject;
                if (!storageData.Projects[target]) return;
                storageData.Projects[target].ProjectImage = image;
            })
        };

        planetInterface.planet = { ProjectStorage: realStorage };
        planetInterface.iframe = { style: { display: "none" } };

        // 1. Begin save while Planet is closed
        await planetInterface.saveLocally();
        expect(pendingImage).toBeDefined();

        // 2. User opens Planet and deletes proj1
        planetInterface.iframe.style.display = "block";
        delete storageData.Projects["proj1"];

        // 3. Thumbnail callback fires while Planet is STILL OPEN
        pendingImage.onload();
        await Promise.resolve();

        // 4. Verify thumbnail was NOT written and deleted project was NOT resurrected
        expect(realStorage.saveThumbnail).not.toHaveBeenCalled();
        expect(storageData.Projects["proj1"]).toBeUndefined();
    });

    test("saveLocally: captures newly created projectId during commitThumbnail when initial save had undefined CurrentProject", async () => {
        doSVG.mockReturnValue("<svg/>");
        mockActivity.prepareExport.mockReturnValue({ blocks: ["new-blocks"] });
        global.base64Encode = jest.fn(s => s);

        let pendingImage;
        global.Image = class {
            constructor() {
                pendingImage = this;
            }
            set src(_value) {}
        };
        global.createjs = {
            Bitmap: class {
                getBounds() {
                    return { x: 0, y: 0, width: 1, height: 1 };
                }
                cache() {
                    this.bitmapCache = { getCacheDataURL: () => "NEW_BITMAP_URL" };
                }
            }
        };

        let currentId = undefined;
        const storageData = {
            get CurrentProject() {
                return currentId;
            },
            Projects: {}
        };

        const realStorage = {
            data: storageData,
            getCurrentProjectID: jest.fn(() => currentId),
            getCurrentProjectImage: () => null,
            saveLocally: jest.fn(async () => ({ success: true })),
            saveThumbnail: jest.fn(async (image, id) => {
                if (storageData.Projects[id]) {
                    storageData.Projects[id].ProjectImage = image;
                }
            })
        };

        planetInterface.planet = { ProjectStorage: realStorage };
        planetInterface.iframe = { style: { display: "none" } };

        // 1. Call saveLocally with no initial CurrentProject (projectId starts undefined)
        const savePromise = planetInterface.saveLocally();

        // 2. Simulate project ID becoming available when initial data save resolves
        currentId = "proj-async-created";
        storageData.Projects["proj-async-created"] = {
            ProjectName: "New Project",
            ProjectData: { blocks: ["new-blocks"] },
            ProjectImage: null
        };

        await savePromise;

        // 3. Fire thumbnail callback
        expect(pendingImage).toBeDefined();
        pendingImage.onload();
        await Promise.resolve();

        // 4. Verify commitThumbnail retrieved currentId via getCurrentProjectID() and saved thumbnail
        expect(realStorage.saveThumbnail).toHaveBeenCalledWith(
            "NEW_BITMAP_URL",
            "proj-async-created"
        );
        expect(storageData.Projects["proj-async-created"].ProjectImage).toBe("NEW_BITMAP_URL");
    });

    test("saveLocally: saveThumbnail safely returns null when projectId cannot be determined and does not save thumbnail", async () => {
        doSVG.mockReturnValue("<svg/>");
        mockActivity.prepareExport.mockReturnValue({ blocks: ["blocks"] });
        global.base64Encode = jest.fn(s => s);

        let pendingImage;
        global.Image = class {
            constructor() {
                pendingImage = this;
            }
            set src(_value) {}
        };
        global.createjs = {
            Bitmap: class {
                getBounds() {
                    return { x: 0, y: 0, width: 1, height: 1 };
                }
                cache() {
                    this.bitmapCache = { getCacheDataURL: () => "NEW_BITMAP_URL" };
                }
            }
        };

        const realStorage = {
            data: { Projects: {} },
            getCurrentProjectID: jest.fn(() => undefined),
            getCurrentProjectImage: () => null,
            saveLocally: jest.fn(async () => null),
            saveThumbnail: jest.fn(async () => {})
        };

        planetInterface.planet = { ProjectStorage: realStorage };
        planetInterface.iframe = { style: { display: "none" } };

        // 1. saveLocally starts with undefined project ID
        await planetInterface.saveLocally();

        // 2. Fire thumbnail callback while getCurrentProjectID continues to return undefined
        expect(pendingImage).toBeDefined();
        pendingImage.onload();
        await Promise.resolve();

        // 3. Verify saveThumbnail safely returned null without calling storage.saveThumbnail with undefined
        expect(realStorage.saveThumbnail).not.toHaveBeenCalled();
    });
    test("getCurrentProjectDescription/Image/TimeLastSaved", () => {
        const D = new Date(2020, 1, 1);
        planetInterface.planet = {
            ProjectStorage: {
                getCurrentProjectDescription: () => "desc",
                getCurrentProjectImage: () => "img.png",
                TimeLastSaved: D
            }
        };
        expect(planetInterface.getCurrentProjectDescription()).toBe("desc");
        expect(planetInterface.getCurrentProjectImage()).toBe("img.png");
        expect(planetInterface.getTimeLastSaved()).toBe(D);
    });
    test("openCurrentProject returns promise data", async () => {
        planetInterface.planet = {
            ProjectStorage: { getCurrentProjectData: jest.fn(async () => 123) }
        };
        await expect(planetInterface.openCurrentProject()).resolves.toBe(123);
    });
    test("openCurrentProject returns null when Planet storage is unavailable", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        planetInterface.planet = null;
        await expect(planetInterface.openCurrentProject()).resolves.toBeNull();
        expect(errorSpy).toHaveBeenCalledWith(
            "[PlanetInterface] openCurrentProject called before Planet storage is ready."
        );
        errorSpy.mockRestore();
    });
    test("openProjectFromPlanet proxies arguments", () => {
        planetInterface.planet = { openProjectFromPlanet: jest.fn() };
        planetInterface.openProjectFromPlanet("ID42", "oops");
        expect(planetInterface.planet.openProjectFromPlanet).toHaveBeenCalledWith("ID42", "oops");
    });
    test("openProjectFromPlanet returns safely when Planet backend is unavailable", () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        planetInterface.planet = null;

        expect(() => planetInterface.openProjectFromPlanet("ID42", "oops")).not.toThrow();
        expect(errorSpy).toHaveBeenCalledWith(
            "[PlanetInterface] openProjectFromPlanet called before Planet is ready."
        );

        errorSpy.mockRestore();
    });
    test("hideMusicBlocks also calls widgetWindows.hideAllWindows and disables DOM events after 250ms", () => {
        jest.useFakeTimers();
        planetInterface.hideMusicBlocks();

        expect(window.widgetWindows.hideAllWindows).toHaveBeenCalled();

        expect(mockActivity.stage.enableDOMEvents).not.toHaveBeenCalledWith(false);

        jest.advanceTimersByTime(250);
        expect(mockActivity.stage.enableDOMEvents).toHaveBeenCalledWith(false);

        jest.useRealTimers();
    });

    test("init(): success wires up planet, Converter, handlers, and mainCanvas", async () => {
        global._THIS_IS_MUSIC_BLOCKS_ = {};

        const iframe = document.getElementById("planet-iframe");
        const win = iframe.contentWindow;
        const stubPlanet = {
            Converter: "CONV",
            setLoadProjectFromData: jest.fn(),
            setPlanetClose: jest.fn(),
            setLoadNewProject: jest.fn(),
            setLoadProjectFromFile: jest.fn(),
            setOnConverterLoad: jest.fn()
        };

        win.makePlanet = jest.fn(async () => {});
        win.p = stubPlanet;

        await planetInterface.init();

        expect(planetInterface.planet).toBe(stubPlanet);

        expect(stubPlanet.setLoadProjectFromData).toHaveBeenCalledWith(expect.any(Function));
        expect(stubPlanet.setPlanetClose).toHaveBeenCalledWith(expect.any(Function));
        expect(stubPlanet.setLoadNewProject).toHaveBeenCalledWith(expect.any(Function));
        expect(stubPlanet.setLoadProjectFromFile).toHaveBeenCalledWith(expect.any(Function));
        expect(stubPlanet.setOnConverterLoad).toHaveBeenCalledWith(expect.any(Function));

        expect(window.Converter).toBe("CONV");
        expect(planetInterface.mainCanvas).toBe(mockActivity.canvas);
    });
    test("showPlanet: catch block when local-tab missing", () => {
        const overlay = document.getElementById("overlayCanvas");
        overlay.toDataURL = () => "PNG";
        planetInterface.planet = { open: jest.fn() };
        planetInterface.iframe = document.getElementById("planet-iframe");
        planetInterface.iframe.contentWindow = {
            document: { getElementById: () => null }
        };
        console.error = jest.fn();

        planetInterface.showPlanet();

        expect(console.error).toHaveBeenCalled();
    });
    test("saveLocally: non-empty SVG triggers image‑onload path", done => {
        doSVG.mockReturnValue("<svg/>");
        mockActivity.prepareExport.mockReturnValue("EXPORT");
        global.base64Encode = jest.fn(s => s);
        planetInterface.planet = {
            ProjectStorage: {
                getCurrentProjectImage: jest.fn(() => "OLD_IMAGE"),
                saveLocally: jest.fn()
            }
        };

        global.Image = class {
            set src(_v) {
                this.onload();
            }
        };

        global.createjs = {
            Bitmap: class {
                constructor(img) {}
                getBounds() {
                    return { x: 0, y: 0, width: 1, height: 1 };
                }
                cache(x, y, w, h) {
                    this.bitmapCache = { getCacheDataURL: () => "DATAURL" };
                }
            }
        };

        planetInterface.saveLocally().then(() => {
            expect(planetInterface.planet.ProjectStorage.saveLocally).toHaveBeenNthCalledWith(
                1,
                "EXPORT",
                "OLD_IMAGE"
            );
            expect(planetInterface.planet.ProjectStorage.saveLocally).toHaveBeenNthCalledWith(
                2,
                "EXPORT",
                "DATAURL"
            );
            done();
        });
    });
    test("saveLocally keeps delayed thumbnail writes on the project being saved", async () => {
        doSVG.mockReturnValue("<svg/>");
        mockActivity.prepareExport.mockReturnValue("OLD_PROJECT_DATA");
        global.base64Encode = jest.fn(s => s);
        let currentProject = "old-project";
        let pendingImage;
        const saveLocally = jest.fn().mockResolvedValue();
        planetInterface.planet = {
            ProjectStorage: {
                getCurrentProjectID: jest.fn(() => currentProject),
                getCurrentProjectImage: jest.fn(() => "OLD_IMAGE"),
                saveLocally
            }
        };

        global.Image = class {
            constructor() {
                pendingImage = this;
            }
            set src(_value) {}
        };
        global.createjs = {
            Bitmap: class {
                getBounds() {
                    return { x: 0, y: 0, width: 1, height: 1 };
                }
                cache() {
                    this.bitmapCache = { getCacheDataURL: () => "NEW_IMAGE" };
                }
            }
        };

        await planetInterface.saveLocally();
        currentProject = "new-project";
        pendingImage.onload();
        await Promise.resolve();

        expect(saveLocally).toHaveBeenNthCalledWith(
            1,
            "OLD_PROJECT_DATA",
            "OLD_IMAGE",
            "old-project"
        );
        expect(saveLocally).toHaveBeenNthCalledWith(
            2,
            "OLD_PROJECT_DATA",
            "NEW_IMAGE",
            "old-project"
        );
    });

    test("saveLocally resolves after project data is persisted", () => {
        doSVG.mockReturnValue("<svg/>");
        mockActivity.prepareExport.mockReturnValue("EXPORT");
        global.base64Encode = jest.fn(s => s);

        let resolveSave;
        planetInterface.planet = {
            ProjectStorage: {
                getCurrentProjectImage: jest.fn(() => "OLD_IMAGE"),
                saveLocally: jest.fn(
                    () =>
                        new Promise(resolve => {
                            resolveSave = resolve;
                        })
                )
            }
        };

        global.Image = class {
            set src(_v) {}
        };

        const savePromise = planetInterface.saveLocally();

        expect(planetInterface.planet.ProjectStorage.saveLocally).toHaveBeenCalledWith(
            "EXPORT",
            "OLD_IMAGE"
        );

        let resolved = false;
        savePromise.then(() => {
            resolved = true;
        });

        return Promise.resolve()
            .then(() => {
                expect(resolved).toBe(false);
                resolveSave();
                return savePromise;
            })
            .then(() => {
                expect(resolved).toBe(true);
            });
    });
    it("loadProjectFromData shows error and returns early if data is undefined", () => {
        const saved_ = global._;
        global._ = jest.fn(str => str);
        planetInterface.iframe = { style: { display: "" } };
        planetInterface.loadProjectFromData(undefined, false);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith("project undefined");
        global._ = saved_;
    });

    it("loadProjectFromData removes finishedLoading listener after load", () => {
        planetInterface.iframe = { style: { display: "" } };
        const offSpy = jest.spyOn(global.pubsub, "off");
        planetInterface.getCurrentProjectName = jest.fn(() => "foo");
        planetInterface.loadProjectFromData('{"test": 1}');
        global.pubsub.emit("finishedLoading");
        expect(offSpy).toHaveBeenCalledWith("finishedLoading", expect.any(Function));
        offSpy.mockRestore();
    });

    it("loadProjectFromData catches JSON parse errors and calls activity.errorMsg", () => {
        planetInterface.iframe = { style: { display: "" } };
        planetInterface.getCurrentProjectName = jest.fn(() => "foo");
        planetInterface.loadProjectFromData("invalid json");
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(expect.any(SyntaxError));
    });

    it("loadProjectFromData calls justLoadStart without errors when data is null", () => {
        mockActivity.justLoadStart.mockClear();
        mockActivity.errorMsg.mockClear();
        planetInterface.iframe = { style: { display: "" } };
        planetInterface.getCurrentProjectName = jest.fn(() => "Null Project");

        planetInterface.loadProjectFromData(null);

        expect(mockActivity.justLoadStart).toHaveBeenCalled();
        expect(mockActivity.errorMsg).not.toHaveBeenCalled();
    });

    it("loadProjectFromData calls justLoadStart without errors when data is 'undefined', 'null', empty string, or '[]'", () => {
        mockActivity.justLoadStart.mockClear();
        mockActivity.errorMsg.mockClear();
        planetInterface.iframe = { style: { display: "" } };
        planetInterface.getCurrentProjectName = jest.fn(() => "Empty Project");

        planetInterface.loadProjectFromData("undefined");
        expect(mockActivity.justLoadStart).toHaveBeenCalledTimes(1);

        planetInterface.loadProjectFromData("[]");
        expect(mockActivity.justLoadStart).toHaveBeenCalledTimes(2);

        planetInterface.loadProjectFromData("   [   ]  ");
        expect(mockActivity.justLoadStart).toHaveBeenCalledTimes(3);

        planetInterface.loadProjectFromData("");
        expect(mockActivity.justLoadStart).toHaveBeenCalledTimes(4);

        planetInterface.loadProjectFromData("null");
        expect(mockActivity.justLoadStart).toHaveBeenCalledTimes(5);

        expect(mockActivity.errorMsg).not.toHaveBeenCalled();
    });

    it("retains replacement project and enters valid state when active project is deleted and replacement ProjectData is null", async () => {
        const storageData = {
            CurrentProject: "proj1",
            Projects: {
                proj1: {
                    ProjectName: "Project 1",
                    ProjectData: JSON.stringify([{ name: "start" }]),
                    DateLastModified: 2000
                },
                proj2: {
                    ProjectName: "Project 2",
                    ProjectData: null,
                    DateLastModified: 1000
                }
            }
        };

        const initialiseSpy = jest.fn();
        const realStorage = {
            data: storageData,
            getCurrentProjectID: () => storageData.CurrentProject,
            getCurrentProjectName: () =>
                storageData.Projects[storageData.CurrentProject]?.ProjectName ?? "",
            getCurrentProjectData: async () =>
                storageData.Projects[storageData.CurrentProject]?.ProjectData ?? null,
            deleteProject: async id => {
                const isCurrent = storageData.CurrentProject === id;
                delete storageData.Projects[id];
                if (isCurrent) {
                    const remaining = Object.keys(storageData.Projects);
                    storageData.CurrentProject = remaining.length > 0 ? remaining[0] : undefined;
                }
            },
            initialiseNewProject: initialiseSpy
        };

        mockActivity.justLoadStart.mockClear();
        mockActivity.errorMsg.mockClear();

        planetInterface.planet = {
            ProjectStorage: realStorage,
            loadNewProject: planetInterface.newProject.bind(planetInterface),
            loadProjectFromData: planetInterface.loadProjectFromData.bind(planetInterface),
            planetClose: planetInterface.closePlanet.bind(planetInterface),
            oldCurrentProjectID: "proj1"
        };
        planetInterface.iframe = { style: { display: "block" } };

        // 1. Two local projects exist
        expect(storageData.CurrentProject).toBe("proj1");
        expect(Object.keys(storageData.Projects)).toEqual(["proj1", "proj2"]);

        // 2. Active project is deleted
        await realStorage.deleteProject("proj1");
        expect(storageData.CurrentProject).toBe("proj2");

        // 3. Replacement project's record exists, but ProjectData is null
        expect(storageData.Projects["proj2"]).toBeDefined();
        expect(storageData.Projects["proj2"].ProjectData).toBeNull();

        // 4. Planet closes: the replacement project's null data is loaded
        const data = await realStorage.getCurrentProjectData();
        planetInterface.loadProjectFromData(data);

        // 5. Assert:
        // - Existing replacement project is retained as current project
        expect(realStorage.getCurrentProjectID()).toBe("proj2");
        // - No unintended extra project is created
        expect(initialiseSpy).not.toHaveBeenCalled();
        expect(Object.keys(storageData.Projects)).toEqual(["proj2"]);
        // - Workspace enters a valid state
        expect(mockActivity.justLoadStart).toHaveBeenCalled();
        expect(mockActivity.errorMsg).not.toHaveBeenCalled();
    });

    it("saveLocally handles quota exceeded error and shows storage warning", () => {
        const saved_ = global._;
        global._ = jest.fn(str => str);
        global.doSVG.mockReturnValue("");
        mockActivity.prepareExport.mockReturnValue("DATA");
        planetInterface.planet = {
            ProjectStorage: {
                saveLocally: jest.fn(() => {
                    throw { message: "Not enough space to save locally" };
                })
            }
        };
        planetInterface.saveLocally();
        expect(mockActivity.textMsg).toHaveBeenCalledWith(
            "Error: Unable to save because you ran out of local storage. Try deleting some saved projects."
        );
        global._ = saved_;
    });

    it("saveLocally shows the storage warning when the save promise rejects with QuotaExceededError", async () => {
        const saved_ = global._;
        global._ = jest.fn(str => str);
        global.doSVG.mockReturnValue("");
        mockActivity.prepareExport.mockReturnValue("DATA");
        const quotaError = Object.assign(new Error("quota"), { name: "QuotaExceededError" });
        planetInterface.planet = {
            ProjectStorage: { saveLocally: jest.fn().mockRejectedValue(quotaError) }
        };

        await planetInterface.saveLocally();

        expect(mockActivity.textMsg).toHaveBeenCalledWith(
            "Error: Unable to save because you ran out of local storage. Try deleting some saved projects."
        );
        global._ = saved_;
    });

    it("saveLocally shows a generic error message when the save promise rejects", async () => {
        const saved_ = global._;
        global._ = jest.fn(str => str);
        global.doSVG.mockReturnValue("");
        mockActivity.prepareExport.mockReturnValue("DATA");
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        planetInterface.planet = {
            ProjectStorage: { saveLocally: jest.fn().mockRejectedValue(new Error("boom")) }
        };

        const result = await planetInterface.saveLocally();

        expect(mockActivity.textMsg).toHaveBeenCalledWith("Could not save your project.");
        expect(result).toBe(false);
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        consoleSpy.mockRestore();
        global._ = saved_;
    });

    it("saveLocally can report and reject a project data save failure", async () => {
        const saved_ = global._;
        global._ = jest.fn(str => str);
        global.doSVG.mockReturnValue("");
        mockActivity.prepareExport.mockReturnValue("DATA");
        const saveError = new Error("boom");
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        planetInterface.planet = {
            ProjectStorage: { saveLocally: jest.fn().mockRejectedValue(saveError) }
        };

        await expect(planetInterface.saveLocally({ rejectOnProjectSaveError: true })).rejects.toBe(
            saveError
        );

        expect(mockActivity.textMsg).toHaveBeenCalledWith("Could not save your project.");
        expect(consoleSpy).toHaveBeenCalledWith(saveError);
        consoleSpy.mockRestore();
        global._ = saved_;
    });

    it("saveLocally rethrows unexpected errors and logs them", () => {
        global.doSVG.mockReturnValue("");
        mockActivity.prepareExport.mockReturnValue("DATA");
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const mockError = new Error("boom");
        planetInterface.planet = {
            ProjectStorage: {
                saveLocally: jest.fn(() => {
                    throw mockError;
                })
            }
        };
        expect(() => planetInterface.saveLocally()).toThrow(mockError);
        expect(consoleSpy).toHaveBeenCalledWith(mockError);
        consoleSpy.mockRestore();
    });
    it("init propagates initialization errors to the activity", async () => {
        const iframe = document.getElementById("planet-iframe");
        iframe.contentWindow.makePlanet = jest
            .fn()
            .mockRejectedValue(new Error("Failed to make planet"));
        await expect(planetInterface.init()).rejects.toThrow("Failed to make planet");
        expect(planetInterface.planet).toBeNull();
        expect(window.Converter).toBeUndefined();
    });

    it("project getters return safe defaults when Planet storage is unavailable", () => {
        planetInterface.planet = null;
        expect(planetInterface.getCurrentProjectName()).toBe("");
        expect(planetInterface.getCurrentProjectDescription()).toBe("");
        expect(planetInterface.getCurrentProjectImage()).toBeNull();
        expect(planetInterface.getTimeLastSaved()).toBeNull();
    });

    it("_pushBlockDisplayNames maps palette protoList block static labels", () => {
        const postMessage = jest.fn();
        planetInterface.iframe = {
            contentWindow: { postMessage }
        };
        mockActivity.blocks = {
            palettes: {
                dict: {
                    rhythm: {
                        protoList: {
                            note: { name: "note", staticLabels: ["Quarter Note"] }
                        }
                    }
                }
            }
        };
        planetInterface._pushBlockDisplayNames();
        expect(postMessage).toHaveBeenCalledWith(
            { type: "MB_BLOCK_NAMES", payload: { note: "Quarter Note" } },
            "*"
        );
    });

    test("saveLocally: catches and logs errors occurring inside image.onload thumbnail processing", async () => {
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        doSVG.mockReturnValue("<svg/>");
        mockActivity.prepareExport.mockReturnValue({ blocks: ["blocks"] });
        mockActivity.blocks = {
            loadNewBlocks: jest.fn(),
            isLoading: jest.fn(() => false),
            runAfterLoad: jest.fn(),
            palettes: { _hideMenus: jest.fn() },
            trashStacks: []
        };
        global.base64Encode = jest.fn(s => s);

        let pendingImage;
        global.Image = class {
            constructor() {
                pendingImage = this;
            }
            set src(_value) {}
        };
        global.createjs = {
            Bitmap: class {
                getBounds() {
                    throw new Error("Bitmap bounds calculation error");
                }
            }
        };

        const storageData = { CurrentProject: "proj-err", Projects: { "proj-err": {} } };
        planetInterface.planet = {
            ProjectStorage: {
                data: storageData,
                getCurrentProjectID: () => "proj-err",
                saveLocally: jest.fn(async () => {})
            }
        };
        planetInterface.iframe = { style: { display: "none" } };

        await planetInterface.saveLocally();
        expect(pendingImage).toBeDefined();
        pendingImage.onload();

        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
        consoleErrorSpy.mockRestore();
    });
});
