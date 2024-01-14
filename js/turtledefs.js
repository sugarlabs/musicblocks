// Copyright (c) 2016-2023 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA
//

/*
   global

   _, ADVANCEDBUTTON, BIGGERBUTTON, CARTESIANBUTTON, CLEARBUTTON,
   COLLAPSEBLOCKSBUTTON, COLLAPSEBUTTON, GOHOMEBUTTON, HELPBUTTON,
   HIDEBLOCKSBUTTON, LANGUAGEBUTTON, LOADBUTTON, MENUBUTTON,
   NEWBUTTON, PLANETBUTTON, PLUGINSDELETEBUTTON, RESTORETRASHBUTTON,
   RHYTHMPALETTEICON, RUNBUTTON, SAVEBUTTON, SCROLLUNLOCKBUTTON,
   SHORTCUTSBUTTON, SLOWBUTTON, SMALLERBUTTON, STATSBUTTON,
   STEPBUTTON, STOPTURTLEBUTTON, WRAPTURTLEBUTTON, _THIS_IS_TURTLE_BLOCKS_,
   _THIS_IS_MUSIC_BLOCKS_, MOUSEPALETTEICON, FULLSCREENBUTTON, RECORDBUTTON
*/

/* exported

   createDefaultStack, createHelpContent, LOGOJA1, NUMBERBLOCKDEFAULT,
   DEFAULTPALETTE, BUILTINPALETTES, MULTIPALETTES, SKIPPALETTES,
   MULTIPALETTEICONS, MULTIPALETTENAMES, HELPCONTENT, DATAOBJS,
   BUILTINPALETTESFORL23N, getMainToolbarButtonNames,
   getAuxToolbarButtonNames, TITLESTRING
 */

const VERSION = "3.5.8";
let LOGODEFAULT;
let LOGOJA1 = LOGODEFAULT;
let LOGOJA = LOGODEFAULT;
//.TRANS: put the URL to the guide here, e.g., https://github.com/sugarlabs/turtleblocksjs/tree/master/guide/README.md
let GUIDEURL = _("guide url");
let NUMBERBLOCKDEFAULT;
let DEFAULTPALETTE;
let DATAOBJS;

