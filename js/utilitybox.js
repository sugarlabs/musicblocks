// Copyright (c) 2015 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

var FONTSMALLERSVG = '<g id="fontsmaller"> <g transform="matrix(-1,0,0,1,60.419,78.41)" id="g29" style="fill:#000000;stroke:#000000;stroke-opacity:1"> <g id="g31" style="fill:#000000;stroke:#000000;stroke-opacity:1"> <path d="m 25.263,12.435 h 24.656 v 3.562 H 39.575 V 41.59 H 35.606 V 15.996 H 25.263 v -3.561 z" id="path33" style="fill:#000000;stroke:#000000;stroke-opacity:1" /> </g> </g> <g transform="matrix(-1,0,0,1,68.4192,78.41)" id="g35" style="fill:#000000;stroke:#000000;stroke-opacity:1"> <g id="g37" style="fill:#000000;stroke:#000000;stroke-opacity:1"> <path d="m 13.953,24.435 h 16.656 v 3.562 H 24.265 V 41.59 H 20.296 V 27.997 h -6.344 v -3.562 z" id="path39" style="fill:#000000;stroke:#000000;stroke-opacity:1" /> </g> </g> <path d="m 28.4062,96.087762 6,5.999998 -4,0" id="path41" style="fill:none;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> </g> ';

var FONTBIGGERSVG = '<g id="fontlarger"> <g transform="translate(79.5482,78.41)" id="g13" style="fill:#000000;stroke:#000000;stroke-opacity:1"> <g id="g15" style="fill:#000000;stroke:#000000;stroke-opacity:1"> <path d="m 25.263,12.435 h 24.656 v 3.562 H 39.575 V 41.59 H 35.606 V 15.996 H 25.263 v -3.561 z" id="path17" style="fill:#000000;stroke:#000000;stroke-opacity:1" /> </g> </g> <g transform="translate(71.548,78.41)" id="g19" style="fill:#000000;stroke:#000000;stroke-opacity:1"> <g id="g21" style="fill:#000000;stroke:#000000;stroke-opacity:1"> <path d="m 13.953,24.435 h 16.656 v 3.562 H 24.265 V 41.59 H 20.296 V 27.997 h -6.344 v -3.562 z" id="path23" style="fill:#000000;stroke:#000000;stroke-opacity:1" /> </g> </g> <path d="m 105.561,102.08776 6,-5.999998 -4,0" id="path25" style="fill:none;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:miter;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> </g> ';

var STATSSVG = '<g id="stats" transform="translate(213.88348,76.415962)" style="display:block"> <g transform="translate(-128.87712,-22.838983)" id="g79" style="display:inline"> <g transform="matrix(0.10822504,0,0,0.09945444,61.358446,34.085169)" id="g81"> <g transform="translate(2.7213003,-2.9469823)" id="g83"> <rect width="81.443176" height="272.19876" rx="4.3524833" ry="6.0284276" x="373.97116" y="55.900478" id="rect85" style="color:#000000" /> <rect width="81.443077" height="360.47952" rx="4.3524833" ry="6.0284276" x="499.32275" y="-32.380226" id="rect87" style="color:#000000" /> <rect width="81.443077" height="500.25723" rx="4.3524833" ry="6.0284276" x="248.61969" y="-172.15802" id="rect89" style="color:#000000" /> <rect width="81.443314" height="215.79736" rx="4.3524833" ry="6.0284276" x="123.26795" y="112.30204" id="rect91" style="color:#000000" /> </g> </g> </g> </g> ';

