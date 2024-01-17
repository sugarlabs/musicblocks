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
     * @param {number|string} a - Preferably the minimum. If a string, it should be a valid solfege name.
     * @param {number|string} b - Preferably the maximum. If a string, it should be a valid solfege name.
     * @param {number} [c] - Octave (for cases when a and b are solfeges).
     * @returns {number|array} - A random number between a and b (both inclusive) or a random solfege array.
     * @throws {string} NAN error if the arguments are not valid.
     */
    static doRandom(a, b, c) {
        /**
         * Returns a random number between n1 and n2 (both inclusive).
         *
         * @param {number} n1
         * @param {number} n2
         * @returns {number}
         */
        const GetRandom = (n1, n2) => {
            // n1 should be <= n2
            [n1, n2] = n1 > n2 ? [n2, n1] : [n1, n2];
            return Math.floor(Math.random() * (Number(n2) - Number(n1) + 1) + Number(n1));
        };

        /**
         * Returns a random solfege array between a1 and a2 with the given octave.
         *
         * @param {string} a1
         * @param {string} a2
         * @param {number} [octave=4]
         * @returns {array} - A random solfege array.
         */
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
            n11 = broadScale.indexOf(a1 + " " + o1);
            n22 = broadScale.indexOf(a2 + " " + o2);

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
     * @param {*} a
     * @param {*} b
     * @returns {*} - Either a or b.
     */
    static doOneOf(a, b) {
        return Math.random() < 0.5 ? a : b;
    }

    /**
     * Returns a modulo b.
     *
     * @static
     * @param {number} a
     * @param {number} b
     * @returns {number} - Result of a modulo b.
     * @throws {string} NAN error if the arguments are not valid.
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
     * @param {number} a
     * @returns {number} - Square root of a.
     * @throws {string} No square root error, NAN error if the arguments are not valid.
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
     * @param {*} a
     * @param {*} b
     * @returns {number|string} - Sum of a and b. If either a or b is a string, it concatenates them.
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
     * @param {number} a
     * @param {number} b
     * @returns {number} - Result of a minus b.
     * @throws {string} NAN error if the arguments are not valid.
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
     * @param {*} a
     * @param {*} b
     * @returns {number} - Result of a multiplied by b.
     * @throws {string} NAN error if the arguments are not valid.
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
     * @param {number} a
     * @param {number} b
     * @returns {number} - Result of a divided by b.
     * @throws {string} Divide by Zero error, NAN error if the arguments are not valid.
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
     * Calculates Euclidean distance between (cursor x, cursor y) and (mouse 'x' and mouse 'y').
     *
     * @static
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {number} - Euclidean distance between two points.
     * @throws {string} NAN error if the arguments are not valid.
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
     * @param {number} a
     * @param {number} b
     * @returns {number} - Result of a raised to the power of b.
     * @throws {string} NAN error if the arguments are not valid.
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
     * @param {number} a
     * @returns {number} - Absolute value of a.
     * @throws {string} NAN error if the argument is not valid.
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
     * @returns {number|string} - Negative value of a (if number) or string in reverse (if string).
     * @throws {string} No Negation error if the argument is not valid.
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
     * @returns {number} - Integer value of a.
     * @throws {string} NAN error if the argument is not valid.
     */
    static doInt(a) {
        try {
            return Math.floor(Number(a) + 0.5);
        } catch (e) {
            throw "NanError";
        }
    }
}
