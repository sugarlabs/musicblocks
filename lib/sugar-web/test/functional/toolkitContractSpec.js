define(["sugar-web/env"], function (env) {

    'use strict';

    describe("Environment object", function () {

        it("should have valid properties", function () {
            //FIXME: we shouldn't stub this here.
            //current implementation of isStandalone fails with sugar-web-test
            spyOn(env, 'isStandalone').andReturn(false);

            var expectedEnv;

            runs(function () {
                env.getEnvironment(function (error, environment) {
                    expectedEnv = environment;
                });
            });

            waitsFor(function () {
                return expectedEnv !== undefined;
            }, "should get sugar environment");

            runs(function () {
                expect(expectedEnv.bundleId).not.toBeUndefined();
                expect(expectedEnv.activityId).not.toBeUndefined();
                expect(expectedEnv.activityName).not.toBeUndefined();
            });
        });
    });
});