var PLUGINSVG = '<g id="plugins"> <g transform="matrix(0.55205508,0,0,0.55205508,277.61846,85.235971)" id="g45" style="fill:none;stroke:#000000;stroke-opacity:1"> <g transform="translate(-80.093659,12.220029)" id="g47" style="fill:none;stroke:#000000;stroke-opacity:1"> <g id="g49" style="fill:none;stroke:#000000;stroke-opacity:1"> <path d="m 6.736,49.002 h 24.52 c 2.225,0 3.439,-1.447 3.439,-3.441 v -27.28 c 0,-1.73 -1.732,-3.441 -3.439,-3.441 h -4.389" id="path51" style="fill:none;stroke:#000000;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" /> </g> </g> <g transform="translate(-80.093659,12.220029)" id="g53" style="fill:none;stroke:#000000;stroke-opacity:1"> <g id="g55" style="fill:none;stroke:#000000;stroke-opacity:1"> <path d="m 26.867,38.592 c 0,1.836 -1.345,3.201 -3.441,4.047 L 6.736,49.002 V 14.84 l 16.69,-8.599 c 2.228,-0.394 3.441,0.84 3.441,2.834 v 29.517 z" id="path57" style="fill:none;stroke:#000000;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" /> </g> </g> <path d="m -70.669659,54.827029 c 0,0 -1.351,-0.543 -2.702,-0.543 -1.351,0 -2.703,0.543 -2.703,0.543" id="path59" style="fill:none;stroke:#000000;stroke-width:2.25;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" /> <path d="m -70.669659,44.226029 c 0,0 -1.239,-0.543 -2.815,-0.543 -1.577,0 -2.59,0.543 -2.59,0.543" id="path61" style="fill:none;stroke:#000000;stroke-width:2.25;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" /> <path d="m -70.669659,33.898029 c 0,0 -1.125,-0.544 -2.927,-0.544 -1.802,0 -2.478,0.544 -2.478,0.544" id="path63" style="fill:none;stroke:#000000;stroke-width:2.25;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" /> <line y2="23.725029" y1="58.753029" x2="-66.884659" x1="-66.884659" style="fill:none;stroke:#000000;stroke-width:2.25;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" id="line65" /> </g> <g transform="matrix(0,-1,-1,0,276.9376,156.38657)" id="g67" style="fill:none;stroke:#000000;stroke-opacity:1"> <g transform="translate(34.0803,-1006.42)" id="g69" style="fill:none;stroke:#000000;stroke-opacity:1"> <polyline points="51.562,15.306 41.17,16.188 42.053,5.794" style="fill:none;stroke:#000000;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" transform="matrix(-0.469241,0.469241,-0.469241,-0.469241,66.2906,1019.03)" id="polyline71" /> <path d="m 39.363241,1033.1291 -0.05636,9.9115 -8.750608,0.067" id="path73" style="fill:none;stroke:#000000;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> </g> </g> <path d="m 256.54634,85.388888 0,-4.444445 a 4.444445,4.444445 0 0 1 4.44445,-4.444445 l 4.44444,0 0,2.222223 11.11111,0 0,-2.222223 4.44445,0 a 4.444445,4.444445 0 0 1 4.44444,4.444445 l 0,4.444445 0,4.444445 a 4.444445,4.444445 0 0 1 -4.44444,4.444445 l -4.44445,0 -1.11111,0 0,2.222223 -8.88889,0 0,-2.222223 -1.11111,0 -4.44444,0 a 4.444445,4.444445 0 0 1 -4.44445,-4.444445 l 0,-4.444445 z" id="path75" style="fill:none;stroke:#000000;stroke-width:2;stroke-linecap:square;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> </g> ';

