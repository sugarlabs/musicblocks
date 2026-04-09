// Copyright (c) 2019 Bottersnike
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   _, ValueBlock, LeftBlock, NOINPUTERRORMSG, MathUtility,
   NANERRORMSG, toFixed2, NOSQRTERRORMSG, ZERODIVIDEERRORMSG,
   calcOctave
 */

/* exported setupNumberBlocks */

function setupNumberBlocks(activity) {
    /**
     * Check if block is in status matrix print context
     */
    const isInStatusMatrix = (logo, blk, fieldName) => {
        if (
            logo.inStatusMatrix &&
            activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                "print"
        ) {
            logo.statusFields.push([blk, fieldName]);
            return true;
        }
        return false;
    };

    /**
     * Safely convert string to integer with error handling
     */
    const toInteger = (logo, value, blk) => {
        if (typeof value === "string") {
            try {
                return parseInt(value);
            } catch (e) {
                logo.stopTurtle = true;
                activity.errorMsg(NANERRORMSG, blk);
                return null;
            }
        }
        return value;
    };

    /**
     * Handle math operation errors with standardized response
     */
    const handleMathError = (logo, error, blk, onError = NANERRORMSG) => {
        logo.stopTurtle = true;
        activity.errorMsg(onError, blk);
    };

    /**
     * Check if block is connected to a pitch block (for octave context)
     */
    const isPitchContext = cblk0 => {
        return cblk0 !== null && activity.blocks.blockList[cblk0].name === "pitch";
    };

    /**
     * Get octave value from parent pitch block
     */
    const getOctaveFromParent = cblk0 => {
        if (cblk0 === null) return undefined;
        let par = activity.blocks.blockList[cblk0];
        while (par.name === "hspace") {
            par = activity.blocks.blockList[par.connections[0]];
        }
        return par.name === "pitch"
            ? activity.blocks.blockList[par.connections[2]].value
            : undefined;
    };

    /**
     * Calculate value with octave handling if in pitch context
     */
    const calculateValueWithOctave = (logo, turtle, cblk, blk, receivedArg, isOctaveValue) => {
        const cblk0 = activity.blocks.blockList[blk].connections[0];

        if (isOctaveValue && isPitchContext(cblk0)) {
            const noteBlock = activity.blocks.blockList[cblk0].connections[1];
            const tur = activity.turtles.ithTurtle(turtle);

            if (typeof activity.blocks.blockList[cblk].value === "string") {
                return calcOctave(
                    tur.singer.currentOctave,
                    activity.blocks.blockList[cblk].value,
                    tur.singer.lastNotePlayed,
                    activity.blocks.blockList[noteBlock].value
                );
            }
        }
        return logo.parseArg(logo, turtle, cblk, blk, receivedArg);
    };

    /**
     * Validate required connections are present
     */
    const validateConnections = (connections, blk) => {
        for (const conn of connections) {
            if (conn === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
        }
        return true;
    };

    /**
     * Handle single input argument validation and parsing
     */
    const getValidatedArg = (logo, turtle, cblk, blk, receivedArg, fieldName) => {
        if (!validateConnections([cblk], blk)) {
            return null;
        }
        return logo.parseArg(logo, turtle, cblk, blk, receivedArg);
    };

    /**
     * Process two arguments with octave context handling
     */
    const processTwoArguments = (
        logo,
        turtle,
        cblk1,
        cblk2,
        blk,
        receivedArg,
        isOctaveContext = false
    ) => {
        if (!validateConnections([cblk1, cblk2], blk)) {
            if (cblk1 !== null) {
                return { a: logo.parseArg(logo, turtle, cblk1, blk, receivedArg), b: null };
            }
            return { a: null, b: null };
        }

        let a = calculateValueWithOctave(logo, turtle, cblk1, blk, receivedArg, isOctaveContext);
        a = toInteger(logo, a, blk) || a;

        let b = calculateValueWithOctave(logo, turtle, cblk2, blk, receivedArg, isOctaveContext);
        b = toInteger(logo, b, blk) || b;

        return { a, b };
    };

    class IntBlock extends LeftBlock {
        constructor() {
            super("int");
            this.setPalette("number", activity);
            this.setHelpString([_("The Int block returns an integer."), "documentation", ""]);

            this.formBlock({
                name: _("int"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [100]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            if (isInStatusMatrix(logo, blk, "int")) return 0;

            const cblk = activity.blocks.blockList[blk].connections[1];
            const a = getValidatedArg(logo, turtle, cblk, blk, receivedArg, "int");

            if (a === null) return 0;

            try {
                return MathUtility.doInt(a);
            } catch (e) {
                handleMathError(logo, e, blk);
                return 0;
            }
        }
    }

    class ModBlock extends LeftBlock {
        constructor() {
            super("mod");
            this.setPalette("number", activity);
            this.setHelpString([
                _("The Mod block returns the remainder from a division."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("mod"),
                args: 2,
                defaults: [100, 12]
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (isInStatusMatrix(logo, blk, "mod")) return 0;

            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            if (!validateConnections([cblk1, cblk2], blk)) return 0;

            let a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            a = toInteger(logo, a, blk);
            if (a === null) return 0;

            let b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            b = toInteger(logo, b, blk);
            if (b === null) return 0;

            try {
                return MathUtility.doMod(a, b);
            } catch (e) {
                handleMathError(logo, e, blk);
                return 0;
            }
        }
    }

    class PowerBlock extends LeftBlock {
        constructor() {
            super("power");
            this.setPalette("number", activity);
            this.setHelpString([
                _("The Power block calculates a power function."),
                "documentation",
                ""
            ]);

            // Allow searching this block by common math terms, not just the '^' symbol.
            this.extraSearchTerms = ["power", "exponent", "raise to power", "to the power"];

            this.fontsize = 14;
            this.formBlock({
                name: "^",
                args: 2,
                defaults: [2, 4]
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (isInStatusMatrix(logo, blk, "power")) return 0;

            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return cblk1 !== null ? logo.parseArg(logo, turtle, cblk1, blk, receivedArg) : 0;
            }

            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);

            try {
                return MathUtility.doPower(a, b);
            } catch (e) {
                handleMathError(logo, e, blk);
                return 0;
            }
        }
    }

    class SqrtBlock extends LeftBlock {
        constructor() {
            super("sqrt");
            this.setPalette("number", activity);
            this.setHelpString([_("The Sqrt block returns the square root."), "documentation", ""]);

            this.formBlock({
                name: _("sqrt"),
                args: 1,
                defaults: [64]
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (isInStatusMatrix(logo, blk, activity.blocks.blockList[blk].name)) return 0;

            const cblk = activity.blocks.blockList[blk].connections[1];
            const a = getValidatedArg(logo, turtle, cblk, blk, receivedArg);

            if (a === null) return 0;

            try {
                return MathUtility.doSqrt(a);
            } catch (e) {
                logo.stopTurtle = true;
                if (e === "NanError") {
                    activity.errorMsg(NANERRORMSG, blk);
                } else if (e === "NoSqrtError") {
                    activity.errorMsg(NOSQRTERRORMSG, blk);
                    return MathUtility.doSqrt(-a);
                }
                return 0;
            }
        }
    }

    class AbsBlock extends LeftBlock {
        constructor() {
            super("abs");
            this.setPalette("number", activity);
            this.setHelpString([
                _("The Abs block returns the absolute value."),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("abs"),
                args: 1
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (isInStatusMatrix(logo, blk, activity.blocks.blockList[blk].name)) return 0;

            const cblk = activity.blocks.blockList[blk].connections[1];
            const a = getValidatedArg(logo, turtle, cblk, blk, receivedArg);

            if (a === null) return 0;

            try {
                return MathUtility.doAbs(a);
            } catch (e) {
                handleMathError(logo, e, blk);
                return 0;
            }
        }
    }

    class DistanceBlock extends LeftBlock {
        constructor() {
            super("distance");
            this.setPalette("number", activity);
            this.setHelpString([
                _(
                    "The Distance block returns the distance between two points. For example, between the mouse and the center of the screen."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("distance"),
                args: 4,
                defaults: [0, 0, 100, 100],
                argTypes: ["anyin", "anyin", "anyin", "anyin"],
                outType: "anyout",
                argLabels: ["x1", "y1", "x2", "y2"]
            });

            this.makeMacro((x, y) => [
                [0, "distance", x, y, [null, 1, 2, 3, 4]],
                [1, ["number", { value: 0 }], 0, 0, [0]],
                [2, ["number", { value: 0 }], 0, 0, [0]],
                [3, "x", 0, 0, [0]],
                [4, "y", 0, 0, [0]]
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (isInStatusMatrix(logo, blk, "distance")) return 0;

            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];
            const cblk3 = activity.blocks.blockList[blk].connections[3];
            const cblk4 = activity.blocks.blockList[blk].connections[4];

            if (!validateConnections([cblk1, cblk2, cblk3, cblk4], blk)) return 0;

            const x1 = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const y1 = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            const x2 = logo.parseArg(logo, turtle, cblk3, blk, receivedArg);
            const y2 = logo.parseArg(logo, turtle, cblk4, blk, receivedArg);

            try {
                return MathUtility.doCalculateDistance(x1, y1, x2, y2);
            } catch (e) {
                activity.errorMsg(NANERRORMSG, blk);
                return 0;
            }
        }
    }

    class DivideBlock extends LeftBlock {
        constructor() {
            super("divide");
            this.setPalette("number", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Divide block is used to divide."),
                "documentation",
                null,
                "note1"
            ]);

            this.extraSearchTerms = ["divide", "division"];

            this.fontsize = 9;
            this.formBlock({
                name: this.lang === "ja" ? "➗" : "/",
                args: 2,
                argTypes: ["anyin", "anyin"],
                defaults: [1, 4]
            });
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk, receivedArg) {
            if (isInStatusMatrix(logo, blk, "divide")) return 0;

            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return cblk1 !== null ? logo.parseArg(logo, turtle, cblk1, blk, receivedArg) : 0;
            }

            let a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            a = toInteger(logo, a, blk);
            if (a === null) return 0;

            let b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            b = toInteger(logo, b, blk);
            if (b === null) return 0;

            try {
                return MathUtility.doDivide(a, b);
            } catch (e) {
                logo.stopTurtle = true;
                if (e === "NanError") {
                    activity.errorMsg(NANERRORMSG, blk);
                } else if (e === "DivByZeroError") {
                    activity.errorMsg(ZERODIVIDEERRORMSG, blk);
                }
                return 0;
            }
        }
    }

    class MultiplyBlock extends LeftBlock {
        constructor() {
            super("multiply");
            this.setPalette("number", activity);
            this.beginnerBlock(true);

            this.setHelpString([_("The Multiply block is used to multiply."), "documentation", ""]);

            this.extraSearchTerms = ["multiply", "product", "times"];

            this.fontsize = 14;
            this.formBlock({
                name: "×",
                args: 2,
                argTypes: ["anyin", "anyin"],
                defaults: [1, 12]
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (isInStatusMatrix(logo, blk, "multiply")) return 0;

            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                if (cblk1 !== null) {
                    return logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                } else if (cblk2 !== null) {
                    return logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                } else {
                    return 0;
                }
            }

            const cblk0 = activity.blocks.blockList[blk].connections[0];
            let a, b;

            if (isPitchContext(cblk0)) {
                const noteBlock = activity.blocks.blockList[cblk0].connections[1];
                const tur = activity.turtles.ithTurtle(turtle);

                a =
                    typeof activity.blocks.blockList[cblk1].value === "string"
                        ? calcOctave(
                              tur.singer.currentOctave,
                              activity.blocks.blockList[cblk1].value,
                              tur.singer.lastNotePlayed,
                              activity.blocks.blockList[noteBlock].value
                          )
                        : logo.parseArg(logo, turtle, cblk1, blk, receivedArg);

                b =
                    typeof activity.blocks.blockList[cblk2].value === "string"
                        ? calcOctave(
                              tur.singer.currentOctave,
                              activity.blocks.blockList[cblk2].value,
                              tur.singer.lastNotePlayed,
                              activity.blocks.blockList[noteBlock].value
                          )
                        : logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            } else {
                a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                a = toInteger(logo, a, blk);
                if (a === null) return 0;

                b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                b = toInteger(logo, b, blk);
                if (b === null) return 0;
            }

            try {
                return MathUtility.doMultiply(a, b);
            } catch (e) {
                handleMathError(logo, e, blk);
                return 0;
            }
        }
    }

    class NegBlock extends LeftBlock {
        constructor() {
            super("neg");
            this.setPalette("number", activity);
            this.setHelpString();

            this.fontsize = 14;
            this.formBlock({
                name: "–",
                args: 1,
                argTypes: ["anyin"],
                outType: "numberout"
            });
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk, receivedArg) {
            if (isInStatusMatrix(logo, blk, "neg")) return 0;

            const cblk = activity.blocks.blockList[blk].connections[1];

            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }

            let a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            a = toInteger(logo, a, blk);
            if (a === null) return 0;

            try {
                return MathUtility.doNegate(a);
            } catch {
                return a;
            }
        }
    }

    class MinusBlock extends LeftBlock {
        constructor() {
            super("minus");
            this.setPalette("number", activity);
            this.beginnerBlock(true);

            this.setHelpString([_("The Minus block is used to subtract."), "documentation", ""]);

            // Make this block discoverable by common subtraction terms.
            this.extraSearchTerms = ["minus", "subtract", "subtraction", "difference", "negative"];

            this.fontsize = 14;
            this.formBlock({
                name: "–",
                args: 2,
                defaults: [8, 4],
                argTypes: ["anyin", "anyin"]
            });
        }

        updateParameter(logo, turtle, blk) {
            return toFixed2(activity.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (isInStatusMatrix(logo, blk, "minus")) return 0;

            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                if (cblk1 !== null) {
                    return logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                } else if (cblk2 !== null) {
                    return -1 * logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                } else {
                    return 0;
                }
            }

            const cblk0 = activity.blocks.blockList[blk].connections[0];
            let a, b;

            if (isPitchContext(cblk0)) {
                const noteBlock = activity.blocks.blockList[cblk0].connections[1];
                const tur = activity.turtles.ithTurtle(turtle);

                a =
                    typeof activity.blocks.blockList[cblk1].value === "string"
                        ? calcOctave(
                              tur.singer.currentOctave,
                              activity.blocks.blockList[cblk1].value,
                              tur.singer.lastNotePlayed,
                              activity.blocks.blockList[noteBlock].value
                          )
                        : logo.parseArg(logo, turtle, cblk1, blk, receivedArg);

                b =
                    typeof activity.blocks.blockList[cblk2].value === "string"
                        ? calcOctave(
                              tur.singer.currentOctave,
                              activity.blocks.blockList[cblk2].value,
                              tur.singer.lastNotePlayed,
                              activity.blocks.blockList[noteBlock].value
                          )
                        : logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            } else {
                a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                a = toInteger(logo, a, blk);
                if (a === null) return 0;

                b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                b = toInteger(logo, b, blk);
                if (b === null) return 0;
            }

            try {
                return MathUtility.doMinus(a, b);
            } catch (e) {
                handleMathError(logo, e, blk);
                return 0;
            }
        }
    }

    class PlusBlock extends LeftBlock {
        constructor() {
            super("plus");
            this.setPalette("number", activity);
            this.beginnerBlock(true);

            this.setHelpString([_("The Plus block is used to add."), "documentation", ""]);

            // Make this block discoverable by common addition terms.
            this.extraSearchTerms = ["plus", "add", "addition", "sum", "increment"];

            this.fontsize = 14;
            this.formBlock({
                name: "+",
                outType: "anyout",
                args: 2,
                defaults: [2, 2],
                argTypes: ["anyin", "anyin"]
            });
        }

        updateParameter(logo, turtle, blk) {
            if (typeof activity.blocks.blockList[blk].value === "string") {
                return activity.blocks.blockList[blk].value;
            } else {
                return toFixed2(activity.blocks.blockList[blk].value);
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            if (isInStatusMatrix(logo, blk, "plus")) return 0;

            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                if (cblk1 !== null) {
                    return logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                } else if (cblk2 !== null) {
                    return logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                } else {
                    return 0;
                }
            }

            const cblk0 = activity.blocks.blockList[blk].connections[0];
            let a, b;

            if (isPitchContext(cblk0)) {
                if (activity.blocks.blockList[cblk2].name === "accidentalname") {
                    let scaledegree;
                    if (activity.blocks.blockList[cblk1].name === "namedbox") {
                        scaledegree = logo.boxes[activity.blocks.blockList[cblk1].overrideName];
                    } else {
                        scaledegree = activity.blocks.blockList[cblk1].value;
                    }

                    let attr = activity.blocks.blockList[cblk2].value.split(" ");
                    attr = attr[attr.length - 1];
                    scaledegree += attr;

                    return scaledegree;
                } else {
                    const noteBlock = activity.blocks.blockList[cblk0].connections[1];
                    const tur = activity.turtles.ithTurtle(turtle);

                    a =
                        typeof activity.blocks.blockList[cblk1].value === "string"
                            ? calcOctave(
                                  tur.singer.currentOctave,
                                  activity.blocks.blockList[cblk1].value,
                                  tur.singer.lastNotePlayed,
                                  activity.blocks.blockList[noteBlock].value
                              )
                            : logo.parseArg(logo, turtle, cblk1, blk, receivedArg);

                    b =
                        typeof activity.blocks.blockList[cblk2].value === "string"
                            ? calcOctave(
                                  tur.singer.currentOctave,
                                  activity.blocks.blockList[cblk2].value,
                                  tur.singer.lastNotePlayed,
                                  activity.blocks.blockList[noteBlock].value
                              )
                            : logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                }
            } else {
                a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            }

            if (!isNaN(a) && !isNaN(b)) {
                return MathUtility.doPlus(a, b);
            } else {
                try {
                    return MathUtility.doPlus(a, b);
                } catch (e) {
                    activity.errorMsg(NOINPUTERRORMSG, blk);
                    // eslint-disable-next-line no-console
                    console.debug(a + " " + b);
                    // eslint-disable-next-line no-console
                    console.debug(e);
                    if (!isNaN(a)) {
                        return a;
                    } else if (!isNaN(b)) {
                        return b;
                    }
                    return 0;
                }
            }
        }
    }

    class OneOfBlock extends LeftBlock {
        constructor() {
            super("oneOf");
            this.setPalette("number", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The One-of block returns one of two choices."),
                "documentation",
                null,
                "oneofhelp"
            ]);

            this.formBlock({
                name: _("one of"),
                args: 2,
                argLabels: [_("this"), _("that")],
                outType: "anyout",
                argTypes: ["anyin", "anyin"],
                defaults: [-90, 90]
            });

            this.makeMacro((x, y) => [
                [0, "oneOf", x, y, [null, 1, 2, null]],
                [1, ["number", { value: 0 }], 0, 0, [0]],
                [2, ["number", { value: 1 }], 0, 0, [0]]
            ]);
        }

        updateParameter(logo, turtle, blk) {
            if (typeof activity.blocks.blockList[blk].value === "string") {
                return activity.blocks.blockList[blk].value;
            } else {
                return toFixed2(activity.blocks.blockList[blk].value);
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            let a, b;
            if (cblk1 !== null) {
                a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            }
            if (cblk2 !== null) {
                b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            }

            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                if (cblk1 !== null) {
                    return a;
                } else if (cblk2 !== null) {
                    return b;
                } else {
                    return 0;
                }
            }

            return MathUtility.doOneOf(a, b);
        }
    }

    class RandomBlock extends LeftBlock {
        constructor() {
            super("random");
            this.setPalette("number", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Random block returns a random number."),
                "documentation",
                null,
                "randomhelp"
            ]);

            this.formBlock({
                name: _("random"),
                args: 2,
                argLabels: [_("min"), _("max")],
                argTypes: ["anyin", "anyin"],
                defaults: [0, 12]
            });
        }

        updateParameter(logo, turtle, blk) {
            if (typeof activity.blocks.blockList[blk].value === "string") {
                return activity.blocks.blockList[blk].value;
            } else {
                return toFixed2(activity.blocks.blockList[blk].value);
            }
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk0 = activity.blocks.blockList[blk].connections[0];
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            if (!validateConnections([cblk1, cblk2], blk)) return 0;

            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            const octave = getOctaveFromParent(cblk0);

            try {
                if (octave === undefined) {
                    const randomResult = MathUtility.doRandom(a, b, octave);
                    return typeof randomResult === "object" ? randomResult[0] : randomResult;
                } else {
                    return MathUtility.doRandom(a, b, octave);
                }
            } catch (e) {
                handleMathError(logo, e, blk);
                return 0;
            }
        }
    }

    class NumberBlock extends ValueBlock {
        constructor() {
            super("number", _("number"));
            this.setPalette("number", activity);
            this.beginnerBlock(true);

            this.setHelpString([_("The Number block holds a number."), "documentation", ""]);
        }

        arg(logo, turtle, blk) {
            try {
                return Number(activity.blocks.blockList[blk].value);
            } catch (e) {
                console.debug(e);
                return 0;
            }
        }
    }

    new DistanceBlock().setup(activity);
    new IntBlock().setup(activity);
    new ModBlock().setup(activity);
    new PowerBlock().setup(activity);
    new SqrtBlock().setup(activity);
    new AbsBlock().setup(activity);
    new DivideBlock().setup(activity);
    new MultiplyBlock().setup(activity);
    new NegBlock().setup(activity);
    new MinusBlock().setup(activity);
    new PlusBlock().setup(activity);
    new OneOfBlock().setup(activity);
    new RandomBlock().setup(activity);
    new NumberBlock().setup(activity);
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { setupNumberBlocks };
}
