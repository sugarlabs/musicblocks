define(["sugar-web/env"], (env) => {

    'use strict';

    describe("Environment object", () => {

        it("should have valid properties", () => {
            //FIXME: we shouldn't stub this here.
            //current implementation of isStandalone fails with sugar-web-test
            spyOn(env, 'isStandalone').andReturn(false);

            var expectedEnv;

            runs(() => {
                env.getEnvironment((error, environment) => {
                    expectedEnv = environment;
                });
            });

            waitsFor(() => {
                return expectedEnv !== undefined;
            }, "should get sugar environment");

            runs(() => {
                expect(expectedEnv.bundleId).not.toBeUndefined();
                expect(expectedEnv.activityId).not.toBeUndefined();
                expect(expectedEnv.activityName).not.toBeUndefined();
            });
        });
    });
});
