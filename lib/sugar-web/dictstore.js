define(["sugar-web/activity/activity", "sugar-web/env"], function (activity, env) {

    'use strict';

    // This is a helper module that allows to persist key/value data
    // using the standard localStorage object.
    //
    // Usage:
    // ------
    //
    // // 1. Setup:
    //
    // dictstore.init(onReadyCallback);
    //
    // // 2. Use localStorage directly, and then call save():
    //
    // var value = localStorage['key'];
    // localStorage['key'] = newValue;
    // dictstore.save(onSavedCallback);
    //
    var dictstore = {};

    dictstore.init = function (callback) {

        if (env.isStandalone()) {
            // In standalone mode, use localStorage as is.
            callback();

        } else {
            // In Sugar, set localStorage from the datastore.
            localStorage.clear();

            var onLoaded = function (error, metadata, jsonData) {
                var data = JSON.parse(jsonData);
                for (var i in data) {
                    localStorage[i] = data[i];
                }

                callback();

            };
            activity.getDatastoreObject().loadAsText(onLoaded);
        }
    };

    // Internally, the key/values are stored as text in the Sugar
    // datastore, using the JSON format.
    dictstore.save = function (callback) {
        if (callback === undefined) {
            callback = function () {};
        }

        if (env.isStandalone()) {
            // In standalone mode, use localStorage as is.
            callback();
        } else {
            var datastoreObject = activity.getDatastoreObject();
            var jsonData = JSON.stringify(localStorage);
            datastoreObject.setDataAsText(jsonData);
            datastoreObject.save(function (error) {
                callback(error);
            });
        }
    };

    return dictstore;

});
