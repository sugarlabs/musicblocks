/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2015  Walter Bender
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

define(["sugar-web/env", "sugar-web/datastore"], function (env, datastore) {

    'use strict';

    describe("Ensure the datastore object has an objectId", function () {

        // FIXME does not work in standalone mode
        it("should have objectId", function () {
            var objectId = "objectId";
            spyOn(env, "getObjectId").andCallFake(function (callback) {
                setTimeout(function () {
                    callback(objectId);
                }, 0);
            });
            var callback = jasmine.createSpy();

            var datastoreObject = new datastore.DatastoreObject();

            runs(function () {
                datastoreObject.ensureObjectId(callback);
            });

            waitsFor(function () {
                return datastoreObject.objectId !== undefined;
            }, "should have objectId received from the environment");

            runs(function () {
                expect(callback).toHaveBeenCalled();
            });
        });
    });
});
