const fs = require('fs');
eval(fs.readFileSync('./lib/wheelnav.js', 'utf8'));
// Mock Raphael
global.Raphael = function() { return { set: function() { return []; }, image: function() {}, text: function() { return { attr: function() {}, id: '' } }, circle: function() { return { attr: function() {} } } }; };
// Mock Document
global.document = { getElementById: function() { return { className: '', onmouseup: null }; } };
global.window = {};

let wheel = new wheelnav('test');
wheel.initWheel([]); // empty array!
console.log("After initWheel([]): navItemCount =", wheel.navItemCount);
try {
    wheel.createWheel(); // createWheel with undefined titles!
} catch (e) {}
console.log("After createWheel(): navItems length =", wheel.navItems.length);
if (wheel.navItems.length > 0) {
    console.log("Titles:", wheel.navItems.map(n => n.title));
}
