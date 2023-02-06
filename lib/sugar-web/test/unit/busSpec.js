define(["sugar-web/bus"], (bus) => {

    'use strict';

    describe("bus requests", () => {
        var client;

        function MockClient() {
            this.result = [];
            this.error = null;
        }

        MockClient.prototype.send = (data) => {
            var that = this;
            setTimeout(() => {
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

        MockClient.prototype.close = () => { };

        beforeEach(() => {
            client = new MockClient();
            bus.listen(client);
        });

        afterEach(() => {
            bus.close();
            client = null;
        });

        it("should receive a response", () => {
            var responseReceived;

            runs(() => {
                responseReceived = false;

                function onResponseReceived(error, result) {
                    expect(error).toBeNull();
                    expect(result).toEqual(["hello"]);
                    responseReceived = true;
                }

                client.result = ["hello"];

                bus.sendMessage("hello", [], onResponseReceived);
            });

            waitsFor(() => {
                return responseReceived;
            }, "a response should be received");
        });

        it("should receive an error", () => {
            var errorReceived;

            runs(() => {
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

            waitsFor(() => {
                return errorReceived;
            }, "an error should be received");
        });

    });

    describe("bus notifications", () => {
        var client;

        function MockClient() {
            this.params = null;
        }

        MockClient.prototype.send_notification = (method, params) => {
            var that = this;

            setTimeout(() => {
                var message = {
                    data: JSON.stringify({
                        method: method,
                        params: that.params
                    })
                };

                that.onMessage(message);
            }, 0);
        };

        MockClient.prototype.close = () => { };

        beforeEach(() => {
            client = new MockClient();
            bus.listen(client);
        });

        afterEach(() => {
            bus.close();
            client = null;
        });

        it("should receive a notification", () => {
            var notificationReceived;
            var notificationParams;
            var originalParams = {
                param1: true,
                param2: "foo"
            };

            runs(() => {
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

            waitsFor(() => {
                return notificationReceived;
            }, "a notification should be received");

            runs(() => {
                expect(notificationParams).toEqual(originalParams);
            });
        });
    });
});
