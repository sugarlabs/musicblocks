const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><div id="helpfulWheelDiv"></div>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = { language: 'en' };
const fs = require('fs');

global.Raphael = function() {
    return {
        set: function() { return { push: function(){} }; },
        image: function() { return { attr: function() {}, id: '', node: { id: '' }, click: function(){} }; },
        text: function() { return { attr: function() {}, id: '', node: { id: '' }, click: function(){} }; },
        circle: function() { return { attr: function() {}, id: '', node: { id: '' }, click: function(){} }; },
        path: function() { return { animate: function(){}, attr: function(){}, id: '', node: { id: '' }, click: function(){} }; }
    };
};
global.Raphael.animation = function() { return { repeat: function() {} }; };

eval(fs.readFileSync('./lib/wheelnav.js', 'utf8'));

let wheel = new wheelnav('helpfulWheelDiv', null, 250, 250);
let titles = [ "imgsrc:header-icons/search-button.svg", "imgsrc:header-icons/copy-button.svg" ];
wheel.initWheel(titles);
try { wheel.createWheel(); } catch(e) {}
console.log(wheel.navItems.map(i => i.title));
