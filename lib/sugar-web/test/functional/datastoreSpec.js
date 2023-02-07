define(["sugar-web/bus", "sugar-web/env", "sugar-web/datastore"], (bus, env, datastore) => {

    'use strict';

    var defaultTimeoutInterval = jasmine.getEnv().defaultTimeoutInterval;

    describe("datastore object", () => {

        beforeEach(() => {
            // FIXME: due to db initialization,
            // the very first save() call may take a while
            jasmine.getEnv().defaultTimeoutInterval = 10000;
            spyOn(env, 'isStandalone').andReturn(false);
            bus.listen();
        });

        afterEach(() => {
            jasmine.getEnv().defaultTimeoutInterval = defaultTimeoutInterval;
            bus.close();
        });

        it("should be able to set and get metadata", () => {
            var saved;
            var gotMetadata;
            var datastoreObject;
            var objectId;
            var testTitle = "hello";

            runs(() => {
                saved = false;

                datastoreObject = new datastore.DatastoreObject();
                datastoreObject.setMetadata({
                    title: testTitle
                });

                datastoreObject.save(() => {
                    saved = true;
                    objectId = datastoreObject.objectId;
                });
            });

            waitsFor(() => {
                return saved;
            }, "should have saved the object");

            runs(() => {
                gotMetadata = false;

                datastoreObject = new datastore.DatastoreObject(objectId);
                datastoreObject.getMetadata((error, metadata) => {
                    expect(metadata.title).toEqual(testTitle);
                    gotMetadata = true;
                });
            });

            waitsFor(() => {
                return gotMetadata;
            }, "should have got the object metadata");
        });

        it("should be able to save and load text", () => {
            var saved;
            var gotMetadata;
            var datastoreObject;
            var objectId;
            var testText = "hello";

            runs(() => {
                saved = false;

                datastoreObject = new datastore.DatastoreObject();
                datastoreObject.setDataAsText(testText);

                datastoreObject.save(() => {
                    saved = true;
                    objectId = datastoreObject.objectId;
                });
            });

            waitsFor(() => {
                return saved;
            }, "should have saved the object");

            runs(() => {
                gotMetadata = false;

                function onLoaded(error, metadata, text) {
                    expect(text).toEqual(testText);
                    gotMetadata = true;
                }

                datastoreObject = new datastore.DatastoreObject(objectId);
                datastoreObject.loadAsText(onLoaded);
            });

            waitsFor(() => {
                return gotMetadata;
            }, "should have got the object metadata");
        });

    });

    describe("datastore", () => {

        beforeEach(() => {
            // FIXME: due to db initialization,
            // the very first save() call may take a while
            jasmine.getEnv().defaultTimeoutInterval = 10000;
            spyOn(env, 'isStandalone').andReturn(false);
            bus.listen();
        });

        afterEach(() => {
            jasmine.getEnv().defaultTimeoutInterval = defaultTimeoutInterval;
            bus.close();
        });

        it("should be able to create an object", () => {
            var wasCreated;

            runs(() => {
                wasCreated = false;

                function onCreated(error, objectId) {
                    expect(objectId).toEqual(jasmine.any(String));
                    wasCreated = true;
                }

                datastore.create({}, onCreated);
            });

            waitsFor(() => {
                return wasCreated;
            }, "the object should be created");
        });

        it("should be able to set object metadata", () => {
            var metadataSet;
            var gotMetadata;
            var objectId;
            var testTitle = "hello";

            runs(() => {
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

            waitsFor(() => {
                return metadataSet;
            }, "metadata should be set");

            runs(() => {
                function onGotMetadata(error, metadata) {
                    expect(metadata.title).toEqual(testTitle);
                    gotMetadata = true;
                }

                gotMetadata = false;

                datastore.getMetadata(objectId, onGotMetadata);
            });

            waitsFor(() => {
                return gotMetadata;
            }, "should have got object metadata");
        });

        it("should be able to get object metadata", () => {
            var gotMetadata = false;
            var testTitle = "hello";

            runs(() => {
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

            waitsFor(() => {
                return gotMetadata;
            }, "should have got object metadata");
        });

        it("should be able to load an object", () => {
            var wasLoaded = false;
            var objectId = null;
            var inputStream = null;
            var objectData = null;
            var testData = new Uint8Array([1, 2, 3, 4]);

            runs(() => {
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

            waitsFor(() => {
                return wasLoaded;
            }, "the object should be loaded");
        });
    });
});