if (_THIS_IS_TURTLE_BLOCKS_) {
    LOGODEFAULT = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="100" height="100" viewBox="0 0 55 55" style="fill:#ffffff;stroke:#000000;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round"> <path d="m 53.481267,28.305392 c -0.209367,-1.54431 -0.683684,-3.963142 -2.434581,-4.798755 -1.109828,-0.528975 -7.180267,0.535648 -11.31572,0.588453 0.144519,2.488312 -0.778093,5.155238 -3.939898,9.809475 -1.886409,3.241636 -10.411329,3.515578 -10.800417,3.494271 L 1.4324287,37.296302 c 1.1691172,1.648067 3.6860922,3.761922 6.4671469,4.112101 -0.7457525,0.657744 -3.0978837,3.276679 -3.2729735,6.681202 -0.00463,0.07596 0.00185,0.409469 0,0.409469 l 7.4343649,0 c 0.254761,-1.852802 0.9755,-5.273073 2.895929,-6.51445 1.432215,-0.0083 2.73844,-0.166752 3.757481,-0.1158 2.352131,0.116727 7.112904,-0.04725 10.314545,-0.276067 0.02409,0.01297 0.03891,0.273288 0.06392,0.28811 2.092739,1.107049 2.853314,4.766332 3.119191,6.619133 l 7.434366,0 c -9.27e-4,0 0.0056,-0.333504 9.26e-4,-0.409469 -0.173237,-3.361908 -3.144204,-6.569107 -4.146569,-7.513109 2.836638,-1.260832 7.123094,-5.459279 8.243113,-6.678423 0.294595,-0.318681 1.391453,-1.678638 2.22614,-2.303032 0.782809,-0.584558 3.337822,-0.893976 4.296647,-0.935664 0.960677,-0.04169 3.004317,0.407616 3.004317,0.407616 0,0 0.306638,-2.060315 0.210294,-2.762527 z" style="stroke-width:1.92499995;stroke-miterlimit:4;stroke-dasharray:none" /> <circle cx="59.484001" cy="37.223999" r="1.109" transform="matrix(0.92640065,0,0,0.92640065,-6.9147758,-8.3090122)" style="stroke-width:1.18739116;stroke-miterlimit:4;stroke-dasharray:none" /> <g transform="matrix(1.0320878,0,0,0.99904752,-0.184081,0.02418615)"> <path d="m 10.571891,36.919704 5.798216,-14.14899 -5.012466,-5.534784 c -1.4233734,1.718282 -2.480637,3.711241 -2.8150389,5.046387 -0.451356,1.79814 0,7.96332 0.5856365,10.1437 l -2.8182215,4.571955 4.0512949,-0.148486 z" style="fill:#186dee;fill-opacity:1;stroke-width:1.92499995;stroke-miterlimit:4;stroke-dasharray:none" /> <path d="m 15.827351,23.138991 12.64663,-0.323916 3.118775,-3.975828 c -0.869792,-1.299255 -2.013342,-2.558133 -3.475701,-3.315433 -4.355888,-2.256648 -8.269084,-3.109957 -13.966045,-0.280847 -1.311618,0.652319 -1.961058,1.152293 -2.772806,1.934717 z" style="fill:#ffb504;fill-opacity:1;stroke-width:1.92499995;stroke-miterlimit:4;stroke-dasharray:none" /> <path d="M 28.827609,22.944786 16.350738,23.050047 10.704106,37.127591 29.0947,37.332873 c 3.504125,-0.134986 4.499519,-1.032283 5.462399,-1.962597 z" style="fill:#009a57;fill-opacity:1;stroke-width:1.92499995;stroke-miterlimit:4;stroke-dasharray:none" /> <path d="m 34.981054,23.766238 c 0,0 -2.011809,-2.505097 -3.098182,-4.441418 l -2.902193,3.701262 5.37511,12.556508 c 0.907909,-0.615531 2.256487,-2.511987 2.898435,-3.491812 2.418679,-3.238079 2.693228,-7.998903 2.693228,-7.998903 z" style="fill:#d8432e;fill-opacity:1;stroke-width:1.92499995;stroke-miterlimit:4;stroke-dasharray:none" /> </g> </svg>';

    LOGOJA1 = LOGODEFAULT;
    LOGOJA = LOGODEFAULT;

    if (GUIDEURL === "guide url" || GUIDEURL === "") {
        GUIDEURL = "https://github.com/sugarlabs/turtleblocksjs/tree/master/guide/README.md";
    }

    NUMBERBLOCKDEFAULT = 100;
    DEFAULTPALETTE = "turtle";
} else {
    LOGOJA1 =
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?> <svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" width="14.227637mm" height="14.552083mm" viewBox="0 0 14.227637 14.552083" version="1.1" id="svg1917"> <defs id="defs1911" /> <metadata id="metadata1914"> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> <dc:title></dc:title> </cc:Work> </rdf:RDF> </metadata> <g id="layer1" transform="matrix(0.24123394,0,0,0.24123394,-22.428724,-13.126892)"> <g transform="matrix(0.35277777,0,0,-0.35277777,5.3347636,163.32003)" id="g1838"> <g transform="translate(399.8154,296.855)" id="g22"> <path id="path24" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c -1.236,-9.538 -8.742,-20.454 -20.52,-32.751 0.991,-3.791 2.1,-7.838 3.358,-12.192 1.198,-4.11 2.348,-8.111 3.463,-12.016 2.369,0.184 4.918,0.165 7.649,-0.097 10.995,-1.077 18.478,-8.518 21.847,-18.174 v 59.419 C 15.797,-4.727 9.248,4.822 -0.186,9.196 0.341,6.208 0.4,3.052 0,0" /> </g> <g transform="translate(405.3779,180.7212)" id="g26"> <path id="path28" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c -1.713,-1.584 -3.497,-2.963 -5.33,-4.162 1.183,-14.957 -1.662,-25.43 -7.801,-33.201 -1.713,-2.171 -3.537,-3.994 -5.437,-5.509 h 1.25 c 15.217,0 27.552,12.336 27.552,27.552 V 16.066 C 8.287,10.16 4.924,4.564 0,0" /> </g> <g transform="translate(382.1484,308.4634)" id="g30"> <path id="path32" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="M 0,0 C -8.555,0.407 -10.788,-9.805 -5.019,-35.432 14.11,-16.584 12.704,-0.609 0,0" /> </g> <g transform="translate(339.479,150.1611)" id="g34"> <path id="path36" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c 0,8.541 6.922,15.464 15.463,15.464 8.543,0 15.465,-6.923 15.465,-15.464 0,-2.427 -0.576,-4.714 -1.572,-6.759 2.039,-2.401 6.344,-3.426 12.302,0.96 5.713,4.215 9.417,14.465 10.009,27.95 -18.905,-6.227 -40.507,2.477 -48.891,12.44 -10.596,12.629 -19.691,49.994 17.168,74.23 3.465,2.281 6.617,4.548 9.463,6.81 -1.48,5.411 -2.819,10.841 -3.905,16.419 -2.211,11.291 -1.32,20.057 1.446,26.386 h -90.446 c -15.217,0 -27.552,-12.336 -27.552,-27.553 V 15.24 c 0,-15.216 12.335,-27.552 27.552,-27.552 H 6.133 C 2.413,-9.488 0,-5.032 0,0" /> </g> <g transform="translate(380.792,227.7183)" id="g38"> <path id="path40" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c -11.295,-6.08 -9.406,-22.011 -3.695,-23.773 6.563,-2.019 4.549,-7.577 -0.506,-7.577 -5.041,0 -14.13,2.025 -16.152,14.643 -1.518,9.483 3.521,22.383 17.019,27.144 -2.009,6.225 -3.992,12.284 -5.842,18.3 -2.576,-2.472 -5.291,-4.997 -8.146,-7.569 -17.368,-15.672 -23.229,-36.353 -10.602,-54.541 9.433,-13.583 25.072,-14.185 37.86,-8.148 -0.549,5.492 -1.533,11.283 -3.027,17.249 C 4.759,-15.656 2.391,-7.639 0,0" /> </g> <g transform="translate(402.3506,194.3457)" id="g42"> <path id="path44" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="M 0,0 C 12.566,12.577 2.91,36.234 -13.439,35.569 -9.396,20.879 -6.159,7.796 -4.168,-3.619 -2.699,-2.504 -1.296,-1.278 0,0" /> </g> <g transform="translate(388.9111,229.9146)" id="g46"> <path id="path48" style="fill:#64a6f9;fill-opacity:1;fill-rule:nonzero;stroke:none" d="M 0,0 C 16.35,0.665 26.006,-22.992 13.439,-35.569 12.144,-36.847 10.74,-38.073 9.271,-39.188 7.28,-27.772 4.043,-14.689 0,0 m -36.043,-35.569 c -12.627,18.188 -6.767,38.868 10.602,54.541 2.855,2.572 5.57,5.097 8.146,7.569 1.85,-6.016 3.833,-12.075 5.842,-18.3 -13.498,-4.762 -18.537,-17.661 -17.019,-27.144 2.022,-12.618 11.111,-14.643 16.152,-14.643 5.055,0 7.069,5.558 0.506,7.577 -5.711,1.762 -7.6,17.693 3.695,23.773 2.39,-7.639 4.759,-15.656 6.909,-24.272 1.494,-5.967 2.478,-11.757 3.026,-17.249 -12.787,-6.037 -28.426,-5.435 -37.859,8.148 M -6.763,78.549 C 5.941,77.94 7.348,61.965 -11.781,43.117 c -5.77,25.627 -3.536,35.839 5.018,35.432 M 3.336,-86.556 c 6.139,7.771 8.983,18.244 7.801,33.201 1.833,1.198 3.617,2.578 5.33,4.162 4.924,4.564 8.287,10.159 10.234,16.066 V -8.29 C 23.332,1.367 15.85,8.807 4.854,9.884 c -2.731,0.262 -5.28,0.282 -7.649,0.097 -1.115,3.905 -2.265,7.907 -3.463,12.016 -1.258,4.355 -2.367,8.401 -3.357,12.192 11.777,12.298 19.283,23.214 20.519,32.751 0.401,3.052 0.341,6.208 -0.185,9.196 -3.317,1.818 -7.103,2.73 -11.571,2.65 h -21.632 c -2.766,-6.329 -3.658,-15.198 -1.446,-26.489 1.086,-5.578 2.425,-11.008 3.905,-16.42 -2.846,-2.262 -5.998,-4.528 -9.463,-6.809 -36.859,-24.236 -27.764,-61.601 -17.168,-74.23 8.384,-9.963 29.986,-18.667 48.891,-12.441 -0.592,-13.484 -4.297,-23.734 -10.009,-27.949 -5.958,-4.386 -10.263,-3.361 -12.302,-0.961 0.996,2.045 1.572,4.332 1.572,6.76 0,8.541 -6.922,15.464 -15.465,15.464 -8.541,0 -15.463,-6.923 -15.463,-15.464 0,-5.032 2.221,-9.627 5.942,-12.452 h 41.195 c 1.9,1.516 3.918,3.477 5.631,5.649" /> </g> <g transform="translate(257.4902,211.418)" id="g50"> <path id="path52" style="fill:#d8e9fd;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 2.389,0.612 c 16.112,4.117 18.275,13.571 17.013,19.984 l 13.727,3.51 21.672,-84.727 -16.712,-4.276 -14.923,58.354 -20.171,-5.16 z" /> </g> <g transform="translate(280.3423,284.8091)" id="g54"> <path id="path56" style="fill:#64a6f9;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c 0,11.978 8.763,13.014 12.028,13.014 7.052,0 12.651,-4.146 12.651,-11.615 0,-6.325 -4.096,-9.537 -7.673,-11.975 -4.875,-3.421 -7.412,-5.078 -8.243,-6.792 h 15.966 v -6.426 H -0.413 c 0.258,4.299 0.57,8.81 8.553,14.615 6.636,4.823 9.28,6.69 9.28,10.839 0,2.435 -1.555,5.236 -5.08,5.236 C 7.259,6.896 7.105,2.697 7.051,0 Z" /> </g> <g transform="translate(321.2446,245.8525)" id="g58"> <path id="path60" style="fill:#f1d01e;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 1.446,-0.413 c 2.765,-0.789 7.907,-1.975 9.634,4.08 0.489,1.71 0.921,6.217 -4.144,7.661 -6.319,1.805 -8.031,-4.184 -8.499,-5.829 l -8.554,2.442 c 2.501,8.751 9.221,13.597 19.75,10.588 6.252,-1.784 13.575,-7.293 10.753,-17.163 -1.353,-4.738 -5.157,-6.854 -8.129,-7.287 l -0.038,-0.132 c 1.513,-0.931 6.215,-4.905 3.941,-12.865 -2.52,-8.825 -10.821,-13.213 -20.229,-10.527 -4.411,1.261 -15.971,5.634 -11.801,20.241 l 9.016,-2.576 -0.082,-0.048 c -0.715,-2.501 -1.672,-8.347 4.514,-10.112 3.683,-1.05 7.62,0.526 9.104,5.726 1.823,6.38 -4.286,8.411 -8.563,9.631 z" /> </g> <g transform="translate(362.2236,150.3657)" id="g62"> <path id="path64" style="fill:#c50018;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c 0,-4.129 -3.348,-7.474 -7.475,-7.474 -4.129,0 -7.476,3.345 -7.476,7.474 0,4.129 3.347,7.478 7.476,7.478 C -3.348,7.478 0,4.129 0,0" /> </g> </g> </g> </svg>';

    LOGOJA =
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?> <svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" version="1.1" id="svg2" xml:space="preserve" width="55" height="55" viewBox="0 0 55 55"><metadata id="metadata8"><rdf:RDF><cc:Work rdf:about=""><dc:format>image/svg+xml</dc:format><dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /><dc:title></dc:title></cc:Work></rdf:RDF></metadata><defs id="defs6"><clipPath clipPathUnits="userSpaceOnUse" id="clipPath18"><path d="M 0,532.918 H 745.508 V 0 H 0 Z" id="path16" /></clipPath></defs><g id="g10" transform="matrix(0.26053262,0,0,-0.26053262,-76.348511,95.783412)"><g id="g1350"><g transform="translate(501.8008,190.7261)" id="g20"><path id="path22" style="fill:#719dd4;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c 0,-18.786 -15.229,-34.016 -34.016,-34.016 h -138.368 c -18.787,0 -34.016,15.23 -34.016,34.016 v 142.769 c 0,18.786 15.229,34.015 34.016,34.015 H -34.016 C -15.229,176.784 0,161.555 0,142.769 Z" /></g><g transform="translate(482.2988,353.0142)" id="g24"><path id="path26" style="fill:#64a6f9;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c -1.527,-11.774 -10.793,-25.251 -25.334,-40.434 1.223,-4.679 2.594,-9.675 4.145,-15.051 1.48,-5.074 2.898,-10.014 4.275,-14.835 2.926,0.227 6.072,0.204 9.445,-0.119 13.574,-1.331 22.811,-10.516 26.971,-22.438 V -19.52 C 19.502,-5.836 11.418,5.953 -0.23,11.353 0.42,7.664 0.494,3.768 0,0" /></g><g transform="translate(489.166,209.6392)" id="g28"><path id="path30" style="fill:#64a6f9;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c -2.115,-1.955 -4.318,-3.658 -6.58,-5.138 1.459,-18.466 -2.053,-31.395 -9.631,-40.989 -2.115,-2.681 -4.367,-4.932 -6.713,-6.802 h 1.543 c 18.787,0 34.016,15.23 34.016,34.016 V 19.835 C 10.23,12.543 6.078,5.635 0,0" /></g><g transform="translate(460.4863,367.3462)" id="g32"><path id="path34" style="fill:#64a6f9;fill-opacity:1;fill-rule:nonzero;stroke:none" d="M 0,0 C -10.561,0.502 -13.318,-12.105 -6.195,-43.743 17.42,-20.475 15.686,-0.752 0,0" /></g><g transform="translate(407.8086,171.9106)" id="g36"><path id="path38" style="fill:#64a6f9;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c 0,10.545 8.547,19.092 19.092,19.092 10.545,0 19.092,-8.547 19.092,-19.092 0,-2.996 -0.711,-5.82 -1.942,-8.345 2.518,-2.963 7.832,-4.229 15.188,1.186 7.052,5.204 11.625,17.858 12.357,34.506 -23.34,-7.687 -50.01,3.058 -60.359,15.358 -13.082,15.592 -24.311,61.722 21.195,91.643 4.277,2.815 8.168,5.614 11.682,8.406 -1.826,6.682 -3.479,13.385 -4.821,20.271 -2.73,13.94 -1.629,24.762 1.786,32.575 H -78.392 c -18.787,0 -34.016,-15.23 -34.016,-34.016 V 18.815 c 0,-18.786 15.229,-34.015 34.016,-34.015 H 7.572 C 2.979,-11.714 0,-6.212 0,0" /></g><g transform="translate(458.8125,267.6606)" id="g40"><path id="path42" style="fill:#64a6f9;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c -13.943,-7.506 -11.613,-27.174 -4.563,-29.35 8.104,-2.492 5.618,-9.353 -0.625,-9.353 -6.222,0 -17.443,2.5 -19.939,18.077 -1.875,11.707 4.348,27.633 21.012,33.511 -2.481,7.685 -4.93,15.166 -7.213,22.593 -3.18,-3.052 -6.533,-6.169 -10.057,-9.345 -21.443,-19.349 -28.678,-44.88 -13.09,-67.334 11.647,-16.77 30.955,-17.513 46.741,-10.06 -0.678,6.781 -1.891,13.93 -3.737,21.295 C 5.875,-19.328 2.951,-9.431 0,0" /></g><g transform="translate(485.4277,226.4595)" id="g44"><path id="path46" style="fill:#64a6f9;fill-opacity:1;fill-rule:nonzero;stroke:none" d="M 0,0 C 15.516,15.527 3.592,44.733 -16.592,43.912 -11.6,25.777 -7.604,9.625 -5.145,-4.468 -3.332,-3.091 -1.6,-1.578 0,0" /></g><g transform="translate(468.8359,270.3716)" id="g48"><path id="path50" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="M 0,0 C 20.184,0.821 32.107,-28.385 16.592,-43.912 14.992,-45.49 13.26,-47.003 11.447,-48.38 8.988,-34.287 4.992,-18.135 0,0 m -44.498,-43.912 c -15.588,22.454 -8.354,47.985 13.09,67.334 3.523,3.176 6.877,6.293 10.056,9.345 2.284,-7.427 4.733,-14.908 7.213,-22.593 -16.664,-5.878 -22.886,-21.804 -21.011,-33.511 2.496,-15.577 13.716,-18.077 19.939,-18.077 6.242,0 8.729,6.861 0.625,9.353 -7.051,2.176 -9.381,21.844 4.563,29.35 2.951,-9.431 5.875,-19.328 8.529,-29.966 1.846,-7.365 3.058,-14.514 3.736,-21.295 -15.785,-7.453 -35.094,-6.71 -46.74,10.06 M -8.35,96.975 C 7.336,96.223 9.07,76.5 -14.545,53.231 -21.668,84.869 -18.91,97.477 -8.35,96.975 M 4.119,-106.859 c 7.578,9.593 11.09,22.523 9.631,40.989 2.262,1.479 4.465,3.182 6.58,5.138 6.078,5.634 10.231,12.543 12.635,19.835 v 30.663 C 28.805,1.688 19.568,10.873 5.994,12.203 c -3.373,0.323 -6.519,0.347 -9.445,0.119 -1.377,4.822 -2.795,9.762 -4.276,14.835 -1.55,5.376 -2.921,10.372 -4.144,15.052 14.541,15.183 23.807,28.659 25.334,40.434 0.494,3.767 0.42,7.664 -0.231,11.352 -4.093,2.244 -8.767,3.371 -14.283,3.272 h -26.707 c -3.414,-7.814 -4.515,-18.763 -1.785,-32.703 1.342,-6.886 2.994,-13.589 4.82,-20.271 -3.513,-2.792 -7.404,-5.591 -11.681,-8.406 C -81.91,5.966 -70.682,-40.164 -57.6,-55.756 c 10.35,-12.3 37.02,-23.045 60.36,-15.358 -0.733,-16.648 -5.305,-29.302 -12.358,-34.506 -7.355,-5.415 -12.67,-4.149 -15.187,-1.186 1.23,2.525 1.941,5.349 1.941,8.345 0,10.545 -8.547,19.092 -19.092,19.092 -10.544,0 -19.091,-8.547 -19.091,-19.092 0,-6.212 2.742,-11.885 7.336,-15.372 h 50.859 c 2.346,1.871 4.836,4.293 6.951,6.974" /></g><g transform="translate(306.5874,247.5366)" id="g52"><path id="path54" style="fill:#d8e9fd;fill-opacity:1;fill-rule:nonzero;stroke:none" d="M 0,0 2.95,0.756 C 22.843,5.839 25.512,17.51 23.953,25.427 L 40.9,29.761 67.657,-74.841 47.023,-80.12 28.601,-8.078 3.698,-14.448 Z" /></g><g transform="translate(334.8003,338.1431)" id="g56"><path id="path58" style="fill:#ffffff;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c 0,14.787 10.818,16.066 14.851,16.066 8.705,0 15.617,-5.118 15.617,-14.338 0,-7.81 -5.057,-11.775 -9.473,-14.785 -6.017,-4.223 -9.151,-6.269 -10.177,-8.385 h 19.711 v -7.934 H -0.51 c 0.32,5.309 0.703,10.877 10.559,18.044 8.193,5.953 11.457,8.26 11.457,13.382 0,3.006 -1.92,6.463 -6.272,6.463 C 8.962,8.513 8.771,3.33 8.706,0 Z" /></g><g transform="translate(385.2969,290.0483)" id="g60"><path id="path62" style="fill:#f1d01e;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 1.785,-0.51 c 3.414,-0.973 9.762,-2.438 11.895,5.036 0.603,2.113 1.136,7.676 -5.117,9.459 C 0.762,16.214 -1.352,8.819 -1.93,6.788 L -12.49,9.804 C -9.402,20.608 -1.105,26.59 11.893,22.876 19.611,20.673 28.652,13.872 25.168,1.687 23.498,-4.163 18.801,-6.775 15.133,-7.31 l -0.047,-0.163 c 1.867,-1.149 7.672,-6.055 4.865,-15.882 C 16.84,-34.25 6.592,-39.668 -5.023,-36.352 c -5.446,1.557 -19.717,6.956 -14.568,24.99 l 11.13,-3.182 -0.102,-0.058 c -0.882,-3.088 -2.064,-10.305 5.573,-12.485 4.547,-1.296 9.408,0.65 11.24,7.07 2.25,7.875 -5.291,10.384 -10.572,11.889 z" /></g><g transform="translate(435.8887,172.1636)" id="g64"><path id="path66" style="fill:#c50018;fill-opacity:1;fill-rule:nonzero;stroke:none" d="m 0,0 c 0,-5.098 -4.133,-9.228 -9.229,-9.228 -5.097,0 -9.23,4.13 -9.23,9.228 0,5.098 4.133,9.231 9.23,9.231 C -4.133,9.231 0,5.098 0,0" /></g></g></g></svg>';

    LOGODEFAULT =
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?> <svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" id="svg1121" version="1.1" viewBox="0 0 34.131249 14.552089" height="55.000019" width="129"> <defs id="defs1115"> <clipPath id="clipPath4337" clipPathUnits="userSpaceOnUse"> <rect y="552" x="588" height="1436" width="1900" id="rect4339" style="fill:#a3b5c4;fill-opacity:1;stroke:none;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> </clipPath> </defs> <metadata id="metadata1118"> <rdf:RDF> <cc:Work rdf:about=""> <dc:format>image/svg+xml</dc:format> <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" /> <dc:title></dc:title> </cc:Work> </rdf:RDF> </metadata> <g transform="matrix(1.086782,0,0,1.086782,-1.5473245,-1.305799)" id="g1812"> <ellipse transform="matrix(0.01046099,0,0,0.01046099,1.0167389,-6.2048529)" clip-path="url(#clipPath4337)" ry="768" rx="748" cy="1476" cx="1540" id="path4333" style="display:inline;fill:#a3b5c4;fill-opacity:1;stroke:none;stroke-width:15;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <ellipse ry="1.7826859" rx="1.6939216" cy="8.8343534" cx="16.446739" id="path4256" style="display:inline;fill:#c9dad8;fill-opacity:1;stroke:#c9dad8;stroke-width:0.1046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path id="path4328" d="m 17.630266,13.48709 0.32547,0.392044 0.34766,0.27369 0.310676,0.110955 0.236705,-0.05178 0.140544,-0.184926 0.19972,0.08137 0.155338,0.04438 0.613954,-0.421632 0.421631,-0.251499 c 0,0 0.887645,-0.0074 1.605157,-0.554777 0.717513,-0.547381 0.495602,-0.650939 0.495602,-0.650939 l -0.03699,-0.429029 -0.539984,-0.717513 -0.554777,-0.569571 -0.229309,-0.147941 c 0,0 -0.02219,-0.04438 -0.07397,-0.04438 -0.05178,0 -0.244103,-0.07397 -0.517793,0.04438 -0.273691,0.118353 -0.466014,0.170132 -0.843263,0.384646 -0.377248,0.214514 -0.710115,0.421631 -0.835865,0.495602 -0.12575,0.07397 -0.7471,0.429028 -0.7471,0.429028 l -0.09616,0.658336 z" style="display:inline;fill:#f8f8f8;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.01046099px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /> <path id="path4330" d="m 18.081485,13.117239 c 0,0 1.017202,0.219808 1.490613,-0.13525 0.68255,-0.674097 1.655893,-1.154731 1.870355,-1.745308 0.108257,-0.298116 0.09265,-0.372377 -0.08018,-0.637191 -0.784085,-1.1169523 -2.186023,0.483563 -2.186023,0.483563 l -1.220511,1.042983 z" style="display:inline;fill:#c9dad8;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.01046099px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /> <path id="path4281" d="m 18.923638,11.911166 c 0,0 -2.262073,0.360073 -1.245807,1.631426 1.016268,1.271354 1.33159,0.468415 1.33159,0.468415 0,0 0.237364,0.284021 0.550221,-0.01289 0.312857,-0.29691 0.801657,-0.486563 0.801657,-0.486563 0,0 0.833419,-0.08158 1.728851,-0.640345 0.895432,-0.558769 0.02545,-1.494644 0.02545,-1.494644 0,0 -0.704002,-0.914305 -1.191158,-1.062004 -0.487155,-0.147699 -1.260206,-0.205963 -1.260206,-0.205963 z" style="display:inline;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#505050;stroke-width:0.1046099;stroke-linecap:butt;stroke-linejoin:miter;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path id="path5926" d="m 16.889165,3.9907067 c -0.205925,0.00902 -0.490584,0.016452 -0.682434,0.094306 -0.36351,0.1131625 -0.784019,0.3065916 -1.102039,0.4145197 C 14.805707,4.6009993 14.528383,4.8675841 14.442515,4.7707676 14.31485,4.6268244 14.224353,4.595363 14.045689,4.497559 13.801781,4.399505 13.873773,4.4448272 13.660866,4.3863283 13.513681,4.3458871 13.44829,4.2882958 13.047954,4.3023567 c -0.216087,0.00759 -0.47351,0.00804 -0.660081,0.089725 -0.374615,0.1640178 -0.299,0.2484757 -0.538572,0.4900252 -0.165108,0.1664709 -0.223029,0.5749831 -0.282041,0.818858 -0.06939,0.2867776 -0.0547,0.6010393 -0.02031,0.9674031 0.02761,0.2941965 0.09173,0.4973939 0.249388,0.759063 0.135084,0.2241989 0.324561,0.2835828 0.54659,0.4972893 0.07774,0.07483 0.368398,-0.038965 0.48488,-0.015104 0.108709,0.02227 -0.04817,0.2167088 -0.0532,0.2453834 -0.0538,0.2395169 -0.110503,0.087771 -0.0806,0.6274261 0.348123,2.0266892 1.005089,-1.0672647 0.326649,0.6686194 -0.05298,0.135564 -0.437594,0.3888068 -0.503368,0.5868538 -0.01267,0.165109 0.197835,0.19408 0.318997,0.178049 0.06266,0.480395 0.124982,1.042048 0.522242,1.372439 0.120177,0.106402 0.286652,0.09447 0.429317,0.126443 0.221641,0.268128 0.448668,0.557066 0.784087,0.689774 0.283845,0.148435 0.624913,0.051 0.896138,0.233065 0.712925,0.360901 1.59437,0.227424 2.240307,-0.214367 0.239736,-0.02584 0.501243,0.05119 0.751391,0.02222 0.575898,-0.02006 1.167207,-0.240005 1.523962,-0.711502 0.0729,-0.066 0.102081,-0.17814 0.168803,-0.240635 0.06616,0.0833 0.201079,0.165289 0.285653,0.05502 0.193072,-0.253436 0.223413,-0.595104 0.327145,-0.882559 0.08658,0.03641 0.0842,0.265734 0.19082,0.175968 0.08858,-0.27751 0.231055,-0.589554 0.157487,-0.875103 C 21.094968,9.8641514 20.994799,9.7109879 20.959751,9.6709914 21.06973,9.6649214 21.392146,9.6074124 21.364226,9.434279 21.284902,9.2640651 20.930324,9.0580893 20.78147,8.9636893 20.627489,7.0823629 20.831941,7.9730043 20.374475,6.5721668 20.286693,6.296366 20.179582,6.0253908 20.039149,5.7673778 19.814155,5.3540076 19.50363,4.9739075 19.050031,4.6605328 18.694157,4.4866157 18.779167,4.4124578 18.416319,4.2842118 18.040916,4.114893 17.923126,4.1144294 17.706217,4.0495514 17.421993,4.0042382 17.176226,3.9934611 16.889165,3.9907067 Z m -0.416777,3.7702345 c 0.258005,0.00976 0.429259,0.254814 0.527501,0.468441 -0.04651,0.1209123 -0.217613,0.1803318 -0.314316,0.2708005 -0.05227,0.030898 -0.195057,0.1419829 -0.07397,0.1762583 0.167574,-0.00801 0.341125,-0.101776 0.502363,-0.081253 0.0388,0.3136927 0.01038,0.7255031 -0.295939,0.9021495 -0.316884,0.082827 -0.562053,-0.2121416 -0.676829,-0.471618 -0.147096,-0.3666902 -0.185934,-0.8428431 0.07651,-1.1669988 0.06531,-0.068268 0.160011,-0.1063475 0.254678,-0.09778 z m 2.859244,2.5757878 c -0.07673,0.184758 -0.230659,0.330156 -0.407011,0.413252 -0.05539,0.150705 0.04004,0.35438 0.0297,0.483234 -0.04907,-0.160357 -0.0016,-0.361426 -0.108875,-0.496757 -0.07018,-0.02271 -0.147747,-0.0281 -0.211741,-0.07206 0.212794,0.117717 0.49561,0.03924 0.604766,-0.182094 0.02934,-0.03762 0.08159,-0.145575 0.09316,-0.145571 z m -0.965372,0.141988 c 0.04566,0.03409 0.204897,0.162857 0.07744,0.06785 -0.01641,-0.01138 -0.09019,-0.07086 -0.07744,-0.06785 z" style="display:inline;fill:#c9dad8;fill-opacity:1;stroke:none;stroke-width:0.05230495;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path id="path4257" d="m 18.562292,4.3406543 c 0,0 -0.01823,-0.1260925 0.05503,-0.2630911 0.107065,-0.2002118 0.364043,-0.4099485 0.661951,-0.5965291 0.390579,-0.2446202 0.878105,-0.4015772 1.457653,0.035985 0.150331,0.1135008 0.27512,0.3561849 0.43652,0.5462458 0,0 0.443822,0.5325871 0.05918,1.7900829 C 20.847978,7.110845 20.24142,6.5338754 20.24142,6.5338754 Z" style="display:inline;fill:#c9dad8;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.01046099px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /> <path id="path4259" d="m 15.544962,4.3156298 c 0.674016,0.862017 2.224945,3.3646467 2.552481,2.1357471 0.20922,-0.9101061 0.01532,-2.3025973 0.01532,-2.3025973 0,0 -1.252038,-0.4658857 -2.567802,0.1668502 z" style="display:inline;fill:#899bb0;fill-opacity:1;fill-rule:evenodd;stroke:#899bb0;stroke-width:0.1046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path id="path4276" d="m 14.55326,9.3192563 c 0,0 -0.167376,0.052305 1.098404,0.3347517 1.26578,0.2824467 1.621453,-0.6695034 1.621453,-0.6695034 0,0 1.035638,-1.5168436 2.144503,-0.3033687 0,0 0.282447,0.3033687 0.784575,0.2929077 0,0 0.313829,-0.1778368 0.575354,-0.010461 0.261525,0.1673759 0.491667,0.3242907 0.491667,0.3242907 0,0 0.387056,0.3661347 -0.292908,0.3556737 0,0 0.4289,0.1046099 -0.08369,1.339007 l -0.146454,-0.334752 c 0,0 -0.20922,1.401773 -0.575354,0.868262 0,0 -0.168567,0.284042 -0.549335,0.538111 -0.461704,0.308073 -1.20062,0.579034 -1.882846,0.335382 0,0 -0.929436,1.023563 -2.512402,0.121125 0,0 -0.871728,0.166552 -1.457543,-0.816781 0,0 -0.805496,0.198759 -0.95195,-1.495922 0,0 -0.679965,0.04184 -0.04184,-0.543971 0.63812,-0.5858155 1.203014,-0.4602836 1.203014,-0.4602836 z" style="display:inline;fill:#f8f8f8;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.01046099px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /> <path id="path4365" d="m 13.538544,5.3179276 c -0.01698,0.00333 -0.295429,0.00411 -0.542614,-0.1287894 -0.126298,-0.067906 -0.247026,-0.1270069 -0.29127,-0.1859807 -0.03564,-0.047508 0.0041,-0.1114587 -0.06685,-0.053022 -0.949852,0.7828116 -0.485867,2.0489157 0.391518,2.3817499 0,0 0.16803,-0.930502 1.084571,-1.9878057" style="display:inline;fill:#f8f8f8;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.01046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path id="path4367" d="m 18.969129,4.5514697 c 0,0 0.961615,0.6805271 1.19832,1.6125543 0,0 1.153939,-1.7309068 -0.07397,-2.4262282 0,0 -0.207118,0.79888 -1.124351,0.8136739 z" style="display:inline;fill:#f8f8f8;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.01046099px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /> <path id="path4215" d="m 12.838685,10.209018 c 0.144399,1.761682 0.938601,1.472882 0.938601,1.472882 0.63536,1.0108 1.429561,0.82308 1.429561,0.82308 1.371802,0.837522 2.527003,-0.101079 2.527003,-0.101079 1.934963,0.31768 2.411483,-0.924162 2.411483,-0.924162 0.375441,0.577601 0.606481,-0.808641 0.606481,-0.808641 0.05776,-0.11552 0.144401,0.34656 0.144401,0.34656 0.462079,-1.2129605 0.08324,-1.377833 0.08324,-1.377833 1.010801,0.02888 -0.203626,-0.702874 -0.203626,-0.702874 -0.02553,-1.0590654 -0.02508,-1.3292131 -0.390054,-2.3334378 0.809797,0.2163877 0.811057,-0.9606589 0.94917,-1.2297877 0.199919,-0.5390245 -0.0356,-1.5044904 -0.679641,-1.9195323 -0.265411,-0.1710387 -0.6002,-0.2486009 -1.002486,-0.1643198 -0.302755,0.1390128 -0.69254,0.3949895 -0.907628,0.6086619 -0.193613,0.1923395 -0.219649,0.3032114 -0.195442,0.415557" style="fill:none;fill-rule:evenodd;stroke:#505050;stroke-width:0.1046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path id="path4227" d="m 12.838685,10.211495 c 0,0 -0.909721,0.0986 0.25992,-0.8111179 0,0 0.49096,-0.4187608 1.472881,-0.05776" style="fill:none;fill-rule:evenodd;stroke:#505050;stroke-width:0.1046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path id="path4229" d="M 12.904904,9.565553 C 12.505653,8.7738548 12.670797,8.1656037 12.850244,7.958294" style="fill:none;fill-rule:evenodd;stroke:#505050;stroke-width:0.1046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path id="path4201" d="m 14.581303,4.8227692 c 0,0 1.795749,-1.4517066 3.967207,-0.5150309" style="display:inline;fill:none;fill-rule:evenodd;stroke:#505050;stroke-width:0.1046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path style="display:inline;fill:none;fill-rule:evenodd;stroke:#505050;stroke-width:0.1046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" d="M 12.913527,7.8996581 C 10.894356,8.3520143 11.168402,4.2545247 12.764952,4.3025073 13.383569,4.2857373 14.097424,4.267855 14.65681,5.001513" id="path4207" /> <path id="path4233" d="m 18.340331,10.454499 c 0,0 0.66424,0.722 1.010801,-0.17328" style="display:inline;fill:none;fill-rule:evenodd;stroke:#505050;stroke-width:0.1046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path id="path4235" d="m 18.889052,10.728859 0.0722,0.56316" style="display:inline;fill:none;fill-rule:evenodd;stroke:#505050;stroke-width:0.1046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path id="path4251" d="m 14.13482,5.3440801 c -0.178391,0 -0.632946,0.00698 -0.994192,-0.086816 C 12.90873,5.1970519 12.715284,5.0953125 12.658026,4.9235378" style="display:inline;fill:none;fill-rule:evenodd;stroke:#505050;stroke-width:0.1046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path id="path4301" d="m 12.672906,11.249959 c 0,0 -1.213113,0.880247 -0.724909,1.545981 l 0.59916,0.532586 0.821072,0.443823 1.227907,0.06657 0.806277,-0.147941 0.414234,-0.184926 0.443822,0.37725 0.399441,0.01479 0.229308,-0.110956 0.687924,-0.273691 0.362456,-0.284786 0.207117,-0.314373 -0.02959,-0.340264 c 0,0 -0.384646,-1.161335 -0.79888,-1.346261 0,0 -0.532587,-0.576969 -1.272291,-0.08137 0,0 -1.116952,0.369852 -2.085964,0.04438 -0.969012,-0.32547 -1.287085,0.05918 -1.287085,0.05918 z" style="display:inline;fill:#f8f8f8;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.01046099px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /> <path id="path4325" d="m 11.85318,12.481094 c 0,0 1.220511,-0.702719 3.06977,-0.184927 0,0 0.917234,0.162736 1.508996,-0.06657 0.591764,-0.229309 0.791483,0.27369 0.791483,0.27369 0,0 0.466014,0.843262 0.39944,0.902438 l 0.177529,-0.05178 0.266293,-0.340264 0.07397,-0.258897 -0.140543,-0.429028 -0.273691,-0.576968 -0.310676,-0.443822 -0.251499,-0.184927 -0.421631,-0.184925 -0.406838,0.02959 -0.606556,0.251499 c 0,0 -1.028189,0.288485 -2.2487,-0.184925 0,0 -0.902438,-0.162736 -1.516392,0.983806 l -0.118353,0.399439 z" style="display:inline;fill:#c9dad8;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.01046099px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" /> <path id="path4279" d="m 16.833672,13.785217 c 0.153423,-0.102967 1.454122,-0.405144 1.27153,-1.107052 -0.18259,-0.701906 -0.810488,-2.18308 -1.962749,-1.621151 -1.152264,0.561932 -2.428271,0.04422 -2.428271,0.04422 0,0 -0.502575,-0.191198 -0.917137,0.04475 -0.414562,0.235951 -0.835691,0.624285 -0.96967,1.263836 -0.133982,0.639557 1.559745,1.341991 1.559745,1.341991 0,0 1.628567,0.238813 2.395693,-0.276035 0,0 0.629729,0.697771 1.050859,0.309437 z" style="display:inline;fill:none;fill-opacity:1;fill-rule:evenodd;stroke:#505050;stroke-width:0.1046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path d="m 17.114016,8.5098241 a 0.94989708,0.58640587 78.078062 0 1 -0.340613,1.0406955 0.94989708,0.58640587 78.078062 0 1 -0.776562,-0.678756 0.94989708,0.58640587 78.078062 0 1 0.23956,-1.1290216 0.94989708,0.58640587 78.078062 0 1 0.807736,0.5318372 l -0.503878,0.3563839 z" id="path4265" style="display:inline;fill:#505050;fill-opacity:1;stroke-width:0.10460994;stroke-miterlimit:4;stroke-dasharray:none" /> <path d="M 20.413977,8.0315906 A 0.85676325,0.52891095 78.078062 0 1 20.10676,8.9702498 0.85676325,0.52891095 78.078062 0 1 19.406336,8.3580431 0.85676325,0.52891095 78.078062 0 1 19.622407,7.3397176 0.85676325,0.52891095 78.078062 0 1 20.350948,7.8194108 l -0.454474,0.3214416 z" id="path4265-2" style="display:inline;fill:#505050;fill-opacity:1;stroke-width:0.10460994;stroke-miterlimit:4;stroke-dasharray:none" /> <path id="path5720" d="m 21.134832,7.6963634 c -0.112318,-0.027757 -0.262497,-0.081054 -0.333731,-0.1184383 -0.144005,-0.075573 -0.299329,-0.2698653 -0.299329,-0.374426 0,-0.096607 -0.193298,-0.846814 -0.294133,-1.1415597 C 19.91785,5.2148827 19.426736,4.6758205 18.806808,4.5243423 18.574543,4.4675893 18.37796,4.3777172 18.37796,4.3282851 c 0,-0.1165874 0.518787,-0.372059 0.755587,-0.3720818 0.225129,-2.09e-5 0.551773,0.1955105 0.754007,0.4513556 0.08958,0.113326 0.336843,0.5587874 0.549476,0.9899141 0.630891,1.2791719 1.127464,1.9684738 1.567563,2.1759633 0.217308,0.1024518 0.226116,0.111942 0.130881,0.1410215 -0.159835,0.048804 -0.77495,0.037681 -1.000642,-0.018094 z" style="fill:#000000;fill-opacity:0;stroke-width:0.05230495;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none" /> <path id="path4245" d="m 15.544387,4.3143709 c 0,0 1.555226,2.1088053 2.078276,2.2761811 0.523049,0.1673759 0.550099,-1.2673939 0.550099,-1.2673939 0,0 0.01046,-0.8054962 -0.03138,-1.16117" style="fill:none;fill-rule:evenodd;stroke:none;stroke-width:0.1046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <path id="path4249" d="m 18.944377,4.5456262 c 0.250182,0.02965 0.853235,-0.055903 1.134665,-0.7723694" style="fill:none;fill-rule:evenodd;stroke:#505050;stroke-width:0.1046099;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" /> <text id="text4245" y="2.0512714" x="11.557299" style="font-style:normal;font-weight:normal;font-size:0.12553188px;line-height:0%;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:none;stroke-width:0.01046099px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" xml:space="preserve"><tspan style="font-size:0.4184396px;line-height:1.25;stroke-width:0.01046099px" y="2.0512714" x="11.557299" id="tspan4247"> </tspan></text> </g> </svg>';

    if (GUIDEURL === "guide url" || GUIDEURL === "") {
        GUIDEURL =
            "https://github.com/sugarlabs/musicblocks/tree/master/guide/README.md";
    }

    NUMBERBLOCKDEFAULT = 4;
    DEFAULTPALETTE = "rhythm";
}

