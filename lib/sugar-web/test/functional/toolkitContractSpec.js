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
