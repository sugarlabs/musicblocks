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

define(["sugar-web/dictstore", "sugar-web/env"], function (dictstore, env) {

    "use strict";

    describe("dictstore on standalone mode", function () {

        beforeEach(function () {
            spyOn(env, "isStandalone").andReturn(true);
        });

        describe("init method", function () {

            it("should execute callback", function () {
                var callback = jasmine.createSpy();

                dictstore.init(callback);
                expect(callback).toHaveBeenCalled();
            });

            it("should maintain localStorage", function () {
                localStorage.testKey = "test";

                dictstore.init(function () {});
                expect(localStorage.testKey).toBe("test");
            });
        });

        describe("save method", function () {

            it("should just execute the callback", function () {
                var callbackExecuted;

                localStorage.test_key = "test";

                runs(function () {
                    callbackExecuted = false;

                    dictstore.save(function () {
                        callbackExecuted = true;
                    });
                });

                waitsFor(function () {
                    return callbackExecuted === true;
                }, "The callback should executed");

                runs(function () {
                    expect(localStorage.test_key).toBe("test");
                });
            });
        });

    });
});
