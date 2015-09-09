define(["sugar-web/env"], function (env) {

    'use strict';

    var bus = {};

    function WebSocketClient(environment) {
    }

    WebSocketClient.prototype.send = function (data) {
    };

    WebSocketClient.prototype.close = function () {
    };

    function InputStream() {
    }

    InputStream.prototype.open = function (callback) {
    };

    InputStream.prototype.read = function (count, callback) {
    };

    InputStream.prototype.gotData = function (buffer) {
    };

    InputStream.prototype.close = function (callback) {
    };

    function OutputStream() {
    }

    OutputStream.prototype.open = function (callback) {
    };

    OutputStream.prototype.write = function (data) {
    };

    OutputStream.prototype.close = function (callback) {
    };

    bus.createInputStream = function (callback) {
    };

    bus.createOutputStream = function (callback) {
    };

    bus.sendMessage = function (method, params, callback) {
        if (method == "activity.close") {
            window.location = "../../index.html";
        } else if (method == "activity.get_xo_color") {
            var color = {stroke: "#FF2B34", fill: "#005FE4"};
			if (typeof chrome != 'undefined'  && chrome.app && chrome.app.runtime) {
				 chrome.storage.local.get("sugar_settings", function(values) {
					color = JSON.parse(values.sugar_settings).colorvalue;
					callback(null, [[color.fill, color.stroke]]);
				});
			} else if (typeof(Storage)!=="undefined" && typeof(window.localStorage)!=="undefined") {
				try {
					 color = JSON.parse(window.localStorage.getItem("sugar_settings")).colorvalue;
				} catch(err) {}
			}
            callback(null, [[color.fill, color.stroke]]);
        }
        return;
    };

    bus.onNotification = function (method, callback) {
    };

    bus.sendBinary = function (buffer, callback) {
    };

    bus.listen = function (customClient) {
    };

    bus.close = function () {
    };

    return bus;
});
