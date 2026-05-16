const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const dom = new JSDOM(`<!DOCTYPE html><body><div id="helpfulWheelDiv"></div><canvas id="myCanvas"></canvas><div id="toolbars"></div><input id="search"/><div id="myProgress"></div><div id="paste"></div><div id="buttoncontainerBOTTOM"></div></body>`);
global.window = dom.window;
global.document = dom.window.document;
global.navigator = { language: 'en-US' };
global.platformColor = { paletteColors: {}, wheelcolors: [] };
global.wheelnav = class { 
    constructor() { this.navItems = [{}]; } 
    initWheel(arr) { console.log('initWheel called with array length:', arr ? arr.length : arr); }
    createWheel() {}
};
global.slicePath = () => ({ DonutSlice: {}, DonutSliceCustomization: () => ({}) });
global._ = (t) => t;
global.TITLESTRING = "MB";
global.base64Encode = (str) => Buffer.from(str).toString('base64');
global.createDefaultStack = () => {};
global.createHelpContent = () => {};
global.i18next = { changeLanguage: () => {} };
global.GOHOMEFADEDBUTTON = '<svg></svg>';
global.SHOWBLOCKSBUTTON = '<svg></svg>';
global.COLLAPSEBLOCKSBUTTON = '<svg></svg>';
global.SMALLERBUTTON = '<svg></svg>';
global.LARGERBUTTON = '<svg></svg>';
global.RESTORESCALEBUTTON = '<svg></svg>';
global.CLEAREXCBUTTON = '<svg></svg>';
global.SEARCHBUTTON = '<svg></svg>';
global.WRAPICONON = '<svg></svg>';
global.GRIDOFFBUTTON = '<svg></svg>';
global.HSCROLLOFFBUTTON = '<svg></svg>';
global.HORSEBUTTON = '<svg></svg>';
global.SELECTBLOCKSBUTTON = '<svg></svg>';
global.COLLAPSEALLBLOCKSBUTTON = '<svg></svg>';

const src = fs.readFileSync('./js/activity.js', 'utf-8');
const ActivityContext = {};
eval(src.replace(/export\s+default\s+Activity;/g, 'ActivityContext.getActivity = () => Activity;'));

const act = new Activity();
act.setupDependencies();
act._setupPaletteMenu();

const items = act.helpfulWheelItems.filter(ele => ele.display);
console.log('Valid wheel items count:', items.length);
console.log('Icons valid string count:', items.filter(ele => typeof ele.icon === 'string').length);
