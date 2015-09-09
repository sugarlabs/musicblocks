define(function () {

    'use strict';

    var icon = {};

    function changeColors(iconData, fillColor, strokeColor) {
        var re;

        if (fillColor) {
            re = /(<!ENTITY fill_color ")(.*)(">)/;
            iconData = iconData.replace(re, "$1" + fillColor + "$3");
        }

        if (strokeColor) {
            re = /(<!ENTITY stroke_color ")(.*)(">)/;
            iconData = iconData.replace(re, "$1" + strokeColor + "$3");
        }

        return iconData;
    }

    icon.load = function (iconInfo, callback) {
        var source;
        var dataHeader = "data:image/svg+xml,";

        if ("uri" in iconInfo) {
            source = iconInfo.uri;
        } else if ("name" in iconInfo) {
            source = "lib/graphics/icons/" + iconInfo.name + ".svg";
        }

        var fillColor = iconInfo.fillColor;
        var strokeColor = iconInfo.strokeColor;

        // If source is already a data uri, read it instead of doing
        // the XMLHttpRequest
        if (source.substring(0, 4) == 'data') {
            var iconData = unescape(source.slice(dataHeader.length));
            var newData = changeColors(iconData, fillColor, strokeColor);
            callback(dataHeader + escape(newData));
            return;
        }

        var client = new XMLHttpRequest();

        client.onload = function () {
            var iconData = this.responseText;
            var newData = changeColors(iconData, fillColor, strokeColor);
            callback(dataHeader + escape(newData));
        };

        client.open("GET", source);
        client.send();
    };

    function getBackgroundURL(elem) {
        var style = elem.currentStyle || window.getComputedStyle(elem, '');
        // Remove prefix 'url(' and suffix ')' before return
        var res = style.backgroundImage.slice(4, -1);
		var last = res.length-1;
		if (res[0] == '"' && res[last] == '"') {
			res = res.slice(1, last);
		}
		return res;
    }

    function setBackgroundURL(elem, url) {
        elem.style.backgroundImage = "url('" + url + "')";
    }

    icon.colorize = function (elem, colors, callback) {
        var iconInfo = {
            "uri": getBackgroundURL(elem),
            "strokeColor": colors.stroke,
            "fillColor": colors.fill
        };

        icon.load(iconInfo, function (url) {
            setBackgroundURL(elem, url);
            if (callback) {
                callback();
            }
        });

    };

    return icon;
});
