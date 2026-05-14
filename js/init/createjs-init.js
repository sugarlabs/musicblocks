// js/init/createjs-init.js
// Initialises the CreateJS canvas and stage on DOMContentLoaded.
// Extracted from inline script in index.html for CSP compliance.
let canvas, stage;
function init() {
    if (typeof createjs === "undefined") {
        setTimeout(init, 50);
        return;
    }
    canvas = document.getElementById("canvas");
    stage = new createjs.Stage(canvas);
    createjs.Ticker.framerate = 60;
    // createjs.Ticker.addEventListener("tick", stage); // Managed by Activity class
}
document.addEventListener("DOMContentLoaded", init);
