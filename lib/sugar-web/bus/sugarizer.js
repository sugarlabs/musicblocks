define(["sugar-web/env"], (env) => {

    'use strict';

    var bus = {};

    function WebSocketClient(environment) {
    }

    WebSocketClient.prototype.send = (data) => {
    };

    WebSocketClient.prototype.close = () => {
    };

    function InputStream() {
    }

    InputStream.prototype.open = (callback) => {
    };

    InputStream.prototype.read = (count, callback) => {
    };

    InputStream.prototype.gotData = (buffer) => {
    };

    InputStream.prototype.close = (callback) => {
    };

    function OutputStream() {
    }

    OutputStream.prototype.open = (callback) => {
    };

    OutputStream.prototype.write = (data) => {
    };

    OutputStream.prototype.close = (callback) => {
    };

    bus.createInputStream = (callback) => {
    };

    bus.createOutputStream = (callback) => {
    };

    bus.sendMessage = (method, params, callback) => {
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

    bus.onNotification = (method, callback) => {
    };

    bus.sendBinary = (buffer, callback) => {
    };

    bus.listen = (customClient) => {
    };

    bus.close = () => {
    };

    return bus;
});