var SCROLLLOCKSVG = '<g id="scrolllock" transform="matrix(-1,0,0,1,363.22577,-962.29063)" style="fill:none;stroke:#000000;stroke-opacity:1"> <path d="m 39.36277,1033.1291 0,8.6738" id="path103" style="fill:none;stroke:#000000;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> </g> <path d="m 323.8368,116.4976 0.0262,-8.0241" id="path111" style="fill:none;stroke:#000000;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> <g transform="matrix(0,-1,1,0,-729.59127,135.96611)" id="g115" style="fill:none;stroke:#000000;stroke-opacity:1"> <path d="m 39.363241,1033.1291 -0.05636,9.4622" id="path119" style="fill:none;stroke:#000000;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> </g> <g transform="matrix(0,-1,-1,0,1377.2906,135.96611)" id="g123" style="fill:none;stroke:#000000;stroke-opacity:1"> <path d="m 39.363241,1033.1291 -0.05636,9.4115" id="path127" style="fill:none;stroke:#000000;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> </g> <path d="m 312.59966,100.56247 0,-6.562494 q 0,-1.171875 0.82031,-1.992195 0.82031,-0.82031 1.99219,-0.82031 l 0,-3.75 q 0,-3.51563 2.46094,-5.97656 2.46093,-2.46094 5.97656,-2.46094 3.51562,0 5.97656,2.46094 2.46094,2.46093 2.46094,5.97656 l 0,3.75 q 1.17187,0 1.99219,0.82031 0.82031,0.82032 0.82031,1.992195 l 0,6.562494 q 0,3.51562 -2.46094,5.97656 -2.46094,2.46094 -5.97656,2.46094 l -5.625,0 q -3.51563,0 -5.97656,-2.46094 -2.46094,-2.46094 -2.46094,-5.97656 z m 1.875,0 q 0,2.69531 1.93359,4.62891 1.9336,1.93359 4.62891,1.93359 l 5.625,0 q 2.69531,0 4.62891,-1.93359 1.93359,-1.9336 1.93359,-4.62891 l 0,-6.562494 q 0,-0.410165 -0.26369,-0.673845 -0.26368,-0.26369 -0.67384,-0.26369 l -16.875,0 q -0.41016,0 -0.67384,0.26369 -0.26369,0.26368 -0.26369,0.673845 l 0,6.562494 z m 2.8125,-9.374999 1.875,0 0,-3.75 q 0,-1.93359 1.37694,-3.31056 1.37694,-1.37697 3.31056,-1.37694 1.93362,3e-5 3.31056,1.37694 1.37694,1.37691 1.37694,3.31056 l 0,3.75 1.875,0 0,-3.75 q 0,-2.69531 -1.93359,-4.62891 -1.9336,-1.93359 -4.62891,-1.93359 -2.69531,0 -4.62891,1.93359 -1.93359,1.9336 -1.93359,4.62891 l 0,3.75 z m 2.8125,0 7.5,0 0,-3.75 q 0,-1.58203 -1.08397,-2.66603 -1.08397,-1.084 -2.66603,-1.08397 -1.58206,3e-5 -2.66603,1.08397 -1.08397,1.08394 -1.08397,2.66603 l 0,3.75 z m 1.875,7.499995 q 0,-0.76172 0.55663,-1.31836 0.55662,-0.55666 1.31837,-0.55663 0.76175,2e-5 1.31837,0.55663 0.55663,0.55658 0.55663,1.31836 0,0.82031 -0.64453,2.519534 -0.41016,1.23047 -1.23047,1.23047 -0.82031,0 -1.23047,-1.23047 -0.64453,-1.699224 -0.64453,-2.519534 z" id="path3160" />  ';

