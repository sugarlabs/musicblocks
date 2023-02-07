define(["sugar-web/env"], (env)  =>{

    'use strict';

    describe("getObjectId", () => {

        it("should return objectId from the sugar's environment", () => {
            var environment = {
                objectId: "objectId"
            };
            spyOn(env, "getEnvironment").andCallFake((callback) => {
                setTimeout(() => {
                    callback(null, environment);
                }, 0);
            });
            var expected_objectId;

            runs(() => {
                env.getObjectId((objectId) => {
                    expected_objectId = objectId;
                });
            });

            waitsFor(() => {
                return expected_objectId !== undefined;
            }, "should return objectId");
        });
    });

    describe("standalone mode", () => {

        it("should return true if in standalone mode", () => {
            var noWebActivityURLScheme = "http:";
            spyOn(env, 'getURLScheme').andReturn(noWebActivityURLScheme);

            var isStandaloneMode = env.isStandalone();
            expect(isStandaloneMode).toBe(true);
        });

        it("should return false if not in standalone mode", () => {
            var webActivityURLScheme = "activity:";
            spyOn(env, 'getURLScheme').andReturn(webActivityURLScheme);

            var isStandaloneMode = env.isStandalone();
            expect(isStandaloneMode).toBe(false);
        });
    });

    describe("getEnvironment", () => {
        var sugarOrig;

        beforeEach(() => {
            sugarOrig = JSON.parse(JSON.stringify(window.top.sugar));
        });

        afterEach(() => {
            window.top.sugar = sugarOrig;
        });

        describe("in sugar mode", () => {

            beforeEach(() => {
                spyOn(env, 'isStandalone').andReturn(false);
            });

            describe("when env was already set", () => {

                it("should run callback with null error and env", () => {
                    var environment = {};
                    window.top.sugar = {
                        environment: environment
                    };
                    var callback = jasmine.createSpy();

                    runs(() => {
                        env.getEnvironment(callback);
                    });

                    waitsFor(() => {
                        return callback.wasCalled;
                    }, "callback should be executed");

                    runs(() => {
                        expect(callback).toHaveBeenCalledWith(
                            null, environment);
                    });
                });
            });

            describe("when env was not set, yet", () => {

                beforeEach(() => {
                    window.top.sugar = undefined;
                });

                it("should set onEnvironmentSet handler", () => {
                    var sugar;
                    env.getEnvironment(() => { });
                    sugar = window.top.sugar;
                    expect(sugar.onEnvironmentSet).not.toBeUndefined();
                });

                it("should run callback on EnvironmentSet event", () => {
                    var callback = jasmine.createSpy();
                    var expectedEnv = "env";

                    env.getEnvironment(callback);
                    window.top.sugar.environment = expectedEnv;
                    window.top.sugar.onEnvironmentSet();

                    expect(callback).toHaveBeenCalledWith(null, expectedEnv);
                });
            });
        });

        it("should return {} in standalone mode", () => {
            window.top.sugar = undefined;
            spyOn(env, 'isStandalone').andReturn(true);
            var actualEnv;

            runs(() => {
                env.getEnvironment((error, environment) => {
                    actualEnv = environment;
                });
            });

            waitsFor(() => {
                return actualEnv !== undefined;
            }, "environment not to be undefined");

            runs(() => {
                expect(actualEnv).toEqual({});
            });

        });
    });
});
