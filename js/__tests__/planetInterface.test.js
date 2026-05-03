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
global.platformColor = {
    header: "#8bc34a"
};
global._THIS_IS_MUSIC_BLOCKS_ = {};
global.doSVG = jest.fn();

const mockActivity = {
    hideSearchWidget: jest.fn(),
    prepSearchWidget: jest.fn(),
    sendAllToTrash: jest.fn(),
    refreshCanvas: jest.fn(),
    _loadStart: jest.fn(),
    doLoadAnimation: jest.fn(),
    textMsg: jest.fn(),
    errorMsg: jest.fn(),
    stage: { enableDOMEvents: jest.fn(), update: jest.fn() },
    blocks: { loadNewBlocks: jest.fn(), palettes: { _hideMenus: jest.fn() }, trashStacks: [] },
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

    test("newProject calls closePlanet, initialiseNewProject, _loadStart, and saveLocally", () => {
        jest.spyOn(planetInterface, "closePlanet").mockImplementation(() => {});
        jest.spyOn(planetInterface, "initialiseNewProject").mockImplementation(() => {});
        jest.spyOn(planetInterface, "saveLocally").mockImplementation(() => {});
        planetInterface.newProject();
        expect(planetInterface.closePlanet).toHaveBeenCalled();
        expect(planetInterface.initialiseNewProject).toHaveBeenCalled();
        expect(mockActivity._loadStart).toHaveBeenCalled();
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
            ProjectStorage: { initialiseNewProject: jest.fn() }
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
            expect(mockActivity.stage.update).toHaveBeenCalledWith(undefined);
            expect(planetInterface.planet.ProjectStorage.saveLocally).toHaveBeenCalledWith(D, null);
        });
    });

    test("saveLocally: returns null without throwing when Planet storage is unavailable", async () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        planetInterface.planet = null;

        await expect(planetInterface.saveLocally()).resolves.toBeNull();
        expect(errorSpy).toHaveBeenCalledWith(
            "[PlanetInterface] saveLocally called before Planet storage is ready."
        );
        errorSpy.mockRestore();
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
    test("openProjectFromPlanet returns early when Planet is unavailable", () => {
        planetInterface.planet = null;

        expect(() => planetInterface.openProjectFromPlanet("ID42", "oops")).not.toThrow();
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
        const removeSpy = jest.spyOn(document, "removeEventListener");
        planetInterface.getCurrentProjectName = jest.fn(() => "foo");
        planetInterface.loadProjectFromData('{"test": 1}');
        const event = new Event("finishedLoading");
        document.dispatchEvent(event);
        expect(removeSpy).toHaveBeenCalledWith("finishedLoading", expect.any(Function));
        removeSpy.mockRestore();
    });

    it("loadProjectFromData uses attachEvent if addEventListener is missing", () => {
        planetInterface.iframe = { style: { display: "" } };
        const savedAdd = document.addEventListener;
        document.addEventListener = undefined;
        document.attachEvent = jest.fn();
        planetInterface.getCurrentProjectName = jest.fn(() => "foo");
        planetInterface.loadProjectFromData('{"test": 1}');
        expect(document.attachEvent).toHaveBeenCalledWith("finishedLoading", expect.any(Function));
        document.addEventListener = savedAdd;
        delete document.attachEvent;
    });

    it("loadProjectFromData catches JSON parse errors and calls activity.errorMsg", () => {
        planetInterface.iframe = { style: { display: "" } };
        planetInterface.getCurrentProjectName = jest.fn(() => "foo");
        planetInterface.loadProjectFromData("invalid json");
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(expect.any(SyntaxError));
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
    it("init catches initialization errors, logs them, and sets planet to null", async () => {
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const iframe = document.getElementById("planet-iframe");
        iframe.contentWindow.makePlanet = jest
            .fn()
            .mockRejectedValue(new Error("Failed to make planet"));
        await expect(planetInterface.init()).resolves.toBeUndefined();
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
        expect(consoleSpy.mock.calls[0][0].message).toBe("Failed to make planet");
        expect(planetInterface.planet).toBeNull();
        expect(window.Converter).toBeUndefined();
        consoleSpy.mockRestore();
    });

    it("project getters return safe defaults when Planet storage is unavailable", () => {
        planetInterface.planet = null;
        expect(planetInterface.getCurrentProjectName()).toBe("");
        expect(planetInterface.getCurrentProjectDescription()).toBe("");
        expect(planetInterface.getCurrentProjectImage()).toBeNull();
        expect(planetInterface.getTimeLastSaved()).toBeNull();
    });
});
