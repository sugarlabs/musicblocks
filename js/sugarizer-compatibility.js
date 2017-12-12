define(["sugar-web/env", "sugar-web/activity/activity", "sugar-web/datastore"], function (env, activity, datastore) {

    var sugarizerCompatibility = {
        activity: activity,
        data: {allProjects: "[]"},
        env: env,
        xoColor: {
            stroke: "#00A0FF",
            fill: "#8BFF7A"
        },

        saveLocally: function (callback) {
            var t = this;
            activity.getDatastoreObject().setDataAsText(JSON.stringify(t.data));
            activity.getDatastoreObject().save(function () {
                if (callback) {
                    callback();
                }
            });
        },

        isInsideSugarizer: function () {
            return env.isSugarizer();
        },

        loadData: function (callback) {
            var t = this;
            activity.getDatastoreObject().loadAsText(function (error, metadata, jsonData) {
                if (jsonData !== undefined && jsonData !== null) {
                    t.data = JSON.parse(jsonData);
                }
                if (metadata.buddy_color) {
                    t.xoColor = metadata.buddy_color;
                }
                if (callback !== undefined) {
                    callback();
                }
            });
        },

        hideLoading: function () {
            var imageLoading = document.getElementById("loading-image-container");
            imageLoading.style.display = "none";
        },

        sugarizerStop: function () {
            document.getElementById("stop-button").click();
        },

        getLanguage: function () {
            var defaultSettings = {
                name: "",
                language: (typeof chrome != 'undefined' && chrome.app && chrome.app.runtime) ? chrome.i18n.getUILanguage() : navigator.language
            };

            if (!env.isSugarizer()) {
                callback();
                return defaultSettings.language;
            }

	    var loadedSettings = datastore.localStorage.getValue('sugar_settings');
            return loadedSettings.language;
	},

        setup: function () {
            console.log('insideSugarizer? ' + this.isInsideSugarizer());
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
