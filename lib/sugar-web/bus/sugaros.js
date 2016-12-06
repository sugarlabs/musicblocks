define(["sugar-web/env"], function (env) {

    'use strict';

    var lastId = 0;
    var callbacks = {};
    var notificationCallbacks = {};
    var client = null;
    var inputStreams = [];

    function WebSocketClient(environment) {
        this.queue = [];
        this.socket = null;

        var that = this;

        env.getEnvironment(function (error, environment) {
            var port = environment.apiSocketPort;
            var socket = new WebSocket("ws://localhost:" + port);

            socket.binaryType = "arraybuffer";

            socket.onopen = function () {
                var params = [environment.activityId,
                              environment.apiSocketKey];

                socket.send(JSON.stringify({
                    "method": "authenticate",
                    "id": "authenticate",
                    "params": params
                }));

                while (that.queue.length > 0) {
                    socket.send(that.queue.shift());
                }
            };

            socket.onmessage = function (message) {
                that.onMessage(message);
            };

            that.socket = socket;
        });
    }

    WebSocketClient.prototype.send = function (data) {
        if (this.socket && this.socket.readyState == WebSocket.OPEN) {
            this.socket.send(data);
        } else {
            this.queue.push(data);
        }
    };

    WebSocketClient.prototype.close = function () {
        this.socket.close();
    };

    var bus = {};

    function InputStream() {
        this.streamId = null;
        this.readCallback = null;
    }

    InputStream.prototype.open = function (callback) {
        var that = this;
        bus.sendMessage("open_stream", [], function (error, result) {
            that.streamId = result[0];
            inputStreams[that.streamId] = that;
            callback(error);
        });
    };

    InputStream.prototype.read = function (count, callback) {
        if (this.readCallback) {
            throw new Error("Read already in progress");
        }

        this.readCallback = callback;

        var buffer = new ArrayBuffer(8);

        var headerView = new Uint8Array(buffer, 0, 1);
        headerView[0] = this.streamId;

        var bodyView = new Uint32Array(buffer, 4, 1);
        bodyView[0] = count;

        bus.sendBinary(buffer);
    };

    InputStream.prototype.gotData = function (buffer) {
        var callback = this.readCallback;

        this.readCallback = null;

        callback(null, buffer);
    };

    InputStream.prototype.close = function (callback) {
        var that = this;

        function onStreamClosed(error, result) {
            if (callback) {
                callback(error);
            }
            delete inputStreams[that.streamId];
        }

        bus.sendMessage("close_stream", [this.streamId], onStreamClosed);
    };

    function OutputStream() {
        this.streamId = null;
    }

    OutputStream.prototype.open = function (callback) {
        var that = this;
        bus.sendMessage("open_stream", [], function (error, result) {
            that.streamId = result[0];
            callback(error);
        });
    };

    OutputStream.prototype.write = function (data) {
        var buffer = new ArrayBuffer(data.byteLength + 1);

        var bufferView = new Uint8Array(buffer);
        bufferView[0] = this.streamId;
        bufferView.set(new Uint8Array(data), 1);

        bus.sendBinary(buffer);
    };

    OutputStream.prototype.close = function (callback) {
        bus.sendMessage("close_stream", [this.streamId], callback);
    };

    bus.createInputStream = function (callback) {
        return new InputStream();
    };

    bus.createOutputStream = function (callback) {
        return new OutputStream();
    };

    bus.sendMessage = function (method, params, callback) {
        var message = {
            "method": method,
            "id": lastId,
            "params": params,
            "jsonrpc": "2.0"
        };

        if (callback) {
            callbacks[lastId] = callback;
        }

        client.send(JSON.stringify(message));

        lastId++;
    };

    bus.onNotification = function (method, callback) {
        notificationCallbacks[method] = callback;
    };

    bus.sendBinary = function (buffer, callback) {
        client.send(buffer);
    };

    bus.listen = function (customClient) {
        if (customClient) {
            client = customClient;
        } else {
            client = new WebSocketClient();
        }

        client.onMessage = function (message) {
            if (typeof message.data != "string") {
                var dataView = new Uint8Array(message.data);
                var streamId = dataView[0];

                if (streamId in inputStreams) {
                    var inputStream = inputStreams[streamId];
                    inputStream.gotData(message.data.slice(1));
                }

                return;
            }

            var parsed = JSON.parse(message.data);
            var responseId = parsed.id;

            if (parsed.method) {
                var notificationCallback = notificationCallbacks[parsed.method];
                if (notificationCallback !== undefined) {
                    notificationCallback(parsed.params);
                }
                return;
            }

            if (responseId in callbacks) {
                var callback = callbacks[responseId];

                if (parsed.error === null) {
                    callback(null, parsed.result);
                } else {
                    callback(new Error(parsed.error), null);
                }

                delete callbacks[responseId];
            }
        };
    };

    bus.close = function () {
        client.close();
        client = null;
    };

    return bus;
});