let HELPCONTENT;
let TITLESTRING;
let BUILTINPALETTES;
let BUILTINPALETTESFORL23N;
let MULTIPALETTES;
let SKIPPALETTES;
let MULTIPALETTEICONS;
let MULTIPALETTENAMES;

if (_THIS_IS_TURTLE_BLOCKS_) {
    TITLESTRING = _("Turtle Blocks is a Logo-inspired turtle that draws colorful pictures with snap-together visual-programming blocks.");

    // We don't include "extras" since we want to be able to delete
    // plugins from the extras palette.
    BUILTINPALETTES = [
        "search",
        "rhythm",
        "meter",
        "pitch",
        "intervals",
        "tone",
        "ornament",
        "volume",
        "drum",
        "flow",
        "action",
        "boxes",
        "widgets",
        "graphics",
        "pen",
        "number",
        "boolean",
        "media",
        "sensors",
        "heap",
        "dictionary",
        "ensemble",
        "extras",
        "program",
        "myblocks"
    ];

    BUILTINPALETTESFORL23N = [
        _("search"),
        _("rhythm"),
        _("meter"),
        _("pitch"),
        _("intervals"),
        _("tone"),
        _("ornament"),
        _("volume"),
        _("drum"),
        _("flow"),
        _("action"),
        _("boxes"),
        _("widgets"),
        _("graphics"),
        _("pen"),
        _("number"),
        _("boolean"),
        _("media"),
        _("sensors"),
        _("heap"),
        _("dictionary"),
        _("ensemble"),
        _("extras"),
        //.TRANS: program as in computer program
        _("program"),
        _("my blocks")
    ];

    // We put the palette buttons into groups.
    MULTIPALETTES = [
        [
            "graphics",
            "pen",
            "media",
            "sensors",
            "ensemble"
        ],
        [
            "flow",
            "action",
            "boxes",
            "number",
            "boolean",
            "heap",
            "dictionary",
            "extras",
            "program",
            "myblocks"
        ],
        [
            "rhythm",
            "meter",
            "pitch",
            "intervals",
            "tone",
            "ornament",
            "volume",
            "drum",
            "widgets"
        ]
    ];

    // Skip these palettes in beginner mode.
    SKIPPALETTES = ["heap", "dictionary", "extras", "program", "meter", "pitch", "intervals", "tone", "ornament", "volume", "drum", "widgets"];

    // Icons used to select between multipalettes.
    MULTIPALETTEICONS = ["artwork", "logic", "music"];
    MULTIPALETTENAMES = [_("artwork"), _("logic"), _("music")];
} else {
    TITLESTRING = _("Music Blocks is a collection of tools for exploring fundamental musical concepts in a fun way.");

    // We don't include "extras" since we want to be able to delete
    // plugins from the extras palette.
    BUILTINPALETTES = [
        "search",
        "rhythm",
        "meter",
        "pitch",
        "intervals",
        "tone",
        "ornament",
        "volume",
        "drum",
        "flow",
        "action",
        "boxes",
        "widgets",
        "graphics",
        "pen",
        "number",
        "boolean",
        "media",
        "sensors",
        "heap",
        "dictionary",
        "ensemble",
        "extras",
        "program",
        "myblocks"
    ];

    BUILTINPALETTESFORL23N = [
        _("search"),
        _("rhythm"),
        _("meter"),
        _("pitch"),
        _("intervals"),
        _("tone"),
        _("ornament"),
        _("volume"),
        _("drum"),
        _("flow"),
        _("action"),
        _("boxes"),
        _("widgets"),
        _("graphics"),
        _("pen"),
        _("number"),
        _("boolean"),
        _("media"),
        _("sensors"),
        _("heap"),
        _("dictionary"),
        _("ensemble"),
        _("extras"),
        //.TRANS: program as in computer program
        _("program"),
        _("my blocks")
    ];

    // We put the palette buttons into groups.
    MULTIPALETTES = [
        [
            "rhythm",
            "meter",
            "pitch",
            "intervals",
            "tone",
            "ornament",
            "volume",
            "drum",
            "widgets"
        ],
        [
            "flow",
            "action",
            "boxes",
            "number",
            "boolean",
            "heap",
            "dictionary",
            "extras",
            "program",
            "myblocks"
        ],
        ["graphics", "pen", "media", "sensors", "ensemble"]
    ];

    // Skip these palettes in beginner mode.
    SKIPPALETTES = ["heap", "dictionary", "extras", "program"];

    // Icons used to select between multipalettes.
    MULTIPALETTEICONS = ["music", "logic", "artwork"];
    MULTIPALETTENAMES = [_("music"), _("logic"), _("artwork")];
}

