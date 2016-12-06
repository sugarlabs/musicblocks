define(["sugar-web/env"], function (env) {

    'use strict';

    describe("getObjectId", function () {

        it("should return objectId from the sugar's environment", function () {
            var environment = {
                objectId: "objectId"
            };
            spyOn(env, "getEnvironment").andCallFake(function (callback) {
                setTimeout(function () {
                    callback(null, environment);
                }, 0);
            });
            var expected_objectId;

            runs(function () {
                env.getObjectId(function (objectId) {
                    expected_objectId = objectId;
                });
            });

            waitsFor(function () {
                return expected_objectId !== undefined;
            }, "should return objectId");
        });
    });

    describe("standalone mode", function () {

        it("should return true if in standalone mode", function () {
            var noWebActivityURLScheme = "http:";
            spyOn(env, 'getURLScheme').andReturn(noWebActivityURLScheme);

            var isStandaloneMode = env.isStandalone();
            expect(isStandaloneMode).toBe(true);
        });

        it("should return false if not in standalone mode", function () {
            var webActivityURLScheme = "activity:";
            spyOn(env, 'getURLScheme').andReturn(webActivityURLScheme);

            var isStandaloneMode = env.isStandalone();
            expect(isStandaloneMode).toBe(false);
        });
    });

    describe("getEnvironment", function () {
        var sugarOrig;

        beforeEach(function () {
            sugarOrig = JSON.parse(JSON.stringify(window.top.sugar));
        });

        afterEach(function () {
            window.top.sugar = sugarOrig;
        });

        describe("in sugar mode", function () {

            beforeEach(function () {
                spyOn(env, 'isStandalone').andReturn(false);
            });

            describe("when env was already set", function () {

                it("should run callback with null error and env", function () {
                    var environment = {};
                    window.top.sugar = {
                        environment: environment
                    };
                    var callback = jasmine.createSpy();

                    runs(function () {
                        env.getEnvironment(callback);
                    });

                    waitsFor(function () {
                        return callback.wasCalled;
                    }, "callback should be executed");

                    runs(function () {
                        expect(callback).toHaveBeenCalledWith(
                            null, environment);
                    });
                });
            });

            describe("when env was not set, yet", function () {

                beforeEach(function () {
                    window.top.sugar = undefined;
                });

                it("should set onEnvironmentSet handler", function () {
                    var sugar;
                    env.getEnvironment(function () {});
                    sugar = window.top.sugar;
                    expect(sugar.onEnvironmentSet).not.toBeUndefined();
                });

                it("should run callback on EnvironmentSet event", function () {
                    var callback = jasmine.createSpy();
                    var expectedEnv = "env";

                    env.getEnvironment(callback);
                    window.top.sugar.environment = expectedEnv;
                    window.top.sugar.onEnvironmentSet();

                    expect(callback).toHaveBeenCalledWith(null, expectedEnv);
                });
            });
        });

        it("should return {} in standalone mode", function () {
            window.top.sugar = undefined;
            spyOn(env, 'isStandalone').andReturn(true);
            var actualEnv;

            runs(function () {
                env.getEnvironment(function (error, environment) {
                    actualEnv = environment;
                });
            });

            waitsFor(function () {
                return actualEnv !== undefined;
            }, "environment not to be undefined");

            runs(function () {
                expect(actualEnv).toEqual({});
            });

        });
    });
});
