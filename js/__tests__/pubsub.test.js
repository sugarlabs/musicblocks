// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

"use strict";

const { PubSub, pubsub } = require("../pubsub.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBus() {
    return new PubSub();
}

// ---------------------------------------------------------------------------
// on() and emit()
// ---------------------------------------------------------------------------

describe("PubSub – on() and emit()", () => {
    test("listener registered with on() is called when the event is emitted", () => {
        const bus = makeBus();
        const fn = jest.fn();
        bus.on("test", fn);
        bus.emit("test");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test("emit() with no listeners does not throw", () => {
        const bus = makeBus();
        expect(() => bus.emit("nonexistent")).not.toThrow();
    });

    test("payload is forwarded to listener", () => {
        const bus = makeBus();
        const fn = jest.fn();
        bus.on("msg", fn);
        const payload = { value: 42 };
        bus.emit("msg", payload);
        expect(fn).toHaveBeenCalledWith(payload);
    });

    test("payload is undefined when not provided", () => {
        const bus = makeBus();
        const fn = jest.fn();
        bus.on("msg", fn);
        bus.emit("msg");
        expect(fn).toHaveBeenCalledWith(undefined);
    });
});

// ---------------------------------------------------------------------------
// Multiple listeners
// ---------------------------------------------------------------------------

describe("PubSub – multiple listeners", () => {
    test("all registered listeners are called for the same event", () => {
        const bus = makeBus();
        const fn1 = jest.fn();
        const fn2 = jest.fn();
        const fn3 = jest.fn();
        bus.on("ev", fn1);
        bus.on("ev", fn2);
        bus.on("ev", fn3);
        bus.emit("ev");
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
        expect(fn3).toHaveBeenCalledTimes(1);
    });

    test("listeners for different events are isolated", () => {
        const bus = makeBus();
        const fn1 = jest.fn();
        const fn2 = jest.fn();
        bus.on("ev1", fn1);
        bus.on("ev2", fn2);
        bus.emit("ev1");
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).not.toHaveBeenCalled();
    });

    test("same listener registered twice is called twice", () => {
        const bus = makeBus();
        const fn = jest.fn();
        bus.on("ev", fn);
        bus.on("ev", fn);
        bus.emit("ev");
        expect(fn).toHaveBeenCalledTimes(2);
    });
});

// ---------------------------------------------------------------------------
// Ordering
// ---------------------------------------------------------------------------

describe("PubSub – listener ordering", () => {
    test("listeners are called in registration order", () => {
        const bus = makeBus();
        const order = [];
        bus.on("ev", () => order.push(1));
        bus.on("ev", () => order.push(2));
        bus.on("ev", () => order.push(3));
        bus.emit("ev");
        expect(order).toEqual([1, 2, 3]);
    });
});

// ---------------------------------------------------------------------------
// off()
// ---------------------------------------------------------------------------

describe("PubSub – off()", () => {
    test("removed listener is not called after off()", () => {
        const bus = makeBus();
        const fn = jest.fn();
        bus.on("ev", fn);
        bus.off("ev", fn);
        bus.emit("ev");
        expect(fn).not.toHaveBeenCalled();
    });

    test("off() with a listener that was never registered does not throw", () => {
        const bus = makeBus();
        expect(() => bus.off("ev", jest.fn())).not.toThrow();
    });

    test("off() for an event with no listeners does not throw", () => {
        const bus = makeBus();
        expect(() => bus.off("nonexistent", jest.fn())).not.toThrow();
    });

    test("off() only removes the specific listener instance, leaving others intact", () => {
        const bus = makeBus();
        const fn1 = jest.fn();
        const fn2 = jest.fn();
        bus.on("ev", fn1);
        bus.on("ev", fn2);
        bus.off("ev", fn1);
        bus.emit("ev");
        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).toHaveBeenCalledTimes(1);
    });

    test("off() removes only the first occurrence when a listener appears multiple times", () => {
        const bus = makeBus();
        const fn = jest.fn();
        bus.on("ev", fn);
        bus.on("ev", fn);
        bus.off("ev", fn);
        bus.emit("ev");
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// once()
// ---------------------------------------------------------------------------

describe("PubSub – once()", () => {
    test("once() listener fires only on the first emit", () => {
        const bus = makeBus();
        const fn = jest.fn();
        bus.once("ev", fn);
        bus.emit("ev");
        bus.emit("ev");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test("once() forwards the payload correctly", () => {
        const bus = makeBus();
        const fn = jest.fn();
        bus.once("ev", fn);
        bus.emit("ev", { x: 1 });
        expect(fn).toHaveBeenCalledWith({ x: 1 });
    });

    test("once() does not interfere with persistent on() listeners", () => {
        const bus = makeBus();
        const persistent = jest.fn();
        const single = jest.fn();
        bus.on("ev", persistent);
        bus.once("ev", single);
        bus.emit("ev");
        bus.emit("ev");
        expect(persistent).toHaveBeenCalledTimes(2);
        expect(single).toHaveBeenCalledTimes(1);
    });

    test("once() listener can be removed via off() before it fires", () => {
        const bus = makeBus();
        const fn = jest.fn();
        bus.once("ev", fn);
        const wrappers = bus._listeners["ev"];
        expect(wrappers).toHaveLength(1);
        bus.off("ev", wrappers[0]);
        bus.emit("ev");
        expect(fn).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// clear()
// ---------------------------------------------------------------------------

describe("PubSub – clear()", () => {
    test("clear(eventName) removes all listeners for that event", () => {
        const bus = makeBus();
        const fn = jest.fn();
        bus.on("ev", fn);
        bus.clear("ev");
        bus.emit("ev");
        expect(fn).not.toHaveBeenCalled();
    });

    test("clear() with no argument removes all listeners for all events", () => {
        const bus = makeBus();
        const fn1 = jest.fn();
        const fn2 = jest.fn();
        bus.on("ev1", fn1);
        bus.on("ev2", fn2);
        bus.clear();
        bus.emit("ev1");
        bus.emit("ev2");
        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).not.toHaveBeenCalled();
    });

    test("clear(eventName) does not affect listeners on other events", () => {
        const bus = makeBus();
        const fn1 = jest.fn();
        const fn2 = jest.fn();
        bus.on("ev1", fn1);
        bus.on("ev2", fn2);
        bus.clear("ev1");
        bus.emit("ev1");
        bus.emit("ev2");
        expect(fn1).not.toHaveBeenCalled();
        expect(fn2).toHaveBeenCalledTimes(1);
    });

    test("clear() for an unknown event does not throw", () => {
        const bus = makeBus();
        expect(() => bus.clear("nonexistent")).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// Nested emit()
// ---------------------------------------------------------------------------

describe("PubSub – nested emit()", () => {
    test("a listener can emit another event synchronously", () => {
        const bus = makeBus();
        const inner = jest.fn();
        bus.on("outer", () => bus.emit("inner"));
        bus.on("inner", inner);
        bus.emit("outer");
        expect(inner).toHaveBeenCalledTimes(1);
    });

    test("a listener added during emit is not called in the same dispatch cycle", () => {
        const bus = makeBus();
        const lateListener = jest.fn();
        bus.on("ev", () => bus.on("ev", lateListener));
        bus.emit("ev");
        expect(lateListener).not.toHaveBeenCalled();
        bus.emit("ev");
        expect(lateListener).toHaveBeenCalledTimes(1);
    });

    test("a listener removed during emit is still called in the current cycle but not the next", () => {
        // emit() snapshots the listener list before dispatch, so fn2 was already captured
        // and fires once even though fn1 removes it mid-cycle.
        const bus = makeBus();
        const fn2 = jest.fn();
        const fn1 = jest.fn(() => bus.off("ev", fn2));
        bus.on("ev", fn1);
        bus.on("ev", fn2);
        bus.emit("ev");
        expect(fn2).toHaveBeenCalledTimes(1);
        bus.emit("ev");
        expect(fn2).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// Listener exceptions
// ---------------------------------------------------------------------------

describe("PubSub – listener exceptions", () => {
    test("an exception thrown by a listener propagates to the emit() caller", () => {
        const bus = makeBus();
        bus.on("ev", () => {
            throw new Error("boom");
        });
        expect(() => bus.emit("ev")).toThrow("boom");
    });
});

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

describe("PubSub – module exports", () => {
    test("exports the PubSub class", () => {
        expect(typeof PubSub).toBe("function");
    });

    test("exports a default singleton pubsub instance", () => {
        expect(pubsub).toBeInstanceOf(PubSub);
    });

    test("new PubSub() instances are independent", () => {
        const a = new PubSub();
        const b = new PubSub();
        const fn = jest.fn();
        a.on("ev", fn);
        b.emit("ev");
        expect(fn).not.toHaveBeenCalled();
    });
});