const getMainToolbarButtonNames = (name) => {
    return (
        [
            "popdown-palette",
            "run",
            "step",
            "step-music",
            "stop-turtle",
            "hard-stop-turtle",
            "palette",
            "help",
            "sugarizer-stop",
            "beginner",
            "advanced",
            "planet",
            "planet-disabled",
            "open",
            "save",
            "new"
        ].indexOf(name) > -1
    );
};

const getAuxToolbarButtonNames = (name) => {
    return (
        [
            "paste-disabled",
            "Cartesian",
            "compile",
            "utility",
            "restore-trash",
            "hide-blocks",
            "collapse-blocks",
            "go-home"
        ].indexOf(name) > -1
    );
};

const createDefaultStack = () => {
    if (_THIS_IS_TURTLE_BLOCKS_) {
        DATAOBJS =
            [
                [0, "start", screen.width / 3, 100, [null, 1, null]],
                [1, "repeat", 0, 0, [0, 2, 4, 3]],
                [2, ["number", {"value": 4}], 0, 0, [1]],
                [3, "hidden", 0, 0, [1, null]],
                [4, "forward", 0, 0, [1, 5, 6]],
                [5, ["number", {"value": 100}], 0, 0, [4]],
                [6, "right", 0, 0, [4, 7, null]],
                [7, ["number", {"value": 90}], 0, 0, [6]],
            ];
    } else {
        let language = localStorage.languagePreference;
        if (language === undefined) {
            language = navigator.language;
        }

        if (language === "ja") {
            DATAOBJS = [
                [0, "start", screen.width / 2 + 28, 100, [null, 1, null]],
                [1, "settimbre", 0, 0, [0, 2, 4, 3]],
                [2, ["voicename", { value: "guitar" }], 0, 0, [1]],
                [3, "hidden", 0, 0, [1, null]],
                [4, "newnote", 0, 0, [1, 5, 8, 12]],
                [5, "divide", 0, 0, [4, 6, 7]],
                [6, ["number", { value: 1 }], 0, 0, [5]],
                [7, ["number", { value: 2 }], 0, 0, [5]],
                [8, "vspace", 0, 0, [4, 9]],
                [9, "pitch", 0, 0, [8, 10, 11, null]],
                [10, ["solfege", { value: "do" }], 0, 0, [9]],
                [11, ["number", { value: 4 }], 0, 0, [9]],
                [12, "hidden", 0, 0, [4, 13]],
                [13, "newnote", 0, 0, [12, 14, 17, 21]],
                [14, "divide", 0, 0, [13, 15, 16]],
                [15, ["number", { value: 1 }], 0, 0, [14]],
                [16, ["number", { value: 4 }], 0, 0, [14]],
                [17, "vspace", 0, 0, [13, 18]],
                [18, "pitch", 0, 0, [17, 19, 20, null]],
                [19, ["solfege", { value: "mi" }], 0, 0, [18]],
                [20, ["number", { value: 4 }], 0, 0, [18]],
                [21, "hidden", 0, 0, [13, 22]],
                [22, "newnote", 0, 0, [21, 23, 26, 30]],
                [23, "divide", 0, 0, [22, 24, 25]],
                [24, ["number", { value: 1 }], 0, 0, [23]],
                [25, ["number", { value: 4 }], 0, 0, [23]],
                [26, "vspace", 0, 0, [22, 27]],
                [27, "pitch", 0, 0, [26, 28, 29, null]],
                [28, ["solfege", { value: "sol" }], 0, 0, [27]],
                [29, ["number", { value: 4 }], 0, 0, [27]],
                [30, "hidden", 0, 0, [22, 31]],
                [31, "newnote", 0, 0, [30, 32, 35, 39]],
                [32, "divide", 0, 0, [31, 33, 34]],
                [33, ["number", { value: 1 }], 0, 0, [32]],
                [34, ["number", { value: 1 }], 0, 0, [32]],
                [35, "vspace", 0, 0, [31, 36]],
                [36, "pitch", 0, 0, [35, 37, 38, null]],
                [37, ["solfege", { value: "do" }], 0, 0, [36]],
                [38, ["number", { value: 5 }], 0, 0, [36]],
                [39, "hidden", 0, 0, [31, null]]
            ];
        } else {
            DATAOBJS = [
                [0, "start", screen.width / 2 + 28, 100, [null, 1, null]],
                [1, "settimbre", 0, 0, [0, 2, 4, 3]],
                [2, ["voicename", { value: "guitar" }], 0, 0, [1]],
                [3, "hidden", 0, 0, [1, null]],
                [4, "newnote", 0, 0, [1, 5, 8, 12]],
                [5, "divide", 0, 0, [4, 6, 7]],
                [6, ["number", { value: 1 }], 0, 0, [5]],
                [7, ["number", { value: 4 }], 0, 0, [5]],
                [8, "vspace", 0, 0, [4, 9]],
                [9, "pitch", 0, 0, [8, 10, 11, null]],
                [10, ["solfege", { value: "sol" }], 0, 0, [9]],
                [11, ["number", { value: 4 }], 0, 0, [9]],
                [12, "hidden", 0, 0, [4, 13]],
                [13, "newnote", 0, 0, [12, 14, 17, 21]],
                [14, "divide", 0, 0, [13, 15, 16]],
                [15, ["number", { value: 1 }], 0, 0, [14]],
                [16, ["number", { value: 4 }], 0, 0, [14]],
                [17, "vspace", 0, 0, [13, 18]],
                [18, "pitch", 0, 0, [17, 19, 20, null]],
                [19, ["solfege", { value: "mi" }], 0, 0, [18]],
                [20, ["number", { value: 4 }], 0, 0, [18]],
                [21, "hidden", 0, 0, [13, 22]],
                [22, "newnote", 0, 0, [21, 23, 26, 30]],
                [23, "divide", 0, 0, [22, 24, 25]],
                [24, ["number", { value: 1 }], 0, 0, [23]],
                [25, ["number", { value: 2 }], 0, 0, [23]],
                [26, "vspace", 0, 0, [22, 27]],
                [27, "pitch", 0, 0, [26, 28, 29, null]],
                [28, ["solfege", { value: "sol" }], 0, 0, [27]],
                [29, ["number", { value: 4 }], 0, 0, [27]],
                [30, "hidden", 0, 0, [22, null]]
            ];
        }
    }
};

