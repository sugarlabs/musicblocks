/**
 * @file This contains the encapsulation related to math operations.
 * @author Walter Bender
 *
 * @copyright 2014-2020 Walter Bender
 * @copyright 2020 Anindya Kundu
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of
 * the The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/*
   global SOLFEGENAMES
 */

/*
   Global location
    js/utils/musicutils.js
        SOLFEGENAMES
 */

/* exported MathUtility */

/**
 * Utility class for managing math operations.
 *
 * @class
 * @classdesc This is the prototype that encapsulates the ten math operations: random, one-of,
 * modulus, square root, add, subtract, multiply, divide, eucleidean distance, and exponent.
 * The methods verify the input/s and return the operations' results or throws an exception if
 * the arguments are invalid, which is then handled by their callers, i.e. `arg` methods in
 * NumberBlocks.js
 */
class MathUtility {
    /**
     * Returns a random integer in a range.
     *
     * @static
     * @param a - preferably the minimum
     * @param b - preferably the maximum
     * @param c - octave (for case when a and b are solfeges)
     * @returns {Number}
     * @throws {String} NAN error
     */
    static doRandom(a, b, c) {
        /**
         * @param {Number} n1
         * @param {Number} n2
         * @returns {Number} a random number between n1 and n2 (both inclusive)
         */
        const GetRandom = (n1, n2) => {
            // n1 should be <= n2
            [n1, n2] = n1 > n2 ? [n2, n1] : [n1, n2];
            return Math.floor(Math.random() * (Number(n2) - Number(n1) + 1) + Number(n1));
        };

        const GetRandomSolfege = (a1, a2, octave) => {
            octave = octave === undefined ? 4 : octave;

            const broadScale = [];
            for (const i of [octave, octave + 1]) {
                for (let j = 0; j < SOLFEGENAMES.length; j++) {
                    broadScale.push(SOLFEGENAMES[j] + " " + i);
                }
            }

            const n1 = SOLFEGENAMES.indexOf(a1);
            const n2 = SOLFEGENAMES.indexOf(a2);
            const o1 = octave;
            const o2 = n1 > n2 ? octave + 1 : octave;

            let n11, n22;
            for (let i = 0; i < broadScale.length; i++) {
                n11 = broadScale.indexOf(a1 + " " + o1);
                n22 = broadScale.indexOf(a2 + " " + o2);
            }

            return broadScale[GetRandom(n11, n22)].split(" ");
        };

        if (typeof a === "number" && typeof b === "number") {
            return GetRandom(a, b);
        } else if (
            typeof a === "string" &&
            typeof b === "string" &&
            SOLFEGENAMES.indexOf(a) !== -1 &&
            SOLFEGENAMES.indexOf(b) !== -1
        ) {
            return GetRandomSolfege(a, b, c);
        } else {
            throw "NanError";
        }
    }

    /**
     * Randomly returns either a or b.
     *
     * @static
     * @param a
     * @param b
     * @returns {*}
     */
    static doOneOf(a, b) {
        return Math.random() < 0.5 ? a : b;
    }

    /**
     * Returns a modulo b.
     *
     * @static
     * @param a
     * @param b
     * @returns {Number}
     * @throws {String} NAN error
     */
    static doMod(a, b) {
        if (typeof a === "number" && typeof b === "number") {
            return Number(a) % Number(b);
        } else {
            throw "NanError";
        }
    }

    /**
     * Square-roots a number.
     *
     * @static
     * @param a
     * @returns {Number}
     * @throws {String} No square root error, NAN error
     */
    static doSqrt(a) {
        if (typeof a === "number") {
            if (a < 0) {
                throw "NoSqrtError";
            }

            return Math.sqrt(Number(a));
        } else {
            throw "NanError";
        }
    }

    /**
     * Adds a and b.
     *
     * @static
     * @param a
     * @param b
     * @returns {Number|String}
     */
    static doPlus(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            const aString = typeof a === "string" ? a : a.toString();
            const bString = typeof b === "string" ? b : b.toString();

            return aString + bString;
        } else {
            return Number(a) + Number(b);
        }
    }

    /**
     * Subtracts b from a.
     *
     * @static
     * @param a
     * @param b
     * @returns {Number}
     * @throws {String} NAN error
     */
    static doMinus(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            throw "NanError";
        }

        return Number(a) - Number(b);
    }

    /**
     * Multiplies a by b.
     *
     * @static
     * @param a
     * @param b
     * @returns {Number}
     * @throws {String} NAN error
     */
    static doMultiply(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            throw "NanError";
        }

        return Number(a) * Number(b);
    }

    /**
     * Divides a by b.
     *
     * @static
     * @param a
     * @param b
     * @returns {Number}
     * @throws {String} Divide by Zero error, NAN error
     */
    static doDivide(a, b) {
        if (typeof a === "number" && typeof b === "number") {
            if (Number(b) === 0) {
                throw "DivByZeroError";
            }

            return Number(a) / Number(b);
        } else {
            throw "NanError";
        }
    }

    /**
     * Calculates euclidean distance between (cursor x, cursor y) and (mouse 'x' and mouse 'y').
     *
     * @static
     * @param a
     * @param b
     * @param c
     * @param d
     * @returns {Number}
     * @throws {String} NAN error
     */
    static doCalculateDistance(x1, y1, x2, y2) {
        if (
            typeof x1 === "number" &&
            typeof y1 === "number" &&
            typeof x2 === "number" &&
            typeof y2 === "number"
        ) {
            if (x1 === x2 && y1 === y2) {
                return 0;
            }

            return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
        } else {
            throw "NanError";
        }
    }

    /**
     * Returns a to the power of b.
     *
     * @static
     * @param a
     * @param b
     * @returns {Number}
     * @throws {String} NAN error
     */
    static doPower(a, b) {
        if (typeof a === "number" && typeof b === "number") {
            return Math.pow(a, b);
        } else {
            throw "NanError";
        }
    }

    /**
     * Returns absolute value.
     *
     * @static
     * @param a
     * @returns {Number}
     * @throws {String} NAN error
     */
    static doAbs(a) {
        if (typeof a === "number") {
            return Math.abs(a);
        } else {
            throw "NanError";
        }
    }

    /**
     * Returns negative value (if number) or string in reverse (if string).
     *
     * @static
     * @param {*} a
     * @returns {Number|String}
     * @throws {String} No Negation error
     */
    static doNegate(a) {
        if (typeof a === "number") {
            return MathUtility.doMinus(0, a);
        } else if (typeof a === "string") {
            const obj = a.split("");
            return obj.reverse().join("");
        } else {
            throw "NoNegError";
        }
    }

    /**
     * Returns integer value.
     *
     * @static
     * @param {*} a
     * @returns {Number}
     * @throws {String} NAN error
     */
    static doInt(a) {
        try {
            return Math.floor(Number(a) + 0.5);
        } catch (e) {
            throw "NanError";
        }
    }
}
