/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2015 Walter Bender
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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