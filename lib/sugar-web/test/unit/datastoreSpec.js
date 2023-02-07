define(["sugar-web/env", "sugar-web/datastore"], (env, datastore) => {

    'use strict';

    describe("Ensure the datastore object has an objectId", () => {

        // FIXME does not work in standalone mode
        it("should have objectId", () => {
            var objectId = "objectId";
            spyOn(env, "getObjectId").andCallFake((callback) => {
                setTimeout(() => {
                    callback(objectId);
                }, 0);
            });
            var callback = jasmine.createSpy();

            var datastoreObject = new datastore.DatastoreObject();

            runs(() => {
                datastoreObject.ensureObjectId(callback);
            });

            waitsFor(() => {
                return datastoreObject.objectId !== undefined;
            }, "should have objectId received from the environment");

            runs(() => {
                expect(callback).toHaveBeenCalled();
            });
        });
    });
});