const createHelpContent = (activity) => {
    let language = localStorage.languagePreference;
    if (language === undefined) {
        language = navigator.language;
    }

    let LOGO = LOGODEFAULT;
    if (language === "ja") {
        LOGO = LOGOJA;
    }

    if (_THIS_IS_TURTLE_BLOCKS_) {
        HELPCONTENT = [
            [
                _("Welcome to Turtle Blocks"),
                _("Turtle Blocks is a Logo-inspired turtle that draws colorful pictures with snap-together visual-programming blocks.") +
                    _("The current version is") +
                    " " +
                    VERSION,
                "data:image/svg+xml;base64," +
                    window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(LOGO)))))
            ],
            [
                _("Play"),
                _("Click the run button to run the project in fast mode."),
                "data:image/svg+xml;base64," +
                    window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(RUNBUTTON)))))
            ],
            [
                _("Stop"),
                _("Stop the turtle.") +
                    " " +
                    _("You can also type Alt-S to stop."),
                "data:image/svg+xml;base64," +
                    window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(STOPTURTLEBUTTON)))))
            ]
        ];
    } else {
        HELPCONTENT = [
            [
                _("Welcome to Music Blocks"),
                _("Music Blocks is a collection of tools for exploring fundamental musical concepts in a fun way.") +
                    " " +
                    _("The current version is") +
                    " " +
                    VERSION,
                "data:image/svg+xml;base64," +
                    window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(LOGO)))))
            ],
            [
                _("Meet Mr. Mouse!"),
                _("Mr Mouse is our Music Blocks conductor.") +
                    " " +
                    _("Mr Mouse encourages you to explore Music Blocks.") +
                    " " +
                    _("Let us start our tour!"),
                "data:image/svg+xml;base64," +
                    window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(MOUSEPALETTEICON)))))
            ],
            [
                _("Play"),
                _("Click the run button to run the project in fast mode."),
                "data:image/svg+xml;base64," +
                    window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(RUNBUTTON)))))
            ],
            [
                _("Stop"),
                _("Stop the music (and the mice).") +
                    " " +
                    _("You can also type Alt-S to stop."),
                "data:image/svg+xml;base64," +
                    window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(STOPTURTLEBUTTON)))))
            ]
        ];
    }
    HELPCONTENT.push([
        _("Record"),
        _("Record your project as video."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(RECORDBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Full screen"),
        _("Toggle full screen mode."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(FULLSCREENBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("New project"),
        _("Initialize a new project."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(NEWBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Load project from file"),
        _("You can also load projects from the file system."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(LOADBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Delete"),
        _("To delete a block, just right-click on it, then you will be able to see the delete option"),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(EMPTYTRASHCONFIRMBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Copy"),
        _("To copy a block, just right-click on it, then you will be able to see the copy option"),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(COPYBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Extract"),
        _("To extract a block, just right-click on it, then you will be able to see the extract option"),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(EXTRACTBUTTON)))))
    ]);
    if (activity.beginnerMode) {
        HELPCONTENT.push([
            _("Save project"),
            _("Save your project to a file."),
            "data:image/svg+xml;base64," +
                window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(SAVEBUTTON)))))
        ]);
    } else {
        if (_THIS_IS_TURTLE_BLOCKS_) {
            HELPCONTENT.push([
                _("save"),
                _("Save project") +
                    ": " +
                    _("Save your project to a file.") +
                    "<br/><br/>" +
                    _("Save turtle artwork as SVG") +
                    ": " +
                    _("Save graphics from your project to as SVG.") +
                    "<br/><br/>" +
                    _("Save turtle artwork as PNG") +
                    ": " +
                    _("Save graphics from your project as PNG.") +
                    "<br/><br/>" +
                    _("Save block artwork as SVG") +
                    ": " +
                    _("Save block artwork as an SVG file."),
                "data:image/svg+xml;base64," +
                    window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(SAVEBUTTON)))))
            ]);
        } else {
            HELPCONTENT.push([
                _("save"),
                _("Save project") +
                    ": " +
                    _("Save your project to a file.") +
                    "<br/><br/>" +
                    _("Save mouse artwork as SVG") +
                    ": " +
                    _("Save graphics from your project to as SVG.") +
                    "<br/><br/>" +
                    _("Save mouse artwork as PNG") +
                    ": " +
                    _("Save graphics from your project as PNG.") +
                    "<br/><br/>" +
                    _("Save music as WAV") +
                    ": " +
                    _("Save audio from your project as WAV.") +
                    "<br/><br/>" +
                    _("Save sheet music as ABC") +
                    ": " +
                    _("Save your project to as an ABC file.") +
                    "<br/><br/>" +
                    _("Save sheet music as Lilypond") +
                    ": " +
                    _("Save your project to as a Lilypond file.") +
                    "<br/><br/>" +
                    _("Save block artwork as SVG") +
                    ": " +
                    _("Save block artwork as an SVG file."),
                "data:image/svg+xml;base64," +
                    window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(SAVEBUTTON)))))
            ]);
        }
    }
    HELPCONTENT.push([
        _("Load samples from server"),
        _("This button opens a viewer for loading example projects."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(PLANETBUTTON)))))
    ]);
    if (_THIS_IS_MUSIC_BLOCKS_) {
        HELPCONTENT.push([
            _("Palette buttons"),
            _("This toolbar contains the palette buttons including Rhythm Pitch Tone Action and more.") +
                " " +
                _("Click to show the palettes of blocks and drag blocks from the palettes onto the canvas to use them."),
            "data:image/svg+xml;base64," +
                window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(RHYTHMPALETTEICON)))))
        ]);
    }
    HELPCONTENT.push([
        _("Cartesian/Polar"),
        _("Show or hide a coordinate grid."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(CARTESIANBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Clean"),
        _("Clear the screen and return the mice to their initial positions."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(CLEARBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Collapse"),
        _("Collapse the graphics window."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(COLLAPSEBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Home"),
        _("Return all blocks to the center of the screen."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(GOHOMEBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Show/hide blocks"),
        _("Hide or show the blocks and the palettes."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(HIDEBLOCKSBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Expand/collapse collapsable blocks"),
        _("Expand or collapse start and action stacks."),
        "data:image/svg+xml;base64," +
            window.btoa
                (String.fromCodePoint(...(decodeURIComponent(encodeURIComponentCOLLAPSEBLOCKSBUTTON)))
            )
    ]);
    HELPCONTENT.push([
        _("Decrease block size"),
        _("Decrease the size of the blocks."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(SMALLERBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Increase block size"),
        _("Increase the size of the blocks."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(BIGGERBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Expand/collapse option toolbar"),
        _("Click this button to expand or collapse the auxillary toolbar."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(MENUBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Run slow"),
        _("Click to run the project in slow mode."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(SLOWBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Run step by step"),
        _("Click to run the project step by step."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(STEPBUTTON)))))
    ]);
    if (!activity.beginnerMode) {
        HELPCONTENT.push([
            _("Display statistics"),
            _("Display statistics about your Music project."),
            "data:image/svg+xml;base64," +
                window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(STATSBUTTON)))))
        ]);
        // TODO: add plugin
        HELPCONTENT.push([
            _("Delete plugin"),
            _("Delete a selected plugin."),
            "data:image/svg+xml;base64," +
                window.btoa(
                    decodeURIComponent(encodeURIComponent(PLUGINSDELETEBUTTON))
                )
        ]);
        HELPCONTENT.push([
            _("Enable scrolling"),
            _("You can scroll the blocks on the canvas."),
            "data:image/svg+xml;base64," +
                window.btoa(
                    decodeURIComponent(encodeURIComponent(SCROLLUNLOCKBUTTON))
                )
        ]);
    }
    // TODO: Add merge
    HELPCONTENT.push([
        _("Wrap Turtle"),
        _("Turn Turtle wrapping On or Off."),
        "data:image/svg+xml;base64," +
            window.btoa(
                String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(WRAPTURTLEBUTTON))))
            )
    ]);
    // TODO: Music Blocks: set pitch preview
    // TODO: toggle JS editor
    HELPCONTENT.push([
        _("Restore"),
        _("Restore blocks from the trash."),
        "data:image/svg+xml;base64," +
            window.btoa(
                (String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(RESTORETRASHBUTTON)))))
            )
    ]);
    HELPCONTENT.push([
        _("Switch mode"),
        _("Switch between beginner and advance modes."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(ADVANCEDBUTTON)))))
    ]);
    HELPCONTENT.push([
        _("Select language"),
        _("Select your language preference."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(LANGUAGEBUTTON)))))
    ]);
    if (_THIS_IS_MUSIC_BLOCKS_) {
        HELPCONTENT.push([
            _("Keyboard shortcuts"),
            _("You can type d to create a do block and r to create a re block etc."),
            "data:image/svg+xml;base64," +
                window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(SHORTCUTSBUTTON)))))
        ]);
    }
    HELPCONTENT.push([
        _("Help"),
        _("Show these messages."),
        "data:image/svg+xml;base64," +
            window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(HELPBUTTON)))))
    ]);
    if (_THIS_IS_TURTLE_BLOCKS_) {
        HELPCONTENT.push([
            _("Guide"),
            _("A detailed guide to Turtle Blocks is available."),
            "data:image/svg+xml;base64," +
                window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(LOGO))))),
            GUIDEURL,
            _("Turtle Blocks Guide")
        ]);
        HELPCONTENT.push([
            _("About"),
            _("Turtle Blocks is an open source collection of tools for exploring musical concepts.") +
                " " +
                _("A full list of contributors can be found in the Turtle Blocks GitHub repository.") +
                " " +
                _("Turtle Blocks is licensed under the AGPL.") +
                " " +
                _("The current version is") +
                " " +
                VERSION,
            "data:image/svg+xml;base64," +
                window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(LOGO))))),
            "https://github.com/sugarlabs/turtleblocksjs",
            _("Turtle Blocks GitHub repository")
        ]);
        HELPCONTENT.push([
            _("Congratulations."),
            _("You have finished the tour. Please enjoy Turtle Blocks!"),
            "data:image/svg+xml;base64," +
                window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(LOGO)))))
        ]);
    } else {
        HELPCONTENT.push([
            _("Guide"),
            _("A detailed guide to Music Blocks is available."),
            "data:image/svg+xml;base64," +
                window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(LOGO))))),
            GUIDEURL,
            _("Music Blocks Guide")
        ]);
        HELPCONTENT.push([
            _("About"),
            _("Music Blocks is an open source collection of tools for exploring musical concepts.") +
                " " +
                _("A full list of contributors can be found in the Music Blocks GitHub repository.") +
                " " +
                _("Music Blocks is licensed under the AGPL.") +
                " " +
                _("The current version is") +
                " " +
                VERSION,
            "data:image/svg+xml;base64," +
                window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(LOGO))))),
            "https://github.com/sugarlabs/musicblocks",
            _("Music Blocks GitHub repository")
        ]);
        HELPCONTENT.push([
            _("Congratulations."),
            _("You have finished the tour. Please enjoy Music Blocks!"),
            "data:image/svg+xml;base64," +
                window.btoa(String.fromCodePoint(...(decodeURIComponent(encodeURIComponent(LOGO)))))
        ]);
    }
};
