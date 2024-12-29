// Copyright (c) 2015-2024 Yash Khandelwal
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global requirejs */

requirejs.config({
    baseUrl: "lib",
    packages: [],
    paths: {
        activity: "../js",
        easeljs: "../lib/easeljs",
        prefixfree: "../bower_components/prefixfree/prefixfree.min",
        sugar: "../lib/sugar-web/activity/activity",
        webL10n: "../lib/webL10n"
    },
    shim: {
        easeljs: {
            exports: "createjs"
        }
    }
});

requirejs(["activity/activity", "sugar-web/env", "sugar-web/graphics/icon"], function (activity, env, icon) {
    // Initialize dark mode based on Sugar environment
    env.getEnvironment(function (err, environment) {
        const isDarkMode = environment.colorvalue && environment.colorvalue.stroke === '#ffffff';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            if (activity.turtles) {
                activity.turtles.setBackgroundColor(true);
            }
        }
    });

    // Listen for Sugar color changes
    window.addEventListener('sugar-colorchange', function(e) {
        const isDarkMode = e.detail.stroke === '#ffffff';
        document.body.classList.toggle('dark-mode', isDarkMode);
        if (activity.turtles) {
            activity.turtles.setBackgroundColor(isDarkMode);
        }
    });
});
