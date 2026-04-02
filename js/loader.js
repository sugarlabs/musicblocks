// Copyright (c) 2015-2024 Yash Khandelwal
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.

/* global requirejs */

requirejs.config({
    baseUrl: "./",
    urlArgs: "v=" + Date.now(),
    waitSeconds: 60,
    shim: {
        "easeljs.min": { exports: "createjs" },
        "tweenjs.min": { exports: "createjs" },
        "preloadjs.min": { exports: "createjs" },
        "Tone": { exports: "Tone" },
        "howler": { exports: "Howl" },
        "Chart": { exports: "Chart" },
        "p5.min": { exports: "p5" },
        "p5-adapter": { deps: ["p5.min"] },
        "p5.sound.min": { deps: ["p5-adapter"] },
        "p5.dom.min": { deps: ["p5.min"] },
        "p5-sound-adapter": { deps: ["p5.sound.min"] },
        "materialize": { deps: ["jquery"], exports: "Materialize" },
        "jquery-ui": { deps: ["jquery"] },
        "jquery-ruler": { deps: ["jquery"] },
        "libgif": { exports: "SuperGif" },
        "gif-animator": { deps: ["libgif"] },
        "abc": { exports: "ABCJS" },
        "utils/platformstyle": { exports: "platform" },
        "utils/utils": { deps: ["utils/platformstyle"], exports: "_" },
        "activity/turtledefs": { deps: ["utils/utils"], exports: "createDefaultStack" },
        "activity/block": { deps: ["activity/turtledefs"], exports: "Block" },
        "activity/blocks": { deps: ["activity/block"], exports: "Blocks" },
        "activity/turtle-singer": { exports: "Singer" },
        "activity/turtle-painter": { exports: "Painter" },
        "activity/turtle": { deps: ["activity/turtledefs", "activity/turtle-singer", "activity/turtle-painter"], exports: "Turtle" },
        "activity/turtles": { deps: ["activity/turtle"], exports: "Turtles" },
        "activity/notation": { exports: "Notation" },
        "utils/synthutils": { deps: ["utils/utils", "activity/activity-context"], exports: "Synth" },
        "activity/logo": { deps: ["activity/turtles", "activity/notation", "utils/synthutils", "activity/logoconstants"], exports: "Logo" },
        "env": { exports: "MB_ENV" },
        "activity/activity": {
            deps: [
                "jquery",
                "materialize",
                "easeljs.min",
                "tweenjs.min",
                "preloadjs.min",
                "Tone",
                "libgif",
                "abc",
                "env",
                "i18next",
                "i18nextHttpBackend",
                "utils/utils",
                "activity/activity-context",
                "activity/logo",
                "activity/blocks",
                "activity/turtles"
            ],
            exports: "Activity"
        }
    },
    paths: {
        "utils": "js/utils",
        "widgets": "js/widgets",
        "activity": "js",
        "easeljs.min": "lib/easeljs.min",
        "tweenjs.min": "lib/tweenjs.min",
        "preloadjs.min": "lib/preloadjs.min",
        "prefixfree.min": "lib/prefixfree.min",
        "howler": "lib/howler",
        "Chart": "lib/Chart",
        "jquery": "lib/jquery-3.7.1.min",
        "jquery-ui": "lib/jquery-ui",
        "materialize": "lib/materialize.min",
        "abc": "lib/abc.min",
        "Tone": "lib/Tone",
        "i18next": "lib/i18next.min",
        "i18nextHttpBackend": "lib/i18nextHttpBackend.min",
        "libgif": "https://cdn.jsdelivr.net/gh/buzzfeed/libgif-js/libgif.js",
        "jquery-ruler": "lib/jquery.ruler",
        "env": "env",
        "domReady": "lib/domReady",
        "gif-animator": "js/gif-animator"
    }
});

// Start the application by loading the main activity
// Dependencies are handled via shim config and internal 'define' calls
requirejs(["jquery", "activity/activity"], function ($) {
    $(function () {
        console.log("Music Blocks application initialized.");
    });
}, function (err) {
    console.error("Failed to start Music Blocks:", err);
});
