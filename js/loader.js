// Copyright (c) 2015 Yash Khandelwal
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

requirejs.config({
    baseUrl: "lib",
    waitSeconds: "0",
    shim: {
        easel: {
            exports: "createjs"
        }
    },
    paths: {
        utils: "../js/utils",
        widgets: "../js/widgets",
        activity: "../js",
        easel: "../lib/easeljs",
        twewn: "../lib/tweenjs",
        prefixfree: "../bower_components/prefixfree/prefixfree.min",
        samples: "../sounds/samples",
        planet: "../js/planet"
    },
    packages: []
});

requirejs(["activity/activity"]);