var SCROLLUNLOCKSVG = '<g id="scrollunlock" transform="translate(0,-3.405653e-5)"> <g transform="matrix(-1,0,0,1,397.30607,44.1294)" id="g97" style="fill:none;stroke:#000000;stroke-opacity:1"> <g transform="translate(34.0803,-1006.42)" id="g99" style="fill:none;stroke:#000000;stroke-opacity:1"> <polyline points="51.562,15.306 41.17,16.188 42.053,5.794" style="fill:none;stroke:#000000;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" transform="matrix(-0.469241,0.469241,-0.469241,-0.469241,66.2906,1019.03)" id="polyline101" /> <path d="m 39.36277,1033.1291 0,8.6738" id="path103" style="fill:none;stroke:#000000;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> </g> </g> <g transform="matrix(1,0,0,-1,284.47356,1149.5913)" id="g107" style="fill:none;stroke:#000000;stroke-opacity:1"> <polyline id="polyline109" transform="matrix(-0.469241,0.469241,-0.469241,-0.469241,66.2906,1019.03)" style="fill:none;stroke:#000000;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" points="51.562,15.306 41.17,16.188 42.053,5.794" /> <path d="m 39.363241,1033.0937 0.0262,8.0241" id="path111" style="fill:none;stroke:#000000;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> </g> <g transform="matrix(0,-1,1,0,276.82873,170.04644)" id="g113" style="fill:none;stroke:#000000;stroke-opacity:1"> <g transform="translate(34.0803,-1006.42)" id="g115" style="fill:none;stroke:#000000;stroke-opacity:1"> <polyline points="51.562,15.306 41.17,16.188 42.053,5.794" style="fill:none;stroke:#000000;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" transform="matrix(-0.469241,0.469241,-0.469241,-0.469241,66.2906,1019.03)" id="polyline117" /> <path d="m 39.363241,1033.1291 -0.05636,9.4622" id="path119" style="fill:none;stroke:#000000;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> </g> </g> <g transform="matrix(0,-1,-1,0,370.8706,170.04644)" id="g121" style="fill:none;stroke:#000000;stroke-opacity:1"> <g transform="translate(34.0803,-1006.42)" id="g123" style="fill:none;stroke:#000000;stroke-opacity:1"> <polyline points="51.562,15.306 41.17,16.188 42.053,5.794" style="fill:none;stroke:#000000;stroke-width:3.5;stroke-linecap:round;stroke-linejoin:round;stroke-opacity:1" transform="matrix(-0.469241,0.469241,-0.469241,-0.469241,66.2906,1019.03)" id="polyline125" /> <path d="m 39.363241,1033.1291 -0.05636,9.4115" id="path127" style="fill:none;stroke:#000000;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;stroke-dasharray:none" /> </g> </g> <path d="m 312.59966,100.5625 0,-6.56249 q 0,-1.171875 0.82031,-1.992195 0.82031,-0.82031 1.99219,-0.82031 l 0,-3.75 q 0,-3.51563 2.46094,-5.97656 2.46093,-2.46094 5.97656,-2.46094 3.51562,0 5.97656,2.46094 2.46094,2.46093 2.46094,5.97656 l 0,3.75 q 1.17187,0 1.99219,0.82031 0.82031,0.82032 0.82031,1.992195 l 0,6.56249 q 0,3.51562 -2.46094,5.97656 Q 330.17778,109 326.66216,109 l -5.625,0 q -3.51563,0 -5.97656,-2.46094 -2.46094,-2.46094 -2.46094,-5.97656 z m 1.875,0 q 0,2.69531 1.93359,4.62891 1.9336,1.93359 4.62891,1.93359 l 5.625,0 q 2.69531,0 4.62891,-1.93359 1.93359,-1.9336 1.93359,-4.62891 l 0,-6.56249 q 0,-0.410165 -0.26369,-0.673845 -0.26368,-0.26369 -0.67384,-0.26369 l -16.875,0 q -0.41016,0 -0.67384,0.26369 -0.26369,0.26368 -0.26369,0.673845 l 0,6.56249 z m 2.8125,-9.374995 1.875,0 0,-3.75 q 0,-1.93359 1.37694,-3.31056 1.37694,-1.37697 3.31056,-1.37694 1.93362,3e-5 3.31056,1.37694 1.37694,1.37691 1.37694,3.31056 l 0,3.75 1.875,0 0,-3.75 q 0,-2.69531 -1.93359,-4.62891 -1.9336,-1.93359 -4.62891,-1.93359 -2.69531,0 -4.62891,1.93359 -1.93359,1.9336 -1.93359,4.62891 l 0,3.75 z m 2.8125,0 7.5,0 0,-3.75 q 0,-1.58203 -1.08397,-2.66603 -1.08397,-1.084 -2.66603,-1.08397 -1.58206,3e-5 -2.66603,1.08397 -1.08397,1.08394 -1.08397,2.66603 l 0,3.75 z m 1.875,7.499995 q 0,-0.76172 0.55663,-1.31836 0.55662,-0.55666 1.31837,-0.55663 0.76175,2e-5 1.31837,0.55663 0.55663,0.55658 0.55663,1.31836 0,0.82031 -0.64453,2.51953 -0.41016,1.23047 -1.23047,1.23047 -0.82031,0 -1.23047,-1.23047 -0.64453,-1.69922 -0.64453,-2.51953 z" id="path3160" /> <rect width="6.5671349" height="4.3129773" x="326.6055" y="86.87191" id="rect3954" style="fill:#96d3f3;fill-opacity:1;fill-rule:nonzero;stroke:none" /> <path d="m 327.65946,86.373344 3.81867,-0.0039" id="path3956" style="fill:none;stroke:#000000;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /> </g> ';

