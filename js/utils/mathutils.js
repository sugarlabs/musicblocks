class MathUtility {
    /**
     * Returns a random integer in a range.
     *
     * @param a - preferably the minimum
     * @param b - preferably the maximum
     * @returns {Number}
     * @throws {String} NAN error
     */
    static doRandom(a, b) {
        /**
         * @param {Number} n1
         * @param {Number} n2
         * @returns {Number} a random number between n1 and n2 (both inclusive)
         */
        let GetRandom = (n1, n2) => {
            // n1 should be <= n2
            [n1, n2] = n1 > n2 ? [n2, n1] : [n1, n2];
            return Math.floor(Math.random() * (Number(n2) - Number(n1) + 1) + Number(n1));
        };

        if (typeof a === "number" && typeof b === "number") {
            return GetRandom(a, b);
        } else if (
            typeof a === "string" &&
            typeof b === "string" &&
            SOLFEGENAMES.indexOf(a) != -1 &&
            SOLFEGENAMES.indexOf(b) != -1
        ) {
            a = SOLFEGENAMES.indexOf(a);
            b = SOLFEGENAMES.indexOf(b);

            return SOLFEGENAMES[GetRandom(a, b)];
        } else {
            throw "NanError";
        }
    }

    /**
     * Randomly returns either a or b.
     *
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
     * @param a
     * @param b
     * @returns {Number|String}
     */
    static doPlus(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            let aString = typeof a === "string" ? a : a.toString();
            let bString = typeof b === "string" ? b : b.toString();

            return aString + bString;
        } else {
            return Number(a) + Number(b);
        }
    }

    /**
     * Subtracts b from a.
     *
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
}