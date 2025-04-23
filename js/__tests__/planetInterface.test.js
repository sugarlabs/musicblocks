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

const docById = jest.fn((id) => document.getElementById(id));
global.docById = docById;

beforeAll(() => {
    mockCanvas = {
        click: jest.fn()
    };
    window.widgetWindows = {
        hideAllWindows: jest.fn(),
        showWindows: jest.fn(),
    };
    window.scroll = jest.fn();
});

describe("PlanetInterface", () => {
    let planetInterface;

    beforeEach(() => {
        planetInterface = new PlanetInterface(mockActivity);
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
        jest.spyOn(planetInterface, "saveLocally").mockImplementation(() => {});
        jest.spyOn(planetInterface, "hideMusicBlocks").mockImplementation(() => {});
        jest.spyOn(planetInterface, "showPlanet").mockImplementation(() => {});
        planetInterface.openPlanet();
        expect(planetInterface.saveLocally).toHaveBeenCalled();
        expect(planetInterface.hideMusicBlocks).toHaveBeenCalled();
        expect(planetInterface.showPlanet).toHaveBeenCalled();
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
        planetInterface.planet = { ProjectStorage: { getCurrentProjectName: jest.fn(() => "ProjectX") } };
        expect(planetInterface.getCurrentProjectName()).toBe("ProjectX");
    });
    test("initialiseNewProject should reset project state", () => {
        planetInterface.planet = {
            ProjectStorage: { initialiseNewProject: jest.fn() }
        };
        planetInterface.initialiseNewProject("New Name");
        expect(planetInterface.planet.ProjectStorage.initialiseNewProject).toHaveBeenCalledWith("New Name");
        expect(mockActivity.sendAllToTrash).toHaveBeenCalled();
        expect(mockActivity.refreshCanvas).toHaveBeenCalled();
        expect(mockActivity.blocks.trashStacks).toEqual([]);
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
    
        planetInterface.planet = { ProjectStorage: { saveLocally: jest.fn() } };
        planetInterface.saveLocally();
    
        expect(planetInterface.planet.ProjectStorage.saveLocally).toHaveBeenCalledWith(D, null);
    });

    test("getCurrentProjectDescription/Image/TimeLastSaved", () => {
        const D = new Date(2020,1,1);
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
        planetInterface.planet = { ProjectStorage: { getCurrentProjectData: jest.fn(async () => 123) } };
        await expect(planetInterface.openCurrentProject()).resolves.toBe(123);
    });
    test("openProjectFromPlanet proxies arguments", () => {
        planetInterface.planet = { openProjectFromPlanet: jest.fn() };
        planetInterface.openProjectFromPlanet("ID42", "oops");
        expect(planetInterface.planet.openProjectFromPlanet).toHaveBeenCalledWith("ID42", "oops");
    });
    test("hideMusicBlocks also calls widgetWindows.hideAllWindows and disables DOM events after 250ms", () => {
        jest.useFakeTimers();
        planetInterface.hideMusicBlocks();
    
        expect(window.widgetWindows.hideAllWindows).toHaveBeenCalled();

        expect(mockActivity.stage.enableDOMEvents).not.toHaveBeenCalledWith(false);
    
        jest.advanceTimersByTime(250);
        expect(mockActivity.stage.enableDOMEvents)
            .toHaveBeenCalledWith(false);
    
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
            setOnConverterLoad: jest.fn(),
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
    test("saveLocally: non-empty SVG triggers image‑onload path", (done) => {

        doSVG.mockReturnValue("<svg/>");
        mockActivity.prepareExport.mockReturnValue("EXPORT");
        global.base64Encode = jest.fn((s) => s);
        planetInterface.planet = {
            ProjectStorage: { saveLocally: jest.fn() }
        };
      
        global.Image = class {
            set src(_v) { this.onload(); }
        };
      
        global.createjs = {
            Bitmap: class {
                constructor(img) { }
                getBounds() { return { x: 0, y: 0, width: 1, height: 1 }; }
                cache(x, y, w, h) {

                    this.bitmapCache = { getCacheDataURL: () => "DATAURL" };
                }
            }
        };
      

        planetInterface.saveLocally();
      

        setTimeout(() => {
            expect(
                planetInterface.planet.ProjectStorage.saveLocally
            ).toHaveBeenCalledWith("EXPORT", "DATAURL");
            done();
        }, 0);
    });
      
    
});
