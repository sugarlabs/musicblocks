/**
 * Fixture: a CommonJS module whose public surface is a single class, in the
 * style of js/js-export/. Exercises class + method extraction, constructor
 * parameters, static methods, accessors, `extends`, and branch/throw counting
 * inside methods. This file is only ever parsed by the extractor, never run.
 */

/**
 * Base class with shared behaviour.
 */
class Base {
    /**
     * @param {string} name - identifier for the instance.
     */
    constructor(name) {
        this.name = name;
    }

    describe() {
        return `base:${this.name}`;
    }
}

/**
 * A small counter built on top of {@link Base}.
 */
class Counter extends Base {
    /**
     * @param {string} name - identifier for the counter.
     * @param {number} start - initial value.
     * @param {number} step - increment applied by `tick`.
     */
    constructor(name, start = 0, step = 1) {
        super(name);
        this._value = start;
        this._step = step;
    }

    /**
     * @returns {number} the current value.
     */
    get value() {
        return this._value;
    }

    /**
     * @param {number} next - value to set.
     */
    set value(next) {
        if (typeof next !== "number") {
            throw new TypeError("value must be a number");
        }
        this._value = next;
    }

    /**
     * Advances the counter, optionally several times.
     *
     * @param {number} times - how many steps to take.
     * @returns {number} the updated value.
     */
    tick(times = 1) {
        for (let i = 0; i < times; i += 1) {
            this._value += this._step;
        }
        return this._value;
    }

    /**
     * @param {number[]} values - starting values.
     * @returns {Counter[]} one counter per value.
     */
    static fromArray(values) {
        return values.map((value, index) => new Counter(`c${index}`, value));
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { Base, Counter };
}