var UTILITYBOXSVG = '<svg xmlns="http://www.w3.org/2000/svg" height="133" width="360" version="1.1"> <rect style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" y="0" x="0" height="133" width="360" /> <g style="fill:#000000;display:block" transform="translate(306.943,-1.053)"> <path style="fill:#000000;display:inline" d="m 27.557,5.053 c -12.43,0 -22.5,10.076 -22.5,22.497 0,12.432 10.07,22.503 22.5,22.503 12.431,0 22.5,-10.071 22.5,-22.503 0,-12.421 -10.07,-22.497 -22.5,-22.497 z m 10.199,28.159 c 1.254,1.256 1.257,3.291 0,4.545 -0.628,0.629 -1.451,0.943 -2.274,0.943 -0.822,0 -1.644,-0.314 -2.27,-0.94 l -5.76,-5.761 -5.76,5.761 c -0.627,0.626 -1.449,0.94 -2.271,0.94 -0.823,0 -1.647,-0.314 -2.275,-0.943 -1.254,-1.254 -1.254,-3.289 0.004,-4.545 l 5.758,-5.758 -5.758,-5.758 c -1.258,-1.254 -1.258,-3.292 -0.004,-4.546 1.255,-1.254 3.292,-1.259 4.546,0 l 5.76,5.759 5.76,-5.759 c 1.252,-1.259 3.288,-1.254 4.544,0 1.257,1.254 1.254,3.292 0,4.546 l -5.758,5.758 5.758,5.758 z" /> </g> <rect style="fill:#96d3f3;fill-opacity:1;stroke:none" y="57.973366" x="0" height="75.026634" width="360" /> <rect y="0.76763773" x="0.76764059" height="131.46472" width="358.46472" style="display:inline;visibility:visible;opacity:1;fill:none;fill-opacity:1;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-opacity:1;" />';

// A pop up for utility functions, e.g., loading plugins, changing block size
function UtilityBox(canvas, stage, refreshCanvas, bigger, smaller, plugins, stats, scroller) {
    this.canvas = canvas;
    this.stage = stage;
    this.refreshCanvas = refreshCanvas;
    this.doBigger = bigger;
    this.doSmaller = smaller;
    this.doPlugins = plugins;
    this.doStats = stats;
    this.doScroller = scroller;
    this.scrollStatus = false;
    this.container = null;
    this.save = null;
    this.close = null;
    this.scale = 1;

    this.hide = function() {
        if (this.container !== null) {
            this.container.visible = false;
            this.refreshCanvas();
        }
    }

    this.show = function(scale) {
        this.scale = scale;
        if (this.container === null) {
            this.container = new createjs.Container();
            this.stage.addChild(this.container);
            this.container.x = Math.floor(((this.canvas.width / scale) - 360) / 2);
            this.container.y = 27;

            function processBackground(box, name, bitmap, extras) {
                box.container.addChild(bitmap);
		loadUtilityContainerHandler(box);
		box.completeShow();
            }
            if (this.scrollStatus) {
                var UTILITYBOX = UTILITYBOXSVG + STATSSVG + PLUGINSVG + SCROLLLOCKSVG + '</svg>';
                makeBoxBitmap(this, UTILITYBOX, 'box', processBackground, null);
            } else {
                var UTILITYBOX = UTILITYBOXSVG + STATSSVG + PLUGINSVG + SCROLLUNLOCKSVG + '</svg>';
                makeBoxBitmap(this, UTILITYBOX, 'box', processBackground, null);
            }
        } else {
            this.completeShow();
        }
    }

    this.completeShow = function() {
	this.container.visible = true;
	this.refreshCanvas();
    }
}


function loadUtilityContainerHandler(box) {
    var hitArea = new createjs.Shape();
    this.bounds = box.container.getBounds();
    hitArea.graphics.beginFill('#FFF').drawRect(bounds.x, bounds.y, bounds. width, bounds.height);
    hitArea.x = 0;
    hitArea.y = 0;
    box.container.hitArea = hitArea;

    var locked = false;
    box.container.on('click', function(event) {
        // We need a lock to "debouce" the click.
        if (locked) {
            console.log('debouncing click');
            return;
        }
        locked = true;
        setTimeout(function() {
            locked = false;
        }, 500);

        var x = (event.stageX / box.scale) - box.container.x;
        var y = (event.stageY / box.scale) - box.container.y;
        console.log(x + ' ' + y);
        if (y < 55) {
            box.hide();
        } else if (x < 75) {
	    // box.doSmaller();
        } else if (x < 150) {
	    // box.doBigger();
        } else if (x < 225) {
            box.doStats();
            box.hide();
        } else if (x < 300) {
	    box.doPlugins();
            box.hide();
        } else {
	    box.doScroller();
            box.hide();
            // Force regeneration of graphics.
            box.stage.removeChild(box.container);
            box.container = null;
            box.scrollStatus = !box.scrollStatus;
        }
    });
}
