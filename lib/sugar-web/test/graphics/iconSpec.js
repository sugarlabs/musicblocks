define(["sugar-web/graphics/icon"], (icon) => {

    'use strict';

    describe("icon", () => {
        var wasLoaded;
        var iconUrlResult;

        it("should be able to change icon more than once", () => {
            var elem = document.createElement('div');
            var iconUrl;

            function callback(url) {
                iconUrlResult = url;
                wasLoaded = true;
            }

            runs(() => {
                wasLoaded = false;
                iconUrl = "/base/graphics/icons/actions/dialog-ok-active.svg";
                var iconInfo = {
                    "uri": iconUrl,
                    "strokeColor": '#B20008',
                    "fillColor": '#FF2B34'
                };
                icon.load(iconInfo, callback);
            });

            waitsFor(() => {
                return wasLoaded;
            }, "icon loaded");

            runs(() => {
                expect(iconUrlResult).not.toBe(iconUrl);
            });

            runs(() => {
                wasLoaded = false;
                iconUrl = iconUrlResult;
                var iconInfo = {
                    "uri": iconUrl,
                    "strokeColor": '#FF2B34',
                    "fillColor": '#B20008'
                };
                icon.load(iconInfo, callback);
            });

            waitsFor(() => {
                return wasLoaded;
            }, "icon loaded");

            runs(() => {
                expect(iconUrlResult).not.toBe(iconUrl);
            });

        });
    });

});
