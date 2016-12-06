define(["sugar-web/graphics/icon"], function (icon) {

    'use strict';

    describe("icon", function () {
        var wasLoaded;
        var iconUrlResult;

        it("should be able to change icon more than once", function () {
            var elem = document.createElement('div');
            var iconUrl;

            function callback(url) {
                iconUrlResult = url;
                wasLoaded = true;
            }

            runs(function () {
                wasLoaded = false;
                iconUrl = "/base/graphics/icons/actions/dialog-ok-active.svg";
                var iconInfo = {
                    "uri": iconUrl,
                    "strokeColor": '#B20008',
                    "fillColor": '#FF2B34'
                };
                icon.load(iconInfo, callback);
            });

            waitsFor(function () {
                return wasLoaded;
            }, "icon loaded");

            runs(function () {
                expect(iconUrlResult).not.toBe(iconUrl);
            });

            runs(function () {
                wasLoaded = false;
                iconUrl = iconUrlResult;
                var iconInfo = {
                    "uri": iconUrl,
                    "strokeColor": '#FF2B34',
                    "fillColor": '#B20008'
                };
                icon.load(iconInfo, callback);
            });

            waitsFor(function () {
                return wasLoaded;
            }, "icon loaded");

            runs(function () {
                expect(iconUrlResult).not.toBe(iconUrl);
            });

        });
    });

});
