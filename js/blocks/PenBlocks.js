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

   _, ValueBlock, NOINPUTERRORMSG, NANERRORMSG, last, FlowBlock,
   FlowClampBlock, toFixed2, DEFAULTFONT,
 */

/* exported setupPenBlocks */

function setupPenBlocks(activity) {
    /**
     * Represents a PurpleBlock, extending the FlowBlock class.
     */
    class PurpleBlock extends FlowBlock {
        /**
         * Constructor for creating a PurpleBlock.
         */
        constructor() {
            super("purple", _("purple"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Set the help string.
            this.setHelpString();
            // Define a macro for the PurpleBlock.
            this.makeMacro((x, y) => [
                [0, "setcolor", x, y, [null, 1, null]],
                [1, ["number", { value: 90 }], 0, 0, [0]]
            ]);
        }
    }

    /**
     * Constructor for creating a BlueBlock.
     */
    class BlueBlock extends FlowBlock {
        constructor() {
            super("blue", _("blue"));
            this.setPalette("pen", activity);
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setcolor", x, y, [null, 1, null]],
                [1, ["number", { value: 70 }], 0, 0, [0]]
            ]);
        }
    }

    /**
     * Constructor for creating a GreenBlock.
     */
    class GreenBlock extends FlowBlock {
        constructor() {
            super("green", _("green"));
            this.setPalette("pen", activity);
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setcolor", x, y, [null, 1, null]],
                [1, ["number", { value: 40 }], 0, 0, [0]]
            ]);
        }
    }

    /**
     * Constructor for creating a YellowBlock.
     */
    class YellowBlock extends FlowBlock {
        constructor() {
            super("yellow", _("yellow"));
            this.setPalette("pen", activity);
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setcolor", x, y, [null, 1, null]],
                [1, ["number", { value: 20 }], 0, 0, [0]]
            ]);
        }
    }

    /**
     * Constructor for creating a OrangeBlock.
     */
    class OrangeBlock extends FlowBlock {
        constructor() {
            super("orange", _("orange"));
            this.setPalette("pen", activity);
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setcolor", x, y, [null, 1, null]],
                [1, ["number", { value: 10 }], 0, 0, [0]]
            ]);
        }
    }

    /**
     * Constructor for creating a RedBlock.
     */
    class RedBlock extends FlowBlock {
        constructor() {
            super("red", _("red"));
            this.setPalette("pen", activity);
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setcolor", x, y, [null, 1, null]],
                [1, ["number", { value: 0 }], 0, 0, [0]]
            ]);
        }
    }

    /**
     * Constructor for creating a WhiteBlock.
     */
    class WhiteBlock extends FlowBlock {
        constructor() {
            super("white", _("white"));
            this.setPalette("pen", activity);
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setshade", x, y, [null, 1, null]],
                [1, ["number", { value: 100 }], 0, 0, [0]]
            ]);
        }
    }

    /**
     * Constructor for creating a BlackBlock.
     */
    class BlackBlock extends FlowBlock {
        constructor() {
            super("black", _("black"));
            this.setPalette("pen", activity);
            this.setHelpString();

            this.makeMacro((x, y) => [
                [0, "setshade", x, y, [null, 1, null]],
                [1, ["number", { value: 0 }], 0, 0, [0]]
            ]);
        }
    }

    /**
     * Represents a BeginFillBlock, which extends the FlowBlock class.
     */
    class BeginFillBlock extends FlowBlock {
        /**
         * Constructor for creating a BeginFillBlock.
         */
        constructor() {
            super("beginfill", _("begin fill"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Set the help string.
            this.setHelpString();
            // Indicates whether the block is hidden.
            this.hidden = true;
        }

        /**
         * The flow method for the BeginFillBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         */
        flow(args, logo, turtle) {
            activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle)).painter.doStartFill();
        }
    }

    /**
     * Represents a EndFillBlock, which extends the FlowBlock class.
     */
    class EndFillBlock extends FlowBlock {
        constructor() {
            super("endfill", _("end fill"));
            this.setPalette("pen", activity);
            this.setHelpString();
            this.hidden = true;
        }

        flow(args, logo, turtle) {
            activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle)).painter.doEndFill();
        }
    }

    /**
     * Represents a FillScreenBlock, which extends the FlowBlock class.
     */
    class FillScreenBlock extends FlowBlock {
        /**
         * Constructor for creating a FillScreenBlock.
         */
        constructor() {
            //.TRANS: set the background color
            super("fillscreen", _("background"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Set the help string.
            this.setHelpString();
            // Create a form block with 3 arguments.
            this.formBlock({
                args: 3
            });
            // Indicates whether the block is hidden.
            this.hidden = true;
        }

        /**
         * The flow method for the FillScreenBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         */
        flow(args, logo, turtle) {
            const requiredTurtle = activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle));
            if (args.length === 3) {
                const hue = requiredTurtle.painter.color;
                const value = requiredTurtle.painter.value;
                const chroma = requiredTurtle.painter.chroma;
                requiredTurtle.painter.doSetHue(args[0]);
                requiredTurtle.painter.doSetValue(args[1]);
                requiredTurtle.painter.doSetChroma(args[2]);
                activity.turtles.setBackgroundColor(activity.turtles.companionTurtle(turtle));
                requiredTurtle.painter.doSetHue(hue);
                requiredTurtle.painter.doSetValue(value);
                requiredTurtle.painter.doSetChroma(chroma);
                logo.svgOutput = "";
            }
        }
    }

    /**
     * Represents a GreyBlock, which extends the ValueBlock class.
     */
    class GreyBlock extends ValueBlock {
        /**
         * Constructor for creating a GreyBlock.
         */
        constructor() {
            super("grey", _("grey"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Indicates whether the block is a parameter.
            this.parameter = true;

            // Set the help string for the block.
            this.setHelpString([
                _("The Grey block returns the current pen grey value."),
                "documentation",
                ""
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @returns {number} The updated parameter value.
         */
        updateParameter(logo, turtle) {
            return toFixed2(
                activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle)).painter.chroma
            );
        }

        /**
         * Setter method to set the value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} value - The value to set.
         * @param {Object} turtle - The turtle object.
         */
        setter(logo, value, turtle) {
            const turtleObj = activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle));
            turtleObj.painter.doSetChroma(value);
        }

        /**
         * Argument method to get the argument value of the block.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         * @returns {number} The argument value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "grey"]);
            } else {
                return activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle)).painter
                    .chroma;
            }
        }
    }

    /**
     * Represents a ShadeBlock, which extends the ValueBlock class.
     */
    class ShadeBlock extends ValueBlock {
        /**
         * Constructor for creating a ShadeBlock.
         */
        constructor() {
            super("shade", _("shade"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Indicates whether the block is a parameter.
            this.parameter = true;
            // Set the help string for the block.
            this.setHelpString([
                _("The Shade block returns the current pen shade value."),
                "documentation",
                ""
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @returns {number} The updated parameter value.
         */
        updateParameter(logo, turtle) {
            return toFixed2(
                activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle)).painter.value
            );
        }

        /**
         * Setter method to set the value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} value - The value to set.
         * @param {Object} turtle - The turtle object.
         */
        setter(logo, value, turtle) {
            const turtleObj = activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle));
            turtleObj.painter.doSetValue(value);
        }

        /**
         * Argument method to get the argument value of the block.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         * @returns {number} The argument value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "shade"]);
            } else {
                return activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle)).painter
                    .value;
            }
        }
    }

    /**
     * Represents a ColorBlock, which extends the ValueBlock class.
     */
    class ColorBlock extends ValueBlock {
        /**
         * Constructor for creating a ColorBlock.
         */
        constructor() {
            super("color", _("color"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Marks the block as a beginner block.
            this.beginnerBlock(true);
            // Indicates whether the block is a parameter.
            this.parameter = true;

            // Set the help string for the block.
            this.setHelpString([
                _("The Color block returns the current pen color."),
                "documentation",
                ""
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @returns {number} The updated parameter value.
         */
        updateParameter(logo, turtle) {
            return toFixed2(
                activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle)).painter.color
            );
        }

        /**
         * Setter method to set the value of the block.
         * @param {Object} logo - The logo object.
         * @param {number} value - The value to set.
         * @param {Object} turtle - The turtle object.
         */
        setter(logo, value, turtle) {
            const turtleObj = activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle));
            turtleObj.painter.doSetColor(value);
        }

        /**
         * Argument method to get the argument value of the block.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         * @returns {number} The argument value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "color"]);
            } else {
                return activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle)).painter
                    .color;
            }
        }
    }

    /**
     * Represents a PenSizeBlock, which extends the ValueBlock class.
     */
    class PenSizeBlock extends ValueBlock {
        constructor() {
            super("pensize", _("pen size"));
            this.setPalette("pen", activity);
            this.parameter = true;
            this.setHelpString([
                _("The Pen size block returns the current pen size value."),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle) {
            return toFixed2(
                activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle)).painter.stroke
            );
        }

        setter(logo, value, turtle) {
            const turtleObj = activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle));
            turtleObj.painter.doSetPensize(value);
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "pensize"]);
            } else {
                return activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle)).painter
                    .stroke;
            }
        }
    }

    /**
     * Represents a SetFontBlock, which extends the FlowBlock class.
     */
    class SetFontBlock extends FlowBlock {
        /**
         * Constructor for creating a SetFontBlock.
         */
        constructor() {
            super("setfont", _("set font"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Set the help string for the block.
            this.setHelpString([
                _("The Set font block sets the font used by the Show block."),
                "documentation",
                ""
            ]);

            // Create a form block with 1 argument, default value DEFAULTFONT, and argument type "textin".
            this.formBlock({
                args: 1,
                defaults: [DEFAULTFONT],
                argTypes: ["textin"]
            });
        }

        /**
         * The flow method for the SetFontBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (typeof args[0] === "string") {
                activity.turtles.getTurtle(activity.turtles.companionTurtle(turtle)).painter.doSetFont(args[0]);
            }
        }
    }

    /**
     * Represents a BackgroundBlock, which extends the FlowBlock class.
     */
    class BackgroundBlock extends FlowBlock {
        /**
         * Constructor for creating a BackgroundBlock.
         */
        constructor() {
            super("background", _("background"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Marks the block as a beginner block.
            this.beginnerBlock(true);
            // Set the help string for the block.
            this.setHelpString([
                _("The Background block sets the window background color."),
                "documentation",
                ""
            ]);
        }

        /**
         * The flow method for the BackgroundBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         */
        flow(args, logo, turtle) {
            activity.turtles.setBackgroundColor(activity.turtles.companionTurtle(turtle));
            logo.svgOutput = "";
        }
    }

    /**
     * Represents a HollowLineBlock, which extends the FlowClampBlock class.
     */
    class HollowLineBlock extends FlowClampBlock {
        /**
         * Constructor for creating a HollowLineBlock.
         */
        constructor() {
            super("hollowline");
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Set the help string for the block.
            this.setHelpString([
                _("The Hollow line block creates a line with a hollow center."),
                "documentation",
                ""
            ]);

            // Create a form block with name "hollow line".
            this.formBlock({
                //.TRANS: draw a line logo has a hollow space down its center
                name: _("hollow line")
            });

            // Create a macro for the block.
            this.makeMacro((x, y) => [
                [0, "hollowline", x, y, [null, null, 1]],
                [1, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * The flow method for the HollowLineBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         * @returns {Array} An array with arguments and a flag.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === undefined) {
                // nothing to do
                return;
            }
            // Get the turtle object associated with the companion turtle.
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            // Push the block to the singer's embedded graphics if in a note block, otherwise start the hollow line.
            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doStartHollowLine();
            }

            // Set listener for the turtle.
            const listenerName = "_hollowline_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // Define the listener function.
            const __listener = () => {
                if (tur.singer.inNoteBlock.length > 0) {
                    tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                } else {
                    tur.painter.doEndHollowLine();
                }
            };

            // Set turtle listener.
            logo.setTurtleListener(turtle, listenerName, __listener);

            // Return arguments and a flag.
            return [args[0], 1];
        }
    }

    /**
     * Represents a FillBlock, which extends the FlowClampBlock class.
     */
    class FillBlock extends FlowClampBlock {
        /**
         * Constructor for creating a FillBlock.
         */
        constructor() {
            super("fill");
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Marks the block as a beginner block.
            this.beginnerBlock(true);

            // Set the help string for the block.
            this.setHelpString([
                _("The Fill block fills in a shape with a color."),
                "documentation",
                null,
                "fillhelp"
            ]);

            // Create a form block with name "fill".
            this.formBlock({
                //.TRANS: fill in as a solid color
                name: _("fill")
            });

            // Create a macro for the block.
            this.makeMacro((x, y) => [
                [0, "fill", x, y, [null, null, 1]],
                [1, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * The flow method for the FillBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         * @returns {Array} An array with arguments and a flag.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === undefined) {
                // nothing to do
                return;
            }

            // Get the turtle object associated with the companion turtle.
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            // Push the block to the singer's embedded graphics if in a note block, otherwise start the fill.
            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                if (tur.singer.suppressOutput) {
                    const savedPenState = tur.painter.penState;
                    tur.painter.penState = false;
                    tur.painter.doStartFill();
                    tur.painter.penState = savedPenState;
                } else {
                    tur.painter.doStartFill();
                }
            }

            // Set listener for the turtle.
            const listenerName = "_fill_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // Define the listener function.
            const __listener = () => {
                if (tur.singer.inNoteBlock.length > 0) {
                    tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
                } else {
                    if (tur.singer.suppressOutput) {
                        const savedPenState = tur.painter.penState;
                        tur.painter.penState = false;
                        tur.painter.doEndFill();
                        tur.painter.penState = savedPenState;
                    } else {
                        tur.painter.doEndFill();
                    }
                }
            };

            // Set turtle listener.
            logo.setTurtleListener(turtle, listenerName, __listener);

            // Return arguments and a flag.
            return [args[0], 1];
        }
    }

    /**
     * Represents a PenUpBlock, which extends the FlowBlock class.
     */
    class PenUpBlock extends FlowBlock {
        /**
         * Constructor for creating a PenUpBlock.
         */
        constructor() {
            //.TRANS: raise up the pen so logo it does not draw when it is moved
            super("penup", _("pen up"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Marks the block as a beginner block.
            this.beginnerBlock(true);
            // Set the help string for the block.
            this.setHelpString([
                _("The Pen-up block raises the pen so that it does not draw."),
                "documentation",
                ""
            ]);
        }

        /**
         * The flow method for the PenUpBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            // Get the turtle object associated with the companion turtle.
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            // Push the block to the singer's embedded graphics if in a note block, otherwise raise the pen.
            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doPenUp();
            }
        }
    }

    /**
     * Represents a PenDownBlock, which extends the FlowBlock class.
     */
    class PenDownBlock extends FlowBlock {
        /**
         * Constructor for creating a PenDownBlock.
         */
        constructor() {
            //.TRANS: put down the pen so logo it draws when it is moved
            super("pendown", _("pen down"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Marks the block as a beginner block.
            this.beginnerBlock(true);

            // Set the help string for the block.
            this.setHelpString([
                _("The Pen-down block lowers the pen so that it draws."),
                "documentation",
                ""
            ]);
        }

        /**
         * The flow method for the PenDownBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            // Get the turtle object associated with the companion turtle.
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            // Push the block to the singer's embedded graphics if in a note block, otherwise lower the pen.
            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doPenDown();
            }
        }
    }

    /**
     * Represents a SetPenSizeBlock, which extends the FlowBlock class.
     */
    class SetPenSizeBlock extends FlowBlock {
        /**
         * Constructor for creating a SetPenSizeBlock.
         */
        constructor() {
            //.TRANS: set the width of the line drawn by the pen
            super("setpensize", _("set pen size"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Define piemenu values for pen size.
            this.piemenuValuesC1 = [1, 2, 3, 5, 10, 15, 25, 50, 100];
            // Marks the block as a beginner block.
            this.beginnerBlock(true);

            // Set the help string for the block.
            this.setHelpString([
                _("The Set-pen-size block changes the size of the pen."),
                "documentation",
                ""
            ]);

            // Create a form block with one argument and default value 5.
            this.formBlock({
                args: 1,
                defaults: [5]
            });
        }

        /**
         * The flow method for the SetPenSizeBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                // If no arguments provided, display error message and return.
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            // Get the turtle object associated with the companion turtle.
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            if (typeof args[0] === "string") {
                // If argument is not a number, display error message and return.
                activity.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                // If in matrix mode, add block to phrase maker.
                logo.phraseMaker.addRowBlock(blk);
                if (!logo.pitchBlocks.includes(blk)) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                logo.phraseMaker.rowArgs.push(args[0]);
            } else if (tur.singer.inNoteBlock.length > 0) {
                // If in note block, push block to singer's embedded graphics.
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                // Otherwise, set pen size.
                tur.painter.doSetPensize(args[0]);
            }
        }
    }

    /**
     * Represents a SetTranslucencyBlock, which extends the FlowBlock class.
     */
    class SetTranslucencyBlock extends FlowBlock {
        /**
         * Constructor for creating a SetTranslucencyBlock.
         */
        constructor() {
            //.TRANS: set degree of translucence of the pen color
            super("settranslucency", _("set translucency"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Define piemenu values for translucency.
            this.piemenuValuesC1 = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

            // Set the help string for the block.
            this.setHelpString([
                _("The Set translucency block changes the opacity of the pen."),
                "documentation",
                ""
            ]);

            // Create a form block with one argument and default value 50.
            this.formBlock({
                args: 1,
                defaults: [50]
            });
        }

        /**
         * The flow method for the SetTranslucencyBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                // If no arguments provided, display error message and return.
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }
            // Get the turtle object associated with the companion turtle.
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (typeof args[0] === "string") {
                // If argument is not a number, display error message and return.
                activity.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                // If in matrix mode, add block to phrase maker.
                logo.phraseMaker.addRowBlock(blk);
                if (!logo.pitchBlocks.includes(blk)) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                logo.phraseMaker.rowArgs.push(args[0]);
            } else if (tur.singer.inNoteBlock.length > 0) {
                // If in note block, push block to singer's embedded graphics.
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                // Calculate alpha value and set pen translucency.
                const arg = args[0] % 101;
                const alpha = 1.0 - arg / 100;
                tur.painter.doSetPenAlpha(alpha);
            }
        }
    }

    /**
     * Represents a SetHueBlock, which extends the FlowBlock class.
     */
    class SetHueBlock extends FlowBlock {
        /**
         * Constructor for creating a SetHueBlock.
         */
        constructor() {
            super("sethue", _("set hue"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Define piemenu values for hue.
            this.piemenuValuesC1 = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];

            // Set the help string for the block.
            this.setHelpString([
                _("The Set hue block changes the color of the pen."),
                "documentation",
                ""
            ]);

            // Create a form block with one argument and default value 0.
            this.formBlock({
                args: 1,
                defaults: [0]
            });
        }

        /**
         * The flow method for the SetHueBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                // If no arguments provided, display error message and return.
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            // Get the turtle object associated with the companion turtle.
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            if (typeof args[0] === "string") {
                // If argument is not a number, display error message and return.
                activity.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                // If in matrix mode, add block to phrase maker.
                logo.phraseMaker.addRowBlock(blk);
                if (!logo.pitchBlocks.includes(blk)) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                logo.phraseMaker.rowArgs.push(args[0]);
            } else if (tur.singer.inNoteBlock.length > 0) {
                // If in note block, push block to singer's embedded graphics.
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                // Otherwise, set pen hue.
                tur.painter.doSetHue(args[0]);
            }
        }
    }

    /**
     * Represents a SetShadeBlock, which extends the FlowBlock class.
     */
    class SetShadeBlock extends FlowBlock {
        /**
         * Constructor for creating a SetShadeBlock.
         */
        constructor() {
            super("setshade", _("set shade"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Define piemenu values for shade selection.
            this.piemenuValuesC1 = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
            // Marks the block as a beginner block.
            this.beginnerBlock(true);

            // Set the help string for the block.
            this.setHelpString([
                _("The Set-shade block changes the pen color from dark to light."),
                "documentation",
                ""
            ]);

            // Create a form block with 1 argument, default value 50.
            this.formBlock({
                args: 1,
                defaults: [50]
            });
        }

        /**
         * The flow method for the SetShadeBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (typeof args[0] === "string") {
                activity.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.phraseMaker.addRowBlock(blk);
                if (!logo.pitchBlocks.includes(blk)) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                logo.phraseMaker.rowArgs.push(args[0]);
            } else if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doSetValue(args[0]);
            }
        }
    }

    /**
     * Represents a SetGreyBlock, which extends the FlowBlock class.
     */
    class SetGreyBlock extends FlowBlock {
        /**
         * Constructor for creating a SetGreyBlock.
         */
        constructor() {
            //.TRANS: set the level of vividness of the pen color
            super("setgrey", _("set grey"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Define piemenu values for grey level selection.
            this.piemenuValuesC1 = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];

            // Set the help string for the block.
            this.setHelpString([
                _("The Set grey block changes the vividness of the pen color."),
                "documentation",
                ""
            ]);

            // Create a form block with 1 argument, default value 100.
            this.formBlock({
                args: 1,
                defaults: [100]
            });
        }

        /**
         * The flow method for the SetGreyBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (typeof args[0] === "string") {
                activity.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.phraseMaker.addRowBlock(blk);
                if (!logo.pitchBlocks.includes(blk)) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                logo.phraseMaker.rowArgs.push(args[0]);
            } else if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doSetChroma(args[0]);
            }
        }
    }

    /**
     * Represents a SetColorBlock, which extends the FlowBlock class.
     */
    class SetColorBlock extends FlowBlock {
        /**
         * Constructor for creating a SetColorBlock.
         */
        constructor() {
            super("setcolor", _("set color"));
            // Set the palette for the pen activity.
            this.setPalette("pen", activity);
            // Define piemenu values for color selection.
            this.piemenuValuesC1 = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
            // Marks the block as a beginner block.
            this.beginnerBlock(true);

            // Set the help string for the block.
            this.setHelpString([
                _("The Set-color block changes the pen color."),
                "documentation",
                ""
            ]);

            // Create a form block with 1 argument, default value 0.
            this.formBlock({
                args: 1,
                defaults: [0]
            });
        }

        /**
         * The flow method for the SetColorBlock.
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (typeof args[0] === "string") {
                activity.errorMsg(NANERRORMSG, blk);
            } else if (logo.inMatrix) {
                logo.phraseMaker.addRowBlock(blk);
                if (!logo.pitchBlocks.includes(blk)) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                logo.phraseMaker.rowArgs.push(args[0]);
            } else if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.embeddedGraphics[last(tur.singer.inNoteBlock)].push(blk);
            } else {
                tur.painter.doSetColor(args[0]);
            }
        }
    }

    new PurpleBlock().setup(activity);
    new BlueBlock().setup(activity);
    new GreenBlock().setup(activity);
    new YellowBlock().setup(activity);
    new OrangeBlock().setup(activity);
    new RedBlock().setup(activity);
    new WhiteBlock().setup(activity);
    new BlackBlock().setup(activity);
    new BeginFillBlock().setup(activity);
    new EndFillBlock().setup(activity);
    new FillScreenBlock().setup(activity);
    new GreyBlock().setup(activity);
    new ShadeBlock().setup(activity);
    new ColorBlock().setup(activity);
    new PenSizeBlock().setup(activity);
    new SetFontBlock().setup(activity);
    new BackgroundBlock().setup(activity);
    new HollowLineBlock().setup(activity);
    new FillBlock().setup(activity);
    new PenDownBlock().setup(activity);
    new PenUpBlock().setup(activity);
    new SetPenSizeBlock().setup(activity);
    new SetTranslucencyBlock().setup(activity);
    new SetHueBlock().setup(activity);
    new SetShadeBlock().setup(activity);
    new SetGreyBlock().setup(activity);
    new SetColorBlock().setup(activity);
}
