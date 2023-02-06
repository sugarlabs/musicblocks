define(["sugar-web/dictstore", "sugar-web/env"], (dictstore, env) => {

    'use strict';

    describe("dictstore on standalone mode", () => {

        beforeEach(() => {
            spyOn(env, 'isStandalone').andReturn(true);
        });

        describe("init method", () => {

            it("should execute callback", () => {
                var callback = jasmine.createSpy();

                dictstore.init(callback);
                expect(callback).toHaveBeenCalled();
            });

            it("should maintain localStorage", () => {
                localStorage.testKey = "test";

                dictstore.init(() => { });
                expect(localStorage.testKey).toBe("test");
            });
        });

        describe("save method", () => {

            it("should just execute the callback", () => {
                var callbackExecuted;

                localStorage.test_key = "test";

                runs(() => {
                    callbackExecuted = false;

                    dictstore.save(() => {
                        callbackExecuted = true;
                    });
                });

                waitsFor(() => {
                    return callbackExecuted === true;
                }, "The callback should executed");

                runs(() => {
                    expect(localStorage.test_key).toBe("test");
                });
            });
        });

    });
});
