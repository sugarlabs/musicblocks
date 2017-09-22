define(["sugar-web/env", "sugar-web/activity/activity"], function (env, activity) {

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
