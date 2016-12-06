define(["sugar-web/bus"], function (bus) {

    'use strict';

    describe("bus requests", function () {
        var client;

        function MockClient() {
            this.result = [];
            this.error = null;
        }

        MockClient.prototype.send = function (data) {
            var that = this;
            setTimeout(function () {
                var parsed = JSON.parse(data);

                var message = {
                    data: JSON.stringify({
                        result: that.result,
                        error: that.error,
                        id: parsed.id
                    })
                };

                that.onMessage(message);
            }, 0);
        };

        MockClient.prototype.close = function () {};

        beforeEach(function () {
            client = new MockClient();
            bus.listen(client);
        });

        afterEach(function () {
            bus.close();
            client = null;
        });

        it("should receive a response", function () {
            var responseReceived;

            runs(function () {
                responseReceived = false;

                function onResponseReceived(error, result) {
                    expect(error).toBeNull();
                    expect(result).toEqual(["hello"]);
                    responseReceived = true;
                }

                client.result = ["hello"];

                bus.sendMessage("hello", [], onResponseReceived);
            });

            waitsFor(function () {
                return responseReceived;
            }, "a response should be received");
        });

        it("should receive an error", function () {
            var errorReceived;

            runs(function () {
                errorReceived = false;

                function onResponseReceived(error, result) {
                    expect(error).toEqual(jasmine.any(Error));
                    expect(result).toBeNull();

                    errorReceived = true;
                }

                client.result = null;
                client.error = new Error("error");

                bus.sendMessage("hello", [], onResponseReceived);
            });

            waitsFor(function () {
                return errorReceived;
            }, "an error should be received");
        });

    });

    describe("bus notifications", function () {
        var client;

        function MockClient() {
            this.params = null;
        }

        MockClient.prototype.send_notification = function (method, params) {
            var that = this;

            setTimeout(function () {
                var message = {
                    data: JSON.stringify({
                        method: method,
                        params: that.params
                    })
                };

                that.onMessage(message);
            }, 0);
        };

        MockClient.prototype.close = function () {};

        beforeEach(function () {
            client = new MockClient();
            bus.listen(client);
        });

        afterEach(function () {
            bus.close();
            client = null;
        });

        it("should receive a notification", function () {
            var notificationReceived;
            var notificationParams;
            var originalParams = {
                param1: true,
                param2: "foo"
            };

            runs(function () {
                notificationReceived = false;
                notificationParams = null;

                function onNotificationReceived(params) {
                    notificationReceived = true;
                    notificationParams = params;
                }

                bus.onNotification("hey.there", onNotificationReceived);

                client.params = originalParams;
                client.send_notification("hey.there");
            });

            waitsFor(function () {
                return notificationReceived;
            }, "a notification should be received");

            runs(function () {
                expect(notificationParams).toEqual(originalParams);
            });
        });
    });
});
