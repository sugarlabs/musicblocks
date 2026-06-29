/**
 * Tests for PubSub-based playback event migration.
 *
 * Covers the finishedLoading channel that replaced the former
 * document.dispatchEvent / document.addEventListener pattern for
 * signalling execution completion after blocks finish loading.
 */

"use strict";

const { PubSub } = require("../pubsub");

describe("PubSub – playback execution events", () => {
    let pubsub;

    beforeEach(() => {
        pubsub = new PubSub();
    });

    afterEach(() => {
        pubsub.clear();
    });

    describe("emit finishedLoading", () => {
        it("notifies a registered listener when emitted", () => {
            const listener = jest.fn();
            pubsub.on("finishedLoading", listener);
            pubsub.emit("finishedLoading");
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("passes the payload to the listener", () => {
            const listener = jest.fn();
            pubsub.on("finishedLoading", listener);
            pubsub.emit("finishedLoading", { source: "blocks" });
            expect(listener).toHaveBeenCalledWith({ source: "blocks" });
        });

        it("notifies multiple listeners in registration order", () => {
            const order = [];
            pubsub.on("finishedLoading", () => order.push(1));
            pubsub.on("finishedLoading", () => order.push(2));
            pubsub.on("finishedLoading", () => order.push(3));
            pubsub.emit("finishedLoading");
            expect(order).toEqual([1, 2, 3]);
        });
    });

    describe("self-unsubscribing listener (once pattern)", () => {
        it("listener removes itself after the first finishedLoading event", () => {
            const listener = jest.fn();
            const wrapper = () => {
                pubsub.off("finishedLoading", wrapper);
                listener();
            };
            pubsub.on("finishedLoading", wrapper);

            pubsub.emit("finishedLoading");
            pubsub.emit("finishedLoading");

            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("remaining listeners still fire after one unsubscribes", () => {
            const persistent = jest.fn();
            const oneShot = jest.fn();

            const wrapper = () => {
                pubsub.off("finishedLoading", wrapper);
                oneShot();
            };
            pubsub.on("finishedLoading", wrapper);
            pubsub.on("finishedLoading", persistent);

            pubsub.emit("finishedLoading");
            pubsub.emit("finishedLoading");

            expect(oneShot).toHaveBeenCalledTimes(1);
            expect(persistent).toHaveBeenCalledTimes(2);
        });
    });

    describe("stop / execution-complete lifecycle", () => {
        it("listener registered before emit receives the event", () => {
            const onFinished = jest.fn();
            pubsub.on("finishedLoading", onFinished);
            pubsub.emit("finishedLoading");
            expect(onFinished).toHaveBeenCalledTimes(1);
        });

        it("off prevents listener from receiving subsequent emits", () => {
            const listener = jest.fn();
            pubsub.on("finishedLoading", listener);
            pubsub.emit("finishedLoading");
            pubsub.off("finishedLoading", listener);
            pubsub.emit("finishedLoading");
            expect(listener).toHaveBeenCalledTimes(1);
        });

        it("unrelated channels are not triggered", () => {
            const otherListener = jest.fn();
            pubsub.on("someOtherEvent", otherListener);
            pubsub.emit("finishedLoading");
            expect(otherListener).not.toHaveBeenCalled();
        });
    });

    describe("multiple independent listeners", () => {
        it("all listeners receive identical payload", () => {
            const payload = { step: "done" };
            const a = jest.fn();
            const b = jest.fn();
            const c = jest.fn();
            pubsub.on("finishedLoading", a);
            pubsub.on("finishedLoading", b);
            pubsub.on("finishedLoading", c);
            pubsub.emit("finishedLoading", payload);
            expect(a).toHaveBeenCalledWith(payload);
            expect(b).toHaveBeenCalledWith(payload);
            expect(c).toHaveBeenCalledWith(payload);
        });

        it("emitting with no listeners does not throw", () => {
            expect(() => pubsub.emit("finishedLoading")).not.toThrow();
        });
    });

    describe("ordering guarantee", () => {
        it("preserves strict FIFO notification order across multiple emits", () => {
            const calls = [];
            pubsub.on("finishedLoading", () => calls.push("first"));
            pubsub.on("finishedLoading", () => calls.push("second"));

            pubsub.emit("finishedLoading");
            pubsub.emit("finishedLoading");

            expect(calls).toEqual(["first", "second", "first", "second"]);
        });
    });
});
