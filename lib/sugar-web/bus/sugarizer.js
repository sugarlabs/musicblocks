/**
 * Module for handling WebSocket communication and message passing.
 * @module bus
 */
define(["sugar-web/env"], function (env) {

    'use strict';

    /**
     * Namespace for WebSocket and message passing functionality.
     * @namespace bus
     */
    var bus = {};

    /**
     * Constructs a WebSocket client.
     * @constructor
     * @param {object} environment - The environment settings.
     */
    function WebSocketClient(environment) {
    }

    /**
     * Sends data over the WebSocket connection.
     * @method
     * @param {*} data - The data to send.
     */
    WebSocketClient.prototype.send = function (data) {
    };

    /**
     * Closes the WebSocket connection.
     * @method
     */
    WebSocketClient.prototype.close = function () {
    };

    /**
     * Constructs an input stream.
     * @constructor
     */
    function InputStream() {
    }

    /**
     * Opens the input stream.
     * @method
     * @param {function} callback - The callback function to execute after opening.
     */
    InputStream.prototype.open = function (callback) {
    };

    /**
     * Reads data from the input stream.
     * @method
     * @param {number} count - The number of bytes to read.
     * @param {function} callback - The callback function to execute after reading.
     */
    InputStream.prototype.read = function (count, callback) {
    };

    /**
     * Handles incoming data from the input stream.
     * @method
     * @param {ArrayBuffer} buffer - The buffer containing the incoming data.
     */
    InputStream.prototype.gotData = function (buffer) {
    };

    /**
     * Closes the input stream.
     * @method
     * @param {function} callback - The callback function to execute after closing.
     */
    InputStream.prototype.close = function (callback) {
    };

    /**
     * Constructs an output stream.
     * @constructor
     */
    function OutputStream() {
    }

    /**
     * Opens the output stream.
     * @method
     * @param {function} callback - The callback function to execute after opening.
     */
    OutputStream.prototype.open = function (callback) {
    };

    /**
     * Writes data to the output stream.
     * @method
     * @param {*} data - The data to write.
     */
    OutputStream.prototype.write = function (data) {
    };

    /**
     * Closes the output stream.
     * @method
     * @param {function} callback - The callback function to execute after closing.
     */
    OutputStream.prototype.close = function (callback) {
    };

    /**
     * Creates an input stream.
     * @method
     * @param {function} callback - The callback function to execute after creation.
     */
    bus.createInputStream = function (callback) {
    };

    /**
     * Creates an output stream.
     * @method
     * @param {function} callback - The callback function to execute after creation.
     */
    bus.createOutputStream = function (callback) {
    };

    /**
     * Sends a message over the bus.
     * @method
     * @param {string} method - The method of the message.
     * @param {*} params - The parameters of the message.
     * @param {function} callback - The callback function to execute after sending the message.
     */
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

    /**
     * Listens for notifications on the bus.
     * @method
     * @param {string} method - The method to listen for.
     * @param {function} callback - The callback function to execute when a notification is received.
     */
    bus.onNotification = function (method, callback) {
    };

    /**
     * Sends binary data over the bus.
     * @method
     * @param {ArrayBuffer} buffer - The buffer containing the binary data.
     * @param {function} callback - The callback function to execute after sending the data.
     */
    bus.sendBinary = function (buffer, callback) {
    };

    /**
     * Listens for messages on the bus.
     * @method
     * @param {object} customClient - The custom client to use for listening.
     */
    bus.listen = function (customClient) {
    };

    /**
     * Closes the bus connection.
     * @method
     */
    bus.close = function () {
    };

    return bus;
});
