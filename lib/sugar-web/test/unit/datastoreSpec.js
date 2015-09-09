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
