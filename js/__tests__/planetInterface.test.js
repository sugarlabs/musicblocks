const PlanetInterface = require('../planetInterface');
global.platformColor = {
    header: '#8bc34a'
};

const mockActivity = {
    hideSearchWidget: jest.fn(),
    prepSearchWidget: jest.fn(),
    sendAllToTrash: jest.fn(),
    refreshCanvas: jest.fn(),
    _loadStart: jest.fn(),
    doLoadAnimation: jest.fn(),
    textMsg: jest.fn(),
    stage: { enableDOMEvents: jest.fn() },
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

describe('PlanetInterface', () => {
    let planetInterface;

    beforeEach(() => {
        planetInterface = new PlanetInterface(mockActivity);
    });

    test('hideMusicBlocks hides relevant elements and disables DOM events', () => {
        planetInterface.hideMusicBlocks();

        expect(mockActivity.hideSearchWidget).toHaveBeenCalled();
        expect(mockActivity.logo.doStopTurtles).toHaveBeenCalled();
        expect(docById('helpElem').style.visibility).toBe('hidden');
        expect(document.querySelector('.canvasHolder').classList.contains('hide')).toBe(true);
        expect(document.querySelector('#canvas').style.display).toBe('none');
        expect(document.querySelector('#theme-color').content).toBe('#8bc34a');
    });

    test('showMusicBlocks shows relevant elements and enables DOM events', () => {
        mockActivity.planet = { getCurrentProjectName: jest.fn(() => 'Test Project') };

        planetInterface.showMusicBlocks();

        expect(document.title).toBe('Test Project');
        expect(docById('toolbars').style.display).toBe('block');
        expect(docById('palette').style.display).toBe('block');
        expect(mockActivity.prepSearchWidget).toHaveBeenCalled();
        expect(document.querySelector('.canvasHolder').classList.contains('hide')).toBe(false);
        expect(document.querySelector('#canvas').style.display).toBe('');
    });

    test('hidePlanet hides the planet interface', () => {
        planetInterface.iframe = document.querySelector('#planet-iframe');
        planetInterface.hidePlanet();
        expect(planetInterface.iframe.style.display).toBe('none');
    });

    test('openPlanet calls saveLocally, hideMusicBlocks, and showPlanet', () => {
        jest.spyOn(planetInterface, 'saveLocally').mockImplementation(() => {});
        jest.spyOn(planetInterface, 'hideMusicBlocks').mockImplementation(() => {});
        jest.spyOn(planetInterface, 'showPlanet').mockImplementation(() => {});
        planetInterface.openPlanet();
        expect(planetInterface.saveLocally).toHaveBeenCalled();
        expect(planetInterface.hideMusicBlocks).toHaveBeenCalled();
        expect(planetInterface.showPlanet).toHaveBeenCalled();
    });

    test('closePlanet calls hidePlanet and showMusicBlocks', () => {
        jest.spyOn(planetInterface, 'hidePlanet').mockImplementation(() => {});
        jest.spyOn(planetInterface, 'showMusicBlocks').mockImplementation(() => {});
        planetInterface.closePlanet();
        expect(planetInterface.hidePlanet).toHaveBeenCalled();
        expect(planetInterface.showMusicBlocks).toHaveBeenCalled();
    });

    test('newProject calls closePlanet, initialiseNewProject, _loadStart, and saveLocally', () => {
        jest.spyOn(planetInterface, 'closePlanet').mockImplementation(() => {});
        jest.spyOn(planetInterface, 'initialiseNewProject').mockImplementation(() => {});
        jest.spyOn(planetInterface, 'saveLocally').mockImplementation(() => {});
        planetInterface.newProject();
        expect(planetInterface.closePlanet).toHaveBeenCalled();
        expect(planetInterface.initialiseNewProject).toHaveBeenCalled();
        expect(mockActivity._loadStart).toHaveBeenCalled();
        expect(planetInterface.saveLocally).toHaveBeenCalled();
    });
});
