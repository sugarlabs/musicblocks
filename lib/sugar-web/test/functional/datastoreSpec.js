define(["sugar-web/bus", "sugar-web/env", "sugar-web/datastore"], function (bus, env, datastore) {

    'use strict';

    var defaultTimeoutInterval = jasmine.getEnv().defaultTimeoutInterval;

    describe("datastore object", function () {

        beforeEach(function () {
            // FIXME: due to db initialization,
            // the very first save() call may take a while
            jasmine.getEnv().defaultTimeoutInterval = 10000;
            spyOn(env, 'isStandalone').andReturn(false);
            bus.listen();
        });

        afterEach(function () {
            jasmine.getEnv().defaultTimeoutInterval = defaultTimeoutInterval;
            bus.close();
        });

        it("should be able to set and get metadata", function () {
            var saved;
            var gotMetadata;
            var datastoreObject;
            var objectId;
            var testTitle = "hello";

            runs(function () {
                saved = false;

                datastoreObject = new datastore.DatastoreObject();
                datastoreObject.setMetadata({
                    title: testTitle
                });

                datastoreObject.save(function () {
                    saved = true;
                    objectId = datastoreObject.objectId;
                });
            });

            waitsFor(function () {
                return saved;
            }, "should have saved the object");

            runs(function () {
                gotMetadata = false;

                datastoreObject = new datastore.DatastoreObject(objectId);
                datastoreObject.getMetadata(function (error, metadata) {
                    expect(metadata.title).toEqual(testTitle);
                    gotMetadata = true;
                });
            });

            waitsFor(function () {
                return gotMetadata;
            }, "should have got the object metadata");
        });

        it("should be able to save and load text", function () {
            var saved;
            var gotMetadata;
            var datastoreObject;
            var objectId;
            var testText = "hello";

            runs(function () {
                saved = false;

                datastoreObject = new datastore.DatastoreObject();
                datastoreObject.setDataAsText(testText);

                datastoreObject.save(function () {
                    saved = true;
                    objectId = datastoreObject.objectId;
                });
            });

            waitsFor(function () {
                return saved;
            }, "should have saved the object");

            runs(function () {
                gotMetadata = false;

                function onLoaded(error, metadata, text) {
                    expect(text).toEqual(testText);
                    gotMetadata = true;
                }

                datastoreObject = new datastore.DatastoreObject(objectId);
                datastoreObject.loadAsText(onLoaded);
            });

            waitsFor(function () {
                return gotMetadata;
            }, "should have got the object metadata");
        });

    });

    describe("datastore", function () {

        beforeEach(function () {
            // FIXME: due to db initialization,
            // the very first save() call may take a while
            jasmine.getEnv().defaultTimeoutInterval = 10000;
            spyOn(env, 'isStandalone').andReturn(false);
            bus.listen();
        });

        afterEach(function () {
            jasmine.getEnv().defaultTimeoutInterval = defaultTimeoutInterval;
            bus.close();
        });

        it("should be able to create an object", function () {
            var wasCreated;

            runs(function () {
                wasCreated = false;

                function onCreated(error, objectId) {
                    expect(objectId).toEqual(jasmine.any(String));
                    wasCreated = true;
                }

                datastore.create({}, onCreated);
            });

            waitsFor(function () {
                return wasCreated;
            }, "the object should be created");
        });

        it("should be able to set object metadata", function () {
            var metadataSet;
            var gotMetadata;
            var objectId;
            var testTitle = "hello";

            runs(function () {
                function onMetadataSet(error) {
                    expect(error).toBeNull();
                    metadataSet = true;
                }

                function onCreated(error, createdObjectId) {
                    objectId = createdObjectId;

                    var metadata = {
                        title: testTitle
                    };
                    datastore.setMetadata(objectId, metadata, onMetadataSet);
                }

                metadataSet = false;

                datastore.create({}, onCreated);
            });

            waitsFor(function () {
                return metadataSet;
            }, "metadata should be set");

            runs(function () {
                function onGotMetadata(error, metadata) {
                    expect(metadata.title).toEqual(testTitle);
                    gotMetadata = true;
                }

                gotMetadata = false;

                datastore.getMetadata(objectId, onGotMetadata);
            });

            waitsFor(function () {
                return gotMetadata;
            }, "should have got object metadata");
        });

        it("should be able to get object metadata", function () {
            var gotMetadata = false;
            var testTitle = "hello";

            runs(function () {
                function onGotMetadata(error, metadata) {
                    expect(metadata.title).toEqual(testTitle);
                    gotMetadata = true;
                }

                function onCreated(error, objectId) {
                    datastore.getMetadata(objectId, onGotMetadata);
                }

                datastore.create({
                    title: testTitle
                }, onCreated);
            });

            waitsFor(function () {
                return gotMetadata;
            }, "should have got object metadata");
        });

        it("should be able to load an object", function () {
            var wasLoaded = false;
            var objectId = null;
            var inputStream = null;
            var objectData = null;
            var testData = new Uint8Array([1, 2, 3, 4]);

            runs(function () {
                function onStreamClose(error) {
                    expect(objectData).toEqual(testData.buffer);
                    wasLoaded = true;
                }

                function onStreamRead(error, data) {
                    objectData = data;
                }

                function onLoaded(error, metadata, loadedInputStream) {
                    inputStream = loadedInputStream;
                    inputStream.read(8192, onStreamRead);
                    inputStream.close(onStreamClose);
                }

                function onClosed(error) {
                    datastore.load(objectId, onLoaded);
                }

                function onSaved(error, outputStream) {
                    outputStream.write(testData);
                    outputStream.close(onClosed);
                }

                function onCreated(error, createdObjectId) {
                    objectId = createdObjectId;
                    datastore.save(objectId, {}, onSaved);
                }

                datastore.create({}, onCreated);
            });

            waitsFor(function () {
                return wasLoaded;
            }, "the object should be loaded");
        });
    });
});
