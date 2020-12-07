// Copyright (c) 2015-20 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

define([
    "sugar-web/env",
    "sugar-web/activity/activity",
    "sugar-web/datastore"
], function(env, activity, datastore) {
    let sugarizerCompatibility = {
        activity: activity,
        data: { allProjects: "[]" },
        env: env,
        xoColor: {
            stroke: "#00A0FF",
            fill: "#8BFF7A"
        },

        saveLocally: function(callback) {
            let that = this;
            activity.getDatastoreObject().setDataAsText(JSON.stringify(
		that.data));
            activity.getDatastoreObject().save(function() {
                if (callback) {
                    callback();
                }
            });
        },

        isInsideSugarizer: function() {
            // Work-around since MB is not part of Sugarizier but if
            // someone has the env set, it breaks MB.  return
            // env.isSugarizer();
            return false;
        },

        loadData: function(callback) {
            let that = this;
            activity
                .getDatastoreObject()
                .loadAsText(function(error, metadata, jsonData) {
                    if (jsonData !== undefined && jsonData !== null) {
                        that.data = JSON.parse(jsonData);
                    }
                    if (metadata.buddy_color) {
                        that.xoColor = metadata.buddy_color;
                    }
                    if (callback !== undefined) {
                        callback();
                    }
                });
        },

        hideLoading: function() {
            let imageLoading = document.getElementById(
                "loading-image-container"
            );
            imageLoading.style.display = "none";
        },

        sugarizerStop: function() {
            document.getElementById("stop-button").click();
        },

        getLanguage: function() {
            let defaultSettings = {
                name: "",
                language:
                    typeof chrome != "undefined" &&
                    chrome.app &&
                    chrome.app.runtime
                        ? chrome.i18n.getUILanguage()
                        : navigator.language
            };

            if (!env.isSugarizer()) {
                callback();
                return defaultSettings.language;
            }

            let loadedSettings = datastore.localStorage.getValue(
                "sugar_settings"
            );
            return loadedSettings.language;
        },

        setup: function() {
            console.debug("insideSugarizer? " + this.isInsideSugarizer());
            if (this.isInsideSugarizer() === false) {
                return;
            }

            this.hideLoading();
            activity.setup();
        }
    };

    window.sugarizerCompatibility = sugarizerCompatibility;
    sugarizerCompatibility.setup();

    return sugarizerCompatibility;
});
